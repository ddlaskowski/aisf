import type { GovernanceDriftDetection } from "./governanceDriftDetection.js";
import type { GovernanceEscalation } from "./governanceEscalation.js";
import type { GovernancePolicyRecommendation } from "./governancePolicyEnforcement.js";
import type { GovernanceStabilityScore } from "./governanceStabilityScore.js";
import type { GovernanceTrendAnalysis } from "./governanceTrendAnalysis.js";

export type GovernanceDecisionMatrixEntry = {
  stage: "trend-analysis" | "drift-detection" | "stability-scoring" | "escalation" | "policy-enforcement";
  ruleId: string;
  inputSignal: string;
  evaluation: "matched" | "not-matched" | "upgraded" | "downgraded" | "informational";
  impact: "none" | "low" | "medium" | "high" | "critical";
  explanation: string;
};

export type GovernanceDecisionMatrix = {
  version: 1;
  finalDecision: {
    policyMode: string;
    escalationLevel: string;
    stabilityLevel: string;
    operatorApprovalRequired: boolean;
    autonomousOperationAllowed: boolean;
  };
  matrix: GovernanceDecisionMatrixEntry[];
  decisionSummary: string;
  generatedAt: string;
};

const UNKNOWN_GENERATED_AT = "1970-01-01T00:00:00.000Z";

function impactForDrift(severity?: string): GovernanceDecisionMatrixEntry["impact"] {
  if (severity === "critical") return "critical";
  if (severity === "high") return "high";
  if (severity === "medium") return "medium";
  if (severity === "low") return "low";
  return "none";
}

function impactForStability(level?: string): GovernanceDecisionMatrixEntry["impact"] {
  if (level === "critical") return "critical";
  if (level === "unstable") return "high";
  if (level === "caution") return "medium";
  return "none";
}

function impactForEscalation(level?: string): GovernanceDecisionMatrixEntry["impact"] {
  if (level === "critical") return "critical";
  if (level === "high-risk") return "high";
  if (level === "warning") return "medium";
  if (level === "info") return "low";
  return "none";
}

function impactForPolicy(mode?: string): GovernanceDecisionMatrixEntry["impact"] {
  if (mode === "manual-review-only") return "critical";
  if (mode === "restricted") return "high";
  if (mode === "conservative") return "medium";
  return "none";
}

function summaryFor(policyMode: string): string {
  if (policyMode === "manual-review-only") return "Governance decisions resulted in manual-review-only operational policy.";
  if (policyMode === "restricted") return "Governance decisions resulted in restricted operational policy.";
  if (policyMode === "conservative") return "Governance decisions resulted in conservative operational policy.";
  return "Governance decisions remained within normal operational policy.";
}

function addEntry(matrix: GovernanceDecisionMatrixEntry[], entry: GovernanceDecisionMatrixEntry): void {
  matrix.push(entry);
}

function hasNoHistory(stability?: GovernanceStabilityScore): boolean {
  return stability?.anomalies.some((anomaly) => anomaly.code === "NO_ARCHIVE_HISTORY") === true;
}

function addTrendEntries(matrix: GovernanceDecisionMatrixEntry[], trend?: GovernanceTrendAnalysis): void {
  const trendHealth = trend?.trendHealth ?? "unknown";
  if (trendHealth === "warning") {
    addEntry(matrix, {
      stage: "trend-analysis",
      ruleId: "TREND_WARNING",
      inputSignal: "trendHealth=warning",
      evaluation: "matched",
      impact: "medium",
      explanation: "Trend health warning contributed to governance instability scoring."
    });
    return;
  }
  if (trendHealth === "critical") {
    addEntry(matrix, {
      stage: "trend-analysis",
      ruleId: "TREND_CRITICAL",
      inputSignal: "trendHealth=critical",
      evaluation: "matched",
      impact: "critical",
      explanation: "Critical trend health contributed to critical governance policy reasoning."
    });
    return;
  }
  addEntry(matrix, {
    stage: "trend-analysis",
    ruleId: trendHealth === "healthy" ? "TREND_HEALTHY" : "TREND_UNKNOWN",
    inputSignal: `trendHealth=${trendHealth}`,
    evaluation: trendHealth === "healthy" ? "informational" : "matched",
    impact: trendHealth === "healthy" ? "none" : "low",
    explanation: trendHealth === "healthy" ? "Trend health remained healthy." : "Trend health was unknown during governance reasoning."
  });
}

