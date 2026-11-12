import { defineConfig, normalizePath } from "vite";
import { resolve } from "node:path";
import { readFileSync, existsSync } from "node:fs";

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
      return out;
    },
  },
  handleHotUpdate({ file, server }) {
    if (normalizePath(file).startsWith(normalizePath(PARTIALS))) server.ws.send({ type: "full-reload" });
  },
});

// Every page is a folder with an index.html; pages are added here as they are built.
const PAGES = [
  "about",
  "services",
  "services/security-check",
  "work",
  "work/case-template",
  "security",
  "security/webflow-security-headers",
  "contact",
].filter((p) => existsSync(resolve(import.meta.dirname, p, "index.html")));

export default defineConfig({
  base: "/",
  plugins: [partialsPlugin(), cspPlugin()],
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
