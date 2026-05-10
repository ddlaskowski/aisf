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

**v3.8 - Governance Snapshot Archive Layer**

See [v1.5 Safe Patch Engine](docs/v1.5-safe-patch-engine.md) for the patch validation architecture, metadata, confidence scoring, and regression coverage.

v1.6 added context-aware repair target selection: stack trace parsing, error context collection, lightweight dependency scanning, repair target decision, and multi-file read / single-file patch routing.

v1.7 adds a Repair Intent Layer between target selection and patching. It introduces semantic repair planning before patching, a `RepairIntent` model, a deterministic intent builder, patch intent validation, and report/debug observability. The single-file mutation invariant remains in place, and the Safe Patch Engine remains the only mutation layer.

v1.8 validates whether a repair intent is sufficiently supported by available evidence before mutation. v1.7 can describe what it wants to repair; v1.8 checks whether that intent is backed by stack trace, context, dependency, symbol, and repair type evidence.

v1.9 adds an Evidence-Aware Patch Policy Layer between evidence validation and patch intent validation. It constrains mutation based on evidence mode, allowed operations, blocked operations, and a deterministic recommended action.

v2.0 adds deterministic repair strategy orchestration before target selection and retry. Strategy and retry decisions are observable, conservative, and do not mutate files.

v2.1 adds deterministic repository-local failure memory. It records stable failure signatures, historical strategy outcomes, and advisory retry hints without approving patches or bypassing any existing safety gate.

v2.4 adds a deterministic Repair Regression Guard Layer. It asks whether a repair path appears historically risky and can only warn, downgrade to conservative mode, require manual review, or block before patch policy and Safe Patch Engine are reached.

v2.5 adds deterministic repair observability and decision trace artifacts. It does not change repair behavior; it records what happened, which layer decided it, and why.

v2.6 adds a deterministic repair review and recommendation layer. It evaluates the completed repair lifecycle for quality, safety, completeness, warnings, and human-review recommendations without changing repair behavior.

v2.7 adds deterministic repair review analytics. It aggregates historical review verdicts, scores, warnings, recommendations, and trends without changing repair behavior or review verdicts.

v2.8 adds a deterministic Repair Trust Index. It combines completed-run signals into one final trust score and trust level without changing repair behavior, review verdicts, patch policy, or orchestration decisions.

v2.9 adds a deterministic Repair Release Gate. It converts completed-run trust, review, validation, policy, regression, and analytics signals into one final release recommendation without changing repair behavior or orchestration.

v3.0 adds a deterministic Autonomous Repair Governance Layer. It summarizes the completed repair lifecycle into one final governance status without changing repair behavior, release gate decisions, trust scores, or any safety gate.

v3.1 adds a deterministic Governance Snapshot & Run Index Layer. It maintains a compact `.factory/runs-index.json` history of completed runs without scanning every run directory or changing repair behavior.

v3.2 adds a read-only Governance Dashboard CLI. It summarizes `.factory/runs-index.json` with stable text or JSON output and does not modify repair behavior, artifacts, or the run index.

v3.3 adds deterministic dashboard exports for JSON, Markdown, and CSV. It reads `.factory/runs-index.json`, respects the same dashboard filters, and writes only under `.factory/exports` without modifying repair behavior or the run index.

v3.4 adds deterministic governance insights over run history. It reads `.factory/runs-index.json`, computes operational health summaries, rates, trust trends, and fixed insight codes, and can export insights under `.factory/exports`.

v3.5 adds deterministic governance policy profiles for interpreting insights with different strictness levels. Profiles change only the thresholds used by the insights layer; they do not change repair behavior, governance statuses, release decisions, trust scores, or `.factory/runs-index.json`.

v3.6 adds a deterministic CI-friendly governance summary. It converts profile-aware insights into `pass`, `warn`, or `fail`, supports CI exit codes, and can export JSON/Markdown summaries without changing repair behavior or `.factory/runs-index.json`.

v3.7 hardens governance CLI help and operator UX. It adds stable help text, deterministic invalid command and invalid flag errors, CI exit-code documentation, and read-only guarantees without changing repair behavior.

v3.8 adds optional governance snapshot archiving for export outputs. It preserves timestamped copies under `.factory/archive` for audit and CI history without changing repair behavior or `.factory/runs-index.json`.

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

