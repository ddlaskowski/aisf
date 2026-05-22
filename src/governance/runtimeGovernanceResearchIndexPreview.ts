import fs from "fs-extra";
import path from "node:path";

import {
  buildGovernancePostV9RuntimeResearchPreview,
  type GovernancePostV9RuntimeResearchPreview
} from "./postV9RuntimeResearchPreview.js";

export type GovernanceRuntimeResearchIndexScore = {
  score: 0 | 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90 | 100;
  rating: "blocked" | "not-ready" | "partial-index-readiness" | "research-index-ready";
  reason: string;
};

export type GovernanceRuntimeResearchIndexEntry = {
  id: string;
  key: string;
  title: string;
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
    | "safe-patch-engine"
    | "forbidden-capability"
    | "human-research";
  source:
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
    | "post-v9-runtime-research-preview";
  status: "indexed-preview" | "preview-only" | "blocked";
  reason: string;
};

export type GovernanceRuntimeResearchCategorySummary = {
  id: string;
  category: string;
  totalEntries: number;
  previewOnly: boolean;
  reason: string;
};

export type GovernanceRuntimePreviewOnlyReference = {
  id: string;
  key: string;
  source: string;
  reason: string;
};

export type GovernanceRuntimeForbiddenCapabilityReference = {
  id: string;
  key: string;
  permanentlyForbidden: true;
  reason: string;
};

export type GovernanceRuntimeHumanResearchRequirementReference = {
  id: string;
  key: string;
  required: true;
  reason: string;
};

export type GovernanceRuntimeFutureFeasibilityReference = {
  id: string;
  key: string;
  futureOnly: true;
  reason: string;
};

export type GovernanceRuntimeResearchIndexPreview = {
  schemaVersion: 1;
  previewStatus: "not-created" | "created" | "blocked";
  sourceRuntimeResearchStatus: "not-created" | "created" | "blocked";
  runtimeResearchIndexConclusion: "source-missing" | "not-ready" | "research-index-ready" | "blocked";
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
  researchIndexScore: GovernanceRuntimeResearchIndexScore;
  researchIndexEntries: GovernanceRuntimeResearchIndexEntry[];
  categorySummaries: GovernanceRuntimeResearchCategorySummary[];
  previewOnlyReferences: GovernanceRuntimePreviewOnlyReference[];
  forbiddenCapabilityReferences: GovernanceRuntimeForbiddenCapabilityReference[];
  humanResearchRequirementReferences: GovernanceRuntimeHumanResearchRequirementReference[];
  futureFeasibilityReferences: GovernanceRuntimeFutureFeasibilityReference[];
  summary: {
    researchIndexScoreValue: number;
    totalIndexEntries: number;
    totalCategories: number;
    totalPreviewOnlyReferences: number;
    totalForbiddenCapabilityReferences: number;
    totalHumanResearchRequirementReferences: number;
    totalFutureFeasibilityReferences: number;
    researchIndexReady: boolean;
  };
  warnings: string[];
  recommendedNextStage:
    | "continue-preview-only-research"
    | "prepare-runtime-governance-research-map-preview"
    | "blocked";
};

const ARTIFACT_JSON_PATH = ".factory/governance/runtime-governance-research-index-preview.json";
const ARTIFACT_MARKDOWN_PATH = ".factory/governance/runtime-governance-research-index-preview.md";

