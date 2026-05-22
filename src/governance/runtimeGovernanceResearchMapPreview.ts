import fs from "fs-extra";
import path from "node:path";

import {
  buildGovernanceRuntimeResearchIndexPreview,
  type GovernanceRuntimeResearchIndexPreview
} from "./runtimeGovernanceResearchIndexPreview.js";

export type GovernanceRuntimeResearchMapScore = {
  score: 0 | 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90 | 100;
  rating: "blocked" | "not-ready" | "partial-map-readiness" | "research-map-ready";
  reason: string;
};

export type GovernanceRuntimeResearchMapNode = {
  id: string;
  key: string;
  category:
    | "runtime-safety"
    | "runtime-evidence"
    | "runtime-observability"
    | "runtime-control-plane"
    | "runtime-lifecycle"
    | "runtime-activation-readiness"
    | "runtime-certification"
    | "runtime-governance-review"
    | "runtime-boundary-review"
    | "runtime-freeze-review"
    | "runtime-final-review"
    | "post-v9-research"
    | "research-index"
    | "safe-patch-engine";
  stage: "foundation" | "runtime-safety" | "runtime-governance" | "runtime-review" | "post-v9-research";
  status: "mapped-preview" | "preview-only" | "blocked";
  reason: string;
};

export type GovernanceRuntimeResearchDependencyEdge = {
  id: string;
  from: string;
  to: string;
  dependencyType: "requires" | "extends" | "summarizes" | "indexes" | "reviews";
  futureOnly: true;
  reason: string;
};

export type GovernanceRuntimeResearchPrerequisiteChain = {
  id: string;
  key: string;
  orderedSteps: string[];
  previewOnly: true;
  reason: string;
};

export type GovernanceRuntimeResearchStageGroup = {
  id: string;
  stage: "foundation" | "runtime-safety" | "runtime-governance" | "runtime-review" | "post-v9-research";
  totalNodes: number;
  previewOnly: true;
  reason: string;
};

export type GovernanceRuntimeForbiddenDependencyBoundary = {
  id: string;
  category:
    | "runtime-autonomy"
    | "runtime-policy-enforcement"
    | "runtime-learning"
    | "runtime-ml-decisioning"
    | "runtime-plugin-execution"
    | "runtime-script-execution"
    | "runtime-multi-agent-coordination"
    | "mutation-scope-expansion"
    | "safe-patch-engine-bypass";
  permanentlyForbidden: true;
  reason: string;
};

export type GovernanceRuntimeFutureDependencyNote = {
  id: string;
  category:
    | "future-human-review"
    | "future-runtime-research"
    | "future-safety-review"
    | "future-certification-review";
  futureOnly: true;
  reason: string;
};

