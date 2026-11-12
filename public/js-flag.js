// Runs before first paint: marks that JavaScript is on, so reveal effects can start hidden.
// If the main script has not started after 4 s (blocked or failed), everything is shown again.
(function () {
  var r = document.documentElement;
  // Clickjacking guard: GitHub Pages cannot send X-Frame-Options or a frame-ancestors header,
  // so the page refuses to show itself inside another site's frame and tries to open on top instead.
  if (window.top !== window.self) {
    r.style.visibility = "hidden";
    try { window.top.location = window.location.href; } catch (e) {}
  }
  r.classList.add("js");
  try { if (matchMedia("(prefers-reduced-motion: reduce)").matches) r.classList.add("no-motion"); } catch (e) {}
  setTimeout(function () { if (!window.__ssrReady) r.classList.remove("js"); }, 4000);
})();
