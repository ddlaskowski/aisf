import fs from "fs-extra";
import path from "node:path";

import {
  buildGovernanceCiAnnotationsPreview,
  type GovernanceCiAnnotation,
  type GovernanceCiAnnotationsPreview
} from "./ciGovernanceAnnotationsPreview.js";

export type GovernanceGithubPrSummarySection = {
  id: string;
  title: string;
  lines: string[];
};

export type GovernanceGithubPrSummaryPreview = {
  schemaVersion: 1;
  previewStatus: "not-created" | "created" | "blocked";
  sourceCiAnnotationsStatus: "not-created" | "created" | "blocked";
  prConclusion: "pass-preview" | "warning-preview" | "blocked-preview";
  githubPublished: false;
  prCommentCreated: false;
  githubApiCalled: false;
  ciAnnotationsApplied: false;
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
  summary: {
    title: string;
    conclusion: string;
    governanceMaturityLevel: string | null;
    stableGovernanceChain: boolean;
    repositoryCategory: string | null;
    recommendedProfile: string | null;
    totalAnnotations: number;
    notices: number;
    warnings: number;
    failures: number;
    blockedCapabilityCount: number;
    invariantFailureCount: number;
  };
  sections: GovernanceGithubPrSummarySection[];
  markdown: string;
  warnings: string[];
  recommendedNextStage:
    | "continue-preview-only"
    | "prepare-governance-exception-review"
    | "blocked";
};

const ARTIFACT_JSON_PATH = ".factory/governance/github-pr-governance-summary-preview.json";
const ARTIFACT_MARKDOWN_PATH = ".factory/governance/github-pr-governance-summary-preview.md";

function countAnnotations(annotations: GovernanceCiAnnotation[], level: GovernanceCiAnnotation["level"]): number {
  return annotations.filter((annotation) => annotation.level === level).length;
}

function previewStatusFor(ciPreview: GovernanceCiAnnotationsPreview): GovernanceGithubPrSummaryPreview["previewStatus"] {
  if (ciPreview.previewStatus === "blocked") {
    return "blocked";
  }
  if (ciPreview.previewStatus === "created") {
    return "created";
  }
  return "not-created";
}

function recommendedNextStageFor(
  previewStatus: GovernanceGithubPrSummaryPreview["previewStatus"],
  prConclusion: GovernanceGithubPrSummaryPreview["prConclusion"]
): GovernanceGithubPrSummaryPreview["recommendedNextStage"] {
  if (previewStatus === "blocked" || prConclusion === "blocked-preview") {
    return "blocked";
  }
  if (previewStatus === "created") {
    return "prepare-governance-exception-review";
  }
  return "continue-preview-only";
}

function section(id: string, title: string, lines: string[]): GovernanceGithubPrSummarySection {
  return { id, title, lines };
}

function annotationsByCategory(ciPreview: GovernanceCiAnnotationsPreview, category: GovernanceCiAnnotation["category"]): GovernanceCiAnnotation[] {
  return ciPreview.annotations.filter((annotation) => annotation.category === category);
}

