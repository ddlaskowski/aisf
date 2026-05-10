import path from "node:path";
import fs from "fs-extra";
import type { RepairReview, RepairReviewVerdict } from "./repairReview.js";

export type RepairReviewScoreAverages = {
  qualityScore: number;
  safetyScore: number;
  completenessScore: number;
};

export type RepairReviewAnalyticsRecentReview = {
  verdict: RepairReviewVerdict;
  qualityScore: number;
  safetyScore: number;
  completenessScore: number;
  outcome?: string;
  strategy?: string;
};

export type RepairReviewAnalytics = {
  version: 1;
  totalReviews: number;
  verdictCounts: Record<RepairReviewVerdict, number>;
  averageScores: RepairReviewScoreAverages;
  warningCounts: Record<string, number>;
  recommendationCounts: Record<string, number>;
  blockingConcernCounts: Record<string, number>;
  outcomeVerdictCounts: Record<string, Record<RepairReviewVerdict, number>>;
  strategyVerdictCounts: Record<string, Record<RepairReviewVerdict, number>>;
  trends: {
    recentReviewCount: number;
    recentAverageQualityScore: number;
    recentAverageSafetyScore: number;
    recentAverageCompletenessScore: number;
    recentNeedsHumanReviewCount: number;
    recentRejectedCount: number;
  };
  warnings: string[];
  recentReviews: RepairReviewAnalyticsRecentReview[];
};

export type UpdateRepairReviewAnalyticsInput = {
  projectRoot: string;
  repairReview: RepairReview;
  outcome?: string;
  strategy?: string;
  regressionRisk?: string;
  patchPolicyMode?: string;
};

const VERDICTS: RepairReviewVerdict[] = [
  "approved",
  "approved-with-warnings",
  "needs-human-review",
  "rejected"
];

const RECENT_REVIEW_LIMIT = 10;
const HIGH_HUMAN_REVIEW_RATE = 0.3;
const HIGH_REJECTED_RATE = 0.2;
const LOW_AVERAGE_SAFETY_SCORE = 70;
const RECENT_SAFETY_DEGRADING_DELTA = 15;
const RECURRING_WARNING_THRESHOLD = 3;

export function getRepairReviewAnalyticsPath(projectRoot: string): string {
  return path.join(projectRoot, ".factory", "analytics", "repair-review-analytics.json");
}

function emptyVerdictCounts(): Record<RepairReviewVerdict, number> {
  return {
    approved: 0,
    "approved-with-warnings": 0,
    "needs-human-review": 0,
    rejected: 0
  };
}

