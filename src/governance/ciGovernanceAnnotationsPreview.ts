import fs from "fs-extra";
import path from "node:path";

import {
  buildGovernanceAttestation,
  type GovernanceAttestation
} from "./governanceAttestation.js";

export type GovernanceCiAnnotation = {
  id: string;
  level: "notice" | "warning" | "failure";
  category:
    | "governance-status"
    | "maturity"
    | "safety-invariant"
    | "blocked-capability"
    | "profile"
    | "repository"
    | "policy-runtime"
    | "ci-preview";
  title: string;
  message: string;
  previewOnly: true;
  enforced: false;
  buildBlocking: false;
};

export type GovernanceCiAnnotationsPreview = {
  schemaVersion: 1;
  previewStatus: "not-created" | "created" | "blocked";
  sourceAttestationStatus: "not-created" | "created" | "blocked";
  ciConclusion: "pass-preview" | "warning-preview" | "blocked-preview";
  ciAnnotationsApplied: false;
  ciEnforced: false;
  buildFailedByGovernance: false;
  attestationApplied: false;
  attestationEnforced: false;
  classificationApplied: false;
  boundariesEnforced: false;
  profileApplied: false;
  applied: false;
  enforced: false;
  policyRuntimeMode: "preview-only";
  runtimeBehaviorChanged: false;
  governanceDecisionsChanged: false;
  repairOrchestrationChanged: false;
  safePatchEngineOnly: true;
  autonomyEnabled: false;
  annotations: GovernanceCiAnnotation[];
  summary: {
    governanceMaturityLevel: string | null;
    stableGovernanceChain: boolean;
    repositoryCategory: string | null;
    recommendedProfile: string | null;
    blockedCapabilityCount: number;
    warningCount: number;
    invariantFailureCount: number;
  };
  warnings: string[];
  recommendedNextStage:
    | "continue-preview-only"
    | "prepare-github-pr-summary"
    | "blocked";
};

const ARTIFACT_JSON_PATH = ".factory/governance/ci-governance-annotations-preview.json";
const ARTIFACT_MARKDOWN_PATH = ".factory/governance/ci-governance-annotations-preview.md";

function annotation(
  idNumber: number,
  level: GovernanceCiAnnotation["level"],
  category: GovernanceCiAnnotation["category"],
  title: string,
  message: string
): GovernanceCiAnnotation {
  return {
    id: `gov-ci-${String(idNumber).padStart(3, "0")}`,
    level,
    category,
    title,
    message,
    previewOnly: true,
    enforced: false,
    buildBlocking: false
  };
}

function annotationLevelForStatus(status: GovernanceAttestation["attestationStatus"]): GovernanceCiAnnotation["level"] {
  if (status === "blocked") {
    return "failure";
  }
  if (status === "not-created") {
    return "warning";
  }
  return "notice";
}

function buildAnnotations(attestation: GovernanceAttestation): GovernanceCiAnnotation[] {
  const annotations: GovernanceCiAnnotation[] = [];
  const add = (
    level: GovernanceCiAnnotation["level"],
    category: GovernanceCiAnnotation["category"],
    title: string,
    message: string
  ) => {
    annotations.push(annotation(annotations.length + 1, level, category, title, message));
  };

  add(
    annotationLevelForStatus(attestation.attestationStatus),
    "governance-status",
    "Governance attestation status",
    `Governance attestation status is ${attestation.attestationStatus}.`
  );
  add(
    "notice",
    "maturity",
    "Governance maturity level",
    `Governance maturity level is ${attestation.governanceMaturity.level}.`
  );
  add(
    attestation.governanceMaturity.stableGovernanceChain ? "notice" : "warning",
    "maturity",
    "Stable governance chain",
    `Stable governance chain is ${attestation.governanceMaturity.stableGovernanceChain}.`
  );
  add(
    attestation.governanceSummary.repositoryCategory === null ? "warning" : "notice",
    "repository",
    "Repository category",
    `Repository category is ${attestation.governanceSummary.repositoryCategory ?? "unknown"}.`
  );
  add(
    attestation.governanceSummary.recommendedProfile === null ? "warning" : "notice",
    "profile",
    "Recommended governance profile",
    `Recommended governance profile is ${attestation.governanceSummary.recommendedProfile ?? "none"}.`
  );
  add(
    "notice",
    "policy-runtime",
    "Policy runtime mode",
    `Policy runtime mode is ${attestation.policyRuntimeMode}.`
  );

  for (const invariant of attestation.attestedSafetyInvariants) {
    add(
      invariant.preserved ? "notice" : "failure",
      "safety-invariant",
      `Safety invariant ${invariant.key}`,
      invariant.reason
    );
  }

  for (const blocked of attestation.blockedCapabilities) {
    add(
      "notice",
      "blocked-capability",
      `Blocked capability ${blocked.key}`,
      blocked.reason
    );
  }

  for (const warning of attestation.warnings) {
    add(
      attestation.attestationStatus === "blocked" ? "failure" : "warning",
      "ci-preview",
      "Governance preview warning",
      warning
    );
  }

  return annotations;
}

