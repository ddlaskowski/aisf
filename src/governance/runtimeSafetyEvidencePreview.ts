import fs from "fs-extra";
import path from "node:path";

import {
  buildGovernanceRuntimeSafetyDesignPreview,
  type GovernanceRuntimeSafetyDesignPreview
} from "./runtimeSafetyDesignPreview.js";

export type GovernanceRuntimeSafetyEvidenceSection = {
  id: string;
  title: string;
  category:
    | "runtime-governance"
    | "runtime-autonomy"
    | "runtime-policy"
    | "runtime-control-plane"
    | "runtime-observability"
    | "runtime-sandbox"
    | "runtime-safety-gates"
    | "runtime-rollback"
    | "runtime-forbidden-capabilities";
  lines: string[];
};

export type GovernanceRuntimeSafetyEvidenceReference = {
  id: string;
  key: string;
  source:
    | "runtime-safety-design-preview"
    | "autonomy-lifecycle-preview"
    | "autonomy-control-plane-preview"
    | "autonomy-observability-preview";
  reason: string;
};

export type GovernanceMissingRuntimeSafetyEvidence = {
  id: string;
  key: string;
  severity: "low" | "medium" | "high";
  reason: string;
};

export type GovernanceRuntimeSafetyEvidencePreview = {
  schemaVersion: 1;
  previewStatus: "not-created" | "created" | "blocked";
  sourceRuntimeSafetyStatus: "not-created" | "created" | "blocked";
  runtimeSafetyEvidenceConclusion:
    | "source-missing"
    | "runtime-safety-evidence-not-ready"
    | "runtime-safety-evidence-ready-preview"
    | "blocked-preview";
  runtimeSafetyApplied: false;
  runtimeSafetyEnforced: false;
  runtimeSafetyActivated: false;
  runtimeSafetyEvidenceApplied: false;
  runtimeSafetyEvidenceEnforced: false;
  runtimeGovernanceEnabled: false;
  runtimeAutonomyEnabled: false;
  runtimeAutonomyActionsAllowed: false;
  runtimePolicyEnforcementEnabled: false;
  runtimeConfigActivationEnabled: false;
  runtimeOverrideApplied: false;
  runtimeControlPlaneApplied: false;
  runtimeKillSwitchActivated: false;
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
  runtimeSafetyEvidenceSections: GovernanceRuntimeSafetyEvidenceSection[];
  runtimeSafetyEvidenceReferences: GovernanceRuntimeSafetyEvidenceReference[];
  missingRuntimeSafetyEvidence: GovernanceMissingRuntimeSafetyEvidence[];
  summary: {
    totalEvidenceSections: number;
    totalEvidenceReferences: number;
    totalMissingEvidence: number;
    runtimeSafetyEvidenceReadyForFutureReview: boolean;
  };
  warnings: string[];
  recommendedNextStage:
    | "continue-runtime-safety-hardening"
    | "prepare-runtime-safety-observability-preview"
    | "blocked";
};

const ARTIFACT_JSON_PATH = ".factory/governance/runtime-safety-evidence-preview.json";
const ARTIFACT_MARKDOWN_PATH = ".factory/governance/runtime-safety-evidence-preview.md";

const EVIDENCE_REFERENCE_DEFINITIONS: Array<Omit<GovernanceRuntimeSafetyEvidenceReference, "id">> = [
  { key: "autonomy-control-plane-preview", source: "autonomy-control-plane-preview", reason: "Provides preview-only operator control, kill-switch, approval, sandbox, scope, and observability control evidence." },
  { key: "autonomy-lifecycle-preview", source: "autonomy-lifecycle-preview", reason: "Provides preview-only lifecycle stage, transition, blocker, and rollback planning evidence." },
  { key: "autonomy-observability-preview", source: "autonomy-observability-preview", reason: "Provides preview-only telemetry, audit event, alert, visibility, and missing coverage evidence." },
  { key: "runtime-safety-design-preview", source: "runtime-safety-design-preview", reason: "Provides runtime safety architecture, boundary, invariant, gate, forbidden capability, and rollback preparation evidence." }
];

