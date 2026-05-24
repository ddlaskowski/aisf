import type { GovernanceMetadata } from "./governanceMetadata.js";
import { normalizeWarnings, sortDeterministically } from "./utils/governanceUtils.js";

export type ProjectGenerationReadinessSectionType =
  | "governance-consolidation"
  | "artifact-pipeline"
  | "cli-inspection"
  | "validation-suites"
  | "readonly-contracts"
  | "safe-patch-boundary"
  | "single-file-mutation-boundary"
  | "runtime-activation-disabled"
  | "builder-agent-readiness"
  | "project-scaffolding-readiness"
  | "orchestration-readiness"
  | "human-approval-readiness";

export type ProjectGenerationReadinessStatus =
  | "ready"
  | "partial"
  | "blocked"
  | "not-started"
  | "preview-only";

export type ProjectGenerationReadinessLevel =
  | "blocked"
  | "partial"
  | "ready-for-design"
  | "ready-for-preview";

export type ProjectGenerationReadinessScore = {
  score: number;
  level: ProjectGenerationReadinessLevel;
  reason: string;
};

export type ProjectGenerationReadinessSection = {
  sectionType: ProjectGenerationReadinessSectionType;
  title: string;
  status: ProjectGenerationReadinessStatus;
  summary: string;
  readiness: number;
  blockingRisks: string[];
  warnings: string[];
  recommendations: string[];
  readonly: boolean;
  previewOnly: boolean;
};

export type ProjectGenerationReadinessSummary = {
  totalSections: number;
  readySections: number;
  partialSections: number;
  blockedSections: number;
  notStartedSections: number;
  previewOnlySections: number;
  readonly: boolean;
  previewOnly: boolean;
  blockingRisks: string[];
  warnings: string[];
  recommendations: string[];
  readinessScore: ProjectGenerationReadinessScore;
};

export type ProjectGenerationReadinessAssessment = {
  schemaVersion: 1;
  title: string;
  metadata: GovernanceMetadata;
  readonly: true;
  previewOnly: true;
  assessmentOnly: true;
  stdoutOnly: true;
  fileWriteAllowed: false;
  runtimeRoutingEnabled: false;
  runtimeActivationEnabled: false;
  policyEnforcementEnabled: false;
  projectGenerationEnabled: false;
  builderAgentRuntimeEnabled: false;
  sections: ProjectGenerationReadinessSection[];
  summary: ProjectGenerationReadinessSummary;
};

export function createProjectGenerationReadinessAssessment(input: {
  title: string;
  metadata: GovernanceMetadata;
  sections: readonly ProjectGenerationReadinessSection[];
}): ProjectGenerationReadinessAssessment {
  const sections = sortReadinessSections(input.sections);
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
    assessmentOnly: true,
    stdoutOnly: true,
    fileWriteAllowed: false,
    runtimeRoutingEnabled: false,
    runtimeActivationEnabled: false,
    policyEnforcementEnabled: false,
    projectGenerationEnabled: false,
    builderAgentRuntimeEnabled: false,
    sections,
    summary: summarizeReadinessSections(sections)
  };
}

export function summarizeProjectGenerationReadinessAssessment(assessment: ProjectGenerationReadinessAssessment): ProjectGenerationReadinessSummary {
  return summarizeReadinessSections(assessment.sections);
}

export function calculateProjectGenerationReadinessScore(sections: readonly ProjectGenerationReadinessSection[]): ProjectGenerationReadinessScore {
  if (sections.length === 0) {
    return {
      score: 0,
      level: "blocked",
      reason: "No readiness sections were provided."
    };
  }
  if (sections.some((section) => section.status === "blocked" || section.blockingRisks.length > 0)) {
    return {
      score: 0,
      level: "blocked",
      reason: "One or more readiness sections are blocked or include blocking risks."
    };
  }
  const total = sections.reduce((sum, section) => sum + clampReadiness(section.readiness), 0);
  const score = Math.round((total / sections.length) * 10);
  return {
    score,
    level: score >= 90 ? "ready-for-preview" : score >= 70 ? "ready-for-design" : score >= 40 ? "partial" : "blocked",
    reason: "Advisory project generation readiness score computed from deterministic preview-only section readiness values."
  };
}

export function createGovernanceConsolidationReadinessSection(): ProjectGenerationReadinessSection {
  return createReadinessSection({
    sectionType: "governance-consolidation",
    title: "Governance Consolidation",
    status: "ready",
    summary: "v10.x governance consolidation provides centralized invariants, schemas, renderers, artifact contracts, and completion audit coverage.",
    readiness: 10,
    blockingRisks: [],
    warnings: [],
    recommendations: ["Use governance consolidation outputs as assessment inputs only until separate human approval exists."],
    readonly: true,
    previewOnly: true
  });
}

