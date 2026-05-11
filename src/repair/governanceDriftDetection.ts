import path from "node:path";
import fs from "fs-extra";
import type { GovernanceArchiveIndex, GovernanceArchiveIndexEntry } from "./governanceArchiveIndex.js";

export type GovernanceDriftSeverity = "none" | "low" | "medium" | "high" | "critical";

export type GovernanceDriftMetric = {
  baselineAverage: number | null;
  currentValue: number | null;
  absoluteDelta: number | null;
  percentDelta: number | null;
  driftDetected: boolean;
  severity: GovernanceDriftSeverity;
};

export type GovernanceDriftDetection = {
  version: 1;
  analyzedKind: string;
  baselineWindowSize: number;
  comparisonWindowSize: number;
  analyzedSnapshots: number;
  overallSeverity: GovernanceDriftSeverity;
  metrics: {
    blockedRate?: GovernanceDriftMetric;
    humanReviewRate?: GovernanceDriftMetric;
    validationSuccessRate?: GovernanceDriftMetric;
    averageTrustScore?: GovernanceDriftMetric;
    readyRate?: GovernanceDriftMetric;
  };
  anomalies: Array<{
    severity: "info" | "warning" | "critical";
    code: string;
    message: string;
  }>;
  summary: string;
  generatedAt: string;
};

export type GovernanceDriftSnapshot = {
  archiveId: string;
  createdAt: string;
  kind: "governance-insights";
  data: unknown;
};

const DEFAULT_BASELINE_WINDOW = 20;
const DEFAULT_COMPARISON_WINDOW = 5;
const MAX_TOTAL_SNAPSHOTS = 100;
const MIN_BASELINE_SNAPSHOTS = 5;
const MIN_COMPARISON_SNAPSHOTS = 2;
const UNKNOWN_GENERATED_AT = "1970-01-01T00:00:00.000Z";

function normalizeSlash(value: string): string {
  return value.split(path.sep).join("/");
}

function resolveProjectPath(projectRoot: string, relativePath: string): string {
  const resolved = path.resolve(projectRoot, relativePath);
  const relative = path.relative(projectRoot, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Drift snapshot path must stay within the project root.");
  }
  return resolved;
}

function normalizeWindow(value: number | undefined, fallback: number): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) return fallback;
  return Math.min(value, MAX_TOTAL_SNAPSHOTS);
}

function roundMetric(value: number): number {
  return Number(value.toFixed(2));
}

