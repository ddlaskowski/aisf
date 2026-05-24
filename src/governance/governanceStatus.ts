export const GOVERNANCE_STATUSES = ["preview", "ready", "blocked", "warning", "manual-review", "disabled", "readonly"] as const;
export type GovernanceStatus = (typeof GOVERNANCE_STATUSES)[number];

export const GOVERNANCE_SEVERITIES = ["info", "warning", "high", "critical"] as const;
export type GovernanceSeverity = (typeof GOVERNANCE_SEVERITIES)[number];

export const GOVERNANCE_READINESS_VALUES = ["not-ready", "partial", "ready", "blocked"] as const;
export type GovernanceReadiness = (typeof GOVERNANCE_READINESS_VALUES)[number];

export const GOVERNANCE_RECOMMENDATION_TYPES = ["continue", "review", "block", "document", "maintain-preview-only"] as const;
export type GovernanceRecommendationType = (typeof GOVERNANCE_RECOMMENDATION_TYPES)[number];

export const GOVERNANCE_ARTIFACT_TYPES = ["preview", "report", "attestation", "manifest", "index", "archive", "catalog", "registry", "map", "timeline"] as const;
export type GovernanceArtifactType = (typeof GOVERNANCE_ARTIFACT_TYPES)[number];
