// project.js: the skills page (demo step 5), plus the skill and feedback cards on the project view.
// Person C owns this file. Styles are in review.css (classes start with "sk-").
//
// showScreen("project", { id, back: "profile" })        -> the skills page, from a profile folder
// showScreen("project", { id, back: "folder", from })   -> the skills page, from the project view (folder.js)
//
// The skills page only opens from "Mark as completed" (markProjectComplete in profile.js).
// The team checks the main skills each person used, and the page's own "Mark as completed"
// button saves the checks and finishes the project. Submitting to a challenge happens
// afterwards, from the Challenges board (challenge.js).
// Anyone else (or a project that isn't open any more) is sent to the project view instead.
//
// Also drawn on the project view (folder.js), in the same index-card style:
//   projectProgressHtml(p)      the demo's "Skip ahead 4 weeks" box, then the "4 weeks later…" banner
//   projectSkillsCardHtml(p)    who did which skill, and the skill certifications (each one opens its
//                               verifiable credential; students can Share their own)
//   projectFeedbackCardHtml(p)  the reviewer's private feedback (team members only)
// The review screen (review.js) uses projectSkillsCardHtml and feedbackCardHtml too.

registerScreen("project", (box, params) => {
  const p = findProject(params.id);
  if (!p || p.status !== "open" || !p.members.includes(currentUser().id)) {
    // location.replace, so the browser's Back button skips this screen.
    box.innerHTML = "";
    location.replace(location.href.split("#")[0] + "#/folder?" + new URLSearchParams({ id: params.id || "", ...(params.from ? { from: params.from } : {}) }));
    return;
  }
  box.innerHTML = skillsPageHtml(p, params);
});

// The listing for this project. "Create listing" (listings.js) saves the project's id on
// the listing; older listings are matched by the same owner and title.
function projectListing(p) {
  return listings.find((l) => l.project === p.id) ||
    listings.find((l) => l.owner === p.owner && l.projectTitle === p.title);
}

// ---------- The skills page ----------

function skillsPageHtml(p, params) {
  const team = p.members.map(findUser).filter(Boolean);
  const tags = p.skillTags || [];
  const listing = projectListing(p);
  const asked = listing ? listing.skillsNeeded : [];
  // Skills already checked come first, then the ones the listing asked for, then the rest.
  const order = [...new Set([...tags.map((t) => t.skill), ...asked, ...SKILLS])];
  const solo = team.length === 1;

  const rows = order.map((skill) => {
    const tag = tags.find((t) => t.skill === skill);
    const people = tag ? tag.people : [];
    return `
      <tr class="${people.length ? "is-on" : ""}">
        <th scope="row">
          <span class="sk-skill">${esc(skill)}</span>
          ${asked.includes(skill) ? `<span class="sk-tag" title="Your listing asked for this skill">In listing</span>` : ""}
        </th>
        ${team.map((u) => `
          <td class="sk-cell">
            <label class="sk-check" title="${esc(u.name)} used ${esc(skill)}">
              <input type="checkbox" name="sk-person" value="${esc(u.id)}" data-skill="${esc(skill)}"
                     ${people.includes(u.id) ? "checked" : ""} aria-label="${esc(u.name)} used ${esc(skill)}">
              <span aria-hidden="true">✓</span>
            </label>
          </td>`).join("")}
      </tr>`;
  }).join("");

  const backLabel = params.back === "profile" ? "Back to your profile" : "Back to the project";
  return `
    <form class="nb" onsubmit="finishProject(event, '${esc(p.id)}')" onchange="skillCheckChanged(event)" novalidate>
      <div class="nb-top">
        <button type="button" class="nb-link" onclick="leaveSkillsPage('${esc(p.id)}')">&larr; ${esc(backLabel)}</button>
      </div>

      <section class="nc" aria-labelledby="sk-title">
        <header class="nc-head">
          <span class="nb-hole" aria-hidden="true"></span>
          <div class="sk-head-text">
            <span class="sk-kicker">Finishing up</span>
            <h1 class="nc-title" id="sk-title">${esc(p.title)}</h1>
          </div>
          <span class="nc-date">${esc(shortDate(today()))}</span>
        </header>

        <div class="sk-body">
          <div class="nc-box sk-box">
            <h2 class="nc-box-title">Skills used</h2>
            <p>${solo
              ? "Check the main skills you used on this project."
              : "Check the main skills each person used. A reviewer rates every check on its own, so only check what that person really did."}</p>
            <div class="sk-table-wrap">
              <table class="sk-table">
                <thead>
                  <tr>
                    <th>Skill</th>
                    ${team.map((u) => `<th><span class="sk-person">${avatarHtml(u, "sm")} ${esc(firstName(u))}</span></th>`).join("")}
                  </tr>
                </thead>
                <tbody>${rows}</tbody>
              </table>
            </div>
          </div>

          <div class="nc-box sk-box">
            <h2 class="nc-box-title">When you mark it as completed</h2>
            <ul class="sk-list">
              <li>It moves to your completed projects, dated today.</li>
              <li>Each checked skill shows as a stamp on that person's folder.</li>
              ${listing ? `<li>Its listing comes off the Listings page.</li>` : ""}
              <li>Then you can submit it to a challenge from the Challenges page. An industry reviewer certifies each check, and the stamps become badges.</li>
            </ul>
          </div>
        </div>
        <p class="nc-error" id="sk-error" role="alert"></p>
      </section>

      <div class="nb-actions">
        <button type="button" class="nb-link" onclick="leaveSkillsPage('${esc(p.id)}')">Cancel</button>
        <button type="submit" class="pf-btn pf-btn-light">✓ Mark as completed</button>
      </div>
    </form>`;
}

