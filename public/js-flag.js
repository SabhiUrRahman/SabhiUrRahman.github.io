// Runs before first paint: marks that JavaScript is on, so reveal effects can start hidden.
// If the main script has not started after 4 s (blocked or failed), everything is shown again.
(function () {
  var r = document.documentElement;
  r.classList.add("js");
  try { if (matchMedia("(prefers-reduced-motion: reduce)").matches) r.classList.add("no-motion"); } catch (e) {}
  setTimeout(function () { if (!window.__ssrReady) r.classList.remove("js"); }, 4000);
})();
