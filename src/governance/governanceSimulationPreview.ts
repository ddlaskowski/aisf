import fs from "fs-extra";
import path from "node:path";

import {
  buildGovernanceExceptionReviewPreview,
  type GovernanceExceptionReviewPreview
} from "./governanceExceptionReviewPreview.js";

export type GovernanceSimulationScenario = {
  id: string;
  name: string;
  source:
    | "exception-review-preview"
    | "ci-annotations-preview"
    | "github-pr-summary-preview"
    | "governance-attestation"
    | "repo-classification-preview"
    | "policy-runtime-preview"
    | "derived";
  simulatedDecision: "would-pass" | "would-warn" | "would-block";
  severity: "info" | "warning" | "blocking";
  reason: string;
  previewOnly: true;
  applied: false;
  enforced: false;
};

export type GovernanceSimulationPreview = {
  schemaVersion: 1;
  previewStatus: "not-created" | "created" | "blocked";
  sourceExceptionReviewStatus: "not-created" | "created" | "blocked";
  simulationConclusion:
    | "pass-preview"
    | "warning-preview"
    | "blocked-preview"
    | "source-missing";
  simulationApplied: false;
  simulationEnforced: false;
  simulationChangedOutcome: false;
  exceptionApproved: false;
  exceptionApplied: false;
  governanceBypassAllowed: false;
  exceptionEnforced: false;
  ciEnforced: false;
  buildFailedByGovernance: false;
  githubPublished: false;
  prCommentCreated: false;
  githubApiCalled: false;
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
  scenarios: GovernanceSimulationScenario[];
  simulatedOutcomeSummary: {
    totalScenarios: number;
    simulatedPasses: number;
    simulatedWarnings: number;
    simulatedBlocks: number;
    nonReviewableBlockers: number;
    reviewableWarnings: number;
  };
  warnings: string[];
  recommendedNextStage:
    | "continue-preview-only"
    | "prepare-guarded-policy-activation-candidates"
    | "blocked";
};

const ARTIFACT_JSON_PATH = ".factory/governance/governance-simulation-preview.json";
const ARTIFACT_MARKDOWN_PATH = ".factory/governance/governance-simulation-preview.md";

const DECISION_ORDER: Record<GovernanceSimulationScenario["simulatedDecision"], number> = {
  "would-block": 0,
  "would-warn": 1,
  "would-pass": 2
};

function scenario(
  name: string,
  source: GovernanceSimulationScenario["source"],
  simulatedDecision: GovernanceSimulationScenario["simulatedDecision"],
  severity: GovernanceSimulationScenario["severity"],
  reason: string
): Omit<GovernanceSimulationScenario, "id"> {
  return {
    name,
    source,
    simulatedDecision,
    severity,
    reason,
    previewOnly: true,
    applied: false,
    enforced: false
  };
}

function scenarioFromExceptionCandidate(
  candidate: GovernanceExceptionReviewPreview["exceptionCandidates"][number]
): Omit<GovernanceSimulationScenario, "id"> {
  const simulatedDecision = candidate.severity === "blocking"
    ? "would-block"
    : candidate.severity === "warning"
      ? "would-warn"
      : "would-pass";
  return scenario(
    `Exception candidate ${candidate.id}`,
    "exception-review-preview",
    simulatedDecision,
    candidate.severity,
    `${candidate.title}: ${candidate.reason}`
  );
}

