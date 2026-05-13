import fs from "fs-extra";
import path from "node:path";

import {
  buildGovernanceAutonomyReadiness,
  type GovernanceAutonomyReadiness
} from "./autonomyReadiness.js";

export type GovernanceAutonomyDesignReviewSection = {
  id: string;
  title: string;
  category:
    | "governance-readiness"
    | "activation-gates"
    | "policy-runtime"
    | "profile-governance"
    | "repo-boundaries"
    | "attestation"
    | "ci-preview"
    | "pr-preview"
    | "exception-review"
    | "simulation"
    | "activation-candidates"
    | "autonomy-readiness"
    | "safety-invariants"
    | "forbidden-capabilities";
  lines: string[];
};

export type GovernanceAutonomyReviewRequirement = {
  id: string;
  key: string;
  required: true;
  reason: string;
};

export type GovernanceAutonomyForbiddenCapability = {
  id: string;
  key: string;
  permanentlyForbidden: true;
  reason: string;
};

export type GovernanceAutonomySafetyInvariant = {
  id: string;
  key: string;
  preserved: boolean;
  reason: string;
};

export type GovernanceAutonomyDesignReviewPack = {
  schemaVersion: 1;
  reviewPackStatus: "not-created" | "created" | "blocked";
  sourceAutonomyReadinessStatus: "not-created" | "created" | "blocked";
  reviewPackConclusion: "review-not-ready" | "review-ready-preview" | "blocked-preview" | "source-missing";
  designReviewApproved: false;
  designReviewApplied: false;
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
  sections: GovernanceAutonomyDesignReviewSection[];
  reviewRequirements: GovernanceAutonomyReviewRequirement[];
  forbiddenCapabilities: GovernanceAutonomyForbiddenCapability[];
  preservedSafetyInvariants: GovernanceAutonomySafetyInvariant[];
  summary: {
    totalSections: number;
    totalReviewRequirements: number;
    totalForbiddenCapabilities: number;
    totalSafetyInvariants: number;
    structurallyReadyForReview: boolean;
    governanceMaturityLevel: string | null;
  };
  warnings: string[];
  recommendedNextStage:
    | "continue-governance-hardening"
    | "prepare-future-human-review-workflows"
    | "blocked";
};

const ARTIFACT_JSON_PATH = ".factory/governance/autonomy-design-review-pack.json";
const ARTIFACT_MARKDOWN_PATH = ".factory/governance/autonomy-design-review-pack.md";

const REVIEW_REQUIREMENT_DEFINITIONS: Array<Omit<GovernanceAutonomyReviewRequirement, "id" | "required">> = [
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
    key: "enable-autonomous-execution",
    reason: "Any autonomous execution requires future human review and explicit approval gates."
  },
  {
    key: "enable-autonomy-mode",
    reason: "Any autonomy mode requires future human review."
  },
  {
    key: "enable-ci-build-blocking",
    reason: "CI/build-blocking governance requires future human review."
  },
  {
    key: "enable-delegated-orchestration",
    reason: "Delegated orchestration requires future human review."
  },
  {
    key: "enable-exception-approvals",
    reason: "Exception approval workflows require future human review."
  },
  {
    key: "enable-github-publishing",
    reason: "GitHub publishing requires future human review and explicit integration design."
  },
  {
    key: "enable-policy-enforcement",
    reason: "Policy enforcement requires future human review."
  },
  {
    key: "enable-runtime-activation",
    reason: "Runtime activation requires future human review."
  },
  {
    key: "enable-runtime-config-activation",
    reason: "Runtime config activation requires future human review."
  }
];

