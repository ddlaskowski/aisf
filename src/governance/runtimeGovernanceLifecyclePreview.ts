import fs from "fs-extra";
import path from "node:path";

import {
  buildGovernanceRuntimeControlPlanePreview,
  type GovernanceRuntimeControlPlanePreview
} from "./runtimeControlPlanePreview.js";

export type GovernanceRuntimeLifecycleStage = {
  id: string;
  key: string;
  title: string;
  category:
    | "runtime-safety-design"
    | "runtime-safety-evidence"
    | "runtime-observability"
    | "runtime-control-plane"
    | "runtime-activation-review"
    | "runtime-rollback-planning"
    | "runtime-forbidden-capabilities";
  stageStatus: "ready-preview" | "not-ready" | "blocked" | "future-only";
  reason: string;
  lifecycleApplied: false;
  lifecycleTransitionExecuted: false;
};

export type GovernanceRuntimeLifecycleTransition = {
  id: string;
  fromStage: string;
  toStage: string;
  transitionStatus:
    | "preview-only"
    | "blocked"
    | "future-human-review-required"
    | "permanently-forbidden";
  reason: string;
  executed: false;
};

export type GovernanceRuntimeLifecycleBlocker = {
  id: string;
  key: string;
  severity: "warning" | "high" | "critical";
  reason: string;
};

export type GovernanceRuntimeRollbackLifecycleStep = {
  id: string;
  key: string;
  required: true;
  reason: string;
};

export type GovernanceRuntimeRollbackLifecyclePlan = {
  schemaVersion: 1;
  rollbackAvailable: false;
  rollbackExecuted: false;
  rollbackSteps: GovernanceRuntimeRollbackLifecycleStep[];
  reason: string;
};

export type GovernanceRuntimeLifecyclePreview = {
  schemaVersion: 1;
  previewStatus: "not-created" | "created" | "blocked";
  sourceRuntimeControlPlaneStatus: "not-created" | "created" | "blocked";
  runtimeLifecycleConclusion:
    | "source-missing"
    | "runtime-lifecycle-not-ready"
    | "runtime-lifecycle-ready-preview"
    | "blocked-preview";
  runtimeLifecycleApplied: false;
  runtimeLifecycleEnforced: false;
  runtimeLifecycleTransitionExecuted: false;
  runtimeControlPlaneApplied: false;
  runtimeControlPlaneEnforced: false;
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
  runtimeGovernanceEnabled: false;
  runtimeAutonomyEnabled: false;
  runtimeAutonomyActionsAllowed: false;
  runtimePolicyEnforcementEnabled: false;
  runtimeConfigActivationEnabled: false;
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
  runtimeLifecycleStages: GovernanceRuntimeLifecycleStage[];
  runtimeLifecycleTransitions: GovernanceRuntimeLifecycleTransition[];
  runtimeLifecycleBlockers: GovernanceRuntimeLifecycleBlocker[];
  runtimeRollbackLifecyclePlan: GovernanceRuntimeRollbackLifecyclePlan;
  summary: {
    totalLifecycleStages: number;
    readyStages: number;
    blockedStages: number;
    futureOnlyStages: number;
    totalTransitions: number;
    blockedTransitions: number;
    rollbackStepCount: number;
    runtimeLifecycleReadyForFutureReview: boolean;
  };
  warnings: string[];
  recommendedNextStage:
    | "continue-runtime-safety-hardening"
    | "prepare-runtime-activation-readiness-preview"
    | "blocked";
};

const ARTIFACT_JSON_PATH = ".factory/governance/runtime-lifecycle-preview.json";
const ARTIFACT_MARKDOWN_PATH = ".factory/governance/runtime-lifecycle-preview.md";

