import type { GovernanceMetadata } from "./governanceMetadata.js";
import { normalizeWarnings, sortDeterministically } from "./utils/governanceUtils.js";

export type ControlledRuntimeStateCategory =
  | "requestState"
  | "contractState"
  | "flowState"
  | "approvalState"
  | "generationState"
  | "validationState"
  | "reviewState"
  | "exportState"
  | "auditState"
  | "completionState";

export type ControlledRuntimeStateStatus =
  | "defined"
  | "preview-only"
  | "blocked"
  | "partial"
  | "not-started";

export type ControlledRuntimeStatePersistencePolicy =
  | "no-persistence"
  | "preview-only"
  | "manual-approval-required"
  | "blocked"
  | "not-applicable";

export type ControlledRuntimeStateVisibility =
  | "internal-preview"
  | "human-review"
  | "audit-preview"
  | "readonly-summary";

export type ControlledRuntimeStateRiskLevel =
  | "low"
  | "medium"
  | "high"
  | "critical";

export type ControlledRuntimeStateModelCompletenessLevel =
  | "incomplete"
  | "partial"
  | "state-model-defined"
  | "ready-for-persistence-design";

export type ControlledRuntimeStateModelCompleteness = {
  score: number;
  level: ControlledRuntimeStateModelCompletenessLevel;
  reason: string;
};

export type ControlledRuntimeStateField = {
  fieldId: string;
  category: ControlledRuntimeStateCategory;
  title: string;
  description: string;
  status: ControlledRuntimeStateStatus;
  persistencePolicy: ControlledRuntimeStatePersistencePolicy;
  visibility: ControlledRuntimeStateVisibility;
  riskLevel: ControlledRuntimeStateRiskLevel;
  allowedWriters: string[];
  allowedReaders: string[];
  blockedReason: string | null;
  warnings: string[];
  recommendations: string[];
  readonly: boolean;
  previewOnly: boolean;
  noPersistence: boolean;
  noExecution: boolean;
};

export type ControlledRuntimeStateSnapshot = {
  snapshotId: string;
  title: string;
  category: ControlledRuntimeStateCategory;
  includedFields: string[];
  snapshotPolicy: ControlledRuntimeStatePersistencePolicy;
  persistencePolicy: ControlledRuntimeStatePersistencePolicy;
  readonly: boolean;
  previewOnly: boolean;
  noPersistence: boolean;
  noExecution: boolean;
};

export type ControlledRuntimeStateTransition = {
  transitionId: string;
  fromState: ControlledRuntimeStateCategory;
  toState: ControlledRuntimeStateCategory;
  trigger: string;
  transitionPolicy: ControlledRuntimeStatePersistencePolicy;
  readonly: boolean;
  previewOnly: boolean;
  noPersistence: boolean;
  noExecution: boolean;
};

export type ControlledRuntimeStateModelSummary = {
  totalFields: number;
  totalSnapshots: number;
  totalTransitions: number;
  blockedCount: number;
  previewOnlyCount: number;
  persistencePolicyDistribution: { key: ControlledRuntimeStatePersistencePolicy; totalFields: number }[];
  riskDistribution: { key: ControlledRuntimeStateRiskLevel; totalFields: number }[];
  readonly: boolean;
  previewOnly: boolean;
  noPersistence: boolean;
  noExecution: boolean;
  completeness: ControlledRuntimeStateModelCompleteness;
  warnings: string[];
  recommendations: string[];
};

export type ControlledRuntimeStateModelPreview = {
  schemaVersion: 1;
  title: string;
  metadata: GovernanceMetadata;
  readonly: true;
  previewOnly: true;
  stdoutOnly: true;
  stateModelPreviewOnly: true;
  runtimeExecutionAllowed: false;
  runtimeActivationAllowed: false;
  runtimeRoutingAllowed: false;
  runtimeOrchestrationAllowed: false;
  runtimePersistenceAllowed: false;
  statePersistenceAllowed: false;
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
  fields: ControlledRuntimeStateField[];
  snapshots: ControlledRuntimeStateSnapshot[];
  transitions: ControlledRuntimeStateTransition[];
  summary: ControlledRuntimeStateModelSummary;
};

