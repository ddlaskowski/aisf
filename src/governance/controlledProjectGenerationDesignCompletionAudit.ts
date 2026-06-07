import type { GovernanceMetadata } from "./governanceMetadata.js";
import { normalizeWarnings, sortDeterministically } from "./utils/governanceUtils.js";
import {
  createControlledProjectGenerationContractAudit,
  type ControlledProjectGenerationContractAudit
} from "./controlledProjectGenerationContractAudit.js";
import {
  createControlledProjectGenerationContractBundle,
  type ControlledProjectGenerationContractBundle
} from "./controlledProjectGenerationContractBundle.js";
import {
  createControlledProjectGenerationContractExportPayload,
  createControlledProjectGenerationContractStack,
  type ControlledProjectGenerationContractExportPayload,
  type ControlledProjectGenerationContractStack
} from "./controlledProjectGenerationContractExport.js";

export type ControlledProjectGenerationDesignCompletionAuditSectionType =
  | "designContract"
  | "inputContract"
  | "outputContract"
  | "mutationBoundaryContract"
  | "approvalBoundaryContract"
  | "runtimeBoundaryContract"
  | "contractBundle"
  | "cliValidationSegmentation"
  | "contractAudit"
  | "contractExportPreview"
  | "scenarioCoverage"
  | "guarantees";

export type ControlledProjectGenerationDesignCompletionAuditStatus =
  | "complete"
  | "defined"
  | "partial"
  | "blocked"
  | "not-started"
  | "preview-only";

export type ControlledProjectGenerationDesignCompletionAuditLevel =
  | "incomplete"
  | "partial"
  | "design-complete"
  | "ready-for-runtime-architecture-design";

export type ControlledProjectGenerationDesignCompletionAuditScore = {
  score: number;
  level: ControlledProjectGenerationDesignCompletionAuditLevel;
  reason: string;
};

export type ControlledProjectGenerationDesignCompletionAuditSection = {
  sectionType: ControlledProjectGenerationDesignCompletionAuditSectionType;
  title: string;
  status: ControlledProjectGenerationDesignCompletionAuditStatus;
  score: number;
  level: string;
  entryCount: number;
  blockedCount: number;
  forbiddenCount: number;
  readonly: boolean;
  previewOnly: boolean;
  noExecution: boolean;
  warnings: string[];
  recommendations: string[];
};

export type ControlledProjectGenerationDesignCompletionAuditSummary = {
  totalSections: number;
  completeSections: number;
  definedSections: number;
  blockedSections: number;
  previewOnlySections: number;
  totalEntries: number;
  totalBlocked: number;
  totalForbidden: number;
  cliScopeCoverageCount: number;
  scenarioCoverageCount: number;
  exportCoverageCount: number;
  forbiddenActionCount: number;
  readonlyGuaranteeCount: number;
  previewOnlyGuaranteeCount: number;
  noExecutionGuaranteeCount: number;
  readonly: boolean;
  previewOnly: boolean;
  noExecution: boolean;
  warnings: string[];
  recommendations: string[];
  completionScore: ControlledProjectGenerationDesignCompletionAuditScore;
};

export type ControlledProjectGenerationDesignCompletionAudit = {
  schemaVersion: 1;
  title: string;
  metadata: GovernanceMetadata;
  readonly: true;
  previewOnly: true;
  stdoutOnly: true;
  completionAuditOnly: true;
  fileWriteAllowed: false;
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
  mutationExecutionAllowed: false;
  mutationExpansionAllowed: false;
  contractExecutionAllowed: false;
  contractBundleExecutionAllowed: false;
  contractAuditExecutionAllowed: false;
  contractExportExecutionAllowed: false;
  outputExecutionAllowed: false;
  inputExecutionAllowed: false;
  rollbackExecutionAllowed: false;
  recoveryExecutionAllowed: false;
  riskEnforcementAllowed: false;
  validationExecutionAllowed: false;
  generatedProjectValidationAllowed: false;
  dependencyInstallationAllowed: false;
  packageMutationAllowed: false;
  fileCreationAllowed: false;
  scaffoldGenerationEnabled: false;
  runtimeRoutingEnabled: false;
  runtimeActivationEnabled: false;
  policyEnforcementEnabled: false;
  projectGenerationEnabled: false;
  builderAgentRuntimeEnabled: false;
  contractStack: ControlledProjectGenerationContractStack;
  contractBundle: ControlledProjectGenerationContractBundle;
  contractAudit: ControlledProjectGenerationContractAudit;
  contractExportPreview: ControlledProjectGenerationContractExportPayload<unknown>;
  cliScopeCoverage: string[];
  scenarioCoverage: string[];
  exportCoverage: string[];
  forbiddenActions: string[];
  readonlyGuarantees: string[];
  previewOnlyGuarantees: string[];
  noExecutionGuarantees: string[];
  sections: ControlledProjectGenerationDesignCompletionAuditSection[];
  summary: ControlledProjectGenerationDesignCompletionAuditSummary;
};

