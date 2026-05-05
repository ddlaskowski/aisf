import path from "node:path";
import fs from "fs-extra";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import type { ChangeOperation, Changeset, CommandResult, FactoryRunInput, ReviewResult, RunSummary } from "../types/index.js";
import { intakeAgent } from "../agents/intake.js";
import { plannerAgent } from "../agents/planner.js";
import { builderAgent } from "../agents/builder.js";
import { reviewerAgent } from "../agents/reviewer.js";
import { readRepoSummary } from "../tools/repoReader.js";
import { applyOperation } from "../tools/fileEditor.js";
import { runAllowedCommands } from "../tools/commandRunner.js";
import { getChangedFiles, getDiffSummary, getGitDiffStat } from "../tools/diffTool.js";
import {
  buildFactoryBranchName,
  commit as gitCommit,
  createBranch,
  getGitStatusShort,
  hasUncommittedChanges,
  isGitRepo,
  stageFiles
} from "../tools/gitTool.js";
import { parseWithSchema } from "../tools/jsonGuard.js";
import { briefSchema } from "../schemas/brief.schema.js";
import { planSchema } from "../schemas/plan.schema.js";
import { changesSchema } from "../schemas/changes.schema.js";
import { reviewSchema } from "../schemas/review.schema.js";
import { requestApplyApproval, shouldAutoApprove } from "./approvals.js";
import { createRunId, initRun, saveStateFile } from "./state.js";
import { classifyFailure, type FailureMemoryEntry } from "../failure/failureClassifier.js";
import { shouldContinueRetry } from "../failure/retryControl.js";
import { generateSafeReplacementPatch } from "../fixers/safeReplacement.js";
import { generateGuardCallPatch } from "../fixers/guardCall.js";

function detectMode(task: string): "feature" | "bugfix" {
  const t = task.toLowerCase();
  const bugKeywords = ["fix", "bug", "error", "crash", "failing", "broken"];
  return bugKeywords.some((k) => t.includes(k)) ? "bugfix" : "feature";
}

function extractRuntimeError(commandResults: { status: string; stderr: string; stdout: string }[]): string {
  const failedForRetry = commandResults.filter((r) => r.status === "failed");
  return failedForRetry.map((r) => (r.stderr && r.stderr.trim() ? r.stderr : r.stdout)).find((m) => m && m.trim()) ?? "";
}

function classifyCommandFailure(
  commandResults: { status: string; stderr: string; stdout: string; exitCode?: number | null }[]
): ReturnType<typeof classifyFailure> {
  const failedValidationResult = commandResults.find((r) => r.status === "failed");
  return classifyFailure({
    stdout: failedValidationResult?.stdout ?? "",
    stderr: failedValidationResult?.stderr ?? extractRuntimeError(commandResults),
    exitCode: failedValidationResult?.exitCode ?? null
  });
}

function isInstallableMissingModule(moduleName: string): boolean {
  if (moduleName.startsWith(".") || moduleName.startsWith("/") || moduleName.includes("node:")) {
    return false;
  }

  return /^(@[a-z0-9._-]+\/)?[a-z0-9._-]+$/i.test(moduleName);
}

function findErrorFileFromStack(runtimeError: string): string | null {
  const match = runtimeError.match(/([A-Za-z]:\\[^:\n]+?\.(?:js|ts|cjs|mjs)|[\w./\\-]+\.(?:js|ts|cjs|mjs)):\d+:\d+/);
  return match ? match[1] : null;
}

async function readFailureTargetFile(
  repoPath: string,
  runtimeError: string
): Promise<{ relPath: string; content: string } | null> {
  const fileFromStack = findErrorFileFromStack(runtimeError);
  const targetPath = fileFromStack
    ? path.isAbsolute(fileFromStack)
      ? fileFromStack
      : path.resolve(repoPath, fileFromStack)
    : path.resolve(repoPath, "index.js");

  const rel = path.relative(repoPath, targetPath);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    return null;
  }

  const exists = await fs.pathExists(targetPath);
  if (!exists) {
    return null;
  }

  const stat = await fs.stat(targetPath);
  if (!stat.isFile()) {
    return null;
  }

  return {
    relPath: rel.split(path.sep).join("/"),
    content: await fs.readFile(targetPath, "utf8")
  };
}

