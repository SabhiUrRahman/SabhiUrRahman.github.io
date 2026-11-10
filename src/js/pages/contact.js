// Contact page: "Your time" in the hero shows the visitor's own clock and how far it is from Lahore.
// Everything runs in the browser from the device clock; nothing is sent anywhere.
const LAHORE_OFFSET = 300; // minutes ahead of UTC (Pakistan has no daylight saving time)

const yours = document.querySelector("[data-your-time]");
const gapEl = document.querySelector("[data-your-gap]");

if (yours) {
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  const place = zone.split("/").pop().replace(/_/g, " "); // "Europe/London" -> "London"
  const local = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" });
  const lahore = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Karachi", hour: "2-digit", minute: "2-digit" });
  const lahoreClocks = document.querySelectorAll("[data-lahore-time]");

  const span = (min) => [Math.floor(min / 60) && `${Math.floor(min / 60)} h`, min % 60 && `${min % 60} min`].filter(Boolean).join(" ");
  const gap = (now) => {
    const diff = LAHORE_OFFSET + now.getTimezoneOffset(); // > 0: Lahore is ahead of the visitor
    if (diff === 0) return "same time as Lahore";
    return diff > 0 ? `${span(diff)} behind Lahore` : `${span(-diff)} ahead of Lahore`;
  };

  // runs on each new minute, and sets both clocks together so they never disagree by a minute
  const tick = () => {
    const now = new Date();
    yours.textContent = `${place ? place + " " : ""}${local.format(now)}`;
    if (gapEl) gapEl.textContent = gap(now);
    lahoreClocks.forEach((c) => (c.textContent = lahore.format(now)));
    setTimeout(tick, 60000 - (now.getSeconds() * 1000 + now.getMilliseconds()) + 50);
  };
  tick();
}

// Project brief: checks the fields, then
// - "Send message": posts the brief to Web3Forms, which emails it to Sabhi (the access key in data-key is public by design)
// - "Or send it on WhatsApp": opens WhatsApp with the same text ready to send
// If the inbox route is not set up or fails, the visitor keeps what they wrote and gets WhatsApp / email links.
const WHATSAPP = "923392925724";
const EMAIL = "sabhiurrahman.work@gmail.com";
const ENDPOINT = "https://api.web3forms.com/submit";
const form = document.querySelector("[data-brief]");

if (form) {
  const status = form.querySelector("[data-brief-status]");
  const done = form.querySelector("[data-brief-done]");
  const sendBtn = form.querySelector("[data-brief-send]");
  const field = (name) => form.elements.namedItem(name);
  const setError = (el, msg) => {
    const err = document.getElementById(`${el.id}-err`);
    el.setAttribute("aria-invalid", msg ? "true" : "false");
    if (err) { err.textContent = msg; el.setAttribute("aria-describedby", err.id); }
  };
  const check = () => {
    const name = field("name"), email = field("email"), link = field("link"), msg = field("message");
    const errors = [
      [name, name.value.trim() ? "" : "Please add your name."],
      [email, /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim()) ? "" : "Please add an email I can reply to."],
      [link, !link.value.trim() || /^https?:\/\/\S+\.\S+/.test(link.value.trim()) ? "" : "Links start with https://"],
      [msg, msg.value.trim().length >= 10 ? "" : "A line or two about the project, please."],
    ];
    errors.forEach(([el, m]) => setError(el, m));
    const first = errors.find(([, m]) => m);
    if (first) first[0].focus();
    return !first;
  };
  // errors clear as soon as the visitor fixes a field
  form.addEventListener("input", (e) => { if (e.target.getAttribute("aria-invalid") === "true") setError(e.target, ""); });

  const v = (n) => (field(n).value || "").trim();
  const picked = (n) => form.querySelector(`input[name="${n}"]:checked`)?.value || "";
  const subject = () => `Project brief: ${picked("need")} (${picked("platform")})`;
  const text = () => [
    `Hi Sabhi, I'm ${v("name")}.`,
    "",
    `Need: ${picked("need")}`,
    `Platform: ${picked("platform")}`,
    `Deadline: ${v("when")}`,
    v("link") ? `Link: ${v("link")}` : "",
    "",
    v("message"),
    "",
    `Reply to: ${v("email")}`,
  ].filter((l, i, a) => l !== "" || a[i - 1] !== "").join("\n");
  const waUrl = () => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text())}`;
  const mailUrl = () => `mailto:${EMAIL}?subject=${encodeURIComponent(subject())}&body=${encodeURIComponent(text())}`;

  // when the inbox route cannot be used, offer the two other ways with the brief already filled in
  const fallback = (why) => {
    status.textContent = "";
    status.append(`${why} Your brief is still here: `);
    const wa = Object.assign(document.createElement("a"), { href: waUrl(), target: "_blank", rel: "noopener", textContent: "send it on WhatsApp" });
    const mail = Object.assign(document.createElement("a"), { href: mailUrl(), textContent: "by email" });
    status.append(wa, " or ", mail, ".");
  };

  const sendToInbox = async () => {
    const key = (form.dataset.key || "").trim();
    if (!key) { fallback("Direct sending is not switched on yet."); return; }
    sendBtn.disabled = true;
    form.setAttribute("aria-busy", "true");
    status.textContent = "Sending…";
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: key,
          subject: subject(),
          from_name: `${v("name")} (portfolio)`,
          name: v("name"),
          email: v("email"),
          need: picked("need"),
          platform: picked("platform"),
          deadline: v("when"),
          link: v("link") || "—",
          message: v("message"),
          botcheck: field("botcheck").checked,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) throw new Error(data.message || data.body?.message || `HTTP ${res.status}`);
      // success: swap the fields for a thank-you note
      [...form.children].forEach((el) => { if (el !== done) el.hidden = true; });
      done.hidden = false;
      done.focus();
    } catch (err) {
      fallback(res429(err) ? "Too many messages right now." : "The message could not be sent.");
    } finally {
      sendBtn.disabled = false;
      form.removeAttribute("aria-busy");
    }
  };
  const res429 = (err) => /too many|429/i.test(String(err && err.message));

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!check()) { status.textContent = "A few fields need a look."; return; }
    if (e.submitter?.value === "whatsapp") {
      status.textContent = "Opening WhatsApp with the message ready…";
      window.open(waUrl(), "_blank", "noopener");
      return;
    }
    sendToInbox();
  });
}
