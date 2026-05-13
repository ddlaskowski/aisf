import fs from "fs-extra";
import path from "node:path";

import {
  buildGovernanceAutonomyDesignReviewPack,
  type GovernanceAutonomyDesignReviewPack
} from "./autonomyDesignReviewPack.js";

export type GovernanceHumanApprovalWorkflowStep = {
  id: string;
  key: string;
  title: string;
  status: "required" | "blocked" | "not-ready" | "future-only";
  reason: string;
  humanApprovalGranted: false;
  approvalApplied: false;
  approvalWorkflowEnforced: false;
};

export type GovernanceHumanApprovalManualDecision = {
  id: string;
  key: string;
  required: true;
  reason: string;
};

export type GovernanceHumanApprovalBlocker = {
  id: string;
  key: string;
  reason: string;
};

export type GovernanceForbiddenApprovalPath = {
  id: string;
  key: string;
  permanentlyForbidden: true;
  reason: string;
};

export type GovernanceHumanApprovalWorkflowPreview = {
  schemaVersion: 1;
  previewStatus: "not-created" | "created" | "blocked";
  sourceDesignReviewPackStatus: "not-created" | "created" | "blocked";
  approvalWorkflowConclusion:
    | "source-missing"
    | "workflow-not-ready"
    | "workflow-ready-preview"
    | "blocked-preview";
  humanApprovalGranted: false;
  approvalApplied: false;
  approvalWorkflowEnforced: false;
  designReviewApproved: false;
  designReviewApplied: false;
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
  workflowSteps: GovernanceHumanApprovalWorkflowStep[];
  manualDecisions: GovernanceHumanApprovalManualDecision[];
  approvalBlockers: GovernanceHumanApprovalBlocker[];
  permanentlyForbiddenApprovalPaths: GovernanceForbiddenApprovalPath[];
  summary: {
    totalWorkflowSteps: number;
    requiredSteps: number;
    blockedSteps: number;
    notReadySteps: number;
    futureOnlySteps: number;
    manualDecisionCount: number;
    approvalBlockerCount: number;
    permanentlyForbiddenApprovalPathCount: number;
    workflowReadyForFutureReview: boolean;
  };
  warnings: string[];
  recommendedNextStage:
    | "continue-governance-hardening"
    | "prepare-controlled-autonomy-scope-preview"
    | "blocked";
};

const ARTIFACT_JSON_PATH = ".factory/governance/human-approval-workflow-preview.json";
const ARTIFACT_MARKDOWN_PATH = ".factory/governance/human-approval-workflow-preview.md";

const WORKFLOW_STEP_DEFINITIONS: Array<Omit<GovernanceHumanApprovalWorkflowStep, "id" | "status" | "humanApprovalGranted" | "approvalApplied" | "approvalWorkflowEnforced">> = [
  { key: "confirm-no-governance-bypass-paths", title: "Confirm no governance bypass paths", reason: "Human reviewers must confirm governance bypass paths remain unavailable." },
  { key: "confirm-no-repair-orchestration-changes", title: "Confirm no repair orchestration changes", reason: "Human reviewers must confirm repair orchestration behavior remains unchanged." },
  { key: "confirm-no-runtime-behavior-changes", title: "Confirm no runtime behavior changes", reason: "Human reviewers must confirm runtime behavior remains unchanged." },
  { key: "review-ci-build-blocking-restrictions", title: "Review CI/build blocking restrictions", reason: "Human reviewers must review future CI/build blocking restrictions before any design can proceed." },
  { key: "review-controlled-autonomy-readiness", title: "Review controlled autonomy readiness", reason: "Human reviewers must review controlled autonomy readiness evidence." },
  { key: "review-design-review-pack", title: "Review design review pack", reason: "Human reviewers must review the deterministic design review pack." },
  { key: "review-exception-approval-restrictions", title: "Review exception approval restrictions", reason: "Human reviewers must review exception approval restrictions." },
  { key: "review-forbidden-capabilities", title: "Review forbidden capabilities", reason: "Human reviewers must verify forbidden capabilities remain blocked." },
  { key: "review-github-publishing-restrictions", title: "Review GitHub publishing restrictions", reason: "Human reviewers must review future GitHub publishing restrictions." },
  { key: "review-governance-attestation", title: "Review governance attestation", reason: "Human reviewers must review governance attestation evidence." },
  { key: "review-human-review-requirements", title: "Review human review requirements", reason: "Human reviewers must review required manual approval gates." },
  { key: "review-mutation-boundaries", title: "Review mutation boundaries", reason: "Human reviewers must review mutation boundaries." },
  { key: "review-policy-activation-restrictions", title: "Review policy activation restrictions", reason: "Human reviewers must review policy activation restrictions." },
  { key: "review-runtime-activation-gates", title: "Review runtime activation gates", reason: "Human reviewers must review runtime activation gate evidence." },
  { key: "review-safe-patch-engine-exclusivity", title: "Review Safe Patch Engine exclusivity", reason: "Human reviewers must confirm Safe Patch Engine remains the only mutation layer." },
  { key: "review-safety-invariants", title: "Review safety invariants", reason: "Human reviewers must verify all safety invariants remain preserved." }
];

