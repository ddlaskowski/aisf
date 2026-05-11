import type { GovernanceArchiveIndexEntry } from "./governanceArchiveIndex.js";
import type { GovernanceCiSummary } from "./governanceCiSummary.js";
import type { GovernanceEscalation } from "./governanceEscalation.js";
import type { GovernanceEvidenceIndexEntry } from "./governanceEvidenceIndex.js";
import type { GovernancePolicyRecommendation } from "./governancePolicyEnforcement.js";
import type { GovernanceStabilityScore } from "./governanceStabilityScore.js";

export type GovernanceControlPlaneStatus = "healthy" | "watch" | "attention-required" | "critical" | "unknown";

export type GovernanceControlPlane = {
  version: 1;
  status: GovernanceControlPlaneStatus;
  summary: string;
  currentState: {
    stabilityScore?: number;
    stabilityLevel?: string;
    escalationLevel?: string;
    requiresOperatorAttention?: boolean;
    recommendedPolicyMode?: string;
    autonomousOperationAllowed?: boolean;
    operatorApprovalRequired?: boolean;
    ciStatus?: string;
  };
  latestArchive?: {
    archiveId: string;
    createdAt?: string;
    kind?: string;
  };
  latestEvidencePack?: {
    evidencePackId: string;
    generatedAt?: string;
    policyMode?: string;
    escalationLevel?: string;
  };
  recommendedNextCommands: string[];
  warnings: string[];
  generatedAt: string;
};

const UNKNOWN_GENERATED_AT = "1970-01-01T00:00:00.000Z";

function summaryFor(status: GovernanceControlPlaneStatus): string {
  if (status === "healthy") return "Governance control plane reports healthy autonomous operation.";
  if (status === "watch") return "Governance control plane reports watch-level conditions.";
  if (status === "attention-required") return "Governance control plane requires operator attention.";
  if (status === "critical") return "Governance control plane reports critical governance conditions.";
  return "Governance control plane could not determine complete governance state.";
}

function commandsFor(status: GovernanceControlPlaneStatus): string[] {
  if (status === "healthy") return ["node dist/cli.js runs", "node dist/cli.js insights"];
  if (status === "watch") return ["node dist/cli.js stability", "node dist/cli.js escalation", "node dist/cli.js policy"];
  if (status === "attention-required") return ["node dist/cli.js drift", "node dist/cli.js decision-matrix", "node dist/cli.js evidence-pack"];
  if (status === "critical") {
    return [
      "node dist/cli.js escalation",
      "node dist/cli.js policy",
      "node dist/cli.js decision-matrix",
      "node dist/cli.js evidence-pack"
    ];
  }
  return ["node dist/cli.js runs", "node dist/cli.js archive", "node dist/cli.js evidence-list"];
}

function determineStatus(input: {
  currentState: GovernanceControlPlane["currentState"];
  missingArchiveIndex?: boolean;
  missingEvidenceIndex?: boolean;
}): GovernanceControlPlaneStatus {
  const state = input.currentState;
  if (
    state.escalationLevel === "critical" ||
    state.recommendedPolicyMode === "manual-review-only" ||
    state.ciStatus === "fail"
  ) {
    return "critical";
  }
  if (input.missingArchiveIndex || input.missingEvidenceIndex) {
    return "unknown";
  }
  if (
    state.escalationLevel === "high-risk" ||
    state.recommendedPolicyMode === "restricted" ||
    state.operatorApprovalRequired === true ||
    state.stabilityLevel === "unstable"
  ) {
    return "attention-required";
  }
  if (
    state.escalationLevel === "warning" ||
    state.recommendedPolicyMode === "conservative" ||
    state.stabilityLevel === "caution" ||
    state.ciStatus === "warn"
  ) {
    return "watch";
  }
  if (
    state.stabilityLevel === "stable" &&
    state.escalationLevel === "none" &&
    state.recommendedPolicyMode === "normal" &&
    state.ciStatus === "pass"
  ) {
    return "healthy";
  }
  return "unknown";
}

function buildWarnings(input: {
  currentState: GovernanceControlPlane["currentState"];
  missingArchiveIndex?: boolean;
  missingEvidenceIndex?: boolean;
}): string[] {
  const warnings: string[] = [];
  if (input.missingArchiveIndex) warnings.push("No governance archive index found.");
  if (input.missingEvidenceIndex) warnings.push("No governance evidence index found.");
  if (input.currentState.ciStatus === "fail") warnings.push("CI governance summary is failing.");
  if (input.currentState.operatorApprovalRequired === true) warnings.push("Operator approval is required by current policy recommendation.");
  if (input.currentState.autonomousOperationAllowed === false) warnings.push("Autonomous operation is not currently recommended.");
  return warnings;
}

