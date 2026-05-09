export type RepairRetryNextAction =
  | "retry-same-strategy"
  | "retry-different-strategy"
  | "collect-more-context"
  | "manual-review"
  | "stop";

export type RepairRetryDecision = {
  shouldRetry: boolean;
  nextAction: RepairRetryNextAction;
  reason: string;
  previousStrategies: string[];
  blockedStrategies: string[];
};

export type DecideRepairRetryStrategyInput = {
  currentStrategy?: {
    strategy?: string;
    confidence?: string;
    recommendedAction?: string;
    mustAvoidStrategies?: string[];
  };

  previousAttempts?: Array<{
    strategy?: string;
    validationChanged?: boolean;
    validationPassed?: boolean;
    policyDenied?: boolean;
    manualReview?: boolean;
    mutationApplied?: boolean;
    errorSignature?: string;
    patchPolicy?: {
      allowed?: boolean;
      reason?: string;
      outcome?: string;
    };
  }>;

  latestValidation?: {
    passed?: boolean;
    changed?: boolean;
    errorSignature?: string;
    stderr?: string;
    stdout?: string;
  };

  retryCount?: number;
  maxRetries?: number;
  failureMemoryHint?: {
    discouragedStrategies?: string[];
    preferredStrategies?: string[];
    recommendManualReview?: boolean;
    warnings?: string[];
  };
};

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function previousStrategies(input: DecideRepairRetryStrategyInput): string[] {
  return (input.previousAttempts ?? [])
    .map((attempt) => attempt.strategy)
    .filter((strategy): strategy is string => typeof strategy === "string" && strategy.length > 0);
}

function repeatedUnchangedStrategy(input: DecideRepairRetryStrategyInput): string | null {
  const current = input.currentStrategy?.strategy;
  if (!current || input.latestValidation?.changed !== false) {
    return null;
  }

  return (input.previousAttempts ?? []).some((attempt) => attempt.strategy === current) ? current : null;
}

function unchangedErrorSignatureStrategy(input: DecideRepairRetryStrategyInput): string | null {
  const signature = input.latestValidation?.errorSignature;
  if (!signature || input.latestValidation?.changed !== false) {
    return null;
  }

  const match = (input.previousAttempts ?? []).find((attempt) => attempt.errorSignature === signature && attempt.strategy);
  return match?.strategy ?? null;
}

function policyDeniedStrategy(input: DecideRepairRetryStrategyInput): string | null {
  const denied = (input.previousAttempts ?? []).find(
    (attempt) => attempt.policyDenied === true || attempt.patchPolicy?.allowed === false
  );
  return denied?.strategy ?? null;
}

function decision(
  input: DecideRepairRetryStrategyInput,
  params: {
    shouldRetry: boolean;
    nextAction: RepairRetryNextAction;
    reason: string;
    blockedStrategies?: string[];
  }
): RepairRetryDecision {
  return {
    shouldRetry: params.shouldRetry,
    nextAction: params.nextAction,
    reason: params.reason,
    previousStrategies: previousStrategies(input),
    blockedStrategies: unique(params.blockedStrategies ?? [])
  };
}

export function decideRepairRetryStrategy(input: DecideRepairRetryStrategyInput): RepairRetryDecision {
  const previousAttempts = input.previousAttempts ?? [];
  const retryCount = input.retryCount ?? previousAttempts.length;
  const maxRetries = input.maxRetries ?? 2;
  const currentStrategy = input.currentStrategy?.strategy;
  const memoryDiscouragedStrategies = input.failureMemoryHint?.discouragedStrategies ?? [];
  const mustAvoidStrategies = unique([...(input.currentStrategy?.mustAvoidStrategies ?? []), ...memoryDiscouragedStrategies]);

  if (input.latestValidation?.passed === true) {
    return decision(input, {
      shouldRetry: false,
      nextAction: "stop",
      reason: "Validation passed; no retry needed."
    });
  }

  if (input.failureMemoryHint?.recommendManualReview === true) {
    return decision(input, {
      shouldRetry: false,
      nextAction: "manual-review",
      reason: "Failure memory recommends manual review for this signature.",
      blockedStrategies: mustAvoidStrategies
    });
  }

  if (retryCount >= maxRetries) {
    return decision(input, {
      shouldRetry: false,
      nextAction: "stop",
      reason: "Maximum retry count reached."
    });
  }

  if (input.currentStrategy?.recommendedAction === "stop") {
    return decision(input, {
      shouldRetry: false,
      nextAction: "stop",
      reason: "Current strategy requested stop."
    });
  }

  if (input.currentStrategy?.recommendedAction === "manual-review") {
    return decision(input, {
      shouldRetry: false,
      nextAction: "manual-review",
      reason: "Current strategy requires manual review."
    });
  }

  if (previousAttempts.some((attempt) => attempt.manualReview === true)) {
    return decision(input, {
      shouldRetry: false,
      nextAction: "manual-review",
      reason: "Previous attempt escalated to manual review."
    });
  }

  const deniedStrategy = policyDeniedStrategy(input);
  if (deniedStrategy || previousAttempts.some((attempt) => attempt.policyDenied === true || attempt.patchPolicy?.allowed === false)) {
    return decision(input, {
      shouldRetry: false,
      nextAction: "stop",
      reason: "Patch policy denied mutation; retry blocked.",
      blockedStrategies: deniedStrategy ? [deniedStrategy] : []
    });
  }

  if (currentStrategy && mustAvoidStrategies.includes(currentStrategy)) {
    return decision(input, {
      shouldRetry: true,
      nextAction: "retry-different-strategy",
      reason: "Current strategy is blocked by strategy decision.",
      blockedStrategies: [currentStrategy, ...mustAvoidStrategies]
    });
  }

  const repeated = repeatedUnchangedStrategy(input);
  if (repeated) {
    return decision(input, {
      shouldRetry: false,
      nextAction: "manual-review",
      reason: "Validation output unchanged after repeated same strategy.",
      blockedStrategies: [repeated]
    });
  }

  const unchangedSignatureStrategy = unchangedErrorSignatureStrategy(input);
  if (unchangedSignatureStrategy) {
    return decision(input, {
      shouldRetry: true,
      nextAction: "retry-different-strategy",
      reason: "Validation output unchanged; retry should switch strategy.",
      blockedStrategies: [unchangedSignatureStrategy]
    });
  }

  if (input.currentStrategy?.recommendedAction === "collect-more-context") {
    return decision(input, {
      shouldRetry: true,
      nextAction: "collect-more-context",
      reason: "Current strategy requires more context before retry."
    });
  }

  if (input.currentStrategy?.confidence === "low") {
    return decision(input, {
      shouldRetry: false,
      nextAction: "manual-review",
      reason: "Low-confidence strategy should not be retried automatically."
    });
  }

  return decision(input, {
    shouldRetry: true,
    nextAction: "retry-same-strategy",
    reason: "Retry allowed within retry limit."
  });
}
