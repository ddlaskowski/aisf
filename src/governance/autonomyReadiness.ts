import fs from "fs-extra";
import path from "node:path";

import {
  buildGovernanceRuntimeActivationGatesPreview,
  type GovernanceRuntimeActivationGatesPreview
} from "./runtimeActivationGatesPreview.js";

export type GovernanceAutonomyReadinessCheck = {
  id: string;
  key: string;
  passed: boolean;
  reason: string;
};

export type GovernanceAutonomyBlocker = {
  id: string;
  key: string;
  reason: string;
};

export type GovernanceAutonomyHumanReviewGate = {
  id: string;
  key: string;
  required: true;
  reason: string;
};

export type GovernanceAutonomyForbiddenCapability = {
  id: string;
  key: string;
  reason: string;
};

export type GovernanceAutonomyReadiness = {
  schemaVersion: 1;
  readinessStatus: "not-ready" | "ready-for-design-review" | "blocked";
  autonomyStage: "disabled" | "readiness-preview";
  sourceActivationGatesStatus: "not-created" | "created" | "blocked";
  autonomyEnabled: false;
  autonomousActionsAllowed: false;
  autonomyApplied: false;
  autonomyEnforced: false;
  activationGatePassed: false;
  runtimeActivationEnabled: false;
  policyActivated: false;
  guardedActivationEnabled: false;
  activationEnforced: false;
  governanceBypassAllowed: false;
  applied: false;
  enforced: false;
  policyRuntimeMode: "preview-only";
  runtimeBehaviorChanged: false;
  governanceDecisionsChanged: false;
  repairOrchestrationChanged: false;
  safePatchEngineOnly: true;
  readinessChecks: GovernanceAutonomyReadinessCheck[];
  blockers: GovernanceAutonomyBlocker[];
  humanReviewGates: GovernanceAutonomyHumanReviewGate[];
  permanentlyForbiddenCapabilities: GovernanceAutonomyForbiddenCapability[];
  summary: {
    totalReadinessChecks: number;
    passedReadinessChecks: number;
    failedReadinessChecks: number;
    blockerCount: number;
    humanReviewGateCount: number;
    permanentlyForbiddenCapabilityCount: number;
    structurallyReadyForDesignReview: boolean;
  };
  warnings: string[];
  recommendedNextStage:
    | "continue-governance-hardening"
    | "prepare-controlled-autonomy-design-review"
    | "blocked";
};

const ARTIFACT_JSON_PATH = ".factory/governance/autonomy-readiness.json";
const ARTIFACT_MARKDOWN_PATH = ".factory/governance/autonomy-readiness.md";

const HUMAN_REVIEW_GATE_DEFINITIONS: Array<Omit<GovernanceAutonomyHumanReviewGate, "id" | "required">> = [
  {
    key: "allow-github-pr-comment-publishing",
    reason: "Publishing GitHub PR comments requires future human review and explicit integration design."
  },
  {
    key: "change-exception-approval-rules",
    reason: "Changing exception approval rules requires future human review."
  },
  {
    key: "change-mutation-boundaries",
    reason: "Changing mutation boundaries requires future human review."
  },
  {
    key: "change-repair-orchestration-behavior",
    reason: "Changing repair orchestration behavior requires future human review."
  },
  {
    key: "change-safe-patch-engine-restrictions",
    reason: "Changing Safe Patch Engine restrictions requires future human review."
  },
  {
    key: "enable-ci-build-blocking-governance",
    reason: "CI/build-blocking governance requires future human review."
  },
  {
    key: "enable-controlled-autonomy-mode",
    reason: "Any controlled autonomy mode requires future human review."
  },
  {
    key: "enable-policy-enforcement",
    reason: "Policy enforcement requires future human review."
  },
  {
    key: "enable-runtime-activation",
    reason: "Runtime activation requires future human review."
  }
];

