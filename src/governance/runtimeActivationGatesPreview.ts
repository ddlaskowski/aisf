import fs from "fs-extra";
import path from "node:path";

import {
  buildGovernanceGuardedPolicyActivationCandidatesPreview,
  type GovernanceGuardedPolicyActivationCandidatesPreview,
  type GovernancePolicyActivationCandidate
} from "./guardedPolicyActivationCandidatesPreview.js";

export type GovernanceRuntimeActivationGate = {
  id: string;
  name: string;
  category:
    | "config-chain"
    | "policy-runtime"
    | "profile-governance"
    | "repo-boundaries"
    | "attestation"
    | "ci-preview"
    | "pr-preview"
    | "exception-review"
    | "simulation"
    | "activation-candidates"
    | "safety-invariants"
    | "unsafe-capabilities";
  gateStatus:
    | "satisfied"
    | "warning-state"
    | "blocked"
    | "permanently-non-passable";
  source:
    | "activation-plan"
    | "load-preview"
    | "snapshot-lock"
    | "audit-trail"
    | "policy-runtime-preview"
    | "profile-inheritance-preview"
    | "repo-classification-preview"
    | "governance-attestation"
    | "ci-annotations-preview"
    | "github-pr-summary-preview"
    | "exception-review-preview"
    | "governance-simulation-preview"
    | "activation-candidates-preview"
    | "derived";
  reason: string;
  previewOnly: true;
  activationGatePassed: false;
  runtimeActivationEnabled: false;
  enforced: false;
};

export type GovernanceRuntimeActivationGatesPreview = {
  schemaVersion: 1;
  previewStatus: "not-created" | "created" | "blocked";
  sourceActivationCandidatesStatus: "not-created" | "created" | "blocked";
  activationGateConclusion:
    | "not-ready"
    | "warning-preview"
    | "blocked-preview"
    | "structurally-ready-preview"
    | "source-missing";
  activationGatePassed: false;
  runtimeActivationEnabled: false;
  policyActivated: false;
  guardedActivationEnabled: false;
  activationEnforced: false;
  activationCandidateApplied: false;
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
  gates: GovernanceRuntimeActivationGate[];
  summary: {
    totalGates: number;
    satisfiedGates: number;
    warningStateGates: number;
    blockedGates: number;
    permanentlyNonPassableGates: number;
    structurallyReady: boolean;
  };
  warnings: string[];
  recommendedNextStage:
    | "continue-preview-only"
    | "prepare-v7-autonomy-readiness"
    | "blocked";
};

const ARTIFACT_JSON_PATH = ".factory/governance/runtime-activation-gates-preview.json";
const ARTIFACT_MARKDOWN_PATH = ".factory/governance/runtime-activation-gates-preview.md";

const GATE_STATUS_ORDER: Record<GovernanceRuntimeActivationGate["gateStatus"], number> = {
  "permanently-non-passable": 0,
  blocked: 1,
  "warning-state": 2,
  satisfied: 3
};

const PERMANENT_GATES: Array<Pick<GovernanceRuntimeActivationGate, "name" | "category" | "source" | "reason">> = [
  {
    name: "Autonomous execution enablement",
    category: "unsafe-capabilities",
    source: "derived",
    reason: "Autonomous execution must remain non-passable in runtime activation gate preview."
  },
  {
    name: "Self-modifying governance",
    category: "unsafe-capabilities",
    source: "derived",
    reason: "Self-modifying governance must remain non-passable."
  },
  {
    name: "Plugin execution",
    category: "unsafe-capabilities",
    source: "derived",
    reason: "Plugin execution must remain non-passable."
  },
  {
    name: "Dynamic script evaluation",
    category: "unsafe-capabilities",
    source: "derived",
    reason: "Dynamic script evaluation must remain non-passable."
  },
  {
    name: "Mutation scope expansion",
    category: "unsafe-capabilities",
    source: "derived",
    reason: "Mutation scope expansion must remain non-passable."
  },
  {
    name: "Bypassing Safe Patch Engine",
    category: "unsafe-capabilities",
    source: "derived",
    reason: "Bypassing Safe Patch Engine must remain non-passable."
  },
  {
    name: "Governance bypass capabilities",
    category: "unsafe-capabilities",
    source: "derived",
    reason: "Governance bypass capabilities must remain non-passable."
  },
  {
    name: "Disabling safety invariants",
    category: "unsafe-capabilities",
    source: "derived",
    reason: "Disabling safety invariants must remain non-passable."
  },
  {
    name: "External governance execution",
    category: "unsafe-capabilities",
    source: "derived",
    reason: "External governance execution must remain non-passable."
  },
  {
    name: "Uncontrolled multi-agent orchestration",
    category: "unsafe-capabilities",
    source: "derived",
    reason: "Uncontrolled multi-agent orchestration must remain non-passable."
  }
];

