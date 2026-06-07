import type { GovernanceMetadata } from "./governanceMetadata.js";
import { normalizeWarnings, sortDeterministically } from "./utils/governanceUtils.js";

export type ControlledProjectGenerationRuntimeGroup =
  | "runtimeActivation"
  | "runtimeExecution"
  | "runtimeRouting"
  | "runtimeOrchestration"
  | "plannerLoop"
  | "builderAgentLoop"
  | "autonomousGeneration"
  | "statePersistence"
  | "policyEnforcement"
  | "governanceActivation"
  | "validationExecution"
  | "rollbackExecution"
  | "recoveryExecution";

export type ControlledProjectGenerationRuntimePolicy =
  | "forbidden"
  | "blocked"
  | "preview-only"
  | "manual-approval-required"
  | "not-applicable";

export type ControlledProjectGenerationRuntimeRiskLevel =
  | "low"
  | "medium"
  | "high"
  | "critical";

export type ControlledProjectGenerationRuntimeBoundaryCompletenessLevel =
  | "incomplete"
  | "partial"
  | "contract-defined"
  | "ready-for-design";

export type ControlledProjectGenerationRuntimeBoundaryCompleteness = {
  score: number;
  level: ControlledProjectGenerationRuntimeBoundaryCompletenessLevel;
  reason: string;
};

export type ControlledProjectGenerationRuntimeBoundary = {
  boundaryId: string;
  group: ControlledProjectGenerationRuntimeGroup;
  title: string;
  description: string;
  runtimePolicy: ControlledProjectGenerationRuntimePolicy;
  riskLevel: ControlledProjectGenerationRuntimeRiskLevel;
  activationAllowed: boolean;
  executionAllowed: boolean;
  routingAllowed: boolean;
  persistenceAllowed: boolean;
  blockedReason: string | null;
  warnings: string[];
  recommendations: string[];
  readonly: boolean;
  previewOnly: boolean;
  noExecution: boolean;
};

export type ControlledProjectGenerationRuntimeBoundarySummary = {
  totalBoundaries: number;
  forbiddenCount: number;
  blockedCount: number;
  previewOnlyCount: number;
  activationAllowedCount: number;
  executionAllowedCount: number;
  routingAllowedCount: number;
  persistenceAllowedCount: number;
  groupDistribution: { key: ControlledProjectGenerationRuntimeGroup; totalBoundaries: number }[];
  policyDistribution: { key: ControlledProjectGenerationRuntimePolicy; totalBoundaries: number }[];
  riskDistribution: { key: ControlledProjectGenerationRuntimeRiskLevel; totalBoundaries: number }[];
  readonly: boolean;
  previewOnly: boolean;
  noExecution: boolean;
  warnings: string[];
  recommendations: string[];
  completeness: ControlledProjectGenerationRuntimeBoundaryCompleteness;
};

export type ControlledProjectGenerationRuntimeBoundaryContract = {
  schemaVersion: 1;
  title: string;
  metadata: GovernanceMetadata;
  readonly: true;
  previewOnly: true;
  runtimeBoundaryContractOnly: true;
  stdoutOnly: true;
  runtimeExecutionAllowed: false;
  runtimeActivationAllowed: false;
  runtimeRoutingAllowed: false;
  runtimeOrchestrationAllowed: false;
  runtimePersistenceAllowed: false;
  runtimeStatePersistenceAllowed: false;
  plannerLoopAllowed: false;
  builderAgentLoopAllowed: false;
  autonomousGenerationAllowed: false;
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
  boundaries: ControlledProjectGenerationRuntimeBoundary[];
  summary: ControlledProjectGenerationRuntimeBoundarySummary;
};

export function createControlledProjectGenerationRuntimeBoundaryContract(input: {
  title: string;
  metadata: GovernanceMetadata;
  boundaries?: readonly ControlledProjectGenerationRuntimeBoundary[];
}): ControlledProjectGenerationRuntimeBoundaryContract {
  const boundaries = sortRuntimeBoundaries(input.boundaries ?? createDefaultRuntimeBoundaries());
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
    runtimeBoundaryContractOnly: true,
    stdoutOnly: true,
    runtimeExecutionAllowed: false,
    runtimeActivationAllowed: false,
    runtimeRoutingAllowed: false,
    runtimeOrchestrationAllowed: false,
    runtimePersistenceAllowed: false,
    runtimeStatePersistenceAllowed: false,
    plannerLoopAllowed: false,
    builderAgentLoopAllowed: false,
    autonomousGenerationAllowed: false,
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
    summary: summarizeControlledProjectGenerationRuntimeBoundaryContract(boundaries)
  };
}

