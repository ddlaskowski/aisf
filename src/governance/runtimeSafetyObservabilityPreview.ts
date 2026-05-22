import fs from "fs-extra";
import path from "node:path";

import {
  buildGovernanceRuntimeSafetyEvidencePreview,
  type GovernanceRuntimeSafetyEvidencePreview
} from "./runtimeSafetyEvidencePreview.js";

export type GovernanceRuntimeTelemetrySignal = {
  id: string;
  key: string;
  category:
    | "runtime-governance"
    | "runtime-autonomy"
    | "runtime-policy"
    | "runtime-sandbox"
    | "runtime-safety"
    | "runtime-repair"
    | "runtime-observability";
  severity: "info" | "warning" | "critical";
  reason: string;
  previewOnly: true;
};

export type GovernanceRuntimeAuditEvent = {
  id: string;
  key: string;
  category:
    | "runtime-governance"
    | "runtime-policy"
    | "runtime-sandbox"
    | "runtime-safety"
    | "runtime-rollback";
  immutableAuditRequired: true;
  reason: string;
};

export type GovernanceRuntimeSafetyAlert = {
  id: string;
  key: string;
  severity: "warning" | "high" | "critical";
  requiresHumanReview: true;
  reason: string;
};

export type GovernanceRuntimeOperatorVisibilityRequirement = {
  id: string;
  key: string;
  required: true;
  reason: string;
};

export type GovernanceRuntimeInvariantMonitoringDefinition = {
  id: string;
  key: string;
  invariantPreserved: true;
  reason: string;
};

export type GovernanceRuntimeRollbackVisibilityDefinition = {
  id: string;
  key: string;
  planningOnly: true;
  reason: string;
};

export type GovernanceRuntimeSafetyObservabilityPreview = {
  schemaVersion: 1;
  previewStatus: "not-created" | "created" | "blocked";
  sourceRuntimeSafetyEvidenceStatus: "not-created" | "created" | "blocked";
  runtimeSafetyObservabilityConclusion:
    | "source-missing"
    | "runtime-safety-observability-not-ready"
    | "runtime-safety-observability-ready-preview"
    | "blocked-preview";
  runtimeObservabilityApplied: false;
  runtimeObservabilityEnforced: false;
  runtimeObservabilityActivated: false;
  runtimeSafetyApplied: false;
  runtimeSafetyEnforced: false;
  runtimeSafetyActivated: false;
  runtimeGovernanceEnabled: false;
  runtimeAutonomyEnabled: false;
  runtimeAutonomyActionsAllowed: false;
  runtimePolicyEnforcementEnabled: false;
  runtimeConfigActivationEnabled: false;
  runtimeControlPlaneApplied: false;
  runtimeKillSwitchActivated: false;
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
  runtimeTelemetrySignals: GovernanceRuntimeTelemetrySignal[];
  runtimeAuditEvents: GovernanceRuntimeAuditEvent[];
  runtimeSafetyAlerts: GovernanceRuntimeSafetyAlert[];
  runtimeOperatorVisibilityRequirements: GovernanceRuntimeOperatorVisibilityRequirement[];
  runtimeInvariantMonitoringDefinitions: GovernanceRuntimeInvariantMonitoringDefinition[];
  runtimeRollbackVisibilityDefinitions: GovernanceRuntimeRollbackVisibilityDefinition[];
  summary: {
    totalTelemetrySignals: number;
    totalAuditEvents: number;
    totalSafetyAlerts: number;
    totalOperatorVisibilityRequirements: number;
    totalInvariantMonitoringDefinitions: number;
    totalRollbackVisibilityDefinitions: number;
    runtimeSafetyObservabilityReadyForFutureReview: boolean;
  };
  warnings: string[];
  recommendedNextStage:
    | "continue-runtime-safety-hardening"
    | "prepare-runtime-control-plane-preview"
    | "blocked";
};

const ARTIFACT_JSON_PATH = ".factory/governance/runtime-safety-observability-preview.json";
const ARTIFACT_MARKDOWN_PATH = ".factory/governance/runtime-safety-observability-preview.md";

