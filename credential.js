// credential.js — shareable, signed skill certifications. Draws the public "verify" page
// (the verifiable credential: clicking any skill certification on Nexus opens it), its
// Share card, and the Share window that opens from a project's skill certifications.
// Styles are in credential.css: the same index-card look as the rest of the site.
//
// How it works, in plain words:
//   1. When a reviewer submits a review, each certification is signed with their
//      company's private key. The result is a "token": the details plus a signature.
//   2. The token goes inside a public link:   your-site/#/verify?t=<token>
//   3. The verify page checks the signature with the company's public key. If anyone
//      edits a detail (say, "Beginner" to "Expert"), the check fails and the page says so.
//
// The details travel inside the link, so the link works on any computer, with no server.
// The token is a standard JSON Web Token (JWT, signed with ES256), so other software,
// like a hiring system, can check it with the company's public key too.
//
// ================= WHAT YOU CAN USE =================
//   openShareDialog(certId)        the Share window: link, LinkedIn, image, embed code
//   shareActionsHtml(...)          the link, LinkedIn and image buttons (page and window)
//   signCertifications(list)       sign new certifications (review.js calls this)
//   credentialToken(cert)          -> Promise of the signed token (signs it the first time)
//   credentialLink(token)          -> the public link for a token
//   showScreen("verify", { t })    the public verify page for a token
//   showScreen("verify", { id })   same, for a certification saved in this browser
//   Add embed: "1" to the verify page to get the small badge used in <iframe> embeds.
// =====================================================

// ---------- Company signing keys ----------
// DEMO ONLY. In a real product each company keeps its private key on its own server
// and never shares it. It publishes only the public key, so anyone can check a
// signature but nobody else can make one. Both sit here so the demo runs without a server.

const ISSUER_KEYS = [
  {
    kid: "honda-2026",
    company: "Honda",
    publicKey: { kty: "EC", crv: "P-256", x: "dMroJHMvT84VIQgfH4iHLDg85hSvIAb69-ndR772kEY", y: "7OdIDinMTs-cjLpzYsmSZZ_vHoCmDN4B4RbvyWDrSd4" },
    privateKey: "PvM4qSWJthrbjJSI0A4SZt04A_JYgVJEK_Jok-LW_HY",
  },
  {
    kid: "aep-2026",
    company: "AEP",
    publicKey: { kty: "EC", crv: "P-256", x: "G7FFEp-vLqRbVHKeuEEHfBZZsI3riVcd5_NzfoxAG7s", y: "fItFQX1Pp0zwKaK9ikb8t4mjKXJ91MovAUdRroXCBv4" },
    privateKey: "sg3HIdrVl4X9rv5fLhb6Hs36sGvTKT24AxCkJV7zbZY",
  },
];

function issuerKeyFor(company) { return ISSUER_KEYS.find((k) => k.company === company); }
function issuerKeyById(kid) { return ISSUER_KEYS.find((k) => k.kid === kid); }

// The browser only allows signing on secure pages (https, or Live Server on localhost).
function canUseCrypto() {
  return Boolean(window.crypto && window.crypto.subtle && window.isSecureContext !== false);
}

const importedKeys = {};
function importIssuerKey(issuer, use) {
  const cacheKey = issuer.kid + ":" + use;
  if (!importedKeys[cacheKey]) {
    const jwk = use === "sign" ? { ...issuer.publicKey, d: issuer.privateKey } : issuer.publicKey;
    importedKeys[cacheKey] = crypto.subtle
      .importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, [use])
      .catch((err) => { delete importedKeys[cacheKey]; throw err; });
  }
  return importedKeys[cacheKey];
}

// ---------- Turning text into link-safe text and back (base64url) ----------

function bytesToB64url(bytes) {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlToBytes(text) {
  const b64 = text.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64 + "===".slice((b64.length + 3) % 4));
  return Uint8Array.from(bin, (ch) => ch.charCodeAt(0));
}

