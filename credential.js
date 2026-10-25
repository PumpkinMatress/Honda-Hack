// credential.js — shareable, signed certifications. Draws the public "verify" page
// and the Share window that opens from a badge on your own profile.
//
// How it works, in plain words:
//   1. When a reviewer submits a review, each certification is signed with their
//      company's private key. The result is a "token": the details plus a signature.
//   2. The token goes inside a public link:   your-site/#/verify?t=<token>
//   3. The verify page checks the signature with the company's public key. If anyone
//      edits a detail (say, "Beginner" to "Advanced"), the check fails and the page says so.
//
// The details travel inside the link, so the link works on any computer, with no server.
// The token is a standard JSON Web Token (JWT, signed with ES256), so other software,
// like a hiring system, can check it with the company's public key too.
//
// ================= WHAT YOU CAN USE =================
//   openShareDialog(certId)        the Share window: link, LinkedIn, image, embed code
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

// The public key in the standard format other software expects.
function publicKeyJwk(issuer) {
  return { ...issuer.publicKey, kid: issuer.kid, alg: "ES256", use: "sig" };
}

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
    title: () => "Not valid: this certificate was changed",
    text: (c) => `Someone edited these details after ${c.iss || "the company"} signed them. Don't trust what it says.`,
  },
  "unknown-issuer": {
    tone: "invalid", icon: "✕",
    title: () => "Not valid: unknown signer",
    text: (c) => `This certificate wasn't signed by ${c.iss || "the company it names"}.`,
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
      box.innerHTML = verifyBrokenHtml("Certification not found", `It isn't saved in this browser. "Reset demo" may have removed it.`);
      return;
    }
    box.innerHTML = verifyBrokenHtml("Preparing the public link…", "Signing the certification.");
    credentialToken(cert)
      .then((token) => { if (stillShowing()) location.replace(credentialLink(token)); })
      .catch((err) => { if (stillShowing()) box.innerHTML = verifyBrokenHtml("Couldn't create the link", err.message); });
    return;
  }

  const t = readToken(params.t);
  if (!t) {
    box.innerHTML = embed
      ? `<p class="muted small">This badge link is broken.</p>`
      : verifyBrokenHtml("This link is broken", "Part of it may be missing. Ask the person who shared it to send it again.");
    return;
  }

  const draw = (status) => {
    box.innerHTML = embed ? verifyEmbedHtml(t, params.t, status) : verifyPageHtml(t, params.t, status, params);
  };
  const known = checkedTokens[params.t];
  draw(known || "checking");
  if (!known) checkToken(params.t).then((status) => { if (stillShowing()) draw(status); });
});