const TELEMETRY_SIGNAL_DEFINITIONS: Array<Omit<GovernanceRuntimeTelemetrySignal, "id" | "previewOnly">> = [
  { key: "runtime-autonomy-activation-attempt", category: "runtime-autonomy", severity: "critical", reason: "Detect any future attempt to enable runtime autonomy." },
  { key: "runtime-governance-activation-attempt", category: "runtime-governance", severity: "critical", reason: "Detect any future attempt to activate runtime governance." },
  { key: "runtime-observability-rollback-preparation-visibility", category: "runtime-observability", severity: "info", reason: "Model future rollback preparation visibility without executing telemetry." },
  { key: "runtime-policy-enforcement-attempt", category: "runtime-policy", severity: "critical", reason: "Detect any future attempt to enable runtime policy enforcement." },
  { key: "runtime-config-activation-attempt", category: "runtime-policy", severity: "critical", reason: "Detect any future attempt to activate runtime config." },
  { key: "runtime-repair-orchestration-change-attempt", category: "runtime-repair", severity: "critical", reason: "Detect any future attempt to change repair orchestration." },
  { key: "runtime-sandbox-execution-attempt", category: "runtime-sandbox", severity: "critical", reason: "Detect any future attempt to execute a runtime sandbox." },
  { key: "runtime-external-execution-attempt", category: "runtime-safety", severity: "critical", reason: "Detect any future attempt to allow runtime external execution." },
  { key: "runtime-learning-attempt", category: "runtime-safety", severity: "critical", reason: "Detect any future attempt to enable runtime learning." },
  { key: "runtime-ml-vector-db-decisioning-attempt", category: "runtime-safety", severity: "critical", reason: "Detect any future attempt to enable runtime ML/vector DB decisioning." },
  { key: "runtime-multi-agent-coordination-attempt", category: "runtime-safety", severity: "critical", reason: "Detect any future attempt to enable runtime multi-agent coordination." },
  { key: "runtime-plugin-script-execution-attempt", category: "runtime-safety", severity: "critical", reason: "Detect any future attempt to execute runtime plugins or scripts." },
  { key: "runtime-safe-patch-engine-bypass-attempt", category: "runtime-safety", severity: "critical", reason: "Detect any future attempt to bypass Safe Patch Engine." },
  { key: "runtime-mutation-scope-expansion-attempt", category: "runtime-safety", severity: "critical", reason: "Detect any future attempt to expand runtime mutation scope." }
];

const AUDIT_EVENT_DEFINITIONS: Array<Omit<GovernanceRuntimeAuditEvent, "id" | "immutableAuditRequired">> = [
  { key: "runtime-governance-review-transition", category: "runtime-governance", reason: "Future runtime governance review transitions require immutable audit records." },
  { key: "runtime-policy-review-transition", category: "runtime-policy", reason: "Future runtime policy review transitions require immutable audit records." },
  { key: "runtime-rollback-planning-transition", category: "runtime-rollback", reason: "Future runtime rollback planning transitions require immutable audit records." },
  { key: "runtime-sandbox-review-transition", category: "runtime-sandbox", reason: "Future runtime sandbox review transitions require immutable audit records." },
  { key: "runtime-forbidden-capability-confirmation", category: "runtime-safety", reason: "Forbidden runtime capability confirmations require immutable audit records." },
  { key: "runtime-invariant-verification-review", category: "runtime-safety", reason: "Runtime invariant verification reviews require immutable audit records." }
];

const ALERT_DEFINITIONS: Array<Omit<GovernanceRuntimeSafetyAlert, "id" | "requiresHumanReview">> = [
  { key: "runtime-autonomy-unexpectedly-enabled", severity: "critical", reason: "Runtime autonomy must remain disabled." },
  { key: "runtime-config-activation-unexpectedly-enabled", severity: "critical", reason: "Runtime config activation must remain disabled." },
  { key: "runtime-external-execution-detected", severity: "critical", reason: "Runtime external execution must remain blocked." },
  { key: "runtime-governance-unexpectedly-enabled", severity: "critical", reason: "Runtime governance must remain disabled." },
  { key: "runtime-learning-detected", severity: "critical", reason: "Runtime learning must remain disabled." },
  { key: "runtime-ml-vector-db-decisioning-detected", severity: "critical", reason: "Runtime ML/vector DB decisioning must remain disabled." },
  { key: "runtime-multi-agent-coordination-detected", severity: "critical", reason: "Runtime multi-agent coordination must remain disabled." },
  { key: "runtime-mutation-scope-expansion-detected", severity: "critical", reason: "Runtime mutation scope expansion must remain blocked." },
  { key: "runtime-plugin-script-execution-detected", severity: "critical", reason: "Runtime plugin/script execution must remain disabled." },
  { key: "runtime-policy-enforcement-unexpectedly-enabled", severity: "critical", reason: "Runtime policy enforcement must remain disabled." },
  { key: "runtime-repair-orchestration-change-detected", severity: "critical", reason: "Repair orchestration must remain unchanged." },
  { key: "runtime-safe-patch-engine-bypass-detected", severity: "critical", reason: "Safe Patch Engine bypass must remain blocked." }
];

