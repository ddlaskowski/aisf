import fs from "fs-extra";
import path from "node:path";

import {
  buildGovernanceRuntimeActivationBoundaryPreview,
  type GovernanceRuntimeActivationBoundaryPreview
} from "./runtimeActivationBoundaryPreview.js";

export type GovernanceRuntimeFreezeScore = {
  score: 0 | 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90 | 100;
  rating: "blocked" | "not-ready" | "partial-freeze-readiness" | "future-freeze-review-ready";
  reason: string;
};

export type GovernanceRuntimeFreezeDomain = {
  id: string;
  key: string;
  category:
    | "activation-freeze"
    | "policy-freeze"
    | "autonomy-freeze"
    | "mutation-freeze"
    | "external-execution-freeze"
    | "rollback-freeze"
    | "safe-patch-engine-freeze";
  domainStatus: "passed-preview" | "warning" | "blocked";
  reason: string;
  applied: false;
};

export type GovernanceRuntimeFreezeCondition = {
  id: string;
  key: string;
  category:
    | "activation-freeze"
    | "policy-freeze"
    | "autonomy-freeze"
    | "mutation-freeze"
    | "external-execution-freeze"
    | "rollback-freeze";
  freezeType: "hard-freeze" | "future-review-only" | "permanently-forbidden";
  reason: string;
};

export type GovernanceRuntimeFreezeBlocker = {
  id: string;
  severity: "high" | "critical";
  key: string;
  reason: string;
};

