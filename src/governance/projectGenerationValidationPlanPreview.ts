import type { GovernanceMetadata } from "./governanceMetadata.js";
import { normalizeWarnings, sortDeterministically } from "./utils/governanceUtils.js";

export type ProjectGenerationValidationCheckType =
  | "typecheck"
  | "lint"
  | "test"
  | "build"
  | "runtime-smoke"
  | "security-review"
  | "governance-review"
  | "manual-review";

export type ProjectGenerationValidationExecutionPolicy =
  | "no-execute"
  | "manual-approval-required"
  | "preview-only"
  | "blocked";

export type ProjectGenerationValidationRiskLevel =
  | "low"
  | "medium"
  | "high"
  | "critical";

export type ProjectGenerationValidationPlanCompletenessLevel =
  | "incomplete"
  | "partial"
  | "review-ready"
  | "ready-for-design";

export type ProjectGenerationValidationPlanCompleteness = {
  score: number;
  level: ProjectGenerationValidationPlanCompletenessLevel;
  reason: string;
};

export type ProjectGenerationValidationPlanCheck = {
  checkId: string;
  checkType: ProjectGenerationValidationCheckType;
  commandPreview: string;
  purpose: string;
  requiredBy: string[];
  executionPolicy: ProjectGenerationValidationExecutionPolicy;
  riskLevel: ProjectGenerationValidationRiskLevel;
  requiresApproval: boolean;
  blockedReason: string | null;
  expectedSignal: string;
  warnings: string[];
  recommendations: string[];
  readonly: boolean;
  previewOnly: boolean;
};

export type ProjectGenerationValidationPlanSummary = {
  totalChecks: number;
  approvalRequiredCount: number;
  blockedCount: number;
  noExecuteCount: number;
  manualApprovalRequiredCount: number;
  previewOnlyCount: number;
  riskDistribution: { key: ProjectGenerationValidationRiskLevel; totalChecks: number }[];
  readonly: boolean;
  previewOnly: boolean;
  warnings: string[];
  recommendations: string[];
  completeness: ProjectGenerationValidationPlanCompleteness;
};

export type ProjectGenerationValidationPlanPreview = {
  schemaVersion: 1;
  title: string;
  metadata: GovernanceMetadata;
  readonly: true;
  previewOnly: true;
  validationPlanPreviewOnly: true;
  stdoutOnly: true;
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
  checks: ProjectGenerationValidationPlanCheck[];
  summary: ProjectGenerationValidationPlanSummary;
};

export function createProjectGenerationValidationPlanPreview(input: {
  title: string;
  metadata: GovernanceMetadata;
  checks?: readonly ProjectGenerationValidationPlanCheck[];
}): ProjectGenerationValidationPlanPreview {
  const checks = sortValidationPlanChecks(input.checks ?? createDefaultProjectGenerationValidationPlanChecks());
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
    validationPlanPreviewOnly: true,
    stdoutOnly: true,
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
    checks,
    summary: summarizeProjectGenerationValidationPlanPreview(checks)
  };
}

export function summarizeProjectGenerationValidationPlanPreview(checks: readonly ProjectGenerationValidationPlanCheck[]): ProjectGenerationValidationPlanSummary {
  const sortedChecks = sortValidationPlanChecks(checks);
  const warnings = [
    ...sortedChecks.flatMap((check) => check.warnings),
    "Project generation validation plan preview is descriptive only; no generated-project validation commands are executed."
  ];
  const recommendations = [
    ...sortedChecks.flatMap((check) => check.recommendations),
    "Require separate human-approved validation execution design before any future generated-project validation workflow."
  ];
  return {
    totalChecks: sortedChecks.length,
    approvalRequiredCount: sortedChecks.filter((check) => check.requiresApproval).length,
    blockedCount: findBlockedValidationPlanChecks(sortedChecks).length,
    noExecuteCount: sortedChecks.filter((check) => check.executionPolicy === "no-execute").length,
    manualApprovalRequiredCount: sortedChecks.filter((check) => check.executionPolicy === "manual-approval-required").length,
    previewOnlyCount: sortedChecks.filter((check) => check.executionPolicy === "preview-only").length,
    riskDistribution: summarizeRiskDistribution(sortedChecks),
    readonly: sortedChecks.length > 0 && sortedChecks.every((check) => check.readonly === true),
    previewOnly: sortedChecks.length > 0 && sortedChecks.every((check) => check.previewOnly === true),
    warnings: normalizeWarnings(warnings),
    recommendations: normalizeWarnings(recommendations),
    completeness: calculateProjectGenerationValidationPlanCompleteness(sortedChecks)
  };
}

