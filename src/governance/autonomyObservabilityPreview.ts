import fs from "fs-extra";
import path from "node:path";

import {
  buildGovernanceAutonomySandboxEvidencePreview,
  type GovernanceAutonomySandboxEvidencePreview
} from "./autonomySandboxEvidencePreview.js";

export type GovernanceAutonomyTelemetrySignal = {
  id: string;
  key: string;
  category:
    | "governance"
    | "autonomy"
    | "sandbox"
    | "approval"
    | "risk"
    | "policy"
    | "repair"
    | "mutation-boundary"
    | "audit"
    | "safety-invariant";
  severity: "info" | "warning" | "critical";
  reason: string;
  previewOnly: true;
};

export type GovernanceAutonomyAuditEvent = {
  id: string;
  key: string;
  category:
    | "approval"
    | "sandbox"
    | "governance"
    | "policy"
    | "risk"
    | "scope"
    | "repair"
    | "safety";
  reason: string;
  immutableAuditRequired: true;
};

export type GovernanceAutonomyAlertCandidate = {
  id: string;
  key: string;
  severity: "warning" | "high" | "critical";
  reason: string;
  requiresHumanReview: true;
};

export type GovernanceAutonomyOperatorVisibilityRequirement = {
  id: string;
  key: string;
  required: true;
  reason: string;
};

export type GovernanceAutonomyMissingCoverage = {
  id: string;
  key: string;
  reason: string;
};

export type GovernanceAutonomyObservabilityPreview = {
  schemaVersion: 1;
  previewStatus: "not-created" | "created" | "blocked";
  sourceSandboxEvidenceStatus: "not-created" | "created" | "blocked";
  observabilityConclusion:
    | "source-missing"
    | "observability-not-ready"
    | "observability-ready-preview"
    | "blocked-preview";
  observabilityApplied: false;
  observabilityEnforced: false;
  sandboxCreated: false;
  sandboxExecuted: false;
  sandboxPlanApplied: false;
  sandboxEnforced: false;
  evidenceApplied: false;
  evidenceEnforced: false;
  riskAccepted: false;
  riskMitigationApplied: false;
  riskRegisterEnforced: false;
  scopeApproved: false;
  scopeApplied: false;
  scopeEnforced: false;
  autonomyEnabled: false;
  autonomousActionsAllowed: false;
  autonomyApplied: false;
  autonomyEnforced: false;
  humanApprovalGranted: false;
  approvalApplied: false;
  approvalWorkflowEnforced: false;
  designReviewApproved: false;
  designReviewApplied: false;
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
  telemetrySignals: GovernanceAutonomyTelemetrySignal[];
  auditEvents: GovernanceAutonomyAuditEvent[];
  alertCandidates: GovernanceAutonomyAlertCandidate[];
  operatorVisibilityRequirements: GovernanceAutonomyOperatorVisibilityRequirement[];
  missingObservabilityCoverage: GovernanceAutonomyMissingCoverage[];
  summary: {
    totalTelemetrySignals: number;
    totalAuditEvents: number;
    totalAlertCandidates: number;
    totalOperatorVisibilityRequirements: number;
    totalMissingCoverage: number;
    observabilityReadyForFutureReview: boolean;
  };
  warnings: string[];
  recommendedNextStage:
    | "continue-governance-hardening"
    | "prepare-autonomy-control-plane-preview"
    | "blocked";
};

const ARTIFACT_JSON_PATH = ".factory/governance/autonomy-observability-preview.json";
const ARTIFACT_MARKDOWN_PATH = ".factory/governance/autonomy-observability-preview.md";

