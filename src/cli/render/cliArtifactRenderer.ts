import type { GovernanceArtifact } from "../../governance/governanceArtifact.js";
import type { GovernanceArtifactDiscoveryResults, GovernanceArtifactIndex } from "../../governance/governanceArtifactIndex.js";
import type { GovernanceArtifactExportContract, GovernanceArtifactExportPayload } from "../../governance/governanceArtifactExport.js";
import type { GovernanceArtifactQueryResult, GovernanceArtifactQuerySummary } from "../../governance/governanceArtifactQuery.js";
import type { GovernanceArtifactRegistry } from "../../governance/governanceArtifactRegistry.js";
import type { GovernanceArtifactReviewPack, GovernanceArtifactReviewPackSummary } from "../../governance/governanceArtifactReviewPack.js";
import type { GovernanceReadonlyContract } from "../../governance/governanceReadonlyContract.js";
import type { GovernanceArtifactSnapshot, GovernanceArtifactSnapshotSummary } from "../../governance/governanceArtifactSnapshot.js";
import type { GovernanceConsolidationAudit, GovernanceConsolidationAuditSummary } from "../../governance/governanceConsolidationAudit.js";
import type { ControlledProjectGenerationContractSummary, ControlledProjectGenerationDesignContract } from "../../governance/controlledProjectGenerationDesignContract.js";
import type { ControlledProjectGenerationInputContract, ControlledProjectGenerationInputContractSummary } from "../../governance/controlledProjectGenerationInputContract.js";
import type { ControlledProjectGenerationMutationBoundaryContract, ControlledProjectGenerationMutationBoundarySummary } from "../../governance/controlledProjectGenerationMutationBoundaryContract.js";
import type { ControlledProjectGenerationOutputContract, ControlledProjectGenerationOutputContractSummary } from "../../governance/controlledProjectGenerationOutputContract.js";
import type { ProjectGenerationApprovalPlanPreview, ProjectGenerationApprovalPlanSummary } from "../../governance/projectGenerationApprovalPlanPreview.js";
import type { ProjectGenerationBlueprintPreview, ProjectGenerationBlueprintSummary } from "../../governance/projectGenerationBlueprintPreview.js";
import type { ProjectGenerationCapabilityMap, ProjectGenerationCapabilitySummary } from "../../governance/projectGenerationCapabilityMap.js";
import type { ProjectGenerationDependencyPlanPreview, ProjectGenerationDependencyPlanSummary } from "../../governance/projectGenerationDependencyPlanPreview.js";
import type { ProjectGenerationFilePlanPreview, ProjectGenerationFilePlanSummary } from "../../governance/projectGenerationFilePlanPreview.js";
import type { ProjectGenerationPlanBundlePreview, ProjectGenerationPlanBundleSummary } from "../../governance/projectGenerationPlanBundlePreview.js";
import type { ProjectGenerationReadinessAssessment, ProjectGenerationReadinessSummary } from "../../governance/projectGenerationReadiness.js";
import type { ProjectGenerationReadinessCompletionAudit, ProjectGenerationReadinessCompletionAuditSummary } from "../../governance/projectGenerationReadinessCompletionAudit.js";
import type { ProjectGenerationRollbackPlanPreview, ProjectGenerationRollbackPlanSummary } from "../../governance/projectGenerationRollbackPlanPreview.js";
import type { ProjectGenerationRiskPlanPreview, ProjectGenerationRiskPlanSummary } from "../../governance/projectGenerationRiskPlanPreview.js";
import type { ProjectGenerationValidationPlanPreview, ProjectGenerationValidationPlanSummary } from "../../governance/projectGenerationValidationPlanPreview.js";
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

export function renderCliProjectGenerationDependencyPlanSummary(summary: ProjectGenerationDependencyPlanSummary): string {
  return [
    renderCliSection("Project generation dependency plan preview summary", [
      `dependency count: ${summary.totalDependencies}`,
      `approval-required count: ${summary.approvalRequiredCount}`,
      `blocked count: ${summary.blockedCount}`,
      `no-install count: ${summary.noInstallCount}`,
      `manual-approval-required count: ${summary.manualApprovalRequiredCount}`,
      `preview-only count: ${summary.previewOnlyCount}`,
      `risk distribution: ${renderCliDependencyRiskGroups(summary.riskDistribution)}`,
      `completeness score: ${summary.completeness.score}`,
      `completeness level: ${summary.completeness.level}`,
      `completeness reason: ${summary.completeness.reason}`,
      `read-only: ${String(summary.readonly)}`,
      `preview-only: ${String(summary.previewOnly)}`
    ]),
    renderCliWarnings(summary.warnings),
    renderCliSection("Recommendations", summary.recommendations.length === 0 ? ["none"] : summary.recommendations)
  ].join("\n");
}

export function renderCliProjectGenerationDependencyPlanPreview(preview: ProjectGenerationDependencyPlanPreview): string {
  const entryLines = preview.entries.length === 0
    ? ["none"]
    : preview.entries.map((entry) => `${entry.packageName} | type=${entry.dependencyType} | installationPolicy=${entry.installationPolicy} | versionPolicy=${entry.versionPolicy} | risk=${entry.riskLevel} | requiresApproval=${String(entry.requiresApproval)}`);
  return [
    renderCliSection("Project generation dependency plan preview", [
      `title: ${preview.title}`,
      `schemaVersion: ${preview.schemaVersion}`,
      `readonly: ${String(preview.readonly)}`,
      `previewOnly: ${String(preview.previewOnly)}`,
      `dependencyPlanPreviewOnly: ${String(preview.dependencyPlanPreviewOnly)}`,
      `stdoutOnly: ${String(preview.stdoutOnly)}`,
      `dependencyInstallationAllowed: ${String(preview.dependencyInstallationAllowed)}`,
      `packageMutationAllowed: ${String(preview.packageMutationAllowed)}`,
      `fileWriteAllowed: ${String(preview.fileWriteAllowed)}`,
      `fileCreationAllowed: ${String(preview.fileCreationAllowed)}`,
      `scaffoldGenerationEnabled: ${String(preview.scaffoldGenerationEnabled)}`,
      `runtimeRoutingEnabled: ${String(preview.runtimeRoutingEnabled)}`,
      `runtimeActivationEnabled: ${String(preview.runtimeActivationEnabled)}`,
      `policyEnforcementEnabled: ${String(preview.policyEnforcementEnabled)}`,
      `projectGenerationEnabled: ${String(preview.projectGenerationEnabled)}`,
      `builderAgentRuntimeEnabled: ${String(preview.builderAgentRuntimeEnabled)}`,
      "notice: no dependency installation, package mutation, file creation, scaffold generation, project generation, builder-agent runtime, runtime activation, policy enforcement, runtime routing, mutation expansion, or file writing is enabled"
    ]),
    renderCliMetadata(preview.metadata),
    renderCliProjectGenerationDependencyPlanSummary(preview.summary),
    renderCliSection("Dependency plan entries", entryLines),
    renderReadonlyNotice(preview.previewOnly)
  ].join("\n");
}

