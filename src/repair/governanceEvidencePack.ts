import path from "node:path";
import fs from "fs-extra";
import type { GovernanceDecisionMatrix } from "./governanceDecisionMatrix.js";
import { renderGovernanceDecisionMatrixMarkdown } from "./governanceDecisionMatrix.js";
import type { GovernanceDriftDetection } from "./governanceDriftDetection.js";
import { renderGovernanceDriftDetectionMarkdown } from "./governanceDriftDetection.js";
import type { GovernanceEscalation } from "./governanceEscalation.js";
import { renderGovernanceEscalationMarkdown } from "./governanceEscalation.js";
import type { GovernancePolicyRecommendation } from "./governancePolicyEnforcement.js";
import { renderGovernancePolicyEnforcementMarkdown } from "./governancePolicyEnforcement.js";
import type { GovernanceStabilityScore } from "./governanceStabilityScore.js";
import { renderGovernanceStabilityScoreMarkdown } from "./governanceStabilityScore.js";
import type { GovernanceTrendAnalysis } from "./governanceTrendAnalysis.js";
import { renderGovernanceTrendAnalysisMarkdown } from "./governanceTrendAnalysis.js";

export type GovernanceEvidencePackManifest = {
  version: 1;
  evidencePackId: string;
  generatedAt: string;
  includedArtifacts: Array<{
    name: string;
    relativePath: string;
    kind: string;
  }>;
  governanceSummary: {
    policyMode?: string;
    escalationLevel?: string;
    stabilityLevel?: string;
    stabilityScore?: number;
    driftSeverity?: string;
    trendHealth?: string;
  };
};

export type GovernanceEvidencePackResult = {
  evidencePackId: string;
  outputDirectory: string;
  manifestPath: string;
  generatedFiles: string[];
};

export type GovernanceEvidencePackInput = {
  projectRoot: string;
  trend: GovernanceTrendAnalysis;
  drift: GovernanceDriftDetection;
  stability: GovernanceStabilityScore;
  escalation: GovernanceEscalation;
  policy: GovernancePolicyRecommendation;
  decisionMatrix: GovernanceDecisionMatrix;
  date?: Date;
};

const ARTIFACT_ORDER = [
  { name: "summary.md", kind: "summary" },
  { name: "trends.md", kind: "trends" },
  { name: "drift.md", kind: "drift" },
  { name: "stability.md", kind: "stability" },
  { name: "escalation.md", kind: "escalation" },
  { name: "policy.md", kind: "policy" },
  { name: "decision-matrix.md", kind: "decision-matrix" },
  { name: "trends.json", kind: "trends" },
  { name: "drift.json", kind: "drift" },
  { name: "stability.json", kind: "stability" },
  { name: "escalation.json", kind: "escalation" },
  { name: "policy.json", kind: "policy" },
  { name: "decision-matrix.json", kind: "decision-matrix" }
] as const;

function normalizeSlash(value: string): string {
  return value.split(path.sep).join("/");
}

function relativePath(projectRoot: string, filePath: string): string {
  return normalizeSlash(path.relative(projectRoot, filePath));
}

