import type { FailureMemoryRecord, FailureMemoryStore } from "./failureMemory.js";

export type FailureMemoryHint = {
  errorSignature: string;
  historicalMatches: number;
  failedStrategies: string[];
  successfulStrategies: string[];
  discouragedStrategies: string[];
  preferredStrategies: string[];
  recommendedStrategyHints: string[];
  recommendManualReview: boolean;
  warnings: string[];
};

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function matchingRecords(store: FailureMemoryStore, errorSignature: string, projectId?: string): FailureMemoryRecord[] {
  return store.records.filter(
    (record) =>
      record.errorSignature === errorSignature &&
      (!projectId || !record.projectId || record.projectId === projectId)
  );
}

export function lookupFailureMemory(input: {
  store: FailureMemoryStore;
  errorSignature: string;
  projectId?: string;
}): FailureMemoryHint {
  const matches = matchingRecords(input.store, input.errorSignature, input.projectId);
  const failedStrategies = unique(
    matches
      .filter((record) => record.outcome === "failed" || record.outcome === "policy-denied" || record.outcome === "manual-review")
      .map((record) => record.strategy)
  );
  const successfulStrategies = unique(matches.filter((record) => record.outcome === "success").map((record) => record.strategy));
  const discouragedStrategies: string[] = [];
  const warnings: string[] = [];

  for (const strategy of failedStrategies) {
    const failures = matches.filter(
      (record) =>
        record.strategy === strategy &&
        (record.outcome === "failed" || record.outcome === "policy-denied" || record.outcome === "manual-review")
    );
    if (failures.length >= 2) {
      discouragedStrategies.push(strategy);
      warnings.push(`Strategy ${strategy} failed repeatedly for this failure signature.`);
    }
  }

  const policyOrManualCount = matches.filter(
    (record) => record.outcome === "policy-denied" || record.outcome === "manual-review"
  ).length;
  if (policyOrManualCount > 0) {
    warnings.push("Historical policy-denied or manual-review outcomes increase repair caution.");
  }

  const recommendManualReview =
    policyOrManualCount >= 2 ||
    matches.filter((record) => record.outcome === "failed").length >= 3 ||
    (discouragedStrategies.length > 0 && successfulStrategies.length === 0);

  return {
    errorSignature: input.errorSignature,
    historicalMatches: matches.length,
    failedStrategies,
    successfulStrategies,
    discouragedStrategies: unique(discouragedStrategies),
    preferredStrategies: successfulStrategies,
    recommendedStrategyHints: successfulStrategies,
    recommendManualReview,
    warnings
  };
}
