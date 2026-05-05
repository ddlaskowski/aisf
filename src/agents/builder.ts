import type { Brief, Changeset, CommandResult, Plan, RepoSummary, ReviewResult } from "../types/index.js";
import { generateCode } from "../ai/generateCode.js";

interface BuilderContext {
  runDir?: string;
  repoPath?: string;
  mode?: "feature" | "bugfix";
  recentCommandResults?: CommandResult[];
  previousOperations?: Array<{ type: string; path: string; reason?: string }>;
  selfHealingAttempt?: number;
}

export async function builderAgent(
  brief: Brief,
  plan: Plan,
  repoSummary: RepoSummary,
  review?: ReviewResult,
  context: BuilderContext = {}
): Promise<Changeset> {
  const operations = await generateCode(brief, plan, repoSummary, review, context);
  return { operations };
}
