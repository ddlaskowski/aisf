import type { GovernanceMetadata } from "./governanceMetadata.js";
import {
  createArtifactPipelineReadinessSection,
  createBuilderAgentReadinessSection,
  createCliInspectionReadinessSection,
  createGovernanceConsolidationReadinessSection,
  createHumanApprovalReadinessSection,
  createOrchestrationReadinessSection,
  createProjectGenerationReadinessAssessment,
  createProjectScaffoldingReadinessSection,
  createReadonlyContractReadinessSection,
  createRuntimeActivationDisabledReadinessSection,
  createSafePatchBoundaryReadinessSection,
  createSingleFileMutationBoundaryReadinessSection,
  createValidationSuiteReadinessSection
} from "./projectGenerationReadiness.js";
import { createProjectGenerationCapabilityMap } from "./projectGenerationCapabilityMap.js";
import { createProjectGenerationBlueprintPreview } from "./projectGenerationBlueprintPreview.js";
import { createProjectGenerationFilePlanPreview } from "./projectGenerationFilePlanPreview.js";
import { createProjectGenerationDependencyPlanPreview } from "./projectGenerationDependencyPlanPreview.js";
import { createProjectGenerationValidationPlanPreview } from "./projectGenerationValidationPlanPreview.js";
import { createProjectGenerationApprovalPlanPreview } from "./projectGenerationApprovalPlanPreview.js";
import { createProjectGenerationRiskPlanPreview } from "./projectGenerationRiskPlanPreview.js";
import { createProjectGenerationRollbackPlanPreview } from "./projectGenerationRollbackPlanPreview.js";
import { createProjectGenerationPlanBundlePreview } from "./projectGenerationPlanBundlePreview.js";
import { normalizeWarnings, sortDeterministically } from "./utils/governanceUtils.js";

export type ProjectGenerationReadinessCompletionAuditSectionType =
  | "readinessAssessment"
  | "capabilityMap"
  | "blueprintPreview"
  | "filePlanPreview"
  | "dependencyPlanPreview"
  | "validationPlanPreview"
  | "approvalPlanPreview"
  | "riskPlanPreview"
  | "rollbackPlanPreview"
  | "planBundlePreview"
  | "cliPreviewPaths"
  | "scenarioCoverage"
  | "readonlyGuarantees"
  | "noExecutionGuarantees";

export type ProjectGenerationReadinessCompletionAuditStatus =
  | "complete"
  | "partial"
  | "blocked"
  | "not-started"
  | "preview-only";

export type ProjectGenerationReadinessCompletionLevel =
  | "incomplete"
  | "partial"
  | "readiness-complete"
  | "ready-for-controlled-design";

export type ProjectGenerationReadinessCompletionScore = {
  score: number;
  level: ProjectGenerationReadinessCompletionLevel;
  reason: string;
};

export type ProjectGenerationReadinessCompletionAuditSection = {
  sectionType: ProjectGenerationReadinessCompletionAuditSectionType;
  title: string;
  summary: string;
  status: ProjectGenerationReadinessCompletionAuditStatus;
  score: number;
  level: string;
  entryCount: number;
  warnings: string[];
  recommendations: string[];
  readonly: boolean;
  previewOnly: boolean;
  noExecution: boolean;
};

export type ProjectGenerationReadinessCompletionAuditSummary = {
  totalSections: number;
  totalEntries: number;
  completeSections: number;
  partialSections: number;
  blockedSections: number;
  notStartedSections: number;
  previewOnlySections: number;
  cliPreviewPathCount: number;
  scenarioCoverageCount: number;
  readonly: boolean;
  previewOnly: boolean;
  noExecution: boolean;
  warnings: string[];
  recommendations: string[];
  completion: ProjectGenerationReadinessCompletionScore;
};

