import fs from "fs-extra";
import path from "node:path";

import { buildGovernanceConfigPreview } from "./governanceConfigPreview.js";
import { validateGovernanceConfig, type GovernanceConfigValidationIssue } from "./governanceConfigValidator.js";

export type GovernanceConfigEffectiveSource =
  | "static-defaults"
  | "static-defaults-with-valid-config-present"
  | "static-defaults-with-invalid-config-present"
  | "static-defaults-config-missing";

export type GovernanceConfigEffectivePreview = {
  version: 1;
  configPath: string;
  configStatus: "missing" | "valid" | "invalid";
  effectiveSource: GovernanceConfigEffectiveSource;
  applied: false;
  runtimeConfigLoadingEnabled: false;
  activeDefaults: {
    defaultPolicyProfile: string;
    policyProfiles: Array<{
      name: string;
      operatorMode: string;
      riskTolerance: string;
      thresholds: Record<string, number>;
    }>;
  };
  candidateOverrides: Array<{
    path: string;
    staticValue: string | number | boolean | null;
    configValue: string | number | boolean | null;
    wouldOverride: boolean;
    applied: false;
  }>;
  validationIssues: GovernanceConfigValidationIssue[];
  notes: string[];
  summary: string;
  generatedAt: string;
};

const CONFIG_PATH = ".factory/governance.config.json";
const GENERATED_AT = "1970-01-01T00:00:00.000Z";
const PROFILE_NAMES = ["conservative", "balanced", "experimental"] as const;
const RUNTIME_OPTIONS = [
  "allowRuntimeConfigLoading",
  "allowPolicyOverride",
  "allowAutomaticEnforcement",
  "allowNotifications"
] as const;

type ComparableValue = string | number | boolean | null;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toComparable(value: unknown): ComparableValue {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  return null;
}

function pushOverride(
  overrides: GovernanceConfigEffectivePreview["candidateOverrides"],
  overridePath: string,
  staticValue: ComparableValue,
  configValue: ComparableValue
): void {
  if (staticValue === configValue) {
    return;
  }
  overrides.push({
    path: overridePath,
    staticValue,
    configValue,
    wouldOverride: true,
    applied: false
  });
}

