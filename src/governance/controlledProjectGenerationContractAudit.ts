import type { GovernanceMetadata } from "./governanceMetadata.js";
import { normalizeWarnings, sortDeterministically } from "./utils/governanceUtils.js";
import {
  createControlledProjectGenerationContractBundle,
  type ControlledProjectGenerationContractBundle
} from "./controlledProjectGenerationContractBundle.js";

export type ControlledProjectGenerationContractAuditSectionType =
  | "designContract"
  | "inputContract"
  | "outputContract"
  | "mutationBoundaryContract"
  | "approvalBoundaryContract"
  | "runtimeBoundaryContract"
  | "contractBundle"
  | "cliPreviewPaths"
  | "cliScopeFiltering"
  | "scenarioCoverage"
  | "forbiddenActions"
  | "guarantees";

export type ControlledProjectGenerationContractAuditStatus =
  | "complete"
  | "defined"
  | "partial"
  | "blocked"
  | "not-started"
  | "preview-only";

export type ControlledProjectGenerationContractAuditCompletenessLevel =
  | "incomplete"
  | "partial"
  | "audit-complete"
  | "ready-for-runtime-design-review";

export type ControlledProjectGenerationContractAuditCompleteness = {
  score: number;
  level: ControlledProjectGenerationContractAuditCompletenessLevel;
  reason: string;
};