export type GovernanceRuntimeResearchMapPreview = {
  schemaVersion: 1;
  previewStatus: "not-created" | "created" | "blocked";
  sourceRuntimeResearchIndexStatus: "not-created" | "created" | "blocked";
  runtimeResearchMapConclusion: "source-missing" | "not-ready" | "research-map-ready" | "blocked";
  runtimeResearchMapApplied: false;
  runtimeResearchMapEnforced: false;
  runtimeResearchIndexApplied: false;
  runtimeResearchIndexEnforced: false;
  runtimeResearchApplied: false;
  runtimeResearchEnforced: false;
  runtimeFinalReviewApproved: false;
  runtimeFinalReviewApplied: false;
  runtimeFinalReviewEnforced: false;
  runtimeActivationApproved: false;
  runtimeActivationExecuted: false;
  runtimeGovernanceEnabled: false;
  runtimeAutonomyEnabled: false;
  runtimeAutonomyActionsAllowed: false;
  runtimePolicyEnforcementEnabled: false;
  runtimeConfigActivationEnabled: false;
  runtimeControlPlaneApplied: false;
  runtimeControlPlaneActivated: false;
  runtimeKillSwitchActivated: false;
  runtimeEmergencyStopExecuted: false;
  runtimeOperatorOverrideApplied: false;
  runtimeRollbackExecuted: false;
  runtimeObservabilityApplied: false;
  runtimeObservabilityEnforced: false;
  runtimeSafetyApplied: false;
  runtimeSafetyEnforced: false;
  runtimeSafetyActivated: false;
  runtimeSandboxExecutionAllowed: false;
  runtimeSandboxExecuted: false;
  runtimeMutationScopeExpanded: false;
  runtimeExternalExecutionAllowed: false;
  runtimePluginExecutionAllowed: false;
  runtimeScriptEvaluationAllowed: false;
  runtimeLearningEnabled: false;
  runtimeMlDecisioningEnabled: false;
  runtimeMultiAgentCoordinationEnabled: false;
  governanceBypassAllowed: false;
  applied: false;
  enforced: false;
  policyRuntimeMode: "preview-only";
  runtimeBehaviorChanged: false;
  governanceDecisionsChanged: false;
  repairOrchestrationChanged: false;
  safePatchEngineOnly: true;
  researchMapScore: GovernanceRuntimeResearchMapScore;
  mapNodes: GovernanceRuntimeResearchMapNode[];
  dependencyEdges: GovernanceRuntimeResearchDependencyEdge[];
  prerequisiteChains: GovernanceRuntimeResearchPrerequisiteChain[];
  stageGroups: GovernanceRuntimeResearchStageGroup[];
  forbiddenDependencyBoundaries: GovernanceRuntimeForbiddenDependencyBoundary[];
  futureOnlyDependencyNotes: GovernanceRuntimeFutureDependencyNote[];
  summary: {
    researchMapScoreValue: number;
    totalMapNodes: number;
    totalDependencyEdges: number;
    totalPrerequisiteChains: number;
    totalStageGroups: number;
    totalForbiddenDependencyBoundaries: number;
    totalFutureOnlyDependencyNotes: number;
    researchMapReady: boolean;
  };
  warnings: string[];
  recommendedNextStage:
    | "continue-preview-only-research"
    | "prepare-runtime-governance-research-timeline-preview"
    | "blocked";
};

const ARTIFACT_JSON_PATH = ".factory/governance/runtime-governance-research-map-preview.json";
const ARTIFACT_MARKDOWN_PATH = ".factory/governance/runtime-governance-research-map-preview.md";

const NODE_DEFINITIONS: Array<Omit<GovernanceRuntimeResearchMapNode, "id" | "status">> = [
  { key: "post-v9-runtime-research", category: "post-v9-research", stage: "post-v9-research", reason: "Post-v9 runtime research summarizes the completed preview chain." },
  { key: "runtime-activation-boundary", category: "runtime-boundary-review", stage: "runtime-review", reason: "Runtime activation boundary review is mapped as a preview-only review layer." },
  { key: "runtime-activation-freeze", category: "runtime-freeze-review", stage: "runtime-review", reason: "Runtime activation freeze review is mapped as a preview-only review layer." },
  { key: "runtime-activation-governance-review", category: "runtime-governance-review", stage: "runtime-review", reason: "Runtime activation governance review is mapped as future-human-review-only." },
  { key: "runtime-activation-readiness", category: "runtime-activation-readiness", stage: "runtime-governance", reason: "Runtime activation readiness is mapped without approving activation." },
  { key: "runtime-control-plane", category: "runtime-control-plane", stage: "runtime-governance", reason: "Runtime control plane is mapped without control execution." },
  { key: "runtime-governance-research-index", category: "research-index", stage: "post-v9-research", reason: "Runtime governance research index organizes the research chain." },
  { key: "runtime-governance-lifecycle", category: "runtime-lifecycle", stage: "runtime-governance", reason: "Runtime governance lifecycle is mapped without transition execution." },
  { key: "runtime-safety-certification", category: "runtime-certification", stage: "runtime-review", reason: "Runtime safety certification is mapped without certification application." },
  { key: "runtime-safety-design", category: "runtime-safety", stage: "runtime-safety", reason: "Runtime safety design begins the runtime safety preview chain." },
  { key: "runtime-safety-evidence", category: "runtime-evidence", stage: "runtime-safety", reason: "Runtime safety evidence depends on runtime safety design." },
  { key: "runtime-safety-final-review", category: "runtime-final-review", stage: "runtime-review", reason: "Runtime safety final review closes the v8/v9 preview chain without approval." },
  { key: "runtime-safety-observability", category: "runtime-observability", stage: "runtime-safety", reason: "Runtime safety observability depends on safety evidence." },
  { key: "safe-patch-engine-exclusivity", category: "safe-patch-engine", stage: "foundation", reason: "Safe Patch Engine exclusivity remains the foundation mutation boundary." }
];

