import type { GovernanceMetadata } from "./governanceMetadata.js";
import { normalizeWarnings, sortDeterministically } from "./utils/governanceUtils.js";

export type ControlledRuntimeObservabilityCategory =
  | "intake-signals"
  | "contract-signals"
  | "flow-signals"
  | "approval-signals"
  | "generation-signals"
  | "validation-signals"
  | "review-signals"
  | "export-signals"
  | "audit-signals"
  | "error-signals"
  | "completion-signals";

export type ControlledRuntimeObservabilityCollectionPolicy =
  | "no-collection"
  | "preview-only"
  | "manual-approval-required"
  | "blocked"
  | "not-applicable";

export type ControlledRuntimeObservabilityStatus = "defined" | "preview-only" | "blocked" | "partial" | "not-started";
export type ControlledRuntimeObservabilityRiskLevel = "low" | "medium" | "high" | "critical";
export type ControlledRuntimeObservabilitySignalType = "metric" | "log" | "trace" | "health" | "audit" | "diagnostic";
export type ControlledRuntimeObservabilityVisibility = "internal-preview" | "human-review" | "audit-preview" | "readonly-summary";
export type ControlledRuntimeObservabilityCompletenessLevel = "incomplete" | "partial" | "observability-defined" | "ready-for-diagnostics-design";

export type ControlledRuntimeObservabilityCompleteness = {
  score: number;
  level: ControlledRuntimeObservabilityCompletenessLevel;
  reason: string;
};

export type ControlledRuntimeObservabilitySignal = {
  signalId: string;
  category: ControlledRuntimeObservabilityCategory;
  title: string;
  description: string;
  signalType: ControlledRuntimeObservabilitySignalType;
  collectionPolicy: ControlledRuntimeObservabilityCollectionPolicy;
  visibility: ControlledRuntimeObservabilityVisibility;
  riskLevel: ControlledRuntimeObservabilityRiskLevel;
  status: ControlledRuntimeObservabilityStatus;
  blockedReason: string | null;
  warnings: string[];
  recommendations: string[];
  readonly: boolean;
  previewOnly: boolean;
  noCollection: boolean;
  noPersistence: boolean;
  noExecution: boolean;
};

export type ControlledRuntimeMetricDefinition = ControlledRuntimeObservabilitySignal & { signalType: "metric" };
export type ControlledRuntimeLogDefinition = ControlledRuntimeObservabilitySignal & { signalType: "log" };
export type ControlledRuntimeTraceDefinition = ControlledRuntimeObservabilitySignal & { signalType: "trace" };
export type ControlledRuntimeHealthSignal = ControlledRuntimeObservabilitySignal & { signalType: "health" };
export type ControlledRuntimeAuditSignal = ControlledRuntimeObservabilitySignal & { signalType: "audit" | "diagnostic" };

export type ControlledRuntimeObservabilitySummary = {
  totalMetrics: number;
  totalLogs: number;
  totalTraces: number;
  totalHealthSignals: number;
  totalAuditSignals: number;
  blockedCount: number;
  previewOnlyCount: number;
  collectionPolicyDistribution: { key: ControlledRuntimeObservabilityCollectionPolicy; totalSignals: number }[];
  riskDistribution: { key: ControlledRuntimeObservabilityRiskLevel; totalSignals: number }[];
  readonly: boolean;
  previewOnly: boolean;
  noCollection: boolean;
  noPersistence: boolean;
  noExecution: boolean;
  completeness: ControlledRuntimeObservabilityCompleteness;
  warnings: string[];
  recommendations: string[];
};

