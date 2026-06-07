import { renderCliSection, renderReadonlyNotice } from "./cli/render/cliRenderers.js";
import { renderCliGovernanceArtifact } from "./cli/render/cliArtifactRenderer.js";

export function renderMainHelp(): string {
  return [
    "# AI Software Factory CLI",
    "",
    "Usage:",
    "  node dist/cli.js <command> [options]",
    "",
    "Commands:",
    "  run         Execute a repair task",
    "  governance  Show unified governance control plane summary",
    "  runs        Show historical governance run dashboard",
    "  insights    Show governance insights over indexed runs",
    "  ci-summary  Show CI-friendly governance summary",
    "  archive     Show governance archive snapshot history",
    "  trends      Show governance trend analysis over archives",
    "  drift       Show governance drift detection against baselines",
    "  stability   Show governance operational stability score",
    "  escalation  Show governance operator escalation status",
    "  policy      Show governance policy recommendation",
    "  decision-matrix  Explain governance decision reasoning",
    "  evidence-pack    Export governance evidence pack",
    "  evidence-list    Show governance evidence registry",
    "  evidence-diff    Compare governance evidence packs",
    "",
    "Global options:",
    "  --help, -h   Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance",
    "  node dist/cli.js governance config",
    "  node dist/cli.js governance policy runtime-preview",
    "  node dist/cli.js governance profile inheritance-preview",
    "  node dist/cli.js governance repo classification-preview",
    "  node dist/cli.js governance attestation generate",
    "  node dist/cli.js governance ci annotations-preview",
    "  node dist/cli.js governance github pr-summary-preview",
    "  node dist/cli.js governance exception review-preview",
    "  node dist/cli.js governance simulation preview",
    "  node dist/cli.js governance policy activation-candidates-preview",
    "  node dist/cli.js governance runtime activation-gates-preview",
    "  node dist/cli.js governance autonomy readiness",
    "  node dist/cli.js governance autonomy design-review-pack",
    "  node dist/cli.js governance autonomy approval-workflow-preview",
    "  node dist/cli.js governance autonomy scope-preview",
    "  node dist/cli.js governance autonomy risk-register-preview",
    "  node dist/cli.js governance autonomy sandbox-plan-preview",
    "  node dist/cli.js governance autonomy sandbox-evidence-preview",
    "  node dist/cli.js governance autonomy observability-preview",
    "  node dist/cli.js governance autonomy control-plane-preview",
    "  node dist/cli.js governance autonomy lifecycle-preview",
    "  node dist/cli.js governance runtime safety-design-preview",
    "  node dist/cli.js governance runtime safety-evidence-preview",
    "  node dist/cli.js governance runtime safety-observability-preview",
    "  node dist/cli.js governance runtime control-plane-preview",
    "  node dist/cli.js governance runtime lifecycle-preview",
    "  node dist/cli.js governance runtime activation-readiness-preview",
    "  node dist/cli.js governance runtime certification-preview",
    "  node dist/cli.js governance runtime activation-governance-review-preview",
    "  node dist/cli.js governance runtime activation-boundary-preview",
    "  node dist/cli.js governance runtime activation-freeze-preview",
    "  node dist/cli.js governance runtime final-review-preview",
    "  node dist/cli.js governance runtime research-preview",
    "  node dist/cli.js governance runtime research-index-preview",
    "  node dist/cli.js governance runtime research-map-preview",
    "  node dist/cli.js governance runtime research-timeline-preview",
    "  node dist/cli.js governance runtime research-archive-preview",
    "  node dist/cli.js governance runtime research-catalog-preview",
    "  node dist/cli.js governance runtime research-registry-preview",
    "  node dist/cli.js governance runtime research-manifest-preview",
    "  node dist/cli.js governance runtime research-attestation-preview",
    "  node dist/cli.js governance artifact-index --help",
    "  node dist/cli.js governance consolidation-audit",
    "  node dist/cli.js governance project-generation-readiness",
    "  node dist/cli.js governance project-generation-capabilities",
    "  node dist/cli.js governance project-generation-blueprint",
    "  node dist/cli.js governance project-generation-file-plan",
    "  node dist/cli.js governance project-generation-dependency-plan",
    "  node dist/cli.js governance project-generation-validation-plan",
    "  node dist/cli.js governance project-generation-approval-plan",
    "  node dist/cli.js governance project-generation-risk-plan",
    "  node dist/cli.js governance project-generation-rollback-plan",
    "  node dist/cli.js governance project-generation-plan-bundle",
    "  node dist/cli.js governance project-generation-readiness-audit",
    "  node dist/cli.js governance controlled-project-generation-contract",
    "  node dist/cli.js governance controlled-project-generation-input-contract",
    "  node dist/cli.js governance controlled-project-generation-output-contract",
    "  node dist/cli.js governance controlled-project-generation-mutation-boundary",
    "  node dist/cli.js governance controlled-project-generation-approval-boundary",
    "  node dist/cli.js governance controlled-project-generation-runtime-boundary",
    "  node dist/cli.js governance controlled-project-generation-contract-bundle",
    "  node dist/cli.js governance controlled-project-generation-contract-audit",
    "  node dist/cli.js governance controlled-project-generation-design-completion-audit",
    "  node dist/cli.js governance controlled-runtime-architecture",
    "  node dist/cli.js governance controlled-runtime-components",
    "  node dist/cli.js governance controlled-runtime-flow",
    "  node dist/cli.js governance controlled-runtime-state-model",
    "  node dist/cli.js runs",
    "  node dist/cli.js insights --profile conservative",
    "  node dist/cli.js ci-summary --profile balanced",
    "  node dist/cli.js runs --export all",
    "  node dist/cli.js archive --latest",
    "  node dist/cli.js trends --window 20",
    "  node dist/cli.js drift --json",
    "  node dist/cli.js stability --json",
    "  node dist/cli.js escalation --json",
    "  node dist/cli.js policy --json",
    "  node dist/cli.js decision-matrix --json",
    "  node dist/cli.js evidence-pack --json",
    "  node dist/cli.js evidence-list --latest",
    "  node dist/cli.js evidence-diff <A> <B>",
    "",
    "Governance inspection commands are read-only unless --export, --archive, or evidence-pack is explicitly used.",
    "Governance commands do not modify repair behavior."
  ].join("\n") + "\n";
}

export function renderGovernanceHelp(): string {
  return [
    "# AI Software Factory CLI - governance",
    "",
    "Usage:",
    "  node dist/cli.js governance [options]",
    "",
    "Options:",
    "  --repo <path>                Path to target repository",
    "  --window <n>                 Trend analysis window",
    "  --baseline-window <n>       Drift baseline window",
    "  --comparison-window <n>     Drift comparison window",
    "  --json                      Print JSON output",
    "  --help, -h                  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance",
    "  node dist/cli.js governance --window 20",
    "  node dist/cli.js governance --json",
    "  node dist/cli.js governance config",
    "  node dist/cli.js governance policy runtime-preview",
    "  node dist/cli.js governance profile inheritance-preview",
    "  node dist/cli.js governance repo classification-preview",
    "  node dist/cli.js governance attestation generate",
    "  node dist/cli.js governance ci annotations-preview",
    "  node dist/cli.js governance github pr-summary-preview",
    "  node dist/cli.js governance exception review-preview",
    "  node dist/cli.js governance simulation preview",
    "  node dist/cli.js governance policy activation-candidates-preview",
    "  node dist/cli.js governance runtime activation-gates-preview",
    "  node dist/cli.js governance autonomy readiness",
    "  node dist/cli.js governance autonomy design-review-pack",
    "  node dist/cli.js governance autonomy approval-workflow-preview",
    "  node dist/cli.js governance autonomy scope-preview",
    "  node dist/cli.js governance autonomy risk-register-preview",
    "  node dist/cli.js governance autonomy sandbox-plan-preview",
    "  node dist/cli.js governance autonomy sandbox-evidence-preview",
    "  node dist/cli.js governance autonomy observability-preview",
    "  node dist/cli.js governance autonomy control-plane-preview",
    "  node dist/cli.js governance autonomy lifecycle-preview",
    "  node dist/cli.js governance runtime safety-design-preview",
    "  node dist/cli.js governance runtime safety-evidence-preview",
    "  node dist/cli.js governance runtime safety-observability-preview",
    "  node dist/cli.js governance runtime control-plane-preview",
    "  node dist/cli.js governance runtime lifecycle-preview",
    "  node dist/cli.js governance runtime activation-readiness-preview",
    "  node dist/cli.js governance runtime certification-preview",
    "  node dist/cli.js governance runtime activation-governance-review-preview",
    "  node dist/cli.js governance runtime activation-boundary-preview",
    "  node dist/cli.js governance runtime activation-freeze-preview",
    "  node dist/cli.js governance runtime final-review-preview",
    "  node dist/cli.js governance runtime research-preview",
    "  node dist/cli.js governance runtime research-index-preview",
    "  node dist/cli.js governance runtime research-map-preview",
    "  node dist/cli.js governance runtime research-timeline-preview",
    "  node dist/cli.js governance runtime research-archive-preview",
    "  node dist/cli.js governance runtime research-catalog-preview",
    "  node dist/cli.js governance runtime research-registry-preview",
    "  node dist/cli.js governance runtime research-manifest-preview",
    "  node dist/cli.js governance runtime research-attestation-preview",
    "  node dist/cli.js governance artifact-index --help",
    "  node dist/cli.js governance consolidation-audit",
    "  node dist/cli.js governance project-generation-readiness",
    "  node dist/cli.js governance project-generation-capabilities",
    "  node dist/cli.js governance project-generation-blueprint",
    "  node dist/cli.js governance project-generation-file-plan",
    "  node dist/cli.js governance project-generation-dependency-plan",
    "  node dist/cli.js governance project-generation-validation-plan",
    "  node dist/cli.js governance project-generation-approval-plan",
    "  node dist/cli.js governance project-generation-risk-plan",
    "  node dist/cli.js governance project-generation-rollback-plan",
    "  node dist/cli.js governance project-generation-plan-bundle",
    "  node dist/cli.js governance project-generation-readiness-audit",
    "  node dist/cli.js governance controlled-project-generation-contract",
    "  node dist/cli.js governance controlled-project-generation-input-contract",
    "  node dist/cli.js governance controlled-project-generation-output-contract",
    "  node dist/cli.js governance controlled-project-generation-mutation-boundary",
    "  node dist/cli.js governance controlled-project-generation-approval-boundary",
    "  node dist/cli.js governance controlled-project-generation-runtime-boundary",
    "  node dist/cli.js governance controlled-project-generation-contract-bundle",
    "  node dist/cli.js governance controlled-project-generation-contract-audit",
    "  node dist/cli.js governance controlled-project-generation-design-completion-audit",
    "  node dist/cli.js governance controlled-runtime-architecture",
    "  node dist/cli.js governance controlled-runtime-components",
    "  node dist/cli.js governance controlled-runtime-flow",
    "  node dist/cli.js governance controlled-runtime-state-model",
    "",
    "Read-only guarantee:",
    "  Governance control plane reads governance data and does not modify repair behavior.",
    "  Governance control plane does not generate evidence packs or archives automatically.",
    "  Governance control plane does not modify .factory/archive-index.json, .factory/evidence-index.json, or .factory/runs-index.json."
  ].join("\n") + "\n";
}

export function renderGovernanceAttestationHelp(): string {
  return [
    "# AI Software Factory CLI - governance attestation generate",
    "",
    "Usage:",
    "  node dist/cli.js governance attestation generate [options]",
    "",
    "Options:",
    "  --json      Print JSON output",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance attestation generate",
    "  node dist/cli.js governance attestation generate --json",
    "",
    "Attestation-only guarantee:",
    "  This command generates a deterministic governance-state attestation only.",
    "  It does not cryptographically sign, enforce governance, apply profiles, activate config, or change repair orchestration."
  ].join("\n") + "\n";
}

export function renderGovernanceCiAnnotationsPreviewHelp(): string {
  return [
    "# AI Software Factory CLI - governance ci annotations-preview",
    "",
    "Usage:",
    "  node dist/cli.js governance ci annotations-preview [options]",
    "",
    "Options:",
    "  --json      Print JSON output",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance ci annotations-preview",
    "  node dist/cli.js governance ci annotations-preview --json",
    "",
    "CI preview-only guarantee:",
    "  This command generates deterministic CI-oriented governance annotations only.",
    "  It does not fail builds, enforce governance, apply profiles, activate config, call CI APIs, or change repair orchestration."
  ].join("\n") + "\n";
}

