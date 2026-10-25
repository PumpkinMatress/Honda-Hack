// review.js: the reviewer's queue and review form (demo step 6). Person C owns this file.
// Styles are in review.css (classes start with "rv-"). Same look as the project view:
// manila folders and index cards on the dark page.
//
// showScreen("review")                               -> submissions to the reviewer's company's challenges
// showScreen("review", { project: "solar-logger" })  -> score one submission (or see the finished review)
//
// Reviewing goes: queue -> the project's pages (folder.js, with { back: "review" }), where
// reviewPromptHtml says what to do and "Score this submission →" (top right) -> the scoring page.
//
// Submitting a review adds one skill certification (an entry in `certifications`) for every
// (skill, person) pair the team checked, plus one private `feedback` entry.

registerScreen("review", (box, params) => {
  const me = currentUser();
  if (me.role !== "mentor") {
    box.innerHTML = `
      <div class="rv">
        <header class="rv-head">
          <h1 class="rv-title">Reviewers only</h1>
          <p class="rv-intro">Switch "Viewing as" to an industry reviewer to see the review queue.</p>
        </header>
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
// (Also used by folder.js and challenge.js.)
function canReview(user, p) {
  const ch = findChallenge(p.submittedTo);
  return Boolean(ch) && user.role === "mentor" && user.company === ch.company;
}

// The skill certifications already given for this submission. Empty = not reviewed yet.
function reviewCerts(p) {
  return certifications.filter((c) => c.project === p.id && c.challenge === p.submittedTo);
}

// How many ratings a submission needs: one per checked person per skill.
function ratingCount(p) {
  return p.skillTags.reduce((n, t) => n + t.people.length, 0);
}

// ---------- The queue ----------
// Like the Listings page: each submission is the project's folder, with a cream box beside it.

function reviewQueueHtml(me) {
  const subs = projects.filter((p) => canReview(me, p)).reverse(); // newest first
  const waiting = subs.filter((p) => !reviewCerts(p).length);
  const done = subs.filter((p) => reviewCerts(p).length);

  return `
    <div class="rv">
      <header class="rv-head">
        <h1 class="rv-title">Review queue</h1>
        <p class="rv-intro">Projects submitted to ${esc(me.company)} challenges. Rate each skill the team checked.
          Every rating becomes a skill certification on that student's profile.</p>
      </header>

      <section class="rv-section" aria-label="Waiting for review">
        <h2 class="rv-section-title">Waiting for review <span class="rv-count">${waiting.length}</span></h2>
        ${waiting.length ? waiting.map(reviewItemHtml).join("") : `<p class="rv-none">You're all caught up.</p>`}
      </section>

      ${done.length ? `
        <section class="rv-section" aria-label="Reviewed">
          <h2 class="rv-section-title">Reviewed <span class="rv-count">${done.length}</span></h2>
          ${done.map(reviewItemHtml).join("")}
        </section>` : ""}
    </div>`;
}

// One submission: the folder on the left, the challenge, team and skills to rate on the right.
// Reviewing starts on the project's pages, so the reviewer looks at the work before scoring it.
function reviewItemHtml(p) {
  const ch = findChallenge(p.submittedTo);
  const owner = findUser(p.owner) || findUser(p.members[0]);
  const team = p.members.map(findUser).filter(Boolean);
  const certs = reviewCerts(p);
  const ratings = ratingCount(p);
  const id = esc(p.id);
  const skills = p.skillTags.filter((t) => t.people.length).map((t) => `
    <li><strong>${esc(t.skill)}</strong><span>${esc(joinNames(t.people.map(findUser).filter(Boolean).map(firstName)))}</span></li>`).join("");

  return `
    <article class="rv-item">
      <div class="rv-folder">
        ${folderHtml(p, owner, "completed", { tab: certs.length ? "Reviewed" : "To review", go: { go: "folder", id: p.id, back: "review" } })}
      </div>
      <div class="rv-box">
        <header class="rv-box-head">
          <span class="rv-tag">🏁 ${esc(ch.company)} challenge</span>
          ${p.submittedOn ? `<span class="rv-date">Submitted ${esc(formatDate(p.submittedOn))}</span>` : ""}
        </header>
        <div class="rv-box-body">
          <p class="rv-challenge">${esc(ch.title)}</p>
          <div class="rv-team">${team.map((u) => `<span class="rv-person">${avatarHtml(u, "sm")} ${esc(u.name)}</span>`).join("")}</div>
          <div>
            <span class="rv-label">${certs.length ? "Skills rated" : "Skills to rate"}</span>
            <ul class="rv-skills">${skills}</ul>
          </div>
        </div>
        <footer class="rv-box-foot">
          ${certs.length
            ? `<span class="rv-done-mark">✓ Reviewed ${esc(formatDate(certs[0].date))}</span>
               <button class="pf-btn pf-btn-ghost" data-go="review" data-project="${id}">See review</button>`
            : `<button class="pf-btn" data-go="folder" data-id="${id}" data-back="review">Review · ${ratings} ${ratings === 1 ? "rating" : "ratings"}</button>`}
        </footer>
      </div>
    </article>`;
}

// ---------- On the project's pages (folder.js) ----------

// Above the title card, for the company's reviewer while it's waiting: what to do.
// The way on is "Score this submission →" in the top right (folderChallengeLinkHtml in folder.js).
function reviewPromptHtml(p) {
  if (!canReview(currentUser(), p) || reviewCerts(p).length) return "";
  const ch = findChallenge(p.submittedTo);
  return `
    <div class="rv-strip">
      <span class="rv-strip-kicker">🏁 ${esc(ch.company)} challenge${p.submittedOn ? ` · Submitted ${esc(formatDate(p.submittedOn))}` : ""}</span>
      <div class="rv-strip-title">You're reviewing ${esc(p.title)}</div>
      <p class="rv-strip-text">Look through the title card and the pages first, then score each skill the team checked.</p>
    </div>`;
}

// ---------- The scoring page ----------
// Index cards for the ratings and the feedback. No title card: the project's pages are one click back.

function reviewFormHtml(p) {
  const ch = findChallenge(p.submittedTo);
  const team = p.members.map(findUser).filter(Boolean);
  const ratings = ratingCount(p);

  // The row number stays the skill's place in p.skillTags, which submitReview reads back.
  const skills = p.skillTags.map((tag, row) => !tag.people.length ? "" : `
    <div class="nc-box sk-box rv-skill">
      <div class="rv-skill-head">
        <h3 class="rv-skill-name">${esc(tag.skill)}</h3>
        ${ch.targetSkills.includes(tag.skill) ? `<span class="sk-tag">Challenge target</span>` : ""}
        ${tag.people.length > 1 ? `<span class="rv-shared">Shared work: rate each person on their own</span>` : ""}
      </div>
      ${tag.people.map(findUser).filter(Boolean).map((u) => reviewRateRowHtml(row, u)).join("")}
    </div>`).join("");

  return `
    <div class="nb">
      <div class="nb-top">
        <button class="nb-link" data-go="folder" data-id="${esc(p.id)}" data-back="review">&larr; Back to the project's pages</button>
      </div>

      <div class="rv-strip">
        <span class="rv-strip-kicker">🏁 ${esc(ch.company)} challenge: ${esc(ch.title)}</span>
        <h1 class="rv-strip-title">Scoring ${esc(p.title)}</h1>
        <div class="rv-team">${team.map((u) => `<span class="rv-person">${avatarHtml(u, "sm")} ${esc(u.name)}</span>`).join("")}</div>
      </div>

      <section class="nc" aria-labelledby="rv-rate-title">
        <header class="nc-head">
          <span class="nb-hole" aria-hidden="true"></span>
          <h2 class="nc-title sk-card-title" id="rv-rate-title">Rate each skill</h2>
          <span class="nc-date">${ratings} ${ratings === 1 ? "rating" : "ratings"}</span>
        </header>
        <div class="sk-body sk-body-1">
          <div class="nc-box sk-box">
            <h3 class="nc-box-title">What the levels mean</h3>
            <p>The team checked who did each skill. Rate each person on what this project shows.
              Every rating becomes a skill certification on that student's profile, with this badge.</p>
            <ul class="rv-legend">
              ${LEVELS.map((l) => `
                <li>
                  <img src="img/badges/${esc(l.id)}.png" alt="">
                  <strong>${esc(l.label)}</strong>
                  <span>${esc(l.meaning)}</span>
                </li>`).join("")}
            </ul>
          </div>
          ${skills}
        </div>
      </section>

      <section class="nc sk-card" aria-labelledby="rv-feedback-title">
        <header class="nc-head">
          <span class="nb-hole" aria-hidden="true"></span>
          <h2 class="nc-title sk-card-title" id="rv-feedback-title">Private feedback</h2>
          <span class="nc-date">🔒 Only ${esc(joinNames(team.map(firstName)))} will see this</span>
        </header>
        <div class="sk-body">
          <label class="nc-box sk-box rv-note">
            <span class="nc-box-title">What was done well</span>
            <textarea id="rev-done-well" rows="5"></textarea>
          </label>
          <label class="nc-box sk-box rv-note">
            <span class="nc-box-title">What to improve</span>
            <textarea id="rev-to-improve" rows="5"></textarea>
          </label>
        </div>
      </section>

      <div class="nb-actions">
        <p id="rev-error" class="rv-error" role="alert"></p>
        <button class="pf-btn pf-btn-light" onclick="submitReview('${esc(p.id)}')">Submit review and award skill certifications</button>
      </div>
    </div>`;
}


// One person's rating for one skill: four level buttons, and what the chosen level means.
function reviewRateRowHtml(row, user) {
  const name = `rev-${row}-${user.id}`;
  return `
    <div class="rv-rate">
      <span class="rv-person">${avatarHtml(user, "sm")} <strong>${esc(user.name)}</strong></span>
      <div class="rv-levels" role="radiogroup" aria-label="Level for ${esc(user.name)}">
        ${LEVELS.map((l) => `
          <label class="rv-level level-${esc(l.id)}" title="${esc(l.meaning)}">
            <input type="radio" name="${esc(name)}" value="${esc(l.id)}" onchange="showLevelMeaning(this)">
            <span>${esc(l.label)}</span>
          </label>`).join("")}
      </div>
      <p class="rv-meaning">Pick a level.</p>
    </div>`;
}

// A level was picked: show its badge and what it means.
function showLevelMeaning(input) {
  const level = levelInfo(input.value);
  input.closest(".rv-rate").querySelector(".rv-meaning").innerHTML =
    `<img src="img/badges/${esc(level.id)}.png" alt=""><span><strong>${esc(level.label)}:</strong> ${esc(level.meaning)}</span>`;
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

  // One skill certification per person per skill (same fields as the sample in data.js).
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

  // Reviewed: the project moves to the team's completed projects, dated today
  // (a project that was already finished keeps the day it was finished).
  p.status = "done";
  p.completedOn = p.completedOn || today();
  save();
  refresh(); // same screen, now showing the finished review

  // Sign each new skill certification with the company's key (credential.js),
  // so the students can share a link that anyone can check.
  if (typeof signCertifications === "function") signCertifications(awarded);
}

// ---------- After the review ----------
// The project's skills card (project.js): every skill certification, each opening its credential.

function reviewDoneHtml(p) {
  const certs = reviewCerts(p);
  const reviewer = certReviewer(certs[0]);
  const team = p.members.map(findUser).filter(Boolean);
  const names = joinNames(team.map(firstName));
  const notes = feedback.filter((f) => f.project === p.id && f.from === certs[0].by);
  const n = certs.length;

  return `
    <div class="nb">
      <div class="nb-top">
        <button class="nb-link" data-go="review">&larr; Back to review queue</button>
        <button class="nb-link" data-go="folder" data-id="${esc(p.id)}" data-back="review">Open the project's pages &rarr;</button>
      </div>

      <div class="rv-strip">
        <span class="rv-strip-kicker">✓ Review sent · ${esc(formatDate(certs[0].date))}</span>
        <div class="rv-strip-title">${n} skill ${n === 1 ? "certification" : "certifications"} awarded to ${esc(names)}</div>
        <p class="rv-strip-text">${n === 1 ? "It now shows" : "They now show"} on ${team.length > 1 ? "their profiles" : "their profile"}.
          🔏 Each one is digitally signed with ${esc(reviewer.company)}'s key, so ${esc(names)} can add ${n === 1 ? "it" : "them"} to LinkedIn
          and anyone with the link can check ${n === 1 ? "it's" : "they're"} real. Click one to open its credential.</p>
      </div>

      ${projectSkillsCardHtml(p)}
      ${feedbackCardHtml(notes, "Your private feedback")}

      <div class="nb-actions">
        ${team.map((u) => `<button class="pf-btn pf-btn-light" data-go="profile" data-user="${esc(u.id)}">View ${esc(firstName(u))}'s profile</button>`).join("")}
      </div>
    </div>`;
}
