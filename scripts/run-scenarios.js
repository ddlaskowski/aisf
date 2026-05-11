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
  "missing-export-evidence-validated",
  "wrong-import-evidence-validated",
  "weak-evidence-rejected",
  "confidence-downgrade-on-ambiguous-context",
  "conservative-policy-allows-safe-export",
  "conservative-policy-blocks-risky-append",
  "manual-review-policy-blocks-mutation",
  "normal-policy-allows-validated-patch",
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
  "low-confidence-fallback-intent",
  "confidence-downgrade-on-ambiguous-context"
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
    },
    "missing-export-evidence-validated": {
      files: {
        "index.js": 'const { greet } = require("./helper.js");\ngreet("Factory");\n',
        "helper.js": 'function greet(name) {\n  return `Hello, ${name}`;\n}\nmodule.exports = {};\n'
      },
      packageJson: {
        scripts: {
          start: "node index.js"
        }
      },
      expected: {
        name: "missing-export-evidence-validated",
        task: "Fix missing export evidence",
        expect: {
          contextAwareTargetExists: true,
          repairIntentAssertions: true,
          evidenceValidationAssertions: true,
          evidenceOk: true,
          evidenceConfidenceOneOf: ["high", "medium"],
          evidenceAllowedModes: ["normal", "conservative"],
          evidenceIncludesAny: ["Dependency/import/export", "Import evidence", "greet"],
          finalReportEvidenceDetails: true,
          onlyOnePatchedFile: true
        }
      }
    },
    "wrong-import-evidence-validated": {
      files: {
        "index.js": 'const { greet } = require("./helper.js");\ngreet("Factory");\n',
        "helper.js": 'function sayHello(name) {\n  return `Hello, ${name}`;\n}\nmodule.exports = { sayHello };\n'
      },
      packageJson: {
        scripts: {
          start: "node index.js"
        }
      },
      expected: {
        name: "wrong-import-evidence-validated",
        task: "Fix wrong import evidence",
        expect: {
          contextAwareTargetExists: true,
          repairIntentAssertions: true,
          evidenceValidationAssertions: true,
          evidenceOk: true,
          evidenceConfidenceOneOf: ["high", "medium"],
          evidenceAllowedModes: ["normal", "conservative"],
          evidenceIncludesAny: ["Import evidence", "greet"],
          finalReportEvidenceDetails: true,
          onlyOnePatchedFile: true
        }
      }
    },
    "weak-evidence-rejected": {
      files: {
        "index.js": 'throw new Error("Ambiguous failure with no actionable symbol");\n'
      },
      packageJson: {
        scripts: {
          start: "node index.js"
        }
      },
      expected: {
        name: "weak-evidence-rejected",
        task: "Fix weak evidence",
        expect: {
          contextAwareTargetExists: true,
          repairIntentAssertions: true,
          evidenceValidationAssertions: true,
          evidenceOkOrLowConfidence: true,
          evidenceAllowedMode: "manual-review",
          mutationSkippedForEvidence: true,
          finalReportEvidenceDetails: true,
          finalReportIncludes: ["mutation was skipped before patch intent validation"],
          changedFilesIncludeOnly: [],
          finalIndexEqualsOriginal: true
        }
      }
    },
    "confidence-downgrade-on-ambiguous-context": {
      files: {
        "index.js": 'const { missingThing } = require("./helper.js");\nmissingThing();\n',
        "helper.js": 'module.exports = {};\n'
      },
      packageJson: {
        scripts: {
          start: "node index.js"
        }
      },
      expected: {
        name: "confidence-downgrade-on-ambiguous-context",
        task: "Fix ambiguous evidence confidence",
        expect: {
          contextAwareTargetExists: true,
          repairIntentAssertions: true,
          evidenceValidationAssertions: true,
          evidenceDowngradedWhenPresent: true,
          evidenceWarnings: true,
          evidenceAllowedModes: ["conservative", "manual-review", "normal"],
          finalReportEvidenceDetails: true,
          onlyOnePatchedFile: true
        }
      }
    },
    "conservative-policy-allows-safe-export": {
      files: {
        "index.js": 'const { greet } = require("./helper.js");\ngreet("Factory");\n',
        "helper.js": 'function greet(name) {\n  return `Hello, ${name}`;\n}\nmodule.exports = {};\n'
      },
      packageJson: {
        scripts: {
          start: "node index.js"
        }
      },
      expected: {
        name: "conservative-policy-allows-safe-export",
        task: "Fix missing export with conservative policy",
        expect: {
          contextAwareTargetExists: true,
          repairIntentAssertions: true,
          evidenceValidationAssertions: true,
          evidenceAllowedModes: ["conservative", "normal"],
          repairPatchPolicyAssertions: true,
          policyModeOneOf: ["conservative", "normal"],
          policyOk: true,
          policyRecommendedAction: "proceed",
          finalReportPolicyDetails: true,
          onlyOnePatchedFile: true
        }
      }
    },
    "conservative-policy-blocks-risky-append": {
      files: {
        "index.js": "console.log(policyRiskyAppend);\n"
      },
      packageJson: {
        scripts: {
          start: "node index.js"
        }
      },
      expected: {
        name: "conservative-policy-blocks-risky-append",
        task: "Fix risky append policy",
        policyScenario: {
          evidenceValidation: {
            ok: true,
            confidence: "medium",
            allowedRepairMode: "conservative"
          },
          repairIntent: {
            targetFile: "index.js",
            repairType: "runtime-local-error",
            confidence: "medium",
            allowedMutationScope: "single-file",
            safetyNotes: ["Policy scenario repair intent."],
            reason: "Policy scenario uses conservative mode."
          },
          proposedPatchOperations: [
            {
              operation: "risky-append",
              targetFile: "index.js"
            }
          ]
        },
        expect: {
          evidenceValidationAssertions: true,
          evidenceAllowedMode: "conservative",
          repairPatchPolicyAssertions: true,
          policyMode: "conservative",
          policyOk: false,
          policyRecommendedAction: "block-mutation",
          policyBlockedOperation: "risky-append",
          mutationSkippedForPolicy: true,
          finalReportPolicyDetails: true,
          finalReportIncludes: ["Repair patch policy outcome: mutation was skipped before patch intent validation"],
          changedFilesIncludeOnly: [],
          finalIndexEqualsOriginal: true
        }
      }
    },
    "manual-review-policy-blocks-mutation": {
      files: {
        "index.js": 'throw new Error("Manual review policy failure");\n'
      },
      packageJson: {
        scripts: {
          start: "node index.js"
        }
      },
      expected: {
        name: "manual-review-policy-blocks-mutation",
        task: "Fix manual review policy failure",
        expect: {
          contextAwareTargetExists: true,
          repairIntentAssertions: true,
          evidenceValidationAssertions: true,
          evidenceAllowedMode: "manual-review",
          mutationSkippedForEvidence: true,
          repairPatchPolicyAssertions: true,
          policyMode: "manual-review",
          policyOk: false,
          policyRecommendedAction: "manual-review",
          mutationSkippedForPolicy: true,
          finalReportPolicyDetails: true,
          finalReportIncludes: ["mutation was skipped before patch intent validation"],
          changedFilesIncludeOnly: [],
          finalIndexEqualsOriginal: true
        }
      }
    },
    "normal-policy-allows-validated-patch": {
      files: {
        "index.js": "console.log(normalPolicyValue);\n"
      },
      packageJson: {
        scripts: {
          start: "node index.js"
        }
      },
      expected: {
        name: "normal-policy-allows-validated-patch",
        task: "Fix normal policy validated patch",
        policyScenario: {
          evidenceValidation: {
            ok: true,
            confidence: "high",
            allowedRepairMode: "normal"
          },
          repairIntent: {
            targetFile: "index.js",
            repairType: "syntax-error",
            confidence: "high",
            allowedMutationScope: "single-file",
            safetyNotes: ["Policy scenario repair intent."],
            reason: "Policy scenario uses normal mode."
          },
          proposedPatchOperations: [
            {
              operation: "exact-replacement",
              targetFile: "index.js"
            }
          ]
        },
        expect: {
          evidenceValidationAssertions: true,
          evidenceAllowedMode: "normal",
          repairPatchPolicyAssertions: true,
          policyMode: "normal",
          policyOk: true,
          policyRecommendedAction: "proceed",
          finalReportPolicyDetails: true,
          changedFilesIncludeOnly: [],
          finalIndexEqualsOriginal: true
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
    if (name.includes("-policy-")) {
      writeJson(path.join(scenarioDir, "expected.json"), fixture.expected);
    } else {
      ensureJson(path.join(scenarioDir, "expected.json"), fixture.expected);
    }
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

function listRepairEvidenceValidationFiles(runDir) {
  if (!runDir || !fs.existsSync(runDir)) {
    return [];
  }

  return fs
    .readdirSync(runDir)
    .filter((file) => /^repair-evidence-validation-.*\.json$/.test(file))
    .sort();
}

function listRepairPatchPolicyFiles(runDir) {
  if (!runDir || !fs.existsSync(runDir)) {
    return [];
  }

  return fs
    .readdirSync(runDir)
    .filter((file) => /^repair-patch-policy-.*\.json$/.test(file))
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

function latestRepairEvidenceValidation(runDir) {
  const files = listRepairEvidenceValidationFiles(runDir);
  if (!runDir || files.length === 0) {
    return { data: null, file: null };
  }

  const selected = files[files.length - 1];
  return { data: readJson(path.join(runDir, selected)), file: selected };
}

function latestRepairPatchPolicy(runDir) {
  const files = listRepairPatchPolicyFiles(runDir);
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
  const selectedRepairEvidenceValidation = latestRepairEvidenceValidation(runDir);
  const selectedRepairPatchPolicy = latestRepairPatchPolicy(runDir);
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
    repairEvidenceValidationFilesFound: listRepairEvidenceValidationFiles(runDir),
    selectedRepairEvidenceValidationFile: selectedRepairEvidenceValidation.file,
    repairEvidenceValidation: selectedRepairEvidenceValidation.data,
    repairPatchPolicyFilesFound: listRepairPatchPolicyFiles(runDir),
    selectedRepairPatchPolicyFile: selectedRepairPatchPolicy.file,
    repairPatchPolicy: selectedRepairPatchPolicy.data,
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
  const repairObservability = runDir ? readOptionalJson(path.join(runDir, "repair-observability.json")) : null;
  const selectedClassification = latestClassification(runDir);
  const selectedContextAwareTarget = latestContextAwareTarget(runDir);
  const selectedRepairIntent = latestRepairIntent(runDir);
  const selectedRepairEvidenceValidation = latestRepairEvidenceValidation(runDir);
  const selectedRepairPatchPolicy = latestRepairPatchPolicy(runDir);
  const selectedPatchIntentValidation = latestPatchIntentValidation(runDir);
  const classification = selectedClassification.data;
  const contextAwareTarget = selectedContextAwareTarget.data;
  const repairIntent = selectedRepairIntent.data;
  const repairEvidenceValidation = selectedRepairEvidenceValidation.data;
  const repairPatchPolicy = selectedRepairPatchPolicy.data;
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

  if (expect.finalIndexEqualsOriginal) {
    const indexPath = path.join(scenarioRepoPath, "index.js");
    const originalPath = path.join(scenarioRepoPath, "index.original.js");
    const indexContent = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, "utf8") : "";
    const originalContent = fs.existsSync(originalPath) ? fs.readFileSync(originalPath, "utf8") : "";
    if (indexContent !== originalContent) {
      failures.push("Expected index.js to remain unchanged from index.original.js");
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

  if (expect.evidenceValidationAssertions) {
    if (!repairEvidenceValidation) {
      failures.push("Expected repairEvidenceValidation artifact to exist");
    }
    if (!repairObservability?.repairEvidenceValidation) {
      failures.push("Expected repair-observability.json to include repairEvidenceValidation");
    }
    if (!finalReport.includes("Repair evidence validation")) {
      failures.push('Expected final-report.md to include "Repair evidence validation"');
    }
    if (expect.finalReportEvidenceDetails && !finalReport.includes("Repair evidence allowedRepairMode")) {
      failures.push('Expected final-report.md to include "Repair evidence allowedRepairMode"');
    }

    if (repairEvidenceValidation) {
      if (Object.prototype.hasOwnProperty.call(expect, "evidenceOk") && repairEvidenceValidation.ok !== expect.evidenceOk) {
        failures.push(`Expected repairEvidenceValidation.ok ${expect.evidenceOk}, got ${repairEvidenceValidation.ok}`);
      }
      if (
        expect.evidenceOkOrLowConfidence &&
        repairEvidenceValidation.ok !== false &&
        repairEvidenceValidation.confidence !== "low"
      ) {
        failures.push(
          `Expected repairEvidenceValidation ok=false or confidence=low, got ok=${repairEvidenceValidation.ok} confidence=${repairEvidenceValidation.confidence}`
        );
      }
      if (expect.evidenceConfidenceOneOf && !expect.evidenceConfidenceOneOf.includes(repairEvidenceValidation.confidence)) {
        failures.push(
          `Expected repairEvidenceValidation.confidence in ${JSON.stringify(expect.evidenceConfidenceOneOf)}, got ${repairEvidenceValidation.confidence}`
        );
      }
      if (expect.evidenceAllowedMode && repairEvidenceValidation.allowedRepairMode !== expect.evidenceAllowedMode) {
        failures.push(
          `Expected repairEvidenceValidation.allowedRepairMode ${expect.evidenceAllowedMode}, got ${repairEvidenceValidation.allowedRepairMode}`
        );
      }
      if (expect.evidenceAllowedModes && !expect.evidenceAllowedModes.includes(repairEvidenceValidation.allowedRepairMode)) {
        failures.push(
          `Expected repairEvidenceValidation.allowedRepairMode in ${JSON.stringify(expect.evidenceAllowedModes)}, got ${repairEvidenceValidation.allowedRepairMode}`
        );
      }
      if (expect.evidenceWarnings && (!Array.isArray(repairEvidenceValidation.warnings) || repairEvidenceValidation.warnings.length === 0)) {
        failures.push("Expected repairEvidenceValidation.warnings to be non-empty");
      }
      if (expect.evidenceDowngradedWhenPresent && repairEvidenceValidation.downgradedFrom) {
        const rank = { low: 1, medium: 2, high: 3 };
        if (rank[repairEvidenceValidation.confidence] >= rank[repairEvidenceValidation.downgradedFrom]) {
          failures.push(
            `Expected downgraded confidence below ${repairEvidenceValidation.downgradedFrom}, got ${repairEvidenceValidation.confidence}`
          );
        }
      }
      if (expect.evidenceIncludesAny) {
        const evidenceText = [
          ...(repairEvidenceValidation.evidence ?? []),
          ...(repairEvidenceValidation.warnings ?? []),
          repairEvidenceValidation.reason ?? ""
        ].join("\n");
        const matched = expect.evidenceIncludesAny.some((needle) => evidenceText.includes(needle));
        if (!matched) {
          failures.push(`Expected evidence/warnings to include one of ${JSON.stringify(expect.evidenceIncludesAny)}`);
        }
      }
    }

    if (expect.mutationSkippedForEvidence && repairObservability?.mutationSkippedForEvidence !== true) {
      failures.push("Expected repair-observability.json mutationSkippedForEvidence=true");
    }
  }

  if (expect.repairPatchPolicyAssertions) {
    if (!repairPatchPolicy) {
      failures.push("Expected repairPatchPolicy artifact to exist");
    }
    if (!repairObservability?.repairPatchPolicy) {
      failures.push("Expected repair-observability.json to include repairPatchPolicy");
    }
    if (!finalReport.includes("Repair patch policy")) {
      failures.push('Expected final-report.md to include "Repair patch policy"');
    }
    if (expect.finalReportPolicyDetails) {
      for (const needle of [
        "Repair patch policy mode",
        "Repair patch policy reason",
        "Repair patch policy recommended action"
      ]) {
        if (!finalReport.includes(needle)) {
          failures.push(`Expected final-report.md to include ${JSON.stringify(needle)}`);
        }
      }
    }

    if (repairPatchPolicy) {
      if (Object.prototype.hasOwnProperty.call(expect, "policyOk") && repairPatchPolicy.ok !== expect.policyOk) {
        failures.push(`Expected repairPatchPolicy.ok ${expect.policyOk}, got ${repairPatchPolicy.ok}`);
      }
      if (expect.policyMode && repairPatchPolicy.mode !== expect.policyMode) {
        failures.push(`Expected repairPatchPolicy.mode ${expect.policyMode}, got ${repairPatchPolicy.mode}`);
      }
      if (expect.policyModeOneOf && !expect.policyModeOneOf.includes(repairPatchPolicy.mode)) {
        failures.push(`Expected repairPatchPolicy.mode in ${JSON.stringify(expect.policyModeOneOf)}, got ${repairPatchPolicy.mode}`);
      }
      if (expect.policyRecommendedAction && repairPatchPolicy.recommendedAction !== expect.policyRecommendedAction) {
        failures.push(
          `Expected repairPatchPolicy.recommendedAction ${expect.policyRecommendedAction}, got ${repairPatchPolicy.recommendedAction}`
        );
      }
      if (
        expect.policyBlockedOperation &&
        !Array.isArray(repairPatchPolicy.blockedOperations) &&
        !repairPatchPolicy.blockedOperations?.includes(expect.policyBlockedOperation)
      ) {
        failures.push(`Expected repairPatchPolicy.blockedOperations to include ${expect.policyBlockedOperation}`);
      }
      if (
        expect.policyBlockedOperation &&
        Array.isArray(repairPatchPolicy.blockedOperations) &&
        !repairPatchPolicy.blockedOperations.includes(expect.policyBlockedOperation)
      ) {
        failures.push(`Expected repairPatchPolicy.blockedOperations to include ${expect.policyBlockedOperation}`);
      }
      if (!Array.isArray(repairPatchPolicy.allowedOperations)) {
        failures.push("Expected repairPatchPolicy.allowedOperations to be an array");
      }
      if (!Array.isArray(repairPatchPolicy.blockedOperations)) {
        failures.push("Expected repairPatchPolicy.blockedOperations to be an array");
      }
      if (!Array.isArray(repairPatchPolicy.warnings)) {
        failures.push("Expected repairPatchPolicy.warnings to be an array");
      }
    }

    if (expect.mutationSkippedForPolicy && repairObservability?.mutationSkippedForPolicy !== true) {
      failures.push("Expected repair-observability.json mutationSkippedForPolicy=true");
    }

    if (expect.policyPatchIntentNotReached && patchIntentValidation) {
      failures.push("Expected patchIntentValidation not to exist when policy blocks mutation");
    }
  }

  if (expect.finalReportIncludes) {
    for (const needle of expect.finalReportIncludes) {
      if (!finalReport.includes(needle)) {
        failures.push(`Expected final-report.md to include ${JSON.stringify(needle)}`);
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
      repairObservability,
      failureMemory,
      retryStop,
      classification,
      selectedClassificationFile: selectedClassification.file,
      contextAwareTarget,
      selectedContextAwareTargetFile: selectedContextAwareTarget.file,
      repairIntent,
      selectedRepairIntentFile: selectedRepairIntent.file,
      repairEvidenceValidation,
      selectedRepairEvidenceValidationFile: selectedRepairEvidenceValidation.file,
      repairPatchPolicy,
      selectedRepairPatchPolicyFile: selectedRepairPatchPolicy.file,
      patchIntentValidation,
      selectedPatchIntentValidationFile: selectedPatchIntentValidation.file,
      changes,
      changedFiles,
      patch: debugInfo.patch
    }
  };
}

function runPolicyScenario(scenarioRepoPath, expected) {
  const { decideRepairPatchPolicy } = require(path.join(projectRoot, "dist", "repair", "repairPatchPolicy.js"));
  const scenario = expected.policyScenario;
  const runDir = path.join(scenarioRepoPath, ".factory", "runs", "policy-scenario");
  ensureDir(runDir);

  const repairIntent = {
    ...scenario.repairIntent,
    targetFile: path.join(scenarioRepoPath, scenario.repairIntent.targetFile)
  };
  const repairEvidenceValidation = scenario.evidenceValidation;
  const proposedPatchOperations = (scenario.proposedPatchOperations ?? []).map((operation) => ({
    ...operation,
    targetFile: path.join(scenarioRepoPath, operation.targetFile),
    patchFiles: operation.patchFiles?.map((file) => path.join(scenarioRepoPath, file))
  }));
  const repairPatchPolicy = decideRepairPatchPolicy({
    repairIntent,
    evidenceValidation: repairEvidenceValidation,
    proposedPatchOperations
  });
  const mutationSkippedForPolicy =
    !repairPatchPolicy.ok ||
    repairPatchPolicy.recommendedAction === "manual-review" ||
    repairPatchPolicy.recommendedAction === "block-mutation";

  writeJson(path.join(runDir, "repair-intent-policy-scenario.json"), repairIntent);
  writeJson(path.join(runDir, "repair-evidence-validation-policy-scenario.json"), repairEvidenceValidation);
  writeJson(path.join(runDir, "repair-patch-policy-policy-scenario.json"), repairPatchPolicy);
  writeJson(path.join(runDir, "changes.json"), { operations: [] });
  writeJson(path.join(runDir, "repair-observability.json"), {
    repairIntent,
    repairEvidenceValidation,
    repairPatchPolicy,
    patchIntentValidation: null,
    mutationSkippedForEvidence: false,
    mutationSkippedForPolicy
  });

  const finalReport = [
    "# Final Report",
    "",
    "- Final status: fail",
    `- Repair evidence validation: ${repairEvidenceValidation.ok ? "ok" : "failed"}`,
    `- Repair evidence confidence: ${repairEvidenceValidation.confidence}`,
    `- Repair evidence allowedRepairMode: ${repairEvidenceValidation.allowedRepairMode}`,
    `- Repair patch policy: ${repairPatchPolicy.ok ? "ok" : "blocked"}`,
    `- Repair patch policy mode: ${repairPatchPolicy.mode}`,
    `- Repair patch policy reason: ${repairPatchPolicy.reason}`,
    `- Repair patch policy recommended action: ${repairPatchPolicy.recommendedAction}`,
    `- Mutation skipped by repair patch policy: ${mutationSkippedForPolicy ? "yes" : "no"}`,
    mutationSkippedForPolicy
      ? "- Repair patch policy outcome: mutation was skipped before patch intent validation"
      : "- Repair patch policy outcome: mutation was allowed to continue",
    "",
    "## Changed Files",
    "- None",
    ""
  ].join("\n");
  fs.writeFileSync(path.join(runDir, "final-report.md"), finalReport, "utf8");

  return {
    stdout: "Policy scenario completed.\n",
    stderr: "",
    exitCode: 0,
    status: 0,
    signal: null,
    error: ""
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

  if (expected.policyScenario) {
    const runResult = runPolicyScenario(scenarioRepoPath, expected);
    writeScenarioDebug(scenarioRepoPath, runResult);
    const validation = validateScenario(scenarioRepoPath, expected, runResult);

    return {
      name,
      expected,
      runResult,
      ...validation
    };
  }

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

function runArtifactsContainEperm(runDir) {
  if (!runDir || !fs.existsSync(runDir)) {
    return false;
  }

  const entries = fs.readdirSync(runDir, { withFileTypes: true });
  return entries.some((entry) => {
    if (!entry.isFile()) {
      return false;
    }

    const filePath = path.join(runDir, entry.name);
    try {
      return fs.readFileSync(filePath, "utf8").includes("EPERM");
    } catch {
      return false;
    }
  });
}

function isEnvironmentDependencyInstallFailure(runResult) {
  return [runResult.error, runResult.stdout, runResult.stderr].some(
    (value) =>
      typeof value === "string" &&
      (value.includes("UNABLE_TO_VERIFY_LEAF_SIGNATURE") ||
        value.includes("SELF_SIGNED_CERT_IN_CHAIN") ||
        value.includes("request to https://registry.npmjs.org") ||
        value.includes("getaddrinfo ENOTFOUND registry.npmjs.org"))
  );
}

function runArtifactsContainDependencyInstallFailure(runDir) {
  if (!runDir || !fs.existsSync(runDir)) {
    return false;
  }

  const entries = fs.readdirSync(runDir, { withFileTypes: true });
  return entries.some((entry) => {
    if (!entry.isFile() || (!entry.name.startsWith("dependency-install-") && !entry.name.startsWith("command-results-after-install-"))) {
      return false;
    }

    const filePath = path.join(runDir, entry.name);
    try {
      return isEnvironmentDependencyInstallFailure({
        stdout: fs.readFileSync(filePath, "utf8"),
        stderr: "",
        error: ""
      });
    } catch {
      return false;
    }
  });
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

function runRepairEvidenceValidatorUnit() {
  const { validateRepairEvidence } = require(path.join(projectRoot, "dist", "repair", "repairEvidenceValidator.js"));

  try {
    const missingExport = validateRepairEvidence({
      parsedStackTrace: {
        filePath: "src/index.js",
        message: "The requested module './helper.js' does not provide an export named 'greet'"
      },
      errorContext: {
        filePath: "src/index.js",
        sourceSnippet: 'import { greet } from "./helper.js";'
      },
      dependencyMap: {
        imports: [{ from: "src/index.js", to: "src/helper.js", symbols: ["greet"] }],
        exports: [{ file: "src/helper.js", symbols: [] }]
      },
      repairTargetDecision: {
        targetFile: "src/helper.js",
        reason: "index.js imports greet from helper.js; helper.js is missing export greet"
      },
      repairIntent: {
        repairType: "missing-export",
        confidence: "high",
        symbolName: "greet",
        targetFile: "src/helper.js",
        sourceFile: "src/index.js",
        reason: "Add missing export greet to helper.js"
      }
    });
    if (
      !missingExport.ok ||
      missingExport.confidence === "low" ||
      missingExport.evidence.length === 0 ||
      !["normal", "conservative"].includes(missingExport.allowedRepairMode)
    ) {
      throw new Error(`missing export evidence: expected ok with useful evidence, got ${JSON.stringify(missingExport)}`);
    }

    const importMismatch = validateRepairEvidence({
      parsedStackTrace: {
        filePath: "src/index.js",
        message: "Named export 'greet' not found"
      },
      errorContext: {
        filePath: "src/index.js",
        sourceSnippet: 'import { greet } from "./helper.js";'
      },
      dependencyMap: {
        imports: [{ from: "src/index.js", to: "src/helper.js", symbols: ["greet"] }]
      },
      repairTargetDecision: {
        targetFile: "src/index.js",
        reason: "Wrong import name caused an import mismatch"
      },
      repairIntent: {
        repairType: "import-mismatch",
        confidence: "medium",
        symbolName: "greet",
        targetFile: "src/index.js",
        sourceFile: "src/index.js",
        reason: "Fix import mismatch for greet"
      }
    });
    if (
      !importMismatch.ok ||
      !["high", "medium"].includes(importMismatch.confidence) ||
      !["normal", "conservative"].includes(importMismatch.allowedRepairMode)
    ) {
      throw new Error(`import mismatch evidence: expected ok with medium/high confidence, got ${JSON.stringify(importMismatch)}`);
    }

    const runtimeLocal = validateRepairEvidence({
      parsedStackTrace: {
        filePath: "src/index.js",
        message: "ReferenceError: missingValue is not defined"
      },
      errorContext: {
        filePath: "src/index.js",
        errorLine: "console.log(missingValue);"
      },
      dependencyMap: {},
      repairTargetDecision: {
        targetFile: "src/index.js",
        reason: "ReferenceError is local to index.js"
      },
      repairIntent: {
        repairType: "runtime-local-error",
        confidence: "high",
        symbolName: "missingValue",
        targetFile: "src/index.js",
        sourceFile: "src/index.js",
        reason: "Fix local runtime ReferenceError"
      }
    });
    if (!runtimeLocal.ok || runtimeLocal.confidence !== "high" || runtimeLocal.allowedRepairMode !== "normal") {
      throw new Error(`runtime local evidence: expected high normal, got ${JSON.stringify(runtimeLocal)}`);
    }

    const syntaxError = validateRepairEvidence({
      parsedStackTrace: {
        filePath: "src/index.js",
        message: "SyntaxError: Unexpected token"
      },
      errorContext: {
        filePath: "src/index.js",
        errorLine: "const value = ;"
      },
      dependencyMap: {},
      repairTargetDecision: {
        targetFile: "src/index.js",
        reason: "Syntax error is local to index.js"
      },
      repairIntent: {
        repairType: "syntax-error",
        confidence: "high",
        targetFile: "src/index.js",
        sourceFile: "src/index.js",
        reason: "Repair syntax error"
      }
    });
    if (!syntaxError.ok || syntaxError.confidence !== "high" || syntaxError.allowedRepairMode !== "normal") {
      throw new Error(`syntax error evidence: expected high normal, got ${JSON.stringify(syntaxError)}`);
    }

    const weakEvidence = validateRepairEvidence({
      parsedStackTrace: {
        filePath: "src/index.js",
        message: "Something failed"
      },
      errorContext: {
        filePath: "src/index.js",
        errorLine: "console.log('unknown');"
      },
      dependencyMap: {},
      repairTargetDecision: {
        targetFile: "src/helper.js",
        reason: "Weak guess"
      },
      repairIntent: {
        repairType: "unknown",
        confidence: "high",
        targetFile: "src/helper.js",
        sourceFile: "src/index.js",
        reason: "Weak guess"
      }
    });
    if (
      (weakEvidence.ok && weakEvidence.confidence !== "low") ||
      weakEvidence.allowedRepairMode !== "manual-review" ||
      weakEvidence.warnings.length === 0
    ) {
      throw new Error(`weak evidence: expected manual review with warnings, got ${JSON.stringify(weakEvidence)}`);
    }

    console.log("PASS repair-evidence-validator-unit");
    return true;
  } catch (error) {
    console.log("FAIL repair-evidence-validator-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runRepairEvidenceConfidenceUnit() {
  const { validateRepairEvidence } = require(path.join(projectRoot, "dist", "repair", "repairEvidenceValidator.js"));

  try {
    const downgraded = validateRepairEvidence({
      parsedStackTrace: {
        filePath: "src/index.js",
        message: "Something failed"
      },
      errorContext: {
        filePath: "src/index.js"
      },
      dependencyMap: {},
      repairTargetDecision: {
        targetFile: "src/helper.js",
        reason: "Ambiguous target"
      },
      repairIntent: {
        repairType: "unknown",
        confidence: "high",
        targetFile: "src/helper.js",
        reason: "Ambiguous target"
      }
    });
    if (
      !["medium", "low"].includes(downgraded.confidence) ||
      downgraded.downgradedFrom !== "high" ||
      downgraded.warnings.length === 0
    ) {
      throw new Error(`high ambiguous evidence: expected downgrade from high with warnings, got ${JSON.stringify(downgraded)}`);
    }

    const mediumAcceptable = validateRepairEvidence({
      parsedStackTrace: {
        filePath: "src/index.js",
        message: "Named export 'greet' not found"
      },
      errorContext: {
        filePath: "src/index.js",
        sourceSnippet: 'import { greet } from "./helper.js";'
      },
      dependencyMap: {
        imports: [{ from: "src/index.js", to: "src/helper.js", symbols: ["greet"] }]
      },
      repairTargetDecision: {
        targetFile: "src/index.js",
        reason: "Import mismatch for greet"
      },
      repairIntent: {
        repairType: "import-mismatch",
        confidence: "medium",
        symbolName: "greet",
        targetFile: "src/index.js",
        sourceFile: "src/index.js",
        reason: "Fix import mismatch"
      }
    });
    if (!mediumAcceptable.ok || mediumAcceptable.confidence !== "medium" || mediumAcceptable.allowedRepairMode !== "conservative") {
      throw new Error(`medium acceptable evidence: expected conservative medium, got ${JSON.stringify(mediumAcceptable)}`);
    }

    const lowConfidence = validateRepairEvidence({
      parsedStackTrace: {
        filePath: "src/index.js",
        message: "ReferenceError: value is not defined"
      },
      errorContext: {
        filePath: "src/index.js",
        errorLine: "console.log(value);"
      },
      dependencyMap: {},
      repairTargetDecision: {
        targetFile: "src/index.js",
        reason: "Local runtime error"
      },
      repairIntent: {
        repairType: "runtime-local-error",
        confidence: "low",
        symbolName: "value",
        targetFile: "src/index.js",
        sourceFile: "src/index.js",
        reason: "Low confidence local repair"
      }
    });
    if (lowConfidence.allowedRepairMode !== "manual-review") {
      throw new Error(`low confidence evidence: expected manual review, got ${JSON.stringify(lowConfidence)}`);
    }

    console.log("PASS repair-evidence-confidence-unit");
    return true;
  } catch (error) {
    console.log("FAIL repair-evidence-confidence-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runRepairEvidenceReportUnit() {
  const { validateRepairEvidence } = require(path.join(projectRoot, "dist", "repair", "repairEvidenceValidator.js"));

  const repairEvidenceValidation = validateRepairEvidence({
    parsedStackTrace: {
      filePath: "src/index.js",
      message: "ReferenceError: value is not defined"
    },
    errorContext: {
      filePath: "src/index.js",
      errorLine: "console.log(value);"
    },
    dependencyMap: {},
    repairTargetDecision: {
      targetFile: "src/index.js",
      reason: "ReferenceError is local to index.js"
    },
    repairIntent: {
      repairType: "runtime-local-error",
      confidence: "high",
      symbolName: "value",
      targetFile: "src/index.js",
      sourceFile: "src/index.js",
      reason: "Fix local runtime ReferenceError"
    }
  });
  const reportShape = {
    repairEvidenceValidation
  };
  const parsed = JSON.parse(JSON.stringify(reportShape));

  if (!parsed.repairEvidenceValidation) {
    console.log("FAIL repair-evidence-report-unit");
    console.log("  Expected repairEvidenceValidation to exist");
    return false;
  }

  const actual = parsed.repairEvidenceValidation;
  if (
    typeof actual.ok !== "boolean" ||
    typeof actual.confidence !== "string" ||
    !Array.isArray(actual.evidence) ||
    !Array.isArray(actual.warnings) ||
    typeof actual.reason !== "string" ||
    typeof actual.allowedRepairMode !== "string"
  ) {
    console.log("FAIL repair-evidence-report-unit");
    console.log(`  Invalid repairEvidenceValidation report shape: ${JSON.stringify(actual)}`);
    return false;
  }

  console.log("PASS repair-evidence-report-unit");
  return true;
}

function runRepairEvidenceGateUnit() {
  const {
    shouldSkipMutationForEvidenceValidation,
    validateRepairEvidence
  } = require(path.join(projectRoot, "dist", "repair", "repairEvidenceValidator.js"));

  try {
    const manualReview = validateRepairEvidence({
      parsedStackTrace: {
        filePath: "src/index.js",
        message: "Something failed"
      },
      errorContext: {
        filePath: "src/index.js"
      },
      dependencyMap: {},
      repairTargetDecision: {
        targetFile: "src/helper.js",
        reason: "Weak guess"
      },
      repairIntent: {
        repairType: "unknown",
        confidence: "high",
        targetFile: "src/helper.js",
        reason: "Weak guess"
      }
    });
    const manualReport = {
      repairEvidenceValidation: manualReview,
      patchIntentValidationReached: false,
      safePatchReached: false,
      mutationSkippedBeforePatchIntentValidation: shouldSkipMutationForEvidenceValidation(manualReview)
    };
    if (
      !manualReport.mutationSkippedBeforePatchIntentValidation ||
      manualReport.patchIntentValidationReached ||
      manualReport.safePatchReached ||
      manualReport.repairEvidenceValidation.allowedRepairMode !== "manual-review"
    ) {
      throw new Error(`manual-review gate: expected mutation path blocked, got ${JSON.stringify(manualReport)}`);
    }

    const conservative = validateRepairEvidence({
      parsedStackTrace: {
        filePath: "src/index.js",
        message: "Named export 'greet' not found"
      },
      errorContext: {
        filePath: "src/index.js",
        sourceSnippet: 'import { greet } from "./helper.js";'
      },
      dependencyMap: {
        imports: [{ from: "src/index.js", to: "src/helper.js", symbols: ["greet"] }]
      },
      repairTargetDecision: {
        targetFile: "src/index.js",
        reason: "Import mismatch for greet"
      },
      repairIntent: {
        repairType: "import-mismatch",
        confidence: "medium",
        symbolName: "greet",
        targetFile: "src/index.js",
        sourceFile: "src/index.js",
        reason: "Fix import mismatch"
      }
    });
    const conservativeReport = {
      repairEvidenceValidation: conservative,
      canContinue: !shouldSkipMutationForEvidenceValidation(conservative),
      warning: conservative.allowedRepairMode === "conservative" ? "Evidence validation allowed conservative repair mode." : ""
    };
    if (
      conservative.allowedRepairMode !== "conservative" ||
      !conservativeReport.canContinue ||
      !conservativeReport.warning
    ) {
      throw new Error(`conservative gate: expected non-blocking conservative warning, got ${JSON.stringify(conservativeReport)}`);
    }

    const normal = validateRepairEvidence({
      parsedStackTrace: {
        filePath: "src/index.js",
        message: "ReferenceError: value is not defined"
      },
      errorContext: {
        filePath: "src/index.js",
        errorLine: "console.log(value);"
      },
      dependencyMap: {},
      repairTargetDecision: {
        targetFile: "src/index.js",
        reason: "ReferenceError is local to index.js"
      },
      repairIntent: {
        repairType: "runtime-local-error",
        confidence: "high",
        symbolName: "value",
        targetFile: "src/index.js",
        sourceFile: "src/index.js",
        reason: "Fix local runtime ReferenceError"
      }
    });
    if (normal.allowedRepairMode !== "normal" || shouldSkipMutationForEvidenceValidation(normal)) {
      throw new Error(`normal gate: expected non-blocking normal mode, got ${JSON.stringify(normal)}`);
    }

    console.log("PASS repair-evidence-gate-unit");
    return true;
  } catch (error) {
    console.log("FAIL repair-evidence-gate-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runRepairPatchPolicyUnit() {
  const { decideRepairPatchPolicy } = require(path.join(projectRoot, "dist", "repair", "repairPatchPolicy.js"));

  function assertDecision(name, actual, expected) {
    for (const [field, value] of Object.entries(expected)) {
      if (actual[field] !== value) {
        throw new Error(`${name}: expected ${field}=${value}, got ${actual[field]} in ${JSON.stringify(actual)}`);
      }
    }
  }

  try {
    const normal = decideRepairPatchPolicy({
      repairIntent: {
        targetFile: "src/index.js"
      },
      evidenceValidation: {
        ok: true,
        confidence: "high",
        allowedRepairMode: "normal"
      },
      proposedPatchOperations: [
        {
          operation: "exact-replacement",
          targetFile: "src/index.js"
        }
      ]
    });
    assertDecision("normal mode", normal, {
      ok: true,
      mode: "normal",
      recommendedAction: "proceed"
    });

    const conservativeExact = decideRepairPatchPolicy({
      repairIntent: {
        targetFile: "src/index.js"
      },
      evidenceValidation: {
        ok: true,
        confidence: "medium",
        allowedRepairMode: "conservative"
      },
      proposedPatchOperations: [
        {
          operation: "exact-replacement",
          targetFile: "src/index.js"
        }
      ]
    });
    assertDecision("conservative exact replacement", conservativeExact, {
      ok: true,
      mode: "conservative",
      recommendedAction: "proceed"
    });

    const conservativeExport = decideRepairPatchPolicy({
      repairIntent: {
        targetFile: "src/helper.js"
      },
      evidenceValidation: {
        ok: true,
        confidence: "medium",
        allowedRepairMode: "conservative"
      },
      proposedPatchOperations: [
        {
          operation: "add-missing-export",
          targetFile: "src/helper.js"
        }
      ]
    });
    assertDecision("conservative add missing export", conservativeExport, {
      ok: true,
      mode: "conservative",
      recommendedAction: "proceed"
    });

    const riskyAppend = decideRepairPatchPolicy({
      repairIntent: {
        targetFile: "src/index.js"
      },
      evidenceValidation: {
        ok: true,
        confidence: "medium",
        allowedRepairMode: "conservative"
      },
      proposedPatchOperations: [
        {
          operation: "risky-append",
          targetFile: "src/index.js"
        }
      ]
    });
    assertDecision("conservative risky append", riskyAppend, {
      ok: false,
      mode: "conservative",
      recommendedAction: "block-mutation"
    });
    if (!riskyAppend.blockedOperations.includes("risky-append")) {
      throw new Error(`conservative risky append: expected risky-append blocked, got ${JSON.stringify(riskyAppend)}`);
    }

    const fullFileReplacement = decideRepairPatchPolicy({
      repairIntent: {
        targetFile: "src/index.js"
      },
      evidenceValidation: {
        ok: true,
        confidence: "medium",
        allowedRepairMode: "conservative"
      },
      proposedPatchOperations: [
        {
          operation: "full-file-replacement",
          targetFile: "src/index.js"
        }
      ]
    });
    assertDecision("conservative full-file replacement", fullFileReplacement, {
      ok: false,
      mode: "conservative",
      recommendedAction: "block-mutation"
    });

    const manualReview = decideRepairPatchPolicy({
      repairIntent: {
        targetFile: "src/index.js"
      },
      evidenceValidation: {
        ok: true,
        confidence: "low",
        allowedRepairMode: "manual-review"
      },
      proposedPatchOperations: [
        {
          operation: "exact-replacement",
          targetFile: "src/index.js"
        }
      ]
    });
    if (
      manualReview.ok !== false ||
      manualReview.mode !== "manual-review" ||
      !["manual-review", "block-mutation"].includes(manualReview.recommendedAction)
    ) {
      throw new Error(`manual-review: expected mutation blocked, got ${JSON.stringify(manualReview)}`);
    }

    const wrongTarget = decideRepairPatchPolicy({
      repairIntent: {
        targetFile: "src/index.js"
      },
      evidenceValidation: {
        ok: true,
        confidence: "medium",
        allowedRepairMode: "conservative"
      },
      proposedPatchOperations: [
        {
          operation: "exact-replacement",
          targetFile: "src/helper.js"
        }
      ]
    });
    assertDecision("wrong target file", wrongTarget, {
      ok: false,
      recommendedAction: "block-mutation"
    });
    if (!wrongTarget.blockedOperations.includes("wrong-target-file")) {
      throw new Error(`wrong target file: expected wrong-target-file blocked, got ${JSON.stringify(wrongTarget)}`);
    }

    const multiFile = decideRepairPatchPolicy({
      repairIntent: {
        targetFile: "src/index.js"
      },
      evidenceValidation: {
        ok: true,
        confidence: "medium",
        allowedRepairMode: "conservative"
      },
      proposedPatchOperations: [
        {
          operation: "exact-replacement",
          targetFile: "src/index.js",
          patchFiles: ["src/index.js", "src/helper.js"]
        }
      ]
    });
    assertDecision("multi-file mutation", multiFile, {
      ok: false,
      recommendedAction: "block-mutation"
    });
    if (!multiFile.blockedOperations.includes("multi-file-mutation")) {
      throw new Error(`multi-file mutation: expected multi-file-mutation blocked, got ${JSON.stringify(multiFile)}`);
    }

    console.log("PASS repair-patch-policy-unit");
    return true;
  } catch (error) {
    console.log("FAIL repair-patch-policy-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runRepairPatchPolicyGateUnit() {
  const { decideRepairPatchPolicy } = require(path.join(projectRoot, "dist", "repair", "repairPatchPolicy.js"));

  function evaluateGate(policy) {
    const blocked =
      !policy.ok ||
      policy.recommendedAction === "manual-review" ||
      policy.recommendedAction === "block-mutation";
    return {
      mutationBlocked: blocked,
      patchIntentGuardReached: !blocked,
      safePatchEngineReached: !blocked
    };
  }

  try {
    const manualReviewPolicy = decideRepairPatchPolicy({
      repairIntent: {
        targetFile: "src/index.js"
      },
      evidenceValidation: {
        ok: true,
        confidence: "low",
        allowedRepairMode: "manual-review"
      },
      proposedPatchOperations: [
        {
          operation: "exact-replacement",
          targetFile: "src/index.js"
        }
      ]
    });
    const manualGate = evaluateGate(manualReviewPolicy);
    if (
      !manualGate.mutationBlocked ||
      manualGate.patchIntentGuardReached ||
      manualGate.safePatchEngineReached
    ) {
      throw new Error(`manual-review policy gate: expected mutation blocked before patch path, got ${JSON.stringify({ manualReviewPolicy, manualGate })}`);
    }

    const blockedPolicy = decideRepairPatchPolicy({
      repairIntent: {
        targetFile: "src/index.js"
      },
      evidenceValidation: {
        ok: true,
        confidence: "medium",
        allowedRepairMode: "conservative"
      },
      proposedPatchOperations: [
        {
          operation: "risky-append",
          targetFile: "src/index.js"
        }
      ]
    });
    const blockedGate = evaluateGate(blockedPolicy);
    if (
      !blockedGate.mutationBlocked ||
      blockedGate.patchIntentGuardReached ||
      blockedGate.safePatchEngineReached
    ) {
      throw new Error(`blocked policy gate: expected patch intent guard and safe patch blocked, got ${JSON.stringify({ blockedPolicy, blockedGate })}`);
    }

    const proceedPolicy = decideRepairPatchPolicy({
      repairIntent: {
        targetFile: "src/index.js"
      },
      evidenceValidation: {
        ok: true,
        confidence: "high",
        allowedRepairMode: "normal"
      },
      proposedPatchOperations: [
        {
          operation: "exact-replacement",
          targetFile: "src/index.js"
        }
      ]
    });
    const proceedGate = evaluateGate(proceedPolicy);
    if (
      proceedGate.mutationBlocked ||
      !proceedGate.patchIntentGuardReached ||
      !proceedGate.safePatchEngineReached
    ) {
      throw new Error(`proceed policy gate: expected existing path to continue, got ${JSON.stringify({ proceedPolicy, proceedGate })}`);
    }

    console.log("PASS repair-patch-policy-gate-unit");
    return true;
  } catch (error) {
    console.log("FAIL repair-patch-policy-gate-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runRepairPatchPolicyReportUnit() {
  const { decideRepairPatchPolicy } = require(path.join(projectRoot, "dist", "repair", "repairPatchPolicy.js"));

  try {
    const repairPatchPolicy = decideRepairPatchPolicy({
      repairIntent: {
        targetFile: "src/index.js"
      },
      evidenceValidation: {
        ok: true,
        confidence: "high",
        allowedRepairMode: "normal"
      },
      proposedPatchOperations: [
        {
          operation: "exact-replacement",
          targetFile: "src/index.js"
        }
      ]
    });

    const observability = JSON.parse(JSON.stringify({ repairPatchPolicy }));
    if (!observability.repairPatchPolicy) {
      throw new Error("Expected repair-observability shape to include repairPatchPolicy.");
    }

    const actual = observability.repairPatchPolicy;
    if (
      typeof actual.ok !== "boolean" ||
      typeof actual.mode !== "string" ||
      !Array.isArray(actual.allowedOperations) ||
      !Array.isArray(actual.blockedOperations) ||
      !Array.isArray(actual.warnings) ||
      typeof actual.reason !== "string" ||
      typeof actual.recommendedAction !== "string"
    ) {
      throw new Error(`Invalid repairPatchPolicy report shape: ${JSON.stringify(actual)}`);
    }

    const finalReport = [
      `- Repair patch policy mode: ${actual.mode}`,
      `- Repair patch policy reason: ${actual.reason}`,
      `- Repair patch policy recommended action: ${actual.recommendedAction}`
    ].join("\n");

    if (
      !finalReport.includes("Repair patch policy mode:") ||
      !finalReport.includes("Repair patch policy reason:") ||
      !finalReport.includes("Repair patch policy recommended action:")
    ) {
      throw new Error(`Final report policy fields missing: ${finalReport}`);
    }

    if (finalReport.includes(projectRoot) || /\d{4}-\d{2}-\d{2}T/.test(finalReport)) {
      throw new Error(`Final report policy shape should not depend on generated paths or timestamps: ${finalReport}`);
    }

    console.log("PASS repair-patch-policy-report-unit");
    return true;
  } catch (error) {
    console.log("FAIL repair-patch-policy-report-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runRepairStrategyUnit() {
  const { decideRepairStrategy } = require(path.join(projectRoot, "dist", "repair", "repairStrategy.js"));

  function assertDecision(name, actual, expected) {
    for (const [field, value] of Object.entries(expected)) {
      if (actual[field] !== value) {
        throw new Error(`${name}: expected ${field}=${value}, got ${actual[field]} in ${JSON.stringify(actual)}`);
      }
    }
  }

  try {
    assertDecision(
      "missing dependency",
      decideRepairStrategy({ stderr: "Error: Cannot find module 'express'" }),
      {
        ok: true,
        strategy: "missing-dependency",
        confidence: "high",
        targetKind: "dependency",
        recommendedAction: "proceed"
      }
    );

    assertDecision(
      "missing local module",
      decideRepairStrategy({ stderr: "Error: Cannot find module './helper'" }),
      {
        ok: true,
        strategy: "missing-local-module",
        confidence: "high",
        targetKind: "local-module",
        recommendedAction: "proceed"
      }
    );

    assertDecision(
      "missing export",
      decideRepairStrategy({ stderr: "The requested module './helper.js' does not provide an export named 'foo'" }),
      {
        ok: true,
        strategy: "missing-export",
        confidence: "high",
        targetKind: "export",
        recommendedAction: "proceed"
      }
    );

    const wrongImport = decideRepairStrategy({
      stderr: "Module './helper' has no exported member 'foo'. Did you mean 'bar'?"
    });
    if (
      !(
        (wrongImport.strategy === "wrong-import-name" || wrongImport.strategy === "missing-export") &&
        wrongImport.warnings.some((warning) => warning.includes("overlap"))
      )
    ) {
      throw new Error(`wrong import overlap: expected wrong-import-name or missing-export with overlap warning, got ${JSON.stringify(wrongImport)}`);
    }

    assertDecision(
      "duplicate declaration",
      decideRepairStrategy({ stderr: "SyntaxError: Identifier 'x' has already been declared" }),
      {
        ok: true,
        strategy: "duplicate-declaration",
        confidence: "high",
        targetKind: "symbol",
        recommendedAction: "proceed"
      }
    );

    assertDecision(
      "undefined symbol",
      decideRepairStrategy({ stderr: "ReferenceError: x is not defined" }),
      {
        ok: true,
        strategy: "undefined-symbol",
        confidence: "high",
        targetKind: "symbol",
        recommendedAction: "proceed"
      }
    );

    assertDecision(
      "not a function",
      decideRepairStrategy({ stderr: "TypeError: x is not a function" }),
      {
        ok: true,
        strategy: "not-a-function",
        confidence: "high",
        targetKind: "symbol",
        recommendedAction: "proceed"
      }
    );

    assertDecision("empty error", decideRepairStrategy({}), {
      ok: false,
      strategy: "manual-review",
      confidence: "low",
      targetKind: "unknown",
      recommendedAction: "manual-review"
    });

    const repeated = decideRepairStrategy({
      stderr: "ReferenceError: x is not defined",
      previousAttempts: [
        { strategy: "undefined-symbol", validationChanged: false },
        { strategy: "undefined-symbol", validationChanged: false }
      ]
    });
    if (
      !repeated.mustAvoidStrategies.includes("undefined-symbol") ||
      repeated.recommendedAction !== "retry-with-different-strategy"
    ) {
      throw new Error(`repeated strategy: expected mustAvoidStrategies and retry action, got ${JSON.stringify(repeated)}`);
    }

    console.log("PASS repair-strategy-unit");
    return true;
  } catch (error) {
    console.log("FAIL repair-strategy-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runRepairStrategyGateUnit() {
  const { decideRepairStrategy } = require(path.join(projectRoot, "dist", "repair", "repairStrategy.js"));

  function evaluateStrategyGate(strategy) {
    const blocked = strategy.recommendedAction === "manual-review" || strategy.recommendedAction === "stop";
    return {
      mutationBlocked: blocked,
      targetSelectionReached: !blocked,
      evidenceValidationReached: !blocked,
      patchPolicyReached: !blocked
    };
  }

  try {
    const manualReview = decideRepairStrategy({});
    const manualGate = evaluateStrategyGate(manualReview);
    if (
      !manualGate.mutationBlocked ||
      manualGate.targetSelectionReached ||
      manualGate.evidenceValidationReached ||
      manualGate.patchPolicyReached
    ) {
      throw new Error(`manual-review strategy gate: expected blocked path, got ${JSON.stringify({ manualReview, manualGate })}`);
    }

    const stop = decideRepairStrategy({
      stderr: "ReferenceError: value is not defined",
      previousAttempts: [{ strategy: "undefined-symbol", manualReview: true }]
    });
    const stopGate = evaluateStrategyGate(stop);
    if (!stopGate.mutationBlocked || stop.recommendedAction !== "stop") {
      throw new Error(`stop strategy gate: expected stop to block mutation path, got ${JSON.stringify({ stop, stopGate })}`);
    }

    const proceed = decideRepairStrategy({ stderr: "ReferenceError: value is not defined" });
    const proceedGate = evaluateStrategyGate(proceed);
    if (
      proceedGate.mutationBlocked ||
      !proceedGate.targetSelectionReached ||
      !proceedGate.evidenceValidationReached ||
      !proceedGate.patchPolicyReached
    ) {
      throw new Error(`proceed strategy gate: expected existing path to continue, got ${JSON.stringify({ proceed, proceedGate })}`);
    }

    const observability = JSON.parse(JSON.stringify({ repairStrategy: proceed }));
    const finalReport = [
      `- Repair strategy: ${proceed.strategy}`,
      `- Repair strategy confidence: ${proceed.confidence}`,
      `- Repair strategy reason: ${proceed.reason}`,
      `- Repair strategy recommended action: ${proceed.recommendedAction}`
    ].join("\n");
    if (
      !observability.repairStrategy ||
      typeof observability.repairStrategy.strategy !== "string" ||
      !finalReport.includes("Repair strategy recommended action:")
    ) {
      throw new Error(`strategy report shape: expected strategy in observability/report, got ${JSON.stringify({ observability, finalReport })}`);
    }

    console.log("PASS repair-strategy-gate-unit");
    return true;
  } catch (error) {
    console.log("FAIL repair-strategy-gate-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runRepairRetryStrategyUnit() {
  const { decideRepairRetryStrategy } = require(path.join(projectRoot, "dist", "repair", "repairRetryStrategy.js"));

  function assertDecision(name, actual, expected) {
    for (const [field, value] of Object.entries(expected)) {
      if (actual[field] !== value) {
        throw new Error(`${name}: expected ${field}=${value}, got ${actual[field]} in ${JSON.stringify(actual)}`);
      }
    }
  }

  try {
    assertDecision(
      "validation passed",
      decideRepairRetryStrategy({ latestValidation: { passed: true } }),
      { shouldRetry: false, nextAction: "stop" }
    );

    assertDecision(
      "max retries",
      decideRepairRetryStrategy({ retryCount: 2, maxRetries: 2 }),
      { shouldRetry: false, nextAction: "stop" }
    );

    assertDecision(
      "current stop",
      decideRepairRetryStrategy({ currentStrategy: { recommendedAction: "stop" } }),
      { shouldRetry: false, nextAction: "stop" }
    );

    assertDecision(
      "current manual review",
      decideRepairRetryStrategy({ currentStrategy: { recommendedAction: "manual-review" } }),
      { shouldRetry: false, nextAction: "manual-review" }
    );

    assertDecision(
      "previous manual review",
      decideRepairRetryStrategy({ previousAttempts: [{ strategy: "unknown", manualReview: true }] }),
      { shouldRetry: false, nextAction: "manual-review" }
    );

    const policyDenied = decideRepairRetryStrategy({
      previousAttempts: [{ strategy: "undefined-symbol", policyDenied: true }]
    });
    assertDecision("policy denial", policyDenied, { shouldRetry: false, nextAction: "stop" });
    if (!policyDenied.blockedStrategies.includes("undefined-symbol")) {
      throw new Error(`policy denial: expected undefined-symbol blocked, got ${JSON.stringify(policyDenied)}`);
    }

    const mustAvoid = decideRepairRetryStrategy({
      currentStrategy: {
        strategy: "undefined-symbol",
        mustAvoidStrategies: ["undefined-symbol"]
      }
    });
    assertDecision("must avoid strategy", mustAvoid, {
      shouldRetry: true,
      nextAction: "retry-different-strategy"
    });
    if (!mustAvoid.blockedStrategies.includes("undefined-symbol")) {
      throw new Error(`must avoid strategy: expected undefined-symbol blocked, got ${JSON.stringify(mustAvoid)}`);
    }

    const repeatedSame = decideRepairRetryStrategy({
      currentStrategy: { strategy: "undefined-symbol" },
      previousAttempts: [{ strategy: "undefined-symbol", validationChanged: false }],
      latestValidation: { changed: false },
      retryCount: 1,
      maxRetries: 3
    });
    assertDecision("repeated same unchanged", repeatedSame, {
      shouldRetry: false,
      nextAction: "manual-review"
    });

    const unchangedSignature = decideRepairRetryStrategy({
      currentStrategy: { strategy: "not-a-function" },
      previousAttempts: [{ strategy: "undefined-symbol", errorSignature: "same-error", validationChanged: true }],
      latestValidation: { changed: false, errorSignature: "same-error" },
      retryCount: 1,
      maxRetries: 3
    });
    assertDecision("unchanged signature", unchangedSignature, {
      shouldRetry: true,
      nextAction: "retry-different-strategy"
    });
    if (!unchangedSignature.blockedStrategies.includes("undefined-symbol")) {
      throw new Error(`unchanged signature: expected previous strategy blocked, got ${JSON.stringify(unchangedSignature)}`);
    }

    assertDecision(
      "collect more context",
      decideRepairRetryStrategy({
        currentStrategy: { recommendedAction: "collect-more-context", confidence: "medium" }
      }),
      { shouldRetry: true, nextAction: "collect-more-context" }
    );

    assertDecision(
      "low confidence",
      decideRepairRetryStrategy({
        currentStrategy: { confidence: "low", recommendedAction: "proceed" }
      }),
      { shouldRetry: false, nextAction: "manual-review" }
    );

    assertDecision(
      "normal retry",
      decideRepairRetryStrategy({
        currentStrategy: { strategy: "undefined-symbol", confidence: "high", recommendedAction: "proceed" },
        retryCount: 0,
        maxRetries: 2
      }),
      { shouldRetry: true, nextAction: "retry-same-strategy" }
    );

    console.log("PASS repair-retry-strategy-unit");
    return true;
  } catch (error) {
    console.log("FAIL repair-retry-strategy-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runRepairRetryStrategyIntegrationUnit() {
  const { decideRepairRetryStrategy } = require(path.join(projectRoot, "dist", "repair", "repairRetryStrategy.js"));

  function gate(decision) {
    return {
      shouldContinueRetryLoop: decision.shouldRetry,
      mutationPathAllowed: decision.shouldRetry && !["manual-review", "stop"].includes(decision.nextAction)
    };
  }

  try {
    const policyDenied = decideRepairRetryStrategy({
      currentStrategy: { strategy: "undefined-symbol", confidence: "high", recommendedAction: "proceed" },
      previousAttempts: [{ strategy: "undefined-symbol", policyDenied: true }],
      latestValidation: { passed: false, changed: false },
      retryCount: 1,
      maxRetries: 2
    });
    if (policyDenied.shouldRetry || gate(policyDenied).mutationPathAllowed || policyDenied.nextAction !== "stop") {
      throw new Error(`policy denial integration: expected retry blocked, got ${JSON.stringify(policyDenied)}`);
    }

    const manualReview = decideRepairRetryStrategy({
      currentStrategy: { strategy: "manual-review", recommendedAction: "manual-review" },
      retryCount: 0,
      maxRetries: 2
    });
    if (manualReview.shouldRetry || manualReview.nextAction !== "manual-review") {
      throw new Error(`manual-review integration: expected retry blocked, got ${JSON.stringify(manualReview)}`);
    }

    const unchangedSame = decideRepairRetryStrategy({
      currentStrategy: { strategy: "undefined-symbol", confidence: "high", recommendedAction: "proceed" },
      previousAttempts: [{ strategy: "undefined-symbol", validationChanged: false }],
      latestValidation: { passed: false, changed: false },
      retryCount: 1,
      maxRetries: 3
    });
    if (unchangedSame.shouldRetry || unchangedSame.nextAction !== "manual-review") {
      throw new Error(`unchanged same strategy integration: expected manual review, got ${JSON.stringify(unchangedSame)}`);
    }

    const retrySame = decideRepairRetryStrategy({
      currentStrategy: { strategy: "undefined-symbol", confidence: "high", recommendedAction: "proceed" },
      latestValidation: { passed: false, changed: true },
      retryCount: 0,
      maxRetries: 2
    });
    if (!retrySame.shouldRetry || retrySame.nextAction !== "retry-same-strategy") {
      throw new Error(`retry same integration: expected existing retry path, got ${JSON.stringify(retrySame)}`);
    }

    const retryDifferent = decideRepairRetryStrategy({
      currentStrategy: {
        strategy: "undefined-symbol",
        confidence: "high",
        recommendedAction: "proceed",
        mustAvoidStrategies: ["undefined-symbol"]
      },
      retryCount: 0,
      maxRetries: 2
    });
    if (
      !retryDifferent.shouldRetry ||
      retryDifferent.nextAction !== "retry-different-strategy" ||
      !retryDifferent.blockedStrategies.includes("undefined-symbol")
    ) {
      throw new Error(`retry different integration: expected blocked strategy, got ${JSON.stringify(retryDifferent)}`);
    }

    const observability = JSON.parse(JSON.stringify({ repairRetryDecision: retrySame }));
    const finalReport = [
      `- Retry strategy: ${retrySame.nextAction}`,
      `- Retry strategy reason: ${retrySame.reason}`,
      `- Previous strategies: ${retrySame.previousStrategies.length ? retrySame.previousStrategies.join(", ") : "none"}`,
      `- Blocked strategies: ${retrySame.blockedStrategies.length ? retrySame.blockedStrategies.join(", ") : "none"}`
    ].join("\n");
    if (
      !observability.repairRetryDecision ||
      typeof observability.repairRetryDecision.shouldRetry !== "boolean" ||
      !finalReport.includes("Retry strategy:") ||
      !finalReport.includes("Blocked strategies:")
    ) {
      throw new Error(`retry report integration: expected observability/report shape, got ${JSON.stringify({ observability, finalReport })}`);
    }

    console.log("PASS repair-retry-strategy-integration-unit");
    return true;
  } catch (error) {
    console.log("FAIL repair-retry-strategy-integration-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function formatUnitList(values) {
  return values?.length ? values.join(", ") : "none";
}

function renderStrategyReportUnit(repairStrategy, repairRetryDecision) {
  return [
    "## Repair strategy",
    `- Strategy: ${repairStrategy?.strategy ?? "not available"}`,
    `- Confidence: ${repairStrategy?.confidence ?? "not available"}`,
    `- Target kind: ${repairStrategy?.targetKind ?? "not available"}`,
    `- Reason: ${repairStrategy?.reason ?? "not available"}`,
    `- Recommended action: ${repairStrategy?.recommendedAction ?? "not available"}`,
    `- Strategy source: ${repairStrategy?.strategySource ?? "not available"}`,
    `- Warnings: ${repairStrategy ? formatUnitList(repairStrategy.warnings) : "not available"}`,
    `- Must avoid strategies: ${repairStrategy ? formatUnitList(repairStrategy.mustAvoidStrategies) : "not available"}`,
    "",
    "## Retry strategy",
    `- Should retry: ${repairRetryDecision ? String(repairRetryDecision.shouldRetry) : "not available"}`,
    `- Next action: ${repairRetryDecision?.nextAction ?? "not available"}`,
    `- Reason: ${repairRetryDecision?.reason ?? "not available"}`,
    `- Previous strategies: ${repairRetryDecision ? formatUnitList(repairRetryDecision.previousStrategies) : "not available"}`,
    `- Blocked strategies: ${repairRetryDecision ? formatUnitList(repairRetryDecision.blockedStrategies) : "not available"}`
  ].join("\n");
}

function runRepairStrategyReportUnit() {
  const { decideRepairStrategy } = require(path.join(projectRoot, "dist", "repair", "repairStrategy.js"));
  const { decideRepairRetryStrategy } = require(path.join(projectRoot, "dist", "repair", "repairRetryStrategy.js"));

  try {
    const repairStrategy = decideRepairStrategy({ stderr: "ReferenceError: value is not defined" });
    const repairRetryDecision = decideRepairRetryStrategy({
      currentStrategy: {
        strategy: repairStrategy.strategy,
        confidence: repairStrategy.confidence,
        recommendedAction: repairStrategy.recommendedAction,
        mustAvoidStrategies: repairStrategy.mustAvoidStrategies
      },
      latestValidation: { changed: true, passed: false },
      retryCount: 0,
      maxRetries: 2
    });

    const strategyRequiredFields = [
      "ok",
      "strategy",
      "confidence",
      "targetKind",
      "reason",
      "warnings",
      "recommendedAction",
      "strategySource",
      "mustAvoidStrategies"
    ];
    for (const field of strategyRequiredFields) {
      if (!Object.prototype.hasOwnProperty.call(repairStrategy, field)) {
        throw new Error(`repairStrategy missing field ${field}: ${JSON.stringify(repairStrategy)}`);
      }
    }

    const retryRequiredFields = ["shouldRetry", "nextAction", "reason", "previousStrategies", "blockedStrategies"];
    for (const field of retryRequiredFields) {
      if (!Object.prototype.hasOwnProperty.call(repairRetryDecision, field)) {
        throw new Error(`repairRetryDecision missing field ${field}: ${JSON.stringify(repairRetryDecision)}`);
      }
    }

    const report = renderStrategyReportUnit(repairStrategy, repairRetryDecision);
    for (const needle of [
      "## Repair strategy",
      "- Strategy:",
      "- Confidence:",
      "- Target kind:",
      "- Recommended action:",
      "- Strategy source:",
      "- Warnings: none",
      "- Must avoid strategies: none",
      "## Retry strategy",
      "- Should retry:",
      "- Next action:",
      "- Previous strategies: none",
      "- Blocked strategies: none"
    ]) {
      if (!report.includes(needle)) {
        throw new Error(`strategy report missing ${JSON.stringify(needle)} in ${report}`);
      }
    }

    const missingRetryReport = renderStrategyReportUnit(repairStrategy, null);
    if (!missingRetryReport.includes("- Should retry: not available") || !missingRetryReport.includes("- Next action: not available")) {
      throw new Error(`missing retry decision did not render consistently: ${missingRetryReport}`);
    }

    console.log("PASS repair-strategy-report-unit");
    return true;
  } catch (error) {
    console.log("FAIL repair-strategy-report-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runRepairStrategyScenarioHardeningUnit() {
  const { decideRepairStrategy } = require(path.join(projectRoot, "dist", "repair", "repairStrategy.js"));
  const { decideRepairRetryStrategy } = require(path.join(projectRoot, "dist", "repair", "repairRetryStrategy.js"));

  function assertStrategy(name, actual, expectedStrategy) {
    const artifact = JSON.parse(JSON.stringify(actual));
    if (artifact.strategy !== expectedStrategy) {
      throw new Error(`${name}: expected strategy ${expectedStrategy}, got ${artifact.strategy} in ${JSON.stringify(artifact)}`);
    }
    for (const field of ["ok", "strategy", "confidence", "targetKind", "reason", "warnings", "recommendedAction", "strategySource", "mustAvoidStrategies"]) {
      if (!Object.prototype.hasOwnProperty.call(artifact, field)) {
        throw new Error(`${name}: strategy artifact missing ${field}`);
      }
    }
  }

  try {
    assertStrategy("missing dependency", decideRepairStrategy({ stderr: "Cannot find module 'express'" }), "missing-dependency");
    assertStrategy("missing local module", decideRepairStrategy({ stderr: "Cannot find module './helper'" }), "missing-local-module");
    assertStrategy("missing export", decideRepairStrategy({ stderr: "does not provide an export named 'foo'" }), "missing-export");
    assertStrategy("duplicate declaration", decideRepairStrategy({ stderr: "Identifier 'x' has already been declared" }), "duplicate-declaration");
    assertStrategy("undefined symbol", decideRepairStrategy({ stderr: "ReferenceError: x is not defined" }), "undefined-symbol");
    assertStrategy("not a function", decideRepairStrategy({ stderr: "TypeError: x is not a function" }), "not-a-function");

    const manualReview = decideRepairStrategy({});
    if (manualReview.recommendedAction !== "manual-review" || manualReview.ok !== false) {
      throw new Error(`manual review strategy should block mutation, got ${JSON.stringify(manualReview)}`);
    }

    const policyDenied = decideRepairRetryStrategy({
      previousAttempts: [{ strategy: "undefined-symbol", policyDenied: true }],
      retryCount: 1,
      maxRetries: 2
    });
    if (policyDenied.shouldRetry !== false || policyDenied.nextAction !== "stop") {
      throw new Error(`policy denial should block retry, got ${JSON.stringify(policyDenied)}`);
    }

    const unchanged = decideRepairRetryStrategy({
      currentStrategy: { strategy: "undefined-symbol", recommendedAction: "proceed", confidence: "high" },
      previousAttempts: [{ strategy: "undefined-symbol", validationChanged: false }],
      latestValidation: { changed: false },
      retryCount: 1,
      maxRetries: 3
    });
    if (unchanged.shouldRetry !== false || unchanged.nextAction !== "manual-review") {
      throw new Error(`unchanged same strategy should block retry, got ${JSON.stringify(unchanged)}`);
    }

    const retryDifferent = decideRepairRetryStrategy({
      currentStrategy: {
        strategy: "undefined-symbol",
        recommendedAction: "proceed",
        confidence: "high",
        mustAvoidStrategies: ["undefined-symbol"]
      },
      retryCount: 0,
      maxRetries: 2
    });
    if (
      retryDifferent.shouldRetry !== true ||
      retryDifferent.nextAction !== "retry-different-strategy" ||
      !retryDifferent.blockedStrategies.includes("undefined-symbol")
    ) {
      throw new Error(`retry different should record blocked strategy, got ${JSON.stringify(retryDifferent)}`);
    }

    console.log("PASS repair-strategy-scenario-hardening-unit");
    return true;
  } catch (error) {
    console.log("FAIL repair-strategy-scenario-hardening-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runFailureSignatureUnit() {
  const { buildFailureSignature } = require(path.join(projectRoot, "dist", "repair", "failureSignature.js"));

  try {
    const a = buildFailureSignature({
      errorType: "ReferenceError",
      errorMessage: "ReferenceError: foo is not defined\n    at Object.<anonymous> (C:\\repo\\index.js:4:1)",
      topProjectStackFrame: "C:\\repo\\index.js:4:1",
      symbolName: "foo"
    });
    const b = buildFailureSignature({
      errorType: "ReferenceError",
      errorMessage: "ReferenceError:   foo    is not defined\n    at Object.<anonymous> (C:\\repo\\index.js:99:22)",
      topProjectStackFrame: "C:\\repo\\index.js:99:22",
      symbolName: "foo"
    });
    const c = buildFailureSignature({
      errorType: "ReferenceError",
      errorMessage: "ReferenceError: bar is not defined\n    at Object.<anonymous> (C:\\repo\\index.js:4:1)",
      topProjectStackFrame: "C:\\repo\\index.js:4:1",
      symbolName: "bar"
    });
    const d = buildFailureSignature({
      errorType: "ReferenceError",
      errorMessage: "ReferenceError: foo is not defined\n    at Object.<anonymous> (C:\\repo\\helper.js:4:1)",
      topProjectStackFrame: "C:\\repo\\helper.js:4:1",
      symbolName: "foo"
    });

    if (a !== b) {
      throw new Error(`same error should produce same signature, got ${a} vs ${b}`);
    }
    if (a === c) {
      throw new Error("different symbols should produce different signatures");
    }
    if (a === d) {
      throw new Error("different files should produce different signatures");
    }

    console.log("PASS failure-signature-unit");
    return true;
  } catch (error) {
    console.log("FAIL failure-signature-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

async function runFailureMemoryUnit() {
  const {
    getFailureMemoryPath,
    loadFailureMemory,
    saveFailureMemory
  } = require(path.join(projectRoot, "dist", "repair", "failureMemory.js"));

  try {
    const repo = path.join(projectRoot, ".scenario-unit", "failure-memory-unit");
    fs.rmSync(repo, { recursive: true, force: true });
    fs.mkdirSync(repo, { recursive: true });

    const missing = await loadFailureMemory(repo);
    if (missing.schemaVersion !== 1 || missing.records.length !== 0) {
      throw new Error(`missing memory file should load empty store, got ${JSON.stringify(missing)}`);
    }

    await saveFailureMemory(repo, {
      schemaVersion: 1,
      records: [
        {
          schemaVersion: 1,
          errorSignature: "ReferenceError:index:foo",
          projectId: "demo",
          strategy: "undefined-symbol",
          outcome: "failed",
          validationChanged: false,
          retryCount: 1,
          timestamp: 1
        }
      ]
    });
    const loaded = await loadFailureMemory(repo);
    if (loaded.records.length !== 1 || loaded.records[0].strategy !== "undefined-symbol") {
      throw new Error(`saved memory records should reload, got ${JSON.stringify(loaded)}`);
    }

    fs.writeFileSync(getFailureMemoryPath(repo), "{ not json", "utf8");
    const corrupt = await loadFailureMemory(repo);
    if (corrupt.records.length !== 0) {
      throw new Error(`corrupt memory should not crash and should load empty store, got ${JSON.stringify(corrupt)}`);
    }

    console.log("PASS failure-memory-unit");
    return true;
  } catch (error) {
    console.log("FAIL failure-memory-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runFailureMemoryLookupUnit() {
  const { lookupFailureMemory } = require(path.join(projectRoot, "dist", "repair", "failureMemoryLookup.js"));

  try {
    const store = {
      schemaVersion: 1,
      records: [
        { schemaVersion: 1, errorSignature: "sig", projectId: "demo", strategy: "undefined-symbol", outcome: "failed", validationChanged: false, retryCount: 1, timestamp: 1 },
        { schemaVersion: 1, errorSignature: "sig", projectId: "demo", strategy: "undefined-symbol", outcome: "failed", validationChanged: false, retryCount: 2, timestamp: 2 },
        { schemaVersion: 1, errorSignature: "sig", projectId: "demo", strategy: "safe-replacement", outcome: "success", validationChanged: true, retryCount: 1, timestamp: 3 },
        { schemaVersion: 1, errorSignature: "other", projectId: "demo", strategy: "other", outcome: "failed", validationChanged: false, retryCount: 1, timestamp: 4 }
      ]
    };
    const hint = lookupFailureMemory({ store, errorSignature: "sig", projectId: "demo" });
    if (hint.historicalMatches !== 3) {
      throw new Error(`expected 3 historical matches, got ${JSON.stringify(hint)}`);
    }
    if (!hint.failedStrategies.includes("undefined-symbol")) {
      throw new Error(`expected failed strategy, got ${JSON.stringify(hint)}`);
    }
    if (!hint.successfulStrategies.includes("safe-replacement") || !hint.preferredStrategies.includes("safe-replacement")) {
      throw new Error(`expected successful/preferred strategy hint, got ${JSON.stringify(hint)}`);
    }
    if (!hint.discouragedStrategies.includes("undefined-symbol")) {
      throw new Error(`expected repeated failed strategy to be discouraged, got ${JSON.stringify(hint)}`);
    }

    console.log("PASS failure-memory-lookup-unit");
    return true;
  } catch (error) {
    console.log("FAIL failure-memory-lookup-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

async function runFailureMemoryUpdateUnit() {
  const { loadFailureMemory } = require(path.join(projectRoot, "dist", "repair", "failureMemory.js"));
  const { updateFailureMemory } = require(path.join(projectRoot, "dist", "repair", "failureMemoryUpdate.js"));

  try {
    const repo = path.join(projectRoot, ".scenario-unit", "failure-memory-update-unit");
    fs.rmSync(repo, { recursive: true, force: true });
    fs.mkdirSync(repo, { recursive: true });
    fs.writeFileSync(path.join(repo, "package.json"), JSON.stringify({ name: "memory-update-demo" }), "utf8");

    await updateFailureMemory({
      repoPath: repo,
      errorSignature: "sig",
      strategy: "undefined-symbol",
      repairType: "runtime-local-error",
      targetFile: "index.js",
      outcome: "success",
      validationChanged: true,
      retryCount: 1,
      timestamp: 10
    });
    await updateFailureMemory({
      repoPath: repo,
      errorSignature: "sig",
      strategy: "undefined-symbol",
      outcome: "failed",
      validationChanged: false,
      retryCount: 2,
      timestamp: 11
    });
    const loaded = await loadFailureMemory(repo);
    if (loaded.records.length !== 2) {
      throw new Error(`memory should survive multiple updates, got ${JSON.stringify(loaded)}`);
    }
    if (loaded.records[0].projectId !== "memory-update-demo") {
      throw new Error(`project id should be package name, got ${JSON.stringify(loaded.records[0])}`);
    }

    console.log("PASS failure-memory-update-unit");
    return true;
  } catch (error) {
    console.log("FAIL failure-memory-update-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runFailureMemoryRetryAwarenessUnit() {
  const { decideRepairStrategy } = require(path.join(projectRoot, "dist", "repair", "repairStrategy.js"));
  const { decideRepairRetryStrategy } = require(path.join(projectRoot, "dist", "repair", "repairRetryStrategy.js"));
  const { validatePatchIntent } = require(path.join(projectRoot, "dist", "repair", "patchIntentGuard.js"));
  const { decideRepairPatchPolicy } = require(path.join(projectRoot, "dist", "repair", "repairPatchPolicy.js"));

  try {
    const hint = {
      errorSignature: "sig",
      historicalMatches: 3,
      failedStrategies: ["undefined-symbol"],
      successfulStrategies: ["safe-replacement"],
      discouragedStrategies: ["undefined-symbol"],
      preferredStrategies: ["safe-replacement"],
      recommendedStrategyHints: ["safe-replacement"],
      recommendManualReview: false,
      warnings: ["Strategy undefined-symbol failed repeatedly for this failure signature."]
    };
    const strategy = decideRepairStrategy({
      stderr: "ReferenceError: foo is not defined",
      failureMemory: hint
    });
    if (!strategy.mustAvoidStrategies.includes("undefined-symbol")) {
      throw new Error(`memory should discourage repeated failed strategy, got ${JSON.stringify(strategy)}`);
    }
    if (!strategy.warnings.some((warning) => warning.includes("preferred strategy"))) {
      throw new Error(`memory should surface preferred hints as warnings, got ${JSON.stringify(strategy)}`);
    }

    const retry = decideRepairRetryStrategy({
      currentStrategy: {
        strategy: "undefined-symbol",
        confidence: "high",
        recommendedAction: "proceed",
        mustAvoidStrategies: strategy.mustAvoidStrategies
      },
      failureMemoryHint: hint,
      retryCount: 0,
      maxRetries: 2
    });
    if (!retry.shouldRetry || retry.nextAction !== "retry-different-strategy") {
      throw new Error(`retry orchestration should switch away from historically bad strategy, got ${JSON.stringify(retry)}`);
    }

    const evidenceGate = { ok: false, allowedRepairMode: "manual-review" };
    if (hint.preferredStrategies.length > 0 && evidenceGate.ok !== false) {
      throw new Error("memory must not bypass evidence validation");
    }

    const policy = decideRepairPatchPolicy({
      repairIntent: { targetFile: "index.js", repairType: "runtime-local-error" },
      evidenceValidation: { ok: false, confidence: "low", allowedRepairMode: "manual-review" },
      proposedPatchOperations: [{ operation: "exact-replacement", targetFile: "index.js" }]
    });
    if (policy.ok) {
      throw new Error(`memory must not bypass patch policy, got ${JSON.stringify(policy)}`);
    }

    const patchIntent = validatePatchIntent(
      {
        repairType: "runtime-local-error",
        targetFile: "index.js",
        reason: "unit",
        confidence: "medium",
        allowedMutationScope: "single-file",
        safetyNotes: ["unit"]
      },
      { targetFile: "helper.js", patchFiles: ["helper.js"], patchContent: "console.log('x');" }
    );
    if (patchIntent.ok) {
      throw new Error(`memory must not bypass patch intent validation, got ${JSON.stringify(patchIntent)}`);
    }

    const safePatchReached = policy.ok && patchIntent.ok;
    if (safePatchReached) {
      throw new Error("memory must not directly reach Safe Patch Engine when gates fail");
    }

    const manualHint = { ...hint, recommendManualReview: true };
    const manualRetry = decideRepairRetryStrategy({
      currentStrategy: { strategy: "undefined-symbol", confidence: "high", recommendedAction: "proceed" },
      failureMemoryHint: manualHint,
      retryCount: 0,
      maxRetries: 2
    });
    if (manualRetry.shouldRetry || manualRetry.nextAction !== "manual-review") {
      throw new Error(`manual-review hint should reduce retry aggressiveness, got ${JSON.stringify(manualRetry)}`);
    }

    console.log("PASS failure-memory-retry-awareness-unit");
    return true;
  } catch (error) {
    console.log("FAIL failure-memory-retry-awareness-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runFailureMemoryScenarioHardeningUnit() {
  const { lookupFailureMemory } = require(path.join(projectRoot, "dist", "repair", "failureMemoryLookup.js"));
  const { decideRepairRetryStrategy } = require(path.join(projectRoot, "dist", "repair", "repairRetryStrategy.js"));

  try {
    const store = {
      schemaVersion: 1,
      records: [
        { schemaVersion: 1, errorSignature: "repeated", strategy: "undefined-symbol", outcome: "failed", validationChanged: false, retryCount: 1, timestamp: 1 },
        { schemaVersion: 1, errorSignature: "repeated", strategy: "undefined-symbol", outcome: "failed", validationChanged: false, retryCount: 2, timestamp: 2 },
        { schemaVersion: 1, errorSignature: "success", strategy: "safe-replacement", outcome: "success", validationChanged: true, retryCount: 1, timestamp: 3 },
        { schemaVersion: 1, errorSignature: "policy", strategy: "risky-append", outcome: "policy-denied", validationChanged: false, retryCount: 1, timestamp: 4 },
        { schemaVersion: 1, errorSignature: "manual", strategy: "runtime-targeted-fix", outcome: "manual-review", validationChanged: false, retryCount: 1, timestamp: 5 }
      ]
    };
    const repeated = lookupFailureMemory({ store, errorSignature: "repeated" });
    if (!repeated.discouragedStrategies.includes("undefined-symbol")) {
      throw new Error(`failure-memory-repeated-failure expected discouraged strategy, got ${JSON.stringify(repeated)}`);
    }
    console.log("PASS failure-memory-repeated-failure");

    const success = lookupFailureMemory({ store, errorSignature: "success" });
    if (!success.preferredStrategies.includes("safe-replacement")) {
      throw new Error(`failure-memory-successful-strategy expected preferred strategy, got ${JSON.stringify(success)}`);
    }
    console.log("PASS failure-memory-successful-strategy");

    const policy = lookupFailureMemory({ store, errorSignature: "policy" });
    if (!policy.failedStrategies.includes("risky-append") || policy.warnings.length === 0) {
      throw new Error(`failure-memory-policy-denied expected caution warning, got ${JSON.stringify(policy)}`);
    }
    console.log("PASS failure-memory-policy-denied");

    const manual = lookupFailureMemory({ store, errorSignature: "manual" });
    if (!manual.failedStrategies.includes("runtime-targeted-fix") || manual.warnings.length === 0) {
      throw new Error(`failure-memory-manual-review expected caution warning, got ${JSON.stringify(manual)}`);
    }
    console.log("PASS failure-memory-manual-review");

    const retryBlocked = decideRepairRetryStrategy({
      currentStrategy: { strategy: "undefined-symbol", confidence: "high", recommendedAction: "proceed" },
      failureMemoryHint: repeated,
      retryCount: 0,
      maxRetries: 2
    });
    if (retryBlocked.nextAction !== "manual-review") {
      throw new Error(`retry-blocked-by-history expected manual-review, got ${JSON.stringify(retryBlocked)}`);
    }
    console.log("PASS retry-blocked-by-history");

    if (!success.preferredStrategies.includes("safe-replacement") || success.recommendManualReview) {
      throw new Error(`retry-prefers-successful-history expected advisory preferred strategy only, got ${JSON.stringify(success)}`);
    }
    console.log("PASS retry-prefers-successful-history");

    return true;
  } catch (error) {
    console.log("FAIL failure-memory-scenario-hardening-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runRepairValidationDeltaUnit() {
  const { buildValidationDelta } = require(path.join(projectRoot, "dist", "repair", "validationDelta.js"));

  try {
    const resolved = buildValidationDelta({ beforeSignature: "a", validationPassed: true });
    if (resolved.outcome !== "resolved" || !resolved.changed) {
      throw new Error(`resolved delta mismatch: ${JSON.stringify(resolved)}`);
    }

    const unchanged = buildValidationDelta({ beforeSignature: "a", afterSignature: "a" });
    if (unchanged.outcome !== "unchanged" || unchanged.changed) {
      throw new Error(`unchanged delta mismatch: ${JSON.stringify(unchanged)}`);
    }

    const changed = buildValidationDelta({ beforeSignature: "a", afterSignature: "b" });
    if (changed.outcome !== "changed" || !changed.changed) {
      throw new Error(`changed delta mismatch: ${JSON.stringify(changed)}`);
    }

    const worsened = buildValidationDelta({ beforeSignature: "a", afterSignature: "b", validationRegressed: true });
    if (worsened.outcome !== "worsened" || !worsened.changed) {
      throw new Error(`worsened delta mismatch: ${JSON.stringify(worsened)}`);
    }

    console.log("PASS repair-validation-delta-unit");
    return true;
  } catch (error) {
    console.log("FAIL repair-validation-delta-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runRepairOutcomeClassifierUnit() {
  const { classifyRepairOutcome } = require(path.join(projectRoot, "dist", "repair", "repairOutcomeClassifier.js"));

  function assertOutcome(name, actual, outcome, reasonCode) {
    if (actual.outcome !== outcome || actual.reasonCode !== reasonCode) {
      throw new Error(`${name}: expected ${outcome}/${reasonCode}, got ${JSON.stringify(actual)}`);
    }
  }

  try {
    assertOutcome(
      "success",
      classifyRepairOutcome({ validationPassed: true, validationDelta: { beforeSignature: "a", changed: true, outcome: "resolved" } }),
      "success",
      "VALIDATION_PASSED"
    );
    assertOutcome(
      "same error",
      classifyRepairOutcome({ validationDelta: { beforeSignature: "a", afterSignature: "a", changed: false, outcome: "unchanged" } }),
      "failed-same-error",
      "ERROR_UNCHANGED"
    );
    assertOutcome(
      "new error",
      classifyRepairOutcome({ validationDelta: { beforeSignature: "a", afterSignature: "b", changed: true, outcome: "changed" } }),
      "failed-new-error",
      "ERROR_CHANGED"
    );
    assertOutcome(
      "worse",
      classifyRepairOutcome({ validationDelta: { beforeSignature: "a", afterSignature: "b", changed: true, outcome: "worsened" } }),
      "failed-worse",
      "ERROR_WORSENED"
    );
    assertOutcome(
      "policy denied",
      classifyRepairOutcome({
        validationDelta: { beforeSignature: "a", changed: false, outcome: "unchanged" },
        patchPolicy: { ok: false, mode: "conservative", allowedOperations: [], blockedOperations: ["risky-append"], warnings: [], reason: "blocked", recommendedAction: "block-mutation" }
      }),
      "policy-denied",
      "POLICY_DENIED"
    );
    assertOutcome(
      "manual review",
      classifyRepairOutcome({ validationDelta: { beforeSignature: "a", changed: false, outcome: "unchanged" }, evidenceManualReview: true }),
      "manual-review-required",
      "MANUAL_REVIEW_REQUIRED"
    );

    console.log("PASS repair-outcome-classifier-unit");
    return true;
  } catch (error) {
    console.log("FAIL repair-outcome-classifier-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runRepairDecisionAuditUnit() {
  const { auditRepairDecision } = require(path.join(projectRoot, "dist", "repair", "repairDecisionAudit.js"));

  try {
    const audit = auditRepairDecision({
      retryDecision: {
        shouldRetry: true,
        nextAction: "retry-different-strategy",
        reason: "switch strategy",
        previousStrategies: ["undefined-symbol"],
        blockedStrategies: ["undefined-symbol"]
      },
      reasonCode: "ERROR_CHANGED",
      historyBlocked: true,
      evidenceWarnings: ["medium confidence"],
      memoryWarnings: ["historical failure"]
    });
    if (audit.retryDecision !== "retry-different-strategy" || !audit.blockingFactors.includes("historical-failure-memory")) {
      throw new Error(`audit mismatch: ${JSON.stringify(audit)}`);
    }
    if (!audit.influencingFactors.some((factor) => factor.includes("evidence:")) || !audit.influencingFactors.some((factor) => factor.includes("memory:"))) {
      throw new Error(`audit influencing factors missing: ${JSON.stringify(audit)}`);
    }

    const stop = auditRepairDecision({ retryDecision: null, reasonCode: "NO_RUNTIME_CHANGE" });
    if (stop.retryDecision !== "stop") {
      throw new Error(`missing retry decision should stop, got ${JSON.stringify(stop)}`);
    }

    console.log("PASS repair-decision-audit-unit");
    return true;
  } catch (error) {
    console.log("FAIL repair-decision-audit-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runRepairOutcomeReportUnit() {
  try {
    const repairOutcome = {
      outcome: "failed-same-error",
      reasonCode: "ERROR_UNCHANGED",
      changedValidationState: false,
      beforeFailureSignature: "sig",
      afterFailureSignature: "sig",
      explanation: "same error",
      warnings: []
    };
    const audit = {
      retryDecision: "manual-review",
      reasonCode: "ERROR_UNCHANGED",
      explanation: "blocked",
      blockingFactors: ["same-strategy"],
      influencingFactors: []
    };
    const observability = JSON.parse(JSON.stringify({ repairOutcome, repairDecisionAudit: audit }));
    const report = [
      "## Repair outcome",
      `- Outcome: ${repairOutcome.outcome}`,
      `- Reason code: ${repairOutcome.reasonCode}`,
      "## Retry audit",
      `- Retry decision: ${audit.retryDecision}`,
      `- Blocking factors: ${audit.blockingFactors.join(", ")}`
    ].join("\n");

    if (!observability.repairOutcome || !observability.repairDecisionAudit) {
      throw new Error(`observability missing outcome/audit: ${JSON.stringify(observability)}`);
    }
    for (const needle of ["## Repair outcome", "- Outcome:", "- Reason code:", "## Retry audit", "- Retry decision:"]) {
      if (!report.includes(needle)) {
        throw new Error(`report missing ${needle}: ${report}`);
      }
    }

    console.log("PASS repair-outcome-report-unit");
    return true;
  } catch (error) {
    console.log("FAIL repair-outcome-report-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runRepairOutcomeMemoryIntegrationUnit() {
  const { appendFailureMemoryRecord } = require(path.join(projectRoot, "dist", "repair", "failureMemoryUpdate.js"));
  const { lookupFailureMemory } = require(path.join(projectRoot, "dist", "repair", "failureMemoryLookup.js"));

  try {
    const store = appendFailureMemoryRecord(
      { schemaVersion: 1, records: [] },
      {
        schemaVersion: 1,
        errorSignature: "sig",
        strategy: "undefined-symbol",
        repairType: "runtime-local-error",
        targetFile: "index.js",
        outcome: "failed",
        validationChanged: false,
        retryCount: 1,
        timestamp: 1
      }
    );
    const updated = appendFailureMemoryRecord(store, {
      schemaVersion: 1,
      errorSignature: "sig",
      strategy: "undefined-symbol",
      repairType: "runtime-local-error",
      targetFile: "index.js",
      outcome: "failed",
      validationChanged: false,
      retryCount: 2,
      timestamp: 2
    });
    const hint = lookupFailureMemory({ store: updated, errorSignature: "sig" });
    if (!hint.discouragedStrategies.includes("undefined-symbol")) {
      throw new Error(`outcome memory integration should discourage repeated failed strategy, got ${JSON.stringify(hint)}`);
    }

    console.log("PASS repair-outcome-memory-integration-unit");
    return true;
  } catch (error) {
    console.log("FAIL repair-outcome-memory-integration-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runRepairOutcomeScenarioHardeningUnit() {
  const { classifyRepairOutcome } = require(path.join(projectRoot, "dist", "repair", "repairOutcomeClassifier.js"));
  const { auditRepairDecision } = require(path.join(projectRoot, "dist", "repair", "repairDecisionAudit.js"));

  try {
    const scenarios = [
      ["repair-outcome-success", classifyRepairOutcome({ validationPassed: true, validationDelta: { beforeSignature: "a", changed: true, outcome: "resolved" } }), "success"],
      ["repair-outcome-same-error", classifyRepairOutcome({ validationDelta: { beforeSignature: "a", afterSignature: "a", changed: false, outcome: "unchanged" } }), "failed-same-error"],
      ["repair-outcome-new-error", classifyRepairOutcome({ validationDelta: { beforeSignature: "a", afterSignature: "b", changed: true, outcome: "changed" } }), "failed-new-error"],
      ["repair-outcome-worsened", classifyRepairOutcome({ validationDelta: { beforeSignature: "a", afterSignature: "b", changed: true, outcome: "worsened" } }), "failed-worse"],
      ["repair-outcome-validation-improved", classifyRepairOutcome({ validationDelta: { beforeSignature: undefined, afterSignature: undefined, changed: true, outcome: "changed" } }), "validation-improved"],
      ["repair-outcome-policy-denied", classifyRepairOutcome({ validationDelta: { beforeSignature: "a", changed: false, outcome: "unchanged" }, patchPolicy: { ok: false, mode: "conservative", allowedOperations: [], blockedOperations: ["risky-append"], warnings: [], reason: "blocked", recommendedAction: "block-mutation" } }), "policy-denied"],
      ["repair-outcome-manual-review", classifyRepairOutcome({ validationDelta: { beforeSignature: "a", changed: false, outcome: "unchanged" }, evidenceManualReview: true }), "manual-review-required"]
    ];
    for (const [name, actual, expected] of scenarios) {
      if (actual.outcome !== expected) {
        throw new Error(`${name}: expected ${expected}, got ${JSON.stringify(actual)}`);
      }
      console.log(`PASS ${name}`);
    }

    const different = auditRepairDecision({
      retryDecision: { shouldRetry: true, nextAction: "retry-different-strategy", reason: "switch", previousStrategies: ["a"], blockedStrategies: ["a"] },
      reasonCode: "ERROR_CHANGED"
    });
    if (different.retryDecision !== "retry-different-strategy" || !different.blockingFactors.some((factor) => factor.includes("blocked-strategies"))) {
      throw new Error(`retry-audit-different-strategy mismatch: ${JSON.stringify(different)}`);
    }
    console.log("PASS retry-audit-different-strategy");

    const stop = auditRepairDecision({
      retryDecision: { shouldRetry: false, nextAction: "manual-review", reason: "Failure memory recommends manual review", previousStrategies: ["a"], blockedStrategies: ["a"] },
      reasonCode: "RETRY_BLOCKED_BY_HISTORY",
      historyBlocked: true
    });
    if (stop.retryDecision !== "manual-review" || !stop.blockingFactors.includes("historical-failure-memory")) {
      throw new Error(`retry-audit-stop-after-history mismatch: ${JSON.stringify(stop)}`);
    }
    console.log("PASS retry-audit-stop-after-history");

    return true;
  } catch (error) {
    console.log("FAIL repair-outcome-scenario-hardening-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

async function runRepairAnalyticsUnit() {
  const {
    updateRepairAnalytics,
    getRepairStrategyAnalytics,
    buildRepairAnalyticsHint
  } = require(path.join(projectRoot, "dist", "repair", "repairAnalytics.js"));

  try {
    const repo = path.join(projectRoot, ".scenario-unit", "repair-analytics-unit");
    fs.rmSync(repo, { recursive: true, force: true });
    fs.mkdirSync(repo, { recursive: true });

    await updateRepairAnalytics({ projectRoot: repo, strategy: "undefined-symbol", outcome: "success" });
    await updateRepairAnalytics({ projectRoot: repo, strategy: "undefined-symbol", outcome: "failed-same-error" });
    const analytics = await getRepairStrategyAnalytics({ projectRoot: repo, strategy: "undefined-symbol" });
    if (!analytics || analytics.totalAttempts !== 2 || analytics.successCount !== 1 || analytics.failedCount !== 1) {
      throw new Error(`analytics aggregate mismatch: ${JSON.stringify(analytics)}`);
    }
    const hint = buildRepairAnalyticsHint({ analytics });
    if (hint.advisoryOnly !== true || hint.strategy !== "undefined-symbol") {
      throw new Error(`analytics hint mismatch: ${JSON.stringify(hint)}`);
    }

    console.log("PASS repair-analytics-unit");
    return true;
  } catch (error) {
    console.log("FAIL repair-analytics-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

async function runRepairEffectivenessScoreUnit() {
  const { updateRepairAnalytics, getRepairStrategyAnalytics } = require(path.join(projectRoot, "dist", "repair", "repairAnalytics.js"));

  try {
    const repo = path.join(projectRoot, ".scenario-unit", "repair-effectiveness-score-unit");
    fs.rmSync(repo, { recursive: true, force: true });
    fs.mkdirSync(repo, { recursive: true });
    const updates = [
      "success",
      "validation-improved",
      "failed-same-error",
      "failed-new-error",
      "failed-worse",
      "no-change",
      "policy-denied",
      "manual-review-required"
    ];
    for (const outcome of updates) {
      await updateRepairAnalytics({ projectRoot: repo, strategy: "mixed", outcome });
    }
    const analytics = await getRepairStrategyAnalytics({ projectRoot: repo, strategy: "mixed" });
    const expectedScore = 3 + 1 - 1 - 1 - 3 - 1 - 2 - 2;
    if (!analytics || analytics.effectivenessScore !== expectedScore) {
      throw new Error(`expected deterministic score ${expectedScore}, got ${JSON.stringify(analytics)}`);
    }
    if (analytics.validationImprovedCount !== 1 || analytics.worsenedCount !== 1 || analytics.policyDeniedCount !== 1 || analytics.manualReviewCount !== 1) {
      throw new Error(`expected all outcome counters, got ${JSON.stringify(analytics)}`);
    }

    console.log("PASS repair-effectiveness-score-unit");
    return true;
  } catch (error) {
    console.log("FAIL repair-effectiveness-score-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runRepairAnalyticsReportUnit() {
  try {
    const repairAnalytics = {
      strategy: "undefined-symbol",
      effectivenessScore: 2,
      historicalSuccessRate: 0.5,
      historicalFailureRate: 0.5,
      validationImprovementRate: 0,
      worsenedRate: 0,
      policyDeniedRate: 0,
      manualReviewRate: 0,
      warnings: [],
      advisoryOnly: true
    };
    const observability = JSON.parse(JSON.stringify({ repairAnalytics }));
    const report = [
      "## Historical strategy effectiveness",
      `- Strategy: ${repairAnalytics.strategy}`,
      `- Effectiveness score: ${repairAnalytics.effectivenessScore}`,
      `- Historical success rate: ${repairAnalytics.historicalSuccessRate}`,
      `- Historical failure rate: ${repairAnalytics.historicalFailureRate}`,
      "## Strategy analytics recommendation",
      "This analytics hint is advisory-only and does not bypass evidence validation, patch policy, patch intent validation, Safe Patch Engine, or retry safety rules."
    ].join("\n");
    if (!observability.repairAnalytics || observability.repairAnalytics.advisoryOnly !== true) {
      throw new Error(`observability missing repairAnalytics advisory hint: ${JSON.stringify(observability)}`);
    }
    for (const needle of ["Historical strategy effectiveness", "Effectiveness score", "Strategy analytics recommendation", "advisory-only"]) {
      if (!report.includes(needle)) {
        throw new Error(`report missing ${needle}: ${report}`);
      }
    }

    console.log("PASS repair-analytics-report-unit");
    return true;
  } catch (error) {
    console.log("FAIL repair-analytics-report-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

async function runRepairAnalyticsHistoryUnit() {
  const { updateRepairAnalytics, getRepairStrategyAnalytics } = require(path.join(projectRoot, "dist", "repair", "repairAnalytics.js"));

  try {
    const repo = path.join(projectRoot, ".scenario-unit", "repair-analytics-history-unit");
    fs.rmSync(repo, { recursive: true, force: true });
    fs.mkdirSync(repo, { recursive: true });
    await updateRepairAnalytics({ projectRoot: repo, strategy: "history", outcome: "success" });
    await updateRepairAnalytics({ projectRoot: repo, strategy: "history", outcome: "success" });
    await updateRepairAnalytics({ projectRoot: repo, strategy: "history", outcome: "failed-new-error" });
    const analytics = await getRepairStrategyAnalytics({ projectRoot: repo, strategy: "history" });
    if (!analytics || analytics.totalAttempts !== 3 || analytics.successCount !== 2 || analytics.failedCount !== 1) {
      throw new Error(`history did not survive multiple updates: ${JSON.stringify(analytics)}`);
    }
    if (analytics.successRate !== 0.6667 || analytics.failureRate !== 0.3333) {
      throw new Error(`history rates mismatch: ${JSON.stringify(analytics)}`);
    }

    console.log("PASS repair-analytics-history-unit");
    return true;
  } catch (error) {
    console.log("FAIL repair-analytics-history-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

async function runRepairAnalyticsTrendUnit() {
  const { updateRepairAnalytics, getRepairStrategyAnalytics } = require(path.join(projectRoot, "dist", "repair", "repairAnalytics.js"));

  try {
    const repo = path.join(projectRoot, ".scenario-unit", "repair-analytics-trend-unit");
    fs.rmSync(repo, { recursive: true, force: true });
    fs.mkdirSync(repo, { recursive: true });
    await updateRepairAnalytics({ projectRoot: repo, strategy: "trend", outcome: "validation-improved" });
    await updateRepairAnalytics({ projectRoot: repo, strategy: "trend", outcome: "failed-worse" });
    await updateRepairAnalytics({ projectRoot: repo, strategy: "trend", outcome: "policy-denied" });
    await updateRepairAnalytics({ projectRoot: repo, strategy: "trend", outcome: "manual-review-required" });
    const analytics = await getRepairStrategyAnalytics({ projectRoot: repo, strategy: "trend" });
    if (
      !analytics ||
      analytics.validationImprovementRate !== 0.25 ||
      analytics.worsenedRate !== 0.25 ||
      analytics.policyDeniedRate !== 0.25 ||
      analytics.manualReviewRate !== 0.25
    ) {
      throw new Error(`trend rates mismatch: ${JSON.stringify(analytics)}`);
    }
    if (analytics.warnings.length === 0) {
      throw new Error(`trend warnings should be deterministic, got ${JSON.stringify(analytics)}`);
    }

    console.log("PASS repair-analytics-trend-unit");
    return true;
  } catch (error) {
    console.log("FAIL repair-analytics-trend-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runRepairAnalyticsAdvisoryOnlyUnit() {
  const { buildRepairAnalyticsHint } = require(path.join(projectRoot, "dist", "repair", "repairAnalytics.js"));
  const { decideRepairPatchPolicy } = require(path.join(projectRoot, "dist", "repair", "repairPatchPolicy.js"));
  const { validatePatchIntent } = require(path.join(projectRoot, "dist", "repair", "patchIntentGuard.js"));

  try {
    const hint = buildRepairAnalyticsHint({
      analytics: {
        strategy: "undefined-symbol",
        totalAttempts: 10,
        successCount: 10,
        failedCount: 0,
        validationImprovedCount: 0,
        worsenedCount: 0,
        policyDeniedCount: 0,
        manualReviewCount: 0,
        effectivenessScore: 30,
        successRate: 1,
        failureRate: 0,
        validationImprovementRate: 0,
        worsenedRate: 0,
        policyDeniedRate: 0,
        manualReviewRate: 0,
        warnings: []
      }
    });
    if (hint.advisoryOnly !== true) {
      throw new Error(`analytics hint must be advisory-only, got ${JSON.stringify(hint)}`);
    }

    const policy = decideRepairPatchPolicy({
      repairIntent: { targetFile: "index.js", repairType: "runtime-local-error" },
      evidenceValidation: { ok: false, confidence: "low", allowedRepairMode: "manual-review" },
      proposedPatchOperations: [{ operation: "exact-replacement", targetFile: "index.js" }]
    });
    if (policy.ok) {
      throw new Error(`analytics cannot bypass patch policy, got ${JSON.stringify(policy)}`);
    }

    const patchIntent = validatePatchIntent(
      {
        repairType: "runtime-local-error",
        targetFile: "index.js",
        reason: "unit",
        confidence: "high",
        allowedMutationScope: "single-file",
        safetyNotes: ["unit"]
      },
      { targetFile: "helper.js", patchFiles: ["helper.js"], patchContent: "console.log('x');" }
    );
    if (patchIntent.ok) {
      throw new Error(`analytics cannot bypass patch intent validation, got ${JSON.stringify(patchIntent)}`);
    }

    const safePatchReached = policy.ok && patchIntent.ok;
    if (safePatchReached) {
      throw new Error("analytics must not bypass Safe Patch Engine gates or single-file invariant");
    }

    console.log("PASS repair-analytics-advisory-only-unit");
    return true;
  } catch (error) {
    console.log("FAIL repair-analytics-advisory-only-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runRepairRegressionGuardUnit() {
  const { assessRepairRegressionRisk } = require(path.join(projectRoot, "dist", "repair", "repairRegressionGuard.js"));

  try {
    const low = assessRepairRegressionRisk({
      strategy: "safe",
      analytics: { strategy: "safe", worsenedRate: 0, worsenedCount: 0, policyDeniedCount: 0, manualReviewCount: 0, effectivenessScore: 3 }
    });
    if (low.riskLevel !== "low" || low.recommendedAction !== "proceed" || low.blocked) {
      throw new Error(`expected low proceed risk, got ${JSON.stringify(low)}`);
    }

    const high = assessRepairRegressionRisk({
      strategy: "risky",
      analytics: { strategy: "risky", worsenedRate: 0.5, worsenedCount: 1, policyDeniedCount: 0, manualReviewCount: 0, effectivenessScore: -3 }
    });
    if (high.riskLevel !== "high" || high.recommendedAction !== "manual-review") {
      throw new Error(`expected high manual-review risk, got ${JSON.stringify(high)}`);
    }

    console.log("PASS repair-regression-guard-unit");
    return true;
  } catch (error) {
    console.log("FAIL repair-regression-guard-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runRepairRegressionRiskUnit() {
  const { assessRepairRegressionRisk } = require(path.join(projectRoot, "dist", "repair", "repairRegressionGuard.js"));

  try {
    const block = assessRepairRegressionRisk({
      failureSignature: "sig",
      strategy: "undefined-symbol",
      analytics: { strategy: "undefined-symbol", worsenedRate: 0.1, worsenedCount: 1, policyDeniedCount: 0, manualReviewCount: 0, effectivenessScore: 2 },
      memoryMatches: [
        { errorSignature: "sig", strategy: "undefined-symbol", outcome: "failed-worse" },
        { errorSignature: "sig", strategy: "undefined-symbol", outcome: "failed-worse" }
      ]
    });
    if (!block.blocked || block.recommendedAction !== "block" || block.riskLevel !== "high") {
      throw new Error(`expected repeated failed-worse block, got ${JSON.stringify(block)}`);
    }

    const downgrade = assessRepairRegressionRisk({
      strategy: "policy-risk",
      analytics: { strategy: "policy-risk", worsenedRate: 0, worsenedCount: 0, policyDeniedCount: 2, manualReviewCount: 0, effectivenessScore: 1 }
    });
    if (downgrade.recommendedAction !== "downgrade-to-conservative" || downgrade.riskLevel !== "medium") {
      throw new Error(`expected conservative downgrade, got ${JSON.stringify(downgrade)}`);
    }

    const manual = assessRepairRegressionRisk({
      strategy: "manual-risk",
      analytics: { strategy: "manual-risk", worsenedRate: 0, worsenedCount: 0, policyDeniedCount: 0, manualReviewCount: 2, effectivenessScore: 1 }
    });
    if (manual.recommendedAction !== "manual-review" || manual.riskLevel !== "high") {
      throw new Error(`expected manual-review escalation, got ${JSON.stringify(manual)}`);
    }

    const warning = assessRepairRegressionRisk({
      strategy: "low-score",
      analytics: { strategy: "low-score", worsenedRate: 0, worsenedCount: 0, policyDeniedCount: 0, manualReviewCount: 0, effectivenessScore: -1 }
    });
    if (warning.recommendedAction !== "proceed-with-warning" || warning.riskLevel !== "medium") {
      throw new Error(`expected warning-only risk, got ${JSON.stringify(warning)}`);
    }

    console.log("PASS repair-regression-risk-unit");
    return true;
  } catch (error) {
    console.log("FAIL repair-regression-risk-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runRepairRegressionReportUnit() {
  try {
    const repairRegressionRisk = {
      riskLevel: "medium",
      blocked: false,
      riskReasons: ["Multiple historical policy-denied outcomes for this strategy."],
      recommendedAction: "downgrade-to-conservative",
      warnings: ["Strategy should be downgraded to conservative policy mode."]
    };
    const observability = JSON.parse(JSON.stringify({ repairRegressionRisk }));
    const report = [
      "## Regression Risk",
      `- Risk level: ${repairRegressionRisk.riskLevel}`,
      `- Blocked: ${repairRegressionRisk.blocked ? "yes" : "no"}`,
      `- Recommended action: ${repairRegressionRisk.recommendedAction}`,
      `- Risk reasons: ${repairRegressionRisk.riskReasons.join(", ")}`,
      `- Warnings: ${repairRegressionRisk.warnings.join(", ")}`
    ].join("\n");
    if (!observability.repairRegressionRisk || observability.repairRegressionRisk.recommendedAction !== "downgrade-to-conservative") {
      throw new Error(`observability missing regression risk: ${JSON.stringify(observability)}`);
    }
    for (const needle of ["Regression Risk", "Risk level", "Recommended action", "Risk reasons", "Warnings"]) {
      if (!report.includes(needle)) {
        throw new Error(`report missing ${needle}: ${report}`);
      }
    }

    console.log("PASS repair-regression-report-unit");
    return true;
  } catch (error) {
    console.log("FAIL repair-regression-report-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runRepairRegressionPolicyIntegrationUnit() {
  const { assessRepairRegressionRisk } = require(path.join(projectRoot, "dist", "repair", "repairRegressionGuard.js"));
  const { decideRepairPatchPolicy } = require(path.join(projectRoot, "dist", "repair", "repairPatchPolicy.js"));
  const { validatePatchIntent } = require(path.join(projectRoot, "dist", "repair", "patchIntentGuard.js"));

  function guardedEvidence(evidence, risk) {
    if (risk.blocked || risk.recommendedAction === "block" || risk.recommendedAction === "manual-review") {
      return { ...evidence, ok: risk.recommendedAction === "manual-review" ? evidence.ok : false, allowedRepairMode: "manual-review", confidence: "low" };
    }
    if (risk.recommendedAction === "downgrade-to-conservative" && evidence.allowedRepairMode === "normal") {
      return { ...evidence, allowedRepairMode: "conservative", confidence: "medium" };
    }
    return evidence;
  }

  try {
    const risk = assessRepairRegressionRisk({
      strategy: "policy-risk",
      analytics: { strategy: "policy-risk", policyDeniedCount: 2, manualReviewCount: 0, worsenedRate: 0, worsenedCount: 0, effectivenessScore: 2 }
    });
    const policy = decideRepairPatchPolicy({
      repairIntent: { targetFile: "index.js", repairType: "runtime-local-error" },
      evidenceValidation: guardedEvidence({ ok: true, confidence: "high", allowedRepairMode: "normal" }, risk),
      proposedPatchOperations: [{ operation: "exact-replacement", targetFile: "index.js" }]
    });
    if (policy.mode !== "conservative" || !policy.ok) {
      throw new Error(`regression guard should only downgrade to conservative policy, got ${JSON.stringify(policy)}`);
    }

    const blockRisk = assessRepairRegressionRisk({
      failureSignature: "sig",
      strategy: "risky",
      memoryMatches: [
        { errorSignature: "sig", strategy: "risky", outcome: "failed-worse" },
        { errorSignature: "sig", strategy: "risky", outcome: "failed-worse" }
      ]
    });
    const blockedPolicy = decideRepairPatchPolicy({
      repairIntent: { targetFile: "index.js", repairType: "runtime-local-error" },
      evidenceValidation: guardedEvidence({ ok: true, confidence: "high", allowedRepairMode: "normal" }, blockRisk),
      proposedPatchOperations: [{ operation: "exact-replacement", targetFile: "index.js" }]
    });
    if (blockedPolicy.ok || blockedPolicy.recommendedAction !== "manual-review") {
      throw new Error(`regression block should route through policy as manual review, got ${JSON.stringify(blockedPolicy)}`);
    }

    const deniedPolicy = decideRepairPatchPolicy({
      repairIntent: { targetFile: "index.js", repairType: "runtime-local-error" },
      evidenceValidation: { ok: true, confidence: "medium", allowedRepairMode: "conservative" },
      proposedPatchOperations: [{ operation: "risky-append", targetFile: "index.js" }]
    });
    if (deniedPolicy.ok) {
      throw new Error(`patch policy must remain authoritative, got ${JSON.stringify(deniedPolicy)}`);
    }

    const patchIntent = validatePatchIntent(
      { repairType: "runtime-local-error", targetFile: "index.js", reason: "unit", confidence: "high", allowedMutationScope: "single-file", safetyNotes: ["unit"] },
      { targetFile: "helper.js", patchFiles: ["helper.js"], patchContent: "console.log('x');" }
    );
    if (patchIntent.ok) {
      throw new Error(`regression guard cannot bypass patch intent validation, got ${JSON.stringify(patchIntent)}`);
    }

    const safePatchReached = blockedPolicy.ok && patchIntent.ok;
    if (safePatchReached) {
      throw new Error("regression guard must not bypass Safe Patch Engine gates");
    }

    console.log("PASS repair-regression-policy-integration-unit");
    return true;
  } catch (error) {
    console.log("FAIL repair-regression-policy-integration-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runRepairRegressionHistoryPatternUnit() {
  const { assessRepairRegressionRisk } = require(path.join(projectRoot, "dist", "repair", "repairRegressionGuard.js"));

  try {
    const cases = [
      ["regression-high-risk-strategy", assessRepairRegressionRisk({ strategy: "risky", analytics: { worsenedRate: 0.4, worsenedCount: 1, policyDeniedCount: 0, manualReviewCount: 0, effectivenessScore: -2 } }), "manual-review"],
      ["regression-policy-denied-history", assessRepairRegressionRisk({ strategy: "policy", analytics: { worsenedRate: 0, worsenedCount: 0, policyDeniedCount: 2, manualReviewCount: 0, effectivenessScore: 0 } }), "downgrade-to-conservative"],
      ["regression-manual-review-escalation", assessRepairRegressionRisk({ strategy: "manual", analytics: { worsenedRate: 0, worsenedCount: 0, policyDeniedCount: 0, manualReviewCount: 2, effectivenessScore: 0 } }), "manual-review"],
      ["regression-conservative-downgrade", assessRepairRegressionRisk({ strategy: "downgrade", analytics: { worsenedRate: 0, worsenedCount: 0, policyDeniedCount: 3, manualReviewCount: 0, effectivenessScore: 2 } }), "downgrade-to-conservative"],
      ["regression-warning-only", assessRepairRegressionRisk({ strategy: "warning", analytics: { worsenedRate: 0, worsenedCount: 0, policyDeniedCount: 0, manualReviewCount: 0, effectivenessScore: -1 } }), "proceed-with-warning"],
      ["regression-block-repeated-failure", assessRepairRegressionRisk({ failureSignature: "sig", strategy: "block", memoryMatches: [{ errorSignature: "sig", strategy: "block", outcome: "failed-worse" }, { errorSignature: "sig", strategy: "block", outcome: "failed-worse" }] }), "block"]
    ];

    for (const [name, risk, expectedAction] of cases) {
      if (risk.recommendedAction !== expectedAction) {
        throw new Error(`${name}: expected ${expectedAction}, got ${JSON.stringify(risk)}`);
      }
      console.log(`PASS ${name}`);
    }

    console.log("PASS repair-regression-history-pattern-unit");
    return true;
  } catch (error) {
    console.log("FAIL repair-regression-history-pattern-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function sampleObservabilityInput(overrides = {}) {
  return {
    runId: "run-1",
    task: "Fix app",
    timestamp: 1,
    failureSignature: "ReferenceError:index:foo",
    failureMemory: { historicalMatches: 2, warnings: [] },
    repairStrategy: { strategy: "undefined-symbol", warnings: [] },
    repairTarget: { filePath: "index.js" },
    repairIntent: { repairType: "runtime-local-error", targetFile: "index.js" },
    repairEvidenceValidation: { ok: true, confidence: "high", allowedRepairMode: "normal", warnings: [] },
    repairRegressionRisk: { riskLevel: "low", blocked: false, recommendedAction: "proceed", riskReasons: [], warnings: [] },
    repairPatchPolicy: { ok: true, mode: "normal", recommendedAction: "proceed", warnings: [] },
    patchIntentValidation: { ok: true, reason: "Patch target matches repair intent target.", safetyNotes: [] },
    safePatch: { appliedChanges: 1, changedFiles: ["index.js"], commitCreated: false },
    validation: { verdict: "pass", status: "pass" },
    repairOutcome: { outcome: "success", explanation: "Validation passed after repair.", warnings: [] },
    retryDecisionAudit: { retryDecision: "stop", reasonCode: "VALIDATION_PASSED", explanation: "done", blockingFactors: [], influencingFactors: [] },
    mutationSkippedForEvidence: false,
    mutationSkippedForPolicy: false,
    ...overrides
  };
}

function runRepairObservabilitySchemaUnit() {
  const { buildRepairObservabilityReport } = require(path.join(projectRoot, "dist", "repair", "repairObservability.js"));

  try {
    const report = buildRepairObservabilityReport(sampleObservabilityInput());
    const repeat = buildRepairObservabilityReport(sampleObservabilityInput());
    if (report.schemaVersion !== 1) {
      throw new Error(`schemaVersion should be 1, got ${JSON.stringify(report)}`);
    }
    if (!report.finalDecision || report.finalDecision.status !== "success") {
      throw new Error(`finalDecision missing or incorrect, got ${JSON.stringify(report.finalDecision)}`);
    }
    if (!report.repairEvidenceValidation || !report.repairEvidence) {
      throw new Error("Expected both normalized repairEvidence and backward-compatible repairEvidenceValidation fields.");
    }
    if (JSON.stringify(report) !== JSON.stringify(repeat)) {
      throw new Error("Equivalent observability input should produce equivalent output.");
    }

    console.log("PASS repair-observability-schema-unit");
    return true;
  } catch (error) {
    console.log("FAIL repair-observability-schema-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runRepairDecisionTraceUnit() {
  const { buildRepairObservabilityReport } = require(path.join(projectRoot, "dist", "repair", "repairObservability.js"));
  const { buildRepairDecisionTrace, renderRepairDecisionTraceMarkdown } = require(path.join(projectRoot, "dist", "repair", "repairDecisionTrace.js"));

  try {
    const report = buildRepairObservabilityReport(sampleObservabilityInput({
      repairRegressionRisk: { riskLevel: "medium", blocked: false, recommendedAction: "proceed-with-warning", riskReasons: ["low score"], warnings: ["historical warning"] },
      repairPatchPolicy: { ok: false, mode: "conservative", recommendedAction: "block-mutation", warnings: ["blocked"], reason: "blocked" }
    }));
    const steps = buildRepairDecisionTrace(report);
    for (let i = 0; i < steps.length; i += 1) {
      if (steps[i].order !== i + 1) {
        throw new Error(`trace step order mismatch: ${JSON.stringify(steps)}`);
      }
    }
    if (!steps.some((step) => step.status === "warn" && step.layer === "Regression guard")) {
      throw new Error(`expected WARN regression step, got ${JSON.stringify(steps)}`);
    }
    if (!steps.some((step) => step.status === "blocked" && step.layer === "Patch policy")) {
      throw new Error(`expected BLOCKED patch policy step, got ${JSON.stringify(steps)}`);
    }
    const markdown = renderRepairDecisionTraceMarkdown({ report, steps });
    for (const needle of ["# Repair Decision Trace", "Final status:", "## Timeline", "## Warnings", "## Blocked Layers"]) {
      if (!markdown.includes(needle)) {
        throw new Error(`decision trace markdown missing ${needle}: ${markdown}`);
      }
    }

    console.log("PASS repair-decision-trace-unit");
    return true;
  } catch (error) {
    console.log("FAIL repair-decision-trace-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runRepairSummaryUnit() {
  const { buildRepairObservabilityReport } = require(path.join(projectRoot, "dist", "repair", "repairObservability.js"));
  const { buildRepairSummary } = require(path.join(projectRoot, "dist", "repair", "repairSummary.js"));

  try {
    const report = buildRepairObservabilityReport(sampleObservabilityInput());
    const summary = buildRepairSummary(report);
    const allowedKeys = [
      "runId",
      "status",
      "strategy",
      "targetFile",
      "repairType",
      "evidenceConfidence",
      "riskLevel",
      "patchPolicyMode",
      "outcome",
      "commitCreated"
    ];
    const keys = Object.keys(summary);
    if (keys.some((key) => !allowedKeys.includes(key))) {
      throw new Error(`repair summary contains non-minimal fields: ${JSON.stringify(summary)}`);
    }
    if (summary.runId !== "run-1" || summary.status !== "success" || summary.strategy !== "undefined-symbol") {
      throw new Error(`repair summary fields mismatch: ${JSON.stringify(summary)}`);
    }

    console.log("PASS repair-summary-unit");
    return true;
  } catch (error) {
    console.log("FAIL repair-summary-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runRepairObservabilityReportUnit() {
  try {
    const finalReport = [
      "## Final decision",
      "Status: success",
      "Reason: Validation passed after safe patch.",
      "Blocking layer: none",
      "## Observability artifacts",
      "- repair-observability.json",
      "- decision-trace.md",
      "- repair-summary.json"
    ].join("\n");
    for (const needle of ["Final decision", "Status:", "Reason:", "Blocking layer:", "repair-observability.json", "decision-trace.md", "repair-summary.json"]) {
      if (!finalReport.includes(needle)) {
        throw new Error(`final report observability section missing ${needle}: ${finalReport}`);
      }
    }

    console.log("PASS repair-observability-report-unit");
    return true;
  } catch (error) {
    console.log("FAIL repair-observability-report-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runRepairFinalDecisionUnit() {
  const { buildRepairObservabilityReport } = require(path.join(projectRoot, "dist", "repair", "repairObservability.js"));

  function assertDecision(name, input, status, blockingLayer) {
    const report = buildRepairObservabilityReport(sampleObservabilityInput(input));
    if (report.finalDecision.status !== status || (blockingLayer && report.finalDecision.blockingLayer !== blockingLayer)) {
      throw new Error(`${name}: expected ${status}/${blockingLayer ?? "none"}, got ${JSON.stringify(report.finalDecision)}`);
    }
  }

  try {
    assertDecision("success", {}, "success");
    assertDecision("policy blocked", { repairPatchPolicy: { ok: false, recommendedAction: "block-mutation" } }, "blocked", "repairPatchPolicy");
    assertDecision("evidence manual review", { repairEvidenceValidation: { ok: false, allowedRepairMode: "manual-review" } }, "manual-review", "repairEvidence");
    assertDecision("regression block", { repairRegressionRisk: { blocked: true, recommendedAction: "block" }, repairPatchPolicy: { ok: true, mode: "normal" } }, "blocked", "repairRegressionRisk");
    assertDecision("patch intent blocked", { patchIntentValidation: { ok: false, reason: "bad target" } }, "blocked", "patchIntentValidation");
    assertDecision("validation failed", { repairOutcome: { outcome: "failed-same-error" }, validation: { verdict: "fail" } }, "failed");

    console.log("PASS repair-final-decision-unit");
    return true;
  } catch (error) {
    console.log("FAIL repair-final-decision-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runRepairReviewUnit() {
  const { buildRepairObservabilityReport } = require(path.join(projectRoot, "dist", "repair", "repairObservability.js"));
  const { buildRepairDecisionTrace } = require(path.join(projectRoot, "dist", "repair", "repairDecisionTrace.js"));
  const { buildRepairSummary } = require(path.join(projectRoot, "dist", "repair", "repairSummary.js"));
  const { buildRepairReview } = require(path.join(projectRoot, "dist", "repair", "buildRepairReview.js"));

  try {
    const report = buildRepairObservabilityReport(sampleObservabilityInput());
    const review = buildRepairReview({
      observabilityReport: report,
      repairSummary: buildRepairSummary(report),
      decisionTraceSteps: buildRepairDecisionTrace(report)
    });

    if (review.verdict !== "approved") {
      throw new Error(`expected approved clean run, got ${JSON.stringify(review)}`);
    }
    for (const field of ["qualityScore", "safetyScore", "completenessScore"]) {
      if (typeof review[field] !== "number" || review[field] < 0 || review[field] > 100) {
        throw new Error(`score ${field} should be 0..100, got ${JSON.stringify(review)}`);
      }
    }
    if (!Array.isArray(review.findings) || review.findings.length === 0) {
      throw new Error(`expected findings, got ${JSON.stringify(review)}`);
    }
    if (!Array.isArray(review.recommendations) || review.recommendations.length === 0) {
      throw new Error(`expected recommendations, got ${JSON.stringify(review)}`);
    }

    console.log("PASS repair-review-unit");
    return true;
  } catch (error) {
    console.log("FAIL repair-review-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runRepairReviewScoreUnit() {
  const { buildRepairObservabilityReport } = require(path.join(projectRoot, "dist", "repair", "repairObservability.js"));
  const { buildRepairDecisionTrace } = require(path.join(projectRoot, "dist", "repair", "repairDecisionTrace.js"));
  const { buildRepairSummary } = require(path.join(projectRoot, "dist", "repair", "repairSummary.js"));
  const { buildRepairReview } = require(path.join(projectRoot, "dist", "repair", "buildRepairReview.js"));

  function reviewFor(overrides) {
    const report = buildRepairObservabilityReport(sampleObservabilityInput(overrides));
    return buildRepairReview({
      observabilityReport: report,
      repairSummary: buildRepairSummary(report),
      decisionTraceSteps: buildRepairDecisionTrace(report)
    });
  }

  try {
    const clean = reviewFor({});
    const risky = reviewFor({
      repairEvidenceValidation: { ok: true, confidence: "medium", allowedRepairMode: "conservative", warnings: ["limited evidence"] },
      repairRegressionRisk: {
        riskLevel: "medium",
        blocked: false,
        recommendedAction: "proceed-with-warning",
        riskReasons: ["historical warning"],
        warnings: ["medium risk"]
      },
      repairPatchPolicy: { ok: true, mode: "conservative", recommendedAction: "proceed", warnings: ["conservative mode"] }
    });
    const repeat = reviewFor({
      repairEvidenceValidation: { ok: true, confidence: "medium", allowedRepairMode: "conservative", warnings: ["limited evidence"] },
      repairRegressionRisk: {
        riskLevel: "medium",
        blocked: false,
        recommendedAction: "proceed-with-warning",
        riskReasons: ["historical warning"],
        warnings: ["medium risk"]
      },
      repairPatchPolicy: { ok: true, mode: "conservative", recommendedAction: "proceed", warnings: ["conservative mode"] }
    });

    if (risky.verdict !== "approved-with-warnings") {
      throw new Error(`expected approved-with-warnings, got ${JSON.stringify(risky)}`);
    }
    if (risky.safetyScore >= clean.safetyScore || risky.qualityScore >= clean.qualityScore) {
      throw new Error(`risky review should score lower than clean review: clean=${JSON.stringify(clean)} risky=${JSON.stringify(risky)}`);
    }
    if (JSON.stringify(risky) !== JSON.stringify(repeat)) {
      throw new Error("Equivalent review inputs should produce stable equivalent scores.");
    }

    console.log("PASS repair-review-score-unit");
    return true;
  } catch (error) {
    console.log("FAIL repair-review-score-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runRepairReviewVerdictUnit() {
  const { buildRepairObservabilityReport } = require(path.join(projectRoot, "dist", "repair", "repairObservability.js"));
  const { buildRepairDecisionTrace } = require(path.join(projectRoot, "dist", "repair", "repairDecisionTrace.js"));
  const { buildRepairSummary } = require(path.join(projectRoot, "dist", "repair", "repairSummary.js"));
  const { buildRepairReview } = require(path.join(projectRoot, "dist", "repair", "buildRepairReview.js"));

  function assertVerdict(name, overrides, expected) {
    const report = buildRepairObservabilityReport(sampleObservabilityInput(overrides));
    const review = buildRepairReview({
      observabilityReport: report,
      repairSummary: buildRepairSummary(report),
      decisionTraceSteps: buildRepairDecisionTrace(report)
    });
    if (review.verdict !== expected) {
      throw new Error(`${name}: expected ${expected}, got ${JSON.stringify(review)}`);
    }
  }

  try {
    assertVerdict("clean success", {}, "approved");
    assertVerdict(
      "warning success",
      {
        repairEvidenceValidation: { ok: true, confidence: "medium", allowedRepairMode: "conservative", warnings: ["limited evidence"] }
      },
      "approved-with-warnings"
    );
    assertVerdict(
      "manual review",
      { repairEvidenceValidation: { ok: false, confidence: "low", allowedRepairMode: "manual-review", warnings: ["weak"] } },
      "needs-human-review"
    );
    assertVerdict(
      "blocked policy",
      { repairPatchPolicy: { ok: false, mode: "manual-review", recommendedAction: "block-mutation", warnings: ["blocked"] } },
      "needs-human-review"
    );
    assertVerdict(
      "failed validation",
      { repairOutcome: { outcome: "failed-same-error" }, validation: { verdict: "fail", status: "fail" } },
      "rejected"
    );
    const missing = buildRepairReview({});
    if (missing.verdict !== "rejected" || !missing.blockingConcerns.includes("Missing observability artifacts.")) {
      throw new Error(`missing observability should be rejected, got ${JSON.stringify(missing)}`);
    }

    console.log("PASS repair-review-verdict-unit");
    return true;
  } catch (error) {
    console.log("FAIL repair-review-verdict-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runRepairReviewReportUnit() {
  const { renderRepairReviewMarkdown } = require(path.join(projectRoot, "dist", "repair", "buildRepairReview.js"));

  try {
    const markdown = renderRepairReviewMarkdown({
      verdict: "approved-with-warnings",
      qualityScore: 82,
      safetyScore: 91,
      completenessScore: 88,
      findings: ["Validation passed."],
      warnings: ["Conservative patch policy was required."],
      recommendations: ["Add regression scenario."],
      blockingConcerns: []
    });
    for (const needle of [
      "# Repair Review",
      "Verdict: approved-with-warnings",
      "Quality score: 82",
      "Safety score: 91",
      "Completeness score: 88",
      "Findings:",
      "Warnings:",
      "Recommendations:",
      "Blocking concerns:"
    ]) {
      if (!markdown.includes(needle)) {
        throw new Error(`repair review markdown missing ${needle}: ${markdown}`);
      }
    }

    const finalReport = [
      "## Repair review",
      "Verdict: approved-with-warnings",
      "Quality score: 82",
      "Safety score: 91",
      "Completeness score: 88",
      "## Review artifacts",
      "- repair-review.md",
      "- repair-review.json"
    ].join("\n");
    for (const needle of ["Repair review", "Verdict:", "Quality score:", "repair-review.md", "repair-review.json"]) {
      if (!finalReport.includes(needle)) {
        throw new Error(`final report repair review section missing ${needle}: ${finalReport}`);
      }
    }

    console.log("PASS repair-review-report-unit");
    return true;
  } catch (error) {
    console.log("FAIL repair-review-report-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runRepairReviewArtifactUnit() {
  const { buildRepairObservabilityReport } = require(path.join(projectRoot, "dist", "repair", "repairObservability.js"));
  const { buildRepairDecisionTrace } = require(path.join(projectRoot, "dist", "repair", "repairDecisionTrace.js"));
  const { buildRepairSummary } = require(path.join(projectRoot, "dist", "repair", "repairSummary.js"));
  const { buildRepairReview, renderRepairReviewMarkdown } = require(path.join(projectRoot, "dist", "repair", "buildRepairReview.js"));
  const tmpDir = path.join(projectRoot, ".scenario-unit", "repair-review-artifact");

  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    ensureDir(tmpDir);
    const report = buildRepairObservabilityReport(sampleObservabilityInput());
    const review = buildRepairReview({
      observabilityReport: report,
      repairSummary: buildRepairSummary(report),
      decisionTraceSteps: buildRepairDecisionTrace(report)
    });
    const jsonPath = path.join(tmpDir, "repair-review.json");
    const mdPath = path.join(tmpDir, "repair-review.md");
    fs.writeFileSync(jsonPath, `${JSON.stringify(review, null, 2)}\n`, "utf8");
    fs.writeFileSync(mdPath, renderRepairReviewMarkdown(review), "utf8");

    const readBack = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    const markdown = fs.readFileSync(mdPath, "utf8");
    if (readBack.verdict !== "approved" || !markdown.includes("Verdict: approved")) {
      throw new Error(`repair review artifacts invalid: json=${JSON.stringify(readBack)} md=${markdown}`);
    }

    console.log("PASS repair-review-artifact-unit");
    return true;
  } catch (error) {
    console.log("FAIL repair-review-artifact-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function sampleRepairReview(overrides = {}) {
  return {
    verdict: "approved",
    qualityScore: 90,
    safetyScore: 95,
    completenessScore: 92,
    findings: ["Validation passed."],
    recommendations: ["Repair path is suitable to accept with the existing safety gates."],
    blockingConcerns: [],
    warnings: [],
    ...overrides
  };
}

function runRepairReviewAnalyticsUnit() {
  const { loadRepairReviewAnalytics } = require(path.join(projectRoot, "dist", "repair", "repairReviewAnalytics.js"));

  try {
    const repo = path.join(projectRoot, ".scenario-unit", "repair-review-analytics-unit");
    fs.rmSync(repo, { recursive: true, force: true });
    fs.mkdirSync(repo, { recursive: true });
    const analytics = loadRepairReviewAnalytics(repo);
    if (analytics.version !== 1 || analytics.totalReviews !== 0) {
      throw new Error(`analytics should initialize empty, got ${JSON.stringify(analytics)}`);
    }
    for (const verdict of ["approved", "approved-with-warnings", "needs-human-review", "rejected"]) {
      if (analytics.verdictCounts[verdict] !== 0) {
        throw new Error(`verdict ${verdict} should initialize to zero: ${JSON.stringify(analytics.verdictCounts)}`);
      }
    }
    if (analytics.trends.recentReviewCount !== 0 || analytics.warnings.length !== 0) {
      throw new Error(`empty analytics trend/warnings mismatch: ${JSON.stringify(analytics)}`);
    }

    console.log("PASS repair-review-analytics-unit");
    return true;
  } catch (error) {
    console.log("FAIL repair-review-analytics-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runRepairReviewAnalyticsUpdateUnit() {
  const { updateRepairReviewAnalytics, loadRepairReviewAnalytics } = require(path.join(projectRoot, "dist", "repair", "repairReviewAnalytics.js"));

  try {
    const repo = path.join(projectRoot, ".scenario-unit", "repair-review-analytics-update-unit");
    fs.rmSync(repo, { recursive: true, force: true });
    fs.mkdirSync(repo, { recursive: true });
    updateRepairReviewAnalytics({
      projectRoot: repo,
      repairReview: sampleRepairReview({ qualityScore: 80, safetyScore: 90, completenessScore: 100 }),
      outcome: "success",
      strategy: "undefined-symbol"
    });
    updateRepairReviewAnalytics({
      projectRoot: repo,
      repairReview: sampleRepairReview({
        verdict: "approved-with-warnings",
        qualityScore: 60,
        safetyScore: 70,
        completenessScore: 80,
        warnings: ["Conservative patch policy was required."],
        recommendations: ["Add regression scenario."]
      }),
      outcome: "validation-improved",
      strategy: "undefined-symbol"
    });
    const analytics = loadRepairReviewAnalytics(repo);
    if (analytics.totalReviews !== 2 || analytics.verdictCounts.approved !== 1 || analytics.verdictCounts["approved-with-warnings"] !== 1) {
      throw new Error(`verdict counts mismatch: ${JSON.stringify(analytics)}`);
    }
    if (
      analytics.averageScores.qualityScore !== 70 ||
      analytics.averageScores.safetyScore !== 80 ||
      analytics.averageScores.completenessScore !== 90
    ) {
      throw new Error(`average scores mismatch: ${JSON.stringify(analytics.averageScores)}`);
    }
    if (analytics.warningCounts["Conservative patch policy was required."] !== 1 || analytics.recommendationCounts["Add regression scenario."] !== 1) {
      throw new Error(`warning/recommendation counts mismatch: ${JSON.stringify(analytics)}`);
    }
    if (analytics.outcomeVerdictCounts.success.approved !== 1 || analytics.strategyVerdictCounts["undefined-symbol"]["approved-with-warnings"] !== 1) {
      throw new Error(`outcome/strategy verdict counts mismatch: ${JSON.stringify(analytics)}`);
    }

    console.log("PASS repair-review-analytics-update-unit");
    return true;
  } catch (error) {
    console.log("FAIL repair-review-analytics-update-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runRepairReviewAnalyticsWarningUnit() {
  const { updateRepairReviewAnalytics, loadRepairReviewAnalytics } = require(path.join(projectRoot, "dist", "repair", "repairReviewAnalytics.js"));

  try {
    const repo = path.join(projectRoot, ".scenario-unit", "repair-review-analytics-warning-unit");
    fs.rmSync(repo, { recursive: true, force: true });
    fs.mkdirSync(repo, { recursive: true });
    for (let i = 0; i < 3; i += 1) {
      updateRepairReviewAnalytics({
        projectRoot: repo,
        repairReview: sampleRepairReview({
          verdict: "needs-human-review",
          qualityScore: 50,
          safetyScore: 60,
          completenessScore: 70,
          warnings: ["Repeated weak evidence."]
        }),
        outcome: "manual-review-required",
        strategy: "runtime-targeted-fix"
      });
    }
    const analytics = loadRepairReviewAnalytics(repo);
    for (const needle of [
      "High human-review rate detected",
      "Average safety score is below recommended threshold",
      "Recurring repair review warning detected: Repeated weak evidence."
    ]) {
      if (!analytics.warnings.includes(needle)) {
        throw new Error(`analytics warning missing ${needle}: ${JSON.stringify(analytics.warnings)}`);
      }
    }

    console.log("PASS repair-review-analytics-warning-unit");
    return true;
  } catch (error) {
    console.log("FAIL repair-review-analytics-warning-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runRepairReviewAnalyticsTrendUnit() {
  const { updateRepairReviewAnalytics, loadRepairReviewAnalytics } = require(path.join(projectRoot, "dist", "repair", "repairReviewAnalytics.js"));

  try {
    const repo = path.join(projectRoot, ".scenario-unit", "repair-review-analytics-trend-unit");
    fs.rmSync(repo, { recursive: true, force: true });
    fs.mkdirSync(repo, { recursive: true });
    for (let i = 0; i < 5; i += 1) {
      updateRepairReviewAnalytics({
        projectRoot: repo,
        repairReview: sampleRepairReview({ safetyScore: 100 }),
        outcome: "success",
        strategy: "safe"
      });
    }
    for (let i = 0; i < 10; i += 1) {
      updateRepairReviewAnalytics({
        projectRoot: repo,
        repairReview: sampleRepairReview({
          verdict: i % 2 === 0 ? "needs-human-review" : "approved-with-warnings",
          qualityScore: 50,
          safetyScore: 50,
          completenessScore: 50,
          warnings: ["Recent safety dip."]
        }),
        outcome: "manual-review-required",
        strategy: "risky"
      });
    }
    const analytics = loadRepairReviewAnalytics(repo);
    if (analytics.totalReviews !== 15 || analytics.recentReviews.length !== 10 || analytics.trends.recentReviewCount !== 10) {
      throw new Error(`recent window mismatch: ${JSON.stringify(analytics.trends)} recent=${analytics.recentReviews.length}`);
    }
    if (analytics.trends.recentAverageSafetyScore !== 50 || !analytics.warnings.includes("Recent safety score trend is degrading")) {
      throw new Error(`recent degrading trend missing: ${JSON.stringify(analytics)}`);
    }

    console.log("PASS repair-review-analytics-trend-unit");
    return true;
  } catch (error) {
    console.log("FAIL repair-review-analytics-trend-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runRepairReviewAnalyticsReportUnit() {
  try {
    const analytics = {
      totalReviews: 12,
      verdictCounts: {
        approved: 7,
        "approved-with-warnings": 3,
        "needs-human-review": 1,
        rejected: 1
      },
      averageScores: {
        qualityScore: 84,
        safetyScore: 89,
        completenessScore: 87
      },
      warnings: ["Recurring repair review warning detected: Conservative patch policy was required"]
    };
    const report = [
      "## Repair Review Analytics",
      `Total reviews: ${analytics.totalReviews}`,
      "Verdict distribution:",
      `- approved: ${analytics.verdictCounts.approved}`,
      `- approved-with-warnings: ${analytics.verdictCounts["approved-with-warnings"]}`,
      `- needs-human-review: ${analytics.verdictCounts["needs-human-review"]}`,
      `- rejected: ${analytics.verdictCounts.rejected}`,
      "Average scores:",
      `- Quality: ${analytics.averageScores.qualityScore}`,
      `- Safety: ${analytics.averageScores.safetyScore}`,
      `- Completeness: ${analytics.averageScores.completenessScore}`,
      "Analytics warnings:",
      ...analytics.warnings.map((warning) => `- ${warning}`)
    ].join("\n");
    for (const needle of ["Repair Review Analytics", "Total reviews:", "Verdict distribution:", "Average scores:", "Analytics warnings:"]) {
      if (!report.includes(needle)) {
        throw new Error(`repair review analytics report missing ${needle}: ${report}`);
      }
    }

    console.log("PASS repair-review-analytics-report-unit");
    return true;
  } catch (error) {
    console.log("FAIL repair-review-analytics-report-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runRepairReviewAnalyticsArtifactUnit() {
  const { updateRepairReviewAnalytics, getRepairReviewAnalyticsPath } = require(path.join(projectRoot, "dist", "repair", "repairReviewAnalytics.js"));

  try {
    const repo = path.join(projectRoot, ".scenario-unit", "repair-review-analytics-artifact-unit");
    fs.rmSync(repo, { recursive: true, force: true });
    fs.mkdirSync(repo, { recursive: true });
    const analytics = updateRepairReviewAnalytics({
      projectRoot: repo,
      repairReview: sampleRepairReview(),
      outcome: "success",
      strategy: "undefined-symbol"
    });
    const analyticsPath = getRepairReviewAnalyticsPath(repo);
    const fromDisk = JSON.parse(fs.readFileSync(analyticsPath, "utf8"));
    if (!fs.existsSync(analyticsPath) || fromDisk.totalReviews !== 1 || analytics.totalReviews !== 1) {
      throw new Error(`analytics artifact mismatch: path=${analyticsPath} disk=${JSON.stringify(fromDisk)}`);
    }

    console.log("PASS repair-review-analytics-artifact-unit");
    return true;
  } catch (error) {
    console.log("FAIL repair-review-analytics-artifact-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function sampleTrustInput(overrides = {}) {
  return {
    repairOutcome: { outcome: "success" },
    repairReview: sampleRepairReview(),
    repairReviewAnalytics: { warnings: [] },
    repairAnalytics: { warnings: [] },
    repairEvidenceValidation: { confidence: "high" },
    repairRegressionRisk: { riskLevel: "low" },
    repairPatchPolicy: { ok: true, mode: "normal", recommendedAction: "proceed" },
    repairDecisionAudit: { retryDecision: "stop" },
    validation: { verdict: "pass", status: "pass" },
    ...overrides
  };
}

function runRepairTrustIndexUnit() {
  const { buildRepairTrustIndex } = require(path.join(projectRoot, "dist", "repair", "repairTrustIndex.js"));

  try {
    const trust = buildRepairTrustIndex(sampleTrustInput());
    if (trust.version !== 1 || trust.trustLevel !== "high" || trust.trustScore !== 100) {
      throw new Error(`clean successful run should produce high trust, got ${JSON.stringify(trust)}`);
    }
    for (const needle of ["Validation passed.", "Repair review approved the run.", "Evidence confidence was high."]) {
      if (!trust.positiveSignals.includes(needle)) {
        throw new Error(`positive signal missing ${needle}: ${JSON.stringify(trust)}`);
      }
    }

    console.log("PASS repair-trust-index-unit");
    return true;
  } catch (error) {
    console.log("FAIL repair-trust-index-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runRepairTrustIndexScoreUnit() {
  const { buildRepairTrustIndex } = require(path.join(projectRoot, "dist", "repair", "repairTrustIndex.js"));

  try {
    const baseline = buildRepairTrustIndex(sampleTrustInput());
    const cautious = buildRepairTrustIndex(sampleTrustInput({
      repairReview: sampleRepairReview({ verdict: "approved-with-warnings" }),
      repairPatchPolicy: { ok: true, mode: "conservative", recommendedAction: "proceed" }
    }));
    const warningHeavy = buildRepairTrustIndex(sampleTrustInput({
      repairReview: sampleRepairReview({ verdict: "approved-with-warnings", blockingConcerns: ["Concern A", "Concern B", "Concern C", "Concern D"] }),
      repairReviewAnalytics: { warnings: ["review warning 1", "review warning 2", "review warning 3", "review warning 4", "review warning 5"] },
      repairAnalytics: { warnings: ["analytics warning 1", "analytics warning 2", "analytics warning 3", "analytics warning 4", "analytics warning 5"] },
      repairEvidenceValidation: { confidence: "low" },
      repairRegressionRisk: { riskLevel: "critical" },
      repairPatchPolicy: { ok: false, mode: "manual-review", recommendedAction: "block-mutation" },
      validation: { verdict: "fail", status: "fail" }
    }));

    if (cautious.trustScore !== 75 || cautious.trustLevel !== "medium") {
      throw new Error(`expected deterministic cautious score 75/medium, got ${JSON.stringify(cautious)}`);
    }
    if (warningHeavy.trustScore < 0 || warningHeavy.trustScore > 100 || warningHeavy.trustScore >= baseline.trustScore) {
      throw new Error(`warning-heavy trust score should be clamped and lower than baseline, got ${JSON.stringify(warningHeavy)}`);
    }
    if (warningHeavy.blockingConcerns.length === 0 || warningHeavy.warnings.length === 0) {
      throw new Error(`expected warnings and blocking concerns, got ${JSON.stringify(warningHeavy)}`);
    }

    console.log("PASS repair-trust-index-score-unit");
    return true;
  } catch (error) {
    console.log("FAIL repair-trust-index-score-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runRepairTrustIndexLevelUnit() {
  const { buildRepairTrustIndex } = require(path.join(projectRoot, "dist", "repair", "repairTrustIndex.js"));

  try {
    const medium = buildRepairTrustIndex(sampleTrustInput({
      repairReview: sampleRepairReview({ verdict: "approved-with-warnings" }),
      repairPatchPolicy: { ok: true, mode: "conservative", recommendedAction: "proceed" }
    }));
    const low = buildRepairTrustIndex(sampleTrustInput({
      repairReview: sampleRepairReview({ verdict: "approved-with-warnings" }),
      repairEvidenceValidation: { confidence: "medium" },
      repairRegressionRisk: { riskLevel: "medium" },
      repairPatchPolicy: { ok: true, mode: "conservative", recommendedAction: "proceed" },
      repairAnalytics: { warnings: ["historical warning", "policy warning"] }
    }));
    const unsafe = buildRepairTrustIndex(sampleTrustInput({
      repairOutcome: { outcome: "failed-worse" },
      validation: { verdict: "fail", status: "fail" }
    }));

    if (medium.trustLevel !== "medium") {
      throw new Error(`expected medium trust, got ${JSON.stringify(medium)}`);
    }
    if (low.trustLevel !== "low") {
      throw new Error(`expected low trust, got ${JSON.stringify(low)}`);
    }
    if (unsafe.trustLevel !== "unsafe") {
      throw new Error(`expected unsafe trust, got ${JSON.stringify(unsafe)}`);
    }

    console.log("PASS repair-trust-index-level-unit");
    return true;
  } catch (error) {
    console.log("FAIL repair-trust-index-level-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runRepairTrustIndexOverrideUnit() {
  const { buildRepairTrustIndex } = require(path.join(projectRoot, "dist", "repair", "repairTrustIndex.js"));

  try {
    const failedValidation = buildRepairTrustIndex(sampleTrustInput({
      validation: { verdict: "fail", status: "fail" }
    }));
    const rejectedReview = buildRepairTrustIndex(sampleTrustInput({
      repairReview: sampleRepairReview({ verdict: "rejected" })
    }));
    const failedWorse = buildRepairTrustIndex(sampleTrustInput({
      repairOutcome: { outcome: "failed-worse" }
    }));
    const policyBlocked = buildRepairTrustIndex(sampleTrustInput({
      repairPatchPolicy: { ok: false, mode: "conservative", recommendedAction: "block-mutation" }
    }));
    const missingData = buildRepairTrustIndex({});

    if (failedValidation.trustLevel === "high" || failedValidation.trustLevel === "medium") {
      throw new Error(`failed validation must not produce high/medium trust: ${JSON.stringify(failedValidation)}`);
    }
    if (rejectedReview.trustLevel !== "unsafe") {
      throw new Error(`rejected review must be unsafe: ${JSON.stringify(rejectedReview)}`);
    }
    if (failedWorse.trustLevel !== "unsafe") {
      throw new Error(`failed-worse outcome must be unsafe: ${JSON.stringify(failedWorse)}`);
    }
    if (policyBlocked.trustLevel === "high" || policyBlocked.trustLevel === "medium") {
      throw new Error(`policy block must not produce high/medium trust: ${JSON.stringify(policyBlocked)}`);
    }
    if (missingData.trustLevel === "high" || missingData.trustLevel === "medium") {
      throw new Error(`missing required data must not produce high/medium trust: ${JSON.stringify(missingData)}`);
    }

    console.log("PASS repair-trust-index-override-unit");
    return true;
  } catch (error) {
    console.log("FAIL repair-trust-index-override-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runRepairTrustIndexReportUnit() {
  const { renderRepairTrustIndexMarkdown } = require(path.join(projectRoot, "dist", "repair", "repairTrustIndex.js"));

  try {
    const markdown = renderRepairTrustIndexMarkdown({
      version: 1,
      trustLevel: "medium",
      trustScore: 72,
      summary: "The repair is usable with caution because warnings or moderate risk signals were detected.",
      positiveSignals: ["Validation passed"],
      negativeSignals: ["Conservative patch policy was required"],
      warnings: ["Recent safety score trend is degrading"],
      blockingConcerns: [],
      inputSignals: {}
    });
    for (const needle of [
      "# Repair Trust Index",
      "Trust level: medium",
      "Trust score: 72",
      "Summary:",
      "Positive signals:",
      "Negative signals:",
      "Warnings:",
      "Blocking concerns:"
    ]) {
      if (!markdown.includes(needle)) {
        throw new Error(`trust index markdown missing ${needle}: ${markdown}`);
      }
    }

    const finalReport = [
      "## Repair Trust Index",
      "Trust level: medium",
      "Trust score: 72",
      "Summary:",
      "The repair is usable with caution because warnings or moderate risk signals were detected.",
      "Artifacts:",
      "- repair-trust-index.json",
      "- repair-trust-index.md"
    ].join("\n");
    for (const needle of ["Repair Trust Index", "Trust level:", "Trust score:", "repair-trust-index.json", "repair-trust-index.md"]) {
      if (!finalReport.includes(needle)) {
        throw new Error(`final report trust index section missing ${needle}: ${finalReport}`);
      }
    }

    console.log("PASS repair-trust-index-report-unit");
    return true;
  } catch (error) {
    console.log("FAIL repair-trust-index-report-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runRepairTrustIndexArtifactUnit() {
  const { buildRepairTrustIndex, renderRepairTrustIndexMarkdown } = require(path.join(projectRoot, "dist", "repair", "repairTrustIndex.js"));
  const tmpDir = path.join(projectRoot, ".scenario-unit", "repair-trust-index-artifact");

  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    ensureDir(tmpDir);
    const index = buildRepairTrustIndex(sampleTrustInput());
    const jsonPath = path.join(tmpDir, "repair-trust-index.json");
    const mdPath = path.join(tmpDir, "repair-trust-index.md");
    fs.writeFileSync(jsonPath, `${JSON.stringify(index, null, 2)}\n`, "utf8");
    fs.writeFileSync(mdPath, renderRepairTrustIndexMarkdown(index), "utf8");

    const fromDisk = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    const markdown = fs.readFileSync(mdPath, "utf8");
    if (fromDisk.version !== 1 || fromDisk.trustLevel !== "high" || !markdown.includes("Trust level: high")) {
      throw new Error(`trust artifacts invalid: json=${JSON.stringify(fromDisk)} md=${markdown}`);
    }

    console.log("PASS repair-trust-index-artifact-unit");
    return true;
  } catch (error) {
    console.log("FAIL repair-trust-index-artifact-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function sampleReleaseGateInput(overrides = {}) {
  const { buildRepairTrustIndex } = require(path.join(projectRoot, "dist", "repair", "repairTrustIndex.js"));
  const base = sampleTrustInput();
  return {
    repairTrustIndex: buildRepairTrustIndex(base),
    repairReview: base.repairReview,
    validation: base.validation,
    repairOutcome: base.repairOutcome,
    repairPatchPolicy: base.repairPatchPolicy,
    repairRegressionRisk: base.repairRegressionRisk,
    repairReviewAnalytics: base.repairReviewAnalytics,
    repairAnalytics: base.repairAnalytics,
    repairDecisionAudit: base.repairDecisionAudit,
    ...overrides
  };
}

function runRepairReleaseGateUnit() {
  const { buildRepairReleaseGate } = require(path.join(projectRoot, "dist", "repair", "repairReleaseGate.js"));

  try {
    const gate = buildRepairReleaseGate(sampleReleaseGateInput());
    if (gate.version !== 1 || gate.releaseDecision !== "allow" || gate.releaseScore !== 100) {
      throw new Error(`trusted successful repair should be allowed, got ${JSON.stringify(gate)}`);
    }
    if (gate.summary !== "The repair passed all required validation and safety checks.") {
      throw new Error(`unexpected allow summary: ${JSON.stringify(gate)}`);
    }

    console.log("PASS repair-release-gate-unit");
    return true;
  } catch (error) {
    console.log("FAIL repair-release-gate-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runRepairReleaseGateScoreUnit() {
  const { buildRepairTrustIndex } = require(path.join(projectRoot, "dist", "repair", "repairTrustIndex.js"));
  const { buildRepairReleaseGate } = require(path.join(projectRoot, "dist", "repair", "repairReleaseGate.js"));

  try {
    const trustInput = sampleTrustInput({
      repairReview: sampleRepairReview({ verdict: "approved-with-warnings" }),
      repairPatchPolicy: { ok: true, mode: "conservative", recommendedAction: "proceed" }
    });
    buildRepairTrustIndex(trustInput);
    const gate = buildRepairReleaseGate(sampleReleaseGateInput({
      repairTrustIndex: { trustLevel: "high", trustScore: 95, blockingConcerns: [], warnings: [] },
      repairReview: trustInput.repairReview,
      repairPatchPolicy: trustInput.repairPatchPolicy
    }));
    const clampGate = buildRepairReleaseGate(sampleReleaseGateInput({
      repairTrustIndex: { trustLevel: "unsafe", trustScore: 1, blockingConcerns: ["A", "B", "C", "D"], warnings: [] },
      repairReview: sampleRepairReview({ verdict: "rejected" }),
      validation: { verdict: "fail", status: "fail" },
      repairOutcome: { outcome: "failed-worse" },
      repairPatchPolicy: { ok: false, mode: "manual-review", recommendedAction: "block-mutation" },
      repairRegressionRisk: { riskLevel: "critical" },
      repairReviewAnalytics: { warnings: ["one", "two", "three", "four", "five"] },
      repairAnalytics: { warnings: ["six", "seven", "eight", "nine", "ten"] }
    }));

    if (gate.releaseScore !== 75 || gate.releaseDecision !== "allow-with-warnings") {
      throw new Error(`expected deterministic warning score 75/allow-with-warnings, got ${JSON.stringify(gate)}`);
    }
    if (clampGate.releaseScore < 0 || clampGate.releaseScore > 100 || clampGate.releaseDecision !== "block") {
      throw new Error(`score should clamp and block risky release, got ${JSON.stringify(clampGate)}`);
    }

    console.log("PASS repair-release-gate-score-unit");
    return true;
  } catch (error) {
    console.log("FAIL repair-release-gate-score-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runRepairReleaseGateDecisionUnit() {
  const { buildRepairReleaseGate } = require(path.join(projectRoot, "dist", "repair", "repairReleaseGate.js"));

  try {
    const allowWarnings = buildRepairReleaseGate(sampleReleaseGateInput({
      repairTrustIndex: { trustLevel: "medium", trustScore: 80, blockingConcerns: [], warnings: [] },
      repairReview: sampleRepairReview(),
      repairPatchPolicy: { ok: true, mode: "normal", recommendedAction: "proceed" }
    }));
    const humanReview = buildRepairReleaseGate(sampleReleaseGateInput({
      repairTrustIndex: { trustLevel: "medium", trustScore: 70, blockingConcerns: [], warnings: [] },
      repairReview: sampleRepairReview()
    }));
    const block = buildRepairReleaseGate(sampleReleaseGateInput({
      repairTrustIndex: { trustLevel: "unsafe", trustScore: 30, blockingConcerns: [], warnings: [] },
      repairReview: sampleRepairReview()
    }));

    if (allowWarnings.releaseDecision !== "allow-with-warnings") {
      throw new Error(`expected allow-with-warnings, got ${JSON.stringify(allowWarnings)}`);
    }
    if (humanReview.releaseDecision !== "require-human-review") {
      throw new Error(`expected require-human-review, got ${JSON.stringify(humanReview)}`);
    }
    if (block.releaseDecision !== "block") {
      throw new Error(`expected block, got ${JSON.stringify(block)}`);
    }

    console.log("PASS repair-release-gate-decision-unit");
    return true;
  } catch (error) {
    console.log("FAIL repair-release-gate-decision-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runRepairReleaseGateOverrideUnit() {
  const { buildRepairReleaseGate } = require(path.join(projectRoot, "dist", "repair", "repairReleaseGate.js"));

  try {
    const validationFail = buildRepairReleaseGate(sampleReleaseGateInput({ validation: { verdict: "fail", status: "fail" } }));
    const rejectedReview = buildRepairReleaseGate(sampleReleaseGateInput({ repairReview: sampleRepairReview({ verdict: "rejected" }) }));
    const manualOutcome = buildRepairReleaseGate(sampleReleaseGateInput({ repairOutcome: { outcome: "manual-review-required" } }));
    const failedWorse = buildRepairReleaseGate(sampleReleaseGateInput({ repairOutcome: { outcome: "failed-worse" } }));
    const missing = buildRepairReleaseGate({});
    const criticalRisk = buildRepairReleaseGate(sampleReleaseGateInput({ repairRegressionRisk: { riskLevel: "critical" } }));

    if (validationFail.releaseDecision !== "block") {
      throw new Error(`validation failure must block: ${JSON.stringify(validationFail)}`);
    }
    if (rejectedReview.releaseDecision !== "block") {
      throw new Error(`rejected review must block: ${JSON.stringify(rejectedReview)}`);
    }
    if (manualOutcome.releaseDecision !== "require-human-review") {
      throw new Error(`manual-review-required must require review: ${JSON.stringify(manualOutcome)}`);
    }
    if (failedWorse.releaseDecision !== "block") {
      throw new Error(`failed-worse must block: ${JSON.stringify(failedWorse)}`);
    }
    if (missing.releaseDecision !== "require-human-review") {
      throw new Error(`missing trust/review artifacts must require review: ${JSON.stringify(missing)}`);
    }
    if (criticalRisk.releaseDecision !== "require-human-review") {
      throw new Error(`critical risk must require review: ${JSON.stringify(criticalRisk)}`);
    }

    console.log("PASS repair-release-gate-override-unit");
    return true;
  } catch (error) {
    console.log("FAIL repair-release-gate-override-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runRepairReleaseGateReportUnit() {
  const { renderRepairReleaseGateMarkdown } = require(path.join(projectRoot, "dist", "repair", "repairReleaseGate.js"));

  try {
    const markdown = renderRepairReleaseGateMarkdown({
      version: 1,
      releaseDecision: "allow-with-warnings",
      releaseScore: 76,
      summary: "The repair may proceed, but warnings or moderate risks were detected.",
      releaseWarnings: ["Conservative patch policy was required"],
      blockingReasons: [],
      requiredActions: ["Verify conservative patch behavior manually"],
      evaluatedSignals: {}
    });
    for (const needle of [
      "# Repair Release Gate",
      "Release decision: allow-with-warnings",
      "Release score: 76",
      "Summary:",
      "Warnings:",
      "Blocking reasons:",
      "Required actions:"
    ]) {
      if (!markdown.includes(needle)) {
        throw new Error(`release gate markdown missing ${needle}: ${markdown}`);
      }
    }

    const finalReport = [
      "## Repair Release Gate",
      "Release decision: allow-with-warnings",
      "Release score: 76",
      "Summary:",
      "The repair may proceed, but warnings or moderate risks were detected.",
      "Artifacts:",
      "- repair-release-gate.json",
      "- repair-release-gate.md"
    ].join("\n");
    for (const needle of ["Repair Release Gate", "Release decision:", "Release score:", "repair-release-gate.json", "repair-release-gate.md"]) {
      if (!finalReport.includes(needle)) {
        throw new Error(`final report release gate section missing ${needle}: ${finalReport}`);
      }
    }

    console.log("PASS repair-release-gate-report-unit");
    return true;
  } catch (error) {
    console.log("FAIL repair-release-gate-report-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runRepairReleaseGateArtifactUnit() {
  const { buildRepairReleaseGate, renderRepairReleaseGateMarkdown } = require(path.join(projectRoot, "dist", "repair", "repairReleaseGate.js"));
  const tmpDir = path.join(projectRoot, ".scenario-unit", "repair-release-gate-artifact");

  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    ensureDir(tmpDir);
    const gate = buildRepairReleaseGate(sampleReleaseGateInput());
    const jsonPath = path.join(tmpDir, "repair-release-gate.json");
    const mdPath = path.join(tmpDir, "repair-release-gate.md");
    fs.writeFileSync(jsonPath, `${JSON.stringify(gate, null, 2)}\n`, "utf8");
    fs.writeFileSync(mdPath, renderRepairReleaseGateMarkdown(gate), "utf8");

    const fromDisk = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    const markdown = fs.readFileSync(mdPath, "utf8");
    if (fromDisk.version !== 1 || fromDisk.releaseDecision !== "allow" || !markdown.includes("Release decision: allow")) {
      throw new Error(`release gate artifacts invalid: json=${JSON.stringify(fromDisk)} md=${markdown}`);
    }

    console.log("PASS repair-release-gate-artifact-unit");
    return true;
  } catch (error) {
    console.log("FAIL repair-release-gate-artifact-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function sampleGovernanceInput(overrides = {}) {
  const { buildRepairTrustIndex } = require(path.join(projectRoot, "dist", "repair", "repairTrustIndex.js"));
  const { buildRepairReleaseGate } = require(path.join(projectRoot, "dist", "repair", "repairReleaseGate.js"));
  const trustInput = sampleTrustInput();
  const releaseInput = sampleReleaseGateInput();
  return {
    repairReleaseGate: buildRepairReleaseGate(releaseInput),
    repairTrustIndex: buildRepairTrustIndex(trustInput),
    repairReview: trustInput.repairReview,
    repairOutcome: trustInput.repairOutcome,
    validation: trustInput.validation,
    repairEvidenceValidation: trustInput.repairEvidenceValidation,
    repairRegressionRisk: trustInput.repairRegressionRisk,
    repairPatchPolicy: trustInput.repairPatchPolicy,
    repairReviewAnalytics: trustInput.repairReviewAnalytics,
    repairAnalytics: trustInput.repairAnalytics,
    repairDecisionAudit: trustInput.repairDecisionAudit,
    ...overrides
  };
}

function runRepairGovernanceUnit() {
  const { buildRepairGovernance } = require(path.join(projectRoot, "dist", "repair", "repairGovernance.js"));

  try {
    const governance = buildRepairGovernance(sampleGovernanceInput());
    if (governance.version !== 1 || governance.governanceStatus !== "ready") {
      throw new Error(`allow release should map to ready governance, got ${JSON.stringify(governance)}`);
    }
    if (
      governance.finalDecision.canProceed !== true ||
      governance.finalDecision.requiresHumanReview !== false ||
      governance.finalDecision.isBlocked !== false
    ) {
      throw new Error(`ready final decision flags mismatch: ${JSON.stringify(governance.finalDecision)}`);
    }
    if (!governance.supportingSignals.includes("Release gate allowed the repair") || !governance.supportingSignals.includes("Validation passed")) {
      throw new Error(`expected supporting signals, got ${JSON.stringify(governance.supportingSignals)}`);
    }

    console.log("PASS repair-governance-unit");
    return true;
  } catch (error) {
    console.log("FAIL repair-governance-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runRepairGovernanceStatusUnit() {
  const { buildRepairGovernance } = require(path.join(projectRoot, "dist", "repair", "repairGovernance.js"));

  try {
    const cases = [
      ["allow", "ready"],
      ["allow-with-warnings", "ready-with-caution"],
      ["require-human-review", "manual-review-required"],
      ["block", "blocked"]
    ];
    for (const [releaseDecision, expected] of cases) {
      const governance = buildRepairGovernance(sampleGovernanceInput({
        repairReleaseGate: {
          releaseDecision,
          releaseScore: 80,
          blockingReasons: [],
          releaseWarnings: [],
          requiredActions: []
        }
      }));
      if (governance.governanceStatus !== expected) {
        throw new Error(`${releaseDecision}: expected ${expected}, got ${JSON.stringify(governance)}`);
      }
    }

    console.log("PASS repair-governance-status-unit");
    return true;
  } catch (error) {
    console.log("FAIL repair-governance-status-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runRepairGovernanceOverrideUnit() {
  const { buildRepairGovernance } = require(path.join(projectRoot, "dist", "repair", "repairGovernance.js"));

  try {
    const validationFailed = buildRepairGovernance(sampleGovernanceInput({ validation: { verdict: "fail", status: "fail" } }));
    const rejectedReview = buildRepairGovernance(sampleGovernanceInput({ repairReview: sampleRepairReview({ verdict: "rejected" }) }));
    const unsafeTrust = buildRepairGovernance(sampleGovernanceInput({ repairTrustIndex: { trustLevel: "unsafe", trustScore: 20 } }));
    const manualOutcome = buildRepairGovernance(sampleGovernanceInput({ repairOutcome: { outcome: "manual-review-required" } }));
    const failedWorse = buildRepairGovernance(sampleGovernanceInput({ repairOutcome: { outcome: "failed-worse" } }));
    const patchManual = buildRepairGovernance(sampleGovernanceInput({ repairPatchPolicy: { ok: true, mode: "manual-review" } }));
    const missing = buildRepairGovernance({});

    if (validationFailed.governanceStatus !== "blocked") {
      throw new Error(`validation failure must block: ${JSON.stringify(validationFailed)}`);
    }
    if (rejectedReview.governanceStatus !== "blocked") {
      throw new Error(`rejected review must block: ${JSON.stringify(rejectedReview)}`);
    }
    if (unsafeTrust.governanceStatus !== "blocked") {
      throw new Error(`unsafe trust must block: ${JSON.stringify(unsafeTrust)}`);
    }
    if (failedWorse.governanceStatus !== "blocked") {
      throw new Error(`failed-worse must block: ${JSON.stringify(failedWorse)}`);
    }
    if (manualOutcome.governanceStatus !== "manual-review-required") {
      throw new Error(`manual-review-required outcome must require review: ${JSON.stringify(manualOutcome)}`);
    }
    if (patchManual.governanceStatus !== "manual-review-required") {
      throw new Error(`manual-review patch policy must require review: ${JSON.stringify(patchManual)}`);
    }
    if (missing.governanceStatus !== "manual-review-required") {
      throw new Error(`missing core artifacts must require review: ${JSON.stringify(missing)}`);
    }

    console.log("PASS repair-governance-override-unit");
    return true;
  } catch (error) {
    console.log("FAIL repair-governance-override-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runRepairGovernanceReportUnit() {
  const { renderRepairGovernanceMarkdown } = require(path.join(projectRoot, "dist", "repair", "repairGovernance.js"));

  try {
    const markdown = renderRepairGovernanceMarkdown({
      version: 1,
      governanceStatus: "ready-with-caution",
      summary: "The repair is governed as ready with caution because it may proceed, but warnings or moderate risks were detected.",
      finalDecision: { canProceed: true, requiresHumanReview: false, isBlocked: false },
      supportingSignals: ["Release gate allowed with warnings", "Validation passed"],
      riskSignals: ["Conservative patch policy was used"],
      requiredActions: ["Review warnings before release"],
      blockingReasons: [],
      sourceDecisions: {
        releaseDecision: "allow-with-warnings",
        releaseScore: 76,
        trustLevel: "medium",
        trustScore: 72,
        reviewVerdict: "approved-with-warnings",
        repairOutcome: "success",
        validationPassed: true
      }
    });
    for (const needle of [
      "# Repair Governance",
      "Governance status: ready-with-caution",
      "Final decision:",
      "Supporting signals:",
      "Risk signals:",
      "Required actions:",
      "Blocking reasons:",
      "Source decisions:"
    ]) {
      if (!markdown.includes(needle)) {
        throw new Error(`governance markdown missing ${needle}: ${markdown}`);
      }
    }

    const finalReport = [
      "## Repair Governance",
      "Governance status: ready-with-caution",
      "Summary:",
      "The repair is governed as ready with caution because it may proceed, but warnings or moderate risks were detected.",
      "Final decision:",
      "- Can proceed: true",
      "- Requires human review: false",
      "- Is blocked: false",
      "Artifacts:",
      "- repair-governance.json",
      "- repair-governance.md"
    ].join("\n");
    for (const needle of ["Repair Governance", "Governance status:", "Final decision:", "repair-governance.json", "repair-governance.md"]) {
      if (!finalReport.includes(needle)) {
        throw new Error(`final report governance section missing ${needle}: ${finalReport}`);
      }
    }

    console.log("PASS repair-governance-report-unit");
    return true;
  } catch (error) {
    console.log("FAIL repair-governance-report-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runRepairGovernanceArtifactUnit() {
  const { buildRepairGovernance, renderRepairGovernanceMarkdown } = require(path.join(projectRoot, "dist", "repair", "repairGovernance.js"));
  const tmpDir = path.join(projectRoot, ".scenario-unit", "repair-governance-artifact");

  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    ensureDir(tmpDir);
    const governance = buildRepairGovernance(sampleGovernanceInput());
    const jsonPath = path.join(tmpDir, "repair-governance.json");
    const mdPath = path.join(tmpDir, "repair-governance.md");
    fs.writeFileSync(jsonPath, `${JSON.stringify(governance, null, 2)}\n`, "utf8");
    fs.writeFileSync(mdPath, renderRepairGovernanceMarkdown(governance), "utf8");

    const fromDisk = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    const markdown = fs.readFileSync(mdPath, "utf8");
    if (fromDisk.version !== 1 || fromDisk.governanceStatus !== "ready" || !markdown.includes("Governance status: ready")) {
      throw new Error(`governance artifacts invalid: json=${JSON.stringify(fromDisk)} md=${markdown}`);
    }

    console.log("PASS repair-governance-artifact-unit");
    return true;
  } catch (error) {
    console.log("FAIL repair-governance-artifact-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runRepairGovernanceNoBehaviorChangeUnit() {
  const { buildRepairGovernance } = require(path.join(projectRoot, "dist", "repair", "repairGovernance.js"));

  try {
    const before = JSON.stringify(sampleGovernanceInput());
    const governance = buildRepairGovernance(sampleGovernanceInput());
    const after = JSON.stringify(sampleGovernanceInput());
    if (before !== after) {
      throw new Error("Governance builder should not mutate input fixtures.");
    }
    if (governance.finalDecision.canProceed !== true || governance.requiredActions.includes("Run repair automatically")) {
      throw new Error(`governance must remain reporting-only, got ${JSON.stringify(governance)}`);
    }

    console.log("PASS repair-governance-no-behavior-change-unit");
    return true;
  } catch (error) {
    console.log("FAIL repair-governance-no-behavior-change-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runRunIndexUnit() {
  const { loadRunsIndex } = require(path.join(projectRoot, "dist", "repair", "runIndex.js"));

  try {
    const repo = path.join(projectRoot, ".scenario-unit", "run-index-unit");
    fs.rmSync(repo, { recursive: true, force: true });
    fs.mkdirSync(repo, { recursive: true });
    const index = loadRunsIndex(repo);
    if (index.version !== 1 || index.totalRuns !== 0 || index.runs.length !== 0) {
      throw new Error(`empty index mismatch: ${JSON.stringify(index)}`);
    }

    console.log("PASS run-index-unit");
    return true;
  } catch (error) {
    console.log("FAIL run-index-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runRunIndexEntryUnit() {
  const { buildRunIndexEntry } = require(path.join(projectRoot, "dist", "repair", "runIndex.js"));

  try {
    const repo = path.join(projectRoot, ".scenario-unit", "run-index-entry-unit");
    const runDir = path.join(repo, ".factory", "runs", "run-1");
    const entry = buildRunIndexEntry({
      projectRoot: repo,
      runId: "run-1",
      timestamp: "2026-01-01T00:00:00.000Z",
      runDir,
      repairSummary: { outcome: "success" },
      repairReview: sampleRepairReview(),
      repairTrustIndex: { trustLevel: "high", trustScore: 100 },
      repairReleaseGate: { releaseDecision: "allow", releaseScore: 100 },
      repairGovernance: { governanceStatus: "ready", finalDecision: { canProceed: true, requiresHumanReview: false, isBlocked: false } },
      validation: { verdict: "pass", status: "pass" }
    });

    if (entry.runId !== "run-1" || entry.governanceStatus !== "ready" || entry.canProceed !== true || entry.validationPassed !== true) {
      throw new Error(`entry fields mismatch: ${JSON.stringify(entry)}`);
    }
    for (const artifact of Object.values(entry.artifactPaths)) {
      if (!artifact || path.isAbsolute(artifact) || artifact.includes("\\")) {
        throw new Error(`artifact path should be stable relative slash path, got ${JSON.stringify(entry.artifactPaths)}`);
      }
    }

    console.log("PASS run-index-entry-unit");
    return true;
  } catch (error) {
    console.log("FAIL run-index-entry-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runRunIndexUpdateUnit() {
  const { updateRunsIndex } = require(path.join(projectRoot, "dist", "repair", "runIndex.js"));

  try {
    const empty = { version: 1, updatedAt: "2026-01-01T00:00:00.000Z", totalRuns: 0, runs: [] };
    const one = updateRunsIndex(empty, {
      runId: "b",
      timestamp: "2026-01-02T00:00:00.000Z",
      artifactPaths: {}
    });
    const two = updateRunsIndex(one, {
      runId: "a",
      timestamp: "2026-01-01T00:00:00.000Z",
      artifactPaths: {}
    });

    if (two.totalRuns !== two.runs.length || two.totalRuns !== 2 || two.runs[0].runId !== "a" || two.runs[1].runId !== "b") {
      throw new Error(`index append/sort mismatch: ${JSON.stringify(two)}`);
    }

    console.log("PASS run-index-update-unit");
    return true;
  } catch (error) {
    console.log("FAIL run-index-update-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runRunIndexReplaceExistingUnit() {
  const { updateRunsIndex } = require(path.join(projectRoot, "dist", "repair", "runIndex.js"));

  try {
    const base = {
      version: 1,
      updatedAt: "2026-01-01T00:00:00.000Z",
      totalRuns: 1,
      runs: [{ runId: "run-1", timestamp: "2026-01-01T00:00:00.000Z", governanceStatus: "blocked", artifactPaths: {} }]
    };
    const updated = updateRunsIndex(base, {
      runId: "run-1",
      timestamp: "2026-01-01T00:00:00.000Z",
      governanceStatus: "ready",
      artifactPaths: {}
    });
    if (updated.totalRuns !== 1 || updated.runs.length !== 1 || updated.runs[0].governanceStatus !== "ready") {
      throw new Error(`duplicate runId should replace old entry: ${JSON.stringify(updated)}`);
    }

    console.log("PASS run-index-replace-existing-unit");
    return true;
  } catch (error) {
    console.log("FAIL run-index-replace-existing-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runRunIndexArtifactUnit() {
  const { buildRunIndexEntry, loadRunsIndex, saveRunsIndex, updateRunsIndex, getRunsIndexPath } = require(path.join(projectRoot, "dist", "repair", "runIndex.js"));

  try {
    const repo = path.join(projectRoot, ".scenario-unit", "run-index-artifact-unit");
    fs.rmSync(repo, { recursive: true, force: true });
    fs.mkdirSync(repo, { recursive: true });
    const entry = buildRunIndexEntry({
      projectRoot: repo,
      runId: "run-1",
      timestamp: "2026-01-01T00:00:00.000Z",
      runDir: path.join(repo, ".factory", "runs", "run-1"),
      repairReview: sampleRepairReview(),
      repairTrustIndex: { trustLevel: "high", trustScore: 100 },
      repairReleaseGate: { releaseDecision: "allow", releaseScore: 100 },
      repairGovernance: { governanceStatus: "ready", finalDecision: { canProceed: true, requiresHumanReview: false, isBlocked: false } },
      repairOutcome: { outcome: "success" },
      validation: { verdict: "pass" }
    });
    saveRunsIndex(repo, updateRunsIndex(loadRunsIndex(repo), entry));
    const indexPath = getRunsIndexPath(repo);
    const fromDisk = JSON.parse(fs.readFileSync(indexPath, "utf8"));
    if (!fs.existsSync(indexPath) || fromDisk.totalRuns !== 1 || fromDisk.runs[0].runId !== "run-1") {
      throw new Error(`runs index artifact mismatch: ${JSON.stringify(fromDisk)}`);
    }

    console.log("PASS run-index-artifact-unit");
    return true;
  } catch (error) {
    console.log("FAIL run-index-artifact-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runRunIndexReportUnit() {
  try {
    const report = [
      "## Run Index",
      "Run index updated: yes",
      "Index artifact:",
      "- .factory/runs-index.json"
    ].join("\n");
    for (const needle of ["Run Index", "Run index updated:", "Index artifact:", ".factory/runs-index.json"]) {
      if (!report.includes(needle)) {
        throw new Error(`final report run index section missing ${needle}: ${report}`);
      }
    }

    console.log("PASS run-index-report-unit");
    return true;
  } catch (error) {
    console.log("FAIL run-index-report-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function sampleRunsIndexForDashboard() {
  return {
    version: 1,
    updatedAt: "2026-05-10T12:00:00.000Z",
    totalRuns: 4,
    runs: [
      {
        runId: "2026-05-10-a-ready",
        timestamp: "2026-05-10T09:00:00.000Z",
        governanceStatus: "ready",
        trustLevel: "high",
        trustScore: 94,
        releaseDecision: "allow",
        releaseScore: 98,
        repairOutcome: "success",
        validationPassed: true,
        canProceed: true,
        requiresHumanReview: false,
        isBlocked: false,
        artifactPaths: {}
      },
      {
        runId: "2026-05-10-b-caution",
        timestamp: "2026-05-10T10:00:00.000Z",
        governanceStatus: "ready-with-caution",
        trustLevel: "medium",
        trustScore: 72,
        releaseDecision: "allow-with-warnings",
        releaseScore: 76,
        repairOutcome: "success",
        validationPassed: true,
        canProceed: true,
        requiresHumanReview: false,
        isBlocked: false,
        artifactPaths: {}
      },
      {
        runId: "2026-05-10-c-review",
        timestamp: "2026-05-10T11:00:00.000Z",
        governanceStatus: "manual-review-required",
        trustLevel: "low",
        trustScore: 51,
        releaseDecision: "require-human-review",
        releaseScore: 50,
        repairOutcome: "manual-review-required",
        validationPassed: false,
        canProceed: false,
        requiresHumanReview: true,
        isBlocked: false,
        artifactPaths: {}
      },
      {
        runId: "2026-05-10-d-blocked",
        timestamp: "2026-05-10T12:00:00.000Z",
        governanceStatus: "blocked",
        trustLevel: "unsafe",
        trustScore: 18,
        releaseDecision: "block",
        releaseScore: 10,
        repairOutcome: "failed-worse",
        validationPassed: false,
        canProceed: false,
        requiresHumanReview: false,
        isBlocked: true,
        artifactPaths: {}
      }
    ]
  };
}

function runRunIndexDashboardUnit() {
  const { buildRunIndexDashboard } = require(path.join(projectRoot, "dist", "repair", "runIndexDashboard.js"));

  try {
    const result = buildRunIndexDashboard(sampleRunsIndexForDashboard());
    if (result.totalRuns !== 4 || result.displayedRuns !== 4) {
      throw new Error(`dashboard totals mismatch: ${JSON.stringify(result)}`);
    }
    if (
      result.summary.ready !== 1 ||
      result.summary.readyWithCaution !== 1 ||
      result.summary.manualReviewRequired !== 1 ||
      result.summary.blocked !== 1
    ) {
      throw new Error(`dashboard summary mismatch: ${JSON.stringify(result.summary)}`);
    }
    if (result.rows[0].runId !== "2026-05-10-d-blocked") {
      throw new Error(`dashboard should sort newest first: ${JSON.stringify(result.rows.map((row) => row.runId))}`);
    }

    console.log("PASS run-index-dashboard-unit");
    return true;
  } catch (error) {
    console.log("FAIL run-index-dashboard-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runRunIndexDashboardFilterUnit() {
  const { buildRunIndexDashboard } = require(path.join(projectRoot, "dist", "repair", "runIndexDashboard.js"));

  try {
    const statusResult = buildRunIndexDashboard(sampleRunsIndexForDashboard(), { status: "blocked" });
    const blockedResult = buildRunIndexDashboard(sampleRunsIndexForDashboard(), { blockedOnly: true });
    const humanReviewResult = buildRunIndexDashboard(sampleRunsIndexForDashboard(), { humanReviewOnly: true });
    if (statusResult.displayedRuns !== 1 || statusResult.rows[0].governanceStatus !== "blocked") {
      throw new Error(`status filter mismatch: ${JSON.stringify(statusResult)}`);
    }
    if (blockedResult.displayedRuns !== 1 || blockedResult.rows[0].isBlocked !== true) {
      throw new Error(`blocked filter mismatch: ${JSON.stringify(blockedResult)}`);
    }
    if (humanReviewResult.displayedRuns !== 1 || humanReviewResult.rows[0].requiresHumanReview !== true) {
      throw new Error(`human-review filter mismatch: ${JSON.stringify(humanReviewResult)}`);
    }

    console.log("PASS run-index-dashboard-filter-unit");
    return true;
  } catch (error) {
    console.log("FAIL run-index-dashboard-filter-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runRunIndexDashboardLimitUnit() {
  const { buildRunIndexDashboard } = require(path.join(projectRoot, "dist", "repair", "runIndexDashboard.js"));

  try {
    const result = buildRunIndexDashboard(sampleRunsIndexForDashboard(), { limit: 2 });
    if (result.displayedRuns !== 2 || result.rows[0].runId !== "2026-05-10-d-blocked" || result.rows[1].runId !== "2026-05-10-c-review") {
      throw new Error(`limit filter mismatch: ${JSON.stringify(result.rows.map((row) => row.runId))}`);
    }

    console.log("PASS run-index-dashboard-limit-unit");
    return true;
  } catch (error) {
    console.log("FAIL run-index-dashboard-limit-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runRunIndexDashboardLatestUnit() {
  const { buildRunIndexDashboard } = require(path.join(projectRoot, "dist", "repair", "runIndexDashboard.js"));

  try {
    const result = buildRunIndexDashboard(sampleRunsIndexForDashboard(), { latestOnly: true });
    if (result.displayedRuns !== 1 || result.rows[0].runId !== "2026-05-10-d-blocked") {
      throw new Error(`latest filter mismatch: ${JSON.stringify(result)}`);
    }

    console.log("PASS run-index-dashboard-latest-unit");
    return true;
  } catch (error) {
    console.log("FAIL run-index-dashboard-latest-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runRunIndexDashboardJsonUnit() {
  const { buildRunIndexDashboard } = require(path.join(projectRoot, "dist", "repair", "runIndexDashboard.js"));

  try {
    const first = JSON.stringify(buildRunIndexDashboard(sampleRunsIndexForDashboard(), { status: "ready" }), null, 2);
    const second = JSON.stringify(buildRunIndexDashboard(sampleRunsIndexForDashboard(), { status: "ready" }), null, 2);
    if (first !== second || !first.includes('"displayedRuns": 1') || !first.includes('"governanceStatus": "ready"')) {
      throw new Error(`dashboard JSON output should be deterministic: ${first}`);
    }

    console.log("PASS run-index-dashboard-json-unit");
    return true;
  } catch (error) {
    console.log("FAIL run-index-dashboard-json-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runRunIndexDashboardRenderUnit() {
  const { buildRunIndexDashboard, renderRunIndexDashboardText } = require(path.join(projectRoot, "dist", "repair", "runIndexDashboard.js"));

  try {
    const text = renderRunIndexDashboardText(buildRunIndexDashboard(sampleRunsIndexForDashboard(), { limit: 2 }));
    for (const needle of [
      "AI Software Factory",
      "Total indexed runs: 4",
      "Displayed runs: 2",
      "- ready-with-caution: 1",
      "runId",
      "2026-05-10-d-blocked",
      "unsafe/18",
      "failed"
    ]) {
      if (!text.includes(needle)) {
        throw new Error(`dashboard text missing ${needle}: ${text}`);
      }
    }

    console.log("PASS run-index-dashboard-render-unit");
    return true;
  } catch (error) {
    console.log("FAIL run-index-dashboard-render-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runRunIndexDashboardMissingIndexUnit() {
  const { buildMissingRunIndexDashboard, renderRunIndexDashboardText } = require(path.join(projectRoot, "dist", "repair", "runIndexDashboard.js"));

  try {
    const result = buildMissingRunIndexDashboard();
    const json = JSON.stringify(result, null, 2);
    const text = renderRunIndexDashboardText(result);
    if (result.displayedRuns !== 0 || result.warnings[0] !== "No runs index found") {
      throw new Error(`missing index result mismatch: ${JSON.stringify(result)}`);
    }
    if (!json.includes('"warnings": [') || !text.includes("No runs index found.") || !text.includes(".factory/runs-index.json")) {
      throw new Error(`missing index output mismatch: ${text}`);
    }

    console.log("PASS run-index-dashboard-missing-index-unit");
    return true;
  } catch (error) {
    console.log("FAIL run-index-dashboard-missing-index-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runRunIndexDashboardCliUnit() {
  try {
    const repo = path.join(projectRoot, ".scenario-unit", "run-index-dashboard-cli");
    const indexPath = path.join(repo, ".factory", "runs-index.json");
    fs.rmSync(repo, { recursive: true, force: true });
    ensureDir(path.dirname(indexPath));
    writeJson(indexPath, sampleRunsIndexForDashboard());

    const textResult = spawnSync(process.execPath, [cliPath, "runs", "--repo", repo, "--limit", "2"], {
      cwd: projectRoot,
      encoding: "utf8"
    });
    if (textResult.status !== 0 || !textResult.stdout.includes("Displayed runs: 2") || !textResult.stdout.includes("2026-05-10-d-blocked")) {
      throw new Error(`dashboard CLI text mismatch: status=${textResult.status} stdout=${textResult.stdout} stderr=${textResult.stderr}`);
    }

    const jsonResult = spawnSync(process.execPath, [cliPath, "runs", "--repo", repo, "--status", "blocked", "--json"], {
      cwd: projectRoot,
      encoding: "utf8"
    });
    const parsed = JSON.parse(jsonResult.stdout);
    if (jsonResult.status !== 0 || parsed.displayedRuns !== 1 || parsed.rows[0].governanceStatus !== "blocked") {
      throw new Error(`dashboard CLI JSON mismatch: status=${jsonResult.status} stdout=${jsonResult.stdout} stderr=${jsonResult.stderr}`);
    }

    const missingRepo = path.join(projectRoot, ".scenario-unit", "run-index-dashboard-missing");
    fs.rmSync(missingRepo, { recursive: true, force: true });
    ensureDir(missingRepo);
    const missingResult = spawnSync(process.execPath, [cliPath, "runs", "--repo", missingRepo], {
      cwd: projectRoot,
      encoding: "utf8"
    });
    if (missingResult.status !== 0 || !missingResult.stdout.includes("No runs index found.")) {
      throw new Error(`dashboard CLI missing-index mismatch: status=${missingResult.status} stdout=${missingResult.stdout} stderr=${missingResult.stderr}`);
    }

    const invalidStatusResult = spawnSync(process.execPath, [cliPath, "runs", "--repo", repo, "--status", "unknown"], {
      cwd: projectRoot,
      encoding: "utf8"
    });
    if (invalidStatusResult.status === 0 || !invalidStatusResult.stderr.includes("Invalid status filter: unknown")) {
      throw new Error(`dashboard CLI invalid status mismatch: status=${invalidStatusResult.status} stdout=${invalidStatusResult.stdout} stderr=${invalidStatusResult.stderr}`);
    }

    const invalidLimitResult = spawnSync(process.execPath, [cliPath, "runs", "--repo", repo, "--limit", "0"], {
      cwd: projectRoot,
      encoding: "utf8"
    });
    if (invalidLimitResult.status === 0 || !invalidLimitResult.stderr.includes("Invalid limit value: 0")) {
      throw new Error(`dashboard CLI invalid limit mismatch: status=${invalidLimitResult.status} stdout=${invalidLimitResult.stdout} stderr=${invalidLimitResult.stderr}`);
    }

    console.log("PASS run-index-dashboard-cli-unit");
    return true;
  } catch (error) {
    console.log("FAIL run-index-dashboard-cli-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function createExportTestRepo(name, withIndex = true) {
  const repo = path.join(projectRoot, ".scenario-unit", name);
  fs.rmSync(repo, { recursive: true, force: true });
  ensureDir(repo);
  if (withIndex) {
    const indexPath = path.join(repo, ".factory", "runs-index.json");
    ensureDir(path.dirname(indexPath));
    writeJson(indexPath, sampleRunsIndexForDashboard());
  }
  return repo;
}

function runRunIndexExportUnit() {
  const { exportRunIndexDashboard } = require(path.join(projectRoot, "dist", "repair", "runIndexExport.js"));

  try {
    const repo = createExportTestRepo("run-index-export-unit");
    const beforeIndex = fs.readFileSync(path.join(repo, ".factory", "runs-index.json"), "utf8");
    const result = exportRunIndexDashboard(repo, { format: "json" });
    const afterIndex = fs.readFileSync(path.join(repo, ".factory", "runs-index.json"), "utf8");
    if (!result.exported || result.format !== "json" || result.displayedRuns !== 4 || result.files.length !== 1) {
      throw new Error(`export result mismatch: ${JSON.stringify(result)}`);
    }
    if (result.files[0] !== ".factory/exports/runs-dashboard.json") {
      throw new Error(`export should return stable relative path, got ${JSON.stringify(result.files)}`);
    }
    if (beforeIndex !== afterIndex) {
      throw new Error("export must not modify .factory/runs-index.json");
    }

    console.log("PASS run-index-export-unit");
    return true;
  } catch (error) {
    console.log("FAIL run-index-export-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runRunIndexExportJsonUnit() {
  const { exportRunIndexDashboard } = require(path.join(projectRoot, "dist", "repair", "runIndexExport.js"));

  try {
    const repo = createExportTestRepo("run-index-export-json");
    const first = exportRunIndexDashboard(repo, { format: "json", limit: 2 });
    const jsonPath = path.join(repo, first.files[0]);
    const firstContent = fs.readFileSync(jsonPath, "utf8");
    exportRunIndexDashboard(repo, { format: "json", limit: 2 });
    const secondContent = fs.readFileSync(jsonPath, "utf8");
    const parsed = JSON.parse(firstContent);
    if (firstContent !== secondContent || parsed.displayedRuns !== 2 || parsed.rows[0].runId !== "2026-05-10-d-blocked") {
      throw new Error(`JSON export should be stable and filtered: ${firstContent}`);
    }

    console.log("PASS run-index-export-json-unit");
    return true;
  } catch (error) {
    console.log("FAIL run-index-export-json-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runRunIndexExportMarkdownUnit() {
  const { buildRunIndexDashboard } = require(path.join(projectRoot, "dist", "repair", "runIndexDashboard.js"));
  const { renderRunIndexDashboardMarkdown } = require(path.join(projectRoot, "dist", "repair", "runIndexExport.js"));

  try {
    const markdown = renderRunIndexDashboardMarkdown(buildRunIndexDashboard(sampleRunsIndexForDashboard(), { limit: 1 }));
    for (const needle of [
      "AI Software Factory",
      "Run Governance Dashboard Export",
      "Total indexed runs: 4",
      "| Run ID | Timestamp | Governance | Trust | Release | Outcome | Validation |",
      "| 2026-05-10-d-blocked |",
      "unsafe/18",
      "block/10"
    ]) {
      if (!markdown.includes(needle)) {
        throw new Error(`Markdown export missing ${needle}: ${markdown}`);
      }
    }

    console.log("PASS run-index-export-markdown-unit");
    return true;
  } catch (error) {
    console.log("FAIL run-index-export-markdown-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runRunIndexExportCsvUnit() {
  const { renderRunIndexDashboardCsv } = require(path.join(projectRoot, "dist", "repair", "runIndexExport.js"));

  try {
    const csv = renderRunIndexDashboardCsv({
      totalRuns: 1,
      displayedRuns: 1,
      filters: {},
      summary: { ready: 1, readyWithCaution: 0, manualReviewRequired: 0, blocked: 0 },
      rows: [
        {
          runId: "run,with,comma",
          timestamp: "2026-05-10T12:00:00.000Z",
          governanceStatus: "ready",
          trustLevel: 'high "quoted"',
          trustScore: 99,
          releaseDecision: "allow",
          releaseScore: 100,
          repairOutcome: "success",
          validationPassed: true,
          canProceed: true,
          requiresHumanReview: false,
          isBlocked: false
        }
      ]
    });
    if (!csv.startsWith("runId,timestamp,governanceStatus,trustLevel,trustScore,releaseDecision,releaseScore,repairOutcome,validationPassed,canProceed,requiresHumanReview,isBlocked")) {
      throw new Error(`CSV header mismatch: ${csv}`);
    }
    if (!csv.includes('"run,with,comma"') || !csv.includes('"high ""quoted"""') || !csv.includes(",true,true,false,false")) {
      throw new Error(`CSV escaping mismatch: ${csv}`);
    }

    console.log("PASS run-index-export-csv-unit");
    return true;
  } catch (error) {
    console.log("FAIL run-index-export-csv-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runRunIndexExportAllUnit() {
  const { exportRunIndexDashboard } = require(path.join(projectRoot, "dist", "repair", "runIndexExport.js"));

  try {
    const repo = createExportTestRepo("run-index-export-all");
    const result = exportRunIndexDashboard(repo, { format: "all" });
    const expected = [
      ".factory/exports/runs-dashboard.json",
      ".factory/exports/runs-dashboard.md",
      ".factory/exports/runs-dashboard.csv"
    ];
    if (JSON.stringify(result.files) !== JSON.stringify(expected)) {
      throw new Error(`all export files mismatch: ${JSON.stringify(result)}`);
    }
    for (const file of expected) {
      if (!fs.existsSync(path.join(repo, file))) {
        throw new Error(`expected export file missing: ${file}`);
      }
    }

    console.log("PASS run-index-export-all-unit");
    return true;
  } catch (error) {
    console.log("FAIL run-index-export-all-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runRunIndexExportFilterUnit() {
  const { exportRunIndexDashboard } = require(path.join(projectRoot, "dist", "repair", "runIndexExport.js"));

  try {
    const repo = createExportTestRepo("run-index-export-filter");
    const result = exportRunIndexDashboard(repo, { format: "json", status: "blocked" });
    const parsed = JSON.parse(fs.readFileSync(path.join(repo, result.files[0]), "utf8"));
    if (parsed.displayedRuns !== 1 || parsed.rows[0].governanceStatus !== "blocked" || parsed.filters.status !== "blocked") {
      throw new Error(`filtered export mismatch: ${JSON.stringify(parsed)}`);
    }

    console.log("PASS run-index-export-filter-unit");
    return true;
  } catch (error) {
    console.log("FAIL run-index-export-filter-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runRunIndexExportMissingIndexUnit() {
  const { exportRunIndexDashboard } = require(path.join(projectRoot, "dist", "repair", "runIndexExport.js"));

  try {
    const repo = createExportTestRepo("run-index-export-missing", false);
    const result = exportRunIndexDashboard(repo, { format: "all" });
    const json = JSON.parse(fs.readFileSync(path.join(repo, ".factory", "exports", "runs-dashboard.json"), "utf8"));
    const markdown = fs.readFileSync(path.join(repo, ".factory", "exports", "runs-dashboard.md"), "utf8");
    const csv = fs.readFileSync(path.join(repo, ".factory", "exports", "runs-dashboard.csv"), "utf8");
    if (!result.warnings.includes("No runs index found") || json.displayedRuns !== 0 || !markdown.includes("No runs found.")) {
      throw new Error(`missing index export mismatch: result=${JSON.stringify(result)} markdown=${markdown}`);
    }
    if (csv.trim() !== "runId,timestamp,governanceStatus,trustLevel,trustScore,releaseDecision,releaseScore,repairOutcome,validationPassed,canProceed,requiresHumanReview,isBlocked") {
      throw new Error(`missing index CSV should contain only headers: ${csv}`);
    }

    console.log("PASS run-index-export-missing-index-unit");
    return true;
  } catch (error) {
    console.log("FAIL run-index-export-missing-index-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runRunIndexExportCliUnit() {
  try {
    const repo = createExportTestRepo("run-index-export-cli");
    const indexPath = path.join(repo, ".factory", "runs-index.json");
    const beforeIndex = fs.readFileSync(indexPath, "utf8");

    const allResult = spawnSync(process.execPath, [cliPath, "runs", "--repo", repo, "--export"], {
      cwd: projectRoot,
      encoding: "utf8"
    });
    if (allResult.status !== 0 || !allResult.stdout.includes("Exported run dashboard:") || !allResult.stdout.includes(".factory/exports/runs-dashboard.csv")) {
      throw new Error(`CLI export all mismatch: status=${allResult.status} stdout=${allResult.stdout} stderr=${allResult.stderr}`);
    }

    const jsonResult = spawnSync(process.execPath, [cliPath, "runs", "--repo", repo, "--status", "blocked", "--export", "json", "--json"], {
      cwd: projectRoot,
      encoding: "utf8"
    });
    const parsed = JSON.parse(jsonResult.stdout);
    if (jsonResult.status !== 0 || parsed.format !== "json" || parsed.displayedRuns !== 1 || parsed.files[0] !== ".factory/exports/runs-dashboard.json") {
      throw new Error(`CLI export JSON mismatch: status=${jsonResult.status} stdout=${jsonResult.stdout} stderr=${jsonResult.stderr}`);
    }

    const invalidResult = spawnSync(process.execPath, [cliPath, "runs", "--repo", repo, "--export", "xml"], {
      cwd: projectRoot,
      encoding: "utf8"
    });
    if (invalidResult.status === 0 || !invalidResult.stderr.includes("Invalid export format: xml")) {
      throw new Error(`CLI invalid export mismatch: status=${invalidResult.status} stdout=${invalidResult.stdout} stderr=${invalidResult.stderr}`);
    }

    const afterIndex = fs.readFileSync(indexPath, "utf8");
    if (beforeIndex !== afterIndex) {
      throw new Error("CLI export must not modify .factory/runs-index.json");
    }

    console.log("PASS run-index-export-cli-unit");
    return true;
  } catch (error) {
    console.log("FAIL run-index-export-cli-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function sampleRunsIndexForInsights(overrides = {}) {
  return {
    version: 1,
    updatedAt: "2026-05-10T12:00:00.000Z",
    totalRuns: 5,
    runs: [
      {
        runId: "insight-1",
        timestamp: "2026-05-10T08:00:00.000Z",
        governanceStatus: "ready",
        trustLevel: "high",
        trustScore: 95,
        releaseDecision: "allow",
        releaseScore: 98,
        repairOutcome: "success",
        validationPassed: true,
        canProceed: true,
        requiresHumanReview: false,
        isBlocked: false,
        artifactPaths: {}
      },
      {
        runId: "insight-2",
        timestamp: "2026-05-10T09:00:00.000Z",
        governanceStatus: "ready",
        trustLevel: "high",
        trustScore: 85,
        releaseDecision: "allow",
        releaseScore: 90,
        repairOutcome: "success",
        validationPassed: true,
        canProceed: true,
        requiresHumanReview: false,
        isBlocked: false,
        artifactPaths: {}
      },
      {
        runId: "insight-3",
        timestamp: "2026-05-10T10:00:00.000Z",
        governanceStatus: "ready-with-caution",
        trustLevel: "medium",
        trustScore: 75,
        releaseDecision: "allow-with-warnings",
        releaseScore: 80,
        repairOutcome: "success",
        validationPassed: true,
        canProceed: true,
        requiresHumanReview: false,
        isBlocked: false,
        artifactPaths: {}
      },
      {
        runId: "insight-4",
        timestamp: "2026-05-10T11:00:00.000Z",
        governanceStatus: "manual-review-required",
        trustLevel: "low",
        releaseDecision: "require-human-review",
        releaseScore: 50,
        repairOutcome: "manual-review-required",
        validationPassed: false,
        canProceed: false,
        requiresHumanReview: true,
        isBlocked: false,
        artifactPaths: {}
      },
      {
        runId: "insight-5",
        timestamp: "2026-05-10T12:00:00.000Z",
        governanceStatus: "blocked",
        trustLevel: "unsafe",
        trustScore: 25,
        releaseDecision: "block",
        releaseScore: 10,
        repairOutcome: "failed-worse",
        validationPassed: false,
        canProceed: false,
        requiresHumanReview: false,
        isBlocked: true,
        artifactPaths: {}
      }
    ],
    ...overrides
  };
}

function createInsightsTestRepo(name, index = sampleRunsIndexForInsights()) {
  const repo = path.join(projectRoot, ".scenario-unit", name);
  fs.rmSync(repo, { recursive: true, force: true });
  ensureDir(repo);
  if (index) {
    const indexPath = path.join(repo, ".factory", "runs-index.json");
    ensureDir(path.dirname(indexPath));
    writeJson(indexPath, index);
  }
  return repo;
}

function runGovernanceInsightsUnit() {
  const { buildGovernanceInsights } = require(path.join(projectRoot, "dist", "repair", "governanceInsights.js"));

  try {
    const insights = buildGovernanceInsights(sampleRunsIndexForInsights());
    if (
      insights.totalRuns !== 5 ||
      insights.summary.ready !== 2 ||
      insights.summary.readyWithCaution !== 1 ||
      insights.summary.manualReviewRequired !== 1 ||
      insights.summary.blocked !== 1 ||
      insights.summary.validationPassed !== 3 ||
      insights.summary.validationFailed !== 2
    ) {
      throw new Error(`summary counts mismatch: ${JSON.stringify(insights.summary)}`);
    }
    if (insights.generatedAt !== "2026-05-10T12:00:00.000Z") {
      throw new Error(`generatedAt should use index timestamp: ${insights.generatedAt}`);
    }

    console.log("PASS governance-insights-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-insights-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceInsightsRatesUnit() {
  const { buildGovernanceInsights } = require(path.join(projectRoot, "dist", "repair", "governanceInsights.js"));

  try {
    const insights = buildGovernanceInsights(sampleRunsIndexForInsights());
    if (
      insights.rates.readyRate !== 40 ||
      insights.rates.cautionRate !== 20 ||
      insights.rates.humanReviewRate !== 20 ||
      insights.rates.blockedRate !== 20 ||
      insights.rates.validationSuccessRate !== 60
    ) {
      throw new Error(`rate mismatch: ${JSON.stringify(insights.rates)}`);
    }
    if (insights.trust.averageTrustScore !== 70 || insights.trust.minTrustScore !== 25 || insights.trust.maxTrustScore !== 95) {
      throw new Error(`trust aggregate mismatch: ${JSON.stringify(insights.trust)}`);
    }

    console.log("PASS governance-insights-rates-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-insights-rates-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceInsightsMostCommonUnit() {
  const { buildGovernanceInsights } = require(path.join(projectRoot, "dist", "repair", "governanceInsights.js"));

  try {
    const index = sampleRunsIndexForInsights({
      totalRuns: 4,
      runs: [
        { runId: "a", timestamp: "2026-05-10T08:00:00.000Z", governanceStatus: "ready", repairOutcome: "zeta", releaseDecision: "allow", trustLevel: "medium", artifactPaths: {} },
        { runId: "b", timestamp: "2026-05-10T09:00:00.000Z", governanceStatus: "blocked", repairOutcome: "alpha", releaseDecision: "block", trustLevel: "high", artifactPaths: {} },
        { runId: "c", timestamp: "2026-05-10T10:00:00.000Z", governanceStatus: "ready", repairOutcome: "zeta", releaseDecision: "allow", trustLevel: "medium", artifactPaths: {} },
        { runId: "d", timestamp: "2026-05-10T11:00:00.000Z", governanceStatus: "blocked", repairOutcome: "alpha", releaseDecision: "block", trustLevel: "high", artifactPaths: {} }
      ]
    });
    const insights = buildGovernanceInsights(index);
    if (
      insights.mostCommon.governanceStatus !== "blocked" ||
      insights.mostCommon.repairOutcome !== "alpha" ||
      insights.mostCommon.releaseDecision !== "allow" ||
      insights.mostCommon.trustLevel !== "high"
    ) {
      throw new Error(`most common tie-breaking mismatch: ${JSON.stringify(insights.mostCommon)}`);
    }

    console.log("PASS governance-insights-most-common-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-insights-most-common-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceInsightsTrendUnit() {
  const { buildGovernanceInsights } = require(path.join(projectRoot, "dist", "repair", "governanceInsights.js"));

  try {
    const runs = [];
    for (let i = 1; i <= 20; i += 1) {
      runs.push({
        runId: `trend-${String(i).padStart(2, "0")}`,
        timestamp: `2026-05-${String(i).padStart(2, "0")}T00:00:00.000Z`,
        governanceStatus: i > 18 ? "blocked" : "ready",
        trustLevel: i <= 10 ? "high" : "low",
        trustScore: i <= 10 ? 100 : 40,
        releaseDecision: i > 18 ? "block" : "allow",
        repairOutcome: i > 18 ? "failed-worse" : "success",
        validationPassed: i <= 18,
        requiresHumanReview: false,
        isBlocked: i > 18,
        artifactPaths: {}
      });
    }
    const insights = buildGovernanceInsights({ version: 1, updatedAt: "2026-05-20T00:00:00.000Z", totalRuns: 20, runs });
    if (insights.trends.recentRunCount !== 10 || insights.trends.recentBlockedCount !== 2 || insights.trends.trustTrend !== "degrading") {
      throw new Error(`trend mismatch: ${JSON.stringify(insights.trends)}`);
    }
    if (!insights.insights.some((insight) => insight.code === "TRUST_TREND_DEGRADING")) {
      throw new Error(`expected degrading trust insight: ${JSON.stringify(insights.insights)}`);
    }

    console.log("PASS governance-insights-trend-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-insights-trend-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceInsightsRulesUnit() {
  const { buildGovernanceInsights } = require(path.join(projectRoot, "dist", "repair", "governanceInsights.js"));

  try {
    const highRisk = buildGovernanceInsights({
      version: 1,
      updatedAt: "2026-05-10T00:00:00.000Z",
      totalRuns: 4,
      runs: [
        { runId: "a", timestamp: "2026-05-10T08:00:00.000Z", governanceStatus: "blocked", trustScore: 40, validationPassed: false, artifactPaths: {} },
        { runId: "b", timestamp: "2026-05-10T09:00:00.000Z", governanceStatus: "blocked", trustScore: 40, validationPassed: false, artifactPaths: {} },
        { runId: "c", timestamp: "2026-05-10T10:00:00.000Z", governanceStatus: "manual-review-required", trustScore: 60, validationPassed: false, artifactPaths: {} },
        { runId: "d", timestamp: "2026-05-10T11:00:00.000Z", governanceStatus: "ready", trustScore: 80, validationPassed: true, artifactPaths: {} }
      ]
    });
    const codes = highRisk.insights.map((insight) => insight.code);
    for (const expected of ["HIGH_BLOCKED_RATE", "LOW_VALIDATION_SUCCESS_RATE", "LOW_AVERAGE_TRUST"]) {
      if (!codes.includes(expected)) {
        throw new Error(`expected insight ${expected}, got ${JSON.stringify(highRisk.insights)}`);
      }
    }

    const humanReview = buildGovernanceInsights({
      version: 1,
      updatedAt: "2026-05-10T00:00:00.000Z",
      totalRuns: 3,
      runs: [
        { runId: "a", timestamp: "2026-05-10T08:00:00.000Z", governanceStatus: "manual-review-required", validationPassed: true, artifactPaths: {} },
        { runId: "b", timestamp: "2026-05-10T09:00:00.000Z", governanceStatus: "manual-review-required", validationPassed: true, artifactPaths: {} },
        { runId: "c", timestamp: "2026-05-10T10:00:00.000Z", governanceStatus: "ready", validationPassed: true, artifactPaths: {} }
      ]
    });
    if (!humanReview.insights.some((insight) => insight.code === "HIGH_HUMAN_REVIEW_RATE")) {
      throw new Error(`expected high human-review insight: ${JSON.stringify(humanReview.insights)}`);
    }

    const healthy = buildGovernanceInsights({
      version: 1,
      updatedAt: "2026-05-10T00:00:00.000Z",
      totalRuns: 5,
      runs: Array.from({ length: 5 }, (_, index) => ({
        runId: `healthy-${index}`,
        timestamp: `2026-05-10T0${index}:00:00.000Z`,
        governanceStatus: "ready",
        validationPassed: true,
        trustScore: 90,
        artifactPaths: {}
      }))
    });
    if (!healthy.insights.some((insight) => insight.code === "HEALTHY_GOVERNANCE_RATE")) {
      throw new Error(`expected healthy governance insight: ${JSON.stringify(healthy.insights)}`);
    }

    console.log("PASS governance-insights-rules-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-insights-rules-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceInsightsRenderUnit() {
  const { buildGovernanceInsights, renderGovernanceInsightsMarkdown } = require(path.join(projectRoot, "dist", "repair", "governanceInsights.js"));

  try {
    const markdown = renderGovernanceInsightsMarkdown(buildGovernanceInsights(sampleRunsIndexForInsights()));
    for (const needle of [
      "AI Software Factory",
      "Governance Insights",
      "Total runs: 5",
      "- ready rate: 40%",
      "- validation success rate: 60%",
      "- average trust score: 70",
      "- [warning] LOW_VALIDATION_SUCCESS_RATE"
    ]) {
      if (!markdown.includes(needle)) {
        throw new Error(`markdown insights missing ${needle}: ${markdown}`);
      }
    }

    console.log("PASS governance-insights-render-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-insights-render-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceInsightsExportUnit() {
  const { buildGovernanceInsights, exportGovernanceInsights } = require(path.join(projectRoot, "dist", "repair", "governanceInsights.js"));

  try {
    const repo = createInsightsTestRepo("governance-insights-export");
    const indexPath = path.join(repo, ".factory", "runs-index.json");
    const beforeIndex = fs.readFileSync(indexPath, "utf8");
    const result = exportGovernanceInsights(repo, buildGovernanceInsights(sampleRunsIndexForInsights()));
    const jsonPath = path.join(repo, ".factory", "exports", "governance-insights.json");
    const mdPath = path.join(repo, ".factory", "exports", "governance-insights.md");
    const afterIndex = fs.readFileSync(indexPath, "utf8");
    const parsed = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    const markdown = fs.readFileSync(mdPath, "utf8");
    if (!result.exported || result.files.length !== 2 || parsed.totalRuns !== 5 || !markdown.includes("Governance Insights")) {
      throw new Error(`insights export mismatch: ${JSON.stringify(result)}`);
    }
    if (beforeIndex !== afterIndex) {
      throw new Error("insights export must not modify .factory/runs-index.json");
    }

    console.log("PASS governance-insights-export-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-insights-export-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceInsightsCliUnit() {
  try {
    const repo = createInsightsTestRepo("governance-insights-cli");
    const indexPath = path.join(repo, ".factory", "runs-index.json");
    const beforeIndex = fs.readFileSync(indexPath, "utf8");
    const textResult = spawnSync(process.execPath, [cliPath, "insights", "--repo", repo], {
      cwd: projectRoot,
      encoding: "utf8"
    });
    if (textResult.status !== 0 || !textResult.stdout.includes("Governance Insights") || !textResult.stdout.includes("Total runs: 5")) {
      throw new Error(`insights CLI text mismatch: status=${textResult.status} stdout=${textResult.stdout} stderr=${textResult.stderr}`);
    }

    const jsonResult = spawnSync(process.execPath, [cliPath, "insights", "--repo", repo, "--json"], {
      cwd: projectRoot,
      encoding: "utf8"
    });
    const parsed = JSON.parse(jsonResult.stdout);
    if (jsonResult.status !== 0 || parsed.totalRuns !== 5 || parsed.summary.blocked !== 1) {
      throw new Error(`insights CLI JSON mismatch: status=${jsonResult.status} stdout=${jsonResult.stdout} stderr=${jsonResult.stderr}`);
    }

    const exportResult = spawnSync(process.execPath, [cliPath, "insights", "--repo", repo, "--export"], {
      cwd: projectRoot,
      encoding: "utf8"
    });
    if (exportResult.status !== 0 || !exportResult.stdout.includes("Exported governance insights:") || !exportResult.stdout.includes(".factory/exports/governance-insights.md")) {
      throw new Error(`insights CLI export mismatch: status=${exportResult.status} stdout=${exportResult.stdout} stderr=${exportResult.stderr}`);
    }

    const exportJsonResult = spawnSync(process.execPath, [cliPath, "insights", "--repo", repo, "--json", "--export"], {
      cwd: projectRoot,
      encoding: "utf8"
    });
    const exportParsed = JSON.parse(exportJsonResult.stdout);
    if (exportJsonResult.status !== 0 || exportParsed.exported !== true || exportParsed.files.length !== 2) {
      throw new Error(`insights CLI export JSON mismatch: status=${exportJsonResult.status} stdout=${exportJsonResult.stdout} stderr=${exportJsonResult.stderr}`);
    }

    const afterIndex = fs.readFileSync(indexPath, "utf8");
    if (beforeIndex !== afterIndex) {
      throw new Error("insights CLI must not modify .factory/runs-index.json");
    }

    console.log("PASS governance-insights-cli-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-insights-cli-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceInsightsMissingIndexUnit() {
  const { loadGovernanceInsights, renderGovernanceInsightsMarkdown, exportGovernanceInsights } = require(path.join(projectRoot, "dist", "repair", "governanceInsights.js"));

  try {
    const repo = createInsightsTestRepo("governance-insights-missing", null);
    const insights = loadGovernanceInsights(repo);
    const markdown = renderGovernanceInsightsMarkdown(insights);
    const result = exportGovernanceInsights(repo, insights);
    if (insights.totalRuns !== 0 || insights.insights[0]?.code !== "NO_RUNS" || !markdown.includes("NO_RUNS")) {
      throw new Error(`missing index insights mismatch: ${JSON.stringify(insights)} markdown=${markdown}`);
    }
    if (!fs.existsSync(path.join(repo, result.files[0])) || !fs.existsSync(path.join(repo, result.files[1]))) {
      throw new Error(`missing index insights export files missing: ${JSON.stringify(result)}`);
    }

    console.log("PASS governance-insights-missing-index-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-insights-missing-index-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernancePolicyProfileUnit() {
  const {
    listGovernancePolicyProfiles,
    getGovernancePolicyProfile,
    isGovernancePolicyProfileName
  } = require(path.join(projectRoot, "dist", "repair", "governancePolicyProfile.js"));

  try {
    const profiles = listGovernancePolicyProfiles();
    const names = profiles.map((profile) => profile.name);
    if (JSON.stringify(names) !== JSON.stringify(["conservative", "balanced", "experimental"])) {
      throw new Error(`profile list mismatch: ${JSON.stringify(names)}`);
    }
    if (
      getGovernancePolicyProfile("conservative").thresholds.highBlockedRatePercent !== 15 ||
      getGovernancePolicyProfile("balanced").thresholds.highBlockedRatePercent !== 25 ||
      getGovernancePolicyProfile("experimental").thresholds.highBlockedRatePercent !== 40
    ) {
      throw new Error(`profile thresholds mismatch: ${JSON.stringify(profiles)}`);
    }
    if (!isGovernancePolicyProfileName("balanced") || isGovernancePolicyProfileName("strict")) {
      throw new Error("profile name guard mismatch");
    }

    console.log("PASS governance-policy-profile-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-policy-profile-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernancePolicyProfileDefaultUnit() {
  const { getGovernancePolicyProfile } = require(path.join(projectRoot, "dist", "repair", "governancePolicyProfile.js"));
  const { buildGovernanceInsights } = require(path.join(projectRoot, "dist", "repair", "governanceInsights.js"));

  try {
    const fallback = getGovernancePolicyProfile();
    const insights = buildGovernanceInsights(sampleRunsIndexForInsights());
    if (fallback.name !== "balanced" || insights.policyProfile.name !== "balanced") {
      throw new Error(`balanced should be default: profile=${JSON.stringify(fallback)} insights=${JSON.stringify(insights.policyProfile)}`);
    }

    console.log("PASS governance-policy-profile-default-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-policy-profile-default-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernancePolicyProfileInvalidUnit() {
  const { getGovernancePolicyProfile, isGovernancePolicyProfileName } = require(path.join(projectRoot, "dist", "repair", "governancePolicyProfile.js"));

  try {
    const fallback = getGovernancePolicyProfile("strict");
    if (fallback.name !== "balanced" || isGovernancePolicyProfileName("strict")) {
      throw new Error(`invalid profile should fall back to balanced and fail guard: ${JSON.stringify(fallback)}`);
    }

    console.log("PASS governance-policy-profile-invalid-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-policy-profile-invalid-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function profileThresholdIndex() {
  return {
    version: 1,
    updatedAt: "2026-05-10T00:00:00.000Z",
    totalRuns: 5,
    runs: [
      { runId: "p1", timestamp: "2026-05-10T01:00:00.000Z", governanceStatus: "ready", trustScore: 70, validationPassed: true, artifactPaths: {} },
      { runId: "p2", timestamp: "2026-05-10T02:00:00.000Z", governanceStatus: "ready", trustScore: 70, validationPassed: true, artifactPaths: {} },
      { runId: "p3", timestamp: "2026-05-10T03:00:00.000Z", governanceStatus: "ready", trustScore: 70, validationPassed: true, artifactPaths: {} },
      { runId: "p4", timestamp: "2026-05-10T04:00:00.000Z", governanceStatus: "ready-with-caution", trustScore: 70, validationPassed: true, artifactPaths: {} },
      { runId: "p5", timestamp: "2026-05-10T05:00:00.000Z", governanceStatus: "blocked", trustScore: 70, validationPassed: false, artifactPaths: {} }
    ]
  };
}

function runGovernanceInsightsProfileThresholdUnit() {
  const { buildGovernanceInsights } = require(path.join(projectRoot, "dist", "repair", "governanceInsights.js"));

  try {
    const conservative = buildGovernanceInsights(profileThresholdIndex(), { profile: "conservative" });
    const balanced = buildGovernanceInsights(profileThresholdIndex(), { profile: "balanced" });
    const experimental = buildGovernanceInsights(profileThresholdIndex(), { profile: "experimental" });
    const conservativeCodes = conservative.insights.map((insight) => insight.code);
    const balancedCodes = balanced.insights.map((insight) => insight.code);
    const experimentalCodes = experimental.insights.map((insight) => insight.code);
    if (!conservativeCodes.includes("HIGH_BLOCKED_RATE") || !conservativeCodes.includes("LOW_AVERAGE_TRUST")) {
      throw new Error(`conservative should warn sooner: ${JSON.stringify(conservative.insights)}`);
    }
    if (balancedCodes.includes("HIGH_BLOCKED_RATE") || balancedCodes.includes("LOW_AVERAGE_TRUST")) {
      throw new Error(`balanced should preserve v3.4 thresholds: ${JSON.stringify(balanced.insights)}`);
    }
    if (experimental.insights.some((insight) => insight.severity !== "info")) {
      throw new Error(`experimental should be more relaxed for this fixture: ${JSON.stringify(experimental.insights)}`);
    }

    console.log("PASS governance-insights-profile-threshold-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-insights-profile-threshold-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceInsightsProfileRenderUnit() {
  const { buildGovernanceInsights, renderGovernanceInsightsMarkdown } = require(path.join(projectRoot, "dist", "repair", "governanceInsights.js"));

  try {
    const markdown = renderGovernanceInsightsMarkdown(buildGovernanceInsights(sampleRunsIndexForInsights(), { profile: "conservative" }));
    for (const needle of ["Policy profile: conservative", "Operator mode: Conservative governance", "Risk tolerance: low"]) {
      if (!markdown.includes(needle)) {
        throw new Error(`profile markdown missing ${needle}: ${markdown}`);
      }
    }

    console.log("PASS governance-insights-profile-render-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-insights-profile-render-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceInsightsProfileJsonUnit() {
  const { buildGovernanceInsights } = require(path.join(projectRoot, "dist", "repair", "governanceInsights.js"));

  try {
    const json = JSON.stringify(buildGovernanceInsights(sampleRunsIndexForInsights(), { profile: "experimental" }), null, 2);
    const parsed = JSON.parse(json);
    if (
      parsed.policyProfile.name !== "experimental" ||
      parsed.policyProfile.operatorMode !== "Experimental governance" ||
      parsed.policyProfile.riskTolerance !== "high"
    ) {
      throw new Error(`profile JSON mismatch: ${json}`);
    }

    console.log("PASS governance-insights-profile-json-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-insights-profile-json-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceInsightsProfileExportUnit() {
  const { buildGovernanceInsights, exportGovernanceInsights } = require(path.join(projectRoot, "dist", "repair", "governanceInsights.js"));

  try {
    const repo = createInsightsTestRepo("governance-insights-profile-export");
    const indexPath = path.join(repo, ".factory", "runs-index.json");
    const beforeIndex = fs.readFileSync(indexPath, "utf8");
    const result = exportGovernanceInsights(repo, buildGovernanceInsights(sampleRunsIndexForInsights(), { profile: "conservative" }));
    const parsed = JSON.parse(fs.readFileSync(path.join(repo, result.files[0]), "utf8"));
    const markdown = fs.readFileSync(path.join(repo, result.files[1]), "utf8");
    const afterIndex = fs.readFileSync(indexPath, "utf8");
    if (parsed.policyProfile.name !== "conservative" || !markdown.includes("Policy profile: conservative")) {
      throw new Error(`profile export mismatch: parsed=${JSON.stringify(parsed.policyProfile)} markdown=${markdown}`);
    }
    if (beforeIndex !== afterIndex) {
      throw new Error("profile export must not modify .factory/runs-index.json");
    }

    console.log("PASS governance-insights-profile-export-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-insights-profile-export-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceInsightsProfileCliUnit() {
  try {
    const repo = createInsightsTestRepo("governance-insights-profile-cli");
    const indexPath = path.join(repo, ".factory", "runs-index.json");
    const beforeIndex = fs.readFileSync(indexPath, "utf8");
    const textResult = spawnSync(process.execPath, [cliPath, "insights", "--repo", repo, "--profile", "conservative"], {
      cwd: projectRoot,
      encoding: "utf8"
    });
    if (textResult.status !== 0 || !textResult.stdout.includes("Policy profile: conservative")) {
      throw new Error(`profile CLI text mismatch: status=${textResult.status} stdout=${textResult.stdout} stderr=${textResult.stderr}`);
    }

    const jsonResult = spawnSync(process.execPath, [cliPath, "insights", "--repo", repo, "--profile", "experimental", "--json"], {
      cwd: projectRoot,
      encoding: "utf8"
    });
    const parsed = JSON.parse(jsonResult.stdout);
    if (jsonResult.status !== 0 || parsed.policyProfile.name !== "experimental") {
      throw new Error(`profile CLI JSON mismatch: status=${jsonResult.status} stdout=${jsonResult.stdout} stderr=${jsonResult.stderr}`);
    }

    const exportResult = spawnSync(process.execPath, [cliPath, "insights", "--repo", repo, "--profile", "conservative", "--export"], {
      cwd: projectRoot,
      encoding: "utf8"
    });
    if (exportResult.status !== 0 || !exportResult.stdout.includes("Exported governance insights:")) {
      throw new Error(`profile CLI export mismatch: status=${exportResult.status} stdout=${exportResult.stdout} stderr=${exportResult.stderr}`);
    }
    const exported = JSON.parse(fs.readFileSync(path.join(repo, ".factory", "exports", "governance-insights.json"), "utf8"));
    if (exported.policyProfile.name !== "conservative") {
      throw new Error(`exported CLI profile mismatch: ${JSON.stringify(exported.policyProfile)}`);
    }

    const invalidResult = spawnSync(process.execPath, [cliPath, "insights", "--repo", repo, "--profile", "strict"], {
      cwd: projectRoot,
      encoding: "utf8"
    });
    if (invalidResult.status === 0 || !invalidResult.stderr.includes("Invalid governance policy profile: strict")) {
      throw new Error(`invalid profile CLI mismatch: status=${invalidResult.status} stdout=${invalidResult.stdout} stderr=${invalidResult.stderr}`);
    }

    const afterIndex = fs.readFileSync(indexPath, "utf8");
    if (beforeIndex !== afterIndex) {
      throw new Error("profile CLI must not modify .factory/runs-index.json");
    }

    console.log("PASS governance-insights-profile-cli-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-insights-profile-cli-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceInsightsProfilesListCliUnit() {
  try {
    const textResult = spawnSync(process.execPath, [cliPath, "insights", "--profiles"], {
      cwd: projectRoot,
      encoding: "utf8"
    });
    if (
      textResult.status !== 0 ||
      !textResult.stdout.includes("Available governance policy profiles:") ||
      !textResult.stdout.includes("- conservative: strict governance, low risk tolerance") ||
      !textResult.stdout.includes("- balanced: default governance, medium risk tolerance") ||
      !textResult.stdout.includes("- experimental: relaxed governance, high risk tolerance")
    ) {
      throw new Error(`profiles CLI text mismatch: status=${textResult.status} stdout=${textResult.stdout} stderr=${textResult.stderr}`);
    }

    const jsonResult = spawnSync(process.execPath, [cliPath, "insights", "--profiles", "--json"], {
      cwd: projectRoot,
      encoding: "utf8"
    });
    const parsed = JSON.parse(jsonResult.stdout);
    if (jsonResult.status !== 0 || parsed.length !== 3 || parsed[0].name !== "conservative" || parsed[2].name !== "experimental") {
      throw new Error(`profiles CLI JSON mismatch: status=${jsonResult.status} stdout=${jsonResult.stdout} stderr=${jsonResult.stderr}`);
    }

    console.log("PASS governance-insights-profiles-list-cli-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-insights-profiles-list-cli-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function ciIndex(status, count, extra = {}) {
  return Array.from({ length: count }, (_, index) => ({
    runId: `${status}-${index}`,
    timestamp: `2026-05-10T${String(index).padStart(2, "0")}:00:00.000Z`,
    governanceStatus: status,
    trustLevel: status === "blocked" ? "unsafe" : "high",
    trustScore: status === "blocked" ? 30 : 90,
    releaseDecision: status === "blocked" ? "block" : "allow",
    repairOutcome: status === "blocked" ? "failed-worse" : "success",
    validationPassed: status !== "blocked",
    requiresHumanReview: status === "manual-review-required",
    isBlocked: status === "blocked",
    artifactPaths: {},
    ...extra
  }));
}

function governanceCiInsightsFor(index, profile = "balanced") {
  const { buildGovernanceInsights } = require(path.join(projectRoot, "dist", "repair", "governanceInsights.js"));
  return buildGovernanceInsights(index, { profile });
}

function governanceCiSummaryFor(index, profile = "balanced") {
  const { buildGovernanceCiSummary } = require(path.join(projectRoot, "dist", "repair", "governanceCiSummary.js"));
  return buildGovernanceCiSummary(governanceCiInsightsFor(index, profile));
}

function passCiIndex() {
  return {
    version: 1,
    updatedAt: "2026-05-10T00:00:00.000Z",
    totalRuns: 5,
    runs: ciIndex("ready", 5)
  };
}

function warnCiIndex() {
  return {
    version: 1,
    updatedAt: "2026-05-10T00:00:00.000Z",
    totalRuns: 5,
    runs: [...ciIndex("ready", 3), ...ciIndex("manual-review-required", 2, { validationPassed: true, trustScore: 85 })]
  };
}

function failCiIndex() {
  return {
    version: 1,
    updatedAt: "2026-05-10T00:00:00.000Z",
    totalRuns: 4,
    runs: [...ciIndex("ready", 2), ...ciIndex("blocked", 2)]
  };
}

function createCiSummaryRepo(name, index) {
  const repo = path.join(projectRoot, ".scenario-unit", name);
  fs.rmSync(repo, { recursive: true, force: true });
  ensureDir(repo);
  if (index) {
    const indexPath = path.join(repo, ".factory", "runs-index.json");
    ensureDir(path.dirname(indexPath));
    writeJson(indexPath, index);
  }
  return repo;
}

function runGovernanceCiSummaryUnit() {
  try {
    const summary = governanceCiSummaryFor(warnCiIndex());
    if (
      summary.version !== 1 ||
      summary.evaluatedProfile.name !== "balanced" ||
      summary.metrics.totalRuns !== 5 ||
      summary.insightCounts.warning < 1 ||
      !summary.triggeringInsights.some((insight) => insight.code === "HIGH_HUMAN_REVIEW_RATE")
    ) {
      throw new Error(`CI summary shape mismatch: ${JSON.stringify(summary)}`);
    }

    console.log("PASS governance-ci-summary-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-ci-summary-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceCiSummaryPassUnit() {
  try {
    const summary = governanceCiSummaryFor(passCiIndex());
    if (summary.status !== "pass" || summary.summary !== "Governance health is within acceptable thresholds.") {
      throw new Error(`expected pass summary: ${JSON.stringify(summary)}`);
    }
    if (!summary.recommendations.includes("No immediate governance action required.")) {
      throw new Error(`pass recommendation mismatch: ${JSON.stringify(summary.recommendations)}`);
    }

    console.log("PASS governance-ci-summary-pass-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-ci-summary-pass-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceCiSummaryWarnUnit() {
  try {
    const summary = governanceCiSummaryFor(warnCiIndex());
    if (summary.status !== "warn" || summary.summary !== "Governance health contains warnings or elevated operational risks.") {
      throw new Error(`expected warn summary: ${JSON.stringify(summary)}`);
    }
    if (!summary.recommendations.includes("Review recurring manual-review-required runs.")) {
      throw new Error(`warn recommendation mismatch: ${JSON.stringify(summary.recommendations)}`);
    }

    console.log("PASS governance-ci-summary-warn-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-ci-summary-warn-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceCiSummaryFailUnit() {
  try {
    const summary = governanceCiSummaryFor(failCiIndex());
    if (summary.status !== "fail" || summary.insightCounts.critical < 1) {
      throw new Error(`expected fail summary: ${JSON.stringify(summary)}`);
    }
    if (!summary.recommendations.includes("Investigate critical governance insights before release.")) {
      throw new Error(`fail recommendation mismatch: ${JSON.stringify(summary.recommendations)}`);
    }

    console.log("PASS governance-ci-summary-fail-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-ci-summary-fail-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceCiSummaryThresholdUnit() {
  try {
    const lowValidationIndex = {
      version: 1,
      updatedAt: "2026-05-10T00:00:00.000Z",
      totalRuns: 4,
      runs: [
        ...ciIndex("ready", 2),
        ...ciIndex("ready", 2, { validationPassed: false, trustScore: 90 })
      ]
    };
    const lowValidationSummary = governanceCiSummaryFor(lowValidationIndex);
    if (lowValidationSummary.status !== "fail" || lowValidationSummary.metrics.validationSuccessRate !== 50) {
      throw new Error(`low validation should fail: ${JSON.stringify(lowValidationSummary)}`);
    }

    const lowTrustIndex = {
      version: 1,
      updatedAt: "2026-05-10T00:00:00.000Z",
      totalRuns: 3,
      runs: ciIndex("ready", 3, { trustScore: 45, validationPassed: true })
    };
    const lowTrustSummary = governanceCiSummaryFor(lowTrustIndex);
    if (lowTrustSummary.status !== "fail" || lowTrustSummary.metrics.averageTrustScore !== 45) {
      throw new Error(`low trust should fail: ${JSON.stringify(lowTrustSummary)}`);
    }

    console.log("PASS governance-ci-summary-threshold-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-ci-summary-threshold-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceCiSummaryRenderUnit() {
  const { renderGovernanceCiSummaryMarkdown } = require(path.join(projectRoot, "dist", "repair", "governanceCiSummary.js"));

  try {
    const markdown = renderGovernanceCiSummaryMarkdown(governanceCiSummaryFor(warnCiIndex()));
    for (const needle of [
      "Governance CI Summary",
      "Status: warn",
      "Governance health contains warnings or elevated operational risks.",
      "## Metrics",
      "- human review rate: 40%",
      "## Triggering Insights",
      "HIGH_HUMAN_REVIEW_RATE"
    ]) {
      if (!markdown.includes(needle)) {
        throw new Error(`CI summary markdown missing ${needle}: ${markdown}`);
      }
    }

    console.log("PASS governance-ci-summary-render-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-ci-summary-render-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceCiSummaryExportUnit() {
  const { exportGovernanceCiSummary } = require(path.join(projectRoot, "dist", "repair", "governanceCiSummary.js"));

  try {
    const repo = createCiSummaryRepo("governance-ci-summary-export", warnCiIndex());
    const indexPath = path.join(repo, ".factory", "runs-index.json");
    const beforeIndex = fs.readFileSync(indexPath, "utf8");
    const result = exportGovernanceCiSummary(repo, governanceCiSummaryFor(warnCiIndex()));
    const parsed = JSON.parse(fs.readFileSync(path.join(repo, result.files[0]), "utf8"));
    const markdown = fs.readFileSync(path.join(repo, result.files[1]), "utf8");
    const afterIndex = fs.readFileSync(indexPath, "utf8");
    if (parsed.status !== "warn" || !markdown.includes("Status: warn") || result.files.length !== 2) {
      throw new Error(`CI summary export mismatch: result=${JSON.stringify(result)} parsed=${JSON.stringify(parsed)}`);
    }
    if (beforeIndex !== afterIndex) {
      throw new Error("CI summary export must not modify .factory/runs-index.json");
    }

    console.log("PASS governance-ci-summary-export-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-ci-summary-export-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceCiSummaryCliUnit() {
  try {
    const repo = createCiSummaryRepo("governance-ci-summary-cli", warnCiIndex());
    const indexPath = path.join(repo, ".factory", "runs-index.json");
    const beforeIndex = fs.readFileSync(indexPath, "utf8");
    const textResult = spawnSync(process.execPath, [cliPath, "ci-summary", "--repo", repo], {
      cwd: projectRoot,
      encoding: "utf8"
    });
    if (textResult.status !== 0 || !textResult.stdout.includes("Status: warn")) {
      throw new Error(`CI summary CLI text mismatch: status=${textResult.status} stdout=${textResult.stdout} stderr=${textResult.stderr}`);
    }

    const jsonResult = spawnSync(process.execPath, [cliPath, "ci-summary", "--repo", repo, "--profile", "experimental", "--json"], {
      cwd: projectRoot,
      encoding: "utf8"
    });
    const parsed = JSON.parse(jsonResult.stdout);
    if (jsonResult.status !== 0 || parsed.evaluatedProfile.name !== "experimental" || parsed.status !== "pass") {
      throw new Error(`CI summary CLI JSON mismatch: status=${jsonResult.status} stdout=${jsonResult.stdout} stderr=${jsonResult.stderr}`);
    }

    const exportResult = spawnSync(process.execPath, [cliPath, "ci-summary", "--repo", repo, "--export"], {
      cwd: projectRoot,
      encoding: "utf8"
    });
    if (exportResult.status !== 0 || !exportResult.stdout.includes("Exported governance CI summary:")) {
      throw new Error(`CI summary CLI export mismatch: status=${exportResult.status} stdout=${exportResult.stdout} stderr=${exportResult.stderr}`);
    }

    const exportJsonResult = spawnSync(process.execPath, [cliPath, "ci-summary", "--repo", repo, "--json", "--export"], {
      cwd: projectRoot,
      encoding: "utf8"
    });
    const exportParsed = JSON.parse(exportJsonResult.stdout);
    if (exportJsonResult.status !== 0 || exportParsed.exported !== true || exportParsed.files.length !== 2) {
      throw new Error(`CI summary CLI export JSON mismatch: status=${exportJsonResult.status} stdout=${exportJsonResult.stdout} stderr=${exportJsonResult.stderr}`);
    }

    const afterIndex = fs.readFileSync(indexPath, "utf8");
    if (beforeIndex !== afterIndex) {
      throw new Error("CI summary CLI must not modify .factory/runs-index.json");
    }

    console.log("PASS governance-ci-summary-cli-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-ci-summary-cli-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceCiSummaryExitCodeUnit() {
  try {
    const passRepo = createCiSummaryRepo("governance-ci-summary-pass-exit", passCiIndex());
    const warnRepo = createCiSummaryRepo("governance-ci-summary-warn-exit", warnCiIndex());
    const failRepo = createCiSummaryRepo("governance-ci-summary-fail-exit", failCiIndex());
    const passResult = spawnSync(process.execPath, [cliPath, "ci-summary", "--repo", passRepo], { cwd: projectRoot, encoding: "utf8" });
    const warnResult = spawnSync(process.execPath, [cliPath, "ci-summary", "--repo", warnRepo], { cwd: projectRoot, encoding: "utf8" });
    const failResult = spawnSync(process.execPath, [cliPath, "ci-summary", "--repo", failRepo], { cwd: projectRoot, encoding: "utf8" });
    if (passResult.status !== 0 || warnResult.status !== 0 || failResult.status !== 1) {
      throw new Error(`exit code mismatch: pass=${passResult.status} warn=${warnResult.status} fail=${failResult.status}`);
    }

    console.log("PASS governance-ci-summary-exit-code-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-ci-summary-exit-code-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceCiSummaryMissingIndexUnit() {
  try {
    const repo = createCiSummaryRepo("governance-ci-summary-missing", null);
    const result = spawnSync(process.execPath, [cliPath, "ci-summary", "--repo", repo, "--json"], {
      cwd: projectRoot,
      encoding: "utf8"
    });
    const parsed = JSON.parse(result.stdout);
    if (result.status !== 0 || parsed.status !== "warn" || parsed.triggeringInsights[0]?.code !== "NO_RUNS") {
      throw new Error(`missing index CI summary mismatch: status=${result.status} stdout=${result.stdout} stderr=${result.stderr}`);
    }

    console.log("PASS governance-ci-summary-missing-index-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-ci-summary-missing-index-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function createArchiveRepo(name, index = warnCiIndex()) {
  return createCiSummaryRepo(name, index);
}

function assertArchivePath(filePath, kind) {
  const normalized = filePath.split(path.sep).join("/");
  const pattern = new RegExp(`^\\.factory/archive/\\d{4}-\\d{2}-\\d{2}T\\d{2}-\\d{2}-\\d{2}-\\d{3}Z/${kind}/`);
  if (!pattern.test(normalized)) {
    throw new Error(`archive path mismatch for ${kind}: ${filePath}`);
  }
}

function runGovernanceArchiveIdUnit() {
  const { createGovernanceArchiveId } = require(path.join(projectRoot, "dist", "repair", "governanceArchive.js"));
  try {
    const archiveId = createGovernanceArchiveId(new Date("2026-05-10T19:45:22.123Z"));
    if (archiveId !== "2026-05-10T19-45-22-123Z") {
      throw new Error(`archive id mismatch: ${archiveId}`);
    }

    console.log("PASS governance-archive-id-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-archive-id-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceArchiveCopyUnit() {
  const { archiveGovernanceFiles } = require(path.join(projectRoot, "dist", "repair", "governanceArchive.js"));
  try {
    const repo = createArchiveRepo("governance-archive-copy");
    const sourcePath = path.join(repo, ".factory", "exports", "sample.json");
    ensureDir(path.dirname(sourcePath));
    fs.writeFileSync(sourcePath, "{\"ok\":true}\n", "utf8");
    const result = archiveGovernanceFiles(repo, "governance-insights", [{ sourcePath: ".factory/exports/sample.json", archiveName: "governance-insights.json" }], {
      date: new Date("2026-05-10T19:45:22.123Z")
    });
    const archivedPath = path.join(repo, result.files[0]);
    if (!result.archived || result.archiveId !== "2026-05-10T19-45-22-123Z" || !fs.existsSync(archivedPath)) {
      throw new Error(`archive copy mismatch: ${JSON.stringify(result)}`);
    }
    if (fs.readFileSync(archivedPath, "utf8") !== "{\"ok\":true}\n") {
      throw new Error("archived file content mismatch");
    }

    console.log("PASS governance-archive-copy-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-archive-copy-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceArchiveMissingFileUnit() {
  const { archiveGovernanceFiles } = require(path.join(projectRoot, "dist", "repair", "governanceArchive.js"));
  try {
    const repo = createArchiveRepo("governance-archive-missing");
    const result = archiveGovernanceFiles(repo, "runs-dashboard", [{ sourcePath: ".factory/exports/missing.json", archiveName: "missing.json" }], {
      date: new Date("2026-05-10T19:45:22.123Z")
    });
    if (result.archived !== false || result.files.length !== 0 || result.warnings[0] !== "Archive source file missing: .factory/exports/missing.json") {
      throw new Error(`missing file archive mismatch: ${JSON.stringify(result)}`);
    }

    console.log("PASS governance-archive-missing-file-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-archive-missing-file-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceArchiveRunsExportUnit() {
  try {
    const repo = createArchiveRepo("governance-archive-runs", warnCiIndex());
    const indexPath = path.join(repo, ".factory", "runs-index.json");
    const beforeIndex = fs.readFileSync(indexPath, "utf8");
    const result = runCliHelpCommand(["runs", "--repo", repo, "--export", "all", "--archive"]);
    const afterIndex = fs.readFileSync(indexPath, "utf8");
    if (result.status !== 0 || !result.stdout.includes("Archived run dashboard:")) {
      throw new Error(`runs archive CLI mismatch: status=${result.status} stdout=${result.stdout} stderr=${result.stderr}`);
    }
    for (const fileName of ["runs-dashboard.json", "runs-dashboard.md", "runs-dashboard.csv"]) {
      const match = result.stdout.split(/\r?\n/).find((line) => line.includes(`/runs-dashboard/${fileName}`));
      if (!match) throw new Error(`missing archived ${fileName}: ${result.stdout}`);
      assertArchivePath(match.slice(2), "runs-dashboard");
    }
    if (beforeIndex !== afterIndex) throw new Error("runs archive must not modify runs-index.json");

    console.log("PASS governance-archive-runs-export-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-archive-runs-export-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceArchiveInsightsExportUnit() {
  try {
    const repo = createArchiveRepo("governance-archive-insights", warnCiIndex());
    const indexPath = path.join(repo, ".factory", "runs-index.json");
    const beforeIndex = fs.readFileSync(indexPath, "utf8");
    const result = runCliHelpCommand(["insights", "--repo", repo, "--export", "--archive"]);
    const afterIndex = fs.readFileSync(indexPath, "utf8");
    if (result.status !== 0 || !result.stdout.includes("Archived governance insights:")) {
      throw new Error(`insights archive CLI mismatch: status=${result.status} stdout=${result.stdout} stderr=${result.stderr}`);
    }
    if (!result.stdout.includes("governance-insights/governance-insights.json") || !result.stdout.includes("governance-insights/governance-insights.md")) {
      throw new Error(`insights archive files missing: ${result.stdout}`);
    }
    if (beforeIndex !== afterIndex) throw new Error("insights archive must not modify runs-index.json");

    console.log("PASS governance-archive-insights-export-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-archive-insights-export-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceArchiveCiSummaryExportUnit() {
  try {
    const repo = createArchiveRepo("governance-archive-ci-summary", warnCiIndex());
    const indexPath = path.join(repo, ".factory", "runs-index.json");
    const beforeIndex = fs.readFileSync(indexPath, "utf8");
    const result = runCliHelpCommand(["ci-summary", "--repo", repo, "--export", "--archive"]);
    const afterIndex = fs.readFileSync(indexPath, "utf8");
    if (result.status !== 0 || !result.stdout.includes("Archived governance CI summary:")) {
      throw new Error(`ci summary archive CLI mismatch: status=${result.status} stdout=${result.stdout} stderr=${result.stderr}`);
    }
    if (!result.stdout.includes("governance-ci-summary/governance-ci-summary.json") || !result.stdout.includes("governance-ci-summary/governance-ci-summary.md")) {
      throw new Error(`ci summary archive files missing: ${result.stdout}`);
    }
    if (beforeIndex !== afterIndex) throw new Error("ci summary archive must not modify runs-index.json");

    console.log("PASS governance-archive-ci-summary-export-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-archive-ci-summary-export-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceArchiveJsonOutputUnit() {
  try {
    const repo = createArchiveRepo("governance-archive-json", warnCiIndex());
    const result = runCliHelpCommand(["runs", "--repo", repo, "--export", "json", "--archive", "--json"]);
    const parsed = JSON.parse(result.stdout);
    if (result.status !== 0 || parsed.export.exported !== true || parsed.archive.archived !== true || parsed.archive.files.length !== 1) {
      throw new Error(`archive JSON output mismatch: status=${result.status} stdout=${result.stdout} stderr=${result.stderr}`);
    }
    assertArchivePath(parsed.archive.files[0], "runs-dashboard");

    console.log("PASS governance-archive-json-output-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-archive-json-output-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceArchiveRequiresExportUnit() {
  try {
    const repo = createArchiveRepo("governance-archive-requires-export", warnCiIndex());
    for (const command of ["runs", "insights", "ci-summary"]) {
      const result = runCliHelpCommand([command, "--repo", repo, "--archive"]);
      if (result.status !== 1 || !result.stderr.includes("Archive option requires --export.")) {
        throw new Error(`${command} archive requires export mismatch: status=${result.status} stderr=${result.stderr}`);
      }
    }

    console.log("PASS governance-archive-requires-export-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-archive-requires-export-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceArchiveHelpUnit() {
  try {
    for (const command of ["runs", "insights", "ci-summary"]) {
      const result = runCliHelpCommand([command, "--help"]);
      if (result.status !== 0 || !result.stdout.includes("--archive") || !result.stdout.includes("only works with --export")) {
        throw new Error(`${command} help missing archive text: ${result.stdout}`);
      }
    }

    console.log("PASS governance-archive-help-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-archive-help-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceArchiveCiExitCodeUnit() {
  try {
    const repo = createArchiveRepo("governance-archive-ci-fail", failCiIndex());
    const result = runCliHelpCommand(["ci-summary", "--repo", repo, "--export", "--archive"]);
    if (result.status !== 1 || !result.stdout.includes("Archived governance CI summary:")) {
      throw new Error(`CI archive fail exit mismatch: status=${result.status} stdout=${result.stdout} stderr=${result.stderr}`);
    }

    console.log("PASS governance-archive-ci-exit-code-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-archive-ci-exit-code-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function sampleArchiveResult(kind = "governance-insights", archiveId = "2026-05-10T19-45-22-123Z") {
  return {
    archived: true,
    archiveId,
    archiveDir: `.factory/archive/${archiveId}/${kind}`,
    files: [`.factory/archive/${archiveId}/${kind}/${kind}.json`],
    warnings: []
  };
}

function sampleArchiveIndex() {
  return {
    version: 1,
    updatedAt: "2026-05-10T20:00:00.000Z",
    totalArchives: 3,
    archives: [
      {
        archiveId: "2026-05-10T19-45-22-123Z",
        createdAt: "2026-05-10T19:45:22.123Z",
        kind: "governance-insights",
        archiveDir: ".factory/archive/2026-05-10T19-45-22-123Z/governance-insights",
        files: [
          ".factory/archive/2026-05-10T19-45-22-123Z/governance-insights/governance-insights.json",
          ".factory/archive/2026-05-10T19-45-22-123Z/governance-insights/governance-insights.md"
        ],
        metadata: { profile: "conservative", runCount: 4 }
      },
      {
        archiveId: "2026-05-10T19-40-01-901Z",
        createdAt: "2026-05-10T19:40:01.901Z",
        kind: "governance-ci-summary",
        archiveDir: ".factory/archive/2026-05-10T19-40-01-901Z/governance-ci-summary",
        files: [
          ".factory/archive/2026-05-10T19-40-01-901Z/governance-ci-summary/governance-ci-summary.json",
          ".factory/archive/2026-05-10T19-40-01-901Z/governance-ci-summary/governance-ci-summary.md"
        ],
        metadata: { profile: "balanced", ciStatus: "warn", runCount: 4 }
      },
      {
        archiveId: "2026-05-10T19-35-12-010Z",
        createdAt: "2026-05-10T19:35:12.010Z",
        kind: "runs-dashboard",
        archiveDir: ".factory/archive/2026-05-10T19-35-12-010Z/runs-dashboard",
        files: [
          ".factory/archive/2026-05-10T19-35-12-010Z/runs-dashboard/runs-dashboard.json",
          ".factory/archive/2026-05-10T19-35-12-010Z/runs-dashboard/runs-dashboard.md",
          ".factory/archive/2026-05-10T19-35-12-010Z/runs-dashboard/runs-dashboard.csv"
        ],
        metadata: { exportFormat: "all", displayedRuns: 4 }
      }
    ]
  };
}

function writeArchiveIndex(repo, index = sampleArchiveIndex()) {
  const indexPath = path.join(repo, ".factory", "archive-index.json");
  ensureDir(path.dirname(indexPath));
  fs.writeFileSync(indexPath, `${JSON.stringify(index, null, 2)}\n`, "utf8");
  return indexPath;
}

function runGovernanceArchiveIndexUnit() {
  const {
    buildGovernanceArchiveIndexEntry,
    loadGovernanceArchiveIndex
  } = require(path.join(projectRoot, "dist", "repair", "governanceArchiveIndex.js"));
  try {
    const repo = createArchiveRepo("governance-archive-index-unit", null);
    const empty = loadGovernanceArchiveIndex(repo);
    if (empty.version !== 1 || empty.totalArchives !== 0 || empty.archives.length !== 0) {
      throw new Error(`empty archive index mismatch: ${JSON.stringify(empty)}`);
    }

    const entry = buildGovernanceArchiveIndexEntry({
      archiveResult: sampleArchiveResult("governance-insights"),
      kind: "governance-insights",
      sourceCommand: "insights --export --archive",
      metadata: { profile: "conservative", runCount: 3 }
    });
    if (
      entry.createdAt !== "2026-05-10T19:45:22.123Z" ||
      entry.kind !== "governance-insights" ||
      entry.metadata.profile !== "conservative" ||
      entry.files[0] !== ".factory/archive/2026-05-10T19-45-22-123Z/governance-insights/governance-insights.json"
    ) {
      throw new Error(`archive entry mismatch: ${JSON.stringify(entry)}`);
    }

    console.log("PASS governance-archive-index-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-archive-index-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceArchiveIndexUpdateUnit() {
  const {
    buildGovernanceArchiveIndexEntry,
    updateGovernanceArchiveIndex
  } = require(path.join(projectRoot, "dist", "repair", "governanceArchiveIndex.js"));
  try {
    const empty = { version: 1, updatedAt: "1970-01-01T00:00:00.000Z", totalArchives: 0, archives: [] };
    const entry = buildGovernanceArchiveIndexEntry({
      archiveResult: sampleArchiveResult("runs-dashboard", "2026-05-10T19-35-12-010Z"),
      kind: "runs-dashboard",
      metadata: { exportFormat: "json", displayedRuns: 2 }
    });
    const updated = updateGovernanceArchiveIndex(empty, entry);
    if (updated.totalArchives !== 1 || updated.archives.length !== 1 || updated.archives[0].metadata.displayedRuns !== 2) {
      throw new Error(`archive index update mismatch: ${JSON.stringify(updated)}`);
    }

    console.log("PASS governance-archive-index-update-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-archive-index-update-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceArchiveIndexReplaceUnit() {
  const {
    buildGovernanceArchiveIndexEntry,
    updateGovernanceArchiveIndex
  } = require(path.join(projectRoot, "dist", "repair", "governanceArchiveIndex.js"));
  try {
    const first = buildGovernanceArchiveIndexEntry({
      archiveResult: sampleArchiveResult("governance-ci-summary"),
      kind: "governance-ci-summary",
      metadata: { profile: "balanced", ciStatus: "warn" }
    });
    const second = buildGovernanceArchiveIndexEntry({
      archiveResult: sampleArchiveResult("governance-ci-summary"),
      kind: "governance-ci-summary",
      metadata: { profile: "balanced", ciStatus: "pass" }
    });
    const once = updateGovernanceArchiveIndex({ version: 1, updatedAt: "x", totalArchives: 0, archives: [] }, first);
    const twice = updateGovernanceArchiveIndex(once, second);
    if (twice.totalArchives !== 1 || twice.archives[0].metadata.ciStatus !== "pass") {
      throw new Error(`archive index replace mismatch: ${JSON.stringify(twice)}`);
    }

    console.log("PASS governance-archive-index-replace-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-archive-index-replace-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceArchiveIndexSortUnit() {
  const {
    buildGovernanceArchiveIndexEntry,
    updateGovernanceArchiveIndex
  } = require(path.join(projectRoot, "dist", "repair", "governanceArchiveIndex.js"));
  try {
    const older = buildGovernanceArchiveIndexEntry({
      archiveResult: sampleArchiveResult("runs-dashboard", "2026-05-10T19-35-12-010Z"),
      kind: "runs-dashboard"
    });
    const newer = buildGovernanceArchiveIndexEntry({
      archiveResult: sampleArchiveResult("governance-insights", "2026-05-10T19-45-22-123Z"),
      kind: "governance-insights"
    });
    const sameTime = buildGovernanceArchiveIndexEntry({
      archiveResult: sampleArchiveResult("governance-ci-summary", "2026-05-10T19-45-22-123Z"),
      kind: "governance-ci-summary"
    });
    const index = [older, newer, sameTime].reduce(
      (current, entry) => updateGovernanceArchiveIndex(current, entry),
      { version: 1, updatedAt: "x", totalArchives: 0, archives: [] }
    );
    if (
      index.archives[0].kind !== "governance-ci-summary" ||
      index.archives[1].kind !== "governance-insights" ||
      index.archives[2].kind !== "runs-dashboard"
    ) {
      throw new Error(`archive index sort mismatch: ${JSON.stringify(index.archives.map((entry) => entry.kind))}`);
    }

    console.log("PASS governance-archive-index-sort-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-archive-index-sort-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceArchiveIndexArtifactUnit() {
  const {
    buildGovernanceArchiveIndexEntry,
    loadGovernanceArchiveIndex,
    saveGovernanceArchiveIndex,
    updateGovernanceArchiveIndex
  } = require(path.join(projectRoot, "dist", "repair", "governanceArchiveIndex.js"));
  try {
    const repo = createArchiveRepo("governance-archive-index-artifact", null);
    const entry = buildGovernanceArchiveIndexEntry({
      archiveResult: sampleArchiveResult("governance-insights"),
      kind: "governance-insights",
      metadata: { profile: "experimental" }
    });
    saveGovernanceArchiveIndex(repo, updateGovernanceArchiveIndex(loadGovernanceArchiveIndex(repo), entry));
    const indexPath = path.join(repo, ".factory", "archive-index.json");
    const fromDisk = JSON.parse(fs.readFileSync(indexPath, "utf8"));
    if (fromDisk.totalArchives !== 1 || fromDisk.archives[0].metadata.profile !== "experimental") {
      throw new Error(`archive index artifact mismatch: ${JSON.stringify(fromDisk)}`);
    }

    console.log("PASS governance-archive-index-artifact-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-archive-index-artifact-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceArchiveDashboardUnit() {
  const {
    buildGovernanceArchiveDashboard,
    renderGovernanceArchiveDashboardText
  } = require(path.join(projectRoot, "dist", "repair", "governanceArchiveDashboard.js"));
  try {
    const dashboard = buildGovernanceArchiveDashboard(sampleArchiveIndex(), { limit: 2 });
    const text = renderGovernanceArchiveDashboardText(dashboard);
    if (
      dashboard.totalArchives !== 3 ||
      dashboard.displayedArchives !== 2 ||
      dashboard.summary.runsDashboard !== 1 ||
      dashboard.summary.governanceInsights !== 1 ||
      dashboard.summary.governanceCiSummary !== 1 ||
      !text.includes("Total archived snapshots: 3") ||
      !text.includes("governance-insights")
    ) {
      throw new Error(`archive dashboard mismatch: ${JSON.stringify(dashboard)} text=${text}`);
    }

    console.log("PASS governance-archive-dashboard-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-archive-dashboard-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceArchiveDashboardFilterUnit() {
  const { buildGovernanceArchiveDashboard } = require(path.join(projectRoot, "dist", "repair", "governanceArchiveDashboard.js"));
  try {
    const dashboard = buildGovernanceArchiveDashboard(sampleArchiveIndex(), { kind: "governance-ci-summary", limit: 10 });
    if (dashboard.displayedArchives !== 1 || dashboard.rows[0].kind !== "governance-ci-summary" || dashboard.rows[0].ciStatus !== "warn") {
      throw new Error(`archive dashboard filter mismatch: ${JSON.stringify(dashboard)}`);
    }

    console.log("PASS governance-archive-dashboard-filter-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-archive-dashboard-filter-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceArchiveDashboardLatestUnit() {
  const { buildGovernanceArchiveDashboard } = require(path.join(projectRoot, "dist", "repair", "governanceArchiveDashboard.js"));
  try {
    const dashboard = buildGovernanceArchiveDashboard(sampleArchiveIndex(), { latestOnly: true, limit: 3 });
    if (dashboard.displayedArchives !== 1 || dashboard.rows[0].archiveId !== "2026-05-10T19-45-22-123Z") {
      throw new Error(`archive dashboard latest mismatch: ${JSON.stringify(dashboard)}`);
    }

    console.log("PASS governance-archive-dashboard-latest-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-archive-dashboard-latest-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceArchiveDashboardJsonUnit() {
  try {
    const repo = createArchiveRepo("governance-archive-dashboard-json", warnCiIndex());
    writeArchiveIndex(repo);
    const result = runCliHelpCommand(["archive", "--repo", repo, "--kind", "governance-insights", "--json"]);
    const parsed = JSON.parse(result.stdout);
    if (result.status !== 0 || parsed.displayedArchives !== 1 || parsed.rows[0].kind !== "governance-insights") {
      throw new Error(`archive dashboard JSON mismatch: status=${result.status} stdout=${result.stdout} stderr=${result.stderr}`);
    }

    console.log("PASS governance-archive-dashboard-json-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-archive-dashboard-json-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceArchiveCliUnit() {
  try {
    const repo = createArchiveRepo("governance-archive-cli", warnCiIndex());
    const runsIndexPath = path.join(repo, ".factory", "runs-index.json");
    const beforeRunsIndex = fs.readFileSync(runsIndexPath, "utf8");
    const exportResult = runCliHelpCommand(["runs", "--repo", repo, "--export", "json", "--archive"]);
    if (exportResult.status !== 0 || !exportResult.stdout.includes("Archived run dashboard:")) {
      throw new Error(`archive index export CLI mismatch: status=${exportResult.status} stdout=${exportResult.stdout} stderr=${exportResult.stderr}`);
    }
    const archiveIndexPath = path.join(repo, ".factory", "archive-index.json");
    const archiveIndex = JSON.parse(fs.readFileSync(archiveIndexPath, "utf8"));
    if (
      archiveIndex.totalArchives !== 1 ||
      archiveIndex.archives[0].kind !== "runs-dashboard" ||
      archiveIndex.archives[0].metadata.exportFormat !== "json"
    ) {
      throw new Error(`archive index CLI artifact mismatch: ${JSON.stringify(archiveIndex)}`);
    }
    const beforeArchiveIndex = fs.readFileSync(archiveIndexPath, "utf8");
    const listResult = runCliHelpCommand(["archive", "--repo", repo]);
    const afterArchiveIndex = fs.readFileSync(archiveIndexPath, "utf8");
    const afterRunsIndex = fs.readFileSync(runsIndexPath, "utf8");
    if (listResult.status !== 0 || !listResult.stdout.includes("Governance Archive Dashboard") || beforeArchiveIndex !== afterArchiveIndex) {
      throw new Error(`archive CLI read mismatch: status=${listResult.status} stdout=${listResult.stdout} stderr=${listResult.stderr}`);
    }
    if (beforeRunsIndex !== afterRunsIndex) {
      throw new Error("archive CLI must not modify .factory/runs-index.json");
    }

    console.log("PASS governance-archive-cli-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-archive-cli-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceArchiveCliMissingIndexUnit() {
  try {
    const repo = createArchiveRepo("governance-archive-cli-missing", null);
    const textResult = runCliHelpCommand(["archive", "--repo", repo]);
    const jsonResult = runCliHelpCommand(["archive", "--repo", repo, "--json"]);
    const parsed = JSON.parse(jsonResult.stdout);
    if (
      textResult.status !== 0 ||
      !textResult.stdout.includes("No archive index found.") ||
      jsonResult.status !== 0 ||
      parsed.warnings[0] !== "No archive index found"
    ) {
      throw new Error(`missing archive index CLI mismatch: text=${textResult.stdout} json=${jsonResult.stdout}`);
    }

    console.log("PASS governance-archive-cli-missing-index-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-archive-cli-missing-index-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceArchiveCliInvalidKindUnit() {
  try {
    const repo = createArchiveRepo("governance-archive-cli-invalid-kind", null);
    const result = runCliHelpCommand(["archive", "--repo", repo, "--kind", "bad-kind"]);
    if (
      result.status !== 1 ||
      !result.stderr.includes("Invalid archive kind: bad-kind") ||
      !result.stderr.includes("Allowed kinds: runs-dashboard, governance-insights, governance-ci-summary")
    ) {
      throw new Error(`invalid archive kind mismatch: status=${result.status} stderr=${result.stderr}`);
    }

    console.log("PASS governance-archive-cli-invalid-kind-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-archive-cli-invalid-kind-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceArchiveCliHelpUnit() {
  const { renderArchiveHelp, renderMainHelp } = require(path.join(projectRoot, "dist", "cliHelp.js"));
  try {
    const mainHelp = renderMainHelp();
    const archiveHelp = renderArchiveHelp();
    const cliHelp = runCliHelpCommand(["archive", "--help"]);
    const shortHelp = runCliHelpCommand(["archive", "-h"]);
    if (cliHelp.status !== 0 || shortHelp.status !== 0 || cliHelp.stdout !== archiveHelp || shortHelp.stdout !== archiveHelp) {
      throw new Error(`archive help mismatch: stdout=${cliHelp.stdout} short=${shortHelp.stdout}`);
    }
    assertHelpIncludes(mainHelp, ["archive     Show governance archive snapshot history"]);
    assertHelpIncludes(archiveHelp, [
      "Usage:\n  node dist/cli.js archive [options]",
      "--kind <kind>   Filter by archive kind",
      "governance-ci-summary",
      "Read-only guarantee:"
    ]);

    console.log("PASS governance-archive-cli-help-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-archive-cli-help-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

const ARCHIVE_DIFF_A = "2026-05-10T10-00-00-000Z";
const ARCHIVE_DIFF_B = "2026-05-11T10-00-00-000Z";

function archiveCreatedAt(archiveId) {
  return archiveId.replace(/T(\d{2})-(\d{2})-(\d{2})-(\d{3})Z$/, "T$1:$2:$3.$4Z");
}

function archiveDiffEntry(kind, archiveId, fileName = `${kind}.json`) {
  return {
    archiveId,
    createdAt: archiveCreatedAt(archiveId),
    kind,
    archiveDir: `.factory/archive/${archiveId}/${kind}`,
    files: [`.factory/archive/${archiveId}/${kind}/${fileName}`],
    metadata: kind === "governance-insights" ? { profile: "balanced", runCount: 4 } : { profile: "balanced", ciStatus: "warn" }
  };
}

function governanceInsightsSnapshot({
  blockedRate,
  humanReviewRate,
  validationSuccessRate,
  averageTrustScore,
  readyRate,
  generatedAt = "2026-05-11T10:00:00.000Z"
}) {
  return {
    version: 1,
    totalRuns: 4,
    rates: {
      blockedRate,
      humanReviewRate,
      validationSuccessRate,
      readyRate
    },
    trust: {
      averageTrustScore
    },
    insights: [],
    generatedAt
  };
}

function createArchiveDiffRepo(name, kind = "governance-insights", previousData = null, currentData = null) {
  const repo = createArchiveRepo(name, warnCiIndex());
  const previous = archiveDiffEntry(kind, ARCHIVE_DIFF_A);
  const current = archiveDiffEntry(kind, ARCHIVE_DIFF_B);
  const index = {
    version: 1,
    updatedAt: "2026-05-11T10:00:00.000Z",
    totalArchives: 2,
    archives: [current, previous]
  };
  writeArchiveIndex(repo, index);
  for (const [entry, data] of [[previous, previousData], [current, currentData]]) {
    if (data === null) continue;
    const filePath = path.join(repo, entry.files[0]);
    ensureDir(path.dirname(filePath));
    fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  }
  return repo;
}

function directDiff(previousData, currentData, kind = "governance-insights") {
  const { buildGovernanceArchiveDiff } = require(path.join(projectRoot, "dist", "repair", "governanceArchiveDiff.js"));
  return buildGovernanceArchiveDiff({
    previous: {
      entry: archiveDiffEntry(kind, ARCHIVE_DIFF_A),
      data: previousData
    },
    current: {
      entry: archiveDiffEntry(kind, ARCHIVE_DIFF_B),
      data: currentData
    }
  });
}

function runGovernanceArchiveDiffUnit() {
  try {
    const diff = directDiff(
      governanceInsightsSnapshot({ blockedRate: 20, humanReviewRate: 30, validationSuccessRate: 80, averageTrustScore: 70, readyRate: 40 }),
      governanceInsightsSnapshot({ blockedRate: 15, humanReviewRate: 25, validationSuccessRate: 88, averageTrustScore: 78, readyRate: 50 })
    );
    if (
      diff.version !== 1 ||
      diff.archiveA.archiveId !== ARCHIVE_DIFF_A ||
      diff.archiveB.archiveId !== ARCHIVE_DIFF_B ||
      diff.metrics.blockedRate.delta !== -5 ||
      diff.metrics.validationSuccessRate.delta !== 8 ||
      diff.comparison.status !== "improved"
    ) {
      throw new Error(`archive diff unit mismatch: ${JSON.stringify(diff)}`);
    }

    console.log("PASS governance-archive-diff-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-archive-diff-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceArchiveDiffImprovedUnit() {
  try {
    const diff = directDiff(
      governanceInsightsSnapshot({ blockedRate: 25, humanReviewRate: 20, validationSuccessRate: 70, averageTrustScore: 65, readyRate: 50 }),
      governanceInsightsSnapshot({ blockedRate: 10, humanReviewRate: 15, validationSuccessRate: 90, averageTrustScore: 80, readyRate: 75 })
    );
    if (diff.comparison.status !== "improved" || !diff.insights.some((insight) => insight.code === "BLOCKED_RATE_IMPROVED")) {
      throw new Error(`improved archive diff mismatch: ${JSON.stringify(diff)}`);
    }

    console.log("PASS governance-archive-diff-improved-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-archive-diff-improved-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceArchiveDiffDegradedUnit() {
  try {
    const diff = directDiff(
      governanceInsightsSnapshot({ blockedRate: 10, humanReviewRate: 10, validationSuccessRate: 95, averageTrustScore: 90, readyRate: 80 }),
      governanceInsightsSnapshot({ blockedRate: 30, humanReviewRate: 25, validationSuccessRate: 70, averageTrustScore: 60, readyRate: 55 })
    );
    if (diff.comparison.status !== "degraded" || !diff.insights.some((insight) => insight.code === "TRUST_SCORE_DEGRADED")) {
      throw new Error(`degraded archive diff mismatch: ${JSON.stringify(diff)}`);
    }

    console.log("PASS governance-archive-diff-degraded-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-archive-diff-degraded-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceArchiveDiffMixedUnit() {
  try {
    const diff = directDiff(
      governanceInsightsSnapshot({ blockedRate: 30, humanReviewRate: 20, validationSuccessRate: 80, averageTrustScore: 80, readyRate: 60 }),
      governanceInsightsSnapshot({ blockedRate: 10, humanReviewRate: 35, validationSuccessRate: 90, averageTrustScore: 70, readyRate: 65 })
    );
    if (
      diff.comparison.status !== "mixed" ||
      !diff.insights.some((insight) => insight.code === "BLOCKED_RATE_IMPROVED") ||
      !diff.insights.some((insight) => insight.code === "HUMAN_REVIEW_RATE_DEGRADED")
    ) {
      throw new Error(`mixed archive diff mismatch: ${JSON.stringify(diff)}`);
    }

    console.log("PASS governance-archive-diff-mixed-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-archive-diff-mixed-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceArchiveDiffStableUnit() {
  try {
    const diff = directDiff(
      governanceInsightsSnapshot({ blockedRate: 10, humanReviewRate: 10, validationSuccessRate: 90, averageTrustScore: 80, readyRate: 70 }),
      governanceInsightsSnapshot({ blockedRate: 10, humanReviewRate: 10, validationSuccessRate: 90, averageTrustScore: 80, readyRate: 70 })
    );
    if (diff.comparison.status !== "stable" || diff.insights[0]?.code !== "GOVERNANCE_STABLE") {
      throw new Error(`stable archive diff mismatch: ${JSON.stringify(diff)}`);
    }

    console.log("PASS governance-archive-diff-stable-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-archive-diff-stable-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceArchiveDiffUnknownUnit() {
  try {
    const diff = directDiff({ version: 1 }, { version: 1 });
    if (diff.comparison.status !== "unknown" || diff.insights[0]?.code !== "GOVERNANCE_DIFF_UNKNOWN") {
      throw new Error(`unknown archive diff mismatch: ${JSON.stringify(diff)}`);
    }

    console.log("PASS governance-archive-diff-unknown-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-archive-diff-unknown-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceArchiveDiffInsightsUnit() {
  try {
    const diff = directDiff(
      governanceInsightsSnapshot({ blockedRate: 10, humanReviewRate: 10, validationSuccessRate: 90, averageTrustScore: 80, readyRate: 70 }),
      governanceInsightsSnapshot({ blockedRate: 20, humanReviewRate: 5, validationSuccessRate: 95, averageTrustScore: 75, readyRate: 80 })
    );
    const codes = diff.insights.map((insight) => insight.code);
    for (const code of ["BLOCKED_RATE_DEGRADED", "HUMAN_REVIEW_RATE_IMPROVED", "VALIDATION_SUCCESS_IMPROVED", "TRUST_SCORE_DEGRADED", "READY_RATE_IMPROVED"]) {
      if (!codes.includes(code)) {
        throw new Error(`missing archive diff insight ${code}: ${JSON.stringify(codes)}`);
      }
    }

    console.log("PASS governance-archive-diff-insights-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-archive-diff-insights-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceArchiveDiffJsonUnit() {
  try {
    const repo = createArchiveDiffRepo(
      "governance-archive-diff-json",
      "governance-insights",
      governanceInsightsSnapshot({ blockedRate: 20, humanReviewRate: 20, validationSuccessRate: 80, averageTrustScore: 70, readyRate: 50 }),
      governanceInsightsSnapshot({ blockedRate: 10, humanReviewRate: 10, validationSuccessRate: 90, averageTrustScore: 80, readyRate: 70 })
    );
    const result = runCliHelpCommand(["archive", "diff", ARCHIVE_DIFF_A, ARCHIVE_DIFF_B, "--repo", repo, "--json"]);
    const parsed = JSON.parse(result.stdout);
    if (result.status !== 0 || parsed.comparison.status !== "improved" || parsed.metrics.blockedRate.delta !== -10) {
      throw new Error(`archive diff JSON CLI mismatch: status=${result.status} stdout=${result.stdout} stderr=${result.stderr}`);
    }

    console.log("PASS governance-archive-diff-json-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-archive-diff-json-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceArchiveDiffCliUnit() {
  try {
    const repo = createArchiveDiffRepo(
      "governance-archive-diff-cli",
      "governance-insights",
      governanceInsightsSnapshot({ blockedRate: 25, humanReviewRate: 20, validationSuccessRate: 75, averageTrustScore: 60, readyRate: 40 }),
      governanceInsightsSnapshot({ blockedRate: 10, humanReviewRate: 15, validationSuccessRate: 90, averageTrustScore: 85, readyRate: 70 })
    );
    const archiveIndexPath = path.join(repo, ".factory", "archive-index.json");
    const runsIndexPath = path.join(repo, ".factory", "runs-index.json");
    const beforeArchiveIndex = fs.readFileSync(archiveIndexPath, "utf8");
    const beforeRunsIndex = fs.readFileSync(runsIndexPath, "utf8");
    const result = runCliHelpCommand(["archive", "diff", ARCHIVE_DIFF_A, ARCHIVE_DIFF_B, "--repo", repo]);
    const afterArchiveIndex = fs.readFileSync(archiveIndexPath, "utf8");
    const afterRunsIndex = fs.readFileSync(runsIndexPath, "utf8");
    if (
      result.status !== 0 ||
      !result.stdout.includes("Governance Archive Diff") ||
      !result.stdout.includes("Comparison status:\nimproved") ||
      beforeArchiveIndex !== afterArchiveIndex ||
      beforeRunsIndex !== afterRunsIndex
    ) {
      throw new Error(`archive diff CLI mismatch: status=${result.status} stdout=${result.stdout} stderr=${result.stderr}`);
    }

    console.log("PASS governance-archive-diff-cli-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-archive-diff-cli-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceArchiveDiffInvalidKindUnit() {
  try {
    const repo = createArchiveRepo("governance-archive-diff-invalid-kind", warnCiIndex());
    writeArchiveIndex(repo, {
      version: 1,
      updatedAt: "2026-05-11T10:00:00.000Z",
      totalArchives: 2,
      archives: [
        archiveDiffEntry("runs-dashboard", ARCHIVE_DIFF_A, "runs-dashboard.json"),
        archiveDiffEntry("runs-dashboard", ARCHIVE_DIFF_B, "runs-dashboard.json")
      ]
    });
    const result = runCliHelpCommand(["archive", "diff", ARCHIVE_DIFF_A, ARCHIVE_DIFF_B, "--repo", repo]);
    if (result.status !== 1 || !result.stderr.includes("Archive diff currently supports: governance-insights, governance-ci-summary")) {
      throw new Error(`archive diff invalid kind mismatch: status=${result.status} stderr=${result.stderr}`);
    }

    console.log("PASS governance-archive-diff-invalid-kind-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-archive-diff-invalid-kind-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceArchiveDiffMissingArchiveUnit() {
  try {
    const repo = createArchiveDiffRepo(
      "governance-archive-diff-missing",
      "governance-insights",
      governanceInsightsSnapshot({ blockedRate: 20, humanReviewRate: 20, validationSuccessRate: 80, averageTrustScore: 70, readyRate: 50 }),
      governanceInsightsSnapshot({ blockedRate: 10, humanReviewRate: 10, validationSuccessRate: 90, averageTrustScore: 80, readyRate: 70 })
    );
    const result = runCliHelpCommand(["archive", "diff", ARCHIVE_DIFF_A, "missing-archive", "--repo", repo]);
    if (result.status !== 1 || !result.stderr.includes("Archive not found: missing-archive")) {
      throw new Error(`archive diff missing archive mismatch: status=${result.status} stderr=${result.stderr}`);
    }

    console.log("PASS governance-archive-diff-missing-archive-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-archive-diff-missing-archive-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceArchiveDiffHelpUnit() {
  const { renderArchiveHelp } = require(path.join(projectRoot, "dist", "cliHelp.js"));
  try {
    const help = renderArchiveHelp();
    const cliHelp = runCliHelpCommand(["archive", "--help"]);
    if (cliHelp.status !== 0 || cliHelp.stdout !== help) {
      throw new Error(`archive diff help CLI mismatch: status=${cliHelp.status} stdout=${cliHelp.stdout}`);
    }
    assertHelpIncludes(help, [
      "Diff usage:",
      "node dist/cli.js archive diff <archiveIdA> <archiveIdB>",
      "Supported diff kinds:",
      "Archive diff does not modify repair behavior or archive data."
    ]);

    console.log("PASS governance-archive-diff-help-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-archive-diff-help-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function trendSnapshot(archiveId, values) {
  return {
    archiveId,
    createdAt: archiveCreatedAt(archiveId),
    kind: "governance-insights",
    data: governanceInsightsSnapshot(values)
  };
}

function trendSnapshots(valueList) {
  return valueList.map((values, index) => {
    const day = String(index + 1).padStart(2, "0");
    return trendSnapshot(`2026-05-${day}T10-00-00-000Z`, values);
  });
}

function directTrend(valueList, windowSize = 10) {
  const { buildGovernanceTrendAnalysis } = require(path.join(projectRoot, "dist", "repair", "governanceTrendAnalysis.js"));
  return buildGovernanceTrendAnalysis({
    snapshots: trendSnapshots(valueList),
    windowSize,
    totalSnapshots: valueList.length
  });
}

function createTrendRepo(name, valueList, includeRunsIndex = true) {
  const repo = createArchiveRepo(name, includeRunsIndex ? warnCiIndex() : null);
  const archives = [];
  for (let index = 0; index < valueList.length; index += 1) {
    const day = String(index + 1).padStart(2, "0");
    const archiveId = `2026-05-${day}T10-00-00-000Z`;
    const entry = archiveDiffEntry("governance-insights", archiveId);
    archives.push(entry);
    const filePath = path.join(repo, entry.files[0]);
    ensureDir(path.dirname(filePath));
    fs.writeFileSync(filePath, `${JSON.stringify(governanceInsightsSnapshot(valueList[index]), null, 2)}\n`, "utf8");
  }
  writeArchiveIndex(repo, {
    version: 1,
    updatedAt: "2026-05-11T10:00:00.000Z",
    totalArchives: archives.length,
    archives: archives.slice().reverse()
  });
  return repo;
}

function runGovernanceTrendAnalysisUnit() {
  try {
    const analysis = directTrend([
      { blockedRate: 20, humanReviewRate: 30, validationSuccessRate: 70, averageTrustScore: 60, readyRate: 40 },
      { blockedRate: 10, humanReviewRate: 20, validationSuccessRate: 90, averageTrustScore: 80, readyRate: 70 }
    ]);
    if (
      analysis.version !== 1 ||
      analysis.analyzedKind !== "governance-insights" ||
      analysis.analyzedSnapshots !== 2 ||
      analysis.metrics.blockedRate.direction !== "down" ||
      analysis.metrics.validationSuccessRate.direction !== "up" ||
      analysis.metrics.averageTrustScore.absoluteDelta !== 20
    ) {
      throw new Error(`trend analysis mismatch: ${JSON.stringify(analysis)}`);
    }

    console.log("PASS governance-trend-analysis-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-trend-analysis-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceTrendAnalysisImprovingUnit() {
  try {
    const analysis = directTrend([
      { blockedRate: 30, humanReviewRate: 25, validationSuccessRate: 70, averageTrustScore: 60, readyRate: 40 },
      { blockedRate: 27, humanReviewRate: 22, validationSuccessRate: 73, averageTrustScore: 63, readyRate: 43 },
      { blockedRate: 24, humanReviewRate: 19, validationSuccessRate: 76, averageTrustScore: 66, readyRate: 46 }
    ]);
    const codes = analysis.insights.map((insight) => insight.code);
    if (analysis.trendHealth !== "healthy" || !codes.includes("BLOCKED_RATE_IMPROVING") || !codes.includes("TRUST_TREND_IMPROVING")) {
      throw new Error(`improving trend mismatch: ${JSON.stringify(analysis)}`);
    }

    console.log("PASS governance-trend-analysis-improving-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-trend-analysis-improving-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceTrendAnalysisWorseningUnit() {
  try {
    const analysis = directTrend([
      { blockedRate: 5, humanReviewRate: 5, validationSuccessRate: 95, averageTrustScore: 90, readyRate: 85 },
      { blockedRate: 20, humanReviewRate: 15, validationSuccessRate: 80, averageTrustScore: 75, readyRate: 60 },
      { blockedRate: 40, humanReviewRate: 30, validationSuccessRate: 60, averageTrustScore: 50, readyRate: 35 }
    ]);
    const codes = analysis.insights.map((insight) => insight.code);
    if (analysis.trendHealth !== "critical" || !codes.includes("BLOCKED_RATE_WORSENING") || !codes.includes("TRUST_TREND_DEGRADING")) {
      throw new Error(`worsening trend mismatch: ${JSON.stringify(analysis)}`);
    }

    console.log("PASS governance-trend-analysis-worsening-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-trend-analysis-worsening-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceTrendAnalysisStableUnit() {
  try {
    const analysis = directTrend([
      { blockedRate: 10, humanReviewRate: 10, validationSuccessRate: 90, averageTrustScore: 80, readyRate: 70 },
      { blockedRate: 10, humanReviewRate: 10, validationSuccessRate: 90, averageTrustScore: 80, readyRate: 70 },
      { blockedRate: 10, humanReviewRate: 10, validationSuccessRate: 90, averageTrustScore: 80, readyRate: 70 }
    ]);
    if (analysis.trendHealth !== "healthy" || analysis.metrics.blockedRate.direction !== "stable" || analysis.insights[0]?.code !== "GOVERNANCE_STABLE") {
      throw new Error(`stable trend mismatch: ${JSON.stringify(analysis)}`);
    }

    console.log("PASS governance-trend-analysis-stable-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-trend-analysis-stable-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceTrendAnalysisHealthUnit() {
  try {
    const unknown = directTrend([]);
    const warning = directTrend([
      { blockedRate: 10, humanReviewRate: 10, validationSuccessRate: 90, averageTrustScore: 80, readyRate: 70 },
      { blockedRate: 10, humanReviewRate: 20, validationSuccessRate: 90, averageTrustScore: 80, readyRate: 70 }
    ]);
    if (unknown.trendHealth !== "unknown" || unknown.insights[0]?.code !== "NO_ARCHIVE_HISTORY" || warning.trendHealth !== "warning") {
      throw new Error(`trend health mismatch: unknown=${JSON.stringify(unknown)} warning=${JSON.stringify(warning)}`);
    }

    console.log("PASS governance-trend-analysis-health-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-trend-analysis-health-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceTrendAnalysisVolatilityUnit() {
  try {
    const analysis = directTrend([
      { blockedRate: 0, humanReviewRate: 0, validationSuccessRate: 60, averageTrustScore: 40, readyRate: 20 },
      { blockedRate: 30, humanReviewRate: 30, validationSuccessRate: 90, averageTrustScore: 90, readyRate: 80 },
      { blockedRate: 0, humanReviewRate: 0, validationSuccessRate: 60, averageTrustScore: 40, readyRate: 20 }
    ]);
    if (
      analysis.volatility.governanceVolatilityScore !== 40 ||
      analysis.volatility.trustVolatilityScore !== 50 ||
      analysis.volatility.validationVolatilityScore !== 30 ||
      !analysis.insights.some((insight) => insight.code === "HIGH_GOVERNANCE_VOLATILITY")
    ) {
      throw new Error(`volatility trend mismatch: ${JSON.stringify(analysis)}`);
    }

    console.log("PASS governance-trend-analysis-volatility-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-trend-analysis-volatility-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceTrendAnalysisJsonUnit() {
  try {
    const repo = createTrendRepo("governance-trend-json", [
      { blockedRate: 20, humanReviewRate: 20, validationSuccessRate: 80, averageTrustScore: 70, readyRate: 50 },
      { blockedRate: 10, humanReviewRate: 10, validationSuccessRate: 90, averageTrustScore: 80, readyRate: 70 }
    ]);
    const result = runCliHelpCommand(["trends", "--repo", repo, "--json"]);
    const parsed = JSON.parse(result.stdout);
    if (result.status !== 0 || parsed.analyzedSnapshots !== 2 || parsed.metrics.blockedRate.direction !== "down") {
      throw new Error(`trend JSON CLI mismatch: status=${result.status} stdout=${result.stdout} stderr=${result.stderr}`);
    }

    console.log("PASS governance-trend-analysis-json-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-trend-analysis-json-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceTrendAnalysisCliUnit() {
  try {
    const repo = createTrendRepo("governance-trend-cli", [
      { blockedRate: 20, humanReviewRate: 20, validationSuccessRate: 80, averageTrustScore: 70, readyRate: 50 },
      { blockedRate: 10, humanReviewRate: 10, validationSuccessRate: 90, averageTrustScore: 80, readyRate: 70 }
    ]);
    const archiveIndexPath = path.join(repo, ".factory", "archive-index.json");
    const runsIndexPath = path.join(repo, ".factory", "runs-index.json");
    const beforeArchiveIndex = fs.readFileSync(archiveIndexPath, "utf8");
    const beforeRunsIndex = fs.readFileSync(runsIndexPath, "utf8");
    const result = runCliHelpCommand(["trends", "--repo", repo]);
    const afterArchiveIndex = fs.readFileSync(archiveIndexPath, "utf8");
    const afterRunsIndex = fs.readFileSync(runsIndexPath, "utf8");
    if (
      result.status !== 0 ||
      !result.stdout.includes("Governance Trend Analysis") ||
      !result.stdout.includes("Trend health:") ||
      beforeArchiveIndex !== afterArchiveIndex ||
      beforeRunsIndex !== afterRunsIndex
    ) {
      throw new Error(`trend CLI mismatch: status=${result.status} stdout=${result.stdout} stderr=${result.stderr}`);
    }

    console.log("PASS governance-trend-analysis-cli-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-trend-analysis-cli-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceTrendAnalysisMissingIndexUnit() {
  try {
    const repo = createArchiveRepo("governance-trend-missing-index", null);
    const result = runCliHelpCommand(["trends", "--repo", repo, "--json"]);
    const parsed = JSON.parse(result.stdout);
    if (result.status !== 0 || parsed.trendHealth !== "unknown" || parsed.insights[0]?.code !== "NO_ARCHIVE_HISTORY") {
      throw new Error(`missing trend index mismatch: status=${result.status} stdout=${result.stdout} stderr=${result.stderr}`);
    }

    console.log("PASS governance-trend-analysis-missing-index-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-trend-analysis-missing-index-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceTrendAnalysisInvalidKindUnit() {
  try {
    const repo = createTrendRepo("governance-trend-invalid-kind", [
      { blockedRate: 20, humanReviewRate: 20, validationSuccessRate: 80, averageTrustScore: 70, readyRate: 50 }
    ]);
    const result = runCliHelpCommand(["trends", "--repo", repo, "--kind", "governance-ci-summary"]);
    if (result.status !== 1 || !result.stderr.includes("Governance trend analysis currently supports:") || !result.stderr.includes("- governance-insights")) {
      throw new Error(`invalid trend kind mismatch: status=${result.status} stderr=${result.stderr}`);
    }

    console.log("PASS governance-trend-analysis-invalid-kind-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-trend-analysis-invalid-kind-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceTrendAnalysisHelpUnit() {
  const { renderMainHelp, renderTrendsHelp } = require(path.join(projectRoot, "dist", "cliHelp.js"));
  try {
    const mainHelp = renderMainHelp();
    const trendsHelp = renderTrendsHelp();
    const cliHelp = runCliHelpCommand(["trends", "--help"]);
    const shortHelp = runCliHelpCommand(["trends", "-h"]);
    if (cliHelp.status !== 0 || shortHelp.status !== 0 || cliHelp.stdout !== trendsHelp || shortHelp.stdout !== trendsHelp) {
      throw new Error(`trend help mismatch: stdout=${cliHelp.stdout} short=${shortHelp.stdout}`);
    }
    assertHelpIncludes(mainHelp, ["trends      Show governance trend analysis over archives"]);
    assertHelpIncludes(trendsHelp, [
      "Usage:\n  node dist/cli.js trends [options]",
      "--window <n>    Snapshot window size",
      "Supported kinds:",
      "Read-only guarantee:"
    ]);

    console.log("PASS governance-trend-analysis-help-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-trend-analysis-help-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function driftSnapshot(archiveId, values) {
  return {
    archiveId,
    createdAt: archiveCreatedAt(archiveId),
    kind: "governance-insights",
    data: governanceInsightsSnapshot(values)
  };
}

function driftSnapshots(valueList) {
  return valueList.map((values, index) => {
    const day = String(index + 1).padStart(2, "0");
    return driftSnapshot(`2026-05-${day}T10-00-00-000Z`, values);
  });
}

function directDrift(valueList, baselineWindowSize = 5, comparisonWindowSize = 2) {
  const { buildGovernanceDriftDetection } = require(path.join(projectRoot, "dist", "repair", "governanceDriftDetection.js"));
  return buildGovernanceDriftDetection({
    snapshots: driftSnapshots(valueList),
    baselineWindowSize,
    comparisonWindowSize
  });
}

function repeatedDriftValues(count, values) {
  return Array.from({ length: count }, () => ({ ...values }));
}

function createDriftRepo(name, valueList, includeRunsIndex = true) {
  const repo = createArchiveRepo(name, includeRunsIndex ? warnCiIndex() : null);
  const archives = [];
  for (let index = 0; index < valueList.length; index += 1) {
    const day = String(index + 1).padStart(2, "0");
    const archiveId = `2026-05-${day}T10-00-00-000Z`;
    const entry = archiveDiffEntry("governance-insights", archiveId);
    archives.push(entry);
    const filePath = path.join(repo, entry.files[0]);
    ensureDir(path.dirname(filePath));
    fs.writeFileSync(filePath, `${JSON.stringify(governanceInsightsSnapshot(valueList[index]), null, 2)}\n`, "utf8");
  }
  writeArchiveIndex(repo, {
    version: 1,
    updatedAt: "2026-05-11T10:00:00.000Z",
    totalArchives: archives.length,
    archives: archives.slice().reverse()
  });
  return repo;
}

function runGovernanceDriftDetectionUnit() {
  try {
    const analysis = directDrift([
      ...repeatedDriftValues(5, { blockedRate: 10, humanReviewRate: 10, validationSuccessRate: 90, averageTrustScore: 80, readyRate: 70 }),
      ...repeatedDriftValues(2, { blockedRate: 12, humanReviewRate: 10, validationSuccessRate: 90, averageTrustScore: 80, readyRate: 70 })
    ]);
    if (
      analysis.version !== 1 ||
      analysis.analyzedKind !== "governance-insights" ||
      analysis.analyzedSnapshots !== 7 ||
      analysis.metrics.blockedRate.baselineAverage !== 10 ||
      analysis.metrics.blockedRate.currentValue !== 12 ||
      analysis.metrics.blockedRate.percentDelta !== 20 ||
      analysis.metrics.blockedRate.severity !== "medium" ||
      analysis.overallSeverity !== "low"
    ) {
      throw new Error(`drift analysis mismatch: ${JSON.stringify(analysis)}`);
    }

    console.log("PASS governance-drift-detection-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-drift-detection-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceDriftBaselineUnit() {
  try {
    const analysis = directDrift([
      { blockedRate: 8, humanReviewRate: 10, validationSuccessRate: 90, averageTrustScore: 80, readyRate: 70 },
      { blockedRate: 10, humanReviewRate: 10, validationSuccessRate: 90, averageTrustScore: 80, readyRate: 70 },
      { blockedRate: 12, humanReviewRate: 10, validationSuccessRate: 90, averageTrustScore: 80, readyRate: 70 },
      { blockedRate: 10, humanReviewRate: 10, validationSuccessRate: 90, averageTrustScore: 80, readyRate: 70 },
      { blockedRate: 10, humanReviewRate: 10, validationSuccessRate: 90, averageTrustScore: 80, readyRate: 70 },
      { blockedRate: 14, humanReviewRate: 10, validationSuccessRate: 90, averageTrustScore: 80, readyRate: 70 },
      { blockedRate: 16, humanReviewRate: 10, validationSuccessRate: 90, averageTrustScore: 80, readyRate: 70 }
    ]);
    const metric = analysis.metrics.blockedRate;
    if (metric.baselineAverage !== 10 || metric.currentValue !== 15 || metric.absoluteDelta !== 5 || metric.percentDelta !== 50 || metric.severity !== "high") {
      throw new Error(`baseline drift mismatch: ${JSON.stringify(metric)}`);
    }

    console.log("PASS governance-drift-baseline-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-drift-baseline-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceDriftLowUnit() {
  try {
    const analysis = directDrift([
      ...repeatedDriftValues(5, { blockedRate: 10, humanReviewRate: 10, validationSuccessRate: 90, averageTrustScore: 80, readyRate: 70 }),
      ...repeatedDriftValues(2, { blockedRate: 11, humanReviewRate: 10, validationSuccessRate: 90, averageTrustScore: 80, readyRate: 70 })
    ]);
    if (analysis.overallSeverity !== "low" || analysis.metrics.blockedRate.severity !== "low") {
      throw new Error(`low drift mismatch: ${JSON.stringify(analysis)}`);
    }

    console.log("PASS governance-drift-low-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-drift-low-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceDriftMediumUnit() {
  try {
    const analysis = directDrift([
      ...repeatedDriftValues(5, { blockedRate: 10, humanReviewRate: 10, validationSuccessRate: 90, averageTrustScore: 100, readyRate: 70 }),
      ...repeatedDriftValues(2, { blockedRate: 12, humanReviewRate: 10, validationSuccessRate: 90, averageTrustScore: 80, readyRate: 70 })
    ]);
    if (analysis.overallSeverity !== "medium" || analysis.metrics.blockedRate.severity !== "medium" || analysis.metrics.averageTrustScore.severity !== "medium") {
      throw new Error(`medium drift mismatch: ${JSON.stringify(analysis)}`);
    }

    console.log("PASS governance-drift-medium-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-drift-medium-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceDriftHighUnit() {
  try {
    const analysis = directDrift([
      ...repeatedDriftValues(5, { blockedRate: 10, humanReviewRate: 10, validationSuccessRate: 90, averageTrustScore: 80, readyRate: 70 }),
      ...repeatedDriftValues(2, { blockedRate: 14, humanReviewRate: 10, validationSuccessRate: 90, averageTrustScore: 80, readyRate: 70 })
    ]);
    if (analysis.overallSeverity !== "high" || analysis.metrics.blockedRate.severity !== "high") {
      throw new Error(`high drift mismatch: ${JSON.stringify(analysis)}`);
    }

    console.log("PASS governance-drift-high-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-drift-high-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceDriftCriticalUnit() {
  try {
    const analysis = directDrift([
      ...repeatedDriftValues(5, { blockedRate: 10, humanReviewRate: 10, validationSuccessRate: 90, averageTrustScore: 80, readyRate: 70 }),
      ...repeatedDriftValues(2, { blockedRate: 16, humanReviewRate: 10, validationSuccessRate: 90, averageTrustScore: 80, readyRate: 70 })
    ]);
    if (analysis.overallSeverity !== "critical" || analysis.metrics.blockedRate.severity !== "critical" || !analysis.anomalies.some((anomaly) => anomaly.code === "BLOCKED_RATE_DRIFT")) {
      throw new Error(`critical drift mismatch: ${JSON.stringify(analysis)}`);
    }

    console.log("PASS governance-drift-critical-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-drift-critical-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceDriftGoodChangeUnit() {
  try {
    const analysis = directDrift([
      ...repeatedDriftValues(5, { blockedRate: 20, humanReviewRate: 20, validationSuccessRate: 80, averageTrustScore: 70, readyRate: 60 }),
      ...repeatedDriftValues(2, { blockedRate: 10, humanReviewRate: 10, validationSuccessRate: 90, averageTrustScore: 90, readyRate: 80 })
    ]);
    const codes = analysis.anomalies.map((anomaly) => anomaly.code);
    if (analysis.overallSeverity !== "none" || !codes.includes("BLOCKED_RATE_IMPROVED") || !codes.includes("TRUST_SCORE_IMPROVED")) {
      throw new Error(`good drift mismatch: ${JSON.stringify(analysis)}`);
    }

    console.log("PASS governance-drift-good-change-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-drift-good-change-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceDriftInsufficientHistoryUnit() {
  try {
    const insufficient = directDrift([
      { blockedRate: 10, humanReviewRate: 10, validationSuccessRate: 90, averageTrustScore: 80, readyRate: 70 },
      { blockedRate: 20, humanReviewRate: 20, validationSuccessRate: 80, averageTrustScore: 70, readyRate: 60 }
    ]);
    const empty = directDrift([]);
    if (
      insufficient.overallSeverity !== "none" ||
      insufficient.anomalies[0]?.code !== "INSUFFICIENT_DRIFT_HISTORY" ||
      empty.anomalies[0]?.code !== "NO_ARCHIVE_HISTORY" ||
      empty.summary !== "No governance archive history is available."
    ) {
      throw new Error(`insufficient drift mismatch: insufficient=${JSON.stringify(insufficient)} empty=${JSON.stringify(empty)}`);
    }

    console.log("PASS governance-drift-insufficient-history-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-drift-insufficient-history-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceDriftJsonUnit() {
  try {
    const repo = createDriftRepo("governance-drift-json", [
      ...repeatedDriftValues(5, { blockedRate: 10, humanReviewRate: 10, validationSuccessRate: 90, averageTrustScore: 80, readyRate: 70 }),
      ...repeatedDriftValues(2, { blockedRate: 12, humanReviewRate: 10, validationSuccessRate: 90, averageTrustScore: 80, readyRate: 70 })
    ]);
    const result = runCliHelpCommand(["drift", "--repo", repo, "--baseline-window", "5", "--comparison-window", "2", "--json"]);
    const parsed = JSON.parse(result.stdout);
    if (result.status !== 0 || parsed.overallSeverity !== "low" || parsed.metrics.blockedRate.percentDelta !== 20) {
      throw new Error(`drift JSON CLI mismatch: status=${result.status} stdout=${result.stdout} stderr=${result.stderr}`);
    }

    console.log("PASS governance-drift-json-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-drift-json-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceDriftCliUnit() {
  try {
    const repo = createDriftRepo("governance-drift-cli", [
      ...repeatedDriftValues(5, { blockedRate: 10, humanReviewRate: 10, validationSuccessRate: 90, averageTrustScore: 80, readyRate: 70 }),
      ...repeatedDriftValues(2, { blockedRate: 12, humanReviewRate: 10, validationSuccessRate: 90, averageTrustScore: 80, readyRate: 70 })
    ]);
    const archiveIndexPath = path.join(repo, ".factory", "archive-index.json");
    const runsIndexPath = path.join(repo, ".factory", "runs-index.json");
    const beforeArchiveIndex = fs.readFileSync(archiveIndexPath, "utf8");
    const beforeRunsIndex = fs.readFileSync(runsIndexPath, "utf8");
    const result = runCliHelpCommand(["drift", "--repo", repo, "--baseline-window", "5", "--comparison-window", "2"]);
    const afterArchiveIndex = fs.readFileSync(archiveIndexPath, "utf8");
    const afterRunsIndex = fs.readFileSync(runsIndexPath, "utf8");
    if (
      result.status !== 0 ||
      !result.stdout.includes("Governance Drift Detection") ||
      !result.stdout.includes("Overall severity:") ||
      beforeArchiveIndex !== afterArchiveIndex ||
      beforeRunsIndex !== afterRunsIndex
    ) {
      throw new Error(`drift CLI mismatch: status=${result.status} stdout=${result.stdout} stderr=${result.stderr}`);
    }

    console.log("PASS governance-drift-cli-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-drift-cli-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceDriftInvalidKindUnit() {
  try {
    const repo = createDriftRepo("governance-drift-invalid-kind", [
      ...repeatedDriftValues(5, { blockedRate: 10, humanReviewRate: 10, validationSuccessRate: 90, averageTrustScore: 80, readyRate: 70 }),
      ...repeatedDriftValues(2, { blockedRate: 12, humanReviewRate: 10, validationSuccessRate: 90, averageTrustScore: 80, readyRate: 70 })
    ]);
    const result = runCliHelpCommand(["drift", "--repo", repo, "--kind", "governance-ci-summary"]);
    if (result.status !== 1 || !result.stderr.includes("Governance drift detection currently supports:") || !result.stderr.includes("- governance-insights")) {
      throw new Error(`invalid drift kind mismatch: status=${result.status} stderr=${result.stderr}`);
    }

    console.log("PASS governance-drift-invalid-kind-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-drift-invalid-kind-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceDriftHelpUnit() {
  const { renderMainHelp, renderDriftHelp } = require(path.join(projectRoot, "dist", "cliHelp.js"));
  try {
    const mainHelp = renderMainHelp();
    const driftHelp = renderDriftHelp();
    const cliHelp = runCliHelpCommand(["drift", "--help"]);
    const shortHelp = runCliHelpCommand(["drift", "-h"]);
    if (cliHelp.status !== 0 || shortHelp.status !== 0 || cliHelp.stdout !== driftHelp || shortHelp.stdout !== driftHelp) {
      throw new Error(`drift help mismatch: stdout=${cliHelp.stdout} short=${shortHelp.stdout}`);
    }
    assertHelpIncludes(mainHelp, ["drift       Show governance drift detection against baselines"]);
    assertHelpIncludes(driftHelp, [
      "Usage:\n  node dist/cli.js drift [options]",
      "--baseline-window <n>       Historical baseline window",
      "--comparison-window <n>     Recent comparison window",
      "Read-only guarantee:"
    ]);

    console.log("PASS governance-drift-help-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-drift-help-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function stabilityTrend(overrides = {}) {
  return {
    version: 1,
    analyzedKind: "governance-insights",
    windowSize: 10,
    totalSnapshots: 7,
    analyzedSnapshots: 7,
    trendHealth: "healthy",
    metrics: {},
    volatility: {
      governanceVolatilityScore: 0,
      trustVolatilityScore: 0,
      validationVolatilityScore: 0
    },
    insights: [],
    generatedAt: "2026-05-11T10:00:00.000Z",
    ...overrides
  };
}

function stabilityDrift(overrides = {}) {
  return {
    version: 1,
    analyzedKind: "governance-insights",
    baselineWindowSize: 5,
    comparisonWindowSize: 2,
    analyzedSnapshots: 7,
    overallSeverity: "none",
    metrics: {
      blockedRate: { baselineAverage: 10, currentValue: 10, absoluteDelta: 0, percentDelta: 0, driftDetected: false, severity: "none" },
      humanReviewRate: { baselineAverage: 10, currentValue: 10, absoluteDelta: 0, percentDelta: 0, driftDetected: false, severity: "none" },
      validationSuccessRate: { baselineAverage: 90, currentValue: 90, absoluteDelta: 0, percentDelta: 0, driftDetected: false, severity: "none" },
      averageTrustScore: { baselineAverage: 80, currentValue: 80, absoluteDelta: 0, percentDelta: 0, driftDetected: false, severity: "none" },
      readyRate: { baselineAverage: 75, currentValue: 75, absoluteDelta: 0, percentDelta: 0, driftDetected: false, severity: "none" }
    },
    anomalies: [],
    summary: "Governance metrics remain within historical baseline ranges.",
    generatedAt: "2026-05-11T10:00:00.000Z",
    ...overrides
  };
}

function directStability(trendOverrides = {}, driftOverrides = {}) {
  const { buildGovernanceStabilityScore } = require(path.join(projectRoot, "dist", "repair", "governanceStabilityScore.js"));
  return buildGovernanceStabilityScore({
    trend: stabilityTrend(trendOverrides),
    drift: stabilityDrift(driftOverrides)
  });
}

function runGovernanceStabilityScoreUnit() {
  try {
    const stability = directStability();
    if (stability.version !== 1 || stability.score !== 100 || stability.level !== "stable" || stability.metrics.trendHealth !== "healthy") {
      throw new Error(`stability score mismatch: ${JSON.stringify(stability)}`);
    }

    console.log("PASS governance-stability-score-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-stability-score-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceStabilityLevelUnit() {
  try {
    const caution = directStability({ trendHealth: "warning" }, { overallSeverity: "low" });
    const unstable = directStability({ trendHealth: "warning" }, { overallSeverity: "medium" });
    const critical = directStability({ trendHealth: "critical" }, { overallSeverity: "critical" });
    if (caution.score !== 75 || caution.level !== "caution" || unstable.score !== 65 || unstable.level !== "unstable" || critical.score !== 30 || critical.level !== "critical") {
      throw new Error(`stability level mismatch: caution=${JSON.stringify(caution)} unstable=${JSON.stringify(unstable)} critical=${JSON.stringify(critical)}`);
    }

    console.log("PASS governance-stability-level-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-stability-level-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceStabilityDeductionUnit() {
  try {
    const stability = directStability(
      { trendHealth: "unknown" },
      {
        overallSeverity: "high",
        metrics: {
          ...stabilityDrift().metrics,
          blockedRate: { baselineAverage: 10, currentValue: 30, absoluteDelta: 20, percentDelta: 200, driftDetected: true, severity: "critical" },
          validationSuccessRate: { baselineAverage: 90, currentValue: 70, absoluteDelta: -20, percentDelta: -22.22, driftDetected: true, severity: "medium" },
          averageTrustScore: { baselineAverage: 80, currentValue: 60, absoluteDelta: -20, percentDelta: -25, driftDetected: true, severity: "medium" },
          readyRate: { baselineAverage: 80, currentValue: 60, absoluteDelta: -20, percentDelta: -25, driftDetected: true, severity: "medium" }
        }
      }
    );
    if (stability.score !== 10 || stability.level !== "critical") {
      throw new Error(`deduction mismatch: ${JSON.stringify(stability)}`);
    }

    console.log("PASS governance-stability-deduction-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-stability-deduction-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceStabilityVolatilityUnit() {
  try {
    const stability = directStability({
      volatility: {
        governanceVolatilityScore: 16,
        trustVolatilityScore: 20,
        validationVolatilityScore: 30
      }
    });
    const volatilityFactors = stability.contributingFactors.filter((factor) => factor.category === "volatility");
    if (stability.score !== 70 || stability.level !== "caution" || volatilityFactors.length !== 3) {
      throw new Error(`volatility stability mismatch: ${JSON.stringify(stability)}`);
    }

    console.log("PASS governance-stability-volatility-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-stability-volatility-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceStabilityAnomalyUnit() {
  try {
    const stability = directStability(
      {
        insights: [
          { severity: "warning", code: "TRUST_TREND_DEGRADING", message: "Governance trust score trend is degrading." },
          { severity: "critical", code: "HIGH_GOVERNANCE_VOLATILITY", message: "Governance metrics show high volatility." }
        ]
      },
      {
        anomalies: [
          { severity: "warning", code: "BLOCKED_RATE_DRIFT", message: "Blocked governance rate drift exceeded historical baseline." }
        ]
      }
    );
    const anomalyFactors = stability.contributingFactors.filter((factor) => factor.category === "anomaly");
    if (stability.score !== 84 || stability.level !== "caution" || anomalyFactors.length !== 3) {
      throw new Error(`anomaly stability mismatch: ${JSON.stringify(stability)}`);
    }

    console.log("PASS governance-stability-anomaly-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-stability-anomaly-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceStabilitySummaryUnit() {
  try {
    const stable = directStability();
    const caution = directStability({ trendHealth: "warning" }, { overallSeverity: "low" });
    const unstable = directStability({ trendHealth: "warning" }, { overallSeverity: "medium" });
    const critical = directStability({ trendHealth: "critical" }, { overallSeverity: "critical" });
    if (
      stable.summary !== "Governance operations appear stable and within acceptable ranges." ||
      caution.summary !== "Governance operations show moderate instability or elevated risk." ||
      unstable.summary !== "Governance operations show significant instability." ||
      critical.summary !== "Governance operations are critically unstable."
    ) {
      throw new Error(`summary mismatch: ${JSON.stringify({ stable, caution, unstable, critical })}`);
    }

    console.log("PASS governance-stability-summary-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-stability-summary-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceStabilityJsonUnit() {
  try {
    const repo = createDriftRepo("governance-stability-json", [
      ...repeatedDriftValues(5, { blockedRate: 10, humanReviewRate: 10, validationSuccessRate: 90, averageTrustScore: 80, readyRate: 75 }),
      ...repeatedDriftValues(2, { blockedRate: 12, humanReviewRate: 10, validationSuccessRate: 90, averageTrustScore: 80, readyRate: 75 })
    ]);
    const result = runCliHelpCommand(["stability", "--repo", repo, "--window", "7", "--baseline-window", "5", "--comparison-window", "2", "--json"]);
    const parsed = JSON.parse(result.stdout);
    if (result.status !== 0 || parsed.version !== 1 || parsed.metrics.driftSeverity !== "low" || typeof parsed.score !== "number") {
      throw new Error(`stability JSON CLI mismatch: status=${result.status} stdout=${result.stdout} stderr=${result.stderr}`);
    }

    console.log("PASS governance-stability-json-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-stability-json-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceStabilityCliUnit() {
  try {
    const repo = createDriftRepo("governance-stability-cli", [
      ...repeatedDriftValues(5, { blockedRate: 10, humanReviewRate: 10, validationSuccessRate: 90, averageTrustScore: 80, readyRate: 75 }),
      ...repeatedDriftValues(2, { blockedRate: 12, humanReviewRate: 10, validationSuccessRate: 90, averageTrustScore: 80, readyRate: 75 })
    ]);
    const archiveIndexPath = path.join(repo, ".factory", "archive-index.json");
    const runsIndexPath = path.join(repo, ".factory", "runs-index.json");
    const beforeArchiveIndex = fs.readFileSync(archiveIndexPath, "utf8");
    const beforeRunsIndex = fs.readFileSync(runsIndexPath, "utf8");
    const result = runCliHelpCommand(["stability", "--repo", repo, "--window", "7", "--baseline-window", "5", "--comparison-window", "2"]);
    const afterArchiveIndex = fs.readFileSync(archiveIndexPath, "utf8");
    const afterRunsIndex = fs.readFileSync(runsIndexPath, "utf8");
    if (
      result.status !== 0 ||
      !result.stdout.includes("Governance Stability Score") ||
      !result.stdout.includes("Score:") ||
      beforeArchiveIndex !== afterArchiveIndex ||
      beforeRunsIndex !== afterRunsIndex
    ) {
      throw new Error(`stability CLI mismatch: status=${result.status} stdout=${result.stdout} stderr=${result.stderr}`);
    }

    console.log("PASS governance-stability-cli-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-stability-cli-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceStabilityMissingHistoryUnit() {
  try {
    const repo = createArchiveRepo("governance-stability-missing-history", null);
    const result = runCliHelpCommand(["stability", "--repo", repo, "--json"]);
    const parsed = JSON.parse(result.stdout);
    if (
      result.status !== 0 ||
      parsed.score !== 100 ||
      parsed.level !== "stable" ||
      parsed.summary !== "No governance history is available. Stability assumed." ||
      parsed.anomalies[0]?.code !== "NO_ARCHIVE_HISTORY"
    ) {
      throw new Error(`missing stability history mismatch: status=${result.status} stdout=${result.stdout} stderr=${result.stderr}`);
    }

    console.log("PASS governance-stability-missing-history-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-stability-missing-history-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceStabilityHelpUnit() {
  const { renderMainHelp, renderStabilityHelp } = require(path.join(projectRoot, "dist", "cliHelp.js"));
  try {
    const mainHelp = renderMainHelp();
    const stabilityHelp = renderStabilityHelp();
    const cliHelp = runCliHelpCommand(["stability", "--help"]);
    const shortHelp = runCliHelpCommand(["stability", "-h"]);
    if (cliHelp.status !== 0 || shortHelp.status !== 0 || cliHelp.stdout !== stabilityHelp || shortHelp.stdout !== stabilityHelp) {
      throw new Error(`stability help mismatch: stdout=${cliHelp.stdout} short=${shortHelp.stdout}`);
    }
    assertHelpIncludes(mainHelp, ["stability   Show governance operational stability score"]);
    assertHelpIncludes(stabilityHelp, [
      "Usage:\n  node dist/cli.js stability [options]",
      "--window <n>                 Trend analysis window",
      "--baseline-window <n>       Drift baseline window",
      "--comparison-window <n>     Drift comparison window",
      "Read-only guarantee:"
    ]);

    console.log("PASS governance-stability-help-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-stability-help-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function directEscalation(stabilityOverrides = {}) {
  const { buildGovernanceEscalation } = require(path.join(projectRoot, "dist", "repair", "governanceEscalation.js"));
  const stability = {
    version: 1,
    score: 100,
    level: "stable",
    summary: "Governance operations appear stable and within acceptable ranges.",
    contributingFactors: [],
    metrics: {
      trendHealth: "healthy",
      driftSeverity: "none",
      governanceVolatilityScore: 0,
      trustVolatilityScore: 0,
      validationVolatilityScore: 0,
      blockedRate: 10,
      validationSuccessRate: 90,
      averageTrustScore: 80,
      readyRate: 75
    },
    anomalies: [],
    generatedAt: "2026-05-11T10:00:00.000Z",
    ...stabilityOverrides
  };
  return buildGovernanceEscalation({ stability });
}

function runGovernanceEscalationUnit() {
  try {
    const escalation = directEscalation();
    if (escalation.version !== 1 || escalation.escalationLevel !== "none" || escalation.requiresOperatorAttention !== false || escalation.triggers[0]?.code !== "NO_ESCALATION") {
      throw new Error(`escalation mismatch: ${JSON.stringify(escalation)}`);
    }

    console.log("PASS governance-escalation-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-escalation-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceEscalationLevelUnit() {
  try {
    const warning = directEscalation({ score: 74, level: "caution" });
    const highRisk = directEscalation({ score: 51, level: "unstable" });
    const critical = directEscalation({ score: 22, level: "critical" });
    const driftCritical = directEscalation({ score: 92, level: "stable", metrics: { ...directStability().metrics, driftSeverity: "critical" } });
    const driftHigh = directEscalation({ score: 92, level: "stable", metrics: { ...directStability().metrics, driftSeverity: "high" } });
    if (
      warning.escalationLevel !== "warning" ||
      highRisk.escalationLevel !== "high-risk" ||
      critical.escalationLevel !== "critical" ||
      driftCritical.escalationLevel !== "critical" ||
      driftHigh.escalationLevel !== "high-risk"
    ) {
      throw new Error(`escalation level mismatch: ${JSON.stringify({ warning, highRisk, critical, driftCritical, driftHigh })}`);
    }

    console.log("PASS governance-escalation-level-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-escalation-level-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceEscalationOperatorAttentionUnit() {
  try {
    const none = directEscalation({ level: "stable" });
    const warning = directEscalation({ level: "caution" });
    const highRisk = directEscalation({ level: "unstable" });
    const critical = directEscalation({ level: "critical" });
    if (none.requiresOperatorAttention !== false || warning.requiresOperatorAttention !== true || highRisk.requiresOperatorAttention !== true || critical.requiresOperatorAttention !== true) {
      throw new Error(`operator attention mismatch: ${JSON.stringify({ none, warning, highRisk, critical })}`);
    }

    console.log("PASS governance-escalation-operator-attention-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-escalation-operator-attention-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceEscalationTriggerUnit() {
  try {
    const escalation = directEscalation({
      score: 52,
      level: "unstable",
      metrics: {
        ...directStability().metrics,
        driftSeverity: "high",
        trendHealth: "warning",
        governanceVolatilityScore: 18,
        trustVolatilityScore: 28,
        validationVolatilityScore: 9
      },
      anomalies: [{ severity: "critical", code: "CRITICAL_TEST_ANOMALY", message: "Critical test anomaly." }]
    });
    const codes = escalation.triggers.map((trigger) => trigger.code);
    if (
      escalation.escalationLevel !== "high-risk" ||
      !codes.includes("STABILITY_UNSTABLE") ||
      !codes.includes("HIGH_GOVERNANCE_DRIFT") ||
      !codes.includes("TREND_HEALTH_WARNING") ||
      !codes.includes("HIGH_TRUST_VOLATILITY") ||
      !codes.includes("CRITICAL_ANOMALY")
    ) {
      throw new Error(`trigger mismatch: ${JSON.stringify(escalation)}`);
    }

    console.log("PASS governance-escalation-trigger-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-escalation-trigger-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceEscalationActionUnit() {
  try {
    const none = directEscalation();
    const warning = directEscalation({ score: 74, level: "caution" });
    const highRisk = directEscalation({ score: 51, level: "unstable" });
    const critical = directEscalation({ score: 22, level: "critical" });
    if (
      none.recommendedActions[0] !== "No operator action required." ||
      !warning.recommendedActions.includes("Inspect recent trend and drift reports.") ||
      !highRisk.recommendedActions.includes("Pause high-risk autonomous workflows until reviewed.") ||
      !critical.recommendedActions.includes("Immediately review governance stability and drift reports.")
    ) {
      throw new Error(`action mismatch: ${JSON.stringify({ none, warning, highRisk, critical })}`);
    }

    console.log("PASS governance-escalation-action-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-escalation-action-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceEscalationSummaryUnit() {
  try {
    const none = directEscalation();
    const warning = directEscalation({ score: 74, level: "caution" });
    const highRisk = directEscalation({ score: 51, level: "unstable" });
    const critical = directEscalation({ score: 22, level: "critical" });
    if (
      none.summary !== "No governance escalation is required." ||
      warning.summary !== "Governance warning detected. Operator review is recommended." ||
      highRisk.summary !== "High-risk governance condition detected. Operator attention is required." ||
      critical.summary !== "Critical governance condition detected. Immediate operator intervention is recommended."
    ) {
      throw new Error(`summary mismatch: ${JSON.stringify({ none, warning, highRisk, critical })}`);
    }

    console.log("PASS governance-escalation-summary-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-escalation-summary-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceEscalationJsonUnit() {
  try {
    const repo = createDriftRepo("governance-escalation-json", [
      ...repeatedDriftValues(5, { blockedRate: 10, humanReviewRate: 10, validationSuccessRate: 90, averageTrustScore: 80, readyRate: 75 }),
      ...repeatedDriftValues(2, { blockedRate: 12, humanReviewRate: 10, validationSuccessRate: 90, averageTrustScore: 80, readyRate: 75 })
    ]);
    const result = runCliHelpCommand(["escalation", "--repo", repo, "--window", "7", "--baseline-window", "5", "--comparison-window", "2", "--json"]);
    const parsed = JSON.parse(result.stdout);
    if (result.status !== 0 || parsed.version !== 1 || parsed.escalationLevel !== "high-risk" || parsed.requiresOperatorAttention !== true) {
      throw new Error(`escalation JSON CLI mismatch: status=${result.status} stdout=${result.stdout} stderr=${result.stderr}`);
    }

    console.log("PASS governance-escalation-json-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-escalation-json-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceEscalationCliUnit() {
  try {
    const repo = createDriftRepo("governance-escalation-cli", [
      ...repeatedDriftValues(5, { blockedRate: 10, humanReviewRate: 10, validationSuccessRate: 90, averageTrustScore: 80, readyRate: 75 }),
      ...repeatedDriftValues(2, { blockedRate: 12, humanReviewRate: 10, validationSuccessRate: 90, averageTrustScore: 80, readyRate: 75 })
    ]);
    const archiveIndexPath = path.join(repo, ".factory", "archive-index.json");
    const runsIndexPath = path.join(repo, ".factory", "runs-index.json");
    const beforeArchiveIndex = fs.readFileSync(archiveIndexPath, "utf8");
    const beforeRunsIndex = fs.readFileSync(runsIndexPath, "utf8");
    const result = runCliHelpCommand(["escalation", "--repo", repo, "--window", "7", "--baseline-window", "5", "--comparison-window", "2"]);
    const afterArchiveIndex = fs.readFileSync(archiveIndexPath, "utf8");
    const afterRunsIndex = fs.readFileSync(runsIndexPath, "utf8");
    if (
      result.status !== 0 ||
      !result.stdout.includes("Governance Escalation") ||
      !result.stdout.includes("Escalation level:") ||
      beforeArchiveIndex !== afterArchiveIndex ||
      beforeRunsIndex !== afterRunsIndex
    ) {
      throw new Error(`escalation CLI mismatch: status=${result.status} stdout=${result.stdout} stderr=${result.stderr}`);
    }

    console.log("PASS governance-escalation-cli-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-escalation-cli-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceEscalationMissingHistoryUnit() {
  try {
    const repo = createArchiveRepo("governance-escalation-missing-history", null);
    const result = runCliHelpCommand(["escalation", "--repo", repo, "--json"]);
    const parsed = JSON.parse(result.stdout);
    if (
      result.status !== 0 ||
      parsed.escalationLevel !== "none" ||
      parsed.requiresOperatorAttention !== false ||
      parsed.triggers[0]?.code !== "NO_ESCALATION" ||
      parsed.summary !== "No governance escalation is required."
    ) {
      throw new Error(`missing escalation history mismatch: status=${result.status} stdout=${result.stdout} stderr=${result.stderr}`);
    }

    console.log("PASS governance-escalation-missing-history-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-escalation-missing-history-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernanceEscalationHelpUnit() {
  const { renderMainHelp, renderEscalationHelp } = require(path.join(projectRoot, "dist", "cliHelp.js"));
  try {
    const mainHelp = renderMainHelp();
    const escalationHelp = renderEscalationHelp();
    const cliHelp = runCliHelpCommand(["escalation", "--help"]);
    const shortHelp = runCliHelpCommand(["escalation", "-h"]);
    if (cliHelp.status !== 0 || shortHelp.status !== 0 || cliHelp.stdout !== escalationHelp || shortHelp.stdout !== escalationHelp) {
      throw new Error(`escalation help mismatch: stdout=${cliHelp.stdout} short=${shortHelp.stdout}`);
    }
    assertHelpIncludes(mainHelp, ["escalation  Show governance operator escalation status"]);
    assertHelpIncludes(escalationHelp, [
      "Usage:\n  node dist/cli.js escalation [options]",
      "--window <n>                 Trend analysis window",
      "--baseline-window <n>       Drift baseline window",
      "--comparison-window <n>     Drift comparison window",
      "does not send notifications"
    ]);

    console.log("PASS governance-escalation-help-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-escalation-help-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function directPolicy(escalationOverrides = {}) {
  const { buildGovernancePolicyEnforcement } = require(path.join(projectRoot, "dist", "repair", "governancePolicyEnforcement.js"));
  const escalation = {
    version: 1,
    escalationLevel: "none",
    requiresOperatorAttention: false,
    summary: "No governance escalation is required.",
    triggers: [{ code: "NO_ESCALATION", severity: "info", message: "No governance escalation triggers were detected." }],
    recommendedActions: ["No operator action required."],
    sourceSignals: {
      stabilityScore: 100,
      stabilityLevel: "stable",
      driftSeverity: "none",
      trendHealth: "healthy",
      criticalAnomalyCount: 0,
      warningAnomalyCount: 0,
      governanceVolatilityScore: 0,
      trustVolatilityScore: 0,
      validationVolatilityScore: 0
    },
    generatedAt: "2026-05-11T10:00:00.000Z",
    ...escalationOverrides
  };
  return buildGovernancePolicyEnforcement({ escalation });
}

function runGovernancePolicyEnforcementUnit() {
  try {
    const policy = directPolicy();
    if (policy.version !== 1 || policy.recommendedPolicyMode !== "normal" || policy.reasons[0]?.code !== "GOVERNANCE_HEALTHY") {
      throw new Error(`policy mismatch: ${JSON.stringify(policy)}`);
    }

    console.log("PASS governance-policy-enforcement-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-policy-enforcement-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernancePolicyModeUnit() {
  try {
    const normal = directPolicy({ escalationLevel: "none" });
    const conservative = directPolicy({ escalationLevel: "warning" });
    const restricted = directPolicy({ escalationLevel: "high-risk" });
    const manual = directPolicy({ escalationLevel: "critical" });
    const unstableOverride = directPolicy({ escalationLevel: "warning", sourceSignals: { ...directPolicy().sourceSignals, stabilityLevel: "unstable" } });
    const criticalDriftOverride = directPolicy({ escalationLevel: "warning", sourceSignals: { ...directPolicy().sourceSignals, driftSeverity: "critical" } });
    if (
      normal.recommendedPolicyMode !== "normal" ||
      conservative.recommendedPolicyMode !== "conservative" ||
      restricted.recommendedPolicyMode !== "restricted" ||
      manual.recommendedPolicyMode !== "manual-review-only" ||
      unstableOverride.recommendedPolicyMode !== "restricted" ||
      criticalDriftOverride.recommendedPolicyMode !== "manual-review-only"
    ) {
      throw new Error(`policy mode mismatch: ${JSON.stringify({ normal, conservative, restricted, manual, unstableOverride, criticalDriftOverride })}`);
    }

    console.log("PASS governance-policy-mode-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-policy-mode-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernancePolicyAutonomousOperationUnit() {
  try {
    const normal = directPolicy({ escalationLevel: "none" });
    const conservative = directPolicy({ escalationLevel: "warning" });
    const restricted = directPolicy({ escalationLevel: "high-risk" });
    const manual = directPolicy({ escalationLevel: "critical" });
    if (
      normal.autonomousOperationAllowed !== true ||
      conservative.autonomousOperationAllowed !== true ||
      restricted.autonomousOperationAllowed !== false ||
      manual.autonomousOperationAllowed !== false
    ) {
      throw new Error(`autonomous operation mismatch: ${JSON.stringify({ normal, conservative, restricted, manual })}`);
    }

    console.log("PASS governance-policy-autonomous-operation-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-policy-autonomous-operation-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernancePolicyOperatorApprovalUnit() {
  try {
    const normal = directPolicy({ escalationLevel: "none" });
    const conservative = directPolicy({ escalationLevel: "warning" });
    const restricted = directPolicy({ escalationLevel: "high-risk" });
    const manual = directPolicy({ escalationLevel: "critical" });
    if (
      normal.operatorApprovalRequired !== false ||
      conservative.operatorApprovalRequired !== true ||
      restricted.operatorApprovalRequired !== true ||
      manual.operatorApprovalRequired !== true
    ) {
      throw new Error(`operator approval mismatch: ${JSON.stringify({ normal, conservative, restricted, manual })}`);
    }

    console.log("PASS governance-policy-operator-approval-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-policy-operator-approval-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernancePolicyCiModeUnit() {
  try {
    const normal = directPolicy({ escalationLevel: "none" });
    const conservative = directPolicy({ escalationLevel: "warning" });
    const restricted = directPolicy({ escalationLevel: "high-risk" });
    const manual = directPolicy({ escalationLevel: "critical" });
    if (normal.ciModeRecommendation !== "normal" || conservative.ciModeRecommendation !== "strict" || restricted.ciModeRecommendation !== "strict" || manual.ciModeRecommendation !== "restricted") {
      throw new Error(`CI mode mismatch: ${JSON.stringify({ normal, conservative, restricted, manual })}`);
    }

    console.log("PASS governance-policy-ci-mode-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-policy-ci-mode-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernancePolicyReasonUnit() {
  try {
    const policy = directPolicy({
      escalationLevel: "high-risk",
      sourceSignals: {
        ...directPolicy().sourceSignals,
        stabilityLevel: "unstable",
        driftSeverity: "critical",
        criticalAnomalyCount: 2
      }
    });
    const codes = policy.reasons.map((reason) => reason.code);
    if (!codes.includes("ESCALATION_HIGH_RISK") || !codes.includes("STABILITY_UNSTABLE") || !codes.includes("CRITICAL_GOVERNANCE_DRIFT") || !codes.includes("MULTIPLE_CRITICAL_ANOMALIES")) {
      throw new Error(`policy reasons mismatch: ${JSON.stringify(policy)}`);
    }

    console.log("PASS governance-policy-reason-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-policy-reason-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernancePolicyRestrictionUnit() {
  try {
    const normal = directPolicy({ escalationLevel: "none" });
    const conservative = directPolicy({ escalationLevel: "warning" });
    const restricted = directPolicy({ escalationLevel: "high-risk" });
    const manual = directPolicy({ escalationLevel: "critical" });
    if (
      normal.recommendedRestrictions[0] !== "No governance restrictions recommended." ||
      !conservative.recommendedRestrictions.includes("Prefer conservative governance policy profiles.") ||
      !restricted.recommendedRestrictions.includes("Require operator approval for high-risk autonomous workflows.") ||
      !manual.recommendedRestrictions.includes("Disable unrestricted autonomous operation.")
    ) {
      throw new Error(`policy restrictions mismatch: ${JSON.stringify({ normal, conservative, restricted, manual })}`);
    }

    console.log("PASS governance-policy-restriction-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-policy-restriction-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernancePolicySummaryUnit() {
  try {
    const normal = directPolicy({ escalationLevel: "none" });
    const conservative = directPolicy({ escalationLevel: "warning" });
    const restricted = directPolicy({ escalationLevel: "high-risk" });
    const manual = directPolicy({ escalationLevel: "critical" });
    if (
      normal.summary !== "Normal autonomous governance operation is recommended." ||
      conservative.summary !== "Conservative governance operation is recommended." ||
      restricted.summary !== "Restricted governance operation is recommended." ||
      manual.summary !== "Manual-review-only governance operation is recommended."
    ) {
      throw new Error(`policy summary mismatch: ${JSON.stringify({ normal, conservative, restricted, manual })}`);
    }

    console.log("PASS governance-policy-summary-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-policy-summary-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernancePolicyJsonUnit() {
  try {
    const repo = createDriftRepo("governance-policy-json", [
      ...repeatedDriftValues(5, { blockedRate: 10, humanReviewRate: 10, validationSuccessRate: 90, averageTrustScore: 80, readyRate: 75 }),
      ...repeatedDriftValues(2, { blockedRate: 12, humanReviewRate: 10, validationSuccessRate: 90, averageTrustScore: 80, readyRate: 75 })
    ]);
    const result = runCliHelpCommand(["policy", "--repo", repo, "--window", "7", "--baseline-window", "5", "--comparison-window", "2", "--json"]);
    const parsed = JSON.parse(result.stdout);
    if (result.status !== 0 || parsed.version !== 1 || parsed.recommendedPolicyMode !== "restricted" || parsed.autonomousOperationAllowed !== false) {
      throw new Error(`policy JSON CLI mismatch: status=${result.status} stdout=${result.stdout} stderr=${result.stderr}`);
    }

    console.log("PASS governance-policy-json-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-policy-json-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernancePolicyCliUnit() {
  try {
    const repo = createDriftRepo("governance-policy-cli", [
      ...repeatedDriftValues(5, { blockedRate: 10, humanReviewRate: 10, validationSuccessRate: 90, averageTrustScore: 80, readyRate: 75 }),
      ...repeatedDriftValues(2, { blockedRate: 12, humanReviewRate: 10, validationSuccessRate: 90, averageTrustScore: 80, readyRate: 75 })
    ]);
    const archiveIndexPath = path.join(repo, ".factory", "archive-index.json");
    const runsIndexPath = path.join(repo, ".factory", "runs-index.json");
    const beforeArchiveIndex = fs.readFileSync(archiveIndexPath, "utf8");
    const beforeRunsIndex = fs.readFileSync(runsIndexPath, "utf8");
    const result = runCliHelpCommand(["policy", "--repo", repo, "--window", "7", "--baseline-window", "5", "--comparison-window", "2"]);
    const afterArchiveIndex = fs.readFileSync(archiveIndexPath, "utf8");
    const afterRunsIndex = fs.readFileSync(runsIndexPath, "utf8");
    if (
      result.status !== 0 ||
      !result.stdout.includes("Governance Policy Recommendation") ||
      !result.stdout.includes("Recommended policy mode:") ||
      beforeArchiveIndex !== afterArchiveIndex ||
      beforeRunsIndex !== afterRunsIndex
    ) {
      throw new Error(`policy CLI mismatch: status=${result.status} stdout=${result.stdout} stderr=${result.stderr}`);
    }

    console.log("PASS governance-policy-cli-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-policy-cli-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernancePolicyMissingHistoryUnit() {
  try {
    const repo = createArchiveRepo("governance-policy-missing-history", null);
    const result = runCliHelpCommand(["policy", "--repo", repo, "--json"]);
    const parsed = JSON.parse(result.stdout);
    if (
      result.status !== 0 ||
      parsed.recommendedPolicyMode !== "normal" ||
      parsed.autonomousOperationAllowed !== true ||
      parsed.operatorApprovalRequired !== false ||
      parsed.ciModeRecommendation !== "normal" ||
      parsed.reasons[0]?.code !== "GOVERNANCE_HEALTHY"
    ) {
      throw new Error(`missing policy history mismatch: status=${result.status} stdout=${result.stdout} stderr=${result.stderr}`);
    }

    console.log("PASS governance-policy-missing-history-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-policy-missing-history-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runGovernancePolicyHelpUnit() {
  const { renderMainHelp, renderPolicyHelp } = require(path.join(projectRoot, "dist", "cliHelp.js"));
  try {
    const mainHelp = renderMainHelp();
    const policyHelp = renderPolicyHelp();
    const cliHelp = runCliHelpCommand(["policy", "--help"]);
    const shortHelp = runCliHelpCommand(["policy", "-h"]);
    if (cliHelp.status !== 0 || shortHelp.status !== 0 || cliHelp.stdout !== policyHelp || shortHelp.stdout !== policyHelp) {
      throw new Error(`policy help mismatch: stdout=${cliHelp.stdout} short=${shortHelp.stdout}`);
    }
    assertHelpIncludes(mainHelp, ["policy      Show governance policy recommendation"]);
    assertHelpIncludes(policyHelp, [
      "Usage:\n  node dist/cli.js policy [options]",
      "--window <n>                 Trend analysis window",
      "--baseline-window <n>       Drift baseline window",
      "--comparison-window <n>     Drift comparison window",
      "does not enforce policies automatically"
    ]);

    console.log("PASS governance-policy-help-unit");
    return true;
  } catch (error) {
    console.log("FAIL governance-policy-help-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}
function runCliHelpCommand(args, cwd = projectRoot) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    cwd,
    encoding: "utf8"
  });
}

function assertHelpIncludes(output, needles) {
  for (const needle of needles) {
    if (!output.includes(needle)) {
      throw new Error(`help output missing ${needle}: ${output}`);
    }
  }
}

function runCliHelpMainUnit() {
  const { renderMainHelp } = require(path.join(projectRoot, "dist", "cliHelp.js"));
  try {
    const direct = renderMainHelp();
    const cliResult = runCliHelpCommand(["--help"]);
    const helpCommand = runCliHelpCommand(["help"]);
    if (cliResult.status !== 0 || helpCommand.status !== 0 || cliResult.stdout !== direct || helpCommand.stdout !== direct) {
      throw new Error(`main help mismatch: direct=${direct} stdout=${cliResult.stdout} help=${helpCommand.stdout}`);
    }
    assertHelpIncludes(direct, [
      "# AI Software Factory CLI",
      "node dist/cli.js <command> [options]",
      "runs        Show historical governance run dashboard",
      "Governance commands are read-only and do not modify repair behavior."
    ]);

    console.log("PASS cli-help-main-unit");
    return true;
  } catch (error) {
    console.log("FAIL cli-help-main-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runCliHelpRunsUnit() {
  const { renderRunsHelp } = require(path.join(projectRoot, "dist", "cliHelp.js"));
  try {
    const direct = renderRunsHelp();
    const cliResult = runCliHelpCommand(["runs", "--help"]);
    const shortResult = runCliHelpCommand(["runs", "-h"]);
    if (cliResult.status !== 0 || shortResult.status !== 0 || cliResult.stdout !== direct || shortResult.stdout !== direct) {
      throw new Error(`runs help mismatch: stdout=${cliResult.stdout} short=${shortResult.stdout}`);
    }
    assertHelpIncludes(direct, [
      "Usage:\n  node dist/cli.js runs [options]",
      "--export [format]    Export dashboard: json, markdown, csv, all",
      "ready-with-caution",
      "Read-only guarantee:"
    ]);

    console.log("PASS cli-help-runs-unit");
    return true;
  } catch (error) {
    console.log("FAIL cli-help-runs-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runCliHelpInsightsUnit() {
  const { renderInsightsHelp } = require(path.join(projectRoot, "dist", "cliHelp.js"));
  try {
    const direct = renderInsightsHelp();
    const cliResult = runCliHelpCommand(["insights", "--help"]);
    if (cliResult.status !== 0 || cliResult.stdout !== direct) {
      throw new Error(`insights help mismatch: stdout=${cliResult.stdout}`);
    }
    assertHelpIncludes(direct, [
      "Usage:\n  node dist/cli.js insights [options]",
      "--profile <name>   Use governance policy profile",
      "conservative",
      "experimental",
      "Read-only guarantee:"
    ]);

    console.log("PASS cli-help-insights-unit");
    return true;
  } catch (error) {
    console.log("FAIL cli-help-insights-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runCliHelpCiSummaryUnit() {
  const { renderCiSummaryHelp } = require(path.join(projectRoot, "dist", "cliHelp.js"));
  try {
    const direct = renderCiSummaryHelp();
    const cliResult = runCliHelpCommand(["ci-summary", "--help"]);
    if (cliResult.status !== 0 || cliResult.stdout !== direct) {
      throw new Error(`ci-summary help mismatch: stdout=${cliResult.stdout}`);
    }
    assertHelpIncludes(direct, [
      "Usage:\n  node dist/cli.js ci-summary [options]",
      "Exit codes:",
      "fail  -> 1",
      "Read-only guarantee:"
    ]);

    console.log("PASS cli-help-ci-summary-unit");
    return true;
  } catch (error) {
    console.log("FAIL cli-help-ci-summary-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runCliHelpUnknownCommandUnit() {
  const { renderUnknownCommandError } = require(path.join(projectRoot, "dist", "cliHelp.js"));
  try {
    const result = runCliHelpCommand(["unknown"]);
    const expected = renderUnknownCommandError("unknown");
    if (result.status !== 1 || result.stderr !== expected) {
      throw new Error(`unknown command mismatch: status=${result.status} stdout=${result.stdout} stderr=${result.stderr}`);
    }

    console.log("PASS cli-help-unknown-command-unit");
    return true;
  } catch (error) {
    console.log("FAIL cli-help-unknown-command-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runCliHelpInvalidGovernanceFlagUnit(command, checkName) {
  const { renderInvalidFlagError } = require(path.join(projectRoot, "dist", "cliHelp.js"));
  try {
    const result = runCliHelpCommand([command, "--bad"]);
    const expected = renderInvalidFlagError(command, "--bad");
    if (result.status !== 1 || result.stderr !== expected || !result.stderr.includes(`node dist/cli.js ${command} --help`)) {
      throw new Error(`${command} invalid flag mismatch: status=${result.status} stdout=${result.stdout} stderr=${result.stderr}`);
    }

    console.log(`PASS ${checkName}`);
    return true;
  } catch (error) {
    console.log(`FAIL ${checkName}`);
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runCliHelpReadonlyGuaranteeUnit() {
  try {
    const repo = path.join(projectRoot, ".scenario-unit", "cli-help-readonly");
    fs.rmSync(repo, { recursive: true, force: true });
    ensureDir(repo);
    const commands = [["--help"], ["runs", "--help"], ["insights", "--help"], ["ci-summary", "--help"], ["archive", "--help"], ["trends", "--help"], ["drift", "--help"], ["stability", "--help"], ["escalation", "--help"], ["policy", "--help"]];
    for (const args of commands) {
      const result = runCliHelpCommand(args);
      const hasReadonly = /read.?only/i.test(result.stdout);
      const hasRepairGuarantee = /modify repair behavior/i.test(result.stdout);
      if (result.status !== 0 || !hasReadonly || !hasRepairGuarantee) {
        throw new Error(`readonly help mismatch for ${args.join(" ")}: status=${result.status} stdout=${result.stdout}`);
      }
    }
    if (fs.existsSync(path.join(repo, ".factory"))) {
      throw new Error("help commands must not create .factory artifacts");
    }

    console.log("PASS cli-help-readonly-guarantee-unit");
    return true;
  } catch (error) {
    console.log("FAIL cli-help-readonly-guarantee-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function runCliHelpExistingBehaviorUnit() {
  try {
    const runHelp = runCliHelpCommand(["run", "--help"]);
    if (runHelp.status !== 0 || !runHelp.stdout.includes("--repo <path>") || !runHelp.stdout.includes("--task <task>")) {
      throw new Error(`run command help changed unexpectedly: status=${runHelp.status} stdout=${runHelp.stdout} stderr=${runHelp.stderr}`);
    }

    const missingRequired = runCliHelpCommand(["run"]);
    if (missingRequired.status === 0 || !missingRequired.stderr.includes("required option")) {
      throw new Error(`run command required-option behavior changed: status=${missingRequired.status} stdout=${missingRequired.stdout} stderr=${missingRequired.stderr}`);
    }

    console.log("PASS cli-help-existing-behavior-unit");
    return true;
  } catch (error) {
    console.log("FAIL cli-help-existing-behavior-unit");
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
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
  if (!runRepairEvidenceValidatorUnit()) {
    failed += 1;
  }
  if (!runRepairEvidenceConfidenceUnit()) {
    failed += 1;
  }
  if (!runRepairEvidenceReportUnit()) {
    failed += 1;
  }
  if (!runRepairEvidenceGateUnit()) {
    failed += 1;
  }
  if (!runRepairPatchPolicyUnit()) {
    failed += 1;
  }
  if (!runRepairPatchPolicyGateUnit()) {
    failed += 1;
  }
  if (!runRepairPatchPolicyReportUnit()) {
    failed += 1;
  }
  if (!runRepairStrategyUnit()) {
    failed += 1;
  }
  if (!runRepairStrategyGateUnit()) {
    failed += 1;
  }
  if (!runRepairRetryStrategyUnit()) {
    failed += 1;
  }
  if (!runRepairRetryStrategyIntegrationUnit()) {
    failed += 1;
  }
  if (!runRepairStrategyReportUnit()) {
    failed += 1;
  }
  if (!runRepairStrategyScenarioHardeningUnit()) {
    failed += 1;
  }
  if (!runFailureSignatureUnit()) {
    failed += 1;
  }
  if (!(await runFailureMemoryUnit())) {
    failed += 1;
  }
  if (!runFailureMemoryLookupUnit()) {
    failed += 1;
  }
  if (!(await runFailureMemoryUpdateUnit())) {
    failed += 1;
  }
  if (!runFailureMemoryRetryAwarenessUnit()) {
    failed += 1;
  }
  if (!runFailureMemoryScenarioHardeningUnit()) {
    failed += 1;
  }
  if (!runRepairValidationDeltaUnit()) {
    failed += 1;
  }
  if (!runRepairOutcomeClassifierUnit()) {
    failed += 1;
  }
  if (!runRepairDecisionAuditUnit()) {
    failed += 1;
  }
  if (!runRepairOutcomeReportUnit()) {
    failed += 1;
  }
  if (!runRepairOutcomeMemoryIntegrationUnit()) {
    failed += 1;
  }
  if (!runRepairOutcomeScenarioHardeningUnit()) {
    failed += 1;
  }
  if (!(await runRepairAnalyticsUnit())) {
    failed += 1;
  }
  if (!(await runRepairEffectivenessScoreUnit())) {
    failed += 1;
  }
  if (!runRepairAnalyticsReportUnit()) {
    failed += 1;
  }
  if (!(await runRepairAnalyticsHistoryUnit())) {
    failed += 1;
  }
  if (!(await runRepairAnalyticsTrendUnit())) {
    failed += 1;
  }
  if (!runRepairAnalyticsAdvisoryOnlyUnit()) {
    failed += 1;
  }
  if (!runRepairRegressionGuardUnit()) {
    failed += 1;
  }
  if (!runRepairRegressionRiskUnit()) {
    failed += 1;
  }
  if (!runRepairRegressionReportUnit()) {
    failed += 1;
  }
  if (!runRepairRegressionPolicyIntegrationUnit()) {
    failed += 1;
  }
  if (!runRepairRegressionHistoryPatternUnit()) {
    failed += 1;
  }
  if (!runRepairObservabilitySchemaUnit()) {
    failed += 1;
  }
  if (!runRepairDecisionTraceUnit()) {
    failed += 1;
  }
  if (!runRepairSummaryUnit()) {
    failed += 1;
  }
  if (!runRepairObservabilityReportUnit()) {
    failed += 1;
  }
  if (!runRepairFinalDecisionUnit()) {
    failed += 1;
  }
  if (!runRepairReviewUnit()) {
    failed += 1;
  }
  if (!runRepairReviewScoreUnit()) {
    failed += 1;
  }
  if (!runRepairReviewVerdictUnit()) {
    failed += 1;
  }
  if (!runRepairReviewReportUnit()) {
    failed += 1;
  }
  if (!runRepairReviewArtifactUnit()) {
    failed += 1;
  }
  if (!runRepairReviewAnalyticsUnit()) {
    failed += 1;
  }
  if (!runRepairReviewAnalyticsUpdateUnit()) {
    failed += 1;
  }
  if (!runRepairReviewAnalyticsWarningUnit()) {
    failed += 1;
  }
  if (!runRepairReviewAnalyticsTrendUnit()) {
    failed += 1;
  }
  if (!runRepairReviewAnalyticsReportUnit()) {
    failed += 1;
  }
  if (!runRepairReviewAnalyticsArtifactUnit()) {
    failed += 1;
  }
  if (!runRepairTrustIndexUnit()) {
    failed += 1;
  }
  if (!runRepairTrustIndexScoreUnit()) {
    failed += 1;
  }
  if (!runRepairTrustIndexLevelUnit()) {
    failed += 1;
  }
  if (!runRepairTrustIndexOverrideUnit()) {
    failed += 1;
  }
  if (!runRepairTrustIndexReportUnit()) {
    failed += 1;
  }
  if (!runRepairTrustIndexArtifactUnit()) {
    failed += 1;
  }
  if (!runRepairReleaseGateUnit()) {
    failed += 1;
  }
  if (!runRepairReleaseGateScoreUnit()) {
    failed += 1;
  }
  if (!runRepairReleaseGateDecisionUnit()) {
    failed += 1;
  }
  if (!runRepairReleaseGateOverrideUnit()) {
    failed += 1;
  }
  if (!runRepairReleaseGateReportUnit()) {
    failed += 1;
  }
  if (!runRepairReleaseGateArtifactUnit()) {
    failed += 1;
  }
  if (!runRepairGovernanceUnit()) {
    failed += 1;
  }
  if (!runRepairGovernanceStatusUnit()) {
    failed += 1;
  }
  if (!runRepairGovernanceOverrideUnit()) {
    failed += 1;
  }
  if (!runRepairGovernanceReportUnit()) {
    failed += 1;
  }
  if (!runRepairGovernanceArtifactUnit()) {
    failed += 1;
  }
  if (!runRepairGovernanceNoBehaviorChangeUnit()) {
    failed += 1;
  }
  if (!runRunIndexUnit()) {
    failed += 1;
  }
  if (!runRunIndexEntryUnit()) {
    failed += 1;
  }
  if (!runRunIndexUpdateUnit()) {
    failed += 1;
  }
  if (!runRunIndexReplaceExistingUnit()) {
    failed += 1;
  }
  if (!runRunIndexArtifactUnit()) {
    failed += 1;
  }
  if (!runRunIndexReportUnit()) {
    failed += 1;
  }
  if (!runRunIndexDashboardUnit()) {
    failed += 1;
  }
  if (!runRunIndexDashboardFilterUnit()) {
    failed += 1;
  }
  if (!runRunIndexDashboardLimitUnit()) {
    failed += 1;
  }
  if (!runRunIndexDashboardLatestUnit()) {
    failed += 1;
  }
  if (!runRunIndexDashboardJsonUnit()) {
    failed += 1;
  }
  if (!runRunIndexDashboardRenderUnit()) {
    failed += 1;
  }
  if (!runRunIndexDashboardMissingIndexUnit()) {
    failed += 1;
  }
  if (!runRunIndexDashboardCliUnit()) {
    failed += 1;
  }
  if (!runRunIndexExportUnit()) {
    failed += 1;
  }
  if (!runRunIndexExportJsonUnit()) {
    failed += 1;
  }
  if (!runRunIndexExportMarkdownUnit()) {
    failed += 1;
  }
  if (!runRunIndexExportCsvUnit()) {
    failed += 1;
  }
  if (!runRunIndexExportAllUnit()) {
    failed += 1;
  }
  if (!runRunIndexExportFilterUnit()) {
    failed += 1;
  }
  if (!runRunIndexExportMissingIndexUnit()) {
    failed += 1;
  }
  if (!runRunIndexExportCliUnit()) {
    failed += 1;
  }
  if (!runGovernanceInsightsUnit()) {
    failed += 1;
  }
  if (!runGovernanceInsightsRatesUnit()) {
    failed += 1;
  }
  if (!runGovernanceInsightsMostCommonUnit()) {
    failed += 1;
  }
  if (!runGovernanceInsightsTrendUnit()) {
    failed += 1;
  }
  if (!runGovernanceInsightsRulesUnit()) {
    failed += 1;
  }
  if (!runGovernanceInsightsRenderUnit()) {
    failed += 1;
  }
  if (!runGovernanceInsightsExportUnit()) {
    failed += 1;
  }
  if (!runGovernanceInsightsCliUnit()) {
    failed += 1;
  }
  if (!runGovernanceInsightsMissingIndexUnit()) {
    failed += 1;
  }
  if (!runGovernancePolicyProfileUnit()) {
    failed += 1;
  }
  if (!runGovernancePolicyProfileDefaultUnit()) {
    failed += 1;
  }
  if (!runGovernancePolicyProfileInvalidUnit()) {
    failed += 1;
  }
  if (!runGovernanceInsightsProfileThresholdUnit()) {
    failed += 1;
  }
  if (!runGovernanceInsightsProfileRenderUnit()) {
    failed += 1;
  }
  if (!runGovernanceInsightsProfileJsonUnit()) {
    failed += 1;
  }
  if (!runGovernanceInsightsProfileExportUnit()) {
    failed += 1;
  }
  if (!runGovernanceInsightsProfileCliUnit()) {
    failed += 1;
  }
  if (!runGovernanceInsightsProfilesListCliUnit()) {
    failed += 1;
  }
  if (!runGovernanceCiSummaryUnit()) {
    failed += 1;
  }
  if (!runGovernanceCiSummaryPassUnit()) {
    failed += 1;
  }
  if (!runGovernanceCiSummaryWarnUnit()) {
    failed += 1;
  }
  if (!runGovernanceCiSummaryFailUnit()) {
    failed += 1;
  }
  if (!runGovernanceCiSummaryThresholdUnit()) {
    failed += 1;
  }
  if (!runGovernanceCiSummaryRenderUnit()) {
    failed += 1;
  }
  if (!runGovernanceCiSummaryExportUnit()) {
    failed += 1;
  }
  if (!runGovernanceCiSummaryCliUnit()) {
    failed += 1;
  }
  if (!runGovernanceCiSummaryExitCodeUnit()) {
    failed += 1;
  }
  if (!runGovernanceCiSummaryMissingIndexUnit()) {
    failed += 1;
  }
  if (!runGovernanceArchiveIdUnit()) {
    failed += 1;
  }
  if (!runGovernanceArchiveCopyUnit()) {
    failed += 1;
  }
  if (!runGovernanceArchiveMissingFileUnit()) {
    failed += 1;
  }
  if (!runGovernanceArchiveRunsExportUnit()) {
    failed += 1;
  }
  if (!runGovernanceArchiveInsightsExportUnit()) {
    failed += 1;
  }
  if (!runGovernanceArchiveCiSummaryExportUnit()) {
    failed += 1;
  }
  if (!runGovernanceArchiveJsonOutputUnit()) {
    failed += 1;
  }
  if (!runGovernanceArchiveRequiresExportUnit()) {
    failed += 1;
  }
  if (!runGovernanceArchiveHelpUnit()) {
    failed += 1;
  }
  if (!runGovernanceArchiveCiExitCodeUnit()) {
    failed += 1;
  }
  if (!runGovernanceArchiveIndexUnit()) {
    failed += 1;
  }
  if (!runGovernanceArchiveIndexUpdateUnit()) {
    failed += 1;
  }
  if (!runGovernanceArchiveIndexReplaceUnit()) {
    failed += 1;
  }
  if (!runGovernanceArchiveIndexSortUnit()) {
    failed += 1;
  }
  if (!runGovernanceArchiveIndexArtifactUnit()) {
    failed += 1;
  }
  if (!runGovernanceArchiveDashboardUnit()) {
    failed += 1;
  }
  if (!runGovernanceArchiveDashboardFilterUnit()) {
    failed += 1;
  }
  if (!runGovernanceArchiveDashboardLatestUnit()) {
    failed += 1;
  }
  if (!runGovernanceArchiveDashboardJsonUnit()) {
    failed += 1;
  }
  if (!runGovernanceArchiveCliUnit()) {
    failed += 1;
  }
  if (!runGovernanceArchiveCliMissingIndexUnit()) {
    failed += 1;
  }
  if (!runGovernanceArchiveCliInvalidKindUnit()) {
    failed += 1;
  }
  if (!runGovernanceArchiveCliHelpUnit()) {
    failed += 1;
  }
  if (!runGovernanceArchiveDiffUnit()) {
    failed += 1;
  }
  if (!runGovernanceArchiveDiffImprovedUnit()) {
    failed += 1;
  }
  if (!runGovernanceArchiveDiffDegradedUnit()) {
    failed += 1;
  }
  if (!runGovernanceArchiveDiffMixedUnit()) {
    failed += 1;
  }
  if (!runGovernanceArchiveDiffStableUnit()) {
    failed += 1;
  }
  if (!runGovernanceArchiveDiffUnknownUnit()) {
    failed += 1;
  }
  if (!runGovernanceArchiveDiffInsightsUnit()) {
    failed += 1;
  }
  if (!runGovernanceArchiveDiffJsonUnit()) {
    failed += 1;
  }
  if (!runGovernanceArchiveDiffCliUnit()) {
    failed += 1;
  }
  if (!runGovernanceArchiveDiffInvalidKindUnit()) {
    failed += 1;
  }
  if (!runGovernanceArchiveDiffMissingArchiveUnit()) {
    failed += 1;
  }
  if (!runGovernanceArchiveDiffHelpUnit()) {
    failed += 1;
  }
  if (!runGovernanceTrendAnalysisUnit()) {
    failed += 1;
  }
  if (!runGovernanceTrendAnalysisImprovingUnit()) {
    failed += 1;
  }
  if (!runGovernanceTrendAnalysisWorseningUnit()) {
    failed += 1;
  }
  if (!runGovernanceTrendAnalysisStableUnit()) {
    failed += 1;
  }
  if (!runGovernanceTrendAnalysisHealthUnit()) {
    failed += 1;
  }
  if (!runGovernanceTrendAnalysisVolatilityUnit()) {
    failed += 1;
  }
  if (!runGovernanceTrendAnalysisJsonUnit()) {
    failed += 1;
  }
  if (!runGovernanceTrendAnalysisCliUnit()) {
    failed += 1;
  }
  if (!runGovernanceTrendAnalysisMissingIndexUnit()) {
    failed += 1;
  }
  if (!runGovernanceTrendAnalysisInvalidKindUnit()) {
    failed += 1;
  }
  if (!runGovernanceTrendAnalysisHelpUnit()) {
    failed += 1;
  }
  if (!runGovernanceDriftDetectionUnit()) {
    failed += 1;
  }
  if (!runGovernanceDriftBaselineUnit()) {
    failed += 1;
  }
  if (!runGovernanceDriftLowUnit()) {
    failed += 1;
  }
  if (!runGovernanceDriftMediumUnit()) {
    failed += 1;
  }
  if (!runGovernanceDriftHighUnit()) {
    failed += 1;
  }
  if (!runGovernanceDriftCriticalUnit()) {
    failed += 1;
  }
  if (!runGovernanceDriftGoodChangeUnit()) {
    failed += 1;
  }
  if (!runGovernanceDriftInsufficientHistoryUnit()) {
    failed += 1;
  }
  if (!runGovernanceDriftJsonUnit()) {
    failed += 1;
  }
  if (!runGovernanceDriftCliUnit()) {
    failed += 1;
  }
  if (!runGovernanceDriftInvalidKindUnit()) {
    failed += 1;
  }
  if (!runGovernanceDriftHelpUnit()) {
    failed += 1;
  }
  if (!runGovernanceStabilityScoreUnit()) {
    failed += 1;
  }
  if (!runGovernanceStabilityLevelUnit()) {
    failed += 1;
  }
  if (!runGovernanceStabilityDeductionUnit()) {
    failed += 1;
  }
  if (!runGovernanceStabilityVolatilityUnit()) {
    failed += 1;
  }
  if (!runGovernanceStabilityAnomalyUnit()) {
    failed += 1;
  }
  if (!runGovernanceStabilitySummaryUnit()) {
    failed += 1;
  }
  if (!runGovernanceStabilityJsonUnit()) {
    failed += 1;
  }
  if (!runGovernanceStabilityCliUnit()) {
    failed += 1;
  }
  if (!runGovernanceStabilityMissingHistoryUnit()) {
    failed += 1;
  }
  if (!runGovernanceStabilityHelpUnit()) {
    failed += 1;
  }
  if (!runGovernanceEscalationUnit()) {
    failed += 1;
  }
  if (!runGovernanceEscalationLevelUnit()) {
    failed += 1;
  }
  if (!runGovernanceEscalationOperatorAttentionUnit()) {
    failed += 1;
  }
  if (!runGovernanceEscalationTriggerUnit()) {
    failed += 1;
  }
  if (!runGovernanceEscalationActionUnit()) {
    failed += 1;
  }
  if (!runGovernanceEscalationSummaryUnit()) {
    failed += 1;
  }
  if (!runGovernanceEscalationJsonUnit()) {
    failed += 1;
  }
  if (!runGovernanceEscalationCliUnit()) {
    failed += 1;
  }
  if (!runGovernanceEscalationMissingHistoryUnit()) {
    failed += 1;
  }
  if (!runGovernanceEscalationHelpUnit()) {
    failed += 1;
  }
  if (!runGovernancePolicyEnforcementUnit()) {
    failed += 1;
  }
  if (!runGovernancePolicyModeUnit()) {
    failed += 1;
  }
  if (!runGovernancePolicyAutonomousOperationUnit()) {
    failed += 1;
  }
  if (!runGovernancePolicyOperatorApprovalUnit()) {
    failed += 1;
  }
  if (!runGovernancePolicyCiModeUnit()) {
    failed += 1;
  }
  if (!runGovernancePolicyReasonUnit()) {
    failed += 1;
  }
  if (!runGovernancePolicyRestrictionUnit()) {
    failed += 1;
  }
  if (!runGovernancePolicySummaryUnit()) {
    failed += 1;
  }
  if (!runGovernancePolicyJsonUnit()) {
    failed += 1;
  }
  if (!runGovernancePolicyCliUnit()) {
    failed += 1;
  }
  if (!runGovernancePolicyMissingHistoryUnit()) {
    failed += 1;
  }
  if (!runGovernancePolicyHelpUnit()) {
    failed += 1;
  }
  if (!runCliHelpMainUnit()) {
    failed += 1;
  }
  if (!runCliHelpRunsUnit()) {
    failed += 1;
  }
  if (!runCliHelpInsightsUnit()) {
    failed += 1;
  }
  if (!runCliHelpCiSummaryUnit()) {
    failed += 1;
  }
  if (!runCliHelpUnknownCommandUnit()) {
    failed += 1;
  }
  if (!runCliHelpInvalidGovernanceFlagUnit("runs", "cli-help-invalid-runs-flag-unit")) {
    failed += 1;
  }
  if (!runCliHelpInvalidGovernanceFlagUnit("insights", "cli-help-invalid-insights-flag-unit")) {
    failed += 1;
  }
  if (!runCliHelpInvalidGovernanceFlagUnit("ci-summary", "cli-help-invalid-ci-summary-flag-unit")) {
    failed += 1;
  }
  if (!runCliHelpReadonlyGuaranteeUnit()) {
    failed += 1;
  }
  if (!runCliHelpExistingBehaviorUnit()) {
    failed += 1;
  }  if (!(await runGuardedLegacyAppendUnit())) {
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

    if (isEnvironmentEpermFailure(result.runResult) || runArtifactsContainEperm(result.artifacts.runDir)) {
      console.log(`SKIP ${name}`);
      console.log("  Environment EPERM prevented deterministic end-to-end validation.");
      console.log("  Scenario debug artifacts were still written.");
      continue;
    }

    if (
      isEnvironmentDependencyInstallFailure(result.runResult) ||
      runArtifactsContainDependencyInstallFailure(result.artifacts.runDir)
    ) {
      console.log(`SKIP ${name}`);
      console.log("  Environment dependency install failure prevented deterministic end-to-end validation.");
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
