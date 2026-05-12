import fs from "fs-extra";
import path from "node:path";

import {
  buildGovernanceSimulationPreview,
  type GovernanceSimulationPreview,
  type GovernanceSimulationScenario
} from "./governanceSimulationPreview.js";

export type GovernancePolicyActivationCandidate = {
  id: string;
  key: string;
  category:
    | "threshold"
    | "release-gate"
    | "escalation"
    | "evidence"
    | "archive"
    | "dashboard"
    | "export"
    | "policy-runtime"
    | "other-governance";
  activationClassification:
    | "eligible"
    | "review-required"
    | "blocked"
    | "permanently-non-activatable";
  source:
    | "policy-runtime-preview"
    | "profile-inheritance-preview"
    | "repo-classification-preview"
    | "governance-attestation"
    | "ci-annotations-preview"
    | "github-pr-summary-preview"
    | "exception-review-preview"
    | "governance-simulation-preview"
    | "derived";
  reason: string;
  previewOnly: true;
  activationCandidateApplied: false;
  policyActivated: false;
  enforced: false;
};

export type GovernanceGuardedPolicyActivationCandidatesPreview = {
  schemaVersion: 1;
  previewStatus: "not-created" | "created" | "blocked";
  sourceSimulationStatus: "not-created" | "created" | "blocked";
  activationCandidateConclusion:
    | "eligible-preview"
    | "review-required-preview"
    | "blocked-preview"
    | "source-missing";
  activationCandidateApplied: false;
  policyActivated: false;
  guardedActivationEnabled: false;
  activationEnforced: false;
  simulationApplied: false;
  simulationEnforced: false;
  simulationChangedOutcome: false;
  exceptionApproved: false;
  exceptionApplied: false;
  governanceBypassAllowed: false;
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
  candidates: GovernancePolicyActivationCandidate[];
  summary: {
    totalCandidates: number;
    eligibleCandidates: number;
    reviewRequiredCandidates: number;
    blockedCandidates: number;
    permanentlyNonActivatableCandidates: number;
    categories: string[];
  };
  warnings: string[];
  recommendedNextStage:
    | "continue-preview-only"
    | "prepare-governance-runtime-activation-gates"
    | "blocked";
};

const ARTIFACT_JSON_PATH = ".factory/governance/guarded-policy-activation-candidates-preview.json";
const ARTIFACT_MARKDOWN_PATH = ".factory/governance/guarded-policy-activation-candidates-preview.md";

const CLASSIFICATION_ORDER: Record<GovernancePolicyActivationCandidate["activationClassification"], number> = {
  "permanently-non-activatable": 0,
  blocked: 1,
  "review-required": 2,
  eligible: 3
};

const PERMANENTLY_BLOCKED_PATTERNS = [
  "autonomous",
  "bypass",
  "dynamic policy",
  "external command",
  "external governance",
  "mutation scope",
  "plugin execution",
  "runtime script",
  "safe patch engine",
  "self-modifying"
];

function slug(value: string): string {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized.length > 0 ? normalized : "governance-policy";
}

function categoryForScenario(scenario: GovernanceSimulationScenario): GovernancePolicyActivationCandidate["category"] {
  const text = `${scenario.name} ${scenario.reason}`.toLowerCase();
  if (scenario.source === "policy-runtime-preview") {
    return "policy-runtime";
  }
  if (text.includes("threshold")) {
    return "threshold";
  }
  if (text.includes("release gate") || text.includes("release-gate")) {
    return "release-gate";
  }
  if (text.includes("escalation") || text.includes("manual review")) {
    return "escalation";
  }
  if (text.includes("evidence")) {
    return "evidence";
  }
  if (text.includes("archive")) {
    return "archive";
  }
  if (text.includes("dashboard")) {
    return "dashboard";
  }
  if (text.includes("export")) {
    return "export";
  }
  return "other-governance";
}

function sourceForScenario(scenario: GovernanceSimulationScenario): GovernancePolicyActivationCandidate["source"] {
  if ((scenario.source as string) === "governance-simulation-preview") {
    return "governance-simulation-preview";
  }
  return scenario.source;
}

function isPermanentlyNonActivatable(scenario: GovernanceSimulationScenario): boolean {
  const text = `${scenario.name} ${scenario.reason}`.toLowerCase();
  return PERMANENTLY_BLOCKED_PATTERNS.some((pattern) => text.includes(pattern));
}

function classificationForScenario(
  simulation: GovernanceSimulationPreview,
  scenario: GovernanceSimulationScenario
): GovernancePolicyActivationCandidate["activationClassification"] {
  if (isPermanentlyNonActivatable(scenario)) {
    return "permanently-non-activatable";
  }
  if (scenario.simulatedDecision === "would-block" || simulation.previewStatus === "blocked") {
    return "blocked";
  }
  if (scenario.simulatedDecision === "would-warn" || simulation.simulationConclusion === "warning-preview") {
    return "review-required";
  }
  if (simulation.simulationConclusion === "pass-preview") {
    return "eligible";
  }
  return "review-required";
}

