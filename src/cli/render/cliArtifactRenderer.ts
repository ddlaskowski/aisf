import type { GovernanceArtifact } from "../../governance/governanceArtifact.js";
import type { GovernanceArtifactDiscoveryResults, GovernanceArtifactIndex } from "../../governance/governanceArtifactIndex.js";
import type { GovernanceArtifactExportContract, GovernanceArtifactExportPayload } from "../../governance/governanceArtifactExport.js";
import type { GovernanceArtifactQueryResult, GovernanceArtifactQuerySummary } from "../../governance/governanceArtifactQuery.js";
import type { GovernanceArtifactRegistry } from "../../governance/governanceArtifactRegistry.js";
import type { GovernanceArtifactReviewPack, GovernanceArtifactReviewPackSummary } from "../../governance/governanceArtifactReviewPack.js";
import type { GovernanceReadonlyContract } from "../../governance/governanceReadonlyContract.js";
import type { GovernanceArtifactSnapshot, GovernanceArtifactSnapshotSummary } from "../../governance/governanceArtifactSnapshot.js";
import type { GovernanceConsolidationAudit, GovernanceConsolidationAuditSummary } from "../../governance/governanceConsolidationAudit.js";
import type { ProjectGenerationBlueprintPreview, ProjectGenerationBlueprintSummary } from "../../governance/projectGenerationBlueprintPreview.js";
import type { ProjectGenerationCapabilityMap, ProjectGenerationCapabilitySummary } from "../../governance/projectGenerationCapabilityMap.js";
import type { ProjectGenerationFilePlanPreview, ProjectGenerationFilePlanSummary } from "../../governance/projectGenerationFilePlanPreview.js";
import type { ProjectGenerationReadinessAssessment, ProjectGenerationReadinessSummary } from "../../governance/projectGenerationReadiness.js";
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

export function renderCliGovernanceArtifactIndex(index: GovernanceArtifactIndex): string {
  const entryLines = index.entries.length === 0
    ? ["none"]
    : index.entries.map((entry) => `${entry.version} ${entry.source} | artifactType=${entry.artifactType} | status=${entry.status} | readonly=${String(entry.readonly)} | previewOnly=${String(entry.previewOnly)}`);
  return [
    renderCliSection("Governance artifact index", [
      `title: ${index.title}`,
      `total entries: ${index.summary.totalEntries}`,
      `artifact types: ${renderCliIndexGroups(index.summary.artifactTypeGroups)}`,
      `statuses: ${renderCliIndexGroups(index.summary.statusGroups)}`,
      `read-only entries: ${index.summary.readonlyEntries}`,
      `preview-only entries: ${index.summary.previewOnlyEntries}`,
      `all read-only: ${String(index.summary.allReadonly)}`,
      `all preview-only: ${String(index.summary.allPreviewOnly)}`
    ]),
    renderCliSection("Index entries", entryLines),
    renderReadonlyNotice(index.summary.allPreviewOnly)
  ].join("\n");
}

export function renderCliGovernanceArtifactDiscoveryResults(results: GovernanceArtifactDiscoveryResults): string {
  const entryLines = results.entries.length === 0
    ? ["none"]
    : results.entries.map((entry) => `${entry.version} ${entry.source} | artifactType=${entry.artifactType} | status=${entry.status}`);
  return [
    renderCliSection("Governance artifact discovery results", [
      `query: ${results.query}`,
      `total results: ${results.totalResults}`
    ]),
    renderCliSection("Discovery entries", entryLines)
  ].join("\n");
}

export function renderCliGovernanceArtifactQuerySummary(summary: GovernanceArtifactQuerySummary): string {
  return renderCliSection("Governance artifact query summary", [
    `total matches: ${summary.totalMatches}`,
    `read-only: ${String(summary.readonly)}`,
    `preview-only: ${String(summary.previewOnly)}`
  ]);
}

