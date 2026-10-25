# Bridge — Honda Hack demo

A browser-only demo. No server, no logins, no database. All fake data lives in `data.js`.

**Run it:** open the folder in VS Code, right-click `index.html`, choose **Open with Live Server**.
Use the **Viewing as** switch (in the top bar, between Search and Reset) to change whose screen you see.
**Reset** in the top bar clears every saved change. **Search** in the top bar finds people, projects, challenges and listings.

## Who owns what

| Person | Files |
| --- | --- |
| A: Platform and Profile | `index.html`, `style.css`, `data.js`, `core.js`, `search.js`, `profile.js`, `profile.css`, `folder.js`, `folder.css` |
| B: Challenge to Team | `challenge.js`, `challenge.css`, `listings.js`, `messages.js`, `messages.css`, `teams.css` |
| C: Project to Review | `project.js`, `review.js`, `review.css` |
| Shareable certificates | `credential.js`, `credential.css` (see below) |

`index.html` already loads all of these files, so B and C don't need to edit it.
Until your file exists, its screen shows a grey "hasn't been added yet" box.
(The browser console will also show a harmless "file not found" for each missing file.)

## Adding your screen (B and C)

Create your file and register a draw function. Core calls it every time your
screen is shown **and** every time the "Viewing as" person changes, so always
draw from the data, never from leftovers.

```js
// listings.js
registerScreen("listings", (box, params) => {
  const me = currentUser();
  box.innerHTML = `
    <h1 class="page-title">Listings</h1>
    <div class="grid">
      ${listings.map((l) => `
        <article class="card card-link" data-go="listings" data-id="${esc(l.id)}">
          <h3>${esc(l.role)}</h3>
          <p class="muted small">${esc(l.projectTitle)}</p>
          <div class="chips">${l.skillsNeeded.map(skillChip).join("")}</div>
        </article>`).join("")}
    </div>`;
});
```

Screen names and the box each one draws into:

| Screen name | File | Example params |
| --- | --- | --- |
| `profile` | profile.js | `{ user: "jordan" }` (blank = the viewer) |
| `challenges` | challenge.js | `{ id: "honda-battery" }` (the corkboard of challenges, scrolled to that one; **Submit** enters a completed project) |
| `listings` | listings.js | `{ id: "listing-drone" }` (the forum, scrolled to that post) |
| `messages` | messages.js | `{ with: "maya" }` (the profile's Message button sends this); `{ with: "maya", listing: "listing-..." }` from the Message button on a listing |
| `project` | project.js | `{ id: "led-cube" }` (project cards and badges send this) |
| `review` | review.js | `{ project: "solar-logger" }` |
| `verify` | credential.js | `{ t: "<token>" }` or `{ id: "BRG-K7QM-4XPA" }` (the public certificate page) |
| `folder` | folder.js | `{ id: "led-cube", from: "maya" }` (note card + leaflet, opens from a profile folder; challenge work stays on `project`) |

You choose your own params, except the ones in the table that other screens already send.

## Tools from core.js

| Use | What it does |
| --- | --- |
| `showScreen("project", { id: "x" })` | Go to a screen |
| `<button data-go="project" data-id="x">` | Same thing in plain HTML, no JavaScript |
| `currentUser()` | The person picked in "Viewing as" |
| `save()` | **Call after every change** to projects, listings, messages, certifications or feedback |
| `refresh()` | Redraw the current screen after changing data |
| `findUser(id)`, `findProject(id)`, `findChallenge(id)`, `findListing(id)` | Look things up |
| `esc(text)` | Wrap anything a user typed before putting it in HTML |
| `avatarHtml(user, "sm")`, `skillChip(skill)`, `levelPill("advanced")`, `certBadgeHtml(cert)`, `photoHtml(src, title)`, `verifiedHtml(user)`, `formatDate(d)`, `today()` | Ready-made bits of HTML that match the site's look |

Changing data is just changing the lists, then saving:

```js
projects.push({ id: "battery-buddy", title: "...", owner: "maya", members: ["maya", "jordan"], status: "open", ... });
save();
showScreen("project", { id: "battery-buddy" });
```

## Styles

Use the classes listed at the top of `style.css` (`card`, `btn btn-primary`, `chip`, `field`, `banner`, `grid`, `row`, ...)
and the color variables (`var(--primary)` etc.). Put anything extra in your own CSS file.

## Starting a project and building a team

1. **Create project** (profile.js): on your own profile, **+ Create project** is always at the top right
   of your projects, and the empty Current Project folder has one too (plus a link to the Challenges page
   for ideas). The window asks for a name, a short description, and an optional challenge. You can have
   as many current projects as you like.
2. **Create listing** (listings.js): every current project folder on your own profile has a
   **Create listing** button. The window asks who you're looking for (group member, mentor, or either),
   a few sentences about what you need, and the skills needed. Posting it adds a listing with the
   project's id (`listing.project`) and opens the Listings page. Once a project has a listing, the
   folder shows **Edit listing** (which can also take it down) and **View on Listings**.
3. **Listings page** (listings.js): a forum. Each post is the project's folder, the same one as on the
   profile, with a box beside it showing who posted it, what they're looking for, and the skills needed.
   Listings for completed projects are hidden.
4. **Message** (listings.js): another student presses **Message Bennett** on a post. A starter message
   is typed in for them, and the message they send keeps the listing's id (`message.listing`),
   shown as a paper-clipped tag on the note.
5. **Add to team** (messages.js): the owner sees "Jaron wants to join …" with an **Add to team** stamp in that chat.
   Pressing it adds them to the project's `members` and sends a welcome note. Both people then see
   "on the team" with an **Open** stamp that goes to the project page.

Only chats started from a listing get the Add to team stamp, so ordinary chats never do.

## Shareable certificates (credential.js)

Every certification can be shared as a public link that anyone can check, for example from LinkedIn.

1. When the Honda reviewer submits a review, each certification gets an ID (like `BRG-7F3K-9Q2M`)
   and is **digitally signed with Honda's key**. The signed version is a standard JSON Web Token (JWT).
2. On a project page, a student clicks **Share** on one of their own certifications. The window has:
   - **Copy link**: the public certificate page
   - **Add to LinkedIn profile**: opens LinkedIn's "Add certification" form already filled in
   - **Download image**: a 1200 × 630 PNG of the badge for posts or slides
   - **Embed on your own website**: an `<iframe>` badge that checks its own signature
3. The public page (`#/verify?t=...`) checks the signature and shows **✓ Verified credential**.
   If anyone edits the link (say, Beginner to Advanced), it shows **✕ Not valid** instead.
   The **Edit this badge** button on that page shows this happening, which works well in the video.

The certificate's details travel inside the link, so it opens on any computer, even with no server.
The link only works for other people once the site is published (Netlify Drop or GitHub Pages).
While you run it on Live Server, the link only opens on your computer, and the Share window says so.

**Demo only:** the companies' private signing keys sit in `credential.js` so this works without a server.
In a real product each company would keep its private key on its own server.

## Company logos

Put logo files in `img/logos/` (`honda.png`, `aep.png`; the list is at the top of `challenge.js`).
Until a file exists, the logo box on the challenges board shows the company name.

## Things to know

- **Editing `data.js` wipes saved demo changes** the next time the page loads, so new data always shows up. Ask Person A for new fields.
- **Photos:** put images in an `img/` folder using the names in `data.js` (like `img/maya.jpg`). Missing photos show colored initials instead.
- **Statuses:** a project with `status: "done"` shows under Past projects. Anything else (`"open"`, `"submitted"`, ...) shows under Current projects.
- **Feedback** shows on the student's own profile only. Use `doneWell` / `toImprove`, or a single `comment` field.
- **Something blank or broken?** Press F12 and open the Console tab. A crashing screen shows its error message on the page instead of going blank.
