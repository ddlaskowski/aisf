export interface FactoryRunInput {
  repoPath: string;
  task: string;
  createBranch?: boolean;
  autoCommit?: boolean;
}

export interface Brief {
  title: string;
  objective: string;
  constraints: string[];
  acceptanceCriteria: string[];
}

export interface Plan {
  steps: string[];
  proposedCommands: string[];
}

export type ChangeOperationType = "create" | "modify" | "replace" | "delete";

export interface ChangePatch {
  insertBefore?: string;
  insertAfter?: string;
  content?: string;
  replace?: {
    target: string;
    with: string;
  };
}

export interface ChangeOperation {
  type: ChangeOperationType;
  path: string;
  content?: string;
  patch?: ChangePatch;
  reason?: string;
}

export interface Changeset {
  operations: ChangeOperation[];
}

export interface ReviewResult {
  verdict: "pass" | "fail";
  status: "pass" | "fail";
  notes: string[];
}

export interface CommandResult {
  command: string;
  status: "success" | "failed" | "skipped";
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  reason?: string;
}

export interface RepoSummary {
  repoPath: string;
  fileCount: number;
  topLevelEntries: string[];
  hasPackageJson: boolean;
  npmScripts: string[];
  sampleFiles: string[];
}

export interface RunSummary {
  runId: string;
  repoPath: string;
  task: string;
  attempts: number;
  appliedChanges: number;
  successfulCommands: string[];
  skippedCommands: string[];
  failedCommands: string[];
  reviewStatus: "pass" | "fail";
  notes: string[];
}
