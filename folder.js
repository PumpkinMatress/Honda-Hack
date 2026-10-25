// folder.js — the project view: what opens when you click a project folder. Owned by Person A.
// Styles are in folder.css.
//
// showScreen("folder", { id: "led-cube" })                  -> the title card and the pages
// showScreen("folder", { id, from: "maya" })                -> "Back" returns to that person's profile
// showScreen("folder", { id, edit: "card" })                -> a team member editing the title card
// showScreen("folder", { id, edit: "page", page: pageId })  -> a team member editing one page
// showScreen("folder", { id, page: pageId })                -> scrolled to that page
// showScreen("folder", { id, back: "review" })              -> a reviewer looking before scoring (review.js):
//                                                              "Back" returns to the review queue
//
// The title card is the summary (the short version): title, date, description, a picture of
// the project as it is now (or finished), and optional "Important links".
// Below it are the project's pages, oldest first. The team adds a page as the project goes
// ("+ Add page"), so a project can be as long as it needs to be. Each page is a free sheet
// of notebook paper: text, headings, lists, pictures. Pages can be edited or deleted.
// "Mark as completed" opens the skills page (project.js), where the team checks who used which
// skill. Between the title card and the pages are project.js's skills and feedback cards.
// Submitting to a challenge happens on the Challenges board (challenge.js).
//
// Project fields used here (see data.js):
//   title, description, photos[0] (the title card picture), links: [{ label, url }],
//   pages: [{ id, title, date, html }], status, completedOn

registerScreen("folder", (box, params) => {
  // Don't lose the last few keystrokes if the page redraws while someone is typing.
  if (leafletSaveTimer) saveLeaflet();

  const p = findProject(params.id);
  if (!p) {
    box.innerHTML = `
      <div class="empty-state card">
        <h2>Project not found</h2>
        <p class="muted">It may have been deleted, or "Reset demo" removed it.</p>
        <button class="btn btn-primary" data-go="profile">Back to profile</button>
      </div>`;
    return;
  }

  const isMember = p.members.includes(currentUser().id);
  const edit = isMember ? params.edit : "";
  const editingPage = edit === "page" ? projectPages(p).find((pg) => pg.id === params.page) : null;
  if (edit !== "card") pendingCardImage = undefined;

  box.innerHTML = `
    <div class="nb">
      ${folderTopHtml(p, params)}
      ${reviewPromptHtml(p)}
      ${noteCardHtml(p, edit === "card")}
      ${isMember && !editingPage ? cardActionsHtml(p, edit === "card") : ""}
      ${editingPage ? "" : projectSkillsCardHtml(p) + projectFeedbackCardHtml(p)}
      ${pagesHtml(p, isMember, editingPage)}
    </div>`;

  if (editingPage) setupLeafletEditor(p);

  // Go to the page being edited (or the one just finished, or just added).
  const target = params.page && document.getElementById("pg-" + params.page);
  if (target) requestAnimationFrame(() => target.scrollIntoView({ block: "start" }));
});

// Keeps "from" (whose profile we came from) on every link inside this screen.
function folderParams(p, extra = {}) {
  const from = readHash().params.from;
  return { id: p.id, ...(from ? { from } : {}), ...extra };
}

// The project's pages, oldest first. A project saved before pages existed had a single
// "leaflet"; it becomes the first page.
function projectPages(p) {
  if (!Array.isArray(p.pages)) {
    p.pages = p.leaflet ? [{ id: "page-" + p.id, ...p.leaflet }] : [];
    delete p.leaflet;
  }
  return p.pages;
}

// Back link, plus the challenge the project was submitted to.
function folderTopHtml(p, params) {
  const viewer = currentUser();
  const from = findUser(params.from);
  const backLabel = !from || from.id === viewer.id ? "Back to your profile" : `Back to ${firstName(from)}'s profile`;
  const back = params.back === "review" && viewer.role === "mentor"
    ? `<button class="nb-link" data-go="review">&larr; Back to review queue</button>`
    : `<button class="nb-link" data-go="profile" ${from ? `data-user="${esc(from.id)}"` : ""}>&larr; ${esc(backLabel)}</button>`;
  return `
    <div class="nb-top">
      ${back}
      ${folderChallengeLinkHtml(p, viewer)}
    </div>`;
}