const MANUAL_DECISION_DEFINITIONS: Array<Omit<GovernanceHumanApprovalManualDecision, "id" | "required">> = [
  { key: "autonomy-scope-boundaries-acceptable", reason: "A human must decide whether future autonomy scope boundaries are acceptable." },
  { key: "ci-build-blocking-design-may-proceed", reason: "A human must decide whether CI/build blocking design may proceed." },
  { key: "controlled-autonomy-design-may-proceed", reason: "A human must decide whether future controlled autonomy design may proceed." },
  { key: "exception-approval-design-may-proceed", reason: "A human must decide whether exception approval design may proceed." },
  { key: "github-publishing-design-may-proceed", reason: "A human must decide whether GitHub publishing design may proceed." },
  { key: "human-override-requirements-mandatory", reason: "A human must decide whether human override requirements remain mandatory." },
  { key: "mutation-boundaries-remain-acceptable", reason: "A human must decide whether mutation boundaries remain acceptable." },
  { key: "policy-enforcement-design-may-proceed", reason: "A human must decide whether policy enforcement design may proceed." },
  { key: "runtime-activation-design-may-proceed", reason: "A human must decide whether runtime activation design may proceed." },
  { key: "safe-patch-engine-exclusivity-mandatory", reason: "A human must decide whether Safe Patch Engine exclusivity remains mandatory." }
];

const FORBIDDEN_APPROVAL_PATH_DEFINITIONS: Array<Omit<GovernanceForbiddenApprovalPath, "id" | "permanentlyForbidden">> = [
  { key: "approving-autonomous-execution-without-human-approval-gates", reason: "Approving autonomous execution without human approval gates is permanently forbidden." },
  { key: "approving-disabling-safety-invariants", reason: "Approving disabled safety invariants is permanently forbidden." },
  { key: "approving-dynamic-script-execution", reason: "Approving dynamic script execution is permanently forbidden." },
  { key: "approving-external-governance-execution", reason: "Approving external governance execution is permanently forbidden." },
  { key: "approving-governance-bypass-mechanisms", reason: "Approving governance bypass mechanisms is permanently forbidden." },
  { key: "approving-ml-vector-db-governance-decisioning", reason: "Approving ML/vector DB governance decisioning is permanently forbidden." },
  { key: "approving-mutation-scope-expansion", reason: "Approving mutation scope expansion is permanently forbidden." },
  { key: "approving-plugin-execution", reason: "Approving plugin execution is permanently forbidden." },
  { key: "approving-runtime-learning-governance", reason: "Approving runtime learning governance is permanently forbidden." },
  { key: "approving-safe-patch-engine-bypass", reason: "Approving Safe Patch Engine bypass is permanently forbidden." },
  { key: "approving-self-modifying-governance", reason: "Approving self-modifying governance is permanently forbidden." },
  { key: "approving-uncontrolled-multi-agent-orchestration", reason: "Approving uncontrolled multi-agent orchestration is permanently forbidden." }
];

