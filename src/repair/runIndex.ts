import path from "node:path";
import fs from "fs-extra";
import type { RepairGovernance } from "./repairGovernance.js";
import type { RepairReleaseGate } from "./repairReleaseGate.js";
import type { RepairReview } from "./repairReview.js";
import type { RepairSummary } from "./repairSummary.js";
import type { RepairTrustIndex } from "./repairTrustIndex.js";

export type RunIndexEntry = {
  runId: string;
  timestamp: string;
  repairOutcome?: string;
  reviewVerdict?: string;
  trustLevel?: string;
  trustScore?: number;
  releaseDecision?: string;
  releaseScore?: number;
  governanceStatus?: string;
  validationPassed?: boolean;
  canProceed?: boolean;
  requiresHumanReview?: boolean;
  isBlocked?: boolean;
  artifactPaths: {
    finalReport?: string;
    repairSummary?: string;
    repairReview?: string;
    repairTrustIndex?: string;
    repairReleaseGate?: string;
    repairGovernance?: string;
  };
};

export type RunsIndex = {
  version: 1;
  updatedAt: string;
  totalRuns: number;
  runs: RunIndexEntry[];
};

export type BuildRunIndexEntryInput = {
  projectRoot: string;
  runId: string;
  timestamp?: string;
  runDir: string;
  repairSummary?: RepairSummary | null;
  repairReview?: RepairReview | null;
  repairTrustIndex?: RepairTrustIndex | null;
  repairReleaseGate?: RepairReleaseGate | null;
  repairGovernance?: RepairGovernance | null;
  repairOutcome?: unknown;
  validation?: unknown;
};

export function getRunsIndexPath(projectRoot: string): string {
  return path.join(projectRoot, ".factory", "runs-index.json");
}

function emptyRunsIndex(): RunsIndex {
  return {
    version: 1,
    updatedAt: new Date(0).toISOString(),
    totalRuns: 0,
    runs: []
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown, field: string): string | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  const raw = value[field];
  return typeof raw === "string" && raw.length > 0 ? raw : undefined;
}

function readNumber(value: unknown, field: string): number | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  const raw = value[field];
  return typeof raw === "number" && Number.isFinite(raw) ? raw : undefined;
}

function readBoolean(value: unknown, field: string): boolean | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  const raw = value[field];
  return typeof raw === "boolean" ? raw : undefined;
}

function normalizeSlash(value: string): string {
  return value.split(path.sep).join("/");
}

function relativePath(projectRoot: string, filePath: string): string {
  return normalizeSlash(path.relative(projectRoot, filePath));
}

function validationPassed(validation: unknown): boolean | undefined {
  if (!isRecord(validation)) {
    return undefined;
  }
  const verdict = readString(validation, "verdict") || readString(validation, "status");
  if (verdict === "pass") return true;
  if (verdict === "fail" || verdict === "failed") return false;
  return undefined;
}

function normalizeEntry(value: unknown): RunIndexEntry | null {
  if (!isRecord(value)) {
    return null;
  }
  const runId = readString(value, "runId");
  const timestamp = readString(value, "timestamp");
  if (!runId || !timestamp) {
    return null;
  }
  const artifactPaths = isRecord(value.artifactPaths) ? value.artifactPaths : {};
  return {
    runId,
    timestamp,
    repairOutcome: readString(value, "repairOutcome"),
    reviewVerdict: readString(value, "reviewVerdict"),
    trustLevel: readString(value, "trustLevel"),
    trustScore: readNumber(value, "trustScore"),
    releaseDecision: readString(value, "releaseDecision"),
    releaseScore: readNumber(value, "releaseScore"),
    governanceStatus: readString(value, "governanceStatus"),
    validationPassed: readBoolean(value, "validationPassed"),
    canProceed: readBoolean(value, "canProceed"),
    requiresHumanReview: readBoolean(value, "requiresHumanReview"),
    isBlocked: readBoolean(value, "isBlocked"),
    artifactPaths: {
      finalReport: readString(artifactPaths, "finalReport"),
      repairSummary: readString(artifactPaths, "repairSummary"),
      repairReview: readString(artifactPaths, "repairReview"),
      repairTrustIndex: readString(artifactPaths, "repairTrustIndex"),
      repairReleaseGate: readString(artifactPaths, "repairReleaseGate"),
      repairGovernance: readString(artifactPaths, "repairGovernance")
    }
  };
}

