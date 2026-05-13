import fs from "fs-extra";
import path from "node:path";

import {
  buildGovernanceHumanApprovalWorkflowPreview,
  type GovernanceHumanApprovalWorkflowPreview
} from "./humanApprovalWorkflowPreview.js";

export type GovernanceAutonomyScopeCandidate = {
  id: string;
  key: string;
  title: string;
  category:
    | "reporting"
    | "analysis"
    | "diagnostics"
    | "planning-preview"
    | "artifact-generation"
    | "ci-preview"
    | "governance-preview"
    | "repair-preview"
    | "forbidden-runtime";
  classification:
    | "eligible-for-review"
    | "review-required"
    | "blocked"
    | "permanently-forbidden";
  reason: string;
  scopeApproved: false;
  scopeApplied: false;
  autonomyEnabled: false;
  autonomousActionsAllowed: false;
};

export type GovernanceAutonomyScopeBoundary = {
  id: string;
  key: string;
  boundaryType:
    | "must-remain-human-reviewed"
    | "must-remain-preview-only"
    | "must-remain-read-only"
    | "must-remain-safe-patch-only"
    | "must-never-execute";
  reason: string;
};

export type GovernanceAutonomyFutureOnlyAction = {
  id: string;
  key: string;
  futureOnly: true;
  requiresHumanApproval: true;
  reason: string;
};

export type GovernanceAutonomyPermanentlyForbiddenAction = {
  id: string;
  key: string;
  permanentlyForbidden: true;
  reason: string;
};

export type GovernanceAutonomyScopePreview = {
  schemaVersion: 1;
  previewStatus: "not-created" | "created" | "blocked";
  sourceApprovalWorkflowStatus: "not-created" | "created" | "blocked";
  scopeConclusion:
    | "source-missing"
    | "scope-not-ready"
    | "scope-review-ready-preview"
    | "blocked-preview";
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
  scopeCandidates: GovernanceAutonomyScopeCandidate[];
  scopeBoundaries: GovernanceAutonomyScopeBoundary[];
  futureOnlyActions: GovernanceAutonomyFutureOnlyAction[];
  permanentlyForbiddenActions: GovernanceAutonomyPermanentlyForbiddenAction[];
  summary: {
    totalScopeCandidates: number;
    eligibleForReviewCandidates: number;
    reviewRequiredCandidates: number;
    blockedCandidates: number;
    permanentlyForbiddenCandidates: number;
    totalScopeBoundaries: number;
    futureOnlyActionCount: number;
    permanentlyForbiddenActionCount: number;
    scopeReadyForFutureReview: boolean;
  };
  warnings: string[];
  recommendedNextStage:
    | "continue-governance-hardening"
    | "prepare-autonomy-risk-register-preview"
    | "blocked";
};

const ARTIFACT_JSON_PATH = ".factory/governance/autonomy-scope-preview.json";
const ARTIFACT_MARKDOWN_PATH = ".factory/governance/autonomy-scope-preview.md";

type ScopeCandidateDefinition = Omit<
  GovernanceAutonomyScopeCandidate,
  "id" | "classification" | "scopeApproved" | "scopeApplied" | "autonomyEnabled" | "autonomousActionsAllowed"
> & {
  defaultClassification: GovernanceAutonomyScopeCandidate["classification"];
};

