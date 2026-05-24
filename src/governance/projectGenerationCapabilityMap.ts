import type { GovernanceMetadata } from "./governanceMetadata.js";
import { normalizeWarnings, sortDeterministically } from "./utils/governanceUtils.js";

export type ProjectGenerationCapabilityStatus =
  | "not-started"
  | "planned"
  | "partial"
  | "ready-for-design"
  | "ready-for-preview"
  | "blocked";

export type ProjectGenerationCapabilityRiskLevel =
  | "low"
  | "medium"
  | "high"
  | "critical";

export type ProjectGenerationCapability = {
  id: string;
  title: string;
  description: string;
  status: ProjectGenerationCapabilityStatus;
  riskLevel: ProjectGenerationCapabilityRiskLevel;
  readiness: number;
  dependencies: string[];
  blockedBy: string[];
  requiredGovernanceArtifacts: string[];
  warnings: string[];
  recommendations: string[];
  readonly: boolean;
  previewOnly: boolean;
};

export type ProjectGenerationCapabilityDependency = {
  id: string;
  from: string;
  to: string;
  dependencyType: "requires" | "informs" | "reviews" | "validates";
  planningOnly: true;
  reason: string;
};

export type ProjectGenerationCapabilitySummary = {
  totalCapabilities: number;
  statusDistribution: { key: ProjectGenerationCapabilityStatus; totalCapabilities: number }[];
  riskDistribution: { key: ProjectGenerationCapabilityRiskLevel; totalCapabilities: number }[];
  blockedCapabilities: string[];
  totalDependencies: number;
  readonly: boolean;
  previewOnly: boolean;
  warnings: string[];
  recommendations: string[];
};

export type ProjectGenerationCapabilityMap = {
  schemaVersion: 1;
  title: string;
  metadata: GovernanceMetadata;
  readonly: true;
  previewOnly: true;
  planningOnly: true;
  stdoutOnly: true;
  fileWriteAllowed: false;
  runtimeRoutingEnabled: false;
  runtimeActivationEnabled: false;
  policyEnforcementEnabled: false;
  projectGenerationEnabled: false;
  builderAgentRuntimeEnabled: false;
  capabilities: ProjectGenerationCapability[];
  dependencies: ProjectGenerationCapabilityDependency[];
  summary: ProjectGenerationCapabilitySummary;
};

export function createProjectGenerationCapabilityMap(input: {
  title: string;
  metadata: GovernanceMetadata;
  capabilities?: readonly ProjectGenerationCapability[];
  dependencies?: readonly ProjectGenerationCapabilityDependency[];
}): ProjectGenerationCapabilityMap {
  const capabilities = sortProjectGenerationCapabilities(input.capabilities ?? createDefaultProjectGenerationCapabilities());
  const dependencies = sortCapabilityDependencies(input.dependencies ?? createDefaultProjectGenerationCapabilityDependencies());
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
    planningOnly: true,
    stdoutOnly: true,
    fileWriteAllowed: false,
    runtimeRoutingEnabled: false,
    runtimeActivationEnabled: false,
    policyEnforcementEnabled: false,
    projectGenerationEnabled: false,
    builderAgentRuntimeEnabled: false,
    capabilities,
    dependencies,
    summary: summarizeProjectGenerationCapabilityMap(capabilities, dependencies)
  };
}

export function summarizeProjectGenerationCapabilityMap(
  capabilities: readonly ProjectGenerationCapability[],
  dependencies: readonly ProjectGenerationCapabilityDependency[] = []
): ProjectGenerationCapabilitySummary {
  const sortedCapabilities = sortProjectGenerationCapabilities(capabilities);
  const warnings = [
    ...sortedCapabilities.flatMap((capability) => capability.warnings),
    "Project generation capabilities are planning-only; no builder-agent runtime, project generation runtime, planner loop, routing, or mutation expansion is enabled."
  ];
  const recommendations = [
    ...sortedCapabilities.flatMap((capability) => capability.recommendations),
    "Require separate human-approved design previews before implementing any project generation runtime."
  ];
  return {
    totalCapabilities: sortedCapabilities.length,
    statusDistribution: summarizeBy(sortedCapabilities, (capability) => capability.status),
    riskDistribution: summarizeBy(sortedCapabilities, (capability) => capability.riskLevel),
    blockedCapabilities: findBlockedCapabilities(sortedCapabilities).map((capability) => capability.id),
    totalDependencies: dependencies.length,
    readonly: sortedCapabilities.length > 0 && sortedCapabilities.every((capability) => capability.readonly === true),
    previewOnly: sortedCapabilities.length > 0 && sortedCapabilities.every((capability) => capability.previewOnly === true),
    warnings: normalizeWarnings(warnings),
    recommendations: normalizeWarnings(recommendations)
  };
}

