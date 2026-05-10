import type { RunIndexEntry, RunsIndex } from "./runIndex.js";

export type RunIndexDashboardOptions = {
  limit?: number;
  status?: string;
  blockedOnly?: boolean;
  humanReviewOnly?: boolean;
  latestOnly?: boolean;
  json?: boolean;
};

export type RunIndexDashboardRow = {
  runId: string;
  timestamp: string;
  governanceStatus?: string;
  trustLevel?: string;
  trustScore?: number;
  releaseDecision?: string;
  repairOutcome?: string;
  validationPassed?: boolean;
  canProceed?: boolean;
  requiresHumanReview?: boolean;
  isBlocked?: boolean;
};

export type RunIndexDashboardResult = {
  totalRuns: number;
  displayedRuns: number;
  filters: {
    limit?: number;
    status?: string;
    blockedOnly?: boolean;
    humanReviewOnly?: boolean;
    latestOnly?: boolean;
  };
  summary: {
    ready: number;
    readyWithCaution: number;
    manualReviewRequired: number;
    blocked: number;
  };
  rows: RunIndexDashboardRow[];
  warnings?: string[];
};

export const RUN_INDEX_DASHBOARD_STATUSES = [
  "ready",
  "ready-with-caution",
  "manual-review-required",
  "blocked"
] as const;

const DEFAULT_DASHBOARD_LIMIT = 20;

function normalizeLimit(limit: number | undefined): number {
  return typeof limit === "number" && Number.isInteger(limit) && limit > 0 ? limit : DEFAULT_DASHBOARD_LIMIT;
}

function stableFilters(options: RunIndexDashboardOptions = {}): RunIndexDashboardResult["filters"] {
  const filters: RunIndexDashboardResult["filters"] = {};
  if (options.limit !== undefined) filters.limit = options.limit;
  if (options.status) filters.status = options.status;
  if (options.blockedOnly) filters.blockedOnly = true;
  if (options.humanReviewOnly) filters.humanReviewOnly = true;
  if (options.latestOnly) filters.latestOnly = true;
  return filters;
}

function sortNewestFirst(runs: RunIndexEntry[]): RunIndexEntry[] {
  return [...runs].sort((a, b) => {
    const timestampOrder = b.timestamp.localeCompare(a.timestamp);
    return timestampOrder !== 0 ? timestampOrder : b.runId.localeCompare(a.runId);
  });
}

function summarizeRuns(runs: RunIndexEntry[]): RunIndexDashboardResult["summary"] {
  return runs.reduce(
    (summary, run) => {
      if (run.governanceStatus === "ready") summary.ready += 1;
      if (run.governanceStatus === "ready-with-caution") summary.readyWithCaution += 1;
      if (run.governanceStatus === "manual-review-required") summary.manualReviewRequired += 1;
      if (run.governanceStatus === "blocked") summary.blocked += 1;
      return summary;
    },
    {
      ready: 0,
      readyWithCaution: 0,
      manualReviewRequired: 0,
      blocked: 0
    }
  );
}

function toRow(run: RunIndexEntry): RunIndexDashboardRow {
  return {
    runId: run.runId,
    timestamp: run.timestamp,
    governanceStatus: run.governanceStatus,
    trustLevel: run.trustLevel,
    trustScore: run.trustScore,
    releaseDecision: run.releaseDecision,
    repairOutcome: run.repairOutcome,
    validationPassed: run.validationPassed,
    canProceed: run.canProceed,
    requiresHumanReview: run.requiresHumanReview,
    isBlocked: run.isBlocked
  };
}

export function buildRunIndexDashboard(
  index: RunsIndex,
  options: RunIndexDashboardOptions = {}
): RunIndexDashboardResult {
  const allRuns = Array.isArray(index.runs) ? index.runs : [];
  let filteredRuns = sortNewestFirst(allRuns);

  if (options.status) {
    filteredRuns = filteredRuns.filter((run) => run.governanceStatus === options.status);
  }
  if (options.blockedOnly) {
    filteredRuns = filteredRuns.filter((run) => run.isBlocked === true || run.governanceStatus === "blocked");
  }
  if (options.humanReviewOnly) {
    filteredRuns = filteredRuns.filter(
      (run) => run.requiresHumanReview === true || run.governanceStatus === "manual-review-required"
    );
  }

  const limitedRuns = options.latestOnly
    ? filteredRuns.slice(0, 1)
    : filteredRuns.slice(0, normalizeLimit(options.limit));

  return {
    totalRuns: allRuns.length,
    displayedRuns: limitedRuns.length,
    filters: stableFilters(options),
    summary: summarizeRuns(allRuns),
    rows: limitedRuns.map(toRow)
  };
}

export function buildMissingRunIndexDashboard(options: RunIndexDashboardOptions = {}): RunIndexDashboardResult {
  return {
    totalRuns: 0,
    displayedRuns: 0,
    filters: stableFilters(options),
    summary: {
      ready: 0,
      readyWithCaution: 0,
      manualReviewRequired: 0,
      blocked: 0
    },
    rows: [],
    warnings: ["No runs index found"]
  };
}

function formatCell(value: string, width: number): string {
  return value.length >= width ? value : value.padEnd(width, " ");
}

function formatTrust(row: RunIndexDashboardRow): string {
  const level = row.trustLevel ?? "unknown";
  const score = typeof row.trustScore === "number" ? String(row.trustScore) : "unknown";
  return `${level}/${score}`;
}

function formatValidation(row: RunIndexDashboardRow): string {
  if (row.validationPassed === true) return "passed";
  if (row.validationPassed === false) return "failed";
  return "unknown";
}

export function renderRunIndexDashboardText(result: RunIndexDashboardResult): string {
  if (result.warnings?.includes("No runs index found")) {
    return [
      "# AI Software Factory — Run Governance Dashboard",
      "",
      "No runs index found.",
      "Run a repair task first to generate .factory/runs-index.json."
    ].join("\n");
  }

  const lines = [
    "# AI Software Factory — Run Governance Dashboard",
    "",
    `Total indexed runs: ${result.totalRuns}`,
    `Displayed runs: ${result.displayedRuns}`,
    "",
    "Summary:",
    `- ready: ${result.summary.ready}`,
    `- ready-with-caution: ${result.summary.readyWithCaution}`,
    `- manual-review-required: ${result.summary.manualReviewRequired}`,
    `- blocked: ${result.summary.blocked}`,
    "",
    "Runs:",
    `${formatCell("runId", 20)}${formatCell("status", 23)}${formatCell("trust", 13)}${formatCell("release", 21)}${formatCell("outcome", 13)}validation`
  ];

  if (result.rows.length === 0) {
    lines.push("- none");
    return lines.join("\n");
  }

  for (const row of result.rows) {
    lines.push(
      `${formatCell(row.runId, 20)}${formatCell(row.governanceStatus ?? "unknown", 23)}${formatCell(formatTrust(row), 13)}${formatCell(row.releaseDecision ?? "unknown", 21)}${formatCell(row.repairOutcome ?? "unknown", 13)}${formatValidation(row)}`
    );
  }

  return lines.join("\n");
}
