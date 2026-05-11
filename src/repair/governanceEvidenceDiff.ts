import path from "node:path";
import fs from "fs-extra";
import type { GovernanceDecisionMatrix } from "./governanceDecisionMatrix.js";
import type { GovernanceDriftDetection } from "./governanceDriftDetection.js";
import type { GovernanceEscalation } from "./governanceEscalation.js";
import type { GovernanceEvidenceIndex, GovernanceEvidenceIndexEntry } from "./governanceEvidenceIndex.js";
import type { GovernanceEvidencePackManifest } from "./governanceEvidencePack.js";
import type { GovernancePolicyRecommendation } from "./governancePolicyEnforcement.js";
import type { GovernanceStabilityScore } from "./governanceStabilityScore.js";
import type { GovernanceTrendAnalysis } from "./governanceTrendAnalysis.js";

export type GovernanceEvidenceDiffStatus = "improved" | "degraded" | "stable" | "mixed" | "unknown";

export type GovernanceEvidenceFieldDiff = {
  previous: string | number | boolean | null;
  current: string | number | boolean | null;
  changed: boolean;
  direction?: "improved" | "degraded" | "stable" | "unknown";
};

export type GovernanceEvidenceDiff = {
  version: 1;
  evidenceA: {
    evidencePackId: string;
    generatedAt?: string;
  };
  evidenceB: {
    evidencePackId: string;
    generatedAt?: string;
  };
  status: GovernanceEvidenceDiffStatus;
  summary: string;
  fields: {
    policyMode?: GovernanceEvidenceFieldDiff;
    escalationLevel?: GovernanceEvidenceFieldDiff;
    stabilityLevel?: GovernanceEvidenceFieldDiff;
    stabilityScore?: GovernanceEvidenceFieldDiff;
    driftSeverity?: GovernanceEvidenceFieldDiff;
    trendHealth?: GovernanceEvidenceFieldDiff;
    operatorApprovalRequired?: GovernanceEvidenceFieldDiff;
    autonomousOperationAllowed?: GovernanceEvidenceFieldDiff;
  };
  decisionMatrix: {
    previousRuleCount: number;
    currentRuleCount: number;
    addedRules: string[];
    removedRules: string[];
    unchangedRules: string[];
  };
  insights: Array<{
    severity: "info" | "warning" | "critical";
    code: string;
    message: string;
  }>;
  generatedAt: string;
};

export type GovernanceEvidencePackSnapshot = {
  entry: GovernanceEvidenceIndexEntry;
  manifest?: GovernanceEvidencePackManifest;
  trends?: GovernanceTrendAnalysis;
  drift?: GovernanceDriftDetection;
  stability?: GovernanceStabilityScore;
  escalation?: GovernanceEscalation;
  policy?: GovernancePolicyRecommendation;
  decisionMatrix?: GovernanceDecisionMatrix;
  warnings: string[];
};

type FieldName = keyof GovernanceEvidenceDiff["fields"];
type Primitive = string | number | boolean | null;

const UNKNOWN_GENERATED_AT = "1970-01-01T00:00:00.000Z";

const POLICY_ORDER = ["normal", "conservative", "restricted", "manual-review-only"];
const ESCALATION_ORDER = ["none", "info", "warning", "high-risk", "critical"];
const STABILITY_ORDER = ["stable", "caution", "unstable", "critical"];
const DRIFT_ORDER = ["none", "low", "medium", "high", "critical"];
const TREND_ORDER = ["healthy", "warning", "critical", "unknown"];

function resolveProjectPath(projectRoot: string, relativePath: string): string {
  const resolved = path.resolve(projectRoot, relativePath);
  const relative = path.relative(projectRoot, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Evidence pack path must stay within the project root.");
  }
  return resolved;
}

function readOptionalJson<T>(projectRoot: string, relativePath: string, warnings: string[]): T | undefined {
  const resolved = resolveProjectPath(projectRoot, relativePath);
  if (!fs.pathExistsSync(resolved)) {
    warnings.push(`Evidence artifact missing: ${relativePath}`);
    return undefined;
  }
  try {
    return fs.readJsonSync(resolved) as T;
  } catch {
    warnings.push(`Evidence artifact unreadable: ${relativePath}`);
    return undefined;
  }
}

