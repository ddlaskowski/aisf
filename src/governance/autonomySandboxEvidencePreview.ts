import fs from "fs-extra";
import path from "node:path";

import {
  buildGovernanceAutonomySandboxPlanPreview,
  type GovernanceAutonomySandboxPlanPreview
} from "./autonomySandboxPlanPreview.js";

export type GovernanceAutonomySandboxEvidenceSection = {
  id: string;
  title: string;
  category:
    | "readiness"
    | "activation-gates"
    | "design-review"
    | "approval-workflow"
    | "scope-preview"
    | "risk-register"
    | "sandbox-plan"
    | "safety-invariants"
    | "forbidden-capabilities";
  lines: string[];
};

export type GovernanceAutonomySandboxEvidenceReference = {
  id: string;
  key: string;
  source:
    | "autonomy-readiness"
    | "runtime-activation-gates-preview"
    | "autonomy-design-review-pack"
    | "human-approval-workflow-preview"
    | "autonomy-scope-preview"
    | "autonomy-risk-register-preview"
    | "autonomy-sandbox-plan-preview";
  reason: string;
};

export type GovernanceAutonomySandboxMissingEvidence = {
  id: string;
  key: string;
  reason: string;
};

export type GovernanceAutonomySandboxHumanReviewEvidence = {
  id: string;
  key: string;
  required: true;
  reason: string;
};

export type GovernanceAutonomySandboxForbiddenEvidenceCategory = {
  id: string;
  key: string;
  permanentlyForbidden: true;
  reason: string;
};

export type GovernanceAutonomySandboxEvidencePreview = {
  schemaVersion: 1;
  previewStatus: "not-created" | "created" | "blocked";
  sourceSandboxPlanStatus: "not-created" | "created" | "blocked";
  sandboxEvidenceConclusion:
    | "source-missing"
    | "sandbox-evidence-not-ready"
    | "sandbox-evidence-ready-preview"
    | "blocked-preview";
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
  evidenceSections: GovernanceAutonomySandboxEvidenceSection[];
  evidenceReferences: GovernanceAutonomySandboxEvidenceReference[];
  missingEvidence: GovernanceAutonomySandboxMissingEvidence[];
  requiredHumanReviewEvidence: GovernanceAutonomySandboxHumanReviewEvidence[];
  forbiddenEvidenceCategories: GovernanceAutonomySandboxForbiddenEvidenceCategory[];
  summary: {
    totalEvidenceSections: number;
    totalEvidenceReferences: number;
    totalMissingEvidence: number;
    totalRequiredHumanReviewEvidence: number;
    totalForbiddenEvidenceCategories: number;
    evidenceReadyForFutureReview: boolean;
  };
  warnings: string[];
  recommendedNextStage:
    | "continue-governance-hardening"
    | "prepare-autonomy-observability-preview"
    | "blocked";
};

const ARTIFACT_JSON_PATH = ".factory/governance/autonomy-sandbox-evidence-preview.json";
const ARTIFACT_MARKDOWN_PATH = ".factory/governance/autonomy-sandbox-evidence-preview.md";

