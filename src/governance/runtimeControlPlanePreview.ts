import fs from "fs-extra";
import path from "node:path";

import {
  buildGovernanceRuntimeSafetyObservabilityPreview,
  type GovernanceRuntimeSafetyObservabilityPreview
} from "./runtimeSafetyObservabilityPreview.js";

export type GovernanceRuntimeOperatorControl = {
  id: string;
  key: string;
  category:
    | "runtime-governance"
    | "runtime-autonomy"
    | "runtime-policy"
    | "runtime-sandbox"
    | "runtime-observability"
    | "runtime-repair";
  requiresHumanReview: true;
  reason: string;
};

export type GovernanceRuntimeFreezeControl = {
  id: string;
  key: string;
  freezeType:
    | "runtime-governance"
    | "runtime-autonomy"
    | "runtime-policy"
    | "runtime-sandbox"
    | "runtime-repair";
  activationAllowed: false;
  reason: string;
};

export type GovernanceRuntimeEmergencyStop = {
  id: string;
  key: string;
  severity: "high" | "critical";
  executionAllowed: false;
  reason: string;
};

export type GovernanceRuntimeRollbackControl = {
  id: string;
  key: string;
  planningOnly: true;
  reason: string;
};

export type GovernanceRuntimeOverrideControl = {
  id: string;
  key: string;
  requiresHumanReview: true;
  executionAllowed: false;
  reason: string;
};

export type GovernanceRuntimeKillSwitchCandidate = {
  id: string;
  key: string;
  category:
    | "runtime-governance"
    | "runtime-autonomy"
    | "runtime-policy"
    | "runtime-sandbox"
    | "runtime-repair"
    | "runtime-external-execution";
  activationAllowed: false;
  reason: string;
};

export type GovernanceRuntimeControlPlanePreview = {
  schemaVersion: 1;
  previewStatus: "not-created" | "created" | "blocked";
  sourceRuntimeObservabilityStatus: "not-created" | "created" | "blocked";
  runtimeControlPlaneConclusion:
    | "source-missing"
    | "runtime-control-plane-not-ready"
    | "runtime-control-plane-ready-preview"
    | "blocked-preview";
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
  runtimeOperatorControls: GovernanceRuntimeOperatorControl[];
  runtimeFreezeControls: GovernanceRuntimeFreezeControl[];
  runtimeEmergencyStops: GovernanceRuntimeEmergencyStop[];
  runtimeRollbackControls: GovernanceRuntimeRollbackControl[];
  runtimeOverrideControls: GovernanceRuntimeOverrideControl[];
  runtimeKillSwitchCandidates: GovernanceRuntimeKillSwitchCandidate[];
  summary: {
    totalOperatorControls: number;
    totalFreezeControls: number;
    totalEmergencyStops: number;
    totalRollbackControls: number;
    totalOverrideControls: number;
    totalKillSwitchCandidates: number;
    runtimeControlPlaneReadyForFutureReview: boolean;
  };
  warnings: string[];
  recommendedNextStage:
    | "continue-runtime-safety-hardening"
    | "prepare-runtime-governance-lifecycle-preview"
    | "blocked";
};

const ARTIFACT_JSON_PATH = ".factory/governance/runtime-control-plane-preview.json";
const ARTIFACT_MARKDOWN_PATH = ".factory/governance/runtime-control-plane-preview.md";

const OPERATOR_CONTROL_DEFINITIONS: Array<Omit<GovernanceRuntimeOperatorControl, "id" | "requiresHumanReview">> = [
  { key: "runtime-autonomy-activation-review", category: "runtime-autonomy", reason: "Future runtime autonomy activation requires operator review." },
  { key: "runtime-governance-activation-review", category: "runtime-governance", reason: "Future runtime governance activation requires operator review." },
  { key: "runtime-observability-review", category: "runtime-observability", reason: "Future runtime observability transitions require operator review." },
  { key: "runtime-policy-enforcement-review", category: "runtime-policy", reason: "Future runtime policy enforcement requires operator review." },
  { key: "runtime-repair-orchestration-review", category: "runtime-repair", reason: "Future repair orchestration changes require operator review." },
  { key: "runtime-rollback-review", category: "runtime-repair", reason: "Future runtime rollback planning requires operator review." },
  { key: "runtime-sandbox-review", category: "runtime-sandbox", reason: "Future runtime sandbox transitions require operator review." }
];