const TELEMETRY_SIGNAL_DEFINITIONS: Array<Omit<GovernanceAutonomyTelemetrySignal, "id" | "previewOnly">> = [
  { key: "approval-workflow-transition", category: "approval", severity: "info", reason: "Future approval workflow transitions require deterministic telemetry definitions." },
  { key: "audit-trail-integrity", category: "audit", severity: "warning", reason: "Audit trail integrity requires future visibility before any autonomy review." },
  { key: "autonomy-enablement-attempt", category: "autonomy", severity: "critical", reason: "Any future autonomy enablement attempt must be visible and review-gated." },
  { key: "forbidden-capability-exposure", category: "safety-invariant", severity: "critical", reason: "Forbidden capability exposure must be visible without enabling execution." },
  { key: "governance-bypass-attempt", category: "governance", severity: "critical", reason: "Governance bypass attempts must be visible and remain blocked." },
  { key: "mutation-boundary-expansion-attempt", category: "mutation-boundary", severity: "critical", reason: "Mutation boundary expansion attempts must be visible and blocked." },
  { key: "observability-invariant-violation", category: "safety-invariant", severity: "critical", reason: "Observability invariant violations require future operator visibility." },
  { key: "policy-activation-attempt", category: "policy", severity: "critical", reason: "Policy activation attempts must be visible and cannot activate policy here." },
  { key: "repair-orchestration-change-attempt", category: "repair", severity: "critical", reason: "Repair orchestration change attempts must be visible and blocked by preview invariants." },
  { key: "risk-register-state-change", category: "risk", severity: "warning", reason: "Risk register state changes require future auditability." },
  { key: "runtime-config-activation-attempt", category: "governance", severity: "critical", reason: "Runtime config activation attempts must be visible and remain disabled." },
  { key: "safe-patch-engine-bypass-attempt", category: "safety-invariant", severity: "critical", reason: "Safe Patch Engine bypass attempts must be visible and permanently blocked." },
  { key: "sandbox-execution-attempt", category: "sandbox", severity: "critical", reason: "Sandbox execution attempts must be visible without executing sandbox telemetry." }
];

const AUDIT_EVENT_DEFINITIONS: Array<Omit<GovernanceAutonomyAuditEvent, "id" | "immutableAuditRequired">> = [
  { key: "approval-review-checkpoint", category: "approval", reason: "Future approval review checkpoints require immutable audit evidence." },
  { key: "autonomy-scope-review-transition", category: "scope", reason: "Future autonomy scope review transitions require immutable audit evidence." },
  { key: "forbidden-capability-confirmation", category: "safety", reason: "Forbidden capability confirmations require immutable audit evidence." },
  { key: "governance-review-stage", category: "governance", reason: "Governance review stages require immutable audit evidence." },
  { key: "policy-preview-transition", category: "policy", reason: "Policy preview transitions require immutable audit evidence." },
  { key: "repair-safety-invariant-review", category: "repair", reason: "Repair safety invariant reviews require immutable audit evidence." },
  { key: "risk-review-transition", category: "risk", reason: "Risk review transitions require immutable audit evidence." },
  { key: "sandbox-lifecycle-preview", category: "sandbox", reason: "Sandbox lifecycle previews require immutable audit evidence." }
];

const ALERT_CANDIDATE_DEFINITIONS: Array<Omit<GovernanceAutonomyAlertCandidate, "id" | "requiresHumanReview">> = [
  { key: "autonomous-actions-unexpectedly-allowed", severity: "critical", reason: "Autonomous actions becoming allowed would require immediate human review." },
  { key: "autonomy-unexpectedly-enabled", severity: "critical", reason: "Autonomy becoming enabled would require immediate human review." },
  { key: "external-execution-exposure", severity: "critical", reason: "External execution exposure must remain blocked and human-reviewed." },
  { key: "governance-bypass-exposure", severity: "critical", reason: "Governance bypass exposure must remain blocked and human-reviewed." },
  { key: "mutation-scope-expansion-detection", severity: "critical", reason: "Mutation scope expansion detection requires immediate human review." },
  { key: "plugin-script-execution-exposure", severity: "critical", reason: "Plugin or script execution exposure must remain blocked and human-reviewed." },
  { key: "repair-orchestration-change-detection", severity: "high", reason: "Repair orchestration changes require human review before any future design can proceed." },
  { key: "runtime-activation-unexpectedly-enabled", severity: "critical", reason: "Runtime activation becoming enabled would require immediate human review." },
  { key: "runtime-learning-exposure", severity: "critical", reason: "Runtime learning exposure must remain blocked and human-reviewed." },
  { key: "safe-patch-engine-bypass-detection", severity: "critical", reason: "Safe Patch Engine bypass detection requires immediate human review." }
];

