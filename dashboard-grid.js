// ── Dashboard Grid JS ──

const mockDomains = [
  {
    domain: "johndoe.cv",
    method: "linkedin",
    proof: "johndoe",
    name: "John Doe",
    date: "2026-04-04",
    subdomains: ["assistant", "research"],
  },
  {
    domain: "jd-ai.cv",
    method: "self",
    proof: "0xabc123def456proof",
    name: "John Doe",
    date: "2026-03-15",
    subdomains: ["trading"],
  },
];

let domains = JSON.parse(sessionStorage.getItem("idcv_domains") || "null") || mockDomains;
let user = JSON.parse(sessionStorage.getItem("idcv_user") || "null") || { name: "John Doe", method: "linkedin" };

function init() {
  const initials = user.name.split(" ").map((w) => w[0]).join("").toUpperCase();
  document.getElementById("dash-avatar").textContent = initials;
  document.getElementById("dash-user-name").textContent = user.name;
  renderGrid();
}

function formatDate(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function expiryDate(iso) {
  const d = new Date(iso + "T00:00:00");
  d.setFullYear(d.getFullYear() + 1);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function renderGrid() {
  const grid = document.getElementById("domain-grid");
  grid.innerHTML = "";

  domains.forEach((d, i) => {
    const methodLabel = d.method === "linkedin" ? "LinkedIn" : "Self.xyz";
    const subCount = d.subdomains ? d.subdomains.length : 0;
    const card = document.createElement("a");
    card.href = "domain.html?d=" + encodeURIComponent(i);
    card.className = "domain-grid-card";
    card.innerHTML = `
      <div class="dgc-top">
        <span class="dgc-domain">${d.domain}</span>
        <span class="badge badge-green" style="font-size:0.65rem;padding:3px 8px">Verified</span>
      </div>
      <div class="dgc-meta">
        <span><strong>Method:</strong> ${methodLabel}</span>
        <span><strong>Verified:</strong> ${formatDate(d.date)}</span>
        <span><strong>Expires:</strong> ${expiryDate(d.date)}</span>
      </div>
      <div class="dgc-footer">
        <span class="dgc-subs">${subCount} subdomain${subCount !== 1 ? "s" : ""}</span>
        <span class="dgc-arrow">&rarr;</span>
      </div>
    `;
    grid.appendChild(card);
  });
}

// Logout
document.getElementById("logout-btn").addEventListener("click", () => {
  sessionStorage.removeItem("idcv_user");
  sessionStorage.removeItem("idcv_domains");
  window.location.href = "/";
});

init();
