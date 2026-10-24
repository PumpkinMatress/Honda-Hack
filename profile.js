// profile.js — the profile page (demo screens 1 and 7). Owned by Person A.
//
// showScreen("profile")                    -> the "Viewing as" person's own profile
// showScreen("profile", { user: "jordan" }) -> someone else's profile

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
  const past = mine.filter((p) => p.status === "done").reverse(); // newest first
  const certs = sortCerts(certifications.filter((c) => c.user === user.id));
  const myFeedback = feedback.filter((f) => f.to.includes(user.id)).reverse();

  return `
    ${profileHeaderHtml(user, isOwn, [
      { n: mine.length, label: mine.length === 1 ? "project" : "projects" },
      { n: certs.length, label: certs.length === 1 ? "certified skill" : "certified skills" },
    ])}

    <div class="profile-layout">
      <div class="stack-lg">
        <section class="section">
          <div class="section-head">
            <h2>Certifications</h2>
            <span class="muted small">Skill ratings from verified industry reviewers</span>
          </div>
          ${certs.length
            ? `<div class="cert-grid">${certs.map(certBadgeHtml).join("")}</div>`
            : `<div class="empty-state card">
                 <div class="empty-icon" aria-hidden="true">🏅</div>
                 <p><strong>No certifications yet.</strong></p>
                 <p class="muted">${isOwn ? "Submit a project to a challenge" : `${esc(firstName(user))} can submit a project to a challenge`}. An industry reviewer rates each tagged skill, and the badges show up here.</p>
                 ${isOwn ? `<button class="btn btn-primary" data-go="challenges">Browse challenges</button>` : ""}
               </div>`}
        </section>

        <section class="section">
          <div class="section-head"><h2>Current projects</h2></div>
          ${current.length
            ? `<div class="project-grid">${current.map(projectCardHtml).join("")}</div>`
            : `<div class="empty-state card"><p class="muted">No open projects right now.</p></div>`}
        </section>

        <section class="section">
          <div class="section-head"><h2>Past projects</h2></div>
          ${past.length
            ? `<div class="project-grid">${past.map(projectCardHtml).join("")}</div>`
            : `<div class="empty-state card"><p class="muted">No finished projects yet.</p></div>`}
        </section>
      </div>

      <aside class="stack-lg">
        <section class="card">
          <h3>Skills</h3>
          <p class="muted small">Listed by ${esc(firstName(user))}. Certified skills are marked.</p>
          <div class="chips">${skillListHtml(user, certs)}</div>
        </section>

        ${isOwn ? privateFeedbackHtml(myFeedback) : ""}
      </aside>
    </div>`;
}

// Self-listed skills plus any skill they've been certified in, best level shown.
function skillListHtml(user, certs) {
  const best = {};
  for (const c of certs) {
    if (!best[c.skill] || levelInfo(c.level).rank > levelInfo(best[c.skill]).rank) best[c.skill] = c.level;
  }
  const all = [...new Set([...(user.skills || []), ...Object.keys(best)])];
  if (!all.length) return `<span class="muted small">No skills listed.</span>`;
  return all
    .map((skill) => best[skill]
      ? `<span class="chip chip-certified level-${esc(best[skill])}" title="${esc(levelInfo(best[skill]).label)}, certified">✓ ${esc(skill)}</span>`
      : skillChip(skill))
    .join("");
}

function privateFeedbackHtml(list) {
  return `
    <section class="card">
      <h3>Reviewer feedback</h3>
      <p class="muted small">🔒 Only you can see this.</p>
      ${list.length ? list.map(feedbackItemHtml).join("") : `<p class="muted small">No feedback yet.</p>`}
    </section>`;
}

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

// ---------- Mentors ----------

function mentorProfileHtml(user, isOwn) {
  const posted = challenges.filter((c) => c.postedBy === user.id);
  const given = sortCerts(certifications.filter((c) => c.by === user.id));
  const reviewedProjects = new Set(given.map((c) => c.project)).size;

  return `
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
          ${isOwn ? `<button class="btn btn-primary btn-sm" data-go="review">Open review queue</button>` : ""}
        </div>
        ${given.length
          ? `<div class="cert-grid">${given.map((c) => certBadgeHtml(c, { showStudent: true })).join("")}</div>`
          : `<div class="empty-state card"><p class="muted">No reviews yet.</p></div>`}
      </section>
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

// ---------- Shared pieces ----------

function profileHeaderHtml(user, isOwn, stats) {
  const subtitle = user.role === "mentor"
    ? `${esc(user.title)} at <strong>${esc(user.company)}</strong>`
    : `${esc(user.major)}${user.year ? " · " + esc(user.year) : ""}`;
  return `
    <section class="profile-header card">
      <div class="profile-banner" style="--hue:${hueFor(user.id)}"></div>
      <div class="profile-header-body">
        ${avatarHtml(user, "xl")}
        <div class="grow">
          <div class="row wrap">
            <h1>${esc(user.name)}</h1>
            ${user.role === "mentor" ? verifiedHtml(user) : `<span class="role-tag">Student</span>`}
          </div>
          <div class="muted">${subtitle}</div>
          ${user.bio ? `<p class="bio">${esc(user.bio)}</p>` : ""}
          <div class="stats">
            ${stats.map((s) => `<div class="stat"><strong>${s.n}</strong> ${esc(s.label)}</div>`).join("")}
          </div>
        </div>
        <div class="profile-actions">
          ${isOwn
            ? `<span class="muted small">This is your profile</span>`
            : `<button class="btn btn-primary" data-go="messages" data-with="${esc(user.id)}">Message</button>`}
        </div>
      </div>
    </section>`;
}

// Used on profiles. Also fine to reuse on a projects feed.
function projectCardHtml(p) {
  const projectCerts = sortCerts(certifications.filter((c) => c.project === p.id));
  const challenge = p.submittedTo ? findChallenge(p.submittedTo) : null;
  const team = p.members.map(findUser).filter(Boolean);
  const statusLabel = p.status === "done" ? "Completed" : p.status === "open" ? "Open" : capitalize(p.status);

  return `
    <article class="card card-link project-card" data-go="project" data-id="${esc(p.id)}">
      ${photoHtml(p.photos && p.photos[0], p.title)}
      <div class="project-card-body">
        <div class="row-between">
          <span class="status status-${p.status === "done" ? "done" : "open"}">${esc(statusLabel)}</span>
          <span class="avatar-stack">${team.map((u) => avatarHtml(u, "sm")).join("")}</span>
        </div>
        <h3>${esc(p.title)}</h3>
        <p class="muted small clamp-2">${esc(p.description)}</p>
        ${challenge ? `<div class="challenge-tag">🏁 Submitted to ${esc(challenge.company)}: ${esc(challenge.title)}</div>` : ""}
        <div class="chips">${(p.skillTags || []).map((t) => skillChip(t.skill)).join("")}</div>
        ${projectCerts.length
          ? `<div class="mini-certs">${projectCerts.map(miniCertHtml).join("")}</div>`
          : ""}
      </div>
    </article>`;
}

function miniCertHtml(cert) {
  const person = findUser(cert.user);
  const level = levelInfo(cert.level);
  return `<span class="mini-cert level-${esc(level.id)}" title="${esc(level.label)} ${esc(cert.skill)}, ${esc(person ? person.name : "")}">
    ${esc(level.label)} · ${esc(cert.skill)}${person ? ` · ${esc(firstName(person))}` : ""}
  </span>`;
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
