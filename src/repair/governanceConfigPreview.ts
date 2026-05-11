import { listGovernancePolicyProfiles } from "./governancePolicyProfile.js";

export type GovernanceConfigPreview = {
  version: 1;
  defaultPolicyProfile: string;
  availablePolicyProfiles: Array<{
    name: string;
    operatorMode: string;
    riskTolerance: string;
    thresholds: Record<string, number>;
  }>;
  commandBoundaries: {
    readOnlyCommands: string[];
    exportWritingCommands: string[];
    indexUpdatingCommands: string[];
  };
  dataPaths: {
    runsIndex: string;
    archiveIndex: string;
    evidenceIndex: string;
    exportsDirectory: string;
    archiveDirectory: string;
    evidencePacksDirectory: string;
    futureConfigPath: string;
  };
  notes: string[];
  generatedAt: string;
};

const GENERATED_AT = "1970-01-01T00:00:00.000Z";

export function buildGovernanceConfigPreview(): GovernanceConfigPreview {
  return {
    version: 1,
    defaultPolicyProfile: "balanced",
    availablePolicyProfiles: listGovernancePolicyProfiles().map((profile) => ({
      name: profile.name,
      operatorMode: profile.labels.operatorMode,
      riskTolerance: profile.labels.riskTolerance,
      thresholds: { ...profile.thresholds }
    })),
    commandBoundaries: {
      readOnlyCommands: [
        "runs",
        "archive",
        "archive diff",
        "insights",
        "ci-summary",
        "trends",
        "drift",
        "stability",
        "escalation",
        "policy",
        "decision-matrix",
        "evidence-list",
        "evidence-diff",
        "governance",
        "governance config"
      ],
      exportWritingCommands: [
        "runs --export",
        "insights --export",
        "ci-summary --export",
        "evidence-pack"
      ],
      indexUpdatingCommands: [
        "runs --export --archive",
        "insights --export --archive",
        "ci-summary --export --archive",
        "evidence-pack"
      ]
    },
    dataPaths: {
      runsIndex: ".factory/runs-index.json",
      archiveIndex: ".factory/archive-index.json",
      evidenceIndex: ".factory/evidence-index.json",
      exportsDirectory: ".factory/exports",
      archiveDirectory: ".factory/archive",
      evidencePacksDirectory: ".factory/evidence-packs",
      futureConfigPath: ".factory/governance.config.json"
    },
    notes: [
      "Governance config preview is read-only.",
      ".factory/governance.config.json is reserved for future versions.",
      "v5.2 does not load or enforce external configuration.",
      "Current governance behavior remains fully deterministic and static."
    ],
    generatedAt: GENERATED_AT
  };
}

export function renderGovernanceConfigPreviewMarkdown(preview: GovernanceConfigPreview): string {
  const lines = [
    "# AI Software Factory - Governance Config Preview",
    "",
    "Default policy profile:",
    preview.defaultPolicyProfile,
    "",
    "Future config path:",
    preview.dataPaths.futureConfigPath,
    "",
    "## Policy Profiles",
    "",
    "| Profile | Operator Mode | Risk Tolerance |",
    "|---|---|---|"
  ];

  for (const profile of preview.availablePolicyProfiles) {
    lines.push(`| ${profile.name} | ${profile.operatorMode} | ${profile.riskTolerance} |`);
  }

  lines.push("", "## Command Boundaries", "", "### Read-only commands", "");
  for (const command of preview.commandBoundaries.readOnlyCommands) {
    lines.push(`- ${command}`);
  }

  lines.push("", "### Export-writing commands", "");
  for (const command of preview.commandBoundaries.exportWritingCommands) {
    lines.push(`- ${command}`);
  }

  lines.push("", "### Index-updating commands", "");
  for (const command of preview.commandBoundaries.indexUpdatingCommands) {
    lines.push(`- ${command}`);
  }

  lines.push(
    "",
    "## Data Paths",
    "",
    `- runs index: ${preview.dataPaths.runsIndex}`,
    `- archive index: ${preview.dataPaths.archiveIndex}`,
    `- evidence index: ${preview.dataPaths.evidenceIndex}`,
    `- exports directory: ${preview.dataPaths.exportsDirectory}`,
    `- archive directory: ${preview.dataPaths.archiveDirectory}`,
    `- evidence packs directory: ${preview.dataPaths.evidencePacksDirectory}`,
    `- future config path: ${preview.dataPaths.futureConfigPath}`,
    "",
    "## Notes",
    ""
  );

  for (const note of preview.notes) {
    lines.push(`- ${note}`);
  }

  return `${lines.join("\n")}\n`;
}

export function renderGovernanceConfigPreviewText(preview: GovernanceConfigPreview): string {
  return renderGovernanceConfigPreviewMarkdown(preview);
}
