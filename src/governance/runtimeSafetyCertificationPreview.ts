import fs from "fs-extra";
import path from "node:path";

import {
  buildGovernanceRuntimeActivationReadinessPreview,
  type GovernanceRuntimeActivationReadinessPreview
} from "./runtimeActivationReadinessPreview.js";

export type GovernanceRuntimeCertificationScore = {
  score: 0 | 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90 | 100;
  rating: "blocked" | "not-ready" | "partial-review-readiness" | "future-review-ready";
  reason: string;
};

export type GovernanceRuntimeCertificationDomain = {
  id: string;
  key: string;
  category:
    | "runtime-safety"
    | "runtime-observability"
    | "runtime-control-plane"
    | "runtime-lifecycle"
    | "runtime-activation-readiness"
    | "runtime-forbidden-capabilities"
    | "safe-patch-engine";
  domainStatus: "passed-preview" | "warning" | "blocked";
  reason: string;
  certified: false;
};

export type GovernanceRuntimeCertificationFinding = {
  id: string;
  severity: "info" | "warning" | "high";
  key: string;
  reason: string;
};

export type GovernanceRuntimeCertificationBlocker = {
  id: string;
  severity: "high" | "critical";
  key: string;
  reason: string;
};

export type GovernanceRuntimeForbiddenCapabilityFinding = {
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

export type GovernanceRuntimeCertificationRecommendation = {
  id: string;
  priority: "low" | "medium" | "high";
  key: string;
  reason: string;
};

export type GovernanceRuntimeSafetyCertificationPreview = {
  schemaVersion: 1;
  previewStatus: "not-created" | "created" | "blocked";
  sourceRuntimeActivationReadinessStatus: "not-created" | "created" | "blocked";
  runtimeCertificationConclusion:
    | "source-missing"
    | "not-ready"
    | "future-review-ready"
    | "blocked";
  runtimeCertified: false;
  runtimeCertificationApplied: false;
  runtimeCertificationEnforced: false;
  runtimeGovernanceEnabled: false;
  runtimeAutonomyEnabled: false;
  runtimeAutonomyActionsAllowed: false;
  runtimeActivationExecuted: false;
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
  certificationScore: GovernanceRuntimeCertificationScore;
  certificationDomains: GovernanceRuntimeCertificationDomain[];
  certificationFindings: GovernanceRuntimeCertificationFinding[];
  certificationBlockers: GovernanceRuntimeCertificationBlocker[];
  forbiddenCapabilityFindings: GovernanceRuntimeForbiddenCapabilityFinding[];
  certificationRecommendations: GovernanceRuntimeCertificationRecommendation[];
  summary: {
    certificationScoreValue: number;
    totalDomains: number;
    passedDomains: number;
    warningDomains: number;
    blockedDomains: number;
    totalFindings: number;
    totalBlockers: number;
    totalForbiddenCapabilityFindings: number;
    totalRecommendations: number;
    futureReviewReady: boolean;
  };
  warnings: string[];
  recommendedNextStage:
    | "continue-runtime-safety-hardening"
    | "prepare-runtime-activation-governance-review"
    | "blocked";
};

const ARTIFACT_JSON_PATH = ".factory/governance/runtime-safety-certification-preview.json";
const ARTIFACT_MARKDOWN_PATH = ".factory/governance/runtime-safety-certification-preview.md";

const DOMAIN_DEFINITIONS: Array<Omit<GovernanceRuntimeCertificationDomain, "id" | "domainStatus" | "certified">> = [
  { key: "forbidden-capability-prevention", category: "runtime-forbidden-capabilities", reason: "Forbidden runtime capabilities remain documented and permanently blocked." },
  { key: "runtime-activation-readiness", category: "runtime-activation-readiness", reason: "Runtime activation readiness is evaluated as preview-only." },
  { key: "runtime-control-plane", category: "runtime-control-plane", reason: "Runtime control plane controls are modeled but not applied." },
  { key: "runtime-governance-lifecycle", category: "runtime-lifecycle", reason: "Runtime governance lifecycle transitions remain preview-only." },
  { key: "runtime-observability", category: "runtime-observability", reason: "Runtime observability definitions are modeled but not executed." },
  { key: "runtime-safety-architecture", category: "runtime-safety", reason: "Runtime safety architecture remains a deterministic preview." },
  { key: "safe-patch-engine-exclusivity", category: "safe-patch-engine", reason: "Safe Patch Engine remains the only mutation layer." }
];

const FINDING_DEFINITIONS: Array<Omit<GovernanceRuntimeCertificationFinding, "id">> = [
  { key: "certification-preview-only", severity: "info", reason: "Runtime safety certification is preview-only and cannot certify execution." },
  { key: "runtime-activation-not-executed", severity: "info", reason: "Runtime activation was not executed." },
  { key: "runtime-governance-disabled", severity: "warning", reason: "Runtime governance remains disabled." },
  { key: "runtime-policy-enforcement-disabled", severity: "warning", reason: "Runtime policy enforcement remains disabled." },
  { key: "runtime-rollback-unavailable", severity: "high", reason: "Runtime rollback execution is unavailable in preview mode." },
  { key: "safe-patch-engine-only", severity: "info", reason: "Safe Patch Engine exclusivity remains preserved." }
];

const BLOCKER_DEFINITIONS: Array<Omit<GovernanceRuntimeCertificationBlocker, "id">> = [
  { key: "missing-human-governance-review", severity: "high", reason: "Future human governance review is required before any certification could be considered." },
  { key: "missing-runtime-activation-review", severity: "high", reason: "Future runtime activation review is required and not approved." },
  { key: "missing-runtime-freeze-validation", severity: "high", reason: "Future runtime freeze validation is required." },
  { key: "runtime-activation-unavailable", severity: "critical", reason: "Runtime activation is unavailable in preview mode." },
  { key: "runtime-autonomy-disabled", severity: "high", reason: "Runtime autonomy remains disabled." },
  { key: "runtime-certification-preview-only", severity: "high", reason: "Runtime certification preview cannot certify execution." },
  { key: "runtime-governance-disabled", severity: "high", reason: "Runtime governance remains disabled." },
  { key: "runtime-rollback-execution-unavailable", severity: "high", reason: "Runtime rollback execution is unavailable in preview mode." }
];

const FORBIDDEN_CAPABILITY_DEFINITIONS: Array<Omit<GovernanceRuntimeForbiddenCapabilityFinding, "id" | "permanentlyForbidden">> = [
  { category: "mutation-scope-expansion", reason: "Mutation scope expansion remains permanently forbidden." },
  { category: "runtime-autonomy", reason: "Runtime autonomy remains forbidden for execution in certification preview." },
  { category: "runtime-learning", reason: "Runtime learning governance remains permanently forbidden." },
  { category: "runtime-ml-decisioning", reason: "ML/vector DB governance decisioning remains permanently forbidden." },
  { category: "runtime-multi-agent-coordination", reason: "Uncontrolled runtime multi-agent coordination remains permanently forbidden." },
  { category: "runtime-plugin-execution", reason: "Runtime plugin execution remains permanently forbidden." },
  { category: "runtime-policy-enforcement", reason: "Runtime policy enforcement is not enabled by certification preview." },
  { category: "runtime-script-execution", reason: "Runtime script execution remains permanently forbidden." },
  { category: "safe-patch-engine-bypass", reason: "Safe Patch Engine bypass remains permanently forbidden." }
];

const RECOMMENDATION_DEFINITIONS: Array<Omit<GovernanceRuntimeCertificationRecommendation, "id">> = [
  { key: "continue-runtime-safety-hardening", priority: "high", reason: "Continue hardening runtime safety previews before any future certification review." },
  { key: "continue-governance-bypass-prevention", priority: "high", reason: "Continue verifying governance bypass prevention." },
  { key: "continue-safe-patch-engine-verification", priority: "high", reason: "Continue verifying Safe Patch Engine exclusivity." },
  { key: "expand-runtime-review-evidence", priority: "medium", reason: "Add future runtime review evidence before certification review." },
  { key: "expand-runtime-rollback-planning", priority: "medium", reason: "Add future runtime rollback planning evidence." },
  { key: "expand-runtime-freeze-validation", priority: "medium", reason: "Add future runtime freeze validation evidence." }
];

function withDeterministicIds<T>(prefix: string, items: T[], sortKey: (item: T) => string): Array<T & { id: string }> {
  return [...items]
    .sort((a, b) => sortKey(a).localeCompare(sortKey(b)))
    .map((item, index) => ({ id: `${prefix}-${String(index + 1).padStart(3, "0")}`, ...item }));
}

function conclusionFor(source: GovernanceRuntimeActivationReadinessPreview): Pick<GovernanceRuntimeSafetyCertificationPreview, "previewStatus" | "runtimeCertificationConclusion" | "recommendedNextStage"> {
  if (source.previewStatus === "not-created") {
    return { previewStatus: "not-created", runtimeCertificationConclusion: "source-missing", recommendedNextStage: "continue-runtime-safety-hardening" };
  }
  if (source.previewStatus === "blocked") {
    return { previewStatus: "blocked", runtimeCertificationConclusion: "blocked", recommendedNextStage: "blocked" };
  }
  if (source.runtimeActivationReadinessConclusion === "ready-for-future-review") {
    return { previewStatus: "created", runtimeCertificationConclusion: "future-review-ready", recommendedNextStage: "prepare-runtime-activation-governance-review" };
  }
  return { previewStatus: "created", runtimeCertificationConclusion: "not-ready", recommendedNextStage: "continue-runtime-safety-hardening" };
}

function scoreFor(conclusion: GovernanceRuntimeSafetyCertificationPreview["runtimeCertificationConclusion"]): GovernanceRuntimeCertificationScore {
  if (conclusion === "blocked") return { score: 0, rating: "blocked", reason: "Runtime safety certification preview is blocked by activation readiness." };
  if (conclusion === "source-missing") return { score: 20, rating: "not-ready", reason: "Runtime activation readiness preview is missing." };
  if (conclusion === "not-ready") return { score: 40, rating: "partial-review-readiness", reason: "Runtime activation readiness exists but is not ready for future certification review." };
  return { score: 80, rating: "future-review-ready", reason: "Runtime certification preview is ready for future review only; certification is not applied." };
}

function domainStatusFor(conclusion: GovernanceRuntimeSafetyCertificationPreview["runtimeCertificationConclusion"]): GovernanceRuntimeCertificationDomain["domainStatus"] {
  if (conclusion === "blocked") return "blocked";
  if (conclusion === "future-review-ready") return "passed-preview";
  return "warning";
}

function buildDomains(conclusion: GovernanceRuntimeSafetyCertificationPreview["runtimeCertificationConclusion"]): GovernanceRuntimeCertificationDomain[] {
  return withDeterministicIds(
    "gov-runtime-cert-domain",
    DOMAIN_DEFINITIONS.map((item) => ({
      ...item,
      domainStatus: domainStatusFor(conclusion),
      certified: false
    })),
    (item) => `${item.category}:${item.key}:${item.domainStatus}`
  );
}

function buildFindings(): GovernanceRuntimeCertificationFinding[] {
  return withDeterministicIds("gov-runtime-cert-finding", FINDING_DEFINITIONS, (item) => `${item.severity}:${item.key}`);
}

function buildBlockers(conclusion: GovernanceRuntimeSafetyCertificationPreview["runtimeCertificationConclusion"]): GovernanceRuntimeCertificationBlocker[] {
  const blockers = conclusion === "future-review-ready"
    ? BLOCKER_DEFINITIONS.filter((item) => item.key !== "missing-runtime-activation-review" && item.key !== "missing-runtime-freeze-validation")
    : BLOCKER_DEFINITIONS;
  return withDeterministicIds("gov-runtime-cert-blocker", blockers, (item) => `${item.severity}:${item.key}`);
}

function buildForbiddenCapabilityFindings(): GovernanceRuntimeForbiddenCapabilityFinding[] {
  return withDeterministicIds(
    "gov-runtime-cert-forbidden",
    FORBIDDEN_CAPABILITY_DEFINITIONS.map((item) => ({ ...item, permanentlyForbidden: true })),
    (item) => item.category
  );
}

function buildRecommendations(): GovernanceRuntimeCertificationRecommendation[] {
  return withDeterministicIds("gov-runtime-cert-recommendation", RECOMMENDATION_DEFINITIONS, (item) => `${item.priority}:${item.key}`);
}

function warningsFor(conclusion: GovernanceRuntimeSafetyCertificationPreview["runtimeCertificationConclusion"]): string[] {
  const warnings = [
    "Runtime safety certification preview is advisory only.",
    "Runtime governance was not certified for execution.",
    "Runtime certification was not applied or enforced.",
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
  if (conclusion === "source-missing") warnings.unshift("Runtime activation readiness source is missing; certification preview is incomplete.");
  if (conclusion === "not-ready") warnings.unshift("Runtime activation readiness is not ready for certification preview.");
  if (conclusion === "future-review-ready") warnings.unshift("Runtime safety certification preview is ready for future review only.");
  if (conclusion === "blocked") warnings.unshift("Runtime activation readiness is blocked; certification preview is blocked.");
  return warnings;
}

export function buildGovernanceRuntimeSafetyCertificationPreviewFromReadiness(source: GovernanceRuntimeActivationReadinessPreview): GovernanceRuntimeSafetyCertificationPreview {
  const conclusion = conclusionFor(source);
  const certificationScore = scoreFor(conclusion.runtimeCertificationConclusion);
  const certificationDomains = buildDomains(conclusion.runtimeCertificationConclusion);
  const certificationFindings = buildFindings();
  const certificationBlockers = buildBlockers(conclusion.runtimeCertificationConclusion);
  const forbiddenCapabilityFindings = buildForbiddenCapabilityFindings();
  const certificationRecommendations = buildRecommendations();

  return {
    schemaVersion: 1,
    previewStatus: conclusion.previewStatus,
    sourceRuntimeActivationReadinessStatus: source.previewStatus,
    runtimeCertificationConclusion: conclusion.runtimeCertificationConclusion,
    runtimeCertified: false,
    runtimeCertificationApplied: false,
    runtimeCertificationEnforced: false,
    runtimeGovernanceEnabled: false,
    runtimeAutonomyEnabled: false,
    runtimeAutonomyActionsAllowed: false,
    runtimeActivationExecuted: false,
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
    certificationScore,
    certificationDomains,
    certificationFindings,
    certificationBlockers,
    forbiddenCapabilityFindings,
    certificationRecommendations,
    summary: {
      certificationScoreValue: certificationScore.score,
      totalDomains: certificationDomains.length,
      passedDomains: certificationDomains.filter((item) => item.domainStatus === "passed-preview").length,
      warningDomains: certificationDomains.filter((item) => item.domainStatus === "warning").length,
      blockedDomains: certificationDomains.filter((item) => item.domainStatus === "blocked").length,
      totalFindings: certificationFindings.length,
      totalBlockers: certificationBlockers.length,
      totalForbiddenCapabilityFindings: forbiddenCapabilityFindings.length,
      totalRecommendations: certificationRecommendations.length,
      futureReviewReady: conclusion.runtimeCertificationConclusion === "future-review-ready"
    },
    warnings: warningsFor(conclusion.runtimeCertificationConclusion),
    recommendedNextStage: conclusion.recommendedNextStage
  };
}

export function buildGovernanceRuntimeSafetyCertificationPreview(projectRoot: string): GovernanceRuntimeSafetyCertificationPreview {
  return buildGovernanceRuntimeSafetyCertificationPreviewFromReadiness(buildGovernanceRuntimeActivationReadinessPreview(projectRoot));
}

export function renderGovernanceRuntimeSafetyCertificationPreviewMarkdown(preview: GovernanceRuntimeSafetyCertificationPreview): string {
  const lines = [
    "# AI Software Factory - Runtime Safety Certification Preview",
    "",
    "Preview status:", preview.previewStatus,
    "", "Source runtime activation readiness status:", preview.sourceRuntimeActivationReadinessStatus,
    "", "Runtime certification conclusion:", preview.runtimeCertificationConclusion,
    "", "Runtime certified:", String(preview.runtimeCertified),
    "", "Runtime certification applied:", String(preview.runtimeCertificationApplied),
    "", "Runtime certification enforced:", String(preview.runtimeCertificationEnforced),
    "", "Runtime governance enabled:", String(preview.runtimeGovernanceEnabled),
    "", "Runtime autonomy enabled:", String(preview.runtimeAutonomyEnabled),
    "", "Runtime autonomy actions allowed:", String(preview.runtimeAutonomyActionsAllowed),
    "", "Runtime activation executed:", String(preview.runtimeActivationExecuted),
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
    "", "Certification score:", String(preview.certificationScore.score),
    "", "Certification rating:", preview.certificationScore.rating,
    "", "Domain count:", String(preview.summary.totalDomains),
    "", "Finding count:", String(preview.summary.totalFindings),
    "", "Blocker count:", String(preview.summary.totalBlockers),
    "", "Forbidden capability finding count:", String(preview.summary.totalForbiddenCapabilityFindings),
    "", "Recommendation count:", String(preview.summary.totalRecommendations),
    "", "Future review ready:", String(preview.summary.futureReviewReady),
    "", "Recommended next stage:", preview.recommendedNextStage,
    "", "## Certification Domains", ""
  ];
  for (const item of preview.certificationDomains) lines.push(`- [${item.category}/${item.domainStatus}/certified=${String(item.certified)}] ${item.id} ${item.key} - ${item.reason}`);
  lines.push("", "## Certification Findings", "");
  for (const item of preview.certificationFindings) lines.push(`- [${item.severity}] ${item.id} ${item.key} - ${item.reason}`);
  lines.push("", "## Certification Blockers", "");
  for (const item of preview.certificationBlockers) lines.push(`- [${item.severity}] ${item.id} ${item.key} - ${item.reason}`);
  lines.push("", "## Forbidden Runtime Capability Findings", "");
  for (const item of preview.forbiddenCapabilityFindings) lines.push(`- [${item.category}] ${item.id} permanentlyForbidden=${String(item.permanentlyForbidden)} - ${item.reason}`);
  lines.push("", "## Certification Recommendations", "");
  for (const item of preview.certificationRecommendations) lines.push(`- [${item.priority}] ${item.id} ${item.key} - ${item.reason}`);
  lines.push("", "## Warnings", "");
  for (const warning of preview.warnings) lines.push(`- ${warning}`);
  return `${lines.join("\n")}\n`;
}

export function renderGovernanceRuntimeSafetyCertificationPreviewText(preview: GovernanceRuntimeSafetyCertificationPreview): string {
  return renderGovernanceRuntimeSafetyCertificationPreviewMarkdown(preview);
}

export function writeGovernanceRuntimeSafetyCertificationPreviewArtifacts(projectRoot: string, preview: GovernanceRuntimeSafetyCertificationPreview): { jsonPath: string; markdownPath: string } {
  const jsonPath = path.join(projectRoot, ARTIFACT_JSON_PATH);
  const markdownPath = path.join(projectRoot, ARTIFACT_MARKDOWN_PATH);
  fs.ensureDirSync(path.dirname(jsonPath));
  fs.writeFileSync(jsonPath, `${JSON.stringify(preview, null, 2)}\n`, "utf8");
  fs.writeFileSync(markdownPath, renderGovernanceRuntimeSafetyCertificationPreviewMarkdown(preview), "utf8");
  return { jsonPath: ARTIFACT_JSON_PATH, markdownPath: ARTIFACT_MARKDOWN_PATH };
}
