export const GOVERNANCE_PREVIEW_ONLY_RUNTIME_MODE = "preview-only" as const;

export const GOVERNANCE_RUNTIME_DISABLED_FLAGS = {
  runtimeGovernanceEnabled: false,
  runtimeAutonomyEnabled: false,
  runtimeAutonomyActionsAllowed: false,
  runtimeActivationApproved: false,
  runtimeActivationExecuted: false,
  runtimePolicyEnforcementEnabled: false,
  runtimeConfigActivationEnabled: false,
  runtimeControlPlaneApplied: false,
  runtimeControlPlaneActivated: false,
  runtimeKillSwitchActivated: false,
  runtimeEmergencyStopExecuted: false,
  runtimeOperatorOverrideApplied: false,
  runtimeRollbackExecuted: false,
  runtimeObservabilityApplied: false,
  runtimeObservabilityEnforced: false,
  runtimeSafetyApplied: false,
  runtimeSafetyEnforced: false,
  runtimeSafetyActivated: false,
  runtimeSandboxExecutionAllowed: false,
  runtimeSandboxExecuted: false,
  runtimeMutationScopeExpanded: false,
  runtimeExternalExecutionAllowed: false,
  runtimePluginExecutionAllowed: false,
  runtimeScriptEvaluationAllowed: false,
  runtimeLearningEnabled: false,
  runtimeMlDecisioningEnabled: false,
  runtimeMultiAgentCoordinationEnabled: false,
  governanceBypassAllowed: false
} as const;

export const GOVERNANCE_PREVIEW_ONLY_EXECUTION_FLAGS = {
  applied: false,
  enforced: false,
  policyRuntimeMode: GOVERNANCE_PREVIEW_ONLY_RUNTIME_MODE,
  runtimeBehaviorChanged: false,
  governanceDecisionsChanged: false,
  repairOrchestrationChanged: false,
  safePatchEngineOnly: true
} as const;

export const GOVERNANCE_RESEARCH_PREVIEW_FLAGS = {
  runtimeResearchApplied: false,
  runtimeResearchEnforced: false
} as const;

export const GOVERNANCE_RUNTIME_RESEARCH_CHAIN_PREVIEW_FLAGS = {
  runtimeResearchManifestApplied: false,
  runtimeResearchManifestEnforced: false,
  runtimeResearchRegistryApplied: false,
  runtimeResearchRegistryEnforced: false,
  runtimeResearchCatalogApplied: false,
  runtimeResearchCatalogEnforced: false,
  runtimeResearchArchiveApplied: false,
  runtimeResearchArchiveEnforced: false,
  runtimeResearchTimelineApplied: false,
  runtimeResearchTimelineEnforced: false,
  runtimeResearchMapApplied: false,
  runtimeResearchMapEnforced: false,
  runtimeResearchIndexApplied: false,
  runtimeResearchIndexEnforced: false
} as const;

export const GOVERNANCE_FINAL_REVIEW_PREVIEW_FLAGS = {
  runtimeFinalReviewApproved: false,
  runtimeFinalReviewApplied: false,
  runtimeFinalReviewEnforced: false
} as const;

export const GOVERNANCE_RUNTIME_BASE_INVARIANTS = {
  ...GOVERNANCE_RUNTIME_DISABLED_FLAGS,
  ...GOVERNANCE_PREVIEW_ONLY_EXECUTION_FLAGS
} as const;

export const GOVERNANCE_RUNTIME_RESEARCH_BASE_INVARIANTS = {
  ...GOVERNANCE_RUNTIME_RESEARCH_CHAIN_PREVIEW_FLAGS,
  ...GOVERNANCE_RESEARCH_PREVIEW_FLAGS,
  ...GOVERNANCE_FINAL_REVIEW_PREVIEW_FLAGS,
  ...GOVERNANCE_RUNTIME_BASE_INVARIANTS
} as const;

export type GovernanceRuntimeBaseInvariants = typeof GOVERNANCE_RUNTIME_BASE_INVARIANTS;
export type GovernanceRuntimeResearchBaseInvariants = typeof GOVERNANCE_RUNTIME_RESEARCH_BASE_INVARIANTS;
