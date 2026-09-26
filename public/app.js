const checkForm = document.getElementById("checkForm");
const commitInput = document.getElementById("commit");
const diffInput = document.getElementById("diff");
const docsInput = document.getElementById("docs");
const thresholdInput = document.getElementById("threshold");
const thresholdVal = document.getElementById("thresholdVal");
const loadGitBtn = document.getElementById("loadGitBtn");
const submitBtn = document.getElementById("submitBtn");

const welcomeState = document.getElementById("welcomeState");
const resultsCard = document.getElementById("resultsCard");
const statusBadge = document.getElementById("statusBadge");
const latencyTag = document.getElementById("latencyTag");
const overallScoreText = document.getElementById("overallScoreText");
const confidenceVal = document.getElementById("confidenceVal");
const rubricsContainer = document.getElementById("rubricsContainer");
const markdownCode = document.getElementById("markdownCode");
const copyMdBtn = document.getElementById("copyMdBtn");

thresholdInput.addEventListener("input", (e) => {
  thresholdVal.textContent = e.target.value;
});

async function loadGitStatus() {
  try {
    loadGitBtn.disabled = true;
    loadGitBtn.textContent = "Loading git...";
    const res = await fetch("/api/git-status");
    const data = await res.json();

    if (data.commit) commitInput.value = data.commit;
    if (data.diff) diffInput.value = data.diff;
    if (data.docs) docsInput.value = data.docs;
  } catch (err) {
    console.error("Failed to load local git status:", err);
  } finally {
    loadGitBtn.disabled = false;
    loadGitBtn.innerHTML = "<span>🔄 Load Local Git Repo</span>";
  }
}

function renderRubrics(dimensions) {
  rubricsContainer.innerHTML = "";

  dimensions.forEach((dim) => {
    const card = document.createElement("div");
    card.className = "rubric-card";

    const fillClass = dim.value >= 80 ? "high" : dim.value >= 70 ? "mid" : "low";

    card.innerHTML = `
      <div class="rubric-header">
        <span class="rubric-title">${dim.label}</span>
        <span class="rubric-score">${dim.value}/100</span>
      </div>
      <div class="progress-bar-bg">
        <div class="progress-bar-fill ${fillClass}" style="width: ${dim.value}%"></div>
      </div>
      <div class="rubric-note">${dim.message}</div>
    `;

    rubricsContainer.appendChild(card);
  });
}

checkForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const body = {
    commit: commitInput.value,
    diff: diffInput.value,
    docs: docsInput.value,
    threshold: Number(thresholdInput.value)
  };

  submitBtn.disabled = true;
  submitBtn.innerHTML = "<span>⚡ Evaluating (sub-second)...</span>";

  try {
    const res = await fetch("/api/check", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    const { evaluation, markdown } = data;

    welcomeState.classList.add("hidden");
    resultsCard.classList.remove("hidden");

    if (evaluation.passed) {
      statusBadge.className = "status-pill pass";
      statusBadge.textContent = "PASS";
    } else {
      statusBadge.className = "status-pill fail";
      statusBadge.textContent = "FAIL";
    }

    latencyTag.textContent = `⚡ ${evaluation.elapsedMs}ms`;
    overallScoreText.textContent = `Overall Quality Score: ${evaluation.overallScore}/100`;
    confidenceVal.textContent = `${evaluation.overallConfidence}%`;

    renderRubrics(evaluation.dimensions);
    markdownCode.textContent = markdown;
  } catch (err) {
    alert("Evaluation failed: " + err.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = "<span>⚡ Evaluate Quality Gate</span>";
  }
});

loadGitBtn.addEventListener("click", loadGitStatus);

copyMdBtn.addEventListener("click", () => {
  navigator.clipboard.writeText(markdownCode.textContent);
  copyMdBtn.textContent = "Copied!";
  setTimeout(() => (copyMdBtn.textContent = "Copy Markdown"), 2000);
});

// Auto load local repo status on startup
loadGitStatus();