// "🏁 Submitted: Honda challenge", or for the company's reviewer, a link to score it (or see the review).
function folderChallengeLinkHtml(p, viewer) {
  const ch = p.submittedTo && findChallenge(p.submittedTo);
  if (!ch) return "";
  const reviewed = reviewCerts(p).length > 0;
  if (canReview(viewer, p)) {
    return `<button class="nb-link" data-go="review" data-project="${esc(p.id)}">${reviewed ? "See your review" : "Score this submission"} &rarr;</button>`;
  }
  return `<button class="nb-link" data-go="challenges" data-id="${esc(ch.id)}">🏁 ${reviewed ? "Reviewed" : "Submitted"}: ${esc(ch.company)} challenge &rarr;</button>`;
}

// ---------- The title card ----------

function folderDate(p) {
  return p.status === "done" ? shortDate(projectDate(p)) : "In progress";
}

function noteCardHtml(p, editing) {
  const links = projectLinks(p).filter((l) => isWebLink(l.url));
  const showLinks = editing || links.length > 0; // the links box is optional
  return `
    <section class="nc" aria-label="Title card">
      <header class="nc-head">
        <span class="nb-hole" aria-hidden="true"></span>
        ${editing
          ? `<input id="nc-title" class="nc-title-input" value="${esc(p.title)}" maxlength="80" aria-label="Project title">`
          : `<h1 class="nc-title">${esc(p.title)}</h1>`}
        <span class="nc-date">${esc(folderDate(p))}</span>
      </header>
      <div class="nc-body${showLinks ? "" : " nc-no-links"}">
        <div class="nc-box nc-desc">
          ${editing
            ? `<textarea id="nc-desc" aria-label="Summary" placeholder="The short version: what it is, what it does, and where it's at. The full story goes in the pages.">${esc(p.description)}</textarea>`
            : p.description
              ? p.description.split("\n\n").map((para) => `<p>${esc(para)}</p>`).join("")
              : `<p class="nb-muted">No summary yet.</p>`}
        </div>
        ${cardImageHtml(p, editing)}
        ${showLinks ? `
          <div class="nc-box nc-links">
            <h2 class="nc-box-title">Important links${editing ? ` <span class="nc-optional">optional</span>` : ""}</h2>
            ${editing ? cardLinksEditHtml(projectLinks(p)) : cardLinksHtml(links)}
          </div>` : ""}
      </div>
      ${editing ? `<p id="nc-error" class="nc-error"></p>` : ""}
    </section>`;
}

// The picture shows the project as it is right now, or finished once it's done.
function cardImageHtml(p, editing) {
  const photo = editing && pendingCardImage !== undefined ? pendingCardImage : (p.photos && p.photos[0]) || "";
  return `
    <div class="nc-box nc-image">
      <span class="nc-image-empty">${editing ? "Project photo" : "No photo yet"}</span>
      ${photo ? `<img src="${esc(photo)}" alt="${esc(p.title)}" onerror="this.remove()">` : ""}
      ${editing ? `
        <p class="nc-image-hint">Show the project as it is right now. Once it's finished, show the finished version.</p>
        <div class="nc-image-tools">
          <label class="pf-btn">Upload picture<input type="file" accept="image/*" hidden onchange="pickCardImage(this)"></label>
          ${photo ? `<button class="pf-btn pf-btn-light" onclick="pickCardImage(null)">Remove</button>` : ""}
        </div>` : ""}
    </div>`;
}

function cardLinksHtml(links) {
  return `
    <ul class="nc-link-list">
      ${links.map((l) => `
        <li class="nc-link-row">
          <span class="nc-link-label">${esc(l.label || linkHost(l.url))}</span>
          <a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.url.replace(/^https?:\/\/(www\.)?/i, ""))}</a>
        </li>`).join("")}
    </ul>`;
}

