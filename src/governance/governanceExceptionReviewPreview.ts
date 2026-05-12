import fs from "fs-extra";
import path from "node:path";

import {
  buildGovernanceGithubPrSummaryPreview,
  type GovernanceGithubPrSummaryPreview
} from "./githubPrGovernanceSummaryPreview.js";

export type GovernanceExceptionCandidate = {
  id: string;
  category:
    | "blocked-capability"
    | "safety-invariant"
    | "policy-runtime-limitation"
    | "profile-conflict"
    | "blocked-profile-option"
    | "repo-boundary-concern"
    | "ci-warning"
    | "ci-failure"
    | "pr-warning"
    | "pr-blocked"
    | "other-governance";
  severity: "info" | "warning" | "blocking";
  reviewability: "reviewable" | "non-reviewable";
  source:
    | "policy-runtime-preview"
    | "profile-inheritance-preview"
    | "repo-classification-preview"
    | "governance-attestation"
    | "ci-annotations-preview"
    | "github-pr-summary-preview"
    | "derived";
  title: string;
  reason: string;
  exceptionApproved: false;
  exceptionApplied: false;
  governanceBypassAllowed: false;
};

export type GovernanceExceptionReviewPreview = {
  schemaVersion: 1;
  previewStatus: "not-created" | "created" | "blocked";
  sourcePrSummaryStatus: "not-created" | "created" | "blocked";
  exceptionReviewConclusion:
    | "no-exceptions"
    | "review-needed"
    | "blocked-non-reviewable"
    | "source-missing";
  exceptionApproved: false;
  exceptionApplied: false;
  governanceBypassAllowed: false;
  exceptionEnforced: false;
  githubPublished: false;
  prCommentCreated: false;
  githubApiCalled: false;
  ciEnforced: false;
  buildFailedByGovernance: false;
  attestationApplied: false;
  attestationEnforced: false;
  classificationApplied: false;
  boundariesEnforced: false;
  profileApplied: false;
  applied: false;
  enforced: false;
  policyRuntimeMode: "preview-only";
  runtimeBehaviorChanged: false;
  governanceDecisionsChanged: false;
  repairOrchestrationChanged: false;
  safePatchEngineOnly: true;
  autonomyEnabled: false;
  exceptionCandidates: GovernanceExceptionCandidate[];
  summary: {
    totalCandidates: number;
    reviewableCandidates: number;
    nonReviewableCandidates: number;
    warningCandidates: number;
    blockingCandidates: number;
    categories: string[];
  };
  warnings: string[];
  recommendedNextStage:
    | "continue-preview-only"
    | "prepare-governance-simulation"
    | "blocked";
};

const ARTIFACT_JSON_PATH = ".factory/governance/governance-exception-review-preview.json";
const ARTIFACT_MARKDOWN_PATH = ".factory/governance/governance-exception-review-preview.md";

const SEVERITY_ORDER: Record<GovernanceExceptionCandidate["severity"], number> = {
  blocking: 0,
  warning: 1,
  info: 2
};

const NON_REVIEWABLE_PATTERNS = [
  "autonomous",
  "safe patch engine",
  "mutation scope",
  "runtime governance enforcement",
  "plugin execution",
  "dynamic policy",
  "external command",
  "remote governance",
  "self-modifying",
  "runtime script",
  "runtime config",
  "bypass"
];

function baseCandidate(
  category: GovernanceExceptionCandidate["category"],
  severity: GovernanceExceptionCandidate["severity"],
  reviewability: GovernanceExceptionCandidate["reviewability"],
  source: GovernanceExceptionCandidate["source"],
  title: string,
  reason: string
): Omit<GovernanceExceptionCandidate, "id"> {
  return {
    category,
    severity,
    reviewability,
    source,
    title,
    reason,
    exceptionApproved: false,
    exceptionApplied: false,
    governanceBypassAllowed: false
  };
}

function normalizeLine(line: string): string {
  return line.replace(/^\s*-\s*/, "").trim();
}

function isNonReviewableBlockedCapability(text: string): boolean {
  const lower = text.toLowerCase();
  return NON_REVIEWABLE_PATTERNS.some((pattern) => lower.includes(pattern));
}

