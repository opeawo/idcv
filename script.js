// ── Domain Detail JS ──

const mockDomains = [
  {
    domain: "johndoe.cv",
    method: "linkedin",
    proof: "johndoe",
    name: "John Doe",
    date: "2026-04-04",
  },
  {
    domain: "jd-ai.cv",
    method: "self",
    proof: "0xabc123def456proof",
    name: "John Doe",
    date: "2026-03-15",
  },
];

// Get domain index from URL
const params = new URLSearchParams(window.location.search);
const domainIndex = parseInt(params.get("d") || "0", 10);

let domains = JSON.parse(sessionStorage.getItem("idcv_domains") || "null") || mockDomains;
let user = JSON.parse(sessionStorage.getItem("idcv_user") || "null") || { name: "John Doe", method: "linkedin" };
let currentDomain = domains[domainIndex] || domains[0];

// ── Init ──

function init() {
  const initials = user.name.split(" ").map((w) => w[0]).join("").toUpperCase();
  document.getElementById("dash-avatar").textContent = initials;
  document.getElementById("dash-user-name").textContent = user.name;
  populateDashboard(currentDomain);
}

// ── Helpers ──

function buildProof(method, proof, date) {
  return `id-cv=${method}:${proof}|${date}`;
}

function formatDate(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getExpiry(iso) {
  const d = new Date(iso + "T00:00:00");
  d.setFullYear(d.getFullYear() + 1);
  return d;
}

// ── Populate ──

function populateDashboard(d) {
  const methodLabel = d.method === "linkedin" ? "LinkedIn" : "Self.xyz";
  const proofStr = buildProof(d.method, d.proof, d.date);
  const expiry = d.expiry ? new Date(d.expiry + "T00:00:00") : getExpiry(d.date);

  document.title = d.domain + " | id.cv";

  // Domain header
  document.getElementById("dash-domain").textContent = d.domain;
  document.getElementById("dash-method").textContent = methodLabel;
  document.getElementById("dash-date").textContent = formatDate(d.date);
  document.getElementById("dash-expires").textContent = expiry.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  // DNS records
  populateDNSTable(d.domain, proofStr);

  // Subdomains
  populateSubdomains(d.domain);
  document.getElementById("subdomain-tld").textContent = "." + d.domain;

  // Verify more
  const otherMethod = d.method === "linkedin" ? "self" : "linkedin";
  const otherLabel = otherMethod === "linkedin" ? "Also verify with LinkedIn" : "Also verify with Self.xyz";
  const otherLogo = otherMethod === "linkedin" ? "linkedinlogo.svg" : "selfxyzlogo.avif";
  document.getElementById("verify-more-area").innerHTML = `
    <button class="btn-oauth compact" id="verify-more-btn">
      <img src="${otherLogo}" alt="${otherLabel}" />
      ${otherLabel}
    </button>
  `;
  document.getElementById("verify-more-btn").addEventListener("click", handleVerifyMore);

  // Lookup
  document.getElementById("lookup-domain").textContent = d.domain;
  document.getElementById("lookup-method").textContent = methodLabel;
  document.getElementById("lookup-proof").textContent = d.proof;

  // Dev instructions
  document.getElementById("dev-name").textContent = d.name;
  ["dev-domain-1", "dev-domain-2", "dev-domain-3", "dev-domain-4", "dev-domain-5", "dev-domain-6", "dev-domain-7"].forEach(
    (id) => {
      const el = document.getElementById(id);
      if (el) el.textContent = d.domain;
    }
  );
  document.getElementById("dev-method").textContent = d.method;
  document.getElementById("dev-method-2").textContent = d.method;
  document.getElementById("dev-proof-handle").textContent = d.proof;
  document.getElementById("dev-proof-2").textContent = d.proof;
  document.getElementById("dev-verified-date").textContent = d.date;
  document.getElementById("dev-date-2").textContent = d.date;

  // Renew modal setup
  setupRenew(d, expiry);
}

function handleVerifyMore() {
  const otherMethod = currentDomain.method === "linkedin" ? "Self.xyz" : "LinkedIn";
  document.getElementById("verify-more-area").innerHTML = `
    <div class="verify-more-done">&#10003; Verified with ${otherMethod}</div>
  `;
}

// ── Renew ──

function setupRenew(d, expiry) {
  const modal = document.getElementById("renew-modal");
  const yearsSelect = document.getElementById("renew-years");
  const summary = document.getElementById("renew-summary");
  const domainLabel = document.getElementById("renew-domain-name");

  domainLabel.textContent = d.domain;

  function updateSummary() {
    const years = parseInt(yearsSelect.value, 10);
    const newExpiry = new Date(expiry);
    newExpiry.setFullYear(newExpiry.getFullYear() + years);
    summary.innerHTML = `New expiry: <strong>${newExpiry.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</strong>`;
  }

  yearsSelect.addEventListener("change", updateSummary);
  updateSummary();

  document.getElementById("renew-btn").addEventListener("click", () => {
    modal.classList.remove("hidden");
  });

  document.getElementById("renew-backdrop").addEventListener("click", () => {
    modal.classList.add("hidden");
  });

  document.getElementById("renew-cancel-btn").addEventListener("click", () => {
    modal.classList.add("hidden");
  });

  document.getElementById("renew-confirm-btn").addEventListener("click", () => {
    const years = parseInt(yearsSelect.value, 10);
    const newExpiry = new Date(expiry);
    newExpiry.setFullYear(newExpiry.getFullYear() + years);
    document.getElementById("dash-expires").textContent = newExpiry.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    expiry.setFullYear(newExpiry.getFullYear());
    modal.classList.add("hidden");

    // Update sessionStorage
    currentDomain.expiry = newExpiry.toISOString().slice(0, 10);
    domains[domainIndex] = currentDomain;
    sessionStorage.setItem("idcv_domains", JSON.stringify(domains));
  });
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

  dnsRecords.push({ type: "A", name, value: "76.76.21.21", ttl: "3600", editable: true });
  renderDNSTable();

  document.getElementById("new-subdomain-name").value = "";
  document.getElementById("new-subdomain-desc").value = "";
  addSubdomainForm.classList.add("hidden");
  addSubdomainBtn.classList.remove("hidden");
});

// ── Logout ──

document.getElementById("logout-btn").addEventListener("click", () => {
  sessionStorage.removeItem("idcv_user");
  sessionStorage.removeItem("idcv_domains");
  window.location.href = "/";
});

// ── Start ──

init();
