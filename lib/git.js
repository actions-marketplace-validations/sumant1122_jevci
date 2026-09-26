import { execSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export function getGitDiff(target = "HEAD~1") {
  try {
    const gitCmd = (target === "staged" || target === "--cached")
      ? "git diff --cached"
      : `git diff ${target}`;

    const output = execSync(gitCmd, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    if (output && output.trim()) return output;

    // Fast fallback if target diff was empty
    const headOutput = execSync("git diff HEAD", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    return headOutput && headOutput.trim() ? headOutput : null;
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