export type ProjectGenerationReadinessCompletionAudit = {
  schemaVersion: 1;
  title: string;
  metadata: GovernanceMetadata;
  readonly: true;
  previewOnly: true;
  completionAuditOnly: true;
  stdoutOnly: true;
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
  sections: ProjectGenerationReadinessCompletionAuditSection[];
  summary: ProjectGenerationReadinessCompletionAuditSummary;
};

export function createProjectGenerationReadinessCompletionAudit(input: {
  title: string;
  metadata: GovernanceMetadata;
  sections?: readonly ProjectGenerationReadinessCompletionAuditSection[];
}): ProjectGenerationReadinessCompletionAudit {
  const sections = sortReadinessCompletionAuditSections(input.sections ?? createDefaultProjectGenerationReadinessCompletionAuditSections());
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
    completionAuditOnly: true,
    stdoutOnly: true,
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
    summary: summarizeProjectGenerationReadinessCompletionAudit(sections)
  };
}

export function summarizeProjectGenerationReadinessCompletionAudit(
  sections: readonly ProjectGenerationReadinessCompletionAuditSection[]
): ProjectGenerationReadinessCompletionAuditSummary {
  const sortedSections = sortReadinessCompletionAuditSections(sections);
  const warnings = [
    ...sortedSections.flatMap((section) => section.warnings),
    "Project generation readiness completion audit is descriptive only; no v11.x plan is executed."
  ];
  const recommendations = [
    ...sortedSections.flatMap((section) => section.recommendations),
    "Require separate human-approved controlled design before any future project generation runtime exists."
  ];
  return {
    totalSections: sortedSections.length,
    totalEntries: sortedSections.reduce((sum, section) => sum + section.entryCount, 0),
    completeSections: sortedSections.filter((section) => section.status === "complete").length,
    partialSections: sortedSections.filter((section) => section.status === "partial").length,
    blockedSections: sortedSections.filter((section) => section.status === "blocked").length,
    notStartedSections: sortedSections.filter((section) => section.status === "not-started").length,
    previewOnlySections: sortedSections.filter((section) => section.status === "preview-only").length,
    cliPreviewPathCount: sortedSections.find((section) => section.sectionType === "cliPreviewPaths")?.entryCount ?? 0,
    scenarioCoverageCount: sortedSections.find((section) => section.sectionType === "scenarioCoverage")?.entryCount ?? 0,
    readonly: sortedSections.length > 0 && sortedSections.every((section) => section.readonly),
    previewOnly: sortedSections.length > 0 && sortedSections.every((section) => section.previewOnly),
    noExecution: sortedSections.length > 0 && sortedSections.every((section) => section.noExecution),
    warnings: normalizeWarnings(warnings),
    recommendations: normalizeWarnings(recommendations),
    completion: calculateProjectGenerationReadinessCompletionScore(sortedSections)
  };
}

export function calculateProjectGenerationReadinessCompletionScore(
  sections: readonly ProjectGenerationReadinessCompletionAuditSection[]
): ProjectGenerationReadinessCompletionScore {
  if (sections.length === 0) {
    return { score: 0, level: "incomplete", reason: "No readiness completion audit sections were provided." };
  }
  if (sections.some((section) => section.status === "blocked" || section.noExecution !== true)) {
    return { score: 0, level: "incomplete", reason: "One or more readiness completion audit sections are blocked or allow execution." };
  }
  const score = Math.round(sections.reduce((sum, section) => sum + section.score, 0) / sections.length);
  return {
    score,
    level: score >= 90 ? "ready-for-controlled-design" : score >= 75 ? "readiness-complete" : score >= 40 ? "partial" : "incomplete",
    reason: "Advisory readiness completion score computed from deterministic v11.x preview audit section scores."
  };
}

export function createReadinessAuditSection(): ProjectGenerationReadinessCompletionAuditSection {
  const readiness = createDefaultReadinessAssessment();
  return createAuditSection({
    sectionType: "readinessAssessment",
    title: "Readiness assessment",
    summary: "Audits v11.0 project generation readiness assessment coverage.",
    score: readiness.summary.readinessScore.score,
    level: readiness.summary.readinessScore.level,
    entryCount: readiness.summary.totalSections,
    warnings: readiness.summary.warnings,
    recommendations: readiness.summary.recommendations
  });
}