const EDGE_DEFINITIONS: Array<Omit<GovernanceRuntimeResearchDependencyEdge, "id" | "futureOnly">> = [
  { from: "post-v9-runtime-research", to: "runtime-governance-research-index", dependencyType: "indexes", reason: "The research index indexes the post-v9 runtime research preview." },
  { from: "runtime-activation-boundary", to: "runtime-activation-freeze", dependencyType: "requires", reason: "Freeze preview requires activation boundary preview." },
  { from: "runtime-activation-freeze", to: "runtime-safety-final-review", dependencyType: "requires", reason: "Final review requires freeze preview." },
  { from: "runtime-activation-governance-review", to: "runtime-activation-boundary", dependencyType: "reviews", reason: "Boundary review follows governance review." },
  { from: "runtime-activation-readiness", to: "runtime-safety-certification", dependencyType: "requires", reason: "Certification preview requires activation readiness preview." },
  { from: "runtime-control-plane", to: "runtime-governance-lifecycle", dependencyType: "extends", reason: "Lifecycle preview extends control-plane preview." },
  { from: "runtime-governance-lifecycle", to: "runtime-activation-readiness", dependencyType: "requires", reason: "Activation readiness requires lifecycle preview." },
  { from: "runtime-safety-certification", to: "runtime-activation-governance-review", dependencyType: "reviews", reason: "Governance review follows certification preview." },
  { from: "runtime-safety-design", to: "runtime-safety-evidence", dependencyType: "requires", reason: "Evidence preview requires safety design preview." },
  { from: "runtime-safety-evidence", to: "runtime-safety-observability", dependencyType: "requires", reason: "Observability preview requires safety evidence preview." },
  { from: "runtime-safety-final-review", to: "post-v9-runtime-research", dependencyType: "summarizes", reason: "Post-v9 research summarizes final review preview." },
  { from: "runtime-safety-observability", to: "runtime-control-plane", dependencyType: "requires", reason: "Control-plane preview requires observability preview." },
  { from: "safe-patch-engine-exclusivity", to: "runtime-safety-design", dependencyType: "requires", reason: "Runtime safety design preserves Safe Patch Engine exclusivity." },
  { from: "safe-patch-engine-exclusivity", to: "post-v9-runtime-research", dependencyType: "summarizes", reason: "Post-v9 research preserves Safe Patch Engine dependency boundaries." }
];

