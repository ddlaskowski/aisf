import fs from "fs-extra";
import path from "node:path";

import {
  GOVERNANCE_FINAL_REVIEW_PREVIEW_FLAGS,
  GOVERNANCE_PREVIEW_ONLY_EXECUTION_FLAGS,
  GOVERNANCE_RESEARCH_PREVIEW_FLAGS,
  GOVERNANCE_RUNTIME_RESEARCH_CHAIN_PREVIEW_FLAGS,
  GOVERNANCE_RUNTIME_DISABLED_FLAGS
} from "./governanceInvariants.js";
import { createReadonlyGovernanceArtifact, type GovernanceArtifactWithReadonlyContract } from "./governanceArtifactFactory.js";
import { createGovernanceArtifactRegistry, registerGovernanceArtifact, type GovernanceArtifactRegistry } from "./governanceArtifactRegistry.js";
import { renderDivider, renderGovernanceArtifact, renderGovernanceArtifactRegistrySummary, renderMetadata, renderRecommendations, renderStatusBlock, renderSummary, renderWarnings } from "./renderers/governanceRenderers.js";

import {
  buildGovernanceRuntimeResearchRegistryPreview,
  type GovernanceRuntimeResearchRegistryPreview
} from "./runtimeGovernanceResearchRegistryPreview.js";

export type GovernanceRuntimeResearchManifestScore = {
  score: 0 | 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90 | 100;
  rating: "blocked" | "not-ready" | "partial-manifest-readiness" | "research-manifest-ready";
  reason: string;
};

export type GovernanceRuntimeResearchManifestGroup = {
  id: string;
  key: string;
  category: "runtime-safety" | "runtime-governance" | "runtime-review" | "post-v9-research" | "forbidden-capabilities" | "safe-patch-engine";
  totalRecords: number;
  previewOnly: true;
  reason: string;
};

export type GovernanceRuntimeResearchManifestRecord = {
  id: string;
  version: string;
  manifestType:
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
    | "catalog"
    | "registry";
  previewOnly: true;
  reason: string;
};

export type GovernanceRuntimeResearchManifestOwnershipEntry = {
  id: string;
  ownershipCategory: "runtime-safety" | "runtime-governance" | "runtime-review" | "post-v9-research";
  totalArtifacts: number;
  previewOnly: true;
  reason: string;
};

export type GovernanceRuntimeResearchManifestVersionEntry = {
  id: string;
  version: string;
  previewOnly: true;
  reason: string;
};