export function createArtifactPipelineReadinessSection(): ProjectGenerationReadinessSection {
  return createReadinessSection({
    sectionType: "artifact-pipeline",
    title: "Governance Artifact Pipeline",
    status: "ready",
    summary: "Normalized artifacts, registries, indexes, queries, exports, snapshots, and review packs are available for deterministic inspection.",
    readiness: 10,
    blockingRisks: [],
    warnings: [],
    recommendations: ["Keep artifact pipeline data descriptive and non-mutating."],
    readonly: true,
    previewOnly: true
  });
}

export function createCliInspectionReadinessSection(): ProjectGenerationReadinessSection {
  return createReadinessSection({
    sectionType: "cli-inspection",
    title: "CLI Inspection",
    status: "ready",
    summary: "Read-only CLI preview paths support deterministic inspection of governance artifact data.",
    readiness: 10,
    blockingRisks: [],
    warnings: [],
    recommendations: ["Keep project-generation readiness CLI output stdout-only by default."],
    readonly: true,
    previewOnly: true
  });
}

export function createValidationSuiteReadinessSection(): ProjectGenerationReadinessSection {
  return createReadinessSection({
    sectionType: "validation-suites",
    title: "Filtered Validation Suites",
    status: "ready",
    summary: "Filtered deterministic suites exist for governance, artifacts, registry, index, query, export, snapshot, review-pack, audit, renderers, and CLI validation.",
    readiness: 10,
    blockingRisks: [],
    warnings: [],
    recommendations: ["Add project-generation suite checks before any future builder-agent design preview."],
    readonly: true,
    previewOnly: true
  });
}

export function createReadonlyContractReadinessSection(): ProjectGenerationReadinessSection {
  return createReadinessSection({
    sectionType: "readonly-contracts",
    title: "Read-only Contracts",
    status: "ready",
    summary: "Read-only contracts explicitly preserve disabled runtime governance, autonomy, activation, policy enforcement, and Safe Patch Engine exclusivity.",
    readiness: 10,
    blockingRisks: [],
    warnings: [],
    recommendations: ["Require read-only contracts for any future project-generation review artifact."],
    readonly: true,
    previewOnly: true
  });
}

export function createSafePatchBoundaryReadinessSection(): ProjectGenerationReadinessSection {
  return createReadinessSection({
    sectionType: "safe-patch-boundary",
    title: "Safe Patch Engine Boundary",
    status: "ready",
    summary: "Safe Patch Engine remains the sole mutation layer and no project-generation capability expands mutation scope.",
    readiness: 10,
    blockingRisks: [],
    warnings: [],
    recommendations: ["Preserve Safe Patch Engine exclusivity before any future generation workflow is designed."],
    readonly: true,
    previewOnly: true
  });
}

export function createSingleFileMutationBoundaryReadinessSection(): ProjectGenerationReadinessSection {
  return createReadinessSection({
    sectionType: "single-file-mutation-boundary",
    title: "Single-file Mutation Boundary",
    status: "ready",
    summary: "The single-file mutation invariant remains unchanged and project-generation readiness does not expand mutation boundaries.",
    readiness: 10,
    blockingRisks: [],
    warnings: [],
    recommendations: ["Do not introduce multi-file mutation in readiness or future design previews."],
    readonly: true,
    previewOnly: true
  });
}

export function createRuntimeActivationDisabledReadinessSection(): ProjectGenerationReadinessSection {
  return createReadinessSection({
    sectionType: "runtime-activation-disabled",
    title: "Runtime Activation Disabled",
    status: "ready",
    summary: "Runtime governance, autonomy, activation, policy enforcement, and runtime routing remain disabled.",
    readiness: 10,
    blockingRisks: [],
    warnings: [],
    recommendations: ["Keep readiness assessment separate from runtime activation or enforcement decisions."],
    readonly: true,
    previewOnly: true
  });
}

export function createBuilderAgentReadinessSection(): ProjectGenerationReadinessSection {
  return createReadinessSection({
    sectionType: "builder-agent-readiness",
    title: "Builder Agent Readiness",
    status: "partial",
    summary: "Architecture can assess builder-agent prerequisites, but no builder-agent runtime exists or is enabled.",
    readiness: 5,
    blockingRisks: [],
    warnings: ["Builder-agent readiness is assessment-only; no builder agents are implemented."],
    recommendations: ["Create a separate human-reviewed design preview before implementing any builder-agent runtime."],
    readonly: true,
    previewOnly: true
  });
}