export function renderGovernanceGithubPrSummaryPreviewHelp(): string {
  return [
    "# AI Software Factory CLI - governance github pr-summary-preview",
    "",
    "Usage:",
    "  node dist/cli.js governance github pr-summary-preview [options]",
    "",
    "Options:",
    "  --json      Print JSON output",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance github pr-summary-preview",
    "  node dist/cli.js governance github pr-summary-preview --json",
    "",
    "GitHub preview-only guarantee:",
    "  This command generates a deterministic PR-ready governance summary locally.",
    "  It does not call GitHub APIs, read GitHub tokens, create PR comments, fail builds, enforce governance, or change repair orchestration."
  ].join("\n") + "\n";
}

export function renderGovernanceExceptionReviewPreviewHelp(): string {
  return [
    "# AI Software Factory CLI - governance exception review-preview",
    "",
    "Usage:",
    "  node dist/cli.js governance exception review-preview [options]",
    "",
    "Options:",
    "  --json      Print JSON output",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance exception review-preview",
    "  node dist/cli.js governance exception review-preview --json",
    "",
    "Exception preview-only guarantee:",
    "  This command prepares deterministic governance exception review data locally.",
    "  It does not approve exceptions, apply exceptions, allow governance bypass, enforce governance, fail builds, call GitHub APIs, or change repair orchestration."
  ].join("\n") + "\n";
}

export function renderGovernanceSimulationPreviewHelp(): string {
  return [
    "# AI Software Factory CLI - governance simulation preview",
    "",
    "Usage:",
    "  node dist/cli.js governance simulation preview [options]",
    "",
    "Options:",
    "  --json      Print JSON output",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance simulation preview",
    "  node dist/cli.js governance simulation preview --json",
    "",
    "Simulation preview-only guarantee:",
    "  This command simulates future governance behavior locally without applying outcomes.",
    "  It does not enforce governance, approve exceptions, allow bypasses, fail builds, activate config, or change repair orchestration."
  ].join("\n") + "\n";
}

export function renderGovernanceGuardedPolicyActivationCandidatesPreviewHelp(): string {
  return [
    "# AI Software Factory CLI - governance policy activation-candidates-preview",
    "",
    "Usage:",
    "  node dist/cli.js governance policy activation-candidates-preview [options]",
    "",
    "Options:",
    "  --json      Print JSON output",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance policy activation-candidates-preview",
    "  node dist/cli.js governance policy activation-candidates-preview --json",
    "",
    "Activation candidate preview-only guarantee:",
    "  This command identifies future guarded policy activation candidates only.",
    "  It does not activate policies, enforce governance, enable guarded activation, apply profiles, activate config, or change repair orchestration."
  ].join("\n") + "\n";
}

export function renderGovernanceRuntimeActivationGatesPreviewHelp(): string {
  return [
    "# AI Software Factory CLI - governance runtime activation-gates-preview",
    "",
    "Usage:",
    "  node dist/cli.js governance runtime activation-gates-preview [options]",
    "",
    "Options:",
    "  --json      Print JSON output",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance runtime activation-gates-preview",
    "  node dist/cli.js governance runtime activation-gates-preview --json",
    "",
    "Activation gate preview-only guarantee:",
    "  This command models future governance runtime activation gates only.",
    "  It does not activate runtime governance, activate policies, enforce governance, apply profiles, activate config, or change repair orchestration."
  ].join("\n") + "\n";
}

export function renderGovernanceAutonomyReadinessHelp(): string {
  return [
    "# AI Software Factory CLI - governance autonomy readiness",
    "",
    "Usage:",
    "  node dist/cli.js governance autonomy readiness [options]",
    "",
    "Options:",
    "  --json      Print JSON output",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance autonomy readiness",
    "  node dist/cli.js governance autonomy readiness --json",
    "",
    "Readiness-only guarantee:",
    "  This command evaluates future controlled-autonomy design-review readiness only.",
    "  It does not enable autonomy, perform autonomous actions, enforce governance, activate policies, activate config, or change repair orchestration."
  ].join("\n") + "\n";
}

export function renderGovernanceAutonomyDesignReviewPackHelp(): string {
  return [
    "# AI Software Factory CLI - governance autonomy design-review-pack",
    "",
    "Usage:",
    "  node dist/cli.js governance autonomy design-review-pack [options]",
    "",
    "Options:",
    "  --json      Print JSON output",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance autonomy design-review-pack",
    "  node dist/cli.js governance autonomy design-review-pack --json",
    "",
    "Design-review preparation guarantee:",
    "  This command generates a deterministic controlled-autonomy design review pack only.",
    "  It does not approve autonomy, enable autonomy, perform autonomous actions, enforce governance, activate policies, activate config, or change repair orchestration."
  ].join("\n") + "\n";
}

export function renderGovernanceHumanApprovalWorkflowPreviewHelp(): string {
  return [
    "# AI Software Factory CLI - governance autonomy approval-workflow-preview",
    "",
    "Usage:",
    "  node dist/cli.js governance autonomy approval-workflow-preview [options]",
    "",
    "Options:",
    "  --json      Print JSON output",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance autonomy approval-workflow-preview",
    "  node dist/cli.js governance autonomy approval-workflow-preview --json",
    "",
    "Approval workflow preview-only guarantee:",
    "  This command models future human approval workflow steps only.",
    "  It does not grant approval, apply approval, enable autonomy, perform autonomous actions, enforce governance, activate policies, activate config, or change repair orchestration."
  ].join("\n") + "\n";
}

export function renderGovernanceAutonomyScopePreviewHelp(): string {
  return [
    "# AI Software Factory CLI - governance autonomy scope-preview",
    "",
    "Usage:",
    "  node dist/cli.js governance autonomy scope-preview [options]",
    "",
    "Options:",
    "  --json      Print JSON output",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance autonomy scope-preview",
    "  node dist/cli.js governance autonomy scope-preview --json",
    "",
    "Scope preview-only guarantee:",
    "  This command models future controlled-autonomy scope candidates only.",
    "  It does not approve scope, apply scope, enable autonomy, allow autonomous actions, enforce governance, activate policies, activate config, or change repair orchestration."
  ].join("\n") + "\n";
}

export function renderGovernanceAutonomyRiskRegisterPreviewHelp(): string {
  return [
    "# AI Software Factory CLI - governance autonomy risk-register-preview",
    "",
    "Usage:",
    "  node dist/cli.js governance autonomy risk-register-preview [options]",
    "",
    "Options:",
    "  --json      Print JSON output",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance autonomy risk-register-preview",
    "  node dist/cli.js governance autonomy risk-register-preview --json",
    "",
    "Risk register preview-only guarantee:",
    "  This command models future controlled-autonomy risks and mitigation recommendations only.",
    "  It does not accept risks, apply mitigations, enable autonomy, allow autonomous actions, enforce governance, activate policies, activate config, or change repair orchestration."
  ].join("\n") + "\n";
}

export function renderGovernanceAutonomySandboxPlanPreviewHelp(): string {
  return [
    "# AI Software Factory CLI - governance autonomy sandbox-plan-preview",
    "",
    "Usage:",
    "  node dist/cli.js governance autonomy sandbox-plan-preview [options]",
    "",
    "Options:",
    "  --json      Print JSON output",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance autonomy sandbox-plan-preview",
    "  node dist/cli.js governance autonomy sandbox-plan-preview --json",
    "",
    "Sandbox plan preview-only guarantee:",
    "  This command models future controlled-autonomy sandbox planning only.",
    "  It does not create sandboxes, execute sandboxes, enable autonomy, allow autonomous actions, accept risks, apply mitigations, enforce governance, activate config, or change repair orchestration."
  ].join("\n") + "\n";
}

export function renderGovernanceAutonomySandboxEvidencePreviewHelp(): string {
  return [
    "# AI Software Factory CLI - governance autonomy sandbox-evidence-preview",
    "",
    "Usage:",
    "  node dist/cli.js governance autonomy sandbox-evidence-preview [options]",
    "",
    "Options:",
    "  --json      Print JSON output",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance autonomy sandbox-evidence-preview",
    "  node dist/cli.js governance autonomy sandbox-evidence-preview --json",
    "",
    "Sandbox evidence preview-only guarantee:",
    "  This command models future controlled-autonomy sandbox evidence only.",
    "  It does not create sandboxes, execute sandboxes, apply evidence, enable autonomy, allow autonomous actions, enforce governance, activate config, or change repair orchestration."
  ].join("\n") + "\n";
}

export function renderGovernanceAutonomyObservabilityPreviewHelp(): string {
  return [
    "# AI Software Factory CLI - governance autonomy observability-preview",
    "",
    "Usage:",
    "  node dist/cli.js governance autonomy observability-preview [options]",
    "",
    "Options:",
    "  --json      Print JSON output",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance autonomy observability-preview",
    "  node dist/cli.js governance autonomy observability-preview --json",
    "",
    "Observability preview-only guarantee:",
    "  This command models future controlled-autonomy observability, telemetry, audit events, alerts, and operator visibility only.",
    "  It does not apply observability, execute telemetry, create sandboxes, execute sandboxes, enable autonomy, allow autonomous actions, enforce governance, activate config, or change repair orchestration."
  ].join("\n") + "\n";
}

export function renderGovernanceAutonomyControlPlanePreviewHelp(): string {
  return [
    "# AI Software Factory CLI - governance autonomy control-plane-preview",
    "",
    "Usage:",
    "  node dist/cli.js governance autonomy control-plane-preview [options]",
    "",
    "Options:",
    "  --json      Print JSON output",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance autonomy control-plane-preview",
    "  node dist/cli.js governance autonomy control-plane-preview --json",
    "",
    "Control plane preview-only guarantee:",
    "  This command models future controlled-autonomy operator controls, kill-switch candidates, approval controls, sandbox controls, scope controls, and observability controls only.",
    "  It does not apply a control plane, activate kill switches, apply operator controls, enable autonomy, allow autonomous actions, enforce governance, activate config, or change repair orchestration."
  ].join("\n") + "\n";
}

export function renderGovernanceAutonomyLifecyclePreviewHelp(): string {
  return [
    "# AI Software Factory CLI - governance autonomy lifecycle-preview",
    "",
    "Usage:",
    "  node dist/cli.js governance autonomy lifecycle-preview [options]",
    "",
    "Options:",
    "  --json      Print JSON output",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance autonomy lifecycle-preview",
    "  node dist/cli.js governance autonomy lifecycle-preview --json",
    "",
    "Lifecycle preview-only guarantee:",
    "  This command models future controlled-autonomy lifecycle stages, transitions, blockers, and rollback planning only.",
    "  It does not apply lifecycle behavior, execute transitions, execute rollback, enable autonomy, allow autonomous actions, enforce governance, activate config, or change repair orchestration."
  ].join("\n") + "\n";
}

export function renderGovernanceRuntimeSafetyDesignPreviewHelp(): string {
  return [
    "# AI Software Factory CLI - governance runtime safety-design-preview",
    "",
    "Usage:",
    "  node dist/cli.js governance runtime safety-design-preview [options]",
    "",
    "Options:",
    "  --json      Print JSON output",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance runtime safety-design-preview",
    "  node dist/cli.js governance runtime safety-design-preview --json",
    "",
    "Runtime safety design preview-only guarantee:",
    "  This command models future runtime safety architecture, boundaries, invariants, gates, forbidden capabilities, and rollback preparation only.",
    "  It does not activate runtime governance, enable runtime autonomy, enforce runtime policies, apply runtime controls, activate config, execute sandboxes, or change repair orchestration."
  ].join("\n") + "\n";
}

export function renderGovernanceRuntimeSafetyEvidencePreviewHelp(): string {
  return [
    "# AI Software Factory CLI - governance runtime safety-evidence-preview",
    "",
    "Usage:",
    "  node dist/cli.js governance runtime safety-evidence-preview [options]",
    "",
    "Options:",
    "  --json      Print JSON output",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance runtime safety-evidence-preview",
    "  node dist/cli.js governance runtime safety-evidence-preview --json",
    "",
    "Runtime safety evidence preview-only guarantee:",
    "  This command models future runtime safety evidence sections, references, and missing evidence only.",
    "  It does not apply runtime safety evidence, activate runtime governance, enable runtime autonomy, enforce runtime policies, activate config, execute sandboxes, or change repair orchestration."
  ].join("\n") + "\n";
}

