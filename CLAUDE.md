# Idea for Submission:

Personal projects are an integral part of student development, but a few resume lines both don’t do the projects justice and don’t verifiably show the students’ proficiency.

Like on any other platform, students will have a profile which lists their credentials, skills, and experience. Their profile will display their current open project(s), as well as any past projects. Some users will be industry professionals, and their profile will also show their verified status and affiliated company.

Projects will have a content section (description, pictures, and files with code, depending on what the student uploads). This content section will show the student’s skills off. There will be a feedback section in which other users (students and professionals) can leave feedback which is not displayed publicly. Projects will also show authorship (both students and mentors who contributed). Current “open” projects can be continuously edited, and past projects can be reopened. Students tag which skills they used, choosing from a list of engineering technical skills.

The website will allow users to access several different pages. Obviously there will be user profiles, direct messages, and settings. There will also be 3 feeds viewers can scroll through:
Listings: Users can submit “listings” for their open projects, offering a position in their project for either students or mentors. They will describe what that position will entail, and what skills will be necessary. The prospective student or mentor can directly message the project owner, and after looking at their profile, the project owner may add them to the project.
Projects: Students can browse open projects or recently completed projects, looking for inspiration or other accomplished students to reach out to. Industry professionals can also browse projects to look for a student that they may be interested in mentoring.
Challenges: Companies or industrial professionals will post challenges, which have a prompt and are open for a set time. Students can submit their projects, and a professional will review and provide feedback on the project. They will certify the skills tagged in the project.

Whether a professional finds a project by scrolling their feed or, more likely, they are reviewing a project that was submitted to a showcase, they will score the student on their demonstration of the skills tagged in the project. The professional’s rating for each skill (beginner, proficient, advanced etc.) will show up as a certification badge on the project. “Advanced Soldering skill as certified by an AEP technician.”

The idea is that this website will be a good way for students to connect to mentors and other students, and show off their work. They might, for example, link their profile on this website in their linkedin to show off their past personal projects in detail. If the website becomes popular, it may be standard practice to click the link on someone’s linkedin and see if they are certified to be highly proficient in important skills.

For our demonstration, we are ONLY coding in these features
Mock profile with several past projects.
While scrolling through the challenges feed, the mock profile sees a Honda challenge and creates a listing for a new project.
Other user scrolls through the listings feed, finds the project, and messages the project owner.
Weeks later, the two users tag their project with skills. Some skills apply only to one user, and some apply to both users, which they can manually select to show who was responsible for what work. They submit the project to the Honda Challenge.
Honda engineer reviews their submission, leaves feedback, and scores their skill certifications. Going back to the profile, these certifications are now displayed.

# Demo build guide for beginners

Oct 24, 2026 · @R

## The short answer

Build a small website that runs entirely in the browser, filled with fake people and projects you type in yourselves. You do not need a server, a database, real logins, or AI. Honda says "Sample data is fine," and judges only see what happens on screen.

A good analogy is a movie set. The storefronts look real from the camera's angle, but there is nothing behind them. Your demo only has to look and work right along the one path you'll show in the video.

- **No login:** a dropdown in the top corner says "Viewing as: Maya (student) / Jordan (student) / Priya (Honda engineer)." Switching it swaps whose screen you see.
- **No database:** all the fake data lives in one file. Changes are saved in the browser's memory, so they stick around while you record the demo.
- **Budget:** about 15 to 20 hours of work, split across the team.

## The screens to build

There are seven screens, one for each beat of your demo. Build them in this order, because each one hands off to the next.