function collectBlockedCapabilityCandidates(summary: GovernanceGithubPrSummaryPreview): Array<Omit<GovernanceExceptionCandidate, "id">> {
  const section = summary.sections.find((item) => item.id === "blocked-capabilities");
  if (!section) {
    return [];
  }
  return section.lines
    .filter((line) => normalizeLine(line) !== "none")
    .map((line) => {
      const normalized = normalizeLine(line);
      const nonReviewable = isNonReviewableBlockedCapability(normalized);
      return baseCandidate(
        "blocked-capability",
        nonReviewable ? "blocking" : "warning",
        nonReviewable ? "non-reviewable" : "reviewable",
        "governance-attestation",
        normalized.split(":")[0] || "Blocked capability",
        normalized
      );
    });
}

function collectWarningCandidates(summary: GovernanceGithubPrSummaryPreview): Array<Omit<GovernanceExceptionCandidate, "id">> {
  const section = summary.sections.find((item) => item.id === "warnings");
  if (!section) {
    return [];
  }
  return section.lines
    .filter((line) => normalizeLine(line) !== "none")
    .map((line) => baseCandidate(
      "pr-warning",
      "warning",
      "reviewable",
      "github-pr-summary-preview",
      "PR summary warning",
      normalizeLine(line)
    ));
}

function collectConclusionCandidates(summary: GovernanceGithubPrSummaryPreview): Array<Omit<GovernanceExceptionCandidate, "id">> {
  if (summary.prConclusion === "blocked-preview") {
    return [
      baseCandidate(
        "pr-blocked",
        "blocking",
        "non-reviewable",
        "github-pr-summary-preview",
        "PR summary blocked-preview conclusion",
        "PR summary conclusion is blocked-preview and cannot be converted into an exception."
      )
    ];
  }
  if (summary.prConclusion === "warning-preview") {
    return [
      baseCandidate(
        "pr-warning",
        "warning",
        "reviewable",
        "github-pr-summary-preview",
        "PR summary warning-preview conclusion",
        "PR summary conclusion is warning-preview and should be reviewed before future governance simulation."
      )
    ];
  }
  return [];
}

function collectInvariantCandidates(summary: GovernanceGithubPrSummaryPreview): Array<Omit<GovernanceExceptionCandidate, "id">> {
  if (summary.summary.invariantFailureCount <= 0) {
    return [];
  }
  return [
    baseCandidate(
      "safety-invariant",
      "blocking",
      "non-reviewable",
      "ci-annotations-preview",
      "Safety invariant failure",
      "One or more safety invariants failed and cannot be approved as an exception."
    )
  ];
}

function collectCiFailureCandidates(summary: GovernanceGithubPrSummaryPreview): Array<Omit<GovernanceExceptionCandidate, "id">> {
  if (summary.summary.failures <= 0) {
    return [];
  }
  return [
    baseCandidate(
      "ci-failure",
      "blocking",
      "non-reviewable",
      "ci-annotations-preview",
      "CI failure-level governance annotation",
      "Failure-level CI governance annotations require fixing the source condition rather than approving an exception."
    )
  ];
}

function collectRepoBoundaryCandidates(summary: GovernanceGithubPrSummaryPreview): Array<Omit<GovernanceExceptionCandidate, "id">> {
  if (summary.summary.repositoryCategory === null) {
    return [
      baseCandidate(
        "repo-boundary-concern",
        "warning",
        "reviewable",
        "repo-classification-preview",
        "Repository category unavailable",
        "Repository category is unavailable, so governance boundary assumptions should be reviewed."
      )
    ];
  }
  return [];
}

function collectCandidates(summary: GovernanceGithubPrSummaryPreview): GovernanceExceptionCandidate[] {
  const raw = [
    ...collectConclusionCandidates(summary),
    ...collectInvariantCandidates(summary),
    ...collectCiFailureCandidates(summary),
    ...collectRepoBoundaryCandidates(summary),
    ...collectBlockedCapabilityCandidates(summary),
    ...collectWarningCandidates(summary)
  ];

  const sorted = raw.sort((a, b) => {
    const severity = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
    if (severity !== 0) return severity;
    const category = a.category.localeCompare(b.category);
    if (category !== 0) return category;
    const source = a.source.localeCompare(b.source);
    if (source !== 0) return source;
    return a.title.localeCompare(b.title);
  });

  return sorted.map((candidate, index) => ({
    id: `gov-exception-${String(index + 1).padStart(3, "0")}`,
    ...candidate
  }));
}

