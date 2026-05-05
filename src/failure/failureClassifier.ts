export type FailureType =
  | "missing-module"
  | "duplicate-declaration"
  | "undefined-variable"
  | "not-a-function"
  | "access-before-initialization"
  | "unknown";

export type FailureStrategy =
  | "install-dependency"
  | "deterministic-patch"
  | "safe-replacement"
  | "guard-call"
  | "reorder-init"
  | "ai-fix";

export type FailureConfidence = "high" | "medium" | "low";

export interface FailureClassificationInput {
  stderr: string;
  stdout?: string;
  exitCode?: number | null;
}

export interface FailureClassification {
  type: FailureType;
  strategy: FailureStrategy;
  confidence: FailureConfidence;
  details: {
    rawMessage: string;
    symbol?: string;
    moduleName?: string;
  };
}

export interface FailureMemoryEntry {
  attempt: number;
  type: FailureType;
  strategy: FailureStrategy;
  message: string;
  symbol?: string;
  moduleName?: string;
  changeApplied?: boolean;
  note?: string;
}

function rawMessageFromInput(input: FailureClassificationInput): string {
  const stderr = input.stderr.trim();
  if (stderr) {
    return stderr;
  }
  return input.stdout?.trim() ?? "";
}

export function classifyFailure(input: FailureClassificationInput): FailureClassification {
  const rawMessage = rawMessageFromInput(input);

  const missingModule = rawMessage.match(/Cannot find module ['"]([^'"]+)['"]/i);
  if (missingModule) {
    return {
      type: "missing-module",
      strategy: "install-dependency",
      confidence: "high",
      details: {
        rawMessage,
        moduleName: missingModule[1]
      }
    };
  }

  const duplicateDeclaration = rawMessage.match(/Identifier ['"]([^'"]+)['"] has already been declared/i);
  if (duplicateDeclaration) {
    return {
      type: "duplicate-declaration",
      strategy: "deterministic-patch",
      confidence: "high",
      details: {
        rawMessage,
        symbol: duplicateDeclaration[1]
      }
    };
  }

  const accessBeforeInitialization = rawMessage.match(/Cannot access ['"]([^'"]+)['"] before initialization/i);
  if (accessBeforeInitialization) {
    return {
      type: "access-before-initialization",
      strategy: "reorder-init",
      confidence: "high",
      details: {
        rawMessage,
        symbol: accessBeforeInitialization[1]
      }
    };
  }

  const notAFunction = rawMessage.match(/(?:TypeError:\s*)?([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*) is not a function/i);
  if (notAFunction) {
    return {
      type: "not-a-function",
      strategy: "guard-call",
      confidence: "high",
      details: {
        rawMessage,
        symbol: notAFunction[1]
      }
    };
  }

  const undefinedVariable = rawMessage.match(/(?:ReferenceError:\s*)?([A-Za-z_$][\w$]*) is not defined/i);
  if (undefinedVariable) {
    return {
      type: "undefined-variable",
      strategy: "safe-replacement",
      confidence: "high",
      details: {
        rawMessage,
        symbol: undefinedVariable[1]
      }
    };
  }

  return {
    type: "unknown",
    strategy: "ai-fix",
    confidence: "low",
    details: {
      rawMessage
    }
  };
}

function assertClassification(
  input: FailureClassificationInput,
  expected: Pick<FailureClassification, "type" | "strategy"> & { symbol?: string; moduleName?: string }
): void {
  const actual = classifyFailure(input);
  if (actual.type !== expected.type || actual.strategy !== expected.strategy) {
    throw new Error(
      `classifyFailure failed: expected ${expected.type}/${expected.strategy}, got ${actual.type}/${actual.strategy}`
    );
  }
  if (expected.symbol && actual.details.symbol !== expected.symbol) {
    throw new Error(`classifyFailure failed: expected symbol ${expected.symbol}, got ${actual.details.symbol}`);
  }
  if (expected.moduleName && actual.details.moduleName !== expected.moduleName) {
    throw new Error(
      `classifyFailure failed: expected module ${expected.moduleName}, got ${actual.details.moduleName}`
    );
  }
}

function runFailureClassifierAssertions(): void {
  assertClassification(
    { stderr: "Error: Cannot find module 'express'" },
    { type: "missing-module", strategy: "install-dependency", moduleName: "express" }
  );
  assertClassification(
    { stderr: "SyntaxError: Identifier 'logger' has already been declared" },
    { type: "duplicate-declaration", strategy: "deterministic-patch", symbol: "logger" }
  );
  assertClassification(
    { stderr: "ReferenceError: notDefinedVariable is not defined" },
    { type: "undefined-variable", strategy: "safe-replacement", symbol: "notDefinedVariable" }
  );
  assertClassification(
    { stderr: "TypeError: logger.info is not a function" },
    { type: "not-a-function", strategy: "guard-call", symbol: "logger.info" }
  );
  assertClassification(
    { stderr: "ReferenceError: Cannot access 'config' before initialization" },
    { type: "access-before-initialization", strategy: "reorder-init", symbol: "config" }
  );
  assertClassification({ stderr: "Something unusual happened" }, { type: "unknown", strategy: "ai-fix" });
}

runFailureClassifierAssertions();