function buildSections(
  ciPreview: GovernanceCiAnnotationsPreview,
  summary: GovernanceGithubPrSummaryPreview["summary"],
  recommendedNextStage: GovernanceGithubPrSummaryPreview["recommendedNextStage"]
): GovernanceGithubPrSummarySection[] {
  const safetyInvariantLines = annotationsByCategory(ciPreview, "safety-invariant").map(
    (annotation) => `- [${annotation.level}] ${annotation.title}: ${annotation.message}`
  );
  const blockedCapabilityLines = annotationsByCategory(ciPreview, "blocked-capability").map(
    (annotation) => `- ${annotation.title}: ${annotation.message}`
  );
  const warningLines = ciPreview.warnings.map((warning) => `- ${warning}`);

  return [
    section("github-pr-summary", "Governance PR Summary Preview", [
      "This summary was generated locally.",
      "No GitHub API was called.",
      "No PR comment was created.",
      "No build was failed by governance.",
      "No governance was enforced.",
      "No runtime behavior changed."
    ]),
    section("preview-conclusion", "Preview Conclusion", [
      `- PR conclusion: ${summary.conclusion}`,
      `- Source CI annotations status: ${ciPreview.previewStatus}`
    ]),
    section("governance-maturity", "Governance Maturity", [
      `- maturity level: ${summary.governanceMaturityLevel ?? "unknown"}`,
      `- stable governance chain: ${summary.stableGovernanceChain}`
    ]),
    section("repository-classification", "Repository Classification", [
      `- repository category: ${summary.repositoryCategory ?? "unknown"}`
    ]),
    section("recommended-profile", "Recommended Profile", [
      `- recommended profile: ${summary.recommendedProfile ?? "none"}`
    ]),
    section("safety-invariants", "Safety Invariants", safetyInvariantLines.length > 0 ? safetyInvariantLines : ["- none"]),
    section("blocked-capabilities", "Blocked Capabilities", blockedCapabilityLines.length > 0 ? blockedCapabilityLines : ["- none"]),
    section("ci-annotation-summary", "CI Annotation Summary", [
      `- total annotations: ${summary.totalAnnotations}`,
      `- notices: ${summary.notices}`,
      `- warnings: ${summary.warnings}`,
      `- failures: ${summary.failures}`,
      `- blocked capabilities: ${summary.blockedCapabilityCount}`,
      `- invariant failures: ${summary.invariantFailureCount}`
    ]),
    section("preview-only-guarantees", "Preview-Only Guarantees", [
      "- GitHub published: false",
      "- PR comment created: false",
      "- GitHub API called: false",
      "- CI enforced: false",
      "- build failed by governance: false",
      "- applied: false",
      "- enforced: false",
      "- runtime behavior changed: false",
      "- governance decisions changed: false",
      "- repair orchestration changed: false",
      "- Safe Patch Engine only: true",
      "- autonomy enabled: false"
    ]),
    section("warnings", "Warnings", warningLines.length > 0 ? warningLines : ["- none"]),
    section("recommended-next-stage", "Recommended Next Stage", [
      `- ${recommendedNextStage}`
    ])
  ];
}

export function renderGovernanceGithubPrSummaryMarkdownFromSections(
  sections: GovernanceGithubPrSummarySection[]
): string {
  const lines: string[] = [];
  for (const currentSection of sections) {
    lines.push(`# ${currentSection.title}`, "");
    lines.push(...currentSection.lines);
    lines.push("");
  }
  return `${lines.join("\n").trimEnd()}\n`;
}

function warningsFor(ciPreview: GovernanceCiAnnotationsPreview): string[] {
  const warnings = [
    "GitHub PR governance summary is preview-only.",
    "This summary was generated locally.",
    "No GitHub API was called.",
    "No PR comment was created.",
    "No build was failed by governance.",
    "No governance was enforced.",
    "Runtime behavior did not change.",
    "Governance decisions did not change.",
    "Repair orchestration did not change."
  ];
  if (ciPreview.previewStatus === "not-created") {
    warnings.unshift("CI governance annotations are not created; PR summary preview is incomplete.");
  }
  if (ciPreview.previewStatus === "blocked") {
    warnings.unshift("CI governance annotations are blocked; PR summary preview is blocked.");
  }
  return warnings;
}

