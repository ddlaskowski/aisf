import fs from "fs-extra";
import path from "node:path";

import {
  buildGovernanceRuntimeResearchTimelinePreview,
  type GovernanceRuntimeResearchTimelinePreview
} from "./runtimeGovernanceResearchTimelinePreview.js";

export type GovernanceRuntimeResearchArchiveScore = {
  score: 0 | 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90 | 100;
  rating: "blocked" | "not-ready" | "partial-archive-readiness" | "research-archive-ready";
  reason: string;
};

export type GovernanceRuntimeResearchArchiveSection = {
  id: string;
  key: string;
  title: string;
  category: "runtime-safety" | "runtime-governance" | "runtime-review" | "post-v9-research" | "forbidden-capabilities" | "safe-patch-engine";
  status: "archived-preview" | "preview-only" | "blocked";
  reason: string;
};

export type GovernanceRuntimeResearchArchiveEntry = {
  id: string;
  version: string;
  title: string;
  archiveCategory:
    | "design"
    | "evidence"
    | "observability"
    | "control-plane"
    | "lifecycle"
    | "activation-readiness"
    | "certification"
    | "governance-review"
    | "boundary-review"
    | "freeze-review"
    | "final-review"
    | "research"
    | "index"
    | "map"
    | "timeline";
  previewOnly: true;
  reason: string;
};

export type GovernanceRuntimeResearchArchiveReference = {
  id: string;
  referenceType: "extends" | "summarizes" | "archives" | "indexes" | "maps" | "documents";
  source: string;
  target: string;
  futureOnly: true;
  reason: string;
};

export type GovernanceRuntimePreviewOnlyArchiveSummary = {
  id: string;
  category:
    | "runtime-governance"
    | "runtime-autonomy"
    | "runtime-activation"
    | "runtime-policy-enforcement"
    | "runtime-control-plane"
    | "runtime-observability";
  previewOnly: true;
  reason: string;
};