function gate(
  name: string,
  category: GovernanceRuntimeActivationGate["category"],
  gateStatus: GovernanceRuntimeActivationGate["gateStatus"],
  source: GovernanceRuntimeActivationGate["source"],
  reason: string
): Omit<GovernanceRuntimeActivationGate, "id"> {
  return {
    name,
    category,
    gateStatus,
    source,
    reason,
    previewOnly: true,
    activationGatePassed: false,
    runtimeActivationEnabled: false,
    enforced: false
  };
}

function gateStatusForCandidate(candidate: GovernancePolicyActivationCandidate): GovernanceRuntimeActivationGate["gateStatus"] {
  if (candidate.activationClassification === "permanently-non-activatable") {
    return "permanently-non-passable";
  }
  if (candidate.activationClassification === "blocked") {
    return "blocked";
  }
  if (candidate.activationClassification === "review-required") {
    return "warning-state";
  }
  return "satisfied";
}

function categoryForCandidate(candidate: GovernancePolicyActivationCandidate): GovernanceRuntimeActivationGate["category"] {
  if (candidate.category === "policy-runtime") {
    return "policy-runtime";
  }
  if (candidate.source === "repo-classification-preview") {
    return "repo-boundaries";
  }
  if (candidate.source === "profile-inheritance-preview") {
    return "profile-governance";
  }
  if (candidate.source === "governance-attestation") {
    return "attestation";
  }
  if (candidate.source === "ci-annotations-preview") {
    return "ci-preview";
  }
  if (candidate.source === "github-pr-summary-preview") {
    return "pr-preview";
  }
  if (candidate.source === "exception-review-preview") {
    return "exception-review";
  }
  if (candidate.source === "governance-simulation-preview") {
    return "simulation";
  }
  return "activation-candidates";
}

function sourceForCandidate(candidate: GovernancePolicyActivationCandidate): GovernanceRuntimeActivationGate["source"] {
  return candidate.source;
}

function baseGates(source: GovernanceGuardedPolicyActivationCandidatesPreview): Array<Omit<GovernanceRuntimeActivationGate, "id">> {
  if (source.previewStatus === "not-created") {
    return [
      gate(
        "Guarded activation candidates source",
        "activation-candidates",
        "warning-state",
        "activation-candidates-preview",
        "Guarded activation candidates preview is missing, so runtime activation gates cannot be evaluated."
      )
    ];
  }

  const statusGate = gate(
    "Guarded activation candidate integrity",
    "activation-candidates",
    source.previewStatus === "blocked" ? "blocked" : "satisfied",
    "activation-candidates-preview",
    `Guarded activation candidate preview status is ${source.previewStatus}.`
  );

  const chainGates: Array<Omit<GovernanceRuntimeActivationGate, "id">> = [
    gate("Governance config validity", "config-chain", "satisfied", "activation-plan", "Governance config chain has reached activation-candidate preview."),
    gate("Stable snapshot lock", "config-chain", "satisfied", "snapshot-lock", "Snapshot lock evidence is represented in the activation-candidate chain."),
    gate("Stable audit trail", "config-chain", "satisfied", "audit-trail", "Audit trail evidence is represented in the activation-candidate chain."),
    gate("Policy runtime preview-only integrity", "policy-runtime", "satisfied", "policy-runtime-preview", "Policy runtime remains preview-only."),
    gate("Profile inheritance stability", "profile-governance", "satisfied", "profile-inheritance-preview", "Profiles remain preview-only and unapplied."),
    gate("Repo classification stability", "repo-boundaries", "satisfied", "repo-classification-preview", "Repository boundaries remain preview-only and unenforced."),
    gate("Governance attestation integrity", "attestation", "satisfied", "governance-attestation", "Governance attestation invariants are represented in the preview chain."),
    gate("CI preview integrity", "ci-preview", "satisfied", "ci-annotations-preview", "CI annotations remain preview-only and non-blocking."),
    gate("PR preview integrity", "pr-preview", "satisfied", "github-pr-summary-preview", "GitHub PR summary remains local preview-only output."),
    gate("Exception review integrity", "exception-review", "satisfied", "exception-review-preview", "No exception approval or governance bypass is applied."),
    gate("Governance simulation integrity", "simulation", "satisfied", "governance-simulation-preview", "Simulation outcomes are not applied."),
    gate("Safety invariant preservation", "safety-invariants", "satisfied", "derived", "Runtime behavior, governance decisions, and repair orchestration remain unchanged."),
    gate("Safe Patch Engine exclusivity", "safety-invariants", "satisfied", "derived", "Safe Patch Engine remains the only mutation layer."),
    gate("No runtime config activation", "safety-invariants", "satisfied", "derived", "Runtime config activation remains disabled.")
  ];

  const candidateGates = source.candidates.map((candidate) => gate(
    `Activation candidate ${candidate.key}`,
    categoryForCandidate(candidate),
    gateStatusForCandidate(candidate),
    sourceForCandidate(candidate),
    candidate.reason
  ));

  return [
    statusGate,
    ...chainGates,
    ...candidateGates
  ];
}

