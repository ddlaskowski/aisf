import fs from "fs-extra";
import path from "node:path";

import {
  buildGovernanceRuntimeLifecyclePreview,
  type GovernanceRuntimeLifecyclePreview
} from "./runtimeGovernanceLifecyclePreview.js";

export type GovernanceRuntimeReadinessScore = {
  score: 0 | 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90 | 100;
  rating: "blocked" | "not-ready" | "partial-preview-readiness" | "future-review-ready";
  reason: string;
};

export type GovernanceRuntimeActivationPrerequisite = {
  id: string;
  key: string;
  category:
    | "runtime-safety"
    | "runtime-observability"
    | "runtime-control-plane"
    | "runtime-rollback"
    | "runtime-governance";
  satisfied: boolean;
  reason: string;
};

export type GovernanceRuntimeActivationBlocker = {
  id: string;
  key: string;
  severity: "warning" | "high" | "critical";
  reason: string;
};

export type GovernanceRuntimeActivationFreezeCondition = {
  id: string;
  key: string;
  freezeRequired: true;
  reason: string;
};

export type GovernanceRuntimeForbiddenActivationPath = {
  id: string;
  key: string;
  permanentlyForbidden: true;
  reason: string;
};

export type GovernanceRuntimeRollbackReadinessStep = {
  id: string;
  key: string;
  required: true;
  reason: string;
};

export type GovernanceRuntimeRollbackReadinessPlanning = {
  schemaVersion: 1;
  rollbackExecutionAllowed: false;
  rollbackPrepared: false;
  rollbackPlanningSteps: GovernanceRuntimeRollbackReadinessStep[];
  reason: string;
};

export type GovernanceRuntimeActivationReadinessPreview = {
  schemaVersion: 1;
  previewStatus: "not-created" | "created" | "blocked";
  sourceRuntimeLifecycleStatus: "not-created" | "created" | "blocked";
  runtimeActivationReadinessConclusion:
    | "source-missing"
    | "not-ready"
    | "ready-for-future-review"
    | "blocked";
  runtimeActivationReadinessApplied: false;
  runtimeActivationReadinessEnforced: false;
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
  readinessScore: GovernanceRuntimeReadinessScore;
  activationPrerequisites: GovernanceRuntimeActivationPrerequisite[];
  activationBlockers: GovernanceRuntimeActivationBlocker[];
  activationFreezeConditions: GovernanceRuntimeActivationFreezeCondition[];
  forbiddenActivationPaths: GovernanceRuntimeForbiddenActivationPath[];
  rollbackReadinessPlanning: GovernanceRuntimeRollbackReadinessPlanning;
  summary: {
    readinessScoreValue: number;
    totalPrerequisites: number;
    satisfiedPrerequisites: number;
    totalBlockers: number;
    totalFreezeConditions: number;
    totalForbiddenPaths: number;
    rollbackPlanningSteps: number;
    runtimeReadyForFutureReview: boolean;
  };
  warnings: string[];
  recommendedNextStage:
    | "continue-runtime-safety-hardening"
    | "prepare-runtime-safety-certification-preview"
    | "blocked";
};

const ARTIFACT_JSON_PATH = ".factory/governance/runtime-activation-readiness-preview.json";
const ARTIFACT_MARKDOWN_PATH = ".factory/governance/runtime-activation-readiness-preview.md";

const PREREQUISITE_DEFINITIONS: Array<Omit<GovernanceRuntimeActivationPrerequisite, "id" | "satisfied">> = [
  { key: "governance-bypass-prevention-verification", category: "runtime-governance", reason: "Governance bypass prevention must be verified before any future runtime activation review." },
  { key: "mutation-boundary-verification", category: "runtime-governance", reason: "Mutation boundaries must be verified before any future runtime activation review." },
  { key: "runtime-control-plane-review-completion", category: "runtime-control-plane", reason: "Runtime control plane review must be complete before any future runtime activation review." },
  { key: "runtime-evidence-review-completion", category: "runtime-safety", reason: "Runtime evidence review must be complete before any future runtime activation review." },
  { key: "runtime-observability-review-completion", category: "runtime-observability", reason: "Runtime observability review must be complete before any future runtime activation review." },
  { key: "runtime-rollback-planning-review-completion", category: "runtime-rollback", reason: "Runtime rollback planning must be reviewed before any future runtime activation review." },
  { key: "runtime-safety-design-review-completion", category: "runtime-safety", reason: "Runtime safety design review must be complete before any future runtime activation review." },
  { key: "safe-patch-engine-exclusivity-verification", category: "runtime-governance", reason: "Safe Patch Engine exclusivity must be verified before any future runtime activation review." }
];

