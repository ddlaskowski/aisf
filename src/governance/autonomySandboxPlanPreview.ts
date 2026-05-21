import fs from "fs-extra";
import path from "node:path";

import {
  buildGovernanceAutonomyRiskRegisterPreview,
  type GovernanceAutonomyRiskRegisterPreview
} from "./autonomyRiskRegisterPreview.js";

export type GovernanceAutonomySandboxObjective = {
  id: string;
  key: string;
  title: string;
  reason: string;
};

export type GovernanceAutonomySandboxBoundary = {
  id: string;
  key: string;
  boundaryType:
    | "must-remain-preview-only"
    | "must-remain-read-only"
    | "must-remain-human-reviewed"
    | "must-remain-safe-patch-only"
    | "must-never-execute";
  reason: string;
};

export type GovernanceAutonomySandboxFutureOnlyTest = {
  id: string;
  key: string;
  category:
    | "governance-reporting"
    | "risk-analysis"
    | "simulation"
    | "artifact-generation"
    | "human-review"
    | "ci-pr-preview"
    | "policy-preview";
  futureOnly: true;
  requiresHumanApproval: true;
  reason: string;
};

export type GovernanceAutonomySandboxProhibitedTest = {
  id: string;
  key: string;
  permanentlyProhibited: true;
  reason: string;
};

export type GovernanceAutonomySandboxExitCriterion = {
  id: string;
  key: string;
  required: true;
  reason: string;
};

export type GovernanceAutonomySandboxHumanReviewCheckpoint = {
  id: string;
  key: string;
  required: true;
  reason: string;
};

export type GovernanceAutonomySandboxPlanPreview = {
  schemaVersion: 1;
  previewStatus: "not-created" | "created" | "blocked";
  sourceRiskRegisterStatus: "not-created" | "created" | "blocked";
  sandboxPlanConclusion:
    | "source-missing"
    | "sandbox-plan-not-ready"
    | "sandbox-plan-ready-preview"
    | "blocked-preview";
  sandboxCreated: false;
  sandboxExecuted: false;
  sandboxPlanApplied: false;
  sandboxEnforced: false;
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
  sandboxObjectives: GovernanceAutonomySandboxObjective[];
  sandboxBoundaries: GovernanceAutonomySandboxBoundary[];
  futureOnlyTests: GovernanceAutonomySandboxFutureOnlyTest[];
  prohibitedTests: GovernanceAutonomySandboxProhibitedTest[];
  exitCriteria: GovernanceAutonomySandboxExitCriterion[];
  humanReviewCheckpoints: GovernanceAutonomySandboxHumanReviewCheckpoint[];
  summary: {
    totalObjectives: number;
    totalBoundaries: number;
    totalFutureOnlyTests: number;
    totalProhibitedTests: number;
    totalExitCriteria: number;
    totalHumanReviewCheckpoints: number;
    sandboxReadyForFutureReview: boolean;
  };
  warnings: string[];
  recommendedNextStage:
    | "continue-governance-hardening"
    | "prepare-autonomy-sandbox-evidence-preview"
    | "blocked";
};

const ARTIFACT_JSON_PATH = ".factory/governance/autonomy-sandbox-plan-preview.json";
const ARTIFACT_MARKDOWN_PATH = ".factory/governance/autonomy-sandbox-plan-preview.md";