const MISSING_EVIDENCE_DEFINITIONS: Array<Omit<GovernanceMissingRuntimeSafetyEvidence, "id">> = [
  { key: "missing-future-runtime-activation-review-evidence", severity: "high", reason: "Future runtime activation review evidence is not defined in executable form." },
  { key: "missing-future-runtime-freeze-evidence", severity: "medium", reason: "Future runtime freeze evidence remains planning-only." },
  { key: "missing-future-runtime-observability-validation-evidence", severity: "medium", reason: "Future runtime observability validation evidence is not collected by this preview." },
  { key: "missing-future-runtime-policy-audit-evidence", severity: "high", reason: "Future runtime policy audit evidence is not collected because runtime policy enforcement is disabled." },
  { key: "missing-future-runtime-rollback-verification-evidence", severity: "high", reason: "Future runtime rollback verification evidence remains unavailable until a future gated review." },
  { key: "missing-future-runtime-sandbox-validation-evidence", severity: "medium", reason: "Future runtime sandbox validation evidence is not collected because sandbox execution is disallowed." },
  { key: "missing-future-runtime-shutdown-evidence", severity: "medium", reason: "Future runtime shutdown evidence remains planning-only." }
];

function withDeterministicIds<T>(prefix: string, items: T[], sortKey: (item: T) => string): Array<T & { id: string }> {
  return [...items]
    .sort((a, b) => sortKey(a).localeCompare(sortKey(b)))
    .map((item, index) => ({ id: `${prefix}-${String(index + 1).padStart(3, "0")}`, ...item }));
}

function conclusionFor(source: GovernanceRuntimeSafetyDesignPreview): Pick<GovernanceRuntimeSafetyEvidencePreview, "previewStatus" | "runtimeSafetyEvidenceConclusion" | "recommendedNextStage"> {
  if (source.previewStatus === "not-created") {
    return { previewStatus: "not-created", runtimeSafetyEvidenceConclusion: "source-missing", recommendedNextStage: "continue-runtime-safety-hardening" };
  }
  if (source.previewStatus === "blocked") {
    return { previewStatus: "blocked", runtimeSafetyEvidenceConclusion: "blocked-preview", recommendedNextStage: "blocked" };
  }
  if (source.runtimeSafetyConclusion === "runtime-safety-ready-preview") {
    return { previewStatus: "created", runtimeSafetyEvidenceConclusion: "runtime-safety-evidence-ready-preview", recommendedNextStage: "prepare-runtime-safety-observability-preview" };
  }
  return { previewStatus: "created", runtimeSafetyEvidenceConclusion: "runtime-safety-evidence-not-ready", recommendedNextStage: "continue-runtime-safety-hardening" };
}

function buildEvidenceSections(source: GovernanceRuntimeSafetyDesignPreview): GovernanceRuntimeSafetyEvidenceSection[] {
  const sections = source.runtimeSafetyArchitecture.map((section) => ({
    title: section.title.replace("Architecture", "Evidence"),
    category: section.category,
    lines: [
      `Evidence source: ${section.id}.`,
      ...section.lines,
      "Runtime safety evidence is preview-only and is not applied."
    ]
  }));
  return withDeterministicIds("gov-runtime-evidence-section", sections, (item) => `${item.category}:${item.title}`);
}

function buildEvidenceReferences(): GovernanceRuntimeSafetyEvidenceReference[] {
  return withDeterministicIds("gov-runtime-evidence-ref", EVIDENCE_REFERENCE_DEFINITIONS, (item) => `${item.source}:${item.key}`);
}

function buildMissingEvidence(): GovernanceMissingRuntimeSafetyEvidence[] {
  return withDeterministicIds("gov-runtime-evidence-missing", MISSING_EVIDENCE_DEFINITIONS, (item) => `${item.severity}:${item.key}`);
}