export function buildGovernanceGithubPrSummaryPreviewFromCiAnnotations(
  ciPreview: GovernanceCiAnnotationsPreview
): GovernanceGithubPrSummaryPreview {
  const previewStatus = previewStatusFor(ciPreview);
  const prConclusion = ciPreview.ciConclusion;
  const recommendedNextStage = recommendedNextStageFor(previewStatus, prConclusion);
  const summary: GovernanceGithubPrSummaryPreview["summary"] = {
    title: "Governance PR Summary Preview",
    conclusion: prConclusion,
    governanceMaturityLevel: ciPreview.summary.governanceMaturityLevel,
    stableGovernanceChain: ciPreview.summary.stableGovernanceChain,
    repositoryCategory: ciPreview.summary.repositoryCategory,
    recommendedProfile: ciPreview.summary.recommendedProfile,
    totalAnnotations: ciPreview.annotations.length,
    notices: countAnnotations(ciPreview.annotations, "notice"),
    warnings: countAnnotations(ciPreview.annotations, "warning"),
    failures: countAnnotations(ciPreview.annotations, "failure"),
    blockedCapabilityCount: ciPreview.summary.blockedCapabilityCount,
    invariantFailureCount: ciPreview.summary.invariantFailureCount
  };
  const sections = buildSections(ciPreview, summary, recommendedNextStage);

  return {
    schemaVersion: 1,
    previewStatus,
    sourceCiAnnotationsStatus: ciPreview.previewStatus,
    prConclusion,
    githubPublished: false,
    prCommentCreated: false,
    githubApiCalled: false,
    ciAnnotationsApplied: false,
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
    summary,
    sections,
    markdown: renderGovernanceGithubPrSummaryMarkdownFromSections(sections),
    warnings: warningsFor(ciPreview),
    recommendedNextStage
  };
}

export function buildGovernanceGithubPrSummaryPreview(projectRoot: string): GovernanceGithubPrSummaryPreview {
  return buildGovernanceGithubPrSummaryPreviewFromCiAnnotations(buildGovernanceCiAnnotationsPreview(projectRoot));
}

export function writeGovernanceGithubPrSummaryPreviewArtifacts(
  projectRoot: string,
  preview: GovernanceGithubPrSummaryPreview
): { jsonPath: string; markdownPath: string } {
  const jsonPath = path.join(projectRoot, ARTIFACT_JSON_PATH);
  const markdownPath = path.join(projectRoot, ARTIFACT_MARKDOWN_PATH);
  fs.ensureDirSync(path.dirname(jsonPath));
  fs.writeFileSync(jsonPath, `${JSON.stringify(preview, null, 2)}\n`, "utf8");
  fs.writeFileSync(markdownPath, preview.markdown, "utf8");
  return {
    jsonPath: ARTIFACT_JSON_PATH,
    markdownPath: ARTIFACT_MARKDOWN_PATH
  };
}

export function renderGovernanceGithubPrSummaryPreviewText(preview: GovernanceGithubPrSummaryPreview): string {
  return [
    "# AI Software Factory - GitHub PR Governance Summary Preview",
    "",
    "Preview status:",
    preview.previewStatus,
    "",
    "Source CI annotations status:",
    preview.sourceCiAnnotationsStatus,
    "",
    "PR conclusion:",
    preview.prConclusion,
    "",
    "GitHub published:",
    String(preview.githubPublished),
    "",
    "PR comment created:",
    String(preview.prCommentCreated),
    "",
    "GitHub API called:",
    String(preview.githubApiCalled),
    "",
    "CI enforced:",
    String(preview.ciEnforced),
    "",
    "Build failed by governance:",
    String(preview.buildFailedByGovernance),
    "",
    "Governance maturity level:",
    preview.summary.governanceMaturityLevel ?? "-",
    "",
    "Stable governance chain:",
    String(preview.summary.stableGovernanceChain),
    "",
    "Repository category:",
    preview.summary.repositoryCategory ?? "-",
    "",
    "Recommended profile:",
    preview.summary.recommendedProfile ?? "-",
    "",
    "Total annotations:",
    String(preview.summary.totalAnnotations),
    "",
    "Notices:",
    String(preview.summary.notices),
    "",
    "Warnings:",
    String(preview.summary.warnings),
    "",
    "Failures:",
    String(preview.summary.failures),
    "",
    "Blocked capability count:",
    String(preview.summary.blockedCapabilityCount),
    "",
    "Invariant failure count:",
    String(preview.summary.invariantFailureCount),
    "",
    "Recommended next stage:",
    preview.recommendedNextStage,
    "",
    "## Preview-Only Warnings",
    "",
    ...preview.warnings.map((warning) => `- ${warning}`)
  ].join("\n") + "\n";
}
