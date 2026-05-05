import { analyzeFileStructure } from "./analyzeFileStructure.js";
import type { PatchApplyResult } from "./patchResult.js";
import type { PatchOperation } from "./patchTypes.js";
import { validatePatch } from "./validatePatch.js";

export function applySafePatch(source: string, patch: PatchOperation): PatchApplyResult {
  const structure = analyzeFileStructure(source);
  const validation = validatePatch(source, patch, structure);

  if (!validation.safe) {
    return {
      success: false,
      changed: false,
      skipped: true,
      confidence: validation.confidence,
      reason: validation.reason,
      fileBefore: source,
      fileAfter: source
    };
  }

  let fileAfter = source;
  if (patch.type === "replace") {
    const target = typeof patch.target === "string" ? patch.target : patch.target.match;
    const replacement = "content" in patch ? patch.content : patch.replacement;
    fileAfter = source.replace(target, replacement);
  } else if (patch.type === "insertAfter") {
    const index = source.indexOf(patch.anchor.text);
    const position = index + patch.anchor.text.length;
    fileAfter = `${source.slice(0, position)}${patch.content}${source.slice(position)}`;
  } else if (patch.type === "appendSafe") {
    const separator = source.endsWith("\n") ? "" : "\n";
    fileAfter = `${source}${separator}${patch.content}`;
  }

  return {
    success: true,
    changed: fileAfter !== source,
    skipped: false,
    confidence: validation.confidence,
    fileBefore: source,
    fileAfter
  };
}

function assertPatchResult(label: string, actual: PatchApplyResult, expected: Partial<PatchApplyResult>): void {
  for (const [key, value] of Object.entries(expected)) {
    if (actual[key as keyof PatchApplyResult] !== value) {
      throw new Error(`applySafePatch assertion failed (${label}): expected ${key}=${value}, got ${actual[key as keyof PatchApplyResult]}`);
    }
  }
}

function runApplySafePatchAssertions(): void {
  assertPatchResult(
    "replace",
    applySafePatch("console.log(value);\n", {
      type: "replace",
      target: "value",
      content: "safeValue"
    }),
    { success: true, changed: true, skipped: false, confidence: "high" }
  );

  assertPatchResult(
    "exact replace",
    applySafePatch("const logger = console.log;\nconst logger = console.log;\n", {
      type: "replace",
      target: { type: "exact", match: "\nconst logger = console.log;" },
      replacement: ""
    }),
    { success: true, changed: true, skipped: false, confidence: "high" }
  );

  assertPatchResult(
    "duplicate declaration",
    applySafePatch("const logger = console.log;\n", {
      type: "appendSafe",
      content: "const logger = console.log;"
    }),
    { success: false, changed: false, skipped: true, confidence: "low", reason: "Patch would duplicate declaration: logger" }
  );

  assertPatchResult(
    "non unique anchor",
    applySafePatch("a();\na();\n", {
      type: "insertAfter",
      anchor: { text: "a();" },
      content: "\nb();"
    }),
    { success: false, changed: false, skipped: true, confidence: "low", reason: "Insert anchor is not unique" }
  );

  assertPatchResult(
    "safe append confidence",
    applySafePatch("console.log('a');\n", {
      type: "appendSafe",
      content: "console.log('b');"
    }),
    { success: true, changed: true, skipped: false, confidence: "medium" }
  );
}

runApplySafePatchAssertions();
