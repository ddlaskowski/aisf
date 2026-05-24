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
import { renderGovernanceArtifact, renderGovernanceArtifactRegistrySummary, renderMetadata, renderReadonlyStatusBlock, renderSummary, renderWarnings } from "./renderers/governanceRenderers.js";

import {
  buildGovernanceRuntimeResearchManifestPreview,
  type GovernanceRuntimeResearchManifestPreview
} from "./runtimeGovernanceResearchManifestPreview.js";

export type GovernanceRuntimeResearchAttestationScore = {
  score: 0 | 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90 | 100;
  rating: "blocked" | "not-ready" | "partial-attestation-readiness" | "research-attestation-ready";
  reason: string;
};

export type GovernanceRuntimeResearchAttestationGroup = {
  id: string;
  key: string;
  category: "runtime-safety" | "runtime-governance" | "runtime-review" | "post-v9-research" | "forbidden-capabilities" | "safe-patch-engine";
  totalRecords: number;
  previewOnly: true;
  reason: string;
};

export type GovernanceRuntimeResearchAttestationRecord = {
  id: string;
  version: string;
  attestationType:
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
    | "registry"
    | "manifest";
  previewOnly: true;
  reason: string;
};

export type GovernanceRuntimeResearchAttestationFinding = {
  id: string;
  category: "preview-only" | "safe-patch-engine" | "forbidden-capability" | "runtime-disabled" | "governance-disabled";
  severity: "info" | "warning" | "blocked";
  reason: string;
};

export type GovernanceRuntimeResearchAttestationOwnershipSummary = {
  id: string;
  ownershipCategory: "runtime-safety" | "runtime-governance" | "runtime-review" | "post-v9-research";
  totalArtifacts: number;
  previewOnly: true;
  reason: string;
};