const utf8 = (text) => new TextEncoder().encode(text);
const encodeJson = (obj) => bytesToB64url(utf8(JSON.stringify(obj)));
const decodeJson = (text) => JSON.parse(new TextDecoder().decode(b64urlToBytes(text)));

// ---------- Making a token ----------

// What a certification says, frozen at the moment it's signed.
// jti, iss and sub are standard JWT names: credential ID, issuer, and who it's about.
function credentialClaims(cert) {
  const student = findUser(cert.user);
  const project = findProject(cert.project);
  const challenge = findChallenge(cert.challenge);
  const reviewer = certReviewer(cert);
  return {
    jti: cert.id,
    iss: reviewer.company,
    sub: cert.user,
    name: student ? student.name : "",
    skill: cert.skill,
    level: cert.level,
    reviewer: reviewer.name,
    reviewerTitle: reviewer.title,
    project: project ? project.title : "",
    projectId: cert.project || "",
    challenge: challenge ? challenge.title : "",
    date: cert.date,
  };
}

const signingNow = {}; // certId -> Promise, so two quick clicks don't sign twice

// The certification's token. Signs it the first time and saves it on the certification.
function credentialToken(cert) {
  if (cert.token) return Promise.resolve(cert.token);
  if (!signingNow[cert.id]) {
    signingNow[cert.id] = signCertification(cert).finally(() => delete signingNow[cert.id]);
  }
  return signingNow[cert.id];
}

async function signCertification(cert) {
  if (!canUseCrypto()) throw new Error("Signing only works on a secure page. Open the site with https:// or Live Server.");
  const claims = credentialClaims(cert);
  const issuer = issuerKeyFor(claims.iss);
  if (!issuer) throw new Error(`${claims.iss || "This company"} doesn't have a signing key yet.`);

  const signingInput = encodeJson({ alg: "ES256", typ: "JWT", kid: issuer.kid }) + "." + encodeJson(claims);
  const key = await importIssuerKey(issuer, "sign");
  const signature = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, utf8(signingInput));

  cert.token = signingInput + "." + bytesToB64url(new Uint8Array(signature));
  save();
  return cert.token;
}

// Called by review.js right after a review is submitted.
function signCertifications(list) {
  return Promise.all(list.map(credentialToken)).catch((err) => console.warn("Could not sign certifications:", err));
}

function credentialLink(token) {
  return location.href.split("#")[0] + "#/verify?t=" + token;
}

// ---------- Reading and checking a token ----------

// Splits a token into its parts. Returns null if it isn't a readable token.
function readToken(token) {
  const parts = String(token || "").split(".");
  if (parts.length !== 3 || !parts.every((p) => /^[A-Za-z0-9_-]+$/.test(p))) return null;
  try {
    const header = decodeJson(parts[0]);
    const claims = decodeJson(parts[1]);
    if (!header || !claims || typeof claims.skill !== "string") return null;
    return { header, claims, signingInput: parts[0] + "." + parts[1], signature: parts[2] };
  } catch (err) {
    return null;
  }
}

// -> "valid" | "tampered" | "unknown-issuer" | "cant-check" | "broken"
async function verifyToken(token) {
  const t = readToken(token);
  if (!t) return "broken";
  const issuer = issuerKeyById(t.header.kid);
  if (!issuer || issuer.company !== t.claims.iss || t.header.alg !== "ES256") return "unknown-issuer";
  if (!canUseCrypto()) return "cant-check";
  try {
    const key = await importIssuerKey(issuer, "verify");
    const ok = await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, key, b64urlToBytes(t.signature), utf8(t.signingInput));
    return ok ? "valid" : "tampered";
  } catch (err) {
    return "tampered";
  }
}

const checkedTokens = {}; // token -> result, so redraws are instant

// The first check shows "Checking signature…" for a moment, so people can see it happen.
function checkToken(token) {
  const wait = new Promise((resolve) => setTimeout(resolve, 700));
  return Promise.all([verifyToken(token), wait]).then(([status]) => (checkedTokens[token] = status));
}

