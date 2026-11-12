// Selected work: a "View" bubble follows the cursor over the rows; rows with a screenshot also show it in a small browser preview.
export function initWork({ reduce }) {
  const list = document.querySelector("[data-work]");
  const card = document.querySelector("[data-work-preview]");
  const bubble = document.querySelector("[data-cursor-view]");
  if (!list || !card || !bubble || !matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  const label = card.querySelector("[data-preview-label]");
  const img = new Image();
  img.className = "preview__img";
  img.alt = "";
  img.decoding = "async";
  card.querySelector("[data-preview-body]").append(img);
  let x = 0, y = 0, cx = 0, cy = 0, bx = 0, by = 0, on = false, shot = false, raf = 0;

  const loop = () => {
    const k = reduce ? 1 : 0.14;
    cx += (x - cx) * k; cy += (y - cy) * k;
    bx += (x - bx) * (reduce ? 1 : 0.32); by += (y - by) * (reduce ? 1 : 0.32);
    const w = card.offsetWidth, h = card.offsetHeight;
    card.style.transform = `translate3d(${cx - w - 40}px, ${cy - h / 2}px, 0) rotate(${Math.max(-6, Math.min(6, (x - cx) * 0.04))}deg)`;
    bubble.style.transform = `translate3d(${bx - 36}px, ${by - 36}px, 0) scale(${on ? 1 : 0.3})`;
    raf = on || Math.abs(x - cx) > 0.5 ? requestAnimationFrame(loop) : 0;
  };
  const fade = (el, v) => {
    el.style.transition = "opacity .3s ease, visibility .3s";
    el.style.opacity = v ? 1 : 0;
    el.style.visibility = v ? "visible" : "hidden";
  };
  const show = (v) => {
    on = v;
    list.classList.toggle("is-hovering", v);
    fade(bubble, v);
    fade(card, v && shot);
    if (!raf) raf = requestAnimationFrame(loop);
  };

  list.addEventListener("pointermove", (e) => {
    x = e.clientX; y = e.clientY;
    if (!on) { cx = bx = x; cy = by = y; show(true); }
  });
  list.addEventListener("pointerleave", () => show(false));
  list.querySelectorAll(".row").forEach((row) => {
    row.addEventListener("pointerenter", () => {
      shot = !!row.dataset.preview;
      if (shot) {
        img.src = row.dataset.preview;
        label.textContent = row.dataset.previewLabel || "";
      }
      fade(card, on && shot);
    });
  });
}
