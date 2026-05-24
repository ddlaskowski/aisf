import { GOVERNANCE_PREVIEW_ONLY_EXECUTION_FLAGS, GOVERNANCE_RUNTIME_DISABLED_FLAGS } from "./governanceInvariants.js";

export type GovernanceReadonlyContract = {
  schemaVersion: 1;
  runtimeGovernanceEnabled: false;
  runtimeAutonomyEnabled: false;
  runtimeActivationExecuted: false;
  policyEnforcementEnabled: false;
  governancePreviewOnly: true;
  safePatchEngineOnly: true;
  reason: string;
};

export function createReadonlyContract(reason = "Governance artifact is descriptive, preview-only, and non-mutating."): GovernanceReadonlyContract {
  return {
    schemaVersion: 1,
    runtimeGovernanceEnabled: GOVERNANCE_RUNTIME_DISABLED_FLAGS.runtimeGovernanceEnabled,
    runtimeAutonomyEnabled: GOVERNANCE_RUNTIME_DISABLED_FLAGS.runtimeAutonomyEnabled,
    runtimeActivationExecuted: GOVERNANCE_RUNTIME_DISABLED_FLAGS.runtimeActivationExecuted,
    policyEnforcementEnabled: GOVERNANCE_RUNTIME_DISABLED_FLAGS.runtimePolicyEnforcementEnabled,
    governancePreviewOnly: true,
    safePatchEngineOnly: GOVERNANCE_PREVIEW_ONLY_EXECUTION_FLAGS.safePatchEngineOnly,
    reason
  };
}

export function assertReadonlyContractShape(contract: GovernanceReadonlyContract): boolean {
  return (
    contract.schemaVersion === 1 &&
    contract.runtimeGovernanceEnabled === false &&
    contract.runtimeAutonomyEnabled === false &&
    contract.runtimeActivationExecuted === false &&
    contract.policyEnforcementEnabled === false &&
    contract.governancePreviewOnly === true &&
    contract.safePatchEngineOnly === true &&
    typeof contract.reason === "string" &&
    contract.reason.length > 0
  );
}

export function renderReadonlyContract(contract: GovernanceReadonlyContract): string {
  return [
    "Read-only contract:",
    `- schemaVersion: ${contract.schemaVersion}`,
    `- runtimeGovernanceEnabled: ${String(contract.runtimeGovernanceEnabled)}`,
    `- runtimeAutonomyEnabled: ${String(contract.runtimeAutonomyEnabled)}`,
    `- runtimeActivationExecuted: ${String(contract.runtimeActivationExecuted)}`,
    `- policyEnforcementEnabled: ${String(contract.policyEnforcementEnabled)}`,
    `- governancePreviewOnly: ${String(contract.governancePreviewOnly)}`,
    `- safePatchEngineOnly: ${String(contract.safePatchEngineOnly)}`,
    `- reason: ${contract.reason}`
  ].join("\n");
}