function collectGates(source: GovernanceGuardedPolicyActivationCandidatesPreview): GovernanceRuntimeActivationGate[] {
  const raw = [
    ...baseGates(source),
    ...PERMANENT_GATES.map((item) => gate(
      item.name,
      item.category,
      "permanently-non-passable",
      item.source,
      item.reason
    ))
  ];

  const sorted = raw.sort((a, b) => {
    const status = GATE_STATUS_ORDER[a.gateStatus] - GATE_STATUS_ORDER[b.gateStatus];
    if (status !== 0) return status;
    const category = a.category.localeCompare(b.category);
    if (category !== 0) return category;
    return a.name.localeCompare(b.name);
  });

  return sorted.map((item, index) => ({
    id: `gov-runtime-gate-${String(index + 1).padStart(3, "0")}`,
    ...item
  }));
}

function buildSummary(gates: GovernanceRuntimeActivationGate[]): GovernanceRuntimeActivationGatesPreview["summary"] {
  const blockedGates = gates.filter((item) => item.gateStatus === "blocked").length;
  const warningStateGates = gates.filter((item) => item.gateStatus === "warning-state").length;
  return {
    totalGates: gates.length,
    satisfiedGates: gates.filter((item) => item.gateStatus === "satisfied").length,
    warningStateGates,
    blockedGates,
    permanentlyNonPassableGates: gates.filter((item) => item.gateStatus === "permanently-non-passable").length,
    structurallyReady: blockedGates === 0 && warningStateGates === 0
  };
}

function conclusionFor(
  source: GovernanceGuardedPolicyActivationCandidatesPreview,
  summary: GovernanceRuntimeActivationGatesPreview["summary"]
): {
  previewStatus: GovernanceRuntimeActivationGatesPreview["previewStatus"];
  activationGateConclusion: GovernanceRuntimeActivationGatesPreview["activationGateConclusion"];
  recommendedNextStage: GovernanceRuntimeActivationGatesPreview["recommendedNextStage"];
} {
  if (source.previewStatus === "not-created") {
    return {
      previewStatus: "not-created",
      activationGateConclusion: "source-missing",
      recommendedNextStage: "continue-preview-only"
    };
  }
  if (
    source.previewStatus === "blocked" ||
    source.summary.permanentlyNonActivatableCandidates > 0 ||
    summary.blockedGates > 0
  ) {
    return {
      previewStatus: "blocked",
      activationGateConclusion: "blocked-preview",
      recommendedNextStage: "blocked"
    };
  }
  if (summary.warningStateGates > 0) {
    return {
      previewStatus: "created",
      activationGateConclusion: "warning-preview",
      recommendedNextStage: "continue-preview-only"
    };
  }
  return {
    previewStatus: "created",
    activationGateConclusion: "structurally-ready-preview",
    recommendedNextStage: "prepare-v7-autonomy-readiness"
  };
}

