// Header: solid after the cover, hides while scrolling down, comes back on the way up.
// Phone menu: full-screen sheet with Esc, focus return and scroll lock.
export function initNav({ lenis }) {
  const nav = document.querySelector("[data-nav]");
  if (!nav) return;
  let last = 0;
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle("is-solid", y > 60);
    const down = y > last + 4, up = y < last - 4;
    if (down && y > 400) nav.classList.add("is-hidden");
    else if (up || y < 400) nav.classList.remove("is-hidden");
    last = y;
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const menu = document.querySelector("[data-menu]");
  const openBtn = document.querySelector("[data-menu-open]");
  const closeBtn = document.querySelector("[data-menu-close]");
  if (!menu || !openBtn) return;
  menu.setAttribute("role", "dialog");
  menu.setAttribute("aria-modal", "true");
  if (!menu.hasAttribute("aria-label")) menu.setAttribute("aria-label", "Menu");
  // everything except the menu and its ancestors: siblings at every level up to <body>
  const behind = () => {
    const out = [];
    for (let n = menu; n && n !== document.body; n = n.parentElement) for (const sib of n.parentElement.children) if (sib !== n) out.push(sib);
    return out;
  };
  const open = () => {
    menu.hidden = false;
    behind().forEach((el) => (el.inert = true));
    openBtn.setAttribute("aria-expanded", "true");
    lenis?.stop();
    document.body.style.overflow = "hidden";
    closeBtn?.focus();
  };
  const close = () => {
    menu.hidden = true;
    behind().forEach((el) => (el.inert = false));
    openBtn.setAttribute("aria-expanded", "false");
    lenis?.start();
    document.body.style.overflow = "";
    openBtn.focus();
  };
  openBtn.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  menu.addEventListener("click", (e) => { if (e.target.closest("a")) close(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !menu.hidden) close(); });
}
