// listings.js: the Listings page, a forum of projects looking for people (demo step 3),
// and the "Create listing" window that adds a post to it.
// Person B owns this file. Styles are in teams.css (the window reuses profile.css's np- styles).
//
// showScreen("listings")                  -> every post, newest first
// showScreen("listings", { id: "..." })   -> same, scrolled to that post
//
// Each post is the project's folder (the same one as on the profile) with a box beside it:
// who posted it, what they're looking for, the skills needed, and a Message button.
// Posts come from "Create listing" on a current project's folder (profile.js).

registerScreen("listings", (box, params) => {
  box.innerHTML = listingFeedHtml();

  // Coming from search, a message, or "View on Listings": scroll to that post and point it out.
  const target = params.id && document.getElementById("lt-" + params.id);
  if (target) {
    requestAnimationFrame(() => {
      target.scrollIntoView({ block: "center" });
      target.classList.add("is-focus");
    });
  }
});

// Who the poster wants, as picked in the listing window.
const LOOKING_FOR = {
  student: { label: "Group member", role: "Group member" },
  mentor: { label: "Mentor", role: "Mentor" },
  any: { label: "Either", role: "Group member or mentor" },
};

// The project a listing is for. Listings made before projects had ids are matched
// by owner and title. A listing with no project gets a plain folder from its own text.
function listingProject(l) {
  return findProject(l.project) ||
    projects.find((p) => p.owner === l.owner && p.title === l.projectTitle);
}

// ---------- The forum ----------

function listingFeedHtml() {
  // Only projects still being worked on are looking for people.
  const open = listings.filter((l) => {
    const p = listingProject(l);
    return !p || p.status !== "done";
  });
  // Newest first; for the same date, the one added later comes first.
  const sorted = open.slice().sort((a, b) => {
    if (a.postedOn !== b.postedOn) return a.postedOn < b.postedOn ? 1 : -1;
    return listings.indexOf(b) - listings.indexOf(a);
  });

  const me = currentUser();
  return `
    <div class="lt">
      <header class="lt-head">
        <h1 class="lt-title">Listings</h1>
        <p class="lt-intro">Projects looking for group members and mentors.
          ${me.role === "student" ? `To post your own, press <strong>Create listing</strong> on a current project on your <a href="#/profile">profile</a>.` : ""}</p>
      </header>
      ${sorted.length
        ? `<div class="lt-posts">${sorted.map(listingPostHtml).join("")}</div>`
        : `<p class="lt-none">No listings right now.</p>`}
    </div>`;
}

// One post: the folder on the left, the poster's box on the right.
function listingPostHtml(l) {
  const owner = findUser(l.owner);
  if (!owner) return "";
  const project = listingProject(l);
  const folder = project
    ? folderHtml(project, owner, "completed", { tab: "Current Project", inListing: true })
    : folderHtml(
        { id: "", title: l.projectTitle, members: [l.owner], status: "open", description: "", skillTags: [] },
        owner, "completed", { tab: "Current Project", link: false });

  return `
    <article class="lt-post" id="lt-${esc(l.id)}">
      <div class="lt-folder">${folder}</div>
      <div class="lt-box">
        <header class="lt-author" data-go="profile" data-user="${esc(owner.id)}" title="View ${esc(owner.name)}'s profile">
          ${avatarHtml(owner, "lg")}
          <div class="lt-author-text">
            <strong class="lt-name">${esc(owner.name)}</strong>
            <span class="lt-who">${esc(owner.role === "mentor" ? `${owner.title} at ${owner.company}` : [owner.major, owner.year].filter(Boolean).join(" · "))}</span>
          </div>
          <time class="lt-date" datetime="${esc(l.postedOn)}">${esc(formatDate(l.postedOn))}</time>
        </header>
        <div class="lt-body">
          <div class="lt-tags">
            <span class="lt-tag">Looking for: ${esc(l.role)}</span>
            ${findChallenge(l.challenge) ? `<span class="lt-tag lt-tag-light">🏁 ${esc(findChallenge(l.challenge).company)} challenge</span>` : ""}
          </div>
          ${l.details ? l.details.split("\n\n").map((para) => `<p class="lt-text">${esc(para)}</p>`).join("") : ""}
          ${l.skillsNeeded.length ? `
            <div class="lt-skills">
              <span class="lt-label">Skills needed</span>
              <div class="lt-chips">${l.skillsNeeded.map((s) => `<span class="lt-chip">${esc(s)}</span>`).join("")}</div>
            </div>` : ""}
        </div>
        <footer class="lt-foot">${listingActionHtml(l, project, owner)}</footer>
      </div>
    </article>`;
}

// Your own post: edit it. Anyone else's: message the poster.
function listingActionHtml(l, project, owner) {
  const me = currentUser();
  const isMine = l.owner === me.id || (project && project.members.includes(me.id));
  if (isMine) {
    return `
      <span class="lt-mine">${l.owner === me.id ? "This is your listing." : `Posted by ${esc(firstName(owner))} for your project.`}</span>
      ${project ? `<button class="pf-btn pf-btn-ghost" onclick="openListingDialog('${esc(project.id)}')">Edit listing</button>` : ""}`;
  }
  return `<button class="pf-btn" data-go="messages" data-with="${esc(owner.id)}" data-listing="${esc(l.id)}">Message ${esc(firstName(owner))}</button>`;
}

// ---------- The "Create listing" window ----------
// Opens from a current project's folder on your profile (or "Edit listing" on your post).
// One listing per project: if it already has one, the window edits it.

