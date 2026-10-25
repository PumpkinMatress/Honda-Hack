// messages.js: the chat screen and the "Add to team" button (demo step 4).
// Person B owns this file. Styles are in messages.css.
//
// showScreen("messages")                                -> your chats (on a computer, the newest one is open)
// showScreen("messages", { with: "maya" })              -> your chat with Maya
// showScreen("messages", { with: "maya", listing: id }) -> same, with a starter message typed in
//                                                          (used by "Message owner" in listings.js)
//
// Looks like a desk: your contacts on an index card on the left, and the open chat
// on graph paper held by a clipboard on the right. Messages are paper notes:
// theirs are white, yours are yellow.
//
// Joining a team: a message sent from "Message owner" saves the listing's id on the
// message (m.listing). The listing's owner then sees "Add to team" in that chat.

registerScreen("messages", (box, params) => {
  const me = currentUser();
  const partners = chatPartners(params.with);

  // Who the open chat is with. If none is picked (or it's yourself after
  // switching "Viewing as"), open the most recent chat.
  let withId = params.with;
  if (!findUser(withId) || withId === me.id) withId = partners[0];

  // On phones only one side shows: the list, or the chat you picked.
  const view = findUser(params.with) && params.with !== me.id ? "chat" : "list";

  box.innerHTML = `
    <div class="ms" data-view="${view}">
      ${chatListHtml(partners, withId)}
      <section class="ms-board" aria-label="${withId ? `Chat with ${esc(findUser(withId).name)}` : "Chat"}">
        <span class="ms-clip" aria-hidden="true"></span>
        <div class="ms-sheet">
          ${withId ? chatHtml(withId, params.listing) : noChatHtml()}
        </div>
      </section>
    </div>`;

  wireChatSearch(box);
  fitMessagesHeight();

  // Scroll to the newest message and put the cursor in the text box.
  const history = document.getElementById("ms-history");
  if (history) history.scrollTop = history.scrollHeight;
  const input = document.getElementById("ms-input");
  if (input) {
    growComposeBox(input);
    if (view === "chat") {
      input.focus({ preventScroll: true });
      input.selectionStart = input.selectionEnd = input.value.length; // cursor after any starter message
    }
  }
});

// The page fills the window under the top bar, however many rows the bar takes up.
// (messages.css reads --top; its own value is only used until this runs.)
function fitMessagesHeight() {
  const ms = document.querySelector("#screen-messages .ms");
  if (!ms) return;
  const top = ms.getBoundingClientRect().top + window.scrollY;
  ms.style.setProperty("--top", Math.round(top + 24) + "px"); // 24px: room below, like the page's bottom padding
}
window.addEventListener("resize", fitMessagesHeight);

// ---------- Finding chats ----------

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

// ---------- Left side: the contact card ----------

function chatListHtml(partners, withId) {
  const me = currentUser().id;
  const rows = partners.map((id) => {
    const person = findUser(id);
    const chat = messagesWith(id);
    const last = chat[chat.length - 1];
    const preview = last ? (last.from === me ? "You: " : "") + last.text : "New message";
    // What the search box looks through: their name and everything you've said to each other.
    const searchText = [person.name, ...chat.map((m) => m.text)].join(" ").toLowerCase();
    const active = id === withId;
    return `
      <li data-search="${esc(searchText)}">
        <a class="ms-person${active ? " is-active" : ""}" href="#/messages?with=${encodeURIComponent(id)}"${active ? ` aria-current="true"` : ""}>
          ${chatAvatarHtml(person)}
          <span class="ms-person-text">
            <span class="ms-person-name">${esc(person.name)}</span>
            <span class="ms-person-last">${esc(preview)}</span>
          </span>
          ${last ? `<span class="ms-person-date">${esc(listDate(last.sentAt))}</span>` : ""}
        </a>
      </li>`;
  }).join("");

  return `
    <aside class="ms-card" aria-label="Your chats">
      <h1 class="ms-heading">Messages</h1>
      <label class="ms-search">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/></svg>
        <input id="ms-search" type="search" placeholder="Search messages" autocomplete="off" aria-label="Search messages">
      </label>
      ${partners.length
        ? `<ul class="ms-people" id="ms-people">${rows}</ul>`
        : `<p class="ms-none">No messages yet.</p>`}
      <p class="ms-none" id="ms-no-match" hidden>No chats match.</p>
    </aside>`;
}

// The search box hides chats that don't match, without redrawing (so typing isn't interrupted).
function wireChatSearch(box) {
  const input = box.querySelector("#ms-search");
  const rows = [...box.querySelectorAll("#ms-people > li")];
  const none = box.querySelector("#ms-no-match");
  input.addEventListener("input", () => {
    const query = input.value.trim().toLowerCase();
    let shown = 0;
    rows.forEach((row) => {
      row.hidden = Boolean(query) && !row.dataset.search.includes(query);
      if (!row.hidden) shown++;
    });
    none.hidden = !rows.length || shown > 0;
  });
}

