import type { GovernanceMetadata } from "./governanceMetadata.js";
import { normalizeWarnings, sortDeterministically } from "./utils/governanceUtils.js";

export type ControlledProjectGenerationInputGroup =
  | "projectIntent"
  | "projectType"
  | "targetStack"
  | "runtimeEnvironment"
  | "filePlanPreferences"
  | "dependencyPreferences"
  | "validationPreferences"
  | "approvalPreferences"
  | "riskPreferences"
  | "rollbackPreferences"
  | "humanInstructions"
  | "governanceContext";

export type ControlledProjectGenerationInputStatus =
  | "defined"
  | "optional"
  | "required"
  | "blocked"
  | "preview-only";

export type ControlledProjectGenerationInputValidationPolicy =
  | "structural-preview-only"
  | "manual-review-required"
  | "blocked"
  | "not-applicable";

export type ControlledProjectGenerationInputRiskLevel =
  | "low"
  | "medium"
  | "high"
  | "critical";

export type ControlledProjectGenerationInputCompletenessLevel =
  | "incomplete"
  | "partial"
  | "contract-defined"
  | "ready-for-design";

export type ControlledProjectGenerationInputCompleteness = {
  score: number;
  level: ControlledProjectGenerationInputCompletenessLevel;
  reason: string;
};

export type ControlledProjectGenerationInputField = {
  fieldId: string;
  group: ControlledProjectGenerationInputGroup;
  label: string;
  description: string;
  required: boolean;
  status: ControlledProjectGenerationInputStatus;
  riskLevel: ControlledProjectGenerationInputRiskLevel;
  allowedValues: string[];
  defaultValue: string | null;
  validationPolicy: ControlledProjectGenerationInputValidationPolicy;
  blockedReason: string | null;
  warnings: string[];
  recommendations: string[];
  readonly: boolean;
  previewOnly: boolean;
};

export type ControlledProjectGenerationInputContractSummary = {
  totalFields: number;
  requiredFieldCount: number;
  optionalFieldCount: number;
  blockedFieldCount: number;
  groupDistribution: { key: ControlledProjectGenerationInputGroup; totalFields: number }[];
  requirementDistribution: { key: "required" | "optional"; totalFields: number }[];
  riskDistribution: { key: ControlledProjectGenerationInputRiskLevel; totalFields: number }[];
  validationPolicyDistribution: { key: ControlledProjectGenerationInputValidationPolicy; totalFields: number }[];
  readonly: boolean;
  previewOnly: boolean;
  warnings: string[];
  recommendations: string[];
  completeness: ControlledProjectGenerationInputCompleteness;
};

export type ControlledProjectGenerationInputContract = {
  schemaVersion: 1;
  title: string;
  metadata: GovernanceMetadata;
  readonly: true;
  previewOnly: true;
  inputContractOnly: true;
  stdoutOnly: true;
  liveInputValidationAllowed: false;
  inputExecutionAllowed: false;
  generationRuntimeImplemented: false;
  generationExecutionAllowed: false;
  bundleExecutionAllowed: false;
  rollbackExecutionAllowed: false;
  recoveryExecutionAllowed: false;
  riskEnforcementAllowed: false;
  mitigationEnforcementEnabled: false;
  approvalExecutionAllowed: false;
  approvalDecisionApplied: false;
  projectGenerationApproved: false;
  validationExecutionAllowed: false;
  generatedProjectValidationAllowed: false;
  commandExecutionAllowed: false;
  dependencyInstallationAllowed: false;
  packageMutationAllowed: false;
  fileWriteAllowed: false;
  fileCreationAllowed: false;
  scaffoldGenerationEnabled: false;
  runtimeRoutingEnabled: false;
  runtimeActivationEnabled: false;
  policyEnforcementEnabled: false;
  projectGenerationEnabled: false;
  builderAgentRuntimeEnabled: false;
  fields: ControlledProjectGenerationInputField[];
  summary: ControlledProjectGenerationInputContractSummary;
};

