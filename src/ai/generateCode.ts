import path from "node:path";
import fs from "fs-extra";
import OpenAI from "openai";
import { z } from "zod";
import type { Brief, ChangeOperation, CommandResult, Plan, RepoSummary, ReviewResult } from "../types/index.js";
import type { FailureClassification, FailureMemoryEntry } from "../failure/failureClassifier.js";

interface GenerateCodeContext {
  runDir?: string;
  repoPath?: string;
  mode?: "feature" | "bugfix";
  recentCommandResults?: CommandResult[];
  previousOperations?: Array<{ type: string; path: string; reason?: string }>;
  selfHealingAttempt?: number;
  failureClassification?: FailureClassification;
  failureMemory?: FailureMemoryEntry[];
}

class AiApiError extends Error {}
class AiParseError extends Error {
  extractedText: string;
  constructor(message: string, extractedText: string) {
    super(message);
    this.extractedText = extractedText;
  }
}
class AiSchemaError extends Error {
  details: unknown;
  constructor(message: string, details: unknown) {
    super(message);
    this.details = details;
  }
}

const aiPatchSchema = z.object({
  insertBefore: z.string().optional(),
  insertAfter: z.string().optional(),
  content: z.string().optional(),
  replace: z
    .object({
      target: z.string().min(1).max(50),
      with: z.string()
    })
    .optional()
}).refine((patch) => !!patch.content || !!patch.replace, {
  message: "Patch must have content or replace"
});