const INDEX_ENTRY_DEFINITIONS: Array<Omit<GovernanceRuntimeResearchIndexEntry, "id" | "status">> = [
  { key: "forbidden-capabilities", title: "Forbidden Capabilities", category: "forbidden-capability", source: "post-v9-runtime-research-preview", reason: "Permanently forbidden runtime capabilities are indexed from post-v9 research." },
  { key: "human-research-requirements", title: "Human Research Requirements", category: "human-research", source: "post-v9-runtime-research-preview", reason: "Future human research requirements are indexed from post-v9 research." },
  { key: "post-v9-runtime-research", title: "Post-v9 Runtime Research", category: "post-v9-research", source: "post-v9-runtime-research-preview", reason: "Post-v9 runtime research posture is indexed as preview-only documentation." },
  { key: "runtime-activation-boundary", title: "Runtime Activation Boundary", category: "runtime-boundary-review", source: "runtime-activation-boundary-preview", reason: "Runtime activation boundaries are indexed for future review only." },
  { key: "runtime-activation-freeze", title: "Runtime Activation Freeze", category: "runtime-freeze-review", source: "runtime-activation-freeze-preview", reason: "Runtime activation freeze conditions are indexed without execution." },
  { key: "runtime-activation-governance-review", title: "Runtime Activation Governance Review", category: "runtime-governance-review", source: "runtime-activation-governance-review-preview", reason: "Governance review material is indexed without approval." },
  { key: "runtime-activation-readiness", title: "Runtime Activation Readiness", category: "runtime-activation-readiness", source: "runtime-activation-readiness-preview", reason: "Activation readiness is indexed without runtime activation." },
  { key: "runtime-control-plane", title: "Runtime Control Plane", category: "runtime-control-plane", source: "runtime-control-plane-preview", reason: "Runtime control-plane preview is indexed without control execution." },
  { key: "runtime-final-review", title: "Runtime Safety Final Review", category: "runtime-final-review", source: "runtime-safety-final-review-preview", reason: "Final review preview is indexed without approval." },
  { key: "runtime-governance-lifecycle", title: "Runtime Governance Lifecycle", category: "runtime-lifecycle", source: "runtime-lifecycle-preview", reason: "Runtime lifecycle preview is indexed without transition execution." },
  { key: "runtime-safety-certification", title: "Runtime Safety Certification", category: "runtime-certification", source: "runtime-safety-certification-preview", reason: "Runtime certification preview is indexed without certification application." },
  { key: "runtime-safety-design", title: "Runtime Safety Design", category: "runtime-safety", source: "runtime-safety-design-preview", reason: "Runtime safety design preview is indexed as architecture documentation." },
  { key: "runtime-safety-evidence", title: "Runtime Safety Evidence", category: "runtime-evidence", source: "runtime-safety-evidence-preview", reason: "Runtime safety evidence preview is indexed as documentation." },
  { key: "runtime-safety-observability", title: "Runtime Safety Observability", category: "runtime-observability", source: "runtime-safety-observability-preview", reason: "Runtime observability preview is indexed without telemetry execution." },
  { key: "safe-patch-engine-exclusivity", title: "Safe Patch Engine Exclusivity", category: "safe-patch-engine", source: "post-v9-runtime-research-preview", reason: "Safe Patch Engine exclusivity is indexed as the only mutation layer." }
];

const CATEGORY_DEFINITIONS = [
  "forbidden-capability",
  "human-research",
  "post-v9-research",
  "runtime-activation-readiness",
  "runtime-boundary-review",
  "runtime-certification",
  "runtime-control-plane",
  "runtime-evidence",
  "runtime-final-review",
  "runtime-freeze-review",
  "runtime-governance-review",
  "runtime-lifecycle",
  "runtime-observability",
  "runtime-safety",
  "safe-patch-engine"
];

const PREVIEW_ONLY_REFERENCES: Array<Omit<GovernanceRuntimePreviewOnlyReference, "id">> = [
  { key: "runtime-activation-preview-only", source: "runtime-activation-readiness-preview", reason: "Runtime activation remains preview-only and not executed." },
  { key: "runtime-autonomy-disabled", source: "post-v9-runtime-research-preview", reason: "Runtime autonomy remains preview-only and disabled." },
  { key: "runtime-certification-preview-only", source: "runtime-safety-certification-preview", reason: "Runtime certification remains preview-only." },
  { key: "runtime-control-plane-preview-only", source: "runtime-control-plane-preview", reason: "Runtime control plane remains preview-only." },
  { key: "runtime-governance-preview-only", source: "post-v9-runtime-research-preview", reason: "Runtime governance remains preview-only." },
  { key: "runtime-observability-preview-only", source: "runtime-safety-observability-preview", reason: "Runtime observability remains preview-only." },
  { key: "runtime-policy-enforcement-disabled", source: "post-v9-runtime-research-preview", reason: "Runtime policy enforcement remains disabled." }
];

