import type { GovernanceMetadata } from "./governanceMetadata.js";
import { normalizeWarnings, sortDeterministically } from "./utils/governanceUtils.js";

export type ProjectGenerationDependencyType =
  | "runtime"
  | "development"
  | "test"
  | "build"
  | "lint"
  | "format"
  | "documentation";

export type ProjectGenerationDependencyInstallationPolicy =
  | "no-install"
  | "manual-approval-required"
  | "preview-only"
  | "blocked";

export type ProjectGenerationDependencyVersionPolicy =
  | "exact"
  | "range"
  | "latest-disallowed"
  | "manual-review-required"
  | "unspecified";

export type ProjectGenerationDependencyRiskLevel =
  | "low"
  | "medium"
  | "high"
  | "critical";

export type ProjectGenerationDependencyPlanCompletenessLevel =
  | "incomplete"
  | "partial"
  | "review-ready"
  | "ready-for-design";

export type ProjectGenerationDependencyPlanCompleteness = {
  score: number;
  level: ProjectGenerationDependencyPlanCompletenessLevel;
  reason: string;
};

export type ProjectGenerationDependencyPlanEntry = {
  packageName: string;
  dependencyType: ProjectGenerationDependencyType;
  purpose: string;
  requiredBy: string[];
  installationPolicy: ProjectGenerationDependencyInstallationPolicy;
  versionPolicy: ProjectGenerationDependencyVersionPolicy;
  riskLevel: ProjectGenerationDependencyRiskLevel;
  requiresApproval: boolean;
  blockedReason: string | null;
  warnings: string[];
  recommendations: string[];
  readonly: boolean;
  previewOnly: boolean;
};

export type ProjectGenerationDependencyPlanSummary = {
  totalDependencies: number;
  approvalRequiredCount: number;
  blockedCount: number;
  noInstallCount: number;
  manualApprovalRequiredCount: number;
  previewOnlyCount: number;
  riskDistribution: { key: ProjectGenerationDependencyRiskLevel; totalDependencies: number }[];
  readonly: boolean;
  previewOnly: boolean;
  warnings: string[];
  recommendations: string[];
  completeness: ProjectGenerationDependencyPlanCompleteness;
};

export type ProjectGenerationDependencyPlanPreview = {
  schemaVersion: 1;
  title: string;
  metadata: GovernanceMetadata;
  readonly: true;
  previewOnly: true;
  dependencyPlanPreviewOnly: true;
  stdoutOnly: true;
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
  entries: ProjectGenerationDependencyPlanEntry[];
  summary: ProjectGenerationDependencyPlanSummary;
};

export function createProjectGenerationDependencyPlanPreview(input: {
  title: string;
  metadata: GovernanceMetadata;
  entries?: readonly ProjectGenerationDependencyPlanEntry[];
}): ProjectGenerationDependencyPlanPreview {
  const entries = sortDependencyPlanEntries(input.entries ?? createDefaultProjectGenerationDependencyPlanEntries());
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
    dependencyPlanPreviewOnly: true,
    stdoutOnly: true,
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
    entries,
    summary: summarizeProjectGenerationDependencyPlanPreview(entries)
  };
}