export function createDefaultProjectGenerationCapabilities(): ProjectGenerationCapability[] {
  return [
    createCapability("project-intent-capture", "Project Intent Capture", "Capture future project intent as reviewable input without executing generation.", "ready-for-design", "medium", 7, [], [], ["readiness-assessment"], ["Intent capture is planning-only and does not start a builder-agent loop."], ["Require explicit human review before intent becomes an executable plan."]),
    createCapability("requirements-normalization", "Requirements Normalization", "Normalize project requirements into deterministic review data without AST parsing or ML.", "planned", "medium", 6, ["project-intent-capture"], [], ["readiness-assessment", "capability-map"], ["Requirements normalization is descriptive and does not infer runtime actions."], ["Keep normalization rule-based and reviewable before any future implementation."]),
    createCapability("project-blueprint-planning", "Project Blueprint Planning", "Describe future project blueprint planning requirements without creating files or scaffolds.", "planned", "high", 5, ["requirements-normalization"], [], ["readiness-assessment", "review-pack-preview"], ["Blueprint planning is not project generation."], ["Require design review before blueprint plans can affect mutation workflows."]),
    createCapability("file-plan-preview", "File Plan Preview", "Preview future file plans as data only while preserving the single-file mutation invariant.", "partial", "high", 5, ["project-blueprint-planning", "safe-patch-integration"], [], ["readonly-contract", "safe-patch-boundary"], ["File plan preview must not write files or expand mutation scope."], ["Keep all file plan outputs stdout-only until a separate approval workflow exists."]),
    createCapability("dependency-plan-preview", "Dependency Plan Preview", "Describe dependency planning needs without installing packages or touching lockfiles.", "planned", "medium", 5, ["project-blueprint-planning"], [], ["artifact-index", "review-pack-preview"], ["Dependency plans are advisory and do not execute package installation."], ["Require human review and validation before future dependency changes."]),
    createCapability("task-graph-preview", "Task Graph Preview", "Preview future task graph structure without planner-agent runtime loops.", "planned", "high", 4, ["project-blueprint-planning"], [], ["capability-map", "validation-suite"], ["Task graph preview is not an orchestration runtime."], ["Keep task graphs static, deterministic, and non-executing."]),
    createCapability("safe-patch-integration", "Safe Patch Integration", "Define how future generation previews would preserve Safe Patch Engine exclusivity.", "ready-for-design", "medium", 8, ["human-approval-workflow"], [], ["safe-patch-boundary", "readonly-contract"], [], ["Preserve Safe Patch Engine as the only mutation layer."]),
    createCapability("human-approval-workflow", "Human Approval Workflow", "Describe required human approval gates for any future controlled project generation work.", "ready-for-design", "low", 8, ["artifact-review-pack-integration"], [], ["review-pack-preview", "completion-audit"], [], ["Require explicit approval before any future generation preview can write or mutate."]),
    createCapability("validation-plan-preview", "Validation Plan Preview", "Describe validation planning for future generated project artifacts without executing runtime orchestration.", "planned", "medium", 6, ["task-graph-preview", "file-plan-preview"], [], ["validation-suite", "snapshot-preview"], ["Validation plan preview does not run autonomous repair or generation loops."], ["Keep validation plans deterministic and manually reviewable."]),
    createCapability("rollback-plan-preview", "Rollback Plan Preview", "Describe rollback planning requirements for future project generation without executing rollback.", "planned", "high", 5, ["file-plan-preview", "validation-plan-preview"], [], ["completion-audit", "readonly-contract"], ["Rollback plan preview is documentation only and does not execute rollback."], ["Require rollback validation before any future generation runtime design."]),
    createCapability("artifact-review-pack-integration", "Artifact Review Pack Integration", "Use governance review packs as future human review inputs without routing runtime behavior.", "ready-for-preview", "low", 9, [], [], ["review-pack-preview", "snapshot-preview", "export-contract"], [], ["Keep review-pack integration read-only and stdout-only by default."])
  ];
}

