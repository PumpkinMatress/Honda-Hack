// search.js — the Search box in the top bar. Owned by Person A.
// As you type, it lists matching people, projects, challenges and listings.
// Click a result (or use the arrow keys and Enter) to open it.

function searchGroups(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const has = (...texts) => texts.some((t) => String(t || "").toLowerCase().includes(q));
  const names = (ids) => ids.map(findUser).filter(Boolean).map((u) => u.name).join(", ");

  const groups = [
    {
      label: "People",
      items: users
        .filter((u) => has(u.name, u.major, u.title, u.company, ...(u.skills || [])))
        .map((u) => ({
          title: u.name,
          sub: u.role === "mentor" ? `${u.title} · ${u.company}` : u.major,
          screen: "profile", params: { user: u.id },
        })),
    },
    {
      label: "Projects",
      items: projects
        .filter((p) => has(p.title, p.description, ...(p.skillTags || []).map((t) => t.skill)))
        .map((p) => ({ title: p.title, sub: names(p.members), screen: "folder", params: { id: p.id, from: p.owner } })),
    },
    {
      label: "Challenges",
      items: challenges
        .filter((c) => has(c.title, c.company, c.prompt, ...c.targetSkills))
        .map((c) => ({ title: c.title, sub: `${c.company} challenge`, screen: "challenges", params: { id: c.id } })),
    },
    {
      label: "Listings",
      items: listings
        .filter((l) => has(l.projectTitle, l.role, l.details, ...l.skillsNeeded))
        .map((l) => ({ title: l.projectTitle, sub: `Looking for: ${l.role}`, screen: "listings", params: { id: l.id } })),
    },
  ];
  return groups.map((g) => ({ ...g, items: g.items.slice(0, 4) })).filter((g) => g.items.length);
}

(function setupSearch() {
  const input = document.getElementById("search-input");
  const panel = document.getElementById("search-results");
  if (!input || !panel) return;
  let results = [];
  let active = 0;

  function draw() {
    const groups = searchGroups(input.value);
    results = groups.flatMap((g) => g.items);
    active = Math.min(active, Math.max(0, results.length - 1));
    if (!input.value.trim()) {
      panel.hidden = true;
      return;
    }
    let i = 0;
    panel.innerHTML = groups.length
      ? groups.map((g) => `
          <div class="search-group">${esc(g.label)}</div>
          ${g.items.map((r) => {
            const n = i++;
            return `<div class="search-item${n === active ? " on" : ""}" data-i="${n}" role="option">
                      <span>${esc(r.title)}</span>${r.sub ? `<small>${esc(r.sub)}</small>` : ""}
                    </div>`;
          }).join("")}`).join("")
      : `<div class="search-empty">Nothing matches “${esc(input.value.trim())}”.</div>`;
    panel.hidden = false;
  }

  function open(result) {
    if (!result) return;
    input.value = "";
    panel.hidden = true;
    input.blur();
    showScreen(result.screen, result.params);
  }

  input.addEventListener("input", () => { active = 0; draw(); });
  input.addEventListener("focus", draw);
  input.addEventListener("blur", () => setTimeout(() => (panel.hidden = true), 120));
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!results.length) return;
      active = (active + (e.key === "ArrowDown" ? 1 : results.length - 1)) % results.length;
      draw();
    } else if (e.key === "Enter") {
      e.preventDefault();
      open(results[active]);
    } else if (e.key === "Escape") {
      input.value = "";
      panel.hidden = true;
      input.blur();
    }
  });
  // mousedown, not click, so it runs before the input loses focus.
  panel.addEventListener("mousedown", (e) => {
    const item = e.target.closest("[data-i]");
    if (!item) return;
    e.preventDefault();
    open(results[Number(item.dataset.i)]);
  });
})();