const VISIBILITY_DEFINITIONS: Array<Omit<GovernanceRuntimeOperatorVisibilityRequirement, "id" | "required">> = [
  { key: "runtime-autonomy-transition-visibility", reason: "Operators must have future visibility into runtime autonomy transitions." },
  { key: "runtime-forbidden-capability-check-visibility", reason: "Operators must have future visibility into forbidden runtime capability checks." },
  { key: "runtime-governance-transition-visibility", reason: "Operators must have future visibility into runtime governance transitions." },
  { key: "runtime-invariant-verification-visibility", reason: "Operators must have future visibility into runtime invariant verification." },
  { key: "runtime-policy-transition-visibility", reason: "Operators must have future visibility into runtime policy transitions." },
  { key: "runtime-rollback-transition-visibility", reason: "Operators must have future visibility into runtime rollback transitions." },
  { key: "runtime-sandbox-transition-visibility", reason: "Operators must have future visibility into runtime sandbox transitions." }
];

const MONITORING_DEFINITIONS: Array<Omit<GovernanceRuntimeInvariantMonitoringDefinition, "id" | "invariantPreserved">> = [
  { key: "monitor-no-ml-vector-db-governance-decisioning", reason: "Monitor that runtime ML/vector DB governance decisioning remains disabled." },
  { key: "monitor-no-plugin-script-execution", reason: "Monitor that runtime plugin and script execution remain disabled." },
  { key: "monitor-no-repair-orchestration-changes", reason: "Monitor that repair orchestration remains unchanged." },
  { key: "monitor-no-runtime-autonomy-execution", reason: "Monitor that runtime autonomy execution remains disabled." },
  { key: "monitor-no-runtime-external-execution", reason: "Monitor that runtime external execution remains disabled." },
  { key: "monitor-no-runtime-learning", reason: "Monitor that runtime learning remains disabled." },
  { key: "monitor-no-runtime-mutation-scope-expansion", reason: "Monitor that runtime mutation scope expansion remains blocked." },
  { key: "monitor-no-runtime-policy-enforcement", reason: "Monitor that runtime policy enforcement remains disabled." },
  { key: "monitor-no-uncontrolled-multi-agent-coordination", reason: "Monitor that uncontrolled runtime multi-agent coordination remains disabled." },
  { key: "monitor-safe-patch-engine-exclusivity", reason: "Monitor that Safe Patch Engine remains the only mutation layer." }
];

const ROLLBACK_VISIBILITY_DEFINITIONS: Array<Omit<GovernanceRuntimeRollbackVisibilityDefinition, "id" | "planningOnly">> = [
  { key: "future-audit-preservation-visibility", reason: "Future audit preservation visibility remains planning-only." },
  { key: "future-runtime-autonomy-shutdown-visibility", reason: "Future runtime autonomy shutdown visibility remains planning-only." },
  { key: "future-runtime-governance-shutdown-visibility", reason: "Future runtime governance shutdown visibility remains planning-only." },
  { key: "future-runtime-invariant-reverification-visibility", reason: "Future runtime invariant re-verification visibility remains planning-only." },
  { key: "future-runtime-policy-freeze-visibility", reason: "Future runtime policy freeze visibility remains planning-only." },
  { key: "future-runtime-rollback-verification-visibility", reason: "Future runtime rollback verification visibility remains planning-only." }
];

