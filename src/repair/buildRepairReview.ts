import type { RepairDecisionTraceStep } from "./repairDecisionTrace.js";
import type { RepairObservabilityReport } from "./repairObservability.js";
import type { RepairReview, RepairReviewVerdict } from "./repairReview.js";
import type { RepairSummary } from "./repairSummary.js";

export type BuildRepairReviewInput = {
  observabilityReport?: RepairObservabilityReport | null;
  repairSummary?: RepairSummary | null;
  decisionTraceSteps?: RepairDecisionTraceStep[] | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown, field: string): string {
  if (!isRecord(value)) {
    return "";
  }
  const raw = value[field];
  return typeof raw === "string" ? raw : "";
}

function readBoolean(value: unknown, field: string): boolean | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  const raw = value[field];
  return typeof raw === "boolean" ? raw : undefined;
}

function readStringArray(value: unknown, field: string): string[] {
  if (!isRecord(value) || !Array.isArray(value[field])) {
    return [];
  }
  return value[field].filter((item): item is string => typeof item === "string");
}

function unique(items: string[]): string[] {
  return [...new Set(items.filter((item) => item.trim().length > 0))];
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function listSection(title: string, items: string[]): string[] {
  return [title, ...(items.length ? items.map((item) => `- ${item}`) : ["- none"])];
}

export function buildRepairReview(input: BuildRepairReviewInput): RepairReview {
  const report = input.observabilityReport ?? null;
  const summary = input.repairSummary ?? null;
  const traceSteps = input.decisionTraceSteps ?? [];

  let qualityScore = 100;
  let safetyScore = 100;
  let completenessScore = 100;

  const findings: string[] = [];
  const recommendations: string[] = [];
  const blockingConcerns: string[] = [];
  const warnings: string[] = [];

  if (!report) {
    return {
      verdict: "rejected",
      qualityScore: 0,
      safetyScore: 0,
      completenessScore: 0,
      findings: ["Repair observability report was not available."],
      recommendations: ["Regenerate observability artifacts before trusting this repair."],
      blockingConcerns: ["Missing observability artifacts."],
      warnings: []
    };
  }

  const finalStatus = report.finalDecision?.status ?? summary?.status ?? "failed";
  const finalReason = report.finalDecision?.reason ?? "Final decision reason was not available.";
  const evidenceConfidence = readString(report.repairEvidence, "confidence") || summary?.evidenceConfidence || "unknown";
  const evidenceMode = readString(report.repairEvidence, "allowedRepairMode");
  const riskLevel = readString(report.repairRegressionRisk, "riskLevel") || summary?.riskLevel || "unknown";
  const regressionAction = readString(report.repairRegressionRisk, "recommendedAction");
  const patchPolicyMode = readString(report.repairPatchPolicy, "mode") || summary?.patchPolicyMode || "unknown";
  const patchPolicyOk = readBoolean(report.repairPatchPolicy, "ok");
  const repairOutcome = readString(report.repairOutcome, "outcome") || summary?.outcome || "unknown";

  findings.push(`Final decision: ${finalStatus}.`);
  findings.push(`Final reason: ${finalReason}`);

  if (finalStatus === "success") {
    findings.push("Validation completed successfully after the repair path.");
  } else if (finalStatus === "failed") {
    qualityScore -= 70;
    safetyScore -= 30;
    findings.push("Validation did not pass after the repair path.");
    blockingConcerns.push("Repair did not resolve validation.");
    recommendations.push("Review the failed validation output before accepting this repair.");
  } else if (finalStatus === "manual-review") {
    qualityScore -= 35;
    completenessScore -= 15;
    findings.push("The repair path requires human review.");
    blockingConcerns.push("Manual review was requested by a safety layer.");
    recommendations.push("Have a human reviewer inspect the repair evidence and selected target.");
  } else if (finalStatus === "blocked") {
    qualityScore -= 45;
    completenessScore -= 20;
    findings.push("A safety layer blocked mutation or completion.");
    blockingConcerns.push(`Blocked by ${report.finalDecision.blockingLayer ?? "an unspecified layer"}.`);
    recommendations.push("Inspect the blocking layer before attempting another repair.");
  }

  if (evidenceConfidence === "high") {
    findings.push("Repair evidence confidence was high.");
  } else if (evidenceConfidence === "medium") {
    safetyScore -= 10;
    warnings.push("Repair evidence confidence was medium.");
    recommendations.push("Consider adding a regression scenario for this evidence pattern.");
  } else {
    safetyScore -= 25;
    warnings.push("Repair evidence confidence was low or unavailable.");
    recommendations.push("Prefer manual review when evidence confidence is low or missing.");
  }

  if (evidenceMode === "manual-review") {
    safetyScore -= 20;
    blockingConcerns.push("Evidence validation required manual review.");
  } else if (evidenceMode === "conservative") {
    safetyScore -= 5;
    warnings.push("Evidence validation allowed only conservative repair mode.");
  }

  if (riskLevel === "high") {
    safetyScore -= 35;
    warnings.push("Regression risk was high.");
    recommendations.push("Add or run focused regression coverage before trusting this repair.");
  } else if (riskLevel === "medium") {
    safetyScore -= 15;
    warnings.push("Regression risk was medium.");
  } else if (riskLevel === "low") {
    findings.push("Regression risk was low.");
  } else {
    completenessScore -= 10;
    warnings.push("Regression risk was unavailable.");
  }

  if (regressionAction === "manual-review" || regressionAction === "block") {
    blockingConcerns.push(`Regression guard recommended ${regressionAction}.`);
  } else if (regressionAction === "downgrade-to-conservative" || regressionAction === "proceed-with-warning") {
    warnings.push(`Regression guard recommended ${regressionAction}.`);
  }

  if (patchPolicyOk === false) {
    safetyScore -= 20;
    blockingConcerns.push("Patch policy blocked the proposed mutation.");
  } else if (patchPolicyMode === "conservative") {
    qualityScore -= 8;
    safetyScore -= 5;
    warnings.push("Conservative patch policy was required.");
  }

  if (repairOutcome === "failed-same-error" || repairOutcome === "no-change") {
    qualityScore -= 25;
    warnings.push(`Repair outcome was ${repairOutcome}.`);
  } else if (repairOutcome === "failed-new-error" || repairOutcome === "failed-worse") {
    qualityScore -= 40;
    safetyScore -= 20;
    blockingConcerns.push(`Repair outcome was ${repairOutcome}.`);
  } else if (repairOutcome === "validation-improved") {
    findings.push("Validation improved but did not fully pass.");
    qualityScore -= 15;
  }

  const traceWarnings = traceSteps.filter((step) => step.status === "warn");
  const traceBlocked = traceSteps.filter((step) => step.status === "blocked");
  const traceSkipped = traceSteps.filter((step) => step.status === "skipped");

  if (traceWarnings.length > 0) {
    safetyScore -= Math.min(20, traceWarnings.length * 4);
    warnings.push(...traceWarnings.map((step) => `${step.layer}: ${step.summary}`));
  }
  if (traceBlocked.length > 0) {
    completenessScore -= Math.min(25, traceBlocked.length * 8);
    blockingConcerns.push(...traceBlocked.map((step) => `${step.layer}: ${step.summary}`));
  }
  if (traceSkipped.length > 0) {
    completenessScore -= Math.min(20, traceSkipped.length * 3);
    warnings.push(...traceSkipped.map((step) => `${step.layer} was skipped.`));
  }

  if (!summary) {
    completenessScore -= 20;
    warnings.push("Repair summary artifact was not available.");
  }

  let verdict: RepairReviewVerdict;
  if (finalStatus === "failed") {
    verdict = "rejected";
  } else if (finalStatus === "manual-review" || finalStatus === "blocked") {
    verdict = "needs-human-review";
  } else if (blockingConcerns.length > 0) {
    verdict = "needs-human-review";
  } else if (warnings.length > 0 || qualityScore < 90 || safetyScore < 90 || completenessScore < 90) {
    verdict = "approved-with-warnings";
  } else {
    verdict = "approved";
  }

  if (verdict === "approved") {
    recommendations.push("Repair path is suitable to accept with the existing safety gates.");
  } else if (verdict === "approved-with-warnings") {
    recommendations.push("Accept only after reviewing warnings and preserving regression coverage.");
  } else if (verdict === "needs-human-review") {
    recommendations.push("Do not accept automatically; route this repair to human review.");
  } else {
    recommendations.push("Do not accept this repair without another validated repair attempt.");
  }

  return {
    verdict,
    qualityScore: clampScore(qualityScore),
    safetyScore: clampScore(safetyScore),
    completenessScore: clampScore(completenessScore),
    findings: unique(findings),
    recommendations: unique(recommendations),
    blockingConcerns: unique(blockingConcerns),
    warnings: unique([...warnings, ...readStringArray(report.repairStrategy, "warnings"), ...readStringArray(report.repairAnalytics, "warnings")])
  };
}

export function renderRepairReviewMarkdown(review: RepairReview): string {
  return [
    "# Repair Review",
    "",
    `Verdict: ${review.verdict}`,
    "",
    `Quality score: ${review.qualityScore}`,
    `Safety score: ${review.safetyScore}`,
    `Completeness score: ${review.completenessScore}`,
    "",
    ...listSection("Findings:", review.findings),
    "",
    ...listSection("Warnings:", review.warnings),
    "",
    ...listSection("Recommendations:", review.recommendations),
    "",
    ...listSection("Blocking concerns:", review.blockingConcerns),
    ""
  ].join("\n");
}