export function createControlledProjectGenerationInputContract(input: {
  title: string;
  metadata: GovernanceMetadata;
  fields?: readonly ControlledProjectGenerationInputField[];
}): ControlledProjectGenerationInputContract {
  const fields = sortInputContractFields(input.fields ?? createDefaultInputContractFields());
  return {
    schemaVersion: 1,
    title: input.title,
    metadata: {
      version: input.metadata.version,
      generatedAt: input.metadata.generatedAt,
      source: input.metadata.source,
      command: input.metadata.command,
      readonly: input.metadata.readonly,
      previewOnly: input.metadata.previewOnly
    },
    readonly: true,
    previewOnly: true,
    inputContractOnly: true,
    stdoutOnly: true,
    liveInputValidationAllowed: false,
    inputExecutionAllowed: false,
    generationRuntimeImplemented: false,
    generationExecutionAllowed: false,
    bundleExecutionAllowed: false,
    rollbackExecutionAllowed: false,
    recoveryExecutionAllowed: false,
    riskEnforcementAllowed: false,
    mitigationEnforcementEnabled: false,
    approvalExecutionAllowed: false,
    approvalDecisionApplied: false,
    projectGenerationApproved: false,
    validationExecutionAllowed: false,
    generatedProjectValidationAllowed: false,
    commandExecutionAllowed: false,
    dependencyInstallationAllowed: false,
    packageMutationAllowed: false,
    fileWriteAllowed: false,
    fileCreationAllowed: false,
    scaffoldGenerationEnabled: false,
    runtimeRoutingEnabled: false,
    runtimeActivationEnabled: false,
    policyEnforcementEnabled: false,
    projectGenerationEnabled: false,
    builderAgentRuntimeEnabled: false,
    fields,
    summary: summarizeControlledProjectGenerationInputContract(fields)
  };
}

export function summarizeControlledProjectGenerationInputContract(
  fields: readonly ControlledProjectGenerationInputField[]
): ControlledProjectGenerationInputContractSummary {
  const sortedFields = sortInputContractFields(fields);
  const warnings = [
    ...sortedFields.flatMap((field) => field.warnings),
    "Controlled project generation input contract is descriptive only; no live input validation or input execution is enabled."
  ];
  const recommendations = [
    ...sortedFields.flatMap((field) => field.recommendations),
    "Require separate human-approved runtime design before any input can drive generation behavior."
  ];
  return {
    totalFields: sortedFields.length,
    requiredFieldCount: sortedFields.filter((field) => field.required).length,
    optionalFieldCount: sortedFields.filter((field) => !field.required).length,
    blockedFieldCount: findBlockedInputFields(sortedFields).length,
    groupDistribution: summarizeBy(sortedFields, (field) => field.group),
    requirementDistribution: summarizeBy(sortedFields, (field) => field.required ? "required" : "optional"),
    riskDistribution: summarizeBy(sortedFields, (field) => field.riskLevel),
    validationPolicyDistribution: summarizeBy(sortedFields, (field) => field.validationPolicy),
    readonly: sortedFields.length > 0 && sortedFields.every((field) => field.readonly),
    previewOnly: sortedFields.length > 0 && sortedFields.every((field) => field.previewOnly),
    warnings: normalizeWarnings(warnings),
    recommendations: normalizeWarnings(recommendations),
    completeness: calculateControlledProjectGenerationInputContractCompleteness(sortedFields)
  };
}

export function calculateControlledProjectGenerationInputContractCompleteness(
  fields: readonly ControlledProjectGenerationInputField[]
): ControlledProjectGenerationInputCompleteness {
  if (fields.length === 0) {
    return { score: 0, level: "incomplete", reason: "No controlled project generation input fields were provided." };
  }
  if (fields.some((field) => field.status === "blocked" || field.validationPolicy === "blocked" || field.blockedReason !== null)) {
    return { score: 0, level: "incomplete", reason: "One or more controlled project generation input fields are blocked." };
  }
  const score = Math.round((fields.reduce((sum, field) => sum + validationPolicyScore(field.validationPolicy), 0) / fields.length) * 10);
  return {
    score,
    level: score >= 90 ? "ready-for-design" : score >= 75 ? "contract-defined" : score >= 40 ? "partial" : "incomplete",
    reason: "Advisory input contract completeness score computed from deterministic preview-only validation policies."
  };
}

