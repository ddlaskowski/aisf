import fs from "fs-extra";
import path from "node:path";

import {
  buildGovernanceAutonomyObservabilityPreview,
  type GovernanceAutonomyObservabilityPreview
} from "./autonomyObservabilityPreview.js";

export type GovernanceAutonomyOperatorControl = {
  id: string;
  key: string;
  category:
    | "approval"
    | "sandbox"
    | "scope"
    | "policy"
    | "runtime-activation"
    | "repair"
    | "risk"
    | "observability";
  reason: string;
  requiresHumanReview: true;
};

export type GovernanceAutonomyKillSwitchCandidate = {
  id: string;
  key: string;
  category:
    | "autonomy"
    | "sandbox"
    | "policy"
    | "runtime"
    | "repair"
    | "governance"
    | "external-execution";
  severity: "warning" | "high" | "critical";
  reason: string;
  activationAllowed: false;
};

export type GovernanceAutonomyApprovalControl = {
  id: string;
  key: string;
  required: true;
  reason: string;
};

export type GovernanceAutonomySandboxControl = {
  id: string;
  key: string;
  required: true;
  reason: string;
};

export type GovernanceAutonomyScopeControl = {
  id: string;
  key: string;
  required: true;
  reason: string;
};

export type GovernanceAutonomyObservabilityControl = {
  id: string;
  key: string;
  required: true;
  reason: string;
};

export type GovernanceAutonomyMissingControlCoverage = {
  id: string;
  key: string;
  reason: string;
};

export type GovernanceAutonomyControlPlanePreview = {
  schemaVersion: 1;
  previewStatus: "not-created" | "created" | "blocked";
  sourceObservabilityStatus: "not-created" | "created" | "blocked";
  controlPlaneConclusion:
    | "source-missing"
    | "control-plane-not-ready"
    | "control-plane-ready-preview"
    | "blocked-preview";
  controlPlaneApplied: false;
  controlPlaneEnforced: false;
  killSwitchActivated: false;
  operatorOverrideApplied: false;
  sandboxControlApplied: false;
  scopeControlApplied: false;
  observabilityControlApplied: false;
  observabilityApplied: false;
  observabilityEnforced: false;
  sandboxCreated: false;
  sandboxExecuted: false;
  autonomyEnabled: false;
  autonomousActionsAllowed: false;
  autonomyApplied: false;
  autonomyEnforced: false;
  runtimeActivationEnabled: false;
  policyActivated: false;
  guardedActivationEnabled: false;
  activationEnforced: false;
  governanceBypassAllowed: false;
  applied: false;
  enforced: false;
  policyRuntimeMode: "preview-only";
  runtimeBehaviorChanged: false;
  governanceDecisionsChanged: false;
  repairOrchestrationChanged: false;
  safePatchEngineOnly: true;
  operatorControls: GovernanceAutonomyOperatorControl[];
  killSwitchCandidates: GovernanceAutonomyKillSwitchCandidate[];
  approvalControls: GovernanceAutonomyApprovalControl[];
  sandboxControls: GovernanceAutonomySandboxControl[];
  scopeControls: GovernanceAutonomyScopeControl[];
  observabilityControls: GovernanceAutonomyObservabilityControl[];
  missingControlCoverage: GovernanceAutonomyMissingControlCoverage[];
  summary: {
    totalOperatorControls: number;
    totalKillSwitchCandidates: number;
    totalApprovalControls: number;
    totalSandboxControls: number;
    totalScopeControls: number;
    totalObservabilityControls: number;
    totalMissingControlCoverage: number;
    controlPlaneReadyForFutureReview: boolean;
  };
  warnings: string[];
  recommendedNextStage:
    | "continue-governance-hardening"
    | "prepare-autonomy-governance-lifecycle-preview"
    | "blocked";
};

const ARTIFACT_JSON_PATH = ".factory/governance/autonomy-control-plane-preview.json";
const ARTIFACT_MARKDOWN_PATH = ".factory/governance/autonomy-control-plane-preview.md";