function collectScenarios(exceptionReview: GovernanceExceptionReviewPreview): GovernanceSimulationScenario[] {
  const raw: Array<Omit<GovernanceSimulationScenario, "id">> = [
    scenario(
      "Exception review source status",
      "exception-review-preview",
      exceptionReview.previewStatus === "blocked"
        ? "would-block"
        : exceptionReview.previewStatus === "not-created"
          ? "would-warn"
          : "would-pass",
      exceptionReview.previewStatus === "blocked"
        ? "blocking"
        : exceptionReview.previewStatus === "not-created"
          ? "warning"
          : "info",
      `Exception review preview status is ${exceptionReview.previewStatus}.`
    ),
    scenario(
      "Exception review conclusion",
      "exception-review-preview",
      exceptionReview.exceptionReviewConclusion === "blocked-non-reviewable"
        ? "would-block"
        : exceptionReview.exceptionReviewConclusion === "source-missing" || exceptionReview.exceptionReviewConclusion === "review-needed"
          ? "would-warn"
          : "would-pass",
      exceptionReview.exceptionReviewConclusion === "blocked-non-reviewable"
        ? "blocking"
        : exceptionReview.exceptionReviewConclusion === "source-missing" || exceptionReview.exceptionReviewConclusion === "review-needed"
          ? "warning"
          : "info",
      `Exception review conclusion is ${exceptionReview.exceptionReviewConclusion}.`
    ),
    scenario(
      "Policy runtime mode",
      "policy-runtime-preview",
      exceptionReview.policyRuntimeMode === "preview-only" ? "would-pass" : "would-block",
      exceptionReview.policyRuntimeMode === "preview-only" ? "info" : "blocking",
      `Policy runtime mode is ${exceptionReview.policyRuntimeMode}.`
    ),
    scenario(
      "Profile application status",
      "repo-classification-preview",
      exceptionReview.profileApplied === false ? "would-pass" : "would-block",
      exceptionReview.profileApplied === false ? "info" : "blocking",
      "Profiles remain unapplied in simulation preview."
    ),
    scenario(
      "Runtime behavior invariant",
      "derived",
      exceptionReview.runtimeBehaviorChanged === false ? "would-pass" : "would-block",
      exceptionReview.runtimeBehaviorChanged === false ? "info" : "blocking",
      "Runtime behavior did not change."
    ),
    scenario(
      "Repair orchestration invariant",
      "derived",
      exceptionReview.repairOrchestrationChanged === false ? "would-pass" : "would-block",
      exceptionReview.repairOrchestrationChanged === false ? "info" : "blocking",
      "Repair orchestration did not change."
    ),
    scenario(
      "Safe Patch Engine invariant",
      "derived",
      exceptionReview.safePatchEngineOnly === true ? "would-pass" : "would-block",
      exceptionReview.safePatchEngineOnly === true ? "info" : "blocking",
      "Safe Patch Engine remains the only mutation layer."
    ),
    scenario(
      "Autonomy disabled invariant",
      "derived",
      exceptionReview.autonomyEnabled === false ? "would-pass" : "would-block",
      exceptionReview.autonomyEnabled === false ? "info" : "blocking",
      "Autonomy remains disabled."
    ),
    scenario(
      "Reviewable exception candidates",
      "exception-review-preview",
      exceptionReview.summary.reviewableCandidates > 0 ? "would-warn" : "would-pass",
      exceptionReview.summary.reviewableCandidates > 0 ? "warning" : "info",
      `Reviewable exception candidates: ${exceptionReview.summary.reviewableCandidates}.`
    ),
    scenario(
      "Non-reviewable exception candidates",
      "exception-review-preview",
      exceptionReview.summary.nonReviewableCandidates > 0 ? "would-block" : "would-pass",
      exceptionReview.summary.nonReviewableCandidates > 0 ? "blocking" : "info",
      `Non-reviewable exception candidates: ${exceptionReview.summary.nonReviewableCandidates}.`
    )
  ];

  for (const candidate of exceptionReview.exceptionCandidates) {
    raw.push(scenarioFromExceptionCandidate(candidate));
  }

  const sorted = raw.sort((a, b) => {
    const decision = DECISION_ORDER[a.simulatedDecision] - DECISION_ORDER[b.simulatedDecision];
    if (decision !== 0) return decision;
    const source = a.source.localeCompare(b.source);
    if (source !== 0) return source;
    return a.name.localeCompare(b.name);
  });

  return sorted.map((item, index) => ({
    id: `gov-simulation-${String(index + 1).padStart(3, "0")}`,
    ...item
  }));
}

