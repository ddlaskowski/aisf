import path from "node:path";
import fs from "fs-extra";
import type { ChangeOperation, ChangePatch } from "../types/index.js";
import { applySafePatch, type PatchOperation } from "../patchEngine/index.js";

export interface FileOperationResult {
  changed: boolean;
  patchEngineUsed: boolean;
  patchSkipped: boolean;
  patchSkipReason?: string;
  patchChanged: boolean;
  patchConfidence?: "high" | "medium" | "low";
}

interface PatchContentResult extends FileOperationResult {
  updated: string;
}

function fileResult(input: {
  changed: boolean;
  patchEngineUsed?: boolean;
  patchSkipped?: boolean;
  patchSkipReason?: string;
  patchChanged?: boolean;
  patchConfidence?: "high" | "medium" | "low";
}): FileOperationResult {
  return {
    changed: input.changed,
    patchEngineUsed: input.patchEngineUsed ?? false,
    patchSkipped: input.patchSkipped ?? false,
    patchSkipReason: input.patchSkipReason,
    patchChanged: input.patchChanged ?? false,
    patchConfidence: input.patchConfidence
  };
}

function normalizeInsideRepo(repoRoot: string, targetPath: string): string {
  const normalized = targetPath.replace(/\\/g, "/");
  const fullPath = path.resolve(repoRoot, normalized);
  const rel = path.relative(repoRoot, fullPath);

  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error(`Blocked path outside repository: ${targetPath}`);
  }

  const filename = path.basename(fullPath).toLowerCase();
  if (filename === ".env" || filename.endsWith(".env")) {
    throw new Error(`Blocked edit of env file: ${targetPath}`);
  }

  return fullPath;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isSafePatchOperation(patch: unknown): patch is PatchOperation {
  if (!isRecord(patch) || typeof patch.type !== "string") {
    return false;
  }

  if (patch.type === "replace") {
    return (
      (typeof patch.target === "string" && typeof patch.content === "string") ||
      (isRecord(patch.target) &&
        patch.target.type === "exact" &&
        typeof patch.target.match === "string" &&
        typeof patch.replacement === "string")
    );
  }

  if (patch.type === "insertAfter") {
    return (
      isRecord(patch.anchor) &&
      typeof patch.anchor.text === "string" &&
      typeof patch.content === "string"
    );
  }

  if (patch.type === "appendSafe") {
    return typeof patch.content === "string";
  }

  return false;
}

function guardedLegacyAppend(original: string, content: string): PatchContentResult {
  const result = applySafePatch(original, {
    type: "appendSafe",
    content
  });

  if (result.skipped) {
    console.log(`SafePatchEngine: guarded legacy append skipped: ${result.reason ?? "unknown reason"}`);
    return {
      updated: original,
      ...fileResult({
        changed: false,
        patchEngineUsed: true,
        patchSkipped: true,
        patchSkipReason: result.reason ?? "unknown reason",
        patchChanged: false,
        patchConfidence: result.confidence
      })
    };
  }

  if (result.changed) {
    console.log("SafePatchEngine: guarded legacy append applied");
    return {
      updated: result.fileAfter,
      ...fileResult({
        changed: true,
        patchEngineUsed: true,
        patchSkipped: false,
        patchChanged: true,
        patchConfidence: result.confidence
      })
    };
  }

  console.log("SafePatchEngine: guarded legacy append no changes");
  return {
    updated: original,
    ...fileResult({
      changed: false,
      patchEngineUsed: true,
      patchSkipped: false,
      patchChanged: false,
      patchConfidence: result.confidence
    })
  };
}

function legacyPatchResult(original: string, updated: string): PatchContentResult {
  const changed = updated !== original;
  return {
    updated,
    ...fileResult({
      changed,
      patchEngineUsed: false,
      patchSkipped: false,
      patchChanged: changed
    })
  };
}