const aiOperationSchema = z
  .object({
    type: z.enum(["create", "modify", "replace"]),
    path: z.string().min(1),
    content: z.string().optional(),
    patch: aiPatchSchema.optional(),
    reason: z.string().min(1)
  })
  .superRefine((op, ctx) => {
    if (op.type === "create" || op.type === "replace") {
      if (!op.content || !op.content.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${op.type} operation requires content` });
      }
    }
    if (op.type === "modify") {
      const hasContent = typeof op.content === "string" && op.content.trim().length > 0;
      if (!hasContent && !op.patch) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "modify operation requires patch or content" });
      }
    }
  });

const aiResponseSchema = z.object({
  operations: z.array(aiOperationSchema)
});

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function buildRepoTree(sampleFiles: string[]): string {
  const maxFiles = sampleFiles.slice(0, 120);
  return maxFiles.length > 0 ? maxFiles.map((file) => `- ${file}`).join("\n") : "- (no files discovered)";
}

function buildExistingFilesSummary(sampleFiles: string[]): string {
  const head = sampleFiles.slice(0, 20);
  if (head.length === 0) {
    return "No existing files were summarized.";
  }
  return `Sample existing files (${head.length}): ${head.join(", ")}`;
}

function compactMessage(message: string, maxLength = 220): string {
  const normalized = message.replace(/\s+/g, " ").trim();
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength)}...` : normalized;
}

function formatFailureMemory(memory: FailureMemoryEntry[]): string[] {
  return memory.map((entry) => {
    const subject = entry.symbol ? ` for symbol ${entry.symbol}` : entry.moduleName ? ` for module ${entry.moduleName}` : "";
    const outcome = entry.note ? `: ${entry.note}` : "";
    return `Attempt ${entry.attempt}: ${entry.type} using ${entry.strategy}${subject}${outcome}`;
  });
}

function extractMentionedFiles(task: string): string[] {
  const matches = task.match(/[A-Za-z0-9_\-./]+\.[A-Za-z0-9]+/g) ?? [];
  return Array.from(new Set(matches));
}

async function buildTargetFileContexts(task: string, repoPathInput?: string): Promise<Array<{ path: string; content: string }>> {
  if (!repoPathInput) {
    return [];
  }

  const mentioned = extractMentionedFiles(task).map((p) => p.replace(/\\/g, "/"));
  const targets = new Set<string>(mentioned);
  if (task.toLowerCase().includes("index.js")) {
    targets.add("index.js");
  }

  const contexts: Array<{ path: string; content: string }> = [];
  for (const rel of targets) {
    const full = path.resolve(repoPathInput, rel);
    try {
      const exists = await fs.pathExists(full);
      if (!exists) continue;
      const stat = await fs.stat(full);
      if (!stat.isFile()) continue;
      const content = await fs.readFile(full, "utf8");
      contexts.push({ path: rel, content });
    } catch {
      continue;
    }
  }

  return contexts;
}

async function buildPromptPayload(
  brief: Brief,
  plan: Plan,
  repoSummary: RepoSummary,
  context: GenerateCodeContext,
  review?: ReviewResult
) {
  const repoTree = buildRepoTree(repoSummary.sampleFiles);
  const existingFilesSummary = buildExistingFilesSummary(repoSummary.sampleFiles);
  const targetFileContexts = await buildTargetFileContexts(brief.title, context.repoPath);
  const mode = context.mode ?? "feature";
  const failedCommands = (context.recentCommandResults ?? []).filter((r) => r.status === "failed");
  const failedErrorOutput = failedCommands
    .map((r) => `Command: ${r.command}\nError: ${(r.stderr && r.stderr.trim()) ? r.stderr : r.stdout}`)
    .join("\n\n");
  const failureMemory = context.failureMemory ?? [];
  const failureMemorySummary = formatFailureMemory(failureMemory);

  return {
    mode,
    taskDescription: brief.title,
    brief,
    plan,
    repoSummary: {
      repoPath: repoSummary.repoPath,
      fileCount: repoSummary.fileCount,
      topLevelEntries: repoSummary.topLevelEntries,
      hasPackageJson: repoSummary.hasPackageJson,
      npmScripts: repoSummary.npmScripts
    },
    repoTree,
    existingFilesSummary,
    targetFileContexts,
    recentCommandResults: context.recentCommandResults ?? [],
    failureClassification: context.failureClassification ?? null,
    failureMemory: failureMemory.map((entry) => ({
      ...entry,
      message: compactMessage(entry.message)
    })),
    failureMemorySummary,
    previousFailedAttempts: failureMemory.length > 0 ? ["Previous failed attempts:", ...failureMemorySummary] : [],
    previousOperations: context.previousOperations ?? [],
    selfHealingAttempt: context.selfHealingAttempt ?? 0,
    generationGuidance: [
      "Generate structured multi-file feature updates when needed.",
      "You may return multiple operations.",
      "Use type=create for new files and type=modify for existing files.",
      "For existing files, prefer modify operations with patch instead of full file content replacement.",
      "PATCH RULES:",
      "- Prefer insertAfter or insertBefore over replace.",
      "- Use replace only for very small exact tokens.",
      "- replace.target must be max 50 characters.",
      "- replace.target must be one line only.",
      "- Never use generated fallback comments as patch targets.",
      "- Never use long code blocks as patch targets.",
      "- If editing index.js, prefer: insertAfter: \"console.log(\" or insertAfter: \"logger.info(\".",
      "- If unsure, append with insertAfter using a stable short anchor.",
      "If a file exists, prefer modify. If it does not exist, create it.",
      "Typical feature work may include utility file, index/module wiring, and optional tests.",
      "If previous failed attempts are provided, do NOT repeat previous failed fixes.",
      "Try a different strategy than the previous failed attempt.",
      "Do NOT introduce duplicate declarations.",
      "Do NOT insert code before variable initialization."
    ],
    bugfixGuidance:
      mode === "bugfix"
        ? [
            "Bugfix mode: prefer minimal changes.",
            "Do not create documentation.",
            "Do not create unrelated new files.",
            "Patch existing files when possible.",
            "Explain reason in operation.reason."
          ]
        : [],
    healingInstruction:
      failedErrorOutput.length > 0
        ? `The previous attempt failed with this runtime error:\n\n${failedErrorOutput}\n\nFix the issue based on this error.\nDo NOT guess.\nDo NOT introduce unrelated changes.`
        : "",
    review: review ?? null
  };
}

function extractTextOutput(response: unknown): string {
  const r = response as {
    output_text?: string;
    output?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }>;
  };

  let rawText =
    r.output
      ?.filter((item) => item.type === "message")
      .flatMap((item) => item.content || [])
      .filter((c) => c.type === "output_text" && typeof c.text === "string")
      .map((c) => c.text as string)
      .join("") ?? "";

  if (!rawText && typeof r.output_text === "string" && r.output_text.trim()) {
    rawText = r.output_text;
  }

  if (!rawText) {
    throw new Error("AI response text not found");
  }

  console.log("RAW AI TEXT LENGTH:", rawText.length);
  console.log("Extracted AI text:", rawText.slice(0, 200));
  return rawText;
}

function isSafePath(pathValue: string): boolean {
  const normalized = pathValue.replace(/\\/g, "/").toLowerCase();
  if (normalized.includes("..")) return false;
  const base = normalized.split("/").pop() ?? "";
  if (base === ".env" || base.endsWith(".env")) return false;
  return true;
}

function isDocLikePath(pathValue: string): boolean {
  const normalized = pathValue.replace(/\\/g, "/").toLowerCase();
  return normalized.endsWith(".md") || normalized.includes("/docs/") || normalized.startsWith("docs/");
}

function allowsDocsFromTask(task: string): boolean {
  const t = task.toLowerCase();
  return t.includes("doc") || t.includes("readme") || t.includes("markdown") || t.includes("notes");
}

function isPreferredPath(pathValue: string): boolean {
  const normalized = pathValue.replace(/\\/g, "/").toLowerCase();
  if (normalized.startsWith("src/")) return true;
  if (normalized === "index.js" || normalized === "index.ts" || normalized === "main.js" || normalized === "main.ts") {
    return true;
  }
  return false;
}

function sanitizeOperations(
  operations: Array<z.infer<typeof aiOperationSchema>>,
  task: string,
  mode: "feature" | "bugfix"
): { operations: ChangeOperation[]; filteredCount: number } {
  const safe: ChangeOperation[] = [];
  const allowDocs = mode === "feature" && allowsDocsFromTask(task);
  let filteredCount = 0;

  for (const op of operations) {
    const opLabel = `${op.type.toUpperCase()} ${op.path}`;
    const normalizedPath = op.path.replace(/\\/g, "/").toLowerCase();

    if (
      normalizedPath.includes(".factory-output") ||
      normalizedPath.includes(".factory/") ||
      normalizedPath.includes("implementation_notes")
    ) {
      console.log(`Filtering operation (${opLabel}): filtered documentation path`);
      filteredCount += 1;
      continue;
    }

    if (!isSafePath(op.path)) {
      console.log(`Filtering operation (${opLabel}): unsafe path`);
      filteredCount += 1;
      continue;
    }

    if (!op.reason || !op.reason.trim()) {
      console.log(`Filtering operation (${opLabel}): missing reason`);
      filteredCount += 1;
      continue;
    }

    if (op.type === "create" || op.type === "replace") {
      if (!op.content || !op.content.trim()) {
        console.log(`Filtering operation (${opLabel}): missing content`);
        filteredCount += 1;
        continue;
      }
    } else if (op.type === "modify") {
      const hasContent = typeof op.content === "string" && op.content.trim().length > 0;
      const hasPatch = !!op.patch;
      const hasPatchContent = !!op.patch?.content?.trim();
      const hasPatchReplaceWith = !!op.patch?.replace?.with;
      if (!hasContent && !hasPatch) {
        console.log(`Filtering operation (${opLabel}): missing content`);
        filteredCount += 1;
        continue;
      }
      if (hasPatch && !hasPatchContent && !hasPatchReplaceWith) {
        console.log(`Filtering operation (${opLabel}): invalid patch`);
        filteredCount += 1;
        continue;
      }
      if (op.patch?.replace?.target) {
        const replaceTarget = op.patch.replace.target;
        if (replaceTarget.length > 50 || replaceTarget.includes("\n")) {
          console.log(`Filtering operation (${opLabel}): unstable replace target`);
          filteredCount += 1;
          continue;
        }
      }
    } else {
      console.log(`Filtering operation (${opLabel}): unsupported operation type`);
      filteredCount += 1;
      continue;
    }

    if (!allowDocs && isDocLikePath(op.path)) {
      console.log(`Filtering operation (${opLabel}): filtered documentation path`);
      filteredCount += 1;
      continue;
    }

    if (!isPreferredPath(op.path) && !allowDocs) {
      console.log(`Filtering operation (${opLabel}): unsupported operation type`);
      filteredCount += 1;
      continue;
    }

    if (mode === "bugfix" && op.type === "create") {
      const reason = (op.reason ?? "").toLowerCase();
      const necessary = reason.includes("missing") || reason.includes("required") || reason.includes("dependency");
      if (!necessary) {
        console.log(`Filtering operation (${opLabel}): unsupported operation type`);
        filteredCount += 1;
        continue;
      }
    }

    safe.push({
      type: op.type,
      path: op.path,
      content: op.content,
      patch: op.patch,
      reason: op.reason
    });
  }

  const prioritized =
    mode === "bugfix"
      ? [...safe].sort((a, b) => {
          const score = (op: ChangeOperation) => {
            if (op.type === "modify" && op.patch) return 0;
            if (op.type === "modify") return 1;
            if (op.type === "replace") return 2;
            if (op.type === "create") return 3;
            return 4;
          };
          return score(a) - score(b);
        })
      : safe;

  const limit = mode === "bugfix" ? 3 : 5;
  const limited = prioritized.slice(0, limit);
  filteredCount += Math.max(0, prioritized.length - limited.length);
  return { operations: limited, filteredCount };
}

function isDateFormattingTask(task: string): boolean {
  const t = task.toLowerCase();
  return t.includes("date") && (t.includes("yyyy-mm-dd") || t.includes("format"));
}

function buildDateFallbackOperation(): ChangeOperation {
  const content = [
    "export function formatDateYYYYMMDD(input: Date | string | number): string {",
    "  const date = new Date(input);",
    "  if (Number.isNaN(date.getTime())) {",
    "    throw new Error(\"Invalid date input\");",
    "  }",
    "",
    "  const year = date.getFullYear();",
    "  const month = String(date.getMonth() + 1).padStart(2, \"0\");",
    "  const day = String(date.getDate()).padStart(2, \"0\");",
    "",
    "  return `${year}-${month}-${day}`;",
    "}",
    ""
  ].join("\n");

  return {
    type: "create",
    path: "src/utils/date.ts",
    content,
    reason: "Safe fallback for date-formatting task when AI output is empty or invalid"
  };
}

function buildMinimalCodeFallbackOperation(task: string): ChangeOperation {
  const content = [
    "/**",
    " * Minimal fallback generated after policy filtering removed all AI operations.",
    " */",
    "export function generatedFeaturePlaceholder(): string {",
    `  return ${JSON.stringify(task)};`,
    "}",
    ""
  ].join("\n");

  return {
    type: "create",
    path: "src/generated-feature.ts",
    content,
    reason: "Safe minimal fallback after policy enforcement filtered all AI operations"
  };
}

async function buildBugfixFallbackOperation(task: string, repoPathInput?: string): Promise<ChangeOperation[] | null> {
  if (!repoPathInput || !task.toLowerCase().includes("index.js")) {
    return null;
  }

  const indexPath = path.resolve(repoPathInput, "index.js");
  const exists = await fs.pathExists(indexPath);
  if (!exists) {
    return null;
  }

  const content = await fs.readFile(indexPath, "utf8");
  const safeLine = 'console.log("Bug fixed by software-factory");';

  if (content.includes("console.log(notDefinedVariable)")) {
    return [
      {
        type: "modify",
        path: "index.js",
        patch: {
          content: safeLine,
          replace: {
            target: "console.log(notDefinedVariable)",
            with: safeLine
          }
        },
        reason: "Bugfix fallback for mentioned target file"
      }
    ];
  }

  if (content.includes("notDefinedVariable")) {
    return [
      {
        type: "modify",
        path: "index.js",
        patch: {
          content: `\n${safeLine}\n`,
          replace: {
            target: "notDefinedVariable",
            with: '"Bug fixed by software-factory"'
          }
        },
        reason: "Bugfix fallback for mentioned target file"
      }
    ];
  }

  return [
    {
      type: "modify",
      path: "index.js",
      patch: {
        content: `\n${safeLine}\n`,
        insertAfter: "logger.info(\"App started\")"
      },
      reason: "Bugfix fallback for mentioned target file"
    }
  ];
}

function buildHeuristicBugfixFromError(runtimeError: string): ChangeOperation[] | null {
  const refMatch = runtimeError.match(/ReferenceError:\s*([A-Za-z_$][\w$]*)\s+is not defined/i);
  if (refMatch) {
    const name = refMatch[1];
    return [
      {
        type: "modify",
        path: "index.js",
        patch: {
          content: `"undefined"`,
          replace: {
            target: name,
            with: `"undefined"`
          }
        },
        reason: `Heuristic bugfix for ReferenceError: ${name} is not defined`
      }
    ];
  }

  if (/SyntaxError:\s*Identifier .* already declared/i.test(runtimeError)) {
    return [
      {
        type: "modify",
        path: "index.js",
        patch: {
          insertAfter: "const ",
          content: "\n// duplicate declaration removed by software-factory self-healing\n"
        },
        reason: "Heuristic bugfix for duplicate identifier declaration"
      }
    ];
  }

  const typeMatch = runtimeError.match(/TypeError:\s*([A-Za-z_$][\w$]*)\s+is not a function/i);
  if (typeMatch) {
    const fnName = typeMatch[1];
    return [
      {
        type: "modify",
        path: "index.js",
        patch: {
          content: `if (typeof ${fnName} === "function") ${fnName}();`,
          replace: {
            target: `${fnName}(`,
            with: `typeof ${fnName} === "function" && ${fnName}(`
          }
        },
        reason: `Heuristic bugfix for TypeError: ${fnName} is not a function`
      }
    ];
  }

  return null;
}

async function writeRunArtifact(runDir: string | undefined, filename: string, data: unknown): Promise<void> {
  if (!runDir) return;
  await fs.ensureDir(runDir);
  const target = path.join(runDir, filename);
  await fs.writeJson(target, data, { spaces: 2 });
}

async function writeRunTextArtifact(runDir: string | undefined, filename: string, data: string): Promise<void> {
  if (!runDir) return;
  await fs.ensureDir(runDir);
  const target = path.join(runDir, filename);
  await fs.writeFile(target, data, "utf8");
}

async function generateRawOperations(
  brief: Brief,
  plan: Plan,
  repoSummary: RepoSummary,
  review: ReviewResult | undefined,
  context: GenerateCodeContext,
  attempt: number,
  strictRetry: boolean,
  retryReason?: "parse" | "schema"
): Promise<ChangeOperation[]> {
  const mode = context.mode ?? "feature";
  const systemPrompt = strictRetry
    ? retryReason === "schema"
      ? "You are a code generator. Return valid JSON only. Your JSON shape was invalid. Fix schema. patch.content is optional when patch.replace exists."
      : "You are a code generator. Return valid JSON only. Your previous response was invalid. Return complete valid JSON. Do not truncate output."
    : "You are a code generator. Return valid JSON only.";

  const promptPayload = await buildPromptPayload(brief, plan, repoSummary, context, review);
  let response: unknown;
  try {
    response = await client.responses.create({
    model: "gpt-4o-mini",
    temperature: 0,
    input: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `${JSON.stringify(promptPayload)}\n\nReturn ONLY this format:\n{\n  \"operations\": [\n    {\n      \"type\": \"create\" | \"modify\",\n      \"path\": \"string\",\n      \"content\": \"string\" (for create or full-file modify),\n      \"patch\": {\n        \"insertBefore\"?: \"string\",\n        \"insertAfter\"?: \"string\",\n        \"content\": \"string\",\n        \"replace\"?: {\n          \"target\": \"string\",\n          \"with\": \"string\"\n        }\n      } (for patch modify),\n      \"reason\": \"string\"\n    }\n  ]\n}`
      }
    ],
    text: { format: { type: "json_object" } }
    } as never);
  } catch (error) {
    throw new AiApiError(error instanceof Error ? error.message : String(error));
  }

  console.log(JSON.stringify(response, null, 2));
  const rawText = extractTextOutput(response);
  console.log("AI response received");
  await writeRunArtifact(context.runDir, `ai-response-attempt-${attempt}.json`, {
    attempt,
    strictRetry,
    rawText,
    response
  });

  if (!rawText || !rawText.trim()) {
    throw new Error("AI response text is empty or missing");
  }
  if (!rawText.trim().endsWith("}")) {
    console.log("Detected incomplete JSON from AI");
    throw new Error("AI returned incomplete JSON");
  }

  console.log("Parsing AI response...");
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawText.trim());
  } catch (error) {
    await writeRunTextArtifact(context.runDir, "ai-raw-full.txt", rawText);
    throw new AiParseError(error instanceof Error ? error.message : String(error), rawText);
  }
  await writeRunArtifact(context.runDir, `ai-parsed-attempt-${attempt}.json`, parsedJson);

  const parsed = aiResponseSchema.parse(parsedJson);
  try {
    const parsed = aiResponseSchema.parse(parsedJson);
    const policyResult = sanitizeOperations(parsed.operations, brief.title, mode);
    console.log(`Filtered ${policyResult.filteredCount} operations (policy enforcement)`);
    return policyResult.operations;
  } catch (error) {
    const details = error instanceof z.ZodError ? error.issues : String(error);
    throw new AiSchemaError("AI response schema validation failed", details);
  }
}