const FORBIDDEN_CAPABILITY_DEFINITIONS: Array<Omit<GovernanceAutonomyForbiddenCapability, "id">> = [
  {
    key: "autonomous-execution-without-human-approval-gates",
    reason: "Autonomous execution without human approval gates is permanently forbidden."
  },
  {
    key: "bypassing-safe-patch-engine",
    reason: "Bypassing Safe Patch Engine is permanently forbidden."
  },
  {
    key: "disabling-safety-invariants",
    reason: "Disabling safety invariants is permanently forbidden."
  },
  {
    key: "dynamic-script-execution",
    reason: "Dynamic script execution is permanently forbidden."
  },
  {
    key: "external-governance-execution",
    reason: "External governance execution is permanently forbidden."
  },
  {
    key: "governance-bypass-mechanisms",
    reason: "Governance bypass mechanisms are permanently forbidden."
  },
  {
    key: "ml-vector-db-governance-decisioning",
    reason: "ML/vector DB governance decisioning is permanently forbidden in this readiness layer."
  },
  {
    key: "mutation-scope-expansion",
    reason: "Mutation scope expansion is permanently forbidden."
  },
  {
    key: "plugin-execution",
    reason: "Plugin execution is permanently forbidden."
  },
  {
    key: "runtime-learning-governance",
    reason: "Runtime learning governance is permanently forbidden."
  },
  {
    key: "self-modifying-governance",
    reason: "Self-modifying governance is permanently forbidden."
  },
  {
    key: "uncontrolled-multi-agent-orchestration",
    reason: "Uncontrolled multi-agent orchestration is permanently forbidden."
  }
];

function check(key: string, passed: boolean, reason: string): Omit<GovernanceAutonomyReadinessCheck, "id"> {
  return {
    key,
    passed,
    reason
  };
}

function collectReadinessChecks(source: GovernanceRuntimeActivationGatesPreview): GovernanceAutonomyReadinessCheck[] {
  const runtimeGatesCreated = source.previewStatus === "created";
  const structurallyAcceptable =
    source.activationGateConclusion === "structurally-ready-preview" ||
    source.activationGateConclusion === "warning-preview";
  const checks: Array<Omit<GovernanceAutonomyReadinessCheck, "id">> = [
    check("ci-does-not-fail-builds", source.buildFailedByGovernance === false, "CI governance remains non-build-blocking."),
    check("dynamic-policy-execution-absent", true, "No dynamic policy execution is introduced by readiness analysis."),
    check("exceptions-not-approved", source.exceptionApproved === false, "Exceptions are not approved."),
    check("github-api-not-called", source.githubApiCalled === false, "GitHub API is not called."),
    check("governance-bypass-not-allowed", source.governanceBypassAllowed === false, "Governance bypass is not allowed."),
    check("governance-config-chain-exists", runtimeGatesCreated, "Runtime activation gates preview exists only after the governance config preview chain is represented."),
    check("governance-decisions-unchanged", source.governanceDecisionsChanged === false, "Governance decisions are unchanged."),
    check("governance-not-enforced", source.enforced === false, "Governance is not enforced."),
    check("multi-agent-orchestration-absent", true, "No multi-agent orchestration is introduced by readiness analysis."),
    check("mutation-scope-expansion-absent", true, "No mutation scope expansion is introduced by readiness analysis."),
    check("no-autonomous-actions-enabled", source.autonomyEnabled === false, "No autonomous actions are enabled."),
    check("planner-loops-absent", true, "No planner loops are introduced by readiness analysis."),
    check("plugin-execution-absent", true, "No plugin execution is introduced by readiness analysis."),
    check("policies-not-activated", source.policyActivated === false, "Policies are not activated."),
    check("policy-runtime-preview-only", source.policyRuntimeMode === "preview-only", "Policy runtime remains preview-only."),
    check("profiles-not-applied", source.profileApplied === false, "Profiles are not applied."),
    check("repair-orchestration-unchanged", source.repairOrchestrationChanged === false, "Repair orchestration is unchanged."),
    check("runtime-activation-gates-preview-exists", runtimeGatesCreated, "Runtime activation gates preview exists."),
    check("runtime-behavior-unchanged", source.runtimeBehaviorChanged === false, "Runtime behavior is unchanged."),
    check("runtime-gate-conclusion-acceptable", structurallyAcceptable, `Runtime activation gate conclusion is ${source.activationGateConclusion}.`),
    check("runtime-learning-absent", true, "No runtime learning is introduced by readiness analysis."),
    check("safe-patch-engine-sole-mutation-layer", source.safePatchEngineOnly === true, "Safe Patch Engine remains the sole mutation layer.")
  ];

  return checks
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((item, index) => ({
      id: `gov-autonomy-check-${String(index + 1).padStart(3, "0")}`,
      ...item
    }));
}

