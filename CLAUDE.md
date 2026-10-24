# Bridge Builder demo (Hack OHIO 2026, Honda Challenge)

## The product

Students post personal projects; verified industry professionals rate the skills students tagged on those projects. Each rating (Beginner, Proficient, Advanced) appears as a certification badge, e.g. "Advanced Soldering, certified by Priya Shah, Honda." Written feedback stays private to the student. The goal is a record of real, verified work that a resume (or AI) can't fake.

The full vision has profiles, DMs, settings, and three feeds (Listings, Projects, Challenges). **The demo builds only the flow below.** Do not build anything outside it.

## The demo flow (the only thing we build)

1. **Profile (Maya, student):** name, major, skills, 2 to 3 past projects. Certifications area is empty.
2. **Honda challenge page (Maya):** prompt, 4 to 6 week timeframe, target skills. "Start a project for this" opens a form where Maya writes a listing (title, role needed, skills needed).
3. **Listings feed (Jordan, student):** cards of listings, Maya's new one on top. Clicking one shows details and a "Message owner" button.
4. **Messages (Jordan, then Maya):** one short chat. Maya sees an "Add Jordan to project" button, which creates their team project.
5. **Project page, "4 weeks later" (Maya):** description and photos. Skills table with a checkbox per person per skill (e.g. Soldering: Maya, CAD: Jordan, Testing: both). "Submit to Honda challenge" button.
6. **Review queue and form (Priya, Honda engineer):** list of submissions. Opening one shows the project, then for each skill and each tagged person a choice of Beginner / Proficient / Advanced (show each level's meaning from `LEVELS`), plus "done well" and "to improve" comment boxes. Submitting creates certifications and private feedback.
7. **Profile again (Maya):** certification badges now show, each with reviewer name, company, and a link to the project.

## Technical rules

- Plain HTML, CSS, and JavaScript only. No frameworks, no npm, no build step. Must run by opening `index.html` with VS Code's Live Server.
- No backend, database, or real login. A "Viewing as" dropdown (Maya / Jordan / Priya) stands in for login.
- All starting data is in `data.js`. Use its exact field names; never invent new ones. Ask Person A to add a field if needed.
- Changes made during the demo are saved to the browser with `localStorage`. A "Reset demo" button clears them back to `data.js`.
- Load scripts with plain `<script>` tags in `index.html` (no `import`/`export`). `data.js` loads first, then `core.js`, then each screen file.
- The team are beginners. Keep code simple and add short comments explaining what each part does.

## Who owns which files

Three people code at the same time. **Only edit the files of the person you're working for.** Ask who you're working for if you don't know.

| | Person A: Platform and Profile | Person B: Challenge to Team | Person C: Project to Review |
| --- | --- | --- | --- |
| Demo steps | 1 and 7 | 2, 3, 4 | 5 and 6 |
| Files they own | `index.html`, `style.css`, `data.js`, `core.js`, `profile.js` | `challenge.js`, `listings.js`, `messages.js`, `teams.css` | `project.js`, `review.js`, `review.css` |
| Builds | Page shell and nav, "Viewing as" dropdown, screen switching, save/load/reset, profile page with badges, shared styles | Challenge page, listing form, listings feed and detail, chat, "Add to project" | Project page with skill tagging, submit to challenge, review queue and form, saving certifications |
| Reads | `certifications` (from C) | `users`, `challenges` | the team project in `projects` (from B) |
| Writes | everything in `core.js` | new entries in `listings`, `messages`, `projects` | new entries in `certifications`, `feedback`; sets `submittedTo` on the project |

## Shared functions in `core.js` (Person A provides)

- `showScreen(name)`: hides all screens and shows the one with `id="screen-<name>"`.
- `currentUser()`: returns the user object picked in the "Viewing as" dropdown.
- `save()`: writes all data lists to `localStorage`.
- `resetDemo()`: clears `localStorage` and reloads the page.

Each screen file draws itself into its own empty box in `index.html`, e.g. `<div id="screen-review"></div>`. Person A creates all the boxes up front, so B and C never edit `index.html`.

Until `core.js` is ready, B and C can test their screens directly with the sample data in `data.js` (a finished sample team project `solar-logger` waits in Priya's queue, and a sample certification exists for Sam).