const SECTION_DEFINITIONS: Array<Omit<GovernanceAutonomySandboxEvidenceSection, "id">> = [
  {
    title: "Activation Gate Evidence",
    category: "activation-gates",
    lines: [
      "Runtime activation gates remain preview-only.",
      "No runtime activation occurred.",
      "Activation gate evidence is advisory only."
    ]
  },
  {
    title: "Approval Workflow Evidence",
    category: "approval-workflow",
    lines: [
      "Human approval workflow remains preview-only.",
      "No human approval was granted.",
      "Approval workflow evidence is required before future sandbox review."
    ]
  },
  {
    title: "Design Review Evidence",
    category: "design-review",
    lines: [
      "Design review pack remains preview-only.",
      "No design review approval was applied.",
      "Design review evidence is required before future autonomy review."
    ]
  },
  {
    title: "Forbidden Capability Evidence",
    category: "forbidden-capabilities",
    lines: [
      "Forbidden capabilities remain blocked.",
      "No forbidden evidence category is allowed.",
      "No governance bypass was enabled."
    ]
  },
  {
    title: "Readiness Evidence",
    category: "readiness",
    lines: [
      "Autonomy readiness remains a deterministic preview.",
      "Autonomy remains disabled.",
      "Autonomous actions remain disallowed."
    ]
  },
  {
    title: "Risk Register Evidence",
    category: "risk-register",
    lines: [
      "Risk register preview is advisory only.",
      "No risk was accepted.",
      "No mitigation was applied."
    ]
  },
  {
    title: "Safety Invariant Evidence",
    category: "safety-invariants",
    lines: [
      "Runtime behavior did not change.",
      "Governance decisions did not change.",
      "Repair orchestration did not change.",
      "Safe Patch Engine remains the only mutation layer."
    ]
  },
  {
    title: "Sandbox Planning Evidence",
    category: "sandbox-plan",
    lines: [
      "Sandbox plan remains preview-only.",
      "No sandbox was created.",
      "No sandbox was executed."
    ]
  },
  {
    title: "Scope Preview Evidence",
    category: "scope-preview",
    lines: [
      "Autonomy scope remains preview-only.",
      "No scope was approved.",
      "No scope was applied."
    ]
  }
];

const REFERENCE_DEFINITIONS: Array<Omit<GovernanceAutonomySandboxEvidenceReference, "id">> = [
  {
    key: "autonomy-design-review-pack",
    source: "autonomy-design-review-pack",
    reason: "References design review evidence for future controlled-autonomy review."
  },
  {
    key: "autonomy-readiness",
    source: "autonomy-readiness",
    reason: "References readiness evidence for future controlled-autonomy review."
  },
  {
    key: "autonomy-risk-register-preview",
    source: "autonomy-risk-register-preview",
    reason: "References risk register evidence and mitigation recommendations."
  },
  {
    key: "autonomy-sandbox-plan-preview",
    source: "autonomy-sandbox-plan-preview",
    reason: "References sandbox objectives, boundaries, future-only tests, and exit criteria."
  },
  {
    key: "autonomy-scope-preview",
    source: "autonomy-scope-preview",
    reason: "References scope boundary evidence for future sandbox review."
  },
  {
    key: "human-approval-workflow-preview",
    source: "human-approval-workflow-preview",
    reason: "References manual approval workflow evidence."
  },
  {
    key: "runtime-activation-gates-preview",
    source: "runtime-activation-gates-preview",
    reason: "References runtime activation gate evidence."
  }
];

const MISSING_EVIDENCE_DEFINITIONS: Array<Omit<GovernanceAutonomySandboxMissingEvidence, "id">> = [
  { key: "missing-future-autonomy-rollback-strategy", reason: "Future autonomy rollback strategy has not been defined." },
  { key: "missing-future-ci-build-review-process", reason: "Future CI/build review process has not been defined." },
  { key: "missing-future-github-publishing-review-process", reason: "Future GitHub publishing review process has not been defined." },
  { key: "missing-future-runtime-activation-review-process", reason: "Future runtime activation review process has not been defined." },
  { key: "missing-future-sandbox-approval-definitions", reason: "Future sandbox approval definitions have not been created." },
  { key: "missing-future-sandbox-observability-validation", reason: "Future sandbox observability validation has not been defined." },
  { key: "missing-human-review-documentation", reason: "Human review documentation remains required for future sandbox review." }
];

const HUMAN_REVIEW_EVIDENCE_DEFINITIONS: Array<Omit<GovernanceAutonomySandboxHumanReviewEvidence, "id" | "required">> = [
  { key: "future-exception-approval", reason: "Any future exception approval requires human-review evidence." },
  { key: "future-governance-enforcement", reason: "Any future governance enforcement requires human-review evidence." },
  { key: "future-mutation-boundary-change", reason: "Any future mutation-boundary change requires human-review evidence." },
  { key: "future-policy-activation", reason: "Any future policy activation requires human-review evidence." },
  { key: "future-repair-orchestration-change", reason: "Any future repair orchestration change requires human-review evidence." },
  { key: "future-sandbox-creation", reason: "Any future sandbox creation requires human-review evidence." },
  { key: "future-sandbox-execution", reason: "Any future sandbox execution requires human-review evidence." },
  { key: "future-autonomy-enablement", reason: "Any future autonomy enablement requires human-review evidence." }
];