export function createControlledRuntimeStateModelPreview(input: {
  title: string;
  metadata: GovernanceMetadata;
  fields?: readonly ControlledRuntimeStateField[];
  snapshots?: readonly ControlledRuntimeStateSnapshot[];
  transitions?: readonly ControlledRuntimeStateTransition[];
}): ControlledRuntimeStateModelPreview {
  const fields = sortRuntimeStateFields(input.fields ?? createDefaultRuntimeStateFields());
  const snapshots = sortRuntimeStateSnapshots(input.snapshots ?? createDefaultRuntimeStateSnapshots(fields));
  const transitions = sortRuntimeStateTransitions(input.transitions ?? createDefaultRuntimeStateTransitions());
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
    stateModelPreviewOnly: true,
    runtimeExecutionAllowed: false,
    runtimeActivationAllowed: false,
    runtimeRoutingAllowed: false,
    runtimeOrchestrationAllowed: false,
    runtimePersistenceAllowed: false,
    statePersistenceAllowed: false,
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
    fields,
    snapshots,
    transitions,
    summary: summarizeControlledRuntimeStateModelPreview(fields, snapshots, transitions)
  };
}

export function summarizeControlledRuntimeStateModelPreview(
  fields: readonly ControlledRuntimeStateField[],
  snapshots: readonly ControlledRuntimeStateSnapshot[],
  transitions: readonly ControlledRuntimeStateTransition[]
): ControlledRuntimeStateModelSummary {
  const sortedFields = sortRuntimeStateFields(fields);
  const sortedSnapshots = sortRuntimeStateSnapshots(snapshots);
  const sortedTransitions = sortRuntimeStateTransitions(transitions);
  return {
    totalFields: sortedFields.length,
    totalSnapshots: sortedSnapshots.length,
    totalTransitions: sortedTransitions.length,
    blockedCount: findBlockedRuntimeStateFields(sortedFields).length,
    previewOnlyCount: findPreviewOnlyRuntimeStateFields(sortedFields).length,
    persistencePolicyDistribution: summarizePersistencePolicies(sortedFields),
    riskDistribution: summarizeStateRisks(sortedFields),
    readonly: sortedFields.length > 0 && sortedFields.every((field) => field.readonly) && sortedSnapshots.every((snapshot) => snapshot.readonly) && sortedTransitions.every((transition) => transition.readonly),
    previewOnly: sortedFields.length > 0 && sortedFields.every((field) => field.previewOnly) && sortedSnapshots.every((snapshot) => snapshot.previewOnly) && sortedTransitions.every((transition) => transition.previewOnly),
    noPersistence: sortedFields.length > 0 && sortedFields.every((field) => field.noPersistence) && sortedSnapshots.every((snapshot) => snapshot.noPersistence) && sortedTransitions.every((transition) => transition.noPersistence),
    noExecution: sortedFields.length > 0 && sortedFields.every((field) => field.noExecution) && sortedSnapshots.every((snapshot) => snapshot.noExecution) && sortedTransitions.every((transition) => transition.noExecution),
    completeness: calculateControlledRuntimeStateModelCompleteness(sortedFields, sortedSnapshots, sortedTransitions),
    warnings: normalizeWarnings([...sortedFields.flatMap((field) => field.warnings), "Controlled runtime state model preview is descriptive only; no runtime persistence, state persistence, execution, routing, orchestration, or project generation is enabled."]),
    recommendations: normalizeWarnings([...sortedFields.flatMap((field) => field.recommendations), "Require separate human-approved persistence design before any future controlled runtime state implementation."])
  };
}

export function calculateControlledRuntimeStateModelCompleteness(
  fields: readonly ControlledRuntimeStateField[],
  snapshots: readonly ControlledRuntimeStateSnapshot[],
  transitions: readonly ControlledRuntimeStateTransition[]
): ControlledRuntimeStateModelCompleteness {
  if (fields.length === 0 || snapshots.length === 0 || transitions.length === 0) {
    return { score: 0, level: "incomplete", reason: "Controlled runtime state model preview requires field, snapshot, and transition records." };
  }
  if (
    fields.some((field) => field.status === "blocked" || field.persistencePolicy === "blocked" || field.blockedReason !== null || !field.readonly || !field.previewOnly || !field.noPersistence || !field.noExecution)
    || snapshots.some((snapshot) => snapshot.persistencePolicy === "blocked" || !snapshot.readonly || !snapshot.previewOnly || !snapshot.noPersistence || !snapshot.noExecution)
    || transitions.some((transition) => transition.transitionPolicy === "blocked" || !transition.readonly || !transition.previewOnly || !transition.noPersistence || !transition.noExecution)
  ) {
    return { score: 0, level: "incomplete", reason: "One or more state model records are blocked or violate read-only, preview-only, no-persistence, or no-execution guarantees." };
  }
  const fieldScore = fields.reduce((total, field) => total + Math.min(statusScore(field.status), persistencePolicyScore(field.persistencePolicy)), 0);
  const snapshotScore = snapshots.reduce((total, snapshot) => total + Math.min(persistencePolicyScore(snapshot.snapshotPolicy), persistencePolicyScore(snapshot.persistencePolicy)), 0);
  const transitionScore = transitions.reduce((total, transition) => total + persistencePolicyScore(transition.transitionPolicy), 0);
  const score = Math.round((fieldScore + snapshotScore + transitionScore) / (fields.length + snapshots.length + transitions.length));
  return {
    score,
    level: score >= 90 ? "ready-for-persistence-design" : score >= 75 ? "state-model-defined" : score >= 40 ? "partial" : "incomplete",
    reason: "Advisory runtime state model completeness score computed from deterministic preview-only state records."
  };
}

