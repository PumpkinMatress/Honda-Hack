// listings.js: the listings feed and one listing's details (demo step 3).
// Person B owns this file.
//
// showScreen("listings")                  -> the feed, newest first
// showScreen("listings", { id: "..." })   -> one listing with a "Message owner" button

registerScreen("listings", (box, params) => {
  const listing = findListing(params.id);
  box.innerHTML = listing ? listingDetailHtml(listing) : listingFeedHtml();
});

// The feed: one card per listing, newest first.
function listingFeedHtml() {
  // Copy the list and sort it. Newest date first; for the same date,
  // the one added later (further down the list) comes first.
  const sorted = listings.slice().sort((a, b) => {
    if (a.postedOn !== b.postedOn) return a.postedOn < b.postedOn ? 1 : -1;
    return listings.indexOf(b) - listings.indexOf(a);
  });

  const cards = sorted.map((l) => {
    const owner = findUser(l.owner);
    return `
      <article class="card card-link" data-go="listings" data-id="${esc(l.id)}">
        ${listingTagsHtml(l)}
        <h3>${esc(l.projectTitle)}</h3>
        <div><span class="muted small">Looking for</span> <strong>${esc(l.role)}</strong></div>
        <div class="chips">${l.skillsNeeded.map(skillChip).join("")}</div>
        <div class="row">
          ${avatarHtml(owner, "sm")}
          <span class="muted small">${esc(owner.name)} · ${esc(formatDate(l.postedOn))}</span>
        </div>
      </article>`;
  }).join("");

  return `
    <div class="team-page">
      <div class="section-head">
        <h1>Listings</h1>
        <span class="muted small">Projects looking for teammates</span>
      </div>
      <div class="stack">${cards}</div>
    </div>`;
}

// The small tags above a listing's title: which challenge, and student or mentor.
function listingTagsHtml(l) {
  const ch = findChallenge(l.challenge);
  return `
    <div class="row wrap">
      ${ch ? `<span class="challenge-tag">🏁 ${esc(ch.company)} challenge</span>` : ""}
      <span class="role-tag">Needs a ${esc(l.lookingFor)}</span>
    </div>`;
}

// One listing with all its details and a "Message owner" button.
function listingDetailHtml(l) {
  const owner = findUser(l.owner);
  const ch = findChallenge(l.challenge);
  const isMine = l.owner === currentUser().id;

  return `
    <div class="team-page stack">
      <div><button class="btn btn-ghost btn-sm" data-go="listings">&larr; Back to listings</button></div>
      <section class="card">
        ${listingTagsHtml(l)}
        <h1>${esc(l.projectTitle)}</h1>
        <div><span class="muted">Looking for</span> <strong>${esc(l.role)}</strong></div>
        ${l.details ? `<p>${esc(l.details)}</p>` : ""}

        <h3>Skills needed</h3>
        <div class="chips">${l.skillsNeeded.map(skillChip).join("")}</div>

        ${ch ? `<h3>Challenge</h3>
          <p><a href="#" data-go="challenges" data-id="${esc(ch.id)}">${esc(ch.company)}: ${esc(ch.title)}</a></p>` : ""}

        <h3>Posted by</h3>
        <div class="row">
          ${avatarHtml(owner, "md")}
          <div>
            <strong>${esc(owner.name)}</strong>
            <div class="muted small">${esc(owner.major || owner.title || "")}</div>
          </div>
        </div>

        ${isMine
          ? `<p class="muted small">This is your listing.</p>`
          : `<button class="btn btn-primary" data-go="messages" data-with="${esc(owner.id)}" data-listing="${esc(l.id)}">Message owner</button>`}
      </section>
    </div>`;
}
