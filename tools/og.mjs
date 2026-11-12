// Share images (Open Graph / Twitter) for every page: 1200×630 JPG in public/og/<name>.jpg.
// Rendered in headless Chrome so the site's own fonts and avatar art are used; the page's H1 is the headline.
// usage: PUPPETEER=<file URL of puppeteer-core's ESM entry> node tools/og.mjs
// (puppeteer-core is not a dependency of the site; point PUPPETEER at any local install.)
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const puppeteer = (await import(process.env.PUPPETEER || "puppeteer-core")).default;
const ROOT = path.resolve(import.meta.dirname, "..");
const PUB = path.join(ROOT, "public");
const OUT = path.join(PUB, "og");
fs.mkdirSync(OUT, { recursive: true });
const url = (p) => pathToFileURL(path.join(PUB, p)).href;

// name, label, headline (plain, then the italic accent), avatar pose
const CARDS = [
  ["home", "[ 00 ] Portfolio", "Webflow & Framer sites, built fast and", "locked down.", "wave"],
  ["about", "[ 01 ] About", "From intern to senior", "in three years.", "fold"],
  ["services", "[ 02 ] Services", "Websites built to edit, and", "locked down.", "laptop"],
  ["work", "[ 03 ] Work", "Work you can open,", "code you can read.", "wave"],
  ["security", "[ 04 ] Security notes", "Notes on securing", "no-code websites.", "fold"],
  ["contact", "[ 05 ] Contact", "Got something", "worth building?", "wave"],
];

const html = ([, label, head, accent, pose]) => `<!doctype html><meta charset="utf-8"><style>
@font-face { font-family: "SG"; src: url("${url("fonts/space-grotesk-latin.woff2")}") format("woff2"); font-weight: 300 700; }
@font-face { font-family: "IS"; src: url("${url("fonts/instrument-serif-latin.woff2")}") format("woff2"); }
@font-face { font-family: "IS"; font-style: italic; src: url("${url("fonts/instrument-serif-latin-italic.woff2")}") format("woff2"); }
@font-face { font-family: "JB"; src: url("${url("fonts/jetbrains-mono-latin.woff2")}") format("woff2"); font-weight: 400 500; }
* { margin: 0; box-sizing: border-box; }
html, body { width: 1200px; height: 630px; overflow: hidden; }
body { background: #F5F2EC; color: #0B0B0C; font-family: "SG"; position: relative; }
.glow { position: absolute; right: 120px; top: 70px; width: 520px; height: 520px; border-radius: 50%; background: radial-gradient(closest-side, rgba(214,235,245,.85), rgba(214,235,245,0)); }
.grid { position: absolute; inset: 0; background-image: linear-gradient(#DDD5C7 1px, transparent 1px); background-size: 100% 105px; background-position: 0 52px; opacity: .55; }
.v { position: absolute; top: 0; bottom: 0; width: 1px; background: #DDD5C7; }
.label { font-family: "JB"; font-size: 17px; letter-spacing: .08em; text-transform: uppercase; color: #46433D; }
.top { position: absolute; left: 64px; right: 64px; top: 46px; display: flex; justify-content: space-between; }
h1 { position: absolute; left: 64px; top: 150px; width: 640px; font-weight: 500; font-size: 74px; line-height: 1.02; letter-spacing: -.035em; }
h1 em { font-family: "IS"; font-style: italic; font-weight: 400; color: #0F6B4C; letter-spacing: -.01em; font-size: 1.08em; }
.foot { position: absolute; left: 64px; bottom: 46px; }
.name { font-family: "IS"; font-size: 40px; letter-spacing: -.01em; }
.role { margin-top: 6px; }
.dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: #22C873; margin-right: 10px; transform: translateY(-1px); }
img { position: absolute; right: 70px; bottom: -40px; height: 640px; }
</style>
<div class="glow"></div><div class="grid"></div><div class="v" style="left:760px"></div>
<div class="top"><span class="label">${label}</span></div>
<h1>${head} <em>${accent}</em></h1>
<div class="foot"><p class="name">Syed Sabhi Ur Rahman</p><p class="label role"><span class="dot"></span>Webflow developer who secures no-code websites</p></div>
<img src="${url(`img/avatar/${pose}-1800.webp`)}" alt="">`;

const browser = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: "new", args: ["--allow-file-access-from-files"] });
const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
for (const card of CARDS) {
  const tmp = path.join(OUT, `_${card[0]}.html`);
  fs.writeFileSync(tmp, html(card));
  await page.goto(pathToFileURL(tmp).href, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(OUT, `${card[0]}.jpg`), type: "jpeg", quality: 88 });
  fs.unlinkSync(tmp);
  console.log("og", card[0], Math.round(fs.statSync(path.join(OUT, `${card[0]}.jpg`)).size / 1024) + " KB");
}
await browser.close();