function reasonForClassification(
  classification: GovernancePolicyActivationCandidate["activationClassification"],
  simulation: GovernanceSimulationPreview,
  scenario: GovernanceSimulationScenario
): string {
  if (classification === "eligible") {
    return "Stable preview-only governance simulation indicates this policy could be a future guarded activation candidate.";
  }
  if (classification === "review-required") {
    return "Policy candidate is safe enough to preview but requires future human review before any guarded activation design.";
  }
  if (classification === "permanently-non-activatable") {
    return "Policy candidate is linked to permanently blocked unsafe governance capability and cannot become activatable.";
  }
  if (simulation.previewStatus === "blocked") {
    return "Policy candidate is blocked because the source simulation preview contains blocking conditions.";
  }
  return `Policy candidate is blocked by simulated decision ${scenario.simulatedDecision}.`;
}

function buildCandidates(simulation: GovernanceSimulationPreview): GovernancePolicyActivationCandidate[] {
  if (simulation.previewStatus === "not-created") {
    return [];
  }

  const raw = simulation.scenarios.map((scenario) => {
    const activationClassification = classificationForScenario(simulation, scenario);
    const category = categoryForScenario(scenario);
    return {
      key: `${category}.${slug(scenario.name)}`,
      category,
      activationClassification,
      source: sourceForScenario(scenario),
      reason: reasonForClassification(activationClassification, simulation, scenario),
      previewOnly: true,
      activationCandidateApplied: false,
      policyActivated: false,
      enforced: false
    } satisfies Omit<GovernancePolicyActivationCandidate, "id">;
  });

  const sorted = raw.sort((a, b) => {
    const classification = CLASSIFICATION_ORDER[a.activationClassification] - CLASSIFICATION_ORDER[b.activationClassification];
    if (classification !== 0) return classification;
    const category = a.category.localeCompare(b.category);
    if (category !== 0) return category;
    return a.key.localeCompare(b.key);
  });

  return sorted.map((candidate, index) => ({
    id: `gov-activation-candidate-${String(index + 1).padStart(3, "0")}`,
    ...candidate
  }));
}

function buildSummary(candidates: GovernancePolicyActivationCandidate[]): GovernanceGuardedPolicyActivationCandidatesPreview["summary"] {
  return {
    totalCandidates: candidates.length,
    eligibleCandidates: candidates.filter((candidate) => candidate.activationClassification === "eligible").length,
    reviewRequiredCandidates: candidates.filter((candidate) => candidate.activationClassification === "review-required").length,
    blockedCandidates: candidates.filter((candidate) => candidate.activationClassification === "blocked").length,
    permanentlyNonActivatableCandidates: candidates.filter((candidate) => candidate.activationClassification === "permanently-non-activatable").length,
    categories: Array.from(new Set(candidates.map((candidate) => candidate.category))).sort()
  };
}

function conclusionFor(
  simulation: GovernanceSimulationPreview,
  summary: GovernanceGuardedPolicyActivationCandidatesPreview["summary"]
): {
  previewStatus: GovernanceGuardedPolicyActivationCandidatesPreview["previewStatus"];
  activationCandidateConclusion: GovernanceGuardedPolicyActivationCandidatesPreview["activationCandidateConclusion"];
  recommendedNextStage: GovernanceGuardedPolicyActivationCandidatesPreview["recommendedNextStage"];
} {
  if (simulation.previewStatus === "not-created") {
    return {
      previewStatus: "not-created",
      activationCandidateConclusion: "source-missing",
      recommendedNextStage: "continue-preview-only"
    };
  }
  if (
    simulation.previewStatus === "blocked" ||
    summary.permanentlyNonActivatableCandidates > 0 ||
    summary.blockedCandidates > 0
  ) {
    return {
      previewStatus: "blocked",
      activationCandidateConclusion: "blocked-preview",
      recommendedNextStage: "blocked"
    };
  }
  if (summary.reviewRequiredCandidates > 0 || simulation.simulationConclusion === "warning-preview") {
    return {
      previewStatus: "created",
      activationCandidateConclusion: "review-required-preview",
      recommendedNextStage: "prepare-governance-runtime-activation-gates"
    };
  }
  return {
    previewStatus: "created",
    activationCandidateConclusion: "eligible-preview",
    recommendedNextStage: "prepare-governance-runtime-activation-gates"
  };
}

function warningsFor(conclusion: GovernanceGuardedPolicyActivationCandidatesPreview["activationCandidateConclusion"]): string[] {
  const warnings = [
    "Guarded policy activation candidates are preview-only.",
    "No policy was activated.",
    "Guarded activation was not enabled.",
    "No activation was enforced.",
    "Simulation outcomes were not applied.",
    "No governance was enforced.",
    "Runtime behavior did not change.",
    "Governance decisions did not change.",
    "Repair orchestration did not change."
  ];
  if (conclusion === "source-missing") {
    warnings.unshift("Governance simulation preview is not created; activation candidate source is missing.");
  }
  if (conclusion === "blocked-preview") {
    warnings.unshift("Guarded activation candidate preview detected blocked or permanently non-activatable policies.");
  }
  if (conclusion === "review-required-preview") {
    warnings.unshift("Guarded activation candidate preview requires future human review.");
  }
  return warnings;
}

