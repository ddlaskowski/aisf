import type { GovernanceDriftDetection } from "./governanceDriftDetection.js";
import type { GovernanceTrendAnalysis } from "./governanceTrendAnalysis.js";

export type GovernanceStabilityLevel = "stable" | "caution" | "unstable" | "critical";

export type GovernanceStabilityScore = {
  version: 1;
  score: number;
  level: GovernanceStabilityLevel;
  summary: string;
  contributingFactors: Array<{
    category: string;
    impact: "positive" | "negative" | "neutral";
    reason: string;
    delta: number;
  }>;
  metrics: {
    trendHealth?: string;
    driftSeverity?: string;
    governanceVolatilityScore?: number | null;
    trustVolatilityScore?: number | null;
    validationVolatilityScore?: number | null;
    blockedRate?: number | null;
    validationSuccessRate?: number | null;
    averageTrustScore?: number | null;
    readyRate?: number | null;
  };
  anomalies: Array<{
    severity: "info" | "warning" | "critical";
    code: string;
    message: string;
  }>;
  generatedAt: string;
};

const UNKNOWN_GENERATED_AT = "1970-01-01T00:00:00.000Z";

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, score));
}

function levelForScore(score: number): GovernanceStabilityLevel {
  if (score >= 85) return "stable";
  if (score >= 70) return "caution";
  if (score >= 40) return "unstable";
  return "critical";
}

function summaryFor(level: GovernanceStabilityLevel, noHistory: boolean): string {
  if (noHistory) return "No governance history is available. Stability assumed.";
  if (level === "stable") return "Governance operations appear stable and within acceptable ranges.";
  if (level === "caution") return "Governance operations show moderate instability or elevated risk.";
  if (level === "unstable") return "Governance operations show significant instability.";
  return "Governance operations are critically unstable.";
}

function latestGeneratedAt(trend?: GovernanceTrendAnalysis, drift?: GovernanceDriftDetection): string {
  return drift?.generatedAt ?? trend?.generatedAt ?? UNKNOWN_GENERATED_AT;
}

function hasNoHistory(trend?: GovernanceTrendAnalysis, drift?: GovernanceDriftDetection): boolean {
  return (
    (trend === undefined || trend.analyzedSnapshots === 0 || trend.insights.some((insight) => insight.code === "NO_ARCHIVE_HISTORY")) &&
    (drift === undefined || drift.analyzedSnapshots === 0 || drift.anomalies.some((anomaly) => anomaly.code === "NO_ARCHIVE_HISTORY"))
  );
}

function addFactor(
  factors: GovernanceStabilityScore["contributingFactors"],
  category: string,
  impact: "positive" | "negative" | "neutral",
  reason: string,
  delta: number
): void {
  factors.push({ category, impact, reason, delta });
}

function metricCurrent(drift: GovernanceDriftDetection | undefined, metricName: keyof GovernanceDriftDetection["metrics"]): number | null {
  return drift?.metrics[metricName]?.currentValue ?? null;
}

function combinedAnomalies(
  trend: GovernanceTrendAnalysis | undefined,
  drift: GovernanceDriftDetection | undefined
): GovernanceStabilityScore["anomalies"] {
  const anomalies: GovernanceStabilityScore["anomalies"] = [];
  for (const insight of trend?.insights ?? []) {
    anomalies.push(insight);
  }
  for (const anomaly of drift?.anomalies ?? []) {
    anomalies.push(anomaly);
  }
  return anomalies;
}

function trendPenalty(trendHealth: string | undefined): number {
  if (trendHealth === "critical") return -35;
  if (trendHealth === "warning") return -20;
  if (trendHealth === "unknown") return -10;
  return 0;
}

function driftPenalty(driftSeverity: string | undefined): number {
  if (driftSeverity === "critical") return -35;
  if (driftSeverity === "high") return -25;
  if (driftSeverity === "medium") return -15;
  if (driftSeverity === "low") return -5;
  return 0;
}

function trendReason(trendHealth: string | undefined): string {
  if (trendHealth === "critical") return "Governance trend health is critical.";
  if (trendHealth === "warning") return "Governance trend health reported warnings.";
  if (trendHealth === "unknown") return "Governance trend health is unknown.";
  return "Governance trends remained stable.";
}

function driftReason(driftSeverity: string | undefined): string {
  if (driftSeverity === "critical") return "Critical governance drift was detected.";
  if (driftSeverity === "high") return "Significant governance drift was detected.";
  if (driftSeverity === "medium") return "Moderate governance drift was detected.";
  if (driftSeverity === "low") return "Minor governance drift was detected.";
  return "Governance drift remained within baseline.";
}

function formatValue(value: number | null | undefined): string {
  if (value === null || value === undefined) return "unknown";
  return String(value);
}