export function createCapabilityMapAuditSection(): ProjectGenerationReadinessCompletionAuditSection {
  const map = createProjectGenerationCapabilityMap({ title: "Project Generation Capability Map", metadata: sectionMetadata("capability-map") });
  const score = Math.round((map.capabilities.reduce((sum, capability) => sum + capability.readiness, 0) / map.capabilities.length) * 10);
  return createAuditSection({
    sectionType: "capabilityMap",
    title: "Capability map",
    summary: "Audits v11.1 capability map coverage for future project generation planning.",
    score,
    level: score >= 75 ? "readiness-complete" : "partial",
    entryCount: map.summary.totalCapabilities,
    warnings: map.summary.warnings,
    recommendations: map.summary.recommendations
  });
}

export function createBlueprintAuditSection(): ProjectGenerationReadinessCompletionAuditSection {
  const preview = createProjectGenerationBlueprintPreview({ title: "Project Generation Blueprint Preview", metadata: sectionMetadata("blueprint") });
  return createAuditSection({
    sectionType: "blueprintPreview",
    title: "Blueprint preview",
    summary: "Audits v11.2 blueprint preview coverage.",
    score: preview.summary.completeness.score,
    level: preview.summary.completeness.level,
    entryCount: preview.summary.totalSections,
    warnings: preview.summary.warnings,
    recommendations: preview.summary.recommendations
  });
}

export function createFilePlanAuditSection(): ProjectGenerationReadinessCompletionAuditSection {
  const preview = createProjectGenerationFilePlanPreview({ title: "Project Generation File Plan Preview", metadata: sectionMetadata("file-plan") });
  return createAuditSection({
    sectionType: "filePlanPreview",
    title: "File plan preview",
    summary: "Audits v11.3 file plan preview coverage without file creation.",
    score: preview.summary.completeness.score,
    level: preview.summary.completeness.level,
    entryCount: preview.summary.totalPlannedFiles,
    warnings: preview.summary.warnings,
    recommendations: preview.summary.recommendations
  });
}

export function createDependencyPlanAuditSection(): ProjectGenerationReadinessCompletionAuditSection {
  const preview = createProjectGenerationDependencyPlanPreview({ title: "Project Generation Dependency Plan Preview", metadata: sectionMetadata("dependency-plan") });
  return createAuditSection({
    sectionType: "dependencyPlanPreview",
    title: "Dependency plan preview",
    summary: "Audits v11.4 dependency plan preview coverage without dependency installation.",
    score: preview.summary.completeness.score,
    level: preview.summary.completeness.level,
    entryCount: preview.summary.totalDependencies,
    warnings: preview.summary.warnings,
    recommendations: preview.summary.recommendations
  });
}

export function createValidationPlanAuditSection(): ProjectGenerationReadinessCompletionAuditSection {
  const preview = createProjectGenerationValidationPlanPreview({ title: "Project Generation Validation Plan Preview", metadata: sectionMetadata("validation-plan") });
  return createAuditSection({
    sectionType: "validationPlanPreview",
    title: "Validation plan preview",
    summary: "Audits v11.5 validation plan preview coverage without validation execution.",
    score: preview.summary.completeness.score,
    level: preview.summary.completeness.level,
    entryCount: preview.summary.totalChecks,
    warnings: preview.summary.warnings,
    recommendations: preview.summary.recommendations
  });
}

export function createApprovalPlanAuditSection(): ProjectGenerationReadinessCompletionAuditSection {
  const preview = createProjectGenerationApprovalPlanPreview({ title: "Project Generation Approval Plan Preview", metadata: sectionMetadata("approval-plan") });
  return createAuditSection({
    sectionType: "approvalPlanPreview",
    title: "Approval plan preview",
    summary: "Audits v11.6 approval plan preview coverage without approval execution.",
    score: preview.summary.completeness.score,
    level: preview.summary.completeness.level,
    entryCount: preview.summary.totalGates,
    warnings: preview.summary.warnings,
    recommendations: preview.summary.recommendations
  });
}

