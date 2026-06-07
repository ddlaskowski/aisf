import type { GovernanceMetadata } from "./governanceMetadata.js";
import { normalizeWarnings, sortDeterministically } from "./utils/governanceUtils.js";

export type ProjectGenerationRollbackStepType =
  | "file-removal-preview"
  | "file-restore-preview"
  | "dependency-revert-preview"
  | "configuration-revert-preview"
  | "validation-retry-preview"
  | "manual-recovery-review"
  | "safe-patch-boundary-review";

export type ProjectGenerationRollbackAppliesTo =
  | "blueprint"
  | "file-plan"
  | "dependency-plan"
  | "validation-plan"
  | "approval-plan"
  | "risk-plan"
  | "runtime-boundary";

export type ProjectGenerationRollbackPolicy =
  | "preview-only"
  | "manual-approval-required"
  | "blocked"
  | "not-applicable";

export type ProjectGenerationRecoveryPolicy =
  | "preview-only"
  | "manual-review-required"
  | "blocked"
  | "not-applicable";

export type ProjectGenerationRollbackExecutionStatus =
  | "not-executed"
  | "preview-only"
  | "requires-approval"
  | "blocked";

export type ProjectGenerationRollbackRiskLevel =
  | "low"
  | "medium"
  | "high"
  | "critical";

export type ProjectGenerationRollbackReadinessLevel =
  | "incomplete"
  | "partial"
  | "review-ready"
  | "ready-for-design";

export type ProjectGenerationRollbackReadiness = {
  score: number;
  level: ProjectGenerationRollbackReadinessLevel;
  reason: string;
};

export type ProjectGenerationRollbackStep = {
  stepId: string;
  stepType: ProjectGenerationRollbackStepType;
  title: string;
  description: string;
  appliesTo: ProjectGenerationRollbackAppliesTo;
  rollbackPolicy: ProjectGenerationRollbackPolicy;
  recoveryPolicy: ProjectGenerationRecoveryPolicy;
  executionStatus: ProjectGenerationRollbackExecutionStatus;
  riskLevel: ProjectGenerationRollbackRiskLevel;
  requiresHumanApproval: boolean;
  blockedReason: string | null;
  warnings: string[];
  recommendations: string[];
  readonly: boolean;
  previewOnly: boolean;
};

export type ProjectGenerationRollbackPlanSummary = {
  totalSteps: number;
  blockedCount: number;
  humanApprovalRequiredCount: number;
  previewOnlyCount: number;
  manualApprovalRequiredCount: number;
  notApplicableCount: number;
  riskDistribution: { key: ProjectGenerationRollbackRiskLevel; totalSteps: number }[];
  appliesToDistribution: { key: ProjectGenerationRollbackAppliesTo; totalSteps: number }[];
  readonly: boolean;
  previewOnly: boolean;
  warnings: string[];
  recommendations: string[];
  readiness: ProjectGenerationRollbackReadiness;
};

export type ProjectGenerationRollbackPlanPreview = {
  schemaVersion: 1;
  title: string;
  metadata: GovernanceMetadata;
  readonly: true;
  previewOnly: true;
  rollbackPlanPreviewOnly: true;
  stdoutOnly: true;
  rollbackExecutionAllowed: false;
  recoveryExecutionAllowed: false;
  riskEnforcementAllowed: false;
  mitigationEnforcementEnabled: false;
  approvalExecutionAllowed: false;
  approvalDecisionApplied: false;
  projectGenerationApproved: false;
  validationExecutionAllowed: false;
  generatedProjectValidationAllowed: false;
  commandExecutionAllowed: false;
  dependencyInstallationAllowed: false;
  packageMutationAllowed: false;
  fileWriteAllowed: false;
  fileCreationAllowed: false;
  scaffoldGenerationEnabled: false;
  runtimeRoutingEnabled: false;
  runtimeActivationEnabled: false;
  policyEnforcementEnabled: false;
  projectGenerationEnabled: false;
  builderAgentRuntimeEnabled: false;
  steps: ProjectGenerationRollbackStep[];
  summary: ProjectGenerationRollbackPlanSummary;
};

