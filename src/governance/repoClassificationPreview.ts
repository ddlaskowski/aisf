import fs from "fs-extra";
import path from "node:path";

import { buildGovernanceProfileInheritancePreview } from "./profileInheritancePreview.js";

export type GovernanceRepoClassificationCategory =
  | "local-development"
  | "single-repo"
  | "multi-service"
  | "enterprise"
  | "high-governance"
  | "experimental"
  | "unknown";

export type GovernanceRepoClassificationPreview = {
  schemaVersion: 1;
  previewStatus: "not-created" | "created" | "blocked";
  sourceProfilePreviewStatus: "not-created" | "created" | "blocked";
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
  repositoryClassification: {
    category: GovernanceRepoClassificationCategory;
    confidence: "low" | "medium" | "high";
    signals: Array<{
      key: string;
      matched: boolean;
      reason: string;
    }>;
    reason: string;
  } | null;
  governanceBoundaryPreview: {
    allowedProfiles: string[];
    recommendedProfile:
      | "default"
      | "strict"
      | "enterprise"
      | "experimental-preview"
      | null;
    relevantPolicyCategories: string[];
    blockedBoundaryCapabilities: Array<{
      key: string;
      reason: string;
    }>;
    previewOnly: true;
    boundariesEnforced: false;
  } | null;
  warnings: string[];
  recommendedNextStage:
    | "continue-preview-only"
    | "prepare-governance-attestation"
    | "blocked";
};

const ARTIFACT_JSON_PATH = ".factory/governance/repo-classification-preview.json";
const ARTIFACT_MARKDOWN_PATH = ".factory/governance/repo-classification-preview.md";

function exists(projectRoot: string, relativePath: string): boolean {
  return fs.existsSync(path.join(projectRoot, relativePath));
}

function directoryExists(projectRoot: string, relativePath: string): boolean {
  const targetPath = path.join(projectRoot, relativePath);
  return fs.existsSync(targetPath) && fs.statSync(targetPath).isDirectory();
}

function countExisting(projectRoot: string, relativePaths: string[]): number {
  return relativePaths.filter((relativePath) => exists(projectRoot, relativePath)).length;
}

function buildSignals(projectRoot: string, profileCreated: boolean): NonNullable<GovernanceRepoClassificationPreview["repositoryClassification"]>["signals"] {
  const serviceDirs = ["apps", "services", "packages"].filter((relativePath) => directoryExists(projectRoot, relativePath));
  const governanceArtifactCount = countExisting(projectRoot, [
    ".factory/governance/config-activation-plan.json",
    ".factory/governance/config-load-preview.json",
    ".factory/governance/config-snapshot-lock.json",
    ".factory/governance/config-audit-trail.json",
    ".factory/governance/policy-runtime-preview.json",
    ".factory/governance/profile-inheritance-preview.json"
  ]);
  const evidenceArtifactCount = countExisting(projectRoot, [
    ".factory/evidence-index.json",
    ".factory/archive-index.json",
    ".factory/runs-index.json"
  ]);

  return [
    {
      key: "package-json-present",
      matched: exists(projectRoot, "package.json"),
      reason: "package.json indicates a local project runtime."
    },
    {
      key: "multi-service-directories",
      matched: serviceDirs.length > 1,
      reason: serviceDirs.length > 1
        ? `Multiple service directories detected: ${serviceDirs.join(", ")}.`
        : "Multiple service directories were not detected."
    },
    {
      key: "profile-preview-created",
      matched: profileCreated,
      reason: profileCreated
        ? "Governance profile inheritance preview is available."
        : "Governance profile inheritance preview is not available."
    },
    {
      key: "governance-artifact-depth",
      matched: governanceArtifactCount >= 3,
      reason: `${governanceArtifactCount} governance preview artifacts detected.`
    },
    {
      key: "evidence-audit-artifacts",
      matched: evidenceArtifactCount >= 2 || directoryExists(projectRoot, ".factory/evidence-packs"),
      reason: `${evidenceArtifactCount} evidence, archive, or run index artifacts detected.`
    },
    {
      key: "release-gate-structure",
      matched: exists(projectRoot, ".factory/release-gate.json") || exists(projectRoot, "docs/release-gate.md"),
      reason: "Release gate structure was checked deterministically."
    },
    {
      key: "experimental-preview-marker",
      matched: exists(projectRoot, ".factory/governance/experimental-preview.flag"),
      reason: "Experimental preview marker was checked deterministically."
    }
  ];
}