## 🛡️ Evidence-Aware Patch Policy Layer (v1.9)

v1.9 adds a deterministic policy gate after evidence validation and before Patch Intent Guard.

Pipeline:

```
evidence validation
→ patch policy decision
→ patch intent validation
→ safe patch
```

Purpose:

* constrain mutation based on the evidence result
* keep normal, conservative, and manual-review behavior explicit
* block risky operations before Patch Intent Guard and Safe Patch Engine are reached

The policy decides:

* mode: `normal`, `conservative`, or `manual-review`
* allowed operations
* blocked operations
* warnings
* reason
* recommended action: `proceed`, `downgrade-to-conservative`, `block-mutation`, or `manual-review`

Safety guarantees:

* does not replace the Evidence Validator
* does not replace Patch Intent Guard
* does not replace the Safe Patch Engine
* Safe Patch Engine remains the only mutation layer
* `manual-review` and `block-mutation` stop before Patch Intent Guard and Safe Patch Engine
* single-file mutation invariant remains intact

New module:

* `src/repair/repairPatchPolicy.ts`

v1.9 deterministic checks:

* repair-patch-policy-unit
* repair-patch-policy-gate-unit
* repair-patch-policy-report-unit

v1.9 scenario checks:

* conservative-policy-allows-safe-export
* conservative-policy-blocks-risky-append
* manual-review-policy-blocks-mutation
* normal-policy-allows-validated-patch

---

## 🧭 Repair Strategy Orchestration Layer (v2.0)

v2.0 adds deterministic strategy selection and retry control around the existing repair pipeline.

Pipeline:

```
error
→ failure intelligence
→ repair strategy decision
→ repair target decision
→ repair intent
→ evidence validation
→ patch policy decision
→ patch intent validation
→ safe patch
→ validation
→ retry strategy decision
```

What v2.0 adds:

* `src/repair/repairStrategy.ts`
* `src/repair/repairRetryStrategy.ts`
* strategy artifacts: `repair-strategy-*.json`
* retry artifacts: `repair-retry-decision-*.json`
* `repairStrategy` and `repairRetryDecision` in `repair-observability.json`
* stable final-report sections for repair strategy and retry strategy

Safety guarantees:

* strategy does not mutate files
* retry controller does not mutate files
* Safe Patch Engine remains the only mutation layer
* Evidence Validation and Patch Policy remain authoritative
* single-file mutation invariant remains intact
* manual-review and policy denial block retries

v2.0 deterministic checks:

* repair-strategy-unit
* repair-strategy-gate-unit
* repair-retry-strategy-unit
* repair-retry-strategy-integration-unit
* repair-strategy-report-unit
* repair-strategy-scenario-hardening-unit

---

## 🧠 Failure Memory Layer (v2.1)

v2.1 adds deterministic historical repair awareness. It is not ML, embeddings, a vector database, or an approval system; it is a bounded JSON memory that helps the retry layer avoid repeating known-bad repair paths.

Pipeline:

```
error
→ failure intelligence
→ failure signature
→ failure memory lookup
→ repair strategy decision
→ repair target decision
→ repair intent
→ evidence validation
→ patch policy decision
→ patch intent validation
→ safe patch
→ validation
→ retry orchestration
→ failure memory update
```

What v2.1 adds:

* `src/repair/failureSignature.ts`
* `src/repair/failureMemory.ts`
* `src/repair/failureMemoryLookup.ts`
* `src/repair/failureMemoryUpdate.ts`
* repository-local storage at `.factory/memory/failure-memory.json`
* `failure-signature-*.json` and `failure-memory-hint-*.json` run artifacts
* `failureMemory` in `repair-observability.json`
* final-report output for failure signatures and historical strategy hints

Failure memory records:

* stable, human-readable failure signature
* strategy used
* repair type and target file when available
* outcome: `success`, `failed`, `manual-review`, or `policy-denied`
* validation change signal
* retry count

Safety guarantees:

* failure memory only provides hints
* memory never approves patches
* memory never bypasses Evidence Validation
* memory never bypasses Patch Policy
* memory never bypasses Patch Intent Guard
* memory never bypasses the Safe Patch Engine
* Safe Patch Engine remains the only mutation layer
* single-file mutation invariant remains intact

