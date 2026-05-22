import fs from "fs-extra";
import path from "node:path";

import {
  buildGovernanceRuntimeActivationGovernanceReviewPreview,
  type GovernanceRuntimeActivationGovernanceReviewPreview
} from "./runtimeActivationGovernanceReviewPreview.js";

export type GovernanceRuntimeBoundaryScore = {
  score: 0 | 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90 | 100;
  rating: "blocked" | "not-ready" | "partial-boundary-readiness" | "future-boundary-review-ready";
  reason: string;
};

export type GovernanceRuntimeBoundaryDomain = {
  id: string;
  key: string;
  category:
    | "activation-boundary"
    | "mutation-boundary"
    | "policy-boundary"
    | "control-plane-boundary"
    | "autonomy-boundary"
    | "rollback-boundary"
    | "safe-patch-engine-boundary";
  domainStatus: "passed-preview" | "warning" | "blocked";
  reason: string;
  applied: false;
};

export type GovernanceRuntimeBoundaryDefinition = {
  id: string;
  key: string;
  category:
    | "activation-boundary"
    | "mutation-boundary"
    | "policy-boundary"
    | "control-plane-boundary"
    | "autonomy-boundary"
    | "rollback-boundary";
  boundaryType: "hard-limit" | "future-review-only" | "permanently-forbidden";
  reason: string;
};

export type GovernanceRuntimeBoundaryBlocker = {
  id: string;
  severity: "high" | "critical";
  key: string;
  reason: string;
};

