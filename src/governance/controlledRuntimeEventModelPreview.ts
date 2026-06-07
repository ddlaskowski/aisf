import type { GovernanceMetadata } from "./governanceMetadata.js";
import { normalizeWarnings, sortDeterministically } from "./utils/governanceUtils.js";

export type ControlledRuntimeEventCategory =
  | "request-events"
  | "contract-events"
  | "flow-events"
  | "approval-events"
  | "generation-events"
  | "validation-events"
  | "review-events"
  | "export-events"
  | "audit-events"
  | "completion-events"
  | "error-events";

export type ControlledRuntimeEventEmissionPolicy =
  | "no-emission"
  | "preview-only"
  | "manual-approval-required"
  | "blocked"
  | "not-applicable";

export type ControlledRuntimeEventStatus =
  | "defined"
  | "preview-only"
  | "blocked"
  | "partial"
  | "not-started";

export type ControlledRuntimeEventRiskLevel = "low" | "medium" | "high" | "critical";
export type ControlledRuntimeEventPayloadFieldType = "string" | "boolean" | "number" | "object" | "array";
export type ControlledRuntimeEventVisibility = "internal-preview" | "human-review" | "audit-preview" | "readonly-summary";

export type ControlledRuntimeEventModelCompletenessLevel =
  | "incomplete"
  | "partial"
  | "event-model-defined"
  | "ready-for-observability-design";

export type ControlledRuntimeEventModelCompleteness = {
  score: number;
  level: ControlledRuntimeEventModelCompletenessLevel;
  reason: string;
};

export type ControlledRuntimeEventPayloadField = {
  fieldId: string;
  title: string;
  description: string;
  fieldType: ControlledRuntimeEventPayloadFieldType;
  required: boolean;
  visibility: ControlledRuntimeEventVisibility;
  riskLevel: ControlledRuntimeEventRiskLevel;
  readonly: boolean;
  previewOnly: boolean;
};

export type ControlledRuntimeEventLifecycleMarker = {
  markerId: string;
  title: string;
  description: string;
  phase: string;
  markerPolicy: ControlledRuntimeEventEmissionPolicy;
  readonly: boolean;
  previewOnly: boolean;
  noEmission: boolean;
  noExecution: boolean;
};

export type ControlledRuntimeEventDefinition = {
  eventId: string;
  category: ControlledRuntimeEventCategory;
  title: string;
  description: string;
  emissionPolicy: ControlledRuntimeEventEmissionPolicy;
  payloadFields: ControlledRuntimeEventPayloadField[];
  lifecycleMarkers: ControlledRuntimeEventLifecycleMarker[];
  riskLevel: ControlledRuntimeEventRiskLevel;
  status: ControlledRuntimeEventStatus;
  blockedReason: string | null;
  warnings: string[];
  recommendations: string[];
  readonly: boolean;
  previewOnly: boolean;
  noEmission: boolean;
  noPersistence: boolean;
  noExecution: boolean;
};

export type ControlledRuntimeEventModelSummary = {
  totalEvents: number;
  totalPayloadFields: number;
  totalLifecycleMarkers: number;
  blockedCount: number;
  previewOnlyCount: number;
  emissionPolicyDistribution: { key: ControlledRuntimeEventEmissionPolicy; totalEvents: number }[];
  riskDistribution: { key: ControlledRuntimeEventRiskLevel; totalEvents: number }[];
  readonly: boolean;
  previewOnly: boolean;
  noEmission: boolean;
  noPersistence: boolean;
  noExecution: boolean;
  completeness: ControlledRuntimeEventModelCompleteness;
  warnings: string[];
  recommendations: string[];
};

export type ControlledRuntimeEventModelPreview = {
  schemaVersion: 1;
  title: string;
  metadata: GovernanceMetadata;
  readonly: true;
  previewOnly: true;
  stdoutOnly: true;
  eventModelPreviewOnly: true;
  runtimeExecutionAllowed: false;
  runtimeActivationAllowed: false;
  runtimeRoutingAllowed: false;
  runtimeOrchestrationAllowed: false;
  runtimePersistenceAllowed: false;
  statePersistenceAllowed: false;
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
  events: ControlledRuntimeEventDefinition[];
  summary: ControlledRuntimeEventModelSummary;
};

