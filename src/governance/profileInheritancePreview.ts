import fs from "fs-extra";
import path from "node:path";

import {
  buildGovernancePolicyRuntimePreview,
  type GovernancePolicyRuntimePreview
} from "./policyRuntimePreview.js";

export type GovernanceProfilePreview = {
  name:
    | "default"
    | "strict"
    | "enterprise"
    | "experimental-preview";
  extends: string | null;
  description: string;
  profileApplied: false;
  previewOnly: true;
  candidateOverrides: Array<{
    key: string;
    candidateValue: unknown;
    reason: string;
  }>;
};

export type GovernanceResolvedProfilePreview = {
  name: string;
  inheritanceChain: string[];
  previewOnly: true;
  profileApplied: false;
  inheritedPolicyKeys: string[];
  resolvedCandidateOverrides: Array<{
    key: string;
    sourceProfile: string;
    candidateValue: unknown;
    reason: string;
  }>;
  conflicts: Array<{
    key: string;
    profiles: string[];
    resolution: "last-profile-wins-preview-only";
    reason: string;
  }>;
};

export type GovernanceBlockedProfileOption = {
  profile: string;
  key: string;
  reason: string;
};

export type GovernanceProfileInheritancePreview = {
  schemaVersion: 1;
  previewStatus: "not-created" | "created" | "blocked";
  sourcePolicyRuntimePreviewStatus: "not-created" | "created" | "blocked";
  policyRuntimeMode: "preview-only";
  profileApplied: false;
  applied: false;
  enforced: false;
  runtimeBehaviorChanged: false;
  governanceDecisionsChanged: false;
  repairOrchestrationChanged: false;
  profiles: GovernanceProfilePreview[];
  resolvedProfiles: GovernanceResolvedProfilePreview[];
  blockedProfileOptions: GovernanceBlockedProfileOption[];
  warnings: string[];
  recommendedNextStage:
    | "continue-preview-only"
    | "prepare-repo-classification"
    | "blocked";
};

const ARTIFACT_JSON_PATH = ".factory/governance/profile-inheritance-preview.json";
const ARTIFACT_MARKDOWN_PATH = ".factory/governance/profile-inheritance-preview.md";

type RuntimePolicy = NonNullable<GovernancePolicyRuntimePreview["policyModel"]>["policies"][number];

function stablePreviewValue(value: unknown, strictness: number): unknown {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Number((value - strictness).toFixed(4)));
  }
  return value;
}

function buildProfiles(policyKeys: RuntimePolicy[]): {
  profiles: GovernanceProfilePreview[];
  blockedProfileOptions: GovernanceBlockedProfileOption[];
} {
  const firstPolicy = policyKeys[0] ?? null;
  const secondPolicy = policyKeys[1] ?? null;
  const strictOverrides = firstPolicy === null
    ? []
    : [{
        key: firstPolicy.key,
        candidateValue: stablePreviewValue(firstPolicy.candidateValue, 1),
        reason: "Strict profile would make this governance policy candidate more conservative in preview."
      }];
  const enterpriseOverrides = [
    ...(firstPolicy === null
      ? []
      : [{
          key: firstPolicy.key,
          candidateValue: stablePreviewValue(firstPolicy.candidateValue, 2),
          reason: "Enterprise profile would make this inherited governance policy candidate audit-heavy in preview."
        }]),
    ...(secondPolicy === null
      ? []
      : [{
          key: secondPolicy.key,
          candidateValue: stablePreviewValue(secondPolicy.candidateValue, 1),
          reason: "Enterprise profile would add an audit-heavy preview override for this governance policy candidate."
        }])
  ];

  return {
    profiles: [
      {
        name: "default",
        extends: null,
        description: "Baseline preview profile with no aggressive overrides.",
        profileApplied: false,
        previewOnly: true,
        candidateOverrides: []
      },
      {
        name: "strict",
        extends: "default",
        description: "Preview profile for more conservative governance interpretation.",
        profileApplied: false,
        previewOnly: true,
        candidateOverrides: strictOverrides
      },
      {
        name: "enterprise",
        extends: "strict",
        description: "Preview profile for audit-heavy governance interpretation.",
        profileApplied: false,
        previewOnly: true,
        candidateOverrides: enterpriseOverrides
      },
      {
        name: "experimental-preview",
        extends: "default",
        description: "Preview-only exploratory profile that must not relax safety gates.",
        profileApplied: false,
        previewOnly: true,
        candidateOverrides: []
      }
    ],
    blockedProfileOptions: [
      {
        profile: "experimental-preview",
        key: "allowAutonomousActions",
        reason: "Profile option would allow autonomous actions and is blocked in preview."
      }
    ]
  };
}

