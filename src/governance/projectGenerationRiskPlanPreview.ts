import type { GovernanceMetadata } from "./governanceMetadata.js";
import { normalizeWarnings, sortDeterministically } from "./utils/governanceUtils.js";

export type ProjectGenerationRiskType =
  | "architecture"
  | "file-plan"
  | "dependency"
  | "validation"
  | "approval"
  | "safe-patch-boundary"
  | "runtime-activation"
  | "human-review"
  | "scope-creep";

export type ProjectGenerationAffectedPlan =
  | "blueprint"
  | "file-plan"
  | "dependency-plan"
  | "validation-plan"
  | "approval-plan"
  | "governance-plan"
  | "runtime-boundary";

export type ProjectGenerationRiskSeverity =
  | "low"
  | "medium"
  | "high"
  | "critical";

export type ProjectGenerationRiskLikelihood =
  | "unlikely"
  | "possible"
  | "likely"
  | "expected";

export type ProjectGenerationRiskStatus =
  | "identified"
  | "mitigated-preview-only"
  | "requires-review"
  | "blocked";

export type ProjectGenerationRiskMitigationPolicy =
  | "preview-only"
  | "manual-review-required"
  | "blocked"
  | "not-applicable";

export type ProjectGenerationRiskExposureLevel =
  | "low"
  | "medium"
  | "high"
  | "critical";

export type ProjectGenerationRiskExposure = {
  score: number;
  level: ProjectGenerationRiskExposureLevel;
  reason: string;
};

export type ProjectGenerationRiskEntry = {
  riskId: string;
  riskType: ProjectGenerationRiskType;
  title: string;
  description: string;
  affectedPlan: ProjectGenerationAffectedPlan;
  severity: ProjectGenerationRiskSeverity;
  likelihood: ProjectGenerationRiskLikelihood;
  riskStatus: ProjectGenerationRiskStatus;
  mitigationPolicy: ProjectGenerationRiskMitigationPolicy;
  requiresHumanApproval: boolean;
  blockedReason: string | null;
  warnings: string[];
  recommendations: string[];
  readonly: boolean;
  previewOnly: boolean;
};

export type ProjectGenerationRiskPlanSummary = {
  totalRisks: number;
  blockedCount: number;
  humanApprovalRequiredCount: number;
  severityDistribution: { key: ProjectGenerationRiskSeverity; totalRisks: number }[];
  affectedPlanDistribution: { key: ProjectGenerationAffectedPlan; totalRisks: number }[];
  readonly: boolean;
  previewOnly: boolean;
  warnings: string[];
  recommendations: string[];
  exposure: ProjectGenerationRiskExposure;
};

export type ProjectGenerationRiskPlanPreview = {
  schemaVersion: 1;
  title: string;
  metadata: GovernanceMetadata;
  readonly: true;
  previewOnly: true;
  riskPlanPreviewOnly: true;
  stdoutOnly: true;
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
  risks: ProjectGenerationRiskEntry[];
  summary: ProjectGenerationRiskPlanSummary;
};

export function createProjectGenerationRiskPlanPreview(input: {
  title: string;
  metadata: GovernanceMetadata;
  risks?: readonly ProjectGenerationRiskEntry[];
}): ProjectGenerationRiskPlanPreview {
  const risks = sortRiskEntries(input.risks ?? createDefaultProjectGenerationRiskEntries());
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
    riskPlanPreviewOnly: true,
    stdoutOnly: true,
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
    risks,
    summary: summarizeProjectGenerationRiskPlanPreview(risks)
  };
}

export function summarizeProjectGenerationRiskPlanPreview(risks: readonly ProjectGenerationRiskEntry[]): ProjectGenerationRiskPlanSummary {
  const sortedRisks = sortRiskEntries(risks);
  const warnings = [
    ...sortedRisks.flatMap((risk) => risk.warnings),
    "Project generation risk plan preview is descriptive only; no risks are enforced and no mitigations are executed."
  ];
  const recommendations = [
    ...sortedRisks.flatMap((risk) => risk.recommendations),
    "Require separate human-approved risk review before any future project generation execution or risk enforcement workflow."
  ];
  return {
    totalRisks: sortedRisks.length,
    blockedCount: findBlockedRiskEntries(sortedRisks).length,
    humanApprovalRequiredCount: findHumanApprovalRequiredRiskEntries(sortedRisks).length,
    severityDistribution: summarizeSeverityDistribution(sortedRisks),
    affectedPlanDistribution: summarizeAffectedPlanDistribution(sortedRisks),
    readonly: sortedRisks.length > 0 && sortedRisks.every((risk) => risk.readonly === true),
    previewOnly: sortedRisks.length > 0 && sortedRisks.every((risk) => risk.previewOnly === true),
    warnings: normalizeWarnings(warnings),
    recommendations: normalizeWarnings(recommendations),
    exposure: calculateProjectGenerationRiskExposure(sortedRisks)
  };
}

