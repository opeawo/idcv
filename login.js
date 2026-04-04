const mockUsers = {
  linkedin: { name: "John Doe", proof: "johndoe" },
  self: { name: "Jane Builder", proof: "0xabc123def456proof" },
};

document.querySelectorAll(".btn-oauth").forEach((btn) => {
  btn.addEventListener("click", () => {
    const method = btn.dataset.method;
    const user = mockUsers[method];

    // Mock login — store session and existing domains
    const existing = JSON.parse(sessionStorage.getItem("idcv_domains") || "[]");
    if (existing.length === 0) {
      // First-time user gets a default domain
      existing.push({
        domain: deriveDomain(user.name) + ".cv",
        method: method,
        proof: user.proof,
        name: user.name,
        date: "2026-04-04",
      });
    }

    sessionStorage.setItem("idcv_user", JSON.stringify({ name: user.name, method }));
    sessionStorage.setItem("idcv_domains", JSON.stringify(existing));

    window.location.href = "dashboard.html";
  });
});

function deriveDomain(name) {
  return name.toLowerCase().replace(/\s+/g, "");
}