const OBJECTIVE_DEFINITIONS: Array<Omit<GovernanceAutonomySandboxObjective, "id">> = [
  {
    key: "validate-deterministic-artifacts",
    title: "Validate deterministic artifacts",
    reason: "Future sandbox review must prove preview artifacts are stable and reproducible."
  },
  {
    key: "validate-future-only-scope-boundaries",
    title: "Validate future-only scope boundaries",
    reason: "Future sandbox review must keep scope candidates preview-only and human-reviewed."
  },
  {
    key: "validate-governance-preview-chain-without-enforcement",
    title: "Validate governance preview chain without enforcement",
    reason: "Future sandbox review must inspect governance layers without activating or enforcing them."
  },
  {
    key: "validate-human-review-workflow-completeness",
    title: "Validate human review workflow completeness",
    reason: "Future sandbox review must confirm manual review gates remain mandatory."
  },
  {
    key: "validate-no-autonomous-actions",
    title: "Validate no autonomous actions",
    reason: "Future sandbox review must confirm autonomous actions remain disallowed."
  },
  {
    key: "validate-no-runtime-behavior-changes",
    title: "Validate no runtime behavior changes",
    reason: "Future sandbox review must confirm runtime behavior remains unchanged."
  },
  {
    key: "validate-risk-register-completeness",
    title: "Validate risk register completeness",
    reason: "Future sandbox review must confirm risk entries, mitigations, and blockers are represented."
  },
  {
    key: "validate-safe-patch-engine-exclusivity",
    title: "Validate Safe Patch Engine exclusivity",
    reason: "Future sandbox review must preserve Safe Patch Engine as the only mutation layer."
  },
  {
    key: "validate-sandbox-safe-reporting-outputs",
    title: "Validate sandbox-safe reporting outputs",
    reason: "Future sandbox review may inspect local reporting outputs without executing sandbox behavior."
  },
  {
    key: "validate-simulation-consistency",
    title: "Validate simulation consistency",
    reason: "Future sandbox review must compare simulation outputs deterministically."
  }
];

const BOUNDARY_DEFINITIONS: Array<Omit<GovernanceAutonomySandboxBoundary, "id">> = [
  {
    key: "no-autonomous-actions",
    boundaryType: "must-remain-human-reviewed",
    reason: "Sandbox planning must not allow autonomous actions."
  },
  {
    key: "no-external-services",
    boundaryType: "must-never-execute",
    reason: "Sandbox planning must not call external services."
  },
  {
    key: "no-mutation-scope-expansion",
    boundaryType: "must-remain-read-only",
    reason: "Sandbox planning must not expand mutation scope."
  },
  {
    key: "no-policy-activation",
    boundaryType: "must-remain-preview-only",
    reason: "Sandbox planning must not activate policies."
  },
  {
    key: "no-plugin-or-script-execution",
    boundaryType: "must-never-execute",
    reason: "Sandbox planning must not run plugins or scripts."
  },
  {
    key: "no-risk-acceptance",
    boundaryType: "must-remain-human-reviewed",
    reason: "Sandbox planning must not approve or accept risks."
  },
  {
    key: "no-runtime-behavior-mutation",
    boundaryType: "must-remain-read-only",
    reason: "Sandbox planning must not mutate runtime behavior."
  },
  {
    key: "no-runtime-learning",
    boundaryType: "must-never-execute",
    reason: "Sandbox planning must not introduce runtime learning."
  },
  {
    key: "no-sandbox-command-execution",
    boundaryType: "must-never-execute",
    reason: "Sandbox planning must not execute sandbox commands."
  },
  {
    key: "preview-only-planning",
    boundaryType: "must-remain-preview-only",
    reason: "Sandbox planning must remain preview-only."
  },
  {
    key: "safe-patch-engine-exclusive",
    boundaryType: "must-remain-safe-patch-only",
    reason: "Sandbox planning must not bypass Safe Patch Engine."
  }
];

const FUTURE_ONLY_TEST_DEFINITIONS: Array<Omit<
  GovernanceAutonomySandboxFutureOnlyTest,
  "id" | "futureOnly" | "requiresHumanApproval"
>> = [
  {
    key: "compare-deterministic-artifacts",
    category: "artifact-generation",
    reason: "Artifact comparison is future-only and requires human approval."
  },
  {
    key: "generate-ci-pr-preview-artifacts",
    category: "ci-pr-preview",
    reason: "CI/PR preview artifact generation is future-only and requires human approval."
  },
  {
    key: "generate-governance-reports",
    category: "governance-reporting",
    reason: "Governance report generation is future-only and requires human approval."
  },
  {
    key: "generate-human-review-packs",
    category: "human-review",
    reason: "Human review pack generation is future-only and requires human approval."
  },
  {
    key: "generate-risk-summaries",
    category: "risk-analysis",
    reason: "Risk summary generation is future-only and requires human approval."
  },
  {
    key: "generate-simulation-previews",
    category: "simulation",
    reason: "Simulation preview generation is future-only and requires human approval."
  },
  {
    key: "validate-preview-only-invariants",
    category: "policy-preview",
    reason: "Preview-only invariant validation is future-only and requires human approval."
  },
  {
    key: "verify-no-runtime-changes",
    category: "policy-preview",
    reason: "No-runtime-change verification is future-only and requires human approval."
  }
];

