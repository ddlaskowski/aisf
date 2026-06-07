import type { GovernanceMetadata } from "./governanceMetadata.js";
import { normalizeWarnings, sortDeterministically } from "./utils/governanceUtils.js";
import { createControlledProjectGenerationApprovalBoundaryContract, type ControlledProjectGenerationApprovalBoundaryContract } from "./controlledProjectGenerationApprovalBoundaryContract.js";
import { createControlledProjectGenerationDesignContract, type ControlledProjectGenerationDesignContract } from "./controlledProjectGenerationDesignContract.js";
import { createControlledProjectGenerationInputContract, type ControlledProjectGenerationInputContract } from "./controlledProjectGenerationInputContract.js";
import { createControlledProjectGenerationMutationBoundaryContract, type ControlledProjectGenerationMutationBoundaryContract } from "./controlledProjectGenerationMutationBoundaryContract.js";
import { createControlledProjectGenerationOutputContract, type ControlledProjectGenerationOutputContract } from "./controlledProjectGenerationOutputContract.js";
import { createControlledProjectGenerationRuntimeBoundaryContract, type ControlledProjectGenerationRuntimeBoundaryContract } from "./controlledProjectGenerationRuntimeBoundaryContract.js";

export type ControlledProjectGenerationContractBundleSectionType =
  | "designContract"
  | "inputContract"
  | "outputContract"
  | "mutationBoundaryContract"
  | "approvalBoundaryContract"
  | "runtimeBoundaryContract"
  | "forbiddenActions"
  | "guarantees"
  | "cliPreviewPaths"
  | "scenarioCoverage";

export type ControlledProjectGenerationContractBundleStatus =
  | "defined"
  | "partial"
  | "blocked"
  | "not-started"
  | "preview-only";

export type ControlledProjectGenerationContractBundleCompletenessLevel =
  | "incomplete"
  | "partial"
  | "bundle-defined"
  | "ready-for-design-audit";

export type ControlledProjectGenerationContractBundleCompleteness = {
  score: number;
  level: ControlledProjectGenerationContractBundleCompletenessLevel;
  reason: string;
};

export type ControlledProjectGenerationContractBundleSection = {
  sectionType: ControlledProjectGenerationContractBundleSectionType;
  title: string;
  summary: string;
  status: ControlledProjectGenerationContractBundleStatus;
  score: number;
  level: string;
  entryCount: number;
  blockedCount: number;
  forbiddenCount: number;
  warnings: string[];
  recommendations: string[];
  readonly: boolean;
  previewOnly: boolean;
  noExecution: boolean;
};

export type ControlledProjectGenerationContractBundleSummary = {
  totalSections: number;
  definedSections: number;
  partialSections: number;
  blockedSections: number;
  notStartedSections: number;
  previewOnlySections: number;
  totalEntries: number;
  totalBlocked: number;
  totalForbidden: number;
  cliPreviewPathCount: number;
  scenarioCoverageCount: number;
  readonly: boolean;
  previewOnly: boolean;
  noExecution: boolean;
  warnings: string[];
  recommendations: string[];
  completeness: ControlledProjectGenerationContractBundleCompleteness;
};

export type ControlledProjectGenerationContractBundle = {
  schemaVersion: 1;
  title: string;
  metadata: GovernanceMetadata;
  readonly: true;
  previewOnly: true;
  contractBundleOnly: true;
  stdoutOnly: true;
  contractBundleExecutionAllowed: false;
  runtimeExecutionAllowed: false;
  runtimeActivationAllowed: false;
  runtimeRoutingAllowed: false;
  runtimeOrchestrationAllowed: false;
  runtimePersistenceAllowed: false;
  plannerLoopAllowed: false;
  builderAgentLoopAllowed: false;
  autonomousGenerationAllowed: false;
  approvalExecutionAllowed: false;
  approvalPersistenceAllowed: false;
  approvalDecisionApplied: false;
  projectGenerationApproved: false;
  mutationExecutionAllowed: false;
  mutationExpansionAllowed: false;
  generationRuntimeImplemented: false;
  generationExecutionAllowed: false;
  outputExecutionAllowed: false;
  inputExecutionAllowed: false;
  bundleExecutionAllowed: false;
  rollbackExecutionAllowed: false;
  recoveryExecutionAllowed: false;
  riskEnforcementAllowed: false;
  mitigationEnforcementEnabled: false;
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
  designContract: ControlledProjectGenerationDesignContract;
  inputContract: ControlledProjectGenerationInputContract;
  outputContract: ControlledProjectGenerationOutputContract;
  mutationBoundaryContract: ControlledProjectGenerationMutationBoundaryContract;
  approvalBoundaryContract: ControlledProjectGenerationApprovalBoundaryContract;
  runtimeBoundaryContract: ControlledProjectGenerationRuntimeBoundaryContract;
  forbiddenActions: string[];
  readonlyGuarantees: string[];
  previewOnlyGuarantees: string[];
  noExecutionGuarantees: string[];
  cliPreviewPaths: string[];
  scenarioCoverage: string[];
  sections: ControlledProjectGenerationContractBundleSection[];
  summary: ControlledProjectGenerationContractBundleSummary;
};

