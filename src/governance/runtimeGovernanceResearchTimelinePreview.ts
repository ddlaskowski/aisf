import fs from "fs-extra";
import path from "node:path";

import {
  buildGovernanceRuntimeResearchMapPreview,
  type GovernanceRuntimeResearchMapPreview
} from "./runtimeGovernanceResearchMapPreview.js";

export type GovernanceRuntimeResearchTimelineScore = {
  score: 0 | 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90 | 100;
  rating: "blocked" | "not-ready" | "partial-timeline-readiness" | "research-timeline-ready";
  reason: string;
};

export type GovernanceRuntimeResearchTimelineStage = {
  id: string;
  version: string;
  category: "runtime-safety" | "runtime-governance" | "runtime-review" | "post-v9-research";
  title: string;
  stageOrder: number;
  status: "timeline-preview" | "preview-only" | "blocked";
  reason: string;
};

export type GovernanceRuntimeMaturityProgressionEntry = {
  id: string;
  fromVersion: string;
  toVersion: string;
  progressionType: "extends" | "hardens" | "reviews" | "indexes" | "maps" | "researches";
  futureOnly: true;
  reason: string;
};

export type GovernanceRuntimeResearchMilestone = {
  id: string;
  milestone:
    | "runtime-safety-design"
    | "runtime-safety-evidence"
    | "runtime-observability"
    | "runtime-control-plane"
    | "runtime-lifecycle"
    | "runtime-activation-readiness"
    | "runtime-certification"
    | "runtime-governance-review"
    | "runtime-boundary-review"
    | "runtime-freeze-review"
    | "runtime-final-review"
    | "post-v9-runtime-research"
    | "runtime-research-index"
    | "runtime-research-map";
  achievedInVersion: string;
  previewOnly: true;
  reason: string;
};