function warningsFor(conclusion: GovernanceRuntimeSafetyEvidencePreview["runtimeSafetyEvidenceConclusion"]): string[] {
  const warnings = [
    "Runtime safety evidence preview is advisory only.",
    "Runtime safety evidence was not applied or enforced.",
    "Runtime safety was not applied, enforced, or activated.",
    "Runtime governance is not enabled.",
    "Runtime autonomy is not enabled.",
    "Runtime autonomous actions are not allowed.",
    "Runtime policies are not enforced.",
    "Runtime config activation is disabled.",
    "Runtime sandbox execution is not allowed.",
    "Runtime plugin, script, learning, ML, and multi-agent execution remain disabled.",
    "Runtime behavior did not change.",
    "Repair orchestration did not change."
  ];
  if (conclusion === "source-missing") warnings.unshift("Runtime safety design source is missing; runtime safety evidence preview is incomplete.");
  if (conclusion === "runtime-safety-evidence-not-ready") warnings.unshift("Runtime safety design preview is not ready for runtime safety evidence review.");
  if (conclusion === "runtime-safety-evidence-ready-preview") warnings.unshift("Runtime safety evidence is ready for future review only.");
  if (conclusion === "blocked-preview") warnings.unshift("Runtime safety design preview is blocked; runtime safety evidence preview is blocked.");
  return warnings;
}

export function buildGovernanceRuntimeSafetyEvidencePreviewFromDesign(source: GovernanceRuntimeSafetyDesignPreview): GovernanceRuntimeSafetyEvidencePreview {
  const conclusion = conclusionFor(source);
  const runtimeSafetyEvidenceSections = buildEvidenceSections(source);
  const runtimeSafetyEvidenceReferences = buildEvidenceReferences();
  const missingRuntimeSafetyEvidence = buildMissingEvidence();

  return {
    schemaVersion: 1,
    previewStatus: conclusion.previewStatus,
    sourceRuntimeSafetyStatus: source.previewStatus,
    runtimeSafetyEvidenceConclusion: conclusion.runtimeSafetyEvidenceConclusion,
    runtimeSafetyApplied: false,
    runtimeSafetyEnforced: false,
    runtimeSafetyActivated: false,
    runtimeSafetyEvidenceApplied: false,
    runtimeSafetyEvidenceEnforced: false,
    runtimeGovernanceEnabled: false,
    runtimeAutonomyEnabled: false,
    runtimeAutonomyActionsAllowed: false,
    runtimePolicyEnforcementEnabled: false,
    runtimeConfigActivationEnabled: false,
    runtimeOverrideApplied: false,
    runtimeControlPlaneApplied: false,
    runtimeKillSwitchActivated: false,
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
    runtimeSafetyEvidenceSections,
    runtimeSafetyEvidenceReferences,
    missingRuntimeSafetyEvidence,
    summary: {
      totalEvidenceSections: runtimeSafetyEvidenceSections.length,
      totalEvidenceReferences: runtimeSafetyEvidenceReferences.length,
      totalMissingEvidence: missingRuntimeSafetyEvidence.length,
      runtimeSafetyEvidenceReadyForFutureReview: conclusion.runtimeSafetyEvidenceConclusion === "runtime-safety-evidence-ready-preview"
    },
    warnings: warningsFor(conclusion.runtimeSafetyEvidenceConclusion),
    recommendedNextStage: conclusion.recommendedNextStage
  };
}

export function buildGovernanceRuntimeSafetyEvidencePreview(projectRoot: string): GovernanceRuntimeSafetyEvidencePreview {
  return buildGovernanceRuntimeSafetyEvidencePreviewFromDesign(buildGovernanceRuntimeSafetyDesignPreview(projectRoot));
}