const FORBIDDEN_EVIDENCE_CATEGORY_DEFINITIONS: Array<Omit<
  GovernanceAutonomySandboxForbiddenEvidenceCategory,
  "id" | "permanentlyForbidden"
>> = [
  { key: "disabling-safety-invariants", reason: "Evidence for disabling safety invariants is permanently forbidden." },
  { key: "dynamic-script-execution", reason: "Evidence for dynamic script execution is permanently forbidden." },
  { key: "external-governance-execution", reason: "Evidence for external governance execution is permanently forbidden." },
  { key: "governance-bypass-mechanisms", reason: "Evidence for governance bypass mechanisms is permanently forbidden." },
  { key: "ml-vector-db-governance-decisioning", reason: "Evidence for ML/vector DB governance decisioning is permanently forbidden." },
  { key: "mutation-scope-expansion", reason: "Evidence for mutation scope expansion is permanently forbidden." },
  { key: "plugin-execution", reason: "Evidence for plugin execution is permanently forbidden." },
  { key: "runtime-learning-governance", reason: "Evidence for runtime learning governance is permanently forbidden." },
  { key: "safe-patch-engine-bypass", reason: "Evidence for Safe Patch Engine bypass is permanently forbidden." },
  { key: "self-modifying-governance", reason: "Evidence for self-modifying governance is permanently forbidden." },
  { key: "uncontrolled-multi-agent-orchestration", reason: "Evidence for uncontrolled multi-agent orchestration is permanently forbidden." }
];

function withDeterministicIds<T extends { key?: string; title?: string; category?: string }>(
  prefix: string,
  items: T[],
  sortKey: (item: T) => string = (item) => `${item.category ?? ""}:${item.title ?? ""}:${item.key ?? ""}`
): Array<T & { id: string }> {
  return [...items]
    .sort((a, b) => sortKey(a).localeCompare(sortKey(b)))
    .map((item, index) => ({
      id: `${prefix}-${String(index + 1).padStart(3, "0")}`,
      ...item
    }));
}

function conclusionFor(source: GovernanceAutonomySandboxPlanPreview): Pick<
  GovernanceAutonomySandboxEvidencePreview,
  "previewStatus" | "sandboxEvidenceConclusion" | "recommendedNextStage"
> {
  if (source.previewStatus === "not-created") {
    return {
      previewStatus: "not-created",
      sandboxEvidenceConclusion: "source-missing",
      recommendedNextStage: "continue-governance-hardening"
    };
  }
  if (source.previewStatus === "blocked") {
    return {
      previewStatus: "blocked",
      sandboxEvidenceConclusion: "blocked-preview",
      recommendedNextStage: "blocked"
    };
  }
  if (source.sandboxPlanConclusion === "sandbox-plan-ready-preview") {
    return {
      previewStatus: "created",
      sandboxEvidenceConclusion: "sandbox-evidence-ready-preview",
      recommendedNextStage: "prepare-autonomy-observability-preview"
    };
  }
  return {
    previewStatus: "created",
    sandboxEvidenceConclusion: "sandbox-evidence-not-ready",
    recommendedNextStage: "continue-governance-hardening"
  };
}

function buildEvidenceSections(): GovernanceAutonomySandboxEvidenceSection[] {
  return withDeterministicIds("gov-sandbox-evidence-section", SECTION_DEFINITIONS);
}

function buildEvidenceReferences(): GovernanceAutonomySandboxEvidenceReference[] {
  return withDeterministicIds("gov-sandbox-evidence-ref", REFERENCE_DEFINITIONS, (item) => `${item.source}:${item.key}`);
}

function buildMissingEvidence(): GovernanceAutonomySandboxMissingEvidence[] {
  return withDeterministicIds("gov-sandbox-missing-evidence", MISSING_EVIDENCE_DEFINITIONS, (item) => item.key);
}

function buildHumanReviewEvidence(): GovernanceAutonomySandboxHumanReviewEvidence[] {
  return withDeterministicIds("gov-sandbox-human-review-evidence", HUMAN_REVIEW_EVIDENCE_DEFINITIONS, (item) => item.key)
    .map((item) => ({
      ...item,
      required: true
    }));
}

