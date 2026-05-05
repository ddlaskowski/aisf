import type { ChangePatch } from "../types/index.js";

export interface PatchOperation {
  type: "modify";
  patch: ChangePatch;
  reason: string;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function generateReorderInitPatch(input: {
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
  const pattern = new RegExp(
    `(^|\\n)(\\s*console\\.log\\(\\s*${escaped}\\s*\\);\\s*\\r?\\n)(\\s*(?:const|let)\\s+${escaped}\\s*=\\s*[^;(){}\\n]+;)(?=\\r?\\n|$)`
  );
  const match = fileContent.match(pattern);
  if (!match) {
    return { applied: false };
  }

  const prefix = match[1] ?? "";
  const usageLine = match[2];
  const declarationLine = match[3];
  const beforeMatch = fileContent.slice(0, match.index ?? 0);

  if (new RegExp(`\\b${escaped}\\b`).test(beforeMatch)) {
    return { applied: false };
  }

  const target = `${usageLine}${declarationLine}`;
  const replacement = `${declarationLine}\n${usageLine.trimEnd()}`;

  return {
    applied: true,
    operations: [
      {
        type: "modify",
        patch: {
          content: replacement,
          replace: {
            target,
            with: `${prefix}${replacement}`
          }
        },
        reason: `Move ${symbol} initialization before first console.log usage`
      }
    ]
  };
}