export function renderCliProjectGenerationValidationPlanSummary(summary: ProjectGenerationValidationPlanSummary): string {
  return [
    renderCliSection("Project generation validation plan preview summary", [
      `check count: ${summary.totalChecks}`,
      `approval-required count: ${summary.approvalRequiredCount}`,
      `blocked count: ${summary.blockedCount}`,
      `no-execute count: ${summary.noExecuteCount}`,
      `manual-approval-required count: ${summary.manualApprovalRequiredCount}`,
      `preview-only count: ${summary.previewOnlyCount}`,
      `risk distribution: ${renderCliValidationRiskGroups(summary.riskDistribution)}`,
      `completeness score: ${summary.completeness.score}`,
      `completeness level: ${summary.completeness.level}`,
      `completeness reason: ${summary.completeness.reason}`,
      `read-only: ${String(summary.readonly)}`,
      `preview-only: ${String(summary.previewOnly)}`
    ]),
    renderCliWarnings(summary.warnings),
    renderCliSection("Recommendations", summary.recommendations.length === 0 ? ["none"] : summary.recommendations)
  ].join("\n");
}

export function renderCliProjectGenerationValidationPlanPreview(preview: ProjectGenerationValidationPlanPreview): string {
  const checkLines = preview.checks.length === 0
    ? ["none"]
    : preview.checks.map((check) => `${check.checkId} | type=${check.checkType} | executionPolicy=${check.executionPolicy} | risk=${check.riskLevel} | requiresApproval=${String(check.requiresApproval)}`);
  return [
    renderCliSection("Project generation validation plan preview", [
      `title: ${preview.title}`,
      `schemaVersion: ${preview.schemaVersion}`,
      `readonly: ${String(preview.readonly)}`,
      `previewOnly: ${String(preview.previewOnly)}`,
      `validationPlanPreviewOnly: ${String(preview.validationPlanPreviewOnly)}`,
      `stdoutOnly: ${String(preview.stdoutOnly)}`,
      `validationExecutionAllowed: ${String(preview.validationExecutionAllowed)}`,
      `generatedProjectValidationAllowed: ${String(preview.generatedProjectValidationAllowed)}`,
      `commandExecutionAllowed: ${String(preview.commandExecutionAllowed)}`,
      `dependencyInstallationAllowed: ${String(preview.dependencyInstallationAllowed)}`,
      `packageMutationAllowed: ${String(preview.packageMutationAllowed)}`,
      `fileWriteAllowed: ${String(preview.fileWriteAllowed)}`,
      `fileCreationAllowed: ${String(preview.fileCreationAllowed)}`,
      `scaffoldGenerationEnabled: ${String(preview.scaffoldGenerationEnabled)}`,
      `runtimeRoutingEnabled: ${String(preview.runtimeRoutingEnabled)}`,
      `runtimeActivationEnabled: ${String(preview.runtimeActivationEnabled)}`,
      `policyEnforcementEnabled: ${String(preview.policyEnforcementEnabled)}`,
      `projectGenerationEnabled: ${String(preview.projectGenerationEnabled)}`,
      `builderAgentRuntimeEnabled: ${String(preview.builderAgentRuntimeEnabled)}`,
      "notice: no validation execution, generated-project validation, command execution, dependency installation, package mutation, file creation, scaffold generation, project generation, builder-agent runtime, runtime activation, policy enforcement, runtime routing, mutation expansion, or file writing is enabled"
    ]),
    renderCliMetadata(preview.metadata),
    renderCliProjectGenerationValidationPlanSummary(preview.summary),
    renderCliSection("Validation plan checks", checkLines),
    renderReadonlyNotice(preview.previewOnly)
  ].join("\n");
}

export function renderCliProjectGenerationApprovalPlanSummary(summary: ProjectGenerationApprovalPlanSummary): string {
  return [
    renderCliSection("Project generation approval plan preview summary", [
      `gate count: ${summary.totalGates}`,
      `human-required count: ${summary.humanRequiredCount}`,
      `blocked count: ${summary.blockedCount}`,
      `preview-only count: ${summary.previewOnlyCount}`,
      `manual-approval-required count: ${summary.manualApprovalRequiredCount}`,
      `not-applicable count: ${summary.notApplicableCount}`,
      `risk distribution: ${renderCliApprovalRiskGroups(summary.riskDistribution)}`,
      `completeness score: ${summary.completeness.score}`,
      `completeness level: ${summary.completeness.level}`,
      `completeness reason: ${summary.completeness.reason}`,
      `read-only: ${String(summary.readonly)}`,
      `preview-only: ${String(summary.previewOnly)}`
    ]),
    renderCliWarnings(summary.warnings),
    renderCliSection("Recommendations", summary.recommendations.length === 0 ? ["none"] : summary.recommendations)
  ].join("\n");
}

export function renderCliProjectGenerationApprovalPlanPreview(preview: ProjectGenerationApprovalPlanPreview): string {
  const gateLines = preview.gates.length === 0
    ? ["none"]
    : preview.gates.map((gate) => `${gate.gateId} | type=${gate.gateType} | approvalPolicy=${gate.approvalPolicy} | decisionStatus=${gate.decisionStatus} | risk=${gate.riskLevel} | requiresHumanApproval=${String(gate.requiresHumanApproval)}`);
  return [
    renderCliSection("Project generation approval plan preview", [
      `title: ${preview.title}`,
      `schemaVersion: ${preview.schemaVersion}`,
      `readonly: ${String(preview.readonly)}`,
      `previewOnly: ${String(preview.previewOnly)}`,
      `approvalPlanPreviewOnly: ${String(preview.approvalPlanPreviewOnly)}`,
      `stdoutOnly: ${String(preview.stdoutOnly)}`,
      `approvalExecutionAllowed: ${String(preview.approvalExecutionAllowed)}`,
      `approvalDecisionApplied: ${String(preview.approvalDecisionApplied)}`,
      `projectGenerationApproved: ${String(preview.projectGenerationApproved)}`,
      `validationExecutionAllowed: ${String(preview.validationExecutionAllowed)}`,
      `generatedProjectValidationAllowed: ${String(preview.generatedProjectValidationAllowed)}`,
      `commandExecutionAllowed: ${String(preview.commandExecutionAllowed)}`,
      `dependencyInstallationAllowed: ${String(preview.dependencyInstallationAllowed)}`,
      `packageMutationAllowed: ${String(preview.packageMutationAllowed)}`,
      `fileWriteAllowed: ${String(preview.fileWriteAllowed)}`,
      `fileCreationAllowed: ${String(preview.fileCreationAllowed)}`,
      `scaffoldGenerationEnabled: ${String(preview.scaffoldGenerationEnabled)}`,
      `runtimeRoutingEnabled: ${String(preview.runtimeRoutingEnabled)}`,
      `runtimeActivationEnabled: ${String(preview.runtimeActivationEnabled)}`,
      `policyEnforcementEnabled: ${String(preview.policyEnforcementEnabled)}`,
      `projectGenerationEnabled: ${String(preview.projectGenerationEnabled)}`,
      `builderAgentRuntimeEnabled: ${String(preview.builderAgentRuntimeEnabled)}`,
      "notice: no approval execution, approval decision application, project generation approval, validation execution, generated-project validation, command execution, dependency installation, package mutation, file creation, scaffold generation, project generation, builder-agent runtime, runtime activation, policy enforcement, runtime routing, mutation expansion, or file writing is enabled"
    ]),
    renderCliMetadata(preview.metadata),
    renderCliProjectGenerationApprovalPlanSummary(preview.summary),
    renderCliSection("Approval gates", gateLines),
    renderReadonlyNotice(preview.previewOnly)
  ].join("\n");
}

