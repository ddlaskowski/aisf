import path from "node:path";

export type BuildFailureSignatureInput = {
  errorType?: string;
  errorMessage?: string;
  stderr?: string;
  stdout?: string;
  topProjectStackFrame?: string;
  targetFile?: string;
  symbolName?: string;
};

function normalizeText(value: string | undefined): string {
  return (value ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizePath(value: string | undefined): string {
  if (!value) {
    return "";
  }

  const withoutLineColumn = value.replace(/:\d+:\d+$/, "").replace(/:\d+$/, "");
  return withoutLineColumn
    .replace(/\\/g, "/")
    .split("/")
    .filter(Boolean)
    .slice(-3)
    .join("/");
}

function extractErrorType(text: string): string {
  const match = text.match(/\b([A-Za-z]+Error)\b/);
  return match?.[1] ?? "Error";
}

function extractSymbol(text: string): string {
  const patterns = [
    /ReferenceError:\s*([A-Za-z_$][\w$]*)\s+is not defined/i,
    /\b([A-Za-z_$][\w$]*)\s+is not defined\b/i,
    /Identifier\s+['"]([^'"]+)['"]\s+has already been declared/i,
    /Cannot access\s+['"]([^'"]+)['"]\s+before initialization/i,
    /TypeError:\s*([A-Za-z_$][\w$.]*)\s+is not a function/i,
    /\b([A-Za-z_$][\w$.]*)\s+is not a function\b/i,
    /Cannot find module\s+['"]([^'"]+)['"]/i,
    /does not provide an export named\s+['"]([^'"]+)['"]/i,
    /has no exported member\s+['"]([^'"]+)['"]/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return "";
}

function normalizeMessage(value: string): string {
  return value
    .replace(/\bat\s+.*$/gim, "")
    .replace(/:\d+:\d+/g, "")
    .replace(/:\d+/g, "")
    .replace(/\b[A-Za-z]:\/[^\s)]+/g, "<file>")
    .replace(/\/[^\s)]+/g, "<path>")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

function slugPart(value: string): string {
  return value
    .toLowerCase()
    .replace(/\\/g, "/")
    .replace(/[^a-z0-9_./@-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "") || "unknown";
}

export function buildFailureSignature(input: BuildFailureSignatureInput): string {
  const rawMessage = normalizeText(input.errorMessage || input.stderr || input.stdout);
  const errorType = normalizeText(input.errorType) || extractErrorType(rawMessage);
  const symbolName = normalizeText(input.symbolName) || extractSymbol(rawMessage);
  const stackFrame = normalizePath(input.topProjectStackFrame);
  const targetFile = normalizePath(input.targetFile);
  const filePart = targetFile || stackFrame || "unknown-file";
  const messagePart = normalizeMessage(rawMessage) || "unknown-error";

  return [
    slugPart(errorType),
    slugPart(messagePart),
    slugPart(path.basename(filePart) || filePart),
    slugPart(symbolName)
  ].join(":");
}