const FREEZE_CONTROL_DEFINITIONS: Array<Omit<GovernanceRuntimeFreezeControl, "id" | "activationAllowed">> = [
  { key: "runtime-autonomy-freeze", freezeType: "runtime-autonomy", reason: "Runtime autonomy freeze remains inactive and preview-only." },
  { key: "runtime-governance-freeze", freezeType: "runtime-governance", reason: "Runtime governance freeze remains inactive and preview-only." },
  { key: "runtime-policy-freeze", freezeType: "runtime-policy", reason: "Runtime policy freeze remains inactive and preview-only." },
  { key: "runtime-repair-freeze", freezeType: "runtime-repair", reason: "Runtime repair freeze remains inactive and preview-only." },
  { key: "runtime-sandbox-freeze", freezeType: "runtime-sandbox", reason: "Runtime sandbox freeze remains inactive and preview-only." }
];

const EMERGENCY_STOP_DEFINITIONS: Array<Omit<GovernanceRuntimeEmergencyStop, "id" | "executionAllowed">> = [
  { key: "runtime-autonomy-activation-emergency-stop", severity: "critical", reason: "Unexpected runtime autonomy activation would require a future emergency-stop design." },
  { key: "runtime-external-execution-emergency-stop", severity: "critical", reason: "Runtime external execution detection would require a future emergency-stop design." },
  { key: "runtime-governance-activation-emergency-stop", severity: "critical", reason: "Unexpected runtime governance activation would require a future emergency-stop design." },
  { key: "runtime-learning-emergency-stop", severity: "critical", reason: "Runtime learning detection would require a future emergency-stop design." },
  { key: "runtime-ml-vector-db-decisioning-emergency-stop", severity: "critical", reason: "Runtime ML/vector DB decisioning detection would require a future emergency-stop design." },
  { key: "runtime-mutation-scope-expansion-emergency-stop", severity: "critical", reason: "Runtime mutation scope expansion detection would require a future emergency-stop design." },
  { key: "runtime-plugin-script-execution-emergency-stop", severity: "critical", reason: "Runtime plugin/script execution detection would require a future emergency-stop design." },
  { key: "runtime-policy-enforcement-emergency-stop", severity: "critical", reason: "Unexpected runtime policy enforcement would require a future emergency-stop design." },
  { key: "runtime-repair-orchestration-mutation-emergency-stop", severity: "critical", reason: "Runtime repair orchestration mutation detection would require a future emergency-stop design." },
  { key: "runtime-safe-patch-engine-bypass-emergency-stop", severity: "critical", reason: "Safe Patch Engine bypass detection would require a future emergency-stop design." }
];

const ROLLBACK_CONTROL_DEFINITIONS: Array<Omit<GovernanceRuntimeRollbackControl, "id" | "planningOnly">> = [
  { key: "runtime-autonomy-rollback-planning", reason: "Future runtime autonomy rollback remains planning-only." },
  { key: "runtime-governance-rollback-planning", reason: "Future runtime governance rollback remains planning-only." },
  { key: "runtime-observability-rollback-planning", reason: "Future runtime observability rollback remains planning-only." },
  { key: "runtime-policy-rollback-planning", reason: "Future runtime policy rollback remains planning-only." },
  { key: "runtime-repair-rollback-planning", reason: "Future runtime repair rollback remains planning-only." },
  { key: "runtime-sandbox-rollback-planning", reason: "Future runtime sandbox rollback remains planning-only." }
];

const OVERRIDE_CONTROL_DEFINITIONS: Array<Omit<GovernanceRuntimeOverrideControl, "id" | "requiresHumanReview" | "executionAllowed">> = [
  { key: "runtime-autonomy-override-control", reason: "Future runtime autonomy overrides require human review and remain inactive." },
  { key: "runtime-governance-override-control", reason: "Future runtime governance overrides require human review and remain inactive." },
  { key: "runtime-observability-override-control", reason: "Future runtime observability overrides require human review and remain inactive." },
  { key: "runtime-policy-override-control", reason: "Future runtime policy overrides require human review and remain inactive." },
  { key: "runtime-repair-override-control", reason: "Future runtime repair overrides require human review and remain inactive." },
  { key: "runtime-sandbox-override-control", reason: "Future runtime sandbox overrides require human review and remain inactive." }
];