export type ControlledRuntimeObservabilityPreview = {
  schemaVersion: 1;
  title: string;
  metadata: GovernanceMetadata;
  readonly: true;
  previewOnly: true;
  stdoutOnly: true;
  observabilityPreviewOnly: true;
  runtimeExecutionAllowed: false;
  runtimeActivationAllowed: false;
  runtimeRoutingAllowed: false;
  runtimeOrchestrationAllowed: false;
  runtimePersistenceAllowed: false;
  statePersistenceAllowed: false;
  telemetryCollectionAllowed: false;
  metricCollectionAllowed: false;
  logWritingAllowed: false;
  traceEmissionAllowed: false;
  eventEmissionAllowed: false;
  eventBusEnabled: false;
  eventListenersEnabled: false;
  flowExecutionAllowed: false;
  projectGenerationEnabled: false;
  builderAgentRuntimeEnabled: false;
  agentExecutionAllowed: false;
  approvalExecutionAllowed: false;
  mutationExecutionAllowed: false;
  inputExecutionAllowed: false;
  outputExecutionAllowed: false;
  contractExecutionAllowed: false;
  fileWriteAllowed: false;
  fileCreationAllowed: false;
  dependencyInstallationAllowed: false;
  packageMutationAllowed: false;
  generatedProjectValidationAllowed: false;
  policyEnforcementEnabled: false;
  governanceActivationAllowed: false;
  metrics: ControlledRuntimeMetricDefinition[];
  logs: ControlledRuntimeLogDefinition[];
  traces: ControlledRuntimeTraceDefinition[];
  healthSignals: ControlledRuntimeHealthSignal[];
  auditSignals: ControlledRuntimeAuditSignal[];
  summary: ControlledRuntimeObservabilitySummary;
};

export function createControlledRuntimeObservabilityPreview(input: {
  title: string;
  metadata: GovernanceMetadata;
  metrics?: readonly ControlledRuntimeMetricDefinition[];
  logs?: readonly ControlledRuntimeLogDefinition[];
  traces?: readonly ControlledRuntimeTraceDefinition[];
  healthSignals?: readonly ControlledRuntimeHealthSignal[];
  auditSignals?: readonly ControlledRuntimeAuditSignal[];
}): ControlledRuntimeObservabilityPreview {
  const metrics = sortRuntimeMetricDefinitions(input.metrics ?? createDefaultMetricDefinitions());
  const logs = sortRuntimeLogDefinitions(input.logs ?? createDefaultLogDefinitions());
  const traces = sortRuntimeTraceDefinitions(input.traces ?? createDefaultTraceDefinitions());
  const healthSignals = sortRuntimeHealthSignals(input.healthSignals ?? createDefaultHealthSignals());
  const auditSignals = sortRuntimeAuditSignals(input.auditSignals ?? createDefaultAuditSignals());
  return {
    schemaVersion: 1,
    title: input.title,
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
    observabilityPreviewOnly: true,
    runtimeExecutionAllowed: false,
    runtimeActivationAllowed: false,
    runtimeRoutingAllowed: false,
    runtimeOrchestrationAllowed: false,
    runtimePersistenceAllowed: false,
    statePersistenceAllowed: false,
    telemetryCollectionAllowed: false,
    metricCollectionAllowed: false,
    logWritingAllowed: false,
    traceEmissionAllowed: false,
    eventEmissionAllowed: false,
    eventBusEnabled: false,
    eventListenersEnabled: false,
    flowExecutionAllowed: false,
    projectGenerationEnabled: false,
    builderAgentRuntimeEnabled: false,
    agentExecutionAllowed: false,
    approvalExecutionAllowed: false,
    mutationExecutionAllowed: false,
    inputExecutionAllowed: false,
    outputExecutionAllowed: false,
    contractExecutionAllowed: false,
    fileWriteAllowed: false,
    fileCreationAllowed: false,
    dependencyInstallationAllowed: false,
    packageMutationAllowed: false,
    generatedProjectValidationAllowed: false,
    policyEnforcementEnabled: false,
    governanceActivationAllowed: false,
    metrics,
    logs,
    traces,
    healthSignals,
    auditSignals,
    summary: summarizeControlledRuntimeObservabilityPreview(metrics, logs, traces, healthSignals, auditSignals)
  };
}

