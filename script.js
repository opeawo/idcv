const state = {
  method: null,
  name: null,
  domain: null,
  freeDomain: null,
  proof: null,
  date: "2026-04-04",
  timeouts: [],
};

const mockProfiles = {
  linkedin: { name: "John Doe", proof: "johndoe" },
  self: { name: "Jane Builder", proof: "0xabc123def456proof" },
};

// ── Sections ──

const landing = document.getElementById("landing");
const overlay = document.getElementById("verify-overlay");
const dashboard = document.getElementById("dashboard");

// ── Overlay elements ──

const vSteps = document.querySelectorAll(".v-step");
const progressFill = document.getElementById("progress-fill");
const verifyLog = document.getElementById("verify-log");
const logLines = verifyLog.querySelectorAll("li");
const dnsPreview = document.getElementById("dns-preview");
const previewRecord = document.getElementById("preview-record");
const confirmedName = document.getElementById("confirmed-name");
const registeringDomain = document.getElementById("registering-domain");

// ── Claim elements ──

const domainInput = document.getElementById("domain-input");
const pricingHint = document.getElementById("pricing-hint");
const claimBtn = document.getElementById("claim-btn");

// ── Helpers ──

function showSection(section) {
  [landing, overlay, dashboard].forEach((s) => s.classList.add("hidden"));
  section.classList.remove("hidden");
}

function showVStep(name) {
  vSteps.forEach((s) => s.classList.remove("active"));
  const target = document.querySelector(`[data-step="${name}"]`);
  if (target) target.classList.add("active");
}

function deriveDomain(name) {
  return name.toLowerCase().replace(/\s+/g, "");
}

function buildProof(method, proof, date) {
  return method === "linkedin"
    ? `id-cv=linkedin:${proof}|${date}`
    : `id-cv=self:${proof}|${date}`;
}

function clearTimeouts() {
  state.timeouts.forEach(clearTimeout);
  state.timeouts = [];
}

function resetVerifyStep() {
  logLines.forEach((li) => li.classList.remove("visible", "done"));
  progressFill.style.width = "0%";
  dnsPreview.classList.add("hidden");
}

// ── Landing CTA ──

document.querySelectorAll("#hero-cta .btn-oauth").forEach((btn) => {
  btn.addEventListener("click", () => {
    startVerification(btn.dataset.method);
  });
});

// ── Verification flow ──

function startVerification(method) {
  state.method = method;
  const profile = mockProfiles[method];
  state.name = profile.name;
  state.proof = profile.proof;
  state.domain = deriveDomain(profile.name);
  state.freeDomain = state.domain;

  // Update text for chosen method
  const connectText = document.querySelector('[data-line="connect"] .log-text');
  connectText.textContent =
    method === "linkedin" ? "Connecting to LinkedIn..." : "Connecting to Self.xyz...";
  confirmedName.textContent = profile.name;
  registeringDomain.textContent = state.domain + ".cv";

  resetVerifyStep();
  showSection(overlay);
  showVStep("verify");

  const schedule = [
    { line: "connect", delay: 0, progress: 10 },
    { line: "identity", delay: 1000, progress: 30, donePrev: "connect" },
    { line: "confirmed", delay: 2500, progress: 50, donePrev: "identity", selfDone: true },
    { line: "register", delay: 3500, progress: 70 },
    { line: "dns", delay: 4200, progress: 85, donePrev: "register" },
  ];

  schedule.forEach(({ line, delay, progress, donePrev, selfDone }) => {
    const t = setTimeout(() => {
      if (donePrev) {
        const prev = document.querySelector(`[data-line="${donePrev}"]`);
        if (prev) prev.classList.add("done");
      }
      const el = document.querySelector(`[data-line="${line}"]`);
      if (el) {
        el.classList.add("visible");
        if (selfDone) el.classList.add("done");
      }
      progressFill.style.width = progress + "%";
    }, delay);
    state.timeouts.push(t);
  });

  // Show DNS preview
  state.timeouts.push(
    setTimeout(() => {
      document.querySelector('[data-line="dns"]').classList.add("done");
      progressFill.style.width = "100%";
      const proofStr = buildProof(method, profile.proof, state.date);
      previewRecord.textContent = `${state.domain}.cv TXT "${proofStr}"`;
      dnsPreview.classList.remove("hidden");
    }, 5200)
  );

  // Auto-advance to claim
  state.timeouts.push(
    setTimeout(() => {
      setupClaim();
      showVStep("claim");
    }, 7000)
  );
}

// ── Claim step ──

function setupClaim() {
  domainInput.value = state.domain;
  updateClaim();
}

function updateClaim() {
  const val = domainInput.value.trim() || state.domain;
  claimBtn.textContent = `Claim ${val}.cv`;

  const normalized = val.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (normalized === state.freeDomain) {
    pricingHint.textContent = "Free for your first year, then $10/year domain renewal";
  } else {
    pricingHint.textContent = "$10/year domain renewal";
  }
}

