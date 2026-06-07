import type { GovernanceMetadata } from "./governanceMetadata.js";
import { normalizeWarnings, sortDeterministically } from "./utils/governanceUtils.js";

export type ControlledRuntimeArchitectureComponentType =
  | "input-intake"
  | "governance-validation"
  | "planning"
  | "approval"
  | "generation"
  | "validation"
  | "review"
  | "export"
  | "audit";

export type ControlledRuntimeArchitecturePhaseType =
  | "request-intake"
  | "contract-validation"
  | "governance-review"
  | "plan-creation"
  | "human-approval"
  | "generation"
  | "validation"
  | "review"
  | "export"
  | "completion";

export type ControlledRuntimeArchitectureStatus =
  | "preview"
  | "defined"
  | "requires-design"
  | "blocked";

export type ControlledRuntimeArchitectureCompletenessLevel =
  | "incomplete"
  | "partial"
  | "architecture-defined"
  | "runtime-design-ready";

export type ControlledRuntimeArchitectureCompleteness = {
  score: number;
  level: ControlledRuntimeArchitectureCompletenessLevel;
  reason: string;
};

export type ControlledRuntimeArchitectureComponent = {
  id: string;
  componentType: ControlledRuntimeArchitectureComponentType;
  title: string;
  responsibility: string;
  status: ControlledRuntimeArchitectureStatus;
  score: number;
  dependencies: string[];
  forbiddenActions: string[];
  readonly: boolean;
  previewOnly: boolean;
  conceptualOnly: boolean;
  noExecution: boolean;
  warnings: string[];
  recommendations: string[];
};

export type ControlledRuntimeArchitecturePhase = {
  id: string;
  phaseType: ControlledRuntimeArchitecturePhaseType;
  title: string;
  status: ControlledRuntimeArchitectureStatus;
  score: number;
  conceptualOnly: boolean;
  noExecution: boolean;
  requiresHumanApproval: boolean;
  forbiddenActions: string[];
  warnings: string[];
  recommendations: string[];
};

export type ControlledRuntimeArchitectureSummary = {
  totalComponents: number;
  totalPhases: number;
  totalForbiddenActions: number;
  runtimeDesignReady: boolean;
  readonly: boolean;
  previewOnly: boolean;
  conceptualOnly: boolean;
  noExecution: boolean;
  completeness: ControlledRuntimeArchitectureCompleteness;
  warnings: string[];
  recommendations: string[];
};

export type ControlledRuntimeArchitecturePreview = {
  schemaVersion: 1;
  title: string;
  metadata: GovernanceMetadata;
  readonly: true;
  previewOnly: true;
  stdoutOnly: true;
  architecturePreviewOnly: true;
  runtimeExecutionAllowed: false;
  runtimeActivationAllowed: false;
  runtimeRoutingAllowed: false;
  runtimeOrchestrationAllowed: false;
  runtimePersistenceAllowed: false;
  projectGenerationEnabled: false;
  builderAgentRuntimeEnabled: false;
  agentExecutionAllowed: false;
  agentLoopsAllowed: false;
  multiAgentSystemsAllowed: false;
  approvalExecutionAllowed: false;
  mutationExecutionAllowed: false;
  fileWriteAllowed: false;
  fileCreationAllowed: false;
  dependencyInstallationAllowed: false;
  packageMutationAllowed: false;
  policyEnforcementEnabled: false;
  governanceActivationAllowed: false;
  autonomyEnabled: false;
  selfImprovementAllowed: false;
  selfModificationAllowed: false;
  components: ControlledRuntimeArchitectureComponent[];
  phases: ControlledRuntimeArchitecturePhase[];
  summary: ControlledRuntimeArchitectureSummary;
};

export function createControlledRuntimeArchitecturePreview(input: {
  title: string;
  metadata: GovernanceMetadata;
  components?: readonly ControlledRuntimeArchitectureComponent[];
  phases?: readonly ControlledRuntimeArchitecturePhase[];
}): ControlledRuntimeArchitecturePreview {
  const components = sortControlledRuntimeArchitectureComponents(input.components ?? createDefaultControlledRuntimeArchitectureComponents());
  const phases = sortControlledRuntimeArchitecturePhases(input.phases ?? createDefaultControlledRuntimeArchitecturePhases());
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
    architecturePreviewOnly: true,
    runtimeExecutionAllowed: false,
    runtimeActivationAllowed: false,
    runtimeRoutingAllowed: false,
    runtimeOrchestrationAllowed: false,
    runtimePersistenceAllowed: false,
    projectGenerationEnabled: false,
    builderAgentRuntimeEnabled: false,
    agentExecutionAllowed: false,
    agentLoopsAllowed: false,
    multiAgentSystemsAllowed: false,
    approvalExecutionAllowed: false,
    mutationExecutionAllowed: false,
    fileWriteAllowed: false,
    fileCreationAllowed: false,
    dependencyInstallationAllowed: false,
    packageMutationAllowed: false,
    policyEnforcementEnabled: false,
    governanceActivationAllowed: false,
    autonomyEnabled: false,
    selfImprovementAllowed: false,
    selfModificationAllowed: false,
    components,
    phases,
    summary: summarizeControlledRuntimeArchitecturePreview(components, phases)
  };
}