export type GovernanceRuntimePreviewOnlyAttestationSummary = {
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

export type GovernanceRuntimeForbiddenCapabilityAttestationFinding = {
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

export type GovernanceRuntimeFutureAttestationNote = {
  id: string;
  category: "future-human-review" | "future-runtime-research" | "future-certification-review" | "future-runtime-safety-review";
  futureOnly: true;
  reason: string;
};

export type GovernanceRuntimeResearchAttestationPreview = {
  schemaVersion: 1;
  previewStatus: "not-created" | "created" | "blocked";
  sourceRuntimeResearchManifestStatus: "not-created" | "created" | "blocked";
  runtimeResearchAttestationConclusion: "source-missing" | "not-ready" | "research-attestation-ready" | "blocked";
  runtimeResearchAttestationApplied: false;
  runtimeResearchAttestationEnforced: false;
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
  researchAttestationScore: GovernanceRuntimeResearchAttestationScore;
  attestationGroups: GovernanceRuntimeResearchAttestationGroup[];
  attestationRecords: GovernanceRuntimeResearchAttestationRecord[];
  attestationFindings: GovernanceRuntimeResearchAttestationFinding[];
  attestationOwnershipSummaries: GovernanceRuntimeResearchAttestationOwnershipSummary[];
  previewOnlyAttestationSummaries: GovernanceRuntimePreviewOnlyAttestationSummary[];
  forbiddenCapabilityAttestationFindings: GovernanceRuntimeForbiddenCapabilityAttestationFinding[];
  futureOnlyAttestationNotes: GovernanceRuntimeFutureAttestationNote[];
  normalizedGovernanceArtifact: GovernanceArtifactWithReadonlyContract;
  normalizedGovernanceArtifactRegistry: GovernanceArtifactRegistry;
  summary: {
    researchAttestationScoreValue: number;
    totalAttestationGroups: number;
    totalAttestationRecords: number;
    totalAttestationFindings: number;
    totalAttestationOwnershipSummaries: number;
    totalPreviewOnlyAttestationSummaries: number;
    totalForbiddenCapabilityAttestationFindings: number;
    totalFutureOnlyAttestationNotes: number;
    researchAttestationReady: boolean;
  };
  warnings: string[];
  recommendedNextStage: "continue-preview-only-research" | "prepare-runtime-governance-preview-conclusion" | "blocked";
};

const ARTIFACT_JSON_PATH = ".factory/governance/runtime-governance-research-attestation-preview.json";
const ARTIFACT_MARKDOWN_PATH = ".factory/governance/runtime-governance-research-attestation-preview.md";

const ATTESTATION_GROUPS: Array<Omit<GovernanceRuntimeResearchAttestationGroup, "id" | "previewOnly">> = [
  { key: "forbidden-capabilities", category: "forbidden-capabilities", totalRecords: 9, reason: "Forbidden capabilities are attested as permanently forbidden." },
  { key: "post-v9-research", category: "post-v9-research", totalRecords: 8, reason: "Post-v9 research records are attested as preview-only documentation." },
  { key: "runtime-governance", category: "runtime-governance", totalRecords: 3, reason: "Runtime governance records are attested without enabling governance." },
  { key: "runtime-review", category: "runtime-review", totalRecords: 5, reason: "Runtime review records are attested without approval or enforcement." },
  { key: "runtime-safety", category: "runtime-safety", totalRecords: 3, reason: "Runtime safety records are attested as preview-only architecture." },
  { key: "safe-patch-engine", category: "safe-patch-engine", totalRecords: 1, reason: "Safe Patch Engine exclusivity is attested as the only mutation layer." }
];

const ATTESTATION_RECORDS: Array<Omit<GovernanceRuntimeResearchAttestationRecord, "id" | "previewOnly">> = [
  { version: "v8.0", attestationType: "design", reason: "Runtime safety design preview is attested as preview-only architecture." },
  { version: "v8.1", attestationType: "evidence", reason: "Runtime safety evidence preview is attested as preview-only architecture." },
  { version: "v8.2", attestationType: "observability", reason: "Runtime safety observability preview is attested as preview-only architecture." },
  { version: "v8.3", attestationType: "control-plane", reason: "Runtime control plane preview is attested without applying controls." },
  { version: "v8.4", attestationType: "lifecycle", reason: "Runtime lifecycle preview is attested without lifecycle transitions." },
  { version: "v8.5", attestationType: "activation-readiness", reason: "Runtime activation readiness preview is attested without activation." },
  { version: "v8.6", attestationType: "certification", reason: "Runtime safety certification preview is attested without certification application." },
  { version: "v8.7", attestationType: "governance-review", reason: "Runtime activation governance review preview is attested without approval." },
  { version: "v8.8", attestationType: "boundary-review", reason: "Runtime activation boundary preview is attested without boundary enforcement." },
  { version: "v8.9", attestationType: "freeze-review", reason: "Runtime activation freeze preview is attested without freeze execution." },
  { version: "v9.0", attestationType: "final-review", reason: "Runtime safety final review preview is attested without final approval." },
  { version: "v9.1", attestationType: "research", reason: "Post-v9 runtime research preview is attested as preview-only research." },
  { version: "v9.2", attestationType: "index", reason: "Runtime governance research index preview is attested as preview-only indexing." },
  { version: "v9.3", attestationType: "map", reason: "Runtime governance research map preview is attested as preview-only mapping." },
  { version: "v9.4", attestationType: "timeline", reason: "Runtime governance research timeline preview is attested as preview-only timeline documentation." },
  { version: "v9.5", attestationType: "archive", reason: "Runtime governance research archive preview is attested as preview-only archive documentation." },
  { version: "v9.6", attestationType: "catalog", reason: "Runtime governance research catalog preview is attested as preview-only catalog documentation." },
  { version: "v9.7", attestationType: "registry", reason: "Runtime governance research registry preview is attested as preview-only registry documentation." },
  { version: "v9.8", attestationType: "manifest", reason: "Runtime governance research manifest preview is attested as preview-only manifest documentation." }
];

const ATTESTATION_FINDINGS: Array<Omit<GovernanceRuntimeResearchAttestationFinding, "id">> = [
  { category: "forbidden-capability", severity: "warning", reason: "Forbidden runtime capabilities remain permanently blocked." },
  { category: "governance-disabled", severity: "info", reason: "Runtime governance remains disabled across the attested preview chain." },
  { category: "preview-only", severity: "info", reason: "Runtime governance research attestation is preview-only documentation." },
  { category: "runtime-disabled", severity: "info", reason: "Runtime activation remains not approved and not executed." },
  { category: "runtime-disabled", severity: "info", reason: "Runtime autonomy remains disabled across the attested preview chain." },
  { category: "safe-patch-engine", severity: "info", reason: "Safe Patch Engine remains the only mutation layer." }
];

const OWNERSHIP_SUMMARIES: Array<Omit<GovernanceRuntimeResearchAttestationOwnershipSummary, "id" | "previewOnly">> = [
  { ownershipCategory: "post-v9-research", totalArtifacts: 8, reason: "Post-v9 research owns research through manifest preview artifacts." },
  { ownershipCategory: "runtime-governance", totalArtifacts: 3, reason: "Runtime governance owns control-plane, lifecycle, and activation readiness preview artifacts." },
  { ownershipCategory: "runtime-review", totalArtifacts: 5, reason: "Runtime review owns certification, governance review, boundary, freeze, and final review preview artifacts." },
  { ownershipCategory: "runtime-safety", totalArtifacts: 3, reason: "Runtime safety owns design, evidence, and observability preview artifacts." }
];

const PREVIEW_SUMMARIES: Array<Omit<GovernanceRuntimePreviewOnlyAttestationSummary, "id" | "previewOnly">> = [
  { category: "runtime-activation", reason: "Runtime activation remains not approved and not executed in the attestation preview." },
  { category: "runtime-autonomy", reason: "Runtime autonomy remains disabled in the attestation preview." },
  { category: "runtime-control-plane", reason: "Runtime control plane remains preview-only and is not applied in the attestation preview." },
  { category: "runtime-governance", reason: "Runtime governance remains preview-only and disabled in the attestation preview." },
  { category: "runtime-observability", reason: "Runtime observability remains preview-only and is not enforced in the attestation preview." },
  { category: "runtime-policy-enforcement", reason: "Runtime policy enforcement remains disabled in the attestation preview." }
];

const FORBIDDEN_FINDINGS: Array<Omit<GovernanceRuntimeForbiddenCapabilityAttestationFinding, "id" | "permanentlyForbidden">> = [
  { category: "mutation-scope-expansion", reason: "Mutation scope expansion remains forbidden in the attestation preview." },
  { category: "runtime-autonomy", reason: "Runtime autonomy enablement remains forbidden in the attestation preview." },
  { category: "runtime-learning", reason: "Runtime learning remains forbidden in the attestation preview." },
  { category: "runtime-ml-decisioning", reason: "ML/vector DB governance remains forbidden in the attestation preview." },
  { category: "runtime-multi-agent-coordination", reason: "Uncontrolled multi-agent coordination remains forbidden in the attestation preview." },
  { category: "runtime-plugin-execution", reason: "Runtime plugin execution remains forbidden in the attestation preview." },
  { category: "runtime-policy-enforcement", reason: "Runtime policy enforcement remains forbidden in the attestation preview." },
  { category: "runtime-script-execution", reason: "Runtime script evaluation remains forbidden in the attestation preview." },
  { category: "safe-patch-engine-bypass", reason: "Safe Patch Engine bypass remains forbidden in the attestation preview." }
];

const FUTURE_NOTES: Array<Omit<GovernanceRuntimeFutureAttestationNote, "id" | "futureOnly">> = [
  { category: "future-certification-review", reason: "Future runtime systems require certification review before any runtime governance system could be considered." },
  { category: "future-human-review", reason: "Future runtime systems require explicit human approval before any activation could be considered." },
  { category: "future-human-review", reason: "Future runtime systems require separate human review outside this attestation preview." },
  { category: "future-runtime-research", reason: "Future runtime systems must preserve Safe Patch Engine exclusivity." },
  { category: "future-runtime-safety-review", reason: "Future runtime systems require freeze validation before any activation could be considered." },
  { category: "future-runtime-safety-review", reason: "Future runtime systems require rollback validation before any activation could be considered." }
];

function withDeterministicIds<T>(prefix: string, items: T[], sortKey: (item: T) => string): Array<T & { id: string }> {
  return [...items]
    .sort((a, b) => sortKey(a).localeCompare(sortKey(b)))
    .map((item, index) => ({ id: `${prefix}-${String(index + 1).padStart(3, "0")}`, ...item }));
}

function conclusionFor(source: GovernanceRuntimeResearchManifestPreview): Pick<GovernanceRuntimeResearchAttestationPreview, "previewStatus" | "runtimeResearchAttestationConclusion" | "recommendedNextStage"> {
  if (source.previewStatus === "not-created") return { previewStatus: "not-created", runtimeResearchAttestationConclusion: "source-missing", recommendedNextStage: "continue-preview-only-research" };
  if (source.previewStatus === "blocked") return { previewStatus: "blocked", runtimeResearchAttestationConclusion: "blocked", recommendedNextStage: "blocked" };
  if (source.runtimeResearchManifestConclusion === "research-manifest-ready") return { previewStatus: "created", runtimeResearchAttestationConclusion: "research-attestation-ready", recommendedNextStage: "prepare-runtime-governance-preview-conclusion" };
  return { previewStatus: "created", runtimeResearchAttestationConclusion: "not-ready", recommendedNextStage: "continue-preview-only-research" };
}

function scoreFor(conclusion: GovernanceRuntimeResearchAttestationPreview["runtimeResearchAttestationConclusion"]): GovernanceRuntimeResearchAttestationScore {
  if (conclusion === "blocked") return { score: 0, rating: "blocked", reason: "Runtime governance research attestation preview is blocked by source status." };
  if (conclusion === "source-missing") return { score: 20, rating: "not-ready", reason: "Runtime governance research manifest preview is missing." };
  if (conclusion === "not-ready") return { score: 40, rating: "partial-attestation-readiness", reason: "Runtime governance research manifest exists but is not ready for attestation preview." };
  return { score: 80, rating: "research-attestation-ready", reason: "Runtime governance research attestation is ready as preview-only documentation." };
}

const buildAttestationGroups = (): GovernanceRuntimeResearchAttestationGroup[] =>
  withDeterministicIds("gov-runtime-research-attestation-group", ATTESTATION_GROUPS.map((item) => ({ ...item, previewOnly: true as const })), (item) => `${item.category}:${item.key}`);

const buildAttestationRecords = (): GovernanceRuntimeResearchAttestationRecord[] =>
  withDeterministicIds("gov-runtime-research-attestation-record", ATTESTATION_RECORDS.map((item) => ({ ...item, previewOnly: true as const })), (item) => `${item.version}:${item.attestationType}`);

const buildAttestationFindings = (): GovernanceRuntimeResearchAttestationFinding[] =>
  withDeterministicIds("gov-runtime-research-attestation-finding", ATTESTATION_FINDINGS, (item) => `${item.category}:${item.severity}:${item.reason}`);

const buildOwnershipSummaries = (): GovernanceRuntimeResearchAttestationOwnershipSummary[] =>
  withDeterministicIds("gov-runtime-research-attestation-ownership", OWNERSHIP_SUMMARIES.map((item) => ({ ...item, previewOnly: true as const })), (item) => item.ownershipCategory);

const buildPreviewSummaries = (): GovernanceRuntimePreviewOnlyAttestationSummary[] =>
  withDeterministicIds("gov-runtime-research-attestation-preview", PREVIEW_SUMMARIES.map((item) => ({ ...item, previewOnly: true as const })), (item) => item.category);

const buildForbiddenFindings = (): GovernanceRuntimeForbiddenCapabilityAttestationFinding[] =>
  withDeterministicIds("gov-runtime-research-attestation-forbidden", FORBIDDEN_FINDINGS.map((item) => ({ ...item, permanentlyForbidden: true as const })), (item) => item.category);

const buildFutureNotes = (): GovernanceRuntimeFutureAttestationNote[] =>
  withDeterministicIds("gov-runtime-research-attestation-note", FUTURE_NOTES.map((item) => ({ ...item, futureOnly: true as const })), (item) => `${item.category}:${item.reason}`);

function warningsFor(conclusion: GovernanceRuntimeResearchAttestationPreview["runtimeResearchAttestationConclusion"]): string[] {
  const warnings = [
    "Runtime governance research attestation preview is advisory only.",
    "Runtime research attestation was not applied or enforced.",
    "Runtime research manifest was not applied or enforced.",
    "Runtime governance is not enabled.",
    "Runtime autonomy is not enabled.",
    "Runtime activation was not approved or executed.",
    "Runtime policies are not enforced.",
    "Runtime behavior did not change.",
    "Repair orchestration did not change."
  ];
  if (conclusion === "source-missing") warnings.unshift("Runtime governance research manifest source is missing; research attestation preview is incomplete.");
  if (conclusion === "not-ready") warnings.unshift("Runtime governance research manifest is not ready for research attestation preview.");
  if (conclusion === "research-attestation-ready") warnings.unshift("Runtime governance research attestation preview is ready as preview-only documentation.");
  if (conclusion === "blocked") warnings.unshift("Runtime governance research manifest is blocked; research attestation preview is blocked.");
  return warnings;
}

export function buildGovernanceRuntimeResearchAttestationPreviewFromManifest(source: GovernanceRuntimeResearchManifestPreview): GovernanceRuntimeResearchAttestationPreview {
  const conclusion = conclusionFor(source);
  const researchAttestationScore = scoreFor(conclusion.runtimeResearchAttestationConclusion);
  const attestationGroups = buildAttestationGroups();
  const attestationRecords = buildAttestationRecords();
  const attestationFindings = buildAttestationFindings();
  const attestationOwnershipSummaries = buildOwnershipSummaries();
  const previewOnlyAttestationSummaries = buildPreviewSummaries();
  const forbiddenCapabilityAttestationFindings = buildForbiddenFindings();
  const futureOnlyAttestationNotes = buildFutureNotes();
  const warnings = warningsFor(conclusion.runtimeResearchAttestationConclusion);
  const normalizedGovernanceArtifact = createReadonlyGovernanceArtifact({
    artifactType: "attestation",
    status: conclusion.runtimeResearchAttestationConclusion === "research-attestation-ready" ? "ready" : conclusion.runtimeResearchAttestationConclusion === "blocked" ? "blocked" : "preview",
    severity: conclusion.runtimeResearchAttestationConclusion === "blocked" ? "critical" : "info",
    summary: "Runtime governance research attestation preview normalized as a read-only governance artifact.",
    reason: conclusion.runtimeResearchAttestationConclusion,
    warnings,
    recommendations: [
      {
        type: conclusion.runtimeResearchAttestationConclusion === "research-attestation-ready" ? "maintain-preview-only" : "continue",
        severity: "info",
        message: conclusion.runtimeResearchAttestationConclusion === "research-attestation-ready" ? "Maintain preview-only runtime governance attestation posture." : "Continue preview-only runtime governance attestation hardening."
      }
    ],
    metadata: {
      version: "v10.3",
      source: "runtime-governance-research-attestation-preview",
      command: "governance runtime research-attestation-preview",
      readonly: true,
      previewOnly: true
    },
    readonlyReason: "Runtime governance research attestation is descriptive only; no activation or enforcement is applied."
  });
  const normalizedGovernanceArtifactRegistry = registerGovernanceArtifact(
    createGovernanceArtifactRegistry("Runtime Governance Research Attestation Artifact Registry"),
    normalizedGovernanceArtifact
  );
  return {
    schemaVersion: 1,
    previewStatus: conclusion.previewStatus,
    sourceRuntimeResearchManifestStatus: source.previewStatus,
    runtimeResearchAttestationConclusion: conclusion.runtimeResearchAttestationConclusion,
    runtimeResearchAttestationApplied: false,
    runtimeResearchAttestationEnforced: false,
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
    researchAttestationScore,
    attestationGroups,
    attestationRecords,
    attestationFindings,
    attestationOwnershipSummaries,
    previewOnlyAttestationSummaries,
    forbiddenCapabilityAttestationFindings,
    futureOnlyAttestationNotes,
    normalizedGovernanceArtifact,
    normalizedGovernanceArtifactRegistry,
    summary: {
      researchAttestationScoreValue: researchAttestationScore.score,
      totalAttestationGroups: attestationGroups.length,
      totalAttestationRecords: attestationRecords.length,
      totalAttestationFindings: attestationFindings.length,
      totalAttestationOwnershipSummaries: attestationOwnershipSummaries.length,
      totalPreviewOnlyAttestationSummaries: previewOnlyAttestationSummaries.length,
      totalForbiddenCapabilityAttestationFindings: forbiddenCapabilityAttestationFindings.length,
      totalFutureOnlyAttestationNotes: futureOnlyAttestationNotes.length,
      researchAttestationReady: conclusion.runtimeResearchAttestationConclusion === "research-attestation-ready"
    },
    warnings,
    recommendedNextStage: conclusion.recommendedNextStage
  };
}

export function buildGovernanceRuntimeResearchAttestationPreview(projectRoot: string): GovernanceRuntimeResearchAttestationPreview {
  return buildGovernanceRuntimeResearchAttestationPreviewFromManifest(buildGovernanceRuntimeResearchManifestPreview(projectRoot));
}

export function renderGovernanceRuntimeResearchAttestationPreviewMarkdown(preview: GovernanceRuntimeResearchAttestationPreview): string {
  const lines = [
    "# AI Software Factory - Runtime Governance Research Attestation Preview",
    "",
    "Preview status:", preview.previewStatus,
    "", "Source runtime research manifest status:", preview.sourceRuntimeResearchManifestStatus,
    "", "Runtime research attestation conclusion:", preview.runtimeResearchAttestationConclusion,
    "", "Runtime research attestation applied:", String(preview.runtimeResearchAttestationApplied),
    "", "Runtime research attestation enforced:", String(preview.runtimeResearchAttestationEnforced),
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
    "", "Research attestation score:", String(preview.researchAttestationScore.score),
    "", "Research attestation rating:", preview.researchAttestationScore.rating,
    "", "Attestation group count:", String(preview.summary.totalAttestationGroups),
    "", "Attestation record count:", String(preview.summary.totalAttestationRecords),
    "", "Attestation finding count:", String(preview.summary.totalAttestationFindings),
    "", "Attestation ownership summary count:", String(preview.summary.totalAttestationOwnershipSummaries),
    "", "Preview-only attestation summary count:", String(preview.summary.totalPreviewOnlyAttestationSummaries),
    "", "Forbidden capability attestation finding count:", String(preview.summary.totalForbiddenCapabilityAttestationFindings),
    "", "Future-only attestation note count:", String(preview.summary.totalFutureOnlyAttestationNotes),
    "", "Research attestation ready:", String(preview.summary.researchAttestationReady),
    "", "Recommended next stage:", preview.recommendedNextStage,
    "",
    "## Shared Governance Rendering Foundation",
    "",
    renderSummary("Runtime governance research attestation remains deterministic, read-only, and preview-only."),
    "",
    renderReadonlyStatusBlock(true),
    "",
    renderMetadata({
      version: "v10.2",
      source: "runtime-governance-research-attestation-preview",
      command: "governance runtime research-attestation-preview",
      readonly: true,
      previewOnly: true
    }),
    "",
    renderWarnings([]),
    "",
    "## Normalized Governance Artifact",
    "",
    renderGovernanceArtifact(preview.normalizedGovernanceArtifact),
    "",
    "## Normalized Governance Artifact Registry",
    "",
    renderGovernanceArtifactRegistrySummary(preview.normalizedGovernanceArtifactRegistry.summary),
    "", "## Attestation Groups", ""
  ];
  for (const item of preview.attestationGroups) lines.push(`- [${item.category}] ${item.id} ${item.key} totalRecords=${item.totalRecords} previewOnly=${String(item.previewOnly)} - ${item.reason}`);
  lines.push("", "## Attestation Records", "");
  for (const item of preview.attestationRecords) lines.push(`- [${item.version}/${item.attestationType}] ${item.id} previewOnly=${String(item.previewOnly)} - ${item.reason}`);
  lines.push("", "## Attestation Findings", "");
  for (const item of preview.attestationFindings) lines.push(`- [${item.category}/${item.severity}] ${item.id} - ${item.reason}`);
  lines.push("", "## Attestation Ownership Summaries", "");
  for (const item of preview.attestationOwnershipSummaries) lines.push(`- [${item.ownershipCategory}] ${item.id} totalArtifacts=${item.totalArtifacts} previewOnly=${String(item.previewOnly)} - ${item.reason}`);
  lines.push("", "## Preview-only Attestation Summaries", "");
  for (const item of preview.previewOnlyAttestationSummaries) lines.push(`- [${item.category}] ${item.id} previewOnly=${String(item.previewOnly)} - ${item.reason}`);
  lines.push("", "## Forbidden Capability Attestation Findings", "");
  for (const item of preview.forbiddenCapabilityAttestationFindings) lines.push(`- [${item.category}] ${item.id} permanentlyForbidden=${String(item.permanentlyForbidden)} - ${item.reason}`);
  lines.push("", "## Future-only Attestation Notes", "");
  for (const item of preview.futureOnlyAttestationNotes) lines.push(`- [${item.category}] ${item.id} futureOnly=${String(item.futureOnly)} - ${item.reason}`);
  lines.push("", "## Warnings", "");
  for (const warning of preview.warnings) lines.push(`- ${warning}`);
  return `${lines.join("\n")}\n`;
}

export function renderGovernanceRuntimeResearchAttestationPreviewText(preview: GovernanceRuntimeResearchAttestationPreview): string {
  return renderGovernanceRuntimeResearchAttestationPreviewMarkdown(preview);
}

export function writeGovernanceRuntimeResearchAttestationPreviewArtifacts(projectRoot: string, preview: GovernanceRuntimeResearchAttestationPreview): { jsonPath: string; markdownPath: string } {
  const jsonPath = path.join(projectRoot, ARTIFACT_JSON_PATH);
  const markdownPath = path.join(projectRoot, ARTIFACT_MARKDOWN_PATH);
  fs.ensureDirSync(path.dirname(jsonPath));
  fs.writeFileSync(jsonPath, `${JSON.stringify(preview, null, 2)}\n`, "utf8");
  fs.writeFileSync(markdownPath, renderGovernanceRuntimeResearchAttestationPreviewMarkdown(preview), "utf8");
  return { jsonPath: ARTIFACT_JSON_PATH, markdownPath: ARTIFACT_MARKDOWN_PATH };
}