export function renderCliGovernanceArtifactQueryResult(result: GovernanceArtifactQueryResult): string {
  const entryLines = result.entries.length === 0
    ? ["none"]
    : result.entries.map((entry) => `${entry.version} ${entry.source} | artifactType=${entry.artifactType} | status=${entry.status} | readonly=${String(entry.readonly)} | previewOnly=${String(entry.previewOnly)}`);
  return [
    renderCliSection("Governance artifact query result", [
      `query type: ${result.queryType}`,
      `query value: ${result.queryValue}`,
      `total matches: ${result.totalMatches}`
    ]),
    renderCliGovernanceArtifactQuerySummary(result.summary),
    renderCliSection("Matching artifact entries", entryLines),
    renderReadonlyNotice(result.previewOnly)
  ].join("\n");
}

export function renderCliGovernanceArtifactExportContract(contract: GovernanceArtifactExportContract): string {
  return [
    renderCliSection("Governance artifact export contract", [
      `schemaVersion: ${contract.schemaVersion}`,
      `format: ${contract.format}`,
      `dataType: ${contract.dataType}`,
      `readonly: ${String(contract.readonly)}`,
      `previewOnly: ${String(contract.previewOnly)}`,
      `stdoutOnly: ${String(contract.stdoutOnly)}`,
      `fileWriteAllowed: ${String(contract.fileWriteAllowed)}`,
      `runtimeRoutingEnabled: ${String(contract.runtimeRoutingEnabled)}`,
      `runtimeActivationEnabled: ${String(contract.runtimeActivationEnabled)}`,
      `policyEnforcementEnabled: ${String(contract.policyEnforcementEnabled)}`
    ]),
    renderCliMetadata(contract.metadata),
    renderReadonlyNotice(contract.previewOnly)
  ].join("\n");
}

export function renderCliGovernanceArtifactExportPayload(payload: GovernanceArtifactExportPayload<unknown>): string {
  return [
    renderCliSection("Governance artifact export payload", [
      `schemaVersion: ${payload.schemaVersion}`
    ]),
    renderCliGovernanceArtifactExportContract(payload.contract),
    renderCliSection("Export data", [JSON.stringify(payload.data, null, 2)])
  ].join("\n");
}

export function renderCliGovernanceArtifactSnapshotSummary(summary: GovernanceArtifactSnapshotSummary): string {
  return [
    renderCliSection("Governance artifact snapshot summary", [
      `total sections: ${summary.totalSections}`,
      `total entries: ${summary.totalEntries}`,
      `read-only: ${String(summary.readonly)}`,
      `preview-only: ${String(summary.previewOnly)}`
    ]),
    renderCliWarnings(summary.warnings)
  ].join("\n");
}

export function renderCliGovernanceArtifactSnapshot(snapshot: GovernanceArtifactSnapshot): string {
  const sectionLines = snapshot.sections.length === 0
    ? ["none"]
    : snapshot.sections.map((section) => `${section.sectionType} | ${section.title} | entryCount=${section.entryCount} | readonly=${String(section.readonly)} | previewOnly=${String(section.previewOnly)}`);
  return [
    renderCliSection("Governance artifact snapshot", [
      `title: ${snapshot.title}`,
      `schemaVersion: ${snapshot.schemaVersion}`,
      `readonly: ${String(snapshot.readonly)}`,
      `previewOnly: ${String(snapshot.previewOnly)}`,
      `stdoutOnly: ${String(snapshot.stdoutOnly)}`,
      `fileWriteAllowed: ${String(snapshot.fileWriteAllowed)}`,
      `runtimeRoutingEnabled: ${String(snapshot.runtimeRoutingEnabled)}`,
      `runtimeActivationEnabled: ${String(snapshot.runtimeActivationEnabled)}`,
      `policyEnforcementEnabled: ${String(snapshot.policyEnforcementEnabled)}`
    ]),
    renderCliMetadata(snapshot.metadata),
    renderCliGovernanceArtifactSnapshotSummary(snapshot.summary),
    renderCliSection("Snapshot sections", sectionLines),
    renderReadonlyNotice(snapshot.previewOnly)
  ].join("\n");
}

export function renderCliGovernanceArtifactReviewPackSummary(summary: GovernanceArtifactReviewPackSummary): string {
  return [
    renderCliSection("Governance artifact review pack summary", [
      `total sections: ${summary.totalSections}`,
      `total entries: ${summary.totalEntries}`,
      `read-only: ${String(summary.readonly)}`,
      `preview-only: ${String(summary.previewOnly)}`
    ]),
    renderCliWarnings(summary.warnings),
    renderCliSection("Recommendations", summary.recommendations.length === 0 ? ["none"] : summary.recommendations)
  ].join("\n");
}