const CHAIN_DEFINITIONS: Array<Omit<GovernanceRuntimeResearchPrerequisiteChain, "id" | "previewOnly">> = [
  { key: "runtime-activation-safety-chain", orderedSteps: ["runtime-safety-design", "runtime-safety-evidence", "runtime-safety-observability", "runtime-control-plane", "runtime-governance-lifecycle", "runtime-activation-readiness"], reason: "Runtime activation safety remains a preview-only prerequisite chain." },
  { key: "runtime-certification-chain", orderedSteps: ["runtime-activation-readiness", "runtime-safety-certification", "runtime-activation-governance-review"], reason: "Runtime certification remains a preview-only research chain." },
  { key: "runtime-freeze-validation-chain", orderedSteps: ["runtime-activation-governance-review", "runtime-activation-boundary", "runtime-activation-freeze"], reason: "Runtime freeze validation remains a preview-only chain." },
  { key: "runtime-governance-review-chain", orderedSteps: ["runtime-safety-certification", "runtime-activation-governance-review", "runtime-activation-boundary", "runtime-activation-freeze", "runtime-safety-final-review"], reason: "Runtime governance review is mapped without approval or activation." },
  { key: "safe-patch-engine-exclusivity-chain", orderedSteps: ["safe-patch-engine-exclusivity", "runtime-safety-design", "runtime-safety-final-review", "post-v9-runtime-research", "runtime-governance-research-index"], reason: "Safe Patch Engine exclusivity remains a prerequisite across the full research map." }
];

const STAGE_DEFINITIONS: Array<GovernanceRuntimeResearchStageGroup["stage"]> = [
  "foundation",
  "post-v9-research",
  "runtime-governance",
  "runtime-review",
  "runtime-safety"
];

const FORBIDDEN_BOUNDARIES: Array<Omit<GovernanceRuntimeForbiddenDependencyBoundary, "id" | "permanentlyForbidden">> = [
  { category: "mutation-scope-expansion", reason: "Mutation scope expansion remains outside all runtime dependency paths." },
  { category: "runtime-autonomy", reason: "Runtime autonomy enablement remains outside all runtime dependency paths." },
  { category: "runtime-learning", reason: "Runtime learning remains outside all runtime dependency paths." },
  { category: "runtime-ml-decisioning", reason: "ML/vector DB governance decisioning remains outside all runtime dependency paths." },
  { category: "runtime-multi-agent-coordination", reason: "Uncontrolled multi-agent coordination remains outside all runtime dependency paths." },
  { category: "runtime-plugin-execution", reason: "Runtime plugin execution remains outside all runtime dependency paths." },
  { category: "runtime-policy-enforcement", reason: "Runtime policy enforcement remains outside all runtime dependency paths." },
  { category: "runtime-script-execution", reason: "Runtime script execution remains outside all runtime dependency paths." },
  { category: "safe-patch-engine-bypass", reason: "Safe Patch Engine bypass remains outside all runtime dependency paths." }
];

const FUTURE_NOTES: Array<Omit<GovernanceRuntimeFutureDependencyNote, "id" | "futureOnly">> = [
  { category: "future-certification-review", reason: "Future runtime systems require certification review before any hypothetical activation." },
  { category: "future-human-review", reason: "Future runtime systems require separate human review." },
  { category: "future-human-review", reason: "Future runtime systems require explicit approval." },
  { category: "future-runtime-research", reason: "Future runtime systems must preserve Safe Patch Engine exclusivity." },
  { category: "future-safety-review", reason: "Future runtime systems require freeze validation." },
  { category: "future-safety-review", reason: "Future runtime systems require rollback validation." }
];

function withDeterministicIds<T>(prefix: string, items: T[], sortKey: (item: T) => string): Array<T & { id: string }> {
  return [...items]
    .sort((a, b) => sortKey(a).localeCompare(sortKey(b)))
    .map((item, index) => ({ id: `${prefix}-${String(index + 1).padStart(3, "0")}`, ...item }));
}

function conclusionFor(source: GovernanceRuntimeResearchIndexPreview): Pick<GovernanceRuntimeResearchMapPreview, "previewStatus" | "runtimeResearchMapConclusion" | "recommendedNextStage"> {
  if (source.previewStatus === "not-created") {
    return { previewStatus: "not-created", runtimeResearchMapConclusion: "source-missing", recommendedNextStage: "continue-preview-only-research" };
  }
  if (source.previewStatus === "blocked") {
    return { previewStatus: "blocked", runtimeResearchMapConclusion: "blocked", recommendedNextStage: "blocked" };
  }
  if (source.runtimeResearchIndexConclusion === "research-index-ready") {
    return { previewStatus: "created", runtimeResearchMapConclusion: "research-map-ready", recommendedNextStage: "prepare-runtime-governance-research-timeline-preview" };
  }
  return { previewStatus: "created", runtimeResearchMapConclusion: "not-ready", recommendedNextStage: "continue-preview-only-research" };
}

