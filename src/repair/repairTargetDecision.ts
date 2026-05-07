import path from "node:path";

export type RepairTargetConfidence = "high" | "medium" | "low";

export type RepairTargetDecision = {
  filePath: string;
  reason: string;
  confidence: RepairTargetConfidence;
};

type ErrorContext = {
  filePath: string;
  line: number;
  column: number;
  beforeLines: string[];
  errorLine: string;
  afterLines: string[];
};

type DependencySummary = {
  file: string;
  imports: string[];
  exports: string[];
};

function normalizePath(value: string): string {
  return path.normalize(value);
}

function stripQuotes(value: string): string {
  return value.replace(/^["']|["']$/g, "");
}

function isLocalModulePath(value: string): boolean {
  return value.startsWith("./") || value.startsWith("../");
}

function extractMissingModulePath(message: string): string | null {
  const match = message.match(/Cannot find module\s+['"]([^'"]+)['"]/i);
  return match ? match[1] : null;
}

function extractMissingExportName(message: string): string | null {
  const patterns = [
    /does not provide an export named\s+['"]([^'"]+)['"]/i,
    /Named export\s+['"]([^'"]+)['"]\s+not found/i
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) return match[1];
  }

  return null;
}

function extractReferencedModulePath(message: string): string | null {
  const requested = message.match(/requested module\s+['"]([^'"]+)['"]/i);
  if (requested) return requested[1];

  const from = message.match(/from\s+['"]([^'"]+)['"]/i);
  if (from) return from[1];

  const localQuoted = message.match(/['"](\.{1,2}\/[^'"]+)['"]/);
  return localQuoted ? localQuoted[1] : null;
}

function extractNotAFunctionSymbol(message: string): string | null {
  const match = message.match(/([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)?)\s+is not a function/i);
  if (!match) return null;
  const parts = match[1].split(".");
  return parts[parts.length - 1] ?? null;
}

function dependencyForFile(dependencyMap: DependencySummary[], filePath: string): DependencySummary | null {
  const normalized = normalizePath(filePath);
  return dependencyMap.find((entry) => normalizePath(entry.file) === normalized) ?? null;
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

function resolveImportedFile(
  importerFile: string,
  importPath: string,
  dependencyMap: DependencySummary[]
): DependencySummary | null {
  const candidates = new Set(candidatePaths(importerFile, importPath));
  return dependencyMap.find((entry) => candidates.has(normalizePath(entry.file))) ?? null;
}

function relatedDependency(
  importerFile: string,
  modulePath: string,
  dependencyMap: DependencySummary[]
): DependencySummary | null {
  const normalizedModule = normalizePath(modulePath).replace(/\.[cm]?[jt]s$/, "");
  const moduleBase = path.basename(normalizedModule);
  const importerDir = path.dirname(importerFile);
  const importedEntries = dependencyMap
    .filter((entry) => normalizePath(entry.file) !== normalizePath(importerFile))
    .filter((entry) => normalizePath(entry.file).includes(moduleBase));

  if (importedEntries.length === 1) {
    return importedEntries[0];
  }

  const importerSummary = dependencyForFile(dependencyMap, importerFile);
  if (!importerSummary) {
    return null;
  }

  const importedFiles = importerSummary.imports
    .filter(isLocalModulePath)
    .map((importPath) => resolveImportedFile(path.join(importerDir, path.basename(importerFile)), importPath, dependencyMap))
    .filter((entry): entry is DependencySummary => entry !== null)
    .filter((entry) => normalizePath(entry.file).includes(moduleBase));

  return importedFiles.length === 1 ? importedFiles[0] : null;
}

function dependencyEntriesImportedByFailingFile(
  errorContext: ErrorContext,
  dependencyMap: DependencySummary[]
): DependencySummary[] {
  const failing = dependencyForFile(dependencyMap, errorContext.filePath);
  if (!failing) return [];

  return failing.imports
    .filter(isLocalModulePath)
    .map((importPath) => resolveImportedFile(errorContext.filePath, importPath, dependencyMap))
    .filter((entry): entry is DependencySummary => entry !== null);
}

export function decideRepairTarget(input: {
  errorType: string;
  message: string;
  errorContext: ErrorContext;
  dependencyMap: DependencySummary[];
}): RepairTargetDecision {
  const { errorContext, dependencyMap, errorType, message } = input;

  if (errorType === "ReferenceError") {
    return {
      filePath: errorContext.filePath,
      confidence: "high",
      reason: "ReferenceError usually indicates a missing local symbol in the failing file."
    };
  }

  const missingModulePath = extractMissingModulePath(message);
  if (missingModulePath && isLocalModulePath(missingModulePath)) {
    const failing = dependencyForFile(dependencyMap, errorContext.filePath);
    if (failing?.imports.includes(missingModulePath)) {
      return {
        filePath: errorContext.filePath,
        confidence: "medium",
        reason: `Missing local module import ${missingModulePath} was found in the failing file.`
      };
    }

    return {
      filePath: errorContext.filePath,
      confidence: "low",
      reason: `Missing module path ${missingModulePath} could not be matched to the dependency map.`
    };
  }

  const missingExportName = extractMissingExportName(message);
  if (missingExportName) {
    const modulePath = extractReferencedModulePath(message);
    if (modulePath && isLocalModulePath(modulePath)) {
      const imported = resolveImportedFile(errorContext.filePath, stripQuotes(modulePath), dependencyMap);
      if (imported) {
        return {
          filePath: imported.file,
          confidence: "high",
          reason: `Missing export ${missingExportName} should be added or corrected in imported file ${imported.file}.`
        };
      }

      const related = relatedDependency(errorContext.filePath, modulePath, dependencyMap);
      if (related) {
        return {
          filePath: related.file,
          confidence: "medium",
          reason: `Missing export ${missingExportName} could not be resolved exactly, but one related file matched ${modulePath}.`
        };
      }
    }

    return {
      filePath: errorContext.filePath,
      confidence: "low",
      reason: `Missing export ${missingExportName} could not be mapped to an imported file.`
    };
  }

  if (errorType === "SyntaxError") {
    return {
      filePath: errorContext.filePath,
      confidence: "high",
      reason: "Syntax errors are local to the failing file reported by Node.js."
    };
  }

  if (errorType === "TypeError" && /is not a function/i.test(message)) {
    const symbol = extractNotAFunctionSymbol(message);
    if (symbol) {
      const importedEntries = dependencyEntriesImportedByFailingFile(errorContext, dependencyMap);
      const exportedByDependency = importedEntries.find((entry) => entry.exports.includes(symbol));
      if (exportedByDependency) {
        return {
          filePath: errorContext.filePath,
          confidence: "medium",
          reason: `Imported symbol ${symbol} exists in a dependency, so the mismatch is likely in the failing file usage.`
        };
      }

      if (importedEntries.length === 1 && !importedEntries[0].exports.includes(symbol)) {
        return {
          filePath: importedEntries[0].file,
          confidence: "medium",
          reason: `Likely provider ${importedEntries[0].file} does not export function ${symbol}.`
        };
      }
    }

    return {
      filePath: errorContext.filePath,
      confidence: "low",
      reason: "TypeError not-a-function could not be mapped confidently, so falling back to the failing file."
    };
  }

  return {
    filePath: errorContext.filePath,
    confidence: "low",
    reason: "Fallback to failing file because no specific repair target rule matched."
  };
}