export function renderGovernanceRuntimeSafetyObservabilityPreviewHelp(): string {
  return [
    "# AI Software Factory CLI - governance runtime safety-observability-preview",
    "",
    "Usage:",
    "  node dist/cli.js governance runtime safety-observability-preview [options]",
    "",
    "Options:",
    "  --json      Print JSON output",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance runtime safety-observability-preview",
    "  node dist/cli.js governance runtime safety-observability-preview --json",
    "",
    "Runtime safety observability preview-only guarantee:",
    "  This command models future runtime telemetry signals, audit events, safety alerts, operator visibility, invariant monitoring, and rollback visibility only.",
    "  It does not apply runtime observability, execute telemetry, activate runtime governance, enable runtime autonomy, enforce runtime policies, activate config, execute sandboxes, or change repair orchestration."
  ].join("\n") + "\n";
}

export function renderGovernanceRuntimeControlPlanePreviewHelp(): string {
  return [
    "# AI Software Factory CLI - governance runtime control-plane-preview",
    "",
    "Usage:",
    "  node dist/cli.js governance runtime control-plane-preview [options]",
    "",
    "Options:",
    "  --json      Print JSON output",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance runtime control-plane-preview",
    "  node dist/cli.js governance runtime control-plane-preview --json",
    "",
    "Runtime control plane preview-only guarantee:",
    "  This command models future runtime operator controls, freezes, emergency stops, rollbacks, overrides, and kill-switch candidates only.",
    "  It does not apply runtime control plane behavior, activate kill switches, execute emergency stops, execute rollback, apply overrides, enable runtime governance or autonomy, enforce policies, activate config, execute sandboxes, or change repair orchestration."
  ].join("\n") + "\n";
}

export function renderGovernanceRuntimeLifecyclePreviewHelp(): string {
  return [
    "# AI Software Factory CLI - governance runtime lifecycle-preview",
    "",
    "Usage:",
    "  node dist/cli.js governance runtime lifecycle-preview [options]",
    "",
    "Options:",
    "  --json      Print JSON output",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance runtime lifecycle-preview",
    "  node dist/cli.js governance runtime lifecycle-preview --json",
    "",
    "Runtime governance lifecycle preview-only guarantee:",
    "  This command models future runtime lifecycle stages, transitions, blockers, and rollback lifecycle planning only.",
    "  It does not apply runtime lifecycle behavior, execute transitions, activate runtime governance, enable runtime autonomy, enforce policies, activate config, execute sandboxes, execute rollback, apply overrides, or change repair orchestration."
  ].join("\n") + "\n";
}

export function renderGovernanceRuntimeActivationReadinessPreviewHelp(): string {
  return [
    "# AI Software Factory CLI - governance runtime activation-readiness-preview",
    "",
    "Usage:",
    "  node dist/cli.js governance runtime activation-readiness-preview [options]",
    "",
    "Options:",
    "  --json      Print JSON output",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance runtime activation-readiness-preview",
    "  node dist/cli.js governance runtime activation-readiness-preview --json",
    "",
    "Runtime activation readiness preview-only guarantee:",
    "  This command models future runtime activation readiness scoring, prerequisites, blockers, freeze conditions, forbidden paths, and rollback planning only.",
    "  It does not execute runtime activation, enable runtime governance, enable runtime autonomy, enforce policies, activate config, execute sandboxes, execute rollback, apply overrides, or change repair orchestration."
  ].join("\n") + "\n";
}

export function renderGovernanceRuntimeSafetyCertificationPreviewHelp(): string {
  return [
    "# AI Software Factory CLI - governance runtime certification-preview",
    "",
    "Usage:",
    "  node dist/cli.js governance runtime certification-preview [options]",
    "",
    "Options:",
    "  --json      Print JSON output",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance runtime certification-preview",
    "  node dist/cli.js governance runtime certification-preview --json",
    "",
    "Runtime safety certification preview-only guarantee:",
    "  This command models future runtime safety certification domains, findings, blockers, forbidden capability findings, and recommendations only.",
    "  It does not certify runtime governance for execution, execute runtime activation, enable runtime governance, enable runtime autonomy, enforce policies, activate config, execute sandboxes, execute rollback, apply overrides, or change repair orchestration."
  ].join("\n") + "\n";
}

export function renderGovernanceRuntimeActivationGovernanceReviewPreviewHelp(): string {
  return [
    "# AI Software Factory CLI - governance runtime activation-governance-review-preview",
    "",
    "Usage:",
    "  node dist/cli.js governance runtime activation-governance-review-preview [options]",
    "",
    "Options:",
    "  --json      Print JSON output",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance runtime activation-governance-review-preview",
    "  node dist/cli.js governance runtime activation-governance-review-preview --json",
    "",
    "Runtime activation governance review preview-only guarantee:",
    "  This command models future human governance review sections, findings, blockers, approval requirements, forbidden activation findings, and rollback planning only.",
    "  It does not approve runtime activation, execute runtime activation, enable runtime governance, enable runtime autonomy, enforce policies, activate config, execute sandboxes, execute rollback, apply overrides, or change repair orchestration."
  ].join("\n") + "\n";
}

export function renderGovernanceRuntimeActivationBoundaryPreviewHelp(): string {
  return [
    "# AI Software Factory CLI - governance runtime activation-boundary-preview",
    "",
    "Usage:",
    "  node dist/cli.js governance runtime activation-boundary-preview [options]",
    "",
    "Options:",
    "  --json      Print JSON output",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance runtime activation-boundary-preview",
    "  node dist/cli.js governance runtime activation-boundary-preview --json",
    "",
    "Runtime activation boundary preview-only guarantee:",
    "  This command models future runtime activation boundary domains, definitions, blockers, forbidden boundary crossings, and rollback planning only.",
    "  It does not approve runtime activation, execute runtime activation, apply runtime boundaries, enable runtime governance, enable runtime autonomy, enforce policies, activate config, execute sandboxes, execute rollback, apply overrides, or change repair orchestration."
  ].join("\n") + "\n";
}

export function renderGovernanceRuntimeActivationFreezePreviewHelp(): string {
  return [
    "# AI Software Factory CLI - governance runtime activation-freeze-preview",
    "",
    "Usage:",
    "  node dist/cli.js governance runtime activation-freeze-preview [options]",
    "",
    "Options:",
    "  --json      Print JSON output",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance runtime activation-freeze-preview",
    "  node dist/cli.js governance runtime activation-freeze-preview --json",
    "",
    "Runtime activation freeze preview-only guarantee:",
    "  This command models future runtime activation freeze domains, conditions, blockers, freeze trigger findings, and rollback planning only.",
    "  It does not execute runtime freeze behavior, approve runtime activation, execute runtime activation, apply runtime boundaries, enable runtime governance, enable runtime autonomy, enforce policies, activate config, execute sandboxes, execute rollback, apply overrides, or change repair orchestration."
  ].join("\n") + "\n";
}

export function renderGovernanceRuntimeSafetyFinalReviewPreviewHelp(): string {
  return [
    "# AI Software Factory CLI - governance runtime final-review-preview",
    "",
    "Usage:",
    "  node dist/cli.js governance runtime final-review-preview [options]",
    "",
    "Options:",
    "  --json      Print JSON output",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance runtime final-review-preview",
    "  node dist/cli.js governance runtime final-review-preview --json",
    "",
    "Runtime safety final review preview-only guarantee:",
    "  This command models future runtime safety final review domains, findings, blockers, forbidden runtime findings, and rollback/freeze governance planning only.",
    "  It does not approve runtime activation, execute runtime activation, apply runtime review enforcement, enable runtime governance, enable runtime autonomy, enforce policies, activate config, execute sandboxes, execute rollback, apply overrides, or change repair orchestration."
  ].join("\n") + "\n";
}

export function renderGovernancePostV9RuntimeResearchPreviewHelp(): string {
  return [
    "# AI Software Factory CLI - governance runtime research-preview",
    "",
    "Usage:",
    "  node dist/cli.js governance runtime research-preview [options]",
    "",
    "Options:",
    "  --json      Print JSON output",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance runtime research-preview",
    "  node dist/cli.js governance runtime research-preview --json",
    "",
    "Post-v9 runtime research preview-only guarantee:",
    "  This command models architecture completion, preview-only findings, forbidden capabilities, human research requirements, feasibility notes, and governance research recommendations only.",
    "  It does not activate runtime governance, approve runtime activation, execute runtime activation, enable runtime autonomy, enforce policies, activate config, execute sandboxes, execute rollback, apply overrides, or change repair orchestration."
  ].join("\n") + "\n";
}

export function renderGovernanceRuntimeResearchIndexPreviewHelp(): string {
  return [
    "# AI Software Factory CLI - governance runtime research-index-preview",
    "",
    "Usage:",
    "  node dist/cli.js governance runtime research-index-preview [options]",
    "",
    "Options:",
    "  --json      Print JSON output",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance runtime research-index-preview",
    "  node dist/cli.js governance runtime research-index-preview --json",
    "",
    "Runtime governance research index preview-only guarantee:",
    "  This command organizes runtime research entries, category summaries, preview-only references, forbidden capability references, human research requirements, and future feasibility references only.",
    "  It does not activate runtime governance, approve runtime activation, execute runtime activation, enable runtime autonomy, enforce policies, activate config, execute sandboxes, execute rollback, apply overrides, or change repair orchestration."
  ].join("\n") + "\n";
}

export function renderGovernanceRuntimeResearchMapPreviewHelp(): string {
  return [
    "# AI Software Factory CLI - governance runtime research-map-preview",
    "",
    "Usage:",
    "  node dist/cli.js governance runtime research-map-preview [options]",
    "",
    "Options:",
    "  --json      Print JSON output",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance runtime research-map-preview",
    "  node dist/cli.js governance runtime research-map-preview --json",
    "",
    "Runtime governance research map preview-only guarantee:",
    "  This command models runtime governance dependency nodes, edges, prerequisite chains, stage groups, forbidden boundaries, and future-only dependency notes only.",
    "  It does not activate runtime governance, approve runtime activation, execute runtime activation, enable runtime autonomy, enforce policies, activate config, execute sandboxes, execute rollback, apply overrides, or change repair orchestration."
  ].join("\n") + "\n";
}

export function renderGovernanceRuntimeResearchTimelinePreviewHelp(): string {
  return [
    "# AI Software Factory CLI - governance runtime research-timeline-preview",
    "",
    "Usage:",
    "  node dist/cli.js governance runtime research-timeline-preview [options]",
    "",
    "Options:",
    "  --json      Print JSON output",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance runtime research-timeline-preview",
    "  node dist/cli.js governance runtime research-timeline-preview --json",
    "",
    "Runtime governance research timeline preview-only guarantee:",
    "  This command models runtime governance timeline stages, maturity progression entries, research milestones, preview-only maturity boundaries, and future-only progression notes only.",
    "  It does not activate runtime governance, approve runtime activation, execute runtime activation, enable runtime autonomy, enforce policies, activate config, execute sandboxes, execute rollback, apply overrides, or change repair orchestration."
  ].join("\n") + "\n";
}

export function renderGovernanceRuntimeResearchArchivePreviewHelp(): string {
  return [
    "# AI Software Factory CLI - governance runtime research-archive-preview",
    "",
    "Usage:",
    "  node dist/cli.js governance runtime research-archive-preview [options]",
    "",
    "Options:",
    "  --json      Print JSON output",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance runtime research-archive-preview",
    "  node dist/cli.js governance runtime research-archive-preview --json",
    "",
    "Runtime governance research archive preview-only guarantee:",
    "  This command models runtime governance archive sections, archive entries, archive references, preview-only archive summaries, forbidden capability archive summaries, and future-only archival notes only.",
    "  It does not activate runtime governance, approve runtime activation, execute runtime activation, enable runtime autonomy, enforce policies, activate config, execute sandboxes, execute rollback, apply overrides, or change repair orchestration."
  ].join("\n") + "\n";
}

export function renderGovernanceRuntimeResearchCatalogPreviewHelp(): string {
  return [
    "# AI Software Factory CLI - governance runtime research-catalog-preview",
    "",
    "Usage:",
    "  node dist/cli.js governance runtime research-catalog-preview [options]",
    "",
    "Options:",
    "  --json      Print JSON output",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance runtime research-catalog-preview",
    "  node dist/cli.js governance runtime research-catalog-preview --json",
    "",
    "Runtime governance research catalog preview-only guarantee:",
    "  This command models runtime governance catalog groups, catalog entries, artifact references, version summaries, preview-only posture summaries, forbidden capability summaries, and future-only catalog notes only.",
    "  It does not activate runtime governance, approve runtime activation, execute runtime activation, enable runtime autonomy, enforce policies, activate config, execute sandboxes, execute rollback, apply overrides, or change repair orchestration."
  ].join("\n") + "\n";
}

