import fs from "fs-extra";
import path from "node:path";

import {
  buildGovernanceConfigSnapshotLock,
  type GovernanceConfigSnapshotLock
} from "./configSnapshotLock.js";

export type GovernanceConfigAuditEntry = {
  schemaVersion: 1;
  sequence: number;
  source: "governance-config-snapshot-lock";
  fingerprint: string;
  deterministicId: string;
  lockVersion: number;
  safeOverrideKeys: string[];
  blockedKeys: string[];
  valueCount: number;
  recordedAt: string;
  applied: false;
};

export type GovernanceConfigAuditTrailArtifact = {
  schemaVersion: 1;
  entries: GovernanceConfigAuditEntry[];
  summary: GovernanceConfigAuditTrailResult["trailSummary"];
};

export type GovernanceConfigAuditTrailResult = {
  schemaVersion: 1;
  auditStatus: "not-created" | "updated" | "blocked";
  sourceLockStatus: "not-created" | "created" | "blocked";
  applied: false;
  runtimeBehaviorChanged: false;
  governanceDecisionsChanged: false;
  repairOrchestrationChanged: false;
  currentEntry: GovernanceConfigAuditEntry | null;
  previousFingerprint: string | null;
  currentFingerprint: string | null;
  fingerprintChanged: boolean;
  driftDetected: boolean;
  stableCandidate: boolean;
  trailSummary: {
    totalEntries: number;
    uniqueFingerprints: number;
    latestFingerprint: string | null;
    repeatedLatestFingerprintCount: number;
  };
  warnings: string[];
  recommendedNextStage: "fix-config" | "continue-preview-only" | "prepare-policy-runtime" | "blocked";
};

const ARTIFACT_JSON_PATH = ".factory/governance/config-audit-trail.json";
const ARTIFACT_MARKDOWN_PATH = ".factory/governance/config-audit-trail.md";

function auditTrailPath(projectRoot: string): string {
  return path.join(projectRoot, ARTIFACT_JSON_PATH);
}

function readAuditTrailArtifact(projectRoot: string): GovernanceConfigAuditTrailArtifact {
  const targetPath = auditTrailPath(projectRoot);
  if (!fs.existsSync(targetPath)) {
    return {
      schemaVersion: 1,
      entries: [],
      summary: summarizeEntries([])
    };
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(targetPath, "utf8"));
    const entries: GovernanceConfigAuditEntry[] = (Array.isArray(parsed.entries) ? parsed.entries : []).filter(isAuditEntry);
    return {
      schemaVersion: 1,
      entries: entries.sort((a, b) => a.sequence - b.sequence),
      summary: summarizeEntries(entries)
    };
  } catch {
    return {
      schemaVersion: 1,
      entries: [],
      summary: summarizeEntries([])
    };
  }
}

function isAuditEntry(value: unknown): value is GovernanceConfigAuditEntry {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { schemaVersion?: unknown }).schemaVersion === 1 &&
    typeof (value as { sequence?: unknown }).sequence === "number" &&
    typeof (value as { fingerprint?: unknown }).fingerprint === "string" &&
    typeof (value as { deterministicId?: unknown }).deterministicId === "string"
  );
}

function summarizeEntries(entries: GovernanceConfigAuditEntry[]): GovernanceConfigAuditTrailResult["trailSummary"] {
  const sorted = [...entries].sort((a, b) => a.sequence - b.sequence);
  const latest = sorted[sorted.length - 1] ?? null;
  return {
    totalEntries: sorted.length,
    uniqueFingerprints: new Set(sorted.map((entry) => entry.fingerprint)).size,
    latestFingerprint: latest?.fingerprint ?? null,
    repeatedLatestFingerprintCount: latest === null
      ? 0
      : sorted.filter((entry) => entry.fingerprint === latest.fingerprint).length
  };
}

function buildEntry(snapshotLock: GovernanceConfigSnapshotLock, sequence: number): GovernanceConfigAuditEntry {
  if (snapshotLock.lock === null) {
    throw new Error("Cannot build audit entry without snapshot lock");
  }
  return {
    schemaVersion: 1,
    sequence,
    source: "governance-config-snapshot-lock",
    fingerprint: snapshotLock.lock.fingerprint,
    deterministicId: snapshotLock.lock.deterministicId,
    lockVersion: snapshotLock.lock.lockVersion,
    safeOverrideKeys: [...snapshotLock.lock.safeOverrideKeys],
    blockedKeys: [...snapshotLock.lock.blockedKeys],
    valueCount: snapshotLock.lock.valueCount,
    recordedAt: `deterministic-audit-sequence-${sequence}`,
    applied: false
  };
}

