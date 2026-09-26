import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { getGitContext } from "./lib/git.js";
import { evaluateDiff } from "./lib/evaluator.js";
import { renderMarkdownReport } from "./lib/reporter.js";

const port = Number(process.env.PORT || 3000);
const publicDir = join(process.cwd(), "public");

function json(res, status, body) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

const server = createServer(async (req, res) => {
  // CORS & Security headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204).end();
    return;
  }

  // API: Get current git repo status
  if (req.method === "GET" && req.url === "/api/git-status") {
    try {
      const gitContext = await getGitContext();
      return json(res, 200, gitContext);
    } catch (err) {
      return json(res, 500, { error: err.message });
    }
  }

  // API: Run JevCI evaluation
  if (req.method === "POST" && req.url === "/api/check") {
    let raw = "";
    for await (const chunk of req) raw += chunk;
    try {
      const body = JSON.parse(raw);
      const diff = body.diff || "";
      const commit = body.commit || "No commit message provided.";
      const docs = body.docs || "";
      const threshold = Number(body.threshold || 70);

      const context = { diff, commit, docs };
      const evaluation = await evaluateDiff(context, { threshold });
      const markdown = renderMarkdownReport(evaluation, context);

      return json(res, 200, {
        evaluation,
        markdown,
        context
      });
    } catch (error) {
      return json(res, 500, { error: error instanceof Error ? error.message : "Evaluation failed." });
    }
  }

  // Static file server
  const requested = req.url === "/" ? "/index.html" : req.url;
  const pathname = normalize(requested).replace(/^([.][.][\\/])+/, "");
  const file = join(publicDir, pathname);

  try {
    const content = await readFile(file);
    const ext = extname(file);
    const type = ext === ".js" ? "text/javascript" : ext === ".css" ? "text/css" : "text/html";
    res.writeHead(200, { "content-type": `${type}; charset=utf-8` });
    res.end(content);
  } catch {
    res.writeHead(404).end("Not found");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`\n⚡ JevCI Dashboard & API running at: http://localhost:${port}`);
  console.log(`   Run CLI directly using: npx jevci\n`);
});