export function calculateProjectGenerationValidationPlanCompleteness(checks: readonly ProjectGenerationValidationPlanCheck[]): ProjectGenerationValidationPlanCompleteness {
  if (checks.length === 0) {
    return { score: 0, level: "incomplete", reason: "No validation plan checks were provided." };
  }
  if (checks.some((check) => check.executionPolicy === "blocked" || check.blockedReason !== null)) {
    return { score: 0, level: "incomplete", reason: "One or more validation plan checks are blocked." };
  }
  const total = checks.reduce((sum, check) => sum + validationExecutionPolicyScore(check.executionPolicy), 0);
  const score = Math.round((total / checks.length) * 10);
  return {
    score,
    level: score >= 90 ? "ready-for-design" : score >= 75 ? "review-ready" : score >= 40 ? "partial" : "incomplete",
    reason: "Advisory validation plan completeness score computed from deterministic preview-only execution policies."
  };
}

export function createValidationPlanCheck(input: {
  checkId: string;
  checkType: ProjectGenerationValidationCheckType;
  commandPreview: string;
  purpose: string;
  requiredBy: readonly string[];
  executionPolicy: ProjectGenerationValidationExecutionPolicy;
  riskLevel: ProjectGenerationValidationRiskLevel;
  requiresApproval: boolean;
  expectedSignal: string;
  blockedReason?: string | null;
  warnings?: readonly string[];
  recommendations?: readonly string[];
}): ProjectGenerationValidationPlanCheck {
  return {
    checkId: input.checkId,
    checkType: input.checkType,
    commandPreview: input.commandPreview,
    purpose: input.purpose,
    requiredBy: sortDeterministically(input.requiredBy, (value) => value),
    executionPolicy: input.executionPolicy,
    riskLevel: input.riskLevel,
    requiresApproval: input.requiresApproval,
    blockedReason: input.blockedReason ?? null,
    expectedSignal: input.expectedSignal,
    warnings: normalizeWarnings(input.warnings ?? []),
    recommendations: normalizeWarnings(input.recommendations ?? []),
    readonly: true,
    previewOnly: true
  };
}