export type GovernanceRuntimeForbiddenCapabilityArchiveSummary = {
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

export type GovernanceRuntimeFutureArchivalNote = {
  id: string;
  category:
    | "future-human-review"
    | "future-runtime-research"
    | "future-certification-review"
    | "future-runtime-safety-review";
  futureOnly: true;
  reason: string;
};

export type GovernanceRuntimeResearchArchivePreview = {
  schemaVersion: 1;
  previewStatus: "not-created" | "created" | "blocked";
  sourceRuntimeResearchTimelineStatus: "not-created" | "created" | "blocked";
  runtimeResearchArchiveConclusion: "source-missing" | "not-ready" | "research-archive-ready" | "blocked";
  runtimeResearchArchiveApplied: false;
  runtimeResearchArchiveEnforced: false;
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
  researchArchiveScore: GovernanceRuntimeResearchArchiveScore;
  archiveSections: GovernanceRuntimeResearchArchiveSection[];
  archiveEntries: GovernanceRuntimeResearchArchiveEntry[];
  archiveReferences: GovernanceRuntimeResearchArchiveReference[];
  previewOnlyArchiveSummaries: GovernanceRuntimePreviewOnlyArchiveSummary[];
  forbiddenCapabilityArchiveSummaries: GovernanceRuntimeForbiddenCapabilityArchiveSummary[];
  futureOnlyArchivalNotes: GovernanceRuntimeFutureArchivalNote[];
  summary: {
    researchArchiveScoreValue: number;
    totalArchiveSections: number;
    totalArchiveEntries: number;
    totalArchiveReferences: number;
    totalPreviewOnlyArchiveSummaries: number;
    totalForbiddenCapabilityArchiveSummaries: number;
    totalFutureOnlyArchivalNotes: number;
    researchArchiveReady: boolean;
  };
  warnings: string[];
  recommendedNextStage:
    | "continue-preview-only-research"
    | "prepare-runtime-governance-research-catalog-preview"
    | "blocked";
};

const ARTIFACT_JSON_PATH = ".factory/governance/runtime-governance-research-archive-preview.json";
const ARTIFACT_MARKDOWN_PATH = ".factory/governance/runtime-governance-research-archive-preview.md";

const SECTION_DEFINITIONS: Array<Omit<GovernanceRuntimeResearchArchiveSection, "id" | "status">> = [
  { key: "forbidden-capabilities-archive", title: "Forbidden capabilities archive", category: "forbidden-capabilities", reason: "Forbidden runtime capabilities are consolidated as permanently forbidden archive summaries." },
  { key: "post-v9-research-archive", title: "Post-v9 research archive", category: "post-v9-research", reason: "Post-v9 runtime research, index, map, timeline, and archive previews are grouped for documentation continuity." },
  { key: "runtime-governance-archive", title: "Runtime governance archive", category: "runtime-governance", reason: "Runtime governance preview stages are archived without enabling runtime governance." },
  { key: "runtime-review-archive", title: "Runtime review archive", category: "runtime-review", reason: "Runtime certification, governance review, boundary, freeze, and final review previews are archived without approval." },
  { key: "runtime-safety-archive", title: "Runtime safety archive", category: "runtime-safety", reason: "Runtime safety design, evidence, and observability previews are archived as preview-only safety architecture." },
  { key: "safe-patch-engine-archive", title: "Safe Patch Engine archive", category: "safe-patch-engine", reason: "Safe Patch Engine exclusivity is preserved as the only mutation layer in the archive preview." }
];

const ENTRY_DEFINITIONS: Array<Omit<GovernanceRuntimeResearchArchiveEntry, "id" | "previewOnly">> = [
  { version: "v8.0", title: "Runtime safety design preview", archiveCategory: "design", reason: "Runtime safety design preview is archived as preview-only architecture." },
  { version: "v8.1", title: "Runtime safety evidence preview", archiveCategory: "evidence", reason: "Runtime safety evidence preview is archived as preview-only architecture." },
  { version: "v8.2", title: "Runtime safety observability preview", archiveCategory: "observability", reason: "Runtime safety observability preview is archived as preview-only architecture." },
  { version: "v8.3", title: "Runtime control plane preview", archiveCategory: "control-plane", reason: "Runtime control plane preview is archived without applying controls." },
  { version: "v8.4", title: "Runtime lifecycle preview", archiveCategory: "lifecycle", reason: "Runtime lifecycle preview is archived without lifecycle transitions." },
  { version: "v8.5", title: "Runtime activation readiness preview", archiveCategory: "activation-readiness", reason: "Runtime activation readiness preview is archived without activation." },
  { version: "v8.6", title: "Runtime safety certification preview", archiveCategory: "certification", reason: "Runtime safety certification preview is archived without certification application." },
  { version: "v8.7", title: "Runtime activation governance review preview", archiveCategory: "governance-review", reason: "Runtime activation governance review preview is archived without approval." },
  { version: "v8.8", title: "Runtime activation boundary preview", archiveCategory: "boundary-review", reason: "Runtime activation boundary preview is archived without boundary enforcement." },
  { version: "v8.9", title: "Runtime activation freeze preview", archiveCategory: "freeze-review", reason: "Runtime activation freeze preview is archived without freeze execution." },
  { version: "v9.0", title: "Runtime safety final review preview", archiveCategory: "final-review", reason: "Runtime safety final review preview is archived without final approval." },
  { version: "v9.1", title: "Post-v9 runtime research preview", archiveCategory: "research", reason: "Post-v9 runtime research preview is archived as preview-only research." },
  { version: "v9.2", title: "Runtime governance research index preview", archiveCategory: "index", reason: "Runtime governance research index preview is archived as preview-only indexing." },
  { version: "v9.3", title: "Runtime governance research map preview", archiveCategory: "map", reason: "Runtime governance research map preview is archived as preview-only mapping." },
  { version: "v9.4", title: "Runtime governance research timeline preview", archiveCategory: "timeline", reason: "Runtime governance research timeline preview is archived as preview-only timeline documentation." }
];

const REFERENCE_DEFINITIONS: Array<Omit<GovernanceRuntimeResearchArchiveReference, "id" | "futureOnly">> = [
  { referenceType: "extends", source: "runtime-safety-design-preview", target: "runtime-safety-evidence-preview", reason: "Evidence preview extends design preview in the archive chain." },
  { referenceType: "extends", source: "runtime-safety-evidence-preview", target: "runtime-safety-observability-preview", reason: "Observability preview extends evidence preview in the archive chain." },
  { referenceType: "extends", source: "runtime-safety-observability-preview", target: "runtime-control-plane-preview", reason: "Control-plane preview extends observability preview in the archive chain." },
  { referenceType: "extends", source: "runtime-control-plane-preview", target: "runtime-lifecycle-preview", reason: "Lifecycle preview extends control-plane preview in the archive chain." },
  { referenceType: "extends", source: "runtime-lifecycle-preview", target: "runtime-activation-readiness-preview", reason: "Activation readiness preview extends lifecycle preview in the archive chain." },
  { referenceType: "documents", source: "runtime-activation-readiness-preview", target: "runtime-safety-certification-preview", reason: "Certification preview documents readiness posture in the archive chain." },
  { referenceType: "documents", source: "runtime-safety-certification-preview", target: "runtime-activation-governance-review-preview", reason: "Governance review preview documents certification posture in the archive chain." },
  { referenceType: "documents", source: "runtime-activation-governance-review-preview", target: "runtime-activation-boundary-preview", reason: "Boundary preview documents governance review posture in the archive chain." },
  { referenceType: "documents", source: "runtime-activation-boundary-preview", target: "runtime-activation-freeze-preview", reason: "Freeze preview documents boundary posture in the archive chain." },
  { referenceType: "summarizes", source: "runtime-activation-freeze-preview", target: "runtime-safety-final-review-preview", reason: "Final review preview summarizes freeze posture in the archive chain." },
  { referenceType: "summarizes", source: "runtime-safety-final-review-preview", target: "post-v9-runtime-research-preview", reason: "Post-v9 research preview summarizes final review posture in the archive chain." },
  { referenceType: "indexes", source: "post-v9-runtime-research-preview", target: "runtime-governance-research-index-preview", reason: "Research index preview indexes post-v9 runtime research in the archive chain." },
  { referenceType: "maps", source: "runtime-governance-research-index-preview", target: "runtime-governance-research-map-preview", reason: "Research map preview maps indexed runtime research in the archive chain." },
  { referenceType: "documents", source: "runtime-governance-research-map-preview", target: "runtime-governance-research-timeline-preview", reason: "Research timeline preview documents mapped runtime governance progression." },
  { referenceType: "archives", source: "runtime-governance-research-timeline-preview", target: "runtime-governance-research-archive-preview", reason: "Research archive preview archives the timeline preview posture." },
  { referenceType: "documents", source: "safe-patch-engine-exclusivity", target: "runtime-governance-research-archive-preview", reason: "Safe Patch Engine exclusivity is preserved throughout archival documentation." }
];

const PREVIEW_ONLY_SUMMARY_DEFINITIONS: Array<Omit<GovernanceRuntimePreviewOnlyArchiveSummary, "id" | "previewOnly">> = [
  { category: "runtime-activation", reason: "Runtime activation remains not approved and not executed in the archive preview." },
  { category: "runtime-autonomy", reason: "Runtime autonomy remains disabled in the archive preview." },
  { category: "runtime-control-plane", reason: "Runtime control plane remains preview-only and is not applied in the archive preview." },
  { category: "runtime-governance", reason: "Runtime governance remains preview-only and disabled in the archive preview." },
  { category: "runtime-observability", reason: "Runtime observability remains preview-only and is not enforced in the archive preview." },
  { category: "runtime-policy-enforcement", reason: "Runtime policy enforcement remains disabled in the archive preview." }
];

const FORBIDDEN_SUMMARY_DEFINITIONS: Array<Omit<GovernanceRuntimeForbiddenCapabilityArchiveSummary, "id" | "permanentlyForbidden">> = [
  { category: "mutation-scope-expansion", reason: "Mutation scope expansion remains forbidden in the archive preview." },
  { category: "runtime-autonomy", reason: "Runtime autonomy enablement remains forbidden in the archive preview." },
  { category: "runtime-learning", reason: "Runtime learning remains forbidden in the archive preview." },
  { category: "runtime-ml-decisioning", reason: "ML/vector DB governance remains forbidden in the archive preview." },
  { category: "runtime-multi-agent-coordination", reason: "Uncontrolled multi-agent coordination remains forbidden in the archive preview." },
  { category: "runtime-plugin-execution", reason: "Runtime plugin execution remains forbidden in the archive preview." },
  { category: "runtime-policy-enforcement", reason: "Runtime policy enforcement remains forbidden in the archive preview." },
  { category: "runtime-script-execution", reason: "Runtime script evaluation remains forbidden in the archive preview." },
  { category: "safe-patch-engine-bypass", reason: "Safe Patch Engine bypass remains forbidden in the archive preview." }
];

const FUTURE_NOTE_DEFINITIONS: Array<Omit<GovernanceRuntimeFutureArchivalNote, "id" | "futureOnly">> = [
  { category: "future-certification-review", reason: "Future runtime systems require certification review before any runtime governance system could be considered." },
  { category: "future-human-review", reason: "Future runtime systems require explicit human approval before any activation could be considered." },
  { category: "future-human-review", reason: "Future runtime systems require separate human review outside this archive preview." },
  { category: "future-runtime-research", reason: "Future runtime systems must preserve Safe Patch Engine exclusivity." },
  { category: "future-runtime-safety-review", reason: "Future runtime systems require freeze validation before any activation could be considered." },
  { category: "future-runtime-safety-review", reason: "Future runtime systems require rollback validation before any activation could be considered." }
];

function withDeterministicIds<T>(prefix: string, items: T[], sortKey: (item: T) => string): Array<T & { id: string }> {
  return [...items]
    .sort((a, b) => sortKey(a).localeCompare(sortKey(b)))
    .map((item, index) => ({ id: `${prefix}-${String(index + 1).padStart(3, "0")}`, ...item }));
}

function conclusionFor(source: GovernanceRuntimeResearchTimelinePreview): Pick<GovernanceRuntimeResearchArchivePreview, "previewStatus" | "runtimeResearchArchiveConclusion" | "recommendedNextStage"> {
  if (source.previewStatus === "not-created") {
    return { previewStatus: "not-created", runtimeResearchArchiveConclusion: "source-missing", recommendedNextStage: "continue-preview-only-research" };
  }
  if (source.previewStatus === "blocked") {
    return { previewStatus: "blocked", runtimeResearchArchiveConclusion: "blocked", recommendedNextStage: "blocked" };
  }
  if (source.runtimeResearchTimelineConclusion === "research-timeline-ready") {
    return { previewStatus: "created", runtimeResearchArchiveConclusion: "research-archive-ready", recommendedNextStage: "prepare-runtime-governance-research-catalog-preview" };
  }
  return { previewStatus: "created", runtimeResearchArchiveConclusion: "not-ready", recommendedNextStage: "continue-preview-only-research" };
}

function scoreFor(conclusion: GovernanceRuntimeResearchArchivePreview["runtimeResearchArchiveConclusion"]): GovernanceRuntimeResearchArchiveScore {
  if (conclusion === "blocked") return { score: 0, rating: "blocked", reason: "Runtime governance research archive preview is blocked by source status." };
  if (conclusion === "source-missing") return { score: 20, rating: "not-ready", reason: "Runtime governance research timeline preview is missing." };
  if (conclusion === "not-ready") return { score: 40, rating: "partial-archive-readiness", reason: "Runtime governance research timeline exists but is not ready for archive preview." };
  return { score: 80, rating: "research-archive-ready", reason: "Runtime governance research archive is ready as preview-only documentation." };
}

function statusFor(conclusion: GovernanceRuntimeResearchArchivePreview["runtimeResearchArchiveConclusion"]): GovernanceRuntimeResearchArchiveSection["status"] {
  if (conclusion === "blocked") return "blocked";
  if (conclusion === "research-archive-ready") return "archived-preview";
  return "preview-only";
}

function buildArchiveSections(conclusion: GovernanceRuntimeResearchArchivePreview["runtimeResearchArchiveConclusion"]): GovernanceRuntimeResearchArchiveSection[] {
  return withDeterministicIds(
    "gov-runtime-research-archive-section",
    SECTION_DEFINITIONS.map((item) => ({ ...item, status: statusFor(conclusion) })),
    (item) => `${item.category}:${item.key}:${item.title}`
  );
}

function buildArchiveEntries(): GovernanceRuntimeResearchArchiveEntry[] {
  return withDeterministicIds(
    "gov-runtime-research-archive-entry",
    ENTRY_DEFINITIONS.map((item) => ({ ...item, previewOnly: true as const })),
    (item) => `${item.version}:${item.archiveCategory}:${item.title}`
  );
}

function buildArchiveReferences(): GovernanceRuntimeResearchArchiveReference[] {
  return withDeterministicIds(
    "gov-runtime-research-archive-reference",
    REFERENCE_DEFINITIONS.map((item) => ({ ...item, futureOnly: true as const })),
    (item) => `${item.source}:${item.target}:${item.referenceType}`
  );
}

function buildPreviewOnlySummaries(): GovernanceRuntimePreviewOnlyArchiveSummary[] {
  return withDeterministicIds(
    "gov-runtime-research-archive-preview",
    PREVIEW_ONLY_SUMMARY_DEFINITIONS.map((item) => ({ ...item, previewOnly: true as const })),
    (item) => item.category
  );
}

function buildForbiddenSummaries(): GovernanceRuntimeForbiddenCapabilityArchiveSummary[] {
  return withDeterministicIds(
    "gov-runtime-research-archive-forbidden",
    FORBIDDEN_SUMMARY_DEFINITIONS.map((item) => ({ ...item, permanentlyForbidden: true as const })),
    (item) => item.category
  );
}

function buildFutureNotes(): GovernanceRuntimeFutureArchivalNote[] {
  return withDeterministicIds(
    "gov-runtime-research-archive-note",
    FUTURE_NOTE_DEFINITIONS.map((item) => ({ ...item, futureOnly: true as const })),
    (item) => `${item.category}:${item.reason}`
  );
}

function warningsFor(conclusion: GovernanceRuntimeResearchArchivePreview["runtimeResearchArchiveConclusion"]): string[] {
  const warnings = [
    "Runtime governance research archive preview is advisory only.",
    "Runtime research archive was not applied or enforced.",
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
  if (conclusion === "source-missing") warnings.unshift("Runtime governance research timeline source is missing; research archive preview is incomplete.");
  if (conclusion === "not-ready") warnings.unshift("Runtime governance research timeline is not ready for research archive preview.");
  if (conclusion === "research-archive-ready") warnings.unshift("Runtime governance research archive preview is ready as preview-only documentation.");
  if (conclusion === "blocked") warnings.unshift("Runtime governance research timeline is blocked; research archive preview is blocked.");
  return warnings;
}

export function buildGovernanceRuntimeResearchArchivePreviewFromTimeline(source: GovernanceRuntimeResearchTimelinePreview): GovernanceRuntimeResearchArchivePreview {
  const conclusion = conclusionFor(source);
  const researchArchiveScore = scoreFor(conclusion.runtimeResearchArchiveConclusion);
  const archiveSections = buildArchiveSections(conclusion.runtimeResearchArchiveConclusion);
  const archiveEntries = buildArchiveEntries();
  const archiveReferences = buildArchiveReferences();
  const previewOnlyArchiveSummaries = buildPreviewOnlySummaries();
  const forbiddenCapabilityArchiveSummaries = buildForbiddenSummaries();
  const futureOnlyArchivalNotes = buildFutureNotes();

  return {
    schemaVersion: 1,
    previewStatus: conclusion.previewStatus,
    sourceRuntimeResearchTimelineStatus: source.previewStatus,
    runtimeResearchArchiveConclusion: conclusion.runtimeResearchArchiveConclusion,
    runtimeResearchArchiveApplied: false,
    runtimeResearchArchiveEnforced: false,
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
    researchArchiveScore,
    archiveSections,
    archiveEntries,
    archiveReferences,
    previewOnlyArchiveSummaries,
    forbiddenCapabilityArchiveSummaries,
    futureOnlyArchivalNotes,
    summary: {
      researchArchiveScoreValue: researchArchiveScore.score,
      totalArchiveSections: archiveSections.length,
      totalArchiveEntries: archiveEntries.length,
      totalArchiveReferences: archiveReferences.length,
      totalPreviewOnlyArchiveSummaries: previewOnlyArchiveSummaries.length,
      totalForbiddenCapabilityArchiveSummaries: forbiddenCapabilityArchiveSummaries.length,
      totalFutureOnlyArchivalNotes: futureOnlyArchivalNotes.length,
      researchArchiveReady: conclusion.runtimeResearchArchiveConclusion === "research-archive-ready"
    },
    warnings: warningsFor(conclusion.runtimeResearchArchiveConclusion),
    recommendedNextStage: conclusion.recommendedNextStage
  };
}

export function buildGovernanceRuntimeResearchArchivePreview(projectRoot: string): GovernanceRuntimeResearchArchivePreview {
  return buildGovernanceRuntimeResearchArchivePreviewFromTimeline(buildGovernanceRuntimeResearchTimelinePreview(projectRoot));
}

export function renderGovernanceRuntimeResearchArchivePreviewMarkdown(preview: GovernanceRuntimeResearchArchivePreview): string {
  const lines = [
    "# AI Software Factory - Runtime Governance Research Archive Preview",
    "",
    "Preview status:", preview.previewStatus,
    "", "Source runtime research timeline status:", preview.sourceRuntimeResearchTimelineStatus,
    "", "Runtime research archive conclusion:", preview.runtimeResearchArchiveConclusion,
    "", "Runtime research archive applied:", String(preview.runtimeResearchArchiveApplied),
    "", "Runtime research archive enforced:", String(preview.runtimeResearchArchiveEnforced),
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
    "", "Research archive score:", String(preview.researchArchiveScore.score),
    "", "Research archive rating:", preview.researchArchiveScore.rating,
    "", "Archive section count:", String(preview.summary.totalArchiveSections),
    "", "Archive entry count:", String(preview.summary.totalArchiveEntries),
    "", "Archive reference count:", String(preview.summary.totalArchiveReferences),
    "", "Preview-only archive summary count:", String(preview.summary.totalPreviewOnlyArchiveSummaries),
    "", "Forbidden capability archive summary count:", String(preview.summary.totalForbiddenCapabilityArchiveSummaries),
    "", "Future-only archival note count:", String(preview.summary.totalFutureOnlyArchivalNotes),
    "", "Research archive ready:", String(preview.summary.researchArchiveReady),
    "", "Recommended next stage:", preview.recommendedNextStage,
    "", "## Archive Sections", ""
  ];
  for (const item of preview.archiveSections) lines.push(`- [${item.category}/${item.status}] ${item.id} ${item.key} - ${item.title}: ${item.reason}`);
  lines.push("", "## Archive Entries", "");
  for (const item of preview.archiveEntries) lines.push(`- [${item.version}/${item.archiveCategory}] ${item.id} ${item.title} previewOnly=${String(item.previewOnly)} - ${item.reason}`);
  lines.push("", "## Archive References", "");
  for (const item of preview.archiveReferences) lines.push(`- ${item.id} ${item.source} -> ${item.target} [${item.referenceType}/futureOnly=${String(item.futureOnly)}] - ${item.reason}`);
  lines.push("", "## Preview-only Archive Summaries", "");
  for (const item of preview.previewOnlyArchiveSummaries) lines.push(`- [${item.category}] ${item.id} previewOnly=${String(item.previewOnly)} - ${item.reason}`);
  lines.push("", "## Forbidden Capability Archive Summaries", "");
  for (const item of preview.forbiddenCapabilityArchiveSummaries) lines.push(`- [${item.category}] ${item.id} permanentlyForbidden=${String(item.permanentlyForbidden)} - ${item.reason}`);
  lines.push("", "## Future-only Archival Notes", "");
  for (const item of preview.futureOnlyArchivalNotes) lines.push(`- [${item.category}] ${item.id} futureOnly=${String(item.futureOnly)} - ${item.reason}`);
  lines.push("", "## Warnings", "");
  for (const warning of preview.warnings) lines.push(`- ${warning}`);
  return `${lines.join("\n")}\n`;
}

export function renderGovernanceRuntimeResearchArchivePreviewText(preview: GovernanceRuntimeResearchArchivePreview): string {
  return renderGovernanceRuntimeResearchArchivePreviewMarkdown(preview);
}

export function writeGovernanceRuntimeResearchArchivePreviewArtifacts(projectRoot: string, preview: GovernanceRuntimeResearchArchivePreview): { jsonPath: string; markdownPath: string } {
  const jsonPath = path.join(projectRoot, ARTIFACT_JSON_PATH);
  const markdownPath = path.join(projectRoot, ARTIFACT_MARKDOWN_PATH);
  fs.ensureDirSync(path.dirname(jsonPath));
  fs.writeFileSync(jsonPath, `${JSON.stringify(preview, null, 2)}\n`, "utf8");
  fs.writeFileSync(markdownPath, renderGovernanceRuntimeResearchArchivePreviewMarkdown(preview), "utf8");
  return { jsonPath: ARTIFACT_JSON_PATH, markdownPath: ARTIFACT_MARKDOWN_PATH };
}
