import type { FileStructure, PatchOperation, PatchValidationResult } from "./patchTypes.js";

function countOccurrences(source: string, target: string): number {
  if (!target) return 0;
  return source.split(target).length - 1;
}

function replacementTarget(patch: PatchOperation): string {
  if (patch.type !== "replace") return "";
  return typeof patch.target === "string" ? patch.target : patch.target.match;
}

function patchContent(patch: PatchOperation): string {
  if (patch.type === "replace") {
    return "content" in patch ? patch.content : patch.replacement;
  }
  return patch.content;
}

function declaredNamesInContent(content: string): string[] {
  const names: string[] = [];
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    const variableMatch = line.match(/^\s*(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=/);
    if (variableMatch) names.push(variableMatch[1]);

    const functionMatch = line.match(/^\s*function\s+([A-Za-z_$][\w$]*)\s*\(/);
    if (functionMatch) names.push(functionMatch[1]);
  }
  return names;
}

function containsImportOrRequire(content: string): boolean {
  return content.split(/\r?\n/).some((line) => /^\s*import\b/.test(line) || /\brequire\s*\(/.test(line));
}

function safe(confidence: PatchValidationResult["confidence"]): PatchValidationResult {
  return { safe: true, confidence };
}

function unsafe(reason: string): PatchValidationResult {
  return { safe: false, confidence: "low", reason };
}

function lineForOffset(source: string, offset: number): number {
  return source.slice(0, offset).split(/\r?\n/).length;
}

function validateNoDuplicateDeclarations(content: string, structure: FileStructure): PatchValidationResult {
  const existing = new Set(structure.declaredNames);
  for (const name of declaredNamesInContent(content)) {
    if (existing.has(name)) {
      return unsafe(`Patch would duplicate declaration: ${name}`);
    }
  }
  return safe("high");
}

function validateImportRequirePlacement(
  source: string,
  patch: PatchOperation,
  structure: FileStructure
): PatchValidationResult {
  if (patch.type !== "insertAfter" || !containsImportOrRequire(patch.content)) {
    return safe("high");
  }

  const anchorIndex = source.indexOf(patch.anchor.text);
  const insertLine = lineForOffset(source, anchorIndex);
  if (structure.firstExecutableLine !== null && insertLine >= structure.firstExecutableLine) {
    return unsafe("Cannot insert import/require after executable code");
  }

  return safe("high");
}

export function validatePatch(
  source: string,
  patch: PatchOperation,
  structure: FileStructure
): PatchValidationResult {
  const duplicateCheck = validateNoDuplicateDeclarations(patchContent(patch), structure);
  if (!duplicateCheck.safe) {
    return duplicateCheck;
  }

  if (patch.type === "replace") {
    const target = replacementTarget(patch);
    if (!target) return unsafe("Replacement target is empty");
    const count = countOccurrences(source, target);
    if (count === 0) return unsafe("Replacement target not found");
    if (count > 1) return unsafe("Replacement target is not unique");
    return safe("high");
  }

  if (patch.type === "insertAfter") {
    if (!patch.content) return unsafe("Patch content is empty");
    const count = countOccurrences(source, patch.anchor.text);
    if (count === 0) return unsafe("Insert anchor not found");
    if (count > 1) return unsafe("Insert anchor is not unique");

    const placementCheck = validateImportRequirePlacement(source, patch, structure);
    if (!placementCheck.safe) {
      return placementCheck;
    }

    return safe("high");
  }

  if (patch.type === "appendSafe") {
    if (!patch.content) return unsafe("Patch content is empty");
    if (containsImportOrRequire(patch.content)) {
      return unsafe("Cannot append import/require content safely");
    }
    return safe("medium");
  }

  return unsafe("Unsupported patch type");
}
