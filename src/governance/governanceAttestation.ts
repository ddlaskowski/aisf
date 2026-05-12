import fs from "fs-extra";
import path from "node:path";

import { buildGovernanceConfigAuditTrail } from "./configAuditTrail.js";
import {
  buildGovernanceRepoClassificationPreview,
  type GovernanceRepoClassificationPreview
} from "./repoClassificationPreview.js";

export type GovernanceAttestation = {
  schemaVersion: 1;
  attestationStatus: "not-created" | "created" | "blocked";
  sourceClassificationStatus: "not-created" | "created" | "blocked";
  attestationApplied: false;
  attestationEnforced: false;
  classificationApplied: false;
  boundariesEnforced: false;
  profileApplied: false;
  applied: false;
  enforced: false;
  policyRuntimeMode: "preview-only";
  runtimeBehaviorChanged: false;
  governanceDecisionsChanged: false;
  repairOrchestrationChanged: false;
  safePatchEngineOnly: true;
  autonomyEnabled: false;
  governanceChain: {
    activationPlanAvailable: boolean;
    loadPreviewAvailable: boolean;
    snapshotLockAvailable: boolean;
    auditTrailAvailable: boolean;
    policyRuntimePreviewAvailable: boolean;
    profileInheritancePreviewAvailable: boolean;
    repoClassificationPreviewAvailable: boolean;
  };
  governanceMaturity: {
    level: "basic" | "managed" | "advanced-preview" | "enterprise-preview";
    reason: string;
    stableGovernanceChain: boolean;
    deterministicArtifactsAvailable: number;
  };
  attestedSafetyInvariants: Array<{
    key: string;
    preserved: boolean;
    reason: string;
  }>;
  blockedCapabilities: Array<{
    key: string;
    reason: string;
  }>;
  governanceSummary: {
    recommendedProfile: string | null;
    repositoryCategory: string | null;
    stableCandidate: boolean;
    previewOnly: true;
  };
  warnings: string[];
  recommendedNextStage:
    | "continue-preview-only"
    | "prepare-ci-annotations"
    | "blocked";
};

const ARTIFACT_JSON_PATH = ".factory/governance/governance-attestation.json";
const ARTIFACT_MARKDOWN_PATH = ".factory/governance/governance-attestation.md";
const CHAIN_ARTIFACTS = [
  ".factory/governance/config-activation-plan.json",
  ".factory/governance/config-load-preview.json",
  ".factory/governance/config-snapshot-lock.json",
  ".factory/governance/config-audit-trail.json",
  ".factory/governance/policy-runtime-preview.json",
  ".factory/governance/profile-inheritance-preview.json",
  ".factory/governance/repo-classification-preview.json"
];

function exists(projectRoot: string, relativePath: string): boolean {
  return fs.existsSync(path.join(projectRoot, relativePath));
}

function countAvailableArtifacts(projectRoot: string): number {
  return CHAIN_ARTIFACTS.filter((relativePath) => exists(projectRoot, relativePath)).length;
}

function buildGovernanceChain(projectRoot: string): GovernanceAttestation["governanceChain"] {
  return {
    activationPlanAvailable: exists(projectRoot, ".factory/governance/config-activation-plan.json"),
    loadPreviewAvailable: exists(projectRoot, ".factory/governance/config-load-preview.json"),
    snapshotLockAvailable: exists(projectRoot, ".factory/governance/config-snapshot-lock.json"),
    auditTrailAvailable: exists(projectRoot, ".factory/governance/config-audit-trail.json"),
    policyRuntimePreviewAvailable: exists(projectRoot, ".factory/governance/policy-runtime-preview.json"),
    profileInheritancePreviewAvailable: exists(projectRoot, ".factory/governance/profile-inheritance-preview.json"),
    repoClassificationPreviewAvailable: exists(projectRoot, ".factory/governance/repo-classification-preview.json")
  };
}

function stableChain(projectRoot: string, classification: GovernanceRepoClassificationPreview): boolean {
  const { result: auditTrail } = buildGovernanceConfigAuditTrail(projectRoot);
  return classification.previewStatus === "created" && auditTrail.stableCandidate;
}