const SCOPE_CANDIDATE_DEFINITIONS: ScopeCandidateDefinition[] = [
  {
    key: "autonomous-config-activation",
    title: "Autonomous config activation",
    category: "forbidden-runtime",
    defaultClassification: "permanently-forbidden",
    reason: "Autonomous config activation is permanently forbidden."
  },
  {
    key: "autonomous-policy-enforcement",
    title: "Autonomous policy enforcement",
    category: "forbidden-runtime",
    defaultClassification: "permanently-forbidden",
    reason: "Autonomous policy enforcement is permanently forbidden."
  },
  {
    key: "autonomous-repair-mutation",
    title: "Autonomous repair mutation",
    category: "forbidden-runtime",
    defaultClassification: "permanently-forbidden",
    reason: "Autonomous repair mutation is permanently forbidden."
  },
  {
    key: "ci-build-blocking-design",
    title: "CI/build-blocking design",
    category: "ci-preview",
    defaultClassification: "review-required",
    reason: "CI/build-blocking design would require future human review."
  },
  {
    key: "controlled-repair-recommendation-design",
    title: "Controlled repair recommendation design",
    category: "repair-preview",
    defaultClassification: "review-required",
    reason: "Controlled repair recommendation design would require future human review."
  },
  {
    key: "dynamic-script-execution",
    title: "Dynamic script execution",
    category: "forbidden-runtime",
    defaultClassification: "permanently-forbidden",
    reason: "Dynamic script execution is permanently forbidden."
  },
  {
    key: "exception-approval-design",
    title: "Exception approval design",
    category: "governance-preview",
    defaultClassification: "review-required",
    reason: "Exception approval design would require future human review."
  },
  {
    key: "external-governance-execution",
    title: "External governance execution",
    category: "forbidden-runtime",
    defaultClassification: "permanently-forbidden",
    reason: "External governance execution is permanently forbidden."
  },
  {
    key: "generate-audit-artifacts",
    title: "Generate audit artifacts",
    category: "artifact-generation",
    defaultClassification: "eligible-for-review",
    reason: "Deterministic audit artifact generation may be considered for future review."
  },
  {
    key: "generate-ci-pr-summaries-locally",
    title: "Generate CI/PR summaries locally",
    category: "ci-preview",
    defaultClassification: "eligible-for-review",
    reason: "Local CI/PR summary generation may be considered for future review."
  },
  {
    key: "generate-deterministic-diagnostics",
    title: "Generate deterministic diagnostics",
    category: "diagnostics",
    defaultClassification: "eligible-for-review",
    reason: "Deterministic diagnostics may be considered for future review."
  },
  {
    key: "generate-governance-reports",
    title: "Generate governance reports",
    category: "reporting",
    defaultClassification: "eligible-for-review",
    reason: "Governance report generation may be considered for future review."
  },
  {
    key: "generate-risk-summaries",
    title: "Generate risk summaries",
    category: "analysis",
    defaultClassification: "eligible-for-review",
    reason: "Risk summary generation may be considered for future review."
  },
  {
    key: "github-publishing-design",
    title: "GitHub publishing design",
    category: "ci-preview",
    defaultClassification: "review-required",
    reason: "GitHub publishing design would require future human review."
  },
  {
    key: "governance-bypass-mechanisms",
    title: "Governance bypass mechanisms",
    category: "forbidden-runtime",
    defaultClassification: "permanently-forbidden",
    reason: "Governance bypass mechanisms are permanently forbidden."
  },
  {
    key: "guarded-policy-activation-design",
    title: "Guarded policy activation design",
    category: "governance-preview",
    defaultClassification: "review-required",
    reason: "Guarded policy activation design would require future human review."
  },
  {
    key: "ml-vector-db-governance-decisioning",
    title: "ML/vector DB governance decisioning",
    category: "forbidden-runtime",
    defaultClassification: "permanently-forbidden",
    reason: "ML/vector DB governance decisioning is permanently forbidden."
  },
  {
    key: "mutation-scope-expansion",
    title: "Mutation scope expansion",
    category: "forbidden-runtime",
    defaultClassification: "permanently-forbidden",
    reason: "Mutation scope expansion is permanently forbidden."
  },
  {
    key: "plugin-execution",
    title: "Plugin execution",
    category: "forbidden-runtime",
    defaultClassification: "permanently-forbidden",
    reason: "Plugin execution is permanently forbidden."
  },
  {
    key: "prepare-human-review-artifacts",
    title: "Prepare human-review artifacts",
    category: "artifact-generation",
    defaultClassification: "eligible-for-review",
    reason: "Human-review artifact preparation may be considered for future review."
  },
  {
    key: "runtime-learning-governance",
    title: "Runtime learning governance",
    category: "forbidden-runtime",
    defaultClassification: "permanently-forbidden",
    reason: "Runtime learning governance is permanently forbidden."
  },
  {
    key: "safe-patch-engine-bypass",
    title: "Safe Patch Engine bypass",
    category: "forbidden-runtime",
    defaultClassification: "permanently-forbidden",
    reason: "Bypassing Safe Patch Engine is permanently forbidden."
  },
  {
    key: "self-modifying-governance",
    title: "Self-modifying governance",
    category: "forbidden-runtime",
    defaultClassification: "permanently-forbidden",
    reason: "Self-modifying governance is permanently forbidden."
  },
  {
    key: "suggest-next-governance-steps",
    title: "Suggest next governance steps",
    category: "planning-preview",
    defaultClassification: "eligible-for-review",
    reason: "Deterministic next-step suggestions may be considered for future review."
  },
  {
    key: "transition-activation-gate-design",
    title: "Activation gate transition design",
    category: "governance-preview",
    defaultClassification: "review-required",
    reason: "Activation gate transition design would require future human review."
  },
  {
    key: "uncontrolled-multi-agent-orchestration",
    title: "Uncontrolled multi-agent orchestration",
    category: "forbidden-runtime",
    defaultClassification: "permanently-forbidden",
    reason: "Uncontrolled multi-agent orchestration is permanently forbidden."
  }
];

