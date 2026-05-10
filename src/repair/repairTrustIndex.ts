import type { RepairAnalyticsHint } from "./repairAnalytics.js";
import type { RepairReview } from "./repairReview.js";
import type { RepairReviewAnalytics } from "./repairReviewAnalytics.js";

export type RepairTrustLevel = "high" | "medium" | "low" | "unsafe";

export type RepairTrustIndex = {
  version: 1;
  trustLevel: RepairTrustLevel;
  trustScore: number;
  summary: string;
  positiveSignals: string[];
  negativeSignals: string[];
  warnings: string[];
  blockingConcerns: string[];
  inputSignals: {
    repairOutcome?: string;
    reviewVerdict?: string;
    evidenceConfidence?: string;
    regressionRisk?: string;
    patchPolicyMode?: string;
    retryDecision?: string;
    validationPassed?: boolean;
    reviewAnalyticsWarnings?: string[];
    repairAnalyticsWarnings?: string[];
  };
};

export type BuildRepairTrustIndexInput = {
  repairOutcome?: unknown;
  repairReview?: RepairReview | null;
  repairReviewAnalytics?: RepairReviewAnalytics | null;
  repairAnalytics?: RepairAnalyticsHint | null;
  repairEvidenceValidation?: unknown;
  repairRegressionRisk?: unknown;
  repairPatchPolicy?: unknown;
  repairDecisionAudit?: unknown;
  validation?: unknown;
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

function clamp(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function penaltyForOutcome(outcome: string): number {
  const penalties: Record<string, number> = {
    success: 0,
    "validation-improved": 15,
    "no-change": 35,
    "failed-same-error": 50,
    "failed-new-error": 60,
    "failed-worse": 75,
    "policy-denied": 45,
    "manual-review-required": 40
  };
  return penalties[outcome] ?? 25;
}

function baseTrustLevel(score: number): RepairTrustLevel {
  if (score >= 85) return "high";
  if (score >= 65) return "medium";
  if (score >= 40) return "low";
  return "unsafe";
}

function capTrustLevel(level: RepairTrustLevel, cap: RepairTrustLevel): RepairTrustLevel {
  const rank: Record<RepairTrustLevel, number> = {
    unsafe: 0,
    low: 1,
    medium: 2,
    high: 3
  };
  return rank[level] > rank[cap] ? cap : level;
}

function summaryFor(level: RepairTrustLevel): string {
  if (level === "high") {
    return "The repair has a high trust score because validation passed, review approved the run, and no major risks were detected.";
  }
  if (level === "medium") {
    return "The repair is usable with caution because warnings or moderate risk signals were detected.";
  }
  if (level === "low") {
    return "The repair should be reviewed before trusting because important safety, evidence, or validation concerns were detected.";
  }
  return "The repair should not be trusted because blocking concerns, failed validation, or rejected review signals were detected.";
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

function limitedPenalty(count: number, each: number, max: number): number {
  return Math.min(count * each, max);
}

export function buildRepairTrustIndex(input: BuildRepairTrustIndexInput): RepairTrustIndex {
  let trustScore = 100;
  let hardCap: RepairTrustLevel | null = null;

  const positiveSignals: string[] = [];
  const negativeSignals: string[] = [];
  const warnings: string[] = [];
  const blockingConcerns: string[] = [];

  const repairOutcome = readString(input.repairOutcome, "outcome") || (typeof input.repairOutcome === "string" ? input.repairOutcome : "");
  const reviewVerdict = input.repairReview?.verdict ?? "";
  const evidenceConfidence = readString(input.repairEvidenceValidation, "confidence");
  const regressionRisk = readString(input.repairRegressionRisk, "riskLevel");
  const patchPolicyMode = readString(input.repairPatchPolicy, "mode");
  const retryDecision = readString(input.repairDecisionAudit, "retryDecision");
  const passed = validationPassed(input.validation);
  const patchPolicyOk = readBoolean(input.repairPatchPolicy, "ok");
  const patchPolicyAction = readString(input.repairPatchPolicy, "recommendedAction");
  const reviewAnalyticsWarnings = input.repairReviewAnalytics?.warnings ?? [];
  const repairAnalyticsWarnings = input.repairAnalytics?.warnings ?? [];

  if (repairOutcome) {
    const penalty = penaltyForOutcome(repairOutcome);
    trustScore -= penalty;
    if (repairOutcome === "success") {
      positiveSignals.push("Repair outcome was successful.");
    } else {
      negativeSignals.push(`Repair outcome was ${repairOutcome}.`);
    }
  } else {
    trustScore -= 25;
    hardCap = "low";
    negativeSignals.push("Repair outcome was missing.");
    blockingConcerns.push("Missing required repair outcome data.");
  }

  if (reviewVerdict === "approved") {
    positiveSignals.push("Repair review approved the run.");
  } else if (reviewVerdict === "approved-with-warnings") {
    trustScore -= 15;
    warnings.push("Repair review approved the run with warnings.");
  } else if (reviewVerdict === "needs-human-review") {
    trustScore -= 35;
    negativeSignals.push("Repair review requires human review.");
  } else if (reviewVerdict === "rejected") {
    trustScore -= 70;
    hardCap = "unsafe";
    blockingConcerns.push("Repair review rejected the run.");
  } else {
    trustScore -= 35;
    hardCap = "low";
    negativeSignals.push("Repair review verdict was missing.");
    blockingConcerns.push("Missing required repair review data.");
  }

  if (evidenceConfidence === "high") {
    positiveSignals.push("Evidence confidence was high.");
  } else if (evidenceConfidence === "medium") {
    trustScore -= 10;
    negativeSignals.push("Evidence confidence was medium.");
  } else if (evidenceConfidence === "low") {
    trustScore -= 25;
    negativeSignals.push("Evidence confidence was low.");
  } else {
    trustScore -= 35;
    hardCap = "low";
    negativeSignals.push("Evidence confidence was missing.");
  }

  if (regressionRisk === "low") {
    positiveSignals.push("Regression risk was low.");
  } else if (regressionRisk === "medium") {
    trustScore -= 10;
    negativeSignals.push("Medium regression risk detected.");
  } else if (regressionRisk === "high") {
    trustScore -= 25;
    negativeSignals.push("High regression risk detected.");
  } else if (regressionRisk === "critical") {
    trustScore -= 40;
    negativeSignals.push("Critical regression risk detected.");
  }

  if (patchPolicyOk === false || patchPolicyAction === "block-mutation") {
    trustScore -= 35;
    hardCap = hardCap === "unsafe" ? "unsafe" : "low";
    negativeSignals.push("Patch policy blocked mutation.");
  } else if (patchPolicyMode === "normal") {
    positiveSignals.push("Patch policy mode was normal.");
  } else if (patchPolicyMode === "conservative") {
    trustScore -= 10;
    negativeSignals.push("Conservative patch policy was required.");
  } else if (patchPolicyMode === "manual-review") {
    trustScore -= 35;
    negativeSignals.push("Patch policy required manual review.");
  }

  if (retryDecision === "stop") {
    positiveSignals.push("Retry audit did not require additional retry.");
  } else if (retryDecision === "retry-same-strategy" || retryDecision === "retry-different-strategy") {
    trustScore -= 10;
    negativeSignals.push(`Retry audit allowed ${retryDecision}.`);
  } else if (retryDecision === "manual-review") {
    trustScore -= 20;
    negativeSignals.push("Retry audit required manual review.");
  }

  if (passed === true) {
    positiveSignals.push("Validation passed.");
  } else if (passed === false) {
    trustScore -= 50;
    hardCap = hardCap === "unsafe" ? "unsafe" : "low";
    negativeSignals.push("Validation failed.");
  } else {
    trustScore -= 25;
    negativeSignals.push("Validation result was missing or unknown.");
  }

  trustScore -= limitedPenalty(repairAnalyticsWarnings.length, 5, 20);
  trustScore -= limitedPenalty(reviewAnalyticsWarnings.length, 5, 20);
  warnings.push(...repairAnalyticsWarnings, ...reviewAnalyticsWarnings);

  const reviewBlockingConcerns = input.repairReview?.blockingConcerns ?? [];
  trustScore -= limitedPenalty(reviewBlockingConcerns.length, 15, 45);
  blockingConcerns.push(...reviewBlockingConcerns);

  let trustLevel = baseTrustLevel(clamp(trustScore));
  if (repairOutcome === "failed-worse") {
    trustLevel = "unsafe";
  }
  if (reviewVerdict === "rejected") {
    trustLevel = "unsafe";
  }
  if (hardCap) {
    trustLevel = capTrustLevel(trustLevel, hardCap);
  }

  return {
    version: 1,
    trustLevel,
    trustScore: clamp(trustScore),
    summary: summaryFor(trustLevel),
    positiveSignals: unique(positiveSignals),
    negativeSignals: unique(negativeSignals),
    warnings: unique(warnings),
    blockingConcerns: unique(blockingConcerns),
    inputSignals: {
      repairOutcome: repairOutcome || undefined,
      reviewVerdict: reviewVerdict || undefined,
      evidenceConfidence: evidenceConfidence || undefined,
      regressionRisk: regressionRisk || undefined,
      patchPolicyMode: patchPolicyMode || (patchPolicyOk === false ? "blocked" : undefined),
      retryDecision: retryDecision || undefined,
      validationPassed: passed,
      reviewAnalyticsWarnings,
      repairAnalyticsWarnings
    }
  };
}

function listSection(title: string, items: string[]): string[] {
  return [title, ...(items.length ? items.map((item) => `- ${item}`) : ["- none"])];
}

export function renderRepairTrustIndexMarkdown(index: RepairTrustIndex): string {
  return [
    "# Repair Trust Index",
    "",
    `Trust level: ${index.trustLevel}`,
    `Trust score: ${index.trustScore}`,
    "",
    "Summary:",
    index.summary,
    "",
    ...listSection("Positive signals:", index.positiveSignals),
    "",
    ...listSection("Negative signals:", index.negativeSignals),
    "",
    ...listSection("Warnings:", index.warnings),
    "",
    ...listSection("Blocking concerns:", index.blockingConcerns),
    ""
  ].join("\n");
}

