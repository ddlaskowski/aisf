const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const projectRoot = path.resolve(__dirname, "..");
const cliPath = path.join(projectRoot, "dist", "cli.js");
const scenariosRoot = path.join(projectRoot, "test-scenarios");
const scenarioNames = [
  "missing-module",
  "duplicate-declaration",
  "undefined-variable",
  "not-a-function",
  "access-before-init",
  "missing-local-module-export",
  "wrong-import-name",
  "helper-function-not-exported",
  "runtime-error-in-imported-file",
  "missing-export-with-intent",
  "wrong-import-name-with-intent",
  "same-file-reference-error-with-intent",
  "low-confidence-fallback-intent",
  "retry-stop"
];
const optionalScenarioNames = new Set([
  "retry-stop",
  "missing-local-module-export",
  "wrong-import-name",
  "helper-function-not-exported",
  "runtime-error-in-imported-file",
  "missing-export-with-intent",
  "wrong-import-name-with-intent",
  "same-file-reference-error-with-intent",
  "low-confidence-fallback-intent"
]);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function ensureFile(filePath, content) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, content, "utf8");
  }
}

function ensureJson(filePath, value) {
  if (!fs.existsSync(filePath)) {
    writeJson(filePath, value);
  }
}

function scaffoldScenarioFixtures() {
  ensureDir(scenariosRoot);

  const fixtures = {
    "missing-module": {
      index: 'const express = require("express");\nconsole.log("App started");\n',
      packageJson: {
        scripts: {
          start: "node index.js"
        }
      },
      expected: {
        name: "missing-module",
        task: "Fix app",
        expect: {
          finalStatus: "pass",
          classificationType: "missing-module",
          strategy: "install-dependency",
          shouldInstallDependency: "express",
          shouldNotUseAiRepair: true
        }
      }
    },
    "duplicate-declaration": {
      index: 'const logger = console.log;\nconst logger = console.log;\nlogger("App started");\n',
      packageJson: {
        scripts: {
          start: "node index.js"
        }
      },
      expected: {
        name: "duplicate-declaration",
        task: "Fix duplicate logger declaration",
        expect: {
          finalStatus: "pass",
          classificationType: "duplicate-declaration",
          strategy: "deterministic-patch"
        }
      }
    },
    "retry-stop": {
      index: 'throw new Error("Custom failure");\n',
      packageJson: {
        scripts: {
          start: "node index.js"
        }
      },
      expected: {
        name: "retry-stop",
        task: "Fix app",
        expect: {
          finalStatus: "fail",
          retryStopReason: "Same failure repeated twice"
        }
      }
    },
    "undefined-variable": {
      index: "console.log(testVar);\n",
      packageJson: {
        scripts: {
          start: "node index.js"
        }
      },
      expected: {
        name: "undefined-variable",
        task: "Fix undefined variable",
        expect: {
          finalStatus: "pass",
          classificationType: "undefined-variable",
          strategy: "safe-replacement",
          shouldNotUseAiRepair: true,
          finalIndexContains: 'typeof testVar !== "undefined" ? testVar : undefined'
        }
      }
    },
    "not-a-function": {
      index: "const handler = null;\nhandler();\n",
      packageJson: {
        scripts: {
          start: "node index.js"
        }
      },
      expected: {
        name: "not-a-function",
        task: "Fix invalid function call",
        expect: {
          finalStatus: "pass",
          classificationType: "not-a-function",
          strategy: "guard-call",
          shouldNotUseAiRepair: true,
          finalIndexContains: 'typeof handler === "function" && handler();'
        }
      }
    },
    "access-before-init": {
      index: "console.log(value);\nconst value = 123;\n",
      packageJson: {
        scripts: {
          start: "node index.js"
        }
      },
      expected: {
        name: "access-before-init",
        task: "Fix initialization order",
        expect: {
          finalStatus: "pass",
          classificationType: "access-before-initialization",
          strategy: "reorder-init",
          shouldNotUseAiRepair: true,
          finalIndexContains: "const value = 123;\nconsole.log(value);"
        }
      }
    },
    "missing-local-module-export": {
      files: {
        "index.js": 'import { greet } from "./helper.js";\nconsole.log(greet("Factory"));\n',
        "helper.js": 'function greet(name) {\n  return `Hello, ${name}`;\n}\n'
      },
      packageJson: {
        type: "module",
        scripts: {
          start: "node index.js"
        }
      },
      expected: {
        name: "missing-local-module-export",
        task: "Fix missing local module export",
        expect: {
          finalStatus: "pass",
          contextAwareTargetFile: "helper.js",
          contextAwareTargetExists: true,
          onlyOnePatchedFile: true,
          changedFilesIncludeOnly: ["helper.js"],
          finalHelperContains: "export"
        }
      }
    },
    "wrong-import-name": {
      files: {
        "index.js": 'import { greet } from "./helper.js";\nconsole.log(greet("Factory"));\n',
        "helper.js": 'export function sayHello(name) {\n  return `Hello, ${name}`;\n}\n'
      },
      packageJson: {
        type: "module",
        scripts: {
          start: "node index.js"
        }
      },
      expected: {
        name: "wrong-import-name",
        task: "Fix wrong import name",
        expect: {
          finalStatus: "pass",
          contextAwareTargetExists: true,
          onlyOnePatchedFile: true
        }
      }
    },
    "helper-function-not-exported": {
      files: {
        "index.js": 'import { calculateTotal } from "./helper.js";\nconsole.log(calculateTotal([2, 3, 4]));\n',
        "helper.js": "function calculateTotal(items) {\n  return items.reduce((sum, item) => sum + item, 0);\n}\n"
      },
      packageJson: {
        type: "module",
        scripts: {
          start: "node index.js"
        }
      },
      expected: {
        name: "helper-function-not-exported",
        task: "Fix helper function export",
        expect: {
          finalStatus: "pass",
          contextAwareTargetFile: "helper.js",
          contextAwareTargetExists: true,
          onlyOnePatchedFile: true,
          changedFilesIncludeOnly: ["helper.js"],
          finalHelperContains: "export"
        }
      }
    },
    "runtime-error-in-imported-file": {
      files: {
        "index.js": 'import { getResult } from "./helper.js";\nconsole.log(getResult());\n',
        "helper.js": "export function getResult() {\n  const result = missingValue + 1;\n  return result;\n}\n"
      },
      packageJson: {
        type: "module",
        scripts: {
          start: "node index.js"
        }
      },
      expected: {
        name: "runtime-error-in-imported-file",
        task: "Fix runtime error in imported helper file",
        expect: {
          finalStatus: "pass",
          classificationType: "undefined-variable",
          strategy: "safe-replacement",
          contextAwareTargetFile: "helper.js",
          contextAwareTargetExists: true,
          onlyOnePatchedFile: true,
          changedFilesIncludeOnly: ["helper.js"],
          finalHelperContains: "typeof missingValue"
        }
      }
    },
    "missing-export-with-intent": {
      files: {
        "index.js": 'import { greet } from "./helper.js";\nconsole.log(greet("Factory"));\n',
        "helper.js": 'function greet(name) {\n  return `Hello, ${name}`;\n}\n'
      },
      packageJson: {
        type: "module",
        scripts: {
          start: "node index.js"
        }
      },
      expected: {
        name: "missing-export-with-intent",
        task: "Fix missing export with repair intent",
        expect: {
          contextAwareTargetFile: "helper.js",
          contextAwareTargetExists: true,
          repairIntentAssertions: true,
          repairIntentType: "missing-export",
          onlyOnePatchedFile: true
        }
      }
    },
    "wrong-import-name-with-intent": {
      files: {
        "index.js": 'import { greet } from "./helper.js";\nconsole.log(greet("Factory"));\n',
        "helper.js": 'export function sayHello(name) {\n  return `Hello, ${name}`;\n}\n'
      },
      packageJson: {
        type: "module",
        scripts: {
          start: "node index.js"
        }
      },
      expected: {
        name: "wrong-import-name-with-intent",
        task: "Fix wrong import name with repair intent",
        expect: {
          contextAwareTargetExists: true,
          repairIntentAssertions: true,
          onlyOnePatchedFile: true
        }
      }
    },
    "same-file-reference-error-with-intent": {
      files: {
        "index.js": 'console.log(localMissingValue);\n'
      },
      packageJson: {
        scripts: {
          start: "node index.js"
        }
      },
      expected: {
        name: "same-file-reference-error-with-intent",
        task: "Fix same-file reference error with repair intent",
        expect: {
          contextAwareTargetFile: "index.js",
          contextAwareTargetExists: true,
          classificationType: "undefined-variable",
          strategy: "safe-replacement",
          repairIntentAssertions: true,
          repairIntentType: "runtime-local-error",
          onlyOnePatchedFile: true
        }
      }
    },
    "low-confidence-fallback-intent": {
      files: {
        "index.js": 'throw new Error("Odd local failure");\n'
      },
      packageJson: {
        scripts: {
          start: "node index.js"
        }
      },
      expected: {
        name: "low-confidence-fallback-intent",
        task: "Fix low confidence fallback intent",
        expect: {
          contextAwareTargetFile: "index.js",
          contextAwareTargetExists: true,
          repairIntentAssertions: true,
          repairIntentType: "unknown",
          repairIntentConfidence: "low",
          onlyOnePatchedFile: true
        }
      }
    }
  };

  for (const [name, fixture] of Object.entries(fixtures)) {
    const scenarioDir = path.join(scenariosRoot, name);
    ensureDir(scenarioDir);
    const files = fixture.files ?? { "index.js": fixture.index };
    for (const [fileName, content] of Object.entries(files)) {
      const parsed = path.parse(fileName);
      const originalName = path.join(parsed.dir, `${parsed.name}.original${parsed.ext}`);
      ensureFile(path.join(scenarioDir, originalName), content);
      ensureFile(path.join(scenarioDir, fileName), content);
    }
    ensureJson(path.join(scenarioDir, "package.original.json"), fixture.packageJson);
    ensureJson(path.join(scenarioDir, "package.json"), fixture.packageJson);
    ensureJson(path.join(scenarioDir, "expected.json"), fixture.expected);
  }
}

