import type { GovernanceMetadata } from "./governanceMetadata.js";
import { createProjectGenerationApprovalPlanPreview } from "./projectGenerationApprovalPlanPreview.js";
import { createProjectGenerationBlueprintPreview } from "./projectGenerationBlueprintPreview.js";
import { createProjectGenerationDependencyPlanPreview } from "./projectGenerationDependencyPlanPreview.js";
import { createProjectGenerationFilePlanPreview } from "./projectGenerationFilePlanPreview.js";
import { createProjectGenerationRiskPlanPreview } from "./projectGenerationRiskPlanPreview.js";
import { createProjectGenerationRollbackPlanPreview } from "./projectGenerationRollbackPlanPreview.js";
import { createProjectGenerationValidationPlanPreview } from "./projectGenerationValidationPlanPreview.js";
import { normalizeWarnings, sortDeterministically } from "./utils/governanceUtils.js";

export type ProjectGenerationPlanBundleSectionType =
  | "blueprint"
  | "filePlan"
  | "dependencyPlan"
  | "validationPlan"
  | "approvalPlan"
  | "riskPlan"
  | "rollbackPlan"
  | "governanceSummary"
  | "readonlyGuarantees";

export type ProjectGenerationPlanBundleSectionStatus =
  | "preview"
  | "ready-for-review"
  | "partial"
  | "blocked"
  | "not-started";

export type ProjectGenerationPlanBundleReadinessLevel =
  | "incomplete"
  | "partial"
  | "review-ready"
  | "ready-for-design";

export type ProjectGenerationPlanBundleReadiness = {
  score: number;
  level: ProjectGenerationPlanBundleReadinessLevel;
  reason: string;
};

export type ProjectGenerationPlanBundleSection = {
  sectionType: ProjectGenerationPlanBundleSectionType;
  title: string;
  summary: string;
  status: ProjectGenerationPlanBundleSectionStatus;
  score: number;
  level: string;
  entryCount: number;
  blockedCount: number;
  approvalRequiredCount: number;
  warnings: string[];
  recommendations: string[];
  readonly: boolean;
  previewOnly: boolean;
};

export type ProjectGenerationPlanBundleSummary = {
  totalSections: number;
  totalEntries: number;
  totalBlockedCount: number;
  totalApprovalRequiredCount: number;
  readonly: boolean;
  previewOnly: boolean;
  warnings: string[];
  recommendations: string[];
  readiness: ProjectGenerationPlanBundleReadiness;
};

export type ProjectGenerationPlanBundlePreview = {
  schemaVersion: 1;
  title: string;
  metadata: GovernanceMetadata;
  readonly: true;
  previewOnly: true;
  planBundlePreviewOnly: true;
  stdoutOnly: true;
  bundleExecutionAllowed: false;
  bundleWriteAllowed: false;
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
  sections: ProjectGenerationPlanBundleSection[];
  summary: ProjectGenerationPlanBundleSummary;
};

export function createProjectGenerationPlanBundlePreview(input: {
  title: string;
  metadata: GovernanceMetadata;
  sections?: readonly ProjectGenerationPlanBundleSection[];
}): ProjectGenerationPlanBundlePreview {
  const sections = sortPlanBundleSections(input.sections ?? createDefaultProjectGenerationPlanBundleSections());
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
    planBundlePreviewOnly: true,
    stdoutOnly: true,
    bundleExecutionAllowed: false,
    bundleWriteAllowed: false,
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
    summary: summarizeProjectGenerationPlanBundlePreview(sections)
  };
}

export function summarizeProjectGenerationPlanBundlePreview(sections: readonly ProjectGenerationPlanBundleSection[]): ProjectGenerationPlanBundleSummary {
  const sortedSections = sortPlanBundleSections(sections);
  const warnings = [
    ...sortedSections.flatMap((section) => section.warnings),
    "Project generation plan bundle preview is descriptive only; no bundle or contained plan is executed."
  ];
  const recommendations = [
    ...sortedSections.flatMap((section) => section.recommendations),
    "Require separate human-approved project generation design before any future bundle execution or file-writing workflow."
  ];
  return {
    totalSections: sortedSections.length,
    totalEntries: sortedSections.reduce((sum, section) => sum + section.entryCount, 0),
    totalBlockedCount: sortedSections.reduce((sum, section) => sum + section.blockedCount, 0),
    totalApprovalRequiredCount: sortedSections.reduce((sum, section) => sum + section.approvalRequiredCount, 0),
    readonly: sortedSections.length > 0 && sortedSections.every((section) => section.readonly),
    previewOnly: sortedSections.length > 0 && sortedSections.every((section) => section.previewOnly),
    warnings: normalizeWarnings(warnings),
    recommendations: normalizeWarnings(recommendations),
    readiness: calculateProjectGenerationPlanBundleReadiness(sortedSections)
  };
}