export function renderCliProjectGenerationRiskPlanSummary(summary: ProjectGenerationRiskPlanSummary): string {
  return [
    renderCliSection("Project generation risk plan preview summary", [
      `risk count: ${summary.totalRisks}`,
      `blocked count: ${summary.blockedCount}`,
      `human-approval-required count: ${summary.humanApprovalRequiredCount}`,
      `severity distribution: ${renderCliRiskSeverityGroups(summary.severityDistribution)}`,
      `affected plan distribution: ${renderCliAffectedPlanGroups(summary.affectedPlanDistribution)}`,
      `exposure score: ${summary.exposure.score}`,
      `exposure level: ${summary.exposure.level}`,
      `exposure reason: ${summary.exposure.reason}`,
      `read-only: ${String(summary.readonly)}`,
      `preview-only: ${String(summary.previewOnly)}`
    ]),
    renderCliWarnings(summary.warnings),
    renderCliSection("Recommendations", summary.recommendations.length === 0 ? ["none"] : summary.recommendations)
  ].join("\n");
}

export function renderCliProjectGenerationRiskPlanPreview(preview: ProjectGenerationRiskPlanPreview): string {
  const riskLines = preview.risks.length === 0
    ? ["none"]
    : preview.risks.map((risk) => `${risk.riskId} | type=${risk.riskType} | affectedPlan=${risk.affectedPlan} | severity=${risk.severity} | likelihood=${risk.likelihood} | mitigationPolicy=${risk.mitigationPolicy}`);
  return [
    renderCliSection("Project generation risk plan preview", [
      `title: ${preview.title}`,
      `schemaVersion: ${preview.schemaVersion}`,
      `readonly: ${String(preview.readonly)}`,
      `previewOnly: ${String(preview.previewOnly)}`,
      `riskPlanPreviewOnly: ${String(preview.riskPlanPreviewOnly)}`,
      `stdoutOnly: ${String(preview.stdoutOnly)}`,
      `riskEnforcementAllowed: ${String(preview.riskEnforcementAllowed)}`,
      `mitigationEnforcementEnabled: ${String(preview.mitigationEnforcementEnabled)}`,
      `approvalExecutionAllowed: ${String(preview.approvalExecutionAllowed)}`,
      `approvalDecisionApplied: ${String(preview.approvalDecisionApplied)}`,
      `projectGenerationApproved: ${String(preview.projectGenerationApproved)}`,
      `validationExecutionAllowed: ${String(preview.validationExecutionAllowed)}`,
      `generatedProjectValidationAllowed: ${String(preview.generatedProjectValidationAllowed)}`,
      `commandExecutionAllowed: ${String(preview.commandExecutionAllowed)}`,
      `dependencyInstallationAllowed: ${String(preview.dependencyInstallationAllowed)}`,
      `packageMutationAllowed: ${String(preview.packageMutationAllowed)}`,
      `fileWriteAllowed: ${String(preview.fileWriteAllowed)}`,
      `fileCreationAllowed: ${String(preview.fileCreationAllowed)}`,
      `scaffoldGenerationEnabled: ${String(preview.scaffoldGenerationEnabled)}`,
      `runtimeRoutingEnabled: ${String(preview.runtimeRoutingEnabled)}`,
      `runtimeActivationEnabled: ${String(preview.runtimeActivationEnabled)}`,
      `policyEnforcementEnabled: ${String(preview.policyEnforcementEnabled)}`,
      `projectGenerationEnabled: ${String(preview.projectGenerationEnabled)}`,
      `builderAgentRuntimeEnabled: ${String(preview.builderAgentRuntimeEnabled)}`,
      "notice: no risk enforcement, mitigation enforcement, approval execution, approval decision application, project generation approval, validation execution, generated-project validation, command execution, dependency installation, package mutation, file creation, scaffold generation, project generation, builder-agent runtime, runtime activation, policy enforcement, runtime routing, mutation expansion, or file writing is enabled"
    ]),
    renderCliMetadata(preview.metadata),
    renderCliProjectGenerationRiskPlanSummary(preview.summary),
    renderCliSection("Risk entries", riskLines),
    renderReadonlyNotice(preview.previewOnly)
  ].join("\n");
}

export function renderCliProjectGenerationRollbackPlanSummary(summary: ProjectGenerationRollbackPlanSummary): string {
  return [
    renderCliSection("Project generation rollback plan preview summary", [
      `rollback step count: ${summary.totalSteps}`,
      `blocked count: ${summary.blockedCount}`,
      `human-approval-required count: ${summary.humanApprovalRequiredCount}`,
      `preview-only count: ${summary.previewOnlyCount}`,
      `manual-approval-required count: ${summary.manualApprovalRequiredCount}`,
      `not-applicable count: ${summary.notApplicableCount}`,
      `risk distribution: ${renderCliRollbackRiskGroups(summary.riskDistribution)}`,
      `applies-to distribution: ${renderCliRollbackAppliesToGroups(summary.appliesToDistribution)}`,
      `readiness score: ${summary.readiness.score}`,
      `readiness level: ${summary.readiness.level}`,
      `readiness reason: ${summary.readiness.reason}`,
      `read-only: ${String(summary.readonly)}`,
      `preview-only: ${String(summary.previewOnly)}`
    ]),
    renderCliWarnings(summary.warnings),
    renderCliSection("Recommendations", summary.recommendations.length === 0 ? ["none"] : summary.recommendations)
  ].join("\n");
}

