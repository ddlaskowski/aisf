import type { GovernanceMetadata } from "./governanceMetadata.js";
import { normalizeWarnings, sortDeterministically } from "./utils/governanceUtils.js";

export type ProjectGenerationApprovalGateType =
  | "blueprint-review"
  | "file-plan-review"
  | "dependency-plan-review"
  | "validation-plan-review"
  | "governance-review"
  | "risk-review"
  | "manual-approval"
  | "final-release-review";

export type ProjectGenerationApprovalPolicy =
  | "preview-only"
  | "manual-approval-required"
  | "blocked"
  | "not-applicable";

export type ProjectGenerationApprovalDecisionStatus =
  | "not-reviewed"
  | "pending-preview"
  | "requires-approval"
  | "blocked"
  | "approved-preview-only";

export type ProjectGenerationApprovalRiskLevel =
  | "low"
  | "medium"
  | "high"
  | "critical";

export type ProjectGenerationApprovalPlanCompletenessLevel =
  | "incomplete"
  | "partial"
  | "review-ready"
  | "ready-for-design";

export type ProjectGenerationApprovalPlanCompleteness = {
  score: number;
  level: ProjectGenerationApprovalPlanCompletenessLevel;
  reason: string;
};

export type ProjectGenerationApprovalGate = {
  gateId: string;
  gateType: ProjectGenerationApprovalGateType;
  title: string;
  purpose: string;
  requiredFor: string[];
  approvalPolicy: ProjectGenerationApprovalPolicy;
  decisionStatus: ProjectGenerationApprovalDecisionStatus;
  riskLevel: ProjectGenerationApprovalRiskLevel;
  requiresHumanApproval: boolean;
  blockedReason: string | null;
  warnings: string[];
  recommendations: string[];
  readonly: boolean;
  previewOnly: boolean;
};

export type ProjectGenerationApprovalPlanSummary = {
  totalGates: number;
  humanRequiredCount: number;
  blockedCount: number;
  previewOnlyCount: number;
  manualApprovalRequiredCount: number;
  notApplicableCount: number;
  riskDistribution: { key: ProjectGenerationApprovalRiskLevel; totalGates: number }[];
  readonly: boolean;
  previewOnly: boolean;
  warnings: string[];
  recommendations: string[];
  completeness: ProjectGenerationApprovalPlanCompleteness;
};

export type ProjectGenerationApprovalPlanPreview = {
  schemaVersion: 1;
  title: string;
  metadata: GovernanceMetadata;
  readonly: true;
  previewOnly: true;
  approvalPlanPreviewOnly: true;
  stdoutOnly: true;
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
  gates: ProjectGenerationApprovalGate[];
  summary: ProjectGenerationApprovalPlanSummary;
};

export function createProjectGenerationApprovalPlanPreview(input: {
  title: string;
  metadata: GovernanceMetadata;
  gates?: readonly ProjectGenerationApprovalGate[];
}): ProjectGenerationApprovalPlanPreview {
  const gates = sortApprovalGates(input.gates ?? createDefaultProjectGenerationApprovalGates());
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
    approvalPlanPreviewOnly: true,
    stdoutOnly: true,
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
    gates,
    summary: summarizeProjectGenerationApprovalPlanPreview(gates)
  };
}

export function summarizeProjectGenerationApprovalPlanPreview(gates: readonly ProjectGenerationApprovalGate[]): ProjectGenerationApprovalPlanSummary {
  const sortedGates = sortApprovalGates(gates);
  const warnings = [
    ...sortedGates.flatMap((gate) => gate.warnings),
    "Project generation approval plan preview is descriptive only; no approvals are executed and no approval decisions are applied."
  ];
  const recommendations = [
    ...sortedGates.flatMap((gate) => gate.recommendations),
    "Require separate human-approved approval workflow design before any future project generation approval execution."
  ];
  return {
    totalGates: sortedGates.length,
    humanRequiredCount: sortedGates.filter((gate) => gate.requiresHumanApproval).length,
    blockedCount: findBlockedApprovalGates(sortedGates).length,
    previewOnlyCount: sortedGates.filter((gate) => gate.approvalPolicy === "preview-only").length,
    manualApprovalRequiredCount: sortedGates.filter((gate) => gate.approvalPolicy === "manual-approval-required").length,
    notApplicableCount: sortedGates.filter((gate) => gate.approvalPolicy === "not-applicable").length,
    riskDistribution: summarizeRiskDistribution(sortedGates),
    readonly: sortedGates.length > 0 && sortedGates.every((gate) => gate.readonly === true),
    previewOnly: sortedGates.length > 0 && sortedGates.every((gate) => gate.previewOnly === true),
    warnings: normalizeWarnings(warnings),
    recommendations: normalizeWarnings(recommendations),
    completeness: calculateProjectGenerationApprovalPlanCompleteness(sortedGates)
  };
}