export function createControlledProjectGenerationContractBundle(input: {
  title: string;
  metadata: GovernanceMetadata;
  designContract?: ControlledProjectGenerationDesignContract;
  inputContract?: ControlledProjectGenerationInputContract;
  outputContract?: ControlledProjectGenerationOutputContract;
  mutationBoundaryContract?: ControlledProjectGenerationMutationBoundaryContract;
  approvalBoundaryContract?: ControlledProjectGenerationApprovalBoundaryContract;
  runtimeBoundaryContract?: ControlledProjectGenerationRuntimeBoundaryContract;
  sections?: readonly ControlledProjectGenerationContractBundleSection[];
}): ControlledProjectGenerationContractBundle {
  const designContract = input.designContract ?? createControlledProjectGenerationDesignContract({ title: "Controlled Project Generation Design Contract", metadata: contractMetadata("v12.0", "controlled-project-generation-contract") });
  const inputContract = input.inputContract ?? createControlledProjectGenerationInputContract({ title: "Controlled Project Generation Input Contract", metadata: contractMetadata("v12.1", "controlled-project-generation-input-contract") });
  const outputContract = input.outputContract ?? createControlledProjectGenerationOutputContract({ title: "Controlled Project Generation Output Contract", metadata: contractMetadata("v12.2", "controlled-project-generation-output-contract") });
  const mutationBoundaryContract = input.mutationBoundaryContract ?? createControlledProjectGenerationMutationBoundaryContract({ title: "Controlled Project Generation Mutation Boundary Contract", metadata: contractMetadata("v12.3", "controlled-project-generation-mutation-boundary") });
  const approvalBoundaryContract = input.approvalBoundaryContract ?? createControlledProjectGenerationApprovalBoundaryContract({ title: "Controlled Project Generation Approval Boundary Contract", metadata: contractMetadata("v12.4", "controlled-project-generation-approval-boundary") });
  const runtimeBoundaryContract = input.runtimeBoundaryContract ?? createControlledProjectGenerationRuntimeBoundaryContract({ title: "Controlled Project Generation Runtime Boundary Contract", metadata: contractMetadata("v12.5", "controlled-project-generation-runtime-boundary") });
  const forbiddenActions = createForbiddenActions();
  const readonlyGuarantees = createReadonlyGuarantees();
  const previewOnlyGuarantees = createPreviewOnlyGuarantees();
  const noExecutionGuarantees = createNoExecutionGuarantees();
  const cliPreviewPaths = createCliPreviewPaths();
  const scenarioCoverage = createScenarioCoverage();
  const sections = sortContractBundleSections(input.sections ?? [
    createContractBundleDesignSection(designContract),
    createContractBundleInputSection(inputContract),
    createContractBundleOutputSection(outputContract),
    createContractBundleMutationBoundarySection(mutationBoundaryContract),
    createContractBundleApprovalBoundarySection(approvalBoundaryContract),
    createContractBundleRuntimeBoundarySection(runtimeBoundaryContract),
    createContractBundleForbiddenActionsSection(forbiddenActions),
    createContractBundleGuaranteesSection(readonlyGuarantees, previewOnlyGuarantees, noExecutionGuarantees),
    createContractBundleCliPreviewSection(cliPreviewPaths),
    createContractBundleScenarioCoverageSection(scenarioCoverage)
  ]);
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
    contractBundleOnly: true,
    stdoutOnly: true,
    contractBundleExecutionAllowed: false,
    runtimeExecutionAllowed: false,
    runtimeActivationAllowed: false,
    runtimeRoutingAllowed: false,
    runtimeOrchestrationAllowed: false,
    runtimePersistenceAllowed: false,
    plannerLoopAllowed: false,
    builderAgentLoopAllowed: false,
    autonomousGenerationAllowed: false,
    approvalExecutionAllowed: false,
    approvalPersistenceAllowed: false,
    approvalDecisionApplied: false,
    projectGenerationApproved: false,
    mutationExecutionAllowed: false,
    mutationExpansionAllowed: false,
    generationRuntimeImplemented: false,
    generationExecutionAllowed: false,
    outputExecutionAllowed: false,
    inputExecutionAllowed: false,
    bundleExecutionAllowed: false,
    rollbackExecutionAllowed: false,
    recoveryExecutionAllowed: false,
    riskEnforcementAllowed: false,
    mitigationEnforcementEnabled: false,
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
    designContract,
    inputContract,
    outputContract,
    mutationBoundaryContract,
    approvalBoundaryContract,
    runtimeBoundaryContract,
    forbiddenActions,
    readonlyGuarantees,
    previewOnlyGuarantees,
    noExecutionGuarantees,
    cliPreviewPaths,
    scenarioCoverage,
    sections,
    summary: summarizeControlledProjectGenerationContractBundle(sections, cliPreviewPaths, scenarioCoverage)
  };
}