export function summarizeControlledRuntimeObservabilityPreview(
  metrics: readonly ControlledRuntimeMetricDefinition[],
  logs: readonly ControlledRuntimeLogDefinition[],
  traces: readonly ControlledRuntimeTraceDefinition[],
  healthSignals: readonly ControlledRuntimeHealthSignal[],
  auditSignals: readonly ControlledRuntimeAuditSignal[]
): ControlledRuntimeObservabilitySummary {
  const signals = sortRuntimeObservabilitySignals([...metrics, ...logs, ...traces, ...healthSignals, ...auditSignals]);
  return {
    totalMetrics: metrics.length,
    totalLogs: logs.length,
    totalTraces: traces.length,
    totalHealthSignals: healthSignals.length,
    totalAuditSignals: auditSignals.length,
    blockedCount: findBlockedRuntimeObservabilitySignals(signals).length,
    previewOnlyCount: findPreviewOnlyRuntimeObservabilitySignals(signals).length,
    collectionPolicyDistribution: summarizeCollectionPolicies(signals),
    riskDistribution: summarizeRisks(signals),
    readonly: signals.length > 0 && signals.every((signal) => signal.readonly),
    previewOnly: signals.length > 0 && signals.every((signal) => signal.previewOnly),
    noCollection: signals.length > 0 && signals.every((signal) => signal.noCollection),
    noPersistence: signals.length > 0 && signals.every((signal) => signal.noPersistence),
    noExecution: signals.length > 0 && signals.every((signal) => signal.noExecution),
    completeness: calculateControlledRuntimeObservabilityCompleteness(signals),
    warnings: normalizeWarnings([...signals.flatMap((signal) => signal.warnings), "Controlled runtime observability preview is descriptive only; no telemetry collection, metric collection, log writing, trace emission, event emission, persistence, execution, routing, orchestration, or project generation is enabled."]),
    recommendations: normalizeWarnings([...signals.flatMap((signal) => signal.recommendations), "Require separate human-approved diagnostics design before any future controlled runtime observability implementation."])
  };
}

export function calculateControlledRuntimeObservabilityCompleteness(signals: readonly ControlledRuntimeObservabilitySignal[]): ControlledRuntimeObservabilityCompleteness {
  if (signals.length === 0) return { score: 0, level: "incomplete", reason: "Controlled runtime observability preview requires signal definitions." };
  if (signals.some((signal) => signal.status === "blocked" || signal.collectionPolicy === "blocked" || signal.blockedReason !== null || !signal.noCollection || !signal.noPersistence || !signal.noExecution)) {
    return { score: 0, level: "incomplete", reason: "One or more observability signals are blocked or violate no-collection, no-persistence, or no-execution guarantees." };
  }
  const score = Math.round(signals.reduce((total, signal) => total + Math.min(statusScore(signal.status), collectionPolicyScore(signal.collectionPolicy)), 0) / signals.length);
  return {
    score,
    level: score >= 90 ? "ready-for-diagnostics-design" : score >= 75 ? "observability-defined" : score >= 40 ? "partial" : "incomplete",
    reason: "Advisory runtime observability completeness score computed from deterministic preview-only signal records."
  };
}

export function createRuntimeMetricDefinition(input: OmitSignalInput): ControlledRuntimeMetricDefinition {
  return createSignal({ ...input, signalType: "metric" }) as ControlledRuntimeMetricDefinition;
}

export function createRuntimeLogDefinition(input: OmitSignalInput): ControlledRuntimeLogDefinition {
  return createSignal({ ...input, signalType: "log" }) as ControlledRuntimeLogDefinition;
}

export function createRuntimeTraceDefinition(input: OmitSignalInput): ControlledRuntimeTraceDefinition {
  return createSignal({ ...input, signalType: "trace" }) as ControlledRuntimeTraceDefinition;
}

export function createRuntimeHealthSignal(input: OmitSignalInput): ControlledRuntimeHealthSignal {
  return createSignal({ ...input, signalType: "health" }) as ControlledRuntimeHealthSignal;
}

export function createRuntimeAuditSignal(input: OmitSignalInput & { signalType?: "audit" | "diagnostic" }): ControlledRuntimeAuditSignal {
  return createSignal({ ...input, signalType: input.signalType ?? "audit" }) as ControlledRuntimeAuditSignal;
}

export function sortRuntimeMetricDefinitions(signals: readonly ControlledRuntimeMetricDefinition[]): ControlledRuntimeMetricDefinition[] {
  return sortRuntimeObservabilitySignals(signals) as ControlledRuntimeMetricDefinition[];
}