// ---------- The public verify page ----------

const VERIFY_STATES = {
  checking: {
    tone: "checking", icon: "",
    title: () => "Checking signature…",
    text: (c) => `Making sure ${c.iss || "the company"} really issued this.`,
  },
  valid: {
    tone: "valid", icon: "✓",
    title: () => "Verified credential",
    text: (c) => `Digitally signed by ${c.iss}. Nothing has been changed since it was issued.`,
  },
  tampered: {
    tone: "invalid", icon: "✕",
    title: () => "Not valid: this skill certification was changed",
    text: (c) => `Someone edited these details after ${c.iss || "the company"} signed them. Don't trust what it says.`,
  },
  "unknown-issuer": {
    tone: "invalid", icon: "✕",
    title: () => "Not valid: unknown signer",
    text: (c) => `This skill certification wasn't signed by ${c.iss || "the company it names"}.`,
  },
  "cant-check": {
    tone: "warn", icon: "!",
    title: () => "Couldn't check the signature",
    text: () => "This browser only checks signatures on secure pages. Open the link with https://.",
  },
};

let verifyDrawCount = 0;

registerScreen("verify", (box, params) => {
  const drawId = String(++verifyDrawCount);
  box.dataset.drawId = drawId;
  const stillShowing = () => box.dataset.drawId === drawId && !box.hidden;
  const embed = params.embed === "1";

  // A certification saved in this browser: sign it if needed, then switch to its public link.
  if (params.id) {
    const cert = certifications.find((c) => c.id === params.id);
    if (!cert) {
      box.innerHTML = verifyBrokenHtml("Skill certification not found", `It isn't saved in this browser. "Reset demo" may have removed it.`);
      return;
    }
    box.innerHTML = verifyBrokenHtml("Preparing the public link…", "Signing the skill certification.");
    credentialToken(cert)
      .then((token) => { if (stillShowing()) location.replace(credentialLink(token)); })
      .catch((err) => { if (stillShowing()) box.innerHTML = verifyBrokenHtml("Couldn't create the link", err.message); });
    return;
  }

  const t = readToken(params.t);
  if (!t) {
    box.innerHTML = embed
      ? `<p class="embed-broken">This badge link is broken.</p>`
      : verifyBrokenHtml("This link is broken", "Part of it may be missing. Ask the person who shared it to send it again.");
    return;
  }

  const draw = (status) => {
    box.innerHTML = embed ? verifyEmbedHtml(t, params.t, status) : verifyPageHtml(t, params.t, status);
  };
  const known = checkedTokens[params.t];
  draw(known || "checking");
  if (!known) checkToken(params.t).then((status) => { if (stillShowing()) draw(status); });
});

