import { execSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export function getGitDiff(target = "HEAD~1") {
  try {
    // Try target first (e.g., HEAD~1, main...HEAD, or staged)
    if (target === "staged" || target === "--cached") {
      const output = execSync("git diff --cached", { encoding: "utf8" });
      if (output.trim()) return output;
    }
    
    // Default diff target
    try {
      const output = execSync(`git diff ${target}`, { encoding: "utf8" });
      if (output.trim()) return output;
    } catch {
      // Fallback to git diff HEAD or git diff against empty tree
    }

    // Try git diff HEAD
    const headOutput = execSync("git diff HEAD", { encoding: "utf8" });
    if (headOutput.trim()) return headOutput;

    // Fallback: check working tree diff
    const workTreeOutput = execSync("git diff", { encoding: "utf8" });
    if (workTreeOutput.trim()) return workTreeOutput;

    return null;
  } catch (error) {
    return null;
  }
}

export function getLatestCommitMessage() {
  try {
    const msg = execSync("git log -1 --pretty=%B", { encoding: "utf8" });
    return msg.trim() || "No commit message provided.";
  } catch {
    return "feat: update codebase with recent changes";
  }
}

export async function getDocContent(cwd = process.cwd()) {
  try {
    const readmePath = join(cwd, "README.md");
    const content = await readFile(readmePath, "utf8");
    return content;
  } catch {
    return "No README.md found in working directory.";
  }
}

export async function getGitContext(options = {}) {
  const diff = options.diff ?? getGitDiff(options.target || "HEAD~1");
  const commit = options.commit ?? getLatestCommitMessage();
  const docs = options.docs ?? await getDocContent();

  return {
    diff: diff || "// No git diff detected. Submit diff or run inside git repository.",
    commit,
    docs,
    isGitRepo: diff !== null
  };
}
