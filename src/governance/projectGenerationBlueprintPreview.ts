import type { GovernanceMetadata } from "./governanceMetadata.js";
import { normalizeWarnings, sortDeterministically } from "./utils/governanceUtils.js";

export type ProjectGenerationBlueprintSectionType =
  | "projectIntent"
  | "requirements"
  | "architecture"
  | "filePlan"
  | "dependencyPlan"
  | "validationPlan"
  | "governancePlan"
  | "humanApprovalPlan"
  | "riskPlan"
  | "rollbackPlan";

export type ProjectGenerationBlueprintSectionStatus =
  | "preview"
  | "incomplete"
  | "requires-approval"
  | "blocked"
  | "ready-for-design";

export type ProjectGenerationBlueprintCompletenessLevel =
  | "incomplete"
  | "partial"
  | "review-ready"
  | "ready-for-design";

export type ProjectGenerationBlueprintCompleteness = {
  score: number;
  level: ProjectGenerationBlueprintCompletenessLevel;
  reason: string;
};

export type ProjectGenerationBlueprintSection = {
  sectionType: ProjectGenerationBlueprintSectionType;
  title: string;
  status: ProjectGenerationBlueprintSectionStatus;
  summary: string;
  items: string[];
  risks: string[];
  warnings: string[];
  recommendations: string[];
  readonly: boolean;
  previewOnly: boolean;
};

export type ProjectGenerationBlueprintSummary = {
  totalSections: number;
  readyForDesignSections: number;
  previewSections: number;
  requiresApprovalSections: number;
  incompleteSections: number;
  blockedSections: number;
  totalItems: number;
  readonly: boolean;
  previewOnly: boolean;
  risks: string[];
  warnings: string[];
  recommendations: string[];
  completeness: ProjectGenerationBlueprintCompleteness;
};

export type ProjectGenerationBlueprintPreview = {
  schemaVersion: 1;
  title: string;
  metadata: GovernanceMetadata;
  readonly: true;
  previewOnly: true;
  blueprintPreviewOnly: true;
  stdoutOnly: true;
  fileWriteAllowed: false;
  fileCreationAllowed: false;
  scaffoldGenerationEnabled: false;
  runtimeRoutingEnabled: false;
  runtimeActivationEnabled: false;
  policyEnforcementEnabled: false;
  projectGenerationEnabled: false;
  builderAgentRuntimeEnabled: false;
  sections: ProjectGenerationBlueprintSection[];
  summary: ProjectGenerationBlueprintSummary;
};

export function createProjectGenerationBlueprintPreview(input: {
  title: string;
  metadata: GovernanceMetadata;
  sections?: readonly ProjectGenerationBlueprintSection[];
}): ProjectGenerationBlueprintPreview {
  const sections = sortBlueprintSections(input.sections ?? createDefaultProjectGenerationBlueprintSections());
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
    blueprintPreviewOnly: true,
    stdoutOnly: true,
    fileWriteAllowed: false,
    fileCreationAllowed: false,
    scaffoldGenerationEnabled: false,
    runtimeRoutingEnabled: false,
    runtimeActivationEnabled: false,
    policyEnforcementEnabled: false,
    projectGenerationEnabled: false,
    builderAgentRuntimeEnabled: false,
    sections,
    summary: summarizeProjectGenerationBlueprintPreview(sections)
  };
}

export function summarizeProjectGenerationBlueprintPreview(sections: readonly ProjectGenerationBlueprintSection[]): ProjectGenerationBlueprintSummary {
  const sortedSections = sortBlueprintSections(sections);
  const risks = sortedSections.flatMap((section) => section.risks);
  const warnings = [
    ...sortedSections.flatMap((section) => section.warnings),
    "Project generation blueprint preview is descriptive only; no project files, scaffolds, builder agents, runtime routing, or mutation expansion are enabled."
  ];
  const recommendations = [
    ...sortedSections.flatMap((section) => section.recommendations),
    "Require separate human-approved design previews before any future blueprint can create files or scaffold projects."
  ];
  return {
    totalSections: sortedSections.length,
    readyForDesignSections: sortedSections.filter((section) => section.status === "ready-for-design").length,
    previewSections: sortedSections.filter((section) => section.status === "preview").length,
    requiresApprovalSections: sortedSections.filter((section) => section.status === "requires-approval").length,
    incompleteSections: sortedSections.filter((section) => section.status === "incomplete").length,
    blockedSections: sortedSections.filter((section) => section.status === "blocked").length,
    totalItems: sortedSections.reduce((total, section) => total + section.items.length, 0),
    readonly: sortedSections.length > 0 && sortedSections.every((section) => section.readonly === true),
    previewOnly: sortedSections.length > 0 && sortedSections.every((section) => section.previewOnly === true),
    risks: normalizeWarnings(risks),
    warnings: normalizeWarnings(warnings),
    recommendations: normalizeWarnings(recommendations),
    completeness: calculateProjectGenerationBlueprintCompleteness(sortedSections)
  };
}

