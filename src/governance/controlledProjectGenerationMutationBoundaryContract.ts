import type { GovernanceMetadata } from "./governanceMetadata.js";
import { normalizeWarnings, sortDeterministically } from "./utils/governanceUtils.js";

export type ControlledProjectGenerationMutationGroup =
  | "fileCreation"
  | "fileModification"
  | "fileDeletion"
  | "packageMutation"
  | "dependencyInstallation"
  | "configurationMutation"
  | "scriptMutation"
  | "generatedCodeMutation"
  | "testMutation"
  | "documentationMutation"
  | "safePatchBoundary"
  | "multiFileMutationBoundary";

export type ControlledProjectGenerationMutationPolicy =
  | "forbidden"
  | "blocked"
  | "preview-only"
  | "manual-approval-required"
  | "safe-patch-only"
  | "not-applicable";

export type ControlledProjectGenerationMutationRiskLevel =
  | "low"
  | "medium"
  | "high"
  | "critical";

export type ControlledProjectGenerationMutationBoundaryCompletenessLevel =
  | "incomplete"
  | "partial"
  | "contract-defined"
  | "ready-for-design";

export type ControlledProjectGenerationMutationBoundaryCompleteness = {
  score: number;
  level: ControlledProjectGenerationMutationBoundaryCompletenessLevel;
  reason: string;
};

export type ControlledProjectGenerationMutationBoundary = {
  boundaryId: string;
  group: ControlledProjectGenerationMutationGroup;
  title: string;
  description: string;
  mutationPolicy: ControlledProjectGenerationMutationPolicy;
  riskLevel: ControlledProjectGenerationMutationRiskLevel;
  allowed: string[];
  forbidden: string[];
  safePatchRequired: boolean;
  approvalRequired: boolean;
  blockedReason: string | null;
  warnings: string[];
  recommendations: string[];
  readonly: boolean;
  previewOnly: boolean;
  noExecution: boolean;
};

export type ControlledProjectGenerationMutationBoundarySummary = {
  totalBoundaries: number;
  forbiddenCount: number;
  blockedCount: number;
  safePatchOnlyCount: number;
  approvalRequiredCount: number;
  groupDistribution: { key: ControlledProjectGenerationMutationGroup; totalBoundaries: number }[];
  policyDistribution: { key: ControlledProjectGenerationMutationPolicy; totalBoundaries: number }[];
  riskDistribution: { key: ControlledProjectGenerationMutationRiskLevel; totalBoundaries: number }[];
  readonly: boolean;
  previewOnly: boolean;
  noExecution: boolean;
  warnings: string[];
  recommendations: string[];
  completeness: ControlledProjectGenerationMutationBoundaryCompleteness;
};

export type ControlledProjectGenerationMutationBoundaryContract = {
  schemaVersion: 1;
  title: string;
  metadata: GovernanceMetadata;
  readonly: true;
  previewOnly: true;
  mutationBoundaryContractOnly: true;
  stdoutOnly: true;
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
  boundaries: ControlledProjectGenerationMutationBoundary[];
  summary: ControlledProjectGenerationMutationBoundarySummary;
};

export function createControlledProjectGenerationMutationBoundaryContract(input: {
  title: string;
  metadata: GovernanceMetadata;
  boundaries?: readonly ControlledProjectGenerationMutationBoundary[];
}): ControlledProjectGenerationMutationBoundaryContract {
  const boundaries = sortMutationBoundaries(input.boundaries ?? createDefaultMutationBoundaries());
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
    mutationBoundaryContractOnly: true,
    stdoutOnly: true,
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
    boundaries,
    summary: summarizeControlledProjectGenerationMutationBoundaryContract(boundaries)
  };
}

