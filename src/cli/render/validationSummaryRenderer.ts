import { renderCliDivider, renderCliSection, renderCliStatusBlock, renderReadonlyNotice } from "./cliRenderers.js";

export type ValidationSummary = {
  suitesExecuted: string[];
  suitesSkipped: string[];
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  executionDurationMs?: number;
};

export function renderValidationSummary(summary: ValidationSummary): string {
  return [
    renderCliSection("Validation summary", [
      `Suites executed: ${summary.suitesExecuted.length === 0 ? "none" : summary.suitesExecuted.join(", ")}`,
      `Suites skipped: ${summary.suitesSkipped.length === 0 ? "none" : summary.suitesSkipped.join(", ")}`
    ]),
    renderCliStatusBlock({
      "execution duration ms": summary.executionDurationMs ?? "not-recorded",
      "failed checks": summary.failedChecks,
      "passed checks": summary.passedChecks,
      "total checks": summary.totalChecks
    }),
    renderReadonlyNotice(true),
    renderCliDivider()
  ].join("\n");
}
