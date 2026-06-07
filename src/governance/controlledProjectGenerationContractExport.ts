import type { GovernanceMetadata } from "./governanceMetadata.js";
import { normalizeWarnings } from "./utils/governanceUtils.js";
import {
  createControlledProjectGenerationContractAudit,
  type ControlledProjectGenerationContractAudit
} from "./controlledProjectGenerationContractAudit.js";
import {
  createControlledProjectGenerationContractBundle,
  type ControlledProjectGenerationContractBundle
} from "./controlledProjectGenerationContractBundle.js";
import {
  renderControlledProjectGenerationContractAudit,
  renderControlledProjectGenerationContractBundle
} from "./renderers/governanceRenderers.js";

export type ControlledProjectGenerationContractExportFormat = "json" | "markdown";

export type ControlledProjectGenerationContractExportDataType =
  | "contract-bundle"
  | "contract-audit"
  | "contract-stack";

export type ControlledProjectGenerationContractStack = {
  designContract: ControlledProjectGenerationContractBundle["designContract"];
  inputContract: ControlledProjectGenerationContractBundle["inputContract"];
  outputContract: ControlledProjectGenerationContractBundle["outputContract"];
  mutationBoundaryContract: ControlledProjectGenerationContractBundle["mutationBoundaryContract"];
  approvalBoundaryContract: ControlledProjectGenerationContractBundle["approvalBoundaryContract"];
  runtimeBoundaryContract: ControlledProjectGenerationContractBundle["runtimeBoundaryContract"];
  contractBundle: ControlledProjectGenerationContractBundle;
  contractAudit: ControlledProjectGenerationContractAudit;
};

export type ControlledProjectGenerationContractExportSummary = {
  format: ControlledProjectGenerationContractExportFormat;
  dataType: ControlledProjectGenerationContractExportDataType;
  includedContractSections: string[];
  readonly: boolean;
  previewOnly: boolean;
  stdoutOnly: boolean;
  fileWriteAllowed: false;
  contractExecutionAllowed: false;
  contractBundleExecutionAllowed: false;
  contractAuditExecutionAllowed: false;
  runtimeExecutionAllowed: false;
  runtimeActivationAllowed: false;
  runtimeRoutingAllowed: false;
  runtimePersistenceAllowed: false;
  projectGenerationEnabled: false;
  warnings: string[];
  recommendations: string[];
};

export type ControlledProjectGenerationContractExportPayload<T = unknown> = {
  schemaVersion: 1;
  title: string;
  format: ControlledProjectGenerationContractExportFormat;
  dataType: ControlledProjectGenerationContractExportDataType;
  metadata: GovernanceMetadata;
  readonly: true;
  previewOnly: true;
  stdoutOnly: true;
  fileWriteAllowed: false;
  contractExecutionAllowed: false;
  contractBundleExecutionAllowed: false;
  contractAuditExecutionAllowed: false;
  runtimeExecutionAllowed: false;
  runtimeActivationAllowed: false;
  runtimeRoutingAllowed: false;
  runtimePersistenceAllowed: false;
  approvalExecutionAllowed: false;
  approvalPersistenceAllowed: false;
  mutationExecutionAllowed: false;
  mutationExpansionAllowed: false;
  outputExecutionAllowed: false;
  inputExecutionAllowed: false;
  rollbackExecutionAllowed: false;
  recoveryExecutionAllowed: false;
  riskEnforcementAllowed: false;
  validationExecutionAllowed: false;
  dependencyInstallationAllowed: false;
  packageMutationAllowed: false;
  fileCreationAllowed: false;
  scaffoldGenerationEnabled: false;
  projectGenerationEnabled: false;
  builderAgentRuntimeEnabled: false;
  includedContractSections: string[];
  summary: ControlledProjectGenerationContractExportSummary;
  data: T;
};