export function createInputContractField(input: {
  fieldId: string;
  group: ControlledProjectGenerationInputGroup;
  label: string;
  description: string;
  required: boolean;
  status: ControlledProjectGenerationInputStatus;
  riskLevel: ControlledProjectGenerationInputRiskLevel;
  allowedValues: readonly string[];
  defaultValue?: string | null;
  validationPolicy: ControlledProjectGenerationInputValidationPolicy;
  blockedReason?: string | null;
  warnings?: readonly string[];
  recommendations?: readonly string[];
}): ControlledProjectGenerationInputField {
  return {
    fieldId: input.fieldId,
    group: input.group,
    label: input.label,
    description: input.description,
    required: input.required,
    status: input.status,
    riskLevel: input.riskLevel,
    allowedValues: normalizeWarnings(input.allowedValues),
    defaultValue: input.defaultValue ?? null,
    validationPolicy: input.validationPolicy,
    blockedReason: input.blockedReason ?? null,
    warnings: normalizeWarnings(input.warnings ?? [`${input.label} is preview-only and does not execute input handling.`]),
    recommendations: normalizeWarnings(input.recommendations ?? ["Keep this input field descriptive until a separate controlled runtime design is approved."]),
    readonly: true,
    previewOnly: true
  };
}

export function sortInputContractFields(fields: readonly ControlledProjectGenerationInputField[]): ControlledProjectGenerationInputField[] {
  const order = new Map<ControlledProjectGenerationInputGroup, number>([
    ["projectIntent", 1],
    ["projectType", 2],
    ["targetStack", 3],
    ["runtimeEnvironment", 4],
    ["filePlanPreferences", 5],
    ["dependencyPreferences", 6],
    ["validationPreferences", 7],
    ["approvalPreferences", 8],
    ["riskPreferences", 9],
    ["rollbackPreferences", 10],
    ["humanInstructions", 11],
    ["governanceContext", 12]
  ]);
  return sortDeterministically(fields, (field) => `${String(order.get(field.group) ?? 99).padStart(2, "0")}|${field.fieldId}`);
}

export function findInputFieldsByGroup(fields: readonly ControlledProjectGenerationInputField[], group: ControlledProjectGenerationInputGroup): ControlledProjectGenerationInputField[] {
  return sortInputContractFields(fields).filter((field) => field.group === group);
}

export function findInputFieldsByRequirement(fields: readonly ControlledProjectGenerationInputField[], required: boolean): ControlledProjectGenerationInputField[] {
  return sortInputContractFields(fields).filter((field) => field.required === required);
}

export function findInputFieldsByRiskLevel(fields: readonly ControlledProjectGenerationInputField[], riskLevel: ControlledProjectGenerationInputRiskLevel): ControlledProjectGenerationInputField[] {
  return sortInputContractFields(fields).filter((field) => field.riskLevel === riskLevel);
}

export function findBlockedInputFields(fields: readonly ControlledProjectGenerationInputField[]): ControlledProjectGenerationInputField[] {
  return sortInputContractFields(fields).filter((field) => field.status === "blocked" || field.validationPolicy === "blocked" || field.blockedReason !== null);
}

