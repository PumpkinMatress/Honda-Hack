// core.js — shared plumbing every screen uses. Owned by Person A.
//
// ================= WHAT YOU CAN USE FROM YOUR OWN FILE =================
//
//   registerScreen(name, drawFn)
//       Tell core how to draw your screen. drawFn(box, params) gets the empty
//       <section> for your screen and any params from showScreen. Set
//       box.innerHTML to draw. It is called again every time the screen is
//       shown or the "Viewing as" person changes, so always redraw from data.
//
//   showScreen(name, params)
//       Go to a screen. Names: "profile", "challenges", "listings",
//       "messages", "project", "review".
//         showScreen("project", { id: "led-cube" })
//         showScreen("profile", { user: "jordan" })   // no user = the viewer
//         showScreen("messages", { with: "maya" })
//       Shortcut in HTML, no JavaScript needed:
//         <button data-go="project" data-id="led-cube">Open</button>
//       Every data-* attribute on the element becomes a param.
//
//   refresh()          Redraw the current screen (after you change data).
//   currentUser()      The user object chosen in "Viewing as".
//   save()             Call after you change any list from data.js
//                      (projects, listings, messages, certifications, feedback, ...).
//
//   findUser(id), findProject(id), findChallenge(id), findListing(id)
//
//   HTML helpers (each returns a string of HTML):
//     esc(text)                 make any user-typed text safe inside HTML. Always use it.
//     avatarHtml(user, size)    round photo with initials fallback. size: "sm" | "md" | "lg" | "xl"
//     skillChip(skill)          grey pill for a skill name
//     levelPill(levelId)        colored pill, e.g. "Advanced"
//     certBadgeHtml(cert)       the full certification badge used on profiles
//                               certBadgeHtml(cert, { showStudent: true }) names the student instead of the reviewer
//     photoHtml(src, label)     project photo with a colored fallback if the file is missing
//     verifiedHtml(user)        "✓ Verified · Honda" tag for mentors
//     formatDate("2026-10-24")  -> "Oct 24, 2026"
//     today()                   -> "2026-10-24"
//
// =======================================================================

// ---------- Screens ----------

// The nav bar is built from this list.
// mentorOnly: only shown when a mentor is the viewer.
const SCREENS = [
  { name: "profile",    label: "Profile",      file: "profile.js",   owner: "Person A", nav: true },
  { name: "challenges", label: "Challenges",   file: "challenge.js", owner: "Person B", nav: true },
  { name: "listings",   label: "Listings",     file: "listings.js",  owner: "Person B", nav: true },
  { name: "messages",   label: "Messages",     file: "messages.js",  owner: "Person B", nav: true },
  { name: "project",    label: "Project",      file: "project.js",   owner: "Person C", nav: false },
  { name: "review",     label: "Review queue", file: "review.js",    owner: "Person C", nav: true, mentorOnly: true },
];

const screenDrawers = {};
let currentScreen = "profile";
let currentParams = {};

function registerScreen(name, drawFn) {
  screenDrawers[name] = drawFn;
  // If this screen is already showing (e.g. its file loaded late), draw it now.
  if (appStarted && name === currentScreen) refresh();
}

// Changing the address bar (#/project?id=x) lets the browser Back button work
// and keeps you on the same screen when Live Server reloads the page.
function showScreen(name, params = {}) {
  const query = new URLSearchParams(params).toString();
  const hash = "#/" + name + (query ? "?" + query : "");
  if (location.hash === hash) refresh();
  else location.hash = hash; // triggers the hashchange listener, which draws
}