export function renderCliProjectGenerationRollbackPlanPreview(preview: ProjectGenerationRollbackPlanPreview): string {
  const stepLines = preview.steps.length === 0
    ? ["none"]
    : preview.steps.map((step) => `${step.stepId} | type=${step.stepType} | appliesTo=${step.appliesTo} | rollbackPolicy=${step.rollbackPolicy} | recoveryPolicy=${step.recoveryPolicy} | risk=${step.riskLevel}`);
  return [
    renderCliSection("Project generation rollback plan preview", [
      `title: ${preview.title}`,
      `schemaVersion: ${preview.schemaVersion}`,
      `readonly: ${String(preview.readonly)}`,
      `previewOnly: ${String(preview.previewOnly)}`,
      `rollbackPlanPreviewOnly: ${String(preview.rollbackPlanPreviewOnly)}`,
      `stdoutOnly: ${String(preview.stdoutOnly)}`,
      `rollbackExecutionAllowed: ${String(preview.rollbackExecutionAllowed)}`,
      `recoveryExecutionAllowed: ${String(preview.recoveryExecutionAllowed)}`,
      `riskEnforcementAllowed: ${String(preview.riskEnforcementAllowed)}`,
      `mitigationEnforcementEnabled: ${String(preview.mitigationEnforcementEnabled)}`,
      `approvalExecutionAllowed: ${String(preview.approvalExecutionAllowed)}`,
      `approvalDecisionApplied: ${String(preview.approvalDecisionApplied)}`,
      `projectGenerationApproved: ${String(preview.projectGenerationApproved)}`,
      `validationExecutionAllowed: ${String(preview.validationExecutionAllowed)}`,
      `generatedProjectValidationAllowed: ${String(preview.generatedProjectValidationAllowed)}`,
      `commandExecutionAllowed: ${String(preview.commandExecutionAllowed)}`,
      `dependencyInstallationAllowed: ${String(preview.dependencyInstallationAllowed)}`,
      `packageMutationAllowed: ${String(preview.packageMutationAllowed)}`,
      `fileWriteAllowed: ${String(preview.fileWriteAllowed)}`,
      `fileCreationAllowed: ${String(preview.fileCreationAllowed)}`,
      `scaffoldGenerationEnabled: ${String(preview.scaffoldGenerationEnabled)}`,
      `runtimeRoutingEnabled: ${String(preview.runtimeRoutingEnabled)}`,
      `runtimeActivationEnabled: ${String(preview.runtimeActivationEnabled)}`,
      `policyEnforcementEnabled: ${String(preview.policyEnforcementEnabled)}`,
      `projectGenerationEnabled: ${String(preview.projectGenerationEnabled)}`,
      `builderAgentRuntimeEnabled: ${String(preview.builderAgentRuntimeEnabled)}`,
      "notice: no rollback execution, recovery execution, risk enforcement, mitigation enforcement, approval execution, approval decision application, project generation approval, validation execution, generated-project validation, command execution, dependency installation, package mutation, file creation, scaffold generation, project generation, builder-agent runtime, runtime activation, policy enforcement, runtime routing, mutation expansion, or file writing is enabled"
    ]),
    renderCliMetadata(preview.metadata),
    renderCliProjectGenerationRollbackPlanSummary(preview.summary),
    renderCliSection("Rollback steps", stepLines),
    renderReadonlyNotice(preview.previewOnly)
  ].join("\n");
}

export function renderCliProjectGenerationPlanBundleSummary(summary: ProjectGenerationPlanBundleSummary): string {
  return [
    renderCliSection("Project generation plan bundle preview summary", [
      `section count: ${summary.totalSections}`,
      `total entries: ${summary.totalEntries}`,
      `blocked count: ${summary.totalBlockedCount}`,
      `approval-required count: ${summary.totalApprovalRequiredCount}`,
      `readiness score: ${summary.readiness.score}`,
      `readiness level: ${summary.readiness.level}`,
      `readiness reason: ${summary.readiness.reason}`,
      `read-only: ${String(summary.readonly)}`,
      `preview-only: ${String(summary.previewOnly)}`
    ]),
    renderCliWarnings(summary.warnings),
    renderCliSection("Recommendations", summary.recommendations.length === 0 ? ["none"] : summary.recommendations)
  ].join("\n");
}

export function renderCliProjectGenerationPlanBundlePreview(preview: ProjectGenerationPlanBundlePreview): string {
  const sectionLines = preview.sections.length === 0
    ? ["none"]
    : preview.sections.map((section) => `${section.sectionType} | status=${section.status} | score=${section.score} | entries=${section.entryCount} | blocked=${section.blockedCount} | approvalRequired=${section.approvalRequiredCount}`);
  return [
    renderCliSection("Project generation plan bundle preview", [
      `title: ${preview.title}`,
      `schemaVersion: ${preview.schemaVersion}`,
      `readonly: ${String(preview.readonly)}`,
      `previewOnly: ${String(preview.previewOnly)}`,
      `planBundlePreviewOnly: ${String(preview.planBundlePreviewOnly)}`,
      `stdoutOnly: ${String(preview.stdoutOnly)}`,
      `bundleExecutionAllowed: ${String(preview.bundleExecutionAllowed)}`,
      `bundleWriteAllowed: ${String(preview.bundleWriteAllowed)}`,
      `rollbackExecutionAllowed: ${String(preview.rollbackExecutionAllowed)}`,
      `recoveryExecutionAllowed: ${String(preview.recoveryExecutionAllowed)}`,
      `riskEnforcementAllowed: ${String(preview.riskEnforcementAllowed)}`,
      `mitigationEnforcementEnabled: ${String(preview.mitigationEnforcementEnabled)}`,
      `approvalExecutionAllowed: ${String(preview.approvalExecutionAllowed)}`,
      `approvalDecisionApplied: ${String(preview.approvalDecisionApplied)}`,
      `projectGenerationApproved: ${String(preview.projectGenerationApproved)}`,
      `validationExecutionAllowed: ${String(preview.validationExecutionAllowed)}`,
      `generatedProjectValidationAllowed: ${String(preview.generatedProjectValidationAllowed)}`,
      `commandExecutionAllowed: ${String(preview.commandExecutionAllowed)}`,
      `dependencyInstallationAllowed: ${String(preview.dependencyInstallationAllowed)}`,
      `packageMutationAllowed: ${String(preview.packageMutationAllowed)}`,
      `fileWriteAllowed: ${String(preview.fileWriteAllowed)}`,
      `fileCreationAllowed: ${String(preview.fileCreationAllowed)}`,
      `scaffoldGenerationEnabled: ${String(preview.scaffoldGenerationEnabled)}`,
      `runtimeRoutingEnabled: ${String(preview.runtimeRoutingEnabled)}`,
      `runtimeActivationEnabled: ${String(preview.runtimeActivationEnabled)}`,
      `policyEnforcementEnabled: ${String(preview.policyEnforcementEnabled)}`,
      `projectGenerationEnabled: ${String(preview.projectGenerationEnabled)}`,
      `builderAgentRuntimeEnabled: ${String(preview.builderAgentRuntimeEnabled)}`,
      "notice: no bundle execution, bundle writing, rollback execution, recovery execution, risk enforcement, mitigation enforcement, approval execution, approval decision application, project generation approval, validation execution, generated-project validation, command execution, dependency installation, package mutation, file creation, scaffold generation, project generation, builder-agent runtime, runtime activation, policy enforcement, runtime routing, mutation expansion, or file writing is enabled"
    ]),
    renderCliMetadata(preview.metadata),
    renderCliProjectGenerationPlanBundleSummary(preview.summary),
    renderCliSection("Plan bundle sections", sectionLines),
    renderReadonlyNotice(preview.previewOnly)
  ].join("\n");
}

