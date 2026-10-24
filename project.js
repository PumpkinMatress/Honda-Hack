// project.js: the project page (demo step 5). Person C owns this file.
//
// showScreen("project", { id: "led-cube" })              -> one project
// showScreen("project", { id: "...", edit: "yes" })      -> same, with the write-up form open
//
// Team members of an open project can edit the write-up, check who did each
// skill, and submit it to a challenge. Everyone else sees it read-only, with
// any certifications it earned.

registerScreen("project", (box, params) => {
  const p = findProject(params.id);
  if (!p) {
    box.innerHTML = `
      <div class="empty-state card">
        <h2>Project not found</h2>
        <p class="muted">"Reset demo" may have removed it.</p>
        <button class="btn btn-primary" data-go="profile">Back to profile</button>
      </div>`;
    return;
  }

  const me = currentUser();
  const isMember = p.members.includes(me.id);
  const canEdit = isMember && p.status === "open";
  const challenge = projectChallenge(p);

  box.innerHTML = `
    ${projectBannerHtml(p, challenge, canEdit)}
    <div class="proj-layout">
      <div class="stack-lg">
        ${projectMainHtml(p, canEdit, params.edit === "yes")}
        ${projectCertsHtml(p)}
        ${projectSkillsHtml(p, canEdit, challenge)}
        ${canEdit ? projectSubmitHtml(p, challenge) : ""}
      </div>
      <aside class="stack-lg">
        ${projectTeamHtml(p)}
        ${challenge ? projectChallengeCardHtml(p, challenge) : ""}
        ${isMember ? projectFeedbackHtml(p) : ""}
      </aside>
    </div>`;
});

// ---------- Finding the project's challenge ----------

// The listing this project was made from (Person B's "Add to project"
// gives the project the same owner and title as the listing).
function projectListing(p) {
  return listings.find((l) => l.owner === p.owner && l.projectTitle === p.title);
}

// The challenge the project was submitted to, or the one its listing was for.
function projectChallenge(p) {
  if (p.submittedTo) return findChallenge(p.submittedTo);
  const listing = projectListing(p);
  return listing ? findChallenge(listing.challenge) : undefined;
}

// ---------- Banner at the top ----------

function projectBannerHtml(p, challenge, canEdit) {
  const me = currentUser();

  if (p.status === "submitted" && challenge) {
    if (canReview(me, p)) {
      return `
        <div class="banner row-between wrap">
          <span>📥 Submitted to your ${esc(challenge.company)} challenge on ${esc(formatDate(p.submittedOn))}. It's waiting for your review.</span>
          <button class="btn btn-primary btn-sm" data-go="review" data-project="${esc(p.id)}">Review this submission</button>
        </div>`;
    }
    const reviewer = findUser(challenge.postedBy);
    return `
      <div class="banner proj-banner-done">
        ✓ Submitted to the ${esc(challenge.company)} challenge on ${esc(formatDate(p.submittedOn))}.
        ${esc(reviewer ? reviewer.name : "A reviewer")} will review it and rate each skill.
      </div>`;
  }

  if (p.status === "open" && p.fastForwarded) {
    const names = p.members.map(findUser).filter(Boolean).map(firstName);
    return `
      <div class="banner proj-later">
        <div class="proj-later-title">4 weeks later…</div>
        <div class="proj-later-sub">${esc(joinNames(names))} ${names.length > 1 ? "have" : "has"} a working prototype. Time to tag skills and submit.</div>
      </div>`;
  }

  // Demo shortcut: jump to "4 weeks later" instead of typing the write-up on camera.
  if (canEdit && challenge && SAMPLE_PROGRESS[challenge.id]) {
    return `
      <div class="card proj-skip row-between wrap">
        <div class="grow">
          <span class="proj-demo-tag">Demo</span>
          <strong>Skip ahead 4 weeks</strong>
          <p class="muted small">Fills in the write-up and photos the team would have added while building.</p>
        </div>
        <button class="btn btn-primary" onclick="skipAheadFourWeeks('${esc(p.id)}')">⏩ Skip ahead</button>
      </div>`;
  }

  return "";
}