const FORBIDDEN_CAPABILITY_REFERENCES: Array<Omit<GovernanceRuntimeForbiddenCapabilityReference, "id" | "permanentlyForbidden">> = [
  { key: "mutation-scope-expansion", reason: "Mutation scope expansion remains permanently forbidden." },
  { key: "runtime-autonomy-enablement", reason: "Runtime autonomy enablement remains permanently forbidden." },
  { key: "runtime-learning-enablement", reason: "Runtime learning enablement remains permanently forbidden." },
  { key: "runtime-ml-vector-db-governance", reason: "ML/vector DB governance remains permanently forbidden." },
  { key: "runtime-plugin-execution", reason: "Runtime plugin execution remains permanently forbidden." },
  { key: "runtime-policy-enforcement-enablement", reason: "Runtime policy enforcement enablement remains permanently forbidden." },
  { key: "runtime-script-execution", reason: "Runtime script execution remains permanently forbidden." },
  { key: "safe-patch-engine-bypass", reason: "Safe Patch Engine bypass remains permanently forbidden." },
  { key: "uncontrolled-runtime-multi-agent-coordination", reason: "Uncontrolled runtime multi-agent coordination remains permanently forbidden." }
];

const HUMAN_RESEARCH_REQUIREMENT_REFERENCES: Array<Omit<GovernanceRuntimeHumanResearchRequirementReference, "id" | "required">> = [
  { key: "governance-boundary-verification", reason: "Future runtime research would require governance boundary verification." },
  { key: "mandatory-human-governance-review", reason: "Future runtime research would require mandatory human governance review." },
  { key: "rollback-verification-research", reason: "Future runtime research would require rollback verification research." },
  { key: "runtime-activation-review", reason: "Future runtime research would require runtime activation review." },
  { key: "runtime-certification-review", reason: "Future runtime research would require runtime certification review." },
  { key: "runtime-freeze-validation-research", reason: "Future runtime research would require freeze validation research." },
  { key: "safe-patch-engine-review", reason: "Future runtime research would require Safe Patch Engine review." }
];

const FUTURE_FEASIBILITY_REFERENCES: Array<Omit<GovernanceRuntimeFutureFeasibilityReference, "id" | "futureOnly">> = [
  { key: "future-runtime-explicit-human-approval", reason: "Future runtime systems require explicit human approval." },
  { key: "future-runtime-freeze-validation", reason: "Future runtime systems require freeze validation." },
  { key: "future-runtime-rollback-validation", reason: "Future runtime systems require rollback validation." },
  { key: "future-runtime-safety-certification", reason: "Future runtime systems require runtime safety certification." },
  { key: "future-runtime-separate-design-review", reason: "Future runtime systems require separate design review." },
  { key: "safe-patch-engine-exclusivity-preserved", reason: "Future runtime systems must preserve Safe Patch Engine exclusivity." }
];

function withDeterministicIds<T>(prefix: string, items: T[], sortKey: (item: T) => string): Array<T & { id: string }> {
  return [...items]
    .sort((a, b) => sortKey(a).localeCompare(sortKey(b)))
    .map((item, index) => ({ id: `${prefix}-${String(index + 1).padStart(3, "0")}`, ...item }));
}