// Any links the team wants: GitHub, a video, CAD files, a datasheet... One row each.
function cardLinksEditHtml(links) {
  const rows = links.length ? links : [{ label: "", url: "" }];
  return `
    <div class="nc-link-rows" id="nc-link-rows">${rows.map(linkEditRowHtml).join("")}</div>
    <button type="button" class="nc-add-link" onclick="addLinkRow()">+ Add link</button>`;
}

function linkEditRowHtml(link) {
  return `
    <div class="nc-link-edit">
      <input class="nc-link-name" value="${esc(link.label)}" placeholder="Name" aria-label="Link name">
      <input class="nc-link-url" type="url" value="${esc(link.url)}" placeholder="https://…" aria-label="Link address">
      <button type="button" class="nc-link-remove" onclick="this.closest('.nc-link-edit').remove()" title="Remove link" aria-label="Remove link">✕</button>
    </div>`;
}

function addLinkRow() {
  const rows = document.getElementById("nc-link-rows");
  rows.insertAdjacentHTML("beforeend", linkEditRowHtml({ label: "", url: "" }));
  rows.lastElementChild.querySelector("input").focus();
}

// "https://www.github.com/x" -> "github.com"
function linkHost(url) {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch (err) { return url; }
}

// Under the title card: edit it, and finish (or reopen) the project.
function cardActionsHtml(p, editing) {
  const id = esc(p.id);
  if (editing) {
    return `
      <div class="nb-actions">
        <button class="nb-link" onclick="showScreen('folder', folderParams(findProject('${id}')))">Cancel</button>
        <button class="pf-btn pf-btn-light" onclick="saveCard('${id}')">Save card</button>
      </div>`;
  }
  return `
    <div class="nb-actions">
      ${p.status === "open" ? `<button class="pf-btn pf-btn-light" onclick="markProjectComplete('${id}')">✓ Mark as completed</button>` : ""}
      ${p.status === "done" && !p.submittedTo ? `<button class="nb-link" onclick="reopenProject('${id}')">Reopen project</button>` : ""}
      <button class="pf-btn pf-btn-light" onclick="showScreen('folder', folderParams(findProject('${id}'), { edit: 'card' }))">✏️ Edit card</button>
    </div>`;
}

// A new card picture waiting for "Save card": undefined = unchanged, "" = removed, "data:..." = new.
let pendingCardImage;

function pickCardImage(input) {
  const p = findProject(readHash().params.id);
  const redraw = () => { document.querySelector(".nc-image").outerHTML = cardImageHtml(p, true); };
  if (!input) {
    pendingCardImage = "";
    redraw();
    return;
  }
  const file = input.files && input.files[0];
  if (!file) return;
  shrinkImage(file)
    .then((src) => { pendingCardImage = src; redraw(); })
    .catch(() => alert("The browser can't read that file as a picture. Try a JPG or PNG."));
}

function saveCard(projectId) {
  const p = findProject(projectId);
  const title = document.getElementById("nc-title").value.trim();
  if (!title) {
    document.getElementById("nc-error").textContent = "Give the project a title.";
    return;
  }

  // The challenge page finds a project's listing by its title, so rename the listing too.
  const listing = projectListing(p);
  if (listing && title !== p.title) listing.projectTitle = title;

  p.title = title;
  p.description = document.getElementById("nc-desc").value.trim();
  // Rows with no address are dropped. A link with no name is called by its website.
  p.links = [...document.querySelectorAll(".nc-link-edit")]
    .map((row) => {
      const url = cleanUrl(row.querySelector(".nc-link-url").value);
      return { label: row.querySelector(".nc-link-name").value.trim() || linkHost(url), url };
    })
    .filter((l) => l.url);
  delete p.link; delete p.youtube; delete p.cad; // the old fixed links, now in p.links
  if (pendingCardImage !== undefined) {
    p.photos = (p.photos || []).slice();
    if (pendingCardImage) p.photos[0] = pendingCardImage;
    else p.photos.shift();
    pendingCardImage = undefined;
  }

  if (!save()) {
    document.getElementById("nc-error").textContent = "Couldn't save: the browser's storage is full. Try a smaller picture.";
    return;
  }
  showScreen("folder", folderParams(p));
}