export function summarizeControlledProjectGenerationContractBundle(
  sections: readonly ControlledProjectGenerationContractBundleSection[],
  cliPreviewPaths: readonly string[] = createCliPreviewPaths(),
  scenarioCoverage: readonly string[] = createScenarioCoverage()
): ControlledProjectGenerationContractBundleSummary {
  const sortedSections = sortContractBundleSections(sections);
  const warnings = [
    ...sortedSections.flatMap((section) => section.warnings),
    "Controlled project generation contract bundle is descriptive only; no contract bundle execution or runtime execution is enabled."
  ];
  const recommendations = [
    ...sortedSections.flatMap((section) => section.recommendations),
    "Use this bundle for design audit only; require separate human approval before any runtime-capable behavior exists."
  ];
  return {
    totalSections: sortedSections.length,
    definedSections: sortedSections.filter((section) => section.status === "defined").length,
    partialSections: sortedSections.filter((section) => section.status === "partial").length,
    blockedSections: sortedSections.filter((section) => section.status === "blocked").length,
    notStartedSections: sortedSections.filter((section) => section.status === "not-started").length,
    previewOnlySections: sortedSections.filter((section) => section.status === "preview-only").length,
    totalEntries: sortedSections.reduce((sum, section) => sum + section.entryCount, 0),
    totalBlocked: sortedSections.reduce((sum, section) => sum + section.blockedCount, 0),
    totalForbidden: sortedSections.reduce((sum, section) => sum + section.forbiddenCount, 0),
    cliPreviewPathCount: cliPreviewPaths.length,
    scenarioCoverageCount: scenarioCoverage.length,
    readonly: sortedSections.length > 0 && sortedSections.every((section) => section.readonly),
    previewOnly: sortedSections.length > 0 && sortedSections.every((section) => section.previewOnly),
    noExecution: sortedSections.length > 0 && sortedSections.every((section) => section.noExecution),
    warnings: normalizeWarnings(warnings),
    recommendations: normalizeWarnings(recommendations),
    completeness: calculateControlledProjectGenerationContractBundleCompleteness(sortedSections)
  };
}

export function calculateControlledProjectGenerationContractBundleCompleteness(
  sections: readonly ControlledProjectGenerationContractBundleSection[]
): ControlledProjectGenerationContractBundleCompleteness {
  if (sections.length === 0) {
    return { score: 0, level: "incomplete", reason: "No controlled project generation contract bundle sections were provided." };
  }
  if (sections.some((section) => section.noExecution !== true || section.readonly !== true || section.previewOnly !== true)) {
    return { score: 0, level: "incomplete", reason: "One or more contract bundle sections lost read-only, preview-only, or no-execution guarantees." };
  }
  const score = Math.round(sections.reduce((sum, section) => sum + section.score, 0) / sections.length);
  return {
    score,
    level: score >= 90 ? "ready-for-design-audit" : score >= 75 ? "bundle-defined" : score >= 40 ? "partial" : "incomplete",
    reason: "Advisory contract bundle completeness score computed from deterministic read-only contract section scores."
  };
}

export function createContractBundleDesignSection(contract: ControlledProjectGenerationDesignContract): ControlledProjectGenerationContractBundleSection {
  return createContractBundleSection({ sectionType: "designContract", title: "Design contract", summary: "Aggregates the v12.0 controlled project generation design contract.", status: "defined", score: contract.summary.completeness.score, level: contract.summary.completeness.level, entryCount: contract.summary.totalSections, blockedCount: contract.summary.blockedSections, forbiddenCount: contract.summary.totalForbidden });
}

