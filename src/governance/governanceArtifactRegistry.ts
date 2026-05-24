import type { GovernanceArtifact } from "./governanceArtifact.js";
import type { GovernanceArtifactType, GovernanceSeverity, GovernanceStatus } from "./governanceStatus.js";
import { sortDeterministically } from "./utils/governanceUtils.js";

export type GovernanceArtifactRegistryEntry = {
  artifactType: GovernanceArtifactType;
  status: GovernanceStatus;
  severity?: GovernanceSeverity;
  summary: string;
  source: string;
  version: string;
  previewOnly: boolean;
  readonly: boolean;
};

export type GovernanceArtifactRegistrySummary = {
  totalArtifacts: number;
  artifactTypes: string[];
  statuses: string[];
  allPreviewOnly: boolean;
  allReadonly: boolean;
  warnings: string[];
};

export type GovernanceArtifactRegistry = {
  schemaVersion: 1;
  title: string;
  entries: GovernanceArtifactRegistryEntry[];
  summary: GovernanceArtifactRegistrySummary;
};

export function createGovernanceArtifactRegistry(title = "Governance Artifact Registry"): GovernanceArtifactRegistry {
  return {
    schemaVersion: 1,
    title,
    entries: [],
    summary: summarizeGovernanceArtifactRegistryEntries([])
  };
}

export function registerGovernanceArtifact(
  registry: GovernanceArtifactRegistry,
  artifact: GovernanceArtifact
): GovernanceArtifactRegistry {
  return sortGovernanceArtifactRegistry({
    schemaVersion: 1,
    title: registry.title,
    entries: [
      ...registry.entries,
      createGovernanceArtifactRegistryEntry(artifact)
    ],
    summary: registry.summary
  });
}

export function sortGovernanceArtifactRegistry(registry: GovernanceArtifactRegistry): GovernanceArtifactRegistry {
  const entries = sortDeterministically(
    registry.entries,
    (entry) => [
      entry.version,
      entry.artifactType,
      entry.status,
      entry.source,
      entry.summary
    ].join("|")
  );
  return {
    schemaVersion: 1,
    title: registry.title,
    entries,
    summary: summarizeGovernanceArtifactRegistryEntries(entries)
  };
}

export function summarizeGovernanceArtifactRegistry(registry: GovernanceArtifactRegistry): GovernanceArtifactRegistrySummary {
  return summarizeGovernanceArtifactRegistryEntries(registry.entries);
}

function createGovernanceArtifactRegistryEntry(artifact: GovernanceArtifact): GovernanceArtifactRegistryEntry {
  return {
    artifactType: artifact.artifactType,
    status: artifact.status,
    severity: artifact.severity,
    summary: artifact.summary,
    source: artifact.metadata.source ?? "unknown",
    version: artifact.metadata.version,
    previewOnly: artifact.metadata.previewOnly ?? false,
    readonly: artifact.metadata.readonly ?? false
  };
}

function summarizeGovernanceArtifactRegistryEntries(entries: readonly GovernanceArtifactRegistryEntry[]): GovernanceArtifactRegistrySummary {
  const artifactTypes = uniqueSorted(entries.map((entry) => entry.artifactType));
  const statuses = uniqueSorted(entries.map((entry) => entry.status));
  const allPreviewOnly = entries.length > 0 && entries.every((entry) => entry.previewOnly === true);
  const allReadonly = entries.length > 0 && entries.every((entry) => entry.readonly === true);
  const warnings = [
    ...entries
      .filter((entry) => entry.previewOnly !== true)
      .map((entry) => `Artifact ${entry.source} is not marked preview-only.`),
    ...entries
      .filter((entry) => entry.readonly !== true)
      .map((entry) => `Artifact ${entry.source} is not marked read-only.`)
  ];
  return {
    totalArtifacts: entries.length,
    artifactTypes,
    statuses,
    allPreviewOnly,
    allReadonly,
    warnings: sortDeterministically(warnings, (warning) => warning)
  };
}

function uniqueSorted(values: readonly string[]): string[] {
  return sortDeterministically([...new Set(values)], (value) => value);
}
