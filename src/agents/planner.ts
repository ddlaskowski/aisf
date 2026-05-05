import type { Brief, Plan, RepoSummary } from "../types/index.js";

export async function plannerAgent(brief: Brief, repoSummary: RepoSummary): Promise<Plan> {
  const proposedCommands: string[] = [];

  if (repoSummary.npmScripts.includes("lint")) {
    proposedCommands.push("npm run lint");
  }
  if (repoSummary.npmScripts.includes("test")) {
    proposedCommands.push("npm run test");
  }
  if (repoSummary.npmScripts.includes("build")) {
    proposedCommands.push("npm run build");
  }

  if (repoSummary.sampleFiles.includes("index.js")) {
    proposedCommands.push("node index.js");
  }

  return {
    steps: [
      `Understand task: ${brief.title}`,
      "Draft implementation notes for the requested work",
      "Write notes to .factory-output/IMPLEMENTATION_NOTES.md",
      "Run available safe validation commands"
    ],
    proposedCommands
  };
}
