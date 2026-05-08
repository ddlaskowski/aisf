import path from "node:path";
import type { RepairIntent } from "./repairIntent.js";

export type PatchIntentValidationResult = {
  ok: boolean;
  reason: string;
  safetyNotes: string[];
};

export type ProposedPatchIntent = {
  targetFile: string;
  patchContent?: string;
  patchFiles?: string[];
};

function fail(reason: string, safetyNotes: string[] = []): PatchIntentValidationResult {
  return {
    ok: false,
    reason,
    safetyNotes
  };
}

function normalizeFilePath(filePath: string): string {
  return path.normalize(filePath).toLowerCase();
}

function uniqueNormalizedFiles(files: string[]): string[] {
  return Array.from(new Set(files.filter(Boolean).map(normalizeFilePath)));
}

function hasBroadImportRewrite(content: string | undefined): boolean {
  if (!content) {
    return false;
  }

  const lines = content.split(/\r?\n/);
  const importLines = lines.filter((line) => /^\s*import\s+/.test(line));
  if (importLines.length > 1) {
    return true;
  }

  const modulePathEdits = lines.filter((line) => /^\s*[-+].*from\s+["'][^"']+["']/.test(line));
  return modulePathEdits.length > 1;
}

export function validatePatchIntent(
  repairIntent: RepairIntent,
  proposedPatch: ProposedPatchIntent
): PatchIntentValidationResult {
  if (!repairIntent.targetFile?.trim()) {
    return fail("Missing repair intent target file.");
  }

  if (!proposedPatch.targetFile?.trim()) {
    return fail("Missing proposed patch target file.");
  }

  const patchFiles = proposedPatch.patchFiles ? uniqueNormalizedFiles(proposedPatch.patchFiles) : [];
  if (patchFiles.length > 1) {
    return fail("Multi-file patch rejected by Patch Intent Guard.", [
      "v1.7 single-file mutation invariant must be preserved."
    ]);
  }

  const intentTarget = normalizeFilePath(repairIntent.targetFile);
  const patchTarget = normalizeFilePath(proposedPatch.targetFile);
  if (intentTarget !== patchTarget) {
    return fail("Mismatch between repair intent target and proposed patch target.");
  }

  if (patchFiles.length === 1 && patchFiles[0] !== patchTarget) {
    return fail("patchFiles include files outside proposed target.");
  }

  if (repairIntent.repairType !== "import-mismatch" && hasBroadImportRewrite(proposedPatch.patchContent)) {
    return fail("Broad import rewrite is not allowed for this repair intent.");
  }

  return {
    ok: true,
    reason: "Patch intent validated successfully.",
    safetyNotes: [
      "Patch target matches repair intent target.",
      "Single-file mutation invariant preserved."
    ]
  };
}
