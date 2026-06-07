import type { GovernanceMetadata } from "./governanceMetadata.js";
import { normalizeWarnings, sortDeterministically } from "./utils/governanceUtils.js";

export type ControlledRuntimeComponentRole =
  | "input-intake"
  | "contract-validation"
  | "governance-review"
  | "planning"
  | "approval"
  | "generation-preview"
  | "validation-preview"
  | "review"
  | "export"
  | "audit";

export type ControlledRuntimeComponentContractStatus =
  | "defined"
  | "preview-only"
  | "blocked"
  | "partial"
  | "not-started";

export type ControlledRuntimeComponentContractRiskLevel =
  | "low"
  | "medium"
  | "high"
  | "critical";

export type ControlledRuntimeComponentContractCompletenessLevel =
  | "incomplete"
  | "partial"
  | "component-contracts-defined"
  | "ready-for-runtime-flow-design";

export type ControlledRuntimeComponentContractCompleteness = {
  score: number;
  level: ControlledRuntimeComponentContractCompletenessLevel;
  reason: string;
};

export type ControlledRuntimeComponentContractEntry = {
  componentId: string;
  title: string;
  role: ControlledRuntimeComponentRole;
  responsibilities: string[];
  allowedInputs: string[];
  allowedOutputs: string[];
  dependencies: string[];
  forbiddenActions: string[];
  riskLevel: ControlledRuntimeComponentContractRiskLevel;
  status: ControlledRuntimeComponentContractStatus;
  blockedReason: string | null;
  warnings: string[];
  recommendations: string[];
  readonly: boolean;
  previewOnly: boolean;
  noExecution: boolean;
};

export type ControlledRuntimeComponentContractSummary = {
  totalContracts: number;
  blockedCount: number;
  previewOnlyCount: number;
  totalForbiddenActions: number;
  totalDependencies: number;
  riskDistribution: { key: ControlledRuntimeComponentContractRiskLevel; totalContracts: number }[];
  readonly: boolean;
  previewOnly: boolean;
  noExecution: boolean;
  completeness: ControlledRuntimeComponentContractCompleteness;
  warnings: string[];
  recommendations: string[];
};

export type ControlledRuntimeComponentContract = {
  schemaVersion: 1;
  title: string;
  metadata: GovernanceMetadata;
  readonly: true;
  previewOnly: true;
  stdoutOnly: true;
  componentContractOnly: true;
  runtimeExecutionAllowed: false;
  runtimeActivationAllowed: false;
  runtimeRoutingAllowed: false;
  runtimeOrchestrationAllowed: false;
  runtimePersistenceAllowed: false;
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
  entries: ControlledRuntimeComponentContractEntry[];
  summary: ControlledRuntimeComponentContractSummary;
};

export function createControlledRuntimeComponentContract(input: {
  title: string;
  metadata: GovernanceMetadata;
  entries?: readonly ControlledRuntimeComponentContractEntry[];
}): ControlledRuntimeComponentContract {
  const entries = sortRuntimeComponentContractEntries(input.entries ?? createDefaultRuntimeComponentContractEntries());
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
    componentContractOnly: true,
    runtimeExecutionAllowed: false,
    runtimeActivationAllowed: false,
    runtimeRoutingAllowed: false,
    runtimeOrchestrationAllowed: false,
    runtimePersistenceAllowed: false,
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
    entries,
    summary: summarizeControlledRuntimeComponentContract(entries)
  };
}