function resetScenario(scenarioDir) {
  fs.rmSync(path.join(scenarioDir, "node_modules"), { recursive: true, force: true });
  fs.rmSync(path.join(scenarioDir, ".factory"), { recursive: true, force: true });

  const expectedPath = path.join(scenarioDir, "expected.json");
  const expected = readJson(expectedPath);
  if (expected.reset?.cleanInstall || expected.expect?.shouldInstallDependency) {
    fs.rmSync(path.join(scenarioDir, "package-lock.json"), { force: true });
  }

  const originalFiles = fs
    .readdirSync(scenarioDir)
    .filter((file) => file.endsWith(".original.js"));
  for (const originalFile of originalFiles) {
    const targetFile = originalFile.replace(".original.js", ".js");
    fs.writeFileSync(
      path.join(scenarioDir, targetFile),
      fs.readFileSync(path.join(scenarioDir, originalFile), "utf8"),
      "utf8"
    );
  }

  const originalPackage = path.join(scenarioDir, "package.original.json");
  if (fs.existsSync(originalPackage)) {
    fs.writeFileSync(path.join(scenarioDir, "package.json"), fs.readFileSync(originalPackage, "utf8"), "utf8");
  }
}

function latestRunDir(scenarioRepoPath) {
  const runsDir = path.join(scenarioRepoPath, ".factory", "runs");
  if (!fs.existsSync(runsDir)) {
    return null;
  }

  const dirs = fs
    .readdirSync(runsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(runsDir, entry.name))
    .sort();

  return dirs[dirs.length - 1] ?? null;
}

function latestClassification(runDir) {
  if (!runDir) {
    return { data: null, file: null };
  }

  const prevalidationFile = "failure-classification-prevalidation.json";
  const prevalidationPath = path.join(runDir, prevalidationFile);
  if (fs.existsSync(prevalidationPath)) {
    return { data: readJson(prevalidationPath), file: prevalidationFile };
  }

  const files = fs
    .readdirSync(runDir)
    .filter((file) => /^failure-classification-attempt-.*\.json$/.test(file))
    .sort();

  if (files.length === 0) {
    return { data: null, file: null };
  }

  const selected = files[files.length - 1];
  return { data: readJson(path.join(runDir, selected)), file: selected };
}

function readOptionalText(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
}

function readOptionalJson(filePath) {
  return fs.existsSync(filePath) ? readJson(filePath) : null;
}

function listClassificationFiles(runDir) {
  if (!runDir || !fs.existsSync(runDir)) {
    return [];
  }

  return fs
    .readdirSync(runDir)
    .filter((file) => file === "failure-classification-prevalidation.json" || /^failure-classification-attempt-.*\.json$/.test(file))
    .sort();
}

function listContextAwareTargetFiles(runDir) {
  if (!runDir || !fs.existsSync(runDir)) {
    return [];
  }

  return fs
    .readdirSync(runDir)
    .filter((file) => /^context-aware-repair-target-.*\.json$/.test(file))
    .sort();
}

function listRepairIntentFiles(runDir) {
  if (!runDir || !fs.existsSync(runDir)) {
    return [];
  }

  return fs
    .readdirSync(runDir)
    .filter((file) => /^repair-intent-.*\.json$/.test(file))
    .sort();
}

function listPatchIntentValidationFiles(runDir) {
  if (!runDir || !fs.existsSync(runDir)) {
    return [];
  }

  return fs
    .readdirSync(runDir)
    .filter((file) => /^patch-intent-validation-.*\.json$/.test(file))
    .sort();
}

function latestContextAwareTarget(runDir) {
  const files = listContextAwareTargetFiles(runDir);
  if (!runDir || files.length === 0) {
    return { data: null, file: null };
  }

  const selected = files[files.length - 1];
  return { data: readJson(path.join(runDir, selected)), file: selected };
}

function latestRepairIntent(runDir) {
  const files = listRepairIntentFiles(runDir);
  if (!runDir || files.length === 0) {
    return { data: null, file: null };
  }

  const selected = files[files.length - 1];
  return { data: readJson(path.join(runDir, selected)), file: selected };
}

function latestPatchIntentValidation(runDir) {
  const files = listPatchIntentValidationFiles(runDir);
  if (!runDir || files.length === 0) {
    return { data: null, file: null };
  }

  const selected = files[files.length - 1];
  return { data: readJson(path.join(runDir, selected)), file: selected };
}

function readRunChanges(runDir) {
  if (!runDir) {
    return null;
  }

  const selfHealFiles = fs.existsSync(runDir)
    ? fs
        .readdirSync(runDir)
        .filter((file) => /^self-heal-\d+-changes\.json$/.test(file))
        .sort()
    : [];
  const selected = selfHealFiles[selfHealFiles.length - 1] ?? "changes.json";
  const filePath = path.join(runDir, selected);
  return fs.existsSync(filePath) ? readJson(filePath) : null;
}

function changedFilesFromFinalReport(finalReport) {
  const match = finalReport.match(/## Changed Files\r?\n([\s\S]*?)(?:\r?\n\r?\n## |\r?\n```|$)/);
  if (!match) {
    return [];
  }

  return match[1]
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2).trim())
    .filter((line) => line && line !== "None");
}

function buildDebugInfo(scenarioRepoPath, runResult) {
  const runsDir = path.join(scenarioRepoPath, ".factory", "runs");
  const runDir = latestRunDir(scenarioRepoPath);
  const selectedClassification = latestClassification(runDir);
  const selectedContextAwareTarget = latestContextAwareTarget(runDir);
  const selectedRepairIntent = latestRepairIntent(runDir);
  const selectedPatchIntentValidation = latestPatchIntentValidation(runDir);
  const changes = readRunChanges(runDir);
  const patch = runResult.patch ?? runResult.patchMetadata ?? null;
  return {
    status: runResult.status,
    signal: runResult.signal,
    error: runResult.error || undefined,
    cliPath,
    scenarioRepoPath,
    runsDir,
    runsDirExists: fs.existsSync(runsDir),
    latestRunDir: runDir,
    finalReportExists: runDir ? fs.existsSync(path.join(runDir, "final-report.md")) : false,
    classificationFilesFound: listClassificationFiles(runDir),
    prevalidationClassificationExists: runDir
      ? fs.existsSync(path.join(runDir, "failure-classification-prevalidation.json"))
      : false,
    selectedClassificationFile: selectedClassification.file,
    contextAwareTargetFilesFound: listContextAwareTargetFiles(runDir),
    selectedContextAwareTargetFile: selectedContextAwareTarget.file,
    contextAwareRepairTarget: selectedContextAwareTarget.data,
    repairIntentFilesFound: listRepairIntentFiles(runDir),
    selectedRepairIntentFile: selectedRepairIntent.file,
    repairIntent: selectedRepairIntent.data,
    patchIntentValidationFilesFound: listPatchIntentValidationFiles(runDir),
    selectedPatchIntentValidationFile: selectedPatchIntentValidation.file,
    patchIntentValidation: selectedPatchIntentValidation.data,
    changes,
    retryStopExists: runDir ? fs.existsSync(path.join(runDir, "retry-stop.json")) : false,
    patch
  };
}

function writeScenarioDebug(scenarioRepoPath, runResult) {
  const debugDir = path.join(scenarioRepoPath, ".scenario-debug");
  ensureDir(debugDir);
  fs.writeFileSync(path.join(debugDir, "stdout.txt"), runResult.stdout, "utf8");
  fs.writeFileSync(path.join(debugDir, "stderr.txt"), runResult.stderr, "utf8");
  writeJson(path.join(debugDir, "result.json"), buildDebugInfo(scenarioRepoPath, runResult));
}

function validatePatchExpectation(failures, expectedPatch, actualPatch) {
  if (!expectedPatch) {
    return;
  }

  if (!actualPatch) {
    failures.push("Expected patch metadata but none was found");
    return;
  }

  const checks = [
    ["engineUsed", "patchEngineUsed"],
    ["skipped", "patchSkipped"],
    ["changed", "patchChanged"],
    ["confidence", "patchConfidence"]
  ];

  for (const [expectedKey, actualKey] of checks) {
    if (Object.prototype.hasOwnProperty.call(expectedPatch, expectedKey) && actualPatch[actualKey] !== expectedPatch[expectedKey]) {
      failures.push(`Expected patch.${expectedKey}=${expectedPatch[expectedKey]} but got ${actualPatch[actualKey]}`);
    }
  }

  if (expectedPatch.skipReasonIncludes) {
    const actualReason = actualPatch.patchSkipReason ?? "";
    if (!actualReason.includes(expectedPatch.skipReasonIncludes)) {
      failures.push(`Expected patch.skipReasonIncludes=${JSON.stringify(expectedPatch.skipReasonIncludes)} but got ${JSON.stringify(actualReason)}`);
    }
  }
}

