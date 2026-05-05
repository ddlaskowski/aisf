import path from "node:path";
import fs from "fs-extra";

export interface RunState {
  runId: string;
  runDir: string;
}

export function createRunId(): string {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

export async function initRun(repoPath: string, runId: string): Promise<RunState> {
  const runDir = path.join(repoPath, ".factory", "runs", runId);
  try {
    await fs.ensureDir(runDir);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to initialize run directory at ${runDir}: ${message}`);
  }

  const exists = await fs.pathExists(runDir);
  if (!exists) {
    throw new Error(`Failed to initialize run directory at ${runDir}: directory was not created`);
  }

  console.log(`Run directory initialized at: ${runDir}`);
  return { runId, runDir };
}

export async function saveStateFile(runDir: string, filename: string, data: unknown): Promise<void> {
  const filePath = path.join(runDir, filename);
  await fs.writeJson(filePath, data, { spaces: 2 });
}