export function calculateProjectGenerationApprovalPlanCompleteness(gates: readonly ProjectGenerationApprovalGate[]): ProjectGenerationApprovalPlanCompleteness {
  if (gates.length === 0) {
    return { score: 0, level: "incomplete", reason: "No approval gates were provided." };
  }
  if (gates.some((gate) => gate.approvalPolicy === "blocked" || gate.decisionStatus === "blocked" || gate.blockedReason !== null)) {
    return { score: 0, level: "incomplete", reason: "One or more approval gates are blocked." };
  }
  const total = gates.reduce((sum, gate) => sum + approvalPolicyScore(gate.approvalPolicy), 0);
  const score = Math.round((total / gates.length) * 10);
  return {
    score,
    level: score >= 90 ? "ready-for-design" : score >= 75 ? "review-ready" : score >= 40 ? "partial" : "incomplete",
    reason: "Advisory approval plan completeness score computed from deterministic preview-only approval policies."
  };
}

export function createApprovalGate(input: {
  gateId: string;
  gateType: ProjectGenerationApprovalGateType;
  title: string;
  purpose: string;
  requiredFor: readonly string[];
  approvalPolicy: ProjectGenerationApprovalPolicy;
  decisionStatus: ProjectGenerationApprovalDecisionStatus;
  riskLevel: ProjectGenerationApprovalRiskLevel;
  requiresHumanApproval: boolean;
  blockedReason?: string | null;
  warnings?: readonly string[];
  recommendations?: readonly string[];
}): ProjectGenerationApprovalGate {
  return {
    gateId: input.gateId,
    gateType: input.gateType,
    title: input.title,
    purpose: input.purpose,
    requiredFor: sortDeterministically(input.requiredFor, (value) => value),
    approvalPolicy: input.approvalPolicy,
    decisionStatus: input.decisionStatus,
    riskLevel: input.riskLevel,
    requiresHumanApproval: input.requiresHumanApproval,
    blockedReason: input.blockedReason ?? null,
    warnings: normalizeWarnings(input.warnings ?? []),
    recommendations: normalizeWarnings(input.recommendations ?? []),
    readonly: true,
    previewOnly: true
  };
}

