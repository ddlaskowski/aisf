import fs from "fs-extra";
import path from "node:path";

import {
  buildGovernanceAutonomyScopePreview,
  type GovernanceAutonomyScopePreview,
  type GovernanceAutonomyScopeCandidate
} from "./autonomyScopePreview.js";

export type GovernanceAutonomyRiskEntry = {
  id: string;
  key: string;
  title: string;
  category:
    | "scope"
    | "approval"
    | "runtime-activation"
    | "policy-enforcement"
    | "repair-orchestration"
    | "mutation-boundary"
    | "safe-patch"
    | "governance-bypass"
    | "external-execution"
    | "autonomy-control"
    | "human-review"
    | "ci-github"
    | "observability"
    | "other-governance";
  severity: "low" | "medium" | "high" | "critical";
  likelihood: "low" | "medium" | "high";
  impact: "low" | "medium" | "high" | "critical";
  reviewability: "reviewable" | "non-reviewable";
  source:
    | "autonomy-scope-preview"
    | "human-approval-workflow-preview"
    | "autonomy-design-review-pack"
    | "runtime-activation-gates-preview"
    | "governance-simulation-preview"
    | "derived";
  reason: string;
  riskAccepted: false;
  riskMitigationApplied: false;
  autonomyEnabled: false;
};

export type GovernanceAutonomyMitigationRecommendation = {
  id: string;
  riskKey: string;
  recommendation: string;
  applied: false;
  reason: string;
};

export type GovernanceAutonomyRiskBlocker = {
  id: string;
  key: string;
  reason: string;
};

export type GovernanceAutonomyRiskRegisterPreview = {
  schemaVersion: 1;
  previewStatus: "not-created" | "created" | "blocked";
  sourceScopePreviewStatus: "not-created" | "created" | "blocked";
  riskRegisterConclusion:
    | "source-missing"
    | "risk-review-not-ready"
    | "risk-review-ready-preview"
    | "blocked-preview";
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
  risks: GovernanceAutonomyRiskEntry[];
  mitigationRecommendations: GovernanceAutonomyMitigationRecommendation[];
  riskBlockers: GovernanceAutonomyRiskBlocker[];
  summary: {
    totalRisks: number;
    lowRisks: number;
    mediumRisks: number;
    highRisks: number;
    criticalRisks: number;
    reviewableRisks: number;
    nonReviewableRisks: number;
    mitigationRecommendationCount: number;
    riskBlockerCount: number;
    riskRegisterReadyForFutureReview: boolean;
  };
  warnings: string[];
  recommendedNextStage:
    | "continue-governance-hardening"
    | "prepare-autonomy-sandbox-plan-preview"
    | "blocked";
};

const ARTIFACT_JSON_PATH = ".factory/governance/autonomy-risk-register-preview.json";
const ARTIFACT_MARKDOWN_PATH = ".factory/governance/autonomy-risk-register-preview.md";

type RiskDefinition = Omit<
  GovernanceAutonomyRiskEntry,
  "id" | "riskAccepted" | "riskMitigationApplied" | "autonomyEnabled"
>;

const SEVERITY_ORDER: Record<GovernanceAutonomyRiskEntry["severity"], number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3
};

const REVIEWABILITY_ORDER: Record<GovernanceAutonomyRiskEntry["reviewability"], number> = {
  "non-reviewable": 0,
  reviewable: 1
};