// A box was checked or unchecked: light up its row and clear any old error.
function skillCheckChanged(event) {
  const row = event.target.closest("tr");
  if (row) row.classList.toggle("is-on", Boolean(row.querySelector("input:checked")));
  document.getElementById("sk-error").textContent = "";
}

// Back to where "Mark as completed" was pressed: the profile, or the project view.
function leaveSkillsPage(projectId) {
  const { back, from } = readHash().params;
  if (back === "profile") showScreen("profile");
  else showScreen("folder", { id: projectId, ...(from ? { from } : {}) });
}

// "Mark as completed" at the bottom of the skills page: save the checks and finish the project.
function finishProject(event, projectId) {
  event.preventDefault(); // stop the form from reloading the page
  const p = findProject(projectId);
  if (!p || p.status !== "open") return;

  const checks = [...event.target.querySelectorAll('input[name="sk-person"]:checked')];
  if (!checks.length) {
    document.getElementById("sk-error").textContent =
      p.members.length > 1 ? "Check at least one skill someone on the team used." : "Check at least one skill you used.";
    return;
  }

  // Skills in the order they're listed on the page, people in team order.
  const skills = [...new Set(checks.map((c) => c.dataset.skill))];
  p.skillTags = skills.map((skill) => ({
    skill,
    people: p.members.filter((id) => checks.some((c) => c.dataset.skill === skill && c.value === id)),
  }));
  p.status = "done";
  p.completedOn = today();
  save();
  leaveSkillsPage(p.id);
}

// ---------- Demo: "4 weeks later" (on the project view) ----------

// Demo shortcut: jump to "4 weeks later" instead of typing the pages on camera.
// Shown to the team of any open team project (projects aren't tied to a challenge when they're made).
function projectProgressHtml(p) {
  if (p.status !== "open" || !p.members.includes(currentUser().id)) return "";

  if (p.fastForwarded) {
    const names = p.members.map(findUser).filter(Boolean).map(firstName);
    return `
      <div class="sk-later">
        <div class="sk-later-title">4 weeks later…</div>
        <div class="sk-later-sub">${esc(joinNames(names))} ${names.length > 1 ? "have" : "has"} a working prototype.
          Press <strong>Mark as completed</strong> to check who used which skills.</div>
      </div>`;
  }

  if (p.members.length < 2) return "";
  return `
    <div class="sk-skip">
      <div class="sk-skip-text">
        <span class="sk-demo-tag">Demo</span>
        <strong>Skip ahead 4 weeks</strong>
        <p>Fills in the summary, photos, links and pages the team would have added while building.</p>
      </div>
      <button class="pf-btn pf-btn-light" onclick="skipAheadFourWeeks('${esc(p.id)}')">⏩ Skip ahead</button>
    </div>`;
}