// What the project looks like after "Skip ahead 4 weeks", by challenge id.
// Photos fall back to colored boxes until these files are added to img/.
const SAMPLE_PROGRESS = {
  "honda-battery": {
    description:
      "A pocket-sized monitor that clips onto a small lithium-ion battery pack. It reads each cell's voltage, " +
      "the pack current, and temperature, estimates the pack's state of health, and shows a simple green, " +
      "yellow, or red rating on a small screen, so anyone can tell at a glance whether the battery is safe to use.\n\n" +
      "We built a test rig and ran a 4-cell pack through 40 charge and discharge cycles, checking every reading " +
      "against a bench multimeter. The readings stayed within 2% of the meter.",
    photos: [
      "img/battery-monitor-board.jpg",
      "img/battery-monitor-enclosure.jpg",
      "img/battery-monitor-testing.jpg",
    ],
    link: "https://github.com/example/battery-monitor",
  },
};

function skipAheadFourWeeks(projectId) {
  const p = findProject(projectId);
  const sample = SAMPLE_PROGRESS[projectChallenge(p).id];
  p.description = sample.description;
  p.photos = sample.photos.slice();
  p.link = sample.link;
  p.fastForwarded = true;
  save();
  refresh();
}

// ---------- Photos, title, and write-up ----------

function projectMainHtml(p, canEdit, editing) {
  return `
    <section class="card proj-header">
      ${projectGalleryHtml(p)}
      <div class="proj-header-body stack">
        <div class="row-between wrap">
          ${projectStatusHtml(p)}
          ${canEdit && !editing ? `<button class="btn btn-sm" data-go="project" data-id="${esc(p.id)}" data-edit="yes">Edit write-up</button>` : ""}
        </div>
        <h1>${esc(p.title)}</h1>
        ${editing ? projectEditFormHtml(p) : `
          ${p.description
            ? `<p class="proj-description">${esc(p.description)}</p>`
            : `<p class="muted">No write-up yet.</p>`}
          ${p.link ? `<a href="${esc(p.link)}" target="_blank" rel="noopener">🔗 ${esc(p.link.replace(/^https?:\/\//, ""))}</a>` : ""}`}
      </div>
    </section>`;
}

// Up to 3 photos: one big, the rest stacked beside it.
// Also used on the review screen (review.js).
function projectGalleryHtml(p) {
  const photos = (p.photos || []).slice(0, 3);
  if (!photos.length) return "";
  return `
    <div class="proj-gallery proj-gallery-${photos.length}">
      ${photos.map((src, i) => photoHtml(src, i ? `${p.title} ${i + 1}` : p.title)).join("")}
    </div>`;
}

function projectStatusHtml(p) {
  const label = p.status === "done" ? "Completed" : capitalize(p.status);
  return `<span class="status status-${p.status === "done" ? "done" : "open"}">${esc(label)}</span>`;
}

function projectEditFormHtml(p) {
  return `
    <div class="stack">
      <div class="field">
        <label for="proj-description">Write-up</label>
        <textarea id="proj-description" rows="7" placeholder="What did you build, and how well does it work?">${esc(p.description)}</textarea>
      </div>
      <div class="field">
        <label for="proj-link">Code or docs link</label>
        <input id="proj-link" type="url" value="${esc(p.link)}" placeholder="https://github.com/...">
      </div>
      <div class="row">
        <button class="btn btn-primary" onclick="saveProjectWriteUp('${esc(p.id)}')">Save</button>
        <button class="btn btn-ghost" data-go="project" data-id="${esc(p.id)}">Cancel</button>
      </div>
    </div>`;
}

