import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { TypeSafeClient, score } from "@typesafe-ai/sdk";

const port = Number(process.env.PORT || 3000);
const publicDir = join(process.cwd(), "public");

const levels = [
  "No demonstrated understanding; absent, unrelated, or materially incorrect notes.",
  "Recognizes a few terms or isolated facts, but cannot explain their meaning or relationship.",
  "Explains core concepts accurately in simple terms and gives at least one relevant example.",
  "Connects concepts, explains trade-offs or causes, and applies them to a realistic situation.",
  "Demonstrates reliable, nuanced mastery: accurate mental models, edge cases, and justified decisions."
];

const questions = {
  conceptual_depth: score(
    "How deeply does `notes` demonstrate understanding of the topic, rather than merely mentioning terms?",
    levels
  ),
  accuracy: score(
    "How technically accurate are the claims in `notes` about the topic? Penalize unsupported or materially wrong claims; do not penalize missing coverage.",
    levels
  ),
  applied_reasoning: score(
    "How well does `notes` show the ability to apply topic knowledge: examples, procedures, troubleshooting, trade-offs, or decisions?",
    levels
  ),
  mental_model: score(
    "How well does `notes` explain relationships, mechanisms, causes, or consequences within the topic?",
    levels
  ),
  scope: score(
    "How much useful breadth of the topic is covered in `notes`, relative to the stated scope? Score only demonstrated coverage, not length or writing polish.",
    levels
  )
};

const weights = {
  conceptual_depth: 0.30,
  accuracy: 0.25,
  applied_reasoning: 0.20,
  mental_model: 0.15,
  scope: 0.10
};

function json(res, status, body) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

function diagnosticFrom(answers) {
  const dimensions = Object.entries(answers).map(([id, answer]) => ({
    id,
    label: id.replaceAll("_", " "),
    value: Math.round((answer.score / (levels.length - 1)) * 100),
    confidence: Math.round(answer.confidence * 100),
    probabilities: answer.probabilities
  }));
  const score100 = Math.round(dimensions.reduce((total, item) => total + item.value * weights[item.id], 0));
  const confidence = Math.round(dimensions.reduce((total, item) => total + item.confidence * weights[item.id], 0));
  return { score100, confidence, dimensions };
}

async function analyze(body) {
  if (!process.env.TYPESAFE_API_KEY) {
    throw new Error("TYPESAFE_API_KEY is not set on the server.");
  }
  const client = new TypeSafeClient();
  const response = await client.systemOne({
    state: {
      topic: body.topic,
      scope: body.scope || `general ${body.topic} fundamentals`,
      notes: body.notes
    },
    questions
  });
  return diagnosticFrom(response.answers);
}

const server = createServer(async (req, res) => {
  if (req.method === "POST" && req.url === "/api/analyze") {
    let raw = "";
    for await (const chunk of req) raw += chunk;
    try {
      const body = JSON.parse(raw);
      if (!body.topic?.trim() || !body.notes?.trim()) return json(res, 400, { error: "A topic and notes are required." });
      if (body.notes.length > 40_000) return json(res, 400, { error: "Please keep notes below 40,000 characters for this prototype." });
      return json(res, 200, await analyze(body));
    } catch (error) {
      return json(res, 500, { error: error instanceof Error ? error.message : "Analysis failed." });
    }
  }

  const requested = req.url === "/" ? "/index.html" : req.url;
  const pathname = normalize(requested).replace(/^([.][.][\\/])+/, "");
  const file = join(publicDir, pathname);
  try {
    const content = await readFile(file);
    const type = extname(file) === ".js" ? "text/javascript" : extname(file) === ".css" ? "text/css" : "text/html";
    res.writeHead(200, { "content-type": `${type}; charset=utf-8` });
    res.end(content);
  } catch {
    res.writeHead(404).end("Not found");
  }
});

server.listen(port, "127.0.0.1", () => console.log(`Knowledge diagnostic: http://localhost:${port}`));
