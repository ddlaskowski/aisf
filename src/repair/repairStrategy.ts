export type RepairStrategy =
  | "missing-dependency"
  | "missing-local-module"
  | "missing-export"
  | "wrong-import-name"
  | "duplicate-declaration"
  | "undefined-symbol"
  | "not-a-function"
  | "runtime-targeted-fix"
  | "manual-review";

export type RepairStrategyConfidence = "high" | "medium" | "low";

export type RepairStrategyTargetKind =
  | "dependency"
  | "local-module"
  | "export"
  | "import"
  | "symbol"
  | "runtime"
  | "unknown";

export type RepairStrategyRecommendedAction =
  | "proceed"
  | "collect-more-context"
  | "retry-with-different-strategy"
  | "manual-review"
  | "stop";

export type RepairStrategySource =
  | "error-pattern"
  | "stack-trace"
  | "dependency-map"
  | "failure-memory"
  | "fallback";

export type RepairStrategyDecision = {
  ok: boolean;
  strategy: RepairStrategy;
  confidence: RepairStrategyConfidence;
  targetKind: RepairStrategyTargetKind;
  reason: string;
  warnings: string[];
  recommendedAction: RepairStrategyRecommendedAction;
  strategySource: RepairStrategySource;
  mustAvoidStrategies: string[];
};