const BLOCKER_DEFINITIONS: Array<Omit<GovernanceRuntimeActivationBlocker, "id">> = [
  { key: "missing-runtime-activation-review", severity: "high", reason: "Future runtime activation review has not been approved or executed." },
  { key: "missing-runtime-certification", severity: "high", reason: "Runtime safety certification preview has not been generated." },
  { key: "missing-runtime-freeze-validation", severity: "high", reason: "Runtime freeze validation is not complete." },
  { key: "runtime-activation-preview-only", severity: "warning", reason: "Runtime activation readiness remains preview-only." },
  { key: "runtime-autonomy-disabled", severity: "warning", reason: "Runtime autonomy is disabled and cannot be enabled by readiness preview." },
  { key: "runtime-governance-disabled", severity: "warning", reason: "Runtime governance is disabled and cannot be enabled by readiness preview." },
  { key: "runtime-policy-enforcement-disabled", severity: "warning", reason: "Runtime policy enforcement is disabled and cannot be enabled by readiness preview." },
  { key: "runtime-rollback-execution-unavailable", severity: "high", reason: "Runtime rollback execution is unavailable in preview mode." }
];

const FREEZE_CONDITION_DEFINITIONS: Array<Omit<GovernanceRuntimeActivationFreezeCondition, "id" | "freezeRequired">> = [
  { key: "runtime-external-execution-detection", reason: "Runtime external execution detection requires future freeze handling." },
  { key: "runtime-governance-enablement-detection", reason: "Unexpected runtime governance enablement requires future freeze handling." },
  { key: "runtime-learning-detection", reason: "Runtime learning detection requires future freeze handling." },
  { key: "runtime-ml-vector-db-decisioning-detection", reason: "Runtime ML/vector DB decisioning detection requires future freeze handling." },
  { key: "runtime-mutation-scope-expansion-detection", reason: "Runtime mutation scope expansion requires future freeze handling." },
  { key: "runtime-plugin-script-execution-detection", reason: "Runtime plugin/script execution detection requires future freeze handling." },
  { key: "runtime-safe-patch-engine-bypass-detection", reason: "Safe Patch Engine bypass detection requires future freeze handling." },
  { key: "runtime-autonomy-enablement-detection", reason: "Unexpected runtime autonomy enablement requires future freeze handling." }
];

const FORBIDDEN_PATH_DEFINITIONS: Array<Omit<GovernanceRuntimeForbiddenActivationPath, "id" | "permanentlyForbidden">> = [
  { key: "direct-runtime-autonomy-enablement", reason: "Runtime autonomy can never be enabled directly by activation readiness." },
  { key: "direct-runtime-governance-activation", reason: "Runtime governance can never be activated directly by readiness preview." },
  { key: "direct-runtime-policy-enforcement-enablement", reason: "Runtime policy enforcement can never be enabled directly by readiness preview." },
  { key: "runtime-activation-bypassing-safe-patch-engine", reason: "Runtime activation can never bypass Safe Patch Engine." },
  { key: "runtime-activation-with-ml-vector-db-governance", reason: "Runtime activation can never include ML/vector DB governance decisioning." },
  { key: "runtime-activation-with-mutation-scope-expansion", reason: "Runtime activation can never expand mutation scope." },
  { key: "runtime-activation-with-plugin-execution", reason: "Runtime activation can never include plugin execution." },
  { key: "runtime-activation-with-runtime-learning", reason: "Runtime activation can never include runtime learning." },
  { key: "runtime-activation-with-script-evaluation", reason: "Runtime activation can never include script evaluation." },
  { key: "runtime-activation-with-uncontrolled-multi-agent-coordination", reason: "Runtime activation can never include uncontrolled multi-agent coordination." },
  { key: "runtime-activation-without-human-review", reason: "Runtime activation can never occur without human review." }
];