function classify(signals: NonNullable<GovernanceRepoClassificationPreview["repositoryClassification"]>["signals"]): NonNullable<GovernanceRepoClassificationPreview["repositoryClassification"]> {
  const matched = new Set(signals.filter((signal) => signal.matched).map((signal) => signal.key));
  const governanceDepth = matched.has("governance-artifact-depth");
  const evidenceDepth = matched.has("evidence-audit-artifacts");
  const releaseGate = matched.has("release-gate-structure");
  const profilePreview = matched.has("profile-preview-created");
  const multiService = matched.has("multi-service-directories");
  const experimental = matched.has("experimental-preview-marker");
  const packageJson = matched.has("package-json-present");

  if (experimental && profilePreview) {
    return {
      category: "experimental",
      confidence: "high",
      signals,
      reason: "Experimental preview marker and governance profile preview were detected."
    };
  }
  if (governanceDepth && evidenceDepth && releaseGate && profilePreview) {
    return {
      category: "enterprise",
      confidence: "high",
      signals,
      reason: "Governance, evidence, release gate, and profile preview maturity were detected."
    };
  }
  if (governanceDepth && evidenceDepth && profilePreview) {
    return {
      category: "high-governance",
      confidence: "high",
      signals,
      reason: "Governance and evidence maturity were detected."
    };
  }
  if (multiService) {
    return {
      category: "multi-service",
      confidence: "medium",
      signals,
      reason: "Multiple service directories were detected."
    };
  }
  if (profilePreview && packageJson) {
    return {
      category: "single-repo",
      confidence: "medium",
      signals,
      reason: "Single repository runtime and governance profile preview were detected."
    };
  }
  if (packageJson) {
    return {
      category: "local-development",
      confidence: "low",
      signals,
      reason: "Local project runtime was detected with limited governance maturity."
    };
  }
  return {
    category: "unknown",
    confidence: "low",
    signals,
    reason: "Insufficient deterministic repository evidence was available."
  };
}

function profileForCategory(category: GovernanceRepoClassificationCategory): NonNullable<GovernanceRepoClassificationPreview["governanceBoundaryPreview"]>["recommendedProfile"] {
  if (category === "enterprise" || category === "high-governance") {
    return "enterprise";
  }
  if (category === "multi-service" || category === "single-repo") {
    return "strict";
  }
  if (category === "experimental") {
    return "experimental-preview";
  }
  if (category === "local-development") {
    return "default";
  }
  return null;
}

function allowedProfilesForCategory(category: GovernanceRepoClassificationCategory): string[] {
  if (category === "enterprise" || category === "high-governance") {
    return ["default", "strict", "enterprise"];
  }
  if (category === "experimental") {
    return ["default", "experimental-preview"];
  }
  if (category === "multi-service" || category === "single-repo") {
    return ["default", "strict"];
  }
  if (category === "local-development") {
    return ["default"];
  }
  return [];
}