domainInput.addEventListener("input", updateClaim);

claimBtn.addEventListener("click", () => {
  populateDashboard();
  showSection(dashboard);
  window.scrollTo({ top: 0 });
});

// ── Back buttons ──

document.querySelectorAll("[data-back]").forEach((btn) => {
  btn.addEventListener("click", () => {
    clearTimeouts();
    resetVerifyStep();
    showSection(landing);
  });
});

// ── Dashboard population ──

function populateDashboard() {
  const domainVal = (domainInput.value.trim() || state.domain) + ".cv";
  const methodLabel = state.method === "linkedin" ? "LinkedIn" : "Self.xyz";
  const proofStr = buildProof(state.method, state.proof, state.date);
  const initials = state.name.split(" ").map((w) => w[0]).join("").toUpperCase();

  // Header
  document.getElementById("dash-avatar").textContent = initials;
  document.getElementById("dash-user-name").textContent = state.name;

  // Domain card
  document.getElementById("dash-domain").textContent = domainVal;
  document.getElementById("dash-method").textContent = methodLabel;
  document.getElementById("dash-date").textContent = "Apr 4, 2026";

  // DNS records
  populateDNSTable(domainVal, proofStr);

  // Subdomains
  populateSubdomains(domainVal);
  document.getElementById("subdomain-tld").textContent = "." + domainVal;

  // Verify more
  const otherMethod = state.method === "linkedin" ? "self" : "linkedin";
  const otherLabel = otherMethod === "linkedin" ? "Also verify with LinkedIn" : "Also verify with Self.xyz";
  const otherLogo = otherMethod === "linkedin" ? "linkedinlogo.svg" : "selfxyzlogo.avif";
  const vmBtn = document.getElementById("verify-more-btn");
  vmBtn.querySelector("span") && (vmBtn.lastChild.textContent = otherLabel);
  // Fix: the btn has img + text node
  const vmImg = vmBtn.querySelector("img");
  vmImg.src = otherLogo;
  vmBtn.childNodes.forEach((n) => {
    if (n.nodeType === 3 && n.textContent.trim()) n.textContent = " " + otherLabel;
  });

  // Lookup
  document.getElementById("lookup-domain").textContent = domainVal;
  document.getElementById("lookup-method").textContent = methodLabel;
  document.getElementById("lookup-proof").textContent = state.proof;

  // Dev instructions
  document.getElementById("dev-name").textContent = state.name;
  ["dev-domain-1", "dev-domain-2", "dev-domain-3", "dev-domain-4", "dev-domain-5", "dev-domain-6", "dev-domain-7"].forEach(
    (id) => {
      const el = document.getElementById(id);
      if (el) el.textContent = domainVal;
    }
  );
  document.getElementById("dev-method").textContent = state.method;
  document.getElementById("dev-method-2").textContent = state.method;
  document.getElementById("dev-proof-handle").textContent = state.proof;
  document.getElementById("dev-proof-2").textContent = state.proof;
  document.getElementById("dev-verified-date").textContent = state.date;
  document.getElementById("dev-date-2").textContent = state.date;
}

// ── DNS table ──

let dnsRecords = [];

function populateDNSTable(domain, proofStr) {
  dnsRecords = [
    { type: "NS", name: "@", value: "ns1.id.cv", ttl: "86400", system: true },
    { type: "NS", name: "@", value: "ns2.id.cv", ttl: "86400", system: true },
    { type: "TXT", name: "@", value: `id-cv=${domain}|ownership-verified`, ttl: "3600", system: true },
    { type: "TXT", name: "@", value: proofStr, ttl: "3600", locked: true },
    { type: "A", name: "assistant", value: "76.76.21.21", ttl: "3600", editable: true },
    { type: "A", name: "research", value: "76.76.21.21", ttl: "3600", editable: true },
  ];
  renderDNSTable();
}

function ttlLabel(ttl) {
  const n = parseInt(ttl, 10);
  if (n >= 86400) return n / 86400 + "d";
  if (n >= 3600) return n / 3600 + "h";
  return n / 60 + "m";
}

function renderDNSTable() {
  const tbody = document.getElementById("dns-tbody");
  tbody.innerHTML = "";

  dnsRecords.forEach((rec, i) => {
    const tr = document.createElement("tr");

    let tagHTML = "";
    if (rec.locked) tagHTML = ' <span class="tag tag-locked">Immutable</span>';
    else if (rec.system) tagHTML = ' <span class="tag tag-system">System</span>';

    let actionsHTML = "";
    if (rec.editable) {
      actionsHTML = `
        <button class="edit-record" data-index="${i}">Edit</button>
        <button class="danger delete-record" data-index="${i}">Delete</button>
      `;
    }

    tr.innerHTML = `
      <td class="mono">${rec.type}</td>
      <td class="mono">${rec.name}</td>
      <td class="mono record-value">${rec.value}${tagHTML}</td>
      <td>${ttlLabel(rec.ttl)}</td>
      <td><div class="row-actions">${actionsHTML}</div></td>
    `;
    tbody.appendChild(tr);
  });

  // Delete handlers
  tbody.querySelectorAll(".delete-record").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.index, 10);
      dnsRecords.splice(idx, 1);
      renderDNSTable();
    });
  });
}

