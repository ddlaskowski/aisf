import fs from "fs-extra";
import path from "node:path";

import {
  buildGovernanceAutonomyLifecyclePreview,
  type GovernanceAutonomyLifecyclePreview
} from "./autonomyGovernanceLifecyclePreview.js";

export type GovernanceRuntimeSafetyArchitectureSection = {
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

export type GovernanceRuntimeSafetyBoundary = {
  id: string;
  key: string;
  boundaryType:
    | "must-remain-preview-only"
    | "must-remain-safe-patch-only"
    | "must-remain-human-reviewed"
    | "must-never-execute"
    | "must-never-self-modify";
  reason: string;
};

export type GovernanceRuntimeSafetyInvariant = {
  id: string;
  key: string;
  severity: "high" | "critical";
  reason: string;
  invariantPreserved: true;
};

export type GovernanceRuntimeSafetyGate = {
  id: string;
  key: string;
  gateType:
    | "human-review"
    | "runtime-activation"
    | "policy-activation"
    | "sandbox"
    | "repair"
    | "rollback"
    | "observability"
    | "scope";
  required: true;
  reason: string;
};

export type GovernanceForbiddenRuntimeCapability = {
  id: string;
  key: string;
  permanentlyForbidden: true;
  reason: string;
};

export type GovernanceRuntimeRollbackPreparationConcept = {
  id: string;
  key: string;
  planningOnly: true;
  reason: string;
};

export type GovernanceRuntimeSafetyDesignPreview = {
  schemaVersion: 1;
  previewStatus: "not-created" | "created" | "blocked";
  sourceLifecycleStatus: "not-created" | "created" | "blocked";
  runtimeSafetyConclusion:
    | "source-missing"
    | "runtime-safety-not-ready"
    | "runtime-safety-ready-preview"
    | "blocked-preview";
  runtimeSafetyApplied: false;
  runtimeSafetyEnforced: false;
  runtimeSafetyActivated: false;
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
  lifecycleApplied: false;
  lifecycleEnforced: false;
  controlPlaneApplied: false;
  controlPlaneEnforced: false;
  sandboxCreated: false;
  sandboxExecuted: false;
  observabilityApplied: false;
  riskAccepted: false;
  riskMitigationApplied: false;
  scopeApproved: false;
  humanApprovalGranted: false;
  designReviewApproved: false;
  autonomyEnabled: false;
  autonomousActionsAllowed: false;
  autonomyApplied: false;
  autonomyEnforced: false;
  governanceBypassAllowed: false;
  applied: false;
  enforced: false;
  policyRuntimeMode: "preview-only";
  runtimeBehaviorChanged: false;
  governanceDecisionsChanged: false;
  repairOrchestrationChanged: false;
  safePatchEngineOnly: true;
  runtimeSafetyArchitecture: GovernanceRuntimeSafetyArchitectureSection[];
  runtimeSafetyBoundaries: GovernanceRuntimeSafetyBoundary[];
  runtimeSafetyInvariants: GovernanceRuntimeSafetyInvariant[];
  runtimeSafetyGates: GovernanceRuntimeSafetyGate[];
  forbiddenRuntimeCapabilities: GovernanceForbiddenRuntimeCapability[];
  rollbackPreparationConcepts: GovernanceRuntimeRollbackPreparationConcept[];
  summary: {
    totalArchitectureSections: number;
    totalSafetyBoundaries: number;
    totalSafetyInvariants: number;
    totalSafetyGates: number;
    totalForbiddenCapabilities: number;
    totalRollbackPreparationConcepts: number;
    runtimeSafetyReadyForFutureReview: boolean;
  };
  warnings: string[];
  recommendedNextStage:
    | "continue-runtime-safety-hardening"
    | "prepare-runtime-safety-evidence-preview"
    | "blocked";
};

const ARTIFACT_JSON_PATH = ".factory/governance/runtime-safety-design-preview.json";
const ARTIFACT_MARKDOWN_PATH = ".factory/governance/runtime-safety-design-preview.md";

const ARCHITECTURE_DEFINITIONS: Array<Omit<GovernanceRuntimeSafetyArchitectureSection, "id">> = [
  { title: "Runtime Autonomy Architecture", category: "runtime-autonomy", lines: ["Runtime autonomy remains disabled.", "No runtime autonomous actions are allowed.", "Any future runtime autonomy design requires human review gates."] },
  { title: "Runtime Control Plane Architecture", category: "runtime-control-plane", lines: ["Runtime control plane behavior is not applied.", "Runtime kill switches are not activated.", "Operator overrides are not executed."] },
  { title: "Runtime Forbidden Capability Architecture", category: "runtime-forbidden-capabilities", lines: ["Forbidden runtime capabilities remain permanently blocked.", "No runtime plugin, script, learning, ML, or multi-agent execution is enabled.", "No governance bypass is allowed."] },
  { title: "Runtime Governance Architecture", category: "runtime-governance", lines: ["Runtime governance remains preview-only.", "No runtime governance is enabled.", "No runtime behavior changes occur."] },
  { title: "Runtime Observability Architecture", category: "runtime-observability", lines: ["Runtime observability design remains advisory.", "No telemetry backend or runtime pipeline is created.", "Future visibility requires explicit gates."] },
  { title: "Runtime Policy Architecture", category: "runtime-policy", lines: ["Runtime policy enforcement remains disabled.", "No policy is activated.", "Policy runtime mode remains preview-only."] },
  { title: "Runtime Rollback Preparation Architecture", category: "runtime-rollback", lines: ["Rollback preparation is conceptual only.", "No rollback action is executed.", "Future rollback requires audit preservation and human review."] },
  { title: "Runtime Safety Gate Architecture", category: "runtime-safety-gates", lines: ["Runtime activation gates are required before any future activation design.", "Policy, sandbox, repair, rollback, observability, and scope gates remain required.", "No gate is passed or executed here."] },
  { title: "Runtime Sandbox Architecture", category: "runtime-sandbox", lines: ["Runtime sandbox execution remains disallowed.", "No sandbox is executed.", "Future sandbox execution requires explicit human review gates."] }
];

const BOUNDARY_DEFINITIONS: Array<Omit<GovernanceRuntimeSafetyBoundary, "id">> = [
  { key: "no-external-governance-execution", boundaryType: "must-never-execute", reason: "Runtime external governance execution must never be allowed by this preview." },
  { key: "no-plugin-execution", boundaryType: "must-never-execute", reason: "Runtime plugin execution must remain disabled." },
  { key: "no-runtime-learning", boundaryType: "must-never-execute", reason: "Runtime learning must remain disabled." },
  { key: "no-runtime-mutation-scope-expansion", boundaryType: "must-never-execute", reason: "Runtime mutation scope expansion must remain blocked." },
  { key: "no-script-execution", boundaryType: "must-never-execute", reason: "Runtime script execution and evaluation must remain disabled." },
  { key: "no-self-modifying-governance", boundaryType: "must-never-self-modify", reason: "Runtime governance must never self-modify." },
  { key: "no-uncontrolled-multi-agent-orchestration", boundaryType: "must-never-execute", reason: "Runtime multi-agent coordination must remain disabled." },
  { key: "preview-only-runtime-governance", boundaryType: "must-remain-preview-only", reason: "Runtime governance design remains preview-only." },
  { key: "safe-patch-engine-exclusivity", boundaryType: "must-remain-safe-patch-only", reason: "Safe Patch Engine remains the only mutation layer." }
];

const INVARIANT_DEFINITIONS: Array<Omit<GovernanceRuntimeSafetyInvariant, "id" | "invariantPreserved">> = [
  { key: "no-governance-bypass", severity: "critical", reason: "Governance bypass remains disallowed." },
  { key: "no-ml-vector-db-governance-decisioning", severity: "critical", reason: "Runtime ML/vector DB governance decisioning remains disabled." },
  { key: "no-plugin-script-execution", severity: "critical", reason: "Runtime plugin and script execution remain disabled." },
  { key: "no-repair-orchestration-changes", severity: "critical", reason: "Repair orchestration remains unchanged." },
  { key: "no-runtime-autonomy-execution", severity: "critical", reason: "Runtime autonomy execution remains disabled." },
  { key: "no-runtime-external-execution", severity: "critical", reason: "Runtime external execution remains disabled." },
  { key: "no-runtime-learning", severity: "critical", reason: "Runtime learning remains disabled." },
  { key: "no-runtime-mutation-expansion", severity: "critical", reason: "Runtime mutation scope expansion remains blocked." },
  { key: "no-runtime-policy-enforcement", severity: "critical", reason: "Runtime policy enforcement remains disabled." },
  { key: "safe-patch-engine-only", severity: "critical", reason: "Safe Patch Engine remains the only mutation layer." }
];

const GATE_DEFINITIONS: Array<Omit<GovernanceRuntimeSafetyGate, "id" | "required">> = [
  { key: "future-runtime-autonomy-enablement", gateType: "human-review", reason: "Any future runtime autonomy enablement requires a human review gate." },
  { key: "future-runtime-mutation-boundary-change", gateType: "scope", reason: "Any future runtime mutation-boundary change requires a scope gate." },
  { key: "future-runtime-override-application", gateType: "human-review", reason: "Any future runtime override application requires a human review gate." },
  { key: "future-runtime-policy-enforcement", gateType: "policy-activation", reason: "Any future runtime policy enforcement requires a policy activation gate." },
  { key: "future-runtime-repair-orchestration-change", gateType: "repair", reason: "Any future runtime repair orchestration change requires a repair gate." },
  { key: "future-runtime-rollback-execution", gateType: "rollback", reason: "Any future runtime rollback execution requires a rollback gate." },
  { key: "future-runtime-sandbox-execution", gateType: "sandbox", reason: "Any future runtime sandbox execution requires a sandbox gate." },
  { key: "future-runtime-safety-observability", gateType: "observability", reason: "Any future runtime safety activation requires an observability gate." },
  { key: "future-runtime-safety-activation", gateType: "runtime-activation", reason: "Any future runtime activation requires a runtime activation gate." }
];

const FORBIDDEN_DEFINITIONS: Array<Omit<GovernanceForbiddenRuntimeCapability, "id" | "permanentlyForbidden">> = [
  { key: "disabling-runtime-safety-invariants", reason: "Disabling runtime safety invariants is permanently forbidden." },
  { key: "runtime-autonomous-repair-execution", reason: "Runtime autonomous repair execution is permanently forbidden." },
  { key: "runtime-external-execution", reason: "Runtime external execution is permanently forbidden." },
  { key: "runtime-learning-governance", reason: "Runtime learning governance is permanently forbidden." },
  { key: "runtime-ml-vector-db-governance-decisioning", reason: "Runtime ML/vector DB governance decisioning is permanently forbidden." },
  { key: "runtime-mutation-scope-expansion", reason: "Runtime mutation scope expansion is permanently forbidden." },
  { key: "runtime-plugin-execution", reason: "Runtime plugin execution is permanently forbidden." },
  { key: "runtime-safe-patch-engine-bypass", reason: "Runtime Safe Patch Engine bypass is permanently forbidden." },
  { key: "runtime-script-evaluation", reason: "Runtime script evaluation is permanently forbidden." },
  { key: "runtime-self-modifying-governance", reason: "Runtime self-modifying governance is permanently forbidden." },
  { key: "uncontrolled-runtime-multi-agent-orchestration", reason: "Uncontrolled runtime multi-agent orchestration is permanently forbidden." }
];

const ROLLBACK_DEFINITIONS: Array<Omit<GovernanceRuntimeRollbackPreparationConcept, "id" | "planningOnly">> = [
  { key: "future-audit-preservation", reason: "Future rollback preparation must preserve audit evidence." },
  { key: "future-mutation-boundary-verification", reason: "Future rollback preparation must verify mutation boundaries." },
  { key: "future-runtime-autonomy-shutdown", reason: "Future rollback preparation must define runtime autonomy shutdown." },
  { key: "future-runtime-governance-shutdown", reason: "Future rollback preparation must define runtime governance shutdown." },
  { key: "future-runtime-policy-freeze", reason: "Future rollback preparation must define runtime policy freeze." },
  { key: "future-runtime-rollback-verification", reason: "Future rollback preparation must define rollback verification." },
  { key: "future-runtime-sandbox-freeze", reason: "Future rollback preparation must define runtime sandbox freeze." },
  { key: "future-safe-patch-engine-verification", reason: "Future rollback preparation must verify Safe Patch Engine exclusivity." }
];

function withDeterministicIds<T>(prefix: string, items: T[], sortKey: (item: T) => string): Array<T & { id: string }> {
  return [...items]
    .sort((a, b) => sortKey(a).localeCompare(sortKey(b)))
    .map((item, index) => ({ id: `${prefix}-${String(index + 1).padStart(3, "0")}`, ...item }));
}

function conclusionFor(source: GovernanceAutonomyLifecyclePreview): Pick<GovernanceRuntimeSafetyDesignPreview, "previewStatus" | "runtimeSafetyConclusion" | "recommendedNextStage"> {
  if (source.previewStatus === "not-created") {
    return { previewStatus: "not-created", runtimeSafetyConclusion: "source-missing", recommendedNextStage: "continue-runtime-safety-hardening" };
  }
  if (source.previewStatus === "blocked") {
    return { previewStatus: "blocked", runtimeSafetyConclusion: "blocked-preview", recommendedNextStage: "blocked" };
  }
  if (source.lifecycleConclusion === "lifecycle-ready-preview") {
    return { previewStatus: "created", runtimeSafetyConclusion: "runtime-safety-ready-preview", recommendedNextStage: "prepare-runtime-safety-evidence-preview" };
  }
  return { previewStatus: "created", runtimeSafetyConclusion: "runtime-safety-not-ready", recommendedNextStage: "continue-runtime-safety-hardening" };
}

function buildArchitecture(): GovernanceRuntimeSafetyArchitectureSection[] {
  return withDeterministicIds("gov-runtime-safety-architecture", ARCHITECTURE_DEFINITIONS, (item) => `${item.category}:${item.title}`);
}

function buildBoundaries(): GovernanceRuntimeSafetyBoundary[] {
  return withDeterministicIds("gov-runtime-safety-boundary", BOUNDARY_DEFINITIONS, (item) => `${item.boundaryType}:${item.key}`);
}

function buildInvariants(): GovernanceRuntimeSafetyInvariant[] {
  return withDeterministicIds("gov-runtime-safety-invariant", INVARIANT_DEFINITIONS, (item) => `${item.severity}:${item.key}`)
    .map((item) => ({ ...item, invariantPreserved: true }));
}

function buildGates(): GovernanceRuntimeSafetyGate[] {
  return withDeterministicIds("gov-runtime-safety-gate", GATE_DEFINITIONS, (item) => `${item.gateType}:${item.key}`)
    .map((item) => ({ ...item, required: true }));
}

function buildForbiddenCapabilities(): GovernanceForbiddenRuntimeCapability[] {
  return withDeterministicIds("gov-runtime-safety-forbidden", FORBIDDEN_DEFINITIONS, (item) => item.key)
    .map((item) => ({ ...item, permanentlyForbidden: true }));
}

function buildRollbackConcepts(): GovernanceRuntimeRollbackPreparationConcept[] {
  return withDeterministicIds("gov-runtime-safety-rollback", ROLLBACK_DEFINITIONS, (item) => item.key)
    .map((item) => ({ ...item, planningOnly: true }));
}

function warningsFor(conclusion: GovernanceRuntimeSafetyDesignPreview["runtimeSafetyConclusion"]): string[] {
  const warnings = [
    "Runtime safety design preview is advisory only.",
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
  if (conclusion === "source-missing") warnings.unshift("Autonomy lifecycle source is missing; runtime safety design preview is incomplete.");
  if (conclusion === "runtime-safety-not-ready") warnings.unshift("Autonomy lifecycle preview is not ready for runtime safety design preview.");
  if (conclusion === "runtime-safety-ready-preview") warnings.unshift("Runtime safety design is ready for future review only.");
  if (conclusion === "blocked-preview") warnings.unshift("Autonomy lifecycle preview is blocked; runtime safety design preview is blocked.");
  return warnings;
}

export function buildGovernanceRuntimeSafetyDesignPreviewFromLifecycle(source: GovernanceAutonomyLifecyclePreview): GovernanceRuntimeSafetyDesignPreview {
  const conclusion = conclusionFor(source);
  const runtimeSafetyArchitecture = buildArchitecture();
  const runtimeSafetyBoundaries = buildBoundaries();
  const runtimeSafetyInvariants = buildInvariants();
  const runtimeSafetyGates = buildGates();
  const forbiddenRuntimeCapabilities = buildForbiddenCapabilities();
  const rollbackPreparationConcepts = buildRollbackConcepts();

  return {
    schemaVersion: 1,
    previewStatus: conclusion.previewStatus,
    sourceLifecycleStatus: source.previewStatus,
    runtimeSafetyConclusion: conclusion.runtimeSafetyConclusion,
    runtimeSafetyApplied: false,
    runtimeSafetyEnforced: false,
    runtimeSafetyActivated: false,
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
    lifecycleApplied: false,
    lifecycleEnforced: false,
    controlPlaneApplied: false,
    controlPlaneEnforced: false,
    sandboxCreated: false,
    sandboxExecuted: false,
    observabilityApplied: false,
    riskAccepted: false,
    riskMitigationApplied: false,
    scopeApproved: false,
    humanApprovalGranted: false,
    designReviewApproved: false,
    autonomyEnabled: false,
    autonomousActionsAllowed: false,
    autonomyApplied: false,
    autonomyEnforced: false,
    governanceBypassAllowed: false,
    applied: false,
    enforced: false,
    policyRuntimeMode: "preview-only",
    runtimeBehaviorChanged: false,
    governanceDecisionsChanged: false,
    repairOrchestrationChanged: false,
    safePatchEngineOnly: true,
    runtimeSafetyArchitecture,
    runtimeSafetyBoundaries,
    runtimeSafetyInvariants,
    runtimeSafetyGates,
    forbiddenRuntimeCapabilities,
    rollbackPreparationConcepts,
    summary: {
      totalArchitectureSections: runtimeSafetyArchitecture.length,
      totalSafetyBoundaries: runtimeSafetyBoundaries.length,
      totalSafetyInvariants: runtimeSafetyInvariants.length,
      totalSafetyGates: runtimeSafetyGates.length,
      totalForbiddenCapabilities: forbiddenRuntimeCapabilities.length,
      totalRollbackPreparationConcepts: rollbackPreparationConcepts.length,
      runtimeSafetyReadyForFutureReview: conclusion.runtimeSafetyConclusion === "runtime-safety-ready-preview"
    },
    warnings: warningsFor(conclusion.runtimeSafetyConclusion),
    recommendedNextStage: conclusion.recommendedNextStage
  };
}

export function buildGovernanceRuntimeSafetyDesignPreview(projectRoot: string): GovernanceRuntimeSafetyDesignPreview {
  return buildGovernanceRuntimeSafetyDesignPreviewFromLifecycle(buildGovernanceAutonomyLifecyclePreview(projectRoot));
}

export function renderGovernanceRuntimeSafetyDesignPreviewMarkdown(preview: GovernanceRuntimeSafetyDesignPreview): string {
  const lines = [
    "# AI Software Factory - Runtime Safety Design Preview",
    "",
    "Preview status:", preview.previewStatus,
    "", "Source lifecycle status:", preview.sourceLifecycleStatus,
    "", "Runtime safety conclusion:", preview.runtimeSafetyConclusion,
    "", "Runtime safety applied:", String(preview.runtimeSafetyApplied),
    "", "Runtime safety enforced:", String(preview.runtimeSafetyEnforced),
    "", "Runtime safety activated:", String(preview.runtimeSafetyActivated),
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
    "", "Architecture section count:", String(preview.summary.totalArchitectureSections),
    "", "Safety boundary count:", String(preview.summary.totalSafetyBoundaries),
    "", "Safety invariant count:", String(preview.summary.totalSafetyInvariants),
    "", "Safety gate count:", String(preview.summary.totalSafetyGates),
    "", "Forbidden capability count:", String(preview.summary.totalForbiddenCapabilities),
    "", "Rollback preparation concept count:", String(preview.summary.totalRollbackPreparationConcepts),
    "", "Runtime safety ready for future review:", String(preview.summary.runtimeSafetyReadyForFutureReview),
    "", "Recommended next stage:", preview.recommendedNextStage,
    "", "## Runtime Safety Architecture", ""
  ];
  for (const section of preview.runtimeSafetyArchitecture) {
    lines.push(`- [${section.category}] ${section.id} ${section.title}`);
    for (const line of section.lines) lines.push(`  - ${line}`);
  }
  lines.push("", "## Runtime Safety Boundaries", "");
  for (const item of preview.runtimeSafetyBoundaries) lines.push(`- [${item.boundaryType}] ${item.id} ${item.key} - ${item.reason}`);
  lines.push("", "## Runtime Safety Invariants", "");
  for (const item of preview.runtimeSafetyInvariants) lines.push(`- [${item.severity}] ${item.id} ${item.key} - ${item.reason}`);
  lines.push("", "## Runtime Safety Gates", "");
  for (const item of preview.runtimeSafetyGates) lines.push(`- [${item.gateType}] ${item.id} ${item.key} - ${item.reason}`);
  lines.push("", "## Forbidden Runtime Capabilities", "");
  for (const item of preview.forbiddenRuntimeCapabilities) lines.push(`- ${item.id} ${item.key} - ${item.reason}`);
  lines.push("", "## Rollback Preparation Concepts", "");
  for (const item of preview.rollbackPreparationConcepts) lines.push(`- ${item.id} ${item.key} - ${item.reason}`);
  lines.push("", "## Warnings", "");
  for (const warning of preview.warnings) lines.push(`- ${warning}`);
  return `${lines.join("\n")}\n`;
}

export function renderGovernanceRuntimeSafetyDesignPreviewText(preview: GovernanceRuntimeSafetyDesignPreview): string {
  return renderGovernanceRuntimeSafetyDesignPreviewMarkdown(preview);
}

export function writeGovernanceRuntimeSafetyDesignPreviewArtifacts(projectRoot: string, preview: GovernanceRuntimeSafetyDesignPreview): { jsonPath: string; markdownPath: string } {
  const jsonPath = path.join(projectRoot, ARTIFACT_JSON_PATH);
  const markdownPath = path.join(projectRoot, ARTIFACT_MARKDOWN_PATH);
  fs.ensureDirSync(path.dirname(jsonPath));
  fs.writeFileSync(jsonPath, `${JSON.stringify(preview, null, 2)}\n`, "utf8");
  fs.writeFileSync(markdownPath, renderGovernanceRuntimeSafetyDesignPreviewMarkdown(preview), "utf8");
  return { jsonPath: ARTIFACT_JSON_PATH, markdownPath: ARTIFACT_MARKDOWN_PATH };
}