function resolveChain(profile: GovernanceProfilePreview, profiles: GovernanceProfilePreview[]): string[] | null {
  const chain: string[] = [];
  const seen = new Set<string>();
  let current: GovernanceProfilePreview | undefined = profile;
  while (current !== undefined) {
    if (seen.has(current.name)) {
      return null;
    }
    seen.add(current.name);
    chain.unshift(current.name);
    current = current.extends === null
      ? undefined
      : profiles.find((candidate) => candidate.name === current?.extends);
    if (current === undefined && chain[0] !== "default" && profile.extends !== null) {
      return null;
    }
  }
  return chain;
}

function resolveProfile(
  profile: GovernanceProfilePreview,
  profiles: GovernanceProfilePreview[],
  inheritedPolicyKeys: string[]
): GovernanceResolvedProfilePreview | null {
  const chain = resolveChain(profile, profiles);
  if (chain === null) {
    return null;
  }
  const overrideSources = new Map<string, Array<{ profile: string; value: unknown; reason: string }>>();
  for (const profileName of chain) {
    const sourceProfile = profiles.find((candidate) => candidate.name === profileName);
    if (sourceProfile === undefined) {
      return null;
    }
    for (const override of sourceProfile.candidateOverrides) {
      const existing = overrideSources.get(override.key) ?? [];
      existing.push({
        profile: sourceProfile.name,
        value: override.candidateValue,
        reason: override.reason
      });
      overrideSources.set(override.key, existing);
    }
  }

  const resolvedCandidateOverrides = [...overrideSources.entries()]
    .map(([key, sources]) => {
      const selected = sources[sources.length - 1];
      return {
        key,
        sourceProfile: selected.profile,
        candidateValue: selected.value,
        reason: selected.reason
      };
    })
    .sort((a, b) => a.key.localeCompare(b.key));
  const conflicts = [...overrideSources.entries()]
    .filter(([, sources]) => sources.length > 1)
    .map(([key, sources]) => ({
      key,
      profiles: sources.map((source) => source.profile),
      resolution: "last-profile-wins-preview-only" as const,
      reason: "Multiple inherited profiles define this key; the child profile wins in preview only."
    }))
    .sort((a, b) => a.key.localeCompare(b.key));

  return {
    name: profile.name,
    inheritanceChain: chain,
    previewOnly: true,
    profileApplied: false,
    inheritedPolicyKeys,
    resolvedCandidateOverrides,
    conflicts
  };
}

function buildWarnings(previewStatus: GovernanceProfileInheritancePreview["previewStatus"]): string[] {
  const warnings: string[] = [];
  if (previewStatus === "not-created") {
    warnings.push("Policy runtime preview is not created; profile inheritance preview was not created.");
  } else if (previewStatus === "blocked") {
    warnings.push("Policy runtime preview is blocked; profile inheritance preview was blocked.");
  } else {
    warnings.push("Governance profile inheritance was resolved in preview-only mode.");
  }
  warnings.push("Profiles were not applied.");
  warnings.push("Policies were not enforced.");
  warnings.push("Runtime behavior did not change.");
  warnings.push("Governance decisions did not change.");
  warnings.push("Repair orchestration did not change.");
  return warnings;
}

