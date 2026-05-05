import type { Brief, RepoSummary } from "../types/index.js";

export async function intakeAgent(task: string, repoSummary: RepoSummary): Promise<Brief> {
  return {
    title: task.trim(),
    objective: `Complete task in repository at ${repoSummary.repoPath}`,
    constraints: [
      "Stay within repository boundaries",
      "Do not modify env files",
      "Use safe, reviewable changes"
    ],
    acceptanceCriteria: [
      "Implementation notes file created with task and plan",
      "Run artifacts stored in .factory/runs",
      "No disallowed command execution"
    ]
  };
}
