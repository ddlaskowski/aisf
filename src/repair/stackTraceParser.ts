export interface ParsedNodeStackFrame {
  errorType: string;
  message: string;
  filePath: string;
  line: number;
  column: number;
}

interface CandidateFrame {
  filePath: string;
  line: number;
  column: number;
  insideProject: boolean;
}

function normalizePath(value: string): string {
  return value.replace(/\\/g, "/");
}

function parseHeader(rawOutput: string): { errorType: string; message: string } | null {
  const firstMeaningfulLine = rawOutput
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length > 0 && !line.startsWith("at "));

  if (!firstMeaningfulLine) {
    return null;
  }

  const match = firstMeaningfulLine.match(/^([A-Za-z_$][\w$]*(?:Error)?):\s*(.*)$/);
  if (!match) {
    return {
      errorType: "Error",
      message: firstMeaningfulLine
    };
  }

  return {
    errorType: match[1],
    message: match[2]
  };
}
function isIgnoredFrame(filePath: string): boolean {
  const normalized = normalizePath(filePath);
  return (
    normalized.includes("/node_modules/") ||
    normalized.startsWith("node:internal") ||
    normalized.includes("/node:internal") ||
    normalized.startsWith("internal/") ||
    normalized.includes("/internal/")
  );
}

function extractLocation(line: string): string | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith("at ")) {
    return null;
  }

  const parenMatch = trimmed.match(/\(([^()]+:\d+:\d+)\)$/);
  if (parenMatch) {
    return parenMatch[1];
  }

  const directMatch = trimmed.match(/^at\s+(.+:\d+:\d+)$/);
  return directMatch ? directMatch[1] : null;
}

function parseFrame(line: string, projectRoot?: string): CandidateFrame | null {
  const location = extractLocation(line);
  if (!location || location === "native" || location.includes("<anonymous>")) {
    return null;
  }

  const match = location.match(/^(.*):(\d+):(\d+)$/);
  if (!match) {
    return null;
  }

  const filePath = match[1];
  if (!filePath || isIgnoredFrame(filePath)) {
    return null;
  }

  const lineNumber = Number.parseInt(match[2], 10);
  const column = Number.parseInt(match[3], 10);
  if (!Number.isFinite(lineNumber) || !Number.isFinite(column)) {
    return null;
  }

  const normalizedFile = normalizePath(filePath);
  const normalizedRoot = projectRoot ? normalizePath(projectRoot).replace(/\/$/, "") : "";

  return {
    filePath: normalizedFile,
    line: lineNumber,
    column,
    insideProject: normalizedRoot ? normalizedFile === normalizedRoot || normalizedFile.startsWith(`${normalizedRoot}/`) : true
  };
}

export function parseNodeStackTrace(rawOutput: string, projectRoot?: string): ParsedNodeStackFrame | null {
  const header = parseHeader(rawOutput);
  if (!header) {
    return null;
  }

  const candidates = rawOutput
    .split(/\r?\n/)
    .map((line) => parseFrame(line, projectRoot))
    .filter((frame): frame is CandidateFrame => frame !== null);

  if (candidates.length === 0) {
    return null;
  }

  const selected = projectRoot ? candidates.find((frame) => frame.insideProject) ?? null : candidates[0];
  if (!selected) {
    return null;
  }

  return {
    errorType: header.errorType,
    message: header.message,
    filePath: selected.filePath,
    line: selected.line,
    column: selected.column
  };
}
