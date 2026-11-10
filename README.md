# sabhiurrahman.github.io · v2 (Ivory Noir)

Portfolio of Syed Sabhi Ur Rahman: a Webflow developer who secures no-code websites.
Design source: the Figma file "Sabhi Portfolio" (pages 00 Cover … 06 Motion).

## Stack
- Static HTML, CSS and JavaScript, bundled with Vite (pinned to 7.3.7 / Rollup 4.67.5: newer native Rollup builds are blocked by this PC's app-control policy)
- GSAP (ScrollTrigger) and Lenis for motion
- Fonts, self-hosted, Latin subset, OFL: Space Grotesk, Instrument Serif (regular + italic), JetBrains Mono
- GitHub Pages via GitHub Actions (`.github/workflows/deploy.yml`)

## Commands
```bash
npm install
npm run dev       # local dev server
npm run build     # production build in dist/
npm run preview   # serve the build
node tools/assets.mjs   # rebuild avatar WebPs, chat bust and grain from ../avatar-2d/hires
```

## How it is built
- `partials/`: shared HTML (`<!-- @include name key="value" -->`), see `vite.config.js`
- `src/styles/main.css`: tokens, then sections in page order. Desktop sizes follow the 1440 px design through `--u` (one design pixel, capped at 1600 px wide); phones follow the 390 px design.
- `src/js/journey.js`: the one 2D avatar that walks from section to section (fixed layer, `data-pose`, `[data-slot]` boxes or `data-place` screen spots, 0.9 s moves, 0.35 s pose cross-fades, idle float/breathe/tilt). Reduced motion turns it off and keeps the in-page pictures.
- `src/js/scan.js`: the terminal runs real, passive checks of the page in the visitor's browser (CSP meta, HTTPS, third-party scripts, referrer policy). Nothing is sent anywhere.
- `src/js/chat.js`: "Ask Sabhi" answers from the site's own content, no server.
- The Content Security Policy and referrer policy are added as meta tags at build time.

## Pages
- `/` Home · `/about/` · `/services/` · `/work/` · `/security/` · `/contact/` · `404.html`
- `/work/case-template/`: the layout for the first real case study (noindex, placeholders only)
- `/security/webflow-security-headers/`: draft note (noindex until its facts are verified)
- Page styles live in `src/styles/pages/<page>.css`; page scripts in `src/js/pages/` (work filters, contact clock + brief form)
- The contact form has no server: it builds the message and opens it in WhatsApp or the visitor's email app
- Figma specs used for the build: `../design/figma-spec-v2/` (with `BRIEF.md`)

## Images
Avatar poses are AI-upscaled 4x masters (`../avatar-2d/hires`), exported at 1800 and 900 px tall WebP, so they stay sharp on retina screens.
Still to make: sit, point and phone poses (see `../tools/README.md`).