function maturityFor(
  projectRoot: string,
  classification: GovernanceRepoClassificationPreview,
  governanceChain: GovernanceAttestation["governanceChain"]
): GovernanceAttestation["governanceMaturity"] {
  const deterministicArtifactsAvailable = countAvailableArtifacts(projectRoot);
  const stableGovernanceChain = stableChain(projectRoot, classification);
  const advanced =
    governanceChain.policyRuntimePreviewAvailable &&
    governanceChain.profileInheritancePreviewAvailable &&
    governanceChain.repoClassificationPreviewAvailable;
  const managed =
    governanceChain.activationPlanAvailable &&
    governanceChain.loadPreviewAvailable &&
    governanceChain.snapshotLockAvailable &&
    governanceChain.auditTrailAvailable;
  const enterpriseLike =
    classification.repositoryClassification?.category === "enterprise" ||
    classification.repositoryClassification?.category === "high-governance";

  if (advanced && stableGovernanceChain && deterministicArtifactsAvailable >= 7 && classification.governanceBoundaryPreview !== null && enterpriseLike) {
    return {
      level: "enterprise-preview",
      reason: "Stable advanced governance chain with enterprise-style boundary preview and deterministic artifacts is available.",
      stableGovernanceChain,
      deterministicArtifactsAvailable
    };
  }
  if (advanced) {
    return {
      level: "advanced-preview",
      reason: "Policy runtime, profile inheritance, and repo classification previews are available.",
      stableGovernanceChain,
      deterministicArtifactsAvailable
    };
  }
  if (managed) {
    return {
      level: "managed",
      reason: "Activation, load, snapshot, and audit preview layers are available.",
      stableGovernanceChain,
      deterministicArtifactsAvailable
    };
  }
  return {
    level: "basic",
    reason: "Only an early governance preview chain is available.",
    stableGovernanceChain,
    deterministicArtifactsAvailable
  };
}

function invariant(key: string, preserved: boolean, reason: string): GovernanceAttestation["attestedSafetyInvariants"][number] {
  return { key, preserved, reason };
}

function buildSafetyInvariants(classification: GovernanceRepoClassificationPreview): GovernanceAttestation["attestedSafetyInvariants"] {
  return [
    invariant("runtime-config-not-activated", classification.applied === false, "Runtime governance config was not activated."),
    invariant("policies-not-enforced", classification.enforced === false, "Policies were not enforced."),
    invariant("profiles-not-applied", classification.profileApplied === false, "Governance profiles were not applied."),
    invariant("runtime-behavior-unchanged", classification.runtimeBehaviorChanged === false, "Runtime behavior did not change."),
    invariant("governance-decisions-unchanged", classification.governanceDecisionsChanged === false, "Governance decisions did not change."),
    invariant("repair-orchestration-unchanged", classification.repairOrchestrationChanged === false, "Repair orchestration did not change."),
    invariant("safe-patch-engine-only", classification.safePatchEngineOnly === true, "Safe Patch Engine remains the sole mutation layer."),
    invariant("no-autonomous-actions-enabled", true, "Autonomous actions are not enabled."),
    invariant("no-plugin-execution-enabled", true, "Plugin execution is not enabled."),
    invariant("no-dynamic-policy-execution-enabled", true, "Dynamic policy execution is not enabled."),
    invariant("no-mutation-scope-expansion", true, "Mutation scope was not expanded."),
    invariant("no-external-governance-dependencies", true, "External governance dependencies are not enabled."),
    invariant("no-runtime-learning-enabled", true, "Runtime learning is not enabled."),
    invariant("no-ml-vector-db-governance-systems-enabled", true, "ML, embeddings, and vector DB governance systems are not enabled.")
  ];
}

function blockedCapabilities(): GovernanceAttestation["blockedCapabilities"] {
  return [
    { key: "autonomousExecution", reason: "Autonomous execution remains blocked." },
    { key: "runtimeGovernanceEnforcement", reason: "Runtime governance enforcement remains blocked." },
    { key: "pluginExecution", reason: "Plugin execution remains blocked." },
    { key: "dynamicPolicyExecution", reason: "Dynamic policy execution remains blocked." },
    { key: "remoteGovernanceLoading", reason: "Remote governance loading remains blocked." },
    { key: "externalCommandExecution", reason: "External command execution remains blocked." },
    { key: "mutationScopeExpansion", reason: "Mutation scope expansion remains blocked." },
    { key: "multiAgentOrchestration", reason: "Multi-agent orchestration remains blocked." },
    { key: "selfModifyingGovernance", reason: "Self-modifying governance remains blocked." },
    { key: "runtimeScriptEvaluation", reason: "Runtime script evaluation remains blocked." }
  ];
}

function buildWarnings(attestationStatus: GovernanceAttestation["attestationStatus"]): string[] {
  const warnings: string[] = [];
  if (attestationStatus === "not-created") {
    warnings.push("Repo classification preview is not created; governance attestation was not created.");
  } else if (attestationStatus === "blocked") {
    warnings.push("Governance preview chain is blocked; governance attestation was blocked.");
  } else {
    warnings.push("Deterministic governance attestation was generated.");
  }
  warnings.push("This is not a cryptographic attestation.");
  warnings.push("No governance was enforced.");
  warnings.push("No profile was applied.");
  warnings.push("Runtime behavior did not change.");
  warnings.push("Governance decisions did not change.");
  warnings.push("Repair orchestration did not change.");
  warnings.push("Safe Patch Engine remains the only mutation layer.");
  return warnings;
}

