import type { GovernanceMetadata } from "./governanceMetadata.js";
import { normalizeWarnings, sortDeterministically } from "./utils/governanceUtils.js";

export type ControlledRuntimeFlowPhase =
  | "request-intake"
  | "contract-validation"
  | "governance-review"
  | "plan-bundle-review"
  | "human-approval-check"
  | "generation-preview"
  | "validation-preview"
  | "review-pack-preview"
  | "export-preview"
  | "audit-preview"
  | "completion-preview";

export type ControlledRuntimeFlowStatus =
  | "defined"
  | "preview-only"
  | "blocked"
  | "approval-required"
  | "partial";

export type ControlledRuntimeFlowRiskLevel =
  | "low"
  | "medium"
  | "high"
  | "critical";

export type ControlledRuntimeFlowTransitionPolicy =
  | "preview-only"
  | "manual-approval-required"
  | "blocked"
  | "not-applicable";

export type ControlledRuntimeFlowCompletenessLevel =
  | "incomplete"
  | "partial"
  | "flow-defined"
  | "ready-for-orchestration-design";

export type ControlledRuntimeFlowCompleteness = {
  score: number;
  level: ControlledRuntimeFlowCompletenessLevel;
  reason: string;
};

export type ControlledRuntimeFlowStep = {
  stepId: string;
  title: string;
  componentId: string;
  phase: ControlledRuntimeFlowPhase;
  allowedInputs: string[];
  allowedOutputs: string[];
  requiredPreviousSteps: string[];
  nextSteps: string[];
  approvalRequired: boolean;
  status: ControlledRuntimeFlowStatus;
  riskLevel: ControlledRuntimeFlowRiskLevel;
  blockedReason: string | null;
  warnings: string[];
  recommendations: string[];
  readonly: boolean;
  previewOnly: boolean;
  noExecution: boolean;
};

export type ControlledRuntimeFlowTransition = {
  transitionId: string;
  fromStep: string;
  toStep: string;
  handoffType: string;
  handoffPayload: string;
  transitionPolicy: ControlledRuntimeFlowTransitionPolicy;
  approvalRequired: boolean;
  blockedReason: string | null;
  readonly: boolean;
  previewOnly: boolean;
  noRouting: boolean;
  noExecution: boolean;
};

export type ControlledRuntimeFlowSummary = {
  totalSteps: number;
  totalTransitions: number;
  blockedCount: number;
  approvalRequiredCount: number;
  previewOnlyCount: number;
  transitionPolicyDistribution: { key: ControlledRuntimeFlowTransitionPolicy; totalTransitions: number }[];
  riskDistribution: { key: ControlledRuntimeFlowRiskLevel; totalSteps: number }[];
  readonly: boolean;
  previewOnly: boolean;
  noRouting: boolean;
  noExecution: boolean;
  completeness: ControlledRuntimeFlowCompleteness;
  warnings: string[];
  recommendations: string[];
};

export type ControlledRuntimeFlowPreview = {
  schemaVersion: 1;
  title: string;
  metadata: GovernanceMetadata;
  readonly: true;
  previewOnly: true;
  stdoutOnly: true;
  flowPreviewOnly: true;
  runtimeExecutionAllowed: false;
  runtimeActivationAllowed: false;
  runtimeRoutingAllowed: false;
  runtimeOrchestrationAllowed: false;
  runtimePersistenceAllowed: false;
  flowExecutionAllowed: false;
  projectGenerationEnabled: false;
  builderAgentRuntimeEnabled: false;
  agentExecutionAllowed: false;
  approvalExecutionAllowed: false;
  mutationExecutionAllowed: false;
  inputExecutionAllowed: false;
  outputExecutionAllowed: false;
  contractExecutionAllowed: false;
  fileWriteAllowed: false;
  fileCreationAllowed: false;
  dependencyInstallationAllowed: false;
  packageMutationAllowed: false;
  generatedProjectValidationAllowed: false;
  policyEnforcementEnabled: false;
  governanceActivationAllowed: false;
  steps: ControlledRuntimeFlowStep[];
  transitions: ControlledRuntimeFlowTransition[];
  summary: ControlledRuntimeFlowSummary;
};