export type GovernanceRuntimePreviewOnlyMaturityBoundary = {
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

export type GovernanceRuntimeFutureProgressionNote = {
  id: string;
  category:
    | "future-human-review"
    | "future-runtime-research"
    | "future-certification-review"
    | "future-runtime-safety-review";
  futureOnly: true;
  reason: string;
};

export type GovernanceRuntimeResearchTimelinePreview = {
  schemaVersion: 1;
  previewStatus: "not-created" | "created" | "blocked";
  sourceRuntimeResearchMapStatus: "not-created" | "created" | "blocked";
  runtimeResearchTimelineConclusion: "source-missing" | "not-ready" | "research-timeline-ready" | "blocked";
  runtimeResearchTimelineApplied: false;
  runtimeResearchTimelineEnforced: false;
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
  researchTimelineScore: GovernanceRuntimeResearchTimelineScore;
  timelineStages: GovernanceRuntimeResearchTimelineStage[];
  maturityProgressionEntries: GovernanceRuntimeMaturityProgressionEntry[];
  researchMilestones: GovernanceRuntimeResearchMilestone[];
  previewOnlyMaturityBoundaries: GovernanceRuntimePreviewOnlyMaturityBoundary[];
  futureOnlyProgressionNotes: GovernanceRuntimeFutureProgressionNote[];
  summary: {
    researchTimelineScoreValue: number;
    totalTimelineStages: number;
    totalMaturityProgressionEntries: number;
    totalResearchMilestones: number;
    totalPreviewOnlyMaturityBoundaries: number;
    totalFutureOnlyProgressionNotes: number;
    researchTimelineReady: boolean;
  };
  warnings: string[];
  recommendedNextStage:
    | "continue-preview-only-research"
    | "prepare-runtime-governance-research-archive-preview"
    | "blocked";
};

const ARTIFACT_JSON_PATH = ".factory/governance/runtime-governance-research-timeline-preview.json";
const ARTIFACT_MARKDOWN_PATH = ".factory/governance/runtime-governance-research-timeline-preview.md";

const STAGE_DEFINITIONS: Array<Omit<GovernanceRuntimeResearchTimelineStage, "id" | "status">> = [
  { version: "v8.0", category: "runtime-safety", title: "Runtime safety design preview", stageOrder: 1, reason: "Runtime safety design architecture was introduced as preview-only." },
  { version: "v8.1", category: "runtime-safety", title: "Runtime safety evidence preview", stageOrder: 2, reason: "Runtime safety evidence architecture extended safety design without applying evidence." },
  { version: "v8.2", category: "runtime-safety", title: "Runtime safety observability preview", stageOrder: 3, reason: "Runtime observability architecture was documented without telemetry execution." },
  { version: "v8.3", category: "runtime-governance", title: "Runtime control plane preview", stageOrder: 4, reason: "Runtime control-plane architecture was documented without control execution." },
  { version: "v8.4", category: "runtime-governance", title: "Runtime lifecycle preview", stageOrder: 5, reason: "Runtime lifecycle architecture was documented without lifecycle transitions." },
  { version: "v8.5", category: "runtime-governance", title: "Runtime activation readiness preview", stageOrder: 6, reason: "Runtime activation readiness was documented without activation." },
  { version: "v8.6", category: "runtime-review", title: "Runtime safety certification preview", stageOrder: 7, reason: "Runtime certification architecture was documented without certification application." },
  { version: "v8.7", category: "runtime-review", title: "Runtime activation governance review preview", stageOrder: 8, reason: "Runtime governance review architecture was documented without activation approval." },
  { version: "v8.8", category: "runtime-review", title: "Runtime activation boundary preview", stageOrder: 9, reason: "Runtime activation boundaries were documented without boundary enforcement." },
  { version: "v8.9", category: "runtime-review", title: "Runtime activation freeze preview", stageOrder: 10, reason: "Runtime freeze conditions were documented without freeze execution." },
  { version: "v9.0", category: "runtime-review", title: "Runtime safety final review preview", stageOrder: 11, reason: "Runtime safety final review summarized the preview chain without approval." },
  { version: "v9.1", category: "post-v9-research", title: "Post-v9 runtime research preview", stageOrder: 12, reason: "Post-v9 runtime research documented the disabled runtime posture." },
  { version: "v9.2", category: "post-v9-research", title: "Runtime governance research index preview", stageOrder: 13, reason: "Runtime governance research index organized the research chain." },
  { version: "v9.3", category: "post-v9-research", title: "Runtime governance research map preview", stageOrder: 14, reason: "Runtime governance research map documented dependency relationships." }
];

const PROGRESSION_DEFINITIONS: Array<Omit<GovernanceRuntimeMaturityProgressionEntry, "id" | "futureOnly">> = [
  { fromVersion: "v8.0", toVersion: "v8.1", progressionType: "extends", reason: "Evidence preview extends design preview." },
  { fromVersion: "v8.1", toVersion: "v8.2", progressionType: "extends", reason: "Observability preview extends evidence preview." },
  { fromVersion: "v8.2", toVersion: "v8.3", progressionType: "extends", reason: "Control-plane preview extends observability preview." },
  { fromVersion: "v8.3", toVersion: "v8.4", progressionType: "hardens", reason: "Lifecycle preview hardens control-plane architecture." },
  { fromVersion: "v8.4", toVersion: "v8.5", progressionType: "hardens", reason: "Activation readiness preview hardens lifecycle architecture." },
  { fromVersion: "v8.5", toVersion: "v8.6", progressionType: "reviews", reason: "Certification preview reviews activation readiness." },
  { fromVersion: "v8.6", toVersion: "v8.7", progressionType: "reviews", reason: "Governance review preview reviews certification posture." },
  { fromVersion: "v8.7", toVersion: "v8.8", progressionType: "hardens", reason: "Boundary preview hardens governance review posture." },
  { fromVersion: "v8.8", toVersion: "v8.9", progressionType: "hardens", reason: "Freeze preview hardens activation boundary posture." },
  { fromVersion: "v8.9", toVersion: "v9.0", progressionType: "reviews", reason: "Final review preview reviews freeze posture." },
  { fromVersion: "v9.0", toVersion: "v9.1", progressionType: "researches", reason: "Post-v9 research summarizes final review architecture." },
  { fromVersion: "v9.1", toVersion: "v9.2", progressionType: "indexes", reason: "Research index preview indexes post-v9 research." },
  { fromVersion: "v9.2", toVersion: "v9.3", progressionType: "maps", reason: "Research map preview maps indexed runtime governance research." }
];

const MILESTONE_DEFINITIONS: Array<Omit<GovernanceRuntimeResearchMilestone, "id" | "previewOnly">> = [
  { milestone: "post-v9-runtime-research", achievedInVersion: "v9.1", reason: "Post-v9 runtime research architecture was established." },
  { milestone: "runtime-activation-readiness", achievedInVersion: "v8.5", reason: "Runtime activation readiness architecture was established." },
  { milestone: "runtime-boundary-review", achievedInVersion: "v8.8", reason: "Runtime boundary review architecture was established." },
  { milestone: "runtime-certification", achievedInVersion: "v8.6", reason: "Runtime certification architecture was established." },
  { milestone: "runtime-control-plane", achievedInVersion: "v8.3", reason: "Runtime control plane architecture was established." },
  { milestone: "runtime-final-review", achievedInVersion: "v9.0", reason: "Runtime final review architecture was established." },
  { milestone: "runtime-freeze-review", achievedInVersion: "v8.9", reason: "Runtime freeze review architecture was established." },
  { milestone: "runtime-governance-review", achievedInVersion: "v8.7", reason: "Runtime governance review architecture was established." },
  { milestone: "runtime-lifecycle", achievedInVersion: "v8.4", reason: "Runtime lifecycle architecture was established." },
  { milestone: "runtime-observability", achievedInVersion: "v8.2", reason: "Runtime observability architecture was established." },
  { milestone: "runtime-research-index", achievedInVersion: "v9.2", reason: "Runtime research indexing was established." },
  { milestone: "runtime-research-map", achievedInVersion: "v9.3", reason: "Runtime research mapping was established." },
  { milestone: "runtime-safety-design", achievedInVersion: "v8.0", reason: "Runtime safety architecture was established." },
  { milestone: "runtime-safety-evidence", achievedInVersion: "v8.1", reason: "Runtime safety evidence architecture was established." }
];

const BOUNDARY_DEFINITIONS: Array<Omit<GovernanceRuntimePreviewOnlyMaturityBoundary, "id" | "permanentlyForbidden">> = [
  { category: "mutation-scope-expansion", reason: "Mutation scope expansion remains permanently forbidden across the maturity timeline." },
  { category: "runtime-autonomy", reason: "Runtime autonomy enablement remains permanently forbidden across the maturity timeline." },
  { category: "runtime-learning", reason: "Runtime learning remains permanently forbidden across the maturity timeline." },
  { category: "runtime-ml-decisioning", reason: "ML/vector DB governance decisioning remains permanently forbidden across the maturity timeline." },
  { category: "runtime-multi-agent-coordination", reason: "Uncontrolled multi-agent coordination remains permanently forbidden across the maturity timeline." },
  { category: "runtime-plugin-execution", reason: "Runtime plugin execution remains permanently forbidden across the maturity timeline." },
  { category: "runtime-policy-enforcement", reason: "Runtime policy enforcement remains permanently forbidden across the maturity timeline." },
  { category: "runtime-script-execution", reason: "Runtime script execution remains permanently forbidden across the maturity timeline." },
  { category: "safe-patch-engine-bypass", reason: "Safe Patch Engine bypass remains permanently forbidden across the maturity timeline." }
];

const FUTURE_NOTE_DEFINITIONS: Array<Omit<GovernanceRuntimeFutureProgressionNote, "id" | "futureOnly">> = [
  { category: "future-certification-review", reason: "Future runtime systems require certification review." },
  { category: "future-human-review", reason: "Future runtime systems require explicit approval." },
  { category: "future-human-review", reason: "Future runtime systems require separate human review." },
  { category: "future-runtime-research", reason: "Future runtime systems must preserve Safe Patch Engine exclusivity." },
  { category: "future-runtime-safety-review", reason: "Future runtime systems require freeze validation." },
  { category: "future-runtime-safety-review", reason: "Future runtime systems require rollback validation." }
];

function withDeterministicIds<T>(prefix: string, items: T[], sortKey: (item: T) => string): Array<T & { id: string }> {
  return [...items]
    .sort((a, b) => sortKey(a).localeCompare(sortKey(b)))
    .map((item, index) => ({ id: `${prefix}-${String(index + 1).padStart(3, "0")}`, ...item }));
}

function conclusionFor(source: GovernanceRuntimeResearchMapPreview): Pick<GovernanceRuntimeResearchTimelinePreview, "previewStatus" | "runtimeResearchTimelineConclusion" | "recommendedNextStage"> {
  if (source.previewStatus === "not-created") {
    return { previewStatus: "not-created", runtimeResearchTimelineConclusion: "source-missing", recommendedNextStage: "continue-preview-only-research" };
  }
  if (source.previewStatus === "blocked") {
    return { previewStatus: "blocked", runtimeResearchTimelineConclusion: "blocked", recommendedNextStage: "blocked" };
  }
  if (source.runtimeResearchMapConclusion === "research-map-ready") {
    return { previewStatus: "created", runtimeResearchTimelineConclusion: "research-timeline-ready", recommendedNextStage: "prepare-runtime-governance-research-archive-preview" };
  }
  return { previewStatus: "created", runtimeResearchTimelineConclusion: "not-ready", recommendedNextStage: "continue-preview-only-research" };
}

function scoreFor(conclusion: GovernanceRuntimeResearchTimelinePreview["runtimeResearchTimelineConclusion"]): GovernanceRuntimeResearchTimelineScore {
  if (conclusion === "blocked") return { score: 0, rating: "blocked", reason: "Runtime governance research timeline preview is blocked by source status." };
  if (conclusion === "source-missing") return { score: 20, rating: "not-ready", reason: "Runtime governance research map preview is missing." };
  if (conclusion === "not-ready") return { score: 40, rating: "partial-timeline-readiness", reason: "Runtime governance research map exists but is not ready for timeline preview." };
  return { score: 80, rating: "research-timeline-ready", reason: "Runtime governance research timeline is ready as preview-only documentation." };
}

function statusFor(conclusion: GovernanceRuntimeResearchTimelinePreview["runtimeResearchTimelineConclusion"]): GovernanceRuntimeResearchTimelineStage["status"] {
  if (conclusion === "blocked") return "blocked";
  if (conclusion === "research-timeline-ready") return "timeline-preview";
  return "preview-only";
}

function buildTimelineStages(conclusion: GovernanceRuntimeResearchTimelinePreview["runtimeResearchTimelineConclusion"]): GovernanceRuntimeResearchTimelineStage[] {
  return withDeterministicIds(
    "gov-runtime-research-timeline-stage",
    STAGE_DEFINITIONS.map((item) => ({ ...item, status: statusFor(conclusion) })),
    (item) => `${String(item.stageOrder).padStart(3, "0")}:${item.version}:${item.category}`
  );
}

function buildProgressionEntries(): GovernanceRuntimeMaturityProgressionEntry[] {
  return withDeterministicIds(
    "gov-runtime-research-timeline-progression",
    PROGRESSION_DEFINITIONS.map((item) => ({ ...item, futureOnly: true as const })),
    (item) => `${item.fromVersion}:${item.toVersion}:${item.progressionType}`
  );
}

function buildMilestones(): GovernanceRuntimeResearchMilestone[] {
  return withDeterministicIds(
    "gov-runtime-research-timeline-milestone",
    MILESTONE_DEFINITIONS.map((item) => ({ ...item, previewOnly: true as const })),
    (item) => `${item.achievedInVersion}:${item.milestone}`
  );
}

function buildBoundaries(): GovernanceRuntimePreviewOnlyMaturityBoundary[] {
  return withDeterministicIds(
    "gov-runtime-research-timeline-boundary",
    BOUNDARY_DEFINITIONS.map((item) => ({ ...item, permanentlyForbidden: true as const })),
    (item) => item.category
  );
}

function buildFutureNotes(): GovernanceRuntimeFutureProgressionNote[] {
  return withDeterministicIds(
    "gov-runtime-research-timeline-note",
    FUTURE_NOTE_DEFINITIONS.map((item) => ({ ...item, futureOnly: true as const })),
    (item) => `${item.category}:${item.reason}`
  );
}

function warningsFor(conclusion: GovernanceRuntimeResearchTimelinePreview["runtimeResearchTimelineConclusion"]): string[] {
  const warnings = [
    "Runtime governance research timeline preview is advisory only.",
    "Runtime research timeline was not applied or enforced.",
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
  if (conclusion === "source-missing") warnings.unshift("Runtime governance research map source is missing; research timeline preview is incomplete.");
  if (conclusion === "not-ready") warnings.unshift("Runtime governance research map is not ready for research timeline preview.");
  if (conclusion === "research-timeline-ready") warnings.unshift("Runtime governance research timeline preview is ready as preview-only documentation.");
  if (conclusion === "blocked") warnings.unshift("Runtime governance research map is blocked; research timeline preview is blocked.");
  return warnings;
}

export function buildGovernanceRuntimeResearchTimelinePreviewFromMap(source: GovernanceRuntimeResearchMapPreview): GovernanceRuntimeResearchTimelinePreview {
  const conclusion = conclusionFor(source);
  const researchTimelineScore = scoreFor(conclusion.runtimeResearchTimelineConclusion);
  const timelineStages = buildTimelineStages(conclusion.runtimeResearchTimelineConclusion);
  const maturityProgressionEntries = buildProgressionEntries();
  const researchMilestones = buildMilestones();
  const previewOnlyMaturityBoundaries = buildBoundaries();
  const futureOnlyProgressionNotes = buildFutureNotes();

  return {
    schemaVersion: 1,
    previewStatus: conclusion.previewStatus,
    sourceRuntimeResearchMapStatus: source.previewStatus,
    runtimeResearchTimelineConclusion: conclusion.runtimeResearchTimelineConclusion,
    runtimeResearchTimelineApplied: false,
    runtimeResearchTimelineEnforced: false,
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
    researchTimelineScore,
    timelineStages,
    maturityProgressionEntries,
    researchMilestones,
    previewOnlyMaturityBoundaries,
    futureOnlyProgressionNotes,
    summary: {
      researchTimelineScoreValue: researchTimelineScore.score,
      totalTimelineStages: timelineStages.length,
      totalMaturityProgressionEntries: maturityProgressionEntries.length,
      totalResearchMilestones: researchMilestones.length,
      totalPreviewOnlyMaturityBoundaries: previewOnlyMaturityBoundaries.length,
      totalFutureOnlyProgressionNotes: futureOnlyProgressionNotes.length,
      researchTimelineReady: conclusion.runtimeResearchTimelineConclusion === "research-timeline-ready"
    },
    warnings: warningsFor(conclusion.runtimeResearchTimelineConclusion),
    recommendedNextStage: conclusion.recommendedNextStage
  };
}

export function buildGovernanceRuntimeResearchTimelinePreview(projectRoot: string): GovernanceRuntimeResearchTimelinePreview {
  return buildGovernanceRuntimeResearchTimelinePreviewFromMap(buildGovernanceRuntimeResearchMapPreview(projectRoot));
}

export function renderGovernanceRuntimeResearchTimelinePreviewMarkdown(preview: GovernanceRuntimeResearchTimelinePreview): string {
  const lines = [
    "# AI Software Factory - Runtime Governance Research Timeline Preview",
    "",
    "Preview status:", preview.previewStatus,
    "", "Source runtime research map status:", preview.sourceRuntimeResearchMapStatus,
    "", "Runtime research timeline conclusion:", preview.runtimeResearchTimelineConclusion,
    "", "Runtime research timeline applied:", String(preview.runtimeResearchTimelineApplied),
    "", "Runtime research timeline enforced:", String(preview.runtimeResearchTimelineEnforced),
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
    "", "Research timeline score:", String(preview.researchTimelineScore.score),
    "", "Research timeline rating:", preview.researchTimelineScore.rating,
    "", "Timeline stage count:", String(preview.summary.totalTimelineStages),
    "", "Maturity progression count:", String(preview.summary.totalMaturityProgressionEntries),
    "", "Research milestone count:", String(preview.summary.totalResearchMilestones),
    "", "Preview-only maturity boundary count:", String(preview.summary.totalPreviewOnlyMaturityBoundaries),
    "", "Future-only progression note count:", String(preview.summary.totalFutureOnlyProgressionNotes),
    "", "Research timeline ready:", String(preview.summary.researchTimelineReady),
    "", "Recommended next stage:", preview.recommendedNextStage,
    "", "## Timeline Stages", ""
  ];
  for (const item of preview.timelineStages) lines.push(`- [${item.version}/${item.category}/${item.status}] ${item.id} order=${item.stageOrder} ${item.title} - ${item.reason}`);
  lines.push("", "## Maturity Progression Entries", "");
  for (const item of preview.maturityProgressionEntries) lines.push(`- ${item.id} ${item.fromVersion} -> ${item.toVersion} [${item.progressionType}/futureOnly=${String(item.futureOnly)}] - ${item.reason}`);
  lines.push("", "## Research Milestones", "");
  for (const item of preview.researchMilestones) lines.push(`- ${item.id} ${item.milestone} achievedIn=${item.achievedInVersion} previewOnly=${String(item.previewOnly)} - ${item.reason}`);
  lines.push("", "## Preview-only Maturity Boundaries", "");
  for (const item of preview.previewOnlyMaturityBoundaries) lines.push(`- [${item.category}] ${item.id} permanentlyForbidden=${String(item.permanentlyForbidden)} - ${item.reason}`);
  lines.push("", "## Future-only Progression Notes", "");
  for (const item of preview.futureOnlyProgressionNotes) lines.push(`- [${item.category}] ${item.id} futureOnly=${String(item.futureOnly)} - ${item.reason}`);
  lines.push("", "## Warnings", "");
  for (const warning of preview.warnings) lines.push(`- ${warning}`);
  return `${lines.join("\n")}\n`;
}

export function renderGovernanceRuntimeResearchTimelinePreviewText(preview: GovernanceRuntimeResearchTimelinePreview): string {
  return renderGovernanceRuntimeResearchTimelinePreviewMarkdown(preview);
}

export function writeGovernanceRuntimeResearchTimelinePreviewArtifacts(projectRoot: string, preview: GovernanceRuntimeResearchTimelinePreview): { jsonPath: string; markdownPath: string } {
  const jsonPath = path.join(projectRoot, ARTIFACT_JSON_PATH);
  const markdownPath = path.join(projectRoot, ARTIFACT_MARKDOWN_PATH);
  fs.ensureDirSync(path.dirname(jsonPath));
  fs.writeFileSync(jsonPath, `${JSON.stringify(preview, null, 2)}\n`, "utf8");
  fs.writeFileSync(markdownPath, renderGovernanceRuntimeResearchTimelinePreviewMarkdown(preview), "utf8");
  return { jsonPath: ARTIFACT_JSON_PATH, markdownPath: ARTIFACT_MARKDOWN_PATH };
}
