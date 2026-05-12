import fs from "fs-extra";
import path from "node:path";

import {
  buildGovernanceConfigLoadPreview,
  type GovernanceConfigLoadPreview
} from "./configLoadPreview.js";

export type GovernanceConfigSnapshotLock = {
  schemaVersion: 1;
  lockStatus: "not-created" | "created" | "blocked";
  sourcePreviewStatus: "missing" | "valid" | "invalid";
  sourceLoadStatus: "not-loaded" | "loaded-for-preview" | "blocked";
  applied: false;
  runtimeBehaviorChanged: false;
  governanceDecisionsChanged: false;
  repairOrchestrationChanged: false;
  lock: {
    lockVersion: 1;
    source: "governance-config-load-preview";
    deterministicId: string;
    fingerprint: string;
    safeOverrideKeys: string[];
    blockedKeys: string[];
    valueCount: number;
    lockedAt: string;
  } | null;
  warnings: string[];
  requiredBeforeActivation: string[];
  recommendedNextStage: "fix-config" | "continue-preview-only" | "prepare-audit-trail" | "blocked";
};

const ARTIFACT_JSON_PATH = ".factory/governance/config-snapshot-lock.json";
const ARTIFACT_MARKDOWN_PATH = ".factory/governance/config-snapshot-lock.md";
const LOCKED_AT = "deterministic-lock";

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(",")}}`;
}

function checksum(input: string): string {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function buildFingerprint(snapshot: NonNullable<GovernanceConfigLoadPreview["loadedSnapshot"]>): string {
  const input = stableStringify({
    schemaVersion: snapshot.schemaVersion,
    safeOverrideKeys: snapshot.safeOverrideKeys,
    blockedKeys: snapshot.blockedKeys,
    values: snapshot.values
  });
  return `${checksum(input)}${checksum(input.split("").reverse().join(""))}`;
}

function buildWarnings(preview: GovernanceConfigLoadPreview, created: boolean): string[] {
  const warnings = [...preview.warnings];
  if (created) {
    warnings.push("Governance config preview was converted into a deterministic snapshot lock.");
    warnings.push("Snapshot lock is for audit and preview only.");
  } else if (preview.configStatus === "missing") {
    warnings.push("No snapshot lock was created because config was not loaded.");
  } else {
    warnings.push("No snapshot lock was created because config loading was blocked.");
  }
  warnings.push("Runtime behavior did not change.");
  warnings.push("Governance decisions did not change.");
  warnings.push("Repair orchestration did not change.");
  return Array.from(new Set(warnings));
}

export function buildGovernanceConfigSnapshotLock(projectRoot: string): GovernanceConfigSnapshotLock {
  const preview = buildGovernanceConfigLoadPreview(projectRoot);
  const canLock = preview.loadStatus === "loaded-for-preview" && preview.loadedSnapshot !== null;
  const loadedSnapshot = canLock ? preview.loadedSnapshot as NonNullable<GovernanceConfigLoadPreview["loadedSnapshot"]> : null;
  const fingerprint = loadedSnapshot === null ? null : buildFingerprint(loadedSnapshot);
  const lockStatus: GovernanceConfigSnapshotLock["lockStatus"] =
    preview.loadStatus === "not-loaded"
      ? "not-created"
      : canLock
        ? "created"
        : "blocked";
  const recommendedNextStage: GovernanceConfigSnapshotLock["recommendedNextStage"] =
    preview.loadStatus === "not-loaded"
      ? "continue-preview-only"
      : preview.configStatus === "invalid"
        ? "fix-config"
        : canLock
          ? "prepare-audit-trail"
          : "blocked";

  return {
    schemaVersion: 1,
    lockStatus,
    sourcePreviewStatus: preview.configStatus,
    sourceLoadStatus: preview.loadStatus,
    applied: false,
    runtimeBehaviorChanged: false,
    governanceDecisionsChanged: false,
    repairOrchestrationChanged: false,
    lock: loadedSnapshot !== null && fingerprint !== null
      ? {
          lockVersion: 1,
          source: "governance-config-load-preview",
          deterministicId: `gov-config-lock-${fingerprint.slice(0, 12)}`,
          fingerprint,
          safeOverrideKeys: [...loadedSnapshot.safeOverrideKeys],
          blockedKeys: [...loadedSnapshot.blockedKeys],
          valueCount: Object.keys(loadedSnapshot.values).length,
          lockedAt: LOCKED_AT
        }
      : null,
    warnings: buildWarnings(preview, canLock),
    requiredBeforeActivation: [
      "Snapshot lock must remain stable across repeated runs.",
      "Snapshot lock must be compared before future runtime activation.",
      "Runtime behavior must remain unchanged until explicit activation is implemented.",
      "Governance decisions and repair orchestration must remain unchanged during snapshot locking."
    ],
    recommendedNextStage
  };
}

export function writeGovernanceConfigSnapshotLockArtifacts(
  projectRoot: string,
  snapshotLock: GovernanceConfigSnapshotLock
): { jsonPath: string; markdownPath: string } {
  const jsonPath = path.join(projectRoot, ARTIFACT_JSON_PATH);
  const markdownPath = path.join(projectRoot, ARTIFACT_MARKDOWN_PATH);
  fs.ensureDirSync(path.dirname(jsonPath));
  fs.writeFileSync(jsonPath, `${JSON.stringify(snapshotLock, null, 2)}\n`, "utf8");
  fs.writeFileSync(markdownPath, renderGovernanceConfigSnapshotLockText(snapshotLock), "utf8");
  return {
    jsonPath: ARTIFACT_JSON_PATH,
    markdownPath: ARTIFACT_MARKDOWN_PATH
  };
}

export function renderGovernanceConfigSnapshotLockText(snapshotLock: GovernanceConfigSnapshotLock): string {
  const lines = [
    "# AI Software Factory - Governance Config Snapshot Lock",
    "",
    "Lock status:",
    snapshotLock.lockStatus,
    "",
    "Source config status:",
    snapshotLock.sourcePreviewStatus,
    "",
    "Source load status:",
    snapshotLock.sourceLoadStatus,
    "",
    "Fingerprint:",
    snapshotLock.lock?.fingerprint ?? "-",
    "",
    "Deterministic ID:",
    snapshotLock.lock?.deterministicId ?? "-",
    "",
    "Applied:",
    String(snapshotLock.applied),
    "",
    "Runtime behavior changed:",
    String(snapshotLock.runtimeBehaviorChanged),
    "",
    "Governance decisions changed:",
    String(snapshotLock.governanceDecisionsChanged),
    "",
    "Repair orchestration changed:",
    String(snapshotLock.repairOrchestrationChanged),
    "",
    "Recommended next stage:",
    snapshotLock.recommendedNextStage,
    "",
    "## Safe Override Keys",
    ""
  ];

  const safeKeys = snapshotLock.lock?.safeOverrideKeys ?? [];
  if (safeKeys.length === 0) {
    lines.push("- none");
  } else {
    for (const key of safeKeys) {
      lines.push(`- ${key}`);
    }
  }

  lines.push("", "## Blocked Keys", "");
  const blockedKeys = snapshotLock.lock?.blockedKeys ?? [];
  if (blockedKeys.length === 0) {
    lines.push("- none");
  } else {
    for (const key of blockedKeys) {
      lines.push(`- ${key}`);
    }
  }

  lines.push("", "## Warnings", "");
  for (const warning of snapshotLock.warnings) {
    lines.push(`- ${warning}`);
  }

  lines.push("", "## Required Before Activation", "");
  for (const check of snapshotLock.requiredBeforeActivation) {
    lines.push(`- ${check}`);
  }

  return `${lines.join("\n")}\n`;
}