function sourceStatusFor(
  pack: GovernanceAutonomyDesignReviewPack
): GovernanceHumanApprovalWorkflowPreview["sourceDesignReviewPackStatus"] {
  if (pack.reviewPackStatus === "blocked") {
    return "blocked";
  }
  if (pack.reviewPackStatus === "not-created") {
    return "not-created";
  }
  return "created";
}

function conclusionFor(
  pack: GovernanceAutonomyDesignReviewPack,
  sourceStatus: GovernanceHumanApprovalWorkflowPreview["sourceDesignReviewPackStatus"]
): Pick<GovernanceHumanApprovalWorkflowPreview, "previewStatus" | "approvalWorkflowConclusion" | "recommendedNextStage"> {
  if (sourceStatus === "not-created") {
    return {
      previewStatus: "not-created",
      approvalWorkflowConclusion: "source-missing",
      recommendedNextStage: "continue-governance-hardening"
    };
  }
  if (sourceStatus === "blocked") {
    return {
      previewStatus: "blocked",
      approvalWorkflowConclusion: "blocked-preview",
      recommendedNextStage: "blocked"
    };
  }
  if (pack.reviewPackConclusion === "review-ready-preview") {
    return {
      previewStatus: "created",
      approvalWorkflowConclusion: "workflow-ready-preview",
      recommendedNextStage: "prepare-controlled-autonomy-scope-preview"
    };
  }
  return {
    previewStatus: "created",
    approvalWorkflowConclusion: "workflow-not-ready",
    recommendedNextStage: "continue-governance-hardening"
  };
}

function stepStatusFor(
  conclusion: GovernanceHumanApprovalWorkflowPreview["approvalWorkflowConclusion"],
  key: string
): GovernanceHumanApprovalWorkflowStep["status"] {
  if (key.includes("restrictions")) {
    return "future-only";
  }
  if (conclusion === "blocked-preview") {
    return "blocked";
  }
  if (conclusion === "source-missing" || conclusion === "workflow-not-ready") {
    return "not-ready";
  }
  return "required";
}

function buildWorkflowSteps(
  conclusion: GovernanceHumanApprovalWorkflowPreview["approvalWorkflowConclusion"]
): GovernanceHumanApprovalWorkflowStep[] {
  return [...WORKFLOW_STEP_DEFINITIONS]
    .map((item) => ({
      ...item,
      status: stepStatusFor(conclusion, item.key)
    }))
    .sort((a, b) => `${a.key}:${a.title}:${a.status}`.localeCompare(`${b.key}:${b.title}:${b.status}`))
    .map((item, index) => ({
      id: `gov-human-approval-step-${String(index + 1).padStart(3, "0")}`,
      humanApprovalGranted: false,
      approvalApplied: false,
      approvalWorkflowEnforced: false,
      ...item
    }));
}

function buildManualDecisions(): GovernanceHumanApprovalManualDecision[] {
  return [...MANUAL_DECISION_DEFINITIONS]
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((item, index) => ({
      id: `gov-human-decision-${String(index + 1).padStart(3, "0")}`,
      required: true,
      ...item
    }));
}

function buildForbiddenApprovalPaths(): GovernanceForbiddenApprovalPath[] {
  return [...FORBIDDEN_APPROVAL_PATH_DEFINITIONS]
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((item, index) => ({
      id: `gov-human-forbidden-path-${String(index + 1).padStart(3, "0")}`,
      permanentlyForbidden: true,
      ...item
    }));
}

function buildApprovalBlockers(
  pack: GovernanceAutonomyDesignReviewPack,
  conclusion: GovernanceHumanApprovalWorkflowPreview["approvalWorkflowConclusion"]
): GovernanceHumanApprovalBlocker[] {
  const blockers: Array<Omit<GovernanceHumanApprovalBlocker, "id">> = [];
  if (conclusion === "source-missing") {
    blockers.push({
      key: "design-review-pack-missing",
      reason: "Controlled autonomy design review pack is missing."
    });
  }
  if (conclusion === "blocked-preview") {
    blockers.push({
      key: "design-review-pack-blocked",
      reason: "Controlled autonomy design review pack is blocked."
    });
  }
  if (conclusion === "workflow-not-ready") {
    blockers.push({
      key: "design-review-pack-not-ready",
      reason: `Controlled autonomy design review pack conclusion is ${pack.reviewPackConclusion}.`
    });
  }

  return blockers
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((item, index) => ({
      id: `gov-human-approval-blocker-${String(index + 1).padStart(3, "0")}`,
      ...item
    }));
}

