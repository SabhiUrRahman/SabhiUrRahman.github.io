import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { initNav } from "./nav.js";
import { initMotion } from "./motion.js";
import { initJourney } from "./journey.js";

window.__ssrReady = true;
const root = document.documentElement;
root.classList.add("js");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
root.classList.toggle("no-motion", reduce);
gsap.registerPlugin(ScrollTrigger);

// smooth scrolling (off for reduced motion)
let lenis = null;
if (!reduce) {
  lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

// in-page links go through the smooth scroller
document.addEventListener("click", (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute("href");
  const el = id === "#top" ? document.body : document.querySelector(id);
  if (!el) return;
  e.preventDefault();
  // room for the fixed header comes from scroll-padding-top in main.css, which Lenis reads as well
  if (lenis) lenis.scrollTo(id === "#top" ? 0 : el, { duration: 1.4 });
  else if (id === "#top") window.scrollTo(0, 0);
  else el.scrollIntoView();
  // keyboard and screen-reader users land where the link points, not just the scroll position
  const target = id === "#top" ? document.querySelector("main") || document.body : el;
  if (!target.hasAttribute("tabindex") && !target.matches("a, button, input, select, textarea")) target.setAttribute("tabindex", "-1");
  target.focus({ preventScroll: true });
});

// Lahore clock in the menu and footer
const clocks = document.querySelectorAll("[data-lahore-time]");
const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Karachi", hour: "2-digit", minute: "2-digit" });
const tick = () => clocks.forEach((c) => (c.textContent = fmt.format(new Date())));
if (clocks.length) { tick(); setInterval(tick, 30000); }

initNav({ lenis });
initMotion({ reduce });
initJourney({ reduce });

// Code that only some pages or moments need loads on its own, so the main file stays small.
if (document.querySelector("[data-work]")) import("./work.js").then((m) => m.initWork({ reduce }));
if (document.querySelector("[data-faq]")) import("./faq.js").then((m) => m.initFaq({ reduce }));

// the passive scan loads as its terminal comes near the screen
const scanBox = document.querySelector("[data-scan]");
if (scanBox) {
  new IntersectionObserver((entries, io) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    io.disconnect();
    import("./scan.js").then((m) => m.initScan());
  }, { rootMargin: "50% 0px" }).observe(scanBox);
}

// "Ask Sabhi" loads when someone reaches for the button; a click that comes first opens it once it is in
const fab = document.querySelector("[data-chat-open]");
if (fab) {
  let chat = null, ready = false;
  const load = () => (chat ||= import("./chat.js").then((m) => { ready = true; return m.initChat({ lenis }); }));
  fab.addEventListener("pointerenter", load, { once: true });
  fab.addEventListener("focus", load, { once: true });
  fab.addEventListener("click", () => { if (!ready) load().then((c) => c?.open()); }, { once: true });
}

// fonts change line breaks: re-measure once they are in
document.fonts?.ready.then(() => ScrollTrigger.refresh());