export function createControlledRuntimeFlowPreview(input: {
  title: string;
  metadata: GovernanceMetadata;
  steps?: readonly ControlledRuntimeFlowStep[];
  transitions?: readonly ControlledRuntimeFlowTransition[];
}): ControlledRuntimeFlowPreview {
  const steps = sortRuntimeFlowSteps(input.steps ?? createDefaultRuntimeFlowSteps());
  const transitions = sortRuntimeFlowTransitions(input.transitions ?? createDefaultRuntimeFlowTransitions());
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
    stdoutOnly: true,
    flowPreviewOnly: true,
    runtimeExecutionAllowed: false,
    runtimeActivationAllowed: false,
    runtimeRoutingAllowed: false,
    runtimeOrchestrationAllowed: false,
    runtimePersistenceAllowed: false,
    flowExecutionAllowed: false,
    projectGenerationEnabled: false,
    builderAgentRuntimeEnabled: false,
    agentExecutionAllowed: false,
    approvalExecutionAllowed: false,
    mutationExecutionAllowed: false,
    inputExecutionAllowed: false,
    outputExecutionAllowed: false,
    contractExecutionAllowed: false,
    fileWriteAllowed: false,
    fileCreationAllowed: false,
    dependencyInstallationAllowed: false,
    packageMutationAllowed: false,
    generatedProjectValidationAllowed: false,
    policyEnforcementEnabled: false,
    governanceActivationAllowed: false,
    steps,
    transitions,
    summary: summarizeControlledRuntimeFlowPreview(steps, transitions)
  };
}

export function summarizeControlledRuntimeFlowPreview(
  steps: readonly ControlledRuntimeFlowStep[],
  transitions: readonly ControlledRuntimeFlowTransition[]
): ControlledRuntimeFlowSummary {
  const sortedSteps = sortRuntimeFlowSteps(steps);
  const sortedTransitions = sortRuntimeFlowTransitions(transitions);
  const warnings = [
    ...sortedSteps.flatMap((step) => step.warnings),
    "Controlled runtime flow preview is descriptive only; no runtime routing, orchestration, execution, or project generation is enabled."
  ];
  const recommendations = [
    ...sortedSteps.flatMap((step) => step.recommendations),
    "Require separate human-approved orchestration design before any future controlled runtime flow implementation."
  ];
  return {
    totalSteps: sortedSteps.length,
    totalTransitions: sortedTransitions.length,
    blockedCount: findBlockedRuntimeFlowSteps(sortedSteps).length,
    approvalRequiredCount: findApprovalRequiredRuntimeFlowSteps(sortedSteps).length + sortedTransitions.filter((transition) => transition.approvalRequired).length,
    previewOnlyCount: sortedSteps.filter((step) => step.previewOnly).length,
    transitionPolicyDistribution: summarizeTransitionPolicies(sortedTransitions),
    riskDistribution: summarizeFlowRisks(sortedSteps),
    readonly: sortedSteps.length > 0 && sortedSteps.every((step) => step.readonly) && sortedTransitions.every((transition) => transition.readonly),
    previewOnly: sortedSteps.length > 0 && sortedSteps.every((step) => step.previewOnly) && sortedTransitions.every((transition) => transition.previewOnly),
    noRouting: sortedTransitions.length > 0 && sortedTransitions.every((transition) => transition.noRouting),
    noExecution: sortedSteps.length > 0 && sortedSteps.every((step) => step.noExecution) && sortedTransitions.every((transition) => transition.noExecution),
    completeness: calculateControlledRuntimeFlowCompleteness(sortedSteps, sortedTransitions),
    warnings: normalizeWarnings(warnings),
    recommendations: normalizeWarnings(recommendations)
  };
}

