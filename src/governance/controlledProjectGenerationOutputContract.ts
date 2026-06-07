import type { GovernanceMetadata } from "./governanceMetadata.js";
import { normalizeWarnings, sortDeterministically } from "./utils/governanceUtils.js";

export type ControlledProjectGenerationOutputGroup =
  | "blueprintPreviewOutput"
  | "filePlanPreviewOutput"
  | "dependencyPlanPreviewOutput"
  | "validationPlanPreviewOutput"
  | "approvalPlanPreviewOutput"
  | "riskPlanPreviewOutput"
  | "rollbackPlanPreviewOutput"
  | "planBundlePreviewOutput"
  | "auditPreviewOutput"
  | "cliPreviewOutput"
  | "jsonPreviewOutput"
  | "markdownPreviewOutput";

export type ControlledProjectGenerationOutputFormat =
  | "text"
  | "json"
  | "markdown"
  | "summary"
  | "structured-object";

export type ControlledProjectGenerationOutputStatus =
  | "defined"
  | "optional"
  | "required"
  | "blocked"
  | "forbidden"
  | "preview-only";

export type ControlledProjectGenerationOutputPolicy =
  | "stdout-only"
  | "preview-only"
  | "manual-review-required"
  | "blocked"
  | "forbidden"
  | "not-applicable";

export type ControlledProjectGenerationOutputRiskLevel =
  | "low"
  | "medium"
  | "high"
  | "critical";

export type ControlledProjectGenerationOutputCompletenessLevel =
  | "incomplete"
  | "partial"
  | "contract-defined"
  | "ready-for-design";

export type ControlledProjectGenerationOutputCompleteness = {
  score: number;
  level: ControlledProjectGenerationOutputCompletenessLevel;
  reason: string;
};

export type ControlledProjectGenerationOutputField = {
  fieldId: string;
  group: ControlledProjectGenerationOutputGroup;
  label: string;
  description: string;
  format: ControlledProjectGenerationOutputFormat;
  status: ControlledProjectGenerationOutputStatus;
  riskLevel: ControlledProjectGenerationOutputRiskLevel;
  allowed: string[];
  forbidden: string[];
  outputPolicy: ControlledProjectGenerationOutputPolicy;
  blockedReason: string | null;
  warnings: string[];
  recommendations: string[];
  readonly: boolean;
  previewOnly: boolean;
  stdoutOnly: boolean;
  noFileWrite: boolean;
};

export type ControlledProjectGenerationOutputContractSummary = {
  totalFields: number;
  allowedOutputCount: number;
  forbiddenOutputCount: number;
  blockedOutputCount: number;
  groupDistribution: { key: ControlledProjectGenerationOutputGroup; totalFields: number }[];
  formatDistribution: { key: ControlledProjectGenerationOutputFormat; totalFields: number }[];
  riskDistribution: { key: ControlledProjectGenerationOutputRiskLevel; totalFields: number }[];
  outputPolicyDistribution: { key: ControlledProjectGenerationOutputPolicy; totalFields: number }[];
  readonly: boolean;
  previewOnly: boolean;
  stdoutOnly: boolean;
  noFileWrite: boolean;
  warnings: string[];
  recommendations: string[];
  completeness: ControlledProjectGenerationOutputCompleteness;
};

export type ControlledProjectGenerationOutputContract = {
  schemaVersion: 1;
  title: string;
  metadata: GovernanceMetadata;
  readonly: true;
  previewOnly: true;
  outputContractOnly: true;
  stdoutOnly: true;
  noFileWrite: true;
  outputExecutionAllowed: false;
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
  fields: ControlledProjectGenerationOutputField[];
  summary: ControlledProjectGenerationOutputContractSummary;
};

