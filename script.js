const USER_ID = "835584835443228702";
const LANYARD_REST_URL = `https://api.lanyard.rest/v1/users/${USER_ID}`;
const LANYARD_SOCKET_URL = "wss://api.lanyard.rest/socket";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/* ------------------------------------------------------------------ small helpers */

const toast = $("#toast");
let toastTimer;
function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2600);
}

function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

/** Runs `fn` once when the element first scrolls into view. */
function whenVisible(el, fn, margin = "200px") {
  if (!("IntersectionObserver" in window)) return fn();
  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      io.disconnect();
      fn();
    }
  }, { rootMargin: margin });
  io.observe(el);
}

const yearEl = $("#year");
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

/* ------------------------------------------------------------------ navigation */

const nav = $("#nav");
const navLinks = $("#navLinks");
const menuBtn = $("#menuBtn");

function onScroll() {
  nav?.classList.toggle("is-scrolled", window.scrollY > 24);
}
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

menuBtn?.addEventListener("click", () => {
  const open = navLinks.classList.toggle("is-open");
  menuBtn.setAttribute("aria-expanded", String(open));
});
$$("a", navLinks).forEach((a) =>
  a.addEventListener("click", () => {
    navLinks.classList.remove("is-open");
    menuBtn?.setAttribute("aria-expanded", "false");
  }),
);

// highlight the link of the section being read
if ("IntersectionObserver" in window) {
  const links = new Map($$("a", navLinks).map((a) => [a.getAttribute("href").slice(1), a]));
  const spy = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        links.forEach((a) => a.classList.remove("is-active"));
        links.get(e.target.id)?.classList.add("is-active");
      }
    },
    { rootMargin: "-45% 0px -50% 0px" },
  );
  links.forEach((_, id) => {
    const s = document.getElementById(id);
    if (s) spy.observe(s);
  });
}

/* ------------------------------------------------------------------ scroll reveal */

if ("IntersectionObserver" in window && !reduceMotion) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      }
    },
    { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
  );
  $$(".reveal").forEach((el) => io.observe(el));
} else {
  $$(".reveal").forEach((el) => el.classList.add("is-in"));
}

/* ------------------------------------------------------------------ pixel stickers (drawn from text grids) */

const PIXELS = {
  heart: {
    pal: { X: "#d9432b", o: "#ff9b86", k: "#7e1f10" },
    grid: [".kk...kk.", "kXXk.kXXk", "kXoXkXXXk", "kXXXXXXXk", ".kXXXXXk.", "..kXXXk..", "...kXk...", "....k...."],
  },
  pickaxe: {
    pal: { G: "#8e949c", g: "#c9ced4", B: "#8a5a2b", b: "#b07a3e", k: "#2b2b2b" },
    grid: ["..kkkkkkk..", ".kGggggggGk.", "kGGkkbBkkGGk", "kGk..bB..kGk", "kk...bB...kk", ".....bB.....", ".....bB.....", ".....bB.....", ".....bB.....", ".....kk....."],
  },
  block: {
    pal: { G: "#5cae45", g: "#7ccb5e", D: "#8a5a35", d: "#6f4526", k: "#2b2b2b" },
    grid: ["kkkkkkkkkk", "kGgGGgGGgk", "kGGgGGGgGk", "kgGGGgGGGk", "kDdDDDdDDk", "kDDDdDDDdk", "kdDDDDdDDk", "kDDdDDDDDk", "kDDDDdDdDk", "kkkkkkkkkk"],
  },
  gem: {
    pal: { C: "#35c8e0", c: "#b5f3fb", B: "#1f8fa8", k: "#17566a" },
    grid: ["...kkkkk...", "..kcCCCCk..", ".kcCCCCCCk.", "kcCCCCCCCBk", "kCCCCCCCBBk", ".kCCCCCBBk.", "..kCCCBBk..", "...kCBBk...", "....kBk...."],
  },
};

$$("[data-pix]").forEach((el) => {
  const def = PIXELS[el.dataset.pix];
  if (!def) return;
  const rows = def.grid;
  const w = Math.max(...rows.map((r) => r.length));
  let rects = "";
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (ch !== "." && def.pal[ch]) rects += `<rect x="${x}" y="${y}" width="1.02" height="1.02" fill="${def.pal[ch]}"/>`;
    });
  });
  el.innerHTML = `<svg viewBox="0 0 ${w} ${rows.length}" shape-rendering="crispEdges" role="presentation">${rects}</svg>`;
});

