import type { GovernanceRecommendation } from "../governanceArtifact.js";
import type { GovernanceArtifact } from "../governanceArtifact.js";
import type { GovernanceArtifactDiscoveryResults, GovernanceArtifactIndex, GovernanceArtifactIndexSummary } from "../governanceArtifactIndex.js";
import type { GovernanceArtifactExportContract, GovernanceArtifactExportPayload } from "../governanceArtifactExport.js";
import type { GovernanceArtifactQueryResult, GovernanceArtifactQuerySummary } from "../governanceArtifactQuery.js";
import type { GovernanceArtifactRegistry, GovernanceArtifactRegistrySummary } from "../governanceArtifactRegistry.js";
import type { GovernanceArtifactReviewPack, GovernanceArtifactReviewPackSection, GovernanceArtifactReviewPackSummary } from "../governanceArtifactReviewPack.js";
import type { GovernanceArtifactSnapshot, GovernanceArtifactSnapshotSection, GovernanceArtifactSnapshotSummary } from "../governanceArtifactSnapshot.js";
import type { GovernanceConsolidationAudit, GovernanceConsolidationAuditSection, GovernanceConsolidationAuditSummary } from "../governanceConsolidationAudit.js";
import type { ControlledProjectGenerationApprovalBoundary, ControlledProjectGenerationApprovalBoundaryContract, ControlledProjectGenerationApprovalBoundarySummary } from "../controlledProjectGenerationApprovalBoundaryContract.js";
import type { ControlledProjectGenerationContractAudit, ControlledProjectGenerationContractAuditSection, ControlledProjectGenerationContractAuditSummary } from "../controlledProjectGenerationContractAudit.js";
import type { ControlledProjectGenerationContractBundle, ControlledProjectGenerationContractBundleSection, ControlledProjectGenerationContractBundleSummary } from "../controlledProjectGenerationContractBundle.js";
import type { ControlledProjectGenerationContractExportPayload, ControlledProjectGenerationContractExportSummary } from "../controlledProjectGenerationContractExport.js";
import type { ControlledProjectGenerationDesignCompletionAudit, ControlledProjectGenerationDesignCompletionAuditSection, ControlledProjectGenerationDesignCompletionAuditSummary } from "../controlledProjectGenerationDesignCompletionAudit.js";
import type { ControlledProjectGenerationContractSection, ControlledProjectGenerationContractSummary, ControlledProjectGenerationDesignContract } from "../controlledProjectGenerationDesignContract.js";
import type { ControlledProjectGenerationInputContract, ControlledProjectGenerationInputContractSummary, ControlledProjectGenerationInputField } from "../controlledProjectGenerationInputContract.js";
import type { ControlledProjectGenerationMutationBoundary, ControlledProjectGenerationMutationBoundaryContract, ControlledProjectGenerationMutationBoundarySummary } from "../controlledProjectGenerationMutationBoundaryContract.js";
import type { ControlledProjectGenerationOutputContract, ControlledProjectGenerationOutputContractSummary, ControlledProjectGenerationOutputField } from "../controlledProjectGenerationOutputContract.js";
import type { ControlledProjectGenerationRuntimeBoundary, ControlledProjectGenerationRuntimeBoundaryContract, ControlledProjectGenerationRuntimeBoundarySummary } from "../controlledProjectGenerationRuntimeBoundaryContract.js";
import type { ControlledRuntimeArchitectureComponent, ControlledRuntimeArchitecturePreview, ControlledRuntimeArchitectureSummary } from "../controlledRuntimeArchitecturePreview.js";
import type { ControlledRuntimeComponentContract, ControlledRuntimeComponentContractEntry, ControlledRuntimeComponentContractSummary } from "../controlledRuntimeComponentContract.js";
import type { ControlledRuntimeFlowPreview, ControlledRuntimeFlowStep, ControlledRuntimeFlowSummary, ControlledRuntimeFlowTransition } from "../controlledRuntimeFlowPreview.js";
import type { ControlledRuntimeEventDefinition, ControlledRuntimeEventLifecycleMarker, ControlledRuntimeEventModelPreview, ControlledRuntimeEventModelSummary, ControlledRuntimeEventPayloadField } from "../controlledRuntimeEventModelPreview.js";
import type { ControlledRuntimeAuditSignal, ControlledRuntimeHealthSignal, ControlledRuntimeLogDefinition, ControlledRuntimeMetricDefinition, ControlledRuntimeObservabilityPreview, ControlledRuntimeObservabilitySignal, ControlledRuntimeObservabilitySummary, ControlledRuntimeTraceDefinition } from "../controlledRuntimeObservabilityPreview.js";
import type { ControlledRuntimeStateField, ControlledRuntimeStateModelPreview, ControlledRuntimeStateModelSummary, ControlledRuntimeStateSnapshot, ControlledRuntimeStateTransition } from "../controlledRuntimeStateModelPreview.js";
import type { GovernanceMetadata } from "../governanceMetadata.js";
import type { GovernanceReadonlyContract } from "../governanceReadonlyContract.js";
import { renderReadonlyContract } from "../governanceReadonlyContract.js";
import type { GovernanceSeverity, GovernanceStatus } from "../governanceStatus.js";
import type { ProjectGenerationApprovalGate, ProjectGenerationApprovalPlanPreview, ProjectGenerationApprovalPlanSummary } from "../projectGenerationApprovalPlanPreview.js";
import type { ProjectGenerationBlueprintPreview, ProjectGenerationBlueprintSection, ProjectGenerationBlueprintSummary } from "../projectGenerationBlueprintPreview.js";
import type { ProjectGenerationCapability, ProjectGenerationCapabilityMap, ProjectGenerationCapabilitySummary } from "../projectGenerationCapabilityMap.js";
import type { ProjectGenerationDependencyPlanEntry, ProjectGenerationDependencyPlanPreview, ProjectGenerationDependencyPlanSummary } from "../projectGenerationDependencyPlanPreview.js";
import type { ProjectGenerationFilePlanEntry, ProjectGenerationFilePlanPreview, ProjectGenerationFilePlanSummary } from "../projectGenerationFilePlanPreview.js";
import type { ProjectGenerationPlanBundlePreview, ProjectGenerationPlanBundleSection, ProjectGenerationPlanBundleSummary } from "../projectGenerationPlanBundlePreview.js";
import type { ProjectGenerationReadinessAssessment, ProjectGenerationReadinessSection, ProjectGenerationReadinessSummary } from "../projectGenerationReadiness.js";
import type { ProjectGenerationReadinessCompletionAudit, ProjectGenerationReadinessCompletionAuditSection, ProjectGenerationReadinessCompletionAuditSummary } from "../projectGenerationReadinessCompletionAudit.js";
import type { ProjectGenerationRollbackPlanPreview, ProjectGenerationRollbackPlanSummary, ProjectGenerationRollbackStep } from "../projectGenerationRollbackPlanPreview.js";
import type { ProjectGenerationRiskEntry, ProjectGenerationRiskPlanPreview, ProjectGenerationRiskPlanSummary } from "../projectGenerationRiskPlanPreview.js";
import type { ProjectGenerationValidationPlanCheck, ProjectGenerationValidationPlanPreview, ProjectGenerationValidationPlanSummary } from "../projectGenerationValidationPlanPreview.js";
import { normalizeRecommendations, normalizeWarnings, sortDeterministically } from "../utils/governanceUtils.js";

export function renderSection(title: string, lines: readonly string[] = []): string {
  const body = lines.length === 0 ? ["none"] : [...lines];
  return [`## ${title}`, "", ...body].join("\n");
}

export function renderWarnings(warnings: readonly unknown[]): string {
  const normalized = normalizeWarnings(warnings);
  if (normalized.length === 0) return "Warnings: none";
  return ["Warnings:", ...normalized.map((warning) => `- ${warning}`)].join("\n");
}

export function renderRecommendations(recommendations: readonly GovernanceRecommendation[]): string {
  const normalized = normalizeRecommendations(recommendations);
  if (normalized.length === 0) return "Recommendations: none";
  return ["Recommendations:", ...normalized.map((recommendation) => `- [${recommendation.type}${recommendation.severity ? `/${recommendation.severity}` : ""}] ${recommendation.message}`)].join("\n");
}