export function createRuntimeStateField(input: {
  fieldId: string;
  category: ControlledRuntimeStateCategory;
  title: string;
  description: string;
  status: ControlledRuntimeStateStatus;
  persistencePolicy: ControlledRuntimeStatePersistencePolicy;
  visibility: ControlledRuntimeStateVisibility;
  riskLevel: ControlledRuntimeStateRiskLevel;
  allowedWriters?: readonly string[];
  allowedReaders?: readonly string[];
  blockedReason?: string | null;
  warnings?: readonly string[];
  recommendations?: readonly string[];
}): ControlledRuntimeStateField {
  return {
    fieldId: input.fieldId,
    category: input.category,
    title: input.title,
    description: input.description,
    status: input.status,
    persistencePolicy: input.persistencePolicy,
    visibility: input.visibility,
    riskLevel: input.riskLevel,
    allowedWriters: sortDeterministically(input.allowedWriters ?? ["none-runtime-preview-only"], (value) => value),
    allowedReaders: sortDeterministically(input.allowedReaders ?? ["human-review", "audit-preview"], (value) => value),
    blockedReason: input.blockedReason ?? null,
    warnings: normalizeWarnings(input.warnings ?? []),
    recommendations: normalizeWarnings(input.recommendations ?? []),
    readonly: true,
    previewOnly: true,
    noPersistence: true,
    noExecution: true
  };
}

export function createRuntimeStateSnapshot(input: {
  snapshotId: string;
  title: string;
  category: ControlledRuntimeStateCategory;
  includedFields: readonly string[];
  snapshotPolicy: ControlledRuntimeStatePersistencePolicy;
  persistencePolicy: ControlledRuntimeStatePersistencePolicy;
}): ControlledRuntimeStateSnapshot {
  return {
    snapshotId: input.snapshotId,
    title: input.title,
    category: input.category,
    includedFields: sortDeterministically(input.includedFields, (value) => value),
    snapshotPolicy: input.snapshotPolicy,
    persistencePolicy: input.persistencePolicy,
    readonly: true,
    previewOnly: true,
    noPersistence: true,
    noExecution: true
  };
}

export function createRuntimeStateTransition(input: {
  transitionId: string;
  fromState: ControlledRuntimeStateCategory;
  toState: ControlledRuntimeStateCategory;
  trigger: string;
  transitionPolicy: ControlledRuntimeStatePersistencePolicy;
}): ControlledRuntimeStateTransition {
  return {
    transitionId: input.transitionId,
    fromState: input.fromState,
    toState: input.toState,
    trigger: input.trigger,
    transitionPolicy: input.transitionPolicy,
    readonly: true,
    previewOnly: true,
    noPersistence: true,
    noExecution: true
  };
}

export function createDefaultRuntimeStateFields(): ControlledRuntimeStateField[] {
  const categories: ControlledRuntimeStateCategory[] = ["requestState", "contractState", "flowState", "approvalState", "generationState", "validationState", "reviewState", "exportState", "auditState", "completionState"];
  return categories.map((category, index) => createRuntimeStateField({
    fieldId: `controlled-runtime-state-field-${String(index + 1).padStart(3, "0")}`,
    category,
    title: `${category} field preview`,
    description: `Preview-only ${category} metadata for future controlled runtime state design.`,
    status: "defined",
    persistencePolicy: "no-persistence",
    visibility: index >= 8 ? "audit-preview" : index === 3 ? "human-review" : "internal-preview",
    riskLevel: index === 3 || index === 4 ? "critical" : index >= 8 ? "high" : "medium",
    warnings: [`${category} is not persisted or executed by this preview.`]
  }));
}

export function createDefaultRuntimeStateSnapshots(fields: readonly ControlledRuntimeStateField[]): ControlledRuntimeStateSnapshot[] {
  return sortRuntimeStateFields(fields).map((field, index) => createRuntimeStateSnapshot({
    snapshotId: `controlled-runtime-state-snapshot-${String(index + 1).padStart(3, "0")}`,
    title: `${field.category} snapshot preview`,
    category: field.category,
    includedFields: [field.fieldId],
    snapshotPolicy: "preview-only",
    persistencePolicy: "no-persistence"
  }));
}