const ROLLBACK_STEP_DEFINITIONS: Array<Omit<GovernanceRuntimeRollbackReadinessStep, "id" | "required">> = [
  { key: "future-audit-preservation-planning", reason: "Future runtime activation readiness must include audit preservation planning." },
  { key: "future-mutation-boundary-verification-planning", reason: "Future runtime activation readiness must include mutation-boundary verification planning." },
  { key: "future-runtime-autonomy-shutdown-planning", reason: "Future runtime activation readiness must include runtime autonomy shutdown planning." },
  { key: "future-runtime-governance-shutdown-planning", reason: "Future runtime activation readiness must include runtime governance shutdown planning." },
  { key: "future-runtime-policy-freeze-planning", reason: "Future runtime activation readiness must include runtime policy freeze planning." },
  { key: "future-runtime-rollback-verification-planning", reason: "Future runtime activation readiness must include rollback verification planning." },
  { key: "future-safe-patch-engine-verification-planning", reason: "Future runtime activation readiness must include Safe Patch Engine verification planning." }
];

function withDeterministicIds<T>(prefix: string, items: T[], sortKey: (item: T) => string): Array<T & { id: string }> {
  return [...items]
    .sort((a, b) => sortKey(a).localeCompare(sortKey(b)))
    .map((item, index) => ({ id: `${prefix}-${String(index + 1).padStart(3, "0")}`, ...item }));
}

function conclusionFor(source: GovernanceRuntimeLifecyclePreview): Pick<GovernanceRuntimeActivationReadinessPreview, "previewStatus" | "runtimeActivationReadinessConclusion" | "recommendedNextStage"> {
  if (source.previewStatus === "not-created") {
    return { previewStatus: "not-created", runtimeActivationReadinessConclusion: "source-missing", recommendedNextStage: "continue-runtime-safety-hardening" };
  }
  if (source.previewStatus === "blocked") {
    return { previewStatus: "blocked", runtimeActivationReadinessConclusion: "blocked", recommendedNextStage: "blocked" };
  }
  if (source.runtimeLifecycleConclusion === "runtime-lifecycle-ready-preview") {
    return { previewStatus: "created", runtimeActivationReadinessConclusion: "ready-for-future-review", recommendedNextStage: "prepare-runtime-safety-certification-preview" };
  }
  return { previewStatus: "created", runtimeActivationReadinessConclusion: "not-ready", recommendedNextStage: "continue-runtime-safety-hardening" };
}

function readinessScoreFor(conclusion: GovernanceRuntimeActivationReadinessPreview["runtimeActivationReadinessConclusion"]): GovernanceRuntimeReadinessScore {
  if (conclusion === "blocked") return { score: 0, rating: "blocked", reason: "Runtime activation readiness is blocked by the source lifecycle preview." };
  if (conclusion === "source-missing") return { score: 20, rating: "not-ready", reason: "Runtime lifecycle preview is missing." };
  if (conclusion === "not-ready") return { score: 40, rating: "partial-preview-readiness", reason: "Runtime lifecycle preview exists but is not ready for future review." };
  return { score: 80, rating: "future-review-ready", reason: "Runtime lifecycle preview is ready for future review; runtime activation still cannot execute in v8.x preview mode." };
}

function buildPrerequisites(ready: boolean): GovernanceRuntimeActivationPrerequisite[] {
  return withDeterministicIds(
    "gov-runtime-activation-prerequisite",
    PREREQUISITE_DEFINITIONS.map((item) => ({ ...item, satisfied: ready })),
    (item) => `${item.category}:${item.key}`
  );
}

function buildBlockers(conclusion: GovernanceRuntimeActivationReadinessPreview["runtimeActivationReadinessConclusion"]): GovernanceRuntimeActivationBlocker[] {
  const blockers = conclusion === "ready-for-future-review"
    ? BLOCKER_DEFINITIONS.filter((item) => item.key !== "missing-runtime-activation-review" && item.key !== "missing-runtime-freeze-validation")
    : BLOCKER_DEFINITIONS;
  return withDeterministicIds("gov-runtime-activation-blocker", blockers, (item) => `${item.severity}:${item.key}`);
}

