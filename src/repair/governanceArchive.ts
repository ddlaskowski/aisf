import path from "node:path";
import fs from "fs-extra";

export type GovernanceArchiveKind = "runs-dashboard" | "governance-insights" | "governance-ci-summary";

export type GovernanceArchiveInputFile = {
  sourcePath: string;
  archiveName: string;
};

export type GovernanceArchiveResult = {
  archived: boolean;
  archiveId: string;
  archiveDir: string;
  files: string[];
  warnings: string[];
};

function normalizeSlash(value: string): string {
  return value.split(path.sep).join("/");
}

function relativePath(projectRoot: string, filePath: string): string {
  return normalizeSlash(path.relative(projectRoot, filePath));
}

function isInside(parent: string, child: string): boolean {
  const relative = path.relative(parent, child);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function resolveSourcePath(projectRoot: string, sourcePath: string): string {
  return path.isAbsolute(sourcePath) ? sourcePath : path.resolve(projectRoot, sourcePath);
}

function safeArchiveName(name: string): string {
  return path.basename(name).replace(/[^A-Za-z0-9._-]/g, "-");
}

export function createGovernanceArchiveId(date: Date = new Date()): string {
  const iso = date.toISOString();
  return iso.replace(/:/g, "-").replace(/\.(\d{3})Z$/, "-$1Z");
}

export function archiveGovernanceFiles(
  projectRoot: string,
  kind: GovernanceArchiveKind,
  files: GovernanceArchiveInputFile[],
  options: { date?: Date } = {}
): GovernanceArchiveResult {
  const archiveId = createGovernanceArchiveId(options.date);
  const archiveRoot = path.join(projectRoot, ".factory", "archive");
  const archiveDir = path.join(archiveRoot, archiveId, kind);

  if (!isInside(archiveRoot, archiveDir)) {
    throw new Error("Archive destination must stay within .factory/archive.");
  }

  const copiedFiles: string[] = [];
  const warnings: string[] = [];
  fs.ensureDirSync(archiveDir);

  for (const file of files) {
    const sourcePath = resolveSourcePath(projectRoot, file.sourcePath);
    if (!fs.pathExistsSync(sourcePath)) {
      warnings.push(`Archive source file missing: ${relativePath(projectRoot, sourcePath)}`);
      continue;
    }

    const archiveName = safeArchiveName(file.archiveName);
    const destinationPath = path.join(archiveDir, archiveName);
    if (!isInside(archiveDir, destinationPath)) {
      warnings.push(`Archive destination skipped: ${archiveName}`);
      continue;
    }

    fs.copyFileSync(sourcePath, destinationPath);
    copiedFiles.push(relativePath(projectRoot, destinationPath));
  }

  return {
    archived: copiedFiles.length > 0,
    archiveId,
    archiveDir: relativePath(projectRoot, archiveDir),
    files: copiedFiles,
    warnings
  };
}