export function renderGovernanceRuntimeResearchRegistryPreviewHelp(): string {
  return [
    "# AI Software Factory CLI - governance runtime research-registry-preview",
    "",
    "Usage:",
    "  node dist/cli.js governance runtime research-registry-preview [options]",
    "",
    "Options:",
    "  --json      Print JSON output",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance runtime research-registry-preview",
    "  node dist/cli.js governance runtime research-registry-preview --json",
    "",
    "Runtime governance research registry preview-only guarantee:",
    "  This command models runtime governance registry groups, registry records, artifact identity records, ownership summaries, preview-only registry summaries, forbidden capability registry records, and future-only registry notes only.",
    "  It does not activate runtime governance, approve runtime activation, execute runtime activation, enable runtime autonomy, enforce policies, activate config, execute sandboxes, execute rollback, apply overrides, or change repair orchestration."
  ].join("\n") + "\n";
}

export function renderGovernanceRuntimeResearchManifestPreviewHelp(): string {
  return [
    "# AI Software Factory CLI - governance runtime research-manifest-preview",
    "",
    "Usage:",
    "  node dist/cli.js governance runtime research-manifest-preview [options]",
    "",
    "Options:",
    "  --json      Print JSON output",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance runtime research-manifest-preview",
    "  node dist/cli.js governance runtime research-manifest-preview --json",
    "",
    "Runtime governance research manifest preview-only guarantee:",
    "  This command models runtime governance manifest groups, manifest records, manifest ownership entries, manifest version entries, preview-only manifest summaries, forbidden capability manifest records, and future-only manifest notes only.",
    "  It does not activate runtime governance, approve runtime activation, execute runtime activation, enable runtime autonomy, enforce policies, activate config, execute sandboxes, execute rollback, apply overrides, or change repair orchestration.",
    "",
    renderCliSection("Read-only notice", [renderReadonlyNotice(true)]),
    "",
    renderCliGovernanceArtifact({
      artifactType: "manifest",
      status: "preview",
      severity: "info",
      summary: "Runtime governance research manifest help is rendered as read-only CLI artifact guidance.",
      warnings: [],
      recommendations: [],
      metadata: {
        version: "v10.3",
        source: "cli-help",
        command: "governance runtime research-manifest-preview --help",
        readonly: true,
        previewOnly: true
      }
    })
  ].join("\n") + "\n";
}

export function renderGovernanceArtifactIndexHelp(): string {
  return [
    "# AI Software Factory CLI - governance artifact-index",
    "",
    "Usage:",
    "  node dist/cli.js governance artifact-index [options]",
    "",
    "Options:",
    "  --json      Print deterministic sample query output",
    "  --snapshot  Print deterministic stdout-only snapshot preview",
    "  --review-pack",
    "              Print deterministic stdout-only review pack preview",
    "  --export <json|markdown>",
    "              Print deterministic stdout-only export preview",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance artifact-index",
    "  node dist/cli.js governance artifact-index --json",
    "  node dist/cli.js governance artifact-index --snapshot",
    "  node dist/cli.js governance artifact-index --snapshot --json",
    "  node dist/cli.js governance artifact-index --review-pack",
    "  node dist/cli.js governance artifact-index --review-pack --json",
    "  node dist/cli.js governance artifact-index --export json",
    "  node dist/cli.js governance artifact-index --export markdown",
    "",
    "Read-only guarantee:",
    "  This is a read-only / preview-only inspection command.",
    "  Snapshot previews are stdout-only and do not write files by default.",
    "  Review pack previews are stdout-only and do not write files by default.",
    "  Export previews are stdout-only and do not write files by default.",
    "  This command provides deterministic sample inspection of normalized governance artifact indexes only.",
    "  It does not read live runtime artifacts, activate governance, enforce policy, route runtime behavior, execute runtime activation, enable runtime autonomy, mutate files, or change repair orchestration.",
    "",
    renderCliSection("Read-only notice", [renderReadonlyNotice(true)])
  ].join("\n") + "\n";
}

export function renderGovernanceConsolidationAuditHelp(): string {
  return [
    "# AI Software Factory CLI - governance consolidation-audit",
    "",
    "Usage:",
    "  node dist/cli.js governance consolidation-audit [options]",
    "",
    "Options:",
    "  --json      Print deterministic completion audit output",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance consolidation-audit",
    "  node dist/cli.js governance consolidation-audit --json",
    "",
    "Completion audit preview:",
    "  This command verifies the v10.x governance consolidation chain: invariants, schemas, renderers, CLI renderers, artifact factory, read-only contract, registry, index, query, export, snapshot, review pack, suite filters, and CLI preview paths.",
    "  Audit previews are stdout-only and do not write files by default.",
    "  This is a read-only / preview-only audit command.",
    "  It does not activate governance, enforce policy, route runtime behavior, execute runtime activation, enable runtime autonomy, mutate files, or change repair orchestration.",
    "",
    renderCliSection("Read-only notice", [renderReadonlyNotice(true)])
  ].join("\n") + "\n";
}

export function renderGovernanceProjectGenerationReadinessHelp(): string {
  return [
    "# AI Software Factory CLI - governance project-generation-readiness",
    "",
    "Usage:",
    "  node dist/cli.js governance project-generation-readiness [options]",
    "",
    "Options:",
    "  --json      Print deterministic readiness assessment output",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance project-generation-readiness",
    "  node dist/cli.js governance project-generation-readiness --json",
    "",
    "Project generation readiness assessment:",
    "  This command assesses future project generation readiness using consolidated governance artifacts, validation suites, read-only contracts, Safe Patch Engine boundaries, single-file mutation boundaries, disabled runtime activation, builder-agent readiness, scaffolding readiness, orchestration readiness, and human approval readiness.",
    "  This is assessment-only and does not implement builder agents, project scaffolding, planner loops, runtime orchestration, or autonomous project generation.",
    "  Readiness previews are stdout-only and do not write files by default.",
    "  This is a read-only / preview-only assessment command.",
    "  It does not generate projects, activate governance, enforce policy, route runtime behavior, execute runtime activation, enable runtime autonomy, mutate files, or change repair orchestration.",
    "",
    renderCliSection("Read-only notice", [renderReadonlyNotice(true)])
  ].join("\n") + "\n";
}

export function renderGovernanceProjectGenerationCapabilitiesHelp(): string {
  return [
    "# AI Software Factory CLI - governance project-generation-capabilities",
    "",
    "Usage:",
    "  node dist/cli.js governance project-generation-capabilities [options]",
    "",
    "Options:",
    "  --json      Print deterministic capability map output",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance project-generation-capabilities",
    "  node dist/cli.js governance project-generation-capabilities --json",
    "",
    "Project generation capability map:",
    "  This command maps future controlled project generation capabilities as planning-only data: project intent capture, requirements normalization, blueprint planning, file plan preview, dependency plan preview, task graph preview, Safe Patch integration, human approval workflow, validation plan preview, rollback plan preview, and artifact review pack integration.",
    "  This is planning-only and does not implement builder agents, project scaffolding, planner loops, runtime orchestration, runtime routing, or autonomous project generation.",
    "  Capability previews are stdout-only and do not write files by default.",
    "  This is a read-only / preview-only planning command.",
    "  It does not generate projects, activate governance, enforce policy, route runtime behavior, execute runtime activation, enable runtime autonomy, mutate files, expand mutation scope, or change repair orchestration.",
    "",
    renderCliSection("Read-only notice", [renderReadonlyNotice(true)])
  ].join("\n") + "\n";
}

export function renderGovernanceProjectGenerationBlueprintHelp(): string {
  return [
    "# AI Software Factory CLI - governance project-generation-blueprint",
    "",
    "Usage:",
    "  node dist/cli.js governance project-generation-blueprint [options]",
    "",
    "Options:",
    "  --json      Print deterministic blueprint preview output",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance project-generation-blueprint",
    "  node dist/cli.js governance project-generation-blueprint --json",
    "",
    "Project generation blueprint preview:",
    "  This command previews future project blueprint sections as descriptive data only: project intent, requirements, architecture, file plan, dependency plan, validation plan, governance plan, human approval plan, risk plan, and rollback plan.",
    "  This is preview-only and does not implement builder agents, project scaffolding, planner loops, runtime orchestration, runtime routing, or autonomous project generation.",
    "  Blueprint previews are stdout-only and do not write files by default.",
    "  This is a read-only / preview-only planning command.",
    "  It does not generate projects, scaffold files, create files, activate governance, enforce policy, route runtime behavior, execute runtime activation, enable runtime autonomy, mutate files, expand mutation scope, or change repair orchestration.",
    "",
    renderCliSection("Read-only notice", [renderReadonlyNotice(true)])
  ].join("\n") + "\n";
}

export function renderGovernanceProjectGenerationFilePlanHelp(): string {
  return [
    "# AI Software Factory CLI - governance project-generation-file-plan",
    "",
    "Usage:",
    "  node dist/cli.js governance project-generation-file-plan [options]",
    "",
    "Options:",
    "  --json      Print deterministic file plan preview output",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance project-generation-file-plan",
    "  node dist/cli.js governance project-generation-file-plan --json",
    "",
    "Project generation file plan preview:",
    "  This command previews future planned file paths as descriptive data only, including file roles, file types, generation status, mutation policy, approval requirements, dependencies, risks, warnings, and recommendations.",
    "  This is preview-only and does not implement builder agents, project scaffolding, planner loops, runtime orchestration, runtime routing, autonomous project generation, or file creation.",
    "  File plan previews are stdout-only and do not write files by default.",
    "  This is a read-only / preview-only planning command.",
    "  It does not generate projects, scaffold files, create files, activate governance, enforce policy, route runtime behavior, execute runtime activation, enable runtime autonomy, mutate files, expand mutation scope, or change repair orchestration.",
    "",
    renderCliSection("Read-only notice", [renderReadonlyNotice(true)])
  ].join("\n") + "\n";
}

export function renderGovernanceProjectGenerationDependencyPlanHelp(): string {
  return [
    "# AI Software Factory CLI - governance project-generation-dependency-plan",
    "",
    "Usage:",
    "  node dist/cli.js governance project-generation-dependency-plan [options]",
    "",
    "Options:",
    "  --json      Print deterministic dependency plan preview output",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance project-generation-dependency-plan",
    "  node dist/cli.js governance project-generation-dependency-plan --json",
    "",
    "Project generation dependency plan preview:",
    "  This command previews future dependency planning as descriptive data only, including package names, dependency types, purposes, required-by sections, installation policies, version policies, risk levels, approval requirements, warnings, and recommendations.",
    "  This is preview-only and does not install dependencies, mutate package.json, edit lockfiles, implement builder agents, scaffold files, create files, or generate projects.",
    "  Dependency plan previews are stdout-only and do not write files by default.",
    "  This is a read-only / preview-only planning command.",
    "  It does not install dependencies, modify packages, generate projects, scaffold files, create files, activate governance, enforce policy, route runtime behavior, execute runtime activation, enable runtime autonomy, mutate files, expand mutation scope, or change repair orchestration.",
    "",
    renderCliSection("Read-only notice", [renderReadonlyNotice(true)])
  ].join("\n") + "\n";
}

export function renderGovernanceProjectGenerationValidationPlanHelp(): string {
  return [
    "# AI Software Factory CLI - governance project-generation-validation-plan",
    "",
    "Usage:",
    "  node dist/cli.js governance project-generation-validation-plan [options]",
    "",
    "Options:",
    "  --json      Print deterministic validation plan preview output",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance project-generation-validation-plan",
    "  node dist/cli.js governance project-generation-validation-plan --json",
    "",
    "Project generation validation plan preview:",
    "  This command previews future generated-project validation planning as descriptive data only, including check IDs, check types, command previews, purposes, required-by sections, execution policies, risk levels, approval requirements, expected signals, warnings, and recommendations.",
    "  This is preview-only and does not execute validation commands, run generated-project validation, install dependencies, mutate package.json, edit lockfiles, implement builder agents, scaffold files, create files, or generate projects.",
    "  Validation plan previews are stdout-only and do not write files by default.",
    "  This is a read-only / preview-only planning command.",
    "  It does not execute validation commands, run generated-project validation, install dependencies, modify packages, generate projects, scaffold files, create files, activate governance, enforce policy, route runtime behavior, execute runtime activation, enable runtime autonomy, mutate files, expand mutation scope, or change repair orchestration.",
    "",
    renderCliSection("Read-only notice", [renderReadonlyNotice(true)])
  ].join("\n") + "\n";
}

