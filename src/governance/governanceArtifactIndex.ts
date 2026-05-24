import type { GovernanceArtifactRegistry, GovernanceArtifactRegistryEntry } from "./governanceArtifactRegistry.js";
import type { GovernanceArtifactType, GovernanceSeverity, GovernanceStatus } from "./governanceStatus.js";
import { sortDeterministically } from "./utils/governanceUtils.js";

export type GovernanceArtifactIndexEntry = {
  artifactType: GovernanceArtifactType;
  status: GovernanceStatus;
  severity?: GovernanceSeverity;
  source: string;
  version: string;
  previewOnly: boolean;
  readonly: boolean;
  summary: string;
};

export type GovernanceArtifactIndexGroup = {
  key: string;
  totalEntries: number;
};

export type GovernanceArtifactIndexSummary = {
  totalEntries: number;
  artifactTypeGroups: GovernanceArtifactIndexGroup[];
  statusGroups: GovernanceArtifactIndexGroup[];
  readonlyEntries: number;
  previewOnlyEntries: number;
  allReadonly: boolean;
  allPreviewOnly: boolean;
};

export type GovernanceArtifactIndex = {
  schemaVersion: 1;
  title: string;
  entries: GovernanceArtifactIndexEntry[];
  summary: GovernanceArtifactIndexSummary;
};

export type GovernanceArtifactDiscoveryResults = {
  query: string;
  entries: GovernanceArtifactIndexEntry[];
  totalResults: number;
};

export function createGovernanceArtifactIndex(title = "Governance Artifact Index"): GovernanceArtifactIndex {
  return {
    schemaVersion: 1,
    title,
    entries: [],
    summary: summarizeGovernanceArtifactIndexEntries([])
  };
}

export function indexGovernanceArtifactRegistry(
  registry: GovernanceArtifactRegistry,
  title = `${registry.title} Index`
): GovernanceArtifactIndex {
  return sortGovernanceArtifactIndex({
    schemaVersion: 1,
    title,
    entries: registry.entries.map(createGovernanceArtifactIndexEntry),
    summary: summarizeGovernanceArtifactIndexEntries([])
  });
}

export function sortGovernanceArtifactIndex(index: GovernanceArtifactIndex): GovernanceArtifactIndex {
  const entries = sortIndexEntries(index.entries);
  return {
    schemaVersion: 1,
    title: index.title,
    entries,
    summary: summarizeGovernanceArtifactIndexEntries(entries)
  };
}

export function summarizeGovernanceArtifactIndex(index: GovernanceArtifactIndex): GovernanceArtifactIndexSummary {
  return summarizeGovernanceArtifactIndexEntries(index.entries);
}

export function findArtifactsByType(index: GovernanceArtifactIndex, artifactType: GovernanceArtifactType): GovernanceArtifactDiscoveryResults {
  return createDiscoveryResults(`artifactType=${artifactType}`, index.entries.filter((entry) => entry.artifactType === artifactType));
}

export function findArtifactsByStatus(index: GovernanceArtifactIndex, status: GovernanceStatus): GovernanceArtifactDiscoveryResults {
  return createDiscoveryResults(`status=${status}`, index.entries.filter((entry) => entry.status === status));
}

export function findArtifactsBySeverity(index: GovernanceArtifactIndex, severity: GovernanceSeverity): GovernanceArtifactDiscoveryResults {
  return createDiscoveryResults(`severity=${severity}`, index.entries.filter((entry) => entry.severity === severity));
}

export function findReadonlyArtifacts(index: GovernanceArtifactIndex): GovernanceArtifactDiscoveryResults {
  return createDiscoveryResults("readonly=true", index.entries.filter((entry) => entry.readonly === true));
}

export function findPreviewOnlyArtifacts(index: GovernanceArtifactIndex): GovernanceArtifactDiscoveryResults {
  return createDiscoveryResults("previewOnly=true", index.entries.filter((entry) => entry.previewOnly === true));
}

export function findArtifactsBySource(index: GovernanceArtifactIndex, source: string): GovernanceArtifactDiscoveryResults {
  return createDiscoveryResults(`source=${source}`, index.entries.filter((entry) => entry.source === source));
}

function createGovernanceArtifactIndexEntry(entry: GovernanceArtifactRegistryEntry): GovernanceArtifactIndexEntry {
  return {
    artifactType: entry.artifactType,
    status: entry.status,
    severity: entry.severity,
    source: entry.source,
    version: entry.version,
    previewOnly: entry.previewOnly,
    readonly: entry.readonly,
    summary: entry.summary
  };
}

function createDiscoveryResults(query: string, entries: readonly GovernanceArtifactIndexEntry[]): GovernanceArtifactDiscoveryResults {
  const sorted = sortIndexEntries(entries);
  return {
    query,
    entries: sorted,
    totalResults: sorted.length
  };
}

function summarizeGovernanceArtifactIndexEntries(entries: readonly GovernanceArtifactIndexEntry[]): GovernanceArtifactIndexSummary {
  return {
    totalEntries: entries.length,
    artifactTypeGroups: countGroups(entries.map((entry) => entry.artifactType)),
    statusGroups: countGroups(entries.map((entry) => entry.status)),
    readonlyEntries: entries.filter((entry) => entry.readonly === true).length,
    previewOnlyEntries: entries.filter((entry) => entry.previewOnly === true).length,
    allReadonly: entries.length > 0 && entries.every((entry) => entry.readonly === true),
    allPreviewOnly: entries.length > 0 && entries.every((entry) => entry.previewOnly === true)
  };
}

function countGroups(values: readonly string[]): GovernanceArtifactIndexGroup[] {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return sortDeterministically(
    [...counts.entries()].map(([key, totalEntries]) => ({ key, totalEntries })),
    (group) => group.key
  );
}

function sortIndexEntries(entries: readonly GovernanceArtifactIndexEntry[]): GovernanceArtifactIndexEntry[] {
  return sortDeterministically(
    entries,
    (entry) => [
      entry.version,
      entry.artifactType,
      entry.status,
      entry.severity ?? "none",
      entry.source,
      entry.summary
    ].join("|")
  );
}