function buildSummary(
  workflowSteps: GovernanceHumanApprovalWorkflowStep[],
  manualDecisions: GovernanceHumanApprovalManualDecision[],
  approvalBlockers: GovernanceHumanApprovalBlocker[],
  permanentlyForbiddenApprovalPaths: GovernanceForbiddenApprovalPath[],
  conclusion: GovernanceHumanApprovalWorkflowPreview["approvalWorkflowConclusion"]
): GovernanceHumanApprovalWorkflowPreview["summary"] {
  return {
    totalWorkflowSteps: workflowSteps.length,
    requiredSteps: workflowSteps.filter((item) => item.status === "required").length,
    blockedSteps: workflowSteps.filter((item) => item.status === "blocked").length,
    notReadySteps: workflowSteps.filter((item) => item.status === "not-ready").length,
    futureOnlySteps: workflowSteps.filter((item) => item.status === "future-only").length,
    manualDecisionCount: manualDecisions.length,
    approvalBlockerCount: approvalBlockers.length,
    permanentlyForbiddenApprovalPathCount: permanentlyForbiddenApprovalPaths.length,
    workflowReadyForFutureReview: conclusion === "workflow-ready-preview"
  };
}

function warningsFor(conclusion: GovernanceHumanApprovalWorkflowPreview["approvalWorkflowConclusion"]): string[] {
  const warnings = [
    "Human approval workflow is preview-only.",
    "No human approval was granted.",
    "No approval was applied.",
    "No autonomy was enabled.",
    "No autonomous actions are allowed.",
    "No governance was enforced.",
    "Runtime behavior did not change.",
    "Repair orchestration did not change."
  ];
  if (conclusion === "source-missing") {
    warnings.unshift("Design review pack source is missing; approval workflow preview is incomplete.");
  }
  if (conclusion === "blocked-preview") {
    warnings.unshift("Design review pack is blocked; approval workflow preview is blocked.");
  }
  if (conclusion === "workflow-not-ready") {
    warnings.unshift("Design review pack is not ready for human approval workflow review.");
  }
  if (conclusion === "workflow-ready-preview") {
    warnings.unshift("Human approval workflow is ready for future review only.");
  }
  return warnings;
}

export function buildGovernanceHumanApprovalWorkflowPreviewFromDesignReviewPack(
  pack: GovernanceAutonomyDesignReviewPack
): GovernanceHumanApprovalWorkflowPreview {
  const sourceDesignReviewPackStatus = sourceStatusFor(pack);
  const conclusion = conclusionFor(pack, sourceDesignReviewPackStatus);
  const workflowSteps = buildWorkflowSteps(conclusion.approvalWorkflowConclusion);
  const manualDecisions = buildManualDecisions();
  const approvalBlockers = buildApprovalBlockers(pack, conclusion.approvalWorkflowConclusion);
  const permanentlyForbiddenApprovalPaths = buildForbiddenApprovalPaths();
  const summary = buildSummary(
    workflowSteps,
    manualDecisions,
    approvalBlockers,
    permanentlyForbiddenApprovalPaths,
    conclusion.approvalWorkflowConclusion
  );

  return {
    schemaVersion: 1,
    previewStatus: conclusion.previewStatus,
    sourceDesignReviewPackStatus,
    approvalWorkflowConclusion: conclusion.approvalWorkflowConclusion,
    humanApprovalGranted: false,
    approvalApplied: false,
    approvalWorkflowEnforced: false,
    designReviewApproved: false,
    designReviewApplied: false,
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
    workflowSteps,
    manualDecisions,
    approvalBlockers,
    permanentlyForbiddenApprovalPaths,
    summary,
    warnings: warningsFor(conclusion.approvalWorkflowConclusion),
    recommendedNextStage: conclusion.recommendedNextStage
  };
}

export function buildGovernanceHumanApprovalWorkflowPreview(projectRoot: string): GovernanceHumanApprovalWorkflowPreview {
  return buildGovernanceHumanApprovalWorkflowPreviewFromDesignReviewPack(
    buildGovernanceAutonomyDesignReviewPack(projectRoot)
  );
}

