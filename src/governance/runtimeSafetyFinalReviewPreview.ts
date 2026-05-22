import fs from "fs-extra";
import path from "node:path";

import {
  buildGovernanceRuntimeActivationFreezePreview,
  type GovernanceRuntimeActivationFreezePreview
} from "./runtimeActivationFreezePreview.js";

export type GovernanceRuntimeArchitectureCompletenessScore = {
  score: 0 | 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90 | 100;
  rating: "blocked" | "not-ready" | "partial-final-review-readiness" | "future-final-review-ready";
  reason: string;
};

export type GovernanceRuntimeFinalReviewDomain = {
  id: string;
  key: string;
  category:
    | "runtime-safety-design"
    | "runtime-safety-evidence"
    | "runtime-observability"
    | "runtime-control-plane"
    | "runtime-lifecycle"
    | "runtime-activation-readiness"
    | "runtime-certification"
    | "runtime-governance-review"
    | "runtime-boundary-review"
    | "runtime-freeze-review"
    | "safe-patch-engine";
  domainStatus: "passed-preview" | "warning" | "blocked";
  reason: string;
  approved: false;
};

export type GovernanceRuntimeFinalReviewFinding = {
  id: string;
  severity: "info" | "warning" | "high";
  key: string;
  reason: string;
};

export type GovernanceRuntimeFinalReviewBlocker = {
  id: string;
  severity: "high" | "critical";
  key: string;
  reason: string;
};