export function createDefaultProjectGenerationValidationPlanChecks(): ProjectGenerationValidationPlanCheck[] {
  return [
    createValidationPlanCheck({ checkId: "build-preview", checkType: "build", commandPreview: "npm run build", purpose: "Future build validation preview.", requiredBy: ["architecture", "dependencyPlan"], executionPolicy: "manual-approval-required", riskLevel: "medium", requiresApproval: true, expectedSignal: "Build completes after explicit approval.", warnings: ["Build commands are not executed by this preview."] }),
    createValidationPlanCheck({ checkId: "governance-review-preview", checkType: "governance-review", commandPreview: "governance review", purpose: "Future governance validation preview.", requiredBy: ["governancePlan"], executionPolicy: "no-execute", riskLevel: "high", requiresApproval: true, expectedSignal: "Governance review remains preview-only.", warnings: ["Governance review execution requires separate design."] }),
    createValidationPlanCheck({ checkId: "lint-preview", checkType: "lint", commandPreview: "npm run lint", purpose: "Future lint validation preview.", requiredBy: ["filePlan", "dependencyPlan"], executionPolicy: "preview-only", riskLevel: "low", requiresApproval: false, expectedSignal: "Lint command is documented but not executed.", recommendations: ["Keep lint validation planning advisory until generated-project execution exists."] }),
    createValidationPlanCheck({ checkId: "manual-review-preview", checkType: "manual-review", commandPreview: "human review checklist", purpose: "Future human validation review preview.", requiredBy: ["humanApprovalPlan"], executionPolicy: "no-execute", riskLevel: "high", requiresApproval: true, expectedSignal: "Human review checklist remains descriptive.", warnings: ["Human approval must precede any future execution workflow."] }),
    createValidationPlanCheck({ checkId: "runtime-smoke-preview", checkType: "runtime-smoke", commandPreview: "npm run smoke", purpose: "Future runtime smoke validation preview.", requiredBy: ["validationPlan"], executionPolicy: "manual-approval-required", riskLevel: "critical", requiresApproval: true, expectedSignal: "Runtime smoke validation requires separate runtime safety review.", warnings: ["Runtime smoke commands are not executed by this preview."] }),
    createValidationPlanCheck({ checkId: "security-review-preview", checkType: "security-review", commandPreview: "security review checklist", purpose: "Future security review preview.", requiredBy: ["riskPlan"], executionPolicy: "no-execute", riskLevel: "critical", requiresApproval: true, expectedSignal: "Security review remains manual and descriptive.", warnings: ["Security review cannot be automated by this preview."] }),
    createValidationPlanCheck({ checkId: "test-preview", checkType: "test", commandPreview: "npm test", purpose: "Future test validation preview.", requiredBy: ["validationPlan"], executionPolicy: "manual-approval-required", riskLevel: "medium", requiresApproval: true, expectedSignal: "Tests run only after explicit approval in a future design.", warnings: ["Test commands are not executed by this preview."] }),
    createValidationPlanCheck({ checkId: "typecheck-preview", checkType: "typecheck", commandPreview: "npm run typecheck", purpose: "Future typecheck validation preview.", requiredBy: ["architecture", "filePlan"], executionPolicy: "manual-approval-required", riskLevel: "medium", requiresApproval: true, expectedSignal: "Typecheck command remains planned until generated-project execution is approved.", warnings: ["Typecheck commands are not executed by this preview."] })
  ];
}

export function sortValidationPlanChecks(checks: readonly ProjectGenerationValidationPlanCheck[]): ProjectGenerationValidationPlanCheck[] {
  return sortDeterministically(checks, (check) => [check.checkId, check.checkType, check.riskLevel].join("|"));
}

export function findValidationPlanChecksByType(checks: readonly ProjectGenerationValidationPlanCheck[], checkType: ProjectGenerationValidationCheckType): ProjectGenerationValidationPlanCheck[] {
  return sortValidationPlanChecks(checks).filter((check) => check.checkType === checkType);
}

export function findValidationPlanChecksByRiskLevel(checks: readonly ProjectGenerationValidationPlanCheck[], riskLevel: ProjectGenerationValidationRiskLevel): ProjectGenerationValidationPlanCheck[] {
  return sortValidationPlanChecks(checks).filter((check) => check.riskLevel === riskLevel);
}

export function findApprovalRequiredValidationPlanChecks(checks: readonly ProjectGenerationValidationPlanCheck[]): ProjectGenerationValidationPlanCheck[] {
  return sortValidationPlanChecks(checks).filter((check) => check.requiresApproval);
}

export function findBlockedValidationPlanChecks(checks: readonly ProjectGenerationValidationPlanCheck[]): ProjectGenerationValidationPlanCheck[] {
  return sortValidationPlanChecks(checks).filter((check) => check.executionPolicy === "blocked" || check.blockedReason !== null);
}

function summarizeRiskDistribution(checks: readonly ProjectGenerationValidationPlanCheck[]): { key: ProjectGenerationValidationRiskLevel; totalChecks: number }[] {
  const counts = new Map<ProjectGenerationValidationRiskLevel, number>();
  for (const check of checks) {
    counts.set(check.riskLevel, (counts.get(check.riskLevel) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([key, totalChecks]) => ({ key, totalChecks }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

function validationExecutionPolicyScore(policy: ProjectGenerationValidationExecutionPolicy): number {
  if (policy === "preview-only") return 8;
  if (policy === "no-execute") return 8;
  if (policy === "manual-approval-required") return 6;
  return 0;
}
