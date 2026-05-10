import type { RepairAnalyticsHint } from "./repairAnalytics.js";
import type { RepairReleaseGate } from "./repairReleaseGate.js";
import type { RepairReview } from "./repairReview.js";
import type { RepairReviewAnalytics } from "./repairReviewAnalytics.js";
import type { RepairTrustIndex } from "./repairTrustIndex.js";

export type RepairGovernanceStatus =
  | "ready"
  | "ready-with-caution"
  | "manual-review-required"
  | "blocked";

export type RepairGovernance = {
  version: 1;
  governanceStatus: RepairGovernanceStatus;
  summary: string;
  finalDecision: {
    canProceed: boolean;
    requiresHumanReview: boolean;
    isBlocked: boolean;
  };
  supportingSignals: string[];
  riskSignals: string[];
  requiredActions: string[];
  blockingReasons: string[];
  sourceDecisions: {
    releaseDecision?: string;
    releaseScore?: number;
    trustLevel?: string;
    trustScore?: number;
    reviewVerdict?: string;
    repairOutcome?: string;
    validationPassed?: boolean;
  };
};

export type BuildRepairGovernanceInput = {
  repairReleaseGate?: RepairReleaseGate | null;
  repairTrustIndex?: RepairTrustIndex | null;
  repairReview?: RepairReview | null;
  repairOutcome?: unknown;
  validation?: unknown;
  repairEvidenceValidation?: unknown;
  repairRegressionRisk?: unknown;
  repairPatchPolicy?: unknown;
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

function validationPassed(validation: unknown): boolean | undefined {
  if (!isRecord(validation)) {
    return undefined;
  }
  const verdict = readString(validation, "verdict") || readString(validation, "status");
  if (verdict === "pass") return true;
  if (verdict === "fail" || verdict === "failed") return false;
  return undefined;
}

function unique(items: string[]): string[] {
  return [...new Set(items.filter((item) => item.trim().length > 0))];
}

function statusFromReleaseDecision(decision: string): RepairGovernanceStatus {
  if (decision === "allow") return "ready";
  if (decision === "allow-with-warnings") return "ready-with-caution";
  if (decision === "require-human-review") return "manual-review-required";
  return "blocked";
}

function summaryFor(status: RepairGovernanceStatus): string {
  if (status === "ready") {
    return "The repair is governed as ready because release, trust, review, and validation signals are acceptable.";
  }
  if (status === "ready-with-caution") {
    return "The repair is governed as ready with caution because it may proceed, but warnings or moderate risks were detected.";
  }
  if (status === "manual-review-required") {
    return "The repair requires manual review before it can be governed as ready.";
  }
  return "The repair is blocked because one or more required safety, validation, or governance checks failed.";
}

function actionsFor(status: RepairGovernanceStatus): string[] {
  if (status === "ready") {
    return ["No manual action required"];
  }
  if (status === "ready-with-caution") {
    return ["Review warnings before release", "Monitor future repair analytics"];
  }
  if (status === "manual-review-required") {
    return ["Manual reviewer approval required", "Inspect repair artifacts before release"];
  }
  return ["Do not release this repair", "Investigate blocking reasons", "Run additional validation after fixes"];
}

export function buildRepairGovernance(input: BuildRepairGovernanceInput): RepairGovernance {
  const releaseDecision = input.repairReleaseGate?.releaseDecision ?? "";
  const releaseScore = input.repairReleaseGate?.releaseScore;
  const trustLevel = input.repairTrustIndex?.trustLevel ?? "";
  const trustScore = input.repairTrustIndex?.trustScore;
  const reviewVerdict = input.repairReview?.verdict ?? "";
  const repairOutcome = readString(input.repairOutcome, "outcome") || (typeof input.repairOutcome === "string" ? input.repairOutcome : "");
  const passed = validationPassed(input.validation);
  const regressionRisk = readString(input.repairRegressionRisk, "riskLevel");
  const patchPolicyMode = readString(input.repairPatchPolicy, "mode");

  const supportingSignals: string[] = [];
  const riskSignals: string[] = [];
  const blockingReasons: string[] = [];

  let governanceStatus = releaseDecision ? statusFromReleaseDecision(releaseDecision) : "manual-review-required";

  if (!input.repairReleaseGate || !input.repairTrustIndex || !input.repairReview) {
    governanceStatus = "manual-review-required";
    blockingReasons.push("Required core governance artifacts were missing.");
  }

  if (releaseDecision === "allow") {
    supportingSignals.push("Release gate allowed the repair");
  } else if (releaseDecision === "allow-with-warnings") {
    supportingSignals.push("Release gate allowed with warnings");
    riskSignals.push("Release gate allowed with warnings");
  } else if (releaseDecision === "require-human-review") {
    riskSignals.push("Release gate required human review");
  } else if (releaseDecision === "block") {
    blockingReasons.push("Release gate blocked the repair");
  }

  if (trustLevel === "high") {
    supportingSignals.push("Trust index is high");
  } else if (trustLevel === "medium") {
    riskSignals.push("Trust index is medium");
  } else if (trustLevel === "low") {
    riskSignals.push("Trust index is low");
  } else if (trustLevel === "unsafe") {
    blockingReasons.push("Trust index marked the repair unsafe");
  }

  if (reviewVerdict === "approved") {
    supportingSignals.push("Repair review approved the run");
  } else if (reviewVerdict === "approved-with-warnings") {
    riskSignals.push("Review approved with warnings");
  } else if (reviewVerdict === "needs-human-review") {
    riskSignals.push("Repair review required human review");
  } else if (reviewVerdict === "rejected") {
    blockingReasons.push("Repair review rejected the run");
  }

  if (passed === true) {
    supportingSignals.push("Validation passed");
  } else if (passed === false) {
    blockingReasons.push("Validation failed");
  }

  if (repairOutcome === "success") {
    supportingSignals.push("Repair outcome was successful");
  } else if (repairOutcome === "manual-review-required") {
    riskSignals.push("Repair outcome required manual review");
  } else if (repairOutcome === "failed-worse") {
    blockingReasons.push("Repair outcome failed worse than before");
  } else if (repairOutcome) {
    riskSignals.push(`Repair outcome was ${repairOutcome}`);
  }

  if (regressionRisk === "medium") {
    riskSignals.push("Regression risk was medium");
  } else if (regressionRisk === "high" || regressionRisk === "critical") {
    riskSignals.push(`Regression risk was ${regressionRisk}`);
  }

  if (patchPolicyMode === "conservative") {
    riskSignals.push("Conservative patch policy was used");
  } else if (patchPolicyMode === "manual-review") {
    riskSignals.push("Patch policy required manual review");
  }

  if ((input.repairAnalytics?.warnings ?? []).length > 0) {
    riskSignals.push("Repair analytics reported warnings");
  }
  if ((input.repairReviewAnalytics?.warnings ?? []).length > 0) {
    riskSignals.push("Review analytics reported warnings");
  }
  if ((input.repairReleaseGate?.blockingReasons ?? []).length > 0) {
    blockingReasons.push(...(input.repairReleaseGate?.blockingReasons ?? []));
  }

  if (passed === false) {
    governanceStatus = "blocked";
  }
  if (releaseDecision === "block") {
    governanceStatus = "blocked";
  }
  if (trustLevel === "unsafe") {
    governanceStatus = "blocked";
  }
  if (reviewVerdict === "rejected") {
    governanceStatus = "blocked";
  }
  if (repairOutcome === "failed-worse") {
    governanceStatus = "blocked";
  }
  if (governanceStatus !== "blocked" && releaseDecision === "require-human-review") {
    governanceStatus = "manual-review-required";
  }
  if (governanceStatus !== "blocked" && repairOutcome === "manual-review-required") {
    governanceStatus = "manual-review-required";
  }
  if (governanceStatus !== "blocked" && patchPolicyMode === "manual-review") {
    governanceStatus = "manual-review-required";
  }

  if (governanceStatus === "ready" && blockingReasons.length === 0) {
    supportingSignals.push("No blocking concerns were reported");
  }

  return {
    version: 1,
    governanceStatus,
    summary: summaryFor(governanceStatus),
    finalDecision: {
      canProceed: governanceStatus === "ready" || governanceStatus === "ready-with-caution",
      requiresHumanReview: governanceStatus === "manual-review-required",
      isBlocked: governanceStatus === "blocked"
    },
    supportingSignals: unique(supportingSignals),
    riskSignals: unique(riskSignals),
    requiredActions: actionsFor(governanceStatus),
    blockingReasons: unique(blockingReasons),
    sourceDecisions: {
      releaseDecision: releaseDecision || undefined,
      releaseScore,
      trustLevel: trustLevel || undefined,
      trustScore,
      reviewVerdict: reviewVerdict || undefined,
      repairOutcome: repairOutcome || undefined,
      validationPassed: passed
    }
  };
}

function listSection(title: string, items: string[]): string[] {
  return [title, ...(items.length ? items.map((item) => `- ${item}`) : ["- none"])];
}

export function renderRepairGovernanceMarkdown(governance: RepairGovernance): string {
  return [
    "# Repair Governance",
    "",
    `Governance status: ${governance.governanceStatus}`,
    "",
    "Summary:",
    governance.summary,
    "",
    "Final decision:",
    `- Can proceed: ${governance.finalDecision.canProceed}`,
    `- Requires human review: ${governance.finalDecision.requiresHumanReview}`,
    `- Is blocked: ${governance.finalDecision.isBlocked}`,
    "",
    ...listSection("Supporting signals:", governance.supportingSignals),
    "",
    ...listSection("Risk signals:", governance.riskSignals),
    "",
    ...listSection("Required actions:", governance.requiredActions),
    "",
    ...listSection("Blocking reasons:", governance.blockingReasons),
    "",
    "Source decisions:",
    `- Release decision: ${governance.sourceDecisions.releaseDecision ?? "n/a"}`,
    `- Release score: ${governance.sourceDecisions.releaseScore ?? "n/a"}`,
    `- Trust level: ${governance.sourceDecisions.trustLevel ?? "n/a"}`,
    `- Trust score: ${governance.sourceDecisions.trustScore ?? "n/a"}`,
    `- Review verdict: ${governance.sourceDecisions.reviewVerdict ?? "n/a"}`,
    `- Repair outcome: ${governance.sourceDecisions.repairOutcome ?? "n/a"}`,
    `- Validation passed: ${governance.sourceDecisions.validationPassed ?? "n/a"}`,
    ""
  ].join("\n");
}

