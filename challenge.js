// challenge.js: the challenges board (every challenge, pinned to a corkboard) and the
// "Submit" window where a student picks one of their completed projects to enter.
// Person B owns this file. Styles are in challenge.css.
//
// showScreen("challenges")                         -> the board
// showScreen("challenges", { id: "aep-sensor" })   -> the board, scrolled to that challenge
//
// Submitting sets the project's submittedTo and submittedOn. The project then shows up
// in the company reviewer's review queue (review.js), like any other submission.
//
// Helpers like esc, findUser, formatDate, today come from core.js;
// projectDate and shortDate come from profile.js.

// Company logos. Put the files in img/logos/. Until a file exists, the box shows the name.
const COMPANY_LOGOS = {
  Honda: "img/logos/honda.png",
  AEP: "img/logos/aep.png",
};

registerScreen("challenges", (box, params) => {
  const now = today();
  // Open challenges first (closing soonest at the top), then closed ones.
  const sorted = challenges.slice().sort((a, b) => {
    const aOpen = now <= a.closes, bOpen = now <= b.closes;
    if (aOpen !== bOpen) return aOpen ? -1 : 1;
    return aOpen ? a.closes.localeCompare(b.closes) : b.closes.localeCompare(a.closes);
  });

  box.innerHTML = `<div class="ch-board">${sorted.map(challengeCardHtml).join("")}</div>`;

  // Coming from search or a link: scroll to that challenge and point it out.
  const target = params.id && document.getElementById("ch-" + params.id);
  if (target) {
    requestAnimationFrame(() => {
      target.scrollIntoView({ block: "center" });
      target.classList.add("is-focus");
    });
  }
});

// One pinned note.
function challengeCardHtml(ch) {
  const open = today() <= ch.closes;
  return `
    <article class="ch-card ${open ? "" : "is-closed"}" id="ch-${esc(ch.id)}">
      <span class="ch-pin ch-pin-left" aria-hidden="true"></span>
      <span class="ch-pin ch-pin-right" aria-hidden="true"></span>
      <header class="ch-head">
        <span class="ch-company">${esc(ch.company)} challenge</span>
        ${companyLogoHtml(ch.company)}
      </header>
      <h2 class="ch-title">${esc(ch.title)}</h2>
      <p class="ch-prompt">${esc(ch.prompt)}</p>
      ${mySubmissionsHtml(ch)}
      <footer class="ch-foot">
        <div class="ch-actions">${challengeActionHtml(ch, open)}</div>
        <dl class="ch-dates">
          <div><dt>Start date</dt><dd>${esc(slashDate(ch.opens))}</dd></div>
          <div><dt>End date</dt><dd>${esc(slashDate(ch.closes))}</dd></div>
        </dl>
      </footer>
    </article>`;
}

function companyLogoHtml(company) {
  const src = COMPANY_LOGOS[company];
  return `
    <span class="ch-logo" title="${esc(company)}">
      <span class="ch-logo-name">${esc(company)}</span>
      ${src ? `<img src="${esc(src)}" alt="${esc(company)} logo" onerror="this.remove()">` : ""}
    </span>`;
}

// Students submit; the company's own reviewer gets a link to their queue.
function challengeActionHtml(ch, open) {
  const me = currentUser();
  if (me.role === "mentor") {
    if (me.company !== ch.company) return "";
    const waiting = projects.filter((p) => p.submittedTo === ch.id && !reviewCerts(p).length).length;
    return `<button class="ch-btn" data-go="review">Review submissions${waiting ? ` (${waiting})` : ""}</button>`;
  }
  if (!open) return `<span class="ch-closed">Closed</span>`;
  return `<button class="ch-btn" onclick="openSubmitDialog('${esc(ch.id)}')">Submit</button>`;
}

// "You submitted ...": what the viewer has entered in this challenge.
function mySubmissionsHtml(ch) {
  const me = currentUser();
  const mine = projects.filter((p) => p.submittedTo === ch.id && p.members.includes(me.id));
  if (!mine.length) return "";
  return mine.map((p) => {
    const reviewed = reviewCerts(p).length > 0;
    return `
      <p class="ch-mine">
        ✓ You submitted <a href="#" data-go="folder" data-id="${esc(p.id)}" data-from="${esc(me.id)}">${esc(p.title)}</a>
        · ${reviewed ? "reviewed" : "waiting for review"}
      </p>`;
  }).join("");
}