export function renderCliProjectGenerationReadinessCompletionAuditSummary(summary: ProjectGenerationReadinessCompletionAuditSummary): string {
  return [
    renderCliSection("Project generation readiness completion audit summary", [
      `section count: ${summary.totalSections}`,
      `total entries: ${summary.totalEntries}`,
      `complete sections: ${summary.completeSections}`,
      `partial sections: ${summary.partialSections}`,
      `blocked sections: ${summary.blockedSections}`,
      `not-started sections: ${summary.notStartedSections}`,
      `preview-only sections: ${summary.previewOnlySections}`,
      `CLI preview path coverage: ${summary.cliPreviewPathCount}`,
      `scenario coverage: ${summary.scenarioCoverageCount}`,
      `completion score: ${summary.completion.score}`,
      `completion level: ${summary.completion.level}`,
      `completion reason: ${summary.completion.reason}`,
      `read-only: ${String(summary.readonly)}`,
      `preview-only: ${String(summary.previewOnly)}`,
      `no-execution: ${String(summary.noExecution)}`
    ]),
    renderCliWarnings(summary.warnings),
    renderCliSection("Recommendations", summary.recommendations.length === 0 ? ["none"] : summary.recommendations)
  ].join("\n");
}

export function renderCliProjectGenerationReadinessCompletionAudit(audit: ProjectGenerationReadinessCompletionAudit): string {
  const sectionLines = audit.sections.length === 0
    ? ["none"]
    : audit.sections.map((section) => `${section.sectionType} | status=${section.status} | score=${section.score} | entries=${section.entryCount} | noExecution=${String(section.noExecution)}`);
  return [
    renderCliSection("Project generation readiness completion audit", [
      `title: ${audit.title}`,
      `schemaVersion: ${audit.schemaVersion}`,
      `readonly: ${String(audit.readonly)}`,
      `previewOnly: ${String(audit.previewOnly)}`,
      `completionAuditOnly: ${String(audit.completionAuditOnly)}`,
      `stdoutOnly: ${String(audit.stdoutOnly)}`,
      `bundleExecutionAllowed: ${String(audit.bundleExecutionAllowed)}`,
      `rollbackExecutionAllowed: ${String(audit.rollbackExecutionAllowed)}`,
      `recoveryExecutionAllowed: ${String(audit.recoveryExecutionAllowed)}`,
      `riskEnforcementAllowed: ${String(audit.riskEnforcementAllowed)}`,
      `mitigationEnforcementEnabled: ${String(audit.mitigationEnforcementEnabled)}`,
      `approvalExecutionAllowed: ${String(audit.approvalExecutionAllowed)}`,
      `approvalDecisionApplied: ${String(audit.approvalDecisionApplied)}`,
      `projectGenerationApproved: ${String(audit.projectGenerationApproved)}`,
      `validationExecutionAllowed: ${String(audit.validationExecutionAllowed)}`,
      `generatedProjectValidationAllowed: ${String(audit.generatedProjectValidationAllowed)}`,
      `commandExecutionAllowed: ${String(audit.commandExecutionAllowed)}`,
      `dependencyInstallationAllowed: ${String(audit.dependencyInstallationAllowed)}`,
      `packageMutationAllowed: ${String(audit.packageMutationAllowed)}`,
      `fileWriteAllowed: ${String(audit.fileWriteAllowed)}`,
      `fileCreationAllowed: ${String(audit.fileCreationAllowed)}`,
      `scaffoldGenerationEnabled: ${String(audit.scaffoldGenerationEnabled)}`,
      `runtimeRoutingEnabled: ${String(audit.runtimeRoutingEnabled)}`,
      `runtimeActivationEnabled: ${String(audit.runtimeActivationEnabled)}`,
      `policyEnforcementEnabled: ${String(audit.policyEnforcementEnabled)}`,
      `projectGenerationEnabled: ${String(audit.projectGenerationEnabled)}`,
      `builderAgentRuntimeEnabled: ${String(audit.builderAgentRuntimeEnabled)}`,
      "notice: no project generation, no execution, no bundle execution, rollback execution, recovery execution, risk enforcement, mitigation enforcement, approval execution, approval decision application, project generation approval, validation execution, generated-project validation, command execution, dependency installation, package mutation, file creation, scaffold generation, builder-agent runtime, runtime activation, policy enforcement, runtime routing, mutation expansion, or file writing is enabled"
    ]),
    renderCliMetadata(audit.metadata),
    renderCliProjectGenerationReadinessCompletionAuditSummary(audit.summary),
    renderCliSection("Readiness completion audit sections", sectionLines),
    renderReadonlyNotice(audit.previewOnly)
  ].join("\n");
}

export function renderCliControlledProjectGenerationDesignContractSummary(summary: ControlledProjectGenerationContractSummary): string {
  return [
    renderCliSection("Controlled project generation design contract summary", [
      `section count: ${summary.totalSections}`,
      `total requirements: ${summary.totalRequirements}`,
      `total allowed outputs: ${summary.totalAllowed}`,
      `total forbidden actions: ${summary.totalForbidden}`,
      `total risks: ${summary.totalRisks}`,
      `defined sections: ${summary.definedSections}`,
      `partial sections: ${summary.partialSections}`,
      `blocked sections: ${summary.blockedSections}`,
      `not-started sections: ${summary.notStartedSections}`,
      `preview-only sections: ${summary.previewOnlySections}`,
      `completeness score: ${summary.completeness.score}`,
      `completeness level: ${summary.completeness.level}`,
      `completeness reason: ${summary.completeness.reason}`,
      `read-only: ${String(summary.readonly)}`,
      `preview-only: ${String(summary.previewOnly)}`,
      `no-execution: ${String(summary.noExecution)}`
    ]),
    renderCliWarnings(summary.warnings),
    renderCliSection("Recommendations", summary.recommendations.length === 0 ? ["none"] : summary.recommendations)
  ].join("\n");
}

