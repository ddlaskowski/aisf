# 🏭 AI Software Factory

AI-powered local development agent that can:

* generate code
* apply changes safely
* run real validation
* detect runtime errors
* fix bugs automatically
* install missing dependencies
* auto-commit working solutions
* produce final diff & reports

---

## ✨ Current Version

**v1.8 — Evidence Validation Layer**

See [v1.5 Safe Patch Engine](docs/v1.5-safe-patch-engine.md) for the patch validation architecture, metadata, confidence scoring, and regression coverage.

v1.6 added context-aware repair target selection: stack trace parsing, error context collection, lightweight dependency scanning, repair target decision, and multi-file read / single-file patch routing.

v1.7 adds a Repair Intent Layer between target selection and patching. It introduces semantic repair planning before patching, a `RepairIntent` model, a deterministic intent builder, patch intent validation, and report/debug observability. The single-file mutation invariant remains in place, and the Safe Patch Engine remains the only mutation layer.

v1.8 validates whether a repair intent is sufficiently supported by available evidence before mutation. v1.7 can describe what it wants to repair; v1.8 checks whether that intent is backed by stack trace, context, dependency, symbol, and repair type evidence.

---

## 🧠 What It Does

AI Software Factory turns a simple task like:

```bash
npm run dev -- run --repo ../test-repo --task "Fix the bug in index.js"
```

into a full automated pipeline:

```
AI → propose changes → approval → apply → run code → detect errors
→ install deps → retry → fix → validate → commit → success
```

---

## ⚙️ Features

### 🧩 1. AI Code Generation

* Multi-file support
* Structured JSON operations
* Create / Modify / Patch support

---

### 🔧 2. Patch System (Safe Editing)

* insertAfter
* insertBefore
* replace
* fallback-safe patching
* Safe Patch Engine validation for supported patch operations
* patch metadata for retry control
* deterministic confidence scoring

---

### 🧪 3. Real Validation Mode

Runs:

```
node index.js
```

Detects:

* SyntaxError
* ReferenceError
* Runtime issues

---

### 🔁 4. Self-Healing Loop

* Automatically retries failed runs
* Passes real runtime error to AI
* Max 3 attempts per run

---

### 🧠 5. Deterministic Fixers (Critical)

Built-in logic handles:

* Duplicate declarations
* Missing variables
* Common runtime patterns

Example:

```
SyntaxError: Identifier 'X' has already been declared
```

👉 Avoids blind AI guessing

---

### 📦 6. Dependency Installer (v1.3B)

Automatically detects missing modules:

```
Error: Cannot find module 'express'
```

Then:

```
npm install express
```

Flow:

```
Run → fail → detect missing dep → install → retry
```

Safety:

* skips local paths (`./file`)
* skips built-ins (`node:fs`)
* max 2 installs per run

---

### 📊 7. Final Report Mode

After each run:

* changed files
* diff stat
* command results
* attempts count
* suggested commit message

Saved to:

```
.factory/runs/<runId>/final-report.md
```

---

### 🧾 8. Commit Message Generator

Examples:

```
fix: fix the bug in index.js
feat: add logger utility
```

---

### 🛡️ 9. Git Safety Mode

* detects uncommitted changes
* warns before execution
* supports branch mode

---

### 🚀 10. Auto-Commit (v1.3)

Automatically commits working changes:

```
git add <files>
git commit -m "fix: ..."
```

Features:

* uses `git status` as source of truth
* safe path normalization
* ignores `.factory/` artifacts

---

## 🧭 Repair Intent Layer (v1.7)

The v1.7 pipeline makes repair decisions easier to inspect before any patch reaches the Safe Patch Engine.

Previous:

```
error
→ stack trace
→ context collection
→ dependency map
→ repair target decision
→ safe patch
```

v1.7:

```
error
→ stack trace
→ context collection
→ dependency map
→ repair target decision
→ repair intent
→ patch intent validation
→ safe patch
```

v1.7 deterministic checks:

* repair-intent-model-unit
* repair-intent-builder-unit
* patch-intent-guard-unit
* repair-intent-report-unit
* repair-intent-invariant-unit

v1.7 scenario fixtures:

* missing-export-with-intent
* wrong-import-name-with-intent
* same-file-reference-error-with-intent
* low-confidence-fallback-intent

---

## 🧾 Evidence Validation Layer (v1.8)

v1.8 adds a deterministic evidence gate between repair intent and patch intent validation.

Before v1.8:

```
error
→ stack trace
→ context collection
→ dependency map
→ repair target decision
→ repair intent
→ patch intent validation
→ safe patch
```

After v1.8:

```
error
→ stack trace
→ context collection
→ dependency map
→ repair target decision
→ repair intent
→ evidence validation
→ patch intent validation
→ safe patch
```

Core output type:

```ts
type RepairEvidenceValidation = {
  ok: boolean;
  confidence: "high" | "medium" | "low";
  evidence: string[];
  warnings: string[];
  reason: string;
  downgradedFrom?: "high" | "medium";
  allowedRepairMode: "normal" | "conservative" | "manual-review";
};
```

Allowed repair modes:

* `normal`: Evidence is strong enough to continue normally.
* `conservative`: Evidence is acceptable, but warnings are recorded. Patch flow may continue unchanged for now.
* `manual-review`: Evidence is weak or validation failed. Mutation is skipped before patch intent validation and before Safe Patch Engine patching.

Safety invariant:

If evidence validation returns `manual-review` or `ok: false`, source file mutation is skipped. Patch intent validation is not reached, Safe Patch Engine file patching is not reached, and final/debug reports explain why mutation was skipped.

Reporting:

* `repair-evidence-validation-*.json` is written per run when validation occurs.
* `repairEvidenceValidation` is included in `repair-observability.json`.
* `final-report.md` includes evidence status, confidence, mode, reason, and warnings.
* `mutationSkippedForEvidence` is recorded when evidence blocks mutation.

v1.8 deterministic checks:

* repair-evidence-validator-unit
* repair-evidence-confidence-unit
* repair-evidence-report-unit
* repair-evidence-gate-unit

v1.8 scenario checks:

* missing-export-evidence-validated
* wrong-import-evidence-validated
* weak-evidence-rejected
* confidence-downgrade-on-ambiguous-context

Validation:

```bash
npm.cmd run build
node scripts\run-scenarios.js
```

Expected: build passes, the scenario runner exits `0`, and all v1.8 unit and scenario checks pass.

v1.8 makes the system safer by requiring evidence before mutation while preserving deterministic behavior, the single-file mutation invariant, and the Safe Patch Engine as the only mutation layer.

---

## 🚀 Usage

### Basic

```bash
npm run dev -- run --repo ../test-repo --task "Fix the bug in index.js"
```

---

### With Auto-Commit

```bash
npm run dev -- run --repo ../test-repo --task "Fix the bug in index.js" --commit
```

---

### With Branch

```bash
npm run dev -- run --repo ../test-repo --task "Fix the bug in index.js" --branch
```

---

## 📂 Project Structure

```
src/
  agents/
    planner.ts
    builder.ts
    reviewer.ts
  ai/
    generateCode.ts
  orchestrator/
    runTask.ts
  tools/
    fileEditor.ts
    commandRunner.ts
    diffTool.ts
    gitTool.ts
  schemas/
    changes.schema.ts
```

---

## 🔥 Example Flow

Task:

```
Fix the bug in index.js
```

Pipeline:

```
→ AI proposes PATCH
→ Apply changes
→ Run node index.js
→ Error detected
→ Install missing dependency
→ Self-healing retry
→ Deterministic fix applied
→ Validation passes
→ Auto-commit
```

---

## ⚠️ Limitations

* Requires human approval (for now)
* No test generation yet
* Limited dependency intelligence
* Patch system still evolving

---

## 🧭 Roadmap

### v1.4

* Failure Intelligence Layer
* Smart retry (no repeated fixes)
* Error classification

### v1.5

* Safe Patch Engine
* Patch metadata and confidence scoring
* Hardened patch regression checks

### v1.6

* Context-Aware Repair Engine
* Stack trace parsing and error context collection
* Lightweight dependency scanning
* Multi-file read / single-file patch target selection
* Safe Patch Engine remains the only mutation layer

### v1.7

* Repair Intent Layer
* Deterministic repair intent builder
* Patch intent guard
* Repair intent observability in run reports and debug artifacts
* Single-file mutation invariant preserved

### v1.8

* Evidence Validation Layer
* Stack/context/dependency/symbol evidence checks before mutation
* `normal`, `conservative`, and `manual-review` repair modes
* Manual-review mode skips mutation before patch intent validation
* Evidence validation artifacts and final report observability

### v2.0

* Multi-agent system
* Parallel tasks
* Project scaffolding

---

## 🧑‍💻 Author

Built by a solo developer exploring AI-driven software engineering.
