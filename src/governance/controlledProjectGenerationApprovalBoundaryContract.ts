import type { GovernanceMetadata } from "./governanceMetadata.js";
import { normalizeWarnings, sortDeterministically } from "./utils/governanceUtils.js";

export type ControlledProjectGenerationApprovalGroup =
  | "blueprintApproval"
  | "filePlanApproval"
  | "dependencyPlanApproval"
  | "validationPlanApproval"
  | "riskPlanApproval"
  | "rollbackPlanApproval"
  | "mutationApproval"
  | "outputApproval"
  | "runtimeTransitionApproval"
  | "manualReviewBoundary"
  | "forbiddenAutoApprovalBoundary";

export type ControlledProjectGenerationApprovalPolicy =
  | "manual-approval-required"
  | "preview-only"
  | "auto-approval-forbidden"
  | "blocked"
  | "not-applicable";

export type ControlledProjectGenerationApprovalRiskLevel =
  | "low"
  | "medium"
  | "high"
  | "critical";

export type ControlledProjectGenerationApprovalBoundaryCompletenessLevel =
  | "incomplete"
  | "partial"
  | "contract-defined"
  | "ready-for-design";

export type ControlledProjectGenerationApprovalBoundaryCompleteness = {
  score: number;
  level: ControlledProjectGenerationApprovalBoundaryCompletenessLevel;
  reason: string;
};

export type ControlledProjectGenerationApprovalBoundary = {
  boundaryId: string;
  group: ControlledProjectGenerationApprovalGroup;
  title: string;
  description: string;
  approvalPolicy: ControlledProjectGenerationApprovalPolicy;
  riskLevel: ControlledProjectGenerationApprovalRiskLevel;
  autoApprovalAllowed: boolean;
  manualApprovalRequired: boolean;
  forbiddenAutoApproval: boolean;
  approvalPersistenceAllowed: boolean;
  blockedReason: string | null;
  warnings: string[];
  recommendations: string[];
  readonly: boolean;
  previewOnly: boolean;
  noExecution: boolean;
};

export type ControlledProjectGenerationApprovalBoundarySummary = {
  totalBoundaries: number;
  manualApprovalRequiredCount: number;
  forbiddenAutoApprovalCount: number;
  blockedCount: number;
  approvalPersistenceAllowedCount: number;
  groupDistribution: { key: ControlledProjectGenerationApprovalGroup; totalBoundaries: number }[];
  policyDistribution: { key: ControlledProjectGenerationApprovalPolicy; totalBoundaries: number }[];
  riskDistribution: { key: ControlledProjectGenerationApprovalRiskLevel; totalBoundaries: number }[];
  readonly: boolean;
  previewOnly: boolean;
  noExecution: boolean;
  warnings: string[];
  recommendations: string[];
  completeness: ControlledProjectGenerationApprovalBoundaryCompleteness;
};

export type ControlledProjectGenerationApprovalBoundaryContract = {
  schemaVersion: 1;
  title: string;
  metadata: GovernanceMetadata;
  readonly: true;
  previewOnly: true;
  approvalBoundaryContractOnly: true;
  stdoutOnly: true;
  approvalExecutionAllowed: false;
  approvalPersistenceAllowed: false;
  approvalDecisionApplied: false;
  projectGenerationApproved: false;
  mutationExecutionAllowed: false;
  mutationExpansionAllowed: false;
  generationRuntimeImplemented: false;
  generationExecutionAllowed: false;
  outputExecutionAllowed: false;
  inputExecutionAllowed: false;
  bundleExecutionAllowed: false;
  rollbackExecutionAllowed: false;
  recoveryExecutionAllowed: false;
  riskEnforcementAllowed: false;
  mitigationEnforcementEnabled: false;
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
  boundaries: ControlledProjectGenerationApprovalBoundary[];
  summary: ControlledProjectGenerationApprovalBoundarySummary;
};