export function createContractBundleInputSection(contract: ControlledProjectGenerationInputContract): ControlledProjectGenerationContractBundleSection {
  return createContractBundleSection({ sectionType: "inputContract", title: "Input contract", summary: "Aggregates the v12.1 input contract without executing inputs.", status: "defined", score: contract.summary.completeness.score, level: contract.summary.completeness.level, entryCount: contract.summary.totalFields, blockedCount: contract.summary.blockedFieldCount, forbiddenCount: 0 });
}

export function createContractBundleOutputSection(contract: ControlledProjectGenerationOutputContract): ControlledProjectGenerationContractBundleSection {
  return createContractBundleSection({ sectionType: "outputContract", title: "Output contract", summary: "Aggregates the v12.2 output contract without executing outputs or writing files.", status: "defined", score: contract.summary.completeness.score, level: contract.summary.completeness.level, entryCount: contract.summary.totalFields, blockedCount: contract.summary.blockedOutputCount, forbiddenCount: contract.summary.forbiddenOutputCount });
}

export function createContractBundleMutationBoundarySection(contract: ControlledProjectGenerationMutationBoundaryContract): ControlledProjectGenerationContractBundleSection {
  return createContractBundleSection({ sectionType: "mutationBoundaryContract", title: "Mutation boundary contract", summary: "Aggregates the v12.3 mutation boundary contract without executing mutations.", status: "defined", score: contract.summary.completeness.score, level: contract.summary.completeness.level, entryCount: contract.summary.totalBoundaries, blockedCount: contract.summary.blockedCount, forbiddenCount: contract.summary.forbiddenCount });
}

export function createContractBundleApprovalBoundarySection(contract: ControlledProjectGenerationApprovalBoundaryContract): ControlledProjectGenerationContractBundleSection {
  return createContractBundleSection({ sectionType: "approvalBoundaryContract", title: "Approval boundary contract", summary: "Aggregates the v12.4 approval boundary contract without executing or persisting approvals.", status: "defined", score: contract.summary.completeness.score, level: contract.summary.completeness.level, entryCount: contract.summary.totalBoundaries, blockedCount: contract.summary.blockedCount, forbiddenCount: contract.summary.forbiddenAutoApprovalCount });
}

export function createContractBundleRuntimeBoundarySection(contract: ControlledProjectGenerationRuntimeBoundaryContract): ControlledProjectGenerationContractBundleSection {
  return createContractBundleSection({ sectionType: "runtimeBoundaryContract", title: "Runtime boundary contract", summary: "Aggregates the v12.5 runtime boundary contract without runtime execution, activation, routing, orchestration, or persistence.", status: "defined", score: contract.summary.completeness.score, level: contract.summary.completeness.level, entryCount: contract.summary.totalBoundaries, blockedCount: contract.summary.blockedCount, forbiddenCount: contract.summary.forbiddenCount });
}

export function createContractBundleForbiddenActionsSection(forbiddenActions: readonly string[]): ControlledProjectGenerationContractBundleSection {
  return createContractBundleSection({ sectionType: "forbiddenActions", title: "Forbidden actions", summary: "Lists actions forbidden across the controlled project generation contract bundle.", status: "defined", score: 100, level: "ready-for-design-audit", entryCount: forbiddenActions.length, blockedCount: 0, forbiddenCount: forbiddenActions.length });
}

export function createContractBundleGuaranteesSection(readonlyGuarantees: readonly string[], previewOnlyGuarantees: readonly string[], noExecutionGuarantees: readonly string[]): ControlledProjectGenerationContractBundleSection {
  return createContractBundleSection({ sectionType: "guarantees", title: "Read-only, preview-only, and no-execution guarantees", summary: "Aggregates the bundle safety guarantees as descriptive data only.", status: "defined", score: 100, level: "ready-for-design-audit", entryCount: readonlyGuarantees.length + previewOnlyGuarantees.length + noExecutionGuarantees.length, blockedCount: 0, forbiddenCount: noExecutionGuarantees.length });
}

export function createContractBundleCliPreviewSection(cliPreviewPaths: readonly string[]): ControlledProjectGenerationContractBundleSection {
  return createContractBundleSection({ sectionType: "cliPreviewPaths", title: "CLI preview paths", summary: "Lists deterministic stdout-only controlled-generation CLI preview paths.", status: "defined", score: 100, level: "ready-for-design-audit", entryCount: cliPreviewPaths.length, blockedCount: 0, forbiddenCount: 0 });
}