// Add record form
const addRecordBtn = document.getElementById("add-record-btn");
const addRecordForm = document.getElementById("add-record-form");
const saveRecordBtn = document.getElementById("save-record-btn");
const cancelRecordBtn = document.getElementById("cancel-record-btn");

addRecordBtn.addEventListener("click", () => {
  addRecordForm.classList.remove("hidden");
  addRecordBtn.classList.add("hidden");
});

cancelRecordBtn.addEventListener("click", () => {
  addRecordForm.classList.add("hidden");
  addRecordBtn.classList.remove("hidden");
});

saveRecordBtn.addEventListener("click", () => {
  const type = document.getElementById("new-record-type").value;
  const name = document.getElementById("new-record-name").value.trim() || "@";
  const value = document.getElementById("new-record-value").value.trim();
  const ttl = document.getElementById("new-record-ttl").value;

  if (!value) return;

  dnsRecords.push({ type, name, value, ttl, editable: true });
  renderDNSTable();

  document.getElementById("new-record-name").value = "";
  document.getElementById("new-record-value").value = "";
  addRecordForm.classList.add("hidden");
  addRecordBtn.classList.remove("hidden");
});

// ── Subdomains ──

let subdomains = [];

function populateSubdomains(domain) {
  subdomains = [
    { name: "assistant", desc: "Personal AI", status: "Active" },
    { name: "research", desc: "Knowledge Agent", status: "Active" },
  ];
  renderSubdomains(domain);
}

function renderSubdomains(domain) {
  if (!domain) {
    domain = document.getElementById("dash-domain").textContent;
  }
  const tbody = document.getElementById("subdomain-tbody");
  tbody.innerHTML = "";

  subdomains.forEach((sub, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="mono">${sub.name}.${domain}</td>
      <td>${sub.desc}</td>
      <td><span class="badge badge-green" style="font-size:0.7rem;padding:3px 8px">${sub.status}</span></td>
      <td><div class="row-actions"><button class="danger delete-sub" data-index="${i}">Remove</button></div></td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll(".delete-sub").forEach((btn) => {
    btn.addEventListener("click", () => {
      subdomains.splice(parseInt(btn.dataset.index, 10), 1);
      renderSubdomains();
    });
  });
}

const addSubdomainBtn = document.getElementById("add-subdomain-btn");
const addSubdomainForm = document.getElementById("add-subdomain-form");
const saveSubdomainBtn = document.getElementById("save-subdomain-btn");
const cancelSubdomainBtn = document.getElementById("cancel-subdomain-btn");

addSubdomainBtn.addEventListener("click", () => {
  addSubdomainForm.classList.remove("hidden");
  addSubdomainBtn.classList.add("hidden");
  document.getElementById("new-subdomain-name").focus();
});

cancelSubdomainBtn.addEventListener("click", () => {
  addSubdomainForm.classList.add("hidden");
  addSubdomainBtn.classList.remove("hidden");
});

saveSubdomainBtn.addEventListener("click", () => {
  const name = document.getElementById("new-subdomain-name").value.trim().toLowerCase().replace(/\s+/g, "-");
  const desc = document.getElementById("new-subdomain-desc").value.trim() || "Agent";
  if (!name) return;

  const domain = document.getElementById("dash-domain").textContent;

  subdomains.push({ name, desc, status: "Active" });
  renderSubdomains(domain);

  // Also add an A record for the new subdomain
  dnsRecords.push({ type: "A", name, value: "76.76.21.21", ttl: "3600", editable: true });
  renderDNSTable();

  document.getElementById("new-subdomain-name").value = "";
  document.getElementById("new-subdomain-desc").value = "";
  addSubdomainForm.classList.add("hidden");
  addSubdomainBtn.classList.remove("hidden");
});

// ── Verify more ──

document.getElementById("verify-more-btn").addEventListener("click", () => {
  const otherMethod = state.method === "linkedin" ? "Self.xyz" : "LinkedIn";
  document.getElementById("verify-more-area").innerHTML = `
    <div class="verify-more-done">&#10003; Verified with ${otherMethod}</div>
  `;
});

// ── Logout ──

document.getElementById("logout-btn").addEventListener("click", () => {
  clearTimeouts();
  resetVerifyStep();
  showSection(landing);
});

// ── Dark mode toggle ──

(function initTheme() {
  const saved = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = saved || (prefersDark ? "dark" : "light");
  document.documentElement.setAttribute("data-theme", theme);
  updateToggleIcon(theme);
})();

function updateToggleIcon(theme) {
  const btn = document.getElementById("theme-toggle");
  if (btn) btn.textContent = theme === "dark" ? "\u2600" : "\u263D";
}

document.getElementById("theme-toggle").addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);
  updateToggleIcon(next);
});