export function calculateProjectGenerationBlueprintCompleteness(sections: readonly ProjectGenerationBlueprintSection[]): ProjectGenerationBlueprintCompleteness {
  if (sections.length === 0) {
    return {
      score: 0,
      level: "incomplete",
      reason: "No blueprint preview sections were provided."
    };
  }
  if (sections.some((section) => section.status === "blocked")) {
    return {
      score: 0,
      level: "incomplete",
      reason: "One or more blueprint preview sections are blocked."
    };
  }
  const total = sections.reduce((sum, section) => sum + sectionStatusScore(section.status), 0);
  const score = Math.round((total / sections.length) * 10);
  return {
    score,
    level: score >= 90 ? "ready-for-design" : score >= 75 ? "review-ready" : score >= 40 ? "partial" : "incomplete",
    reason: "Advisory blueprint completeness score computed from deterministic preview-only section statuses."
  };
}

export function createProjectIntentBlueprintSection(): ProjectGenerationBlueprintSection {
  return createBlueprintSection({
    sectionType: "projectIntent",
    title: "Project Intent",
    status: "ready-for-design",
    summary: "Describes the future project intent as reviewable planning data only.",
    items: ["intent statement", "target user", "non-goals"],
    risks: [],
    warnings: ["Project intent does not start autonomous project generation."],
    recommendations: ["Require human approval before intent becomes any executable plan."],
    readonly: true,
    previewOnly: true
  });
}

export function createRequirementsBlueprintSection(): ProjectGenerationBlueprintSection {
  return createBlueprintSection({
    sectionType: "requirements",
    title: "Requirements",
    status: "ready-for-design",
    summary: "Describes deterministic requirement categories without ML inference or runtime planning loops.",
    items: ["functional requirements", "non-functional requirements", "acceptance criteria"],
    risks: [],
    warnings: [],
    recommendations: ["Keep requirements explicit and reviewable."],
    readonly: true,
    previewOnly: true
  });
}

export function createArchitectureBlueprintSection(): ProjectGenerationBlueprintSection {
  return createBlueprintSection({
    sectionType: "architecture",
    title: "Architecture",
    status: "preview",
    summary: "Outlines future architecture planning areas without creating project structure.",
    items: ["module boundaries", "runtime constraints", "data flow preview"],
    risks: ["Architecture preview could be mistaken for an implementation plan."],
    warnings: ["Architecture section is preview-only and does not route runtime behavior."],
    recommendations: ["Require design review before architecture influences generated files."],
    readonly: true,
    previewOnly: true
  });
}

export function createFilePlanBlueprintSection(): ProjectGenerationBlueprintSection {
  return createBlueprintSection({
    sectionType: "filePlan",
    title: "File Plan",
    status: "requires-approval",
    summary: "Describes possible future file planning data without creating files or scaffolds.",
    items: ["file purpose list", "single-file mutation boundary", "no-write guarantee"],
    risks: ["File planning can imply mutation scope expansion if not separately approved."],
    warnings: ["No files are created by this blueprint preview."],
    recommendations: ["Keep file plans stdout-only until separate approval permits any file-writing workflow."],
    readonly: true,
    previewOnly: true
  });
}

export function createDependencyPlanBlueprintSection(): ProjectGenerationBlueprintSection {
  return createBlueprintSection({
    sectionType: "dependencyPlan",
    title: "Dependency Plan",
    status: "requires-approval",
    summary: "Describes possible dependency planning without installing packages or editing lockfiles.",
    items: ["dependency categories", "approval gate", "validation expectation"],
    risks: ["Dependency changes require separate review before future implementation."],
    warnings: ["No dependencies are installed by this preview."],
    recommendations: ["Require explicit human approval before dependency changes are proposed."],
    readonly: true,
    previewOnly: true
  });
}