export function createProjectScaffoldingReadinessSection(): ProjectGenerationReadinessSection {
  return createReadinessSection({
    sectionType: "project-scaffolding-readiness",
    title: "Project Scaffolding Readiness",
    status: "partial",
    summary: "Project scaffolding can be evaluated as future design input, but no scaffolding runtime or project generation behavior is implemented.",
    readiness: 5,
    blockingRisks: [],
    warnings: ["Project scaffolding readiness is assessment-only; no projects are generated."],
    recommendations: ["Require explicit approval and non-runtime preview artifacts before project scaffolding is designed."],
    readonly: true,
    previewOnly: true
  });
}

export function createOrchestrationReadinessSection(): ProjectGenerationReadinessSection {
  return createReadinessSection({
    sectionType: "orchestration-readiness",
    title: "Runtime Orchestration Readiness",
    status: "partial",
    summary: "Orchestration prerequisites can be documented, but runtime orchestration, planner loops, and routing are not implemented or enabled.",
    readiness: 5,
    blockingRisks: [],
    warnings: ["Orchestration readiness is assessment-only; no runtime routing or planner-agent loop exists."],
    recommendations: ["Keep future orchestration work behind separate design, safety, and human-approval reviews."],
    readonly: true,
    previewOnly: true
  });
}

export function createHumanApprovalReadinessSection(): ProjectGenerationReadinessSection {
  return createReadinessSection({
    sectionType: "human-approval-readiness",
    title: "Human Approval Readiness",
    status: "ready",
    summary: "Governance artifacts are review-pack-ready for future human approval workflow design inputs.",
    readiness: 10,
    blockingRisks: [],
    warnings: [],
    recommendations: ["Require explicit human approval before any future project generation preview can mutate or write files."],
    readonly: true,
    previewOnly: true
  });
}

function createReadinessSection(section: ProjectGenerationReadinessSection): ProjectGenerationReadinessSection {
  return {
    sectionType: section.sectionType,
    title: section.title,
    status: section.status,
    summary: section.summary,
    readiness: clampReadiness(section.readiness),
    blockingRisks: normalizeWarnings(section.blockingRisks),
    warnings: normalizeWarnings(section.warnings),
    recommendations: normalizeWarnings(section.recommendations),
    readonly: section.readonly,
    previewOnly: section.previewOnly
  };
}

function summarizeReadinessSections(sections: readonly ProjectGenerationReadinessSection[]): ProjectGenerationReadinessSummary {
  const blockingRisks = [
    ...sections.flatMap((section) => section.blockingRisks),
    ...sections.filter((section) => section.readonly !== true).map((section) => `Readiness section ${section.title} is not read-only.`),
    ...sections.filter((section) => section.previewOnly !== true).map((section) => `Readiness section ${section.title} is not preview-only.`)
  ];
  const warnings = [
    ...sections.flatMap((section) => section.warnings),
    "Project generation readiness is assessment-only; no builder-agent runtime, scaffolding runtime, or orchestration runtime is enabled."
  ];
  const recommendations = [
    ...sections.flatMap((section) => section.recommendations),
    "Do not generate projects, activate governance, enforce policies, route runtime behavior, or write files from this readiness assessment."
  ];
  return {
    totalSections: sections.length,
    readySections: sections.filter((section) => section.status === "ready").length,
    partialSections: sections.filter((section) => section.status === "partial").length,
    blockedSections: sections.filter((section) => section.status === "blocked").length,
    notStartedSections: sections.filter((section) => section.status === "not-started").length,
    previewOnlySections: sections.filter((section) => section.status === "preview-only").length,
    readonly: sections.length > 0 && sections.every((section) => section.readonly === true),
    previewOnly: sections.length > 0 && sections.every((section) => section.previewOnly === true),
    blockingRisks: normalizeWarnings(blockingRisks),
    warnings: normalizeWarnings(warnings),
    recommendations: normalizeWarnings(recommendations),
    readinessScore: calculateProjectGenerationReadinessScore(sections)
  };
}

function sortReadinessSections(sections: readonly ProjectGenerationReadinessSection[]): ProjectGenerationReadinessSection[] {
  return sortDeterministically(
    sections,
    (section) => [section.sectionType, section.title, section.summary].join("|")
  );
}

function clampReadiness(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 10) return 10;
  return Math.round(value);
}