// Only web links, so a typo can't turn into a broken or unsafe link.
function cleanUrl(text) {
  const t = String(text || "").trim();
  if (!t) return "";
  return /^https?:\/\//i.test(t) ? t : "https://" + t;
}

// ---------- The pages ----------

function pagesHtml(p, isMember, editingPage) {
  const pages = projectPages(p);
  return `
    <section class="pgs" aria-label="Pages">
      <h2 class="pgs-title">Pages${pages.length ? ` <span class="pgs-count">${pages.length}</span>` : ""}</h2>
      ${pages.length ? "" : `
        <div class="pg-empty">
          <p><strong>No pages yet.</strong>
            ${isMember
              ? "Pages tell the project's story in order: the plan, sketches, what went wrong, how you fixed it. Add the first page whenever you're ready, then keep adding pages as you go."
              : "The team hasn't written any pages yet."}</p>
        </div>`}
      ${pages.map((pg, i) => pageHtml(p, pg, i, isMember, editingPage)).join("")}
      ${isMember && !editingPage ? `
        <div class="pg-add">
          <button class="pf-btn pf-btn-light" onclick="addPage('${esc(p.id)}')">+ Add page</button>
        </div>` : ""}
    </section>`;
}

function pageHtml(p, pg, i, isMember, editingPage) {
  const editing = Boolean(editingPage) && editingPage.id === pg.id;
  const number = i + 1;
  const body = cleanLeafletHtml(pg.html || "");
  const empty = isMember
    ? "Nothing on this page yet. Click Edit page to write about this part of the project and add pictures."
    : "Nothing written here yet.";
  const pid = esc(p.id);
  const gid = esc(pg.id);

  return `
    <section class="lf ${editing ? "lf-editing" : ""}" id="pg-${gid}" aria-label="Page ${number}">
      ${editing ? leafletToolbarHtml(p, pg) : ""}
      <div class="lf-paper">
        <span class="nb-hole lf-hole" aria-hidden="true"></span>
        <span class="lf-num" title="Page ${number}">${number}</span>
        ${isMember && !editingPage ? `<button class="lf-delete" type="button" title="Delete page" aria-label="Delete page ${number}" onclick="deletePage('${pid}', '${gid}')">${TRASH_ICON}</button>` : ""}
        <header class="lf-head">
          ${editing
            ? `<input id="lf-title" class="lf-title-input" value="${esc(pg.title)}" placeholder="Page ${number}" aria-label="Page title" oninput="scheduleLeafletSave()">
               <input id="lf-date" class="lf-date-input" value="${esc(pg.date)}" placeholder="Date" aria-label="Date" oninput="scheduleLeafletSave()">`
            : `<h2 class="lf-title">${esc(pg.title || `Page ${number}`)}</h2><span class="lf-date">${esc(pg.date)}</span>`}
        </header>
        ${editing
          ? `<div id="lf-body" class="lf-body" contenteditable="true" spellcheck="true" data-project="${pid}" data-page="${gid}"
               data-placeholder="Write about this part of the project: what you did, sketches, photos, what went wrong…">${body}</div>`
          : `<div class="lf-body">${body || `<p class="nb-muted">${esc(empty)}</p>`}</div>`}
      </div>
      ${isMember && !editingPage ? `
        <div class="nb-actions">
          <button class="pf-btn pf-btn-light" onclick="showScreen('folder', folderParams(findProject('${pid}'), { edit: 'page', page: '${gid}' }))">✏️ Edit page</button>
        </div>` : ""}
    </section>`;
}

// A new blank page at the end, dated today, open for writing.
function addPage(projectId) {
  const p = findProject(projectId);
  if (!p) return;
  const page = { id: "page-" + Date.now(), title: "", date: shortDate(today()), html: "" };
  projectPages(p).push(page);
  save();
  showScreen("folder", folderParams(p, { edit: "page", page: page.id }));
}