export function summarizeControlledProjectGenerationMutationBoundaryContract(
  boundaries: readonly ControlledProjectGenerationMutationBoundary[]
): ControlledProjectGenerationMutationBoundarySummary {
  const sortedBoundaries = sortMutationBoundaries(boundaries);
  const warnings = [
    ...sortedBoundaries.flatMap((boundary) => boundary.warnings),
    "Controlled project generation mutation boundary contract is descriptive only; no mutation execution or mutation expansion is enabled."
  ];
  const recommendations = [
    ...sortedBoundaries.flatMap((boundary) => boundary.recommendations),
    "Require separate human-approved runtime design before any future mutation-capable behavior exists."
  ];
  return {
    totalBoundaries: sortedBoundaries.length,
    forbiddenCount: findForbiddenMutationBoundaries(sortedBoundaries).length,
    blockedCount: findBlockedMutationBoundaries(sortedBoundaries).length,
    safePatchOnlyCount: findSafePatchOnlyMutationBoundaries(sortedBoundaries).length,
    approvalRequiredCount: sortedBoundaries.filter((boundary) => boundary.approvalRequired).length,
    groupDistribution: summarizeBy(sortedBoundaries, (boundary) => boundary.group),
    policyDistribution: summarizeBy(sortedBoundaries, (boundary) => boundary.mutationPolicy),
    riskDistribution: summarizeBy(sortedBoundaries, (boundary) => boundary.riskLevel),
    readonly: sortedBoundaries.length > 0 && sortedBoundaries.every((boundary) => boundary.readonly),
    previewOnly: sortedBoundaries.length > 0 && sortedBoundaries.every((boundary) => boundary.previewOnly),
    noExecution: sortedBoundaries.length > 0 && sortedBoundaries.every((boundary) => boundary.noExecution),
    warnings: normalizeWarnings(warnings),
    recommendations: normalizeWarnings(recommendations),
    completeness: calculateControlledProjectGenerationMutationBoundaryCompleteness(sortedBoundaries)
  };
}

export function calculateControlledProjectGenerationMutationBoundaryCompleteness(
  boundaries: readonly ControlledProjectGenerationMutationBoundary[]
): ControlledProjectGenerationMutationBoundaryCompleteness {
  if (boundaries.length === 0) {
    return { score: 0, level: "incomplete", reason: "No controlled project generation mutation boundaries were provided." };
  }
  if (boundaries.some((boundary) => boundary.noExecution !== true)) {
    return { score: 0, level: "incomplete", reason: "One or more mutation boundaries allow execution." };
  }
  const score = Math.round((boundaries.reduce((sum, boundary) => sum + mutationPolicyScore(boundary.mutationPolicy), 0) / boundaries.length) * 10);
  return {
    score,
    level: score >= 90 ? "ready-for-design" : score >= 75 ? "contract-defined" : score >= 40 ? "partial" : "incomplete",
    reason: "Advisory mutation boundary completeness score computed from deterministic non-executing mutation policies."
  };
}

export function createMutationBoundary(input: {
  boundaryId: string;
  group: ControlledProjectGenerationMutationGroup;
  title: string;
  description: string;
  mutationPolicy: ControlledProjectGenerationMutationPolicy;
  riskLevel: ControlledProjectGenerationMutationRiskLevel;
  allowed: readonly string[];
  forbidden: readonly string[];
  safePatchRequired: boolean;
  approvalRequired: boolean;
  blockedReason?: string | null;
  warnings?: readonly string[];
  recommendations?: readonly string[];
}): ControlledProjectGenerationMutationBoundary {
  return {
    boundaryId: input.boundaryId,
    group: input.group,
    title: input.title,
    description: input.description,
    mutationPolicy: input.mutationPolicy,
    riskLevel: input.riskLevel,
    allowed: normalizeWarnings(input.allowed),
    forbidden: normalizeWarnings(input.forbidden),
    safePatchRequired: input.safePatchRequired,
    approvalRequired: input.approvalRequired,
    blockedReason: input.blockedReason ?? null,
    warnings: normalizeWarnings(input.warnings ?? [`${input.title} is mutation-boundary-only and does not execute mutations.`]),
    recommendations: normalizeWarnings(input.recommendations ?? ["Keep this mutation boundary descriptive until a separate controlled runtime design is approved."]),
    readonly: true,
    previewOnly: true,
    noExecution: true
  };
}

