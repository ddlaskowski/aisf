import fs from "fs-extra";
import path from "node:path";

import {
  buildGovernanceRuntimeResearchArchivePreview,
  type GovernanceRuntimeResearchArchivePreview
} from "./runtimeGovernanceResearchArchivePreview.js";

export type GovernanceRuntimeResearchCatalogScore = {
  score: 0 | 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90 | 100;
  rating: "blocked" | "not-ready" | "partial-catalog-readiness" | "research-catalog-ready";
  reason: string;
};

export type GovernanceRuntimeResearchCatalogGroup = {
  id: string;
  key: string;
  category: "runtime-safety" | "runtime-governance" | "runtime-review" | "post-v9-research" | "forbidden-capabilities" | "safe-patch-engine";
  totalEntries: number;
  previewOnly: true;
  reason: string;
};

export type GovernanceRuntimeResearchCatalogEntry = {
  id: string;
  version: string;
  title: string;
  artifactType:
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
    | "timeline"
    | "archive";
  previewOnly: true;
  reason: string;
};

export type GovernanceRuntimeResearchArtifactReference = {
  id: string;
  version: string;
  artifact:
    | "runtime-safety-design-preview"
    | "runtime-safety-evidence-preview"
    | "runtime-safety-observability-preview"
    | "runtime-control-plane-preview"
    | "runtime-lifecycle-preview"
    | "runtime-activation-readiness-preview"
    | "runtime-safety-certification-preview"
    | "runtime-activation-governance-review-preview"
    | "runtime-activation-boundary-preview"
    | "runtime-activation-freeze-preview"
    | "runtime-safety-final-review-preview"
    | "post-v9-runtime-research-preview"
    | "runtime-governance-research-index-preview"
    | "runtime-governance-research-map-preview"
    | "runtime-governance-research-timeline-preview"
    | "runtime-governance-research-archive-preview";
  futureOnly: true;
  reason: string;
};

export type GovernanceRuntimeResearchVersionSummary = {
  id: string;
  version: string;
  category: "runtime-safety" | "runtime-governance" | "runtime-review" | "post-v9-research";
  previewOnly: true;
  reason: string;
};

