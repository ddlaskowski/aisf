import path from "node:path";
import fs from "fs-extra";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import type { ChangeOperation, FactoryRunInput, ReviewResult, RunSummary } from "../types/index.js";
import { intakeAgent } from "../agents/intake.js";
import { plannerAgent } from "../agents/planner.js";
import { builderAgent } from "../agents/builder.js";
import { reviewerAgent } from "../agents/reviewer.js";
import { readRepoSummary } from "../tools/repoReader.js";
import { applyOperation } from "../tools/fileEditor.js";
import { runAllowedCommands } from "../tools/commandRunner.js";
import { getChangedFiles, getDiffSummary, getGitDiffStat } from "../tools/diffTool.js";
import { buildFactoryBranchName, createBranch, getGitStatusShort, hasUncommittedChanges, isGitRepo } from "../tools/gitTool.js";
import { parseWithSchema } from "../tools/jsonGuard.js";
import { briefSchema } from "../schemas/brief.schema.js";
import { planSchema } from "../schemas/plan.schema.js";
import { changesSchema } from "../schemas/changes.schema.js";
import { reviewSchema } from "../schemas/review.schema.js";
import { requestApplyApproval } from "./approvals.js";
import { createRunId, initRun, saveStateFile } from "./state.js";

function detectMode(task: string): "feature" | "bugfix" {
  const t = task.toLowerCase();
  const bugKeywords = ["fix", "bug", "error", "crash", "failing", "broken"];
  return bugKeywords.some((k) => t.includes(k)) ? "bugfix" : "feature";
}

function extractRuntimeError(commandResults: { status: string; stderr: string; stdout: string }[]): string {
  const failedForRetry = commandResults.filter((r) => r.status === "failed");
  return failedForRetry.map((r) => (r.stderr && r.stderr.trim() ? r.stderr : r.stdout)).find((m) => m && m.trim()) ?? "";
}

function findErrorFileFromStack(runtimeError: string): string | null {
  const match = runtimeError.match(/([A-Za-z]:\\[^:\n]+?\.(?:js|ts|cjs|mjs)|[\w./\\-]+\.(?:js|ts|cjs|mjs)):\d+:\d+/);
  return match ? match[1] : null;
}

function shortTaskSummary(task: string): string {
  return task.trim().replace(/\s+/g, " ").toLowerCase().slice(0, 72);
}

function buildCommitMessage(mode: "feature" | "bugfix", task: string): string {
  return `${mode === "bugfix" ? "fix" : "feat"}: ${shortTaskSummary(task)}`;
}

function uniqueSorted(items: string[]): string[] {
  return Array.from(new Set(items)).sort((a, b) => a.localeCompare(b));
}

async function confirmContinueWithDirtyRepo(statusBefore: string): Promise<boolean> {
  console.log("Repository has existing uncommitted changes.");
  console.log(statusBefore || "(no status output)");
  const rl = readline.createInterface({ input, output });
  try {
    const ans = await rl.question("Continue anyway? (y/N): ");
    return ans.trim().toLowerCase() === "y";
  } finally {
    rl.close();
  }
}

async function buildDeterministicDuplicateDeclarationFix(
  repoPath: string,
  runtimeError: string
): Promise<ChangeOperation[] | null> {
  const dupMatch = runtimeError.match(/SyntaxError:\s*Identifier\s+'([^']+)'\s+has already been declared/i);
  if (!dupMatch) {
    return null;
  }

  const identifier = dupMatch[1];
  const fileFromStack = findErrorFileFromStack(runtimeError);
  const defaultRel = "index.js";
  const targetPath = fileFromStack
    ? path.isAbsolute(fileFromStack)
      ? fileFromStack
      : path.resolve(repoPath, fileFromStack)
    : path.resolve(repoPath, defaultRel);

  const rel = path.relative(repoPath, targetPath);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    return null;
  }
  const relNormalized = rel.split(path.sep).join("/");

  const exists = await fs.pathExists(targetPath);
  if (!exists) {
    return null;
  }

  const content = await fs.readFile(targetPath, "utf8");
  const lines = content.split(/\r?\n/);
  const declRegex = new RegExp(
    `^\\s*(?:const|let|var)\\s+${identifier}\\b|^\\s*import\\s+.*\\b${identifier}\\b.*from\\s+["']`,
    "i"
  );

  const matchedIndexes: number[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    if (declRegex.test(lines[i])) {
      matchedIndexes.push(i);
    }
  }

  if (matchedIndexes.length <= 1) {
    return null;
  }

  const ops: ChangeOperation[] = [];
  for (let i = 1; i < matchedIndexes.length; i += 1) {
    const idx = matchedIndexes[i];
    const line = lines[idx];
    ops.push({
      type: "modify",
      path: relNormalized,
      patch: {
        content: `// Removed duplicate declaration: ${line}`,
        replace: {
          target: line,
          with: `// Removed duplicate declaration: ${line}`
        }
      },
      reason: "Deterministic fix for duplicate declaration"
    });
  }

  return ops.length > 0 ? ops : null;
}