export function buildGovernanceProfileInheritancePreview(projectRoot: string): GovernanceProfileInheritancePreview {
  const policyRuntimePreview = buildGovernancePolicyRuntimePreview(projectRoot);
  const sourceStatus = policyRuntimePreview.previewStatus;
  const sourceCreated = sourceStatus === "created" && policyRuntimePreview.policyModel !== null && policyRuntimePreview.policyRuntimeMode === "preview-only";
  const previewStatus: GovernanceProfileInheritancePreview["previewStatus"] =
    sourceStatus === "blocked"
      ? "blocked"
      : sourceCreated
        ? "created"
        : "not-created";
  const runtimePolicies = sourceCreated ? [...policyRuntimePreview.policyModel?.policies ?? []].sort((a, b) => a.key.localeCompare(b.key)) : [];
  const { profiles, blockedProfileOptions } = sourceCreated
    ? buildProfiles(runtimePolicies)
    : { profiles: [], blockedProfileOptions: [] };
  const inheritedPolicyKeys = runtimePolicies.map((policy) => policy.key).sort();
  const resolvedProfiles = sourceCreated
    ? profiles
        .map((profile) => resolveProfile(profile, profiles, inheritedPolicyKeys))
        .filter((profile): profile is GovernanceResolvedProfilePreview => profile !== null)
    : [];
  const recommendedNextStage: GovernanceProfileInheritancePreview["recommendedNextStage"] =
    previewStatus === "blocked"
      ? "blocked"
      : previewStatus === "created"
        ? "prepare-repo-classification"
        : "continue-preview-only";

  return {
    schemaVersion: 1,
    previewStatus,
    sourcePolicyRuntimePreviewStatus: sourceStatus,
    policyRuntimeMode: "preview-only",
    profileApplied: false,
    applied: false,
    enforced: false,
    runtimeBehaviorChanged: false,
    governanceDecisionsChanged: false,
    repairOrchestrationChanged: false,
    profiles,
    resolvedProfiles,
    blockedProfileOptions,
    warnings: buildWarnings(previewStatus),
    recommendedNextStage
  };
}

export function writeGovernanceProfileInheritancePreviewArtifacts(
  projectRoot: string,
  preview: GovernanceProfileInheritancePreview
): { jsonPath: string; markdownPath: string } {
  const jsonPath = path.join(projectRoot, ARTIFACT_JSON_PATH);
  const markdownPath = path.join(projectRoot, ARTIFACT_MARKDOWN_PATH);
  fs.ensureDirSync(path.dirname(jsonPath));
  fs.writeFileSync(jsonPath, `${JSON.stringify(preview, null, 2)}\n`, "utf8");
  fs.writeFileSync(markdownPath, renderGovernanceProfileInheritancePreviewText(preview), "utf8");
  return {
    jsonPath: ARTIFACT_JSON_PATH,
    markdownPath: ARTIFACT_MARKDOWN_PATH
  };
}

export function renderGovernanceProfileInheritancePreviewText(preview: GovernanceProfileInheritancePreview): string {
  const lines = [
    "# AI Software Factory - Governance Profile Inheritance Preview",
    "",
    "Preview status:",
    preview.previewStatus,
    "",
    "Source policy runtime preview status:",
    preview.sourcePolicyRuntimePreviewStatus,
    "",
    "Policy runtime mode:",
    preview.policyRuntimeMode,
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
    "Recommended next stage:",
    preview.recommendedNextStage,
    "",
    "## Profiles",
    ""
  ];

  if (preview.profiles.length === 0) {
    lines.push("- none");
  } else {
    for (const profile of preview.profiles) {
      lines.push(`- ${profile.name} extends ${profile.extends ?? "none"} - ${profile.description}`);
    }
  }

  lines.push("", "## Resolved Profiles", "");
  if (preview.resolvedProfiles.length === 0) {
    lines.push("- none");
  } else {
    for (const profile of preview.resolvedProfiles) {
      lines.push(`- ${profile.name}: ${profile.inheritanceChain.join(" -> ")}`);
      lines.push(`  inherited policy keys: ${profile.inheritedPolicyKeys.length === 0 ? "none" : profile.inheritedPolicyKeys.join(", ")}`);
      lines.push(`  resolved overrides: ${profile.resolvedCandidateOverrides.length}`);
      lines.push(`  conflicts: ${profile.conflicts.length}`);
    }
  }

  lines.push("", "## Blocked Profile Options", "");
  if (preview.blockedProfileOptions.length === 0) {
    lines.push("- none");
  } else {
    for (const blocked of preview.blockedProfileOptions) {
      lines.push(`- ${blocked.profile}.${blocked.key}: ${blocked.reason}`);
    }
  }

  lines.push("", "## Conflicts", "");
  const conflicts = preview.resolvedProfiles.flatMap((profile) => profile.conflicts.map((conflict) => ({ profile: profile.name, ...conflict })));
  if (conflicts.length === 0) {
    lines.push("- none");
  } else {
    for (const conflict of conflicts) {
      lines.push(`- ${conflict.profile}.${conflict.key}: ${conflict.profiles.join(" -> ")} (${conflict.resolution})`);
    }
  }

  lines.push("", "## Warnings", "");
  for (const warning of preview.warnings) {
    lines.push(`- ${warning}`);
  }

  return `${lines.join("\n")}\n`;
}