// The public page for one skill certification, in the same paper look as the rest of Nexus:
// a strip saying whether the signature checks out, the skill certification on an index card,
// and, for the student it was awarded to, an index card for sharing it (link, LinkedIn, picture).
function verifyPageHtml(t, token, status) {
  const c = t.claims;
  const state = VERIFY_STATES[status] || VERIFY_STATES.tampered;
  const level = levelInfo(c.level);
  const reviewer = users.find((u) => u.name === c.reviewer && u.company === c.iss)
    || { id: c.reviewer || "reviewer", name: c.reviewer || "Reviewer" };

  // Links back into Nexus only make sense if this browser has the skill certification.
  const savedHere = certifications.some((x) => x.id === c.jti && x.token === token);
  const student = savedHere ? findUser(c.sub) : null;
  const project = savedHere ? findProject(c.projectId) : null;
  const viewer = currentUser();
  const isOwner = Boolean(student && viewer && viewer.id === student.id);

  return `
    <div class="nb vf">
      <div class="nb-top">
        <button class="nb-link" data-go="profile">&larr; Back to Nexus</button>
        <span class="vf-public">🌐 Public page: anyone with the link sees this, no account needed</span>
      </div>

      <div class="vf-status vf-${state.tone}" role="status">
        <span class="vf-status-icon" aria-hidden="true">${state.icon}</span>
        <div class="vf-status-text">
          <strong>${esc(state.title(c))}</strong>
          <span>${esc(state.text(c))}</span>
        </div>
      </div>

      <article class="nc vf-card vf-${state.tone}" aria-labelledby="vf-title">
        <header class="nc-head">
          <span class="nb-hole" aria-hidden="true"></span>
          <div class="vf-head-text">
            <span class="vf-kicker">Nexus · Skill certification</span>
            <h1 class="nc-title" id="vf-title">${esc(level.label)} ${esc(c.skill)}</h1>
          </div>
          <span class="nc-date">${esc(shortDate(c.date))}</span>
        </header>
        <div class="vf-body">
          <div class="nc-box vf-badge level-${esc(level.id)}">
            <img src="img/badges/${esc(level.id)}.png" alt="${esc(level.label)} badge">
            <span class="vf-level">${esc(level.label)}</span>
          </div>
          <div class="nc-box vf-details">
            <p class="vf-to">Awarded to <strong>${esc(c.name)}</strong></p>
            ${c.project ? `<p>For the project <strong>${esc(c.project)}</strong>${c.challenge ? `, submitted to the ${esc(c.iss)} challenge “${esc(c.challenge)}”` : ""}.</p>` : ""}
            <div class="vf-issuer">
              ${avatarHtml(reviewer, "lg")}
              <div>
                <span class="vf-label">Verified by</span>
                <strong class="vf-company">${esc(c.iss)}</strong>
                <span>${esc(c.reviewer)}${c.reviewerTitle ? `, ${esc(c.reviewerTitle)}` : ""}</span>
              </div>
            </div>
            <p class="vf-meaning"><strong>${esc(level.label)}</strong> on Nexus means: ${esc(level.meaning)}</p>
            <dl class="vf-facts">
              <div><dt>Issued</dt><dd>${esc(formatDate(c.date))}</dd></div>
              <div><dt>Credential ID</dt><dd>${esc(c.jti)}</dd></div>
            </dl>
          </div>
        </div>
        ${state.tone === "invalid" ? `<span class="vf-void" aria-hidden="true">Not valid</span>` : ""}
      </article>

      ${status === "valid" && isOwner ? `
        <section class="nc vf-card" aria-labelledby="vf-share-title">
          <header class="nc-head">
            <span class="nb-hole" aria-hidden="true"></span>
            <h2 class="nc-title vf-card-title" id="vf-share-title">Share this skill certification</h2>
          </header>
          <div class="vf-body vf-body-1">
            <div class="nc-box">${shareActionsHtml(c, token, "vf")}</div>
          </div>
        </section>` : ""}

      ${student || project ? `
        <div class="nb-actions">
          ${student ? `<button class="pf-btn pf-btn-light" data-go="profile" data-user="${esc(student.id)}">View ${esc(firstName(student))}'s profile</button>` : ""}
          ${project ? `<button class="pf-btn pf-btn-light" data-go="folder" data-id="${esc(project.id)}">See the project</button>` : ""}
        </div>` : ""}
    </div>`;
}

// The small badge shown inside an <iframe> on someone's own website: a little index card.
function verifyEmbedHtml(t, token, status) {
  const c = t.claims;
  const state = VERIFY_STATES[status] || VERIFY_STATES.tampered;
  const level = levelInfo(c.level);
  return `
    <a class="embed-badge vf-${state.tone}" href="${esc(credentialLink(token))}" target="_blank" rel="noopener">
      <img src="img/badges/${esc(level.id)}.png" alt="">
      <span class="embed-body">
        <span class="embed-title">${esc(level.label)} ${esc(c.skill)}</span>
        <span class="embed-by">Verified by <strong>${esc(c.iss)}</strong> · ${esc(c.reviewer)}${c.reviewerTitle ? `, ${esc(c.reviewerTitle)}` : ""}</span>
        <span class="embed-status"><b>${state.icon}</b> ${esc(state.title(c))} · ${esc(c.name)} · Nexus</span>
      </span>
    </a>`;
}