export function createControlledProjectGenerationOutputContract(input: {
  title: string;
  metadata: GovernanceMetadata;
  fields?: readonly ControlledProjectGenerationOutputField[];
}): ControlledProjectGenerationOutputContract {
  const fields = sortOutputContractFields(input.fields ?? createDefaultOutputContractFields());
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
    outputContractOnly: true,
    stdoutOnly: true,
    noFileWrite: true,
    outputExecutionAllowed: false,
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
    summary: summarizeControlledProjectGenerationOutputContract(fields)
  };
}

export function summarizeControlledProjectGenerationOutputContract(
  fields: readonly ControlledProjectGenerationOutputField[]
): ControlledProjectGenerationOutputContractSummary {
  const sortedFields = sortOutputContractFields(fields);
  const warnings = [
    ...sortedFields.flatMap((field) => field.warnings),
    "Controlled project generation output contract is descriptive only; no runtime output execution or file writing is enabled."
  ];
  const recommendations = [
    ...sortedFields.flatMap((field) => field.recommendations),
    "Require separate human-approved runtime design before any output can be written or executed."
  ];
  return {
    totalFields: sortedFields.length,
    allowedOutputCount: sortedFields.filter((field) => field.allowed.length > 0 && field.outputPolicy !== "forbidden").length,
    forbiddenOutputCount: findForbiddenOutputFields(sortedFields).length,
    blockedOutputCount: findBlockedOutputFields(sortedFields).length,
    groupDistribution: summarizeBy(sortedFields, (field) => field.group),
    formatDistribution: summarizeBy(sortedFields, (field) => field.format),
    riskDistribution: summarizeBy(sortedFields, (field) => field.riskLevel),
    outputPolicyDistribution: summarizeBy(sortedFields, (field) => field.outputPolicy),
    readonly: sortedFields.length > 0 && sortedFields.every((field) => field.readonly),
    previewOnly: sortedFields.length > 0 && sortedFields.every((field) => field.previewOnly),
    stdoutOnly: sortedFields.length > 0 && sortedFields.every((field) => field.stdoutOnly),
    noFileWrite: sortedFields.length > 0 && sortedFields.every((field) => field.noFileWrite),
    warnings: normalizeWarnings(warnings),
    recommendations: normalizeWarnings(recommendations),
    completeness: calculateControlledProjectGenerationOutputContractCompleteness(sortedFields)
  };
}

export function calculateControlledProjectGenerationOutputContractCompleteness(
  fields: readonly ControlledProjectGenerationOutputField[]
): ControlledProjectGenerationOutputCompleteness {
  if (fields.length === 0) {
    return { score: 0, level: "incomplete", reason: "No controlled project generation output fields were provided." };
  }
  if (fields.some((field) => field.status === "blocked" || field.outputPolicy === "blocked" || field.blockedReason !== null)) {
    return { score: 0, level: "incomplete", reason: "One or more controlled project generation output fields are blocked." };
  }
  const score = Math.round((fields.reduce((sum, field) => sum + outputPolicyScore(field.outputPolicy), 0) / fields.length) * 10);
  return {
    score,
    level: score >= 90 ? "ready-for-design" : score >= 75 ? "contract-defined" : score >= 40 ? "partial" : "incomplete",
    reason: "Advisory output contract completeness score computed from deterministic preview-only output policies."
  };
}

export function createOutputContractField(input: {
  fieldId: string;
  group: ControlledProjectGenerationOutputGroup;
  label: string;
  description: string;
  format: ControlledProjectGenerationOutputFormat;
  status: ControlledProjectGenerationOutputStatus;
  riskLevel: ControlledProjectGenerationOutputRiskLevel;
  allowed: readonly string[];
  forbidden: readonly string[];
  outputPolicy: ControlledProjectGenerationOutputPolicy;
  blockedReason?: string | null;
  warnings?: readonly string[];
  recommendations?: readonly string[];
}): ControlledProjectGenerationOutputField {
  return {
    fieldId: input.fieldId,
    group: input.group,
    label: input.label,
    description: input.description,
    format: input.format,
    status: input.status,
    riskLevel: input.riskLevel,
    allowed: normalizeWarnings(input.allowed),
    forbidden: normalizeWarnings(input.forbidden),
    outputPolicy: input.outputPolicy,
    blockedReason: input.blockedReason ?? null,
    warnings: normalizeWarnings(input.warnings ?? [`${input.label} is preview-only and does not execute output handling.`]),
    recommendations: normalizeWarnings(input.recommendations ?? ["Keep this output field stdout-only until a separate controlled runtime design is approved."]),
    readonly: true,
    previewOnly: true,
    stdoutOnly: true,
    noFileWrite: true
  };
}

