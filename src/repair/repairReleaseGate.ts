import type { RepairAnalyticsHint } from "./repairAnalytics.js";
import type { RepairReview } from "./repairReview.js";
import type { RepairReviewAnalytics } from "./repairReviewAnalytics.js";
import type { RepairTrustIndex } from "./repairTrustIndex.js";

export type RepairReleaseDecision =
  | "allow"
  | "allow-with-warnings"
  | "require-human-review"
  | "block";

export type RepairReleaseGate = {
  version: 1;
  releaseDecision: RepairReleaseDecision;
  summary: string;
  releaseScore: number;
  releaseWarnings: string[];
  blockingReasons: string[];
  requiredActions: string[];
  evaluatedSignals: {
    trustLevel?: string;
    trustScore?: number;
    reviewVerdict?: string;
    repairOutcome?: string;
    validationPassed?: boolean;
    regressionRisk?: string;
    patchPolicyMode?: string;
    analyticsWarnings?: string[];
  };
};

export type BuildRepairReleaseGateInput = {
  repairTrustIndex?: RepairTrustIndex | null;
  repairReview?: RepairReview | null;
  validation?: unknown;
  repairOutcome?: unknown;
  repairPatchPolicy?: unknown;
  repairRegressionRisk?: unknown;
  repairReviewAnalytics?: RepairReviewAnalytics | null;
  repairAnalytics?: RepairAnalyticsHint | null;
  repairDecisionAudit?: unknown;
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

function unique(items: string[]): string[] {
  return [...new Set(items.filter((item) => item.trim().length > 0))];
}

function clamp(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function validationPassed(validation: unknown): boolean | undefined {
  if (!isRecord(validation)) {
    return undefined;
  }
  const verdict = readString(validation, "verdict") || readString(validation, "status");
  if (verdict === "pass") return true;
  if (verdict === "fail" || verdict === "failed") return false;
  return undefined;
}

function scoreDecision(score: number): RepairReleaseDecision {
  if (score >= 85) return "allow";
  if (score >= 65) return "allow-with-warnings";
  if (score >= 40) return "require-human-review";
  return "block";
}

function summaryFor(decision: RepairReleaseDecision): string {
  if (decision === "allow") {
    return "The repair passed all required validation and safety checks.";
  }
  if (decision === "allow-with-warnings") {
    return "The repair may proceed, but warnings or moderate risks were detected.";
  }
  if (decision === "require-human-review") {
    return "The repair requires manual review before release due to safety or confidence concerns.";
  }
  return "The repair must not proceed because blocking safety or validation concerns were detected.";
}

function maxDecision(
  current: RepairReleaseDecision,
  override: RepairReleaseDecision
): RepairReleaseDecision {
  const rank: Record<RepairReleaseDecision, number> = {
    allow: 0,
    "allow-with-warnings": 1,
    "require-human-review": 2,
    block: 3
  };
  return rank[override] > rank[current] ? override : current;
}

function analyticsWarnings(input: BuildRepairReleaseGateInput): string[] {
  return [
    ...(input.repairAnalytics?.warnings ?? []),
    ...(input.repairReviewAnalytics?.warnings ?? [])
  ];
}

function limitedPenalty(count: number, each: number, max: number): number {
  return Math.min(count * each, max);
}

export function buildRepairReleaseGate(input: BuildRepairReleaseGateInput): RepairReleaseGate {
  const trustScore = typeof input.repairTrustIndex?.trustScore === "number" ? input.repairTrustIndex.trustScore : 50;
  const trustLevel = input.repairTrustIndex?.trustLevel ?? "";
  const reviewVerdict = input.repairReview?.verdict ?? "";
  const repairOutcome = readString(input.repairOutcome, "outcome") || (typeof input.repairOutcome === "string" ? input.repairOutcome : "");
  const passed = validationPassed(input.validation);
  const regressionRisk = readString(input.repairRegressionRisk, "riskLevel");
  const patchPolicyMode = readString(input.repairPatchPolicy, "mode");
  const patchPolicyOk = readBoolean(input.repairPatchPolicy, "ok");
  const patchPolicyAction = readString(input.repairPatchPolicy, "recommendedAction");
  const warnings = analyticsWarnings(input);
  const trustBlocking = input.repairTrustIndex?.blockingConcerns ?? [];
  const missingTrustOrReview = !input.repairTrustIndex || !input.repairReview;

  let releaseScore = trustScore;
  const releaseWarnings: string[] = [];
  const blockingReasons: string[] = [];
  const requiredActions: string[] = [];

  if (missingTrustOrReview) {
    releaseScore -= 25;
    blockingReasons.push("Missing trust or repair review artifact data.");
    requiredActions.push("Manual reviewer approval required before release");
  }

  if (trustLevel === "medium") releaseScore -= 10;
  if (trustLevel === "low") releaseScore -= 25;
  if (trustLevel === "unsafe") releaseScore -= 60;

  if (reviewVerdict === "approved-with-warnings") {
    releaseScore -= 10;
    releaseWarnings.push("Repair review approved with warnings.");
  } else if (reviewVerdict === "needs-human-review") {
    releaseScore -= 30;
    requiredActions.push("Manual reviewer approval required before release");
  } else if (reviewVerdict === "rejected") {
    releaseScore -= 60;
    blockingReasons.push("Repair review rejected the run.");
  }

  if (passed === false) {
    releaseScore -= 50;
    blockingReasons.push("Validation failed.");
  } else if (passed === undefined) {
    releaseScore -= 25;
    releaseWarnings.push("Validation result was unknown.");
    requiredActions.push("Additional validation is recommended");
  }

  if (regressionRisk === "medium") {
    releaseScore -= 10;
    releaseWarnings.push("Medium regression risk detected.");
  } else if (regressionRisk === "high") {
    releaseScore -= 25;
    releaseWarnings.push("High regression risk detected.");
    requiredActions.push("Review regression-sensitive areas before release");
  } else if (regressionRisk === "critical") {
    releaseScore -= 40;
    blockingReasons.push("Critical regression risk detected.");
    requiredActions.push("Review regression-sensitive areas before release");
  }

  if (patchPolicyOk === false || patchPolicyAction === "block-mutation") {
    releaseScore -= 50;
    blockingReasons.push("Patch policy blocked mutation.");
  } else if (patchPolicyMode === "conservative") {
    releaseScore -= 10;
    releaseWarnings.push("Conservative patch policy was required.");
    requiredActions.push("Verify conservative patch behavior manually");
  } else if (patchPolicyMode === "manual-review") {
    releaseScore -= 35;
    requiredActions.push("Manual reviewer approval required before release");
  }

  releaseScore -= limitedPenalty(warnings.length, 5, 20);
  if (warnings.length > 0) {
    releaseWarnings.push(...warnings);
    requiredActions.push("Investigate recurring repair instability");
  }

  releaseScore -= limitedPenalty(trustBlocking.length, 15, 45);
  blockingReasons.push(...trustBlocking);

  if (clamp(releaseScore) < 70) {
    requiredActions.push("Additional validation is recommended");
  }

  let releaseDecision = scoreDecision(clamp(releaseScore));
  let hasHardBlock = false;
  if (passed === false) {
    releaseDecision = "block";
    hasHardBlock = true;
  }
  if (reviewVerdict === "rejected") {
    releaseDecision = "block";
    hasHardBlock = true;
  }
  if (trustLevel === "unsafe") {
    releaseDecision = "block";
    hasHardBlock = true;
  }
  if (repairOutcome === "failed-worse") {
    releaseDecision = "block";
    hasHardBlock = true;
  }
  if (patchPolicyOk === false || patchPolicyAction === "block-mutation") {
    releaseDecision = maxDecision(releaseDecision, passed === false ? "block" : "require-human-review");
  }
  if (repairOutcome === "manual-review-required") {
    releaseDecision = maxDecision(releaseDecision, "require-human-review");
  }
  if (missingTrustOrReview && !hasHardBlock) {
    releaseDecision = "require-human-review";
  }
  if (regressionRisk === "critical" && !hasHardBlock) {
    releaseDecision = "require-human-review";
  }

  if (releaseDecision === "require-human-review") {
    requiredActions.push("Manual reviewer approval required before release");
  }

  return {
    version: 1,
    releaseDecision,
    summary: summaryFor(releaseDecision),
    releaseScore: clamp(releaseScore),
    releaseWarnings: unique(releaseWarnings),
    blockingReasons: unique(blockingReasons),
    requiredActions: unique(requiredActions),
    evaluatedSignals: {
      trustLevel: trustLevel || undefined,
      trustScore: input.repairTrustIndex?.trustScore,
      reviewVerdict: reviewVerdict || undefined,
      repairOutcome: repairOutcome || undefined,
      validationPassed: passed,
      regressionRisk: regressionRisk || undefined,
      patchPolicyMode: patchPolicyMode || (patchPolicyOk === false ? "blocked" : undefined),
      analyticsWarnings: warnings
    }
  };
}

function listSection(title: string, items: string[]): string[] {
  return [title, ...(items.length ? items.map((item) => `- ${item}`) : ["- none"])];
}

export function renderRepairReleaseGateMarkdown(gate: RepairReleaseGate): string {
  return [
    "# Repair Release Gate",
    "",
    `Release decision: ${gate.releaseDecision}`,
    `Release score: ${gate.releaseScore}`,
    "",
    "Summary:",
    gate.summary,
    "",
    ...listSection("Warnings:", gate.releaseWarnings),
    "",
    ...listSection("Blocking reasons:", gate.blockingReasons),
    "",
    ...listSection("Required actions:", gate.requiredActions),
    ""
  ].join("\n");
}