v2.1 deterministic checks:

* failure-signature-unit
* failure-memory-unit
* failure-memory-lookup-unit
* failure-memory-update-unit
* failure-memory-retry-awareness-unit
* failure-memory-repeated-failure
* failure-memory-successful-strategy
* failure-memory-policy-denied
* failure-memory-manual-review
* retry-blocked-by-history
* retry-prefers-successful-history

---

## 🧯 Repair Regression Guard Layer (v2.4)

v2.4 adds a deterministic safety guard between evidence validation and patch policy. The guard uses historical analytics and matching failure memory to answer: “Does this repair path historically appear risky?”

Pipeline position:

```
failure intelligence
→ failure signature
→ failure memory lookup
→ repair analytics lookup
→ repair strategy decision
→ repair target decision
→ repair intent
→ evidence validation
→ repair regression guard
→ patch policy
→ patch intent validation
→ safe patch
```

What the guard can do:

* emit warnings
* downgrade normal repair to conservative policy mode
* require manual review
* block mutation through the existing policy/reporting path

What the guard cannot do:

* approve mutation
* make patching more aggressive
* bypass evidence validation
* bypass patch policy
* bypass patch intent validation
* bypass Safe Patch Engine
* introduce multi-file mutation

Patch policy remains final authority. The regression guard can only make the policy input stricter; it cannot turn `manual-review` into `normal`, cannot turn `conservative` into `normal`, and cannot override a policy denial.

v2.4 deterministic checks:

* repair-regression-guard-unit
* repair-regression-risk-unit
* repair-regression-report-unit
* repair-regression-policy-integration-unit
* repair-regression-history-pattern-unit

Scenario-style deterministic checks:

* regression-high-risk-strategy
* regression-policy-denied-history
* regression-manual-review-escalation
* regression-conservative-downgrade
* regression-warning-only
* regression-block-repeated-failure

---

## 🔎 Repair Observability & Decision Trace Layer (v2.5)

v2.5 makes the repair lifecycle inspectable without changing repair behavior. It collects and normalizes existing decisions into deterministic artifacts that help answer:

* why did the system do this?
* which layer made the key decision?
* which gate blocked or downgraded the repair?
* what evidence supported the repair?
* what history influenced the decision?
* what risk was detected?
* what final decision was made?

Artifacts written per run:

```text
.factory/runs/<runId>/repair-observability.json
.factory/runs/<runId>/decision-trace.md
.factory/runs/<runId>/repair-summary.json
```

Example trace shape:

```text
1. PASS - Failure signature - Generated deterministic signature.
2. PASS - Failure memory - Found 2 historical matches.
3. WARN - Regression guard - Recommended action: proceed-with-warning.
4. BLOCKED - Patch policy - Policy mode: conservative.
5. SKIPPED - Safe patch - Safe patch was not applied or metadata was unavailable.
```

Final reports now include:

* final decision status
* final decision reason
* blocking layer when present
* names of observability artifacts

Safety guarantees:

* observability-only
* no repair strategy changes
* no patch policy changes
* no mutation behavior changes
* Safe Patch Engine remains the only mutation layer
* single-file mutation invariant remains unchanged

v2.5 deterministic checks:

* repair-observability-schema-unit
* repair-decision-trace-unit
* repair-summary-unit
* repair-observability-report-unit
* repair-final-decision-unit

---

## 🧾 Repair Review & Recommendation Layer (v2.6)

v2.6 reviews the completed repair lifecycle without changing the repair pipeline. It consumes the observability report, decision trace, repair summary, outcome, evidence confidence, regression risk, and patch policy metadata to answer:

* was this repair process safe?
* was the orchestration path healthy?
* was evidence strong enough?
* did history or regression risk introduce concerns?
* should a human review this repair?

Artifacts written per run:

```text
.factory/runs/<runId>/repair-review.md
.factory/runs/<runId>/repair-review.json
```

Review verdicts:

* approved
* approved-with-warnings
* needs-human-review
* rejected

The review includes deterministic rule-based scores:

* qualityScore
* safetyScore
* completenessScore

Final reports now include:

* repair review verdict
* quality, safety, and completeness scores
* names of review artifacts

Safety guarantees:

* review-only behavior
* no patch generation
* no retry behavior changes
* no mutation behavior changes
* no safety gate bypasses
* Safe Patch Engine remains the only mutation layer
* single-file mutation invariant remains unchanged

v2.6 deterministic checks:

* repair-review-unit
* repair-review-score-unit
* repair-review-verdict-unit
* repair-review-report-unit
* repair-review-artifact-unit

---

## 📈 Repair Review Analytics Layer (v2.7)

v2.7 aggregates completed repair reviews over time. It answers long-term quality questions without influencing patching, retrying, review verdicts, or any safety gate:

* which review verdicts are most common?
* are quality, safety, or completeness scores trending down?
* which warnings and recommendations recur?
* which strategies often lead to human review or rejection?
* are recent review outcomes degrading?

Analytics are stored locally:

```text
.factory/analytics/repair-review-analytics.json
```

Each run also writes a snapshot:

```text
.factory/runs/<runId>/repair-review-analytics-snapshot.json
```

Tracked aggregates:

* total repair reviews
* verdict distribution
* average quality, safety, and completeness scores
* warning counts
* recommendation counts
* blocking concern counts
* verdicts by repair outcome
* verdicts by repair strategy
* recent 10-review trend window

Deterministic analytics warnings include:

* high human-review rate
* high rejected-review rate
* low average safety score
* degrading recent safety score trend
* recurring review warnings

Safety guarantees:

* analytics-only behavior
* no patch generation
* no retry behavior changes
* no review verdict changes
* no repair outcome changes
* no safety gate bypasses
* Safe Patch Engine remains the only mutation layer
* single-file mutation invariant remains unchanged

v2.7 deterministic checks:

* repair-review-analytics-unit
* repair-review-analytics-update-unit
* repair-review-analytics-warning-unit
* repair-review-analytics-trend-unit
* repair-review-analytics-report-unit
* repair-review-analytics-artifact-unit

---

## 🛡️ Repair Trust Index Layer (v2.8)

v2.8 calculates one final deterministic trust assessment after the repair lifecycle has completed. It answers:

* can this repair result be trusted?
* did validation pass?
* did review approve the run?
* did evidence, regression risk, policy, retry audit, or analytics introduce concerns?
* are there blocking concerns that make the result unsafe?

Artifacts written per run:

```text
.factory/runs/<runId>/repair-trust-index.json
.factory/runs/<runId>/repair-trust-index.md
```

Trust levels:

* high
* medium
* low
* unsafe

The trust index combines deterministic signals from:

* repair outcome
* repair review verdict
* evidence confidence
* regression risk
* patch policy mode
* retry audit
* validation result
* repair analytics warnings
* repair review analytics warnings
* blocking concerns

Safety guarantees:

* assessment-only behavior
* no patch generation
* no retry behavior changes
* no review verdict changes
* no repair outcome changes
* no patch policy changes
* no safety gate bypasses
* Safe Patch Engine remains the only mutation layer
* single-file mutation invariant remains unchanged

v2.8 deterministic checks:

* repair-trust-index-unit
* repair-trust-index-score-unit
* repair-trust-index-level-unit
* repair-trust-index-override-unit
* repair-trust-index-report-unit
* repair-trust-index-artifact-unit

---

## 🚦 Repair Release Gate Layer (v2.9)

v2.9 produces one final deterministic release recommendation after the repair lifecycle has completed. It answers:

* should this repaired result be allowed to proceed?
* should it proceed only with warnings?
* is human review required before release?
* must release be blocked?
* which signals affected the decision?
* what actions are recommended before release?

Artifacts written per run:

```text
.factory/runs/<runId>/repair-release-gate.json
.factory/runs/<runId>/repair-release-gate.md
```

Release decisions:

* allow
* allow-with-warnings
* require-human-review
* block

The release gate evaluates deterministic signals from:

* Repair Trust Index
* repair review verdict
* validation result
* repair outcome
* regression risk
* patch policy mode
* repair analytics warnings
* repair review analytics warnings
* trust blocking concerns

Safety guarantees:

* decision-only behavior
* no patch generation
* no retry behavior changes
* no trust score changes
* no review verdict changes
* no repair outcome changes
* no patch policy changes
* no safety gate bypasses
* Safe Patch Engine remains the only mutation layer
* single-file mutation invariant remains unchanged

