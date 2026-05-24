import type { GovernanceRecommendation } from "../governanceArtifact.js";
import type { GovernanceArtifact } from "../governanceArtifact.js";
import type { GovernanceArtifactDiscoveryResults, GovernanceArtifactIndex, GovernanceArtifactIndexSummary } from "../governanceArtifactIndex.js";
import type { GovernanceArtifactExportContract, GovernanceArtifactExportPayload } from "../governanceArtifactExport.js";
import type { GovernanceArtifactQueryResult, GovernanceArtifactQuerySummary } from "../governanceArtifactQuery.js";
import type { GovernanceArtifactRegistry, GovernanceArtifactRegistrySummary } from "../governanceArtifactRegistry.js";
import type { GovernanceArtifactReviewPack, GovernanceArtifactReviewPackSection, GovernanceArtifactReviewPackSummary } from "../governanceArtifactReviewPack.js";
import type { GovernanceArtifactSnapshot, GovernanceArtifactSnapshotSection, GovernanceArtifactSnapshotSummary } from "../governanceArtifactSnapshot.js";
import type { GovernanceConsolidationAudit, GovernanceConsolidationAuditSection, GovernanceConsolidationAuditSummary } from "../governanceConsolidationAudit.js";
import type { GovernanceMetadata } from "../governanceMetadata.js";
import type { GovernanceReadonlyContract } from "../governanceReadonlyContract.js";
import { renderReadonlyContract } from "../governanceReadonlyContract.js";
import type { GovernanceSeverity, GovernanceStatus } from "../governanceStatus.js";
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

function renderIndexGroups(groups: readonly { key: string; totalEntries: number }[]): string {
  if (groups.length === 0) return "none";
  return groups.map((group) => `${group.key}=${group.totalEntries}`).join(", ");
}