export function summarizeProjectGenerationDependencyPlanPreview(entries: readonly ProjectGenerationDependencyPlanEntry[]): ProjectGenerationDependencyPlanSummary {
  const sortedEntries = sortDependencyPlanEntries(entries);
  const warnings = [
    ...sortedEntries.flatMap((entry) => entry.warnings),
    "Project generation dependency plan preview is descriptive only; no dependencies are installed and no package files are mutated."
  ];
  const recommendations = [
    ...sortedEntries.flatMap((entry) => entry.recommendations),
    "Require separate human-approved dependency review before any future package installation or package mutation workflow."
  ];
  return {
    totalDependencies: sortedEntries.length,
    approvalRequiredCount: sortedEntries.filter((entry) => entry.requiresApproval).length,
    blockedCount: findBlockedDependencyPlanEntries(sortedEntries).length,
    noInstallCount: sortedEntries.filter((entry) => entry.installationPolicy === "no-install").length,
    manualApprovalRequiredCount: sortedEntries.filter((entry) => entry.installationPolicy === "manual-approval-required").length,
    previewOnlyCount: sortedEntries.filter((entry) => entry.installationPolicy === "preview-only").length,
    riskDistribution: summarizeRiskDistribution(sortedEntries),
    readonly: sortedEntries.length > 0 && sortedEntries.every((entry) => entry.readonly === true),
    previewOnly: sortedEntries.length > 0 && sortedEntries.every((entry) => entry.previewOnly === true),
    warnings: normalizeWarnings(warnings),
    recommendations: normalizeWarnings(recommendations),
    completeness: calculateProjectGenerationDependencyPlanCompleteness(sortedEntries)
  };
}

export function calculateProjectGenerationDependencyPlanCompleteness(entries: readonly ProjectGenerationDependencyPlanEntry[]): ProjectGenerationDependencyPlanCompleteness {
  if (entries.length === 0) {
    return { score: 0, level: "incomplete", reason: "No dependency plan entries were provided." };
  }
  if (entries.some((entry) => entry.installationPolicy === "blocked" || entry.blockedReason !== null)) {
    return { score: 0, level: "incomplete", reason: "One or more dependency plan entries are blocked." };
  }
  const total = entries.reduce((sum, entry) => sum + dependencyInstallationPolicyScore(entry.installationPolicy), 0);
  const score = Math.round((total / entries.length) * 10);
  return {
    score,
    level: score >= 90 ? "ready-for-design" : score >= 75 ? "review-ready" : score >= 40 ? "partial" : "incomplete",
    reason: "Advisory dependency plan completeness score computed from deterministic preview-only installation policies."
  };
}

export function createDependencyPlanEntry(input: {
  packageName: string;
  dependencyType: ProjectGenerationDependencyType;
  purpose: string;
  requiredBy: readonly string[];
  installationPolicy: ProjectGenerationDependencyInstallationPolicy;
  versionPolicy: ProjectGenerationDependencyVersionPolicy;
  riskLevel: ProjectGenerationDependencyRiskLevel;
  requiresApproval: boolean;
  blockedReason?: string | null;
  warnings?: readonly string[];
  recommendations?: readonly string[];
}): ProjectGenerationDependencyPlanEntry {
  return {
    packageName: input.packageName,
    dependencyType: input.dependencyType,
    purpose: input.purpose,
    requiredBy: sortDeterministically(input.requiredBy, (value) => value),
    installationPolicy: input.installationPolicy,
    versionPolicy: input.versionPolicy,
    riskLevel: input.riskLevel,
    requiresApproval: input.requiresApproval,
    blockedReason: input.blockedReason ?? null,
    warnings: normalizeWarnings(input.warnings ?? []),
    recommendations: normalizeWarnings(input.recommendations ?? []),
    readonly: true,
    previewOnly: true
  };
}

