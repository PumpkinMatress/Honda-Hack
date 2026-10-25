// review.js: the reviewer's queue and review form (demo step 6). Person C owns this file.
//
// showScreen("review")                               -> submissions to the reviewer's company's challenges
// showScreen("review", { project: "solar-logger" })  -> review one submission (or see the finished review)
//
// Submitting a review adds one entry to `certifications` for every
// (skill, person) pair the team checked, plus one private `feedback` entry.

registerScreen("review", (box, params) => {
  const me = currentUser();
  if (me.role !== "mentor") {
    box.innerHTML = `
      <div class="empty-state card">
        <h2>Reviewers only</h2>
        <p class="muted">Switch "Viewing as" to an industry reviewer to see the review queue.</p>
      </div>`;
    return;
  }

  const p = findProject(params.project);
  if (!p || !canReview(me, p)) {
    box.innerHTML = reviewQueueHtml(me);
    return;
  }
  box.innerHTML = reviewCerts(p).length ? reviewDoneHtml(p) : reviewFormHtml(p);
});

// Reviewers review submissions to their own company's challenges.
// (Also used by project.js to show a "Review this submission" button.)
function canReview(user, p) {
  const ch = findChallenge(p.submittedTo);
  return Boolean(ch) && user.role === "mentor" && user.company === ch.company;
}

// The certifications already given for this submission. Empty = not reviewed yet.
function reviewCerts(p) {
  return certifications.filter((c) => c.project === p.id && c.challenge === p.submittedTo);
}

// ---------- The queue ----------