export function summarizeControlledRuntimeArchitecturePreview(
  components: readonly ControlledRuntimeArchitectureComponent[],
  phases: readonly ControlledRuntimeArchitecturePhase[]
): ControlledRuntimeArchitectureSummary {
  const sortedComponents = sortControlledRuntimeArchitectureComponents(components);
  const sortedPhases = sortControlledRuntimeArchitecturePhases(phases);
  const warnings = [
    ...sortedComponents.flatMap((component) => component.warnings),
    ...sortedPhases.flatMap((phase) => phase.warnings),
    "Controlled runtime architecture preview is descriptive only; no runtime execution, project generation, or agent execution is enabled."
  ];
  const recommendations = [
    ...sortedComponents.flatMap((component) => component.recommendations),
    ...sortedPhases.flatMap((phase) => phase.recommendations),
    "Require a separate human-approved runtime design phase before any future controlled runtime implementation."
  ];
  return {
    totalComponents: sortedComponents.length,
    totalPhases: sortedPhases.length,
    totalForbiddenActions: sortedComponents.reduce((total, component) => total + component.forbiddenActions.length, 0)
      + sortedPhases.reduce((total, phase) => total + phase.forbiddenActions.length, 0),
    runtimeDesignReady: sortedComponents.length > 0 && sortedPhases.length > 0
      && sortedComponents.every((component) => component.status === "defined" || component.status === "preview")
      && sortedPhases.every((phase) => phase.status === "defined" || phase.status === "preview"),
    readonly: sortedComponents.length > 0 && sortedComponents.every((component) => component.readonly === true),
    previewOnly: sortedComponents.length > 0 && sortedComponents.every((component) => component.previewOnly === true),
    conceptualOnly: sortedComponents.length > 0 && sortedComponents.every((component) => component.conceptualOnly === true)
      && sortedPhases.length > 0 && sortedPhases.every((phase) => phase.conceptualOnly === true),
    noExecution: sortedComponents.length > 0 && sortedComponents.every((component) => component.noExecution === true)
      && sortedPhases.length > 0 && sortedPhases.every((phase) => phase.noExecution === true),
    completeness: calculateControlledRuntimeArchitectureCompleteness(sortedComponents, sortedPhases),
    warnings: normalizeWarnings(warnings),
    recommendations: normalizeWarnings(recommendations)
  };
}

export function calculateControlledRuntimeArchitectureCompleteness(
  components: readonly ControlledRuntimeArchitectureComponent[],
  phases: readonly ControlledRuntimeArchitecturePhase[]
): ControlledRuntimeArchitectureCompleteness {
  if (components.length === 0 || phases.length === 0) {
    return { score: 0, level: "incomplete", reason: "Controlled runtime architecture preview requires component and lifecycle phase records." };
  }
  if (
    components.some((component) => component.status === "blocked" || !component.readonly || !component.previewOnly || !component.conceptualOnly || !component.noExecution)
    || phases.some((phase) => phase.status === "blocked" || !phase.conceptualOnly || !phase.noExecution)
  ) {
    return { score: 0, level: "incomplete", reason: "One or more runtime architecture records violate read-only, preview-only, conceptual-only, or no-execution guarantees." };
  }
  const totalScore = components.reduce((total, component) => total + component.score, 0)
    + phases.reduce((total, phase) => total + phase.score, 0);
  const score = Math.round(totalScore / (components.length + phases.length));
  return {
    score,
    level: score >= 90 ? "runtime-design-ready" : score >= 75 ? "architecture-defined" : score >= 40 ? "partial" : "incomplete",
    reason: "Advisory architecture completeness score computed from deterministic preview-only component and lifecycle phase records."
  };
}

