const mockProfiles = {
  linkedin: { name: "John Doe", proof: "johndoe" },
  self: { name: "Jane Builder", proof: "0xabc123def456proof" },
};

const state = {
  method: null,
  name: null,
  domain: null,
  freeDomain: null,
  proof: null,
  date: "2026-04-04",
  timeouts: [],
};

// ── Elements ──

const stepChoose = document.getElementById("step-choose");
const stepVerify = document.getElementById("step-verify");
const stepClaim = document.getElementById("step-claim");
const progressFill = document.getElementById("progress-fill");
const verifyLog = document.getElementById("verify-log");
const logLines = verifyLog.querySelectorAll("li");
const dnsPreview = document.getElementById("dns-preview");
const previewRecord = document.getElementById("preview-record");
const confirmedName = document.getElementById("confirmed-name");
const registeringDomain = document.getElementById("registering-domain");
const domainInput = document.getElementById("domain-input");
const pricingHint = document.getElementById("pricing-hint");
const claimBtn = document.getElementById("claim-btn");

// ── Helpers ──

function showStep(step) {
  [stepChoose, stepVerify, stepClaim].forEach((s) => s.classList.add("hidden"));
  step.classList.remove("hidden");
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

// ── Choose method ──

document.querySelectorAll("#step-choose .btn-oauth").forEach((btn) => {
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

  const connectText = document.querySelector('[data-line="connect"] .log-text');
  connectText.textContent =
    method === "linkedin" ? "Connecting to LinkedIn..." : "Connecting to Self.xyz...";
  confirmedName.textContent = profile.name;
  registeringDomain.textContent = state.domain + ".cv";

  resetVerifyStep();
  showStep(stepVerify);

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
      showStep(stepClaim);
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
  const domainVal = (domainInput.value.trim() || state.domain) + ".cv";

  // Store in session for dashboard
  const existing = JSON.parse(sessionStorage.getItem("idcv_domains") || "[]");
  existing.push({
    domain: domainVal,
    method: state.method,
    proof: state.proof,
    name: state.name,
    date: state.date,
  });
  sessionStorage.setItem("idcv_domains", JSON.stringify(existing));
  sessionStorage.setItem(
    "idcv_user",
    JSON.stringify({ name: state.name, method: state.method })
  );

  window.location.href = "dashboard.html";
});

// ── Back buttons ──

document.getElementById("back-to-choose").addEventListener("click", () => {
  clearTimeouts();
  resetVerifyStep();
  showStep(stepChoose);
});

document.getElementById("back-to-start").addEventListener("click", () => {
  clearTimeouts();
  resetVerifyStep();
  showStep(stepChoose);
});