export function renderGovernanceProjectGenerationApprovalPlanHelp(): string {
  return [
    "# AI Software Factory CLI - governance project-generation-approval-plan",
    "",
    "Usage:",
    "  node dist/cli.js governance project-generation-approval-plan [options]",
    "",
    "Options:",
    "  --json      Print deterministic approval plan preview output",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance project-generation-approval-plan",
    "  node dist/cli.js governance project-generation-approval-plan --json",
    "",
    "Project generation approval plan preview:",
    "  This command previews future human approval planning as descriptive data only, including gate IDs, gate types, titles, purposes, required-for sections, approval policies, decision statuses, risk levels, human approval requirements, warnings, and recommendations.",
    "  This is preview-only and does not execute approvals, apply approval decisions, approve project generation, execute validation commands, run generated-project validation, install dependencies, mutate package.json, edit lockfiles, implement builder agents, scaffold files, create files, or generate projects.",
    "  Approval plan previews are stdout-only and do not write files by default.",
    "  This is a read-only / preview-only planning command.",
    "  It does not execute approvals, approve project generation, execute validation commands, run generated-project validation, install dependencies, modify packages, generate projects, scaffold files, create files, activate governance, enforce policy, route runtime behavior, execute runtime activation, enable runtime autonomy, mutate files, expand mutation scope, or change repair orchestration.",
    "",
    renderCliSection("Read-only notice", [renderReadonlyNotice(true)])
  ].join("\n") + "\n";
}

export function renderGovernanceProjectGenerationRiskPlanHelp(): string {
  return [
    "# AI Software Factory CLI - governance project-generation-risk-plan",
    "",
    "Usage:",
    "  node dist/cli.js governance project-generation-risk-plan [options]",
    "",
    "Options:",
    "  --json      Print deterministic risk plan preview output",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance project-generation-risk-plan",
    "  node dist/cli.js governance project-generation-risk-plan --json",
    "",
    "Project generation risk plan preview:",
    "  This command previews future project generation risk planning as descriptive data only, including risk IDs, risk types, affected plans, severity, likelihood, risk status, mitigation policy, human approval requirements, warnings, and recommendations.",
    "  This is preview-only and does not enforce risks, execute mitigations, execute approvals, apply approval decisions, approve project generation, execute validation commands, run generated-project validation, install dependencies, mutate package.json, edit lockfiles, implement builder agents, scaffold files, create files, or generate projects.",
    "  Risk plan previews are stdout-only and do not write files by default.",
    "  This is a read-only / preview-only planning command.",
    "  It does not enforce risks, execute approvals, approve project generation, execute validation commands, run generated-project validation, install dependencies, modify packages, generate projects, scaffold files, create files, activate governance, enforce policy, route runtime behavior, execute runtime activation, enable runtime autonomy, mutate files, expand mutation scope, or change repair orchestration.",
    "",
    renderCliSection("Read-only notice", [renderReadonlyNotice(true)])
  ].join("\n") + "\n";
}

export function renderGovernanceProjectGenerationRollbackPlanHelp(): string {
  return [
    "# AI Software Factory CLI - governance project-generation-rollback-plan",
    "",
    "Usage:",
    "  node dist/cli.js governance project-generation-rollback-plan [options]",
    "",
    "Options:",
    "  --json      Print deterministic rollback plan preview output",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance project-generation-rollback-plan",
    "  node dist/cli.js governance project-generation-rollback-plan --json",
    "",
    "Project generation rollback plan preview:",
    "  This command previews future rollback and recovery planning as descriptive data only, including step IDs, step types, applies-to sections, rollback policies, recovery policies, execution statuses, risk levels, human approval requirements, warnings, and recommendations.",
    "  This is preview-only and does not execute rollback, execute recovery, enforce risks, execute mitigations, execute approvals, apply approval decisions, approve project generation, execute validation commands, run generated-project validation, install dependencies, mutate package.json, edit lockfiles, implement builder agents, scaffold files, create files, or generate projects.",
    "  Rollback plan previews are stdout-only and do not write files by default.",
    "  This is a read-only / preview-only planning command.",
    "  It does not execute rollback, execute recovery, enforce risks, execute approvals, approve project generation, execute validation commands, run generated-project validation, install dependencies, modify packages, generate projects, scaffold files, create files, activate governance, enforce policy, route runtime behavior, execute runtime activation, enable runtime autonomy, mutate files, expand mutation scope, or change repair orchestration.",
    "",
    renderCliSection("Read-only notice", [renderReadonlyNotice(true)])
  ].join("\n") + "\n";
}

export function renderGovernanceProjectGenerationPlanBundleHelp(): string {
  return [
    "# AI Software Factory CLI - governance project-generation-plan-bundle",
    "",
    "Usage:",
    "  node dist/cli.js governance project-generation-plan-bundle [options]",
    "",
    "Options:",
    "  --json      Print deterministic plan bundle preview output",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance project-generation-plan-bundle",
    "  node dist/cli.js governance project-generation-plan-bundle --json",
    "",
    "Project generation plan bundle preview:",
    "  This command aggregates future blueprint, file plan, dependency plan, validation plan, approval plan, risk plan, rollback plan, governance summary, and read-only guarantee previews as descriptive data only.",
    "  This is preview-only and does not execute bundle workflows, write bundle files, execute rollback, execute recovery, enforce risks, execute mitigations, execute approvals, apply approval decisions, approve project generation, execute validation commands, run generated-project validation, install dependencies, mutate package.json, edit lockfiles, implement builder agents, scaffold files, create files, or generate projects.",
    "  Plan bundle previews are stdout-only and do not write files by default.",
    "  This is a read-only / preview-only planning command.",
    "  It does not execute bundles, execute rollback, execute recovery, enforce risks, execute approvals, approve project generation, execute validation commands, run generated-project validation, install dependencies, modify packages, mutate package.json, generate projects, scaffold files, create files, activate governance, enforce policy, route runtime behavior, execute runtime activation, enable runtime autonomy, mutate files, expand mutation scope, or change repair orchestration.",
    "",
    renderCliSection("Read-only notice", [renderReadonlyNotice(true)])
  ].join("\n") + "\n";
}

export function renderGovernanceProjectGenerationReadinessAuditHelp(): string {
  return [
    "# AI Software Factory CLI - governance project-generation-readiness-audit",
    "",
    "Usage:",
    "  node dist/cli.js governance project-generation-readiness-audit [options]",
    "",
    "Options:",
    "  --json      Print deterministic readiness completion audit output",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance project-generation-readiness-audit",
    "  node dist/cli.js governance project-generation-readiness-audit --json",
    "",
    "Project generation readiness completion audit:",
    "  This command audits the full v11.x readiness chain as descriptive data only: readiness assessment, capability map, blueprint preview, file plan preview, dependency plan preview, validation plan preview, approval plan preview, risk plan preview, rollback plan preview, plan bundle preview, CLI preview paths, scenario coverage, read-only guarantees, and no-execution guarantees.",
    "  This is preview-only and does not execute bundle workflows, execute rollback, execute recovery, enforce risks, execute mitigations, execute approvals, apply approval decisions, approve project generation, execute validation commands, run generated-project validation, install dependencies, mutate package.json, edit lockfiles, implement builder agents, scaffold files, create files, or generate projects.",
    "  Readiness completion audits are stdout-only and do not write files by default.",
    "  This is a read-only / preview-only / no-execution audit command.",
    "  It does not execute bundles, execute rollback, execute recovery, enforce risks, execute approvals, approve project generation, execute validation commands, run generated-project validation, install dependencies, modify packages, mutate package.json, generate projects, scaffold files, create files, activate governance, enforce policy, route runtime behavior, execute runtime activation, enable runtime autonomy, mutate files, expand mutation scope, or change repair orchestration.",
    "",
    renderCliSection("Read-only notice", [renderReadonlyNotice(true)])
  ].join("\n") + "\n";
}

export function renderGovernanceControlledProjectGenerationContractHelp(): string {
  return [
    "# AI Software Factory CLI - governance controlled-project-generation-contract",
    "",
    "Usage:",
    "  node dist/cli.js governance controlled-project-generation-contract [options]",
    "",
    "Options:",
    "  --json      Print deterministic controlled project generation design contract output",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance controlled-project-generation-contract",
    "  node dist/cli.js governance controlled-project-generation-contract --json",
    "",
    "Controlled project generation design contract:",
    "  This command defines a deterministic design contract for a future controlled project generation runtime as descriptive data only.",
    "  This is preview-only and read-only. It has no runtime and does not execute generation, execute bundle workflows, execute rollback, execute recovery, enforce risks, execute mitigations, execute approvals, apply approval decisions, approve project generation, execute validation commands, run generated-project validation, install dependencies, mutate package.json, edit lockfiles, implement builder agents, scaffold files, create files, or generate projects.",
    "  The contract documents allowed outputs, forbidden actions, mutation boundaries, approval boundaries, runtime boundaries, CLI preview paths, and scenario suites.",
    "  Controlled project generation design contracts are stdout-only and do not write files by default.",
    "  It does not activate governance, enforce policy, route runtime behavior, execute runtime activation, enable runtime autonomy, mutate files, expand mutation scope, or change repair orchestration.",
    "",
    renderCliSection("Read-only notice", [renderReadonlyNotice(true)])
  ].join("\n") + "\n";
}

export function renderGovernanceControlledProjectGenerationInputContractHelp(): string {
  return [
    "# AI Software Factory CLI - governance controlled-project-generation-input-contract",
    "",
    "Usage:",
    "  node dist/cli.js governance controlled-project-generation-input-contract [options]",
    "",
    "Options:",
    "  --json      Print deterministic controlled project generation input contract output",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance controlled-project-generation-input-contract",
    "  node dist/cli.js governance controlled-project-generation-input-contract --json",
    "",
    "Controlled project generation input contract:",
    "  This command defines future controlled generation input groups, input fields, allowed values, validation policies, risk levels, and conceptual rejection states as descriptive data only.",
    "  This is preview-only and read-only. It has no input execution, no live input validation, no runtime, and no project generation. It does not execute generation, execute bundle workflows, execute rollback, execute recovery, enforce risks, execute approvals, execute validation commands, install dependencies, mutate package.json, scaffold files, create files, or generate projects.",
    "  Input contract previews are stdout-only and do not write files by default.",
    "  It does not activate governance, enforce policy, route runtime behavior, execute runtime activation, enable runtime autonomy, mutate files, expand mutation scope, or change repair orchestration.",
    "",
    renderCliSection("Read-only notice", [renderReadonlyNotice(true)])
  ].join("\n") + "\n";
}

export function renderGovernanceControlledProjectGenerationOutputContractHelp(): string {
  return [
    "# AI Software Factory CLI - governance controlled-project-generation-output-contract",
    "",
    "Usage:",
    "  node dist/cli.js governance controlled-project-generation-output-contract [options]",
    "",
    "Options:",
    "  --json      Print deterministic controlled project generation output contract output",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance controlled-project-generation-output-contract",
    "  node dist/cli.js governance controlled-project-generation-output-contract --json",
    "",
    "Controlled project generation output contract:",
    "  This command defines future controlled generation output groups, output fields, formats, output policies, allowed preview outputs, and forbidden output behavior as descriptive data only.",
    "  This is preview-only and read-only. It has no output execution, no file write, no runtime, and no project generation. It does not execute generation, execute bundle workflows, execute rollback, execute recovery, enforce risks, execute approvals, execute validation commands, install dependencies, mutate package.json, scaffold files, create files, write files, or generate projects.",
    "  Output contract previews are stdout-only and do not write files by default.",
    "  It does not activate governance, enforce policy, route runtime behavior, execute runtime activation, enable runtime autonomy, mutate files, expand mutation scope, or change repair orchestration.",
    "",
    renderCliSection("Read-only notice", [renderReadonlyNotice(true)])
  ].join("\n") + "\n";
}