function applyPatchToContent(original: string, patch: ChangePatch, targetPath: string): PatchContentResult {
  let updated = original;
  const patchContent = patch.content ?? patch.replace?.with ?? "";
  const fallbackAppend = (content: string): PatchContentResult => {
    console.log("Patch target not found. Appending patch content as fallback.");
    return guardedLegacyAppend(updated, `// Added by software-factory patch fallback\n${content}`);
  };

  if (patch.replace) {
    if (updated.includes(patch.replace.target)) {
      updated = updated.replace(patch.replace.target, patch.replace.with);
    } else if (patch.insertAfter) {
      const idx = updated.indexOf(patch.insertAfter);
      if (idx >= 0) {
        const pos = idx + patch.insertAfter.length;
        updated = `${updated.slice(0, pos)}${patchContent}${updated.slice(pos)}`;
        return legacyPatchResult(original, updated);
      }
      return fallbackAppend(patchContent);
    } else if (patch.insertBefore) {
      const idx = updated.indexOf(patch.insertBefore);
      if (idx >= 0) {
        updated = `${updated.slice(0, idx)}${patchContent}${updated.slice(idx)}`;
        return legacyPatchResult(original, updated);
      }
      return fallbackAppend(patchContent);
    } else if (patchContent) {
      return fallbackAppend(patchContent);
    } else if (patch.replace.with) {
      return fallbackAppend(patch.replace.with);
    } else {
      throw new Error(`Patch replace target not found in ${targetPath} and no fallback content available`);
    }
  }

  if (patch.insertBefore) {
    const idx = updated.indexOf(patch.insertBefore);
    if (idx >= 0) {
      updated = `${updated.slice(0, idx)}${patchContent}${updated.slice(idx)}`;
      return legacyPatchResult(original, updated);
    }
    return fallbackAppend(patchContent);
  } else if (patch.insertAfter) {
    const idx = updated.indexOf(patch.insertAfter);
    if (idx >= 0) {
      const pos = idx + patch.insertAfter.length;
      updated = `${updated.slice(0, pos)}${patchContent}${updated.slice(pos)}`;
      return legacyPatchResult(original, updated);
    }
    return fallbackAppend(patchContent);
  } else if (!patch.replace) {
    return fallbackAppend(patchContent);
  }

  return legacyPatchResult(original, updated);
}

export async function applyOperation(
  repoRoot: string,
  operation: ChangeOperation,
  allowDelete: boolean = false
): Promise<FileOperationResult> {
  const fullPath = normalizeInsideRepo(repoRoot, operation.path);

  if (operation.type === "delete") {
    if (!allowDelete) {
      throw new Error("Delete operations are blocked in v0.1.");
    }
    await fs.remove(fullPath);
    return fileResult({ changed: true });
  }

  if (operation.type === "create" || operation.type === "replace") {
    if (typeof operation.content !== "string") {
      throw new Error(`Operation ${operation.type} requires content: ${operation.path}`);
    }
    await fs.ensureDir(path.dirname(fullPath));
    await fs.writeFile(fullPath, operation.content, "utf8");
    return fileResult({ changed: true });
  }

  if (operation.type === "modify") {
    await fs.ensureDir(path.dirname(fullPath));

    if (operation.patch) {
      const exists = await fs.pathExists(fullPath);
      if (!exists) {
        throw new Error(`Cannot patch non-existent file: ${operation.path}`);
      }
      const original = await fs.readFile(fullPath, "utf8");
      if (isSafePatchOperation(operation.patch)) {
        const result = applySafePatch(original, operation.patch);
        if (result.skipped) {
          console.log(`SafePatchEngine: skipped patch: ${result.reason ?? "unknown reason"}`);
          return fileResult({
            changed: false,
            patchEngineUsed: true,
            patchSkipped: true,
            patchSkipReason: result.reason ?? "unknown reason",
            patchChanged: false,
            patchConfidence: result.confidence
          });
        }
        if (result.changed) {
          await fs.writeFile(fullPath, result.fileAfter, "utf8");
          console.log("SafePatchEngine: applied patch");
          return fileResult({
            changed: true,
            patchEngineUsed: true,
            patchSkipped: false,
            patchChanged: true,
            patchConfidence: result.confidence
          });
        }
        console.log("SafePatchEngine: no changes applied");
        return fileResult({
          changed: false,
          patchEngineUsed: true,
          patchSkipped: false,
          patchChanged: false,
          patchConfidence: result.confidence
        });
      }

      const patchResult = applyPatchToContent(original, operation.patch, operation.path);
      if (patchResult.changed) {
        await fs.writeFile(fullPath, patchResult.updated, "utf8");
      }
      return patchResult;
    }

    if (typeof operation.content === "string") {
      await fs.writeFile(fullPath, operation.content, "utf8");
      return fileResult({ changed: true });
    }

    throw new Error(`Modify operation requires patch or content: ${operation.path}`);
  }

  throw new Error(`Unsupported operation type: ${(operation as { type: string }).type}`);
}