// A circled first letter, like a name written on a contact card. A photo covers it if there is one.
function chatAvatarHtml(user, size = "") {
  const img = user.photo ? `<img src="${esc(user.photo)}" alt="" onerror="this.remove()">` : "";
  return `<span class="ms-av${size ? " ms-av-" + size : ""}" aria-hidden="true">${esc(user.name.charAt(0).toUpperCase())}${img}</span>`;
}

// ---------- Right side: the open chat ----------

function chatHtml(withId, listingId) {
  const other = findUser(withId);
  const me = currentUser().id;
  const sub = other.role === "mentor"
    ? `${other.title} at ${other.company}`
    : [other.major, other.year].filter(Boolean).join(" · ");

  const notes = messagesWith(withId).map((m) => {
    const mine = m.from === me;
    return `
      <div class="ms-note ${mine ? "ms-me" : "ms-them"}">
        <p class="ms-text">${esc(m.text)}</p>
        ${attachedListingHtml(m)}
        <time class="ms-time" datetime="${esc(m.sentAt)}">${esc(formatDate(m.sentAt))} · ${esc(clockTime(m.sentAt))}</time>
        <svg class="ms-tail" viewBox="0 0 16 14" aria-hidden="true"><path d="${mine ? "M16 0 V14 L0 0" : "M0 0 V14 L16 0"}"/></svg>
      </div>`;
  }).join("");

  return `
    <header class="ms-head">
      <a class="ms-back" href="#/messages">&larr; All chats</a>
      ${chatAvatarHtml(other, "lg")}
      <div class="ms-head-text">
        <h2 class="ms-name">${esc(other.name)}</h2>
        <div class="ms-sub">${esc(sub)}${other.verified ? ` <span class="ms-verified">✓ Verified</span>` : ""}</div>
      </div>
      <button class="ms-link" data-go="profile" data-user="${esc(other.id)}">View profile</button>
    </header>
    <div id="ms-history" class="ms-history" aria-live="polite">
      ${notes || `<p class="ms-empty">No messages yet. Say hi!</p>`}
    </div>
    ${teamStripHtml(other)}
    <form class="ms-compose" onsubmit="sendMessage(event, '${esc(withId)}', '${esc(findListing(listingId) ? listingId : "")}')">
      <textarea id="ms-input" rows="1" placeholder="Write a message..." aria-label="Write a message to ${esc(other.name)}"
                oninput="growComposeBox(this)" onkeydown="composeKey(event)">${esc(starterMessage(other, listingId))}</textarea>
      <button class="ms-send" type="submit" aria-label="Send">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M5.5 11.5 12 5l6.5 6.5"/></svg>
      </button>
    </form>`;
}

function noChatHtml() {
  return `
    <div class="ms-blank">
      <h2 class="ms-name">No chats yet</h2>
      <p>Press <strong>Message</strong> on someone's profile, or <strong>Message owner</strong> on a listing, to start one.</p>
      <button class="ms-stamp" data-go="listings">Listings</button>
    </div>`;
}

// A message sent from a listing has that listing clipped to it.
function attachedListingHtml(m) {
  const l = findListing(m.listing);
  if (!l) return "";
  return `
    <button class="ms-clipped" data-go="listings" data-id="${esc(l.id)}" title="Open the listing">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 12.5V6.5a4 4 0 0 1 8 0v10a2.5 2.5 0 0 1-5 0V7.5"/></svg>
      <span><small>Listing</small>${esc(l.role)} · ${esc(l.projectTitle)}</span>
    </button>`;
}

// Coming from "Message owner": type a friendly first message for them,
// mentioning any skills the sender has that the listing asks for.
function starterMessage(other, listingId) {
  const listing = findListing(listingId);
  if (!listing || listing.owner !== other.id) return "";
  const mySkills = currentUser().skills || [];
  const matching = listing.skillsNeeded.filter((s) => mySkills.includes(s));
  const role = listing.role.charAt(0).toLowerCase() + listing.role.slice(1);
  return `Hi ${firstName(other)}! I'd love to join ${listing.projectTitle} as your ${role}. ` +
    (matching.length ? `I have ${andList(matching)} experience. ` : "") +
    `Are you free to talk this week?`;
}

// The text box grows with what's typed (up to about 5 lines), so a starter message shows in full.
function growComposeBox(box) {
  if (!box.offsetParent) return; // hidden (the phone list view): nothing to measure
  box.style.height = "auto";
  const borders = box.offsetHeight - box.clientHeight;
  box.style.height = Math.min(box.scrollHeight + borders, 140) + "px";
}

// Enter sends. Shift+Enter starts a new line.
function composeKey(event) {
  if (event.key !== "Enter" || event.shiftKey || event.isComposing) return;
  event.preventDefault();
  event.target.form.requestSubmit();
}

