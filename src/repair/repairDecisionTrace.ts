import type { RepairObservabilityReport } from "./repairObservability.js";

export type RepairDecisionTraceStep = {
  order: number;
  layer: string;
  status: "pass" | "warn" | "blocked" | "skipped";
  summary: string;
  details?: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown, field: string): string {
  if (!isRecord(value)) {
    return "";
  }
  const raw = value[field];
  return typeof raw === "string" ? raw : "";
}

function readBoolean(value: unknown, field: string): boolean | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  const raw = value[field];
  return typeof raw === "boolean" ? raw : undefined;
}

function readStringArray(value: unknown, field: string): string[] {
  if (!isRecord(value) || !Array.isArray(value[field])) {
    return [];
  }
  return value[field].filter((item): item is string => typeof item === "string");
}

function step(
  steps: RepairDecisionTraceStep[],
  layer: string,
  status: RepairDecisionTraceStep["status"],
  summary: string,
  details?: string[]
): void {
  steps.push({
    order: steps.length + 1,
    layer,
    status,
    summary,
    details: details?.length ? details : undefined
  });
}

export function buildRepairDecisionTrace(report: RepairObservabilityReport): RepairDecisionTraceStep[] {
  const steps: RepairDecisionTraceStep[] = [];

  step(
    steps,
    "Failure signature",
    report.failureSignature ? "pass" : "skipped",
    report.failureSignature ? "Generated deterministic signature." : "No failure signature was available."
  );

  const historicalMatches = isRecord(report.failureMemory) ? report.failureMemory["historicalMatches"] : undefined;
  step(
    steps,
    "Failure memory",
    report.failureMemory ? "pass" : "skipped",
    typeof historicalMatches === "number"
      ? `Found ${historicalMatches} historical matches.`
      : "Failure memory was not available."
  );

  const strategy = readString(report.repairStrategy, "strategy");
  step(
    steps,
    "Repair strategy",
    report.repairStrategy ? "pass" : "skipped",
    strategy ? `Selected strategy ${strategy}.` : "No repair strategy was selected.",
    readStringArray(report.repairStrategy, "warnings")
  );

  const evidenceMode = readString(report.repairEvidence, "allowedRepairMode");
  const evidenceOk = readBoolean(report.repairEvidence, "ok");
  step(
    steps,
    "Repair evidence",
    evidenceOk === false || evidenceMode === "manual-review" ? "blocked" : report.repairEvidence ? "pass" : "skipped",
    report.repairEvidence ? `Evidence mode: ${evidenceMode || "unknown"}.` : "Evidence validation was not available.",
    readStringArray(report.repairEvidence, "warnings")
  );

  const regressionAction = readString(report.repairRegressionRisk, "recommendedAction");
  const regressionWarnings = readStringArray(report.repairRegressionRisk, "warnings");
  step(
    steps,
    "Regression guard",
    readBoolean(report.repairRegressionRisk, "blocked") === true || regressionAction === "block"
      ? "blocked"
      : regressionWarnings.length > 0 || regressionAction === "proceed-with-warning" || regressionAction === "downgrade-to-conservative"
      ? "warn"
      : report.repairRegressionRisk
      ? "pass"
      : "skipped",
    report.repairRegressionRisk ? `Recommended action: ${regressionAction || "unknown"}.` : "Regression guard was not evaluated.",
    [...readStringArray(report.repairRegressionRisk, "riskReasons"), ...regressionWarnings]
  );

  const policyOk = readBoolean(report.repairPatchPolicy, "ok");
  step(
    steps,
    "Patch policy",
    policyOk === false ? "blocked" : report.repairPatchPolicy ? "pass" : "skipped",
    report.repairPatchPolicy
      ? `Policy mode: ${readString(report.repairPatchPolicy, "mode") || "unknown"}.`
      : "Patch policy was not evaluated.",
    readStringArray(report.repairPatchPolicy, "warnings")
  );

  const patchIntentOk = readBoolean(report.patchIntentValidation, "ok");
  step(
    steps,
    "Patch intent validation",
    patchIntentOk === false ? "blocked" : report.patchIntentValidation ? "pass" : "skipped",
    report.patchIntentValidation
      ? readString(report.patchIntentValidation, "reason") || "Patch intent validation completed."
      : "Patch intent validation was not reached."
  );

  step(
    steps,
    "Safe patch",
    report.safePatch ? "pass" : "skipped",
    report.safePatch ? "Safe patch metadata was recorded." : "Safe patch was not applied or metadata was unavailable."
  );

  step(
    steps,
    "Validation",
    readString(report.validation, "verdict") === "pass" || readString(report.validation, "status") === "pass" ? "pass" : report.validation ? "warn" : "skipped",
    report.validation ? `Validation status: ${readString(report.validation, "verdict") || readString(report.validation, "status") || "unknown"}.` : "Validation result was unavailable."
  );

  step(
    steps,
    "Repair outcome",
    report.repairOutcome ? (readString(report.repairOutcome, "outcome") === "success" ? "pass" : "warn") : "skipped",
    report.repairOutcome ? readString(report.repairOutcome, "explanation") || "Repair outcome classified." : "Repair outcome was unavailable.",
    readStringArray(report.repairOutcome, "warnings")
  );

  return steps;
}

function statusLabel(status: RepairDecisionTraceStep["status"]): string {
  return status.toUpperCase();
}

export function renderRepairDecisionTraceMarkdown(input: {
  report: RepairObservabilityReport;
  steps?: RepairDecisionTraceStep[];
}): string {
  const steps = input.steps ?? buildRepairDecisionTrace(input.report);
  const warnings = steps.flatMap((item) => item.status === "warn" ? [`${item.layer}: ${item.summary}`, ...(item.details ?? [])] : []);
  const blocked = steps.filter((item) => item.status === "blocked");

  return [
    "# Repair Decision Trace",
    "",
    `Run ID: ${input.report.runId}`,
    `Task: ${input.report.task}`,
    `Final status: ${input.report.finalDecision.status}`,
    `Final reason: ${input.report.finalDecision.reason}`,
    `Blocking layer: ${input.report.finalDecision.blockingLayer ?? "none"}`,
    "",
    "## Timeline",
    ...steps.map((item) => {
      const details = item.details?.length ? ` Details: ${item.details.join(" | ")}` : "";
      return `${item.order}. ${statusLabel(item.status)} - ${item.layer} - ${item.summary}${details}`;
    }),
    "",
    "## Warnings",
    warnings.length ? warnings.map((warning) => `- ${warning}`).join("\n") : "- None",
    "",
    "## Blocked Layers",
    blocked.length ? blocked.map((item) => `- ${item.layer}: ${item.summary}`).join("\n") : "- None",
    ""
  ].join("\n");
}