export function sortMutationBoundaries(boundaries: readonly ControlledProjectGenerationMutationBoundary[]): ControlledProjectGenerationMutationBoundary[] {
  const order = new Map<ControlledProjectGenerationMutationGroup, number>([
    ["fileCreation", 1],
    ["fileModification", 2],
    ["fileDeletion", 3],
    ["packageMutation", 4],
    ["dependencyInstallation", 5],
    ["configurationMutation", 6],
    ["scriptMutation", 7],
    ["generatedCodeMutation", 8],
    ["testMutation", 9],
    ["documentationMutation", 10],
    ["safePatchBoundary", 11],
    ["multiFileMutationBoundary", 12]
  ]);
  return sortDeterministically(boundaries, (boundary) => `${String(order.get(boundary.group) ?? 99).padStart(2, "0")}|${boundary.boundaryId}`);
}

export function findMutationBoundariesByGroup(boundaries: readonly ControlledProjectGenerationMutationBoundary[], group: ControlledProjectGenerationMutationGroup): ControlledProjectGenerationMutationBoundary[] {
  return sortMutationBoundaries(boundaries).filter((boundary) => boundary.group === group);
}

export function findMutationBoundariesByPolicy(boundaries: readonly ControlledProjectGenerationMutationBoundary[], policy: ControlledProjectGenerationMutationPolicy): ControlledProjectGenerationMutationBoundary[] {
  return sortMutationBoundaries(boundaries).filter((boundary) => boundary.mutationPolicy === policy);
}

export function findMutationBoundariesByRiskLevel(boundaries: readonly ControlledProjectGenerationMutationBoundary[], riskLevel: ControlledProjectGenerationMutationRiskLevel): ControlledProjectGenerationMutationBoundary[] {
  return sortMutationBoundaries(boundaries).filter((boundary) => boundary.riskLevel === riskLevel);
}

export function findBlockedMutationBoundaries(boundaries: readonly ControlledProjectGenerationMutationBoundary[]): ControlledProjectGenerationMutationBoundary[] {
  return sortMutationBoundaries(boundaries).filter((boundary) => boundary.mutationPolicy === "blocked" || boundary.blockedReason !== null);
}

export function findForbiddenMutationBoundaries(boundaries: readonly ControlledProjectGenerationMutationBoundary[]): ControlledProjectGenerationMutationBoundary[] {
  return sortMutationBoundaries(boundaries).filter((boundary) => boundary.mutationPolicy === "forbidden");
}

export function findSafePatchOnlyMutationBoundaries(boundaries: readonly ControlledProjectGenerationMutationBoundary[]): ControlledProjectGenerationMutationBoundary[] {
  return sortMutationBoundaries(boundaries).filter((boundary) => boundary.mutationPolicy === "safe-patch-only");
}

