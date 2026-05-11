import fs from "fs-extra";
import path from "node:path";

import {
  buildGovernanceConfigActivationPlan,
  type GovernanceConfigActivationPlan
} from "./configActivationPlan.js";

export type GovernanceConfigLoadPreview = {
  schemaVersion: 1;
  configStatus: "missing" | "valid" | "invalid";
  loadStatus: "not-loaded" | "loaded-for-preview" | "blocked";
  applied: false;
  runtimeBehaviorChanged: false;
  governanceDecisionsChanged: false;
  repairOrchestrationChanged: false;
  loadedSnapshot: {
    schemaVersion: number;
    source: "governance-config";
    normalizedAt: string;
    safeOverrideKeys: string[];
    blockedKeys: string[];
    values: Record<string, unknown>;
  } | null;
  blockedOptions: {
    key: string;
    reason: string;
  }[];
  warnings: string[];
  requiredBeforeActivation: string[];
  recommendedNextStage: "fix-config" | "continue-preview-only" | "prepare-snapshot-lock" | "blocked";
};

const CONFIG_PATH = ".factory/governance.config.json";
const ARTIFACT_JSON_PATH = ".factory/governance/config-load-preview.json";
const ARTIFACT_MARKDOWN_PATH = ".factory/governance/config-load-preview.md";
const NORMALIZED_AT = "deterministic-preview";

function readConfig(projectRoot: string): Record<string, unknown> | null {
  const configPath = path.join(projectRoot, CONFIG_PATH);
  if (!fs.existsSync(configPath)) {
    return null;
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(configPath, "utf8"));
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function valueAtPath(config: Record<string, unknown>, dottedPath: string): unknown {
  let current: unknown = config;
  for (const segment of dottedPath.split(".")) {
    if (typeof current !== "object" || current === null || Array.isArray(current)) {
      return null;
    }
    current = (current as Record<string, unknown>)[segment];
  }
  return current ?? null;
}

function buildSnapshot(
  projectRoot: string,
  plan: GovernanceConfigActivationPlan
): GovernanceConfigLoadPreview["loadedSnapshot"] {
  const config = readConfig(projectRoot);
  if (config === null) {
    return null;
  }
  const safeOverrideKeys = plan.candidateOverrides.map((override) => override.key).sort();
  const values: Record<string, unknown> = {};
  for (const key of safeOverrideKeys) {
    values[key] = valueAtPath(config, key);
  }
  return {
    schemaVersion: 1,
    source: "governance-config",
    normalizedAt: NORMALIZED_AT,
    safeOverrideKeys,
    blockedKeys: plan.blockedOptions.map((blocked) => blocked.key).sort(),
    values
  };
}

function buildWarnings(plan: GovernanceConfigActivationPlan, loaded: boolean): string[] {
  const warnings = [...plan.warnings];
  if (loaded) {
    warnings.push("Governance config was loaded for preview only.");
  }
  warnings.push("Runtime behavior did not change.");
  warnings.push("Governance decisions did not change.");
  warnings.push("Repair orchestration did not change.");
  return Array.from(new Set(warnings));
}

export function buildGovernanceConfigLoadPreview(projectRoot: string): GovernanceConfigLoadPreview {
  const plan = buildGovernanceConfigActivationPlan(projectRoot);
  const canLoad = plan.configStatus === "valid" && plan.blockedOptions.length === 0;
  const loadStatus: GovernanceConfigLoadPreview["loadStatus"] =
    plan.configStatus === "missing"
      ? "not-loaded"
      : canLoad
        ? "loaded-for-preview"
        : "blocked";
  const loadedSnapshot = canLoad ? buildSnapshot(projectRoot, plan) : null;
  const recommendedNextStage: GovernanceConfigLoadPreview["recommendedNextStage"] =
    plan.configStatus === "missing"
      ? "continue-preview-only"
      : plan.configStatus === "invalid"
        ? "fix-config"
        : canLoad
          ? "prepare-snapshot-lock"
          : "blocked";

  return {
    schemaVersion: 1,
    configStatus: plan.configStatus,
    loadStatus,
    applied: false,
    runtimeBehaviorChanged: false,
    governanceDecisionsChanged: false,
    repairOrchestrationChanged: false,
    loadedSnapshot,
    blockedOptions: plan.blockedOptions,
    warnings: buildWarnings(plan, canLoad),
    requiredBeforeActivation: [
      "Config snapshot must remain deterministic.",
      "Snapshot lock must be reviewed before runtime activation.",
      "Runtime config loading must remain disabled until activation is explicitly implemented.",
      "Governance thresholds and repair orchestration must remain unchanged during preview loading."
    ],
    recommendedNextStage
  };
}

export function writeGovernanceConfigLoadPreviewArtifacts(
  projectRoot: string,
  preview: GovernanceConfigLoadPreview
): { jsonPath: string; markdownPath: string } {
  const jsonPath = path.join(projectRoot, ARTIFACT_JSON_PATH);
  const markdownPath = path.join(projectRoot, ARTIFACT_MARKDOWN_PATH);
  fs.ensureDirSync(path.dirname(jsonPath));
  fs.writeFileSync(jsonPath, `${JSON.stringify(preview, null, 2)}\n`, "utf8");
  fs.writeFileSync(markdownPath, renderGovernanceConfigLoadPreviewText(preview), "utf8");
  return {
    jsonPath: ARTIFACT_JSON_PATH,
    markdownPath: ARTIFACT_MARKDOWN_PATH
  };
}

export function renderGovernanceConfigLoadPreviewText(preview: GovernanceConfigLoadPreview): string {
  const lines = [
    "# AI Software Factory - Governance Config Load Preview",
    "",
    "Config status:",
    preview.configStatus,
    "",
    "Load status:",
    preview.loadStatus,
    "",
    "Applied:",
    String(preview.applied),
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
    "Recommended next stage:",
    preview.recommendedNextStage,
    "",
    "## Safe Override Keys",
    ""
  ];

  const safeKeys = preview.loadedSnapshot?.safeOverrideKeys ?? [];
  if (safeKeys.length === 0) {
    lines.push("- none");
  } else {
    for (const key of safeKeys) {
      lines.push(`- ${key}`);
    }
  }

  lines.push("", "## Blocked Keys", "");
  const blockedKeys = preview.loadedSnapshot?.blockedKeys ?? preview.blockedOptions.map((blocked) => blocked.key);
  if (blockedKeys.length === 0) {
    lines.push("- none");
  } else {
    for (const key of blockedKeys) {
      lines.push(`- ${key}`);
    }
  }

  lines.push("", "## Warnings", "");
  for (const warning of preview.warnings) {
    lines.push(`- ${warning}`);
  }

  lines.push("", "## Required Before Activation", "");
  for (const check of preview.requiredBeforeActivation) {
    lines.push(`- ${check}`);
  }

  return `${lines.join("\n")}\n`;
}