function collectBlockers(
  source: GovernanceRuntimeActivationGatesPreview,
  checks: GovernanceAutonomyReadinessCheck[]
): GovernanceAutonomyBlocker[] {
  const blockers: Array<Omit<GovernanceAutonomyBlocker, "id">> = [];

  if (source.previewStatus === "not-created") {
    blockers.push({
      key: "runtime-activation-gates-missing",
      reason: "Runtime activation gates preview is missing."
    });
  }
  if (source.previewStatus === "blocked") {
    blockers.push({
      key: "runtime-activation-gates-blocked",
      reason: "Runtime activation gates preview is blocked."
    });
  }
  if (source.summary.warningStateGates > 0) {
    blockers.push({
      key: "runtime-activation-gates-warning-state",
      reason: "Runtime activation gates preview has warning-state gates that require governance hardening."
    });
  }

  for (const failed of checks.filter((item) => !item.passed)) {
    blockers.push({
      key: `failed-check-${failed.key}`,
      reason: failed.reason
    });
  }

  const unique = new Map<string, Omit<GovernanceAutonomyBlocker, "id">>();
  for (const blocker of blockers) {
    unique.set(blocker.key, blocker);
  }

  return Array.from(unique.values())
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((item, index) => ({
      id: `gov-autonomy-blocker-${String(index + 1).padStart(3, "0")}`,
      ...item
    }));
}

function collectHumanReviewGates(): GovernanceAutonomyHumanReviewGate[] {
  return [...HUMAN_REVIEW_GATE_DEFINITIONS]
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((item, index) => ({
      id: `gov-autonomy-review-gate-${String(index + 1).padStart(3, "0")}`,
      required: true,
      ...item
    }));
}

function collectForbiddenCapabilities(): GovernanceAutonomyForbiddenCapability[] {
  return [...FORBIDDEN_CAPABILITY_DEFINITIONS]
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((item, index) => ({
      id: `gov-autonomy-forbidden-${String(index + 1).padStart(3, "0")}`,
      ...item
    }));
}

function conclusionFor(
  source: GovernanceRuntimeActivationGatesPreview,
  blockers: GovernanceAutonomyBlocker[],
  checks: GovernanceAutonomyReadinessCheck[]
): {
  readinessStatus: GovernanceAutonomyReadiness["readinessStatus"];
  autonomyStage: GovernanceAutonomyReadiness["autonomyStage"];
  recommendedNextStage: GovernanceAutonomyReadiness["recommendedNextStage"];
} {
  if (source.previewStatus === "not-created") {
    return {
      readinessStatus: "not-ready",
      autonomyStage: "disabled",
      recommendedNextStage: "continue-governance-hardening"
    };
  }
  if (source.previewStatus === "blocked") {
    return {
      readinessStatus: "blocked",
      autonomyStage: "disabled",
      recommendedNextStage: "blocked"
    };
  }
  if (source.activationGateConclusion === "warning-preview" || blockers.length > 0 || checks.some((item) => !item.passed)) {
    return {
      readinessStatus: "not-ready",
      autonomyStage: "readiness-preview",
      recommendedNextStage: "continue-governance-hardening"
    };
  }
  return {
    readinessStatus: "ready-for-design-review",
    autonomyStage: "readiness-preview",
    recommendedNextStage: "prepare-controlled-autonomy-design-review"
  };
}

