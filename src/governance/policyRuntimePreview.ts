import fs from "fs-extra";
import path from "node:path";

import {
  buildGovernanceConfigAuditTrail,
  type GovernanceConfigAuditTrailResult
} from "./configAuditTrail.js";
import {
  buildGovernanceConfigLoadPreview,
  type GovernanceConfigLoadPreview
} from "./configLoadPreview.js";

export type GovernancePolicyRuntimePreviewCategory =
  | "threshold"
  | "release-gate"
  | "escalation"
  | "evidence"
  | "archive"
  | "dashboard"
  | "export"
  | "other-governance";

export type GovernancePolicyRuntimePreviewPolicy = {
  key: string;
  category: GovernancePolicyRuntimePreviewCategory;
  source: "governance-config";
  previewOnly: true;
  active: false;
  enforced: false;
  candidateValue: unknown;
  reason: string;
};

export type GovernancePolicyRuntimeBlockedPolicy = {
  key: string;
  reason: string;
};

export type GovernancePolicyRuntimeUnsupportedPolicy = {
  key: string;
  reason: string;
};

export type GovernancePolicyRuntimePreview = {
  schemaVersion: 1;
  previewStatus: "not-created" | "created" | "blocked";
  sourceAuditStatus: "not-created" | "updated" | "blocked";
  policyRuntimeMode: "preview-only";
  applied: false;
  enforced: false;
  runtimeBehaviorChanged: false;
  governanceDecisionsChanged: false;
  repairOrchestrationChanged: false;
  configCandidate: {
    stableCandidate: boolean;
    fingerprint: string | null;
    deterministicId: string | null;
    totalAuditEntries: number;
    repeatedLatestFingerprintCount: number;
  };
  policyModel: {
    modelVersion: 1;
    source: "governance-config-audit-trail";
    policies: GovernancePolicyRuntimePreviewPolicy[];
  } | null;
  blockedPolicies: GovernancePolicyRuntimeBlockedPolicy[];
  unsupportedPolicies: GovernancePolicyRuntimeUnsupportedPolicy[];
  warnings: string[];
  recommendedNextStage:
    | "fix-config"
    | "continue-preview-only"
    | "prepare-profile-inheritance"
    | "blocked";
};

const ARTIFACT_JSON_PATH = ".factory/governance/policy-runtime-preview.json";
const ARTIFACT_MARKDOWN_PATH = ".factory/governance/policy-runtime-preview.md";

function categoryForKey(key: string): GovernancePolicyRuntimePreviewCategory | null {
  const normalized = key.toLowerCase();
  if (normalized.includes(".thresholds.") || normalized.includes("threshold")) {
    return "threshold";
  }
  if (normalized.includes("releasegate") || normalized.includes("release-gate")) {
    return "release-gate";
  }
  if (normalized.includes("escalation") || normalized.includes("manualreview") || normalized.includes("manual-review")) {
    return "escalation";
  }
  if (normalized.includes("evidence")) {
    return "evidence";
  }
  if (normalized.includes("archive")) {
    return "archive";
  }
  if (normalized.includes("dashboard")) {
    return "dashboard";
  }
  if (normalized.includes("export")) {
    return "export";
  }
  if (normalized === "defaultpolicyprofile") {
    return null;
  }
  return "other-governance";
}

function reasonForCategory(category: GovernancePolicyRuntimePreviewCategory): string {
  if (category === "threshold") {
    return "Governance threshold override is representable as a preview-only policy candidate.";
  }
  if (category === "release-gate") {
    return "Release gate override is representable as a preview-only policy candidate.";
  }
  if (category === "escalation") {
    return "Escalation override is representable as a preview-only policy candidate.";
  }
  if (category === "evidence") {
    return "Evidence override is representable as a preview-only policy candidate.";
  }
  if (category === "archive") {
    return "Archive override is representable as a preview-only policy candidate.";
  }
  if (category === "dashboard") {
    return "Dashboard override is representable as a preview-only policy candidate.";
  }
  if (category === "export") {
    return "Export override is representable as a preview-only policy candidate.";
  }
  return "Safe governance override is representable as a preview-only policy candidate.";
}