export function createControlledRuntimeArchitectureComponent(input: {
  id: string;
  componentType: ControlledRuntimeArchitectureComponentType;
  title: string;
  responsibility: string;
  status: ControlledRuntimeArchitectureStatus;
  score: number;
  dependencies?: readonly string[];
  forbiddenActions?: readonly string[];
  warnings?: readonly string[];
  recommendations?: readonly string[];
}): ControlledRuntimeArchitectureComponent {
  return {
    id: input.id,
    componentType: input.componentType,
    title: input.title,
    responsibility: input.responsibility,
    status: input.status,
    score: input.score,
    dependencies: sortDeterministically(input.dependencies ?? [], (dependency) => dependency),
    forbiddenActions: sortDeterministically(input.forbiddenActions ?? createDefaultForbiddenRuntimeArchitectureActions(), (action) => action),
    readonly: true,
    previewOnly: true,
    conceptualOnly: true,
    noExecution: true,
    warnings: normalizeWarnings(input.warnings ?? []),
    recommendations: normalizeWarnings(input.recommendations ?? [])
  };
}

export function createControlledRuntimeArchitecturePhase(input: {
  id: string;
  phaseType: ControlledRuntimeArchitecturePhaseType;
  title: string;
  status: ControlledRuntimeArchitectureStatus;
  score: number;
  requiresHumanApproval: boolean;
  forbiddenActions?: readonly string[];
  warnings?: readonly string[];
  recommendations?: readonly string[];
}): ControlledRuntimeArchitecturePhase {
  return {
    id: input.id,
    phaseType: input.phaseType,
    title: input.title,
    status: input.status,
    score: input.score,
    conceptualOnly: true,
    noExecution: true,
    requiresHumanApproval: input.requiresHumanApproval,
    forbiddenActions: sortDeterministically(input.forbiddenActions ?? createDefaultForbiddenRuntimeArchitectureActions(), (action) => action),
    warnings: normalizeWarnings(input.warnings ?? []),
    recommendations: normalizeWarnings(input.recommendations ?? [])
  };
}

export function createDefaultControlledRuntimeArchitectureComponents(): ControlledRuntimeArchitectureComponent[] {
  return [
    createControlledRuntimeArchitectureComponent({ id: "controlled-runtime-architecture-component-001", componentType: "input-intake", title: "Input Intake Layer", responsibility: "Describe future request intake boundaries for controlled project generation intents.", status: "defined", score: 100, warnings: ["Input intake is modeled only; no request handling runtime is implemented."] }),
    createControlledRuntimeArchitectureComponent({ id: "controlled-runtime-architecture-component-002", componentType: "governance-validation", title: "Governance Validation Layer", responsibility: "Describe future governance contract validation before any controlled runtime design can proceed.", status: "defined", score: 100, dependencies: ["input-intake"], warnings: ["Governance validation remains descriptive and does not enforce policy."] }),
    createControlledRuntimeArchitectureComponent({ id: "controlled-runtime-architecture-component-003", componentType: "planning", title: "Planning Layer", responsibility: "Describe future plan construction boundaries without planner-agent runtime loops.", status: "defined", score: 100, dependencies: ["governance-validation"], warnings: ["Planning layer is conceptual only; no planner loop is introduced."] }),
    createControlledRuntimeArchitectureComponent({ id: "controlled-runtime-architecture-component-004", componentType: "approval", title: "Approval Layer", responsibility: "Describe future human approval gates without approval execution or approval persistence.", status: "defined", score: 100, dependencies: ["planning"], warnings: ["Approval layer is preview-only; no approval decision is applied."] }),
    createControlledRuntimeArchitectureComponent({ id: "controlled-runtime-architecture-component-005", componentType: "generation", title: "Generation Layer", responsibility: "Describe future generation boundary while project generation remains disabled.", status: "defined", score: 100, dependencies: ["approval"], warnings: ["Generation layer is an architecture placeholder; no project generation is enabled."] }),
    createControlledRuntimeArchitectureComponent({ id: "controlled-runtime-architecture-component-006", componentType: "validation", title: "Validation Layer", responsibility: "Describe future validation boundaries without executing generated-project validation.", status: "defined", score: 100, dependencies: ["generation"], warnings: ["Validation layer is descriptive only; no validation commands are executed."] }),
    createControlledRuntimeArchitectureComponent({ id: "controlled-runtime-architecture-component-007", componentType: "review", title: "Review Layer", responsibility: "Describe future human review pack evaluation before any controlled runtime execution exists.", status: "defined", score: 100, dependencies: ["validation"], warnings: ["Review layer does not approve, reject, or execute anything."] }),
    createControlledRuntimeArchitectureComponent({ id: "controlled-runtime-architecture-component-008", componentType: "export", title: "Export Layer", responsibility: "Describe future stdout-only export previews for review artifacts.", status: "defined", score: 100, dependencies: ["review"], warnings: ["Export layer does not write files by default."] }),
    createControlledRuntimeArchitectureComponent({ id: "controlled-runtime-architecture-component-009", componentType: "audit", title: "Audit Layer", responsibility: "Describe future audit summaries for controlled runtime architecture decisions.", status: "defined", score: 100, dependencies: ["export"], warnings: ["Audit layer is reporting-only and does not enforce risk or governance decisions."] })
  ];
}