export function renderCliControlledProjectGenerationDesignContract(contract: ControlledProjectGenerationDesignContract): string {
  const sectionLines = contract.sections.length === 0
    ? ["none"]
    : contract.sections.map((section) => `${section.sectionType} | status=${section.status} | score=${section.score} | requirements=${section.requirements.length} | forbidden=${section.forbidden.length} | noExecution=${String(section.noExecution)}`);
  return [
    renderCliSection("Controlled project generation design contract", [
      `title: ${contract.title}`,
      `schemaVersion: ${contract.schemaVersion}`,
      `readonly: ${String(contract.readonly)}`,
      `previewOnly: ${String(contract.previewOnly)}`,
      `designContractOnly: ${String(contract.designContractOnly)}`,
      `stdoutOnly: ${String(contract.stdoutOnly)}`,
      `generationRuntimeImplemented: ${String(contract.generationRuntimeImplemented)}`,
      `generationExecutionAllowed: ${String(contract.generationExecutionAllowed)}`,
      `bundleExecutionAllowed: ${String(contract.bundleExecutionAllowed)}`,
      `rollbackExecutionAllowed: ${String(contract.rollbackExecutionAllowed)}`,
      `recoveryExecutionAllowed: ${String(contract.recoveryExecutionAllowed)}`,
      `riskEnforcementAllowed: ${String(contract.riskEnforcementAllowed)}`,
      `mitigationEnforcementEnabled: ${String(contract.mitigationEnforcementEnabled)}`,
      `approvalExecutionAllowed: ${String(contract.approvalExecutionAllowed)}`,
      `approvalDecisionApplied: ${String(contract.approvalDecisionApplied)}`,
      `projectGenerationApproved: ${String(contract.projectGenerationApproved)}`,
      `validationExecutionAllowed: ${String(contract.validationExecutionAllowed)}`,
      `generatedProjectValidationAllowed: ${String(contract.generatedProjectValidationAllowed)}`,
      `commandExecutionAllowed: ${String(contract.commandExecutionAllowed)}`,
      `dependencyInstallationAllowed: ${String(contract.dependencyInstallationAllowed)}`,
      `packageMutationAllowed: ${String(contract.packageMutationAllowed)}`,
      `fileWriteAllowed: ${String(contract.fileWriteAllowed)}`,
      `fileCreationAllowed: ${String(contract.fileCreationAllowed)}`,
      `scaffoldGenerationEnabled: ${String(contract.scaffoldGenerationEnabled)}`,
      `runtimeRoutingEnabled: ${String(contract.runtimeRoutingEnabled)}`,
      `runtimeActivationEnabled: ${String(contract.runtimeActivationEnabled)}`,
      `policyEnforcementEnabled: ${String(contract.policyEnforcementEnabled)}`,
      `projectGenerationEnabled: ${String(contract.projectGenerationEnabled)}`,
      `builderAgentRuntimeEnabled: ${String(contract.builderAgentRuntimeEnabled)}`,
      "notice: no runtime, no project generation, no generation execution, no bundle execution, rollback execution, recovery execution, risk enforcement, mitigation enforcement, approval execution, approval decision application, validation execution, generated-project validation, command execution, dependency installation, package mutation, file creation, scaffold generation, builder-agent runtime, runtime activation, policy enforcement, runtime routing, mutation expansion, or file writing is enabled"
    ]),
    renderCliMetadata(contract.metadata),
    renderCliControlledProjectGenerationDesignContractSummary(contract.summary),
    renderCliSection("Contract sections", sectionLines),
    renderReadonlyNotice(contract.previewOnly)
  ].join("\n");
}

export function renderCliControlledProjectGenerationInputContractSummary(summary: ControlledProjectGenerationInputContractSummary): string {
  return [
    renderCliSection("Controlled project generation input contract summary", [
      `field count: ${summary.totalFields}`,
      `required field count: ${summary.requiredFieldCount}`,
      `optional field count: ${summary.optionalFieldCount}`,
      `blocked field count: ${summary.blockedFieldCount}`,
      `group distribution: ${renderCliInputFieldGroups(summary.groupDistribution)}`,
      `risk distribution: ${renderCliInputFieldGroups(summary.riskDistribution)}`,
      `validation policy distribution: ${renderCliInputFieldGroups(summary.validationPolicyDistribution)}`,
      `completeness score: ${summary.completeness.score}`,
      `completeness level: ${summary.completeness.level}`,
      `completeness reason: ${summary.completeness.reason}`,
      `read-only: ${String(summary.readonly)}`,
      `preview-only: ${String(summary.previewOnly)}`
    ]),
    renderCliWarnings(summary.warnings),
    renderCliSection("Recommendations", summary.recommendations.length === 0 ? ["none"] : summary.recommendations)
  ].join("\n");
}

export function renderCliControlledProjectGenerationInputContract(contract: ControlledProjectGenerationInputContract): string {
  const fieldLines = contract.fields.length === 0
    ? ["none"]
    : contract.fields.map((field) => `${field.fieldId} | group=${field.group} | required=${String(field.required)} | policy=${field.validationPolicy} | risk=${field.riskLevel}`);
  return [
    renderCliSection("Controlled project generation input contract", [
      `title: ${contract.title}`,
      `schemaVersion: ${contract.schemaVersion}`,
      `readonly: ${String(contract.readonly)}`,
      `previewOnly: ${String(contract.previewOnly)}`,
      `inputContractOnly: ${String(contract.inputContractOnly)}`,
      `stdoutOnly: ${String(contract.stdoutOnly)}`,
      `liveInputValidationAllowed: ${String(contract.liveInputValidationAllowed)}`,
      `inputExecutionAllowed: ${String(contract.inputExecutionAllowed)}`,
      `generationRuntimeImplemented: ${String(contract.generationRuntimeImplemented)}`,
      `generationExecutionAllowed: ${String(contract.generationExecutionAllowed)}`,
      `bundleExecutionAllowed: ${String(contract.bundleExecutionAllowed)}`,
      `rollbackExecutionAllowed: ${String(contract.rollbackExecutionAllowed)}`,
      `recoveryExecutionAllowed: ${String(contract.recoveryExecutionAllowed)}`,
      `riskEnforcementAllowed: ${String(contract.riskEnforcementAllowed)}`,
      `approvalExecutionAllowed: ${String(contract.approvalExecutionAllowed)}`,
      `validationExecutionAllowed: ${String(contract.validationExecutionAllowed)}`,
      `dependencyInstallationAllowed: ${String(contract.dependencyInstallationAllowed)}`,
      `packageMutationAllowed: ${String(contract.packageMutationAllowed)}`,
      `fileWriteAllowed: ${String(contract.fileWriteAllowed)}`,
      `fileCreationAllowed: ${String(contract.fileCreationAllowed)}`,
      `scaffoldGenerationEnabled: ${String(contract.scaffoldGenerationEnabled)}`,
      `runtimeRoutingEnabled: ${String(contract.runtimeRoutingEnabled)}`,
      `runtimeActivationEnabled: ${String(contract.runtimeActivationEnabled)}`,
      `policyEnforcementEnabled: ${String(contract.policyEnforcementEnabled)}`,
      `projectGenerationEnabled: ${String(contract.projectGenerationEnabled)}`,
      `builderAgentRuntimeEnabled: ${String(contract.builderAgentRuntimeEnabled)}`,
      "notice: no input execution, no live input validation, no runtime, no project generation, no generation execution, no bundle execution, rollback execution, recovery execution, risk enforcement, approval execution, validation execution, dependency installation, package mutation, file creation, scaffold generation, builder-agent runtime, runtime activation, policy enforcement, runtime routing, mutation expansion, or file writing is enabled"
    ]),
    renderCliMetadata(contract.metadata),
    renderCliControlledProjectGenerationInputContractSummary(contract.summary),
    renderCliSection("Input fields", fieldLines),
    renderReadonlyNotice(contract.previewOnly)
  ].join("\n");
}