export function loadGovernanceEvidencePack(
  projectRoot: string,
  index: GovernanceEvidenceIndex,
  evidencePackId: string
): GovernanceEvidencePackSnapshot {
  const entry = [...index.entries]
    .filter((candidate) => candidate.evidencePackId === evidencePackId)
    .sort((a, b) => b.generatedAt.localeCompare(a.generatedAt))
    [0];
  if (!entry) {
    throw new Error(`Governance evidence pack not found: ${evidencePackId}`);
  }

  const warnings: string[] = [];
  const base = entry.relativePath;
  return {
    entry,
    manifest: readOptionalJson<GovernanceEvidencePackManifest>(projectRoot, `${base}/manifest.json`, warnings),
    trends: readOptionalJson<GovernanceTrendAnalysis>(projectRoot, `${base}/trends.json`, warnings),
    drift: readOptionalJson<GovernanceDriftDetection>(projectRoot, `${base}/drift.json`, warnings),
    stability: readOptionalJson<GovernanceStabilityScore>(projectRoot, `${base}/stability.json`, warnings),
    escalation: readOptionalJson<GovernanceEscalation>(projectRoot, `${base}/escalation.json`, warnings),
    policy: readOptionalJson<GovernancePolicyRecommendation>(projectRoot, `${base}/policy.json`, warnings),
    decisionMatrix: readOptionalJson<GovernanceDecisionMatrix>(projectRoot, `${base}/decision-matrix.json`, warnings),
    warnings
  };
}

function rank(value: Primitive, order: string[]): number | null {
  if (typeof value !== "string") return null;
  const index = order.indexOf(value);
  return index >= 0 ? index : null;
}

function directionBySeverity(previous: Primitive, current: Primitive, order: string[]): GovernanceEvidenceFieldDiff["direction"] {
  const previousRank = rank(previous, order);
  const currentRank = rank(current, order);
  if (previousRank === null || currentRank === null) return "unknown";
  if (currentRank < previousRank) return "improved";
  if (currentRank > previousRank) return "degraded";
  return "stable";
}

function directionByScore(previous: Primitive, current: Primitive): GovernanceEvidenceFieldDiff["direction"] {
  if (typeof previous !== "number" || typeof current !== "number") return "unknown";
  if (current > previous) return "improved";
  if (current < previous) return "degraded";
  return "stable";
}

function directionByApproval(previous: Primitive, current: Primitive): GovernanceEvidenceFieldDiff["direction"] {
  if (typeof previous !== "boolean" || typeof current !== "boolean") return "unknown";
  if (previous === true && current === false) return "improved";
  if (previous === false && current === true) return "degraded";
  return "stable";
}

function directionByAutonomous(previous: Primitive, current: Primitive): GovernanceEvidenceFieldDiff["direction"] {
  if (typeof previous !== "boolean" || typeof current !== "boolean") return "unknown";
  if (previous === false && current === true) return "improved";
  if (previous === true && current === false) return "degraded";
  return "stable";
}

function buildField(previous: Primitive, current: Primitive, direction: GovernanceEvidenceFieldDiff["direction"]): GovernanceEvidenceFieldDiff {
  return {
    previous,
    current,
    changed: previous !== current,
    direction
  };
}

function fieldValue(snapshot: GovernanceEvidencePackSnapshot, field: FieldName): Primitive {
  if (field === "policyMode") return snapshot.policy?.recommendedPolicyMode ?? snapshot.manifest?.governanceSummary.policyMode ?? snapshot.entry.policyMode ?? null;
  if (field === "escalationLevel") return snapshot.escalation?.escalationLevel ?? snapshot.manifest?.governanceSummary.escalationLevel ?? snapshot.entry.escalationLevel ?? null;
  if (field === "stabilityLevel") return snapshot.stability?.level ?? snapshot.manifest?.governanceSummary.stabilityLevel ?? snapshot.entry.stabilityLevel ?? null;
  if (field === "stabilityScore") return snapshot.stability?.score ?? snapshot.manifest?.governanceSummary.stabilityScore ?? snapshot.entry.stabilityScore ?? null;
  if (field === "driftSeverity") return snapshot.drift?.overallSeverity ?? snapshot.manifest?.governanceSummary.driftSeverity ?? snapshot.entry.driftSeverity ?? null;
  if (field === "trendHealth") return snapshot.trends?.trendHealth ?? snapshot.manifest?.governanceSummary.trendHealth ?? snapshot.entry.trendHealth ?? null;
  if (field === "operatorApprovalRequired") return snapshot.policy?.operatorApprovalRequired ?? snapshot.decisionMatrix?.finalDecision.operatorApprovalRequired ?? null;
  if (field === "autonomousOperationAllowed") return snapshot.policy?.autonomousOperationAllowed ?? snapshot.decisionMatrix?.finalDecision.autonomousOperationAllowed ?? null;
  return null;
}