function conclusionFor(source: GovernancePostV9RuntimeResearchPreview): Pick<GovernanceRuntimeResearchIndexPreview, "previewStatus" | "runtimeResearchIndexConclusion" | "recommendedNextStage"> {
  if (source.previewStatus === "not-created") {
    return { previewStatus: "not-created", runtimeResearchIndexConclusion: "source-missing", recommendedNextStage: "continue-preview-only-research" };
  }
  if (source.previewStatus === "blocked") {
    return { previewStatus: "blocked", runtimeResearchIndexConclusion: "blocked", recommendedNextStage: "blocked" };
  }
  if (source.runtimeResearchConclusion === "future-research-ready") {
    return { previewStatus: "created", runtimeResearchIndexConclusion: "research-index-ready", recommendedNextStage: "prepare-runtime-governance-research-map-preview" };
  }
  return { previewStatus: "created", runtimeResearchIndexConclusion: "not-ready", recommendedNextStage: "continue-preview-only-research" };
}

function scoreFor(conclusion: GovernanceRuntimeResearchIndexPreview["runtimeResearchIndexConclusion"]): GovernanceRuntimeResearchIndexScore {
  if (conclusion === "blocked") return { score: 0, rating: "blocked", reason: "Runtime governance research index preview is blocked by source status." };
  if (conclusion === "source-missing") return { score: 20, rating: "not-ready", reason: "Post-v9 runtime research preview is missing." };
  if (conclusion === "not-ready") return { score: 40, rating: "partial-index-readiness", reason: "Post-v9 runtime research exists but is not ready for indexing." };
  return { score: 80, rating: "research-index-ready", reason: "Runtime governance research index is ready as preview-only documentation." };
}

function statusFor(conclusion: GovernanceRuntimeResearchIndexPreview["runtimeResearchIndexConclusion"]): GovernanceRuntimeResearchIndexEntry["status"] {
  if (conclusion === "blocked") return "blocked";
  if (conclusion === "research-index-ready") return "indexed-preview";
  return "preview-only";
}

function buildIndexEntries(conclusion: GovernanceRuntimeResearchIndexPreview["runtimeResearchIndexConclusion"]): GovernanceRuntimeResearchIndexEntry[] {
  return withDeterministicIds(
    "gov-runtime-research-index-entry",
    INDEX_ENTRY_DEFINITIONS.map((item) => ({ ...item, status: statusFor(conclusion) })),
    (item) => `${item.category}:${item.key}:${item.source}`
  );
}

function buildCategorySummaries(entries: GovernanceRuntimeResearchIndexEntry[]): GovernanceRuntimeResearchCategorySummary[] {
  const summaries = CATEGORY_DEFINITIONS.map((category) => {
    const totalEntries = entries.filter((item) => item.category === category).length;
    return {
      category,
      totalEntries,
      previewOnly: true,
      reason: `Category ${category} is indexed for preview-only runtime governance research.`
    };
  });
  return withDeterministicIds("gov-runtime-research-index-category", summaries, (item) => item.category);
}

function buildPreviewOnlyReferences(): GovernanceRuntimePreviewOnlyReference[] {
  return withDeterministicIds("gov-runtime-research-index-preview-only", PREVIEW_ONLY_REFERENCES, (item) => `${item.key}:${item.source}`);
}

function buildForbiddenCapabilityReferences(): GovernanceRuntimeForbiddenCapabilityReference[] {
  return withDeterministicIds(
    "gov-runtime-research-index-forbidden",
    FORBIDDEN_CAPABILITY_REFERENCES.map((item) => ({ ...item, permanentlyForbidden: true as const })),
    (item) => item.key
  );
}

function buildHumanResearchRequirementReferences(): GovernanceRuntimeHumanResearchRequirementReference[] {
  return withDeterministicIds(
    "gov-runtime-research-index-human",
    HUMAN_RESEARCH_REQUIREMENT_REFERENCES.map((item) => ({ ...item, required: true as const })),
    (item) => item.key
  );
}

function buildFutureFeasibilityReferences(): GovernanceRuntimeFutureFeasibilityReference[] {
  return withDeterministicIds(
    "gov-runtime-research-index-feasibility",
    FUTURE_FEASIBILITY_REFERENCES.map((item) => ({ ...item, futureOnly: true as const })),
    (item) => item.key
  );
}