export function renderCliControlledProjectGenerationOutputContractSummary(summary: ControlledProjectGenerationOutputContractSummary): string {
  return [
    renderCliSection("Controlled project generation output contract summary", [
      `field count: ${summary.totalFields}`,
      `allowed output count: ${summary.allowedOutputCount}`,
      `forbidden output count: ${summary.forbiddenOutputCount}`,
      `blocked output count: ${summary.blockedOutputCount}`,
      `group distribution: ${renderCliOutputFieldGroups(summary.groupDistribution)}`,
      `format distribution: ${renderCliOutputFieldGroups(summary.formatDistribution)}`,
      `risk distribution: ${renderCliOutputFieldGroups(summary.riskDistribution)}`,
      `output policy distribution: ${renderCliOutputFieldGroups(summary.outputPolicyDistribution)}`,
      `completeness score: ${summary.completeness.score}`,
      `completeness level: ${summary.completeness.level}`,
      `completeness reason: ${summary.completeness.reason}`,
      `read-only: ${String(summary.readonly)}`,
      `preview-only: ${String(summary.previewOnly)}`,
      `stdout-only: ${String(summary.stdoutOnly)}`,
      `no-file-write: ${String(summary.noFileWrite)}`
    ]),
    renderCliWarnings(summary.warnings),
    renderCliSection("Recommendations", summary.recommendations.length === 0 ? ["none"] : summary.recommendations)
  ].join("\n");
}

export function renderCliControlledProjectGenerationOutputContract(contract: ControlledProjectGenerationOutputContract): string {
  const fieldLines = contract.fields.length === 0
    ? ["none"]
    : contract.fields.map((field) => `${field.fieldId} | group=${field.group} | format=${field.format} | policy=${field.outputPolicy} | forbidden=${field.forbidden.length}`);
  return [
    renderCliSection("Controlled project generation output contract", [
      `title: ${contract.title}`,
      `schemaVersion: ${contract.schemaVersion}`,
      `readonly: ${String(contract.readonly)}`,
      `previewOnly: ${String(contract.previewOnly)}`,
      `outputContractOnly: ${String(contract.outputContractOnly)}`,
      `stdoutOnly: ${String(contract.stdoutOnly)}`,
      `noFileWrite: ${String(contract.noFileWrite)}`,
      `outputExecutionAllowed: ${String(contract.outputExecutionAllowed)}`,
      `generationRuntimeImplemented: ${String(contract.generationRuntimeImplemented)}`,
      `generationExecutionAllowed: ${String(contract.generationExecutionAllowed)}`,
      `bundleExecutionAllowed: ${String(contract.bundleExecutionAllowed)}`,
      `rollbackExecutionAllowed: ${String(contract.rollbackExecutionAllowed)}`,
      `recoveryExecutionAllowed: ${String(contract.recoveryExecutionAllowed)}`,
      `riskEnforcementAllowed: ${String(contract.riskEnforcementAllowed)}`,
      `approvalExecutionAllowed: ${String(contract.approvalExecutionAllowed)}`,
      `validationExecutionAllowed: ${String(contract.validationExecutionAllowed)}`,
      `dependencyInstallationAllowed: ${String(contract.dependencyInstallationAllowed)}`,
      `packageMutationAllowed: ${String(contract.packageMutationAllowed)}`,
      `fileWriteAllowed: ${String(contract.fileWriteAllowed)}`,
      `fileCreationAllowed: ${String(contract.fileCreationAllowed)}`,
      `scaffoldGenerationEnabled: ${String(contract.scaffoldGenerationEnabled)}`,
      `runtimeRoutingEnabled: ${String(contract.runtimeRoutingEnabled)}`,
      `runtimeActivationEnabled: ${String(contract.runtimeActivationEnabled)}`,
      `policyEnforcementEnabled: ${String(contract.policyEnforcementEnabled)}`,
      `projectGenerationEnabled: ${String(contract.projectGenerationEnabled)}`,
      `builderAgentRuntimeEnabled: ${String(contract.builderAgentRuntimeEnabled)}`,
      "notice: no output execution, no file write, no runtime, no project generation, no generation execution, no bundle execution, rollback execution, recovery execution, risk enforcement, approval execution, validation execution, dependency installation, package mutation, file creation, scaffold generation, builder-agent runtime, runtime activation, policy enforcement, runtime routing, mutation expansion, or file writing is enabled"
    ]),
    renderCliMetadata(contract.metadata),
    renderCliControlledProjectGenerationOutputContractSummary(contract.summary),
    renderCliSection("Output fields", fieldLines),
    renderReadonlyNotice(contract.previewOnly)
  ].join("\n");
}