export type GovernanceRuntimePreviewOnlyPostureSummary = {
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

export type GovernanceRuntimeForbiddenCapabilitySummary = {
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

export type GovernanceRuntimeFutureCatalogNote = {
  id: string;
  category: "future-human-review" | "future-runtime-research" | "future-certification-review" | "future-runtime-safety-review";
  futureOnly: true;
  reason: string;
};

export type GovernanceRuntimeResearchCatalogPreview = {
  schemaVersion: 1;
  previewStatus: "not-created" | "created" | "blocked";
  sourceRuntimeResearchArchiveStatus: "not-created" | "created" | "blocked";
  runtimeResearchCatalogConclusion: "source-missing" | "not-ready" | "research-catalog-ready" | "blocked";
  runtimeResearchCatalogApplied: false;
  runtimeResearchCatalogEnforced: false;
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
  researchCatalogScore: GovernanceRuntimeResearchCatalogScore;
  catalogGroups: GovernanceRuntimeResearchCatalogGroup[];
  catalogEntries: GovernanceRuntimeResearchCatalogEntry[];
  artifactReferences: GovernanceRuntimeResearchArtifactReference[];
  versionSummaries: GovernanceRuntimeResearchVersionSummary[];
  previewOnlyPostureSummaries: GovernanceRuntimePreviewOnlyPostureSummary[];
  forbiddenCapabilitySummaries: GovernanceRuntimeForbiddenCapabilitySummary[];
  futureOnlyCatalogNotes: GovernanceRuntimeFutureCatalogNote[];
  summary: {
    researchCatalogScoreValue: number;
    totalCatalogGroups: number;
    totalCatalogEntries: number;
    totalArtifactReferences: number;
    totalVersionSummaries: number;
    totalPreviewOnlyPostureSummaries: number;
    totalForbiddenCapabilitySummaries: number;
    totalFutureOnlyCatalogNotes: number;
    researchCatalogReady: boolean;
  };
  warnings: string[];
  recommendedNextStage: "continue-preview-only-research" | "prepare-runtime-governance-research-registry-preview" | "blocked";
};

const ARTIFACT_JSON_PATH = ".factory/governance/runtime-governance-research-catalog-preview.json";
const ARTIFACT_MARKDOWN_PATH = ".factory/governance/runtime-governance-research-catalog-preview.md";

const CATALOG_ENTRIES: Array<Omit<GovernanceRuntimeResearchCatalogEntry, "id" | "previewOnly">> = [
  { version: "v8.0", title: "Runtime safety design preview", artifactType: "design", reason: "Runtime safety design preview is cataloged as preview-only architecture." },
  { version: "v8.1", title: "Runtime safety evidence preview", artifactType: "evidence", reason: "Runtime safety evidence preview is cataloged as preview-only architecture." },
  { version: "v8.2", title: "Runtime safety observability preview", artifactType: "observability", reason: "Runtime safety observability preview is cataloged as preview-only architecture." },
  { version: "v8.3", title: "Runtime control plane preview", artifactType: "control-plane", reason: "Runtime control plane preview is cataloged without applying controls." },
  { version: "v8.4", title: "Runtime lifecycle preview", artifactType: "lifecycle", reason: "Runtime lifecycle preview is cataloged without lifecycle transitions." },
  { version: "v8.5", title: "Runtime activation readiness preview", artifactType: "activation-readiness", reason: "Runtime activation readiness preview is cataloged without activation." },
  { version: "v8.6", title: "Runtime safety certification preview", artifactType: "certification", reason: "Runtime safety certification preview is cataloged without certification application." },
  { version: "v8.7", title: "Runtime activation governance review preview", artifactType: "governance-review", reason: "Runtime activation governance review preview is cataloged without approval." },
  { version: "v8.8", title: "Runtime activation boundary preview", artifactType: "boundary-review", reason: "Runtime activation boundary preview is cataloged without boundary enforcement." },
  { version: "v8.9", title: "Runtime activation freeze preview", artifactType: "freeze-review", reason: "Runtime activation freeze preview is cataloged without freeze execution." },
  { version: "v9.0", title: "Runtime safety final review preview", artifactType: "final-review", reason: "Runtime safety final review preview is cataloged without final approval." },
  { version: "v9.1", title: "Post-v9 runtime research preview", artifactType: "research", reason: "Post-v9 runtime research preview is cataloged as preview-only research." },
  { version: "v9.2", title: "Runtime governance research index preview", artifactType: "index", reason: "Runtime governance research index preview is cataloged as preview-only indexing." },
  { version: "v9.3", title: "Runtime governance research map preview", artifactType: "map", reason: "Runtime governance research map preview is cataloged as preview-only mapping." },
  { version: "v9.4", title: "Runtime governance research timeline preview", artifactType: "timeline", reason: "Runtime governance research timeline preview is cataloged as preview-only timeline documentation." },
  { version: "v9.5", title: "Runtime governance research archive preview", artifactType: "archive", reason: "Runtime governance research archive preview is cataloged as preview-only archive documentation." }
];

const ARTIFACT_REFERENCES: Array<Omit<GovernanceRuntimeResearchArtifactReference, "id" | "futureOnly">> = [
  { version: "v8.0", artifact: "runtime-safety-design-preview", reason: "Runtime safety design artifact is cataloged for future-only reference." },
  { version: "v8.1", artifact: "runtime-safety-evidence-preview", reason: "Runtime safety evidence artifact is cataloged for future-only reference." },
  { version: "v8.2", artifact: "runtime-safety-observability-preview", reason: "Runtime safety observability artifact is cataloged for future-only reference." },
  { version: "v8.3", artifact: "runtime-control-plane-preview", reason: "Runtime control-plane artifact is cataloged for future-only reference." },
  { version: "v8.4", artifact: "runtime-lifecycle-preview", reason: "Runtime lifecycle artifact is cataloged for future-only reference." },
  { version: "v8.5", artifact: "runtime-activation-readiness-preview", reason: "Runtime activation readiness artifact is cataloged for future-only reference." },
  { version: "v8.6", artifact: "runtime-safety-certification-preview", reason: "Runtime safety certification artifact is cataloged for future-only reference." },
  { version: "v8.7", artifact: "runtime-activation-governance-review-preview", reason: "Runtime activation governance review artifact is cataloged for future-only reference." },
  { version: "v8.8", artifact: "runtime-activation-boundary-preview", reason: "Runtime activation boundary artifact is cataloged for future-only reference." },
  { version: "v8.9", artifact: "runtime-activation-freeze-preview", reason: "Runtime activation freeze artifact is cataloged for future-only reference." },
  { version: "v9.0", artifact: "runtime-safety-final-review-preview", reason: "Runtime safety final review artifact is cataloged for future-only reference." },
  { version: "v9.1", artifact: "post-v9-runtime-research-preview", reason: "Post-v9 runtime research artifact is cataloged for future-only reference." },
  { version: "v9.2", artifact: "runtime-governance-research-index-preview", reason: "Runtime governance research index artifact is cataloged for future-only reference." },
  { version: "v9.3", artifact: "runtime-governance-research-map-preview", reason: "Runtime governance research map artifact is cataloged for future-only reference." },
  { version: "v9.4", artifact: "runtime-governance-research-timeline-preview", reason: "Runtime governance research timeline artifact is cataloged for future-only reference." },
  { version: "v9.5", artifact: "runtime-governance-research-archive-preview", reason: "Runtime governance research archive artifact is cataloged for future-only reference." }
];

const VERSION_SUMMARIES: Array<Omit<GovernanceRuntimeResearchVersionSummary, "id" | "previewOnly">> = [
  { version: "v8.0", category: "runtime-safety", reason: "v8.0 established runtime safety design preview documentation." },
  { version: "v8.1", category: "runtime-safety", reason: "v8.1 established runtime safety evidence preview documentation." },
  { version: "v8.2", category: "runtime-safety", reason: "v8.2 established runtime observability preview documentation." },
  { version: "v8.3", category: "runtime-governance", reason: "v8.3 established runtime control-plane preview documentation." },
  { version: "v8.4", category: "runtime-governance", reason: "v8.4 established runtime lifecycle preview documentation." },
  { version: "v8.5", category: "runtime-governance", reason: "v8.5 established runtime activation readiness preview documentation." },
  { version: "v8.6", category: "runtime-review", reason: "v8.6 established runtime safety certification preview documentation." },
  { version: "v8.7", category: "runtime-review", reason: "v8.7 established runtime activation governance review preview documentation." },
  { version: "v8.8", category: "runtime-review", reason: "v8.8 established runtime activation boundary preview documentation." },
  { version: "v8.9", category: "runtime-review", reason: "v8.9 established runtime activation freeze preview documentation." },
  { version: "v9.0", category: "runtime-review", reason: "v9.0 established runtime safety final review preview documentation." },
  { version: "v9.1", category: "post-v9-research", reason: "v9.1 established post-v9 runtime research preview documentation." },
  { version: "v9.2", category: "post-v9-research", reason: "v9.2 established runtime governance research index preview documentation." },
  { version: "v9.3", category: "post-v9-research", reason: "v9.3 established runtime governance research map preview documentation." },
  { version: "v9.4", category: "post-v9-research", reason: "v9.4 established runtime governance research timeline preview documentation." },
  { version: "v9.5", category: "post-v9-research", reason: "v9.5 established runtime governance research archive preview documentation." }
];

const POSTURE_SUMMARIES: Array<Omit<GovernanceRuntimePreviewOnlyPostureSummary, "id" | "previewOnly">> = [
  { category: "runtime-activation", reason: "Runtime activation remains not approved and not executed in the catalog preview." },
  { category: "runtime-autonomy", reason: "Runtime autonomy remains disabled in the catalog preview." },
  { category: "runtime-control-plane", reason: "Runtime control plane remains preview-only and is not applied in the catalog preview." },
  { category: "runtime-governance", reason: "Runtime governance remains preview-only and disabled in the catalog preview." },
  { category: "runtime-observability", reason: "Runtime observability remains preview-only and is not enforced in the catalog preview." },
  { category: "runtime-policy-enforcement", reason: "Runtime policy enforcement remains disabled in the catalog preview." }
];

const FORBIDDEN_SUMMARIES: Array<Omit<GovernanceRuntimeForbiddenCapabilitySummary, "id" | "permanentlyForbidden">> = [
  { category: "mutation-scope-expansion", reason: "Mutation scope expansion remains forbidden in the catalog preview." },
  { category: "runtime-autonomy", reason: "Runtime autonomy enablement remains forbidden in the catalog preview." },
  { category: "runtime-learning", reason: "Runtime learning remains forbidden in the catalog preview." },
  { category: "runtime-ml-decisioning", reason: "ML/vector DB governance remains forbidden in the catalog preview." },
  { category: "runtime-multi-agent-coordination", reason: "Uncontrolled multi-agent coordination remains forbidden in the catalog preview." },
  { category: "runtime-plugin-execution", reason: "Runtime plugin execution remains forbidden in the catalog preview." },
  { category: "runtime-policy-enforcement", reason: "Runtime policy enforcement remains forbidden in the catalog preview." },
  { category: "runtime-script-execution", reason: "Runtime script evaluation remains forbidden in the catalog preview." },
  { category: "safe-patch-engine-bypass", reason: "Safe Patch Engine bypass remains forbidden in the catalog preview." }
];

const FUTURE_NOTES: Array<Omit<GovernanceRuntimeFutureCatalogNote, "id" | "futureOnly">> = [
  { category: "future-certification-review", reason: "Future runtime systems require certification review before any runtime governance system could be considered." },
  { category: "future-human-review", reason: "Future runtime systems require explicit human approval before any activation could be considered." },
  { category: "future-human-review", reason: "Future runtime systems require separate human review outside this catalog preview." },
  { category: "future-runtime-research", reason: "Future runtime systems must preserve Safe Patch Engine exclusivity." },
  { category: "future-runtime-safety-review", reason: "Future runtime systems require freeze validation before any activation could be considered." },
  { category: "future-runtime-safety-review", reason: "Future runtime systems require rollback validation before any activation could be considered." }
];

function withDeterministicIds<T>(prefix: string, items: T[], sortKey: (item: T) => string): Array<T & { id: string }> {
  return [...items]
    .sort((a, b) => sortKey(a).localeCompare(sortKey(b)))
    .map((item, index) => ({ id: `${prefix}-${String(index + 1).padStart(3, "0")}`, ...item }));
}

function conclusionFor(source: GovernanceRuntimeResearchArchivePreview): Pick<GovernanceRuntimeResearchCatalogPreview, "previewStatus" | "runtimeResearchCatalogConclusion" | "recommendedNextStage"> {
  if (source.previewStatus === "not-created") return { previewStatus: "not-created", runtimeResearchCatalogConclusion: "source-missing", recommendedNextStage: "continue-preview-only-research" };
  if (source.previewStatus === "blocked") return { previewStatus: "blocked", runtimeResearchCatalogConclusion: "blocked", recommendedNextStage: "blocked" };
  if (source.runtimeResearchArchiveConclusion === "research-archive-ready") return { previewStatus: "created", runtimeResearchCatalogConclusion: "research-catalog-ready", recommendedNextStage: "prepare-runtime-governance-research-registry-preview" };
  return { previewStatus: "created", runtimeResearchCatalogConclusion: "not-ready", recommendedNextStage: "continue-preview-only-research" };
}

function scoreFor(conclusion: GovernanceRuntimeResearchCatalogPreview["runtimeResearchCatalogConclusion"]): GovernanceRuntimeResearchCatalogScore {
  if (conclusion === "blocked") return { score: 0, rating: "blocked", reason: "Runtime governance research catalog preview is blocked by source status." };
  if (conclusion === "source-missing") return { score: 20, rating: "not-ready", reason: "Runtime governance research archive preview is missing." };
  if (conclusion === "not-ready") return { score: 40, rating: "partial-catalog-readiness", reason: "Runtime governance research archive exists but is not ready for catalog preview." };
  return { score: 80, rating: "research-catalog-ready", reason: "Runtime governance research catalog is ready as preview-only documentation." };
}

function buildCatalogGroups(): GovernanceRuntimeResearchCatalogGroup[] {
  const counts: Record<GovernanceRuntimeResearchCatalogGroup["category"], number> = {
    "forbidden-capabilities": FORBIDDEN_SUMMARIES.length,
    "post-v9-research": 5,
    "runtime-governance": 3,
    "runtime-review": 5,
    "runtime-safety": 3,
    "safe-patch-engine": 1
  };
  const groups: Array<Omit<GovernanceRuntimeResearchCatalogGroup, "id" | "previewOnly">> = [
    { key: "forbidden-capabilities", category: "forbidden-capabilities", totalEntries: counts["forbidden-capabilities"], reason: "Forbidden runtime capabilities are grouped as permanently forbidden catalog summaries." },
    { key: "post-v9-research", category: "post-v9-research", totalEntries: counts["post-v9-research"], reason: "Post-v9 runtime research artifacts are grouped for catalog navigation." },
    { key: "runtime-governance", category: "runtime-governance", totalEntries: counts["runtime-governance"], reason: "Runtime governance preview artifacts are grouped without enabling governance." },
    { key: "runtime-review", category: "runtime-review", totalEntries: counts["runtime-review"], reason: "Runtime review artifacts are grouped without approval or enforcement." },
    { key: "runtime-safety", category: "runtime-safety", totalEntries: counts["runtime-safety"], reason: "Runtime safety preview artifacts are grouped as preview-only architecture." },
    { key: "safe-patch-engine", category: "safe-patch-engine", totalEntries: counts["safe-patch-engine"], reason: "Safe Patch Engine exclusivity is grouped as the mandatory mutation boundary." }
  ];
  return withDeterministicIds("gov-runtime-research-catalog-group", groups.map((item) => ({ ...item, previewOnly: true as const })), (item) => `${item.category}:${item.key}`);
}

const buildCatalogEntries = (): GovernanceRuntimeResearchCatalogEntry[] =>
  withDeterministicIds("gov-runtime-research-catalog-entry", CATALOG_ENTRIES.map((item) => ({ ...item, previewOnly: true as const })), (item) => `${item.version}:${item.artifactType}:${item.title}`);

const buildArtifactReferences = (): GovernanceRuntimeResearchArtifactReference[] =>
  withDeterministicIds("gov-runtime-research-catalog-artifact", ARTIFACT_REFERENCES.map((item) => ({ ...item, futureOnly: true as const })), (item) => `${item.version}:${item.artifact}`);

const buildVersionSummaries = (): GovernanceRuntimeResearchVersionSummary[] =>
  withDeterministicIds("gov-runtime-research-catalog-version", VERSION_SUMMARIES.map((item) => ({ ...item, previewOnly: true as const })), (item) => `${item.version}:${item.category}`);

const buildPostureSummaries = (): GovernanceRuntimePreviewOnlyPostureSummary[] =>
  withDeterministicIds("gov-runtime-research-catalog-preview", POSTURE_SUMMARIES.map((item) => ({ ...item, previewOnly: true as const })), (item) => item.category);

const buildForbiddenSummaries = (): GovernanceRuntimeForbiddenCapabilitySummary[] =>
  withDeterministicIds("gov-runtime-research-catalog-forbidden", FORBIDDEN_SUMMARIES.map((item) => ({ ...item, permanentlyForbidden: true as const })), (item) => item.category);

const buildFutureNotes = (): GovernanceRuntimeFutureCatalogNote[] =>
  withDeterministicIds("gov-runtime-research-catalog-note", FUTURE_NOTES.map((item) => ({ ...item, futureOnly: true as const })), (item) => `${item.category}:${item.reason}`);

function warningsFor(conclusion: GovernanceRuntimeResearchCatalogPreview["runtimeResearchCatalogConclusion"]): string[] {
  const warnings = [
    "Runtime governance research catalog preview is advisory only.",
    "Runtime research catalog was not applied or enforced.",
    "Runtime research archive was not applied or enforced.",
    "Runtime governance is not enabled.",
    "Runtime autonomy is not enabled.",
    "Runtime activation was not approved or executed.",
    "Runtime policies are not enforced.",
    "Runtime behavior did not change.",
    "Repair orchestration did not change."
  ];
  if (conclusion === "source-missing") warnings.unshift("Runtime governance research archive source is missing; research catalog preview is incomplete.");
  if (conclusion === "not-ready") warnings.unshift("Runtime governance research archive is not ready for research catalog preview.");
  if (conclusion === "research-catalog-ready") warnings.unshift("Runtime governance research catalog preview is ready as preview-only documentation.");
  if (conclusion === "blocked") warnings.unshift("Runtime governance research archive is blocked; research catalog preview is blocked.");
  return warnings;
}

export function buildGovernanceRuntimeResearchCatalogPreviewFromArchive(source: GovernanceRuntimeResearchArchivePreview): GovernanceRuntimeResearchCatalogPreview {
  const conclusion = conclusionFor(source);
  const researchCatalogScore = scoreFor(conclusion.runtimeResearchCatalogConclusion);
  const catalogGroups = buildCatalogGroups();
  const catalogEntries = buildCatalogEntries();
  const artifactReferences = buildArtifactReferences();
  const versionSummaries = buildVersionSummaries();
  const previewOnlyPostureSummaries = buildPostureSummaries();
  const forbiddenCapabilitySummaries = buildForbiddenSummaries();
  const futureOnlyCatalogNotes = buildFutureNotes();
  return {
    schemaVersion: 1,
    previewStatus: conclusion.previewStatus,
    sourceRuntimeResearchArchiveStatus: source.previewStatus,
    runtimeResearchCatalogConclusion: conclusion.runtimeResearchCatalogConclusion,
    runtimeResearchCatalogApplied: false,
    runtimeResearchCatalogEnforced: false,
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
    researchCatalogScore,
    catalogGroups,
    catalogEntries,
    artifactReferences,
    versionSummaries,
    previewOnlyPostureSummaries,
    forbiddenCapabilitySummaries,
    futureOnlyCatalogNotes,
    summary: {
      researchCatalogScoreValue: researchCatalogScore.score,
      totalCatalogGroups: catalogGroups.length,
      totalCatalogEntries: catalogEntries.length,
      totalArtifactReferences: artifactReferences.length,
      totalVersionSummaries: versionSummaries.length,
      totalPreviewOnlyPostureSummaries: previewOnlyPostureSummaries.length,
      totalForbiddenCapabilitySummaries: forbiddenCapabilitySummaries.length,
      totalFutureOnlyCatalogNotes: futureOnlyCatalogNotes.length,
      researchCatalogReady: conclusion.runtimeResearchCatalogConclusion === "research-catalog-ready"
    },
    warnings: warningsFor(conclusion.runtimeResearchCatalogConclusion),
    recommendedNextStage: conclusion.recommendedNextStage
  };
}

export function buildGovernanceRuntimeResearchCatalogPreview(projectRoot: string): GovernanceRuntimeResearchCatalogPreview {
  return buildGovernanceRuntimeResearchCatalogPreviewFromArchive(buildGovernanceRuntimeResearchArchivePreview(projectRoot));
}

export function renderGovernanceRuntimeResearchCatalogPreviewMarkdown(preview: GovernanceRuntimeResearchCatalogPreview): string {
  const lines = [
    "# AI Software Factory - Runtime Governance Research Catalog Preview",
    "",
    "Preview status:", preview.previewStatus,
    "", "Source runtime research archive status:", preview.sourceRuntimeResearchArchiveStatus,
    "", "Runtime research catalog conclusion:", preview.runtimeResearchCatalogConclusion,
    "", "Runtime research catalog applied:", String(preview.runtimeResearchCatalogApplied),
    "", "Runtime research catalog enforced:", String(preview.runtimeResearchCatalogEnforced),
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
    "", "Research catalog score:", String(preview.researchCatalogScore.score),
    "", "Research catalog rating:", preview.researchCatalogScore.rating,
    "", "Catalog group count:", String(preview.summary.totalCatalogGroups),
    "", "Catalog entry count:", String(preview.summary.totalCatalogEntries),
    "", "Artifact reference count:", String(preview.summary.totalArtifactReferences),
    "", "Version summary count:", String(preview.summary.totalVersionSummaries),
    "", "Preview-only posture summary count:", String(preview.summary.totalPreviewOnlyPostureSummaries),
    "", "Forbidden capability summary count:", String(preview.summary.totalForbiddenCapabilitySummaries),
    "", "Future-only catalog note count:", String(preview.summary.totalFutureOnlyCatalogNotes),
    "", "Research catalog ready:", String(preview.summary.researchCatalogReady),
    "", "Recommended next stage:", preview.recommendedNextStage,
    "", "## Catalog Groups", ""
  ];
  for (const item of preview.catalogGroups) lines.push(`- [${item.category}] ${item.id} ${item.key} totalEntries=${item.totalEntries} previewOnly=${String(item.previewOnly)} - ${item.reason}`);
  lines.push("", "## Catalog Entries", "");
  for (const item of preview.catalogEntries) lines.push(`- [${item.version}/${item.artifactType}] ${item.id} ${item.title} previewOnly=${String(item.previewOnly)} - ${item.reason}`);
  lines.push("", "## Artifact References", "");
  for (const item of preview.artifactReferences) lines.push(`- [${item.version}] ${item.id} ${item.artifact} futureOnly=${String(item.futureOnly)} - ${item.reason}`);
  lines.push("", "## Version Summaries", "");
  for (const item of preview.versionSummaries) lines.push(`- [${item.version}/${item.category}] ${item.id} previewOnly=${String(item.previewOnly)} - ${item.reason}`);
  lines.push("", "## Preview-only Posture Summaries", "");
  for (const item of preview.previewOnlyPostureSummaries) lines.push(`- [${item.category}] ${item.id} previewOnly=${String(item.previewOnly)} - ${item.reason}`);
  lines.push("", "## Forbidden Capability Summaries", "");
  for (const item of preview.forbiddenCapabilitySummaries) lines.push(`- [${item.category}] ${item.id} permanentlyForbidden=${String(item.permanentlyForbidden)} - ${item.reason}`);
  lines.push("", "## Future-only Catalog Notes", "");
  for (const item of preview.futureOnlyCatalogNotes) lines.push(`- [${item.category}] ${item.id} futureOnly=${String(item.futureOnly)} - ${item.reason}`);
  lines.push("", "## Warnings", "");
  for (const warning of preview.warnings) lines.push(`- ${warning}`);
  return `${lines.join("\n")}\n`;
}

export function renderGovernanceRuntimeResearchCatalogPreviewText(preview: GovernanceRuntimeResearchCatalogPreview): string {
  return renderGovernanceRuntimeResearchCatalogPreviewMarkdown(preview);
}

export function writeGovernanceRuntimeResearchCatalogPreviewArtifacts(projectRoot: string, preview: GovernanceRuntimeResearchCatalogPreview): { jsonPath: string; markdownPath: string } {
  const jsonPath = path.join(projectRoot, ARTIFACT_JSON_PATH);
  const markdownPath = path.join(projectRoot, ARTIFACT_MARKDOWN_PATH);
  fs.ensureDirSync(path.dirname(jsonPath));
  fs.writeFileSync(jsonPath, `${JSON.stringify(preview, null, 2)}\n`, "utf8");
  fs.writeFileSync(markdownPath, renderGovernanceRuntimeResearchCatalogPreviewMarkdown(preview), "utf8");
  return { jsonPath: ARTIFACT_JSON_PATH, markdownPath: ARTIFACT_MARKDOWN_PATH };
}