export function calculateProjectGenerationPlanBundleReadiness(sections: readonly ProjectGenerationPlanBundleSection[]): ProjectGenerationPlanBundleReadiness {
  if (sections.length === 0) {
    return { score: 0, level: "incomplete", reason: "No plan bundle sections were provided." };
  }
  if (sections.some((section) => section.status === "blocked" || section.blockedCount > 0)) {
    return { score: 0, level: "incomplete", reason: "One or more plan bundle sections are blocked." };
  }
  const score = Math.round(sections.reduce((sum, section) => sum + section.score, 0) / sections.length);
  return {
    score,
    level: score >= 90 ? "ready-for-design" : score >= 75 ? "review-ready" : score >= 40 ? "partial" : "incomplete",
    reason: "Advisory plan bundle readiness score computed from deterministic preview section scores."
  };
}

export function createPlanBundleBlueprintSection(): ProjectGenerationPlanBundleSection {
  const preview = createProjectGenerationBlueprintPreview({ title: "Project Generation Blueprint Preview", metadata: sectionMetadata("blueprint") });
  return createPlanBundleSection({
    sectionType: "blueprint",
    title: "Blueprint preview",
    summary: "Aggregates future project blueprint planning.",
    score: preview.summary.completeness.score,
    level: preview.summary.completeness.level,
    entryCount: preview.summary.totalSections,
    blockedCount: 0,
    approvalRequiredCount: 0,
    warnings: preview.summary.warnings,
    recommendations: preview.summary.recommendations
  });
}

export function createPlanBundleFilePlanSection(): ProjectGenerationPlanBundleSection {
  const preview = createProjectGenerationFilePlanPreview({ title: "Project Generation File Plan Preview", metadata: sectionMetadata("file-plan") });
  return createPlanBundleSection({
    sectionType: "filePlan",
    title: "File plan preview",
    summary: "Aggregates future file planning without file creation.",
    score: preview.summary.completeness.score,
    level: preview.summary.completeness.level,
    entryCount: preview.summary.totalPlannedFiles,
    blockedCount: preview.summary.blockedCount,
    approvalRequiredCount: preview.summary.approvalRequiredCount,
    warnings: preview.summary.warnings,
    recommendations: preview.summary.recommendations
  });
}

export function createPlanBundleDependencyPlanSection(): ProjectGenerationPlanBundleSection {
  const preview = createProjectGenerationDependencyPlanPreview({ title: "Project Generation Dependency Plan Preview", metadata: sectionMetadata("dependency-plan") });
  return createPlanBundleSection({
    sectionType: "dependencyPlan",
    title: "Dependency plan preview",
    summary: "Aggregates future dependency planning without installation.",
    score: preview.summary.completeness.score,
    level: preview.summary.completeness.level,
    entryCount: preview.summary.totalDependencies,
    blockedCount: preview.summary.blockedCount,
    approvalRequiredCount: preview.summary.approvalRequiredCount,
    warnings: preview.summary.warnings,
    recommendations: preview.summary.recommendations
  });
}

export function createPlanBundleValidationPlanSection(): ProjectGenerationPlanBundleSection {
  const preview = createProjectGenerationValidationPlanPreview({ title: "Project Generation Validation Plan Preview", metadata: sectionMetadata("validation-plan") });
  return createPlanBundleSection({
    sectionType: "validationPlan",
    title: "Validation plan preview",
    summary: "Aggregates future validation planning without command execution.",
    score: preview.summary.completeness.score,
    level: preview.summary.completeness.level,
    entryCount: preview.summary.totalChecks,
    blockedCount: preview.summary.blockedCount,
    approvalRequiredCount: preview.summary.approvalRequiredCount,
    warnings: preview.summary.warnings,
    recommendations: preview.summary.recommendations
  });
}

export function createPlanBundleApprovalPlanSection(): ProjectGenerationPlanBundleSection {
  const preview = createProjectGenerationApprovalPlanPreview({ title: "Project Generation Approval Plan Preview", metadata: sectionMetadata("approval-plan") });
  return createPlanBundleSection({
    sectionType: "approvalPlan",
    title: "Approval plan preview",
    summary: "Aggregates future approval planning without approval execution.",
    score: preview.summary.completeness.score,
    level: preview.summary.completeness.level,
    entryCount: preview.summary.totalGates,
    blockedCount: preview.summary.blockedCount,
    approvalRequiredCount: preview.summary.humanRequiredCount,
    warnings: preview.summary.warnings,
    recommendations: preview.summary.recommendations
  });
}