/* ------------------------------------------------------------------ draggable stickers */

$$("[data-drag]").forEach((el) => {
  let startX = 0;
  let startY = 0;
  let baseX = 0;
  let baseY = 0;
  el.addEventListener("pointerdown", (e) => {
    startX = e.clientX;
    startY = e.clientY;
    baseX = parseFloat(el.style.getPropertyValue("--x")) || 0;
    baseY = parseFloat(el.style.getPropertyValue("--y")) || 0;
    el.setPointerCapture(e.pointerId);
    el.classList.add("is-dragging");
  });
  el.addEventListener("pointermove", (e) => {
    if (!el.classList.contains("is-dragging")) return;
    el.style.setProperty("--x", baseX + e.clientX - startX + "px");
    el.style.setProperty("--y", baseY + e.clientY - startY + "px");
  });
  const drop = () => el.classList.remove("is-dragging");
  el.addEventListener("pointerup", drop);
  el.addEventListener("pointercancel", drop);
});

/* ------------------------------------------------------------------ Instagram reels (official embeds, loaded when near) */

// To show a newer post, copy its code from the URL (instagram.com/reel/THIS_PART/) into a figure with data-ig in index.html.
const reelsBox = $("#reels");
if (reelsBox) {
  whenVisible(reelsBox, () => {
    $$(".reel", reelsBox).forEach((fig) => {
      const frame = $(".reel-frame", fig);
      const code = fig.dataset.ig;
      if (!frame || !code) return;
      const iframe = document.createElement("iframe");
      iframe.src = `https://www.instagram.com/reel/${code}/embed/`;
      iframe.title = `Instagram video: ${$(".hand", fig)?.textContent || code}`;
      iframe.loading = "lazy";
      iframe.allowFullscreen = true;
      iframe.setAttribute("scrolling", "no");
      iframe.setAttribute("allow", "encrypted-media; fullscreen; picture-in-picture");
      frame.append(iframe);
    });
  }, "300px");

  // Instagram's player reports its real height, so each frame fits its video with no blank space.
  window.addEventListener("message", (e) => {
    if (e.origin !== "https://www.instagram.com") return;
    let data = e.data;
    try {
      if (typeof data === "string") data = JSON.parse(data);
    } catch {
      return;
    }
    const height = data?.type === "MEASURE" ? Number(data.details?.height) : 0;
    if (!height) return;
    $$("iframe", reelsBox).forEach((f) => {
      if (f.contentWindow === e.source) f.parentElement.style.height = `${Math.round(height)}px`;
    });
  });
}

/* ------------------------------------------------------------------ share + spark */

async function copyPageLink() {
  const link = window.location.href.split("#")[0];
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(link);
    } else {
      const input = document.createElement("input");
      input.value = link;
      input.setAttribute("readonly", "");
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }
    showToast("Page link copied.");
  } catch {
    showToast("Copy failed. Use the address bar.");
  }
}
$("#shareButton")?.addEventListener("click", copyPageLink);

function createSpark(x, y) {
  if (reduceMotion) return;
  for (let i = 0; i < 6; i += 1) {
    const spark = document.createElement("span");
    const angle = (Math.PI * 2 * i) / 6;
    const distance = 26 + Math.random() * 24;
    spark.className = "spark";
    spark.style.left = `${x}px`;
    spark.style.top = `${y}px`;
    spark.style.setProperty("--tx", `${Math.cos(angle) * distance}px`);
    spark.style.setProperty("--ty", `${Math.sin(angle) * distance}px`);
    document.body.appendChild(spark);
    spark.addEventListener("animationend", () => spark.remove(), { once: true });
  }
}
document.addEventListener("pointerdown", (event) => {
  const target = event.target;
  if (target instanceof Element && target.closest(".btn, .link-btn")) createSpark(event.clientX, event.clientY);
});

/* ------------------------------------------------------------------ live presence (Lanyard) */

const spotifyTile = $("#spotifyTile");
const spotifyCardText = $("#spotifyCardText");
const spotifyBadge = $("#spotifyBadge");
const spotifyProgress = $("#spotifyProgress");
const spotifyProgressFill = spotifyProgress?.querySelector("span");