function readValidConfig(projectRoot: string): Record<string, unknown> | null {
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

function buildCandidateOverrides(projectRoot: string): GovernanceConfigEffectivePreview["candidateOverrides"] {
  const config = readValidConfig(projectRoot);
  if (config === null) {
    return [];
  }

  const preview = buildGovernanceConfigPreview();
  const overrides: GovernanceConfigEffectivePreview["candidateOverrides"] = [];
  pushOverride(overrides, "defaultPolicyProfile", preview.defaultPolicyProfile, toComparable(config.defaultPolicyProfile));

  const policyProfiles = isRecord(config.policyProfiles) ? config.policyProfiles : {};
  for (const profileName of PROFILE_NAMES) {
    const staticProfile = preview.availablePolicyProfiles.find((profile) => profile.name === profileName);
    const configProfile = isRecord(policyProfiles[profileName]) ? policyProfiles[profileName] : {};
    const configThresholds = isRecord(configProfile.thresholds) ? configProfile.thresholds : {};
    const thresholdNames = Object.keys(staticProfile?.thresholds ?? {}).sort();
    for (const thresholdName of thresholdNames) {
      pushOverride(
        overrides,
        `policyProfiles.${profileName}.thresholds.${thresholdName}`,
        staticProfile?.thresholds[thresholdName] ?? null,
        toComparable(configThresholds[thresholdName])
      );
    }
  }

  const runtimeOptions = isRecord(config.futureRuntimeOptions) ? config.futureRuntimeOptions : {};
  for (const optionName of RUNTIME_OPTIONS) {
    pushOverride(overrides, `futureRuntimeOptions.${optionName}`, false, toComparable(runtimeOptions[optionName]));
  }

  return overrides.sort((a, b) => a.path.localeCompare(b.path));
}

export function buildGovernanceConfigEffectivePreview(projectRoot: string): GovernanceConfigEffectivePreview {
  const validation = validateGovernanceConfig(projectRoot);
  const staticPreview = buildGovernanceConfigPreview();
  const configStatus = validation.status;
  const effectiveSource: GovernanceConfigEffectiveSource =
    configStatus === "missing"
      ? "static-defaults-config-missing"
      : configStatus === "valid"
        ? "static-defaults-with-valid-config-present"
        : "static-defaults-with-invalid-config-present";
  const summary =
    configStatus === "missing"
      ? "Static governance defaults are active. No governance config file was found."
      : configStatus === "valid"
        ? "Static governance defaults are active. A valid governance config file is present but not applied."
        : "Static governance defaults are active. Governance config file is invalid and not applied.";
  const notes = [
    "Runtime governance config loading is disabled in v5.5.",
    "Config values are previewed only and are not applied.",
    "Static governance defaults remain the active source of truth."
  ];
  if (configStatus === "valid") {
    notes.push("A valid config file was found, but runtime application is disabled.");
  } else if (configStatus === "invalid") {
    notes.push("Invalid config values must be fixed before future runtime loading can be enabled.");
  } else {
    notes.push("No config file is required for current static governance behavior.");
  }

  return {
    version: 1,
    configPath: CONFIG_PATH,
    configStatus,
    effectiveSource,
    applied: false,
    runtimeConfigLoadingEnabled: false,
    activeDefaults: {
      defaultPolicyProfile: staticPreview.defaultPolicyProfile,
      policyProfiles: staticPreview.availablePolicyProfiles.map((profile) => ({
        name: profile.name,
        operatorMode: profile.operatorMode,
        riskTolerance: profile.riskTolerance,
        thresholds: { ...profile.thresholds }
      }))
    },
    candidateOverrides: configStatus === "valid" ? buildCandidateOverrides(projectRoot) : [],
    validationIssues: validation.issues,
    notes,
    summary,
    generatedAt: GENERATED_AT
  };
}

export function renderGovernanceConfigEffectivePreviewMarkdown(preview: GovernanceConfigEffectivePreview): string {
  const lines = [
    "# AI Software Factory - Governance Effective Config Preview",
    "",
    "Config path:",
    preview.configPath,
    "",
    "Config status:",
    preview.configStatus,
    "",
    "Effective source:",
    preview.effectiveSource,
    "",
    "Applied:",
    String(preview.applied),
    "",
    "Runtime config loading enabled:",
    String(preview.runtimeConfigLoadingEnabled),
    "",
    "Summary:",
    preview.summary,
    "",
    "## Active Defaults",
    "",
    "Default policy profile:",
    preview.activeDefaults.defaultPolicyProfile,
    "",
    "## Candidate Overrides",
    ""
  ];

  if (preview.candidateOverrides.length === 0) {
    lines.push("- none");
  } else {
    lines.push("| Path | Static Value | Config Value | Would Override | Applied |");
    lines.push("|---|---|---|---|---|");
    for (const override of preview.candidateOverrides) {
      lines.push(`| ${override.path} | ${override.staticValue} | ${override.configValue} | ${override.wouldOverride} | ${override.applied} |`);
    }
  }

  lines.push("", "## Validation Issues", "");
  for (const validationIssue of preview.validationIssues) {
    const location = validationIssue.path === undefined ? "" : ` at ${validationIssue.path}`;
    lines.push(`- [${validationIssue.severity}] ${validationIssue.code}${location} - ${validationIssue.message}`);
  }

  lines.push("", "## Notes", "");
  for (const note of preview.notes) {
    lines.push(`- ${note}`);
  }

  return `${lines.join("\n")}\n`;
}

export function renderGovernanceConfigEffectivePreviewText(preview: GovernanceConfigEffectivePreview): string {
  return renderGovernanceConfigEffectivePreviewMarkdown(preview);
}