function buildSummary(
  checks: GovernanceAutonomyReadinessCheck[],
  blockers: GovernanceAutonomyBlocker[],
  humanReviewGates: GovernanceAutonomyHumanReviewGate[],
  permanentlyForbiddenCapabilities: GovernanceAutonomyForbiddenCapability[],
  readinessStatus: GovernanceAutonomyReadiness["readinessStatus"]
): GovernanceAutonomyReadiness["summary"] {
  return {
    totalReadinessChecks: checks.length,
    passedReadinessChecks: checks.filter((item) => item.passed).length,
    failedReadinessChecks: checks.filter((item) => !item.passed).length,
    blockerCount: blockers.length,
    humanReviewGateCount: humanReviewGates.length,
    permanentlyForbiddenCapabilityCount: permanentlyForbiddenCapabilities.length,
    structurallyReadyForDesignReview: readinessStatus === "ready-for-design-review"
  };
}

function warningsFor(readinessStatus: GovernanceAutonomyReadiness["readinessStatus"]): string[] {
  const warnings = [
    "Controlled autonomy readiness is analysis-only.",
    "Autonomy remains disabled.",
    "No autonomous actions are allowed.",
    "No governance was enforced.",
    "No runtime activation occurred.",
    "No policy was activated.",
    "Governance bypass is not allowed.",
    "Runtime behavior did not change.",
    "Governance decisions did not change.",
    "Repair orchestration did not change."
  ];
  if (readinessStatus === "not-ready") {
    warnings.unshift("Controlled autonomy readiness requires additional governance hardening.");
  }
  if (readinessStatus === "blocked") {
    warnings.unshift("Controlled autonomy readiness is blocked by upstream governance preview state.");
  }
  if (readinessStatus === "ready-for-design-review") {
    warnings.unshift("Controlled autonomy readiness is ready for future design review only.");
  }
  return warnings;
}

export function buildGovernanceAutonomyReadinessFromActivationGates(
  source: GovernanceRuntimeActivationGatesPreview
): GovernanceAutonomyReadiness {
  const readinessChecks = collectReadinessChecks(source);
  const blockers = collectBlockers(source, readinessChecks);
  const humanReviewGates = collectHumanReviewGates();
  const permanentlyForbiddenCapabilities = collectForbiddenCapabilities();
  const conclusion = conclusionFor(source, blockers, readinessChecks);
  const summary = buildSummary(
    readinessChecks,
    blockers,
    humanReviewGates,
    permanentlyForbiddenCapabilities,
    conclusion.readinessStatus
  );

  return {
    schemaVersion: 1,
    readinessStatus: conclusion.readinessStatus,
    autonomyStage: conclusion.autonomyStage,
    sourceActivationGatesStatus: source.previewStatus,
    autonomyEnabled: false,
    autonomousActionsAllowed: false,
    autonomyApplied: false,
    autonomyEnforced: false,
    activationGatePassed: false,
    runtimeActivationEnabled: false,
    policyActivated: false,
    guardedActivationEnabled: false,
    activationEnforced: false,
    governanceBypassAllowed: false,
    applied: false,
    enforced: false,
    policyRuntimeMode: "preview-only",
    runtimeBehaviorChanged: false,
    governanceDecisionsChanged: false,
    repairOrchestrationChanged: false,
    safePatchEngineOnly: true,
    readinessChecks,
    blockers,
    humanReviewGates,
    permanentlyForbiddenCapabilities,
    summary,
    warnings: warningsFor(conclusion.readinessStatus),
    recommendedNextStage: conclusion.recommendedNextStage
  };
}

export function buildGovernanceAutonomyReadiness(projectRoot: string): GovernanceAutonomyReadiness {
  return buildGovernanceAutonomyReadinessFromActivationGates(buildGovernanceRuntimeActivationGatesPreview(projectRoot));
}