export type GovernanceRuntimePreviewOnlyManifestSummary = {
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

export type GovernanceRuntimeForbiddenCapabilityManifestRecord = {
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

export type GovernanceRuntimeFutureManifestNote = {
  id: string;
  category: "future-human-review" | "future-runtime-research" | "future-certification-review" | "future-runtime-safety-review";
  futureOnly: true;
  reason: string;
};

export type GovernanceRuntimeResearchManifestPreview = {
  schemaVersion: 1;
  previewStatus: "not-created" | "created" | "blocked";
  sourceRuntimeResearchRegistryStatus: "not-created" | "created" | "blocked";
  runtimeResearchManifestConclusion: "source-missing" | "not-ready" | "research-manifest-ready" | "blocked";
  runtimeResearchManifestApplied: false;
  runtimeResearchManifestEnforced: false;
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
  researchManifestScore: GovernanceRuntimeResearchManifestScore;
  manifestGroups: GovernanceRuntimeResearchManifestGroup[];
  manifestRecords: GovernanceRuntimeResearchManifestRecord[];
  manifestOwnershipEntries: GovernanceRuntimeResearchManifestOwnershipEntry[];
  manifestVersionEntries: GovernanceRuntimeResearchManifestVersionEntry[];
  previewOnlyManifestSummaries: GovernanceRuntimePreviewOnlyManifestSummary[];
  forbiddenCapabilityManifestRecords: GovernanceRuntimeForbiddenCapabilityManifestRecord[];
  futureOnlyManifestNotes: GovernanceRuntimeFutureManifestNote[];
  normalizedGovernanceArtifact: GovernanceArtifactWithReadonlyContract;
  normalizedGovernanceArtifactRegistry: GovernanceArtifactRegistry;
  summary: {
    researchManifestScoreValue: number;
    totalManifestGroups: number;
    totalManifestRecords: number;
    totalManifestOwnershipEntries: number;
    totalManifestVersionEntries: number;
    totalPreviewOnlyManifestSummaries: number;
    totalForbiddenCapabilityManifestRecords: number;
    totalFutureOnlyManifestNotes: number;
    researchManifestReady: boolean;
  };
  warnings: string[];
  recommendedNextStage: "continue-preview-only-research" | "prepare-runtime-governance-research-attestation-preview" | "blocked";
};

const ARTIFACT_JSON_PATH = ".factory/governance/runtime-governance-research-manifest-preview.json";
const ARTIFACT_MARKDOWN_PATH = ".factory/governance/runtime-governance-research-manifest-preview.md";

const MANIFEST_GROUPS: Array<Omit<GovernanceRuntimeResearchManifestGroup, "id" | "previewOnly">> = [
  { key: "forbidden-capabilities", category: "forbidden-capabilities", totalRecords: 9, reason: "Forbidden capabilities are consolidated as permanently forbidden manifest records." },
  { key: "post-v9-research", category: "post-v9-research", totalRecords: 7, reason: "Post-v9 research manifest records remain preview-only documentation." },
  { key: "runtime-governance", category: "runtime-governance", totalRecords: 3, reason: "Runtime governance manifest records do not enable runtime governance." },
  { key: "runtime-review", category: "runtime-review", totalRecords: 5, reason: "Runtime review manifest records do not approve or enforce runtime activation." },
  { key: "runtime-safety", category: "runtime-safety", totalRecords: 3, reason: "Runtime safety manifest records remain preview-only architecture." },
  { key: "safe-patch-engine", category: "safe-patch-engine", totalRecords: 1, reason: "Safe Patch Engine exclusivity is preserved as the only mutation layer." }
];

const MANIFEST_RECORDS: Array<Omit<GovernanceRuntimeResearchManifestRecord, "id" | "previewOnly">> = [
  { version: "v8.0", manifestType: "design", reason: "Runtime safety design preview is manifested as preview-only architecture." },
  { version: "v8.1", manifestType: "evidence", reason: "Runtime safety evidence preview is manifested as preview-only architecture." },
  { version: "v8.2", manifestType: "observability", reason: "Runtime safety observability preview is manifested as preview-only architecture." },
  { version: "v8.3", manifestType: "control-plane", reason: "Runtime control plane preview is manifested without applying controls." },
  { version: "v8.4", manifestType: "lifecycle", reason: "Runtime lifecycle preview is manifested without lifecycle transitions." },
  { version: "v8.5", manifestType: "activation-readiness", reason: "Runtime activation readiness preview is manifested without activation." },
  { version: "v8.6", manifestType: "certification", reason: "Runtime safety certification preview is manifested without certification application." },
  { version: "v8.7", manifestType: "governance-review", reason: "Runtime activation governance review preview is manifested without approval." },
  { version: "v8.8", manifestType: "boundary-review", reason: "Runtime activation boundary preview is manifested without boundary enforcement." },
  { version: "v8.9", manifestType: "freeze-review", reason: "Runtime activation freeze preview is manifested without freeze execution." },
  { version: "v9.0", manifestType: "final-review", reason: "Runtime safety final review preview is manifested without final approval." },
  { version: "v9.1", manifestType: "research", reason: "Post-v9 runtime research preview is manifested as preview-only research." },
  { version: "v9.2", manifestType: "index", reason: "Runtime governance research index preview is manifested as preview-only indexing." },
  { version: "v9.3", manifestType: "map", reason: "Runtime governance research map preview is manifested as preview-only mapping." },
  { version: "v9.4", manifestType: "timeline", reason: "Runtime governance research timeline preview is manifested as preview-only timeline documentation." },
  { version: "v9.5", manifestType: "archive", reason: "Runtime governance research archive preview is manifested as preview-only archive documentation." },
  { version: "v9.6", manifestType: "catalog", reason: "Runtime governance research catalog preview is manifested as preview-only catalog documentation." },
  { version: "v9.7", manifestType: "registry", reason: "Runtime governance research registry preview is manifested as preview-only registry documentation." }
];

const OWNERSHIP_ENTRIES: Array<Omit<GovernanceRuntimeResearchManifestOwnershipEntry, "id" | "previewOnly">> = [
  { ownershipCategory: "post-v9-research", totalArtifacts: 7, reason: "Post-v9 research owns research, index, map, timeline, archive, catalog, and registry preview artifacts." },
  { ownershipCategory: "runtime-governance", totalArtifacts: 3, reason: "Runtime governance owns control-plane, lifecycle, and activation readiness preview artifacts." },
  { ownershipCategory: "runtime-review", totalArtifacts: 5, reason: "Runtime review owns certification, governance review, boundary, freeze, and final review preview artifacts." },
  { ownershipCategory: "runtime-safety", totalArtifacts: 3, reason: "Runtime safety owns design, evidence, and observability preview artifacts." }
];

const VERSION_ENTRIES: Array<Omit<GovernanceRuntimeResearchManifestVersionEntry, "id" | "previewOnly">> = MANIFEST_RECORDS.map((record) => ({
  version: record.version,
  reason: `${record.version} is included in the runtime governance research manifest preview.`
}));

const PREVIEW_SUMMARIES: Array<Omit<GovernanceRuntimePreviewOnlyManifestSummary, "id" | "previewOnly">> = [
  { category: "runtime-activation", reason: "Runtime activation remains not approved and not executed in the manifest preview." },
  { category: "runtime-autonomy", reason: "Runtime autonomy remains disabled in the manifest preview." },
  { category: "runtime-control-plane", reason: "Runtime control plane remains preview-only and is not applied in the manifest preview." },
  { category: "runtime-governance", reason: "Runtime governance remains preview-only and disabled in the manifest preview." },
  { category: "runtime-observability", reason: "Runtime observability remains preview-only and is not enforced in the manifest preview." },
  { category: "runtime-policy-enforcement", reason: "Runtime policy enforcement remains disabled in the manifest preview." }
];

const FORBIDDEN_RECORDS: Array<Omit<GovernanceRuntimeForbiddenCapabilityManifestRecord, "id" | "permanentlyForbidden">> = [
  { category: "mutation-scope-expansion", reason: "Mutation scope expansion remains forbidden in the manifest preview." },
  { category: "runtime-autonomy", reason: "Runtime autonomy enablement remains forbidden in the manifest preview." },
  { category: "runtime-learning", reason: "Runtime learning remains forbidden in the manifest preview." },
  { category: "runtime-ml-decisioning", reason: "ML/vector DB governance remains forbidden in the manifest preview." },
  { category: "runtime-multi-agent-coordination", reason: "Uncontrolled multi-agent coordination remains forbidden in the manifest preview." },
  { category: "runtime-plugin-execution", reason: "Runtime plugin execution remains forbidden in the manifest preview." },
  { category: "runtime-policy-enforcement", reason: "Runtime policy enforcement remains forbidden in the manifest preview." },
  { category: "runtime-script-execution", reason: "Runtime script evaluation remains forbidden in the manifest preview." },
  { category: "safe-patch-engine-bypass", reason: "Safe Patch Engine bypass remains forbidden in the manifest preview." }
];

const FUTURE_NOTES: Array<Omit<GovernanceRuntimeFutureManifestNote, "id" | "futureOnly">> = [
  { category: "future-certification-review", reason: "Future runtime systems require certification review before any runtime governance system could be considered." },
  { category: "future-human-review", reason: "Future runtime systems require explicit human approval before any activation could be considered." },
  { category: "future-human-review", reason: "Future runtime systems require separate human review outside this manifest preview." },
  { category: "future-runtime-research", reason: "Future runtime systems must preserve Safe Patch Engine exclusivity." },
  { category: "future-runtime-safety-review", reason: "Future runtime systems require freeze validation before any activation could be considered." },
  { category: "future-runtime-safety-review", reason: "Future runtime systems require rollback validation before any activation could be considered." }
];

function withDeterministicIds<T>(prefix: string, items: T[], sortKey: (item: T) => string): Array<T & { id: string }> {
  return [...items]
    .sort((a, b) => sortKey(a).localeCompare(sortKey(b)))
    .map((item, index) => ({ id: `${prefix}-${String(index + 1).padStart(3, "0")}`, ...item }));
}

function conclusionFor(source: GovernanceRuntimeResearchRegistryPreview): Pick<GovernanceRuntimeResearchManifestPreview, "previewStatus" | "runtimeResearchManifestConclusion" | "recommendedNextStage"> {
  if (source.previewStatus === "not-created") return { previewStatus: "not-created", runtimeResearchManifestConclusion: "source-missing", recommendedNextStage: "continue-preview-only-research" };
  if (source.previewStatus === "blocked") return { previewStatus: "blocked", runtimeResearchManifestConclusion: "blocked", recommendedNextStage: "blocked" };
  if (source.runtimeResearchRegistryConclusion === "research-registry-ready") return { previewStatus: "created", runtimeResearchManifestConclusion: "research-manifest-ready", recommendedNextStage: "prepare-runtime-governance-research-attestation-preview" };
  return { previewStatus: "created", runtimeResearchManifestConclusion: "not-ready", recommendedNextStage: "continue-preview-only-research" };
}

function scoreFor(conclusion: GovernanceRuntimeResearchManifestPreview["runtimeResearchManifestConclusion"]): GovernanceRuntimeResearchManifestScore {
  if (conclusion === "blocked") return { score: 0, rating: "blocked", reason: "Runtime governance research manifest preview is blocked by source status." };
  if (conclusion === "source-missing") return { score: 20, rating: "not-ready", reason: "Runtime governance research registry preview is missing." };
  if (conclusion === "not-ready") return { score: 40, rating: "partial-manifest-readiness", reason: "Runtime governance research registry exists but is not ready for manifest preview." };
  return { score: 80, rating: "research-manifest-ready", reason: "Runtime governance research manifest is ready as preview-only documentation." };
}

const buildManifestGroups = (): GovernanceRuntimeResearchManifestGroup[] =>
  withDeterministicIds("gov-runtime-research-manifest-group", MANIFEST_GROUPS.map((item) => ({ ...item, previewOnly: true as const })), (item) => `${item.category}:${item.key}`);

const buildManifestRecords = (): GovernanceRuntimeResearchManifestRecord[] =>
  withDeterministicIds("gov-runtime-research-manifest-record", MANIFEST_RECORDS.map((item) => ({ ...item, previewOnly: true as const })), (item) => `${item.version}:${item.manifestType}`);

const buildOwnershipEntries = (): GovernanceRuntimeResearchManifestOwnershipEntry[] =>
  withDeterministicIds("gov-runtime-research-manifest-ownership", OWNERSHIP_ENTRIES.map((item) => ({ ...item, previewOnly: true as const })), (item) => item.ownershipCategory);

const buildVersionEntries = (): GovernanceRuntimeResearchManifestVersionEntry[] =>
  withDeterministicIds("gov-runtime-research-manifest-version", VERSION_ENTRIES.map((item) => ({ ...item, previewOnly: true as const })), (item) => item.version);

const buildPreviewSummaries = (): GovernanceRuntimePreviewOnlyManifestSummary[] =>
  withDeterministicIds("gov-runtime-research-manifest-preview", PREVIEW_SUMMARIES.map((item) => ({ ...item, previewOnly: true as const })), (item) => item.category);

const buildForbiddenRecords = (): GovernanceRuntimeForbiddenCapabilityManifestRecord[] =>
  withDeterministicIds("gov-runtime-research-manifest-forbidden", FORBIDDEN_RECORDS.map((item) => ({ ...item, permanentlyForbidden: true as const })), (item) => item.category);

const buildFutureNotes = (): GovernanceRuntimeFutureManifestNote[] =>
  withDeterministicIds("gov-runtime-research-manifest-note", FUTURE_NOTES.map((item) => ({ ...item, futureOnly: true as const })), (item) => `${item.category}:${item.reason}`);

function warningsFor(conclusion: GovernanceRuntimeResearchManifestPreview["runtimeResearchManifestConclusion"]): string[] {
  const warnings = [
    "Runtime governance research manifest preview is advisory only.",
    "Runtime research manifest was not applied or enforced.",
    "Runtime research registry was not applied or enforced.",
    "Runtime governance is not enabled.",
    "Runtime autonomy is not enabled.",
    "Runtime activation was not approved or executed.",
    "Runtime policies are not enforced.",
    "Runtime behavior did not change.",
    "Repair orchestration did not change."
  ];
  if (conclusion === "source-missing") warnings.unshift("Runtime governance research registry source is missing; research manifest preview is incomplete.");
  if (conclusion === "not-ready") warnings.unshift("Runtime governance research registry is not ready for research manifest preview.");
  if (conclusion === "research-manifest-ready") warnings.unshift("Runtime governance research manifest preview is ready as preview-only documentation.");
  if (conclusion === "blocked") warnings.unshift("Runtime governance research registry is blocked; research manifest preview is blocked.");
  return warnings;
}

export function buildGovernanceRuntimeResearchManifestPreviewFromRegistry(source: GovernanceRuntimeResearchRegistryPreview): GovernanceRuntimeResearchManifestPreview {
  const conclusion = conclusionFor(source);
  const researchManifestScore = scoreFor(conclusion.runtimeResearchManifestConclusion);
  const manifestGroups = buildManifestGroups();
  const manifestRecords = buildManifestRecords();
  const manifestOwnershipEntries = buildOwnershipEntries();
  const manifestVersionEntries = buildVersionEntries();
  const previewOnlyManifestSummaries = buildPreviewSummaries();
  const forbiddenCapabilityManifestRecords = buildForbiddenRecords();
  const futureOnlyManifestNotes = buildFutureNotes();
  const warnings = warningsFor(conclusion.runtimeResearchManifestConclusion);
  const normalizedGovernanceArtifact = createReadonlyGovernanceArtifact({
    artifactType: "manifest",
    status: conclusion.runtimeResearchManifestConclusion === "research-manifest-ready" ? "ready" : conclusion.runtimeResearchManifestConclusion === "blocked" ? "blocked" : "preview",
    severity: conclusion.runtimeResearchManifestConclusion === "blocked" ? "critical" : "info",
    summary: "Runtime governance research manifest preview normalized as a read-only governance artifact.",
    reason: conclusion.runtimeResearchManifestConclusion,
    warnings,
    recommendations: [
      {
        type: conclusion.runtimeResearchManifestConclusion === "research-manifest-ready" ? "maintain-preview-only" : "continue",
        severity: "info",
        message: conclusion.runtimeResearchManifestConclusion === "research-manifest-ready" ? "Maintain preview-only runtime governance research manifest posture." : "Continue preview-only runtime governance research hardening."
      }
    ],
    metadata: {
      version: "v10.3",
      source: "runtime-governance-research-manifest-preview",
      command: "governance runtime research-manifest-preview",
      readonly: true,
      previewOnly: true
    },
    readonlyReason: "Runtime governance research manifest is descriptive only; no activation or enforcement is applied."
  });
  const normalizedGovernanceArtifactRegistry = registerGovernanceArtifact(
    createGovernanceArtifactRegistry("Runtime Governance Research Manifest Artifact Registry"),
    normalizedGovernanceArtifact
  );
  return {
    schemaVersion: 1,
    previewStatus: conclusion.previewStatus,
    sourceRuntimeResearchRegistryStatus: source.previewStatus,
    runtimeResearchManifestConclusion: conclusion.runtimeResearchManifestConclusion,
    runtimeResearchManifestApplied: GOVERNANCE_RUNTIME_RESEARCH_CHAIN_PREVIEW_FLAGS.runtimeResearchManifestApplied,
    runtimeResearchManifestEnforced: GOVERNANCE_RUNTIME_RESEARCH_CHAIN_PREVIEW_FLAGS.runtimeResearchManifestEnforced,
    runtimeResearchRegistryApplied: GOVERNANCE_RUNTIME_RESEARCH_CHAIN_PREVIEW_FLAGS.runtimeResearchRegistryApplied,
    runtimeResearchRegistryEnforced: GOVERNANCE_RUNTIME_RESEARCH_CHAIN_PREVIEW_FLAGS.runtimeResearchRegistryEnforced,
    runtimeResearchCatalogApplied: GOVERNANCE_RUNTIME_RESEARCH_CHAIN_PREVIEW_FLAGS.runtimeResearchCatalogApplied,
    runtimeResearchCatalogEnforced: GOVERNANCE_RUNTIME_RESEARCH_CHAIN_PREVIEW_FLAGS.runtimeResearchCatalogEnforced,
    runtimeResearchArchiveApplied: GOVERNANCE_RUNTIME_RESEARCH_CHAIN_PREVIEW_FLAGS.runtimeResearchArchiveApplied,
    runtimeResearchArchiveEnforced: GOVERNANCE_RUNTIME_RESEARCH_CHAIN_PREVIEW_FLAGS.runtimeResearchArchiveEnforced,
    runtimeResearchTimelineApplied: GOVERNANCE_RUNTIME_RESEARCH_CHAIN_PREVIEW_FLAGS.runtimeResearchTimelineApplied,
    runtimeResearchTimelineEnforced: GOVERNANCE_RUNTIME_RESEARCH_CHAIN_PREVIEW_FLAGS.runtimeResearchTimelineEnforced,
    runtimeResearchMapApplied: GOVERNANCE_RUNTIME_RESEARCH_CHAIN_PREVIEW_FLAGS.runtimeResearchMapApplied,
    runtimeResearchMapEnforced: GOVERNANCE_RUNTIME_RESEARCH_CHAIN_PREVIEW_FLAGS.runtimeResearchMapEnforced,
    runtimeResearchIndexApplied: GOVERNANCE_RUNTIME_RESEARCH_CHAIN_PREVIEW_FLAGS.runtimeResearchIndexApplied,
    runtimeResearchIndexEnforced: GOVERNANCE_RUNTIME_RESEARCH_CHAIN_PREVIEW_FLAGS.runtimeResearchIndexEnforced,
    runtimeResearchApplied: GOVERNANCE_RESEARCH_PREVIEW_FLAGS.runtimeResearchApplied,
    runtimeResearchEnforced: GOVERNANCE_RESEARCH_PREVIEW_FLAGS.runtimeResearchEnforced,
    runtimeFinalReviewApproved: GOVERNANCE_FINAL_REVIEW_PREVIEW_FLAGS.runtimeFinalReviewApproved,
    runtimeFinalReviewApplied: GOVERNANCE_FINAL_REVIEW_PREVIEW_FLAGS.runtimeFinalReviewApplied,
    runtimeFinalReviewEnforced: GOVERNANCE_FINAL_REVIEW_PREVIEW_FLAGS.runtimeFinalReviewEnforced,
    runtimeActivationApproved: GOVERNANCE_RUNTIME_DISABLED_FLAGS.runtimeActivationApproved,
    runtimeActivationExecuted: GOVERNANCE_RUNTIME_DISABLED_FLAGS.runtimeActivationExecuted,
    runtimeGovernanceEnabled: GOVERNANCE_RUNTIME_DISABLED_FLAGS.runtimeGovernanceEnabled,
    runtimeAutonomyEnabled: GOVERNANCE_RUNTIME_DISABLED_FLAGS.runtimeAutonomyEnabled,
    runtimeAutonomyActionsAllowed: GOVERNANCE_RUNTIME_DISABLED_FLAGS.runtimeAutonomyActionsAllowed,
    runtimePolicyEnforcementEnabled: GOVERNANCE_RUNTIME_DISABLED_FLAGS.runtimePolicyEnforcementEnabled,
    runtimeConfigActivationEnabled: GOVERNANCE_RUNTIME_DISABLED_FLAGS.runtimeConfigActivationEnabled,
    runtimeControlPlaneApplied: GOVERNANCE_RUNTIME_DISABLED_FLAGS.runtimeControlPlaneApplied,
    runtimeControlPlaneActivated: GOVERNANCE_RUNTIME_DISABLED_FLAGS.runtimeControlPlaneActivated,
    runtimeKillSwitchActivated: GOVERNANCE_RUNTIME_DISABLED_FLAGS.runtimeKillSwitchActivated,
    runtimeEmergencyStopExecuted: GOVERNANCE_RUNTIME_DISABLED_FLAGS.runtimeEmergencyStopExecuted,
    runtimeOperatorOverrideApplied: GOVERNANCE_RUNTIME_DISABLED_FLAGS.runtimeOperatorOverrideApplied,
    runtimeRollbackExecuted: GOVERNANCE_RUNTIME_DISABLED_FLAGS.runtimeRollbackExecuted,
    runtimeObservabilityApplied: GOVERNANCE_RUNTIME_DISABLED_FLAGS.runtimeObservabilityApplied,
    runtimeObservabilityEnforced: GOVERNANCE_RUNTIME_DISABLED_FLAGS.runtimeObservabilityEnforced,
    runtimeSafetyApplied: GOVERNANCE_RUNTIME_DISABLED_FLAGS.runtimeSafetyApplied,
    runtimeSafetyEnforced: GOVERNANCE_RUNTIME_DISABLED_FLAGS.runtimeSafetyEnforced,
    runtimeSafetyActivated: GOVERNANCE_RUNTIME_DISABLED_FLAGS.runtimeSafetyActivated,
    runtimeSandboxExecutionAllowed: GOVERNANCE_RUNTIME_DISABLED_FLAGS.runtimeSandboxExecutionAllowed,
    runtimeSandboxExecuted: GOVERNANCE_RUNTIME_DISABLED_FLAGS.runtimeSandboxExecuted,
    runtimeMutationScopeExpanded: GOVERNANCE_RUNTIME_DISABLED_FLAGS.runtimeMutationScopeExpanded,
    runtimeExternalExecutionAllowed: GOVERNANCE_RUNTIME_DISABLED_FLAGS.runtimeExternalExecutionAllowed,
    runtimePluginExecutionAllowed: GOVERNANCE_RUNTIME_DISABLED_FLAGS.runtimePluginExecutionAllowed,
    runtimeScriptEvaluationAllowed: GOVERNANCE_RUNTIME_DISABLED_FLAGS.runtimeScriptEvaluationAllowed,
    runtimeLearningEnabled: GOVERNANCE_RUNTIME_DISABLED_FLAGS.runtimeLearningEnabled,
    runtimeMlDecisioningEnabled: GOVERNANCE_RUNTIME_DISABLED_FLAGS.runtimeMlDecisioningEnabled,
    runtimeMultiAgentCoordinationEnabled: GOVERNANCE_RUNTIME_DISABLED_FLAGS.runtimeMultiAgentCoordinationEnabled,
    governanceBypassAllowed: GOVERNANCE_RUNTIME_DISABLED_FLAGS.governanceBypassAllowed,
    applied: GOVERNANCE_PREVIEW_ONLY_EXECUTION_FLAGS.applied,
    enforced: GOVERNANCE_PREVIEW_ONLY_EXECUTION_FLAGS.enforced,
    policyRuntimeMode: GOVERNANCE_PREVIEW_ONLY_EXECUTION_FLAGS.policyRuntimeMode,
    runtimeBehaviorChanged: GOVERNANCE_PREVIEW_ONLY_EXECUTION_FLAGS.runtimeBehaviorChanged,
    governanceDecisionsChanged: GOVERNANCE_PREVIEW_ONLY_EXECUTION_FLAGS.governanceDecisionsChanged,
    repairOrchestrationChanged: GOVERNANCE_PREVIEW_ONLY_EXECUTION_FLAGS.repairOrchestrationChanged,
    safePatchEngineOnly: GOVERNANCE_PREVIEW_ONLY_EXECUTION_FLAGS.safePatchEngineOnly,
    researchManifestScore,
    manifestGroups,
    manifestRecords,
    manifestOwnershipEntries,
    manifestVersionEntries,
    previewOnlyManifestSummaries,
    forbiddenCapabilityManifestRecords,
    futureOnlyManifestNotes,
    normalizedGovernanceArtifact,
    normalizedGovernanceArtifactRegistry,
    summary: {
      researchManifestScoreValue: researchManifestScore.score,
      totalManifestGroups: manifestGroups.length,
      totalManifestRecords: manifestRecords.length,
      totalManifestOwnershipEntries: manifestOwnershipEntries.length,
      totalManifestVersionEntries: manifestVersionEntries.length,
      totalPreviewOnlyManifestSummaries: previewOnlyManifestSummaries.length,
      totalForbiddenCapabilityManifestRecords: forbiddenCapabilityManifestRecords.length,
      totalFutureOnlyManifestNotes: futureOnlyManifestNotes.length,
      researchManifestReady: conclusion.runtimeResearchManifestConclusion === "research-manifest-ready"
    },
    warnings,
    recommendedNextStage: conclusion.recommendedNextStage
  };
}

export function buildGovernanceRuntimeResearchManifestPreview(projectRoot: string): GovernanceRuntimeResearchManifestPreview {
  return buildGovernanceRuntimeResearchManifestPreviewFromRegistry(buildGovernanceRuntimeResearchRegistryPreview(projectRoot));
}

export function renderGovernanceRuntimeResearchManifestPreviewMarkdown(preview: GovernanceRuntimeResearchManifestPreview): string {
  const sharedStatus = preview.runtimeResearchManifestConclusion === "research-manifest-ready"
    ? "ready"
    : preview.runtimeResearchManifestConclusion === "blocked"
      ? "blocked"
      : "preview";
  const lines = [
    "# AI Software Factory - Runtime Governance Research Manifest Preview",
    "",
    "Preview status:", preview.previewStatus,
    "", "Source runtime research registry status:", preview.sourceRuntimeResearchRegistryStatus,
    "", "Runtime research manifest conclusion:", preview.runtimeResearchManifestConclusion,
    "", "Runtime research manifest applied:", String(preview.runtimeResearchManifestApplied),
    "", "Runtime research manifest enforced:", String(preview.runtimeResearchManifestEnforced),
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
    "", "Research manifest score:", String(preview.researchManifestScore.score),
    "", "Research manifest rating:", preview.researchManifestScore.rating,
    "", "Manifest group count:", String(preview.summary.totalManifestGroups),
    "", "Manifest record count:", String(preview.summary.totalManifestRecords),
    "", "Manifest ownership entry count:", String(preview.summary.totalManifestOwnershipEntries),
    "", "Manifest version entry count:", String(preview.summary.totalManifestVersionEntries),
    "", "Preview-only manifest summary count:", String(preview.summary.totalPreviewOnlyManifestSummaries),
    "", "Forbidden capability manifest record count:", String(preview.summary.totalForbiddenCapabilityManifestRecords),
    "", "Future-only manifest note count:", String(preview.summary.totalFutureOnlyManifestNotes),
    "", "Research manifest ready:", String(preview.summary.researchManifestReady),
    "", "Recommended next stage:", preview.recommendedNextStage,
    "",
    "## Shared Governance Artifact Foundation",
    "",
    renderSummary("Runtime governance research manifest remains a deterministic preview-only governance artifact."),
    "",
    renderStatusBlock(sharedStatus, preview.runtimeResearchManifestConclusion === "blocked" ? "critical" : "info", preview.runtimeResearchManifestConclusion),
    "",
    renderMetadata({
      version: "v10.1",
      source: "runtime-governance-research-manifest-preview",
      command: "governance runtime research-manifest-preview",
      readonly: true,
      previewOnly: true
    }),
    "",
    renderWarnings([]),
    "",
    renderRecommendations([
      {
        type: preview.summary.researchManifestReady ? "maintain-preview-only" : "continue",
        severity: "info",
        message: preview.summary.researchManifestReady ? "Maintain preview-only posture for runtime governance research manifest artifacts." : "Continue preview-only governance research hardening."
      }
    ]),
    "",
    renderDivider(),
    "",
    "## Normalized Governance Artifact",
    "",
    renderGovernanceArtifact(preview.normalizedGovernanceArtifact),
    "",
    "## Normalized Governance Artifact Registry",
    "",
    renderGovernanceArtifactRegistrySummary(preview.normalizedGovernanceArtifactRegistry.summary),
    "", "## Manifest Groups", ""
  ];
  for (const item of preview.manifestGroups) lines.push(`- [${item.category}] ${item.id} ${item.key} totalRecords=${item.totalRecords} previewOnly=${String(item.previewOnly)} - ${item.reason}`);
  lines.push("", "## Manifest Records", "");
  for (const item of preview.manifestRecords) lines.push(`- [${item.version}/${item.manifestType}] ${item.id} previewOnly=${String(item.previewOnly)} - ${item.reason}`);
  lines.push("", "## Manifest Ownership Entries", "");
  for (const item of preview.manifestOwnershipEntries) lines.push(`- [${item.ownershipCategory}] ${item.id} totalArtifacts=${item.totalArtifacts} previewOnly=${String(item.previewOnly)} - ${item.reason}`);
  lines.push("", "## Manifest Version Entries", "");
  for (const item of preview.manifestVersionEntries) lines.push(`- [${item.version}] ${item.id} previewOnly=${String(item.previewOnly)} - ${item.reason}`);
  lines.push("", "## Preview-only Manifest Summaries", "");
  for (const item of preview.previewOnlyManifestSummaries) lines.push(`- [${item.category}] ${item.id} previewOnly=${String(item.previewOnly)} - ${item.reason}`);
  lines.push("", "## Forbidden Capability Manifest Records", "");
  for (const item of preview.forbiddenCapabilityManifestRecords) lines.push(`- [${item.category}] ${item.id} permanentlyForbidden=${String(item.permanentlyForbidden)} - ${item.reason}`);
  lines.push("", "## Future-only Manifest Notes", "");
  for (const item of preview.futureOnlyManifestNotes) lines.push(`- [${item.category}] ${item.id} futureOnly=${String(item.futureOnly)} - ${item.reason}`);
  lines.push("", "## Warnings", "");
  for (const warning of preview.warnings) lines.push(`- ${warning}`);
  return `${lines.join("\n")}\n`;
}

export function renderGovernanceRuntimeResearchManifestPreviewText(preview: GovernanceRuntimeResearchManifestPreview): string {
  return renderGovernanceRuntimeResearchManifestPreviewMarkdown(preview);
}

export function writeGovernanceRuntimeResearchManifestPreviewArtifacts(projectRoot: string, preview: GovernanceRuntimeResearchManifestPreview): { jsonPath: string; markdownPath: string } {
  const jsonPath = path.join(projectRoot, ARTIFACT_JSON_PATH);
  const markdownPath = path.join(projectRoot, ARTIFACT_MARKDOWN_PATH);
  fs.ensureDirSync(path.dirname(jsonPath));
  fs.writeFileSync(jsonPath, `${JSON.stringify(preview, null, 2)}\n`, "utf8");
  fs.writeFileSync(markdownPath, renderGovernanceRuntimeResearchManifestPreviewMarkdown(preview), "utf8");
  return { jsonPath: ARTIFACT_JSON_PATH, markdownPath: ARTIFACT_MARKDOWN_PATH };
}
