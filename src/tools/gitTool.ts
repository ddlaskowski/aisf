import { execa } from "execa";
import path from "path";
import fs from "fs-extra";

export async function isGitRepo(repoPath: string): Promise<boolean> {
  try {
    await execa("git", ["rev-parse", "--is-inside-work-tree"], { cwd: repoPath });
    return true;
  } catch {
    return false;
  }
}

export async function getGitStatusShort(repoPath: string): Promise<string> {
  try {
    const res = await execa("git", ["status", "--short"], { cwd: repoPath });
    return res.stdout.trim();
  } catch {
    return "";
  }
}

export async function hasUncommittedChanges(repoPath: string): Promise<boolean> {
  const status = await getGitStatusShort(repoPath);
  return status.length > 0;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

export function buildFactoryBranchName(mode: "feature" | "bugfix", task: string): string {
  return `factory/${mode}-${slugify(task)}`;
}

async function branchExists(repoPath: string, branchName: string): Promise<boolean> {
  try {
    await execa("git", ["show-ref", "--verify", `refs/heads/${branchName}`], { cwd: repoPath });
    return true;
  } catch {
    return false;
  }
}

export async function createBranch(repoPath: string, branchName: string): Promise<string> {
  let finalName = branchName;
  if (await branchExists(repoPath, finalName)) {
    finalName = `${branchName}-${Date.now()}`;
  }
  await execa("git", ["checkout", "-b", finalName], { cwd: repoPath });
  return finalName;
}

export function normalizeGitPath(file: string): string {
  if (file.startsWith("./") || file.startsWith(".\\")) {
    return file.slice(2);
  }
  return file;
}

function runNormalizeGitPathAssertions(): void {
  const cases: Array<[string, string]> = [
    ["index.js", "index.js"],
    ["./index.js", "index.js"],
    [".\\index.js", "index.js"],
    ["src/utils/logger.js", "src/utils/logger.js"]
  ];

  for (const [input, expected] of cases) {
    const actual = normalizeGitPath(input);
    if (actual !== expected) {
      throw new Error(`normalizeGitPath failed: ${input} -> ${actual}, expected ${expected}`);
    }
  }
}

runNormalizeGitPathAssertions();

export async function stageFiles(repoPath: string, files: string[]): Promise<void> {
  if (files.length === 0) {
    return;
  }

  const relativeFiles: string[] = [];
  for (const file of files) {
    console.log(`Original changed file: ${file}`);
    const normalized = normalizeGitPath(file).replace(/\\/g, "/");
    console.log(`Normalized changed file: ${normalized}`);
    if (path.isAbsolute(normalized) || normalized.startsWith("../")) {
      continue;
    }
    const fullPath = path.resolve(repoPath, normalized);
    console.log(`Checking file exists: ${fullPath}`);
    const exists = await fs.pathExists(fullPath);
    if (!exists) {
      console.log(`Skipping file not found in repo: ${normalized}`);
      continue;
    }
    relativeFiles.push(normalized);
  }

  if (relativeFiles.length === 0) {
    return;
  }

  await execa("git", ["add", "--", ...relativeFiles], { cwd: repoPath });
}

export async function commit(repoPath: string, message: string): Promise<void> {
  await execa("git", ["commit", "-m", message], { cwd: repoPath });
}
