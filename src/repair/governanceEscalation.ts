import type { GovernanceStabilityScore } from "./governanceStabilityScore.js";

export type GovernanceEscalationLevel = "none" | "info" | "warning" | "high-risk" | "critical";

export type GovernanceEscalation = {
  version: 1;
  escalationLevel: GovernanceEscalationLevel;
  requiresOperatorAttention: boolean;
  summary: string;
  triggers: Array<{
    code: string;
    severity: "info" | "warning" | "critical";
    message: string;
  }>;
  recommendedActions: string[];
  sourceSignals: {
    stabilityScore?: number;
    stabilityLevel?: string;
    driftSeverity?: string;
    trendHealth?: string;
    criticalAnomalyCount?: number;
    warningAnomalyCount?: number;
    governanceVolatilityScore?: number | null;
    trustVolatilityScore?: number | null;
    validationVolatilityScore?: number | null;
  };
  generatedAt: string;
};

const UNKNOWN_GENERATED_AT = "1970-01-01T00:00:00.000Z";

function rank(level: GovernanceEscalationLevel): number {
  if (level === "critical") return 4;
  if (level === "high-risk") return 3;
  if (level === "warning") return 2;
  if (level === "info") return 1;
  return 0;
}

function maxLevel(current: GovernanceEscalationLevel, candidate: GovernanceEscalationLevel): GovernanceEscalationLevel {
  return rank(candidate) > rank(current) ? candidate : current;
}

function levelFromStability(stabilityLevel?: string): GovernanceEscalationLevel {
  if (stabilityLevel === "critical") return "critical";
  if (stabilityLevel === "unstable") return "high-risk";
  if (stabilityLevel === "caution") return "warning";
  return "none";
}

function summaryFor(level: GovernanceEscalationLevel): string {
  if (level === "none") return "No governance escalation is required.";
  if (level === "info") return "Governance state contains informational signals only.";
  if (level === "warning") return "Governance warning detected. Operator review is recommended.";
  if (level === "high-risk") return "High-risk governance condition detected. Operator attention is required.";
  return "Critical governance condition detected. Immediate operator intervention is recommended.";
}

function actionsFor(level: GovernanceEscalationLevel): string[] {
  if (level === "none") return ["No operator action required."];
  if (level === "info") return ["Review informational governance signals when convenient."];
  if (level === "warning") {
    return [
      "Review governance warnings before continuing autonomous operation.",
      "Inspect recent trend and drift reports."
    ];
  }
  if (level === "high-risk") {
    return [
      "Pause high-risk autonomous workflows until reviewed.",
      "Inspect stability, drift, and trend artifacts.",
      "Review recent archive snapshots for regressions."
    ];
  }
  return [
    "Immediately review governance stability and drift reports.",
    "Do not rely on autonomous operation until critical conditions are resolved.",
    "Inspect recent archive snapshots and CI summaries."
  ];
}

function countAnomalies(stability: GovernanceStabilityScore | undefined, severity: "warning" | "critical"): number {
  return (stability?.anomalies ?? []).filter((anomaly) => anomaly.severity === severity).length;
}

function addTrigger(
  triggers: GovernanceEscalation["triggers"],
  code: string,
  severity: "info" | "warning" | "critical",
  message: string
): void {
  if (!triggers.some((trigger) => trigger.code === code)) {
    triggers.push({ code, severity, message });
  }
}

function isNoHistory(stability: GovernanceStabilityScore | undefined): boolean {
  return stability?.anomalies.some((anomaly) => anomaly.code === "NO_ARCHIVE_HISTORY") === true;
}

