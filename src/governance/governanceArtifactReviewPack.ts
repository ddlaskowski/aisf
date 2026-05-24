import type { GovernanceArtifact } from "./governanceArtifact.js";
import type { GovernanceArtifactExportPayload } from "./governanceArtifactExport.js";
import type { GovernanceArtifactIndex } from "./governanceArtifactIndex.js";
import type { GovernanceMetadata } from "./governanceMetadata.js";
import type { GovernanceArtifactQueryResult } from "./governanceArtifactQuery.js";
import type { GovernanceArtifactRegistry } from "./governanceArtifactRegistry.js";
import type { GovernanceReadonlyContract } from "./governanceReadonlyContract.js";
import type { GovernanceArtifactSnapshot } from "./governanceArtifactSnapshot.js";
import { normalizeWarnings, sortDeterministically } from "./utils/governanceUtils.js";

export type GovernanceArtifactReviewPackSectionType =
  | "overview"
  | "artifact"
  | "registry"
  | "index"
  | "query-result"
  | "export-payload"
  | "snapshot"
  | "readonly-contract";

export type GovernanceArtifactReviewPackSection = {
  sectionType: GovernanceArtifactReviewPackSectionType;
  title: string;
  summary: string;
  entryCount: number;
  readonly: boolean;
  previewOnly: boolean;
  warnings: string[];
  recommendations: string[];
};

export type GovernanceArtifactReviewPackSummary = {
  totalSections: number;
  totalEntries: number;
  readonly: boolean;
  previewOnly: boolean;
  warnings: string[];
  recommendations: string[];
};

export type GovernanceArtifactReviewPack = {
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
  sections: GovernanceArtifactReviewPackSection[];
  summary: GovernanceArtifactReviewPackSummary;
};

export function createGovernanceArtifactReviewPack(input: {
  title: string;
  metadata: GovernanceMetadata;
  sections: readonly GovernanceArtifactReviewPackSection[];
}): GovernanceArtifactReviewPack {
  const sections = sortReviewPackSections(input.sections);
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
    summary: summarizeReviewPackSections(sections)
  };
}

export function summarizeGovernanceArtifactReviewPack(reviewPack: GovernanceArtifactReviewPack): GovernanceArtifactReviewPackSummary {
  return summarizeReviewPackSections(reviewPack.sections);
}

export function createReviewPackOverviewSection(summary = "Governance artifact review pack preview."): GovernanceArtifactReviewPackSection {
  return createReviewPackSection({
    sectionType: "overview",
    title: "Overview",
    summary,
    entryCount: 0,
    readonly: true,
    previewOnly: true,
    warnings: [],
    recommendations: ["Continue human review using preview-only governance artifact data."]
  });
}

export function createReviewPackArtifactSection(artifact: GovernanceArtifact, title = "Governance Artifact"): GovernanceArtifactReviewPackSection {
  return createReviewPackSection({
    sectionType: "artifact",
    title,
    summary: artifact.summary,
    entryCount: 1,
    readonly: artifact.metadata.readonly ?? false,
    previewOnly: artifact.metadata.previewOnly ?? false,
    warnings: artifact.warnings,
    recommendations: artifact.recommendations.map((recommendation) => recommendation.message)
  });
}

export function createReviewPackRegistrySection(registry: GovernanceArtifactRegistry, title = "Governance Artifact Registry"): GovernanceArtifactReviewPackSection {
  return createReviewPackSection({
    sectionType: "registry",
    title,
    summary: registry.title,
    entryCount: registry.entries.length,
    readonly: registry.summary.allReadonly,
    previewOnly: registry.summary.allPreviewOnly,
    warnings: registry.summary.warnings,
    recommendations: ["Review registry entries for read-only and preview-only consistency."]
  });
}

export function createReviewPackIndexSection(index: GovernanceArtifactIndex, title = "Governance Artifact Index"): GovernanceArtifactReviewPackSection {
  return createReviewPackSection({
    sectionType: "index",
    title,
    summary: index.title,
    entryCount: index.entries.length,
    readonly: index.summary.allReadonly,
    previewOnly: index.summary.allPreviewOnly,
    warnings: [],
    recommendations: ["Use index summaries for deterministic artifact discovery review."]
  });
}