export function buildGovernanceGuardedPolicyActivationCandidatesPreviewFromSimulation(
  simulation: GovernanceSimulationPreview
): GovernanceGuardedPolicyActivationCandidatesPreview {
  const candidates = buildCandidates(simulation);
  const summary = buildSummary(candidates);
  const conclusion = conclusionFor(simulation, summary);

  return {
    schemaVersion: 1,
    previewStatus: conclusion.previewStatus,
    sourceSimulationStatus: simulation.previewStatus,
    activationCandidateConclusion: conclusion.activationCandidateConclusion,
    activationCandidateApplied: false,
    policyActivated: false,
    guardedActivationEnabled: false,
    activationEnforced: false,
    simulationApplied: false,
    simulationEnforced: false,
    simulationChangedOutcome: false,
    exceptionApproved: false,
    exceptionApplied: false,
    governanceBypassAllowed: false,
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
    candidates,
    summary,
    warnings: warningsFor(conclusion.activationCandidateConclusion),
    recommendedNextStage: conclusion.recommendedNextStage
  };
}

export function buildGovernanceGuardedPolicyActivationCandidatesPreview(
  projectRoot: string
): GovernanceGuardedPolicyActivationCandidatesPreview {
  return buildGovernanceGuardedPolicyActivationCandidatesPreviewFromSimulation(buildGovernanceSimulationPreview(projectRoot));
}

export function renderGovernanceGuardedPolicyActivationCandidatesPreviewMarkdown(
  preview: GovernanceGuardedPolicyActivationCandidatesPreview
): string {
  const lines = [
    "# AI Software Factory - Guarded Policy Activation Candidates Preview",
    "",
    "Preview status:",
    preview.previewStatus,
    "",
    "Source simulation status:",
    preview.sourceSimulationStatus,
    "",
    "Activation candidate conclusion:",
    preview.activationCandidateConclusion,
    "",
    "Total candidates:",
    String(preview.summary.totalCandidates),
    "",
    "Eligible candidates:",
    String(preview.summary.eligibleCandidates),
    "",
    "Review-required candidates:",
    String(preview.summary.reviewRequiredCandidates),
    "",
    "Blocked candidates:",
    String(preview.summary.blockedCandidates),
    "",
    "Permanently non-activatable candidates:",
    String(preview.summary.permanentlyNonActivatableCandidates),
    "",
    "Activation candidate applied:",
    String(preview.activationCandidateApplied),
    "",
    "Policy activated:",
    String(preview.policyActivated),
    "",
    "Guarded activation enabled:",
    String(preview.guardedActivationEnabled),
    "",
    "Activation enforced:",
    String(preview.activationEnforced),
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
    "Governance bypass allowed:",
    String(preview.governanceBypassAllowed),
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
    "## Activation Candidates",
    ""
  ];

  if (preview.candidates.length === 0) {
    lines.push("- none");
  } else {
    for (const candidate of preview.candidates) {
      lines.push(`- [${candidate.activationClassification}] ${candidate.id} ${candidate.category}: ${candidate.key} - ${candidate.reason}`);
    }
  }

  lines.push("", "## Preview-Only Guarantees", "");
  lines.push("- activation candidate applied: false");
  lines.push("- policy activated: false");
  lines.push("- guarded activation enabled: false");
  lines.push("- activation enforced: false");
  lines.push("- governance enforced: false");
  lines.push("- runtime behavior changed: false");

  lines.push("", "## Warnings", "");
  for (const warning of preview.warnings) {
    lines.push(`- ${warning}`);
  }

  return `${lines.join("\n")}\n`;
}

export function renderGovernanceGuardedPolicyActivationCandidatesPreviewText(
  preview: GovernanceGuardedPolicyActivationCandidatesPreview
): string {
  return renderGovernanceGuardedPolicyActivationCandidatesPreviewMarkdown(preview);
}

export function writeGovernanceGuardedPolicyActivationCandidatesPreviewArtifacts(
  projectRoot: string,
  preview: GovernanceGuardedPolicyActivationCandidatesPreview
): { jsonPath: string; markdownPath: string } {
  const jsonPath = path.join(projectRoot, ARTIFACT_JSON_PATH);
  const markdownPath = path.join(projectRoot, ARTIFACT_MARKDOWN_PATH);
  fs.ensureDirSync(path.dirname(jsonPath));
  fs.writeFileSync(jsonPath, `${JSON.stringify(preview, null, 2)}\n`, "utf8");
  fs.writeFileSync(markdownPath, renderGovernanceGuardedPolicyActivationCandidatesPreviewMarkdown(preview), "utf8");
  return {
    jsonPath: ARTIFACT_JSON_PATH,
    markdownPath: ARTIFACT_MARKDOWN_PATH
  };
}