export type DecideRepairStrategyInput = {
  errorMessage?: string;
  stderr?: string;
  stdout?: string;
  command?: string;
  parsedError?: unknown;
  stackTrace?: unknown;
  errorContext?: unknown;
  dependencyMap?: unknown;
  previousAttempts?: Array<{
    strategy?: string;
    validationChanged?: boolean;
    policyDenied?: boolean;
    manualReview?: boolean;
  }>;
  failureMemory?: unknown;
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

function objectContainsString(value: unknown, needle: string): boolean {
  if (!needle) {
    return false;
  }

  const normalizedNeedle = needle.toLowerCase();
  const seen = new Set<unknown>();

  function walk(current: unknown): boolean {
    if (typeof current === "string") {
      return current.toLowerCase().includes(normalizedNeedle);
    }

    if (Array.isArray(current)) {
      return current.some(walk);
    }

    if (isRecord(current)) {
      if (seen.has(current)) {
        return false;
      }
      seen.add(current);
      return Object.values(current).some(walk);
    }

    return false;
  }

  return walk(value);
}

export function normalizeFailureText(input: DecideRepairStrategyInput): string {
  return [
    input.errorMessage,
    input.stderr,
    input.stdout,
    input.command,
    readString(input.parsedError, "message"),
    readString(input.parsedError, "error"),
    readString(input.stackTrace, "message"),
    readString(input.errorContext, "errorLine"),
    readString(input.errorContext, "message")
  ]
    .filter(Boolean)
    .join("\n")
    .trim();
}

export function detectMissingModuleName(text: string): string | null {
  const patterns = [
    /Cannot find module\s+['"]([^'"]+)['"]/i,
    /Error:\s*Cannot find module\s+['"]([^'"]+)['"]/i,
    /ERR_MODULE_NOT_FOUND[^\n]*?(?:package\s+)?['"]([^'"]+)['"]/i,
    /Cannot find package\s+['"]([^'"]+)['"]/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
}

export function isLikelyLocalModule(moduleName: string): boolean {
  return (
    moduleName.startsWith(".") ||
    moduleName.startsWith("/") ||
    /^[A-Za-z]:[\\/]/.test(moduleName)
  );
}

export function hasRepeatedFailedStrategy(
  previousAttempts: DecideRepairStrategyInput["previousAttempts"],
  strategy: string
): boolean {
  if (!previousAttempts?.length) {
    return false;
  }

  return previousAttempts.filter((attempt) => attempt.strategy === strategy && attempt.validationChanged === false).length >= 2;
}

function strategiesToAvoid(previousAttempts: DecideRepairStrategyInput["previousAttempts"]): string[] {
  if (!previousAttempts?.length) {
    return [];
  }

  const counts = new Map<string, number>();
  for (const attempt of previousAttempts) {
    if (!attempt.strategy || attempt.validationChanged !== false) {
      continue;
    }
    counts.set(attempt.strategy, (counts.get(attempt.strategy) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .filter(([, count]) => count >= 2)
    .map(([strategy]) => strategy);
}

function hasProjectFileEvidence(input: DecideRepairStrategyInput): boolean {
  return (
    !!readString(input.stackTrace, "filePath") ||
    !!readString(input.stackTrace, "file") ||
    !!readString(input.errorContext, "filePath") ||
    objectContainsString(input.stackTrace, ".js:") ||
    objectContainsString(input.stackTrace, ".ts:") ||
    objectContainsString(input.errorContext, ".js") ||
    objectContainsString(input.errorContext, ".ts")
  );
}

function decision(params: {
  ok: boolean;
  strategy: RepairStrategy;
  confidence: RepairStrategyConfidence;
  targetKind: RepairStrategyTargetKind;
  reason: string;
  warnings?: string[];
  recommendedAction: RepairStrategyRecommendedAction;
  strategySource: RepairStrategySource;
  mustAvoidStrategies?: string[];
}): RepairStrategyDecision {
  return {
    ok: params.ok,
    strategy: params.strategy,
    confidence: params.confidence,
    targetKind: params.targetKind,
    reason: params.reason,
    warnings: params.warnings ?? [],
    recommendedAction: params.recommendedAction,
    strategySource: params.strategySource,
    mustAvoidStrategies: params.mustAvoidStrategies ?? []
  };
}

function applyRetryAwareness(
  base: RepairStrategyDecision,
  previousAttempts: DecideRepairStrategyInput["previousAttempts"]
): RepairStrategyDecision {
  const mustAvoidStrategies = strategiesToAvoid(previousAttempts);
  const warnings = [...base.warnings];

  if (mustAvoidStrategies.includes(base.strategy)) {
    warnings.push(`Strategy ${base.strategy} failed repeatedly without changing validation outcome.`);
    return {
      ...base,
      warnings,
      mustAvoidStrategies,
      recommendedAction: base.confidence === "high" ? "retry-with-different-strategy" : "manual-review",
      strategySource: "failure-memory"
    };
  }

  return {
    ...base,
    mustAvoidStrategies
  };
}

function manualReview(reason: string, recommendedAction: RepairStrategyRecommendedAction = "manual-review"): RepairStrategyDecision {
  return decision({
    ok: false,
    strategy: "manual-review",
    confidence: "low",
    targetKind: "unknown",
    reason,
    warnings: ["Repair strategy evidence is insufficient for automatic repair."],
    recommendedAction,
    strategySource: "fallback"
  });
}

export function decideRepairStrategy(input: DecideRepairStrategyInput): RepairStrategyDecision {
  const previousAttempts = input.previousAttempts ?? [];

  if (previousAttempts.some((attempt) => attempt.manualReview)) {
    return {
      ...manualReview("Previous repair attempt already required manual review.", "stop"),
      strategySource: "failure-memory"
    };
  }

  if (previousAttempts.some((attempt) => attempt.policyDenied)) {
    return {
      ...manualReview("Previous repair attempt was denied by repair policy.", "stop"),
      strategySource: "failure-memory"
    };
  }

  const text = normalizeFailureText(input);
  const lower = text.toLowerCase();
  if (!text) {
    return manualReview("No failure text was available for repair strategy selection.");
  }

  const missingModule = detectMissingModuleName(text);
  if (missingModule) {
    const base = isLikelyLocalModule(missingModule)
      ? decision({
          ok: true,
          strategy: "missing-local-module",
          confidence: "high",
          targetKind: "local-module",
          reason: `Missing local module detected: ${missingModule}.`,
          recommendedAction: "proceed",
          strategySource: "error-pattern"
        })
      : decision({
          ok: true,
          strategy: "missing-dependency",
          confidence: "high",
          targetKind: "dependency",
          reason: `Missing package dependency detected: ${missingModule}.`,
          recommendedAction: "proceed",
          strategySource: "error-pattern"
        });
    return applyRetryAwareness(base, previousAttempts);
  }

  if (
    lower.includes("did you mean") &&
    (lower.includes("has no exported member") || lower.includes("no exported member"))
  ) {
    return applyRetryAwareness(
      decision({
        ok: true,
        strategy: "wrong-import-name",
        confidence: "medium",
        targetKind: "import",
        reason: "Import name appears to be incorrect.",
        warnings: ["Missing-export and wrong-import-name strategies can overlap for this error pattern."],
        recommendedAction: "proceed",
        strategySource: "error-pattern"
      }),
      previousAttempts
    );
  }

  if (
    lower.includes("does not provide an export named") ||
    lower.includes("has no exported member") ||
    lower.includes("cannot import name")
  ) {
    return applyRetryAwareness(
      decision({
        ok: true,
        strategy: "missing-export",
        confidence: "high",
        targetKind: "export",
        reason: "Missing export pattern detected.",
        recommendedAction: "proceed",
        strategySource: "error-pattern"
      }),
      previousAttempts
    );
  }

  if (
    /Identifier\s+['"][^'"]+['"]\s+has already been declared/i.test(text) ||
    lower.includes("cannot redeclare block-scoped variable") ||
    lower.includes("duplicate declaration")
  ) {
    return applyRetryAwareness(
      decision({
        ok: true,
        strategy: "duplicate-declaration",
        confidence: "high",
        targetKind: "symbol",
        reason: "Duplicate declaration pattern detected.",
        recommendedAction: "proceed",
        strategySource: "error-pattern"
      }),
      previousAttempts
    );
  }

  if (/ReferenceError:\s*[A-Za-z_$][\w$]*\s+is not defined/i.test(text) || /\b[A-Za-z_$][\w$]*\s+is not defined\b/i.test(text)) {
    return applyRetryAwareness(
      decision({
        ok: true,
        strategy: "undefined-symbol",
        confidence: "high",
        targetKind: "symbol",
        reason: "Undefined symbol pattern detected.",
        recommendedAction: "proceed",
        strategySource: "error-pattern"
      }),
      previousAttempts
    );
  }

  if (/TypeError:\s*[^\n]+?\s+is not a function/i.test(text) || /\b[A-Za-z_$][\w$.]*\s+is not a function\b/i.test(text)) {
    return applyRetryAwareness(
      decision({
        ok: true,
        strategy: "not-a-function",
        confidence: "high",
        targetKind: "symbol",
        reason: "Not-a-function runtime pattern detected.",
        recommendedAction: "proceed",
        strategySource: "error-pattern"
      }),
      previousAttempts
    );
  }

  if (hasProjectFileEvidence(input)) {
    return applyRetryAwareness(
      decision({
        ok: true,
        strategy: "runtime-targeted-fix",
        confidence: "medium",
        targetKind: "runtime",
        reason: "Stack trace or error context points to a project file, but no specific repair pattern matched.",
        recommendedAction: "collect-more-context",
        strategySource: "stack-trace"
      }),
      previousAttempts
    );
  }

  return {
    ...manualReview("Failure text was ambiguous and did not match a known repair strategy."),
    mustAvoidStrategies: strategiesToAvoid(previousAttempts)
  };
}