function buildSummary(
  exceptionReview: GovernanceExceptionReviewPreview,
  scenarios: GovernanceSimulationScenario[]
): GovernanceSimulationPreview["simulatedOutcomeSummary"] {
  return {
    totalScenarios: scenarios.length,
    simulatedPasses: scenarios.filter((item) => item.simulatedDecision === "would-pass").length,
    simulatedWarnings: scenarios.filter((item) => item.simulatedDecision === "would-warn").length,
    simulatedBlocks: scenarios.filter((item) => item.simulatedDecision === "would-block").length,
    nonReviewableBlockers: exceptionReview.summary.nonReviewableCandidates,
    reviewableWarnings: exceptionReview.summary.reviewableCandidates
  };
}

function conclusionFor(
  exceptionReview: GovernanceExceptionReviewPreview,
  summary: GovernanceSimulationPreview["simulatedOutcomeSummary"]
): {
  previewStatus: GovernanceSimulationPreview["previewStatus"];
  simulationConclusion: GovernanceSimulationPreview["simulationConclusion"];
  recommendedNextStage: GovernanceSimulationPreview["recommendedNextStage"];
} {
  if (exceptionReview.previewStatus === "not-created") {
    return {
      previewStatus: "not-created",
      simulationConclusion: "source-missing",
      recommendedNextStage: "continue-preview-only"
    };
  }
  if (exceptionReview.previewStatus === "blocked" || summary.nonReviewableBlockers > 0 || summary.simulatedBlocks > 0) {
    return {
      previewStatus: "blocked",
      simulationConclusion: "blocked-preview",
      recommendedNextStage: "blocked"
    };
  }
  if (summary.simulatedWarnings > 0 || summary.reviewableWarnings > 0) {
    return {
      previewStatus: "created",
      simulationConclusion: "warning-preview",
      recommendedNextStage: "prepare-guarded-policy-activation-candidates"
    };
  }
  return {
    previewStatus: "created",
    simulationConclusion: "pass-preview",
    recommendedNextStage: "prepare-guarded-policy-activation-candidates"
  };
}

function warningsFor(conclusion: GovernanceSimulationPreview["simulationConclusion"]): string[] {
  const warnings = [
    "Governance simulation is preview-only.",
    "Simulation outcomes were not applied.",
    "Simulation outcomes were not enforced.",
    "Simulation did not change runtime outcomes.",
    "No exception was approved.",
    "Governance bypass is not allowed.",
    "No governance was enforced.",
    "Runtime behavior did not change.",
    "Repair orchestration did not change."
  ];
  if (conclusion === "source-missing") {
    warnings.unshift("Exception review preview is not created; simulation source is missing.");
  }
  if (conclusion === "blocked-preview") {
    warnings.unshift("Simulation detected blocking preview conditions.");
  }
  return warnings;
}

export function buildGovernanceSimulationPreviewFromExceptionReview(
  exceptionReview: GovernanceExceptionReviewPreview
): GovernanceSimulationPreview {
  const scenarios = collectScenarios(exceptionReview);
  const simulatedOutcomeSummary = buildSummary(exceptionReview, scenarios);
  const conclusion = conclusionFor(exceptionReview, simulatedOutcomeSummary);

  return {
    schemaVersion: 1,
    previewStatus: conclusion.previewStatus,
    sourceExceptionReviewStatus: exceptionReview.previewStatus,
    simulationConclusion: conclusion.simulationConclusion,
    simulationApplied: false,
    simulationEnforced: false,
    simulationChangedOutcome: false,
    exceptionApproved: false,
    exceptionApplied: false,
    governanceBypassAllowed: false,
    exceptionEnforced: false,
    ciEnforced: false,
    buildFailedByGovernance: false,
    githubPublished: false,
    prCommentCreated: false,
    githubApiCalled: false,
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
    scenarios,
    simulatedOutcomeSummary,
    warnings: warningsFor(conclusion.simulationConclusion),
    recommendedNextStage: conclusion.recommendedNextStage
  };
}