export function renderCliControlledProjectGenerationMutationBoundarySummary(summary: ControlledProjectGenerationMutationBoundarySummary): string {
  return [
    renderCliSection("Controlled project generation mutation boundary summary", [
      `boundary count: ${summary.totalBoundaries}`,
      `forbidden count: ${summary.forbiddenCount}`,
      `blocked count: ${summary.blockedCount}`,
      `safe-patch-only count: ${summary.safePatchOnlyCount}`,
      `approval-required count: ${summary.approvalRequiredCount}`,
      `group distribution: ${renderCliMutationBoundaryGroups(summary.groupDistribution)}`,
      `policy distribution: ${renderCliMutationBoundaryGroups(summary.policyDistribution)}`,
      `risk distribution: ${renderCliMutationBoundaryGroups(summary.riskDistribution)}`,
      `completeness score: ${summary.completeness.score}`,
      `completeness level: ${summary.completeness.level}`,
      `completeness reason: ${summary.completeness.reason}`,
      `read-only: ${String(summary.readonly)}`,
      `preview-only: ${String(summary.previewOnly)}`,
      `no-execution: ${String(summary.noExecution)}`
    ]),
    renderCliWarnings(summary.warnings),
    renderCliSection("Recommendations", summary.recommendations.length === 0 ? ["none"] : summary.recommendations)
  ].join("\n");
}

export function renderCliControlledProjectGenerationMutationBoundaryContract(contract: ControlledProjectGenerationMutationBoundaryContract): string {
  const boundaryLines = contract.boundaries.length === 0
    ? ["none"]
    : contract.boundaries.map((boundary) => `${boundary.boundaryId} | group=${boundary.group} | policy=${boundary.mutationPolicy} | risk=${boundary.riskLevel} | safePatchRequired=${String(boundary.safePatchRequired)}`);
  return [
    renderCliSection("Controlled project generation mutation boundary contract", [
      `title: ${contract.title}`,
      `schemaVersion: ${contract.schemaVersion}`,
      `readonly: ${String(contract.readonly)}`,
      `previewOnly: ${String(contract.previewOnly)}`,
      `mutationBoundaryContractOnly: ${String(contract.mutationBoundaryContractOnly)}`,
      `stdoutOnly: ${String(contract.stdoutOnly)}`,
      `mutationExecutionAllowed: ${String(contract.mutationExecutionAllowed)}`,
      `mutationExpansionAllowed: ${String(contract.mutationExpansionAllowed)}`,
      `generationRuntimeImplemented: ${String(contract.generationRuntimeImplemented)}`,
      `generationExecutionAllowed: ${String(contract.generationExecutionAllowed)}`,
      `outputExecutionAllowed: ${String(contract.outputExecutionAllowed)}`,
      `inputExecutionAllowed: ${String(contract.inputExecutionAllowed)}`,
      `bundleExecutionAllowed: ${String(contract.bundleExecutionAllowed)}`,
      `rollbackExecutionAllowed: ${String(contract.rollbackExecutionAllowed)}`,
      `recoveryExecutionAllowed: ${String(contract.recoveryExecutionAllowed)}`,
      `riskEnforcementAllowed: ${String(contract.riskEnforcementAllowed)}`,
      `approvalExecutionAllowed: ${String(contract.approvalExecutionAllowed)}`,
      `validationExecutionAllowed: ${String(contract.validationExecutionAllowed)}`,
      `dependencyInstallationAllowed: ${String(contract.dependencyInstallationAllowed)}`,
      `packageMutationAllowed: ${String(contract.packageMutationAllowed)}`,
      `fileWriteAllowed: ${String(contract.fileWriteAllowed)}`,
      `fileCreationAllowed: ${String(contract.fileCreationAllowed)}`,
      `scaffoldGenerationEnabled: ${String(contract.scaffoldGenerationEnabled)}`,
      `runtimeRoutingEnabled: ${String(contract.runtimeRoutingEnabled)}`,
      `runtimeActivationEnabled: ${String(contract.runtimeActivationEnabled)}`,
      `policyEnforcementEnabled: ${String(contract.policyEnforcementEnabled)}`,
      `projectGenerationEnabled: ${String(contract.projectGenerationEnabled)}`,
      `builderAgentRuntimeEnabled: ${String(contract.builderAgentRuntimeEnabled)}`,
      "notice: no mutation execution, no mutation expansion, no project generation, no input execution, no output execution, no bundle execution, rollback execution, recovery execution, risk enforcement, approval execution, validation execution, dependency installation, package mutation, file creation, scaffold generation, builder-agent runtime, runtime activation, policy enforcement, runtime routing, or file writing is enabled; Safe Patch Engine remains sole mutation layer"
    ]),
    renderCliMetadata(contract.metadata),
    renderCliControlledProjectGenerationMutationBoundarySummary(contract.summary),
    renderCliSection("Mutation boundaries", boundaryLines),
    renderReadonlyNotice(contract.previewOnly)
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

function renderCliDependencyRiskGroups(groups: readonly { key: string; totalDependencies: number }[]): string {
  if (groups.length === 0) return "none";
  return groups.map((group) => `${group.key}=${group.totalDependencies}`).join(", ");
}

function renderCliValidationRiskGroups(groups: readonly { key: string; totalChecks: number }[]): string {
  if (groups.length === 0) return "none";
  return groups.map((group) => `${group.key}=${group.totalChecks}`).join(", ");
}

function renderCliApprovalRiskGroups(groups: readonly { key: string; totalGates: number }[]): string {
  if (groups.length === 0) return "none";
  return groups.map((group) => `${group.key}=${group.totalGates}`).join(", ");
}

function renderCliRiskSeverityGroups(groups: readonly { key: string; totalRisks: number }[]): string {
  if (groups.length === 0) return "none";
  return groups.map((group) => `${group.key}=${group.totalRisks}`).join(", ");
}

function renderCliAffectedPlanGroups(groups: readonly { key: string; totalRisks: number }[]): string {
  if (groups.length === 0) return "none";
  return groups.map((group) => `${group.key}=${group.totalRisks}`).join(", ");
}

function renderCliRollbackRiskGroups(groups: readonly { key: string; totalSteps: number }[]): string {
  if (groups.length === 0) return "none";
  return groups.map((group) => `${group.key}=${group.totalSteps}`).join(", ");
}

function renderCliRollbackAppliesToGroups(groups: readonly { key: string; totalSteps: number }[]): string {
  if (groups.length === 0) return "none";
  return groups.map((group) => `${group.key}=${group.totalSteps}`).join(", ");
}

function renderCliMutationBoundaryGroups(groups: readonly { key: string; totalBoundaries: number }[]): string {
  if (groups.length === 0) return "none";
  return groups.map((group) => `${group.key}=${group.totalBoundaries}`).join(", ");
}

function renderCliInputFieldGroups(groups: readonly { key: string; totalFields: number }[]): string {
  if (groups.length === 0) return "none";
  return groups.map((group) => `${group.key}=${group.totalFields}`).join(", ");
}

function renderCliOutputFieldGroups(groups: readonly { key: string; totalFields: number }[]): string {
  if (groups.length === 0) return "none";
  return groups.map((group) => `${group.key}=${group.totalFields}`).join(", ");
}