export function createDefaultProjectGenerationCapabilityDependencies(): ProjectGenerationCapabilityDependency[] {
  return [
    createDependency("pg-capability-dependency-001", "requirements-normalization", "project-intent-capture", "requires", "Requirements must follow captured project intent."),
    createDependency("pg-capability-dependency-002", "project-blueprint-planning", "requirements-normalization", "requires", "Blueprint planning depends on normalized requirements."),
    createDependency("pg-capability-dependency-003", "file-plan-preview", "project-blueprint-planning", "requires", "File plan previews depend on a blueprint plan."),
    createDependency("pg-capability-dependency-004", "dependency-plan-preview", "project-blueprint-planning", "requires", "Dependency plans depend on blueprint scope."),
    createDependency("pg-capability-dependency-005", "task-graph-preview", "project-blueprint-planning", "requires", "Task graph previews depend on blueprint structure."),
    createDependency("pg-capability-dependency-006", "safe-patch-integration", "human-approval-workflow", "reviews", "Safe Patch integration must remain human-reviewed."),
    createDependency("pg-capability-dependency-007", "human-approval-workflow", "artifact-review-pack-integration", "requires", "Human approval uses review-pack evidence."),
    createDependency("pg-capability-dependency-008", "validation-plan-preview", "task-graph-preview", "informs", "Task graph previews inform validation plans."),
    createDependency("pg-capability-dependency-009", "validation-plan-preview", "file-plan-preview", "validates", "Validation plans must validate file plan previews."),
    createDependency("pg-capability-dependency-010", "rollback-plan-preview", "file-plan-preview", "requires", "Rollback planning depends on file plan previews."),
    createDependency("pg-capability-dependency-011", "rollback-plan-preview", "validation-plan-preview", "requires", "Rollback planning depends on validation planning.")
  ];
}

export function sortProjectGenerationCapabilities(capabilities: readonly ProjectGenerationCapability[]): ProjectGenerationCapability[] {
  return sortDeterministically(capabilities, (capability) => [capability.id, capability.status, capability.riskLevel].join("|"));
}

export function findCapabilityById(capabilities: readonly ProjectGenerationCapability[], id: string): ProjectGenerationCapability | null {
  return sortProjectGenerationCapabilities(capabilities).find((capability) => capability.id === id) ?? null;
}

export function findCapabilitiesByStatus(capabilities: readonly ProjectGenerationCapability[], status: ProjectGenerationCapabilityStatus): ProjectGenerationCapability[] {
  return sortProjectGenerationCapabilities(capabilities).filter((capability) => capability.status === status);
}

export function findCapabilitiesByRiskLevel(capabilities: readonly ProjectGenerationCapability[], riskLevel: ProjectGenerationCapabilityRiskLevel): ProjectGenerationCapability[] {
  return sortProjectGenerationCapabilities(capabilities).filter((capability) => capability.riskLevel === riskLevel);
}

export function findBlockedCapabilities(capabilities: readonly ProjectGenerationCapability[]): ProjectGenerationCapability[] {
  return sortProjectGenerationCapabilities(capabilities).filter((capability) => capability.status === "blocked" || capability.blockedBy.length > 0);
}

export function summarizeCapabilityDependencies(dependencies: readonly ProjectGenerationCapabilityDependency[]): { totalDependencies: number; dependencyTypes: { key: string; totalDependencies: number }[] } {
  const sorted = sortCapabilityDependencies(dependencies);
  return {
    totalDependencies: sorted.length,
    dependencyTypes: summarizeBy(sorted, (dependency) => dependency.dependencyType).map((entry) => ({ key: entry.key, totalDependencies: entry.totalCapabilities }))
  };
}

function createCapability(
  id: string,
  title: string,
  description: string,
  status: ProjectGenerationCapabilityStatus,
  riskLevel: ProjectGenerationCapabilityRiskLevel,
  readiness: number,
  dependencies: string[],
  blockedBy: string[],
  requiredGovernanceArtifacts: string[],
  warnings: string[],
  recommendations: string[]
): ProjectGenerationCapability {
  return {
    id,
    title,
    description,
    status,
    riskLevel,
    readiness: clampReadiness(readiness),
    dependencies: sortStrings(dependencies),
    blockedBy: sortStrings(blockedBy),
    requiredGovernanceArtifacts: sortStrings(requiredGovernanceArtifacts),
    warnings: normalizeWarnings(warnings),
    recommendations: normalizeWarnings(recommendations),
    readonly: true,
    previewOnly: true
  };
}

function createDependency(id: string, from: string, to: string, dependencyType: ProjectGenerationCapabilityDependency["dependencyType"], reason: string): ProjectGenerationCapabilityDependency {
  return {
    id,
    from,
    to,
    dependencyType,
    planningOnly: true,
    reason
  };
}

function sortCapabilityDependencies(dependencies: readonly ProjectGenerationCapabilityDependency[]): ProjectGenerationCapabilityDependency[] {
  return sortDeterministically(dependencies, (dependency) => [dependency.from, dependency.to, dependency.dependencyType, dependency.id].join("|"));
}

function summarizeBy<T, K extends string>(items: readonly T[], getKey: (item: T) => K): { key: K; totalCapabilities: number }[] {
  const counts = new Map<K, number>();
  for (const item of items) {
    const key = getKey(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([key, totalCapabilities]) => ({ key, totalCapabilities }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

function sortStrings(values: readonly string[]): string[] {
  return sortDeterministically(values, (value) => value);
}

function clampReadiness(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 10) return 10;
  return Math.round(value);
}