export function calculateControlledRuntimeFlowCompleteness(
  steps: readonly ControlledRuntimeFlowStep[],
  transitions: readonly ControlledRuntimeFlowTransition[]
): ControlledRuntimeFlowCompleteness {
  if (steps.length === 0 || transitions.length === 0) {
    return { score: 0, level: "incomplete", reason: "Controlled runtime flow preview requires step and transition records." };
  }
  if (
    steps.some((step) => step.status === "blocked" || step.blockedReason !== null || !step.readonly || !step.previewOnly || !step.noExecution)
    || transitions.some((transition) => transition.transitionPolicy === "blocked" || transition.blockedReason !== null || !transition.readonly || !transition.previewOnly || !transition.noRouting || !transition.noExecution)
  ) {
    return { score: 0, level: "incomplete", reason: "One or more runtime flow records are blocked or violate read-only, preview-only, no-routing, or no-execution guarantees." };
  }
  const stepScore = steps.reduce((total, step) => total + statusScore(step.status), 0);
  const transitionScore = transitions.reduce((total, transition) => total + transitionPolicyScore(transition.transitionPolicy), 0);
  const score = Math.round((stepScore + transitionScore) / (steps.length + transitions.length));
  return {
    score,
    level: score >= 90 ? "ready-for-orchestration-design" : score >= 75 ? "flow-defined" : score >= 40 ? "partial" : "incomplete",
    reason: "Advisory runtime flow completeness score computed from deterministic preview-only step and transition records."
  };
}

export function createRuntimeFlowStep(input: {
  stepId: string;
  title: string;
  componentId: string;
  phase: ControlledRuntimeFlowPhase;
  allowedInputs: readonly string[];
  allowedOutputs: readonly string[];
  requiredPreviousSteps?: readonly string[];
  nextSteps?: readonly string[];
  approvalRequired: boolean;
  status: ControlledRuntimeFlowStatus;
  riskLevel: ControlledRuntimeFlowRiskLevel;
  blockedReason?: string | null;
  warnings?: readonly string[];
  recommendations?: readonly string[];
}): ControlledRuntimeFlowStep {
  return {
    stepId: input.stepId,
    title: input.title,
    componentId: input.componentId,
    phase: input.phase,
    allowedInputs: sortDeterministically(input.allowedInputs, (value) => value),
    allowedOutputs: sortDeterministically(input.allowedOutputs, (value) => value),
    requiredPreviousSteps: sortDeterministically(input.requiredPreviousSteps ?? [], (value) => value),
    nextSteps: sortDeterministically(input.nextSteps ?? [], (value) => value),
    approvalRequired: input.approvalRequired,
    status: input.status,
    riskLevel: input.riskLevel,
    blockedReason: input.blockedReason ?? null,
    warnings: normalizeWarnings(input.warnings ?? []),
    recommendations: normalizeWarnings(input.recommendations ?? []),
    readonly: true,
    previewOnly: true,
    noExecution: true
  };
}

export function createRuntimeFlowTransition(input: {
  transitionId: string;
  fromStep: string;
  toStep: string;
  handoffType: string;
  handoffPayload: string;
  transitionPolicy: ControlledRuntimeFlowTransitionPolicy;
  approvalRequired: boolean;
  blockedReason?: string | null;
}): ControlledRuntimeFlowTransition {
  return {
    transitionId: input.transitionId,
    fromStep: input.fromStep,
    toStep: input.toStep,
    handoffType: input.handoffType,
    handoffPayload: input.handoffPayload,
    transitionPolicy: input.transitionPolicy,
    approvalRequired: input.approvalRequired,
    blockedReason: input.blockedReason ?? null,
    readonly: true,
    previewOnly: true,
    noRouting: true,
    noExecution: true
  };
}