export function createRiskPlanAuditSection(): ProjectGenerationReadinessCompletionAuditSection {
  const preview = createProjectGenerationRiskPlanPreview({ title: "Project Generation Risk Plan Preview", metadata: sectionMetadata("risk-plan") });
  return createAuditSection({
    sectionType: "riskPlanPreview",
    title: "Risk plan preview",
    summary: "Audits v11.7 risk plan preview coverage without risk enforcement.",
    score: 100 - preview.summary.exposure.score,
    level: preview.summary.exposure.level,
    entryCount: preview.summary.totalRisks,
    warnings: preview.summary.warnings,
    recommendations: preview.summary.recommendations
  });
}

export function createRollbackPlanAuditSection(): ProjectGenerationReadinessCompletionAuditSection {
  const preview = createProjectGenerationRollbackPlanPreview({ title: "Project Generation Rollback Plan Preview", metadata: sectionMetadata("rollback-plan") });
  return createAuditSection({
    sectionType: "rollbackPlanPreview",
    title: "Rollback plan preview",
    summary: "Audits v11.8 rollback plan preview coverage without rollback or recovery execution.",
    score: preview.summary.readiness.score,
    level: preview.summary.readiness.level,
    entryCount: preview.summary.totalSteps,
    warnings: preview.summary.warnings,
    recommendations: preview.summary.recommendations
  });
}

export function createPlanBundleAuditSection(): ProjectGenerationReadinessCompletionAuditSection {
  const preview = createProjectGenerationPlanBundlePreview({ title: "Project Generation Plan Bundle Preview", metadata: sectionMetadata("plan-bundle") });
  return createAuditSection({
    sectionType: "planBundlePreview",
    title: "Plan bundle preview",
    summary: "Audits v11.9 plan bundle preview coverage without bundle execution.",
    score: preview.summary.readiness.score,
    level: preview.summary.readiness.level,
    entryCount: preview.summary.totalSections,
    warnings: preview.summary.warnings,
    recommendations: preview.summary.recommendations
  });
}

export function createCliPreviewAuditSection(): ProjectGenerationReadinessCompletionAuditSection {
  return createAuditSection({
    sectionType: "cliPreviewPaths",
    title: "CLI preview paths",
    summary: "Audits read-only CLI preview paths for v11.0 through v11.9.",
    score: 100,
    level: "ready-for-controlled-design",
    entryCount: 10,
    warnings: [],
    recommendations: ["Keep all project-generation CLI previews stdout-only and read-only by default."]
  });
}

export function createScenarioCoverageAuditSection(): ProjectGenerationReadinessCompletionAuditSection {
  return createAuditSection({
    sectionType: "scenarioCoverage",
    title: "Scenario coverage",
    summary: "Audits deterministic project-generation scenario coverage for v11.0 through v11.9.",
    score: 100,
    level: "ready-for-controlled-design",
    entryCount: 10,
    warnings: [],
    recommendations: ["Keep project-generation scenario coverage local, deterministic, and filtered."]
  });
}

export function createReadonlyGuaranteeAuditSection(): ProjectGenerationReadinessCompletionAuditSection {
  return createAuditSection({
    sectionType: "readonlyGuarantees",
    title: "Read-only guarantees",
    summary: "Audits read-only, preview-only, stdout-only, and no-file-write guarantees across the v11.x stack.",
    score: 100,
    level: "ready-for-controlled-design",
    entryCount: 1,
    warnings: [],
    recommendations: ["Preserve read-only guarantees until a separate controlled generation design is approved."]
  });
}

