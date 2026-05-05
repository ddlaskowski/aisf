import { execa } from "execa";

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