export function createProjectGenerationRollbackPlanPreview(input: {
  title: string;
  metadata: GovernanceMetadata;
  steps?: readonly ProjectGenerationRollbackStep[];
}): ProjectGenerationRollbackPlanPreview {
  const steps = sortRollbackSteps(input.steps ?? createDefaultProjectGenerationRollbackSteps());
  return {
    schemaVersion: 1,
    title: input.title,
    metadata: {
      version: input.metadata.version,
      generatedAt: input.metadata.generatedAt,
      source: input.metadata.source,
      command: input.metadata.command,
      readonly: input.metadata.readonly,
      previewOnly: input.metadata.previewOnly
    },
    readonly: true,
    previewOnly: true,
    rollbackPlanPreviewOnly: true,
    stdoutOnly: true,
    rollbackExecutionAllowed: false,
    recoveryExecutionAllowed: false,
    riskEnforcementAllowed: false,
    mitigationEnforcementEnabled: false,
    approvalExecutionAllowed: false,
    approvalDecisionApplied: false,
    projectGenerationApproved: false,
    validationExecutionAllowed: false,
    generatedProjectValidationAllowed: false,
    commandExecutionAllowed: false,
    dependencyInstallationAllowed: false,
    packageMutationAllowed: false,
    fileWriteAllowed: false,
    fileCreationAllowed: false,
    scaffoldGenerationEnabled: false,
    runtimeRoutingEnabled: false,
    runtimeActivationEnabled: false,
    policyEnforcementEnabled: false,
    projectGenerationEnabled: false,
    builderAgentRuntimeEnabled: false,
    steps,
    summary: summarizeProjectGenerationRollbackPlanPreview(steps)
  };
}

export function summarizeProjectGenerationRollbackPlanPreview(steps: readonly ProjectGenerationRollbackStep[]): ProjectGenerationRollbackPlanSummary {
  const sortedSteps = sortRollbackSteps(steps);
  const warnings = [
    ...sortedSteps.flatMap((step) => step.warnings),
    "Project generation rollback plan preview is descriptive only; no rollback or recovery steps are executed."
  ];
  const recommendations = [
    ...sortedSteps.flatMap((step) => step.recommendations),
    "Require separate human-approved rollback and recovery design before any future project generation execution workflow."
  ];
  return {
    totalSteps: sortedSteps.length,
    blockedCount: findBlockedRollbackSteps(sortedSteps).length,
    humanApprovalRequiredCount: findHumanApprovalRequiredRollbackSteps(sortedSteps).length,
    previewOnlyCount: sortedSteps.filter((step) => step.rollbackPolicy === "preview-only" || step.recoveryPolicy === "preview-only").length,
    manualApprovalRequiredCount: sortedSteps.filter((step) => step.rollbackPolicy === "manual-approval-required" || step.recoveryPolicy === "manual-review-required").length,
    notApplicableCount: sortedSteps.filter((step) => step.rollbackPolicy === "not-applicable" || step.recoveryPolicy === "not-applicable").length,
    riskDistribution: summarizeRiskDistribution(sortedSteps),
    appliesToDistribution: summarizeAppliesToDistribution(sortedSteps),
    readonly: sortedSteps.length > 0 && sortedSteps.every((step) => step.readonly === true),
    previewOnly: sortedSteps.length > 0 && sortedSteps.every((step) => step.previewOnly === true),
    warnings: normalizeWarnings(warnings),
    recommendations: normalizeWarnings(recommendations),
    readiness: calculateProjectGenerationRollbackReadiness(sortedSteps)
  };
}