export function renderGovernanceHumanApprovalWorkflowPreviewMarkdown(preview: GovernanceHumanApprovalWorkflowPreview): string {
  const lines = [
    "# AI Software Factory - Human Approval Workflow Preview",
    "",
    "Preview status:",
    preview.previewStatus,
    "",
    "Source design review pack status:",
    preview.sourceDesignReviewPackStatus,
    "",
    "Approval workflow conclusion:",
    preview.approvalWorkflowConclusion,
    "",
    "Human approval granted:",
    String(preview.humanApprovalGranted),
    "",
    "Approval applied:",
    String(preview.approvalApplied),
    "",
    "Approval workflow enforced:",
    String(preview.approvalWorkflowEnforced),
    "",
    "Design review approved:",
    String(preview.designReviewApproved),
    "",
    "Design review applied:",
    String(preview.designReviewApplied),
    "",
    "Autonomy enabled:",
    String(preview.autonomyEnabled),
    "",
    "Autonomous actions allowed:",
    String(preview.autonomousActionsAllowed),
    "",
    "Autonomy applied:",
    String(preview.autonomyApplied),
    "",
    "Autonomy enforced:",
    String(preview.autonomyEnforced),
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
    "Activation enforced:",
    String(preview.activationEnforced),
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
    "Total workflow steps:",
    String(preview.summary.totalWorkflowSteps),
    "",
    "Manual decision count:",
    String(preview.summary.manualDecisionCount),
    "",
    "Approval blocker count:",
    String(preview.summary.approvalBlockerCount),
    "",
    "Permanently forbidden approval path count:",
    String(preview.summary.permanentlyForbiddenApprovalPathCount),
    "",
    "Workflow ready for future review:",
    String(preview.summary.workflowReadyForFutureReview),
    "",
    "Recommended next stage:",
    preview.recommendedNextStage,
    "",
    "## Workflow Steps",
    ""
  ];

  for (const item of preview.workflowSteps) {
    lines.push(`- [${item.status}] ${item.id} ${item.key} - ${item.reason}`);
  }

  lines.push("", "## Manual Decisions", "");
  for (const item of preview.manualDecisions) {
    lines.push(`- ${item.id} ${item.key} - ${item.reason}`);
  }

  lines.push("", "## Approval Blockers", "");
  if (preview.approvalBlockers.length === 0) {
    lines.push("- none");
  } else {
    for (const item of preview.approvalBlockers) {
      lines.push(`- ${item.id} ${item.key} - ${item.reason}`);
    }
  }

  lines.push("", "## Permanently Forbidden Approval Paths", "");
  for (const item of preview.permanentlyForbiddenApprovalPaths) {
    lines.push(`- ${item.id} ${item.key} - ${item.reason}`);
  }

  lines.push("", "## Warnings", "");
  for (const warning of preview.warnings) {
    lines.push(`- ${warning}`);
  }

  return `${lines.join("\n")}\n`;
}

export function renderGovernanceHumanApprovalWorkflowPreviewText(preview: GovernanceHumanApprovalWorkflowPreview): string {
  return renderGovernanceHumanApprovalWorkflowPreviewMarkdown(preview);
}

export function writeGovernanceHumanApprovalWorkflowPreviewArtifacts(
  projectRoot: string,
  preview: GovernanceHumanApprovalWorkflowPreview
): { jsonPath: string; markdownPath: string } {
  const jsonPath = path.join(projectRoot, ARTIFACT_JSON_PATH);
  const markdownPath = path.join(projectRoot, ARTIFACT_MARKDOWN_PATH);
  fs.ensureDirSync(path.dirname(jsonPath));
  fs.writeFileSync(jsonPath, `${JSON.stringify(preview, null, 2)}\n`, "utf8");
  fs.writeFileSync(markdownPath, renderGovernanceHumanApprovalWorkflowPreviewMarkdown(preview), "utf8");
  return {
    jsonPath: ARTIFACT_JSON_PATH,
    markdownPath: ARTIFACT_MARKDOWN_PATH
  };
}