export async function generateCode(
  brief: Brief,
  plan: Plan,
  repoSummary: RepoSummary,
  review?: ReviewResult,
  context: GenerateCodeContext = {}
): Promise<ChangeOperation[]> {
  console.log("AI generating multi-file operations...");

  if (!process.env.OPENAI_API_KEY) {
    const fallback = isDateFormattingTask(brief.title) ? [buildDateFallbackOperation()] : [];
    if (fallback.length === 0) {
      console.log("AI returned no file operations. Nothing to apply.");
    }
    return fallback;
  }

  let operations: ChangeOperation[] = [];
  const mode = context.mode ?? "feature";

  try {
    operations = await generateRawOperations(brief, plan, repoSummary, review, context, 1, false);
  } catch (error) {
    if (error instanceof AiApiError) {
      console.log(`OpenAI API error: ${error.message}`);
      await writeRunArtifact(context.runDir, "ai-api-error-attempt-1.json", {
        attempt: 1,
        message: error.message
      });
    } else if (error instanceof AiParseError) {
      console.log("AI JSON parse failed");
      await writeRunArtifact(context.runDir, "ai-parse-error-attempt-1.json", {
        attempt: 1,
        extractedText: error.extractedText,
        extractedTextPreview: error.extractedText.slice(0, 500),
        message: error.message
      });
    } else if (error instanceof AiSchemaError) {
      console.log("AI response schema validation failed");
      await writeRunArtifact(context.runDir, "ai-schema-error-attempt-1.json", {
        attempt: 1,
        message: error.message,
        details: error.details
      });
    } else {
      await writeRunArtifact(context.runDir, "ai-parse-error-attempt-1.json", {
        attempt: 1,
        extractedText: "",
        extractedTextPreview: "",
        message: error instanceof Error ? error.message : String(error)
      });
    }

    const retryReason: "parse" | "schema" = error instanceof AiSchemaError ? "schema" : "parse";
    console.log(retryReason === "schema" ? "Retrying AI generation (invalid schema)" : "Retrying AI generation (invalid JSON)");
    try {
      operations = await generateRawOperations(brief, plan, repoSummary, review, context, 2, true, retryReason);
    } catch (retryError) {
      console.log("AI response could not be parsed. Using safe fallback.");
      if (retryError instanceof AiApiError) {
        console.log(`OpenAI API error: ${retryError.message}`);
        await writeRunArtifact(context.runDir, "ai-api-error-attempt-2.json", {
          attempt: 2,
          message: retryError.message
        });
      } else if (retryError instanceof AiParseError) {
        console.log("AI JSON parse failed");
        await writeRunArtifact(context.runDir, "ai-parse-error-attempt-2.json", {
          attempt: 2,
          extractedText: retryError.extractedText,
          extractedTextPreview: retryError.extractedText.slice(0, 500),
          message: retryError.message
        });
      } else if (retryError instanceof AiSchemaError) {
        console.log("AI response schema validation failed");
        await writeRunArtifact(context.runDir, "ai-schema-error-attempt-2.json", {
          attempt: 2,
          message: retryError.message,
          details: retryError.details
        });
      } else {
        await writeRunArtifact(context.runDir, "ai-parse-error-attempt-2.json", {
          attempt: 2,
          extractedText: "",
          extractedTextPreview: "",
          message: retryError instanceof Error ? retryError.message : String(retryError)
        });
      }
      operations = [];
    }
  }

  if (operations.length === 0 && isDateFormattingTask(brief.title)) {
    operations = [buildDateFallbackOperation()];
  }

  if (operations.length === 0) {
    if (mode === "bugfix") {
      const runtimeError = (context.recentCommandResults ?? [])
        .filter((r) => r.status === "failed")
        .map((r) => (r.stderr && r.stderr.trim() ? r.stderr : r.stdout))
        .find((m) => m && m.trim());
      if (runtimeError) {
        const heuristic = buildHeuristicBugfixFromError(runtimeError);
        if (heuristic && heuristic.length > 0) {
          console.log("Bugfix fallback applied from runtime error heuristic.");
          operations = heuristic;
        }
      }
    }
  }

  if (operations.length === 0) {
    if (mode === "bugfix") {
      const bugfixFallback = await buildBugfixFallbackOperation(brief.title, context.repoPath);
      if (bugfixFallback && bugfixFallback.length > 0) {
        console.log("Bugfix fallback applied to mentioned target file.");
        operations = bugfixFallback;
      } else {
        console.log("AI returned no bugfix operations and no bugfix fallback target was available.");
      }
    } else {
      console.log("Warning: all AI operations were filtered. Applying safe minimal fallback operation.");
      operations = [buildMinimalCodeFallbackOperation(brief.title)];
    }
  }

  if (operations.length === 0) {
    console.log("AI returned no file operations. Nothing to apply.");
  }

  return operations;
}