function emptyAnalytics(): RepairReviewAnalytics {
  return {
    version: 1,
    totalReviews: 0,
    verdictCounts: emptyVerdictCounts(),
    averageScores: {
      qualityScore: 0,
      safetyScore: 0,
      completenessScore: 0
    },
    warningCounts: {},
    recommendationCounts: {},
    blockingConcernCounts: {},
    outcomeVerdictCounts: {},
    strategyVerdictCounts: {},
    trends: {
      recentReviewCount: 0,
      recentAverageQualityScore: 0,
      recentAverageSafetyScore: 0,
      recentAverageCompletenessScore: 0,
      recentNeedsHumanReviewCount: 0,
      recentRejectedCount: 0
    },
    warnings: [],
    recentReviews: []
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function normalizeVerdict(value: unknown): RepairReviewVerdict {
  return typeof value === "string" && VERDICTS.includes(value as RepairReviewVerdict)
    ? (value as RepairReviewVerdict)
    : "rejected";
}

function normalizeCountMap(value: unknown): Record<string, number> {
  const counts: Record<string, number> = {};
  if (!isRecord(value)) {
    return counts;
  }
  for (const [key, count] of Object.entries(value)) {
    counts[key] = Math.max(0, Math.trunc(readNumber(count)));
  }
  return counts;
}

function normalizeVerdictCountMap(value: unknown): Record<RepairReviewVerdict, number> {
  const base = emptyVerdictCounts();
  if (!isRecord(value)) {
    return base;
  }
  for (const verdict of VERDICTS) {
    base[verdict] = Math.max(0, Math.trunc(readNumber(value[verdict])));
  }
  return base;
}

function normalizeNestedVerdictCounts(value: unknown): Record<string, Record<RepairReviewVerdict, number>> {
  const normalized: Record<string, Record<RepairReviewVerdict, number>> = {};
  if (!isRecord(value)) {
    return normalized;
  }
  for (const [key, counts] of Object.entries(value)) {
    normalized[key] = normalizeVerdictCountMap(counts);
  }
  return normalized;
}

function normalizeRecentReviews(value: unknown): RepairReviewAnalyticsRecentReview[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter(isRecord)
    .map((review) => ({
      verdict: normalizeVerdict(review.verdict),
      qualityScore: readNumber(review.qualityScore),
      safetyScore: readNumber(review.safetyScore),
      completenessScore: readNumber(review.completenessScore),
      outcome: typeof review.outcome === "string" ? review.outcome : undefined,
      strategy: typeof review.strategy === "string" ? review.strategy : undefined
    }))
    .slice(-RECENT_REVIEW_LIMIT);
}

function round(value: number): number {
  return Number(value.toFixed(2));
}

function average(values: number[]): number {
  return values.length ? round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
}

function calculateTrends(recentReviews: RepairReviewAnalyticsRecentReview[]): RepairReviewAnalytics["trends"] {
  return {
    recentReviewCount: recentReviews.length,
    recentAverageQualityScore: average(recentReviews.map((review) => review.qualityScore)),
    recentAverageSafetyScore: average(recentReviews.map((review) => review.safetyScore)),
    recentAverageCompletenessScore: average(recentReviews.map((review) => review.completenessScore)),
    recentNeedsHumanReviewCount: recentReviews.filter((review) => review.verdict === "needs-human-review").length,
    recentRejectedCount: recentReviews.filter((review) => review.verdict === "rejected").length
  };
}

function generateWarnings(analytics: RepairReviewAnalytics): string[] {
  const warnings: string[] = [];
  const total = analytics.totalReviews;
  const humanReviewRate = total > 0 ? analytics.verdictCounts["needs-human-review"] / total : 0;
  const rejectedRate = total > 0 ? analytics.verdictCounts.rejected / total : 0;

  if (humanReviewRate > HIGH_HUMAN_REVIEW_RATE) {
    warnings.push("High human-review rate detected");
  }
  if (rejectedRate > HIGH_REJECTED_RATE) {
    warnings.push("High rejected-review rate detected");
  }
  if (analytics.averageScores.safetyScore > 0 && analytics.averageScores.safetyScore < LOW_AVERAGE_SAFETY_SCORE) {
    warnings.push("Average safety score is below recommended threshold");
  }
  if (
    analytics.trends.recentReviewCount > 0 &&
    analytics.averageScores.safetyScore - analytics.trends.recentAverageSafetyScore >= RECENT_SAFETY_DEGRADING_DELTA
  ) {
    warnings.push("Recent safety score trend is degrading");
  }
  for (const [warning, count] of Object.entries(analytics.warningCounts).sort(([a], [b]) => a.localeCompare(b))) {
    if (count >= RECURRING_WARNING_THRESHOLD) {
      warnings.push(`Recurring repair review warning detected: ${warning}`);
    }
  }

  return warnings;
}

function normalizeAnalytics(value: unknown): RepairReviewAnalytics {
  const base = emptyAnalytics();
  if (!isRecord(value)) {
    return base;
  }

  const recentReviews = normalizeRecentReviews(value.recentReviews);
  const analytics: RepairReviewAnalytics = {
    version: 1,
    totalReviews: Math.max(0, Math.trunc(readNumber(value.totalReviews))),
    verdictCounts: normalizeVerdictCountMap(value.verdictCounts),
    averageScores: {
      qualityScore: round(readNumber(isRecord(value.averageScores) ? value.averageScores.qualityScore : undefined)),
      safetyScore: round(readNumber(isRecord(value.averageScores) ? value.averageScores.safetyScore : undefined)),
      completenessScore: round(readNumber(isRecord(value.averageScores) ? value.averageScores.completenessScore : undefined))
    },
    warningCounts: normalizeCountMap(value.warningCounts),
    recommendationCounts: normalizeCountMap(value.recommendationCounts),
    blockingConcernCounts: normalizeCountMap(value.blockingConcernCounts),
    outcomeVerdictCounts: normalizeNestedVerdictCounts(value.outcomeVerdictCounts),
    strategyVerdictCounts: normalizeNestedVerdictCounts(value.strategyVerdictCounts),
    trends: calculateTrends(recentReviews),
    warnings: [],
    recentReviews
  };

  analytics.warnings = generateWarnings(analytics);
  return analytics;
}

function incrementCount(counts: Record<string, number>, key: string): void {
  counts[key] = (counts[key] ?? 0) + 1;
}

function incrementNestedVerdict(
  counts: Record<string, Record<RepairReviewVerdict, number>>,
  key: string,
  verdict: RepairReviewVerdict
): void {
  counts[key] = counts[key] ?? emptyVerdictCounts();
  counts[key][verdict] += 1;
}

function nextAverage(previousAverage: number, previousTotal: number, value: number): number {
  return round((previousAverage * previousTotal + value) / (previousTotal + 1));
}

export function loadRepairReviewAnalytics(projectRoot: string): RepairReviewAnalytics {
  const analyticsPath = getRepairReviewAnalyticsPath(projectRoot);
  if (!fs.pathExistsSync(analyticsPath)) {
    return emptyAnalytics();
  }

  try {
    return normalizeAnalytics(fs.readJsonSync(analyticsPath));
  } catch {
    return emptyAnalytics();
  }
}

export function saveRepairReviewAnalytics(projectRoot: string, analytics: RepairReviewAnalytics): void {
  const analyticsPath = getRepairReviewAnalyticsPath(projectRoot);
  fs.ensureDirSync(path.dirname(analyticsPath));
  fs.writeJsonSync(analyticsPath, analytics, { spaces: 2 });
}

export function updateRepairReviewAnalytics(input: UpdateRepairReviewAnalyticsInput): RepairReviewAnalytics {
  const current = loadRepairReviewAnalytics(input.projectRoot);
  const verdict = input.repairReview.verdict;
  const previousTotal = current.totalReviews;
  const outcome = input.outcome || "unknown";
  const strategy = input.strategy || "unknown";

  const next: RepairReviewAnalytics = {
    ...current,
    totalReviews: previousTotal + 1,
    verdictCounts: {
      ...current.verdictCounts,
      [verdict]: current.verdictCounts[verdict] + 1
    },
    averageScores: {
      qualityScore: nextAverage(current.averageScores.qualityScore, previousTotal, input.repairReview.qualityScore),
      safetyScore: nextAverage(current.averageScores.safetyScore, previousTotal, input.repairReview.safetyScore),
      completenessScore: nextAverage(
        current.averageScores.completenessScore,
        previousTotal,
        input.repairReview.completenessScore
      )
    },
    warningCounts: { ...current.warningCounts },
    recommendationCounts: { ...current.recommendationCounts },
    blockingConcernCounts: { ...current.blockingConcernCounts },
    outcomeVerdictCounts: { ...current.outcomeVerdictCounts },
    strategyVerdictCounts: { ...current.strategyVerdictCounts },
    recentReviews: [
      ...current.recentReviews,
      {
        verdict,
        qualityScore: input.repairReview.qualityScore,
        safetyScore: input.repairReview.safetyScore,
        completenessScore: input.repairReview.completenessScore,
        outcome,
        strategy
      }
    ].slice(-RECENT_REVIEW_LIMIT),
    warnings: []
  };

  for (const warning of input.repairReview.warnings) {
    incrementCount(next.warningCounts, warning);
  }
  for (const recommendation of input.repairReview.recommendations) {
    incrementCount(next.recommendationCounts, recommendation);
  }
  for (const concern of input.repairReview.blockingConcerns) {
    incrementCount(next.blockingConcernCounts, concern);
  }
  incrementNestedVerdict(next.outcomeVerdictCounts, outcome, verdict);
  incrementNestedVerdict(next.strategyVerdictCounts, strategy, verdict);

  next.trends = calculateTrends(next.recentReviews);
  next.warnings = generateWarnings(next);

  saveRepairReviewAnalytics(input.projectRoot, next);
  return next;
}

