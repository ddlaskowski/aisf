import path from "node:path";
import fs from "fs-extra";
import { getRunsIndexPath, loadRunsIndex, type RunIndexEntry, type RunsIndex } from "./runIndex.js";
import {
  getGovernancePolicyProfile,
  type GovernancePolicyProfile,
  type GovernancePolicyProfileName
} from "./governancePolicyProfile.js";

export type GovernanceInsightSeverity = "info" | "warning" | "critical";

export type GovernanceInsight = {
  severity: GovernanceInsightSeverity;
  code: string;
  message: string;
};

export type GovernanceInsights = {
  version: 1;
  policyProfile: {
    name: string;
    operatorMode: string;
    riskTolerance: string;
    thresholds: GovernancePolicyProfile["thresholds"];
  };
  totalRuns: number;
  summary: {
    ready: number;
    readyWithCaution: number;
    manualReviewRequired: number;
    blocked: number;
    validationPassed: number;
    validationFailed: number;
  };
  rates: {
    readyRate: number;
    cautionRate: number;
    humanReviewRate: number;
    blockedRate: number;
    validationSuccessRate: number;
  };
  trust: {
    averageTrustScore: number | null;
    minTrustScore: number | null;
    maxTrustScore: number | null;
    averageRecentTrustScore: number | null;
  };
  mostCommon: {
    governanceStatus?: string;
    repairOutcome?: string;
    releaseDecision?: string;
    trustLevel?: string;
  };
  trends: {
    recentRunCount: number;
    recentBlockedCount: number;
    recentHumanReviewCount: number;
    recentAverageTrustScore: number | null;
    trustTrend: "improving" | "stable" | "degrading" | "unknown";
  };
  insights: GovernanceInsight[];
  generatedAt: string;
};

export type GovernanceInsightsExportResult = {
  exported: boolean;
  files: string[];
  warnings: string[];
};

export type BuildGovernanceInsightsOptions = {
  profile?: GovernancePolicyProfile | GovernancePolicyProfileName;
};

const RECENT_WINDOW = 10;

function normalizeSlash(value: string): string {
  return value.split(path.sep).join("/");
}

function relativePath(projectRoot: string, filePath: string): string {
  return normalizeSlash(path.relative(projectRoot, filePath));
}

function roundPercent(numerator: number, denominator: number): number {
  if (denominator <= 0) {
    return 0;
  }
  return Number(((numerator / denominator) * 100).toFixed(2));
}

function roundAverage(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2));
}

function numericTrustScores(runs: RunIndexEntry[]): number[] {
  return runs
    .map((run) => run.trustScore)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
}

function sortOldestFirst(runs: RunIndexEntry[]): RunIndexEntry[] {
  return [...runs].sort((a, b) => a.timestamp.localeCompare(b.timestamp) || a.runId.localeCompare(b.runId));
}