export function buildGovernanceControlPlane(input: {
  stability?: GovernanceStabilityScore;
  escalation?: GovernanceEscalation;
  policy?: GovernancePolicyRecommendation;
  ciSummary?: GovernanceCiSummary;
  latestArchive?: GovernanceArchiveIndexEntry;
  latestEvidencePack?: GovernanceEvidenceIndexEntry;
  missingArchiveIndex?: boolean;
  missingEvidenceIndex?: boolean;
  generatedAt?: string;
}): GovernanceControlPlane {
  const currentState: GovernanceControlPlane["currentState"] = {
    stabilityScore: input.stability?.score,
    stabilityLevel: input.stability?.level,
    escalationLevel: input.escalation?.escalationLevel,
    requiresOperatorAttention: input.escalation?.requiresOperatorAttention,
    recommendedPolicyMode: input.policy?.recommendedPolicyMode,
    autonomousOperationAllowed: input.policy?.autonomousOperationAllowed,
    operatorApprovalRequired: input.policy?.operatorApprovalRequired,
    ciStatus: input.ciSummary?.status
  };
  const status = determineStatus({
    currentState,
    missingArchiveIndex: input.missingArchiveIndex,
    missingEvidenceIndex: input.missingEvidenceIndex
  });

  return {
    version: 1,
    status,
    summary: summaryFor(status),
    currentState,
    latestArchive: input.latestArchive
      ? {
          archiveId: input.latestArchive.archiveId,
          createdAt: input.latestArchive.createdAt,
          kind: input.latestArchive.kind
        }
      : undefined,
    latestEvidencePack: input.latestEvidencePack
      ? {
          evidencePackId: input.latestEvidencePack.evidencePackId,
          generatedAt: input.latestEvidencePack.generatedAt,
          policyMode: input.latestEvidencePack.policyMode,
          escalationLevel: input.latestEvidencePack.escalationLevel
        }
      : undefined,
    recommendedNextCommands: commandsFor(status),
    warnings: buildWarnings({
      currentState,
      missingArchiveIndex: input.missingArchiveIndex,
      missingEvidenceIndex: input.missingEvidenceIndex
    }),
    generatedAt: input.generatedAt ?? input.policy?.generatedAt ?? input.escalation?.generatedAt ?? input.stability?.generatedAt ?? UNKNOWN_GENERATED_AT
  };
}

function formatValue(value: unknown): string {
  if (value === undefined || value === null || value === "") return "unknown";
  return String(value);
}

export function renderGovernanceControlPlaneMarkdown(controlPlane: GovernanceControlPlane): string {
  const lines = [
    "# AI Software Factory - Governance Control Plane",
    "",
    "Status:",
    controlPlane.status,
    "",
    "Summary:",
    controlPlane.summary,
    "",
    "## Current State",
    "",
    `- stability score: ${formatValue(controlPlane.currentState.stabilityScore)}`,
    `- stability level: ${formatValue(controlPlane.currentState.stabilityLevel)}`,
    `- escalation level: ${formatValue(controlPlane.currentState.escalationLevel)}`,
    `- requires operator attention: ${formatValue(controlPlane.currentState.requiresOperatorAttention)}`,
    `- recommended policy mode: ${formatValue(controlPlane.currentState.recommendedPolicyMode)}`,
    `- autonomous operation allowed: ${formatValue(controlPlane.currentState.autonomousOperationAllowed)}`,
    `- operator approval required: ${formatValue(controlPlane.currentState.operatorApprovalRequired)}`,
    `- CI status: ${formatValue(controlPlane.currentState.ciStatus)}`,
    "",
    "## Latest Archive Snapshot",
    ""
  ];

  if (controlPlane.latestArchive) {
    lines.push(`- archive ID: ${controlPlane.latestArchive.archiveId}`);
    lines.push(`- kind: ${formatValue(controlPlane.latestArchive.kind)}`);
  } else {
    lines.push("- none");
  }

  lines.push("", "## Latest Evidence Pack", "");
  if (controlPlane.latestEvidencePack) {
    lines.push(`- evidence pack ID: ${controlPlane.latestEvidencePack.evidencePackId}`);
    lines.push(`- policy mode: ${formatValue(controlPlane.latestEvidencePack.policyMode)}`);
    lines.push(`- escalation level: ${formatValue(controlPlane.latestEvidencePack.escalationLevel)}`);
  } else {
    lines.push("- none");
  }

  lines.push("", "## Warnings", "");
  if (controlPlane.warnings.length === 0) {
    lines.push("- none");
  } else {
    for (const warning of controlPlane.warnings) lines.push(`- ${warning}`);
  }

  lines.push("", "## Recommended Next Commands", "");
  for (const command of controlPlane.recommendedNextCommands) {
    lines.push(`- ${command}`);
  }

  return `${lines.join("\n")}\n`;
}

export function renderGovernanceControlPlaneText(controlPlane: GovernanceControlPlane): string {
  return renderGovernanceControlPlaneMarkdown(controlPlane);
}