const STAGE_DEFINITIONS: Array<Omit<GovernanceRuntimeLifecycleStage, "id" | "stageStatus" | "lifecycleApplied" | "lifecycleTransitionExecuted">> = [
  { key: "runtime-activation-review", title: "Runtime Activation Review", category: "runtime-activation-review", reason: "Runtime activation remains a future human-reviewed concept only." },
  { key: "runtime-control-plane-review", title: "Runtime Control Plane Review", category: "runtime-control-plane", reason: "Runtime control plane structures remain preview-only and inactive." },
  { key: "runtime-forbidden-capability-confirmation", title: "Runtime Forbidden Capability Confirmation", category: "runtime-forbidden-capabilities", reason: "Runtime forbidden capabilities remain permanently blocked." },
  { key: "runtime-observability-review", title: "Runtime Observability Review", category: "runtime-observability", reason: "Runtime observability structures remain preview-only and are not executed." },
  { key: "runtime-rollback-planning", title: "Runtime Rollback Planning", category: "runtime-rollback-planning", reason: "Runtime rollback planning is documented but no rollback is available or executed." },
  { key: "runtime-safety-design-review", title: "Runtime Safety Design Review", category: "runtime-safety-design", reason: "Runtime safety design must remain deterministic and preview-only." },
  { key: "runtime-safety-evidence-review", title: "Runtime Safety Evidence Review", category: "runtime-safety-evidence", reason: "Runtime safety evidence must remain advisory and not applied." }
];

const BASE_TRANSITION_DEFINITIONS: Array<Omit<GovernanceRuntimeLifecycleTransition, "id" | "executed">> = [
  { fromStage: "runtime-activation-review", toStage: "runtime-rollback-planning", transitionStatus: "future-human-review-required", reason: "Runtime activation review may only preview rollback planning with future human review." },
  { fromStage: "runtime-control-plane-review", toStage: "runtime-activation-review", transitionStatus: "future-human-review-required", reason: "Runtime control plane review may only preview activation review with future human review." },
  { fromStage: "runtime-observability-review", toStage: "runtime-control-plane-review", transitionStatus: "preview-only", reason: "Runtime observability review may preview runtime control plane review only." },
  { fromStage: "runtime-safety-design-review", toStage: "runtime-safety-evidence-review", transitionStatus: "preview-only", reason: "Runtime safety design review may preview runtime safety evidence review only." },
  { fromStage: "runtime-safety-evidence-review", toStage: "runtime-observability-review", transitionStatus: "preview-only", reason: "Runtime safety evidence review may preview runtime observability review only." }
];

const FORBIDDEN_TRANSITION_DEFINITIONS: Array<Omit<GovernanceRuntimeLifecycleTransition, "id" | "executed">> = [
  { fromStage: "runtime-activation", toStage: "runtime-governance-enablement", transitionStatus: "permanently-forbidden", reason: "Runtime activation preview can never directly enable runtime governance." },
  { fromStage: "runtime-control-plane", toStage: "runtime-override-execution", transitionStatus: "permanently-forbidden", reason: "Runtime control plane preview can never execute runtime overrides." },
  { fromStage: "runtime-lifecycle", toStage: "mutation-scope-expansion", transitionStatus: "permanently-forbidden", reason: "Runtime lifecycle preview can never expand mutation scope." },
  { fromStage: "runtime-lifecycle", toStage: "safe-patch-engine-bypass", transitionStatus: "permanently-forbidden", reason: "Runtime lifecycle preview can never bypass Safe Patch Engine." },
  { fromStage: "runtime-lifecycle", toStage: "self-modifying-governance", transitionStatus: "permanently-forbidden", reason: "Runtime lifecycle preview can never allow self-modifying governance." },
  { fromStage: "runtime-preview", toStage: "runtime-execution", transitionStatus: "permanently-forbidden", reason: "Runtime preview can never transition directly to runtime execution." },
  { fromStage: "runtime-review", toStage: "autonomous-repair-execution", transitionStatus: "permanently-forbidden", reason: "Runtime review can never transition directly to autonomous repair execution." },
  { fromStage: "runtime-rollback", toStage: "runtime-rollback-execution", transitionStatus: "permanently-forbidden", reason: "Runtime rollback planning can never execute rollback." }
];