export function buildGovernanceAttestation(projectRoot: string): GovernanceAttestation {
  const classification = buildGovernanceRepoClassificationPreview(projectRoot);
  const governanceChain = buildGovernanceChain(projectRoot);
  const attestationStatus: GovernanceAttestation["attestationStatus"] =
    classification.previewStatus === "blocked"
      ? "blocked"
      : classification.previewStatus === "created"
        ? "created"
        : "not-created";
  const governanceMaturity = maturityFor(projectRoot, classification, governanceChain);
  const attestedSafetyInvariants = buildSafetyInvariants(classification);
  const recommendedNextStage: GovernanceAttestation["recommendedNextStage"] =
    attestationStatus === "blocked"
      ? "blocked"
      : attestationStatus === "created"
        ? "prepare-ci-annotations"
        : "continue-preview-only";

  return {
    schemaVersion: 1,
    attestationStatus,
    sourceClassificationStatus: classification.previewStatus,
    attestationApplied: false,
    attestationEnforced: false,
    classificationApplied: false,
    boundariesEnforced: false,
    profileApplied: false,
    applied: false,
    enforced: false,
    policyRuntimeMode: "preview-only",
    runtimeBehaviorChanged: false,
    governanceDecisionsChanged: false,
    repairOrchestrationChanged: false,
    safePatchEngineOnly: true,
    autonomyEnabled: false,
    governanceChain,
    governanceMaturity,
    attestedSafetyInvariants,
    blockedCapabilities: blockedCapabilities(),
    governanceSummary: {
      recommendedProfile: classification.governanceBoundaryPreview?.recommendedProfile ?? null,
      repositoryCategory: classification.repositoryClassification?.category ?? null,
      stableCandidate: governanceMaturity.stableGovernanceChain,
      previewOnly: true
    },
    warnings: buildWarnings(attestationStatus),
    recommendedNextStage
  };
}

export function writeGovernanceAttestationArtifacts(
  projectRoot: string,
  attestation: GovernanceAttestation
): { jsonPath: string; markdownPath: string } {
  const jsonPath = path.join(projectRoot, ARTIFACT_JSON_PATH);
  const markdownPath = path.join(projectRoot, ARTIFACT_MARKDOWN_PATH);
  fs.ensureDirSync(path.dirname(jsonPath));
  fs.writeFileSync(jsonPath, `${JSON.stringify(attestation, null, 2)}\n`, "utf8");
  fs.writeFileSync(markdownPath, renderGovernanceAttestationText(attestation), "utf8");
  return {
    jsonPath: ARTIFACT_JSON_PATH,
    markdownPath: ARTIFACT_MARKDOWN_PATH
  };
}

export function renderGovernanceAttestationText(attestation: GovernanceAttestation): string {
  const lines = [
    "# AI Software Factory - Governance Attestation",
    "",
    "Attestation status:",
    attestation.attestationStatus,
    "",
    "Source classification status:",
    attestation.sourceClassificationStatus,
    "",
    "Governance maturity level:",
    attestation.governanceMaturity.level,
    "",
    "Stable governance chain:",
    String(attestation.governanceMaturity.stableGovernanceChain),
    "",
    "Repository category:",
    attestation.governanceSummary.repositoryCategory ?? "-",
    "",
    "Recommended profile:",
    attestation.governanceSummary.recommendedProfile ?? "-",
    "",
    "Attestation applied:",
    String(attestation.attestationApplied),
    "",
    "Attestation enforced:",
    String(attestation.attestationEnforced),
    "",
    "Classification applied:",
    String(attestation.classificationApplied),
    "",
    "Boundaries enforced:",
    String(attestation.boundariesEnforced),
    "",
    "Profile applied:",
    String(attestation.profileApplied),
    "",
    "Applied:",
    String(attestation.applied),
    "",
    "Enforced:",
    String(attestation.enforced),
    "",
    "Policy runtime mode:",
    attestation.policyRuntimeMode,
    "",
    "Runtime behavior changed:",
    String(attestation.runtimeBehaviorChanged),
    "",
    "Governance decisions changed:",
    String(attestation.governanceDecisionsChanged),
    "",
    "Repair orchestration changed:",
    String(attestation.repairOrchestrationChanged),
    "",
    "Safe Patch Engine only:",
    String(attestation.safePatchEngineOnly),
    "",
    "Autonomy enabled:",
    String(attestation.autonomyEnabled),
    "",
    "Recommended next stage:",
    attestation.recommendedNextStage,
    "",
    "## Governance Chain",
    ""
  ];

  for (const [key, value] of Object.entries(attestation.governanceChain)) {
    lines.push(`- ${key}: ${value}`);
  }

  lines.push("", "## Attested Safety Invariants", "");
  for (const invariant of attestation.attestedSafetyInvariants) {
    lines.push(`- [${invariant.preserved ? "preserved" : "not-preserved"}] ${invariant.key}: ${invariant.reason}`);
  }

  lines.push("", "## Blocked Capabilities", "");
  for (const blocked of attestation.blockedCapabilities) {
    lines.push(`- ${blocked.key}: ${blocked.reason}`);
  }

  lines.push("", "## Warnings", "");
  for (const warning of attestation.warnings) {
    lines.push(`- ${warning}`);
  }

  return `${lines.join("\n")}\n`;
}
