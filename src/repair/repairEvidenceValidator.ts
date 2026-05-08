export type RepairEvidenceValidation = {
  ok: boolean;
  confidence: "high" | "medium" | "low";
  evidence: string[];
  warnings: string[];
  reason: string;
  downgradedFrom?: "high" | "medium";
  allowedRepairMode: "normal" | "conservative" | "manual-review";
};

export type RepairEvidenceValidationInput = {
  parsedStackTrace: unknown;
  errorContext: unknown;
  dependencyMap: unknown;
  repairTargetDecision: unknown;
  repairIntent: unknown;
};

type Confidence = RepairEvidenceValidation["confidence"];
type AllowedRepairMode = RepairEvidenceValidation["allowedRepairMode"];

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

function normalizePath(value: string): string {
  return value.replace(/\\/g, "/").toLowerCase();
}

function sameFile(left: string, right: string): boolean {
  if (!left || !right) {
    return false;
  }

  return normalizePath(left) === normalizePath(right);
}

function normalizeConfidence(value: unknown): Confidence {
  return value === "high" || value === "medium" || value === "low" ? value : "low";
}

function confidenceRank(confidence: Confidence): number {
  if (confidence === "high") return 3;
  if (confidence === "medium") return 2;
  return 1;
}

function confidenceFromRank(rank: number): Confidence {
  if (rank >= 3) return "high";
  if (rank === 2) return "medium";
  return "low";
}

function deriveAllowedRepairMode(ok: boolean, confidence: Confidence): AllowedRepairMode {
  if (!ok || confidence === "low") {
    return "manual-review";
  }

  return confidence === "high" ? "normal" : "conservative";
}

function getPrimaryStackFile(parsedStackTrace: unknown): string {
  return (
    readString(parsedStackTrace, "filePath") ||
    readString(parsedStackTrace, "file") ||
    readString(parsedStackTrace, "filename")
  );
}

function getErrorMessage(input: RepairEvidenceValidationInput): string {
  return (
    readString(input.parsedStackTrace, "message") ||
    readString(input.parsedStackTrace, "rawMessage") ||
    readString(input.errorContext, "message") ||
    readString(input.repairTargetDecision, "reason") ||
    readString(input.repairIntent, "reason")
  );
}

function getRepairTargetFile(input: RepairEvidenceValidationInput): string {
  return (
    readString(input.repairIntent, "targetFile") ||
    readString(input.repairTargetDecision, "targetFile") ||
    readString(input.repairTargetDecision, "filePath")
  );
}

function objectContainsString(value: unknown, needle: string): boolean {
  if (!needle) {
    return false;
  }

  const normalizedNeedle = needle.toLowerCase();
  const seen = new Set<unknown>();

  function walk(current: unknown): boolean {
    if (typeof current === "string") {
      return current.toLowerCase().includes(normalizedNeedle);
    }

    if (Array.isArray(current)) {
      return current.some(walk);
    }

    if (isRecord(current)) {
      if (seen.has(current)) {
        return false;
      }
      seen.add(current);
      return Object.values(current).some(walk);
    }

    return false;
  }

  return walk(value);
}

function hasDependencyRelationshipEvidence(input: RepairEvidenceValidationInput): boolean {
  const sourceFile = readString(input.repairIntent, "sourceFile") || readString(input.errorContext, "filePath");
  const targetFile = getRepairTargetFile(input);
  const decisionReason = readString(input.repairTargetDecision, "reason");
  const intentReason = readString(input.repairIntent, "reason");
  const combinedReason = `${decisionReason}\n${intentReason}`.toLowerCase();

  if (combinedReason.includes("import") || combinedReason.includes("export") || combinedReason.includes("dependency")) {
    return true;
  }

  if (!Array.isArray(input.dependencyMap)) {
    return objectContainsString(input.dependencyMap, sourceFile) && objectContainsString(input.dependencyMap, targetFile);
  }

  return input.dependencyMap.some((entry) => {
    if (!isRecord(entry)) {
      return false;
    }

    const file = readString(entry, "file");
    const fileMatchesTarget = sameFile(file, targetFile);
    const fileMatchesSource = sameFile(file, sourceFile);
    const mentionsImportOrExport =
      objectContainsString(entry["imports"], "./") ||
      objectContainsString(entry["imports"], "../") ||
      objectContainsString(entry["exports"], readString(input.repairIntent, "symbolName")) ||
      objectContainsString(entry, sourceFile) ||
      objectContainsString(entry, targetFile);

    return (fileMatchesTarget || fileMatchesSource) && mentionsImportOrExport;
  });
}

