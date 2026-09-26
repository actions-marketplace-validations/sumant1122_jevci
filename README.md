# ⚡ JevCI

> **Sub-second code diff, commit, and doc quality gate powered by TypeSafe AI Jev SystemOne.**

JevCI brings zero-latency quality enforcement to your terminal, git pre-commit hooks, CI/CD pipelines, and GitHub Actions. Instead of waiting 30–60 seconds for slow autoregressive LLMs, JevCI leverages Jev's fast System 1 primitives (`score` and `noul`) to evaluate pull requests and code changes in sub-200 milliseconds.

---

## 🚀 Key Features

* **⚡ Sub-Second Evaluation:** Runs 4 parallel quality rubrics in sub-200ms without blocking developer workflow.
* **🎯 Calibrated Probability Bounds:** Returns numerical scores (0–100) and probability match confidence for every quality lens.
* **🔍 4 Core Quality Lenses:**
  1. **Commit Message Quality:** Verifies scope, rationale, and conventional commit standards (`feat/fix/refactor`).
  2. **Doc & Code Alignment:** Ensures `README.md` and public API docs stay up-to-date with code diffs.
  3. **API Contract & Breaking Risk:** Detects modified signatures, removed exports, or breaking changes.
  4. **Secret & Security Audit:** Scans diffs for exposed API keys, private credentials, or unsafe security patterns.
* **💻 Multiple Output Targets:**
  * **ANSI Terminal Dashboard:** Rich CLI table output with status pills and score bars.
  * **GitHub PR Comment Markdown:** Automatically generates markdown summaries ready for GitHub PR comments.
  * **JSON Reports:** Programmatic output for custom CI integrations.
* **🖥️ Web Dashboard:** Visually inspect local git repo diffs or test custom code snippets interactively.

---

## 🛠️ Quick Start

### 1. Run via CLI (`npx jevci`)

```sh
# Clone repository
git clone https://github.com/sumant1122/knowledge-signal.git
cd jev

# Install dependencies
npm install

# Run quality gate on your latest git diff
npx jevci
```

Set your TypeSafe AI key to enable live model judgments:

```sh
TYPESAFE_API_KEY=your_key npx jevci
```

*(If `TYPESAFE_API_KEY` is not set, JevCI runs in local simulation mode for instant offline testing).*

---

## 📋 CLI Options

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

### CLI Examples

```sh
# Evaluate staged changes before committing
npx jevci --target staged

# Evaluate PR diff against main branch with an 80/100 threshold
npx jevci --target main...HEAD --threshold 80

# Generate a GitHub PR markdown comment report file
npx jevci --format markdown --out jevci-report.md
```

---

## 🌐 Web Dashboard

Launch the interactive web dashboard:

```sh
TYPESAFE_API_KEY=your_key npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to:
* Auto-inspect your local git repository's active diffs and commit log.
* Interactively test custom code diffs and adjust quality thresholds.
* Copy one-click GitHub PR markdown reports.

---

## 🐙 GitHub Action Setup

Add JevCI to your repository workflow (`.github/workflows/jevci.yml`):

```yaml
name: JevCI Quality Gate

on:
  pull_request:
    branches: [ main ]

jobs:
  jevci-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 2

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: npm install

      - name: Run JevCI Check
        env:
          TYPESAFE_API_KEY: ${{ secrets.TYPESAFE_API_KEY }}
        run: |
          npx jevci --threshold 70 --format markdown --out jevci-report.md

      - name: Comment on PR
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

## 🧠 Built With Jev (TypeSafe AI)

JevCI is powered by **Jev**, the non-autoregressive "System One" foundational model released by TypeSafe AI.

* **Latency:** ~100–300 ms
* **Cost:** ~$0.042 per 1M tokens
* **Primitives used:** `score()` for multi-level quality rubrics and `noul()` for security checks.

---

## 📄 License

MIT