// "2026-10-01" -> "10 / 01 / 2026"
function slashDate(text) {
  const [y, m, d] = String(text || "").split("-");
  return y && m && d ? `${m} / ${d} / ${y}` : "";
}

// ---------- The Submit window ----------

function openSubmitDialog(challengeId) {
  const ch = findChallenge(challengeId);
  if (!ch) return;
  closeSubmitDialog();

  const dialog = document.createElement("dialog");
  dialog.className = "ch-dialog";
  dialog.id = "submit-dialog";
  dialog.setAttribute("aria-labelledby", "submit-title");
  dialog.innerHTML = submitPickerHtml(ch);
  document.body.appendChild(dialog);
  dialog.addEventListener("close", () => dialog.remove());
  dialog.addEventListener("click", (e) => { if (e.target === dialog) closeSubmitDialog(); });
  dialog.showModal();
}

function closeSubmitDialog() {
  const dialog = document.getElementById("submit-dialog");
  if (!dialog) return;
  if (dialog.open) dialog.close();
  dialog.remove();
}

// Going to another screen closes the window.
window.addEventListener("hashchange", closeSubmitDialog);

// The viewer's completed projects, newest first. Ones that can't be entered are greyed out.
function submitPickerHtml(ch) {
  const me = currentUser();
  const reviewer = findUser(ch.postedBy);
  const completed = projects
    .filter((p) => p.members.includes(me.id) && p.status === "done")
    .sort((a, b) => projectDate(b).localeCompare(projectDate(a)));

  const rows = completed.map((p) => {
    const reason = submitBlockedReason(p, ch);
    const skills = (p.skillTags || []).filter((t) => t.people.includes(me.id)).map((t) => t.skill);
    const photo = p.photos && p.photos[0];
    return `
      <label class="ch-pick ${reason ? "is-off" : ""}">
        <input type="radio" name="ch-project" value="${esc(p.id)}" ${reason ? "disabled" : ""} onchange="document.getElementById('ch-submit').disabled = false">
        <span class="ch-pick-photo">${photo ? `<img src="${esc(photo)}" alt="" onerror="this.remove()">` : ""}</span>
        <span class="ch-pick-body">
          <strong>${esc(p.title)}</strong>
          <span class="ch-pick-meta">Completed ${esc(shortDate(projectDate(p)) || "")}${skills.length ? ` · ${esc(skills.join(", "))}` : ""}</span>
          ${reason ? `<span class="ch-pick-reason">${esc(reason)}</span>` : ""}
        </span>
      </label>`;
  }).join("");

  return `
    <div class="ch-dialog-inner">
      <div class="ch-dialog-head">
        <div>
          <div class="ch-company">${esc(ch.company)} challenge</div>
          <h2 id="submit-title" class="ch-dialog-title">${esc(ch.title)}</h2>
        </div>
        <button class="ch-x" onclick="closeSubmitDialog()" aria-label="Close">✕</button>
      </div>
      ${completed.length ? `
        <p class="ch-dialog-text">Pick one of your completed projects to submit.
          ${reviewer ? `${esc(reviewer.name)}, ${esc(reviewer.title)} at ${esc(ch.company)}, will rate each skill you tagged on it.` : ""}</p>
        <div class="ch-picks" role="radiogroup" aria-label="Your completed projects">${rows}</div>
        <div class="ch-dialog-foot">
          <button class="ch-btn ch-btn-light" onclick="closeSubmitDialog()">Cancel</button>
          <button class="ch-btn" id="ch-submit" disabled onclick="submitPickedProject('${esc(ch.id)}')">Submit project</button>
        </div>`
      : `
        <p class="ch-dialog-text">You don't have any completed projects yet. Once you finish one, it shows up here so you can submit it.</p>
        <div class="ch-dialog-foot"><button class="ch-btn" onclick="closeSubmitDialog()">OK</button></div>`}
    </div>`;
}

// Why a project can't be entered, or "" if it can.
function submitBlockedReason(p, ch) {
  if (p.submittedTo === ch.id) return "Already submitted to this challenge";
  if (p.submittedTo) {
    const other = findChallenge(p.submittedTo);
    return `Already submitted to the ${other ? other.company : "another"} challenge`;
  }
  if (!(p.skillTags || []).some((t) => t.people.length)) return "No skills tagged yet, so there's nothing to rate";
  return "";
}

