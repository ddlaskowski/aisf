import type { RepairPatchPolicyDecision } from "./repairPatchPolicy.js";
import type { ValidationDelta } from "./validationDelta.js";

export type RepairReasonCode =
  | "VALIDATION_PASSED"
  | "ERROR_UNCHANGED"
  | "ERROR_CHANGED"
  | "ERROR_WORSENED"
  | "NO_RUNTIME_CHANGE"
  | "VALIDATION_IMPROVED"
  | "POLICY_DENIED"
  | "MANUAL_REVIEW_REQUIRED"
  | "RETRY_BLOCKED_BY_HISTORY";

export type RepairOutcomeClassification = {
  outcome:
    | "success"
    | "failed-same-error"
    | "failed-new-error"
    | "failed-worse"
    | "no-change"
    | "validation-improved"
    | "policy-denied"
    | "manual-review-required";
  reasonCode: RepairReasonCode;
  changedValidationState: boolean;
  beforeFailureSignature?: string;
  afterFailureSignature?: string;
  explanation: string;
  warnings: string[];
};

export function classifyRepairOutcome(input: {
  validationDelta: ValidationDelta;
  validationPassed?: boolean;
  evidenceManualReview?: boolean;
  patchPolicy?: RepairPatchPolicyDecision | null;
  retryBlockedByHistory?: boolean;
}): RepairOutcomeClassification {
  const delta = input.validationDelta;
  const warnings: string[] = [];

  if (input.patchPolicy && (!input.patchPolicy.ok || input.patchPolicy.recommendedAction === "block-mutation")) {
    return {
      outcome: "policy-denied",
      reasonCode: "POLICY_DENIED",
      changedValidationState: false,
      beforeFailureSignature: delta.beforeSignature,
      afterFailureSignature: delta.afterSignature,
      explanation: "Repair patch policy denied mutation before patching.",
      warnings: input.patchPolicy.warnings
    };
  }

  if (input.evidenceManualReview === true) {
    return {
      outcome: "manual-review-required",
      reasonCode: "MANUAL_REVIEW_REQUIRED",
      changedValidationState: false,
      beforeFailureSignature: delta.beforeSignature,
      afterFailureSignature: delta.afterSignature,
      explanation: "Repair evidence or retry control required manual review.",
      warnings
    };
  }

  if (input.retryBlockedByHistory === true) {
    return {
      outcome: "manual-review-required",
      reasonCode: "RETRY_BLOCKED_BY_HISTORY",
      changedValidationState: false,
      beforeFailureSignature: delta.beforeSignature,
      afterFailureSignature: delta.afterSignature,
      explanation: "Historical failure memory blocked another automatic retry.",
      warnings: ["Retry was blocked by historical repair awareness."]
    };
  }

  if (input.validationPassed === true || delta.outcome === "resolved") {
    return {
      outcome: "success",
      reasonCode: "VALIDATION_PASSED",
      changedValidationState: true,
      beforeFailureSignature: delta.beforeSignature,
      afterFailureSignature: delta.afterSignature,
      explanation: "Validation passed after repair.",
      warnings
    };
  }

  if (delta.outcome === "worsened") {
    return {
      outcome: "failed-worse",
      reasonCode: "ERROR_WORSENED",
      changedValidationState: true,
      beforeFailureSignature: delta.beforeSignature,
      afterFailureSignature: delta.afterSignature,
      explanation: "Validation regressed or produced a broader runtime failure.",
      warnings: ["Repair attempt may have introduced a worse validation state."]
    };
  }

  if (delta.beforeSignature && delta.afterSignature && delta.beforeSignature === delta.afterSignature) {
    return {
      outcome: "failed-same-error",
      reasonCode: "ERROR_UNCHANGED",
      changedValidationState: false,
      beforeFailureSignature: delta.beforeSignature,
      afterFailureSignature: delta.afterSignature,
      explanation: "Validation failed with the same deterministic failure signature.",
      warnings
    };
  }

  if (delta.outcome === "changed" && delta.beforeSignature && delta.afterSignature) {
    return {
      outcome: "failed-new-error",
      reasonCode: "ERROR_CHANGED",
      changedValidationState: true,
      beforeFailureSignature: delta.beforeSignature,
      afterFailureSignature: delta.afterSignature,
      explanation: "Validation failed with a different failure signature and no deterministic proof of improvement.",
      warnings
    };
  }

  if (delta.outcome === "changed") {
    return {
      outcome: "validation-improved",
      reasonCode: "VALIDATION_IMPROVED",
      changedValidationState: true,
      beforeFailureSignature: delta.beforeSignature,
      afterFailureSignature: delta.afterSignature,
      explanation: "The original validation failure changed, suggesting deterministic progress.",
      warnings
    };
  }

  return {
    outcome: "no-change",
    reasonCode: "NO_RUNTIME_CHANGE",
    changedValidationState: false,
    beforeFailureSignature: delta.beforeSignature,
    afterFailureSignature: delta.afterSignature,
    explanation: "Validation state did not effectively change after repair.",
    warnings
  };
}