export function createValidationPlanBlueprintSection(): ProjectGenerationBlueprintSection {
  return createBlueprintSection({
    sectionType: "validationPlan",
    title: "Validation Plan",
    status: "preview",
    summary: "Describes validation planning expectations without executing validation orchestration.",
    items: ["build checks", "scenario checks", "manual review checks"],
    risks: [],
    warnings: ["Validation plan preview does not execute autonomous repair or generation loops."],
    recommendations: ["Keep validation plans deterministic and manually reviewable."],
    readonly: true,
    previewOnly: true
  });
}

export function createGovernancePlanBlueprintSection(): ProjectGenerationBlueprintSection {
  return createBlueprintSection({
    sectionType: "governancePlan",
    title: "Governance Plan",
    status: "ready-for-design",
    summary: "Connects future blueprint planning to governance invariants, artifacts, and review packs.",
    items: ["read-only contracts", "review-pack inputs", "policy disabled guarantee"],
    risks: [],
    warnings: [],
    recommendations: ["Preserve preview-only governance posture in all future blueprint designs."],
    readonly: true,
    previewOnly: true
  });
}

export function createHumanApprovalBlueprintSection(): ProjectGenerationBlueprintSection {
  return createBlueprintSection({
    sectionType: "humanApprovalPlan",
    title: "Human Approval Plan",
    status: "ready-for-design",
    summary: "Describes human approval requirements before any future generation runtime can exist.",
    items: ["approval checklist", "review pack dependency", "explicit no-autonomy gate"],
    risks: [],
    warnings: [],
    recommendations: ["Require human approval before any future scaffold or file-writing behavior."],
    readonly: true,
    previewOnly: true
  });
}

export function createRiskPlanBlueprintSection(): ProjectGenerationBlueprintSection {
  return createBlueprintSection({
    sectionType: "riskPlan",
    title: "Risk Plan",
    status: "preview",
    summary: "Describes risks around future project generation, scaffolding, routing, and mutation expansion.",
    items: ["mutation expansion risk", "runtime routing risk", "scaffold generation risk"],
    risks: ["Future project generation has high safety sensitivity and requires separate design review."],
    warnings: ["Risk plan is documentation only and does not enforce policy."],
    recommendations: ["Keep risks explicit in future approval workflows."],
    readonly: true,
    previewOnly: true
  });
}

export function createRollbackPlanBlueprintSection(): ProjectGenerationBlueprintSection {
  return createBlueprintSection({
    sectionType: "rollbackPlan",
    title: "Rollback Plan",
    status: "preview",
    summary: "Describes rollback planning needs without executing rollback or writing artifacts.",
    items: ["rollback assumptions", "validation dependency", "manual recovery review"],
    risks: ["Rollback planning must be validated before future generation runtime design."],
    warnings: ["Rollback plan preview does not execute rollback."],
    recommendations: ["Require rollback validation before future file-writing designs."],
    readonly: true,
    previewOnly: true
  });
}

function createDefaultProjectGenerationBlueprintSections(): ProjectGenerationBlueprintSection[] {
  return [
    createProjectIntentBlueprintSection(),
    createRequirementsBlueprintSection(),
    createArchitectureBlueprintSection(),
    createFilePlanBlueprintSection(),
    createDependencyPlanBlueprintSection(),
    createValidationPlanBlueprintSection(),
    createGovernancePlanBlueprintSection(),
    createHumanApprovalBlueprintSection(),
    createRiskPlanBlueprintSection(),
    createRollbackPlanBlueprintSection()
  ];
}

function createBlueprintSection(section: ProjectGenerationBlueprintSection): ProjectGenerationBlueprintSection {
  return {
    sectionType: section.sectionType,
    title: section.title,
    status: section.status,
    summary: section.summary,
    items: sortDeterministically(section.items, (item) => item),
    risks: normalizeWarnings(section.risks),
    warnings: normalizeWarnings(section.warnings),
    recommendations: normalizeWarnings(section.recommendations),
    readonly: section.readonly,
    previewOnly: section.previewOnly
  };
}

function sortBlueprintSections(sections: readonly ProjectGenerationBlueprintSection[]): ProjectGenerationBlueprintSection[] {
  return sortDeterministically(sections, (section) => [section.sectionType, section.title, section.summary].join("|"));
}

function sectionStatusScore(status: ProjectGenerationBlueprintSectionStatus): number {
  if (status === "ready-for-design") return 10;
  if (status === "preview") return 8;
  if (status === "requires-approval") return 6;
  if (status === "incomplete") return 4;
  return 0;
}