function addDriftEntries(matrix: GovernanceDecisionMatrixEntry[], drift?: GovernanceDriftDetection): void {
  const severity = drift?.overallSeverity ?? "none";
  if (severity === "critical") {
    addEntry(matrix, {
      stage: "drift-detection",
      ruleId: "CRITICAL_DRIFT_OVERRIDE",
      inputSignal: "driftSeverity=critical",
      evaluation: "upgraded",
      impact: "critical",
      explanation: "Critical governance drift upgraded escalation severity."
    });
    return;
  }
  if (severity === "high") {
    addEntry(matrix, {
      stage: "drift-detection",
      ruleId: "HIGH_DRIFT",
      inputSignal: "driftSeverity=high",
      evaluation: "matched",
      impact: "high",
      explanation: "High governance drift increased escalation severity."
    });
    return;
  }
  addEntry(matrix, {
    stage: "drift-detection",
    ruleId: severity === "none" ? "DRIFT_WITHIN_BASELINE" : "DRIFT_DETECTED",
    inputSignal: `driftSeverity=${severity}`,
    evaluation: severity === "none" ? "informational" : "matched",
    impact: impactForDrift(severity),
    explanation: severity === "none" ? "Governance drift remained within baseline." : "Governance drift contributed to stability scoring."
  });
}

function addStabilityEntries(matrix: GovernanceDecisionMatrixEntry[], stability?: GovernanceStabilityScore): void {
  const level = stability?.level ?? "stable";
  const score = stability?.score ?? 100;
  if (level === "critical") {
    addEntry(matrix, {
      stage: "stability-scoring",
      ruleId: "STABILITY_CRITICAL",
      inputSignal: `stabilityLevel=critical;score=${score}`,
      evaluation: "matched",
      impact: "critical",
      explanation: "Critical stability score contributed to manual-review policy reasoning."
    });
    return;
  }
  if (level === "unstable") {
    addEntry(matrix, {
      stage: "stability-scoring",
      ruleId: "STABILITY_UNSTABLE",
      inputSignal: `stabilityLevel=unstable;score=${score}`,
      evaluation: "matched",
      impact: "high",
      explanation: "Unstable governance score contributed to restricted policy reasoning."
    });
    return;
  }
  addEntry(matrix, {
    stage: "stability-scoring",
    ruleId: level === "caution" ? "STABILITY_CAUTION" : "STABILITY_STABLE",
    inputSignal: `stabilityLevel=${level};score=${score}`,
    evaluation: level === "caution" ? "matched" : "informational",
    impact: impactForStability(level),
    explanation: level === "caution" ? "Caution stability score contributed to conservative policy reasoning." : "Stability score remained within normal range."
  });
}

function addEscalationEntries(matrix: GovernanceDecisionMatrixEntry[], escalation?: GovernanceEscalation): void {
  const level = escalation?.escalationLevel ?? "none";
  if (level === "critical") {
    addEntry(matrix, {
      stage: "escalation",
      ruleId: "ESCALATION_CRITICAL",
      inputSignal: "escalationLevel=critical",
      evaluation: "upgraded",
      impact: "critical",
      explanation: "Critical escalation triggered manual-review-only governance recommendation."
    });
    return;
  }
  if (level === "high-risk") {
    addEntry(matrix, {
      stage: "escalation",
      ruleId: "ESCALATION_HIGH_RISK",
      inputSignal: "escalationLevel=high-risk",
      evaluation: "upgraded",
      impact: "high",
      explanation: "High-risk escalation triggered restricted governance recommendation."
    });
    return;
  }
  addEntry(matrix, {
    stage: "escalation",
    ruleId: level === "warning" ? "ESCALATION_WARNING" : "ESCALATION_NONE",
    inputSignal: `escalationLevel=${level}`,
    evaluation: level === "warning" ? "matched" : "informational",
    impact: impactForEscalation(level),
    explanation: level === "warning" ? "Warning escalation triggered conservative governance recommendation." : "No escalation was required."
  });
}

