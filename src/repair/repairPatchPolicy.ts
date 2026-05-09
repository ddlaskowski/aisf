export type RepairPatchPolicyDecision = {
  ok: boolean;
  mode: "normal" | "conservative" | "manual-review";
  allowedOperations: string[];
  blockedOperations: string[];
  warnings: string[];
  reason: string;
  recommendedAction:
    | "proceed"
    | "downgrade-to-conservative"
    | "block-mutation"
    | "manual-review";
};

export type RepairPatchPolicyInput = {
  repairIntent?: unknown;
  evidenceValidation?: unknown;
  proposedPatchOperations?: unknown;
  repairTargetDecision?: unknown;
};

const CONSERVATIVE_ALLOWED_OPERATIONS = [
  "exact-replacement",
  "add-missing-export",
  "correct-imported-symbol",
  "remove-duplicate-declaration",
  "small-single-line-edit"
];

const CONSERVATIVE_BLOCKED_OPERATIONS = [
  "risky-append",
  "large-append",
  "full-file-replacement",
  "broad-import-rewrite",
  "multi-file-mutation",
  "wrong-target-file"
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown, field: string): string {
  if (!isRecord(value)) {
    return "";
  }

  const raw = value[field];
  return typeof raw === "string" ? raw : "";
}

function readBoolean(value: unknown, field: string): boolean | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const raw = value[field];
  return typeof raw === "boolean" ? raw : undefined;
}

function normalizeMode(value: unknown): RepairPatchPolicyDecision["mode"] {
  return value === "normal" || value === "conservative" || value === "manual-review"
    ? value
    : "manual-review";
}

function normalizeConfidence(value: unknown): "high" | "medium" | "low" {
  return value === "high" || value === "medium" || value === "low" ? value : "low";
}

function normalizeOperationName(value: string): string {
  return value.trim().toLowerCase();
}

function readOperationName(operation: unknown): string {
  if (typeof operation === "string") {
    return normalizeOperationName(operation);
  }

  if (!isRecord(operation)) {
    return "unknown-operation";
  }

  return normalizeOperationName(
    readString(operation, "operation") ||
      readString(operation, "operationType") ||
      readString(operation, "policyOperation") ||
      readString(operation, "kind") ||
      readString(operation, "type") ||
      "unknown-operation"
  );
}

function readProposedOperationNames(proposedPatchOperations: unknown): string[] {
  if (!Array.isArray(proposedPatchOperations)) {
    return [];
  }

  return proposedPatchOperations.map(readOperationName).filter(Boolean);
}

function normalizePath(value: string): string {
  return value.replace(/\\/g, "/").replace(/^\.\//, "").toLowerCase();
}

function readTargetFile(value: unknown): string {
  return (
    readString(value, "targetFile") ||
    readString(value, "path") ||
    readString(value, "filePath") ||
    readString(value, "file")
  );
}

function getRepairTargetFile(input: RepairPatchPolicyInput): string {
  return readTargetFile(input.repairIntent) || readTargetFile(input.repairTargetDecision);
}

function readPatchFiles(operation: unknown): string[] {
  if (!isRecord(operation)) {
    return [];
  }

  const raw = operation["patchFiles"];
  return Array.isArray(raw) ? raw.filter((file): file is string => typeof file === "string" && !!file.trim()) : [];
}

function detectTargetPolicyBlocks(input: RepairPatchPolicyInput): string[] {
  const repairTargetFile = getRepairTargetFile(input);
  if (!repairTargetFile || !Array.isArray(input.proposedPatchOperations)) {
    return [];
  }

  const normalizedRepairTarget = normalizePath(repairTargetFile);
  const blocked: string[] = [];

  for (const operation of input.proposedPatchOperations) {
    const operationTarget = readTargetFile(operation);
    if (operationTarget && normalizePath(operationTarget) !== normalizedRepairTarget) {
      blocked.push("wrong-target-file");
    }

    const patchFiles = readPatchFiles(operation).map(normalizePath);
    const uniquePatchFiles = unique(patchFiles);
    if (uniquePatchFiles.length > 1) {
      blocked.push("multi-file-mutation");
    }

    if (uniquePatchFiles.some((file) => file !== normalizedRepairTarget)) {
      blocked.push("wrong-target-file");
    }
  }

  return unique(blocked);
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

function manualReview(reason: string, warnings: string[] = []): RepairPatchPolicyDecision {
  return {
    ok: false,
    mode: "manual-review",
    allowedOperations: [],
    blockedOperations: [],
    warnings,
    reason,
    recommendedAction: "manual-review"
  };
}

export function decideRepairPatchPolicy(input: RepairPatchPolicyInput): RepairPatchPolicyDecision {
  const evidenceValidation = input.evidenceValidation;
  if (!isRecord(evidenceValidation)) {
    return manualReview("Repair evidence validation is missing.", [
      "Patch policy requires evidence validation before mutation."
    ]);
  }

  const evidenceOk = readBoolean(evidenceValidation, "ok");
  const mode = normalizeMode(readString(evidenceValidation, "allowedRepairMode"));
  const confidence = normalizeConfidence(readString(evidenceValidation, "confidence"));

  if (evidenceOk !== true) {
    return manualReview("Repair evidence validation did not pass.", [
      "Mutation requires ok evidence validation."
    ]);
  }

  if (mode === "manual-review") {
    return manualReview("Repair evidence validation requires manual review.", [
      "Mutation is blocked before patch intent validation."
    ]);
  }

  if (mode === "normal") {
    if (confidence !== "high") {
      return {
        ok: true,
        mode: "conservative",
        allowedOperations: CONSERVATIVE_ALLOWED_OPERATIONS,
        blockedOperations: [],
        warnings: ["Normal mode requires high confidence; downgraded to conservative policy."],
        reason: "Evidence passed, but confidence is not high enough for normal patch policy.",
        recommendedAction: "downgrade-to-conservative"
      };
    }

    return {
      ok: true,
      mode: "normal",
      allowedOperations: ["single-file-safe-patch"],
      blockedOperations: [],
      warnings: [],
      reason: "Evidence validation supports normal patch policy.",
      recommendedAction: "proceed"
    };
  }

  const proposedOperations = readProposedOperationNames(input.proposedPatchOperations);
  const blockedOperations = unique([
    ...proposedOperations.filter((operation) => !CONSERVATIVE_ALLOWED_OPERATIONS.includes(operation)),
    ...detectTargetPolicyBlocks(input)
  ]);
  const allowedOperations = unique(
    proposedOperations.filter((operation) => CONSERVATIVE_ALLOWED_OPERATIONS.includes(operation))
  );

  if (blockedOperations.length > 0) {
    return {
      ok: false,
      mode: "conservative",
      allowedOperations: allowedOperations.length > 0 ? allowedOperations : CONSERVATIVE_ALLOWED_OPERATIONS,
      blockedOperations,
      warnings: blockedOperations.map((operation) => `Operation blocked by conservative policy: ${operation}`),
      reason: "Conservative patch policy blocked one or more proposed operations.",
      recommendedAction: "block-mutation"
    };
  }

  return {
    ok: true,
    mode: "conservative",
    allowedOperations: allowedOperations.length > 0 ? allowedOperations : CONSERVATIVE_ALLOWED_OPERATIONS,
    blockedOperations: CONSERVATIVE_BLOCKED_OPERATIONS,
    warnings: ["Evidence validation allowed conservative repair mode."],
    reason: "Conservative patch policy allows the proposed operation set.",
    recommendedAction: "proceed"
  };
}
