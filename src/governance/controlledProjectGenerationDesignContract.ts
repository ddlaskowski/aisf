import type { GovernanceMetadata } from "./governanceMetadata.js";
import { normalizeWarnings, sortDeterministically } from "./utils/governanceUtils.js";

export type ControlledProjectGenerationContractSectionType =
  | "intentInputs"
  | "blueprintInputs"
  | "filePlanInputs"
  | "dependencyPlanInputs"
  | "validationPlanInputs"
  | "approvalPlanInputs"
  | "riskPlanInputs"
  | "rollbackPlanInputs"
  | "requiredGovernanceArtifacts"
  | "allowedOutputs"
  | "forbiddenActions"
  | "mutationBoundaries"
  | "approvalBoundaries"
  | "runtimeBoundaries"
  | "cliPreviewPaths"
  | "scenarioSuites";

export type ControlledProjectGenerationContractStatus =
  | "defined"
  | "partial"
  | "blocked"
  | "not-started"
  | "preview-only";

export type ControlledProjectGenerationContractCompletenessLevel =
  | "incomplete"
  | "partial"
  | "contract-defined"
  | "ready-for-architecture-preview";

export type ControlledProjectGenerationContractCompleteness = {
  score: number;
  level: ControlledProjectGenerationContractCompletenessLevel;
  reason: string;
};

export type ControlledProjectGenerationContractSection = {
  sectionType: ControlledProjectGenerationContractSectionType;
  title: string;
  summary: string;
  status: ControlledProjectGenerationContractStatus;
  requirements: string[];
  allowed: string[];
  forbidden: string[];
  risks: string[];
  warnings: string[];
  recommendations: string[];
  readonly: boolean;
  previewOnly: boolean;
  noExecution: boolean;
  score: number;
};

export type ControlledProjectGenerationContractSummary = {
  totalSections: number;
  totalRequirements: number;
  totalAllowed: number;
  totalForbidden: number;
  totalRisks: number;
  definedSections: number;
  partialSections: number;
  blockedSections: number;
  notStartedSections: number;
  previewOnlySections: number;
  readonly: boolean;
  previewOnly: boolean;
  noExecution: boolean;
  completeness: ControlledProjectGenerationContractCompleteness;
  warnings: string[];
  recommendations: string[];
};

export type ControlledProjectGenerationDesignContract = {
  schemaVersion: 1;
  title: string;
  metadata: GovernanceMetadata;
  readonly: true;
  previewOnly: true;
  designContractOnly: true;
  stdoutOnly: true;
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
  sections: ControlledProjectGenerationContractSection[];
  summary: ControlledProjectGenerationContractSummary;
};

export function createControlledProjectGenerationDesignContract(input: {
  title: string;
  metadata: GovernanceMetadata;
  sections?: readonly ControlledProjectGenerationContractSection[];
}): ControlledProjectGenerationDesignContract {
  const sections = sortControlledProjectGenerationContractSections(input.sections ?? createDefaultControlledProjectGenerationContractSections());
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
    designContractOnly: true,
    stdoutOnly: true,
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
    sections,
    summary: summarizeControlledProjectGenerationDesignContract(sections)
  };
}

export function summarizeControlledProjectGenerationDesignContract(
  sections: readonly ControlledProjectGenerationContractSection[]
): ControlledProjectGenerationContractSummary {
  const sortedSections = sortControlledProjectGenerationContractSections(sections);
  const warnings = [
    ...sortedSections.flatMap((section) => section.warnings),
    "Controlled project generation design contract is descriptive only; no generation runtime is implemented."
  ];
  const recommendations = [
    ...sortedSections.flatMap((section) => section.recommendations),
    "Require separate human-approved architecture preview before any controlled generation runtime exists."
  ];
  return {
    totalSections: sortedSections.length,
    totalRequirements: sortedSections.reduce((sum, section) => sum + section.requirements.length, 0),
    totalAllowed: sortedSections.reduce((sum, section) => sum + section.allowed.length, 0),
    totalForbidden: sortedSections.reduce((sum, section) => sum + section.forbidden.length, 0),
    totalRisks: sortedSections.reduce((sum, section) => sum + section.risks.length, 0),
    definedSections: sortedSections.filter((section) => section.status === "defined").length,
    partialSections: sortedSections.filter((section) => section.status === "partial").length,
    blockedSections: sortedSections.filter((section) => section.status === "blocked").length,
    notStartedSections: sortedSections.filter((section) => section.status === "not-started").length,
    previewOnlySections: sortedSections.filter((section) => section.status === "preview-only").length,
    readonly: sortedSections.length > 0 && sortedSections.every((section) => section.readonly),
    previewOnly: sortedSections.length > 0 && sortedSections.every((section) => section.previewOnly),
    noExecution: sortedSections.length > 0 && sortedSections.every((section) => section.noExecution),
    completeness: calculateControlledProjectGenerationDesignContractCompleteness(sortedSections),
    warnings: normalizeWarnings(warnings),
    recommendations: normalizeWarnings(recommendations)
  };
}