function verifyBrokenHtml(title, text) {
  return `
    <div class="nb vf">
      <section class="nc vf-card">
        <header class="nc-head">
          <span class="nb-hole" aria-hidden="true"></span>
          <h1 class="nc-title vf-card-title">${esc(title)}</h1>
        </header>
        <div class="vf-body vf-body-1">
          <div class="nc-box"><p>${esc(text)}</p></div>
        </div>
      </section>
      <div class="nb-actions">
        <button class="pf-btn pf-btn-light" data-go="profile">Go to Nexus</button>
      </div>
    </div>`;
}

// ---------- Sharing (on the public page and in the Share window) ----------

// The public link and a Copy button, the two LinkedIn buttons, and the badge picture.
// Only the student it was awarded to sees these.
// prefix keeps the ids apart, since the page and the window can both be in the document.
function shareActionsHtml(c, token, prefix) {
  const link = credentialLink(token);
  const linkId = `${prefix}-link`;
  return `
    <div class="sh">
      <div class="sh-copy">
        <input id="${linkId}" readonly value="${esc(link)}" aria-label="Public link" onfocus="this.select()">
        <button type="button" class="pf-btn" onclick="copyField('${linkId}', this)">Copy link</button>
      </div>
      <div class="sh-actions">
        <a class="pf-btn sh-linkedin" href="${esc(linkedInUrl(c, link))}" target="_blank" rel="noopener"><span class="li-mark" aria-hidden="true">in</span> Add to LinkedIn profile</a>
        <a class="pf-btn sh-linkedin" href="${esc(linkedInPostUrl(link))}" target="_blank" rel="noopener"><span class="li-mark" aria-hidden="true">in</span> Post on LinkedIn</a>
        <button type="button" class="pf-btn pf-btn-ghost" onclick="downloadBadge('${esc(c.jti)}')">⬇ Download badge image</button>
      </div>
    </div>`;
}

// ---------- The Share window (Share buttons on a project's skill certifications) ----------
// Styled like the site's other windows (np- styles in profile.css).

function openShareDialog(certId) {
  const cert = certifications.find((c) => c.id === certId);
  if (!cert) return;
  closeShareDialog();

  const dialog = document.createElement("dialog");
  dialog.className = "np-dialog share-dialog";
  dialog.id = "share-dialog";
  dialog.setAttribute("aria-labelledby", "share-title");
  dialog.innerHTML = `
    <div class="np">
      <header class="np-head">
        <h2 class="np-title" id="share-title" tabindex="-1" autofocus>Share your skill certification</h2>
        <button type="button" class="np-x" onclick="closeShareDialog()" aria-label="Close">✕</button>
      </header>
      <div class="np-body share-body"><p class="sh-note">Signing with ${esc(certReviewer(cert).company)}'s key…</p></div>
    </div>`;
  document.body.appendChild(dialog);
  dialog.addEventListener("close", () => dialog.remove());
  dialog.addEventListener("click", (e) => { if (e.target === dialog) closeShareDialog(); }); // click outside
  dialog.showModal();

  credentialToken(cert)
    .then((token) => {
      if (dialog.isConnected) dialog.querySelector(".share-body").innerHTML = shareBodyHtml(cert, token);
    })
    .catch((err) => {
      if (dialog.isConnected) dialog.querySelector(".share-body").innerHTML = `<p class="sh-warn">${esc(err.message)}</p>`;
    });
}

function closeShareDialog() {
  const dialog = document.getElementById("share-dialog");
  if (!dialog) return;
  if (dialog.open) dialog.close();
  dialog.remove();
}

// Going to another screen closes the window.
window.addEventListener("hashchange", closeShareDialog);

