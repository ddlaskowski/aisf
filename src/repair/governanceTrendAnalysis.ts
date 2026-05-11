import path from "node:path";
import fs from "fs-extra";
import type { GovernanceArchiveIndex, GovernanceArchiveIndexEntry } from "./governanceArchiveIndex.js";

export type GovernanceTrendDirection = "up" | "down" | "stable" | "unknown";
export type GovernanceTrendHealth = "healthy" | "warning" | "critical" | "unknown";

export type GovernanceTrendMetric = {
  direction: GovernanceTrendDirection;
  firstValue: number | null;
  lastValue: number | null;
  absoluteDelta: number | null;
  averageValue: number | null;
  sampleCount: number;
};

export type GovernanceTrendAnalysis = {
  version: 1;
  analyzedKind: string;
  windowSize: number;
  totalSnapshots: number;
  analyzedSnapshots: number;
  trendHealth: GovernanceTrendHealth;
  metrics: {
    blockedRate?: GovernanceTrendMetric;
    humanReviewRate?: GovernanceTrendMetric;
    validationSuccessRate?: GovernanceTrendMetric;
    averageTrustScore?: GovernanceTrendMetric;
    readyRate?: GovernanceTrendMetric;
  };
  volatility: {
    governanceVolatilityScore: number | null;
    trustVolatilityScore: number | null;
    validationVolatilityScore: number | null;
  };
  insights: Array<{
    severity: "info" | "warning" | "critical";
    code: string;
    message: string;
  }>;
  generatedAt: string;
};

export type GovernanceTrendSnapshot = {
  archiveId: string;
  createdAt: string;
  kind: "governance-insights";
  data: unknown;
};

export const GOVERNANCE_TREND_SUPPORTED_KINDS = ["governance-insights"] as const;

const DEFAULT_WINDOW_SIZE = 10;
const MAX_WINDOW_SIZE = 100;
const STABLE_DELTA_THRESHOLD = 0.01;
const UNKNOWN_GENERATED_AT = "1970-01-01T00:00:00.000Z";

function normalizeSlash(value: string): string {
  return value.split(path.sep).join("/");
}

function resolveProjectPath(projectRoot: string, relativePath: string): string {
  const resolved = path.resolve(projectRoot, relativePath);
  const relative = path.relative(projectRoot, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Trend snapshot path must stay within the project root.");
  }
  return resolved;
}

function normalizeWindowSize(windowSize: number | undefined): number {
  if (typeof windowSize !== "number" || !Number.isInteger(windowSize) || windowSize <= 0) {
    return DEFAULT_WINDOW_SIZE;
  }
  return Math.min(windowSize, MAX_WINDOW_SIZE);
}