export function renderCliGovernanceArtifactReviewPack(reviewPack: GovernanceArtifactReviewPack): string {
  const sectionLines = reviewPack.sections.length === 0
    ? ["none"]
    : reviewPack.sections.map((section) => `${section.sectionType} | ${section.title} | entryCount=${section.entryCount} | readonly=${String(section.readonly)} | previewOnly=${String(section.previewOnly)}`);
  return [
    renderCliSection("Governance artifact review pack", [
      `title: ${reviewPack.title}`,
      `schemaVersion: ${reviewPack.schemaVersion}`,
      `readonly: ${String(reviewPack.readonly)}`,
      `previewOnly: ${String(reviewPack.previewOnly)}`,
      `stdoutOnly: ${String(reviewPack.stdoutOnly)}`,
      `fileWriteAllowed: ${String(reviewPack.fileWriteAllowed)}`,
      `runtimeRoutingEnabled: ${String(reviewPack.runtimeRoutingEnabled)}`,
      `runtimeActivationEnabled: ${String(reviewPack.runtimeActivationEnabled)}`,
      `policyEnforcementEnabled: ${String(reviewPack.policyEnforcementEnabled)}`
    ]),
    renderCliMetadata(reviewPack.metadata),
    renderCliGovernanceArtifactReviewPackSummary(reviewPack.summary),
    renderCliSection("Review pack sections", sectionLines),
    renderReadonlyNotice(reviewPack.previewOnly)
  ].join("\n");
}

export function renderCliGovernanceConsolidationAuditSummary(summary: GovernanceConsolidationAuditSummary): string {
  return [
    renderCliSection("Governance consolidation audit summary", [
      `total sections: ${summary.totalSections}`,
      `total entries: ${summary.totalEntries}`,
      `complete sections: ${summary.completeSections}`,
      `warning sections: ${summary.warningSections}`,
      `blocked sections: ${summary.blockedSections}`,
      `completion status: ${summary.completionStatus}`,
      `read-only: ${String(summary.readonly)}`,
      `preview-only: ${String(summary.previewOnly)}`
    ]),
    renderCliWarnings(summary.warnings),
    renderCliSection("Recommendations", summary.recommendations.length === 0 ? ["none"] : summary.recommendations)
  ].join("\n");
}

export function renderCliGovernanceConsolidationAudit(audit: GovernanceConsolidationAudit): string {
  const sectionLines = audit.sections.length === 0
    ? ["none"]
    : audit.sections.map((section) => `${section.sectionType} | ${section.title} | status=${section.status} | entryCount=${section.entryCount} | readonly=${String(section.readonly)} | previewOnly=${String(section.previewOnly)}`);
  return [
    renderCliSection("Governance consolidation audit", [
      `title: ${audit.title}`,
      `schemaVersion: ${audit.schemaVersion}`,
      `readonly: ${String(audit.readonly)}`,
      `previewOnly: ${String(audit.previewOnly)}`,
      `stdoutOnly: ${String(audit.stdoutOnly)}`,
      `fileWriteAllowed: ${String(audit.fileWriteAllowed)}`,
      `runtimeRoutingEnabled: ${String(audit.runtimeRoutingEnabled)}`,
      `runtimeActivationEnabled: ${String(audit.runtimeActivationEnabled)}`,
      `policyEnforcementEnabled: ${String(audit.policyEnforcementEnabled)}`
    ]),
    renderCliMetadata(audit.metadata),
    renderCliGovernanceConsolidationAuditSummary(audit.summary),
    renderCliSection("Audit sections", sectionLines),
    renderReadonlyNotice(audit.previewOnly)
  ].join("\n");
}