function shareBodyHtml(cert, token) {
  const c = readToken(token).claims;
  const level = levelInfo(c.level);
  const link = credentialLink(token);
  const embedCode = `<iframe src="${link}&embed=1" width="440" height="120" style="border:0" title="${level.label} ${c.skill} skill certification"></iframe>`;

  return `
    <div class="share-preview">${badgeSvg(c)}</div>
    ${shareActionsHtml(c, token, "share")}
    <div><button type="button" class="pf-btn pf-btn-ghost" onclick="openPublicPage('${esc(cert.id)}')">Open public page ↗</button></div>

    <details class="sh-more">
      <summary>Embed on your own website</summary>
      <p class="sh-note">Paste this into any web page. The badge checks its own signature.</p>
      <textarea id="share-embed" class="mono" readonly>${esc(embedCode)}</textarea>
      <div><button type="button" class="pf-btn pf-btn-ghost" onclick="copyField('share-embed', this)">Copy code</button></div>
      <iframe class="share-embed-preview" src="${esc(link)}&embed=1" width="440" height="120" title="Badge preview" loading="lazy"></iframe>
    </details>`;
}

function openPublicPage(certId) {
  const cert = certifications.find((c) => c.id === certId);
  if (cert && cert.token) showScreen("verify", { t: cert.token });
}

// LinkedIn's official "Add to profile" link for certifications.
// https://addtoprofile.linkedin.com
function linkedInUrl(c, link) {
  const [year, month] = String(c.date).split("-");
  const params = {
    startTask: "CERTIFICATION_NAME",
    name: `${levelInfo(c.level).label} ${c.skill}`,
    organizationName: c.iss,
    issueYear: year,
    issueMonth: String(Number(month)),
    certUrl: link,
    certId: c.jti,
  };
  return "https://www.linkedin.com/profile/add?" +
    Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
}

// LinkedIn's "share a link in a post" page.
function linkedInPostUrl(link) {
  return "https://www.linkedin.com/sharing/share-offsite/?url=" + encodeURIComponent(link);
}

function copyField(id, button) {
  const field = document.getElementById(id);
  if (!field) return;
  if (!button.dataset.label) button.dataset.label = button.textContent;
  const done = () => {
    button.textContent = "Copied ✓";
    setTimeout(() => (button.textContent = button.dataset.label), 1500);
  };
  const fallback = () => {
    field.select();
    try { document.execCommand("copy"); } catch (err) {}
    done();
  };
  if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(field.value).then(done, fallback);
  else fallback();
}

// ---------- The badge image (for LinkedIn posts, resumes, slides) ----------

function cssVar(name, fallback) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