function buildForbiddenEvidenceCategories(): GovernanceAutonomySandboxForbiddenEvidenceCategory[] {
  return withDeterministicIds(
    "gov-sandbox-forbidden-evidence",
    FORBIDDEN_EVIDENCE_CATEGORY_DEFINITIONS,
    (item) => item.key
  ).map((item) => ({
    ...item,
    permanentlyForbidden: true
  }));
}

function buildSummary(
  evidenceSections: GovernanceAutonomySandboxEvidenceSection[],
  evidenceReferences: GovernanceAutonomySandboxEvidenceReference[],
  missingEvidence: GovernanceAutonomySandboxMissingEvidence[],
  requiredHumanReviewEvidence: GovernanceAutonomySandboxHumanReviewEvidence[],
  forbiddenEvidenceCategories: GovernanceAutonomySandboxForbiddenEvidenceCategory[],
  conclusion: GovernanceAutonomySandboxEvidencePreview["sandboxEvidenceConclusion"]
): GovernanceAutonomySandboxEvidencePreview["summary"] {
  return {
    totalEvidenceSections: evidenceSections.length,
    totalEvidenceReferences: evidenceReferences.length,
    totalMissingEvidence: missingEvidence.length,
    totalRequiredHumanReviewEvidence: requiredHumanReviewEvidence.length,
    totalForbiddenEvidenceCategories: forbiddenEvidenceCategories.length,
    evidenceReadyForFutureReview: conclusion === "sandbox-evidence-ready-preview"
  };
}

function warningsFor(conclusion: GovernanceAutonomySandboxEvidencePreview["sandboxEvidenceConclusion"]): string[] {
  const warnings = [
    "Controlled autonomy sandbox evidence preview is advisory only.",
    "No evidence was applied.",
    "No evidence was enforced.",
    "No sandbox was created.",
    "No sandbox was executed.",
    "No autonomy was enabled.",
    "No autonomous actions are allowed.",
    "No governance was enforced.",
    "Runtime behavior did not change.",
    "Repair orchestration did not change."
  ];
  if (conclusion === "source-missing") {
    warnings.unshift("Autonomy sandbox plan source is missing; sandbox evidence preview is incomplete.");
  }
  if (conclusion === "sandbox-evidence-not-ready") {
    warnings.unshift("Autonomy sandbox plan is not ready for sandbox evidence preview.");
  }
  if (conclusion === "sandbox-evidence-ready-preview") {
    warnings.unshift("Autonomy sandbox evidence is ready for future review only.");
  }
  if (conclusion === "blocked-preview") {
    warnings.unshift("Autonomy sandbox plan is blocked; sandbox evidence preview is blocked.");
  }
  return warnings;
}

export function buildGovernanceAutonomySandboxEvidencePreviewFromSandboxPlan(
  source: GovernanceAutonomySandboxPlanPreview
): GovernanceAutonomySandboxEvidencePreview {
  const conclusion = conclusionFor(source);
  const evidenceSections = buildEvidenceSections();
  const evidenceReferences = buildEvidenceReferences();
  const missingEvidence = buildMissingEvidence();
  const requiredHumanReviewEvidence = buildHumanReviewEvidence();
  const forbiddenEvidenceCategories = buildForbiddenEvidenceCategories();

  return {
    schemaVersion: 1,
    previewStatus: conclusion.previewStatus,
    sourceSandboxPlanStatus: source.previewStatus,
    sandboxEvidenceConclusion: conclusion.sandboxEvidenceConclusion,
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
    evidenceSections,
    evidenceReferences,
    missingEvidence,
    requiredHumanReviewEvidence,
    forbiddenEvidenceCategories,
    summary: buildSummary(
      evidenceSections,
      evidenceReferences,
      missingEvidence,
      requiredHumanReviewEvidence,
      forbiddenEvidenceCategories,
      conclusion.sandboxEvidenceConclusion
    ),
    warnings: warningsFor(conclusion.sandboxEvidenceConclusion),
    recommendedNextStage: conclusion.recommendedNextStage
  };
}