| # | Screen | Who is viewing | What it must do |
| --- | --- | --- | --- |
| 1 | Profile | Maya (student) | Show her name, major, skills, and 2 to 3 past projects as cards. A "Certifications" area starts empty. |
| 2 | Honda challenge page | Maya | Show the prompt, the 4 to 6 week timeframe, and target skills. A "Start a project for this" button opens a form where she writes a listing (title, role needed, skills needed). |
| 3 | Listings feed | Jordan (student) | Scrollable cards of listings. Maya's new one shows at the top. Clicking it shows the details and a "Message owner" button. |
| 4 | Messages | Jordan, then Maya | A simple chat box with one short conversation. On Maya's side, an "Add Jordan to project" button. |
| 5 | Project page, "4 weeks later" | Maya | Project description and photos. A skills table with a checkbox for each person per skill (e.g. Soldering: Maya, CAD: Jordan, Testing: both). A "Submit to Honda challenge" button. |
| 6 | Review queue and review form | Priya (Honda engineer) | A list of submissions. Opening one shows the project, then for each skill and person a choice of Beginner, Proficient, or Advanced, plus a comment box. |
| 7 | Profile again | Maya | The Certifications area now shows badges like "Advanced Soldering, certified by Priya Shah, Honda." |

Screens 1 and 7 are the same page, so you really build six.

## Tools and setup

Everything here is free and takes about 20 minutes to set up. Each teammate who codes should do this.

