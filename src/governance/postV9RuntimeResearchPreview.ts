import fs from "fs-extra";
import path from "node:path";

import {
  buildGovernanceRuntimeSafetyFinalReviewPreview,
  type GovernanceRuntimeSafetyFinalReviewPreview
} from "./runtimeSafetyFinalReviewPreview.js";

export type GovernanceRuntimeResearchScore = {
  score: 0 | 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90 | 100;
  rating: "blocked" | "not-ready" | "preview-research-complete" | "future-research-ready";
  reason: string;
};

export type GovernanceRuntimeCompletionArea = {
  id: string;
  key: string;
  category:
    | "runtime-safety"
    | "runtime-observability"
    | "runtime-control-plane"
    | "runtime-lifecycle"
    | "runtime-certification"
    | "runtime-governance-review"
    | "runtime-boundary-review"
    | "runtime-freeze-review"
    | "safe-patch-engine";
  status: "architecturally-complete" | "preview-only" | "blocked";
  reason: string;
};

export type GovernanceRuntimePreviewOnlyFinding = {
  id: string;
  severity: "info" | "warning";
  key: string;
  reason: string;
};

export type GovernanceRuntimeForbiddenResearchFinding = {
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

export type GovernanceRuntimeHumanResearchRequirement = {
  id: string;
  category:
    | "human-governance-review"
    | "rollback-verification"
    | "freeze-validation"
    | "safe-patch-engine-review"
    | "governance-boundary-review";
  required: true;
  reason: string;
};

export type GovernanceRuntimeFeasibilityNote = {
  id: string;
  category:
    | "preview-only-architecture"
    | "future-human-research"
    | "safety-boundary"
    | "forbidden-runtime-capability";
  reason: string;
};

export type GovernanceRuntimeResearchRecommendation = {
  id: string;
  priority: "low" | "medium" | "high";
  key: string;
  reason: string;
};

export type GovernancePostV9RuntimeResearchPreview = {
  schemaVersion: 1;
  previewStatus: "not-created" | "created" | "blocked";
  sourceRuntimeFinalReviewStatus: "not-created" | "created" | "blocked";
  runtimeResearchConclusion: "source-missing" | "not-ready" | "future-research-ready" | "blocked";
  runtimeResearchApplied: false;
  runtimeResearchEnforced: false;
  runtimeFinalReviewApproved: false;
  runtimeFinalReviewApplied: false;
  runtimeFinalReviewEnforced: false;
  runtimeActivationApproved: false;
  runtimeActivationExecuted: false;
  runtimeFreezeApplied: false;
  runtimeFreezeEnforced: false;
  runtimeFreezeExecuted: false;
  runtimeBoundaryApplied: false;
  runtimeBoundaryEnforced: false;
  runtimeGovernanceEnabled: false;
  runtimeAutonomyEnabled: false;
  runtimeAutonomyActionsAllowed: false;
  runtimeCertificationApplied: false;
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
  architectureResearchScore: GovernanceRuntimeResearchScore;
  architectureCompletionAreas: GovernanceRuntimeCompletionArea[];
  previewOnlyArchitectureFindings: GovernanceRuntimePreviewOnlyFinding[];
  permanentlyForbiddenCapabilities: GovernanceRuntimeForbiddenResearchFinding[];
  humanResearchRequirements: GovernanceRuntimeHumanResearchRequirement[];
  futureRuntimeFeasibilityNotes: GovernanceRuntimeFeasibilityNote[];
  governanceResearchRecommendations: GovernanceRuntimeResearchRecommendation[];
  summary: {
    architectureResearchScoreValue: number;
    totalCompletionAreas: number;
    completedAreas: number;
    previewOnlyAreas: number;
    blockedAreas: number;
    totalPreviewOnlyFindings: number;
    totalForbiddenCapabilities: number;
    totalHumanResearchRequirements: number;
    totalFeasibilityNotes: number;
    totalResearchRecommendations: number;
    futureResearchReady: boolean;
  };
  warnings: string[];
  recommendedNextStage:
    | "continue-preview-only-research"
    | "maintain-runtime-disabled-posture"
    | "blocked";
};

const ARTIFACT_JSON_PATH = ".factory/governance/post-v9-runtime-research-preview.json";
const ARTIFACT_MARKDOWN_PATH = ".factory/governance/post-v9-runtime-research-preview.md";

const COMPLETION_AREA_DEFINITIONS: Array<Omit<GovernanceRuntimeCompletionArea, "id" | "status">> = [
  { key: "runtime-boundary-review", category: "runtime-boundary-review", reason: "Runtime activation boundaries are documented as preview-only architecture." },
  { key: "runtime-certification", category: "runtime-certification", reason: "Runtime certification preview is documented and remains unapplied." },
  { key: "runtime-control-plane", category: "runtime-control-plane", reason: "Runtime control-plane structures are documented without activation." },
  { key: "runtime-freeze-review", category: "runtime-freeze-review", reason: "Runtime freeze conditions are documented without execution." },
  { key: "runtime-governance-review", category: "runtime-governance-review", reason: "Runtime governance review is documented as future-human-review-only." },
  { key: "runtime-lifecycle", category: "runtime-lifecycle", reason: "Runtime lifecycle stages are documented without transition execution." },
  { key: "runtime-observability", category: "runtime-observability", reason: "Runtime observability models are documented without telemetry execution." },
  { key: "runtime-safety", category: "runtime-safety", reason: "Runtime safety architecture is documented as preview-only." },
  { key: "safe-patch-engine-exclusivity", category: "safe-patch-engine", reason: "Safe Patch Engine exclusivity remains architecturally complete and preserved." }
];

const PREVIEW_ONLY_FINDINGS: Array<Omit<GovernanceRuntimePreviewOnlyFinding, "id">> = [
  { key: "future-runtime-requires-human-review", severity: "warning", reason: "Any hypothetical runtime governance system would require future human research and review." },
  { key: "no-governance-enforcement-exists", severity: "info", reason: "No runtime governance enforcement exists." },
  { key: "no-runtime-execution-exists", severity: "info", reason: "No runtime execution exists." },
  { key: "runtime-activation-not-approved", severity: "warning", reason: "Runtime activation remains unapproved." },
  { key: "runtime-autonomy-disabled", severity: "warning", reason: "Runtime autonomy remains disabled." },
  { key: "runtime-governance-disabled", severity: "warning", reason: "Runtime governance remains disabled." },
  { key: "runtime-research-preview-only", severity: "info", reason: "Post-v9 runtime research is preview-only and is not applied." }
];

const FORBIDDEN_DEFINITIONS: Array<Omit<GovernanceRuntimeForbiddenResearchFinding, "id" | "permanentlyForbidden">> = [
  { category: "mutation-scope-expansion", reason: "Mutation scope expansion remains permanently forbidden." },
  { category: "runtime-autonomy", reason: "Runtime autonomy enablement remains permanently forbidden." },
  { category: "runtime-learning", reason: "Runtime learning enablement remains permanently forbidden." },
  { category: "runtime-ml-decisioning", reason: "ML/vector DB governance decisioning remains permanently forbidden." },
  { category: "runtime-multi-agent-coordination", reason: "Uncontrolled runtime multi-agent coordination remains permanently forbidden." },
  { category: "runtime-plugin-execution", reason: "Runtime plugin execution remains permanently forbidden." },
  { category: "runtime-policy-enforcement", reason: "Runtime policy enforcement enablement remains permanently forbidden." },
  { category: "runtime-script-execution", reason: "Runtime script execution remains permanently forbidden." },
  { category: "safe-patch-engine-bypass", reason: "Safe Patch Engine bypass remains permanently forbidden." }
];

const HUMAN_RESEARCH_REQUIREMENTS: Array<Omit<GovernanceRuntimeHumanResearchRequirement, "id" | "required">> = [
  { category: "freeze-validation", reason: "Future runtime governance research would require freeze validation research." },
  { category: "governance-boundary-review", reason: "Future runtime governance research would require governance boundary verification." },
  { category: "human-governance-review", reason: "Future runtime governance research would require mandatory human governance review." },
  { category: "rollback-verification", reason: "Future runtime governance research would require rollback verification research." },
  { category: "safe-patch-engine-review", reason: "Future runtime governance research would require Safe Patch Engine review." }
];

const FEASIBILITY_NOTES: Array<Omit<GovernanceRuntimeFeasibilityNote, "id">> = [
  { category: "forbidden-runtime-capability", reason: "Forbidden runtime capabilities remain permanently blocked." },
  { category: "future-human-research", reason: "Future work would require human research before any runtime governance could be considered." },
  { category: "preview-only-architecture", reason: "Architecture remains preview-only." },
  { category: "preview-only-architecture", reason: "No governance enforcement exists." },
  { category: "preview-only-architecture", reason: "No runtime execution exists." },
  { category: "safety-boundary", reason: "Runtime autonomy remains disabled." },
  { category: "safety-boundary", reason: "Runtime governance remains disabled." }
];

const RECOMMENDATIONS: Array<Omit<GovernanceRuntimeResearchRecommendation, "id">> = [
  { key: "continue-preview-only-research", priority: "high", reason: "Continue post-v9 research without activating runtime governance." },
  { key: "document-forbidden-capabilities", priority: "high", reason: "Continue documenting permanently forbidden runtime capabilities." },
  { key: "maintain-runtime-disabled-posture", priority: "high", reason: "Maintain runtime governance and autonomy disabled." },
  { key: "preserve-safe-patch-engine-only", priority: "high", reason: "Continue preserving Safe Patch Engine as the only mutation layer." },
  { key: "expand-human-research-notes", priority: "medium", reason: "Expand future human research requirements before any hypothetical runtime design change." },
  { key: "review-freeze-and-rollback-evidence", priority: "medium", reason: "Continue research on freeze and rollback evidence without executing either." }
];

function withDeterministicIds<T>(prefix: string, items: T[], sortKey: (item: T) => string): Array<T & { id: string }> {
  return [...items]
    .sort((a, b) => sortKey(a).localeCompare(sortKey(b)))
    .map((item, index) => ({ id: `${prefix}-${String(index + 1).padStart(3, "0")}`, ...item }));
}

function conclusionFor(source: GovernanceRuntimeSafetyFinalReviewPreview): Pick<GovernancePostV9RuntimeResearchPreview, "previewStatus" | "runtimeResearchConclusion" | "recommendedNextStage"> {
  if (source.previewStatus === "not-created") {
    return { previewStatus: "not-created", runtimeResearchConclusion: "source-missing", recommendedNextStage: "continue-preview-only-research" };
  }
  if (source.previewStatus === "blocked") {
    return { previewStatus: "blocked", runtimeResearchConclusion: "blocked", recommendedNextStage: "blocked" };
  }
  if (source.runtimeFinalReviewConclusion === "future-final-review-ready") {
    return { previewStatus: "created", runtimeResearchConclusion: "future-research-ready", recommendedNextStage: "maintain-runtime-disabled-posture" };
  }
  return { previewStatus: "created", runtimeResearchConclusion: "not-ready", recommendedNextStage: "continue-preview-only-research" };
}

function scoreFor(conclusion: GovernancePostV9RuntimeResearchPreview["runtimeResearchConclusion"]): GovernanceRuntimeResearchScore {
  if (conclusion === "blocked") return { score: 0, rating: "blocked", reason: "Post-v9 runtime research preview is blocked by final review status." };
  if (conclusion === "source-missing") return { score: 20, rating: "not-ready", reason: "Runtime safety final review preview is missing." };
  if (conclusion === "not-ready") return { score: 40, rating: "preview-research-complete", reason: "Runtime safety final review exists but is not ready for future research." };
  return { score: 80, rating: "future-research-ready", reason: "Post-v9 runtime research preview is ready for future research only; runtime remains disabled." };
}

function areaStatusFor(conclusion: GovernancePostV9RuntimeResearchPreview["runtimeResearchConclusion"]): GovernanceRuntimeCompletionArea["status"] {
  if (conclusion === "blocked") return "blocked";
  if (conclusion === "future-research-ready") return "architecturally-complete";
  return "preview-only";
}

function buildCompletionAreas(conclusion: GovernancePostV9RuntimeResearchPreview["runtimeResearchConclusion"]): GovernanceRuntimeCompletionArea[] {
  return withDeterministicIds(
    "gov-runtime-research-area",
    COMPLETION_AREA_DEFINITIONS.map((item) => ({ ...item, status: areaStatusFor(conclusion) })),
    (item) => `${item.category}:${item.key}:${item.status}`
  );
}

function buildPreviewOnlyFindings(): GovernanceRuntimePreviewOnlyFinding[] {
  return withDeterministicIds("gov-runtime-research-finding", PREVIEW_ONLY_FINDINGS, (item) => `${item.severity}:${item.key}`);
}

function buildForbiddenCapabilities(): GovernanceRuntimeForbiddenResearchFinding[] {
  return withDeterministicIds(
    "gov-runtime-research-forbidden",
    FORBIDDEN_DEFINITIONS.map((item) => ({ ...item, permanentlyForbidden: true as const })),
    (item) => item.category
  );
}

function buildHumanResearchRequirements(): GovernanceRuntimeHumanResearchRequirement[] {
  return withDeterministicIds(
    "gov-runtime-research-human",
    HUMAN_RESEARCH_REQUIREMENTS.map((item) => ({ ...item, required: true as const })),
    (item) => `${item.category}:${item.reason}`
  );
}

function buildFeasibilityNotes(): GovernanceRuntimeFeasibilityNote[] {
  return withDeterministicIds("gov-runtime-research-feasibility", FEASIBILITY_NOTES, (item) => `${item.category}:${item.reason}`);
}

function buildRecommendations(): GovernanceRuntimeResearchRecommendation[] {
  return withDeterministicIds("gov-runtime-research-recommendation", RECOMMENDATIONS, (item) => `${item.priority}:${item.key}`);
}

function warningsFor(conclusion: GovernancePostV9RuntimeResearchPreview["runtimeResearchConclusion"]): string[] {
  const warnings = [
    "Post-v9 runtime research preview is advisory only.",
    "Runtime governance research was not applied or enforced.",
    "Runtime final review approval was not granted.",
    "Runtime activation approval was not granted.",
    "Runtime activation was not executed.",
    "Runtime governance is not enabled.",
    "Runtime autonomy is not enabled.",
    "Runtime autonomous actions are not allowed.",
    "Runtime policies are not enforced.",
    "Runtime config activation is disabled.",
    "Runtime control plane behavior was not applied.",
    "Runtime kill switches, emergency stops, rollbacks, and overrides were not executed.",
    "Runtime sandbox execution is not allowed.",
    "Runtime plugin, script, learning, ML, and multi-agent execution remain disabled.",
    "Runtime behavior did not change.",
    "Repair orchestration did not change."
  ];
  if (conclusion === "source-missing") warnings.unshift("Runtime safety final review source is missing; research preview is incomplete.");
  if (conclusion === "not-ready") warnings.unshift("Runtime safety final review is not ready for post-v9 research preview.");
  if (conclusion === "future-research-ready") warnings.unshift("Post-v9 runtime research preview is ready for future research only.");
  if (conclusion === "blocked") warnings.unshift("Runtime safety final review is blocked; research preview is blocked.");
  return warnings;
}

export function buildGovernancePostV9RuntimeResearchPreviewFromFinalReview(source: GovernanceRuntimeSafetyFinalReviewPreview): GovernancePostV9RuntimeResearchPreview {
  const conclusion = conclusionFor(source);
  const architectureResearchScore = scoreFor(conclusion.runtimeResearchConclusion);
  const architectureCompletionAreas = buildCompletionAreas(conclusion.runtimeResearchConclusion);
  const previewOnlyArchitectureFindings = buildPreviewOnlyFindings();
  const permanentlyForbiddenCapabilities = buildForbiddenCapabilities();
  const humanResearchRequirements = buildHumanResearchRequirements();
  const futureRuntimeFeasibilityNotes = buildFeasibilityNotes();
  const governanceResearchRecommendations = buildRecommendations();

  return {
    schemaVersion: 1,
    previewStatus: conclusion.previewStatus,
    sourceRuntimeFinalReviewStatus: source.previewStatus,
    runtimeResearchConclusion: conclusion.runtimeResearchConclusion,
    runtimeResearchApplied: false,
    runtimeResearchEnforced: false,
    runtimeFinalReviewApproved: false,
    runtimeFinalReviewApplied: false,
    runtimeFinalReviewEnforced: false,
    runtimeActivationApproved: false,
    runtimeActivationExecuted: false,
    runtimeFreezeApplied: false,
    runtimeFreezeEnforced: false,
    runtimeFreezeExecuted: false,
    runtimeBoundaryApplied: false,
    runtimeBoundaryEnforced: false,
    runtimeGovernanceEnabled: false,
    runtimeAutonomyEnabled: false,
    runtimeAutonomyActionsAllowed: false,
    runtimeCertificationApplied: false,
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
    architectureResearchScore,
    architectureCompletionAreas,
    previewOnlyArchitectureFindings,
    permanentlyForbiddenCapabilities,
    humanResearchRequirements,
    futureRuntimeFeasibilityNotes,
    governanceResearchRecommendations,
    summary: {
      architectureResearchScoreValue: architectureResearchScore.score,
      totalCompletionAreas: architectureCompletionAreas.length,
      completedAreas: architectureCompletionAreas.filter((item) => item.status === "architecturally-complete").length,
      previewOnlyAreas: architectureCompletionAreas.filter((item) => item.status === "preview-only").length,
      blockedAreas: architectureCompletionAreas.filter((item) => item.status === "blocked").length,
      totalPreviewOnlyFindings: previewOnlyArchitectureFindings.length,
      totalForbiddenCapabilities: permanentlyForbiddenCapabilities.length,
      totalHumanResearchRequirements: humanResearchRequirements.length,
      totalFeasibilityNotes: futureRuntimeFeasibilityNotes.length,
      totalResearchRecommendations: governanceResearchRecommendations.length,
      futureResearchReady: conclusion.runtimeResearchConclusion === "future-research-ready"
    },
    warnings: warningsFor(conclusion.runtimeResearchConclusion),
    recommendedNextStage: conclusion.recommendedNextStage
  };
}

export function buildGovernancePostV9RuntimeResearchPreview(projectRoot: string): GovernancePostV9RuntimeResearchPreview {
  return buildGovernancePostV9RuntimeResearchPreviewFromFinalReview(buildGovernanceRuntimeSafetyFinalReviewPreview(projectRoot));
}

export function renderGovernancePostV9RuntimeResearchPreviewMarkdown(preview: GovernancePostV9RuntimeResearchPreview): string {
  const lines = [
    "# AI Software Factory - Post-v9 Runtime Research Preview",
    "",
    "Preview status:", preview.previewStatus,
    "", "Source runtime final review status:", preview.sourceRuntimeFinalReviewStatus,
    "", "Runtime research conclusion:", preview.runtimeResearchConclusion,
    "", "Runtime research applied:", String(preview.runtimeResearchApplied),
    "", "Runtime research enforced:", String(preview.runtimeResearchEnforced),
    "", "Runtime final review approved:", String(preview.runtimeFinalReviewApproved),
    "", "Runtime final review applied:", String(preview.runtimeFinalReviewApplied),
    "", "Runtime final review enforced:", String(preview.runtimeFinalReviewEnforced),
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
    "", "Runtime operator override applied:", String(preview.runtimeOperatorOverrideApplied),
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
    "", "Architecture research score:", String(preview.architectureResearchScore.score),
    "", "Architecture research rating:", preview.architectureResearchScore.rating,
    "", "Completion area count:", String(preview.summary.totalCompletionAreas),
    "", "Preview-only finding count:", String(preview.summary.totalPreviewOnlyFindings),
    "", "Forbidden capability count:", String(preview.summary.totalForbiddenCapabilities),
    "", "Human research requirement count:", String(preview.summary.totalHumanResearchRequirements),
    "", "Feasibility note count:", String(preview.summary.totalFeasibilityNotes),
    "", "Recommendation count:", String(preview.summary.totalResearchRecommendations),
    "", "Future research ready:", String(preview.summary.futureResearchReady),
    "", "Recommended next stage:", preview.recommendedNextStage,
    "", "## Architecture Completion Areas", ""
  ];
  for (const item of preview.architectureCompletionAreas) lines.push(`- [${item.category}/${item.status}] ${item.id} ${item.key} - ${item.reason}`);
  lines.push("", "## Preview-only Architecture Findings", "");
  for (const item of preview.previewOnlyArchitectureFindings) lines.push(`- [${item.severity}] ${item.id} ${item.key} - ${item.reason}`);
  lines.push("", "## Permanently Forbidden Capabilities", "");
  for (const item of preview.permanentlyForbiddenCapabilities) lines.push(`- [${item.category}] ${item.id} permanentlyForbidden=${String(item.permanentlyForbidden)} - ${item.reason}`);
  lines.push("", "## Human Research Requirements", "");
  for (const item of preview.humanResearchRequirements) lines.push(`- [${item.category}/required=${String(item.required)}] ${item.id} - ${item.reason}`);
  lines.push("", "## Future Runtime Feasibility Notes", "");
  for (const item of preview.futureRuntimeFeasibilityNotes) lines.push(`- [${item.category}] ${item.id} - ${item.reason}`);
  lines.push("", "## Governance Research Recommendations", "");
  for (const item of preview.governanceResearchRecommendations) lines.push(`- [${item.priority}] ${item.id} ${item.key} - ${item.reason}`);
  lines.push("", "## Warnings", "");
  for (const warning of preview.warnings) lines.push(`- ${warning}`);
  return `${lines.join("\n")}\n`;
}

export function renderGovernancePostV9RuntimeResearchPreviewText(preview: GovernancePostV9RuntimeResearchPreview): string {
  return renderGovernancePostV9RuntimeResearchPreviewMarkdown(preview);
}

export function writeGovernancePostV9RuntimeResearchPreviewArtifacts(projectRoot: string, preview: GovernancePostV9RuntimeResearchPreview): { jsonPath: string; markdownPath: string } {
  const jsonPath = path.join(projectRoot, ARTIFACT_JSON_PATH);
  const markdownPath = path.join(projectRoot, ARTIFACT_MARKDOWN_PATH);
  fs.ensureDirSync(path.dirname(jsonPath));
  fs.writeFileSync(jsonPath, `${JSON.stringify(preview, null, 2)}\n`, "utf8");
  fs.writeFileSync(markdownPath, renderGovernancePostV9RuntimeResearchPreviewMarkdown(preview), "utf8");
  return { jsonPath: ARTIFACT_JSON_PATH, markdownPath: ARTIFACT_MARKDOWN_PATH };
}