export function createControlledRuntimeEventModelPreview(input: {
  title: string;
  metadata: GovernanceMetadata;
  events?: readonly ControlledRuntimeEventDefinition[];
}): ControlledRuntimeEventModelPreview {
  const events = sortRuntimeEventDefinitions(input.events ?? createDefaultRuntimeEventDefinitions());
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
    eventModelPreviewOnly: true,
    runtimeExecutionAllowed: false,
    runtimeActivationAllowed: false,
    runtimeRoutingAllowed: false,
    runtimeOrchestrationAllowed: false,
    runtimePersistenceAllowed: false,
    statePersistenceAllowed: false,
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
    events,
    summary: summarizeControlledRuntimeEventModelPreview(events)
  };
}

export function summarizeControlledRuntimeEventModelPreview(events: readonly ControlledRuntimeEventDefinition[]): ControlledRuntimeEventModelSummary {
  const sortedEvents = sortRuntimeEventDefinitions(events);
  return {
    totalEvents: sortedEvents.length,
    totalPayloadFields: sortedEvents.reduce((total, event) => total + event.payloadFields.length, 0),
    totalLifecycleMarkers: sortedEvents.reduce((total, event) => total + event.lifecycleMarkers.length, 0),
    blockedCount: findBlockedRuntimeEvents(sortedEvents).length,
    previewOnlyCount: findPreviewOnlyRuntimeEvents(sortedEvents).length,
    emissionPolicyDistribution: summarizeEmissionPolicies(sortedEvents),
    riskDistribution: summarizeEventRisks(sortedEvents),
    readonly: sortedEvents.length > 0 && sortedEvents.every((event) => event.readonly && event.payloadFields.every((field) => field.readonly) && event.lifecycleMarkers.every((marker) => marker.readonly)),
    previewOnly: sortedEvents.length > 0 && sortedEvents.every((event) => event.previewOnly && event.payloadFields.every((field) => field.previewOnly) && event.lifecycleMarkers.every((marker) => marker.previewOnly)),
    noEmission: sortedEvents.length > 0 && sortedEvents.every((event) => event.noEmission && event.lifecycleMarkers.every((marker) => marker.noEmission)),
    noPersistence: sortedEvents.length > 0 && sortedEvents.every((event) => event.noPersistence),
    noExecution: sortedEvents.length > 0 && sortedEvents.every((event) => event.noExecution && event.lifecycleMarkers.every((marker) => marker.noExecution)),
    completeness: calculateControlledRuntimeEventModelCompleteness(sortedEvents),
    warnings: normalizeWarnings([...sortedEvents.flatMap((event) => event.warnings), "Controlled runtime event model preview is descriptive only; no event emission, event bus, event listeners, runtime persistence, execution, routing, orchestration, or project generation is enabled."]),
    recommendations: normalizeWarnings([...sortedEvents.flatMap((event) => event.recommendations), "Require separate human-approved observability design before any future controlled runtime event implementation."])
  };
}

export function calculateControlledRuntimeEventModelCompleteness(events: readonly ControlledRuntimeEventDefinition[]): ControlledRuntimeEventModelCompleteness {
  if (events.length === 0) return { score: 0, level: "incomplete", reason: "Controlled runtime event model preview requires event definitions." };
  if (events.some((event) => event.status === "blocked" || event.emissionPolicy === "blocked" || event.blockedReason !== null || !event.readonly || !event.previewOnly || !event.noEmission || !event.noPersistence || !event.noExecution || event.lifecycleMarkers.some((marker) => !marker.noEmission || !marker.noExecution))) {
    return { score: 0, level: "incomplete", reason: "One or more event records are blocked or violate no-emission, no-persistence, or no-execution guarantees." };
  }
  const score = Math.round(events.reduce((total, event) => total + Math.min(statusScore(event.status), emissionPolicyScore(event.emissionPolicy)), 0) / events.length);
  return {
    score,
    level: score >= 90 ? "ready-for-observability-design" : score >= 75 ? "event-model-defined" : score >= 40 ? "partial" : "incomplete",
    reason: "Advisory runtime event model completeness score computed from deterministic preview-only event records."
  };
}