export function renderGovernanceRuntimeSafetyEvidencePreviewMarkdown(preview: GovernanceRuntimeSafetyEvidencePreview): string {
  const lines = [
    "# AI Software Factory - Runtime Safety Evidence Preview",
    "",
    "Preview status:", preview.previewStatus,
    "", "Source runtime safety status:", preview.sourceRuntimeSafetyStatus,
    "", "Runtime safety evidence conclusion:", preview.runtimeSafetyEvidenceConclusion,
    "", "Runtime safety applied:", String(preview.runtimeSafetyApplied),
    "", "Runtime safety enforced:", String(preview.runtimeSafetyEnforced),
    "", "Runtime safety activated:", String(preview.runtimeSafetyActivated),
    "", "Runtime safety evidence applied:", String(preview.runtimeSafetyEvidenceApplied),
    "", "Runtime safety evidence enforced:", String(preview.runtimeSafetyEvidenceEnforced),
    "", "Runtime governance enabled:", String(preview.runtimeGovernanceEnabled),
    "", "Runtime autonomy enabled:", String(preview.runtimeAutonomyEnabled),
    "", "Runtime autonomy actions allowed:", String(preview.runtimeAutonomyActionsAllowed),
    "", "Runtime policy enforcement enabled:", String(preview.runtimePolicyEnforcementEnabled),
    "", "Runtime config activation enabled:", String(preview.runtimeConfigActivationEnabled),
    "", "Runtime override applied:", String(preview.runtimeOverrideApplied),
    "", "Runtime control plane applied:", String(preview.runtimeControlPlaneApplied),
    "", "Runtime kill switch activated:", String(preview.runtimeKillSwitchActivated),
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
    "", "Evidence section count:", String(preview.summary.totalEvidenceSections),
    "", "Evidence reference count:", String(preview.summary.totalEvidenceReferences),
    "", "Missing evidence count:", String(preview.summary.totalMissingEvidence),
    "", "Runtime safety evidence ready for future review:", String(preview.summary.runtimeSafetyEvidenceReadyForFutureReview),
    "", "Recommended next stage:", preview.recommendedNextStage,
    "", "## Runtime Safety Evidence Sections", ""
  ];
  for (const section of preview.runtimeSafetyEvidenceSections) {
    lines.push(`- [${section.category}] ${section.id} ${section.title}`);
    for (const line of section.lines) lines.push(`  - ${line}`);
  }
  lines.push("", "## Runtime Safety Evidence References", "");
  for (const item of preview.runtimeSafetyEvidenceReferences) lines.push(`- [${item.source}] ${item.id} ${item.key} - ${item.reason}`);
  lines.push("", "## Missing Runtime Safety Evidence", "");
  for (const item of preview.missingRuntimeSafetyEvidence) lines.push(`- [${item.severity}] ${item.id} ${item.key} - ${item.reason}`);
  lines.push("", "## Warnings", "");
  for (const warning of preview.warnings) lines.push(`- ${warning}`);
  return `${lines.join("\n")}\n`;
}

export function renderGovernanceRuntimeSafetyEvidencePreviewText(preview: GovernanceRuntimeSafetyEvidencePreview): string {
  return renderGovernanceRuntimeSafetyEvidencePreviewMarkdown(preview);
}

export function writeGovernanceRuntimeSafetyEvidencePreviewArtifacts(projectRoot: string, preview: GovernanceRuntimeSafetyEvidencePreview): { jsonPath: string; markdownPath: string } {
  const jsonPath = path.join(projectRoot, ARTIFACT_JSON_PATH);
  const markdownPath = path.join(projectRoot, ARTIFACT_MARKDOWN_PATH);
  fs.ensureDirSync(path.dirname(jsonPath));
  fs.writeFileSync(jsonPath, `${JSON.stringify(preview, null, 2)}\n`, "utf8");
  fs.writeFileSync(markdownPath, renderGovernanceRuntimeSafetyEvidencePreviewMarkdown(preview), "utf8");
  return { jsonPath: ARTIFACT_JSON_PATH, markdownPath: ARTIFACT_MARKDOWN_PATH };
}