function numericValue(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function roundMetric(value: number): number {
  return Number(value.toFixed(2));
}

function snapshotMetric(data: unknown, metric: keyof GovernanceTrendAnalysis["metrics"]): number | null {
  if (typeof data !== "object" || data === null) return null;
  const value = data as { rates?: Record<string, unknown>; trust?: Record<string, unknown> };
  if (metric === "blockedRate") return numericValue(value.rates?.blockedRate);
  if (metric === "humanReviewRate") return numericValue(value.rates?.humanReviewRate);
  if (metric === "validationSuccessRate") return numericValue(value.rates?.validationSuccessRate);
  if (metric === "readyRate") return numericValue(value.rates?.readyRate);
  if (metric === "averageTrustScore") return numericValue(value.trust?.averageTrustScore);
  return null;
}

function metricDirection(firstValue: number | null, lastValue: number | null, sampleCount: number): GovernanceTrendDirection {
  if (sampleCount < 2 || firstValue === null || lastValue === null) return "unknown";
  const delta = lastValue - firstValue;
  if (Math.abs(delta) < STABLE_DELTA_THRESHOLD) return "stable";
  return delta > 0 ? "up" : "down";
}

function buildMetric(values: Array<number | null>): GovernanceTrendMetric {
  const samples = values.filter((value): value is number => value !== null);
  if (samples.length === 0) {
    return {
      direction: "unknown",
      firstValue: null,
      lastValue: null,
      absoluteDelta: null,
      averageValue: null,
      sampleCount: 0
    };
  }

  const firstValue = samples[0];
  const lastValue = samples[samples.length - 1];
  return {
    direction: metricDirection(firstValue, lastValue, samples.length),
    firstValue,
    lastValue,
    absoluteDelta: samples.length < 2 ? null : roundMetric(lastValue - firstValue),
    averageValue: roundMetric(samples.reduce((sum, value) => sum + value, 0) / samples.length),
    sampleCount: samples.length
  };
}

function averageConsecutiveDelta(values: Array<number | null>): number | null {
  const samples = values.filter((value): value is number => value !== null);
  if (samples.length < 2) return null;
  let total = 0;
  for (let index = 1; index < samples.length; index += 1) {
    total += Math.abs(samples[index] - samples[index - 1]);
  }
  return roundMetric(total / (samples.length - 1));
}

function averageNonNull(values: Array<number | null>): number | null {
  const samples = values.filter((value): value is number => value !== null);
  if (samples.length === 0) return null;
  return roundMetric(samples.reduce((sum, value) => sum + value, 0) / samples.length);
}

function isGoodTrend(metricName: string, metric: GovernanceTrendMetric): boolean {
  if (metric.direction === "stable") return true;
  if (metricName === "blockedRate" || metricName === "humanReviewRate") return metric.direction === "down";
  if (metricName === "validationSuccessRate" || metricName === "averageTrustScore" || metricName === "readyRate") return metric.direction === "up";
  return false;
}

function isBadTrend(metricName: string, metric: GovernanceTrendMetric): boolean {
  if (metric.direction === "unknown" || metric.direction === "stable") return false;
  return !isGoodTrend(metricName, metric);
}

function buildMetrics(snapshots: GovernanceTrendSnapshot[]): GovernanceTrendAnalysis["metrics"] {
  const metricNames: Array<keyof GovernanceTrendAnalysis["metrics"]> = [
    "blockedRate",
    "humanReviewRate",
    "validationSuccessRate",
    "averageTrustScore",
    "readyRate"
  ];
  const metrics: GovernanceTrendAnalysis["metrics"] = {};
  for (const metricName of metricNames) {
    metrics[metricName] = buildMetric(snapshots.map((snapshot) => snapshotMetric(snapshot.data, metricName)));
  }
  return metrics;
}

function buildVolatility(snapshots: GovernanceTrendSnapshot[]): GovernanceTrendAnalysis["volatility"] {
  const blocked = averageConsecutiveDelta(snapshots.map((snapshot) => snapshotMetric(snapshot.data, "blockedRate")));
  const humanReview = averageConsecutiveDelta(snapshots.map((snapshot) => snapshotMetric(snapshot.data, "humanReviewRate")));
  const ready = averageConsecutiveDelta(snapshots.map((snapshot) => snapshotMetric(snapshot.data, "readyRate")));
  return {
    governanceVolatilityScore: averageNonNull([blocked, humanReview, ready]),
    trustVolatilityScore: averageConsecutiveDelta(snapshots.map((snapshot) => snapshotMetric(snapshot.data, "averageTrustScore"))),
    validationVolatilityScore: averageConsecutiveDelta(snapshots.map((snapshot) => snapshotMetric(snapshot.data, "validationSuccessRate")))
  };
}

function isHighVolatility(value: number | null): boolean {
  return value !== null && value > 15;
}

function isMediumVolatility(value: number | null): boolean {
  return value !== null && value >= 5;
}

function determineHealth(metrics: GovernanceTrendAnalysis["metrics"], volatility: GovernanceTrendAnalysis["volatility"]): GovernanceTrendHealth {
  const metricEntries = Object.entries(metrics).filter(([, metric]) => metric.sampleCount >= 2);
  if (metricEntries.length === 0) return "unknown";

  const badMetrics = metricEntries.filter(([name, metric]) => isBadTrend(name, metric));
  const goodOrStableMetrics = metricEntries.filter(([name, metric]) => isGoodTrend(name, metric));
  const blockedWorsening = isBadTrend("blockedRate", metrics.blockedRate ?? buildMetric([]));
  const validationWorsening = isBadTrend("validationSuccessRate", metrics.validationSuccessRate ?? buildMetric([]));
  const trustMetric = metrics.averageTrustScore;
  const trustSignificantlyDegrading = trustMetric?.absoluteDelta !== null && trustMetric !== undefined && trustMetric.absoluteDelta <= -15;

  if ((blockedWorsening && validationWorsening) || (blockedWorsening && trustSignificantlyDegrading)) {
    return "critical";
  }
  if (
    badMetrics.length > 0 ||
    isMediumVolatility(volatility.governanceVolatilityScore) ||
    isMediumVolatility(volatility.trustVolatilityScore) ||
    isMediumVolatility(volatility.validationVolatilityScore)
  ) {
    return "warning";
  }
  if (goodOrStableMetrics.length > 0) return "healthy";
  return "unknown";
}

function addTrendInsight(
  insights: GovernanceTrendAnalysis["insights"],
  metricName: string,
  metric: GovernanceTrendMetric
): void {
  if (metric.direction === "unknown" || metric.direction === "stable") return;
  const good = isGoodTrend(metricName, metric);
  if (metricName === "blockedRate") {
    insights.push({
      severity: good ? "info" : "warning",
      code: good ? "BLOCKED_RATE_IMPROVING" : "BLOCKED_RATE_WORSENING",
      message: good ? "Blocked governance rate is improving over time." : "Blocked governance rate is worsening over time."
    });
  }
  if (metricName === "humanReviewRate") {
    insights.push({
      severity: good ? "info" : "warning",
      code: good ? "HUMAN_REVIEW_RATE_IMPROVING" : "HUMAN_REVIEW_RATE_WORSENING",
      message: good ? "Human review rate is improving over time." : "Human review rate is worsening over time."
    });
  }
  if (metricName === "validationSuccessRate") {
    insights.push({
      severity: good ? "info" : "warning",
      code: good ? "VALIDATION_SUCCESS_IMPROVING" : "VALIDATION_SUCCESS_WORSENING",
      message: good ? "Validation success rate is improving over time." : "Validation success rate is worsening over time."
    });
  }
  if (metricName === "averageTrustScore") {
    insights.push({
      severity: good ? "info" : "warning",
      code: good ? "TRUST_TREND_IMPROVING" : "TRUST_TREND_DEGRADING",
      message: good ? "Governance trust score trend is improving." : "Governance trust score trend is degrading."
    });
  }
  if (metricName === "readyRate") {
    insights.push({
      severity: good ? "info" : "warning",
      code: good ? "READY_RATE_IMPROVING" : "READY_RATE_WORSENING",
      message: good ? "Ready governance rate is improving over time." : "Ready governance rate is worsening over time."
    });
  }
}

function buildInsights(
  metrics: GovernanceTrendAnalysis["metrics"],
  volatility: GovernanceTrendAnalysis["volatility"],
  analyzedSnapshots: number
): GovernanceTrendAnalysis["insights"] {
  if (analyzedSnapshots === 0) {
    return [{ severity: "info", code: "NO_ARCHIVE_HISTORY", message: "No governance archive history is available." }];
  }

  const insights: GovernanceTrendAnalysis["insights"] = [];
  for (const [metricName, metric] of Object.entries(metrics)) {
    addTrendInsight(insights, metricName, metric);
  }

  const allKnownMetrics = Object.values(metrics).filter((metric) => metric.sampleCount >= 2);
  if (allKnownMetrics.length > 0 && allKnownMetrics.every((metric) => metric.direction === "stable")) {
    insights.push({ severity: "info", code: "GOVERNANCE_STABLE", message: "Governance metrics remained stable over analyzed snapshots." });
  }

  if (
    isHighVolatility(volatility.governanceVolatilityScore) ||
    isHighVolatility(volatility.trustVolatilityScore) ||
    isHighVolatility(volatility.validationVolatilityScore)
  ) {
    insights.push({ severity: "warning", code: "HIGH_GOVERNANCE_VOLATILITY", message: "Governance metrics show high volatility." });
  }

  return insights;
}

function latestGeneratedAt(snapshots: GovernanceTrendSnapshot[]): string {
  const latest = snapshots[snapshots.length - 1];
  if (!latest) return UNKNOWN_GENERATED_AT;
  if (typeof latest.data === "object" && latest.data !== null) {
    const data = latest.data as { generatedAt?: unknown };
    if (typeof data.generatedAt === "string") return data.generatedAt;
  }
  return latest.createdAt;
}

function snapshotJsonPath(projectRoot: string, entry: GovernanceArchiveIndexEntry): string | null {
  const relative = entry.files.find((file) => normalizeSlash(file).endsWith("/governance-insights.json"));
  if (!relative) return null;
  return resolveProjectPath(projectRoot, relative);
}

export function loadGovernanceTrendSnapshots(input: {
  projectRoot: string;
  index: GovernanceArchiveIndex;
  kind?: string;
  windowSize?: number;
}): GovernanceTrendSnapshot[] {
  const kind = input.kind ?? "governance-insights";
  if (kind !== "governance-insights") {
    throw new Error("Governance trend analysis currently supports: governance-insights");
  }
  const windowSize = normalizeWindowSize(input.windowSize);
  const entries = (Array.isArray(input.index.archives) ? input.index.archives : [])
    .filter((entry) => entry.kind === "governance-insights")
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.archiveId.localeCompare(b.archiveId))
    .slice(-windowSize);

  const snapshots: GovernanceTrendSnapshot[] = [];
  for (const entry of entries) {
    const jsonPath = snapshotJsonPath(input.projectRoot, entry);
    if (!jsonPath || !fs.pathExistsSync(jsonPath)) continue;
    try {
      snapshots.push({
        archiveId: entry.archiveId,
        createdAt: entry.createdAt,
        kind: "governance-insights",
        data: fs.readJsonSync(jsonPath)
      });
    } catch {
      continue;
    }
  }
  return snapshots;
}