v2.9 deterministic checks:

* repair-release-gate-unit
* repair-release-gate-score-unit
* repair-release-gate-decision-unit
* repair-release-gate-override-unit
* repair-release-gate-report-unit
* repair-release-gate-artifact-unit

---

## 🏛️ Autonomous Repair Governance Layer (v3.0)

v3.0 produces one final deterministic governance summary after the repair lifecycle has completed. It answers:

* is this repair governed as ready?
* is it ready only with caution?
* does it require human review?
* is it blocked?
* what evidence supports that governance status?

Artifacts written per run:

```text
.factory/runs/<runId>/repair-governance.json
.factory/runs/<runId>/repair-governance.md
```

Governance statuses:

* ready
* ready-with-caution
* manual-review-required
* blocked

The governance layer summarizes deterministic signals from:

* repair release gate
* Repair Trust Index
* repair review verdict
* repair outcome
* validation result
* evidence validation
* regression guard
* patch policy
* repair analytics warnings
* repair review analytics warnings
* retry audit

Safety guarantees:

* governance-only behavior
* no patch generation
* no retry behavior changes
* no release gate decision changes
* no trust score changes
* no review verdict changes
* no repair outcome changes
* no safety gate bypasses
* Safe Patch Engine remains the only mutation layer
* single-file mutation invariant remains unchanged

v3.0 deterministic checks:

* repair-governance-unit
* repair-governance-status-unit
* repair-governance-override-unit
* repair-governance-report-unit
* repair-governance-artifact-unit
* repair-governance-no-behavior-change-unit

---

## 🗂️ Governance Snapshot & Run Index Layer (v3.1)

v3.1 maintains a lightweight historical index of completed repair runs. It lets future CLI, dashboard, or reporting layers quickly inspect previous governance outcomes without parsing every `.factory/runs/<runId>` directory.

Index artifact:

```text
.factory/runs-index.json
```

Each run contributes one compact entry with:

* run ID
* timestamp
* repair outcome
* repair review verdict
* trust level and score
* release decision and score
* governance status
* validation result
* final decision flags
* relative paths to key artifacts

Safety guarantees:

* index-only behavior
* no patch generation
* no retry behavior changes
* no governance status changes
* no trust score changes
* no release gate decision changes
* no repair outcome changes
* no safety gate bypasses
* Safe Patch Engine remains the only mutation layer
* single-file mutation invariant remains unchanged

v3.1 deterministic checks:

* run-index-unit
* run-index-entry-unit
* run-index-update-unit
* run-index-replace-existing-unit
* run-index-artifact-unit
* run-index-report-unit

---

## 📟 Governance Dashboard CLI Layer (v3.2)

v3.2 adds a compact, deterministic CLI dashboard for completed repair runs. The command reads only `.factory/runs-index.json` and prints a stable operator-friendly view of historical governance status, trust, release, outcome, and validation results.

Command examples:

```bash
node dist/cli.js runs
node dist/cli.js runs --limit 10
node dist/cli.js runs --status blocked
node dist/cli.js runs --blocked
node dist/cli.js runs --human-review
node dist/cli.js runs --latest
node dist/cli.js runs --json
```

Supported filters:

* `--limit <n>` shows the latest `n` runs, defaulting to 20
* `--status <status>` filters by `ready`, `ready-with-caution`, `manual-review-required`, or `blocked`
* `--blocked` shows only blocked runs
* `--human-review` shows only runs requiring human review
* `--latest` shows only the newest indexed run
* `--json` prints machine-readable JSON for future tooling

Example output:

```text
# AI Software Factory — Run Governance Dashboard

Total indexed runs: 12
Displayed runs: 5

Summary:
- ready: 7
- ready-with-caution: 3
- manual-review-required: 1
- blocked: 1

Runs:
runId                status                 trust        release              outcome      validation
2026-05-10-abc123    ready                  high/94      allow                success      passed
```

Read-only guarantee:

* reads `.factory/runs-index.json`
* does not update `.factory/runs-index.json`
* does not generate patches
* does not retry repairs
* does not mutate source files
* does not change governance, release, trust, review, or repair outcomes
* does not bypass any safety gate