export function summarizeControlledProjectGenerationRuntimeBoundaryContract(
  boundaries: readonly ControlledProjectGenerationRuntimeBoundary[]
): ControlledProjectGenerationRuntimeBoundarySummary {
  const sortedBoundaries = sortRuntimeBoundaries(boundaries);
  const warnings = [
    ...sortedBoundaries.flatMap((boundary) => boundary.warnings),
    "Controlled project generation runtime boundary contract is descriptive only; no runtime execution, activation, routing, orchestration, or persistence is enabled."
  ];
  const recommendations = [
    ...sortedBoundaries.flatMap((boundary) => boundary.recommendations),
    "Require separate human-approved runtime design before any future runtime-capable behavior exists."
  ];
  return {
    totalBoundaries: sortedBoundaries.length,
    forbiddenCount: findForbiddenRuntimeBoundaries(sortedBoundaries).length,
    blockedCount: findBlockedRuntimeBoundaries(sortedBoundaries).length,
    previewOnlyCount: findPreviewOnlyRuntimeBoundaries(sortedBoundaries).length,
    activationAllowedCount: sortedBoundaries.filter((boundary) => boundary.activationAllowed).length,
    executionAllowedCount: sortedBoundaries.filter((boundary) => boundary.executionAllowed).length,
    routingAllowedCount: sortedBoundaries.filter((boundary) => boundary.routingAllowed).length,
    persistenceAllowedCount: sortedBoundaries.filter((boundary) => boundary.persistenceAllowed).length,
    groupDistribution: summarizeBy(sortedBoundaries, (boundary) => boundary.group),
    policyDistribution: summarizeBy(sortedBoundaries, (boundary) => boundary.runtimePolicy),
    riskDistribution: summarizeBy(sortedBoundaries, (boundary) => boundary.riskLevel),
    readonly: sortedBoundaries.length > 0 && sortedBoundaries.every((boundary) => boundary.readonly),
    previewOnly: sortedBoundaries.length > 0 && sortedBoundaries.every((boundary) => boundary.previewOnly),
    noExecution: sortedBoundaries.length > 0 && sortedBoundaries.every((boundary) => boundary.noExecution),
    warnings: normalizeWarnings(warnings),
    recommendations: normalizeWarnings(recommendations),
    completeness: calculateControlledProjectGenerationRuntimeBoundaryCompleteness(sortedBoundaries)
  };
}

export function calculateControlledProjectGenerationRuntimeBoundaryCompleteness(
  boundaries: readonly ControlledProjectGenerationRuntimeBoundary[]
): ControlledProjectGenerationRuntimeBoundaryCompleteness {
  if (boundaries.length === 0) {
    return { score: 0, level: "incomplete", reason: "No controlled project generation runtime boundaries were provided." };
  }
  if (boundaries.some((boundary) => boundary.noExecution !== true || boundary.activationAllowed || boundary.executionAllowed || boundary.routingAllowed || boundary.persistenceAllowed)) {
    return { score: 0, level: "incomplete", reason: "One or more runtime boundaries allow execution, activation, routing, or persistence." };
  }
  const score = Math.round((boundaries.reduce((sum, boundary) => sum + runtimePolicyScore(boundary.runtimePolicy), 0) / boundaries.length) * 10);
  return {
    score,
    level: score >= 90 ? "ready-for-design" : score >= 75 ? "contract-defined" : score >= 40 ? "partial" : "incomplete",
    reason: "Advisory runtime boundary completeness score computed from deterministic non-executing runtime policies."
  };
}