export function buildGovernanceTrendAnalysis(input: {
  snapshots?: GovernanceTrendSnapshot[];
  analyzedKind?: string;
  windowSize?: number;
  totalSnapshots?: number;
  generatedAt?: string;
}): GovernanceTrendAnalysis {
  const analyzedKind = input.analyzedKind ?? "governance-insights";
  if (analyzedKind !== "governance-insights") {
    throw new Error("Governance trend analysis currently supports: governance-insights");
  }
  const snapshots = [...(input.snapshots ?? [])].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.archiveId.localeCompare(b.archiveId));
  const windowSize = normalizeWindowSize(input.windowSize);
  const metrics = buildMetrics(snapshots);
  const volatility = buildVolatility(snapshots);
  const trendHealth = determineHealth(metrics, volatility);

  return {
    version: 1,
    analyzedKind,
    windowSize,
    totalSnapshots: input.totalSnapshots ?? snapshots.length,
    analyzedSnapshots: snapshots.length,
    trendHealth,
    metrics,
    volatility,
    insights: buildInsights(metrics, volatility, snapshots.length),
    generatedAt: input.generatedAt ?? latestGeneratedAt(snapshots)
  };
}

function formatValue(value: number | null): string {
  if (value === null) return "unknown";
  return String(value);
}