async function deletePage(projectId, pageId) {
  const p = findProject(projectId);
  const pages = p ? projectPages(p) : [];
  const index = pages.findIndex((pg) => pg.id === pageId);
  if (index === -1) return;
  const name = pages[index].title || `Page ${index + 1}`;
  const ok = await confirmDialog({
    title: "Delete this page?",
    text: `"${name}" and everything on it will be deleted. This can't be undone.`,
    confirm: "Delete page",
    danger: true,
  });
  if (!ok) return;
  pages.splice(index, 1);
  save();
  const y = window.scrollY;
  refresh();
  window.scrollTo(0, y);
}

function leafletToolbarHtml(p, pg) {

  const tool = (cmd, label, title) => `<button class="lf-tool" data-cmd="${cmd}" title="${esc(title)}" aria-label="${esc(title)}">${label}</button>`;
  const imgTool = (cmd, label, title) => `<button class="lf-tool" data-img="${cmd}" title="${esc(title)}">${label}</button>`;
  return `
    <div class="lf-toolbar" role="toolbar" aria-label="Page tools">
      <div class="lf-tools">
        ${tool("heading", "H", "Heading")}
        ${tool("bold", "<b>B</b>", "Bold")}
        ${tool("italic", "<i>I</i>", "Italic")}
        ${tool("underline", "<u>U</u>", "Underline")}
        ${tool("highlight", `<span class="lf-hl-icon">A</span>`, "Highlight")}
        <span class="lf-sep"></span>
        ${tool("bullets", "• List", "Bulleted list")}
        ${tool("numbers", "1. List", "Numbered list")}
        ${tool("link", "Link", "Add a link")}
        ${tool("image", "🖼 Picture", "Add a picture")}
        <input id="lf-file" type="file" accept="image/*" multiple hidden>
      </div>
      <div class="lf-tools lf-img-tools" hidden>
        <span class="lf-tools-label">Picture:</span>
        ${imgTool("s", "Small", "Small")}
        ${imgTool("m", "Medium", "Medium")}
        ${imgTool("l", "Full width", "Full width")}
        <span class="lf-sep"></span>
        ${imgTool("left", "Left", "Text wraps on the right")}
        ${imgTool("center", "Center", "On its own line")}
        ${imgTool("right", "Right", "Text wraps on the left")}
        <span class="lf-sep"></span>
        ${imgTool("remove", "Remove", "Remove picture")}
      </div>
      <div class="lf-tools lf-tools-end">
        <span id="lf-status" class="lf-status">Saved</span>
        <button class="pf-btn" onclick="finishLeaflet('${esc(p.id)}', '${esc(pg.id)}')">Done</button>
      </div>
    </div>`;
}

// ---------- Page editor ----------
// (Pages used to be called the "leaflet", so the editor's names still say leaflet / lf-.)

const LF_HIGHLIGHT = "#FFE27A";
let leafletSaveTimer = null;
let leafletRange = null;   // where to put a picture once the file is chosen
let pickedImage = null;    // the picture whose size/position tools are showing