function verifyPageHtml(t, token, status, params) {
  const c = t.claims;
  const state = VERIFY_STATES[status] || VERIFY_STATES.tampered;
  const level = levelInfo(c.level);
  const issuer = issuerKeyById(t.header.kid);
  const reviewer = users.find((u) => u.name === c.reviewer && u.company === c.iss)
    || { id: c.reviewer || "reviewer", name: c.reviewer || "Reviewer" };

  // Links back into Bridge only make sense if this browser has the certification.
  const savedHere = certifications.some((x) => x.id === c.jti && x.token === token);
  const student = savedHere ? findUser(c.sub) : null;
  const project = savedHere ? findProject(c.projectId) : null;

  const strip = params.test
    ? `<div class="verify-strip verify-strip-test">
         <span>🧪 <strong>Test:</strong> you ${params.test === "level" ? "changed the level to Advanced" : "put a different name on the badge"}
           in the link, but kept ${esc(c.iss)}'s original signature.</span>
         <button class="btn btn-sm" onclick="history.back()">&larr; Back to the real badge</button>
       </div>`
    : `<div class="verify-strip">
         <span>🌐 <strong>Public page.</strong> This is what anyone who opens the link sees, for example from LinkedIn. No account needed.</span>
         <button class="btn btn-sm" data-go="profile">Back to Bridge</button>
       </div>`;

  return `
    <div class="verify-page">
      ${strip}

      <article class="verify-card level-${esc(level.id)} verify-${state.tone}">
        <header class="verify-status" role="status">
          <span class="verify-status-icon" aria-hidden="true">${state.icon}</span>
          <div>
            <strong>${esc(state.title(c))}</strong>
            <div class="small">${esc(state.text(c))}</div>
          </div>
        </header>

        <div class="verify-cert">
          <div class="verify-brand">
            <span class="row"><span class="logo-mark" aria-hidden="true"></span><strong>Bridge</strong></span>
            <span class="verify-label">Skill certification</span>
          </div>

          <div class="verify-main">
            <div class="verify-seal" aria-hidden="true">${esc(level.label[0])}</div>
            <div class="grow">
              <div class="verify-level">${esc(level.label)}</div>
              <h1 class="verify-skill">${esc(c.skill)}</h1>
              ${levelMeter(c.level)}
            </div>
          </div>

          <p class="verify-to">Awarded to <strong>${esc(c.name)}</strong></p>
          ${c.project ? `<p class="muted">For the project <strong>${esc(c.project)}</strong>${c.challenge ? `, submitted to the ${esc(c.iss)} challenge “${esc(c.challenge)}”` : ""}.</p>` : ""}

          <div class="verify-issuer">
            ${avatarHtml(reviewer, "lg")}
            <div>
              <div class="verify-label">Verified by</div>
              <div class="verify-company">${esc(c.iss)}</div>
              <div>${esc(c.reviewer)}${c.reviewerTitle ? `, ${esc(c.reviewerTitle)}` : ""}</div>
            </div>
          </div>

          <dl class="verify-facts">
            <div><dt>Issued</dt><dd>${esc(formatDate(c.date))}</dd></div>
            <div><dt>Credential ID</dt><dd><code>${esc(c.jti)}</code></dd></div>
            <div><dt>Signed with</dt><dd><code>${esc(t.header.kid)}</code></dd></div>
          </dl>

          <p class="verify-meaning small"><strong>${esc(level.label)}</strong> on Bridge means: ${esc(level.meaning)}</p>
        </div>
      </article>

      ${student || project ? `
        <div class="row wrap">
          ${student ? `<button class="btn" data-go="profile" data-user="${esc(student.id)}">View ${esc(student.name.split(" ")[0])}'s profile</button>` : ""}
          ${project ? `<button class="btn btn-ghost" data-go="project" data-id="${esc(project.id)}">See the project</button>` : ""}
        </div>` : ""}

      <section class="card verify-how">
        <h2>How Bridge checks this</h2>
        <ol class="verify-steps">
          <li><strong>Signed.</strong> When ${esc(c.reviewer || "the reviewer")} submitted the review, ${esc(c.iss)}'s private key signed these exact details.</li>
          <li><strong>Checked.</strong> This page tests that signature against ${esc(c.iss)}'s public key, which anyone can see.</li>
          <li><strong>Tamper-proof.</strong> Change even one letter and the check fails.</li>
        </ol>

        ${status === "valid" && !params.test ? `
          <div class="verify-try">
            <div>
              <strong>Try to fake it.</strong>
              <span class="muted small">${c.level !== "advanced"
                ? `What if ${esc(String(c.name).split(" ")[0] || "the student")} edits the link so it says Advanced?`
                : "What if someone puts their own name on this badge?"}</span>
            </div>
            <button class="btn" onclick="tryFakeCredential()">Edit this badge</button>
          </div>` : ""}

        <details class="verify-dev">
          <summary>For developers: the signed token</summary>
          <p class="muted small">A standard JSON Web Token signed with ES256. Check it with any JWT library and ${esc(c.iss)}'s public key below.</p>
          <div class="field">
            <label for="verify-token">Token</label>
            <textarea id="verify-token" class="mono" readonly>${esc(token)}</textarea>
            <div><button class="btn btn-sm" onclick="copyField('verify-token', this)">Copy token</button></div>
          </div>
          <div class="field">
            <span class="label">What it says</span>
            <pre class="mono">${esc(JSON.stringify(c, null, 2))}</pre>
          </div>
          ${issuer ? `
            <div class="field">
              <span class="label">${esc(issuer.company)} public key</span>
              <pre class="mono">${esc(JSON.stringify(publicKeyJwk(issuer), null, 2))}</pre>
            </div>` : ""}
        </details>
      </section>
    </div>`;
}

// The small badge shown inside an <iframe> on someone's own website.
function verifyEmbedHtml(t, token, status) {
  const c = t.claims;
  const state = VERIFY_STATES[status] || VERIFY_STATES.tampered;
  const level = levelInfo(c.level);
  return `
    <a class="embed-badge level-${esc(level.id)} verify-${state.tone}" href="${esc(credentialLink(token))}" target="_blank" rel="noopener">
      <span class="cert-seal" aria-hidden="true">${esc(level.label[0])}</span>
      <span class="embed-body">
        <span class="embed-title">${esc(level.label)} ${esc(c.skill)}</span>
        <span class="embed-by">Verified by <strong>${esc(c.iss)}</strong> · ${esc(c.reviewer)}${c.reviewerTitle ? `, ${esc(c.reviewerTitle)}` : ""}</span>
        <span class="embed-status"><b>${state.icon}</b> ${esc(state.title(c))} · ${esc(c.name)} · Bridge</span>
      </span>
    </a>`;
}