let heartbeatTimer;
let reconnectTimer;
let progressTimer;
let socket;
let reconnectAttempt = 0;

function formatTime(totalMs) {
  const totalSeconds = Math.max(0, Math.floor(totalMs / 1000));
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, "0")}`;
}

function getSpotifyTiming(spotify) {
  const start = spotify?.timestamps?.start;
  const end = spotify?.timestamps?.end;
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
  return { start, end, duration: end - start };
}

function clearSpotifyProgress() {
  clearInterval(progressTimer);
  progressTimer = undefined;
  spotifyProgress?.classList.remove("is-visible");
  if (spotifyProgressFill) spotifyProgressFill.style.width = "0%";
}

function paintSpotifySong(spotify) {
  if (!spotifyCardText || !spotify?.song) return;
  const artist = spotify.artist || "unknown artist";
  const timing = getSpotifyTiming(spotify);
  if (!timing) {
    spotifyCardText.textContent = `Now playing: ${spotify.song} — ${artist}`;
    return;
  }
  const elapsed = Math.min(Math.max(Date.now() - timing.start, 0), timing.duration);
  const percent = Math.min(100, Math.max(0, (elapsed / timing.duration) * 100));
  spotifyCardText.textContent = `Now playing: ${spotify.song} — ${artist} (${formatTime(elapsed)} / ${formatTime(timing.duration)})`;
  spotifyProgress?.classList.add("is-visible");
  if (spotifyProgressFill) spotifyProgressFill.style.width = `${percent}%`;
}

function startSpotifyProgress(spotify) {
  clearSpotifyProgress();
  if (!spotify?.song) return;
  paintSpotifySong(spotify);
  if (getSpotifyTiming(spotify)) progressTimer = setInterval(() => paintSpotifySong(spotify), 1000);
}

function renderPresence(raw = {}) {
  const spotify = raw.spotify;
  const hasTrack = Boolean(spotify?.song);
  spotifyTile?.classList.toggle("is-live", hasTrack);
  if (spotifyBadge) spotifyBadge.textContent = hasTrack ? "live" : "offline";
  if (hasTrack) {
    startSpotifyProgress(spotify);
    return;
  }
  clearSpotifyProgress();
  if (spotifyCardText) spotifyCardText.textContent = "Not playing anything right now. This card updates live when I start a track.";
}

async function loadPresence() {
  try {
    const res = await fetch(LANYARD_REST_URL);
    const json = await res.json();
    renderPresence(json.data || json);
  } catch {
    if (spotifyCardText) spotifyCardText.textContent = "Live status is unavailable right now.";
    clearSpotifyProgress();
  }
}

function sendSocketMessage(payload) {
  if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(payload));
}

function startHeartbeat(interval) {
  clearInterval(heartbeatTimer);
  sendSocketMessage({ op: 3 });
  heartbeatTimer = setInterval(() => sendSocketMessage({ op: 3 }), interval);
}

function extractPresenceFromPacket(packet) {
  if (!packet?.d) return null;
  if (packet.t === "INIT_STATE") return packet.d[USER_ID] || null;
  if (packet.t === "PRESENCE_UPDATE") return packet.d;
  return null;
}

function scheduleReconnect() {
  clearInterval(heartbeatTimer);
  clearTimeout(reconnectTimer);
  const delay = Math.min(30000, 1500 * 2 ** reconnectAttempt);
  reconnectAttempt += 1;
  reconnectTimer = setTimeout(connectLanyardSocket, delay);
}

function connectLanyardSocket() {
  if (!("WebSocket" in window)) return;
  socket = new WebSocket(LANYARD_SOCKET_URL);
  socket.addEventListener("message", (event) => {
    let packet;
    try {
      packet = JSON.parse(event.data);
    } catch {
      return;
    }
    if (packet.op === 1) {
      reconnectAttempt = 0;
      startHeartbeat(packet.d.heartbeat_interval);
      sendSocketMessage({ op: 2, d: { subscribe_to_id: USER_ID } });
      return;
    }
    const presence = extractPresenceFromPacket(packet);
    if (presence) renderPresence(presence);
  });
  socket.addEventListener("close", scheduleReconnect);
  socket.addEventListener("error", () => socket.close());
}

window.addEventListener("beforeunload", () => {
  clearInterval(heartbeatTimer);
  clearInterval(progressTimer);
  clearTimeout(reconnectTimer);
  socket?.close();
});

async function loadGithubStats() {
  const el = $("#githubStats");
  if (!el) return;
  try {
    const res = await fetch("https://api.github.com/users/trazhub", { headers: { Accept: "application/vnd.github+json" } });
    if (!res.ok) return;
    const d = await res.json();
    const fmt = (n) => (n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, "") + "k" : String(n));
    el.textContent = `${fmt(d.followers)} followers · ${d.public_repos} repos`;
  } catch {
    /* keep the default text */
  }
}

// Only start the live connections once the "Right now" board is near the screen.
const nowSection = $("#now");
if (nowSection) {
  whenVisible(nowSection, () => {
    loadPresence();
    connectLanyardSocket();
    loadGithubStats();
  }, "400px");
}

/* ------------------------------------------------------------------ booking dialog */

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DOW_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const TIME_SLOTS = ["9:00 AM", "10:00 AM", "11:00 AM", "2:00 PM", "3:00 PM", "4:00 PM"];

let calYear;
let calMonth;
let pickedDate;
let pickedTime;

const bookingDialog = $("#bookingDialog");
const bookingBody = $("#bookingBody");
const bookingSuccess = $("#bookingSuccess");

function openBookingModal() {
  const now = new Date();
  calYear = now.getFullYear();
  calMonth = now.getMonth();
  pickedDate = null;
  pickedTime = null;
  bookingBody.hidden = false;
  bookingSuccess.hidden = true;
  renderCalendar();
  renderSlots();
  updateSelection();
  try {
    bookingDialog.showModal();
  } catch {
    bookingDialog.setAttribute("open", "");
  }
  $("#bookName")?.focus();
}

function closeBookingModal() {
  bookingDialog?.close();
}

function renderCalendar() {
  const monthLabel = $("#calMonthLabel");
  const dowRow = $("#calDow");
  const daysGrid = $("#calDays");
  if (!monthLabel || !dowRow || !daysGrid) return;

  monthLabel.textContent = `${MONTHS[calMonth]} ${calYear}`;
  dowRow.innerHTML = DOW_LABELS.map((d) => `<span>${d}</span>`).join("");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const firstDow = new Date(calYear, calMonth, 1).getDay();
  const lastDate = new Date(calYear, calMonth + 1, 0).getDate();

  let html = "";
  for (let i = 0; i < firstDow; i += 1) {
    html += `<button class="cal-day is-empty" tabindex="-1" disabled aria-hidden="true"></button>`;
  }
  for (let d = 1; d <= lastDate; d += 1) {
    const date = new Date(calYear, calMonth, d);
    const isPast = date < today;
    const isWknd = date.getDay() === 0 || date.getDay() === 6;
    const isSel = pickedDate && pickedDate.getFullYear() === calYear && pickedDate.getMonth() === calMonth && pickedDate.getDate() === d;
    const disabled = isPast || isWknd;
    html += `<button type="button" class="cal-day${isSel ? " is-selected" : ""}" ${disabled ? "disabled" : ""} data-y="${calYear}" data-m="${calMonth}" data-d="${d}" aria-label="${MONTHS[calMonth]} ${d}">${d}</button>`;
  }
  daysGrid.innerHTML = html;
  $$(".cal-day:not([disabled]):not(.is-empty)", daysGrid).forEach((btn) => {
    btn.addEventListener("click", () => {
      pickedDate = new Date(+btn.dataset.y, +btn.dataset.m, +btn.dataset.d);
      pickedTime = null;
      renderCalendar();
      renderSlots();
      updateSelection();
    });
  });
}

function renderSlots() {
  const container = $("#calSlots");
  if (!container) return;
  if (!pickedDate) {
    container.innerHTML = "";
    return;
  }
  const btns = TIME_SLOTS.map((t) => `<button type="button" class="slot-btn ${t === pickedTime ? "is-selected" : ""}" data-time="${t}">${t}</button>`).join("");
  container.innerHTML = `<p class="slots-label">Available times</p><div class="slots-grid">${btns}</div>`;
  $$(".slot-btn", container).forEach((btn) => {
    btn.addEventListener("click", () => {
      pickedTime = btn.dataset.time;
      renderSlots();
      updateSelection();
    });
  });
}

function updateSelection() {
  const el = $("#bookSelection");
  if (!el) return;
  if (pickedDate && pickedTime) {
    el.textContent = `${DAYS[pickedDate.getDay()]}, ${MONTHS[pickedDate.getMonth()]} ${pickedDate.getDate()} · ${pickedTime}`;
  } else if (pickedDate) {
    el.textContent = "Date chosen — pick a time above.";
  } else {
    el.textContent = "No date or time selected yet.";
  }
}

function parseTime(str) {
  const [timePart, ampm] = str.split(" ");
  let [h, m] = timePart.split(":").map(Number);
  if (ampm === "PM" && h !== 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return { h, m };
}

function toCalISO(date, h, m) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(h)}${pad(m)}00`;
}