const PROHIBITED_TEST_DEFINITIONS: Array<Omit<GovernanceAutonomySandboxProhibitedTest, "id" | "permanentlyProhibited">> = [
  { key: "autonomous-policy-enforcement", reason: "Autonomous policy enforcement tests are permanently prohibited." },
  { key: "autonomous-repair-mutation", reason: "Autonomous repair mutation tests are permanently prohibited." },
  { key: "disabling-safety-invariants", reason: "Disabling safety invariant tests are permanently prohibited." },
  { key: "dynamic-script-execution", reason: "Dynamic script execution tests are permanently prohibited." },
  { key: "external-governance-execution", reason: "External governance execution tests are permanently prohibited." },
  { key: "governance-bypass-mechanisms", reason: "Governance bypass tests are permanently prohibited." },
  { key: "ml-vector-db-governance-decisioning", reason: "ML/vector DB governance decisioning tests are permanently prohibited." },
  { key: "mutation-scope-expansion", reason: "Mutation scope expansion tests are permanently prohibited." },
  { key: "plugin-execution", reason: "Plugin execution tests are permanently prohibited." },
  { key: "runtime-config-activation", reason: "Runtime config activation tests are permanently prohibited." },
  { key: "runtime-learning-governance", reason: "Runtime learning governance tests are permanently prohibited." },
  { key: "safe-patch-engine-bypass", reason: "Safe Patch Engine bypass tests are permanently prohibited." },
  { key: "self-modifying-governance", reason: "Self-modifying governance tests are permanently prohibited." },
  { key: "uncontrolled-multi-agent-orchestration", reason: "Uncontrolled multi-agent orchestration tests are permanently prohibited." }
];

const EXIT_CRITERION_DEFINITIONS: Array<Omit<GovernanceAutonomySandboxExitCriterion, "id" | "required">> = [
  { key: "all-artifacts-deterministic", reason: "All sandbox-plan evidence must remain deterministic." },
  { key: "all-future-only-tests-human-review-gated", reason: "All future-only tests must remain gated by human review." },
  { key: "all-invariants-preserved", reason: "All governance and autonomy safety invariants must remain preserved." },
  { key: "all-prohibited-tests-blocked", reason: "All prohibited tests must remain blocked." },
  { key: "no-autonomous-actions-allowed", reason: "Autonomous actions must remain disallowed." },
  { key: "no-autonomy-enabled", reason: "Autonomy must remain disabled." },
  { key: "no-governance-bypass-allowed", reason: "Governance bypass must remain disallowed." },
  { key: "no-repair-orchestration-change-detected", reason: "Repair orchestration must remain unchanged." },
  { key: "no-runtime-behavior-change-detected", reason: "Runtime behavior must remain unchanged." },
  { key: "safe-patch-engine-exclusivity-preserved", reason: "Safe Patch Engine exclusivity must remain preserved." }
];

const REVIEW_CHECKPOINT_DEFINITIONS: Array<Omit<GovernanceAutonomySandboxHumanReviewCheckpoint, "id" | "required">> = [
  { key: "approve-future-autonomy-experiment", reason: "Any future autonomy experiment requires human approval." },
  { key: "approve-future-ci-build-blocking-test", reason: "Any future CI/build-blocking test requires human approval." },
  { key: "approve-future-exception-approval-test", reason: "Any future exception approval test requires human approval." },
  { key: "approve-future-github-publishing-test", reason: "Any future GitHub publishing test requires human approval." },
  { key: "approve-future-mutation-boundary-test", reason: "Any future mutation-boundary test requires human approval." },
  { key: "approve-future-policy-activation-test", reason: "Any future policy activation test requires human approval." },
  { key: "approve-future-sandbox-creation", reason: "Any future sandbox creation requires human approval." },
  { key: "approve-future-sandbox-execution", reason: "Any future sandbox execution requires human approval." }
];

