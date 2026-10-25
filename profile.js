// profile.js — the profile page (demo screens 1 and 7). Owned by Person A.
// Styles are in profile.css.
//
// showScreen("profile")                    -> the "Viewing as" person's own profile
// showScreen("profile", { user: "jordan" }) -> someone else's profile
//
// Layout: a header (photo in a big circle, name box, stats box), then each project
// as a manila folder. Current projects are full width and always come first.
// Completed projects are half width, newest first, with the date on the tab.
// On your own profile, "Create project" is always at the top right of your projects.
// Each current project has "Create listing" (listings.js) and "Mark as completed",
// and each project you own has a trash can (top right of the folder) to delete it.

registerScreen("profile", (box, params) => {
  const viewer = currentUser();
  const user = findUser(params.user) || viewer;
  const isOwn = user.id === viewer.id;

  box.innerHTML = user.role === "mentor"
    ? mentorProfileHtml(user, isOwn)
    : studentProfileHtml(user, isOwn);
  fitProfileName(box);
});

// ---------- Name size ----------

// How big the name is compared to filling the whole green banner (1 = fills it).
const NAME_SCALE = 2 / 3;

// Sizes the name from the green banner: at NAME_SCALE = 1 the letters would reach from
// the top of the banner's padding to the bottom (or across the full width, for long names).
// It measures the actual letters, so names with tails (g, y, p) still fit.
function fitProfileName(box) {
  const banner = box.querySelector(".pf-banner");
  const name = banner && banner.querySelector(".pf-name");
  const h1 = name && name.querySelector("h1");
  if (!h1 || !banner.clientWidth) return;

  const bs = getComputedStyle(banner);
  let height = banner.clientHeight - parseFloat(bs.paddingTop) - parseFloat(bs.paddingBottom);
  let width = banner.clientWidth - parseFloat(bs.paddingLeft) - parseFloat(bs.paddingRight);

  // Leave room for the Message button (beside the name, or above it on phones)
  // and the Verified tag.
  const button = banner.querySelector(".pf-btn");
  if (button && getComputedStyle(button).position === "absolute") {
    height -= button.offsetTop + button.offsetHeight + 4 - parseFloat(bs.paddingTop);
  } else if (button) {
    width -= button.offsetWidth + 16;
  }
  const tag = name.querySelector(".verified");
  if (tag && tag.offsetParent) width -= tag.offsetWidth + 12;

  // Measure the letters at 100px.
  const hs = getComputedStyle(h1);
  const ctx = (fitProfileName.canvas = fitProfileName.canvas || document.createElement("canvas")).getContext("2d");
  ctx.font = `${hs.fontWeight} 100px ${hs.fontFamily}`;
  if ("letterSpacing" in ctx) ctx.letterSpacing = "-2px"; // matches letter-spacing: -0.02em
  const m = ctx.measureText(h1.textContent);
  const inkTop = m.actualBoundingBoxAscent;
  const inkBottom = m.actualBoundingBoxDescent;
  if (!m.width || !(inkTop + inkBottom)) return;

  const fill = Math.min((100 * height) / (inkTop + inkBottom), (100 * width) / m.width);
  const size = Math.max(14, fill * NAME_SCALE);
  const s = size / 100;

  // Make the line exactly as tall as the letters, then nudge it so the letters' top
  // lines up with the line's top. (The browser puts the baseline at
  // half the leftover space + the font's ascent.)
  const lineHeight = (inkTop + inkBottom) * s;
  const baseline = (lineHeight - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent) * s) / 2 + m.fontBoundingBoxAscent * s;
  h1.style.fontSize = size + "px";
  h1.style.lineHeight = lineHeight + "px";
  h1.style.transform = `translateY(${inkTop * s - baseline}px)`;
}

