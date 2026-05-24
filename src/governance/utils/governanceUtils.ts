import type { GovernanceRecommendation } from "../governanceArtifact.js";
import {
  GOVERNANCE_RECOMMENDATION_TYPES,
  GOVERNANCE_SEVERITIES,
  GOVERNANCE_STATUSES,
  type GovernanceSeverity,
  type GovernanceStatus
} from "../governanceStatus.js";

export function normalizeGovernanceStatus(value: unknown, fallback: GovernanceStatus = "preview"): GovernanceStatus {
  return typeof value === "string" && GOVERNANCE_STATUSES.includes(value as GovernanceStatus) ? (value as GovernanceStatus) : fallback;
}

export function normalizeGovernanceSeverity(value: unknown, fallback: GovernanceSeverity = "info"): GovernanceSeverity {
  return typeof value === "string" && GOVERNANCE_SEVERITIES.includes(value as GovernanceSeverity) ? (value as GovernanceSeverity) : fallback;
}

export function sortDeterministically<T>(items: readonly T[], keyReader: (item: T) => string): T[] {
  return [...items].sort((a, b) => keyReader(a).localeCompare(keyReader(b)));
}

export function normalizeWarnings(warnings: readonly unknown[]): string[] {
  return sortDeterministically(
    warnings.filter((warning): warning is string => typeof warning === "string" && warning.trim().length > 0).map((warning) => warning.trim()),
    (warning) => warning
  );
}

export function normalizeRecommendations(recommendations: readonly GovernanceRecommendation[]): GovernanceRecommendation[] {
  return sortDeterministically(
    recommendations
      .filter((recommendation) => GOVERNANCE_RECOMMENDATION_TYPES.includes(recommendation.type) && recommendation.message.trim().length > 0)
      .map((recommendation) => ({
        ...recommendation,
        message: recommendation.message.trim(),
        severity: recommendation.severity === undefined ? undefined : normalizeGovernanceSeverity(recommendation.severity)
      })),
    (recommendation) => `${recommendation.type}:${recommendation.severity ?? ""}:${recommendation.message}`
  );
}

export function createReadonlyGuaranteeLabel(previewOnly = true): string {
  return previewOnly
    ? "Read-only preview: no governance activation, policy enforcement, runtime autonomy, or mutation behavior is enabled."
    : "Read-only governance artifact: no mutation behavior is enabled.";
}
