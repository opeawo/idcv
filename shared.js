// ── Dark mode toggle ──

function updateAllToggleIcons(theme) {
  var icon = theme === "dark" ? "\u2600" : "\u263D";
  document.querySelectorAll(".theme-toggle").forEach(function (btn) {
    btn.textContent = icon;
  });
}

function toggleTheme() {
  var current = document.documentElement.getAttribute("data-theme");
  var next = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);
  updateAllToggleIcons(next);
}

(function initTheme() {
  var saved = localStorage.getItem("theme");
  var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  var theme = saved || (prefersDark ? "dark" : "light");
  document.documentElement.setAttribute("data-theme", theme);
  updateAllToggleIcons(theme);
})();

document.querySelectorAll(".theme-toggle").forEach(function (btn) {
  btn.addEventListener("click", toggleTheme);
});

// ── Mobile menu ──

(function initMobileMenu() {
  var hamburgerBtn = document.getElementById("hamburger-btn");
  var mobileMenu = document.getElementById("mobile-menu");
  var mobileMenuClose = document.getElementById("mobile-menu-close");

  if (!hamburgerBtn || !mobileMenu) return;

  hamburgerBtn.addEventListener("click", function () {
    mobileMenu.classList.add("open");
    hamburgerBtn.classList.add("active");
    document.body.style.overflow = "hidden";
  });

  function closeMenu() {
    mobileMenu.classList.remove("open");
    hamburgerBtn.classList.remove("active");
    document.body.style.overflow = "";
  }

  if (mobileMenuClose) {
    mobileMenuClose.addEventListener("click", closeMenu);
  }

  mobileMenu.querySelectorAll(".mobile-menu-links a").forEach(function (link) {
    link.addEventListener("click", closeMenu);
  });
})();

// ── Copy to clipboard helper ──

function copyText(text, btn) {
  navigator.clipboard.writeText(text).then(function () {
    var orig = btn.textContent;
    btn.textContent = "Copied!";
    setTimeout(function () { btn.textContent = orig; }, 1500);
  });
}
