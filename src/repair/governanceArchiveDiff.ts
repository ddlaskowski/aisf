import path from "node:path";
import fs from "fs-extra";
import type { GovernanceArchiveIndex, GovernanceArchiveIndexEntry } from "./governanceArchiveIndex.js";

export type GovernanceArchiveDiffStatus = "improved" | "degraded" | "stable" | "mixed" | "unknown";

export type GovernanceArchiveMetricDelta = {
  previous: number | null;
  current: number | null;
  delta: number | null;
};

export type GovernanceArchiveDiff = {
  version: 1;
  archiveA: {
    archiveId: string;
    createdAt?: string;
    kind: string;
  };
  archiveB: {
    archiveId: string;
    createdAt?: string;
    kind: string;
  };
  comparison: {
    status: GovernanceArchiveDiffStatus;
    summary: string;
  };
  metrics: {
    blockedRate?: GovernanceArchiveMetricDelta;
    humanReviewRate?: GovernanceArchiveMetricDelta;
    validationSuccessRate?: GovernanceArchiveMetricDelta;
    averageTrustScore?: GovernanceArchiveMetricDelta;
    readyRate?: GovernanceArchiveMetricDelta;
  };
  insights: Array<{
    severity: "info" | "warning";
    code: string;
    message: string;
  }>;
  generatedAt: string;
};

export type LoadedGovernanceArchiveSnapshot = {
  entry: GovernanceArchiveIndexEntry;
  data: unknown;
};

export const GOVERNANCE_ARCHIVE_DIFF_SUPPORTED_KINDS = ["governance-insights", "governance-ci-summary"] as const;

const STABLE_DELTA_THRESHOLD = 0.01;
const UNKNOWN_GENERATED_AT = "1970-01-01T00:00:00.000Z";

function isSupportedDiffKind(kind: string): kind is (typeof GOVERNANCE_ARCHIVE_DIFF_SUPPORTED_KINDS)[number] {
  return GOVERNANCE_ARCHIVE_DIFF_SUPPORTED_KINDS.includes(kind as (typeof GOVERNANCE_ARCHIVE_DIFF_SUPPORTED_KINDS)[number]);
}

function normalizeSlash(value: string): string {
  return value.split(path.sep).join("/");
}

function resolveProjectPath(projectRoot: string, relativePath: string): string {
  const resolved = path.resolve(projectRoot, relativePath);
  const relative = path.relative(projectRoot, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Archive snapshot path must stay within the project root.");
  }
  return resolved;
}

function expectedSnapshotFile(kind: string): string {
  if (kind === "governance-insights") return "governance-insights.json";
  if (kind === "governance-ci-summary") return "governance-ci-summary.json";
  return "";
}

function snapshotJsonPath(projectRoot: string, entry: GovernanceArchiveIndexEntry): string {
  const expected = expectedSnapshotFile(entry.kind);
  const relative = entry.files.find((file) => normalizeSlash(file).endsWith(`/${expected}`) || normalizeSlash(file) === expected);
  if (!relative) {
    throw new Error(`Snapshot JSON missing for archive ${entry.archiveId}.`);
  }
  return resolveProjectPath(projectRoot, relative);
}

function newestMatchingArchive(index: GovernanceArchiveIndex, archiveId: string): GovernanceArchiveIndexEntry | null {
  const matches = Array.isArray(index.archives) ? index.archives.filter((entry) => entry.archiveId === archiveId) : [];
  if (matches.length === 0) return null;
  return [...matches].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.kind.localeCompare(b.kind))[0];
}

export function loadGovernanceArchiveSnapshot(
  projectRoot: string,
  index: GovernanceArchiveIndex,
  archiveId: string
): LoadedGovernanceArchiveSnapshot {
  const entry = newestMatchingArchive(index, archiveId);
  if (!entry) {
    throw new Error(`Archive not found: ${archiveId}`);
  }
  if (!isSupportedDiffKind(entry.kind)) {
    throw new Error("Archive diff currently supports: governance-insights, governance-ci-summary");
  }

  const jsonPath = snapshotJsonPath(projectRoot, entry);
  if (!fs.pathExistsSync(jsonPath)) {
    throw new Error(`Snapshot JSON missing for archive ${archiveId}.`);
  }

  try {
    return {
      entry,
      data: fs.readJsonSync(jsonPath)
    };
  } catch {
    throw new Error(`Could not read snapshot JSON for archive ${archiveId}.`);
  }
}