function directionFor(field: FieldName, previous: Primitive, current: Primitive): GovernanceEvidenceFieldDiff["direction"] {
  if (previous === null || current === null) return "unknown";
  if (field === "policyMode") return directionBySeverity(previous, current, POLICY_ORDER);
  if (field === "escalationLevel") return directionBySeverity(previous, current, ESCALATION_ORDER);
  if (field === "stabilityLevel") return directionBySeverity(previous, current, STABILITY_ORDER);
  if (field === "stabilityScore") return directionByScore(previous, current);
  if (field === "driftSeverity") return directionBySeverity(previous, current, DRIFT_ORDER);
  if (field === "trendHealth") return directionBySeverity(previous, current, TREND_ORDER);
  if (field === "operatorApprovalRequired") return directionByApproval(previous, current);
  if (field === "autonomousOperationAllowed") return directionByAutonomous(previous, current);
  return "unknown";
}

function buildFields(previous: GovernanceEvidencePackSnapshot, current: GovernanceEvidencePackSnapshot): GovernanceEvidenceDiff["fields"] {
  const fields: GovernanceEvidenceDiff["fields"] = {};
  const fieldNames: FieldName[] = [
    "policyMode",
    "escalationLevel",
    "stabilityLevel",
    "stabilityScore",
    "driftSeverity",
    "trendHealth",
    "operatorApprovalRequired",
    "autonomousOperationAllowed"
  ];
  for (const field of fieldNames) {
    const previousValue = fieldValue(previous, field);
    const currentValue = fieldValue(current, field);
    if (previousValue === null && currentValue === null) continue;
    fields[field] = buildField(previousValue, currentValue, directionFor(field, previousValue, currentValue));
  }
  return fields;
}

function ruleIds(snapshot?: GovernanceDecisionMatrix): string[] {
  return [...new Set((snapshot?.matrix ?? []).map((entry) => entry.ruleId))].sort();
}

function buildDecisionMatrixDiff(previous?: GovernanceDecisionMatrix, current?: GovernanceDecisionMatrix): GovernanceEvidenceDiff["decisionMatrix"] {
  const previousRules = ruleIds(previous);
  const currentRules = ruleIds(current);
  return {
    previousRuleCount: previousRules.length,
    currentRuleCount: currentRules.length,
    addedRules: currentRules.filter((rule) => !previousRules.includes(rule)).sort(),
    removedRules: previousRules.filter((rule) => !currentRules.includes(rule)).sort(),
    unchangedRules: currentRules.filter((rule) => previousRules.includes(rule)).sort()
  };
}

function determineStatus(fields: GovernanceEvidenceDiff["fields"]): GovernanceEvidenceDiffStatus {
  const directions = Object.values(fields)
    .map((field) => field.direction)
    .filter((direction): direction is NonNullable<GovernanceEvidenceFieldDiff["direction"]> => direction !== undefined && direction !== "unknown");
  if (directions.length === 0) return "unknown";
  const improved = directions.includes("improved");
  const degraded = directions.includes("degraded");
  if (improved && degraded) return "mixed";
  if (degraded) return "degraded";
  if (improved) return "improved";
  return "stable";
}

function summaryFor(status: GovernanceEvidenceDiffStatus): string {
  if (status === "improved") return "Governance evidence improved between evidence packs.";
  if (status === "degraded") return "Governance evidence degraded between evidence packs.";
  if (status === "mixed") return "Governance evidence changed with mixed improvements and regressions.";
  if (status === "stable") return "Governance evidence remained stable between evidence packs.";
  return "Governance evidence could not be compared reliably.";
}

function addFieldInsight(
  insights: GovernanceEvidenceDiff["insights"],
  field: FieldName,
  diff: GovernanceEvidenceFieldDiff
): void {
  if (!diff.changed || diff.direction === "stable" || diff.direction === "unknown") return;
  if (field === "policyMode") {
    insights.push({
      severity: diff.direction === "improved" ? "info" : "warning",
      code: diff.direction === "improved" ? "POLICY_MODE_IMPROVED" : "POLICY_MODE_DEGRADED",
      message: diff.direction === "improved" ? "Governance policy mode became less restrictive." : "Governance policy mode became more restrictive."
    });
  }
  if (field === "escalationLevel") {
    insights.push({
      severity: diff.direction === "improved" ? "info" : "warning",
      code: diff.direction === "improved" ? "ESCALATION_IMPROVED" : "ESCALATION_DEGRADED",
      message: diff.direction === "improved" ? "Governance escalation level decreased." : "Governance escalation level increased."
    });
  }
  if (field === "stabilityScore") {
    insights.push({
      severity: diff.direction === "improved" ? "info" : "warning",
      code: diff.direction === "improved" ? "STABILITY_SCORE_IMPROVED" : "STABILITY_SCORE_DEGRADED",
      message: diff.direction === "improved" ? "Governance stability score improved." : "Governance stability score decreased."
    });
  }
  if (field === "autonomousOperationAllowed") {
    insights.push({
      severity: diff.direction === "improved" ? "info" : "critical",
      code: diff.direction === "improved" ? "AUTONOMOUS_OPERATION_RESTORED" : "AUTONOMOUS_OPERATION_RESTRICTED",
      message: diff.direction === "improved" ? "Autonomous operation allowance was restored." : "Autonomous operation allowance was restricted."
    });
  }
}