export function createRuntimeBoundary(input: {
  boundaryId: string;
  group: ControlledProjectGenerationRuntimeGroup;
  title: string;
  description: string;
  runtimePolicy: ControlledProjectGenerationRuntimePolicy;
  riskLevel: ControlledProjectGenerationRuntimeRiskLevel;
  activationAllowed?: boolean;
  executionAllowed?: boolean;
  routingAllowed?: boolean;
  persistenceAllowed?: boolean;
  blockedReason?: string | null;
  warnings?: readonly string[];
  recommendations?: readonly string[];
}): ControlledProjectGenerationRuntimeBoundary {
  return {
    boundaryId: input.boundaryId,
    group: input.group,
    title: input.title,
    description: input.description,
    runtimePolicy: input.runtimePolicy,
    riskLevel: input.riskLevel,
    activationAllowed: input.activationAllowed ?? false,
    executionAllowed: input.executionAllowed ?? false,
    routingAllowed: input.routingAllowed ?? false,
    persistenceAllowed: input.persistenceAllowed ?? false,
    blockedReason: input.blockedReason ?? null,
    warnings: normalizeWarnings(input.warnings ?? [`${input.title} is runtime-boundary-only and does not execute runtime behavior.`]),
    recommendations: normalizeWarnings(input.recommendations ?? ["Keep this runtime boundary descriptive until a separate controlled runtime design is approved."]),
    readonly: true,
    previewOnly: true,
    noExecution: true
  };
}

export function sortRuntimeBoundaries(boundaries: readonly ControlledProjectGenerationRuntimeBoundary[]): ControlledProjectGenerationRuntimeBoundary[] {
  const order = new Map<ControlledProjectGenerationRuntimeGroup, number>([
    ["runtimeActivation", 1],
    ["runtimeExecution", 2],
    ["runtimeRouting", 3],
    ["runtimeOrchestration", 4],
    ["plannerLoop", 5],
    ["builderAgentLoop", 6],
    ["autonomousGeneration", 7],
    ["statePersistence", 8],
    ["policyEnforcement", 9],
    ["governanceActivation", 10],
    ["validationExecution", 11],
    ["rollbackExecution", 12],
    ["recoveryExecution", 13]
  ]);
  return sortDeterministically(boundaries, (boundary) => `${String(order.get(boundary.group) ?? 99).padStart(2, "0")}|${boundary.boundaryId}`);
}

export function findRuntimeBoundariesByGroup(boundaries: readonly ControlledProjectGenerationRuntimeBoundary[], group: ControlledProjectGenerationRuntimeGroup): ControlledProjectGenerationRuntimeBoundary[] {
  return sortRuntimeBoundaries(boundaries).filter((boundary) => boundary.group === group);
}

export function findRuntimeBoundariesByPolicy(boundaries: readonly ControlledProjectGenerationRuntimeBoundary[], policy: ControlledProjectGenerationRuntimePolicy): ControlledProjectGenerationRuntimeBoundary[] {
  return sortRuntimeBoundaries(boundaries).filter((boundary) => boundary.runtimePolicy === policy);
}

export function findRuntimeBoundariesByRiskLevel(boundaries: readonly ControlledProjectGenerationRuntimeBoundary[], riskLevel: ControlledProjectGenerationRuntimeRiskLevel): ControlledProjectGenerationRuntimeBoundary[] {
  return sortRuntimeBoundaries(boundaries).filter((boundary) => boundary.riskLevel === riskLevel);
}

export function findBlockedRuntimeBoundaries(boundaries: readonly ControlledProjectGenerationRuntimeBoundary[]): ControlledProjectGenerationRuntimeBoundary[] {
  return sortRuntimeBoundaries(boundaries).filter((boundary) => boundary.runtimePolicy === "blocked" || boundary.blockedReason !== null);
}

export function findForbiddenRuntimeBoundaries(boundaries: readonly ControlledProjectGenerationRuntimeBoundary[]): ControlledProjectGenerationRuntimeBoundary[] {
  return sortRuntimeBoundaries(boundaries).filter((boundary) => boundary.runtimePolicy === "forbidden");
}

export function findPreviewOnlyRuntimeBoundaries(boundaries: readonly ControlledProjectGenerationRuntimeBoundary[]): ControlledProjectGenerationRuntimeBoundary[] {
  return sortRuntimeBoundaries(boundaries).filter((boundary) => boundary.runtimePolicy === "preview-only");
}

