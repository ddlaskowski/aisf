import type { GovernanceMetadata } from "./governanceMetadata.js";
import { normalizeWarnings, sortDeterministically } from "./utils/governanceUtils.js";

export type ProjectGenerationFilePlanStatus =
  | "planned"
  | "preview-only"
  | "requires-approval"
  | "blocked"
  | "not-started";

export type ProjectGenerationFileRole =
  | "entrypoint"
  | "config"
  | "source"
  | "test"
  | "documentation"
  | "script"
  | "metadata";

export type ProjectGenerationFileType =
  | "typescript"
  | "json"
  | "markdown"
  | "test"
  | "script"
  | "metadata";

export type ProjectGenerationFileMutationPolicy =
  | "no-write"
  | "safe-patch-only"
  | "manual-approval-required"
  | "blocked";

export type ProjectGenerationFilePlanCompletenessLevel =
  | "incomplete"
  | "partial"
  | "review-ready"
  | "ready-for-design";

export type ProjectGenerationFilePlanCompleteness = {
  score: number;
  level: ProjectGenerationFilePlanCompletenessLevel;
  reason: string;
};

export type ProjectGenerationFilePlanEntry = {
  plannedPath: string;
  fileRole: ProjectGenerationFileRole;
  fileType: ProjectGenerationFileType;
  generationStatus: ProjectGenerationFilePlanStatus;
  mutationPolicy: ProjectGenerationFileMutationPolicy;
  requiresApproval: boolean;
  dependsOn: string[];
  risks: string[];
  warnings: string[];
  recommendations: string[];
  readonly: boolean;
  previewOnly: boolean;
};

export type ProjectGenerationFilePlanSummary = {
  totalPlannedFiles: number;
  approvalRequiredCount: number;
  blockedCount: number;
  noWriteCount: number;
  safePatchOnlyCount: number;
  manualApprovalRequiredCount: number;
  readonly: boolean;
  previewOnly: boolean;
  risks: string[];
  warnings: string[];
  recommendations: string[];
  completeness: ProjectGenerationFilePlanCompleteness;
};

export type ProjectGenerationFilePlanPreview = {
  schemaVersion: 1;
  title: string;
  metadata: GovernanceMetadata;
  readonly: true;
  previewOnly: true;
  filePlanPreviewOnly: true;
  stdoutOnly: true;
  fileWriteAllowed: false;
  fileCreationAllowed: false;
  scaffoldGenerationEnabled: false;
  runtimeRoutingEnabled: false;
  runtimeActivationEnabled: false;
  policyEnforcementEnabled: false;
  projectGenerationEnabled: false;
  builderAgentRuntimeEnabled: false;
  entries: ProjectGenerationFilePlanEntry[];
  summary: ProjectGenerationFilePlanSummary;
};

export function createProjectGenerationFilePlanPreview(input: {
  title: string;
  metadata: GovernanceMetadata;
  entries?: readonly ProjectGenerationFilePlanEntry[];
}): ProjectGenerationFilePlanPreview {
  const entries = sortFilePlanEntries(input.entries ?? createDefaultProjectGenerationFilePlanEntries());
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
    filePlanPreviewOnly: true,
    stdoutOnly: true,
    fileWriteAllowed: false,
    fileCreationAllowed: false,
    scaffoldGenerationEnabled: false,
    runtimeRoutingEnabled: false,
    runtimeActivationEnabled: false,
    policyEnforcementEnabled: false,
    projectGenerationEnabled: false,
    builderAgentRuntimeEnabled: false,
    entries,
    summary: summarizeProjectGenerationFilePlanPreview(entries)
  };
}

export function summarizeProjectGenerationFilePlanPreview(entries: readonly ProjectGenerationFilePlanEntry[]): ProjectGenerationFilePlanSummary {
  const sortedEntries = sortFilePlanEntries(entries);
  const risks = sortedEntries.flatMap((entry) => entry.risks);
  const warnings = [
    ...sortedEntries.flatMap((entry) => entry.warnings),
    "Project generation file plan preview is descriptive only; no files, scaffolds, builder agents, runtime routing, or mutation expansion are enabled."
  ];
  const recommendations = [
    ...sortedEntries.flatMap((entry) => entry.recommendations),
    "Require separate human-approved design previews before any future file plan can create or write files."
  ];
  return {
    totalPlannedFiles: sortedEntries.length,
    approvalRequiredCount: sortedEntries.filter((entry) => entry.requiresApproval).length,
    blockedCount: findBlockedFilePlanEntries(sortedEntries).length,
    noWriteCount: sortedEntries.filter((entry) => entry.mutationPolicy === "no-write").length,
    safePatchOnlyCount: sortedEntries.filter((entry) => entry.mutationPolicy === "safe-patch-only").length,
    manualApprovalRequiredCount: sortedEntries.filter((entry) => entry.mutationPolicy === "manual-approval-required").length,
    readonly: sortedEntries.length > 0 && sortedEntries.every((entry) => entry.readonly === true),
    previewOnly: sortedEntries.length > 0 && sortedEntries.every((entry) => entry.previewOnly === true),
    risks: normalizeWarnings(risks),
    warnings: normalizeWarnings(warnings),
    recommendations: normalizeWarnings(recommendations),
    completeness: calculateProjectGenerationFilePlanCompleteness(sortedEntries)
  };
}

