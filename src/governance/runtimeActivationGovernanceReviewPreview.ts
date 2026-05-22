import fs from "fs-extra";
import path from "node:path";

import {
  buildGovernanceRuntimeSafetyCertificationPreview,
  type GovernanceRuntimeSafetyCertificationPreview
} from "./runtimeSafetyCertificationPreview.js";

export type GovernanceRuntimeGovernanceReviewScore = {
  score: 0 | 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90 | 100;
  rating: "blocked" | "not-ready" | "partial-human-review-readiness" | "future-human-review-ready";
  reason: string;
};

export type GovernanceRuntimeGovernanceReviewSection = {
  id: string;
  key: string;
  category:
    | "runtime-certification"
    | "runtime-observability"
    | "runtime-control-plane"
    | "runtime-lifecycle"
    | "runtime-activation-readiness"
    | "runtime-rollback"
    | "runtime-forbidden-capabilities"
    | "safe-patch-engine";
  sectionStatus: "passed-preview" | "warning" | "blocked";
  reason: string;
  approved: false;
};

export type GovernanceRuntimeGovernanceReviewFinding = {
  id: string;
  severity: "info" | "warning" | "high";
  key: string;
  reason: string;
};

export type GovernanceRuntimeGovernanceReviewBlocker = {
  id: string;
  severity: "high" | "critical";
  key: string;
  reason: string;
};

export type GovernanceRuntimeGovernanceApprovalRequirement = {
  id: string;
  category:
    | "human-review"
    | "rollback-review"
    | "freeze-validation"
    | "safe-patch-engine-review"
    | "governance-boundary-review";
  required: true;
  reason: string;
};

