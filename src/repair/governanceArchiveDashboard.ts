import type {
  GovernanceArchiveIndex,
  GovernanceArchiveIndexEntry,
  GovernanceArchiveKind
} from "./governanceArchiveIndex.js";
import { GOVERNANCE_ARCHIVE_KINDS } from "./governanceArchiveIndex.js";

export type GovernanceArchiveDashboardOptions = {
  latestOnly?: boolean;
  kind?: GovernanceArchiveKind;
  limit?: number;
};

export type GovernanceArchiveDashboardResult = {
  totalArchives: number;
  displayedArchives: number;
  filters: {
    latestOnly?: boolean;
    kind?: GovernanceArchiveKind;
    limit?: number;
  };
  summary: {
    runsDashboard: number;
    governanceInsights: number;
    governanceCiSummary: number;
  };
  rows: Array<{
    archiveId: string;
    createdAt: string;
    kind: GovernanceArchiveKind;
    archiveDir: string;
    fileCount: number;
    files: string[];
    profile?: string;
    exportFormat?: string;
    ciStatus?: string;
    runCount?: number;
    displayedRuns?: number;
  }>;
  warnings?: string[];
};

const DEFAULT_ARCHIVE_DASHBOARD_LIMIT = 20;

function normalizeLimit(limit: number | undefined): number {
  return typeof limit === "number" && Number.isInteger(limit) && limit > 0 ? limit : DEFAULT_ARCHIVE_DASHBOARD_LIMIT;
}

function stableFilters(options: GovernanceArchiveDashboardOptions = {}): GovernanceArchiveDashboardResult["filters"] {
  const filters: GovernanceArchiveDashboardResult["filters"] = {};
  if (options.latestOnly) filters.latestOnly = true;
  if (options.kind) filters.kind = options.kind;
  if (options.limit !== undefined) filters.limit = options.limit;
  return filters;
}

function sortNewestFirst(entries: GovernanceArchiveIndexEntry[]): GovernanceArchiveIndexEntry[] {
  return [...entries].sort((a, b) => {
    const createdOrder = b.createdAt.localeCompare(a.createdAt);
    if (createdOrder !== 0) return createdOrder;
    const archiveOrder = a.archiveId.localeCompare(b.archiveId);
    if (archiveOrder !== 0) return archiveOrder;
    return a.kind.localeCompare(b.kind);
  });
}

function summarize(entries: GovernanceArchiveIndexEntry[]): GovernanceArchiveDashboardResult["summary"] {
  return entries.reduce(
    (summary, entry) => {
      if (entry.kind === "runs-dashboard") summary.runsDashboard += 1;
      if (entry.kind === "governance-insights") summary.governanceInsights += 1;
      if (entry.kind === "governance-ci-summary") summary.governanceCiSummary += 1;
      return summary;
    },
    {
      runsDashboard: 0,
      governanceInsights: 0,
      governanceCiSummary: 0
    }
  );
}

function toRow(entry: GovernanceArchiveIndexEntry): GovernanceArchiveDashboardResult["rows"][number] {
  return {
    archiveId: entry.archiveId,
    createdAt: entry.createdAt,
    kind: entry.kind,
    archiveDir: entry.archiveDir,
    fileCount: entry.files.length,
    files: entry.files,
    profile: entry.metadata?.profile,
    exportFormat: entry.metadata?.exportFormat,
    ciStatus: entry.metadata?.ciStatus,
    runCount: entry.metadata?.runCount,
    displayedRuns: entry.metadata?.displayedRuns
  };
}

export function isGovernanceArchiveKind(value: string): value is GovernanceArchiveKind {
  return GOVERNANCE_ARCHIVE_KINDS.includes(value as GovernanceArchiveKind);
}

export function buildGovernanceArchiveDashboard(
  index: GovernanceArchiveIndex,
  options: GovernanceArchiveDashboardOptions = {}
): GovernanceArchiveDashboardResult {
  const allArchives = Array.isArray(index.archives) ? index.archives : [];
  let filtered = sortNewestFirst(allArchives);

  if (options.kind) {
    filtered = filtered.filter((entry) => entry.kind === options.kind);
  }

  const limited = options.latestOnly ? filtered.slice(0, 1) : filtered.slice(0, normalizeLimit(options.limit));

  return {
    totalArchives: allArchives.length,
    displayedArchives: limited.length,
    filters: stableFilters(options),
    summary: summarize(allArchives),
    rows: limited.map(toRow)
  };
}

export function buildMissingGovernanceArchiveDashboard(
  options: GovernanceArchiveDashboardOptions = {}
): GovernanceArchiveDashboardResult {
  return {
    totalArchives: 0,
    displayedArchives: 0,
    filters: stableFilters(options),
    summary: {
      runsDashboard: 0,
      governanceInsights: 0,
      governanceCiSummary: 0
    },
    rows: [],
    warnings: ["No archive index found"]
  };
}

function formatCell(value: string, width: number): string {
  return value.length >= width ? value : value.padEnd(width, " ");
}

function formatValue(value: unknown): string {
  if (value === undefined || value === null || value === "") return "-";
  return String(value);
}

export function renderGovernanceArchiveDashboardText(result: GovernanceArchiveDashboardResult): string {
  if (result.warnings?.includes("No archive index found")) {
    return [
      "# AI Software Factory - Governance Archive Dashboard",
      "",
      "No archive index found.",
      "Run an export with --archive first to generate .factory/archive-index.json."
    ].join("\n");
  }

  const lines = [
    "# AI Software Factory - Governance Archive Dashboard",
    "",
    `Total archived snapshots: ${result.totalArchives}`,
    `Displayed snapshots: ${result.displayedArchives}`,
    "",
    "Summary:",
    `- runs-dashboard: ${result.summary.runsDashboard}`,
    `- governance-insights: ${result.summary.governanceInsights}`,
    `- governance-ci-summary: ${result.summary.governanceCiSummary}`,
    "",
    "Archives:",
    `${formatCell("archiveId", 32)}${formatCell("kind", 24)}${formatCell("files", 7)}${formatCell("profile", 14)}ciStatus`
  ];

  if (result.rows.length === 0) {
    lines.push("- none");
    return lines.join("\n");
  }

  for (const row of result.rows) {
    lines.push(
      `${formatCell(row.archiveId, 32)}${formatCell(row.kind, 24)}${formatCell(String(row.fileCount), 7)}${formatCell(formatValue(row.profile), 14)}${formatValue(row.ciStatus)}`
    );
  }

  return lines.join("\n");
}