export type GovernanceRuntimeFreezeTriggerFinding = {
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

export type GovernanceRuntimeRollbackFreezeStep = {
  id: string;
  key: string;
  required: true;
  reason: string;
};

export type GovernanceRuntimeRollbackFreezePlanning = {
  schemaVersion: 1;
  rollbackExecutionAllowed: false;
  rollbackPrepared: false;
  rollbackPlanningSteps: GovernanceRuntimeRollbackFreezeStep[];
  reason: string;
};

export type GovernanceRuntimeActivationFreezePreview = {
  schemaVersion: 1;
  previewStatus: "not-created" | "created" | "blocked";
  sourceRuntimeBoundaryStatus: "not-created" | "created" | "blocked";
  runtimeFreezeConclusion: "source-missing" | "not-ready" | "future-freeze-review-ready" | "blocked";
  runtimeFreezeApplied: false;
  runtimeFreezeEnforced: false;
  runtimeFreezeExecuted: false;
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
  freezeScore: GovernanceRuntimeFreezeScore;
  freezeDomains: GovernanceRuntimeFreezeDomain[];
  freezeConditions: GovernanceRuntimeFreezeCondition[];
  freezeBlockers: GovernanceRuntimeFreezeBlocker[];
  freezeTriggerFindings: GovernanceRuntimeFreezeTriggerFinding[];
  rollbackFreezePlanning: GovernanceRuntimeRollbackFreezePlanning;
  summary: {
    freezeScoreValue: number;
    totalDomains: number;
    passedDomains: number;
    warningDomains: number;
    blockedDomains: number;
    totalConditions: number;
    totalBlockers: number;
    totalFreezeTriggerFindings: number;
    rollbackPlanningSteps: number;
    futureFreezeReviewReady: boolean;
  };
  warnings: string[];
  recommendedNextStage:
    | "continue-runtime-safety-hardening"
    | "prepare-runtime-safety-final-review-preview"
    | "blocked";
};

const ARTIFACT_JSON_PATH = ".factory/governance/runtime-activation-freeze-preview.json";
const ARTIFACT_MARKDOWN_PATH = ".factory/governance/runtime-activation-freeze-preview.md";

const DOMAIN_DEFINITIONS: Array<Omit<GovernanceRuntimeFreezeDomain, "id" | "domainStatus" | "applied">> = [
  { key: "runtime-activation-freeze", category: "activation-freeze", reason: "Runtime activation remains frozen unless future review explicitly changes preview-only posture." },
  { key: "runtime-autonomy-freeze", category: "autonomy-freeze", reason: "Runtime autonomy remains frozen and disabled." },
  { key: "runtime-external-execution-freeze", category: "external-execution-freeze", reason: "Runtime external execution remains frozen and unavailable." },
  { key: "runtime-mutation-freeze", category: "mutation-freeze", reason: "Runtime mutation scope remains frozen." },
  { key: "runtime-policy-freeze", category: "policy-freeze", reason: "Runtime policy enforcement remains frozen and disabled." },
  { key: "runtime-rollback-freeze", category: "rollback-freeze", reason: "Runtime rollback execution remains frozen and planning-only." },
  { key: "safe-patch-engine-exclusivity-freeze", category: "safe-patch-engine-freeze", reason: "Safe Patch Engine exclusivity remains frozen as the only mutation layer." }
];

const CONDITION_DEFINITIONS: Array<Omit<GovernanceRuntimeFreezeCondition, "id">> = [
  { key: "rollback-execution-frozen", category: "rollback-freeze", freezeType: "future-review-only", reason: "Runtime rollback execution remains frozen and unavailable." },
  { key: "runtime-activation-frozen", category: "activation-freeze", freezeType: "hard-freeze", reason: "Runtime activation remains frozen and not approved." },
  { key: "runtime-autonomy-frozen", category: "autonomy-freeze", freezeType: "permanently-forbidden", reason: "Runtime autonomy remains frozen and forbidden for execution." },
  { key: "runtime-external-execution-frozen", category: "external-execution-freeze", freezeType: "permanently-forbidden", reason: "Runtime external execution remains frozen and forbidden." },
  { key: "runtime-mutation-scope-frozen", category: "mutation-freeze", freezeType: "permanently-forbidden", reason: "Runtime mutation scope remains frozen and cannot expand." },
  { key: "runtime-policy-enforcement-frozen", category: "policy-freeze", freezeType: "hard-freeze", reason: "Runtime policy enforcement remains frozen and disabled." },
  { key: "safe-patch-engine-exclusivity-frozen", category: "mutation-freeze", freezeType: "hard-freeze", reason: "Safe Patch Engine exclusivity remains frozen and mandatory." }
];

const BLOCKER_DEFINITIONS: Array<Omit<GovernanceRuntimeFreezeBlocker, "id">> = [
  { key: "missing-freeze-validation", severity: "high", reason: "Future freeze validation is required before runtime activation could be reconsidered." },
  { key: "missing-governance-freeze-review", severity: "high", reason: "Future governance freeze review is required." },
  { key: "missing-rollback-freeze-review", severity: "high", reason: "Future rollback freeze review is required." },
  { key: "runtime-activation-unavailable", severity: "critical", reason: "Runtime activation is unavailable in preview mode." },
  { key: "runtime-autonomy-disabled", severity: "high", reason: "Runtime autonomy remains disabled." },
  { key: "runtime-freeze-enforcement-unavailable", severity: "critical", reason: "Runtime freeze enforcement is unavailable in preview mode." },
  { key: "runtime-governance-disabled", severity: "high", reason: "Runtime governance remains disabled." }
];

const TRIGGER_DEFINITIONS: Array<Omit<GovernanceRuntimeFreezeTriggerFinding, "id" | "permanentlyForbidden">> = [
  { category: "mutation-scope-expansion", reason: "Mutation scope expansion remains a permanently forbidden freeze trigger." },
  { category: "runtime-autonomy", reason: "Runtime autonomy enablement remains a permanently forbidden freeze trigger." },
  { category: "runtime-learning", reason: "Runtime learning enablement remains a permanently forbidden freeze trigger." },
  { category: "runtime-ml-decisioning", reason: "ML/vector DB governance decisioning remains a permanently forbidden freeze trigger." },
  { category: "runtime-multi-agent-coordination", reason: "Uncontrolled runtime multi-agent coordination remains a permanently forbidden freeze trigger." },
  { category: "runtime-plugin-execution", reason: "Runtime plugin execution remains a permanently forbidden freeze trigger." },
  { category: "runtime-policy-enforcement", reason: "Runtime policy enforcement enablement remains a permanently forbidden freeze trigger." },
  { category: "runtime-script-execution", reason: "Runtime script execution remains a permanently forbidden freeze trigger." },
  { category: "safe-patch-engine-bypass", reason: "Safe Patch Engine bypass remains a permanently forbidden freeze trigger." }
];

const ROLLBACK_STEP_DEFINITIONS: Array<Omit<GovernanceRuntimeRollbackFreezeStep, "id" | "required">> = [
  { key: "future-audit-preservation-planning", reason: "Future runtime freeze review must preserve deterministic audit evidence." },
  { key: "future-mutation-boundary-verification-planning", reason: "Future runtime freeze review must verify mutation boundaries remain unchanged." },
  { key: "future-runtime-autonomy-shutdown-planning", reason: "Future runtime freeze review must define runtime autonomy shutdown planning." },
  { key: "future-runtime-governance-shutdown-planning", reason: "Future runtime freeze review must define runtime governance shutdown planning." },
  { key: "future-runtime-policy-freeze-planning", reason: "Future runtime freeze review must define runtime policy freeze planning." },
  { key: "future-runtime-rollback-verification-planning", reason: "Future runtime freeze review must define runtime rollback verification planning." },
  { key: "future-safe-patch-engine-verification-planning", reason: "Future runtime freeze review must verify Safe Patch Engine exclusivity." }
];

function withDeterministicIds<T>(prefix: string, items: T[], sortKey: (item: T) => string): Array<T & { id: string }> {
  return [...items]
    .sort((a, b) => sortKey(a).localeCompare(sortKey(b)))
    .map((item, index) => ({ id: `${prefix}-${String(index + 1).padStart(3, "0")}`, ...item }));
}

function conclusionFor(source: GovernanceRuntimeActivationBoundaryPreview): Pick<GovernanceRuntimeActivationFreezePreview, "previewStatus" | "runtimeFreezeConclusion" | "recommendedNextStage"> {
  if (source.previewStatus === "not-created") {
    return { previewStatus: "not-created", runtimeFreezeConclusion: "source-missing", recommendedNextStage: "continue-runtime-safety-hardening" };
  }
  if (source.previewStatus === "blocked") {
    return { previewStatus: "blocked", runtimeFreezeConclusion: "blocked", recommendedNextStage: "blocked" };
  }
  if (source.runtimeBoundaryConclusion === "future-boundary-review-ready") {
    return { previewStatus: "created", runtimeFreezeConclusion: "future-freeze-review-ready", recommendedNextStage: "prepare-runtime-safety-final-review-preview" };
  }
  return { previewStatus: "created", runtimeFreezeConclusion: "not-ready", recommendedNextStage: "continue-runtime-safety-hardening" };
}

function scoreFor(conclusion: GovernanceRuntimeActivationFreezePreview["runtimeFreezeConclusion"]): GovernanceRuntimeFreezeScore {
  if (conclusion === "blocked") return { score: 0, rating: "blocked", reason: "Runtime activation freeze preview is blocked by boundary status." };
  if (conclusion === "source-missing") return { score: 20, rating: "not-ready", reason: "Runtime activation boundary preview is missing." };
  if (conclusion === "not-ready") return { score: 40, rating: "partial-freeze-readiness", reason: "Runtime activation boundary preview exists but is not ready for freeze review." };
  return { score: 80, rating: "future-freeze-review-ready", reason: "Runtime activation freeze preview is ready for future freeze review only; freeze behavior is not applied or executed." };
}

function statusFor(conclusion: GovernanceRuntimeActivationFreezePreview["runtimeFreezeConclusion"]): GovernanceRuntimeFreezeDomain["domainStatus"] {
  if (conclusion === "blocked") return "blocked";
  if (conclusion === "future-freeze-review-ready") return "passed-preview";
  return "warning";
}

function buildDomains(conclusion: GovernanceRuntimeActivationFreezePreview["runtimeFreezeConclusion"]): GovernanceRuntimeFreezeDomain[] {
  return withDeterministicIds(
    "gov-runtime-freeze-domain",
    DOMAIN_DEFINITIONS.map((item) => ({ ...item, domainStatus: statusFor(conclusion), applied: false as const })),
    (item) => `${item.category}:${item.key}:${item.domainStatus}`
  );
}

function buildConditions(): GovernanceRuntimeFreezeCondition[] {
  return withDeterministicIds("gov-runtime-freeze-condition", CONDITION_DEFINITIONS, (item) => `${item.category}:${item.key}:${item.freezeType}`);
}

function buildBlockers(): GovernanceRuntimeFreezeBlocker[] {
  return withDeterministicIds("gov-runtime-freeze-blocker", BLOCKER_DEFINITIONS, (item) => `${item.severity}:${item.key}`);
}

function buildTriggers(): GovernanceRuntimeFreezeTriggerFinding[] {
  return withDeterministicIds(
    "gov-runtime-freeze-trigger",
    TRIGGER_DEFINITIONS.map((item) => ({ ...item, permanentlyForbidden: true as const })),
    (item) => item.category
  );
}

function buildRollbackPlanning(): GovernanceRuntimeRollbackFreezePlanning {
  const rollbackPlanningSteps = withDeterministicIds(
    "gov-runtime-freeze-rollback",
    ROLLBACK_STEP_DEFINITIONS.map((item) => ({ ...item, required: true as const })),
    (item) => item.key
  );
  return {
    schemaVersion: 1,
    rollbackExecutionAllowed: false,
    rollbackPrepared: false,
    rollbackPlanningSteps,
    reason: "Rollback freeze planning is planning-only; no rollback was prepared or executed."
  };
}

function warningsFor(conclusion: GovernanceRuntimeActivationFreezePreview["runtimeFreezeConclusion"]): string[] {
  const warnings = [
    "Runtime activation freeze preview is advisory only.",
    "Runtime freeze was not applied, enforced, or executed.",
    "Runtime activation approval was not granted.",
    "Runtime activation was not executed.",
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
  if (conclusion === "source-missing") warnings.unshift("Runtime activation boundary source is missing; freeze preview is incomplete.");
  if (conclusion === "not-ready") warnings.unshift("Runtime activation boundary preview is not ready for freeze preview.");
  if (conclusion === "future-freeze-review-ready") warnings.unshift("Runtime activation freeze preview is ready for future freeze review only.");
  if (conclusion === "blocked") warnings.unshift("Runtime activation boundary preview is blocked; freeze preview is blocked.");
  return warnings;
}

export function buildGovernanceRuntimeActivationFreezePreviewFromBoundary(source: GovernanceRuntimeActivationBoundaryPreview): GovernanceRuntimeActivationFreezePreview {
  const conclusion = conclusionFor(source);
  const freezeScore = scoreFor(conclusion.runtimeFreezeConclusion);
  const freezeDomains = buildDomains(conclusion.runtimeFreezeConclusion);
  const freezeConditions = buildConditions();
  const freezeBlockers = buildBlockers();
  const freezeTriggerFindings = buildTriggers();
  const rollbackFreezePlanning = buildRollbackPlanning();

  return {
    schemaVersion: 1,
    previewStatus: conclusion.previewStatus,
    sourceRuntimeBoundaryStatus: source.previewStatus,
    runtimeFreezeConclusion: conclusion.runtimeFreezeConclusion,
    runtimeFreezeApplied: false,
    runtimeFreezeEnforced: false,
    runtimeFreezeExecuted: false,
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
    freezeScore,
    freezeDomains,
    freezeConditions,
    freezeBlockers,
    freezeTriggerFindings,
    rollbackFreezePlanning,
    summary: {
      freezeScoreValue: freezeScore.score,
      totalDomains: freezeDomains.length,
      passedDomains: freezeDomains.filter((item) => item.domainStatus === "passed-preview").length,
      warningDomains: freezeDomains.filter((item) => item.domainStatus === "warning").length,
      blockedDomains: freezeDomains.filter((item) => item.domainStatus === "blocked").length,
      totalConditions: freezeConditions.length,
      totalBlockers: freezeBlockers.length,
      totalFreezeTriggerFindings: freezeTriggerFindings.length,
      rollbackPlanningSteps: rollbackFreezePlanning.rollbackPlanningSteps.length,
      futureFreezeReviewReady: conclusion.runtimeFreezeConclusion === "future-freeze-review-ready"
    },
    warnings: warningsFor(conclusion.runtimeFreezeConclusion),
    recommendedNextStage: conclusion.recommendedNextStage
  };
}

export function buildGovernanceRuntimeActivationFreezePreview(projectRoot: string): GovernanceRuntimeActivationFreezePreview {
  return buildGovernanceRuntimeActivationFreezePreviewFromBoundary(buildGovernanceRuntimeActivationBoundaryPreview(projectRoot));
}

export function renderGovernanceRuntimeActivationFreezePreviewMarkdown(preview: GovernanceRuntimeActivationFreezePreview): string {
  const lines = [
    "# AI Software Factory - Runtime Activation Freeze Preview",
    "",
    "Preview status:", preview.previewStatus,
    "", "Source runtime boundary status:", preview.sourceRuntimeBoundaryStatus,
    "", "Runtime freeze conclusion:", preview.runtimeFreezeConclusion,
    "", "Runtime freeze applied:", String(preview.runtimeFreezeApplied),
    "", "Runtime freeze enforced:", String(preview.runtimeFreezeEnforced),
    "", "Runtime freeze executed:", String(preview.runtimeFreezeExecuted),
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
    "", "Freeze score:", String(preview.freezeScore.score),
    "", "Freeze rating:", preview.freezeScore.rating,
    "", "Domain count:", String(preview.summary.totalDomains),
    "", "Condition count:", String(preview.summary.totalConditions),
    "", "Blocker count:", String(preview.summary.totalBlockers),
    "", "Freeze trigger finding count:", String(preview.summary.totalFreezeTriggerFindings),
    "", "Rollback planning step count:", String(preview.summary.rollbackPlanningSteps),
    "", "Future freeze review ready:", String(preview.summary.futureFreezeReviewReady),
    "", "Recommended next stage:", preview.recommendedNextStage,
    "", "## Freeze Domains", ""
  ];
  for (const item of preview.freezeDomains) lines.push(`- [${item.category}/${item.domainStatus}/applied=${String(item.applied)}] ${item.id} ${item.key} - ${item.reason}`);
  lines.push("", "## Freeze Conditions", "");
  for (const item of preview.freezeConditions) lines.push(`- [${item.category}/${item.freezeType}] ${item.id} ${item.key} - ${item.reason}`);
  lines.push("", "## Freeze Blockers", "");
  for (const item of preview.freezeBlockers) lines.push(`- [${item.severity}] ${item.id} ${item.key} - ${item.reason}`);
  lines.push("", "## Freeze Trigger Findings", "");
  for (const item of preview.freezeTriggerFindings) lines.push(`- [${item.category}] ${item.id} permanentlyForbidden=${String(item.permanentlyForbidden)} - ${item.reason}`);
  lines.push("", "## Rollback Freeze Planning", "");
  lines.push(`Rollback execution allowed: ${String(preview.rollbackFreezePlanning.rollbackExecutionAllowed)}`);
  lines.push(`Rollback prepared: ${String(preview.rollbackFreezePlanning.rollbackPrepared)}`);
  lines.push(`Reason: ${preview.rollbackFreezePlanning.reason}`);
  for (const item of preview.rollbackFreezePlanning.rollbackPlanningSteps) lines.push(`- ${item.id} ${item.key} required=${String(item.required)} - ${item.reason}`);
  lines.push("", "## Warnings", "");
  for (const warning of preview.warnings) lines.push(`- ${warning}`);
  return `${lines.join("\n")}\n`;
}

export function renderGovernanceRuntimeActivationFreezePreviewText(preview: GovernanceRuntimeActivationFreezePreview): string {
  return renderGovernanceRuntimeActivationFreezePreviewMarkdown(preview);
}

export function writeGovernanceRuntimeActivationFreezePreviewArtifacts(projectRoot: string, preview: GovernanceRuntimeActivationFreezePreview): { jsonPath: string; markdownPath: string } {
  const jsonPath = path.join(projectRoot, ARTIFACT_JSON_PATH);
  const markdownPath = path.join(projectRoot, ARTIFACT_MARKDOWN_PATH);
  fs.ensureDirSync(path.dirname(jsonPath));
  fs.writeFileSync(jsonPath, `${JSON.stringify(preview, null, 2)}\n`, "utf8");
  fs.writeFileSync(markdownPath, renderGovernanceRuntimeActivationFreezePreviewMarkdown(preview), "utf8");
  return { jsonPath: ARTIFACT_JSON_PATH, markdownPath: ARTIFACT_MARKDOWN_PATH };
}