async function applyNonDeleteOperations(repoPath: string, operations: ChangeOperation[]) {
  for (const op of operations) {
    if (op.type === "delete") {
      continue;
    }
    await applyOperation(repoPath, op, false);
  }
}

export async function runTask(inputData: FactoryRunInput): Promise<RunSummary> {
  const input: FactoryRunInput = {
    repoPath: inputData.repoPath,
    task: inputData.task,
    createBranch: !!inputData.createBranch
  };

  const repoPath = path.resolve(input.repoPath);
  console.log("Running software-factory pipeline...");
  const mode = detectMode(input.task);
  console.log(`Mode detected: ${mode}`);

  const runId = createRunId();
  const state = await initRun(repoPath, runId);

  const gitRepo = await isGitRepo(repoPath);
  const statusBefore = gitRepo ? await getGitStatusShort(repoPath) : "";
  const hadUncommittedChanges = gitRepo ? await hasUncommittedChanges(repoPath) : false;
  let branchCreated = false;
  let branchName = "";

  if (gitRepo && hadUncommittedChanges) {
    const continueAnyway = await confirmContinueWithDirtyRepo(statusBefore);
    if (!continueAnyway) {
      const summary: RunSummary = {
        runId: state.runId,
        repoPath,
        task: input.task,
        attempts: 1,
        appliedChanges: 0,
        successfulCommands: [],
        skippedCommands: [],
        failedCommands: [],
        reviewStatus: "fail",
        notes: ["Stopped because repository had uncommitted changes and user declined to continue."]
      };
      await saveStateFile(state.runDir, "summary.json", summary);
      await saveStateFile(state.runDir, "git-safety.json", {
        isGitRepo: gitRepo,
        hadUncommittedChanges,
        statusBefore,
        branchCreated,
        branchName
      });
      return summary;
    }
  }

  if (gitRepo && input.createBranch) {
    const desired = buildFactoryBranchName(mode, input.task);
    branchName = await createBranch(repoPath, desired);
    branchCreated = true;
  }

  await saveStateFile(state.runDir, "git-safety.json", {
    isGitRepo: gitRepo,
    hadUncommittedChanges,
    statusBefore,
    branchCreated,
    branchName
  });

  await saveStateFile(state.runDir, "input.json", input);

  const repoSummary = await readRepoSummary(repoPath);
  await saveStateFile(state.runDir, "repo-summary.json", repoSummary);

  const brief = parseWithSchema(briefSchema, await intakeAgent(input.task, repoSummary), "Brief");
  await saveStateFile(state.runDir, "brief.json", brief);

  const plan = parseWithSchema(planSchema, await plannerAgent(brief, repoSummary), "Plan");
  await saveStateFile(state.runDir, "plan.json", plan);

  const initialChanges = parseWithSchema(
    changesSchema,
    await builderAgent(brief, plan, repoSummary, undefined, { runDir: state.runDir, repoPath, mode }),
    "Changeset"
  );
  await saveStateFile(state.runDir, "changes.json", initialChanges);

  let notes: string[] = [];
  let totalAppliedChanges = 0;
  let attempts = 1;
  let previousOperations = initialChanges.operations.map((op) => ({ type: op.type, path: op.path, reason: op.reason }));
  const appliedPaths: string[] = [];

  if (initialChanges.operations.length > 0) {
    const approved = await requestApplyApproval(initialChanges);
    if (!approved) {
      console.log("Changes rejected. Stopping safely.");
      const summary: RunSummary = {
        runId: state.runId,
        repoPath,
        task: input.task,
        attempts,
        appliedChanges: 0,
        successfulCommands: [],
        skippedCommands: plan.proposedCommands,
        failedCommands: [],
        reviewStatus: "fail",
        notes: ["User declined proposed changes."]
      };
      await saveStateFile(state.runDir, "summary.json", summary);
      return summary;
    }

    console.log("Changes approved. Applying file operations...");
    console.log("Applying changes and running post-approval steps...");
    await applyNonDeleteOperations(repoPath, initialChanges.operations);
    totalAppliedChanges = initialChanges.operations.filter((op) => op.type !== "delete").length;
    appliedPaths.push(...initialChanges.operations.filter((op) => op.type !== "delete").map((op) => op.path));
  } else {
    notes.push("No file operations were generated; feature implementation was not applied.");
  }

  let commandResults = await runAllowedCommands(plan.proposedCommands, repoPath);
  await saveStateFile(state.runDir, "command-results.json", commandResults);

  let diffSummary = await getDiffSummary(repoPath);
  let review: ReviewResult = parseWithSchema(
    reviewSchema,
    await reviewerAgent(brief, plan, commandResults, diffSummary),
    "ReviewResult"
  );
  await saveStateFile(state.runDir, "review.json", review);

  let selfHealingAttempt = 0;
  while (review.verdict === "fail" && selfHealingAttempt < 2) {
    selfHealingAttempt += 1;
    console.log(`Self-healing attempt ${selfHealingAttempt}`);
    const runtimeErrorForRetry = extractRuntimeError(commandResults);
    if (runtimeErrorForRetry) {
      console.log("Runtime error passed to AI:");
      console.log(runtimeErrorForRetry);
    }

    let candidateChanges: { operations: ChangeOperation[] } | null = null;
    const deterministicOps = await buildDeterministicDuplicateDeclarationFix(repoPath, runtimeErrorForRetry);
    if (deterministicOps && deterministicOps.length > 0) {
      console.log("Deterministic duplicate-declaration fixer generated patch operations.");
      candidateChanges = { operations: deterministicOps };
    } else {
      candidateChanges = await builderAgent(brief, plan, repoSummary, review, {
        runDir: state.runDir,
        repoPath,
        mode,
        recentCommandResults: commandResults,
        previousOperations,
        selfHealingAttempt
      });
    }

    const fixChanges = parseWithSchema(changesSchema, candidateChanges, `SelfHealingChangeset${selfHealingAttempt}`);
    await saveStateFile(state.runDir, `self-heal-${selfHealingAttempt}-changes.json`, fixChanges);

    if (fixChanges.operations.length === 0) {
      notes.push(`Self-healing attempt ${selfHealingAttempt} generated no file operations.`);
      break;
    }

    const fixApproved = await requestApplyApproval(fixChanges);
    if (!fixApproved) {
      console.log("Changes rejected. Stopping safely.");
      review = {
        verdict: "fail",
        status: "fail",
        notes: [...review.notes, "User declined self-healing changes."]
      };
      break;
    }

    console.log("Changes approved. Applying file operations...");
    console.log("Applying fix changes...");
    await applyNonDeleteOperations(repoPath, fixChanges.operations);
    totalAppliedChanges += fixChanges.operations.filter((op) => op.type !== "delete").length;
    appliedPaths.push(...fixChanges.operations.filter((op) => op.type !== "delete").map((op) => op.path));
    previousOperations = fixChanges.operations.map((op) => ({ type: op.type, path: op.path, reason: op.reason }));

    console.log("Re-running commands...");
    commandResults = await runAllowedCommands(plan.proposedCommands, repoPath);
    await saveStateFile(state.runDir, `command-results-self-heal-${selfHealingAttempt}.json`, commandResults);

    diffSummary = await getDiffSummary(repoPath);
    review = parseWithSchema(
      reviewSchema,
      await reviewerAgent(brief, plan, commandResults, diffSummary),
      `ReviewResultAfterSelfHeal${selfHealingAttempt}`
    );
    await saveStateFile(state.runDir, `review-self-heal-${selfHealingAttempt}.json`, review);
    attempts += 1;
  }

  const skippedCommands = commandResults.filter((r) => r.status === "skipped").map((r) => r.command);
  const successfulCommands = commandResults.filter((r) => r.status === "success").map((r) => r.command);
  const failedCommands = commandResults.filter((r) => r.status === "failed").map((r) => r.command);

  const summary: RunSummary = {
    runId: state.runId,
    repoPath,
    task: input.task,
    attempts,
    appliedChanges: totalAppliedChanges,
    successfulCommands,
    skippedCommands,
    failedCommands,
    reviewStatus: review.verdict,
    notes: [...review.notes, ...notes]
  };

  await saveStateFile(state.runDir, "summary.json", summary);

  const gitDiffStat = await getGitDiffStat(repoPath);
  const gitChangedFiles = await getChangedFiles(repoPath);
  const changedFiles = gitChangedFiles.length > 0 ? uniqueSorted(gitChangedFiles) : uniqueSorted(appliedPaths);
  const commitMessage = buildCommitMessage(mode, input.task);

  const finalReport = [
    `# Final Report`,
    "",
    `- Run ID: ${state.runId}`,
    `- Task: ${input.task}`,
    `- Mode: ${mode}`,
    `- Attempts: ${attempts}`,
    `- Final status: ${review.verdict}`,
    `- Applied changes count: ${totalAppliedChanges}`,
    `- Git repo: ${gitRepo ? "yes" : "no"}`,
    `- Existing uncommitted changes: ${hadUncommittedChanges ? "yes" : "no"}`,
    `- Branch created: ${branchCreated ? "yes" : "no"}`,
    `- Branch name: ${branchCreated ? branchName : "n/a"}`,
    `- Successful commands: ${successfulCommands.length ? successfulCommands.join(", ") : "None"}`,
    `- Skipped commands: ${skippedCommands.length ? skippedCommands.join(", ") : "None"}`,
    `- Failed commands: ${failedCommands.length ? failedCommands.join(", ") : "None"}`,
    "",
    `## Changed Files`,
    changedFiles.length ? changedFiles.map((f) => `- ${f}`).join("\n") : "- None",
    "",
    `## Diff Stat`,
    "```",
    gitDiffStat,
    "```",
    "",
    `## Suggested Commit Message`,
    "```",
    commitMessage,
    "```",
    ""
  ].join("\n");

  const finalReportPath = path.join(state.runDir, "final-report.md");
  await fs.writeFile(finalReportPath, finalReport, "utf8");
  console.log(`Final report saved to: ${finalReportPath}`);
  console.log(`Suggested commit message: ${commitMessage}`);

  console.log("Run completed.");
  return summary;
}