export function sortOutputContractFields(fields: readonly ControlledProjectGenerationOutputField[]): ControlledProjectGenerationOutputField[] {
  const order = new Map<ControlledProjectGenerationOutputGroup, number>([
    ["blueprintPreviewOutput", 1],
    ["filePlanPreviewOutput", 2],
    ["dependencyPlanPreviewOutput", 3],
    ["validationPlanPreviewOutput", 4],
    ["approvalPlanPreviewOutput", 5],
    ["riskPlanPreviewOutput", 6],
    ["rollbackPlanPreviewOutput", 7],
    ["planBundlePreviewOutput", 8],
    ["auditPreviewOutput", 9],
    ["cliPreviewOutput", 10],
    ["jsonPreviewOutput", 11],
    ["markdownPreviewOutput", 12]
  ]);
  return sortDeterministically(fields, (field) => `${String(order.get(field.group) ?? 99).padStart(2, "0")}|${field.fieldId}`);
}

export function findOutputFieldsByGroup(fields: readonly ControlledProjectGenerationOutputField[], group: ControlledProjectGenerationOutputGroup): ControlledProjectGenerationOutputField[] {
  return sortOutputContractFields(fields).filter((field) => field.group === group);
}

export function findOutputFieldsByFormat(fields: readonly ControlledProjectGenerationOutputField[], format: ControlledProjectGenerationOutputFormat): ControlledProjectGenerationOutputField[] {
  return sortOutputContractFields(fields).filter((field) => field.format === format);
}

export function findOutputFieldsByRiskLevel(fields: readonly ControlledProjectGenerationOutputField[], riskLevel: ControlledProjectGenerationOutputRiskLevel): ControlledProjectGenerationOutputField[] {
  return sortOutputContractFields(fields).filter((field) => field.riskLevel === riskLevel);
}

export function findBlockedOutputFields(fields: readonly ControlledProjectGenerationOutputField[]): ControlledProjectGenerationOutputField[] {
  return sortOutputContractFields(fields).filter((field) => field.status === "blocked" || field.outputPolicy === "blocked" || field.blockedReason !== null);
}

export function findForbiddenOutputFields(fields: readonly ControlledProjectGenerationOutputField[]): ControlledProjectGenerationOutputField[] {
  return sortOutputContractFields(fields).filter((field) => field.status === "forbidden" || field.outputPolicy === "forbidden" || field.forbidden.length > 0);
}