function riskTitleFromKey(key: string): string {
  return key
    .split("-")
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function sourceStatusFor(source: GovernanceAutonomyScopePreview): GovernanceAutonomyRiskRegisterPreview["sourceScopePreviewStatus"] {
  return source.previewStatus;
}

function conclusionFor(
  source: GovernanceAutonomyScopePreview,
  risks: GovernanceAutonomyRiskEntry[]
): Pick<GovernanceAutonomyRiskRegisterPreview, "previewStatus" | "riskRegisterConclusion" | "recommendedNextStage"> {
  if (source.previewStatus === "not-created") {
    return {
      previewStatus: "not-created",
      riskRegisterConclusion: "source-missing",
      recommendedNextStage: "continue-governance-hardening"
    };
  }
  if (source.previewStatus === "blocked") {
    return {
      previewStatus: "blocked",
      riskRegisterConclusion: "blocked-preview",
      recommendedNextStage: "blocked"
    };
  }
  if (risks.some((risk) => risk.reviewability === "non-reviewable" && risk.severity === "critical")) {
    return {
      previewStatus: "blocked",
      riskRegisterConclusion: "blocked-preview",
      recommendedNextStage: "blocked"
    };
  }
  if (source.scopeConclusion === "scope-review-ready-preview") {
    return {
      previewStatus: "created",
      riskRegisterConclusion: "risk-review-ready-preview",
      recommendedNextStage: "prepare-autonomy-sandbox-plan-preview"
    };
  }
  return {
    previewStatus: "created",
    riskRegisterConclusion: "risk-review-not-ready",
    recommendedNextStage: "continue-governance-hardening"
  };
}

function categoryForScopeCandidate(candidate: GovernanceAutonomyScopeCandidate): GovernanceAutonomyRiskEntry["category"] {
  if (candidate.key.includes("ci") || candidate.key.includes("github")) {
    return "ci-github";
  }
  if (candidate.key.includes("repair")) {
    return "repair-orchestration";
  }
  if (candidate.key.includes("activation")) {
    return "runtime-activation";
  }
  if (candidate.key.includes("policy")) {
    return "policy-enforcement";
  }
  if (candidate.key.includes("human")) {
    return "human-review";
  }
  if (candidate.key.includes("diagnostic") || candidate.key.includes("report") || candidate.key.includes("audit")) {
    return "observability";
  }
  return "scope";
}

function riskForScopeCandidate(candidate: GovernanceAutonomyScopeCandidate): RiskDefinition | null {
  if (candidate.classification === "permanently-forbidden") {
    return null;
  }
  if (candidate.classification === "blocked") {
    return {
      key: `blocked-scope-${candidate.key}`,
      title: `Blocked scope risk: ${candidate.title}`,
      category: categoryForScopeCandidate(candidate),
      severity: "high",
      likelihood: "medium",
      impact: "high",
      reviewability: "reviewable",
      source: "autonomy-scope-preview",
      reason: `Scope candidate ${candidate.key} is blocked until the approval workflow is ready.`
    };
  }
  if (candidate.classification === "review-required") {
    return {
      key: `review-required-${candidate.key}`,
      title: `Review required: ${candidate.title}`,
      category: categoryForScopeCandidate(candidate),
      severity: "medium",
      likelihood: "medium",
      impact: "medium",
      reviewability: "reviewable",
      source: "autonomy-scope-preview",
      reason: `Scope candidate ${candidate.key} requires future human review before it can be considered.`
    };
  }
  return {
    key: `preview-scope-${candidate.key}`,
    title: `Preview scope risk: ${candidate.title}`,
    category: categoryForScopeCandidate(candidate),
    severity: "low",
    likelihood: "low",
    impact: "low",
    reviewability: "reviewable",
    source: "autonomy-scope-preview",
    reason: `Scope candidate ${candidate.key} is preview-only and still requires future review.`
  };
}

function buildDerivedRiskDefinitions(source: GovernanceAutonomyScopePreview): RiskDefinition[] {
  const definitions: RiskDefinition[] = [
    {
      key: "approval-workflow-incompleteness",
      title: "Approval workflow incompleteness",
      category: "approval",
      severity: source.scopeConclusion === "scope-review-ready-preview" ? "medium" : "high",
      likelihood: "medium",
      impact: "high",
      reviewability: "reviewable",
      source: "human-approval-workflow-preview",
      reason: "Future autonomy cannot proceed without complete human approval workflow review."
    },
    {
      key: "observability-auditability-gap",
      title: "Observability and auditability gap",
      category: "observability",
      severity: "medium",
      likelihood: "medium",
      impact: "medium",
      reviewability: "reviewable",
      source: "derived",
      reason: "Future autonomy design requires deterministic audit artifacts before any activation discussion."
    },
    {
      key: "runtime-activation-misuse",
      title: "Runtime activation misuse",
      category: "runtime-activation",
      severity: "high",
      likelihood: "low",
      impact: "critical",
      reviewability: "reviewable",
      source: "runtime-activation-gates-preview",
      reason: "Runtime activation must remain disabled until explicit future gates are designed and reviewed."
    },
    {
      key: "safe-patch-engine-exclusivity-risk",
      title: "Safe Patch Engine exclusivity risk",
      category: "safe-patch",
      severity: "high",
      likelihood: "low",
      impact: "critical",
      reviewability: "reviewable",
      source: "derived",
      reason: "Safe Patch Engine must remain the only mutation layer in any future autonomy design."
    }
  ];

  if (source.previewStatus === "blocked") {
    definitions.push(
      {
        key: "blocked-source-governance-bypass",
        title: "Blocked source governance bypass",
        category: "governance-bypass",
        severity: "critical",
        likelihood: "medium",
        impact: "critical",
        reviewability: "non-reviewable",
        source: "autonomy-scope-preview",
        reason: "Blocked scope previews cannot be bypassed by exception, approval, or autonomy workflows."
      },
      {
        key: "blocked-source-mutation-boundary-expansion",
        title: "Blocked source mutation boundary expansion",
        category: "mutation-boundary",
        severity: "critical",
        likelihood: "medium",
        impact: "critical",
        reviewability: "non-reviewable",
        source: "autonomy-scope-preview",
        reason: "Mutation boundary expansion remains non-reviewable when the source governance chain is blocked."
      }
    );
  }

  return definitions;
}

function buildRisks(source: GovernanceAutonomyScopePreview): GovernanceAutonomyRiskEntry[] {
  const definitions = [
    ...source.scopeCandidates.map(riskForScopeCandidate).filter((risk): risk is RiskDefinition => risk !== null),
    ...buildDerivedRiskDefinitions(source)
  ];

  return definitions
    .sort((a, b) => {
      const severity = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
      if (severity !== 0) {
        return severity;
      }
      const reviewability = REVIEWABILITY_ORDER[a.reviewability] - REVIEWABILITY_ORDER[b.reviewability];
      if (reviewability !== 0) {
        return reviewability;
      }
      return `${a.category}:${a.key}`.localeCompare(`${b.category}:${b.key}`);
    })
    .map((risk, index) => ({
      id: `gov-autonomy-risk-${String(index + 1).padStart(3, "0")}`,
      ...risk,
      riskAccepted: false,
      riskMitigationApplied: false,
      autonomyEnabled: false
    }));
}

function mitigationForRisk(risk: GovernanceAutonomyRiskEntry): string {
  if (risk.reviewability === "non-reviewable") {
    return "Permanently block unsafe capability.";
  }
  if (risk.category === "safe-patch") {
    return "Keep Safe Patch Engine exclusivity.";
  }
  if (risk.category === "runtime-activation") {
    return "Keep runtime activation disabled until explicit activation gates exist.";
  }
  if (risk.category === "ci-github") {
    return "Require CI/PR preview before any future publishing or build-blocking design.";
  }
  if (risk.category === "approval" || risk.category === "human-review") {
    return "Require a human review gate.";
  }
  if (risk.category === "observability") {
    return "Require deterministic audit artifacts before future activation review.";
  }
  return "Keep preview-only mode and require explicit future review.";
}

function buildMitigationRecommendations(
  risks: GovernanceAutonomyRiskEntry[]
): GovernanceAutonomyMitigationRecommendation[] {
  return [...risks]
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((risk, index) => ({
      id: `gov-autonomy-mitigation-${String(index + 1).padStart(3, "0")}`,
      riskKey: risk.key,
      recommendation: mitigationForRisk(risk),
      applied: false,
      reason: `Mitigation recommendation for ${risk.key} is advisory only.`
    }));
}

function buildRiskBlockers(source: GovernanceAutonomyScopePreview): GovernanceAutonomyRiskBlocker[] {
  const blockers = [
    ...source.permanentlyForbiddenActions.map((action) => ({
      key: action.key,
      reason: action.reason
    })),
    ...source.scopeCandidates
      .filter((candidate) => candidate.classification === "permanently-forbidden")
      .map((candidate) => ({
        key: candidate.key,
        reason: candidate.reason
      }))
  ];
  const unique = new Map<string, string>();
  for (const blocker of blockers) {
    unique.set(blocker.key, blocker.reason);
  }
  return [...unique.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, reason], index) => ({
      id: `gov-autonomy-risk-blocker-${String(index + 1).padStart(3, "0")}`,
      key,
      reason
    }));
}

