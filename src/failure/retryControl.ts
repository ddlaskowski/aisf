import type { FailureClassification, FailureMemoryEntry } from "./failureClassifier.js";

export interface RetryDecision {
  shouldContinue: boolean;
  reason?: string;
}

export function shouldContinueRetry(input: {
  failureMemory: FailureMemoryEntry[];
  currentFailure: FailureClassification;
  attempt: number;
  maxAttempts: number;
  changeApplied?: boolean;
}): RetryDecision {
  if (input.attempt >= input.maxAttempts) {
    return { shouldContinue: false, reason: "Max attempts reached" };
  }

  const sameFailureCount = input.failureMemory.filter(
    (entry) => entry.type === input.currentFailure.type && entry.message === input.currentFailure.details.rawMessage
  ).length + 1;
  if (sameFailureCount >= 2) {
    return { shouldContinue: false, reason: "Same failure repeated twice" };
  }

  if (input.changeApplied === false && input.attempt > 1) {
    return { shouldContinue: false, reason: "No effective change applied" };
  }

  const sameStrategyCount = input.failureMemory.filter(
    (entry) => entry.strategy === input.currentFailure.strategy
  ).length + 1;
  if (sameStrategyCount >= 2) {
    return { shouldContinue: false, reason: "Same strategy failed twice" };
  }

  return { shouldContinue: true };
}

function assertDecision(
  input: Parameters<typeof shouldContinueRetry>[0],
  expected: RetryDecision
): void {
  const actual = shouldContinueRetry(input);
  if (actual.shouldContinue !== expected.shouldContinue || actual.reason !== expected.reason) {
    throw new Error(
      `shouldContinueRetry failed: expected ${expected.shouldContinue}/${expected.reason}, got ${actual.shouldContinue}/${actual.reason}`
    );
  }
}

function runRetryControlAssertions(): void {
  const failure: FailureClassification = {
    type: "unknown",
    strategy: "ai-fix",
    confidence: "low",
    details: { rawMessage: "boom" }
  };

  assertDecision({ failureMemory: [], currentFailure: failure, attempt: 2, maxAttempts: 2 }, {
    shouldContinue: false,
    reason: "Max attempts reached"
  });
  assertDecision(
    {
      failureMemory: [
        { attempt: 1, type: "unknown", strategy: "safe-replacement", message: "boom" }
      ],
      currentFailure: failure,
      attempt: 2,
      maxAttempts: 3
    },
    { shouldContinue: false, reason: "Same failure repeated twice" }
  );
  assertDecision({ failureMemory: [], currentFailure: failure, attempt: 2, maxAttempts: 3, changeApplied: false }, {
    shouldContinue: false,
    reason: "No effective change applied"
  });
  assertDecision(
    {
      failureMemory: [
        { attempt: 1, type: "duplicate-declaration", strategy: "ai-fix", message: "two" }
      ],
      currentFailure: failure,
      attempt: 2,
      maxAttempts: 3
    },
    { shouldContinue: false, reason: "Same strategy failed twice" }
  );
  assertDecision({ failureMemory: [], currentFailure: failure, attempt: 1, maxAttempts: 3, changeApplied: true }, {
    shouldContinue: true
  });
}

runRetryControlAssertions();