export function buildGovernanceSimulationPreview(projectRoot: string): GovernanceSimulationPreview {
  return buildGovernanceSimulationPreviewFromExceptionReview(buildGovernanceExceptionReviewPreview(projectRoot));
}

export function renderGovernanceSimulationPreviewMarkdown(preview: GovernanceSimulationPreview): string {
  const lines = [
    "# AI Software Factory - Governance Simulation Preview",
    "",
    "Preview status:",
    preview.previewStatus,
    "",
    "Source exception review status:",
    preview.sourceExceptionReviewStatus,
    "",
    "Simulation conclusion:",
    preview.simulationConclusion,
    "",
    "Total scenarios:",
    String(preview.simulatedOutcomeSummary.totalScenarios),
    "",
    "Simulated passes:",
    String(preview.simulatedOutcomeSummary.simulatedPasses),
    "",
    "Simulated warnings:",
    String(preview.simulatedOutcomeSummary.simulatedWarnings),
    "",
    "Simulated blocks:",
    String(preview.simulatedOutcomeSummary.simulatedBlocks),
    "",
    "Non-reviewable blockers:",
    String(preview.simulatedOutcomeSummary.nonReviewableBlockers),
    "",
    "Reviewable warnings:",
    String(preview.simulatedOutcomeSummary.reviewableWarnings),
    "",
    "Simulation applied:",
    String(preview.simulationApplied),
    "",
    "Simulation enforced:",
    String(preview.simulationEnforced),
    "",
    "Simulation changed outcome:",
    String(preview.simulationChangedOutcome),
    "",
    "Exception approved:",
    String(preview.exceptionApproved),
    "",
    "Exception applied:",
    String(preview.exceptionApplied),
    "",
    "Governance bypass allowed:",
    String(preview.governanceBypassAllowed),
    "",
    "CI enforced:",
    String(preview.ciEnforced),
    "",
    "Build failed by governance:",
    String(preview.buildFailedByGovernance),
    "",
    "GitHub API called:",
    String(preview.githubApiCalled),
    "",
    "Applied:",
    String(preview.applied),
    "",
    "Enforced:",
    String(preview.enforced),
    "",
    "Policy runtime mode:",
    preview.policyRuntimeMode,
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
    "## Simulation Scenarios",
    ""
  ];

  for (const item of preview.scenarios) {
    lines.push(`- [${item.simulatedDecision}] ${item.id} ${item.source}: ${item.name} - ${item.reason}`);
  }

  lines.push("", "## Preview-Only Guarantees", "");
  lines.push("- simulation applied: false");
  lines.push("- simulation enforced: false");
  lines.push("- simulation changed outcome: false");
  lines.push("- exception approved: false");
  lines.push("- governance bypass allowed: false");
  lines.push("- governance enforced: false");

  lines.push("", "## Warnings", "");
  for (const warning of preview.warnings) {
    lines.push(`- ${warning}`);
  }

  return `${lines.join("\n")}\n`;
}

export function renderGovernanceSimulationPreviewText(preview: GovernanceSimulationPreview): string {
  return renderGovernanceSimulationPreviewMarkdown(preview);
}

export function writeGovernanceSimulationPreviewArtifacts(
  projectRoot: string,
  preview: GovernanceSimulationPreview
): { jsonPath: string; markdownPath: string } {
  const jsonPath = path.join(projectRoot, ARTIFACT_JSON_PATH);
  const markdownPath = path.join(projectRoot, ARTIFACT_MARKDOWN_PATH);
  fs.ensureDirSync(path.dirname(jsonPath));
  fs.writeFileSync(jsonPath, `${JSON.stringify(preview, null, 2)}\n`, "utf8");
  fs.writeFileSync(markdownPath, renderGovernanceSimulationPreviewMarkdown(preview), "utf8");
  return {
    jsonPath: ARTIFACT_JSON_PATH,
    markdownPath: ARTIFACT_MARKDOWN_PATH
  };
}