function conclusionFor(source: GovernanceAutonomyRiskRegisterPreview): Pick<
  GovernanceAutonomySandboxPlanPreview,
  "previewStatus" | "sandboxPlanConclusion" | "recommendedNextStage"
> {
  if (source.previewStatus === "not-created") {
    return {
      previewStatus: "not-created",
      sandboxPlanConclusion: "source-missing",
      recommendedNextStage: "continue-governance-hardening"
    };
  }
  if (source.previewStatus === "blocked") {
    return {
      previewStatus: "blocked",
      sandboxPlanConclusion: "blocked-preview",
      recommendedNextStage: "blocked"
    };
  }
  if (source.riskRegisterConclusion === "risk-review-ready-preview") {
    return {
      previewStatus: "created",
      sandboxPlanConclusion: "sandbox-plan-ready-preview",
      recommendedNextStage: "prepare-autonomy-sandbox-evidence-preview"
    };
  }
  return {
    previewStatus: "created",
    sandboxPlanConclusion: "sandbox-plan-not-ready",
    recommendedNextStage: "continue-governance-hardening"
  };
}

function withDeterministicIds<T extends { key: string }>(
  prefix: string,
  items: T[],
  sortKey: (item: T) => string = (item) => item.key
): Array<T & { id: string }> {
  return [...items]
    .sort((a, b) => sortKey(a).localeCompare(sortKey(b)))
    .map((item, index) => ({
      id: `${prefix}-${String(index + 1).padStart(3, "0")}`,
      ...item
    }));
}

function buildObjectives(): GovernanceAutonomySandboxObjective[] {
  return withDeterministicIds("gov-sandbox-objective", OBJECTIVE_DEFINITIONS, (item) => `${item.title}:${item.key}`);
}

function buildBoundaries(): GovernanceAutonomySandboxBoundary[] {
  return withDeterministicIds("gov-sandbox-boundary", BOUNDARY_DEFINITIONS, (item) => `${item.boundaryType}:${item.key}`);
}

function buildFutureOnlyTests(): GovernanceAutonomySandboxFutureOnlyTest[] {
  return withDeterministicIds("gov-sandbox-future-test", FUTURE_ONLY_TEST_DEFINITIONS, (item) => `${item.category}:${item.key}`).map((item) => ({
    ...item,
    futureOnly: true,
    requiresHumanApproval: true
  }));
}

function buildProhibitedTests(): GovernanceAutonomySandboxProhibitedTest[] {
  return withDeterministicIds("gov-sandbox-prohibited-test", PROHIBITED_TEST_DEFINITIONS).map((item) => ({
    ...item,
    permanentlyProhibited: true
  }));
}

function buildExitCriteria(): GovernanceAutonomySandboxExitCriterion[] {
  return withDeterministicIds("gov-sandbox-exit-criterion", EXIT_CRITERION_DEFINITIONS).map((item) => ({
    ...item,
    required: true
  }));
}

function buildHumanReviewCheckpoints(): GovernanceAutonomySandboxHumanReviewCheckpoint[] {
  return withDeterministicIds("gov-sandbox-review-checkpoint", REVIEW_CHECKPOINT_DEFINITIONS).map((item) => ({
    ...item,
    required: true
  }));
}

