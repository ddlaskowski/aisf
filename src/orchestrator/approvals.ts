import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import type { Changeset } from "../types/index.js";

export async function requestApplyApproval(changeset: Changeset): Promise<boolean> {
  if (changeset.operations.length === 0) {
    return true;
  }

  console.log("\nProposed file operations:");
  for (const op of changeset.operations) {
    const label = op.type === "modify" && op.patch ? "PATCH" : op.type.toUpperCase();
    console.log(`- ${label} ${op.path}${op.reason ? ` (${op.reason})` : ""}`);
  }

  const rl = readline.createInterface({ input, output });
  try {
    console.log("\nApply these changes? (y/N):");
    const answer = await rl.question("> ");
    return answer.trim().toLowerCase() === "y";
  } finally {
    rl.close();
  }
}