function mostCommon(values: Array<string | undefined>): string | undefined {
  const counts = new Map<string, number>();
  for (const value of values) {
    if (!value) {
      continue;
    }
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return sorted[0]?.[0];
}

function resolveProfile(profile?: GovernancePolicyProfile | GovernancePolicyProfileName): GovernancePolicyProfile {
  return typeof profile === "object" && profile !== null ? profile : getGovernancePolicyProfile(profile);
}

function trustTrend(
  overallAverage: number | null,
  recentAverage: number | null,
  degradingTrustDelta: number
): GovernanceInsights["trends"]["trustTrend"] {
  if (overallAverage === null || recentAverage === null) {
    return "unknown";
  }
  if (recentAverage <= overallAverage - degradingTrustDelta) {
    return "degrading";
  }
  if (recentAverage >= overallAverage + degradingTrustDelta) {
    return "improving";
  }
  return "stable";
}

function buildInsightRules(input: {
  totalRuns: number;
  blockedRate: number;
  humanReviewRate: number;
  validationSuccessRate: number;
  knownValidationCount: number;
  averageTrustScore: number | null;
  recentAverageTrustScore: number | null;
  readyRate: number;
  trustTrend: GovernanceInsights["trends"]["trustTrend"];
  profile: GovernancePolicyProfile;
}): GovernanceInsight[] {
  const insights: GovernanceInsight[] = [];
  if (input.totalRuns === 0) {
    insights.push({
      severity: "info",
      code: "NO_RUNS",
      message: "No indexed repair runs are available."
    });
    return insights;
  }
  if (input.blockedRate > input.profile.thresholds.highBlockedRatePercent) {
    insights.push({
      severity: "critical",
      code: "HIGH_BLOCKED_RATE",
      message: "Blocked repair rate is above recommended threshold."
    });
  }
  if (input.humanReviewRate > input.profile.thresholds.highHumanReviewRatePercent) {
    insights.push({
      severity: "warning",
      code: "HIGH_HUMAN_REVIEW_RATE",
      message: "Human review rate is elevated."
    });
  }
  if (
    input.validationSuccessRate < input.profile.thresholds.lowValidationSuccessRatePercent &&
    input.knownValidationCount >= 3
  ) {
    insights.push({
      severity: "warning",
      code: "LOW_VALIDATION_SUCCESS_RATE",
      message: "Validation success rate is below recommended threshold."
    });
  }
  if (input.averageTrustScore !== null && input.averageTrustScore < input.profile.thresholds.lowAverageTrustScore) {
    insights.push({
      severity: "warning",
      code: "LOW_AVERAGE_TRUST",
      message: "Average trust score is below recommended threshold."
    });
  }
  if (input.trustTrend === "degrading") {
    insights.push({
      severity: "warning",
      code: "TRUST_TREND_DEGRADING",
      message: "Recent trust score trend is degrading."
    });
  }
  if (
    input.readyRate >= input.profile.thresholds.healthyReadyRatePercent &&
    input.blockedRate <= input.profile.thresholds.healthyMaxBlockedRatePercent
  ) {
    insights.push({
      severity: "info",
      code: "HEALTHY_GOVERNANCE_RATE",
      message: "Most repair runs are governed as ready or safe to proceed."
    });
  }
  return insights;
}

export function buildGovernanceInsights(
  index: RunsIndex,
  options: BuildGovernanceInsightsOptions = {}
): GovernanceInsights {
  const profile = resolveProfile(options.profile);
  const runs = Array.isArray(index.runs) ? index.runs : [];
  const totalRuns = runs.length;
  const ready = runs.filter((run) => run.governanceStatus === "ready").length;
  const readyWithCaution = runs.filter((run) => run.governanceStatus === "ready-with-caution").length;
  const manualReviewRequired = runs.filter((run) => run.governanceStatus === "manual-review-required").length;
  const blocked = runs.filter((run) => run.governanceStatus === "blocked").length;
  const validationPassed = runs.filter((run) => run.validationPassed === true).length;
  const validationFailed = runs.filter((run) => run.validationPassed === false).length;
  const knownValidationCount = validationPassed + validationFailed;
  const allTrustScores = numericTrustScores(runs);
  const recentRuns = sortOldestFirst(runs).slice(-RECENT_WINDOW);
  const recentTrustScores = numericTrustScores(recentRuns);
  const averageTrustScore = roundAverage(allTrustScores);
  const averageRecentTrustScore = roundAverage(recentTrustScores);
  const computedTrustTrend = trustTrend(
    averageTrustScore,
    averageRecentTrustScore,
    profile.thresholds.degradingTrustDelta
  );

  const readyRate = roundPercent(ready, totalRuns);
  const cautionRate = roundPercent(readyWithCaution, totalRuns);
  const humanReviewRate = roundPercent(manualReviewRequired, totalRuns);
  const blockedRate = roundPercent(blocked, totalRuns);
  const validationSuccessRate = roundPercent(validationPassed, knownValidationCount);

  return {
    version: 1,
    policyProfile: {
      name: profile.name,
      operatorMode: profile.labels.operatorMode,
      riskTolerance: profile.labels.riskTolerance,
      thresholds: profile.thresholds
    },
    totalRuns,
    summary: {
      ready,
      readyWithCaution,
      manualReviewRequired,
      blocked,
      validationPassed,
      validationFailed
    },
    rates: {
      readyRate,
      cautionRate,
      humanReviewRate,
      blockedRate,
      validationSuccessRate
    },
    trust: {
      averageTrustScore,
      minTrustScore: allTrustScores.length ? Math.min(...allTrustScores) : null,
      maxTrustScore: allTrustScores.length ? Math.max(...allTrustScores) : null,
      averageRecentTrustScore
    },
    mostCommon: {
      governanceStatus: mostCommon(runs.map((run) => run.governanceStatus)),
      repairOutcome: mostCommon(runs.map((run) => run.repairOutcome)),
      releaseDecision: mostCommon(runs.map((run) => run.releaseDecision)),
      trustLevel: mostCommon(runs.map((run) => run.trustLevel))
    },
    trends: {
      recentRunCount: recentRuns.length,
      recentBlockedCount: recentRuns.filter((run) => run.governanceStatus === "blocked").length,
      recentHumanReviewCount: recentRuns.filter((run) => run.governanceStatus === "manual-review-required").length,
      recentAverageTrustScore: averageRecentTrustScore,
      trustTrend: computedTrustTrend
    },
    insights: buildInsightRules({
      totalRuns,
      blockedRate,
      humanReviewRate,
      validationSuccessRate,
      knownValidationCount,
      averageTrustScore,
      recentAverageTrustScore: averageRecentTrustScore,
      readyRate,
      trustTrend: computedTrustTrend,
      profile
    }),
    generatedAt: index.updatedAt || new Date(0).toISOString()
  };
}

function formatValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") {
    return "none";
  }
  return String(value);
}