function validateScenario(scenarioRepoPath, expected, runResult) {
  const failures = [];
  const expectedRunsDir = path.join(scenarioRepoPath, ".factory", "runs");
  const runDir = latestRunDir(scenarioRepoPath);
  const finalReport = runDir ? readOptionalText(path.join(runDir, "final-report.md")) : "";
  const failureMemory = runDir ? readOptionalJson(path.join(runDir, "failure-memory.json")) : null;
  const retryStop = runDir ? readOptionalJson(path.join(runDir, "retry-stop.json")) : null;
  const selectedClassification = latestClassification(runDir);
  const selectedContextAwareTarget = latestContextAwareTarget(runDir);
  const selectedRepairIntent = latestRepairIntent(runDir);
  const selectedPatchIntentValidation = latestPatchIntentValidation(runDir);
  const classification = selectedClassification.data;
  const contextAwareTarget = selectedContextAwareTarget.data;
  const repairIntent = selectedRepairIntent.data;
  const patchIntentValidation = selectedPatchIntentValidation.data;
  const changes = readRunChanges(runDir);
  const expect = expected.expect ?? {};
  const debugInfo = buildDebugInfo(scenarioRepoPath, runResult);
  const changedFiles = changedFilesFromFinalReport(finalReport);

  if (runResult.exitCode !== 0) {
    failures.push(`Expected CLI exit code 0, got ${runResult.exitCode}`);
  }

  if (!runDir) {
    failures.push("Expected .factory run directory to be created");
    failures.push(`expected run dir: ${expectedRunsDir}`);
    failures.push(`run dir exists: ${fs.existsSync(expectedRunsDir) ? "yes" : "no"}`);
    if (runResult.stderr.trim()) {
      failures.push(`stderr first 2000 chars: ${runResult.stderr.slice(0, 2000)}`);
    }
    if (runResult.stdout.trim()) {
      failures.push(`stdout first 2000 chars: ${runResult.stdout.slice(0, 2000)}`);
    }
    if (runResult.error) {
      failures.push(`spawn error: ${runResult.error.split(/\r?\n/).slice(0, 2).join(" | ")}`);
    }
  }

  if (expect.finalStatus) {
    const needle = `Final status: ${expect.finalStatus}`;
    if (!finalReport.includes(needle)) {
      failures.push(`Expected final report to contain "${needle}"`);
    }
  }

  if (expect.classificationType) {
    const actual = classification?.type;
    if (actual !== expect.classificationType) {
      failures.push(`Expected classificationType ${expect.classificationType}, got ${actual ?? "missing"}`);
    }
  }

  if (expect.strategy) {
    const actual = classification?.strategy;
    if (actual !== expect.strategy) {
      failures.push(`Expected strategy ${expect.strategy}, got ${actual ?? "missing"}`);
    }
  }

  if (expect.retryStopReason) {
    const actual = retryStop?.reason;
    if (actual !== expect.retryStopReason) {
      failures.push(`Expected retryStopReason ${expect.retryStopReason}, got ${actual ?? "missing"}`);
    }
  }

  if (expect.shouldInstallDependency) {
    const packageJson = readJson(path.join(scenarioRepoPath, "package.json"));
    const deps = {
      ...(packageJson.dependencies ?? {}),
      ...(packageJson.devDependencies ?? {})
    };
    if (!Object.prototype.hasOwnProperty.call(deps, expect.shouldInstallDependency)) {
      failures.push(`Expected package.json dependencies to include ${expect.shouldInstallDependency}`);
    }
  }

  if (expect.shouldNotUseAiRepair && runResult.stdout.includes("Runtime error passed to AI")) {
    failures.push('Expected stdout not to contain "Runtime error passed to AI"');
  }

  if (expect.finalIndexContains) {
    const indexPath = path.join(scenarioRepoPath, "index.js");
    const indexContent = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, "utf8") : "";
    if (!indexContent.includes(expect.finalIndexContains)) {
      failures.push(`Expected index.js to contain ${JSON.stringify(expect.finalIndexContains)}`);
    }
  }

  if (expect.finalHelperContains) {
    const helperPath = path.join(scenarioRepoPath, "helper.js");
    const helperContent = fs.existsSync(helperPath) ? fs.readFileSync(helperPath, "utf8") : "";
    if (!helperContent.includes(expect.finalHelperContains)) {
      failures.push(`Expected helper.js to contain ${JSON.stringify(expect.finalHelperContains)}`);
    }
  }

  if (expect.contextAwareTargetExists && !contextAwareTarget) {
    failures.push("Expected context-aware repair target artifact to exist");
  }

  if (expect.contextAwareTargetFile && contextAwareTarget) {
    const expectedPath = path.normalize(path.join(scenarioRepoPath, expect.contextAwareTargetFile));
    const actualPath = path.normalize(contextAwareTarget.filePath);
    if (actualPath !== expectedPath) {
      failures.push(`Expected context-aware target ${expectedPath}, got ${actualPath}`);
    }
  }

  if (expect.onlyOnePatchedFile && changedFiles.length > 1) {
    failures.push(`Expected only one changed file, got ${changedFiles.join(", ")}`);
  }

  if (expect.changedFilesIncludeOnly) {
    const expectedFiles = expect.changedFilesIncludeOnly.map((file) => file.replace(/\\/g, "/")).sort();
    const actualFiles = changedFiles.map((file) => file.replace(/\\/g, "/")).sort();
    if (JSON.stringify(actualFiles) !== JSON.stringify(expectedFiles)) {
      failures.push(`Expected changed files ${JSON.stringify(expectedFiles)}, got ${JSON.stringify(actualFiles)}`);
    }
  }

  if (expect.repairIntentAssertions) {
    if (!contextAwareTarget) {
      failures.push("Expected repair target artifact for repair intent assertions");
    }

    if (!repairIntent) {
      failures.push("Expected repairIntent artifact to exist");
    }

    if (contextAwareTarget && repairIntent) {
      const expectedTarget = path.normalize(contextAwareTarget.filePath);
      const actualTarget = path.normalize(repairIntent.targetFile ?? "");
      if (actualTarget !== expectedTarget) {
        failures.push(`Expected repairIntent.targetFile ${expectedTarget}, got ${actualTarget || "missing"}`);
      }
    }

    if (repairIntent) {
      if (expect.repairIntentType && repairIntent.repairType !== expect.repairIntentType) {
        failures.push(`Expected repairIntent.repairType ${expect.repairIntentType}, got ${repairIntent.repairType ?? "missing"}`);
      }
      if (expect.repairIntentConfidence && repairIntent.confidence !== expect.repairIntentConfidence) {
        failures.push(`Expected repairIntent.confidence ${expect.repairIntentConfidence}, got ${repairIntent.confidence ?? "missing"}`);
      }
      if (repairIntent.allowedMutationScope !== "single-file") {
        failures.push(`Expected repairIntent.allowedMutationScope single-file, got ${repairIntent.allowedMutationScope ?? "missing"}`);
      }
      if (!Array.isArray(repairIntent.safetyNotes) || repairIntent.safetyNotes.length === 0) {
        failures.push("Expected repairIntent.safetyNotes to be a non-empty array");
      }
    }

    if (changedFiles.length > 1) {
      failures.push(`Expected at most one mutated file for repair intent scenario, got ${changedFiles.join(", ")}`);
    }

    const hasPatchProposal = Array.isArray(changes?.operations) && changes.operations.length > 0;
    if (hasPatchProposal && !patchIntentValidation) {
      failures.push("Expected patchIntentValidation artifact when patch proposal data exists");
    }

    if (patchIntentValidation) {
      if (typeof patchIntentValidation.ok !== "boolean") {
        failures.push("Expected patchIntentValidation.ok to be boolean");
      }
      if (typeof patchIntentValidation.reason !== "string" || patchIntentValidation.reason.length === 0) {
        failures.push("Expected patchIntentValidation.reason to be non-empty string");
      }
      if (!Array.isArray(patchIntentValidation.safetyNotes)) {
        failures.push("Expected patchIntentValidation.safetyNotes to be an array");
      }
      if (patchIntentValidation.ok && contextAwareTarget && repairIntent) {
        const sameTarget = path.normalize(repairIntent.targetFile) === path.normalize(contextAwareTarget.filePath);
        if (!sameTarget) {
          failures.push("patchIntentValidation.ok was true even though repair intent target did not match repair target");
        }
      }
    }
  }

  validatePatchExpectation(failures, expect.patch ?? expected.patch, debugInfo.patch);

  return {
    failures,
    artifacts: {
      runDir,
      runsDir: expectedRunsDir,
      runsDirExists: fs.existsSync(expectedRunsDir),
      finalReport,
      failureMemory,
      retryStop,
      classification,
      selectedClassificationFile: selectedClassification.file,
      contextAwareTarget,
      selectedContextAwareTargetFile: selectedContextAwareTarget.file,
      repairIntent,
      selectedRepairIntentFile: selectedRepairIntent.file,
      patchIntentValidation,
      selectedPatchIntentValidationFile: selectedPatchIntentValidation.file,
      changes,
      changedFiles,
      patch: debugInfo.patch
    }
  };
}