export function createDefaultRuntimeStateTransitions(): ControlledRuntimeStateTransition[] {
  const categories: ControlledRuntimeStateCategory[] = ["requestState", "contractState", "flowState", "approvalState", "generationState", "validationState", "reviewState", "exportState", "auditState", "completionState"];
  return categories.slice(0, -1).map((fromState, index) => createRuntimeStateTransition({
    transitionId: `controlled-runtime-state-transition-${String(index + 1).padStart(3, "0")}`,
    fromState,
    toState: categories[index + 1],
    trigger: `${fromState} preview handoff`,
    transitionPolicy: index === 2 || index === 3 ? "manual-approval-required" : "preview-only"
  }));
}

export function sortRuntimeStateFields(fields: readonly ControlledRuntimeStateField[]): ControlledRuntimeStateField[] {
  return sortDeterministically(fields, (field) => [categoryOrder(field.category), field.fieldId].join("|"));
}

export function sortRuntimeStateSnapshots(snapshots: readonly ControlledRuntimeStateSnapshot[]): ControlledRuntimeStateSnapshot[] {
  return sortDeterministically(snapshots, (snapshot) => [categoryOrder(snapshot.category), snapshot.snapshotId].join("|"));
}

export function sortRuntimeStateTransitions(transitions: readonly ControlledRuntimeStateTransition[]): ControlledRuntimeStateTransition[] {
  return sortDeterministically(transitions, (transition) => transition.transitionId);
}

export function findRuntimeStateFieldsByCategory(fields: readonly ControlledRuntimeStateField[], category: ControlledRuntimeStateCategory): ControlledRuntimeStateField[] {
  return sortRuntimeStateFields(fields).filter((field) => field.category === category);
}

export function findRuntimeStateFieldsByPersistencePolicy(fields: readonly ControlledRuntimeStateField[], persistencePolicy: ControlledRuntimeStatePersistencePolicy): ControlledRuntimeStateField[] {
  return sortRuntimeStateFields(fields).filter((field) => field.persistencePolicy === persistencePolicy);
}

export function findBlockedRuntimeStateFields(fields: readonly ControlledRuntimeStateField[]): ControlledRuntimeStateField[] {
  return sortRuntimeStateFields(fields).filter((field) => field.status === "blocked" || field.persistencePolicy === "blocked" || field.blockedReason !== null);
}

export function findPreviewOnlyRuntimeStateFields(fields: readonly ControlledRuntimeStateField[]): ControlledRuntimeStateField[] {
  return sortRuntimeStateFields(fields).filter((field) => field.previewOnly || field.status === "preview-only" || field.persistencePolicy === "preview-only");
}

function summarizePersistencePolicies(fields: readonly ControlledRuntimeStateField[]): { key: ControlledRuntimeStatePersistencePolicy; totalFields: number }[] {
  return (["no-persistence", "preview-only", "manual-approval-required", "blocked", "not-applicable"] as const).map((policy) => ({ key: policy, totalFields: fields.filter((field) => field.persistencePolicy === policy).length })).filter((group) => group.totalFields > 0);
}

function summarizeStateRisks(fields: readonly ControlledRuntimeStateField[]): { key: ControlledRuntimeStateRiskLevel; totalFields: number }[] {
  return (["low", "medium", "high", "critical"] as const).map((riskLevel) => ({ key: riskLevel, totalFields: fields.filter((field) => field.riskLevel === riskLevel).length })).filter((group) => group.totalFields > 0);
}

function statusScore(status: ControlledRuntimeStateStatus): number {
  if (status === "defined" || status === "preview-only") return 100;
  if (status === "partial") return 60;
  if (status === "not-started") return 20;
  return 0;
}

function persistencePolicyScore(policy: ControlledRuntimeStatePersistencePolicy): number {
  if (policy === "no-persistence" || policy === "preview-only" || policy === "manual-approval-required" || policy === "not-applicable") return 100;
  return 0;
}

function categoryOrder(category: ControlledRuntimeStateCategory): string {
  const order = new Map<ControlledRuntimeStateCategory, number>([
    ["requestState", 1],
    ["contractState", 2],
    ["flowState", 3],
    ["approvalState", 4],
    ["generationState", 5],
    ["validationState", 6],
    ["reviewState", 7],
    ["exportState", 8],
    ["auditState", 9],
    ["completionState", 10]
  ]);
  return String(order.get(category) ?? 999).padStart(3, "0");
}