export function renderGovernanceControlledProjectGenerationMutationBoundaryHelp(): string {
  return [
    "# AI Software Factory CLI - governance controlled-project-generation-mutation-boundary",
    "",
    "Usage:",
    "  node dist/cli.js governance controlled-project-generation-mutation-boundary [options]",
    "",
    "Options:",
    "  --json      Print deterministic controlled project generation mutation boundary contract output",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance controlled-project-generation-mutation-boundary",
    "  node dist/cli.js governance controlled-project-generation-mutation-boundary --json",
    "",
    "Controlled project generation mutation boundary contract:",
    "  This command defines future controlled generation mutation groups, mutation policies, forbidden mutation categories, Safe Patch Engine-only boundaries, and multi-file mutation boundaries as descriptive data only.",
    "  This is preview-only and read-only. It has no mutation execution, no mutation expansion, no runtime, and no project generation. Safe Patch Engine remains the sole mutation layer and multi-file mutation remains blocked or forbidden.",
    "  Mutation boundary previews are stdout-only and do not write files by default.",
    "  It does not execute mutations, execute inputs, execute outputs, execute bundle workflows, execute rollback, execute recovery, enforce risks, execute approvals, execute validation commands, install dependencies, mutate package.json, scaffold files, create files, write files, or generate projects.",
    "  It does not activate governance, enforce policy, route runtime behavior, execute runtime activation, enable runtime autonomy, mutate files, expand mutation scope, or change repair orchestration.",
    "",
    renderCliSection("Read-only notice", [renderReadonlyNotice(true)])
  ].join("\n") + "\n";
}

export function renderGovernanceControlledProjectGenerationApprovalBoundaryHelp(): string {
  return [
    "# AI Software Factory CLI - governance controlled-project-generation-approval-boundary",
    "",
    "Usage:",
    "  node dist/cli.js governance controlled-project-generation-approval-boundary [options]",
    "",
    "Options:",
    "  --json      Print deterministic controlled project generation approval boundary contract output",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance controlled-project-generation-approval-boundary",
    "  node dist/cli.js governance controlled-project-generation-approval-boundary --json",
    "",
    "Controlled project generation approval boundary contract:",
    "  This command defines future controlled generation approval groups, approval policies, manual approval boundaries, forbidden auto-approval boundaries, and approval persistence boundaries as descriptive data only.",
    "  This is preview-only and read-only. It has no approval execution, no approval persistence, no runtime, and no project generation. Auto-approval remains forbidden for runtime transitions and controlled generation approval boundaries.",
    "  Approval boundary previews are stdout-only and do not write files by default.",
    "  It does not execute approvals, persist approval state, apply approval decisions, approve project generation, execute mutations, execute inputs, execute outputs, execute bundle workflows, execute rollback, execute recovery, enforce risks, execute validation commands, install dependencies, mutate package.json, scaffold files, create files, write files, or generate projects.",
    "  It does not activate governance, enforce policy, route runtime behavior, execute runtime activation, enable runtime autonomy, mutate files, expand mutation scope, or change repair orchestration.",
    "",
    renderCliSection("Read-only notice", [renderReadonlyNotice(true)])
  ].join("\n") + "\n";
}

export function renderGovernanceControlledProjectGenerationRuntimeBoundaryHelp(): string {
  return [
    "# AI Software Factory CLI - governance controlled-project-generation-runtime-boundary",
    "",
    "Usage:",
    "  node dist/cli.js governance controlled-project-generation-runtime-boundary [options]",
    "",
    "Options:",
    "  --json      Print deterministic controlled project generation runtime boundary contract output",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance controlled-project-generation-runtime-boundary",
    "  node dist/cli.js governance controlled-project-generation-runtime-boundary --json",
    "",
    "Controlled project generation runtime boundary contract:",
    "  This command defines future controlled generation runtime groups, runtime policies, forbidden runtime boundaries, activation boundaries, execution boundaries, routing boundaries, orchestration boundaries, and persistence boundaries as descriptive data only.",
    "  This is preview-only and read-only. It has no runtime execution, no runtime activation, no runtime routing, no runtime orchestration, no runtime persistence, no runtime, and no project generation.",
    "  Runtime boundary previews are stdout-only and do not write files by default.",
    "  It does not execute runtime, activate runtime, route runtime behavior, persist runtime state, execute approvals, persist approval state, execute mutations, execute inputs, execute outputs, execute bundle workflows, execute rollback, execute recovery, enforce risks, execute validation commands, install dependencies, mutate package.json, scaffold files, create files, write files, or generate projects.",
    "  It does not activate governance, enforce policy, execute runtime activation, enable runtime autonomy, implement planner-agent runtime loops, implement builder-agent runtime loops, mutate files, expand mutation scope, or change repair orchestration.",
    "",
    renderCliSection("Read-only notice", [renderReadonlyNotice(true)])
  ].join("\n") + "\n";
}

export function renderGovernanceControlledProjectGenerationContractBundleHelp(): string {
  return [
    "# AI Software Factory CLI - governance controlled-project-generation-contract-bundle",
    "",
    "Usage:",
    "  node dist/cli.js governance controlled-project-generation-contract-bundle [options]",
    "",
    "Options:",
    "  --json      Print deterministic controlled project generation contract bundle output",
    "  --export <json|markdown>  Print deterministic stdout-only export preview",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance controlled-project-generation-contract-bundle",
    "  node dist/cli.js governance controlled-project-generation-contract-bundle --json",
    "  node dist/cli.js governance controlled-project-generation-contract-bundle --export json",
    "  node dist/cli.js governance controlled-project-generation-contract-bundle --export markdown",
    "",
    "Controlled project generation contract bundle:",
    "  This command aggregates the design, input, output, mutation boundary, approval boundary, and runtime boundary contracts into one deterministic read-only review bundle.",
    "  This is preview-only and read-only. It has no runtime execution, no runtime activation, no runtime routing, no runtime persistence, no contract execution, no contract bundle execution, no runtime, and no project generation.",
    "  Contract bundle previews are stdout-only and do not write files by default.",
    "  Export previews are stdout-only, preview-only, read-only, and do not write files by default.",
    "  It does not execute contract bundles, execute input contracts, execute output contracts, execute mutation contracts, execute approval contracts, execute runtime contracts, execute runtime, activate runtime, route runtime behavior, persist runtime state, execute approvals, persist approval state, execute mutations, execute rollback, execute recovery, enforce risks, execute validation commands, install dependencies, mutate package.json, scaffold files, create files, write files, or generate projects.",
    "  It does not activate governance, enforce policy, execute runtime activation, enable runtime autonomy, implement planner-agent runtime loops, implement builder-agent runtime loops, mutate files, expand mutation scope, or change repair orchestration.",
    "",
    renderCliSection("Read-only notice", [renderReadonlyNotice(true)])
  ].join("\n") + "\n";
}

export function renderGovernanceControlledProjectGenerationContractAuditHelp(): string {
  return [
    "# AI Software Factory CLI - governance controlled-project-generation-contract-audit",
    "",
    "Usage:",
    "  node dist/cli.js governance controlled-project-generation-contract-audit [options]",
    "",
    "Options:",
    "  --json      Print deterministic controlled project generation contract audit output",
    "  --export <json|markdown>  Print deterministic stdout-only export preview",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance controlled-project-generation-contract-audit",
    "  node dist/cli.js governance controlled-project-generation-contract-audit --json",
    "  node dist/cli.js governance controlled-project-generation-contract-audit --export json",
    "  node dist/cli.js governance controlled-project-generation-contract-audit --export markdown",
    "",
    "Controlled project generation contract audit:",
    "  This command audits the v12.x design, input, output, mutation boundary, approval boundary, runtime boundary, contract bundle, CLI preview path, CLI scope, scenario coverage, forbidden action, and guarantee records as deterministic read-only reporting data.",
    "  This is preview-only and read-only. It has no runtime execution, no runtime activation, no runtime routing, no runtime orchestration, no runtime persistence, no contract execution, no contract audit execution, no contract bundle execution, no runtime, and no project generation.",
    "  Contract audit previews are stdout-only and do not write files by default.",
    "  Export previews are stdout-only, preview-only, read-only, and do not write files by default.",
    "  It does not execute contract audits, execute contracts, execute contract bundles, execute input contracts, execute output contracts, execute mutation contracts, execute approval contracts, execute runtime contracts, execute runtime, activate runtime, route runtime behavior, persist runtime state, execute approvals, persist approval state, execute mutations, execute rollback, execute recovery, enforce risks, execute validation commands, install dependencies, mutate package.json, scaffold files, create files, write files, or generate projects.",
    "  It does not activate governance, enforce policy, execute runtime activation, enable runtime autonomy, implement planner-agent runtime loops, implement builder-agent runtime loops, mutate files, expand mutation scope, or change repair orchestration.",
    "",
    renderCliSection("Read-only notice", [renderReadonlyNotice(true)])
  ].join("\n") + "\n";
}

export function renderGovernanceControlledProjectGenerationDesignCompletionAuditHelp(): string {
  return [
    "# AI Software Factory CLI - governance controlled-project-generation-design-completion-audit",
    "",
    "Usage:",
    "  node dist/cli.js governance controlled-project-generation-design-completion-audit [options]",
    "",
    "Options:",
    "  --json      Print deterministic controlled project generation design completion audit output",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance controlled-project-generation-design-completion-audit",
    "  node dist/cli.js governance controlled-project-generation-design-completion-audit --json",
    "",
    "Controlled project generation design completion audit:",
    "  This command audits the v12.0-v12.9 controlled generation design chain, including contracts, boundaries, bundle, CLI validation segmentation, contract audit, contract export preview, scenario coverage, CLI scope coverage, forbidden actions, and guarantees.",
    "  This is preview-only, read-only, and stdout-only. It has no runtime execution, no project generation, no contract execution, no runtime activation, no runtime routing, no runtime orchestration, no runtime persistence, no approval execution, no mutation execution, and no file writing.",
    "  Design completion audits do not write files by default.",
    "  It does not execute contracts, execute contract bundles, execute contract audits, execute contract exports, execute runtime, activate runtime, route runtime behavior, persist runtime state, execute approvals, persist approval state, execute mutations, execute rollback, execute recovery, enforce risks, execute validation commands, install dependencies, mutate package.json, scaffold files, create files, write files, or generate projects.",
    "  It does not activate governance, enforce policy, implement planner-agent runtime loops, implement builder-agent runtime loops, mutate files, expand mutation scope, or change repair orchestration.",
    "",
    renderCliSection("Read-only notice", [renderReadonlyNotice(true)])
  ].join("\n") + "\n";
}

export function renderGovernanceControlledRuntimeArchitectureHelp(): string {
  return [
    "# AI Software Factory CLI - governance controlled-runtime-architecture",
    "",
    "Usage:",
    "  node dist/cli.js governance controlled-runtime-architecture [options]",
    "",
    "Options:",
    "  --json      Print deterministic controlled runtime architecture preview output",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance controlled-runtime-architecture",
    "  node dist/cli.js governance controlled-runtime-architecture --json",
    "",
    "Controlled runtime architecture preview:",
    "  This command describes future controlled runtime architecture components and lifecycle phases as deterministic data only.",
    "  This is read-only, preview-only, and stdout-only.",
    "  It has no-runtime-execution, no-project-generation, and no-agent-execution.",
    "  It does not execute runtime, activate runtime, route runtime behavior, orchestrate runtime behavior, persist runtime state, generate projects, run builder agents, execute agents, run agent loops, enable multi-agent systems, execute approvals, execute mutations, create files, write files, install dependencies, mutate package.json, enforce policy, activate governance, enable autonomy, self-improve, self-modify, or change repair orchestration.",
    "  Controlled runtime architecture previews do not write files by default.",
    "",
    renderCliSection("Read-only notice", [renderReadonlyNotice(true)])
  ].join("\n") + "\n";
}

export function renderGovernanceControlledRuntimeComponentsHelp(): string {
  return [
    "# AI Software Factory CLI - governance controlled-runtime-components",
    "",
    "Usage:",
    "  node dist/cli.js governance controlled-runtime-components [options]",
    "",
    "Options:",
    "  --json      Print deterministic controlled runtime component contract output",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance controlled-runtime-components",
    "  node dist/cli.js governance controlled-runtime-components --json",
    "",
    "Controlled runtime component contracts:",
    "  This command describes future controlled runtime component responsibilities, allowed inputs, allowed outputs, dependencies, forbidden actions, and safety boundaries as deterministic data only.",
    "  This is read-only, preview-only, and stdout-only.",
    "  It has no-runtime-execution, no-runtime-activation, no-project-generation, and no-agent-execution.",
    "  It does not execute runtime, activate runtime, route runtime behavior, orchestrate runtime behavior, persist runtime state, execute contracts, execute inputs, execute outputs, generate projects, run builder agents, execute agents, execute approvals, execute mutations, create files, write files, install dependencies, mutate package.json, execute generated-project validation, enforce policy, activate governance, or change repair orchestration.",
    "  Controlled runtime component contract previews do not write files by default.",
    "",
    renderCliSection("Read-only notice", [renderReadonlyNotice(true)])
  ].join("\n") + "\n";
}

