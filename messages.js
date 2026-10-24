// messages.js: the chat screen and the "Add <name> to project" button (demo step 4).
// Person B owns this file.
//
// showScreen("messages")                                -> your most recent chat
// showScreen("messages", { with: "maya" })              -> your chat with Maya
// showScreen("messages", { with: "maya", listing: id }) -> same, with a starter message typed in
//                                                          (used by "Message owner" in listings.js)

registerScreen("messages", (box, params) => {
  const me = currentUser();
  const partners = chatPartners(params.with);

  // Who the open chat is with. If none is picked (or it's yourself after
  // switching "Viewing as"), open the most recent chat.
  let withId = params.with;
  if (!findUser(withId) || withId === me.id) withId = partners[0];

  const list = partners.length
    ? partners.map((id) => {
        const person = findUser(id);
        const active = id === withId ? " team-chat-active" : "";
        return `
          <div class="team-chat-person${active}" data-go="messages" data-with="${esc(id)}">
            ${avatarHtml(person, "sm")} <span>${esc(person.name)}</span>
          </div>`;
      }).join("")
    : `<p class="muted small">No messages yet.</p>`;

  box.innerHTML = `
    <div class="team-page">
      <h1 class="page-title">Messages</h1>
      <div class="team-messages">
        <div class="team-chat-list card">${list}</div>
        <div class="team-chat card">${withId ? chatHtml(withId, params.listing) : `<p class="muted">Pick a chat.</p>`}</div>
      </div>
    </div>`;

  // Scroll to the newest message and put the cursor in the text box.
  const history = document.getElementById("team-chat-history");
  if (history) history.scrollTop = history.scrollHeight;
  const input = document.getElementById("team-chat-input");
  if (input) input.focus();
});

// All messages between the current user and one other person, oldest first.
function messagesWith(personId) {
  const me = currentUser().id;
  return messages.filter((m) =>
    (m.from === me && m.to === personId) || (m.from === personId && m.to === me));
}

// Everyone the current user has a chat with, most recent chat first.
// newPersonId: someone we're about to message for the first time, so they show too.
function chatPartners(newPersonId) {
  const me = currentUser().id;
  const partners = [];
  // Go through messages from newest to oldest and collect each person once.
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    const other = m.from === me ? m.to : m.to === me ? m.from : null;
    if (other && !partners.includes(other)) partners.push(other);
  }
  if (findUser(newPersonId) && newPersonId !== me && !partners.includes(newPersonId)) {
    partners.unshift(newPersonId);
  }
  return partners;
}

// The open chat: header, message bubbles, team button, and the text box.
function chatHtml(withId, listingId) {
  const other = findUser(withId);
  const me = currentUser().id;

  const bubbles = messagesWith(withId).map((m) => `
    <div class="team-bubble ${m.from === me ? "team-bubble-me" : "team-bubble-them"}">
      ${esc(m.text)}
      <div class="team-bubble-time">${esc(formatDate(m.sentAt))} ${esc(m.sentAt.slice(11, 16))}</div>
    </div>`).join("");

  // Coming from "Message owner": type a friendly first message for them.
  let draft = "";
  const listing = findListing(listingId);
  if (listing) {
    draft = `Hi ${other.name.split(" ")[0]}! I saw your listing for ${listing.projectTitle}. ` +
      `I'd love to help as the ${listing.role}.`;
  }

  return `
    <div class="team-chat-header row">
      ${avatarHtml(other, "md")}
      <div>
        <strong>${esc(other.name)}</strong>
        <div class="muted small">${esc(other.major || other.title || "")}</div>
      </div>
    </div>
    <div id="team-chat-history" class="team-chat-history">
      ${bubbles || `<p class="muted small">No messages yet. Say hi!</p>`}
    </div>
    ${teamButtonHtml(other)}
    <form class="team-chat-send row" onsubmit="sendMessage(event, '${esc(withId)}')">
      <input id="team-chat-input" type="text" placeholder="Write a message..." value="${esc(draft)}" autocomplete="off">
      <button class="btn btn-primary" type="submit">Send</button>
    </form>`;
}

// "Send" was clicked (or Enter was pressed).
function sendMessage(event, toId) {
  event.preventDefault(); // stop the form from reloading the page
  const text = document.getElementById("team-chat-input").value.trim();
  if (!text) return;

  messages.push({
    from: currentUser().id,
    to: toId,
    text: text,
    sentAt: nowForMessage(),
  });
  save();

  // Redraw without the "listing" param, so the starter message isn't typed in again.
  showScreen("messages", { with: toId });
}

// The current local date and time as "2026-10-24T14:02" (the format of sentAt).
function nowForMessage() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${today()}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ---------- "Add to project" ----------

// The current user's newest listing, or undefined if they have none.
function myNewestListing() {
  const mine = listings.filter((l) => l.owner === currentUser().id);
  return mine[mine.length - 1];
}

// The team project made from a listing, or undefined if it doesn't exist yet.
// (A project and its listing share the same owner and title.)
function projectForListing(l) {
  return projects.find((p) => p.owner === l.owner && p.title === l.projectTitle);
}

// The "Add Jordan to project" button, shown to the listing owner (Maya)
// once the other student has sent them a message.
function teamButtonHtml(other) {
  const me = currentUser();
  const listing = myNewestListing();
  if (!listing || me.role !== "student" || other.role !== "student") return "";

  const theyMessagedMe = messagesWith(other.id).some((m) => m.from === other.id);
  if (!theyMessagedMe) return "";

  const firstName = other.name.split(" ")[0];
  const project = projectForListing(listing);

  // Already on the team: say so, with a link to the project page.
  if (project && project.members.includes(other.id)) {
    return `
      <div class="team-add team-on-team row-between">
        <span>✓ ${esc(firstName)} is on your team for <strong>${esc(project.title)}</strong></span>
        <button class="btn btn-sm" data-go="project" data-id="${esc(project.id)}">Open project</button>
      </div>`;
  }

  return `
    <div class="team-add row-between">
      <span class="small">${esc(firstName)} wants to join <strong>${esc(listing.projectTitle)}</strong></span>
      <button class="btn btn-primary btn-sm" onclick="addToProject('${esc(other.id)}')">Add ${esc(firstName)} to project</button>
    </div>`;
}

// "Add Jordan to project" was clicked: make the team project (or add them to it).
function addToProject(personId) {
  const me = currentUser();
  const listing = myNewestListing();
  let project = projectForListing(listing);

  if (project) {
    // The project already exists (e.g. a second teammate): add this person.
    project.members.push(personId);
  } else {
    // Make the new team project (same fields as the projects in data.js).
    // skillTags starts empty; Person C's project page fills it in.
    project = {
      id: "project-" + Date.now(),
      title: listing.projectTitle,
      owner: me.id,
      members: [me.id, personId],
      status: "open",
      description: listing.details,
      photos: [],
      link: "",
      skillTags: [],
      submittedTo: null,
    };
    projects.push(project);
  }

  // Let the new teammate know in the chat.
  messages.push({
    from: me.id,
    to: personId,
    text: `I added you to ${project.title}. Welcome to the team!`,
    sentAt: nowForMessage(),
  });

  save();
  showScreen("messages", { with: personId });
}