export function buildGovernanceStabilityScore(input: {
  trend?: GovernanceTrendAnalysis;
  drift?: GovernanceDriftDetection;
  generatedAt?: string;
}): GovernanceStabilityScore {
  const trend = input.trend;
  const drift = input.drift;
  const noHistory = hasNoHistory(trend, drift);
  const anomalies = noHistory
    ? [{ severity: "info" as const, code: "NO_ARCHIVE_HISTORY", message: "No governance archive history is available." }]
    : combinedAnomalies(trend, drift);

  const metrics: GovernanceStabilityScore["metrics"] = {
    trendHealth: trend?.trendHealth,
    driftSeverity: drift?.overallSeverity,
    governanceVolatilityScore: trend?.volatility.governanceVolatilityScore ?? null,
    trustVolatilityScore: trend?.volatility.trustVolatilityScore ?? null,
    validationVolatilityScore: trend?.volatility.validationVolatilityScore ?? null,
    blockedRate: metricCurrent(drift, "blockedRate"),
    validationSuccessRate: metricCurrent(drift, "validationSuccessRate"),
    averageTrustScore: metricCurrent(drift, "averageTrustScore"),
    readyRate: metricCurrent(drift, "readyRate")
  };

  const factors: GovernanceStabilityScore["contributingFactors"] = [];
  let score = 100;

  if (!noHistory) {
    const trendDelta = trendPenalty(metrics.trendHealth);
    score += trendDelta;
    addFactor(factors, "trend-analysis", trendDelta < 0 ? "negative" : "positive", trendReason(metrics.trendHealth), trendDelta);

    const driftDelta = driftPenalty(metrics.driftSeverity);
    score += driftDelta;
    addFactor(factors, "drift-detection", driftDelta < 0 ? "negative" : "positive", driftReason(metrics.driftSeverity), driftDelta);

    const volatilityChecks: Array<[keyof GovernanceStabilityScore["metrics"], string]> = [
      ["governanceVolatilityScore", "Governance volatility exceeded healthy threshold."],
      ["trustVolatilityScore", "Trust volatility exceeded healthy threshold."],
      ["validationVolatilityScore", "Validation volatility exceeded healthy threshold."]
    ];
    for (const [metricName, reason] of volatilityChecks) {
      if (typeof metrics[metricName] === "number" && metrics[metricName] > 15) {
        score -= 10;
        addFactor(factors, "volatility", "negative", reason, -10);
      }
    }

    if (typeof metrics.blockedRate === "number" && metrics.blockedRate > 25) {
      score -= 15;
      addFactor(factors, "metric-health", "negative", "Blocked governance rate exceeded healthy threshold.", -15);
    }
    if (typeof metrics.validationSuccessRate === "number" && metrics.validationSuccessRate < 80) {
      score -= 15;
      addFactor(factors, "metric-health", "negative", "Validation success rate fell below healthy threshold.", -15);
    }
    if (typeof metrics.averageTrustScore === "number" && metrics.averageTrustScore < 65) {
      score -= 15;
      addFactor(factors, "metric-health", "negative", "Average trust score fell below healthy threshold.", -15);
    }
    if (typeof metrics.readyRate === "number" && metrics.readyRate < 70) {
      score -= 10;
      addFactor(factors, "metric-health", "negative", "Ready governance rate fell below healthy threshold.", -10);
    }

    for (const anomaly of anomalies) {
      if (anomaly.severity === "critical") {
        score -= 10;
        addFactor(factors, "anomaly", "negative", `${anomaly.code} detected.`, -10);
      }
      if (anomaly.severity === "warning") {
        score -= 3;
        addFactor(factors, "anomaly", "negative", `${anomaly.code} detected.`, -3);
      }
    }
  } else {
    addFactor(factors, "history", "neutral", "No governance history is available. Stability assumed.", 0);
  }

  const finalScore = clampScore(score);
  const level = levelForScore(finalScore);

  return {
    version: 1,
    score: finalScore,
    level,
    summary: summaryFor(level, noHistory),
    contributingFactors: factors,
    metrics,
    anomalies,
    generatedAt: input.generatedAt ?? latestGeneratedAt(trend, drift)
  };
}

export function renderGovernanceStabilityScoreMarkdown(stability: GovernanceStabilityScore): string {
  const lines = [
    "# AI Software Factory - Governance Stability Score",
    "",
    "Score:",
    String(stability.score),
    "",
    "Level:",
    stability.level,
    "",
    "Summary:",
    stability.summary,
    "",
    "## Metrics",
    "",
    `* trend health: ${stability.metrics.trendHealth ?? "unknown"}`,
    `* drift severity: ${stability.metrics.driftSeverity ?? "unknown"}`,
    `* governance volatility: ${formatValue(stability.metrics.governanceVolatilityScore)}`,
    `* trust volatility: ${formatValue(stability.metrics.trustVolatilityScore)}`,
    `* validation volatility: ${formatValue(stability.metrics.validationVolatilityScore)}`,
    `* blocked rate: ${formatValue(stability.metrics.blockedRate)}`,
    `* validation success rate: ${formatValue(stability.metrics.validationSuccessRate)}`,
    `* average trust score: ${formatValue(stability.metrics.averageTrustScore)}`,
    `* ready rate: ${formatValue(stability.metrics.readyRate)}`,
    "",
    "## Contributing Factors",
    ""
  ];

  if (stability.contributingFactors.length === 0) {
    lines.push("* none");
  } else {
    for (const factor of stability.contributingFactors) {
      lines.push(`* [${factor.delta}] ${factor.category} - ${factor.reason}`);
    }
  }

  lines.push("", "## Anomalies", "");
  if (stability.anomalies.length === 0) {
    lines.push("* none");
  } else {
    for (const anomaly of stability.anomalies) {
      lines.push(`* [${anomaly.severity}] ${anomaly.code} - ${anomaly.message}`);
    }
  }

  return `${lines.join("\n")}\n`;
}

export function renderGovernanceStabilityScoreText(stability: GovernanceStabilityScore): string {
  return renderGovernanceStabilityScoreMarkdown(stability);
}