function normalizeIndex(value: unknown): RunsIndex {
  if (!isRecord(value)) {
    return emptyRunsIndex();
  }
  const runs = Array.isArray(value.runs)
    ? value.runs.map(normalizeEntry).filter((entry): entry is RunIndexEntry => entry !== null)
    : [];
  const index: RunsIndex = {
    version: 1,
    updatedAt: readString(value, "updatedAt") ?? new Date(0).toISOString(),
    totalRuns: runs.length,
    runs
  };
  return updateRunsIndex(index, ...[]);
}

export function loadRunsIndex(projectRoot: string): RunsIndex {
  const indexPath = getRunsIndexPath(projectRoot);
  if (!fs.pathExistsSync(indexPath)) {
    return emptyRunsIndex();
  }
  try {
    return normalizeIndex(fs.readJsonSync(indexPath));
  } catch {
    return emptyRunsIndex();
  }
}

export function saveRunsIndex(projectRoot: string, index: RunsIndex): void {
  const indexPath = getRunsIndexPath(projectRoot);
  fs.ensureDirSync(path.dirname(indexPath));
  fs.writeJsonSync(indexPath, { ...index, updatedAt: new Date().toISOString(), totalRuns: index.runs.length }, { spaces: 2 });
}

export function buildRunIndexEntry(input: BuildRunIndexEntryInput): RunIndexEntry {
  const repairOutcome =
    readString(input.repairOutcome, "outcome") ||
    input.repairSummary?.outcome ||
    (typeof input.repairOutcome === "string" ? input.repairOutcome : undefined);
  const runDir = input.runDir;

  return {
    runId: input.runId,
    timestamp: input.timestamp ?? new Date().toISOString(),
    repairOutcome,
    reviewVerdict: input.repairReview?.verdict,
    trustLevel: input.repairTrustIndex?.trustLevel,
    trustScore: input.repairTrustIndex?.trustScore,
    releaseDecision: input.repairReleaseGate?.releaseDecision,
    releaseScore: input.repairReleaseGate?.releaseScore,
    governanceStatus: input.repairGovernance?.governanceStatus,
    validationPassed: validationPassed(input.validation),
    canProceed: input.repairGovernance?.finalDecision.canProceed,
    requiresHumanReview: input.repairGovernance?.finalDecision.requiresHumanReview,
    isBlocked: input.repairGovernance?.finalDecision.isBlocked,
    artifactPaths: {
      finalReport: relativePath(input.projectRoot, path.join(runDir, "final-report.md")),
      repairSummary: relativePath(input.projectRoot, path.join(runDir, "repair-summary.json")),
      repairReview: relativePath(input.projectRoot, path.join(runDir, "repair-review.json")),
      repairTrustIndex: relativePath(input.projectRoot, path.join(runDir, "repair-trust-index.json")),
      repairReleaseGate: relativePath(input.projectRoot, path.join(runDir, "repair-release-gate.json")),
      repairGovernance: relativePath(input.projectRoot, path.join(runDir, "repair-governance.json"))
    }
  };
}

export function updateRunsIndex(index: RunsIndex, entry?: RunIndexEntry): RunsIndex {
  const runs = entry
    ? [...index.runs.filter((item) => item.runId !== entry.runId), entry]
    : [...index.runs];
  runs.sort((a, b) => a.timestamp.localeCompare(b.timestamp) || a.runId.localeCompare(b.runId));
  return {
    version: 1,
    updatedAt: index.updatedAt,
    totalRuns: runs.length,
    runs
  };
}