function isInside(parent: string, child: string): boolean {
  const relative = path.relative(parent, child);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

export function createGovernanceEvidencePackId(date: Date = new Date()): string {
  return date.toISOString().replace(/:/g, "-").replace(/\.(\d{3})Z$/, "-$1Z");
}

export function buildGovernanceEvidenceManifest(input: {
  evidencePackId: string;
  generatedAt: string;
  outputDirectory: string;
  trend: GovernanceTrendAnalysis;
  drift: GovernanceDriftDetection;
  stability: GovernanceStabilityScore;
  escalation: GovernanceEscalation;
  policy: GovernancePolicyRecommendation;
}): GovernanceEvidencePackManifest {
  return {
    version: 1,
    evidencePackId: input.evidencePackId,
    generatedAt: input.generatedAt,
    includedArtifacts: ARTIFACT_ORDER.map((artifact) => ({
      name: artifact.name,
      relativePath: `${input.outputDirectory}/${artifact.name}`,
      kind: artifact.kind
    })),
    governanceSummary: {
      policyMode: input.policy.recommendedPolicyMode,
      escalationLevel: input.escalation.escalationLevel,
      stabilityLevel: input.stability.level,
      stabilityScore: input.stability.score,
      driftSeverity: input.drift.overallSeverity,
      trendHealth: input.trend.trendHealth
    }
  };
}

export function renderGovernanceEvidenceSummaryMarkdown(manifest: GovernanceEvidencePackManifest): string {
  const lines = [
    "# AI Software Factory - Governance Evidence Pack",
    "",
    "Evidence Pack ID:",
    manifest.evidencePackId,
    "",
    "Generated At:",
    manifest.generatedAt,
    "",
    "## Governance Summary",
    "",
    `* policy mode: ${manifest.governanceSummary.policyMode ?? "unknown"}`,
    `* escalation level: ${manifest.governanceSummary.escalationLevel ?? "unknown"}`,
    `* stability level: ${manifest.governanceSummary.stabilityLevel ?? "unknown"}`,
    `* stability score: ${manifest.governanceSummary.stabilityScore ?? "unknown"}`,
    `* drift severity: ${manifest.governanceSummary.driftSeverity ?? "unknown"}`,
    `* trend health: ${manifest.governanceSummary.trendHealth ?? "unknown"}`,
    "",
    "## Included Artifacts",
    ""
  ];

  for (const artifact of manifest.includedArtifacts.filter((artifact) => artifact.name.endsWith(".md") && artifact.name !== "summary.md")) {
    lines.push(`* ${artifact.name}`);
  }

  return `${lines.join("\n")}\n`;
}

function writeJson(filePath: string, value: unknown): void {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function buildGovernanceEvidencePack(input: GovernanceEvidencePackInput): GovernanceEvidencePackResult {
  const evidencePackId = createGovernanceEvidencePackId(input.date);
  const generatedAt = input.date?.toISOString() ?? new Date().toISOString();
  const evidenceRoot = path.join(input.projectRoot, ".factory", "evidence-packs");
  const outputDir = path.join(evidenceRoot, evidencePackId);

  if (!isInside(evidenceRoot, outputDir)) {
    throw new Error("Evidence pack destination must stay within .factory/evidence-packs.");
  }

  const outputDirectory = relativePath(input.projectRoot, outputDir);
  const manifest = buildGovernanceEvidenceManifest({
    evidencePackId,
    generatedAt,
    outputDirectory,
    trend: input.trend,
    drift: input.drift,
    stability: input.stability,
    escalation: input.escalation,
    policy: input.policy
  });

  fs.ensureDirSync(outputDir);

  const writers: Record<string, () => void> = {
    "manifest.json": () => writeJson(path.join(outputDir, "manifest.json"), manifest),
    "summary.md": () => fs.writeFileSync(path.join(outputDir, "summary.md"), renderGovernanceEvidenceSummaryMarkdown(manifest), "utf8"),
    "trends.md": () => fs.writeFileSync(path.join(outputDir, "trends.md"), renderGovernanceTrendAnalysisMarkdown(input.trend), "utf8"),
    "drift.md": () => fs.writeFileSync(path.join(outputDir, "drift.md"), renderGovernanceDriftDetectionMarkdown(input.drift), "utf8"),
    "stability.md": () => fs.writeFileSync(path.join(outputDir, "stability.md"), renderGovernanceStabilityScoreMarkdown(input.stability), "utf8"),
    "escalation.md": () => fs.writeFileSync(path.join(outputDir, "escalation.md"), renderGovernanceEscalationMarkdown(input.escalation), "utf8"),
    "policy.md": () => fs.writeFileSync(path.join(outputDir, "policy.md"), renderGovernancePolicyEnforcementMarkdown(input.policy), "utf8"),
    "decision-matrix.md": () => fs.writeFileSync(path.join(outputDir, "decision-matrix.md"), renderGovernanceDecisionMatrixMarkdown(input.decisionMatrix), "utf8"),
    "trends.json": () => writeJson(path.join(outputDir, "trends.json"), input.trend),
    "drift.json": () => writeJson(path.join(outputDir, "drift.json"), input.drift),
    "stability.json": () => writeJson(path.join(outputDir, "stability.json"), input.stability),
    "escalation.json": () => writeJson(path.join(outputDir, "escalation.json"), input.escalation),
    "policy.json": () => writeJson(path.join(outputDir, "policy.json"), input.policy),
    "decision-matrix.json": () => writeJson(path.join(outputDir, "decision-matrix.json"), input.decisionMatrix)
  };

  const generatedFiles = ["manifest.json", ...ARTIFACT_ORDER.map((artifact) => artifact.name)];
  for (const file of generatedFiles) {
    writers[file]();
  }

  return {
    evidencePackId,
    outputDirectory,
    manifestPath: `${outputDirectory}/manifest.json`,
    generatedFiles: generatedFiles.map((file) => `${outputDirectory}/${file}`)
  };
}
