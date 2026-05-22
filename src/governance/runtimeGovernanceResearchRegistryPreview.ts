import fs from "fs-extra";
import path from "node:path";

import {
  buildGovernanceRuntimeResearchCatalogPreview,
  type GovernanceRuntimeResearchCatalogPreview
} from "./runtimeGovernanceResearchCatalogPreview.js";

export type GovernanceRuntimeResearchRegistryScore = {
  score: 0 | 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90 | 100;
  rating: "blocked" | "not-ready" | "partial-registry-readiness" | "research-registry-ready";
  reason: string;
};

export type GovernanceRuntimeResearchRegistryGroup = {
  id: string;
  key: string;
  category: "runtime-safety" | "runtime-governance" | "runtime-review" | "post-v9-research" | "forbidden-capabilities" | "safe-patch-engine";
  totalRecords: number;
  previewOnly: true;
  reason: string;
};

export type GovernanceRuntimeResearchRegistryRecord = {
  id: string;
  version: string;
  title: string;
  registryType:
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
    | "archive"
    | "catalog";
  previewOnly: true;
  reason: string;
};

export type GovernanceRuntimeResearchArtifactIdentityRecord = {
  id: string;
  artifactId: string;
  version: string;
  ownershipCategory: "runtime-safety" | "runtime-governance" | "runtime-review" | "post-v9-research";
  previewOnly: true;
  reason: string;
};

export type GovernanceRuntimeResearchOwnershipSummary = {
  id: string;
  ownershipCategory: "runtime-safety" | "runtime-governance" | "runtime-review" | "post-v9-research";
  totalArtifacts: number;
  previewOnly: true;
  reason: string;
};