function saveProjectWriteUp(projectId) {
  const p = findProject(projectId);
  p.description = document.getElementById("proj-description").value.trim();
  let link = document.getElementById("proj-link").value.trim();
  // Only allow web links, so a typo can't turn into a broken or unsafe link.
  if (link && !/^https?:\/\//i.test(link)) link = "https://" + link;
  p.link = link;
  save();
  showScreen("project", { id: p.id });
}

// ---------- Skills: who did what ----------

function projectSkillsHtml(p, canEdit, challenge) {
  const team = p.members.map(findUser).filter(Boolean);
  const tags = p.skillTags || [];
  const targets = challenge ? challenge.targetSkills : [];

  const header = `
    <tr>
      <th>Skill</th>
      ${team.map((u) => `<th class="proj-cell"><span class="proj-person">${avatarHtml(u, "sm")} ${esc(firstName(u))}</span></th>`).join("")}
      ${canEdit ? `<th class="proj-cell"></th>` : ""}
    </tr>`;

  const rows = tags.length
    ? tags.map((tag, row) => `
        <tr>
          <td>
            <span class="proj-skill-name">${esc(tag.skill)}</span>
            ${targets.includes(tag.skill) ? `<span class="proj-target" title="A target skill for the ${esc(challenge.company)} challenge">Target</span>` : ""}
          </td>
          ${team.map((u) => `<td class="proj-cell">${canEdit ? skillCheckboxHtml(p, row, tag, u) : skillCellHtml(p, tag, u)}</td>`).join("")}
          ${canEdit ? `<td class="proj-cell"><button class="btn btn-ghost btn-sm" title="Remove ${esc(tag.skill)}" onclick="removeSkillTag('${esc(p.id)}', ${row})">✕</button></td>` : ""}
        </tr>`).join("")
    : `<tr><td colspan="${team.length + 2}" class="muted small">No skills tagged yet.</td></tr>`;

  return `
    <section class="card">
      <h2>Skills: who did what</h2>
      <p class="muted small">${canEdit
        ? "Check everyone who worked on each skill. A reviewer rates each check separately, so only check what that person really did."
        : "Each check shows who did that part of the work. Levels are certified by industry reviewers."}</p>
      <div class="proj-table-wrap">
        <table class="proj-skills">
          <thead>${header}</thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      ${canEdit ? skillAdderHtml(p, targets) : ""}
    </section>`;
}

function skillCheckboxHtml(p, row, tag, user) {
  const checked = tag.people.includes(user.id) ? "checked" : "";
  return `
    <label class="proj-check-cell" title="${esc(user.name)} did ${esc(tag.skill)}">
      <input type="checkbox" ${checked} onchange="toggleSkillPerson('${esc(p.id)}', ${row}, '${esc(user.id)}', this.checked)">
    </label>`;
}

// Read-only cell: the certified level if there is one, otherwise a check.
function skillCellHtml(p, tag, user) {
  if (!tag.people.includes(user.id)) return `<span class="proj-dash">–</span>`;
  const cert = certifications.find((c) => c.project === p.id && c.user === user.id && c.skill === tag.skill);
  return cert ? levelPill(cert.level) : `<span class="proj-check">✓</span>`;
}

// The "Add a skill" dropdown, plus one-click suggestions from the challenge and listing.
function skillAdderHtml(p, targets) {
  const tagged = (p.skillTags || []).map((t) => t.skill);
  const listing = projectListing(p);
  const suggested = [...new Set([...targets, ...(listing ? listing.skillsNeeded : [])])]
    .filter((s) => !tagged.includes(s));
  const addable = SKILLS.filter((s) => !tagged.includes(s));
  if (!addable.length) return "";

  return `
    <div class="proj-add">
      <select onchange="addSkillTag('${esc(p.id)}', this.value)">
        <option value="">+ Add a skill you used…</option>
        ${addable.map((s) => `<option value="${esc(s)}">${esc(s)}</option>`).join("")}
      </select>
      ${suggested.length ? `
        <div class="row wrap">
          <span class="muted small">Suggested:</span>
          ${suggested.map((s) => `<button class="chip proj-suggest" data-skill="${esc(s)}" onclick="addSkillTag('${esc(p.id)}', this.dataset.skill)">+ ${esc(s)}</button>`).join("")}
        </div>` : ""}
    </div>`;
}

function addSkillTag(projectId, skill) {
  const p = findProject(projectId);
  if (!skill || p.skillTags.some((t) => t.skill === skill)) return;
  // On a solo project, the only member obviously did it.
  p.skillTags.push({ skill: skill, people: p.members.length === 1 ? [p.members[0]] : [] });
  save();
  redrawKeepScroll();
}

function removeSkillTag(projectId, row) {
  findProject(projectId).skillTags.splice(row, 1);
  save();
  redrawKeepScroll();
}

function toggleSkillPerson(projectId, row, personId, checked) {
  const p = findProject(projectId);
  const tag = p.skillTags[row];
  const people = checked ? tag.people.concat(personId) : tag.people.filter((id) => id !== personId);
  tag.people = p.members.filter((id) => people.includes(id)); // keep team order
  save();
  redrawKeepScroll();
}

// refresh() jumps to the top of the page. Ticking a box shouldn't.
function redrawKeepScroll() {
  const y = window.scrollY;
  refresh();
  window.scrollTo(0, y);
}

// ---------- Submitting to a challenge ----------

function projectSubmitHtml(p, challenge) {
  const id = esc(p.id);
  let action;
  if (challenge) {
    action = `<button class="btn btn-primary" onclick="submitProject('${id}', '${esc(challenge.id)}')">Submit to ${esc(challenge.company)} challenge</button>`;
  } else {
    // Not made from a challenge listing: let the team pick an open challenge.
    const open = challenges.filter((c) => today() <= c.closes);
    action = open.length
      ? `<div class="row">
           <select id="proj-challenge">${open.map((c) => `<option value="${esc(c.id)}">${esc(c.company)}: ${esc(c.title)}</option>`).join("")}</select>
           <button class="btn btn-primary" onclick="submitProject('${id}', document.getElementById('proj-challenge').value)">Submit</button>
         </div>`
      : `<span class="muted small">No challenges are open right now.</span>`;
  }

  const reviewer = challenge && findUser(challenge.postedBy);
  return `
    <section class="card proj-submit">
      <div class="row-between wrap">
        <div class="grow">
          <h3>Ready to submit?</h3>
          <p class="muted small">
            ${reviewer
              ? `${esc(reviewer.name)}, ${esc(reviewer.title)} at ${esc(challenge.company)}, will rate each checked skill.`
              : "An industry reviewer will rate each checked skill."}
            The skills table locks once you submit.
          </p>
        </div>
        ${action}
      </div>
      <p id="proj-submit-error" class="proj-error"></p>
    </section>`;
}

function submitProject(projectId, challengeId) {
  const p = findProject(projectId);
  const error = document.getElementById("proj-submit-error");
  if (!p.skillTags.length) {
    error.textContent = "Tag at least one skill first.";
    return;
  }
  const unchecked = p.skillTags.find((t) => !t.people.length);
  if (unchecked) {
    error.textContent = `Check who did ${unchecked.skill}, or remove it.`;
    return;
  }

  p.submittedTo = challengeId;
  p.submittedOn = today();
  p.status = "submitted";
  save();
  refresh();
}

// ---------- Side column ----------

// Authorship: who's on the team, and which skills each person did.
function projectTeamHtml(p) {
  const tags = p.skillTags || [];
  const team = p.members.map(findUser).filter(Boolean);
  return `
    <section class="card">
      <h3>Team</h3>
      ${team.map((u) => {
        const did = tags.filter((t) => t.people.includes(u.id)).map((t) => t.skill);
        return `
          <div class="proj-member" data-go="profile" data-user="${esc(u.id)}">
            ${avatarHtml(u, "md")}
            <div class="grow">
              <div><strong>${esc(u.name)}</strong>${u.id === p.owner ? ` <span class="role-tag">Owner</span>` : ""}</div>
              <div class="muted xsmall">${esc(u.major || u.title || "")}</div>
              ${did.length ? `<div class="chips">${did.map(skillChip).join("")}</div>` : ""}
            </div>
          </div>`;
      }).join("")}
    </section>`;
}

function projectChallengeCardHtml(p, ch) {
  return `
    <section class="card card-link" data-go="challenges" data-id="${esc(ch.id)}">
      <span class="company-tag">${esc(ch.company)} challenge</span>
      <h3>${esc(ch.title)}</h3>
      <div class="muted xsmall">${p.submittedOn ? `Submitted ${esc(formatDate(p.submittedOn))}` : `Closes ${esc(formatDate(ch.closes))}`}</div>
      <div class="chips">${ch.targetSkills.map(skillChip).join("")}</div>
    </section>`;
}

function projectCertsHtml(p) {
  const certs = sortCerts(certifications.filter((c) => c.project === p.id));
  if (!certs.length) return "";
  const reviewers = [...new Set(certs.map((c) => c.by))].map(findUser).filter(Boolean);
  return `
    <section class="section">
      <div class="section-head">
        <h2>Certified skills</h2>
        <span class="muted small">Rated by ${esc(joinNames(reviewers.map((r) => `${r.name}, ${r.company}`)))}</span>
      </div>
      <div class="cert-grid">${certs.map((c) => certBadgeHtml(c, { showStudent: true })).join("")}</div>
    </section>`;
}

// Private reviewer feedback. Only drawn for team members.
function projectFeedbackHtml(p) {
  const me = currentUser().id;
  const list = feedback.filter((f) => f.project === p.id && f.to.includes(me));
  if (!list.length) return "";
  return `
    <section class="card">
      <h3>Reviewer feedback</h3>
      <p class="muted small">🔒 Only the team can see this.</p>
      ${list.map(feedbackItemHtml).join("")}
    </section>`;
}

// ["Maya"] -> "Maya", ["Maya", "Jordan"] -> "Maya and Jordan", 3+ -> "A, B and C"
function joinNames(names) {
  if (names.length < 3) return names.join(" and ");
  return names.slice(0, -1).join(", ") + " and " + names[names.length - 1];
}