function conclusionFor(
  attestation: GovernanceAttestation,
  invariantFailureCount: number
): GovernanceCiAnnotationsPreview["ciConclusion"] {
  if (attestation.attestationStatus === "blocked" || invariantFailureCount > 0) {
    return "blocked-preview";
  }
  if (attestation.attestationStatus === "not-created") {
    return "warning-preview";
  }
  return "pass-preview";
}

function previewStatusFor(attestationStatus: GovernanceAttestation["attestationStatus"]): GovernanceCiAnnotationsPreview["previewStatus"] {
  if (attestationStatus === "blocked") {
    return "blocked";
  }
  if (attestationStatus === "created") {
    return "created";
  }
  return "not-created";
}

function warningsFor(attestation: GovernanceAttestation, ciConclusion: GovernanceCiAnnotationsPreview["ciConclusion"]): string[] {
  const warnings = [
    "CI governance annotations are preview-only.",
    "No build was failed by governance.",
    "No CI enforcement occurred.",
    "No governance was enforced.",
    "Runtime behavior did not change.",
    "Governance decisions did not change.",
    "Repair orchestration did not change."
  ];
  if (attestation.attestationStatus === "not-created") {
    warnings.unshift("Governance attestation is not created; CI annotations are incomplete.");
  }
  if (ciConclusion === "blocked-preview") {
    warnings.unshift("Governance attestation is blocked or an invariant failed; CI conclusion is blocked-preview only.");
  }
  return warnings;
}

export function buildGovernanceCiAnnotationsPreviewFromAttestation(
  attestation: GovernanceAttestation
): GovernanceCiAnnotationsPreview {
  const annotations = buildAnnotations(attestation);
  const invariantFailureCount = attestation.attestedSafetyInvariants.filter((invariant) => !invariant.preserved).length;
  const warningCount = annotations.filter((item) => item.level === "warning").length;
  const ciConclusion = conclusionFor(attestation, invariantFailureCount);
  const previewStatus = previewStatusFor(attestation.attestationStatus);
  const recommendedNextStage: GovernanceCiAnnotationsPreview["recommendedNextStage"] =
    previewStatus === "blocked"
      ? "blocked"
      : previewStatus === "created" && ciConclusion === "pass-preview"
        ? "prepare-github-pr-summary"
        : "continue-preview-only";

  return {
    schemaVersion: 1,
    previewStatus,
    sourceAttestationStatus: attestation.attestationStatus,
    ciConclusion,
    ciAnnotationsApplied: false,
    ciEnforced: false,
    buildFailedByGovernance: false,
    attestationApplied: false,
    attestationEnforced: false,
    classificationApplied: false,
    boundariesEnforced: false,
    profileApplied: false,
    applied: false,
    enforced: false,
    policyRuntimeMode: "preview-only",
    runtimeBehaviorChanged: false,
    governanceDecisionsChanged: false,
    repairOrchestrationChanged: false,
    safePatchEngineOnly: true,
    autonomyEnabled: false,
    annotations,
    summary: {
      governanceMaturityLevel: attestation.governanceMaturity.level,
      stableGovernanceChain: attestation.governanceMaturity.stableGovernanceChain,
      repositoryCategory: attestation.governanceSummary.repositoryCategory,
      recommendedProfile: attestation.governanceSummary.recommendedProfile,
      blockedCapabilityCount: attestation.blockedCapabilities.length,
      warningCount,
      invariantFailureCount
    },
    warnings: warningsFor(attestation, ciConclusion),
    recommendedNextStage
  };
}

