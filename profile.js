// profile.js — the profile page (demo screens 1 and 7). Owned by Person A.
// Styles are in profile.css.
//
// showScreen("profile")                    -> the "Viewing as" person's own profile
// showScreen("profile", { user: "jordan" }) -> someone else's profile
//
// Layout: a header (photo in a big circle, name box, stats box), then each project
// as a manila folder. Current projects are full width and always come first.
// Completed projects are half width, newest first, with the date on the tab.

registerScreen("profile", (box, params) => {
  const viewer = currentUser();
  const user = findUser(params.user) || viewer;
  const isOwn = user.id === viewer.id;

  box.innerHTML = user.role === "mentor"
    ? mentorProfileHtml(user, isOwn)
    : studentProfileHtml(user, isOwn);
});

// ---------- Students ----------

function studentProfileHtml(user, isOwn) {
  const mine = projects.filter((p) => p.members.includes(user.id));
  const current = mine.filter((p) => p.status !== "done");
  const completed = mine
    .filter((p) => p.status === "done")
    .map((p, i) => ({ p, i }))
    .sort((a, b) => projectDate(b.p).localeCompare(projectDate(a.p)) || b.i - a.i) // newest first
    .map((x) => x.p);
  const skills = skillCount(user, mine);

  return `
    <div class="pf">
      ${profileHeaderHtml(user, isOwn, [
        { n: mine.length, label: mine.length === 1 ? "project" : "projects" },
        { n: skills, label: skills === 1 ? "skill" : "skills" },
      ])}

      <section class="pf-current" aria-label="Current projects">
        ${current.length
          ? current.map((p) => folderHtml(p, user, "current")).join("")
          : emptyFolderHtml(user, isOwn)}
      </section>

      ${completed.length ? `
        <section class="pf-completed" aria-label="Completed projects">
          ${completed.map((p) => folderHtml(p, user, "completed")).join("")}
        </section>` : ""}
    </div>`;
}

// Skills they listed, plus any they used on a project or were certified in.
function skillCount(user, mine) {
  const used = mine.flatMap((p) => (p.skillTags || []).filter((t) => t.people.includes(user.id)).map((t) => t.skill));
  const certified = certifications.filter((c) => c.user === user.id).map((c) => c.skill);
  return new Set([...(user.skills || []), ...used, ...certified]).size;
}

// When a project was finished: the date saved on it, or the day it was reviewed.
function projectDate(p) {
  if (p.completedOn) return p.completedOn;
  const reviewed = certifications.filter((c) => c.project === p.id).map((c) => c.date).sort();
  return reviewed[reviewed.length - 1] || p.submittedOn || "";
}

// "2026-01-03" -> "01/03/26"
function shortDate(text) {
  const [y, m, d] = String(text || "").slice(0, 10).split("-");
  return y && m && d ? `${m}/${d}/${y.slice(2)}` : "";
}

// ---------- Project folders ----------

// size: "current" (full width) or "completed" (half width)
function folderHtml(p, user, size) {
  const others = p.members.filter((id) => id !== user.id).map(findUser).filter(Boolean);
  const challenge = p.submittedTo ? findChallenge(p.submittedTo) : null;
  const meta = [
    others.length ? `with ${others.map((u) => u.name).join(", ")}` : "",
    challenge ? `Submitted to the ${challenge.company} challenge` : "",
  ].filter(Boolean).join(" · ");
  const tab = size === "current" ? "Current Project" : shortDate(projectDate(p)) || "Completed";

  return `
    <article class="folder folder-${size}" data-go="project" data-id="${esc(p.id)}">
      <div class="folder-tab">${esc(tab)}</div>
      <div class="folder-back">
        <div class="folder-front">
          <div class="folder-info">
            <h2 class="folder-title">${esc(p.title)}</h2>
            ${meta ? `<div class="folder-meta">${esc(meta)}</div>` : ""}
            ${p.description ? `<p class="folder-desc">${esc(p.description)}</p>` : ""}
          </div>
          ${folderPhotoHtml(p)}
          ${folderStampsHtml(p)}
        </div>
      </div>
    </article>`;
}

// The big square for an uploaded photo. Empty until a photo exists.
function folderPhotoHtml(p) {
  const src = p.photos && p.photos[0];
  return `<div class="folder-photo">${src ? `<img src="${esc(src)}" alt="${esc(p.title)}" onerror="this.remove()">` : ""}</div>`;
}

// One empty stamp per skill tagged on the project.
// TODO: these become certification stamps (designed later).
function folderStampsHtml(p) {
  const tags = p.skillTags || [];
  if (!tags.length) return "";
  return `<div class="folder-stamps" aria-hidden="true">
    ${tags.map((t) => `<span class="folder-stamp" title="${esc(t.skill)}"></span>`).join("")}
  </div>`;
}

