import path from "node:path";
import fs from "fs-extra";

const FORBIDDEN_SEGMENTS = ["node_modules", ".git", "dist", "build", ".next", ".factory"];

function shouldIgnore(segment: string): boolean {
  return FORBIDDEN_SEGMENTS.includes(segment);
}

async function walk(dir: string, root: string, out: string[]): Promise<void> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (shouldIgnore(entry.name)) {
      continue;
    }
    const fullPath = path.join(dir, entry.name);
    const relative = path.relative(root, fullPath).split(path.sep).join("/");

    if (entry.isDirectory()) {
      await walk(fullPath, root, out);
    } else if (entry.isFile()) {
      out.push(relative);
    }
  }
}

export async function readRepoSummary(repoPathInput: string) {
  const repoPath = path.resolve(repoPathInput);
  const exists = await fs.pathExists(repoPath);
  if (!exists) {
    throw new Error(`Repository path does not exist: ${repoPath}`);
  }

  const stats = await fs.stat(repoPath);
  if (!stats.isDirectory()) {
    throw new Error(`Repository path is not a directory: ${repoPath}`);
  }

  const files: string[] = [];
  await walk(repoPath, repoPath, files);

  const topLevelEntriesRaw = await fs.readdir(repoPath, { withFileTypes: true });
  const topLevelEntries = topLevelEntriesRaw
    .filter((entry) => !shouldIgnore(entry.name))
    .map((entry) => entry.name)
    .sort();

  const packageJsonPath = path.join(repoPath, "package.json");
  const hasPackageJson = await fs.pathExists(packageJsonPath);
  let npmScripts: string[] = [];

  if (hasPackageJson) {
    try {
      const pkg = await fs.readJson(packageJsonPath);
      npmScripts = Object.keys(pkg.scripts ?? {});
    } catch {
      npmScripts = [];
    }
  }

  return {
    repoPath,
    fileCount: files.length,
    topLevelEntries,
    hasPackageJson,
    npmScripts,
    sampleFiles: files.slice(0, 50)
  };
}