function warningsFor(conclusion: GovernanceRuntimeResearchIndexPreview["runtimeResearchIndexConclusion"]): string[] {
  const warnings = [
    "Runtime governance research index preview is advisory only.",
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
  if (conclusion === "source-missing") warnings.unshift("Post-v9 runtime research source is missing; research index preview is incomplete.");
  if (conclusion === "not-ready") warnings.unshift("Post-v9 runtime research is not ready for research index preview.");
  if (conclusion === "research-index-ready") warnings.unshift("Runtime governance research index preview is ready as preview-only documentation.");
  if (conclusion === "blocked") warnings.unshift("Post-v9 runtime research is blocked; research index preview is blocked.");
  return warnings;
}

export function buildGovernanceRuntimeResearchIndexPreviewFromResearch(source: GovernancePostV9RuntimeResearchPreview): GovernanceRuntimeResearchIndexPreview {
  const conclusion = conclusionFor(source);
  const researchIndexScore = scoreFor(conclusion.runtimeResearchIndexConclusion);
  const researchIndexEntries = buildIndexEntries(conclusion.runtimeResearchIndexConclusion);
  const categorySummaries = buildCategorySummaries(researchIndexEntries);
  const previewOnlyReferences = buildPreviewOnlyReferences();
  const forbiddenCapabilityReferences = buildForbiddenCapabilityReferences();
  const humanResearchRequirementReferences = buildHumanResearchRequirementReferences();
  const futureFeasibilityReferences = buildFutureFeasibilityReferences();

  return {
    schemaVersion: 1,
    previewStatus: conclusion.previewStatus,
    sourceRuntimeResearchStatus: source.previewStatus,
    runtimeResearchIndexConclusion: conclusion.runtimeResearchIndexConclusion,
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
    researchIndexScore,
    researchIndexEntries,
    categorySummaries,
    previewOnlyReferences,
    forbiddenCapabilityReferences,
    humanResearchRequirementReferences,
    futureFeasibilityReferences,
    summary: {
      researchIndexScoreValue: researchIndexScore.score,
      totalIndexEntries: researchIndexEntries.length,
      totalCategories: categorySummaries.length,
      totalPreviewOnlyReferences: previewOnlyReferences.length,
      totalForbiddenCapabilityReferences: forbiddenCapabilityReferences.length,
      totalHumanResearchRequirementReferences: humanResearchRequirementReferences.length,
      totalFutureFeasibilityReferences: futureFeasibilityReferences.length,
      researchIndexReady: conclusion.runtimeResearchIndexConclusion === "research-index-ready"
    },
    warnings: warningsFor(conclusion.runtimeResearchIndexConclusion),
    recommendedNextStage: conclusion.recommendedNextStage
  };
}

export function buildGovernanceRuntimeResearchIndexPreview(projectRoot: string): GovernanceRuntimeResearchIndexPreview {
  return buildGovernanceRuntimeResearchIndexPreviewFromResearch(buildGovernancePostV9RuntimeResearchPreview(projectRoot));
}

export function renderGovernanceRuntimeResearchIndexPreviewMarkdown(preview: GovernanceRuntimeResearchIndexPreview): string {
  const lines = [
    "# AI Software Factory - Runtime Governance Research Index Preview",
    "",
    "Preview status:", preview.previewStatus,
    "", "Source runtime research status:", preview.sourceRuntimeResearchStatus,
    "", "Runtime research index conclusion:", preview.runtimeResearchIndexConclusion,
    "", "Runtime research index applied:", String(preview.runtimeResearchIndexApplied),
    "", "Runtime research index enforced:", String(preview.runtimeResearchIndexEnforced),
    "", "Runtime research applied:", String(preview.runtimeResearchApplied),
    "", "Runtime research enforced:", String(preview.runtimeResearchEnforced),
    "", "Runtime final review approved:", String(preview.runtimeFinalReviewApproved),
    "", "Runtime activation approved:", String(preview.runtimeActivationApproved),
    "", "Runtime activation executed:", String(preview.runtimeActivationExecuted),
    "", "Runtime governance enabled:", String(preview.runtimeGovernanceEnabled),
    "", "Runtime autonomy enabled:", String(preview.runtimeAutonomyEnabled),
    "", "Runtime autonomy actions allowed:", String(preview.runtimeAutonomyActionsAllowed),
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
    "", "Research index score:", String(preview.researchIndexScore.score),
    "", "Research index rating:", preview.researchIndexScore.rating,
    "", "Index entry count:", String(preview.summary.totalIndexEntries),
    "", "Category count:", String(preview.summary.totalCategories),
    "", "Preview-only reference count:", String(preview.summary.totalPreviewOnlyReferences),
    "", "Forbidden capability reference count:", String(preview.summary.totalForbiddenCapabilityReferences),
    "", "Human research requirement reference count:", String(preview.summary.totalHumanResearchRequirementReferences),
    "", "Future feasibility reference count:", String(preview.summary.totalFutureFeasibilityReferences),
    "", "Research index ready:", String(preview.summary.researchIndexReady),
    "", "Recommended next stage:", preview.recommendedNextStage,
    "", "## Research Index Entries", ""
  ];
  for (const item of preview.researchIndexEntries) lines.push(`- [${item.category}/${item.status}] ${item.id} ${item.key} (${item.source}) - ${item.reason}`);
  lines.push("", "## Category Summaries", "");
  for (const item of preview.categorySummaries) lines.push(`- [${item.category}/entries=${item.totalEntries}/previewOnly=${String(item.previewOnly)}] ${item.id} - ${item.reason}`);
  lines.push("", "## Preview-only References", "");
  for (const item of preview.previewOnlyReferences) lines.push(`- [${item.source}] ${item.id} ${item.key} - ${item.reason}`);
  lines.push("", "## Forbidden Capability References", "");
  for (const item of preview.forbiddenCapabilityReferences) lines.push(`- ${item.id} ${item.key} permanentlyForbidden=${String(item.permanentlyForbidden)} - ${item.reason}`);
  lines.push("", "## Human Research Requirement References", "");
  for (const item of preview.humanResearchRequirementReferences) lines.push(`- ${item.id} ${item.key} required=${String(item.required)} - ${item.reason}`);
  lines.push("", "## Future Feasibility References", "");
  for (const item of preview.futureFeasibilityReferences) lines.push(`- ${item.id} ${item.key} futureOnly=${String(item.futureOnly)} - ${item.reason}`);
  lines.push("", "## Warnings", "");
  for (const warning of preview.warnings) lines.push(`- ${warning}`);
  return `${lines.join("\n")}\n`;
}

export function renderGovernanceRuntimeResearchIndexPreviewText(preview: GovernanceRuntimeResearchIndexPreview): string {
  return renderGovernanceRuntimeResearchIndexPreviewMarkdown(preview);
}

export function writeGovernanceRuntimeResearchIndexPreviewArtifacts(projectRoot: string, preview: GovernanceRuntimeResearchIndexPreview): { jsonPath: string; markdownPath: string } {
  const jsonPath = path.join(projectRoot, ARTIFACT_JSON_PATH);
  const markdownPath = path.join(projectRoot, ARTIFACT_MARKDOWN_PATH);
  fs.ensureDirSync(path.dirname(jsonPath));
  fs.writeFileSync(jsonPath, `${JSON.stringify(preview, null, 2)}\n`, "utf8");
  fs.writeFileSync(markdownPath, renderGovernanceRuntimeResearchIndexPreviewMarkdown(preview), "utf8");
  return { jsonPath: ARTIFACT_JSON_PATH, markdownPath: ARTIFACT_MARKDOWN_PATH };
}