function withDeterministicIds<T>(prefix: string, items: T[], sortKey: (item: T) => string): Array<T & { id: string }> {
  return [...items]
    .sort((a, b) => sortKey(a).localeCompare(sortKey(b)))
    .map((item, index) => ({ id: `${prefix}-${String(index + 1).padStart(3, "0")}`, ...item }));
}

function conclusionFor(source: GovernanceRuntimeSafetyEvidencePreview): Pick<GovernanceRuntimeSafetyObservabilityPreview, "previewStatus" | "runtimeSafetyObservabilityConclusion" | "recommendedNextStage"> {
  if (source.previewStatus === "not-created") {
    return { previewStatus: "not-created", runtimeSafetyObservabilityConclusion: "source-missing", recommendedNextStage: "continue-runtime-safety-hardening" };
  }
  if (source.previewStatus === "blocked") {
    return { previewStatus: "blocked", runtimeSafetyObservabilityConclusion: "blocked-preview", recommendedNextStage: "blocked" };
  }
  if (source.runtimeSafetyEvidenceConclusion === "runtime-safety-evidence-ready-preview") {
    return { previewStatus: "created", runtimeSafetyObservabilityConclusion: "runtime-safety-observability-ready-preview", recommendedNextStage: "prepare-runtime-control-plane-preview" };
  }
  return { previewStatus: "created", runtimeSafetyObservabilityConclusion: "runtime-safety-observability-not-ready", recommendedNextStage: "continue-runtime-safety-hardening" };
}

function buildTelemetrySignals(): GovernanceRuntimeTelemetrySignal[] {
  return withDeterministicIds("gov-runtime-observability-signal", TELEMETRY_SIGNAL_DEFINITIONS, (item) => `${item.category}:${item.key}:${item.severity}`)
    .map((item) => ({ ...item, previewOnly: true }));
}

function buildAuditEvents(): GovernanceRuntimeAuditEvent[] {
  return withDeterministicIds("gov-runtime-observability-audit", AUDIT_EVENT_DEFINITIONS, (item) => `${item.category}:${item.key}`)
    .map((item) => ({ ...item, immutableAuditRequired: true }));
}

function buildSafetyAlerts(): GovernanceRuntimeSafetyAlert[] {
  return withDeterministicIds("gov-runtime-observability-alert", ALERT_DEFINITIONS, (item) => `${item.severity}:${item.key}`)
    .map((item) => ({ ...item, requiresHumanReview: true }));
}

function buildVisibilityRequirements(): GovernanceRuntimeOperatorVisibilityRequirement[] {
  return withDeterministicIds("gov-runtime-observability-visibility", VISIBILITY_DEFINITIONS, (item) => item.key)
    .map((item) => ({ ...item, required: true }));
}

function buildInvariantMonitoringDefinitions(): GovernanceRuntimeInvariantMonitoringDefinition[] {
  return withDeterministicIds("gov-runtime-observability-monitor", MONITORING_DEFINITIONS, (item) => item.key)
    .map((item) => ({ ...item, invariantPreserved: true }));
}

function buildRollbackVisibilityDefinitions(): GovernanceRuntimeRollbackVisibilityDefinition[] {
  return withDeterministicIds("gov-runtime-observability-rollback", ROLLBACK_VISIBILITY_DEFINITIONS, (item) => item.key)
    .map((item) => ({ ...item, planningOnly: true }));
}

function warningsFor(conclusion: GovernanceRuntimeSafetyObservabilityPreview["runtimeSafetyObservabilityConclusion"]): string[] {
  const warnings = [
    "Runtime safety observability preview is advisory only.",
    "Runtime observability was not applied, enforced, or activated.",
    "Runtime safety was not applied, enforced, or activated.",
    "Runtime governance is not enabled.",
    "Runtime autonomy is not enabled.",
    "Runtime autonomous actions are not allowed.",
    "Runtime policies are not enforced.",
    "Runtime config activation is disabled.",
    "Runtime sandbox execution is not allowed.",
    "Runtime plugin, script, learning, ML, and multi-agent execution remain disabled.",
    "Runtime behavior did not change.",
    "Repair orchestration did not change."
  ];
  if (conclusion === "source-missing") warnings.unshift("Runtime safety evidence source is missing; runtime safety observability preview is incomplete.");
  if (conclusion === "runtime-safety-observability-not-ready") warnings.unshift("Runtime safety evidence preview is not ready for runtime observability review.");
  if (conclusion === "runtime-safety-observability-ready-preview") warnings.unshift("Runtime safety observability is ready for future review only.");
  if (conclusion === "blocked-preview") warnings.unshift("Runtime safety evidence preview is blocked; runtime safety observability preview is blocked.");
  return warnings;
}