export function calculateProjectGenerationFilePlanCompleteness(entries: readonly ProjectGenerationFilePlanEntry[]): ProjectGenerationFilePlanCompleteness {
  if (entries.length === 0) {
    return { score: 0, level: "incomplete", reason: "No file plan entries were provided." };
  }
  if (entries.some((entry) => entry.generationStatus === "blocked" || entry.mutationPolicy === "blocked")) {
    return { score: 0, level: "incomplete", reason: "One or more file plan entries are blocked." };
  }
  const total = entries.reduce((sum, entry) => sum + filePlanStatusScore(entry.generationStatus), 0);
  const score = Math.round((total / entries.length) * 10);
  return {
    score,
    level: score >= 90 ? "ready-for-design" : score >= 75 ? "review-ready" : score >= 40 ? "partial" : "incomplete",
    reason: "Advisory file plan completeness score computed from deterministic preview-only entry statuses."
  };
}

export function createFilePlanEntry(input: {
  plannedPath: string;
  fileRole: ProjectGenerationFileRole;
  fileType: ProjectGenerationFileType;
  generationStatus: ProjectGenerationFilePlanStatus;
  mutationPolicy: ProjectGenerationFileMutationPolicy;
  requiresApproval: boolean;
  dependsOn?: readonly string[];
  risks?: readonly string[];
  warnings?: readonly string[];
  recommendations?: readonly string[];
}): ProjectGenerationFilePlanEntry {
  return {
    plannedPath: input.plannedPath,
    fileRole: input.fileRole,
    fileType: input.fileType,
    generationStatus: input.generationStatus,
    mutationPolicy: input.mutationPolicy,
    requiresApproval: input.requiresApproval,
    dependsOn: sortDeterministically(input.dependsOn ?? [], (value) => value),
    risks: normalizeWarnings(input.risks ?? []),
    warnings: normalizeWarnings(input.warnings ?? []),
    recommendations: normalizeWarnings(input.recommendations ?? []),
    readonly: true,
    previewOnly: true
  };
}

export function createDefaultProjectGenerationFilePlanEntries(): ProjectGenerationFilePlanEntry[] {
  return [
    createFilePlanEntry({ plannedPath: "README.md", fileRole: "documentation", fileType: "markdown", generationStatus: "preview-only", mutationPolicy: "no-write", requiresApproval: false, recommendations: ["Keep documentation preview stdout-only until file writing is separately approved."] }),
    createFilePlanEntry({ plannedPath: "package.json", fileRole: "metadata", fileType: "json", generationStatus: "requires-approval", mutationPolicy: "manual-approval-required", requiresApproval: true, risks: ["Package metadata changes require separate dependency and lockfile review."], warnings: ["No package metadata is written by this preview."] }),
    createFilePlanEntry({ plannedPath: "src/index.ts", fileRole: "entrypoint", fileType: "typescript", generationStatus: "planned", mutationPolicy: "safe-patch-only", requiresApproval: true, dependsOn: ["src/app.ts"], risks: ["Entrypoint creation would be file creation if implemented."], warnings: ["Entrypoint path is descriptive only."] }),
    createFilePlanEntry({ plannedPath: "src/app.ts", fileRole: "source", fileType: "typescript", generationStatus: "planned", mutationPolicy: "safe-patch-only", requiresApproval: true, risks: ["Source file planning must preserve single-file mutation boundaries."], warnings: ["No source file is created by this preview."] }),
    createFilePlanEntry({ plannedPath: "src/app.test.ts", fileRole: "test", fileType: "test", generationStatus: "planned", mutationPolicy: "safe-patch-only", requiresApproval: true, dependsOn: ["src/app.ts"], recommendations: ["Keep test plan validation deterministic and manually reviewable."] }),
    createFilePlanEntry({ plannedPath: "tsconfig.json", fileRole: "config", fileType: "json", generationStatus: "requires-approval", mutationPolicy: "manual-approval-required", requiresApproval: true, risks: ["Configuration files can alter build behavior and require human review."], warnings: ["No config file is written by this preview."] }),
    createFilePlanEntry({ plannedPath: "scripts/validate.js", fileRole: "script", fileType: "script", generationStatus: "not-started", mutationPolicy: "no-write", requiresApproval: true, risks: ["Script generation requires separate safety review."], warnings: ["No script is created by this preview."] })
  ];
}

export function sortFilePlanEntries(entries: readonly ProjectGenerationFilePlanEntry[]): ProjectGenerationFilePlanEntry[] {
  return sortDeterministically(entries, (entry) => [entry.plannedPath, entry.fileRole, entry.fileType].join("|"));
}

export function findFilePlanEntriesByRole(entries: readonly ProjectGenerationFilePlanEntry[], role: ProjectGenerationFileRole): ProjectGenerationFilePlanEntry[] {
  return sortFilePlanEntries(entries).filter((entry) => entry.fileRole === role);
}

export function findFilePlanEntriesByType(entries: readonly ProjectGenerationFilePlanEntry[], fileType: ProjectGenerationFileType): ProjectGenerationFilePlanEntry[] {
  return sortFilePlanEntries(entries).filter((entry) => entry.fileType === fileType);
}

export function findApprovalRequiredFilePlanEntries(entries: readonly ProjectGenerationFilePlanEntry[]): ProjectGenerationFilePlanEntry[] {
  return sortFilePlanEntries(entries).filter((entry) => entry.requiresApproval);
}

export function findBlockedFilePlanEntries(entries: readonly ProjectGenerationFilePlanEntry[]): ProjectGenerationFilePlanEntry[] {
  return sortFilePlanEntries(entries).filter((entry) => entry.generationStatus === "blocked" || entry.mutationPolicy === "blocked");
}

function filePlanStatusScore(status: ProjectGenerationFilePlanStatus): number {
  if (status === "planned") return 9;
  if (status === "preview-only") return 8;
  if (status === "requires-approval") return 6;
  if (status === "not-started") return 4;
  return 0;
}
