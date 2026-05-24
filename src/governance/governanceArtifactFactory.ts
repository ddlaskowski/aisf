import type { GovernanceArtifact, GovernanceRecommendation } from "./governanceArtifact.js";
import type { GovernanceMetadata } from "./governanceMetadata.js";
import type { GovernanceArtifactType, GovernanceSeverity, GovernanceStatus } from "./governanceStatus.js";
import type { GovernanceReadonlyContract } from "./governanceReadonlyContract.js";
import { createReadonlyContract } from "./governanceReadonlyContract.js";
import { normalizeRecommendations, normalizeWarnings } from "./utils/governanceUtils.js";

export type GovernanceArtifactWithReadonlyContract = GovernanceArtifact & {
  readonlyContract: GovernanceReadonlyContract;
};

export type GovernanceArtifactInput = {
  artifactType: GovernanceArtifactType;
  status?: GovernanceStatus;
  severity?: GovernanceSeverity;
  summary: string;
  reason?: string;
  warnings?: readonly unknown[];
  recommendations?: readonly GovernanceRecommendation[];
  metadata: GovernanceMetadata;
};

export function createGovernanceMetadata(metadata: GovernanceMetadata): GovernanceMetadata {
  return {
    version: metadata.version,
    generatedAt: metadata.generatedAt,
    source: metadata.source,
    command: metadata.command,
    readonly: metadata.readonly,
    previewOnly: metadata.previewOnly
  };
}

export function createPreviewGovernanceArtifact(input: GovernanceArtifactInput): GovernanceArtifact {
  return {
    artifactType: input.artifactType,
    status: input.status ?? "preview",
    severity: input.severity,
    summary: input.summary,
    reason: input.reason,
    warnings: normalizeWarnings(input.warnings ?? []),
    recommendations: normalizeRecommendations(input.recommendations ?? []),
    metadata: createGovernanceMetadata(input.metadata)
  };
}

export function createReadonlyGovernanceArtifact(input: GovernanceArtifactInput & { readonlyReason?: string }): GovernanceArtifactWithReadonlyContract {
  return {
    ...createPreviewGovernanceArtifact({
      ...input,
      status: input.status ?? "readonly",
      metadata: createGovernanceMetadata({
        ...input.metadata,
        readonly: input.metadata.readonly ?? true,
        previewOnly: input.metadata.previewOnly ?? true
      })
    }),
    readonlyContract: createReadonlyContract(input.readonlyReason)
  };
}