const SCOPE_BOUNDARY_DEFINITIONS: Array<Omit<GovernanceAutonomyScopeBoundary, "id">> = [
  {
    key: "deterministic-only",
    boundaryType: "must-remain-preview-only",
    reason: "All future autonomy must remain deterministic unless explicitly reviewed in a future design."
  },
  {
    key: "human-review-required",
    boundaryType: "must-remain-human-reviewed",
    reason: "All future autonomy must require human review."
  },
  {
    key: "no-governance-bypass",
    boundaryType: "must-remain-preview-only",
    reason: "Future autonomy must not bypass governance gates."
  },
  {
    key: "no-mutation-scope-expansion",
    boundaryType: "must-remain-read-only",
    reason: "Future autonomy must not expand mutation scope."
  },
  {
    key: "no-plugin-script-network-execution",
    boundaryType: "must-never-execute",
    reason: "Future autonomy must not use plugins, scripts, or network execution."
  },
  {
    key: "no-runtime-learning-or-ml-decisioning",
    boundaryType: "must-never-execute",
    reason: "Future autonomy must not introduce runtime learning or ML governance decisioning."
  },
  {
    key: "runtime-config-gated-design",
    boundaryType: "must-remain-human-reviewed",
    reason: "Runtime config activation requires explicit gated design."
  },
  {
    key: "safe-patch-engine-exclusive",
    boundaryType: "must-remain-safe-patch-only",
    reason: "Future autonomy must preserve Safe Patch Engine exclusivity."
  }
];

const FUTURE_ONLY_ACTION_DEFINITIONS: Array<Omit<GovernanceAutonomyFutureOnlyAction, "id" | "futureOnly" | "requiresHumanApproval">> = [
  { key: "ci-build-blocking-design", reason: "CI/build-blocking design is future-only and requires human approval." },
  { key: "controlled-repair-recommendation-design", reason: "Controlled repair recommendation design is future-only and requires human approval." },
  { key: "exception-approval-design", reason: "Exception approval design is future-only and requires human approval." },
  { key: "github-publishing-design", reason: "GitHub publishing design is future-only and requires human approval." },
  { key: "guarded-policy-activation-design", reason: "Guarded policy activation design is future-only and requires human approval." },
  { key: "transition-activation-gate-design", reason: "Activation gate transition design is future-only and requires human approval." }
];