export function createControlledProjectGenerationContractExportPayload<T>(input: {
  title: string;
  format: ControlledProjectGenerationContractExportFormat;
  dataType: ControlledProjectGenerationContractExportDataType;
  metadata: GovernanceMetadata;
  data: T;
  includedContractSections?: readonly string[];
}): ControlledProjectGenerationContractExportPayload<T> {
  const includedContractSections = normalizeWarnings(input.includedContractSections ?? createIncludedContractSections(input.dataType));
  const summary = summarizeControlledProjectGenerationContractExport(input.format, input.dataType, includedContractSections);
  return {
    schemaVersion: 1,
    title: input.title,
    format: input.format,
    dataType: input.dataType,
    metadata: {
      version: input.metadata.version,
      generatedAt: input.metadata.generatedAt,
      source: input.metadata.source,
      command: input.metadata.command,
      readonly: input.metadata.readonly,
      previewOnly: input.metadata.previewOnly
    },
    readonly: true,
    previewOnly: true,
    stdoutOnly: true,
    fileWriteAllowed: false,
    contractExecutionAllowed: false,
    contractBundleExecutionAllowed: false,
    contractAuditExecutionAllowed: false,
    runtimeExecutionAllowed: false,
    runtimeActivationAllowed: false,
    runtimeRoutingAllowed: false,
    runtimePersistenceAllowed: false,
    approvalExecutionAllowed: false,
    approvalPersistenceAllowed: false,
    mutationExecutionAllowed: false,
    mutationExpansionAllowed: false,
    outputExecutionAllowed: false,
    inputExecutionAllowed: false,
    rollbackExecutionAllowed: false,
    recoveryExecutionAllowed: false,
    riskEnforcementAllowed: false,
    validationExecutionAllowed: false,
    dependencyInstallationAllowed: false,
    packageMutationAllowed: false,
    fileCreationAllowed: false,
    scaffoldGenerationEnabled: false,
    projectGenerationEnabled: false,
    builderAgentRuntimeEnabled: false,
    includedContractSections,
    summary,
    data: input.data
  };
}

export function summarizeControlledProjectGenerationContractExport(
  format: ControlledProjectGenerationContractExportFormat,
  dataType: ControlledProjectGenerationContractExportDataType,
  includedContractSections: readonly string[] = createIncludedContractSections(dataType)
): ControlledProjectGenerationContractExportSummary {
  return {
    format,
    dataType,
    includedContractSections: normalizeWarnings(includedContractSections),
    readonly: true,
    previewOnly: true,
    stdoutOnly: true,
    fileWriteAllowed: false,
    contractExecutionAllowed: false,
    contractBundleExecutionAllowed: false,
    contractAuditExecutionAllowed: false,
    runtimeExecutionAllowed: false,
    runtimeActivationAllowed: false,
    runtimeRoutingAllowed: false,
    runtimePersistenceAllowed: false,
    projectGenerationEnabled: false,
    warnings: normalizeWarnings(["Controlled generation contract export is stdout-only and does not write files by default."]),
    recommendations: normalizeWarnings(["Use export previews for review dashboards and approval workflows only; require separate approval before any runtime-capable behavior exists."])
  };
}

export function exportControlledProjectGenerationContractBundleAsJson(
  bundle: ControlledProjectGenerationContractBundle,
  metadata: GovernanceMetadata
): string {
  return JSON.stringify(
    createControlledProjectGenerationContractExportPayload({
      title: "Controlled Project Generation Contract Bundle Export Preview",
      format: "json",
      dataType: "contract-bundle",
      metadata,
      data: bundle
    }),
    null,
    2
  );
}

export function exportControlledProjectGenerationContractBundleAsMarkdown(
  bundle: ControlledProjectGenerationContractBundle,
  metadata: GovernanceMetadata
): string {
  return renderMarkdownExport(
    createControlledProjectGenerationContractExportPayload({
      title: "Controlled Project Generation Contract Bundle Export Preview",
      format: "markdown",
      dataType: "contract-bundle",
      metadata,
      data: bundle
    }),
    renderControlledProjectGenerationContractBundle(bundle)
  );
}

export function exportControlledProjectGenerationContractAuditAsJson(
  audit: ControlledProjectGenerationContractAudit,
  metadata: GovernanceMetadata
): string {
  return JSON.stringify(
    createControlledProjectGenerationContractExportPayload({
      title: "Controlled Project Generation Contract Audit Export Preview",
      format: "json",
      dataType: "contract-audit",
      metadata,
      data: audit
    }),
    null,
    2
  );
}

export function exportControlledProjectGenerationContractAuditAsMarkdown(
  audit: ControlledProjectGenerationContractAudit,
  metadata: GovernanceMetadata
): string {
  return renderMarkdownExport(
    createControlledProjectGenerationContractExportPayload({
      title: "Controlled Project Generation Contract Audit Export Preview",
      format: "markdown",
      dataType: "contract-audit",
      metadata,
      data: audit
    }),
    renderControlledProjectGenerationContractAudit(audit)
  );
}

export function exportControlledProjectGenerationContractStackAsJson(
  stack: ControlledProjectGenerationContractStack,
  metadata: GovernanceMetadata
): string {
  return JSON.stringify(
    createControlledProjectGenerationContractExportPayload({
      title: "Controlled Project Generation Contract Stack Export Preview",
      format: "json",
      dataType: "contract-stack",
      metadata,
      data: stack
    }),
    null,
    2
  );
}