const OPERATOR_CONTROL_DEFINITIONS: Array<Omit<GovernanceAutonomyOperatorControl, "id" | "requiresHumanReview">> = [
  { key: "future-autonomy-approval-transitions", category: "approval", reason: "Future autonomy approval transitions require operator control and human review." },
  { key: "future-exception-approval-transitions", category: "approval", reason: "Future exception approval transitions require operator control and human review." },
  { key: "future-governance-enforcement-transitions", category: "risk", reason: "Future governance enforcement transitions require operator control and human review." },
  { key: "future-policy-activation-transitions", category: "policy", reason: "Future policy activation transitions require operator control and human review." },
  { key: "future-repair-orchestration-changes", category: "repair", reason: "Future repair orchestration changes require operator control and human review." },
  { key: "future-runtime-activation-transitions", category: "runtime-activation", reason: "Future runtime activation transitions require operator control and human review." },
  { key: "future-sandbox-lifecycle-transitions", category: "sandbox", reason: "Future sandbox lifecycle transitions require operator control and human review." },
  { key: "future-scope-boundary-changes", category: "scope", reason: "Future scope boundary changes require operator control and human review." }
];

const KILL_SWITCH_DEFINITIONS: Array<Omit<GovernanceAutonomyKillSwitchCandidate, "id" | "activationAllowed">> = [
  { key: "autonomous-action-execution-detection", category: "autonomy", severity: "critical", reason: "Autonomous action execution would require a future kill-switch candidate, but activation is not allowed here." },
  { key: "autonomy-enablement-detection", category: "autonomy", severity: "critical", reason: "Autonomy enablement would require a future kill-switch candidate, but activation is not allowed here." },
  { key: "external-execution-detection", category: "external-execution", severity: "critical", reason: "External execution exposure would require a future kill-switch candidate, but activation is not allowed here." },
  { key: "governance-bypass-detection", category: "governance", severity: "critical", reason: "Governance bypass exposure would require a future kill-switch candidate, but activation is not allowed here." },
  { key: "mutation-scope-expansion-detection", category: "governance", severity: "critical", reason: "Mutation scope expansion would require a future kill-switch candidate, but activation is not allowed here." },
  { key: "plugin-script-execution-detection", category: "external-execution", severity: "critical", reason: "Plugin or script execution exposure would require a future kill-switch candidate, but activation is not allowed here." },
  { key: "policy-enforcement-activation-detection", category: "policy", severity: "critical", reason: "Policy enforcement activation would require a future kill-switch candidate, but activation is not allowed here." },
  { key: "repair-orchestration-change-detection", category: "repair", severity: "high", reason: "Repair orchestration changes would require a future kill-switch candidate, but activation is not allowed here." },
  { key: "runtime-activation-detection", category: "runtime", severity: "critical", reason: "Runtime activation would require a future kill-switch candidate, but activation is not allowed here." },
  { key: "runtime-learning-detection", category: "external-execution", severity: "critical", reason: "Runtime learning exposure would require a future kill-switch candidate, but activation is not allowed here." },
  { key: "safe-patch-engine-bypass-detection", category: "governance", severity: "critical", reason: "Safe Patch Engine bypass would require a future kill-switch candidate, but activation is not allowed here." }
];

const APPROVAL_CONTROL_DEFINITIONS: Array<Omit<GovernanceAutonomyApprovalControl, "id" | "required">> = [
  { key: "future-autonomy-enablement", reason: "Any future autonomy enablement requires approval control." },
  { key: "future-ci-build-blocking", reason: "Any future CI/build blocking requires approval control." },
  { key: "future-exception-approval", reason: "Any future exception approval requires approval control." },
  { key: "future-github-publishing", reason: "Any future GitHub publishing requires approval control." },
  { key: "future-mutation-boundary-changes", reason: "Any future mutation-boundary change requires approval control." },
  { key: "future-policy-enforcement", reason: "Any future policy enforcement requires approval control." },
  { key: "future-runtime-activation", reason: "Any future runtime activation requires approval control." },
  { key: "future-sandbox-execution", reason: "Any future sandbox execution requires approval control." }
];