export function calculateProjectGenerationRiskExposure(risks: readonly ProjectGenerationRiskEntry[]): ProjectGenerationRiskExposure {
  if (risks.length === 0) {
    return { score: 0, level: "low", reason: "No risk entries were provided." };
  }
  if (risks.some((risk) => risk.riskStatus === "blocked" || risk.mitigationPolicy === "blocked" || risk.blockedReason !== null)) {
    return { score: 100, level: "critical", reason: "One or more risk entries are blocked." };
  }
  const total = risks.reduce((sum, risk) => sum + riskExposureScore(risk.severity, risk.likelihood), 0);
  const score = Math.round(total / risks.length);
  return {
    score,
    level: score >= 75 ? "critical" : score >= 50 ? "high" : score >= 25 ? "medium" : "low",
    reason: "Advisory risk exposure score computed from deterministic severity and likelihood values."
  };
}

export function createRiskEntry(input: {
  riskId: string;
  riskType: ProjectGenerationRiskType;
  title: string;
  description: string;
  affectedPlan: ProjectGenerationAffectedPlan;
  severity: ProjectGenerationRiskSeverity;
  likelihood: ProjectGenerationRiskLikelihood;
  riskStatus: ProjectGenerationRiskStatus;
  mitigationPolicy: ProjectGenerationRiskMitigationPolicy;
  requiresHumanApproval: boolean;
  blockedReason?: string | null;
  warnings?: readonly string[];
  recommendations?: readonly string[];
}): ProjectGenerationRiskEntry {
  return {
    riskId: input.riskId,
    riskType: input.riskType,
    title: input.title,
    description: input.description,
    affectedPlan: input.affectedPlan,
    severity: input.severity,
    likelihood: input.likelihood,
    riskStatus: input.riskStatus,
    mitigationPolicy: input.mitigationPolicy,
    requiresHumanApproval: input.requiresHumanApproval,
    blockedReason: input.blockedReason ?? null,
    warnings: normalizeWarnings(input.warnings ?? []),
    recommendations: normalizeWarnings(input.recommendations ?? []),
    readonly: true,
    previewOnly: true
  };
}

export function createDefaultProjectGenerationRiskEntries(): ProjectGenerationRiskEntry[] {
  return [
    createRiskEntry({ riskId: "approval-risk-preview", riskType: "approval", title: "Approval workflow risk preview", description: "Future approval workflows may be incomplete without explicit human review.", affectedPlan: "approval-plan", severity: "high", likelihood: "likely", riskStatus: "requires-review", mitigationPolicy: "manual-review-required", requiresHumanApproval: true, warnings: ["Approval risks are not enforced by this preview."] }),
    createRiskEntry({ riskId: "blueprint-risk-preview", riskType: "architecture", title: "Blueprint completeness risk preview", description: "Future project blueprints may omit implementation constraints.", affectedPlan: "blueprint", severity: "medium", likelihood: "possible", riskStatus: "identified", mitigationPolicy: "preview-only", requiresHumanApproval: false, recommendations: ["Keep blueprint risks advisory until generation design exists."] }),
    createRiskEntry({ riskId: "dependency-risk-preview", riskType: "dependency", title: "Dependency introduction risk preview", description: "Future dependency plans may introduce package, security, or behavior risk.", affectedPlan: "dependency-plan", severity: "critical", likelihood: "possible", riskStatus: "requires-review", mitigationPolicy: "manual-review-required", requiresHumanApproval: true, warnings: ["Dependency risks require human review before installation exists."] }),
    createRiskEntry({ riskId: "file-plan-risk-preview", riskType: "file-plan", title: "File plan mutation risk preview", description: "Future file plans may exceed the single-file mutation boundary.", affectedPlan: "file-plan", severity: "high", likelihood: "possible", riskStatus: "requires-review", mitigationPolicy: "manual-review-required", requiresHumanApproval: true, warnings: ["File creation and scaffolding remain disabled."] }),
    createRiskEntry({ riskId: "human-review-risk-preview", riskType: "human-review", title: "Human review coverage risk preview", description: "Future generation plans require explicit human approval checkpoints.", affectedPlan: "governance-plan", severity: "high", likelihood: "likely", riskStatus: "requires-review", mitigationPolicy: "manual-review-required", requiresHumanApproval: true, warnings: ["Human review is described but not executed."] }),
    createRiskEntry({ riskId: "runtime-activation-risk-preview", riskType: "runtime-activation", title: "Runtime activation boundary risk preview", description: "Future project generation must not imply runtime activation.", affectedPlan: "runtime-boundary", severity: "critical", likelihood: "expected", riskStatus: "requires-review", mitigationPolicy: "manual-review-required", requiresHumanApproval: true, warnings: ["Runtime activation remains disabled."] }),
    createRiskEntry({ riskId: "safe-patch-boundary-risk-preview", riskType: "safe-patch-boundary", title: "Safe Patch boundary risk preview", description: "Future project generation plans must preserve Safe Patch Engine exclusivity.", affectedPlan: "governance-plan", severity: "critical", likelihood: "possible", riskStatus: "requires-review", mitigationPolicy: "manual-review-required", requiresHumanApproval: true, warnings: ["Safe Patch Engine remains the only mutation layer."] }),
    createRiskEntry({ riskId: "scope-creep-risk-preview", riskType: "scope-creep", title: "Scope creep risk preview", description: "Future project generation planning can drift into execution without strict boundaries.", affectedPlan: "blueprint", severity: "medium", likelihood: "likely", riskStatus: "identified", mitigationPolicy: "preview-only", requiresHumanApproval: true, warnings: ["Project generation remains disabled."] }),
    createRiskEntry({ riskId: "validation-risk-preview", riskType: "validation", title: "Validation execution risk preview", description: "Future validation plans may imply command execution before generated-project runtime exists.", affectedPlan: "validation-plan", severity: "high", likelihood: "possible", riskStatus: "requires-review", mitigationPolicy: "manual-review-required", requiresHumanApproval: true, warnings: ["Validation commands are not executed by this preview."] })
  ];
}

