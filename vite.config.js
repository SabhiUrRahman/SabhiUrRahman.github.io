import { defineConfig, normalizePath } from "vite";
import { resolve, join, relative } from "node:path";
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { execSync } from "node:child_process";

// The site's public address. Change it here (or build with SITE_URL=https://example.com) when a custom domain
// is added: canonicals, share images, structured data, sitemap.xml, robots.txt, llms.txt and security.txt follow,
// and a CNAME file is written for GitHub Pages.
const DEFAULT_ORIGIN = "https://sabhiurrahman.github.io";
const SITE = (process.env.SITE_URL || DEFAULT_ORIGIN).replace(/\/$/, "");

// Content Security Policy, added only to the production build (the dev server needs inline scripts).
// GitHub Pages cannot send custom headers, so the policy goes in a meta tag.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self' https://api.web3forms.com",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
  "upgrade-insecure-requests",
].join("; ");

const cspPlugin = () => ({
  name: "inject-csp",
  apply: "build",
  transformIndexHtml: {
    order: "pre",
    handler: (html) =>
      html.replace(
        '<meta charset="utf-8">',
        `<meta charset="utf-8">\n  <meta http-equiv="Content-Security-Policy" content="${CSP}">\n  <meta name="referrer" content="strict-origin-when-cross-origin">`
      ),
  },
});

// Shared HTML parts: <!-- @include name key="value" --> pulls in partials/name.html and fills {{key}}.
// The page's <body data-page="x"> marks its own nav links with aria-current="page".
const PARTIALS = resolve(import.meta.dirname, "partials");
const partialsPlugin = () => ({
  name: "html-partials",
  transformIndexHtml: {
    order: "pre",
    handler(html) {
      let out = html;
      // {{key}} takes the include's key="value"; {{key|fallback}} uses the fallback when the key is not given
      for (let i = 0; i < 4 && out.includes("<!-- @include"); i++) {
        out = out.replace(/<!-- @include ([\w-]+)((?:\s+[\w-]+="[^"]*")*)\s*-->/g, (_, name, attrs) => {
          const part = readFileSync(resolve(PARTIALS, `${name}.html`), "utf8");
          const vals = Object.fromEntries([...attrs.matchAll(/([\w-]+)="([^"]*)"/g)].map(([, k, v]) => [k, v]));
          return part.replace(/\{\{([\w-]+)(?:\|([^}]*))?\}\}/g, (m, k, fb) => vals[k] ?? fb ?? "").trimEnd();
        });
      }
      // a partial left without target: drop the empty attribute, and rel too unless the link opens a new tab
      out = out.replace(/ target="" rel="noopener"/g, "").replace(/ target=""/g, "");
      const page = out.match(/<body[^>]*data-page="([^"]+)"/)?.[1];
      if (page) out = out.replaceAll(`data-nav-link="${page}"`, `data-nav-link="${page}" aria-current="page"`);
      if (SITE !== DEFAULT_ORIGIN) out = out.replaceAll(DEFAULT_ORIGIN, SITE);
      return out;
    },
  },
  handleHotUpdate({ file, server }) {
    if (normalizePath(file).startsWith(normalizePath(PARTIALS))) server.ws.send({ type: "full-reload" });
  },
});

