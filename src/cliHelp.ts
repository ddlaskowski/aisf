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