function setupLeafletEditor(p) {
  const editor = document.getElementById("lf-body");
  const toolbar = document.querySelector(".lf-toolbar");
  const fileInput = document.getElementById("lf-file");
  pickedImage = null;

  // Highlights are saved as <mark>. The browser's highlight tool works on colored spans.
  editor.querySelectorAll("mark").forEach((m) => {
    const span = document.createElement("span");
    span.style.backgroundColor = LF_HIGHLIGHT;
    span.append(...m.childNodes);
    m.replaceWith(span);
  });

  try { document.execCommand("defaultParagraphSeparator", false, "p"); } catch (err) {}

  // Keep the text selection when a toolbar button is pressed.
  toolbar.addEventListener("mousedown", (e) => { if (e.target.closest(".lf-tool")) e.preventDefault(); });
  toolbar.addEventListener("click", (e) => {
    const button = e.target.closest(".lf-tool");
    if (!button) return;
    if (button.dataset.cmd) runLeafletCommand(button.dataset.cmd, fileInput);
    if (button.dataset.img) changePickedImage(button.dataset.img);
  });

  editor.addEventListener("input", scheduleLeafletSave);
  editor.addEventListener("click", (e) => pickImage(e.target.tagName === "IMG" ? e.target : null));

  fileInput.addEventListener("change", () => {
    insertPictures([...fileInput.files]);
    fileInput.value = "";
  });

  // Paste: pictures are shrunk and inserted; other content is cleaned first.
  editor.addEventListener("paste", (e) => {
    const data = e.clipboardData;
    if (!data) return;
    const files = [...data.files].filter((f) => f.type.startsWith("image/"));
    e.preventDefault();
    if (files.length) {
      leafletRange = currentEditorRange();
      insertPictures(files);
    } else if (data.getData("text/html")) {
      document.execCommand("insertHTML", false, cleanLeafletHtml(data.getData("text/html")));
    } else {
      document.execCommand("insertText", false, data.getData("text/plain"));
    }
  });

  // Drag pictures from your computer onto the page.
  editor.addEventListener("dragover", (e) => { if ([...e.dataTransfer.types].includes("Files")) e.preventDefault(); });
  editor.addEventListener("drop", (e) => {
    const files = [...e.dataTransfer.files].filter((f) => f.type.startsWith("image/"));
    if (!files.length) return;
    e.preventDefault();
    leafletRange = rangeAtPoint(e.clientX, e.clientY);
    insertPictures(files);
  });

  // Light up B / I / U / lists when the cursor is in that kind of text.
  document.addEventListener("selectionchange", updateToolStates);
}

function runLeafletCommand(cmd, fileInput) {
  const editor = document.getElementById("lf-body");
  editor.focus();
  switch (cmd) {
    case "heading": {
      const current = String(document.queryCommandValue("formatBlock") || "").toLowerCase();
      document.execCommand("formatBlock", false, current === "h2" ? "p" : "h2");
      break;
    }
    case "bold":
    case "italic":
    case "underline":
      document.execCommand(cmd);
      break;
    case "highlight": {
      const on = sameColor(document.queryCommandValue("hiliteColor"), LF_HIGHLIGHT);
      document.execCommand("hiliteColor", false, on ? "transparent" : LF_HIGHLIGHT);
      break;
    }
    case "bullets":
      document.execCommand("insertUnorderedList");
      break;
    case "numbers":
      document.execCommand("insertOrderedList");
      break;
    case "link": {
      const range = currentEditorRange();
      const url = prompt("Link address (https://…)");
      if (!url) return;
      restoreRange(range);
      if (range && !range.collapsed) document.execCommand("createLink", false, cleanUrl(url));
      else document.execCommand("insertHTML", false, `<a href="${esc(cleanUrl(url))}">${esc(url)}</a>`);
      break;
    }
    case "image":
      leafletRange = currentEditorRange();
      fileInput.click();
      return;
  }
  scheduleLeafletSave();
  updateToolStates();
}

function updateToolStates() {
  const editor = document.getElementById("lf-body");
  if (!editor) { document.removeEventListener("selectionchange", updateToolStates); return; }
  if (!editor.contains(document.activeElement) && document.activeElement !== editor) return;
  const states = {
    bold: document.queryCommandState("bold"),
    italic: document.queryCommandState("italic"),
    underline: document.queryCommandState("underline"),
    bullets: document.queryCommandState("insertUnorderedList"),
    numbers: document.queryCommandState("insertOrderedList"),
    heading: String(document.queryCommandValue("formatBlock") || "").toLowerCase() === "h2",
    highlight: sameColor(document.queryCommandValue("hiliteColor"), LF_HIGHLIGHT),
  };
  document.querySelectorAll(".lf-tool[data-cmd]").forEach((b) => b.classList.toggle("on", Boolean(states[b.dataset.cmd])));
}

// "rgb(255, 226, 122)" vs "#FFE27A"
function sameColor(value, hex) {
  const m = String(value || "").match(/\d+/g);
  if (!m || m.length < 3) return false;
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return Number(m[0]) === r && Number(m[1]) === g && Number(m[2]) === b;
}