// Shown in place of the current project when there isn't one.
function emptyFolderHtml(user, isOwn) {
  return `
    <article class="folder folder-current folder-empty">
      <div class="folder-tab">Current Project</div>
      <div class="folder-back">
        <div class="folder-front">
          <div class="folder-info">
            <h2 class="folder-title">No open project right now</h2>
            <p class="folder-desc">${isOwn
              ? "Find a company challenge and start a project for it."
              : `${esc(firstName(user))} isn't working on a project at the moment.`}</p>
            ${isOwn ? `<button class="pf-btn" data-go="challenges">Browse challenges</button>` : ""}
          </div>
        </div>
      </div>
    </article>`;
}

// ---------- Mentors ----------

function mentorProfileHtml(user, isOwn) {
  const posted = challenges.filter((c) => c.postedBy === user.id);
  const given = sortCerts(certifications.filter((c) => c.by === user.id));
  const reviewedProjects = new Set(given.map((c) => c.project)).size;

  return `
    <div class="pf">
      ${profileHeaderHtml(user, isOwn, [
        { n: posted.length, label: posted.length === 1 ? "challenge posted" : "challenges posted" },
        { n: reviewedProjects, label: reviewedProjects === 1 ? "project reviewed" : "projects reviewed" },
      ])}

      <div class="stack-lg">
        <section class="section">
          <div class="section-head"><h2>Challenges</h2></div>
          ${posted.length
            ? `<div class="project-grid">${posted.map(challengeCardHtml).join("")}</div>`
            : `<div class="empty-state card"><p class="muted">No challenges posted.</p></div>`}
        </section>

        <section class="section">
          <div class="section-head">
            <h2>Certifications given</h2>
            ${isOwn ? `<button class="pf-btn pf-btn-light" data-go="review">Open review queue</button>` : ""}
          </div>
          ${given.length
            ? `<div class="cert-grid">${given.map((c) => certBadgeHtml(c, { showStudent: true })).join("")}</div>`
            : `<div class="empty-state card"><p class="muted">No reviews yet.</p></div>`}
        </section>
      </div>
    </div>`;
}

function challengeCardHtml(ch) {
  const open = today() <= ch.closes;
  return `
    <article class="card card-link" data-go="challenges" data-id="${esc(ch.id)}">
      <div class="row-between">
        <span class="company-tag">${esc(ch.company)}</span>
        <span class="status ${open ? "status-open" : "status-done"}">${open ? "Open" : "Closed"}</span>
      </div>
      <h3>${esc(ch.title)}</h3>
      <p class="muted small clamp-2">${esc(ch.prompt)}</p>
      <div class="muted xsmall">${ch.weeks} weeks · closes ${esc(formatDate(ch.closes))}</div>
    </article>`;
}

// ---------- Header ----------

// The photo sits in a big circle: green on top (the banner), cream below (the name box).
// The stats box is on the right, under the banner.
function profileHeaderHtml(user, isOwn, stats) {
  const subtitle = user.role === "mentor"
    ? `${esc(user.title)} at ${esc(user.company)}`
    : `${esc(user.major)}${user.year ? " · " + esc(user.year) : ""}`;
  return `
    <section class="pf-header">
      <div class="pf-banner">
        ${isOwn ? "" : `<button class="pf-btn pf-btn-light" data-go="messages" data-with="${esc(user.id)}">Message</button>`}
      </div>
      <div class="pf-info">
        <div class="pf-name">
          <h1>${esc(user.name)}</h1>
          ${user.role === "mentor" ? verifiedHtml(user) : ""}
        </div>
        <div class="pf-sub">${subtitle}</div>
        ${user.bio ? user.bio.split("\n\n").map((para) => `<p class="pf-bio">${esc(para)}</p>`).join("") : ""}
      </div>
      <div class="pf-stats">
        ${stats.map((s) => `<div class="pf-stat"><strong>${s.n}</strong> <span>${esc(s.label)}</span></div>`).join("")}
      </div>
      <div class="pf-photo">${avatarHtml(user, "xl")}</div>
    </section>`;
}

// ---------- Shared helpers (also used by project.js, review.js, messages.js) ----------

// Used on project pages and the review screen.
function feedbackItemHtml(f) {
  const from = findUser(f.from);
  const project = findProject(f.project);
  // Person C may use doneWell/toImprove, or a single comment field.
  const parts = [
    f.doneWell && `<p><strong>Done well:</strong> ${esc(f.doneWell)}</p>`,
    f.toImprove && `<p><strong>To improve:</strong> ${esc(f.toImprove)}</p>`,
    f.comment && `<p>${esc(f.comment)}</p>`,
  ].filter(Boolean).join("");
  return `
    <div class="feedback-item">
      <div class="row">
        ${avatarHtml(from, "sm")}
        <div>
          <div class="small"><strong>${esc(from ? from.name : "Reviewer")}</strong>${from && from.company ? ` · ${esc(from.company)}` : ""}</div>
          <div class="muted xsmall">${project ? esc(project.title) + " · " : ""}${esc(formatDate(f.date))}</div>
        </div>
      </div>
      ${parts}
    </div>`;
}

// Highest level first, then newest first.
function sortCerts(list) {
  return list
    .map((c, i) => ({ c, i }))
    .sort((a, b) => levelInfo(b.c.level).rank - levelInfo(a.c.level).rank || b.i - a.i)
    .map((x) => x.c);
}

function firstName(user) {
  return user.name.split(" ")[0];
}

function capitalize(text) {
  return String(text).charAt(0).toUpperCase() + String(text).slice(1);
}