export type GovernanceRuntimeForbiddenFinding = {
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

export type GovernanceRuntimeRollbackFreezeGovernanceStep = {
  id: string;
  key: string;
  required: true;
  reason: string;
};

export type GovernanceRuntimeRollbackFreezeGovernancePlanning = {
  schemaVersion: 1;
  rollbackExecutionAllowed: false;
  rollbackPrepared: false;
  rollbackPlanningSteps: GovernanceRuntimeRollbackFreezeGovernanceStep[];
  reason: string;
};

export type GovernanceRuntimeSafetyFinalReviewPreview = {
  schemaVersion: 1;
  previewStatus: "not-created" | "created" | "blocked";
  sourceRuntimeFreezeStatus: "not-created" | "created" | "blocked";
  runtimeFinalReviewConclusion: "source-missing" | "not-ready" | "future-final-review-ready" | "blocked";
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
  architectureCompletenessScore: GovernanceRuntimeArchitectureCompletenessScore;
  finalReviewDomains: GovernanceRuntimeFinalReviewDomain[];
  finalReviewFindings: GovernanceRuntimeFinalReviewFinding[];
  finalReviewBlockers: GovernanceRuntimeFinalReviewBlocker[];
  forbiddenRuntimeFindings: GovernanceRuntimeForbiddenFinding[];
  rollbackFreezeGovernancePlanning: GovernanceRuntimeRollbackFreezeGovernancePlanning;
  summary: {
    architectureCompletenessScoreValue: number;
    totalDomains: number;
    passedDomains: number;
    warningDomains: number;
    blockedDomains: number;
    totalFindings: number;
    totalBlockers: number;
    totalForbiddenRuntimeFindings: number;
    rollbackPlanningSteps: number;
    futureFinalReviewReady: boolean;
  };
  warnings: string[];
  recommendedNextStage:
    | "continue-runtime-safety-hardening"
    | "prepare-post-v9-runtime-research-preview"
    | "blocked";
};

const ARTIFACT_JSON_PATH = ".factory/governance/runtime-safety-final-review-preview.json";
const ARTIFACT_MARKDOWN_PATH = ".factory/governance/runtime-safety-final-review-preview.md";

const DOMAIN_DEFINITIONS: Array<Omit<GovernanceRuntimeFinalReviewDomain, "id" | "domainStatus" | "approved">> = [
  { key: "runtime-activation-readiness", category: "runtime-activation-readiness", reason: "Runtime activation readiness remains reviewed as preview-only." },
  { key: "runtime-boundary-review", category: "runtime-boundary-review", reason: "Runtime activation boundaries remain documented but not applied." },
  { key: "runtime-certification", category: "runtime-certification", reason: "Runtime certification remains a preview and is not applied." },
  { key: "runtime-control-plane", category: "runtime-control-plane", reason: "Runtime control plane behavior remains modeled but inactive." },
  { key: "runtime-freeze-review", category: "runtime-freeze-review", reason: "Runtime freeze behavior remains documented but not executed." },
  { key: "runtime-governance-review", category: "runtime-governance-review", reason: "Runtime governance review remains future-review-only and unapproved." },
  { key: "runtime-governance-lifecycle", category: "runtime-lifecycle", reason: "Runtime lifecycle transitions remain preview-only." },
  { key: "runtime-observability", category: "runtime-observability", reason: "Runtime observability remains preview-only and not applied." },
  { key: "runtime-safety-design", category: "runtime-safety-design", reason: "Runtime safety design remains deterministic and preview-only." },
  { key: "runtime-safety-evidence", category: "runtime-safety-evidence", reason: "Runtime safety evidence remains preview-only and not enforced." },
  { key: "safe-patch-engine-exclusivity", category: "safe-patch-engine", reason: "Safe Patch Engine remains the only mutation layer." }
];

const FINDING_DEFINITIONS: Array<Omit<GovernanceRuntimeFinalReviewFinding, "id">> = [
  { key: "final-review-preview-only", severity: "info", reason: "Runtime safety final review is preview-only and cannot approve activation." },
  { key: "runtime-activation-not-approved", severity: "warning", reason: "Runtime activation approval was not granted." },
  { key: "runtime-activation-not-executed", severity: "info", reason: "Runtime activation was not executed." },
  { key: "runtime-final-review-not-approved", severity: "warning", reason: "Runtime final review approval was not granted." },
  { key: "runtime-governance-disabled", severity: "warning", reason: "Runtime governance remains disabled." },
  { key: "runtime-rollback-unavailable", severity: "high", reason: "Runtime rollback execution is unavailable in preview mode." },
  { key: "safe-patch-engine-only", severity: "info", reason: "Safe Patch Engine exclusivity remains preserved." }
];

const BLOCKER_DEFINITIONS: Array<Omit<GovernanceRuntimeFinalReviewBlocker, "id">> = [
  { key: "missing-activation-validation", severity: "high", reason: "Future activation validation is required before runtime activation could be reconsidered." },
  { key: "missing-final-governance-review", severity: "high", reason: "Future final governance review is required." },
  { key: "missing-freeze-validation", severity: "high", reason: "Future freeze validation is required." },
  { key: "runtime-activation-unavailable", severity: "critical", reason: "Runtime activation is unavailable in preview mode." },
  { key: "runtime-autonomy-disabled", severity: "high", reason: "Runtime autonomy remains disabled." },
  { key: "runtime-final-review-preview-only", severity: "high", reason: "Runtime final review preview cannot approve activation." },
  { key: "runtime-governance-disabled", severity: "high", reason: "Runtime governance remains disabled." },
  { key: "runtime-rollback-execution-unavailable", severity: "high", reason: "Runtime rollback execution is unavailable in preview mode." }
];

const FORBIDDEN_DEFINITIONS: Array<Omit<GovernanceRuntimeForbiddenFinding, "id" | "permanentlyForbidden">> = [
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

const ROLLBACK_STEP_DEFINITIONS: Array<Omit<GovernanceRuntimeRollbackFreezeGovernanceStep, "id" | "required">> = [
  { key: "future-audit-preservation-planning", reason: "Future runtime final review must preserve deterministic audit evidence." },
  { key: "future-mutation-boundary-verification-planning", reason: "Future runtime final review must verify mutation boundaries remain unchanged." },
  { key: "future-runtime-autonomy-shutdown-planning", reason: "Future runtime final review must define runtime autonomy shutdown planning." },
  { key: "future-runtime-governance-shutdown-planning", reason: "Future runtime final review must define runtime governance shutdown planning." },
  { key: "future-runtime-policy-freeze-planning", reason: "Future runtime final review must define runtime policy freeze planning." },
  { key: "future-runtime-rollback-verification-planning", reason: "Future runtime final review must define runtime rollback verification planning." },
  { key: "future-safe-patch-engine-verification-planning", reason: "Future runtime final review must verify Safe Patch Engine exclusivity." }
];

function withDeterministicIds<T>(prefix: string, items: T[], sortKey: (item: T) => string): Array<T & { id: string }> {
  return [...items]
    .sort((a, b) => sortKey(a).localeCompare(sortKey(b)))
    .map((item, index) => ({ id: `${prefix}-${String(index + 1).padStart(3, "0")}`, ...item }));
}

function conclusionFor(source: GovernanceRuntimeActivationFreezePreview): Pick<GovernanceRuntimeSafetyFinalReviewPreview, "previewStatus" | "runtimeFinalReviewConclusion" | "recommendedNextStage"> {
  if (source.previewStatus === "not-created") {
    return { previewStatus: "not-created", runtimeFinalReviewConclusion: "source-missing", recommendedNextStage: "continue-runtime-safety-hardening" };
  }
  if (source.previewStatus === "blocked") {
    return { previewStatus: "blocked", runtimeFinalReviewConclusion: "blocked", recommendedNextStage: "blocked" };
  }
  if (source.runtimeFreezeConclusion === "future-freeze-review-ready") {
    return { previewStatus: "created", runtimeFinalReviewConclusion: "future-final-review-ready", recommendedNextStage: "prepare-post-v9-runtime-research-preview" };
  }
  return { previewStatus: "created", runtimeFinalReviewConclusion: "not-ready", recommendedNextStage: "continue-runtime-safety-hardening" };
}

function scoreFor(conclusion: GovernanceRuntimeSafetyFinalReviewPreview["runtimeFinalReviewConclusion"]): GovernanceRuntimeArchitectureCompletenessScore {
  if (conclusion === "blocked") return { score: 0, rating: "blocked", reason: "Runtime safety final review preview is blocked by freeze status." };
  if (conclusion === "source-missing") return { score: 20, rating: "not-ready", reason: "Runtime activation freeze preview is missing." };
  if (conclusion === "not-ready") return { score: 40, rating: "partial-final-review-readiness", reason: "Runtime activation freeze preview exists but is not ready for final review." };
  return { score: 80, rating: "future-final-review-ready", reason: "Runtime safety final review is ready for future review only; approval is not granted." };
}

function statusFor(conclusion: GovernanceRuntimeSafetyFinalReviewPreview["runtimeFinalReviewConclusion"]): GovernanceRuntimeFinalReviewDomain["domainStatus"] {
  if (conclusion === "blocked") return "blocked";
  if (conclusion === "future-final-review-ready") return "passed-preview";
  return "warning";
}

function buildDomains(conclusion: GovernanceRuntimeSafetyFinalReviewPreview["runtimeFinalReviewConclusion"]): GovernanceRuntimeFinalReviewDomain[] {
  return withDeterministicIds(
    "gov-runtime-final-domain",
    DOMAIN_DEFINITIONS.map((item) => ({ ...item, domainStatus: statusFor(conclusion), approved: false as const })),
    (item) => `${item.category}:${item.key}:${item.domainStatus}`
  );
}

function buildFindings(): GovernanceRuntimeFinalReviewFinding[] {
  return withDeterministicIds("gov-runtime-final-finding", FINDING_DEFINITIONS, (item) => `${item.severity}:${item.key}`);
}

function buildBlockers(): GovernanceRuntimeFinalReviewBlocker[] {
  return withDeterministicIds("gov-runtime-final-blocker", BLOCKER_DEFINITIONS, (item) => `${item.severity}:${item.key}`);
}

function buildForbiddenFindings(): GovernanceRuntimeForbiddenFinding[] {
  return withDeterministicIds(
    "gov-runtime-final-forbidden",
    FORBIDDEN_DEFINITIONS.map((item) => ({ ...item, permanentlyForbidden: true as const })),
    (item) => item.category
  );
}

function buildRollbackPlanning(): GovernanceRuntimeRollbackFreezeGovernancePlanning {
  const rollbackPlanningSteps = withDeterministicIds(
    "gov-runtime-final-rollback",
    ROLLBACK_STEP_DEFINITIONS.map((item) => ({ ...item, required: true as const })),
    (item) => item.key
  );
  return {
    schemaVersion: 1,
    rollbackExecutionAllowed: false,
    rollbackPrepared: false,
    rollbackPlanningSteps,
    reason: "Rollback/freeze governance planning is planning-only; no rollback was prepared or executed."
  };
}

function warningsFor(conclusion: GovernanceRuntimeSafetyFinalReviewPreview["runtimeFinalReviewConclusion"]): string[] {
  const warnings = [
    "Runtime safety final review preview is advisory only.",
    "Runtime final review approval was not granted.",
    "Runtime final review was not applied or enforced.",
    "Runtime activation approval was not granted.",
    "Runtime activation was not executed.",
    "Runtime freeze was not applied, enforced, or executed.",
    "Runtime boundaries were not applied or enforced.",
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
  if (conclusion === "source-missing") warnings.unshift("Runtime activation freeze source is missing; final review preview is incomplete.");
  if (conclusion === "not-ready") warnings.unshift("Runtime activation freeze preview is not ready for final review preview.");
  if (conclusion === "future-final-review-ready") warnings.unshift("Runtime safety final review preview is ready for future final review only.");
  if (conclusion === "blocked") warnings.unshift("Runtime activation freeze preview is blocked; final review preview is blocked.");
  return warnings;
}

export function buildGovernanceRuntimeSafetyFinalReviewPreviewFromFreeze(source: GovernanceRuntimeActivationFreezePreview): GovernanceRuntimeSafetyFinalReviewPreview {
  const conclusion = conclusionFor(source);
  const architectureCompletenessScore = scoreFor(conclusion.runtimeFinalReviewConclusion);
  const finalReviewDomains = buildDomains(conclusion.runtimeFinalReviewConclusion);
  const finalReviewFindings = buildFindings();
  const finalReviewBlockers = buildBlockers();
  const forbiddenRuntimeFindings = buildForbiddenFindings();
  const rollbackFreezeGovernancePlanning = buildRollbackPlanning();

  return {
    schemaVersion: 1,
    previewStatus: conclusion.previewStatus,
    sourceRuntimeFreezeStatus: source.previewStatus,
    runtimeFinalReviewConclusion: conclusion.runtimeFinalReviewConclusion,
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
    architectureCompletenessScore,
    finalReviewDomains,
    finalReviewFindings,
    finalReviewBlockers,
    forbiddenRuntimeFindings,
    rollbackFreezeGovernancePlanning,
    summary: {
      architectureCompletenessScoreValue: architectureCompletenessScore.score,
      totalDomains: finalReviewDomains.length,
      passedDomains: finalReviewDomains.filter((item) => item.domainStatus === "passed-preview").length,
      warningDomains: finalReviewDomains.filter((item) => item.domainStatus === "warning").length,
      blockedDomains: finalReviewDomains.filter((item) => item.domainStatus === "blocked").length,
      totalFindings: finalReviewFindings.length,
      totalBlockers: finalReviewBlockers.length,
      totalForbiddenRuntimeFindings: forbiddenRuntimeFindings.length,
      rollbackPlanningSteps: rollbackFreezeGovernancePlanning.rollbackPlanningSteps.length,
      futureFinalReviewReady: conclusion.runtimeFinalReviewConclusion === "future-final-review-ready"
    },
    warnings: warningsFor(conclusion.runtimeFinalReviewConclusion),
    recommendedNextStage: conclusion.recommendedNextStage
  };
}

export function buildGovernanceRuntimeSafetyFinalReviewPreview(projectRoot: string): GovernanceRuntimeSafetyFinalReviewPreview {
  return buildGovernanceRuntimeSafetyFinalReviewPreviewFromFreeze(buildGovernanceRuntimeActivationFreezePreview(projectRoot));
}

export function renderGovernanceRuntimeSafetyFinalReviewPreviewMarkdown(preview: GovernanceRuntimeSafetyFinalReviewPreview): string {
  const lines = [
    "# AI Software Factory - Runtime Safety Final Review Preview",
    "",
    "Preview status:", preview.previewStatus,
    "", "Source runtime freeze status:", preview.sourceRuntimeFreezeStatus,
    "", "Runtime final review conclusion:", preview.runtimeFinalReviewConclusion,
    "", "Runtime final review approved:", String(preview.runtimeFinalReviewApproved),
    "", "Runtime final review applied:", String(preview.runtimeFinalReviewApplied),
    "", "Runtime final review enforced:", String(preview.runtimeFinalReviewEnforced),
    "", "Runtime activation approved:", String(preview.runtimeActivationApproved),
    "", "Runtime activation executed:", String(preview.runtimeActivationExecuted),
    "", "Runtime freeze applied:", String(preview.runtimeFreezeApplied),
    "", "Runtime freeze enforced:", String(preview.runtimeFreezeEnforced),
    "", "Runtime freeze executed:", String(preview.runtimeFreezeExecuted),
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
    "", "Architecture completeness score:", String(preview.architectureCompletenessScore.score),
    "", "Architecture completeness rating:", preview.architectureCompletenessScore.rating,
    "", "Domain count:", String(preview.summary.totalDomains),
    "", "Finding count:", String(preview.summary.totalFindings),
    "", "Blocker count:", String(preview.summary.totalBlockers),
    "", "Forbidden runtime finding count:", String(preview.summary.totalForbiddenRuntimeFindings),
    "", "Rollback planning step count:", String(preview.summary.rollbackPlanningSteps),
    "", "Future final review ready:", String(preview.summary.futureFinalReviewReady),
    "", "Recommended next stage:", preview.recommendedNextStage,
    "", "## Final Review Domains", ""
  ];
  for (const item of preview.finalReviewDomains) lines.push(`- [${item.category}/${item.domainStatus}/approved=${String(item.approved)}] ${item.id} ${item.key} - ${item.reason}`);
  lines.push("", "## Final Review Findings", "");
  for (const item of preview.finalReviewFindings) lines.push(`- [${item.severity}] ${item.id} ${item.key} - ${item.reason}`);
  lines.push("", "## Final Review Blockers", "");
  for (const item of preview.finalReviewBlockers) lines.push(`- [${item.severity}] ${item.id} ${item.key} - ${item.reason}`);
  lines.push("", "## Forbidden Runtime Findings", "");
  for (const item of preview.forbiddenRuntimeFindings) lines.push(`- [${item.category}] ${item.id} permanentlyForbidden=${String(item.permanentlyForbidden)} - ${item.reason}`);
  lines.push("", "## Rollback/Freeze Governance Planning", "");
  lines.push(`Rollback execution allowed: ${String(preview.rollbackFreezeGovernancePlanning.rollbackExecutionAllowed)}`);
  lines.push(`Rollback prepared: ${String(preview.rollbackFreezeGovernancePlanning.rollbackPrepared)}`);
  lines.push(`Reason: ${preview.rollbackFreezeGovernancePlanning.reason}`);
  for (const item of preview.rollbackFreezeGovernancePlanning.rollbackPlanningSteps) lines.push(`- ${item.id} ${item.key} required=${String(item.required)} - ${item.reason}`);
  lines.push("", "## Warnings", "");
  for (const warning of preview.warnings) lines.push(`- ${warning}`);
  return `${lines.join("\n")}\n`;
}

export function renderGovernanceRuntimeSafetyFinalReviewPreviewText(preview: GovernanceRuntimeSafetyFinalReviewPreview): string {
  return renderGovernanceRuntimeSafetyFinalReviewPreviewMarkdown(preview);
}

export function writeGovernanceRuntimeSafetyFinalReviewPreviewArtifacts(projectRoot: string, preview: GovernanceRuntimeSafetyFinalReviewPreview): { jsonPath: string; markdownPath: string } {
  const jsonPath = path.join(projectRoot, ARTIFACT_JSON_PATH);
  const markdownPath = path.join(projectRoot, ARTIFACT_MARKDOWN_PATH);
  fs.ensureDirSync(path.dirname(jsonPath));
  fs.writeFileSync(jsonPath, `${JSON.stringify(preview, null, 2)}\n`, "utf8");
  fs.writeFileSync(markdownPath, renderGovernanceRuntimeSafetyFinalReviewPreviewMarkdown(preview), "utf8");
  return { jsonPath: ARTIFACT_JSON_PATH, markdownPath: ARTIFACT_MARKDOWN_PATH };
}