function scoreFor(conclusion: GovernanceRuntimeResearchMapPreview["runtimeResearchMapConclusion"]): GovernanceRuntimeResearchMapScore {
  if (conclusion === "blocked") return { score: 0, rating: "blocked", reason: "Runtime governance research map preview is blocked by source status." };
  if (conclusion === "source-missing") return { score: 20, rating: "not-ready", reason: "Runtime governance research index preview is missing." };
  if (conclusion === "not-ready") return { score: 40, rating: "partial-map-readiness", reason: "Runtime governance research index exists but is not ready for mapping." };
  return { score: 80, rating: "research-map-ready", reason: "Runtime governance research map is ready as preview-only documentation." };
}

function statusFor(conclusion: GovernanceRuntimeResearchMapPreview["runtimeResearchMapConclusion"]): GovernanceRuntimeResearchMapNode["status"] {
  if (conclusion === "blocked") return "blocked";
  if (conclusion === "research-map-ready") return "mapped-preview";
  return "preview-only";
}

function buildMapNodes(conclusion: GovernanceRuntimeResearchMapPreview["runtimeResearchMapConclusion"]): GovernanceRuntimeResearchMapNode[] {
  return withDeterministicIds(
    "gov-runtime-research-map-node",
    NODE_DEFINITIONS.map((item) => ({ ...item, status: statusFor(conclusion) })),
    (item) => `${item.category}:${item.key}:${item.stage}`
  );
}

function buildDependencyEdges(): GovernanceRuntimeResearchDependencyEdge[] {
  return withDeterministicIds(
    "gov-runtime-research-map-edge",
    EDGE_DEFINITIONS.map((item) => ({ ...item, futureOnly: true as const })),
    (item) => `${item.from}:${item.to}:${item.dependencyType}`
  );
}

function buildPrerequisiteChains(): GovernanceRuntimeResearchPrerequisiteChain[] {
  return withDeterministicIds(
    "gov-runtime-research-map-chain",
    CHAIN_DEFINITIONS.map((item) => ({ ...item, previewOnly: true as const })),
    (item) => item.key
  );
}

function buildStageGroups(nodes: GovernanceRuntimeResearchMapNode[]): GovernanceRuntimeResearchStageGroup[] {
  const groups = STAGE_DEFINITIONS.map((stage) => ({
    stage,
    totalNodes: nodes.filter((item) => item.stage === stage).length,
    previewOnly: true as const,
    reason: `Stage ${stage} is mapped for preview-only runtime governance research.`
  }));
  return withDeterministicIds("gov-runtime-research-map-stage", groups, (item) => item.stage);
}

function buildForbiddenBoundaries(): GovernanceRuntimeForbiddenDependencyBoundary[] {
  return withDeterministicIds(
    "gov-runtime-research-map-boundary",
    FORBIDDEN_BOUNDARIES.map((item) => ({ ...item, permanentlyForbidden: true as const })),
    (item) => item.category
  );
}

function buildFutureNotes(): GovernanceRuntimeFutureDependencyNote[] {
  return withDeterministicIds(
    "gov-runtime-research-map-note",
    FUTURE_NOTES.map((item) => ({ ...item, futureOnly: true as const })),
    (item) => `${item.category}:${item.reason}`
  );
}