function hasImportEvidence(input: RepairEvidenceValidationInput): boolean {
  const combinedReason = `${readString(input.repairTargetDecision, "reason")}\n${readString(input.repairIntent, "reason")}`;
  return (
    combinedReason.toLowerCase().includes("import") ||
    objectContainsString(input.errorContext, "import ") ||
    objectContainsString(input.dependencyMap, "imports")
  );
}

function collectSymbolEvidence(input: RepairEvidenceValidationInput, symbolName: string): string[] {
  const checks: Array<[string, unknown]> = [
    ["error message", getErrorMessage(input)],
    ["error context", input.errorContext],
    ["repair target decision", input.repairTargetDecision],
    ["repair intent", input.repairIntent],
    ["dependency map", input.dependencyMap]
  ];

  return checks
    .filter(([, value]) => objectContainsString(value, symbolName))
    .map(([label]) => `Symbol ${symbolName} appears in ${label}.`);
}

function downgradeConfidence(
  initialConfidence: Confidence,
  weakness: "none" | "some" | "strong"
): { confidence: Confidence; downgradedFrom?: "high" | "medium" } {
  let targetRank = confidenceRank(initialConfidence);
  if (weakness === "some") {
    targetRank = Math.min(targetRank, 2);
  } else if (weakness === "strong") {
    targetRank = 1;
  }

  const confidence = confidenceFromRank(targetRank);
  if (confidence !== initialConfidence && (initialConfidence === "high" || initialConfidence === "medium")) {
    return {
      confidence,
      downgradedFrom: initialConfidence
    };
  }

  return { confidence };
}

export function validateRepairEvidence(
  input: RepairEvidenceValidationInput
): RepairEvidenceValidation {
  const evidence: string[] = [];
  const warnings: string[] = [];
  const repairType = readString(input.repairIntent, "repairType");
  const symbolName = readString(input.repairIntent, "symbolName");
  const primaryStackFile = getPrimaryStackFile(input.parsedStackTrace);
  const targetFile = getRepairTargetFile(input);
  const initialConfidence = normalizeConfidence(readString(input.repairIntent, "confidence"));

  const stackAligned = sameFile(primaryStackFile, targetFile);
  if (stackAligned) {
    evidence.push("Repair target file matches primary stack trace file.");
  } else {
    warnings.push("Repair target file differs from primary stack trace file.");
  }

  if (!primaryStackFile) {
    warnings.push("Primary stack trace file is missing.");
  }

  if (!targetFile) {
    warnings.push("Repair target file is missing.");
  }

  if (symbolName) {
    const symbolEvidence = collectSymbolEvidence(input, symbolName);
    if (symbolEvidence.length > 0) {
      evidence.push(...symbolEvidence);
    } else {
      warnings.push(`Symbol ${symbolName} was not found in available evidence.`);
    }
  }

  const dependencyEvidence = hasDependencyRelationshipEvidence(input);
  const importEvidence = hasImportEvidence(input);

  if (dependencyEvidence) {
    evidence.push("Dependency/import/export relationship evidence is available.");
  }

  if (importEvidence) {
    evidence.push("Import evidence is available.");
  }

  let ok = !!targetFile;
  if (!stackAligned) {
    ok = ok && (dependencyEvidence || importEvidence);
  }

  if (repairType === "missing-export") {
    ok = ok && dependencyEvidence;
    if (!dependencyEvidence) {
      warnings.push("Missing-export repair lacks importer/exporter or dependency relationship evidence.");
    }
  } else if (repairType === "import-mismatch") {
    ok = ok && importEvidence;
    if (!importEvidence) {
      warnings.push("Import-mismatch repair lacks import evidence.");
    }
  } else if (repairType === "runtime-local-error" || repairType === "syntax-error") {
    if (!stackAligned) {
      warnings.push(`${repairType} repair is strongest when the target matches the stack trace file.`);
    }
  }

  const weakEvidence =
    warnings.length >= 2 ||
    evidence.length === 0 ||
    (repairType === "unknown" && initialConfidence !== "low");
  const strongWeakness = !ok || evidence.length === 0 || warnings.length >= 3;
  const downgrade = downgradeConfidence(initialConfidence, strongWeakness ? "strong" : weakEvidence ? "some" : "none");
  const allowedRepairMode = deriveAllowedRepairMode(ok, downgrade.confidence);
  if (allowedRepairMode === "conservative") {
    warnings.push("Evidence validation allowed conservative repair mode.");
  }

  return {
    ok,
    confidence: downgrade.confidence,
    evidence,
    warnings,
    reason: ok
      ? "Repair evidence is sufficient for the selected repair intent."
      : "Repair evidence is insufficient for the selected repair intent.",
    downgradedFrom: downgrade.downgradedFrom,
    allowedRepairMode
  };
}

export function shouldSkipMutationForEvidenceValidation(
  validation: RepairEvidenceValidation
): boolean {
  return !validation.ok || validation.allowedRepairMode === "manual-review";
}