export function buildGovernanceAutonomySandboxEvidencePreview(projectRoot: string): GovernanceAutonomySandboxEvidencePreview {
  return buildGovernanceAutonomySandboxEvidencePreviewFromSandboxPlan(
    buildGovernanceAutonomySandboxPlanPreview(projectRoot)
  );
}

export function renderGovernanceAutonomySandboxEvidencePreviewMarkdown(
  preview: GovernanceAutonomySandboxEvidencePreview
): string {
  const lines = [
    "# AI Software Factory - Controlled Autonomy Sandbox Evidence Preview",
    "",
    "Preview status:",
    preview.previewStatus,
    "",
    "Source sandbox plan status:",
    preview.sourceSandboxPlanStatus,
    "",
    "Sandbox evidence conclusion:",
    preview.sandboxEvidenceConclusion,
    "",
    "Sandbox created:",
    String(preview.sandboxCreated),
    "",
    "Sandbox executed:",
    String(preview.sandboxExecuted),
    "",
    "Evidence applied:",
    String(preview.evidenceApplied),
    "",
    "Evidence enforced:",
    String(preview.evidenceEnforced),
    "",
    "Risk accepted:",
    String(preview.riskAccepted),
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
    "Evidence section count:",
    String(preview.summary.totalEvidenceSections),
    "",
    "Evidence reference count:",
    String(preview.summary.totalEvidenceReferences),
    "",
    "Missing evidence count:",
    String(preview.summary.totalMissingEvidence),
    "",
    "Required human review evidence count:",
    String(preview.summary.totalRequiredHumanReviewEvidence),
    "",
    "Forbidden evidence category count:",
    String(preview.summary.totalForbiddenEvidenceCategories),
    "",
    "Evidence ready for future review:",
    String(preview.summary.evidenceReadyForFutureReview),
    "",
    "Recommended next stage:",
    preview.recommendedNextStage,
    "",
    "## Evidence Sections",
    ""
  ];

  for (const section of preview.evidenceSections) {
    lines.push(`- [${section.category}] ${section.id} ${section.title}`);
    for (const line of section.lines) {
      lines.push(`  - ${line}`);
    }
  }

  lines.push("", "## Evidence References", "");
  for (const reference of preview.evidenceReferences) {
    lines.push(`- [${reference.source}] ${reference.id} ${reference.key} - ${reference.reason}`);
  }

  lines.push("", "## Missing Evidence", "");
  for (const item of preview.missingEvidence) {
    lines.push(`- ${item.id} ${item.key} - ${item.reason}`);
  }

  lines.push("", "## Required Human Review Evidence", "");
  for (const item of preview.requiredHumanReviewEvidence) {
    lines.push(`- ${item.id} ${item.key} - ${item.reason}`);
  }

  lines.push("", "## Forbidden Evidence Categories", "");
  for (const item of preview.forbiddenEvidenceCategories) {
    lines.push(`- ${item.id} ${item.key} - ${item.reason}`);
  }

  lines.push("", "## Warnings", "");
  for (const warning of preview.warnings) {
    lines.push(`- ${warning}`);
  }

  return `${lines.join("\n")}\n`;
}

export function renderGovernanceAutonomySandboxEvidencePreviewText(
  preview: GovernanceAutonomySandboxEvidencePreview
): string {
  return renderGovernanceAutonomySandboxEvidencePreviewMarkdown(preview);
}

export function writeGovernanceAutonomySandboxEvidencePreviewArtifacts(
  projectRoot: string,
  preview: GovernanceAutonomySandboxEvidencePreview
): { jsonPath: string; markdownPath: string } {
  const jsonPath = path.join(projectRoot, ARTIFACT_JSON_PATH);
  const markdownPath = path.join(projectRoot, ARTIFACT_MARKDOWN_PATH);
  fs.ensureDirSync(path.dirname(jsonPath));
  fs.writeFileSync(jsonPath, `${JSON.stringify(preview, null, 2)}\n`, "utf8");
  fs.writeFileSync(markdownPath, renderGovernanceAutonomySandboxEvidencePreviewMarkdown(preview), "utf8");
  return {
    jsonPath: ARTIFACT_JSON_PATH,
    markdownPath: ARTIFACT_MARKDOWN_PATH
  };
}
