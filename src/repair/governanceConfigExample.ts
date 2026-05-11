import fs from "fs-extra";
import path from "node:path";

import { buildGovernanceConfigPreview } from "./governanceConfigPreview.js";
import { listGovernancePolicyProfiles } from "./governancePolicyProfile.js";

export type GovernanceConfigExample = {
  version: 1;
  configStatus: "example-only";
  defaultPolicyProfile: "balanced";
  policyProfiles: {
    conservative: {
      enabled: boolean;
      description: string;
      thresholds: Record<string, number>;
    };
    balanced: {
      enabled: boolean;
      description: string;
      thresholds: Record<string, number>;
    };
    experimental: {
      enabled: boolean;
      description: string;
      thresholds: Record<string, number>;
    };
  };
  commandPolicies: {
    readOnlyCommands: string[];
    exportWritingCommands: string[];
    indexUpdatingCommands: string[];
  };
  futureRuntimeOptions: {
    allowRuntimeConfigLoading: false;
    allowPolicyOverride: false;
    allowAutomaticEnforcement: false;
    allowNotifications: false;
  };
  notes: string[];
};

export type GovernanceConfigExampleWriteResult = {
  written: boolean;
  path: string;
  warnings: string[];
};

export function buildGovernanceConfigExample(): GovernanceConfigExample {
  const preview = buildGovernanceConfigPreview();
  const profiles = listGovernancePolicyProfiles();
  const byName = Object.fromEntries(profiles.map((profile) => [profile.name, profile]));

  return {
    version: 1,
    configStatus: "example-only",
    defaultPolicyProfile: "balanced",
    policyProfiles: {
      conservative: {
        enabled: true,
        description: byName.conservative.description,
        thresholds: { ...byName.conservative.thresholds }
      },
      balanced: {
        enabled: true,
        description: byName.balanced.description,
        thresholds: { ...byName.balanced.thresholds }
      },
      experimental: {
        enabled: true,
        description: byName.experimental.description,
        thresholds: { ...byName.experimental.thresholds }
      }
    },
    commandPolicies: {
      readOnlyCommands: [...preview.commandBoundaries.readOnlyCommands],
      exportWritingCommands: [...preview.commandBoundaries.exportWritingCommands],
      indexUpdatingCommands: [...preview.commandBoundaries.indexUpdatingCommands]
    },
    futureRuntimeOptions: {
      allowRuntimeConfigLoading: false,
      allowPolicyOverride: false,
      allowAutomaticEnforcement: false,
      allowNotifications: false
    },
    notes: [
      "This is an example-only governance config draft.",
      ".factory/governance.config.json is not loaded or enforced in v5.3.",
      "Current governance behavior remains fully deterministic and static.",
      "Do not use this file as active runtime configuration yet."
    ]
  };
}

export function renderGovernanceConfigExampleMarkdown(example: GovernanceConfigExample): string {
  const lines = [
    "# AI Software Factory - Governance Config Example",
    "",
    "Config status:",
    example.configStatus,
    "",
    "Default policy profile:",
    example.defaultPolicyProfile,
    "",
    "Future active config path:",
    ".factory/governance.config.json",
    "",
    "Example output path:",
    ".factory/governance.config.example.json",
    "",
    "## Policy Profiles",
    "",
    "| Profile | Enabled | Description |",
    "|---|---|---|"
  ];

  for (const name of ["conservative", "balanced", "experimental"] as const) {
    const profile = example.policyProfiles[name];
    lines.push(`| ${name} | ${profile.enabled} | ${profile.description} |`);
  }

  lines.push("", "## Future Runtime Options", "");
  lines.push(`- allow runtime config loading: ${example.futureRuntimeOptions.allowRuntimeConfigLoading}`);
  lines.push(`- allow policy override: ${example.futureRuntimeOptions.allowPolicyOverride}`);
  lines.push(`- allow automatic enforcement: ${example.futureRuntimeOptions.allowAutomaticEnforcement}`);
  lines.push(`- allow notifications: ${example.futureRuntimeOptions.allowNotifications}`);

  lines.push("", "## Command Policies", "", "### Read-only commands", "");
  for (const command of example.commandPolicies.readOnlyCommands) {
    lines.push(`- ${command}`);
  }

  lines.push("", "### Export-writing commands", "");
  for (const command of example.commandPolicies.exportWritingCommands) {
    lines.push(`- ${command}`);
  }

  lines.push("", "### Index-updating commands", "");
  for (const command of example.commandPolicies.indexUpdatingCommands) {
    lines.push(`- ${command}`);
  }

  lines.push("", "## Notes", "");
  for (const note of example.notes) {
    lines.push(`- ${note}`);
  }

  return `${lines.join("\n")}\n`;
}

export function writeGovernanceConfigExample(projectRoot: string): GovernanceConfigExampleWriteResult {
  const relativePath = ".factory/governance.config.example.json";
  const targetPath = path.join(projectRoot, relativePath);
  const example = buildGovernanceConfigExample();

  fs.ensureDirSync(path.dirname(targetPath));
  fs.writeFileSync(targetPath, `${JSON.stringify(example, null, 2)}\n`, "utf8");

  return {
    written: true,
    path: relativePath,
    warnings: []
  };
}