function numericValue(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function snapshotMetric(data: unknown, metric: keyof GovernanceDriftDetection["metrics"]): number | null {
  if (typeof data !== "object" || data === null) return null;
  const value = data as { rates?: Record<string, unknown>; trust?: Record<string, unknown> };
  if (metric === "blockedRate") return numericValue(value.rates?.blockedRate);
  if (metric === "humanReviewRate") return numericValue(value.rates?.humanReviewRate);
  if (metric === "validationSuccessRate") return numericValue(value.rates?.validationSuccessRate);
  if (metric === "readyRate") return numericValue(value.rates?.readyRate);
  if (metric === "averageTrustScore") return numericValue(value.trust?.averageTrustScore);
  return null;
}

function average(values: Array<number | null>): number | null {
  const samples = values.filter((value): value is number => value !== null);
  if (samples.length === 0) return null;
  return roundMetric(samples.reduce((sum, value) => sum + value, 0) / samples.length);
}

function severityFromPercent(percentDelta: number | null, isBad: boolean): GovernanceDriftSeverity {
  if (!isBad || percentDelta === null) return "none";
  const magnitude = Math.abs(percentDelta);
  if (magnitude < 5) return "none";
  if (magnitude <= 15) return "low";
  if (magnitude <= 30) return "medium";
  if (magnitude <= 50) return "high";
  return "critical";
}

function isBadDrift(metricName: string, absoluteDelta: number | null): boolean {
  if (absoluteDelta === null) return false;
  if (metricName === "blockedRate" || metricName === "humanReviewRate") return absoluteDelta > 0;
  if (metricName === "validationSuccessRate" || metricName === "averageTrustScore" || metricName === "readyRate") return absoluteDelta < 0;
  return false;
}

function isGoodDrift(metricName: string, absoluteDelta: number | null, percentDelta: number | null): boolean {
  if (absoluteDelta === null || percentDelta === null || Math.abs(percentDelta) < 5) return false;
  return !isBadDrift(metricName, absoluteDelta);
}

function buildMetric(
  metricName: keyof GovernanceDriftDetection["metrics"],
  baseline: GovernanceDriftSnapshot[],
  comparison: GovernanceDriftSnapshot[]
): GovernanceDriftMetric {
  const baselineAverage = average(baseline.map((snapshot) => snapshotMetric(snapshot.data, metricName)));
  const currentValue = average(comparison.map((snapshot) => snapshotMetric(snapshot.data, metricName)));
  const absoluteDelta = baselineAverage === null || currentValue === null ? null : roundMetric(currentValue - baselineAverage);
  const percentDelta = baselineAverage === null || currentValue === null || baselineAverage === 0
    ? null
    : roundMetric(((currentValue - baselineAverage) / baselineAverage) * 100);
  const bad = isBadDrift(metricName, absoluteDelta);
  const good = isGoodDrift(metricName, absoluteDelta, percentDelta);
  const severity = severityFromPercent(percentDelta, bad);

  return {
    baselineAverage,
    currentValue,
    absoluteDelta,
    percentDelta,
    driftDetected: severity !== "none" || good,
    severity
  };
}

function determineOverallSeverity(metrics: GovernanceDriftDetection["metrics"]): GovernanceDriftSeverity {
  const severities = Object.values(metrics).map((metric) => metric.severity);
  if (severities.includes("critical")) return "critical";
  if (severities.includes("high")) return "high";
  if (severities.filter((severity) => severity === "medium").length >= 2) return "medium";
  if (severities.includes("medium") || severities.includes("low")) return "low";
  return "none";
}

function summaryFor(severity: GovernanceDriftSeverity, noHistory: boolean, insufficient: boolean): string {
  if (noHistory) return "No governance archive history is available.";
  if (insufficient) return "Insufficient governance history for drift detection.";
  if (severity === "critical") return "Critical governance drift detected relative to historical baseline.";
  if (severity === "high") return "Significant governance drift detected relative to historical baseline.";
  if (severity === "medium") return "Moderate governance drift detected relative to historical baseline.";
  if (severity === "low") return "Minor governance drift detected relative to historical baseline.";
  return "Governance metrics remain within historical baseline ranges.";
}

function anomalySeverity(severity: GovernanceDriftSeverity): "warning" | "critical" {
  return severity === "high" || severity === "critical" ? "critical" : "warning";
}

function addMetricAnomaly(
  anomalies: GovernanceDriftDetection["anomalies"],
  metricName: string,
  metric: GovernanceDriftMetric
): void {
  if (metric.severity !== "none") {
    if (metricName === "blockedRate") {
      anomalies.push({ severity: anomalySeverity(metric.severity), code: "BLOCKED_RATE_DRIFT", message: "Blocked governance rate drift exceeded historical baseline." });
    }
    if (metricName === "humanReviewRate") {
      anomalies.push({ severity: anomalySeverity(metric.severity), code: "HUMAN_REVIEW_RATE_DRIFT", message: "Human review rate drift exceeded historical baseline." });
    }
    if (metricName === "validationSuccessRate") {
      anomalies.push({ severity: anomalySeverity(metric.severity), code: "VALIDATION_SUCCESS_DRIFT", message: "Validation success rate drift exceeded historical baseline." });
    }
    if (metricName === "averageTrustScore") {
      anomalies.push({ severity: anomalySeverity(metric.severity), code: "TRUST_SCORE_DRIFT", message: "Governance trust score drift exceeded historical baseline." });
    }
    if (metricName === "readyRate") {
      anomalies.push({ severity: anomalySeverity(metric.severity), code: "READY_RATE_DRIFT", message: "Ready governance rate drift exceeded historical baseline." });
    }
    return;
  }

  if (isGoodDrift(metricName, metric.absoluteDelta, metric.percentDelta)) {
    if (metricName === "blockedRate") anomalies.push({ severity: "info", code: "BLOCKED_RATE_IMPROVED", message: "Blocked governance rate improved relative to historical baseline." });
    if (metricName === "humanReviewRate") anomalies.push({ severity: "info", code: "HUMAN_REVIEW_RATE_IMPROVED", message: "Human review rate improved relative to historical baseline." });
    if (metricName === "validationSuccessRate") anomalies.push({ severity: "info", code: "VALIDATION_SUCCESS_IMPROVED", message: "Validation success rate improved relative to historical baseline." });
    if (metricName === "averageTrustScore") anomalies.push({ severity: "info", code: "TRUST_SCORE_IMPROVED", message: "Governance trust score improved relative to historical baseline." });
    if (metricName === "readyRate") anomalies.push({ severity: "info", code: "READY_RATE_IMPROVED", message: "Ready governance rate improved relative to historical baseline." });
  }
}

function buildAnomalies(metrics: GovernanceDriftDetection["metrics"], insufficient: boolean, noHistory: boolean): GovernanceDriftDetection["anomalies"] {
  if (noHistory) {
    return [{ severity: "info", code: "NO_ARCHIVE_HISTORY", message: "No governance archive history is available." }];
  }
  if (insufficient) {
    return [{ severity: "info", code: "INSUFFICIENT_DRIFT_HISTORY", message: "Insufficient governance history for drift detection." }];
  }
  const anomalies: GovernanceDriftDetection["anomalies"] = [];
  for (const [metricName, metric] of Object.entries(metrics)) {
    addMetricAnomaly(anomalies, metricName, metric);
  }
  if (!anomalies.some((anomaly) => anomaly.severity !== "info")) {
    anomalies.push({ severity: "info", code: "GOVERNANCE_BASELINE_STABLE", message: "Governance metrics remain within historical baseline ranges." });
  }
  return anomalies;
}

function latestGeneratedAt(snapshots: GovernanceDriftSnapshot[]): string {
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

export function loadGovernanceDriftSnapshots(input: {
  projectRoot: string;
  index: GovernanceArchiveIndex;
  kind?: string;
  maxSnapshots?: number;
}): GovernanceDriftSnapshot[] {
  const kind = input.kind ?? "governance-insights";
  if (kind !== "governance-insights") {
    throw new Error("Governance drift detection currently supports: governance-insights");
  }
  const maxSnapshots = normalizeWindow(input.maxSnapshots, MAX_TOTAL_SNAPSHOTS);
  const entries = (Array.isArray(input.index.archives) ? input.index.archives : [])
    .filter((entry) => entry.kind === "governance-insights")
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.archiveId.localeCompare(b.archiveId))
    .slice(-maxSnapshots);

  const snapshots: GovernanceDriftSnapshot[] = [];
  for (const entry of entries) {
    const jsonPath = snapshotJsonPath(input.projectRoot, entry);
    if (!jsonPath || !fs.pathExistsSync(jsonPath)) continue;
    try {
      snapshots.push({ archiveId: entry.archiveId, createdAt: entry.createdAt, kind: "governance-insights", data: fs.readJsonSync(jsonPath) });
    } catch {
      continue;
    }
  }
  return snapshots;
}

export function buildGovernanceDriftDetection(input: {
  snapshots?: GovernanceDriftSnapshot[];
  analyzedKind?: string;
  baselineWindowSize?: number;
  comparisonWindowSize?: number;
  generatedAt?: string;
}): GovernanceDriftDetection {
  const analyzedKind = input.analyzedKind ?? "governance-insights";
  if (analyzedKind !== "governance-insights") {
    throw new Error("Governance drift detection currently supports: governance-insights");
  }
  const baselineWindowSize = normalizeWindow(input.baselineWindowSize, DEFAULT_BASELINE_WINDOW);
  const comparisonWindowSize = normalizeWindow(input.comparisonWindowSize, DEFAULT_COMPARISON_WINDOW);
  const maxNeeded = Math.min(baselineWindowSize + comparisonWindowSize, MAX_TOTAL_SNAPSHOTS);
  const snapshots = [...(input.snapshots ?? [])]
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.archiveId.localeCompare(b.archiveId))
    .slice(-maxNeeded);

  const comparison = snapshots.slice(-comparisonWindowSize);
  const baselinePool = snapshots.slice(0, Math.max(0, snapshots.length - comparison.length));
  const baseline = baselinePool.slice(-baselineWindowSize);
  const insufficient = baseline.length < MIN_BASELINE_SNAPSHOTS || comparison.length < MIN_COMPARISON_SNAPSHOTS;

  const metricNames: Array<keyof GovernanceDriftDetection["metrics"]> = ["blockedRate", "humanReviewRate", "validationSuccessRate", "averageTrustScore", "readyRate"];
  const metrics: GovernanceDriftDetection["metrics"] = {};
  for (const metricName of metricNames) {
    metrics[metricName] = insufficient
      ? { baselineAverage: null, currentValue: null, absoluteDelta: null, percentDelta: null, driftDetected: false, severity: "none" }
      : buildMetric(metricName, baseline, comparison);
  }

  const overallSeverity = insufficient ? "none" : determineOverallSeverity(metrics);
  return {
    version: 1,
    analyzedKind,
    baselineWindowSize,
    comparisonWindowSize,
    analyzedSnapshots: snapshots.length,
    overallSeverity,
    metrics,
    anomalies: buildAnomalies(metrics, insufficient, snapshots.length === 0),
    summary: summaryFor(overallSeverity, snapshots.length === 0, insufficient),
    generatedAt: input.generatedAt ?? latestGeneratedAt(snapshots)
  };
}

