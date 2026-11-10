// FAQ: <details> that open and close smoothly, one at a time.
export function initFaq({ reduce }) {
  const list = document.querySelector("[data-faq]");
  if (!list) return;
  const items = [...list.querySelectorAll("details")];

  const animate = (d, open) => {
    const body = d.querySelector(".qa__a");
    if (reduce || !body?.animate) { d.open = open; return; }
    if (open) {
      d.open = true;
      const h = body.scrollHeight;
      body.animate([{ height: "0px", opacity: 0 }, { height: h + "px", opacity: 1 }], { duration: 450, easing: "cubic-bezier(.22,1,.36,1)" });
    } else {
      const h = body.scrollHeight;
      const a = body.animate([{ height: h + "px", opacity: 1 }, { height: "0px", opacity: 0 }], { duration: 350, easing: "cubic-bezier(.65,0,.35,1)" });
      a.onfinish = () => (d.open = false);
    }
  };

  items.forEach((d) => {
    d.querySelector("summary").addEventListener("click", (e) => {
      e.preventDefault();
      const opening = !d.open;
      if (opening) items.filter((o) => o !== d && o.open).forEach((o) => animate(o, false));
      animate(d, opening);
    });
  });
}
