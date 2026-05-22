import fs from "fs-extra";
import path from "node:path";

import {
  buildGovernanceAutonomyControlPlanePreview,
  type GovernanceAutonomyControlPlanePreview
} from "./autonomyControlPlanePreview.js";

export type GovernanceAutonomyLifecycleStage = {
  id: string;
  key: string;
  title: string;
  category:
    | "proposal"
    | "design-review"
    | "human-approval"
    | "scope"
    | "risk"
    | "sandbox"
    | "evidence"
    | "observability"
    | "control-plane"
    | "activation-readiness"
    | "rollback"
    | "forbidden";
  stageStatus: "ready-preview" | "not-ready" | "blocked" | "future-only";
  reason: string;
  lifecycleApplied: false;
  lifecycleTransitionExecuted: false;
};

export type GovernanceAutonomyLifecycleTransition = {
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

export type GovernanceAutonomyLifecycleBlocker = {
  id: string;
  key: string;
  reason: string;
};

export type GovernanceAutonomyRollbackStep = {
  id: string;
  key: string;
  required: true;
  reason: string;
};

export type GovernanceAutonomyRollbackPlan = {
  schemaVersion: 1;
  rollbackAvailable: false;
  rollbackExecuted: false;
  rollbackSteps: GovernanceAutonomyRollbackStep[];
  reason: string;
};

export type GovernanceAutonomyLifecyclePreview = {
  schemaVersion: 1;
  previewStatus: "not-created" | "created" | "blocked";
  sourceControlPlaneStatus: "not-created" | "created" | "blocked";
  lifecycleConclusion:
    | "source-missing"
    | "lifecycle-not-ready"
    | "lifecycle-ready-preview"
    | "blocked-preview";
  lifecycleApplied: false;
  lifecycleEnforced: false;
  lifecycleTransitionExecuted: false;
  controlPlaneApplied: false;
  controlPlaneEnforced: false;
  killSwitchActivated: false;
  operatorOverrideApplied: false;
  sandboxCreated: false;
  sandboxExecuted: false;
  observabilityApplied: false;
  riskAccepted: false;
  riskMitigationApplied: false;
  scopeApproved: false;
  scopeApplied: false;
  humanApprovalGranted: false;
  approvalApplied: false;
  designReviewApproved: false;
  runtimeActivationEnabled: false;
  policyActivated: false;
  guardedActivationEnabled: false;
  activationEnforced: false;
  autonomyEnabled: false;
  autonomousActionsAllowed: false;
  autonomyApplied: false;
  autonomyEnforced: false;
  governanceBypassAllowed: false;
  applied: false;
  enforced: false;
  policyRuntimeMode: "preview-only";
  runtimeBehaviorChanged: false;
  governanceDecisionsChanged: false;
  repairOrchestrationChanged: false;
  safePatchEngineOnly: true;
  lifecycleStages: GovernanceAutonomyLifecycleStage[];
  lifecycleTransitions: GovernanceAutonomyLifecycleTransition[];
  lifecycleBlockers: GovernanceAutonomyLifecycleBlocker[];
  rollbackPlan: GovernanceAutonomyRollbackPlan;
  summary: {
    totalLifecycleStages: number;
    readyStages: number;
    blockedStages: number;
    futureOnlyStages: number;
    totalTransitions: number;
    blockedTransitions: number;
    rollbackStepCount: number;
    lifecycleReadyForFutureReview: boolean;
  };
  warnings: string[];
  recommendedNextStage:
    | "continue-governance-hardening"
    | "prepare-v8-runtime-safety-design-preview"
    | "blocked";
};

const ARTIFACT_JSON_PATH = ".factory/governance/autonomy-lifecycle-preview.json";
const ARTIFACT_MARKDOWN_PATH = ".factory/governance/autonomy-lifecycle-preview.md";

const STAGE_DEFINITIONS: Array<Omit<GovernanceAutonomyLifecycleStage, "id" | "stageStatus" | "lifecycleApplied" | "lifecycleTransitionExecuted">> = [
  { key: "activation-readiness-review", title: "Activation Readiness Review", category: "activation-readiness", reason: "Future activation readiness must remain preview-only and human-reviewed." },
  { key: "control-plane-review", title: "Control Plane Review", category: "control-plane", reason: "Future control plane structures must remain preview-only." },
  { key: "governance-design-review", title: "Governance Design Review", category: "design-review", reason: "Governance design review must precede any future autonomy consideration." },
  { key: "sandbox-evidence-review", title: "Sandbox Evidence Review", category: "evidence", reason: "Sandbox evidence must be reviewed before future sandbox consideration." },
  { key: "forbidden-capability-confirmation", title: "Forbidden Capability Confirmation", category: "forbidden", reason: "Forbidden capabilities remain blocked and can never transition to execution." },
  { key: "human-approval-workflow", title: "Human Approval Workflow", category: "human-approval", reason: "Human approval workflow must remain mandatory for future design review." },
  { key: "observability-review", title: "Observability Review", category: "observability", reason: "Observability structures must be reviewed before future control-plane design." },
  { key: "proposal-intake", title: "Proposal Intake", category: "proposal", reason: "Lifecycle begins with deterministic proposal intake only." },
  { key: "rollback-planning", title: "Rollback Planning", category: "rollback", reason: "Rollback planning is required but no rollback is available or executed here." },
  { key: "autonomy-risk-register-review", title: "Autonomy Risk Register Review", category: "risk", reason: "Risk register review must precede future sandbox planning." },
  { key: "sandbox-plan-review", title: "Sandbox Plan Review", category: "sandbox", reason: "Sandbox planning remains preview-only and does not create or execute sandboxes." },
  { key: "autonomy-scope-review", title: "Autonomy Scope Review", category: "scope", reason: "Scope review must preserve preview-only boundaries." }
];

const BASE_TRANSITION_DEFINITIONS: Array<Omit<GovernanceAutonomyLifecycleTransition, "id" | "executed">> = [
  { fromStage: "activation-readiness-review", toStage: "rollback-planning", transitionStatus: "future-human-review-required", reason: "Activation readiness can only move toward rollback planning with future human review." },
  { fromStage: "autonomy-risk-register-review", toStage: "sandbox-plan-review", transitionStatus: "preview-only", reason: "Risk register review may preview sandbox planning only." },
  { fromStage: "autonomy-scope-review", toStage: "autonomy-risk-register-review", transitionStatus: "preview-only", reason: "Scope review may preview risk register review only." },
  { fromStage: "control-plane-review", toStage: "activation-readiness-review", transitionStatus: "future-human-review-required", reason: "Control plane review may preview activation readiness only with future human review." },
  { fromStage: "governance-design-review", toStage: "human-approval-workflow", transitionStatus: "future-human-review-required", reason: "Design review may preview human approval workflow only." },
  { fromStage: "human-approval-workflow", toStage: "autonomy-scope-review", transitionStatus: "future-human-review-required", reason: "Human approval workflow may preview scope review only." },
  { fromStage: "observability-review", toStage: "control-plane-review", transitionStatus: "preview-only", reason: "Observability review may preview control plane review only." },
  { fromStage: "proposal-intake", toStage: "governance-design-review", transitionStatus: "preview-only", reason: "Proposal intake may preview governance design review only." },
  { fromStage: "sandbox-evidence-review", toStage: "observability-review", transitionStatus: "preview-only", reason: "Sandbox evidence review may preview observability review only." },
  { fromStage: "sandbox-plan-review", toStage: "sandbox-evidence-review", transitionStatus: "preview-only", reason: "Sandbox plan review may preview sandbox evidence review only." }
];

const FORBIDDEN_TRANSITION_DEFINITIONS: Array<Omit<GovernanceAutonomyLifecycleTransition, "id" | "executed">> = [
  { fromStage: "approval", toStage: "autonomous-repair-mutation", transitionStatus: "permanently-forbidden", reason: "Approval can never transition directly to autonomous repair mutation." },
  { fromStage: "control-plane", toStage: "operator-override-execution", transitionStatus: "permanently-forbidden", reason: "Control plane preview can never execute operator overrides." },
  { fromStage: "lifecycle", toStage: "mutation-scope-expansion", transitionStatus: "permanently-forbidden", reason: "Lifecycle preview can never expand mutation scope." },
  { fromStage: "lifecycle", toStage: "safe-patch-engine-bypass", transitionStatus: "permanently-forbidden", reason: "Lifecycle preview can never bypass Safe Patch Engine." },
  { fromStage: "lifecycle", toStage: "self-modifying-governance", transitionStatus: "permanently-forbidden", reason: "Lifecycle preview can never permit self-modifying governance." },
  { fromStage: "observability", toStage: "telemetry-execution", transitionStatus: "permanently-forbidden", reason: "Observability preview can never execute telemetry." },
  { fromStage: "preview", toStage: "autonomy-execution", transitionStatus: "permanently-forbidden", reason: "Preview can never transition directly to autonomy execution." },
  { fromStage: "risk-review", toStage: "enforcement", transitionStatus: "permanently-forbidden", reason: "Risk review can never transition directly to governance enforcement." },
  { fromStage: "sandbox-planning", toStage: "sandbox-execution", transitionStatus: "permanently-forbidden", reason: "Sandbox planning can never transition directly to sandbox execution." },
  { fromStage: "scope", toStage: "runtime-config-activation", transitionStatus: "permanently-forbidden", reason: "Scope review can never transition directly to runtime config activation." }
];

const ROLLBACK_STEP_DEFINITIONS: Array<Omit<GovernanceAutonomyRollbackStep, "id" | "required">> = [
  { key: "disable-future-autonomy-mode", reason: "Future rollback planning must define how to disable any future autonomy mode." },
  { key: "disable-future-policy-enforcement", reason: "Future rollback planning must define how to disable policy enforcement." },
  { key: "freeze-future-runtime-activation", reason: "Future rollback planning must define how to freeze runtime activation." },
  { key: "preserve-audit-evidence", reason: "Future rollback planning must preserve audit evidence." },
  { key: "require-human-review-before-restart", reason: "Future rollback planning must require human review before restart." },
  { key: "restore-preview-only-mode", reason: "Future rollback planning must restore preview-only mode." },
  { key: "stop-future-sandbox-execution", reason: "Future rollback planning must stop future sandbox execution." },
  { key: "verify-no-mutation-scope-expansion", reason: "Future rollback planning must verify no mutation scope expansion occurred." },
  { key: "verify-safe-patch-engine-exclusivity", reason: "Future rollback planning must verify Safe Patch Engine exclusivity." }
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

function conclusionFor(source: GovernanceAutonomyControlPlanePreview): Pick<
  GovernanceAutonomyLifecyclePreview,
  "previewStatus" | "lifecycleConclusion" | "recommendedNextStage"
> {
  if (source.previewStatus === "not-created") {
    return {
      previewStatus: "not-created",
      lifecycleConclusion: "source-missing",
      recommendedNextStage: "continue-governance-hardening"
    };
  }
  if (source.previewStatus === "blocked") {
    return {
      previewStatus: "blocked",
      lifecycleConclusion: "blocked-preview",
      recommendedNextStage: "blocked"
    };
  }
  if (source.controlPlaneConclusion === "control-plane-ready-preview") {
    return {
      previewStatus: "created",
      lifecycleConclusion: "lifecycle-ready-preview",
      recommendedNextStage: "prepare-v8-runtime-safety-design-preview"
    };
  }
  return {
    previewStatus: "created",
    lifecycleConclusion: "lifecycle-not-ready",
    recommendedNextStage: "continue-governance-hardening"
  };
}

function stageStatusFor(
  conclusion: GovernanceAutonomyLifecyclePreview["lifecycleConclusion"],
  category: GovernanceAutonomyLifecycleStage["category"]
): GovernanceAutonomyLifecycleStage["stageStatus"] {
  if (category === "forbidden" || category === "rollback") {
    return "future-only";
  }
  if (conclusion === "blocked-preview") {
    return "blocked";
  }
  if (conclusion === "lifecycle-ready-preview") {
    return "ready-preview";
  }
  return "not-ready";
}

function buildLifecycleStages(
  conclusion: GovernanceAutonomyLifecyclePreview["lifecycleConclusion"]
): GovernanceAutonomyLifecycleStage[] {
  return withDeterministicIds(
    "gov-lifecycle-stage",
    STAGE_DEFINITIONS.map((stage) => ({
      ...stage,
      stageStatus: stageStatusFor(conclusion, stage.category),
      lifecycleApplied: false,
      lifecycleTransitionExecuted: false
    })),
    (item) => `${item.category}:${item.key}:${item.stageStatus}`
  );
}

function buildLifecycleTransitions(): GovernanceAutonomyLifecycleTransition[] {
  return withDeterministicIds(
    "gov-lifecycle-transition",
    [...BASE_TRANSITION_DEFINITIONS, ...FORBIDDEN_TRANSITION_DEFINITIONS].map((transition) => ({
      ...transition,
      executed: false
    })),
    (item) => `${item.transitionStatus}:${item.fromStage}:${item.toStage}`
  );
}

function buildLifecycleBlockers(
  conclusion: GovernanceAutonomyLifecyclePreview["lifecycleConclusion"]
): GovernanceAutonomyLifecycleBlocker[] {
  const blockers: Array<Omit<GovernanceAutonomyLifecycleBlocker, "id">> = [];
  if (conclusion === "source-missing") {
    blockers.push({ key: "missing-control-plane-preview", reason: "Control plane preview is missing; lifecycle preview cannot be considered ready." });
  }
  if (conclusion === "lifecycle-not-ready") {
    blockers.push({ key: "control-plane-not-ready", reason: "Control plane preview is not ready for future lifecycle review." });
  }
  if (conclusion === "blocked-preview") {
    blockers.push({ key: "blocked-control-plane-preview", reason: "Control plane preview is blocked; lifecycle preview is blocked." });
  }
  return withDeterministicIds("gov-lifecycle-blocker", blockers, (item) => item.key);
}

function buildRollbackPlan(): GovernanceAutonomyRollbackPlan {
  return {
    schemaVersion: 1,
    rollbackAvailable: false,
    rollbackExecuted: false,
    rollbackSteps: withDeterministicIds(
      "gov-lifecycle-rollback",
      ROLLBACK_STEP_DEFINITIONS.map((step) => ({
        ...step,
        required: true
      })),
      (item) => item.key
    ),
    reason: "Rollback planning is documented for future review only; no rollback is available or executed in preview mode."
  };
}

function buildSummary(
  lifecycleStages: GovernanceAutonomyLifecycleStage[],
  lifecycleTransitions: GovernanceAutonomyLifecycleTransition[],
  rollbackPlan: GovernanceAutonomyRollbackPlan,
  conclusion: GovernanceAutonomyLifecyclePreview["lifecycleConclusion"]
): GovernanceAutonomyLifecyclePreview["summary"] {
  return {
    totalLifecycleStages: lifecycleStages.length,
    readyStages: lifecycleStages.filter((stage) => stage.stageStatus === "ready-preview").length,
    blockedStages: lifecycleStages.filter((stage) => stage.stageStatus === "blocked").length,
    futureOnlyStages: lifecycleStages.filter((stage) => stage.stageStatus === "future-only").length,
    totalTransitions: lifecycleTransitions.length,
    blockedTransitions: lifecycleTransitions.filter((transition) =>
      transition.transitionStatus === "blocked" || transition.transitionStatus === "permanently-forbidden"
    ).length,
    rollbackStepCount: rollbackPlan.rollbackSteps.length,
    lifecycleReadyForFutureReview: conclusion === "lifecycle-ready-preview"
  };
}

function warningsFor(conclusion: GovernanceAutonomyLifecyclePreview["lifecycleConclusion"]): string[] {
  const warnings = [
    "Controlled autonomy governance lifecycle preview is advisory only.",
    "No lifecycle behavior was applied.",
    "No lifecycle behavior was enforced.",
    "No lifecycle transition was executed.",
    "No rollback was executed.",
    "No kill switch was activated.",
    "No sandbox was created.",
    "No sandbox was executed.",
    "No autonomy was enabled.",
    "No autonomous actions are allowed.",
    "No governance was enforced.",
    "Runtime behavior did not change.",
    "Repair orchestration did not change."
  ];
  if (conclusion === "source-missing") {
    warnings.unshift("Autonomy control plane source is missing; lifecycle preview is incomplete.");
  }
  if (conclusion === "lifecycle-not-ready") {
    warnings.unshift("Autonomy control plane preview is not ready for governance lifecycle preview.");
  }
  if (conclusion === "lifecycle-ready-preview") {
    warnings.unshift("Controlled autonomy governance lifecycle is ready for future review only.");
  }
  if (conclusion === "blocked-preview") {
    warnings.unshift("Autonomy control plane preview is blocked; lifecycle preview is blocked.");
  }
  return warnings;
}

export function buildGovernanceAutonomyLifecyclePreviewFromControlPlane(
  source: GovernanceAutonomyControlPlanePreview
): GovernanceAutonomyLifecyclePreview {
  const conclusion = conclusionFor(source);
  const lifecycleStages = buildLifecycleStages(conclusion.lifecycleConclusion);
  const lifecycleTransitions = buildLifecycleTransitions();
  const lifecycleBlockers = buildLifecycleBlockers(conclusion.lifecycleConclusion);
  const rollbackPlan = buildRollbackPlan();

  return {
    schemaVersion: 1,
    previewStatus: conclusion.previewStatus,
    sourceControlPlaneStatus: source.previewStatus,
    lifecycleConclusion: conclusion.lifecycleConclusion,
    lifecycleApplied: false,
    lifecycleEnforced: false,
    lifecycleTransitionExecuted: false,
    controlPlaneApplied: false,
    controlPlaneEnforced: false,
    killSwitchActivated: false,
    operatorOverrideApplied: false,
    sandboxCreated: false,
    sandboxExecuted: false,
    observabilityApplied: false,
    riskAccepted: false,
    riskMitigationApplied: false,
    scopeApproved: false,
    scopeApplied: false,
    humanApprovalGranted: false,
    approvalApplied: false,
    designReviewApproved: false,
    runtimeActivationEnabled: false,
    policyActivated: false,
    guardedActivationEnabled: false,
    activationEnforced: false,
    autonomyEnabled: false,
    autonomousActionsAllowed: false,
    autonomyApplied: false,
    autonomyEnforced: false,
    governanceBypassAllowed: false,
    applied: false,
    enforced: false,
    policyRuntimeMode: "preview-only",
    runtimeBehaviorChanged: false,
    governanceDecisionsChanged: false,
    repairOrchestrationChanged: false,
    safePatchEngineOnly: true,
    lifecycleStages,
    lifecycleTransitions,
    lifecycleBlockers,
    rollbackPlan,
    summary: buildSummary(lifecycleStages, lifecycleTransitions, rollbackPlan, conclusion.lifecycleConclusion),
    warnings: warningsFor(conclusion.lifecycleConclusion),
    recommendedNextStage: conclusion.recommendedNextStage
  };
}

export function buildGovernanceAutonomyLifecyclePreview(projectRoot: string): GovernanceAutonomyLifecyclePreview {
  return buildGovernanceAutonomyLifecyclePreviewFromControlPlane(
    buildGovernanceAutonomyControlPlanePreview(projectRoot)
  );
}

export function renderGovernanceAutonomyLifecyclePreviewMarkdown(
  preview: GovernanceAutonomyLifecyclePreview
): string {
  const lines = [
    "# AI Software Factory - Controlled Autonomy Governance Lifecycle Preview",
    "",
    "Preview status:",
    preview.previewStatus,
    "",
    "Source control plane status:",
    preview.sourceControlPlaneStatus,
    "",
    "Lifecycle conclusion:",
    preview.lifecycleConclusion,
    "",
    "Lifecycle applied:",
    String(preview.lifecycleApplied),
    "",
    "Lifecycle enforced:",
    String(preview.lifecycleEnforced),
    "",
    "Lifecycle transition executed:",
    String(preview.lifecycleTransitionExecuted),
    "",
    "Control plane applied:",
    String(preview.controlPlaneApplied),
    "",
    "Kill switch activated:",
    String(preview.killSwitchActivated),
    "",
    "Sandbox created:",
    String(preview.sandboxCreated),
    "",
    "Sandbox executed:",
    String(preview.sandboxExecuted),
    "",
    "Observability applied:",
    String(preview.observabilityApplied),
    "",
    "Risk accepted:",
    String(preview.riskAccepted),
    "",
    "Scope approved:",
    String(preview.scopeApproved),
    "",
    "Human approval granted:",
    String(preview.humanApprovalGranted),
    "",
    "Design review approved:",
    String(preview.designReviewApproved),
    "",
    "Runtime activation enabled:",
    String(preview.runtimeActivationEnabled),
    "",
    "Policy activated:",
    String(preview.policyActivated),
    "",
    "Autonomy enabled:",
    String(preview.autonomyEnabled),
    "",
    "Autonomous actions allowed:",
    String(preview.autonomousActionsAllowed),
    "",
    "Governance bypass allowed:",
    String(preview.governanceBypassAllowed),
    "",
    "Applied:",
    String(preview.applied),
    "",
    "Enforced:",
    String(preview.enforced),
    "",
    "Policy runtime mode:",
    preview.policyRuntimeMode,
    "",
    "Runtime behavior changed:",
    String(preview.runtimeBehaviorChanged),
    "",
    "Governance decisions changed:",
    String(preview.governanceDecisionsChanged),
    "",
    "Repair orchestration changed:",
    String(preview.repairOrchestrationChanged),
    "",
    "Safe Patch Engine only:",
    String(preview.safePatchEngineOnly),
    "",
    "Lifecycle stage count:",
    String(preview.summary.totalLifecycleStages),
    "",
    "Ready stage count:",
    String(preview.summary.readyStages),
    "",
    "Blocked stage count:",
    String(preview.summary.blockedStages),
    "",
    "Future-only stage count:",
    String(preview.summary.futureOnlyStages),
    "",
    "Lifecycle transition count:",
    String(preview.summary.totalTransitions),
    "",
    "Blocked transition count:",
    String(preview.summary.blockedTransitions),
    "",
    "Lifecycle blocker count:",
    String(preview.lifecycleBlockers.length),
    "",
    "Rollback step count:",
    String(preview.summary.rollbackStepCount),
    "",
    "Lifecycle ready for future review:",
    String(preview.summary.lifecycleReadyForFutureReview),
    "",
    "Recommended next stage:",
    preview.recommendedNextStage,
    "",
    "## Lifecycle Stages",
    ""
  ];

  for (const stage of preview.lifecycleStages) {
    lines.push(`- [${stage.category}/${stage.stageStatus}] ${stage.id} ${stage.key} - ${stage.reason}`);
  }

  lines.push("", "## Lifecycle Transitions", "");
  for (const transition of preview.lifecycleTransitions) {
    lines.push(`- [${transition.transitionStatus}] ${transition.id} ${transition.fromStage} -> ${transition.toStage} - ${transition.reason}`);
  }

  lines.push("", "## Lifecycle Blockers", "");
  if (preview.lifecycleBlockers.length === 0) {
    lines.push("- none");
  }
  for (const blocker of preview.lifecycleBlockers) {
    lines.push(`- ${blocker.id} ${blocker.key} - ${blocker.reason}`);
  }

  lines.push("", "## Rollback Plan", "");
  lines.push(`Rollback available: ${String(preview.rollbackPlan.rollbackAvailable)}`);
  lines.push(`Rollback executed: ${String(preview.rollbackPlan.rollbackExecuted)}`);
  lines.push(preview.rollbackPlan.reason);
  for (const step of preview.rollbackPlan.rollbackSteps) {
    lines.push(`- ${step.id} ${step.key} - ${step.reason}`);
  }

  lines.push("", "## Warnings", "");
  for (const warning of preview.warnings) {
    lines.push(`- ${warning}`);
  }

  return `${lines.join("\n")}\n`;
}

export function renderGovernanceAutonomyLifecyclePreviewText(
  preview: GovernanceAutonomyLifecyclePreview
): string {
  return renderGovernanceAutonomyLifecyclePreviewMarkdown(preview);
}

export function writeGovernanceAutonomyLifecyclePreviewArtifacts(
  projectRoot: string,
  preview: GovernanceAutonomyLifecyclePreview
): { jsonPath: string; markdownPath: string } {
  const jsonPath = path.join(projectRoot, ARTIFACT_JSON_PATH);
  const markdownPath = path.join(projectRoot, ARTIFACT_MARKDOWN_PATH);
  fs.ensureDirSync(path.dirname(jsonPath));
  fs.writeFileSync(jsonPath, `${JSON.stringify(preview, null, 2)}\n`, "utf8");
  fs.writeFileSync(markdownPath, renderGovernanceAutonomyLifecyclePreviewMarkdown(preview), "utf8");
  return {
    jsonPath: ARTIFACT_JSON_PATH,
    markdownPath: ARTIFACT_MARKDOWN_PATH
  };
}