export function buildGovernanceRuntimeSafetyObservabilityPreviewFromEvidence(source: GovernanceRuntimeSafetyEvidencePreview): GovernanceRuntimeSafetyObservabilityPreview {
  const conclusion = conclusionFor(source);
  const runtimeTelemetrySignals = buildTelemetrySignals();
  const runtimeAuditEvents = buildAuditEvents();
  const runtimeSafetyAlerts = buildSafetyAlerts();
  const runtimeOperatorVisibilityRequirements = buildVisibilityRequirements();
  const runtimeInvariantMonitoringDefinitions = buildInvariantMonitoringDefinitions();
  const runtimeRollbackVisibilityDefinitions = buildRollbackVisibilityDefinitions();

  return {
    schemaVersion: 1,
    previewStatus: conclusion.previewStatus,
    sourceRuntimeSafetyEvidenceStatus: source.previewStatus,
    runtimeSafetyObservabilityConclusion: conclusion.runtimeSafetyObservabilityConclusion,
    runtimeObservabilityApplied: false,
    runtimeObservabilityEnforced: false,
    runtimeObservabilityActivated: false,
    runtimeSafetyApplied: false,
    runtimeSafetyEnforced: false,
    runtimeSafetyActivated: false,
    runtimeGovernanceEnabled: false,
    runtimeAutonomyEnabled: false,
    runtimeAutonomyActionsAllowed: false,
    runtimePolicyEnforcementEnabled: false,
    runtimeConfigActivationEnabled: false,
    runtimeControlPlaneApplied: false,
    runtimeKillSwitchActivated: false,
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
    runtimeTelemetrySignals,
    runtimeAuditEvents,
    runtimeSafetyAlerts,
    runtimeOperatorVisibilityRequirements,
    runtimeInvariantMonitoringDefinitions,
    runtimeRollbackVisibilityDefinitions,
    summary: {
      totalTelemetrySignals: runtimeTelemetrySignals.length,
      totalAuditEvents: runtimeAuditEvents.length,
      totalSafetyAlerts: runtimeSafetyAlerts.length,
      totalOperatorVisibilityRequirements: runtimeOperatorVisibilityRequirements.length,
      totalInvariantMonitoringDefinitions: runtimeInvariantMonitoringDefinitions.length,
      totalRollbackVisibilityDefinitions: runtimeRollbackVisibilityDefinitions.length,
      runtimeSafetyObservabilityReadyForFutureReview: conclusion.runtimeSafetyObservabilityConclusion === "runtime-safety-observability-ready-preview"
    },
    warnings: warningsFor(conclusion.runtimeSafetyObservabilityConclusion),
    recommendedNextStage: conclusion.recommendedNextStage
  };
}

export function buildGovernanceRuntimeSafetyObservabilityPreview(projectRoot: string): GovernanceRuntimeSafetyObservabilityPreview {
  return buildGovernanceRuntimeSafetyObservabilityPreviewFromEvidence(buildGovernanceRuntimeSafetyEvidencePreview(projectRoot));
}