export function renderGovernanceAutonomyReadinessMarkdown(readiness: GovernanceAutonomyReadiness): string {
  const lines = [
    "# AI Software Factory - Controlled Autonomy Readiness",
    "",
    "Readiness status:",
    readiness.readinessStatus,
    "",
    "Autonomy stage:",
    readiness.autonomyStage,
    "",
    "Source activation gates status:",
    readiness.sourceActivationGatesStatus,
    "",
    "Autonomy enabled:",
    String(readiness.autonomyEnabled),
    "",
    "Autonomous actions allowed:",
    String(readiness.autonomousActionsAllowed),
    "",
    "Autonomy applied:",
    String(readiness.autonomyApplied),
    "",
    "Autonomy enforced:",
    String(readiness.autonomyEnforced),
    "",
    "Runtime activation enabled:",
    String(readiness.runtimeActivationEnabled),
    "",
    "Policy activated:",
    String(readiness.policyActivated),
    "",
    "Guarded activation enabled:",
    String(readiness.guardedActivationEnabled),
    "",
    "Activation enforced:",
    String(readiness.activationEnforced),
    "",
    "Governance bypass allowed:",
    String(readiness.governanceBypassAllowed),
    "",
    "Applied:",
    String(readiness.applied),
    "",
    "Enforced:",
    String(readiness.enforced),
    "",
    "Policy runtime mode:",
    readiness.policyRuntimeMode,
    "",
    "Runtime behavior changed:",
    String(readiness.runtimeBehaviorChanged),
    "",
    "Governance decisions changed:",
    String(readiness.governanceDecisionsChanged),
    "",
    "Repair orchestration changed:",
    String(readiness.repairOrchestrationChanged),
    "",
    "Safe Patch Engine only:",
    String(readiness.safePatchEngineOnly),
    "",
    "Total readiness checks:",
    String(readiness.summary.totalReadinessChecks),
    "",
    "Passed readiness checks:",
    String(readiness.summary.passedReadinessChecks),
    "",
    "Failed readiness checks:",
    String(readiness.summary.failedReadinessChecks),
    "",
    "Blocker count:",
    String(readiness.summary.blockerCount),
    "",
    "Human review gate count:",
    String(readiness.summary.humanReviewGateCount),
    "",
    "Permanently forbidden capability count:",
    String(readiness.summary.permanentlyForbiddenCapabilityCount),
    "",
    "Structurally ready for design review:",
    String(readiness.summary.structurallyReadyForDesignReview),
    "",
    "Recommended next stage:",
    readiness.recommendedNextStage,
    "",
    "## Readiness Checks",
    ""
  ];

  for (const item of readiness.readinessChecks) {
    lines.push(`- [${item.passed ? "passed" : "failed"}] ${item.id} ${item.key} - ${item.reason}`);
  }

  lines.push("", "## Blockers", "");
  if (readiness.blockers.length === 0) {
    lines.push("- none");
  } else {
    for (const item of readiness.blockers) {
      lines.push(`- ${item.id} ${item.key} - ${item.reason}`);
    }
  }

  lines.push("", "## Human Review Gates", "");
  for (const item of readiness.humanReviewGates) {
    lines.push(`- ${item.id} ${item.key} - ${item.reason}`);
  }

  lines.push("", "## Permanently Forbidden Capabilities", "");
  for (const item of readiness.permanentlyForbiddenCapabilities) {
    lines.push(`- ${item.id} ${item.key} - ${item.reason}`);
  }

  lines.push("", "## Warnings", "");
  for (const warning of readiness.warnings) {
    lines.push(`- ${warning}`);
  }

  return `${lines.join("\n")}\n`;
}

export function renderGovernanceAutonomyReadinessText(readiness: GovernanceAutonomyReadiness): string {
  return renderGovernanceAutonomyReadinessMarkdown(readiness);
}

export function writeGovernanceAutonomyReadinessArtifacts(
  projectRoot: string,
  readiness: GovernanceAutonomyReadiness
): { jsonPath: string; markdownPath: string } {
  const jsonPath = path.join(projectRoot, ARTIFACT_JSON_PATH);
  const markdownPath = path.join(projectRoot, ARTIFACT_MARKDOWN_PATH);
  fs.ensureDirSync(path.dirname(jsonPath));
  fs.writeFileSync(jsonPath, `${JSON.stringify(readiness, null, 2)}\n`, "utf8");
  fs.writeFileSync(markdownPath, renderGovernanceAutonomyReadinessMarkdown(readiness), "utf8");
  return {
    jsonPath: ARTIFACT_JSON_PATH,
    markdownPath: ARTIFACT_MARKDOWN_PATH
  };
}