export function createControlledProjectGenerationApprovalBoundaryContract(input: {
  title: string;
  metadata: GovernanceMetadata;
  boundaries?: readonly ControlledProjectGenerationApprovalBoundary[];
}): ControlledProjectGenerationApprovalBoundaryContract {
  const boundaries = sortApprovalBoundaries(input.boundaries ?? createDefaultApprovalBoundaries());
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
    approvalBoundaryContractOnly: true,
    stdoutOnly: true,
    approvalExecutionAllowed: false,
    approvalPersistenceAllowed: false,
    approvalDecisionApplied: false,
    projectGenerationApproved: false,
    mutationExecutionAllowed: false,
    mutationExpansionAllowed: false,
    generationRuntimeImplemented: false,
    generationExecutionAllowed: false,
    outputExecutionAllowed: false,
    inputExecutionAllowed: false,
    bundleExecutionAllowed: false,
    rollbackExecutionAllowed: false,
    recoveryExecutionAllowed: false,
    riskEnforcementAllowed: false,
    mitigationEnforcementEnabled: false,
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
    boundaries,
    summary: summarizeControlledProjectGenerationApprovalBoundaryContract(boundaries)
  };
}

export function summarizeControlledProjectGenerationApprovalBoundaryContract(
  boundaries: readonly ControlledProjectGenerationApprovalBoundary[]
): ControlledProjectGenerationApprovalBoundarySummary {
  const sortedBoundaries = sortApprovalBoundaries(boundaries);
  const warnings = [
    ...sortedBoundaries.flatMap((boundary) => boundary.warnings),
    "Controlled project generation approval boundary contract is descriptive only; no approval execution or approval persistence is enabled."
  ];
  const recommendations = [
    ...sortedBoundaries.flatMap((boundary) => boundary.recommendations),
    "Require separate human-approved runtime design before any future approval-capable behavior exists."
  ];
  return {
    totalBoundaries: sortedBoundaries.length,
    manualApprovalRequiredCount: findManualApprovalRequiredBoundaries(sortedBoundaries).length,
    forbiddenAutoApprovalCount: findForbiddenAutoApprovalBoundaries(sortedBoundaries).length,
    blockedCount: findBlockedApprovalBoundaries(sortedBoundaries).length,
    approvalPersistenceAllowedCount: sortedBoundaries.filter((boundary) => boundary.approvalPersistenceAllowed).length,
    groupDistribution: summarizeBy(sortedBoundaries, (boundary) => boundary.group),
    policyDistribution: summarizeBy(sortedBoundaries, (boundary) => boundary.approvalPolicy),
    riskDistribution: summarizeBy(sortedBoundaries, (boundary) => boundary.riskLevel),
    readonly: sortedBoundaries.length > 0 && sortedBoundaries.every((boundary) => boundary.readonly),
    previewOnly: sortedBoundaries.length > 0 && sortedBoundaries.every((boundary) => boundary.previewOnly),
    noExecution: sortedBoundaries.length > 0 && sortedBoundaries.every((boundary) => boundary.noExecution),
    warnings: normalizeWarnings(warnings),
    recommendations: normalizeWarnings(recommendations),
    completeness: calculateControlledProjectGenerationApprovalBoundaryCompleteness(sortedBoundaries)
  };
}

export function calculateControlledProjectGenerationApprovalBoundaryCompleteness(
  boundaries: readonly ControlledProjectGenerationApprovalBoundary[]
): ControlledProjectGenerationApprovalBoundaryCompleteness {
  if (boundaries.length === 0) {
    return { score: 0, level: "incomplete", reason: "No controlled project generation approval boundaries were provided." };
  }
  if (boundaries.some((boundary) => boundary.noExecution !== true || boundary.approvalPersistenceAllowed === true || boundary.autoApprovalAllowed === true)) {
    return { score: 0, level: "incomplete", reason: "One or more approval boundaries allow execution, persistence, or auto-approval." };
  }
  const score = Math.round((boundaries.reduce((sum, boundary) => sum + approvalPolicyScore(boundary.approvalPolicy), 0) / boundaries.length) * 10);
  return {
    score,
    level: score >= 90 ? "ready-for-design" : score >= 75 ? "contract-defined" : score >= 40 ? "partial" : "incomplete",
    reason: "Advisory approval boundary completeness score computed from deterministic non-executing approval policies."
  };
}