function buildFreezeConditions(): GovernanceRuntimeActivationFreezeCondition[] {
  return withDeterministicIds(
    "gov-runtime-activation-freeze",
    FREEZE_CONDITION_DEFINITIONS.map((item) => ({ ...item, freezeRequired: true })),
    (item) => item.key
  );
}

function buildForbiddenPaths(): GovernanceRuntimeForbiddenActivationPath[] {
  return withDeterministicIds(
    "gov-runtime-activation-forbidden",
    FORBIDDEN_PATH_DEFINITIONS.map((item) => ({ ...item, permanentlyForbidden: true })),
    (item) => item.key
  );
}

function buildRollbackReadinessPlanning(): GovernanceRuntimeRollbackReadinessPlanning {
  return {
    schemaVersion: 1,
    rollbackExecutionAllowed: false,
    rollbackPrepared: false,
    rollbackPlanningSteps: withDeterministicIds(
      "gov-runtime-activation-rollback",
      ROLLBACK_STEP_DEFINITIONS.map((item) => ({ ...item, required: true })),
      (item) => item.key
    ),
    reason: "Rollback readiness is planning-only; rollback is not prepared or executable in preview mode."
  };
}

function warningsFor(conclusion: GovernanceRuntimeActivationReadinessPreview["runtimeActivationReadinessConclusion"]): string[] {
  const warnings = [
    "Runtime activation readiness preview is advisory only.",
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
  if (conclusion === "source-missing") warnings.unshift("Runtime lifecycle source is missing; activation readiness preview is incomplete.");
  if (conclusion === "not-ready") warnings.unshift("Runtime lifecycle preview is not ready for activation readiness review.");
  if (conclusion === "ready-for-future-review") warnings.unshift("Runtime activation readiness is ready for future review only.");
  if (conclusion === "blocked") warnings.unshift("Runtime lifecycle preview is blocked; activation readiness preview is blocked.");
  return warnings;
}

export function buildGovernanceRuntimeActivationReadinessPreviewFromLifecycle(source: GovernanceRuntimeLifecyclePreview): GovernanceRuntimeActivationReadinessPreview {
  const conclusion = conclusionFor(source);
  const readinessScore = readinessScoreFor(conclusion.runtimeActivationReadinessConclusion);
  const activationPrerequisites = buildPrerequisites(conclusion.runtimeActivationReadinessConclusion === "ready-for-future-review");
  const activationBlockers = buildBlockers(conclusion.runtimeActivationReadinessConclusion);
  const activationFreezeConditions = buildFreezeConditions();
  const forbiddenActivationPaths = buildForbiddenPaths();
  const rollbackReadinessPlanning = buildRollbackReadinessPlanning();

  return {
    schemaVersion: 1,
    previewStatus: conclusion.previewStatus,
    sourceRuntimeLifecycleStatus: source.previewStatus,
    runtimeActivationReadinessConclusion: conclusion.runtimeActivationReadinessConclusion,
    runtimeActivationReadinessApplied: false,
    runtimeActivationReadinessEnforced: false,
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
    readinessScore,
    activationPrerequisites,
    activationBlockers,
    activationFreezeConditions,
    forbiddenActivationPaths,
    rollbackReadinessPlanning,
    summary: {
      readinessScoreValue: readinessScore.score,
      totalPrerequisites: activationPrerequisites.length,
      satisfiedPrerequisites: activationPrerequisites.filter((item) => item.satisfied).length,
      totalBlockers: activationBlockers.length,
      totalFreezeConditions: activationFreezeConditions.length,
      totalForbiddenPaths: forbiddenActivationPaths.length,
      rollbackPlanningSteps: rollbackReadinessPlanning.rollbackPlanningSteps.length,
      runtimeReadyForFutureReview: conclusion.runtimeActivationReadinessConclusion === "ready-for-future-review"
    },
    warnings: warningsFor(conclusion.runtimeActivationReadinessConclusion),
    recommendedNextStage: conclusion.recommendedNextStage
  };
}

export function buildGovernanceRuntimeActivationReadinessPreview(projectRoot: string): GovernanceRuntimeActivationReadinessPreview {
  return buildGovernanceRuntimeActivationReadinessPreviewFromLifecycle(buildGovernanceRuntimeLifecyclePreview(projectRoot));
}

export function renderGovernanceRuntimeActivationReadinessPreviewMarkdown(preview: GovernanceRuntimeActivationReadinessPreview): string {
  const lines = [
    "# AI Software Factory - Runtime Activation Readiness Preview",
    "",
    "Preview status:", preview.previewStatus,
    "", "Source runtime lifecycle status:", preview.sourceRuntimeLifecycleStatus,
    "", "Runtime activation readiness conclusion:", preview.runtimeActivationReadinessConclusion,
    "", "Runtime activation readiness applied:", String(preview.runtimeActivationReadinessApplied),
    "", "Runtime activation readiness enforced:", String(preview.runtimeActivationReadinessEnforced),
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
    "", "Readiness score:", String(preview.readinessScore.score),
    "", "Readiness rating:", preview.readinessScore.rating,
    "", "Prerequisite count:", String(preview.summary.totalPrerequisites),
    "", "Satisfied prerequisite count:", String(preview.summary.satisfiedPrerequisites),
    "", "Blocker count:", String(preview.summary.totalBlockers),
    "", "Freeze condition count:", String(preview.summary.totalFreezeConditions),
    "", "Forbidden path count:", String(preview.summary.totalForbiddenPaths),
    "", "Rollback planning step count:", String(preview.summary.rollbackPlanningSteps),
    "", "Runtime ready for future review:", String(preview.summary.runtimeReadyForFutureReview),
    "", "Recommended next stage:", preview.recommendedNextStage,
    "", "## Activation Prerequisites", ""
  ];
  for (const item of preview.activationPrerequisites) lines.push(`- [${item.category}/satisfied=${String(item.satisfied)}] ${item.id} ${item.key} - ${item.reason}`);
  lines.push("", "## Activation Blockers", "");
  for (const item of preview.activationBlockers) lines.push(`- [${item.severity}] ${item.id} ${item.key} - ${item.reason}`);
  lines.push("", "## Activation Freeze Conditions", "");
  for (const item of preview.activationFreezeConditions) lines.push(`- ${item.id} ${item.key} - ${item.reason}`);
  lines.push("", "## Forbidden Activation Paths", "");
  for (const item of preview.forbiddenActivationPaths) lines.push(`- ${item.id} ${item.key} - ${item.reason}`);
  lines.push("", "## Rollback Readiness Planning", "");
  lines.push(`Rollback execution allowed: ${String(preview.rollbackReadinessPlanning.rollbackExecutionAllowed)}`);
  lines.push(`Rollback prepared: ${String(preview.rollbackReadinessPlanning.rollbackPrepared)}`);
  lines.push(preview.rollbackReadinessPlanning.reason);
  for (const item of preview.rollbackReadinessPlanning.rollbackPlanningSteps) lines.push(`- ${item.id} ${item.key} - ${item.reason}`);
  lines.push("", "## Warnings", "");
  for (const warning of preview.warnings) lines.push(`- ${warning}`);
  return `${lines.join("\n")}\n`;
}

export function renderGovernanceRuntimeActivationReadinessPreviewText(preview: GovernanceRuntimeActivationReadinessPreview): string {
  return renderGovernanceRuntimeActivationReadinessPreviewMarkdown(preview);
}

export function writeGovernanceRuntimeActivationReadinessPreviewArtifacts(projectRoot: string, preview: GovernanceRuntimeActivationReadinessPreview): { jsonPath: string; markdownPath: string } {
  const jsonPath = path.join(projectRoot, ARTIFACT_JSON_PATH);
  const markdownPath = path.join(projectRoot, ARTIFACT_MARKDOWN_PATH);
  fs.ensureDirSync(path.dirname(jsonPath));
  fs.writeFileSync(jsonPath, `${JSON.stringify(preview, null, 2)}\n`, "utf8");
  fs.writeFileSync(markdownPath, renderGovernanceRuntimeActivationReadinessPreviewMarkdown(preview), "utf8");
  return { jsonPath: ARTIFACT_JSON_PATH, markdownPath: ARTIFACT_MARKDOWN_PATH };
}
