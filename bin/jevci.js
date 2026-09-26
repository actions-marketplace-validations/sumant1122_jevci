#!/usr/bin/env node

import { getGitContext } from "../lib/git.js";
import { evaluateDiff } from "../lib/evaluator.js";
import {
  renderTerminalReport,
  renderMarkdownReport,
  renderJsonReport
} from "../lib/reporter.js";
import { writeFile } from "node:fs/promises";

function parseArgs(args) {
  const options = {
    target: "HEAD~1",
    commit: null,
    docs: null,
    threshold: 70,
    format: "cli",
    out: null,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--target" || arg === "-t") {
      options.target = args[++i];
    } else if (arg === "--commit" || arg === "-c") {
      options.commit = args[++i];
    } else if (arg === "--threshold") {
      options.threshold = Number(args[++i]);
    } else if (arg === "--format" || arg === "-f") {
      options.format = args[++i];
    } else if (arg === "--out" || arg === "-o") {
      options.out = args[++i];
    } else if (arg === "--help" || arg === "-h") {
      options.help = true;
    }
  }

  return options;
}

function printHelp() {
  console.log(`
⚡ JevCI — Sub-Second Quality Gate for Code, Commits & Docs
Powered by TypeSafe AI Jev SystemOne

Usage:
  npx jevci [options]
  node bin/jevci.js [options]

Options:
  -t, --target <range>     Git diff target (e.g., HEAD~1, main...HEAD, staged). Default: HEAD~1
  -c, --commit "<msg>"     Override commit message to evaluate.
  --threshold <number>     Minimum passing quality score (0-100). Default: 70
  -f, --format <format>    Output format: cli | markdown | json. Default: cli
  -o, --out <path>         Write report to specified output file path.
  -h, --help               Show help menu.

Examples:
  npx jevci --target staged
  npx jevci --threshold 80 --format markdown --out jevci-report.md
`);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    process.exit(0);
  }

  const context = await getGitContext(options);
  const result = await evaluateDiff(context, { threshold: options.threshold });

  let outputText = "";
  if (options.format === "markdown" || options.format === "md") {
    outputText = renderMarkdownReport(result, context);
  } else if (options.format === "json") {
    outputText = renderJsonReport(result, context);
  } else {
    outputText = renderTerminalReport(result, context);
  }

  if (options.format === "cli") {
    console.log(outputText);
  } else {
    console.log(outputText);
  }

  if (options.out) {
    await writeFile(options.out, outputText, "utf8");
    console.log(`\nReport saved to: ${options.out}`);
  }

  // Exit with status 1 if quality gate failed
  process.exit(result.passed ? 0 : 1);
}

main().catch((err) => {
  console.error("JevCI Error:", err.message);
  process.exit(1);
});