export function createDefaultRuntimeFlowSteps(): ControlledRuntimeFlowStep[] {
  return [
    createRuntimeFlowStep({ stepId: "request-intake", title: "Request intake", componentId: "input-intake", phase: "request-intake", allowedInputs: ["human request summary"], allowedOutputs: ["normalized intent preview"], nextSteps: ["contract-validation"], approvalRequired: false, status: "defined", riskLevel: "medium", warnings: ["Request intake is not executed."] }),
    createRuntimeFlowStep({ stepId: "contract-validation", title: "Contract validation", componentId: "contract-validation", phase: "contract-validation", allowedInputs: ["normalized intent preview"], allowedOutputs: ["contract validation preview"], requiredPreviousSteps: ["request-intake"], nextSteps: ["governance-review"], approvalRequired: false, status: "defined", riskLevel: "high", warnings: ["Contract validation is not enforced."] }),
    createRuntimeFlowStep({ stepId: "governance-review", title: "Governance review", componentId: "governance-review", phase: "governance-review", allowedInputs: ["contract validation preview"], allowedOutputs: ["governance review preview"], requiredPreviousSteps: ["contract-validation"], nextSteps: ["plan-bundle-review"], approvalRequired: true, status: "approval-required", riskLevel: "critical", warnings: ["Governance review does not activate governance."] }),
    createRuntimeFlowStep({ stepId: "plan-bundle-review", title: "Plan bundle review", componentId: "planning", phase: "plan-bundle-review", allowedInputs: ["governance review preview"], allowedOutputs: ["plan bundle preview"], requiredPreviousSteps: ["governance-review"], nextSteps: ["human-approval-check"], approvalRequired: true, status: "approval-required", riskLevel: "high", warnings: ["Plan bundle review does not orchestrate runtime behavior."] }),
    createRuntimeFlowStep({ stepId: "human-approval-check", title: "Human approval check", componentId: "approval", phase: "human-approval-check", allowedInputs: ["plan bundle preview"], allowedOutputs: ["approval gate preview"], requiredPreviousSteps: ["plan-bundle-review"], nextSteps: ["generation-preview"], approvalRequired: true, status: "approval-required", riskLevel: "critical", warnings: ["Approval check does not execute approval decisions."] }),
    createRuntimeFlowStep({ stepId: "generation-preview", title: "Generation preview", componentId: "generation-preview", phase: "generation-preview", allowedInputs: ["approval gate preview"], allowedOutputs: ["generation result preview"], requiredPreviousSteps: ["human-approval-check"], nextSteps: ["validation-preview"], approvalRequired: true, status: "defined", riskLevel: "critical", warnings: ["Generation preview does not generate projects."] }),
    createRuntimeFlowStep({ stepId: "validation-preview", title: "Validation preview", componentId: "validation-preview", phase: "validation-preview", allowedInputs: ["generation result preview"], allowedOutputs: ["validation result preview"], requiredPreviousSteps: ["generation-preview"], nextSteps: ["review-pack-preview"], approvalRequired: false, status: "defined", riskLevel: "high", warnings: ["Validation preview does not execute validation commands."] }),
    createRuntimeFlowStep({ stepId: "review-pack-preview", title: "Review pack preview", componentId: "review", phase: "review-pack-preview", allowedInputs: ["validation result preview"], allowedOutputs: ["review pack preview"], requiredPreviousSteps: ["validation-preview"], nextSteps: ["export-preview"], approvalRequired: true, status: "approval-required", riskLevel: "medium", warnings: ["Review pack preview does not apply review decisions."] }),
    createRuntimeFlowStep({ stepId: "export-preview", title: "Export preview", componentId: "export", phase: "export-preview", allowedInputs: ["review pack preview"], allowedOutputs: ["stdout export preview"], requiredPreviousSteps: ["review-pack-preview"], nextSteps: ["audit-preview"], approvalRequired: false, status: "defined", riskLevel: "medium", warnings: ["Export preview does not write files by default."] }),
    createRuntimeFlowStep({ stepId: "audit-preview", title: "Audit preview", componentId: "audit", phase: "audit-preview", allowedInputs: ["stdout export preview"], allowedOutputs: ["audit summary preview"], requiredPreviousSteps: ["export-preview"], nextSteps: ["completion-preview"], approvalRequired: false, status: "defined", riskLevel: "high", warnings: ["Audit preview does not enforce governance."] }),
    createRuntimeFlowStep({ stepId: "completion-preview", title: "Completion preview", componentId: "audit", phase: "completion-preview", allowedInputs: ["audit summary preview"], allowedOutputs: ["completion summary preview"], requiredPreviousSteps: ["audit-preview"], approvalRequired: true, status: "approval-required", riskLevel: "medium", warnings: ["Completion preview is descriptive only."] })
  ];
}

