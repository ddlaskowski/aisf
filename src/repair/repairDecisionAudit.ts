import type { RepairReasonCode } from "./repairOutcomeClassifier.js";
import type { RepairRetryDecision } from "./repairRetryStrategy.js";

export type RepairDecisionAudit = {
  retryDecision: "retry-same-strategy" | "retry-different-strategy" | "manual-review" | "stop";
  reasonCode: RepairReasonCode;
  explanation: string;
  blockingFactors: string[];
  influencingFactors: string[];
};

export function auditRepairDecision(input: {
  retryDecision?: RepairRetryDecision | null;
  reasonCode: RepairReasonCode;
  policyDenied?: boolean;
  manualReview?: boolean;
  historyBlocked?: boolean;
  evidenceWarnings?: string[];
  policyWarnings?: string[];
  memoryWarnings?: string[];
}): RepairDecisionAudit {
  const retryDecision = input.retryDecision;
  const nextAction =
    retryDecision?.nextAction === "retry-same-strategy" ||
    retryDecision?.nextAction === "retry-different-strategy" ||
    retryDecision?.nextAction === "manual-review"
      ? retryDecision.nextAction
      : "stop";
  const blockingFactors: string[] = [];
  const influencingFactors: string[] = [];

  if (input.policyDenied) {
    blockingFactors.push("patch-policy-denied");
  }
  if (input.manualReview) {
    blockingFactors.push("manual-review-required");
  }
  if (input.historyBlocked) {
    blockingFactors.push("historical-failure-memory");
  }
  if (retryDecision?.blockedStrategies.length) {
    blockingFactors.push(`blocked-strategies:${retryDecision.blockedStrategies.join(",")}`);
  }

  for (const warning of input.evidenceWarnings ?? []) {
    influencingFactors.push(`evidence:${warning}`);
  }
  for (const warning of input.policyWarnings ?? []) {
    influencingFactors.push(`policy:${warning}`);
  }
  for (const warning of input.memoryWarnings ?? []) {
    influencingFactors.push(`memory:${warning}`);
  }
  if (retryDecision?.previousStrategies.length) {
    influencingFactors.push(`previous-strategies:${retryDecision.previousStrategies.join(",")}`);
  }

  return {
    retryDecision: nextAction,
    reasonCode: input.reasonCode,
    explanation: retryDecision?.reason ?? "No retry decision was produced; stopping by default.",
    blockingFactors,
    influencingFactors
  };
}
