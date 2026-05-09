import path from "node:path";
import fs from "fs-extra";

export type RepairStrategyAnalytics = {
  strategy: string;
  totalAttempts: number;
  successCount: number;
  failedCount: number;
  validationImprovedCount: number;
  worsenedCount: number;
  policyDeniedCount: number;
  manualReviewCount: number;
  effectivenessScore: number;
  successRate: number;
  failureRate: number;
  validationImprovementRate: number;
  worsenedRate: number;
  policyDeniedRate: number;
  manualReviewRate: number;
  warnings: string[];
};

export type RepairAnalyticsStore = {
  version: "v2.3";
  updatedAt: string;
  strategies: Record<string, RepairStrategyAnalytics>;
};

export type RepairAnalyticsHint = {
  strategy: string | null;
  effectivenessScore: number | null;
  historicalSuccessRate: number | null;
  historicalFailureRate: number | null;
  validationImprovementRate: number | null;
  worsenedRate: number | null;
  policyDeniedRate: number | null;
  manualReviewRate: number | null;
  warnings: string[];
  advisoryOnly: true;
};

const OUTCOME_WEIGHTS: Record<string, number> = {
  success: 3,
  "validation-improved": 1,
  "failed-same-error": -1,
  "failed-new-error": -1,
  "failed-worse": -3,
  "no-change": -1,
  "policy-denied": -2,
  "manual-review-required": -2
};

export function getRepairAnalyticsPath(projectRoot: string): string {
  return path.join(projectRoot, ".factory", "analytics", "repair-analytics.json");
}

function emptyStore(): RepairAnalyticsStore {
  return {
    version: "v2.3",
    updatedAt: new Date(0).toISOString(),
    strategies: {}
  };
}

function emptyStrategy(strategy: string): RepairStrategyAnalytics {
  return recalculate({
    strategy,
    totalAttempts: 0,
    successCount: 0,
    failedCount: 0,
    validationImprovedCount: 0,
    worsenedCount: 0,
    policyDeniedCount: 0,
    manualReviewCount: 0,
    effectivenessScore: 0,
    successRate: 0,
    failureRate: 0,
    validationImprovementRate: 0,
    worsenedRate: 0,
    policyDeniedRate: 0,
    manualReviewRate: 0,
    warnings: []
  });
}

function rate(count: number, total: number): number {
  return total > 0 ? Number((count / total).toFixed(4)) : 0;
}

function recalculate(analytics: RepairStrategyAnalytics): RepairStrategyAnalytics {
  const total = analytics.totalAttempts;
  const warnings: string[] = [];
  const effectivenessScore =
    analytics.successCount * OUTCOME_WEIGHTS.success +
    analytics.validationImprovedCount * OUTCOME_WEIGHTS["validation-improved"] +
    analytics.failedCount * OUTCOME_WEIGHTS["failed-same-error"] +
    analytics.worsenedCount * OUTCOME_WEIGHTS["failed-worse"] +
    analytics.policyDeniedCount * OUTCOME_WEIGHTS["policy-denied"] +
    analytics.manualReviewCount * OUTCOME_WEIGHTS["manual-review-required"];
  const successRate = rate(analytics.successCount, total);
  const failureRate = rate(analytics.failedCount, total);
  const worsenedRate = rate(analytics.worsenedCount, total);
  const policyDeniedRate = rate(analytics.policyDeniedCount, total);
  const manualReviewRate = rate(analytics.manualReviewCount, total);

  if (total >= 2 && successRate === 0) {
    warnings.push("Strategy has no historical successes.");
  }
  if (worsenedRate > 0) {
    warnings.push("Strategy has historically worsened validation at least once.");
  }
  if (policyDeniedRate > 0) {
    warnings.push("Strategy has been denied by patch policy historically.");
  }
  if (manualReviewRate > 0) {
    warnings.push("Strategy has required manual review historically.");
  }
  if (effectivenessScore < 0) {
    warnings.push("Strategy has a negative deterministic effectiveness score.");
  }

  return {
    ...analytics,
    effectivenessScore,
    successRate,
    failureRate,
    validationImprovementRate: rate(analytics.validationImprovedCount, total),
    worsenedRate,
    policyDeniedRate,
    manualReviewRate,
    warnings
  };
}