function buildSummary(candidates: GovernanceExceptionCandidate[]): GovernanceExceptionReviewPreview["summary"] {
  const categories = Array.from(new Set(candidates.map((candidate) => candidate.category))).sort();
  return {
    totalCandidates: candidates.length,
    reviewableCandidates: candidates.filter((candidate) => candidate.reviewability === "reviewable").length,
    nonReviewableCandidates: candidates.filter((candidate) => candidate.reviewability === "non-reviewable").length,
    warningCandidates: candidates.filter((candidate) => candidate.severity === "warning").length,
    blockingCandidates: candidates.filter((candidate) => candidate.severity === "blocking").length,
    categories
  };
}

function conclusionFor(
  sourceStatus: GovernanceGithubPrSummaryPreview["previewStatus"],
  summary: GovernanceExceptionReviewPreview["summary"]
): {
  previewStatus: GovernanceExceptionReviewPreview["previewStatus"];
  exceptionReviewConclusion: GovernanceExceptionReviewPreview["exceptionReviewConclusion"];
  recommendedNextStage: GovernanceExceptionReviewPreview["recommendedNextStage"];
} {
  if (sourceStatus === "not-created") {
    return {
      previewStatus: "not-created",
      exceptionReviewConclusion: "source-missing",
      recommendedNextStage: "continue-preview-only"
    };
  }
  if (sourceStatus === "blocked" || summary.nonReviewableCandidates > 0 || summary.blockingCandidates > 0) {
    return {
      previewStatus: "blocked",
      exceptionReviewConclusion: "blocked-non-reviewable",
      recommendedNextStage: "blocked"
    };
  }
  if (summary.totalCandidates === 0) {
    return {
      previewStatus: "created",
      exceptionReviewConclusion: "no-exceptions",
      recommendedNextStage: "prepare-governance-simulation"
    };
  }
  return {
    previewStatus: "created",
    exceptionReviewConclusion: "review-needed",
    recommendedNextStage: "prepare-governance-simulation"
  };
}

function warningsFor(result: {
  sourceStatus: GovernanceGithubPrSummaryPreview["previewStatus"];
  conclusion: GovernanceExceptionReviewPreview["exceptionReviewConclusion"];
}): string[] {
  const warnings = [
    "Governance exception review is preview-only.",
    "No exception was approved.",
    "No exception was applied.",
    "Governance bypass is not allowed.",
    "No governance was enforced.",
    "Runtime behavior did not change.",
    "Governance decisions did not change.",
    "Repair orchestration did not change."
  ];
  if (result.sourceStatus === "not-created") {
    warnings.unshift("GitHub PR governance summary preview is not created; exception review is incomplete.");
  }
  if (result.conclusion === "blocked-non-reviewable") {
    warnings.unshift("Non-reviewable governance exception candidates are present.");
  }
  return warnings;
}

export function buildGovernanceExceptionReviewPreviewFromPrSummary(
  prSummary: GovernanceGithubPrSummaryPreview
): GovernanceExceptionReviewPreview {
  const exceptionCandidates = collectCandidates(prSummary);
  const summary = buildSummary(exceptionCandidates);
  const conclusion = conclusionFor(prSummary.previewStatus, summary);

  return {
    schemaVersion: 1,
    previewStatus: conclusion.previewStatus,
    sourcePrSummaryStatus: prSummary.previewStatus,
    exceptionReviewConclusion: conclusion.exceptionReviewConclusion,
    exceptionApproved: false,
    exceptionApplied: false,
    governanceBypassAllowed: false,
    exceptionEnforced: false,
    githubPublished: false,
    prCommentCreated: false,
    githubApiCalled: false,
    ciEnforced: false,
    buildFailedByGovernance: false,
    attestationApplied: false,
    attestationEnforced: false,
    classificationApplied: false,
    boundariesEnforced: false,
    profileApplied: false,
    applied: false,
    enforced: false,
    policyRuntimeMode: "preview-only",
    runtimeBehaviorChanged: false,
    governanceDecisionsChanged: false,
    repairOrchestrationChanged: false,
    safePatchEngineOnly: true,
    autonomyEnabled: false,
    exceptionCandidates,
    summary,
    warnings: warningsFor({
      sourceStatus: prSummary.previewStatus,
      conclusion: conclusion.exceptionReviewConclusion
    }),
    recommendedNextStage: conclusion.recommendedNextStage
  };
}