function formatValue(value: number | null): string {
  if (value === null) return "unknown";
  return String(value);
}

function formatDelta(value: number | null, suffix = ""): string {
  if (value === null) return "unknown";
  const formatted = value > 0 ? `+${value}` : String(value);
  return `${formatted}${suffix}`;
}

export function renderGovernanceDriftDetectionMarkdown(drift: GovernanceDriftDetection): string {
  const lines = [
    "# AI Software Factory - Governance Drift Detection",
    "",
    "Archive kind:",
    drift.analyzedKind,
    "",
    "Baseline window:",
    String(drift.baselineWindowSize),
    "",
    "Comparison window:",
    String(drift.comparisonWindowSize),
    "",
    "Overall severity:",
    drift.overallSeverity,
    "",
    "## Metrics",
    "",
    "| Metric | Baseline | Current | Delta | Percent | Severity |",
    "|---|---|---|---|---|---|"
  ];

  for (const [metricName, metric] of Object.entries(drift.metrics)) {
    lines.push(`| ${metricName} | ${formatValue(metric.baselineAverage)} | ${formatValue(metric.currentValue)} | ${formatDelta(metric.absoluteDelta)} | ${formatDelta(metric.percentDelta, "%")} | ${metric.severity} |`);
  }

  lines.push("", "## Anomalies", "");
  if (drift.anomalies.length === 0) {
    lines.push("- none");
  } else {
    for (const anomaly of drift.anomalies) {
      lines.push(`- [${anomaly.severity}] ${anomaly.code} - ${anomaly.message}`);
    }
  }

  lines.push("", "Summary:", drift.summary);
  return `${lines.join("\n")}\n`;
}

export function renderGovernanceDriftDetectionText(drift: GovernanceDriftDetection): string {
  return renderGovernanceDriftDetectionMarkdown(drift);
}