export function buildGovernanceCiAnnotationsPreview(projectRoot: string): GovernanceCiAnnotationsPreview {
  return buildGovernanceCiAnnotationsPreviewFromAttestation(buildGovernanceAttestation(projectRoot));
}

export function writeGovernanceCiAnnotationsPreviewArtifacts(
  projectRoot: string,
  preview: GovernanceCiAnnotationsPreview
): { jsonPath: string; markdownPath: string } {
  const jsonPath = path.join(projectRoot, ARTIFACT_JSON_PATH);
  const markdownPath = path.join(projectRoot, ARTIFACT_MARKDOWN_PATH);
  fs.ensureDirSync(path.dirname(jsonPath));
  fs.writeFileSync(jsonPath, `${JSON.stringify(preview, null, 2)}\n`, "utf8");
  fs.writeFileSync(markdownPath, renderGovernanceCiAnnotationsPreviewText(preview), "utf8");
  return {
    jsonPath: ARTIFACT_JSON_PATH,
    markdownPath: ARTIFACT_MARKDOWN_PATH
  };
}

function countByLevel(preview: GovernanceCiAnnotationsPreview, level: GovernanceCiAnnotation["level"]): number {
  return preview.annotations.filter((annotationItem) => annotationItem.level === level).length;
}

export function renderGovernanceCiAnnotationsPreviewText(preview: GovernanceCiAnnotationsPreview): string {
  const lines = [
    "# AI Software Factory - CI Governance Annotations Preview",
    "",
    "Preview status:",
    preview.previewStatus,
    "",
    "Source attestation status:",
    preview.sourceAttestationStatus,
    "",
    "CI conclusion:",
    preview.ciConclusion,
    "",
    "CI annotations applied:",
    String(preview.ciAnnotationsApplied),
    "",
    "CI enforced:",
    String(preview.ciEnforced),
    "",
    "Build failed by governance:",
    String(preview.buildFailedByGovernance),
    "",
    "Governance maturity level:",
    preview.summary.governanceMaturityLevel ?? "-",
    "",
    "Stable governance chain:",
    String(preview.summary.stableGovernanceChain),
    "",
    "Repository category:",
    preview.summary.repositoryCategory ?? "-",
    "",
    "Recommended profile:",
    preview.summary.recommendedProfile ?? "-",
    "",
    "Notice annotations:",
    String(countByLevel(preview, "notice")),
    "",
    "Warning annotations:",
    String(countByLevel(preview, "warning")),
    "",
    "Failure annotations:",
    String(countByLevel(preview, "failure")),
    "",
    "Invariant failure count:",
    String(preview.summary.invariantFailureCount),
    "",
    "Blocked capability count:",
    String(preview.summary.blockedCapabilityCount),
    "",
    "Applied:",
    String(preview.applied),
    "",
    "Enforced:",
    String(preview.enforced),
    "",
    "Runtime behavior changed:",
    String(preview.runtimeBehaviorChanged),
    "",
    "Governance decisions changed:",
    String(preview.governanceDecisionsChanged),
    "",
    "Repair orchestration changed:",
    String(preview.repairOrchestrationChanged),
    "",
    "Safe Patch Engine only:",
    String(preview.safePatchEngineOnly),
    "",
    "Autonomy enabled:",
    String(preview.autonomyEnabled),
    "",
    "Recommended next stage:",
    preview.recommendedNextStage,
    "",
    "## Annotations",
    ""
  ];

  for (const item of preview.annotations) {
    lines.push(`- [${item.level}] ${item.id} ${item.category}: ${item.title} - ${item.message}`);
  }

  lines.push("", "## Warnings", "");
  for (const warning of preview.warnings) {
    lines.push(`- ${warning}`);
  }

  return `${lines.join("\n")}\n`;
}