export function createApprovalBoundary(input: {
  boundaryId: string;
  group: ControlledProjectGenerationApprovalGroup;
  title: string;
  description: string;
  approvalPolicy: ControlledProjectGenerationApprovalPolicy;
  riskLevel: ControlledProjectGenerationApprovalRiskLevel;
  autoApprovalAllowed?: boolean;
  manualApprovalRequired: boolean;
  forbiddenAutoApproval: boolean;
  approvalPersistenceAllowed?: boolean;
  blockedReason?: string | null;
  warnings?: readonly string[];
  recommendations?: readonly string[];
}): ControlledProjectGenerationApprovalBoundary {
  return {
    boundaryId: input.boundaryId,
    group: input.group,
    title: input.title,
    description: input.description,
    approvalPolicy: input.approvalPolicy,
    riskLevel: input.riskLevel,
    autoApprovalAllowed: input.autoApprovalAllowed ?? false,
    manualApprovalRequired: input.manualApprovalRequired,
    forbiddenAutoApproval: input.forbiddenAutoApproval,
    approvalPersistenceAllowed: input.approvalPersistenceAllowed ?? false,
    blockedReason: input.blockedReason ?? null,
    warnings: normalizeWarnings(input.warnings ?? [`${input.title} is approval-boundary-only and does not execute approvals.`]),
    recommendations: normalizeWarnings(input.recommendations ?? ["Keep this approval boundary descriptive until a separate controlled runtime design is approved."]),
    readonly: true,
    previewOnly: true,
    noExecution: true
  };
}

export function sortApprovalBoundaries(boundaries: readonly ControlledProjectGenerationApprovalBoundary[]): ControlledProjectGenerationApprovalBoundary[] {
  const order = new Map<ControlledProjectGenerationApprovalGroup, number>([
    ["blueprintApproval", 1],
    ["filePlanApproval", 2],
    ["dependencyPlanApproval", 3],
    ["validationPlanApproval", 4],
    ["riskPlanApproval", 5],
    ["rollbackPlanApproval", 6],
    ["mutationApproval", 7],
    ["outputApproval", 8],
    ["runtimeTransitionApproval", 9],
    ["manualReviewBoundary", 10],
    ["forbiddenAutoApprovalBoundary", 11]
  ]);
  return sortDeterministically(boundaries, (boundary) => `${String(order.get(boundary.group) ?? 99).padStart(2, "0")}|${boundary.boundaryId}`);
}

export function findApprovalBoundariesByGroup(boundaries: readonly ControlledProjectGenerationApprovalBoundary[], group: ControlledProjectGenerationApprovalGroup): ControlledProjectGenerationApprovalBoundary[] {
  return sortApprovalBoundaries(boundaries).filter((boundary) => boundary.group === group);
}

export function findApprovalBoundariesByPolicy(boundaries: readonly ControlledProjectGenerationApprovalBoundary[], policy: ControlledProjectGenerationApprovalPolicy): ControlledProjectGenerationApprovalBoundary[] {
  return sortApprovalBoundaries(boundaries).filter((boundary) => boundary.approvalPolicy === policy);
}

export function findApprovalBoundariesByRiskLevel(boundaries: readonly ControlledProjectGenerationApprovalBoundary[], riskLevel: ControlledProjectGenerationApprovalRiskLevel): ControlledProjectGenerationApprovalBoundary[] {
  return sortApprovalBoundaries(boundaries).filter((boundary) => boundary.riskLevel === riskLevel);
}

export function findBlockedApprovalBoundaries(boundaries: readonly ControlledProjectGenerationApprovalBoundary[]): ControlledProjectGenerationApprovalBoundary[] {
  return sortApprovalBoundaries(boundaries).filter((boundary) => boundary.approvalPolicy === "blocked" || boundary.blockedReason !== null);
}

export function findForbiddenAutoApprovalBoundaries(boundaries: readonly ControlledProjectGenerationApprovalBoundary[]): ControlledProjectGenerationApprovalBoundary[] {
  return sortApprovalBoundaries(boundaries).filter((boundary) => boundary.forbiddenAutoApproval || boundary.approvalPolicy === "auto-approval-forbidden");
}

export function findManualApprovalRequiredBoundaries(boundaries: readonly ControlledProjectGenerationApprovalBoundary[]): ControlledProjectGenerationApprovalBoundary[] {
  return sortApprovalBoundaries(boundaries).filter((boundary) => boundary.manualApprovalRequired);
}