function reviewQueueHtml(me) {
  const subs = projects.filter((p) => canReview(me, p)).reverse(); // newest first
  const waiting = subs.filter((p) => !reviewCerts(p).length);
  const done = subs.filter((p) => reviewCerts(p).length);

  return `
    <div class="rev-page stack-lg">
      <div class="section-head">
        <h1>Review queue</h1>
        <span class="muted small">Projects submitted to ${esc(me.company)} challenges</span>
      </div>

      <section class="section">
        <div class="section-head"><h2>Waiting for review <span class="rev-count">${waiting.length}</span></h2></div>
        ${waiting.length
          ? `<div class="stack">${waiting.map(reviewItemHtml).join("")}</div>`
          : `<div class="empty-state card"><p class="muted">You're all caught up.</p></div>`}
      </section>

      ${done.length ? `
        <section class="section">
          <div class="section-head"><h2>Reviewed <span class="rev-count">${done.length}</span></h2></div>
          <div class="stack">${done.map(reviewItemHtml).join("")}</div>
        </section>` : ""}
    </div>`;
}

function reviewItemHtml(p) {
  const ch = findChallenge(p.submittedTo);
  const team = p.members.map(findUser).filter(Boolean);
  const ratings = p.skillTags.reduce((n, t) => n + t.people.length, 0);
  const reviewed = reviewCerts(p).length > 0;

  return `
    <article class="card card-link rev-item" data-go="review" data-project="${esc(p.id)}">
      <div class="rev-thumb">${photoHtml(p.photos && p.photos[0], p.title)}</div>
      <div class="grow rev-item-body">
        <span class="challenge-tag">🏁 ${esc(ch.company)}: ${esc(ch.title)}</span>
        <h3>${esc(p.title)}</h3>
        <div class="row">
          <span class="avatar-stack">${team.map((u) => avatarHtml(u, "sm")).join("")}</span>
          <span class="muted small">${esc(joinNames(team.map((u) => u.name)))}${p.submittedOn ? ` · submitted ${esc(formatDate(p.submittedOn))}` : ""}</span>
        </div>
        <div class="chips">${p.skillTags.map((t) => skillChip(t.skill)).join("")}</div>
      </div>
      <div class="rev-item-action">
        ${reviewed
          ? `<span class="status status-done">✓ Reviewed</span>`
          : `<span class="btn btn-primary btn-sm">Review · ${ratings} ${ratings === 1 ? "rating" : "ratings"}</span>`}
      </div>
    </article>`;
}

// ---------- The review form ----------

function reviewFormHtml(p) {
  const ch = findChallenge(p.submittedTo);
  const team = p.members.map(findUser).filter(Boolean);

  const skills = p.skillTags.map((tag, row) => `
    <div class="rev-skill">
      <div class="rev-skill-head">
        <h3>${esc(tag.skill)}</h3>
        ${ch.targetSkills.includes(tag.skill) ? `<span class="rev-target">Challenge target skill</span>` : ""}
        ${tag.people.length > 1 ? `<span class="muted xsmall">Shared work: rate each person separately</span>` : ""}
      </div>
      ${tag.people.map(findUser).filter(Boolean).map((u) => reviewRateRowHtml(row, u)).join("")}
    </div>`).join("");

  return `
    <div class="rev-page stack-lg">
      <div><button class="btn btn-ghost btn-sm" data-go="review">&larr; Back to queue</button></div>

      ${reviewSummaryHtml(p, ch, team)}

      <section class="card">
        <h2>Rate each skill</h2>
        <p class="muted">The team checked who did each skill. Rate each person on what this project shows.
          Every rating becomes a certification badge on that student's public profile.</p>
        <div class="rev-legend">
          ${LEVELS.map((l) => `<div>${levelPill(l.id)}<p class="muted xsmall">${esc(l.meaning)}</p></div>`).join("")}
        </div>
        <div class="rev-skills">${skills}</div>
      </section>

      <section class="card">
        <h2>Private feedback</h2>
        <p class="muted small">🔒 Only ${esc(joinNames(team.map(firstName)))} will see this. It isn't shown on the public project page.</p>
        <div class="field">
          <label for="rev-done-well">What was done well</label>
          <textarea id="rev-done-well" placeholder="e.g. Clean board layout and a careful test plan."></textarea>
        </div>
        <div class="field">
          <label for="rev-to-improve">What to improve</label>
          <textarea id="rev-to-improve" placeholder="e.g. Log temperature during charging, not just discharging."></textarea>
        </div>
      </section>

      <div class="rev-submit">
        <p id="rev-error" class="rev-error"></p>
        <button class="btn btn-primary" onclick="submitReview('${esc(p.id)}')">Submit review and award certifications</button>
      </div>
    </div>`;
}

// What the reviewer is looking at: photos, write-up, team, link.
function reviewSummaryHtml(p, ch, team) {
  return `
    <section class="card rev-summary">
      <div class="rev-summary-info stack">
        <span class="challenge-tag">🏁 ${esc(ch.company)}: ${esc(ch.title)}</span>
        <h1>${esc(p.title)}</h1>
        <div class="row wrap">
          ${team.map((u) => `<span class="row rev-member">${avatarHtml(u, "sm")} ${esc(u.name)}</span>`).join("")}
        </div>
        ${p.description ? `<p class="proj-description">${esc(p.description)}</p>` : `<p class="muted">No write-up.</p>`}
        <div class="row wrap">
          ${p.link ? `<a href="${esc(p.link)}" target="_blank" rel="noopener">🔗 ${esc(p.link.replace(/^https?:\/\//, ""))}</a>` : ""}
          <a href="#" data-go="project" data-id="${esc(p.id)}">Open project page &rarr;</a>
        </div>
      </div>
      ${p.photos && p.photos.length ? `<div class="rev-summary-photos">${projectGalleryHtml(p)}</div>` : ""}
    </section>`;
}

// One person's rating for one skill: four level buttons, and what the chosen level means.
function reviewRateRowHtml(row, user) {
  const name = `rev-${row}-${user.id}`;
  return `
    <div class="rev-rate">
      <div class="row rev-person">${avatarHtml(user, "sm")} <strong>${esc(user.name)}</strong></div>
      <div class="rev-levels" role="radiogroup" aria-label="Level for ${esc(user.name)}">
        ${LEVELS.map((l) => `
          <label class="rev-level level-${esc(l.id)}" title="${esc(l.meaning)}">
            <input type="radio" name="${esc(name)}" value="${esc(l.id)}" onchange="showLevelMeaning(this)">
            <span>${esc(l.label)}</span>
          </label>`).join("")}
      </div>
      <p class="rev-meaning muted xsmall">Pick a level.</p>
    </div>`;
}

function showLevelMeaning(input) {
  input.closest(".rev-rate").querySelector(".rev-meaning").textContent = levelInfo(input.value).meaning;
  document.getElementById("rev-error").textContent = ""; // clear any old "Pick a level" message
}

// "Submit review" was clicked: check every rating is picked, then save it all.
function submitReview(projectId) {
  const p = findProject(projectId);
  const me = currentUser();

  const ratings = [];
  let missing = null;
  p.skillTags.forEach((tag, row) => {
    tag.people.forEach((userId) => {
      const picked = document.querySelector(`input[name="rev-${row}-${userId}"]:checked`);
      if (picked) ratings.push({ user: userId, skill: tag.skill, level: picked.value });
      else if (!missing) missing = `${tag.skill} (${findUser(userId).name})`;
    });
  });
  if (missing) {
    document.getElementById("rev-error").textContent = `Pick a level for ${missing}.`;
    return;
  }

  // One certification per person per skill (same fields as the sample in data.js).
  // Each gets its own ID, plus the reviewer's name, title and company as they are today.
  const awarded = [];
  for (const r of ratings) {
    const cert = {
      id: newCredentialId(),
      user: r.user,
      skill: r.skill,
      level: r.level,
      by: me.id,
      reviewer: { name: me.name, title: me.title || "", company: me.company || "" },
      project: p.id,
      challenge: p.submittedTo,
      date: today(),
    };
    certifications.push(cert);
    awarded.push(cert);
  }

  const doneWell = document.getElementById("rev-done-well").value.trim();
  const toImprove = document.getElementById("rev-to-improve").value.trim();
  if (doneWell || toImprove) {
    feedback.push({
      project: p.id,
      from: me.id,
      to: p.members.slice(),
      doneWell: doneWell,
      toImprove: toImprove,
      date: today(),
    });
  }

  // Reviewed: the project moves to the team's "Past projects".
  p.status = "done";
  save();
  refresh(); // same screen, now showing the finished review

  // Sign each new certification with the company's key (credential.js),
  // so the students can share a link that anyone can check.
  if (typeof signCertifications === "function") signCertifications(awarded);
}

// ---------- After the review ----------

function reviewDoneHtml(p) {
  const certs = sortCerts(reviewCerts(p));
  const reviewer = findUser(certs[0].by);
  const team = p.members.map(findUser).filter(Boolean);
  const notes = feedback.filter((f) => f.project === p.id && f.from === reviewer.id);

  return `
    <div class="rev-page stack-lg">
      <div><button class="btn btn-ghost btn-sm" data-go="review">&larr; Back to queue</button></div>

      <div class="banner proj-banner-done">
        ✓ Review sent on ${esc(formatDate(certs[0].date))}. ${certs.length} ${certs.length === 1 ? "certification" : "certifications"}
        awarded to ${esc(joinNames(team.map(firstName)))}. They now show on ${team.length > 1 ? "their profiles" : "their profile"}.
      </div>

      <section class="section">
        <div class="section-head">
          <h2>${esc(p.title)}</h2>
          <span class="muted small">Certified by ${esc(reviewer.name)}, ${esc(reviewer.company)}</span>
        </div>
        <div class="cert-grid">${certs.map((c) => certBadgeHtml(c, { showStudent: true })).join("")}</div>
        <p class="muted small rev-signed">🔏 Each one is digitally signed with ${esc(reviewer.company)}'s key.
          ${esc(joinNames(team.map(firstName)))} can add ${certs.length === 1 ? "it" : "them"} to LinkedIn, and anyone with the link can check ${certs.length === 1 ? "it's" : "they're"} real.</p>
      </section>

      ${notes.length ? `
        <section class="card">
          <h3>Your private feedback</h3>
          ${notes.map(feedbackItemHtml).join("")}
        </section>` : ""}

      <div class="row wrap">
        ${team.map((u) => `<button class="btn" data-go="profile" data-user="${esc(u.id)}">View ${esc(firstName(u))}'s profile</button>`).join("")}
        <button class="btn btn-ghost" data-go="project" data-id="${esc(p.id)}">Open project page</button>
      </div>
    </div>`;
}
