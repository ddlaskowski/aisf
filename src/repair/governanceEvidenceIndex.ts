import path from "node:path";
import fs from "fs-extra";
import type { GovernanceEvidencePackManifest, GovernanceEvidencePackResult } from "./governanceEvidencePack.js";

export type GovernanceEvidenceIndexEntry = {
  evidencePackId: string;
  generatedAt: string;
  relativePath: string;
  policyMode?: string;
  escalationLevel?: string;
  stabilityLevel?: string;
  stabilityScore?: number;
  driftSeverity?: string;
  trendHealth?: string;
  artifactCount: number;
};

export type GovernanceEvidenceIndex = {
  version: 1;
  updatedAt: string;
  entries: GovernanceEvidenceIndexEntry[];
};

export type GovernanceEvidenceIndexFilterOptions = {
  latestOnly?: boolean;
  limit?: number;
  policyMode?: string;
  escalationLevel?: string;
};

export const GOVERNANCE_EVIDENCE_POLICY_MODES = ["normal", "conservative", "restricted", "manual-review-only"] as const;
export const GOVERNANCE_EVIDENCE_ESCALATION_LEVELS = ["none", "info", "warning", "high-risk", "critical"] as const;

const EMPTY_UPDATED_AT = "1970-01-01T00:00:00.000Z";
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function normalizeSlash(value: string): string {
  return value.split(path.sep).join("/");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function isValidEntry(value: unknown): value is GovernanceEvidenceIndexEntry {
  return (
    isRecord(value) &&
    typeof value.evidencePackId === "string" &&
    typeof value.generatedAt === "string" &&
    typeof value.relativePath === "string" &&
    typeof value.artifactCount === "number"
  );
}

function normalizeIndex(value: unknown): GovernanceEvidenceIndex {
  if (!isRecord(value) || !Array.isArray(value.entries)) {
    return { version: 1, updatedAt: EMPTY_UPDATED_AT, entries: [] };
  }
  return updateGovernanceEvidenceIndex(
    {
      version: 1,
      updatedAt: stringValue(value.updatedAt) ?? EMPTY_UPDATED_AT,
      entries: value.entries.filter(isValidEntry)
    },
    null
  );
}

export function getGovernanceEvidenceIndexPath(projectRoot: string): string {
  return path.join(projectRoot, ".factory", "evidence-index.json");
}

export function loadGovernanceEvidenceIndex(projectRoot: string): GovernanceEvidenceIndex {
  const indexPath = getGovernanceEvidenceIndexPath(projectRoot);
  if (!fs.pathExistsSync(indexPath)) {
    return { version: 1, updatedAt: EMPTY_UPDATED_AT, entries: [] };
  }
  try {
    return normalizeIndex(fs.readJsonSync(indexPath));
  } catch {
    return { version: 1, updatedAt: EMPTY_UPDATED_AT, entries: [] };
  }
}

export function saveGovernanceEvidenceIndex(projectRoot: string, index: GovernanceEvidenceIndex): void {
  const indexPath = getGovernanceEvidenceIndexPath(projectRoot);
  const saved: GovernanceEvidenceIndex = {
    version: 1,
    updatedAt: new Date().toISOString(),
    entries: updateGovernanceEvidenceIndex(index, null).entries
  };
  fs.ensureDirSync(path.dirname(indexPath));
  fs.writeFileSync(indexPath, `${JSON.stringify(saved, null, 2)}\n`, "utf8");
}

export function buildGovernanceEvidenceIndexEntry(input: {
  manifest: GovernanceEvidencePackManifest;
  evidencePack?: GovernanceEvidencePackResult;
}): GovernanceEvidenceIndexEntry {
  const summary = input.manifest.governanceSummary;
  return {
    evidencePackId: input.manifest.evidencePackId,
    generatedAt: input.manifest.generatedAt,
    relativePath: input.evidencePack?.outputDirectory ?? normalizeSlash(path.dirname(input.manifest.includedArtifacts[0]?.relativePath ?? "")),
    policyMode: summary.policyMode,
    escalationLevel: summary.escalationLevel,
    stabilityLevel: summary.stabilityLevel,
    stabilityScore: summary.stabilityScore,
    driftSeverity: summary.driftSeverity,
    trendHealth: summary.trendHealth,
    artifactCount: input.evidencePack?.generatedFiles.length ?? input.manifest.includedArtifacts.length + 1
  };
}

export function updateGovernanceEvidenceIndex(
  index: GovernanceEvidenceIndex,
  entry: GovernanceEvidenceIndexEntry | null
): GovernanceEvidenceIndex {
  const entries = (Array.isArray(index.entries) ? index.entries : []).filter(isValidEntry);
  const nextEntries = entry === null
    ? entries
    : [...entries.filter((existing) => existing.evidencePackId !== entry.evidencePackId), entry];
  nextEntries.sort((a, b) => b.generatedAt.localeCompare(a.generatedAt) || b.evidencePackId.localeCompare(a.evidencePackId));
  return {
    version: 1,
    updatedAt: index.updatedAt || EMPTY_UPDATED_AT,
    entries: nextEntries
  };
}

export function readGovernanceEvidenceManifest(projectRoot: string, manifestPath: string): GovernanceEvidencePackManifest {
  const resolved = path.resolve(projectRoot, manifestPath);
  const relative = path.relative(projectRoot, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Evidence manifest path must stay within the project root.");
  }
  return fs.readJsonSync(resolved) as GovernanceEvidencePackManifest;
}

function normalizeLimit(limit?: number): number {
  if (typeof limit !== "number" || !Number.isInteger(limit) || limit <= 0) return DEFAULT_LIMIT;
  return Math.min(limit, MAX_LIMIT);
}

export function filterGovernanceEvidenceIndex(
  index: GovernanceEvidenceIndex,
  options: GovernanceEvidenceIndexFilterOptions = {}
): GovernanceEvidenceIndex {
  let entries = updateGovernanceEvidenceIndex(index, null).entries;
  if (options.policyMode) {
    entries = entries.filter((entry) => entry.policyMode === options.policyMode);
  }
  if (options.escalationLevel) {
    entries = entries.filter((entry) => entry.escalationLevel === options.escalationLevel);
  }
  const limit = options.latestOnly ? 1 : normalizeLimit(options.limit);
  entries = entries.slice(0, limit);
  return {
    version: 1,
    updatedAt: index.updatedAt,
    entries
  };
}

function formatValue(value: unknown): string {
  if (value === undefined || value === null || value === "") return "-";
  return String(value);
}

export function renderGovernanceEvidenceIndexMarkdown(index: GovernanceEvidenceIndex): string {
  if (index.entries.length === 0) {
    return [
      "# AI Software Factory - Governance Evidence Registry",
      "",
      "No governance evidence packs are registered.",
      ""
    ].join("\n");
  }

  const lines = [
    "# AI Software Factory - Governance Evidence Registry",
    "",
    "Total evidence packs:",
    String(index.entries.length),
    "",
    "## Evidence Packs",
    "",
    "| ID | Generated | Policy | Escalation | Stability | Score |",
    "|---|---|---|---|---|---|"
  ];

  for (const entry of index.entries) {
    lines.push(
      `| ${entry.evidencePackId} | ${entry.generatedAt.slice(0, 10)} | ${formatValue(entry.policyMode)} | ${formatValue(entry.escalationLevel)} | ${formatValue(entry.stabilityLevel)} | ${formatValue(numberValue(entry.stabilityScore))} |`
    );
  }

  return `${lines.join("\n")}\n`;
}

export function renderGovernanceEvidenceIndexText(index: GovernanceEvidenceIndex): string {
  return renderGovernanceEvidenceIndexMarkdown(index);
}