const ROLLBACK_STEP_DEFINITIONS: Array<Omit<GovernanceRuntimeRollbackLifecycleStep, "id" | "required">> = [
  { key: "future-audit-preservation-planning", reason: "Future rollback lifecycle planning must preserve audit evidence." },
  { key: "future-mutation-boundary-verification-planning", reason: "Future rollback lifecycle planning must verify mutation boundaries remain unchanged." },
  { key: "future-runtime-autonomy-shutdown-planning", reason: "Future rollback lifecycle planning must define runtime autonomy shutdown concepts." },
  { key: "future-runtime-governance-shutdown-planning", reason: "Future rollback lifecycle planning must define runtime governance shutdown concepts." },
  { key: "future-runtime-policy-freeze-planning", reason: "Future rollback lifecycle planning must define runtime policy freeze concepts." },
  { key: "future-runtime-rollback-verification-planning", reason: "Future rollback lifecycle planning must define rollback verification concepts." },
  { key: "future-safe-patch-engine-verification-planning", reason: "Future rollback lifecycle planning must verify Safe Patch Engine exclusivity." }
];

function withDeterministicIds<T>(
  prefix: string,
  items: T[],
  sortKey: (item: T) => string
): Array<T & { id: string }> {
  return [...items]
    .sort((a, b) => sortKey(a).localeCompare(sortKey(b)))
    .map((item, index) => ({
      id: `${prefix}-${String(index + 1).padStart(3, "0")}`,
      ...item
    }));
}

function conclusionFor(source: GovernanceRuntimeControlPlanePreview): Pick<
  GovernanceRuntimeLifecyclePreview,
  "previewStatus" | "runtimeLifecycleConclusion" | "recommendedNextStage"
> {
  if (source.previewStatus === "not-created") {
    return {
      previewStatus: "not-created",
      runtimeLifecycleConclusion: "source-missing",
      recommendedNextStage: "continue-runtime-safety-hardening"
    };
  }
  if (source.previewStatus === "blocked") {
    return {
      previewStatus: "blocked",
      runtimeLifecycleConclusion: "blocked-preview",
      recommendedNextStage: "blocked"
    };
  }
  if (source.runtimeControlPlaneConclusion === "runtime-control-plane-ready-preview") {
    return {
      previewStatus: "created",
      runtimeLifecycleConclusion: "runtime-lifecycle-ready-preview",
      recommendedNextStage: "prepare-runtime-activation-readiness-preview"
    };
  }
  return {
    previewStatus: "created",
    runtimeLifecycleConclusion: "runtime-lifecycle-not-ready",
    recommendedNextStage: "continue-runtime-safety-hardening"
  };
}

function stageStatusFor(
  conclusion: GovernanceRuntimeLifecyclePreview["runtimeLifecycleConclusion"],
  category: GovernanceRuntimeLifecycleStage["category"]
): GovernanceRuntimeLifecycleStage["stageStatus"] {
  if (category === "runtime-forbidden-capabilities" || category === "runtime-rollback-planning" || category === "runtime-activation-review") {
    return "future-only";
  }
  if (conclusion === "blocked-preview") {
    return "blocked";
  }
  if (conclusion === "runtime-lifecycle-ready-preview") {
    return "ready-preview";
  }
  return "not-ready";
}

function buildRuntimeLifecycleStages(
  conclusion: GovernanceRuntimeLifecyclePreview["runtimeLifecycleConclusion"]
): GovernanceRuntimeLifecycleStage[] {
  return withDeterministicIds(
    "gov-runtime-lifecycle-stage",
    STAGE_DEFINITIONS.map((stage) => ({
      ...stage,
      stageStatus: stageStatusFor(conclusion, stage.category),
      lifecycleApplied: false,
      lifecycleTransitionExecuted: false
    })),
    (item) => `${item.category}:${item.key}:${item.stageStatus}`
  );
}

function buildRuntimeLifecycleTransitions(): GovernanceRuntimeLifecycleTransition[] {
  return withDeterministicIds(
    "gov-runtime-lifecycle-transition",
    [...BASE_TRANSITION_DEFINITIONS, ...FORBIDDEN_TRANSITION_DEFINITIONS].map((transition) => ({
      ...transition,
      executed: false
    })),
    (item) => `${item.transitionStatus}:${item.fromStage}:${item.toStage}`
  );
}