export function createContractBundleScenarioCoverageSection(scenarioCoverage: readonly string[]): ControlledProjectGenerationContractBundleSection {
  return createContractBundleSection({ sectionType: "scenarioCoverage", title: "Scenario coverage", summary: "Lists deterministic scenario checks covering the controlled project generation contract bundle.", status: "defined", score: 100, level: "ready-for-design-audit", entryCount: scenarioCoverage.length, blockedCount: 0, forbiddenCount: 0 });
}

export function sortContractBundleSections(sections: readonly ControlledProjectGenerationContractBundleSection[]): ControlledProjectGenerationContractBundleSection[] {
  const order = new Map<ControlledProjectGenerationContractBundleSectionType, number>([
    ["designContract", 1],
    ["inputContract", 2],
    ["outputContract", 3],
    ["mutationBoundaryContract", 4],
    ["approvalBoundaryContract", 5],
    ["runtimeBoundaryContract", 6],
    ["forbiddenActions", 7],
    ["guarantees", 8],
    ["cliPreviewPaths", 9],
    ["scenarioCoverage", 10]
  ]);
  return sortDeterministically(sections, (section) => `${String(order.get(section.sectionType) ?? 99).padStart(2, "0")}|${section.sectionType}`);
}

function createContractBundleSection(input: {
  sectionType: ControlledProjectGenerationContractBundleSectionType;
  title: string;
  summary: string;
  status: ControlledProjectGenerationContractBundleStatus;
  score: number;
  level: string;
  entryCount: number;
  blockedCount: number;
  forbiddenCount: number;
}): ControlledProjectGenerationContractBundleSection {
  return {
    ...input,
    warnings: normalizeWarnings([`${input.title} is included for read-only contract bundle review only.`]),
    recommendations: normalizeWarnings(["Keep this contract bundle descriptive until a separate controlled runtime design is approved."]),
    readonly: true,
    previewOnly: true,
    noExecution: true
  };
}

function contractMetadata(version: string, command: string): GovernanceMetadata {
  return {
    version,
    source: `${command}-bundle-source`,
    command: `governance ${command}`,
    readonly: true,
    previewOnly: true
  };
}

function createForbiddenActions(): string[] {
  return normalizeWarnings([
    "runtime execution",
    "runtime activation",
    "runtime routing",
    "runtime orchestration",
    "runtime persistence",
    "contract bundle execution",
    "project generation",
    "approval execution",
    "approval persistence",
    "mutation execution",
    "mutation expansion",
    "input execution",
    "output execution",
    "bundle execution",
    "rollback execution",
    "recovery execution",
    "risk enforcement",
    "generated-project validation execution",
    "dependency installation",
    "package.json mutation",
    "scaffold generation",
    "file creation",
    "file writing by default"
  ]);
}

function createReadonlyGuarantees(): string[] {
  return normalizeWarnings(["bundle is read-only", "stdout-only output", "no filesystem writes by default", "no state mutation"]);
}

function createPreviewOnlyGuarantees(): string[] {
  return normalizeWarnings(["bundle is preview-only", "contracts are design artifacts", "no runtime behavior is enabled"]);
}

function createNoExecutionGuarantees(): string[] {
  return normalizeWarnings(["no runtime execution", "no contract bundle execution", "no project generation", "no approval execution", "no mutation execution", "no input execution", "no output execution", "no validation execution"]);
}

function createCliPreviewPaths(): string[] {
  return normalizeWarnings([
    "governance controlled-project-generation-contract",
    "governance controlled-project-generation-input-contract",
    "governance controlled-project-generation-output-contract",
    "governance controlled-project-generation-mutation-boundary",
    "governance controlled-project-generation-approval-boundary",
    "governance controlled-project-generation-runtime-boundary",
    "governance controlled-project-generation-contract-bundle"
  ]);
}

function createScenarioCoverage(): string[] {
  return normalizeWarnings([
    "controlled-project-generation-contract-consistency",
    "controlled-project-generation-input-contract-consistency",
    "controlled-project-generation-output-contract-consistency",
    "controlled-project-generation-mutation-boundary-consistency",
    "controlled-project-generation-approval-boundary-consistency",
    "controlled-project-generation-runtime-boundary-consistency",
    "controlled-project-generation-contract-bundle-consistency",
    "controlled-project-generation-contract-bundle-section-ordering",
    "controlled-project-generation-contract-bundle-completeness",
    "controlled-project-generation-contract-bundle-rendering",
    "controlled-project-generation-contract-bundle-cli-output",
    "controlled-project-generation-contract-bundle-help-output"
  ]);
}