export function createDefaultProjectGenerationApprovalGates(): ProjectGenerationApprovalGate[] {
  return [
    createApprovalGate({ gateId: "blueprint-review-preview", gateType: "blueprint-review", title: "Blueprint review preview", purpose: "Future review of project blueprint completeness.", requiredFor: ["blueprintPlan"], approvalPolicy: "preview-only", decisionStatus: "pending-preview", riskLevel: "low", requiresHumanApproval: false, recommendations: ["Keep blueprint approval advisory until execution design exists."] }),
    createApprovalGate({ gateId: "dependency-plan-review-preview", gateType: "dependency-plan-review", title: "Dependency plan review preview", purpose: "Future human review of dependency installation risk.", requiredFor: ["dependencyPlan"], approvalPolicy: "manual-approval-required", decisionStatus: "requires-approval", riskLevel: "high", requiresHumanApproval: true, warnings: ["Dependency approval is not executed by this preview."] }),
    createApprovalGate({ gateId: "file-plan-review-preview", gateType: "file-plan-review", title: "File plan review preview", purpose: "Future human review of planned files before generation.", requiredFor: ["filePlan"], approvalPolicy: "manual-approval-required", decisionStatus: "requires-approval", riskLevel: "medium", requiresHumanApproval: true, warnings: ["File plan approval cannot create files in this preview."] }),
    createApprovalGate({ gateId: "final-release-review-preview", gateType: "final-release-review", title: "Final release review preview", purpose: "Future final review before any controlled project generation release.", requiredFor: ["approvalPlan", "validationPlan"], approvalPolicy: "manual-approval-required", decisionStatus: "requires-approval", riskLevel: "critical", requiresHumanApproval: true, warnings: ["Final release approval is not executed by this preview."] }),
    createApprovalGate({ gateId: "governance-review-preview", gateType: "governance-review", title: "Governance review preview", purpose: "Future review of governance boundaries before any project generation capability.", requiredFor: ["governancePlan"], approvalPolicy: "manual-approval-required", decisionStatus: "requires-approval", riskLevel: "high", requiresHumanApproval: true, warnings: ["Governance remains preview-only and disabled."] }),
    createApprovalGate({ gateId: "manual-approval-preview", gateType: "manual-approval", title: "Manual approval preview", purpose: "Future explicit human approval checkpoint.", requiredFor: ["humanApprovalPlan"], approvalPolicy: "manual-approval-required", decisionStatus: "not-reviewed", riskLevel: "critical", requiresHumanApproval: true, warnings: ["Manual approval is described but not executed."] }),
    createApprovalGate({ gateId: "risk-review-preview", gateType: "risk-review", title: "Risk review preview", purpose: "Future review of runtime, mutation, and project-generation risk.", requiredFor: ["riskPlan"], approvalPolicy: "manual-approval-required", decisionStatus: "requires-approval", riskLevel: "critical", requiresHumanApproval: true, warnings: ["Risk approval requires separate human workflow design."] }),
    createApprovalGate({ gateId: "validation-plan-review-preview", gateType: "validation-plan-review", title: "Validation plan review preview", purpose: "Future human review of validation plan before any generated-project checks.", requiredFor: ["validationPlan"], approvalPolicy: "manual-approval-required", decisionStatus: "requires-approval", riskLevel: "high", requiresHumanApproval: true, warnings: ["Validation approval does not run validation commands."] })
  ];
}

export function sortApprovalGates(gates: readonly ProjectGenerationApprovalGate[]): ProjectGenerationApprovalGate[] {
  return sortDeterministically(gates, (gate) => [gate.gateId, gate.gateType, gate.riskLevel].join("|"));
}

export function findApprovalGatesByType(gates: readonly ProjectGenerationApprovalGate[], gateType: ProjectGenerationApprovalGateType): ProjectGenerationApprovalGate[] {
  return sortApprovalGates(gates).filter((gate) => gate.gateType === gateType);
}

export function findApprovalGatesByRiskLevel(gates: readonly ProjectGenerationApprovalGate[], riskLevel: ProjectGenerationApprovalRiskLevel): ProjectGenerationApprovalGate[] {
  return sortApprovalGates(gates).filter((gate) => gate.riskLevel === riskLevel);
}

export function findHumanRequiredApprovalGates(gates: readonly ProjectGenerationApprovalGate[]): ProjectGenerationApprovalGate[] {
  return sortApprovalGates(gates).filter((gate) => gate.requiresHumanApproval);
}

export function findBlockedApprovalGates(gates: readonly ProjectGenerationApprovalGate[]): ProjectGenerationApprovalGate[] {
  return sortApprovalGates(gates).filter((gate) => gate.approvalPolicy === "blocked" || gate.decisionStatus === "blocked" || gate.blockedReason !== null);
}

function summarizeRiskDistribution(gates: readonly ProjectGenerationApprovalGate[]): { key: ProjectGenerationApprovalRiskLevel; totalGates: number }[] {
  const counts = new Map<ProjectGenerationApprovalRiskLevel, number>();
  for (const gate of gates) {
    counts.set(gate.riskLevel, (counts.get(gate.riskLevel) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([key, totalGates]) => ({ key, totalGates }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

function approvalPolicyScore(policy: ProjectGenerationApprovalPolicy): number {
  if (policy === "preview-only") return 8;
  if (policy === "not-applicable") return 8;
  if (policy === "manual-approval-required") return 6;
  return 0;
}