export function sortRiskEntries(risks: readonly ProjectGenerationRiskEntry[]): ProjectGenerationRiskEntry[] {
  return sortDeterministically(risks, (risk) => [risk.riskId, risk.riskType, risk.affectedPlan].join("|"));
}

export function findRiskEntriesByType(risks: readonly ProjectGenerationRiskEntry[], riskType: ProjectGenerationRiskType): ProjectGenerationRiskEntry[] {
  return sortRiskEntries(risks).filter((risk) => risk.riskType === riskType);
}

export function findRiskEntriesBySeverity(risks: readonly ProjectGenerationRiskEntry[], severity: ProjectGenerationRiskSeverity): ProjectGenerationRiskEntry[] {
  return sortRiskEntries(risks).filter((risk) => risk.severity === severity);
}

export function findRiskEntriesByAffectedPlan(risks: readonly ProjectGenerationRiskEntry[], affectedPlan: ProjectGenerationAffectedPlan): ProjectGenerationRiskEntry[] {
  return sortRiskEntries(risks).filter((risk) => risk.affectedPlan === affectedPlan);
}

export function findBlockedRiskEntries(risks: readonly ProjectGenerationRiskEntry[]): ProjectGenerationRiskEntry[] {
  return sortRiskEntries(risks).filter((risk) => risk.riskStatus === "blocked" || risk.mitigationPolicy === "blocked" || risk.blockedReason !== null);
}

export function findHumanApprovalRequiredRiskEntries(risks: readonly ProjectGenerationRiskEntry[]): ProjectGenerationRiskEntry[] {
  return sortRiskEntries(risks).filter((risk) => risk.requiresHumanApproval);
}

function summarizeSeverityDistribution(risks: readonly ProjectGenerationRiskEntry[]): { key: ProjectGenerationRiskSeverity; totalRisks: number }[] {
  const counts = new Map<ProjectGenerationRiskSeverity, number>();
  for (const risk of risks) {
    counts.set(risk.severity, (counts.get(risk.severity) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([key, totalRisks]) => ({ key, totalRisks }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

function summarizeAffectedPlanDistribution(risks: readonly ProjectGenerationRiskEntry[]): { key: ProjectGenerationAffectedPlan; totalRisks: number }[] {
  const counts = new Map<ProjectGenerationAffectedPlan, number>();
  for (const risk of risks) {
    counts.set(risk.affectedPlan, (counts.get(risk.affectedPlan) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([key, totalRisks]) => ({ key, totalRisks }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

function riskExposureScore(severity: ProjectGenerationRiskSeverity, likelihood: ProjectGenerationRiskLikelihood): number {
  return severityWeight(severity) * likelihoodWeight(likelihood);
}

function severityWeight(severity: ProjectGenerationRiskSeverity): number {
  if (severity === "critical") return 90;
  if (severity === "high") return 60;
  if (severity === "medium") return 30;
  return 10;
}

function likelihoodWeight(likelihood: ProjectGenerationRiskLikelihood): number {
  if (likelihood === "expected") return 1;
  if (likelihood === "likely") return 0.75;
  if (likelihood === "possible") return 0.5;
  return 0.25;
}