const SANDBOX_CONTROL_DEFINITIONS: Array<Omit<GovernanceAutonomySandboxControl, "id" | "required">> = [
  { key: "sandbox-execution-denial", reason: "Sandbox execution must remain denied in preview-only control plane modeling." },
  { key: "sandbox-isolation", reason: "Future sandbox isolation requires explicit control definitions." },
  { key: "sandbox-preview-only-guarantees", reason: "Future sandbox behavior must remain preview-only until separately approved." },
  { key: "sandbox-read-only-guarantees", reason: "Future sandbox review must preserve read-only guarantees." },
  { key: "sandbox-rollback-requirements", reason: "Future sandbox planning requires rollback control definitions." },
  { key: "sandbox-safe-patch-engine-restrictions", reason: "Future sandbox mutation boundaries must preserve Safe Patch Engine restrictions." }
];

const SCOPE_CONTROL_DEFINITIONS: Array<Omit<GovernanceAutonomyScopeControl, "id" | "required">> = [
  { key: "mutation-boundary-preservation", reason: "Future scope controls must preserve mutation boundaries." },
  { key: "no-external-governance-execution", reason: "Future scope controls must block external governance execution." },
  { key: "no-plugin-execution", reason: "Future scope controls must block plugin execution." },
  { key: "no-runtime-learning", reason: "Future scope controls must block runtime learning." },
  { key: "no-script-evaluation", reason: "Future scope controls must block script evaluation." },
  { key: "no-uncontrolled-multi-agent-orchestration", reason: "Future scope controls must block uncontrolled multi-agent orchestration." },
  { key: "safe-patch-engine-exclusivity", reason: "Future scope controls must preserve Safe Patch Engine exclusivity." }
];

const OBSERVABILITY_CONTROL_DEFINITIONS: Array<Omit<GovernanceAutonomyObservabilityControl, "id" | "required">> = [
  { key: "approval-transition-visibility", reason: "Future approval transitions require operator visibility controls." },
  { key: "audit-trail-visibility", reason: "Future audit trail visibility requires explicit observability controls." },
  { key: "emergency-stop-visibility", reason: "Future emergency-stop workflows require operator visibility controls." },
  { key: "governance-bypass-visibility", reason: "Future governance bypass signals require operator visibility controls." },
  { key: "policy-enforcement-visibility", reason: "Future policy enforcement transitions require operator visibility controls." },
  { key: "repair-orchestration-visibility", reason: "Future repair orchestration changes require operator visibility controls." },
  { key: "runtime-activation-visibility", reason: "Future runtime activation transitions require operator visibility controls." },
  { key: "sandbox-transition-visibility", reason: "Future sandbox transitions require operator visibility controls." }
];

const MISSING_CONTROL_COVERAGE_DEFINITIONS: Array<Omit<GovernanceAutonomyMissingControlCoverage, "id">> = [
  { key: "missing-emergency-stop-governance-workflow", reason: "Future emergency-stop governance workflow has not been defined." },
  { key: "missing-future-autonomy-shutdown-control", reason: "Future autonomy shutdown control has not been defined." },
  { key: "missing-future-operator-escalation-flow", reason: "Future operator escalation flow has not been defined." },
  { key: "missing-future-policy-enforcement-freeze-control", reason: "Future policy enforcement freeze control has not been defined." },
  { key: "missing-future-repair-rollback-coordination", reason: "Future repair rollback coordination has not been defined." },
  { key: "missing-future-rollback-governance-control", reason: "Future rollback governance control has not been defined." },
  { key: "missing-future-runtime-activation-freeze-control", reason: "Future runtime activation freeze control has not been defined." }
];

function withDeterministicIds<T extends { key: string; category?: string; severity?: string }>(
  prefix: string,
  items: T[],
  sortKey: (item: T) => string = (item) => `${item.category ?? ""}:${item.key}:${item.severity ?? ""}`
): Array<T & { id: string }> {
  return [...items]
    .sort((a, b) => sortKey(a).localeCompare(sortKey(b)))
    .map((item, index) => ({
      id: `${prefix}-${String(index + 1).padStart(3, "0")}`,
      ...item
    }));
}

function conclusionFor(source: GovernanceAutonomyObservabilityPreview): Pick<
  GovernanceAutonomyControlPlanePreview,
  "previewStatus" | "controlPlaneConclusion" | "recommendedNextStage"
