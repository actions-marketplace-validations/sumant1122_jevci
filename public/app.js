const form = document.querySelector("#diagnostic-form");
const result = document.querySelector("#result");
const notes = document.querySelector("#notes");
const file = document.querySelector("#file");
const button = form.querySelector("button");

file.addEventListener("change", async () => {
  const selected = file.files[0];
  if (selected) notes.value = await selected.text();
});

function level(score) {
  if (score < 20) return "Not yet demonstrated";
  if (score < 40) return "Familiar";
  if (score < 60) return "Developing";
  if (score < 80) return "Proficient";
  return "Advanced";
}

function tone(score) {
  if (score < 40) return "early";
  if (score < 70) return "growing";
  return "strong";
}

function show(data, elapsedMs) {
  result.hidden = false;
  result.replaceChildren();
  const heading = document.createElement("div");
  heading.className = `summary ${tone(data.score100)}`;
  const seconds = (elapsedMs / 1000).toFixed(elapsedMs < 10_000 ? 1 : 0);
  heading.innerHTML = `<div class="score-orbit" style="--score: ${data.score100}"><div class="score-core"><strong>${data.score100}</strong><span>out of 100</span></div></div><div class="summary-copy"><div class="summary-kicker"><p class="eyebrow">Demonstrated knowledge</p><div class="metrics"><span class="confidence-badge">${data.confidence}% JEV rating confidence</span><span class="timing-badge">${seconds}s analysis time</span></div></div><h2>${level(data.score100)}</h2><p>This reflects what these notes show today. JEV rating confidence describes how clearly the evidence supports the assessment—not the user's ability.</p></div>`;
  result.append(heading);
  const title = document.createElement("h3");
  title.innerHTML = "Knowledge profile <span>Five lenses, one clearer picture</span>";
  result.append(title);
  data.dimensions.forEach((item) => {
    const node = document.querySelector("#dimension").content.cloneNode(true);
    node.querySelector("strong").textContent = item.label;
    node.querySelector("span").textContent = `${item.value}/100`;
    node.querySelector("em").textContent = `${item.confidence}% JEV rating confidence`;
    node.querySelector("i").style.width = `${item.value}%`;
    node.querySelector("article").classList.add(tone(item.value));
    result.append(node);
  });
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  button.disabled = true;
  button.textContent = "Assessing…";
  const startedAt = performance.now();
  try {
    const response = await fetch("/api/analyze", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(form))) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    show(data, performance.now() - startedAt);
  } catch (error) {
    result.hidden = false;
    result.textContent = `Could not analyze: ${error.message}`;
  } finally {
    button.disabled = false;
    button.textContent = "Analyze demonstrated knowledge";
  }
});
