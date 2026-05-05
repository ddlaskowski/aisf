import type { ChangePatch } from "../types/index.js";
import type { PatchOperation as SafePatchOperation } from "../patchEngine/index.js";

export interface PatchOperation {
  type: "modify";
  patch: ChangePatch | SafePatchOperation;
  reason: string;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function countOccurrences(source: string, target: string): number {
  if (!target) return 0;
  return source.split(target).length - 1;
}

export function generateSafeReplacementPatch(input: {
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

  const consoleLogLinePattern = new RegExp(`^[ \\t]*console\\.log\\(\\s*${escaped}\\s*\\);?[ \\t]*$`, "m");
  const consoleLogLineMatch = fileContent.match(consoleLogLinePattern);
  if (consoleLogLineMatch && countOccurrences(fileContent, consoleLogLineMatch[0]) === 1) {
    const target = consoleLogLineMatch[0];
    const indent = target.match(/^[ \t]*/)?.[0] ?? "";
    const replacement = `${indent}console.log(typeof ${symbol} !== "undefined" ? ${symbol} : undefined);`;
    return {
      applied: true,
      operations: [
        {
          type: "modify",
          patch: {
            type: "replace",
            target: {
              type: "exact",
              match: target
            },
            replacement
          },
          reason: `Safe replacement for undefined variable ${symbol} in console.log`
        }
      ]
    };
  }

  const consoleLogPattern = new RegExp(`console\\.log\\(\\s*${escaped}\\s*\\)`);
  const consoleLogMatch = fileContent.match(consoleLogPattern);
  if (consoleLogMatch) {
    const target = consoleLogMatch[0];
    return {
      applied: true,
      operations: [
        {
          type: "modify",
          patch: {
            content: `console.log(typeof ${symbol} !== "undefined" ? ${symbol} : undefined)`,
            replace: {
              target,
              with: `console.log(typeof ${symbol} !== "undefined" ? ${symbol} : undefined)`
            }
          },
          reason: `Safe replacement for undefined variable ${symbol} in console.log`
        }
      ]
    };
  }

  const functionCallPattern = new RegExp(`\\b${escaped}\\s*\\(\\s*\\)`);
  const functionCallMatch = fileContent.match(functionCallPattern);
  if (functionCallMatch) {
    const target = functionCallMatch[0];
    return {
      applied: true,
      operations: [
        {
          type: "modify",
          patch: {
            content: `typeof ${symbol} === "function" && ${symbol}()`,
            replace: {
              target,
              with: `typeof ${symbol} === "function" && ${symbol}()`
            }
          },
          reason: `Safe replacement for undefined function call ${symbol}`
        }
      ]
    };
  }

  const standalonePattern = new RegExp(`\\b${escaped}\\b`);
  const standaloneMatch = fileContent.match(standalonePattern);
  if (standaloneMatch) {
    return {
      applied: true,
      operations: [
        {
          type: "modify",
          patch: {
            content: `typeof ${symbol} !== "undefined" && ${symbol}`,
            replace: {
              target: symbol,
              with: `typeof ${symbol} !== "undefined" && ${symbol}`
            }
          },
          reason: `Safe replacement for undefined variable ${symbol}`
        }
      ]
    };
  }

  return { applied: false };
}