// What the project looks like after "Skip ahead 4 weeks" (the demo's battery monitor).
// Photos fall back to colored boxes until these files are added to img/.
const SAMPLE_PROGRESS = {
    description:
      "We built a pocket-sized monitor that clips onto a 4-cell lithium-ion pack. It reads each cell's voltage, " +
      "the pack current, and two temperature points, then turns all of that into a simple green, yellow, or red " +
      "health rating on a small OLED, so you don't need to know anything about batteries to tell if a pack is safe to use. " +
      "Parts came to about $32.\n\n" +
      "To test it, we ran the pack through 40 charge and discharge cycles on a rig we put together in the makerspace and " +
      "checked every reading against a bench multimeter. Voltage readings stayed within 2% of the meter. " +
      "The enclosure took three printed versions before the board fit with enough room for airflow.",
    photos: [
      "img/battery-monitor-board.jpg",
      "img/battery-monitor-enclosure.jpg",
      "img/battery-monitor-testing.jpg",
    ],
  links: [
    { label: "GitHub", url: "https://github.com/example/battery-monitor" },
    { label: "Enclosure CAD", url: "https://cad.onshape.com/documents/example-battery-monitor" },
  ],
  // The pages the team wrote along the way: [days ago, title, html].
  pages: [
    [27, "Week 1: The plan",
      "<p>Goal: a monitor for a 4-cell pack that anyone can read. We split it up: <b>Bennett</b> on the board and firmware, <b>Jaron</b> on the enclosure and the test rig.</p>" +
      "<ul><li>Cell voltages through a resistor divider into the ADC</li><li>Pack current with an INA219</li><li>Two thermistors, one on each end of the pack</li></ul>"],
    [17, "Week 2: First board",
      "<p>The first board read every cell, but cell 4 was off by 6%. The divider resistors were 5% parts. Swapping to <mark>0.1% resistors</mark> fixed it.</p>"],
    [3, "Week 4: Testing",
      "<h2>40 charge cycles</h2><p>Every reading was checked against a bench multimeter. Voltages stayed within 2%. The third enclosure finally fit the board with room for airflow.</p>"],
  ],
};

function skipAheadFourWeeks(projectId) {
  const p = findProject(projectId);
  const sample = SAMPLE_PROGRESS;
  p.description = sample.description;
  p.photos = sample.photos.slice();
  p.links = sample.links.map((l) => ({ ...l }));
  const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };
  const stamp = Date.now();
  p.pages = (p.pages || []).concat(sample.pages.map(([days, title, html], i) =>
    ({ id: `page-${stamp}-${i}`, title, date: shortDate(daysAgo(days)), html })));
  p.fastForwarded = true;
  save();
  refresh();
}

// ---------- Skills card (on the project view) ----------

// Who did which skill (read-only), and every skill certification the project earned.
// Clicking one opens its verifiable credential; students press Share on their own (credential.js).
function projectSkillsCardHtml(p) {
  const tags = (p.skillTags || []).filter((t) => t.people.length);
  if (!tags.length) return "";
  const me = currentUser();
  const team = p.members.map(findUser).filter(Boolean);
  const certs = sortCerts(certifications.filter((c) => c.project === p.id));
  const status = certs.length ? "Certified" : p.submittedTo ? "Waiting for review" : "Not reviewed yet";

  const rows = tags.map((tag) => `
    <tr>
      <th scope="row"><span class="sk-skill">${esc(tag.skill)}</span></th>
      ${team.map((u) => `<td class="sk-cell">${skillCellHtml(p, tag, u)}</td>`).join("")}
    </tr>`).join("");

  // Beside the table: the skill certifications, or what happens next.
  let side = "";
  if (certs.length) {
    side = `
      <div class="nc-box sk-box">
        <h3 class="nc-box-title">Skill certifications</h3>
        <ul class="sk-certs">${certs.map((c) => certRowHtml(c, me)).join("")}</ul>
      </div>`;
  } else if (p.status === "done" && !p.submittedTo && p.members.includes(me.id)) {
    side = `
      <div class="nc-box sk-box">
        <h3 class="nc-box-title">Get these certified</h3>
        <p>Submit this project to a challenge from the <a href="#/challenges">Challenges page</a>.
          An industry reviewer will rate each check, and the stamps on your folder become badges.</p>
      </div>`;
  }

  return `
    <section class="nc sk-card" aria-label="Skills">
      <header class="nc-head">
        <span class="nb-hole" aria-hidden="true"></span>
        <h2 class="nc-title sk-card-title">Skills: who did what</h2>
        <span class="nc-date">${esc(status)}</span>
      </header>
      <div class="sk-body${side ? "" : " sk-body-1"}">
        <div class="nc-box sk-box">
          <div class="sk-table-wrap">
            <table class="sk-table sk-read">
              <thead>
                <tr>
                  <th>Skill</th>
                  ${team.map((u) => `<th><span class="sk-person">${avatarHtml(u, "sm")} ${esc(firstName(u))}</span></th>`).join("")}
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </div>
        ${side}
      </div>
    </section>`;
}