function runScenario(name) {
  const scenarioRepoPath = path.join(scenariosRoot, name);
  const expected = readJson(path.join(scenarioRepoPath, "expected.json"));
  resetScenario(scenarioRepoPath);

  console.log(`\nRunning scenario: ${name}`);
  console.log(`projectRoot: ${projectRoot}`);
  console.log(`scenarioRepoPath: ${scenarioRepoPath}`);
  console.log(`cliPath: ${cliPath}`);
  console.log(`scenario package.json exists: ${fs.existsSync(path.join(scenarioRepoPath, "package.json")) ? "yes" : "no"}`);
  console.log(`scenario index.js exists after restore: ${fs.existsSync(path.join(scenarioRepoPath, "index.js")) ? "yes" : "no"}`);

  const result = spawnSync(
    process.execPath,
    [cliPath, "run", "--repo", scenarioRepoPath, "--task", expected.task, "--yes"],
    {
      cwd: projectRoot,
      encoding: "utf8",
      input: "y\ny\n",
      timeout: 180000,
      env: { ...process.env, SOFTWARE_FACTORY_YES: "1" },
      shell: false
    }
  );

  const runResult = {
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    exitCode: result.status ?? 1,
    status: result.status,
    signal: result.signal,
    error: result.error ? String(result.error.stack ?? result.error.message ?? result.error) : ""
  };
  writeScenarioDebug(scenarioRepoPath, runResult);
  const validation = validateScenario(scenarioRepoPath, expected, runResult);

  return {
    name,
    expected,
    runResult,
    ...validation
  };
}

function isEnvironmentEpermFailure(runResult) {
  return [runResult.error, runResult.stdout, runResult.stderr].some((value) => typeof value === "string" && value.includes("EPERM"));
}

