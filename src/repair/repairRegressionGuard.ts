export type RepairRegressionRisk = {
  riskLevel: "low" | "medium" | "high";
  blocked: boolean;
  riskReasons: string[];
  recommendedAction:
    | "proceed"
    | "proceed-with-warning"
    | "downgrade-to-conservative"
    | "manual-review"
    | "block";
  warnings: string[];
};

export const FAILED_WORSE_RATE_HIGH = 0.4;
export const FAILED_WORSE_REPEAT_BLOCK_THRESHOLD = 2;
export const POLICY_DENIED_DOWNGRADE_THRESHOLD = 2;
export const MANUAL_REVIEW_ESCALATION_THRESHOLD = 2;
export const LOW_EFFECTIVENESS_SCORE_THRESHOLD = 0;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readNumber(value: unknown, field: string): number {
  if (!isRecord(value)) {
    return 0;
  }
  const raw = value[field];
  return typeof raw === "number" && Number.isFinite(raw) ? raw : 0;
}

function readString(value: unknown, field: string): string {
  if (!isRecord(value)) {
    return "";
  }
  const raw = value[field];
  return typeof raw === "string" ? raw : "";
}

function readOutcome(record: unknown): string {
  return readString(record, "outcome") || readString(record, "repairOutcome");
}

function matchingFailedWorseCount(input: {
  failureSignature?: unknown;
  strategy?: string;
  memoryMatches?: unknown[];
}): number {
  const signature = typeof input.failureSignature === "string" ? input.failureSignature : "";
  return (input.memoryMatches ?? []).filter((record) => {
    const recordSignature = readString(record, "errorSignature");
    const recordStrategy = readString(record, "strategy");
    return (
      (!signature || recordSignature === signature) &&
      (!input.strategy || recordStrategy === input.strategy) &&
      readOutcome(record) === "failed-worse"
    );
  }).length;
}

export function assessRepairRegressionRisk(input: {
  failureSignature?: unknown;
  strategy?: string;
  analytics?: unknown;
  memoryMatches?: unknown[];
}): RepairRegressionRisk {
  const riskReasons: string[] = [];
  const warnings: string[] = [];
  const worsenedRate = readNumber(input.analytics, "worsenedRate");
  const worsenedCount = readNumber(input.analytics, "worsenedCount");
  const policyDeniedCount = readNumber(input.analytics, "policyDeniedCount");
  const manualReviewCount = readNumber(input.analytics, "manualReviewCount");
  const effectivenessScore = readNumber(input.analytics, "effectivenessScore");
  const repeatedFailedWorse = matchingFailedWorseCount(input);

  if (repeatedFailedWorse >= FAILED_WORSE_REPEAT_BLOCK_THRESHOLD) {
    riskReasons.push("Repeated failed-worse outcomes for this failure signature and strategy.");
    warnings.push("Historical regression pattern blocks automatic mutation.");
    return {
      riskLevel: "high",
      blocked: true,
      riskReasons,
      recommendedAction: "block",
      warnings
    };
  }

  if (worsenedRate >= FAILED_WORSE_RATE_HIGH || worsenedCount >= FAILED_WORSE_REPEAT_BLOCK_THRESHOLD) {
    riskReasons.push("High historical failed-worse rate for this strategy.");
    warnings.push("Strategy has historically regressed validation.");
    return {
      riskLevel: "high",
      blocked: false,
      riskReasons,
      recommendedAction: "manual-review",
      warnings
    };
  }

  if (manualReviewCount >= MANUAL_REVIEW_ESCALATION_THRESHOLD) {
    riskReasons.push("Repeated historical manual-review outcomes for this strategy.");
    warnings.push("Strategy should be escalated to manual review.");
    return {
      riskLevel: "high",
      blocked: false,
      riskReasons,
      recommendedAction: "manual-review",
      warnings
    };
  }

  if (policyDeniedCount >= POLICY_DENIED_DOWNGRADE_THRESHOLD) {
    riskReasons.push("Multiple historical policy-denied outcomes for this strategy.");
    warnings.push("Strategy should be downgraded to conservative policy mode.");
    return {
      riskLevel: "medium",
      blocked: false,
      riskReasons,
      recommendedAction: "downgrade-to-conservative",
      warnings
    };
  }

  if (effectivenessScore < LOW_EFFECTIVENESS_SCORE_THRESHOLD) {
    riskReasons.push("Historical effectiveness score is below the deterministic threshold.");
    warnings.push("Strategy appears historically risky; continue only with existing gates.");
    return {
      riskLevel: "medium",
      blocked: false,
      riskReasons,
      recommendedAction: "proceed-with-warning",
      warnings
    };
  }

  return {
    riskLevel: "low",
    blocked: false,
    riskReasons,
    recommendedAction: "proceed",
    warnings
  };
}
