import type { RepairObservabilityReport } from "./repairObservability.js";

export type RepairSummary = {
  runId: string;
  status: "success" | "failed" | "manual-review" | "blocked";
  strategy?: string;
  targetFile?: string;
  repairType?: string;
  evidenceConfidence?: string;
  riskLevel?: string;
  patchPolicyMode?: string;
  outcome?: string;
  commitCreated?: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown, field: string): string | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  const raw = value[field];
  return typeof raw === "string" && raw.length > 0 ? raw : undefined;
}

function readBoolean(value: unknown, field: string): boolean | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  const raw = value[field];
  return typeof raw === "boolean" ? raw : undefined;
}

export function buildRepairSummary(report: RepairObservabilityReport): RepairSummary {
  const summary: RepairSummary = {
    runId: report.runId,
    status: report.finalDecision.status
  };

  const strategy = readString(report.repairStrategy, "strategy");
  if (strategy) summary.strategy = strategy;

  const targetFile = readString(report.repairTarget, "filePath") || readString(report.repairIntent, "targetFile");
  if (targetFile) summary.targetFile = targetFile;

  const repairType = readString(report.repairIntent, "repairType");
  if (repairType) summary.repairType = repairType;

  const evidenceConfidence = readString(report.repairEvidence, "confidence");
  if (evidenceConfidence) summary.evidenceConfidence = evidenceConfidence;

  const riskLevel = readString(report.repairRegressionRisk, "riskLevel");
  if (riskLevel) summary.riskLevel = riskLevel;

  const patchPolicyMode = readString(report.repairPatchPolicy, "mode");
  if (patchPolicyMode) summary.patchPolicyMode = patchPolicyMode;

  const outcome = readString(report.repairOutcome, "outcome");
  if (outcome) summary.outcome = outcome;

  const commitCreated = readBoolean(report.safePatch, "commitCreated");
  if (commitCreated !== undefined) summary.commitCreated = commitCreated;

  return summary;
}
