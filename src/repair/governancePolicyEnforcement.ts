import type { GovernanceEscalation } from "./governanceEscalation.js";

export type GovernancePolicyMode = "normal" | "conservative" | "restricted" | "manual-review-only";

export type GovernancePolicyRecommendation = {
  version: 1;
  recommendedPolicyMode: GovernancePolicyMode;
  autonomousOperationAllowed: boolean;
  operatorApprovalRequired: boolean;
  ciModeRecommendation: "normal" | "strict" | "restricted";
  summary: string;
  reasons: Array<{
    severity: "info" | "warning" | "critical";
    code: string;
    message: string;
  }>;
  recommendedRestrictions: string[];
  sourceSignals: {
    escalationLevel?: string;
    stabilityLevel?: string;
    stabilityScore?: number;
    driftSeverity?: string;
    trendHealth?: string;
    criticalAnomalyCount?: number;
    warningAnomalyCount?: number;
  };
  generatedAt: string;
};

const UNKNOWN_GENERATED_AT = "1970-01-01T00:00:00.000Z";

function rank(mode: GovernancePolicyMode): number {
  if (mode === "manual-review-only") return 3;
  if (mode === "restricted") return 2;
  if (mode === "conservative") return 1;
  return 0;
}

function maxMode(current: GovernancePolicyMode, candidate: GovernancePolicyMode): GovernancePolicyMode {
  return rank(candidate) > rank(current) ? candidate : current;
}

function modeFromEscalation(escalationLevel?: string): GovernancePolicyMode {
  if (escalationLevel === "critical") return "manual-review-only";
  if (escalationLevel === "high-risk") return "restricted";
  if (escalationLevel === "warning") return "conservative";
  return "normal";
}

function ciModeFor(mode: GovernancePolicyMode): GovernancePolicyRecommendation["ciModeRecommendation"] {
  if (mode === "manual-review-only") return "restricted";
  if (mode === "restricted" || mode === "conservative") return "strict";
  return "normal";
}

function summaryFor(mode: GovernancePolicyMode): string {
  if (mode === "manual-review-only") return "Manual-review-only governance operation is recommended.";
  if (mode === "restricted") return "Restricted governance operation is recommended.";
  if (mode === "conservative") return "Conservative governance operation is recommended.";
  return "Normal autonomous governance operation is recommended.";
}

function restrictionsFor(mode: GovernancePolicyMode): string[] {
  if (mode === "manual-review-only") {
    return [
      "Disable unrestricted autonomous operation.",
      "Require manual review for governance-sensitive workflows.",
      "Inspect governance escalation and drift reports immediately."
    ];
  }
  if (mode === "restricted") {
    return [
      "Require operator approval for high-risk autonomous workflows.",
      "Review drift and escalation reports before autonomous operation."
    ];
  }
  if (mode === "conservative") {
    return [
      "Prefer conservative governance policy profiles.",
      "Review governance warnings regularly."
    ];
  }
  return ["No governance restrictions recommended."];
}

function addReason(
  reasons: GovernancePolicyRecommendation["reasons"],
  severity: "info" | "warning" | "critical",
  code: string,
  message: string
): void {
  if (!reasons.some((reason) => reason.code === code)) {
    reasons.push({ severity, code, message });
  }
}

