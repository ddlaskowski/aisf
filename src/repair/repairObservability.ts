export type RepairFinalDecision = {
  status: "success" | "failed" | "manual-review" | "blocked";
  reason: string;
  blockingLayer?: string;
};

export type RepairObservabilityReport = {
  schemaVersion: 1;
  runId: string;
  task: string;
  timestamp: number;
  failure?: unknown;
  failureSignature?: unknown;
  failureMemory?: unknown;
  repairAnalytics?: unknown;
  repairStrategy?: unknown;
  repairTarget?: unknown;
  repairIntent?: unknown;
  repairEvidence?: unknown;
  repairRegressionRisk?: unknown;
  repairPatchPolicy?: unknown;
  patchIntentValidation?: unknown;
  safePatch?: unknown;
  validation?: unknown;
  validationDelta?: unknown;
  repairOutcome?: unknown;
  retryDecisionAudit?: unknown;
  repairDecisionAudit?: unknown;
  repairRetryDecision?: unknown;
  finalDecision: RepairFinalDecision;

  // Backward-compatible aliases used by existing scenario assertions.
  repairEvidenceValidation?: unknown;
  mutationSkippedForEvidence?: boolean;
  mutationSkippedForPolicy?: boolean;
};

export type BuildRepairObservabilityReportInput = Omit<
  RepairObservabilityReport,
  "schemaVersion" | "timestamp" | "finalDecision"
> & {
  timestamp?: number;
  finalDecision?: RepairFinalDecision;
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

function deriveFinalDecision(input: BuildRepairObservabilityReportInput): RepairFinalDecision {
  const patchPolicyAction = readString(input.repairPatchPolicy, "recommendedAction");
  const patchPolicyOk = readBoolean(input.repairPatchPolicy, "ok");
  if (patchPolicyOk === false || patchPolicyAction === "block-mutation") {
    return {
      status: "blocked",
      reason: "Repair was blocked by patch policy.",
      blockingLayer: "repairPatchPolicy"
    };
  }

  const regressionAction = readString(input.repairRegressionRisk, "recommendedAction");
  const regressionBlocked = readBoolean(input.repairRegressionRisk, "blocked") === true;
  if (regressionBlocked || regressionAction === "block") {
    return {
      status: "blocked",
      reason: "Repair was blocked by regression risk guard.",
      blockingLayer: "repairRegressionRisk"
    };
  }
  if (regressionAction === "manual-review") {
    return {
      status: "manual-review",
      reason: "Repair requires manual review due to regression risk.",
      blockingLayer: "repairRegressionRisk"
    };
  }

  const evidenceOk = readBoolean(input.repairEvidence ?? input.repairEvidenceValidation, "ok");
  const evidenceMode = readString(input.repairEvidence ?? input.repairEvidenceValidation, "allowedRepairMode");
  if (evidenceOk === false || evidenceMode === "manual-review" || input.mutationSkippedForEvidence === true) {
    return {
      status: "manual-review",
      reason: "Repair requires manual review due to insufficient or unsafe evidence.",
      blockingLayer: "repairEvidence"
    };
  }

  const patchIntentOk = readBoolean(input.patchIntentValidation, "ok");
  if (patchIntentOk === false) {
    return {
      status: "blocked",
      reason: "Patch intent validation blocked the repair.",
      blockingLayer: "patchIntentValidation"
    };
  }

  const outcome = readString(input.repairOutcome, "outcome");
  if (outcome === "success") {
    return {
      status: "success",
      reason: "Validation passed after safe patch."
    };
  }
  if (outcome === "policy-denied") {
    return {
      status: "blocked",
      reason: "Repair was blocked by patch policy.",
      blockingLayer: "repairPatchPolicy"
    };
  }
  if (outcome === "manual-review-required") {
    return {
      status: "manual-review",
      reason: "Repair requires manual review.",
      blockingLayer: "repairOutcome"
    };
  }

  const validationStatus = readString(input.validation, "status") || readString(input.validation, "verdict");
  if (validationStatus === "pass") {
    return {
      status: "success",
      reason: "Validation passed after safe patch."
    };
  }

  return {
    status: "failed",
    reason: "Validation failed after repair attempt."
  };
}

export function buildRepairObservabilityReport(
  input: BuildRepairObservabilityReportInput
): RepairObservabilityReport {
  const repairEvidence = input.repairEvidence ?? input.repairEvidenceValidation;
  return {
    schemaVersion: 1,
    runId: input.runId,
    task: input.task,
    timestamp: input.timestamp ?? 0,
    failure: input.failure,
    failureSignature: input.failureSignature,
    failureMemory: input.failureMemory,
    repairAnalytics: input.repairAnalytics,
    repairStrategy: input.repairStrategy,
    repairTarget: input.repairTarget,
    repairIntent: input.repairIntent,
    repairEvidence,
    repairRegressionRisk: input.repairRegressionRisk,
    repairPatchPolicy: input.repairPatchPolicy,
    patchIntentValidation: input.patchIntentValidation,
    safePatch: input.safePatch,
    validation: input.validation,
    validationDelta: input.validationDelta,
    repairOutcome: input.repairOutcome,
    retryDecisionAudit: input.retryDecisionAudit ?? input.repairDecisionAudit,
    repairRetryDecision: input.repairRetryDecision,
    finalDecision: input.finalDecision ?? deriveFinalDecision({ ...input, repairEvidence }),
    repairEvidenceValidation: repairEvidence,
    mutationSkippedForEvidence: input.mutationSkippedForEvidence,
    mutationSkippedForPolicy: input.mutationSkippedForPolicy
  };
}