export function buildGovernanceEscalation(input: {
  stability?: GovernanceStabilityScore;
  generatedAt?: string;
}): GovernanceEscalation {
  const stability = input.stability;
  const criticalAnomalyCount = countAnomalies(stability, "critical");
  const warningAnomalyCount = countAnomalies(stability, "warning");
  const sourceSignals: GovernanceEscalation["sourceSignals"] = {
    stabilityScore: stability?.score,
    stabilityLevel: stability?.level,
    driftSeverity: stability?.metrics.driftSeverity,
    trendHealth: stability?.metrics.trendHealth,
    criticalAnomalyCount,
    warningAnomalyCount,
    governanceVolatilityScore: stability?.metrics.governanceVolatilityScore ?? null,
    trustVolatilityScore: stability?.metrics.trustVolatilityScore ?? null,
    validationVolatilityScore: stability?.metrics.validationVolatilityScore ?? null
  };

  const triggers: GovernanceEscalation["triggers"] = [];
  let escalationLevel = levelFromStability(stability?.level);

  if (!isNoHistory(stability)) {
    if (stability?.level === "caution") {
      addTrigger(triggers, "STABILITY_CAUTION", "warning", "Governance stability is in caution state.");
    }
    if (stability?.level === "unstable") {
      addTrigger(triggers, "STABILITY_UNSTABLE", "warning", "Governance stability is unstable.");
    }
    if (stability?.level === "critical") {
      addTrigger(triggers, "STABILITY_CRITICAL", "critical", "Governance stability is critical.");
    }

    if (typeof stability?.score === "number" && stability.score < 40) {
      escalationLevel = maxLevel(escalationLevel, "critical");
    }

    if (sourceSignals.driftSeverity === "critical") {
      escalationLevel = maxLevel(escalationLevel, "critical");
      addTrigger(triggers, "CRITICAL_GOVERNANCE_DRIFT", "critical", "Governance drift severity is critical.");
    }
    if (sourceSignals.driftSeverity === "high") {
      escalationLevel = maxLevel(escalationLevel, "high-risk");
      addTrigger(triggers, "HIGH_GOVERNANCE_DRIFT", "warning", "Governance drift severity is high.");
    }

    if (sourceSignals.trendHealth === "critical") {
      escalationLevel = maxLevel(escalationLevel, "critical");
      addTrigger(triggers, "TREND_HEALTH_CRITICAL", "critical", "Governance trend health is critical.");
    }
    if (sourceSignals.trendHealth === "warning") {
      addTrigger(triggers, "TREND_HEALTH_WARNING", "warning", "Governance trend health is warning.");
    }

    if (criticalAnomalyCount >= 2) {
      escalationLevel = maxLevel(escalationLevel, "critical");
      addTrigger(triggers, "MULTIPLE_CRITICAL_ANOMALIES", "critical", "Multiple critical governance anomalies were detected.");
    } else if (criticalAnomalyCount === 1) {
      escalationLevel = maxLevel(escalationLevel, "high-risk");
      addTrigger(triggers, "CRITICAL_ANOMALY", "critical", "A critical governance anomaly was detected.");
    }

    if (typeof sourceSignals.governanceVolatilityScore === "number" && sourceSignals.governanceVolatilityScore > 25) {
      escalationLevel = maxLevel(escalationLevel, "warning");
      addTrigger(triggers, "HIGH_GOVERNANCE_VOLATILITY", "warning", "Governance volatility is above escalation threshold.");
    }
    if (typeof sourceSignals.trustVolatilityScore === "number" && sourceSignals.trustVolatilityScore > 25) {
      escalationLevel = maxLevel(escalationLevel, "warning");
      addTrigger(triggers, "HIGH_TRUST_VOLATILITY", "warning", "Trust volatility is above escalation threshold.");
    }
    if (typeof sourceSignals.validationVolatilityScore === "number" && sourceSignals.validationVolatilityScore > 25) {
      escalationLevel = maxLevel(escalationLevel, "warning");
      addTrigger(triggers, "HIGH_VALIDATION_VOLATILITY", "warning", "Validation volatility is above escalation threshold.");
    }
  } else {
    escalationLevel = "none";
  }

  if (triggers.length === 0) {
    addTrigger(triggers, "NO_ESCALATION", "info", "No governance escalation triggers were detected.");
  }

  return {
    version: 1,
    escalationLevel,
    requiresOperatorAttention: escalationLevel === "warning" || escalationLevel === "high-risk" || escalationLevel === "critical",
    summary: summaryFor(escalationLevel),
    triggers,
    recommendedActions: actionsFor(escalationLevel),
    sourceSignals,
    generatedAt: input.generatedAt ?? stability?.generatedAt ?? UNKNOWN_GENERATED_AT
  };
}

function formatValue(value: number | string | boolean | null | undefined): string {
  if (value === null || value === undefined) return "unknown";
  return String(value);
}

export function renderGovernanceEscalationMarkdown(escalation: GovernanceEscalation): string {
  const lines = [
    "# AI Software Factory - Governance Escalation",
    "",
    "Escalation level:",
    escalation.escalationLevel,
    "",
    "Requires operator attention:",
    String(escalation.requiresOperatorAttention),
    "",
    "Summary:",
    escalation.summary,
    "",
    "## Source Signals",
    "",
    `- stability score: ${formatValue(escalation.sourceSignals.stabilityScore)}`,
    `- stability level: ${formatValue(escalation.sourceSignals.stabilityLevel)}`,
    `- drift severity: ${formatValue(escalation.sourceSignals.driftSeverity)}`,
    `- trend health: ${formatValue(escalation.sourceSignals.trendHealth)}`,
    `- critical anomalies: ${formatValue(escalation.sourceSignals.criticalAnomalyCount)}`,
    `- warning anomalies: ${formatValue(escalation.sourceSignals.warningAnomalyCount)}`,
    `- governance volatility: ${formatValue(escalation.sourceSignals.governanceVolatilityScore)}`,
    `- trust volatility: ${formatValue(escalation.sourceSignals.trustVolatilityScore)}`,
    `- validation volatility: ${formatValue(escalation.sourceSignals.validationVolatilityScore)}`,
    "",
    "## Triggers",
    ""
  ];

  for (const trigger of escalation.triggers) {
    lines.push(`- [${trigger.severity}] ${trigger.code} - ${trigger.message}`);
  }

  lines.push("", "## Recommended Actions", "");
  for (const action of escalation.recommendedActions) {
    lines.push(`- ${action}`);
  }

  return `${lines.join("\n")}\n`;
}

export function renderGovernanceEscalationText(escalation: GovernanceEscalation): string {
  return renderGovernanceEscalationMarkdown(escalation);
}