function buildRuntimeLifecycleBlockers(
  conclusion: GovernanceRuntimeLifecyclePreview["runtimeLifecycleConclusion"]
): GovernanceRuntimeLifecycleBlocker[] {
  const blockers: Array<Omit<GovernanceRuntimeLifecycleBlocker, "id">> = [];
  if (conclusion === "source-missing") {
    blockers.push({ key: "missing-runtime-control-plane-preview", severity: "high", reason: "Runtime control plane preview is missing; runtime lifecycle preview cannot be considered ready." });
  }
  if (conclusion === "runtime-lifecycle-not-ready") {
    blockers.push({ key: "runtime-control-plane-not-ready", severity: "warning", reason: "Runtime control plane preview is not ready for future runtime lifecycle review." });
  }
  if (conclusion === "blocked-preview") {
    blockers.push({ key: "blocked-runtime-control-plane-preview", severity: "critical", reason: "Runtime control plane preview is blocked; runtime lifecycle preview is blocked." });
  }
  return withDeterministicIds("gov-runtime-lifecycle-blocker", blockers, (item) => `${item.severity}:${item.key}`);
}

function buildRuntimeRollbackLifecyclePlan(): GovernanceRuntimeRollbackLifecyclePlan {
  return {
    schemaVersion: 1,
    rollbackAvailable: false,
    rollbackExecuted: false,
    rollbackSteps: withDeterministicIds(
      "gov-runtime-lifecycle-rollback",
      ROLLBACK_STEP_DEFINITIONS.map((step) => ({
        ...step,
        required: true
      })),
      (item) => item.key
    ),
    reason: "Runtime rollback lifecycle planning is documented for future review only; rollback is not available or executed in preview mode."
  };
}

function buildSummary(
  runtimeLifecycleStages: GovernanceRuntimeLifecycleStage[],
  runtimeLifecycleTransitions: GovernanceRuntimeLifecycleTransition[],
  runtimeRollbackLifecyclePlan: GovernanceRuntimeRollbackLifecyclePlan,
  conclusion: GovernanceRuntimeLifecyclePreview["runtimeLifecycleConclusion"]
): GovernanceRuntimeLifecyclePreview["summary"] {
  return {
    totalLifecycleStages: runtimeLifecycleStages.length,
    readyStages: runtimeLifecycleStages.filter((stage) => stage.stageStatus === "ready-preview").length,
    blockedStages: runtimeLifecycleStages.filter((stage) => stage.stageStatus === "blocked").length,
    futureOnlyStages: runtimeLifecycleStages.filter((stage) => stage.stageStatus === "future-only").length,
    totalTransitions: runtimeLifecycleTransitions.length,
    blockedTransitions: runtimeLifecycleTransitions.filter((transition) =>
      transition.transitionStatus === "blocked" || transition.transitionStatus === "permanently-forbidden"
    ).length,
    rollbackStepCount: runtimeRollbackLifecyclePlan.rollbackSteps.length,
    runtimeLifecycleReadyForFutureReview: conclusion === "runtime-lifecycle-ready-preview"
  };
}

function warningsFor(conclusion: GovernanceRuntimeLifecyclePreview["runtimeLifecycleConclusion"]): string[] {
  const warnings = [
    "Runtime governance lifecycle preview is advisory only.",
    "No runtime lifecycle behavior was applied.",
    "No runtime lifecycle behavior was enforced.",
    "No runtime lifecycle transition was executed.",
    "No runtime rollback was executed.",
    "No runtime kill switch was activated.",
    "No runtime emergency stop was executed.",
    "No runtime operator override was applied.",
    "Runtime governance is not enabled.",
    "Runtime autonomy is not enabled.",
    "Runtime autonomous actions are not allowed.",
    "Runtime policies are not enforced.",
    "Runtime sandbox execution is not allowed.",
    "Runtime plugin, script, learning, ML, and multi-agent execution remain disabled.",
    "Runtime behavior did not change.",
    "Repair orchestration did not change."
  ];
  if (conclusion === "source-missing") warnings.unshift("Runtime control plane source is missing; runtime lifecycle preview is incomplete.");
  if (conclusion === "runtime-lifecycle-not-ready") warnings.unshift("Runtime control plane preview is not ready for runtime lifecycle review.");
  if (conclusion === "runtime-lifecycle-ready-preview") warnings.unshift("Runtime governance lifecycle is ready for future review only.");
  if (conclusion === "blocked-preview") warnings.unshift("Runtime control plane preview is blocked; runtime lifecycle preview is blocked.");
  return warnings;
}

