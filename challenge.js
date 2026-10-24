// challenge.js: the Honda challenge page and the "Start a project" form (demo step 2).
// Person B owns this file.
//
// showScreen("challenges")                          -> the Honda challenge
// showScreen("challenges", { id: "aep-sensor" })    -> another challenge
// showScreen("challenges", { id: "...", start: "yes" }) -> same page with the listing form open
//
// Helpers like esc, findUser, skillChip, formatDate, today come from core.js.

registerScreen("challenges", (box, params) => {
  const ch = findChallenge(params.id) || findChallenge("honda-battery");
  const poster = findUser(ch.postedBy);
  const isStudent = currentUser().role === "student";

  // Students see either the "Start a project" button or the form.
  let action = "";
  if (isStudent && params.start) {
    action = listingFormHtml(ch);
  } else if (isStudent) {
    action = `<button class="btn btn-primary" data-go="challenges" data-id="${esc(ch.id)}" data-start="yes">Start a project for this</button>`;
  }

  box.innerHTML = `
    <div class="team-page stack">
      <section class="card">
        <span class="company-tag">${esc(ch.company)} challenge</span>
        <h1>${esc(ch.title)}</h1>
        <p class="team-prompt">${esc(ch.prompt)}</p>

        <div class="team-facts">
          <div><div class="muted xsmall">Timeframe</div><strong>${ch.weeks} weeks</strong></div>
          <div><div class="muted xsmall">Open</div><strong>${esc(formatDate(ch.opens))} to ${esc(formatDate(ch.closes))}</strong></div>
          <div class="row">
            ${avatarHtml(poster, "sm")}
            <div><div class="muted xsmall">Posted by</div><strong>${esc(poster.name)}</strong>, ${esc(poster.title)}</div>
          </div>
        </div>

        <h3>Target skills</h3>
        <div class="chips">${ch.targetSkills.map(skillChip).join("")}</div>

        <h3>What you get</h3>
        <p>${esc(ch.whatYouGet)}</p>

        ${action}
      </section>
    </div>`;
});

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