export function createDefaultRuntimeFlowTransitions(): ControlledRuntimeFlowTransition[] {
  const ids = ["request-intake", "contract-validation", "governance-review", "plan-bundle-review", "human-approval-check", "generation-preview", "validation-preview", "review-pack-preview", "export-preview", "audit-preview", "completion-preview"];
  return ids.slice(0, -1).map((fromStep, index) => {
    const toStep = ids[index + 1];
    return createRuntimeFlowTransition({
      transitionId: `controlled-runtime-flow-transition-${String(index + 1).padStart(3, "0")}`,
      fromStep,
      toStep,
      handoffType: "preview-handoff",
      handoffPayload: `${fromStep} to ${toStep} preview payload`,
      transitionPolicy: toStep === "generation-preview" || toStep === "review-pack-preview" || toStep === "completion-preview" ? "manual-approval-required" : "preview-only",
      approvalRequired: toStep === "generation-preview" || toStep === "review-pack-preview" || toStep === "completion-preview"
    });
  });
}

export function sortRuntimeFlowSteps(steps: readonly ControlledRuntimeFlowStep[]): ControlledRuntimeFlowStep[] {
  const order = new Map<ControlledRuntimeFlowPhase, number>(["request-intake", "contract-validation", "governance-review", "plan-bundle-review", "human-approval-check", "generation-preview", "validation-preview", "review-pack-preview", "export-preview", "audit-preview", "completion-preview"].map((phase, index) => [phase as ControlledRuntimeFlowPhase, index + 1]));
  return sortDeterministically(steps, (step) => [String(order.get(step.phase) ?? 999).padStart(3, "0"), step.stepId].join("|"));
}

export function sortRuntimeFlowTransitions(transitions: readonly ControlledRuntimeFlowTransition[]): ControlledRuntimeFlowTransition[] {
  return sortDeterministically(transitions, (transition) => transition.transitionId);
}

export function findRuntimeFlowStepsByComponent(steps: readonly ControlledRuntimeFlowStep[], componentId: string): ControlledRuntimeFlowStep[] {
  return sortRuntimeFlowSteps(steps).filter((step) => step.componentId === componentId);
}

export function findRuntimeFlowStepsByStatus(steps: readonly ControlledRuntimeFlowStep[], status: ControlledRuntimeFlowStatus): ControlledRuntimeFlowStep[] {
  return sortRuntimeFlowSteps(steps).filter((step) => step.status === status);
}

export function findBlockedRuntimeFlowSteps(steps: readonly ControlledRuntimeFlowStep[]): ControlledRuntimeFlowStep[] {
  return sortRuntimeFlowSteps(steps).filter((step) => step.status === "blocked" || step.blockedReason !== null);
}

export function findApprovalRequiredRuntimeFlowSteps(steps: readonly ControlledRuntimeFlowStep[]): ControlledRuntimeFlowStep[] {
  return sortRuntimeFlowSteps(steps).filter((step) => step.approvalRequired || step.status === "approval-required");
}

function summarizeTransitionPolicies(transitions: readonly ControlledRuntimeFlowTransition[]): { key: ControlledRuntimeFlowTransitionPolicy; totalTransitions: number }[] {
  return (["preview-only", "manual-approval-required", "blocked", "not-applicable"] as const).map((policy) => ({ key: policy, totalTransitions: transitions.filter((transition) => transition.transitionPolicy === policy).length })).filter((group) => group.totalTransitions > 0);
}

function summarizeFlowRisks(steps: readonly ControlledRuntimeFlowStep[]): { key: ControlledRuntimeFlowRiskLevel; totalSteps: number }[] {
  return (["low", "medium", "high", "critical"] as const).map((riskLevel) => ({ key: riskLevel, totalSteps: steps.filter((step) => step.riskLevel === riskLevel).length })).filter((group) => group.totalSteps > 0);
}

function statusScore(status: ControlledRuntimeFlowStatus): number {
  if (status === "defined" || status === "preview-only" || status === "approval-required") return 100;
  if (status === "partial") return 60;
  return 0;
}

function transitionPolicyScore(policy: ControlledRuntimeFlowTransitionPolicy): number {
  if (policy === "preview-only" || policy === "manual-approval-required" || policy === "not-applicable") return 100;
  return 0;
}
