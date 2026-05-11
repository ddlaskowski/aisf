import fs from "fs-extra";
import path from "node:path";

import {
  buildGovernanceConfigEffectivePreview,
  type GovernanceConfigEffectivePreview
} from "../repair/governanceConfigEffectivePreview.js";

export type GovernanceConfigActivationReadiness =
  | "not-ready"
  | "ready-for-preview"
  | "ready-for-guarded-loading"
  | "blocked";

export type GovernanceConfigActivationRecommendedNextStage =
  | "fix-config"
  | "continue-preview-only"
  | "prepare-guarded-loading"
  | "blocked";

export type GovernanceConfigActivationPlan = {
  schemaVersion: 1;
  configStatus: "missing" | "valid" | "invalid";
  activationReadiness: GovernanceConfigActivationReadiness;
  runtimeConfigLoadingEnabled: false;
  applied: false;
  candidateOverrides: Array<{
    key: string;
    currentDefault: unknown;
    candidateValue: unknown;
    safeForFutureActivation: boolean;
    reason: string;
  }>;
  blockedOptions: Array<{
    key: string;
    reason: string;
  }>;
  requiredSafetyChecks: string[];
  warnings: string[];
  recommendedNextStage: GovernanceConfigActivationRecommendedNextStage;
};

const CONFIG_PATH = ".factory/governance.config.json";
const ARTIFACT_JSON_PATH = ".factory/governance/config-activation-plan.json";
const ARTIFACT_MARKDOWN_PATH = ".factory/governance/config-activation-plan.md";
const SAFE_ROOT_FIELDS = new Set([
  "version",
  "configStatus",
  "defaultPolicyProfile",
  "policyProfiles",
  "commandPolicies",
  "futureRuntimeOptions",
  "notes"
]);
const SAFE_PROFILE_FIELDS = new Set(["enabled", "description", "thresholds"]);
const SAFE_COMMAND_POLICY_FIELDS = new Set(["readOnlyCommands", "exportWritingCommands", "indexUpdatingCommands"]);
const SAFE_RUNTIME_OPTION_FIELDS = new Set([
  "allowRuntimeConfigLoading",
  "allowPolicyOverride",
  "allowAutomaticEnforcement",
  "allowNotifications"
]);
const UNSAFE_KEY_PATTERNS = [
  "plugin",
  "dynamic",
  "script",
  "eval",
  "command",
  "url",
  "mutation",
  "bypass",
  "runtimeexecution",
  "execution",
  "repairpipeline",
  "repair",
  "safetygate",
  "orchestration"
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readConfig(projectRoot: string): Record<string, unknown> | null {
  const configPath = path.join(projectRoot, CONFIG_PATH);
  if (!fs.existsSync(configPath)) {
    return null;
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(configPath, "utf8"));
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function containsUnsafeToken(key: string): boolean {
  const normalized = key.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  return UNSAFE_KEY_PATTERNS.some((pattern) => normalized.includes(pattern));
}

function blockedReason(key: string): string {
  if (containsUnsafeToken(key)) {
    return "Unsafe runtime, command, plugin, mutation, or safety-bypass option is not allowed for activation.";
  }
  return "Unknown governance config option is not allowlisted for future activation.";
}

function addBlocked(blocked: GovernanceConfigActivationPlan["blockedOptions"], key: string): void {
  blocked.push({
    key,
    reason: blockedReason(key)
  });
}

function collectBlockedOptionsFromConfig(config: Record<string, unknown> | null): GovernanceConfigActivationPlan["blockedOptions"] {
  if (config === null) {
    return [];
  }
  const blocked: GovernanceConfigActivationPlan["blockedOptions"] = [];

  for (const key of Object.keys(config).sort()) {
    if (!SAFE_ROOT_FIELDS.has(key)) {
      addBlocked(blocked, key);
    }
  }

  const profiles = isRecord(config.policyProfiles) ? config.policyProfiles : {};
  for (const profileName of Object.keys(profiles).sort()) {
    const profile = profiles[profileName];
    if (!isRecord(profile)) {
      continue;
    }
    for (const key of Object.keys(profile).sort()) {
      if (!SAFE_PROFILE_FIELDS.has(key)) {
        addBlocked(blocked, `policyProfiles.${profileName}.${key}`);
      }
    }
  }

  const commandPolicies = isRecord(config.commandPolicies) ? config.commandPolicies : {};
  for (const key of Object.keys(commandPolicies).sort()) {
    if (!SAFE_COMMAND_POLICY_FIELDS.has(key)) {
      addBlocked(blocked, `commandPolicies.${key}`);
    }
  }

  const runtimeOptions = isRecord(config.futureRuntimeOptions) ? config.futureRuntimeOptions : {};
  for (const key of Object.keys(runtimeOptions).sort()) {
    if (!SAFE_RUNTIME_OPTION_FIELDS.has(key)) {
      addBlocked(blocked, `futureRuntimeOptions.${key}`);
    }
  }

  return blocked.sort((a, b) => a.key.localeCompare(b.key));
}

function buildCandidateOverrides(
  effectivePreview: GovernanceConfigEffectivePreview
): GovernanceConfigActivationPlan["candidateOverrides"] {
  return effectivePreview.candidateOverrides.map((override) => ({
    key: override.path,
    currentDefault: override.staticValue,
    candidateValue: override.configValue,
    safeForFutureActivation: true,
    reason: "Allowlisted governance config value differs from static default and may be considered for future guarded loading."
  }));
}

function requiredSafetyChecks(): string[] {
  return [
    "Config validation status must be valid.",
    "Runtime config loading must remain disabled until guarded loading is implemented.",
    "All candidate overrides must be allowlisted governance fields.",
    "No unsafe runtime, plugin, command, dynamic code, mutation, or safety-bypass options may be present.",
    "Activation must preserve repair orchestration and governance decision behavior until explicitly implemented."
  ];
}

function buildWarnings(
  effectivePreview: GovernanceConfigEffectivePreview,
  blockedOptions: GovernanceConfigActivationPlan["blockedOptions"]
): string[] {
  const warnings: string[] = [];
  if (effectivePreview.configStatus === "missing") {
    warnings.push("No governance config file was found.");
  }
  if (effectivePreview.configStatus === "invalid") {
    warnings.push("Governance config is invalid and cannot be considered for activation.");
  }
  if (blockedOptions.length > 0) {
    warnings.push("Unsafe or unknown config options block future activation.");
  }
  warnings.push("Runtime governance config loading is disabled.");
  warnings.push("Governance config values are not applied.");
  return warnings;
}

export function buildGovernanceConfigActivationPlan(projectRoot: string): GovernanceConfigActivationPlan {
  const effectivePreview = buildGovernanceConfigEffectivePreview(projectRoot);
  const config = effectivePreview.configStatus === "valid" ? readConfig(projectRoot) : null;
  const blockedOptions = collectBlockedOptionsFromConfig(config);
  const candidateOverrides =
    effectivePreview.configStatus === "valid" && blockedOptions.length === 0
      ? buildCandidateOverrides(effectivePreview)
      : [];

  const activationReadiness: GovernanceConfigActivationReadiness =
    effectivePreview.configStatus === "missing"
      ? "not-ready"
      : effectivePreview.configStatus === "invalid"
        ? "blocked"
        : blockedOptions.length > 0
          ? "blocked"
          : "ready-for-guarded-loading";
  const recommendedNextStage: GovernanceConfigActivationRecommendedNextStage =
    effectivePreview.configStatus === "missing"
      ? "continue-preview-only"
      : effectivePreview.configStatus === "invalid"
        ? "fix-config"
        : blockedOptions.length > 0
          ? "blocked"
          : "prepare-guarded-loading";

  return {
    schemaVersion: 1,
    configStatus: effectivePreview.configStatus,
    activationReadiness,
    runtimeConfigLoadingEnabled: false,
    applied: false,
    candidateOverrides,
    blockedOptions,
    requiredSafetyChecks: requiredSafetyChecks(),
    warnings: buildWarnings(effectivePreview, blockedOptions),
    recommendedNextStage
  };
}

export function writeGovernanceConfigActivationPlanArtifacts(
  projectRoot: string,
  plan: GovernanceConfigActivationPlan
): { jsonPath: string; markdownPath: string } {
  const jsonPath = path.join(projectRoot, ARTIFACT_JSON_PATH);
  const markdownPath = path.join(projectRoot, ARTIFACT_MARKDOWN_PATH);
  fs.ensureDirSync(path.dirname(jsonPath));
  fs.writeFileSync(jsonPath, `${JSON.stringify(plan, null, 2)}\n`, "utf8");
  fs.writeFileSync(markdownPath, renderGovernanceConfigActivationPlanText(plan), "utf8");
  return {
    jsonPath: ARTIFACT_JSON_PATH,
    markdownPath: ARTIFACT_MARKDOWN_PATH
  };
}

export function renderGovernanceConfigActivationPlanText(plan: GovernanceConfigActivationPlan): string {
  const lines = [
    "# AI Software Factory - Governance Config Activation Plan",
    "",
    "Config status:",
    plan.configStatus,
    "",
    "Activation readiness:",
    plan.activationReadiness,
    "",
    "Runtime config loading enabled:",
    String(plan.runtimeConfigLoadingEnabled),
    "",
    "Applied:",
    String(plan.applied),
    "",
    "Recommended next stage:",
    plan.recommendedNextStage,
    "",
    "## Candidate Overrides",
    ""
  ];

  if (plan.candidateOverrides.length === 0) {
    lines.push("- none");
  } else {
    lines.push("| Key | Current Default | Candidate Value | Safe | Reason |");
    lines.push("|---|---|---|---|---|");
    for (const override of plan.candidateOverrides) {
      lines.push(`| ${override.key} | ${String(override.currentDefault)} | ${String(override.candidateValue)} | ${override.safeForFutureActivation} | ${override.reason} |`);
    }
  }

  lines.push("", "## Blocked Options", "");
  if (plan.blockedOptions.length === 0) {
    lines.push("- none");
  } else {
    for (const blocked of plan.blockedOptions) {
      lines.push(`- ${blocked.key}: ${blocked.reason}`);
    }
  }

  lines.push("", "## Required Safety Checks", "");
  for (const check of plan.requiredSafetyChecks) {
    lines.push(`- ${check}`);
  }

  lines.push("", "## Warnings", "");
  for (const warning of plan.warnings) {
    lines.push(`- ${warning}`);
  }

  return `${lines.join("\n")}\n`;
}