function warningsFor(conclusion: GovernanceRuntimeResearchMapPreview["runtimeResearchMapConclusion"]): string[] {
  const warnings = [
    "Runtime governance research map preview is advisory only.",
    "Runtime research map was not applied or enforced.",
    "Runtime research index was not applied or enforced.",
    "Runtime research was not applied or enforced.",
    "Runtime final review approval was not granted.",
    "Runtime activation approval was not granted.",
    "Runtime activation was not executed.",
    "Runtime governance is not enabled.",
    "Runtime autonomy is not enabled.",
    "Runtime autonomous actions are not allowed.",
    "Runtime policies are not enforced.",
    "Runtime config activation is disabled.",
    "Runtime control plane behavior was not applied.",
    "Runtime sandbox execution is not allowed.",
    "Runtime behavior did not change.",
    "Repair orchestration did not change."
  ];
  if (conclusion === "source-missing") warnings.unshift("Runtime governance research index source is missing; research map preview is incomplete.");
  if (conclusion === "not-ready") warnings.unshift("Runtime governance research index is not ready for research map preview.");
  if (conclusion === "research-map-ready") warnings.unshift("Runtime governance research map preview is ready as preview-only documentation.");
  if (conclusion === "blocked") warnings.unshift("Runtime governance research index is blocked; research map preview is blocked.");
  return warnings;
}

export function buildGovernanceRuntimeResearchMapPreviewFromIndex(source: GovernanceRuntimeResearchIndexPreview): GovernanceRuntimeResearchMapPreview {
  const conclusion = conclusionFor(source);
  const researchMapScore = scoreFor(conclusion.runtimeResearchMapConclusion);
  const mapNodes = buildMapNodes(conclusion.runtimeResearchMapConclusion);
  const dependencyEdges = buildDependencyEdges();
  const prerequisiteChains = buildPrerequisiteChains();
  const stageGroups = buildStageGroups(mapNodes);
  const forbiddenDependencyBoundaries = buildForbiddenBoundaries();
  const futureOnlyDependencyNotes = buildFutureNotes();

  return {
    schemaVersion: 1,
    previewStatus: conclusion.previewStatus,
    sourceRuntimeResearchIndexStatus: source.previewStatus,
    runtimeResearchMapConclusion: conclusion.runtimeResearchMapConclusion,
    runtimeResearchMapApplied: false,
    runtimeResearchMapEnforced: false,
    runtimeResearchIndexApplied: false,
    runtimeResearchIndexEnforced: false,
    runtimeResearchApplied: false,
    runtimeResearchEnforced: false,
    runtimeFinalReviewApproved: false,
    runtimeFinalReviewApplied: false,
    runtimeFinalReviewEnforced: false,
    runtimeActivationApproved: false,
    runtimeActivationExecuted: false,
    runtimeGovernanceEnabled: false,
    runtimeAutonomyEnabled: false,
    runtimeAutonomyActionsAllowed: false,
    runtimePolicyEnforcementEnabled: false,
    runtimeConfigActivationEnabled: false,
    runtimeControlPlaneApplied: false,
    runtimeControlPlaneActivated: false,
    runtimeKillSwitchActivated: false,
    runtimeEmergencyStopExecuted: false,
    runtimeOperatorOverrideApplied: false,
    runtimeRollbackExecuted: false,
    runtimeObservabilityApplied: false,
    runtimeObservabilityEnforced: false,
    runtimeSafetyApplied: false,
    runtimeSafetyEnforced: false,
    runtimeSafetyActivated: false,
    runtimeSandboxExecutionAllowed: false,
    runtimeSandboxExecuted: false,
    runtimeMutationScopeExpanded: false,
    runtimeExternalExecutionAllowed: false,
    runtimePluginExecutionAllowed: false,
    runtimeScriptEvaluationAllowed: false,
    runtimeLearningEnabled: false,
    runtimeMlDecisioningEnabled: false,
    runtimeMultiAgentCoordinationEnabled: false,
    governanceBypassAllowed: false,
    applied: false,
    enforced: false,
    policyRuntimeMode: "preview-only",
    runtimeBehaviorChanged: false,
    governanceDecisionsChanged: false,
    repairOrchestrationChanged: false,
    safePatchEngineOnly: true,
    researchMapScore,
    mapNodes,
    dependencyEdges,
    prerequisiteChains,
    stageGroups,
    forbiddenDependencyBoundaries,
    futureOnlyDependencyNotes,
    summary: {
      researchMapScoreValue: researchMapScore.score,
      totalMapNodes: mapNodes.length,
      totalDependencyEdges: dependencyEdges.length,
      totalPrerequisiteChains: prerequisiteChains.length,
      totalStageGroups: stageGroups.length,
      totalForbiddenDependencyBoundaries: forbiddenDependencyBoundaries.length,
      totalFutureOnlyDependencyNotes: futureOnlyDependencyNotes.length,
      researchMapReady: conclusion.runtimeResearchMapConclusion === "research-map-ready"
    },
    warnings: warningsFor(conclusion.runtimeResearchMapConclusion),
    recommendedNextStage: conclusion.recommendedNextStage
  };
}

