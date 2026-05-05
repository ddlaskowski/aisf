import path from "node:path";
import fs from "fs-extra";
import { execa } from "execa";

async function hasGitRepo(repoPath: string): Promise<boolean> {
  const gitPath = path.join(repoPath, ".git");
  return fs.pathExists(gitPath);
}

export async function getGitDiff(repoPath: string): Promise<string> {
  if (!(await hasGitRepo(repoPath))) {
    return "No git repository detected.";
  }

  try {
    const diff = await execa("git", ["diff"], { cwd: repoPath });
    return diff.stdout.trim() || "(no diff output)";
  } catch (err) {
    const e = err as { stderr?: string; message?: string };
    return `Unable to generate git diff: ${e.stderr ?? e.message ?? "unknown error"}`;
  }
}

export async function getGitDiffStat(repoPath: string): Promise<string> {
  if (!(await hasGitRepo(repoPath))) {
    return "No git repository detected.";
  }

  try {
    const stat = await execa("git", ["diff", "--stat"], { cwd: repoPath });
    return stat.stdout.trim() || "(no stat output)";
  } catch (err) {
    const e = err as { stderr?: string; message?: string };
    return `Unable to generate git diff --stat: ${e.stderr ?? e.message ?? "unknown error"}`;
  }
}

export async function getChangedFiles(repoPath: string): Promise<string[]> {
  if (!(await hasGitRepo(repoPath))) {
    return [];
  }

  try {
    const status = await execa("git", ["status", "--short"], { cwd: repoPath });
    const lines = status.stdout.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    return lines.map((line) => {
      const body = line.slice(3).trim();
      if (body.includes(" -> ")) {
        const parts = body.split(" -> ");
        return parts[parts.length - 1].trim();
      }
      return body;
    });
  } catch {
    return [];
  }
}

export async function getDiffSummary(repoPath: string): Promise<string> {
  const statOut = await getGitDiffStat(repoPath);
  const diffOut = await getGitDiff(repoPath);
  if (statOut === "No git repository detected.") {
    return "No git repository detected.";
  }
  return `git diff --stat\n${statOut}\n\n git diff\n${diffOut}`;
}
