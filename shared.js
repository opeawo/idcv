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

const themeBtn = document.getElementById("theme-toggle");
if (themeBtn) {
  themeBtn.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    updateToggleIcon(next);
  });
}

// ── Copy to clipboard helper ──

function copyText(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    const orig = btn.textContent;
    btn.textContent = "Copied!";
    setTimeout(() => (btn.textContent = orig), 1500);
  });
}