const PERMANENTLY_FORBIDDEN_ACTION_DEFINITIONS: Array<Omit<GovernanceAutonomyPermanentlyForbiddenAction, "id" | "permanentlyForbidden">> = [
  { key: "autonomous-config-activation", reason: "Autonomous config activation is permanently forbidden." },
  { key: "autonomous-policy-enforcement", reason: "Autonomous policy enforcement is permanently forbidden." },
  { key: "autonomous-repair-mutation", reason: "Autonomous repair mutation is permanently forbidden." },
  { key: "disabling-safety-invariants", reason: "Disabling safety invariants is permanently forbidden." },
  { key: "dynamic-script-execution", reason: "Dynamic script execution is permanently forbidden." },
  { key: "external-governance-execution", reason: "External governance execution is permanently forbidden." },
  { key: "governance-bypass-mechanisms", reason: "Governance bypass mechanisms are permanently forbidden." },
  { key: "ml-vector-db-governance-decisioning", reason: "ML/vector DB governance decisioning is permanently forbidden." },
  { key: "mutation-scope-expansion", reason: "Mutation scope expansion is permanently forbidden." },
  { key: "plugin-execution", reason: "Plugin execution is permanently forbidden." },
  { key: "runtime-learning-governance", reason: "Runtime learning governance is permanently forbidden." },
  { key: "safe-patch-engine-bypass", reason: "Bypassing Safe Patch Engine is permanently forbidden." },
  { key: "self-modifying-governance", reason: "Self-modifying governance is permanently forbidden." },
  { key: "uncontrolled-multi-agent-orchestration", reason: "Uncontrolled multi-agent orchestration is permanently forbidden." }
];

const CLASSIFICATION_ORDER: Record<GovernanceAutonomyScopeCandidate["classification"], number> = {
  "permanently-forbidden": 0,
  blocked: 1,
  "review-required": 2,
  "eligible-for-review": 3
};

function sourceStatusFor(
  source: GovernanceHumanApprovalWorkflowPreview
): GovernanceAutonomyScopePreview["sourceApprovalWorkflowStatus"] {
  return source.previewStatus;
}

function conclusionFor(
  source: GovernanceHumanApprovalWorkflowPreview
): Pick<GovernanceAutonomyScopePreview, "previewStatus" | "scopeConclusion" | "recommendedNextStage"> {
  if (source.previewStatus === "not-created") {
    return {
      previewStatus: "not-created",
      scopeConclusion: "source-missing",
      recommendedNextStage: "continue-governance-hardening"
    };
  }
  if (source.previewStatus === "blocked") {
    return {
      previewStatus: "blocked",
      scopeConclusion: "blocked-preview",
      recommendedNextStage: "blocked"
    };
  }
  if (source.approvalWorkflowConclusion === "workflow-ready-preview") {
    return {
      previewStatus: "created",
      scopeConclusion: "scope-review-ready-preview",
      recommendedNextStage: "prepare-autonomy-risk-register-preview"
    };
  }
  return {
    previewStatus: "created",
    scopeConclusion: "scope-not-ready",
    recommendedNextStage: "continue-governance-hardening"
  };
}

function classificationFor(
  definition: ScopeCandidateDefinition,
  conclusion: GovernanceAutonomyScopePreview["scopeConclusion"]
): GovernanceAutonomyScopeCandidate["classification"] {
  if (definition.defaultClassification === "permanently-forbidden") {
    return "permanently-forbidden";
  }
  if (conclusion === "source-missing" || conclusion === "scope-not-ready" || conclusion === "blocked-preview") {
    return "blocked";
  }
  return definition.defaultClassification;
}

function buildScopeCandidates(
  conclusion: GovernanceAutonomyScopePreview["scopeConclusion"]
): GovernanceAutonomyScopeCandidate[] {
  return [...SCOPE_CANDIDATE_DEFINITIONS]
    .map((item) => ({
      ...item,
      classification: classificationFor(item, conclusion)
    }))
    .sort((a, b) => {
      const rank = CLASSIFICATION_ORDER[a.classification] - CLASSIFICATION_ORDER[b.classification];
      if (rank !== 0) {
        return rank;
      }
      return `${a.category}:${a.key}`.localeCompare(`${b.category}:${b.key}`);
    })
    .map((item, index) => ({
      id: `gov-autonomy-scope-${String(index + 1).padStart(3, "0")}`,
      key: item.key,
      title: item.title,
      category: item.category,
      classification: item.classification,
      reason: item.reason,
      scopeApproved: false,
      scopeApplied: false,
      autonomyEnabled: false,
      autonomousActionsAllowed: false
    }));
}