function formatPercent(value: number): string {
  return `${Number.isInteger(value) ? String(value) : value.toFixed(2)}%`;
}

export function renderGovernanceInsightsMarkdown(insights: GovernanceInsights): string {
  const lines = [
    "# AI Software Factory — Governance Insights",
    "",
    `Policy profile: ${insights.policyProfile.name}`,
    `Operator mode: ${insights.policyProfile.operatorMode}`,
    `Risk tolerance: ${insights.policyProfile.riskTolerance}`,
    "",
    `Total runs: ${insights.totalRuns}`,
    "",
    "## Summary",
    "",
    `- ready: ${insights.summary.ready}`,
    `- ready-with-caution: ${insights.summary.readyWithCaution}`,
    `- manual-review-required: ${insights.summary.manualReviewRequired}`,
    `- blocked: ${insights.summary.blocked}`,
    `- validation passed: ${insights.summary.validationPassed}`,
    `- validation failed: ${insights.summary.validationFailed}`,
    "",
    "## Rates",
    "",
    `- ready rate: ${formatPercent(insights.rates.readyRate)}`,
    `- caution rate: ${formatPercent(insights.rates.cautionRate)}`,
    `- human review rate: ${formatPercent(insights.rates.humanReviewRate)}`,
    `- blocked rate: ${formatPercent(insights.rates.blockedRate)}`,
    `- validation success rate: ${formatPercent(insights.rates.validationSuccessRate)}`,
    "",
    "## Trust",
    "",
    `- average trust score: ${formatValue(insights.trust.averageTrustScore)}`,
    `- min trust score: ${formatValue(insights.trust.minTrustScore)}`,
    `- max trust score: ${formatValue(insights.trust.maxTrustScore)}`,
    `- recent average trust score: ${formatValue(insights.trust.averageRecentTrustScore)}`,
    `- trust trend: ${insights.trends.trustTrend}`,
    "",
    "## Most Common",
    "",
    `- governance status: ${formatValue(insights.mostCommon.governanceStatus)}`,
    `- repair outcome: ${formatValue(insights.mostCommon.repairOutcome)}`,
    `- release decision: ${formatValue(insights.mostCommon.releaseDecision)}`,
    `- trust level: ${formatValue(insights.mostCommon.trustLevel)}`,
    "",
    "## Insights",
    ""
  ];

  if (insights.insights.length === 0) {
    lines.push("- none");
  } else {
    for (const insight of insights.insights) {
      lines.push(`- [${insight.severity}] ${insight.code} — ${insight.message}`);
    }
  }

  return `${lines.join("\n")}\n`;
}

export function exportGovernanceInsights(
  projectRoot: string,
  insights: GovernanceInsights
): GovernanceInsightsExportResult {
  const outputDir = path.join(projectRoot, ".factory", "exports");
  fs.ensureDirSync(outputDir);
  const jsonPath = path.join(outputDir, "governance-insights.json");
  const markdownPath = path.join(outputDir, "governance-insights.md");
  fs.writeFileSync(jsonPath, `${JSON.stringify(insights, null, 2)}\n`, "utf8");
  fs.writeFileSync(markdownPath, renderGovernanceInsightsMarkdown(insights), "utf8");
  return {
    exported: true,
    files: [relativePath(projectRoot, jsonPath), relativePath(projectRoot, markdownPath)],
    warnings: []
  };
}

export function loadGovernanceInsights(
  projectRoot: string,
  options: BuildGovernanceInsightsOptions = {}
): GovernanceInsights {
  const indexPath = getRunsIndexPath(projectRoot);
  if (!fs.pathExistsSync(indexPath)) {
    return buildGovernanceInsights({
      version: 1,
      updatedAt: new Date(0).toISOString(),
      totalRuns: 0,
      runs: []
    }, options);
  }
  return buildGovernanceInsights(loadRunsIndex(projectRoot), options);
}
