// Work page: the chips above the cases show one platform at a time.
// Without JavaScript the chips stay hidden (see work.css) and all four cases are shown.
import { ScrollTrigger } from "gsap/ScrollTrigger";

const bar = document.querySelector("[data-filters]");
const cases = [...document.querySelectorAll("[data-case]")];

if (bar && cases.length) {
  const chips = [...bar.querySelectorAll("[data-filter]")];
  const count = bar.querySelector("[data-filter-count]");
  const status = bar.querySelector("[data-filter-status]");
  const two = (n) => String(n).padStart(2, "0");

  const show = (key) => {
    let shown = 0;
    for (const item of cases) {
      const on = key === "all" || item.dataset.case.split(/\s+/).includes(key);
      item.hidden = !on;
      // keep picture and text swapping sides among the cases that are left
      if (on) item.classList.toggle("wk-case--flip", shown++ % 2 === 1);
    }
    for (const chip of chips) chip.setAttribute("aria-pressed", String(chip.dataset.filter === key));
    if (count) count.textContent = `${two(shown)} / ${two(cases.length)}`;
    if (status) status.textContent = `Showing ${shown} of ${cases.length} cases`;
    // the page got shorter or longer: re-measure the scroll reveals
    ScrollTrigger.refresh();
  };

  bar.addEventListener("click", (e) => {
    const chip = e.target.closest("[data-filter]");
    if (chip && chip.getAttribute("aria-pressed") !== "true") show(chip.dataset.filter);
  });
}