// Fit again once the web font has loaded, and when the window changes size.
function refitProfileName() {
  const box = document.getElementById("screen-profile");
  if (box && !box.hidden) fitProfileName(box);
}
if (document.fonts) document.fonts.ready.then(refitProfileName);
let profileResizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(profileResizeTimer);
  profileResizeTimer = setTimeout(refitProfileName, 100);
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
        ${isOwn ? `<div class="pf-new"><button class="pf-btn pf-btn-light" onclick="openNewProjectDialog()">+ Create project</button></div>` : ""}
        ${current.length
          ? current.map((p) => folderHtml(p, user, "current", { actions: isOwn, canDelete: isOwn && p.owner === user.id })).join("")
          : emptyFolderHtml(user, isOwn)}
      </section>

      ${completed.length ? `
        <section class="pf-completed" aria-label="Completed projects">
          ${completed.map((p) => folderHtml(p, user, "completed", { canDelete: isOwn && p.owner === user.id })).join("")}
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

// size: "current" (full width) or "completed" (half width, also used on the Listings page)
// options:
//   actions: true  -> "Create listing" / "Edit listing" and "Mark as completed" (your own current projects)
//   canDelete: true -> trash can in the top right corner (projects you own, on your own profile)
//   tab: "..."     -> different text on the tab
//   inListing: true -> drawn next to its own listing post, so it doesn't repeat "Looking for"
//   link: false    -> not clickable (a listing whose project no longer exists)
function folderHtml(p, user, size, options = {}) {
  const others = p.members.filter((id) => id !== user.id).map(findUser).filter(Boolean);
  const challenge = p.submittedTo ? findChallenge(p.submittedTo) : null;
  // A current project with a listing says who it's looking for.
  const listing = p.status !== "done" ? projectListing(p) : null;
  const meta = [
    others.length ? `with ${others.map((u) => u.name).join(", ")}` : "",
    challenge ? `Submitted to the ${challenge.company} challenge` : "",
    listing && !options.inListing ? `Looking for: ${listing.role}` : "",
  ].filter(Boolean).join(" · ");
  const tab = options.tab || (size === "current" ? "Current Project" : shortDate(projectDate(p)) || "Completed");
  const link = options.link === false ? "" : `data-go="folder" data-id="${esc(p.id)}" data-from="${esc(user.id)}"`;

  return `
    <article class="folder folder-${size}" ${link}>
      <div class="folder-tab">${esc(tab)}</div>
      <div class="folder-back">
        <div class="folder-front">
          <div class="folder-info">
            <h2 class="folder-title">${esc(p.title)}</h2>
            ${meta ? `<div class="folder-meta">${esc(meta)}</div>` : ""}
            ${p.description ? `<p class="folder-desc">${esc(p.description)}</p>` : ""}
            ${options.actions ? folderActionsHtml(p, listing) : ""}
          </div>
          ${folderPhotoHtml(p)}
          ${folderStampsHtml(p, user)}
          ${options.canDelete ? `<button class="folder-delete" type="button" title="Delete project" aria-label="Delete ${esc(p.title)}" onclick="event.stopPropagation(); deleteProject('${esc(p.id)}')">${TRASH_ICON}</button>` : ""}
        </div>
      </div>
    </article>`;
}

// The big square for an uploaded photo. Empty until a photo exists.
function folderPhotoHtml(p) {
  const src = p.photos && p.photos[0];
  return `<div class="folder-photo">${src ? `<img src="${esc(src)}" alt="${esc(p.title)}" onerror="this.remove()">` : ""}</div>`;
}

// "Create listing" on a current project, or "Edit listing" and "View" once it has one.
// Listings are optional; "Mark as completed" moves the project to the completed folders.
// stopPropagation: pressing a button shouldn't also open the folder.
function folderActionsHtml(p, listing) {
  const id = esc(p.id);
  return `
    <div class="folder-actions">
      ${listing
        ? `<button class="pf-btn" onclick="event.stopPropagation(); openListingDialog('${id}')">Edit listing</button>
           <button class="pf-btn pf-btn-ghost" onclick="event.stopPropagation(); showScreen('listings', { id: '${esc(listing.id)}' })">View on Listings</button>`
        : `<button class="pf-btn" onclick="event.stopPropagation(); openListingDialog('${id}')">Create listing</button>`}
      ${p.status === "open" ? `<button class="pf-btn pf-btn-ghost" onclick="event.stopPropagation(); markProjectComplete('${id}')">✓ Mark as completed</button>` : ""}
    </div>`;
}

// The skills on the outside of a folder: the ones this person worked on.
// Each one is a circle with the skill's name in it. Once an industry reviewer certifies
// it, the circle becomes that level's badge (img/badges/), with the skill's name underneath.
function folderStampsHtml(p, user) {
  const tags = (p.skillTags || []).filter((t) => !t.people.length || t.people.includes(user.id));
  if (!tags.length) return "";
  return `<div class="folder-stamps" aria-label="Skills">
    ${tags.map((t) => folderStampHtml(p, user, t.skill)).join("")}
  </div>`;
}

function folderStampHtml(p, user, skill) {
  const cert = certifications.find((c) => c.project === p.id && c.user === user.id && c.skill === skill);
  if (!cert) return `<span class="folder-stamp">${esc(skill)}</span>`;
  const level = levelInfo(cert.level);
  const reviewer = certReviewer(cert);
  const label = `${level.label} ${skill}, verified by ${reviewer.company || reviewer.name}`;
  return `
    <span class="folder-badge" title="${esc(label)}">
      <img src="img/badges/${esc(level.id)}.png" alt="${esc(label)}">
      <span class="folder-badge-name">${esc(skill)}</span>
    </span>`;
}

// ---------- Finishing and deleting projects ----------
// Also used by the project view (folder.js).

async function markProjectComplete(projectId) {
  const p = findProject(projectId);
  if (!p || p.status !== "open") return;
  const ok = await confirmDialog({
    title: "Mark as completed?",
    text: `"${p.title}" moves to your completed projects, dated today. Any listing for it comes off the Listings page. ` +
      "You can still add pages, and you can submit it to a challenge from the Challenges page.",
    confirm: "Mark as completed",
  });
  if (!ok) return;
  p.status = "done";
  p.completedOn = today();
  save();
  refresh();
}

// Back to a current project. Not for projects in a challenge (their review depends on them).
async function reopenProject(projectId) {
  const p = findProject(projectId);
  if (!p || p.status !== "done" || p.submittedTo) return;
  const ok = await confirmDialog({ title: "Reopen this project?", text: `"${p.title}" moves back to your current projects.`, confirm: "Reopen" });
  if (!ok) return;
  p.status = "open";
  delete p.completedOn;
  save();
  refresh();
}

async function deleteProject(projectId) {
  const p = findProject(projectId);
  if (!p) return;
  const ok = await confirmDialog({
    title: "Delete this project?",
    text: `"${p.title}", its title card and all of its pages will be deleted` +
      (p.members.length > 1 ? " for everyone on the team" : "") +
      ". Any listing for it is taken down. This can't be undone.",
    confirm: "Delete project",
    danger: true,
  });
  if (!ok) return;
  const listing = projectListing(p);
  projects.splice(projects.indexOf(p), 1);
  for (let i = listings.length - 1; i >= 0; i--) {
    if (listings[i].project === p.id || listings[i] === listing) listings.splice(i, 1);
  }
  for (let i = feedback.length - 1; i >= 0; i--) {
    if (feedback[i].project === p.id) feedback.splice(i, 1);
  }
  save();
  refresh();
}

// Shown in place of the current project when there isn't one.
function emptyFolderHtml(user, isOwn) {
  return `
    <article class="folder folder-current folder-empty">
      <div class="folder-tab">Current Project</div>
      <div class="folder-back">
        <div class="folder-front">
          <div class="folder-info">
            <h2 class="folder-title">No current project</h2>
            <p class="folder-desc">${isOwn
              ? "Create a new project to get started. Need an idea? Look through the Challenges page for inspiration."
              : `${esc(firstName(user))} isn't working on a project at the moment.`}</p>
            ${isOwn ? `
              <div class="folder-actions">
                <button class="pf-btn" onclick="openNewProjectDialog()">Create project</button>
                <button class="pf-btn pf-btn-ghost" data-go="challenges">Browse challenges</button>
              </div>` : ""}
          </div>
        </div>
      </div>
    </article>`;
}

// ---------- Create project ----------
// "Create project" on your own profile opens this window, blank every time. It makes a new
// open project with you as the only member: a title card with no picture, no links and no
// pages yet. You can have as many current projects as you like. Every project lives on your
// profile; from there you can post a listing (optional) or submit it to a challenge (optional).

function openNewProjectDialog() {
  closeNewProjectDialog();
  const dialog = document.createElement("dialog");
  dialog.className = "np-dialog";
  dialog.id = "np-dialog";
  dialog.setAttribute("aria-labelledby", "np-title");
  dialog.innerHTML = newProjectFormHtml();
  document.body.appendChild(dialog);
  dialog.addEventListener("close", () => dialog.remove()); // Escape closes it too
  dialog.showModal();
  document.getElementById("np-name").focus();
}

function closeNewProjectDialog() {
  const dialog = document.getElementById("np-dialog");
  if (!dialog) return;
  if (dialog.open) dialog.close();
  dialog.remove();
}

// Going to another screen closes the window.
window.addEventListener("hashchange", closeNewProjectDialog);

function newProjectFormHtml() {
  return `
    <form class="np" onsubmit="createProject(event)" novalidate>
      <header class="np-head">
        <h2 class="np-title" id="np-title">New project</h2>
        <button type="button" class="np-x" onclick="closeNewProjectDialog()" aria-label="Close">✕</button>
      </header>

      <div class="np-body">
        <label class="np-field">
          <span class="np-label">Project name</span>
          <input id="np-name" type="text" maxlength="80" autocomplete="off" placeholder="e.g. Pocket Battery Health Monitor">
        </label>
        <label class="np-field">
          <span class="np-label">What are you building?</span>
          <textarea id="np-desc" rows="3" placeholder="A sentence or two. Tell the whole story in the project's pages as you go."></textarea>
        </label>
        <p class="np-error" id="np-error" role="alert"></p>
      </div>

      <footer class="np-foot">
        <button type="button" class="pf-btn pf-btn-ghost" onclick="closeNewProjectDialog()">Cancel</button>
        <button type="submit" class="pf-btn">Create project</button>
      </footer>
    </form>`;
}

// "Create project" was pressed: check the form, save the project, redraw.
function createProject(event) {
  event.preventDefault(); // stop the form from reloading the page
  const me = currentUser();
  const value = (id) => document.getElementById(id).value.trim();
  const title = value("np-name");

  // Older listings find their project by owner and title, so titles can't repeat.
  const taken = projects.some((p) => p.owner === me.id && p.title.toLowerCase() === title.toLowerCase());
  const problem = !title ? "Give your project a name." : taken ? "You already have a project with that name." : "";
  if (problem) {
    document.getElementById("np-error").textContent = problem;
    document.getElementById("np-name").focus();
    return;
  }

  const id = "project-" + Date.now();
  projects.push({
    id,
    title,
    owner: me.id,
    members: [me.id],
    status: "open",
    description: value("np-desc"),
    photos: [],
    links: [],
    pages: [],
    skillTags: [],
    submittedTo: null,
    startedOn: today(),
  });

  save();
  closeNewProjectDialog();
  refresh(); // the new project shows as a Current Project folder
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

// The photo sits in a big circle: green on top (the banner, with the name),
// cream below (major and bio). The stats box is on the right, under the banner.
function profileHeaderHtml(user, isOwn, stats) {
  const subtitle = user.role === "mentor"
    ? `${esc(user.title)} at ${esc(user.company)}`
    : `${esc(user.major)}${user.year ? " · " + esc(user.year) : ""}`;
  return `
    <section class="pf-header">
      <div class="pf-banner">
        <div class="pf-name">
          <h1>${esc(user.name)}</h1>
          ${user.role === "mentor" ? verifiedHtml(user) : ""}
        </div>
        ${isOwn ? "" : `<button class="pf-btn pf-btn-light" data-go="messages" data-with="${esc(user.id)}">Message</button>`}
      </div>
      <div class="pf-info">
        <div class="pf-sub">${subtitle}</div>
        ${user.role === "mentor" ? `<div class="pf-verified-small">${verifiedHtml(user)}</div>` : ""}
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