function handleBookingSubmit() {
  const name = $("#bookName")?.value.trim();
  const email = $("#bookEmail")?.value.trim();
  const topic = $("#bookTopic")?.value.trim();

  if (!name) { showToast("Please enter your name."); return; }
  if (!email || !email.includes("@")) { showToast("Please enter a valid email."); return; }
  if (!pickedDate) { showToast("Please pick a date on the calendar."); return; }
  if (!pickedTime) { showToast("Please pick a time slot."); return; }

  const displayDate = `${DAYS[pickedDate.getDay()]}, ${MONTHS[pickedDate.getMonth()]} ${pickedDate.getDate()}, ${pickedDate.getFullYear()} at ${pickedTime}`;
  const { h, m } = parseTime(pickedTime);
  const startISO = toCalISO(pickedDate, h, m);
  const endISO = toCalISO(pickedDate, h + 1, m);

  const gcalTitle = `Meeting with TrazHub — ${name}`;
  const gcalDetails = `Booking request from ${name} (${email})\n\nTopic: ${topic || "Not specified"}\n\nClick "Add video call" to generate a Google Meet link after saving this event.`;
  const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE` +
    `&text=${encodeURIComponent(gcalTitle)}` +
    `&dates=${startISO}/${endISO}` +
    `&details=${encodeURIComponent(gcalDetails)}` +
    `&add=${encodeURIComponent("garv@trazz.art")}`;

  const mailSubject = `Meeting request — ${name} · ${displayDate}`;
  const mailBody = `Hi Garv,\n\nI'd like to book a meeting with you.\n\nName:  ${name}\nEmail: ${email}\nDate:  ${displayDate}\nTopic: ${topic || "Not specified"}\n\nPlease confirm this slot or suggest an alternative.\n\n— ${name}`;
  const mailtoUrl = `mailto:garv@trazz.art?cc=${encodeURIComponent(email)}&subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(mailBody)}`;

  window.open(gcalUrl, "_blank", "noopener,noreferrer");

  const tempLink = document.createElement("a");
  tempLink.href = mailtoUrl;
  document.body.appendChild(tempLink);
  tempLink.click();
  tempLink.remove();

  const successDetails = $("#successDetails");
  if (successDetails) successDetails.textContent = `${displayDate} · ${email}`;
  bookingBody.hidden = true;
  bookingSuccess.hidden = false;
}

["workWithMe", "workWithMeHero", "workWithMeContact"].forEach((id) => {
  document.getElementById(id)?.addEventListener("click", openBookingModal);
});
$("#bookSubmit")?.addEventListener("click", handleBookingSubmit);

["bookingClose", "bookingSuccessClose"].forEach((id) => {
  document.getElementById(id)?.addEventListener("click", (e) => {
    e.stopPropagation();
    closeBookingModal();
  });
});

$("#calPrev")?.addEventListener("click", () => {
  calMonth -= 1;
  if (calMonth < 0) { calMonth = 11; calYear -= 1; }
  renderCalendar();
});
$("#calNext")?.addEventListener("click", () => {
  calMonth += 1;
  if (calMonth > 11) { calMonth = 0; calYear += 1; }
  renderCalendar();
});

bookingDialog?.addEventListener("click", (e) => {
  if (e.target === bookingDialog) closeBookingModal();
});
bookingDialog?.addEventListener("close", () => {
  if (bookingBody) bookingBody.hidden = false;
  if (bookingSuccess) bookingSuccess.hidden = true;
});
// Escape is handled natively by <dialog>