export function summarizeControlledRuntimeComponentContract(
  entries: readonly ControlledRuntimeComponentContractEntry[]
): ControlledRuntimeComponentContractSummary {
  const sortedEntries = sortRuntimeComponentContractEntries(entries);
  const warnings = [
    ...sortedEntries.flatMap((entry) => entry.warnings),
    "Controlled runtime component contracts are descriptive only; no runtime execution, routing, activation, or project generation is enabled."
  ];
  const recommendations = [
    ...sortedEntries.flatMap((entry) => entry.recommendations),
    "Require separate human-approved runtime flow design before any future controlled runtime implementation."
  ];
  return {
    totalContracts: sortedEntries.length,
    blockedCount: findBlockedRuntimeComponentContracts(sortedEntries).length,
    previewOnlyCount: findPreviewOnlyRuntimeComponentContracts(sortedEntries).length,
    totalForbiddenActions: sortedEntries.reduce((total, entry) => total + entry.forbiddenActions.length, 0),
    totalDependencies: sortedEntries.reduce((total, entry) => total + entry.dependencies.length, 0),
    riskDistribution: summarizeRuntimeComponentContractRiskDistribution(sortedEntries),
    readonly: sortedEntries.length > 0 && sortedEntries.every((entry) => entry.readonly === true),
    previewOnly: sortedEntries.length > 0 && sortedEntries.every((entry) => entry.previewOnly === true),
    noExecution: sortedEntries.length > 0 && sortedEntries.every((entry) => entry.noExecution === true),
    completeness: calculateControlledRuntimeComponentContractCompleteness(sortedEntries),
    warnings: normalizeWarnings(warnings),
    recommendations: normalizeWarnings(recommendations)
  };
}

export function calculateControlledRuntimeComponentContractCompleteness(
  entries: readonly ControlledRuntimeComponentContractEntry[]
): ControlledRuntimeComponentContractCompleteness {
  if (entries.length === 0) {
    return { score: 0, level: "incomplete", reason: "Controlled runtime component contracts require at least one component contract entry." };
  }
  if (entries.some((entry) => entry.status === "blocked" || entry.blockedReason !== null || !entry.readonly || !entry.previewOnly || !entry.noExecution)) {
    return { score: 0, level: "incomplete", reason: "One or more component contracts are blocked or violate read-only, preview-only, or no-execution guarantees." };
  }
  const score = Math.round(entries.reduce((total, entry) => total + statusScore(entry.status), 0) / entries.length);
  return {
    score,
    level: score >= 90 ? "ready-for-runtime-flow-design" : score >= 75 ? "component-contracts-defined" : score >= 40 ? "partial" : "incomplete",
    reason: "Advisory component contract completeness score computed from deterministic preview-only component contract entries."
  };
}

export function createRuntimeComponentContractEntry(input: {
  componentId: string;
  title: string;
  role: ControlledRuntimeComponentRole;
  responsibilities: readonly string[];
  allowedInputs: readonly string[];
  allowedOutputs: readonly string[];
  dependencies?: readonly string[];
  forbiddenActions?: readonly string[];
  riskLevel: ControlledRuntimeComponentContractRiskLevel;
  status: ControlledRuntimeComponentContractStatus;
  blockedReason?: string | null;
  warnings?: readonly string[];
  recommendations?: readonly string[];
}): ControlledRuntimeComponentContractEntry {
  return {
    componentId: input.componentId,
    title: input.title,
    role: input.role,
    responsibilities: sortDeterministically(input.responsibilities, (responsibility) => responsibility),
    allowedInputs: sortDeterministically(input.allowedInputs, (allowedInput) => allowedInput),
    allowedOutputs: sortDeterministically(input.allowedOutputs, (allowedOutput) => allowedOutput),
    dependencies: sortDeterministically(input.dependencies ?? [], (dependency) => dependency),
    forbiddenActions: sortDeterministically(input.forbiddenActions ?? createDefaultForbiddenRuntimeComponentActions(), (action) => action),
    riskLevel: input.riskLevel,
    status: input.status,
    blockedReason: input.blockedReason ?? null,
    warnings: normalizeWarnings(input.warnings ?? []),
    recommendations: normalizeWarnings(input.recommendations ?? []),
    readonly: true,
    previewOnly: true,
    noExecution: true
  };
}