export function renderCliProjectGenerationReadinessSummary(summary: ProjectGenerationReadinessSummary): string {
  return [
    renderCliSection("Project generation readiness summary", [
      `total sections: ${summary.totalSections}`,
      `ready sections: ${summary.readySections}`,
      `partial sections: ${summary.partialSections}`,
      `blocked sections: ${summary.blockedSections}`,
      `not-started sections: ${summary.notStartedSections}`,
      `preview-only sections: ${summary.previewOnlySections}`,
      `readiness score: ${summary.readinessScore.score}`,
      `readiness level: ${summary.readinessScore.level}`,
      `score reason: ${summary.readinessScore.reason}`,
      `read-only: ${String(summary.readonly)}`,
      `preview-only: ${String(summary.previewOnly)}`
    ]),
    renderCliSection("Blocking risks", summary.blockingRisks.length === 0 ? ["none"] : summary.blockingRisks),
    renderCliWarnings(summary.warnings),
    renderCliSection("Recommendations", summary.recommendations.length === 0 ? ["none"] : summary.recommendations)
  ].join("\n");
}

export function renderCliProjectGenerationReadinessAssessment(assessment: ProjectGenerationReadinessAssessment): string {
  const sectionLines = assessment.sections.length === 0
    ? ["none"]
    : assessment.sections.map((section) => `${section.sectionType} | ${section.title} | status=${section.status} | readiness=${section.readiness} | readonly=${String(section.readonly)} | previewOnly=${String(section.previewOnly)}`);
  return [
    renderCliSection("Project generation readiness assessment", [
      `title: ${assessment.title}`,
      `schemaVersion: ${assessment.schemaVersion}`,
      `readonly: ${String(assessment.readonly)}`,
      `previewOnly: ${String(assessment.previewOnly)}`,
      `assessmentOnly: ${String(assessment.assessmentOnly)}`,
      `stdoutOnly: ${String(assessment.stdoutOnly)}`,
      `fileWriteAllowed: ${String(assessment.fileWriteAllowed)}`,
      `runtimeRoutingEnabled: ${String(assessment.runtimeRoutingEnabled)}`,
      `runtimeActivationEnabled: ${String(assessment.runtimeActivationEnabled)}`,
      `policyEnforcementEnabled: ${String(assessment.policyEnforcementEnabled)}`,
      `projectGenerationEnabled: ${String(assessment.projectGenerationEnabled)}`,
      `builderAgentRuntimeEnabled: ${String(assessment.builderAgentRuntimeEnabled)}`,
      "notice: no runtime activation, project generation, builder-agent runtime, policy enforcement, runtime routing, or file writing is enabled"
    ]),
    renderCliMetadata(assessment.metadata),
    renderCliProjectGenerationReadinessSummary(assessment.summary),
    renderCliSection("Readiness sections", sectionLines),
    renderReadonlyNotice(assessment.previewOnly)
  ].join("\n");
}

export function renderCliProjectGenerationCapabilitySummary(summary: ProjectGenerationCapabilitySummary): string {
  return [
    renderCliSection("Project generation capability map summary", [
      `total capabilities: ${summary.totalCapabilities}`,
      `status distribution: ${renderCliCapabilityGroups(summary.statusDistribution)}`,
      `risk distribution: ${renderCliCapabilityGroups(summary.riskDistribution)}`,
      `blocked capabilities: ${summary.blockedCapabilities.length === 0 ? "none" : summary.blockedCapabilities.join(", ")}`,
      `total dependencies: ${summary.totalDependencies}`,
      `read-only: ${String(summary.readonly)}`,
      `preview-only: ${String(summary.previewOnly)}`
    ]),
    renderCliWarnings(summary.warnings),
    renderCliSection("Recommendations", summary.recommendations.length === 0 ? ["none"] : summary.recommendations)
  ].join("\n");
}