function createDefaultRuntimeBoundaries(): ControlledProjectGenerationRuntimeBoundary[] {
  return [
    createRuntimeBoundary({ boundaryId: "controlled-runtime-001-activation", group: "runtimeActivation", title: "Runtime activation", description: "Future controlled generation runtime activation remains forbidden.", runtimePolicy: "forbidden", riskLevel: "critical" }),
    createRuntimeBoundary({ boundaryId: "controlled-runtime-002-execution", group: "runtimeExecution", title: "Runtime execution", description: "Future controlled generation runtime execution remains forbidden.", runtimePolicy: "forbidden", riskLevel: "critical" }),
    createRuntimeBoundary({ boundaryId: "controlled-runtime-003-routing", group: "runtimeRouting", title: "Runtime routing", description: "Future runtime routing remains forbidden.", runtimePolicy: "forbidden", riskLevel: "critical" }),
    createRuntimeBoundary({ boundaryId: "controlled-runtime-004-orchestration", group: "runtimeOrchestration", title: "Runtime orchestration", description: "Future runtime orchestration remains blocked until a separate design exists.", runtimePolicy: "blocked", riskLevel: "critical", blockedReason: "Runtime orchestration is not implemented and remains blocked." }),
    createRuntimeBoundary({ boundaryId: "controlled-runtime-005-planner-loop", group: "plannerLoop", title: "Planner loop", description: "Future planner-agent runtime loops remain blocked.", runtimePolicy: "blocked", riskLevel: "critical", blockedReason: "Planner-agent runtime loops are outside the read-only contract boundary." }),
    createRuntimeBoundary({ boundaryId: "controlled-runtime-006-builder-agent-loop", group: "builderAgentLoop", title: "Builder agent loop", description: "Future builder-agent runtime loops remain blocked.", runtimePolicy: "blocked", riskLevel: "critical", blockedReason: "Builder-agent runtime loops are not implemented." }),
    createRuntimeBoundary({ boundaryId: "controlled-runtime-007-autonomous-generation", group: "autonomousGeneration", title: "Autonomous generation", description: "Autonomous project generation remains forbidden.", runtimePolicy: "forbidden", riskLevel: "critical" }),
    createRuntimeBoundary({ boundaryId: "controlled-runtime-008-state-persistence", group: "statePersistence", title: "Runtime state persistence", description: "Runtime state persistence can only be described as preview-only metadata and is not persisted.", runtimePolicy: "preview-only", riskLevel: "high" }),
    createRuntimeBoundary({ boundaryId: "controlled-runtime-009-policy-enforcement", group: "policyEnforcement", title: "Policy enforcement", description: "Runtime policy enforcement remains forbidden.", runtimePolicy: "forbidden", riskLevel: "critical" }),
    createRuntimeBoundary({ boundaryId: "controlled-runtime-010-governance-activation", group: "governanceActivation", title: "Governance activation", description: "Governance activation remains forbidden.", runtimePolicy: "forbidden", riskLevel: "critical" }),
    createRuntimeBoundary({ boundaryId: "controlled-runtime-011-validation-execution", group: "validationExecution", title: "Validation execution", description: "Generated-project validation execution remains forbidden.", runtimePolicy: "forbidden", riskLevel: "high" }),
    createRuntimeBoundary({ boundaryId: "controlled-runtime-012-rollback-execution", group: "rollbackExecution", title: "Rollback execution", description: "Rollback execution remains forbidden.", runtimePolicy: "forbidden", riskLevel: "high" }),
    createRuntimeBoundary({ boundaryId: "controlled-runtime-013-recovery-execution", group: "recoveryExecution", title: "Recovery execution", description: "Recovery execution remains forbidden.", runtimePolicy: "forbidden", riskLevel: "high" })
  ];
}

function runtimePolicyScore(policy: ControlledProjectGenerationRuntimePolicy): number {
  if (policy === "forbidden") return 10;
  if (policy === "blocked") return 9;
  if (policy === "preview-only") return 8;
  if (policy === "manual-approval-required") return 8;
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