export function buildGovernanceExceptionReviewPreview(projectRoot: string): GovernanceExceptionReviewPreview {
  return buildGovernanceExceptionReviewPreviewFromPrSummary(buildGovernanceGithubPrSummaryPreview(projectRoot));
}

export function renderGovernanceExceptionReviewPreviewMarkdown(preview: GovernanceExceptionReviewPreview): string {
  const lines = [
    "# AI Software Factory - Governance Exception Review Preview",
    "",
    "Preview status:",
    preview.previewStatus,
    "",
    "Source PR summary status:",
    preview.sourcePrSummaryStatus,
    "",
    "Exception review conclusion:",
    preview.exceptionReviewConclusion,
    "",
    "Exception approved:",
    String(preview.exceptionApproved),
    "",
    "Exception applied:",
    String(preview.exceptionApplied),
    "",
    "Governance bypass allowed:",
    String(preview.governanceBypassAllowed),
    "",
    "Exception enforced:",
    String(preview.exceptionEnforced),
    "",
    "Total candidates:",
    String(preview.summary.totalCandidates),
    "",
    "Reviewable candidates:",
    String(preview.summary.reviewableCandidates),
    "",
    "Non-reviewable candidates:",
    String(preview.summary.nonReviewableCandidates),
    "",
    "Warning candidates:",
    String(preview.summary.warningCandidates),
    "",
    "Blocking candidates:",
    String(preview.summary.blockingCandidates),
    "",
    "Categories:",
    preview.summary.categories.length > 0 ? preview.summary.categories.join(", ") : "-",
    "",
    "Applied:",
    String(preview.applied),
    "",
    "Enforced:",
    String(preview.enforced),
    "",
    "Policy runtime mode:",
    preview.policyRuntimeMode,
    "",
    "Runtime behavior changed:",
    String(preview.runtimeBehaviorChanged),
    "",
    "Governance decisions changed:",
    String(preview.governanceDecisionsChanged),
    "",
    "Repair orchestration changed:",
    String(preview.repairOrchestrationChanged),
    "",
    "Safe Patch Engine only:",
    String(preview.safePatchEngineOnly),
    "",
    "Autonomy enabled:",
    String(preview.autonomyEnabled),
    "",
    "Recommended next stage:",
    preview.recommendedNextStage,
    "",
    "## Exception Candidates",
    ""
  ];

  if (preview.exceptionCandidates.length === 0) {
    lines.push("- none");
  } else {
    for (const candidate of preview.exceptionCandidates) {
      lines.push(`- [${candidate.severity}] ${candidate.id} ${candidate.category} (${candidate.reviewability}) - ${candidate.title}: ${candidate.reason}`);
    }
  }

  lines.push("", "## Preview-Only Guarantees", "");
  lines.push("- exception approved: false");
  lines.push("- exception applied: false");
  lines.push("- governance bypass allowed: false");
  lines.push("- exception enforced: false");
  lines.push("- GitHub published: false");
  lines.push("- PR comment created: false");
  lines.push("- GitHub API called: false");
  lines.push("- CI enforced: false");
  lines.push("- build failed by governance: false");

  lines.push("", "## Warnings", "");
  for (const warning of preview.warnings) {
    lines.push(`- ${warning}`);
  }

  return `${lines.join("\n")}\n`;
}

export function renderGovernanceExceptionReviewPreviewText(preview: GovernanceExceptionReviewPreview): string {
  return renderGovernanceExceptionReviewPreviewMarkdown(preview);
}

export function writeGovernanceExceptionReviewPreviewArtifacts(
  projectRoot: string,
  preview: GovernanceExceptionReviewPreview
): { jsonPath: string; markdownPath: string } {
  const jsonPath = path.join(projectRoot, ARTIFACT_JSON_PATH);
  const markdownPath = path.join(projectRoot, ARTIFACT_MARKDOWN_PATH);
  fs.ensureDirSync(path.dirname(jsonPath));
  fs.writeFileSync(jsonPath, `${JSON.stringify(preview, null, 2)}\n`, "utf8");
  fs.writeFileSync(markdownPath, renderGovernanceExceptionReviewPreviewMarkdown(preview), "utf8");
  return {
    jsonPath: ARTIFACT_JSON_PATH,
    markdownPath: ARTIFACT_MARKDOWN_PATH
  };
}
