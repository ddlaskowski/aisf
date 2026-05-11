import fs from "fs-extra";
import path from "node:path";

export type GovernanceConfigValidationStatus = "valid" | "invalid" | "missing";

export type GovernanceConfigValidationIssue = {
  severity: "error" | "warning" | "info";
  code: string;
  message: string;
  path?: string;
};

export type GovernanceConfigValidationResult = {
  version: 1;
  status: GovernanceConfigValidationStatus;
  configPath: string;
  issues: GovernanceConfigValidationIssue[];
  summary: string;
  applied: false;
  generatedAt: string;
};

const CONFIG_PATH = ".factory/governance.config.json";
const GENERATED_AT = "1970-01-01T00:00:00.000Z";
const VALID_PROFILE_NAMES = ["conservative", "balanced", "experimental"] as const;
const REQUIRED_ROOT_FIELDS = [
  "version",
  "configStatus",
  "defaultPolicyProfile",
  "policyProfiles",
  "commandPolicies",
  "futureRuntimeOptions",
  "notes"
] as const;
const REQUIRED_COMMAND_POLICIES = ["readOnlyCommands", "exportWritingCommands", "indexUpdatingCommands"] as const;
const REQUIRED_RUNTIME_OPTIONS = [
  "allowRuntimeConfigLoading",
  "allowPolicyOverride",
  "allowAutomaticEnforcement",
  "allowNotifications"
] as const;