// "Send" was clicked (or Enter was pressed).
function sendMessage(event, toId, listingId) {
  event.preventDefault(); // stop the form from reloading the page
  const text = document.getElementById("ms-input").value.trim();
  if (!text) return;

  const message = { from: currentUser().id, to: toId, text, sentAt: nowForMessage() };
  // Sent from their listing: remember which one, so they can add you to the team.
  const listing = findListing(listingId);
  if (listing && listing.owner === toId) message.listing = listing.id;
  messages.push(message);
  save();

  // Redraw without the "listing" param, so the starter message isn't typed in again.
  showScreen("messages", { with: toId });
}

// ---------- Joining a team ----------

// The listing this chat is about: one of yours they asked to join, or one of theirs
// you asked to join. Only students join teams here.
function joinRequest(other) {
  const me = currentUser();
  const chat = messagesWith(other.id);
  const asked = (joiner, owner) => chat
    .filter((m) => m.from === joiner.id && m.listing)
    .map((m) => findListing(m.listing))
    .filter((l) => l && l.owner === owner.id)
    .pop();
  const theyAsked = asked(other, me);
  if (theyAsked && other.role === "student") return { listing: theyAsked, owner: me, joiner: other };
  const iAsked = asked(me, other);
  if (iAsked && me.role === "student") return { listing: iAsked, owner: other, joiner: me };
  return null;
}

// The project a listing is for, or undefined if it doesn't exist yet.
function projectForListing(l) {
  return findProject(l.project) || projects.find((p) => p.owner === l.owner && p.title === l.projectTitle);
}

// The line above the text box: "Jaron wants to join … [Add to team]", then
// "✓ Jaron is on your team for … [Open]" once they're added.
function teamStripHtml(other) {
  const req = joinRequest(other);
  if (!req) return "";
  const { listing, owner, joiner } = req;
  const iOwn = owner.id === currentUser().id;
  const project = projectForListing(listing);
  const title = `<strong>${esc(project ? project.title : listing.projectTitle)}</strong>`;

  if (project && project.members.includes(joiner.id)) {
    return `
      <div class="ms-team is-joined">
        <span class="ms-team-text"><span class="ms-check" aria-hidden="true">✓</span>
          ${iOwn ? `${esc(firstName(joiner))} is on your team for ${title}` : `You're on ${esc(firstName(owner))}'s team for ${title}`}</span>
        <button class="ms-stamp ms-stamp-green" data-go="project" data-id="${esc(project.id)}">Open</button>
      </div>`;
  }

  if (iOwn) {
    return `
      <div class="ms-team">
        <span class="ms-team-text">${esc(firstName(joiner))} wants to join ${title}</span>
        <button class="ms-stamp" onclick="addToProject('${esc(joiner.id)}', '${esc(listing.id)}')">Add to team</button>
      </div>`;
  }

  return `
    <div class="ms-team is-waiting">
      <span class="ms-team-text">You asked to join ${title}. ${esc(firstName(owner))} can add you to the team from here.</span>
      <span class="ms-stamp ms-stamp-grey" aria-hidden="true">Pending</span>
    </div>`;
}

// "Add to team" was clicked: add them to the listing's project (making it if needed).
function addToProject(personId, listingId) {
  const me = currentUser();
  const listing = findListing(listingId);
  const person = findUser(personId);
  if (!listing || !person || listing.owner !== me.id) return;
  let project = projectForListing(listing);

  if (project) {
    if (!project.members.includes(personId)) project.members.push(personId);
  } else {
    // An older listing with no project yet: make the team project now.
    // skillTags starts empty; the project page (project.js) fills it in.
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
      challenge: listing.challenge || null,
      submittedTo: null,
      startedOn: today(),
    };
    projects.push(project);
    listing.project = project.id;
  }

  // Let the new teammate know in the chat.
  messages.push({
    from: me.id,
    to: personId,
    text: `I'd love to have you, ${firstName(person)}! I just added you to ${project.title}. Welcome to the team.`,
    sentAt: nowForMessage(),
  });

  save();
  showScreen("messages", { with: personId });
}

// ---------- Dates and words ----------

// The current local date and time as "2026-10-24T14:02" (the format of sentAt).
function nowForMessage() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${today()}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// "2026-10-24T14:02" -> "2:02 PM"
function clockTime(sentAt) {
  const [h, m] = String(sentAt).slice(11, 16).split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return "";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

// In the list: the time if it was today, otherwise "Oct 24".
function listDate(sentAt) {
  if (String(sentAt).slice(0, 10) === today()) return clockTime(sentAt);
  return formatDate(sentAt).replace(/, \d{4}$/, "");
}

// ["A"] -> "A", ["A", "B"] -> "A and B", ["A", "B", "C"] -> "A, B and C"
function andList(items) {
  return items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}
