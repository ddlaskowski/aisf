export type RepairType =
  | "missing-symbol"
  | "missing-export"
  | "import-mismatch"
  | "runtime-local-error"
  | "syntax-error"
  | "unknown";

export type RepairConfidence = "high" | "medium" | "low";

export type AllowedMutationScope = "single-file";

export interface RepairIntent {
  repairType: RepairType;
  targetFile: string;
  sourceFile?: string;
  symbolName?: string;
  reason: string;
  confidence: RepairConfidence;
  allowedMutationScope: AllowedMutationScope;
  safetyNotes: string[];
}

export function createUnknownRepairIntent(params: {
  targetFile: string;
  reason?: string;
}): RepairIntent {
  return {
    repairType: "unknown",
    targetFile: params.targetFile,
    reason: params.reason ?? "Unable to determine a specific repair intent from the available evidence.",
    confidence: "low",
    allowedMutationScope: "single-file",
    safetyNotes: [
      "Low-confidence repair intent.",
      "Patch must remain constrained to the selected target file."
    ]
  };
}