export function createDefaultRuntimeComponentContractEntries(): ControlledRuntimeComponentContractEntry[] {
  return [
    createRuntimeComponentContractEntry({ componentId: "controlled-runtime-component-contract-001", title: "Input intake component contract", role: "input-intake", responsibilities: ["Describe future controlled runtime request intake", "Normalize requested intent as reviewable data only"], allowedInputs: ["human request summary", "preview metadata"], allowedOutputs: ["normalized intent preview"], riskLevel: "medium", status: "defined", warnings: ["Input intake contract does not execute input handling."] }),
    createRuntimeComponentContractEntry({ componentId: "controlled-runtime-component-contract-002", title: "Contract validation component contract", role: "contract-validation", responsibilities: ["Describe future validation of controlled generation contracts", "Represent contract readiness without enforcement"], allowedInputs: ["normalized intent preview", "controlled generation contract stack"], allowedOutputs: ["contract validation preview"], dependencies: ["input-intake"], riskLevel: "high", status: "defined", warnings: ["Contract validation is preview-only and does not enforce policy."] }),
    createRuntimeComponentContractEntry({ componentId: "controlled-runtime-component-contract-003", title: "Governance review component contract", role: "governance-review", responsibilities: ["Describe future governance review boundaries", "Keep governance activation disabled"], allowedInputs: ["contract validation preview", "governance audit preview"], allowedOutputs: ["governance review preview"], dependencies: ["contract-validation"], riskLevel: "critical", status: "defined", warnings: ["Governance review does not activate governance."] }),
    createRuntimeComponentContractEntry({ componentId: "controlled-runtime-component-contract-004", title: "Planning component contract", role: "planning", responsibilities: ["Describe future plan assembly boundaries", "Prevent planner-agent runtime loops"], allowedInputs: ["governance review preview", "architecture preview"], allowedOutputs: ["plan preview"], dependencies: ["governance-review"], riskLevel: "high", status: "defined", warnings: ["Planning contract does not introduce planner loops."] }),
    createRuntimeComponentContractEntry({ componentId: "controlled-runtime-component-contract-005", title: "Approval component contract", role: "approval", responsibilities: ["Describe future human approval checkpoints", "Prevent approval execution and persistence"], allowedInputs: ["plan preview", "risk preview"], allowedOutputs: ["approval preview"], dependencies: ["planning"], riskLevel: "critical", status: "defined", warnings: ["Approval contract does not approve or reject anything."] }),
    createRuntimeComponentContractEntry({ componentId: "controlled-runtime-component-contract-006", title: "Generation preview component contract", role: "generation-preview", responsibilities: ["Describe future generation boundary without generation runtime", "Keep project generation disabled"], allowedInputs: ["approval preview", "plan preview"], allowedOutputs: ["generation preview"], dependencies: ["approval"], riskLevel: "critical", status: "defined", warnings: ["Generation preview contract does not generate projects."] }),
    createRuntimeComponentContractEntry({ componentId: "controlled-runtime-component-contract-007", title: "Validation preview component contract", role: "validation-preview", responsibilities: ["Describe future generated-project validation preview", "Prevent validation command execution"], allowedInputs: ["generation preview", "validation plan preview"], allowedOutputs: ["validation preview"], dependencies: ["generation-preview"], riskLevel: "high", status: "defined", warnings: ["Validation preview contract does not execute validation commands."] }),
    createRuntimeComponentContractEntry({ componentId: "controlled-runtime-component-contract-008", title: "Review component contract", role: "review", responsibilities: ["Describe future human review of runtime artifacts", "Keep review descriptive only"], allowedInputs: ["validation preview", "review pack preview"], allowedOutputs: ["review preview"], dependencies: ["validation-preview"], riskLevel: "medium", status: "defined", warnings: ["Review contract does not apply decisions."] }),
    createRuntimeComponentContractEntry({ componentId: "controlled-runtime-component-contract-009", title: "Export component contract", role: "export", responsibilities: ["Describe stdout-only export previews", "Prevent default file writing"], allowedInputs: ["review preview", "export contract preview"], allowedOutputs: ["stdout export preview"], dependencies: ["review"], riskLevel: "medium", status: "defined", warnings: ["Export contract does not write files by default."] }),
    createRuntimeComponentContractEntry({ componentId: "controlled-runtime-component-contract-010", title: "Audit component contract", role: "audit", responsibilities: ["Describe future audit summaries", "Prevent audit enforcement and runtime routing"], allowedInputs: ["stdout export preview", "architecture preview"], allowedOutputs: ["audit preview"], dependencies: ["export"], riskLevel: "high", status: "defined", warnings: ["Audit contract does not enforce risk or governance decisions."] })
  ];
}