function buildSummary(
  risks: GovernanceAutonomyRiskEntry[],
  mitigationRecommendations: GovernanceAutonomyMitigationRecommendation[],
  riskBlockers: GovernanceAutonomyRiskBlocker[],
  conclusion: GovernanceAutonomyRiskRegisterPreview["riskRegisterConclusion"]
): GovernanceAutonomyRiskRegisterPreview["summary"] {
  return {
    totalRisks: risks.length,
    lowRisks: risks.filter((risk) => risk.severity === "low").length,
    mediumRisks: risks.filter((risk) => risk.severity === "medium").length,
    highRisks: risks.filter((risk) => risk.severity === "high").length,
    criticalRisks: risks.filter((risk) => risk.severity === "critical").length,
    reviewableRisks: risks.filter((risk) => risk.reviewability === "reviewable").length,
    nonReviewableRisks: risks.filter((risk) => risk.reviewability === "non-reviewable").length,
    mitigationRecommendationCount: mitigationRecommendations.length,
    riskBlockerCount: riskBlockers.length,
    riskRegisterReadyForFutureReview: conclusion === "risk-review-ready-preview"
  };
}

function warningsFor(conclusion: GovernanceAutonomyRiskRegisterPreview["riskRegisterConclusion"]): string[] {
  const warnings = [
    "Controlled autonomy risk register preview is advisory only.",
    "No risk was accepted.",
    "No mitigation was applied.",
    "No autonomy was enabled.",
    "No autonomous actions are allowed.",
    "No governance was enforced.",
    "Runtime behavior did not change.",
    "Repair orchestration did not change."
  ];
  if (conclusion === "source-missing") {
    warnings.unshift("Autonomy scope preview source is missing; risk register preview is incomplete.");
  }
  if (conclusion === "risk-review-not-ready") {
    warnings.unshift("Autonomy scope preview is not ready for risk review.");
  }
  if (conclusion === "risk-review-ready-preview") {
    warnings.unshift("Autonomy risk register is ready for future review only.");
  }
  if (conclusion === "blocked-preview") {
    warnings.unshift("Non-reviewable critical autonomy risks block the risk register preview.");
  }
  return warnings;
}

