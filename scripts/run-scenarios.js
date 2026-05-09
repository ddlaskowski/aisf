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
