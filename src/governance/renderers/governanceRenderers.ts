import type { GovernanceRecommendation } from "../governanceArtifact.js";
import type { GovernanceArtifact } from "../governanceArtifact.js";
import type { GovernanceArtifactRegistry, GovernanceArtifactRegistrySummary } from "../governanceArtifactRegistry.js";
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
