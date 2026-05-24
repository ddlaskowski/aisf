import type { GovernanceArtifact } from "./governanceArtifact.js";
import type { GovernanceArtifactIndex } from "./governanceArtifactIndex.js";
import type { GovernanceMetadata } from "./governanceMetadata.js";
import type { GovernanceArtifactQueryResult } from "./governanceArtifactQuery.js";
import type { GovernanceArtifactRegistry } from "./governanceArtifactRegistry.js";
import {
  renderGovernanceArtifact,
  renderGovernanceArtifactIndex,
  renderGovernanceArtifactQueryResult,
  renderGovernanceArtifactRegistry
} from "./renderers/governanceRenderers.js";

export type GovernanceArtifactExportFormat = "json" | "markdown";

export type GovernanceArtifactExportDataType = "artifact" | "registry" | "index" | "query-result";

export type GovernanceArtifactExportContract = {
  schemaVersion: 1;
  format: GovernanceArtifactExportFormat;
  dataType: GovernanceArtifactExportDataType;
  readonly: true;
  previewOnly: true;
  stdoutOnly: true;
  fileWriteAllowed: false;
  runtimeRoutingEnabled: false;
  runtimeActivationEnabled: false;
  policyEnforcementEnabled: false;
  metadata: GovernanceMetadata;
};

export type GovernanceArtifactExportPayload<T> = {
  schemaVersion: 1;
  contract: GovernanceArtifactExportContract;
  data: T;
};

export function createGovernanceArtifactExportContract(input: {
  format: GovernanceArtifactExportFormat;
  dataType: GovernanceArtifactExportDataType;
  metadata: GovernanceMetadata;
}): GovernanceArtifactExportContract {
  return {
    schemaVersion: 1,
    format: input.format,
    dataType: input.dataType,
    readonly: true,
    previewOnly: true,
    stdoutOnly: true,
    fileWriteAllowed: false,
    runtimeRoutingEnabled: false,
    runtimeActivationEnabled: false,
    policyEnforcementEnabled: false,
    metadata: {
      version: input.metadata.version,
      generatedAt: input.metadata.generatedAt,
      source: input.metadata.source,
      command: input.metadata.command,
      readonly: input.metadata.readonly,
      previewOnly: input.metadata.previewOnly
    }
  };
}

export function createGovernanceArtifactExportPayload<T>(
  contract: GovernanceArtifactExportContract,
  data: T
): GovernanceArtifactExportPayload<T> {
  return {
    schemaVersion: 1,
    contract,
    data
  };
}

export function exportGovernanceArtifactAsJson(artifact: GovernanceArtifact, metadata: GovernanceMetadata): string {
  return exportAsJson("artifact", artifact, metadata);
}

export function exportGovernanceArtifactRegistryAsJson(registry: GovernanceArtifactRegistry, metadata: GovernanceMetadata): string {
  return exportAsJson("registry", registry, metadata);
}

export function exportGovernanceArtifactIndexAsJson(index: GovernanceArtifactIndex, metadata: GovernanceMetadata): string {
  return exportAsJson("index", index, metadata);
}

export function exportGovernanceArtifactQueryResultAsJson(result: GovernanceArtifactQueryResult, metadata: GovernanceMetadata): string {
  return exportAsJson("query-result", result, metadata);
}

export function exportGovernanceArtifactAsMarkdown(artifact: GovernanceArtifact, metadata: GovernanceMetadata): string {
  return exportAsMarkdown("artifact", renderGovernanceArtifact(artifact), metadata);
}

export function exportGovernanceArtifactRegistryAsMarkdown(registry: GovernanceArtifactRegistry, metadata: GovernanceMetadata): string {
  return exportAsMarkdown("registry", renderGovernanceArtifactRegistry(registry), metadata);
}

export function exportGovernanceArtifactIndexAsMarkdown(index: GovernanceArtifactIndex, metadata: GovernanceMetadata): string {
  return exportAsMarkdown("index", renderGovernanceArtifactIndex(index), metadata);
}

export function exportGovernanceArtifactQueryResultAsMarkdown(result: GovernanceArtifactQueryResult, metadata: GovernanceMetadata): string {
  return exportAsMarkdown("query-result", renderGovernanceArtifactQueryResult(result), metadata);
}

function exportAsJson<T>(dataType: GovernanceArtifactExportDataType, data: T, metadata: GovernanceMetadata): string {
  return JSON.stringify(
    createGovernanceArtifactExportPayload(
      createGovernanceArtifactExportContract({ format: "json", dataType, metadata }),
      data
    ),
    null,
    2
  );
}

function exportAsMarkdown(
  dataType: GovernanceArtifactExportDataType,
  renderedData: string,
  metadata: GovernanceMetadata
): string {
  const contract = createGovernanceArtifactExportContract({ format: "markdown", dataType, metadata });
  return [
    "# Governance Artifact Export Preview",
    "",
    `- schemaVersion: ${contract.schemaVersion}`,
    `- format: ${contract.format}`,
    `- dataType: ${contract.dataType}`,
    `- readonly: ${String(contract.readonly)}`,
    `- previewOnly: ${String(contract.previewOnly)}`,
    `- stdoutOnly: ${String(contract.stdoutOnly)}`,
    `- fileWriteAllowed: ${String(contract.fileWriteAllowed)}`,
    `- runtimeRoutingEnabled: ${String(contract.runtimeRoutingEnabled)}`,
    `- runtimeActivationEnabled: ${String(contract.runtimeActivationEnabled)}`,
    `- policyEnforcementEnabled: ${String(contract.policyEnforcementEnabled)}`,
    "",
    "## Metadata",
    "",
    `- version: ${contract.metadata.version}`,
    `- source: ${contract.metadata.source ?? "none"}`,
    `- command: ${contract.metadata.command ?? "none"}`,
    `- readonly: ${String(contract.metadata.readonly ?? true)}`,
    `- previewOnly: ${String(contract.metadata.previewOnly ?? true)}`,
    "",
    "## Export Data",
    "",
    renderedData
  ].join("\n");
}
