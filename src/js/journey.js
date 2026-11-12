// The avatar journey: one 2D Sabhi on a fixed, see-through layer that walks from section to section.
//
// Each section says where he goes:
//   data-pose="wave|fold|laptop"     which pose he takes there
//   a [data-slot] box inside it      he stands in that box and scrolls with the content
//   data-place="cx feet height"      desktop only, no slot: a spot on the screen (fractions of width / height)
//   data-flip                        mirrored (turns round)
// A section with no room for him (no slot, or its slot is hidden at this screen size, as on most
// phone sections) makes him step out past the nearest side of the screen instead of standing on the
// text; he walks back in at the next spot.
// The last section whose top has passed 55% of the screen wins. Moving between spots takes 0.9 s
// (power3.inOut); the pose cross-fades in 0.35 s with a small squash so it reads as a step.
// Idle: float ±6 px, breathe, tilt up to 3° toward the cursor. Reduced motion: no layer at all,
// the in-page pictures stay.

const MOVE_MS = 900, SWAP_MS = 350, SPLIT = 0.55, RECHECK_MS = 250;
const easeInOut = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
const easeOut = (p) => 1 - Math.pow(1 - p, 3);
const lerp = (a, b, t) => a + (b - a) * t;

export function initJourney({ reduce }) {
  const layer = document.querySelector("[data-journey]");
  const sections = [...document.querySelectorAll("[data-section][data-pose]")];
  if (!layer || !sections.length || reduce) return;
  document.documentElement.classList.add("has-journey");

  const fig = layer.querySelector(".journey__fig");
  const shadow = layer.querySelector(".journey__shadow");
  const imgs = Object.fromEntries([...fig.querySelectorAll("img")].map((i) => [i.dataset.pose, i]));
  const ratio = (pose) => { const i = imgs[pose]; return i && i.naturalWidth ? i.naturalWidth / i.naturalHeight : 0.41; };
  const phone = matchMedia("(max-width: 899px)");

  let active = -1, pose = null, box = null, from = null, out = null, movedAt = 0, swappedAt = -1e9;
  let lastY = NaN, lastW = 0, lastH = 0, checkedAt = -1e9, hidden = false;
  const start = performance.now();
  let mx = innerWidth / 2, tilt = 0;
  addEventListener("pointermove", (e) => (mx = e.clientX), { passive: true });

  // where he stands in this section, or null when the section has no room for him
  function spot(sec) {
    const flip = sec.hasAttribute("data-flip") ? -1 : 1;
    const slot = sec.querySelector("[data-slot]");
    if (slot) {
      const r = slot.getBoundingClientRect();
      if (r.width > 1 && r.height > 1) return { x: r.left, y: r.top, w: r.width, h: r.height, flip, o: 1 };
    }
    if (sec.dataset.place && !phone.matches) {
      const [cx, feet, hh] = sec.dataset.place.split(/\s+/).map(Number);
      const h = hh * innerHeight, w = h * ratio(sec.dataset.pose);
      return { x: cx * innerWidth - w / 2, y: feet * innerHeight - h, w, h, flip, o: 1 };
    }
    return null;
  }

  // stepping out: same size, just past the nearer side of the screen, faded
  function exit(sec) {
    const vw = innerWidth, vh = innerHeight;
    const b = box || { x: vw, y: vh * 0.45, w: vh * 0.4 * ratio(sec.dataset.pose), h: vh * 0.4, flip: 1 };
    const left = b.x + b.w / 2 < vw / 2;
    return { x: left ? -b.w - 40 : vw + 40, y: b.y, w: b.w, h: b.h, flip: b.flip, o: 0 };
  }

  function setPose(next, now) {
    if (next === pose) return;
    for (const [k, img] of Object.entries(imgs)) {
      img.style.transition = `opacity ${SWAP_MS}ms ease`;
      img.classList.toggle("is-on", k === next);
    }
    if (pose) swappedAt = now;
    pose = next;
  }

  function frame(now) {
    // which section rules: measured while the page scrolls or resizes, and a few times a second otherwise
    if (scrollY !== lastY || innerWidth !== lastW || innerHeight !== lastH || now - checkedAt > RECHECK_MS) {
      lastY = scrollY; lastW = innerWidth; lastH = innerHeight; checkedAt = now;
      const line = innerHeight * SPLIT;
      let idx = 0;
      for (let i = 0; i < sections.length; i++) if (sections[i].getBoundingClientRect().top <= line) idx = i;
      if (idx !== active) {
        if (box) { from = { ...box }; movedAt = now; }
        active = idx;
        out = null;
        setPose(sections[idx].dataset.pose, now);
      }
    }

    // where he is now
    let to = spot(sections[active]);
    if (to) out = null;
    else to = out ||= exit(sections[active]);
    let cur = to;
    if (from) {
      const p = Math.min(1, (now - movedAt) / MOVE_MS);
      const e = easeInOut(p);
      cur = { x: lerp(from.x, to.x, e), y: lerp(from.y, to.y, e), w: lerp(from.w, to.w, e), h: lerp(from.h, to.h, e), flip: lerp(from.flip, to.flip, e), o: lerp(from.o, to.o, e) };
      if (p >= 1) from = null;
    }
    box = cur;

    // stepped out and settled: nothing to draw
    if (!from && cur.o === 0) {
      if (!hidden) { fig.style.opacity = 0; shadow.style.opacity = 0; hidden = true; }
      requestAnimationFrame(frame);
      return;
    }
    hidden = false;

    // idle life and the step squash
    const t = (now - start) / 1000;
    const k = Math.min(1, cur.h / 600);
    const float = Math.sin((t / 4) * Math.PI * 2) * 6 * k;
    const breathe = 1 + 0.006 * (1 + Math.sin((t / 4) * Math.PI * 2 + 1.2));
    const squash = 0.97 + 0.03 * easeOut(Math.min(1, (now - swappedAt) / SWAP_MS));
    const want = Math.max(-3, Math.min(3, ((mx - (cur.x + cur.w / 2)) / innerWidth) * 8));
    tilt += (want - tilt) * 0.06;
    const introP = easeOut(Math.min(1, Math.max(0, (now - start - 250) / 1000)));

    fig.style.width = cur.w + "px";
    fig.style.height = cur.h + "px";
    fig.style.opacity = introP * cur.o;
    fig.style.transform = `translate3d(${cur.x}px, ${cur.y + float + (1 - introP) * 40}px, 0) rotate(${tilt}deg) scale(${cur.flip * breathe}, ${breathe * squash})`;

    const sw = cur.w * 0.9;
    shadow.style.width = sw + "px";
    shadow.style.opacity = introP * cur.o * (1 - Math.abs(float) / 24);
    shadow.style.transform = `translate3d(${cur.x + (cur.w - sw) / 2}px, ${cur.y + cur.h - 24}px, 0) scaleX(${1 - float / 60})`;

    requestAnimationFrame(frame);
  }

  // first pose without a move
  setPose(sections[0].dataset.pose, performance.now());
  requestAnimationFrame(frame);
}