function buildScopeBoundaries(): GovernanceAutonomyScopeBoundary[] {
  return [...SCOPE_BOUNDARY_DEFINITIONS]
    .sort((a, b) => `${a.boundaryType}:${a.key}`.localeCompare(`${b.boundaryType}:${b.key}`))
    .map((item, index) => ({
      id: `gov-autonomy-boundary-${String(index + 1).padStart(3, "0")}`,
      ...item
    }));
}

function buildFutureOnlyActions(): GovernanceAutonomyFutureOnlyAction[] {
  return [...FUTURE_ONLY_ACTION_DEFINITIONS]
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((item, index) => ({
      id: `gov-autonomy-future-action-${String(index + 1).padStart(3, "0")}`,
      futureOnly: true,
      requiresHumanApproval: true,
      ...item
    }));
}

function buildPermanentlyForbiddenActions(): GovernanceAutonomyPermanentlyForbiddenAction[] {
  return [...PERMANENTLY_FORBIDDEN_ACTION_DEFINITIONS]
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((item, index) => ({
      id: `gov-autonomy-forbidden-action-${String(index + 1).padStart(3, "0")}`,
      permanentlyForbidden: true,
      ...item
    }));
}

function buildSummary(
  scopeCandidates: GovernanceAutonomyScopeCandidate[],
  scopeBoundaries: GovernanceAutonomyScopeBoundary[],
  futureOnlyActions: GovernanceAutonomyFutureOnlyAction[],
  permanentlyForbiddenActions: GovernanceAutonomyPermanentlyForbiddenAction[],
  conclusion: GovernanceAutonomyScopePreview["scopeConclusion"]
): GovernanceAutonomyScopePreview["summary"] {
  return {
    totalScopeCandidates: scopeCandidates.length,
    eligibleForReviewCandidates: scopeCandidates.filter((item) => item.classification === "eligible-for-review").length,
    reviewRequiredCandidates: scopeCandidates.filter((item) => item.classification === "review-required").length,
    blockedCandidates: scopeCandidates.filter((item) => item.classification === "blocked").length,
    permanentlyForbiddenCandidates: scopeCandidates.filter((item) => item.classification === "permanently-forbidden").length,
    totalScopeBoundaries: scopeBoundaries.length,
    futureOnlyActionCount: futureOnlyActions.length,
    permanentlyForbiddenActionCount: permanentlyForbiddenActions.length,
    scopeReadyForFutureReview: conclusion === "scope-review-ready-preview"
  };
}

function warningsFor(conclusion: GovernanceAutonomyScopePreview["scopeConclusion"]): string[] {
  const warnings = [
    "Controlled autonomy scope preview is advisory only.",
    "No scope was approved.",
    "No scope was applied.",
    "No autonomy was enabled.",
    "No autonomous actions are allowed.",
    "No governance was enforced.",
    "Runtime behavior did not change.",
    "Repair orchestration did not change."
  ];
  if (conclusion === "source-missing") {
    warnings.unshift("Human approval workflow source is missing; scope preview is incomplete.");
  }
  if (conclusion === "blocked-preview") {
    warnings.unshift("Human approval workflow is blocked; scope preview is blocked.");
  }
  if (conclusion === "scope-not-ready") {
    warnings.unshift("Human approval workflow is not ready for scope review.");
  }
  if (conclusion === "scope-review-ready-preview") {
    warnings.unshift("Controlled autonomy scope is ready for future review only.");
  }
  return warnings;
}

export function buildGovernanceAutonomyScopePreviewFromApprovalWorkflow(
  source: GovernanceHumanApprovalWorkflowPreview
): GovernanceAutonomyScopePreview {
  const sourceApprovalWorkflowStatus = sourceStatusFor(source);
  const conclusion = conclusionFor(source);
  const scopeCandidates = buildScopeCandidates(conclusion.scopeConclusion);
  const scopeBoundaries = buildScopeBoundaries();
  const futureOnlyActions = buildFutureOnlyActions();
  const permanentlyForbiddenActions = buildPermanentlyForbiddenActions();

  return {
    schemaVersion: 1,
    previewStatus: conclusion.previewStatus,
    sourceApprovalWorkflowStatus,
    scopeConclusion: conclusion.scopeConclusion,
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
    scopeCandidates,
    scopeBoundaries,
    futureOnlyActions,
    permanentlyForbiddenActions,
    summary: buildSummary(
      scopeCandidates,
      scopeBoundaries,
      futureOnlyActions,
      permanentlyForbiddenActions,
      conclusion.scopeConclusion
    ),
    warnings: warningsFor(conclusion.scopeConclusion),
    recommendedNextStage: conclusion.recommendedNextStage
  };
}