function unsupportedReasonForKey(key: string): string {
  if (key === "defaultPolicyProfile") {
    return "Default policy profile selection is not supported by policy runtime preview yet.";
  }
  return "Known safe governance key is not supported by policy runtime preview yet.";
}

function buildPoliciesFromSnapshot(
  snapshot: NonNullable<GovernanceConfigLoadPreview["loadedSnapshot"]>
): {
  policies: GovernancePolicyRuntimePreviewPolicy[];
  unsupportedPolicies: GovernancePolicyRuntimeUnsupportedPolicy[];
} {
  const policies: GovernancePolicyRuntimePreviewPolicy[] = [];
  const unsupportedPolicies: GovernancePolicyRuntimeUnsupportedPolicy[] = [];

  for (const key of [...snapshot.safeOverrideKeys].sort()) {
    const category = categoryForKey(key);
    if (category === null) {
      unsupportedPolicies.push({
        key,
        reason: unsupportedReasonForKey(key)
      });
      continue;
    }
    policies.push({
      key,
      category,
      source: "governance-config",
      previewOnly: true,
      active: false,
      enforced: false,
      candidateValue: snapshot.values[key] ?? null,
      reason: reasonForCategory(category)
    });
  }

  return {
    policies,
    unsupportedPolicies
  };
}