export function createControlledProjectGenerationDesignCompletionAudit(input: {
  title: string;
  metadata: GovernanceMetadata;
  contractBundle?: ControlledProjectGenerationContractBundle;
  contractAudit?: ControlledProjectGenerationContractAudit;
  contractExportPreview?: ControlledProjectGenerationContractExportPayload<unknown>;
  sections?: readonly ControlledProjectGenerationDesignCompletionAuditSection[];
}): ControlledProjectGenerationDesignCompletionAudit {
  const contractBundle = input.contractBundle ?? createControlledProjectGenerationContractBundle({
    title: "Controlled Project Generation Contract Bundle",
    metadata: { version: "v12.6", source: "design-completion-audit", readonly: true, previewOnly: true }
  });
  const contractAudit = input.contractAudit ?? createControlledProjectGenerationContractAudit({
    title: "Controlled Project Generation Contract Audit",
    metadata: { version: "v12.8", source: "design-completion-audit", readonly: true, previewOnly: true },
    contractBundle
  });
  const contractStack = createControlledProjectGenerationContractStack({ contractBundle, contractAudit });
  const contractExportPreview = input.contractExportPreview ?? createControlledProjectGenerationContractExportPayload({
    title: "Controlled Project Generation Contract Stack Export Preview",
    format: "json",
    dataType: "contract-stack",
    metadata: { version: "v12.9", source: "design-completion-audit", readonly: true, previewOnly: true },
    data: {
      dataType: "contract-stack",
      includedContractSections: [
        "designContract",
        "inputContract",
        "outputContract",
        "mutationBoundaryContract",
        "approvalBoundaryContract",
        "runtimeBoundaryContract",
        "contractBundle",
        "contractAudit"
      ],
      exportPreviewOnly: true,
      fileWriteAllowed: false,
      contractExecutionAllowed: false,
      runtimeExecutionAllowed: false,
      projectGenerationEnabled: false
    }
  });
  const cliScopeCoverage = createDesignCompletionCliScopeCoverage();
  const scenarioCoverage = createDesignCompletionScenarioCoverage();
  const exportCoverage = createDesignCompletionExportCoverage();
  const forbiddenActions = createDesignCompletionForbiddenActions(contractAudit, contractExportPreview);
  const readonlyGuarantees = createDesignCompletionReadonlyGuarantees(contractAudit, contractExportPreview);
  const previewOnlyGuarantees = createDesignCompletionPreviewOnlyGuarantees(contractAudit, contractExportPreview);
  const noExecutionGuarantees = createDesignCompletionNoExecutionGuarantees(contractAudit, contractExportPreview);
  const sections = sortDesignCompletionAuditSections(input.sections ?? [
    createDesignCompletionAuditSection(contractBundle),
    createInputCompletionAuditSection(contractBundle),
    createOutputCompletionAuditSection(contractBundle),
    createMutationBoundaryCompletionAuditSection(contractBundle),
    createApprovalBoundaryCompletionAuditSection(contractBundle),
    createRuntimeBoundaryCompletionAuditSection(contractBundle),
    createBundleCompletionAuditSection(contractBundle),
    createCliSegmentationCompletionAuditSection(cliScopeCoverage),
    createAuditCompletionAuditSection(contractAudit),
    createExportCompletionAuditSection(contractExportPreview),
    createScenarioCoverageCompletionAuditSection(scenarioCoverage),
    createGuaranteeCompletionAuditSection(readonlyGuarantees, previewOnlyGuarantees, noExecutionGuarantees)
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
    stdoutOnly: true,
    completionAuditOnly: true,
    fileWriteAllowed: false,
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
    mutationExecutionAllowed: false,
    mutationExpansionAllowed: false,
    contractExecutionAllowed: false,
    contractBundleExecutionAllowed: false,
    contractAuditExecutionAllowed: false,
    contractExportExecutionAllowed: false,
    outputExecutionAllowed: false,
    inputExecutionAllowed: false,
    rollbackExecutionAllowed: false,
    recoveryExecutionAllowed: false,
    riskEnforcementAllowed: false,
    validationExecutionAllowed: false,
    generatedProjectValidationAllowed: false,
    dependencyInstallationAllowed: false,
    packageMutationAllowed: false,
    fileCreationAllowed: false,
    scaffoldGenerationEnabled: false,
    runtimeRoutingEnabled: false,
    runtimeActivationEnabled: false,
    policyEnforcementEnabled: false,
    projectGenerationEnabled: false,
    builderAgentRuntimeEnabled: false,
    contractStack,
    contractBundle,
    contractAudit,
    contractExportPreview,
    cliScopeCoverage,
    scenarioCoverage,
    exportCoverage,
    forbiddenActions,
    readonlyGuarantees,
    previewOnlyGuarantees,
    noExecutionGuarantees,
    sections,
    summary: summarizeControlledProjectGenerationDesignCompletionAudit(sections, {
      cliScopeCoverage,
      scenarioCoverage,
      exportCoverage,
      forbiddenActions,
      readonlyGuarantees,
      previewOnlyGuarantees,
      noExecutionGuarantees
    })
  };
}

export function summarizeControlledProjectGenerationDesignCompletionAudit(
  sections: readonly ControlledProjectGenerationDesignCompletionAuditSection[],
  coverage: {
    cliScopeCoverage?: readonly string[];
    scenarioCoverage?: readonly string[];
    exportCoverage?: readonly string[];
    forbiddenActions?: readonly string[];
    readonlyGuarantees?: readonly string[];
    previewOnlyGuarantees?: readonly string[];
    noExecutionGuarantees?: readonly string[];
  } = {}
): ControlledProjectGenerationDesignCompletionAuditSummary {
  const sortedSections = sortDesignCompletionAuditSections(sections);
  const warnings = [
    ...sortedSections.flatMap((section) => section.warnings),
    "Controlled project generation design completion audit is read-only and does not introduce runtime architecture or execution."
  ];
  const recommendations = [
    ...sortedSections.flatMap((section) => section.recommendations),
    "Treat v12.x as design-complete only; require a separate runtime architecture design before any runtime-capable behavior exists."
  ];
  return {
    totalSections: sortedSections.length,
    completeSections: sortedSections.filter((section) => section.status === "complete").length,
    definedSections: sortedSections.filter((section) => section.status === "defined").length,
    blockedSections: sortedSections.filter((section) => section.status === "blocked").length,
    previewOnlySections: sortedSections.filter((section) => section.status === "preview-only").length,
    totalEntries: sortedSections.reduce((sum, section) => sum + section.entryCount, 0),
    totalBlocked: sortedSections.reduce((sum, section) => sum + section.blockedCount, 0),
    totalForbidden: sortedSections.reduce((sum, section) => sum + section.forbiddenCount, 0),
    cliScopeCoverageCount: (coverage.cliScopeCoverage ?? createDesignCompletionCliScopeCoverage()).length,
    scenarioCoverageCount: (coverage.scenarioCoverage ?? createDesignCompletionScenarioCoverage()).length,
    exportCoverageCount: (coverage.exportCoverage ?? createDesignCompletionExportCoverage()).length,
    forbiddenActionCount: (coverage.forbiddenActions ?? []).length,
    readonlyGuaranteeCount: (coverage.readonlyGuarantees ?? []).length,
    previewOnlyGuaranteeCount: (coverage.previewOnlyGuarantees ?? []).length,
    noExecutionGuaranteeCount: (coverage.noExecutionGuarantees ?? []).length,
    readonly: sortedSections.length > 0 && sortedSections.every((section) => section.readonly),
    previewOnly: sortedSections.length > 0 && sortedSections.every((section) => section.previewOnly),
    noExecution: sortedSections.length > 0 && sortedSections.every((section) => section.noExecution),
    warnings: normalizeWarnings(warnings),
    recommendations: normalizeWarnings(recommendations),
    completionScore: calculateControlledProjectGenerationDesignCompletionScore(sortedSections)
  };
}

export function calculateControlledProjectGenerationDesignCompletionScore(
  sections: readonly ControlledProjectGenerationDesignCompletionAuditSection[]
): ControlledProjectGenerationDesignCompletionAuditScore {
  if (sections.length === 0) {
    return { score: 0, level: "incomplete", reason: "No controlled generation design completion audit sections were provided." };
  }
  if (sections.some((section) => section.readonly !== true || section.previewOnly !== true || section.noExecution !== true)) {
    return { score: 0, level: "incomplete", reason: "One or more design completion sections lost read-only, preview-only, or no-execution guarantees." };
  }
  const score = Math.round(sections.reduce((sum, section) => sum + section.score, 0) / sections.length);
  return {
    score,
    level: score >= 94 ? "ready-for-runtime-architecture-design" : score >= 85 ? "design-complete" : score >= 50 ? "partial" : "incomplete",
    reason: "Advisory design completion score computed from deterministic read-only v12.x section scores."
  };
}

export function createDesignCompletionAuditSection(bundle: ControlledProjectGenerationContractBundle): ControlledProjectGenerationDesignCompletionAuditSection {
  return createSection({ sectionType: "designContract", title: "Design contract completion", status: "complete", score: bundle.designContract.summary.completeness.score, level: bundle.designContract.summary.completeness.level, entryCount: bundle.designContract.summary.totalSections, blockedCount: bundle.designContract.summary.blockedSections, forbiddenCount: bundle.designContract.summary.totalForbidden });
}

export function createInputCompletionAuditSection(bundle: ControlledProjectGenerationContractBundle): ControlledProjectGenerationDesignCompletionAuditSection {
  return createSection({ sectionType: "inputContract", title: "Input contract completion", status: "complete", score: bundle.inputContract.summary.completeness.score, level: bundle.inputContract.summary.completeness.level, entryCount: bundle.inputContract.summary.totalFields, blockedCount: bundle.inputContract.summary.blockedFieldCount, forbiddenCount: 0 });
}

export function createOutputCompletionAuditSection(bundle: ControlledProjectGenerationContractBundle): ControlledProjectGenerationDesignCompletionAuditSection {
  return createSection({ sectionType: "outputContract", title: "Output contract completion", status: "complete", score: bundle.outputContract.summary.completeness.score, level: bundle.outputContract.summary.completeness.level, entryCount: bundle.outputContract.summary.totalFields, blockedCount: bundle.outputContract.summary.blockedOutputCount, forbiddenCount: bundle.outputContract.summary.forbiddenOutputCount });
}

export function createMutationBoundaryCompletionAuditSection(bundle: ControlledProjectGenerationContractBundle): ControlledProjectGenerationDesignCompletionAuditSection {
  return createSection({ sectionType: "mutationBoundaryContract", title: "Mutation boundary completion", status: "complete", score: bundle.mutationBoundaryContract.summary.completeness.score, level: bundle.mutationBoundaryContract.summary.completeness.level, entryCount: bundle.mutationBoundaryContract.summary.totalBoundaries, blockedCount: bundle.mutationBoundaryContract.summary.blockedCount, forbiddenCount: bundle.mutationBoundaryContract.summary.forbiddenCount });
}

export function createApprovalBoundaryCompletionAuditSection(bundle: ControlledProjectGenerationContractBundle): ControlledProjectGenerationDesignCompletionAuditSection {
  return createSection({ sectionType: "approvalBoundaryContract", title: "Approval boundary completion", status: "complete", score: bundle.approvalBoundaryContract.summary.completeness.score, level: bundle.approvalBoundaryContract.summary.completeness.level, entryCount: bundle.approvalBoundaryContract.summary.totalBoundaries, blockedCount: bundle.approvalBoundaryContract.summary.blockedCount, forbiddenCount: bundle.approvalBoundaryContract.summary.forbiddenAutoApprovalCount });
}

export function createRuntimeBoundaryCompletionAuditSection(bundle: ControlledProjectGenerationContractBundle): ControlledProjectGenerationDesignCompletionAuditSection {
  return createSection({ sectionType: "runtimeBoundaryContract", title: "Runtime boundary completion", status: "complete", score: bundle.runtimeBoundaryContract.summary.completeness.score, level: bundle.runtimeBoundaryContract.summary.completeness.level, entryCount: bundle.runtimeBoundaryContract.summary.totalBoundaries, blockedCount: bundle.runtimeBoundaryContract.summary.blockedCount, forbiddenCount: bundle.runtimeBoundaryContract.summary.forbiddenCount });
}

export function createBundleCompletionAuditSection(bundle: ControlledProjectGenerationContractBundle): ControlledProjectGenerationDesignCompletionAuditSection {
  return createSection({ sectionType: "contractBundle", title: "Contract bundle completion", status: "complete", score: bundle.summary.completeness.score, level: bundle.summary.completeness.level, entryCount: bundle.summary.totalSections, blockedCount: bundle.summary.totalBlocked, forbiddenCount: bundle.summary.totalForbidden });
}

export function createCliSegmentationCompletionAuditSection(cliScopeCoverage: readonly string[]): ControlledProjectGenerationDesignCompletionAuditSection {
  return createSection({ sectionType: "cliValidationSegmentation", title: "CLI validation segmentation completion", status: "complete", score: 100, level: "ready-for-runtime-architecture-design", entryCount: cliScopeCoverage.length, blockedCount: 0, forbiddenCount: 0 });
}

export function createAuditCompletionAuditSection(audit: ControlledProjectGenerationContractAudit): ControlledProjectGenerationDesignCompletionAuditSection {
  return createSection({ sectionType: "contractAudit", title: "Contract audit completion", status: "complete", score: audit.summary.completeness.score, level: audit.summary.completeness.level, entryCount: audit.summary.totalSections, blockedCount: audit.summary.totalBlocked, forbiddenCount: audit.summary.totalForbidden });
}

export function createExportCompletionAuditSection(exportPayload: ControlledProjectGenerationContractExportPayload<unknown>): ControlledProjectGenerationDesignCompletionAuditSection {
  return createSection({ sectionType: "contractExportPreview", title: "Contract export preview completion", status: "complete", score: 100, level: "ready-for-runtime-architecture-design", entryCount: exportPayload.includedContractSections.length, blockedCount: 0, forbiddenCount: 0 });
}

export function createScenarioCoverageCompletionAuditSection(scenarioCoverage: readonly string[]): ControlledProjectGenerationDesignCompletionAuditSection {
  return createSection({ sectionType: "scenarioCoverage", title: "Scenario coverage completion", status: "complete", score: 100, level: "ready-for-runtime-architecture-design", entryCount: scenarioCoverage.length, blockedCount: 0, forbiddenCount: 0 });
}

export function createGuaranteeCompletionAuditSection(readonlyGuarantees: readonly string[], previewOnlyGuarantees: readonly string[], noExecutionGuarantees: readonly string[]): ControlledProjectGenerationDesignCompletionAuditSection {
  return createSection({ sectionType: "guarantees", title: "Guarantee completion", status: "complete", score: 100, level: "ready-for-runtime-architecture-design", entryCount: readonlyGuarantees.length + previewOnlyGuarantees.length + noExecutionGuarantees.length, blockedCount: 0, forbiddenCount: noExecutionGuarantees.length });
}

export function sortDesignCompletionAuditSections(sections: readonly ControlledProjectGenerationDesignCompletionAuditSection[]): ControlledProjectGenerationDesignCompletionAuditSection[] {
  const order = new Map<ControlledProjectGenerationDesignCompletionAuditSectionType, number>([
    ["designContract", 1],
    ["inputContract", 2],
    ["outputContract", 3],
    ["mutationBoundaryContract", 4],
    ["approvalBoundaryContract", 5],
    ["runtimeBoundaryContract", 6],
    ["contractBundle", 7],
    ["cliValidationSegmentation", 8],
    ["contractAudit", 9],
    ["contractExportPreview", 10],
    ["scenarioCoverage", 11],
    ["guarantees", 12]
  ]);
  return sortDeterministically(sections, (section) => `${String(order.get(section.sectionType) ?? 99).padStart(2, "0")}|${section.sectionType}`);
}

function createSection(input: {
  sectionType: ControlledProjectGenerationDesignCompletionAuditSectionType;
  title: string;
  status: ControlledProjectGenerationDesignCompletionAuditStatus;
  score: number;
  level: string;
  entryCount: number;
  blockedCount: number;
  forbiddenCount: number;
}): ControlledProjectGenerationDesignCompletionAuditSection {
  return {
    ...input,
    readonly: true,
    previewOnly: true,
    noExecution: true,
    warnings: normalizeWarnings([`${input.title} is included for read-only design completion audit only.`]),
    recommendations: normalizeWarnings(["Keep v12.x completion audit descriptive until separate runtime architecture work is explicitly approved."])
  };
}

function createDesignCompletionCliScopeCoverage(): string[] {
  return normalizeWarnings(["all", "artifact", "controlled-generation", "general", "governance", "project-generation"]);
}

function createDesignCompletionScenarioCoverage(): string[] {
  return normalizeWarnings([
    "controlled-project-generation-contract-consistency",
    "controlled-project-generation-input-contract-consistency",
    "controlled-project-generation-output-contract-consistency",
    "controlled-project-generation-mutation-boundary-consistency",
    "controlled-project-generation-approval-boundary-consistency",
    "controlled-project-generation-runtime-boundary-consistency",
    "controlled-project-generation-contract-bundle-consistency",
    "cli-scope-filtering-consistency",
    "controlled-project-generation-contract-audit-consistency",
    "controlled-project-generation-contract-export-consistency",
    "controlled-project-generation-design-completion-audit-consistency",
    "controlled-project-generation-design-completion-audit-section-ordering",
    "controlled-project-generation-design-completion-audit-score",
    "controlled-project-generation-design-completion-audit-rendering",
    "controlled-project-generation-design-completion-audit-cli-output",
    "controlled-project-generation-design-completion-audit-help-output"
  ]);
}

function createDesignCompletionExportCoverage(): string[] {
  return normalizeWarnings(["contract-bundle json", "contract-bundle markdown", "contract-audit json", "contract-audit markdown", "contract-stack json", "contract-stack markdown"]);
}

function createDesignCompletionForbiddenActions(audit: ControlledProjectGenerationContractAudit, exportPayload: ControlledProjectGenerationContractExportPayload<unknown>): string[] {
  return normalizeWarnings([...audit.forbiddenActions, "contract export execution", "design completion audit execution", ...(exportPayload.contractExecutionAllowed === false ? ["contract execution"] : [])]);
}

function createDesignCompletionReadonlyGuarantees(audit: ControlledProjectGenerationContractAudit, exportPayload: ControlledProjectGenerationContractExportPayload<unknown>): string[] {
  return normalizeWarnings([...audit.readonlyGuarantees, "design completion audit is read-only", exportPayload.readonly ? "contract export preview is read-only" : "contract export preview readonly missing"]);
}

function createDesignCompletionPreviewOnlyGuarantees(audit: ControlledProjectGenerationContractAudit, exportPayload: ControlledProjectGenerationContractExportPayload<unknown>): string[] {
  return normalizeWarnings([...audit.previewOnlyGuarantees, "design completion audit is preview-only", exportPayload.previewOnly ? "contract export preview is preview-only" : "contract export preview missing"]);
}

function createDesignCompletionNoExecutionGuarantees(audit: ControlledProjectGenerationContractAudit, exportPayload: ControlledProjectGenerationContractExportPayload<unknown>): string[] {
  return normalizeWarnings([...audit.noExecutionGuarantees, "no design completion audit execution", "no contract export execution", exportPayload.contractExecutionAllowed === false ? "no exported contract execution" : "export contract execution flag missing"]);
}