const KILL_SWITCH_DEFINITIONS: Array<Omit<GovernanceRuntimeKillSwitchCandidate, "id" | "activationAllowed">> = [
  { key: "runtime-autonomy-activation-killswitch", category: "runtime-autonomy", reason: "Future runtime autonomy activation attempts require an inactive kill-switch candidate." },
  { key: "runtime-external-execution-killswitch", category: "runtime-external-execution", reason: "Future runtime external execution attempts require an inactive kill-switch candidate." },
  { key: "runtime-governance-activation-killswitch", category: "runtime-governance", reason: "Future runtime governance activation attempts require an inactive kill-switch candidate." },
  { key: "runtime-learning-killswitch", category: "runtime-external-execution", reason: "Future runtime learning attempts require an inactive kill-switch candidate." },
  { key: "runtime-ml-vector-db-decisioning-killswitch", category: "runtime-external-execution", reason: "Future runtime ML/vector DB decisioning attempts require an inactive kill-switch candidate." },
  { key: "runtime-mutation-scope-expansion-killswitch", category: "runtime-policy", reason: "Future runtime mutation scope expansion attempts require an inactive kill-switch candidate." },
  { key: "runtime-plugin-script-execution-killswitch", category: "runtime-external-execution", reason: "Future runtime plugin/script execution attempts require an inactive kill-switch candidate." },
  { key: "runtime-policy-enforcement-killswitch", category: "runtime-policy", reason: "Future runtime policy enforcement attempts require an inactive kill-switch candidate." },
  { key: "runtime-repair-orchestration-change-killswitch", category: "runtime-repair", reason: "Future runtime repair orchestration change attempts require an inactive kill-switch candidate." },
  { key: "runtime-safe-patch-engine-bypass-killswitch", category: "runtime-policy", reason: "Future Safe Patch Engine bypass attempts require an inactive kill-switch candidate." }
];

function withDeterministicIds<T>(prefix: string, items: T[], sortKey: (item: T) => string): Array<T & { id: string }> {
  return [...items]
    .sort((a, b) => sortKey(a).localeCompare(sortKey(b)))
    .map((item, index) => ({ id: `${prefix}-${String(index + 1).padStart(3, "0")}`, ...item }));
}

function conclusionFor(source: GovernanceRuntimeSafetyObservabilityPreview): Pick<GovernanceRuntimeControlPlanePreview, "previewStatus" | "runtimeControlPlaneConclusion" | "recommendedNextStage"> {
  if (source.previewStatus === "not-created") {
    return { previewStatus: "not-created", runtimeControlPlaneConclusion: "source-missing", recommendedNextStage: "continue-runtime-safety-hardening" };
  }
  if (source.previewStatus === "blocked") {
    return { previewStatus: "blocked", runtimeControlPlaneConclusion: "blocked-preview", recommendedNextStage: "blocked" };
  }
  if (source.runtimeSafetyObservabilityConclusion === "runtime-safety-observability-ready-preview") {
    return { previewStatus: "created", runtimeControlPlaneConclusion: "runtime-control-plane-ready-preview", recommendedNextStage: "prepare-runtime-governance-lifecycle-preview" };
  }
  return { previewStatus: "created", runtimeControlPlaneConclusion: "runtime-control-plane-not-ready", recommendedNextStage: "continue-runtime-safety-hardening" };
}

function buildOperatorControls(): GovernanceRuntimeOperatorControl[] {
  return withDeterministicIds("gov-runtime-control-operator", OPERATOR_CONTROL_DEFINITIONS, (item) => `${item.category}:${item.key}`)
    .map((item) => ({ ...item, requiresHumanReview: true }));
}

function buildFreezeControls(): GovernanceRuntimeFreezeControl[] {
  return withDeterministicIds("gov-runtime-control-freeze", FREEZE_CONTROL_DEFINITIONS, (item) => `${item.freezeType}:${item.key}`)
    .map((item) => ({ ...item, activationAllowed: false }));
}