function categoryForPolicyKey(key: string): string {
  const normalized = key.toLowerCase();
  if (normalized.includes("threshold") || normalized.includes(".thresholds.")) {
    return "threshold";
  }
  if (normalized.includes("release")) {
    return "release-gate";
  }
  if (normalized.includes("escalation") || normalized.includes("manual")) {
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
  return "other-governance";
}

function blockedBoundaryCapabilities(): NonNullable<GovernanceRepoClassificationPreview["governanceBoundaryPreview"]>["blockedBoundaryCapabilities"] {
  return [
    {
      key: "enableRuntimeEnforcement",
      reason: "Runtime enforcement is blocked in repo classification preview."
    },
    {
      key: "enableAutonomy",
      reason: "Autonomy is blocked in repo classification preview."
    },
    {
      key: "bypassSafePatchEngine",
      reason: "Safe Patch Engine bypass is blocked."
    },
    {
      key: "expandMutationScope",
      reason: "Mutation scope expansion is blocked."
    },
    {
      key: "disableGovernanceSafetyGates",
      reason: "Governance safety gate disabling is blocked."
    },
    {
      key: "allowPluginExecution",
      reason: "Plugin execution is blocked."
    },
    {
      key: "allowDynamicPolicyExecution",
      reason: "Dynamic policy execution is blocked."
    },
    {
      key: "allowExternalExecution",
      reason: "External execution is blocked."
    },
    {
      key: "allowUncontrolledOrchestration",
      reason: "Uncontrolled orchestration is blocked."
    }
  ];
}

function buildWarnings(previewStatus: GovernanceRepoClassificationPreview["previewStatus"]): string[] {
  const warnings: string[] = [];
  if (previewStatus === "not-created") {
    warnings.push("Profile inheritance preview is not created; repo classification preview was not created.");
  } else if (previewStatus === "blocked") {
    warnings.push("Profile inheritance preview is blocked; repo classification preview was blocked.");
  } else {
    warnings.push("Repository was classified in preview-only mode.");
    warnings.push("Governance boundaries were previewed only.");
  }
  warnings.push("Classification was not applied.");
  warnings.push("Governance boundaries were not enforced.");
  warnings.push("Profiles were not applied.");
  warnings.push("Policies were not enforced.");
  warnings.push("Runtime behavior did not change.");
  warnings.push("Governance decisions did not change.");
  warnings.push("Repair orchestration did not change.");
  warnings.push("Safe Patch Engine remains the only mutation layer.");
  return warnings;
}

export function buildGovernanceRepoClassificationPreview(projectRoot: string): GovernanceRepoClassificationPreview {
  const profilePreview = buildGovernanceProfileInheritancePreview(projectRoot);
  const sourceStatus = profilePreview.previewStatus;
  const previewStatus: GovernanceRepoClassificationPreview["previewStatus"] =
    sourceStatus === "blocked"
      ? "blocked"
      : sourceStatus === "created"
        ? "created"
        : "not-created";
  const repositoryClassification = previewStatus === "created"
    ? classify(buildSignals(projectRoot, true))
    : null;
  const inheritedPolicyKeys = profilePreview.resolvedProfiles[0]?.inheritedPolicyKeys ?? [];
  const relevantPolicyCategories = Array.from(new Set(inheritedPolicyKeys.map(categoryForPolicyKey))).sort();
  const governanceBoundaryPreview = repositoryClassification === null
    ? null
    : {
        allowedProfiles: allowedProfilesForCategory(repositoryClassification.category),
        recommendedProfile: profileForCategory(repositoryClassification.category),
        relevantPolicyCategories,
        blockedBoundaryCapabilities: blockedBoundaryCapabilities(),
        previewOnly: true as const,
        boundariesEnforced: false as const
      };
  const recommendedNextStage: GovernanceRepoClassificationPreview["recommendedNextStage"] =
    previewStatus === "blocked"
      ? "blocked"
      : previewStatus === "created"
        ? "prepare-governance-attestation"
        : "continue-preview-only";

  return {
    schemaVersion: 1,
    previewStatus,
    sourceProfilePreviewStatus: sourceStatus,
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
    repositoryClassification,
    governanceBoundaryPreview,
    warnings: buildWarnings(previewStatus),
    recommendedNextStage
  };
}

export function writeGovernanceRepoClassificationPreviewArtifacts(
  projectRoot: string,
  preview: GovernanceRepoClassificationPreview
): { jsonPath: string; markdownPath: string } {
  const jsonPath = path.join(projectRoot, ARTIFACT_JSON_PATH);
  const markdownPath = path.join(projectRoot, ARTIFACT_MARKDOWN_PATH);
  fs.ensureDirSync(path.dirname(jsonPath));
  fs.writeFileSync(jsonPath, `${JSON.stringify(preview, null, 2)}\n`, "utf8");
  fs.writeFileSync(markdownPath, renderGovernanceRepoClassificationPreviewText(preview), "utf8");
  return {
    jsonPath: ARTIFACT_JSON_PATH,
    markdownPath: ARTIFACT_MARKDOWN_PATH
  };
}

export function renderGovernanceRepoClassificationPreviewText(preview: GovernanceRepoClassificationPreview): string {
  const lines = [
    "# AI Software Factory - Governance Repo Classification Preview",
    "",
    "Preview status:",
    preview.previewStatus,
    "",
    "Source profile preview status:",
    preview.sourceProfilePreviewStatus,
    "",
    "Policy runtime mode:",
    preview.policyRuntimeMode,
    "",
    "Classification applied:",
    String(preview.classificationApplied),
    "",
    "Boundaries enforced:",
    String(preview.boundariesEnforced),
    "",
    "Profile applied:",
    String(preview.profileApplied),
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
    "Safe Patch Engine only:",
    String(preview.safePatchEngineOnly),
    "",
    "Recommended next stage:",
    preview.recommendedNextStage,
    "",
    "## Repository Classification",
    ""
  ];

  if (preview.repositoryClassification === null) {
    lines.push("- none");
  } else {
    lines.push(`- category: ${preview.repositoryClassification.category}`);
    lines.push(`- confidence: ${preview.repositoryClassification.confidence}`);
    lines.push(`- reason: ${preview.repositoryClassification.reason}`);
  }

  lines.push("", "## Signals", "");
  const signals = preview.repositoryClassification?.signals ?? [];
  if (signals.length === 0) {
    lines.push("- none");
  } else {
    for (const signal of signals) {
      lines.push(`- [${signal.matched ? "matched" : "not-matched"}] ${signal.key}: ${signal.reason}`);
    }
  }

  lines.push("", "## Governance Boundary Preview", "");
  if (preview.governanceBoundaryPreview === null) {
    lines.push("- none");
  } else {
    lines.push(`- recommended profile: ${preview.governanceBoundaryPreview.recommendedProfile ?? "none"}`);
    lines.push(`- allowed profiles: ${preview.governanceBoundaryPreview.allowedProfiles.join(", ") || "none"}`);
    lines.push(`- relevant policy categories: ${preview.governanceBoundaryPreview.relevantPolicyCategories.join(", ") || "none"}`);
  }

  lines.push("", "## Blocked Boundary Capabilities", "");
  const blocked = preview.governanceBoundaryPreview?.blockedBoundaryCapabilities ?? [];
  if (blocked.length === 0) {
    lines.push("- none");
  } else {
    for (const item of blocked) {
      lines.push(`- ${item.key}: ${item.reason}`);
    }
  }

  lines.push("", "## Warnings", "");
  for (const warning of preview.warnings) {
    lines.push(`- ${warning}`);
  }

  return `${lines.join("\n")}\n`;
}