export function buildGovernanceAutonomyRiskRegisterPreviewFromScopePreview(
  source: GovernanceAutonomyScopePreview
): GovernanceAutonomyRiskRegisterPreview {
  const sourceScopePreviewStatus = sourceStatusFor(source);
  const risks = buildRisks(source);
  const conclusion = conclusionFor(source, risks);
  const mitigationRecommendations = buildMitigationRecommendations(risks);
  const riskBlockers = buildRiskBlockers(source);

  return {
    schemaVersion: 1,
    previewStatus: conclusion.previewStatus,
    sourceScopePreviewStatus,
    riskRegisterConclusion: conclusion.riskRegisterConclusion,
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
    risks,
    mitigationRecommendations,
    riskBlockers,
    summary: buildSummary(risks, mitigationRecommendations, riskBlockers, conclusion.riskRegisterConclusion),
    warnings: warningsFor(conclusion.riskRegisterConclusion),
    recommendedNextStage: conclusion.recommendedNextStage
  };
}

export function buildGovernanceAutonomyRiskRegisterPreview(projectRoot: string): GovernanceAutonomyRiskRegisterPreview {
  return buildGovernanceAutonomyRiskRegisterPreviewFromScopePreview(
    buildGovernanceAutonomyScopePreview(projectRoot)
  );
}