export type GovernanceRuntimePreviewOnlyRegistrySummary = {
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

export type GovernanceRuntimeForbiddenCapabilityRegistryRecord = {
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

export type GovernanceRuntimeFutureRegistryNote = {
  id: string;
  category: "future-human-review" | "future-runtime-research" | "future-certification-review" | "future-runtime-safety-review";
  futureOnly: true;
  reason: string;
};

export type GovernanceRuntimeResearchRegistryPreview = {
  schemaVersion: 1;
  previewStatus: "not-created" | "created" | "blocked";
  sourceRuntimeResearchCatalogStatus: "not-created" | "created" | "blocked";
  runtimeResearchRegistryConclusion: "source-missing" | "not-ready" | "research-registry-ready" | "blocked";
  runtimeResearchRegistryApplied: false;
  runtimeResearchRegistryEnforced: false;
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
  researchRegistryScore: GovernanceRuntimeResearchRegistryScore;
  registryGroups: GovernanceRuntimeResearchRegistryGroup[];
  registryRecords: GovernanceRuntimeResearchRegistryRecord[];
  artifactIdentityRecords: GovernanceRuntimeResearchArtifactIdentityRecord[];
  ownershipSummaries: GovernanceRuntimeResearchOwnershipSummary[];
  previewOnlyRegistrySummaries: GovernanceRuntimePreviewOnlyRegistrySummary[];
  forbiddenCapabilityRegistryRecords: GovernanceRuntimeForbiddenCapabilityRegistryRecord[];
  futureOnlyRegistryNotes: GovernanceRuntimeFutureRegistryNote[];
  summary: {
    researchRegistryScoreValue: number;
    totalRegistryGroups: number;
    totalRegistryRecords: number;
    totalArtifactIdentityRecords: number;
    totalOwnershipSummaries: number;
    totalPreviewOnlyRegistrySummaries: number;
    totalForbiddenCapabilityRegistryRecords: number;
    totalFutureOnlyRegistryNotes: number;
    researchRegistryReady: boolean;
  };
  warnings: string[];
  recommendedNextStage: "continue-preview-only-research" | "prepare-runtime-governance-research-manifest-preview" | "blocked";
};

const ARTIFACT_JSON_PATH = ".factory/governance/runtime-governance-research-registry-preview.json";
const ARTIFACT_MARKDOWN_PATH = ".factory/governance/runtime-governance-research-registry-preview.md";

const REGISTRY_RECORDS: Array<Omit<GovernanceRuntimeResearchRegistryRecord, "id" | "previewOnly">> = [
  { version: "v8.0", title: "Runtime safety design preview", registryType: "design", reason: "Runtime safety design preview is registered as preview-only architecture." },
  { version: "v8.1", title: "Runtime safety evidence preview", registryType: "evidence", reason: "Runtime safety evidence preview is registered as preview-only architecture." },
  { version: "v8.2", title: "Runtime safety observability preview", registryType: "observability", reason: "Runtime safety observability preview is registered as preview-only architecture." },
  { version: "v8.3", title: "Runtime control plane preview", registryType: "control-plane", reason: "Runtime control plane preview is registered without applying controls." },
  { version: "v8.4", title: "Runtime lifecycle preview", registryType: "lifecycle", reason: "Runtime lifecycle preview is registered without lifecycle transitions." },
  { version: "v8.5", title: "Runtime activation readiness preview", registryType: "activation-readiness", reason: "Runtime activation readiness preview is registered without activation." },
  { version: "v8.6", title: "Runtime safety certification preview", registryType: "certification", reason: "Runtime safety certification preview is registered without certification application." },
  { version: "v8.7", title: "Runtime activation governance review preview", registryType: "governance-review", reason: "Runtime activation governance review preview is registered without approval." },
  { version: "v8.8", title: "Runtime activation boundary preview", registryType: "boundary-review", reason: "Runtime activation boundary preview is registered without boundary enforcement." },
  { version: "v8.9", title: "Runtime activation freeze preview", registryType: "freeze-review", reason: "Runtime activation freeze preview is registered without freeze execution." },
  { version: "v9.0", title: "Runtime safety final review preview", registryType: "final-review", reason: "Runtime safety final review preview is registered without final approval." },
  { version: "v9.1", title: "Post-v9 runtime research preview", registryType: "research", reason: "Post-v9 runtime research preview is registered as preview-only research." },
  { version: "v9.2", title: "Runtime governance research index preview", registryType: "index", reason: "Runtime governance research index preview is registered as preview-only indexing." },
  { version: "v9.3", title: "Runtime governance research map preview", registryType: "map", reason: "Runtime governance research map preview is registered as preview-only mapping." },
  { version: "v9.4", title: "Runtime governance research timeline preview", registryType: "timeline", reason: "Runtime governance research timeline preview is registered as preview-only timeline documentation." },
  { version: "v9.5", title: "Runtime governance research archive preview", registryType: "archive", reason: "Runtime governance research archive preview is registered as preview-only archive documentation." },
  { version: "v9.6", title: "Runtime governance research catalog preview", registryType: "catalog", reason: "Runtime governance research catalog preview is registered as preview-only catalog documentation." }
];

const ARTIFACT_IDENTITIES: Array<Omit<GovernanceRuntimeResearchArtifactIdentityRecord, "id" | "previewOnly">> = [
  { artifactId: "runtime-safety-design-preview", version: "v8.0", ownershipCategory: "runtime-safety", reason: "Runtime safety design identity belongs to runtime safety ownership." },
  { artifactId: "runtime-safety-evidence-preview", version: "v8.1", ownershipCategory: "runtime-safety", reason: "Runtime safety evidence identity belongs to runtime safety ownership." },
  { artifactId: "runtime-safety-observability-preview", version: "v8.2", ownershipCategory: "runtime-safety", reason: "Runtime observability identity belongs to runtime safety ownership." },
  { artifactId: "runtime-control-plane-preview", version: "v8.3", ownershipCategory: "runtime-governance", reason: "Runtime control-plane identity belongs to runtime governance ownership." },
  { artifactId: "runtime-lifecycle-preview", version: "v8.4", ownershipCategory: "runtime-governance", reason: "Runtime lifecycle identity belongs to runtime governance ownership." },
  { artifactId: "runtime-activation-readiness-preview", version: "v8.5", ownershipCategory: "runtime-governance", reason: "Runtime activation readiness identity belongs to runtime governance ownership." },
  { artifactId: "runtime-safety-certification-preview", version: "v8.6", ownershipCategory: "runtime-review", reason: "Runtime certification identity belongs to runtime review ownership." },
  { artifactId: "runtime-activation-governance-review-preview", version: "v8.7", ownershipCategory: "runtime-review", reason: "Runtime governance review identity belongs to runtime review ownership." },
  { artifactId: "runtime-activation-boundary-preview", version: "v8.8", ownershipCategory: "runtime-review", reason: "Runtime boundary identity belongs to runtime review ownership." },
  { artifactId: "runtime-activation-freeze-preview", version: "v8.9", ownershipCategory: "runtime-review", reason: "Runtime freeze identity belongs to runtime review ownership." },
  { artifactId: "runtime-safety-final-review-preview", version: "v9.0", ownershipCategory: "runtime-review", reason: "Runtime final review identity belongs to runtime review ownership." },
  { artifactId: "post-v9-runtime-research-preview", version: "v9.1", ownershipCategory: "post-v9-research", reason: "Post-v9 runtime research identity belongs to post-v9 research ownership." },
  { artifactId: "runtime-governance-research-index-preview", version: "v9.2", ownershipCategory: "post-v9-research", reason: "Runtime research index identity belongs to post-v9 research ownership." },
  { artifactId: "runtime-governance-research-map-preview", version: "v9.3", ownershipCategory: "post-v9-research", reason: "Runtime research map identity belongs to post-v9 research ownership." },
  { artifactId: "runtime-governance-research-timeline-preview", version: "v9.4", ownershipCategory: "post-v9-research", reason: "Runtime research timeline identity belongs to post-v9 research ownership." },
  { artifactId: "runtime-governance-research-archive-preview", version: "v9.5", ownershipCategory: "post-v9-research", reason: "Runtime research archive identity belongs to post-v9 research ownership." },
  { artifactId: "runtime-governance-research-catalog-preview", version: "v9.6", ownershipCategory: "post-v9-research", reason: "Runtime research catalog identity belongs to post-v9 research ownership." }
];

const REGISTRY_GROUPS: Array<Omit<GovernanceRuntimeResearchRegistryGroup, "id" | "previewOnly">> = [
  { key: "forbidden-capabilities", category: "forbidden-capabilities", totalRecords: 9, reason: "Forbidden capabilities are registered as permanently forbidden records." },
  { key: "post-v9-research", category: "post-v9-research", totalRecords: 6, reason: "Post-v9 research records are registered for preview-only documentation." },
  { key: "runtime-governance", category: "runtime-governance", totalRecords: 3, reason: "Runtime governance records are registered without enabling governance." },
  { key: "runtime-review", category: "runtime-review", totalRecords: 5, reason: "Runtime review records are registered without approval or enforcement." },
  { key: "runtime-safety", category: "runtime-safety", totalRecords: 3, reason: "Runtime safety records are registered as preview-only architecture." },
  { key: "safe-patch-engine", category: "safe-patch-engine", totalRecords: 1, reason: "Safe Patch Engine exclusivity is registered as the mandatory mutation boundary." }
];

const OWNERSHIP_SUMMARIES: Array<Omit<GovernanceRuntimeResearchOwnershipSummary, "id" | "previewOnly">> = [
  { ownershipCategory: "post-v9-research", totalArtifacts: 6, reason: "Post-v9 research owns research, index, map, timeline, archive, and catalog preview artifacts." },
  { ownershipCategory: "runtime-governance", totalArtifacts: 3, reason: "Runtime governance owns control-plane, lifecycle, and activation readiness preview artifacts." },
  { ownershipCategory: "runtime-review", totalArtifacts: 5, reason: "Runtime review owns certification, governance review, boundary, freeze, and final review preview artifacts." },
  { ownershipCategory: "runtime-safety", totalArtifacts: 3, reason: "Runtime safety owns design, evidence, and observability preview artifacts." }
];

const PREVIEW_SUMMARIES: Array<Omit<GovernanceRuntimePreviewOnlyRegistrySummary, "id" | "previewOnly">> = [
  { category: "runtime-activation", reason: "Runtime activation remains not approved and not executed in the registry preview." },
  { category: "runtime-autonomy", reason: "Runtime autonomy remains disabled in the registry preview." },
  { category: "runtime-control-plane", reason: "Runtime control plane remains preview-only and is not applied in the registry preview." },
  { category: "runtime-governance", reason: "Runtime governance remains preview-only and disabled in the registry preview." },
  { category: "runtime-observability", reason: "Runtime observability remains preview-only and is not enforced in the registry preview." },
  { category: "runtime-policy-enforcement", reason: "Runtime policy enforcement remains disabled in the registry preview." }
];

const FORBIDDEN_RECORDS: Array<Omit<GovernanceRuntimeForbiddenCapabilityRegistryRecord, "id" | "permanentlyForbidden">> = [
  { category: "mutation-scope-expansion", reason: "Mutation scope expansion remains forbidden in the registry preview." },
  { category: "runtime-autonomy", reason: "Runtime autonomy enablement remains forbidden in the registry preview." },
  { category: "runtime-learning", reason: "Runtime learning remains forbidden in the registry preview." },
  { category: "runtime-ml-decisioning", reason: "ML/vector DB governance remains forbidden in the registry preview." },
  { category: "runtime-multi-agent-coordination", reason: "Uncontrolled multi-agent coordination remains forbidden in the registry preview." },
  { category: "runtime-plugin-execution", reason: "Runtime plugin execution remains forbidden in the registry preview." },
  { category: "runtime-policy-enforcement", reason: "Runtime policy enforcement remains forbidden in the registry preview." },
  { category: "runtime-script-execution", reason: "Runtime script evaluation remains forbidden in the registry preview." },
  { category: "safe-patch-engine-bypass", reason: "Safe Patch Engine bypass remains forbidden in the registry preview." }
];

const FUTURE_NOTES: Array<Omit<GovernanceRuntimeFutureRegistryNote, "id" | "futureOnly">> = [
  { category: "future-certification-review", reason: "Future runtime systems require certification review before any runtime governance system could be considered." },
  { category: "future-human-review", reason: "Future runtime systems require explicit human approval before any activation could be considered." },
  { category: "future-human-review", reason: "Future runtime systems require separate human review outside this registry preview." },
  { category: "future-runtime-research", reason: "Future runtime systems must preserve Safe Patch Engine exclusivity." },
  { category: "future-runtime-safety-review", reason: "Future runtime systems require freeze validation before any activation could be considered." },
  { category: "future-runtime-safety-review", reason: "Future runtime systems require rollback validation before any activation could be considered." }
];

function withDeterministicIds<T>(prefix: string, items: T[], sortKey: (item: T) => string): Array<T & { id: string }> {
  return [...items]
    .sort((a, b) => sortKey(a).localeCompare(sortKey(b)))
    .map((item, index) => ({ id: `${prefix}-${String(index + 1).padStart(3, "0")}`, ...item }));
}

function conclusionFor(source: GovernanceRuntimeResearchCatalogPreview): Pick<GovernanceRuntimeResearchRegistryPreview, "previewStatus" | "runtimeResearchRegistryConclusion" | "recommendedNextStage"> {
  if (source.previewStatus === "not-created") return { previewStatus: "not-created", runtimeResearchRegistryConclusion: "source-missing", recommendedNextStage: "continue-preview-only-research" };
  if (source.previewStatus === "blocked") return { previewStatus: "blocked", runtimeResearchRegistryConclusion: "blocked", recommendedNextStage: "blocked" };
  if (source.runtimeResearchCatalogConclusion === "research-catalog-ready") return { previewStatus: "created", runtimeResearchRegistryConclusion: "research-registry-ready", recommendedNextStage: "prepare-runtime-governance-research-manifest-preview" };
  return { previewStatus: "created", runtimeResearchRegistryConclusion: "not-ready", recommendedNextStage: "continue-preview-only-research" };
}

function scoreFor(conclusion: GovernanceRuntimeResearchRegistryPreview["runtimeResearchRegistryConclusion"]): GovernanceRuntimeResearchRegistryScore {
  if (conclusion === "blocked") return { score: 0, rating: "blocked", reason: "Runtime governance research registry preview is blocked by source status." };
  if (conclusion === "source-missing") return { score: 20, rating: "not-ready", reason: "Runtime governance research catalog preview is missing." };
  if (conclusion === "not-ready") return { score: 40, rating: "partial-registry-readiness", reason: "Runtime governance research catalog exists but is not ready for registry preview." };
  return { score: 80, rating: "research-registry-ready", reason: "Runtime governance research registry is ready as preview-only documentation." };
}

const buildRegistryGroups = (): GovernanceRuntimeResearchRegistryGroup[] =>
  withDeterministicIds("gov-runtime-research-registry-group", REGISTRY_GROUPS.map((item) => ({ ...item, previewOnly: true as const })), (item) => `${item.category}:${item.key}`);

const buildRegistryRecords = (): GovernanceRuntimeResearchRegistryRecord[] =>
  withDeterministicIds("gov-runtime-research-registry-record", REGISTRY_RECORDS.map((item) => ({ ...item, previewOnly: true as const })), (item) => `${item.version}:${item.registryType}:${item.title}`);

const buildArtifactIdentities = (): GovernanceRuntimeResearchArtifactIdentityRecord[] =>
  withDeterministicIds("gov-runtime-research-registry-artifact", ARTIFACT_IDENTITIES.map((item) => ({ ...item, previewOnly: true as const })), (item) => `${item.version}:${item.ownershipCategory}:${item.artifactId}`);

const buildOwnershipSummaries = (): GovernanceRuntimeResearchOwnershipSummary[] =>
  withDeterministicIds("gov-runtime-research-registry-ownership", OWNERSHIP_SUMMARIES.map((item) => ({ ...item, previewOnly: true as const })), (item) => item.ownershipCategory);

const buildPreviewSummaries = (): GovernanceRuntimePreviewOnlyRegistrySummary[] =>
  withDeterministicIds("gov-runtime-research-registry-preview", PREVIEW_SUMMARIES.map((item) => ({ ...item, previewOnly: true as const })), (item) => item.category);

const buildForbiddenRecords = (): GovernanceRuntimeForbiddenCapabilityRegistryRecord[] =>
  withDeterministicIds("gov-runtime-research-registry-forbidden", FORBIDDEN_RECORDS.map((item) => ({ ...item, permanentlyForbidden: true as const })), (item) => item.category);

const buildFutureNotes = (): GovernanceRuntimeFutureRegistryNote[] =>
  withDeterministicIds("gov-runtime-research-registry-note", FUTURE_NOTES.map((item) => ({ ...item, futureOnly: true as const })), (item) => `${item.category}:${item.reason}`);

function warningsFor(conclusion: GovernanceRuntimeResearchRegistryPreview["runtimeResearchRegistryConclusion"]): string[] {
  const warnings = [
    "Runtime governance research registry preview is advisory only.",
    "Runtime research registry was not applied or enforced.",
    "Runtime research catalog was not applied or enforced.",
    "Runtime governance is not enabled.",
    "Runtime autonomy is not enabled.",
    "Runtime activation was not approved or executed.",
    "Runtime policies are not enforced.",
    "Runtime behavior did not change.",
    "Repair orchestration did not change."
  ];
  if (conclusion === "source-missing") warnings.unshift("Runtime governance research catalog source is missing; research registry preview is incomplete.");
  if (conclusion === "not-ready") warnings.unshift("Runtime governance research catalog is not ready for research registry preview.");
  if (conclusion === "research-registry-ready") warnings.unshift("Runtime governance research registry preview is ready as preview-only documentation.");
  if (conclusion === "blocked") warnings.unshift("Runtime governance research catalog is blocked; research registry preview is blocked.");
  return warnings;
}

export function buildGovernanceRuntimeResearchRegistryPreviewFromCatalog(source: GovernanceRuntimeResearchCatalogPreview): GovernanceRuntimeResearchRegistryPreview {
  const conclusion = conclusionFor(source);
  const researchRegistryScore = scoreFor(conclusion.runtimeResearchRegistryConclusion);
  const registryGroups = buildRegistryGroups();
  const registryRecords = buildRegistryRecords();
  const artifactIdentityRecords = buildArtifactIdentities();
  const ownershipSummaries = buildOwnershipSummaries();
  const previewOnlyRegistrySummaries = buildPreviewSummaries();
  const forbiddenCapabilityRegistryRecords = buildForbiddenRecords();
  const futureOnlyRegistryNotes = buildFutureNotes();
  return {
    schemaVersion: 1,
    previewStatus: conclusion.previewStatus,
    sourceRuntimeResearchCatalogStatus: source.previewStatus,
    runtimeResearchRegistryConclusion: conclusion.runtimeResearchRegistryConclusion,
    runtimeResearchRegistryApplied: false,
    runtimeResearchRegistryEnforced: false,
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
    researchRegistryScore,
    registryGroups,
    registryRecords,
    artifactIdentityRecords,
    ownershipSummaries,
    previewOnlyRegistrySummaries,
    forbiddenCapabilityRegistryRecords,
    futureOnlyRegistryNotes,
    summary: {
      researchRegistryScoreValue: researchRegistryScore.score,
      totalRegistryGroups: registryGroups.length,
      totalRegistryRecords: registryRecords.length,
      totalArtifactIdentityRecords: artifactIdentityRecords.length,
      totalOwnershipSummaries: ownershipSummaries.length,
      totalPreviewOnlyRegistrySummaries: previewOnlyRegistrySummaries.length,
      totalForbiddenCapabilityRegistryRecords: forbiddenCapabilityRegistryRecords.length,
      totalFutureOnlyRegistryNotes: futureOnlyRegistryNotes.length,
      researchRegistryReady: conclusion.runtimeResearchRegistryConclusion === "research-registry-ready"
    },
    warnings: warningsFor(conclusion.runtimeResearchRegistryConclusion),
    recommendedNextStage: conclusion.recommendedNextStage
  };
}

export function buildGovernanceRuntimeResearchRegistryPreview(projectRoot: string): GovernanceRuntimeResearchRegistryPreview {
  return buildGovernanceRuntimeResearchRegistryPreviewFromCatalog(buildGovernanceRuntimeResearchCatalogPreview(projectRoot));
}

export function renderGovernanceRuntimeResearchRegistryPreviewMarkdown(preview: GovernanceRuntimeResearchRegistryPreview): string {
  const lines = [
    "# AI Software Factory - Runtime Governance Research Registry Preview",
    "",
    "Preview status:", preview.previewStatus,
    "", "Source runtime research catalog status:", preview.sourceRuntimeResearchCatalogStatus,
    "", "Runtime research registry conclusion:", preview.runtimeResearchRegistryConclusion,
    "", "Runtime research registry applied:", String(preview.runtimeResearchRegistryApplied),
    "", "Runtime research registry enforced:", String(preview.runtimeResearchRegistryEnforced),
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
    "", "Research registry score:", String(preview.researchRegistryScore.score),
    "", "Research registry rating:", preview.researchRegistryScore.rating,
    "", "Registry group count:", String(preview.summary.totalRegistryGroups),
    "", "Registry record count:", String(preview.summary.totalRegistryRecords),
    "", "Artifact identity record count:", String(preview.summary.totalArtifactIdentityRecords),
    "", "Ownership summary count:", String(preview.summary.totalOwnershipSummaries),
    "", "Preview-only registry summary count:", String(preview.summary.totalPreviewOnlyRegistrySummaries),
    "", "Forbidden capability registry record count:", String(preview.summary.totalForbiddenCapabilityRegistryRecords),
    "", "Future-only registry note count:", String(preview.summary.totalFutureOnlyRegistryNotes),
    "", "Research registry ready:", String(preview.summary.researchRegistryReady),
    "", "Recommended next stage:", preview.recommendedNextStage,
    "", "## Registry Groups", ""
  ];
  for (const item of preview.registryGroups) lines.push(`- [${item.category}] ${item.id} ${item.key} totalRecords=${item.totalRecords} previewOnly=${String(item.previewOnly)} - ${item.reason}`);
  lines.push("", "## Registry Records", "");
  for (const item of preview.registryRecords) lines.push(`- [${item.version}/${item.registryType}] ${item.id} ${item.title} previewOnly=${String(item.previewOnly)} - ${item.reason}`);
  lines.push("", "## Artifact Identity Records", "");
  for (const item of preview.artifactIdentityRecords) lines.push(`- [${item.version}/${item.ownershipCategory}] ${item.id} ${item.artifactId} previewOnly=${String(item.previewOnly)} - ${item.reason}`);
  lines.push("", "## Ownership Summaries", "");
  for (const item of preview.ownershipSummaries) lines.push(`- [${item.ownershipCategory}] ${item.id} totalArtifacts=${item.totalArtifacts} previewOnly=${String(item.previewOnly)} - ${item.reason}`);
  lines.push("", "## Preview-only Registry Summaries", "");
  for (const item of preview.previewOnlyRegistrySummaries) lines.push(`- [${item.category}] ${item.id} previewOnly=${String(item.previewOnly)} - ${item.reason}`);
  lines.push("", "## Forbidden Capability Registry Records", "");
  for (const item of preview.forbiddenCapabilityRegistryRecords) lines.push(`- [${item.category}] ${item.id} permanentlyForbidden=${String(item.permanentlyForbidden)} - ${item.reason}`);
  lines.push("", "## Future-only Registry Notes", "");
  for (const item of preview.futureOnlyRegistryNotes) lines.push(`- [${item.category}] ${item.id} futureOnly=${String(item.futureOnly)} - ${item.reason}`);
  lines.push("", "## Warnings", "");
  for (const warning of preview.warnings) lines.push(`- ${warning}`);
  return `${lines.join("\n")}\n`;
}

export function renderGovernanceRuntimeResearchRegistryPreviewText(preview: GovernanceRuntimeResearchRegistryPreview): string {
  return renderGovernanceRuntimeResearchRegistryPreviewMarkdown(preview);
}

export function writeGovernanceRuntimeResearchRegistryPreviewArtifacts(projectRoot: string, preview: GovernanceRuntimeResearchRegistryPreview): { jsonPath: string; markdownPath: string } {
  const jsonPath = path.join(projectRoot, ARTIFACT_JSON_PATH);
  const markdownPath = path.join(projectRoot, ARTIFACT_MARKDOWN_PATH);
  fs.ensureDirSync(path.dirname(jsonPath));
  fs.writeFileSync(jsonPath, `${JSON.stringify(preview, null, 2)}\n`, "utf8");
  fs.writeFileSync(markdownPath, renderGovernanceRuntimeResearchRegistryPreviewMarkdown(preview), "utf8");
  return { jsonPath: ARTIFACT_JSON_PATH, markdownPath: ARTIFACT_MARKDOWN_PATH };
}