| Tool | What it is | Why you need it |
| --- | --- | --- |
| [VS Code](https://code.visualstudio.com) | A text editor made for code | Where you write and edit the files |
| Live Server (a VS Code extension) | A button that opens your site in the browser | Every time you save, the page refreshes, so you see changes instantly |
| Chrome | Web browser | Runs the site. Press F12 to see error messages when something breaks |
| [GitHub](https://github.com) account | Online storage for code | Lets teammates share files and gives you a free public demo link |
| An AI coding assistant (such as Claude) | Writes and explains code from plain-English requests | With no CS background, this is how you'll move fast. Check that Hack OHIO allows it (most hackathons do) |

**Install steps:**

1. Install VS Code and open it.
2. Click the Extensions icon (four squares on the left), search "Live Server", and install it.
3. Make a folder on your computer called `bridge-demo` and open it in VS Code (File, then Open Folder).
4. Right-click any `.html` file and choose "Open with Live Server."

## How the pieces fit

A website is made of three languages, each with one job. Your whole demo is four files in one folder.

| File | Language | Its job | Analogy |
| --- | --- | --- | --- |
| `index.html` | HTML | The content: headings, text, buttons, boxes. Holds all six screens; only one is shown at a time | The walls and furniture |
| `style.css` | CSS | The look: colors, fonts, spacing, card layout | The paint and decor |
| `data.js` | JavaScript | The fake people, projects, challenges, and listings | The props |
| `app.js` | JavaScript | The behavior: what happens when you click a button, switching screens, saving changes | The electricity |

**The fake data** is just a list written in a fixed format. Here's a small piece of `data.js`:

```js
const users = [
  { id: "maya", name: "Maya Chen", role: "student", major: "Electrical Engineering" },
  { id: "jordan", name: "Jordan Reyes", role: "student", major: "Mechanical Engineering" },
  { id: "priya", name: "Priya Shah", role: "mentor", company: "Honda", verified: true }
];

const certifications = [
  // starts empty; Priya's review adds entries like this:
  // { user: "maya", skill: "Soldering", level: "Advanced", by: "priya", project: "battery-monitor" }
];
```

**How a click works**, in plain words: when Priya presses "Submit review", `app.js` reads the levels she picked, adds them to the `certifications` list, saves the list in the browser, and tells the profile page to redraw. When Maya's profile is shown, it looks up her entries in `certifications` and draws a badge for each.

You don't need to write this from scratch. Ask an AI assistant something like: "Using these four files, make the Submit review button add each rating to the certifications list and show it on the profile." Then read what it changed and test it.

## Build order and team split

Get the whole path clickable and ugly first, then make it pretty. A plain flow that works beats a beautiful one that breaks halfway. This plan assumes a team of four; merge roles if you have fewer.

| Phase | Hours | What gets done | Done when |
| --- | --- | --- | --- |
| 1. Set up | 1 | Install tools, make the folder, put it on GitHub, write `data.js` with 3 users, 3 past projects, 1 challenge | Everyone can open the site on their laptop |
| 2. Skeleton | 3–4 | All six screens exist as plain pages, with buttons that move from one to the next and a "Viewing as" dropdown | You can click from screen 1 to screen 7 without getting stuck |
| 3. Make it real | 5–6 | Forms actually save: the listing appears in the feed, Jordan joins the project, skill checkboxes save, the review creates badges | Running the full demo changes what the profile shows |
| 4. Make it pretty | 3–4 | Colors, cards, photos, a logo, badge design | It looks like a real product in a screenshot |
| 5. Rehearse and record | 2–3 | Practice the demo, add a "Reset demo" button, record the video | Video uploaded, well before the deadline |

## Three-person coding split

The work splits along the demo's three acts: Platform and Profile, Challenge to Team, and Project to Review. Each person owns their own files, so nobody edits the same file and you can all work at once.

**Step 0, all three together (30 minutes, before splitting up):** agree on the data. Write `data.js` as a group: the exact fields for users, challenges, listings, messages, projects, skill tags, and certifications. Include one finished sample of everything (a sample team project, a sample certification) so each person can test their part without waiting for the others. After this, only Person A edits `data.js`; ask them for any new field.

|  | **A: Platform and Profile** | **B: Challenge to Team** | **C: Project to Review** |
| --- | --- | --- | --- |
| Demo steps | 1 and 6 (profile before and after) | 2, 3, 4 (challenge, listing, feed, messages, join) | 5 and the review (tagging, submit, Honda review) |
| Files they own | `index.html`, `style.css`, `data.js`, `core.js`, `profile.js` | `challenge.js`, `listings.js`, `messages.js`, `teams.css` | `project.js`, `review.js`, `review.css` |
| Builds | Page shell and top nav. "Viewing as" dropdown. Screen switching. Save, load, and "Reset demo". Profile page with past projects and certification badges. Shared colors, fonts, and card styles | Honda challenge page. "Start a project" listing form. Listings feed and listing detail. One chat thread. "Add to project" button that creates the team project | Project page with "4 weeks later" banner. Per-person skill checkboxes. "Submit to Honda challenge". Priya's review queue. Review form (level per skill per person, comment). Saving certifications |
| Reads from others | Certifications that C creates | Users and the challenge from A | The team project that B creates |
| Hands to others | `showScreen(name)`, `currentUser()`, `save()` in `core.js`, ready within the first 2 hours | A new project in the `projects` list with both members | New entries in the `certifications` list |
| Final job | Publish the demo link; run the full flow end to end | Help A test the full flow | Help A test the full flow |

**Rules that keep it parallel:**

- Each screen lives in its own JavaScript file and draws itself into an empty box in `index.html`. Person A adds those empty boxes on day one, so B and C never touch `index.html`.
- Use only A's shared styles plus your own CSS file. Don't edit `style.css`; ask A.
- Until A's `core.js` is ready, B and C can open their screens directly and use the sample data.
- Commit and sync on GitHub every hour or so, so problems surface early.

## Sharing, backup plan, and traps

**Getting a demo link.** Honda asks for a link to your demo or code. The easiest free option is [Netlify Drop](https://app.netlify.com/drop): drag your `bridge-demo` folder onto the page, and you get a public link in seconds. GitHub Pages also works if your code is already on GitHub.

**Backup plan.** If coding falls badly behind by the halfway point, Honda accepts "a clickable prototype." Mock up the same seven screens in [Figma](https://figma.com) and link them with clicks. It scores lower on "functional prototype" in the rubric, but a complete clickable flow still beats a broken app.

**Common traps:**

- **Building login, a real database, or real messaging.** None of it shows up in a 3-minute video. Fake it.
- **Polishing screen 1 while screen 6 doesn't exist.** Get the whole path working first.
- **The demo breaks on camera.** Add a "Reset demo" button that clears saved changes, and rehearse the exact clicks twice.
- **Uploading the video at the last minute.** Honda says this in capitals. Aim to upload at least two hours early.
- **Blank page with no clue why.** Press F12 in Chrome, open the Console tab, and paste the red error message into your AI assistant.