export function sortRuntimeComponentContractEntries(
  entries: readonly ControlledRuntimeComponentContractEntry[]
): ControlledRuntimeComponentContractEntry[] {
  const order = new Map<ControlledRuntimeComponentRole, number>([
    ["input-intake", 1],
    ["contract-validation", 2],
    ["governance-review", 3],
    ["planning", 4],
    ["approval", 5],
    ["generation-preview", 6],
    ["validation-preview", 7],
    ["review", 8],
    ["export", 9],
    ["audit", 10]
  ]);
  return sortDeterministically(entries, (entry) => [
    String(order.get(entry.role) ?? 999).padStart(3, "0"),
    entry.componentId,
    entry.title
  ].join("|"));
}

export function findRuntimeComponentContractsByRole(
  entries: readonly ControlledRuntimeComponentContractEntry[],
  role: ControlledRuntimeComponentRole
): ControlledRuntimeComponentContractEntry[] {
  return sortRuntimeComponentContractEntries(entries).filter((entry) => entry.role === role);
}

export function findRuntimeComponentContractsByRiskLevel(
  entries: readonly ControlledRuntimeComponentContractEntry[],
  riskLevel: ControlledRuntimeComponentContractRiskLevel
): ControlledRuntimeComponentContractEntry[] {
  return sortRuntimeComponentContractEntries(entries).filter((entry) => entry.riskLevel === riskLevel);
}

export function findBlockedRuntimeComponentContracts(
  entries: readonly ControlledRuntimeComponentContractEntry[]
): ControlledRuntimeComponentContractEntry[] {
  return sortRuntimeComponentContractEntries(entries).filter((entry) => entry.status === "blocked" || entry.blockedReason !== null);
}

export function findPreviewOnlyRuntimeComponentContracts(
  entries: readonly ControlledRuntimeComponentContractEntry[]
): ControlledRuntimeComponentContractEntry[] {
  return sortRuntimeComponentContractEntries(entries).filter((entry) => entry.previewOnly === true || entry.status === "preview-only");
}

function summarizeRuntimeComponentContractRiskDistribution(
  entries: readonly ControlledRuntimeComponentContractEntry[]
): { key: ControlledRuntimeComponentContractRiskLevel; totalContracts: number }[] {
  return (["low", "medium", "high", "critical"] as const)
    .map((riskLevel) => ({
      key: riskLevel,
      totalContracts: entries.filter((entry) => entry.riskLevel === riskLevel).length
    }))
    .filter((group) => group.totalContracts > 0);
}

function statusScore(status: ControlledRuntimeComponentContractStatus): number {
  if (status === "defined" || status === "preview-only") return 100;
  if (status === "partial") return 60;
  if (status === "not-started") return 20;
  return 0;
}

function createDefaultForbiddenRuntimeComponentActions(): string[] {
  return [
    "agent-execution",
    "approval-execution",
    "builder-agent-runtime",
    "contract-execution",
    "dependency-installation",
    "file-creation",
    "file-writing",
    "generated-project-validation",
    "governance-activation",
    "input-execution",
    "mutation-execution",
    "output-execution",
    "package-mutation",
    "policy-enforcement",
    "project-generation",
    "runtime-activation",
    "runtime-execution",
    "runtime-orchestration",
    "runtime-persistence",
    "runtime-routing"
  ];
}
