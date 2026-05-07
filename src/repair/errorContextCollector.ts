import fs from "node:fs";

export interface ErrorContextInput {
  filePath: string;
  line: number;
  column: number;
}

export interface ErrorContextOptions {
  before?: number;
  after?: number;
}

export interface ErrorContext {
  filePath: string;
  line: number;
  column: number;
  beforeLines: string[];
  errorLine: string;
  afterLines: string[];
}

function splitLinesWithoutEndings(content: string): string[] {
  return content.split(/\r?\n/);
}

export function collectErrorContext(
  input: ErrorContextInput,
  options: ErrorContextOptions = {}
): ErrorContext | null {
  if (!Number.isInteger(input.line) || input.line < 1) {
    return null;
  }

  if (!fs.existsSync(input.filePath)) {
    return null;
  }

  const content = fs.readFileSync(input.filePath, "utf8");
  if (content.length === 0) {
    return null;
  }

  const lines = splitLinesWithoutEndings(content);
  if (lines.length === 0 || (lines.length === 1 && lines[0] === "")) {
    return null;
  }

  if (input.line > lines.length) {
    return null;
  }

  const before = options.before ?? 5;
  const after = options.after ?? 5;
  const errorIndex = input.line - 1;
  const beforeStart = Math.max(0, errorIndex - before);
  const afterEnd = Math.min(lines.length, errorIndex + after + 1);

  return {
    filePath: input.filePath,
    line: input.line,
    column: input.column,
    beforeLines: lines.slice(beforeStart, errorIndex),
    errorLine: lines[errorIndex],
    afterLines: lines.slice(errorIndex + 1, afterEnd)
  };
}