const FORBIDDEN_CAPABILITY_DEFINITIONS: Array<Omit<GovernanceAutonomyForbiddenCapability, "id" | "permanentlyForbidden">> = [
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
    reason: "ML/vector DB governance decisioning is permanently forbidden."
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

function sourceStatusFor(
  readiness: GovernanceAutonomyReadiness
): GovernanceAutonomyDesignReviewPack["sourceAutonomyReadinessStatus"] {
  if (readiness.readinessStatus === "blocked") {
    return "blocked";
  }
  if (readiness.readinessStatus === "not-ready" && readiness.sourceActivationGatesStatus === "not-created") {
    return "not-created";
  }
  return "created";
}

function buildReviewRequirements(): GovernanceAutonomyReviewRequirement[] {
  return [...REVIEW_REQUIREMENT_DEFINITIONS]
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((item, index) => ({
      id: `gov-review-req-${String(index + 1).padStart(3, "0")}`,
      required: true,
      ...item
    }));
}

function buildForbiddenCapabilities(): GovernanceAutonomyForbiddenCapability[] {
  return [...FORBIDDEN_CAPABILITY_DEFINITIONS]
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((item, index) => ({
      id: `gov-review-forbidden-${String(index + 1).padStart(3, "0")}`,
      permanentlyForbidden: true,
      ...item
    }));
}

function invariant(
  key: string,
  preserved: boolean,
  reason: string
): Omit<GovernanceAutonomySafetyInvariant, "id"> {
  return {
    key,
    preserved,
    reason
  };
}

function buildSafetyInvariants(readiness: GovernanceAutonomyReadiness): GovernanceAutonomySafetyInvariant[] {
  const items: Array<Omit<GovernanceAutonomySafetyInvariant, "id">> = [
    invariant("governance-decisions-unchanged", readiness.governanceDecisionsChanged === false, "Governance decisions remain unchanged."),
    invariant("no-autonomous-actions-allowed", readiness.autonomousActionsAllowed === false, "Autonomous actions are not allowed."),
    invariant("no-autonomy-enablement", readiness.autonomyEnabled === false, "Autonomy remains disabled."),
    invariant("no-governance-bypass", readiness.governanceBypassAllowed === false, "Governance bypass is not allowed."),
    invariant("no-governance-enforcement", readiness.enforced === false, "Governance is not enforced."),
    invariant("no-mutation-scope-expansion", true, "Mutation scope expansion is not introduced."),
    invariant("no-plugin-execution", true, "Plugin execution is not introduced."),
    invariant("no-policy-activation", readiness.policyActivated === false, "Policies are not activated."),
    invariant("no-runtime-config-activation", readiness.runtimeActivationEnabled === false, "Runtime config activation remains disabled."),
    invariant("no-script-evaluation", true, "Script evaluation is not introduced."),
    invariant("repair-orchestration-unchanged", readiness.repairOrchestrationChanged === false, "Repair orchestration remains unchanged."),
    invariant("runtime-behavior-unchanged", readiness.runtimeBehaviorChanged === false, "Runtime behavior remains unchanged."),
    invariant("safe-patch-engine-only", readiness.safePatchEngineOnly === true, "Safe Patch Engine remains the only mutation layer.")
  ];

  return items
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((item, index) => ({
      id: `gov-review-invariant-${String(index + 1).padStart(3, "0")}`,
      ...item
    }));
}

function conclusionFor(
  readiness: GovernanceAutonomyReadiness,
  sourceStatus: GovernanceAutonomyDesignReviewPack["sourceAutonomyReadinessStatus"],
  preservedSafetyInvariants: GovernanceAutonomySafetyInvariant[]
): Pick<
  GovernanceAutonomyDesignReviewPack,
  "reviewPackStatus" | "reviewPackConclusion" | "recommendedNextStage"
> {
  if (sourceStatus === "not-created") {
    return {
      reviewPackStatus: "not-created",
      reviewPackConclusion: "source-missing",
      recommendedNextStage: "continue-governance-hardening"
    };
  }
  if (sourceStatus === "blocked" || preservedSafetyInvariants.some((item) => !item.preserved)) {
    return {
      reviewPackStatus: "blocked",
      reviewPackConclusion: "blocked-preview",
      recommendedNextStage: "blocked"
    };
  }
  if (readiness.readinessStatus === "ready-for-design-review") {
    return {
      reviewPackStatus: "created",
      reviewPackConclusion: "review-ready-preview",
      recommendedNextStage: "prepare-future-human-review-workflows"
    };
  }
  return {
    reviewPackStatus: "created",
    reviewPackConclusion: "review-not-ready",
    recommendedNextStage: "continue-governance-hardening"
  };
}

function governanceMaturityFor(
  readiness: GovernanceAutonomyReadiness,
  reviewPackStatus: GovernanceAutonomyDesignReviewPack["reviewPackStatus"]
): string | null {
  if (reviewPackStatus === "not-created") {
    return null;
  }
  if (reviewPackStatus === "blocked") {
    return "blocked-preview";
  }
  if (readiness.readinessStatus === "ready-for-design-review") {
    return "design-review-preview";
  }
  return "readiness-preview";
}

function buildSections(
  readiness: GovernanceAutonomyReadiness,
  reviewPackConclusion: GovernanceAutonomyDesignReviewPack["reviewPackConclusion"],
  reviewRequirements: GovernanceAutonomyReviewRequirement[],
  forbiddenCapabilities: GovernanceAutonomyForbiddenCapability[],
  preservedSafetyInvariants: GovernanceAutonomySafetyInvariant[],
  governanceMaturityLevel: string | null
): GovernanceAutonomyDesignReviewSection[] {
  const sections: Array<Omit<GovernanceAutonomyDesignReviewSection, "id">> = [
    {
      title: "Activation Candidates",
      category: "activation-candidates",
      lines: [
        "Guarded activation candidates remain preview-only.",
        "No policy was activated.",
        "Activation candidates require future human review before any runtime consideration."
      ]
    },
    {
      title: "Activation Gates",
      category: "activation-gates",
      lines: [
        `Source activation gates status: ${readiness.sourceActivationGatesStatus}.`,
        "Activation gate passed: false.",
        "Runtime activation enabled: false."
      ]
    },
    {
      title: "Attestation",
      category: "attestation",
      lines: [
        "Governance attestation remains deterministic preview reporting.",
        "No attestation was applied or enforced."
      ]
    },
    {
      title: "Autonomy Readiness",
      category: "autonomy-readiness",
      lines: [
        `Readiness status: ${readiness.readinessStatus}.`,
        `Autonomy stage: ${readiness.autonomyStage}.`,
        `Review pack conclusion: ${reviewPackConclusion}.`
      ]
    },
    {
      title: "CI Preview",
      category: "ci-preview",
      lines: [
        "CI annotations remain preview-only.",
        "No build was failed by governance."
      ]
    },
    {
      title: "Exception Review",
      category: "exception-review",
      lines: [
        "Exception review remains preview-only.",
        "No exception was approved or applied.",
        "Governance bypass is not allowed."
      ]
    },
    {
      title: "Forbidden Capabilities",
      category: "forbidden-capabilities",
      lines: [
        `Total permanently forbidden capabilities: ${forbiddenCapabilities.length}.`,
        "Forbidden capabilities remain blocked and cannot be enabled by this review pack."
      ]
    },
    {
      title: "Governance Readiness",
      category: "governance-readiness",
      lines: [
        `Governance maturity level: ${governanceMaturityLevel ?? "none"}.`,
        `Structurally ready for review: ${readiness.summary.structurallyReadyForDesignReview}.`,
        `Total review requirements: ${reviewRequirements.length}.`
      ]
    },
    {
      title: "Policy Runtime",
      category: "policy-runtime",
      lines: [
        `Policy runtime mode: ${readiness.policyRuntimeMode}.`,
        "Policies are not enforced.",
        "Policy runtime remains preview-only."
      ]
    },
    {
      title: "PR Preview",
      category: "pr-preview",
      lines: [
        "GitHub PR summary remains local preview output.",
        "No GitHub API was called.",
        "No PR comment was created."
      ]
    },
    {
      title: "Profile Governance",
      category: "profile-governance",
      lines: [
        "Profiles remain preview-only.",
        "No profile was applied."
      ]
    },
    {
      title: "Repository Boundaries",
      category: "repo-boundaries",
      lines: [
        "Repository boundaries remain preview-only.",
        "No governance boundary was enforced."
      ]
    },
    {
      title: "Safety Invariants",
      category: "safety-invariants",
      lines: [
        `Total safety invariants: ${preservedSafetyInvariants.length}.`,
        `Preserved safety invariants: ${preservedSafetyInvariants.filter((item) => item.preserved).length}.`
      ]
    },
    {
      title: "Simulation",
      category: "simulation",
      lines: [
        "Governance simulation remains preview-only.",
        "Simulation outcomes were not applied."
      ]
    }
  ];

  return sections
    .sort((a, b) => `${a.category}:${a.title}`.localeCompare(`${b.category}:${b.title}`))
    .map((item, index) => ({
      id: `gov-review-pack-section-${String(index + 1).padStart(3, "0")}`,
      ...item
    }));
}

function warningsFor(conclusion: GovernanceAutonomyDesignReviewPack["reviewPackConclusion"]): string[] {
  const warnings = [
    "Controlled autonomy design review pack is preparation-only.",
    "No autonomy was approved.",
    "No autonomous actions are allowed.",
    "No governance was enforced.",
    "Runtime behavior did not change.",
    "Repair orchestration did not change."
  ];

  if (conclusion === "source-missing") {
    warnings.unshift("Autonomy readiness source is missing; design review pack is incomplete.");
  }
  if (conclusion === "blocked-preview") {
    warnings.unshift("Autonomy readiness is blocked; design review pack cannot proceed.");
  }
  if (conclusion === "review-not-ready") {
    warnings.unshift("Autonomy readiness is not ready for design review.");
  }
  if (conclusion === "review-ready-preview") {
    warnings.unshift("Design review pack is ready for future human review only.");
  }

  return warnings;
}

export function buildGovernanceAutonomyDesignReviewPackFromReadiness(
  readiness: GovernanceAutonomyReadiness
): GovernanceAutonomyDesignReviewPack {
  const sourceAutonomyReadinessStatus = sourceStatusFor(readiness);
  const reviewRequirements = buildReviewRequirements();
  const forbiddenCapabilities = buildForbiddenCapabilities();
  const preservedSafetyInvariants = buildSafetyInvariants(readiness);
  const conclusion = conclusionFor(readiness, sourceAutonomyReadinessStatus, preservedSafetyInvariants);
  const governanceMaturityLevel = governanceMaturityFor(readiness, conclusion.reviewPackStatus);
  const sections = buildSections(
    readiness,
    conclusion.reviewPackConclusion,
    reviewRequirements,
    forbiddenCapabilities,
    preservedSafetyInvariants,
    governanceMaturityLevel
  );

  return {
    schemaVersion: 1,
    reviewPackStatus: conclusion.reviewPackStatus,
    sourceAutonomyReadinessStatus,
    reviewPackConclusion: conclusion.reviewPackConclusion,
    designReviewApproved: false,
    designReviewApplied: false,
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
    sections,
    reviewRequirements,
    forbiddenCapabilities,
    preservedSafetyInvariants,
    summary: {
      totalSections: sections.length,
      totalReviewRequirements: reviewRequirements.length,
      totalForbiddenCapabilities: forbiddenCapabilities.length,
      totalSafetyInvariants: preservedSafetyInvariants.length,
      structurallyReadyForReview: conclusion.reviewPackConclusion === "review-ready-preview",
      governanceMaturityLevel
    },
    warnings: warningsFor(conclusion.reviewPackConclusion),
    recommendedNextStage: conclusion.recommendedNextStage
  };
}

export function buildGovernanceAutonomyDesignReviewPack(projectRoot: string): GovernanceAutonomyDesignReviewPack {
  return buildGovernanceAutonomyDesignReviewPackFromReadiness(buildGovernanceAutonomyReadiness(projectRoot));
}

export function renderGovernanceAutonomyDesignReviewPackMarkdown(pack: GovernanceAutonomyDesignReviewPack): string {
  const lines = [
    "# AI Software Factory - Controlled Autonomy Design Review Pack",
    "",
    "Review pack status:",
    pack.reviewPackStatus,
    "",
    "Source autonomy readiness status:",
    pack.sourceAutonomyReadinessStatus,
    "",
    "Review pack conclusion:",
    pack.reviewPackConclusion,
    "",
    "Design review approved:",
    String(pack.designReviewApproved),
    "",
    "Design review applied:",
    String(pack.designReviewApplied),
    "",
    "Autonomy enabled:",
    String(pack.autonomyEnabled),
    "",
    "Autonomous actions allowed:",
    String(pack.autonomousActionsAllowed),
    "",
    "Autonomy applied:",
    String(pack.autonomyApplied),
    "",
    "Autonomy enforced:",
    String(pack.autonomyEnforced),
    "",
    "Runtime activation enabled:",
    String(pack.runtimeActivationEnabled),
    "",
    "Policy activated:",
    String(pack.policyActivated),
    "",
    "Guarded activation enabled:",
    String(pack.guardedActivationEnabled),
    "",
    "Activation enforced:",
    String(pack.activationEnforced),
    "",
    "Governance bypass allowed:",
    String(pack.governanceBypassAllowed),
    "",
    "Applied:",
    String(pack.applied),
    "",
    "Enforced:",
    String(pack.enforced),
    "",
    "Policy runtime mode:",
    pack.policyRuntimeMode,
    "",
    "Runtime behavior changed:",
    String(pack.runtimeBehaviorChanged),
    "",
    "Governance decisions changed:",
    String(pack.governanceDecisionsChanged),
    "",
    "Repair orchestration changed:",
    String(pack.repairOrchestrationChanged),
    "",
    "Safe Patch Engine only:",
    String(pack.safePatchEngineOnly),
    "",
    "Total review requirements:",
    String(pack.summary.totalReviewRequirements),
    "",
    "Total forbidden capabilities:",
    String(pack.summary.totalForbiddenCapabilities),
    "",
    "Total preserved safety invariants:",
    String(pack.summary.totalSafetyInvariants),
    "",
    "Structurally ready for review:",
    String(pack.summary.structurallyReadyForReview),
    "",
    "Governance maturity level:",
    pack.summary.governanceMaturityLevel ?? "none",
    "",
    "Recommended next stage:",
    pack.recommendedNextStage,
    "",
    "## Design Review Sections",
    ""
  ];

  for (const section of pack.sections) {
    lines.push(`### ${section.title}`, "");
    lines.push(`Category: ${section.category}`);
    for (const line of section.lines) {
      lines.push(`- ${line}`);
    }
    lines.push("");
  }

  lines.push("## Review Requirements", "");
  for (const item of pack.reviewRequirements) {
    lines.push(`- ${item.id} ${item.key} - ${item.reason}`);
  }

  lines.push("", "## Forbidden Capabilities", "");
  for (const item of pack.forbiddenCapabilities) {
    lines.push(`- ${item.id} ${item.key} - ${item.reason}`);
  }

  lines.push("", "## Preserved Safety Invariants", "");
  for (const item of pack.preservedSafetyInvariants) {
    lines.push(`- [${item.preserved ? "preserved" : "not-preserved"}] ${item.id} ${item.key} - ${item.reason}`);
  }

  lines.push("", "## Warnings", "");
  for (const warning of pack.warnings) {
    lines.push(`- ${warning}`);
  }

  return `${lines.join("\n")}\n`;
}

export function renderGovernanceAutonomyDesignReviewPackText(pack: GovernanceAutonomyDesignReviewPack): string {
  return renderGovernanceAutonomyDesignReviewPackMarkdown(pack);
}

export function writeGovernanceAutonomyDesignReviewPackArtifacts(
  projectRoot: string,
  pack: GovernanceAutonomyDesignReviewPack
): { jsonPath: string; markdownPath: string } {
  const jsonPath = path.join(projectRoot, ARTIFACT_JSON_PATH);
  const markdownPath = path.join(projectRoot, ARTIFACT_MARKDOWN_PATH);
  fs.ensureDirSync(path.dirname(jsonPath));
  fs.writeFileSync(jsonPath, `${JSON.stringify(pack, null, 2)}\n`, "utf8");
  fs.writeFileSync(markdownPath, renderGovernanceAutonomyDesignReviewPackMarkdown(pack), "utf8");
  return {
    jsonPath: ARTIFACT_JSON_PATH,
    markdownPath: ARTIFACT_MARKDOWN_PATH
  };
}