function buildSummary(
  sandboxObjectives: GovernanceAutonomySandboxObjective[],
  sandboxBoundaries: GovernanceAutonomySandboxBoundary[],
  futureOnlyTests: GovernanceAutonomySandboxFutureOnlyTest[],
  prohibitedTests: GovernanceAutonomySandboxProhibitedTest[],
  exitCriteria: GovernanceAutonomySandboxExitCriterion[],
  humanReviewCheckpoints: GovernanceAutonomySandboxHumanReviewCheckpoint[],
  conclusion: GovernanceAutonomySandboxPlanPreview["sandboxPlanConclusion"]
): GovernanceAutonomySandboxPlanPreview["summary"] {
  return {
    totalObjectives: sandboxObjectives.length,
    totalBoundaries: sandboxBoundaries.length,
    totalFutureOnlyTests: futureOnlyTests.length,
    totalProhibitedTests: prohibitedTests.length,
    totalExitCriteria: exitCriteria.length,
    totalHumanReviewCheckpoints: humanReviewCheckpoints.length,
    sandboxReadyForFutureReview: conclusion === "sandbox-plan-ready-preview"
  };
}

function warningsFor(conclusion: GovernanceAutonomySandboxPlanPreview["sandboxPlanConclusion"]): string[] {
  const warnings = [
    "Controlled autonomy sandbox plan preview is advisory only.",
    "No sandbox was created.",
    "No sandbox was executed.",
    "No sandbox plan was applied.",
    "No risk was accepted.",
    "No mitigation was applied.",
    "No autonomy was enabled.",
    "No autonomous actions are allowed.",
    "No governance was enforced.",
    "Runtime behavior did not change.",
    "Repair orchestration did not change."
  ];
  if (conclusion === "source-missing") {
    warnings.unshift("Autonomy risk register source is missing; sandbox plan preview is incomplete.");
  }
  if (conclusion === "sandbox-plan-not-ready") {
    warnings.unshift("Autonomy risk register is not ready for sandbox planning.");
  }
  if (conclusion === "sandbox-plan-ready-preview") {
    warnings.unshift("Autonomy sandbox plan is ready for future review only.");
  }
  if (conclusion === "blocked-preview") {
    warnings.unshift("Autonomy risk register is blocked; sandbox plan preview is blocked.");
  }
  return warnings;
}

export function buildGovernanceAutonomySandboxPlanPreviewFromRiskRegister(
  source: GovernanceAutonomyRiskRegisterPreview
): GovernanceAutonomySandboxPlanPreview {
  const conclusion = conclusionFor(source);
  const sandboxObjectives = buildObjectives();
  const sandboxBoundaries = buildBoundaries();
  const futureOnlyTests = buildFutureOnlyTests();
  const prohibitedTests = buildProhibitedTests();
  const exitCriteria = buildExitCriteria();
  const humanReviewCheckpoints = buildHumanReviewCheckpoints();

  return {
    schemaVersion: 1,
    previewStatus: conclusion.previewStatus,
    sourceRiskRegisterStatus: source.previewStatus,
    sandboxPlanConclusion: conclusion.sandboxPlanConclusion,
    sandboxCreated: false,
    sandboxExecuted: false,
    sandboxPlanApplied: false,
    sandboxEnforced: false,
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
    sandboxObjectives,
    sandboxBoundaries,
    futureOnlyTests,
    prohibitedTests,
    exitCriteria,
    humanReviewCheckpoints,
    summary: buildSummary(
      sandboxObjectives,
      sandboxBoundaries,
      futureOnlyTests,
      prohibitedTests,
      exitCriteria,
      humanReviewCheckpoints,
      conclusion.sandboxPlanConclusion
    ),
    warnings: warningsFor(conclusion.sandboxPlanConclusion),
    recommendedNextStage: conclusion.recommendedNextStage
  };
}

export function buildGovernanceAutonomySandboxPlanPreview(projectRoot: string): GovernanceAutonomySandboxPlanPreview {
  return buildGovernanceAutonomySandboxPlanPreviewFromRiskRegister(
    buildGovernanceAutonomyRiskRegisterPreview(projectRoot)
  );
}

