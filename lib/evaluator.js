import { TypeSafeClient, score } from "@typesafe-ai/sdk";

const commitLevels = [
  "Uninformative, absent, or low-quality commit message (e.g., 'wip', 'fix', empty).",
  "Vague description of changes without explaining rationale or scope.",
  "Clearly states what changed in simple, direct terms.",
  "Follows conventional commit standards (feat/fix/refactor) and explains the core motivation behind the diff.",
  "Exemplary commit message: clear scope, rationale, context, and breaking change notes."
];

const docLevels = [
  "Severe misalignment; public APIs/functions modified in diff directly contradict existing docs.",
  "Code changes introduce new features/flags but documentation is left untouched.",
  "Minor discrepancies between code changes and docs.",
  "Code changes are consistent with docs or require no doc updates (internal refactor).",
  "Outstanding alignment: docs are updated alongside public API changes with clean examples."
];

const breakingLevels = [
  "High breaking risk: exported types, function signatures, or public routes modified/removed without backward compatibility.",
  "Moderate risk: parameters changed or default behaviors mutated without deprecation notice.",
  "Low-to-moderate risk: minor structural shifts with possible edge case impact.",
  "Low risk: additive non-breaking extensions or backward-compatible parameter additions.",
  "Zero breaking risk: internal implementation refactor or purely additive test/doc updates."
];

const securityLevels = [
  "Contains exposed secrets, private keys, plain text passwords, or dangerous security anti-patterns.",
  "Potential security risk: hardcoded tokens or suspicious credential patterns found.",
  "Minor security warning: unverified external calls or missing input sanitization.",
  "Clean diff: no hardcoded secrets or obvious security risks detected.",
  "Verified safe: clean diff with no credentials, high safety, and robust code practices."
];

export const questions = {
  commit_quality: score(
    "How well-structured, descriptive, and justified is `commit` for the code changes in `diff`?",
    commitLevels
  ),
  doc_alignment: score(
    "How well-aligned are the code changes in `diff` with repository documentation in `docs`?",
    docLevels
  ),
  breaking_risk: score(
    "How safe are the code changes in `diff` regarding API contracts and breaking changes? (Higher score = lower breaking risk)",
    breakingLevels
  ),
  security_audit: score(
    "How free of security hazards, exposed secrets, private keys, or API token leaks is `diff`?",
    securityLevels
  )
};

export const weights = {
  commit_quality: 0.25,
  doc_alignment: 0.25,
  breaking_risk: 0.25,
  security_audit: 0.25
};

const rubricLabels = {
  commit_quality: "Commit Message Quality",
  doc_alignment: "Doc & Code Alignment",
  breaking_risk: "API Contract & Breaking Risk",
  security_audit: "Secret & Security Audit"
};

function processAnswers(answers, threshold = 70) {
  const dimensions = Object.entries(answers).map(([id, answer]) => {
    const rawScore = typeof answer.score === "number" ? answer.score : 3;
    const value = Math.round((rawScore / 4) * 100);
    const confidence = Math.round((answer.confidence ?? 0.88) * 100);
    
    let status = "PASS";
    let message = "Meets quality standards.";

    if (id === "security_audit" && value < 75) {
      status = "FAIL";
      message = "Potential credential exposure or unsafe security pattern detected!";
    } else if (value < threshold) {
      status = "FAIL";
      message = `Score (${value}) is below target threshold (${threshold}).`;
    } else if (value >= 85) {
      status = "PASS";
      message = "High quality assessment.";
    }

    return {
      id,
      label: rubricLabels[id] || id,
      score: rawScore,
      value,
      confidence,
      status,
      message,
      probabilities: answer.probabilities || [0, 0, 0.1, 0.8, 0.1]
    };
  });

  const overallScore = Math.round(
    dimensions.reduce((acc, dim) => acc + dim.value * (weights[dim.id] || 0.25), 0)
  );
  
  const overallConfidence = Math.round(
    dimensions.reduce((acc, dim) => acc + dim.confidence * (weights[dim.id] || 0.25), 0)
  );

  const isPassed = overallScore >= threshold && dimensions.every((d) => d.status === "PASS");

  return {
    passed: isPassed,
    overallScore,
    overallConfidence,
    threshold,
    dimensions
  };
}

function generateMockEvaluation(context, threshold = 70) {
  const diffStr = (context.diff || "").toLowerCase();
  const commitStr = (context.commit || "").toLowerCase();

  // Basic heuristics for mock mode when API key is not present
  const isVagueCommit = commitStr.length < 10 || ["wip", "fix", "update", "test"].includes(commitStr.trim());
  // Refined secret detection: look for assignments to actual secret strings (e.g., key = "sk-..." or bearer tokens)
  const hasSecretRisk = /((api[_-]?key|secret|password)\s*[:=]\s*["'][a-z0-9_\-]{8,}["']|bearer\s+[a-z0-9._\-]{16,})/i.test(diffStr);
  const modifiesPublicAPI = /(export\s+function|export\s+class|app\.(get|post|put|delete)|route)/i.test(diffStr);

  const mockAnswers = {
    commit_quality: {
      score: isVagueCommit ? 1 : commitStr.startsWith("feat") || commitStr.startsWith("fix") ? 4 : 3,
      confidence: 0.92,
      probabilities: [0, 0.05, 0.15, 0.6, 0.2]
    },
    doc_alignment: {
      score: modifiesPublicAPI && !context.docs.includes("README") ? 2 : 4,
      confidence: 0.85,
      probabilities: [0, 0.1, 0.1, 0.65, 0.15]
    },
    breaking_risk: {
      score: modifiesPublicAPI ? 3 : 4,
      confidence: 0.89,
      probabilities: [0, 0.05, 0.15, 0.7, 0.1]
    },
    security_audit: {
      score: hasSecretRisk ? 0 : 4,
      confidence: 0.96,
      probabilities: hasSecretRisk ? [0.95, 0.05, 0, 0, 0] : [0, 0, 0, 0.05, 0.95]
    }
  };

  const processed = processAnswers(mockAnswers, threshold);
  processed.isMock = true;
  return processed;
}

export async function evaluateDiff(context, options = {}) {
  const startTime = Date.now();
  const threshold = options.threshold ?? 70;

  if (!process.env.TYPESAFE_API_KEY) {
    const mock = generateMockEvaluation(context, threshold);
    mock.elapsedMs = Date.now() - startTime;
    return mock;
  }

  const client = new TypeSafeClient();
  const response = await client.systemOne({
    state: {
      diff: context.diff,
      commit: context.commit,
      docs: context.docs
    },
    questions
  });

  const result = processAnswers(response.answers, threshold);
  result.isMock = false;
  result.elapsedMs = Date.now() - startTime;
  return result;
}