function formatDelta(value: number | null): string {
  if (value === null) return "unknown";
  if (value > 0) return `+${value}`;
  return String(value);
}

export function renderGovernanceTrendAnalysisMarkdown(analysis: GovernanceTrendAnalysis): string {
  const lines = [
    "# AI Software Factory - Governance Trend Analysis",
    "",
    "Archive kind:",
    analysis.analyzedKind,
    "",
    "Window size:",
    String(analysis.windowSize),
    "",
    "Analyzed snapshots:",
    String(analysis.analyzedSnapshots),
    "",
    "Trend health:",
    analysis.trendHealth,
    "",
    "## Metrics",
    "",
    "| Metric | Direction | First | Last | Delta | Average |",
    "|---|---|---|---|---|---|"
  ];

  for (const [metricName, metric] of Object.entries(analysis.metrics)) {
    lines.push(
      `| ${metricName} | ${metric.direction} | ${formatValue(metric.firstValue)} | ${formatValue(metric.lastValue)} | ${formatDelta(metric.absoluteDelta)} | ${formatValue(metric.averageValue)} |`
    );
  }

  lines.push(
    "",
    "## Volatility",
    "",
    `- governance volatility: ${formatValue(analysis.volatility.governanceVolatilityScore)}`,
    `- trust volatility: ${formatValue(analysis.volatility.trustVolatilityScore)}`,
    `- validation volatility: ${formatValue(analysis.volatility.validationVolatilityScore)}`,
    "",
    "## Insights",
    ""
  );

  if (analysis.insights.length === 0) {
    lines.push("- none");
  } else {
    for (const insight of analysis.insights) {
      lines.push(`- [${insight.severity}] ${insight.code} - ${insight.message}`);
    }
  }

  return `${lines.join("\n")}\n`;
}

export function renderGovernanceTrendAnalysisText(analysis: GovernanceTrendAnalysis): string {
  return renderGovernanceTrendAnalysisMarkdown(analysis);
}