export function calculateControlledProjectGenerationDesignContractCompleteness(
  sections: readonly ControlledProjectGenerationContractSection[]
): ControlledProjectGenerationContractCompleteness {
  if (sections.length === 0) {
    return { score: 0, level: "incomplete", reason: "No controlled project generation contract sections were provided." };
  }
  if (sections.some((section) => section.status === "blocked" || section.noExecution !== true)) {
    return { score: 0, level: "incomplete", reason: "One or more controlled project generation contract sections are blocked or allow execution." };
  }
  const score = Math.round(sections.reduce((sum, section) => sum + section.score, 0) / sections.length);
  return {
    score,
    level: score >= 90 ? "ready-for-architecture-preview" : score >= 75 ? "contract-defined" : score >= 40 ? "partial" : "incomplete",
    reason: "Advisory design contract completeness score computed from deterministic preview-only contract sections."
  };
}

export function createContractIntentInputSection(): ControlledProjectGenerationContractSection {
  return createContractSection({
    sectionType: "intentInputs",
    title: "Intent inputs",
    summary: "Defines future project intent inputs as reviewed data only.",
    requirements: ["capture explicit user intent", "preserve source traceability", "reject implicit runtime execution"],
    allowed: ["read-only intent summaries"],
    forbidden: ["autonomous intent expansion", "planner-agent runtime loops"],
    risks: ["ambiguous intent could require manual review"],
    score: 80
  });
}

export function createContractBlueprintInputSection(): ControlledProjectGenerationContractSection {
  return createContractSection({
    sectionType: "blueprintInputs",
    title: "Blueprint inputs",
    summary: "Defines future blueprint inputs without generating projects.",
    requirements: ["reference blueprint preview", "capture architecture assumptions", "preserve approval status", "keep blueprint data deterministic"],
    allowed: ["blueprint preview summaries"],
    forbidden: ["scaffold generation", "project generation"],
    risks: ["blueprint gaps could block future controlled design"],
    score: 80
  });
}

export function createContractFilePlanInputSection(): ControlledProjectGenerationContractSection {
  return createContractSection({
    sectionType: "filePlanInputs",
    title: "File plan inputs",
    summary: "Defines future file plan inputs while preserving no-file-creation guarantees.",
    requirements: ["reference planned paths", "include file roles", "include mutation policy", "require approval state", "preserve single-file mutation boundary"],
    allowed: ["file plan preview data"],
    forbidden: ["file creation", "multi-file mutation", "scaffold generation"],
    risks: ["planned paths could conflict with existing files"],
    score: 80
  });
}

export function createContractDependencyPlanInputSection(): ControlledProjectGenerationContractSection {
  return createContractSection({
    sectionType: "dependencyPlanInputs",
    title: "Dependency plan inputs",
    summary: "Defines future dependency plan inputs without installing dependencies.",
    requirements: ["reference package names", "include dependency type", "include installation policy", "include version policy", "require human approval"],
    allowed: ["dependency plan preview data"],
    forbidden: ["dependency installation", "package.json mutation", "lockfile mutation"],
    risks: ["dependency choices could require security review"],
    score: 80
  });
}

export function createContractValidationPlanInputSection(): ControlledProjectGenerationContractSection {
  return createContractSection({
    sectionType: "validationPlanInputs",
    title: "Validation plan inputs",
    summary: "Defines future validation plan inputs without executing commands.",
    requirements: ["reference check identifiers", "include command previews", "include execution policy", "include expected signal", "require manual approval for execution"],
    allowed: ["validation plan preview data"],
    forbidden: ["validation execution", "generated-project validation", "command execution"],
    risks: ["validation previews may not reflect future environment behavior"],
    score: 80
  });
}

export function createContractApprovalPlanInputSection(): ControlledProjectGenerationContractSection {
  return createContractSection({
    sectionType: "approvalPlanInputs",
    title: "Approval plan inputs",
    summary: "Defines future approval inputs without executing approvals.",
    requirements: ["reference approval gates", "include decision status", "include approval policy", "include risk level", "require human approval"],
    allowed: ["approval plan preview data"],
    forbidden: ["approval execution", "approval decision application", "project generation approval"],
    risks: ["approval ambiguity could block future runtime design"],
    score: 80
  });
}