function warningsFor(conclusion: GovernanceRuntimeActivationGatesPreview["activationGateConclusion"]): string[] {
  const warnings = [
    "Runtime activation gates are preview-only.",
    "No runtime activation occurred.",
    "No policy was activated.",
    "No governance was enforced.",
    "Runtime behavior did not change.",
    "Governance decisions did not change.",
    "Repair orchestration did not change."
  ];
  if (conclusion === "source-missing") {
    warnings.unshift("Guarded policy activation candidates preview is not created; runtime activation gates source is missing.");
  }
  if (conclusion === "blocked-preview") {
    warnings.unshift("Runtime activation gate preview detected blocked gates.");
  }
  if (conclusion === "warning-preview") {
    warnings.unshift("Runtime activation gate preview contains warning-state gates.");
  }
  return warnings;
}

export function buildGovernanceRuntimeActivationGatesPreviewFromActivationCandidates(
  source: GovernanceGuardedPolicyActivationCandidatesPreview
): GovernanceRuntimeActivationGatesPreview {
  const gates = collectGates(source);
  const summary = buildSummary(gates);
  const conclusion = conclusionFor(source, summary);

  return {
    schemaVersion: 1,
    previewStatus: conclusion.previewStatus,
    sourceActivationCandidatesStatus: source.previewStatus,
    activationGateConclusion: conclusion.activationGateConclusion,
    activationGatePassed: false,
    runtimeActivationEnabled: false,
    policyActivated: false,
    guardedActivationEnabled: false,
    activationEnforced: false,
    activationCandidateApplied: false,
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
    gates,
    summary,
    warnings: warningsFor(conclusion.activationGateConclusion),
    recommendedNextStage: conclusion.recommendedNextStage
  };
}

export function buildGovernanceRuntimeActivationGatesPreview(projectRoot: string): GovernanceRuntimeActivationGatesPreview {
  return buildGovernanceRuntimeActivationGatesPreviewFromActivationCandidates(
    buildGovernanceGuardedPolicyActivationCandidatesPreview(projectRoot)
  );
}

export function renderGovernanceRuntimeActivationGatesPreviewMarkdown(preview: GovernanceRuntimeActivationGatesPreview): string {
  const lines = [
    "# AI Software Factory - Governance Runtime Activation Gates Preview",
    "",
    "Preview status:",
    preview.previewStatus,
    "",
    "Source activation candidates status:",
    preview.sourceActivationCandidatesStatus,
    "",
    "Activation gate conclusion:",
    preview.activationGateConclusion,
    "",
    "Total gates:",
    String(preview.summary.totalGates),
    "",
    "Satisfied gates:",
    String(preview.summary.satisfiedGates),
    "",
    "Warning-state gates:",
    String(preview.summary.warningStateGates),
    "",
    "Blocked gates:",
    String(preview.summary.blockedGates),
    "",
    "Permanently non-passable gates:",
    String(preview.summary.permanentlyNonPassableGates),
    "",
    "Structurally ready:",
    String(preview.summary.structurallyReady),
    "",
    "Activation gate passed:",
    String(preview.activationGatePassed),
    "",
    "Runtime activation enabled:",
    String(preview.runtimeActivationEnabled),
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
    "## Runtime Activation Gates",
    ""
  ];

  for (const gateItem of preview.gates) {
    lines.push(`- [${gateItem.gateStatus}] ${gateItem.id} ${gateItem.category}: ${gateItem.name} - ${gateItem.reason}`);
  }

  lines.push("", "## Preview-Only Guarantees", "");
  lines.push("- activation gate passed: false");
  lines.push("- runtime activation enabled: false");
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

export function renderGovernanceRuntimeActivationGatesPreviewText(preview: GovernanceRuntimeActivationGatesPreview): string {
  return renderGovernanceRuntimeActivationGatesPreviewMarkdown(preview);
}

export function writeGovernanceRuntimeActivationGatesPreviewArtifacts(
  projectRoot: string,
  preview: GovernanceRuntimeActivationGatesPreview
): { jsonPath: string; markdownPath: string } {
  const jsonPath = path.join(projectRoot, ARTIFACT_JSON_PATH);
  const markdownPath = path.join(projectRoot, ARTIFACT_MARKDOWN_PATH);
  fs.ensureDirSync(path.dirname(jsonPath));
  fs.writeFileSync(jsonPath, `${JSON.stringify(preview, null, 2)}\n`, "utf8");
  fs.writeFileSync(markdownPath, renderGovernanceRuntimeActivationGatesPreviewMarkdown(preview), "utf8");
  return {
    jsonPath: ARTIFACT_JSON_PATH,
    markdownPath: ARTIFACT_MARKDOWN_PATH
  };
}
