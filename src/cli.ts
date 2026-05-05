#!/usr/bin/env node
import 'dotenv/config';
import path from "node:path";
import fs from "fs-extra";
import { Command } from "commander";
import chalk from "chalk";
import { z } from "zod";
import { runTask } from "./orchestrator/runTask.js";

const runInputSchema = z.object({
  repo: z.string().min(1),
  task: z.string().min(1),
  branch: z.boolean().optional(),
  commit: z.boolean().optional()
});

const program = new Command();

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
        autoCommit: !!parsed.commit
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

program.parseAsync(process.argv);