const ISSUE_MESSAGES = {
  CONFIG_MISSING: "No governance config file was found.",
  CONFIG_MALFORMED_JSON: "Governance config file contains malformed JSON.",
  CONFIG_VALID: "Governance config file is valid but not applied.",
  MISSING_REQUIRED_FIELD: "Governance config is missing a required field.",
  INVALID_VERSION: "Governance config version must be 1.",
  INVALID_CONFIG_STATUS: "Governance config status must be example-only or draft.",
  INVALID_POLICY_PROFILE: "Governance policy profile name is invalid.",
  INVALID_THRESHOLD_VALUE: "Governance threshold value must be a finite number.",
  INVALID_COMMAND_POLICY: "Governance command policy must be an array.",
  UNSAFE_RUNTIME_OPTION_ENABLED: "Runtime governance option must remain disabled in v5.4."
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function issue(
  severity: GovernanceConfigValidationIssue["severity"],
  code: keyof typeof ISSUE_MESSAGES,
  issuePath?: string
): GovernanceConfigValidationIssue {
  return {
    severity,
    code,
    message: ISSUE_MESSAGES[code],
    ...(issuePath === undefined ? {} : { path: issuePath })
  };
}

function buildResult(
  status: GovernanceConfigValidationStatus,
  issues: GovernanceConfigValidationIssue[]
): GovernanceConfigValidationResult {
  const summary =
    status === "missing"
      ? "No governance config file was found."
      : status === "valid"
        ? "Governance config is valid but not applied."
        : "Governance config is invalid and was not applied.";

  return {
    version: 1,
    status,
    configPath: CONFIG_PATH,
    issues,
    summary,
    applied: false,
    generatedAt: GENERATED_AT
  };
}

export function validateGovernanceConfig(projectRoot: string): GovernanceConfigValidationResult {
  const configPath = path.join(projectRoot, CONFIG_PATH);
  if (!fs.existsSync(configPath)) {
    return buildResult("missing", [issue("info", "CONFIG_MISSING")]);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(fs.readFileSync(configPath, "utf8"));
  } catch {
    return buildResult("invalid", [issue("error", "CONFIG_MALFORMED_JSON", CONFIG_PATH)]);
  }

  return validateGovernanceConfigObject(parsed);
}

export function validateGovernanceConfigObject(config: unknown): GovernanceConfigValidationResult {
  const issues: GovernanceConfigValidationIssue[] = [];

  if (!isRecord(config)) {
    for (const field of REQUIRED_ROOT_FIELDS) {
      issues.push(issue("error", "MISSING_REQUIRED_FIELD", field));
    }
    return buildResult("invalid", issues);
  }

  for (const field of REQUIRED_ROOT_FIELDS) {
    if (!(field in config)) {
      issues.push(issue("error", "MISSING_REQUIRED_FIELD", field));
    }
  }

  if ("version" in config && config.version !== 1) {
    issues.push(issue("error", "INVALID_VERSION", "version"));
  }

  if ("configStatus" in config && config.configStatus !== "example-only" && config.configStatus !== "draft") {
    issues.push(issue("error", "INVALID_CONFIG_STATUS", "configStatus"));
  }

  if (
    "defaultPolicyProfile" in config &&
    !VALID_PROFILE_NAMES.includes(config.defaultPolicyProfile as (typeof VALID_PROFILE_NAMES)[number])
  ) {
    issues.push(issue("error", "INVALID_POLICY_PROFILE", "defaultPolicyProfile"));
  }

  if ("policyProfiles" in config) {
    validatePolicyProfiles(config.policyProfiles, issues);
  }
  if ("commandPolicies" in config) {
    validateCommandPolicies(config.commandPolicies, issues);
  }
  if ("futureRuntimeOptions" in config) {
    validateRuntimeOptions(config.futureRuntimeOptions, issues);
  }

  if (issues.length > 0) {
    return buildResult("invalid", issues);
  }

  return buildResult("valid", [issue("info", "CONFIG_VALID")]);
}

function validatePolicyProfiles(value: unknown, issues: GovernanceConfigValidationIssue[]): void {
  if (!isRecord(value)) {
    issues.push(issue("error", "MISSING_REQUIRED_FIELD", "policyProfiles"));
    return;
  }

  for (const profileName of Object.keys(value).sort()) {
    if (!VALID_PROFILE_NAMES.includes(profileName as (typeof VALID_PROFILE_NAMES)[number])) {
      issues.push(issue("error", "INVALID_POLICY_PROFILE", `policyProfiles.${profileName}`));
    }
  }

  for (const profileName of VALID_PROFILE_NAMES) {
    const profilePath = `policyProfiles.${profileName}`;
    const profile = value[profileName];
    if (!isRecord(profile)) {
      issues.push(issue("error", "MISSING_REQUIRED_FIELD", profilePath));
      continue;
    }

    if (typeof profile.enabled !== "boolean") {
      issues.push(issue("error", "MISSING_REQUIRED_FIELD", `${profilePath}.enabled`));
    }
    if (typeof profile.description !== "string") {
      issues.push(issue("error", "MISSING_REQUIRED_FIELD", `${profilePath}.description`));
    }
    if (!isRecord(profile.thresholds)) {
      issues.push(issue("error", "MISSING_REQUIRED_FIELD", `${profilePath}.thresholds`));
      continue;
    }

    for (const thresholdName of Object.keys(profile.thresholds).sort()) {
      const threshold = profile.thresholds[thresholdName];
      if (typeof threshold !== "number" || !Number.isFinite(threshold)) {
        issues.push(issue("error", "INVALID_THRESHOLD_VALUE", `${profilePath}.thresholds.${thresholdName}`));
      }
    }
  }
}

function validateCommandPolicies(value: unknown, issues: GovernanceConfigValidationIssue[]): void {
  if (!isRecord(value)) {
    issues.push(issue("error", "MISSING_REQUIRED_FIELD", "commandPolicies"));
    return;
  }

  for (const policyName of REQUIRED_COMMAND_POLICIES) {
    const policyPath = `commandPolicies.${policyName}`;
    if (!Array.isArray(value[policyName])) {
      issues.push(issue("error", "INVALID_COMMAND_POLICY", policyPath));
    }
  }
}

function validateRuntimeOptions(value: unknown, issues: GovernanceConfigValidationIssue[]): void {
  if (!isRecord(value)) {
    issues.push(issue("error", "MISSING_REQUIRED_FIELD", "futureRuntimeOptions"));
    return;
  }

  for (const optionName of REQUIRED_RUNTIME_OPTIONS) {
    const optionPath = `futureRuntimeOptions.${optionName}`;
    const optionValue = value[optionName];
    if (typeof optionValue !== "boolean") {
      issues.push(issue("error", "MISSING_REQUIRED_FIELD", optionPath));
      continue;
    }
    if (optionValue === true) {
      issues.push(issue("error", "UNSAFE_RUNTIME_OPTION_ENABLED", optionPath));
    }
  }
}

export function renderGovernanceConfigValidationMarkdown(result: GovernanceConfigValidationResult): string {
  const lines = [
    "# AI Software Factory - Governance Config Validation",
    "",
    "Config path:",
    result.configPath,
    "",
    "Status:",
    result.status,
    "",
    "Applied:",
    String(result.applied),
    "",
    "Summary:",
    result.summary,
    "",
    "## Issues",
    ""
  ];

  for (const validationIssue of result.issues) {
    const location = validationIssue.path === undefined ? "" : ` at ${validationIssue.path}`;
    lines.push(`- [${validationIssue.severity}] ${validationIssue.code}${location} - ${validationIssue.message}`);
  }

  return `${lines.join("\n")}\n`;
}

export function renderGovernanceConfigValidationText(result: GovernanceConfigValidationResult): string {
  return renderGovernanceConfigValidationMarkdown(result);
}