function buildInsights(
  fields: GovernanceEvidenceDiff["fields"],
  status: GovernanceEvidenceDiffStatus,
  warnings: string[]
): GovernanceEvidenceDiff["insights"] {
  const insights: GovernanceEvidenceDiff["insights"] = [];
  for (const warning of warnings) {
    insights.push({ severity: "warning", code: "MISSING_EVIDENCE_ARTIFACT", message: warning });
  }
  for (const [field, diff] of Object.entries(fields) as Array<[FieldName, GovernanceEvidenceFieldDiff]>) {
    addFieldInsight(insights, field, diff);
  }
  if (insights.length === 0 && status === "stable") {
    insights.push({ severity: "info", code: "EVIDENCE_STABLE", message: "Governance evidence remained stable." });
  }
  if (insights.length === 0 && status === "unknown") {
    insights.push({ severity: "warning", code: "EVIDENCE_COMPARISON_UNKNOWN", message: "Governance evidence could not be compared reliably." });
  }
  return insights;
}

export function buildGovernanceEvidenceDiff(input: {
  previous: GovernanceEvidencePackSnapshot;
  current: GovernanceEvidencePackSnapshot;
  generatedAt?: string;
}): GovernanceEvidenceDiff {
  const fields = buildFields(input.previous, input.current);
  const status = determineStatus(fields);
  const warnings = [...input.previous.warnings, ...input.current.warnings].sort();
  return {
    version: 1,
    evidenceA: {
      evidencePackId: input.previous.entry.evidencePackId,
      generatedAt: input.previous.manifest?.generatedAt ?? input.previous.entry.generatedAt
    },
    evidenceB: {
      evidencePackId: input.current.entry.evidencePackId,
      generatedAt: input.current.manifest?.generatedAt ?? input.current.entry.generatedAt
    },
    status,
    summary: summaryFor(status),
    fields,
    decisionMatrix: buildDecisionMatrixDiff(input.previous.decisionMatrix, input.current.decisionMatrix),
    insights: buildInsights(fields, status, warnings),
    generatedAt: input.generatedAt ?? new Date().toISOString()
  };
}

function formatValue(value: Primitive): string {
  if (value === null) return "unknown";
  return String(value);
}

export function renderGovernanceEvidenceDiffMarkdown(diff: GovernanceEvidenceDiff): string {
  const lines = [
    "# AI Software Factory - Governance Evidence Diff",
    "",
    "Evidence A:",
    `- ${diff.evidenceA.evidencePackId}`,
    "",
    "Evidence B:",
    `- ${diff.evidenceB.evidencePackId}`,
    "",
    "Status:",
    diff.status,
    "",
    "Summary:",
    diff.summary,
    "",
    "## Field Changes",
    "",
    "| Field | Previous | Current | Direction |",
    "|---|---|---|---|"
  ];

  for (const [field, fieldDiff] of Object.entries(diff.fields)) {
    lines.push(`| ${field} | ${formatValue(fieldDiff.previous)} | ${formatValue(fieldDiff.current)} | ${fieldDiff.direction ?? "unknown"} |`);
  }

  lines.push(
    "",
    "## Decision Matrix Changes",
    "",
    `- previous rules: ${diff.decisionMatrix.previousRuleCount}`,
    `- current rules: ${diff.decisionMatrix.currentRuleCount}`,
    "",
    "Added rules:"
  );
  lines.push(...(diff.decisionMatrix.addedRules.length ? diff.decisionMatrix.addedRules.map((rule) => `- ${rule}`) : ["- none"]));
  lines.push("", "Removed rules:");
  lines.push(...(diff.decisionMatrix.removedRules.length ? diff.decisionMatrix.removedRules.map((rule) => `- ${rule}`) : ["- none"]));
  lines.push("", "Unchanged rules:");
  lines.push(...(diff.decisionMatrix.unchangedRules.length ? diff.decisionMatrix.unchangedRules.map((rule) => `- ${rule}`) : ["- none"]));
  lines.push("", "## Insights", "");
  for (const insight of diff.insights) {
    lines.push(`- [${insight.severity}] ${insight.code} - ${insight.message}`);
  }

  return `${lines.join("\n")}\n`;
}

export function renderGovernanceEvidenceDiffText(diff: GovernanceEvidenceDiff): string {
  return renderGovernanceEvidenceDiffMarkdown(diff);
}
