import type { ChangePatch } from "../types/index.js";

export interface PatchOperation {
  type: "modify";
  patch: ChangePatch;
  reason: string;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function generateGuardCallPatch(input: {
  fileContent: string;
  symbol: string;
}): {
  applied: boolean;
  operations?: PatchOperation[];
  reason?: string;
} {
  const { fileContent, symbol } = input;
  if (!symbol || !/^[A-Za-z_$][\w$]*$/.test(symbol)) {
    return { applied: false };
  }

  const escaped = escapeRegExp(symbol);
  const directCallPattern = new RegExp(`(^|[^.\\w$])(${escaped}\\s*\\([^\\n()]*\\)\\s*;?)`);
  const match = fileContent.match(directCallPattern);
  if (!match || typeof match.index !== "number") {
    return { applied: false };
  }

  const prefix = match[1] ?? "";
  const target = match[2];
  const lineStart = fileContent.lastIndexOf("\n", match.index) + 1;
  const lineEnd = fileContent.indexOf("\n", match.index);
  const line = fileContent.slice(lineStart, lineEnd === -1 ? fileContent.length : lineEnd);

  if (/^\s*function\s+/.test(line)) return { applied: false };
  if (/^\s*(const|let|var)\s+/.test(line)) return { applied: false };
  if (prefix === "." || prefix.endsWith(".") || prefix.endsWith("this.")) return { applied: false };

  const replacement = `typeof ${symbol} === "function" && ${target}`;
  return {
    applied: true,
    operations: [
      {
        type: "modify",
        patch: {
          content: replacement,
          replace: {
            target,
            with: replacement
          }
        },
        reason: `Guard invalid function call ${symbol}`
      }
    ]
  };
}