export type GovernanceRuntimeForbiddenActivationFinding = {
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

export type GovernanceRuntimeRollbackGovernanceReviewStep = {
  id: string;
  key: string;
  required: true;
  reason: string;
};

export type GovernanceRuntimeRollbackGovernanceReviewPlanning = {
  schemaVersion: 1;
  rollbackExecutionAllowed: false;
  rollbackPrepared: false;
  rollbackPlanningSteps: GovernanceRuntimeRollbackGovernanceReviewStep[];
  reason: string;
};

export type GovernanceRuntimeActivationGovernanceReviewPreview = {
  schemaVersion: 1;
  previewStatus: "not-created" | "created" | "blocked";
  sourceRuntimeCertificationStatus: "not-created" | "created" | "blocked";
  governanceReviewConclusion: "source-missing" | "not-ready" | "future-human-review-ready" | "blocked";
  runtimeActivationApproved: false;
  runtimeActivationExecuted: false;
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
  governanceReviewScore: GovernanceRuntimeGovernanceReviewScore;
  governanceReviewSections: GovernanceRuntimeGovernanceReviewSection[];
  governanceReviewFindings: GovernanceRuntimeGovernanceReviewFinding[];
  governanceReviewBlockers: GovernanceRuntimeGovernanceReviewBlocker[];
  governanceApprovalRequirements: GovernanceRuntimeGovernanceApprovalRequirement[];
  forbiddenActivationFindings: GovernanceRuntimeForbiddenActivationFinding[];
  rollbackGovernanceReviewPlanning: GovernanceRuntimeRollbackGovernanceReviewPlanning;
  summary: {
    governanceReviewScoreValue: number;
    totalSections: number;
    passedSections: number;
    warningSections: number;
    blockedSections: number;
    totalFindings: number;
    totalBlockers: number;
    totalApprovalRequirements: number;
    totalForbiddenActivationFindings: number;
    rollbackPlanningSteps: number;
    futureHumanReviewReady: boolean;
  };
  warnings: string[];
  recommendedNextStage:
    | "continue-runtime-safety-hardening"
    | "prepare-runtime-activation-boundary-preview"
    | "blocked";
};

const ARTIFACT_JSON_PATH = ".factory/governance/runtime-activation-governance-review-preview.json";
const ARTIFACT_MARKDOWN_PATH = ".factory/governance/runtime-activation-governance-review-preview.md";

const SECTION_DEFINITIONS: Array<Omit<GovernanceRuntimeGovernanceReviewSection, "id" | "sectionStatus" | "approved">> = [
  { key: "forbidden-capability-prevention", category: "runtime-forbidden-capabilities", reason: "Forbidden runtime activation paths remain documented and permanently blocked." },
  { key: "runtime-activation-readiness", category: "runtime-activation-readiness", reason: "Runtime activation readiness is reviewed as preview-only." },
  { key: "runtime-certification", category: "runtime-certification", reason: "Runtime certification preview is reviewed without applying certification." },
  { key: "runtime-control-plane", category: "runtime-control-plane", reason: "Runtime control-plane controls are reviewed without applying control behavior." },
  { key: "runtime-governance-lifecycle", category: "runtime-lifecycle", reason: "Runtime governance lifecycle remains preview-only." },
  { key: "runtime-observability", category: "runtime-observability", reason: "Runtime observability remains modeled but not applied." },
  { key: "runtime-rollback-governance-planning", category: "runtime-rollback", reason: "Runtime rollback governance review remains planning-only." },
  { key: "safe-patch-engine-exclusivity", category: "safe-patch-engine", reason: "Safe Patch Engine remains the only mutation layer." }
];

const FINDING_DEFINITIONS: Array<Omit<GovernanceRuntimeGovernanceReviewFinding, "id">> = [
  { key: "governance-review-preview-only", severity: "info", reason: "Runtime activation governance review is preview-only." },
  { key: "runtime-activation-not-approved", severity: "warning", reason: "Runtime activation approval was not granted." },
  { key: "runtime-activation-not-executed", severity: "info", reason: "Runtime activation was not executed." },
  { key: "runtime-governance-disabled", severity: "warning", reason: "Runtime governance remains disabled." },
  { key: "runtime-policy-enforcement-disabled", severity: "warning", reason: "Runtime policy enforcement remains disabled." },
  { key: "runtime-rollback-unavailable", severity: "high", reason: "Runtime rollback execution is unavailable in preview mode." },
  { key: "safe-patch-engine-only", severity: "info", reason: "Safe Patch Engine exclusivity remains preserved." }
];

const BLOCKER_DEFINITIONS: Array<Omit<GovernanceRuntimeGovernanceReviewBlocker, "id">> = [
  { key: "missing-activation-boundary-review", severity: "high", reason: "Future activation boundary review is required before runtime activation could be considered." },
  { key: "missing-human-governance-review", severity: "high", reason: "Future human governance review is required and has not approved activation." },
  { key: "missing-runtime-freeze-validation", severity: "high", reason: "Future runtime freeze validation is required before activation." },
  { key: "runtime-activation-unavailable", severity: "critical", reason: "Runtime activation is unavailable in preview mode." },
  { key: "runtime-approval-preview-only", severity: "high", reason: "Runtime approval remains preview-only and cannot approve activation." },
  { key: "runtime-autonomy-disabled", severity: "high", reason: "Runtime autonomy remains disabled." },
  { key: "runtime-governance-disabled", severity: "high", reason: "Runtime governance remains disabled." },
  { key: "runtime-rollback-execution-unavailable", severity: "high", reason: "Runtime rollback execution is unavailable in preview mode." }
];

const APPROVAL_REQUIREMENT_DEFINITIONS: Array<Omit<GovernanceRuntimeGovernanceApprovalRequirement, "id" | "required">> = [
  { category: "freeze-validation", reason: "Runtime freeze validation must be reviewed before any future activation." },
  { category: "governance-boundary-review", reason: "Governance boundary verification is required before any future activation." },
  { category: "governance-boundary-review", reason: "Governance bypass prevention verification is required before any future activation." },
  { category: "governance-boundary-review", reason: "Mutation-boundary verification is required before any future activation." },
  { category: "human-review", reason: "Mandatory human review is required before any future activation." },
  { category: "rollback-review", reason: "Runtime rollback review is required before any future activation." },
  { category: "safe-patch-engine-review", reason: "Safe Patch Engine exclusivity review is required before any future activation." }
];

const FORBIDDEN_ACTIVATION_DEFINITIONS: Array<Omit<GovernanceRuntimeForbiddenActivationFinding, "id" | "permanentlyForbidden">> = [
  { category: "mutation-scope-expansion", reason: "Runtime activation with mutation scope expansion remains permanently forbidden." },
  { category: "runtime-autonomy", reason: "Runtime autonomy remains forbidden unless separately reviewed in a future non-preview phase." },
  { category: "runtime-learning", reason: "Runtime learning governance remains permanently forbidden." },
  { category: "runtime-ml-decisioning", reason: "ML/vector DB governance decisioning remains permanently forbidden." },
  { category: "runtime-multi-agent-coordination", reason: "Uncontrolled runtime multi-agent coordination remains permanently forbidden." },
  { category: "runtime-plugin-execution", reason: "Runtime plugin execution remains permanently forbidden." },
  { category: "runtime-policy-enforcement", reason: "Runtime policy enforcement is not enabled by governance review preview." },
  { category: "runtime-script-execution", reason: "Runtime script execution remains permanently forbidden." },
  { category: "safe-patch-engine-bypass", reason: "Safe Patch Engine bypass remains permanently forbidden." }
];

const ROLLBACK_STEP_DEFINITIONS: Array<Omit<GovernanceRuntimeRollbackGovernanceReviewStep, "id" | "required">> = [
  { key: "future-audit-preservation-planning", reason: "Future runtime activation review must preserve deterministic audit evidence." },
  { key: "future-mutation-boundary-verification-planning", reason: "Future runtime activation review must verify mutation boundaries remain unchanged." },
  { key: "future-runtime-autonomy-shutdown-planning", reason: "Future runtime activation review must define runtime autonomy shutdown planning." },
  { key: "future-runtime-governance-shutdown-planning", reason: "Future runtime activation review must define runtime governance shutdown planning." },
  { key: "future-runtime-policy-freeze-planning", reason: "Future runtime activation review must define runtime policy freeze planning." },
  { key: "future-runtime-rollback-verification-planning", reason: "Future runtime activation review must define runtime rollback verification planning." },
  { key: "future-safe-patch-engine-verification-planning", reason: "Future runtime activation review must verify Safe Patch Engine exclusivity." }
];

function withDeterministicIds<T>(prefix: string, items: T[], sortKey: (item: T) => string): Array<T & { id: string }> {
  return [...items]
    .sort((a, b) => sortKey(a).localeCompare(sortKey(b)))
    .map((item, index) => ({ id: `${prefix}-${String(index + 1).padStart(3, "0")}`, ...item }));
}

function conclusionFor(source: GovernanceRuntimeSafetyCertificationPreview): Pick<GovernanceRuntimeActivationGovernanceReviewPreview, "previewStatus" | "governanceReviewConclusion" | "recommendedNextStage"> {
  if (source.previewStatus === "not-created") {
    return { previewStatus: "not-created", governanceReviewConclusion: "source-missing", recommendedNextStage: "continue-runtime-safety-hardening" };
  }
  if (source.previewStatus === "blocked") {
    return { previewStatus: "blocked", governanceReviewConclusion: "blocked", recommendedNextStage: "blocked" };
  }
  if (source.runtimeCertificationConclusion === "future-review-ready") {
    return { previewStatus: "created", governanceReviewConclusion: "future-human-review-ready", recommendedNextStage: "prepare-runtime-activation-boundary-preview" };
  }
  return { previewStatus: "created", governanceReviewConclusion: "not-ready", recommendedNextStage: "continue-runtime-safety-hardening" };
}

function scoreFor(conclusion: GovernanceRuntimeActivationGovernanceReviewPreview["governanceReviewConclusion"]): GovernanceRuntimeGovernanceReviewScore {
  if (conclusion === "blocked") return { score: 0, rating: "blocked", reason: "Runtime activation governance review preview is blocked by certification status." };
  if (conclusion === "source-missing") return { score: 20, rating: "not-ready", reason: "Runtime safety certification preview is missing." };
  if (conclusion === "not-ready") return { score: 40, rating: "partial-human-review-readiness", reason: "Runtime safety certification exists but is not ready for future human review." };
  return { score: 80, rating: "future-human-review-ready", reason: "Runtime activation governance review is ready for future human review only; activation is not approved." };
}

function sectionStatusFor(conclusion: GovernanceRuntimeActivationGovernanceReviewPreview["governanceReviewConclusion"]): GovernanceRuntimeGovernanceReviewSection["sectionStatus"] {
  if (conclusion === "blocked") return "blocked";
  if (conclusion === "future-human-review-ready") return "passed-preview";
  return "warning";
}

function buildSections(conclusion: GovernanceRuntimeActivationGovernanceReviewPreview["governanceReviewConclusion"]): GovernanceRuntimeGovernanceReviewSection[] {
  return withDeterministicIds(
    "gov-runtime-review-section",
    SECTION_DEFINITIONS.map((item) => ({
      ...item,
      sectionStatus: sectionStatusFor(conclusion),
      approved: false
    })),
    (item) => `${item.category}:${item.key}:${item.sectionStatus}`
  );
}

function buildFindings(): GovernanceRuntimeGovernanceReviewFinding[] {
  return withDeterministicIds("gov-runtime-review-finding", FINDING_DEFINITIONS, (item) => `${item.severity}:${item.key}`);
}

function buildBlockers(): GovernanceRuntimeGovernanceReviewBlocker[] {
  return withDeterministicIds("gov-runtime-review-blocker", BLOCKER_DEFINITIONS, (item) => `${item.severity}:${item.key}`);
}

function buildApprovalRequirements(): GovernanceRuntimeGovernanceApprovalRequirement[] {
  return withDeterministicIds(
    "gov-runtime-review-approval",
    APPROVAL_REQUIREMENT_DEFINITIONS.map((item) => ({ ...item, required: true as const })),
    (item) => `${item.category}:${item.reason}`
  );
}

function buildForbiddenActivationFindings(): GovernanceRuntimeForbiddenActivationFinding[] {
  return withDeterministicIds(
    "gov-runtime-review-forbidden",
    FORBIDDEN_ACTIVATION_DEFINITIONS.map((item) => ({ ...item, permanentlyForbidden: true as const })),
    (item) => item.category
  );
}

function buildRollbackPlanning(): GovernanceRuntimeRollbackGovernanceReviewPlanning {
  const rollbackPlanningSteps = withDeterministicIds(
    "gov-runtime-review-rollback",
    ROLLBACK_STEP_DEFINITIONS.map((item) => ({ ...item, required: true as const })),
    (item) => item.key
  );
  return {
    schemaVersion: 1,
    rollbackExecutionAllowed: false,
    rollbackPrepared: false,
    rollbackPlanningSteps,
    reason: "Rollback governance review is planning-only; no rollback was prepared or executed."
  };
}

function warningsFor(conclusion: GovernanceRuntimeActivationGovernanceReviewPreview["governanceReviewConclusion"]): string[] {
  const warnings = [
    "Runtime activation governance review preview is advisory only.",
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
  if (conclusion === "source-missing") warnings.unshift("Runtime safety certification source is missing; governance review preview is incomplete.");
  if (conclusion === "not-ready") warnings.unshift("Runtime safety certification is not ready for governance review preview.");
  if (conclusion === "future-human-review-ready") warnings.unshift("Runtime activation governance review preview is ready for future human review only.");
  if (conclusion === "blocked") warnings.unshift("Runtime safety certification is blocked; governance review preview is blocked.");
  return warnings;
}

export function buildGovernanceRuntimeActivationGovernanceReviewPreviewFromCertification(source: GovernanceRuntimeSafetyCertificationPreview): GovernanceRuntimeActivationGovernanceReviewPreview {
  const conclusion = conclusionFor(source);
  const governanceReviewScore = scoreFor(conclusion.governanceReviewConclusion);
  const governanceReviewSections = buildSections(conclusion.governanceReviewConclusion);
  const governanceReviewFindings = buildFindings();
  const governanceReviewBlockers = buildBlockers();
  const governanceApprovalRequirements = buildApprovalRequirements();
  const forbiddenActivationFindings = buildForbiddenActivationFindings();
  const rollbackGovernanceReviewPlanning = buildRollbackPlanning();

  return {
    schemaVersion: 1,
    previewStatus: conclusion.previewStatus,
    sourceRuntimeCertificationStatus: source.previewStatus,
    governanceReviewConclusion: conclusion.governanceReviewConclusion,
    runtimeActivationApproved: false,
    runtimeActivationExecuted: false,
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
    governanceReviewScore,
    governanceReviewSections,
    governanceReviewFindings,
    governanceReviewBlockers,
    governanceApprovalRequirements,
    forbiddenActivationFindings,
    rollbackGovernanceReviewPlanning,
    summary: {
      governanceReviewScoreValue: governanceReviewScore.score,
      totalSections: governanceReviewSections.length,
      passedSections: governanceReviewSections.filter((item) => item.sectionStatus === "passed-preview").length,
      warningSections: governanceReviewSections.filter((item) => item.sectionStatus === "warning").length,
      blockedSections: governanceReviewSections.filter((item) => item.sectionStatus === "blocked").length,
      totalFindings: governanceReviewFindings.length,
      totalBlockers: governanceReviewBlockers.length,
      totalApprovalRequirements: governanceApprovalRequirements.length,
      totalForbiddenActivationFindings: forbiddenActivationFindings.length,
      rollbackPlanningSteps: rollbackGovernanceReviewPlanning.rollbackPlanningSteps.length,
      futureHumanReviewReady: conclusion.governanceReviewConclusion === "future-human-review-ready"
    },
    warnings: warningsFor(conclusion.governanceReviewConclusion),
    recommendedNextStage: conclusion.recommendedNextStage
  };
}

export function buildGovernanceRuntimeActivationGovernanceReviewPreview(projectRoot: string): GovernanceRuntimeActivationGovernanceReviewPreview {
  return buildGovernanceRuntimeActivationGovernanceReviewPreviewFromCertification(buildGovernanceRuntimeSafetyCertificationPreview(projectRoot));
}

export function renderGovernanceRuntimeActivationGovernanceReviewPreviewMarkdown(preview: GovernanceRuntimeActivationGovernanceReviewPreview): string {
  const lines = [
    "# AI Software Factory - Runtime Activation Governance Review Preview",
    "",
    "Preview status:", preview.previewStatus,
    "", "Source runtime certification status:", preview.sourceRuntimeCertificationStatus,
    "", "Governance review conclusion:", preview.governanceReviewConclusion,
    "", "Runtime activation approved:", String(preview.runtimeActivationApproved),
    "", "Runtime activation executed:", String(preview.runtimeActivationExecuted),
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
    "", "Governance review score:", String(preview.governanceReviewScore.score),
    "", "Governance review rating:", preview.governanceReviewScore.rating,
    "", "Section count:", String(preview.summary.totalSections),
    "", "Finding count:", String(preview.summary.totalFindings),
    "", "Blocker count:", String(preview.summary.totalBlockers),
    "", "Approval requirement count:", String(preview.summary.totalApprovalRequirements),
    "", "Forbidden activation finding count:", String(preview.summary.totalForbiddenActivationFindings),
    "", "Rollback planning step count:", String(preview.summary.rollbackPlanningSteps),
    "", "Future human review ready:", String(preview.summary.futureHumanReviewReady),
    "", "Recommended next stage:", preview.recommendedNextStage,
    "", "## Governance Review Sections", ""
  ];
  for (const item of preview.governanceReviewSections) lines.push(`- [${item.category}/${item.sectionStatus}/approved=${String(item.approved)}] ${item.id} ${item.key} - ${item.reason}`);
  lines.push("", "## Governance Review Findings", "");
  for (const item of preview.governanceReviewFindings) lines.push(`- [${item.severity}] ${item.id} ${item.key} - ${item.reason}`);
  lines.push("", "## Governance Review Blockers", "");
  for (const item of preview.governanceReviewBlockers) lines.push(`- [${item.severity}] ${item.id} ${item.key} - ${item.reason}`);
  lines.push("", "## Governance Approval Requirements", "");
  for (const item of preview.governanceApprovalRequirements) lines.push(`- [${item.category}/required=${String(item.required)}] ${item.id} - ${item.reason}`);
  lines.push("", "## Forbidden Activation Findings", "");
  for (const item of preview.forbiddenActivationFindings) lines.push(`- [${item.category}] ${item.id} permanentlyForbidden=${String(item.permanentlyForbidden)} - ${item.reason}`);
  lines.push("", "## Rollback Governance Review Planning", "");
  lines.push(`Rollback execution allowed: ${String(preview.rollbackGovernanceReviewPlanning.rollbackExecutionAllowed)}`);
  lines.push(`Rollback prepared: ${String(preview.rollbackGovernanceReviewPlanning.rollbackPrepared)}`);
  lines.push(`Reason: ${preview.rollbackGovernanceReviewPlanning.reason}`);
  for (const item of preview.rollbackGovernanceReviewPlanning.rollbackPlanningSteps) lines.push(`- ${item.id} ${item.key} required=${String(item.required)} - ${item.reason}`);
  lines.push("", "## Warnings", "");
  for (const warning of preview.warnings) lines.push(`- ${warning}`);
  return `${lines.join("\n")}\n`;
}

export function renderGovernanceRuntimeActivationGovernanceReviewPreviewText(preview: GovernanceRuntimeActivationGovernanceReviewPreview): string {
  return renderGovernanceRuntimeActivationGovernanceReviewPreviewMarkdown(preview);
}

export function writeGovernanceRuntimeActivationGovernanceReviewPreviewArtifacts(projectRoot: string, preview: GovernanceRuntimeActivationGovernanceReviewPreview): { jsonPath: string; markdownPath: string } {
  const jsonPath = path.join(projectRoot, ARTIFACT_JSON_PATH);
  const markdownPath = path.join(projectRoot, ARTIFACT_MARKDOWN_PATH);
  fs.ensureDirSync(path.dirname(jsonPath));
  fs.writeFileSync(jsonPath, `${JSON.stringify(preview, null, 2)}\n`, "utf8");
  fs.writeFileSync(markdownPath, renderGovernanceRuntimeActivationGovernanceReviewPreviewMarkdown(preview), "utf8");
  return { jsonPath: ARTIFACT_JSON_PATH, markdownPath: ARTIFACT_MARKDOWN_PATH };
}