const OPERATOR_VISIBILITY_DEFINITIONS: Array<Omit<GovernanceAutonomyOperatorVisibilityRequirement, "id" | "required">> = [
  { key: "future-approval-transitions", reason: "Operators must see all future approval transitions before any autonomy review." },
  { key: "future-autonomy-transitions", reason: "Operators must see all future autonomy transitions before any autonomy review." },
  { key: "future-exception-approval-transitions", reason: "Operators must see all future exception approval transitions." },
  { key: "future-governance-enforcement-transitions", reason: "Operators must see all future governance enforcement transitions." },
  { key: "future-mutation-boundary-transitions", reason: "Operators must see all future mutation-boundary transitions." },
  { key: "future-policy-activation-transitions", reason: "Operators must see all future policy activation transitions." },
  { key: "future-repair-orchestration-changes", reason: "Operators must see all future repair orchestration changes." },
  { key: "future-sandbox-transitions", reason: "Operators must see all future sandbox transitions." }
];

const MISSING_COVERAGE_DEFINITIONS: Array<Omit<GovernanceAutonomyMissingCoverage, "id">> = [
  { key: "missing-future-autonomy-shutdown-telemetry", reason: "Future autonomy shutdown telemetry has not been defined." },
  { key: "missing-future-emergency-stop-observability", reason: "Future emergency-stop observability has not been defined." },
  { key: "missing-future-governance-override-telemetry", reason: "Future governance override telemetry has not been defined." },
  { key: "missing-future-policy-enforcement-telemetry", reason: "Future policy enforcement telemetry has not been defined." },
  { key: "missing-future-runtime-activation-telemetry", reason: "Future runtime activation telemetry has not been defined." },
  { key: "missing-future-sandbox-execution-observability", reason: "Future sandbox execution observability has not been defined." },
  { key: "missing-rollback-telemetry", reason: "Rollback telemetry has not been defined for future autonomy review." }
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

function conclusionFor(source: GovernanceAutonomySandboxEvidencePreview): Pick<
  GovernanceAutonomyObservabilityPreview,
  "previewStatus" | "observabilityConclusion" | "recommendedNextStage"
> {
  if (source.previewStatus === "not-created") {
    return {
      previewStatus: "not-created",
      observabilityConclusion: "source-missing",
      recommendedNextStage: "continue-governance-hardening"
    };
  }
  if (source.previewStatus === "blocked") {
    return {
      previewStatus: "blocked",
      observabilityConclusion: "blocked-preview",
      recommendedNextStage: "blocked"
    };
  }
  if (source.sandboxEvidenceConclusion === "sandbox-evidence-ready-preview") {
    return {
      previewStatus: "created",
      observabilityConclusion: "observability-ready-preview",
      recommendedNextStage: "prepare-autonomy-control-plane-preview"
    };
  }
  return {
    previewStatus: "created",
    observabilityConclusion: "observability-not-ready",
    recommendedNextStage: "continue-governance-hardening"
  };
}

function buildTelemetrySignals(): GovernanceAutonomyTelemetrySignal[] {
  return withDeterministicIds("gov-observability-signal", TELEMETRY_SIGNAL_DEFINITIONS)
    .map((item) => ({ ...item, previewOnly: true }));
}

function buildAuditEvents(): GovernanceAutonomyAuditEvent[] {
  return withDeterministicIds("gov-observability-audit", AUDIT_EVENT_DEFINITIONS)
    .map((item) => ({ ...item, immutableAuditRequired: true }));
}

function buildAlertCandidates(): GovernanceAutonomyAlertCandidate[] {
  return withDeterministicIds("gov-observability-alert", ALERT_CANDIDATE_DEFINITIONS, (item) => `${item.severity}:${item.key}`)
    .map((item) => ({ ...item, requiresHumanReview: true }));
}

function buildOperatorVisibilityRequirements(): GovernanceAutonomyOperatorVisibilityRequirement[] {
  return withDeterministicIds("gov-observability-visibility", OPERATOR_VISIBILITY_DEFINITIONS, (item) => item.key)
    .map((item) => ({ ...item, required: true }));
}

function buildMissingCoverage(): GovernanceAutonomyMissingCoverage[] {
  return withDeterministicIds("gov-observability-missing", MISSING_COVERAGE_DEFINITIONS, (item) => item.key);
}

function buildSummary(
  telemetrySignals: GovernanceAutonomyTelemetrySignal[],
  auditEvents: GovernanceAutonomyAuditEvent[],
  alertCandidates: GovernanceAutonomyAlertCandidate[],
  operatorVisibilityRequirements: GovernanceAutonomyOperatorVisibilityRequirement[],
  missingObservabilityCoverage: GovernanceAutonomyMissingCoverage[],
  conclusion: GovernanceAutonomyObservabilityPreview["observabilityConclusion"]
): GovernanceAutonomyObservabilityPreview["summary"] {
  return {
    totalTelemetrySignals: telemetrySignals.length,
    totalAuditEvents: auditEvents.length,
    totalAlertCandidates: alertCandidates.length,
    totalOperatorVisibilityRequirements: operatorVisibilityRequirements.length,
    totalMissingCoverage: missingObservabilityCoverage.length,
    observabilityReadyForFutureReview: conclusion === "observability-ready-preview"
  };
}

function warningsFor(conclusion: GovernanceAutonomyObservabilityPreview["observabilityConclusion"]): string[] {
  const warnings = [
    "Controlled autonomy observability preview is advisory only.",
    "No observability was applied.",
    "No observability was enforced.",
    "No telemetry was executed.",
    "No sandbox was created.",
    "No sandbox was executed.",
    "No autonomy was enabled.",
    "No autonomous actions are allowed.",
    "No governance was enforced.",
    "Runtime behavior did not change.",
    "Repair orchestration did not change."
  ];
  if (conclusion === "source-missing") {
    warnings.unshift("Autonomy sandbox evidence source is missing; observability preview is incomplete.");
  }
  if (conclusion === "observability-not-ready") {
    warnings.unshift("Autonomy sandbox evidence is not ready for observability preview.");
  }
  if (conclusion === "observability-ready-preview") {
    warnings.unshift("Controlled autonomy observability is ready for future review only.");
  }
  if (conclusion === "blocked-preview") {
    warnings.unshift("Autonomy sandbox evidence is blocked; observability preview is blocked.");
  }
  return warnings;
}

export function buildGovernanceAutonomyObservabilityPreviewFromSandboxEvidence(
  source: GovernanceAutonomySandboxEvidencePreview
): GovernanceAutonomyObservabilityPreview {
  const conclusion = conclusionFor(source);
  const telemetrySignals = buildTelemetrySignals();
  const auditEvents = buildAuditEvents();
  const alertCandidates = buildAlertCandidates();
  const operatorVisibilityRequirements = buildOperatorVisibilityRequirements();
  const missingObservabilityCoverage = buildMissingCoverage();

  return {
    schemaVersion: 1,
    previewStatus: conclusion.previewStatus,
    sourceSandboxEvidenceStatus: source.previewStatus,
    observabilityConclusion: conclusion.observabilityConclusion,
    observabilityApplied: false,
    observabilityEnforced: false,
    sandboxCreated: false,
    sandboxExecuted: false,
    sandboxPlanApplied: false,
    sandboxEnforced: false,
    evidenceApplied: false,
    evidenceEnforced: false,
    riskAccepted: false,
    riskMitigationApplied: false,
    riskRegisterEnforced: false,
    scopeApproved: false,
    scopeApplied: false,
    scopeEnforced: false,
    autonomyEnabled: false,
    autonomousActionsAllowed: false,
    autonomyApplied: false,
    autonomyEnforced: false,
    humanApprovalGranted: false,
    approvalApplied: false,
    approvalWorkflowEnforced: false,
    designReviewApproved: false,
    designReviewApplied: false,
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
    telemetrySignals,
    auditEvents,
    alertCandidates,
    operatorVisibilityRequirements,
    missingObservabilityCoverage,
    summary: buildSummary(
      telemetrySignals,
      auditEvents,
      alertCandidates,
      operatorVisibilityRequirements,
      missingObservabilityCoverage,
      conclusion.observabilityConclusion
    ),
    warnings: warningsFor(conclusion.observabilityConclusion),
    recommendedNextStage: conclusion.recommendedNextStage
  };
}

export function buildGovernanceAutonomyObservabilityPreview(projectRoot: string): GovernanceAutonomyObservabilityPreview {
  return buildGovernanceAutonomyObservabilityPreviewFromSandboxEvidence(
    buildGovernanceAutonomySandboxEvidencePreview(projectRoot)
  );
}

export function renderGovernanceAutonomyObservabilityPreviewMarkdown(
  preview: GovernanceAutonomyObservabilityPreview
): string {
  const lines = [
    "# AI Software Factory - Controlled Autonomy Observability Preview",
    "",
    "Preview status:",
    preview.previewStatus,
    "",
    "Source sandbox evidence status:",
    preview.sourceSandboxEvidenceStatus,
    "",
    "Observability conclusion:",
    preview.observabilityConclusion,
    "",
    "Observability applied:",
    String(preview.observabilityApplied),
    "",
    "Observability enforced:",
    String(preview.observabilityEnforced),
    "",
    "Sandbox created:",
    String(preview.sandboxCreated),
    "",
    "Sandbox executed:",
    String(preview.sandboxExecuted),
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
    "Telemetry signal count:",
    String(preview.summary.totalTelemetrySignals),
    "",
    "Audit event count:",
    String(preview.summary.totalAuditEvents),
    "",
    "Alert candidate count:",
    String(preview.summary.totalAlertCandidates),
    "",
    "Operator visibility requirement count:",
    String(preview.summary.totalOperatorVisibilityRequirements),
    "",
    "Missing coverage count:",
    String(preview.summary.totalMissingCoverage),
    "",
    "Observability ready for future review:",
    String(preview.summary.observabilityReadyForFutureReview),
    "",
    "Recommended next stage:",
    preview.recommendedNextStage,
    "",
    "## Telemetry Signals",
    ""
  ];

  for (const signal of preview.telemetrySignals) {
    lines.push(`- [${signal.category}/${signal.severity}] ${signal.id} ${signal.key} - ${signal.reason}`);
  }

  lines.push("", "## Audit Events", "");
  for (const event of preview.auditEvents) {
    lines.push(`- [${event.category}] ${event.id} ${event.key} - ${event.reason}`);
  }

  lines.push("", "## Alert Candidates", "");
  for (const alert of preview.alertCandidates) {
    lines.push(`- [${alert.severity}] ${alert.id} ${alert.key} - ${alert.reason}`);
  }

  lines.push("", "## Operator Visibility Requirements", "");
  for (const requirement of preview.operatorVisibilityRequirements) {
    lines.push(`- ${requirement.id} ${requirement.key} - ${requirement.reason}`);
  }

  lines.push("", "## Missing Observability Coverage", "");
  for (const coverage of preview.missingObservabilityCoverage) {
    lines.push(`- ${coverage.id} ${coverage.key} - ${coverage.reason}`);
  }

  lines.push("", "## Warnings", "");
  for (const warning of preview.warnings) {
    lines.push(`- ${warning}`);
  }

  return `${lines.join("\n")}\n`;
}

export function renderGovernanceAutonomyObservabilityPreviewText(
  preview: GovernanceAutonomyObservabilityPreview
): string {
  return renderGovernanceAutonomyObservabilityPreviewMarkdown(preview);
}

export function writeGovernanceAutonomyObservabilityPreviewArtifacts(
  projectRoot: string,
  preview: GovernanceAutonomyObservabilityPreview
): { jsonPath: string; markdownPath: string } {
  const jsonPath = path.join(projectRoot, ARTIFACT_JSON_PATH);
  const markdownPath = path.join(projectRoot, ARTIFACT_MARKDOWN_PATH);
  fs.ensureDirSync(path.dirname(jsonPath));
  fs.writeFileSync(jsonPath, `${JSON.stringify(preview, null, 2)}\n`, "utf8");
  fs.writeFileSync(markdownPath, renderGovernanceAutonomyObservabilityPreviewMarkdown(preview), "utf8");
  return {
    jsonPath: ARTIFACT_JSON_PATH,
    markdownPath: ARTIFACT_MARKDOWN_PATH
  };
}