export function createReviewPackQuerySection(result: GovernanceArtifactQueryResult, title = "Governance Artifact Query Result"): GovernanceArtifactReviewPackSection {
  return createReviewPackSection({
    sectionType: "query-result",
    title,
    summary: `${result.queryType}=${result.queryValue}`,
    entryCount: result.entries.length,
    readonly: result.readonly,
    previewOnly: result.previewOnly,
    warnings: [],
    recommendations: ["Inspect query matches before any future human approval workflow."]
  });
}

export function createReviewPackExportSection(payload: GovernanceArtifactExportPayload<unknown>, title = "Governance Artifact Export Payload"): GovernanceArtifactReviewPackSection {
  return createReviewPackSection({
    sectionType: "export-payload",
    title,
    summary: `${payload.contract.dataType}/${payload.contract.format}`,
    entryCount: 1,
    readonly: payload.contract.readonly,
    previewOnly: payload.contract.previewOnly,
    warnings: payload.contract.fileWriteAllowed === false ? [] : ["Export payload allows file writing."],
    recommendations: ["Keep export previews stdout-only until a separate human-approved file-writing workflow exists."]
  });
}

export function createReviewPackSnapshotSection(snapshot: GovernanceArtifactSnapshot, title = "Governance Artifact Snapshot"): GovernanceArtifactReviewPackSection {
  return createReviewPackSection({
    sectionType: "snapshot",
    title,
    summary: snapshot.title,
    entryCount: snapshot.summary.totalEntries,
    readonly: snapshot.summary.readonly,
    previewOnly: snapshot.summary.previewOnly,
    warnings: snapshot.summary.warnings,
    recommendations: ["Use snapshot sections as review-pack inputs only."]
  });
}

export function createReviewPackReadonlyContractSection(contract: GovernanceReadonlyContract, title = "Read-only Contract"): GovernanceArtifactReviewPackSection {
  return createReviewPackSection({
    sectionType: "readonly-contract",
    title,
    summary: contract.reason,
    entryCount: 1,
    readonly: contract.runtimeGovernanceEnabled === false && contract.runtimeAutonomyEnabled === false && contract.runtimeActivationExecuted === false,
    previewOnly: contract.governancePreviewOnly,
    warnings: contract.safePatchEngineOnly === true ? [] : ["Safe Patch Engine exclusivity is not explicit."],
    recommendations: ["Preserve read-only contract guarantees during future review workflows."]
  });
}

function createReviewPackSection(section: GovernanceArtifactReviewPackSection): GovernanceArtifactReviewPackSection {
  return {
    sectionType: section.sectionType,
    title: section.title,
    summary: section.summary,
    entryCount: section.entryCount,
    readonly: section.readonly,
    previewOnly: section.previewOnly,
    warnings: normalizeWarnings(section.warnings),
    recommendations: normalizeWarnings(section.recommendations)
  };
}

function summarizeReviewPackSections(sections: readonly GovernanceArtifactReviewPackSection[]): GovernanceArtifactReviewPackSummary {
  const warnings = [
    ...sections.flatMap((section) => section.warnings),
    ...sections.filter((section) => section.readonly !== true).map((section) => `Review pack section ${section.title} is not read-only.`),
    ...sections.filter((section) => section.previewOnly !== true).map((section) => `Review pack section ${section.title} is not preview-only.`)
  ];
  const recommendations = [
    ...sections.flatMap((section) => section.recommendations),
    "Do not activate governance, policy enforcement, runtime routing, or file writing from this review pack."
  ];
  return {
    totalSections: sections.length,
    totalEntries: sections.reduce((total, section) => total + section.entryCount, 0),
    readonly: sections.length > 0 && sections.every((section) => section.readonly === true),
    previewOnly: sections.length > 0 && sections.every((section) => section.previewOnly === true),
    warnings: normalizeWarnings(warnings),
    recommendations: normalizeWarnings(recommendations)
  };
}

function sortReviewPackSections(sections: readonly GovernanceArtifactReviewPackSection[]): GovernanceArtifactReviewPackSection[] {
  return sortDeterministically(
    sections,
    (section) => [section.sectionType, section.title, section.summary].join("|")
  );
}