export function buildGovernancePolicyEnforcement(input: {
  escalation?: GovernanceEscalation;
  generatedAt?: string;
}): GovernancePolicyRecommendation {
  const escalation = input.escalation;
  const sourceSignals: GovernancePolicyRecommendation["sourceSignals"] = {
    escalationLevel: escalation?.escalationLevel,
    stabilityLevel: escalation?.sourceSignals.stabilityLevel,
    stabilityScore: escalation?.sourceSignals.stabilityScore,
    driftSeverity: escalation?.sourceSignals.driftSeverity,
    trendHealth: escalation?.sourceSignals.trendHealth,
    criticalAnomalyCount: escalation?.sourceSignals.criticalAnomalyCount,
    warningAnomalyCount: escalation?.sourceSignals.warningAnomalyCount
  };

  let mode = modeFromEscalation(sourceSignals.escalationLevel);
  const reasons: GovernancePolicyRecommendation["reasons"] = [];

  if (sourceSignals.escalationLevel === "warning") {
    addReason(reasons, "warning", "ESCALATION_WARNING", "Governance escalation level is warning.");
  }
  if (sourceSignals.escalationLevel === "high-risk") {
    addReason(reasons, "warning", "ESCALATION_HIGH_RISK", "Governance escalation level is high-risk.");
  }
  if (sourceSignals.escalationLevel === "critical") {
    addReason(reasons, "critical", "ESCALATION_CRITICAL", "Governance escalation level is critical.");
  }

  if (typeof sourceSignals.stabilityScore === "number" && sourceSignals.stabilityScore < 40) {
    mode = maxMode(mode, "manual-review-only");
    addReason(reasons, "critical", "LOW_STABILITY_SCORE", "Governance stability score is below manual-review threshold.");
  }
  if (sourceSignals.driftSeverity === "critical") {
    mode = maxMode(mode, "manual-review-only");
    addReason(reasons, "critical", "CRITICAL_GOVERNANCE_DRIFT", "Governance drift severity is critical.");
  }
  if ((sourceSignals.criticalAnomalyCount ?? 0) >= 2) {
    mode = maxMode(mode, "manual-review-only");
    addReason(reasons, "critical", "MULTIPLE_CRITICAL_ANOMALIES", "Multiple critical governance anomalies were detected.");
  }
  if (sourceSignals.stabilityLevel === "unstable") {
    mode = maxMode(mode, "restricted");
    addReason(reasons, "warning", "STABILITY_UNSTABLE", "Governance stability is unstable.");
  }
  if (sourceSignals.stabilityLevel === "critical") {
    mode = maxMode(mode, "manual-review-only");
    addReason(reasons, "critical", "STABILITY_CRITICAL", "Governance stability is critical.");
  }
  if (sourceSignals.trendHealth === "critical") {
    mode = maxMode(mode, "manual-review-only");
    addReason(reasons, "critical", "TREND_HEALTH_CRITICAL", "Governance trend health is critical.");
  }

  if (reasons.length === 0) {
    addReason(reasons, "info", "GOVERNANCE_HEALTHY", "Governance signals remain within healthy operational ranges.");
  }

  return {
    version: 1,
    recommendedPolicyMode: mode,
    autonomousOperationAllowed: mode === "normal" || mode === "conservative",
    operatorApprovalRequired: mode !== "normal",
    ciModeRecommendation: ciModeFor(mode),
    summary: summaryFor(mode),
    reasons,
    recommendedRestrictions: restrictionsFor(mode),
    sourceSignals,
    generatedAt: input.generatedAt ?? escalation?.generatedAt ?? UNKNOWN_GENERATED_AT
  };
}

function formatValue(value: number | string | boolean | null | undefined): string {
  if (value === null || value === undefined) return "unknown";
  return String(value);
}

export function renderGovernancePolicyEnforcementMarkdown(policy: GovernancePolicyRecommendation): string {
  const lines = [
    "# AI Software Factory - Governance Policy Recommendation",
    "",
    "Recommended policy mode:",
    policy.recommendedPolicyMode,
    "",
    "Autonomous operation allowed:",
    String(policy.autonomousOperationAllowed),
    "",
    "Operator approval required:",
    String(policy.operatorApprovalRequired),
    "",
    "CI recommendation:",
    policy.ciModeRecommendation,
    "",
    "Summary:",
    policy.summary,
    "",
    "## Source Signals",
    "",
    `- escalation level: ${formatValue(policy.sourceSignals.escalationLevel)}`,
    `- stability score: ${formatValue(policy.sourceSignals.stabilityScore)}`,
    `- stability level: ${formatValue(policy.sourceSignals.stabilityLevel)}`,
    `- drift severity: ${formatValue(policy.sourceSignals.driftSeverity)}`,
    `- trend health: ${formatValue(policy.sourceSignals.trendHealth)}`,
    `- critical anomalies: ${formatValue(policy.sourceSignals.criticalAnomalyCount)}`,
    `- warning anomalies: ${formatValue(policy.sourceSignals.warningAnomalyCount)}`,
    "",
    "## Reasons",
    ""
  ];

  for (const reason of policy.reasons) {
    lines.push(`- [${reason.severity}] ${reason.code} - ${reason.message}`);
  }

  lines.push("", "## Recommended Restrictions", "");
  for (const restriction of policy.recommendedRestrictions) {
    lines.push(`- ${restriction}`);
  }

  return `${lines.join("\n")}\n`;
}

export function renderGovernancePolicyEnforcementText(policy: GovernancePolicyRecommendation): string {
  return renderGovernancePolicyEnforcementMarkdown(policy);
}