export function calculateProjectGenerationRollbackReadiness(steps: readonly ProjectGenerationRollbackStep[]): ProjectGenerationRollbackReadiness {
  if (steps.length === 0) {
    return { score: 0, level: "incomplete", reason: "No rollback plan steps were provided." };
  }
  if (steps.some((step) => step.rollbackPolicy === "blocked" || step.recoveryPolicy === "blocked" || step.executionStatus === "blocked" || step.blockedReason !== null)) {
    return { score: 0, level: "incomplete", reason: "One or more rollback plan steps are blocked." };
  }
  const total = steps.reduce((sum, step) => sum + Math.min(rollbackPolicyScore(step.rollbackPolicy), recoveryPolicyScore(step.recoveryPolicy)), 0);
  const score = Math.round((total / steps.length) * 10);
  return {
    score,
    level: score >= 90 ? "ready-for-design" : score >= 75 ? "review-ready" : score >= 40 ? "partial" : "incomplete",
    reason: "Advisory rollback readiness score computed from deterministic preview-only rollback and recovery policies."
  };
}

export function createRollbackStep(input: {
  stepId: string;
  stepType: ProjectGenerationRollbackStepType;
  title: string;
  description: string;
  appliesTo: ProjectGenerationRollbackAppliesTo;
  rollbackPolicy: ProjectGenerationRollbackPolicy;
  recoveryPolicy: ProjectGenerationRecoveryPolicy;
  executionStatus: ProjectGenerationRollbackExecutionStatus;
  riskLevel: ProjectGenerationRollbackRiskLevel;
  requiresHumanApproval: boolean;
  blockedReason?: string | null;
  warnings?: readonly string[];
  recommendations?: readonly string[];
}): ProjectGenerationRollbackStep {
  return {
    stepId: input.stepId,
    stepType: input.stepType,
    title: input.title,
    description: input.description,
    appliesTo: input.appliesTo,
    rollbackPolicy: input.rollbackPolicy,
    recoveryPolicy: input.recoveryPolicy,
    executionStatus: input.executionStatus,
    riskLevel: input.riskLevel,
    requiresHumanApproval: input.requiresHumanApproval,
    blockedReason: input.blockedReason ?? null,
    warnings: normalizeWarnings(input.warnings ?? []),
    recommendations: normalizeWarnings(input.recommendations ?? []),
    readonly: true,
    previewOnly: true
  };
}

export function createDefaultProjectGenerationRollbackSteps(): ProjectGenerationRollbackStep[] {
  return [
    createRollbackStep({ stepId: "configuration-revert-preview", stepType: "configuration-revert-preview", title: "Configuration revert preview", description: "Future rollback planning for generated configuration changes.", appliesTo: "blueprint", rollbackPolicy: "manual-approval-required", recoveryPolicy: "manual-review-required", executionStatus: "requires-approval", riskLevel: "high", requiresHumanApproval: true, warnings: ["Configuration rollback is not executed by this preview."] }),
    createRollbackStep({ stepId: "dependency-revert-preview", stepType: "dependency-revert-preview", title: "Dependency revert preview", description: "Future rollback planning for dependency changes.", appliesTo: "dependency-plan", rollbackPolicy: "manual-approval-required", recoveryPolicy: "manual-review-required", executionStatus: "requires-approval", riskLevel: "critical", requiresHumanApproval: true, warnings: ["Dependency rollback requires human review and is not executed."] }),
    createRollbackStep({ stepId: "file-removal-preview", stepType: "file-removal-preview", title: "File removal preview", description: "Future rollback planning for generated file removal.", appliesTo: "file-plan", rollbackPolicy: "manual-approval-required", recoveryPolicy: "manual-review-required", executionStatus: "requires-approval", riskLevel: "high", requiresHumanApproval: true, warnings: ["File removal is not executed by this preview."] }),
    createRollbackStep({ stepId: "file-restore-preview", stepType: "file-restore-preview", title: "File restore preview", description: "Future recovery planning for restoring generated files.", appliesTo: "file-plan", rollbackPolicy: "manual-approval-required", recoveryPolicy: "manual-review-required", executionStatus: "requires-approval", riskLevel: "high", requiresHumanApproval: true, warnings: ["File restore is not executed by this preview."] }),
    createRollbackStep({ stepId: "manual-recovery-review-preview", stepType: "manual-recovery-review", title: "Manual recovery review preview", description: "Future human review of rollback and recovery readiness.", appliesTo: "approval-plan", rollbackPolicy: "manual-approval-required", recoveryPolicy: "manual-review-required", executionStatus: "not-executed", riskLevel: "critical", requiresHumanApproval: true, warnings: ["Manual recovery review is described but not executed."] }),
    createRollbackStep({ stepId: "safe-patch-boundary-review-preview", stepType: "safe-patch-boundary-review", title: "Safe Patch boundary review preview", description: "Future rollback review preserving Safe Patch Engine exclusivity.", appliesTo: "runtime-boundary", rollbackPolicy: "preview-only", recoveryPolicy: "preview-only", executionStatus: "preview-only", riskLevel: "critical", requiresHumanApproval: true, warnings: ["Safe Patch Engine remains the only mutation layer."] }),
    createRollbackStep({ stepId: "validation-retry-preview", stepType: "validation-retry-preview", title: "Validation retry preview", description: "Future recovery planning for retrying validation after rollback review.", appliesTo: "validation-plan", rollbackPolicy: "not-applicable", recoveryPolicy: "manual-review-required", executionStatus: "not-executed", riskLevel: "medium", requiresHumanApproval: true, warnings: ["Validation retry is not executed by this preview."] })
  ];
}