export function createRuntimeEventPayloadField(input: {
  fieldId: string;
  title: string;
  description: string;
  fieldType: ControlledRuntimeEventPayloadFieldType;
  required: boolean;
  visibility: ControlledRuntimeEventVisibility;
  riskLevel: ControlledRuntimeEventRiskLevel;
}): ControlledRuntimeEventPayloadField {
  return { ...input, readonly: true, previewOnly: true };
}

export function createRuntimeEventLifecycleMarker(input: {
  markerId: string;
  title: string;
  description: string;
  phase: string;
  markerPolicy: ControlledRuntimeEventEmissionPolicy;
}): ControlledRuntimeEventLifecycleMarker {
  return { ...input, readonly: true, previewOnly: true, noEmission: true, noExecution: true };
}

export function createRuntimeEventDefinition(input: {
  eventId: string;
  category: ControlledRuntimeEventCategory;
  title: string;
  description: string;
  emissionPolicy: ControlledRuntimeEventEmissionPolicy;
  payloadFields: readonly ControlledRuntimeEventPayloadField[];
  lifecycleMarkers: readonly ControlledRuntimeEventLifecycleMarker[];
  riskLevel: ControlledRuntimeEventRiskLevel;
  status: ControlledRuntimeEventStatus;
  blockedReason?: string | null;
  warnings?: readonly string[];
  recommendations?: readonly string[];
}): ControlledRuntimeEventDefinition {
  return {
    eventId: input.eventId,
    category: input.category,
    title: input.title,
    description: input.description,
    emissionPolicy: input.emissionPolicy,
    payloadFields: sortRuntimeEventPayloadFields(input.payloadFields),
    lifecycleMarkers: sortRuntimeEventLifecycleMarkers(input.lifecycleMarkers),
    riskLevel: input.riskLevel,
    status: input.status,
    blockedReason: input.blockedReason ?? null,
    warnings: normalizeWarnings(input.warnings ?? []),
    recommendations: normalizeWarnings(input.recommendations ?? []),
    readonly: true,
    previewOnly: true,
    noEmission: true,
    noPersistence: true,
    noExecution: true
  };
}

export function createDefaultRuntimeEventDefinitions(): ControlledRuntimeEventDefinition[] {
  const categories: ControlledRuntimeEventCategory[] = ["request-events", "contract-events", "flow-events", "approval-events", "generation-events", "validation-events", "review-events", "export-events", "audit-events", "completion-events", "error-events"];
  return categories.map((category, index) => createRuntimeEventDefinition({
    eventId: `controlled-runtime-event-${String(index + 1).padStart(3, "0")}`,
    category,
    title: `${category} preview event`,
    description: `Preview-only ${category} definition for future controlled runtime observability design.`,
    emissionPolicy: "no-emission",
    payloadFields: [
      createRuntimeEventPayloadField({ fieldId: `${category}-payload-001`, title: `${category} identifier`, description: "Deterministic preview identifier field.", fieldType: "string", required: true, visibility: "audit-preview", riskLevel: index === 3 || index === 4 ? "critical" : "medium" }),
      createRuntimeEventPayloadField({ fieldId: `${category}-payload-002`, title: `${category} summary`, description: "Readonly preview summary field.", fieldType: "object", required: false, visibility: "readonly-summary", riskLevel: "medium" })
    ],
    lifecycleMarkers: [
      createRuntimeEventLifecycleMarker({ markerId: `${category}-marker-001`, title: `${category} defined marker`, description: "Preview lifecycle marker only.", phase: category, markerPolicy: "no-emission" })
    ],
    riskLevel: index === 3 || index === 4 || category === "error-events" ? "critical" : index >= 8 ? "high" : "medium",
    status: "defined",
    warnings: [`${category} are not emitted by this preview.`]
  }));
}