function currentEditorRange() {
  const editor = document.getElementById("lf-body");
  const sel = window.getSelection();
  if (!sel.rangeCount) return null;
  const range = sel.getRangeAt(0);
  return editor.contains(range.commonAncestorContainer) ? range.cloneRange() : null;
}

function restoreRange(range) {
  const editor = document.getElementById("lf-body");
  editor.focus();
  const sel = window.getSelection();
  sel.removeAllRanges();
  if (range) {
    sel.addRange(range);
  } else {
    const end = document.createRange();
    end.selectNodeContents(editor);
    end.collapse(false);
    sel.addRange(end);
  }
}

function rangeAtPoint(x, y) {
  if (document.caretRangeFromPoint) return document.caretRangeFromPoint(x, y);
  const pos = document.caretPositionFromPoint && document.caretPositionFromPoint(x, y);
  if (!pos) return null;
  const range = document.createRange();
  range.setStart(pos.offsetNode, pos.offset);
  range.collapse(true);
  return range;
}

// Shrinks each picture so it fits in the browser's storage, then puts it at the cursor.
function insertPictures(files) {
  const pictures = files.filter((f) => f.type.startsWith("image/"));
  if (!pictures.length) return;
  setLeafletStatus("Adding picture…");
  Promise.all(pictures.map((f) => shrinkImage(f).catch(() => null))).then((sources) => {
    const ok = sources.filter(Boolean);
    if (!ok.length) {
      setLeafletStatus("The browser can't read that file as a picture. Try a JPG or PNG.", true);
      return;
    }
    restoreRange(leafletRange);
    leafletRange = null;
    document.execCommand("insertHTML", false, ok.map((src) => `<img src="${src}" class="lf-m lf-center" alt="">`).join(""));
    scheduleLeafletSave();
  });
}

function pickImage(img) {
  if (pickedImage) pickedImage.classList.remove("lf-picked");
  pickedImage = img;
  if (img) img.classList.add("lf-picked");
  const tools = document.querySelector(".lf-img-tools");
  if (tools) tools.hidden = !img;
}

function changePickedImage(tool) {
  const img = pickedImage;
  if (!img || !img.isConnected) return pickImage(null);
  if (tool === "remove") {
    img.remove();
    pickImage(null);
  } else if (["s", "m", "l"].includes(tool)) {
    img.classList.remove("lf-s", "lf-m", "lf-l");
    img.classList.add("lf-" + tool);
  } else {
    img.classList.remove("lf-left", "lf-center", "lf-right");
    img.classList.add("lf-" + tool);
  }
  scheduleLeafletSave();
}

function scheduleLeafletSave() {
  setLeafletStatus("Saving…");
  clearTimeout(leafletSaveTimer);
  leafletSaveTimer = setTimeout(saveLeaflet, 400);
}

function saveLeaflet() {
  clearTimeout(leafletSaveTimer);
  leafletSaveTimer = null;
  const editor = document.getElementById("lf-body");
  if (!editor) return true;
  const p = findProject(editor.dataset.project);
  const page = p && projectPages(p).find((pg) => pg.id === editor.dataset.page);
  if (!page) return true;
  page.title = document.getElementById("lf-title").value.trim();
  page.date = document.getElementById("lf-date").value.trim();
  page.html = cleanLeafletHtml(editor.innerHTML);
  const ok = save();
  setLeafletStatus(ok ? "Saved" : "Couldn't save: the browser's storage is full. Try removing a picture.", !ok);
  return ok;
}

// "Done": save, stop editing, and stay on that page.
function finishLeaflet(projectId, pageId) {
  if (!saveLeaflet()) return;
  showScreen("folder", folderParams(findProject(projectId), { page: pageId }));
}

function setLeafletStatus(text, isError) {
  const el = document.getElementById("lf-status");
  if (!el) return;
  el.textContent = text;
  el.classList.toggle("lf-status-error", Boolean(isError));
}

// Save before leaving the screen or closing the tab.
window.addEventListener("hashchange", () => { if (leafletSaveTimer) saveLeaflet(); });
window.addEventListener("beforeunload", () => { if (leafletSaveTimer) saveLeaflet(); });