function readHash() {
  const raw = location.hash.replace(/^#\/?/, "");
  const [name, query] = raw.split("?");
  const known = SCREENS.some((s) => s.name === name);
  return {
    name: known ? name : "profile",
    params: Object.fromEntries(new URLSearchParams(query || "")),
  };
}

function refresh() {
  const { name, params } = readHash();
  currentScreen = name;
  currentParams = params;

  document.querySelectorAll(".screen").forEach((s) => (s.hidden = true));
  const box = document.getElementById("screen-" + name);
  box.hidden = false;

  const draw = screenDrawers[name];
  if (!draw) {
    const info = SCREENS.find((s) => s.name === name);
    box.innerHTML = `
      <div class="empty-state card">
        <h2>${esc(info.label)}</h2>
        <p class="muted">This screen is drawn by <code>${esc(info.file)}</code> (${esc(info.owner)}). It hasn't been added yet.</p>
        <p class="muted small">Params: <code>${esc(JSON.stringify(params))}</code></p>
      </div>`;
  } else {
    try {
      draw(box, params);
    } catch (err) {
      // One broken screen shouldn't blank the whole site.
      console.error(err);
      box.innerHTML = `
        <div class="empty-state card error">
          <h2>Something broke on this screen</h2>
          <p class="muted">Press F12 and open the Console tab to see the red error.</p>
          <pre>${esc(err.message)}</pre>
        </div>`;
    }
  }

  drawNav();
  window.scrollTo(0, 0);
}

// Any element with data-go="screenName" acts as a link to that screen.
document.addEventListener("click", (e) => {
  const link = e.target.closest("[data-go]");
  if (!link) return;
  e.preventDefault();
  const { go, ...params } = link.dataset;
  showScreen(go, params);
});

// ---------- Saving and loading ----------
// The lists from data.js are changed in place, so every file sees the same data.
// save() stores them in the browser. On page load, saved changes are put back.

const STORE_KEY = "bridge-demo-data";
const VIEWER_KEY = "bridge-demo-viewer";
const SAVED_LISTS = { users, challenges, projects, listings, messages, certifications, feedback };

// A snapshot of data.js as written. If someone edits data.js, old saved
// changes no longer match and are thrown away, so new data always shows up.
const DATA_SNAPSHOT = JSON.stringify(SAVED_LISTS);

function save() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({ snapshot: DATA_SNAPSHOT, lists: SAVED_LISTS }));
  } catch (err) {
    console.warn("Could not save to the browser:", err);
  }
}

function loadSaved() {
  let saved = null;
  try {
    saved = JSON.parse(localStorage.getItem(STORE_KEY));
  } catch (err) {
    return;
  }
  if (!saved) return;
  if (saved.snapshot !== DATA_SNAPSHOT) {
    console.info("data.js changed since the last save, so saved demo changes were cleared.");
    localStorage.removeItem(STORE_KEY);
    return;
  }
  for (const [name, list] of Object.entries(SAVED_LISTS)) {
    if (Array.isArray(saved.lists[name])) {
      list.length = 0;
      list.push(...saved.lists[name]);
    }
  }
}

function resetDemo() {
  if (!confirm("Clear all demo changes and start over as Maya?")) return;
  try {
    localStorage.removeItem(STORE_KEY);
    localStorage.removeItem(VIEWER_KEY);
  } catch (err) {}
  location.hash = "#/profile";
  location.reload();
}

// ---------- "Viewing as" ----------

// The people in the dropdown, in demo order.
const DEMO_VIEWERS = ["maya", "jordan", "priya"];
let viewerId = "maya";

function currentUser() {
  return findUser(viewerId);
}

function setViewer(id) {
  viewerId = id;
  try { localStorage.setItem(VIEWER_KEY, id); } catch (err) {}
  // A student can't see the review queue; send them to their profile.
  const info = SCREENS.find((s) => s.name === currentScreen);
  if (info && info.mentorOnly && currentUser().role !== "mentor") showScreen("profile");
  else refresh();
}

function drawViewerSelect() {
  const select = document.getElementById("viewer-select");
  select.innerHTML = DEMO_VIEWERS.map((id) => {
    const u = findUser(id);
    const tag = u.role === "mentor" ? `${u.company} engineer` : "student";
    return `<option value="${esc(u.id)}">${esc(u.name)} (${esc(tag)})</option>`;
  }).join("");
  select.value = viewerId;
  select.onchange = () => setViewer(select.value);
}

function drawNav() {
  const viewer = currentUser();
  document.getElementById("nav").innerHTML = SCREENS
    .filter((s) => s.nav && (!s.mentorOnly || viewer.role === "mentor"))
    .map((s) => {
      // Profile is only "active" when it's your own profile.
      const active = s.name === currentScreen && !(s.name === "profile" && currentParams.user && currentParams.user !== viewer.id);
      return `<a href="#/${s.name}" class="nav-link${active ? " active" : ""}">${esc(s.label)}</a>`;
    })
    .join("");
  document.getElementById("viewer-select").value = viewerId;
}