> {
  if (source.previewStatus === "not-created") {
    return {
      previewStatus: "not-created",
      controlPlaneConclusion: "source-missing",
      recommendedNextStage: "continue-governance-hardening"
    };
  }
  if (source.previewStatus === "blocked") {
    return {
      previewStatus: "blocked",
      controlPlaneConclusion: "blocked-preview",
      recommendedNextStage: "blocked"
    };
  }
  if (source.observabilityConclusion === "observability-ready-preview") {
    return {
      previewStatus: "created",
      controlPlaneConclusion: "control-plane-ready-preview",
      recommendedNextStage: "prepare-autonomy-governance-lifecycle-preview"
    };
  }
  return {
    previewStatus: "created",
    controlPlaneConclusion: "control-plane-not-ready",
    recommendedNextStage: "continue-governance-hardening"
  };
}

function buildOperatorControls(): GovernanceAutonomyOperatorControl[] {
  return withDeterministicIds("gov-control-plane-operator", OPERATOR_CONTROL_DEFINITIONS)
    .map((item) => ({ ...item, requiresHumanReview: true }));
}

function buildKillSwitchCandidates(): GovernanceAutonomyKillSwitchCandidate[] {
  return withDeterministicIds("gov-control-plane-killswitch", KILL_SWITCH_DEFINITIONS)
    .map((item) => ({ ...item, activationAllowed: false }));
}

function buildApprovalControls(): GovernanceAutonomyApprovalControl[] {
  return withDeterministicIds("gov-control-plane-approval", APPROVAL_CONTROL_DEFINITIONS, (item) => item.key)
    .map((item) => ({ ...item, required: true }));
}

function buildSandboxControls(): GovernanceAutonomySandboxControl[] {
  return withDeterministicIds("gov-control-plane-sandbox", SANDBOX_CONTROL_DEFINITIONS, (item) => item.key)
    .map((item) => ({ ...item, required: true }));
}

function buildScopeControls(): GovernanceAutonomyScopeControl[] {
  return withDeterministicIds("gov-control-plane-scope", SCOPE_CONTROL_DEFINITIONS, (item) => item.key)
    .map((item) => ({ ...item, required: true }));
}

function buildObservabilityControls(): GovernanceAutonomyObservabilityControl[] {
  return withDeterministicIds("gov-control-plane-observability", OBSERVABILITY_CONTROL_DEFINITIONS, (item) => item.key)
    .map((item) => ({ ...item, required: true }));
}

function buildMissingControlCoverage(): GovernanceAutonomyMissingControlCoverage[] {
  return withDeterministicIds("gov-control-plane-missing", MISSING_CONTROL_COVERAGE_DEFINITIONS, (item) => item.key);
}

function buildSummary(
  operatorControls: GovernanceAutonomyOperatorControl[],
  killSwitchCandidates: GovernanceAutonomyKillSwitchCandidate[],
  approvalControls: GovernanceAutonomyApprovalControl[],
  sandboxControls: GovernanceAutonomySandboxControl[],
  scopeControls: GovernanceAutonomyScopeControl[],
  observabilityControls: GovernanceAutonomyObservabilityControl[],
  missingControlCoverage: GovernanceAutonomyMissingControlCoverage[],
  conclusion: GovernanceAutonomyControlPlanePreview["controlPlaneConclusion"]
): GovernanceAutonomyControlPlanePreview["summary"] {
  return {
    totalOperatorControls: operatorControls.length,
    totalKillSwitchCandidates: killSwitchCandidates.length,
    totalApprovalControls: approvalControls.length,
    totalSandboxControls: sandboxControls.length,
    totalScopeControls: scopeControls.length,
    totalObservabilityControls: observabilityControls.length,
    totalMissingControlCoverage: missingControlCoverage.length,
    controlPlaneReadyForFutureReview: conclusion === "control-plane-ready-preview"
  };
}