// A 1200 x 630 picture of the skill certification (the size LinkedIn uses for shared images),
// drawn as a Nexus index card: punched hole, the N logo, a red line and blue rules.
// badgeSrc: the level's badge picture. "" draws a lettered circle instead.
function badgeSvg(c, badgeSrc) {
  const level = levelInfo(c.level);
  const src = badgeSrc === undefined ? `img/badges/${level.id}.png` : badgeSrc;
  const color = cssVar(`--lvl-${level.id}`, "#9a6b14");
  const ink = "#091B2A";
  const soft = "#5A6672";
  const font = "'IBM Plex Sans', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

  const skill = String(c.skill || "");
  const skillSize = Math.min(76, Math.floor(620 / (Math.max(skill.length, 1) * 0.58)));
  const reviewerLine = [c.reviewer, c.reviewerTitle].filter(Boolean).join(", ");
  const rules = [];
  for (let y = 176; y < 630; y += 44) rules.push(`<line x1="0" y1="${y}" x2="1200" y2="${y}" stroke="#BCD2EA" stroke-width="2"/>`);
  const badge = src
    ? `<image href="${esc(src)}" x="95" y="205" width="280" height="280"/>`
    : `<circle cx="235" cy="345" r="110" fill="${color}"/>
       <text x="235" y="345" dy="0.35em" text-anchor="middle" font-size="96" font-weight="800" fill="#ffffff">${esc(level.label[0])}</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630" font-family="${font}" role="img" aria-label="${esc(`${level.label} ${skill}, verified by ${c.iss}`)}">
  <defs><filter id="nx-shadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000000" flood-opacity="0.3"/></filter></defs>
  <rect width="1200" height="630" fill="#FFFDF7"/>
  ${rules.join("")}
  <rect width="1200" height="140" fill="#FFFDF7"/>
  <line x1="0" y1="140" x2="1200" y2="140" stroke="#E08A88" stroke-width="5"/>
  <circle cx="62" cy="72" r="18" fill="${ink}"/>
  <g transform="translate(110 40) rotate(-4 24 28)" filter="url(#nx-shadow)">
    <rect width="48" height="56" fill="#FBF8F1"/>
    <text x="24" y="47" text-anchor="middle" font-size="46" font-weight="700" fill="#0F1E33">N</text>
  </g>
  <text x="178" y="87" font-size="36" font-weight="800" fill="${ink}">Nexus</text>
  <text x="1140" y="84" text-anchor="end" font-size="20" font-weight="800" fill="${soft}" letter-spacing="4">SKILL CERTIFICATION</text>
  <rect x="70" y="180" width="330" height="330" fill="#ffffff" stroke="${ink}" stroke-opacity="0.75" stroke-width="3"/>
  ${badge}
  <rect x="440" y="180" width="690" height="330" fill="#ffffff" stroke="${ink}" stroke-opacity="0.75" stroke-width="3"/>
  <text x="474" y="236" font-size="26" font-weight="800" fill="${color}" letter-spacing="5">${esc(level.label.toUpperCase())}</text>
  <text x="474" y="312" font-size="${skillSize}" font-weight="800" fill="${ink}">${esc(skill)}</text>
  <text x="474" y="374" font-size="30" fill="${soft}">Awarded to <tspan font-weight="700" fill="${ink}">${esc(c.name)}</tspan></text>
  <text x="474" y="432" font-size="30" font-weight="800" fill="${ink}">Verified by ${esc(c.iss)}</text>
  <text x="474" y="474" font-size="24" fill="${soft}">${esc(reviewerLine)}</text>
  <text x="70" y="566" font-size="22" fill="${soft}">Issued ${esc(formatDate(c.date))}  ·  Credential ID ${esc(c.jti)}</text>
  <text x="1130" y="566" text-anchor="end" font-size="22" font-weight="800" fill="#1E6B3A">✓ Digitally signed by ${esc(c.iss)}</text>
</svg>`;
}

// The level's badge picture as a data: link. A picture inside an SVG that's drawn as an image
// can't load other files, so the download needs the picture inside it. "" if it can't be read
// (when the site is opened as a file instead of through Live Server).
function badgeDataUrl(levelId) {
  return fetch(`img/badges/${levelId}.png`)
    .then((r) => (r.ok ? r.blob() : Promise.reject(new Error("No badge picture"))))
    .then((blob) => new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => resolve("");
      reader.readAsDataURL(blob);
    }))
    .catch(() => "");
}

// Saves the badge as a PNG (falls back to SVG if the browser won't draw it).
// Works for a skill certification saved in this browser, or the one on the public page.
function downloadBadge(certId) {
  const cert = certifications.find((c) => c.id === certId);
  const t = readToken((cert && cert.token) || readHash().params.t);
  if (!t || t.claims.jti !== certId) return;
  const name = `${levelInfo(t.claims.level).label}-${t.claims.skill}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  badgeDataUrl(t.claims.level).then((src) => {
    const svg = badgeSvg(t.claims, src);
    const saveSvg = () => saveBlob(new Blob([svg], { type: "image/svg+xml" }), `${name}-skill-certification.svg`);
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 2400; // twice the size, so it stays sharp
        canvas.height = 1260;
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => (blob ? saveBlob(blob, `${name}-skill-certification.png`) : saveSvg()), "image/png");
      } catch (err) {
        saveSvg();
      }
    };
    img.onerror = saveSvg;
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  });
}

function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  // Inside the open window, since everything behind it is blocked while it's open.
  (document.getElementById("share-dialog") || document.body).appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