export function createDefaultControlledRuntimeArchitecturePhases(): ControlledRuntimeArchitecturePhase[] {
  return [
    createControlledRuntimeArchitecturePhase({ id: "controlled-runtime-architecture-phase-001", phaseType: "request-intake", title: "Request Intake", status: "defined", score: 100, requiresHumanApproval: false, warnings: ["Request intake is descriptive only; no runtime intake loop exists."] }),
    createControlledRuntimeArchitecturePhase({ id: "controlled-runtime-architecture-phase-002", phaseType: "contract-validation", title: "Contract Validation", status: "defined", score: 100, requiresHumanApproval: false, warnings: ["Contract validation is preview-only and not enforced."] }),
    createControlledRuntimeArchitecturePhase({ id: "controlled-runtime-architecture-phase-003", phaseType: "governance-review", title: "Governance Review", status: "defined", score: 100, requiresHumanApproval: true, warnings: ["Governance review does not activate governance."] }),
    createControlledRuntimeArchitecturePhase({ id: "controlled-runtime-architecture-phase-004", phaseType: "plan-creation", title: "Plan Creation", status: "defined", score: 100, requiresHumanApproval: false, warnings: ["Plan creation is a conceptual lifecycle phase only."] }),
    createControlledRuntimeArchitecturePhase({ id: "controlled-runtime-architecture-phase-005", phaseType: "human-approval", title: "Human Approval", status: "defined", score: 100, requiresHumanApproval: true, warnings: ["Human approval is described but no approval execution exists."] }),
    createControlledRuntimeArchitecturePhase({ id: "controlled-runtime-architecture-phase-006", phaseType: "generation", title: "Generation", status: "defined", score: 100, requiresHumanApproval: true, warnings: ["Generation phase is disabled and descriptive only."] }),
    createControlledRuntimeArchitecturePhase({ id: "controlled-runtime-architecture-phase-007", phaseType: "validation", title: "Validation", status: "defined", score: 100, requiresHumanApproval: false, warnings: ["Validation phase does not execute generated-project validation."] }),
    createControlledRuntimeArchitecturePhase({ id: "controlled-runtime-architecture-phase-008", phaseType: "review", title: "Review", status: "defined", score: 100, requiresHumanApproval: true, warnings: ["Review phase does not approve or reject runtime actions."] }),
    createControlledRuntimeArchitecturePhase({ id: "controlled-runtime-architecture-phase-009", phaseType: "export", title: "Export", status: "defined", score: 100, requiresHumanApproval: false, warnings: ["Export phase is stdout-only and does not write files."] }),
    createControlledRuntimeArchitecturePhase({ id: "controlled-runtime-architecture-phase-010", phaseType: "completion", title: "Completion", status: "defined", score: 100, requiresHumanApproval: true, warnings: ["Completion phase is an architecture checkpoint only."] })
  ];
}

export function sortControlledRuntimeArchitectureComponents(
  components: readonly ControlledRuntimeArchitectureComponent[]
): ControlledRuntimeArchitectureComponent[] {
  const order = new Map<ControlledRuntimeArchitectureComponentType, number>([
    ["input-intake", 1],
    ["governance-validation", 2],
    ["planning", 3],
    ["approval", 4],
    ["generation", 5],
    ["validation", 6],
    ["review", 7],
    ["export", 8],
    ["audit", 9]
  ]);
  return sortDeterministically(components, (component) => [
    String(order.get(component.componentType) ?? 999).padStart(3, "0"),
    component.id,
    component.title
  ].join("|"));
}

export function sortControlledRuntimeArchitecturePhases(
  phases: readonly ControlledRuntimeArchitecturePhase[]
): ControlledRuntimeArchitecturePhase[] {
  const order = new Map<ControlledRuntimeArchitecturePhaseType, number>([
    ["request-intake", 1],
    ["contract-validation", 2],
    ["governance-review", 3],
    ["plan-creation", 4],
    ["human-approval", 5],
    ["generation", 6],
    ["validation", 7],
    ["review", 8],
    ["export", 9],
    ["completion", 10]
  ]);
  return sortDeterministically(phases, (phase) => [
    String(order.get(phase.phaseType) ?? 999).padStart(3, "0"),
    phase.id,
    phase.title
  ].join("|"));
}

function createDefaultForbiddenRuntimeArchitectureActions(): string[] {
  return [
    "agent-execution",
    "builder-agent-runtime",
    "dependency-installation",
    "file-creation",
    "file-writing",
    "governance-activation",
    "mutation-execution",
    "policy-enforcement",
    "project-generation",
    "runtime-activation",
    "runtime-execution",
    "runtime-orchestration",
    "runtime-routing"
  ];
}