function warningsFor(conclusion: GovernanceAutonomyControlPlanePreview["controlPlaneConclusion"]): string[] {
  const warnings = [
    "Controlled autonomy control plane preview is advisory only.",
    "No control plane behavior was applied.",
    "No control plane behavior was enforced.",
    "No kill switch was activated.",
    "No operator override was applied.",
    "No sandbox control was applied.",
    "No scope control was applied.",
    "No observability control was applied.",
    "No autonomy was enabled.",
    "No autonomous actions are allowed.",
    "No governance was enforced.",
    "Runtime behavior did not change.",
    "Repair orchestration did not change."
  ];
  if (conclusion === "source-missing") {
    warnings.unshift("Autonomy observability source is missing; control plane preview is incomplete.");
  }
  if (conclusion === "control-plane-not-ready") {
    warnings.unshift("Autonomy observability preview is not ready for control plane preview.");
  }
  if (conclusion === "control-plane-ready-preview") {
    warnings.unshift("Controlled autonomy control plane is ready for future review only.");
  }
  if (conclusion === "blocked-preview") {
    warnings.unshift("Autonomy observability preview is blocked; control plane preview is blocked.");
  }
  return warnings;
}

export function buildGovernanceAutonomyControlPlanePreviewFromObservability(
  source: GovernanceAutonomyObservabilityPreview
): GovernanceAutonomyControlPlanePreview {
  const conclusion = conclusionFor(source);
  const operatorControls = buildOperatorControls();
  const killSwitchCandidates = buildKillSwitchCandidates();
  const approvalControls = buildApprovalControls();
  const sandboxControls = buildSandboxControls();
  const scopeControls = buildScopeControls();
  const observabilityControls = buildObservabilityControls();
  const missingControlCoverage = buildMissingControlCoverage();

  return {
    schemaVersion: 1,
    previewStatus: conclusion.previewStatus,
    sourceObservabilityStatus: source.previewStatus,
    controlPlaneConclusion: conclusion.controlPlaneConclusion,
    controlPlaneApplied: false,
    controlPlaneEnforced: false,
    killSwitchActivated: false,
    operatorOverrideApplied: false,
    sandboxControlApplied: false,
    scopeControlApplied: false,
    observabilityControlApplied: false,
    observabilityApplied: false,
    observabilityEnforced: false,
    sandboxCreated: false,
    sandboxExecuted: false,
    autonomyEnabled: false,
    autonomousActionsAllowed: false,
    autonomyApplied: false,
    autonomyEnforced: false,
    runtimeActivationEnabled: false,
    policyActivated: false,
    guardedActivationEnabled: false,
    activationEnforced: false,
    governanceBypassAllowed: false,
    applied: false,
    enforced: false,
    policyRuntimeMode: "preview-only",
    runtimeBehaviorChanged: false,
    governanceDecisionsChanged: false,
    repairOrchestrationChanged: false,
    safePatchEngineOnly: true,
    operatorControls,
    killSwitchCandidates,
    approvalControls,
    sandboxControls,
    scopeControls,
    observabilityControls,
    missingControlCoverage,
    summary: buildSummary(
      operatorControls,
      killSwitchCandidates,
      approvalControls,
      sandboxControls,
      scopeControls,
      observabilityControls,
      missingControlCoverage,
      conclusion.controlPlaneConclusion
    ),
    warnings: warningsFor(conclusion.controlPlaneConclusion),
    recommendedNextStage: conclusion.recommendedNextStage
  };
}

export function buildGovernanceAutonomyControlPlanePreview(projectRoot: string): GovernanceAutonomyControlPlanePreview {
  return buildGovernanceAutonomyControlPlanePreviewFromObservability(
    buildGovernanceAutonomyObservabilityPreview(projectRoot)
  );
}