function addPolicyEntries(matrix: GovernanceDecisionMatrixEntry[], policy?: GovernancePolicyRecommendation): void {
  const mode = policy?.recommendedPolicyMode ?? "normal";
  if (mode === "manual-review-only") {
    addEntry(matrix, {
      stage: "policy-enforcement",
      ruleId: "POLICY_MANUAL_REVIEW_ONLY",
      inputSignal: "policyMode=manual-review-only",
      evaluation: "matched",
      impact: "critical",
      explanation: "Manual-review-only governance mode disables unrestricted autonomous operation."
    });
    return;
  }
  if (mode === "restricted") {
    addEntry(matrix, {
      stage: "policy-enforcement",
      ruleId: "POLICY_RESTRICTED",
      inputSignal: "policyMode=restricted",
      evaluation: "matched",
      impact: "high",
      explanation: "Restricted governance mode requires operator approval."
    });
    return;
  }
  addEntry(matrix, {
    stage: "policy-enforcement",
    ruleId: mode === "conservative" ? "POLICY_CONSERVATIVE" : "POLICY_NORMAL",
    inputSignal: `policyMode=${mode}`,
    evaluation: "matched",
    impact: impactForPolicy(mode),
    explanation: mode === "conservative" ? "Conservative governance mode keeps autonomous operation allowed with operator approval." : "Normal governance mode allows autonomous operation without operator approval."
  });
}

export function buildGovernanceDecisionMatrix(input: {
  trend?: GovernanceTrendAnalysis;
  drift?: GovernanceDriftDetection;
  stability?: GovernanceStabilityScore;
  escalation?: GovernanceEscalation;
  policy?: GovernancePolicyRecommendation;
  generatedAt?: string;
}): GovernanceDecisionMatrix {
  const policyMode = input.policy?.recommendedPolicyMode ?? "normal";
  const escalationLevel = input.escalation?.escalationLevel ?? "none";
  const stabilityLevel = input.stability?.level ?? "stable";
  const matrix: GovernanceDecisionMatrixEntry[] = [];

  if (hasNoHistory(input.stability)) {
    addEntry(matrix, {
      stage: "policy-enforcement",
      ruleId: "NO_HISTORY",
      inputSignal: "history=missing",
      evaluation: "informational",
      impact: "none",
      explanation: "No governance history was available. Default healthy governance assumptions applied."
    });
  } else {
    addTrendEntries(matrix, input.trend);
    addDriftEntries(matrix, input.drift);
    addStabilityEntries(matrix, input.stability);
    addEscalationEntries(matrix, input.escalation);
    addPolicyEntries(matrix, input.policy);
  }

  return {
    version: 1,
    finalDecision: {
      policyMode,
      escalationLevel,
      stabilityLevel,
      operatorApprovalRequired: input.policy?.operatorApprovalRequired ?? false,
      autonomousOperationAllowed: input.policy?.autonomousOperationAllowed ?? true
    },
    matrix,
    decisionSummary: summaryFor(policyMode),
    generatedAt: input.generatedAt ?? input.policy?.generatedAt ?? input.escalation?.generatedAt ?? input.stability?.generatedAt ?? UNKNOWN_GENERATED_AT
  };
}

export function renderGovernanceDecisionMatrixMarkdown(decision: GovernanceDecisionMatrix): string {
  const lines = [
    "# AI Software Factory - Governance Decision Matrix",
    "",
    "## Final Decision",
    "",
    `- policy mode: ${decision.finalDecision.policyMode}`,
    `- escalation level: ${decision.finalDecision.escalationLevel}`,
    `- stability level: ${decision.finalDecision.stabilityLevel}`,
    `- operator approval required: ${decision.finalDecision.operatorApprovalRequired}`,
    `- autonomous operation allowed: ${decision.finalDecision.autonomousOperationAllowed}`,
    "",
    "Summary:",
    decision.decisionSummary,
    "",
    "## Decision Matrix",
    "",
    "| Stage | Rule | Signal | Evaluation | Impact |",
    "|---|---|---|---|---|"
  ];

  for (const entry of decision.matrix) {
    lines.push(`| ${entry.stage} | ${entry.ruleId} | ${entry.inputSignal} | ${entry.evaluation} | ${entry.impact} |`);
  }

  lines.push("", "## Explanations", "");
  for (const entry of decision.matrix) {
    lines.push(`- ${entry.ruleId} - ${entry.explanation}`);
  }

  return `${lines.join("\n")}\n`;
}

export function renderGovernanceDecisionMatrixText(decision: GovernanceDecisionMatrix): string {
  return renderGovernanceDecisionMatrixMarkdown(decision);
}