export function createNoExecutionGuaranteeAuditSection(): ProjectGenerationReadinessCompletionAuditSection {
  return createAuditSection({
    sectionType: "noExecutionGuarantees",
    title: "No-execution guarantees",
    summary: "Audits disabled bundle execution, rollback, recovery, risk enforcement, approvals, validation execution, dependency installation, package mutation, scaffolding, file creation, project generation, and runtime routing.",
    score: 100,
    level: "ready-for-controlled-design",
    entryCount: 1,
    warnings: [],
    recommendations: ["Require separate explicit human approval before any future execution-capable design exists."]
  });
}

export function sortReadinessCompletionAuditSections(
  sections: readonly ProjectGenerationReadinessCompletionAuditSection[]
): ProjectGenerationReadinessCompletionAuditSection[] {
  const order = new Map<ProjectGenerationReadinessCompletionAuditSectionType, number>([
    ["readinessAssessment", 1],
    ["capabilityMap", 2],
    ["blueprintPreview", 3],
    ["filePlanPreview", 4],
    ["dependencyPlanPreview", 5],
    ["validationPlanPreview", 6],
    ["approvalPlanPreview", 7],
    ["riskPlanPreview", 8],
    ["rollbackPlanPreview", 9],
    ["planBundlePreview", 10],
    ["cliPreviewPaths", 11],
    ["scenarioCoverage", 12],
    ["readonlyGuarantees", 13],
    ["noExecutionGuarantees", 14]
  ]);
  return sortDeterministically(sections, (section) => `${String(order.get(section.sectionType) ?? 99).padStart(2, "0")}|${section.sectionType}`);
}

function createDefaultProjectGenerationReadinessCompletionAuditSections(): ProjectGenerationReadinessCompletionAuditSection[] {
  return [
    createReadinessAuditSection(),
    createCapabilityMapAuditSection(),
    createBlueprintAuditSection(),
    createFilePlanAuditSection(),
    createDependencyPlanAuditSection(),
    createValidationPlanAuditSection(),
    createApprovalPlanAuditSection(),
    createRiskPlanAuditSection(),
    createRollbackPlanAuditSection(),
    createPlanBundleAuditSection(),
    createCliPreviewAuditSection(),
    createScenarioCoverageAuditSection(),
    createReadonlyGuaranteeAuditSection(),
    createNoExecutionGuaranteeAuditSection()
  ];
}

function createAuditSection(input: {
  sectionType: ProjectGenerationReadinessCompletionAuditSectionType;
  title: string;
  summary: string;
  score: number;
  level: string;
  entryCount: number;
  warnings: readonly string[];
  recommendations: readonly string[];
}): ProjectGenerationReadinessCompletionAuditSection {
  return {
    sectionType: input.sectionType,
    title: input.title,
    summary: input.summary,
    status: input.score >= 75 ? "complete" : input.score > 0 ? "partial" : "not-started",
    score: input.score,
    level: input.level,
    entryCount: input.entryCount,
    warnings: normalizeWarnings(input.warnings),
    recommendations: normalizeWarnings(input.recommendations),
    readonly: true,
    previewOnly: true,
    noExecution: true
  };
}

function createDefaultReadinessAssessment() {
  return createProjectGenerationReadinessAssessment({
    title: "Project Generation Readiness Assessment",
    metadata: sectionMetadata("readiness-assessment"),
    sections: [
      createGovernanceConsolidationReadinessSection(),
      createArtifactPipelineReadinessSection(),
      createCliInspectionReadinessSection(),
      createValidationSuiteReadinessSection(),
      createReadonlyContractReadinessSection(),
      createSafePatchBoundaryReadinessSection(),
      createSingleFileMutationBoundaryReadinessSection(),
      createRuntimeActivationDisabledReadinessSection(),
      createBuilderAgentReadinessSection(),
      createProjectScaffoldingReadinessSection(),
      createOrchestrationReadinessSection(),
      createHumanApprovalReadinessSection()
    ]
  });
}

function sectionMetadata(source: string): GovernanceMetadata {
  return {
    version: "v11.10",
    source: `project-generation-readiness-completion-audit-${source}`,
    readonly: true,
    previewOnly: true
  };
}