export function createDefaultProjectGenerationDependencyPlanEntries(): ProjectGenerationDependencyPlanEntry[] {
  return [
    createDependencyPlanEntry({ packageName: "eslint", dependencyType: "lint", purpose: "Future lint validation preview.", requiredBy: ["validationPlan"], installationPolicy: "no-install", versionPolicy: "manual-review-required", riskLevel: "low", requiresApproval: false, recommendations: ["Keep lint dependency planning advisory until dependency review exists."] }),
    createDependencyPlanEntry({ packageName: "prettier", dependencyType: "format", purpose: "Future formatting preview.", requiredBy: ["validationPlan"], installationPolicy: "preview-only", versionPolicy: "manual-review-required", riskLevel: "low", requiresApproval: false, recommendations: ["Keep formatter dependency planning stdout-only."] }),
    createDependencyPlanEntry({ packageName: "typescript", dependencyType: "build", purpose: "Future TypeScript build preview.", requiredBy: ["architecture", "validationPlan"], installationPolicy: "manual-approval-required", versionPolicy: "exact", riskLevel: "medium", requiresApproval: true, warnings: ["Build dependencies can alter project behavior and require review."] }),
    createDependencyPlanEntry({ packageName: "vite", dependencyType: "development", purpose: "Future development server preview.", requiredBy: ["architecture"], installationPolicy: "manual-approval-required", versionPolicy: "range", riskLevel: "medium", requiresApproval: true, warnings: ["Development tooling is not installed by this preview."] }),
    createDependencyPlanEntry({ packageName: "vitest", dependencyType: "test", purpose: "Future test runner preview.", requiredBy: ["validationPlan"], installationPolicy: "manual-approval-required", versionPolicy: "range", riskLevel: "medium", requiresApproval: true, warnings: ["Test dependencies are planning-only."] }),
    createDependencyPlanEntry({ packageName: "zod", dependencyType: "runtime", purpose: "Future runtime validation preview.", requiredBy: ["requirements"], installationPolicy: "manual-approval-required", versionPolicy: "latest-disallowed", riskLevel: "high", requiresApproval: true, warnings: ["Runtime dependencies require explicit human approval."] }),
    createDependencyPlanEntry({ packageName: "typedoc", dependencyType: "documentation", purpose: "Future documentation generation preview.", requiredBy: ["documentation"], installationPolicy: "no-install", versionPolicy: "unspecified", riskLevel: "high", requiresApproval: true, warnings: ["Documentation generators can execute code paths and require review."] })
  ];
}

export function sortDependencyPlanEntries(entries: readonly ProjectGenerationDependencyPlanEntry[]): ProjectGenerationDependencyPlanEntry[] {
  return sortDeterministically(entries, (entry) => [entry.packageName, entry.dependencyType, entry.riskLevel].join("|"));
}

export function findDependencyPlanEntriesByType(entries: readonly ProjectGenerationDependencyPlanEntry[], dependencyType: ProjectGenerationDependencyType): ProjectGenerationDependencyPlanEntry[] {
  return sortDependencyPlanEntries(entries).filter((entry) => entry.dependencyType === dependencyType);
}

export function findDependencyPlanEntriesByRiskLevel(entries: readonly ProjectGenerationDependencyPlanEntry[], riskLevel: ProjectGenerationDependencyRiskLevel): ProjectGenerationDependencyPlanEntry[] {
  return sortDependencyPlanEntries(entries).filter((entry) => entry.riskLevel === riskLevel);
}

export function findApprovalRequiredDependencyPlanEntries(entries: readonly ProjectGenerationDependencyPlanEntry[]): ProjectGenerationDependencyPlanEntry[] {
  return sortDependencyPlanEntries(entries).filter((entry) => entry.requiresApproval);
}

export function findBlockedDependencyPlanEntries(entries: readonly ProjectGenerationDependencyPlanEntry[]): ProjectGenerationDependencyPlanEntry[] {
  return sortDependencyPlanEntries(entries).filter((entry) => entry.installationPolicy === "blocked" || entry.blockedReason !== null);
}

function summarizeRiskDistribution(entries: readonly ProjectGenerationDependencyPlanEntry[]): { key: ProjectGenerationDependencyRiskLevel; totalDependencies: number }[] {
  const counts = new Map<ProjectGenerationDependencyRiskLevel, number>();
  for (const entry of entries) {
    counts.set(entry.riskLevel, (counts.get(entry.riskLevel) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([key, totalDependencies]) => ({ key, totalDependencies }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

function dependencyInstallationPolicyScore(policy: ProjectGenerationDependencyInstallationPolicy): number {
  if (policy === "preview-only") return 8;
  if (policy === "no-install") return 8;
  if (policy === "manual-approval-required") return 6;
  return 0;
}