export function sortRollbackSteps(steps: readonly ProjectGenerationRollbackStep[]): ProjectGenerationRollbackStep[] {
  return sortDeterministically(steps, (step) => [step.stepId, step.stepType, step.appliesTo].join("|"));
}

export function findRollbackStepsByType(steps: readonly ProjectGenerationRollbackStep[], stepType: ProjectGenerationRollbackStepType): ProjectGenerationRollbackStep[] {
  return sortRollbackSteps(steps).filter((step) => step.stepType === stepType);
}

export function findRollbackStepsByRiskLevel(steps: readonly ProjectGenerationRollbackStep[], riskLevel: ProjectGenerationRollbackRiskLevel): ProjectGenerationRollbackStep[] {
  return sortRollbackSteps(steps).filter((step) => step.riskLevel === riskLevel);
}

export function findRollbackStepsByAppliesTo(steps: readonly ProjectGenerationRollbackStep[], appliesTo: ProjectGenerationRollbackAppliesTo): ProjectGenerationRollbackStep[] {
  return sortRollbackSteps(steps).filter((step) => step.appliesTo === appliesTo);
}

export function findBlockedRollbackSteps(steps: readonly ProjectGenerationRollbackStep[]): ProjectGenerationRollbackStep[] {
  return sortRollbackSteps(steps).filter((step) => step.rollbackPolicy === "blocked" || step.recoveryPolicy === "blocked" || step.executionStatus === "blocked" || step.blockedReason !== null);
}

export function findHumanApprovalRequiredRollbackSteps(steps: readonly ProjectGenerationRollbackStep[]): ProjectGenerationRollbackStep[] {
  return sortRollbackSteps(steps).filter((step) => step.requiresHumanApproval);
}

function summarizeRiskDistribution(steps: readonly ProjectGenerationRollbackStep[]): { key: ProjectGenerationRollbackRiskLevel; totalSteps: number }[] {
  const counts = new Map<ProjectGenerationRollbackRiskLevel, number>();
  for (const step of steps) {
    counts.set(step.riskLevel, (counts.get(step.riskLevel) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([key, totalSteps]) => ({ key, totalSteps }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

function summarizeAppliesToDistribution(steps: readonly ProjectGenerationRollbackStep[]): { key: ProjectGenerationRollbackAppliesTo; totalSteps: number }[] {
  const counts = new Map<ProjectGenerationRollbackAppliesTo, number>();
  for (const step of steps) {
    counts.set(step.appliesTo, (counts.get(step.appliesTo) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([key, totalSteps]) => ({ key, totalSteps }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

function rollbackPolicyScore(policy: ProjectGenerationRollbackPolicy): number {
  if (policy === "preview-only") return 8;
  if (policy === "not-applicable") return 8;
  if (policy === "manual-approval-required") return 6;
  return 0;
}

function recoveryPolicyScore(policy: ProjectGenerationRecoveryPolicy): number {
  if (policy === "preview-only") return 8;
  if (policy === "not-applicable") return 8;
  if (policy === "manual-review-required") return 6;
  return 0;
}
