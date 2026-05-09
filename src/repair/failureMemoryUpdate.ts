import {
  FAILURE_MEMORY_LIMIT,
  getProjectId,
  loadFailureMemory,
  saveFailureMemory,
  type FailureMemoryOutcome,
  type FailureMemoryRecord,
  type FailureMemoryStore
} from "./failureMemory.js";

export type FailureMemoryUpdateInput = {
  repoPath: string;
  errorSignature: string;
  strategy: string;
  repairType?: string;
  targetFile?: string;
  outcome: FailureMemoryOutcome;
  validationChanged: boolean;
  retryCount: number;
  timestamp?: number;
};

export function appendFailureMemoryRecord(
  store: FailureMemoryStore,
  record: FailureMemoryRecord
): FailureMemoryStore {
  return {
    schemaVersion: 1,
    records: [...store.records, record].slice(-FAILURE_MEMORY_LIMIT)
  };
}

export async function updateFailureMemory(input: FailureMemoryUpdateInput): Promise<FailureMemoryStore> {
  const store = await loadFailureMemory(input.repoPath);
  const projectId = await getProjectId(input.repoPath);
  const record: FailureMemoryRecord = {
    schemaVersion: 1,
    errorSignature: input.errorSignature,
    projectId,
    strategy: input.strategy,
    repairType: input.repairType,
    targetFile: input.targetFile,
    outcome: input.outcome,
    validationChanged: input.validationChanged,
    retryCount: input.retryCount,
    timestamp: input.timestamp ?? Date.now()
  };
  const updated = appendFailureMemoryRecord(store, record);
  await saveFailureMemory(input.repoPath, updated);
  return updated;
}