export function renderGovernanceRuntimeSafetyObservabilityPreviewMarkdown(preview: GovernanceRuntimeSafetyObservabilityPreview): string {
  const lines = [
    "# AI Software Factory - Runtime Safety Observability Preview",
    "",
    "Preview status:", preview.previewStatus,
    "", "Source runtime safety evidence status:", preview.sourceRuntimeSafetyEvidenceStatus,
    "", "Runtime safety observability conclusion:", preview.runtimeSafetyObservabilityConclusion,
    "", "Runtime observability applied:", String(preview.runtimeObservabilityApplied),
    "", "Runtime observability enforced:", String(preview.runtimeObservabilityEnforced),
    "", "Runtime observability activated:", String(preview.runtimeObservabilityActivated),
    "", "Runtime safety applied:", String(preview.runtimeSafetyApplied),
    "", "Runtime safety enforced:", String(preview.runtimeSafetyEnforced),
    "", "Runtime safety activated:", String(preview.runtimeSafetyActivated),
    "", "Runtime governance enabled:", String(preview.runtimeGovernanceEnabled),
    "", "Runtime autonomy enabled:", String(preview.runtimeAutonomyEnabled),
    "", "Runtime autonomy actions allowed:", String(preview.runtimeAutonomyActionsAllowed),
    "", "Runtime policy enforcement enabled:", String(preview.runtimePolicyEnforcementEnabled),
    "", "Runtime config activation enabled:", String(preview.runtimeConfigActivationEnabled),
    "", "Runtime control plane applied:", String(preview.runtimeControlPlaneApplied),
    "", "Runtime kill switch activated:", String(preview.runtimeKillSwitchActivated),
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
    "", "Telemetry signal count:", String(preview.summary.totalTelemetrySignals),
    "", "Audit event count:", String(preview.summary.totalAuditEvents),
    "", "Safety alert count:", String(preview.summary.totalSafetyAlerts),
    "", "Operator visibility requirement count:", String(preview.summary.totalOperatorVisibilityRequirements),
    "", "Invariant monitoring definition count:", String(preview.summary.totalInvariantMonitoringDefinitions),
    "", "Rollback visibility definition count:", String(preview.summary.totalRollbackVisibilityDefinitions),
    "", "Runtime safety observability ready for future review:", String(preview.summary.runtimeSafetyObservabilityReadyForFutureReview),
    "", "Recommended next stage:", preview.recommendedNextStage,
    "", "## Runtime Telemetry Signals", ""
  ];
  for (const item of preview.runtimeTelemetrySignals) lines.push(`- [${item.category}/${item.severity}] ${item.id} ${item.key} - ${item.reason}`);
  lines.push("", "## Runtime Audit Events", "");
  for (const item of preview.runtimeAuditEvents) lines.push(`- [${item.category}] ${item.id} ${item.key} - ${item.reason}`);
  lines.push("", "## Runtime Safety Alerts", "");
  for (const item of preview.runtimeSafetyAlerts) lines.push(`- [${item.severity}] ${item.id} ${item.key} - ${item.reason}`);
  lines.push("", "## Runtime Operator Visibility Requirements", "");
  for (const item of preview.runtimeOperatorVisibilityRequirements) lines.push(`- ${item.id} ${item.key} - ${item.reason}`);
  lines.push("", "## Runtime Invariant Monitoring Definitions", "");
  for (const item of preview.runtimeInvariantMonitoringDefinitions) lines.push(`- ${item.id} ${item.key} - ${item.reason}`);
  lines.push("", "## Runtime Rollback Visibility Definitions", "");
  for (const item of preview.runtimeRollbackVisibilityDefinitions) lines.push(`- ${item.id} ${item.key} - ${item.reason}`);
  lines.push("", "## Warnings", "");
  for (const warning of preview.warnings) lines.push(`- ${warning}`);
  return `${lines.join("\n")}\n`;
}

export function renderGovernanceRuntimeSafetyObservabilityPreviewText(preview: GovernanceRuntimeSafetyObservabilityPreview): string {
  return renderGovernanceRuntimeSafetyObservabilityPreviewMarkdown(preview);
}

export function writeGovernanceRuntimeSafetyObservabilityPreviewArtifacts(projectRoot: string, preview: GovernanceRuntimeSafetyObservabilityPreview): { jsonPath: string; markdownPath: string } {
  const jsonPath = path.join(projectRoot, ARTIFACT_JSON_PATH);
  const markdownPath = path.join(projectRoot, ARTIFACT_MARKDOWN_PATH);
  fs.ensureDirSync(path.dirname(jsonPath));
  fs.writeFileSync(jsonPath, `${JSON.stringify(preview, null, 2)}\n`, "utf8");
  fs.writeFileSync(markdownPath, renderGovernanceRuntimeSafetyObservabilityPreviewMarkdown(preview), "utf8");
  return { jsonPath: ARTIFACT_JSON_PATH, markdownPath: ARTIFACT_MARKDOWN_PATH };
}
