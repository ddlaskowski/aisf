import fs from "node:fs";
import path from "node:path";
import { collectErrorContext } from "./errorContextCollector.js";
import { scanDependencyMap, scanFileDependencies } from "./dependencyScanner.js";
import { decideRepairTarget, type RepairTargetConfidence } from "./repairTargetDecision.js";
import { parseNodeStackTrace } from "./stackTraceParser.js";

export interface ContextAwareRepairTarget {
  filePath: string;
  reason: string;
  confidence: RepairTargetConfidence;
  usedContextAwareDecision: boolean;
}

function normalizePath(value: string): string {
  return path.normalize(value);
}

function candidatePaths(importerFile: string, importPath: string): string[] {
  const base = normalizePath(path.join(path.dirname(importerFile), importPath));
  const ext = path.extname(base);
  if (ext) {
    return [base];
  }

  return [
    `${base}.js`,
    `${base}.ts`,
    path.join(base, "index.js"),
    path.join(base, "index.ts")
  ].map(normalizePath);
}

function resolveDirectLocalImport(importerFile: string, importPath: string): string | null {
  if (!importPath.startsWith("./") && !importPath.startsWith("../")) {
    return null;
  }

  for (const candidate of candidatePaths(importerFile, importPath)) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

export function selectContextAwareRepairTarget(input: {
  rawOutput: string;
  projectRoot: string;
  fallbackFilePath: string;
}): ContextAwareRepairTarget | null {
  const parsed = parseNodeStackTrace(input.rawOutput, input.projectRoot);
  if (!parsed) {
    return null;
  }

  const context = collectErrorContext({
    filePath: parsed.filePath,
    line: parsed.line,
    column: parsed.column
  });
  if (!context) {
    return null;
  }

  const failingSummary = scanFileDependencies(parsed.filePath);
  const dependencyFiles = failingSummary
    ? failingSummary.imports
        .map((importPath) => resolveDirectLocalImport(parsed.filePath, importPath))
        .filter((filePath): filePath is string => filePath !== null)
    : [];

  const uniqueFiles = Array.from(new Set([parsed.filePath, ...dependencyFiles]));
  const dependencyMap = scanDependencyMap(uniqueFiles);

  const decision = decideRepairTarget({
    errorType: parsed.errorType,
    message: parsed.message,
    errorContext: context,
    dependencyMap
  });

  return {
    filePath: normalizePath(decision.filePath || input.fallbackFilePath),
    reason: decision.reason,
    confidence: decision.confidence,
    usedContextAwareDecision: true
  };
}
