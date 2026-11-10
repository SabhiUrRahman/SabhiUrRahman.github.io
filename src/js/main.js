import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { initNav } from "./nav.js";
import { initMotion } from "./motion.js";
import { initJourney } from "./journey.js";
import { initWork } from "./work.js";
import { initFaq } from "./faq.js";
import { initScan } from "./scan.js";
import { initChat } from "./chat.js";

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
  const navH = document.querySelector("[data-nav]")?.offsetHeight || 80;
  if (lenis) lenis.scrollTo(id === "#top" ? 0 : el, { offset: -(navH + 16), duration: 1.4 });
  else if (id === "#top") window.scrollTo(0, 0);
  else el.scrollIntoView();
});

// Lahore clock in the menu and footer
const clocks = document.querySelectorAll("[data-lahore-time]");
const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Karachi", hour: "2-digit", minute: "2-digit" });
const tick = () => clocks.forEach((c) => (c.textContent = fmt.format(new Date())));
if (clocks.length) { tick(); setInterval(tick, 30000); }

initNav({ lenis });
initMotion({ reduce });
initJourney({ reduce });
initWork({ reduce });
initFaq({ reduce });
initScan();
initChat({ lenis });

// fonts change line breaks: re-measure once they are in
document.fonts?.ready.then(() => ScrollTrigger.refresh());