export function renderCliProjectGenerationCapabilityMap(map: ProjectGenerationCapabilityMap): string {
  const capabilityLines = map.capabilities.length === 0
    ? ["none"]
    : map.capabilities.map((capability) => `${capability.id} | ${capability.title} | status=${capability.status} | risk=${capability.riskLevel} | readiness=${capability.readiness} | readonly=${String(capability.readonly)} | previewOnly=${String(capability.previewOnly)}`);
  const dependencyLines = map.dependencies.length === 0
    ? ["none"]
    : map.dependencies.map((dependency) => `${dependency.id} | ${dependency.from} ${dependency.dependencyType} ${dependency.to} | planningOnly=${String(dependency.planningOnly)}`);
  return [
    renderCliSection("Project generation capability map", [
      `title: ${map.title}`,
      `schemaVersion: ${map.schemaVersion}`,
      `readonly: ${String(map.readonly)}`,
      `previewOnly: ${String(map.previewOnly)}`,
      `planningOnly: ${String(map.planningOnly)}`,
      `stdoutOnly: ${String(map.stdoutOnly)}`,
      `fileWriteAllowed: ${String(map.fileWriteAllowed)}`,
      `runtimeRoutingEnabled: ${String(map.runtimeRoutingEnabled)}`,
      `runtimeActivationEnabled: ${String(map.runtimeActivationEnabled)}`,
      `policyEnforcementEnabled: ${String(map.policyEnforcementEnabled)}`,
      `projectGenerationEnabled: ${String(map.projectGenerationEnabled)}`,
      `builderAgentRuntimeEnabled: ${String(map.builderAgentRuntimeEnabled)}`,
      "notice: no runtime generation, builder-agent runtime, runtime activation, policy enforcement, runtime routing, mutation expansion, or file writing is enabled"
    ]),
    renderCliMetadata(map.metadata),
    renderCliProjectGenerationCapabilitySummary(map.summary),
    renderCliSection("Capabilities", capabilityLines),
    renderCliSection("Capability dependencies", dependencyLines),
    renderReadonlyNotice(map.previewOnly)
  ].join("\n");
}

export function renderCliProjectGenerationBlueprintSummary(summary: ProjectGenerationBlueprintSummary): string {
  return [
    renderCliSection("Project generation blueprint preview summary", [
      `total sections: ${summary.totalSections}`,
      `ready-for-design sections: ${summary.readyForDesignSections}`,
      `preview sections: ${summary.previewSections}`,
      `requires-approval sections: ${summary.requiresApprovalSections}`,
      `incomplete sections: ${summary.incompleteSections}`,
      `blocked sections: ${summary.blockedSections}`,
      `total items: ${summary.totalItems}`,
      `completeness score: ${summary.completeness.score}`,
      `completeness level: ${summary.completeness.level}`,
      `completeness reason: ${summary.completeness.reason}`,
      `read-only: ${String(summary.readonly)}`,
      `preview-only: ${String(summary.previewOnly)}`
    ]),
    renderCliSection("Risks", summary.risks.length === 0 ? ["none"] : summary.risks),
    renderCliWarnings(summary.warnings),
    renderCliSection("Recommendations", summary.recommendations.length === 0 ? ["none"] : summary.recommendations)
  ].join("\n");
}

export function renderCliProjectGenerationBlueprintPreview(preview: ProjectGenerationBlueprintPreview): string {
  const sectionLines = preview.sections.length === 0
    ? ["none"]
    : preview.sections.map((section) => `${section.sectionType} | ${section.title} | status=${section.status} | items=${section.items.length} | readonly=${String(section.readonly)} | previewOnly=${String(section.previewOnly)}`);
  return [
    renderCliSection("Project generation blueprint preview", [
      `title: ${preview.title}`,
      `schemaVersion: ${preview.schemaVersion}`,
      `readonly: ${String(preview.readonly)}`,
      `previewOnly: ${String(preview.previewOnly)}`,
      `blueprintPreviewOnly: ${String(preview.blueprintPreviewOnly)}`,
      `stdoutOnly: ${String(preview.stdoutOnly)}`,
      `fileWriteAllowed: ${String(preview.fileWriteAllowed)}`,
      `fileCreationAllowed: ${String(preview.fileCreationAllowed)}`,
      `scaffoldGenerationEnabled: ${String(preview.scaffoldGenerationEnabled)}`,
      `runtimeRoutingEnabled: ${String(preview.runtimeRoutingEnabled)}`,
      `runtimeActivationEnabled: ${String(preview.runtimeActivationEnabled)}`,
      `policyEnforcementEnabled: ${String(preview.policyEnforcementEnabled)}`,
      `projectGenerationEnabled: ${String(preview.projectGenerationEnabled)}`,
      `builderAgentRuntimeEnabled: ${String(preview.builderAgentRuntimeEnabled)}`,
      "notice: no project generation, scaffold generation, file creation, builder-agent runtime, runtime activation, policy enforcement, runtime routing, mutation expansion, or file writing is enabled"
    ]),
    renderCliMetadata(preview.metadata),
    renderCliProjectGenerationBlueprintSummary(preview.summary),
    renderCliSection("Blueprint sections", sectionLines),
    renderReadonlyNotice(preview.previewOnly)
  ].join("\n");
}

