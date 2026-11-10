// The terminal in the security chapter runs real, passive checks on this page in the visitor's browser.
// Nothing is sent anywhere; it only reads what the page itself can see.
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function checks() {
  const here = location.origin;
  const resources = performance.getEntriesByType("resource").map((e) => e.name);
  const scripts = [...document.scripts].map((s) => s.src).filter(Boolean);
  const offsite = [...new Set([...resources, ...scripts].filter((u) => { try { return new URL(u).origin !== here; } catch { return false; } }))];
  const insecure = resources.filter((u) => u.startsWith("http:") && !/^http:\/\/(localhost|127\.0\.0\.1)/.test(u));
  const local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  const csp = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  const ref = document.querySelector('meta[name="referrer"]');
  return [
    { name: "content-security-policy", ok: !!csp, note: csp ? "" : local ? "added at build" : "missing" },
    { name: "https everywhere", ok: (location.protocol === "https:" || local) && !insecure.length, note: local ? "local preview" : insecure.length ? insecure.length + " http requests" : "" },
    { name: "third-party scripts", ok: !offsite.length, note: offsite.length ? offsite.length + " found" : "none" },
    { name: "referrer policy", ok: !!ref, note: ref ? ref.content : local ? "added at build" : "missing" },
  ];
}

export function initScan() {
  const box = document.querySelector("[data-scan]");
  if (!box) return;
  const out = box.querySelector("[data-scan-out]");
  const sum = box.querySelector("[data-scan-sum]");
  box.querySelector("[data-scan-host]").textContent = location.host;
  let ran = false;

  const run = async () => {
    if (ran) return;
    ran = true;
    const t0 = performance.now();
    const res = checks();
    const ms = Math.round(performance.now() - t0);
    out.innerHTML = "";
    let passed = 0;
    for (const r of res) {
      await wait(380);
      const li = document.createElement("li");
      const tag = document.createElement("span");
      tag.className = r.ok ? "ok" : "warn";
      tag.textContent = r.ok ? "[ ok ]" : "[warn]";
      li.append(tag, " " + r.name + (r.note ? " · " + r.note : ""));
      out.append(li);
      if (r.ok) passed++;
    }
    await wait(300);
    sum.textContent = `${passed} / ${res.length} passed · checked in ${ms} ms · in your browser`;
  };

  new IntersectionObserver((entries, io) => {
    if (entries.some((e) => e.isIntersecting)) { run(); io.disconnect(); }
  }, { threshold: 0.6 }).observe(box);
}
