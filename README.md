# Nexus — Honda Hack demo

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
| Shareable skill certifications | `credential.js`, `credential.css` (see below) |

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
| `project` | project.js | `{ id, back: "profile" }` or `{ id, back: "folder", from }` (the skills page; only **Mark as completed** opens it) |
| `review` | review.js | `{ project: "solar-logger" }` |
| `verify` | credential.js | `{ t: "<token>" }` or `{ id: "NXS-K7QM-4XPA" }` (the public skill certification page) |
| `folder` | folder.js | `{ id: "led-cube", from: "maya" }` (the project view: title card + pages, opens from a profile folder); `{ id, page: "led-cube-2" }` scrolls to a page; `{ id, edit: "page", page }` edits it |

You choose your own params, except the ones in the table that other screens already send.

## Tools from core.js

| Use | What it does |
| --- | --- |
| `showScreen("folder", { id: "x" })` | Go to a screen |
| `<button data-go="folder" data-id="x">` | Same thing in plain HTML, no JavaScript |
| `currentUser()` | The person picked in "Viewing as" |
| `save()` | **Call after every change** to projects, listings, messages, certifications or feedback |
| `refresh()` | Redraw the current screen after changing data |
| `findUser(id)`, `findProject(id)`, `findChallenge(id)`, `findListing(id)` | Look things up |
| `esc(text)` | Wrap anything a user typed before putting it in HTML |
| `avatarHtml(user, "sm")`, `skillChip(skill)`, `photoHtml(src, title)`, `verifiedHtml(user)`, `formatDate(d)`, `today()` | Ready-made bits of HTML that match the site's look |

Changing data is just changing the lists, then saving:

```js
projects.push({ id: "battery-buddy", title: "...", owner: "maya", members: ["maya", "jordan"], status: "open", ... });
save();
showScreen("folder", { id: "battery-buddy" });
```

## Styles

Use the classes listed at the top of `style.css` (`card`, `btn btn-primary`, `chip`, `field`, `banner`, `grid`, `row`, ...)
and the color variables (`var(--primary)` etc.). Put anything extra in your own CSS file.

## Starting a project and building a team

1. **Create project** (profile.js): on your own profile, **+ Create project** is always at the top right
   of your projects, and the empty Current Project folder has one too (plus a link to the Challenges page
   for ideas). The window is blank every time and asks only for a name and a short description.
   You can have as many current projects as you like. Listings and challenges are both optional.
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
   "on the team" with an **Open** stamp that goes to the project view (title card and pages).

Only chats started from a listing get the Add to team stamp, so ordinary chats never do.

## The project view (folder.js)

Clicking a folder on a profile opens the project view.

- **Title card** (the summary): title, date, a short description, a picture of the project as it is
  now (or finished, once it's done), and **Important links**: any number of named links. Links are optional;
  with none, the box is hidden. Team members press **Edit card** to change it.
- **Pages**: the project's story, oldest first. **+ Add page** adds a blank page dated today, so the
  project grows as the work does. Each page has **Edit page** and a trash can (with an "Are you sure?" window).
- **Mark as completed** (under the title card, and on the profile folder) opens the skills page (project.js),
  an index card where the team checks the main skills each person used. Its own **Mark as completed** button
  saves the checks and moves the project to the completed folders, dated today. **Cancel** goes back without
  finishing. This is the only way to reach the skills page. **Reopen project** moves a project back
  (not for projects in a challenge).
- **Submitting to a challenge** happens on the Challenges board: **Submit** picks one of your completed projects.
  Once it's submitted, the top right of the project view links to the challenge (or, for the reviewer, to the review).
- Between the title card and the pages (project.js): **Skills: who did what** (checks, then badges once certified,
  with **Share** on your own skill certifications; clicking one opens its verifiable credential) and the reviewer's private **feedback** (team members only).
- **Skip ahead 4 weeks** (demo only) sits at the top of any open team project, for its team.
- **Deleting a project**: the trash can in the top right corner of a folder on your own profile
  (projects you own). It also takes down the project's listing.

## Review queue (review.js)

Mentors only. Same look as the rest of the site:

- **The queue** is laid out like the Listings page: each submission is the project's folder with a cream box beside it
  showing the challenge, the team and the skills to rate.
- **Review** (or the folder) opens the **project's pages first**, so the reviewer looks at the work before scoring it.
  A cream strip at the top says so, and **Score this submission →** in the top right opens the scoring page.
  "Back" there returns to the queue.
- **The scoring page** has no title card (the project's pages are one click back): index cards for **Rate each skill**
  (a legend with each level's badge, then four level buttons per person per skill) and **Private feedback**.
  The button at the bottom is **Submit review and award skill certifications**.
- **After the review** it shows the project's skills card, where each skill certification opens its verifiable credential.

## Skill stamps and badges

Each skill a person worked on shows on the outside of their project folder as a white circle with the
skill's name. Once an industry reviewer certifies it, the circle is replaced by that level's badge
(`img/badges/beginner.png`, `intermediate.png`, `advanced.png`, `expert.png`: one to four diamonds) with the skill's
name underneath. Hovering a badge pops up its level, "Verified by an industry professional", and the reviewer's
name and company. Clicking a badge opens its verifiable credential (the public page below).
The levels are Beginner, Intermediate, Advanced and Expert (`LEVELS` in data.js).

The profile header counts a student's **skill certifications**: one per skill, at the highest level they've earned
in it (Advanced and Expert in Circuit Design count once, as Expert). It starts at 0 until a reviewer certifies
a skill. The ▾ next to the count opens a menu of them, and each one opens its verifiable credential.
Mentor profiles show their challenges.

## Shareable skill certifications (credential.js)

Every skill certification can be shared as a public link that anyone can check, including from LinkedIn.

1. When the Honda reviewer submits a review, each skill certification gets an ID (like `NXS-7F3K-9Q2M`)
   and is **digitally signed with Honda's key**. The signed version is a standard JSON Web Token (JWT).
2. Clicking any skill certification opens its public page (`#/verify?t=...`): a badge on a profile folder,
   an entry in the profile's skill certifications menu, or a badge or row in a project's skills card.
   Only the N logo shows in the top bar there, like a visitor without an account sees it. The page checks the
   signature and shows **✓ Verified credential**, then the skill certification on an index card with its big badge.
   If anyone edits the link (say, Beginner to Expert), it shows **✕ Not valid** with a red stamp instead.
3. Only the student it was awarded to also sees the **Share this skill certification** card:
   - The public link, with **Copy link**
   - **Add to LinkedIn profile**: opens LinkedIn's "Add certification" form already filled in
   - **Post on LinkedIn**: LinkedIn's share window with the link
   - **Download badge image**: a 1200 × 630 PNG index card with the N logo and the badge, for posts or slides
4. **Share** on a project's skill certification opens the same options in a window, plus a preview of the image
   and **Embed on your own website** (an `<iframe>` badge that checks its own signature).

The skill certification's details travel inside the link, so it opens on any computer, even with no server.
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
- **Feedback** shows on the project view, only to the team members it was written to. Use `doneWell` / `toImprove`, or a single `comment` field.
- **Something blank or broken?** Press F12 and open the Console tab. A crashing screen shows its error message on the page instead of going blank.