function createDefaultOutputContractFields(): ControlledProjectGenerationOutputField[] {
  return [
    createOutputContractField({ fieldId: "controlled-output-001-blueprint-preview", group: "blueprintPreviewOutput", label: "Blueprint preview output", description: "Future blueprint preview output as structured data only.", format: "structured-object", status: "required", riskLevel: "medium", allowed: ["blueprint summary", "section summaries"], forbidden: ["project generation", "scaffold generation"], outputPolicy: "preview-only" }),
    createOutputContractField({ fieldId: "controlled-output-002-file-plan-preview", group: "filePlanPreviewOutput", label: "File plan preview output", description: "Future file plan preview output without file creation.", format: "structured-object", status: "required", riskLevel: "high", allowed: ["planned path summaries", "mutation policy summaries"], forbidden: ["file creation", "multi-file mutation"], outputPolicy: "manual-review-required" }),
    createOutputContractField({ fieldId: "controlled-output-003-dependency-plan-preview", group: "dependencyPlanPreviewOutput", label: "Dependency plan preview output", description: "Future dependency plan preview output without package mutation.", format: "structured-object", status: "required", riskLevel: "high", allowed: ["dependency summaries", "installation policy summaries"], forbidden: ["dependency installation", "package.json mutation"], outputPolicy: "manual-review-required" }),
    createOutputContractField({ fieldId: "controlled-output-004-validation-plan-preview", group: "validationPlanPreviewOutput", label: "Validation plan preview output", description: "Future validation plan preview output without command execution.", format: "structured-object", status: "required", riskLevel: "medium", allowed: ["validation check summaries"], forbidden: ["validation execution", "generated-project validation"], outputPolicy: "preview-only" }),
    createOutputContractField({ fieldId: "controlled-output-005-approval-plan-preview", group: "approvalPlanPreviewOutput", label: "Approval plan preview output", description: "Future approval plan preview output without approval execution.", format: "structured-object", status: "required", riskLevel: "high", allowed: ["approval gate summaries"], forbidden: ["approval execution", "approval decision application"], outputPolicy: "manual-review-required" }),
    createOutputContractField({ fieldId: "controlled-output-006-risk-plan-preview", group: "riskPlanPreviewOutput", label: "Risk plan preview output", description: "Future risk plan preview output without risk enforcement.", format: "structured-object", status: "required", riskLevel: "high", allowed: ["risk summaries", "exposure summaries"], forbidden: ["risk enforcement", "mitigation enforcement"], outputPolicy: "manual-review-required" }),
    createOutputContractField({ fieldId: "controlled-output-007-rollback-plan-preview", group: "rollbackPlanPreviewOutput", label: "Rollback plan preview output", description: "Future rollback plan preview output without rollback or recovery execution.", format: "structured-object", status: "required", riskLevel: "high", allowed: ["rollback step summaries"], forbidden: ["rollback execution", "recovery execution"], outputPolicy: "manual-review-required" }),
    createOutputContractField({ fieldId: "controlled-output-008-plan-bundle-preview", group: "planBundlePreviewOutput", label: "Plan bundle preview output", description: "Future plan bundle preview output without bundle execution.", format: "summary", status: "required", riskLevel: "medium", allowed: ["bundle summary", "section rollups"], forbidden: ["bundle execution", "bundle file writing"], outputPolicy: "preview-only" }),
    createOutputContractField({ fieldId: "controlled-output-009-audit-preview", group: "auditPreviewOutput", label: "Audit preview output", description: "Future audit preview output for readiness and contract review.", format: "summary", status: "required", riskLevel: "low", allowed: ["audit summary", "coverage summary"], forbidden: ["governance activation", "policy enforcement"], outputPolicy: "preview-only" }),
    createOutputContractField({ fieldId: "controlled-output-010-cli-preview", group: "cliPreviewOutput", label: "CLI preview output", description: "Future CLI output printed to stdout only.", format: "text", status: "required", riskLevel: "low", allowed: ["stdout text"], forbidden: ["file writing", "runtime routing"], outputPolicy: "stdout-only" }),
    createOutputContractField({ fieldId: "controlled-output-011-json-preview", group: "jsonPreviewOutput", label: "JSON preview output", description: "Future JSON preview output printed to stdout only.", format: "json", status: "required", riskLevel: "low", allowed: ["deterministic JSON"], forbidden: ["writing JSON files by default"], outputPolicy: "stdout-only" }),
    createOutputContractField({ fieldId: "controlled-output-012-markdown-preview", group: "markdownPreviewOutput", label: "Markdown preview output", description: "Future markdown preview output printed to stdout only.", format: "markdown", status: "optional", riskLevel: "low", allowed: ["deterministic markdown text"], forbidden: ["writing markdown files by default"], outputPolicy: "stdout-only" })
  ];
}

function outputPolicyScore(policy: ControlledProjectGenerationOutputPolicy): number {
  if (policy === "stdout-only") return 10;
  if (policy === "preview-only") return 9;
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
