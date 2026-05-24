import type { GovernanceArtifact } from "../../governance/governanceArtifact.js";
import type { GovernanceArtifactRegistry } from "../../governance/governanceArtifactRegistry.js";
import type { GovernanceReadonlyContract } from "../../governance/governanceReadonlyContract.js";
import { renderCliMetadata, renderCliSection, renderCliStatusBlock, renderCliWarnings, renderReadonlyNotice } from "./cliRenderers.js";

export function renderCliGovernanceArtifact(artifact: GovernanceArtifact & { readonlyContract?: GovernanceReadonlyContract }): string {
  const summaryLines = [
    `artifactType: ${artifact.artifactType}`,
    `status: ${artifact.status}`,
    `summary: ${artifact.summary}`
  ];
  if (artifact.severity !== undefined) summaryLines.push(`severity: ${artifact.severity}`);
  if (artifact.reason !== undefined) summaryLines.push(`reason: ${artifact.reason}`);
  const recommendationLines = artifact.recommendations.length === 0
    ? ["Recommendations: none"]
    : artifact.recommendations.map((recommendation) => `[${recommendation.type}${recommendation.severity ? `/${recommendation.severity}` : ""}] ${recommendation.message}`);
  const contract = artifact.readonlyContract === undefined
    ? []
    : [
        renderCliStatusBlock({
          governancePreviewOnly: artifact.readonlyContract.governancePreviewOnly,
          policyEnforcementEnabled: artifact.readonlyContract.policyEnforcementEnabled,
          runtimeActivationExecuted: artifact.readonlyContract.runtimeActivationExecuted,
          runtimeAutonomyEnabled: artifact.readonlyContract.runtimeAutonomyEnabled,
          runtimeGovernanceEnabled: artifact.readonlyContract.runtimeGovernanceEnabled,
          safePatchEngineOnly: artifact.readonlyContract.safePatchEngineOnly
        })
      ];
  return [
    renderCliSection("Governance artifact", summaryLines),
    renderCliWarnings(artifact.warnings),
    renderCliSection("Recommendations", recommendationLines),
    renderCliMetadata(artifact.metadata),
    ...contract,
    renderReadonlyNotice(artifact.metadata.previewOnly ?? true)
  ].join("\n");
}

export function renderCliGovernanceArtifactRegistry(registry: GovernanceArtifactRegistry): string {
  const entryLines = registry.entries.length === 0
    ? ["none"]
    : registry.entries.map((entry) => `${entry.version} ${entry.source} | artifactType=${entry.artifactType} | status=${entry.status} | readonly=${String(entry.readonly)} | previewOnly=${String(entry.previewOnly)}`);
  return [
    renderCliSection("Governance artifact registry", [
      `title: ${registry.title}`,
      `artifact count: ${registry.summary.totalArtifacts}`,
      `artifact types: ${registry.summary.artifactTypes.length === 0 ? "none" : registry.summary.artifactTypes.join(", ")}`,
      `statuses: ${registry.summary.statuses.length === 0 ? "none" : registry.summary.statuses.join(", ")}`,
      `all preview-only: ${String(registry.summary.allPreviewOnly)}`,
      `all read-only: ${String(registry.summary.allReadonly)}`
    ]),
    renderCliWarnings(registry.summary.warnings),
    renderCliSection("Registry entries", entryLines),
    renderReadonlyNotice(registry.summary.allPreviewOnly)
  ].join("\n");
}
