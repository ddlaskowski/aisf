import type { GovernanceMetadata } from "./governanceMetadata.js";
import { normalizeWarnings, sortDeterministically } from "./utils/governanceUtils.js";

export type GovernanceConsolidationAuditSectionType =
  | "invariants"
  | "schemas"
  | "renderers"
  | "cli-renderers"
  | "artifact-pipeline"
  | "validation-suites"
  | "readonly-guarantees";

export type GovernanceConsolidationAuditStatus =
  | "complete"
  | "preview-only"
  | "warning"
  | "blocked";

export type GovernanceConsolidationAuditSection = {
  sectionType: GovernanceConsolidationAuditSectionType;
  title: string;
  summary: string;
  status: GovernanceConsolidationAuditStatus;
  entryCount: number;
  readonly: boolean;
  previewOnly: boolean;
  warnings: string[];
  recommendations: string[];
};

export type GovernanceConsolidationAuditSummary = {
  totalSections: number;
  totalEntries: number;
  completeSections: number;
  warningSections: number;
  blockedSections: number;
  readonly: boolean;
  previewOnly: boolean;
  completionStatus: GovernanceConsolidationAuditStatus;
  warnings: string[];
  recommendations: string[];
};

export type GovernanceConsolidationAudit = {
  schemaVersion: 1;
  title: string;
  metadata: GovernanceMetadata;
  readonly: true;
  previewOnly: true;
  stdoutOnly: true;
  fileWriteAllowed: false;
  runtimeRoutingEnabled: false;
  runtimeActivationEnabled: false;
  policyEnforcementEnabled: false;
  sections: GovernanceConsolidationAuditSection[];
  summary: GovernanceConsolidationAuditSummary;
};

export function createGovernanceConsolidationAudit(input: {
  title: string;
  metadata: GovernanceMetadata;
  sections: readonly GovernanceConsolidationAuditSection[];
}): GovernanceConsolidationAudit {
  const sections = sortAuditSections(input.sections);
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
    fileWriteAllowed: false,
    runtimeRoutingEnabled: false,
    runtimeActivationEnabled: false,
    policyEnforcementEnabled: false,
    sections,
    summary: summarizeAuditSections(sections)
  };
}

export function summarizeGovernanceConsolidationAudit(audit: GovernanceConsolidationAudit): GovernanceConsolidationAuditSummary {
  return summarizeAuditSections(audit.sections);
}

export function createAuditInvariantsSection(): GovernanceConsolidationAuditSection {
  return createAuditSection({
    sectionType: "invariants",
    title: "Centralized Governance Invariants",
    summary: "v10.0 centralized preview-only runtime, autonomy, activation, enforcement, and Safe Patch Engine invariants.",
    status: "complete",
    entryCount: 8,
    readonly: true,
    previewOnly: true,
    warnings: [],
    recommendations: ["Preserve centralized invariant consumption before future project-generation work."]
  });
}

export function createAuditSchemaSection(): GovernanceConsolidationAuditSection {
  return createAuditSection({
    sectionType: "schemas",
    title: "Shared Governance Schemas",
    summary: "v10.1 established status normalization, metadata, artifact schemas, and deterministic utility foundations.",
    status: "complete",
    entryCount: 5,
    readonly: true,
    previewOnly: true,
    warnings: [],
    recommendations: ["Continue migrating previews conservatively into shared schemas."]
  });
}

export function createAuditRendererSection(): GovernanceConsolidationAuditSection {
  return createAuditSection({
    sectionType: "renderers",
    title: "Governance Renderer Foundation",
    summary: "v10.1-v10.9 renderer helpers cover artifacts, registries, indexes, queries, exports, snapshots, and review packs.",
    status: "complete",
    entryCount: 7,
    readonly: true,
    previewOnly: true,
    warnings: [],
    recommendations: ["Keep renderer helpers pure, deterministic, and side-effect free."]
  });
}

export function createAuditCliSection(): GovernanceConsolidationAuditSection {
  return createAuditSection({
    sectionType: "cli-renderers",
    title: "CLI Preview Paths",
    summary: "v10.2-v10.9 CLI renderers and artifact-index previews provide read-only inspection, export, snapshot, and review-pack output.",
    status: "complete",
    entryCount: 5,
    readonly: true,
    previewOnly: true,
    warnings: [],
    recommendations: ["Keep CLI previews stdout-only and explicitly non-activating."]
  });
}

