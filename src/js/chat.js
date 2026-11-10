// "Ask Sabhi": a small assistant that answers from what is on this site. No server, no tracking.
const WA = "https://wa.me/923392925724";
const MAIL = "mailto:sabhiurrahman.work@gmail.com";

const KB = [
  { k: ["service", "do you do", "offer", "help", "build"], a: "Four things: secure Webflow, Framer or WordPress builds; a fixed-price no-code security check; Figma to website; and speed and SEO work. <a href=\"/services/\">See services</a>." },
  { k: ["price", "cost", "how much", "rate", "budget", "quote", "fee"], a: "It depends on pages, CMS and motion. After a short call Sabhi sends a fixed quote with the scope and the timeline, so there are no surprises." },
  { k: ["security check", "audit", "secure", "headers", "csp", "safe", "vulnerab", "hack"], a: "The no-code security check is a passive review of your live Webflow or Framer site: security headers and CSP, forms and spam protection, custom code and third-party scripts, exposed keys, and who has access. You get a short report with fixes in priority order. Nothing intrusive without written permission." },
  { k: ["long", "time", "timeline", "deadline", "fast", "week"], a: "It depends on the scope. You get a timeline with the quote, and a live staging link from day one so you can watch the site come together." },
  { k: ["edit", "cms", "team", "handover", "client-first", "lumos", "update"], a: "Yes. Sabhi builds with clean classes (Client-First or Lumos), components and CMS collections, then records a short handover video so your team can edit safely." },
  { k: ["where", "location", "country", "pakistan", "lahore", "timezone", "remote", "outside"], a: "Lahore, Pakistan (UTC+5). He works remotely with clients worldwide, with a few hours of overlap for calls." },
  { k: ["stack", "tool", "webflow", "framer", "wordpress", "gsap", "figma"], a: "Webflow first, then Framer and WordPress. Figma for design files, GSAP for motion, and a security pass on every launch." },
  { k: ["experience", "about", "who", "background", "years", "devziv"], a: "Senior Webflow Developer at Devziv, three years in Webflow (Pixo Developers, Infirix, Xerosol, Devziv), and studying cyber security (BS, The Superior University). <a href=\"/about/\">Full story</a>." },
  { k: ["available", "free", "hire", "start", "open"], a: "Open for projects right now. The quickest way is WhatsApp; replies come within a day, Monday to Saturday." },
  { k: ["contact", "email", "whatsapp", "call", "reach", "message"], a: `WhatsApp: <a href="${WA}" target="_blank" rel="noopener">message Sabhi</a> · Email: <a href="${MAIL}">sabhiurrahman.work@gmail.com</a>` },
];
const FALLBACK = `I don't have that one. Sabhi can answer directly: <a href="${WA}" target="_blank" rel="noopener">WhatsApp</a> or <a href="${MAIL}">email</a>.`;
const CHIPS = [["Services", "What services do you offer?"], ["How much?", "How much does a website cost?"], ["Security check", "What is in the security check?"]];

function answer(q) {
  const s = q.toLowerCase();
  let best = null, score = 0;
  for (const item of KB) {
    const n = item.k.reduce((acc, k) => acc + (s.includes(k) ? k.length : 0), 0);
    if (n > score) { score = n; best = item; }
  }
  return best ? best.a : FALLBACK;
}

export function initChat({ lenis }) {
  const panel = document.querySelector("[data-chat]");
  const openBtn = document.querySelector("[data-chat-open]");
  if (!panel || !openBtn) return;
  const log = panel.querySelector("[data-chat-log]");
  const chips = panel.querySelector("[data-chat-chips]");
  const form = panel.querySelector("[data-chat-form]");
  const input = form.querySelector("input");
  let started = false;

  const add = (html, who) => {
    const m = document.createElement("div");
    m.className = `msg msg--${who}`;
    if (who === "me") m.textContent = html; else m.innerHTML = html;
    log.append(m);
    log.scrollTop = log.scrollHeight;
    return m;
  };
  const ask = (q) => {
    if (!q.trim()) return;
    add(q.trim(), "me");
    const typing = add("<i></i><i></i><i></i>", "bot");
    typing.classList.add("msg--typing");
    setTimeout(() => { typing.remove(); add(answer(q), "bot"); }, 650);
  };

  const open = () => {
    panel.hidden = false;
    openBtn.setAttribute("aria-expanded", "true");
    if (!started) {
      started = true;
      add("Hi! I'm Sabhi's assistant. Ask about services, process or the stack.", "bot");
      for (const [label, q] of CHIPS) {
        const b = document.createElement("button");
        b.type = "button"; b.className = "chip"; b.textContent = label;
        b.addEventListener("click", () => ask(q));
        chips.append(b);
      }
      const wa = document.createElement("a");
      wa.className = "chip chip--wa"; wa.href = WA; wa.target = "_blank"; wa.rel = "noopener"; wa.textContent = "WhatsApp Sabhi";
      chips.append(wa);
    }
    panel.animate?.([{ opacity: 0, transform: "translateY(16px) scale(.97)" }, { opacity: 1, transform: "none" }], { duration: 380, easing: "cubic-bezier(.22,1,.36,1)" });
    if (matchMedia("(max-width: 899px)").matches) lenis?.stop();
    setTimeout(() => input.focus({ preventScroll: true }), 50);
  };
  const close = () => {
    panel.hidden = true;
    openBtn.setAttribute("aria-expanded", "false");
    lenis?.start();
    openBtn.focus();
  };

  openBtn.addEventListener("click", () => (panel.hidden ? open() : close()));
  panel.querySelector("[data-chat-close]").addEventListener("click", close);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !panel.hidden) close(); });
  form.addEventListener("submit", (e) => { e.preventDefault(); ask(input.value); input.value = ""; });
  log.setAttribute("data-lenis-prevent", "");
}