v3.2 deterministic checks:

* run-index-dashboard-unit
* run-index-dashboard-filter-unit
* run-index-dashboard-limit-unit
* run-index-dashboard-latest-unit
* run-index-dashboard-json-unit
* run-index-dashboard-render-unit
* run-index-dashboard-missing-index-unit
* run-index-dashboard-cli-unit

---

## 🧾 Governance Export Layer (v3.3)

v3.3 persists the run governance dashboard as deterministic export artifacts for CI summaries, governance reports, audit archives, and future dashboard ingestion.

Export commands:

```bash
node dist/cli.js runs --export
node dist/cli.js runs --export json
node dist/cli.js runs --export markdown
node dist/cli.js runs --export csv
node dist/cli.js runs --export all
```

Exports respect the same dashboard filters:

```bash
node dist/cli.js runs --status blocked --export markdown
node dist/cli.js runs --limit 10 --export csv
node dist/cli.js runs --human-review --export all
node dist/cli.js runs --status blocked --export json --json
```

Output files:

```text
.factory/exports/runs-dashboard.json
.factory/exports/runs-dashboard.md
.factory/exports/runs-dashboard.csv
```

Formats:

* JSON writes the full dashboard result with stable pretty JSON.
* Markdown writes a human-readable governance dashboard table.
* CSV writes stable headers and escaped values without external CSV dependencies.
* `all` writes JSON, Markdown, and CSV together.

Export-only guarantee:

* reads `.factory/runs-index.json`
* writes only under `.factory/exports`
* does not update `.factory/runs-index.json`
* does not generate patches
* does not retry repairs
* does not mutate source files
* does not change governance, release, trust, review, or repair outcomes
* does not bypass any safety gate

v3.3 deterministic checks:

* run-index-export-unit
* run-index-export-json-unit
* run-index-export-markdown-unit
* run-index-export-csv-unit
* run-index-export-all-unit
* run-index-export-filter-unit
* run-index-export-missing-index-unit
* run-index-export-cli-unit

---

## 🔎 Governance Insights Layer (v3.4)

v3.4 analyzes `.factory/runs-index.json` and produces deterministic operational insights about repair governance history. It answers whether recent repair runs look healthy, how often runs are ready or blocked, how often human review is required, whether validation success is low, and whether recent trust scores are degrading.

Commands:

```bash
node dist/cli.js insights
node dist/cli.js insights --json
node dist/cli.js insights --export
node dist/cli.js insights --json --export
```

Generated export files:

```text
.factory/exports/governance-insights.json
.factory/exports/governance-insights.md
```

Deterministic insight rules include:

* `NO_RUNS` when no indexed repair runs are available
* `HIGH_BLOCKED_RATE` when blocked rate is above 25%
* `HIGH_HUMAN_REVIEW_RATE` when human review rate is above 30%
* `LOW_VALIDATION_SUCCESS_RATE` when validation success is below 80% with at least 3 known validations
* `LOW_AVERAGE_TRUST` when average trust score is below 65
* `TRUST_TREND_DEGRADING` when recent trust is 15+ points below overall trust
* `HEALTHY_GOVERNANCE_RATE` when ready rate is at least 80% and blocked rate is at most 10%

Insights-only guarantee:

* reads `.factory/runs-index.json`
* optionally writes only `.factory/exports/governance-insights.json`
* optionally writes only `.factory/exports/governance-insights.md`
* does not update `.factory/runs-index.json`
* does not generate patches
* does not retry repairs
* does not mutate source files
* does not change governance, release, trust, review, or repair outcomes
* does not bypass any safety gate

v3.4 deterministic checks:

* governance-insights-unit
* governance-insights-rates-unit
* governance-insights-most-common-unit
* governance-insights-trend-unit
* governance-insights-rules-unit
* governance-insights-render-unit
* governance-insights-export-unit
* governance-insights-cli-unit
* governance-insights-missing-index-unit

---

## 🧭 Governance Policy Profile Layer (v3.5)

v3.5 introduces static operator policy profiles for interpreting governance history. Profiles are deterministic, hardcoded, and interpretation-only.

Available profiles:

| Profile | Operator mode | Risk tolerance | Purpose |
|---|---|---|---|
| conservative | Conservative governance | low | Warn earlier and expect stronger validation/trust signals |
| balanced | Balanced governance | medium | Default v3.4-compatible thresholds |
| experimental | Experimental governance | high | Relaxed interpretation for prototype or exploratory workflows |

Thresholds:

| Threshold | conservative | balanced | experimental |
|---|---:|---:|---:|
| high blocked rate | 15% | 25% | 40% |
| high human review rate | 20% | 30% | 50% |
| low validation success rate | 90% | 80% | 65% |
| low average trust score | 75 | 65 | 50 |
| degrading trust delta | 10 | 15 | 25 |
| healthy ready rate | 90% | 80% | 60% |
| healthy max blocked rate | 5% | 10% | 20% |

Commands:

```bash
node dist/cli.js insights --profile conservative
node dist/cli.js insights --profile balanced
node dist/cli.js insights --profile experimental
node dist/cli.js insights --profile conservative --json
node dist/cli.js insights --profile experimental --export
node dist/cli.js insights --profiles
node dist/cli.js insights --profiles --json
```

Default profile:

```text
balanced
```

Interpretation-only guarantee:

* profiles only change governance insights thresholds
* profiles do not update `.factory/runs-index.json`
* profiles do not generate patches
* profiles do not retry repairs
* profiles do not mutate source files
* profiles do not change repair outcomes, trust scores, release decisions, or governance statuses
* profiles do not bypass any safety gate

v3.5 deterministic checks:

* governance-policy-profile-unit
* governance-policy-profile-default-unit
* governance-policy-profile-invalid-unit
* governance-insights-profile-threshold-unit
* governance-insights-profile-render-unit
* governance-insights-profile-json-unit
* governance-insights-profile-export-unit
* governance-insights-profile-cli-unit
* governance-insights-profiles-list-cli-unit

---

## 🧪 Governance CI Summary Layer (v3.6)

v3.6 provides one compact CI/CD-oriented governance result over profile-aware governance insights.

Statuses:

| Status | Meaning | Exit code |
|---|---|---:|
| pass | Governance health is within acceptable thresholds | 0 |
| warn | Warnings or elevated operational risks were detected | 0 |
| fail | Acceptable operational risk thresholds were exceeded | 1 |

Commands:

```bash
node dist/cli.js ci-summary
node dist/cli.js ci-summary --profile conservative
node dist/cli.js ci-summary --profile experimental --json
node dist/cli.js ci-summary --export
node dist/cli.js ci-summary --profile balanced --json --export
```

Export files:

```text
.factory/exports/governance-ci-summary.json
.factory/exports/governance-ci-summary.md
```

CI summary rules:

* `fail` if any critical governance insight exists
* `fail` if blocked rate reaches the selected profile threshold
* `fail` if validation success is more than 15 points below the selected profile threshold
* `fail` if average trust is more than 15 points below the selected profile threshold
* `warn` if any warning insight exists
* `warn` if human-review rate reaches the selected profile threshold
* `warn` if trust trend is degrading
* `warn` if no runs index exists
* `pass` otherwise

Read-only CI guarantee:

* reads `.factory/runs-index.json`
* optionally writes only `.factory/exports/governance-ci-summary.json`
* optionally writes only `.factory/exports/governance-ci-summary.md`
* does not update `.factory/runs-index.json`
* does not generate patches
* does not retry repairs
* does not mutate source files
* does not change governance, release, trust, review, or repair outcomes
* does not bypass any safety gate

v3.6 deterministic checks:

* governance-ci-summary-unit
* governance-ci-summary-pass-unit
* governance-ci-summary-warn-unit
* governance-ci-summary-fail-unit
* governance-ci-summary-threshold-unit
* governance-ci-summary-render-unit
* governance-ci-summary-export-unit
* governance-ci-summary-cli-unit
* governance-ci-summary-exit-code-unit
* governance-ci-summary-missing-index-unit

---

## Governance CLI Help & UX Hardening Layer (v3.7)

v3.7 makes the governance CLI self-documenting and deterministic for operators.

Help commands:

```bash
node dist/cli.js --help
node dist/cli.js help
node dist/cli.js runs --help
node dist/cli.js insights --help
node dist/cli.js ci-summary --help
```

Governance command help now documents:

* usage
* supported flags
* examples
* read-only guarantees
* governance statuses
* policy profiles
* CI summary exit codes

Invalid command behavior:

```text
Unknown command: unknown

Run:
  node dist/cli.js --help

for available commands.
```

Invalid governance flag behavior:

```text
Invalid option for runs: --bad

Run:
  node dist/cli.js runs --help

for usage.
```

CI exit codes remain deterministic:

| CI status | Exit code |
|---|---:|
| pass | 0 |
| warn | 0 |
| fail | 1 |

Read-only UX guarantee:

* help commands do not create `.factory` artifacts
* governance help does not update `.factory/runs-index.json`
* invalid governance flags fail before dashboard, insights, or CI summary execution
* existing `run` command behavior is preserved
* no repair behavior, validation behavior, patch policy, or Safe Patch Engine behavior changes

v3.7 deterministic checks:

* cli-help-main-unit
* cli-help-runs-unit
* cli-help-insights-unit
* cli-help-ci-summary-unit
* cli-help-unknown-command-unit
* cli-help-invalid-runs-flag-unit
* cli-help-invalid-insights-flag-unit
* cli-help-invalid-ci-summary-flag-unit
* cli-help-readonly-guarantee-unit
* cli-help-existing-behavior-unit

---

## Governance Snapshot Archive Layer (v3.8)

v3.8 lets operators preserve deterministic governance export snapshots instead of only overwriting files under `.factory/exports`.

Archive commands:

```bash
node dist/cli.js runs --export all --archive
node dist/cli.js runs --status blocked --export markdown --archive
node dist/cli.js insights --export --archive
node dist/cli.js insights --profile conservative --export --archive
node dist/cli.js ci-summary --export --archive
node dist/cli.js ci-summary --profile balanced --json --export --archive
```

Archive layout:

```text
.factory/archive/<archiveId>/runs-dashboard/runs-dashboard.json
.factory/archive/<archiveId>/runs-dashboard/runs-dashboard.md
.factory/archive/<archiveId>/runs-dashboard/runs-dashboard.csv
.factory/archive/<archiveId>/governance-insights/governance-insights.json
.factory/archive/<archiveId>/governance-insights/governance-insights.md
.factory/archive/<archiveId>/governance-ci-summary/governance-ci-summary.json
.factory/archive/<archiveId>/governance-ci-summary/governance-ci-summary.md
```

Archive IDs use UTC and Windows-safe timestamps:

```text
YYYY-MM-DDTHH-mm-ss-SSSZ
```

Archive rules:

* `--archive` only works with `--export`
* using `--archive` without `--export` exits `1`
* existing export files are written first
* generated export files are copied into `.factory/archive/<archiveId>/<kind>/`
* JSON export output includes an `archive` result only when `--archive` is used
* CI summary exit-code behavior is preserved, including `fail -> 1`

Read-only/archive-only guarantee:

* archive writes only under `.factory/archive`
* archive does not update `.factory/runs-index.json`
* archive does not generate patches
* archive does not retry repairs
* archive does not mutate source files
* archive does not change governance, release, trust, review, insight, or CI summary decisions
* archive does not bypass any safety gate

v3.8 deterministic checks:

* governance-archive-id-unit
* governance-archive-copy-unit
* governance-archive-missing-file-unit
* governance-archive-runs-export-unit
* governance-archive-insights-export-unit
* governance-archive-ci-summary-export-unit
* governance-archive-json-output-unit
* governance-archive-requires-export-unit
* governance-archive-help-unit
* governance-archive-ci-exit-code-unit
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

### v1.9

* Evidence-Aware Patch Policy Layer
* Policy decision between evidence validation and Patch Intent Guard
* Allowed and blocked operation lists
* `manual-review` and `block-mutation` stop before Patch Intent Guard and Safe Patch Engine
* Policy observability in final reports and repair debug artifacts

### v2.0

* Repair Strategy Orchestration Layer
* Strategy decision before repair target selection
* Retry strategy controller
* Strategy and retry artifacts in run reports
* Manual-review and policy-denied retry blocking

### v2.1+

* Multi-agent system exploration
* Parallel task orchestration
* Project scaffolding

---

## 🧑‍💻 Author

Built by a solo developer exploring AI-driven software engineering.