export function createPlanBundleRiskPlanSection(): ProjectGenerationPlanBundleSection {
  const preview = createProjectGenerationRiskPlanPreview({ title: "Project Generation Risk Plan Preview", metadata: sectionMetadata("risk-plan") });
  return createPlanBundleSection({
    sectionType: "riskPlan",
    title: "Risk plan preview",
    summary: "Aggregates future risk planning without risk enforcement.",
    score: 100 - preview.summary.exposure.score,
    level: preview.summary.exposure.level,
    entryCount: preview.summary.totalRisks,
    blockedCount: preview.summary.blockedCount,
    approvalRequiredCount: preview.summary.humanApprovalRequiredCount,
    warnings: preview.summary.warnings,
    recommendations: preview.summary.recommendations
  });
}

export function createPlanBundleRollbackPlanSection(): ProjectGenerationPlanBundleSection {
  const preview = createProjectGenerationRollbackPlanPreview({ title: "Project Generation Rollback Plan Preview", metadata: sectionMetadata("rollback-plan") });
  return createPlanBundleSection({
    sectionType: "rollbackPlan",
    title: "Rollback plan preview",
    summary: "Aggregates future rollback and recovery planning without execution.",
    score: preview.summary.readiness.score,
    level: preview.summary.readiness.level,
    entryCount: preview.summary.totalSteps,
    blockedCount: preview.summary.blockedCount,
    approvalRequiredCount: preview.summary.humanApprovalRequiredCount,
    warnings: preview.summary.warnings,
    recommendations: preview.summary.recommendations
  });
}

export function createPlanBundleGovernanceSummarySection(): ProjectGenerationPlanBundleSection {
  return createPlanBundleSection({
    sectionType: "governanceSummary",
    title: "Governance summary",
    summary: "Governance remains preview-only with runtime activation, autonomy, routing, and enforcement disabled.",
    score: 80,
    level: "review-ready",
    entryCount: 1,
    blockedCount: 0,
    approvalRequiredCount: 0,
    warnings: ["Governance summary is descriptive and does not activate governance."],
    recommendations: ["Keep future project generation governance behind separate human review."]
  });
}

export function createPlanBundleReadonlyGuaranteesSection(): ProjectGenerationPlanBundleSection {
  return createPlanBundleSection({
    sectionType: "readonlyGuarantees",
    title: "Read-only guarantees",
    summary: "Bundle preview is stdout-only, non-mutating, non-executing, and does not write files by default.",
    score: 100,
    level: "ready-for-design",
    entryCount: 1,
    blockedCount: 0,
    approvalRequiredCount: 0,
    warnings: [],
    recommendations: ["Preserve read-only bundle guarantees until a separate approved execution design exists."]
  });
}

export function sortPlanBundleSections(sections: readonly ProjectGenerationPlanBundleSection[]): ProjectGenerationPlanBundleSection[] {
  const order = new Map<ProjectGenerationPlanBundleSectionType, number>([
    ["blueprint", 1],
    ["filePlan", 2],
    ["dependencyPlan", 3],
    ["validationPlan", 4],
    ["approvalPlan", 5],
    ["riskPlan", 6],
    ["rollbackPlan", 7],
    ["governanceSummary", 8],
    ["readonlyGuarantees", 9]
  ]);
  return sortDeterministically(sections, (section) => `${String(order.get(section.sectionType) ?? 99).padStart(2, "0")}|${section.sectionType}`);
}

function createDefaultProjectGenerationPlanBundleSections(): ProjectGenerationPlanBundleSection[] {
  return [
    createPlanBundleBlueprintSection(),
    createPlanBundleFilePlanSection(),
    createPlanBundleDependencyPlanSection(),
    createPlanBundleValidationPlanSection(),
    createPlanBundleApprovalPlanSection(),
    createPlanBundleRiskPlanSection(),
    createPlanBundleRollbackPlanSection(),
    createPlanBundleGovernanceSummarySection(),
    createPlanBundleReadonlyGuaranteesSection()
  ];
}

function createPlanBundleSection(input: {
  sectionType: ProjectGenerationPlanBundleSectionType;
  title: string;
  summary: string;
  score: number;
  level: string;
  entryCount: number;
  blockedCount: number;
  approvalRequiredCount: number;
  warnings: readonly string[];
  recommendations: readonly string[];
}): ProjectGenerationPlanBundleSection {
  return {
    sectionType: input.sectionType,
    title: input.title,
    summary: input.summary,
    status: input.blockedCount > 0 ? "blocked" : input.score >= 75 ? "ready-for-review" : input.score > 0 ? "partial" : "not-started",
    score: input.score,
    level: input.level,
    entryCount: input.entryCount,
    blockedCount: input.blockedCount,
    approvalRequiredCount: input.approvalRequiredCount,
    warnings: normalizeWarnings(input.warnings),
    recommendations: normalizeWarnings(input.recommendations),
    readonly: true,
    previewOnly: true
  };
}

function sectionMetadata(source: string): GovernanceMetadata {
  return {
    version: "v11.9",
    source: `project-generation-plan-bundle-${source}`,
    readonly: true,
    previewOnly: true
  };
}
