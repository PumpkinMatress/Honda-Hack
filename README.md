# Bridge — Honda Hack demo

A browser-only demo. No server, no logins, no database. All fake data lives in `data.js`.

**Run it:** open the folder in VS Code, right-click `index.html`, choose **Open with Live Server**.
Use the **Viewing as** dropdown (top right) to switch between Maya, Jordan and Priya.
**Reset demo** clears every saved change.

## Who owns what

| Person | Files |
| --- | --- |
| A: Platform and Profile | `index.html`, `style.css`, `data.js`, `core.js`, `profile.js`, `profile.css` |
| B: Challenge to Team | `challenge.js`, `listings.js`, `messages.js`, `teams.css` |
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
| `challenges` | challenge.js | `{ id: "honda-battery" }` |
| `listings` | listings.js | `{ id: "listing-drone" }` |
| `messages` | messages.js | `{ with: "maya" }` (the profile's Message button sends this) |
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

## Things to know

- **Editing `data.js` wipes saved demo changes** the next time the page loads, so new data always shows up. Ask Person A for new fields.
- **Photos:** put images in an `img/` folder using the names in `data.js` (like `img/maya.jpg`). Missing photos show colored initials instead.
- **Statuses:** a project with `status: "done"` shows under Past projects. Anything else (`"open"`, `"submitted"`, ...) shows under Current projects.
- **Feedback** shows on the student's own profile only. Use `doneWell` / `toImprove`, or a single `comment` field.
- **Something blank or broken?** Press F12 and open the Console tab. A crashing screen shows its error message on the page instead of going blank.
