import path from "node:path";
import fs from "fs-extra";

export type FailureMemoryOutcome = "success" | "failed" | "manual-review" | "policy-denied";

export type FailureMemoryRecord = {
  schemaVersion: 1;
  errorSignature: string;
  projectId?: string;
  strategy: string;
  repairType?: string;
  targetFile?: string;
  outcome: FailureMemoryOutcome;
  validationChanged: boolean;
  retryCount: number;
  timestamp: number;
};

export type FailureMemoryStore = {
  schemaVersion: 1;
  records: FailureMemoryRecord[];
};

export const FAILURE_MEMORY_LIMIT = 200;

export function getFailureMemoryPath(repoPath: string): string {
  return path.join(repoPath, ".factory", "memory", "failure-memory.json");
}

export async function ensureFailureMemoryDirectory(repoPath: string): Promise<string> {
  const dir = path.dirname(getFailureMemoryPath(repoPath));
  await fs.ensureDir(dir);
  return dir;
}

function emptyStore(): FailureMemoryStore {
  return {
    schemaVersion: 1,
    records: []
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeRecord(value: unknown): FailureMemoryRecord | null {
  if (!isRecord(value)) {
    return null;
  }

  const outcome = value.outcome;
  if (
    outcome !== "success" &&
    outcome !== "failed" &&
    outcome !== "manual-review" &&
    outcome !== "policy-denied"
  ) {
    return null;
  }

  const errorSignature = typeof value.errorSignature === "string" ? value.errorSignature : "";
  const strategy = typeof value.strategy === "string" ? value.strategy : "";
  if (!errorSignature || !strategy) {
    return null;
  }

  return {
    schemaVersion: 1,
    errorSignature,
    projectId: typeof value.projectId === "string" ? value.projectId : undefined,
    strategy,
    repairType: typeof value.repairType === "string" ? value.repairType : undefined,
    targetFile: typeof value.targetFile === "string" ? value.targetFile : undefined,
    outcome,
    validationChanged: value.validationChanged === true,
    retryCount: typeof value.retryCount === "number" ? value.retryCount : 0,
    timestamp: typeof value.timestamp === "number" ? value.timestamp : 0
  };
}

export async function loadFailureMemory(repoPath: string): Promise<FailureMemoryStore> {
  const memoryPath = getFailureMemoryPath(repoPath);
  if (!(await fs.pathExists(memoryPath))) {
    return emptyStore();
  }

  try {
    const raw = await fs.readJson(memoryPath);
    if (!isRecord(raw) || !Array.isArray(raw.records)) {
      return emptyStore();
    }

    return {
      schemaVersion: 1,
      records: raw.records
        .map(normalizeRecord)
        .filter((record): record is FailureMemoryRecord => record !== null)
        .slice(-FAILURE_MEMORY_LIMIT)
    };
  } catch {
    return emptyStore();
  }
}

export async function saveFailureMemory(repoPath: string, store: FailureMemoryStore): Promise<void> {
  await ensureFailureMemoryDirectory(repoPath);
  const normalized: FailureMemoryStore = {
    schemaVersion: 1,
    records: store.records.slice(-FAILURE_MEMORY_LIMIT)
  };
  await fs.writeJson(getFailureMemoryPath(repoPath), normalized, { spaces: 2 });
}

export async function getProjectId(repoPath: string): Promise<string> {
  const packageJsonPath = path.join(repoPath, "package.json");
  try {
    const packageJson = await fs.readJson(packageJsonPath);
    if (typeof packageJson.name === "string" && packageJson.name.trim()) {
      return packageJson.name.trim();
    }
  } catch {
    // Fall back to the repo folder name for non-package repos or invalid package.json.
  }

  return path.basename(path.resolve(repoPath));
}
