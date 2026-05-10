import path from "node:path";
import fs from "fs-extra";
import type { GovernanceArchiveKind, GovernanceArchiveResult } from "./governanceArchive.js";

export type { GovernanceArchiveKind } from "./governanceArchive.js";

export type GovernanceArchiveIndexEntry = {
  archiveId: string;
  createdAt: string;
  kind: GovernanceArchiveKind;
  archiveDir: string;
  files: string[];
  sourceCommand?: string;
  metadata?: {
    profile?: string;
    exportFormat?: string;
    ciStatus?: string;
    runCount?: number;
    displayedRuns?: number;
  };
};

export type GovernanceArchiveIndex = {
  version: 1;
  updatedAt: string;
  totalArchives: number;
  archives: GovernanceArchiveIndexEntry[];
};

export type BuildGovernanceArchiveIndexEntryInput = {
  archiveResult: GovernanceArchiveResult;
  kind: GovernanceArchiveKind;
  sourceCommand?: string;
  metadata?: GovernanceArchiveIndexEntry["metadata"];
  createdAt?: string;
};

export const GOVERNANCE_ARCHIVE_KINDS: GovernanceArchiveKind[] = [
  "runs-dashboard",
  "governance-insights",
  "governance-ci-summary"
];

const EMPTY_UPDATED_AT = "1970-01-01T00:00:00.000Z";

function normalizeSlash(value: string): string {
  return value.split(path.sep).join("/");
}

function normalizeRelativePath(value: string): string {
  return normalizeSlash(value).replace(/^\.\//, "");
}

function emptyIndex(): GovernanceArchiveIndex {
  return {
    version: 1,
    updatedAt: EMPTY_UPDATED_AT,
    totalArchives: 0,
    archives: []
  };
}

function createdAtFromArchiveId(archiveId: string): string {
  const match = archiveId.match(/^(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})-(\d{3})Z$/);
  if (!match) {
    return archiveId;
  }
  return `${match[1]}T${match[2]}:${match[3]}:${match[4]}.${match[5]}Z`;
}

function stableMetadata(metadata: GovernanceArchiveIndexEntry["metadata"]): GovernanceArchiveIndexEntry["metadata"] | undefined {
  if (!metadata) {
    return undefined;
  }

  const result: NonNullable<GovernanceArchiveIndexEntry["metadata"]> = {};
  if (metadata.profile !== undefined) result.profile = metadata.profile;
  if (metadata.exportFormat !== undefined) result.exportFormat = metadata.exportFormat;
  if (metadata.ciStatus !== undefined) result.ciStatus = metadata.ciStatus;
  if (typeof metadata.runCount === "number") result.runCount = metadata.runCount;
  if (typeof metadata.displayedRuns === "number") result.displayedRuns = metadata.displayedRuns;
  return Object.keys(result).length > 0 ? result : undefined;
}

function normalizeEntry(value: unknown): GovernanceArchiveIndexEntry | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const entry = value as Partial<GovernanceArchiveIndexEntry>;
  if (
    typeof entry.archiveId !== "string" ||
    typeof entry.createdAt !== "string" ||
    typeof entry.kind !== "string" ||
    !GOVERNANCE_ARCHIVE_KINDS.includes(entry.kind as GovernanceArchiveKind) ||
    typeof entry.archiveDir !== "string" ||
    !Array.isArray(entry.files)
  ) {
    return null;
  }

  const normalized: GovernanceArchiveIndexEntry = {
    archiveId: entry.archiveId,
    createdAt: entry.createdAt,
    kind: entry.kind as GovernanceArchiveKind,
    archiveDir: normalizeRelativePath(entry.archiveDir),
    files: entry.files.filter((file): file is string => typeof file === "string").map(normalizeRelativePath)
  };

  if (typeof entry.sourceCommand === "string") {
    normalized.sourceCommand = entry.sourceCommand;
  }

  const metadata = stableMetadata(entry.metadata);
  if (metadata) {
    normalized.metadata = metadata;
  }

  return normalized;
}

function normalizeIndex(value: unknown): GovernanceArchiveIndex {
  if (typeof value !== "object" || value === null || !Array.isArray((value as { archives?: unknown }).archives)) {
    return emptyIndex();
  }

  const raw = value as Partial<GovernanceArchiveIndex>;
  const archives = raw.archives?.map(normalizeEntry).filter((entry): entry is GovernanceArchiveIndexEntry => entry !== null) ?? [];
  const updatedAt = typeof raw.updatedAt === "string" ? raw.updatedAt : EMPTY_UPDATED_AT;
  return {
    version: 1,
    updatedAt,
    totalArchives: archives.length,
    archives: sortArchives(archives)
  };
}

function sortArchives(archives: GovernanceArchiveIndexEntry[]): GovernanceArchiveIndexEntry[] {
  return [...archives].sort((a, b) => {
    const createdOrder = b.createdAt.localeCompare(a.createdAt);
    if (createdOrder !== 0) return createdOrder;
    const archiveOrder = a.archiveId.localeCompare(b.archiveId);
    if (archiveOrder !== 0) return archiveOrder;
    return a.kind.localeCompare(b.kind);
  });
}

export function getGovernanceArchiveIndexPath(projectRoot: string): string {
  return path.join(projectRoot, ".factory", "archive-index.json");
}

export function loadGovernanceArchiveIndex(projectRoot: string): GovernanceArchiveIndex {
  const indexPath = getGovernanceArchiveIndexPath(projectRoot);
  if (!fs.pathExistsSync(indexPath)) {
    return emptyIndex();
  }

  try {
    return normalizeIndex(fs.readJsonSync(indexPath));
  } catch {
    return emptyIndex();
  }
}

export function saveGovernanceArchiveIndex(projectRoot: string, index: GovernanceArchiveIndex): void {
  const indexPath = getGovernanceArchiveIndexPath(projectRoot);
  fs.ensureDirSync(path.dirname(indexPath));
  const normalized = normalizeIndex(index);
  const toSave: GovernanceArchiveIndex = {
    ...normalized,
    updatedAt: new Date().toISOString(),
    totalArchives: normalized.archives.length
  };
  fs.writeFileSync(indexPath, `${JSON.stringify(toSave, null, 2)}\n`, "utf8");
}

export function buildGovernanceArchiveIndexEntry(
  input: BuildGovernanceArchiveIndexEntryInput
): GovernanceArchiveIndexEntry {
  const entry: GovernanceArchiveIndexEntry = {
    archiveId: input.archiveResult.archiveId,
    createdAt: input.createdAt ?? createdAtFromArchiveId(input.archiveResult.archiveId),
    kind: input.kind,
    archiveDir: normalizeRelativePath(input.archiveResult.archiveDir),
    files: input.archiveResult.files.map(normalizeRelativePath)
  };

  if (input.sourceCommand) {
    entry.sourceCommand = input.sourceCommand;
  }

  const metadata = stableMetadata(input.metadata);
  if (metadata) {
    entry.metadata = metadata;
  }

  return entry;
}

export function updateGovernanceArchiveIndex(
  index: GovernanceArchiveIndex,
  entry: GovernanceArchiveIndexEntry
): GovernanceArchiveIndex {
  const normalized = normalizeIndex(index);
  const archives = [
    ...normalized.archives.filter((item) => !(item.archiveId === entry.archiveId && item.kind === entry.kind)),
    entry
  ];
  const sorted = sortArchives(archives);

  return {
    version: 1,
    updatedAt: normalized.updatedAt,
    totalArchives: sorted.length,
    archives: sorted
  };
}