export function renderGovernanceAutonomyRiskRegisterPreviewMarkdown(
  preview: GovernanceAutonomyRiskRegisterPreview
): string {
  const lines = [
    "# AI Software Factory - Controlled Autonomy Risk Register Preview",
    "",
    "Preview status:",
    preview.previewStatus,
    "",
    "Source scope preview status:",
    preview.sourceScopePreviewStatus,
    "",
    "Risk register conclusion:",
    preview.riskRegisterConclusion,
    "",
    "Risk accepted:",
    String(preview.riskAccepted),
    "",
    "Risk mitigation applied:",
    String(preview.riskMitigationApplied),
    "",
    "Risk register enforced:",
    String(preview.riskRegisterEnforced),
    "",
    "Scope approved:",
    String(preview.scopeApproved),
    "",
    "Scope applied:",
    String(preview.scopeApplied),
    "",
    "Autonomy enabled:",
    String(preview.autonomyEnabled),
    "",
    "Autonomous actions allowed:",
    String(preview.autonomousActionsAllowed),
    "",
    "Human approval granted:",
    String(preview.humanApprovalGranted),
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
    "Total risks:",
    String(preview.summary.totalRisks),
    "",
    "Low risks:",
    String(preview.summary.lowRisks),
    "",
    "Medium risks:",
    String(preview.summary.mediumRisks),
    "",
    "High risks:",
    String(preview.summary.highRisks),
    "",
    "Critical risks:",
    String(preview.summary.criticalRisks),
    "",
    "Reviewable risks:",
    String(preview.summary.reviewableRisks),
    "",
    "Non-reviewable risks:",
    String(preview.summary.nonReviewableRisks),
    "",
    "Mitigation recommendation count:",
    String(preview.summary.mitigationRecommendationCount),
    "",
    "Risk blocker count:",
    String(preview.summary.riskBlockerCount),
    "",
    "Risk register ready for future review:",
    String(preview.summary.riskRegisterReadyForFutureReview),
    "",
    "Recommended next stage:",
    preview.recommendedNextStage,
    "",
    "## Risks",
    ""
  ];

  for (const risk of preview.risks) {
    lines.push(`- [${risk.severity}/${risk.reviewability}] ${risk.id} ${risk.key} - ${risk.reason}`);
  }

  lines.push("", "## Mitigation Recommendations", "");
  for (const mitigation of preview.mitigationRecommendations) {
    lines.push(`- ${mitigation.id} ${mitigation.riskKey} - ${mitigation.recommendation}`);
  }

  lines.push("", "## Risk Blockers", "");
  for (const blocker of preview.riskBlockers) {
    lines.push(`- ${blocker.id} ${blocker.key} - ${blocker.reason}`);
  }

  lines.push("", "## Warnings", "");
  for (const warning of preview.warnings) {
    lines.push(`- ${warning}`);
  }

  return `${lines.join("\n")}\n`;
}

export function renderGovernanceAutonomyRiskRegisterPreviewText(
  preview: GovernanceAutonomyRiskRegisterPreview
): string {
  return renderGovernanceAutonomyRiskRegisterPreviewMarkdown(preview);
}

export function writeGovernanceAutonomyRiskRegisterPreviewArtifacts(
  projectRoot: string,
  preview: GovernanceAutonomyRiskRegisterPreview
): { jsonPath: string; markdownPath: string } {
  const jsonPath = path.join(projectRoot, ARTIFACT_JSON_PATH);
  const markdownPath = path.join(projectRoot, ARTIFACT_MARKDOWN_PATH);
  fs.ensureDirSync(path.dirname(jsonPath));
  fs.writeFileSync(jsonPath, `${JSON.stringify(preview, null, 2)}\n`, "utf8");
  fs.writeFileSync(markdownPath, renderGovernanceAutonomyRiskRegisterPreviewMarkdown(preview), "utf8");
  return {
    jsonPath: ARTIFACT_JSON_PATH,
    markdownPath: ARTIFACT_MARKDOWN_PATH
  };
}