function buildEmergencyStops(): GovernanceRuntimeEmergencyStop[] {
  return withDeterministicIds("gov-runtime-control-emergency", EMERGENCY_STOP_DEFINITIONS, (item) => `${item.severity}:${item.key}`)
    .map((item) => ({ ...item, executionAllowed: false }));
}

function buildRollbackControls(): GovernanceRuntimeRollbackControl[] {
  return withDeterministicIds("gov-runtime-control-rollback", ROLLBACK_CONTROL_DEFINITIONS, (item) => item.key)
    .map((item) => ({ ...item, planningOnly: true }));
}

function buildOverrideControls(): GovernanceRuntimeOverrideControl[] {
  return withDeterministicIds("gov-runtime-control-override", OVERRIDE_CONTROL_DEFINITIONS, (item) => item.key)
    .map((item) => ({ ...item, requiresHumanReview: true, executionAllowed: false }));
}

function buildKillSwitchCandidates(): GovernanceRuntimeKillSwitchCandidate[] {
  return withDeterministicIds("gov-runtime-control-killswitch", KILL_SWITCH_DEFINITIONS, (item) => `${item.category}:${item.key}`)
    .map((item) => ({ ...item, activationAllowed: false }));
}

function warningsFor(conclusion: GovernanceRuntimeControlPlanePreview["runtimeControlPlaneConclusion"]): string[] {
  const warnings = [
    "Runtime control plane preview is advisory only.",
    "Runtime control plane was not applied, enforced, or activated.",
    "Runtime kill switches were not activated.",
    "Runtime emergency stop was not executed.",
    "Runtime operator overrides were not applied.",
    "Runtime rollback was not executed.",
    "Runtime governance is not enabled.",
    "Runtime autonomy is not enabled.",
    "Runtime autonomous actions are not allowed.",
    "Runtime policies are not enforced.",
    "Runtime sandbox execution is not allowed.",
    "Runtime plugin, script, learning, ML, and multi-agent execution remain disabled.",
    "Runtime behavior did not change.",
    "Repair orchestration did not change."
  ];
  if (conclusion === "source-missing") warnings.unshift("Runtime observability source is missing; runtime control plane preview is incomplete.");
  if (conclusion === "runtime-control-plane-not-ready") warnings.unshift("Runtime observability preview is not ready for runtime control plane review.");
  if (conclusion === "runtime-control-plane-ready-preview") warnings.unshift("Runtime control plane is ready for future review only.");
  if (conclusion === "blocked-preview") warnings.unshift("Runtime observability preview is blocked; runtime control plane preview is blocked.");
  return warnings;
}

export function buildGovernanceRuntimeControlPlanePreviewFromObservability(source: GovernanceRuntimeSafetyObservabilityPreview): GovernanceRuntimeControlPlanePreview {
  const conclusion = conclusionFor(source);
  const runtimeOperatorControls = buildOperatorControls();
  const runtimeFreezeControls = buildFreezeControls();
  const runtimeEmergencyStops = buildEmergencyStops();
  const runtimeRollbackControls = buildRollbackControls();
  const runtimeOverrideControls = buildOverrideControls();
  const runtimeKillSwitchCandidates = buildKillSwitchCandidates();

  return {
    schemaVersion: 1,
    previewStatus: conclusion.previewStatus,
    sourceRuntimeObservabilityStatus: source.previewStatus,
    runtimeControlPlaneConclusion: conclusion.runtimeControlPlaneConclusion,
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
    runtimeOperatorControls,
    runtimeFreezeControls,
    runtimeEmergencyStops,
    runtimeRollbackControls,
    runtimeOverrideControls,
    runtimeKillSwitchCandidates,
    summary: {
      totalOperatorControls: runtimeOperatorControls.length,
      totalFreezeControls: runtimeFreezeControls.length,
      totalEmergencyStops: runtimeEmergencyStops.length,
      totalRollbackControls: runtimeRollbackControls.length,
      totalOverrideControls: runtimeOverrideControls.length,
      totalKillSwitchCandidates: runtimeKillSwitchCandidates.length,
      runtimeControlPlaneReadyForFutureReview: conclusion.runtimeControlPlaneConclusion === "runtime-control-plane-ready-preview"
    },
    warnings: warningsFor(conclusion.runtimeControlPlaneConclusion),
    recommendedNextStage: conclusion.recommendedNextStage
  };
}