export function renderGovernanceAutonomyControlPlanePreviewMarkdown(
  preview: GovernanceAutonomyControlPlanePreview
): string {
  const lines = [
    "# AI Software Factory - Controlled Autonomy Control Plane Preview",
    "",
    "Preview status:",
    preview.previewStatus,
    "",
    "Source observability status:",
    preview.sourceObservabilityStatus,
    "",
    "Control plane conclusion:",
    preview.controlPlaneConclusion,
    "",
    "Control plane applied:",
    String(preview.controlPlaneApplied),
    "",
    "Control plane enforced:",
    String(preview.controlPlaneEnforced),
    "",
    "Kill switch activated:",
    String(preview.killSwitchActivated),
    "",
    "Operator override applied:",
    String(preview.operatorOverrideApplied),
    "",
    "Sandbox control applied:",
    String(preview.sandboxControlApplied),
    "",
    "Scope control applied:",
    String(preview.scopeControlApplied),
    "",
    "Observability control applied:",
    String(preview.observabilityControlApplied),
    "",
    "Autonomy enabled:",
    String(preview.autonomyEnabled),
    "",
    "Autonomous actions allowed:",
    String(preview.autonomousActionsAllowed),
    "",
    "Runtime activation enabled:",
    String(preview.runtimeActivationEnabled),
    "",
    "Policy activated:",
    String(preview.policyActivated),
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
    "Operator control count:",
    String(preview.summary.totalOperatorControls),
    "",
    "Kill switch candidate count:",
    String(preview.summary.totalKillSwitchCandidates),
    "",
    "Approval control count:",
    String(preview.summary.totalApprovalControls),
    "",
    "Sandbox control count:",
    String(preview.summary.totalSandboxControls),
    "",
    "Scope control count:",
    String(preview.summary.totalScopeControls),
    "",
    "Observability control count:",
    String(preview.summary.totalObservabilityControls),
    "",
    "Missing control coverage count:",
    String(preview.summary.totalMissingControlCoverage),
    "",
    "Control plane ready for future review:",
    String(preview.summary.controlPlaneReadyForFutureReview),
    "",
    "Recommended next stage:",
    preview.recommendedNextStage,
    "",
    "## Operator Controls",
    ""
  ];

  for (const control of preview.operatorControls) {
    lines.push(`- [${control.category}] ${control.id} ${control.key} - ${control.reason}`);
  }

  lines.push("", "## Kill Switch Candidates", "");
  for (const candidate of preview.killSwitchCandidates) {
    lines.push(`- [${candidate.category}/${candidate.severity}] ${candidate.id} ${candidate.key} - ${candidate.reason}`);
  }

  lines.push("", "## Approval Controls", "");
  for (const control of preview.approvalControls) {
    lines.push(`- ${control.id} ${control.key} - ${control.reason}`);
  }

  lines.push("", "## Sandbox Controls", "");
  for (const control of preview.sandboxControls) {
    lines.push(`- ${control.id} ${control.key} - ${control.reason}`);
  }

  lines.push("", "## Scope Controls", "");
  for (const control of preview.scopeControls) {
    lines.push(`- ${control.id} ${control.key} - ${control.reason}`);
  }

  lines.push("", "## Observability Controls", "");
  for (const control of preview.observabilityControls) {
    lines.push(`- ${control.id} ${control.key} - ${control.reason}`);
  }

  lines.push("", "## Missing Control Coverage", "");
  for (const coverage of preview.missingControlCoverage) {
    lines.push(`- ${coverage.id} ${coverage.key} - ${coverage.reason}`);
  }

  lines.push("", "## Warnings", "");
  for (const warning of preview.warnings) {
    lines.push(`- ${warning}`);
  }

  return `${lines.join("\n")}\n`;
}

export function renderGovernanceAutonomyControlPlanePreviewText(
  preview: GovernanceAutonomyControlPlanePreview
): string {
  return renderGovernanceAutonomyControlPlanePreviewMarkdown(preview);
}

export function writeGovernanceAutonomyControlPlanePreviewArtifacts(
  projectRoot: string,
  preview: GovernanceAutonomyControlPlanePreview
): { jsonPath: string; markdownPath: string } {
  const jsonPath = path.join(projectRoot, ARTIFACT_JSON_PATH);
  const markdownPath = path.join(projectRoot, ARTIFACT_MARKDOWN_PATH);
  fs.ensureDirSync(path.dirname(jsonPath));
  fs.writeFileSync(jsonPath, `${JSON.stringify(preview, null, 2)}\n`, "utf8");
  fs.writeFileSync(markdownPath, renderGovernanceAutonomyControlPlanePreviewMarkdown(preview), "utf8");
  return {
    jsonPath: ARTIFACT_JSON_PATH,
    markdownPath: ARTIFACT_MARKDOWN_PATH
  };
}