function createDefaultMutationBoundaries(): ControlledProjectGenerationMutationBoundary[] {
  return [
    createMutationBoundary({ boundaryId: "controlled-mutation-001-file-creation", group: "fileCreation", title: "File creation", description: "Future file creation remains forbidden until separate approval exists.", mutationPolicy: "forbidden", riskLevel: "critical", allowed: ["preview file plans only"], forbidden: ["file creation", "scaffold generation"], safePatchRequired: false, approvalRequired: true }),
    createMutationBoundary({ boundaryId: "controlled-mutation-002-file-modification", group: "fileModification", title: "File modification", description: "Future file modification is theoretical Safe-Patch-only and non-executing.", mutationPolicy: "safe-patch-only", riskLevel: "high", allowed: ["safe patch preview records"], forbidden: ["direct writes", "multi-file mutation"], safePatchRequired: true, approvalRequired: true }),
    createMutationBoundary({ boundaryId: "controlled-mutation-003-file-deletion", group: "fileDeletion", title: "File deletion", description: "Future file deletion remains forbidden.", mutationPolicy: "forbidden", riskLevel: "critical", allowed: ["deletion risk notes"], forbidden: ["file deletion"], safePatchRequired: false, approvalRequired: true }),
    createMutationBoundary({ boundaryId: "controlled-mutation-004-package-mutation", group: "packageMutation", title: "Package mutation", description: "Future package mutation remains forbidden.", mutationPolicy: "forbidden", riskLevel: "critical", allowed: ["package plan preview records"], forbidden: ["package.json mutation", "lockfile mutation"], safePatchRequired: false, approvalRequired: true }),
    createMutationBoundary({ boundaryId: "controlled-mutation-005-dependency-installation", group: "dependencyInstallation", title: "Dependency installation", description: "Future dependency installation remains forbidden.", mutationPolicy: "forbidden", riskLevel: "critical", allowed: ["dependency plan preview records"], forbidden: ["dependency installation"], safePatchRequired: false, approvalRequired: true }),
    createMutationBoundary({ boundaryId: "controlled-mutation-006-configuration-mutation", group: "configurationMutation", title: "Configuration mutation", description: "Future configuration mutation requires manual approval and remains non-executing.", mutationPolicy: "manual-approval-required", riskLevel: "high", allowed: ["configuration preview records"], forbidden: ["config activation", "runtime routing"], safePatchRequired: true, approvalRequired: true }),
    createMutationBoundary({ boundaryId: "controlled-mutation-007-script-mutation", group: "scriptMutation", title: "Script mutation", description: "Future script mutation remains forbidden.", mutationPolicy: "forbidden", riskLevel: "critical", allowed: ["script risk notes"], forbidden: ["script mutation", "script execution"], safePatchRequired: false, approvalRequired: true }),
    createMutationBoundary({ boundaryId: "controlled-mutation-008-generated-code-mutation", group: "generatedCodeMutation", title: "Generated code mutation", description: "Future generated code mutation is theoretical Safe-Patch-only and non-executing.", mutationPolicy: "safe-patch-only", riskLevel: "high", allowed: ["generated code preview records"], forbidden: ["autonomous code generation", "runtime self-modification"], safePatchRequired: true, approvalRequired: true }),
    createMutationBoundary({ boundaryId: "controlled-mutation-009-test-mutation", group: "testMutation", title: "Test mutation", description: "Future test mutation is theoretical Safe-Patch-only and non-executing.", mutationPolicy: "safe-patch-only", riskLevel: "medium", allowed: ["test plan preview records"], forbidden: ["test execution", "test file creation"], safePatchRequired: true, approvalRequired: true }),
    createMutationBoundary({ boundaryId: "controlled-mutation-010-documentation-mutation", group: "documentationMutation", title: "Documentation mutation", description: "Future documentation mutation remains preview-only.", mutationPolicy: "preview-only", riskLevel: "low", allowed: ["documentation preview text"], forbidden: ["documentation file writing by default"], safePatchRequired: false, approvalRequired: false }),
    createMutationBoundary({ boundaryId: "controlled-mutation-011-safe-patch-boundary", group: "safePatchBoundary", title: "Safe Patch boundary", description: "Safe Patch Engine remains the only theoretical future mutation boundary.", mutationPolicy: "safe-patch-only", riskLevel: "medium", allowed: ["Safe Patch Engine boundary documentation"], forbidden: ["alternate mutation layer"], safePatchRequired: true, approvalRequired: true }),
    createMutationBoundary({ boundaryId: "controlled-mutation-012-multi-file-boundary", group: "multiFileMutationBoundary", title: "Multi-file mutation boundary", description: "Multi-file mutation remains forbidden.", mutationPolicy: "forbidden", riskLevel: "critical", allowed: ["single-file boundary documentation"], forbidden: ["multi-file mutation", "mutation expansion"], safePatchRequired: false, approvalRequired: true })
  ];
}

function mutationPolicyScore(policy: ControlledProjectGenerationMutationPolicy): number {
  if (policy === "forbidden") return 10;
  if (policy === "safe-patch-only") return 9;
  if (policy === "blocked") return 9;
  if (policy === "manual-approval-required") return 8;
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