// ---------- Pictures ----------

// Reads a picture file and shrinks it (longest side 1100px, JPEG), so a few of them
// fit in the browser's storage. Resolves to a "data:image/jpeg;base64,..." string.
function shrinkImage(file, maxSide = 1100) {
  return new Promise((resolve, reject) => {
    if (!file || !/^image\//.test(file.type)) return reject(new Error("Not a picture"));
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff"; // transparent PNGs get a white background
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Unreadable picture")); };
    img.src = url;
  });
}

// ---------- Cleaning page content ----------
// Each page is saved as HTML. Before saving or showing it, everything except a
// short list of safe tags is removed: no scripts, no event handlers, no outside styles.

const LF_TAGS = new Set(["P", "DIV", "BR", "H2", "H3", "B", "STRONG", "I", "EM", "U", "S", "MARK", "UL", "OL", "LI", "BLOCKQUOTE", "A", "IMG", "HR"]);
const LF_DROP = new Set(["SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED", "LINK", "META", "TEMPLATE", "SVG", "MATH", "FORM",
  "INPUT", "BUTTON", "SELECT", "TEXTAREA", "NOSCRIPT", "VIDEO", "AUDIO", "CANVAS", "HEAD", "TITLE"]);
const LF_RENAME = { H1: "H2", H4: "H3", H5: "H3", H6: "H3", STRIKE: "S", DEL: "S" };
const LF_IMG_CLASSES = ["lf-s", "lf-m", "lf-l", "lf-left", "lf-center", "lf-right"];

function cleanLeafletHtml(html) {
  const source = new DOMParser().parseFromString(`<body>${html || ""}</body>`, "text/html");
  const inert = document.implementation.createHTMLDocument(""); // nothing here loads or runs
  const out = inert.createElement("div");
  source.body.childNodes.forEach((node) => appendClean(node, out, inert));
  return out.innerHTML;
}

function appendClean(node, parent, doc) {
  if (node.nodeType === Node.TEXT_NODE) {
    parent.appendChild(doc.createTextNode(node.textContent));
    return;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return;

  let tag = LF_RENAME[node.tagName] || node.tagName;
  if (LF_DROP.has(tag)) return;
  // The browser's highlight tool makes <span style="background-color: ...">.
  if (tag === "SPAN" && isHighlighted(node)) tag = "MARK";

  // Anything else (span, font, section...): keep what's inside, drop the tag.
  if (!LF_TAGS.has(tag)) {
    node.childNodes.forEach((child) => appendClean(child, parent, doc));
    return;
  }

  if (tag === "IMG") {
    const src = node.getAttribute("src") || "";
    if (!/^data:image\/(png|jpe?g|gif|webp);base64,[a-z0-9+/=\s]+$/i.test(src) && !/^https?:\/\//i.test(src)) return;
    const img = doc.createElement("img");
    img.setAttribute("src", src);
    img.setAttribute("alt", node.getAttribute("alt") || "");
    const classes = [...node.classList].filter((c) => LF_IMG_CLASSES.includes(c));
    if (classes.length) img.setAttribute("class", classes.join(" "));
    parent.appendChild(img);
    return;
  }

  if (tag === "A") {
    const href = node.getAttribute("href") || "";
    if (!/^(https?:|mailto:)/i.test(href)) {
      node.childNodes.forEach((child) => appendClean(child, parent, doc));
      return;
    }
    const a = doc.createElement("a");
    a.setAttribute("href", href);
    a.setAttribute("target", "_blank");
    a.setAttribute("rel", "noopener");
    node.childNodes.forEach((child) => appendClean(child, a, doc));
    parent.appendChild(a);
    return;
  }

  const el = doc.createElement(tag.toLowerCase());
  node.childNodes.forEach((child) => appendClean(child, el, doc));
  parent.appendChild(el);
}

function isHighlighted(span) {
  const bg = (span.style && span.style.backgroundColor) || "";
  return bg && bg !== "transparent" && !/^rgba\(\s*0,\s*0,\s*0,\s*0\s*\)$/.test(bg);
}