export function createAuditArtifactPipelineSection(): GovernanceConsolidationAuditSection {
  return createAuditSection({
    sectionType: "artifact-pipeline",
    title: "Governance Artifact Pipeline",
    summary: "v10.3-v10.9 normalized artifact factories, read-only contracts, registries, indexes, queries, exports, snapshots, and review packs.",
    status: "complete",
    entryCount: 8,
    readonly: true,
    previewOnly: true,
    warnings: [],
    recommendations: ["Use the artifact pipeline as descriptive review data only until a separate human-approved workflow exists."]
  });
}

export function createAuditValidationSuiteSection(): GovernanceConsolidationAuditSection {
  return createAuditSection({
    sectionType: "validation-suites",
    title: "Filtered Validation Suites",
    summary: "v10.2-v10.10 suite filters include governance, cli, renderers, artifacts, registry, index, query, export, snapshot, review-pack, and audit.",
    status: "complete",
    entryCount: 11,
    readonly: true,
    previewOnly: true,
    warnings: [],
    recommendations: ["Prefer filtered suites for deterministic validation when full scenario execution risks timeout."]
  });
}

export function createAuditReadonlyGuaranteeSection(): GovernanceConsolidationAuditSection {
  return createAuditSection({
    sectionType: "readonly-guarantees",
    title: "Read-only Preview Guarantees",
    summary: "The v10.x consolidation chain remains preview-only, stdout-only for CLI previews, non-routing, non-activating, non-enforcing, and non-mutating by default.",
    status: "complete",
    entryCount: 7,
    readonly: true,
    previewOnly: true,
    warnings: [],
    recommendations: ["Do not add file writing, runtime routing, governance activation, or policy enforcement to consolidation previews."]
  });
}

function createAuditSection(section: GovernanceConsolidationAuditSection): GovernanceConsolidationAuditSection {
  return {
    sectionType: section.sectionType,
    title: section.title,
    summary: section.summary,
    status: section.status,
    entryCount: section.entryCount,
    readonly: section.readonly,
    previewOnly: section.previewOnly,
    warnings: normalizeWarnings(section.warnings),
    recommendations: normalizeWarnings(section.recommendations)
  };
}

function summarizeAuditSections(sections: readonly GovernanceConsolidationAuditSection[]): GovernanceConsolidationAuditSummary {
  const warnings = [
    ...sections.flatMap((section) => section.warnings),
    ...sections.filter((section) => section.readonly !== true).map((section) => `Audit section ${section.title} is not read-only.`),
    ...sections.filter((section) => section.previewOnly !== true).map((section) => `Audit section ${section.title} is not preview-only.`),
    ...sections.filter((section) => section.status === "blocked").map((section) => `Audit section ${section.title} is blocked.`)
  ];
  const recommendations = [
    ...sections.flatMap((section) => section.recommendations),
    "Do not activate governance, policy enforcement, runtime routing, runtime autonomy, or default file writing from this audit."
  ];
  const blockedSections = sections.filter((section) => section.status === "blocked").length;
  const warningSections = sections.filter((section) => section.status === "warning").length;
  return {
    totalSections: sections.length,
    totalEntries: sections.reduce((total, section) => total + section.entryCount, 0),
    completeSections: sections.filter((section) => section.status === "complete").length,
    warningSections,
    blockedSections,
    readonly: sections.length > 0 && sections.every((section) => section.readonly === true),
    previewOnly: sections.length > 0 && sections.every((section) => section.previewOnly === true),
    completionStatus: blockedSections > 0 ? "blocked" : warningSections > 0 ? "warning" : sections.length === 0 ? "preview-only" : "complete",
    warnings: normalizeWarnings(warnings),
    recommendations: normalizeWarnings(recommendations)
  };
}

function sortAuditSections(sections: readonly GovernanceConsolidationAuditSection[]): GovernanceConsolidationAuditSection[] {
  return sortDeterministically(
    sections,
    (section) => [section.sectionType, section.title, section.summary].join("|")
  );
}
