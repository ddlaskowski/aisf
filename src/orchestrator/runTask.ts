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
import { applyOperation, type FileOperationResult } from "../tools/fileEditor.js";
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
import { generateReorderInitPatch } from "../fixers/reorderInit.js";
import {
  selectContextAwareRepairTarget,
  type ContextAwareRepairTarget
} from "../repair/contextAwareRepairTarget.js";
import { buildRepairIntent } from "../repair/repairIntentBuilder.js";
import { createUnknownRepairIntent, type RepairIntent } from "../repair/repairIntent.js";
import { validatePatchIntent, type PatchIntentValidationResult } from "../repair/patchIntentGuard.js";
import {
  shouldSkipMutationForEvidenceValidation,
  validateRepairEvidence,
  type RepairEvidenceValidation
} from "../repair/repairEvidenceValidator.js";
import {
  decideRepairPatchPolicy,
  type RepairPatchPolicyDecision
} from "../repair/repairPatchPolicy.js";
import {
  decideRepairStrategy,
  type RepairStrategyDecision
} from "../repair/repairStrategy.js";
import {
  decideRepairRetryStrategy,
  type RepairRetryDecision
} from "../repair/repairRetryStrategy.js";
import { buildFailureSignature } from "../repair/failureSignature.js";
import { getProjectId, loadFailureMemory, type FailureMemoryStore, type FailureMemoryOutcome } from "../repair/failureMemory.js";
import { lookupFailureMemory, type FailureMemoryHint } from "../repair/failureMemoryLookup.js";
import { updateFailureMemory } from "../repair/failureMemoryUpdate.js";
import { buildValidationDelta, type ValidationDelta } from "../repair/validationDelta.js";
import {
  classifyRepairOutcome,
  type RepairOutcomeClassification
} from "../repair/repairOutcomeClassifier.js";
import { auditRepairDecision, type RepairDecisionAudit } from "../repair/repairDecisionAudit.js";
import {
  buildRepairAnalyticsHint,
  getRepairStrategyAnalytics,
  updateRepairAnalytics,
  type RepairAnalyticsHint
} from "../repair/repairAnalytics.js";
import {
  assessRepairRegressionRisk,
  type RepairRegressionRisk
} from "../repair/repairRegressionGuard.js";
import { buildRepairObservabilityReport } from "../repair/repairObservability.js";
import { buildRepairDecisionTrace, renderRepairDecisionTraceMarkdown } from "../repair/repairDecisionTrace.js";
import { buildRepairSummary } from "../repair/repairSummary.js";
import { buildRepairReview, renderRepairReviewMarkdown } from "../repair/buildRepairReview.js";
import { updateRepairReviewAnalytics } from "../repair/repairReviewAnalytics.js";
import { buildRepairTrustIndex, renderRepairTrustIndexMarkdown } from "../repair/repairTrustIndex.js";
import { buildRepairReleaseGate, renderRepairReleaseGateMarkdown } from "../repair/repairReleaseGate.js";
import { buildRepairGovernance, renderRepairGovernanceMarkdown } from "../repair/repairGovernance.js";
import { buildRunIndexEntry, loadRunsIndex, saveRunsIndex, updateRunsIndex } from "../repair/runIndex.js";

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
  runtimeError: string,
  contextAwareTarget?: ContextAwareRepairTarget | null
): Promise<{ relPath: string; content: string } | null> {
  const fileFromStack = findErrorFileFromStack(runtimeError);
  const targetPath = contextAwareTarget?.filePath
    ? path.resolve(contextAwareTarget.filePath)
    : fileFromStack
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
  symbol?: string,
  contextAwareTarget?: ContextAwareRepairTarget | null
): Promise<ChangeOperation[] | null> {
  if (!symbol) {
    return null;
  }

  const targetFile = await readFailureTargetFile(repoPath, runtimeError, contextAwareTarget);
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
  symbol?: string,
  contextAwareTarget?: ContextAwareRepairTarget | null
): Promise<ChangeOperation[] | null> {
  if (!symbol) {
    return null;
  }

  const targetFile = await readFailureTargetFile(repoPath, runtimeError, contextAwareTarget);
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

async function buildReorderInitFix(
  repoPath: string,
  runtimeError: string,
  symbol?: string,
  contextAwareTarget?: ContextAwareRepairTarget | null
): Promise<ChangeOperation[] | null> {
  if (!symbol) {
    return null;
  }

  const targetFile = await readFailureTargetFile(repoPath, runtimeError, contextAwareTarget);
  if (!targetFile) {
    return null;
  }

  const result = generateReorderInitPatch({
    fileContent: targetFile.content,
    symbol
  });

  if (!result.applied || !result.operations?.length) {
    return null;
  }

  console.log(`Applied reorder-init for symbol: ${symbol}`);
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

function formatList(values: string[] | undefined): string {
  return values?.length ? values.join(", ") : "none";
}

function uniqueSorted(items: string[]): string[] {
  return Array.from(new Set(items)).sort((a, b) => a.localeCompare(b));
}

function countOccurrences(source: string, target: string): number {
  if (!target) return 0;
  return source.split(target).length - 1;
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

async function selectAndSaveContextAwareRepairTarget(
  runDir: string,
  repoPath: string,
  rawOutput: string,
  label: string
): Promise<ContextAwareRepairTarget | null> {
  if (!rawOutput.trim()) {
    return null;
  }

  const target = selectContextAwareRepairTarget({
    rawOutput,
    projectRoot: repoPath,
    fallbackFilePath: path.join(repoPath, "index.js")
  });

  if (!target) {
    return null;
  }

  console.log(
    `Context-aware repair target: ${target.filePath} (${target.confidence}) - ${target.reason}`
  );
  await saveStateFile(runDir, `context-aware-repair-target-${label}.json`, target);
  return target;
}

async function buildAndSaveRepairIntent(input: {
  runDir: string;
  label: string;
  rawOutput: string;
  target: ContextAwareRepairTarget;
  symbolName?: string;
}): Promise<RepairIntent> {
  try {
    const repairIntent = buildRepairIntent({
      parsedStackTrace: {
        message: input.rawOutput,
        filePath: input.target.filePath
      },
      errorContext: {
        filePath: input.target.filePath
      },
      repairTargetDecision: {
        targetFile: input.target.filePath,
        reason: input.target.reason,
        confidence: input.target.confidence,
        sourceFile: input.target.filePath,
        symbolName: input.symbolName
      }
    });
    await saveStateFile(input.runDir, `repair-intent-${input.label}.json`, repairIntent);
    return repairIntent;
  } catch (error) {
    const fallback = createUnknownRepairIntent({
      targetFile: input.target.filePath,
      reason: error instanceof Error ? error.message : undefined
    });
    await saveStateFile(input.runDir, `repair-intent-${input.label}.json`, fallback);
    return fallback;
  }
}

async function buildAndSaveRepairEvidenceValidation(input: {
  runDir: string;
  label: string;
  rawOutput: string;
  target: ContextAwareRepairTarget;
  repairIntent: RepairIntent;
  symbolName?: string;
}): Promise<RepairEvidenceValidation> {
  const sourceFileFromStack = findErrorFileFromStack(input.rawOutput);
  const sourceFile = sourceFileFromStack
    ? path.isAbsolute(sourceFileFromStack)
      ? sourceFileFromStack
      : path.resolve(path.dirname(input.target.filePath), sourceFileFromStack)
    : input.repairIntent.sourceFile;
  const repairTargetDecision = {
    targetFile: input.target.filePath,
    reason: input.target.reason,
    confidence: input.target.confidence,
    sourceFile,
    symbolName: input.symbolName ?? input.repairIntent.symbolName
  };
  const validation = validateRepairEvidence({
    parsedStackTrace: {
      message: input.rawOutput,
      filePath: sourceFile ?? input.target.filePath
    },
    errorContext: {
      filePath: sourceFile ?? input.target.filePath,
      message: input.rawOutput
    },
    dependencyMap: {
      targetFile: input.target.filePath,
      sourceFile,
      reason: input.target.reason,
      symbolName: input.symbolName ?? input.repairIntent.symbolName
    },
    repairTargetDecision,
    repairIntent: input.repairIntent
  });
  await saveStateFile(input.runDir, `repair-evidence-validation-${input.label}.json`, validation);
  return validation;
}

function buildRepairStrategyInput(
  runtimeError: string,
  commandResults: CommandResult[] | undefined,
  failureMemory: FailureMemoryEntry[],
  failureMemoryHint?: FailureMemoryHint | null
) {
  const failedCommand = commandResults?.find((result) => result.status === "failed");
  return {
    errorMessage: runtimeError,
    stderr: failedCommand?.stderr,
    stdout: failedCommand?.stdout,
    command: failedCommand?.command,
    stackTrace: {
      message: runtimeError,
      filePath: findErrorFileFromStack(runtimeError) ?? undefined
    },
    errorContext: {
      message: runtimeError
    },
    previousAttempts: failureMemory.map((entry) => ({
      strategy: entry.strategy,
      validationChanged: entry.changeApplied,
      policyDenied: entry.note?.toLowerCase().includes("policy") ?? false,
      manualReview: entry.note?.toLowerCase().includes("manual review") ?? false
    })),
    failureMemory: failureMemoryHint ?? undefined
  };
}

async function decideAndSaveRepairStrategy(input: {
  runDir: string;
  label: string;
  runtimeError: string;
  commandResults: CommandResult[] | undefined;
  failureMemory: FailureMemoryEntry[];
  failureMemoryHint?: FailureMemoryHint | null;
}): Promise<RepairStrategyDecision> {
  const strategy = decideRepairStrategy(
    buildRepairStrategyInput(input.runtimeError, input.commandResults, input.failureMemory, input.failureMemoryHint)
  );
  await saveStateFile(input.runDir, `repair-strategy-${input.label}.json`, strategy);
  return strategy;
}

async function buildAndSaveFailureMemoryHint(input: {
  runDir: string;
  label: string;
  store: FailureMemoryStore;
  projectId: string;
  runtimeError: string;
  failure: ReturnType<typeof classifyFailure>;
  targetFile?: string;
}): Promise<{ errorSignature: string; hint: FailureMemoryHint }> {
  const errorSignature = buildFailureSignature({
    errorType: input.failure.type,
    errorMessage: input.failure.details.rawMessage || input.runtimeError,
    stderr: input.runtimeError,
    topProjectStackFrame: findErrorFileFromStack(input.runtimeError) ?? undefined,
    targetFile: input.targetFile,
    symbolName: input.failure.details.symbol ?? input.failure.details.moduleName
  });
  const hint = lookupFailureMemory({
    store: input.store,
    errorSignature,
    projectId: input.projectId
  });
  await saveStateFile(input.runDir, `failure-signature-${input.label}.json`, { errorSignature });
  await saveStateFile(input.runDir, `failure-memory-hint-${input.label}.json`, hint);
  return { errorSignature, hint };
}

function errorSignatureFromResults(commandResults: CommandResult[] | undefined): string {
  const runtimeError = commandResults ? extractRuntimeError(commandResults) : "";
  return runtimeError
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 4)
    .join(" | ");
}

function buildRetryAttempts(
  failureMemory: FailureMemoryEntry[],
  patchPolicy: RepairPatchPolicyDecision | null
) {
  return failureMemory.map((entry) => ({
    strategy: entry.strategy,
    validationChanged: entry.changeApplied,
    validationPassed: false,
    policyDenied: entry.note?.toLowerCase().includes("policy") ?? false,
    manualReview: entry.note?.toLowerCase().includes("manual review") ?? false,
    mutationApplied: entry.changeApplied,
    errorSignature: entry.message,
    patchPolicy: patchPolicy
      ? {
          allowed: patchPolicy.ok,
          reason: patchPolicy.reason,
          outcome: patchPolicy.recommendedAction
        }
      : undefined
  }));
}

async function decideAndSaveRepairRetry(input: {
  runDir: string;
  label: string;
  repairStrategy: RepairStrategyDecision | null;
  repairPatchPolicy: RepairPatchPolicyDecision | null;
  failureMemory: FailureMemoryEntry[];
  commandResults: CommandResult[] | undefined;
  retryCount: number;
  maxRetries: number;
  validationChanged?: boolean;
  validationPassed?: boolean;
  failureMemoryHint?: FailureMemoryHint | null;
  errorSignature?: string | null;
}): Promise<RepairRetryDecision> {
  const decision = decideRepairRetryStrategy({
    currentStrategy: input.repairStrategy
      ? {
          strategy: input.repairStrategy.strategy,
          confidence: input.repairStrategy.confidence,
          recommendedAction: input.repairStrategy.recommendedAction,
          mustAvoidStrategies: input.repairStrategy.mustAvoidStrategies
        }
      : undefined,
    previousAttempts: buildRetryAttempts(input.failureMemory, input.repairPatchPolicy),
    latestValidation: {
      passed: input.validationPassed,
      changed: input.validationChanged,
      errorSignature: input.errorSignature ?? errorSignatureFromResults(input.commandResults),
      stderr: input.commandResults?.find((result) => result.status === "failed")?.stderr,
      stdout: input.commandResults?.find((result) => result.status === "failed")?.stdout
    },
    retryCount: input.retryCount,
    maxRetries: input.maxRetries,
    failureMemoryHint: input.failureMemoryHint ?? undefined
  });
  await saveStateFile(input.runDir, `repair-retry-decision-${input.label}.json`, decision);
  return decision;
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
  runtimeError: string,
  contextAwareTarget?: ContextAwareRepairTarget | null
): Promise<ChangeOperation[] | null> {
  const dupMatch = runtimeError.match(/SyntaxError:\s*Identifier\s+'([^']+)'\s+has already been declared/i);
  if (!dupMatch) {
    return null;
  }

  const identifier = dupMatch[1];
  const fileFromStack = contextAwareTarget?.filePath ?? findErrorFileFromStack(runtimeError);
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
    const safeTarget = idx > 0 ? `\n${line}` : "";
    if (safeTarget && countOccurrences(content, safeTarget) === 1) {
      ops.push({
        type: "modify",
        path: relNormalized,
        patch: {
          type: "replace",
          target: {
            type: "exact",
            match: safeTarget
          },
          replacement: ""
        },
        reason: "Deterministic fix for duplicate declaration"
      });
      continue;
    }

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

interface AppliedOperationResult extends FileOperationResult {
  path: string;
}

function countEffectiveChanges(results: AppliedOperationResult[]): number {
  return results.filter((result) => result.changed).length;
}

function hasEffectiveChange(results: AppliedOperationResult[]): boolean {
  return results.some((result) => result.changed);
}

async function applyNonDeleteOperations(repoPath: string, operations: ChangeOperation[]): Promise<AppliedOperationResult[]> {
  const results: AppliedOperationResult[] = [];
  for (const op of operations) {
    if (op.type === "delete") {
      continue;
    }
    const result = await applyOperation(repoPath, op, false);
    results.push({ path: op.path, ...result });
  }
  return results;
}

function operationTargetsExactlyOneFile(operations: ChangeOperation[]): boolean {
  const paths = new Set(operations.filter((op) => op.type !== "delete").map((op) => op.path));
  return paths.size <= 1;
}

function restrictOperationsToContextAwareTarget(
  repoPath: string,
  operations: ChangeOperation[],
  target: ContextAwareRepairTarget | null
): ChangeOperation[] {
  if (!target) {
    return operations;
  }

  const targetRel = path.relative(repoPath, target.filePath).split(path.sep).join("/");
  const kept = operations.filter((op) => op.type === "delete" || op.path.replace(/\\/g, "/") === targetRel);
  const skipped = operations.length - kept.length;
  if (skipped > 0) {
    console.log(`Context-aware repair target selected one file; skipped ${skipped} operation(s) for other files.`);
  }

  if (!operationTargetsExactlyOneFile(kept)) {
    console.log("Context-aware repair target guard blocked multi-file patch operations.");
    return [];
  }

  return kept;
}

function operationPatchContent(operation: ChangeOperation): string | undefined {
  if (typeof operation.content === "string") {
    return operation.content;
  }

  if (operation.patch) {
    return JSON.stringify(operation.patch);
  }

  return operation.reason;
}

function inferPolicyOperation(operation: ChangeOperation): string {
  if (operation.type === "delete") {
    return "multi-file-mutation";
  }

  if (operation.type === "create") {
    return operation.path.endsWith(".md") ? "risky-append" : "small-single-line-edit";
  }

  if (operation.content && !operation.patch) {
    return "full-file-replacement";
  }

  const patch = operation.patch;
  if (patch && "type" in patch && patch.type === "replace") {
    return "exact-replacement";
  }

  if (patch && "replace" in patch && patch.replace) {
    return "exact-replacement";
  }

  if (operation.reason?.toLowerCase().includes("missing export")) {
    return "add-missing-export";
  }

  if (operation.reason?.toLowerCase().includes("import")) {
    return "correct-imported-symbol";
  }

  if (operation.reason?.toLowerCase().includes("duplicate declaration")) {
    return "remove-duplicate-declaration";
  }

  return "small-single-line-edit";
}

function buildPolicyOperations(repoPath: string, operations: ChangeOperation[]): Array<{
  operation: string;
  targetFile: string;
  patchFiles: string[];
}> {
  return operations
    .filter((operation) => operation.type !== "delete" && operation.path)
    .map((operation) => {
      const targetFile = path.resolve(repoPath, operation.path);
      return {
        operation: inferPolicyOperation(operation),
        targetFile,
        patchFiles: [targetFile]
      };
    });
}

async function decideAndSaveRepairPatchPolicy(input: {
  runDir: string;
  label: string;
  repoPath: string;
  repairIntent: RepairIntent | null;
  repairEvidenceValidation: RepairEvidenceValidation | null;
  contextAwareRepairTarget: ContextAwareRepairTarget | null;
  operations: ChangeOperation[];
}): Promise<RepairPatchPolicyDecision | null> {
  if (!input.repairEvidenceValidation) {
    return null;
  }

  const decision = decideRepairPatchPolicy({
    repairIntent: input.repairIntent,
    evidenceValidation: input.repairEvidenceValidation,
    repairTargetDecision: input.contextAwareRepairTarget
      ? {
          targetFile: input.contextAwareRepairTarget.filePath,
          reason: input.contextAwareRepairTarget.reason,
          confidence: input.contextAwareRepairTarget.confidence
        }
      : undefined,
    proposedPatchOperations: buildPolicyOperations(input.repoPath, input.operations)
  });
  await saveStateFile(input.runDir, `repair-patch-policy-${input.label}.json`, decision);
  return decision;
}

function applyRegressionGuardToEvidence(
  validation: RepairEvidenceValidation | null,
  regressionRisk: RepairRegressionRisk | null
): RepairEvidenceValidation | null {
  if (!validation || !regressionRisk) {
    return validation;
  }

  const warnings = [
    ...validation.warnings,
    ...regressionRisk.warnings.map((warning) => `Regression guard: ${warning}`)
  ];

  if (regressionRisk.blocked || regressionRisk.recommendedAction === "block") {
    return {
      ...validation,
      ok: false,
      confidence: "low",
      warnings,
      reason: `${validation.reason} Regression guard blocked mutation.`,
      allowedRepairMode: "manual-review"
    };
  }

  if (regressionRisk.recommendedAction === "manual-review") {
    return {
      ...validation,
      confidence: "low",
      warnings,
      reason: `${validation.reason} Regression guard requires manual review.`,
      allowedRepairMode: "manual-review"
    };
  }

  if (
    regressionRisk.recommendedAction === "downgrade-to-conservative" &&
    validation.allowedRepairMode === "normal"
  ) {
    return {
      ...validation,
      confidence: validation.confidence === "high" ? "medium" : validation.confidence,
      warnings,
      reason: `${validation.reason} Regression guard downgraded repair to conservative mode.`,
      allowedRepairMode: "conservative"
    };
  }

  return {
    ...validation,
    warnings
  };
}

async function assessAndSaveRepairRegressionRisk(input: {
  runDir: string;
  label: string;
  repoPath: string;
  repairStrategy: RepairStrategyDecision | null;
  failureSignature: string | null;
  historicalFailureMemory: FailureMemoryStore;
}): Promise<RepairRegressionRisk | null> {
  if (!input.repairStrategy) {
    return null;
  }

  const analytics = await getRepairStrategyAnalytics({
    projectRoot: input.repoPath,
    strategy: input.repairStrategy.strategy
  });
  const memoryMatches = input.historicalFailureMemory.records.filter(
    (record) =>
      (!input.failureSignature || record.errorSignature === input.failureSignature) &&
      record.strategy === input.repairStrategy?.strategy
  );
  const risk = assessRepairRegressionRisk({
    failureSignature: input.failureSignature ?? undefined,
    strategy: input.repairStrategy.strategy,
    analytics,
    memoryMatches
  });
  await saveStateFile(input.runDir, `repair-regression-risk-${input.label}.json`, risk);
  return risk;
}

function buildProposedPatchIntent(
  repoPath: string,
  operations: ChangeOperation[]
): { targetFile: string; patchContent?: string; patchFiles: string[] } | null {
  const patchableOperations = operations.filter((op) => op.type !== "delete" && op.path);
  if (patchableOperations.length === 0) {
    return null;
  }

  const patchFiles = patchableOperations.map((op) => path.resolve(repoPath, op.path));
  const firstOperation = patchableOperations[0];
  return {
    targetFile: path.resolve(repoPath, firstOperation.path),
    patchContent: patchableOperations.map(operationPatchContent).filter(Boolean).join("\n"),
    patchFiles
  };
}

async function validateAndSavePatchIntent(input: {
  runDir: string;
  label: string;
  repoPath: string;
  repairIntent: RepairIntent | null;
  operations: ChangeOperation[];
}): Promise<PatchIntentValidationResult | null> {
  if (!input.repairIntent) {
    return null;
  }

  const proposedPatch = buildProposedPatchIntent(input.repoPath, input.operations);
  if (!proposedPatch) {
    return null;
  }

  try {
    const validation = validatePatchIntent(input.repairIntent, proposedPatch);
    await saveStateFile(input.runDir, `patch-intent-validation-${input.label}.json`, validation);
    return validation;
  } catch (error) {
    const validation: PatchIntentValidationResult = {
      ok: false,
      reason: error instanceof Error ? error.message : "Patch intent validation failed unexpectedly.",
      safetyNotes: ["Patch intent validation is observational and did not block the run."]
    };
    await saveStateFile(input.runDir, `patch-intent-validation-${input.label}.json`, validation);
    return validation;
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
  const historicalFailureMemory = await loadFailureMemory(repoPath);
  const projectId = await getProjectId(repoPath);
  await saveStateFile(state.runDir, "failure-memory-store-before.json", historicalFailureMemory);

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
  let contextAwareRepairTarget: ContextAwareRepairTarget | null = null;
  let repairStrategy: RepairStrategyDecision | null = null;
  let repairRetryDecision: RepairRetryDecision | null = null;
  let repairIntent: RepairIntent | null = null;
  let repairEvidenceValidation: RepairEvidenceValidation | null = null;
  let repairPatchPolicy: RepairPatchPolicyDecision | null = null;
  let patchIntentValidation: PatchIntentValidationResult | null = null;
  let repairRegressionRisk: RepairRegressionRisk | null = null;
  let errorSignature: string | null = null;
  let initialFailureSignature: string | null = null;
  let failureMemoryHint: FailureMemoryHint | null = null;
  let validationDelta: ValidationDelta | null = null;
  let repairOutcome: RepairOutcomeClassification | null = null;
  let repairDecisionAudit: RepairDecisionAudit | null = null;
  let repairAnalytics: RepairAnalyticsHint | null = null;
  let mutationSkippedForEvidence = false;
  let mutationSkippedForPolicy = false;

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
      const runtimeErrorForPrevalidation = extractRuntimeError(commandResults);
      const prevalidationMemory = await buildAndSaveFailureMemoryHint({
        runDir: state.runDir,
        label: "prevalidation",
        store: historicalFailureMemory,
        projectId,
        runtimeError: runtimeErrorForPrevalidation,
        failure: prevalidationFailure
      });
      errorSignature = prevalidationMemory.errorSignature;
      initialFailureSignature = initialFailureSignature ?? errorSignature;
      failureMemoryHint = prevalidationMemory.hint;
      repairStrategy = await decideAndSaveRepairStrategy({
        runDir: state.runDir,
        label: "prevalidation",
        runtimeError: runtimeErrorForPrevalidation,
        commandResults,
        failureMemory,
        failureMemoryHint
      });
      if (repairStrategy.recommendedAction === "manual-review" || repairStrategy.recommendedAction === "stop") {
        repairRetryDecision = await decideAndSaveRepairRetry({
          runDir: state.runDir,
          label: "prevalidation",
          repairStrategy,
          repairPatchPolicy,
          failureMemory,
          commandResults,
          retryCount: selfHealingAttempt,
          maxRetries: 2,
          validationChanged: false,
          validationPassed: false,
          failureMemoryHint,
          errorSignature
        });
        mutationSkippedForEvidence = true;
        retryStopReason = `Repair strategy requires ${repairStrategy.recommendedAction}`;
        notes.push(`Mutation skipped before repair target selection because repair strategy recommended ${repairStrategy.recommendedAction}.`);
      } else if (repairStrategy.recommendedAction === "collect-more-context") {
        notes.push("Repair strategy requested more context; continuing with context-aware target selection.");
      }
      if (!mutationSkippedForEvidence) {
      contextAwareRepairTarget =
        (await selectAndSaveContextAwareRepairTarget(
          state.runDir,
          repoPath,
          runtimeErrorForPrevalidation,
          "prevalidation"
        )) ?? contextAwareRepairTarget;
      }
      if (contextAwareRepairTarget) {
        repairIntent = await buildAndSaveRepairIntent({
          runDir: state.runDir,
          label: "prevalidation",
          rawOutput: runtimeErrorForPrevalidation,
          target: contextAwareRepairTarget,
          symbolName: prevalidationFailure.details.symbol
        });
        repairEvidenceValidation = await buildAndSaveRepairEvidenceValidation({
          runDir: state.runDir,
          label: "prevalidation",
          rawOutput: runtimeErrorForPrevalidation,
          target: contextAwareRepairTarget,
          repairIntent,
          symbolName: prevalidationFailure.details.symbol
        });
        repairRegressionRisk = await assessAndSaveRepairRegressionRisk({
          runDir: state.runDir,
          label: "prevalidation",
          repoPath,
          repairStrategy,
          failureSignature: errorSignature,
          historicalFailureMemory
        });
        repairEvidenceValidation = applyRegressionGuardToEvidence(repairEvidenceValidation, repairRegressionRisk) ?? repairEvidenceValidation;
        await saveStateFile(state.runDir, "repair-evidence-validation-prevalidation-guarded.json", repairEvidenceValidation);
        repairPatchPolicy =
          (await decideAndSaveRepairPatchPolicy({
            runDir: state.runDir,
            label: "prevalidation",
            repoPath,
            repairIntent,
            repairEvidenceValidation,
            contextAwareRepairTarget,
            operations: []
          })) ?? repairPatchPolicy;
        if (repairEvidenceValidation.allowedRepairMode === "conservative") {
          notes.push("Evidence validation allowed conservative repair mode.");
        }
        if (
          prevalidationFailure.strategy !== "install-dependency" &&
          shouldSkipMutationForEvidenceValidation(repairEvidenceValidation)
        ) {
          mutationSkippedForEvidence = true;
          mutationSkippedForPolicy =
            !!repairPatchPolicy &&
            (!repairPatchPolicy.ok ||
              repairPatchPolicy.recommendedAction === "manual-review" ||
              repairPatchPolicy.recommendedAction === "block-mutation");
          retryStopReason = "Repair evidence validation requires manual review";
          notes.push("Mutation skipped before patch intent validation because repair evidence requires manual review.");
        }
      }
      await rememberFailure(
        state.runDir,
        failureMemory,
        buildFailureMemoryEntry(attempts, prevalidationFailure, false, "Bugfix pre-validation failed before repair strategy")
      );

      if (!mutationSkippedForEvidence) {
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
        const deterministicOps = await buildDeterministicDuplicateDeclarationFix(
          repoPath,
          runtimeErrorForPrevalidation,
          contextAwareRepairTarget
        );
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
        const safeReplacementOps = await buildSafeReplacementFix(
          repoPath,
          runtimeErrorForPrevalidation,
          prevalidationFailure.details.symbol,
          contextAwareRepairTarget
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
        const guardCallOps = await buildGuardCallFix(
          repoPath,
          runtimeErrorForPrevalidation,
          prevalidationFailure.details.symbol,
          contextAwareRepairTarget
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
      } else if (prevalidationFailure.strategy === "reorder-init") {
        const reorderInitOps = await buildReorderInitFix(
          repoPath,
          runtimeErrorForPrevalidation,
          prevalidationFailure.details.symbol,
          contextAwareRepairTarget
        );
        if (reorderInitOps && reorderInitOps.length > 0) {
          initialChanges = { operations: reorderInitOps };
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
    }
  } else {
    initialChanges = parseWithSchema(
      changesSchema,
      await builderAgent(brief, plan, repoSummary, undefined, { runDir: state.runDir, repoPath, mode }),
      "Changeset"
    );
  }
  initialChanges = {
    operations: restrictOperationsToContextAwareTarget(repoPath, initialChanges.operations, contextAwareRepairTarget)
  };
  if (!mutationSkippedForEvidence) {
    if (repairEvidenceValidation && !repairRegressionRisk) {
      repairRegressionRisk = await assessAndSaveRepairRegressionRisk({
        runDir: state.runDir,
        label: "initial",
        repoPath,
        repairStrategy,
        failureSignature: errorSignature,
        historicalFailureMemory
      });
      repairEvidenceValidation = applyRegressionGuardToEvidence(repairEvidenceValidation, repairRegressionRisk) ?? repairEvidenceValidation;
      await saveStateFile(state.runDir, "repair-evidence-validation-initial-guarded.json", repairEvidenceValidation);
    }
    repairPatchPolicy =
      (await decideAndSaveRepairPatchPolicy({
        runDir: state.runDir,
        label: "initial",
        repoPath,
        repairIntent,
        repairEvidenceValidation,
        contextAwareRepairTarget,
        operations: initialChanges.operations
      })) ?? repairPatchPolicy;
    if (
      repairPatchPolicy &&
      (!repairPatchPolicy.ok ||
        repairPatchPolicy.recommendedAction === "manual-review" ||
        repairPatchPolicy.recommendedAction === "block-mutation")
    ) {
      repairRetryDecision = await decideAndSaveRepairRetry({
        runDir: state.runDir,
        label: "initial-policy",
        repairStrategy,
        repairPatchPolicy,
        failureMemory,
        commandResults,
        retryCount: selfHealingAttempt,
        maxRetries: 2,
        validationChanged: false,
        validationPassed: false,
        failureMemoryHint,
        errorSignature
      });
      mutationSkippedForPolicy = true;
      retryStopReason = "Repair patch policy blocked mutation";
      notes.push(`Mutation skipped before patch intent validation because repair patch policy blocked mutation: ${repairPatchPolicy.reason}`);
      initialChanges = { operations: [] };
    }
  }
  if (!mutationSkippedForEvidence && !mutationSkippedForPolicy) {
    patchIntentValidation =
      (await validateAndSavePatchIntent({
        runDir: state.runDir,
        label: "initial",
        repoPath,
        repairIntent,
        operations: initialChanges.operations
      })) ?? patchIntentValidation;
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
    const initialApplyResults = await applyNonDeleteOperations(repoPath, initialChanges.operations);
    totalAppliedChanges = countEffectiveChanges(initialApplyResults);
    appliedPaths.push(...initialApplyResults.filter((result) => result.changed).map((result) => result.path));
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

  while (review.verdict === "fail" && selfHealingAttempt < 2 && !mutationSkippedForEvidence && !mutationSkippedForPolicy) {
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
    const retryMemory = await buildAndSaveFailureMemoryHint({
      runDir: state.runDir,
      label: `attempt-${selfHealingAttempt + dependencyInstallCount + 1}`,
      store: historicalFailureMemory,
      projectId,
      runtimeError: runtimeErrorForRetry,
      failure,
      targetFile: contextAwareRepairTarget?.filePath
    });
    errorSignature = retryMemory.errorSignature;
    initialFailureSignature = initialFailureSignature ?? errorSignature;
    failureMemoryHint = retryMemory.hint;
    repairStrategy = await decideAndSaveRepairStrategy({
      runDir: state.runDir,
      label: `attempt-${selfHealingAttempt + dependencyInstallCount + 1}`,
      runtimeError: runtimeErrorForRetry,
      commandResults,
      failureMemory,
      failureMemoryHint
    });
    repairRetryDecision = await decideAndSaveRepairRetry({
      runDir: state.runDir,
      label: `attempt-${selfHealingAttempt + dependencyInstallCount + 1}`,
      repairStrategy,
      repairPatchPolicy,
      failureMemory,
      commandResults,
      retryCount: selfHealingAttempt,
      maxRetries: 2,
      validationChanged: totalAppliedChanges > 0,
      validationPassed: false,
      failureMemoryHint,
      errorSignature
    });
    if (!repairRetryDecision.shouldRetry) {
      retryStopReason = repairRetryDecision.reason;
      notes.push(`Retry strategy stopped repair: ${repairRetryDecision.reason}`);
      if (repairRetryDecision.nextAction === "manual-review") {
        mutationSkippedForEvidence = true;
      }
      await saveRetryStop(state.runDir, attempts, retryStopReason, failure, failureMemory);
      break;
    }
    if (repairStrategy.recommendedAction === "manual-review" || repairStrategy.recommendedAction === "stop") {
      mutationSkippedForEvidence = true;
      retryStopReason = `Repair strategy requires ${repairStrategy.recommendedAction}`;
      notes.push(`Mutation skipped before repair target selection because repair strategy recommended ${repairStrategy.recommendedAction}.`);
      break;
    } else if (repairStrategy.recommendedAction === "collect-more-context") {
      notes.push("Repair strategy requested more context; continuing with context-aware target selection.");
    }
    const retryContextAwareRepairTarget =
      (await selectAndSaveContextAwareRepairTarget(
        state.runDir,
        repoPath,
        runtimeErrorForRetry,
        `attempt-${selfHealingAttempt + dependencyInstallCount + 1}`
      )) ?? contextAwareRepairTarget;
    contextAwareRepairTarget = retryContextAwareRepairTarget;
    if (retryContextAwareRepairTarget) {
      repairIntent = await buildAndSaveRepairIntent({
        runDir: state.runDir,
        label: `attempt-${selfHealingAttempt + dependencyInstallCount + 1}`,
        rawOutput: runtimeErrorForRetry,
        target: retryContextAwareRepairTarget,
        symbolName: failure.details.symbol
      });
      repairEvidenceValidation = await buildAndSaveRepairEvidenceValidation({
        runDir: state.runDir,
        label: `attempt-${selfHealingAttempt + dependencyInstallCount + 1}`,
        rawOutput: runtimeErrorForRetry,
        target: retryContextAwareRepairTarget,
        repairIntent,
        symbolName: failure.details.symbol
      });
      repairRegressionRisk = await assessAndSaveRepairRegressionRisk({
        runDir: state.runDir,
        label: `attempt-${selfHealingAttempt + dependencyInstallCount + 1}`,
        repoPath,
        repairStrategy,
        failureSignature: errorSignature,
        historicalFailureMemory
      });
      repairEvidenceValidation = applyRegressionGuardToEvidence(repairEvidenceValidation, repairRegressionRisk) ?? repairEvidenceValidation;
      await saveStateFile(
        state.runDir,
        `repair-evidence-validation-attempt-${selfHealingAttempt + dependencyInstallCount + 1}-guarded.json`,
        repairEvidenceValidation
      );
      repairPatchPolicy =
        (await decideAndSaveRepairPatchPolicy({
          runDir: state.runDir,
          label: `attempt-${selfHealingAttempt + dependencyInstallCount + 1}`,
          repoPath,
          repairIntent,
          repairEvidenceValidation,
          contextAwareRepairTarget: retryContextAwareRepairTarget,
          operations: []
        })) ?? repairPatchPolicy;
      if (repairEvidenceValidation.allowedRepairMode === "conservative") {
        notes.push("Evidence validation allowed conservative repair mode.");
      }
      if (failure.strategy !== "install-dependency" && shouldSkipMutationForEvidenceValidation(repairEvidenceValidation)) {
        mutationSkippedForEvidence = true;
        mutationSkippedForPolicy =
          !!repairPatchPolicy &&
          (!repairPatchPolicy.ok ||
            repairPatchPolicy.recommendedAction === "manual-review" ||
            repairPatchPolicy.recommendedAction === "block-mutation");
        retryStopReason = "Repair evidence validation requires manual review";
        notes.push("Mutation skipped before patch intent validation because repair evidence requires manual review.");
        break;
      }
    }

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
          repairRetryDecision = await decideAndSaveRepairRetry({
            runDir: state.runDir,
            label: `after-install-${dependencyInstallCount}`,
            repairStrategy,
            repairPatchPolicy: null,
            failureMemory,
            commandResults,
            retryCount: selfHealingAttempt,
            maxRetries: 2,
            validationChanged: true,
            validationPassed: false,
            failureMemoryHint,
            errorSignature
          });
          if (!repairRetryDecision.shouldRetry) {
            retryStopReason = repairRetryDecision.reason;
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
        ? await buildDeterministicDuplicateDeclarationFix(repoPath, runtimeErrorForRetry, retryContextAwareRepairTarget)
        : null;
    if (deterministicOps && deterministicOps.length > 0) {
      console.log("Deterministic duplicate-declaration fixer generated patch operations.");
      candidateChanges = { operations: deterministicOps };
    } else {
        const safeReplacementOps =
          failure.strategy === "safe-replacement"
          ? await buildSafeReplacementFix(
              repoPath,
              runtimeErrorForRetry,
              failure.details.symbol,
              retryContextAwareRepairTarget
            )
          : null;
      if (safeReplacementOps && safeReplacementOps.length > 0) {
        candidateChanges = { operations: safeReplacementOps };
      } else {
          const guardCallOps =
            failure.strategy === "guard-call"
            ? await buildGuardCallFix(repoPath, runtimeErrorForRetry, failure.details.symbol, retryContextAwareRepairTarget)
            : null;
        if (guardCallOps && guardCallOps.length > 0) {
          candidateChanges = { operations: guardCallOps };
        } else {
            const reorderInitOps =
              failure.strategy === "reorder-init"
              ? await buildReorderInitFix(repoPath, runtimeErrorForRetry, failure.details.symbol, retryContextAwareRepairTarget)
              : null;
          if (reorderInitOps && reorderInitOps.length > 0) {
            candidateChanges = { operations: reorderInitOps };
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
    }

    const parsedFixChanges = parseWithSchema(changesSchema, candidateChanges, `SelfHealingChangeset${selfHealingAttempt}`);
    const fixChanges = {
      operations: restrictOperationsToContextAwareTarget(
        repoPath,
        parsedFixChanges.operations,
        retryContextAwareRepairTarget
      )
    };
    repairPatchPolicy =
      (await decideAndSaveRepairPatchPolicy({
        runDir: state.runDir,
        label: `self-heal-${selfHealingAttempt}`,
        repoPath,
        repairIntent,
        repairEvidenceValidation,
        contextAwareRepairTarget: retryContextAwareRepairTarget,
        operations: fixChanges.operations
      })) ?? repairPatchPolicy;
    if (
      repairPatchPolicy &&
      (!repairPatchPolicy.ok ||
        repairPatchPolicy.recommendedAction === "manual-review" ||
        repairPatchPolicy.recommendedAction === "block-mutation")
    ) {
      repairRetryDecision = await decideAndSaveRepairRetry({
        runDir: state.runDir,
        label: `self-heal-${selfHealingAttempt}-policy`,
        repairStrategy,
        repairPatchPolicy,
        failureMemory,
        commandResults,
        retryCount: selfHealingAttempt,
        maxRetries: 2,
        validationChanged: false,
        validationPassed: false,
        failureMemoryHint,
        errorSignature
      });
      mutationSkippedForPolicy = true;
      retryStopReason = "Repair patch policy blocked mutation";
      notes.push(`Mutation skipped before patch intent validation because repair patch policy blocked mutation: ${repairPatchPolicy.reason}`);
      await saveStateFile(state.runDir, `self-heal-${selfHealingAttempt}-changes.json`, fixChanges);
      await rememberFailure(
        state.runDir,
        failureMemory,
        buildFailureMemoryEntry(attempts, failure, false, "Repair patch policy blocked mutation")
      );
      break;
    }
    patchIntentValidation =
      (await validateAndSavePatchIntent({
        runDir: state.runDir,
        label: `self-heal-${selfHealingAttempt}`,
        repoPath,
        repairIntent,
        operations: fixChanges.operations
      })) ?? patchIntentValidation;
    await saveStateFile(state.runDir, `self-heal-${selfHealingAttempt}-changes.json`, fixChanges);

    if (fixChanges.operations.length === 0) {
      notes.push(`Self-healing attempt ${selfHealingAttempt} generated no file operations.`);
      await rememberFailure(
        state.runDir,
        failureMemory,
        buildFailureMemoryEntry(attempts, failure, false, "Repair strategy generated no file operations")
      );
      repairRetryDecision = await decideAndSaveRepairRetry({
        runDir: state.runDir,
        label: `self-heal-${selfHealingAttempt}-no-operations`,
        repairStrategy,
        repairPatchPolicy,
        failureMemory,
        commandResults,
        retryCount: selfHealingAttempt,
        maxRetries: 2,
        validationChanged: false,
        validationPassed: false,
        failureMemoryHint,
        errorSignature
      });
      if (!repairRetryDecision.shouldRetry) {
        retryStopReason = repairRetryDecision.reason;
        console.log(`Retry stopped: ${retryStopReason}`);
        await saveRetryStop(state.runDir, attempts, retryStopReason ?? "Retry stopped", failure, failureMemory);
        break;
      }
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
    const fixApplyResults = await applyNonDeleteOperations(repoPath, fixChanges.operations);
    const fixChanged = hasEffectiveChange(fixApplyResults);
    totalAppliedChanges += countEffectiveChanges(fixApplyResults);
    appliedPaths.push(...fixApplyResults.filter((result) => result.changed).map((result) => result.path));
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
        buildFailureMemoryEntry(
          attempts,
          postRepairFailure,
          fixChanged,
          fixChanged
            ? "Validation still failed after repair strategy"
            : "Validation still failed after repair strategy; no effective change was applied"
        )
      );
      repairRetryDecision = await decideAndSaveRepairRetry({
        runDir: state.runDir,
        label: `post-repair-${attempts}`,
        repairStrategy,
        repairPatchPolicy,
        failureMemory,
        commandResults,
        retryCount: selfHealingAttempt,
        maxRetries: 2,
        validationChanged: fixChanged,
        validationPassed: false,
        failureMemoryHint,
        errorSignature
      });
      if (!repairRetryDecision.shouldRetry) {
        retryStopReason = repairRetryDecision.reason;
        console.log(`Retry stopped: ${retryStopReason}`);
        await saveRetryStop(state.runDir, attempts, retryStopReason ?? "Retry stopped", postRepairFailure, failureMemory);
        break;
      }
      const decision = shouldContinueRetry({
        failureMemory,
        currentFailure: postRepairFailure,
        attempt: attempts,
        maxAttempts: maxRetryAttempts,
        changeApplied: fixChanged
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
  let finalFailureSignature: string | undefined;
  if (review.verdict === "fail" && commandResults) {
    const finalFailure = classifyCommandFailure(commandResults);
    const finalRuntimeError = extractRuntimeError(commandResults);
    finalFailureSignature = buildFailureSignature({
      errorType: finalFailure.type,
      errorMessage: finalFailure.details.rawMessage || finalRuntimeError,
      stderr: finalRuntimeError,
      topProjectStackFrame: findErrorFileFromStack(finalRuntimeError) ?? undefined,
      targetFile: contextAwareRepairTarget?.filePath,
      symbolName: finalFailure.details.symbol ?? finalFailure.details.moduleName
    });
  }
  validationDelta = buildValidationDelta({
    beforeSignature: initialFailureSignature ?? errorSignature,
    afterSignature: finalFailureSignature,
    validationPassed: review.verdict === "pass",
    validationProgressed: !!finalFailureSignature && !!(initialFailureSignature ?? errorSignature) && finalFailureSignature !== (initialFailureSignature ?? errorSignature)
  });
  repairOutcome = classifyRepairOutcome({
    validationDelta,
    validationPassed: review.verdict === "pass",
    evidenceManualReview: mutationSkippedForEvidence || repairRetryDecision?.nextAction === "manual-review",
    patchPolicy: repairPatchPolicy,
    retryBlockedByHistory: repairRetryDecision?.reason.toLowerCase().includes("failure memory") ?? false
  });
  repairDecisionAudit = auditRepairDecision({
    retryDecision: repairRetryDecision,
    reasonCode: repairOutcome.reasonCode,
    policyDenied: mutationSkippedForPolicy || repairOutcome.outcome === "policy-denied",
    manualReview: mutationSkippedForEvidence || repairOutcome.outcome === "manual-review-required",
    historyBlocked: repairOutcome.reasonCode === "RETRY_BLOCKED_BY_HISTORY",
    evidenceWarnings: repairEvidenceValidation?.warnings,
    policyWarnings: repairPatchPolicy?.warnings,
    memoryWarnings: failureMemoryHint?.warnings
  });
  await saveStateFile(state.runDir, "validation-delta.json", validationDelta);
  await saveStateFile(state.runDir, "repair-outcome.json", repairOutcome);
  await saveStateFile(state.runDir, "repair-decision-audit.json", repairDecisionAudit);

  let failureMemoryOutcome: FailureMemoryOutcome | null = null;
  if (errorSignature && repairStrategy) {
    failureMemoryOutcome = repairOutcome.outcome === "policy-denied"
      ? "policy-denied"
      : repairOutcome.outcome === "manual-review-required"
      ? "manual-review"
      : repairOutcome.outcome === "success"
      ? "success"
      : "failed";
    const updatedMemory = await updateFailureMemory({
      repoPath,
      errorSignature,
      strategy: repairStrategy.strategy,
      repairType: repairIntent?.repairType,
      targetFile: contextAwareRepairTarget?.filePath,
      outcome: failureMemoryOutcome,
      validationChanged: repairOutcome.changedValidationState,
      retryCount: attempts
    });
    await saveStateFile(state.runDir, "failure-memory-update.json", {
      errorSignature,
      outcome: failureMemoryOutcome,
      repairOutcome: repairOutcome.outcome,
      reasonCode: repairOutcome.reasonCode,
      strategy: repairStrategy.strategy,
      repairType: repairIntent?.repairType,
      targetFile: contextAwareRepairTarget?.filePath,
      retryCount: attempts
    });
    await saveStateFile(state.runDir, "failure-memory-store-after.json", updatedMemory);
  }
  if (repairStrategy && repairOutcome) {
    const analyticsStore = await updateRepairAnalytics({
      projectRoot: repoPath,
      strategy: repairStrategy.strategy,
      outcome: repairOutcome.outcome
    });
    const strategyAnalytics = analyticsStore.strategies[repairStrategy.strategy] ?? null;
    repairAnalytics = buildRepairAnalyticsHint({ analytics: strategyAnalytics });
    await saveStateFile(state.runDir, "repair-analytics-update.json", {
      strategy: repairStrategy.strategy,
      analytics: strategyAnalytics,
      hint: repairAnalytics
    });
  }
  const observabilityReport = buildRepairObservabilityReport({
    runId: state.runId,
    task: input.task,
    timestamp: Date.now(),
    repairStrategy,
    repairRetryDecision,
    failureSignature: errorSignature,
    validationDelta,
    repairOutcome,
    repairDecisionAudit,
    repairAnalytics,
    repairRegressionRisk,
    failureMemory: failureMemoryHint
      ? {
          ...failureMemoryHint,
          outcomeRecorded: failureMemoryOutcome
        }
      : null,
    repairIntent,
    repairEvidenceValidation,
    repairPatchPolicy,
    patchIntentValidation,
    repairTarget: contextAwareRepairTarget,
    safePatch: {
      appliedChanges: totalAppliedChanges,
      changedFiles: appliedPaths,
      commitCreated: commitResult.committed
    },
    validation: review,
    mutationSkippedForEvidence,
    mutationSkippedForPolicy
  });
  await saveStateFile(state.runDir, "repair-observability.json", observabilityReport);
  const decisionTraceSteps = buildRepairDecisionTrace(observabilityReport);
  const decisionTraceMarkdown = renderRepairDecisionTraceMarkdown({
    report: observabilityReport,
    steps: decisionTraceSteps
  });
  await fs.writeFile(path.join(state.runDir, "decision-trace.md"), decisionTraceMarkdown, "utf8");
  const repairSummary = buildRepairSummary(observabilityReport);
  await saveStateFile(state.runDir, "repair-summary.json", repairSummary);
  const repairReview = buildRepairReview({
    observabilityReport,
    repairSummary,
    decisionTraceSteps
  });
  await saveStateFile(state.runDir, "repair-review.json", repairReview);
  await fs.writeFile(path.join(state.runDir, "repair-review.md"), renderRepairReviewMarkdown(repairReview), "utf8");
  const repairReviewAnalytics = updateRepairReviewAnalytics({
    projectRoot: repoPath,
    repairReview,
    outcome: repairOutcome?.outcome,
    strategy: repairStrategy?.strategy,
    regressionRisk: repairRegressionRisk?.riskLevel,
    patchPolicyMode: repairPatchPolicy?.mode
  });
  await saveStateFile(state.runDir, "repair-review-analytics-snapshot.json", repairReviewAnalytics);
  const repairTrustIndex = buildRepairTrustIndex({
    repairOutcome,
    repairReview,
    repairReviewAnalytics,
    repairAnalytics,
    repairEvidenceValidation,
    repairRegressionRisk,
    repairPatchPolicy,
    repairDecisionAudit,
    validation: review
  });
  await saveStateFile(state.runDir, "repair-trust-index.json", repairTrustIndex);
  await fs.writeFile(path.join(state.runDir, "repair-trust-index.md"), renderRepairTrustIndexMarkdown(repairTrustIndex), "utf8");
  const repairReleaseGate = buildRepairReleaseGate({
    repairTrustIndex,
    repairReview,
    validation: review,
    repairOutcome,
    repairPatchPolicy,
    repairRegressionRisk,
    repairReviewAnalytics,
    repairAnalytics,
    repairDecisionAudit
  });
  await saveStateFile(state.runDir, "repair-release-gate.json", repairReleaseGate);
  await fs.writeFile(
    path.join(state.runDir, "repair-release-gate.md"),
    renderRepairReleaseGateMarkdown(repairReleaseGate),
    "utf8"
  );
  const repairGovernance = buildRepairGovernance({
    repairReleaseGate,
    repairTrustIndex,
    repairReview,
    repairOutcome,
    validation: review,
    repairEvidenceValidation,
    repairRegressionRisk,
    repairPatchPolicy,
    repairReviewAnalytics,
    repairAnalytics,
    repairDecisionAudit
  });
  await saveStateFile(state.runDir, "repair-governance.json", repairGovernance);
  await fs.writeFile(path.join(state.runDir, "repair-governance.md"), renderRepairGovernanceMarkdown(repairGovernance), "utf8");
  let runIndexUpdated = false;
  let runIndexWarning: string | null = null;
  try {
    const runIndexEntry = buildRunIndexEntry({
      projectRoot: repoPath,
      runId: state.runId,
      runDir: state.runDir,
      repairSummary,
      repairReview,
      repairTrustIndex,
      repairReleaseGate,
      repairGovernance,
      repairOutcome,
      validation: review
    });
    const runsIndex = updateRunsIndex(loadRunsIndex(repoPath), runIndexEntry);
    saveRunsIndex(repoPath, runsIndex);
    runIndexUpdated = true;
  } catch (error) {
    runIndexWarning = error instanceof Error ? error.message : String(error);
  }

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
    `- Context-aware repair target: ${contextAwareRepairTarget?.filePath ?? "None"}`,
    `- Context-aware repair confidence: ${contextAwareRepairTarget?.confidence ?? "n/a"}`,
    `- Context-aware repair reason: ${contextAwareRepairTarget?.reason ?? "n/a"}`,
    "",
    "## Final decision",
    `Status: ${observabilityReport.finalDecision.status}`,
    `Reason: ${observabilityReport.finalDecision.reason}`,
    `Blocking layer: ${observabilityReport.finalDecision.blockingLayer ?? "none"}`,
    "",
    "## Observability artifacts",
    "- repair-observability.json",
    "- decision-trace.md",
    "- repair-summary.json",
    "",
    "## Repair review",
    `Verdict: ${repairReview.verdict}`,
    `Quality score: ${repairReview.qualityScore}`,
    `Safety score: ${repairReview.safetyScore}`,
    `Completeness score: ${repairReview.completenessScore}`,
    "",
    "## Review artifacts",
    "- repair-review.md",
    "- repair-review.json",
    "",
    "## Repair Review Analytics",
    `Total reviews: ${repairReviewAnalytics.totalReviews}`,
    "Verdict distribution:",
    `- approved: ${repairReviewAnalytics.verdictCounts.approved}`,
    `- approved-with-warnings: ${repairReviewAnalytics.verdictCounts["approved-with-warnings"]}`,
    `- needs-human-review: ${repairReviewAnalytics.verdictCounts["needs-human-review"]}`,
    `- rejected: ${repairReviewAnalytics.verdictCounts.rejected}`,
    "",
    "Average scores:",
    `- Quality: ${repairReviewAnalytics.averageScores.qualityScore}`,
    `- Safety: ${repairReviewAnalytics.averageScores.safetyScore}`,
    `- Completeness: ${repairReviewAnalytics.averageScores.completenessScore}`,
    "",
    "Analytics warnings:",
    repairReviewAnalytics.warnings.length
      ? repairReviewAnalytics.warnings.map((warning) => `- ${warning}`).join("\n")
      : "- None",
    "",
    "## Repair Trust Index",
    `Trust level: ${repairTrustIndex.trustLevel}`,
    `Trust score: ${repairTrustIndex.trustScore}`,
    "",
    "Summary:",
    repairTrustIndex.summary,
    "",
    "Artifacts:",
    "- repair-trust-index.json",
    "- repair-trust-index.md",
    "",
    "## Repair Release Gate",
    `Release decision: ${repairReleaseGate.releaseDecision}`,
    `Release score: ${repairReleaseGate.releaseScore}`,
    "",
    "Summary:",
    repairReleaseGate.summary,
    "",
    "Artifacts:",
    "- repair-release-gate.json",
    "- repair-release-gate.md",
    "",
    "## Repair Governance",
    `Governance status: ${repairGovernance.governanceStatus}`,
    "",
    "Summary:",
    repairGovernance.summary,
    "",
    "Final decision:",
    `- Can proceed: ${repairGovernance.finalDecision.canProceed}`,
    `- Requires human review: ${repairGovernance.finalDecision.requiresHumanReview}`,
    `- Is blocked: ${repairGovernance.finalDecision.isBlocked}`,
    "",
    "Artifacts:",
    "- repair-governance.json",
    "- repair-governance.md",
    "",
    "## Run Index",
    `Run index updated: ${runIndexUpdated ? "yes" : "no"}`,
    runIndexUpdated ? "Index artifact:" : "Index warning:",
    runIndexUpdated ? "- .factory/runs-index.json" : `- ${runIndexWarning ?? "Unknown run index update failure"}`,
    "",
    "## Repair strategy",
    `- Strategy: ${repairStrategy?.strategy ?? "not available"}`,
    `- Confidence: ${repairStrategy?.confidence ?? "not available"}`,
    `- Target kind: ${repairStrategy?.targetKind ?? "not available"}`,
    `- Reason: ${repairStrategy?.reason ?? "not available"}`,
    `- Recommended action: ${repairStrategy?.recommendedAction ?? "not available"}`,
    `- Strategy source: ${repairStrategy?.strategySource ?? "not available"}`,
    `- Warnings: ${repairStrategy ? formatList(repairStrategy.warnings) : "not available"}`,
    `- Must avoid strategies: ${repairStrategy ? formatList(repairStrategy.mustAvoidStrategies) : "not available"}`,
    "",
    "## Retry strategy",
    `- Should retry: ${repairRetryDecision ? String(repairRetryDecision.shouldRetry) : "not available"}`,
    `- Next action: ${repairRetryDecision?.nextAction ?? "not available"}`,
    `- Reason: ${repairRetryDecision?.reason ?? "not available"}`,
    `- Previous strategies: ${repairRetryDecision ? formatList(repairRetryDecision.previousStrategies) : "not available"}`,
    `- Blocked strategies: ${repairRetryDecision ? formatList(repairRetryDecision.blockedStrategies) : "not available"}`,
    "",
    "## Failure memory",
    `- Failure signature: ${errorSignature ?? "not available"}`,
    `- Historical matches: ${failureMemoryHint?.historicalMatches ?? "not available"}`,
    `- Historically failed strategies: ${failureMemoryHint ? formatList(failureMemoryHint.failedStrategies) : "not available"}`,
    `- Historically successful strategies: ${failureMemoryHint ? formatList(failureMemoryHint.successfulStrategies) : "not available"}`,
    `- Discouraged strategies: ${failureMemoryHint ? formatList(failureMemoryHint.discouragedStrategies) : "not available"}`,
    `- Preferred strategies: ${failureMemoryHint ? formatList(failureMemoryHint.preferredStrategies) : "not available"}`,
    `- Retry recommendation: ${
      failureMemoryHint ? (failureMemoryHint.recommendManualReview ? "manual-review" : "continue-with-gates") : "not available"
    }`,
    `- Failure memory warnings: ${failureMemoryHint ? formatList(failureMemoryHint.warnings) : "not available"}`,
    "",
    "## Regression Risk",
    `- Risk level: ${repairRegressionRisk?.riskLevel ?? "not available"}`,
    `- Blocked: ${repairRegressionRisk ? (repairRegressionRisk.blocked ? "yes" : "no") : "not available"}`,
    `- Recommended action: ${repairRegressionRisk?.recommendedAction ?? "not available"}`,
    `- Risk reasons: ${repairRegressionRisk ? formatList(repairRegressionRisk.riskReasons) : "not available"}`,
    `- Warnings: ${repairRegressionRisk ? formatList(repairRegressionRisk.warnings) : "not available"}`,
    "",
    "## Repair outcome",
    `- Outcome: ${repairOutcome?.outcome ?? "not available"}`,
    `- Reason code: ${repairOutcome?.reasonCode ?? "not available"}`,
    `- Changed validation state: ${repairOutcome ? String(repairOutcome.changedValidationState) : "not available"}`,
    `- Before failure signature: ${repairOutcome?.beforeFailureSignature ?? "not available"}`,
    `- After failure signature: ${repairOutcome?.afterFailureSignature ?? "not available"}`,
    `- Explanation: ${repairOutcome?.explanation ?? "not available"}`,
    `- Warnings: ${repairOutcome ? formatList(repairOutcome.warnings) : "not available"}`,
    "",
    "## Retry audit",
    `- Retry decision: ${repairDecisionAudit?.retryDecision ?? "not available"}`,
    `- Reason code: ${repairDecisionAudit?.reasonCode ?? "not available"}`,
    `- Explanation: ${repairDecisionAudit?.explanation ?? "not available"}`,
    `- Blocking factors: ${repairDecisionAudit ? formatList(repairDecisionAudit.blockingFactors) : "not available"}`,
    `- Influencing factors: ${repairDecisionAudit ? formatList(repairDecisionAudit.influencingFactors) : "not available"}`,
    "",
    "## Historical strategy effectiveness",
    `- Strategy: ${repairAnalytics?.strategy ?? repairStrategy?.strategy ?? "not available"}`,
    `- Effectiveness score: ${repairAnalytics?.effectivenessScore ?? "not available"}`,
    `- Historical success rate: ${repairAnalytics?.historicalSuccessRate ?? "not available"}`,
    `- Historical failure rate: ${repairAnalytics?.historicalFailureRate ?? "not available"}`,
    `- Validation improvement rate: ${repairAnalytics?.validationImprovementRate ?? "not available"}`,
    `- Worsened rate: ${repairAnalytics?.worsenedRate ?? "not available"}`,
    `- Policy denied rate: ${repairAnalytics?.policyDeniedRate ?? "not available"}`,
    `- Manual review rate: ${repairAnalytics?.manualReviewRate ?? "not available"}`,
    "",
    "## Strategy analytics recommendation",
    repairAnalytics
      ? `Analytics hint: advisory-only; warnings: ${formatList(repairAnalytics.warnings)}`
      : "Analytics hint: not available",
    "This analytics hint is advisory-only and does not bypass evidence validation, patch policy, patch intent validation, Safe Patch Engine, or retry safety rules.",
    "",
    `- Repair intent: ${repairIntent?.repairType ?? "None"}`,
    `- Repair intent target: ${repairIntent?.targetFile ?? "n/a"}`,
    `- Repair intent confidence: ${repairIntent?.confidence ?? "n/a"}`,
    `- Repair intent scope: ${repairIntent?.allowedMutationScope ?? "n/a"}`,
    `- Repair intent reason: ${repairIntent?.reason ?? "n/a"}`,
    `- Repair evidence validation: ${
      repairEvidenceValidation ? (repairEvidenceValidation.ok ? "ok" : "failed") : "n/a"
    }`,
    `- Repair evidence confidence: ${repairEvidenceValidation?.confidence ?? "n/a"}`,
    `- Repair evidence mode: ${repairEvidenceValidation?.allowedRepairMode ?? "n/a"}`,
    `- Repair evidence allowedRepairMode: ${repairEvidenceValidation?.allowedRepairMode ?? "n/a"}`,
    `- Repair evidence reason: ${repairEvidenceValidation?.reason ?? "n/a"}`,
    `- Repair evidence warnings: ${
      repairEvidenceValidation?.warnings.length ? repairEvidenceValidation.warnings.join(" | ") : "None"
    }`,
    `- Mutation skipped before patch intent validation: ${mutationSkippedForEvidence ? "yes" : "no"}`,
    mutationSkippedForEvidence
      ? "- Evidence validation outcome: mutation was skipped before patch intent validation"
      : "- Evidence validation outcome: mutation was allowed to continue",
    `- Repair patch policy: ${repairPatchPolicy ? (repairPatchPolicy.ok ? "ok" : "blocked") : "n/a"}`,
    `- Repair patch policy mode: ${repairPatchPolicy?.mode ?? "n/a"}`,
    `- Repair patch policy recommended action: ${repairPatchPolicy?.recommendedAction ?? "n/a"}`,
    `- Repair patch policy reason: ${repairPatchPolicy?.reason ?? "n/a"}`,
    `- Mutation skipped by repair patch policy: ${mutationSkippedForPolicy ? "yes" : "no"}`,
    mutationSkippedForPolicy
      ? "- Repair patch policy outcome: mutation was skipped before patch intent validation"
      : "- Repair patch policy outcome: mutation was allowed to continue or not evaluated",
    `- Patch intent validation: ${
      patchIntentValidation ? (patchIntentValidation.ok ? "ok" : "failed") : "n/a"
    }`,
    `- Patch intent validation reason: ${patchIntentValidation?.reason ?? "n/a"}`,
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