export function renderCliProjectGenerationFilePlanSummary(summary: ProjectGenerationFilePlanSummary): string {
  return [
    renderCliSection("Project generation file plan preview summary", [
      `planned file count: ${summary.totalPlannedFiles}`,
      `approval-required count: ${summary.approvalRequiredCount}`,
      `blocked count: ${summary.blockedCount}`,
      `no-write count: ${summary.noWriteCount}`,
      `safe-patch-only count: ${summary.safePatchOnlyCount}`,
      `manual-approval-required count: ${summary.manualApprovalRequiredCount}`,
      `completeness score: ${summary.completeness.score}`,
      `completeness level: ${summary.completeness.level}`,
      `completeness reason: ${summary.completeness.reason}`,
      `read-only: ${String(summary.readonly)}`,
      `preview-only: ${String(summary.previewOnly)}`
    ]),
    renderCliSection("Risks", summary.risks.length === 0 ? ["none"] : summary.risks),
    renderCliWarnings(summary.warnings),
    renderCliSection("Recommendations", summary.recommendations.length === 0 ? ["none"] : summary.recommendations)
  ].join("\n");
}

export function renderCliProjectGenerationFilePlanPreview(preview: ProjectGenerationFilePlanPreview): string {
  const entryLines = preview.entries.length === 0
    ? ["none"]
    : preview.entries.map((entry) => `${entry.plannedPath} | role=${entry.fileRole} | type=${entry.fileType} | status=${entry.generationStatus} | mutationPolicy=${entry.mutationPolicy} | requiresApproval=${String(entry.requiresApproval)}`);
  return [
    renderCliSection("Project generation file plan preview", [
      `title: ${preview.title}`,
      `schemaVersion: ${preview.schemaVersion}`,
      `readonly: ${String(preview.readonly)}`,
      `previewOnly: ${String(preview.previewOnly)}`,
      `filePlanPreviewOnly: ${String(preview.filePlanPreviewOnly)}`,
      `stdoutOnly: ${String(preview.stdoutOnly)}`,
      `fileWriteAllowed: ${String(preview.fileWriteAllowed)}`,
      `fileCreationAllowed: ${String(preview.fileCreationAllowed)}`,
      `scaffoldGenerationEnabled: ${String(preview.scaffoldGenerationEnabled)}`,
      `runtimeRoutingEnabled: ${String(preview.runtimeRoutingEnabled)}`,
      `runtimeActivationEnabled: ${String(preview.runtimeActivationEnabled)}`,
      `policyEnforcementEnabled: ${String(preview.policyEnforcementEnabled)}`,
      `projectGenerationEnabled: ${String(preview.projectGenerationEnabled)}`,
      `builderAgentRuntimeEnabled: ${String(preview.builderAgentRuntimeEnabled)}`,
      "notice: no file creation, scaffold generation, project generation, builder-agent runtime, runtime activation, policy enforcement, runtime routing, mutation expansion, or file writing is enabled"
    ]),
    renderCliMetadata(preview.metadata),
    renderCliProjectGenerationFilePlanSummary(preview.summary),
    renderCliSection("File plan entries", entryLines),
    renderReadonlyNotice(preview.previewOnly)
  ].join("\n");
}

function renderCliIndexGroups(groups: readonly { key: string; totalEntries: number }[]): string {
  if (groups.length === 0) return "none";
  return groups.map((group) => `${group.key}=${group.totalEntries}`).join(", ");
}

function renderCliCapabilityGroups(groups: readonly { key: string; totalCapabilities: number }[]): string {
  if (groups.length === 0) return "none";
  return groups.map((group) => `${group.key}=${group.totalCapabilities}`).join(", ");
}