export function sortRuntimeLogDefinitions(signals: readonly ControlledRuntimeLogDefinition[]): ControlledRuntimeLogDefinition[] {
  return sortRuntimeObservabilitySignals(signals) as ControlledRuntimeLogDefinition[];
}

export function sortRuntimeTraceDefinitions(signals: readonly ControlledRuntimeTraceDefinition[]): ControlledRuntimeTraceDefinition[] {
  return sortRuntimeObservabilitySignals(signals) as ControlledRuntimeTraceDefinition[];
}

export function sortRuntimeHealthSignals(signals: readonly ControlledRuntimeHealthSignal[]): ControlledRuntimeHealthSignal[] {
  return sortRuntimeObservabilitySignals(signals) as ControlledRuntimeHealthSignal[];
}

export function sortRuntimeAuditSignals(signals: readonly ControlledRuntimeAuditSignal[]): ControlledRuntimeAuditSignal[] {
  return sortRuntimeObservabilitySignals(signals) as ControlledRuntimeAuditSignal[];
}

export function findRuntimeObservabilitySignalsByCategory(signals: readonly ControlledRuntimeObservabilitySignal[], category: ControlledRuntimeObservabilityCategory): ControlledRuntimeObservabilitySignal[] {
  return sortRuntimeObservabilitySignals(signals).filter((signal) => signal.category === category);
}

export function findRuntimeObservabilitySignalsByCollectionPolicy(signals: readonly ControlledRuntimeObservabilitySignal[], collectionPolicy: ControlledRuntimeObservabilityCollectionPolicy): ControlledRuntimeObservabilitySignal[] {
  return sortRuntimeObservabilitySignals(signals).filter((signal) => signal.collectionPolicy === collectionPolicy);
}

export function findBlockedRuntimeObservabilitySignals(signals: readonly ControlledRuntimeObservabilitySignal[]): ControlledRuntimeObservabilitySignal[] {
  return sortRuntimeObservabilitySignals(signals).filter((signal) => signal.status === "blocked" || signal.collectionPolicy === "blocked" || signal.blockedReason !== null);
}

export function findPreviewOnlyRuntimeObservabilitySignals(signals: readonly ControlledRuntimeObservabilitySignal[]): ControlledRuntimeObservabilitySignal[] {
  return sortRuntimeObservabilitySignals(signals).filter((signal) => signal.previewOnly || signal.status === "preview-only" || signal.collectionPolicy === "no-collection" || signal.collectionPolicy === "preview-only");
}

export function sortRuntimeObservabilitySignals(signals: readonly ControlledRuntimeObservabilitySignal[]): ControlledRuntimeObservabilitySignal[] {
  return sortDeterministically(signals, (signal) => [categoryOrder(signal.category), signalTypeOrder(signal.signalType), signal.signalId].join("|"));
}

type OmitSignalInput = {
  signalId: string;
  category: ControlledRuntimeObservabilityCategory;
  title: string;
  description: string;
  collectionPolicy?: ControlledRuntimeObservabilityCollectionPolicy;
  visibility?: ControlledRuntimeObservabilityVisibility;
  riskLevel: ControlledRuntimeObservabilityRiskLevel;
  status?: ControlledRuntimeObservabilityStatus;
  blockedReason?: string | null;
  warnings?: readonly string[];
  recommendations?: readonly string[];
};

function createSignal(input: OmitSignalInput & { signalType: ControlledRuntimeObservabilitySignalType }): ControlledRuntimeObservabilitySignal {
  return {
    signalId: input.signalId,
    category: input.category,
    title: input.title,
    description: input.description,
    signalType: input.signalType,
    collectionPolicy: input.collectionPolicy ?? "no-collection",
    visibility: input.visibility ?? "audit-preview",
    riskLevel: input.riskLevel,
    status: input.status ?? "defined",
    blockedReason: input.blockedReason ?? null,
    warnings: normalizeWarnings(input.warnings ?? []),
    recommendations: normalizeWarnings(input.recommendations ?? []),
    readonly: true,
    previewOnly: true,
    noCollection: true,
    noPersistence: true,
    noExecution: true
  };
}