function verifyBrokenHtml(title, text) {
  return `
    <div class="verify-page">
      <div class="empty-state card">
        <div class="empty-icon" aria-hidden="true">🔗</div>
        <h2>${esc(title)}</h2>
        <p class="muted">${esc(text)}</p>
        <button class="btn btn-primary" data-go="profile">Go to Bridge</button>
      </div>
    </div>`;
}

// "Edit this badge": change one detail but keep the old signature, to show the check failing.
function tryFakeCredential() {
  const token = readHash().params.t;
  const t = readToken(token);
  if (!t) return;
  const claims = { ...t.claims };
  let change;
  if (claims.level !== "advanced") { claims.level = "advanced"; change = "level"; }
  else { claims.name = "Alex Imposter"; change = "name"; }
  const fake = encodeJson(t.header) + "." + encodeJson(claims) + "." + t.signature;
  showScreen("verify", { t: fake, test: change });
}

// ---------- The Share window ----------

function openShareDialog(certId) {
  const cert = certifications.find((c) => c.id === certId);
  if (!cert) return;
  closeShareDialog();

  const dialog = document.createElement("dialog");
  dialog.className = "share-dialog";
  dialog.id = "share-dialog";
  dialog.setAttribute("aria-labelledby", "share-title");
  dialog.innerHTML = `
    <div class="share-inner">
      <div class="row-between">
        <h2 id="share-title" tabindex="-1" autofocus>Share your certification</h2>
        <button class="btn btn-ghost btn-sm" onclick="closeShareDialog()" aria-label="Close">✕</button>
      </div>
      <div class="share-body"><p class="muted">Signing with ${esc(certReviewer(cert).company)}'s key…</p></div>
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
      if (dialog.isConnected) dialog.querySelector(".share-body").innerHTML = `<p class="share-warn">${esc(err.message)}</p>`;
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
  const embedCode = `<iframe src="${link}&embed=1" width="440" height="120" style="border:0" title="${level.label} ${c.skill} certification"></iframe>`;

  return `
    <div class="share-preview">${badgeSvg(c)}</div>

    <div class="field">
      <label for="share-link">Public link</label>
      <div class="share-copy">
        <input id="share-link" readonly value="${esc(link)}" onfocus="this.select()">
        <button class="btn btn-primary" onclick="copyField('share-link', this)">Copy link</button>
      </div>
      <p class="muted xsmall">Anyone can open it, no account needed. It proves ${esc(c.iss)} signed this badge, and that nobody changed it.</p>
      ${isLocalAddress() ? `
        <p class="share-warn xsmall">You're running the site on this computer, so this link only opens here.
          Publish the folder (for example with Netlify Drop) to get a link that works for everyone.</p>` : ""}
    </div>

    <div class="share-actions">
      <a class="btn btn-linkedin" href="${esc(linkedInUrl(c, link))}" target="_blank" rel="noopener"><span class="li-mark" aria-hidden="true">in</span> Add to LinkedIn profile</a>
      <button class="btn" onclick="downloadBadge('${esc(cert.id)}')">⬇ Download image</button>
      <button class="btn" onclick="openPublicPage('${esc(cert.id)}')">Open public page ↗</button>
    </div>
    <p class="muted xsmall">LinkedIn opens its "Add license or certification" form with the name, issuer, date, credential ID and link already filled in.</p>

    <details class="share-more">
      <summary>Embed on your own website</summary>
      <p class="muted xsmall">Paste this into any web page. The badge checks its own signature.</p>
      <textarea id="share-embed" class="mono" readonly>${esc(embedCode)}</textarea>
      <div><button class="btn btn-sm" onclick="copyField('share-embed', this)">Copy code</button></div>
      <iframe class="share-embed-preview" src="${esc(link)}&embed=1" width="440" height="120" title="Badge preview" loading="lazy"></iframe>
    </details>

    <details class="share-more">
      <summary>For developers: the signed token</summary>
      <p class="muted xsmall">A standard JSON Web Token (ES256). Any software can check it with ${esc(c.iss)}'s public key.</p>
      <textarea id="share-token" class="mono" readonly>${esc(token)}</textarea>
      <div><button class="btn btn-sm" onclick="copyField('share-token', this)">Copy token</button></div>
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

// True when the site is opened from this computer, so links won't work for others.
function isLocalAddress() {
  const host = location.hostname;
  return location.protocol === "file:" || host === "" || host === "localhost" || host === "127.0.0.1" || host === "[::1]"
    || /^(10|192\.168)\./.test(host);
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

// A 1200 x 630 picture of the certificate (the size LinkedIn uses for shared images).
function badgeSvg(c) {
  const level = levelInfo(c.level);
  const color = cssVar(`--lvl-${level.id}`, "#2453d6");
  const soft = cssVar(`--lvl-${level.id}-soft`, "#e8eefc");
  const primary = cssVar("--primary", "#2453d6");
  const ink = cssVar("--text", "#17202b");
  const muted = cssVar("--muted", "#5d6877");
  const font = "'IBM Plex Sans', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

  const skill = String(c.skill || "");
  const skillSize = Math.min(78, Math.floor(760 / (Math.max(skill.length, 1) * 0.6)));
  const meter = LEVELS.map((l, i) =>
    `<rect x="${340 + i * 72}" y="368" width="62" height="12" rx="6" fill="${i < level.rank ? color : "#e2e6eb"}"/>`).join("");
  const reviewerLine = [c.reviewer, c.reviewerTitle].filter(Boolean).join(", ");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630" font-family="${font}" role="img" aria-label="${esc(`${level.label} ${skill}, verified by ${c.iss}`)}">
  <rect width="1200" height="630" fill="#ffffff"/>
  <circle cx="1140" cy="20" r="290" fill="${soft}"/>
  <rect width="20" height="630" fill="${color}"/>
  <g transform="translate(80 62)">
    <rect width="48" height="48" rx="13" fill="${primary}"/>
    <path d="M10 37 V31 A14 14 0 0 1 38 31 V37" fill="none" stroke="#ffffff" stroke-width="4.6"/>
    <text x="62" y="35" font-size="30" font-weight="800" fill="${ink}">Bridge</text>
  </g>
  <text x="1120" y="97" text-anchor="end" font-size="20" font-weight="700" fill="${muted}" letter-spacing="3">SKILL CERTIFICATION</text>
  <circle cx="190" cy="350" r="118" fill="${soft}"/>
  <circle cx="190" cy="350" r="96" fill="${color}"/>
  <text x="190" y="350" dy="0.35em" text-anchor="middle" font-size="92" font-weight="800" fill="#ffffff">${esc(level.label[0])}</text>
  <text x="340" y="256" font-size="28" font-weight="800" fill="${color}" letter-spacing="5">${esc(level.label.toUpperCase())}</text>
  <text x="340" y="340" font-size="${skillSize}" font-weight="800" fill="${ink}">${esc(skill)}</text>
  ${meter}
  <text x="340" y="448" font-size="30" fill="${muted}">Awarded to <tspan font-weight="700" fill="${ink}">${esc(c.name)}</tspan></text>
  <text x="340" y="502" font-size="30" font-weight="800" fill="${ink}">Verified by ${esc(c.iss)}</text>
  <text x="340" y="542" font-size="26" fill="${muted}">${esc(reviewerLine)}</text>
  <line x1="80" y1="572" x2="1120" y2="572" stroke="#e2e6eb" stroke-width="2"/>
  <text x="80" y="606" font-size="20" fill="${muted}">Issued ${esc(formatDate(c.date))}  ·  Credential ID ${esc(c.jti)}</text>
  <text x="1120" y="606" text-anchor="end" font-size="20" font-weight="700" fill="#1a8a5a">✓ Digitally signed by ${esc(c.iss)}</text>
</svg>`;
}

// Saves the badge as a PNG (falls back to SVG if the browser won't draw it).
function downloadBadge(certId) {
  const cert = certifications.find((c) => c.id === certId);
  const t = cert && readToken(cert.token);
  if (!t) return;
  const svg = badgeSvg(t.claims);
  const name = `${levelInfo(t.claims.level).label}-${t.claims.skill}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const saveSvg = () => saveBlob(new Blob([svg], { type: "image/svg+xml" }), `${name}-certification.svg`);

  const img = new Image();
  img.onload = () => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 2400; // twice the size, so it stays sharp
      canvas.height = 1260;
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => (blob ? saveBlob(blob, `${name}-certification.png`) : saveSvg()), "image/png");
    } catch (err) {
      saveSvg();
    }
  };
  img.onerror = saveSvg;
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
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