export function sortRuntimeEventDefinitions(events: readonly ControlledRuntimeEventDefinition[]): ControlledRuntimeEventDefinition[] {
  return sortDeterministically(events, (event) => [categoryOrder(event.category), event.eventId].join("|"));
}

export function sortRuntimeEventPayloadFields(fields: readonly ControlledRuntimeEventPayloadField[]): ControlledRuntimeEventPayloadField[] {
  return sortDeterministically(fields, (field) => field.fieldId);
}

export function sortRuntimeEventLifecycleMarkers(markers: readonly ControlledRuntimeEventLifecycleMarker[]): ControlledRuntimeEventLifecycleMarker[] {
  return sortDeterministically(markers, (marker) => marker.markerId);
}

export function findRuntimeEventsByCategory(events: readonly ControlledRuntimeEventDefinition[], category: ControlledRuntimeEventCategory): ControlledRuntimeEventDefinition[] {
  return sortRuntimeEventDefinitions(events).filter((event) => event.category === category);
}

export function findRuntimeEventsByEmissionPolicy(events: readonly ControlledRuntimeEventDefinition[], emissionPolicy: ControlledRuntimeEventEmissionPolicy): ControlledRuntimeEventDefinition[] {
  return sortRuntimeEventDefinitions(events).filter((event) => event.emissionPolicy === emissionPolicy);
}

export function findBlockedRuntimeEvents(events: readonly ControlledRuntimeEventDefinition[]): ControlledRuntimeEventDefinition[] {
  return sortRuntimeEventDefinitions(events).filter((event) => event.status === "blocked" || event.emissionPolicy === "blocked" || event.blockedReason !== null);
}

export function findPreviewOnlyRuntimeEvents(events: readonly ControlledRuntimeEventDefinition[]): ControlledRuntimeEventDefinition[] {
  return sortRuntimeEventDefinitions(events).filter((event) => event.previewOnly || event.status === "preview-only" || event.emissionPolicy === "preview-only" || event.emissionPolicy === "no-emission");
}

function summarizeEmissionPolicies(events: readonly ControlledRuntimeEventDefinition[]): { key: ControlledRuntimeEventEmissionPolicy; totalEvents: number }[] {
  return (["no-emission", "preview-only", "manual-approval-required", "blocked", "not-applicable"] as const).map((policy) => ({ key: policy, totalEvents: events.filter((event) => event.emissionPolicy === policy).length })).filter((group) => group.totalEvents > 0);
}

function summarizeEventRisks(events: readonly ControlledRuntimeEventDefinition[]): { key: ControlledRuntimeEventRiskLevel; totalEvents: number }[] {
  return (["low", "medium", "high", "critical"] as const).map((riskLevel) => ({ key: riskLevel, totalEvents: events.filter((event) => event.riskLevel === riskLevel).length })).filter((group) => group.totalEvents > 0);
}

function statusScore(status: ControlledRuntimeEventStatus): number {
  if (status === "defined" || status === "preview-only") return 100;
  if (status === "partial") return 60;
  if (status === "not-started") return 20;
  return 0;
}

function emissionPolicyScore(policy: ControlledRuntimeEventEmissionPolicy): number {
  if (policy === "no-emission" || policy === "preview-only" || policy === "manual-approval-required" || policy === "not-applicable") return 100;
  return 0;
}

function categoryOrder(category: ControlledRuntimeEventCategory): string {
  const order = new Map<ControlledRuntimeEventCategory, number>([
    ["request-events", 1],
    ["contract-events", 2],
    ["flow-events", 3],
    ["approval-events", 4],
    ["generation-events", 5],
    ["validation-events", 6],
    ["review-events", 7],
    ["export-events", 8],
    ["audit-events", 9],
    ["completion-events", 10],
    ["error-events", 11]
  ]);
  return String(order.get(category) ?? 999).padStart(3, "0");
}