function openListingDialog(projectId) {
  const p = findProject(projectId);
  if (!p) return;
  closeListingDialog();
  const dialog = document.createElement("dialog");
  dialog.className = "np-dialog";
  dialog.id = "ld-dialog";
  dialog.setAttribute("aria-labelledby", "ld-title");
  dialog.innerHTML = listingFormHtml(p, projectListing(p));
  document.body.appendChild(dialog);
  dialog.addEventListener("close", () => dialog.remove()); // Escape closes it too
  dialog.showModal();
  document.getElementById("ld-details").focus();
}

function closeListingDialog() {
  const dialog = document.getElementById("ld-dialog");
  if (!dialog) return;
  if (dialog.open) dialog.close();
  dialog.remove();
}

// Going to another screen closes the window.
window.addEventListener("hashchange", closeListingDialog);

function listingFormHtml(p, listing) {
  const lookingFor = listing && LOOKING_FOR[listing.lookingFor] ? listing.lookingFor : "student";
  const picked = listing ? listing.skillsNeeded : [];
  // The challenge's target skills come first, if the project is for one.
  const ch = findChallenge(p.challenge);
  const order = ch ? ch.targetSkills.concat(SKILLS.filter((s) => !ch.targetSkills.includes(s))) : SKILLS;

  const choices = Object.entries(LOOKING_FOR).map(([value, info]) => `
    <label class="np-chip"><input type="radio" name="ld-looking" value="${value}" ${value === lookingFor ? "checked" : ""}><span>${esc(info.label)}</span></label>`).join("");
  const skills = order.map((s) => `
    <label class="np-chip"><input type="checkbox" name="ld-skill" value="${esc(s)}" ${picked.includes(s) ? "checked" : ""}><span>${esc(s)}</span></label>`).join("");

  return `
    <form class="np" onsubmit="saveListing(event, '${esc(p.id)}')" novalidate>
      <header class="np-head">
        <div>
          <h2 class="np-title" id="ld-title">${listing ? "Edit listing" : "Create listing"}</h2>
          <div class="np-sub">${esc(p.title)}</div>
        </div>
        <button type="button" class="np-x" onclick="closeListingDialog()" aria-label="Close">✕</button>
      </header>

      <div class="np-body">
        <div class="np-field">
          <span class="np-label" id="ld-looking-label">Looking for</span>
          <div class="np-seg" role="radiogroup" aria-labelledby="ld-looking-label">${choices}</div>
        </div>
        <label class="np-field">
          <span class="np-label">What are you looking for?</span>
          <textarea id="ld-details" rows="5" placeholder="What would they work on, what would help, and roughly how many hours a week?">${esc(listing ? listing.details : "")}</textarea>
        </label>
        <div class="np-field">
          <span class="np-label">Skills needed</span>
          <div class="np-chips">${skills}</div>
        </div>
        <p class="np-hint">Your post shows on the Listings page next to this project's folder. People can message you from it.</p>
        <p class="np-error" id="ld-error" role="alert"></p>
      </div>

      <footer class="np-foot">
        ${listing ? `<button type="button" class="pf-btn pf-btn-ghost np-remove" onclick="removeListing('${esc(listing.id)}')">Take down</button>` : ""}
        <button type="button" class="pf-btn pf-btn-ghost" onclick="closeListingDialog()">Cancel</button>
        <button type="submit" class="pf-btn">${listing ? "Save listing" : "Post listing"}</button>
      </footer>
    </form>`;
}

// "Post listing" / "Save listing" was pressed.
function saveListing(event, projectId) {
  event.preventDefault(); // stop the form from reloading the page
  const p = findProject(projectId);
  if (!p) return;
  const details = document.getElementById("ld-details").value.trim();
  const lookingFor = document.querySelector('input[name="ld-looking"]:checked').value;
  const skillsNeeded = [...document.querySelectorAll('input[name="ld-skill"]:checked')].map((box) => box.value);

  const problem = !details ? "Write a few words about who you're looking for."
    : !skillsNeeded.length ? "Pick at least one skill." : "";
  if (problem) {
    document.getElementById("ld-error").textContent = problem;
    if (!details) document.getElementById("ld-details").focus();
    return;
  }

  const existing = projectListing(p);
  if (existing) {
    // Only change the role if they picked a different kind of person,
    // so a hand-written role (like "Flight controller programmer") stays.
    if (existing.lookingFor !== lookingFor) existing.role = LOOKING_FOR[lookingFor].role;
    Object.assign(existing, { project: p.id, projectTitle: p.title, lookingFor, details, skillsNeeded });
    save();
    closeListingDialog();
    refresh();
    return;
  }

  const id = "listing-" + Date.now();
  listings.push({
    id,
    project: p.id,
    projectTitle: p.title,
    owner: currentUser().id,
    challenge: p.challenge || null,
    lookingFor,
    role: LOOKING_FOR[lookingFor].role,
    details,
    skillsNeeded,
    postedOn: today(),
  });
  save();
  closeListingDialog();
  showScreen("listings", { id }); // see the new post on the Listings page
}

async function removeListing(listingId) {
  if (!findListing(listingId)) return;
  const ok = await confirmDialog({
    title: "Take this listing down?",
    text: "It will no longer show on the Listings page. You can post a new one any time.",
    confirm: "Take down",
    danger: true,
  });
  const index = listings.findIndex((l) => l.id === listingId);
  if (!ok || index === -1) return;
  listings.splice(index, 1);
  save();
  closeListingDialog();
  refresh();
}
