#!/usr/bin/env node
import 'dotenv/config';
import path from "node:path";
import fs from "fs-extra";
import { Command } from "commander";
import chalk from "chalk";
import { z } from "zod";
import { runTask } from "./orchestrator/runTask.js";
import { getRunsIndexPath, type RunsIndex } from "./repair/runIndex.js";
import {
  buildMissingRunIndexDashboard,
  buildRunIndexDashboard,
  renderRunIndexDashboardText,
  RUN_INDEX_DASHBOARD_STATUSES,
  type RunIndexDashboardOptions
} from "./repair/runIndexDashboard.js";
import { exportRunIndexDashboard, type RunIndexExportFormat } from "./repair/runIndexExport.js";

const runInputSchema = z.object({
  repo: z.string().min(1),
  task: z.string().min(1),
  branch: z.boolean().optional(),
  commit: z.boolean().optional(),
  yes: z.boolean().optional()
});

const program = new Command();

function parsePositiveInteger(value: unknown): number | null {
  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    return null;
  }
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function isValidRunsIndex(value: unknown): value is RunsIndex {
  return (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as { runs?: unknown }).runs)
  );
}

function printDashboardResult(result: ReturnType<typeof buildRunIndexDashboard>, asJson: boolean): void {
  if (asJson) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  console.log(renderRunIndexDashboardText(result));
}

function parseExportFormat(value: unknown): RunIndexExportFormat | null {
  if (value === true) {
    return "all";
  }
  if (typeof value !== "string") {
    return null;
  }
  return ["json", "markdown", "csv", "all"].includes(value) ? (value as RunIndexExportFormat) : null;
}

function printExportResult(result: ReturnType<typeof exportRunIndexDashboard>, asJson: boolean): void {
  if (asJson) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log("Exported run dashboard:");
  for (const file of result.files) {
    console.log(`- ${file}`);
  }
  if (result.warnings.length) {
    console.log("Warnings:");
    for (const warning of result.warnings) {
      console.log(`- ${warning}`);
    }
  }
}

program
  .name("factory")
  .description("software-factory CLI v0.1")
  .version("0.1.0");

program
  .command("run")
  .requiredOption("--repo <path>", "Path to target repository")
  .requiredOption("--task <task>", "Task description")
  .option("--branch", "Create factory branch before applying changes")
  .option("--commit", "Auto-commit relevant files after successful validation")
  .option("--yes", "Auto-approve safety prompts for non-interactive runs")
  .action(async (options) => {
    try {
      const parsed = runInputSchema.parse(options);
      const repoPath = path.resolve(parsed.repo);

      const exists = await fs.pathExists(repoPath);
      if (!exists) {
        throw new Error(`Repository path does not exist: ${repoPath}`);
      }

      const stats = await fs.stat(repoPath);
      if (!stats.isDirectory()) {
        throw new Error(`Repository path is not a directory: ${repoPath}`);
      }

      const summary = await runTask({
        repoPath,
        task: parsed.task.trim(),
        createBranch: !!parsed.branch,
        autoCommit: !!parsed.commit,
        autoApprove: !!parsed.yes
      });

      console.log(chalk.bold("\nFinal Summary"));
      console.log(`Run ID: ${summary.runId}`);
      console.log(`Repo: ${summary.repoPath}`);
      console.log(`Task: ${summary.task}`);
      console.log(`Attempts: ${summary.attempts}`);
      console.log(`Applied changes: ${summary.appliedChanges}`);
      console.log(`Final status: ${summary.reviewStatus}`);
      console.log(`Review status: ${summary.reviewStatus}`);
      console.log(`Successful commands: ${summary.successfulCommands.length ? summary.successfulCommands.join(", ") : "None"}`);
      console.log(`Skipped commands: ${summary.skippedCommands.length ? summary.skippedCommands.join(", ") : "None"}`);
      console.log(`Failed commands: ${summary.failedCommands.length ? summary.failedCommands.join(", ") : "None"}`);
      if (summary.notes.length) {
        console.log(`Notes: ${summary.notes.join(" | ")}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error(chalk.red(`Error: ${message}`));
      process.exitCode = 1;
    }
  });

program
  .command("runs")
  .description("Show a read-only dashboard for historical repair runs")
  .option("--repo <path>", "Path to target repository", process.cwd())
  .option("--limit <n>", "Show the latest n runs")
  .option("--status <status>", "Filter by governance status")
  .option("--blocked", "Show only blocked runs")
  .option("--human-review", "Show only runs requiring human review")
  .option("--latest", "Show only the latest run")
  .option("--json", "Print machine-readable JSON")
  .option("--export [format]", "Export dashboard as json, markdown, csv, or all")
  .action(async (options) => {
    const asJson = !!options.json;
    const dashboardOptions: RunIndexDashboardOptions = {
      blockedOnly: !!options.blocked,
      humanReviewOnly: !!options.humanReview,
      latestOnly: !!options.latest,
      json: asJson
    };

    if (options.limit !== undefined) {
      const limit = parsePositiveInteger(options.limit);
      if (limit === null) {
        console.error(`Invalid limit value: ${options.limit}`);
        console.error("Limit must be a positive integer.");
        process.exitCode = 1;
        return;
      }
      dashboardOptions.limit = limit;
    }

    if (options.status !== undefined) {
      if (!RUN_INDEX_DASHBOARD_STATUSES.includes(options.status)) {
        console.error(`Invalid status filter: ${options.status}`);
        console.error(`Allowed statuses: ${RUN_INDEX_DASHBOARD_STATUSES.join(", ")}`);
        process.exitCode = 1;
        return;
      }
      dashboardOptions.status = options.status;
    }

    const repoPath = path.resolve(options.repo);
    if (options.export !== undefined) {
      const exportFormat = parseExportFormat(options.export);
      if (exportFormat === null) {
        console.error(`Invalid export format: ${options.export}`);
        console.error("Allowed formats: json, markdown, csv, all");
        process.exitCode = 1;
        return;
      }

      const exportResult = exportRunIndexDashboard(repoPath, {
        format: exportFormat,
        limit: dashboardOptions.limit,
        status: dashboardOptions.status,
        blockedOnly: dashboardOptions.blockedOnly,
        humanReviewOnly: dashboardOptions.humanReviewOnly,
        latestOnly: dashboardOptions.latestOnly
      });
      printExportResult(exportResult, asJson);
      return;
    }

    const indexPath = getRunsIndexPath(repoPath);
    if (!(await fs.pathExists(indexPath))) {
      printDashboardResult(buildMissingRunIndexDashboard(dashboardOptions), asJson);
      return;
    }

    try {
      const index = await fs.readJson(indexPath);
      if (!isValidRunsIndex(index)) {
        throw new Error("invalid index shape");
      }
      printDashboardResult(buildRunIndexDashboard(index, dashboardOptions), asJson);
    } catch {
      console.error("Could not read .factory/runs-index.json.");
      console.error("Reason: malformed JSON or invalid index shape.");
      process.exitCode = 1;
    }
  });

program.parseAsync(process.argv);