export function renderMetadata(metadata: GovernanceMetadata): string {
  const entries = Object.entries(metadata)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}: ${String(value)}`);
  return ["Metadata:", ...sortDeterministically(entries, (entry) => entry)].join("\n");
}

export function renderStatusBlock(status: GovernanceStatus, severity?: GovernanceSeverity, reason?: string): string {
  const lines = ["Status:", `- status: ${status}`];
  if (severity !== undefined) lines.push(`- severity: ${severity}`);
  if (reason !== undefined && reason.trim().length > 0) lines.push(`- reason: ${reason.trim()}`);
  return lines.join("\n");
}

export function renderReadonlyStatusBlock(previewOnly = true): string {
  return renderStatusBlock(previewOnly ? "readonly" : "preview", "info", previewOnly ? "Preview-only and non-mutating." : "Read-only and non-mutating.");
}

export function renderInvariantBlock(invariants: Record<string, boolean | string | number>): string {
  const lines = Object.entries(invariants)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `- ${key}: ${String(value)}`);
  return ["Invariants:", ...(lines.length === 0 ? ["- none"] : lines)].join("\n");
}

export function renderSummary(summary: string): string {
  return `Summary: ${summary.trim()}`;
}

export function renderTimestamp(timestamp?: string): string {
  return `Timestamp: ${timestamp ?? "none"}`;
}

export function renderDivider(): string {
  return "---";
}

export function renderGovernanceArtifact(artifact: GovernanceArtifact & { readonlyContract?: GovernanceReadonlyContract }): string {
  const lines = [
    "Governance artifact:",
    `- artifactType: ${artifact.artifactType}`,
    `- status: ${artifact.status}`
  ];
  if (artifact.severity !== undefined) lines.push(`- severity: ${artifact.severity}`);
  lines.push(`- summary: ${artifact.summary}`);
  if (artifact.reason !== undefined && artifact.reason.trim().length > 0) lines.push(`- reason: ${artifact.reason.trim()}`);
  lines.push(renderWarnings(artifact.warnings));
  lines.push(renderRecommendations(artifact.recommendations));
  lines.push(renderMetadata(artifact.metadata));
  if (artifact.readonlyContract !== undefined) lines.push(renderReadonlyContract(artifact.readonlyContract));
  return lines.join("\n");
}

export function renderGovernanceArtifactRegistrySummary(summary: GovernanceArtifactRegistrySummary): string {
  return [
    "Governance artifact registry summary:",
    `- artifact count: ${summary.totalArtifacts}`,
    `- artifact types: ${summary.artifactTypes.length === 0 ? "none" : summary.artifactTypes.join(", ")}`,
    `- statuses: ${summary.statuses.length === 0 ? "none" : summary.statuses.join(", ")}`,
    `- all preview-only: ${String(summary.allPreviewOnly)}`,
    `- all read-only: ${String(summary.allReadonly)}`,
    renderWarnings(summary.warnings)
  ].join("\n");
}

export function renderGovernanceArtifactRegistry(registry: GovernanceArtifactRegistry): string {
  const entries = registry.entries.length === 0
    ? ["- none"]
    : registry.entries.map((entry) => [
        `- ${entry.version} ${entry.source}`,
        `artifactType=${entry.artifactType}`,
        `status=${entry.status}`,
        `readonly=${String(entry.readonly)}`,
        `previewOnly=${String(entry.previewOnly)}`
      ].join(" | "));
  return [
    `Governance artifact registry: ${registry.title}`,
    renderGovernanceArtifactRegistrySummary(registry.summary),
    "Registry entries:",
    ...entries
  ].join("\n");
}

export function renderGovernanceArtifactIndexSummary(summary: GovernanceArtifactIndexSummary): string {
  return [
    "Governance artifact index summary:",
    `- total entries: ${summary.totalEntries}`,
    `- artifact types: ${renderIndexGroups(summary.artifactTypeGroups)}`,
    `- statuses: ${renderIndexGroups(summary.statusGroups)}`,
    `- read-only entries: ${summary.readonlyEntries}`,
    `- preview-only entries: ${summary.previewOnlyEntries}`,
    `- all read-only: ${String(summary.allReadonly)}`,
    `- all preview-only: ${String(summary.allPreviewOnly)}`
  ].join("\n");
}

export function renderGovernanceArtifactIndex(index: GovernanceArtifactIndex): string {
  const entries = index.entries.length === 0
    ? ["- none"]
    : index.entries.map((entry) => [
        `- ${entry.version} ${entry.source}`,
        `artifactType=${entry.artifactType}`,
        `status=${entry.status}`,
        `readonly=${String(entry.readonly)}`,
        `previewOnly=${String(entry.previewOnly)}`
      ].join(" | "));
  return [
    `Governance artifact index: ${index.title}`,
    renderGovernanceArtifactIndexSummary(index.summary),
    "Index entries:",
    ...entries
  ].join("\n");
}

export function renderGovernanceArtifactDiscoveryResults(results: GovernanceArtifactDiscoveryResults): string {
  const entries = results.entries.length === 0
    ? ["- none"]
    : results.entries.map((entry) => `- ${entry.version} ${entry.source} artifactType=${entry.artifactType} status=${entry.status}`);
  return [
    `Governance artifact discovery results: ${results.query}`,
    `- total results: ${results.totalResults}`,
    "Results:",
    ...entries
  ].join("\n");
}

export function renderGovernanceArtifactQuerySummary(summary: GovernanceArtifactQuerySummary): string {
  return [
    "Governance artifact query summary:",
    `- total matches: ${summary.totalMatches}`,
    `- read-only: ${String(summary.readonly)}`,
    `- preview-only: ${String(summary.previewOnly)}`
  ].join("\n");
}

export function renderGovernanceArtifactQueryResult(result: GovernanceArtifactQueryResult): string {
  const entries = result.entries.length === 0
    ? ["- none"]
    : result.entries.map((entry) => `- ${entry.version} ${entry.source} artifactType=${entry.artifactType} status=${entry.status} readonly=${String(entry.readonly)} previewOnly=${String(entry.previewOnly)}`);
  return [
    "Governance artifact query result:",
    `- query type: ${result.queryType}`,
    `- query value: ${result.queryValue}`,
    renderGovernanceArtifactQuerySummary(result.summary),
    "Matching artifact entries:",
    ...entries
  ].join("\n");
}

export function renderGovernanceArtifactExportContract(contract: GovernanceArtifactExportContract): string {
  return [
    "Governance artifact export contract:",
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
    renderMetadata(contract.metadata)
  ].join("\n");
}

export function renderGovernanceArtifactExportPayload(payload: GovernanceArtifactExportPayload<unknown>): string {
  return [
    "Governance artifact export payload:",
    `- schemaVersion: ${payload.schemaVersion}`,
    renderGovernanceArtifactExportContract(payload.contract),
    "Export data:",
    JSON.stringify(payload.data, null, 2)
  ].join("\n");
}

export function renderGovernanceArtifactSnapshotSummary(summary: GovernanceArtifactSnapshotSummary): string {
  return [
    "Governance artifact snapshot summary:",
    `- total sections: ${summary.totalSections}`,
    `- total entries: ${summary.totalEntries}`,
    `- read-only: ${String(summary.readonly)}`,
    `- preview-only: ${String(summary.previewOnly)}`,
    renderWarnings(summary.warnings)
  ].join("\n");
}

export function renderGovernanceArtifactSnapshotSection(section: GovernanceArtifactSnapshotSection): string {
  return [
    `Snapshot section: ${section.title}`,
    `- sectionType: ${section.sectionType}`,
    `- summary: ${section.summary}`,
    `- entryCount: ${section.entryCount}`,
    `- read-only: ${String(section.readonly)}`,
    `- preview-only: ${String(section.previewOnly)}`,
    renderWarnings(section.warnings)
  ].join("\n");
}

export function renderGovernanceArtifactSnapshot(snapshot: GovernanceArtifactSnapshot): string {
  const sections = snapshot.sections.length === 0
    ? ["Snapshot sections:", "- none"]
    : ["Snapshot sections:", ...snapshot.sections.map(renderGovernanceArtifactSnapshotSection)];
  return [
    `Governance artifact snapshot: ${snapshot.title}`,
    `- schemaVersion: ${snapshot.schemaVersion}`,
    `- readonly: ${String(snapshot.readonly)}`,
    `- previewOnly: ${String(snapshot.previewOnly)}`,
    `- stdoutOnly: ${String(snapshot.stdoutOnly)}`,
    `- fileWriteAllowed: ${String(snapshot.fileWriteAllowed)}`,
    `- runtimeRoutingEnabled: ${String(snapshot.runtimeRoutingEnabled)}`,
    `- runtimeActivationEnabled: ${String(snapshot.runtimeActivationEnabled)}`,
    `- policyEnforcementEnabled: ${String(snapshot.policyEnforcementEnabled)}`,
    renderMetadata(snapshot.metadata),
    renderGovernanceArtifactSnapshotSummary(snapshot.summary),
    ...sections
  ].join("\n");
}

export function renderGovernanceArtifactReviewPackSummary(summary: GovernanceArtifactReviewPackSummary): string {
  return [
    "Governance artifact review pack summary:",
    `- total sections: ${summary.totalSections}`,
    `- total entries: ${summary.totalEntries}`,
    `- read-only: ${String(summary.readonly)}`,
    `- preview-only: ${String(summary.previewOnly)}`,
    renderWarnings(summary.warnings),
    "Recommendations:",
    ...(summary.recommendations.length === 0 ? ["- none"] : summary.recommendations.map((recommendation) => `- ${recommendation}`))
  ].join("\n");
}

export function renderGovernanceArtifactReviewPackSection(section: GovernanceArtifactReviewPackSection): string {
  return [
    `Review pack section: ${section.title}`,
    `- sectionType: ${section.sectionType}`,
    `- summary: ${section.summary}`,
    `- entryCount: ${section.entryCount}`,
    `- read-only: ${String(section.readonly)}`,
    `- preview-only: ${String(section.previewOnly)}`,
    renderWarnings(section.warnings),
    "Recommendations:",
    ...(section.recommendations.length === 0 ? ["- none"] : section.recommendations.map((recommendation) => `- ${recommendation}`))
  ].join("\n");
}

export function renderGovernanceArtifactReviewPack(reviewPack: GovernanceArtifactReviewPack): string {
  const sections = reviewPack.sections.length === 0
    ? ["Review pack sections:", "- none"]
    : ["Review pack sections:", ...reviewPack.sections.map(renderGovernanceArtifactReviewPackSection)];
  return [
    `Governance artifact review pack: ${reviewPack.title}`,
    `- schemaVersion: ${reviewPack.schemaVersion}`,
    `- readonly: ${String(reviewPack.readonly)}`,
    `- previewOnly: ${String(reviewPack.previewOnly)}`,
    `- stdoutOnly: ${String(reviewPack.stdoutOnly)}`,
    `- fileWriteAllowed: ${String(reviewPack.fileWriteAllowed)}`,
    `- runtimeRoutingEnabled: ${String(reviewPack.runtimeRoutingEnabled)}`,
    `- runtimeActivationEnabled: ${String(reviewPack.runtimeActivationEnabled)}`,
    `- policyEnforcementEnabled: ${String(reviewPack.policyEnforcementEnabled)}`,
    renderMetadata(reviewPack.metadata),
    renderGovernanceArtifactReviewPackSummary(reviewPack.summary),
    ...sections
  ].join("\n");
}

export function renderGovernanceConsolidationAuditSummary(summary: GovernanceConsolidationAuditSummary): string {
  return [
    "Governance consolidation audit summary:",
    `- total sections: ${summary.totalSections}`,
    `- total entries: ${summary.totalEntries}`,
    `- complete sections: ${summary.completeSections}`,
    `- warning sections: ${summary.warningSections}`,
    `- blocked sections: ${summary.blockedSections}`,
    `- completion status: ${summary.completionStatus}`,
    `- read-only: ${String(summary.readonly)}`,
    `- preview-only: ${String(summary.previewOnly)}`,
    renderWarnings(summary.warnings),
    "Recommendations:",
    ...(summary.recommendations.length === 0 ? ["- none"] : summary.recommendations.map((recommendation) => `- ${recommendation}`))
  ].join("\n");
}

export function renderGovernanceConsolidationAuditSection(section: GovernanceConsolidationAuditSection): string {
  return [
    `Audit section: ${section.title}`,
    `- sectionType: ${section.sectionType}`,
    `- status: ${section.status}`,
    `- summary: ${section.summary}`,
    `- entryCount: ${section.entryCount}`,
    `- read-only: ${String(section.readonly)}`,
    `- preview-only: ${String(section.previewOnly)}`,
    renderWarnings(section.warnings),
    "Recommendations:",
    ...(section.recommendations.length === 0 ? ["- none"] : section.recommendations.map((recommendation) => `- ${recommendation}`))
  ].join("\n");
}

export function renderGovernanceConsolidationAudit(audit: GovernanceConsolidationAudit): string {
  const sections = audit.sections.length === 0
    ? ["Audit sections:", "- none"]
    : ["Audit sections:", ...audit.sections.map(renderGovernanceConsolidationAuditSection)];
  return [
    `Governance consolidation audit: ${audit.title}`,
    `- schemaVersion: ${audit.schemaVersion}`,
    `- readonly: ${String(audit.readonly)}`,
    `- previewOnly: ${String(audit.previewOnly)}`,
    `- stdoutOnly: ${String(audit.stdoutOnly)}`,
    `- fileWriteAllowed: ${String(audit.fileWriteAllowed)}`,
    `- runtimeRoutingEnabled: ${String(audit.runtimeRoutingEnabled)}`,
    `- runtimeActivationEnabled: ${String(audit.runtimeActivationEnabled)}`,
    `- policyEnforcementEnabled: ${String(audit.policyEnforcementEnabled)}`,
    renderMetadata(audit.metadata),
    renderGovernanceConsolidationAuditSummary(audit.summary),
    ...sections
  ].join("\n");
}

export function renderProjectGenerationReadinessSummary(summary: ProjectGenerationReadinessSummary): string {
  return [
    "Project generation readiness summary:",
    `- total sections: ${summary.totalSections}`,
    `- ready sections: ${summary.readySections}`,
    `- partial sections: ${summary.partialSections}`,
    `- blocked sections: ${summary.blockedSections}`,
    `- not-started sections: ${summary.notStartedSections}`,
    `- preview-only sections: ${summary.previewOnlySections}`,
    `- readiness score: ${summary.readinessScore.score}`,
    `- readiness level: ${summary.readinessScore.level}`,
    `- score reason: ${summary.readinessScore.reason}`,
    `- read-only: ${String(summary.readonly)}`,
    `- preview-only: ${String(summary.previewOnly)}`,
    "Blocking risks:",
    ...(summary.blockingRisks.length === 0 ? ["- none"] : summary.blockingRisks.map((risk) => `- ${risk}`)),
    renderWarnings(summary.warnings),
    "Recommendations:",
    ...(summary.recommendations.length === 0 ? ["- none"] : summary.recommendations.map((recommendation) => `- ${recommendation}`))
  ].join("\n");
}

export function renderProjectGenerationReadinessSection(section: ProjectGenerationReadinessSection): string {
  return [
    `Project generation readiness section: ${section.title}`,
    `- sectionType: ${section.sectionType}`,
    `- status: ${section.status}`,
    `- readiness: ${section.readiness}`,
    `- summary: ${section.summary}`,
    `- read-only: ${String(section.readonly)}`,
    `- preview-only: ${String(section.previewOnly)}`,
    "Blocking risks:",
    ...(section.blockingRisks.length === 0 ? ["- none"] : section.blockingRisks.map((risk) => `- ${risk}`)),
    renderWarnings(section.warnings),
    "Recommendations:",
    ...(section.recommendations.length === 0 ? ["- none"] : section.recommendations.map((recommendation) => `- ${recommendation}`))
  ].join("\n");
}

export function renderProjectGenerationReadinessAssessment(assessment: ProjectGenerationReadinessAssessment): string {
  const sections = assessment.sections.length === 0
    ? ["Project generation readiness sections:", "- none"]
    : ["Project generation readiness sections:", ...assessment.sections.map(renderProjectGenerationReadinessSection)];
  return [
    `Project generation readiness assessment: ${assessment.title}`,
    `- schemaVersion: ${assessment.schemaVersion}`,
    `- readonly: ${String(assessment.readonly)}`,
    `- previewOnly: ${String(assessment.previewOnly)}`,
    `- assessmentOnly: ${String(assessment.assessmentOnly)}`,
    `- stdoutOnly: ${String(assessment.stdoutOnly)}`,
    `- fileWriteAllowed: ${String(assessment.fileWriteAllowed)}`,
    `- runtimeRoutingEnabled: ${String(assessment.runtimeRoutingEnabled)}`,
    `- runtimeActivationEnabled: ${String(assessment.runtimeActivationEnabled)}`,
    `- policyEnforcementEnabled: ${String(assessment.policyEnforcementEnabled)}`,
    `- projectGenerationEnabled: ${String(assessment.projectGenerationEnabled)}`,
    `- builderAgentRuntimeEnabled: ${String(assessment.builderAgentRuntimeEnabled)}`,
    "Notice: no runtime activation, project generation, builder-agent runtime, policy enforcement, runtime routing, or file writing is enabled.",
    renderMetadata(assessment.metadata),
    renderProjectGenerationReadinessSummary(assessment.summary),
    ...sections
  ].join("\n");
}

export function renderProjectGenerationCapabilitySummary(summary: ProjectGenerationCapabilitySummary): string {
  return [
    "Project generation capability map summary:",
    `- total capabilities: ${summary.totalCapabilities}`,
    `- status distribution: ${renderCapabilityGroups(summary.statusDistribution)}`,
    `- risk distribution: ${renderCapabilityGroups(summary.riskDistribution)}`,
    `- blocked capabilities: ${summary.blockedCapabilities.length === 0 ? "none" : summary.blockedCapabilities.join(", ")}`,
    `- total dependencies: ${summary.totalDependencies}`,
    `- read-only: ${String(summary.readonly)}`,
    `- preview-only: ${String(summary.previewOnly)}`,
    renderWarnings(summary.warnings),
    "Recommendations:",
    ...(summary.recommendations.length === 0 ? ["- none"] : summary.recommendations.map((recommendation) => `- ${recommendation}`))
  ].join("\n");
}

export function renderProjectGenerationCapability(capability: ProjectGenerationCapability): string {
  return [
    `Project generation capability: ${capability.title}`,
    `- id: ${capability.id}`,
    `- status: ${capability.status}`,
    `- riskLevel: ${capability.riskLevel}`,
    `- readiness: ${capability.readiness}`,
    `- description: ${capability.description}`,
    `- dependencies: ${capability.dependencies.length === 0 ? "none" : capability.dependencies.join(", ")}`,
    `- blockedBy: ${capability.blockedBy.length === 0 ? "none" : capability.blockedBy.join(", ")}`,
    `- requiredGovernanceArtifacts: ${capability.requiredGovernanceArtifacts.length === 0 ? "none" : capability.requiredGovernanceArtifacts.join(", ")}`,
    `- read-only: ${String(capability.readonly)}`,
    `- preview-only: ${String(capability.previewOnly)}`,
    renderWarnings(capability.warnings),
    "Recommendations:",
    ...(capability.recommendations.length === 0 ? ["- none"] : capability.recommendations.map((recommendation) => `- ${recommendation}`))
  ].join("\n");
}

export function renderProjectGenerationCapabilityMap(map: ProjectGenerationCapabilityMap): string {
  const capabilities = map.capabilities.length === 0
    ? ["Project generation capabilities:", "- none"]
    : ["Project generation capabilities:", ...map.capabilities.map(renderProjectGenerationCapability)];
  const dependencies = map.dependencies.length === 0
    ? ["Capability dependencies:", "- none"]
    : ["Capability dependencies:", ...map.dependencies.map((dependency) => `- ${dependency.id}: ${dependency.from} ${dependency.dependencyType} ${dependency.to} | planningOnly=${String(dependency.planningOnly)} | ${dependency.reason}`)];
  return [
    `Project generation capability map: ${map.title}`,
    `- schemaVersion: ${map.schemaVersion}`,
    `- readonly: ${String(map.readonly)}`,
    `- previewOnly: ${String(map.previewOnly)}`,
    `- planningOnly: ${String(map.planningOnly)}`,
    `- stdoutOnly: ${String(map.stdoutOnly)}`,
    `- fileWriteAllowed: ${String(map.fileWriteAllowed)}`,
    `- runtimeRoutingEnabled: ${String(map.runtimeRoutingEnabled)}`,
    `- runtimeActivationEnabled: ${String(map.runtimeActivationEnabled)}`,
    `- policyEnforcementEnabled: ${String(map.policyEnforcementEnabled)}`,
    `- projectGenerationEnabled: ${String(map.projectGenerationEnabled)}`,
    `- builderAgentRuntimeEnabled: ${String(map.builderAgentRuntimeEnabled)}`,
    "Notice: no runtime generation, builder-agent runtime, runtime activation, policy enforcement, runtime routing, mutation expansion, or file writing is enabled.",
    renderMetadata(map.metadata),
    renderProjectGenerationCapabilitySummary(map.summary),
    ...capabilities,
    ...dependencies
  ].join("\n");
}

export function renderProjectGenerationBlueprintSummary(summary: ProjectGenerationBlueprintSummary): string {
  return [
    "Project generation blueprint preview summary:",
    `- total sections: ${summary.totalSections}`,
    `- ready-for-design sections: ${summary.readyForDesignSections}`,
    `- preview sections: ${summary.previewSections}`,
    `- requires-approval sections: ${summary.requiresApprovalSections}`,
    `- incomplete sections: ${summary.incompleteSections}`,
    `- blocked sections: ${summary.blockedSections}`,
    `- total items: ${summary.totalItems}`,
    `- completeness score: ${summary.completeness.score}`,
    `- completeness level: ${summary.completeness.level}`,
    `- completeness reason: ${summary.completeness.reason}`,
    `- read-only: ${String(summary.readonly)}`,
    `- preview-only: ${String(summary.previewOnly)}`,
    "Risks:",
    ...(summary.risks.length === 0 ? ["- none"] : summary.risks.map((risk) => `- ${risk}`)),
    renderWarnings(summary.warnings),
    "Recommendations:",
    ...(summary.recommendations.length === 0 ? ["- none"] : summary.recommendations.map((recommendation) => `- ${recommendation}`))
  ].join("\n");
}

export function renderProjectGenerationBlueprintSection(section: ProjectGenerationBlueprintSection): string {
  return [
    `Project generation blueprint section: ${section.title}`,
    `- sectionType: ${section.sectionType}`,
    `- status: ${section.status}`,
    `- summary: ${section.summary}`,
    `- items: ${section.items.length === 0 ? "none" : section.items.join(", ")}`,
    `- read-only: ${String(section.readonly)}`,
    `- preview-only: ${String(section.previewOnly)}`,
    "Risks:",
    ...(section.risks.length === 0 ? ["- none"] : section.risks.map((risk) => `- ${risk}`)),
    renderWarnings(section.warnings),
    "Recommendations:",
    ...(section.recommendations.length === 0 ? ["- none"] : section.recommendations.map((recommendation) => `- ${recommendation}`))
  ].join("\n");
}

export function renderProjectGenerationBlueprintPreview(preview: ProjectGenerationBlueprintPreview): string {
  const sections = preview.sections.length === 0
    ? ["Project generation blueprint sections:", "- none"]
    : ["Project generation blueprint sections:", ...preview.sections.map(renderProjectGenerationBlueprintSection)];
  return [
    `Project generation blueprint preview: ${preview.title}`,
    `- schemaVersion: ${preview.schemaVersion}`,
    `- readonly: ${String(preview.readonly)}`,
    `- previewOnly: ${String(preview.previewOnly)}`,
    `- blueprintPreviewOnly: ${String(preview.blueprintPreviewOnly)}`,
    `- stdoutOnly: ${String(preview.stdoutOnly)}`,
    `- fileWriteAllowed: ${String(preview.fileWriteAllowed)}`,
    `- fileCreationAllowed: ${String(preview.fileCreationAllowed)}`,
    `- scaffoldGenerationEnabled: ${String(preview.scaffoldGenerationEnabled)}`,
    `- runtimeRoutingEnabled: ${String(preview.runtimeRoutingEnabled)}`,
    `- runtimeActivationEnabled: ${String(preview.runtimeActivationEnabled)}`,
    `- policyEnforcementEnabled: ${String(preview.policyEnforcementEnabled)}`,
    `- projectGenerationEnabled: ${String(preview.projectGenerationEnabled)}`,
    `- builderAgentRuntimeEnabled: ${String(preview.builderAgentRuntimeEnabled)}`,
    "Notice: no project generation, scaffold generation, file creation, builder-agent runtime, runtime activation, policy enforcement, runtime routing, mutation expansion, or file writing is enabled.",
    renderMetadata(preview.metadata),
    renderProjectGenerationBlueprintSummary(preview.summary),
    ...sections
  ].join("\n");
}

export function renderProjectGenerationFilePlanSummary(summary: ProjectGenerationFilePlanSummary): string {
  return [
    "Project generation file plan preview summary:",
    `- planned file count: ${summary.totalPlannedFiles}`,
    `- approval-required count: ${summary.approvalRequiredCount}`,
    `- blocked count: ${summary.blockedCount}`,
    `- no-write count: ${summary.noWriteCount}`,
    `- safe-patch-only count: ${summary.safePatchOnlyCount}`,
    `- manual-approval-required count: ${summary.manualApprovalRequiredCount}`,
    `- completeness score: ${summary.completeness.score}`,
    `- completeness level: ${summary.completeness.level}`,
    `- completeness reason: ${summary.completeness.reason}`,
    `- read-only: ${String(summary.readonly)}`,
    `- preview-only: ${String(summary.previewOnly)}`,
    "Risks:",
    ...(summary.risks.length === 0 ? ["- none"] : summary.risks.map((risk) => `- ${risk}`)),
    renderWarnings(summary.warnings),
    "Recommendations:",
    ...(summary.recommendations.length === 0 ? ["- none"] : summary.recommendations.map((recommendation) => `- ${recommendation}`))
  ].join("\n");
}

export function renderProjectGenerationFilePlanEntry(entry: ProjectGenerationFilePlanEntry): string {
  return [
    `Project generation file plan entry: ${entry.plannedPath}`,
    `- fileRole: ${entry.fileRole}`,
    `- fileType: ${entry.fileType}`,
    `- generationStatus: ${entry.generationStatus}`,
    `- mutationPolicy: ${entry.mutationPolicy}`,
    `- requiresApproval: ${String(entry.requiresApproval)}`,
    `- dependsOn: ${entry.dependsOn.length === 0 ? "none" : entry.dependsOn.join(", ")}`,
    `- read-only: ${String(entry.readonly)}`,
    `- preview-only: ${String(entry.previewOnly)}`,
    "Risks:",
    ...(entry.risks.length === 0 ? ["- none"] : entry.risks.map((risk) => `- ${risk}`)),
    renderWarnings(entry.warnings),
    "Recommendations:",
    ...(entry.recommendations.length === 0 ? ["- none"] : entry.recommendations.map((recommendation) => `- ${recommendation}`))
  ].join("\n");
}

export function renderProjectGenerationFilePlanPreview(preview: ProjectGenerationFilePlanPreview): string {
  const entries = preview.entries.length === 0
    ? ["Project generation file plan entries:", "- none"]
    : ["Project generation file plan entries:", ...preview.entries.map(renderProjectGenerationFilePlanEntry)];
  return [
    `Project generation file plan preview: ${preview.title}`,
    `- schemaVersion: ${preview.schemaVersion}`,
    `- readonly: ${String(preview.readonly)}`,
    `- previewOnly: ${String(preview.previewOnly)}`,
    `- filePlanPreviewOnly: ${String(preview.filePlanPreviewOnly)}`,
    `- stdoutOnly: ${String(preview.stdoutOnly)}`,
    `- fileWriteAllowed: ${String(preview.fileWriteAllowed)}`,
    `- fileCreationAllowed: ${String(preview.fileCreationAllowed)}`,
    `- scaffoldGenerationEnabled: ${String(preview.scaffoldGenerationEnabled)}`,
    `- runtimeRoutingEnabled: ${String(preview.runtimeRoutingEnabled)}`,
    `- runtimeActivationEnabled: ${String(preview.runtimeActivationEnabled)}`,
    `- policyEnforcementEnabled: ${String(preview.policyEnforcementEnabled)}`,
    `- projectGenerationEnabled: ${String(preview.projectGenerationEnabled)}`,
    `- builderAgentRuntimeEnabled: ${String(preview.builderAgentRuntimeEnabled)}`,
    "Notice: no file creation, scaffold generation, project generation, builder-agent runtime, runtime activation, policy enforcement, runtime routing, mutation expansion, or file writing is enabled.",
    renderMetadata(preview.metadata),
    renderProjectGenerationFilePlanSummary(preview.summary),
    ...entries
  ].join("\n");
}

export function renderProjectGenerationDependencyPlanSummary(summary: ProjectGenerationDependencyPlanSummary): string {
  return [
    "Project generation dependency plan preview summary:",
    `- dependency count: ${summary.totalDependencies}`,
    `- approval-required count: ${summary.approvalRequiredCount}`,
    `- blocked count: ${summary.blockedCount}`,
    `- no-install count: ${summary.noInstallCount}`,
    `- manual-approval-required count: ${summary.manualApprovalRequiredCount}`,
    `- preview-only count: ${summary.previewOnlyCount}`,
    `- risk distribution: ${renderDependencyRiskGroups(summary.riskDistribution)}`,
    `- completeness score: ${summary.completeness.score}`,
    `- completeness level: ${summary.completeness.level}`,
    `- completeness reason: ${summary.completeness.reason}`,
    `- read-only: ${String(summary.readonly)}`,
    `- preview-only: ${String(summary.previewOnly)}`,
    renderWarnings(summary.warnings),
    "Recommendations:",
    ...(summary.recommendations.length === 0 ? ["- none"] : summary.recommendations.map((recommendation) => `- ${recommendation}`))
  ].join("\n");
}

export function renderProjectGenerationDependencyPlanEntry(entry: ProjectGenerationDependencyPlanEntry): string {
  return [
    `Project generation dependency plan entry: ${entry.packageName}`,
    `- dependencyType: ${entry.dependencyType}`,
    `- purpose: ${entry.purpose}`,
    `- requiredBy: ${entry.requiredBy.length === 0 ? "none" : entry.requiredBy.join(", ")}`,
    `- installationPolicy: ${entry.installationPolicy}`,
    `- versionPolicy: ${entry.versionPolicy}`,
    `- riskLevel: ${entry.riskLevel}`,
    `- requiresApproval: ${String(entry.requiresApproval)}`,
    `- blockedReason: ${entry.blockedReason ?? "none"}`,
    `- read-only: ${String(entry.readonly)}`,
    `- preview-only: ${String(entry.previewOnly)}`,
    renderWarnings(entry.warnings),
    "Recommendations:",
    ...(entry.recommendations.length === 0 ? ["- none"] : entry.recommendations.map((recommendation) => `- ${recommendation}`))
  ].join("\n");
}

export function renderProjectGenerationDependencyPlanPreview(preview: ProjectGenerationDependencyPlanPreview): string {
  const entries = preview.entries.length === 0
    ? ["Project generation dependency plan entries:", "- none"]
    : ["Project generation dependency plan entries:", ...preview.entries.map(renderProjectGenerationDependencyPlanEntry)];
  return [
    `Project generation dependency plan preview: ${preview.title}`,
    `- schemaVersion: ${preview.schemaVersion}`,
    `- readonly: ${String(preview.readonly)}`,
    `- previewOnly: ${String(preview.previewOnly)}`,
    `- dependencyPlanPreviewOnly: ${String(preview.dependencyPlanPreviewOnly)}`,
    `- stdoutOnly: ${String(preview.stdoutOnly)}`,
    `- dependencyInstallationAllowed: ${String(preview.dependencyInstallationAllowed)}`,
    `- packageMutationAllowed: ${String(preview.packageMutationAllowed)}`,
    `- fileWriteAllowed: ${String(preview.fileWriteAllowed)}`,
    `- fileCreationAllowed: ${String(preview.fileCreationAllowed)}`,
    `- scaffoldGenerationEnabled: ${String(preview.scaffoldGenerationEnabled)}`,
    `- runtimeRoutingEnabled: ${String(preview.runtimeRoutingEnabled)}`,
    `- runtimeActivationEnabled: ${String(preview.runtimeActivationEnabled)}`,
    `- policyEnforcementEnabled: ${String(preview.policyEnforcementEnabled)}`,
    `- projectGenerationEnabled: ${String(preview.projectGenerationEnabled)}`,
    `- builderAgentRuntimeEnabled: ${String(preview.builderAgentRuntimeEnabled)}`,
    "Notice: no dependency installation, package mutation, file creation, scaffold generation, project generation, builder-agent runtime, runtime activation, policy enforcement, runtime routing, mutation expansion, or file writing is enabled.",
    renderMetadata(preview.metadata),
    renderProjectGenerationDependencyPlanSummary(preview.summary),
    ...entries
  ].join("\n");
}

export function renderProjectGenerationValidationPlanSummary(summary: ProjectGenerationValidationPlanSummary): string {
  return [
    "Project generation validation plan preview summary:",
    `- check count: ${summary.totalChecks}`,
    `- approval-required count: ${summary.approvalRequiredCount}`,
    `- blocked count: ${summary.blockedCount}`,
    `- no-execute count: ${summary.noExecuteCount}`,
    `- manual-approval-required count: ${summary.manualApprovalRequiredCount}`,
    `- preview-only count: ${summary.previewOnlyCount}`,
    `- risk distribution: ${renderValidationRiskGroups(summary.riskDistribution)}`,
    `- completeness score: ${summary.completeness.score}`,
    `- completeness level: ${summary.completeness.level}`,
    `- completeness reason: ${summary.completeness.reason}`,
    `- read-only: ${String(summary.readonly)}`,
    `- preview-only: ${String(summary.previewOnly)}`,
    renderWarnings(summary.warnings),
    "Recommendations:",
    ...(summary.recommendations.length === 0 ? ["- none"] : summary.recommendations.map((recommendation) => `- ${recommendation}`))
  ].join("\n");
}

export function renderProjectGenerationValidationPlanCheck(check: ProjectGenerationValidationPlanCheck): string {
  return [
    `Project generation validation plan check: ${check.checkId}`,
    `- checkType: ${check.checkType}`,
    `- commandPreview: ${check.commandPreview}`,
    `- purpose: ${check.purpose}`,
    `- requiredBy: ${check.requiredBy.length === 0 ? "none" : check.requiredBy.join(", ")}`,
    `- executionPolicy: ${check.executionPolicy}`,
    `- riskLevel: ${check.riskLevel}`,
    `- requiresApproval: ${String(check.requiresApproval)}`,
    `- blockedReason: ${check.blockedReason ?? "none"}`,
    `- expectedSignal: ${check.expectedSignal}`,
    `- read-only: ${String(check.readonly)}`,
    `- preview-only: ${String(check.previewOnly)}`,
    renderWarnings(check.warnings),
    "Recommendations:",
    ...(check.recommendations.length === 0 ? ["- none"] : check.recommendations.map((recommendation) => `- ${recommendation}`))
  ].join("\n");
}

export function renderProjectGenerationValidationPlanPreview(preview: ProjectGenerationValidationPlanPreview): string {
  const checks = preview.checks.length === 0
    ? ["Project generation validation plan checks:", "- none"]
    : ["Project generation validation plan checks:", ...preview.checks.map(renderProjectGenerationValidationPlanCheck)];
  return [
    `Project generation validation plan preview: ${preview.title}`,
    `- schemaVersion: ${preview.schemaVersion}`,
    `- readonly: ${String(preview.readonly)}`,
    `- previewOnly: ${String(preview.previewOnly)}`,
    `- validationPlanPreviewOnly: ${String(preview.validationPlanPreviewOnly)}`,
    `- stdoutOnly: ${String(preview.stdoutOnly)}`,
    `- validationExecutionAllowed: ${String(preview.validationExecutionAllowed)}`,
    `- generatedProjectValidationAllowed: ${String(preview.generatedProjectValidationAllowed)}`,
    `- commandExecutionAllowed: ${String(preview.commandExecutionAllowed)}`,
    `- dependencyInstallationAllowed: ${String(preview.dependencyInstallationAllowed)}`,
    `- packageMutationAllowed: ${String(preview.packageMutationAllowed)}`,
    `- fileWriteAllowed: ${String(preview.fileWriteAllowed)}`,
    `- fileCreationAllowed: ${String(preview.fileCreationAllowed)}`,
    `- scaffoldGenerationEnabled: ${String(preview.scaffoldGenerationEnabled)}`,
    `- runtimeRoutingEnabled: ${String(preview.runtimeRoutingEnabled)}`,
    `- runtimeActivationEnabled: ${String(preview.runtimeActivationEnabled)}`,
    `- policyEnforcementEnabled: ${String(preview.policyEnforcementEnabled)}`,
    `- projectGenerationEnabled: ${String(preview.projectGenerationEnabled)}`,
    `- builderAgentRuntimeEnabled: ${String(preview.builderAgentRuntimeEnabled)}`,
    "Notice: no validation execution, generated-project validation, command execution, dependency installation, package mutation, file creation, scaffold generation, project generation, builder-agent runtime, runtime activation, policy enforcement, runtime routing, mutation expansion, or file writing is enabled.",
    renderMetadata(preview.metadata),
    renderProjectGenerationValidationPlanSummary(preview.summary),
    ...checks
  ].join("\n");
}

export function renderProjectGenerationApprovalPlanSummary(summary: ProjectGenerationApprovalPlanSummary): string {
  return [
    "Project generation approval plan preview summary:",
    `- gate count: ${summary.totalGates}`,
    `- human-required count: ${summary.humanRequiredCount}`,
    `- blocked count: ${summary.blockedCount}`,
    `- preview-only count: ${summary.previewOnlyCount}`,
    `- manual-approval-required count: ${summary.manualApprovalRequiredCount}`,
    `- not-applicable count: ${summary.notApplicableCount}`,
    `- risk distribution: ${renderApprovalRiskGroups(summary.riskDistribution)}`,
    `- completeness score: ${summary.completeness.score}`,
    `- completeness level: ${summary.completeness.level}`,
    `- completeness reason: ${summary.completeness.reason}`,
    `- read-only: ${String(summary.readonly)}`,
    `- preview-only: ${String(summary.previewOnly)}`,
    renderWarnings(summary.warnings),
    "Recommendations:",
    ...(summary.recommendations.length === 0 ? ["- none"] : summary.recommendations.map((recommendation) => `- ${recommendation}`))
  ].join("\n");
}

export function renderProjectGenerationApprovalGate(gate: ProjectGenerationApprovalGate): string {
  return [
    `Project generation approval gate: ${gate.gateId}`,
    `- gateType: ${gate.gateType}`,
    `- title: ${gate.title}`,
    `- purpose: ${gate.purpose}`,
    `- requiredFor: ${gate.requiredFor.length === 0 ? "none" : gate.requiredFor.join(", ")}`,
    `- approvalPolicy: ${gate.approvalPolicy}`,
    `- decisionStatus: ${gate.decisionStatus}`,
    `- riskLevel: ${gate.riskLevel}`,
    `- requiresHumanApproval: ${String(gate.requiresHumanApproval)}`,
    `- blockedReason: ${gate.blockedReason ?? "none"}`,
    `- read-only: ${String(gate.readonly)}`,
    `- preview-only: ${String(gate.previewOnly)}`,
    renderWarnings(gate.warnings),
    "Recommendations:",
    ...(gate.recommendations.length === 0 ? ["- none"] : gate.recommendations.map((recommendation) => `- ${recommendation}`))
  ].join("\n");
}

export function renderProjectGenerationApprovalPlanPreview(preview: ProjectGenerationApprovalPlanPreview): string {
  const gates = preview.gates.length === 0
    ? ["Project generation approval gates:", "- none"]
    : ["Project generation approval gates:", ...preview.gates.map(renderProjectGenerationApprovalGate)];
  return [
    `Project generation approval plan preview: ${preview.title}`,
    `- schemaVersion: ${preview.schemaVersion}`,
    `- readonly: ${String(preview.readonly)}`,
    `- previewOnly: ${String(preview.previewOnly)}`,
    `- approvalPlanPreviewOnly: ${String(preview.approvalPlanPreviewOnly)}`,
    `- stdoutOnly: ${String(preview.stdoutOnly)}`,
    `- approvalExecutionAllowed: ${String(preview.approvalExecutionAllowed)}`,
    `- approvalDecisionApplied: ${String(preview.approvalDecisionApplied)}`,
    `- projectGenerationApproved: ${String(preview.projectGenerationApproved)}`,
    `- validationExecutionAllowed: ${String(preview.validationExecutionAllowed)}`,
    `- generatedProjectValidationAllowed: ${String(preview.generatedProjectValidationAllowed)}`,
    `- commandExecutionAllowed: ${String(preview.commandExecutionAllowed)}`,
    `- dependencyInstallationAllowed: ${String(preview.dependencyInstallationAllowed)}`,
    `- packageMutationAllowed: ${String(preview.packageMutationAllowed)}`,
    `- fileWriteAllowed: ${String(preview.fileWriteAllowed)}`,
    `- fileCreationAllowed: ${String(preview.fileCreationAllowed)}`,
    `- scaffoldGenerationEnabled: ${String(preview.scaffoldGenerationEnabled)}`,
    `- runtimeRoutingEnabled: ${String(preview.runtimeRoutingEnabled)}`,
    `- runtimeActivationEnabled: ${String(preview.runtimeActivationEnabled)}`,
    `- policyEnforcementEnabled: ${String(preview.policyEnforcementEnabled)}`,
    `- projectGenerationEnabled: ${String(preview.projectGenerationEnabled)}`,
    `- builderAgentRuntimeEnabled: ${String(preview.builderAgentRuntimeEnabled)}`,
    "Notice: no approval execution, approval decision application, project generation approval, validation execution, generated-project validation, command execution, dependency installation, package mutation, file creation, scaffold generation, project generation, builder-agent runtime, runtime activation, policy enforcement, runtime routing, mutation expansion, or file writing is enabled.",
    renderMetadata(preview.metadata),
    renderProjectGenerationApprovalPlanSummary(preview.summary),
    ...gates
  ].join("\n");
}

export function renderProjectGenerationRiskPlanSummary(summary: ProjectGenerationRiskPlanSummary): string {
  return [
    "Project generation risk plan preview summary:",
    `- risk count: ${summary.totalRisks}`,
    `- blocked count: ${summary.blockedCount}`,
    `- human-approval-required count: ${summary.humanApprovalRequiredCount}`,
    `- severity distribution: ${renderRiskSeverityGroups(summary.severityDistribution)}`,
    `- affected plan distribution: ${renderAffectedPlanGroups(summary.affectedPlanDistribution)}`,
    `- exposure score: ${summary.exposure.score}`,
    `- exposure level: ${summary.exposure.level}`,
    `- exposure reason: ${summary.exposure.reason}`,
    `- read-only: ${String(summary.readonly)}`,
    `- preview-only: ${String(summary.previewOnly)}`,
    renderWarnings(summary.warnings),
    "Recommendations:",
    ...(summary.recommendations.length === 0 ? ["- none"] : summary.recommendations.map((recommendation) => `- ${recommendation}`))
  ].join("\n");
}

export function renderProjectGenerationRiskEntry(risk: ProjectGenerationRiskEntry): string {
  return [
    `Project generation risk entry: ${risk.riskId}`,
    `- riskType: ${risk.riskType}`,
    `- title: ${risk.title}`,
    `- description: ${risk.description}`,
    `- affectedPlan: ${risk.affectedPlan}`,
    `- severity: ${risk.severity}`,
    `- likelihood: ${risk.likelihood}`,
    `- riskStatus: ${risk.riskStatus}`,
    `- mitigationPolicy: ${risk.mitigationPolicy}`,
    `- requiresHumanApproval: ${String(risk.requiresHumanApproval)}`,
    `- blockedReason: ${risk.blockedReason ?? "none"}`,
    `- read-only: ${String(risk.readonly)}`,
    `- preview-only: ${String(risk.previewOnly)}`,
    renderWarnings(risk.warnings),
    "Recommendations:",
    ...(risk.recommendations.length === 0 ? ["- none"] : risk.recommendations.map((recommendation) => `- ${recommendation}`))
  ].join("\n");
}

export function renderProjectGenerationRiskPlanPreview(preview: ProjectGenerationRiskPlanPreview): string {
  const risks = preview.risks.length === 0
    ? ["Project generation risks:", "- none"]
    : ["Project generation risks:", ...preview.risks.map(renderProjectGenerationRiskEntry)];
  return [
    `Project generation risk plan preview: ${preview.title}`,
    `- schemaVersion: ${preview.schemaVersion}`,
    `- readonly: ${String(preview.readonly)}`,
    `- previewOnly: ${String(preview.previewOnly)}`,
    `- riskPlanPreviewOnly: ${String(preview.riskPlanPreviewOnly)}`,
    `- stdoutOnly: ${String(preview.stdoutOnly)}`,
    `- riskEnforcementAllowed: ${String(preview.riskEnforcementAllowed)}`,
    `- mitigationEnforcementEnabled: ${String(preview.mitigationEnforcementEnabled)}`,
    `- approvalExecutionAllowed: ${String(preview.approvalExecutionAllowed)}`,
    `- approvalDecisionApplied: ${String(preview.approvalDecisionApplied)}`,
    `- projectGenerationApproved: ${String(preview.projectGenerationApproved)}`,
    `- validationExecutionAllowed: ${String(preview.validationExecutionAllowed)}`,
    `- generatedProjectValidationAllowed: ${String(preview.generatedProjectValidationAllowed)}`,
    `- commandExecutionAllowed: ${String(preview.commandExecutionAllowed)}`,
    `- dependencyInstallationAllowed: ${String(preview.dependencyInstallationAllowed)}`,
    `- packageMutationAllowed: ${String(preview.packageMutationAllowed)}`,
    `- fileWriteAllowed: ${String(preview.fileWriteAllowed)}`,
    `- fileCreationAllowed: ${String(preview.fileCreationAllowed)}`,
    `- scaffoldGenerationEnabled: ${String(preview.scaffoldGenerationEnabled)}`,
    `- runtimeRoutingEnabled: ${String(preview.runtimeRoutingEnabled)}`,
    `- runtimeActivationEnabled: ${String(preview.runtimeActivationEnabled)}`,
    `- policyEnforcementEnabled: ${String(preview.policyEnforcementEnabled)}`,
    `- projectGenerationEnabled: ${String(preview.projectGenerationEnabled)}`,
    `- builderAgentRuntimeEnabled: ${String(preview.builderAgentRuntimeEnabled)}`,
    "Notice: no risk enforcement, mitigation enforcement, approval execution, approval decision application, project generation approval, validation execution, generated-project validation, command execution, dependency installation, package mutation, file creation, scaffold generation, project generation, builder-agent runtime, runtime activation, policy enforcement, runtime routing, mutation expansion, or file writing is enabled.",
    renderMetadata(preview.metadata),
    renderProjectGenerationRiskPlanSummary(preview.summary),
    ...risks
  ].join("\n");
}

export function renderProjectGenerationRollbackPlanSummary(summary: ProjectGenerationRollbackPlanSummary): string {
  return [
    "Project generation rollback plan preview summary:",
    `- rollback step count: ${summary.totalSteps}`,
    `- blocked count: ${summary.blockedCount}`,
    `- human-approval-required count: ${summary.humanApprovalRequiredCount}`,
    `- preview-only count: ${summary.previewOnlyCount}`,
    `- manual-approval-required count: ${summary.manualApprovalRequiredCount}`,
    `- not-applicable count: ${summary.notApplicableCount}`,
    `- risk distribution: ${renderRollbackRiskGroups(summary.riskDistribution)}`,
    `- applies-to distribution: ${renderRollbackAppliesToGroups(summary.appliesToDistribution)}`,
    `- readiness score: ${summary.readiness.score}`,
    `- readiness level: ${summary.readiness.level}`,
    `- readiness reason: ${summary.readiness.reason}`,
    `- read-only: ${String(summary.readonly)}`,
    `- preview-only: ${String(summary.previewOnly)}`,
    renderWarnings(summary.warnings),
    "Recommendations:",
    ...(summary.recommendations.length === 0 ? ["- none"] : summary.recommendations.map((recommendation) => `- ${recommendation}`))
  ].join("\n");
}

export function renderProjectGenerationRollbackStep(step: ProjectGenerationRollbackStep): string {
  return [
    `Project generation rollback step: ${step.stepId}`,
    `- stepType: ${step.stepType}`,
    `- title: ${step.title}`,
    `- description: ${step.description}`,
    `- appliesTo: ${step.appliesTo}`,
    `- rollbackPolicy: ${step.rollbackPolicy}`,
    `- recoveryPolicy: ${step.recoveryPolicy}`,
    `- executionStatus: ${step.executionStatus}`,
    `- riskLevel: ${step.riskLevel}`,
    `- requiresHumanApproval: ${String(step.requiresHumanApproval)}`,
    `- blockedReason: ${step.blockedReason ?? "none"}`,
    `- read-only: ${String(step.readonly)}`,
    `- preview-only: ${String(step.previewOnly)}`,
    renderWarnings(step.warnings),
    "Recommendations:",
    ...(step.recommendations.length === 0 ? ["- none"] : step.recommendations.map((recommendation) => `- ${recommendation}`))
  ].join("\n");
}

export function renderProjectGenerationRollbackPlanPreview(preview: ProjectGenerationRollbackPlanPreview): string {
  const steps = preview.steps.length === 0
    ? ["Project generation rollback steps:", "- none"]
    : ["Project generation rollback steps:", ...preview.steps.map(renderProjectGenerationRollbackStep)];
  return [
    `Project generation rollback plan preview: ${preview.title}`,
    `- schemaVersion: ${preview.schemaVersion}`,
    `- readonly: ${String(preview.readonly)}`,
    `- previewOnly: ${String(preview.previewOnly)}`,
    `- rollbackPlanPreviewOnly: ${String(preview.rollbackPlanPreviewOnly)}`,
    `- stdoutOnly: ${String(preview.stdoutOnly)}`,
    `- rollbackExecutionAllowed: ${String(preview.rollbackExecutionAllowed)}`,
    `- recoveryExecutionAllowed: ${String(preview.recoveryExecutionAllowed)}`,
    `- riskEnforcementAllowed: ${String(preview.riskEnforcementAllowed)}`,
    `- mitigationEnforcementEnabled: ${String(preview.mitigationEnforcementEnabled)}`,
    `- approvalExecutionAllowed: ${String(preview.approvalExecutionAllowed)}`,
    `- approvalDecisionApplied: ${String(preview.approvalDecisionApplied)}`,
    `- projectGenerationApproved: ${String(preview.projectGenerationApproved)}`,
    `- validationExecutionAllowed: ${String(preview.validationExecutionAllowed)}`,
    `- generatedProjectValidationAllowed: ${String(preview.generatedProjectValidationAllowed)}`,
    `- commandExecutionAllowed: ${String(preview.commandExecutionAllowed)}`,
    `- dependencyInstallationAllowed: ${String(preview.dependencyInstallationAllowed)}`,
    `- packageMutationAllowed: ${String(preview.packageMutationAllowed)}`,
    `- fileWriteAllowed: ${String(preview.fileWriteAllowed)}`,
    `- fileCreationAllowed: ${String(preview.fileCreationAllowed)}`,
    `- scaffoldGenerationEnabled: ${String(preview.scaffoldGenerationEnabled)}`,
    `- runtimeRoutingEnabled: ${String(preview.runtimeRoutingEnabled)}`,
    `- runtimeActivationEnabled: ${String(preview.runtimeActivationEnabled)}`,
    `- policyEnforcementEnabled: ${String(preview.policyEnforcementEnabled)}`,
    `- projectGenerationEnabled: ${String(preview.projectGenerationEnabled)}`,
    `- builderAgentRuntimeEnabled: ${String(preview.builderAgentRuntimeEnabled)}`,
    "Notice: no rollback execution, recovery execution, risk enforcement, mitigation enforcement, approval execution, approval decision application, project generation approval, validation execution, generated-project validation, command execution, dependency installation, package mutation, file creation, scaffold generation, project generation, builder-agent runtime, runtime activation, policy enforcement, runtime routing, mutation expansion, or file writing is enabled.",
    renderMetadata(preview.metadata),
    renderProjectGenerationRollbackPlanSummary(preview.summary),
    ...steps
  ].join("\n");
}

export function renderProjectGenerationPlanBundleSummary(summary: ProjectGenerationPlanBundleSummary): string {
  return [
    "Project generation plan bundle preview summary:",
    `- section count: ${summary.totalSections}`,
    `- total entries: ${summary.totalEntries}`,
    `- blocked count: ${summary.totalBlockedCount}`,
    `- approval-required count: ${summary.totalApprovalRequiredCount}`,
    `- readiness score: ${summary.readiness.score}`,
    `- readiness level: ${summary.readiness.level}`,
    `- readiness reason: ${summary.readiness.reason}`,
    `- read-only: ${String(summary.readonly)}`,
    `- preview-only: ${String(summary.previewOnly)}`,
    renderWarnings(summary.warnings),
    "Recommendations:",
    ...(summary.recommendations.length === 0 ? ["- none"] : summary.recommendations.map((recommendation) => `- ${recommendation}`))
  ].join("\n");
}

export function renderProjectGenerationPlanBundleSection(section: ProjectGenerationPlanBundleSection): string {
  return [
    `Project generation plan bundle section: ${section.sectionType}`,
    `- title: ${section.title}`,
    `- summary: ${section.summary}`,
    `- status: ${section.status}`,
    `- score: ${section.score}`,
    `- level: ${section.level}`,
    `- entryCount: ${section.entryCount}`,
    `- blockedCount: ${section.blockedCount}`,
    `- approvalRequiredCount: ${section.approvalRequiredCount}`,
    `- read-only: ${String(section.readonly)}`,
    `- preview-only: ${String(section.previewOnly)}`,
    renderWarnings(section.warnings),
    "Recommendations:",
    ...(section.recommendations.length === 0 ? ["- none"] : section.recommendations.map((recommendation) => `- ${recommendation}`))
  ].join("\n");
}

export function renderProjectGenerationPlanBundlePreview(preview: ProjectGenerationPlanBundlePreview): string {
  const sections = preview.sections.length === 0
    ? ["Project generation plan bundle sections:", "- none"]
    : ["Project generation plan bundle sections:", ...preview.sections.map(renderProjectGenerationPlanBundleSection)];
  return [
    `Project generation plan bundle preview: ${preview.title}`,
    `- schemaVersion: ${preview.schemaVersion}`,
    `- readonly: ${String(preview.readonly)}`,
    `- previewOnly: ${String(preview.previewOnly)}`,
    `- planBundlePreviewOnly: ${String(preview.planBundlePreviewOnly)}`,
    `- stdoutOnly: ${String(preview.stdoutOnly)}`,
    `- bundleExecutionAllowed: ${String(preview.bundleExecutionAllowed)}`,
    `- bundleWriteAllowed: ${String(preview.bundleWriteAllowed)}`,
    `- rollbackExecutionAllowed: ${String(preview.rollbackExecutionAllowed)}`,
    `- recoveryExecutionAllowed: ${String(preview.recoveryExecutionAllowed)}`,
    `- riskEnforcementAllowed: ${String(preview.riskEnforcementAllowed)}`,
    `- mitigationEnforcementEnabled: ${String(preview.mitigationEnforcementEnabled)}`,
    `- approvalExecutionAllowed: ${String(preview.approvalExecutionAllowed)}`,
    `- approvalDecisionApplied: ${String(preview.approvalDecisionApplied)}`,
    `- projectGenerationApproved: ${String(preview.projectGenerationApproved)}`,
    `- validationExecutionAllowed: ${String(preview.validationExecutionAllowed)}`,
    `- generatedProjectValidationAllowed: ${String(preview.generatedProjectValidationAllowed)}`,
    `- commandExecutionAllowed: ${String(preview.commandExecutionAllowed)}`,
    `- dependencyInstallationAllowed: ${String(preview.dependencyInstallationAllowed)}`,
    `- packageMutationAllowed: ${String(preview.packageMutationAllowed)}`,
    `- fileWriteAllowed: ${String(preview.fileWriteAllowed)}`,
    `- fileCreationAllowed: ${String(preview.fileCreationAllowed)}`,
    `- scaffoldGenerationEnabled: ${String(preview.scaffoldGenerationEnabled)}`,
    `- runtimeRoutingEnabled: ${String(preview.runtimeRoutingEnabled)}`,
    `- runtimeActivationEnabled: ${String(preview.runtimeActivationEnabled)}`,
    `- policyEnforcementEnabled: ${String(preview.policyEnforcementEnabled)}`,
    `- projectGenerationEnabled: ${String(preview.projectGenerationEnabled)}`,
    `- builderAgentRuntimeEnabled: ${String(preview.builderAgentRuntimeEnabled)}`,
    "Notice: no bundle execution, bundle writing, rollback execution, recovery execution, risk enforcement, mitigation enforcement, approval execution, approval decision application, project generation approval, validation execution, generated-project validation, command execution, dependency installation, package mutation, file creation, scaffold generation, project generation, builder-agent runtime, runtime activation, policy enforcement, runtime routing, mutation expansion, or file writing is enabled.",
    renderMetadata(preview.metadata),
    renderProjectGenerationPlanBundleSummary(preview.summary),
    ...sections
  ].join("\n");
}

export function renderProjectGenerationReadinessCompletionAuditSummary(summary: ProjectGenerationReadinessCompletionAuditSummary): string {
  return [
    "Project generation readiness completion audit summary:",
    `- section count: ${summary.totalSections}`,
    `- total entries: ${summary.totalEntries}`,
    `- complete sections: ${summary.completeSections}`,
    `- partial sections: ${summary.partialSections}`,
    `- blocked sections: ${summary.blockedSections}`,
    `- not-started sections: ${summary.notStartedSections}`,
    `- preview-only sections: ${summary.previewOnlySections}`,
    `- CLI preview path coverage: ${summary.cliPreviewPathCount}`,
    `- scenario coverage: ${summary.scenarioCoverageCount}`,
    `- completion score: ${summary.completion.score}`,
    `- completion level: ${summary.completion.level}`,
    `- completion reason: ${summary.completion.reason}`,
    `- read-only: ${String(summary.readonly)}`,
    `- preview-only: ${String(summary.previewOnly)}`,
    `- no-execution: ${String(summary.noExecution)}`,
    renderWarnings(summary.warnings),
    "Recommendations:",
    ...(summary.recommendations.length === 0 ? ["- none"] : summary.recommendations.map((recommendation) => `- ${recommendation}`))
  ].join("\n");
}

export function renderProjectGenerationReadinessCompletionAuditSection(section: ProjectGenerationReadinessCompletionAuditSection): string {
  return [
    `Project generation readiness completion audit section: ${section.sectionType}`,
    `- title: ${section.title}`,
    `- summary: ${section.summary}`,
    `- status: ${section.status}`,
    `- score: ${section.score}`,
    `- level: ${section.level}`,
    `- entryCount: ${section.entryCount}`,
    `- read-only: ${String(section.readonly)}`,
    `- preview-only: ${String(section.previewOnly)}`,
    `- no-execution: ${String(section.noExecution)}`,
    renderWarnings(section.warnings),
    "Recommendations:",
    ...(section.recommendations.length === 0 ? ["- none"] : section.recommendations.map((recommendation) => `- ${recommendation}`))
  ].join("\n");
}

export function renderProjectGenerationReadinessCompletionAudit(audit: ProjectGenerationReadinessCompletionAudit): string {
  const sections = audit.sections.length === 0
    ? ["Project generation readiness completion audit sections:", "- none"]
    : ["Project generation readiness completion audit sections:", ...audit.sections.map(renderProjectGenerationReadinessCompletionAuditSection)];
  return [
    `Project generation readiness completion audit: ${audit.title}`,
    `- schemaVersion: ${audit.schemaVersion}`,
    `- readonly: ${String(audit.readonly)}`,
    `- previewOnly: ${String(audit.previewOnly)}`,
    `- completionAuditOnly: ${String(audit.completionAuditOnly)}`,
    `- stdoutOnly: ${String(audit.stdoutOnly)}`,
    `- bundleExecutionAllowed: ${String(audit.bundleExecutionAllowed)}`,
    `- rollbackExecutionAllowed: ${String(audit.rollbackExecutionAllowed)}`,
    `- recoveryExecutionAllowed: ${String(audit.recoveryExecutionAllowed)}`,
    `- riskEnforcementAllowed: ${String(audit.riskEnforcementAllowed)}`,
    `- mitigationEnforcementEnabled: ${String(audit.mitigationEnforcementEnabled)}`,
    `- approvalExecutionAllowed: ${String(audit.approvalExecutionAllowed)}`,
    `- approvalDecisionApplied: ${String(audit.approvalDecisionApplied)}`,
    `- projectGenerationApproved: ${String(audit.projectGenerationApproved)}`,
    `- validationExecutionAllowed: ${String(audit.validationExecutionAllowed)}`,
    `- generatedProjectValidationAllowed: ${String(audit.generatedProjectValidationAllowed)}`,
    `- commandExecutionAllowed: ${String(audit.commandExecutionAllowed)}`,
    `- dependencyInstallationAllowed: ${String(audit.dependencyInstallationAllowed)}`,
    `- packageMutationAllowed: ${String(audit.packageMutationAllowed)}`,
    `- fileWriteAllowed: ${String(audit.fileWriteAllowed)}`,
    `- fileCreationAllowed: ${String(audit.fileCreationAllowed)}`,
    `- scaffoldGenerationEnabled: ${String(audit.scaffoldGenerationEnabled)}`,
    `- runtimeRoutingEnabled: ${String(audit.runtimeRoutingEnabled)}`,
    `- runtimeActivationEnabled: ${String(audit.runtimeActivationEnabled)}`,
    `- policyEnforcementEnabled: ${String(audit.policyEnforcementEnabled)}`,
    `- projectGenerationEnabled: ${String(audit.projectGenerationEnabled)}`,
    `- builderAgentRuntimeEnabled: ${String(audit.builderAgentRuntimeEnabled)}`,
    "Notice: no project generation, no execution, no bundle execution, rollback execution, recovery execution, risk enforcement, mitigation enforcement, approval execution, approval decision application, project generation approval, validation execution, generated-project validation, command execution, dependency installation, package mutation, file creation, scaffold generation, builder-agent runtime, runtime activation, policy enforcement, runtime routing, mutation expansion, or file writing is enabled.",
    renderMetadata(audit.metadata),
    renderProjectGenerationReadinessCompletionAuditSummary(audit.summary),
    ...sections
  ].join("\n");
}

export function renderControlledProjectGenerationDesignContractSummary(summary: ControlledProjectGenerationContractSummary): string {
  return [
    "Controlled project generation design contract summary:",
    `- section count: ${summary.totalSections}`,
    `- total requirements: ${summary.totalRequirements}`,
    `- total allowed outputs: ${summary.totalAllowed}`,
    `- total forbidden actions: ${summary.totalForbidden}`,
    `- total risks: ${summary.totalRisks}`,
    `- defined sections: ${summary.definedSections}`,
    `- partial sections: ${summary.partialSections}`,
    `- blocked sections: ${summary.blockedSections}`,
    `- not-started sections: ${summary.notStartedSections}`,
    `- preview-only sections: ${summary.previewOnlySections}`,
    `- completeness score: ${summary.completeness.score}`,
    `- completeness level: ${summary.completeness.level}`,
    `- completeness reason: ${summary.completeness.reason}`,
    `- read-only: ${String(summary.readonly)}`,
    `- preview-only: ${String(summary.previewOnly)}`,
    `- no-execution: ${String(summary.noExecution)}`,
    renderWarnings(summary.warnings),
    "Recommendations:",
    ...(summary.recommendations.length === 0 ? ["- none"] : summary.recommendations.map((recommendation) => `- ${recommendation}`))
  ].join("\n");
}

export function renderControlledProjectGenerationDesignContractSection(section: ControlledProjectGenerationContractSection): string {
  return [
    `Controlled project generation design contract section: ${section.sectionType}`,
    `- title: ${section.title}`,
    `- summary: ${section.summary}`,
    `- status: ${section.status}`,
    `- score: ${section.score}`,
    `- requirements: ${section.requirements.length === 0 ? "none" : section.requirements.join(", ")}`,
    `- allowed: ${section.allowed.length === 0 ? "none" : section.allowed.join(", ")}`,
    `- forbidden: ${section.forbidden.length === 0 ? "none" : section.forbidden.join(", ")}`,
    `- risks: ${section.risks.length === 0 ? "none" : section.risks.join(", ")}`,
    `- read-only: ${String(section.readonly)}`,
    `- preview-only: ${String(section.previewOnly)}`,
    `- no-execution: ${String(section.noExecution)}`,
    renderWarnings(section.warnings),
    "Recommendations:",
    ...(section.recommendations.length === 0 ? ["- none"] : section.recommendations.map((recommendation) => `- ${recommendation}`))
  ].join("\n");
}

export function renderControlledProjectGenerationDesignContract(contract: ControlledProjectGenerationDesignContract): string {
  const sections = contract.sections.length === 0
    ? ["Controlled project generation design contract sections:", "- none"]
    : ["Controlled project generation design contract sections:", ...contract.sections.map(renderControlledProjectGenerationDesignContractSection)];
  return [
    `Controlled project generation design contract: ${contract.title}`,
    `- schemaVersion: ${contract.schemaVersion}`,
    `- readonly: ${String(contract.readonly)}`,
    `- previewOnly: ${String(contract.previewOnly)}`,
    `- designContractOnly: ${String(contract.designContractOnly)}`,
    `- stdoutOnly: ${String(contract.stdoutOnly)}`,
    `- generationRuntimeImplemented: ${String(contract.generationRuntimeImplemented)}`,
    `- generationExecutionAllowed: ${String(contract.generationExecutionAllowed)}`,
    `- bundleExecutionAllowed: ${String(contract.bundleExecutionAllowed)}`,
    `- rollbackExecutionAllowed: ${String(contract.rollbackExecutionAllowed)}`,
    `- recoveryExecutionAllowed: ${String(contract.recoveryExecutionAllowed)}`,
    `- riskEnforcementAllowed: ${String(contract.riskEnforcementAllowed)}`,
    `- mitigationEnforcementEnabled: ${String(contract.mitigationEnforcementEnabled)}`,
    `- approvalExecutionAllowed: ${String(contract.approvalExecutionAllowed)}`,
    `- approvalDecisionApplied: ${String(contract.approvalDecisionApplied)}`,
    `- projectGenerationApproved: ${String(contract.projectGenerationApproved)}`,
    `- validationExecutionAllowed: ${String(contract.validationExecutionAllowed)}`,
    `- generatedProjectValidationAllowed: ${String(contract.generatedProjectValidationAllowed)}`,
    `- commandExecutionAllowed: ${String(contract.commandExecutionAllowed)}`,
    `- dependencyInstallationAllowed: ${String(contract.dependencyInstallationAllowed)}`,
    `- packageMutationAllowed: ${String(contract.packageMutationAllowed)}`,
    `- fileWriteAllowed: ${String(contract.fileWriteAllowed)}`,
    `- fileCreationAllowed: ${String(contract.fileCreationAllowed)}`,
    `- scaffoldGenerationEnabled: ${String(contract.scaffoldGenerationEnabled)}`,
    `- runtimeRoutingEnabled: ${String(contract.runtimeRoutingEnabled)}`,
    `- runtimeActivationEnabled: ${String(contract.runtimeActivationEnabled)}`,
    `- policyEnforcementEnabled: ${String(contract.policyEnforcementEnabled)}`,
    `- projectGenerationEnabled: ${String(contract.projectGenerationEnabled)}`,
    `- builderAgentRuntimeEnabled: ${String(contract.builderAgentRuntimeEnabled)}`,
    "Notice: no runtime, no project generation, no generation execution, no bundle execution, rollback execution, recovery execution, risk enforcement, mitigation enforcement, approval execution, approval decision application, validation execution, generated-project validation, command execution, dependency installation, package mutation, file creation, scaffold generation, builder-agent runtime, runtime activation, policy enforcement, runtime routing, mutation expansion, or file writing is enabled.",
    renderMetadata(contract.metadata),
    renderControlledProjectGenerationDesignContractSummary(contract.summary),
    ...sections
  ].join("\n");
}

export function renderControlledProjectGenerationInputContractSummary(summary: ControlledProjectGenerationInputContractSummary): string {
  return [
    "Controlled project generation input contract summary:",
    `- field count: ${summary.totalFields}`,
    `- required field count: ${summary.requiredFieldCount}`,
    `- optional field count: ${summary.optionalFieldCount}`,
    `- blocked field count: ${summary.blockedFieldCount}`,
    `- group distribution: ${renderInputFieldGroups(summary.groupDistribution)}`,
    `- risk distribution: ${renderInputFieldGroups(summary.riskDistribution)}`,
    `- validation policy distribution: ${renderInputFieldGroups(summary.validationPolicyDistribution)}`,
    `- completeness score: ${summary.completeness.score}`,
    `- completeness level: ${summary.completeness.level}`,
    `- completeness reason: ${summary.completeness.reason}`,
    `- read-only: ${String(summary.readonly)}`,
    `- preview-only: ${String(summary.previewOnly)}`,
    renderWarnings(summary.warnings),
    "Recommendations:",
    ...(summary.recommendations.length === 0 ? ["- none"] : summary.recommendations.map((recommendation) => `- ${recommendation}`))
  ].join("\n");
}

export function renderControlledProjectGenerationInputField(field: ControlledProjectGenerationInputField): string {
  return [
    `Controlled project generation input field: ${field.fieldId}`,
    `- group: ${field.group}`,
    `- label: ${field.label}`,
    `- description: ${field.description}`,
    `- required: ${String(field.required)}`,
    `- status: ${field.status}`,
    `- riskLevel: ${field.riskLevel}`,
    `- allowedValues: ${field.allowedValues.length === 0 ? "none" : field.allowedValues.join(", ")}`,
    `- defaultValue: ${field.defaultValue ?? "none"}`,
    `- validationPolicy: ${field.validationPolicy}`,
    `- blockedReason: ${field.blockedReason ?? "none"}`,
    `- read-only: ${String(field.readonly)}`,
    `- preview-only: ${String(field.previewOnly)}`,
    renderWarnings(field.warnings),
    "Recommendations:",
    ...(field.recommendations.length === 0 ? ["- none"] : field.recommendations.map((recommendation) => `- ${recommendation}`))
  ].join("\n");
}

export function renderControlledProjectGenerationInputContract(contract: ControlledProjectGenerationInputContract): string {
  const fields = contract.fields.length === 0
    ? ["Controlled project generation input fields:", "- none"]
    : ["Controlled project generation input fields:", ...contract.fields.map(renderControlledProjectGenerationInputField)];
  return [
    `Controlled project generation input contract: ${contract.title}`,
    `- schemaVersion: ${contract.schemaVersion}`,
    `- readonly: ${String(contract.readonly)}`,
    `- previewOnly: ${String(contract.previewOnly)}`,
    `- inputContractOnly: ${String(contract.inputContractOnly)}`,
    `- stdoutOnly: ${String(contract.stdoutOnly)}`,
    `- liveInputValidationAllowed: ${String(contract.liveInputValidationAllowed)}`,
    `- inputExecutionAllowed: ${String(contract.inputExecutionAllowed)}`,
    `- generationRuntimeImplemented: ${String(contract.generationRuntimeImplemented)}`,
    `- generationExecutionAllowed: ${String(contract.generationExecutionAllowed)}`,
    `- bundleExecutionAllowed: ${String(contract.bundleExecutionAllowed)}`,
    `- rollbackExecutionAllowed: ${String(contract.rollbackExecutionAllowed)}`,
    `- recoveryExecutionAllowed: ${String(contract.recoveryExecutionAllowed)}`,
    `- riskEnforcementAllowed: ${String(contract.riskEnforcementAllowed)}`,
    `- approvalExecutionAllowed: ${String(contract.approvalExecutionAllowed)}`,
    `- validationExecutionAllowed: ${String(contract.validationExecutionAllowed)}`,
    `- dependencyInstallationAllowed: ${String(contract.dependencyInstallationAllowed)}`,
    `- packageMutationAllowed: ${String(contract.packageMutationAllowed)}`,
    `- fileWriteAllowed: ${String(contract.fileWriteAllowed)}`,
    `- fileCreationAllowed: ${String(contract.fileCreationAllowed)}`,
    `- scaffoldGenerationEnabled: ${String(contract.scaffoldGenerationEnabled)}`,
    `- runtimeRoutingEnabled: ${String(contract.runtimeRoutingEnabled)}`,
    `- runtimeActivationEnabled: ${String(contract.runtimeActivationEnabled)}`,
    `- policyEnforcementEnabled: ${String(contract.policyEnforcementEnabled)}`,
    `- projectGenerationEnabled: ${String(contract.projectGenerationEnabled)}`,
    `- builderAgentRuntimeEnabled: ${String(contract.builderAgentRuntimeEnabled)}`,
    "Notice: no input execution, no live input validation, no runtime, no project generation, no generation execution, no bundle execution, rollback execution, recovery execution, risk enforcement, approval execution, validation execution, dependency installation, package mutation, file creation, scaffold generation, builder-agent runtime, runtime activation, policy enforcement, runtime routing, mutation expansion, or file writing is enabled.",
    renderMetadata(contract.metadata),
    renderControlledProjectGenerationInputContractSummary(contract.summary),
    ...fields
  ].join("\n");
}

export function renderControlledProjectGenerationOutputContractSummary(summary: ControlledProjectGenerationOutputContractSummary): string {
  return [
    "Controlled project generation output contract summary:",
    `- field count: ${summary.totalFields}`,
    `- allowed output count: ${summary.allowedOutputCount}`,
    `- forbidden output count: ${summary.forbiddenOutputCount}`,
    `- blocked output count: ${summary.blockedOutputCount}`,
    `- group distribution: ${renderOutputFieldGroups(summary.groupDistribution)}`,
    `- format distribution: ${renderOutputFieldGroups(summary.formatDistribution)}`,
    `- risk distribution: ${renderOutputFieldGroups(summary.riskDistribution)}`,
    `- output policy distribution: ${renderOutputFieldGroups(summary.outputPolicyDistribution)}`,
    `- completeness score: ${summary.completeness.score}`,
    `- completeness level: ${summary.completeness.level}`,
    `- completeness reason: ${summary.completeness.reason}`,
    `- read-only: ${String(summary.readonly)}`,
    `- preview-only: ${String(summary.previewOnly)}`,
    `- stdout-only: ${String(summary.stdoutOnly)}`,
    `- no-file-write: ${String(summary.noFileWrite)}`,
    renderWarnings(summary.warnings),
    "Recommendations:",
    ...(summary.recommendations.length === 0 ? ["- none"] : summary.recommendations.map((recommendation) => `- ${recommendation}`))
  ].join("\n");
}

export function renderControlledProjectGenerationOutputField(field: ControlledProjectGenerationOutputField): string {
  return [
    `Controlled project generation output field: ${field.fieldId}`,
    `- group: ${field.group}`,
    `- label: ${field.label}`,
    `- description: ${field.description}`,
    `- format: ${field.format}`,
    `- status: ${field.status}`,
    `- riskLevel: ${field.riskLevel}`,
    `- allowed: ${field.allowed.length === 0 ? "none" : field.allowed.join(", ")}`,
    `- forbidden: ${field.forbidden.length === 0 ? "none" : field.forbidden.join(", ")}`,
    `- outputPolicy: ${field.outputPolicy}`,
    `- blockedReason: ${field.blockedReason ?? "none"}`,
    `- read-only: ${String(field.readonly)}`,
    `- preview-only: ${String(field.previewOnly)}`,
    `- stdout-only: ${String(field.stdoutOnly)}`,
    `- no-file-write: ${String(field.noFileWrite)}`,
    renderWarnings(field.warnings),
    "Recommendations:",
    ...(field.recommendations.length === 0 ? ["- none"] : field.recommendations.map((recommendation) => `- ${recommendation}`))
  ].join("\n");
}

export function renderControlledProjectGenerationOutputContract(contract: ControlledProjectGenerationOutputContract): string {
  const fields = contract.fields.length === 0
    ? ["Controlled project generation output fields:", "- none"]
    : ["Controlled project generation output fields:", ...contract.fields.map(renderControlledProjectGenerationOutputField)];
  return [
    `Controlled project generation output contract: ${contract.title}`,
    `- schemaVersion: ${contract.schemaVersion}`,
    `- readonly: ${String(contract.readonly)}`,
    `- previewOnly: ${String(contract.previewOnly)}`,
    `- outputContractOnly: ${String(contract.outputContractOnly)}`,
    `- stdoutOnly: ${String(contract.stdoutOnly)}`,
    `- noFileWrite: ${String(contract.noFileWrite)}`,
    `- outputExecutionAllowed: ${String(contract.outputExecutionAllowed)}`,
    `- generationRuntimeImplemented: ${String(contract.generationRuntimeImplemented)}`,
    `- generationExecutionAllowed: ${String(contract.generationExecutionAllowed)}`,
    `- bundleExecutionAllowed: ${String(contract.bundleExecutionAllowed)}`,
    `- rollbackExecutionAllowed: ${String(contract.rollbackExecutionAllowed)}`,
    `- recoveryExecutionAllowed: ${String(contract.recoveryExecutionAllowed)}`,
    `- riskEnforcementAllowed: ${String(contract.riskEnforcementAllowed)}`,
    `- approvalExecutionAllowed: ${String(contract.approvalExecutionAllowed)}`,
    `- validationExecutionAllowed: ${String(contract.validationExecutionAllowed)}`,
    `- dependencyInstallationAllowed: ${String(contract.dependencyInstallationAllowed)}`,
    `- packageMutationAllowed: ${String(contract.packageMutationAllowed)}`,
    `- fileWriteAllowed: ${String(contract.fileWriteAllowed)}`,
    `- fileCreationAllowed: ${String(contract.fileCreationAllowed)}`,
    `- scaffoldGenerationEnabled: ${String(contract.scaffoldGenerationEnabled)}`,
    `- runtimeRoutingEnabled: ${String(contract.runtimeRoutingEnabled)}`,
    `- runtimeActivationEnabled: ${String(contract.runtimeActivationEnabled)}`,
    `- policyEnforcementEnabled: ${String(contract.policyEnforcementEnabled)}`,
    `- projectGenerationEnabled: ${String(contract.projectGenerationEnabled)}`,
    `- builderAgentRuntimeEnabled: ${String(contract.builderAgentRuntimeEnabled)}`,
    "Notice: no output execution, no file write, no runtime, no project generation, no generation execution, no bundle execution, rollback execution, recovery execution, risk enforcement, approval execution, validation execution, dependency installation, package mutation, file creation, scaffold generation, builder-agent runtime, runtime activation, policy enforcement, runtime routing, mutation expansion, or file writing is enabled.",
    renderMetadata(contract.metadata),
    renderControlledProjectGenerationOutputContractSummary(contract.summary),
    ...fields
  ].join("\n");
}

export function renderControlledProjectGenerationMutationBoundarySummary(summary: ControlledProjectGenerationMutationBoundarySummary): string {
  return [
    "Controlled project generation mutation boundary summary:",
    `- boundary count: ${summary.totalBoundaries}`,
    `- forbidden count: ${summary.forbiddenCount}`,
    `- blocked count: ${summary.blockedCount}`,
    `- safe-patch-only count: ${summary.safePatchOnlyCount}`,
    `- approval-required count: ${summary.approvalRequiredCount}`,
    `- group distribution: ${renderMutationBoundaryGroups(summary.groupDistribution)}`,
    `- policy distribution: ${renderMutationBoundaryGroups(summary.policyDistribution)}`,
    `- risk distribution: ${renderMutationBoundaryGroups(summary.riskDistribution)}`,
    `- completeness score: ${summary.completeness.score}`,
    `- completeness level: ${summary.completeness.level}`,
    `- completeness reason: ${summary.completeness.reason}`,
    `- read-only: ${String(summary.readonly)}`,
    `- preview-only: ${String(summary.previewOnly)}`,
    `- no-execution: ${String(summary.noExecution)}`,
    renderWarnings(summary.warnings),
    "Recommendations:",
    ...(summary.recommendations.length === 0 ? ["- none"] : summary.recommendations.map((recommendation) => `- ${recommendation}`))
  ].join("\n");
}

export function renderControlledProjectGenerationMutationBoundary(boundary: ControlledProjectGenerationMutationBoundary): string {
  return [
    `Controlled project generation mutation boundary: ${boundary.boundaryId}`,
    `- group: ${boundary.group}`,
    `- title: ${boundary.title}`,
    `- description: ${boundary.description}`,
    `- mutationPolicy: ${boundary.mutationPolicy}`,
    `- riskLevel: ${boundary.riskLevel}`,
    `- allowed: ${boundary.allowed.length === 0 ? "none" : boundary.allowed.join(", ")}`,
    `- forbidden: ${boundary.forbidden.length === 0 ? "none" : boundary.forbidden.join(", ")}`,
    `- safePatchRequired: ${String(boundary.safePatchRequired)}`,
    `- approvalRequired: ${String(boundary.approvalRequired)}`,
    `- blockedReason: ${boundary.blockedReason ?? "none"}`,
    `- read-only: ${String(boundary.readonly)}`,
    `- preview-only: ${String(boundary.previewOnly)}`,
    `- no-execution: ${String(boundary.noExecution)}`,
    renderWarnings(boundary.warnings),
    "Recommendations:",
    ...(boundary.recommendations.length === 0 ? ["- none"] : boundary.recommendations.map((recommendation) => `- ${recommendation}`))
  ].join("\n");
}

export function renderControlledProjectGenerationMutationBoundaryContract(contract: ControlledProjectGenerationMutationBoundaryContract): string {
  const boundaries = contract.boundaries.length === 0
    ? ["Controlled project generation mutation boundaries:", "- none"]
    : ["Controlled project generation mutation boundaries:", ...contract.boundaries.map(renderControlledProjectGenerationMutationBoundary)];
  return [
    `Controlled project generation mutation boundary contract: ${contract.title}`,
    `- schemaVersion: ${contract.schemaVersion}`,
    `- readonly: ${String(contract.readonly)}`,
    `- previewOnly: ${String(contract.previewOnly)}`,
    `- mutationBoundaryContractOnly: ${String(contract.mutationBoundaryContractOnly)}`,
    `- stdoutOnly: ${String(contract.stdoutOnly)}`,
    `- mutationExecutionAllowed: ${String(contract.mutationExecutionAllowed)}`,
    `- mutationExpansionAllowed: ${String(contract.mutationExpansionAllowed)}`,
    `- generationRuntimeImplemented: ${String(contract.generationRuntimeImplemented)}`,
    `- generationExecutionAllowed: ${String(contract.generationExecutionAllowed)}`,
    `- outputExecutionAllowed: ${String(contract.outputExecutionAllowed)}`,
    `- inputExecutionAllowed: ${String(contract.inputExecutionAllowed)}`,
    `- bundleExecutionAllowed: ${String(contract.bundleExecutionAllowed)}`,
    `- rollbackExecutionAllowed: ${String(contract.rollbackExecutionAllowed)}`,
    `- recoveryExecutionAllowed: ${String(contract.recoveryExecutionAllowed)}`,
    `- riskEnforcementAllowed: ${String(contract.riskEnforcementAllowed)}`,
    `- approvalExecutionAllowed: ${String(contract.approvalExecutionAllowed)}`,
    `- validationExecutionAllowed: ${String(contract.validationExecutionAllowed)}`,
    `- dependencyInstallationAllowed: ${String(contract.dependencyInstallationAllowed)}`,
    `- packageMutationAllowed: ${String(contract.packageMutationAllowed)}`,
    `- fileWriteAllowed: ${String(contract.fileWriteAllowed)}`,
    `- fileCreationAllowed: ${String(contract.fileCreationAllowed)}`,
    `- scaffoldGenerationEnabled: ${String(contract.scaffoldGenerationEnabled)}`,
    `- runtimeRoutingEnabled: ${String(contract.runtimeRoutingEnabled)}`,
    `- runtimeActivationEnabled: ${String(contract.runtimeActivationEnabled)}`,
    `- policyEnforcementEnabled: ${String(contract.policyEnforcementEnabled)}`,
    `- projectGenerationEnabled: ${String(contract.projectGenerationEnabled)}`,
    `- builderAgentRuntimeEnabled: ${String(contract.builderAgentRuntimeEnabled)}`,
    "Notice: no mutation execution, no mutation expansion, no project generation, no input execution, no output execution, no bundle execution, rollback execution, recovery execution, risk enforcement, approval execution, validation execution, dependency installation, package mutation, file creation, scaffold generation, builder-agent runtime, runtime activation, policy enforcement, runtime routing, or file writing is enabled. Safe Patch Engine remains sole mutation layer.",
    renderMetadata(contract.metadata),
    renderControlledProjectGenerationMutationBoundarySummary(contract.summary),
    ...boundaries
  ].join("\n");
}

export function renderControlledProjectGenerationApprovalBoundarySummary(summary: ControlledProjectGenerationApprovalBoundarySummary): string {
  return [
    "Controlled project generation approval boundary summary:",
    `- boundary count: ${summary.totalBoundaries}`,
    `- manual-approval-required count: ${summary.manualApprovalRequiredCount}`,
    `- forbidden-auto-approval count: ${summary.forbiddenAutoApprovalCount}`,
    `- blocked count: ${summary.blockedCount}`,
    `- approval-persistence-allowed count: ${summary.approvalPersistenceAllowedCount}`,
    `- group distribution: ${renderApprovalBoundaryGroups(summary.groupDistribution)}`,
    `- policy distribution: ${renderApprovalBoundaryGroups(summary.policyDistribution)}`,
    `- risk distribution: ${renderApprovalBoundaryGroups(summary.riskDistribution)}`,
    `- completeness score: ${summary.completeness.score}`,
    `- completeness level: ${summary.completeness.level}`,
    `- completeness reason: ${summary.completeness.reason}`,
    `- read-only: ${String(summary.readonly)}`,
    `- preview-only: ${String(summary.previewOnly)}`,
    `- no-execution: ${String(summary.noExecution)}`,
    renderWarnings(summary.warnings),
    "Recommendations:",
    ...(summary.recommendations.length === 0 ? ["- none"] : summary.recommendations.map((recommendation) => `- ${recommendation}`))
  ].join("\n");
}

export function renderControlledProjectGenerationApprovalBoundary(boundary: ControlledProjectGenerationApprovalBoundary): string {
  return [
    `Controlled project generation approval boundary: ${boundary.boundaryId}`,
    `- group: ${boundary.group}`,
    `- title: ${boundary.title}`,
    `- description: ${boundary.description}`,
    `- approvalPolicy: ${boundary.approvalPolicy}`,
    `- riskLevel: ${boundary.riskLevel}`,
    `- autoApprovalAllowed: ${String(boundary.autoApprovalAllowed)}`,
    `- manualApprovalRequired: ${String(boundary.manualApprovalRequired)}`,
    `- forbiddenAutoApproval: ${String(boundary.forbiddenAutoApproval)}`,
    `- approvalPersistenceAllowed: ${String(boundary.approvalPersistenceAllowed)}`,
    `- blockedReason: ${boundary.blockedReason ?? "none"}`,
    `- read-only: ${String(boundary.readonly)}`,
    `- preview-only: ${String(boundary.previewOnly)}`,
    `- no-execution: ${String(boundary.noExecution)}`,
    renderWarnings(boundary.warnings),
    "Recommendations:",
    ...(boundary.recommendations.length === 0 ? ["- none"] : boundary.recommendations.map((recommendation) => `- ${recommendation}`))
  ].join("\n");
}

export function renderControlledProjectGenerationApprovalBoundaryContract(contract: ControlledProjectGenerationApprovalBoundaryContract): string {
  const boundaries = contract.boundaries.length === 0
    ? ["Controlled project generation approval boundaries:", "- none"]
    : ["Controlled project generation approval boundaries:", ...contract.boundaries.map(renderControlledProjectGenerationApprovalBoundary)];
  return [
    `Controlled project generation approval boundary contract: ${contract.title}`,
    `- schemaVersion: ${contract.schemaVersion}`,
    `- readonly: ${String(contract.readonly)}`,
    `- previewOnly: ${String(contract.previewOnly)}`,
    `- approvalBoundaryContractOnly: ${String(contract.approvalBoundaryContractOnly)}`,
    `- stdoutOnly: ${String(contract.stdoutOnly)}`,
    `- approvalExecutionAllowed: ${String(contract.approvalExecutionAllowed)}`,
    `- approvalPersistenceAllowed: ${String(contract.approvalPersistenceAllowed)}`,
    `- approvalDecisionApplied: ${String(contract.approvalDecisionApplied)}`,
    `- projectGenerationApproved: ${String(contract.projectGenerationApproved)}`,
    `- mutationExecutionAllowed: ${String(contract.mutationExecutionAllowed)}`,
    `- mutationExpansionAllowed: ${String(contract.mutationExpansionAllowed)}`,
    `- generationRuntimeImplemented: ${String(contract.generationRuntimeImplemented)}`,
    `- generationExecutionAllowed: ${String(contract.generationExecutionAllowed)}`,
    `- outputExecutionAllowed: ${String(contract.outputExecutionAllowed)}`,
    `- inputExecutionAllowed: ${String(contract.inputExecutionAllowed)}`,
    `- bundleExecutionAllowed: ${String(contract.bundleExecutionAllowed)}`,
    `- rollbackExecutionAllowed: ${String(contract.rollbackExecutionAllowed)}`,
    `- recoveryExecutionAllowed: ${String(contract.recoveryExecutionAllowed)}`,
    `- riskEnforcementAllowed: ${String(contract.riskEnforcementAllowed)}`,
    `- validationExecutionAllowed: ${String(contract.validationExecutionAllowed)}`,
    `- dependencyInstallationAllowed: ${String(contract.dependencyInstallationAllowed)}`,
    `- packageMutationAllowed: ${String(contract.packageMutationAllowed)}`,
    `- fileWriteAllowed: ${String(contract.fileWriteAllowed)}`,
    `- fileCreationAllowed: ${String(contract.fileCreationAllowed)}`,
    `- scaffoldGenerationEnabled: ${String(contract.scaffoldGenerationEnabled)}`,
    `- runtimeRoutingEnabled: ${String(contract.runtimeRoutingEnabled)}`,
    `- runtimeActivationEnabled: ${String(contract.runtimeActivationEnabled)}`,
    `- policyEnforcementEnabled: ${String(contract.policyEnforcementEnabled)}`,
    `- projectGenerationEnabled: ${String(contract.projectGenerationEnabled)}`,
    `- builderAgentRuntimeEnabled: ${String(contract.builderAgentRuntimeEnabled)}`,
    "Notice: no approval execution, no approval persistence, no project generation, no mutation execution, no mutation expansion, no input execution, no output execution, no bundle execution, rollback execution, recovery execution, risk enforcement, validation execution, dependency installation, package mutation, file creation, scaffold generation, builder-agent runtime, runtime activation, policy enforcement, runtime routing, or file writing is enabled.",
    renderMetadata(contract.metadata),
    renderControlledProjectGenerationApprovalBoundarySummary(contract.summary),
    ...boundaries
  ].join("\n");
}

export function renderControlledProjectGenerationRuntimeBoundarySummary(summary: ControlledProjectGenerationRuntimeBoundarySummary): string {
  return [
    "Controlled project generation runtime boundary summary:",
    `- boundary count: ${summary.totalBoundaries}`,
    `- forbidden count: ${summary.forbiddenCount}`,
    `- blocked count: ${summary.blockedCount}`,
    `- preview-only count: ${summary.previewOnlyCount}`,
    `- activation-allowed count: ${summary.activationAllowedCount}`,
    `- execution-allowed count: ${summary.executionAllowedCount}`,
    `- routing-allowed count: ${summary.routingAllowedCount}`,
    `- persistence-allowed count: ${summary.persistenceAllowedCount}`,
    `- group distribution: ${renderRuntimeBoundaryGroups(summary.groupDistribution)}`,
    `- policy distribution: ${renderRuntimeBoundaryGroups(summary.policyDistribution)}`,
    `- risk distribution: ${renderRuntimeBoundaryGroups(summary.riskDistribution)}`,
    `- completeness score: ${summary.completeness.score}`,
    `- completeness level: ${summary.completeness.level}`,
    `- completeness reason: ${summary.completeness.reason}`,
    `- read-only: ${String(summary.readonly)}`,
    `- preview-only: ${String(summary.previewOnly)}`,
    `- no-execution: ${String(summary.noExecution)}`,
    renderWarnings(summary.warnings),
    "Recommendations:",
    ...(summary.recommendations.length === 0 ? ["- none"] : summary.recommendations.map((recommendation) => `- ${recommendation}`))
  ].join("\n");
}

export function renderControlledProjectGenerationRuntimeBoundary(boundary: ControlledProjectGenerationRuntimeBoundary): string {
  return [
    `Controlled project generation runtime boundary: ${boundary.boundaryId}`,
    `- group: ${boundary.group}`,
    `- title: ${boundary.title}`,
    `- description: ${boundary.description}`,
    `- runtimePolicy: ${boundary.runtimePolicy}`,
    `- riskLevel: ${boundary.riskLevel}`,
    `- activationAllowed: ${String(boundary.activationAllowed)}`,
    `- executionAllowed: ${String(boundary.executionAllowed)}`,
    `- routingAllowed: ${String(boundary.routingAllowed)}`,
    `- persistenceAllowed: ${String(boundary.persistenceAllowed)}`,
    `- blockedReason: ${boundary.blockedReason ?? "none"}`,
    `- read-only: ${String(boundary.readonly)}`,
    `- preview-only: ${String(boundary.previewOnly)}`,
    `- no-execution: ${String(boundary.noExecution)}`,
    renderWarnings(boundary.warnings),
    "Recommendations:",
    ...(boundary.recommendations.length === 0 ? ["- none"] : boundary.recommendations.map((recommendation) => `- ${recommendation}`))
  ].join("\n");
}

export function renderControlledProjectGenerationRuntimeBoundaryContract(contract: ControlledProjectGenerationRuntimeBoundaryContract): string {
  const boundaries = contract.boundaries.length === 0
    ? ["Controlled project generation runtime boundaries:", "- none"]
    : ["Controlled project generation runtime boundaries:", ...contract.boundaries.map(renderControlledProjectGenerationRuntimeBoundary)];
  return [
    `Controlled project generation runtime boundary contract: ${contract.title}`,
    `- schemaVersion: ${contract.schemaVersion}`,
    `- readonly: ${String(contract.readonly)}`,
    `- previewOnly: ${String(contract.previewOnly)}`,
    `- runtimeBoundaryContractOnly: ${String(contract.runtimeBoundaryContractOnly)}`,
    `- stdoutOnly: ${String(contract.stdoutOnly)}`,
    `- runtimeExecutionAllowed: ${String(contract.runtimeExecutionAllowed)}`,
    `- runtimeActivationAllowed: ${String(contract.runtimeActivationAllowed)}`,
    `- runtimeRoutingAllowed: ${String(contract.runtimeRoutingAllowed)}`,
    `- runtimeOrchestrationAllowed: ${String(contract.runtimeOrchestrationAllowed)}`,
    `- runtimePersistenceAllowed: ${String(contract.runtimePersistenceAllowed)}`,
    `- runtimeStatePersistenceAllowed: ${String(contract.runtimeStatePersistenceAllowed)}`,
    `- plannerLoopAllowed: ${String(contract.plannerLoopAllowed)}`,
    `- builderAgentLoopAllowed: ${String(contract.builderAgentLoopAllowed)}`,
    `- autonomousGenerationAllowed: ${String(contract.autonomousGenerationAllowed)}`,
    `- approvalExecutionAllowed: ${String(contract.approvalExecutionAllowed)}`,
    `- approvalPersistenceAllowed: ${String(contract.approvalPersistenceAllowed)}`,
    `- mutationExecutionAllowed: ${String(contract.mutationExecutionAllowed)}`,
    `- mutationExpansionAllowed: ${String(contract.mutationExpansionAllowed)}`,
    `- generationRuntimeImplemented: ${String(contract.generationRuntimeImplemented)}`,
    `- generationExecutionAllowed: ${String(contract.generationExecutionAllowed)}`,
    `- outputExecutionAllowed: ${String(contract.outputExecutionAllowed)}`,
    `- inputExecutionAllowed: ${String(contract.inputExecutionAllowed)}`,
    `- bundleExecutionAllowed: ${String(contract.bundleExecutionAllowed)}`,
    `- rollbackExecutionAllowed: ${String(contract.rollbackExecutionAllowed)}`,
    `- recoveryExecutionAllowed: ${String(contract.recoveryExecutionAllowed)}`,
    `- riskEnforcementAllowed: ${String(contract.riskEnforcementAllowed)}`,
    `- validationExecutionAllowed: ${String(contract.validationExecutionAllowed)}`,
    `- dependencyInstallationAllowed: ${String(contract.dependencyInstallationAllowed)}`,
    `- packageMutationAllowed: ${String(contract.packageMutationAllowed)}`,
    `- fileWriteAllowed: ${String(contract.fileWriteAllowed)}`,
    `- fileCreationAllowed: ${String(contract.fileCreationAllowed)}`,
    `- scaffoldGenerationEnabled: ${String(contract.scaffoldGenerationEnabled)}`,
    `- runtimeRoutingEnabled: ${String(contract.runtimeRoutingEnabled)}`,
    `- runtimeActivationEnabled: ${String(contract.runtimeActivationEnabled)}`,
    `- policyEnforcementEnabled: ${String(contract.policyEnforcementEnabled)}`,
    `- projectGenerationEnabled: ${String(contract.projectGenerationEnabled)}`,
    `- builderAgentRuntimeEnabled: ${String(contract.builderAgentRuntimeEnabled)}`,
    "Notice: no runtime execution, no runtime activation, no runtime routing, no runtime orchestration, no runtime persistence, no project generation, no approval execution, no approval persistence, no mutation execution, no mutation expansion, no input execution, no output execution, no bundle execution, rollback execution, recovery execution, risk enforcement, validation execution, dependency installation, package mutation, file creation, scaffold generation, builder-agent runtime, policy enforcement, or file writing is enabled.",
    renderMetadata(contract.metadata),
    renderControlledProjectGenerationRuntimeBoundarySummary(contract.summary),
    ...boundaries
  ].join("\n");
}

export function renderControlledProjectGenerationContractBundleSummary(summary: ControlledProjectGenerationContractBundleSummary): string {
  return [
    "Controlled project generation contract bundle summary:",
    `- section count: ${summary.totalSections}`,
    `- defined sections: ${summary.definedSections}`,
    `- blocked sections: ${summary.blockedSections}`,
    `- total entries: ${summary.totalEntries}`,
    `- total blocked: ${summary.totalBlocked}`,
    `- total forbidden: ${summary.totalForbidden}`,
    `- CLI preview path coverage: ${summary.cliPreviewPathCount}`,
    `- scenario coverage: ${summary.scenarioCoverageCount}`,
    `- completeness score: ${summary.completeness.score}`,
    `- completeness level: ${summary.completeness.level}`,
    `- completeness reason: ${summary.completeness.reason}`,
    `- read-only: ${String(summary.readonly)}`,
    `- preview-only: ${String(summary.previewOnly)}`,
    `- no-execution: ${String(summary.noExecution)}`,
    renderWarnings(summary.warnings),
    "Recommendations:",
    ...(summary.recommendations.length === 0 ? ["- none"] : summary.recommendations.map((recommendation) => `- ${recommendation}`))
  ].join("\n");
}

export function renderControlledProjectGenerationContractBundleSection(section: ControlledProjectGenerationContractBundleSection): string {
  return [
    `Controlled project generation contract bundle section: ${section.sectionType}`,
    `- title: ${section.title}`,
    `- summary: ${section.summary}`,
    `- status: ${section.status}`,
    `- score: ${section.score}`,
    `- level: ${section.level}`,
    `- entryCount: ${section.entryCount}`,
    `- blockedCount: ${section.blockedCount}`,
    `- forbiddenCount: ${section.forbiddenCount}`,
    `- read-only: ${String(section.readonly)}`,
    `- preview-only: ${String(section.previewOnly)}`,
    `- no-execution: ${String(section.noExecution)}`,
    renderWarnings(section.warnings),
    "Recommendations:",
    ...(section.recommendations.length === 0 ? ["- none"] : section.recommendations.map((recommendation) => `- ${recommendation}`))
  ].join("\n");
}

export function renderControlledProjectGenerationContractBundle(bundle: ControlledProjectGenerationContractBundle): string {
  const sections = bundle.sections.length === 0
    ? ["Controlled project generation contract bundle sections:", "- none"]
    : ["Controlled project generation contract bundle sections:", ...bundle.sections.map(renderControlledProjectGenerationContractBundleSection)];
  return [
    `Controlled project generation contract bundle: ${bundle.title}`,
    `- schemaVersion: ${bundle.schemaVersion}`,
    `- readonly: ${String(bundle.readonly)}`,
    `- previewOnly: ${String(bundle.previewOnly)}`,
    `- contractBundleOnly: ${String(bundle.contractBundleOnly)}`,
    `- stdoutOnly: ${String(bundle.stdoutOnly)}`,
    `- contractBundleExecutionAllowed: ${String(bundle.contractBundleExecutionAllowed)}`,
    `- runtimeExecutionAllowed: ${String(bundle.runtimeExecutionAllowed)}`,
    `- runtimeActivationAllowed: ${String(bundle.runtimeActivationAllowed)}`,
    `- runtimeRoutingAllowed: ${String(bundle.runtimeRoutingAllowed)}`,
    `- runtimeOrchestrationAllowed: ${String(bundle.runtimeOrchestrationAllowed)}`,
    `- runtimePersistenceAllowed: ${String(bundle.runtimePersistenceAllowed)}`,
    `- approvalExecutionAllowed: ${String(bundle.approvalExecutionAllowed)}`,
    `- approvalPersistenceAllowed: ${String(bundle.approvalPersistenceAllowed)}`,
    `- mutationExecutionAllowed: ${String(bundle.mutationExecutionAllowed)}`,
    `- mutationExpansionAllowed: ${String(bundle.mutationExpansionAllowed)}`,
    `- generationRuntimeImplemented: ${String(bundle.generationRuntimeImplemented)}`,
    `- generationExecutionAllowed: ${String(bundle.generationExecutionAllowed)}`,
    `- outputExecutionAllowed: ${String(bundle.outputExecutionAllowed)}`,
    `- inputExecutionAllowed: ${String(bundle.inputExecutionAllowed)}`,
    `- bundleExecutionAllowed: ${String(bundle.bundleExecutionAllowed)}`,
    `- rollbackExecutionAllowed: ${String(bundle.rollbackExecutionAllowed)}`,
    `- recoveryExecutionAllowed: ${String(bundle.recoveryExecutionAllowed)}`,
    `- riskEnforcementAllowed: ${String(bundle.riskEnforcementAllowed)}`,
    `- validationExecutionAllowed: ${String(bundle.validationExecutionAllowed)}`,
    `- dependencyInstallationAllowed: ${String(bundle.dependencyInstallationAllowed)}`,
    `- packageMutationAllowed: ${String(bundle.packageMutationAllowed)}`,
    `- fileWriteAllowed: ${String(bundle.fileWriteAllowed)}`,
    `- fileCreationAllowed: ${String(bundle.fileCreationAllowed)}`,
    `- scaffoldGenerationEnabled: ${String(bundle.scaffoldGenerationEnabled)}`,
    `- runtimeRoutingEnabled: ${String(bundle.runtimeRoutingEnabled)}`,
    `- runtimeActivationEnabled: ${String(bundle.runtimeActivationEnabled)}`,
    `- policyEnforcementEnabled: ${String(bundle.policyEnforcementEnabled)}`,
    `- projectGenerationEnabled: ${String(bundle.projectGenerationEnabled)}`,
    `- builderAgentRuntimeEnabled: ${String(bundle.builderAgentRuntimeEnabled)}`,
    `- CLI preview paths: ${bundle.cliPreviewPaths.length}`,
    `- scenario coverage: ${bundle.scenarioCoverage.length}`,
    "Notice: no runtime, no project generation, no contract bundle execution, no runtime execution, no runtime activation, no runtime routing, no runtime persistence, no approval execution, no approval persistence, no mutation execution, no mutation expansion, no input execution, no output execution, no bundle execution, rollback execution, recovery execution, risk enforcement, validation execution, dependency installation, package mutation, file creation, scaffold generation, builder-agent runtime, policy enforcement, or file writing is enabled.",
    renderMetadata(bundle.metadata),
    renderControlledProjectGenerationContractBundleSummary(bundle.summary),
    ...sections
  ].join("\n");
}

export function renderControlledProjectGenerationContractAuditSummary(summary: ControlledProjectGenerationContractAuditSummary): string {
  return [
    "Controlled project generation contract audit summary:",
    `- section count: ${summary.totalSections}`,
    `- complete sections: ${summary.completeSections}`,
    `- defined sections: ${summary.definedSections}`,
    `- blocked sections: ${summary.blockedSections}`,
    `- total entries: ${summary.totalEntries}`,
    `- total blocked: ${summary.totalBlocked}`,
    `- total forbidden: ${summary.totalForbidden}`,
    `- CLI preview path coverage: ${summary.cliPreviewPathCount}`,
    `- CLI scope coverage: ${summary.cliScopeCoverageCount}`,
    `- scenario coverage: ${summary.scenarioCoverageCount}`,
    `- completeness score: ${summary.completeness.score}`,
    `- completeness level: ${summary.completeness.level}`,
    `- completeness reason: ${summary.completeness.reason}`,
    `- read-only: ${String(summary.readonly)}`,
    `- preview-only: ${String(summary.previewOnly)}`,
    `- no-execution: ${String(summary.noExecution)}`,
    renderWarnings(summary.warnings),
    "Recommendations:",
    ...(summary.recommendations.length === 0 ? ["- none"] : summary.recommendations.map((recommendation) => `- ${recommendation}`))
  ].join("\n");
}

export function renderControlledProjectGenerationContractAuditSection(section: ControlledProjectGenerationContractAuditSection): string {
  return [
    `Controlled project generation contract audit section: ${section.sectionType}`,
    `- title: ${section.title}`,
    `- summary: ${section.summary}`,
    `- status: ${section.status}`,
    `- score: ${section.score}`,
    `- level: ${section.level}`,
    `- entryCount: ${section.entryCount}`,
    `- blockedCount: ${section.blockedCount}`,
    `- forbiddenCount: ${section.forbiddenCount}`,
    `- read-only: ${String(section.readonly)}`,
    `- preview-only: ${String(section.previewOnly)}`,
    `- no-execution: ${String(section.noExecution)}`,
    renderWarnings(section.warnings),
    "Recommendations:",
    ...(section.recommendations.length === 0 ? ["- none"] : section.recommendations.map((recommendation) => `- ${recommendation}`))
  ].join("\n");
}

export function renderControlledProjectGenerationContractAudit(audit: ControlledProjectGenerationContractAudit): string {
  const sections = audit.sections.length === 0
    ? ["Controlled project generation contract audit sections:", "- none"]
    : ["Controlled project generation contract audit sections:", ...audit.sections.map(renderControlledProjectGenerationContractAuditSection)];
  return [
    `Controlled project generation contract audit: ${audit.title}`,
    `- schemaVersion: ${audit.schemaVersion}`,
    `- readonly: ${String(audit.readonly)}`,
    `- previewOnly: ${String(audit.previewOnly)}`,
    `- contractAuditOnly: ${String(audit.contractAuditOnly)}`,
    `- stdoutOnly: ${String(audit.stdoutOnly)}`,
    `- contractAuditExecutionAllowed: ${String(audit.contractAuditExecutionAllowed)}`,
    `- contractExecutionAllowed: ${String(audit.contractExecutionAllowed)}`,
    `- contractBundleExecutionAllowed: ${String(audit.contractBundleExecutionAllowed)}`,
    `- runtimeExecutionAllowed: ${String(audit.runtimeExecutionAllowed)}`,
    `- runtimeActivationAllowed: ${String(audit.runtimeActivationAllowed)}`,
    `- runtimeRoutingAllowed: ${String(audit.runtimeRoutingAllowed)}`,
    `- runtimeOrchestrationAllowed: ${String(audit.runtimeOrchestrationAllowed)}`,
    `- runtimePersistenceAllowed: ${String(audit.runtimePersistenceAllowed)}`,
    `- approvalExecutionAllowed: ${String(audit.approvalExecutionAllowed)}`,
    `- approvalPersistenceAllowed: ${String(audit.approvalPersistenceAllowed)}`,
    `- mutationExecutionAllowed: ${String(audit.mutationExecutionAllowed)}`,
    `- mutationExpansionAllowed: ${String(audit.mutationExpansionAllowed)}`,
    `- generationRuntimeImplemented: ${String(audit.generationRuntimeImplemented)}`,
    `- generationExecutionAllowed: ${String(audit.generationExecutionAllowed)}`,
    `- outputExecutionAllowed: ${String(audit.outputExecutionAllowed)}`,
    `- inputExecutionAllowed: ${String(audit.inputExecutionAllowed)}`,
    `- bundleExecutionAllowed: ${String(audit.bundleExecutionAllowed)}`,
    `- rollbackExecutionAllowed: ${String(audit.rollbackExecutionAllowed)}`,
    `- recoveryExecutionAllowed: ${String(audit.recoveryExecutionAllowed)}`,
    `- riskEnforcementAllowed: ${String(audit.riskEnforcementAllowed)}`,
    `- validationExecutionAllowed: ${String(audit.validationExecutionAllowed)}`,
    `- dependencyInstallationAllowed: ${String(audit.dependencyInstallationAllowed)}`,
    `- packageMutationAllowed: ${String(audit.packageMutationAllowed)}`,
    `- fileWriteAllowed: ${String(audit.fileWriteAllowed)}`,
    `- fileCreationAllowed: ${String(audit.fileCreationAllowed)}`,
    `- scaffoldGenerationEnabled: ${String(audit.scaffoldGenerationEnabled)}`,
    `- runtimeRoutingEnabled: ${String(audit.runtimeRoutingEnabled)}`,
    `- runtimeActivationEnabled: ${String(audit.runtimeActivationEnabled)}`,
    `- policyEnforcementEnabled: ${String(audit.policyEnforcementEnabled)}`,
    `- projectGenerationEnabled: ${String(audit.projectGenerationEnabled)}`,
    `- builderAgentRuntimeEnabled: ${String(audit.builderAgentRuntimeEnabled)}`,
    `- CLI preview paths: ${audit.cliPreviewPaths.length}`,
    `- CLI scope coverage: ${audit.cliScopeCoverage.length}`,
    `- scenario coverage: ${audit.scenarioCoverage.length}`,
    "Notice: no runtime, no project generation, no contract execution, no contract audit execution, no contract bundle execution, no runtime execution, no runtime activation, no runtime routing, no runtime orchestration, no runtime persistence, no approval execution, no approval persistence, no mutation execution, no mutation expansion, no input execution, no output execution, no bundle execution, rollback execution, recovery execution, risk enforcement, validation execution, dependency installation, package mutation, file creation, scaffold generation, builder-agent runtime, policy enforcement, or file writing is enabled.",
    renderMetadata(audit.metadata),
    renderControlledProjectGenerationContractAuditSummary(audit.summary),
    ...sections
  ].join("\n");
}

export function renderControlledProjectGenerationContractExportSummary(summary: ControlledProjectGenerationContractExportSummary): string {
  return [
    "Controlled project generation contract export summary:",
    `- format: ${summary.format}`,
    `- dataType: ${summary.dataType}`,
    `- included contract sections: ${summary.includedContractSections.join(", ") || "none"}`,
    `- read-only: ${String(summary.readonly)}`,
    `- preview-only: ${String(summary.previewOnly)}`,
    `- stdout-only: ${String(summary.stdoutOnly)}`,
    `- fileWriteAllowed: ${String(summary.fileWriteAllowed)}`,
    `- contractExecutionAllowed: ${String(summary.contractExecutionAllowed)}`,
    `- contractBundleExecutionAllowed: ${String(summary.contractBundleExecutionAllowed)}`,
    `- contractAuditExecutionAllowed: ${String(summary.contractAuditExecutionAllowed)}`,
    `- runtimeExecutionAllowed: ${String(summary.runtimeExecutionAllowed)}`,
    `- runtimeActivationAllowed: ${String(summary.runtimeActivationAllowed)}`,
    `- runtimeRoutingAllowed: ${String(summary.runtimeRoutingAllowed)}`,
    `- runtimePersistenceAllowed: ${String(summary.runtimePersistenceAllowed)}`,
    `- projectGenerationEnabled: ${String(summary.projectGenerationEnabled)}`,
    renderWarnings(summary.warnings),
    "Recommendations:",
    ...(summary.recommendations.length === 0 ? ["- none"] : summary.recommendations.map((recommendation) => `- ${recommendation}`))
  ].join("\n");
}

export function renderControlledProjectGenerationContractExportPayload(payload: ControlledProjectGenerationContractExportPayload<unknown>): string {
  return [
    `Controlled project generation contract export payload: ${payload.title}`,
    `- schemaVersion: ${payload.schemaVersion}`,
    `- format: ${payload.format}`,
    `- dataType: ${payload.dataType}`,
    `- readonly: ${String(payload.readonly)}`,
    `- previewOnly: ${String(payload.previewOnly)}`,
    `- stdoutOnly: ${String(payload.stdoutOnly)}`,
    `- fileWriteAllowed: ${String(payload.fileWriteAllowed)}`,
    `- contractExecutionAllowed: ${String(payload.contractExecutionAllowed)}`,
    `- contractBundleExecutionAllowed: ${String(payload.contractBundleExecutionAllowed)}`,
    `- contractAuditExecutionAllowed: ${String(payload.contractAuditExecutionAllowed)}`,
    `- runtimeExecutionAllowed: ${String(payload.runtimeExecutionAllowed)}`,
    `- runtimeActivationAllowed: ${String(payload.runtimeActivationAllowed)}`,
    `- runtimeRoutingAllowed: ${String(payload.runtimeRoutingAllowed)}`,
    `- runtimePersistenceAllowed: ${String(payload.runtimePersistenceAllowed)}`,
    `- approvalExecutionAllowed: ${String(payload.approvalExecutionAllowed)}`,
    `- approvalPersistenceAllowed: ${String(payload.approvalPersistenceAllowed)}`,
    `- mutationExecutionAllowed: ${String(payload.mutationExecutionAllowed)}`,
    `- mutationExpansionAllowed: ${String(payload.mutationExpansionAllowed)}`,
    `- outputExecutionAllowed: ${String(payload.outputExecutionAllowed)}`,
    `- inputExecutionAllowed: ${String(payload.inputExecutionAllowed)}`,
    `- rollbackExecutionAllowed: ${String(payload.rollbackExecutionAllowed)}`,
    `- recoveryExecutionAllowed: ${String(payload.recoveryExecutionAllowed)}`,
    `- riskEnforcementAllowed: ${String(payload.riskEnforcementAllowed)}`,
    `- validationExecutionAllowed: ${String(payload.validationExecutionAllowed)}`,
    `- dependencyInstallationAllowed: ${String(payload.dependencyInstallationAllowed)}`,
    `- packageMutationAllowed: ${String(payload.packageMutationAllowed)}`,
    `- fileCreationAllowed: ${String(payload.fileCreationAllowed)}`,
    `- scaffoldGenerationEnabled: ${String(payload.scaffoldGenerationEnabled)}`,
    `- projectGenerationEnabled: ${String(payload.projectGenerationEnabled)}`,
    `- builderAgentRuntimeEnabled: ${String(payload.builderAgentRuntimeEnabled)}`,
    "Notice: stdout-only export preview; no file writes, no contract execution, no contract bundle execution, no contract audit execution, no runtime execution, no project generation, no approval execution, no mutation execution, no dependency installation, no package mutation, no file creation, and no scaffold generation is enabled.",
    renderMetadata(payload.metadata),
    renderControlledProjectGenerationContractExportSummary(payload.summary)
  ].join("\n");
}

export function renderControlledProjectGenerationDesignCompletionAuditSummary(summary: ControlledProjectGenerationDesignCompletionAuditSummary): string {
  return [
    "Controlled project generation design completion audit summary:",
    `- section count: ${summary.totalSections}`,
    `- complete sections: ${summary.completeSections}`,
    `- defined sections: ${summary.definedSections}`,
    `- blocked sections: ${summary.blockedSections}`,
    `- total entries: ${summary.totalEntries}`,
    `- total blocked: ${summary.totalBlocked}`,
    `- total forbidden: ${summary.totalForbidden}`,
    `- CLI scope coverage: ${summary.cliScopeCoverageCount}`,
    `- scenario coverage: ${summary.scenarioCoverageCount}`,
    `- export coverage: ${summary.exportCoverageCount}`,
    `- forbidden actions: ${summary.forbiddenActionCount}`,
    `- readonly guarantees: ${summary.readonlyGuaranteeCount}`,
    `- preview-only guarantees: ${summary.previewOnlyGuaranteeCount}`,
    `- no-execution guarantees: ${summary.noExecutionGuaranteeCount}`,
    `- completion score: ${summary.completionScore.score}`,
    `- completion level: ${summary.completionScore.level}`,
    `- completion reason: ${summary.completionScore.reason}`,
    `- read-only: ${String(summary.readonly)}`,
    `- preview-only: ${String(summary.previewOnly)}`,
    `- no-execution: ${String(summary.noExecution)}`,
    renderWarnings(summary.warnings),
    "Recommendations:",
    ...(summary.recommendations.length === 0 ? ["- none"] : summary.recommendations.map((recommendation) => `- ${recommendation}`))
  ].join("\n");
}

export function renderControlledProjectGenerationDesignCompletionAuditSection(section: ControlledProjectGenerationDesignCompletionAuditSection): string {
  return [
    `Controlled project generation design completion audit section: ${section.sectionType}`,
    `- title: ${section.title}`,
    `- status: ${section.status}`,
    `- score: ${section.score}`,
    `- level: ${section.level}`,
    `- entryCount: ${section.entryCount}`,
    `- blockedCount: ${section.blockedCount}`,
    `- forbiddenCount: ${section.forbiddenCount}`,
    `- read-only: ${String(section.readonly)}`,
    `- preview-only: ${String(section.previewOnly)}`,
    `- no-execution: ${String(section.noExecution)}`,
    renderWarnings(section.warnings),
    "Recommendations:",
    ...(section.recommendations.length === 0 ? ["- none"] : section.recommendations.map((recommendation) => `- ${recommendation}`))
  ].join("\n");
}

export function renderControlledProjectGenerationDesignCompletionAudit(audit: ControlledProjectGenerationDesignCompletionAudit): string {
  const sections = audit.sections.length === 0
    ? ["Controlled project generation design completion audit sections:", "- none"]
    : ["Controlled project generation design completion audit sections:", ...audit.sections.map(renderControlledProjectGenerationDesignCompletionAuditSection)];
  return [
    `Controlled project generation design completion audit: ${audit.title}`,
    `- schemaVersion: ${audit.schemaVersion}`,
    `- readonly: ${String(audit.readonly)}`,
    `- previewOnly: ${String(audit.previewOnly)}`,
    `- stdoutOnly: ${String(audit.stdoutOnly)}`,
    `- completionAuditOnly: ${String(audit.completionAuditOnly)}`,
    `- fileWriteAllowed: ${String(audit.fileWriteAllowed)}`,
    `- runtimeExecutionAllowed: ${String(audit.runtimeExecutionAllowed)}`,
    `- runtimeActivationAllowed: ${String(audit.runtimeActivationAllowed)}`,
    `- runtimeRoutingAllowed: ${String(audit.runtimeRoutingAllowed)}`,
    `- runtimeOrchestrationAllowed: ${String(audit.runtimeOrchestrationAllowed)}`,
    `- runtimePersistenceAllowed: ${String(audit.runtimePersistenceAllowed)}`,
    `- plannerLoopAllowed: ${String(audit.plannerLoopAllowed)}`,
    `- builderAgentLoopAllowed: ${String(audit.builderAgentLoopAllowed)}`,
    `- approvalExecutionAllowed: ${String(audit.approvalExecutionAllowed)}`,
    `- approvalPersistenceAllowed: ${String(audit.approvalPersistenceAllowed)}`,
    `- mutationExecutionAllowed: ${String(audit.mutationExecutionAllowed)}`,
    `- mutationExpansionAllowed: ${String(audit.mutationExpansionAllowed)}`,
    `- contractExecutionAllowed: ${String(audit.contractExecutionAllowed)}`,
    `- contractBundleExecutionAllowed: ${String(audit.contractBundleExecutionAllowed)}`,
    `- contractAuditExecutionAllowed: ${String(audit.contractAuditExecutionAllowed)}`,
    `- contractExportExecutionAllowed: ${String(audit.contractExportExecutionAllowed)}`,
    `- outputExecutionAllowed: ${String(audit.outputExecutionAllowed)}`,
    `- inputExecutionAllowed: ${String(audit.inputExecutionAllowed)}`,
    `- rollbackExecutionAllowed: ${String(audit.rollbackExecutionAllowed)}`,
    `- recoveryExecutionAllowed: ${String(audit.recoveryExecutionAllowed)}`,
    `- riskEnforcementAllowed: ${String(audit.riskEnforcementAllowed)}`,
    `- validationExecutionAllowed: ${String(audit.validationExecutionAllowed)}`,
    `- dependencyInstallationAllowed: ${String(audit.dependencyInstallationAllowed)}`,
    `- packageMutationAllowed: ${String(audit.packageMutationAllowed)}`,
    `- fileCreationAllowed: ${String(audit.fileCreationAllowed)}`,
    `- scaffoldGenerationEnabled: ${String(audit.scaffoldGenerationEnabled)}`,
    `- runtimeRoutingEnabled: ${String(audit.runtimeRoutingEnabled)}`,
    `- runtimeActivationEnabled: ${String(audit.runtimeActivationEnabled)}`,
    `- policyEnforcementEnabled: ${String(audit.policyEnforcementEnabled)}`,
    `- projectGenerationEnabled: ${String(audit.projectGenerationEnabled)}`,
    `- builderAgentRuntimeEnabled: ${String(audit.builderAgentRuntimeEnabled)}`,
    `- CLI scope coverage: ${audit.cliScopeCoverage.length}`,
    `- scenario coverage: ${audit.scenarioCoverage.length}`,
    `- export coverage: ${audit.exportCoverage.length}`,
    `- forbidden actions: ${audit.forbiddenActions.length}`,
    `- readonly guarantees: ${audit.readonlyGuarantees.length}`,
    `- preview-only guarantees: ${audit.previewOnlyGuarantees.length}`,
    `- no-execution guarantees: ${audit.noExecutionGuarantees.length}`,
    "Notice: No Runtime. No Project Generation. No Contract Execution. No runtime execution, runtime activation, runtime routing, runtime orchestration, runtime persistence, approval execution, approval persistence, mutation execution, mutation expansion, contract bundle execution, contract audit execution, contract export execution, input execution, output execution, rollback execution, recovery execution, risk enforcement, validation execution, dependency installation, package mutation, file creation, scaffold generation, builder-agent runtime, governance activation, policy enforcement, or file writing is enabled.",
    renderMetadata(audit.metadata),
    renderControlledProjectGenerationDesignCompletionAuditSummary(audit.summary),
    ...sections
  ].join("\n");
}

export function renderControlledRuntimeArchitectureSummary(summary: ControlledRuntimeArchitectureSummary): string {
  return [
    "Controlled runtime architecture summary:",
    `- component count: ${summary.totalComponents}`,
    `- lifecycle phase count: ${summary.totalPhases}`,
    `- forbidden actions: ${summary.totalForbiddenActions}`,
    `- runtime design ready: ${String(summary.runtimeDesignReady)}`,
    `- completeness score: ${summary.completeness.score}`,
    `- completeness level: ${summary.completeness.level}`,
    `- completeness reason: ${summary.completeness.reason}`,
    `- read-only: ${String(summary.readonly)}`,
    `- preview-only: ${String(summary.previewOnly)}`,
    `- conceptual-only: ${String(summary.conceptualOnly)}`,
    `- no-execution: ${String(summary.noExecution)}`,
    renderWarnings(summary.warnings),
    "Recommendations:",
    ...(summary.recommendations.length === 0 ? ["- none"] : summary.recommendations.map((recommendation) => `- ${recommendation}`))
  ].join("\n");
}

export function renderControlledRuntimeArchitectureComponent(component: ControlledRuntimeArchitectureComponent): string {
  return [
    `Controlled runtime architecture component: ${component.componentType}`,
    `- id: ${component.id}`,
    `- title: ${component.title}`,
    `- responsibility: ${component.responsibility}`,
    `- status: ${component.status}`,
    `- score: ${component.score}`,
    `- dependencies: ${component.dependencies.length === 0 ? "none" : component.dependencies.join(", ")}`,
    `- forbidden actions: ${component.forbiddenActions.length}`,
    `- read-only: ${String(component.readonly)}`,
    `- preview-only: ${String(component.previewOnly)}`,
    `- conceptual-only: ${String(component.conceptualOnly)}`,
    `- no-execution: ${String(component.noExecution)}`,
    renderWarnings(component.warnings),
    "Recommendations:",
    ...(component.recommendations.length === 0 ? ["- none"] : component.recommendations.map((recommendation) => `- ${recommendation}`))
  ].join("\n");
}

export function renderControlledRuntimeArchitecturePreview(preview: ControlledRuntimeArchitecturePreview): string {
  const components = preview.components.length === 0
    ? ["Controlled runtime architecture components:", "- none"]
    : ["Controlled runtime architecture components:", ...preview.components.map(renderControlledRuntimeArchitectureComponent)];
  const phases = preview.phases.length === 0
    ? ["Controlled runtime architecture lifecycle phases:", "- none"]
    : [
        "Controlled runtime architecture lifecycle phases:",
        ...preview.phases.map((phase) => `${phase.phaseType} | title=${phase.title} | status=${phase.status} | score=${phase.score} | noExecution=${String(phase.noExecution)} | requiresHumanApproval=${String(phase.requiresHumanApproval)}`)
      ];
  return [
    `Controlled runtime architecture preview: ${preview.title}`,
    `- schemaVersion: ${preview.schemaVersion}`,
    `- readonly: ${String(preview.readonly)}`,
    `- previewOnly: ${String(preview.previewOnly)}`,
    `- stdoutOnly: ${String(preview.stdoutOnly)}`,
    `- architecturePreviewOnly: ${String(preview.architecturePreviewOnly)}`,
    `- runtimeExecutionAllowed: ${String(preview.runtimeExecutionAllowed)}`,
    `- runtimeActivationAllowed: ${String(preview.runtimeActivationAllowed)}`,
    `- runtimeRoutingAllowed: ${String(preview.runtimeRoutingAllowed)}`,
    `- runtimeOrchestrationAllowed: ${String(preview.runtimeOrchestrationAllowed)}`,
    `- runtimePersistenceAllowed: ${String(preview.runtimePersistenceAllowed)}`,
    `- projectGenerationEnabled: ${String(preview.projectGenerationEnabled)}`,
    `- builderAgentRuntimeEnabled: ${String(preview.builderAgentRuntimeEnabled)}`,
    `- agentExecutionAllowed: ${String(preview.agentExecutionAllowed)}`,
    `- agentLoopsAllowed: ${String(preview.agentLoopsAllowed)}`,
    `- multiAgentSystemsAllowed: ${String(preview.multiAgentSystemsAllowed)}`,
    `- approvalExecutionAllowed: ${String(preview.approvalExecutionAllowed)}`,
    `- mutationExecutionAllowed: ${String(preview.mutationExecutionAllowed)}`,
    `- fileWriteAllowed: ${String(preview.fileWriteAllowed)}`,
    `- fileCreationAllowed: ${String(preview.fileCreationAllowed)}`,
    `- dependencyInstallationAllowed: ${String(preview.dependencyInstallationAllowed)}`,
    `- packageMutationAllowed: ${String(preview.packageMutationAllowed)}`,
    `- policyEnforcementEnabled: ${String(preview.policyEnforcementEnabled)}`,
    `- governanceActivationAllowed: ${String(preview.governanceActivationAllowed)}`,
    `- autonomyEnabled: ${String(preview.autonomyEnabled)}`,
    `- selfImprovementAllowed: ${String(preview.selfImprovementAllowed)}`,
    `- selfModificationAllowed: ${String(preview.selfModificationAllowed)}`,
    "Notice: read-only, preview-only controlled runtime architecture only. No runtime execution, no runtime activation, no runtime routing, no runtime orchestration, no runtime persistence, no project generation, no builder-agent runtime, no agent execution, no agent loops, no multi-agent systems, no approval execution, no mutation execution, no file writing, no file creation, no dependency installation, no package mutation, no policy enforcement, no governance activation, no autonomy, no self-improvement, and no self-modification is enabled.",
    renderMetadata(preview.metadata),
    renderControlledRuntimeArchitectureSummary(preview.summary),
    ...components,
    ...phases
  ].join("\n");
}

export function renderControlledRuntimeComponentContractSummary(summary: ControlledRuntimeComponentContractSummary): string {
  return [
    "Controlled runtime component contract summary:",
    `- component contract count: ${summary.totalContracts}`,
    `- blocked count: ${summary.blockedCount}`,
    `- preview-only count: ${summary.previewOnlyCount}`,
    `- forbidden actions: ${summary.totalForbiddenActions}`,
    `- dependencies: ${summary.totalDependencies}`,
    `- risk distribution: ${renderRuntimeComponentRiskGroups(summary.riskDistribution)}`,
    `- completeness score: ${summary.completeness.score}`,
    `- completeness level: ${summary.completeness.level}`,
    `- completeness reason: ${summary.completeness.reason}`,
    `- read-only: ${String(summary.readonly)}`,
    `- preview-only: ${String(summary.previewOnly)}`,
    `- no-execution: ${String(summary.noExecution)}`,
    renderWarnings(summary.warnings),
    "Recommendations:",
    ...(summary.recommendations.length === 0 ? ["- none"] : summary.recommendations.map((recommendation) => `- ${recommendation}`))
  ].join("\n");
}

export function renderControlledRuntimeComponentContractEntry(entry: ControlledRuntimeComponentContractEntry): string {
  return [
    `Controlled runtime component contract entry: ${entry.role}`,
    `- componentId: ${entry.componentId}`,
    `- title: ${entry.title}`,
    `- status: ${entry.status}`,
    `- riskLevel: ${entry.riskLevel}`,
    `- blockedReason: ${entry.blockedReason ?? "none"}`,
    `- responsibilities: ${entry.responsibilities.length === 0 ? "none" : entry.responsibilities.join(", ")}`,
    `- allowed inputs: ${entry.allowedInputs.length === 0 ? "none" : entry.allowedInputs.join(", ")}`,
    `- allowed outputs: ${entry.allowedOutputs.length === 0 ? "none" : entry.allowedOutputs.join(", ")}`,
    `- dependencies: ${entry.dependencies.length === 0 ? "none" : entry.dependencies.join(", ")}`,
    `- forbidden actions: ${entry.forbiddenActions.length === 0 ? "none" : entry.forbiddenActions.join(", ")}`,
    `- read-only: ${String(entry.readonly)}`,
    `- preview-only: ${String(entry.previewOnly)}`,
    `- no-execution: ${String(entry.noExecution)}`,
    renderWarnings(entry.warnings),
    "Recommendations:",
    ...(entry.recommendations.length === 0 ? ["- none"] : entry.recommendations.map((recommendation) => `- ${recommendation}`))
  ].join("\n");
}

export function renderControlledRuntimeComponentContract(contract: ControlledRuntimeComponentContract): string {
  const entries = contract.entries.length === 0
    ? ["Controlled runtime component contract entries:", "- none"]
    : ["Controlled runtime component contract entries:", ...contract.entries.map(renderControlledRuntimeComponentContractEntry)];
  return [
    `Controlled runtime component contract: ${contract.title}`,
    `- schemaVersion: ${contract.schemaVersion}`,
    `- readonly: ${String(contract.readonly)}`,
    `- previewOnly: ${String(contract.previewOnly)}`,
    `- stdoutOnly: ${String(contract.stdoutOnly)}`,
    `- componentContractOnly: ${String(contract.componentContractOnly)}`,
    `- runtimeExecutionAllowed: ${String(contract.runtimeExecutionAllowed)}`,
    `- runtimeActivationAllowed: ${String(contract.runtimeActivationAllowed)}`,
    `- runtimeRoutingAllowed: ${String(contract.runtimeRoutingAllowed)}`,
    `- runtimeOrchestrationAllowed: ${String(contract.runtimeOrchestrationAllowed)}`,
    `- runtimePersistenceAllowed: ${String(contract.runtimePersistenceAllowed)}`,
    `- projectGenerationEnabled: ${String(contract.projectGenerationEnabled)}`,
    `- builderAgentRuntimeEnabled: ${String(contract.builderAgentRuntimeEnabled)}`,
    `- agentExecutionAllowed: ${String(contract.agentExecutionAllowed)}`,
    `- approvalExecutionAllowed: ${String(contract.approvalExecutionAllowed)}`,
    `- mutationExecutionAllowed: ${String(contract.mutationExecutionAllowed)}`,
    `- inputExecutionAllowed: ${String(contract.inputExecutionAllowed)}`,
    `- outputExecutionAllowed: ${String(contract.outputExecutionAllowed)}`,
    `- contractExecutionAllowed: ${String(contract.contractExecutionAllowed)}`,
    `- fileWriteAllowed: ${String(contract.fileWriteAllowed)}`,
    `- fileCreationAllowed: ${String(contract.fileCreationAllowed)}`,
    `- dependencyInstallationAllowed: ${String(contract.dependencyInstallationAllowed)}`,
    `- packageMutationAllowed: ${String(contract.packageMutationAllowed)}`,
    `- generatedProjectValidationAllowed: ${String(contract.generatedProjectValidationAllowed)}`,
    `- policyEnforcementEnabled: ${String(contract.policyEnforcementEnabled)}`,
    `- governanceActivationAllowed: ${String(contract.governanceActivationAllowed)}`,
    "Notice: read-only, preview-only component contracts only. No runtime execution, no runtime activation, no runtime routing, no runtime orchestration, no runtime persistence, no project generation, no builder-agent runtime, no agent execution, no approval execution, no mutation execution, no input execution, no output execution, no contract execution, no file writing, no file creation, no dependency installation, no package mutation, no generated-project validation, no policy enforcement, and no governance activation is enabled.",
    renderMetadata(contract.metadata),
    renderControlledRuntimeComponentContractSummary(contract.summary),
    ...entries
  ].join("\n");
}

export function renderControlledRuntimeFlowSummary(summary: ControlledRuntimeFlowSummary): string {
  return [
    "Controlled runtime flow summary:",
    `- step count: ${summary.totalSteps}`,
    `- transition count: ${summary.totalTransitions}`,
    `- blocked count: ${summary.blockedCount}`,
    `- approval-required count: ${summary.approvalRequiredCount}`,
    `- preview-only count: ${summary.previewOnlyCount}`,
    `- risk distribution: ${renderRuntimeFlowRiskGroups(summary.riskDistribution)}`,
    `- transition policies: ${renderRuntimeFlowTransitionPolicyGroups(summary.transitionPolicyDistribution)}`,
    `- completeness score: ${summary.completeness.score}`,
    `- completeness level: ${summary.completeness.level}`,
    `- completeness reason: ${summary.completeness.reason}`,
    `- read-only: ${String(summary.readonly)}`,
    `- preview-only: ${String(summary.previewOnly)}`,
    `- no-routing: ${String(summary.noRouting)}`,
    `- no-execution: ${String(summary.noExecution)}`,
    renderWarnings(summary.warnings),
    "Recommendations:",
    ...(summary.recommendations.length === 0 ? ["- none"] : summary.recommendations.map((recommendation) => `- ${recommendation}`))
  ].join("\n");
}

export function renderControlledRuntimeFlowStep(step: ControlledRuntimeFlowStep): string {
  return [
    `Controlled runtime flow step: ${step.stepId}`,
    `- title: ${step.title}`,
    `- componentId: ${step.componentId}`,
    `- phase: ${step.phase}`,
    `- status: ${step.status}`,
    `- riskLevel: ${step.riskLevel}`,
    `- approvalRequired: ${String(step.approvalRequired)}`,
    `- allowed inputs: ${step.allowedInputs.length === 0 ? "none" : step.allowedInputs.join(", ")}`,
    `- allowed outputs: ${step.allowedOutputs.length === 0 ? "none" : step.allowedOutputs.join(", ")}`,
    `- previous steps: ${step.requiredPreviousSteps.length === 0 ? "none" : step.requiredPreviousSteps.join(", ")}`,
    `- next steps: ${step.nextSteps.length === 0 ? "none" : step.nextSteps.join(", ")}`,
    `- blockedReason: ${step.blockedReason ?? "none"}`,
    `- read-only: ${String(step.readonly)}`,
    `- preview-only: ${String(step.previewOnly)}`,
    `- no-execution: ${String(step.noExecution)}`,
    renderWarnings(step.warnings),
    "Recommendations:",
    ...(step.recommendations.length === 0 ? ["- none"] : step.recommendations.map((recommendation) => `- ${recommendation}`))
  ].join("\n");
}

export function renderControlledRuntimeFlowTransition(transition: ControlledRuntimeFlowTransition): string {
  return [
    `Controlled runtime flow transition: ${transition.transitionId}`,
    `- fromStep: ${transition.fromStep}`,
    `- toStep: ${transition.toStep}`,
    `- handoffType: ${transition.handoffType}`,
    `- handoffPayload: ${transition.handoffPayload}`,
    `- transitionPolicy: ${transition.transitionPolicy}`,
    `- approvalRequired: ${String(transition.approvalRequired)}`,
    `- blockedReason: ${transition.blockedReason ?? "none"}`,
    `- read-only: ${String(transition.readonly)}`,
    `- preview-only: ${String(transition.previewOnly)}`,
    `- no-routing: ${String(transition.noRouting)}`,
    `- no-execution: ${String(transition.noExecution)}`
  ].join("\n");
}

export function renderControlledRuntimeFlowPreview(preview: ControlledRuntimeFlowPreview): string {
  const steps = preview.steps.length === 0
    ? ["Controlled runtime flow steps:", "- none"]
    : ["Controlled runtime flow steps:", ...preview.steps.map(renderControlledRuntimeFlowStep)];
  const transitions = preview.transitions.length === 0
    ? ["Controlled runtime flow transitions:", "- none"]
    : ["Controlled runtime flow transitions:", ...preview.transitions.map(renderControlledRuntimeFlowTransition)];
  return [
    `Controlled runtime flow preview: ${preview.title}`,
    `- schemaVersion: ${preview.schemaVersion}`,
    `- readonly: ${String(preview.readonly)}`,
    `- previewOnly: ${String(preview.previewOnly)}`,
    `- stdoutOnly: ${String(preview.stdoutOnly)}`,
    `- flowPreviewOnly: ${String(preview.flowPreviewOnly)}`,
    `- runtimeExecutionAllowed: ${String(preview.runtimeExecutionAllowed)}`,
    `- runtimeActivationAllowed: ${String(preview.runtimeActivationAllowed)}`,
    `- runtimeRoutingAllowed: ${String(preview.runtimeRoutingAllowed)}`,
    `- runtimeOrchestrationAllowed: ${String(preview.runtimeOrchestrationAllowed)}`,
    `- runtimePersistenceAllowed: ${String(preview.runtimePersistenceAllowed)}`,
    `- flowExecutionAllowed: ${String(preview.flowExecutionAllowed)}`,
    `- projectGenerationEnabled: ${String(preview.projectGenerationEnabled)}`,
    `- builderAgentRuntimeEnabled: ${String(preview.builderAgentRuntimeEnabled)}`,
    `- agentExecutionAllowed: ${String(preview.agentExecutionAllowed)}`,
    `- approvalExecutionAllowed: ${String(preview.approvalExecutionAllowed)}`,
    `- mutationExecutionAllowed: ${String(preview.mutationExecutionAllowed)}`,
    `- inputExecutionAllowed: ${String(preview.inputExecutionAllowed)}`,
    `- outputExecutionAllowed: ${String(preview.outputExecutionAllowed)}`,
    `- contractExecutionAllowed: ${String(preview.contractExecutionAllowed)}`,
    `- fileWriteAllowed: ${String(preview.fileWriteAllowed)}`,
    `- fileCreationAllowed: ${String(preview.fileCreationAllowed)}`,
    `- dependencyInstallationAllowed: ${String(preview.dependencyInstallationAllowed)}`,
    `- packageMutationAllowed: ${String(preview.packageMutationAllowed)}`,
    `- generatedProjectValidationAllowed: ${String(preview.generatedProjectValidationAllowed)}`,
    `- policyEnforcementEnabled: ${String(preview.policyEnforcementEnabled)}`,
    `- governanceActivationAllowed: ${String(preview.governanceActivationAllowed)}`,
    "Notice: read-only, preview-only runtime flow only. No runtime routing, no runtime orchestration, no runtime execution, no runtime activation, no runtime persistence, no flow execution, no project generation, no builder-agent runtime, no agent execution, no approval execution, no mutation execution, no input execution, no output execution, no contract execution, no file writing, no file creation, no dependency installation, no package mutation, no generated-project validation, no policy enforcement, and no governance activation is enabled.",
    renderMetadata(preview.metadata),
    renderControlledRuntimeFlowSummary(preview.summary),
    ...steps,
    ...transitions
  ].join("\n");
}

export function renderControlledRuntimeStateModelSummary(summary: ControlledRuntimeStateModelSummary): string {
  return [
    "Controlled runtime state model summary:",
    `- field count: ${summary.totalFields}`,
    `- snapshot count: ${summary.totalSnapshots}`,
    `- transition count: ${summary.totalTransitions}`,
    `- blocked count: ${summary.blockedCount}`,
    `- preview-only count: ${summary.previewOnlyCount}`,
    `- persistence policies: ${renderRuntimeStatePersistencePolicyGroups(summary.persistencePolicyDistribution)}`,
    `- risk distribution: ${renderRuntimeStateRiskGroups(summary.riskDistribution)}`,
    `- completeness score: ${summary.completeness.score}`,
    `- completeness level: ${summary.completeness.level}`,
    `- completeness reason: ${summary.completeness.reason}`,
    `- read-only: ${String(summary.readonly)}`,
    `- preview-only: ${String(summary.previewOnly)}`,
    `- no-persistence: ${String(summary.noPersistence)}`,
    `- no-execution: ${String(summary.noExecution)}`,
    renderWarnings(summary.warnings),
    "Recommendations:",
    ...(summary.recommendations.length === 0 ? ["- none"] : summary.recommendations.map((recommendation) => `- ${recommendation}`))
  ].join("\n");
}

export function renderControlledRuntimeStateField(field: ControlledRuntimeStateField): string {
  return [
    `Controlled runtime state field: ${field.fieldId}`,
    `- category: ${field.category}`,
    `- title: ${field.title}`,
    `- description: ${field.description}`,
    `- status: ${field.status}`,
    `- persistencePolicy: ${field.persistencePolicy}`,
    `- visibility: ${field.visibility}`,
    `- riskLevel: ${field.riskLevel}`,
    `- allowedWriters: ${field.allowedWriters.join(", ")}`,
    `- allowedReaders: ${field.allowedReaders.join(", ")}`,
    `- blockedReason: ${field.blockedReason ?? "none"}`,
    `- read-only: ${String(field.readonly)}`,
    `- preview-only: ${String(field.previewOnly)}`,
    `- no-persistence: ${String(field.noPersistence)}`,
    `- no-execution: ${String(field.noExecution)}`,
    renderWarnings(field.warnings),
    "Recommendations:",
    ...(field.recommendations.length === 0 ? ["- none"] : field.recommendations.map((recommendation) => `- ${recommendation}`))
  ].join("\n");
}

export function renderControlledRuntimeStateSnapshot(snapshot: ControlledRuntimeStateSnapshot): string {
  return [
    `Controlled runtime state snapshot: ${snapshot.snapshotId}`,
    `- title: ${snapshot.title}`,
    `- category: ${snapshot.category}`,
    `- includedFields: ${snapshot.includedFields.join(", ")}`,
    `- snapshotPolicy: ${snapshot.snapshotPolicy}`,
    `- persistencePolicy: ${snapshot.persistencePolicy}`,
    `- read-only: ${String(snapshot.readonly)}`,
    `- preview-only: ${String(snapshot.previewOnly)}`,
    `- no-persistence: ${String(snapshot.noPersistence)}`,
    `- no-execution: ${String(snapshot.noExecution)}`
  ].join("\n");
}

export function renderControlledRuntimeStateTransition(transition: ControlledRuntimeStateTransition): string {
  return [
    `Controlled runtime state transition: ${transition.transitionId}`,
    `- fromState: ${transition.fromState}`,
    `- toState: ${transition.toState}`,
    `- trigger: ${transition.trigger}`,
    `- transitionPolicy: ${transition.transitionPolicy}`,
    `- read-only: ${String(transition.readonly)}`,
    `- preview-only: ${String(transition.previewOnly)}`,
    `- no-persistence: ${String(transition.noPersistence)}`,
    `- no-execution: ${String(transition.noExecution)}`
  ].join("\n");
}

export function renderControlledRuntimeStateModelPreview(preview: ControlledRuntimeStateModelPreview): string {
  const fields = preview.fields.length === 0 ? ["Controlled runtime state fields:", "- none"] : ["Controlled runtime state fields:", ...preview.fields.map(renderControlledRuntimeStateField)];
  const snapshots = preview.snapshots.length === 0 ? ["Controlled runtime state snapshots:", "- none"] : ["Controlled runtime state snapshots:", ...preview.snapshots.map(renderControlledRuntimeStateSnapshot)];
  const transitions = preview.transitions.length === 0 ? ["Controlled runtime state transitions:", "- none"] : ["Controlled runtime state transitions:", ...preview.transitions.map(renderControlledRuntimeStateTransition)];
  return [
    `Controlled runtime state model preview: ${preview.title}`,
    `- schemaVersion: ${preview.schemaVersion}`,
    `- readonly: ${String(preview.readonly)}`,
    `- previewOnly: ${String(preview.previewOnly)}`,
    `- stdoutOnly: ${String(preview.stdoutOnly)}`,
    `- stateModelPreviewOnly: ${String(preview.stateModelPreviewOnly)}`,
    `- runtimeExecutionAllowed: ${String(preview.runtimeExecutionAllowed)}`,
    `- runtimeActivationAllowed: ${String(preview.runtimeActivationAllowed)}`,
    `- runtimeRoutingAllowed: ${String(preview.runtimeRoutingAllowed)}`,
    `- runtimeOrchestrationAllowed: ${String(preview.runtimeOrchestrationAllowed)}`,
    `- runtimePersistenceAllowed: ${String(preview.runtimePersistenceAllowed)}`,
    `- statePersistenceAllowed: ${String(preview.statePersistenceAllowed)}`,
    `- flowExecutionAllowed: ${String(preview.flowExecutionAllowed)}`,
    `- projectGenerationEnabled: ${String(preview.projectGenerationEnabled)}`,
    `- builderAgentRuntimeEnabled: ${String(preview.builderAgentRuntimeEnabled)}`,
    `- agentExecutionAllowed: ${String(preview.agentExecutionAllowed)}`,
    `- approvalExecutionAllowed: ${String(preview.approvalExecutionAllowed)}`,
    `- mutationExecutionAllowed: ${String(preview.mutationExecutionAllowed)}`,
    `- inputExecutionAllowed: ${String(preview.inputExecutionAllowed)}`,
    `- outputExecutionAllowed: ${String(preview.outputExecutionAllowed)}`,
    `- contractExecutionAllowed: ${String(preview.contractExecutionAllowed)}`,
    `- fileWriteAllowed: ${String(preview.fileWriteAllowed)}`,
    `- fileCreationAllowed: ${String(preview.fileCreationAllowed)}`,
    `- dependencyInstallationAllowed: ${String(preview.dependencyInstallationAllowed)}`,
    `- packageMutationAllowed: ${String(preview.packageMutationAllowed)}`,
    `- generatedProjectValidationAllowed: ${String(preview.generatedProjectValidationAllowed)}`,
    `- policyEnforcementEnabled: ${String(preview.policyEnforcementEnabled)}`,
    `- governanceActivationAllowed: ${String(preview.governanceActivationAllowed)}`,
    "Notice: read-only, preview-only runtime state model only. No runtime persistence, no state persistence, no runtime execution, no runtime routing, no runtime orchestration, no runtime activation, no flow execution, no project generation, no builder-agent runtime, no agent execution, no approval execution, no mutation execution, no input execution, no output execution, no contract execution, no file writing, no file creation, no dependency installation, no package mutation, no generated-project validation, no policy enforcement, and no governance activation is enabled.",
    renderMetadata(preview.metadata),
    renderControlledRuntimeStateModelSummary(preview.summary),
    ...fields,
    ...snapshots,
    ...transitions
  ].join("\n");
}

export function renderControlledRuntimeEventModelSummary(summary: ControlledRuntimeEventModelSummary): string {
  return [
    "Controlled runtime event model summary:",
    `- event count: ${summary.totalEvents}`,
    `- payload field count: ${summary.totalPayloadFields}`,
    `- lifecycle marker count: ${summary.totalLifecycleMarkers}`,
    `- blocked count: ${summary.blockedCount}`,
    `- preview-only count: ${summary.previewOnlyCount}`,
    `- emission policies: ${renderRuntimeEventEmissionPolicyGroups(summary.emissionPolicyDistribution)}`,
    `- risk distribution: ${renderRuntimeEventRiskGroups(summary.riskDistribution)}`,
    `- completeness score: ${summary.completeness.score}`,
    `- completeness level: ${summary.completeness.level}`,
    `- completeness reason: ${summary.completeness.reason}`,
    `- read-only: ${String(summary.readonly)}`,
    `- preview-only: ${String(summary.previewOnly)}`,
    `- no-emission: ${String(summary.noEmission)}`,
    `- no-persistence: ${String(summary.noPersistence)}`,
    `- no-execution: ${String(summary.noExecution)}`,
    renderWarnings(summary.warnings),
    "Recommendations:",
    ...(summary.recommendations.length === 0 ? ["- none"] : summary.recommendations.map((recommendation) => `- ${recommendation}`))
  ].join("\n");
}

export function renderControlledRuntimeEventPayloadField(field: ControlledRuntimeEventPayloadField): string {
  return [
    `Controlled runtime event payload field: ${field.fieldId}`,
    `- title: ${field.title}`,
    `- description: ${field.description}`,
    `- fieldType: ${field.fieldType}`,
    `- required: ${String(field.required)}`,
    `- visibility: ${field.visibility}`,
    `- riskLevel: ${field.riskLevel}`,
    `- read-only: ${String(field.readonly)}`,
    `- preview-only: ${String(field.previewOnly)}`
  ].join("\n");
}

export function renderControlledRuntimeEventLifecycleMarker(marker: ControlledRuntimeEventLifecycleMarker): string {
  return [
    `Controlled runtime event lifecycle marker: ${marker.markerId}`,
    `- title: ${marker.title}`,
    `- description: ${marker.description}`,
    `- phase: ${marker.phase}`,
    `- markerPolicy: ${marker.markerPolicy}`,
    `- read-only: ${String(marker.readonly)}`,
    `- preview-only: ${String(marker.previewOnly)}`,
    `- no-emission: ${String(marker.noEmission)}`,
    `- no-execution: ${String(marker.noExecution)}`
  ].join("\n");
}

export function renderControlledRuntimeEventDefinition(event: ControlledRuntimeEventDefinition): string {
  return [
    `Controlled runtime event definition: ${event.eventId}`,
    `- category: ${event.category}`,
    `- title: ${event.title}`,
    `- description: ${event.description}`,
    `- emissionPolicy: ${event.emissionPolicy}`,
    `- riskLevel: ${event.riskLevel}`,
    `- status: ${event.status}`,
    `- blockedReason: ${event.blockedReason ?? "none"}`,
    `- payload fields: ${event.payloadFields.length}`,
    `- lifecycle markers: ${event.lifecycleMarkers.length}`,
    `- read-only: ${String(event.readonly)}`,
    `- preview-only: ${String(event.previewOnly)}`,
    `- no-emission: ${String(event.noEmission)}`,
    `- no-persistence: ${String(event.noPersistence)}`,
    `- no-execution: ${String(event.noExecution)}`,
    renderWarnings(event.warnings),
    "Recommendations:",
    ...(event.recommendations.length === 0 ? ["- none"] : event.recommendations.map((recommendation) => `- ${recommendation}`)),
    ...event.payloadFields.map(renderControlledRuntimeEventPayloadField),
    ...event.lifecycleMarkers.map(renderControlledRuntimeEventLifecycleMarker)
  ].join("\n");
}

export function renderControlledRuntimeEventModelPreview(preview: ControlledRuntimeEventModelPreview): string {
  const events = preview.events.length === 0 ? ["Controlled runtime event definitions:", "- none"] : ["Controlled runtime event definitions:", ...preview.events.map(renderControlledRuntimeEventDefinition)];
  return [
    `Controlled runtime event model preview: ${preview.title}`,
    `- schemaVersion: ${preview.schemaVersion}`,
    `- readonly: ${String(preview.readonly)}`,
    `- previewOnly: ${String(preview.previewOnly)}`,
    `- stdoutOnly: ${String(preview.stdoutOnly)}`,
    `- eventModelPreviewOnly: ${String(preview.eventModelPreviewOnly)}`,
    `- runtimeExecutionAllowed: ${String(preview.runtimeExecutionAllowed)}`,
    `- runtimePersistenceAllowed: ${String(preview.runtimePersistenceAllowed)}`,
    `- statePersistenceAllowed: ${String(preview.statePersistenceAllowed)}`,
    `- eventEmissionAllowed: ${String(preview.eventEmissionAllowed)}`,
    `- eventBusEnabled: ${String(preview.eventBusEnabled)}`,
    `- eventListenersEnabled: ${String(preview.eventListenersEnabled)}`,
    `- runtimeRoutingAllowed: ${String(preview.runtimeRoutingAllowed)}`,
    `- runtimeOrchestrationAllowed: ${String(preview.runtimeOrchestrationAllowed)}`,
    `- projectGenerationEnabled: ${String(preview.projectGenerationEnabled)}`,
    `- builderAgentRuntimeEnabled: ${String(preview.builderAgentRuntimeEnabled)}`,
    `- agentExecutionAllowed: ${String(preview.agentExecutionAllowed)}`,
    `- fileWriteAllowed: ${String(preview.fileWriteAllowed)}`,
    "Notice: read-only, preview-only runtime event model only. No event emission, no event bus, no event listeners, no runtime persistence, no state persistence, no runtime execution, no runtime routing, no runtime orchestration, no runtime activation, no project generation, no builder-agent runtime, no agent execution, no file writing, no dependency installation, no policy enforcement, and no governance activation is enabled.",
    renderMetadata(preview.metadata),
    renderControlledRuntimeEventModelSummary(preview.summary),
    ...events
  ].join("\n");
}

export function renderControlledRuntimeObservabilitySummary(summary: ControlledRuntimeObservabilitySummary): string {
  return [
    "Controlled runtime observability summary:",
    `- metric count: ${summary.totalMetrics}`,
    `- log count: ${summary.totalLogs}`,
    `- trace count: ${summary.totalTraces}`,
    `- health signal count: ${summary.totalHealthSignals}`,
    `- audit signal count: ${summary.totalAuditSignals}`,
    `- blocked count: ${summary.blockedCount}`,
    `- preview-only count: ${summary.previewOnlyCount}`,
    `- collection policies: ${renderRuntimeObservabilityCollectionPolicyGroups(summary.collectionPolicyDistribution)}`,
    `- risk distribution: ${renderRuntimeObservabilityRiskGroups(summary.riskDistribution)}`,
    `- completeness score: ${summary.completeness.score}`,
    `- completeness level: ${summary.completeness.level}`,
    `- completeness reason: ${summary.completeness.reason}`,
    `- read-only: ${String(summary.readonly)}`,
    `- preview-only: ${String(summary.previewOnly)}`,
    `- no-collection: ${String(summary.noCollection)}`,
    `- no-persistence: ${String(summary.noPersistence)}`,
    `- no-execution: ${String(summary.noExecution)}`,
    renderWarnings(summary.warnings),
    "Recommendations:",
    ...(summary.recommendations.length === 0 ? ["- none"] : summary.recommendations.map((recommendation) => `- ${recommendation}`))
  ].join("\n");
}

function renderControlledRuntimeObservabilitySignal(signal: ControlledRuntimeObservabilitySignal): string {
  return [
    `Controlled runtime observability signal: ${signal.signalId}`,
    `- category: ${signal.category}`,
    `- title: ${signal.title}`,
    `- description: ${signal.description}`,
    `- signalType: ${signal.signalType}`,
    `- collectionPolicy: ${signal.collectionPolicy}`,
    `- visibility: ${signal.visibility}`,
    `- riskLevel: ${signal.riskLevel}`,
    `- status: ${signal.status}`,
    `- blockedReason: ${signal.blockedReason ?? "none"}`,
    `- read-only: ${String(signal.readonly)}`,
    `- preview-only: ${String(signal.previewOnly)}`,
    `- no-collection: ${String(signal.noCollection)}`,
    `- no-persistence: ${String(signal.noPersistence)}`,
    `- no-execution: ${String(signal.noExecution)}`,
    renderWarnings(signal.warnings),
    "Recommendations:",
    ...(signal.recommendations.length === 0 ? ["- none"] : signal.recommendations.map((recommendation) => `- ${recommendation}`))
  ].join("\n");
}

export function renderControlledRuntimeMetricDefinition(signal: ControlledRuntimeMetricDefinition): string {
  return renderControlledRuntimeObservabilitySignal(signal);
}

export function renderControlledRuntimeLogDefinition(signal: ControlledRuntimeLogDefinition): string {
  return renderControlledRuntimeObservabilitySignal(signal);
}

export function renderControlledRuntimeTraceDefinition(signal: ControlledRuntimeTraceDefinition): string {
  return renderControlledRuntimeObservabilitySignal(signal);
}

export function renderControlledRuntimeHealthSignal(signal: ControlledRuntimeHealthSignal): string {
  return renderControlledRuntimeObservabilitySignal(signal);
}

export function renderControlledRuntimeAuditSignal(signal: ControlledRuntimeAuditSignal): string {
  return renderControlledRuntimeObservabilitySignal(signal);
}

export function renderControlledRuntimeObservabilityPreview(preview: ControlledRuntimeObservabilityPreview): string {
  return [
    `Controlled runtime observability preview: ${preview.title}`,
    `- schemaVersion: ${preview.schemaVersion}`,
    `- readonly: ${String(preview.readonly)}`,
    `- previewOnly: ${String(preview.previewOnly)}`,
    `- stdoutOnly: ${String(preview.stdoutOnly)}`,
    `- observabilityPreviewOnly: ${String(preview.observabilityPreviewOnly)}`,
    `- runtimeExecutionAllowed: ${String(preview.runtimeExecutionAllowed)}`,
    `- runtimePersistenceAllowed: ${String(preview.runtimePersistenceAllowed)}`,
    `- telemetryCollectionAllowed: ${String(preview.telemetryCollectionAllowed)}`,
    `- metricCollectionAllowed: ${String(preview.metricCollectionAllowed)}`,
    `- logWritingAllowed: ${String(preview.logWritingAllowed)}`,
    `- traceEmissionAllowed: ${String(preview.traceEmissionAllowed)}`,
    `- eventEmissionAllowed: ${String(preview.eventEmissionAllowed)}`,
    `- eventBusEnabled: ${String(preview.eventBusEnabled)}`,
    `- eventListenersEnabled: ${String(preview.eventListenersEnabled)}`,
    `- runtimeRoutingAllowed: ${String(preview.runtimeRoutingAllowed)}`,
    `- runtimeOrchestrationAllowed: ${String(preview.runtimeOrchestrationAllowed)}`,
    `- projectGenerationEnabled: ${String(preview.projectGenerationEnabled)}`,
    `- builderAgentRuntimeEnabled: ${String(preview.builderAgentRuntimeEnabled)}`,
    `- agentExecutionAllowed: ${String(preview.agentExecutionAllowed)}`,
    `- fileWriteAllowed: ${String(preview.fileWriteAllowed)}`,
    "Notice: read-only, preview-only runtime observability only. No telemetry collection, no metric collection, no log writing, no trace emission, no event emission, no event bus, no event listeners, no runtime persistence, no state persistence, no runtime execution, no runtime routing, no runtime orchestration, no runtime activation, no project generation, no builder-agent runtime, no agent execution, no file writing, no dependency installation, no policy enforcement, and no governance activation is enabled.",
    renderMetadata(preview.metadata),
    renderControlledRuntimeObservabilitySummary(preview.summary),
    "Controlled runtime metrics:",
    ...preview.metrics.map(renderControlledRuntimeMetricDefinition),
    "Controlled runtime logs:",
    ...preview.logs.map(renderControlledRuntimeLogDefinition),
    "Controlled runtime traces:",
    ...preview.traces.map(renderControlledRuntimeTraceDefinition),
    "Controlled runtime health signals:",
    ...preview.healthSignals.map(renderControlledRuntimeHealthSignal),
    "Controlled runtime audit signals:",
    ...preview.auditSignals.map(renderControlledRuntimeAuditSignal)
  ].join("\n");
}

function renderIndexGroups(groups: readonly { key: string; totalEntries: number }[]): string {
  if (groups.length === 0) return "none";
  return groups.map((group) => `${group.key}=${group.totalEntries}`).join(", ");
}

function renderCapabilityGroups(groups: readonly { key: string; totalCapabilities: number }[]): string {
  if (groups.length === 0) return "none";
  return groups.map((group) => `${group.key}=${group.totalCapabilities}`).join(", ");
}

function renderDependencyRiskGroups(groups: readonly { key: string; totalDependencies: number }[]): string {
  if (groups.length === 0) return "none";
  return groups.map((group) => `${group.key}=${group.totalDependencies}`).join(", ");
}

function renderValidationRiskGroups(groups: readonly { key: string; totalChecks: number }[]): string {
  if (groups.length === 0) return "none";
  return groups.map((group) => `${group.key}=${group.totalChecks}`).join(", ");
}

function renderApprovalRiskGroups(groups: readonly { key: string; totalGates: number }[]): string {
  if (groups.length === 0) return "none";
  return groups.map((group) => `${group.key}=${group.totalGates}`).join(", ");
}

function renderRiskSeverityGroups(groups: readonly { key: string; totalRisks: number }[]): string {
  if (groups.length === 0) return "none";
  return groups.map((group) => `${group.key}=${group.totalRisks}`).join(", ");
}

function renderAffectedPlanGroups(groups: readonly { key: string; totalRisks: number }[]): string {
  if (groups.length === 0) return "none";
  return groups.map((group) => `${group.key}=${group.totalRisks}`).join(", ");
}

function renderRollbackRiskGroups(groups: readonly { key: string; totalSteps: number }[]): string {
  if (groups.length === 0) return "none";
  return groups.map((group) => `${group.key}=${group.totalSteps}`).join(", ");
}

function renderRollbackAppliesToGroups(groups: readonly { key: string; totalSteps: number }[]): string {
  if (groups.length === 0) return "none";
  return groups.map((group) => `${group.key}=${group.totalSteps}`).join(", ");
}

function renderRuntimeComponentRiskGroups(groups: readonly { key: string; totalContracts: number }[]): string {
  if (groups.length === 0) return "none";
  return groups.map((group) => `${group.key}=${group.totalContracts}`).join(", ");
}

function renderRuntimeFlowRiskGroups(groups: readonly { key: string; totalSteps: number }[]): string {
  if (groups.length === 0) return "none";
  return groups.map((group) => `${group.key}=${group.totalSteps}`).join(", ");
}

function renderRuntimeFlowTransitionPolicyGroups(groups: readonly { key: string; totalTransitions: number }[]): string {
  if (groups.length === 0) return "none";
  return groups.map((group) => `${group.key}=${group.totalTransitions}`).join(", ");
}

function renderRuntimeStatePersistencePolicyGroups(groups: readonly { key: string; totalFields: number }[]): string {
  if (groups.length === 0) return "none";
  return groups.map((group) => `${group.key}=${group.totalFields}`).join(", ");
}

function renderRuntimeStateRiskGroups(groups: readonly { key: string; totalFields: number }[]): string {
  if (groups.length === 0) return "none";
  return groups.map((group) => `${group.key}=${group.totalFields}`).join(", ");
}

function renderRuntimeEventEmissionPolicyGroups(groups: readonly { key: string; totalEvents: number }[]): string {
  if (groups.length === 0) return "none";
  return groups.map((group) => `${group.key}=${group.totalEvents}`).join(", ");
}

function renderRuntimeEventRiskGroups(groups: readonly { key: string; totalEvents: number }[]): string {
  if (groups.length === 0) return "none";
  return groups.map((group) => `${group.key}=${group.totalEvents}`).join(", ");
}

function renderRuntimeObservabilityCollectionPolicyGroups(groups: readonly { key: string; totalSignals: number }[]): string {
  if (groups.length === 0) return "none";
  return groups.map((group) => `${group.key}=${group.totalSignals}`).join(", ");
}

function renderRuntimeObservabilityRiskGroups(groups: readonly { key: string; totalSignals: number }[]): string {
  if (groups.length === 0) return "none";
  return groups.map((group) => `${group.key}=${group.totalSignals}`).join(", ");
}

function renderInputFieldGroups(groups: readonly { key: string; totalFields: number }[]): string {
  if (groups.length === 0) return "none";
  return groups.map((group) => `${group.key}=${group.totalFields}`).join(", ");
}

function renderOutputFieldGroups(groups: readonly { key: string; totalFields: number }[]): string {
  if (groups.length === 0) return "none";
  return groups.map((group) => `${group.key}=${group.totalFields}`).join(", ");
}

function renderMutationBoundaryGroups(groups: readonly { key: string; totalBoundaries: number }[]): string {
  if (groups.length === 0) return "none";
  return groups.map((group) => `${group.key}=${group.totalBoundaries}`).join(", ");
}

function renderApprovalBoundaryGroups(groups: readonly { key: string; totalBoundaries: number }[]): string {
  if (groups.length === 0) return "none";
  return groups.map((group) => `${group.key}=${group.totalBoundaries}`).join(", ");
}

function renderRuntimeBoundaryGroups(groups: readonly { key: string; totalBoundaries: number }[]): string {
  if (groups.length === 0) return "none";
  return groups.map((group) => `${group.key}=${group.totalBoundaries}`).join(", ");
}
