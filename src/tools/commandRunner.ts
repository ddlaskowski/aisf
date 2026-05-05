import path from "node:path";
import fs from "fs-extra";
import { execa } from "execa";
import type { CommandResult } from "../types/index.js";

const ALLOWLIST = new Set([
  "npm test",
  "npm run test",
  "npm run build",
  "npm run lint",
  "pnpm test",
  "pnpm build",
  "pnpm lint",
  "node index.js"
]);

type ScriptName = "test" | "build" | "lint";

function isAllowedInstallCommand(command: string): boolean {
  const parts = command.trim().split(/\s+/).filter(Boolean);
  if (parts.length !== 3 || parts[0] !== "npm" || parts[1] !== "install") {
    return false;
  }

  const packageName = parts[2];
  if (packageName.startsWith(".") || packageName.startsWith("/") || packageName.includes("node:")) {
    return false;
  }

  return /^(@[a-z0-9._-]+\/)?[a-z0-9._-]+$/i.test(packageName);
}

function parseCommand(command: string): { cmd: string; args: string[] } {
  const parts = command.trim().split(/\s+/).filter(Boolean);
  return {
    cmd: parts[0] ?? "",
    args: parts.slice(1)
  };
}

function parseScriptName(command: string): ScriptName | null {
  const normalized = command.trim().toLowerCase();
  if (normalized === "npm test" || normalized === "npm run test" || normalized === "pnpm test") {
    return "test";
  }
  if (normalized === "npm run build" || normalized === "pnpm build") {
    return "build";
  }
  if (normalized === "npm run lint" || normalized === "pnpm lint") {
    return "lint";
  }
  return null;
}

function isDefaultNpmInitTestPlaceholder(scriptValue: string): boolean {
  const normalized = scriptValue.toLowerCase().replace(/\s+/g, " ").trim();
  return normalized.includes("no test specified") && normalized.includes("exit 1");
}

async function readPackageScripts(cwd: string): Promise<Record<string, string>> {
  const packageJsonPath = path.join(cwd, "package.json");
  const hasPackageJson = await fs.pathExists(packageJsonPath);
  if (!hasPackageJson) {
    return {};
  }

  try {
    const pkg = await fs.readJson(packageJsonPath);
    const scripts = pkg?.scripts;
    if (!scripts || typeof scripts !== "object") {
      return {};
    }

    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(scripts as Record<string, unknown>)) {
      if (typeof value === "string") {
        result[key] = value;
      }
    }
    return result;
  } catch {
    return {};
  }
}

async function isJsLikeRepo(cwd: string): Promise<boolean> {
  try {
    const entries = await fs.readdir(cwd, { withFileTypes: true });
    return entries.some((entry) => entry.isFile() && /\.(js|cjs|mjs|ts)$/i.test(entry.name));
  } catch {
    return false;
  }
}

export async function runAllowedCommands(commands: string[], cwd: string): Promise<CommandResult[]> {
  const results: CommandResult[] = [];
  const scripts = await readPackageScripts(cwd);

  for (const command of commands) {
    const isInstallCommand = isAllowedInstallCommand(command);
    if (!ALLOWLIST.has(command) && !isInstallCommand) {
      results.push({
        command,
        status: "skipped",
        success: false,
        stdout: "",
        stderr: "",
        exitCode: 0,
        reason: "Command is not in allowlist"
      });
      continue;
    }

    if (isInstallCommand) {
      const hasPackageJson = await fs.pathExists(path.join(cwd, "package.json"));
      if (!hasPackageJson) {
        results.push({
          command,
          status: "skipped",
          success: false,
          stdout: "",
          stderr: "",
          exitCode: 0,
          reason: "package.json not found"
        });
        continue;
      }

      const { cmd, args } = parseCommand(command);
      try {
        const res = await execa(cmd, args, { cwd });
        results.push({
          command,
          status: "success",
          success: true,
          stdout: res.stdout ?? "",
          stderr: res.stderr ?? "",
          exitCode: 0
        });
      } catch (err) {
        const e = err as { stdout?: string; stderr?: string; message?: string; exitCode?: number };
        results.push({
          command,
          status: "failed",
          success: false,
          stdout: e.stdout ?? "",
          stderr: e.stderr ?? e.message ?? "",
          exitCode: typeof e.exitCode === "number" ? e.exitCode : 1
        });
      }
      continue;
    }

    if (command === "node index.js") {
      const indexPath = path.join(cwd, "index.js");
      const hasIndex = await fs.pathExists(indexPath);
      const hasPackageJson = await fs.pathExists(path.join(cwd, "package.json"));
      const jsLike = hasPackageJson || (await isJsLikeRepo(cwd));

      if (!hasIndex) {
        results.push({
          command,
          status: "skipped",
          success: false,
          stdout: "",
          stderr: "",
          exitCode: 0,
          reason: "index.js not found in repo root"
        });
        continue;
      }

      if (!jsLike) {
        results.push({
          command,
          status: "skipped",
          success: false,
          stdout: "",
          stderr: "",
          exitCode: 0,
          reason: "Repository is not JS-like"
        });
        continue;
      }

      console.log("Running validation: node index.js");
      try {
        const res = await execa("node", ["index.js"], { cwd });
        results.push({ command, status: "success", success: true, stdout: res.stdout ?? "", stderr: res.stderr ?? "", exitCode: 0 });
      } catch (err) {
        const e = err as { stdout?: string; stderr?: string; message?: string; exitCode?: number };
        results.push({
          command,
          status: "failed",
          success: false,
          stdout: e.stdout ?? "",
          stderr: e.stderr ?? e.message ?? "",
          exitCode: typeof e.exitCode === "number" ? e.exitCode : 1
        });
      }
      continue;
    }

    const scriptName = parseScriptName(command);
    if (!scriptName) {
      results.push({
        command,
        status: "skipped",
        success: false,
        stdout: "",
        stderr: "",
        exitCode: 0,
        reason: "Unsupported script command format"
      });
      continue;
    }

    const scriptValue = scripts[scriptName];
    if (!scriptValue) {
      if (scriptName === "test") {
        console.log("Skipping test command (no script found)");
      }
      results.push({
        command,
        status: "skipped",
        success: false,
        stdout: "",
        stderr: "",
        exitCode: 0,
        reason: `No ${scriptName} script found in package.json`
      });
      continue;
    }

    if (scriptName === "test" && isDefaultNpmInitTestPlaceholder(scriptValue)) {
      console.log("Skipping test command (no script found)");
      results.push({
        command,
        status: "skipped",
        success: false,
        stdout: "",
        stderr: "",
        exitCode: 0,
        reason: "Default npm init test placeholder"
      });
      continue;
    }

    const { cmd, args } = parseCommand(command);
    try {
      const res = await execa(cmd, args, { cwd });
      results.push({
        command,
        status: "success",
        success: true,
        stdout: res.stdout ?? "",
        stderr: res.stderr ?? "",
        exitCode: 0
      });
    } catch (err) {
      const e = err as { stdout?: string; stderr?: string; message?: string; exitCode?: number };
      results.push({
        command,
        status: "failed",
        success: false,
        stdout: e.stdout ?? "",
        stderr: e.stderr ?? e.message ?? "",
        exitCode: typeof e.exitCode === "number" ? e.exitCode : 1
      });
    }
  }

  return results;
}