function createDefaultApprovalBoundaries(): ControlledProjectGenerationApprovalBoundary[] {
  return [
    createApprovalBoundary({ boundaryId: "controlled-approval-001-blueprint", group: "blueprintApproval", title: "Blueprint approval", description: "Future blueprint plans require human approval before any controlled generation design could proceed.", approvalPolicy: "manual-approval-required", riskLevel: "high", manualApprovalRequired: true, forbiddenAutoApproval: false }),
    createApprovalBoundary({ boundaryId: "controlled-approval-002-file-plan", group: "filePlanApproval", title: "File plan approval", description: "Future file plans require human approval and remain non-executing.", approvalPolicy: "manual-approval-required", riskLevel: "high", manualApprovalRequired: true, forbiddenAutoApproval: false }),
    createApprovalBoundary({ boundaryId: "controlled-approval-003-dependency-plan", group: "dependencyPlanApproval", title: "Dependency plan approval", description: "Future dependency plans require human approval before any dependency proposal could proceed.", approvalPolicy: "manual-approval-required", riskLevel: "critical", manualApprovalRequired: true, forbiddenAutoApproval: false }),
    createApprovalBoundary({ boundaryId: "controlled-approval-004-validation-plan", group: "validationPlanApproval", title: "Validation plan approval", description: "Future validation plan approval remains preview-only and non-executing.", approvalPolicy: "preview-only", riskLevel: "medium", manualApprovalRequired: false, forbiddenAutoApproval: false }),
    createApprovalBoundary({ boundaryId: "controlled-approval-005-risk-plan", group: "riskPlanApproval", title: "Risk plan approval", description: "Future risk plans require human approval and do not enforce risks.", approvalPolicy: "manual-approval-required", riskLevel: "high", manualApprovalRequired: true, forbiddenAutoApproval: false }),
    createApprovalBoundary({ boundaryId: "controlled-approval-006-rollback-plan", group: "rollbackPlanApproval", title: "Rollback plan approval", description: "Future rollback plans require human approval and do not execute rollback or recovery.", approvalPolicy: "manual-approval-required", riskLevel: "high", manualApprovalRequired: true, forbiddenAutoApproval: false }),
    createApprovalBoundary({ boundaryId: "controlled-approval-007-mutation", group: "mutationApproval", title: "Mutation approval", description: "Future mutation proposals require human approval and remain non-mutating.", approvalPolicy: "manual-approval-required", riskLevel: "critical", manualApprovalRequired: true, forbiddenAutoApproval: false }),
    createApprovalBoundary({ boundaryId: "controlled-approval-008-output", group: "outputApproval", title: "Output approval", description: "Future output proposals require human approval before any file-writing design exists.", approvalPolicy: "manual-approval-required", riskLevel: "high", manualApprovalRequired: true, forbiddenAutoApproval: false }),
    createApprovalBoundary({ boundaryId: "controlled-approval-009-runtime-transition", group: "runtimeTransitionApproval", title: "Runtime transition approval", description: "Future runtime transitions forbid auto-approval and require separate human review.", approvalPolicy: "auto-approval-forbidden", riskLevel: "critical", manualApprovalRequired: true, forbiddenAutoApproval: true }),
    createApprovalBoundary({ boundaryId: "controlled-approval-010-manual-review", group: "manualReviewBoundary", title: "Manual review boundary", description: "Future manual review remains the explicit boundary before controlled generation can be considered.", approvalPolicy: "manual-approval-required", riskLevel: "medium", manualApprovalRequired: true, forbiddenAutoApproval: false }),
    createApprovalBoundary({ boundaryId: "controlled-approval-011-forbidden-auto-approval", group: "forbiddenAutoApprovalBoundary", title: "Forbidden auto-approval boundary", description: "Future auto-approval of controlled generation remains forbidden.", approvalPolicy: "auto-approval-forbidden", riskLevel: "critical", manualApprovalRequired: true, forbiddenAutoApproval: true })
  ];
}

function approvalPolicyScore(policy: ControlledProjectGenerationApprovalPolicy): number {
  if (policy === "auto-approval-forbidden") return 10;
  if (policy === "manual-approval-required") return 9;
  if (policy === "blocked") return 9;
  if (policy === "preview-only") return 8;
  return 7;
}

function summarizeBy<TItem, TKey extends string>(
  items: readonly TItem[],
  keyReader: (item: TItem) => TKey
): { key: TKey; totalBoundaries: number }[] {
  const counts = new Map<TKey, number>();
  for (const item of items) {
    const key = keyReader(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([key, totalBoundaries]) => ({ key, totalBoundaries }))
    .sort((left, right) => left.key.localeCompare(right.key));
}