export function buildGovernanceRuntimeControlPlanePreview(projectRoot: string): GovernanceRuntimeControlPlanePreview {
  return buildGovernanceRuntimeControlPlanePreviewFromObservability(buildGovernanceRuntimeSafetyObservabilityPreview(projectRoot));
}

export function renderGovernanceRuntimeControlPlanePreviewMarkdown(preview: GovernanceRuntimeControlPlanePreview): string {
  const lines = [
    "# AI Software Factory - Runtime Control Plane Preview",
    "",
    "Preview status:", preview.previewStatus,
    "", "Source runtime observability status:", preview.sourceRuntimeObservabilityStatus,
    "", "Runtime control plane conclusion:", preview.runtimeControlPlaneConclusion,
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
    "", "Operator control count:", String(preview.summary.totalOperatorControls),
    "", "Freeze control count:", String(preview.summary.totalFreezeControls),
    "", "Emergency stop count:", String(preview.summary.totalEmergencyStops),
    "", "Rollback control count:", String(preview.summary.totalRollbackControls),
    "", "Override control count:", String(preview.summary.totalOverrideControls),
    "", "Kill-switch candidate count:", String(preview.summary.totalKillSwitchCandidates),
    "", "Runtime control plane ready for future review:", String(preview.summary.runtimeControlPlaneReadyForFutureReview),
    "", "Recommended next stage:", preview.recommendedNextStage,
    "", "## Runtime Operator Controls", ""
  ];
  for (const item of preview.runtimeOperatorControls) lines.push(`- [${item.category}] ${item.id} ${item.key} - ${item.reason}`);
  lines.push("", "## Runtime Freeze Controls", "");
  for (const item of preview.runtimeFreezeControls) lines.push(`- [${item.freezeType}] ${item.id} ${item.key} - ${item.reason}`);
  lines.push("", "## Runtime Emergency Stops", "");
  for (const item of preview.runtimeEmergencyStops) lines.push(`- [${item.severity}] ${item.id} ${item.key} - ${item.reason}`);
  lines.push("", "## Runtime Rollback Controls", "");
  for (const item of preview.runtimeRollbackControls) lines.push(`- ${item.id} ${item.key} - ${item.reason}`);
  lines.push("", "## Runtime Override Controls", "");
  for (const item of preview.runtimeOverrideControls) lines.push(`- ${item.id} ${item.key} - ${item.reason}`);
  lines.push("", "## Runtime Kill-Switch Candidates", "");
  for (const item of preview.runtimeKillSwitchCandidates) lines.push(`- [${item.category}] ${item.id} ${item.key} - ${item.reason}`);
  lines.push("", "## Warnings", "");
  for (const warning of preview.warnings) lines.push(`- ${warning}`);
  return `${lines.join("\n")}\n`;
}

export function renderGovernanceRuntimeControlPlanePreviewText(preview: GovernanceRuntimeControlPlanePreview): string {
  return renderGovernanceRuntimeControlPlanePreviewMarkdown(preview);
}

export function writeGovernanceRuntimeControlPlanePreviewArtifacts(projectRoot: string, preview: GovernanceRuntimeControlPlanePreview): { jsonPath: string; markdownPath: string } {
  const jsonPath = path.join(projectRoot, ARTIFACT_JSON_PATH);
  const markdownPath = path.join(projectRoot, ARTIFACT_MARKDOWN_PATH);
  fs.ensureDirSync(path.dirname(jsonPath));
  fs.writeFileSync(jsonPath, `${JSON.stringify(preview, null, 2)}\n`, "utf8");
  fs.writeFileSync(markdownPath, renderGovernanceRuntimeControlPlanePreviewMarkdown(preview), "utf8");
  return { jsonPath: ARTIFACT_JSON_PATH, markdownPath: ARTIFACT_MARKDOWN_PATH };
}
