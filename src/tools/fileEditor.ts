import path from "node:path";
import fs from "fs-extra";
import type { ChangeOperation, ChangePatch } from "../types/index.js";

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

function applyPatchToContent(original: string, patch: ChangePatch, targetPath: string): string {
  let updated = original;
  const patchContent = patch.content ?? patch.replace?.with ?? "";
  const fallbackAppend = (content: string): string => {
    const suffix = updated.endsWith("\n") ? "" : "\n";
    console.log("Patch target not found. Appending patch content as fallback.");
    return `${updated}${suffix}// Added by software-factory patch fallback\n${content}`;
  };

  if (patch.replace) {
    if (updated.includes(patch.replace.target)) {
      updated = updated.replace(patch.replace.target, patch.replace.with);
    } else if (patch.insertAfter) {
      const idx = updated.indexOf(patch.insertAfter);
      if (idx >= 0) {
        const pos = idx + patch.insertAfter.length;
        updated = `${updated.slice(0, pos)}${patchContent}${updated.slice(pos)}`;
        return updated;
      }
      updated = fallbackAppend(patchContent);
      return updated;
    } else if (patch.insertBefore) {
      const idx = updated.indexOf(patch.insertBefore);
      if (idx >= 0) {
        updated = `${updated.slice(0, idx)}${patchContent}${updated.slice(idx)}`;
        return updated;
      }
      updated = fallbackAppend(patchContent);
      return updated;
    } else if (patchContent) {
      updated = fallbackAppend(patchContent);
      return updated;
    } else if (patch.replace.with) {
      updated = fallbackAppend(patch.replace.with);
      return updated;
    } else {
      throw new Error(`Patch replace target not found in ${targetPath} and no fallback content available`);
    }
  }

  if (patch.insertBefore) {
    const idx = updated.indexOf(patch.insertBefore);
    if (idx >= 0) {
      updated = `${updated.slice(0, idx)}${patchContent}${updated.slice(idx)}`;
      return updated;
    }
    updated = fallbackAppend(patchContent);
    return updated;
  } else if (patch.insertAfter) {
    const idx = updated.indexOf(patch.insertAfter);
    if (idx >= 0) {
      const pos = idx + patch.insertAfter.length;
      updated = `${updated.slice(0, pos)}${patchContent}${updated.slice(pos)}`;
      return updated;
    }
    updated = fallbackAppend(patchContent);
    return updated;
  } else if (!patch.replace) {
    updated = fallbackAppend(patchContent);
  }

  return updated;
}

export async function applyOperation(
  repoRoot: string,
  operation: ChangeOperation,
  allowDelete: boolean = false
): Promise<void> {
  const fullPath = normalizeInsideRepo(repoRoot, operation.path);

  if (operation.type === "delete") {
    if (!allowDelete) {
      throw new Error("Delete operations are blocked in v0.1.");
    }
    await fs.remove(fullPath);
    return;
  }

  if (operation.type === "create" || operation.type === "replace") {
    if (typeof operation.content !== "string") {
      throw new Error(`Operation ${operation.type} requires content: ${operation.path}`);
    }
    await fs.ensureDir(path.dirname(fullPath));
    await fs.writeFile(fullPath, operation.content, "utf8");
    return;
  }

  if (operation.type === "modify") {
    await fs.ensureDir(path.dirname(fullPath));

    if (operation.patch) {
      const exists = await fs.pathExists(fullPath);
      if (!exists) {
        throw new Error(`Cannot patch non-existent file: ${operation.path}`);
      }
      const original = await fs.readFile(fullPath, "utf8");
      const updated = applyPatchToContent(original, operation.patch, operation.path);
      await fs.writeFile(fullPath, updated, "utf8");
      return;
    }

    if (typeof operation.content === "string") {
      await fs.writeFile(fullPath, operation.content, "utf8");
      return;
    }

    throw new Error(`Modify operation requires patch or content: ${operation.path}`);
  }

  throw new Error(`Unsupported operation type: ${(operation as { type: string }).type}`);
}