function numericValue(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function roundDelta(value: number): number {
  return Number(value.toFixed(2));
}

function buildDelta(previous: number | null, current: number | null): GovernanceArchiveMetricDelta {
  return {
    previous,
    current,
    delta: previous === null || current === null ? null : roundDelta(current - previous)
  };
}

function insightMetric(data: unknown, metric: keyof GovernanceArchiveDiff["metrics"]): number | null {
  if (typeof data !== "object" || data === null) return null;
  const value = data as { rates?: Record<string, unknown>; trust?: Record<string, unknown> };
  if (metric === "blockedRate") return numericValue(value.rates?.blockedRate);
  if (metric === "humanReviewRate") return numericValue(value.rates?.humanReviewRate);
  if (metric === "validationSuccessRate") return numericValue(value.rates?.validationSuccessRate);
  if (metric === "readyRate") return numericValue(value.rates?.readyRate);
  if (metric === "averageTrustScore") return numericValue(value.trust?.averageTrustScore);
  return null;
}

function ciSummaryMetric(data: unknown, metric: keyof GovernanceArchiveDiff["metrics"]): number | null {
  if (typeof data !== "object" || data === null) return null;
  const value = data as { metrics?: Record<string, unknown> };
  if (metric === "blockedRate") return numericValue(value.metrics?.blockedRate);
  if (metric === "humanReviewRate") return numericValue(value.metrics?.humanReviewRate);
  if (metric === "validationSuccessRate") return numericValue(value.metrics?.validationSuccessRate);
  if (metric === "averageTrustScore") return numericValue(value.metrics?.averageTrustScore);
  return null;
}

function metricValue(kind: string, data: unknown, metric: keyof GovernanceArchiveDiff["metrics"]): number | null {
  if (kind === "governance-insights") return insightMetric(data, metric);
  if (kind === "governance-ci-summary") return ciSummaryMetric(data, metric);
  return null;
}

function metricDeltas(kind: string, previous: unknown, current: unknown): GovernanceArchiveDiff["metrics"] {
  const metricNames: Array<keyof GovernanceArchiveDiff["metrics"]> = [
    "blockedRate",
    "humanReviewRate",
    "validationSuccessRate",
    "averageTrustScore",
    "readyRate"
  ];
  const result: GovernanceArchiveDiff["metrics"] = {};

  for (const metric of metricNames) {
    const previousValue = metricValue(kind, previous, metric);
    const currentValue = metricValue(kind, current, metric);
    if (previousValue !== null || currentValue !== null) {
      result[metric] = buildDelta(previousValue, currentValue);
    }
  }

  return result;
}

function isMetricImprovement(metric: string, delta: number): boolean {
  if (metric === "blockedRate" || metric === "humanReviewRate") return delta < -STABLE_DELTA_THRESHOLD;
  if (metric === "validationSuccessRate" || metric === "averageTrustScore" || metric === "readyRate") return delta > STABLE_DELTA_THRESHOLD;
  return false;
}

function isMetricDegradation(metric: string, delta: number): boolean {
  if (metric === "blockedRate" || metric === "humanReviewRate") return delta > STABLE_DELTA_THRESHOLD;
  if (metric === "validationSuccessRate" || metric === "averageTrustScore" || metric === "readyRate") return delta < -STABLE_DELTA_THRESHOLD;
  return false;
}

function statusSummary(status: GovernanceArchiveDiffStatus): string {
  if (status === "improved") return "Governance health improved between archive snapshots.";
  if (status === "degraded") return "Governance health degraded between archive snapshots.";
  if (status === "mixed") return "Governance health changed with mixed improvements and regressions.";
  if (status === "stable") return "Governance health remained stable between archive snapshots.";
  return "Governance health could not be compared reliably.";
}

function classifyStatus(metrics: GovernanceArchiveDiff["metrics"]): GovernanceArchiveDiffStatus {
  let comparable = 0;
  let improvements = 0;
  let degradations = 0;

  for (const [metric, delta] of Object.entries(metrics)) {
    if (delta.delta === null) continue;
    comparable += 1;
    if (isMetricImprovement(metric, delta.delta)) improvements += 1;
    if (isMetricDegradation(metric, delta.delta)) degradations += 1;
  }

  if (comparable === 0) return "unknown";
  if (improvements > 0 && degradations > 0) return "mixed";
  if (degradations > 0) return "degraded";
  if (improvements > 0) return "improved";
  return "stable";
}

function addInsight(
  insights: GovernanceArchiveDiff["insights"],
  metric: string,
  delta: GovernanceArchiveMetricDelta
): void {
  if (delta.delta === null || Math.abs(delta.delta) < STABLE_DELTA_THRESHOLD) return;

  const improved = isMetricImprovement(metric, delta.delta);
  const degraded = isMetricDegradation(metric, delta.delta);
  if (!improved && !degraded) return;

  if (metric === "blockedRate") {
    insights.push({
      severity: improved ? "info" : "warning",
      code: improved ? "BLOCKED_RATE_IMPROVED" : "BLOCKED_RATE_DEGRADED",
      message: improved ? "Blocked governance rate decreased." : "Blocked governance rate increased."
    });
  }
  if (metric === "humanReviewRate") {
    insights.push({
      severity: improved ? "info" : "warning",
      code: improved ? "HUMAN_REVIEW_RATE_IMPROVED" : "HUMAN_REVIEW_RATE_DEGRADED",
      message: improved ? "Human review rate decreased." : "Human review rate increased."
    });
  }
  if (metric === "validationSuccessRate") {
    insights.push({
      severity: improved ? "info" : "warning",
      code: improved ? "VALIDATION_SUCCESS_IMPROVED" : "VALIDATION_SUCCESS_DEGRADED",
      message: improved ? "Validation success rate improved." : "Validation success rate decreased."
    });
  }
  if (metric === "averageTrustScore") {
    insights.push({
      severity: improved ? "info" : "warning",
      code: improved ? "TRUST_SCORE_IMPROVED" : "TRUST_SCORE_DEGRADED",
      message: improved ? "Average trust score increased." : "Average trust score decreased."
    });
  }
  if (metric === "readyRate") {
    insights.push({
      severity: improved ? "info" : "warning",
      code: improved ? "READY_RATE_IMPROVED" : "READY_RATE_DEGRADED",
      message: improved ? "Ready governance rate increased." : "Ready governance rate decreased."
    });
  }
}

function buildInsights(metrics: GovernanceArchiveDiff["metrics"], status: GovernanceArchiveDiffStatus): GovernanceArchiveDiff["insights"] {
  const insights: GovernanceArchiveDiff["insights"] = [];
  for (const [metric, delta] of Object.entries(metrics)) {
    addInsight(insights, metric, delta);
  }

  if (status === "stable") {
    insights.push({
      severity: "info",
      code: "GOVERNANCE_STABLE",
      message: "Governance metrics remained stable."
    });
  }
  if (status === "unknown") {
    insights.push({
      severity: "warning",
      code: "GOVERNANCE_DIFF_UNKNOWN",
      message: "Governance metrics could not be compared."
    });
  }

  return insights;
}

function generatedAtFor(current: LoadedGovernanceArchiveSnapshot): string {
  if (typeof current.data === "object" && current.data !== null) {
    const data = current.data as { generatedAt?: unknown };
    if (typeof data.generatedAt === "string") return data.generatedAt;
  }
  return current.entry.createdAt || UNKNOWN_GENERATED_AT;
}

export function buildGovernanceArchiveDiff(input: {
  previous: LoadedGovernanceArchiveSnapshot;
  current: LoadedGovernanceArchiveSnapshot;
}): GovernanceArchiveDiff {
  if (input.previous.entry.kind !== input.current.entry.kind) {
    throw new Error("Archive diff requires both archives to have the same kind.");
  }
  if (!isSupportedDiffKind(input.previous.entry.kind)) {
    throw new Error("Archive diff currently supports: governance-insights, governance-ci-summary");
  }

  const metrics = metricDeltas(input.previous.entry.kind, input.previous.data, input.current.data);
  const status = classifyStatus(metrics);

  return {
    version: 1,
    archiveA: {
      archiveId: input.previous.entry.archiveId,
      createdAt: input.previous.entry.createdAt,
      kind: input.previous.entry.kind
    },
    archiveB: {
      archiveId: input.current.entry.archiveId,
      createdAt: input.current.entry.createdAt,
      kind: input.current.entry.kind
    },
    comparison: {
      status,
      summary: statusSummary(status)
    },
    metrics,
    insights: buildInsights(metrics, status),
    generatedAt: generatedAtFor(input.current)
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

export function renderGovernanceArchiveDiffMarkdown(diff: GovernanceArchiveDiff): string {
  const lines = [
    "# AI Software Factory - Governance Archive Diff",
    "",
    "Archive A:",
    `- ${diff.archiveA.archiveId}`,
    `- ${diff.archiveA.kind}`,
    "",
    "Archive B:",
    `- ${diff.archiveB.archiveId}`,
    `- ${diff.archiveB.kind}`,
    "",
    "Comparison status:",
    diff.comparison.status,
    "",
    "Summary:",
    diff.comparison.summary,
    "",
    "## Metric Deltas",
    "",
    "| Metric | Previous | Current | Delta |",
    "|---|---|---|---|"
  ];

  for (const [metric, delta] of Object.entries(diff.metrics)) {
    lines.push(`| ${metric} | ${formatValue(delta.previous)} | ${formatValue(delta.current)} | ${formatDelta(delta.delta)} |`);
  }

  lines.push("", "## Insights", "");
  if (diff.insights.length === 0) {
    lines.push("- none");
  } else {
    for (const insight of diff.insights) {
      lines.push(`- [${insight.severity}] ${insight.code} - ${insight.message}`);
    }
  }

  return `${lines.join("\n")}\n`;
}

export function renderGovernanceArchiveDiffText(diff: GovernanceArchiveDiff): string {
  return renderGovernanceArchiveDiffMarkdown(diff);
}
