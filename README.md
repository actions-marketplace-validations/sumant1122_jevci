# ⚡ JevCI

> **Sub-second code diff, commit message, and documentation quality gate powered by TypeSafe AI Jev SystemOne.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen.svg)](https://nodejs.org)
[![Jev Powered](https://img.shields.io/badge/Powered%20By-TypeSafe%20Jev-cyan.svg)](https://typesafe.ai)

JevCI brings zero-latency quality enforcement to your terminal, git pre-commit hooks, CI/CD pipelines, and GitHub Actions. Instead of waiting 30–60 seconds for slow autoregressive LLMs, JevCI leverages Jev's fast System 1 primitives (`score` and `noul`) to evaluate pull requests and code changes with **sub-second end-to-end latency** (~100–250ms model inference).

---

## ⚡ How It Works

```text
  Git Diff + Commit Message + Docs
                 │
                 ▼
     JevCI Evaluator (<1 second total)
                 │
  ┌──────────────┼──────────────┬──────────────┐
  ▼              ▼              ▼              ▼
Commit        Doc & Code     Breaking      Secret &
Quality       Alignment     API Risk       Security
(score)        (score)       (score)        (noul)
  │              │              │              │
  └──────────────┴──────────────┴──────────────┘
                 │
                 ▼
  Quality Score (0-100) + Jev Rating Confidence (%)
                 │
       ┌─────────┴─────────┐
       ▼                   ▼
PASS (Exit 0)       FAIL (Exit 1)
```

---

## 🚀 Key Features

* **⚡ Sub-Second Total Latency:** Runs 4 parallel quality rubrics end-to-end in <1s (~20x faster than traditional 20–45s LLM evals).
* **🎯 Calibrated Probability Bounds:** Returns numerical scores (0–100) and probability match confidence for every quality lens.
* **🔍 4 Core Quality Lenses:**
  1. **Commit Message Quality:** Verifies scope, rationale, and conventional commit standards (`feat/fix/refactor`).
  2. **Doc & Code Alignment:** Ensures `README.md` and public API docs stay up-to-date when code diffs change public interfaces.
  3. **API Contract & Breaking Risk:** Detects modified signatures, removed exports, or breaking changes.
  4. **Secret & Security Audit:** Scans diffs for exposed API keys, private credentials, or unsafe security patterns.
* **💻 Multiple Output Targets:**
  * **ANSI Terminal Dashboard:** Rich CLI table output with status pills and score bars.
  * **GitHub PR Comment Markdown:** Automatically generates markdown summaries ready for GitHub PR comments.
  * **JSON Reports:** Programmatic output for custom CI integrations.
* **🖥️ Web Dashboard:** Visually inspect local git repo diffs or test custom code snippets interactively.

---

## 🛠️ Quick Start

### 1. Installation

```sh
git clone https://github.com/sumant1122/jevci.git
cd jevci
npm install
```

### 2. Run CLI Evaluation

```sh
# Run JevCI on your current git repository changes
npx jevci
```

To run with the live TypeSafe AI model, set your API key in your environment:

```sh
TYPESAFE_API_KEY=your_typesafe_key npx jevci
```

*(If `TYPESAFE_API_KEY` is not set, JevCI runs in local simulation mode for instant offline testing).*

---

## 📋 CLI Usage & Options

```text
Usage:
  npx jevci [options]

Options:
  -t, --target <range>     Git diff target (e.g., HEAD~1, main...HEAD, staged). Default: HEAD~1
  -c, --commit "<msg>"     Override commit message to evaluate.
  --threshold <number>     Minimum passing quality score (0-100). Default: 70
  -f, --format <format>    Output format: cli | markdown | json. Default: cli
  -o, --out <path>         Write report to specified output file path.
  -h, --help               Show help menu.
```

### Common CLI Examples

```sh
# Evaluate staged changes before committing
npx jevci --target staged

# Evaluate PR diff against main branch with an 80/100 threshold
npx jevci --target main...HEAD --threshold 80

# Generate a GitHub PR markdown comment report file
npx jevci --format markdown --out jevci-report.md
```

---

## 🪝 Setting Up Git Pre-Commit Hooks

Prevent bad commits from ever reaching your git history.

### Option A: Standard Git Hook (`.git/hooks/pre-commit`)

Create or edit `.git/hooks/pre-commit`:

```sh
#!/bin/sh
echo "⚡ Running JevCI pre-commit quality gate..."
npx jevci --target staged --threshold 70
```

Make the hook executable:

```sh
chmod +x .git/hooks/pre-commit
```

### Option B: Husky Integration

```sh
npm install --save-dev husky
npx husky init
echo "npx jevci --target staged --threshold 70" > .husky/pre-commit
```

---

## 🐙 GitHub Action Workflow Integration

Add JevCI to your repository (`.github/workflows/jevci.yml`):

```yaml
name: JevCI Quality Gate

on:
  pull_request:
    branches: [ main, master ]
  push:
    branches: [ main, master ]

jobs:
  jevci-check:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 2

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install Dependencies
        run: npm install

      - name: Run JevCI Check
        env:
          TYPESAFE_API_KEY: ${{ secrets.TYPESAFE_API_KEY }}
        run: |
          npx jevci --threshold 70 --format markdown --out jevci-report.md

      - name: Post PR Comment
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const report = fs.readFileSync('jevci-report.md', 'utf8');
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: report
            });
```

---

## ⚙️ Configuration Schema (`jevci.config.json`)

You can customize quality weights, active checks, and score thresholds in `jevci.config.json`:

```json
{
  "threshold": 70,
  "diffTarget": "HEAD~1",
  "weights": {
    "commit_quality": 0.25,
    "doc_alignment": 0.25,
    "breaking_risk": 0.25,
    "security_audit": 0.25
  },
  "checks": {
    "commit_quality": true,
    "doc_alignment": true,
    "breaking_risk": true,
    "security_audit": true
  }
}
```

---

## 🌐 Web Dashboard & Interactive Playground

JevCI includes a developer web dashboard to inspect local git repositories visually:

```sh
TYPESAFE_API_KEY=your_key npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to:
* Auto-load active local git diffs and commit messages.
* Interactively adjust quality thresholds and inspect confidence scores.
* Generate and copy 1-click Markdown PR comments.

---

## 💻 Programmatic Node.js API Usage

You can import JevCI as a JavaScript module in your own tools or scripts:

```javascript
import { getGitContext } from "./lib/git.js";
import { evaluateDiff } from "./lib/evaluator.js";

const context = await getGitContext({ target: "HEAD~1" });
const result = await evaluateDiff(context, { threshold: 70 });

console.log(`Passed: ${result.passed}`);
console.log(`Score: ${result.overallScore}/100 (Confidence: ${result.overallConfidence}%)`);
console.log(`Latency: ${result.elapsedMs}ms`);
```

---

## 🧠 Powered by TypeSafe AI Jev SystemOne

JevCI is built on **Jev**, the non-autoregressive "System One" foundational AI model by TypeSafe AI.

* **Latency:** ~100–300 ms
* **Cost:** ~$0.042 per 1M tokens
* **Primitives Used:**
  * `score()`: Rates code diffs against calibrated multi-level rubrics.
  * `noul()`: Evaluates yes/no security assertions.

---

## 🤝 Contributing

Contributions from open-source developers are welcome!

1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/awesome-rubric`).
3. Run JevCI quality checks (`npx jevci`).
4. Commit your changes (`git commit -m 'feat: add awesome rubric check'`).
5. Push to the branch (`git push origin feature/awesome-rubric`).
6. Open a Pull Request.

---

## 📄 License

[MIT](LICENSE) © Sumant