export function buildGovernanceRuntimeLifecyclePreviewFromControlPlane(source: GovernanceRuntimeControlPlanePreview): GovernanceRuntimeLifecyclePreview {
  const conclusion = conclusionFor(source);
  const runtimeLifecycleStages = buildRuntimeLifecycleStages(conclusion.runtimeLifecycleConclusion);
  const runtimeLifecycleTransitions = buildRuntimeLifecycleTransitions();
  const runtimeLifecycleBlockers = buildRuntimeLifecycleBlockers(conclusion.runtimeLifecycleConclusion);
  const runtimeRollbackLifecyclePlan = buildRuntimeRollbackLifecyclePlan();

  return {
    schemaVersion: 1,
    previewStatus: conclusion.previewStatus,
    sourceRuntimeControlPlaneStatus: source.previewStatus,
    runtimeLifecycleConclusion: conclusion.runtimeLifecycleConclusion,
    runtimeLifecycleApplied: false,
    runtimeLifecycleEnforced: false,
    runtimeLifecycleTransitionExecuted: false,
    runtimeControlPlaneApplied: false,
    runtimeControlPlaneEnforced: false,
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
    runtimeGovernanceEnabled: false,
    runtimeAutonomyEnabled: false,
    runtimeAutonomyActionsAllowed: false,
    runtimePolicyEnforcementEnabled: false,
    runtimeConfigActivationEnabled: false,
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
    runtimeLifecycleStages,
    runtimeLifecycleTransitions,
    runtimeLifecycleBlockers,
    runtimeRollbackLifecyclePlan,
    summary: buildSummary(runtimeLifecycleStages, runtimeLifecycleTransitions, runtimeRollbackLifecyclePlan, conclusion.runtimeLifecycleConclusion),
    warnings: warningsFor(conclusion.runtimeLifecycleConclusion),
    recommendedNextStage: conclusion.recommendedNextStage
  };
}

export function buildGovernanceRuntimeLifecyclePreview(projectRoot: string): GovernanceRuntimeLifecyclePreview {
  return buildGovernanceRuntimeLifecyclePreviewFromControlPlane(buildGovernanceRuntimeControlPlanePreview(projectRoot));
}