export function exportControlledProjectGenerationContractStackAsMarkdown(
  stack: ControlledProjectGenerationContractStack,
  metadata: GovernanceMetadata
): string {
  return renderMarkdownExport(
    createControlledProjectGenerationContractExportPayload({
      title: "Controlled Project Generation Contract Stack Export Preview",
      format: "markdown",
      dataType: "contract-stack",
      metadata,
      data: stack
    }),
    [
      renderControlledProjectGenerationContractBundle(stack.contractBundle),
      "",
      renderControlledProjectGenerationContractAudit(stack.contractAudit)
    ].join("\n")
  );
}

export function createControlledProjectGenerationContractStack(input?: {
  contractBundle?: ControlledProjectGenerationContractBundle;
  contractAudit?: ControlledProjectGenerationContractAudit;
}): ControlledProjectGenerationContractStack {
  const contractBundle = input?.contractBundle ?? createControlledProjectGenerationContractBundle({
    title: "Controlled Project Generation Contract Bundle",
    metadata: { version: "v12.6", source: "contract-export-stack", readonly: true, previewOnly: true }
  });
  const contractAudit = input?.contractAudit ?? createControlledProjectGenerationContractAudit({
    title: "Controlled Project Generation Contract Audit",
    metadata: { version: "v12.8", source: "contract-export-stack", readonly: true, previewOnly: true },
    contractBundle
  });
  return {
    designContract: contractBundle.designContract,
    inputContract: contractBundle.inputContract,
    outputContract: contractBundle.outputContract,
    mutationBoundaryContract: contractBundle.mutationBoundaryContract,
    approvalBoundaryContract: contractBundle.approvalBoundaryContract,
    runtimeBoundaryContract: contractBundle.runtimeBoundaryContract,
    contractBundle,
    contractAudit
  };
}

function renderMarkdownExport(payload: ControlledProjectGenerationContractExportPayload<unknown>, renderedData: string): string {
  return [
    `# ${payload.title}`,
    "",
    `- schemaVersion: ${payload.schemaVersion}`,
    `- format: ${payload.format}`,
    `- dataType: ${payload.dataType}`,
    `- readonly: ${String(payload.readonly)}`,
    `- previewOnly: ${String(payload.previewOnly)}`,
    `- stdoutOnly: ${String(payload.stdoutOnly)}`,
    `- fileWriteAllowed: ${String(payload.fileWriteAllowed)}`,
    `- contractExecutionAllowed: ${String(payload.contractExecutionAllowed)}`,
    `- contractBundleExecutionAllowed: ${String(payload.contractBundleExecutionAllowed)}`,
    `- contractAuditExecutionAllowed: ${String(payload.contractAuditExecutionAllowed)}`,
    `- runtimeExecutionAllowed: ${String(payload.runtimeExecutionAllowed)}`,
    `- runtimeActivationAllowed: ${String(payload.runtimeActivationAllowed)}`,
    `- runtimeRoutingAllowed: ${String(payload.runtimeRoutingAllowed)}`,
    `- runtimePersistenceAllowed: ${String(payload.runtimePersistenceAllowed)}`,
    `- projectGenerationEnabled: ${String(payload.projectGenerationEnabled)}`,
    "",
    "## Metadata",
    "",
    `- version: ${payload.metadata.version}`,
    `- source: ${payload.metadata.source ?? "none"}`,
    `- command: ${payload.metadata.command ?? "none"}`,
    `- readonly: ${String(payload.metadata.readonly ?? true)}`,
    `- previewOnly: ${String(payload.metadata.previewOnly ?? true)}`,
    "",
    "## Included Contract Sections",
    "",
    ...(payload.includedContractSections.length === 0 ? ["- none"] : payload.includedContractSections.map((section) => `- ${section}`)),
    "",
    "## Export Guarantees",
    "",
    "- stdout-only",
    "- no file writes by default",
    "- no contract execution",
    "- no contract bundle execution",
    "- no contract audit execution",
    "- no runtime execution",
    "- no project generation",
    "",
    "## Export Data",
    "",
    renderedData
  ].join("\n");
}

function createIncludedContractSections(dataType: ControlledProjectGenerationContractExportDataType): string[] {
  if (dataType === "contract-bundle") return normalizeWarnings(["contractBundle"]);
  if (dataType === "contract-audit") return normalizeWarnings(["contractAudit"]);
  return normalizeWarnings([
    "designContract",
    "inputContract",
    "outputContract",
    "mutationBoundaryContract",
    "approvalBoundaryContract",
    "runtimeBoundaryContract",
    "contractBundle",
    "contractAudit"
  ]);
}
