import type { Brief, CommandResult, Plan, ReviewResult } from "../types/index.js";

export async function reviewerAgent(
  _brief: Brief,
  _plan: Plan,
  commandResults: CommandResult[],
  _diffSummary: string
): Promise<ReviewResult> {
  const failed = commandResults.filter((r) => r.status === "failed");
  if (failed.length > 0) {
    const notes = failed.map((f) => `Command failed: ${f.command}`);
    return {
      verdict: "fail",
      status: "fail",
      notes
    };
  }

  return {
    verdict: "pass",
    status: "pass",
    notes: ["No command failures detected in mock review."]
  };
}
