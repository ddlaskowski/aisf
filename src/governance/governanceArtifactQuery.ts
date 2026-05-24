import {
  findArtifactsBySeverity,
  findArtifactsByStatus,
  findArtifactsByType,
  findPreviewOnlyArtifacts,
  findReadonlyArtifacts,
  type GovernanceArtifactIndex,
  type GovernanceArtifactIndexEntry
} from "./governanceArtifactIndex.js";
import type { GovernanceArtifactType, GovernanceSeverity, GovernanceStatus } from "./governanceStatus.js";

export type GovernanceArtifactQueryType = "all" | "artifactType" | "status" | "severity" | "readonly" | "previewOnly";

export type GovernanceArtifactQuery = {
  queryType: GovernanceArtifactQueryType;
  queryValue: string;
};

export type GovernanceArtifactQuerySummary = {
  totalMatches: number;
  readonly: boolean;
  previewOnly: boolean;
};

export type GovernanceArtifactQueryResult = {
  queryType: GovernanceArtifactQueryType;
  queryValue: string;
  totalMatches: number;
  entries: GovernanceArtifactIndexEntry[];
  readonly: boolean;
  previewOnly: boolean;
  summary: GovernanceArtifactQuerySummary;
};

export function queryGovernanceArtifacts(index: GovernanceArtifactIndex): GovernanceArtifactQueryResult {
  return createQueryResult("all", "all", index.entries);
}

export function queryGovernanceArtifactsByType(index: GovernanceArtifactIndex, artifactType: GovernanceArtifactType): GovernanceArtifactQueryResult {
  return createQueryResult("artifactType", artifactType, findArtifactsByType(index, artifactType).entries);
}

export function queryGovernanceArtifactsByStatus(index: GovernanceArtifactIndex, status: GovernanceStatus): GovernanceArtifactQueryResult {
  return createQueryResult("status", status, findArtifactsByStatus(index, status).entries);
}

export function queryGovernanceArtifactsBySeverity(index: GovernanceArtifactIndex, severity: GovernanceSeverity): GovernanceArtifactQueryResult {
  return createQueryResult("severity", severity, findArtifactsBySeverity(index, severity).entries);
}

export function queryReadonlyGovernanceArtifacts(index: GovernanceArtifactIndex): GovernanceArtifactQueryResult {
  return createQueryResult("readonly", "true", findReadonlyArtifacts(index).entries);
}

export function queryPreviewOnlyGovernanceArtifacts(index: GovernanceArtifactIndex): GovernanceArtifactQueryResult {
  return createQueryResult("previewOnly", "true", findPreviewOnlyArtifacts(index).entries);
}

function createQueryResult(
  queryType: GovernanceArtifactQueryType,
  queryValue: string,
  entries: readonly GovernanceArtifactIndexEntry[]
): GovernanceArtifactQueryResult {
  const readonly = entries.length > 0 && entries.every((entry) => entry.readonly === true);
  const previewOnly = entries.length > 0 && entries.every((entry) => entry.previewOnly === true);
  return {
    queryType,
    queryValue,
    totalMatches: entries.length,
    entries: [...entries],
    readonly,
    previewOnly,
    summary: {
      totalMatches: entries.length,
      readonly,
      previewOnly
    }
  };
}