function buildResult(
  snapshotLock: GovernanceConfigSnapshotLock,
  entries: GovernanceConfigAuditEntry[],
  currentEntry: GovernanceConfigAuditEntry | null,
  previousFingerprint: string | null,
  warnings: string[]
): GovernanceConfigAuditTrailResult {
  const currentFingerprint = currentEntry?.fingerprint ?? null;
  const fingerprintChanged = previousFingerprint !== null && currentFingerprint !== null && previousFingerprint !== currentFingerprint;
  const stableCandidate = previousFingerprint !== null && currentFingerprint !== null && previousFingerprint === currentFingerprint;
  const auditStatus: GovernanceConfigAuditTrailResult["auditStatus"] =
    snapshotLock.lockStatus === "created"
      ? "updated"
      : snapshotLock.lockStatus === "not-created"
        ? "not-created"
        : "blocked";
  const recommendedNextStage: GovernanceConfigAuditTrailResult["recommendedNextStage"] =
    snapshotLock.lockStatus === "not-created"
      ? "continue-preview-only"
      : snapshotLock.lockStatus === "blocked" && snapshotLock.recommendedNextStage === "fix-config"
        ? "fix-config"
        : snapshotLock.lockStatus === "blocked"
          ? "blocked"
          : stableCandidate
            ? "prepare-policy-runtime"
            : "continue-preview-only";

  return {
    schemaVersion: 1,
    auditStatus,
    sourceLockStatus: snapshotLock.lockStatus,
    applied: false,
    runtimeBehaviorChanged: false,
    governanceDecisionsChanged: false,
    repairOrchestrationChanged: false,
    currentEntry,
    previousFingerprint,
    currentFingerprint,
    fingerprintChanged,
    driftDetected: fingerprintChanged,
    stableCandidate,
    trailSummary: summarizeEntries(entries),
    warnings,
    recommendedNextStage
  };
}

export function buildGovernanceConfigAuditTrail(projectRoot: string): {
  result: GovernanceConfigAuditTrailResult;
  artifact: GovernanceConfigAuditTrailArtifact;
} {
  const snapshotLock = buildGovernanceConfigSnapshotLock(projectRoot);
  const existing = readAuditTrailArtifact(projectRoot);
  const latest = existing.entries[existing.entries.length - 1] ?? null;
  const warnings = [...snapshotLock.warnings];

  if (snapshotLock.lockStatus !== "created" || snapshotLock.lock === null) {
    const result = buildResult(
      snapshotLock,
      existing.entries,
      null,
      latest?.fingerprint ?? null,
      warnings
    );
    return {
      result,
      artifact: {
        schemaVersion: 1,
        entries: existing.entries,
        summary: summarizeEntries(existing.entries)
      }
    };
  }

  const duplicateLatest = latest?.fingerprint === snapshotLock.lock.fingerprint && latest.deterministicId === snapshotLock.lock.deterministicId;
  const currentEntry = duplicateLatest
    ? latest
    : buildEntry(snapshotLock, Math.max(0, ...existing.entries.map((entry) => entry.sequence)) + 1);
  const entries = duplicateLatest ? existing.entries : [...existing.entries, currentEntry];
  if (duplicateLatest) {
    warnings.push("latest snapshot lock already recorded; audit trail unchanged");
  } else {
    warnings.push("Governance config snapshot lock was recorded in the audit trail.");
  }

  const previousFingerprint = duplicateLatest
    ? latest?.fingerprint ?? null
    : latest?.fingerprint ?? null;
  const result = buildResult(snapshotLock, entries, currentEntry, previousFingerprint, warnings);
  return {
    result,
    artifact: {
      schemaVersion: 1,
      entries,
      summary: summarizeEntries(entries)
    }
  };
}

export function writeGovernanceConfigAuditTrailArtifacts(
  projectRoot: string,
  artifact: GovernanceConfigAuditTrailArtifact,
  result: GovernanceConfigAuditTrailResult
): { jsonPath: string; markdownPath: string } {
  const jsonPath = path.join(projectRoot, ARTIFACT_JSON_PATH);
  const markdownPath = path.join(projectRoot, ARTIFACT_MARKDOWN_PATH);
  fs.ensureDirSync(path.dirname(jsonPath));
  fs.writeFileSync(jsonPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  fs.writeFileSync(markdownPath, renderGovernanceConfigAuditTrailText(result), "utf8");
  return {
    jsonPath: ARTIFACT_JSON_PATH,
    markdownPath: ARTIFACT_MARKDOWN_PATH
  };
}

export function renderGovernanceConfigAuditTrailText(result: GovernanceConfigAuditTrailResult): string {
  const lines = [
    "# AI Software Factory - Governance Config Audit Trail",
    "",
    "Audit status:",
    result.auditStatus,
    "",
    "Source lock status:",
    result.sourceLockStatus,
    "",
    "Current fingerprint:",
    result.currentFingerprint ?? "-",
    "",
    "Previous fingerprint:",
    result.previousFingerprint ?? "-",
    "",
    "Fingerprint changed:",
    String(result.fingerprintChanged),
    "",
    "Drift detected:",
    String(result.driftDetected),
    "",
    "Stable candidate:",
    String(result.stableCandidate),
    "",
    "Total entries:",
    String(result.trailSummary.totalEntries),
    "",
    "Unique fingerprints:",
    String(result.trailSummary.uniqueFingerprints),
    "",
    "Repeated latest fingerprint count:",
    String(result.trailSummary.repeatedLatestFingerprintCount),
    "",
    "Applied:",
    String(result.applied),
    "",
    "Runtime behavior changed:",
    String(result.runtimeBehaviorChanged),
    "",
    "Governance decisions changed:",
    String(result.governanceDecisionsChanged),
    "",
    "Repair orchestration changed:",
    String(result.repairOrchestrationChanged),
    "",
    "Recommended next stage:",
    result.recommendedNextStage,
    "",
    "## Warnings",
    ""
  ];

  for (const warning of result.warnings) {
    lines.push(`- ${warning}`);
  }

  return `${lines.join("\n")}\n`;
}