export function buildGovernanceAutonomyScopePreview(projectRoot: string): GovernanceAutonomyScopePreview {
  return buildGovernanceAutonomyScopePreviewFromApprovalWorkflow(
    buildGovernanceHumanApprovalWorkflowPreview(projectRoot)
  );
}

export function renderGovernanceAutonomyScopePreviewMarkdown(preview: GovernanceAutonomyScopePreview): string {
  const lines = [
    "# AI Software Factory - Controlled Autonomy Scope Preview",
    "",
    "Preview status:",
    preview.previewStatus,
    "",
    "Source approval workflow status:",
    preview.sourceApprovalWorkflowStatus,
    "",
    "Scope conclusion:",
    preview.scopeConclusion,
    "",
    "Scope approved:",
    String(preview.scopeApproved),
    "",
    "Scope applied:",
    String(preview.scopeApplied),
    "",
    "Scope enforced:",
    String(preview.scopeEnforced),
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
    "Approval applied:",
    String(preview.approvalApplied),
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
    "Guarded activation enabled:",
    String(preview.guardedActivationEnabled),
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
    "Total scope candidates:",
    String(preview.summary.totalScopeCandidates),
    "",
    "Total scope boundaries:",
    String(preview.summary.totalScopeBoundaries),
    "",
    "Future-only action count:",
    String(preview.summary.futureOnlyActionCount),
    "",
    "Permanently forbidden action count:",
    String(preview.summary.permanentlyForbiddenActionCount),
    "",
    "Scope ready for future review:",
    String(preview.summary.scopeReadyForFutureReview),
    "",
    "Recommended next stage:",
    preview.recommendedNextStage,
    "",
    "## Scope Candidates",
    ""
  ];

  for (const item of preview.scopeCandidates) {
    lines.push(`- [${item.classification}] ${item.id} ${item.key} - ${item.reason}`);
  }

  lines.push("", "## Scope Boundaries", "");
  for (const item of preview.scopeBoundaries) {
    lines.push(`- [${item.boundaryType}] ${item.id} ${item.key} - ${item.reason}`);
  }

  lines.push("", "## Future-Only Actions", "");
  for (const item of preview.futureOnlyActions) {
    lines.push(`- ${item.id} ${item.key} - ${item.reason}`);
  }

  lines.push("", "## Permanently Forbidden Actions", "");
  for (const item of preview.permanentlyForbiddenActions) {
    lines.push(`- ${item.id} ${item.key} - ${item.reason}`);
  }

  lines.push("", "## Warnings", "");
  for (const warning of preview.warnings) {
    lines.push(`- ${warning}`);
  }

  return `${lines.join("\n")}\n`;
}

export function renderGovernanceAutonomyScopePreviewText(preview: GovernanceAutonomyScopePreview): string {
  return renderGovernanceAutonomyScopePreviewMarkdown(preview);
}

export function writeGovernanceAutonomyScopePreviewArtifacts(
  projectRoot: string,
  preview: GovernanceAutonomyScopePreview
): { jsonPath: string; markdownPath: string } {
  const jsonPath = path.join(projectRoot, ARTIFACT_JSON_PATH);
  const markdownPath = path.join(projectRoot, ARTIFACT_MARKDOWN_PATH);
  fs.ensureDirSync(path.dirname(jsonPath));
  fs.writeFileSync(jsonPath, `${JSON.stringify(preview, null, 2)}\n`, "utf8");
  fs.writeFileSync(markdownPath, renderGovernanceAutonomyScopePreviewMarkdown(preview), "utf8");
  return {
    jsonPath: ARTIFACT_JSON_PATH,
    markdownPath: ARTIFACT_MARKDOWN_PATH
  };
}