function createDefaultInputContractFields(): ControlledProjectGenerationInputField[] {
  return [
    createInputContractField({ fieldId: "controlled-input-001-project-intent", group: "projectIntent", label: "Project intent", description: "Human-authored future project intent.", required: true, status: "required", riskLevel: "medium", allowedValues: ["explicit-user-intent"], validationPolicy: "manual-review-required" }),
    createInputContractField({ fieldId: "controlled-input-002-project-type", group: "projectType", label: "Project type", description: "Future project category for preview-only planning.", required: true, status: "required", riskLevel: "low", allowedValues: ["web-app", "cli", "library", "service", "documentation"], validationPolicy: "structural-preview-only" }),
    createInputContractField({ fieldId: "controlled-input-003-target-stack", group: "targetStack", label: "Target stack", description: "Future target technology stack as descriptive data.", required: true, status: "required", riskLevel: "medium", allowedValues: ["node", "typescript", "static-html", "manual-review-required"], validationPolicy: "manual-review-required" }),
    createInputContractField({ fieldId: "controlled-input-004-runtime-environment", group: "runtimeEnvironment", label: "Runtime environment", description: "Future runtime assumptions without runtime routing.", required: false, status: "optional", riskLevel: "medium", allowedValues: ["local-preview", "manual-review-required", "not-applicable"], defaultValue: "manual-review-required", validationPolicy: "manual-review-required" }),
    createInputContractField({ fieldId: "controlled-input-005-file-plan-preferences", group: "filePlanPreferences", label: "File plan preferences", description: "Future file plan preferences without file creation.", required: false, status: "optional", riskLevel: "high", allowedValues: ["no-write", "safe-patch-only", "manual-approval-required"], defaultValue: "no-write", validationPolicy: "manual-review-required" }),
    createInputContractField({ fieldId: "controlled-input-006-dependency-preferences", group: "dependencyPreferences", label: "Dependency preferences", description: "Future dependency preferences without dependency installation.", required: false, status: "optional", riskLevel: "high", allowedValues: ["no-install", "manual-approval-required", "latest-disallowed"], defaultValue: "no-install", validationPolicy: "manual-review-required" }),
    createInputContractField({ fieldId: "controlled-input-007-validation-preferences", group: "validationPreferences", label: "Validation preferences", description: "Future validation preferences without command execution.", required: false, status: "optional", riskLevel: "medium", allowedValues: ["no-execute", "manual-approval-required", "preview-only"], defaultValue: "no-execute", validationPolicy: "manual-review-required" }),
    createInputContractField({ fieldId: "controlled-input-008-approval-preferences", group: "approvalPreferences", label: "Approval preferences", description: "Future approval preferences without approval execution.", required: true, status: "required", riskLevel: "high", allowedValues: ["manual-approval-required", "blocked"], defaultValue: "manual-approval-required", validationPolicy: "manual-review-required" }),
    createInputContractField({ fieldId: "controlled-input-009-risk-preferences", group: "riskPreferences", label: "Risk preferences", description: "Future risk preferences without risk enforcement.", required: true, status: "required", riskLevel: "high", allowedValues: ["manual-review-required", "preview-only"], defaultValue: "manual-review-required", validationPolicy: "manual-review-required" }),
    createInputContractField({ fieldId: "controlled-input-010-rollback-preferences", group: "rollbackPreferences", label: "Rollback preferences", description: "Future rollback preferences without rollback or recovery execution.", required: true, status: "required", riskLevel: "high", allowedValues: ["manual-review-required", "preview-only"], defaultValue: "manual-review-required", validationPolicy: "manual-review-required" }),
    createInputContractField({ fieldId: "controlled-input-011-human-instructions", group: "humanInstructions", label: "Human instructions", description: "Human instructions retained as reviewable text only.", required: false, status: "optional", riskLevel: "medium", allowedValues: ["freeform-review-text"], validationPolicy: "structural-preview-only" }),
    createInputContractField({ fieldId: "controlled-input-012-governance-context", group: "governanceContext", label: "Governance context", description: "Governance context required before any future controlled design can progress.", required: true, status: "required", riskLevel: "low", allowedValues: ["readiness-audit", "design-contract", "readonly-contract"], validationPolicy: "structural-preview-only" })
  ];
}

function validationPolicyScore(policy: ControlledProjectGenerationInputValidationPolicy): number {
  if (policy === "structural-preview-only") return 10;
  if (policy === "manual-review-required") return 8;
  if (policy === "not-applicable") return 7;
  return 0;
}

function summarizeBy<TItem, TKey extends string>(
  items: readonly TItem[],
  keyReader: (item: TItem) => TKey
): { key: TKey; totalFields: number }[] {
  const counts = new Map<TKey, number>();
  for (const item of items) {
    const key = keyReader(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([key, totalFields]) => ({ key, totalFields }))
    .sort((left, right) => left.key.localeCompare(right.key));
}
