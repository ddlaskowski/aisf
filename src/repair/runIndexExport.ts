import path from "node:path";
import fs from "fs-extra";
import { getRunsIndexPath, type RunsIndex } from "./runIndex.js";
import {
  buildMissingRunIndexDashboard,
  buildRunIndexDashboard,
  type RunIndexDashboardOptions,
  type RunIndexDashboardResult,
  type RunIndexDashboardRow
} from "./runIndexDashboard.js";

export type RunIndexExportFormat = "json" | "markdown" | "csv" | "all";

export type RunIndexExportOptions = {
  format: RunIndexExportFormat;
  outputDir?: string;
  limit?: number;
  status?: string;
  blockedOnly?: boolean;
  humanReviewOnly?: boolean;
  latestOnly?: boolean;
};

export type RunIndexExportResult = {
  exported: boolean;
  outputDir: string;
  files: string[];
  format: RunIndexExportFormat;
  displayedRuns: number;
  warnings: string[];
};

const EXPORT_FILENAMES: Record<Exclude<RunIndexExportFormat, "all">, string> = {
  json: "runs-dashboard.json",
  markdown: "runs-dashboard.md",
  csv: "runs-dashboard.csv"
};

function normalizeSlash(value: string): string {
  return value.split(path.sep).join("/");
}

function relativePath(projectRoot: string, filePath: string): string {
  return normalizeSlash(path.relative(projectRoot, filePath));
}

function resolveOutputDir(projectRoot: string, outputDir?: string): string {
  if (!outputDir) {
    return path.join(projectRoot, ".factory", "exports");
  }
  const resolved = path.resolve(projectRoot, outputDir);
  const relative = path.relative(projectRoot, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Export outputDir must stay within the project root.");
  }
  return resolved;
}

function formatsToWrite(format: RunIndexExportFormat): Array<Exclude<RunIndexExportFormat, "all">> {
  return format === "all" ? ["json", "markdown", "csv"] : [format];
}

function dashboardOptions(options: RunIndexExportOptions): RunIndexDashboardOptions {
  return {
    limit: options.limit,
    status: options.status,
    blockedOnly: options.blockedOnly,
    humanReviewOnly: options.humanReviewOnly,
    latestOnly: options.latestOnly
  };
}

function isValidRunsIndex(value: unknown): value is RunsIndex {
  return typeof value === "object" && value !== null && Array.isArray((value as { runs?: unknown }).runs);
}

function loadDashboard(projectRoot: string, options: RunIndexExportOptions): RunIndexDashboardResult {
  const indexPath = getRunsIndexPath(projectRoot);
  if (!fs.pathExistsSync(indexPath)) {
    return buildMissingRunIndexDashboard(dashboardOptions(options));
  }

  try {
    const index = fs.readJsonSync(indexPath);
    if (!isValidRunsIndex(index)) {
      return {
        ...buildMissingRunIndexDashboard(dashboardOptions(options)),
        warnings: ["Could not read .factory/runs-index.json"]
      };
    }
    return buildRunIndexDashboard(index, dashboardOptions(options));
  } catch {
    return {
      ...buildMissingRunIndexDashboard(dashboardOptions(options)),
      warnings: ["Could not read .factory/runs-index.json"]
    };
  }
}

function formatTrust(row: RunIndexDashboardRow): string {
  const level = row.trustLevel ?? "";
  const score = typeof row.trustScore === "number" ? String(row.trustScore) : "";
  if (level && score) return `${level}/${score}`;
  return level || score;
}

function formatRelease(row: RunIndexDashboardRow): string {
  const decision = row.releaseDecision ?? "";
  const score = typeof row.releaseScore === "number" ? String(row.releaseScore) : "";
  if (decision && score) return `${decision}/${score}`;
  return decision || score;
}

function formatValidation(row: RunIndexDashboardRow): string {
  if (row.validationPassed === true) return "passed";
  if (row.validationPassed === false) return "failed";
  return "";
}

export function renderRunIndexDashboardMarkdown(result: RunIndexDashboardResult): string {
  const lines = [
    "# AI Software Factory — Run Governance Dashboard Export",
    "",
    `Total indexed runs: ${result.totalRuns}`,
    `Displayed runs: ${result.displayedRuns}`,
    "",
    "## Summary",
    "",
    `- ready: ${result.summary.ready}`,
    `- ready-with-caution: ${result.summary.readyWithCaution}`,
    `- manual-review-required: ${result.summary.manualReviewRequired}`,
    `- blocked: ${result.summary.blocked}`,
    "",
    "## Runs",
    ""
  ];

  if (result.rows.length === 0) {
    lines.push("No runs found.");
  } else {
    lines.push("| Run ID | Timestamp | Governance | Trust | Release | Outcome | Validation |");
    lines.push("|---|---|---|---|---|---|---|");
    for (const row of result.rows) {
      lines.push(
        `| ${row.runId} | ${row.timestamp} | ${row.governanceStatus ?? ""} | ${formatTrust(row)} | ${formatRelease(row)} | ${row.repairOutcome ?? ""} | ${formatValidation(row)} |`
      );
    }
  }

  if (result.warnings?.length) {
    lines.push("", "## Warnings", "");
    for (const warning of result.warnings) {
      lines.push(`- ${warning}`);
    }
  }

  return `${lines.join("\n")}\n`;
}

function csvValue(value: unknown): string {
  if (value === undefined || value === null) {
    return "";
  }
  const raw = typeof value === "boolean" ? String(value) : String(value);
  if (/[",\r\n]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

export function renderRunIndexDashboardCsv(result: RunIndexDashboardResult): string {
  const headers = [
    "runId",
    "timestamp",
    "governanceStatus",
    "trustLevel",
    "trustScore",
    "releaseDecision",
    "releaseScore",
    "repairOutcome",
    "validationPassed",
    "canProceed",
    "requiresHumanReview",
    "isBlocked"
  ];
  const lines = [headers.join(",")];

  for (const row of result.rows) {
    lines.push(
      [
        row.runId,
        row.timestamp,
        row.governanceStatus,
        row.trustLevel,
        row.trustScore,
        row.releaseDecision,
        row.releaseScore,
        row.repairOutcome,
        row.validationPassed,
        row.canProceed,
        row.requiresHumanReview,
        row.isBlocked
      ].map(csvValue).join(",")
    );
  }

  return `${lines.join("\n")}\n`;
}

export function exportRunIndexDashboard(projectRoot: string, options: RunIndexExportOptions): RunIndexExportResult {
  const result = loadDashboard(projectRoot, options);
  const outputDir = resolveOutputDir(projectRoot, options.outputDir);
  fs.ensureDirSync(outputDir);

  const files: string[] = [];
  for (const format of formatsToWrite(options.format)) {
    const filePath = path.join(outputDir, EXPORT_FILENAMES[format]);
    if (format === "json") {
      fs.writeFileSync(filePath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
    }
    if (format === "markdown") {
      fs.writeFileSync(filePath, renderRunIndexDashboardMarkdown(result), "utf8");
    }
    if (format === "csv") {
      fs.writeFileSync(filePath, renderRunIndexDashboardCsv(result), "utf8");
    }
    files.push(relativePath(projectRoot, filePath));
  }

  return {
    exported: true,
    outputDir: relativePath(projectRoot, outputDir),
    files,
    format: options.format,
    displayedRuns: result.displayedRuns,
    warnings: result.warnings ?? []
  };
}