export function createContractRiskPlanInputSection(): ControlledProjectGenerationContractSection {
  return createContractSection({
    sectionType: "riskPlanInputs",
    title: "Risk plan inputs",
    summary: "Defines future risk inputs without enforcing risks.",
    requirements: ["reference risk identifiers", "include affected plan", "include severity", "include likelihood", "include mitigation policy"],
    allowed: ["risk plan preview data"],
    forbidden: ["risk enforcement", "mitigation enforcement", "automatic rejection"],
    risks: ["risk exposure requires manual interpretation"],
    score: 80
  });
}

export function createContractRollbackPlanInputSection(): ControlledProjectGenerationContractSection {
  return createContractSection({
    sectionType: "rollbackPlanInputs",
    title: "Rollback plan inputs",
    summary: "Defines future rollback inputs without rollback or recovery execution.",
    requirements: ["reference rollback steps", "include applies-to value", "include rollback policy", "include recovery policy", "include execution status"],
    allowed: ["rollback plan preview data"],
    forbidden: ["rollback execution", "recovery execution", "state mutation"],
    risks: ["rollback design must be validated before future runtime use"],
    score: 80
  });
}

export function createContractRequiredGovernanceArtifactsSection(): ControlledProjectGenerationContractSection {
  return createContractSection({
    sectionType: "requiredGovernanceArtifacts",
    title: "Required governance artifacts",
    summary: "Defines governance artifacts required before future controlled generation design can progress.",
    requirements: ["readiness assessment", "capability map", "blueprint preview", "file plan preview", "dependency plan preview", "validation plan preview", "approval plan preview", "risk plan preview", "rollback plan preview", "plan bundle preview"],
    allowed: ["artifact summaries", "review-pack inputs"],
    forbidden: ["governance activation", "policy enforcement"],
    risks: ["missing artifacts must block future execution-capable design"],
    score: 90
  });
}

export function createContractAllowedOutputsSection(): ControlledProjectGenerationContractSection {
  return createContractSection({
    sectionType: "allowedOutputs",
    title: "Allowed outputs",
    summary: "Defines read-only outputs allowed by this design contract.",
    requirements: ["stdout-only output", "deterministic JSON", "deterministic markdown-compatible text", "explicit readonly flags", "explicit preview-only flags", "explicit no-execution flags"],
    allowed: ["contract JSON", "contract text", "summary records", "section records", "warnings", "recommendations"],
    forbidden: ["file writes", "project files", "scaffolds"],
    risks: ["future exports require separate review before file writing"],
    score: 90
  });
}

export function createContractForbiddenActionsSection(): ControlledProjectGenerationContractSection {
  return createContractSection({
    sectionType: "forbiddenActions",
    title: "Forbidden actions",
    summary: "Defines actions explicitly forbidden by the controlled generation design contract.",
    requirements: ["list execution bans", "list mutation bans", "list runtime bans", "list governance activation bans"],
    allowed: ["forbidden action documentation"],
    forbidden: ["project generation", "bundle execution", "rollback execution", "recovery execution", "risk enforcement", "approval execution", "validation execution", "dependency installation", "package mutation", "file creation", "scaffold generation", "runtime routing"],
    risks: ["any forbidden action becoming enabled must block future design progression"],
    score: 100
  });
}

export function createContractMutationBoundarySection(): ControlledProjectGenerationContractSection {
  return createContractSection({
    sectionType: "mutationBoundaries",
    title: "Mutation boundaries",
    summary: "Defines mutation boundaries for any future controlled generation design.",
    requirements: ["Safe Patch Engine remains sole mutation layer", "single-file mutation invariant remains preserved", "file creation remains disabled", "multi-file mutation remains disabled"],
    allowed: ["boundary documentation"],
    forbidden: ["mutation expansion", "runtime self-modification", "file writing by default"],
    risks: ["future mutation design requires separate safety review"],
    score: 100
  });
}

export function createContractApprovalBoundarySection(): ControlledProjectGenerationContractSection {
  return createContractSection({
    sectionType: "approvalBoundaries",
    title: "Approval boundaries",
    summary: "Defines approval boundaries without executing approval decisions.",
    requirements: ["manual approval required before execution-capable design", "approval status remains descriptive", "no approval decision is applied", "no project generation is approved"],
    allowed: ["approval boundary documentation"],
    forbidden: ["approval execution", "automatic approval", "approval decision application"],
    risks: ["future approval workflow requires human governance review"],
    score: 100
  });
}