export function renderGovernanceControlledRuntimeFlowHelp(): string {
  return [
    "# AI Software Factory CLI - governance controlled-runtime-flow",
    "",
    "Usage:",
    "  node dist/cli.js governance controlled-runtime-flow [options]",
    "",
    "Options:",
    "  --json      Print deterministic controlled runtime flow preview output",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance controlled-runtime-flow",
    "  node dist/cli.js governance controlled-runtime-flow --json",
    "",
    "Controlled runtime flow preview:",
    "  This command describes future controlled runtime flow steps, transitions, handoff payloads, transition policies, and approval gates as deterministic data only.",
    "  This is read-only, preview-only, and stdout-only.",
    "  It has no-runtime-execution, no-runtime-routing, no-runtime-orchestration, no-project-generation, and no-agent-execution.",
    "  It does not execute runtime, activate runtime, route runtime behavior, orchestrate runtime behavior, persist runtime state, execute flows, execute contracts, execute inputs, execute outputs, generate projects, run builder agents, execute agents, execute approvals, execute mutations, create files, write files, install dependencies, mutate package.json, execute generated-project validation, enforce policy, activate governance, or change repair orchestration.",
    "  Controlled runtime flow previews do not write files by default.",
    "",
    renderCliSection("Read-only notice", [renderReadonlyNotice(true)])
  ].join("\n") + "\n";
}

export function renderGovernanceControlledRuntimeStateModelHelp(): string {
  return [
    "# AI Software Factory CLI - governance controlled-runtime-state-model",
    "",
    "Usage:",
    "  node dist/cli.js governance controlled-runtime-state-model [options]",
    "",
    "Options:",
    "  --json      Print deterministic controlled runtime state model preview output",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance controlled-runtime-state-model",
    "  node dist/cli.js governance controlled-runtime-state-model --json",
    "",
    "Controlled runtime state model preview:",
    "  This command describes future controlled runtime state fields, snapshots, transitions, persistence policies, visibility, allowed readers, and allowed writers as deterministic data only.",
    "  This is read-only, preview-only, and stdout-only.",
    "  It has no-runtime-execution, no-runtime-persistence, no-state-persistence, no-project-generation, and no-agent-execution.",
    "  It does not execute runtime, activate runtime, persist runtime state, persist approval state, route runtime behavior, orchestrate runtime behavior, execute flows, execute contracts, execute inputs, execute outputs, generate projects, run builder agents, execute agents, execute approvals, execute mutations, create files, write files, install dependencies, mutate package.json, execute generated-project validation, enforce policy, activate governance, or change repair orchestration.",
    "  Controlled runtime state model previews do not write files by default.",
    "",
    renderCliSection("Read-only notice", [renderReadonlyNotice(true)])
  ].join("\n") + "\n";
}

export function renderGovernanceRuntimeResearchAttestationPreviewHelp(): string {
  return [
    "# AI Software Factory CLI - governance runtime research-attestation-preview",
    "",
    "Usage:",
    "  node dist/cli.js governance runtime research-attestation-preview [options]",
    "",
    "Options:",
    "  --json      Print JSON output",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance runtime research-attestation-preview",
    "  node dist/cli.js governance runtime research-attestation-preview --json",
    "",
    "Runtime governance research attestation preview-only guarantee:",
    "  This command models runtime governance attestation groups, attestation records, attestation findings, attestation ownership summaries, preview-only attestation summaries, forbidden capability attestation findings, and future-only attestation notes only.",
    "  It does not activate runtime governance, approve runtime activation, execute runtime activation, enable runtime autonomy, enforce policies, activate config, execute sandboxes, execute rollback, apply overrides, or change repair orchestration.",
    "",
    renderCliSection("Read-only notice", [renderReadonlyNotice(true)])
  ].join("\n") + "\n";
}

export function renderGovernanceRepoClassificationPreviewHelp(): string {
  return [
    "# AI Software Factory CLI - governance repo classification-preview",
    "",
    "Usage:",
    "  node dist/cli.js governance repo classification-preview [options]",
    "",
    "Options:",
    "  --json      Print JSON output",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance repo classification-preview",
    "  node dist/cli.js governance repo classification-preview --json",
    "",
    "Preview-only guarantee:",
    "  This command classifies repositories and previews governance boundaries only.",
    "  It does not enforce boundaries, apply profiles, enforce policies, activate config, or change repair orchestration."
  ].join("\n") + "\n";
}

export function renderGovernanceProfileInheritancePreviewHelp(): string {
  return [
    "# AI Software Factory CLI - governance profile inheritance-preview",
    "",
    "Usage:",
    "  node dist/cli.js governance profile inheritance-preview [options]",
    "",
    "Options:",
    "  --json      Print JSON output",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance profile inheritance-preview",
    "  node dist/cli.js governance profile inheritance-preview --json",
    "",
    "Preview-only guarantee:",
    "  This command resolves governance profile inheritance in preview-only mode.",
    "  It does not apply profiles, enforce policies, activate config, or change runtime behavior."
  ].join("\n") + "\n";
}

export function renderGovernancePolicyRuntimePreviewHelp(): string {
  return [
    "# AI Software Factory CLI - governance policy runtime-preview",
    "",
    "Usage:",
    "  node dist/cli.js governance policy runtime-preview [options]",
    "",
    "Options:",
    "  --json      Print JSON output",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance policy runtime-preview",
    "  node dist/cli.js governance policy runtime-preview --json",
    "",
    "Preview-only guarantee:",
    "  This command builds a Policy-as-Code runtime preview only.",
    "  It does not activate runtime config, apply policies, or enforce policies.",
    "  Runtime behavior, governance decisions, and repair orchestration remain unchanged."
  ].join("\n") + "\n";
}

export function renderGovernanceConfigHelp(): string {
  return [
    "# AI Software Factory CLI - governance config",
    "",
    "Usage:",
    "  node dist/cli.js governance config [options]",
    "",
    "Options:",
    "  --json      Print JSON output",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance config",
    "  node dist/cli.js governance config --json",
    "  node dist/cli.js governance config example",
    "  node dist/cli.js governance config validate",
    "  node dist/cli.js governance config effective",
    "  node dist/cli.js governance config activation-plan",
    "  node dist/cli.js governance config load-preview",
    "  node dist/cli.js governance config snapshot-lock",
    "  node dist/cli.js governance config audit-trail",
    "",
    "Read-only guarantee:",
    "  Governance config preview does not modify repair behavior or governance indexes.",
    "  Governance config preview does not load, create, or enforce .factory/governance.config.json."
  ].join("\n") + "\n";
}

export function renderGovernanceConfigAuditTrailHelp(): string {
  return [
    "# AI Software Factory CLI - governance config audit-trail",
    "",
    "Usage:",
    "  node dist/cli.js governance config audit-trail [options]",
    "",
    "Options:",
    "  --json      Print JSON output",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance config audit-trail",
    "  node dist/cli.js governance config audit-trail --json",
    "",
    "Audit-preview guarantee:",
    "  This command records governance config snapshot-lock history only.",
    "  It does not apply config values or change runtime behavior."
  ].join("\n") + "\n";
}

export function renderGovernanceConfigSnapshotLockHelp(): string {
  return [
    "# AI Software Factory CLI - governance config snapshot-lock",
    "",
    "Usage:",
    "  node dist/cli.js governance config snapshot-lock [options]",
    "",
    "Options:",
    "  --json      Print JSON output",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance config snapshot-lock",
    "  node dist/cli.js governance config snapshot-lock --json",
    "",
    "Audit-preview guarantee:",
    "  This command converts a load-preview snapshot into a deterministic lock only.",
    "  It does not apply config values or change runtime behavior."
  ].join("\n") + "\n";
}

export function renderGovernanceConfigLoadPreviewHelp(): string {
  return [
    "# AI Software Factory CLI - governance config load-preview",
    "",
    "Usage:",
    "  node dist/cli.js governance config load-preview [options]",
    "",
    "Options:",
    "  --json      Print JSON output",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance config load-preview",
    "  node dist/cli.js governance config load-preview --json",
    "",
    "Preview-only guarantee:",
    "  This command loads governance config into a deterministic preview snapshot only.",
    "  It does not apply config values or change runtime behavior."
  ].join("\n") + "\n";
}

export function renderGovernanceConfigActivationPlanHelp(): string {
  return [
    "# AI Software Factory CLI - governance config activation-plan",
    "",
    "Usage:",
    "  node dist/cli.js governance config activation-plan [options]",
    "",
    "Options:",
    "  --json      Print JSON output",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance config activation-plan",
    "  node dist/cli.js governance config activation-plan --json",
    "",
    "Advisory-only guarantee:",
    "  This command plans future guarded config activation but does not activate it.",
    "  Runtime config loading remains disabled and config values are not applied."
  ].join("\n") + "\n";
}

export function renderGovernanceConfigEffectiveHelp(): string {
  return [
    "# AI Software Factory CLI - governance config effective",
    "",
    "Usage:",
    "  node dist/cli.js governance config effective [options]",
    "",
    "Options:",
    "  --json      Print JSON output",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance config effective",
    "  node dist/cli.js governance config effective --json",
    "",
    "Preview-only guarantee:",
    "  This command previews effective governance config but does not apply it.",
    "  Runtime governance config loading remains disabled."
  ].join("\n") + "\n";
}

export function renderGovernanceConfigValidateHelp(): string {
  return [
    "# AI Software Factory CLI - governance config validate",
    "",
    "Usage:",
    "  node dist/cli.js governance config validate [options]",
    "",
    "Options:",
    "  --json      Print JSON output",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance config validate",
    "  node dist/cli.js governance config validate --json",
    "",
    "Validation-only guarantee:",
    "  This command validates .factory/governance.config.json but does not apply it.",
    "  This command does not create, overwrite, load, or enforce runtime governance configuration."
  ].join("\n") + "\n";
}

export function renderGovernanceConfigExampleHelp(): string {
  return [
    "# AI Software Factory CLI - governance config example",
    "",
    "Usage:",
    "  node dist/cli.js governance config example [options]",
    "",
    "Options:",
    "  --json      Print JSON output",
    "  --write     Write .factory/governance.config.example.json",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance config example",
    "  node dist/cli.js governance config example --json",
    "  node dist/cli.js governance config example --write",
    "",
    "Read-only/runtime guarantee:",
    "  This command does not load or enforce runtime governance configuration.",
    "  This command does not create .factory/governance.config.json.",
    "  The --write option writes only .factory/governance.config.example.json."
  ].join("\n") + "\n";
}

export function renderRunsHelp(): string {
  return [
    "# AI Software Factory CLI - runs",
    "",
    "Usage:",
    "  node dist/cli.js runs [options]",
    "",
    "Options:",
    "  --repo <path>        Path to target repository",
    "  --limit <n>          Show latest n runs",
    "  --status <status>    Filter by governance status",
    "  --blocked            Show only blocked runs",
    "  --human-review       Show only human-review runs",
    "  --latest             Show latest run only",
    "  --json               Print JSON output",
    "  --export [format]    Export dashboard: json, markdown, csv, all",
    "  --archive            Archive generated export files",
    "  --help, -h           Show help",
    "",
    "Statuses:",
    "  ready",
    "  ready-with-caution",
    "  manual-review-required",
    "  blocked",
    "",
    "Examples:",
    "  node dist/cli.js runs --limit 10",
    "  node dist/cli.js runs --status blocked",
    "  node dist/cli.js runs --export all",
    "  node dist/cli.js runs --export all --archive",
    "  node dist/cli.js runs --json",
    "",
    "Read-only guarantee:",
    "  This command reads .factory/runs-index.json and does not modify repair behavior.",
    "  The --archive option only works with --export and writes under .factory/archive."
  ].join("\n") + "\n";
}

export function renderInsightsHelp(): string {
  return [
    "# AI Software Factory CLI - insights",
    "",
    "Usage:",
    "  node dist/cli.js insights [options]",
    "",
    "Options:",
    "  --repo <path>      Path to target repository",
    "  --profile <name>   Use governance policy profile",
    "  --profiles         List available profiles",
    "  --json             Print JSON output",
    "  --export           Export insights JSON/Markdown",
    "  --archive          Archive generated export files",
    "  --help, -h         Show help",
    "",
    "Profiles:",
    "  conservative",
    "  balanced",
    "  experimental",
    "",
    "Examples:",
    "  node dist/cli.js insights",
    "  node dist/cli.js insights --profile conservative",
    "  node dist/cli.js insights --profiles",
    "  node dist/cli.js insights --json --export",
    "  node dist/cli.js insights --export --archive",
    "",
    "Read-only guarantee:",
    "  This command reads .factory/runs-index.json and does not modify repair behavior.",
    "  The --archive option only works with --export and writes under .factory/archive."
  ].join("\n") + "\n";
}

