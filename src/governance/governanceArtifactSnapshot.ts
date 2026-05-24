import type { GovernanceArtifact } from "./governanceArtifact.js";
import type { GovernanceArtifactExportPayload } from "./governanceArtifactExport.js";
import type { GovernanceArtifactIndex } from "./governanceArtifactIndex.js";
import type { GovernanceMetadata } from "./governanceMetadata.js";
import type { GovernanceArtifactQueryResult } from "./governanceArtifactQuery.js";
import type { GovernanceArtifactRegistry } from "./governanceArtifactRegistry.js";
import { normalizeWarnings, sortDeterministically } from "./utils/governanceUtils.js";

export type GovernanceArtifactSnapshotSectionType = "artifact" | "registry" | "index" | "query-result" | "export-payload";

export type GovernanceArtifactSnapshotSection = {
  sectionType: GovernanceArtifactSnapshotSectionType;
  title: string;
  summary: string;
  entryCount: number;
  readonly: boolean;
  previewOnly: boolean;
  warnings: string[];
};

export type GovernanceArtifactSnapshotSummary = {
  totalSections: number;
  totalEntries: number;
  readonly: boolean;
  previewOnly: boolean;
  warnings: string[];
};

export type GovernanceArtifactSnapshot = {
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
  sections: GovernanceArtifactSnapshotSection[];
  summary: GovernanceArtifactSnapshotSummary;
};

export function createGovernanceArtifactSnapshot(input: {
  title: string;
  metadata: GovernanceMetadata;
  sections: readonly GovernanceArtifactSnapshotSection[];
}): GovernanceArtifactSnapshot {
  const sections = sortSnapshotSections(input.sections);
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
    summary: summarizeGovernanceArtifactSnapshotSections(sections)
  };
}

export function summarizeGovernanceArtifactSnapshot(snapshot: GovernanceArtifactSnapshot): GovernanceArtifactSnapshotSummary {
  return summarizeGovernanceArtifactSnapshotSections(snapshot.sections);
}

export function createArtifactSnapshotSection(artifact: GovernanceArtifact, title = "Governance Artifact"): GovernanceArtifactSnapshotSection {
  return createSnapshotSection({
    sectionType: "artifact",
    title,
    summary: artifact.summary,
    entryCount: 1,
    readonly: artifact.metadata.readonly ?? false,
    previewOnly: artifact.metadata.previewOnly ?? false,
    warnings: artifact.warnings
  });
}

export function createRegistrySnapshotSection(registry: GovernanceArtifactRegistry, title = "Governance Artifact Registry"): GovernanceArtifactSnapshotSection {
  return createSnapshotSection({
    sectionType: "registry",
    title,
    summary: registry.title,
    entryCount: registry.entries.length,
    readonly: registry.summary.allReadonly,
    previewOnly: registry.summary.allPreviewOnly,
    warnings: registry.summary.warnings
  });
}

export function createIndexSnapshotSection(index: GovernanceArtifactIndex, title = "Governance Artifact Index"): GovernanceArtifactSnapshotSection {
  return createSnapshotSection({
    sectionType: "index",
    title,
    summary: index.title,
    entryCount: index.entries.length,
    readonly: index.summary.allReadonly,
    previewOnly: index.summary.allPreviewOnly,
    warnings: []
  });
}

export function createQuerySnapshotSection(result: GovernanceArtifactQueryResult, title = "Governance Artifact Query Result"): GovernanceArtifactSnapshotSection {
  return createSnapshotSection({
    sectionType: "query-result",
    title,
    summary: `${result.queryType}=${result.queryValue}`,
    entryCount: result.entries.length,
    readonly: result.readonly,
    previewOnly: result.previewOnly,
    warnings: []
  });
}

export function createExportSnapshotSection(payload: GovernanceArtifactExportPayload<unknown>, title = "Governance Artifact Export Payload"): GovernanceArtifactSnapshotSection {
  return createSnapshotSection({
    sectionType: "export-payload",
    title,
    summary: `${payload.contract.dataType}/${payload.contract.format}`,
    entryCount: 1,
    readonly: payload.contract.readonly,
    previewOnly: payload.contract.previewOnly,
    warnings: payload.contract.fileWriteAllowed === false ? [] : ["Export payload allows file writing."]
  });
}

function createSnapshotSection(section: GovernanceArtifactSnapshotSection): GovernanceArtifactSnapshotSection {
  return {
    sectionType: section.sectionType,
    title: section.title,
    summary: section.summary,
    entryCount: section.entryCount,
    readonly: section.readonly,
    previewOnly: section.previewOnly,
    warnings: normalizeWarnings(section.warnings)
  };
}

function summarizeGovernanceArtifactSnapshotSections(sections: readonly GovernanceArtifactSnapshotSection[]): GovernanceArtifactSnapshotSummary {
  const warnings = [
    ...sections.flatMap((section) => section.warnings),
    ...sections.filter((section) => section.readonly !== true).map((section) => `Snapshot section ${section.title} is not read-only.`),
    ...sections.filter((section) => section.previewOnly !== true).map((section) => `Snapshot section ${section.title} is not preview-only.`)
  ];
  return {
    totalSections: sections.length,
    totalEntries: sections.reduce((total, section) => total + section.entryCount, 0),
    readonly: sections.length > 0 && sections.every((section) => section.readonly === true),
    previewOnly: sections.length > 0 && sections.every((section) => section.previewOnly === true),
    warnings: normalizeWarnings(warnings)
  };
}

function sortSnapshotSections(sections: readonly GovernanceArtifactSnapshotSection[]): GovernanceArtifactSnapshotSection[] {
  return sortDeterministically(
    sections,
    (section) => [section.sectionType, section.title, section.summary].join("|")
  );
}