// One cell: the certified level's badge (a link to its credential), a check, or a dash.
function skillCellHtml(p, tag, user) {
  if (!tag.people.includes(user.id)) return `<span class="sk-none" title="${esc(user.name)} didn't do ${esc(tag.skill)}">–</span>`;
  const cert = certifications.find((c) => c.project === p.id && c.user === user.id && c.skill === tag.skill);
  if (!cert) return `<span class="sk-done" title="${esc(user.name)} used ${esc(tag.skill)}">✓</span>`;
  const level = levelInfo(cert.level);
  const reviewer = certReviewer(cert);
  return `
    <a class="sk-level" href="#/verify?id=${esc(cert.id)}" data-go="verify" data-id="${esc(cert.id)}"
       title="${esc(level.label)} ${esc(tag.skill)}, verified by ${esc(reviewer.company || reviewer.name)}. Open the credential.">
      <img src="img/badges/${esc(level.id)}.png" alt="">${esc(level.label)}
    </a>`;
}

// One skill certification. The whole row opens its verifiable credential (credential.js).
// stopPropagation: pressing Share shouldn't also open the credential page.
function certRowHtml(c, me) {
  const level = levelInfo(c.level);
  const student = findUser(c.user);
  const r = certReviewer(c);
  const by = r.company ? `${r.company} · ${r.name}` : r.name;
  const share = c.user === me.id && c.id && typeof openShareDialog === "function";
  return `
    <li class="sk-cert" data-go="verify" data-id="${esc(c.id)}">
      <img src="img/badges/${esc(level.id)}.png" alt="">
      <div class="sk-cert-text">
        <a class="sk-cert-link" href="#/verify?id=${esc(c.id)}">${esc(level.label)} ${esc(c.skill)}</a>${student ? ` · ${esc(student.name)}` : ""}
        <span>Verified by ${esc(by)} · ${esc(formatDate(c.date))}</span>
      </div>
      ${share ? `<button type="button" class="pf-btn pf-btn-ghost sk-share" onclick="event.stopPropagation(); openShareDialog('${esc(c.id)}')">Share ↗</button>` : ""}
    </li>`;
}

// ---------- Feedback card (on the project view) ----------

// Private reviewer feedback. Only the team members it was written to see it.
function projectFeedbackCardHtml(p) {
  const me = currentUser().id;
  const list = feedback.filter((f) => f.project === p.id && f.to.includes(me));
  return feedbackCardHtml(list, "Reviewer feedback");
}

// An index card of feedback notes. Also used by the review screen for the reviewer's own notes.
function feedbackCardHtml(list, title) {
  if (!list.length) return "";
  return `
    <section class="nc sk-card" aria-label="${esc(title)}">
      <header class="nc-head">
        <span class="nb-hole" aria-hidden="true"></span>
        <h2 class="nc-title sk-card-title">${esc(title)}</h2>
        <span class="nc-date">🔒 Only the team sees this</span>
      </header>
      <div class="sk-body sk-body-1">
        ${list.map(feedbackNoteHtml).join("")}
      </div>
    </section>`;
}

// Person C may use doneWell/toImprove, or a single comment field.
function feedbackNoteHtml(f) {
  const from = findUser(f.from);
  const part = (title, text) => text ? `<h3 class="nc-box-title">${esc(title)}</h3><p>${esc(text)}</p>` : "";
  return `
    <div class="nc-box sk-box">
      <div class="sk-from">
        ${avatarHtml(from, "md")}
        <div>
          <strong>${esc(from ? from.name : "Reviewer")}</strong>${from && from.company ? ` · ${esc(from.company)}` : ""}
          <span>${esc(formatDate(f.date))}</span>
        </div>
      </div>
      ${part("Done well", f.doneWell)}
      ${part("To improve", f.toImprove)}
      ${f.comment ? `<p>${esc(f.comment)}</p>` : ""}
    </div>`;
}

// ---------- Shared with the review screen (review.js) ----------

// ["Maya"] -> "Maya", ["Maya", "Jordan"] -> "Maya and Jordan", 3+ -> "A, B and C"
function joinNames(names) {
  if (names.length < 3) return names.join(" and ");
  return names.slice(0, -1).join(", ") + " and " + names[names.length - 1];
}