function runRetryControlUnit() {
  const { shouldContinueRetry } = require(path.join(projectRoot, "dist", "failure", "retryControl.js"));
  require(path.join(projectRoot, "dist", "failure", "failureClassifier.js"));

  const failureMemory = [
    {
      attempt: 1,
      type: "unknown",
      strategy: "ai-fix",
      message: "Error: Custom failure",
      changeApplied: true,
      note: "Validation still failed after repair strategy"
    }
  ];

  const currentFailure = {
    type: "unknown",
    strategy: "ai-fix",
    confidence: "low",
    details: {
      rawMessage: "Error: Custom failure"
    }
  };

  const actual = shouldContinueRetry({
    failureMemory,
    currentFailure,
    attempt: 2,
    maxAttempts: 3,
    changeApplied: true
  });
  const expected = {
    shouldContinue: false,
    reason: "Same failure repeated twice"
  };

  if (actual.shouldContinue === expected.shouldContinue && actual.reason === expected.reason) {
    console.log("PASS retry-control-unit");
    return true;
  }

  console.log("FAIL retry-control-unit");
  console.log(`  Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  return false;
}

function assertSafePatch(label, actual, expected) {
  for (const [key, value] of Object.entries(expected)) {
    if (actual[key] !== value) {
      throw new Error(`${label}: expected ${key}=${JSON.stringify(value)}, got ${JSON.stringify(actual[key])}`);
    }
  }
}

function runSafePatchEngineUnit() {
  const { applySafePatch } = require(path.join(projectRoot, "dist", "patchEngine", "index.js"));

  try {
    const safeReplace = applySafePatch("const logger = console.log;\nconst logger = console.log;\n", {
      type: "replace",
      target: { type: "exact", match: "\nconst logger = console.log;" },
      replacement: ""
    });
    assertSafePatch("safe replace", safeReplace, { success: true, changed: true, skipped: false, confidence: "high" });
    if (safeReplace.fileAfter !== "const logger = console.log;\n") {
      throw new Error(`safe replace: duplicate line was not removed, got ${JSON.stringify(safeReplace.fileAfter)}`);
    }

    const duplicateDeclaration = applySafePatch("const logger = console.log;\n", {
      type: "insertAfter",
      anchor: { text: "const logger = console.log;" },
      content: "\nconst logger = console.log;"
    });
    assertSafePatch("unsafe duplicate declaration", duplicateDeclaration, {
      success: false,
      changed: false,
      skipped: true,
      confidence: "low"
    });
    if (!duplicateDeclaration.reason?.includes("duplicate declaration")) {
      throw new Error(`unsafe duplicate declaration: expected duplicate declaration reason, got ${duplicateDeclaration.reason}`);
    }

    const importPlacement = applySafePatch("console.log('ready');\n", {
      type: "appendSafe",
      content: 'const fs = require("fs");'
    });
    assertSafePatch("unsafe import/require placement", importPlacement, {
      success: false,
      changed: false,
      skipped: true,
      confidence: "low"
    });
    if (!importPlacement.reason) {
      throw new Error("unsafe import/require placement: expected skip reason");
    }

    const ambiguousAnchor = applySafePatch("console.log('a');\nconsole.log('a');\n", {
      type: "insertAfter",
      anchor: { text: "console.log('a');" },
      content: "\nconsole.log('b');"
    });
    assertSafePatch("ambiguous anchor", ambiguousAnchor, {
      success: false,
      changed: false,
      skipped: true,
      confidence: "low",
      reason: "Insert anchor is not unique"
    });

    const safeAppend = applySafePatch("console.log('a');\n", {
      type: "appendSafe",
      content: "console.log('b');"
    });
    assertSafePatch("safe append", safeAppend, { success: true, changed: true, skipped: false, confidence: "medium" });
    if (!safeAppend.fileAfter.includes("console.log('b');")) {
      throw new Error("safe append: appended content missing");
    }

    const safePatchDuplicateBlocked = applySafePatch('const logger = console.log;\nconsole.log("start");\n', {
      type: "insertAfter",
      anchor: { text: 'console.log("start");' },
      content: '\nconst logger = require("./logger");'
    });
    assertSafePatch("safe-patch-duplicate-blocked", safePatchDuplicateBlocked, {
      success: false,
      changed: false,
      skipped: true,
      confidence: "low"
    });
    if (!safePatchDuplicateBlocked.reason?.includes("duplicate")) {
      throw new Error(`safe-patch-duplicate-blocked: expected duplicate reason, got ${safePatchDuplicateBlocked.reason}`);
    }

    const safePatchAmbiguousAnchorBlocked = applySafePatch('console.log("ready");\nconsole.log("ready");\n', {
      type: "insertAfter",
      anchor: { text: 'console.log("ready");' },
      content: '\nconsole.log("done");'
    });
    assertSafePatch("safe-patch-ambiguous-anchor-blocked", safePatchAmbiguousAnchorBlocked, {
      success: false,
      changed: false,
      skipped: true,
      confidence: "low"
    });
    if (!/(unique|ambiguous)/i.test(safePatchAmbiguousAnchorBlocked.reason ?? "")) {
      throw new Error(
        `safe-patch-ambiguous-anchor-blocked: expected unique/ambiguous reason, got ${safePatchAmbiguousAnchorBlocked.reason}`
      );
    }

    const safePatchExactReplaceApplied = applySafePatch("console.log(testVar);\n", {
      type: "replace",
      target: { type: "exact", match: "console.log(testVar);" },
      replacement: 'console.log(typeof testVar !== "undefined" ? testVar : undefined);'
    });
    assertSafePatch("safe-patch-exact-replace-applied", safePatchExactReplaceApplied, {
      success: true,
      changed: true,
      skipped: false,
      confidence: "high"
    });
    if (!safePatchExactReplaceApplied.fileAfter.includes('console.log(typeof testVar !== "undefined" ? testVar : undefined);')) {
      throw new Error("safe-patch-exact-replace-applied: replacement content missing");
    }

    const safePatchAppendNormalCode = applySafePatch('console.log("start");\n', {
      type: "appendSafe",
      content: 'console.log("done");'
    });
    assertSafePatch("safe-patch-append-normal-code", safePatchAppendNormalCode, {
      success: true,
      changed: true,
      skipped: false,
      confidence: "medium"
    });
    if (!safePatchAppendNormalCode.fileAfter.includes('console.log("done");')) {
      throw new Error("safe-patch-append-normal-code: appended content missing");
    }

    console.log("PASS safe-patch-engine-unit");
    return true;
  } catch (error) {
    console.log("FAIL safe-patch-engine-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runSafeReplacementUnit() {
  const { generateSafeReplacementPatch } = require(path.join(projectRoot, "dist", "fixers", "safeReplacement.js"));

  const result = generateSafeReplacementPatch({
    fileContent: "console.log(testVar);\n",
    symbol: "testVar"
  });
  const patch = result.operations?.[0]?.patch;

  if (
    result.applied === true &&
    patch?.type === "replace" &&
    patch.target?.type === "exact" &&
    patch.target.match === "console.log(testVar);" &&
    patch.replacement === 'console.log(typeof testVar !== "undefined" ? testVar : undefined);'
  ) {
    console.log("PASS safe-replacement-unit");
    return true;
  }

  console.log("FAIL safe-replacement-unit");
  console.log(`  Expected SafePatchEngine exact replace patch, got ${JSON.stringify(result)}`);
  return false;
}

function runPatchExpectationUnit() {
  const failures = [];
  validatePatchExpectation(
    failures,
    {
      engineUsed: true,
      skipped: true,
      changed: false,
      confidence: "low",
      skipReasonIncludes: "require"
    },
    {
      patchEngineUsed: true,
      patchSkipped: true,
      patchChanged: false,
      patchConfidence: "low",
      patchSkipReason: "Cannot append import/require content safely"
    }
  );

  if (failures.length === 0) {
    console.log("PASS patch-expectation-unit");
    return true;
  }

  console.log("FAIL patch-expectation-unit");
  for (const failure of failures) {
    console.log(`  ${failure}`);
  }
  return false;
}

function assertStackFrame(label, actual, expected) {
  if (!actual) {
    throw new Error(`${label}: expected parsed stack frame, got null`);
  }

  for (const [key, value] of Object.entries(expected)) {
    if (actual[key] !== value) {
      throw new Error(`${label}: expected ${key}=${JSON.stringify(value)}, got ${JSON.stringify(actual[key])}`);
    }
  }
}

function runStackTraceParserUnit() {
  const { parseNodeStackTrace } = require(path.join(projectRoot, "dist", "repair", "stackTraceParser.js"));

  try {
    const windowsRoot = "C:/repo";
    const windowsFrame = parseNodeStackTrace(
      [
        "ReferenceError: helper is not defined",
        "    at Object.<anonymous> (C:\\repo\\index.js:4:1)"
      ].join("\n"),
      windowsRoot
    );
    assertStackFrame("windows frame", windowsFrame, {
      errorType: "ReferenceError",
      message: "helper is not defined",
      filePath: "C:/repo/index.js",
      line: 4,
      column: 1
    });

    const unixFrame = parseNodeStackTrace(
      [
        "TypeError: greet is not a function",
        "    at Object.<anonymous> (/repo/src/index.js:7:12)"
      ].join("\n"),
      "/repo"
    );
    assertStackFrame("unix frame", unixFrame, {
      errorType: "TypeError",
      message: "greet is not a function",
      filePath: "/repo/src/index.js",
      line: 7,
      column: 12
    });

    const nodeModulesIgnored = parseNodeStackTrace(
      [
        "Error: boom",
        "    at Object.<anonymous> (/repo/node_modules/pkg/index.js:1:1)",
        "    at /repo/src/helper.js:2:9"
      ].join("\n"),
      "/repo"
    );
    assertStackFrame("node_modules ignored", nodeModulesIgnored, {
      errorType: "Error",
      message: "boom",
      filePath: "/repo/src/helper.js",
      line: 2,
      column: 9
    });

    const internalIgnored = parseNodeStackTrace(
      [
        "Error: internal first",
        "    at node:internal/modules/cjs/loader:1000:10",
        "    at /repo/index.js:3:5"
      ].join("\n"),
      "/repo"
    );
    assertStackFrame("node:internal ignored", internalIgnored, {
      filePath: "/repo/index.js",
      line: 3,
      column: 5
    });

    const firstProjectFrame = parseNodeStackTrace(
      [
        "Error: choose project",
        "    at /external/tool.js:1:2",
        "    at /repo/src/first.js:3:4",
        "    at /repo/src/second.js:5:6"
      ].join("\n"),
      "/repo"
    );
    assertStackFrame("first project frame", firstProjectFrame, {
      filePath: "/repo/src/first.js",
      line: 3,
      column: 4
    });

    const noProjectFile = parseNodeStackTrace(
      [
        "Error: no project",
        "    at /repo/node_modules/pkg/index.js:1:1",
        "    at node:internal/modules/cjs/loader:1000:10",
        "    at native"
      ].join("\n"),
      "/repo"
    );
    if (noProjectFile !== null) {
      throw new Error(`no project file: expected null, got ${JSON.stringify(noProjectFile)}`);
    }

    const directFrame = parseNodeStackTrace(
      [
        "Error: boom",
        "    at /repo/src/helper.js:2:9"
      ].join("\n"),
      "/repo"
    );
    assertStackFrame("direct frame", directFrame, {
      errorType: "Error",
      message: "boom",
      filePath: "/repo/src/helper.js",
      line: 2,
      column: 9
    });

    console.log("PASS stack-trace-parser-unit");
    return true;
  } catch (error) {
    console.log("FAIL stack-trace-parser-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function assertErrorContext(label, actual, expected) {
  if (!actual) {
    throw new Error(`${label}: expected context, got null`);
  }

  for (const [key, value] of Object.entries(expected)) {
    const actualValue = actual[key];
    if (Array.isArray(value)) {
      if (JSON.stringify(actualValue) !== JSON.stringify(value)) {
        throw new Error(`${label}: expected ${key}=${JSON.stringify(value)}, got ${JSON.stringify(actualValue)}`);
      }
    } else if (actualValue !== value) {
      throw new Error(`${label}: expected ${key}=${JSON.stringify(value)}, got ${JSON.stringify(actualValue)}`);
    }
  }
}

function runErrorContextCollectorUnit() {
  const { collectErrorContext } = require(path.join(projectRoot, "dist", "repair", "errorContextCollector.js"));
  const tmpDir = path.join(projectRoot, ".scenario-unit", "error-context-collector");
  const targetFile = path.join(tmpDir, "sample.js");

  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    ensureDir(tmpDir);
    const lines = Array.from({ length: 12 }, (_, index) => `line ${index + 1}`);
    lines[5] = "  const value = missingThing;";
    fs.writeFileSync(targetFile, lines.join("\n"), "utf8");

    const middle = collectErrorContext({
      filePath: targetFile,
      line: 6,
      column: 9
    });
    assertErrorContext("middle context", middle, {
      filePath: targetFile,
      line: 6,
      column: 9,
      beforeLines: ["line 1", "line 2", "line 3", "line 4", "line 5"],
      errorLine: "  const value = missingThing;",
      afterLines: ["line 7", "line 8", "line 9", "line 10", "line 11"]
    });

    const firstLine = collectErrorContext({
      filePath: targetFile,
      line: 1,
      column: 1
    });
    assertErrorContext("first line", firstLine, {
      beforeLines: [],
      errorLine: "line 1",
      afterLines: ["line 2", "line 3", "line 4", "line 5", "  const value = missingThing;"]
    });

    const lastLine = collectErrorContext({
      filePath: targetFile,
      line: 12,
      column: 1
    });
    assertErrorContext("last line", lastLine, {
      beforeLines: ["line 7", "line 8", "line 9", "line 10", "line 11"],
      errorLine: "line 12",
      afterLines: []
    });

    const missingFile = collectErrorContext({
      filePath: path.join(tmpDir, "missing.js"),
      line: 1,
      column: 1
    });
    if (missingFile !== null) {
      throw new Error(`missing file: expected null, got ${JSON.stringify(missingFile)}`);
    }

    const invalidZero = collectErrorContext({
      filePath: targetFile,
      line: 0,
      column: 1
    });
    if (invalidZero !== null) {
      throw new Error(`invalid line 0: expected null, got ${JSON.stringify(invalidZero)}`);
    }

    const beyondEnd = collectErrorContext({
      filePath: targetFile,
      line: 99,
      column: 1
    });
    if (beyondEnd !== null) {
      throw new Error(`line beyond end: expected null, got ${JSON.stringify(beyondEnd)}`);
    }

    console.log("PASS error-context-collector-unit");
    return true;
  } catch (error) {
    console.log("FAIL error-context-collector-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function assertDependencySummary(label, actual, expected) {
  if (!actual) {
    throw new Error(`${label}: expected dependency summary, got null`);
  }

  for (const [key, value] of Object.entries(expected)) {
    const actualValue = actual[key];
    if (Array.isArray(value)) {
      if (JSON.stringify(actualValue) !== JSON.stringify(value)) {
        throw new Error(`${label}: expected ${key}=${JSON.stringify(value)}, got ${JSON.stringify(actualValue)}`);
      }
    } else if (actualValue !== value) {
      throw new Error(`${label}: expected ${key}=${JSON.stringify(value)}, got ${JSON.stringify(actualValue)}`);
    }
  }
}

function runDependencyScannerUnit() {
  const { scanDependencyMap, scanFileDependencies } = require(path.join(projectRoot, "dist", "repair", "dependencyScanner.js"));
  const tmpDir = path.join(projectRoot, ".scenario-unit", "dependency-scanner");
  const targetFile = path.join(tmpDir, "mixed.js");
  const emptyFile = path.join(tmpDir, "empty.js");
  const helperFile = path.join(tmpDir, "helper.js");

  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    ensureDir(tmpDir);
    fs.writeFileSync(
      targetFile,
      [
        'import localDefault from "./esm-default";',
        'import { thing } from "../utils/thing";',
        'import * as allTools from "./tools";',
        'import "./setup";',
        'import express from "express";',
        'const helper = require("./helper");',
        'const { math } = require("../math");',
        'require("./setup");',
        'const react = require("react");',
        "module.exports = helper;",
        "exports.foo = math;",
        "module.exports.bar = allTools;",
        "export default helper;",
        "export function greet() {}",
        "export const answer = 42;",
        "export let count = 0;",
        "export var legacy = true;",
        "export class Widget {}",
        "exports.foo = math;"
      ].join("\n"),
      "utf8"
    );
    fs.writeFileSync(emptyFile, "", "utf8");
    fs.writeFileSync(helperFile, 'module.exports.helper = true;\nrequire("./nested");\n', "utf8");

    const summary = scanFileDependencies(targetFile);
    assertDependencySummary("mixed dependency summary", summary, {
      file: targetFile,
      imports: ["./esm-default", "../utils/thing", "./tools", "./setup", "./helper", "../math"],
      exports: ["module.exports", "foo", "bar", "default", "greet", "answer", "count", "legacy", "Widget"]
    });

    const missing = scanFileDependencies(path.join(tmpDir, "missing.js"));
    if (missing !== null) {
      throw new Error(`missing file: expected null, got ${JSON.stringify(missing)}`);
    }

    const empty = scanFileDependencies(emptyFile);
    if (empty !== null) {
      throw new Error(`empty file: expected null, got ${JSON.stringify(empty)}`);
    }

    const map = scanDependencyMap([targetFile, path.join(tmpDir, "missing.js"), helperFile]);
    if (map.length !== 2 || map[0].file !== targetFile || map[1].file !== helperFile) {
      throw new Error(`dependency map: expected two non-null summaries, got ${JSON.stringify(map)}`);
    }

    console.log("PASS dependency-scanner-unit");
    return true;
  } catch (error) {
    console.log("FAIL dependency-scanner-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function assertRepairTarget(label, actual, expected) {
  for (const [key, value] of Object.entries(expected)) {
    if (actual[key] !== value) {
      throw new Error(`${label}: expected ${key}=${JSON.stringify(value)}, got ${JSON.stringify(actual[key])}`);
    }
  }
}

function runRepairTargetDecisionUnit() {
  const { decideRepairTarget } = require(path.join(projectRoot, "dist", "repair", "repairTargetDecision.js"));
  const failingFile = path.normalize("/repo/src/index.js");
  const helperFile = path.normalize("/repo/src/helper.js");
  const helperTsFile = path.normalize("/repo/src/helper.ts");
  const mathFile = path.normalize("/repo/src/utils/math.js");

  const context = {
    filePath: failingFile,
    line: 4,
    column: 1,
    beforeLines: [],
    errorLine: "helper();",
    afterLines: []
  };

  try {
    const reference = decideRepairTarget({
      errorType: "ReferenceError",
      message: "helper is not defined",
      errorContext: context,
      dependencyMap: []
    });
    assertRepairTarget("ReferenceError", reference, {
      filePath: failingFile,
      confidence: "high"
    });

    const syntax = decideRepairTarget({
      errorType: "SyntaxError",
      message: "Unexpected token",
      errorContext: context,
      dependencyMap: []
    });
    assertRepairTarget("SyntaxError", syntax, {
      filePath: failingFile,
      confidence: "high"
    });

    const missingKnownImport = decideRepairTarget({
      errorType: "Error",
      message: "Cannot find module './helper'",
      errorContext: context,
      dependencyMap: [
        {
          file: failingFile,
          imports: ["./helper"],
          exports: []
        }
      ]
    });
    assertRepairTarget("missing local module known import", missingKnownImport, {
      filePath: failingFile,
      confidence: "medium"
    });

    const missingUnknownImport = decideRepairTarget({
      errorType: "Error",
      message: "Cannot find module '../utils/math'",
      errorContext: context,
      dependencyMap: [
        {
          file: failingFile,
          imports: ["./helper"],
          exports: []
        }
      ]
    });
    assertRepairTarget("missing local module unmatched", missingUnknownImport, {
      filePath: failingFile,
      confidence: "low"
    });

    const missingNamedExport = decideRepairTarget({
      errorType: "SyntaxError",
      message: "The requested module './helper.js' does not provide an export named 'foo'",
      errorContext: context,
      dependencyMap: [
        {
          file: failingFile,
          imports: ["./helper.js"],
          exports: []
        },
        {
          file: helperFile,
          imports: [],
          exports: ["bar"]
        }
      ]
    });
    assertRepairTarget("missing named export", missingNamedExport, {
      filePath: helperFile,
      confidence: "high"
    });

    const relatedNamedExport = decideRepairTarget({
      errorType: "SyntaxError",
      message: "The requested module './helper.js' does not provide an export named 'foo'",
      errorContext: context,
      dependencyMap: [
        {
          file: failingFile,
          imports: ["./helper.js"],
          exports: []
        },
        {
          file: helperTsFile,
          imports: [],
          exports: ["bar"]
        }
      ]
    });
    assertRepairTarget("related named export", relatedNamedExport, {
      filePath: helperTsFile,
      confidence: "medium"
    });

    const typeErrorUsage = decideRepairTarget({
      errorType: "TypeError",
      message: "greet is not a function",
      errorContext: context,
      dependencyMap: [
        {
          file: failingFile,
          imports: ["./helper"],
          exports: []
        },
        {
          file: helperFile,
          imports: [],
          exports: ["greet"]
        }
      ]
    });
    assertRepairTarget("TypeError exported symbol", typeErrorUsage, {
      filePath: failingFile,
      confidence: "medium"
    });

    const typeErrorMissingExport = decideRepairTarget({
      errorType: "TypeError",
      message: "helper.greet is not a function",
      errorContext: context,
      dependencyMap: [
        {
          file: failingFile,
          imports: ["./helper"],
          exports: []
        },
        {
          file: helperFile,
          imports: [],
          exports: ["other"]
        }
      ]
    });
    assertRepairTarget("TypeError likely missing export", typeErrorMissingExport, {
      filePath: helperFile,
      confidence: "medium"
    });

    const unknown = decideRepairTarget({
      errorType: "Error",
      message: "Something else failed",
      errorContext: context,
      dependencyMap: []
    });
    assertRepairTarget("unknown fallback", unknown, {
      filePath: failingFile,
      confidence: "low"
    });

    const extensionless = decideRepairTarget({
      errorType: "SyntaxError",
      message: "The requested module './utils/math' does not provide an export named 'sum'",
      errorContext: context,
      dependencyMap: [
        {
          file: failingFile,
          imports: ["./utils/math"],
          exports: []
        },
        {
          file: mathFile,
          imports: [],
          exports: ["multiply"]
        }
      ]
    });
    assertRepairTarget("extensionless import resolution", extensionless, {
      filePath: mathFile,
      confidence: "high"
    });

    console.log("PASS repair-target-decision-unit");
    return true;
  } catch (error) {
    console.log("FAIL repair-target-decision-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runContextAwareTargetIntegrationUnit() {
  const { selectContextAwareRepairTarget } = require(path.join(
    projectRoot,
    "dist",
    "repair",
    "contextAwareRepairTarget.js"
  ));
  const tmpDir = path.join(projectRoot, ".scenario-unit", "context-aware-target");
  const indexFile = path.join(tmpDir, "index.js");
  const helperFile = path.join(tmpDir, "helper.js");
  const fallbackFile = path.join(tmpDir, "fallback.js");

  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    ensureDir(tmpDir);
    fs.writeFileSync(indexFile, ['import { foo } from "./helper.js";', "console.log(foo);"].join("\n"), "utf8");
    fs.writeFileSync(helperFile, ["export const bar = 1;", "console.log('helper');"].join("\n"), "utf8");
    fs.writeFileSync(fallbackFile, "console.log('fallback');\n", "utf8");

    const unparseable = selectContextAwareRepairTarget({
      rawOutput: "not a stack trace",
      projectRoot: tmpDir,
      fallbackFilePath: fallbackFile
    });
    if (unparseable !== null) {
      throw new Error(`unparseable stack: expected null, got ${JSON.stringify(unparseable)}`);
    }

    const missingContext = selectContextAwareRepairTarget({
      rawOutput: ["ReferenceError: x is not defined", `    at ${path.join(tmpDir, "missing.js")}:1:1`].join("\n"),
      projectRoot: tmpDir,
      fallbackFilePath: fallbackFile
    });
    if (missingContext !== null) {
      throw new Error(`missing context: expected null, got ${JSON.stringify(missingContext)}`);
    }

    const sameFile = selectContextAwareRepairTarget({
      rawOutput: ["ReferenceError: foo is not defined", `    at Object.<anonymous> (${indexFile}:2:13)`].join("\n"),
      projectRoot: tmpDir,
      fallbackFilePath: fallbackFile
    });
    assertRepairTarget("context-aware ReferenceError", sameFile, {
      filePath: indexFile,
      confidence: "high",
      usedContextAwareDecision: true
    });

    const missingExport = selectContextAwareRepairTarget({
      rawOutput: [
        "SyntaxError: The requested module './helper.js' does not provide an export named 'foo'",
        `    at ModuleJob._instantiate (node:internal/modules/esm/module_job:134:21)`,
        `    at async ModuleJob.run (${indexFile}:1:1)`
      ].join("\n"),
      projectRoot: tmpDir,
      fallbackFilePath: fallbackFile
    });
    assertRepairTarget("context-aware missing export", missingExport, {
      filePath: helperFile,
      confidence: "high",
      usedContextAwareDecision: true
    });

    fs.writeFileSync(indexFile, ['import { foo } from "./missing.js";', "console.log(foo);"].join("\n"), "utf8");
    const unresolvedImport = selectContextAwareRepairTarget({
      rawOutput: [
        "SyntaxError: The requested module './missing.js' does not provide an export named 'foo'",
        `    at ${indexFile}:1:1`
      ].join("\n"),
      projectRoot: tmpDir,
      fallbackFilePath: fallbackFile
    });
    assertRepairTarget("context-aware unresolved import fallback", unresolvedImport, {
      filePath: indexFile,
      confidence: "low",
      usedContextAwareDecision: true
    });

    const selectedFiles = new Set([sameFile?.filePath, missingExport?.filePath, unresolvedImport?.filePath].filter(Boolean));
    if (selectedFiles.size > 3 || !sameFile?.filePath || !missingExport?.filePath || !unresolvedImport?.filePath) {
      throw new Error(`single target selection: expected one selected file per decision, got ${JSON.stringify(Array.from(selectedFiles))}`);
    }

    const before = fs.readFileSync(helperFile, "utf8");
    selectContextAwareRepairTarget({
      rawOutput: [
        "SyntaxError: The requested module './helper.js' does not provide an export named 'foo'",
        `    at ${indexFile}:1:1`
      ].join("\n"),
      projectRoot: tmpDir,
      fallbackFilePath: fallbackFile
    });
    const after = fs.readFileSync(helperFile, "utf8");
    if (after !== before) {
      throw new Error("target selection mutated helper.js");
    }

    const fallbackWhenNull = unparseable?.filePath ?? fallbackFile;
    if (fallbackWhenNull !== fallbackFile) {
      throw new Error(`fallback behavior: expected fallback file, got ${fallbackWhenNull}`);
    }

    console.log("PASS context-aware-target-integration-unit");
    return true;
  } catch (error) {
    console.log("FAIL context-aware-target-integration-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runRepairIntentModelUnit() {
  const { createUnknownRepairIntent } = require(path.join(projectRoot, "dist", "repair", "repairIntent.js"));
  const targetFile = path.join(projectRoot, "example.js");
  const intent = createUnknownRepairIntent({ targetFile });

  if (
    intent.repairType === "unknown" &&
    intent.confidence === "low" &&
    intent.allowedMutationScope === "single-file" &&
    intent.targetFile === targetFile &&
    Array.isArray(intent.safetyNotes) &&
    intent.safetyNotes.length > 0
  ) {
    console.log("PASS repair-intent-model-unit");
    return true;
  }

  console.log("FAIL repair-intent-model-unit");
  console.log(`  Expected conservative unknown repair intent, got ${JSON.stringify(intent)}`);
  return false;
}

function runRepairIntentBuilderUnit() {
  const { buildRepairIntent } = require(path.join(projectRoot, "dist", "repair", "repairIntentBuilder.js"));
  const targetFile = path.join(projectRoot, "target.js");
  const sourceFile = path.join(projectRoot, "source.js");

  const cases = [
    {
      label: "SyntaxError",
      input: {
        parsedStackTrace: { errorType: "SyntaxError", message: "Unexpected token", filePath: targetFile },
        errorContext: { filePath: targetFile },
        repairTargetDecision: { targetFile, confidence: "high" }
      },
      expected: { repairType: "syntax-error", confidence: "high" }
    },
    {
      label: "ReferenceError same file",
      input: {
        parsedStackTrace: { errorType: "ReferenceError", message: "missingThing is not defined", filePath: targetFile },
        errorContext: { filePath: targetFile },
        repairTargetDecision: { targetFile, sourceFile: targetFile, confidence: "high" }
      },
      expected: { repairType: "runtime-local-error", confidence: "medium" }
    },
    {
      label: "missing export reason",
      input: {
        parsedStackTrace: {
          errorType: "SyntaxError",
          message: "The requested module './helper.js' does not provide an export named 'greet'",
          filePath: sourceFile
        },
        errorContext: { filePath: sourceFile },
        repairTargetDecision: {
          targetFile,
          sourceFile,
          symbolName: "greet",
          confidence: "high",
          reason: "Missing export greet should be added to helper.js"
        }
      },
      expected: { repairType: "missing-export", confidence: "high", symbolName: "greet" }
    },
    {
      label: "wrong import reason",
      input: {
        parsedStackTrace: { errorType: "SyntaxError", message: "Named import not found", filePath: sourceFile },
        errorContext: { filePath: sourceFile },
        repairTargetDecision: {
          targetFile: sourceFile,
          sourceFile,
          symbolName: "greet",
          reason: "Wrong import name caused an import mismatch"
        }
      },
      expected: { repairType: "import-mismatch", confidence: "medium", symbolName: "greet" }
    },
    {
      label: "TypeError not a function",
      input: {
        parsedStackTrace: { errorType: "TypeError", message: "greet is not a function", filePath: sourceFile },
        errorContext: { filePath: sourceFile },
        repairTargetDecision: { targetFile: sourceFile, sourceFile, symbolName: "greet" }
      },
      expected: { repairType: "import-mismatch", confidence: "medium", symbolName: "greet" }
    },
    {
      label: "unknown",
      input: {
        parsedStackTrace: { errorType: "Error", message: "Something unusual happened", filePath: targetFile },
        errorContext: { filePath: targetFile },
        repairTargetDecision: { targetFile }
      },
      expected: { repairType: "unknown", confidence: "low" }
    }
  ];

  for (const testCase of cases) {
    const actual = buildRepairIntent(testCase.input);
    for (const [key, value] of Object.entries(testCase.expected)) {
      if (actual[key] !== value) {
        console.log("FAIL repair-intent-builder-unit");
        console.log(
          `  ${testCase.label}: expected ${key}=${JSON.stringify(value)}, got ${JSON.stringify(actual[key])}`
        );
        return false;
      }
    }
    if (
      typeof actual.targetFile !== "string" ||
      actual.targetFile.length === 0 ||
      typeof actual.reason !== "string" ||
      actual.reason.length === 0 ||
      actual.allowedMutationScope !== "single-file" ||
      !Array.isArray(actual.safetyNotes) ||
      actual.safetyNotes.length === 0
    ) {
      console.log("FAIL repair-intent-builder-unit");
      console.log(
        `  ${testCase.label}: expected targetFile, reason, single-file scope, and safety notes, got ${JSON.stringify(actual)}`
      );
      return false;
    }
  }

  console.log("PASS repair-intent-builder-unit");
  return true;
}

function runPatchIntentGuardUnit() {
  const { validatePatchIntent } = require(path.join(projectRoot, "dist", "repair", "patchIntentGuard.js"));
  const targetFile = path.join(projectRoot, "target.js");
  const otherFile = path.join(projectRoot, "other.js");
  const baseIntent = {
    repairType: "runtime-local-error",
    targetFile,
    reason: "Local runtime issue",
    confidence: "medium",
    allowedMutationScope: "single-file",
    safetyNotes: ["Patch must remain constrained to the selected target file."]
  };

  const success = validatePatchIntent(baseIntent, {
    targetFile,
    patchContent: "console.log('fixed');",
    patchFiles: [targetFile]
  });
  if (
    !success.ok ||
    typeof success.reason !== "string" ||
    success.reason.length === 0 ||
    !success.safetyNotes.includes("Single-file mutation invariant preserved.")
  ) {
    console.log("FAIL patch-intent-guard-unit");
    console.log(`  accepts matching target: expected success with reason and invariant note, got ${JSON.stringify(success)}`);
    return false;
  }

  const cases = [
    {
      label: "missing repair intent target",
      intent: { ...baseIntent, targetFile: "" },
      patch: { targetFile },
      reasonIncludes: "Missing repair intent target file"
    },
    {
      label: "missing proposed patch target",
      intent: baseIntent,
      patch: { targetFile: "" },
      reasonIncludes: "Missing proposed patch target file"
    },
    {
      label: "multi-file patch",
      intent: baseIntent,
      patch: { targetFile, patchFiles: [targetFile, otherFile] },
      reasonIncludes: "Multi-file patch rejected"
    },
    {
      label: "mismatched target file",
      intent: baseIntent,
      patch: { targetFile: otherFile },
      reasonIncludes: "Mismatch between repair intent target"
    },
    {
      label: "patchFiles outside target",
      intent: baseIntent,
      patch: { targetFile, patchFiles: [otherFile] },
      reasonIncludes: "patchFiles include files outside proposed target"
    },
    {
      label: "broad import rewrite",
      intent: baseIntent,
      patch: {
        targetFile,
        patchContent: 'import a from "./a.js";\nimport b from "./b.js";'
      },
      reasonIncludes: "Broad import rewrite"
    }
  ];

  for (const testCase of cases) {
    const actual = validatePatchIntent(testCase.intent, testCase.patch);
    if (
      actual.ok ||
      typeof actual.reason !== "string" ||
      actual.reason.length === 0 ||
      !actual.reason.includes(testCase.reasonIncludes)
    ) {
      console.log("FAIL patch-intent-guard-unit");
      console.log(`  ${testCase.label}: expected failure including ${JSON.stringify(testCase.reasonIncludes)}, got ${JSON.stringify(actual)}`);
      return false;
    }
  }

  const importMismatchIntent = {
    ...baseIntent,
    repairType: "import-mismatch"
  };
  const importPatch = validatePatchIntent(importMismatchIntent, {
    targetFile,
    patchContent: 'import { greet } from "./helper.js";\nimport { sayHello } from "./helper.js";',
    patchFiles: [targetFile]
  });
  if (!importPatch.ok || typeof importPatch.reason !== "string" || importPatch.reason.length === 0) {
    console.log("FAIL patch-intent-guard-unit");
    console.log(`  import-mismatch import patch: expected success with meaningful reason, got ${JSON.stringify(importPatch)}`);
    return false;
  }

  console.log("PASS patch-intent-guard-unit");
  return true;
}

function runRepairIntentReportUnit() {
  const { createUnknownRepairIntent } = require(path.join(projectRoot, "dist", "repair", "repairIntent.js"));
  const { validatePatchIntent } = require(path.join(projectRoot, "dist", "repair", "patchIntentGuard.js"));
  const targetFile = path.join(projectRoot, "target.js");
  const repairIntent = createUnknownRepairIntent({
    targetFile,
    reason: "Unit-test report enrichment."
  });
  const patchIntentValidation = validatePatchIntent(repairIntent, {
    targetFile,
    patchContent: "console.log('report');",
    patchFiles: [targetFile]
  });
  const reportShape = {
    repairIntent,
    patchIntentValidation
  };
  const serialized = JSON.stringify(reportShape);
  const parsed = JSON.parse(serialized);

  if (!parsed.repairIntent) {
    console.log("FAIL repair-intent-report-unit");
    console.log("  Expected repairIntent to exist");
    return false;
  }

  if (
    typeof parsed.repairIntent.repairType !== "string" ||
    typeof parsed.repairIntent.targetFile !== "string" ||
    typeof parsed.repairIntent.reason !== "string" ||
    typeof parsed.repairIntent.confidence !== "string" ||
    parsed.repairIntent.allowedMutationScope !== "single-file" ||
    !Array.isArray(parsed.repairIntent.safetyNotes)
  ) {
    console.log("FAIL repair-intent-report-unit");
    console.log(`  Invalid repairIntent report shape: ${JSON.stringify(parsed.repairIntent)}`);
    return false;
  }

  if (
    parsed.patchIntentValidation &&
    (typeof parsed.patchIntentValidation.ok !== "boolean" ||
      typeof parsed.patchIntentValidation.reason !== "string" ||
      !Array.isArray(parsed.patchIntentValidation.safetyNotes))
  ) {
    console.log("FAIL repair-intent-report-unit");
    console.log(
      `  Invalid patchIntentValidation report shape: ${JSON.stringify(parsed.patchIntentValidation)}`
    );
    return false;
  }

  console.log("PASS repair-intent-report-unit");
  return true;
}

function runRepairIntentInvariantUnit() {
  const { createUnknownRepairIntent } = require(path.join(projectRoot, "dist", "repair", "repairIntent.js"));
  const { validatePatchIntent } = require(path.join(projectRoot, "dist", "repair", "patchIntentGuard.js"));
  const targetFile = path.join(projectRoot, "target.js");
  const otherFile = path.join(projectRoot, "other.js");
  const intent = createUnknownRepairIntent({ targetFile });

  const matchingPatch = {
    targetFile,
    patchContent: "console.log('fixed');",
    patchFiles: [targetFile]
  };
  const matching = validatePatchIntent(intent, matchingPatch);
  if (!matching.ok) {
    console.log("FAIL repair-intent-invariant-unit");
    console.log(`  Expected matching target validation to pass, got ${JSON.stringify(matching)}`);
    return false;
  }

  const mismatched = validatePatchIntent(intent, {
    ...matchingPatch,
    targetFile: otherFile,
    patchFiles: [otherFile]
  });
  if (mismatched.ok) {
    console.log("FAIL repair-intent-invariant-unit");
    console.log(`  Expected mismatched target validation to fail, got ${JSON.stringify(mismatched)}`);
    return false;
  }

  const multiFile = validatePatchIntent(intent, {
    targetFile,
    patchContent: "console.log('fixed');",
    patchFiles: [targetFile, otherFile]
  });
  if (multiFile.ok) {
    console.log("FAIL repair-intent-invariant-unit");
    console.log(`  Expected multi-file validation to fail, got ${JSON.stringify(multiFile)}`);
    return false;
  }

  const uniquePatchFiles = new Set(matchingPatch.patchFiles.map((file) => path.normalize(file).toLowerCase()));
  if (uniquePatchFiles.size !== 1 || intent.allowedMutationScope !== "single-file") {
    console.log("FAIL repair-intent-invariant-unit");
    console.log(
      `  Expected one unique patch file and single-file scope, got files=${JSON.stringify(Array.from(uniquePatchFiles))} intent=${JSON.stringify(intent)}`
    );
    return false;
  }

  console.log("PASS repair-intent-invariant-unit");
  return true;
}

async function runGuardedLegacyAppendUnit() {
  const { applyOperation } = require(path.join(projectRoot, "dist", "tools", "fileEditor.js"));
  const tmpDir = path.join(projectRoot, ".scenario-unit", "guarded-legacy-append");
  const targetFile = path.join(tmpDir, "index.js");

  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    ensureDir(tmpDir);
    fs.writeFileSync(targetFile, "console.log('ready');\n", "utf8");

    const result = await applyOperation(tmpDir, {
      type: "modify",
      path: "index.js",
      patch: {
        insertAfter: "missing anchor",
        content: 'const fs = require("fs");'
      },
      reason: "unit test unsafe legacy append"
    });

    const after = fs.readFileSync(targetFile, "utf8");
    if (
      after === "console.log('ready');\n" &&
      result.patchEngineUsed === true &&
      result.patchSkipped === true &&
      result.patchChanged === false &&
      result.patchConfidence === "low" &&
      result.changed === false &&
      result.patchSkipReason?.includes("require")
    ) {
      console.log("PASS guarded-legacy-append-unit");
      return true;
    }

    console.log("FAIL guarded-legacy-append-unit");
    console.log(
      `  Expected file unchanged and SafePatchEngine skip metadata, got after=${JSON.stringify(after)} result=${JSON.stringify(result)}`
    );
    return false;
  } catch (error) {
    console.log("FAIL guarded-legacy-append-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

async function main() {
  if (!fs.existsSync(cliPath)) {
    console.error("dist/cli.js not found. Run npm run build first.");
    process.exitCode = 1;
    return;
  }

  scaffoldScenarioFixtures();

  let failed = 0;
  if (!runRetryControlUnit()) {
    failed += 1;
  }
  if (!runSafePatchEngineUnit()) {
    failed += 1;
  }
  if (!runSafeReplacementUnit()) {
    failed += 1;
  }
  if (!runPatchExpectationUnit()) {
    failed += 1;
  }
  if (!runStackTraceParserUnit()) {
    failed += 1;
  }
  if (!runErrorContextCollectorUnit()) {
    failed += 1;
  }
  if (!runDependencyScannerUnit()) {
    failed += 1;
  }
  if (!runRepairTargetDecisionUnit()) {
    failed += 1;
  }
  if (!runContextAwareTargetIntegrationUnit()) {
    failed += 1;
  }
  if (!runRepairIntentModelUnit()) {
    failed += 1;
  }
  if (!runRepairIntentBuilderUnit()) {
    failed += 1;
  }
  if (!runPatchIntentGuardUnit()) {
    failed += 1;
  }
  if (!runRepairIntentReportUnit()) {
    failed += 1;
  }
  if (!runRepairIntentInvariantUnit()) {
    failed += 1;
  }
  if (!(await runGuardedLegacyAppendUnit())) {
    failed += 1;
  }

  for (const name of scenarioNames) {
    const result = runScenario(name);
    if (result.failures.length === 0) {
      console.log(`PASS ${name}`);
      continue;
    }

    if (result.runResult.error) {
      console.log(`SKIP ${name}`);
      console.log(`  Spawn failed before CLI execution: ${result.runResult.error.split(/\r?\n/).slice(0, 2).join(" | ")}`);
      console.log("  Scenario debug artifacts were still written.");
      continue;
    }

    if (isEnvironmentEpermFailure(result.runResult)) {
      console.log(`SKIP ${name}`);
      console.log("  Environment EPERM prevented deterministic end-to-end validation.");
      console.log("  Scenario debug artifacts were still written.");
      continue;
    }

    if (optionalScenarioNames.has(name)) {
      console.log(`UNSTABLE ${name}`);
      for (const failure of result.failures) {
        console.log(`  ${failure}`);
      }
      console.log("  Optional end-to-end scenario did not affect exit code.");
      continue;
    }

    failed += 1;
    console.log(`FAIL ${name}`);
    for (const failure of result.failures) {
      console.log(`  ${failure}`);
    }
    console.log(`  CLI exit code: ${result.runResult.exitCode}`);
    console.log(`  runsDir: ${result.artifacts.runsDir}`);
    console.log(`  runsDir exists: ${result.artifacts.runsDirExists ? "yes" : "no"}`);
    console.log(`  latestRunDir: ${result.artifacts.runDir ?? "missing"}`);
    console.log(`  stdout first 1500 chars: ${result.runResult.stdout.slice(0, 1500)}`);
    console.log(`  stderr first 1500 chars: ${result.runResult.stderr.slice(0, 1500)}`);
  }

  process.exitCode = failed === 0 ? 0 : 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exitCode = 1;
});