function submitPickedProject(challengeId) {
  const picked = document.querySelector('#submit-dialog input[name="ch-project"]:checked');
  const ch = findChallenge(challengeId);
  const p = picked && findProject(picked.value);
  if (!p || !ch || submitBlockedReason(p, ch)) return;

  p.submittedTo = ch.id;
  p.submittedOn = today();
  save();

  const reviewer = findUser(ch.postedBy);
  const me = currentUser();
  document.querySelector("#submit-dialog .ch-dialog-inner").innerHTML = `
    <div class="ch-done">
      <div class="ch-done-mark" aria-hidden="true">✓</div>
      <h2 class="ch-dialog-title">Submitted!</h2>
      <p class="ch-dialog-text"><strong>${esc(p.title)}</strong> is in ${reviewer ? `${esc(reviewer.name)}'s` : "the"} review queue for the ${esc(ch.company)} challenge.
        Each skill gets rated separately for every person who worked on it.</p>
      <div class="ch-dialog-foot">
        <button class="ch-btn ch-btn-light" data-go="folder" data-id="${esc(p.id)}" data-from="${esc(me.id)}">View project</button>
        <button class="ch-btn" onclick="finishSubmit()">Done</button>
      </div>
    </div>`;
}

// Close the window and redraw the board where it was, so "You submitted…" shows.
function finishSubmit() {
  closeSubmitDialog();
  const y = window.scrollY;
  refresh();
  window.scrollTo(0, y);
}

// ---------- Listing form ----------
// No longer linked from the board (its button became "Submit"). Kept so a
// "Post a listing" button elsewhere, like the Listings page, can reuse it:
// put listingFormHtml(challenge) on the page and call postListing(challenge.id).

// The form where a student writes a listing for their new project.
function listingFormHtml(ch) {
  // One checkbox per skill. The challenge's target skills are listed first.
  const otherSkills = SKILLS.filter((s) => !ch.targetSkills.includes(s));
  const checkboxes = ch.targetSkills.concat(otherSkills).map((s) => `
    <label class="checkbox"><input type="checkbox" name="team-skill" value="${esc(s)}"> ${esc(s)}</label>`
  ).join("");

  return `
    <div class="team-form stack">
      <div>
        <h3>Start a project</h3>
        <p class="muted small">Write a listing so other students can find and join your team.</p>
      </div>
      <div class="field">
        <label for="team-title">Project title</label>
        <input id="team-title" type="text" placeholder="e.g. Pocket Battery Health Monitor">
      </div>
      <div class="field">
        <label for="team-role">Role needed</label>
        <input id="team-role" type="text" placeholder="e.g. Mechanical designer for the enclosure">
      </div>
      <div class="field">
        <label for="team-details">Details</label>
        <textarea id="team-details" placeholder="What will this person do? How much time?"></textarea>
      </div>
      <div class="field">
        <span class="label">Skills needed</span>
        <div class="team-checks">${checkboxes}</div>
      </div>
      <p id="team-form-error" class="team-error"></p>
      <div class="row">
        <button class="btn btn-primary" onclick="postListing('${esc(ch.id)}')">Post listing</button>
        <button class="btn btn-ghost" data-go="challenges" data-id="${esc(ch.id)}">Cancel</button>
      </div>
    </div>`;
}

// "Post listing" was clicked: check the form, add the listing, go to the feed.
function postListing(challengeId) {
  const title = document.getElementById("team-title").value.trim();
  const role = document.getElementById("team-role").value.trim();
  const details = document.getElementById("team-details").value.trim();

  // Collect every checked skill box.
  const skillsNeeded = [];
  document.querySelectorAll('input[name="team-skill"]:checked').forEach((box) => {
    skillsNeeded.push(box.value);
  });

  // Simple checks so the demo can't post an empty listing.
  const error = document.getElementById("team-form-error");
  if (!title || !role) {
    error.textContent = "Please fill in the project title and the role needed.";
    return;
  }
  if (skillsNeeded.length === 0) {
    error.textContent = "Please pick at least one skill.";
    return;
  }

  // Add the new listing (same fields as the listings in data.js).
  listings.push({
    id: "listing-" + Date.now(),
    projectTitle: title,
    owner: currentUser().id,
    challenge: challengeId,
    lookingFor: "student",
    role: role,
    details: details,
    skillsNeeded: skillsNeeded,
    postedOn: today(),
  });
  save();

  // Go to the listings feed, where the new one is on top.
  showScreen("listings");
}