export type ControlledProjectGenerationContractAuditSection = {
  sectionType: ControlledProjectGenerationContractAuditSectionType;
  title: string;
  summary: string;
  status: ControlledProjectGenerationContractAuditStatus;
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

export type ControlledProjectGenerationContractAuditSummary = {
  totalSections: number;
  completeSections: number;
  definedSections: number;
  partialSections: number;
  blockedSections: number;
  notStartedSections: number;
  previewOnlySections: number;
  totalEntries: number;
  totalBlocked: number;
  totalForbidden: number;
  cliPreviewPathCount: number;
  cliScopeCoverageCount: number;
  scenarioCoverageCount: number;
  readonly: boolean;
  previewOnly: boolean;
  noExecution: boolean;
  warnings: string[];
  recommendations: string[];
  completeness: ControlledProjectGenerationContractAuditCompleteness;
};

export type ControlledProjectGenerationContractAudit = {
  schemaVersion: 1;
  title: string;
  metadata: GovernanceMetadata;
  readonly: true;
  previewOnly: true;
  contractAuditOnly: true;
  stdoutOnly: true;
  contractAuditExecutionAllowed: false;
  contractExecutionAllowed: false;
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
  contractBundle: ControlledProjectGenerationContractBundle;
  cliPreviewPaths: string[];
  cliScopeCoverage: string[];
  scenarioCoverage: string[];
  forbiddenActions: string[];
  readonlyGuarantees: string[];
  previewOnlyGuarantees: string[];
  noExecutionGuarantees: string[];
  sections: ControlledProjectGenerationContractAuditSection[];
  summary: ControlledProjectGenerationContractAuditSummary;
};

export function createControlledProjectGenerationContractAudit(input: {
  title: string;
  metadata: GovernanceMetadata;
  contractBundle?: ControlledProjectGenerationContractBundle;
  sections?: readonly ControlledProjectGenerationContractAuditSection[];
}): ControlledProjectGenerationContractAudit {
  const contractBundle = input.contractBundle ?? createControlledProjectGenerationContractBundle({
    title: "Controlled Project Generation Contract Bundle",
    metadata: {
      version: "v12.6",
      source: "controlled-project-generation-contract-bundle-audit-source",
      command: "governance controlled-project-generation-contract-bundle",
      readonly: true,
      previewOnly: true
    }
  });
  const cliPreviewPaths = createContractAuditCliPreviewPaths(contractBundle);
  const cliScopeCoverage = createContractAuditCliScopeCoverage();
  const scenarioCoverage = createContractAuditScenarioCoverage();
  const forbiddenActions = createContractAuditForbiddenActions(contractBundle);
  const readonlyGuarantees = createContractAuditReadonlyGuarantees(contractBundle);
  const previewOnlyGuarantees = createContractAuditPreviewOnlyGuarantees(contractBundle);
  const noExecutionGuarantees = createContractAuditNoExecutionGuarantees(contractBundle);
  const sections = sortContractAuditSections(input.sections ?? [
    createContractAuditDesignSection(contractBundle),
    createContractAuditInputSection(contractBundle),
    createContractAuditOutputSection(contractBundle),
    createContractAuditMutationBoundarySection(contractBundle),
    createContractAuditApprovalBoundarySection(contractBundle),
    createContractAuditRuntimeBoundarySection(contractBundle),
    createContractAuditBundleSection(contractBundle),
    createContractAuditCliPreviewSection(cliPreviewPaths),
    createContractAuditCliScopeSection(cliScopeCoverage),
    createContractAuditScenarioCoverageSection(scenarioCoverage),
    createContractAuditForbiddenActionsSection(forbiddenActions),
    createContractAuditGuaranteesSection(readonlyGuarantees, previewOnlyGuarantees, noExecutionGuarantees)
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
    contractAuditOnly: true,
    stdoutOnly: true,
    contractAuditExecutionAllowed: false,
    contractExecutionAllowed: false,
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
    contractBundle,
    cliPreviewPaths,
    cliScopeCoverage,
    scenarioCoverage,
    forbiddenActions,
    readonlyGuarantees,
    previewOnlyGuarantees,
    noExecutionGuarantees,
    sections,
    summary: summarizeControlledProjectGenerationContractAudit(sections, cliPreviewPaths, cliScopeCoverage, scenarioCoverage)
  };
}

export function summarizeControlledProjectGenerationContractAudit(
  sections: readonly ControlledProjectGenerationContractAuditSection[],
  cliPreviewPaths: readonly string[] = createContractAuditCliPreviewPaths(),
  cliScopeCoverage: readonly string[] = createContractAuditCliScopeCoverage(),
  scenarioCoverage: readonly string[] = createContractAuditScenarioCoverage()
): ControlledProjectGenerationContractAuditSummary {
  const sortedSections = sortContractAuditSections(sections);
  const warnings = [
    ...sortedSections.flatMap((section) => section.warnings),
    "Controlled project generation contract audit is descriptive only; no contract execution, contract bundle execution, runtime execution, or project generation is enabled."
  ];
  const recommendations = [
    ...sortedSections.flatMap((section) => section.recommendations),
    "Use this audit for v12.x design-era review only; require separate human approval before any runtime-capable behavior exists."
  ];
  return {
    totalSections: sortedSections.length,
    completeSections: sortedSections.filter((section) => section.status === "complete").length,
    definedSections: sortedSections.filter((section) => section.status === "defined").length,
    partialSections: sortedSections.filter((section) => section.status === "partial").length,
    blockedSections: sortedSections.filter((section) => section.status === "blocked").length,
    notStartedSections: sortedSections.filter((section) => section.status === "not-started").length,
    previewOnlySections: sortedSections.filter((section) => section.status === "preview-only").length,
    totalEntries: sortedSections.reduce((sum, section) => sum + section.entryCount, 0),
    totalBlocked: sortedSections.reduce((sum, section) => sum + section.blockedCount, 0),
    totalForbidden: sortedSections.reduce((sum, section) => sum + section.forbiddenCount, 0),
    cliPreviewPathCount: cliPreviewPaths.length,
    cliScopeCoverageCount: cliScopeCoverage.length,
    scenarioCoverageCount: scenarioCoverage.length,
    readonly: sortedSections.length > 0 && sortedSections.every((section) => section.readonly),
    previewOnly: sortedSections.length > 0 && sortedSections.every((section) => section.previewOnly),
    noExecution: sortedSections.length > 0 && sortedSections.every((section) => section.noExecution),
    warnings: normalizeWarnings(warnings),
    recommendations: normalizeWarnings(recommendations),
    completeness: calculateControlledProjectGenerationContractAuditCompleteness(sortedSections)
  };
}

export function calculateControlledProjectGenerationContractAuditCompleteness(
  sections: readonly ControlledProjectGenerationContractAuditSection[]
): ControlledProjectGenerationContractAuditCompleteness {
  if (sections.length === 0) {
    return { score: 0, level: "incomplete", reason: "No controlled project generation contract audit sections were provided." };
  }
  if (sections.some((section) => section.noExecution !== true || section.readonly !== true || section.previewOnly !== true)) {
    return { score: 0, level: "incomplete", reason: "One or more contract audit sections lost read-only, preview-only, or no-execution guarantees." };
  }
  const score = Math.round(sections.reduce((sum, section) => sum + section.score, 0) / sections.length);
  return {
    score,
    level: score >= 95 ? "ready-for-runtime-design-review" : score >= 85 ? "audit-complete" : score >= 50 ? "partial" : "incomplete",
    reason: "Advisory contract audit completeness score computed from deterministic read-only audit section scores."
  };
}

export function createContractAuditDesignSection(bundle: ControlledProjectGenerationContractBundle): ControlledProjectGenerationContractAuditSection {
  return createContractAuditSection({ sectionType: "designContract", title: "Design contract audit", summary: "Audits the v12.0 controlled project generation design contract.", status: "complete", score: bundle.designContract.summary.completeness.score, level: bundle.designContract.summary.completeness.level, entryCount: bundle.designContract.summary.totalSections, blockedCount: bundle.designContract.summary.blockedSections, forbiddenCount: bundle.designContract.summary.totalForbidden });
}

export function createContractAuditInputSection(bundle: ControlledProjectGenerationContractBundle): ControlledProjectGenerationContractAuditSection {
  return createContractAuditSection({ sectionType: "inputContract", title: "Input contract audit", summary: "Audits the v12.1 input contract without executing inputs.", status: "complete", score: bundle.inputContract.summary.completeness.score, level: bundle.inputContract.summary.completeness.level, entryCount: bundle.inputContract.summary.totalFields, blockedCount: bundle.inputContract.summary.blockedFieldCount, forbiddenCount: 0 });
}

export function createContractAuditOutputSection(bundle: ControlledProjectGenerationContractBundle): ControlledProjectGenerationContractAuditSection {
  return createContractAuditSection({ sectionType: "outputContract", title: "Output contract audit", summary: "Audits the v12.2 output contract without executing outputs or writing files.", status: "complete", score: bundle.outputContract.summary.completeness.score, level: bundle.outputContract.summary.completeness.level, entryCount: bundle.outputContract.summary.totalFields, blockedCount: bundle.outputContract.summary.blockedOutputCount, forbiddenCount: bundle.outputContract.summary.forbiddenOutputCount });
}

export function createContractAuditMutationBoundarySection(bundle: ControlledProjectGenerationContractBundle): ControlledProjectGenerationContractAuditSection {
  return createContractAuditSection({ sectionType: "mutationBoundaryContract", title: "Mutation boundary contract audit", summary: "Audits the v12.3 mutation boundary contract without executing mutations.", status: "complete", score: bundle.mutationBoundaryContract.summary.completeness.score, level: bundle.mutationBoundaryContract.summary.completeness.level, entryCount: bundle.mutationBoundaryContract.summary.totalBoundaries, blockedCount: bundle.mutationBoundaryContract.summary.blockedCount, forbiddenCount: bundle.mutationBoundaryContract.summary.forbiddenCount });
}

export function createContractAuditApprovalBoundarySection(bundle: ControlledProjectGenerationContractBundle): ControlledProjectGenerationContractAuditSection {
  return createContractAuditSection({ sectionType: "approvalBoundaryContract", title: "Approval boundary contract audit", summary: "Audits the v12.4 approval boundary contract without executing or persisting approvals.", status: "complete", score: bundle.approvalBoundaryContract.summary.completeness.score, level: bundle.approvalBoundaryContract.summary.completeness.level, entryCount: bundle.approvalBoundaryContract.summary.totalBoundaries, blockedCount: bundle.approvalBoundaryContract.summary.blockedCount, forbiddenCount: bundle.approvalBoundaryContract.summary.forbiddenAutoApprovalCount });
}

export function createContractAuditRuntimeBoundarySection(bundle: ControlledProjectGenerationContractBundle): ControlledProjectGenerationContractAuditSection {
  return createContractAuditSection({ sectionType: "runtimeBoundaryContract", title: "Runtime boundary contract audit", summary: "Audits the v12.5 runtime boundary contract without runtime execution, activation, routing, orchestration, or persistence.", status: "complete", score: bundle.runtimeBoundaryContract.summary.completeness.score, level: bundle.runtimeBoundaryContract.summary.completeness.level, entryCount: bundle.runtimeBoundaryContract.summary.totalBoundaries, blockedCount: bundle.runtimeBoundaryContract.summary.blockedCount, forbiddenCount: bundle.runtimeBoundaryContract.summary.forbiddenCount });
}

export function createContractAuditBundleSection(bundle: ControlledProjectGenerationContractBundle): ControlledProjectGenerationContractAuditSection {
  return createContractAuditSection({ sectionType: "contractBundle", title: "Contract bundle audit", summary: "Audits the v12.6 controlled generation contract bundle without executing the bundle.", status: "complete", score: bundle.summary.completeness.score, level: bundle.summary.completeness.level, entryCount: bundle.summary.totalSections, blockedCount: bundle.summary.totalBlocked, forbiddenCount: bundle.summary.totalForbidden });
}

export function createContractAuditCliPreviewSection(cliPreviewPaths: readonly string[]): ControlledProjectGenerationContractAuditSection {
  return createContractAuditSection({ sectionType: "cliPreviewPaths", title: "CLI preview path audit", summary: "Audits deterministic stdout-only controlled-generation CLI preview paths.", status: "defined", score: 100, level: "ready-for-runtime-design-review", entryCount: cliPreviewPaths.length, blockedCount: 0, forbiddenCount: 0 });
}

export function createContractAuditCliScopeSection(cliScopeCoverage: readonly string[]): ControlledProjectGenerationContractAuditSection {
  return createContractAuditSection({ sectionType: "cliScopeFiltering", title: "CLI scope filtering audit", summary: "Audits deterministic CLI validation scope coverage introduced in v12.7.", status: "defined", score: 100, level: "ready-for-runtime-design-review", entryCount: cliScopeCoverage.length, blockedCount: 0, forbiddenCount: 0 });
}

export function createContractAuditScenarioCoverageSection(scenarioCoverage: readonly string[]): ControlledProjectGenerationContractAuditSection {
  return createContractAuditSection({ sectionType: "scenarioCoverage", title: "Scenario coverage audit", summary: "Audits deterministic scenario checks covering the controlled generation contract stack.", status: "defined", score: 100, level: "ready-for-runtime-design-review", entryCount: scenarioCoverage.length, blockedCount: 0, forbiddenCount: 0 });
}

export function createContractAuditForbiddenActionsSection(forbiddenActions: readonly string[]): ControlledProjectGenerationContractAuditSection {
  return createContractAuditSection({ sectionType: "forbiddenActions", title: "Forbidden action audit", summary: "Audits forbidden actions across the controlled generation contract stack.", status: "defined", score: 100, level: "ready-for-runtime-design-review", entryCount: forbiddenActions.length, blockedCount: 0, forbiddenCount: forbiddenActions.length });
}

export function createContractAuditGuaranteesSection(readonlyGuarantees: readonly string[], previewOnlyGuarantees: readonly string[], noExecutionGuarantees: readonly string[]): ControlledProjectGenerationContractAuditSection {
  return createContractAuditSection({ sectionType: "guarantees", title: "Guarantee audit", summary: "Audits read-only, preview-only, and no-execution guarantees as descriptive data only.", status: "defined", score: 100, level: "ready-for-runtime-design-review", entryCount: readonlyGuarantees.length + previewOnlyGuarantees.length + noExecutionGuarantees.length, blockedCount: 0, forbiddenCount: noExecutionGuarantees.length });
}

export function sortContractAuditSections(sections: readonly ControlledProjectGenerationContractAuditSection[]): ControlledProjectGenerationContractAuditSection[] {
  const order = new Map<ControlledProjectGenerationContractAuditSectionType, number>([
    ["designContract", 1],
    ["inputContract", 2],
    ["outputContract", 3],
    ["mutationBoundaryContract", 4],
    ["approvalBoundaryContract", 5],
    ["runtimeBoundaryContract", 6],
    ["contractBundle", 7],
    ["cliPreviewPaths", 8],
    ["cliScopeFiltering", 9],
    ["scenarioCoverage", 10],
    ["forbiddenActions", 11],
    ["guarantees", 12]
  ]);
  return sortDeterministically(sections, (section) => `${String(order.get(section.sectionType) ?? 99).padStart(2, "0")}|${section.sectionType}`);
}

function createContractAuditSection(input: {
  sectionType: ControlledProjectGenerationContractAuditSectionType;
  title: string;
  summary: string;
  status: ControlledProjectGenerationContractAuditStatus;
  score: number;
  level: string;
  entryCount: number;
  blockedCount: number;
  forbiddenCount: number;
}): ControlledProjectGenerationContractAuditSection {
  return {
    ...input,
    warnings: normalizeWarnings([`${input.title} is included for read-only contract audit review only.`]),
    recommendations: normalizeWarnings(["Keep this contract audit descriptive until a separate controlled runtime design is approved."]),
    readonly: true,
    previewOnly: true,
    noExecution: true
  };
}

function createContractAuditCliPreviewPaths(bundle?: ControlledProjectGenerationContractBundle): string[] {
  return normalizeWarnings([
    ...(bundle?.cliPreviewPaths ?? [
      "governance controlled-project-generation-contract",
      "governance controlled-project-generation-input-contract",
      "governance controlled-project-generation-output-contract",
      "governance controlled-project-generation-mutation-boundary",
      "governance controlled-project-generation-approval-boundary",
      "governance controlled-project-generation-runtime-boundary",
      "governance controlled-project-generation-contract-bundle"
    ]),
    "governance controlled-project-generation-contract-audit"
  ]);
}

function createContractAuditCliScopeCoverage(): string[] {
  return normalizeWarnings([
    "all",
    "artifact",
    "controlled-generation",
    "general",
    "governance",
    "project-generation"
  ]);
}

function createContractAuditScenarioCoverage(): string[] {
  return normalizeWarnings([
    "controlled-project-generation-contract-consistency",
    "controlled-project-generation-input-contract-consistency",
    "controlled-project-generation-output-contract-consistency",
    "controlled-project-generation-mutation-boundary-consistency",
    "controlled-project-generation-approval-boundary-consistency",
    "controlled-project-generation-runtime-boundary-consistency",
    "controlled-project-generation-contract-bundle-consistency",
    "cli-scope-filtering-consistency",
    "cli-scope-controlled-generation-selection",
    "controlled-project-generation-contract-audit-consistency",
    "controlled-project-generation-contract-audit-section-ordering",
    "controlled-project-generation-contract-audit-completeness",
    "controlled-project-generation-contract-audit-rendering",
    "controlled-project-generation-contract-audit-cli-output",
    "controlled-project-generation-contract-audit-help-output"
  ]);
}

function createContractAuditForbiddenActions(bundle: ControlledProjectGenerationContractBundle): string[] {
  return normalizeWarnings([
    ...bundle.forbiddenActions,
    "contract execution",
    "contract audit execution",
    "approval decision persistence",
    "runtime state persistence"
  ]);
}

function createContractAuditReadonlyGuarantees(bundle: ControlledProjectGenerationContractBundle): string[] {
  return normalizeWarnings([...bundle.readonlyGuarantees, "contract audit is read-only", "no audit file writes by default"]);
}

function createContractAuditPreviewOnlyGuarantees(bundle: ControlledProjectGenerationContractBundle): string[] {
  return normalizeWarnings([...bundle.previewOnlyGuarantees, "contract audit is preview-only", "audit reports design-era contract posture only"]);
}

function createContractAuditNoExecutionGuarantees(bundle: ControlledProjectGenerationContractBundle): string[] {
  return normalizeWarnings([...bundle.noExecutionGuarantees, "no contract execution", "no contract audit execution", "no runtime state persistence", "no approval persistence"]);
}