export function buildGovernanceRuntimeResearchMapPreview(projectRoot: string): GovernanceRuntimeResearchMapPreview {
  return buildGovernanceRuntimeResearchMapPreviewFromIndex(buildGovernanceRuntimeResearchIndexPreview(projectRoot));
}

export function renderGovernanceRuntimeResearchMapPreviewMarkdown(preview: GovernanceRuntimeResearchMapPreview): string {
  const lines = [
    "# AI Software Factory - Runtime Governance Research Map Preview",
    "",
    "Preview status:", preview.previewStatus,
    "", "Source runtime research index status:", preview.sourceRuntimeResearchIndexStatus,
    "", "Runtime research map conclusion:", preview.runtimeResearchMapConclusion,
    "", "Runtime research map applied:", String(preview.runtimeResearchMapApplied),
    "", "Runtime research map enforced:", String(preview.runtimeResearchMapEnforced),
    "", "Runtime governance enabled:", String(preview.runtimeGovernanceEnabled),
    "", "Runtime autonomy enabled:", String(preview.runtimeAutonomyEnabled),
    "", "Runtime autonomy actions allowed:", String(preview.runtimeAutonomyActionsAllowed),
    "", "Runtime activation approved:", String(preview.runtimeActivationApproved),
    "", "Runtime activation executed:", String(preview.runtimeActivationExecuted),
    "", "Runtime policy enforcement enabled:", String(preview.runtimePolicyEnforcementEnabled),
    "", "Runtime config activation enabled:", String(preview.runtimeConfigActivationEnabled),
    "", "Runtime control plane applied:", String(preview.runtimeControlPlaneApplied),
    "", "Runtime control plane activated:", String(preview.runtimeControlPlaneActivated),
    "", "Runtime kill switch activated:", String(preview.runtimeKillSwitchActivated),
    "", "Runtime emergency stop executed:", String(preview.runtimeEmergencyStopExecuted),
    "", "Runtime rollback executed:", String(preview.runtimeRollbackExecuted),
    "", "Runtime sandbox execution allowed:", String(preview.runtimeSandboxExecutionAllowed),
    "", "Runtime sandbox executed:", String(preview.runtimeSandboxExecuted),
    "", "Runtime mutation scope expanded:", String(preview.runtimeMutationScopeExpanded),
    "", "Runtime external execution allowed:", String(preview.runtimeExternalExecutionAllowed),
    "", "Runtime plugin execution allowed:", String(preview.runtimePluginExecutionAllowed),
    "", "Runtime script evaluation allowed:", String(preview.runtimeScriptEvaluationAllowed),
    "", "Runtime learning enabled:", String(preview.runtimeLearningEnabled),
    "", "Runtime ML decisioning enabled:", String(preview.runtimeMlDecisioningEnabled),
    "", "Runtime multi-agent coordination enabled:", String(preview.runtimeMultiAgentCoordinationEnabled),
    "", "Governance bypass allowed:", String(preview.governanceBypassAllowed),
    "", "Applied:", String(preview.applied),
    "", "Enforced:", String(preview.enforced),
    "", "Policy runtime mode:", preview.policyRuntimeMode,
    "", "Runtime behavior changed:", String(preview.runtimeBehaviorChanged),
    "", "Governance decisions changed:", String(preview.governanceDecisionsChanged),
    "", "Repair orchestration changed:", String(preview.repairOrchestrationChanged),
    "", "Safe Patch Engine only:", String(preview.safePatchEngineOnly),
    "", "Research map score:", String(preview.researchMapScore.score),
    "", "Research map rating:", preview.researchMapScore.rating,
    "", "Map node count:", String(preview.summary.totalMapNodes),
    "", "Dependency edge count:", String(preview.summary.totalDependencyEdges),
    "", "Prerequisite chain count:", String(preview.summary.totalPrerequisiteChains),
    "", "Stage group count:", String(preview.summary.totalStageGroups),
    "", "Forbidden dependency boundary count:", String(preview.summary.totalForbiddenDependencyBoundaries),
    "", "Future-only dependency note count:", String(preview.summary.totalFutureOnlyDependencyNotes),
    "", "Research map ready:", String(preview.summary.researchMapReady),
    "", "Recommended next stage:", preview.recommendedNextStage,
    "", "## Research Map Nodes", ""
  ];
  for (const item of preview.mapNodes) lines.push(`- [${item.category}/${item.stage}/${item.status}] ${item.id} ${item.key} - ${item.reason}`);
  lines.push("", "## Dependency Edges", "");
  for (const item of preview.dependencyEdges) lines.push(`- ${item.id} ${item.from} -> ${item.to} [${item.dependencyType}/futureOnly=${String(item.futureOnly)}] - ${item.reason}`);
  lines.push("", "## Prerequisite Chains", "");
  for (const item of preview.prerequisiteChains) lines.push(`- ${item.id} ${item.key} previewOnly=${String(item.previewOnly)} steps=${item.orderedSteps.join(" -> ")} - ${item.reason}`);
  lines.push("", "## Stage Groups", "");
  for (const item of preview.stageGroups) lines.push(`- [${item.stage}/nodes=${item.totalNodes}/previewOnly=${String(item.previewOnly)}] ${item.id} - ${item.reason}`);
  lines.push("", "## Forbidden Dependency Boundaries", "");
  for (const item of preview.forbiddenDependencyBoundaries) lines.push(`- [${item.category}] ${item.id} permanentlyForbidden=${String(item.permanentlyForbidden)} - ${item.reason}`);
  lines.push("", "## Future-only Dependency Notes", "");
  for (const item of preview.futureOnlyDependencyNotes) lines.push(`- [${item.category}] ${item.id} futureOnly=${String(item.futureOnly)} - ${item.reason}`);
  lines.push("", "## Warnings", "");
  for (const warning of preview.warnings) lines.push(`- ${warning}`);
  return `${lines.join("\n")}\n`;
}

export function renderGovernanceRuntimeResearchMapPreviewText(preview: GovernanceRuntimeResearchMapPreview): string {
  return renderGovernanceRuntimeResearchMapPreviewMarkdown(preview);
}

export function writeGovernanceRuntimeResearchMapPreviewArtifacts(projectRoot: string, preview: GovernanceRuntimeResearchMapPreview): { jsonPath: string; markdownPath: string } {
  const jsonPath = path.join(projectRoot, ARTIFACT_JSON_PATH);
  const markdownPath = path.join(projectRoot, ARTIFACT_MARKDOWN_PATH);
  fs.ensureDirSync(path.dirname(jsonPath));
  fs.writeFileSync(jsonPath, `${JSON.stringify(preview, null, 2)}\n`, "utf8");
  fs.writeFileSync(markdownPath, renderGovernanceRuntimeResearchMapPreviewMarkdown(preview), "utf8");
  return { jsonPath: ARTIFACT_JSON_PATH, markdownPath: ARTIFACT_MARKDOWN_PATH };
}
