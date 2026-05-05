import type { FileStructure } from "./patchTypes.js";

function isImportLine(line: string): boolean {
  return /^\s*import\b/.test(line);
}

function isRequireLine(line: string): boolean {
  return /^\s*(?:const|let|var)\s+[\w${}\s,]+\s*=\s*require\s*\(/.test(line);
}

function isExecutableLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("//")) return false;
  if (isImportLine(line) || isRequireLine(line)) return false;
  return true;
}

function declarationName(line: string): string | null {
  const variableMatch = line.match(/^\s*(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=/);
  if (variableMatch) return variableMatch[1];

  const functionMatch = line.match(/^\s*function\s+([A-Za-z_$][\w$]*)\s*\(/);
  if (functionMatch) return functionMatch[1];

  return null;
}

export function analyzeFileStructure(source: string): FileStructure {
  const lines = source.split(/\r?\n/);
  let importEndLine: number | null = null;
  let requireEndLine: number | null = null;
  let firstExecutableLine: number | null = null;
  const declaredNames: string[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const lineNumber = i + 1;

    if (isImportLine(line)) {
      importEndLine = lineNumber;
    }

    if (isRequireLine(line)) {
      requireEndLine = lineNumber;
    }

    const name = declarationName(line);
    if (name) {
      declaredNames.push(name);
    }

    if (firstExecutableLine === null && isExecutableLine(line)) {
      firstExecutableLine = lineNumber;
    }
  }

  return {
    lines,
    importEndLine,
    requireEndLine,
    firstExecutableLine,
    declaredNames
  };
}