async function buildSafeReplacementFix(
  repoPath: string,
  runtimeError: string,
  symbol?: string
): Promise<ChangeOperation[] | null> {
  if (!symbol) {
    return null;
  }

  const targetFile = await readFailureTargetFile(repoPath, runtimeError);
  if (!targetFile) {
    return null;
  }

  const result = generateSafeReplacementPatch({
    fileContent: targetFile.content,
    symbol
  });

  if (!result.applied || !result.operations?.length) {
    return null;
  }

  console.log(`Applied safe-replacement for symbol: ${symbol}`);
  return result.operations.map((op) => ({
    type: op.type,
    path: targetFile.relPath,
    patch: op.patch,
    reason: op.reason
  }));
}

async function buildGuardCallFix(
  repoPath: string,
  runtimeError: string,
  symbol?: string
): Promise<ChangeOperation[] | null> {
  if (!symbol) {
    return null;
  }

  const targetFile = await readFailureTargetFile(repoPath, runtimeError);
  if (!targetFile) {
    return null;
  }

  const result = generateGuardCallPatch({
    fileContent: targetFile.content,
    symbol
  });

  if (!result.applied || !result.operations?.length) {
    return null;
  }

  console.log(`Applied guard-call for symbol: ${symbol}`);
  return result.operations.map((op) => ({
    type: op.type,
    path: targetFile.relPath,
    patch: op.patch,
    reason: op.reason
  }));
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

function buildFailureMemoryEntry(
  attempt: number,
  failure: ReturnType<typeof classifyFailure>,
  changeApplied: boolean,
  note: string
): FailureMemoryEntry {
  return {
    attempt,
    type: failure.type,
    strategy: failure.strategy,
    message: failure.details.rawMessage,
    symbol: failure.details.symbol,
    moduleName: failure.details.moduleName,
    changeApplied,
    note
  };
}

async function rememberFailure(
  runDir: string,
  memory: FailureMemoryEntry[],
  entry: FailureMemoryEntry
): Promise<void> {
  const existingIndex = memory.findIndex((item) => item.attempt === entry.attempt);
  if (existingIndex >= 0) {
    memory[existingIndex] = entry;
  } else {
    memory.push(entry);
  }
  await saveStateFile(runDir, "failure-memory.json", memory);
}

async function saveRetryStop(
  runDir: string,
  attempt: number,
  reason: string,
  currentFailure: ReturnType<typeof classifyFailure>,
  failureMemory: FailureMemoryEntry[]
): Promise<void> {
  await saveStateFile(runDir, "retry-stop.json", {
    attempt,
    reason,
    currentFailure,
    failureMemory
  });
}

async function confirmContinueWithDirtyRepo(statusBefore: string, autoApprove = false): Promise<boolean> {
  console.log("Repository has existing uncommitted changes.");
  console.log(statusBefore || "(no status output)");
  if (shouldAutoApprove(autoApprove)) {
    console.log("Auto-approved due to --yes / SOFTWARE_FACTORY_YES");
    return true;
  }

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
    createBranch: !!inputData.createBranch,
    autoCommit: !!inputData.autoCommit,
    autoApprove: !!inputData.autoApprove
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
    const continueAnyway = await confirmContinueWithDirtyRepo(statusBefore, input.autoApprove);
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

  let notes: string[] = [];
  let totalAppliedChanges = 0;
  let attempts = 1;
  let selfHealingAttempt = 0;
  let dependencyInstallCount = 0;
  const installedDependencies = new Set<string>();
  const failureMemory: FailureMemoryEntry[] = [];
  const maxRetryAttempts = 3;
  let retryStopReason: string | undefined;
  const appliedPaths: string[] = [];
  let commandResults: CommandResult[] | undefined;
  let review: ReviewResult | undefined;
  let initialChanges: Changeset = { operations: [] };

  if (mode === "bugfix") {
    console.log("Running bugfix pre-validation...");
    commandResults = await runAllowedCommands(["node index.js"], repoPath);
    await saveStateFile(state.runDir, "command-results-prevalidation.json", commandResults);

    let prevalidationDiffSummary = await getDiffSummary(repoPath);
    review = parseWithSchema(
      reviewSchema,
      await reviewerAgent(brief, plan, commandResults, prevalidationDiffSummary),
      "ReviewResultAfterPreValidation"
    );
    await saveStateFile(state.runDir, "review-prevalidation.json", review);

    if (review.verdict === "pass") {
      notes.push("Bugfix pre-validation passed; no repair needed.");
    } else {
      const prevalidationFailure = classifyCommandFailure(commandResults);
      console.log(
        `Pre-validation failure classified: ${prevalidationFailure.type} -> ${prevalidationFailure.strategy} (${prevalidationFailure.confidence} confidence)`
      );
      await saveStateFile(state.runDir, "failure-classification-prevalidation.json", prevalidationFailure);
      await rememberFailure(
        state.runDir,
        failureMemory,
        buildFailureMemoryEntry(attempts, prevalidationFailure, false, "Bugfix pre-validation failed before repair strategy")
      );

      const missingModule =
        prevalidationFailure.strategy === "install-dependency" ? prevalidationFailure.details.moduleName : null;
      if (
        missingModule &&
        isInstallableMissingModule(missingModule) &&
        dependencyInstallCount < 2 &&
        !installedDependencies.has(missingModule)
      ) {
        const hasPackageJson = await fs.pathExists(path.join(repoPath, "package.json"));
        if (!hasPackageJson) {
          console.log(`Dependency install skipped: package.json not found for missing dependency ${missingModule}.`);
          notes.push(`Skipped installing ${missingModule} because package.json was not found.`);
          await rememberFailure(
            state.runDir,
            failureMemory,
            buildFailureMemoryEntry(
              attempts,
              prevalidationFailure,
              false,
              "Dependency install skipped because package.json was not found"
            )
          );
        } else {
          dependencyInstallCount += 1;
          installedDependencies.add(missingModule);
          console.log(`Installing missing dependency: ${missingModule}`);
          const installResults = await runAllowedCommands([`npm install ${missingModule}`], repoPath);
          await saveStateFile(state.runDir, `dependency-install-${dependencyInstallCount}.json`, installResults);

          console.log("Re-running after install...");
          const validationResults = await runAllowedCommands(["node index.js"], repoPath);
          commandResults = [...installResults, ...validationResults];
          await saveStateFile(state.runDir, `command-results-after-install-${dependencyInstallCount}.json`, commandResults);

          prevalidationDiffSummary = await getDiffSummary(repoPath);
          review = parseWithSchema(
            reviewSchema,
            await reviewerAgent(brief, plan, commandResults, prevalidationDiffSummary),
            `ReviewResultAfterDependencyInstall${dependencyInstallCount}`
          );
          await saveStateFile(state.runDir, `review-after-install-${dependencyInstallCount}.json`, review);
          attempts += 1;
          if (review.verdict === "fail") {
            const postInstallFailure = classifyCommandFailure(commandResults);
            await rememberFailure(
              state.runDir,
              failureMemory,
              buildFailureMemoryEntry(attempts, postInstallFailure, true, "Validation still failed after dependency install")
            );
          }
        }
      } else if (prevalidationFailure.strategy === "deterministic-patch") {
        const runtimeErrorForPrevalidation = extractRuntimeError(commandResults);
        const deterministicOps = await buildDeterministicDuplicateDeclarationFix(repoPath, runtimeErrorForPrevalidation);
        if (deterministicOps && deterministicOps.length > 0) {
          console.log("Deterministic duplicate-declaration fixer generated patch operations.");
          initialChanges = { operations: deterministicOps };
        } else {
          notes.push("Deterministic patch strategy could not produce file operations.");
          await rememberFailure(
            state.runDir,
            failureMemory,
            buildFailureMemoryEntry(attempts, prevalidationFailure, false, "Deterministic patch produced no operations")
          );
        }
      } else if (prevalidationFailure.strategy === "safe-replacement") {
        const runtimeErrorForPrevalidation = extractRuntimeError(commandResults);
        const safeReplacementOps = await buildSafeReplacementFix(
          repoPath,
          runtimeErrorForPrevalidation,
          prevalidationFailure.details.symbol
        );
        if (safeReplacementOps && safeReplacementOps.length > 0) {
          initialChanges = { operations: safeReplacementOps };
        } else {
          initialChanges = parseWithSchema(
            changesSchema,
            await builderAgent(brief, plan, repoSummary, review, {
              runDir: state.runDir,
              repoPath,
              mode,
              recentCommandResults: commandResults,
              previousOperations: [],
              selfHealingAttempt,
              failureClassification: prevalidationFailure,
              failureMemory
            }),
            "PreValidationRepairChangeset"
          );
        }
      } else if (prevalidationFailure.strategy === "guard-call") {
        const runtimeErrorForPrevalidation = extractRuntimeError(commandResults);
        const guardCallOps = await buildGuardCallFix(
          repoPath,
          runtimeErrorForPrevalidation,
          prevalidationFailure.details.symbol
        );
        if (guardCallOps && guardCallOps.length > 0) {
          initialChanges = { operations: guardCallOps };
        } else {
          initialChanges = parseWithSchema(
            changesSchema,
            await builderAgent(brief, plan, repoSummary, review, {
              runDir: state.runDir,
              repoPath,
              mode,
              recentCommandResults: commandResults,
              previousOperations: [],
              selfHealingAttempt,
              failureClassification: prevalidationFailure,
              failureMemory
            }),
            "PreValidationRepairChangeset"
          );
        }
      } else {
        initialChanges = parseWithSchema(
          changesSchema,
          await builderAgent(brief, plan, repoSummary, review, {
            runDir: state.runDir,
            repoPath,
            mode,
            recentCommandResults: commandResults,
            previousOperations: [],
            selfHealingAttempt,
            failureClassification: prevalidationFailure,
            failureMemory
          }),
          "PreValidationRepairChangeset"
        );
      }
    }
  } else {
    initialChanges = parseWithSchema(
      changesSchema,
      await builderAgent(brief, plan, repoSummary, undefined, { runDir: state.runDir, repoPath, mode }),
      "Changeset"
    );
  }
  await saveStateFile(state.runDir, "changes.json", initialChanges);
  let previousOperations = initialChanges.operations.map((op) => ({ type: op.type, path: op.path, reason: op.reason }));

  if (initialChanges.operations.length > 0) {
    const approved = await requestApplyApproval(initialChanges, input.autoApprove);
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
    if (mode !== "bugfix" || !review || review.verdict !== "pass") {
      notes.push("No file operations were generated; feature implementation was not applied.");
    }
  }

  if (!commandResults || initialChanges.operations.length > 0) {
    commandResults = await runAllowedCommands(plan.proposedCommands, repoPath);
  }
  await saveStateFile(state.runDir, "command-results.json", commandResults);

  let diffSummary = await getDiffSummary(repoPath);
  review = parseWithSchema(reviewSchema, await reviewerAgent(brief, plan, commandResults, diffSummary), "ReviewResult");
  await saveStateFile(state.runDir, "review.json", review);

  while (review.verdict === "fail" && selfHealingAttempt < 2) {
    const runtimeErrorForRetry = extractRuntimeError(commandResults);
    const failure = classifyCommandFailure(commandResults);
    const failureArtifactName = `failure-classification-attempt-${selfHealingAttempt + dependencyInstallCount + 1}.json`;
    console.log(
      `Failure classified: ${failure.type} -> ${failure.strategy} (${failure.confidence} confidence)`
    );
    await saveStateFile(state.runDir, failureArtifactName, failure);
    await rememberFailure(
      state.runDir,
      failureMemory,
      buildFailureMemoryEntry(attempts, failure, totalAppliedChanges > 0, "Validation failed before repair strategy")
    );

    const missingModule = failure.strategy === "install-dependency" ? failure.details.moduleName : null;
    if (
      missingModule &&
      isInstallableMissingModule(missingModule) &&
      dependencyInstallCount < 2 &&
      !installedDependencies.has(missingModule)
    ) {
      const hasPackageJson = await fs.pathExists(path.join(repoPath, "package.json"));
      if (!hasPackageJson) {
        console.log(`Dependency install skipped: package.json not found for missing dependency ${missingModule}.`);
        notes.push(`Skipped installing ${missingModule} because package.json was not found.`);
        await rememberFailure(
          state.runDir,
          failureMemory,
          buildFailureMemoryEntry(
            attempts,
            failure,
            false,
            "Dependency install skipped because package.json was not found"
          )
        );
      } else {
        dependencyInstallCount += 1;
        installedDependencies.add(missingModule);
        console.log(`Installing missing dependency: ${missingModule}`);
        const installResults = await runAllowedCommands([`npm install ${missingModule}`], repoPath);
        await saveStateFile(state.runDir, `dependency-install-${dependencyInstallCount}.json`, installResults);

        console.log("Re-running after install...");
        const validationResults = await runAllowedCommands(["node index.js"], repoPath);
        commandResults = [...installResults, ...validationResults];
        await saveStateFile(state.runDir, `command-results-after-install-${dependencyInstallCount}.json`, commandResults);

        diffSummary = await getDiffSummary(repoPath);
        review = parseWithSchema(
          reviewSchema,
          await reviewerAgent(brief, plan, commandResults, diffSummary),
          `ReviewResultAfterDependencyInstall${dependencyInstallCount}`
        );
        await saveStateFile(state.runDir, `review-after-install-${dependencyInstallCount}.json`, review);
        attempts += 1;
        if (review.verdict === "fail") {
          const postInstallFailure = classifyCommandFailure(commandResults);
          await saveStateFile(state.runDir, `failure-classification-attempt-${attempts}.json`, postInstallFailure);
          await rememberFailure(
            state.runDir,
            failureMemory,
            buildFailureMemoryEntry(attempts, postInstallFailure, true, "Validation still failed after dependency install")
          );
          const decision = shouldContinueRetry({
            failureMemory,
            currentFailure: postInstallFailure,
            attempt: attempts,
            maxAttempts: maxRetryAttempts,
            changeApplied: true
          });
          if (!decision.shouldContinue) {
            retryStopReason = decision.reason;
            console.log(`Retry stopped: ${retryStopReason}`);
            await saveRetryStop(
              state.runDir,
              attempts,
              retryStopReason ?? "Retry stopped",
              postInstallFailure,
              failureMemory
            );
            break;
          }
        }
        continue;
      }
    } else if (missingModule && !isInstallableMissingModule(missingModule)) {
      notes.push(`Did not install missing module ${missingModule}; it is not an allowed external npm package.`);
      await rememberFailure(
        state.runDir,
        failureMemory,
        buildFailureMemoryEntry(attempts, failure, false, "Dependency install skipped by safety guard")
      );
    }

    selfHealingAttempt += 1;
    console.log(`Self-healing attempt ${selfHealingAttempt}`);
    if (runtimeErrorForRetry) {
      console.log("Runtime error passed to AI:");
      console.log(runtimeErrorForRetry);
    }

    let candidateChanges: { operations: ChangeOperation[] } | null = null;
    const deterministicOps =
      failure.strategy === "deterministic-patch"
        ? await buildDeterministicDuplicateDeclarationFix(repoPath, runtimeErrorForRetry)
        : null;
    if (deterministicOps && deterministicOps.length > 0) {
      console.log("Deterministic duplicate-declaration fixer generated patch operations.");
      candidateChanges = { operations: deterministicOps };
    } else {
      const safeReplacementOps =
        failure.strategy === "safe-replacement"
          ? await buildSafeReplacementFix(repoPath, runtimeErrorForRetry, failure.details.symbol)
          : null;
      if (safeReplacementOps && safeReplacementOps.length > 0) {
        candidateChanges = { operations: safeReplacementOps };
      } else {
        const guardCallOps =
          failure.strategy === "guard-call"
            ? await buildGuardCallFix(repoPath, runtimeErrorForRetry, failure.details.symbol)
            : null;
        if (guardCallOps && guardCallOps.length > 0) {
          candidateChanges = { operations: guardCallOps };
        } else {
          candidateChanges = await builderAgent(brief, plan, repoSummary, review, {
            runDir: state.runDir,
            repoPath,
            mode,
            recentCommandResults: commandResults,
            previousOperations,
            selfHealingAttempt,
            failureClassification: failure,
            failureMemory
          });
        }
      }
    }

    const fixChanges = parseWithSchema(changesSchema, candidateChanges, `SelfHealingChangeset${selfHealingAttempt}`);
    await saveStateFile(state.runDir, `self-heal-${selfHealingAttempt}-changes.json`, fixChanges);

    if (fixChanges.operations.length === 0) {
      notes.push(`Self-healing attempt ${selfHealingAttempt} generated no file operations.`);
      await rememberFailure(
        state.runDir,
        failureMemory,
        buildFailureMemoryEntry(attempts, failure, false, "Repair strategy generated no file operations")
      );
      const decision = shouldContinueRetry({
        failureMemory,
        currentFailure: failure,
        attempt: attempts,
        maxAttempts: maxRetryAttempts,
        changeApplied: false
      });
      if (!decision.shouldContinue) {
        retryStopReason = decision.reason;
        console.log(`Retry stopped: ${retryStopReason}`);
        await saveRetryStop(state.runDir, attempts, retryStopReason ?? "Retry stopped", failure, failureMemory);
      }
      break;
    }

    const fixApproved = await requestApplyApproval(fixChanges, input.autoApprove);
    if (!fixApproved) {
      console.log("Changes rejected. Stopping safely.");
      review = {
        verdict: "fail",
        status: "fail",
        notes: [...review.notes, "User declined self-healing changes."]
      };
      await rememberFailure(
        state.runDir,
        failureMemory,
        buildFailureMemoryEntry(attempts, failure, false, "User declined repair changes")
      );
      retryStopReason = "User declined repair changes";
      await saveRetryStop(state.runDir, attempts, retryStopReason, failure, failureMemory);
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
    if (review.verdict === "fail") {
      const postRepairFailure = classifyCommandFailure(commandResults);
      await saveStateFile(state.runDir, `failure-classification-attempt-${attempts}.json`, postRepairFailure);
      await rememberFailure(
        state.runDir,
        failureMemory,
        buildFailureMemoryEntry(attempts, postRepairFailure, true, "Validation still failed after repair strategy")
      );
      const decision = shouldContinueRetry({
        failureMemory,
        currentFailure: postRepairFailure,
        attempt: attempts,
        maxAttempts: maxRetryAttempts,
        changeApplied: true
      });
      if (!decision.shouldContinue) {
        retryStopReason = decision.reason;
        console.log(`Retry stopped: ${retryStopReason}`);
        await saveRetryStop(state.runDir, attempts, retryStopReason ?? "Retry stopped", postRepairFailure, failureMemory);
        break;
      }
    }
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
    notes: retryStopReason ? [...review.notes, ...notes, `Retry stopped: ${retryStopReason}`] : [...review.notes, ...notes]
  };

  await saveStateFile(state.runDir, "summary.json", summary);

  const gitDiffStat = await getGitDiffStat(repoPath);
  const gitChangedFiles = await getChangedFiles(repoPath);
  for (const opPath of appliedPaths) {
    console.log(`Applied operation path: ${opPath}`);
  }
  const changedFiles = gitChangedFiles.length > 0 ? uniqueSorted(gitChangedFiles) : uniqueSorted(appliedPaths);
  const commitMessage = buildCommitMessage(mode, input.task);

  const commitEligibleFiles = changedFiles.filter((f) => {
    console.log(`Commit candidate path: ${f}`);
    const n = f.replace(/\\/g, "/").toLowerCase();
    if (n.startsWith(".factory/")) return false;
    if (n.startsWith("node_modules/")) return false;
    if (n === ".env" || n.startsWith(".env")) return false;
    return true;
  });

  const commitResult: {
    attempted: boolean;
    skippedReason?: string;
    committed: boolean;
    commitMessage?: string;
    committedFiles: string[];
    error?: string;
  } = {
    attempted: !!input.autoCommit,
    committed: false,
    committedFiles: []
  };

  if (input.autoCommit) {
    if (!gitRepo) {
      commitResult.skippedReason = "repository is not a git repo";
      console.log("Auto-commit skipped: repository is not a git repo.");
    } else if (summary.reviewStatus !== "pass") {
      commitResult.skippedReason = "validation failed";
      console.log("Auto-commit skipped: validation failed.");
    } else if (changedFiles.length === 0) {
      commitResult.skippedReason = "no files changed";
      console.log("Auto-commit skipped: no files changed.");
    } else if (commitEligibleFiles.length === 0) {
      commitResult.skippedReason = "no eligible files to commit";
      console.log("Auto-commit skipped: no eligible files to commit.");
    } else {
      try {
        console.log(`Auto-commit working directory: ${repoPath}`);
        await stageFiles(repoPath, commitEligibleFiles);
        await gitCommit(repoPath, commitMessage);
        commitResult.committed = true;
        commitResult.commitMessage = commitMessage;
        commitResult.committedFiles = commitEligibleFiles;
        console.log(`Auto-commit created: ${commitMessage}`);
        console.log("Committed files:");
        for (const file of commitEligibleFiles) {
          console.log(`- ${file}`);
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        commitResult.skippedReason = "git commit failed";
        commitResult.error = msg;
        console.log(`Auto-commit skipped: ${msg}`);
      }
    }
  } else {
    commitResult.skippedReason = "auto-commit not requested";
  }

  await saveStateFile(state.runDir, "commit-result.json", commitResult);

  const finalReport = [
    `# Final Report`,
    "",
    `- Run ID: ${state.runId}`,
    `- Task: ${input.task}`,
    `- Mode: ${mode}`,
    `- Attempts: ${attempts}`,
    `- Final status: ${review.verdict}`,
    `- Retry stop reason: ${retryStopReason ?? "None"}`,
    `- Applied changes count: ${totalAppliedChanges}`,
    `- Git repo: ${gitRepo ? "yes" : "no"}`,
    `- Existing uncommitted changes: ${hadUncommittedChanges ? "yes" : "no"}`,
    `- Branch created: ${branchCreated ? "yes" : "no"}`,
    `- Branch name: ${branchCreated ? branchName : "n/a"}`,
    `- Auto-commit: ${commitResult.committed ? "yes" : commitResult.attempted ? "skipped" : "no"}`,
    `- Commit message: ${commitResult.commitMessage ?? commitMessage}`,
    `- Committed files: ${commitResult.committedFiles.length ? commitResult.committedFiles.join(", ") : "None"}`,
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