// ---------- Finding things ----------

function findUser(id) { return users.find((u) => u.id === id); }
function findProject(id) { return projects.find((p) => p.id === id); }
function findChallenge(id) { return challenges.find((c) => c.id === id); }
function findListing(id) { return listings.find((l) => l.id === id); }

// ---------- HTML helpers ----------

function esc(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// A stable color for each name, so fallbacks don't all look the same.
function hueFor(text) {
  let h = 0;
  for (const ch of String(text)) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return h;
}

function initials(name) {
  return String(name).split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

// Shows initials; the photo covers them if the file exists, and removes itself if not.
function avatarHtml(user, size = "md") {
  if (!user) return "";
  const img = user.photo ? `<img src="${esc(user.photo)}" alt="" onerror="this.remove()">` : "";
  return `<span class="avatar avatar-${size}" style="--hue:${hueFor(user.id)}" title="${esc(user.name)}">${esc(initials(user.name))}${img}</span>`;
}

function photoHtml(src, label) {
  const img = src ? `<img src="${esc(src)}" alt="${esc(label)}" onerror="this.remove()">` : "";
  return `<div class="photo" style="--hue:${hueFor(label)}"><span class="photo-fallback">${esc(initials(label))}</span>${img}</div>`;
}

function skillChip(skill) {
  return `<span class="chip">${esc(skill)}</span>`;
}

function levelInfo(levelId) {
  const index = LEVELS.findIndex((l) => l.id === levelId);
  const level = LEVELS[index] || { id: levelId, label: levelId, meaning: "" };
  return { ...level, rank: index + 1 }; // rank: 1 = beginner ... 4 = advanced
}

function levelPill(levelId) {
  const level = levelInfo(levelId);
  return `<span class="level-pill level-${esc(level.id)}" title="${esc(level.meaning)}">${esc(level.label)}</span>`;
}

function levelMeter(levelId) {
  const { rank } = levelInfo(levelId);
  return `<span class="level-meter" aria-hidden="true">${LEVELS.map((_, i) => `<i class="${i < rank ? "on" : ""}"></i>`).join("")}</span>`;
}

function verifiedHtml(user) {
  if (!user || !user.verified) return "";
  return `<span class="verified" title="Identity and employer verified">✓ Verified · ${esc(user.company)}</span>`;
}

// The full certification badge: "Advanced Soldering — certified by Priya Shah, Honda".
// certBadgeHtml(cert, { showStudent: true }) says who received it instead (for reviewers).
function certBadgeHtml(cert, options = {}) {
  const level = levelInfo(cert.level);
  const reviewer = findUser(cert.by);
  const student = findUser(cert.user);
  const project = findProject(cert.project);
  const by = reviewer ? `${reviewer.name}${reviewer.company ? ", " + reviewer.company : ""}` : "a reviewer";
  const who = options.showStudent && student
    ? `Awarded to <strong>${esc(student.name)}</strong>`
    : `Certified by ${esc(by)}`;
  return `
    <div class="cert level-${esc(level.id)}" ${project ? `data-go="project" data-id="${esc(project.id)}"` : ""}>
      <div class="cert-seal" aria-hidden="true">${esc(level.label[0])}</div>
      <div class="cert-body">
        <div class="cert-top">
          <div class="cert-title">${esc(level.label)} ${esc(cert.skill)}</div>
          ${levelMeter(cert.level)}
        </div>
        <div class="cert-by">${who}</div>
        <div class="cert-meta">${project ? esc(project.title) + " · " : ""}${esc(formatDate(cert.date))}</div>
      </div>
    </div>`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Reads "2026-10-24" (or "2026-10-24T14:02") without time-zone surprises.
function formatDate(text) {
  if (!text) return "";
  const [y, m, d] = String(text).slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return String(text);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

function today() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// ---------- Start ----------

let appStarted = false;

function startApp() {
  loadSaved();
  try {
    const savedViewer = localStorage.getItem(VIEWER_KEY);
    if (savedViewer && findUser(savedViewer)) viewerId = savedViewer;
  } catch (err) {}

  drawViewerSelect();
  document.getElementById("reset-demo").onclick = resetDemo;
  window.addEventListener("hashchange", refresh);

  appStarted = true;
  refresh();
}