// After the build: sitemap.xml, robots.txt and llms.txt are written from the built pages themselves
// (indexable pages only, lastmod from git, titles and descriptions from each page's own meta tags).
const siteFilesPlugin = () => {
  let dist = resolve(import.meta.dirname, "dist");
  return {
  name: "site-files",
  apply: "build",
  configResolved(c) { dist = resolve(c.root, c.build.outDir); },
  closeBundle() {
    const walk = (dir) => readdirSync(dir).flatMap((f) => { const p = join(dir, f); return statSync(p).isDirectory() ? walk(p) : p.endsWith(".html") ? [p] : []; });
    const meta = (html, re) => (html.match(re)?.[1] || "").replace(/&amp;/g, "&").replace(/&#39;/g, "'").trim();
    const lastmod = (src) => { try { return execSync(`git log -1 --format=%cs -- "${src}"`, { cwd: import.meta.dirname }).toString().trim(); } catch { return ""; } };
    const today = new Date().toISOString().slice(0, 10);
    const pages = walk(dist)
      .map((file) => {
        const rel = relative(dist, file).split("\\").join("/");
        if (rel === "404.html") return null;
        const html = readFileSync(file, "utf8");
        if (/<meta name="robots" content="[^"]*noindex/.test(html)) return null;
        const path = rel === "index.html" ? "/" : "/" + rel.replace(/index\.html$/, "");
        return { path, title: meta(html, /<title>([^<]*)<\/title>/), desc: meta(html, /<meta name="description" content="([^"]*)"/), mod: lastmod(rel) || today };
      })
      .filter(Boolean)
      .sort((a, b) => a.path.split("/").length - b.path.split("/").length || a.path.localeCompare(b.path));

    const NL = "\n";
    writeFileSync(join(dist, "sitemap.xml"), [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...pages.map((p) => `  <url><loc>${SITE}${p.path}</loc><lastmod>${p.mod}</lastmod></url>`),
      "</urlset>",
      "",
    ].join(NL));
    writeFileSync(join(dist, "robots.txt"), ["User-agent: *", "Allow: /", "", `Sitemap: ${SITE}/sitemap.xml`, ""].join(NL));
    // llms.txt (llmstxt.org): a plain summary of the site for AI assistants, built from the same page metadata
    const home = pages.find((p) => p.path === "/");
    writeFileSync(join(dist, "llms.txt"), [
      "# Syed Sabhi Ur Rahman",
      "",
      `> ${home?.desc || ""}`,
      "",
      "Senior Webflow Developer at Devziv in Lahore, Pakistan (UTC+5), working with clients worldwide. Builds Webflow, Framer and WordPress websites and reviews no-code websites for security: headers, Content Security Policy, forms, third-party scripts and access. Studying for a BS in Cyber Security at The Superior University, Lahore.",
      "",
      "## Pages",
      "",
      ...pages.map((p) => `- [${p.title}](${SITE}${p.path}): ${p.desc}`),
      "",
      "## Contact",
      "",
      "- Email: sabhiurrahman.work@gmail.com",
      "- WhatsApp: https://wa.me/923392925724",
      "- LinkedIn: https://www.linkedin.com/in/syedsabhiurrehmanshah/",
      "- GitHub: https://github.com/SabhiUrRahman",
      "",
    ].join(NL));
    // security.txt keeps its canonical address on the live origin
    const sec = join(dist, ".well-known", "security.txt");
    if (existsSync(sec) && SITE !== DEFAULT_ORIGIN) writeFileSync(sec, readFileSync(sec, "utf8").replaceAll(DEFAULT_ORIGIN, SITE));
    if (SITE !== DEFAULT_ORIGIN) writeFileSync(join(dist, "CNAME"), new URL(SITE).host + NL);
  },
  };
};

// Every page is a folder with an index.html; pages are added here as they are built.
// Unfinished pages wait in drafts/ and are not built or published.
const PAGES = [
  "about",
  "services",
  "work",
  "security",
  "contact",
].filter((p) => existsSync(resolve(import.meta.dirname, p, "index.html")));

export default defineConfig({
  base: "/",
  plugins: [partialsPlugin(), cspPlugin(), siteFilesPlugin()],
  build: {
    target: "es2020",
    cssCodeSplit: true,
    modulePreload: { polyfill: false },
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, "index.html"),
        ...(existsSync(resolve(import.meta.dirname, "404.html")) ? { notFound: resolve(import.meta.dirname, "404.html") } : {}),
        ...Object.fromEntries(PAGES.map((p) => [p.replaceAll("/", "-"), resolve(import.meta.dirname, p, "index.html")])),
      },
    },
  },
});
