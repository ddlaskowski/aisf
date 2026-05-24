import type { GovernanceMetadata } from "./governanceMetadata.js";
import type { GovernanceArtifactType, GovernanceRecommendationType, GovernanceSeverity, GovernanceStatus } from "./governanceStatus.js";

export interface GovernanceRecommendation {
  type: GovernanceRecommendationType;
  message: string;
  severity?: GovernanceSeverity;
}

export interface GovernanceArtifact {
  artifactType: GovernanceArtifactType;
  status: GovernanceStatus;
  severity?: GovernanceSeverity;
  summary: string;
  reason?: string;
  warnings: string[];
  recommendations: GovernanceRecommendation[];
  metadata: GovernanceMetadata;
}
