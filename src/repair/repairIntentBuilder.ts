import path from "node:path";
import {
  createUnknownRepairIntent,
  type RepairConfidence,
  type RepairIntent,
  type RepairType
} from "./repairIntent.js";

interface RepairTargetDecisionInput {
  targetFile: string;
  reason?: string;
  confidence?: string;
  sourceFile?: string;
  symbolName?: string;
}

export interface BuildRepairIntentParams {
  parsedStackTrace?: unknown;
  errorContext?: unknown;
  dependencyMap?: unknown;
  repairTargetDecision: RepairTargetDecisionInput;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function stringField(value: unknown, field: string): string {
  if (!isRecord(value)) return "";
  const raw = value[field];
  return typeof raw === "string" ? raw : "";
}

function getErrorName(params: BuildRepairIntentParams): string {
  return (
    stringField(params.parsedStackTrace, "errorType") ||
    stringField(params.parsedStackTrace, "name") ||
    stringField(params.parsedStackTrace, "type")
  );
}

function getErrorMessage(params: BuildRepairIntentParams): string {
  return (
    stringField(params.parsedStackTrace, "message") ||
    stringField(params.errorContext, "message") ||
    params.repairTargetDecision.reason ||
    ""
  );
}

function includesAny(value: string, needles: string[]): boolean {
  const normalized = value.toLowerCase();
  return needles.some((needle) => normalized.includes(needle.toLowerCase()));
}

function samePath(left?: string, right?: string): boolean {
  if (!left || !right) return false;
  return path.normalize(left).toLowerCase() === path.normalize(right).toLowerCase();
}

function confidenceFromDecision(
  value: string | undefined,
  fallback: RepairConfidence
): RepairConfidence {
  return value === "high" || value === "medium" || value === "low" ? value : fallback;
}

function intent(input: {
  repairType: RepairType;
  targetFile: string;
  sourceFile?: string;
  symbolName?: string;
  reason: string;
  confidence: RepairConfidence;
  safetyNotes: string[];
}): RepairIntent {
  return {
    repairType: input.repairType,
    targetFile: input.targetFile,
    sourceFile: input.sourceFile,
    symbolName: input.symbolName,
    reason: input.reason,
    confidence: input.confidence,
    allowedMutationScope: "single-file",
    safetyNotes: input.safetyNotes
  };
}

export function buildRepairIntent(params: BuildRepairIntentParams): RepairIntent {
  const targetFile = params.repairTargetDecision.targetFile;
  const sourceFile =
    params.repairTargetDecision.sourceFile ||
    stringField(params.errorContext, "filePath") ||
    stringField(params.parsedStackTrace, "filePath");
  const symbolName = params.repairTargetDecision.symbolName;
  const errorName = getErrorName(params);
  const errorMessage = getErrorMessage(params);
  const reason = params.repairTargetDecision.reason ?? "";
  const combined = `${errorName}\n${errorMessage}\n${reason}`;

  if (includesAny(combined, ["missing export", "does not provide an export", "export named"])) {
    return intent({
      repairType: "missing-export",
      targetFile,
      sourceFile,
      symbolName,
      reason: `Evidence suggests a missing export relationship for ${symbolName ?? "the referenced symbol"}.`,
      confidence: confidenceFromDecision(params.repairTargetDecision.confidence, "medium"),
      safetyNotes: [
        "Mutation must remain constrained to the selected target file.",
        "Prefer adding or correcting the smallest export surface."
      ]
    });
  }

  if (includesAny(combined, ["wrong import", "import mismatch", "named import not found", "imported symbol mismatch"])) {
    return intent({
      repairType: "import-mismatch",
      targetFile,
      sourceFile,
      symbolName,
      reason: `Evidence suggests an import mismatch for ${symbolName ?? "the referenced symbol"}.`,
      confidence: "medium",
      safetyNotes: [
        "Mutation must remain constrained to the selected target file.",
        "Avoid unrelated import/export rewrites."
      ]
    });
  }

  if (includesAny(combined, ["SyntaxError"])) {
    return intent({
      repairType: "syntax-error",
      targetFile,
      sourceFile,
      symbolName,
      reason: `Syntax error was detected in or near the selected target file: ${targetFile}.`,
      confidence: "high",
      safetyNotes: [
        "Mutation must remain constrained to a single file.",
        "Avoid broad rewrites; make the smallest syntax repair possible."
      ]
    });
  }

  if (includesAny(combined, ["is not a function"])) {
    return intent({
      repairType: "import-mismatch",
      targetFile,
      sourceFile,
      symbolName,
      reason: "TypeError indicates a possible imported symbol mismatch or missing function definition.",
      confidence: "medium",
      safetyNotes: [
        "Mutation must remain constrained to the selected target file.",
        "Verify the function symbol before changing import or export shape."
      ]
    });
  }

  if (includesAny(combined, ["ReferenceError"]) && samePath(targetFile, sourceFile)) {
    return intent({
      repairType: "runtime-local-error",
      targetFile,
      sourceFile,
      symbolName,
      reason: "Runtime error appears local to the selected target file.",
      confidence: "medium",
      safetyNotes: [
        "Mutation must remain constrained to the selected target file.",
        "Avoid import/export rewrites unless directly required by the local runtime error."
      ]
    });
  }

  return createUnknownRepairIntent({
    targetFile,
    reason: params.repairTargetDecision.reason
  });
}
