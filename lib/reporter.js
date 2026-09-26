export function renderTerminalReport(result, context) {
  const reset = "\x1b[0m";
  const bold = "\x1b[1m";
  const green = "\x1b[32m";
  const red = "\x1b[31m";
  const yellow = "\x1b[33m";
  const cyan = "\x1b[36m";
  const dim = "\x1b[2m";

  const statusBadge = result.passed
    ? `${green}${bold} PASS ${reset}`
    : `${red}${bold} FAIL ${reset}`;

  const mockBadge = result.isMock
    ? ` ${yellow}(Simulated - set TYPESAFE_API_KEY for live Jev model)${reset}`
    : ` ${cyan}(Powered by TypeSafe Jev SystemOne)${reset}`;

  let out = "\n";
  out += `${bold}${cyan}⚡ JevCI Quality Gate Report${reset}${mockBadge}\n`;
  out += `${dim}──────────────────────────────────────────────────────────────────────────${reset}\n`;
  out += `  Status:      [${statusBadge}]\n`;
  out += `  Quality Score: ${bold}${result.overallScore}/100${reset}  (Target Threshold: ${result.threshold})\n`;
  out += `  Confidence:    ${result.overallConfidence}% probability match\n`;
  out += `  Latency:       ${bold}${result.elapsedMs}ms${reset}\n`;
  out += `${dim}──────────────────────────────────────────────────────────────────────────${reset}\n\n`;

  out += `${bold}Rubric Evaluations:${reset}\n`;

  result.dimensions.forEach((dimItem) => {
    const icon = dimItem.status === "PASS" ? `${green}✓${reset}` : `${red}✗${reset}`;
    const scoreColor = dimItem.value >= 80 ? green : dimItem.value >= 70 ? yellow : red;
    
    // Create visual score bar
    const filled = Math.round(dimItem.value / 10);
    const bar = "█".repeat(filled) + "░".repeat(10 - filled);

    out += `  ${icon} ${bold}${dimItem.label.padEnd(28)}${reset} [${scoreColor}${bar}${reset}] ${scoreColor}${bold}${dimItem.value}/100${reset}  ${dim}(conf: ${dimItem.confidence}%)${reset}\n`;
    if (dimItem.status === "FAIL") {
      out += `     ${red}└─ ${dimItem.message}${reset}\n`;
    }
  });

  out += `\n${dim}──────────────────────────────────────────────────────────────────────────${reset}\n`;
  if (result.passed) {
    out += `${green}${bold}✓ All quality checks passed. Ready for merge!${reset}\n\n`;
  } else {
    out += `${red}${bold}✗ Quality gate failed. Please address failed rubrics above.${reset}\n\n`;
  }

  return out;
}

export function renderMarkdownReport(result, context) {
  const statusEmoji = result.passed ? "✅ PASS" : "❌ FAIL";
  const mockNote = result.isMock
    ? "\n> ⚠️ *Running in local simulation mode. Set `TYPESAFE_API_KEY` for live Jev judgments.*"
    : "";

  let md = `## ⚡ JevCI Quality Gate Report: ${statusEmoji}${mockNote}\n\n`;
  md += `| Metric | Value |\n`;
  md += `| :--- | :--- |\n`;
  md += `| **Overall Score** | **${result.overallScore} / 100** (Threshold: ${result.threshold}) |\n`;
  md += `| **Rating Confidence** | **${result.overallConfidence}%** probability match |\n`;
  md += `| **Evaluation Latency** | **${result.elapsedMs} ms** |\n\n`;

  md += `### 📊 Rubric Evaluation Breakdown\n\n`;
  md += `| Quality Lens | Score | Status | Jev Confidence | Notes |\n`;
  md += `| :--- | :---: | :---: | :---: | :--- |\n`;

  result.dimensions.forEach((dim) => {
    const badge = dim.status === "PASS" ? "🟢 PASS" : "🔴 FAIL";
    md += `| **${dim.label}** | ${dim.value}/100 | ${badge} | ${dim.confidence}% | ${dim.message} |\n`;
  });

  md += `\n---\n`;
  md += `<details><summary><b>Inspect Evaluated Context</b></summary>\n\n`;
  md += `**Commit Message:**\n\`\`\`text\n${context.commit}\n\`\`\`\n\n`;
  md += `**Git Diff Snippet:**\n\`\`\`diff\n${(context.diff || "").slice(0, 1500)}\n\`\`\`\n`;
  md += `</details>\n\n`;

  md += `*Powered by [TypeSafe AI Jev SystemOne](https://typesafe.ai)*\n`;

  return md;
}

export function renderJsonReport(result, context) {
  return JSON.stringify({ result, context }, null, 2);
}