export function createContractRuntimeBoundarySection(): ControlledProjectGenerationContractSection {
  return createContractSection({
    sectionType: "runtimeBoundaries",
    title: "Runtime boundaries",
    summary: "Defines runtime boundaries for the future controlled generation design.",
    requirements: ["runtime governance remains disabled", "runtime autonomy remains disabled", "runtime activation remains disabled", "policy enforcement remains disabled", "runtime routing remains disabled", "builder-agent runtime remains disabled"],
    allowed: ["runtime boundary documentation"],
    forbidden: ["runtime activation", "runtime routing", "planner-agent runtime loops", "autonomous project generation"],
    risks: ["runtime capabilities require separate architecture preview and approval"],
    score: 100
  });
}

export function createContractCliPreviewPathsSection(): ControlledProjectGenerationContractSection {
  return createContractSection({
    sectionType: "cliPreviewPaths",
    title: "CLI preview paths",
    summary: "Defines read-only CLI preview paths relevant to controlled generation design.",
    requirements: ["project-generation-readiness", "project-generation-capabilities", "project-generation-blueprint", "project-generation-file-plan", "project-generation-dependency-plan", "project-generation-validation-plan", "project-generation-approval-plan", "project-generation-risk-plan", "project-generation-rollback-plan", "project-generation-plan-bundle", "project-generation-readiness-audit"],
    allowed: ["stdout-only CLI previews"],
    forbidden: ["CLI file writing by default", "CLI execution paths"],
    risks: ["future CLI execution requires separate command design"],
    score: 100
  });
}

export function createContractScenarioSuitesSection(): ControlledProjectGenerationContractSection {
  return createContractSection({
    sectionType: "scenarioSuites",
    title: "Scenario suites",
    summary: "Defines deterministic scenario suite coverage for controlled generation design checks.",
    requirements: ["project-generation suite", "controlled-generation suite"],
    allowed: ["local deterministic scenario checks"],
    forbidden: ["network validation", "concurrent runtime orchestration"],
    risks: ["future scenario scaling requires filtered execution"],
    score: 100
  });
}

export function sortControlledProjectGenerationContractSections(
  sections: readonly ControlledProjectGenerationContractSection[]
): ControlledProjectGenerationContractSection[] {
  const order = new Map<ControlledProjectGenerationContractSectionType, number>([
    ["intentInputs", 1],
    ["blueprintInputs", 2],
    ["filePlanInputs", 3],
    ["dependencyPlanInputs", 4],
    ["validationPlanInputs", 5],
    ["approvalPlanInputs", 6],
    ["riskPlanInputs", 7],
    ["rollbackPlanInputs", 8],
    ["requiredGovernanceArtifacts", 9],
    ["allowedOutputs", 10],
    ["forbiddenActions", 11],
    ["mutationBoundaries", 12],
    ["approvalBoundaries", 13],
    ["runtimeBoundaries", 14],
    ["cliPreviewPaths", 15],
    ["scenarioSuites", 16]
  ]);
  return sortDeterministically(sections, (section) => `${String(order.get(section.sectionType) ?? 99).padStart(2, "0")}|${section.sectionType}`);
}

function createDefaultControlledProjectGenerationContractSections(): ControlledProjectGenerationContractSection[] {
  return [
    createContractIntentInputSection(),
    createContractBlueprintInputSection(),
    createContractFilePlanInputSection(),
    createContractDependencyPlanInputSection(),
    createContractValidationPlanInputSection(),
    createContractApprovalPlanInputSection(),
    createContractRiskPlanInputSection(),
    createContractRollbackPlanInputSection(),
    createContractRequiredGovernanceArtifactsSection(),
    createContractAllowedOutputsSection(),
    createContractForbiddenActionsSection(),
    createContractMutationBoundarySection(),
    createContractApprovalBoundarySection(),
    createContractRuntimeBoundarySection(),
    createContractCliPreviewPathsSection(),
    createContractScenarioSuitesSection()
  ];
}

function createContractSection(input: {
  sectionType: ControlledProjectGenerationContractSectionType;
  title: string;
  summary: string;
  requirements: readonly string[];
  allowed: readonly string[];
  forbidden: readonly string[];
  risks: readonly string[];
  score: number;
}): ControlledProjectGenerationContractSection {
  return {
    sectionType: input.sectionType,
    title: input.title,
    summary: input.summary,
    status: input.score >= 75 ? "defined" : input.score > 0 ? "partial" : "not-started",
    requirements: normalizeWarnings(input.requirements),
    allowed: normalizeWarnings(input.allowed),
    forbidden: normalizeWarnings(input.forbidden),
    risks: normalizeWarnings(input.risks),
    warnings: normalizeWarnings([`${input.title} is design-contract-only and does not enable runtime behavior.`]),
    recommendations: normalizeWarnings(["Keep this contract descriptive until a separate controlled architecture preview is approved."]),
    readonly: true,
    previewOnly: true,
    noExecution: true,
    score: input.score
  };
}