function buildBlockedPolicies(loadPreview: GovernanceConfigLoadPreview): GovernancePolicyRuntimeBlockedPolicy[] {
  return loadPreview.blockedOptions
    .map((blocked) => ({
      key: blocked.key,
      reason: blocked.reason
    }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

function recommendedStageForBlocked(audit: GovernanceConfigAuditTrailResult): GovernancePolicyRuntimePreview["recommendedNextStage"] {
  return audit.recommendedNextStage === "fix-config" ? "fix-config" : "blocked";
}

function buildWarnings(
  audit: GovernanceConfigAuditTrailResult,
  previewStatus: GovernancePolicyRuntimePreview["previewStatus"]
): string[] {
  const warnings = [...audit.warnings];
  if (previewStatus === "created") {
    warnings.push("Preview-only Policy-as-Code runtime model was created.");
  } else if (audit.auditStatus === "updated" && !audit.stableCandidate) {
    warnings.push("config candidate is not stable across repeated audit entries");
  } else if (audit.auditStatus === "not-created") {
    warnings.push("No stable governance config audit trail is available.");
  } else {
    warnings.push("Policy runtime preview was blocked by governance config audit state.");
  }
  warnings.push("No policy was applied.");
  warnings.push("No policy was enforced.");
  warnings.push("Runtime behavior did not change.");
  warnings.push("Governance decisions did not change.");
  warnings.push("Repair orchestration did not change.");
  return Array.from(new Set(warnings));
}

export function buildGovernancePolicyRuntimePreview(projectRoot: string): GovernancePolicyRuntimePreview {
  const { result: audit } = buildGovernanceConfigAuditTrail(projectRoot);
  const loadPreview = buildGovernanceConfigLoadPreview(projectRoot);
  const blockedPolicies = buildBlockedPolicies(loadPreview);
  const stableCandidate = audit.auditStatus === "updated" && audit.stableCandidate;
  const canCreate = stableCandidate && loadPreview.loadedSnapshot !== null && blockedPolicies.length === 0;
  const previewStatus: GovernancePolicyRuntimePreview["previewStatus"] =
    audit.auditStatus === "blocked" || blockedPolicies.length > 0
      ? "blocked"
      : canCreate
        ? "created"
        : "not-created";

  const policyProjection = canCreate && loadPreview.loadedSnapshot !== null
    ? buildPoliciesFromSnapshot(loadPreview.loadedSnapshot)
    : { policies: [], unsupportedPolicies: [] };
  const recommendedNextStage: GovernancePolicyRuntimePreview["recommendedNextStage"] =
    previewStatus === "blocked"
      ? recommendedStageForBlocked(audit)
      : previewStatus === "created"
        ? "prepare-profile-inheritance"
        : "continue-preview-only";

  return {
    schemaVersion: 1,
    previewStatus,
    sourceAuditStatus: audit.auditStatus,
    policyRuntimeMode: "preview-only",
    applied: false,
    enforced: false,
    runtimeBehaviorChanged: false,
    governanceDecisionsChanged: false,
    repairOrchestrationChanged: false,
    configCandidate: {
      stableCandidate: audit.stableCandidate,
      fingerprint: audit.currentFingerprint,
      deterministicId: audit.currentEntry?.deterministicId ?? null,
      totalAuditEntries: audit.trailSummary.totalEntries,
      repeatedLatestFingerprintCount: audit.trailSummary.repeatedLatestFingerprintCount
    },
    policyModel: previewStatus === "created"
      ? {
          modelVersion: 1,
          source: "governance-config-audit-trail",
          policies: policyProjection.policies
        }
      : null,
    blockedPolicies,
    unsupportedPolicies: policyProjection.unsupportedPolicies,
    warnings: buildWarnings(audit, previewStatus),
    recommendedNextStage
  };
}

export function writeGovernancePolicyRuntimePreviewArtifacts(
  projectRoot: string,
  preview: GovernancePolicyRuntimePreview
): { jsonPath: string; markdownPath: string } {
  const jsonPath = path.join(projectRoot, ARTIFACT_JSON_PATH);
  const markdownPath = path.join(projectRoot, ARTIFACT_MARKDOWN_PATH);
  fs.ensureDirSync(path.dirname(jsonPath));
  fs.writeFileSync(jsonPath, `${JSON.stringify(preview, null, 2)}\n`, "utf8");
  fs.writeFileSync(markdownPath, renderGovernancePolicyRuntimePreviewText(preview), "utf8");
  return {
    jsonPath: ARTIFACT_JSON_PATH,
    markdownPath: ARTIFACT_MARKDOWN_PATH
  };
}

export function renderGovernancePolicyRuntimePreviewText(preview: GovernancePolicyRuntimePreview): string {
  const lines = [
    "# AI Software Factory - Policy-as-Code Governance Runtime Preview",
    "",
    "Preview status:",
    preview.previewStatus,
    "",
    "Source audit status:",
    preview.sourceAuditStatus,
    "",
    "Policy runtime mode:",
    preview.policyRuntimeMode,
    "",
    "Applied:",
    String(preview.applied),
    "",
    "Enforced:",
    String(preview.enforced),
    "",
    "Runtime behavior changed:",
    String(preview.runtimeBehaviorChanged),
    "",
    "Governance decisions changed:",
    String(preview.governanceDecisionsChanged),
    "",
    "Repair orchestration changed:",
    String(preview.repairOrchestrationChanged),
    "",
    "Stable candidate:",
    String(preview.configCandidate.stableCandidate),
    "",
    "Fingerprint:",
    preview.configCandidate.fingerprint ?? "-",
    "",
    "Deterministic ID:",
    preview.configCandidate.deterministicId ?? "-",
    "",
    "Total policy candidates:",
    String(preview.policyModel?.policies.length ?? 0),
    "",
    "Recommended next stage:",
    preview.recommendedNextStage,
    "",
    "## Active Policies",
    "",
    "- none",
    "",
    "## Preview-only Policies",
    ""
  ];

  const policies = preview.policyModel?.policies ?? [];
  if (policies.length === 0) {
    lines.push("- none");
  } else {
    for (const policy of policies) {
      lines.push(`- ${policy.key} (${policy.category}) - ${policy.reason}`);
    }
  }

  lines.push("", "## Blocked Policies", "");
  if (preview.blockedPolicies.length === 0) {
    lines.push("- none");
  } else {
    for (const policy of preview.blockedPolicies) {
      lines.push(`- ${policy.key}: ${policy.reason}`);
    }
  }

  lines.push("", "## Unsupported Policies", "");
  if (preview.unsupportedPolicies.length === 0) {
    lines.push("- none");
  } else {
    for (const policy of preview.unsupportedPolicies) {
      lines.push(`- ${policy.key}: ${policy.reason}`);
    }
  }

  lines.push("", "## Warnings", "");
  for (const warning of preview.warnings) {
    lines.push(`- ${warning}`);
  }

  return `${lines.join("\n")}\n`;
}