export function renderGovernanceAutonomySandboxPlanPreviewMarkdown(
  preview: GovernanceAutonomySandboxPlanPreview
): string {
  const lines = [
    "# AI Software Factory - Controlled Autonomy Sandbox Plan Preview",
    "",
    "Preview status:",
    preview.previewStatus,
    "",
    "Source risk register status:",
    preview.sourceRiskRegisterStatus,
    "",
    "Sandbox plan conclusion:",
    preview.sandboxPlanConclusion,
    "",
    "Sandbox created:",
    String(preview.sandboxCreated),
    "",
    "Sandbox executed:",
    String(preview.sandboxExecuted),
    "",
    "Sandbox plan applied:",
    String(preview.sandboxPlanApplied),
    "",
    "Sandbox enforced:",
    String(preview.sandboxEnforced),
    "",
    "Risk accepted:",
    String(preview.riskAccepted),
    "",
    "Risk mitigation applied:",
    String(preview.riskMitigationApplied),
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
    "Objective count:",
    String(preview.summary.totalObjectives),
    "",
    "Boundary count:",
    String(preview.summary.totalBoundaries),
    "",
    "Future-only test count:",
    String(preview.summary.totalFutureOnlyTests),
    "",
    "Prohibited test count:",
    String(preview.summary.totalProhibitedTests),
    "",
    "Exit criteria count:",
    String(preview.summary.totalExitCriteria),
    "",
    "Human review checkpoint count:",
    String(preview.summary.totalHumanReviewCheckpoints),
    "",
    "Sandbox ready for future review:",
    String(preview.summary.sandboxReadyForFutureReview),
    "",
    "Recommended next stage:",
    preview.recommendedNextStage,
    "",
    "## Sandbox Objectives",
    ""
  ];

  for (const objective of preview.sandboxObjectives) {
    lines.push(`- ${objective.id} ${objective.key} - ${objective.reason}`);
  }

  lines.push("", "## Sandbox Boundaries", "");
  for (const boundary of preview.sandboxBoundaries) {
    lines.push(`- [${boundary.boundaryType}] ${boundary.id} ${boundary.key} - ${boundary.reason}`);
  }

  lines.push("", "## Future-Only Tests", "");
  for (const test of preview.futureOnlyTests) {
    lines.push(`- [${test.category}] ${test.id} ${test.key} - ${test.reason}`);
  }

  lines.push("", "## Prohibited Tests", "");
  for (const test of preview.prohibitedTests) {
    lines.push(`- ${test.id} ${test.key} - ${test.reason}`);
  }

  lines.push("", "## Exit Criteria", "");
  for (const criterion of preview.exitCriteria) {
    lines.push(`- ${criterion.id} ${criterion.key} - ${criterion.reason}`);
  }

  lines.push("", "## Human Review Checkpoints", "");
  for (const checkpoint of preview.humanReviewCheckpoints) {
    lines.push(`- ${checkpoint.id} ${checkpoint.key} - ${checkpoint.reason}`);
  }

  lines.push("", "## Warnings", "");
  for (const warning of preview.warnings) {
    lines.push(`- ${warning}`);
  }

  return `${lines.join("\n")}\n`;
}

export function renderGovernanceAutonomySandboxPlanPreviewText(
  preview: GovernanceAutonomySandboxPlanPreview
): string {
  return renderGovernanceAutonomySandboxPlanPreviewMarkdown(preview);
}

export function writeGovernanceAutonomySandboxPlanPreviewArtifacts(
  projectRoot: string,
  preview: GovernanceAutonomySandboxPlanPreview
): { jsonPath: string; markdownPath: string } {
  const jsonPath = path.join(projectRoot, ARTIFACT_JSON_PATH);
  const markdownPath = path.join(projectRoot, ARTIFACT_MARKDOWN_PATH);
  fs.ensureDirSync(path.dirname(jsonPath));
  fs.writeFileSync(jsonPath, `${JSON.stringify(preview, null, 2)}\n`, "utf8");
  fs.writeFileSync(markdownPath, renderGovernanceAutonomySandboxPlanPreviewMarkdown(preview), "utf8");
  return {
    jsonPath: ARTIFACT_JSON_PATH,
    markdownPath: ARTIFACT_MARKDOWN_PATH
  };
}