export function renderGovernanceRuntimeLifecyclePreviewMarkdown(preview: GovernanceRuntimeLifecyclePreview): string {
  const lines = [
    "# AI Software Factory - Runtime Governance Lifecycle Preview",
    "",
    "Preview status:", preview.previewStatus,
    "", "Source runtime control plane status:", preview.sourceRuntimeControlPlaneStatus,
    "", "Runtime lifecycle conclusion:", preview.runtimeLifecycleConclusion,
    "", "Runtime lifecycle applied:", String(preview.runtimeLifecycleApplied),
    "", "Runtime lifecycle enforced:", String(preview.runtimeLifecycleEnforced),
    "", "Runtime lifecycle transition executed:", String(preview.runtimeLifecycleTransitionExecuted),
    "", "Runtime control plane applied:", String(preview.runtimeControlPlaneApplied),
    "", "Runtime control plane enforced:", String(preview.runtimeControlPlaneEnforced),
    "", "Runtime control plane activated:", String(preview.runtimeControlPlaneActivated),
    "", "Runtime kill switch activated:", String(preview.runtimeKillSwitchActivated),
    "", "Runtime emergency stop executed:", String(preview.runtimeEmergencyStopExecuted),
    "", "Runtime operator override applied:", String(preview.runtimeOperatorOverrideApplied),
    "", "Runtime rollback executed:", String(preview.runtimeRollbackExecuted),
    "", "Runtime governance enabled:", String(preview.runtimeGovernanceEnabled),
    "", "Runtime autonomy enabled:", String(preview.runtimeAutonomyEnabled),
    "", "Runtime autonomy actions allowed:", String(preview.runtimeAutonomyActionsAllowed),
    "", "Runtime policy enforcement enabled:", String(preview.runtimePolicyEnforcementEnabled),
    "", "Runtime config activation enabled:", String(preview.runtimeConfigActivationEnabled),
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
    "", "Lifecycle stage count:", String(preview.summary.totalLifecycleStages),
    "", "Ready stage count:", String(preview.summary.readyStages),
    "", "Blocked stage count:", String(preview.summary.blockedStages),
    "", "Future-only stage count:", String(preview.summary.futureOnlyStages),
    "", "Lifecycle transition count:", String(preview.summary.totalTransitions),
    "", "Blocked transition count:", String(preview.summary.blockedTransitions),
    "", "Lifecycle blocker count:", String(preview.runtimeLifecycleBlockers.length),
    "", "Rollback step count:", String(preview.summary.rollbackStepCount),
    "", "Runtime lifecycle ready for future review:", String(preview.summary.runtimeLifecycleReadyForFutureReview),
    "", "Recommended next stage:", preview.recommendedNextStage,
    "", "## Runtime Lifecycle Stages", ""
  ];
  for (const stage of preview.runtimeLifecycleStages) lines.push(`- [${stage.category}/${stage.stageStatus}] ${stage.id} ${stage.key} - ${stage.reason}`);
  lines.push("", "## Runtime Lifecycle Transitions", "");
  for (const transition of preview.runtimeLifecycleTransitions) lines.push(`- [${transition.transitionStatus}] ${transition.id} ${transition.fromStage} -> ${transition.toStage} - ${transition.reason}`);
  lines.push("", "## Runtime Lifecycle Blockers", "");
  if (preview.runtimeLifecycleBlockers.length === 0) lines.push("- none");
  for (const blocker of preview.runtimeLifecycleBlockers) lines.push(`- [${blocker.severity}] ${blocker.id} ${blocker.key} - ${blocker.reason}`);
  lines.push("", "## Runtime Rollback Lifecycle Plan", "");
  lines.push(`Rollback available: ${String(preview.runtimeRollbackLifecyclePlan.rollbackAvailable)}`);
  lines.push(`Rollback executed: ${String(preview.runtimeRollbackLifecyclePlan.rollbackExecuted)}`);
  lines.push(preview.runtimeRollbackLifecyclePlan.reason);
  for (const step of preview.runtimeRollbackLifecyclePlan.rollbackSteps) lines.push(`- ${step.id} ${step.key} - ${step.reason}`);
  lines.push("", "## Warnings", "");
  for (const warning of preview.warnings) lines.push(`- ${warning}`);
  return `${lines.join("\n")}\n`;
}

export function renderGovernanceRuntimeLifecyclePreviewText(preview: GovernanceRuntimeLifecyclePreview): string {
  return renderGovernanceRuntimeLifecyclePreviewMarkdown(preview);
}

export function writeGovernanceRuntimeLifecyclePreviewArtifacts(projectRoot: string, preview: GovernanceRuntimeLifecyclePreview): { jsonPath: string; markdownPath: string } {
  const jsonPath = path.join(projectRoot, ARTIFACT_JSON_PATH);
  const markdownPath = path.join(projectRoot, ARTIFACT_MARKDOWN_PATH);
  fs.ensureDirSync(path.dirname(jsonPath));
  fs.writeFileSync(jsonPath, `${JSON.stringify(preview, null, 2)}\n`, "utf8");
  fs.writeFileSync(markdownPath, renderGovernanceRuntimeLifecyclePreviewMarkdown(preview), "utf8");
  return { jsonPath: ARTIFACT_JSON_PATH, markdownPath: ARTIFACT_MARKDOWN_PATH };
}