export function renderCiSummaryHelp(): string {
  return [
    "# AI Software Factory CLI - ci-summary",
    "",
    "Usage:",
    "  node dist/cli.js ci-summary [options]",
    "",
    "Options:",
    "  --repo <path>      Path to target repository",
    "  --profile <name>   Use governance policy profile",
    "  --json             Print JSON output",
    "  --export           Export CI summary JSON/Markdown",
    "  --archive          Archive generated export files",
    "  --help, -h         Show help",
    "",
    "Exit codes:",
    "  pass  -> 0",
    "  warn  -> 0",
    "  fail  -> 1",
    "",
    "Examples:",
    "  node dist/cli.js ci-summary",
    "  node dist/cli.js ci-summary --profile conservative",
    "  node dist/cli.js ci-summary --json",
    "  node dist/cli.js ci-summary --export",
    "  node dist/cli.js ci-summary --export --archive",
    "",
    "Read-only guarantee:",
    "  This command reads .factory/runs-index.json and does not modify repair behavior.",
    "  The --archive option only works with --export and writes under .factory/archive."
  ].join("\n") + "\n";
}

export function renderArchiveHelp(): string {
  return [
    "# AI Software Factory CLI - archive",
    "",
    "Usage:",
    "  node dist/cli.js archive [options]",
    "",
    "Options:",
    "  --repo <path>   Path to target repository",
    "  --latest        Show latest archive snapshot only",
    "  --kind <kind>   Filter by archive kind",
    "  --limit <n>     Show latest n archive snapshots",
    "  --json          Print JSON output",
    "  --help, -h      Show help",
    "",
    "Kinds:",
    "  runs-dashboard",
    "  governance-insights",
    "  governance-ci-summary",
    "",
    "Examples:",
    "  node dist/cli.js archive",
    "  node dist/cli.js archive --latest",
    "  node dist/cli.js archive --kind governance-insights",
    "  node dist/cli.js archive --kind governance-ci-summary --limit 5",
    "  node dist/cli.js archive --json",
    "",
    "Diff usage:",
    "  node dist/cli.js archive diff <archiveIdA> <archiveIdB>",
    "",
    "Diff examples:",
    "  node dist/cli.js archive diff <A> <B>",
    "  node dist/cli.js archive diff <A> <B> --json",
    "",
    "Supported diff kinds:",
    "  governance-insights",
    "  governance-ci-summary",
    "",
    "Read-only guarantee:",
    "  This command reads .factory/archive-index.json and does not modify repair behavior.",
    "  Archive diff does not modify repair behavior or archive data."
  ].join("\n") + "\n";
}

export function renderTrendsHelp(): string {
  return [
    "# AI Software Factory CLI - trends",
    "",
    "Usage:",
    "  node dist/cli.js trends [options]",
    "",
    "Options:",
    "  --repo <path>   Path to target repository",
    "  --kind <kind>   Archive kind to analyze",
    "  --window <n>    Snapshot window size",
    "  --json          Print JSON output",
    "  --help, -h      Show help",
    "",
    "Supported kinds:",
    "  governance-insights",
    "",
    "Examples:",
    "  node dist/cli.js trends",
    "  node dist/cli.js trends --window 20",
    "  node dist/cli.js trends --kind governance-insights",
    "  node dist/cli.js trends --json",
    "",
    "Read-only guarantee:",
    "  Trend analysis reads archive history and does not modify repair behavior.",
    "  Trend analysis does not modify .factory/archive-index.json or .factory/runs-index.json."
  ].join("\n") + "\n";
}

export function renderDriftHelp(): string {
  return [
    "# AI Software Factory CLI - drift",
    "",
    "Usage:",
    "  node dist/cli.js drift [options]",
    "",
    "Options:",
    "  --repo <path>                Path to target repository",
    "  --kind <kind>                Archive kind to analyze",
    "  --baseline-window <n>       Historical baseline window",
    "  --comparison-window <n>     Recent comparison window",
    "  --json                      Print JSON output",
    "  --help, -h                  Show help",
    "",
    "Supported kinds:",
    "  governance-insights",
    "",
    "Examples:",
    "  node dist/cli.js drift",
    "  node dist/cli.js drift --baseline-window 30",
    "  node dist/cli.js drift --comparison-window 10",
    "  node dist/cli.js drift --json",
    "",
    "Read-only guarantee:",
    "  Drift detection reads governance history and does not modify repair behavior.",
    "  Drift detection does not modify .factory/archive-index.json or .factory/runs-index.json."
  ].join("\n") + "\n";
}

export function renderStabilityHelp(): string {
  return [
    "# AI Software Factory CLI - stability",
    "",
    "Usage:",
    "  node dist/cli.js stability [options]",
    "",
    "Options:",
    "  --repo <path>                Path to target repository",
    "  --window <n>                 Trend analysis window",
    "  --baseline-window <n>       Drift baseline window",
    "  --comparison-window <n>     Drift comparison window",
    "  --json                      Print JSON output",
    "  --help, -h                  Show help",
    "",
    "Examples:",
    "  node dist/cli.js stability",
    "  node dist/cli.js stability --window 20",
    "  node dist/cli.js stability --baseline-window 30",
    "  node dist/cli.js stability --comparison-window 10",
    "  node dist/cli.js stability --json",
    "",
    "Read-only guarantee:",
    "  Stability scoring reads governance history and does not modify repair behavior.",
    "  Stability scoring does not modify .factory/archive-index.json or .factory/runs-index.json."
  ].join("\n") + "\n";
}

export function renderEscalationHelp(): string {
  return [
    "# AI Software Factory CLI - escalation",
    "",
    "Usage:",
    "  node dist/cli.js escalation [options]",
    "",
    "Options:",
    "  --repo <path>                Path to target repository",
    "  --window <n>                 Trend analysis window",
    "  --baseline-window <n>       Drift baseline window",
    "  --comparison-window <n>     Drift comparison window",
    "  --json                      Print JSON output",
    "  --help, -h                  Show help",
    "",
    "Examples:",
    "  node dist/cli.js escalation",
    "  node dist/cli.js escalation --window 20",
    "  node dist/cli.js escalation --baseline-window 30",
    "  node dist/cli.js escalation --comparison-window 10",
    "  node dist/cli.js escalation --json",
    "",
    "Read-only guarantee:",
    "  Escalation analysis reads governance history and does not modify repair behavior.",
    "  Escalation analysis does not send notifications or call external services.",
    "  Escalation analysis does not modify .factory/archive-index.json or .factory/runs-index.json."
  ].join("\n") + "\n";
}

export function renderPolicyHelp(): string {
  return [
    "# AI Software Factory CLI - policy",
    "",
    "Usage:",
    "  node dist/cli.js policy [options]",
    "",
    "Options:",
    "  --repo <path>                Path to target repository",
    "  --window <n>                 Trend analysis window",
    "  --baseline-window <n>       Drift baseline window",
    "  --comparison-window <n>     Drift comparison window",
    "  --json                      Print JSON output",
    "  --help, -h                  Show help",
    "",
    "Examples:",
    "  node dist/cli.js policy",
    "  node dist/cli.js policy --window 20",
    "  node dist/cli.js policy --baseline-window 30",
    "  node dist/cli.js policy --comparison-window 10",
    "  node dist/cli.js policy --json",
    "",
    "Read-only guarantee:",
    "  Policy recommendation reads governance history and does not modify repair behavior.",
    "  Policy recommendation does not enforce policies automatically.",
    "  Policy recommendation does not modify .factory/archive-index.json or .factory/runs-index.json."
  ].join("\n") + "\n";
}

export function renderDecisionMatrixHelp(): string {
  return [
    "# AI Software Factory CLI - decision-matrix",
    "",
    "Usage:",
    "  node dist/cli.js decision-matrix [options]",
    "",
    "Options:",
    "  --repo <path>                Path to target repository",
    "  --window <n>                 Trend analysis window",
    "  --baseline-window <n>       Drift baseline window",
    "  --comparison-window <n>     Drift comparison window",
    "  --json                      Print JSON output",
    "  --help, -h                  Show help",
    "",
    "Examples:",
    "  node dist/cli.js decision-matrix",
    "  node dist/cli.js decision-matrix --window 20",
    "  node dist/cli.js decision-matrix --json",
    "",
    "Read-only guarantee:",
    "  Decision matrix analysis explains governance decisions and does not modify repair behavior.",
    "  Decision matrix analysis does not change governance decisions or policy recommendations.",
    "  Decision matrix analysis does not modify .factory/archive-index.json or .factory/runs-index.json."
  ].join("\n") + "\n";
}

export function renderEvidencePackHelp(): string {
  return [
    "# AI Software Factory CLI - evidence-pack",
    "",
    "Usage:",
    "  node dist/cli.js evidence-pack [options]",
    "",
    "Options:",
    "  --repo <path>                Path to target repository",
    "  --window <n>                 Trend analysis window",
    "  --baseline-window <n>       Drift baseline window",
    "  --comparison-window <n>     Drift comparison window",
    "  --json                      Print JSON output",
    "  --help, -h                  Show help",
    "",
    "Examples:",
    "  node dist/cli.js evidence-pack",
    "  node dist/cli.js evidence-pack --window 20",
    "  node dist/cli.js evidence-pack --json",
    "",
    "Read-only guarantee:",
    "  Evidence pack export does not modify repair behavior.",
    "  Evidence pack export does not change governance decisions or policy recommendations.",
    "  Evidence pack export does not modify .factory/archive-index.json or .factory/runs-index.json."
  ].join("\n") + "\n";
}

export function renderEvidenceListHelp(): string {
  return [
    "# AI Software Factory CLI - evidence-list",
    "",
    "Usage:",
    "  node dist/cli.js evidence-list [options]",
    "",
    "Options:",
    "  --repo <path>             Path to target repository",
    "  --latest                  Show latest evidence pack only",
    "  --limit <n>               Limit results",
    "  --policy <mode>           Filter by policy mode",
    "  --escalation <level>      Filter by escalation level",
    "  --json                    Print JSON output",
    "  --help, -h                Show help",
    "",
    "Policy modes:",
    "  normal",
    "  conservative",
    "  restricted",
    "  manual-review-only",
    "",
    "Escalation levels:",
    "  none",
    "  info",
    "  warning",
    "  high-risk",
    "  critical",
    "",
    "Examples:",
    "  node dist/cli.js evidence-list",
    "  node dist/cli.js evidence-list --latest",
    "  node dist/cli.js evidence-list --limit 20",
    "  node dist/cli.js evidence-list --policy restricted",
    "  node dist/cli.js evidence-list --escalation critical",
    "  node dist/cli.js evidence-list --json",
    "",
    "Read-only guarantee:",
    "  Evidence registry browsing does not modify repair behavior.",
    "  Evidence registry browsing reads .factory/evidence-index.json.",
    "  Evidence registry browsing does not modify .factory/archive-index.json or .factory/runs-index.json."
  ].join("\n") + "\n";
}

export function renderEvidenceDiffHelp(): string {
  return [
    "# AI Software Factory CLI - evidence-diff",
    "",
    "Usage:",
    "  node dist/cli.js evidence-diff <evidencePackIdA> <evidencePackIdB> [options]",
    "",
    "Options:",
    "  --repo <path>   Path to target repository",
    "  --json          Print JSON output",
    "  --help, -h      Show help",
    "",
    "Examples:",
    "  node dist/cli.js evidence-diff <A> <B>",
    "  node dist/cli.js evidence-diff <A> <B> --json",
    "",
    "Read-only guarantee:",
    "  Evidence diff compares existing evidence packs and does not modify repair behavior.",
    "  Evidence diff does not modify .factory/evidence-index.json.",
    "  Evidence diff does not modify .factory/archive-index.json or .factory/runs-index.json."
  ].join("\n") + "\n";
}

export function renderUnknownCommandError(command: string): string {
  return [
    `Unknown command: ${command}`,
    "",
    "Run:",
    "  node dist/cli.js --help",
    "",
    "for available commands."
  ].join("\n") + "\n";
}

export function renderInvalidFlagError(command: string, flag: string): string {
  return [
    `Invalid option for ${command}: ${flag}`,
    "",
    "Run:",
    `  node dist/cli.js ${command} --help`,
    "",
    "for usage."
  ].join("\n") + "\n";
}

export function renderArchiveRequiresExportError(command: string): string {
  return [
    "Archive option requires --export.",
    "",
    "Run:",
    `  node dist/cli.js ${command} --help`,
    "",
    "for usage."
  ].join("\n") + "\n";
}
