import type { GovernanceMetadata } from "../../governance/governanceMetadata.js";
import type { GovernanceStatus } from "../../governance/governanceStatus.js";
import { createReadonlyGuaranteeLabel, normalizeWarnings, sortDeterministically } from "../../governance/utils/governanceUtils.js";

export function renderCliSection(title: string, lines: readonly string[] = []): string {
  const body = lines.length === 0 ? ["none"] : [...lines];
  return [`${title}:`, ...body.map((line) => `  ${line}`)].join("\n");
}

export function renderCliStatus(label: string, status: GovernanceStatus): string {
  return `${label}: ${status}`;
}

export function renderCliStatusBlock(entries: Record<string, string | number | boolean>): string {
  const lines = Object.entries(entries)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `  ${key}: ${String(value)}`);
  return ["Status:", ...(lines.length === 0 ? ["  none"] : lines)].join("\n");
}

export function renderCliWarnings(warnings: readonly unknown[]): string {
  const normalized = normalizeWarnings(warnings);
  if (normalized.length === 0) return "Warnings: none";
  return ["Warnings:", ...normalized.map((warning) => `  - ${warning}`)].join("\n");
}

export function renderCliMetadata(metadata: GovernanceMetadata): string {
  const lines = Object.entries(metadata)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}: ${String(value)}`);
  return ["Metadata:", ...sortDeterministically(lines, (line) => line).map((line) => `  ${line}`)].join("\n");
}

export function renderReadonlyNotice(previewOnly = true): string {
  return createReadonlyGuaranteeLabel(previewOnly);
}

export function renderCliSummary(label: string, value: string): string {
  return `${label}: ${value}`;
}

export function renderCliDivider(): string {
  return "---";
}