function createDefaultMetricDefinitions(): ControlledRuntimeMetricDefinition[] {
  return categories().map((category, index) => createRuntimeMetricDefinition({ signalId: `${category}-metric-001`, category, title: `${category} metric preview`, description: "Preview-only metric definition.", riskLevel: riskForIndex(index), warnings: [`${category} metrics are not collected.`] }));
}

function createDefaultLogDefinitions(): ControlledRuntimeLogDefinition[] {
  return categories().map((category, index) => createRuntimeLogDefinition({ signalId: `${category}-log-001`, category, title: `${category} log preview`, description: "Preview-only log definition.", riskLevel: riskForIndex(index), warnings: [`${category} logs are not written.`] }));
}

function createDefaultTraceDefinitions(): ControlledRuntimeTraceDefinition[] {
  return categories().map((category, index) => createRuntimeTraceDefinition({ signalId: `${category}-trace-001`, category, title: `${category} trace preview`, description: "Preview-only trace definition.", riskLevel: riskForIndex(index), warnings: [`${category} traces are not emitted.`] }));
}

function createDefaultHealthSignals(): ControlledRuntimeHealthSignal[] {
  return categories().map((category, index) => createRuntimeHealthSignal({ signalId: `${category}-health-001`, category, title: `${category} health preview`, description: "Preview-only health signal definition.", riskLevel: riskForIndex(index), warnings: [`${category} health signals are not collected.`] }));
}

function createDefaultAuditSignals(): ControlledRuntimeAuditSignal[] {
  return categories().map((category, index) => createRuntimeAuditSignal({ signalId: `${category}-audit-001`, category, title: `${category} audit preview`, description: "Preview-only audit signal definition.", riskLevel: riskForIndex(index), warnings: [`${category} audit signals are not persisted.`] }));
}

function categories(): ControlledRuntimeObservabilityCategory[] {
  return ["intake-signals", "contract-signals", "flow-signals", "approval-signals", "generation-signals", "validation-signals", "review-signals", "export-signals", "audit-signals", "error-signals", "completion-signals"];
}

function summarizeCollectionPolicies(signals: readonly ControlledRuntimeObservabilitySignal[]): { key: ControlledRuntimeObservabilityCollectionPolicy; totalSignals: number }[] {
  return (["no-collection", "preview-only", "manual-approval-required", "blocked", "not-applicable"] as const).map((policy) => ({ key: policy, totalSignals: signals.filter((signal) => signal.collectionPolicy === policy).length })).filter((group) => group.totalSignals > 0);
}

function summarizeRisks(signals: readonly ControlledRuntimeObservabilitySignal[]): { key: ControlledRuntimeObservabilityRiskLevel; totalSignals: number }[] {
  return (["low", "medium", "high", "critical"] as const).map((riskLevel) => ({ key: riskLevel, totalSignals: signals.filter((signal) => signal.riskLevel === riskLevel).length })).filter((group) => group.totalSignals > 0);
}

function statusScore(status: ControlledRuntimeObservabilityStatus): number {
  if (status === "defined" || status === "preview-only") return 100;
  if (status === "partial") return 60;
  if (status === "not-started") return 20;
  return 0;
}

function collectionPolicyScore(policy: ControlledRuntimeObservabilityCollectionPolicy): number {
  if (policy === "no-collection" || policy === "preview-only" || policy === "manual-approval-required" || policy === "not-applicable") return 100;
  return 0;
}

function categoryOrder(category: ControlledRuntimeObservabilityCategory): string {
  const order = new Map<ControlledRuntimeObservabilityCategory, number>(categories().map((categoryName, index) => [categoryName, index + 1]));
  return String(order.get(category) ?? 999).padStart(3, "0");
}

function signalTypeOrder(signalType: ControlledRuntimeObservabilitySignalType): string {
  const order = new Map<ControlledRuntimeObservabilitySignalType, number>([["metric", 1], ["log", 2], ["trace", 3], ["health", 4], ["audit", 5], ["diagnostic", 6]]);
  return String(order.get(signalType) ?? 999).padStart(3, "0");
}

function riskForIndex(index: number): ControlledRuntimeObservabilityRiskLevel {
  if (index === 3 || index === 4 || index === 9) return "critical";
  if (index >= 8) return "high";
  return "medium";
}