export type GovernanceRuntimeForbiddenBoundaryCrossing = {
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

export type GovernanceRuntimeBoundaryRollbackStep = {
  id: string;
  key: string;
  required: true;
  reason: string;
};

export type GovernanceRuntimeBoundaryRollbackPlanning = {
  schemaVersion: 1;
  rollbackExecutionAllowed: false;
  rollbackPrepared: false;
  rollbackPlanningSteps: GovernanceRuntimeBoundaryRollbackStep[];
  reason: string;
};

export type GovernanceRuntimeActivationBoundaryPreview = {
  schemaVersion: 1;
  previewStatus: "not-created" | "created" | "blocked";
  sourceGovernanceReviewStatus: "not-created" | "created" | "blocked";
  runtimeBoundaryConclusion: "source-missing" | "not-ready" | "future-boundary-review-ready" | "blocked";
  runtimeActivationApproved: false;
  runtimeActivationExecuted: false;
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
  boundaryScore: GovernanceRuntimeBoundaryScore;
  boundaryDomains: GovernanceRuntimeBoundaryDomain[];
  boundaryDefinitions: GovernanceRuntimeBoundaryDefinition[];
  boundaryBlockers: GovernanceRuntimeBoundaryBlocker[];
  forbiddenBoundaryCrossings: GovernanceRuntimeForbiddenBoundaryCrossing[];
  boundaryRollbackPlanning: GovernanceRuntimeBoundaryRollbackPlanning;
  summary: {
    boundaryScoreValue: number;
    totalDomains: number;
    passedDomains: number;
    warningDomains: number;
    blockedDomains: number;
    totalDefinitions: number;
    totalBlockers: number;
    totalForbiddenBoundaryCrossings: number;
    rollbackPlanningSteps: number;
    futureBoundaryReviewReady: boolean;
  };
  warnings: string[];
  recommendedNextStage:
    | "continue-runtime-safety-hardening"
    | "prepare-runtime-activation-freeze-preview"
    | "blocked";
};

const ARTIFACT_JSON_PATH = ".factory/governance/runtime-activation-boundary-preview.json";
const ARTIFACT_MARKDOWN_PATH = ".factory/governance/runtime-activation-boundary-preview.md";

const DOMAIN_DEFINITIONS: Array<Omit<GovernanceRuntimeBoundaryDomain, "id" | "domainStatus" | "applied">> = [
  { key: "runtime-activation-boundaries", category: "activation-boundary", reason: "Runtime activation boundaries remain future-review-only." },
  { key: "runtime-autonomy-boundaries", category: "autonomy-boundary", reason: "Runtime autonomy remains disabled and outside activation boundaries." },
  { key: "runtime-control-plane-boundaries", category: "control-plane-boundary", reason: "Runtime control-plane behavior remains preview-only." },
  { key: "runtime-mutation-boundaries", category: "mutation-boundary", reason: "Runtime mutation scope cannot expand." },
  { key: "runtime-policy-boundaries", category: "policy-boundary", reason: "Runtime policy enforcement remains disabled." },
  { key: "runtime-rollback-boundaries", category: "rollback-boundary", reason: "Runtime rollback remains planning-only and unavailable for execution." },
  { key: "safe-patch-engine-exclusivity-boundaries", category: "safe-patch-engine-boundary", reason: "Safe Patch Engine remains the only mutation layer." }
];

const DEFINITION_DEFINITIONS: Array<Omit<GovernanceRuntimeBoundaryDefinition, "id">> = [
  { key: "control-plane-overrides-disabled", category: "control-plane-boundary", boundaryType: "hard-limit", reason: "Runtime control-plane overrides remain disabled." },
  { key: "mutation-scope-cannot-expand", category: "mutation-boundary", boundaryType: "permanently-forbidden", reason: "Runtime mutation scope cannot expand." },
  { key: "policy-enforcement-disabled", category: "policy-boundary", boundaryType: "hard-limit", reason: "Runtime policy enforcement remains disabled." },
  { key: "rollback-execution-unavailable", category: "rollback-boundary", boundaryType: "future-review-only", reason: "Runtime rollback execution remains unavailable in preview mode." },
  { key: "runtime-activation-future-review-only", category: "activation-boundary", boundaryType: "future-review-only", reason: "Runtime activation remains future-review-only and is not approved." },
  { key: "runtime-autonomy-forbidden", category: "autonomy-boundary", boundaryType: "permanently-forbidden", reason: "Runtime autonomy remains forbidden for execution." },
  { key: "safe-patch-engine-exclusivity-mandatory", category: "mutation-boundary", boundaryType: "hard-limit", reason: "Safe Patch Engine exclusivity remains mandatory." }
];

const BLOCKER_DEFINITIONS: Array<Omit<GovernanceRuntimeBoundaryBlocker, "id">> = [
  { key: "missing-boundary-freeze-validation", severity: "high", reason: "Future boundary freeze validation is required." },
  { key: "missing-human-governance-review", severity: "high", reason: "Future human governance review is required before runtime boundaries could be considered." },
  { key: "missing-rollback-governance-review", severity: "high", reason: "Future rollback governance review is required." },
  { key: "runtime-activation-unavailable", severity: "critical", reason: "Runtime activation is unavailable in preview mode." },
  { key: "runtime-autonomy-disabled", severity: "high", reason: "Runtime autonomy remains disabled." },
  { key: "runtime-boundary-enforcement-unavailable", severity: "critical", reason: "Runtime boundary enforcement is unavailable in preview mode." },
  { key: "runtime-governance-disabled", severity: "high", reason: "Runtime governance remains disabled." }
];

const FORBIDDEN_CROSSING_DEFINITIONS: Array<Omit<GovernanceRuntimeForbiddenBoundaryCrossing, "id" | "permanentlyForbidden">> = [
  { category: "mutation-scope-expansion", reason: "Mutation scope expansion remains a permanently forbidden boundary crossing." },
  { category: "runtime-autonomy", reason: "Runtime autonomy enablement remains a permanently forbidden boundary crossing." },
  { category: "runtime-learning", reason: "Runtime learning enablement remains a permanently forbidden boundary crossing." },
  { category: "runtime-ml-decisioning", reason: "ML/vector DB governance decisioning remains a permanently forbidden boundary crossing." },
  { category: "runtime-multi-agent-coordination", reason: "Uncontrolled runtime multi-agent coordination remains a permanently forbidden boundary crossing." },
  { category: "runtime-plugin-execution", reason: "Runtime plugin execution remains a permanently forbidden boundary crossing." },
  { category: "runtime-policy-enforcement", reason: "Runtime policy enforcement enablement remains a permanently forbidden boundary crossing." },
  { category: "runtime-script-execution", reason: "Runtime script execution remains a permanently forbidden boundary crossing." },
  { category: "safe-patch-engine-bypass", reason: "Safe Patch Engine bypass remains a permanently forbidden boundary crossing." }
];

const ROLLBACK_STEP_DEFINITIONS: Array<Omit<GovernanceRuntimeBoundaryRollbackStep, "id" | "required">> = [
  { key: "future-audit-preservation-planning", reason: "Future runtime boundary review must preserve deterministic audit evidence." },
  { key: "future-mutation-boundary-verification-planning", reason: "Future runtime boundary review must verify mutation boundaries remain unchanged." },
  { key: "future-runtime-autonomy-shutdown-planning", reason: "Future runtime boundary review must define runtime autonomy shutdown planning." },
  { key: "future-runtime-governance-shutdown-planning", reason: "Future runtime boundary review must define runtime governance shutdown planning." },
  { key: "future-runtime-policy-freeze-planning", reason: "Future runtime boundary review must define runtime policy freeze planning." },
  { key: "future-runtime-rollback-verification-planning", reason: "Future runtime boundary review must define runtime rollback verification planning." },
  { key: "future-safe-patch-engine-verification-planning", reason: "Future runtime boundary review must verify Safe Patch Engine exclusivity." }
];

function withDeterministicIds<T>(prefix: string, items: T[], sortKey: (item: T) => string): Array<T & { id: string }> {
  return [...items]
    .sort((a, b) => sortKey(a).localeCompare(sortKey(b)))
    .map((item, index) => ({ id: `${prefix}-${String(index + 1).padStart(3, "0")}`, ...item }));
}

function conclusionFor(source: GovernanceRuntimeActivationGovernanceReviewPreview): Pick<GovernanceRuntimeActivationBoundaryPreview, "previewStatus" | "runtimeBoundaryConclusion" | "recommendedNextStage"> {
  if (source.previewStatus === "not-created") {
    return { previewStatus: "not-created", runtimeBoundaryConclusion: "source-missing", recommendedNextStage: "continue-runtime-safety-hardening" };
  }
  if (source.previewStatus === "blocked") {
    return { previewStatus: "blocked", runtimeBoundaryConclusion: "blocked", recommendedNextStage: "blocked" };
  }
  if (source.governanceReviewConclusion === "future-human-review-ready") {
    return { previewStatus: "created", runtimeBoundaryConclusion: "future-boundary-review-ready", recommendedNextStage: "prepare-runtime-activation-freeze-preview" };
  }
  return { previewStatus: "created", runtimeBoundaryConclusion: "not-ready", recommendedNextStage: "continue-runtime-safety-hardening" };
}

function scoreFor(conclusion: GovernanceRuntimeActivationBoundaryPreview["runtimeBoundaryConclusion"]): GovernanceRuntimeBoundaryScore {
  if (conclusion === "blocked") return { score: 0, rating: "blocked", reason: "Runtime activation boundary preview is blocked by governance review status." };
  if (conclusion === "source-missing") return { score: 20, rating: "not-ready", reason: "Runtime activation governance review preview is missing." };
  if (conclusion === "not-ready") return { score: 40, rating: "partial-boundary-readiness", reason: "Runtime activation governance review exists but is not ready for boundary review." };
  return { score: 80, rating: "future-boundary-review-ready", reason: "Runtime activation boundary preview is ready for future boundary review only; boundaries are not applied." };
}

function statusFor(conclusion: GovernanceRuntimeActivationBoundaryPreview["runtimeBoundaryConclusion"]): GovernanceRuntimeBoundaryDomain["domainStatus"] {
  if (conclusion === "blocked") return "blocked";
  if (conclusion === "future-boundary-review-ready") return "passed-preview";
  return "warning";
}

function buildDomains(conclusion: GovernanceRuntimeActivationBoundaryPreview["runtimeBoundaryConclusion"]): GovernanceRuntimeBoundaryDomain[] {
  return withDeterministicIds(
    "gov-runtime-boundary-domain",
    DOMAIN_DEFINITIONS.map((item) => ({ ...item, domainStatus: statusFor(conclusion), applied: false as const })),
    (item) => `${item.category}:${item.key}:${item.domainStatus}`
  );
}

function buildDefinitions(): GovernanceRuntimeBoundaryDefinition[] {
  return withDeterministicIds("gov-runtime-boundary-definition", DEFINITION_DEFINITIONS, (item) => `${item.category}:${item.key}:${item.boundaryType}`);
}

function buildBlockers(): GovernanceRuntimeBoundaryBlocker[] {
  return withDeterministicIds("gov-runtime-boundary-blocker", BLOCKER_DEFINITIONS, (item) => `${item.severity}:${item.key}`);
}

function buildForbiddenCrossings(): GovernanceRuntimeForbiddenBoundaryCrossing[] {
  return withDeterministicIds(
    "gov-runtime-boundary-forbidden",
    FORBIDDEN_CROSSING_DEFINITIONS.map((item) => ({ ...item, permanentlyForbidden: true as const })),
    (item) => item.category
  );
}

function buildRollbackPlanning(): GovernanceRuntimeBoundaryRollbackPlanning {
  const rollbackPlanningSteps = withDeterministicIds(
    "gov-runtime-boundary-rollback",
    ROLLBACK_STEP_DEFINITIONS.map((item) => ({ ...item, required: true as const })),
    (item) => item.key
  );
  return {
    schemaVersion: 1,
    rollbackExecutionAllowed: false,
    rollbackPrepared: false,
    rollbackPlanningSteps,
    reason: "Boundary rollback planning is planning-only; no rollback was prepared or executed."
  };
}

function warningsFor(conclusion: GovernanceRuntimeActivationBoundaryPreview["runtimeBoundaryConclusion"]): string[] {
  const warnings = [
    "Runtime activation boundary preview is advisory only.",
    "Runtime boundaries were not applied or enforced.",
    "Runtime activation approval was not granted.",
    "Runtime activation was not executed.",
    "Runtime governance is not enabled.",
    "Runtime autonomy is not enabled.",
    "Runtime autonomous actions are not allowed.",
    "Runtime certification was not applied.",
    "Runtime policies are not enforced.",
    "Runtime config activation is disabled.",
    "Runtime control plane behavior was not applied.",
    "Runtime kill switches, emergency stops, rollbacks, and overrides were not executed.",
    "Runtime sandbox execution is not allowed.",
    "Runtime plugin, script, learning, ML, and multi-agent execution remain disabled.",
    "Runtime behavior did not change.",
    "Repair orchestration did not change."
  ];
  if (conclusion === "source-missing") warnings.unshift("Runtime activation governance review source is missing; boundary preview is incomplete.");
  if (conclusion === "not-ready") warnings.unshift("Runtime activation governance review is not ready for boundary preview.");
  if (conclusion === "future-boundary-review-ready") warnings.unshift("Runtime activation boundary preview is ready for future boundary review only.");
  if (conclusion === "blocked") warnings.unshift("Runtime activation governance review is blocked; boundary preview is blocked.");
  return warnings;
}

export function buildGovernanceRuntimeActivationBoundaryPreviewFromGovernanceReview(source: GovernanceRuntimeActivationGovernanceReviewPreview): GovernanceRuntimeActivationBoundaryPreview {
  const conclusion = conclusionFor(source);
  const boundaryScore = scoreFor(conclusion.runtimeBoundaryConclusion);
  const boundaryDomains = buildDomains(conclusion.runtimeBoundaryConclusion);
  const boundaryDefinitions = buildDefinitions();
  const boundaryBlockers = buildBlockers();
  const forbiddenBoundaryCrossings = buildForbiddenCrossings();
  const boundaryRollbackPlanning = buildRollbackPlanning();

  return {
    schemaVersion: 1,
    previewStatus: conclusion.previewStatus,
    sourceGovernanceReviewStatus: source.previewStatus,
    runtimeBoundaryConclusion: conclusion.runtimeBoundaryConclusion,
    runtimeActivationApproved: false,
    runtimeActivationExecuted: false,
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
    boundaryScore,
    boundaryDomains,
    boundaryDefinitions,
    boundaryBlockers,
    forbiddenBoundaryCrossings,
    boundaryRollbackPlanning,
    summary: {
      boundaryScoreValue: boundaryScore.score,
      totalDomains: boundaryDomains.length,
      passedDomains: boundaryDomains.filter((item) => item.domainStatus === "passed-preview").length,
      warningDomains: boundaryDomains.filter((item) => item.domainStatus === "warning").length,
      blockedDomains: boundaryDomains.filter((item) => item.domainStatus === "blocked").length,
      totalDefinitions: boundaryDefinitions.length,
      totalBlockers: boundaryBlockers.length,
      totalForbiddenBoundaryCrossings: forbiddenBoundaryCrossings.length,
      rollbackPlanningSteps: boundaryRollbackPlanning.rollbackPlanningSteps.length,
      futureBoundaryReviewReady: conclusion.runtimeBoundaryConclusion === "future-boundary-review-ready"
    },
    warnings: warningsFor(conclusion.runtimeBoundaryConclusion),
    recommendedNextStage: conclusion.recommendedNextStage
  };
}

export function buildGovernanceRuntimeActivationBoundaryPreview(projectRoot: string): GovernanceRuntimeActivationBoundaryPreview {
  return buildGovernanceRuntimeActivationBoundaryPreviewFromGovernanceReview(buildGovernanceRuntimeActivationGovernanceReviewPreview(projectRoot));
}

export function renderGovernanceRuntimeActivationBoundaryPreviewMarkdown(preview: GovernanceRuntimeActivationBoundaryPreview): string {
  const lines = [
    "# AI Software Factory - Runtime Activation Boundary Preview",
    "",
    "Preview status:", preview.previewStatus,
    "", "Source governance review status:", preview.sourceGovernanceReviewStatus,
    "", "Runtime boundary conclusion:", preview.runtimeBoundaryConclusion,
    "", "Runtime activation approved:", String(preview.runtimeActivationApproved),
    "", "Runtime activation executed:", String(preview.runtimeActivationExecuted),
    "", "Runtime boundary applied:", String(preview.runtimeBoundaryApplied),
    "", "Runtime boundary enforced:", String(preview.runtimeBoundaryEnforced),
    "", "Runtime governance enabled:", String(preview.runtimeGovernanceEnabled),
    "", "Runtime autonomy enabled:", String(preview.runtimeAutonomyEnabled),
    "", "Runtime autonomy actions allowed:", String(preview.runtimeAutonomyActionsAllowed),
    "", "Runtime certification applied:", String(preview.runtimeCertificationApplied),
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
    "", "Boundary score:", String(preview.boundaryScore.score),
    "", "Boundary rating:", preview.boundaryScore.rating,
    "", "Domain count:", String(preview.summary.totalDomains),
    "", "Definition count:", String(preview.summary.totalDefinitions),
    "", "Blocker count:", String(preview.summary.totalBlockers),
    "", "Forbidden boundary crossing count:", String(preview.summary.totalForbiddenBoundaryCrossings),
    "", "Rollback planning step count:", String(preview.summary.rollbackPlanningSteps),
    "", "Future boundary review ready:", String(preview.summary.futureBoundaryReviewReady),
    "", "Recommended next stage:", preview.recommendedNextStage,
    "", "## Boundary Domains", ""
  ];
  for (const item of preview.boundaryDomains) lines.push(`- [${item.category}/${item.domainStatus}/applied=${String(item.applied)}] ${item.id} ${item.key} - ${item.reason}`);
  lines.push("", "## Boundary Definitions", "");
  for (const item of preview.boundaryDefinitions) lines.push(`- [${item.category}/${item.boundaryType}] ${item.id} ${item.key} - ${item.reason}`);
  lines.push("", "## Boundary Blockers", "");
  for (const item of preview.boundaryBlockers) lines.push(`- [${item.severity}] ${item.id} ${item.key} - ${item.reason}`);
  lines.push("", "## Forbidden Boundary Crossings", "");
  for (const item of preview.forbiddenBoundaryCrossings) lines.push(`- [${item.category}] ${item.id} permanentlyForbidden=${String(item.permanentlyForbidden)} - ${item.reason}`);
  lines.push("", "## Boundary Rollback Planning", "");
  lines.push(`Rollback execution allowed: ${String(preview.boundaryRollbackPlanning.rollbackExecutionAllowed)}`);
  lines.push(`Rollback prepared: ${String(preview.boundaryRollbackPlanning.rollbackPrepared)}`);
  lines.push(`Reason: ${preview.boundaryRollbackPlanning.reason}`);
  for (const item of preview.boundaryRollbackPlanning.rollbackPlanningSteps) lines.push(`- ${item.id} ${item.key} required=${String(item.required)} - ${item.reason}`);
  lines.push("", "## Warnings", "");
  for (const warning of preview.warnings) lines.push(`- ${warning}`);
  return `${lines.join("\n")}\n`;
}

export function renderGovernanceRuntimeActivationBoundaryPreviewText(preview: GovernanceRuntimeActivationBoundaryPreview): string {
  return renderGovernanceRuntimeActivationBoundaryPreviewMarkdown(preview);
}

export function writeGovernanceRuntimeActivationBoundaryPreviewArtifacts(projectRoot: string, preview: GovernanceRuntimeActivationBoundaryPreview): { jsonPath: string; markdownPath: string } {
  const jsonPath = path.join(projectRoot, ARTIFACT_JSON_PATH);
  const markdownPath = path.join(projectRoot, ARTIFACT_MARKDOWN_PATH);
  fs.ensureDirSync(path.dirname(jsonPath));
  fs.writeFileSync(jsonPath, `${JSON.stringify(preview, null, 2)}\n`, "utf8");
  fs.writeFileSync(markdownPath, renderGovernanceRuntimeActivationBoundaryPreviewMarkdown(preview), "utf8");
  return { jsonPath: ARTIFACT_JSON_PATH, markdownPath: ARTIFACT_MARKDOWN_PATH };
}
