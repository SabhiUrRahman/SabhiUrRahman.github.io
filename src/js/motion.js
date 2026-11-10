import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Wraps every word of an element in a span, keeping <em> and <br> as they are.
function splitWords(el) {
  const words = [];
  const walk = (node) => {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === 3) {
        const frag = document.createDocumentFragment();
        for (const part of child.textContent.split(/(\s+)/)) {
          if (!part) continue;
          if (/^\s+$/.test(part)) { frag.append(part); continue; }
          const w = document.createElement("span");
          w.className = "w";
          w.style.display = "inline-block";
          w.textContent = part;
          frag.append(w);
          words.push(w);
        }
        child.replaceWith(frag);
      } else if (child.nodeType === 1 && child.tagName !== "BR" && !child.classList.contains("sr-only")) {
        walk(child);
      }
    }
  };
  walk(el);
  return words;
}

export function initMotion({ reduce }) {
  if (reduce) {
    document.querySelectorAll("[data-reveal], [data-load]").forEach((el) => (el.style.opacity = 1));
    return;
  }

  // cover: masthead letters rise, then the copy and the notes
  const mast = document.querySelector("[data-mast]");
  const intro = gsap.timeline({ defaults: { ease: "power3.out" }, delay: 0.1 });
  if (mast) {
    const letters = [...mast.textContent].map((c) => `<span style="display:inline-block">${c}</span>`).join("");
    mast.innerHTML = letters;
    intro.from(mast.children, { yPercent: 70, opacity: 0, duration: 1.2, stagger: 0.06 }, 0);
  }
  const load = gsap.utils.toArray("[data-load]");
  intro.to(load, { opacity: 1, y: 0, duration: 0.9, stagger: 0.07, startAt: { y: 18 } }, 0.35);
  const notes = gsap.utils.toArray(".note");
  if (notes.length) intro.fromTo(notes, { "--draw": 0 }, { "--draw": 1, duration: 1.1, stagger: 0.12, ease: "power2.inOut" }, 0.9);

  // headings: words rise in
  gsap.utils.toArray("[data-split]").forEach((el) => {
    const words = splitWords(el);
    gsap.from(words, {
      yPercent: 55, opacity: 0, duration: 1, ease: "power3.out", stagger: 0.035,
      scrollTrigger: { trigger: el, start: "top 85%", once: true },
    });
  });

  // the statement lights up word by word as you scroll
  gsap.utils.toArray("[data-words]").forEach((el) => {
    const words = splitWords(el);
    gsap.fromTo(words, { opacity: 0.14 }, {
      opacity: 1, ease: "none", stagger: 0.1,
      scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 45%", scrub: 0.6 },
    });
  });

  // blocks fade up as they enter
  ScrollTrigger.batch("[data-reveal]", {
    start: "top 90%",
    once: true,
    onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.08, startAt: { y: 24 } }),
  });

  // Fast. Found. Safe. slide up out of a mask
  gsap.utils.toArray("[data-rise]").forEach((el, i) => {
    gsap.fromTo(el, { clipPath: "inset(0 0 100% 0)", y: 60 }, {
      clipPath: "inset(0 0 -10% 0)", y: 0, duration: 1.1, ease: "power4.out", delay: i * 0.08,
      scrollTrigger: { trigger: el, start: "top 88%", once: true },
    });
  });

  // numbers count up
  gsap.utils.toArray("[data-count]").forEach((el) => {
    const end = Number(el.dataset.count), suffix = el.dataset.suffix || "", o = { v: 0 };
    gsap.to(o, {
      v: end, duration: 1.6, ease: "power2.out",
      scrollTrigger: { trigger: el, start: "top 90%", once: true },
      onUpdate: () => (el.textContent = Math.round(o.v) + suffix),
    });
  });

  // the about timeline draws itself
  gsap.utils.toArray("[data-line]").forEach((el) => {
    gsap.fromTo(el, { scaleX: 0 }, { scaleX: 1, ease: "none", scrollTrigger: { trigger: el, start: "top 90%", end: "top 45%", scrub: 0.6 } });
  });

  // soft parallax on the light blobs
  gsap.utils.toArray("section .glow, footer .glow").forEach((g) => {
    gsap.to(g, { yPercent: -18, ease: "none", scrollTrigger: { trigger: g.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
  });
}