function normalizeStore(value: unknown): RepairAnalyticsStore {
  if (typeof value !== "object" || value === null) {
    return emptyStore();
  }

  const raw = value as { strategies?: unknown; updatedAt?: unknown };
  const strategies: Record<string, RepairStrategyAnalytics> = {};
  if (typeof raw.strategies === "object" && raw.strategies !== null) {
    for (const [strategy, analytics] of Object.entries(raw.strategies as Record<string, Partial<RepairStrategyAnalytics>>)) {
      strategies[strategy] = recalculate({
        ...emptyStrategy(strategy),
        ...analytics,
        strategy
      });
    }
  }

  return {
    version: "v2.3",
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : new Date(0).toISOString(),
    strategies
  };
}

export async function loadRepairAnalytics(projectRoot: string): Promise<RepairAnalyticsStore> {
  const analyticsPath = getRepairAnalyticsPath(projectRoot);
  if (!(await fs.pathExists(analyticsPath))) {
    return emptyStore();
  }

  try {
    return normalizeStore(await fs.readJson(analyticsPath));
  } catch {
    return emptyStore();
  }
}

async function saveRepairAnalytics(projectRoot: string, store: RepairAnalyticsStore): Promise<void> {
  const analyticsPath = getRepairAnalyticsPath(projectRoot);
  await fs.ensureDir(path.dirname(analyticsPath));
  await fs.writeJson(analyticsPath, store, { spaces: 2 });
}

function applyOutcome(analytics: RepairStrategyAnalytics, outcome: string): RepairStrategyAnalytics {
  const next = { ...analytics, totalAttempts: analytics.totalAttempts + 1 };
  if (outcome === "success") {
    next.successCount += 1;
  } else if (outcome === "validation-improved") {
    next.validationImprovedCount += 1;
  } else if (outcome === "failed-worse") {
    next.worsenedCount += 1;
  } else if (outcome === "policy-denied") {
    next.policyDeniedCount += 1;
  } else if (outcome === "manual-review-required") {
    next.manualReviewCount += 1;
  } else {
    next.failedCount += 1;
  }
  return recalculate(next);
}

export async function updateRepairAnalytics(params: {
  projectRoot: string;
  strategy: string;
  outcome: string;
}): Promise<RepairAnalyticsStore> {
  const strategy = params.strategy || "unknown";
  const store = await loadRepairAnalytics(params.projectRoot);
  const current = store.strategies[strategy] ?? emptyStrategy(strategy);
  const updated: RepairAnalyticsStore = {
    version: "v2.3",
    updatedAt: new Date().toISOString(),
    strategies: {
      ...store.strategies,
      [strategy]: applyOutcome(current, params.outcome)
    }
  };
  await saveRepairAnalytics(params.projectRoot, updated);
  return updated;
}

export async function getRepairStrategyAnalytics(params: {
  projectRoot: string;
  strategy: string;
}): Promise<RepairStrategyAnalytics | null> {
  const store = await loadRepairAnalytics(params.projectRoot);
  return store.strategies[params.strategy] ?? null;
}

export function buildRepairAnalyticsHint(params: {
  analytics: RepairStrategyAnalytics | null;
}): RepairAnalyticsHint {
  const analytics = params.analytics;
  if (!analytics) {
    return {
      strategy: null,
      effectivenessScore: null,
      historicalSuccessRate: null,
      historicalFailureRate: null,
      validationImprovementRate: null,
      worsenedRate: null,
      policyDeniedRate: null,
      manualReviewRate: null,
      warnings: ["No historical analytics are available for this strategy."],
      advisoryOnly: true
    };
  }

  return {
    strategy: analytics.strategy,
    effectivenessScore: analytics.effectivenessScore,
    historicalSuccessRate: analytics.successRate,
    historicalFailureRate: analytics.failureRate,
    validationImprovementRate: analytics.validationImprovementRate,
    worsenedRate: analytics.worsenedRate,
    policyDeniedRate: analytics.policyDeniedRate,
    manualReviewRate: analytics.manualReviewRate,
    warnings: analytics.warnings,
    advisoryOnly: true
  };
}
