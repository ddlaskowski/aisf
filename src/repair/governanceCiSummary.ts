import path from "node:path";
import fs from "fs-extra";
import type { GovernanceInsight, GovernanceInsights } from "./governanceInsights.js";

export type GovernanceCiStatus = "pass" | "warn" | "fail";

export type GovernanceCiSummary = {
  version: 1;
  status: GovernanceCiStatus;
  summary: string;
  evaluatedProfile: {
    name: string;
    operatorMode: string;
    riskTolerance: string;
  };
  metrics: {
    totalRuns: number;
    readyRate: number;
    blockedRate: number;
    humanReviewRate: number;
    validationSuccessRate: number;
    averageTrustScore: number | null;
  };
  insightCounts: {
    info: number;
    warning: number;
    critical: number;
  };
  triggeringInsights: Array<{
    severity: string;
    code: string;
    message: string;
  }>;
  recommendations: string[];
  generatedAt: string;
};

export type GovernanceCiSummaryExportResult = {
  exported: boolean;
  files: string[];
  warnings: string[];
};

function normalizeSlash(value: string): string {
  return value.split(path.sep).join("/");
}

function relativePath(projectRoot: string, filePath: string): string {
  return normalizeSlash(path.relative(projectRoot, filePath));
}

function countInsights(insights: GovernanceInsight[]): GovernanceCiSummary["insightCounts"] {
  return {
    info: insights.filter((insight) => insight.severity === "info").length,
    warning: insights.filter((insight) => insight.severity === "warning").length,
    critical: insights.filter((insight) => insight.severity === "critical").length
  };
}

function summaryForStatus(status: GovernanceCiStatus): string {
  if (status === "fail") {
    return "Governance health exceeds acceptable operational risk thresholds.";
  }
  if (status === "warn") {
    return "Governance health contains warnings or elevated operational risks.";
  }
  return "Governance health is within acceptable thresholds.";
}

function recommendationsForStatus(status: GovernanceCiStatus, insights: GovernanceInsights): string[] {
  const recommendations: string[] = [];
  if (status === "fail") {
    recommendations.push("Investigate critical governance insights before release.");
    recommendations.push("Review blocked and validation-failure trends.");
  } else if (status === "warn") {
    recommendations.push("Monitor governance trends closely.");
    recommendations.push("Review warning-level governance insights.");
    if (insights.insights.some((insight) => insight.code === "NO_RUNS")) {
      recommendations.push("Run a repair task first to generate governance history.");
    }
  } else {
    recommendations.push("No immediate governance action required.");
  }

  if (insights.trends.trustTrend === "degrading") {
    recommendations.push("Inspect recent repair trust degradation.");
  }
  if (
    insights.rates.humanReviewRate >= insights.policyProfile.thresholds.highHumanReviewRatePercent ||
    insights.insights.some((insight) => insight.code === "HIGH_HUMAN_REVIEW_RATE")
  ) {
    recommendations.push("Review recurring manual-review-required runs.");
  }

  return [...new Set(recommendations)];
}

export function buildGovernanceCiSummary(insights: GovernanceInsights): GovernanceCiSummary {
  const insightCounts = countInsights(insights.insights);
  const hasNoRuns = insights.insights.some((insight) => insight.code === "NO_RUNS");
  const hardFail =
    !hasNoRuns &&
    (insightCounts.critical > 0 ||
      insights.rates.blockedRate >= insights.policyProfile.thresholds.highBlockedRatePercent ||
      insights.rates.validationSuccessRate < insights.policyProfile.thresholds.lowValidationSuccessRatePercent - 15 ||
      (insights.trust.averageTrustScore !== null &&
        insights.trust.averageTrustScore < insights.policyProfile.thresholds.lowAverageTrustScore - 15));
  const shouldWarn =
    insightCounts.warning > 0 ||
    insights.rates.humanReviewRate >= insights.policyProfile.thresholds.highHumanReviewRatePercent ||
    insights.trends.trustTrend === "degrading" ||
    hasNoRuns;
  const status: GovernanceCiStatus = hardFail ? "fail" : shouldWarn ? "warn" : "pass";

  return {
    version: 1,
    status,
    summary: summaryForStatus(status),
    evaluatedProfile: {
      name: insights.policyProfile.name,
      operatorMode: insights.policyProfile.operatorMode,
      riskTolerance: insights.policyProfile.riskTolerance
    },
    metrics: {
      totalRuns: insights.totalRuns,
      readyRate: insights.rates.readyRate,
      blockedRate: insights.rates.blockedRate,
      humanReviewRate: insights.rates.humanReviewRate,
      validationSuccessRate: insights.rates.validationSuccessRate,
      averageTrustScore: insights.trust.averageTrustScore
    },
    insightCounts,
    triggeringInsights: insights.insights
      .filter((insight) => insight.severity === "warning" || insight.severity === "critical" || insight.code === "NO_RUNS")
      .map((insight) => ({
        severity: insight.severity,
        code: insight.code,
        message: insight.message
      })),
    recommendations: recommendationsForStatus(status, insights),
    generatedAt: insights.generatedAt
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

export function renderGovernanceCiSummaryMarkdown(summary: GovernanceCiSummary): string {
  const lines = [
    "# AI Software Factory — Governance CI Summary",
    "",
    `Status: ${summary.status}`,
    "",
    "Summary:",
    summary.summary,
    "",
    "Policy profile:",
    `- ${summary.evaluatedProfile.name}`,
    `- ${summary.evaluatedProfile.riskTolerance} risk tolerance`,
    "",
    "## Metrics",
    "",
    `- total runs: ${summary.metrics.totalRuns}`,
    `- ready rate: ${formatPercent(summary.metrics.readyRate)}`,
    `- blocked rate: ${formatPercent(summary.metrics.blockedRate)}`,
    `- human review rate: ${formatPercent(summary.metrics.humanReviewRate)}`,
    `- validation success rate: ${formatPercent(summary.metrics.validationSuccessRate)}`,
    `- average trust score: ${formatValue(summary.metrics.averageTrustScore)}`,
    "",
    "## Insight Counts",
    "",
    `- info: ${summary.insightCounts.info}`,
    `- warning: ${summary.insightCounts.warning}`,
    `- critical: ${summary.insightCounts.critical}`,
    "",
    "## Triggering Insights",
    ""
  ];

  if (summary.triggeringInsights.length === 0) {
    lines.push("- none");
  } else {
    for (const insight of summary.triggeringInsights) {
      lines.push(`- [${insight.severity}] ${insight.code} — ${insight.message}`);
    }
  }

  lines.push("", "## Recommendations", "");
  for (const recommendation of summary.recommendations) {
    lines.push(`- ${recommendation}`);
  }

  return `${lines.join("\n")}\n`;
}

export function exportGovernanceCiSummary(
  projectRoot: string,
  summary: GovernanceCiSummary
): GovernanceCiSummaryExportResult {
  const outputDir = path.join(projectRoot, ".factory", "exports");
  fs.ensureDirSync(outputDir);
  const jsonPath = path.join(outputDir, "governance-ci-summary.json");
  const markdownPath = path.join(outputDir, "governance-ci-summary.md");
  fs.writeFileSync(jsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  fs.writeFileSync(markdownPath, renderGovernanceCiSummaryMarkdown(summary), "utf8");
  return {
    exported: true,
    files: [relativePath(projectRoot, jsonPath), relativePath(projectRoot, markdownPath)],
    warnings: []
  };
}
