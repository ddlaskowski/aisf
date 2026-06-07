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

**v7.0 - Controlled Autonomy Readiness Layer**

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

v3.9 adds a deterministic Governance Archive Index Layer. It records compact metadata for archived governance snapshots in `.factory/archive-index.json` and adds a read-only `archive` CLI dashboard for browsing archive history.

v4.0 adds a deterministic Governance Archive Diff Layer. It compares existing archive snapshots to report governance improvements, regressions, stable metrics, and mixed changes without modifying repair behavior, archive history, or run indexes.

v4.1 adds deterministic Governance Trend Analysis across multiple archived governance-insights snapshots. It reports metric directions, volatility, trend health, and fixed insight codes without mutating archive history, run indexes, or repair behavior.

v4.2 adds deterministic Governance Drift Detection. It compares recent governance-insights snapshots against historical baseline windows to detect blocked-rate drift, trust degradation, validation-success drift, and baseline instability without mutating archive history, run indexes, or repair behavior.

v4.3 adds deterministic Governance Stability Scoring. It combines governance trend analysis and drift detection into one operational stability score without mutating archive history, run indexes, or repair behavior.

v4.4 adds deterministic Governance Escalation. It converts stability, drift, trend, volatility, and anomaly signals into an operator escalation status without sending notifications, calling external services, or changing repair behavior.

v4.5 adds deterministic Governance Policy Enforcement recommendations. It converts escalation, stability, drift, trend, and anomaly signals into policy mode recommendations without enforcing policies automatically or changing repair behavior.

v4.6 adds deterministic Governance Decision Matrix explainability. It traces trend, drift, stability, escalation, and policy rules into an ordered decision matrix without changing any governance decision or repair behavior.

v4.7 adds deterministic Governance Evidence Packs. It exports trend, drift, stability, escalation, policy, and decision-matrix artifacts into portable audit-ready bundles under `.factory/evidence-packs` without changing governance decisions, indexes, or repair behavior.

v4.8 adds a deterministic Governance Evidence Manifest Index. It registers generated evidence packs in `.factory/evidence-index.json` and adds a read-only `evidence-list` CLI for browsing evidence lineage without changing governance decisions, archive history, run indexes, or repair behavior.

v4.9 adds deterministic Governance Evidence Diff. It compares two registered evidence packs and reports policy, escalation, stability, drift, trend, operator approval, autonomous-operation, and decision-matrix rule changes without mutating evidence packs or indexes.

v5.0 adds a deterministic Governance Control Plane. It summarizes stability, escalation, policy, CI status, latest archive snapshot, and latest evidence-pack state in one read-only operator view without generating archives, generating evidence packs, or changing repair behavior.

v5.1 hardens the governance control-plane CLI surface. It standardizes help coverage, invalid-option behavior, missing-data behavior, read-only boundary checks, and consolidated governance CLI documentation without changing governance algorithms, policy recommendations, or repair behavior.

v5.2 adds deterministic Governance Config Preview. It reports current static policy profiles, thresholds, command write boundaries, governance data paths, and the reserved future config path without loading configuration from disk or changing runtime behavior.

v5.3 adds a deterministic Governance Config Schema Draft. It prints and optionally writes an example-only `.factory/governance.config.example.json` for future policy-as-code support without activating runtime configuration.

v5.4 adds deterministic Governance Config Validation. It validates `.factory/governance.config.json` structure and safety flags without loading, applying, creating, or enforcing runtime configuration.

v5.5 adds deterministic Governance Config Effective Preview. It shows static defaults, config validation status, and candidate overrides while keeping runtime config loading disabled and `applied: false`.

v5.6 adds deterministic Governance Config Activation Plans. It writes advisory activation-plan artifacts for future guarded loading while keeping runtime config loading disabled and `applied: false`.

v5.7 adds deterministic guarded Governance Config Load Preview. It validates, normalizes, and snapshots safe governance config override candidates for preview only without applying runtime behavior changes.

v5.8 adds deterministic Governance Config Snapshot Locks. It converts a valid load-preview snapshot into a reproducible audit lock with a stable fingerprint while keeping runtime behavior unchanged.

v5.9 adds deterministic Governance Config Audit Trails. It records snapshot-lock history, detects fingerprint drift, and identifies stable repeated config candidates without applying config or changing runtime behavior.

v6.0 adds deterministic Policy-as-Code Governance Runtime Preview. It projects a stable config audit candidate into a preview-only policy model while keeping policies inactive, unenforced, and unable to change runtime behavior.

v6.1 adds deterministic Governance Profile Inheritance Preview. It resolves built-in profile candidates over policy-runtime-preview outputs without applying profiles, enforcing policies, activating config, or changing runtime behavior.

v6.2 adds deterministic Repo Classification & Governance Boundaries Preview. It classifies local repository governance maturity and previews boundary/profile recommendations without enforcing boundaries or changing runtime behavior.

v6.3 adds deterministic Governance Attestation. It summarizes the governance preview chain, maturity, safety invariants, and blocked capabilities without cryptographic signing, governance enforcement, profile application, or runtime behavior changes.

v6.4 adds deterministic CI Governance Annotations Preview. It converts governance attestations into CI-friendly annotation artifacts without failing builds, enforcing governance, applying profiles, calling external CI systems, or changing runtime behavior.

v6.5 adds deterministic GitHub PR Governance Summary Preview. It converts CI governance annotations into PR-ready local markdown and JSON artifacts without calling GitHub APIs, creating PR comments, failing builds, or enforcing governance.

v6.6 adds deterministic Governance Exception Review Preview. It collects potential exception candidates from the preview chain and separates reviewable from non-reviewable candidates without approving exceptions, allowing bypasses, enforcing governance, or changing runtime behavior.

v6.7 adds deterministic Governance Simulation Mode Preview. It simulates future governance outcomes from the exception review chain without applying simulation results, enforcing governance, approving exceptions, or changing runtime behavior.

v6.8 adds deterministic Guarded Policy Activation Candidates Preview. It identifies future guarded policy activation candidates from the simulation chain without activating policies, enforcing governance, enabling guarded activation, or changing runtime behavior.

v6.9 adds deterministic Governance Runtime Activation Gates Preview. It models final pre-activation governance runtime gates without enabling runtime activation, activating policies, enforcing governance, or changing runtime behavior.

v7.0 adds deterministic Controlled Autonomy Readiness analysis. It evaluates whether the full governance preview platform is structurally ready for future controlled-autonomy design review while keeping autonomy disabled and preserving zero runtime impact.

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

## Governance Archive Index Layer (v3.9)

v3.9 maintains a compact index of governance archive snapshots so operators can inspect archive history without scanning `.factory/archive` folders.

Archive index artifact:

```text
.factory/archive-index.json
```

The archive index is updated only when an export command uses `--archive`:

```bash
node dist/cli.js runs --export all --archive
node dist/cli.js insights --export --archive
node dist/cli.js ci-summary --export --archive
```

Each index entry records:

* archive ID
* created timestamp
* archive kind
* archive directory
* archived files
* optional source command
* optional metadata such as profile, export format, CI status, run count, and displayed run count

Archive kinds:

* `runs-dashboard`
* `governance-insights`
* `governance-ci-summary`

Read-only archive dashboard:

```bash
node dist/cli.js archive
node dist/cli.js archive --latest
node dist/cli.js archive --kind governance-insights
node dist/cli.js archive --kind governance-ci-summary --limit 5
node dist/cli.js archive --json
```

Dashboard behavior:

* default output shows the latest 20 archive entries
* `--latest` shows exactly one newest entry after other filters
* `--kind <kind>` filters by archive kind
* `--limit <n>` shows the latest `n` entries
* `--json` prints deterministic machine-readable output

Read-only/index-only guarantee:

* export archive operations may update `.factory/archive-index.json`
* the `archive` listing command only reads `.factory/archive-index.json`
* the `archive` listing command does not update `.factory/archive-index.json`
* v3.9 does not update `.factory/runs-index.json`
* v3.9 does not generate patches
* v3.9 does not retry repairs
* v3.9 does not mutate source files
* v3.9 does not change governance, release, trust, review, insight, CI summary, or repair behavior
* v3.9 does not bypass any safety gate

v3.9 deterministic checks:

* governance-archive-index-unit
* governance-archive-index-update-unit
* governance-archive-index-replace-unit
* governance-archive-index-sort-unit
* governance-archive-index-artifact-unit
* governance-archive-dashboard-unit
* governance-archive-dashboard-filter-unit
* governance-archive-dashboard-latest-unit
* governance-archive-dashboard-json-unit
* governance-archive-cli-unit
* governance-archive-cli-missing-index-unit
* governance-archive-cli-invalid-kind-unit
* governance-archive-cli-help-unit
---

## Governance Archive Diff Layer (v4.0)

v4.0 compares existing governance archive snapshots and reports deterministic improvements, regressions, stability, and mixed changes.

Supported archive kinds:

* `governance-insights`
* `governance-ci-summary`

`runs-dashboard` snapshots are not diffed yet.

CLI usage:

```bash
node dist/cli.js archive diff <archiveIdA> <archiveIdB>
node dist/cli.js archive diff <archiveIdA> <archiveIdB> --json
```

Diff status meanings:

* `improved` means comparable metrics improved and none degraded
* `degraded` means comparable metrics degraded and none improved
* `mixed` means some metrics improved and others degraded
* `stable` means comparable metrics stayed within the deterministic stability threshold
* `unknown` means there were not enough comparable metrics

Governance insights diff compares:

* blocked rate
* human-review rate
* validation success rate
* average trust score
* ready rate

Deterministic insight rules include:

* blocked rate decreased -> `BLOCKED_RATE_IMPROVED`
* blocked rate increased -> `BLOCKED_RATE_DEGRADED`
* validation success increased -> `VALIDATION_SUCCESS_IMPROVED`
* average trust score decreased -> `TRUST_SCORE_DEGRADED`
* all comparable metrics stable -> `GOVERNANCE_STABLE`

Read-only guarantee:

* archive diff reads `.factory/archive-index.json`
* archive diff reads existing archived JSON snapshots
* archive diff does not update `.factory/archive-index.json`
* archive diff does not update `.factory/runs-index.json`
* archive diff does not generate patches
* archive diff does not retry repairs
* archive diff does not mutate source files
* archive diff does not change governance, release, trust, review, insight, CI summary, or repair behavior
* archive diff does not bypass any safety gate

v4.0 deterministic checks:

* governance-archive-diff-unit
* governance-archive-diff-improved-unit
* governance-archive-diff-degraded-unit
* governance-archive-diff-mixed-unit
* governance-archive-diff-stable-unit
* governance-archive-diff-unknown-unit
* governance-archive-diff-insights-unit
* governance-archive-diff-json-unit
* governance-archive-diff-cli-unit
* governance-archive-diff-invalid-kind-unit
* governance-archive-diff-missing-archive-unit
* governance-archive-diff-help-unit
---

## Governance Trend Analysis Layer (v4.1)

v4.1 analyzes governance archive history across multiple snapshots and reports deterministic operational trends.

Supported archive kind:

* `governance-insights`

CLI usage:

```bash
node dist/cli.js trends
node dist/cli.js trends --window 20
node dist/cli.js trends --kind governance-insights
node dist/cli.js trends --json
```

Trend analysis compares:

* blocked rate
* human-review rate
* validation success rate
* average trust score
* ready rate

Trend health meanings:

* `healthy` means improving or stable metrics dominate with no major degradation
* `warning` means some degradation or medium/high volatility was detected
* `critical` means blocked rate is worsening together with validation or trust degradation
* `unknown` means there is insufficient comparable archive history

Volatility:

* volatility is the average absolute delta between consecutive snapshots
* low volatility is below `5`
* medium volatility is `5` through `15`
* high volatility is above `15`
* volatility is reported as raw deterministic numeric values only

Deterministic insight rules include:

* blocked rate improving -> `BLOCKED_RATE_IMPROVING`
* blocked rate worsening -> `BLOCKED_RATE_WORSENING`
* trust score improving -> `TRUST_TREND_IMPROVING`
* trust score degrading -> `TRUST_TREND_DEGRADING`
* high volatility -> `HIGH_GOVERNANCE_VOLATILITY`
* all comparable metrics stable -> `GOVERNANCE_STABLE`
* missing archive history -> `NO_ARCHIVE_HISTORY`

Read-only guarantee:

* trend analysis reads `.factory/archive-index.json`
* trend analysis reads indexed archived `governance-insights.json` snapshots
* trend analysis does not update `.factory/archive-index.json`
* trend analysis does not update `.factory/runs-index.json`
* trend analysis does not generate patches
* trend analysis does not retry repairs
* trend analysis does not mutate source files

## Governance Drift Detection Layer (v4.2)

v4.2 detects whether governance behavior has moved away from historical baseline norms.

Supported archive kind:

* `governance-insights`

CLI usage:

```bash
node dist/cli.js drift
node dist/cli.js drift --baseline-window 30
node dist/cli.js drift --comparison-window 10
node dist/cli.js drift --json
```

Drift detection compares:

* blocked rate
* human-review rate
* validation success rate
* average trust score
* ready rate

Window model:

* baseline window defaults to `20` historical snapshots
* comparison window defaults to `5` recent snapshots
* at least `5` baseline snapshots and `2` comparison snapshots are required for drift scoring
* at most `100` indexed snapshots are analyzed

Severity meanings:

* `none` means governance metrics remain within historical baseline ranges
* `low` means minor governance drift was detected
* `medium` means moderate governance drift was detected
* `high` means significant governance drift was detected
* `critical` means critical governance drift was detected

Deterministic thresholds:

* below `5%` absolute percent delta is `none`
* `5%` through `15%` is `low`
* above `15%` through `30%` is `medium`
* above `30%` through `50%` is `high`
* above `50%` is `critical`

Bad drift signals:

* blocked rate increases
* human-review rate increases
* validation success rate decreases
* average trust score decreases
* ready rate decreases

Deterministic anomaly rules include:

* blocked rate drift -> `BLOCKED_RATE_DRIFT`
* trust score drift -> `TRUST_SCORE_DRIFT`
* validation success drift -> `VALIDATION_SUCCESS_DRIFT`
* stable baseline -> `GOVERNANCE_BASELINE_STABLE`
* insufficient history -> `INSUFFICIENT_DRIFT_HISTORY`
* missing archive history -> `NO_ARCHIVE_HISTORY`

Read-only guarantee:

* drift detection reads `.factory/archive-index.json`
* drift detection reads indexed archived `governance-insights.json` snapshots
* drift detection does not update `.factory/archive-index.json`
* drift detection does not update `.factory/runs-index.json`
* drift detection does not generate patches
* drift detection does not retry repairs
* drift detection does not mutate source files

## Governance Stability Scoring Layer (v4.3)

v4.3 computes one deterministic operational stability score from governance trend analysis and governance drift detection.

CLI usage:

```bash
node dist/cli.js stability
node dist/cli.js stability --window 20
node dist/cli.js stability --baseline-window 30
node dist/cli.js stability --comparison-window 10
node dist/cli.js stability --json
```

Score philosophy:

* the score starts at `100`
* deterministic deductions are applied for trend warnings, drift severity, high volatility, unhealthy metrics, and anomalies
* the score is clamped between `0` and `100`
* no predictive scoring, ML, forecasting, or dynamic threshold learning is used

Stability levels:

* `stable` means score is `85` through `100`
* `caution` means score is `70` through `84`
* `unstable` means score is `40` through `69`
* `critical` means score is below `40`

Deterministic deductions:

* trend health `critical` -> `-35`
* trend health `warning` -> `-20`
* trend health `unknown` -> `-10`
* drift severity `critical` -> `-35`
* drift severity `high` -> `-25`
* drift severity `medium` -> `-15`
* drift severity `low` -> `-5`
* governance, trust, or validation volatility above `15` -> `-10` each
* blocked rate above `25` -> `-15`
* validation success rate below `80` -> `-15`
* average trust score below `65` -> `-15`
* ready rate below `70` -> `-10`
* each critical anomaly -> `-10`
* each warning anomaly -> `-3`

Missing history behavior:

* missing archive history returns score `100`
* level is `stable`
* summary is `No governance history is available. Stability assumed.`
* anomaly code is `NO_ARCHIVE_HISTORY`

Read-only guarantee:

* stability scoring reads `.factory/archive-index.json`
* stability scoring reads indexed archived `governance-insights.json` snapshots
* stability scoring aggregates existing trend and drift analysis
* stability scoring does not update `.factory/archive-index.json`
* stability scoring does not update `.factory/runs-index.json`
* stability scoring does not generate patches
* stability scoring does not retry repairs
* stability scoring does not mutate source files

## Governance Escalation Layer (v4.4)

v4.4 converts governance stability, drift, trend, volatility, and anomaly signals into one deterministic operator escalation status.

CLI usage:

```bash
node dist/cli.js escalation
node dist/cli.js escalation --window 20
node dist/cli.js escalation --baseline-window 30
node dist/cli.js escalation --comparison-window 10
node dist/cli.js escalation --json
```

Escalation levels:

* `none` means no governance escalation is required
* `info` means informational signals exist only
* `warning` means operator review is recommended
* `high-risk` means operator attention is required
* `critical` means immediate operator intervention is recommended

Operator attention:

* `none` and `info` do not require operator attention
* `warning`, `high-risk`, and `critical` require operator attention

Deterministic escalation rules:

* stability level `stable` -> `none`
* stability level `caution` -> `warning`
* stability level `unstable` -> `high-risk`
* stability level `critical` -> `critical`
* stability score below `40` -> `critical`
* drift severity `critical` -> `critical`
* drift severity `high` -> at least `high-risk`
* trend health `critical` -> `critical`
* two or more critical anomalies -> `critical`
* one critical anomaly -> at least `high-risk`
* governance, trust, or validation volatility above `25` -> at least `warning`

Trigger examples:

* `STABILITY_CAUTION`
* `STABILITY_UNSTABLE`
* `STABILITY_CRITICAL`
* `HIGH_GOVERNANCE_DRIFT`
* `CRITICAL_GOVERNANCE_DRIFT`
* `TREND_HEALTH_WARNING`
* `TREND_HEALTH_CRITICAL`
* `HIGH_GOVERNANCE_VOLATILITY`
* `HIGH_TRUST_VOLATILITY`
* `HIGH_VALIDATION_VOLATILITY`
* `NO_ESCALATION`

Recommended actions are deterministic and depend only on the final escalation level.

Missing history behavior:

* escalation level is `none`
* operator attention is `false`
* trigger code is `NO_ESCALATION`
* summary is `No governance escalation is required.`

Read-only guarantee:

* escalation analysis reads `.factory/archive-index.json`
* escalation analysis reads indexed archived `governance-insights.json` snapshots
* escalation analysis aggregates existing trend, drift, and stability scoring output
* escalation analysis does not update `.factory/archive-index.json`
* escalation analysis does not update `.factory/runs-index.json`
* escalation analysis does not generate patches
* escalation analysis does not retry repairs
* escalation analysis does not mutate source files
* escalation analysis does not send alerts or notifications
* escalation analysis does not call webhooks or external services

## Governance Policy Enforcement Layer (v4.5)

v4.5 produces deterministic governance policy recommendations from escalation, stability, drift, trend, and anomaly signals.

This layer does not enforce policies automatically. It only reports the recommended operating mode for human operators, CI, and future enforcement adapters.

CLI usage:

```bash
node dist/cli.js policy
node dist/cli.js policy --window 20
node dist/cli.js policy --baseline-window 30
node dist/cli.js policy --comparison-window 10
node dist/cli.js policy --json
```

Policy modes:

* `normal` means normal autonomous governance operation is recommended
* `conservative` means conservative governance operation is recommended
* `restricted` means restricted governance operation is recommended
* `manual-review-only` means manual-review-only governance operation is recommended

Deterministic policy mapping:

* escalation `none` -> `normal`
* escalation `info` -> `normal`
* escalation `warning` -> `conservative`
* escalation `high-risk` -> `restricted`
* escalation `critical` -> `manual-review-only`

Hard overrides:

* stability score below `40` -> `manual-review-only`
* drift severity `critical` -> `manual-review-only`
* two or more critical anomalies -> `manual-review-only`
* stability level `unstable` -> at least `restricted`
* stability level `critical` -> `manual-review-only`
* trend health `critical` -> `manual-review-only`

Autonomous operation:

* `normal` and `conservative` allow autonomous operation
* `restricted` and `manual-review-only` do not allow autonomous operation

Operator approval:

* `normal` does not require operator approval
* `conservative`, `restricted`, and `manual-review-only` require operator approval

CI recommendation:

* `normal` -> CI mode `normal`
* `conservative` and `restricted` -> CI mode `strict`
* `manual-review-only` -> CI mode `restricted`

Missing history behavior:

* recommended policy mode is `normal`
* autonomous operation is allowed
* operator approval is not required
* CI recommendation is `normal`
* reason code is `GOVERNANCE_HEALTHY`

Read-only guarantee:

* policy recommendation reads `.factory/archive-index.json`
* policy recommendation reads indexed archived `governance-insights.json` snapshots
* policy recommendation aggregates existing trend, drift, stability, and escalation output
* policy recommendation does not update `.factory/archive-index.json`
* policy recommendation does not update `.factory/runs-index.json`
* policy recommendation does not generate patches
* policy recommendation does not retry repairs
* policy recommendation does not mutate source files
* policy recommendation does not enforce policies automatically
* policy recommendation does not block execution automatically
* policy recommendation does not downgrade repair modes automatically

## Governance Decision Matrix Layer (v4.6)

v4.6 explains why a governance policy recommendation was produced by rendering a deterministic decision matrix.

This layer does not change governance decisions. It only explains the deterministic reasoning path that was already produced by trend analysis, drift detection, stability scoring, escalation, and policy recommendation.

CLI usage:

```bash
node dist/cli.js decision-matrix
node dist/cli.js decision-matrix --window 20
node dist/cli.js decision-matrix --baseline-window 30
node dist/cli.js decision-matrix --comparison-window 10
node dist/cli.js decision-matrix --json
```

Decision matrix structure:

* final policy mode
* final escalation level
* final stability level
* operator approval requirement
* autonomous operation allowance
* ordered rule matrix
* deterministic explanations for each rule

Evaluation order:

1. `trend-analysis`
2. `drift-detection`
3. `stability-scoring`
4. `escalation`
5. `policy-enforcement`

Matrix entry fields:

* `stage`
* `ruleId`
* `inputSignal`
* `evaluation`
* `impact`
* `explanation`

Evaluation values:

* `matched`
* `not-matched`
* `upgraded`
* `downgraded`
* `informational`

Impact values:

* `none`
* `low`
* `medium`
* `high`
* `critical`

Example rule traces:

* `TREND_WARNING` explains that trend health warning contributed to instability scoring
* `HIGH_DRIFT` explains that high governance drift increased escalation severity
* `STABILITY_UNSTABLE` explains that unstable score contributed to restricted policy reasoning
* `ESCALATION_HIGH_RISK` explains that high-risk escalation triggered restricted policy recommendation
* `POLICY_RESTRICTED` explains that restricted governance mode requires operator approval

Missing history behavior:

* policy mode is `normal`
* escalation level is `none`
* stability level is `stable`
* operator approval is `false`
* autonomous operation is `true`
* matrix contains `NO_HISTORY`

Read-only guarantee:

* decision matrix analysis reads `.factory/archive-index.json`
* decision matrix analysis reads indexed archived `governance-insights.json` snapshots
* decision matrix analysis aggregates existing trend, drift, stability, escalation, and policy recommendation output
* decision matrix analysis does not update `.factory/archive-index.json`
* decision matrix analysis does not update `.factory/runs-index.json`
* decision matrix analysis does not generate patches
* decision matrix analysis does not retry repairs
* decision matrix analysis does not mutate source files
* decision matrix analysis does not change governance decisions
* decision matrix analysis does not change policy recommendations

## Governance Evidence Pack Layer (v4.7)

v4.7 exports deterministic governance evidence bundles for audit, compliance review, CI evidence, and operator handoff.

This layer does not change governance decisions. It packages the already-derived trend, drift, stability, escalation, policy, and decision-matrix outputs into a portable evidence directory.

CLI usage:

```bash
node dist/cli.js evidence-pack
node dist/cli.js evidence-pack --window 20
node dist/cli.js evidence-pack --baseline-window 30
node dist/cli.js evidence-pack --comparison-window 10
node dist/cli.js evidence-pack --json
```

Evidence pack structure:

```txt
.factory/evidence-packs/<evidencePackId>/
  manifest.json
  summary.md
  trends.md
  drift.md
  stability.md
  escalation.md
  policy.md
  decision-matrix.md
  trends.json
  drift.json
  stability.json
  escalation.json
  policy.json
  decision-matrix.json
```

Evidence pack ID format:

* UTC timestamp
* Windows-safe path format
* millisecond precision
* example: `2026-05-11T21-55-33-120Z`

Manifest behavior:

* `manifest.json` records the evidence pack ID
* `manifest.json` records generation time
* `manifest.json` records included artifacts
* `manifest.json` records governance summary signals
* artifact ordering is deterministic

Artifact ordering:

1. `summary.md`
2. `trends.md`
3. `drift.md`
4. `stability.md`
5. `escalation.md`
6. `policy.md`
7. `decision-matrix.md`
8. `trends.json`
9. `drift.json`
10. `stability.json`
11. `escalation.json`
12. `policy.json`
13. `decision-matrix.json`

Summary artifact:

* evidence pack ID
* generated timestamp
* recommended policy mode
* escalation level
* stability level
* stability score
* drift severity
* trend health
* included Markdown artifacts

JSON mode:

```bash
node dist/cli.js evidence-pack --json
```

prints:

* `evidencePackId`
* `outputDirectory`
* `manifestPath`
* `generatedFiles`

Missing history behavior:

* evidence pack is still generated
* healthy defaults are used by downstream governance layers
* decision matrix includes the deterministic `NO_HISTORY` informational rule

Export-only guarantee:

* evidence pack export writes only under `.factory/evidence-packs`
* evidence pack export does not update `.factory/archive-index.json`
* evidence pack export does not update `.factory/runs-index.json`
* evidence pack export does not generate patches
* evidence pack export does not retry repairs
* evidence pack export does not mutate source files
* evidence pack export does not change governance decisions
* evidence pack export does not change policy recommendations
* evidence pack export does not change orchestration behavior

## Governance Evidence Manifest Index Layer (v4.8)

v4.8 creates a deterministic registry for governance evidence packs.

When `node dist/cli.js evidence-pack` successfully generates a pack, the system updates:

```txt
.factory/evidence-index.json
```

This index lets operators browse evidence lineage without scanning evidence-pack directories.

Index entry fields:

* `evidencePackId`
* `generatedAt`
* `relativePath`
* `policyMode`
* `escalationLevel`
* `stabilityLevel`
* `stabilityScore`
* `driftSeverity`
* `trendHealth`
* `artifactCount`

Index rules:

* newest entries first
* duplicate evidence pack IDs are replaced deterministically
* serialized JSON is stable and pretty-printed
* evidence pack paths are project-relative
* artifact count equals generated evidence pack files

CLI usage:

```bash
node dist/cli.js evidence-list
node dist/cli.js evidence-list --latest
node dist/cli.js evidence-list --limit 20
node dist/cli.js evidence-list --policy restricted
node dist/cli.js evidence-list --escalation critical
node dist/cli.js evidence-list --json
```

Supported policy filters:

* `normal`
* `conservative`
* `restricted`
* `manual-review-only`

Supported escalation filters:

* `none`
* `info`
* `warning`
* `high-risk`
* `critical`

Missing index behavior:

* text mode reports that no governance evidence packs are registered
* JSON mode returns an empty deterministic index
* exit code remains `0`

Read-only registry guarantee:

* `evidence-list` reads `.factory/evidence-index.json`
* `evidence-list` does not scan evidence-pack directories
* `evidence-list` does not update `.factory/evidence-index.json`
* `evidence-list` does not update `.factory/archive-index.json`
* `evidence-list` does not update `.factory/runs-index.json`
* `evidence-list` does not generate patches
* `evidence-list` does not retry repairs
* `evidence-list` does not mutate source files
* `evidence-list` does not change governance decisions
* `evidence-list` does not change orchestration behavior

## Governance Evidence Diff Layer (v4.9)

v4.9 compares two registered governance evidence packs and reports how governance evidence changed.

This layer is read-only. It resolves packs through `.factory/evidence-index.json`, loads known JSON artifacts from the registered evidence pack paths, and never updates evidence packs or indexes.

CLI usage:

```bash
node dist/cli.js evidence-diff <A> <B>
node dist/cli.js evidence-diff <A> <B> --json
```

Compared fields:

* `policyMode`
* `escalationLevel`
* `stabilityLevel`
* `stabilityScore`
* `driftSeverity`
* `trendHealth`
* `operatorApprovalRequired`
* `autonomousOperationAllowed`

Decision matrix diffing:

* compares decision matrix rule IDs
* reports added rules
* reports removed rules
* reports unchanged rules
* sorts rule arrays alphabetically

Diff statuses:

* `improved` means comparable signals improved and none degraded
* `degraded` means comparable signals degraded and none improved
* `mixed` means both improvements and degradations were detected
* `stable` means comparable fields did not meaningfully change
* `unknown` means insufficient comparable evidence was available

Missing artifact behavior:

* missing artifacts are reported as deterministic warning insights
* comparison continues where possible
* evidence index is not modified

Read-only guarantee:

* evidence diff reads `.factory/evidence-index.json`
* evidence diff reads registered evidence pack artifacts
* evidence diff does not update `.factory/evidence-index.json`
* evidence diff does not update `.factory/archive-index.json`
* evidence diff does not update `.factory/runs-index.json`
* evidence diff does not generate patches
* evidence diff does not retry repairs
* evidence diff does not mutate source files
* evidence diff does not change governance decisions
* evidence diff does not change policy recommendations
* evidence diff does not change orchestration behavior

## Governance Control Plane Layer (v5.0)

v5.0 adds one high-level read-only governance entry point for operators.

CLI usage:

```bash
node dist/cli.js governance
node dist/cli.js governance --window 20
node dist/cli.js governance --json
```

The control plane summarizes:

* current stability score and stability level
* current escalation level and operator-attention state
* recommended policy mode and autonomous-operation allowance
* CI governance status
* latest archive snapshot from `.factory/archive-index.json`
* latest evidence pack from `.factory/evidence-index.json`
* deterministic warnings and recommended next commands

Control-plane statuses:

* `healthy` means governance is stable, escalation is none, policy is normal, and CI status is pass
* `watch` means governance has caution, warning, conservative policy, or CI warn signals
* `attention-required` means governance has high-risk escalation, restricted policy, operator approval, or unstable stability signals
* `critical` means escalation is critical, policy is manual-review-only, or CI status is fail
* `unknown` means required governance context is incomplete

Recommended next commands:

* healthy: `node dist/cli.js runs`, `node dist/cli.js insights`
* watch: `node dist/cli.js stability`, `node dist/cli.js escalation`, `node dist/cli.js policy`
* attention-required: `node dist/cli.js drift`, `node dist/cli.js decision-matrix`, `node dist/cli.js evidence-pack`
* critical: `node dist/cli.js escalation`, `node dist/cli.js policy`, `node dist/cli.js decision-matrix`, `node dist/cli.js evidence-pack`
* unknown: `node dist/cli.js runs`, `node dist/cli.js archive`, `node dist/cli.js evidence-list`

Missing data behavior:

* missing `.factory/archive-index.json` adds `No governance archive index found.`
* missing `.factory/evidence-index.json` adds `No governance evidence index found.`
* missing archive or evidence indexes produce `status: unknown`
* the command exits `0` and does not crash

Read-only guarantee:

* governance control plane reads governance history and run-index data
* governance control plane does not generate archive snapshots
* governance control plane does not generate evidence packs
* governance control plane does not update `.factory/archive-index.json`
* governance control plane does not update `.factory/evidence-index.json`
* governance control plane does not update `.factory/runs-index.json`
* governance control plane does not generate patches
* governance control plane does not retry repairs
* governance control plane does not mutate source files
* governance control plane does not change governance decisions
* governance control plane does not change policy recommendations
* governance control plane does not change orchestration behavior

v5.0 deterministic checks:

* governance-control-plane-unit
* governance-control-plane-status-unit
* governance-control-plane-summary-unit
* governance-control-plane-recommendation-unit
* governance-control-plane-warning-unit
* governance-control-plane-latest-archive-unit
* governance-control-plane-latest-evidence-unit
* governance-control-plane-json-unit
* governance-control-plane-cli-unit
* governance-control-plane-missing-data-unit
* governance-control-plane-help-unit

## Governance Control Plane Hardening Layer (v5.1)

v5.1 consolidates the governance CLI surface after the v5.0 control-plane milestone.

Governance CLI command table:

| Command | Purpose | Reads | Writes |
|---|---|---|---|
| `runs` | Show historical governance run dashboard | `.factory/runs-index.json` | none unless `--export` is used |
| `archive` | Browse governance archive snapshot history | `.factory/archive-index.json` | none |
| `archive diff <A> <B>` | Compare archive snapshots | `.factory/archive-index.json`, registered archive files | none |
| `insights` | Show governance insights over indexed runs | `.factory/runs-index.json` | none unless `--export` is used |
| `ci-summary` | Show CI-friendly governance summary | `.factory/runs-index.json` | none unless `--export` is used |
| `trends` | Analyze governance trends over archive history | `.factory/archive-index.json`, registered archive files | none |
| `drift` | Detect governance drift against baselines | `.factory/archive-index.json`, registered archive files | none |
| `stability` | Compute governance stability score | `.factory/archive-index.json`, registered archive files | none |
| `escalation` | Compute governance escalation status | `.factory/archive-index.json`, registered archive files | none |
| `policy` | Recommend governance policy mode | `.factory/archive-index.json`, registered archive files | none |
| `decision-matrix` | Explain governance decision reasoning | `.factory/archive-index.json`, registered archive files | none |
| `evidence-pack` | Export governance evidence pack | `.factory/archive-index.json`, registered archive files | `.factory/evidence-packs`, `.factory/evidence-index.json` |
| `evidence-list` | Browse governance evidence registry | `.factory/evidence-index.json` | none |
| `evidence-diff <A> <B>` | Compare governance evidence packs | `.factory/evidence-index.json`, registered evidence files | none |
| `governance` | Show unified governance control-plane summary | `.factory/runs-index.json`, `.factory/archive-index.json`, `.factory/evidence-index.json` | none |

Read-only boundaries:

* read-only governance commands do not update `.factory/runs-index.json`
* read-only governance commands do not update `.factory/archive-index.json`
* read-only governance commands do not update `.factory/evidence-index.json`
* export commands may write deterministic files under `.factory/exports`
* `--archive` export flows may write snapshots under `.factory/archive` and update `.factory/archive-index.json`
* `evidence-pack` writes deterministic evidence bundles under `.factory/evidence-packs` and updates `.factory/evidence-index.json`
* no governance CLI command changes repair behavior, patch policy, validation behavior, or orchestration behavior

Missing-data behavior:

* missing `.factory/runs-index.json` is handled by empty dashboard, `NO_RUNS`, or CI `warn` output depending on command
* missing `.factory/archive-index.json` is handled without crashing by archive, trend, drift, stability, escalation, policy, decision-matrix, and governance commands
* missing `.factory/evidence-index.json` is handled as an empty registry by `evidence-list`
* missing `.factory/evidence-index.json` is a deterministic error for `evidence-diff`
* missing archive or evidence indexes make `governance` report `status: unknown`

CLI UX guarantees:

* every governance command supports `--help`
* unsupported governance flags use deterministic `Invalid option for <command>: <flag>` errors
* help output uses stable formatting and no dynamic terminal width
* CI summary exit codes remain `pass -> 0`, `warn -> 0`, and `fail -> 1`

v5.1 deterministic checks:

* governance-control-plane-hardening-unit
* governance-cli-smoke-all-unit
* governance-cli-help-consistency-unit
* governance-cli-invalid-option-consistency-unit
* governance-cli-missing-data-consistency-unit
* governance-cli-readonly-boundary-unit
* governance-cli-readme-docs-unit

## Governance Config Preview Layer (v5.2)

v5.2 adds a read-only preview of the current static governance configuration surface.

CLI usage:

```bash
node dist/cli.js governance config
node dist/cli.js governance config --json
node dist/cli.js governance config --help
```

The config preview reports:

* available governance policy profiles: `conservative`, `balanced`, `experimental`
* default policy profile: `balanced`
* deterministic policy threshold values
* read-only governance commands
* commands that write exports
* commands that update governance indexes
* current governance data paths
* reserved future config path: `.factory/governance.config.json`

Command boundary categories:

* read-only commands include `runs`, `archive`, `archive diff`, `insights`, `ci-summary`, `trends`, `drift`, `stability`, `escalation`, `policy`, `decision-matrix`, `evidence-list`, `evidence-diff`, `governance`, and `governance config`
* export-writing commands include `runs --export`, `insights --export`, `ci-summary --export`, and `evidence-pack`
* index-updating commands include `runs --export --archive`, `insights --export --archive`, `ci-summary --export --archive`, and `evidence-pack`

Governance data paths:

* runs index: `.factory/runs-index.json`
* archive index: `.factory/archive-index.json`
* evidence index: `.factory/evidence-index.json`
* exports directory: `.factory/exports`
* archive directory: `.factory/archive`
* evidence packs directory: `.factory/evidence-packs`
* future config path: `.factory/governance.config.json`

Read-only guarantee:

* v5.2 does not load configuration from disk
* v5.2 does not create `.factory/governance.config.json`
* v5.2 does not mutate `.factory/runs-index.json`
* v5.2 does not mutate `.factory/archive-index.json`
* v5.2 does not mutate `.factory/evidence-index.json`
* v5.2 does not change policy thresholds
* v5.2 does not change governance calculations
* v5.2 does not change repair behavior or orchestration behavior

v5.2 deterministic checks:

* governance-config-preview-unit
* governance-config-preview-profiles-unit
* governance-config-preview-command-boundaries-unit
* governance-config-preview-paths-unit
* governance-config-preview-json-unit
* governance-config-preview-cli-unit
* governance-config-preview-help-unit
* governance-config-preview-readonly-unit
* governance-config-preview-no-runtime-config-unit

## Governance Config Schema Draft Layer (v5.3)

v5.3 introduces a deterministic example-only governance config draft for future policy-as-code support.

CLI usage:

```bash
node dist/cli.js governance config example
node dist/cli.js governance config example --json
node dist/cli.js governance config example --write
node dist/cli.js governance config example --json --write
node dist/cli.js governance config example --help
```

Generated example file:

```text
.factory/governance.config.example.json
```

Important distinction:

* `.factory/governance.config.example.json` is an example-only draft that can be generated in v5.3
* `.factory/governance.config.json` is reserved for future active runtime configuration
* v5.3 does not create `.factory/governance.config.json`
* v5.3 does not load `.factory/governance.config.json`
* v5.3 does not enforce config values

The example config contains:

* `version: 1`
* `configStatus: example-only`
* `defaultPolicyProfile: balanced`
* static policy profile thresholds for `conservative`, `balanced`, and `experimental`
* command policy boundaries matching v5.2
* future runtime options with all active behavior disabled
* notes explaining that runtime config is not active yet

Write behavior:

* `--write` creates `.factory` if missing
* `--write` writes only `.factory/governance.config.example.json`
* `--write` overwrites the example file deterministically
* `--json --write` prints deterministic write-result JSON
* no governance indexes are modified

Read-only/runtime guarantee:

* v5.3 does not introduce active config loading
* v5.3 does not change policy thresholds
* v5.3 does not change governance calculations
* v5.3 does not change repair behavior
* v5.3 does not mutate `.factory/runs-index.json`
* v5.3 does not mutate `.factory/archive-index.json`
* v5.3 does not mutate `.factory/evidence-index.json`

v5.3 deterministic checks:

* governance-config-example-unit
* governance-config-example-thresholds-unit
* governance-config-example-command-boundaries-unit
* governance-config-example-json-unit
* governance-config-example-cli-unit
* governance-config-example-write-unit
* governance-config-example-help-unit
* governance-config-example-no-runtime-load-unit
* governance-config-example-no-active-config-write-unit
* governance-config-example-readonly-indexes-unit

## Governance Config Validation Layer (v5.4)

v5.4 adds validation-only checks for the future active governance config file.

CLI usage:

```bash
node dist/cli.js governance config validate
node dist/cli.js governance config validate --json
node dist/cli.js governance config validate --help
```

Validated path:

```text
.factory/governance.config.json
```

Validation statuses:

* `missing` means `.factory/governance.config.json` was not found
* `valid` means the config shape is valid but not applied
* `invalid` means malformed JSON or invalid structure was detected

Exit codes:

* `missing`: 0
* `valid`: 0
* `invalid`: 1

Validation rules:

* `version` must be `1`
* `configStatus` must be `example-only` or `draft`
* `defaultPolicyProfile` must be `conservative`, `balanced`, or `experimental`
* `policyProfiles` must include `conservative`, `balanced`, and `experimental`
* threshold values must be finite numbers
* command policy boundaries must be arrays
* future runtime options must be booleans
* future runtime options must all remain `false` in v5.4

Validation-only guarantee:

* v5.4 does not load `.factory/governance.config.json` into runtime behavior
* v5.4 does not apply config values
* v5.4 does not change policy thresholds
* v5.4 does not create or overwrite `.factory/governance.config.json`
* v5.4 does not mutate `.factory/runs-index.json`
* v5.4 does not mutate `.factory/archive-index.json`
* v5.4 does not mutate `.factory/evidence-index.json`
* validation results always include `applied: false`

v5.4 deterministic checks:

* governance-config-validation-unit
* governance-config-validation-missing-unit
* governance-config-validation-valid-unit
* governance-config-validation-malformed-json-unit
* governance-config-validation-required-fields-unit
* governance-config-validation-threshold-unit
* governance-config-validation-runtime-options-unit
* governance-config-validation-json-unit
* governance-config-validation-cli-unit
* governance-config-validation-help-unit
* governance-config-validation-no-apply-unit

## Governance Config Effective Preview Layer (v5.5)

v5.5 adds a dry-run preview of the effective governance config surface.

CLI usage:

```bash
node dist/cli.js governance config effective
node dist/cli.js governance config effective --json
node dist/cli.js governance config effective --help
```

The effective preview answers:

* whether `.factory/governance.config.json` is `missing`, `valid`, or `invalid`
* which static defaults are currently active
* whether a valid config file contains candidate overrides
* which values would be overridden in a future runtime-config version
* whether runtime config loading is enabled
* whether any config values were applied

Effective source behavior:

* missing config uses `static-defaults-config-missing`
* valid config uses `static-defaults-with-valid-config-present`
* invalid config uses `static-defaults-with-invalid-config-present`
* static governance defaults remain the active source of truth in every case

Candidate overrides:

* `defaultPolicyProfile`
* `policyProfiles.conservative.thresholds.*`
* `policyProfiles.balanced.thresholds.*`
* `policyProfiles.experimental.thresholds.*`
* `futureRuntimeOptions.*`

Guarantees:

* `applied` is always `false`
* `runtimeConfigLoadingEnabled` is always `false`
* invalid config exits `0` for effective preview because static defaults still apply
* `governance config validate` still exits `1` for invalid config
* v5.5 does not load, apply, create, or overwrite `.factory/governance.config.json`
* v5.5 does not mutate `.factory/runs-index.json`, `.factory/archive-index.json`, or `.factory/evidence-index.json`
* v5.5 does not change governance thresholds, calculations, policy behavior, or repair behavior

Difference from validation:

* `governance config validate` answers whether the config file is structurally valid
* `governance config effective` answers what would be different if future config loading existed
* neither command applies runtime configuration in v5.5

v5.5 deterministic checks:

* governance-config-effective-preview-unit
* governance-config-effective-preview-missing-unit
* governance-config-effective-preview-valid-unit
* governance-config-effective-preview-invalid-unit
* governance-config-effective-preview-overrides-unit
* governance-config-effective-preview-json-unit
* governance-config-effective-preview-cli-unit
* governance-config-effective-preview-help-unit
* governance-config-effective-preview-no-apply-unit
* governance-config-effective-preview-validate-exit-code-unit

## Governance Config Activation Plan Layer (v5.6)

v5.6 adds an advisory-only activation plan for future guarded governance config loading.

CLI usage:

```bash
node dist/cli.js governance config activation-plan
node dist/cli.js governance config activation-plan --json
```

Generated artifacts:

```text
.factory/governance/config-activation-plan.json
.factory/governance/config-activation-plan.md
```

Activation readiness rules:

* missing config produces `not-ready`
* invalid config produces `blocked`
* valid config with only allowlisted governance override keys produces `ready-for-guarded-loading`
* valid config with unsafe runtime, plugin, command, dynamic code, mutation, safety-bypass, or repair-pipeline fields produces `blocked`

Safety invariants:

* `runtimeConfigLoadingEnabled` is always `false`
* `applied` is always `false`
* config values are not loaded into runtime behavior
* config values are not applied to governance thresholds
* repair orchestration and governance decisions are unchanged
* no external dependencies, plugins, network behavior, or runtime execution are introduced

v5.6 deterministic checks:

* governance-config-activation-plan-unit
* governance-config-activation-plan-missing
* governance-config-activation-plan-valid
* governance-config-activation-plan-invalid
* governance-config-activation-plan-blocked-unsafe
* governance-config-activation-plan-json-output

## Guarded Governance Config Loading Layer (v5.7)

v5.7 introduces a deterministic load-preview boundary for governance config.

CLI usage:

```bash
node dist/cli.js governance config load-preview
node dist/cli.js governance config load-preview --json
```

Generated artifacts:

```text
.factory/governance/config-load-preview.json
.factory/governance/config-load-preview.md
```

The load preview:

* reads `.factory/governance.config.json` when present
* validates the config using existing validation logic
* rejects unsafe or unknown config fields
* normalizes safe override keys into a deterministic loaded snapshot
* uses `normalizedAt: deterministic-preview`
* writes deterministic preview artifacts

Example JSON fields:

* `configStatus`
* `loadStatus`
* `applied`
* `runtimeBehaviorChanged`
* `governanceDecisionsChanged`
* `repairOrchestrationChanged`
* `loadedSnapshot.safeOverrideKeys`
* `loadedSnapshot.blockedKeys`
* `recommendedNextStage`

Safety guarantees:

* `applied` is always `false`
* `runtimeBehaviorChanged` is always `false`
* `governanceDecisionsChanged` is always `false`
* `repairOrchestrationChanged` is always `false`
* governance thresholds are not changed
* governance decisions are not changed
* repair orchestration is not changed
* scripts, plugins, dynamic code, network behavior, unsafe runtime fields, mutation-scope expansion, and safety-gate bypass fields remain blocked

v5.7 is load-preview only. It is not runtime activation.

v5.7 deterministic checks:

* governance-config-load-preview-unit
* governance-config-load-preview-missing
* governance-config-load-preview-valid
* governance-config-load-preview-invalid
* governance-config-load-preview-blocked-unsafe
* governance-config-load-preview-json-output
* governance-config-load-preview-artifact

## Governance Config Snapshot Lock Layer (v5.8)

v5.8 creates a deterministic snapshot lock from a successful governance config load preview.

CLI usage:

```bash
node dist/cli.js governance config snapshot-lock
node dist/cli.js governance config snapshot-lock --json
```

Generated artifacts:

```text
.factory/governance/config-snapshot-lock.json
.factory/governance/config-snapshot-lock.md
```

The snapshot lock:

* reuses the existing load-preview logic
* creates a lock only when `loadStatus` is `loaded-for-preview`
* does not create a lock for missing, invalid, or unsafe config
* uses `lockedAt: deterministic-lock`
* computes a deterministic fingerprint from normalized snapshot values, safe override keys, blocked keys, and schema version
* derives `deterministicId` from the fingerprint

Example JSON fields:

* `lockStatus`
* `sourcePreviewStatus`
* `sourceLoadStatus`
* `lock.fingerprint`
* `lock.deterministicId`
* `lock.safeOverrideKeys`
* `lock.blockedKeys`
* `lock.valueCount`
* `recommendedNextStage`

Safety guarantees:

* `applied` is always `false`
* `runtimeBehaviorChanged` is always `false`
* `governanceDecisionsChanged` is always `false`
* `repairOrchestrationChanged` is always `false`
* governance thresholds are not changed
* governance decisions are not changed
* repair orchestration is not changed
* snapshot locks are audit/preview preparation only, not runtime activation

v5.8 deterministic checks:

* governance-config-snapshot-lock-unit
* governance-config-snapshot-lock-missing
* governance-config-snapshot-lock-valid
* governance-config-snapshot-lock-invalid
* governance-config-snapshot-lock-blocked-unsafe
* governance-config-snapshot-lock-json-output
* governance-config-snapshot-lock-artifact
* governance-config-snapshot-lock-fingerprint-stable

## Governance Config Audit Trail Layer (v5.9)

v5.9 records deterministic governance config snapshot-lock history.

CLI usage:

```bash
node dist/cli.js governance config audit-trail
node dist/cli.js governance config audit-trail --json
```

Generated artifacts:

```text
.factory/governance/config-audit-trail.json
.factory/governance/config-audit-trail.md
```

The audit trail:

* reuses the existing snapshot-lock logic
* records entries only when a snapshot lock is created
* compares the current fingerprint with the previous recorded fingerprint
* reports whether fingerprint drift was detected
* reports whether the config candidate is stable across repeated previews
* avoids duplicate noisy entries when the latest snapshot lock is already recorded
* uses deterministic `recordedAt` values such as `deterministic-audit-sequence-1`

Example JSON fields:

* `auditStatus`
* `sourceLockStatus`
* `currentFingerprint`
* `previousFingerprint`
* `fingerprintChanged`
* `driftDetected`
* `stableCandidate`
* `trailSummary.totalEntries`
* `trailSummary.uniqueFingerprints`
* `trailSummary.repeatedLatestFingerprintCount`
* `recommendedNextStage`

Safety guarantees:

* `applied` is always `false`
* `runtimeBehaviorChanged` is always `false`
* `governanceDecisionsChanged` is always `false`
* `repairOrchestrationChanged` is always `false`
* governance thresholds are not changed
* governance decisions are not changed
* repair orchestration is not changed
* audit trails record config snapshot-lock history only
* audit trails are preview/audit preparation only, not runtime activation

v5.9 deterministic checks:

* governance-config-audit-trail-unit
* governance-config-audit-trail-missing
* governance-config-audit-trail-valid-first-entry
* governance-config-audit-trail-valid-stable-repeat
* governance-config-audit-trail-drift-detected
* governance-config-audit-trail-invalid
* governance-config-audit-trail-blocked-unsafe
* governance-config-audit-trail-json-output
* governance-config-audit-trail-artifact
* governance-config-audit-trail-no-duplicate-latest

## Policy-as-Code Governance Runtime Preview (v6.0)

v6.0 creates a deterministic preview-only Policy-as-Code runtime model from a stable governance config audit candidate.

CLI usage:

```bash
node dist/cli.js governance policy runtime-preview
node dist/cli.js governance policy runtime-preview --json
```

Generated artifacts:

```text
.factory/governance/policy-runtime-preview.json
.factory/governance/policy-runtime-preview.md
```

The runtime preview:

* reuses the governance config audit-trail stability signal
* creates a policy model only when the latest config candidate is stable
* separates preview-only policies, blocked policies, and unsupported policies
* keeps all projected policies inactive and unenforced
* does not parse policy expressions or execute policy code

Example human output fields:

```text
Preview status:
created

Policy runtime mode:
preview-only

Applied:
false

Enforced:
false
```

Example JSON fields:

* `previewStatus`
* `sourceAuditStatus`
* `policyRuntimeMode`
* `configCandidate.stableCandidate`
* `configCandidate.fingerprint`
* `policyModel.policies`
* `blockedPolicies`
* `unsupportedPolicies`
* `recommendedNextStage`

Safety guarantees:

* `applied` is always `false`
* `enforced` is always `false`
* `policyRuntimeMode` is always `preview-only`
* `runtimeBehaviorChanged` is always `false`
* `governanceDecisionsChanged` is always `false`
* `repairOrchestrationChanged` is always `false`
* no runtime config is activated
* no policy is enforced
* governance thresholds are not changed
* governance decisions are not changed
* Safe Patch Engine behavior is not changed

v6.0 deterministic checks:

* governance-policy-runtime-preview-unit
* governance-policy-runtime-preview-missing
* governance-policy-runtime-preview-not-stable
* governance-policy-runtime-preview-stable-valid
* governance-policy-runtime-preview-invalid
* governance-policy-runtime-preview-blocked-unsafe
* governance-policy-runtime-preview-json-output
* governance-policy-runtime-preview-artifact
* governance-policy-runtime-preview-no-enforcement

## Governance Profile Inheritance Preview (v6.1)

v6.1 resolves deterministic built-in governance profile candidates over preview-only policy runtime candidates.

CLI usage:

```bash
node dist/cli.js governance profile inheritance-preview
node dist/cli.js governance profile inheritance-preview --json
```

Generated artifacts:

```text
.factory/governance/profile-inheritance-preview.json
.factory/governance/profile-inheritance-preview.md
```

The profile inheritance preview:

* requires a created, preview-only policy runtime preview
* defines built-in `default`, `strict`, `enterprise`, and `experimental-preview` profiles
* resolves inheritance chains deterministically
* reports inherited policy keys and preview-only candidate overrides
* reports conflicts using `last-profile-wins-preview-only`
* blocks unsafe profile options such as autonomous actions
* does not apply profiles or enforce policies

Example human output fields:

```text
Preview status:
created

Profile applied:
false

Policy runtime mode:
preview-only
```

Example JSON fields:

* `previewStatus`
* `sourcePolicyRuntimePreviewStatus`
* `profiles`
* `resolvedProfiles`
* `blockedProfileOptions`
* `warnings`
* `recommendedNextStage`

Safety guarantees:

* `profileApplied` is always `false`
* `applied` is always `false`
* `enforced` is always `false`
* `policyRuntimeMode` is always `preview-only`
* `runtimeBehaviorChanged` is always `false`
* `governanceDecisionsChanged` is always `false`
* `repairOrchestrationChanged` is always `false`
* no runtime profile switching is introduced
* no config is activated
* no policy is enforced

v6.1 deterministic checks:

* governance-profile-inheritance-preview-unit
* governance-profile-inheritance-preview-missing
* governance-profile-inheritance-preview-created
* governance-profile-inheritance-preview-blocked-source
* governance-profile-inheritance-preview-conflicts
* governance-profile-inheritance-preview-blocks-unsafe-options
* governance-profile-inheritance-preview-json-output
* governance-profile-inheritance-preview-artifact
* governance-profile-inheritance-preview-no-application

## Repo Classification & Governance Boundaries Preview (v6.2)

v6.2 classifies repositories with deterministic local signals and previews governance boundary recommendations.

CLI usage:

```bash
node dist/cli.js governance repo classification-preview
node dist/cli.js governance repo classification-preview --json
```

Generated artifacts:

```text
.factory/governance/repo-classification-preview.json
.factory/governance/repo-classification-preview.md
```

The repo classification preview:

* reuses governance profile inheritance preview logic
* inspects only local deterministic repository signals
* classifies repositories into categories such as `local-development`, `single-repo`, `multi-service`, `enterprise`, `high-governance`, `experimental`, or `unknown`
* previews allowed governance profiles and a recommended profile
* previews relevant policy categories
* blocks unsafe boundary capabilities such as runtime enforcement, autonomy, Safe Patch Engine bypass, mutation scope expansion, plugin execution, dynamic policy execution, external execution, and uncontrolled orchestration
* does not enforce governance boundaries

Example human output fields:

```text
Preview status:
created

Classification applied:
false

Boundaries enforced:
false

Safe Patch Engine only:
true
```

Example JSON fields:

* `previewStatus`
* `sourceProfilePreviewStatus`
* `repositoryClassification.category`
* `repositoryClassification.confidence`
* `repositoryClassification.signals`
* `governanceBoundaryPreview.allowedProfiles`
* `governanceBoundaryPreview.recommendedProfile`
* `governanceBoundaryPreview.relevantPolicyCategories`
* `governanceBoundaryPreview.blockedBoundaryCapabilities`
* `recommendedNextStage`

Safety guarantees:

* `classificationApplied` is always `false`
* `boundariesEnforced` is always `false`
* `profileApplied` is always `false`
* `applied` is always `false`
* `enforced` is always `false`
* `policyRuntimeMode` is always `preview-only`
* `runtimeBehaviorChanged` is always `false`
* `governanceDecisionsChanged` is always `false`
* `repairOrchestrationChanged` is always `false`
* `safePatchEngineOnly` is always `true`
* no profile is applied
* no policy is enforced
* no governance boundary is enforced
* runtime behavior does not change

v6.2 deterministic checks:

* governance-repo-classification-preview-unit
* governance-repo-classification-preview-missing
* governance-repo-classification-preview-created
* governance-repo-classification-preview-enterprise
* governance-repo-classification-preview-experimental
* governance-repo-classification-preview-blocked-source
* governance-repo-classification-preview-blocks-unsafe-boundaries
* governance-repo-classification-preview-json-output
* governance-repo-classification-preview-artifact
* governance-repo-classification-preview-no-enforcement

## Governance Attestation Layer (v6.3)

v6.3 generates deterministic governance-state attestations for the current preview chain.

CLI usage:

```bash
node dist/cli.js governance attestation generate
node dist/cli.js governance attestation generate --json
```

Generated artifacts:

```text
.factory/governance/governance-attestation.json
.factory/governance/governance-attestation.md
```

The governance attestation:

* reuses the governance preview chain through repo classification preview
* summarizes whether activation plan, load preview, snapshot lock, audit trail, policy runtime preview, profile inheritance preview, and repo classification preview artifacts are available
* classifies governance maturity as `basic`, `managed`, `advanced-preview`, or `enterprise-preview`
* summarizes repository category, recommended profile, and stable governance candidate signals
* attests that safety invariants remain preserved
* lists unsafe capabilities that remain blocked
* does not cryptographically sign anything
* does not enforce governance
* does not apply profiles
* does not activate runtime config

Example human output fields:

```text
Attestation status:
created

Governance maturity level:
advanced-preview

Attestation applied:
false

Attestation enforced:
false

Autonomy enabled:
false
```

Example JSON fields:

* `attestationStatus`
* `sourceClassificationStatus`
* `governanceChain`
* `governanceMaturity.level`
* `governanceMaturity.stableGovernanceChain`
* `attestedSafetyInvariants`
* `blockedCapabilities`
* `governanceSummary`
* `recommendedNextStage`

Safety guarantees:

* `attestationApplied` is always `false`
* `attestationEnforced` is always `false`
* `classificationApplied` is always `false`
* `boundariesEnforced` is always `false`
* `profileApplied` is always `false`
* `applied` is always `false`
* `enforced` is always `false`
* `policyRuntimeMode` is always `preview-only`
* `runtimeBehaviorChanged` is always `false`
* `governanceDecisionsChanged` is always `false`
* `repairOrchestrationChanged` is always `false`
* `safePatchEngineOnly` is always `true`
* `autonomyEnabled` is always `false`
* no governance is enforced
* no profile is applied
* no runtime behavior changes occur

v6.3 deterministic checks:

* governance-attestation-unit
* governance-attestation-missing
* governance-attestation-created
* governance-attestation-enterprise-preview
* governance-attestation-blocked
* governance-attestation-json-output
* governance-attestation-artifact
* governance-attestation-safe-patch-only
* governance-attestation-no-autonomy
* governance-attestation-no-enforcement

## CI Governance Annotations Preview (v6.4)

v6.4 generates deterministic CI-oriented governance annotations from the governance attestation chain.

CLI usage:

```bash
node dist/cli.js governance ci annotations-preview
node dist/cli.js governance ci annotations-preview --json
```

Generated artifacts:

```text
.factory/governance/ci-governance-annotations-preview.json
.factory/governance/ci-governance-annotations-preview.md
```

The CI annotations preview:

* reuses deterministic governance attestation logic
* converts attestation status, maturity, repository category, recommended profile, policy runtime mode, safety invariants, blocked capabilities, and warnings into CI-friendly annotation records
* classifies CI conclusion as `pass-preview`, `warning-preview`, or `blocked-preview`
* keeps every annotation preview-only and non-build-blocking
* does not call GitHub APIs
* does not integrate with external CI services
* does not fail builds
* does not enforce governance
* does not apply profiles
* does not activate runtime config

Example human output fields:

```text
Preview status:
created

CI conclusion:
pass-preview

CI annotations applied:
false

CI enforced:
false

Build failed by governance:
false
```

Example JSON fields:

* `previewStatus`
* `sourceAttestationStatus`
* `ciConclusion`
* `annotations`
* `summary.governanceMaturityLevel`
* `summary.stableGovernanceChain`
* `summary.blockedCapabilityCount`
* `summary.warningCount`
* `summary.invariantFailureCount`
* `recommendedNextStage`

Safety guarantees:

* `ciAnnotationsApplied` is always `false`
* `ciEnforced` is always `false`
* `buildFailedByGovernance` is always `false`
* `attestationApplied` is always `false`
* `attestationEnforced` is always `false`
* `classificationApplied` is always `false`
* `boundariesEnforced` is always `false`
* `profileApplied` is always `false`
* `applied` is always `false`
* `enforced` is always `false`
* `policyRuntimeMode` is always `preview-only`
* `runtimeBehaviorChanged` is always `false`
* `governanceDecisionsChanged` is always `false`
* `repairOrchestrationChanged` is always `false`
* `safePatchEngineOnly` is always `true`
* `autonomyEnabled` is always `false`
* all annotations have `previewOnly: true`
* all annotations have `enforced: false`
* all annotations have `buildBlocking: false`

v6.4 deterministic checks:

* governance-ci-annotations-preview-unit
* governance-ci-annotations-preview-missing
* governance-ci-annotations-preview-created
* governance-ci-annotations-preview-warning
* governance-ci-annotations-preview-blocked
* governance-ci-annotations-preview-json-output
* governance-ci-annotations-preview-artifact
* governance-ci-annotations-preview-no-build-fail
* governance-ci-annotations-preview-no-enforcement

## GitHub PR Governance Summary Preview (v6.5)

v6.5 generates deterministic PR-ready governance summary artifacts from CI governance annotations.

CLI usage:

```bash
node dist/cli.js governance github pr-summary-preview
node dist/cli.js governance github pr-summary-preview --json
```

Generated artifacts:

```text
.factory/governance/github-pr-governance-summary-preview.json
.factory/governance/github-pr-governance-summary-preview.md
```

The GitHub PR summary preview:

* reuses deterministic CI governance annotation preview logic
* mirrors CI conclusion as `pass-preview`, `warning-preview`, or `blocked-preview`
* generates markdown suitable for a future PR comment
* includes governance maturity, repository category, recommended profile, safety invariants, blocked capabilities, annotation counts, warnings, and next-stage guidance
* does not call GitHub APIs
* does not read GitHub tokens or GitHub environment variables
* does not publish PR comments
* does not create or update PR reviews
* does not fail builds
* does not enforce governance

Example human output fields:

```text
Preview status:
created

PR conclusion:
pass-preview

GitHub published:
false

PR comment created:
false

GitHub API called:
false
```

Example JSON fields:

* `previewStatus`
* `sourceCiAnnotationsStatus`
* `prConclusion`
* `summary`
* `sections`
* `markdown`
* `warnings`
* `recommendedNextStage`

Example markdown summary shape:

```markdown
# Governance PR Summary Preview

# Preview Conclusion

# Governance Maturity

# Repository Classification

# Recommended Profile

# Safety Invariants

# Blocked Capabilities

# CI Annotation Summary

# Preview-Only Guarantees

# Warnings

# Recommended Next Stage
```

Safety guarantees:

* `githubPublished` is always `false`
* `prCommentCreated` is always `false`
* `githubApiCalled` is always `false`
* `ciAnnotationsApplied` is always `false`
* `ciEnforced` is always `false`
* `buildFailedByGovernance` is always `false`
* `attestationApplied` is always `false`
* `attestationEnforced` is always `false`
* `classificationApplied` is always `false`
* `boundariesEnforced` is always `false`
* `profileApplied` is always `false`
* `applied` is always `false`
* `enforced` is always `false`
* `policyRuntimeMode` is always `preview-only`
* `runtimeBehaviorChanged` is always `false`
* `governanceDecisionsChanged` is always `false`
* `repairOrchestrationChanged` is always `false`
* `safePatchEngineOnly` is always `true`
* `autonomyEnabled` is always `false`

v6.5 deterministic checks:

* governance-github-pr-summary-preview-unit
* governance-github-pr-summary-preview-missing
* governance-github-pr-summary-preview-created
* governance-github-pr-summary-preview-warning
* governance-github-pr-summary-preview-blocked
* governance-github-pr-summary-preview-json-output
* governance-github-pr-summary-preview-artifact
* governance-github-pr-summary-preview-markdown
* governance-github-pr-summary-preview-no-github-api
* governance-github-pr-summary-preview-no-publish
* governance-github-pr-summary-preview-no-enforcement

## Governance Exception Review Preview (v6.6)

v6.6 generates deterministic local exception review previews from the GitHub PR governance summary chain.

CLI usage:

```bash
node dist/cli.js governance exception review-preview
node dist/cli.js governance exception review-preview --json
```

Generated artifacts:

```text
.factory/governance/governance-exception-review-preview.json
.factory/governance/governance-exception-review-preview.md
```

The exception review preview:

* reuses deterministic GitHub PR governance summary preview logic
* collects exception candidates from blocked capabilities, warnings, safety invariant failures, CI failures, PR warning conclusions, PR blocked conclusions, and repo boundary concerns
* classifies candidates by severity, category, source, and reviewability
* separates reviewable candidates from non-reviewable blocking candidates
* assigns deterministic IDs such as `gov-exception-001`
* does not approve exceptions
* does not apply exceptions
* does not allow governance bypass
* does not enforce governance

Example human output fields:

```text
Preview status:
blocked

Exception review conclusion:
blocked-non-reviewable

Exception approved:
false

Exception applied:
false

Governance bypass allowed:
false
```

Example JSON fields:

* `previewStatus`
* `sourcePrSummaryStatus`
* `exceptionReviewConclusion`
* `exceptionCandidates`
* `summary.totalCandidates`
* `summary.reviewableCandidates`
* `summary.nonReviewableCandidates`
* `summary.categories`
* `recommendedNextStage`

Example markdown summary shape:

```markdown
# AI Software Factory - Governance Exception Review Preview

## Exception Candidates

## Preview-Only Guarantees

## Warnings
```

Safety guarantees:

* `exceptionApproved` is always `false`
* `exceptionApplied` is always `false`
* `governanceBypassAllowed` is always `false`
* `exceptionEnforced` is always `false`
* `githubPublished` is always `false`
* `prCommentCreated` is always `false`
* `githubApiCalled` is always `false`
* `ciEnforced` is always `false`
* `buildFailedByGovernance` is always `false`
* `attestationApplied` is always `false`
* `attestationEnforced` is always `false`
* `classificationApplied` is always `false`
* `boundariesEnforced` is always `false`
* `profileApplied` is always `false`
* `applied` is always `false`
* `enforced` is always `false`
* `policyRuntimeMode` is always `preview-only`
* `runtimeBehaviorChanged` is always `false`
* `governanceDecisionsChanged` is always `false`
* `repairOrchestrationChanged` is always `false`
* `safePatchEngineOnly` is always `true`
* `autonomyEnabled` is always `false`

v6.6 deterministic checks:

* governance-exception-review-preview-unit
* governance-exception-review-preview-missing
* governance-exception-review-preview-no-exceptions
* governance-exception-review-preview-review-needed
* governance-exception-review-preview-non-reviewable-blocked
* governance-exception-review-preview-json-output
* governance-exception-review-preview-artifact
* governance-exception-review-preview-no-approval
* governance-exception-review-preview-no-bypass
* governance-exception-review-preview-no-enforcement

## Governance Simulation Mode Preview (v6.7)

v6.7 simulates future governance outcomes locally from the governance exception review preview chain.

CLI usage:

```bash
node dist/cli.js governance simulation preview
node dist/cli.js governance simulation preview --json
```

Generated artifacts:

```text
.factory/governance/governance-simulation-preview.json
.factory/governance/governance-simulation-preview.md
```

The governance simulation preview:

* reuses deterministic governance exception review preview logic
* creates deterministic scenarios such as governance source status, exception conclusion, profile status, policy runtime mode, safety invariants, reviewable warnings, and non-reviewable blockers
* classifies simulated outcomes as `would-pass`, `would-warn`, or `would-block`
* summarizes pass, warning, and block counts
* assigns deterministic scenario IDs such as `gov-simulation-001`
* does not apply simulation outcomes
* does not enforce simulated decisions
* does not approve exceptions
* does not allow governance bypass
* does not change runtime outcomes

Example human output fields:

```text
Preview status:
created

Simulation conclusion:
warning-preview

Simulation applied:
false

Simulation enforced:
false

Simulation changed outcome:
false
```

Example JSON fields:

* `previewStatus`
* `sourceExceptionReviewStatus`
* `simulationConclusion`
* `scenarios`
* `simulatedOutcomeSummary.totalScenarios`
* `simulatedOutcomeSummary.simulatedPasses`
* `simulatedOutcomeSummary.simulatedWarnings`
* `simulatedOutcomeSummary.simulatedBlocks`
* `simulatedOutcomeSummary.nonReviewableBlockers`
* `recommendedNextStage`

Example markdown summary shape:

```markdown
# AI Software Factory - Governance Simulation Preview

## Simulation Scenarios

## Preview-Only Guarantees

## Warnings
```

Safety guarantees:

* `simulationApplied` is always `false`
* `simulationEnforced` is always `false`
* `simulationChangedOutcome` is always `false`
* `exceptionApproved` is always `false`
* `exceptionApplied` is always `false`
* `governanceBypassAllowed` is always `false`
* `exceptionEnforced` is always `false`
* `ciEnforced` is always `false`
* `buildFailedByGovernance` is always `false`
* `githubPublished` is always `false`
* `prCommentCreated` is always `false`
* `githubApiCalled` is always `false`
* `attestationApplied` is always `false`
* `attestationEnforced` is always `false`
* `classificationApplied` is always `false`
* `boundariesEnforced` is always `false`
* `profileApplied` is always `false`
* `applied` is always `false`
* `enforced` is always `false`
* `policyRuntimeMode` is always `preview-only`
* `runtimeBehaviorChanged` is always `false`
* `governanceDecisionsChanged` is always `false`
* `repairOrchestrationChanged` is always `false`
* `safePatchEngineOnly` is always `true`
* `autonomyEnabled` is always `false`

v6.7 deterministic checks:

* governance-simulation-preview-unit
* governance-simulation-preview-missing
* governance-simulation-preview-pass
* governance-simulation-preview-warning
* governance-simulation-preview-blocked
* governance-simulation-preview-json-output
* governance-simulation-preview-artifact
* governance-simulation-preview-no-application
* governance-simulation-preview-no-enforcement
* governance-simulation-preview-no-outcome-change

## Guarded Policy Activation Candidates Preview (v6.8)

v6.8 identifies which preview-only governance policies could theoretically become future guarded activation candidates.

CLI usage:

```bash
node dist/cli.js governance policy activation-candidates-preview
node dist/cli.js governance policy activation-candidates-preview --json
```

Generated artifacts:

```text
.factory/governance/guarded-policy-activation-candidates-preview.json
.factory/governance/guarded-policy-activation-candidates-preview.md
```

The guarded activation candidates preview:

* reuses deterministic governance simulation preview logic
* classifies policy candidates as `eligible`, `review-required`, `blocked`, or `permanently-non-activatable`
* keeps unsafe governance capabilities permanently non-activatable
* assigns deterministic candidate IDs such as `gov-activation-candidate-001`
* explains why each candidate belongs to its classification
* does not activate policies
* does not enforce governance
* does not enable guarded activation
* does not apply simulation outcomes
* does not change runtime behavior or repair orchestration

Example human output fields:

```text
Preview status:
created

Activation candidate conclusion:
review-required-preview

Activation candidate applied:
false

Policy activated:
false

Guarded activation enabled:
false

Activation enforced:
false
```

Example JSON fields:

* `previewStatus`
* `sourceSimulationStatus`
* `activationCandidateConclusion`
* `activationCandidateApplied`
* `policyActivated`
* `guardedActivationEnabled`
* `activationEnforced`
* `candidates`
* `summary`
* `recommendedNextStage`

Example markdown summary shape:

```markdown
# AI Software Factory - Guarded Policy Activation Candidates Preview

## Activation Candidates

## Preview-Only Guarantees

## Warnings
```

Safety guarantees:

* `activationCandidateApplied` is always `false`
* `policyActivated` is always `false`
* `guardedActivationEnabled` is always `false`
* `activationEnforced` is always `false`
* `simulationApplied` is always `false`
* `simulationEnforced` is always `false`
* `governanceBypassAllowed` is always `false`
* `applied` is always `false`
* `enforced` is always `false`
* `runtimeBehaviorChanged` is always `false`
* `governanceDecisionsChanged` is always `false`
* `repairOrchestrationChanged` is always `false`
* `safePatchEngineOnly` is always `true`
* `autonomyEnabled` is always `false`

v6.8 deterministic checks:

* governance-activation-candidates-preview-unit
* governance-activation-candidates-preview-missing
* governance-activation-candidates-preview-eligible
* governance-activation-candidates-preview-review-required
* governance-activation-candidates-preview-blocked
* governance-activation-candidates-preview-permanently-non-activatable
* governance-activation-candidates-preview-json-output
* governance-activation-candidates-preview-artifact
* governance-activation-candidates-preview-no-activation
* governance-activation-candidates-preview-no-enforcement

## Governance Runtime Activation Gates Preview (v6.9)

v6.9 models final pre-activation governance runtime gates in deterministic preview-only mode.

CLI usage:

```bash
node dist/cli.js governance runtime activation-gates-preview
node dist/cli.js governance runtime activation-gates-preview --json
```

Generated artifacts:

```text
.factory/governance/runtime-activation-gates-preview.json
.factory/governance/runtime-activation-gates-preview.md
```

The runtime activation gates preview:

* reuses deterministic guarded policy activation candidates preview logic
* creates deterministic gate definitions for config chain, policy runtime, profiles, repo boundaries, attestations, CI/PR previews, exception review, simulation, activation candidates, and safety invariants
* classifies gates as `satisfied`, `warning-state`, `blocked`, or `permanently-non-passable`
* keeps unsafe governance capabilities permanently non-passable
* assigns deterministic gate IDs such as `gov-runtime-gate-001`
* explains why every gate has its current status
* does not pass activation gates
* does not enable runtime activation
* does not activate policies
* does not enforce governance
* does not change runtime behavior or repair orchestration

Example human output fields:

```text
Preview status:
created

Activation gate conclusion:
structurally-ready-preview

Activation gate passed:
false

Runtime activation enabled:
false

Policy activated:
false

Activation enforced:
false
```

Example JSON fields:

* `previewStatus`
* `sourceActivationCandidatesStatus`
* `activationGateConclusion`
* `activationGatePassed`
* `runtimeActivationEnabled`
* `policyActivated`
* `guardedActivationEnabled`
* `activationEnforced`
* `gates`
* `summary`
* `recommendedNextStage`

Example markdown summary shape:

```markdown
# AI Software Factory - Governance Runtime Activation Gates Preview

## Runtime Activation Gates

## Preview-Only Guarantees

## Warnings
```

Safety guarantees:

* `activationGatePassed` is always `false`
* `runtimeActivationEnabled` is always `false`
* `policyActivated` is always `false`
* `guardedActivationEnabled` is always `false`
* `activationEnforced` is always `false`
* `governanceBypassAllowed` is always `false`
* `applied` is always `false`
* `enforced` is always `false`
* `runtimeBehaviorChanged` is always `false`
* `governanceDecisionsChanged` is always `false`
* `repairOrchestrationChanged` is always `false`
* `safePatchEngineOnly` is always `true`
* `autonomyEnabled` is always `false`

v6.9 deterministic checks:

* governance-runtime-activation-gates-preview-unit
* governance-runtime-activation-gates-preview-missing
* governance-runtime-activation-gates-preview-warning
* governance-runtime-activation-gates-preview-structurally-ready
* governance-runtime-activation-gates-preview-blocked
* governance-runtime-activation-gates-preview-permanently-non-passable
* governance-runtime-activation-gates-preview-json-output
* governance-runtime-activation-gates-preview-artifact
* governance-runtime-activation-gates-preview-no-activation
* governance-runtime-activation-gates-preview-no-enforcement

## Controlled Autonomy Readiness (v7.0)

v7.0 evaluates whether the governance preview platform is structurally ready for a future controlled-autonomy design review.

CLI usage:

```bash
node dist/cli.js governance autonomy readiness
node dist/cli.js governance autonomy readiness --json
```

Generated artifacts:

```text
.factory/governance/autonomy-readiness.json
.factory/governance/autonomy-readiness.md
```

The controlled autonomy readiness layer:

* reuses deterministic runtime activation gates preview logic
* evaluates whether the v6.x governance preview chain is structurally complete
* identifies readiness blockers
* lists required future human review gates
* lists permanently forbidden autonomy capabilities
* assigns deterministic IDs such as `gov-autonomy-check-001`
* does not enable autonomy
* does not perform autonomous actions
* does not activate runtime governance
* does not activate policies
* does not enforce governance
* does not change runtime behavior or repair orchestration

Example human output fields:

```text
Readiness status:
ready-for-design-review

Autonomy stage:
readiness-preview

Autonomy enabled:
false

Autonomous actions allowed:
false

Runtime activation enabled:
false

Policy activated:
false
```

Example JSON fields:

* `readinessStatus`
* `autonomyStage`
* `sourceActivationGatesStatus`
* `autonomyEnabled`
* `autonomousActionsAllowed`
* `autonomyApplied`
* `autonomyEnforced`
* `readinessChecks`
* `blockers`
* `humanReviewGates`
* `permanentlyForbiddenCapabilities`
* `summary`
* `recommendedNextStage`

Example markdown summary shape:

```markdown
# AI Software Factory - Controlled Autonomy Readiness

## Readiness Checks

## Blockers

## Human Review Gates

## Permanently Forbidden Capabilities

## Warnings
```

Safety guarantees:

* `autonomyEnabled` is always `false`
* `autonomousActionsAllowed` is always `false`
* `autonomyApplied` is always `false`
* `autonomyEnforced` is always `false`
* `runtimeActivationEnabled` is always `false`
* `policyActivated` is always `false`
* `guardedActivationEnabled` is always `false`
* `activationEnforced` is always `false`
* `governanceBypassAllowed` is always `false`
* `applied` is always `false`
* `enforced` is always `false`
* `runtimeBehaviorChanged` is always `false`
* `governanceDecisionsChanged` is always `false`
* `repairOrchestrationChanged` is always `false`
* `safePatchEngineOnly` is always `true`

v7.0 deterministic checks:

* governance-autonomy-readiness-unit
* governance-autonomy-readiness-missing
* governance-autonomy-readiness-not-ready
* governance-autonomy-readiness-ready-for-design-review
* governance-autonomy-readiness-blocked
* governance-autonomy-readiness-forbidden-capabilities
* governance-autonomy-readiness-human-review-gates
* governance-autonomy-readiness-json-output
* governance-autonomy-readiness-artifact
* governance-autonomy-readiness-no-autonomy
* governance-autonomy-readiness-no-enforcement

## Controlled Autonomy Design Review Pack (v7.1)

v7.1 generates a deterministic human-review package for future controlled-autonomy design review.

CLI usage:

```bash
node dist/cli.js governance autonomy design-review-pack
node dist/cli.js governance autonomy design-review-pack --json
```

Generated artifacts:

```text
.factory/governance/autonomy-design-review-pack.json
.factory/governance/autonomy-design-review-pack.md
```

The controlled autonomy design review pack:

* reuses deterministic autonomy readiness logic
* summarizes governance maturity and activation readiness
* summarizes required future human review gates
* summarizes permanently forbidden autonomy capabilities
* summarizes preserved safety invariants
* assigns deterministic IDs such as `gov-review-pack-section-001`
* does not approve autonomy
* does not enable autonomy
* does not perform autonomous actions
* does not activate runtime governance
* does not activate policies
* does not enforce governance
* does not change runtime behavior or repair orchestration

Example human output fields:

```text
Review pack status:
created

Review pack conclusion:
review-ready-preview

Design review approved:
false

Autonomy enabled:
false

Autonomous actions allowed:
false

Runtime activation enabled:
false
```

Example JSON fields:

* `reviewPackStatus`
* `sourceAutonomyReadinessStatus`
* `reviewPackConclusion`
* `designReviewApproved`
* `designReviewApplied`
* `autonomyEnabled`
* `autonomousActionsAllowed`
* `sections`
* `reviewRequirements`
* `forbiddenCapabilities`
* `preservedSafetyInvariants`
* `summary`
* `recommendedNextStage`

Example markdown review-pack shape:

```markdown
# AI Software Factory - Controlled Autonomy Design Review Pack

## Design Review Sections

## Review Requirements

## Forbidden Capabilities

## Preserved Safety Invariants

## Warnings
```

Safety guarantees:

* `designReviewApproved` is always `false`
* `designReviewApplied` is always `false`
* `autonomyEnabled` is always `false`
* `autonomousActionsAllowed` is always `false`
* `autonomyApplied` is always `false`
* `autonomyEnforced` is always `false`
* `runtimeActivationEnabled` is always `false`
* `policyActivated` is always `false`
* `guardedActivationEnabled` is always `false`
* `activationEnforced` is always `false`
* `governanceBypassAllowed` is always `false`
* `applied` is always `false`
* `enforced` is always `false`
* `runtimeBehaviorChanged` is always `false`
* `governanceDecisionsChanged` is always `false`
* `repairOrchestrationChanged` is always `false`
* `safePatchEngineOnly` is always `true`

v7.1 deterministic checks:

* governance-autonomy-design-review-pack-unit
* governance-autonomy-design-review-pack-missing
* governance-autonomy-design-review-pack-review-not-ready
* governance-autonomy-design-review-pack-review-ready
* governance-autonomy-design-review-pack-blocked
* governance-autonomy-design-review-pack-forbidden-capabilities
* governance-autonomy-design-review-pack-safety-invariants
* governance-autonomy-design-review-pack-json-output
* governance-autonomy-design-review-pack-artifact
* governance-autonomy-design-review-pack-no-approval
* governance-autonomy-design-review-pack-no-autonomy

## Human Approval Workflow Preview (v7.2)

v7.2 models the deterministic human approval workflow required before controlled autonomy could ever be considered.

CLI usage:

```bash
node dist/cli.js governance autonomy approval-workflow-preview
node dist/cli.js governance autonomy approval-workflow-preview --json
```

Generated artifacts:

```text
.factory/governance/human-approval-workflow-preview.json
.factory/governance/human-approval-workflow-preview.md
```

The human approval workflow preview:

* reuses deterministic controlled autonomy design review pack logic
* models required workflow steps
* models required manual decisions
* summarizes approval blockers
* lists permanently forbidden approval paths
* assigns deterministic IDs such as `gov-human-approval-step-001`
* does not grant approval
* does not apply approval
* does not enable autonomy
* does not perform autonomous actions
* does not activate runtime governance
* does not activate policies
* does not enforce governance
* does not change runtime behavior or repair orchestration

Example human output fields:

```text
Preview status:
created

Approval workflow conclusion:
workflow-ready-preview

Human approval granted:
false

Approval applied:
false

Autonomy enabled:
false

Autonomous actions allowed:
false
```

Example JSON fields:

* `previewStatus`
* `sourceDesignReviewPackStatus`
* `approvalWorkflowConclusion`
* `humanApprovalGranted`
* `approvalApplied`
* `approvalWorkflowEnforced`
* `workflowSteps`
* `manualDecisions`
* `approvalBlockers`
* `permanentlyForbiddenApprovalPaths`
* `summary`
* `recommendedNextStage`

Example markdown workflow shape:

```markdown
# AI Software Factory - Human Approval Workflow Preview

## Workflow Steps

## Manual Decisions

## Approval Blockers

## Permanently Forbidden Approval Paths

## Warnings
```

Safety guarantees:

* `humanApprovalGranted` is always `false`
* `approvalApplied` is always `false`
* `approvalWorkflowEnforced` is always `false`
* `designReviewApproved` is always `false`
* `designReviewApplied` is always `false`
* `autonomyEnabled` is always `false`
* `autonomousActionsAllowed` is always `false`
* `autonomyApplied` is always `false`
* `autonomyEnforced` is always `false`
* `runtimeActivationEnabled` is always `false`
* `policyActivated` is always `false`
* `guardedActivationEnabled` is always `false`
* `activationEnforced` is always `false`
* `governanceBypassAllowed` is always `false`
* `applied` is always `false`
* `enforced` is always `false`
* `runtimeBehaviorChanged` is always `false`
* `governanceDecisionsChanged` is always `false`
* `repairOrchestrationChanged` is always `false`
* `safePatchEngineOnly` is always `true`

v7.2 deterministic checks:

* governance-human-approval-workflow-preview-unit
* governance-human-approval-workflow-preview-missing
* governance-human-approval-workflow-preview-not-ready
* governance-human-approval-workflow-preview-ready
* governance-human-approval-workflow-preview-blocked
* governance-human-approval-workflow-preview-forbidden-paths
* governance-human-approval-workflow-preview-manual-decisions
* governance-human-approval-workflow-preview-json-output
* governance-human-approval-workflow-preview-artifact
* governance-human-approval-workflow-preview-no-approval
* governance-human-approval-workflow-preview-no-autonomy

## Controlled Autonomy Scope Preview (v7.3)

v7.3 models future controlled-autonomy scope candidates while keeping all autonomy disabled.

CLI usage:

```bash
node dist/cli.js governance autonomy scope-preview
node dist/cli.js governance autonomy scope-preview --json
```

Generated artifacts:

```text
.factory/governance/autonomy-scope-preview.json
.factory/governance/autonomy-scope-preview.md
```

The controlled autonomy scope preview:

* reuses deterministic human approval workflow preview logic
* classifies future autonomy scope candidates
* summarizes scope boundaries
* summarizes future-only actions that require human approval
* lists permanently forbidden actions
* assigns deterministic IDs such as `gov-autonomy-scope-001`
* does not approve scope
* does not apply scope
* does not enable autonomy
* does not allow autonomous actions
* does not activate runtime governance
* does not activate policies
* does not enforce governance
* does not change runtime behavior or repair orchestration

Example human output fields:

```text
Preview status:
created

Scope conclusion:
scope-review-ready-preview

Scope approved:
false

Scope applied:
false

Autonomy enabled:
false

Autonomous actions allowed:
false
```

Example JSON fields:

* `previewStatus`
* `sourceApprovalWorkflowStatus`
* `scopeConclusion`
* `scopeApproved`
* `scopeApplied`
* `scopeEnforced`
* `scopeCandidates`
* `scopeBoundaries`
* `futureOnlyActions`
* `permanentlyForbiddenActions`
* `summary`
* `recommendedNextStage`

Example markdown scope-preview shape:

```markdown
# AI Software Factory - Controlled Autonomy Scope Preview

## Scope Candidates

## Scope Boundaries

## Future-Only Actions

## Permanently Forbidden Actions

## Warnings
```

Safety guarantees:

* `scopeApproved` is always `false`
* `scopeApplied` is always `false`
* `scopeEnforced` is always `false`
* `autonomyEnabled` is always `false`
* `autonomousActionsAllowed` is always `false`
* `autonomyApplied` is always `false`
* `autonomyEnforced` is always `false`
* `humanApprovalGranted` is always `false`
* `approvalApplied` is always `false`
* `approvalWorkflowEnforced` is always `false`
* `designReviewApproved` is always `false`
* `designReviewApplied` is always `false`
* `runtimeActivationEnabled` is always `false`
* `policyActivated` is always `false`
* `guardedActivationEnabled` is always `false`
* `activationEnforced` is always `false`
* `governanceBypassAllowed` is always `false`
* `applied` is always `false`
* `enforced` is always `false`
* `runtimeBehaviorChanged` is always `false`
* `governanceDecisionsChanged` is always `false`
* `repairOrchestrationChanged` is always `false`
* `safePatchEngineOnly` is always `true`

v7.3 deterministic checks:

* governance-autonomy-scope-preview-unit
* governance-autonomy-scope-preview-missing
* governance-autonomy-scope-preview-not-ready
* governance-autonomy-scope-preview-ready
* governance-autonomy-scope-preview-blocked
* governance-autonomy-scope-preview-boundaries
* governance-autonomy-scope-preview-forbidden-actions
* governance-autonomy-scope-preview-json-output
* governance-autonomy-scope-preview-artifact
* governance-autonomy-scope-preview-no-approval
* governance-autonomy-scope-preview-no-autonomy

## Controlled Autonomy Risk Register Preview (v7.4)

v7.4 collects and classifies future controlled-autonomy risks from the scope preview chain while keeping all autonomy disabled.

CLI usage:

```bash
node dist/cli.js governance autonomy risk-register-preview
node dist/cli.js governance autonomy risk-register-preview --json
```

Generated artifacts:

```text
.factory/governance/autonomy-risk-register-preview.json
.factory/governance/autonomy-risk-register-preview.md
```

The controlled autonomy risk register preview:

* reuses deterministic autonomy scope preview logic
* classifies risks by category, severity, likelihood, impact, and reviewability
* separates reviewable risks from non-reviewable risks
* generates deterministic mitigation recommendations without applying them
* lists deterministic risk blockers for permanently forbidden actions
* assigns deterministic IDs such as `gov-autonomy-risk-001`
* does not accept risks
* does not apply mitigations
* does not enable autonomy
* does not allow autonomous actions
* does not activate runtime governance
* does not activate policies
* does not enforce governance
* does not change runtime behavior or repair orchestration

Example human output fields:

```text
Preview status:
created

Risk register conclusion:
risk-review-ready-preview

Risk accepted:
false

Risk mitigation applied:
false

Autonomy enabled:
false

Autonomous actions allowed:
false
```

Example JSON fields:

* `previewStatus`
* `sourceScopePreviewStatus`
* `riskRegisterConclusion`
* `riskAccepted`
* `riskMitigationApplied`
* `riskRegisterEnforced`
* `risks`
* `mitigationRecommendations`
* `riskBlockers`
* `summary`
* `recommendedNextStage`

Example markdown risk-register shape:

```markdown
# AI Software Factory - Controlled Autonomy Risk Register Preview

## Risks

## Mitigation Recommendations

## Risk Blockers

## Warnings
```

Safety guarantees:

* `riskAccepted` is always `false`
* `riskMitigationApplied` is always `false`
* `riskRegisterEnforced` is always `false`
* `scopeApproved` is always `false`
* `scopeApplied` is always `false`
* `scopeEnforced` is always `false`
* `autonomyEnabled` is always `false`
* `autonomousActionsAllowed` is always `false`
* `autonomyApplied` is always `false`
* `autonomyEnforced` is always `false`
* `humanApprovalGranted` is always `false`
* `approvalApplied` is always `false`
* `approvalWorkflowEnforced` is always `false`
* `designReviewApproved` is always `false`
* `designReviewApplied` is always `false`
* `runtimeActivationEnabled` is always `false`
* `policyActivated` is always `false`
* `guardedActivationEnabled` is always `false`
* `activationEnforced` is always `false`
* `governanceBypassAllowed` is always `false`
* `applied` is always `false`
* `enforced` is always `false`
* `runtimeBehaviorChanged` is always `false`
* `governanceDecisionsChanged` is always `false`
* `repairOrchestrationChanged` is always `false`
* `safePatchEngineOnly` is always `true`

v7.4 deterministic checks:

* governance-autonomy-risk-register-preview-unit
* governance-autonomy-risk-register-preview-missing
* governance-autonomy-risk-register-preview-not-ready
* governance-autonomy-risk-register-preview-ready
* governance-autonomy-risk-register-preview-blocked
* governance-autonomy-risk-register-preview-non-reviewable-risks
* governance-autonomy-risk-register-preview-mitigations
* governance-autonomy-risk-register-preview-json-output
* governance-autonomy-risk-register-preview-artifact
* governance-autonomy-risk-register-preview-no-acceptance
* governance-autonomy-risk-register-preview-no-autonomy

## Controlled Autonomy Sandbox Plan Preview (v7.5)

v7.5 generates deterministic future sandbox planning based on the autonomy risk register preview without creating or executing any sandbox.

CLI usage:

```bash
node dist/cli.js governance autonomy sandbox-plan-preview
node dist/cli.js governance autonomy sandbox-plan-preview --json
```

Generated artifacts:

```text
.factory/governance/autonomy-sandbox-plan-preview.json
.factory/governance/autonomy-sandbox-plan-preview.md
```

The controlled autonomy sandbox plan preview:

* reuses deterministic autonomy risk register preview logic
* documents sandbox objectives
* documents sandbox boundaries
* lists future-only tests that require human approval
* lists permanently prohibited tests
* defines deterministic exit criteria
* defines deterministic human review checkpoints
* assigns deterministic IDs such as `gov-sandbox-objective-001`
* does not create sandbox directories
* does not execute sandbox commands
* does not accept risks
* does not apply mitigations
* does not enable autonomy
* does not allow autonomous actions
* does not activate runtime governance
* does not activate policies
* does not enforce governance
* does not change runtime behavior or repair orchestration

Example human output fields:

```text
Preview status:
created

Sandbox plan conclusion:
sandbox-plan-ready-preview

Sandbox created:
false

Sandbox executed:
false

Autonomy enabled:
false

Autonomous actions allowed:
false
```

Example JSON fields:

* `previewStatus`
* `sourceRiskRegisterStatus`
* `sandboxPlanConclusion`
* `sandboxCreated`
* `sandboxExecuted`
* `sandboxPlanApplied`
* `sandboxObjectives`
* `sandboxBoundaries`
* `futureOnlyTests`
* `prohibitedTests`
* `exitCriteria`
* `humanReviewCheckpoints`
* `summary`
* `recommendedNextStage`

Example markdown sandbox-plan shape:

```markdown
# AI Software Factory - Controlled Autonomy Sandbox Plan Preview

## Sandbox Objectives

## Sandbox Boundaries

## Future-Only Tests

## Prohibited Tests

## Exit Criteria

## Human Review Checkpoints

## Warnings
```

Safety guarantees:

* `sandboxCreated` is always `false`
* `sandboxExecuted` is always `false`
* `sandboxPlanApplied` is always `false`
* `sandboxEnforced` is always `false`
* `riskAccepted` is always `false`
* `riskMitigationApplied` is always `false`
* `riskRegisterEnforced` is always `false`
* `scopeApproved` is always `false`
* `scopeApplied` is always `false`
* `scopeEnforced` is always `false`
* `autonomyEnabled` is always `false`
* `autonomousActionsAllowed` is always `false`
* `autonomyApplied` is always `false`
* `autonomyEnforced` is always `false`
* `humanApprovalGranted` is always `false`
* `approvalApplied` is always `false`
* `approvalWorkflowEnforced` is always `false`
* `designReviewApproved` is always `false`
* `designReviewApplied` is always `false`
* `runtimeActivationEnabled` is always `false`
* `policyActivated` is always `false`
* `guardedActivationEnabled` is always `false`
* `activationEnforced` is always `false`
* `governanceBypassAllowed` is always `false`
* `applied` is always `false`
* `enforced` is always `false`
* `runtimeBehaviorChanged` is always `false`
* `governanceDecisionsChanged` is always `false`
* `repairOrchestrationChanged` is always `false`
* `safePatchEngineOnly` is always `true`

v7.5 deterministic checks:

* governance-autonomy-sandbox-plan-preview-unit
* governance-autonomy-sandbox-plan-preview-missing
* governance-autonomy-sandbox-plan-preview-not-ready
* governance-autonomy-sandbox-plan-preview-ready
* governance-autonomy-sandbox-plan-preview-blocked
* governance-autonomy-sandbox-plan-preview-boundaries
* governance-autonomy-sandbox-plan-preview-prohibited-tests
* governance-autonomy-sandbox-plan-preview-exit-criteria
* governance-autonomy-sandbox-plan-preview-json-output
* governance-autonomy-sandbox-plan-preview-artifact
* governance-autonomy-sandbox-plan-preview-no-sandbox
* governance-autonomy-sandbox-plan-preview-no-autonomy

## Controlled Autonomy Sandbox Evidence Preview (v7.6)

v7.6 generates a deterministic sandbox evidence preview package from the sandbox plan preview without creating a sandbox, executing a sandbox, or applying evidence.

CLI usage:

```bash
node dist/cli.js governance autonomy sandbox-evidence-preview
node dist/cli.js governance autonomy sandbox-evidence-preview --json
```

Generated artifacts:

```text
.factory/governance/autonomy-sandbox-evidence-preview.json
.factory/governance/autonomy-sandbox-evidence-preview.md
```

The controlled autonomy sandbox evidence preview:

* reuses deterministic autonomy sandbox plan preview logic
* documents sandbox evidence sections
* references governance and autonomy preview chain evidence
* summarizes missing evidence
* summarizes required human-review evidence
* lists permanently forbidden evidence categories
* assigns deterministic IDs such as `gov-sandbox-evidence-section-001`
* does not create sandbox directories
* does not execute sandbox commands
* does not apply evidence
* does not enforce evidence
* does not accept risks
* does not apply mitigations
* does not enable autonomy
* does not allow autonomous actions
* does not activate runtime governance
* does not activate policies
* does not enforce governance
* does not change runtime behavior or repair orchestration

Example human output fields:

```text
Preview status:
created

Sandbox evidence conclusion:
sandbox-evidence-ready-preview

Sandbox created:
false

Sandbox executed:
false

Evidence applied:
false

Autonomy enabled:
false
```

Example JSON fields:

* `previewStatus`
* `sourceSandboxPlanStatus`
* `sandboxEvidenceConclusion`
* `sandboxCreated`
* `sandboxExecuted`
* `evidenceApplied`
* `evidenceEnforced`
* `evidenceSections`
* `evidenceReferences`
* `missingEvidence`
* `requiredHumanReviewEvidence`
* `forbiddenEvidenceCategories`
* `summary`
* `recommendedNextStage`

Example markdown sandbox-evidence shape:

```markdown
# AI Software Factory - Controlled Autonomy Sandbox Evidence Preview

## Evidence Sections

## Evidence References

## Missing Evidence

## Required Human Review Evidence

## Forbidden Evidence Categories

## Warnings
```

Safety guarantees:

* `sandboxCreated` is always `false`
* `sandboxExecuted` is always `false`
* `sandboxPlanApplied` is always `false`
* `sandboxEnforced` is always `false`
* `evidenceApplied` is always `false`
* `evidenceEnforced` is always `false`
* `riskAccepted` is always `false`
* `riskMitigationApplied` is always `false`
* `riskRegisterEnforced` is always `false`
* `scopeApproved` is always `false`
* `scopeApplied` is always `false`
* `scopeEnforced` is always `false`
* `autonomyEnabled` is always `false`
* `autonomousActionsAllowed` is always `false`
* `autonomyApplied` is always `false`
* `autonomyEnforced` is always `false`
* `humanApprovalGranted` is always `false`
* `approvalApplied` is always `false`
* `approvalWorkflowEnforced` is always `false`
* `designReviewApproved` is always `false`
* `designReviewApplied` is always `false`
* `runtimeActivationEnabled` is always `false`
* `policyActivated` is always `false`
* `guardedActivationEnabled` is always `false`
* `activationEnforced` is always `false`
* `governanceBypassAllowed` is always `false`
* `applied` is always `false`
* `enforced` is always `false`
* `runtimeBehaviorChanged` is always `false`
* `governanceDecisionsChanged` is always `false`
* `repairOrchestrationChanged` is always `false`
* `safePatchEngineOnly` is always `true`

v7.6 deterministic checks:

* governance-autonomy-sandbox-evidence-preview-unit
* governance-autonomy-sandbox-evidence-preview-missing
* governance-autonomy-sandbox-evidence-preview-not-ready
* governance-autonomy-sandbox-evidence-preview-ready
* governance-autonomy-sandbox-evidence-preview-blocked
* governance-autonomy-sandbox-evidence-preview-missing-evidence
* governance-autonomy-sandbox-evidence-preview-forbidden-categories
* governance-autonomy-sandbox-evidence-preview-json-output
* governance-autonomy-sandbox-evidence-preview-artifact
* governance-autonomy-sandbox-evidence-preview-no-evidence-application
* governance-autonomy-sandbox-evidence-preview-no-autonomy

## Controlled Autonomy Observability Preview (v7.7)

v7.7 generates a deterministic controlled-autonomy observability preview from the sandbox evidence preview without applying observability, executing telemetry, creating a sandbox, or enabling autonomy.

CLI usage:

```bash
node dist/cli.js governance autonomy observability-preview
node dist/cli.js governance autonomy observability-preview --json
```

Generated artifacts:

```text
.factory/governance/autonomy-observability-preview.json
.factory/governance/autonomy-observability-preview.md
```

The controlled autonomy observability preview:

* reuses deterministic autonomy sandbox evidence preview logic
* documents future telemetry signal definitions
* documents future immutable audit event definitions
* documents future alert candidates
* documents operator visibility requirements
* summarizes missing observability coverage
* assigns deterministic IDs such as `gov-observability-signal-001`
* does not apply observability
* does not enforce observability
* does not execute telemetry
* does not create metrics pipelines
* does not create observability backends
* does not create network calls
* does not create or execute sandboxes
* does not enable autonomy
* does not allow autonomous actions
* does not activate runtime governance
* does not activate policies
* does not enforce governance
* does not change runtime behavior or repair orchestration

Example human output fields:

```text
Preview status:
created

Observability conclusion:
observability-ready-preview

Observability applied:
false

Sandbox executed:
false

Autonomy enabled:
false

Telemetry signal count:
13
```

Example JSON fields:

* `previewStatus`
* `sourceSandboxEvidenceStatus`
* `observabilityConclusion`
* `observabilityApplied`
* `observabilityEnforced`
* `sandboxCreated`
* `sandboxExecuted`
* `autonomyEnabled`
* `autonomousActionsAllowed`
* `telemetrySignals`
* `auditEvents`
* `alertCandidates`
* `operatorVisibilityRequirements`
* `missingObservabilityCoverage`
* `summary`
* `recommendedNextStage`

Example markdown observability-preview shape:

```markdown
# AI Software Factory - Controlled Autonomy Observability Preview

## Telemetry Signals

## Audit Events

## Alert Candidates

## Operator Visibility Requirements

## Missing Observability Coverage

## Warnings
```

Safety guarantees:

* `observabilityApplied` is always `false`
* `observabilityEnforced` is always `false`
* `sandboxCreated` is always `false`
* `sandboxExecuted` is always `false`
* `evidenceApplied` is always `false`
* `evidenceEnforced` is always `false`
* `autonomyEnabled` is always `false`
* `autonomousActionsAllowed` is always `false`
* `autonomyApplied` is always `false`
* `autonomyEnforced` is always `false`
* `runtimeActivationEnabled` is always `false`
* `policyActivated` is always `false`
* `guardedActivationEnabled` is always `false`
* `activationEnforced` is always `false`
* `governanceBypassAllowed` is always `false`
* `applied` is always `false`
* `enforced` is always `false`
* `runtimeBehaviorChanged` is always `false`
* `governanceDecisionsChanged` is always `false`
* `repairOrchestrationChanged` is always `false`
* `safePatchEngineOnly` is always `true`

v7.7 deterministic checks:

* governance-autonomy-observability-preview-unit
* governance-autonomy-observability-preview-missing
* governance-autonomy-observability-preview-not-ready
* governance-autonomy-observability-preview-ready
* governance-autonomy-observability-preview-blocked
* governance-autonomy-observability-preview-alerts
* governance-autonomy-observability-preview-audit-events
* governance-autonomy-observability-preview-json-output
* governance-autonomy-observability-preview-artifact
* governance-autonomy-observability-preview-no-observability-application
* governance-autonomy-observability-preview-no-autonomy

## Controlled Autonomy Control Plane Preview (v7.8)

v7.8 generates a deterministic controlled-autonomy control plane preview from the observability preview without applying control plane behavior, activating kill switches, or enabling autonomy.

CLI usage:

```bash
node dist/cli.js governance autonomy control-plane-preview
node dist/cli.js governance autonomy control-plane-preview --json
```

Generated artifacts:

```text
.factory/governance/autonomy-control-plane-preview.json
.factory/governance/autonomy-control-plane-preview.md
```

The controlled autonomy control plane preview:

* reuses deterministic autonomy observability preview logic
* documents future operator controls
* documents future kill-switch candidates
* documents future approval controls
* documents future sandbox controls
* documents future scope controls
* documents future observability controls
* summarizes missing control coverage
* assigns deterministic IDs such as `gov-control-plane-killswitch-001`
* does not apply control plane behavior
* does not enforce control plane behavior
* does not activate kill switches
* does not apply operator overrides
* does not apply sandbox, scope, or observability controls
* does not enable autonomy
* does not allow autonomous actions
* does not activate runtime governance
* does not activate policies
* does not enforce governance
* does not change runtime behavior or repair orchestration

Example human output fields:

```text
Preview status:
created

Control plane conclusion:
control-plane-ready-preview

Control plane applied:
false

Kill switch activated:
false

Autonomy enabled:
false

Kill switch candidate count:
11
```

Example JSON fields:

* `previewStatus`
* `sourceObservabilityStatus`
* `controlPlaneConclusion`
* `controlPlaneApplied`
* `controlPlaneEnforced`
* `killSwitchActivated`
* `operatorOverrideApplied`
* `sandboxControlApplied`
* `scopeControlApplied`
* `observabilityControlApplied`
* `operatorControls`
* `killSwitchCandidates`
* `approvalControls`
* `sandboxControls`
* `scopeControls`
* `observabilityControls`
* `missingControlCoverage`
* `summary`
* `recommendedNextStage`

Example markdown control-plane-preview shape:

```markdown
# AI Software Factory - Controlled Autonomy Control Plane Preview

## Operator Controls

## Kill Switch Candidates

## Approval Controls

## Sandbox Controls

## Scope Controls

## Observability Controls

## Missing Control Coverage

## Warnings
```

Safety guarantees:

* `controlPlaneApplied` is always `false`
* `controlPlaneEnforced` is always `false`
* `killSwitchActivated` is always `false`
* `operatorOverrideApplied` is always `false`
* `sandboxControlApplied` is always `false`
* `scopeControlApplied` is always `false`
* `observabilityControlApplied` is always `false`
* `observabilityApplied` is always `false`
* `observabilityEnforced` is always `false`
* `sandboxCreated` is always `false`
* `sandboxExecuted` is always `false`
* `autonomyEnabled` is always `false`
* `autonomousActionsAllowed` is always `false`
* `autonomyApplied` is always `false`
* `autonomyEnforced` is always `false`
* `runtimeActivationEnabled` is always `false`
* `policyActivated` is always `false`
* `guardedActivationEnabled` is always `false`
* `activationEnforced` is always `false`
* `governanceBypassAllowed` is always `false`
* `applied` is always `false`
* `enforced` is always `false`
* `runtimeBehaviorChanged` is always `false`
* `governanceDecisionsChanged` is always `false`
* `repairOrchestrationChanged` is always `false`
* `safePatchEngineOnly` is always `true`

v7.8 deterministic checks:

* governance-autonomy-control-plane-preview-unit
* governance-autonomy-control-plane-preview-missing
* governance-autonomy-control-plane-preview-not-ready
* governance-autonomy-control-plane-preview-ready
* governance-autonomy-control-plane-preview-blocked
* governance-autonomy-control-plane-preview-killswitches
* governance-autonomy-control-plane-preview-operator-controls
* governance-autonomy-control-plane-preview-json-output
* governance-autonomy-control-plane-preview-artifact
* governance-autonomy-control-plane-preview-no-control-application
* governance-autonomy-control-plane-preview-no-autonomy

## Controlled Autonomy Governance Lifecycle Preview (v7.9)

v7.9 generates a deterministic controlled-autonomy governance lifecycle preview from the control plane preview without applying lifecycle behavior, executing lifecycle transitions, or enabling autonomy.

CLI usage:

```bash
node dist/cli.js governance autonomy lifecycle-preview
node dist/cli.js governance autonomy lifecycle-preview --json
```

Generated artifacts:

```text
.factory/governance/autonomy-lifecycle-preview.json
.factory/governance/autonomy-lifecycle-preview.md
```

The controlled autonomy governance lifecycle preview:

* reuses deterministic autonomy control plane preview logic
* consolidates the full v7.x controlled-autonomy preview chain
* documents lifecycle stages
* documents lifecycle transition definitions
* documents permanently forbidden transitions
* documents lifecycle blockers
* documents rollback planning notes
* assigns deterministic IDs such as `gov-lifecycle-stage-001`
* does not apply lifecycle behavior
* does not enforce lifecycle behavior
* does not execute lifecycle transitions
* does not execute rollback
* does not activate kill switches
* does not create or execute sandboxes
* does not apply observability
* does not accept risks or apply mitigations
* does not approve scope, grant human approval, or approve design review
* does not enable autonomy
* does not allow autonomous actions
* does not enforce governance
* does not change runtime behavior or repair orchestration

Example human output fields:

```text
Preview status:
created

Lifecycle conclusion:
lifecycle-ready-preview

Lifecycle applied:
false

Lifecycle transition executed:
false

Autonomy enabled:
false

Rollback step count:
9
```

Example JSON fields:

* `previewStatus`
* `sourceControlPlaneStatus`
* `lifecycleConclusion`
* `lifecycleApplied`
* `lifecycleEnforced`
* `lifecycleTransitionExecuted`
* `lifecycleStages`
* `lifecycleTransitions`
* `lifecycleBlockers`
* `rollbackPlan`
* `summary`
* `recommendedNextStage`

Example markdown lifecycle-preview shape:

```markdown
# AI Software Factory - Controlled Autonomy Governance Lifecycle Preview

## Lifecycle Stages

## Lifecycle Transitions

## Lifecycle Blockers

## Rollback Plan

## Warnings
```

Safety guarantees:

* `lifecycleApplied` is always `false`
* `lifecycleEnforced` is always `false`
* `lifecycleTransitionExecuted` is always `false`
* `controlPlaneApplied` is always `false`
* `controlPlaneEnforced` is always `false`
* `killSwitchActivated` is always `false`
* `operatorOverrideApplied` is always `false`
* `sandboxCreated` is always `false`
* `sandboxExecuted` is always `false`
* `observabilityApplied` is always `false`
* `riskAccepted` is always `false`
* `riskMitigationApplied` is always `false`
* `scopeApproved` is always `false`
* `scopeApplied` is always `false`
* `humanApprovalGranted` is always `false`
* `approvalApplied` is always `false`
* `designReviewApproved` is always `false`
* `runtimeActivationEnabled` is always `false`
* `policyActivated` is always `false`
* `guardedActivationEnabled` is always `false`
* `activationEnforced` is always `false`
* `autonomyEnabled` is always `false`
* `autonomousActionsAllowed` is always `false`
* `autonomyApplied` is always `false`
* `autonomyEnforced` is always `false`
* `governanceBypassAllowed` is always `false`
* `applied` is always `false`
* `enforced` is always `false`
* `runtimeBehaviorChanged` is always `false`
* `governanceDecisionsChanged` is always `false`
* `repairOrchestrationChanged` is always `false`
* `safePatchEngineOnly` is always `true`
* rollback planning is planning-only: `rollbackAvailable` and `rollbackExecuted` are always `false`

v7.9 deterministic checks:

* governance-autonomy-lifecycle-preview-unit
* governance-autonomy-lifecycle-preview-missing
* governance-autonomy-lifecycle-preview-not-ready
* governance-autonomy-lifecycle-preview-ready
* governance-autonomy-lifecycle-preview-blocked
* governance-autonomy-lifecycle-preview-forbidden-transitions
* governance-autonomy-lifecycle-preview-rollback-plan
* governance-autonomy-lifecycle-preview-json-output
* governance-autonomy-lifecycle-preview-artifact
* governance-autonomy-lifecycle-preview-no-lifecycle-application
* governance-autonomy-lifecycle-preview-no-autonomy

## Runtime Safety Design Preview (v8.0)

v8.0 begins the runtime safety architecture phase by generating a deterministic runtime safety design preview from the controlled-autonomy lifecycle preview. It is preview-only: runtime governance is not enabled, runtime autonomy is not enabled, runtime policies are not enforced, and runtime behavior does not change.

CLI usage:

```bash
node dist/cli.js governance runtime safety-design-preview
node dist/cli.js governance runtime safety-design-preview --json
```

Generated artifacts:

```text
.factory/governance/runtime-safety-design-preview.json
.factory/governance/runtime-safety-design-preview.md
```

The runtime safety design preview:

* reuses deterministic autonomy lifecycle preview logic
* inspects the complete governance and autonomy preview chain
* documents runtime safety architecture sections
* documents runtime safety boundaries
* documents preserved runtime safety invariants
* documents required runtime safety gates
* documents permanently forbidden runtime capabilities
* documents rollback-preparation concepts
* assigns deterministic IDs such as `gov-runtime-safety-gate-001`
* does not activate runtime governance
* does not enable runtime autonomy
* does not apply runtime controls
* does not enforce runtime policies
* does not activate runtime config
* does not execute runtime sandboxes
* does not enable plugins, scripts, runtime learning, ML decisioning, or multi-agent coordination
* does not change runtime behavior, governance decisions, repair orchestration, or Safe Patch Engine behavior

Example human output fields:

```text
Preview status:
created

Runtime safety conclusion:
runtime-safety-ready-preview

Runtime safety activated:
false

Runtime governance enabled:
false

Runtime autonomy enabled:
false

Runtime policy enforcement enabled:
false

Runtime sandbox executed:
false

Runtime safety ready for future review:
true
```

Example JSON fields:

* `previewStatus`
* `sourceLifecycleStatus`
* `runtimeSafetyConclusion`
* `runtimeSafetyApplied`
* `runtimeSafetyActivated`
* `runtimeGovernanceEnabled`
* `runtimeAutonomyEnabled`
* `runtimePolicyEnforcementEnabled`
* `runtimeConfigActivationEnabled`
* `runtimeSafetyArchitecture`
* `runtimeSafetyBoundaries`
* `runtimeSafetyInvariants`
* `runtimeSafetyGates`
* `forbiddenRuntimeCapabilities`
* `rollbackPreparationConcepts`
* `summary`
* `recommendedNextStage`

Example markdown runtime-safety-preview shape:

```markdown
# AI Software Factory - Runtime Safety Design Preview

## Runtime Safety Architecture

## Runtime Safety Boundaries

## Runtime Safety Invariants

## Runtime Safety Gates

## Forbidden Runtime Capabilities

## Rollback Preparation Concepts

## Warnings
```

Safety guarantees:

* `runtimeSafetyApplied` is always `false`
* `runtimeSafetyEnforced` is always `false`
* `runtimeSafetyActivated` is always `false`
* `runtimeGovernanceEnabled` is always `false`
* `runtimeAutonomyEnabled` is always `false`
* `runtimeAutonomyActionsAllowed` is always `false`
* `runtimePolicyEnforcementEnabled` is always `false`
* `runtimeConfigActivationEnabled` is always `false`
* `runtimeOverrideApplied` is always `false`
* `runtimeControlPlaneApplied` is always `false`
* `runtimeKillSwitchActivated` is always `false`
* `runtimeSandboxExecutionAllowed` is always `false`
* `runtimeSandboxExecuted` is always `false`
* `runtimeMutationScopeExpanded` is always `false`
* `runtimeExternalExecutionAllowed` is always `false`
* `runtimePluginExecutionAllowed` is always `false`
* `runtimeScriptEvaluationAllowed` is always `false`
* `runtimeLearningEnabled` is always `false`
* `runtimeMlDecisioningEnabled` is always `false`
* `runtimeMultiAgentCoordinationEnabled` is always `false`
* `governanceBypassAllowed` is always `false`
* `applied` is always `false`
* `enforced` is always `false`
* `policyRuntimeMode` is always `preview-only`
* `runtimeBehaviorChanged` is always `false`
* `governanceDecisionsChanged` is always `false`
* `repairOrchestrationChanged` is always `false`
* `safePatchEngineOnly` is always `true`

v8.0 deterministic checks:

* governance-runtime-safety-design-preview-unit
* governance-runtime-safety-design-preview-missing
* governance-runtime-safety-design-preview-not-ready
* governance-runtime-safety-design-preview-ready
* governance-runtime-safety-design-preview-blocked
* governance-runtime-safety-design-preview-boundaries
* governance-runtime-safety-design-preview-invariants
* governance-runtime-safety-design-preview-forbidden-capabilities
* governance-runtime-safety-design-preview-json-output
* governance-runtime-safety-design-preview-artifact
* governance-runtime-safety-design-preview-no-runtime-activation
* governance-runtime-safety-design-preview-no-autonomy

## Runtime Safety Evidence Preview (v8.1)

v8.1 generates deterministic runtime safety evidence previews from the runtime safety design preview. It is preview-only: runtime safety evidence is not applied, runtime governance is not enabled, runtime autonomy is not enabled, runtime policies are not enforced, and runtime behavior does not change.

CLI usage:

```bash
node dist/cli.js governance runtime safety-evidence-preview
node dist/cli.js governance runtime safety-evidence-preview --json
```

Generated artifacts:

```text
.factory/governance/runtime-safety-evidence-preview.json
.factory/governance/runtime-safety-evidence-preview.md
```

The runtime safety evidence preview:

* reuses deterministic runtime safety design preview logic
* inspects runtime safety architecture sections
* inspects runtime safety boundaries
* inspects runtime safety invariants
* inspects runtime safety gates
* inspects forbidden runtime capabilities
* inspects rollback-preparation concepts
* documents runtime safety evidence sections
* documents runtime safety evidence references
* documents missing runtime safety evidence
* assigns deterministic IDs such as `gov-runtime-evidence-ref-001`
* does not apply runtime safety evidence
* does not activate runtime governance
* does not enable runtime autonomy
* does not apply runtime safety controls
* does not enforce runtime policies
* does not activate runtime config
* does not execute runtime sandboxes
* does not enable plugins, scripts, runtime learning, ML decisioning, or multi-agent coordination
* does not change runtime behavior, governance decisions, repair orchestration, or Safe Patch Engine behavior

Example human output fields:

```text
Preview status:
created

Runtime safety evidence conclusion:
runtime-safety-evidence-ready-preview

Runtime safety evidence applied:
false

Runtime governance enabled:
false

Runtime autonomy enabled:
false

Runtime policy enforcement enabled:
false

Evidence reference count:
4

Runtime safety evidence ready for future review:
true
```

Example JSON fields:

* `previewStatus`
* `sourceRuntimeSafetyStatus`
* `runtimeSafetyEvidenceConclusion`
* `runtimeSafetyApplied`
* `runtimeSafetyEvidenceApplied`
* `runtimeSafetyEvidenceEnforced`
* `runtimeGovernanceEnabled`
* `runtimeAutonomyEnabled`
* `runtimePolicyEnforcementEnabled`
* `runtimeConfigActivationEnabled`
* `runtimeSafetyEvidenceSections`
* `runtimeSafetyEvidenceReferences`
* `missingRuntimeSafetyEvidence`
* `summary`
* `recommendedNextStage`

Example markdown runtime-safety-evidence-preview shape:

```markdown
# AI Software Factory - Runtime Safety Evidence Preview

## Runtime Safety Evidence Sections

## Runtime Safety Evidence References

## Missing Runtime Safety Evidence

## Warnings
```

Safety guarantees:

* `runtimeSafetyApplied` is always `false`
* `runtimeSafetyEnforced` is always `false`
* `runtimeSafetyActivated` is always `false`
* `runtimeSafetyEvidenceApplied` is always `false`
* `runtimeSafetyEvidenceEnforced` is always `false`
* `runtimeGovernanceEnabled` is always `false`
* `runtimeAutonomyEnabled` is always `false`
* `runtimeAutonomyActionsAllowed` is always `false`
* `runtimePolicyEnforcementEnabled` is always `false`
* `runtimeConfigActivationEnabled` is always `false`
* `runtimeOverrideApplied` is always `false`
* `runtimeControlPlaneApplied` is always `false`
* `runtimeKillSwitchActivated` is always `false`
* `runtimeSandboxExecutionAllowed` is always `false`
* `runtimeSandboxExecuted` is always `false`
* `runtimeMutationScopeExpanded` is always `false`
* `runtimeExternalExecutionAllowed` is always `false`
* `runtimePluginExecutionAllowed` is always `false`
* `runtimeScriptEvaluationAllowed` is always `false`
* `runtimeLearningEnabled` is always `false`
* `runtimeMlDecisioningEnabled` is always `false`
* `runtimeMultiAgentCoordinationEnabled` is always `false`
* `governanceBypassAllowed` is always `false`
* `applied` is always `false`
* `enforced` is always `false`
* `policyRuntimeMode` is always `preview-only`
* `runtimeBehaviorChanged` is always `false`
* `governanceDecisionsChanged` is always `false`
* `repairOrchestrationChanged` is always `false`
* `safePatchEngineOnly` is always `true`

v8.1 deterministic checks:

* governance-runtime-safety-evidence-preview-unit
* governance-runtime-safety-evidence-preview-missing
* governance-runtime-safety-evidence-preview-not-ready
* governance-runtime-safety-evidence-preview-ready
* governance-runtime-safety-evidence-preview-blocked
* governance-runtime-safety-evidence-preview-references
* governance-runtime-safety-evidence-preview-missing-evidence
* governance-runtime-safety-evidence-preview-json-output
* governance-runtime-safety-evidence-preview-artifact
* governance-runtime-safety-evidence-preview-no-runtime-activation
* governance-runtime-safety-evidence-preview-no-autonomy

## Runtime Safety Observability Preview (v8.2)

v8.2 generates deterministic runtime-level observability previews from the runtime safety evidence preview. It is preview-only: runtime observability is not applied, telemetry is not executed, runtime governance is not enabled, runtime autonomy is not enabled, runtime policies are not enforced, and runtime behavior does not change.

CLI usage:

```bash
node dist/cli.js governance runtime safety-observability-preview
node dist/cli.js governance runtime safety-observability-preview --json
```

Generated artifacts:

```text
.factory/governance/runtime-safety-observability-preview.json
.factory/governance/runtime-safety-observability-preview.md
```

The runtime safety observability preview:

* reuses deterministic runtime safety evidence preview logic
* inspects runtime safety evidence sections
* documents runtime telemetry signal definitions
* documents runtime audit event definitions
* documents runtime safety alert definitions
* documents runtime operator visibility requirements
* documents runtime invariant monitoring definitions
* documents runtime rollback visibility definitions
* assigns deterministic IDs such as `gov-runtime-observability-signal-001`
* does not apply runtime observability
* does not execute runtime telemetry
* does not create telemetry pipelines, event streams, or observability backends
* does not activate runtime governance
* does not enable runtime autonomy
* does not apply runtime safety controls
* does not enforce runtime policies
* does not activate runtime config
* does not execute runtime sandboxes
* does not enable plugins, scripts, runtime learning, ML decisioning, or multi-agent coordination
* does not change runtime behavior, governance decisions, repair orchestration, or Safe Patch Engine behavior

Example human output fields:

```text
Preview status:
created

Runtime safety observability conclusion:
runtime-safety-observability-ready-preview

Runtime observability applied:
false

Runtime governance enabled:
false

Runtime autonomy enabled:
false

Runtime policy enforcement enabled:
false

Telemetry signal count:
14

Runtime safety observability ready for future review:
true
```

Example JSON fields:

* `previewStatus`
* `sourceRuntimeSafetyEvidenceStatus`
* `runtimeSafetyObservabilityConclusion`
* `runtimeObservabilityApplied`
* `runtimeObservabilityEnforced`
* `runtimeObservabilityActivated`
* `runtimeGovernanceEnabled`
* `runtimeAutonomyEnabled`
* `runtimePolicyEnforcementEnabled`
* `runtimeConfigActivationEnabled`
* `runtimeTelemetrySignals`
* `runtimeAuditEvents`
* `runtimeSafetyAlerts`
* `runtimeOperatorVisibilityRequirements`
* `runtimeInvariantMonitoringDefinitions`
* `runtimeRollbackVisibilityDefinitions`
* `summary`
* `recommendedNextStage`

Example markdown runtime-safety-observability-preview shape:

```markdown
# AI Software Factory - Runtime Safety Observability Preview

## Runtime Telemetry Signals

## Runtime Audit Events

## Runtime Safety Alerts

## Runtime Operator Visibility Requirements

## Runtime Invariant Monitoring Definitions

## Runtime Rollback Visibility Definitions

## Warnings
```

Safety guarantees:

* `runtimeObservabilityApplied` is always `false`
* `runtimeObservabilityEnforced` is always `false`
* `runtimeObservabilityActivated` is always `false`
* `runtimeSafetyApplied` is always `false`
* `runtimeSafetyEnforced` is always `false`
* `runtimeSafetyActivated` is always `false`
* `runtimeGovernanceEnabled` is always `false`
* `runtimeAutonomyEnabled` is always `false`
* `runtimeAutonomyActionsAllowed` is always `false`
* `runtimePolicyEnforcementEnabled` is always `false`
* `runtimeConfigActivationEnabled` is always `false`
* `runtimeControlPlaneApplied` is always `false`
* `runtimeKillSwitchActivated` is always `false`
* `runtimeSandboxExecutionAllowed` is always `false`
* `runtimeSandboxExecuted` is always `false`
* `runtimeMutationScopeExpanded` is always `false`
* `runtimeExternalExecutionAllowed` is always `false`
* `runtimePluginExecutionAllowed` is always `false`
* `runtimeScriptEvaluationAllowed` is always `false`
* `runtimeLearningEnabled` is always `false`
* `runtimeMlDecisioningEnabled` is always `false`
* `runtimeMultiAgentCoordinationEnabled` is always `false`
* `governanceBypassAllowed` is always `false`
* `applied` is always `false`
* `enforced` is always `false`
* `policyRuntimeMode` is always `preview-only`
* `runtimeBehaviorChanged` is always `false`
* `governanceDecisionsChanged` is always `false`
* `repairOrchestrationChanged` is always `false`
* `safePatchEngineOnly` is always `true`

v8.2 deterministic checks:

* governance-runtime-safety-observability-preview-unit
* governance-runtime-safety-observability-preview-missing
* governance-runtime-safety-observability-preview-not-ready
* governance-runtime-safety-observability-preview-ready
* governance-runtime-safety-observability-preview-blocked
* governance-runtime-safety-observability-preview-alerts
* governance-runtime-safety-observability-preview-monitoring
* governance-runtime-safety-observability-preview-json-output
* governance-runtime-safety-observability-preview-artifact
* governance-runtime-safety-observability-preview-no-runtime-activation
* governance-runtime-safety-observability-preview-no-autonomy

## Runtime Control Plane Preview (v8.3)

v8.3 generates deterministic runtime-level control plane previews from the runtime safety observability preview. It is preview-only: runtime control plane behavior is not applied, kill switches are not activated, emergency stops are not executed, runtime governance is not enabled, runtime autonomy is not enabled, runtime policies are not enforced, and runtime behavior does not change.

CLI usage:

```bash
node dist/cli.js governance runtime control-plane-preview
node dist/cli.js governance runtime control-plane-preview --json
```

Generated artifacts:

```text
.factory/governance/runtime-control-plane-preview.json
.factory/governance/runtime-control-plane-preview.md
```

The runtime control plane preview:

* reuses deterministic runtime safety observability preview logic
* inspects runtime telemetry signal definitions
* inspects runtime safety alerts
* documents runtime operator control definitions
* documents runtime freeze control definitions
* documents runtime emergency-stop definitions
* documents runtime rollback control definitions
* documents runtime override control definitions
* documents runtime kill-switch candidate definitions
* assigns deterministic IDs such as `gov-runtime-control-killswitch-001`
* does not apply runtime control plane behavior
* does not activate kill switches
* does not execute emergency stops
* does not execute rollback
* does not apply operator overrides
* does not activate runtime governance
* does not enable runtime autonomy
* does not enforce runtime policies
* does not activate runtime config
* does not execute runtime sandboxes
* does not enable plugins, scripts, runtime learning, ML decisioning, or multi-agent coordination
* does not change runtime behavior, governance decisions, repair orchestration, or Safe Patch Engine behavior

Example human output fields:

```text
Preview status:
created

Runtime control plane conclusion:
runtime-control-plane-ready-preview

Runtime control plane applied:
false

Runtime kill switch activated:
false

Runtime emergency stop executed:
false

Runtime governance enabled:
false

Runtime autonomy enabled:
false

Kill-switch candidate count:
10

Runtime control plane ready for future review:
true
```

Example JSON fields:

* `previewStatus`
* `sourceRuntimeObservabilityStatus`
* `runtimeControlPlaneConclusion`
* `runtimeControlPlaneApplied`
* `runtimeControlPlaneActivated`
* `runtimeKillSwitchActivated`
* `runtimeEmergencyStopExecuted`
* `runtimeOperatorOverrideApplied`
* `runtimeRollbackExecuted`
* `runtimeGovernanceEnabled`
* `runtimeAutonomyEnabled`
* `runtimePolicyEnforcementEnabled`
* `runtimeOperatorControls`
* `runtimeFreezeControls`
* `runtimeEmergencyStops`
* `runtimeRollbackControls`
* `runtimeOverrideControls`
* `runtimeKillSwitchCandidates`
* `summary`
* `recommendedNextStage`

Example markdown runtime-control-plane-preview shape:

```markdown
# AI Software Factory - Runtime Control Plane Preview

## Runtime Operator Controls

## Runtime Freeze Controls

## Runtime Emergency Stops

## Runtime Rollback Controls

## Runtime Override Controls

## Runtime Kill-Switch Candidates

## Warnings
```

Safety guarantees:

* `runtimeControlPlaneApplied` is always `false`
* `runtimeControlPlaneEnforced` is always `false`
* `runtimeControlPlaneActivated` is always `false`
* `runtimeKillSwitchActivated` is always `false`
* `runtimeEmergencyStopExecuted` is always `false`
* `runtimeOperatorOverrideApplied` is always `false`
* `runtimeRollbackExecuted` is always `false`
* `runtimeObservabilityApplied` is always `false`
* `runtimeObservabilityEnforced` is always `false`
* `runtimeSafetyApplied` is always `false`
* `runtimeSafetyEnforced` is always `false`
* `runtimeSafetyActivated` is always `false`
* `runtimeGovernanceEnabled` is always `false`
* `runtimeAutonomyEnabled` is always `false`
* `runtimeAutonomyActionsAllowed` is always `false`
* `runtimePolicyEnforcementEnabled` is always `false`
* `runtimeConfigActivationEnabled` is always `false`
* `runtimeSandboxExecutionAllowed` is always `false`
* `runtimeSandboxExecuted` is always `false`
* `runtimeMutationScopeExpanded` is always `false`
* `runtimeExternalExecutionAllowed` is always `false`
* `runtimePluginExecutionAllowed` is always `false`
* `runtimeScriptEvaluationAllowed` is always `false`
* `runtimeLearningEnabled` is always `false`
* `runtimeMlDecisioningEnabled` is always `false`
* `runtimeMultiAgentCoordinationEnabled` is always `false`
* `governanceBypassAllowed` is always `false`
* `applied` is always `false`
* `enforced` is always `false`
* `policyRuntimeMode` is always `preview-only`
* `runtimeBehaviorChanged` is always `false`
* `governanceDecisionsChanged` is always `false`
* `repairOrchestrationChanged` is always `false`
* `safePatchEngineOnly` is always `true`

v8.3 deterministic checks:

* governance-runtime-control-plane-preview-unit
* governance-runtime-control-plane-preview-missing
* governance-runtime-control-plane-preview-not-ready
* governance-runtime-control-plane-preview-ready
* governance-runtime-control-plane-preview-blocked
* governance-runtime-control-plane-preview-emergency-stops
* governance-runtime-control-plane-preview-killswitches
* governance-runtime-control-plane-preview-json-output
* governance-runtime-control-plane-preview-artifact
* governance-runtime-control-plane-preview-no-runtime-activation
* governance-runtime-control-plane-preview-no-autonomy

## Runtime Governance Lifecycle Preview (v8.4)

v8.4 generates deterministic runtime governance lifecycle previews from the runtime control plane preview. It is preview-only: runtime lifecycle behavior is not applied, lifecycle transitions are not executed, runtime governance is not enabled, runtime autonomy is not enabled, runtime policies are not enforced, and runtime behavior does not change.

CLI usage:

```bash
node dist/cli.js governance runtime lifecycle-preview
node dist/cli.js governance runtime lifecycle-preview --json
```

Generated artifacts:

```text
.factory/governance/runtime-lifecycle-preview.json
.factory/governance/runtime-lifecycle-preview.md
```

The runtime governance lifecycle preview:

* reuses deterministic runtime control plane preview logic
* inspects the complete v8.x runtime preview chain
* documents deterministic runtime lifecycle stages
* documents deterministic runtime lifecycle transitions
* documents deterministic runtime lifecycle blockers
* documents deterministic runtime rollback lifecycle planning
* assigns deterministic IDs such as `gov-runtime-lifecycle-transition-001`
* does not apply runtime lifecycle behavior
* does not execute lifecycle transitions
* does not activate runtime governance
* does not enable runtime autonomy
* does not enforce runtime policies
* does not activate runtime config
* does not execute runtime sandboxes
* does not activate kill switches, emergency stops, rollback, or operator overrides
* does not enable plugins, scripts, runtime learning, ML decisioning, or multi-agent coordination
* does not change runtime behavior, governance decisions, repair orchestration, or Safe Patch Engine behavior

Example human output fields:

```text
Preview status:
created

Runtime lifecycle conclusion:
runtime-lifecycle-ready-preview

Runtime lifecycle applied:
false

Runtime lifecycle transition executed:
false

Runtime governance enabled:
false

Runtime autonomy enabled:
false

Lifecycle transition count:
13

Rollback step count:
7

Runtime lifecycle ready for future review:
true
```

Example JSON fields:

* `previewStatus`
* `sourceRuntimeControlPlaneStatus`
* `runtimeLifecycleConclusion`
* `runtimeLifecycleApplied`
* `runtimeLifecycleEnforced`
* `runtimeLifecycleTransitionExecuted`
* `runtimeKillSwitchActivated`
* `runtimeEmergencyStopExecuted`
* `runtimeOperatorOverrideApplied`
* `runtimeRollbackExecuted`
* `runtimeGovernanceEnabled`
* `runtimeAutonomyEnabled`
* `runtimePolicyEnforcementEnabled`
* `runtimeLifecycleStages`
* `runtimeLifecycleTransitions`
* `runtimeLifecycleBlockers`
* `runtimeRollbackLifecyclePlan`
* `summary`
* `recommendedNextStage`

Example markdown runtime-lifecycle-preview shape:

```markdown
# AI Software Factory - Runtime Governance Lifecycle Preview

## Runtime Lifecycle Stages

## Runtime Lifecycle Transitions

## Runtime Lifecycle Blockers

## Runtime Rollback Lifecycle Plan

## Warnings
```

Safety guarantees:

* `runtimeLifecycleApplied` is always `false`
* `runtimeLifecycleEnforced` is always `false`
* `runtimeLifecycleTransitionExecuted` is always `false`
* `runtimeControlPlaneApplied` is always `false`
* `runtimeControlPlaneEnforced` is always `false`
* `runtimeControlPlaneActivated` is always `false`
* `runtimeKillSwitchActivated` is always `false`
* `runtimeEmergencyStopExecuted` is always `false`
* `runtimeOperatorOverrideApplied` is always `false`
* `runtimeRollbackExecuted` is always `false`
* `runtimeObservabilityApplied` is always `false`
* `runtimeObservabilityEnforced` is always `false`
* `runtimeSafetyApplied` is always `false`
* `runtimeSafetyEnforced` is always `false`
* `runtimeSafetyActivated` is always `false`
* `runtimeGovernanceEnabled` is always `false`
* `runtimeAutonomyEnabled` is always `false`
* `runtimeAutonomyActionsAllowed` is always `false`
* `runtimePolicyEnforcementEnabled` is always `false`
* `runtimeConfigActivationEnabled` is always `false`
* `runtimeSandboxExecutionAllowed` is always `false`
* `runtimeSandboxExecuted` is always `false`
* `runtimeMutationScopeExpanded` is always `false`
* `runtimeExternalExecutionAllowed` is always `false`
* `runtimePluginExecutionAllowed` is always `false`
* `runtimeScriptEvaluationAllowed` is always `false`
* `runtimeLearningEnabled` is always `false`
* `runtimeMlDecisioningEnabled` is always `false`
* `runtimeMultiAgentCoordinationEnabled` is always `false`
* `governanceBypassAllowed` is always `false`
* `applied` is always `false`
* `enforced` is always `false`
* `policyRuntimeMode` is always `preview-only`
* `runtimeBehaviorChanged` is always `false`
* `governanceDecisionsChanged` is always `false`
* `repairOrchestrationChanged` is always `false`
* `safePatchEngineOnly` is always `true`

v8.4 deterministic checks:

* governance-runtime-lifecycle-preview-unit
* governance-runtime-lifecycle-preview-missing
* governance-runtime-lifecycle-preview-not-ready
* governance-runtime-lifecycle-preview-ready
* governance-runtime-lifecycle-preview-blocked
* governance-runtime-lifecycle-preview-forbidden-transitions
* governance-runtime-lifecycle-preview-rollback-plan
* governance-runtime-lifecycle-preview-json-output
* governance-runtime-lifecycle-preview-artifact
* governance-runtime-lifecycle-preview-no-runtime-activation
* governance-runtime-lifecycle-preview-no-autonomy

## Runtime Activation Readiness Preview (v8.5)

v8.5 generates deterministic runtime activation readiness previews from the runtime governance lifecycle preview. It is preview-only: runtime activation is not executed, runtime governance is not enabled, runtime autonomy is not enabled, runtime policies are not enforced, and runtime behavior does not change.

CLI usage:

```bash
node dist/cli.js governance runtime activation-readiness-preview
node dist/cli.js governance runtime activation-readiness-preview --json
```

Generated artifacts:

```text
.factory/governance/runtime-activation-readiness-preview.json
.factory/governance/runtime-activation-readiness-preview.md
```

The runtime activation readiness preview:

* reuses deterministic runtime lifecycle preview logic
* inspects the complete runtime governance lifecycle chain
* documents deterministic runtime activation readiness scoring
* documents deterministic activation prerequisites
* documents deterministic activation blockers
* documents deterministic activation freeze conditions
* documents deterministic forbidden activation paths
* documents deterministic rollback readiness planning
* assigns deterministic IDs such as `gov-runtime-activation-forbidden-001`
* never produces a v8.x readiness score of `100`
* does not execute runtime activation
* does not enable runtime governance
* does not enable runtime autonomy
* does not allow autonomous actions
* does not enforce runtime policies
* does not activate runtime config
* does not execute runtime sandboxes
* does not activate kill switches, emergency stops, rollback, or operator overrides
* does not enable plugins, scripts, runtime learning, ML decisioning, or multi-agent coordination
* does not change runtime behavior, governance decisions, repair orchestration, or Safe Patch Engine behavior

Example human output fields:

```text
Preview status:
created

Runtime activation readiness conclusion:
ready-for-future-review

Runtime activation readiness applied:
false

Runtime activation executed:
false

Runtime governance enabled:
false

Runtime autonomy enabled:
false

Readiness score:
80

Readiness rating:
future-review-ready

Forbidden path count:
11

Runtime ready for future review:
true
```

Example JSON fields:

* `previewStatus`
* `sourceRuntimeLifecycleStatus`
* `runtimeActivationReadinessConclusion`
* `runtimeActivationReadinessApplied`
* `runtimeActivationReadinessEnforced`
* `runtimeActivationExecuted`
* `runtimeGovernanceEnabled`
* `runtimeAutonomyEnabled`
* `runtimePolicyEnforcementEnabled`
* `readinessScore`
* `activationPrerequisites`
* `activationBlockers`
* `activationFreezeConditions`
* `forbiddenActivationPaths`
* `rollbackReadinessPlanning`
* `summary`
* `recommendedNextStage`

Example markdown runtime-activation-readiness-preview shape:

```markdown
# AI Software Factory - Runtime Activation Readiness Preview

## Activation Prerequisites

## Activation Blockers

## Activation Freeze Conditions

## Forbidden Activation Paths

## Rollback Readiness Planning

## Warnings
```

Safety guarantees:

* `runtimeActivationReadinessApplied` is always `false`
* `runtimeActivationReadinessEnforced` is always `false`
* `runtimeActivationExecuted` is always `false`
* `runtimeGovernanceEnabled` is always `false`
* `runtimeAutonomyEnabled` is always `false`
* `runtimeAutonomyActionsAllowed` is always `false`
* `runtimePolicyEnforcementEnabled` is always `false`
* `runtimeConfigActivationEnabled` is always `false`
* `runtimeControlPlaneApplied` is always `false`
* `runtimeControlPlaneActivated` is always `false`
* `runtimeKillSwitchActivated` is always `false`
* `runtimeEmergencyStopExecuted` is always `false`
* `runtimeOperatorOverrideApplied` is always `false`
* `runtimeRollbackExecuted` is always `false`
* `runtimeObservabilityApplied` is always `false`
* `runtimeObservabilityEnforced` is always `false`
* `runtimeSafetyApplied` is always `false`
* `runtimeSafetyEnforced` is always `false`
* `runtimeSafetyActivated` is always `false`
* `runtimeSandboxExecutionAllowed` is always `false`
* `runtimeSandboxExecuted` is always `false`
* `runtimeMutationScopeExpanded` is always `false`
* `runtimeExternalExecutionAllowed` is always `false`
* `runtimePluginExecutionAllowed` is always `false`
* `runtimeScriptEvaluationAllowed` is always `false`
* `runtimeLearningEnabled` is always `false`
* `runtimeMlDecisioningEnabled` is always `false`
* `runtimeMultiAgentCoordinationEnabled` is always `false`
* `governanceBypassAllowed` is always `false`
* `applied` is always `false`
* `enforced` is always `false`
* `policyRuntimeMode` is always `preview-only`
* `runtimeBehaviorChanged` is always `false`
* `governanceDecisionsChanged` is always `false`
* `repairOrchestrationChanged` is always `false`
* `safePatchEngineOnly` is always `true`

v8.5 deterministic checks:

* governance-runtime-activation-readiness-preview-unit
* governance-runtime-activation-readiness-preview-missing
* governance-runtime-activation-readiness-preview-not-ready
* governance-runtime-activation-readiness-preview-ready
* governance-runtime-activation-readiness-preview-blocked
* governance-runtime-activation-readiness-preview-score
* governance-runtime-activation-readiness-preview-forbidden-paths
* governance-runtime-activation-readiness-preview-json-output
* governance-runtime-activation-readiness-preview-artifact
* governance-runtime-activation-readiness-preview-no-runtime-activation
* governance-runtime-activation-readiness-preview-no-autonomy

## Runtime Safety Certification Preview (v8.6)

v8.6 generates deterministic runtime safety certification previews from the runtime activation readiness preview. It is preview-only: runtime governance is not certified for execution, runtime certification is not applied, runtime governance is not enabled, runtime autonomy is not enabled, runtime policies are not enforced, and runtime behavior does not change.

CLI usage:

```bash
node dist/cli.js governance runtime certification-preview
node dist/cli.js governance runtime certification-preview --json
```

Generated artifacts:

```text
.factory/governance/runtime-safety-certification-preview.json
.factory/governance/runtime-safety-certification-preview.md
```

The runtime safety certification preview:

* reuses deterministic runtime activation readiness preview logic
* inspects the complete runtime safety chain
* documents deterministic runtime certification domains
* documents deterministic runtime certification findings
* documents deterministic runtime certification blockers
* documents deterministic forbidden runtime capability findings
* documents deterministic certification readiness scoring
* documents deterministic certification recommendations
* assigns deterministic IDs such as `gov-runtime-cert-domain-001`
* never certifies runtime governance for execution
* never applies or enforces runtime certification
* never produces a v8.x certification score of `100`
* does not execute runtime activation
* does not enable runtime governance
* does not enable runtime autonomy
* does not allow autonomous actions
* does not enforce runtime policies
* does not activate runtime config
* does not execute runtime sandboxes
* does not activate kill switches, emergency stops, rollback, or operator overrides
* does not enable plugins, scripts, runtime learning, ML decisioning, or multi-agent coordination
* does not change runtime behavior, governance decisions, repair orchestration, or Safe Patch Engine behavior

Example human output fields:

```text
Preview status:
created

Runtime certification conclusion:
future-review-ready

Runtime certified:
false

Runtime certification applied:
false

Runtime certification enforced:
false

Runtime governance enabled:
false

Runtime autonomy enabled:
false

Certification score:
80

Certification rating:
future-review-ready

Forbidden capability finding count:
9

Future review ready:
true
```

Example JSON fields:

* `previewStatus`
* `sourceRuntimeActivationReadinessStatus`
* `runtimeCertificationConclusion`
* `runtimeCertified`
* `runtimeCertificationApplied`
* `runtimeCertificationEnforced`
* `runtimeGovernanceEnabled`
* `runtimeAutonomyEnabled`
* `runtimeActivationExecuted`
* `runtimePolicyEnforcementEnabled`
* `certificationScore`
* `certificationDomains`
* `certificationFindings`
* `certificationBlockers`
* `forbiddenCapabilityFindings`
* `certificationRecommendations`
* `summary`
* `recommendedNextStage`

Example markdown runtime-safety-certification-preview shape:

```markdown
# AI Software Factory - Runtime Safety Certification Preview

## Certification Domains

## Certification Findings

## Certification Blockers

## Forbidden Runtime Capability Findings

## Certification Recommendations

## Warnings
```

Safety guarantees:

* `runtimeCertified` is always `false`
* `runtimeCertificationApplied` is always `false`
* `runtimeCertificationEnforced` is always `false`
* `runtimeGovernanceEnabled` is always `false`
* `runtimeAutonomyEnabled` is always `false`
* `runtimeAutonomyActionsAllowed` is always `false`
* `runtimeActivationExecuted` is always `false`
* `runtimePolicyEnforcementEnabled` is always `false`
* `runtimeConfigActivationEnabled` is always `false`
* `runtimeControlPlaneApplied` is always `false`
* `runtimeControlPlaneActivated` is always `false`
* `runtimeKillSwitchActivated` is always `false`
* `runtimeEmergencyStopExecuted` is always `false`
* `runtimeOperatorOverrideApplied` is always `false`
* `runtimeRollbackExecuted` is always `false`
* `runtimeObservabilityApplied` is always `false`
* `runtimeObservabilityEnforced` is always `false`
* `runtimeSafetyApplied` is always `false`
* `runtimeSafetyEnforced` is always `false`
* `runtimeSafetyActivated` is always `false`
* `runtimeSandboxExecutionAllowed` is always `false`
* `runtimeSandboxExecuted` is always `false`
* `runtimeMutationScopeExpanded` is always `false`
* `runtimeExternalExecutionAllowed` is always `false`
* `runtimePluginExecutionAllowed` is always `false`
* `runtimeScriptEvaluationAllowed` is always `false`
* `runtimeLearningEnabled` is always `false`
* `runtimeMlDecisioningEnabled` is always `false`
* `runtimeMultiAgentCoordinationEnabled` is always `false`
* `governanceBypassAllowed` is always `false`
* `applied` is always `false`
* `enforced` is always `false`
* `policyRuntimeMode` is always `preview-only`
* `runtimeBehaviorChanged` is always `false`
* `governanceDecisionsChanged` is always `false`
* `repairOrchestrationChanged` is always `false`
* `safePatchEngineOnly` is always `true`

v8.6 deterministic checks:

* governance-runtime-safety-certification-preview-unit
* governance-runtime-safety-certification-preview-missing
* governance-runtime-safety-certification-preview-not-ready
* governance-runtime-safety-certification-preview-ready
* governance-runtime-safety-certification-preview-blocked
* governance-runtime-safety-certification-preview-score
* governance-runtime-safety-certification-preview-forbidden-capabilities
* governance-runtime-safety-certification-preview-json-output
* governance-runtime-safety-certification-preview-artifact
* governance-runtime-safety-certification-preview-no-runtime-certification
* governance-runtime-safety-certification-preview-no-autonomy

## Runtime Activation Governance Review Preview (v8.7)

v8.7 generates deterministic runtime activation governance review previews from the runtime safety certification preview. It is preview-only: runtime activation is not approved, runtime activation is not executed, runtime governance is not enabled, runtime autonomy is not enabled, runtime policies are not enforced, and runtime behavior does not change.

Commands:

```bash
node dist/cli.js governance runtime activation-governance-review-preview
node dist/cli.js governance runtime activation-governance-review-preview --json
```

Artifacts:

```text
.factory/governance/runtime-activation-governance-review-preview.json
.factory/governance/runtime-activation-governance-review-preview.md
```

The preview:

* reuses runtime safety certification preview logic
* inspects the complete runtime governance safety chain
* documents deterministic governance review sections
* documents deterministic governance review findings and blockers
* documents deterministic governance approval requirements
* documents deterministic forbidden activation findings
* documents deterministic rollback governance review planning
* never approves runtime activation
* never executes runtime activation
* never enables runtime governance
* never enables runtime autonomy
* never allows autonomous actions
* never enforces runtime policies
* never activates runtime config
* never changes runtime behavior
* never changes governance decisions
* never changes repair orchestration

Example human output:

```text
# AI Software Factory - Runtime Activation Governance Review Preview

Preview status:
created

Source runtime certification status:
created

Governance review conclusion:
future-human-review-ready

Runtime activation approved:
false

Runtime activation executed:
false

Runtime governance enabled:
false

Runtime autonomy enabled:
false

Runtime autonomy actions allowed:
false

Runtime certification applied:
false

Runtime policy enforcement enabled:
false

Runtime config activation enabled:
false

Runtime control plane applied:
false

Runtime control plane activated:
false

Runtime kill switch activated:
false

Runtime emergency stop executed:
false

Runtime operator override applied:
false

Runtime rollback executed:
false

Policy runtime mode:
preview-only

Governance review score:
80

Governance review rating:
future-human-review-ready

Future human review ready:
true

Recommended next stage:
prepare-runtime-activation-boundary-preview
```

Example JSON fields:

```json
{
  "schemaVersion": 1,
  "previewStatus": "created",
  "sourceRuntimeCertificationStatus": "created",
  "governanceReviewConclusion": "future-human-review-ready",
  "runtimeActivationApproved": false,
  "runtimeActivationExecuted": false,
  "runtimeGovernanceEnabled": false,
  "runtimeAutonomyEnabled": false,
  "runtimeAutonomyActionsAllowed": false,
  "runtimeCertificationApplied": false,
  "runtimePolicyEnforcementEnabled": false,
  "runtimeConfigActivationEnabled": false,
  "runtimeControlPlaneApplied": false,
  "runtimeControlPlaneActivated": false,
  "runtimeKillSwitchActivated": false,
  "runtimeEmergencyStopExecuted": false,
  "runtimeOperatorOverrideApplied": false,
  "runtimeRollbackExecuted": false,
  "governanceBypassAllowed": false,
  "applied": false,
  "enforced": false,
  "policyRuntimeMode": "preview-only",
  "runtimeBehaviorChanged": false,
  "governanceDecisionsChanged": false,
  "repairOrchestrationChanged": false,
  "safePatchEngineOnly": true,
  "governanceReviewScore": {
    "score": 80,
    "rating": "future-human-review-ready"
  },
  "summary": {
    "futureHumanReviewReady": true
  },
  "recommendedNextStage": "prepare-runtime-activation-boundary-preview"
}
```

Example markdown runtime-activation-governance-review-preview shape:

```text
# AI Software Factory - Runtime Activation Governance Review Preview

Preview status:
created

Governance review conclusion:
future-human-review-ready

Runtime activation approved:
false

Runtime activation executed:
false

## Governance Review Sections
- [runtime-certification/passed-preview/approved=false] gov-runtime-review-section-001 ...

## Governance Review Findings
- [info] gov-runtime-review-finding-001 governance-review-preview-only ...

## Governance Review Blockers
- [high] gov-runtime-review-blocker-001 ...

## Governance Approval Requirements
- [human-review/required=true] gov-runtime-review-approval-001 ...

## Forbidden Activation Findings
- [runtime-autonomy] gov-runtime-review-forbidden-001 permanentlyForbidden=true ...

## Rollback Governance Review Planning
Rollback execution allowed: false
Rollback prepared: false
```

Safety guarantees:

* `runtimeActivationApproved` is always `false`
* `runtimeActivationExecuted` is always `false`
* `runtimeGovernanceEnabled` is always `false`
* `runtimeAutonomyEnabled` is always `false`
* `runtimeAutonomyActionsAllowed` is always `false`
* `runtimeCertificationApplied` is always `false`
* `runtimePolicyEnforcementEnabled` is always `false`
* `runtimeConfigActivationEnabled` is always `false`
* `runtimeControlPlaneApplied` is always `false`
* `runtimeControlPlaneActivated` is always `false`
* `runtimeKillSwitchActivated` is always `false`
* `runtimeEmergencyStopExecuted` is always `false`
* `runtimeOperatorOverrideApplied` is always `false`
* `runtimeRollbackExecuted` is always `false`
* `runtimeSandboxExecutionAllowed` is always `false`
* `runtimeSandboxExecuted` is always `false`
* `runtimeMutationScopeExpanded` is always `false`
* `runtimeExternalExecutionAllowed` is always `false`
* `runtimePluginExecutionAllowed` is always `false`
* `runtimeScriptEvaluationAllowed` is always `false`
* `runtimeLearningEnabled` is always `false`
* `runtimeMlDecisioningEnabled` is always `false`
* `runtimeMultiAgentCoordinationEnabled` is always `false`
* `governanceBypassAllowed` is always `false`
* `applied` is always `false`
* `enforced` is always `false`
* `policyRuntimeMode` is always `preview-only`
* `runtimeBehaviorChanged` is always `false`
* `governanceDecisionsChanged` is always `false`
* `repairOrchestrationChanged` is always `false`
* `safePatchEngineOnly` is always `true`

v8.7 deterministic checks:

* governance-runtime-activation-governance-review-preview-unit
* governance-runtime-activation-governance-review-preview-missing
* governance-runtime-activation-governance-review-preview-not-ready
* governance-runtime-activation-governance-review-preview-ready
* governance-runtime-activation-governance-review-preview-blocked
* governance-runtime-activation-governance-review-preview-score
* governance-runtime-activation-governance-review-preview-forbidden-findings
* governance-runtime-activation-governance-review-preview-json-output
* governance-runtime-activation-governance-review-preview-artifact
* governance-runtime-activation-governance-review-preview-no-approval
* governance-runtime-activation-governance-review-preview-no-autonomy

## Runtime Activation Boundary Preview (v8.8)

v8.8 generates deterministic runtime activation boundary previews from the runtime activation governance review preview. It is preview-only: runtime boundaries are not applied, runtime activation is not approved, runtime activation is not executed, runtime governance is not enabled, runtime autonomy is not enabled, runtime policies are not enforced, and runtime behavior does not change.

Commands:

```bash
node dist/cli.js governance runtime activation-boundary-preview
node dist/cli.js governance runtime activation-boundary-preview --json
```

Artifacts:

```text
.factory/governance/runtime-activation-boundary-preview.json
.factory/governance/runtime-activation-boundary-preview.md
```

The preview:

* reuses runtime activation governance review preview logic
* inspects the complete runtime governance review chain
* documents deterministic runtime boundary domains
* documents deterministic runtime boundary definitions
* documents deterministic runtime boundary blockers
* documents deterministic forbidden boundary crossings
* documents deterministic boundary rollback planning
* never approves runtime activation
* never executes runtime activation
* never applies or enforces runtime boundaries
* never enables runtime governance
* never enables runtime autonomy
* never allows autonomous actions
* never enforces runtime policies
* never activates runtime config
* never changes runtime behavior
* never changes governance decisions
* never changes repair orchestration

Example human output:

```text
# AI Software Factory - Runtime Activation Boundary Preview

Preview status:
created

Source governance review status:
created

Runtime boundary conclusion:
future-boundary-review-ready

Runtime activation approved:
false

Runtime activation executed:
false

Runtime boundary applied:
false

Runtime boundary enforced:
false

Runtime governance enabled:
false

Runtime autonomy enabled:
false

Runtime autonomy actions allowed:
false

Runtime policy enforcement enabled:
false

Runtime config activation enabled:
false

Policy runtime mode:
preview-only

Boundary score:
80

Boundary rating:
future-boundary-review-ready

Future boundary review ready:
true

Recommended next stage:
prepare-runtime-activation-freeze-preview
```

Example JSON fields:

```json
{
  "schemaVersion": 1,
  "previewStatus": "created",
  "sourceGovernanceReviewStatus": "created",
  "runtimeBoundaryConclusion": "future-boundary-review-ready",
  "runtimeActivationApproved": false,
  "runtimeActivationExecuted": false,
  "runtimeBoundaryApplied": false,
  "runtimeBoundaryEnforced": false,
  "runtimeGovernanceEnabled": false,
  "runtimeAutonomyEnabled": false,
  "runtimeAutonomyActionsAllowed": false,
  "runtimeCertificationApplied": false,
  "runtimePolicyEnforcementEnabled": false,
  "runtimeConfigActivationEnabled": false,
  "runtimeControlPlaneApplied": false,
  "runtimeControlPlaneActivated": false,
  "governanceBypassAllowed": false,
  "applied": false,
  "enforced": false,
  "policyRuntimeMode": "preview-only",
  "runtimeBehaviorChanged": false,
  "governanceDecisionsChanged": false,
  "repairOrchestrationChanged": false,
  "safePatchEngineOnly": true,
  "boundaryScore": {
    "score": 80,
    "rating": "future-boundary-review-ready"
  },
  "summary": {
    "futureBoundaryReviewReady": true
  },
  "recommendedNextStage": "prepare-runtime-activation-freeze-preview"
}
```

Example markdown runtime-activation-boundary-preview shape:

```text
# AI Software Factory - Runtime Activation Boundary Preview

Preview status:
created

Runtime boundary conclusion:
future-boundary-review-ready

Runtime boundary applied:
false

Runtime boundary enforced:
false

## Boundary Domains
- [activation-boundary/passed-preview/applied=false] gov-runtime-boundary-domain-001 ...

## Boundary Definitions
- [activation-boundary/future-review-only] gov-runtime-boundary-definition-001 ...

## Boundary Blockers
- [high] gov-runtime-boundary-blocker-001 ...

## Forbidden Boundary Crossings
- [runtime-autonomy] gov-runtime-boundary-forbidden-001 permanentlyForbidden=true ...

## Boundary Rollback Planning
Rollback execution allowed: false
Rollback prepared: false
```

Safety guarantees:

* `runtimeActivationApproved` is always `false`
* `runtimeActivationExecuted` is always `false`
* `runtimeBoundaryApplied` is always `false`
* `runtimeBoundaryEnforced` is always `false`
* `runtimeGovernanceEnabled` is always `false`
* `runtimeAutonomyEnabled` is always `false`
* `runtimeAutonomyActionsAllowed` is always `false`
* `runtimeCertificationApplied` is always `false`
* `runtimePolicyEnforcementEnabled` is always `false`
* `runtimeConfigActivationEnabled` is always `false`
* `runtimeControlPlaneApplied` is always `false`
* `runtimeControlPlaneActivated` is always `false`
* `runtimeKillSwitchActivated` is always `false`
* `runtimeEmergencyStopExecuted` is always `false`
* `runtimeOperatorOverrideApplied` is always `false`
* `runtimeRollbackExecuted` is always `false`
* `runtimeSandboxExecutionAllowed` is always `false`
* `runtimeSandboxExecuted` is always `false`
* `runtimeMutationScopeExpanded` is always `false`
* `runtimeExternalExecutionAllowed` is always `false`
* `runtimePluginExecutionAllowed` is always `false`
* `runtimeScriptEvaluationAllowed` is always `false`
* `runtimeLearningEnabled` is always `false`
* `runtimeMlDecisioningEnabled` is always `false`
* `runtimeMultiAgentCoordinationEnabled` is always `false`
* `governanceBypassAllowed` is always `false`
* `applied` is always `false`
* `enforced` is always `false`
* `policyRuntimeMode` is always `preview-only`
* `runtimeBehaviorChanged` is always `false`
* `governanceDecisionsChanged` is always `false`
* `repairOrchestrationChanged` is always `false`
* `safePatchEngineOnly` is always `true`

v8.8 deterministic checks:

* governance-runtime-activation-boundary-preview-unit
* governance-runtime-activation-boundary-preview-missing
* governance-runtime-activation-boundary-preview-not-ready
* governance-runtime-activation-boundary-preview-ready
* governance-runtime-activation-boundary-preview-blocked
* governance-runtime-activation-boundary-preview-score
* governance-runtime-activation-boundary-preview-forbidden-crossings
* governance-runtime-activation-boundary-preview-json-output
* governance-runtime-activation-boundary-preview-artifact
* governance-runtime-activation-boundary-preview-no-boundary-application
* governance-runtime-activation-boundary-preview-no-autonomy

## Runtime Activation Freeze Preview (v8.9)

v8.9 generates deterministic runtime activation freeze previews from the runtime activation boundary preview. It is preview-only: runtime freeze behavior is not applied, enforced, or executed; runtime activation is not approved; runtime activation is not executed; runtime governance is not enabled; runtime autonomy is not enabled; runtime policies are not enforced; and runtime behavior does not change.

Commands:

```bash
node dist/cli.js governance runtime activation-freeze-preview
node dist/cli.js governance runtime activation-freeze-preview --json
```

Artifacts:

```text
.factory/governance/runtime-activation-freeze-preview.json
.factory/governance/runtime-activation-freeze-preview.md
```

The preview:

* reuses runtime activation boundary preview logic
* inspects the complete runtime boundary review chain
* documents deterministic runtime freeze domains
* documents deterministic runtime freeze conditions
* documents deterministic runtime freeze blockers
* documents deterministic freeze-trigger findings
* documents deterministic rollback freeze planning
* never applies, enforces, or executes runtime freeze behavior
* never approves runtime activation
* never executes runtime activation
* never applies runtime boundaries
* never enables runtime governance
* never enables runtime autonomy
* never allows autonomous actions
* never enforces runtime policies
* never activates runtime config
* never changes runtime behavior
* never changes governance decisions
* never changes repair orchestration

Example human output:

```text
# AI Software Factory - Runtime Activation Freeze Preview

Preview status:
created

Source runtime boundary status:
created

Runtime freeze conclusion:
future-freeze-review-ready

Runtime freeze applied:
false

Runtime freeze enforced:
false

Runtime freeze executed:
false

Runtime activation approved:
false

Runtime activation executed:
false

Runtime governance enabled:
false

Runtime autonomy enabled:
false

Runtime autonomy actions allowed:
false

Runtime policy enforcement enabled:
false

Policy runtime mode:
preview-only

Freeze score:
80

Freeze rating:
future-freeze-review-ready

Future freeze review ready:
true

Recommended next stage:
prepare-runtime-safety-final-review-preview
```

Example JSON fields:

```json
{
  "schemaVersion": 1,
  "previewStatus": "created",
  "sourceRuntimeBoundaryStatus": "created",
  "runtimeFreezeConclusion": "future-freeze-review-ready",
  "runtimeFreezeApplied": false,
  "runtimeFreezeEnforced": false,
  "runtimeFreezeExecuted": false,
  "runtimeActivationApproved": false,
  "runtimeActivationExecuted": false,
  "runtimeBoundaryApplied": false,
  "runtimeBoundaryEnforced": false,
  "runtimeGovernanceEnabled": false,
  "runtimeAutonomyEnabled": false,
  "runtimeAutonomyActionsAllowed": false,
  "runtimeCertificationApplied": false,
  "runtimePolicyEnforcementEnabled": false,
  "runtimeConfigActivationEnabled": false,
  "runtimeControlPlaneApplied": false,
  "runtimeControlPlaneActivated": false,
  "governanceBypassAllowed": false,
  "applied": false,
  "enforced": false,
  "policyRuntimeMode": "preview-only",
  "runtimeBehaviorChanged": false,
  "governanceDecisionsChanged": false,
  "repairOrchestrationChanged": false,
  "safePatchEngineOnly": true,
  "freezeScore": {
    "score": 80,
    "rating": "future-freeze-review-ready"
  },
  "summary": {
    "futureFreezeReviewReady": true
  },
  "recommendedNextStage": "prepare-runtime-safety-final-review-preview"
}
```

Example markdown runtime-activation-freeze-preview shape:

```text
# AI Software Factory - Runtime Activation Freeze Preview

Preview status:
created

Runtime freeze conclusion:
future-freeze-review-ready

Runtime freeze applied:
false

Runtime freeze executed:
false

## Freeze Domains
- [activation-freeze/passed-preview/applied=false] gov-runtime-freeze-domain-001 ...

## Freeze Conditions
- [activation-freeze/hard-freeze] gov-runtime-freeze-condition-001 ...

## Freeze Blockers
- [high] gov-runtime-freeze-blocker-001 ...

## Freeze Trigger Findings
- [runtime-autonomy] gov-runtime-freeze-trigger-001 permanentlyForbidden=true ...

## Rollback Freeze Planning
Rollback execution allowed: false
Rollback prepared: false
```

Safety guarantees:

* `runtimeFreezeApplied` is always `false`
* `runtimeFreezeEnforced` is always `false`
* `runtimeFreezeExecuted` is always `false`
* `runtimeActivationApproved` is always `false`
* `runtimeActivationExecuted` is always `false`
* `runtimeBoundaryApplied` is always `false`
* `runtimeBoundaryEnforced` is always `false`
* `runtimeGovernanceEnabled` is always `false`
* `runtimeAutonomyEnabled` is always `false`
* `runtimeAutonomyActionsAllowed` is always `false`
* `runtimeCertificationApplied` is always `false`
* `runtimePolicyEnforcementEnabled` is always `false`
* `runtimeConfigActivationEnabled` is always `false`
* `runtimeControlPlaneApplied` is always `false`
* `runtimeControlPlaneActivated` is always `false`
* `runtimeKillSwitchActivated` is always `false`
* `runtimeEmergencyStopExecuted` is always `false`
* `runtimeOperatorOverrideApplied` is always `false`
* `runtimeRollbackExecuted` is always `false`
* `runtimeSandboxExecutionAllowed` is always `false`
* `runtimeSandboxExecuted` is always `false`
* `runtimeMutationScopeExpanded` is always `false`
* `runtimeExternalExecutionAllowed` is always `false`
* `runtimePluginExecutionAllowed` is always `false`
* `runtimeScriptEvaluationAllowed` is always `false`
* `runtimeLearningEnabled` is always `false`
* `runtimeMlDecisioningEnabled` is always `false`
* `runtimeMultiAgentCoordinationEnabled` is always `false`
* `governanceBypassAllowed` is always `false`
* `applied` is always `false`
* `enforced` is always `false`
* `policyRuntimeMode` is always `preview-only`
* `runtimeBehaviorChanged` is always `false`
* `governanceDecisionsChanged` is always `false`
* `repairOrchestrationChanged` is always `false`
* `safePatchEngineOnly` is always `true`

v8.9 deterministic checks:

* governance-runtime-activation-freeze-preview-unit
* governance-runtime-activation-freeze-preview-missing
* governance-runtime-activation-freeze-preview-not-ready
* governance-runtime-activation-freeze-preview-ready
* governance-runtime-activation-freeze-preview-blocked
* governance-runtime-activation-freeze-preview-score
* governance-runtime-activation-freeze-preview-triggers
* governance-runtime-activation-freeze-preview-json-output
* governance-runtime-activation-freeze-preview-artifact
* governance-runtime-activation-freeze-preview-no-freeze-application
* governance-runtime-activation-freeze-preview-no-autonomy

## Runtime Safety Final Review Preview (v9.0)

v9.0 generates deterministic runtime safety final review previews from the runtime activation freeze preview. It is preview-only: runtime final review is not approved, applied, or enforced; runtime activation is not approved or executed; runtime governance is not enabled; runtime autonomy is not enabled; runtime policies are not enforced; and runtime behavior does not change.

Commands:

```bash
node dist/cli.js governance runtime final-review-preview
node dist/cli.js governance runtime final-review-preview --json
```

Artifacts:

```text
.factory/governance/runtime-safety-final-review-preview.json
.factory/governance/runtime-safety-final-review-preview.md
```

The preview:

* reuses runtime activation freeze preview logic
* inspects the complete runtime safety architecture chain
* documents deterministic final review domains
* documents deterministic final review findings
* documents deterministic final review blockers
* documents deterministic forbidden runtime findings
* documents deterministic rollback/freeze governance planning
* documents deterministic architecture completeness scoring
* never approves runtime final review
* never applies or enforces runtime final review
* never approves runtime activation
* never executes runtime activation
* never enables runtime governance
* never enables runtime autonomy
* never allows autonomous actions
* never enforces runtime policies
* never activates runtime config
* never changes runtime behavior
* never changes governance decisions
* never changes repair orchestration

Example human output:

```text
# AI Software Factory - Runtime Safety Final Review Preview

Preview status:
created

Source runtime freeze status:
created

Runtime final review conclusion:
future-final-review-ready

Runtime final review approved:
false

Runtime final review applied:
false

Runtime final review enforced:
false

Runtime activation approved:
false

Runtime activation executed:
false

Runtime governance enabled:
false

Runtime autonomy enabled:
false

Runtime autonomy actions allowed:
false

Runtime policy enforcement enabled:
false

Policy runtime mode:
preview-only

Architecture completeness score:
80

Architecture completeness rating:
future-final-review-ready

Future final review ready:
true

Recommended next stage:
prepare-post-v9-runtime-research-preview
```

Example JSON fields:

```json
{
  "schemaVersion": 1,
  "previewStatus": "created",
  "sourceRuntimeFreezeStatus": "created",
  "runtimeFinalReviewConclusion": "future-final-review-ready",
  "runtimeFinalReviewApproved": false,
  "runtimeFinalReviewApplied": false,
  "runtimeFinalReviewEnforced": false,
  "runtimeActivationApproved": false,
  "runtimeActivationExecuted": false,
  "runtimeFreezeApplied": false,
  "runtimeFreezeEnforced": false,
  "runtimeFreezeExecuted": false,
  "runtimeBoundaryApplied": false,
  "runtimeBoundaryEnforced": false,
  "runtimeGovernanceEnabled": false,
  "runtimeAutonomyEnabled": false,
  "runtimeAutonomyActionsAllowed": false,
  "runtimeCertificationApplied": false,
  "runtimePolicyEnforcementEnabled": false,
  "runtimeConfigActivationEnabled": false,
  "governanceBypassAllowed": false,
  "applied": false,
  "enforced": false,
  "policyRuntimeMode": "preview-only",
  "runtimeBehaviorChanged": false,
  "governanceDecisionsChanged": false,
  "repairOrchestrationChanged": false,
  "safePatchEngineOnly": true,
  "architectureCompletenessScore": {
    "score": 80,
    "rating": "future-final-review-ready"
  },
  "summary": {
    "futureFinalReviewReady": true
  },
  "recommendedNextStage": "prepare-post-v9-runtime-research-preview"
}
```

Example markdown runtime-safety-final-review-preview shape:

```text
# AI Software Factory - Runtime Safety Final Review Preview

Preview status:
created

Runtime final review conclusion:
future-final-review-ready

Runtime final review approved:
false

Runtime final review applied:
false

## Final Review Domains
- [runtime-safety-design/passed-preview/approved=false] gov-runtime-final-domain-001 ...

## Final Review Findings
- [info] gov-runtime-final-finding-001 ...

## Final Review Blockers
- [high] gov-runtime-final-blocker-001 ...

## Forbidden Runtime Findings
- [runtime-autonomy] gov-runtime-final-forbidden-001 permanentlyForbidden=true ...

## Rollback/Freeze Governance Planning
Rollback execution allowed: false
Rollback prepared: false
```

Safety guarantees:

* `runtimeFinalReviewApproved` is always `false`
* `runtimeFinalReviewApplied` is always `false`
* `runtimeFinalReviewEnforced` is always `false`
* `runtimeActivationApproved` is always `false`
* `runtimeActivationExecuted` is always `false`
* `runtimeFreezeApplied` is always `false`
* `runtimeFreezeEnforced` is always `false`
* `runtimeFreezeExecuted` is always `false`
* `runtimeBoundaryApplied` is always `false`
* `runtimeBoundaryEnforced` is always `false`
* `runtimeGovernanceEnabled` is always `false`
* `runtimeAutonomyEnabled` is always `false`
* `runtimeAutonomyActionsAllowed` is always `false`
* `runtimeCertificationApplied` is always `false`
* `runtimePolicyEnforcementEnabled` is always `false`
* `runtimeConfigActivationEnabled` is always `false`
* `runtimeControlPlaneApplied` is always `false`
* `runtimeControlPlaneActivated` is always `false`
* `runtimeKillSwitchActivated` is always `false`
* `runtimeEmergencyStopExecuted` is always `false`
* `runtimeOperatorOverrideApplied` is always `false`
* `runtimeRollbackExecuted` is always `false`
* `runtimeSandboxExecutionAllowed` is always `false`
* `runtimeSandboxExecuted` is always `false`
* `runtimeMutationScopeExpanded` is always `false`
* `runtimeExternalExecutionAllowed` is always `false`
* `runtimePluginExecutionAllowed` is always `false`
* `runtimeScriptEvaluationAllowed` is always `false`
* `runtimeLearningEnabled` is always `false`
* `runtimeMlDecisioningEnabled` is always `false`
* `runtimeMultiAgentCoordinationEnabled` is always `false`
* `governanceBypassAllowed` is always `false`
* `applied` is always `false`
* `enforced` is always `false`
* `policyRuntimeMode` is always `preview-only`
* `runtimeBehaviorChanged` is always `false`
* `governanceDecisionsChanged` is always `false`
* `repairOrchestrationChanged` is always `false`
* `safePatchEngineOnly` is always `true`

v9.0 deterministic checks:

* governance-runtime-safety-final-review-preview-unit
* governance-runtime-safety-final-review-preview-missing
* governance-runtime-safety-final-review-preview-not-ready
* governance-runtime-safety-final-review-preview-ready
* governance-runtime-safety-final-review-preview-blocked
* governance-runtime-safety-final-review-preview-score
* governance-runtime-safety-final-review-preview-forbidden-findings
* governance-runtime-safety-final-review-preview-json-output
* governance-runtime-safety-final-review-preview-artifact
* governance-runtime-safety-final-review-preview-no-final-review-approval
* governance-runtime-safety-final-review-preview-no-autonomy

## Post-v9 Runtime Research Preview (v9.1)

v9.1 generates deterministic post-v9 runtime research previews from the runtime safety final review preview. It is preview-only: runtime research is not applied or enforced; runtime final review is not approved, applied, or enforced; runtime activation is not approved or executed; runtime governance is not enabled; runtime autonomy is not enabled; runtime policies are not enforced; and runtime behavior does not change.

Commands:

```bash
node dist/cli.js governance runtime research-preview
node dist/cli.js governance runtime research-preview --json
```

Artifacts:

```text
.factory/governance/post-v9-runtime-research-preview.json
.factory/governance/post-v9-runtime-research-preview.md
```

The preview:

* reuses runtime safety final review preview logic
* inspects the complete runtime governance research chain
* documents deterministic architecture completion areas
* documents deterministic preview-only architecture findings
* documents deterministic permanently forbidden capability findings
* documents deterministic human research requirements
* documents deterministic future-runtime feasibility notes
* documents deterministic governance research recommendations
* never applies or enforces runtime research
* never approves runtime final review
* never approves runtime activation
* never executes runtime activation
* never enables runtime governance
* never enables runtime autonomy
* never allows autonomous actions
* never enforces runtime policies
* never activates runtime config
* never changes runtime behavior
* never changes governance decisions
* never changes repair orchestration

Example human output:

```text
# AI Software Factory - Post-v9 Runtime Research Preview

Preview status:
created

Source runtime final review status:
created

Runtime research conclusion:
future-research-ready

Runtime research applied:
false

Runtime research enforced:
false

Runtime final review approved:
false

Runtime final review applied:
false

Runtime final review enforced:
false

Runtime activation approved:
false

Runtime activation executed:
false

Runtime governance enabled:
false

Runtime autonomy enabled:
false

Runtime autonomy actions allowed:
false

Runtime policy enforcement enabled:
false

Policy runtime mode:
preview-only

Architecture research score:
80

Architecture research rating:
future-research-ready

Future research ready:
true

Recommended next stage:
maintain-runtime-disabled-posture
```

Example JSON fields:

```json
{
  "schemaVersion": 1,
  "previewStatus": "created",
  "sourceRuntimeFinalReviewStatus": "created",
  "runtimeResearchConclusion": "future-research-ready",
  "runtimeResearchApplied": false,
  "runtimeResearchEnforced": false,
  "runtimeFinalReviewApproved": false,
  "runtimeFinalReviewApplied": false,
  "runtimeFinalReviewEnforced": false,
  "runtimeActivationApproved": false,
  "runtimeActivationExecuted": false,
  "runtimeFreezeApplied": false,
  "runtimeFreezeEnforced": false,
  "runtimeFreezeExecuted": false,
  "runtimeBoundaryApplied": false,
  "runtimeBoundaryEnforced": false,
  "runtimeGovernanceEnabled": false,
  "runtimeAutonomyEnabled": false,
  "runtimeAutonomyActionsAllowed": false,
  "runtimeCertificationApplied": false,
  "runtimePolicyEnforcementEnabled": false,
  "runtimeConfigActivationEnabled": false,
  "governanceBypassAllowed": false,
  "applied": false,
  "enforced": false,
  "policyRuntimeMode": "preview-only",
  "runtimeBehaviorChanged": false,
  "governanceDecisionsChanged": false,
  "repairOrchestrationChanged": false,
  "safePatchEngineOnly": true,
  "architectureResearchScore": {
    "score": 80,
    "rating": "future-research-ready"
  },
  "summary": {
    "futureResearchReady": true
  },
  "recommendedNextStage": "maintain-runtime-disabled-posture"
}
```

Example markdown post-v9-runtime-research-preview shape:

```text
# AI Software Factory - Post-v9 Runtime Research Preview

Preview status:
created

Runtime research conclusion:
future-research-ready

Runtime research applied:
false

Runtime research enforced:
false

## Architecture Completion Areas
- [runtime-safety/architecturally-complete] gov-runtime-research-area-001 ...

## Preview-only Architecture Findings
- [info] gov-runtime-research-finding-001 ...

## Permanently Forbidden Capabilities
- [runtime-autonomy] gov-runtime-research-forbidden-001 permanentlyForbidden=true ...

## Human Research Requirements
- [human-governance-review/required=true] gov-runtime-research-human-001 ...

## Future Runtime Feasibility Notes
- [preview-only-architecture] gov-runtime-research-feasibility-001 ...

## Governance Research Recommendations
- [high] gov-runtime-research-recommendation-001 ...
```

Safety guarantees:

* `runtimeResearchApplied` is always `false`
* `runtimeResearchEnforced` is always `false`
* `runtimeFinalReviewApproved` is always `false`
* `runtimeFinalReviewApplied` is always `false`
* `runtimeFinalReviewEnforced` is always `false`
* `runtimeActivationApproved` is always `false`
* `runtimeActivationExecuted` is always `false`
* `runtimeFreezeApplied` is always `false`
* `runtimeFreezeEnforced` is always `false`
* `runtimeFreezeExecuted` is always `false`
* `runtimeBoundaryApplied` is always `false`
* `runtimeBoundaryEnforced` is always `false`
* `runtimeGovernanceEnabled` is always `false`
* `runtimeAutonomyEnabled` is always `false`
* `runtimeAutonomyActionsAllowed` is always `false`
* `runtimeCertificationApplied` is always `false`
* `runtimePolicyEnforcementEnabled` is always `false`
* `runtimeConfigActivationEnabled` is always `false`
* `runtimeControlPlaneApplied` is always `false`
* `runtimeControlPlaneActivated` is always `false`
* `runtimeKillSwitchActivated` is always `false`
* `runtimeEmergencyStopExecuted` is always `false`
* `runtimeOperatorOverrideApplied` is always `false`
* `runtimeRollbackExecuted` is always `false`
* `runtimeSandboxExecutionAllowed` is always `false`
* `runtimeSandboxExecuted` is always `false`
* `runtimeMutationScopeExpanded` is always `false`
* `runtimeExternalExecutionAllowed` is always `false`
* `runtimePluginExecutionAllowed` is always `false`
* `runtimeScriptEvaluationAllowed` is always `false`
* `runtimeLearningEnabled` is always `false`
* `runtimeMlDecisioningEnabled` is always `false`
* `runtimeMultiAgentCoordinationEnabled` is always `false`
* `governanceBypassAllowed` is always `false`
* `applied` is always `false`
* `enforced` is always `false`
* `policyRuntimeMode` is always `preview-only`
* `runtimeBehaviorChanged` is always `false`
* `governanceDecisionsChanged` is always `false`
* `repairOrchestrationChanged` is always `false`
* `safePatchEngineOnly` is always `true`

v9.1 deterministic checks:

* governance-post-v9-runtime-research-preview-unit
* governance-post-v9-runtime-research-preview-missing
* governance-post-v9-runtime-research-preview-not-ready
* governance-post-v9-runtime-research-preview-ready
* governance-post-v9-runtime-research-preview-blocked
* governance-post-v9-runtime-research-preview-score
* governance-post-v9-runtime-research-preview-forbidden-capabilities
* governance-post-v9-runtime-research-preview-json-output
* governance-post-v9-runtime-research-preview-artifact
* governance-post-v9-runtime-research-preview-no-research-application
* governance-post-v9-runtime-research-preview-no-autonomy

## Runtime Governance Research Index Preview (v9.2)

v9.2 generates a deterministic runtime governance research index from the post-v9 runtime research preview. It is preview-only: the runtime research index is not applied or enforced; runtime research is not applied or enforced; runtime activation is not approved or executed; runtime governance is not enabled; runtime autonomy is not enabled; runtime policies are not enforced; and runtime behavior does not change.

Commands:

```bash
node dist/cli.js governance runtime research-index-preview
node dist/cli.js governance runtime research-index-preview --json
```

Artifacts:

```text
.factory/governance/runtime-governance-research-index-preview.json
.factory/governance/runtime-governance-research-index-preview.md
```

The preview:

* reuses post-v9 runtime research preview logic
* inspects the complete runtime research chain
* documents deterministic research index entries
* documents deterministic category summaries
* documents deterministic preview-only references
* documents deterministic forbidden capability references
* documents deterministic human research requirement references
* documents deterministic future feasibility references
* never applies or enforces the research index
* never applies or enforces runtime research
* never approves runtime final review
* never approves runtime activation
* never executes runtime activation
* never enables runtime governance
* never enables runtime autonomy
* never allows autonomous actions
* never enforces runtime policies
* never activates runtime config
* never changes runtime behavior
* never changes governance decisions
* never changes repair orchestration

Example human output:

```text
# AI Software Factory - Runtime Governance Research Index Preview

Preview status:
created

Source runtime research status:
created

Runtime research index conclusion:
research-index-ready

Runtime research index applied:
false

Runtime research index enforced:
false

Runtime research applied:
false

Runtime research enforced:
false

Runtime final review approved:
false

Runtime activation approved:
false

Runtime activation executed:
false

Runtime governance enabled:
false

Runtime autonomy enabled:
false

Runtime autonomy actions allowed:
false

Runtime policy enforcement enabled:
false

Policy runtime mode:
preview-only

Research index score:
80

Research index rating:
research-index-ready

Research index ready:
true

Recommended next stage:
prepare-runtime-governance-research-map-preview
```

Example JSON fields:

```json
{
  "schemaVersion": 1,
  "previewStatus": "created",
  "sourceRuntimeResearchStatus": "created",
  "runtimeResearchIndexConclusion": "research-index-ready",
  "runtimeResearchIndexApplied": false,
  "runtimeResearchIndexEnforced": false,
  "runtimeResearchApplied": false,
  "runtimeResearchEnforced": false,
  "runtimeFinalReviewApproved": false,
  "runtimeActivationApproved": false,
  "runtimeActivationExecuted": false,
  "runtimeGovernanceEnabled": false,
  "runtimeAutonomyEnabled": false,
  "runtimeAutonomyActionsAllowed": false,
  "runtimePolicyEnforcementEnabled": false,
  "runtimeConfigActivationEnabled": false,
  "governanceBypassAllowed": false,
  "applied": false,
  "enforced": false,
  "policyRuntimeMode": "preview-only",
  "runtimeBehaviorChanged": false,
  "governanceDecisionsChanged": false,
  "repairOrchestrationChanged": false,
  "safePatchEngineOnly": true,
  "researchIndexScore": {
    "score": 80,
    "rating": "research-index-ready"
  },
  "summary": {
    "researchIndexReady": true
  },
  "recommendedNextStage": "prepare-runtime-governance-research-map-preview"
}
```

Example markdown runtime-governance-research-index-preview shape:

```text
# AI Software Factory - Runtime Governance Research Index Preview

Preview status:
created

Runtime research index conclusion:
research-index-ready

Runtime research index applied:
false

Runtime research index enforced:
false

## Research Index Entries
- [runtime-safety/indexed-preview] gov-runtime-research-index-entry-001 ...

## Category Summaries
- [runtime-safety/entries=1/previewOnly=true] gov-runtime-research-index-category-001 ...

## Preview-only References
- [post-v9-runtime-research-preview] gov-runtime-research-index-preview-only-001 ...

## Forbidden Capability References
- gov-runtime-research-index-forbidden-001 runtime-autonomy-enablement permanentlyForbidden=true ...

## Human Research Requirement References
- gov-runtime-research-index-human-001 mandatory-human-governance-review required=true ...

## Future Feasibility References
- gov-runtime-research-index-feasibility-001 future-runtime-separate-design-review futureOnly=true ...
```

Safety guarantees:

* `runtimeResearchIndexApplied` is always `false`
* `runtimeResearchIndexEnforced` is always `false`
* `runtimeResearchApplied` is always `false`
* `runtimeResearchEnforced` is always `false`
* `runtimeFinalReviewApproved` is always `false`
* `runtimeFinalReviewApplied` is always `false`
* `runtimeFinalReviewEnforced` is always `false`
* `runtimeActivationApproved` is always `false`
* `runtimeActivationExecuted` is always `false`
* `runtimeGovernanceEnabled` is always `false`
* `runtimeAutonomyEnabled` is always `false`
* `runtimeAutonomyActionsAllowed` is always `false`
* `runtimePolicyEnforcementEnabled` is always `false`
* `runtimeConfigActivationEnabled` is always `false`
* `runtimeControlPlaneApplied` is always `false`
* `runtimeControlPlaneActivated` is always `false`
* `runtimeKillSwitchActivated` is always `false`
* `runtimeEmergencyStopExecuted` is always `false`
* `runtimeOperatorOverrideApplied` is always `false`
* `runtimeRollbackExecuted` is always `false`
* `runtimeObservabilityApplied` is always `false`
* `runtimeObservabilityEnforced` is always `false`
* `runtimeSafetyApplied` is always `false`
* `runtimeSafetyEnforced` is always `false`
* `runtimeSafetyActivated` is always `false`
* `runtimeSandboxExecutionAllowed` is always `false`
* `runtimeSandboxExecuted` is always `false`
* `runtimeMutationScopeExpanded` is always `false`
* `runtimeExternalExecutionAllowed` is always `false`
* `runtimePluginExecutionAllowed` is always `false`
* `runtimeScriptEvaluationAllowed` is always `false`
* `runtimeLearningEnabled` is always `false`
* `runtimeMlDecisioningEnabled` is always `false`
* `runtimeMultiAgentCoordinationEnabled` is always `false`
* `governanceBypassAllowed` is always `false`
* `applied` is always `false`
* `enforced` is always `false`
* `policyRuntimeMode` is always `preview-only`
* `runtimeBehaviorChanged` is always `false`
* `governanceDecisionsChanged` is always `false`
* `repairOrchestrationChanged` is always `false`
* `safePatchEngineOnly` is always `true`

v9.2 deterministic checks:

* governance-runtime-research-index-preview-unit
* governance-runtime-research-index-preview-missing
* governance-runtime-research-index-preview-not-ready
* governance-runtime-research-index-preview-ready
* governance-runtime-research-index-preview-blocked
* governance-runtime-research-index-preview-score
* governance-runtime-research-index-preview-forbidden-capabilities
* governance-runtime-research-index-preview-json-output
* governance-runtime-research-index-preview-artifact
* governance-runtime-research-index-preview-no-index-application
* governance-runtime-research-index-preview-no-autonomy

## Runtime Governance Research Map Preview (v9.3)

v9.3 generates a deterministic runtime governance research map from the runtime governance research index preview. It is preview-only: the runtime research map is not applied or enforced; runtime activation is not approved or executed; runtime governance is not enabled; runtime autonomy is not enabled; runtime policies are not enforced; and runtime behavior does not change.

Commands:

```bash
node dist/cli.js governance runtime research-map-preview
node dist/cli.js governance runtime research-map-preview --json
```

Artifacts:

```text
.factory/governance/runtime-governance-research-map-preview.json
.factory/governance/runtime-governance-research-map-preview.md
```

The preview:

* reuses runtime governance research index preview logic
* inspects the full runtime governance preview chain
* documents deterministic research map nodes
* documents deterministic dependency edges
* documents deterministic prerequisite chains
* documents deterministic architectural stage groupings
* documents deterministic forbidden-runtime dependency boundaries
* documents deterministic future-only dependency notes
* never applies or enforces the research map
* never applies or enforces runtime research index output
* never applies or enforces runtime research
* never approves runtime activation
* never executes runtime activation
* never enables runtime governance
* never enables runtime autonomy
* never allows autonomous actions
* never enforces runtime policies
* never activates runtime config
* never changes runtime behavior
* never changes governance decisions
* never changes repair orchestration

Example human output:

```text
# AI Software Factory - Runtime Governance Research Map Preview

Preview status:
created

Source runtime research index status:
created

Runtime research map conclusion:
research-map-ready

Runtime research map applied:
false

Runtime research map enforced:
false

Runtime governance enabled:
false

Runtime autonomy enabled:
false

Runtime autonomy actions allowed:
false

Runtime activation approved:
false

Runtime activation executed:
false

Runtime policy enforcement enabled:
false

Policy runtime mode:
preview-only

Research map score:
80

Research map rating:
research-map-ready

Research map ready:
true

Recommended next stage:
prepare-runtime-governance-research-timeline-preview
```

Example JSON fields:

```json
{
  "schemaVersion": 1,
  "previewStatus": "created",
  "sourceRuntimeResearchIndexStatus": "created",
  "runtimeResearchMapConclusion": "research-map-ready",
  "runtimeResearchMapApplied": false,
  "runtimeResearchMapEnforced": false,
  "runtimeResearchIndexApplied": false,
  "runtimeResearchIndexEnforced": false,
  "runtimeResearchApplied": false,
  "runtimeResearchEnforced": false,
  "runtimeFinalReviewApproved": false,
  "runtimeActivationApproved": false,
  "runtimeActivationExecuted": false,
  "runtimeGovernanceEnabled": false,
  "runtimeAutonomyEnabled": false,
  "runtimeAutonomyActionsAllowed": false,
  "runtimePolicyEnforcementEnabled": false,
  "runtimeConfigActivationEnabled": false,
  "governanceBypassAllowed": false,
  "applied": false,
  "enforced": false,
  "policyRuntimeMode": "preview-only",
  "runtimeBehaviorChanged": false,
  "governanceDecisionsChanged": false,
  "repairOrchestrationChanged": false,
  "safePatchEngineOnly": true,
  "researchMapScore": {
    "score": 80,
    "rating": "research-map-ready"
  },
  "summary": {
    "researchMapReady": true
  },
  "recommendedNextStage": "prepare-runtime-governance-research-timeline-preview"
}
```

Example markdown runtime-governance-research-map-preview shape:

```text
# AI Software Factory - Runtime Governance Research Map Preview

Preview status:
created

Runtime research map conclusion:
research-map-ready

Runtime research map applied:
false

Runtime research map enforced:
false

## Research Map Nodes
- [runtime-safety/runtime-safety/mapped-preview] gov-runtime-research-map-node-001 ...

## Dependency Edges
- gov-runtime-research-map-edge-001 runtime-safety-design -> runtime-safety-evidence [requires/futureOnly=true] ...

## Prerequisite Chains
- gov-runtime-research-map-chain-001 runtime-activation-safety-chain previewOnly=true steps=...

## Stage Groups
- [runtime-safety/nodes=3/previewOnly=true] gov-runtime-research-map-stage-001 ...

## Forbidden Dependency Boundaries
- [runtime-autonomy] gov-runtime-research-map-boundary-001 permanentlyForbidden=true ...

## Future-only Dependency Notes
- [future-human-review] gov-runtime-research-map-note-001 futureOnly=true ...
```

Safety guarantees:

* `runtimeResearchMapApplied` is always `false`
* `runtimeResearchMapEnforced` is always `false`
* `runtimeResearchIndexApplied` is always `false`
* `runtimeResearchIndexEnforced` is always `false`
* `runtimeResearchApplied` is always `false`
* `runtimeResearchEnforced` is always `false`
* `runtimeFinalReviewApproved` is always `false`
* `runtimeFinalReviewApplied` is always `false`
* `runtimeFinalReviewEnforced` is always `false`
* `runtimeActivationApproved` is always `false`
* `runtimeActivationExecuted` is always `false`
* `runtimeGovernanceEnabled` is always `false`
* `runtimeAutonomyEnabled` is always `false`
* `runtimeAutonomyActionsAllowed` is always `false`
* `runtimePolicyEnforcementEnabled` is always `false`
* `runtimeConfigActivationEnabled` is always `false`
* `runtimeControlPlaneApplied` is always `false`
* `runtimeControlPlaneActivated` is always `false`
* `runtimeKillSwitchActivated` is always `false`
* `runtimeEmergencyStopExecuted` is always `false`
* `runtimeOperatorOverrideApplied` is always `false`
* `runtimeRollbackExecuted` is always `false`
* `runtimeObservabilityApplied` is always `false`
* `runtimeObservabilityEnforced` is always `false`
* `runtimeSafetyApplied` is always `false`
* `runtimeSafetyEnforced` is always `false`
* `runtimeSafetyActivated` is always `false`
* `runtimeSandboxExecutionAllowed` is always `false`
* `runtimeSandboxExecuted` is always `false`
* `runtimeMutationScopeExpanded` is always `false`
* `runtimeExternalExecutionAllowed` is always `false`
* `runtimePluginExecutionAllowed` is always `false`
* `runtimeScriptEvaluationAllowed` is always `false`
* `runtimeLearningEnabled` is always `false`
* `runtimeMlDecisioningEnabled` is always `false`
* `runtimeMultiAgentCoordinationEnabled` is always `false`
* `governanceBypassAllowed` is always `false`
* `applied` is always `false`
* `enforced` is always `false`
* `policyRuntimeMode` is always `preview-only`
* `runtimeBehaviorChanged` is always `false`
* `governanceDecisionsChanged` is always `false`
* `repairOrchestrationChanged` is always `false`
* `safePatchEngineOnly` is always `true`

v9.3 deterministic checks:

* governance-runtime-research-map-preview-unit
* governance-runtime-research-map-preview-missing
* governance-runtime-research-map-preview-not-ready
* governance-runtime-research-map-preview-ready
* governance-runtime-research-map-preview-blocked
* governance-runtime-research-map-preview-score
* governance-runtime-research-map-preview-boundaries
* governance-runtime-research-map-preview-json-output
* governance-runtime-research-map-preview-artifact
* governance-runtime-research-map-preview-no-map-application
* governance-runtime-research-map-preview-no-autonomy

## Runtime Governance Research Timeline Preview (v9.4)

v9.4 generates a deterministic runtime governance research timeline from the runtime governance research map preview. It is preview-only: the runtime research timeline is not applied or enforced; runtime activation is not approved or executed; runtime governance is not enabled; runtime autonomy is not enabled; runtime policies are not enforced; and runtime behavior does not change.

Commands:

```bash
node dist/cli.js governance runtime research-timeline-preview
node dist/cli.js governance runtime research-timeline-preview --json
```

Artifacts:

```text
.factory/governance/runtime-governance-research-timeline-preview.json
.factory/governance/runtime-governance-research-timeline-preview.md
```

The preview:

* reuses runtime governance research map preview logic
* inspects the complete runtime governance preview chain
* documents deterministic timeline stages
* documents deterministic maturity progression entries
* documents deterministic research milestones
* documents deterministic preview-only maturity boundaries
* documents deterministic future-only progression notes
* never applies or enforces the research timeline
* never applies or enforces runtime research map output
* never applies or enforces runtime research index output
* never applies or enforces runtime research
* never approves runtime activation
* never executes runtime activation
* never enables runtime governance
* never enables runtime autonomy
* never allows autonomous actions
* never enforces runtime policies
* never activates runtime config
* never changes runtime behavior
* never changes governance decisions
* never changes repair orchestration

Example human output:

```text
# AI Software Factory - Runtime Governance Research Timeline Preview

Preview status:
created

Source runtime research map status:
created

Runtime research timeline conclusion:
research-timeline-ready

Runtime research timeline applied:
false

Runtime research timeline enforced:
false

Runtime governance enabled:
false

Runtime autonomy enabled:
false

Runtime autonomy actions allowed:
false

Runtime activation approved:
false

Runtime activation executed:
false

Runtime policy enforcement enabled:
false

Policy runtime mode:
preview-only

Research timeline score:
80

Research timeline rating:
research-timeline-ready

Research timeline ready:
true

Recommended next stage:
prepare-runtime-governance-research-archive-preview
```

Example JSON fields:

```json
{
  "schemaVersion": 1,
  "previewStatus": "created",
  "sourceRuntimeResearchMapStatus": "created",
  "runtimeResearchTimelineConclusion": "research-timeline-ready",
  "runtimeResearchTimelineApplied": false,
  "runtimeResearchTimelineEnforced": false,
  "runtimeResearchMapApplied": false,
  "runtimeResearchMapEnforced": false,
  "runtimeResearchIndexApplied": false,
  "runtimeResearchIndexEnforced": false,
  "runtimeResearchApplied": false,
  "runtimeResearchEnforced": false,
  "runtimeFinalReviewApproved": false,
  "runtimeActivationApproved": false,
  "runtimeActivationExecuted": false,
  "runtimeGovernanceEnabled": false,
  "runtimeAutonomyEnabled": false,
  "runtimeAutonomyActionsAllowed": false,
  "runtimePolicyEnforcementEnabled": false,
  "runtimeConfigActivationEnabled": false,
  "governanceBypassAllowed": false,
  "applied": false,
  "enforced": false,
  "policyRuntimeMode": "preview-only",
  "runtimeBehaviorChanged": false,
  "governanceDecisionsChanged": false,
  "repairOrchestrationChanged": false,
  "safePatchEngineOnly": true,
  "researchTimelineScore": {
    "score": 80,
    "rating": "research-timeline-ready"
  },
  "summary": {
    "researchTimelineReady": true
  },
  "recommendedNextStage": "prepare-runtime-governance-research-archive-preview"
}
```

Example markdown runtime-governance-research-timeline-preview shape:

```text
# AI Software Factory - Runtime Governance Research Timeline Preview

Preview status:
created

Runtime research timeline conclusion:
research-timeline-ready

Runtime research timeline applied:
false

Runtime research timeline enforced:
false

## Timeline Stages
- [v8.0/runtime-safety/timeline-preview] gov-runtime-research-timeline-stage-001 ...

## Maturity Progression Entries
- gov-runtime-research-timeline-progression-001 v8.0 -> v8.1 [extends/futureOnly=true] ...

## Research Milestones
- gov-runtime-research-timeline-milestone-001 runtime-safety-design achievedIn=v8.0 previewOnly=true ...

## Preview-only Maturity Boundaries
- [runtime-autonomy] gov-runtime-research-timeline-boundary-001 permanentlyForbidden=true ...

## Future-only Progression Notes
- [future-human-review] gov-runtime-research-timeline-note-001 futureOnly=true ...
```

Safety guarantees:

* `runtimeResearchTimelineApplied` is always `false`
* `runtimeResearchTimelineEnforced` is always `false`
* `runtimeResearchMapApplied` is always `false`
* `runtimeResearchMapEnforced` is always `false`
* `runtimeResearchIndexApplied` is always `false`
* `runtimeResearchIndexEnforced` is always `false`
* `runtimeResearchApplied` is always `false`
* `runtimeResearchEnforced` is always `false`
* `runtimeFinalReviewApproved` is always `false`
* `runtimeFinalReviewApplied` is always `false`
* `runtimeFinalReviewEnforced` is always `false`
* `runtimeActivationApproved` is always `false`
* `runtimeActivationExecuted` is always `false`
* `runtimeGovernanceEnabled` is always `false`
* `runtimeAutonomyEnabled` is always `false`
* `runtimeAutonomyActionsAllowed` is always `false`
* `runtimePolicyEnforcementEnabled` is always `false`
* `runtimeConfigActivationEnabled` is always `false`
* `runtimeControlPlaneApplied` is always `false`
* `runtimeControlPlaneActivated` is always `false`
* `runtimeKillSwitchActivated` is always `false`
* `runtimeEmergencyStopExecuted` is always `false`
* `runtimeOperatorOverrideApplied` is always `false`
* `runtimeRollbackExecuted` is always `false`
* `runtimeObservabilityApplied` is always `false`
* `runtimeObservabilityEnforced` is always `false`
* `runtimeSafetyApplied` is always `false`
* `runtimeSafetyEnforced` is always `false`
* `runtimeSafetyActivated` is always `false`
* `runtimeSandboxExecutionAllowed` is always `false`
* `runtimeSandboxExecuted` is always `false`
* `runtimeMutationScopeExpanded` is always `false`
* `runtimeExternalExecutionAllowed` is always `false`
* `runtimePluginExecutionAllowed` is always `false`
* `runtimeScriptEvaluationAllowed` is always `false`
* `runtimeLearningEnabled` is always `false`
* `runtimeMlDecisioningEnabled` is always `false`
* `runtimeMultiAgentCoordinationEnabled` is always `false`
* `governanceBypassAllowed` is always `false`
* `applied` is always `false`
* `enforced` is always `false`
* `policyRuntimeMode` is always `preview-only`
* `runtimeBehaviorChanged` is always `false`
* `governanceDecisionsChanged` is always `false`
* `repairOrchestrationChanged` is always `false`
* `safePatchEngineOnly` is always `true`

v9.4 deterministic checks:

* governance-runtime-research-timeline-preview-unit
* governance-runtime-research-timeline-preview-missing
* governance-runtime-research-timeline-preview-not-ready
* governance-runtime-research-timeline-preview-ready
* governance-runtime-research-timeline-preview-blocked
* governance-runtime-research-timeline-preview-score
* governance-runtime-research-timeline-preview-boundaries
* governance-runtime-research-timeline-preview-json-output
* governance-runtime-research-timeline-preview-artifact
* governance-runtime-research-timeline-preview-no-timeline-application
* governance-runtime-research-timeline-preview-no-autonomy

## Runtime Governance Research Archive Preview (v9.5)

v9.5 adds a deterministic runtime governance research archive preview command:

```bash
node dist/cli.js governance runtime research-archive-preview
node dist/cli.js governance runtime research-archive-preview --json
```

Artifacts:

```text
.factory/governance/runtime-governance-research-archive-preview.json
.factory/governance/runtime-governance-research-archive-preview.md
```

The archive preview consolidates the runtime governance research chain into deterministic archive sections, archive entries, archive references, preview-only archive summaries, forbidden capability archive summaries, and future-only archival notes.

Safety guarantees:

* runtime research archive is preview-only
* runtime research archive is not applied
* runtime research archive is not enforced
* runtime governance is NOT enabled
* runtime autonomy is NOT enabled
* runtime activation is NOT approved
* runtime activation is NOT executed
* runtime policies are NOT enforced
* runtime config activation is disabled
* runtime control plane behavior is not applied
* runtime sandbox execution is not allowed
* runtime behavior does not change
* governance decisions do not change
* repair orchestration does not change
* Safe Patch Engine remains the only mutation layer

Example human output:

```text
# AI Software Factory - Runtime Governance Research Archive Preview

Preview status:
created

Source runtime research timeline status:
created

Runtime research archive conclusion:
research-archive-ready

Runtime research archive applied:
false

Runtime research archive enforced:
false

Runtime governance enabled:
false

Runtime autonomy enabled:
false

Runtime activation approved:
false

Runtime activation executed:
false

Policy runtime mode:
preview-only

Research archive score:
80

Research archive rating:
research-archive-ready

Recommended next stage:
prepare-runtime-governance-research-catalog-preview
```

Example JSON fields:

```json
{
  "schemaVersion": 1,
  "previewStatus": "created",
  "sourceRuntimeResearchTimelineStatus": "created",
  "runtimeResearchArchiveConclusion": "research-archive-ready",
  "runtimeResearchArchiveApplied": false,
  "runtimeResearchArchiveEnforced": false,
  "runtimeGovernanceEnabled": false,
  "runtimeAutonomyEnabled": false,
  "runtimeActivationApproved": false,
  "runtimeActivationExecuted": false,
  "policyRuntimeMode": "preview-only",
  "runtimeBehaviorChanged": false,
  "repairOrchestrationChanged": false,
  "safePatchEngineOnly": true,
  "researchArchiveScore": {
    "score": 80,
    "rating": "research-archive-ready"
  }
}
```

Example markdown runtime-governance-research-archive-preview shape:

```markdown
# AI Software Factory - Runtime Governance Research Archive Preview

Preview status:
created

Runtime research archive conclusion:
research-archive-ready

Runtime research archive applied:
false

Runtime research archive enforced:
false

## Archive Sections

## Archive Entries

## Archive References

## Preview-only Archive Summaries

## Forbidden Capability Archive Summaries

## Future-only Archival Notes

## Warnings
```

v9.5 hard invariants:

* `runtimeResearchArchiveApplied` is always `false`
* `runtimeResearchArchiveEnforced` is always `false`
* `runtimeResearchTimelineApplied` is always `false`
* `runtimeResearchTimelineEnforced` is always `false`
* `runtimeResearchMapApplied` is always `false`
* `runtimeResearchMapEnforced` is always `false`
* `runtimeResearchIndexApplied` is always `false`
* `runtimeResearchIndexEnforced` is always `false`
* `runtimeResearchApplied` is always `false`
* `runtimeResearchEnforced` is always `false`
* `runtimeFinalReviewApproved` is always `false`
* `runtimeFinalReviewApplied` is always `false`
* `runtimeFinalReviewEnforced` is always `false`
* `runtimeActivationApproved` is always `false`
* `runtimeActivationExecuted` is always `false`
* `runtimeGovernanceEnabled` is always `false`
* `runtimeAutonomyEnabled` is always `false`
* `runtimeAutonomyActionsAllowed` is always `false`
* `runtimePolicyEnforcementEnabled` is always `false`
* `runtimeConfigActivationEnabled` is always `false`
* `runtimeControlPlaneApplied` is always `false`
* `runtimeControlPlaneActivated` is always `false`
* `runtimeKillSwitchActivated` is always `false`
* `runtimeEmergencyStopExecuted` is always `false`
* `runtimeOperatorOverrideApplied` is always `false`
* `runtimeRollbackExecuted` is always `false`
* `runtimeObservabilityApplied` is always `false`
* `runtimeObservabilityEnforced` is always `false`
* `runtimeSafetyApplied` is always `false`
* `runtimeSafetyEnforced` is always `false`
* `runtimeSafetyActivated` is always `false`
* `runtimeSandboxExecutionAllowed` is always `false`
* `runtimeSandboxExecuted` is always `false`
* `runtimeMutationScopeExpanded` is always `false`
* `runtimeExternalExecutionAllowed` is always `false`
* `runtimePluginExecutionAllowed` is always `false`
* `runtimeScriptEvaluationAllowed` is always `false`
* `runtimeLearningEnabled` is always `false`
* `runtimeMlDecisioningEnabled` is always `false`
* `runtimeMultiAgentCoordinationEnabled` is always `false`
* `governanceBypassAllowed` is always `false`
* `applied` is always `false`
* `enforced` is always `false`
* `policyRuntimeMode` is always `preview-only`
* `runtimeBehaviorChanged` is always `false`
* `governanceDecisionsChanged` is always `false`
* `repairOrchestrationChanged` is always `false`
* `safePatchEngineOnly` is always `true`

v9.5 deterministic checks:

* governance-runtime-research-archive-preview-unit
* governance-runtime-research-archive-preview-missing
* governance-runtime-research-archive-preview-not-ready
* governance-runtime-research-archive-preview-ready
* governance-runtime-research-archive-preview-blocked
* governance-runtime-research-archive-preview-score
* governance-runtime-research-archive-preview-forbidden-capabilities
* governance-runtime-research-archive-preview-json-output
* governance-runtime-research-archive-preview-artifact
* governance-runtime-research-archive-preview-no-archive-application
* governance-runtime-research-archive-preview-no-autonomy

## Runtime Governance Research Catalog Preview (v9.6)

v9.6 adds a deterministic runtime governance research catalog preview command:

```bash
node dist/cli.js governance runtime research-catalog-preview
node dist/cli.js governance runtime research-catalog-preview --json
```

Artifacts:

```text
.factory/governance/runtime-governance-research-catalog-preview.json
.factory/governance/runtime-governance-research-catalog-preview.md
```

The catalog preview classifies and summarizes runtime governance research artifacts into catalog groups, catalog entries, artifact references, version summaries, preview-only posture summaries, forbidden capability summaries, and future-only catalog notes.

Safety guarantees:

* runtime research catalog is preview-only
* runtime research catalog is not applied
* runtime research catalog is not enforced
* runtime governance is NOT enabled
* runtime autonomy is NOT enabled
* runtime activation is NOT approved
* runtime activation is NOT executed
* runtime policies are NOT enforced
* runtime config activation is disabled
* runtime behavior does not change
* governance decisions do not change
* repair orchestration does not change
* Safe Patch Engine remains the only mutation layer

Example human output:

```text
# AI Software Factory - Runtime Governance Research Catalog Preview

Preview status:
created

Source runtime research archive status:
created

Runtime research catalog conclusion:
research-catalog-ready

Runtime research catalog applied:
false

Runtime research catalog enforced:
false

Runtime governance enabled:
false

Runtime autonomy enabled:
false

Runtime activation approved:
false

Runtime activation executed:
false

Policy runtime mode:
preview-only

Research catalog score:
80

Research catalog rating:
research-catalog-ready

Recommended next stage:
prepare-runtime-governance-research-registry-preview
```

Example JSON fields:

```json
{
  "schemaVersion": 1,
  "previewStatus": "created",
  "sourceRuntimeResearchArchiveStatus": "created",
  "runtimeResearchCatalogConclusion": "research-catalog-ready",
  "runtimeResearchCatalogApplied": false,
  "runtimeResearchCatalogEnforced": false,
  "runtimeGovernanceEnabled": false,
  "runtimeAutonomyEnabled": false,
  "runtimeActivationApproved": false,
  "runtimeActivationExecuted": false,
  "policyRuntimeMode": "preview-only",
  "runtimeBehaviorChanged": false,
  "repairOrchestrationChanged": false,
  "safePatchEngineOnly": true,
  "researchCatalogScore": {
    "score": 80,
    "rating": "research-catalog-ready"
  }
}
```

Example markdown runtime-governance-research-catalog-preview shape:

```markdown
# AI Software Factory - Runtime Governance Research Catalog Preview

Preview status:
created

Runtime research catalog conclusion:
research-catalog-ready

Runtime research catalog applied:
false

Runtime research catalog enforced:
false

## Catalog Groups

## Catalog Entries

## Artifact References

## Version Summaries

## Preview-only Posture Summaries

## Forbidden Capability Summaries

## Future-only Catalog Notes

## Warnings
```

v9.6 hard invariants:

* `runtimeResearchCatalogApplied` is always `false`
* `runtimeResearchCatalogEnforced` is always `false`
* `runtimeResearchArchiveApplied` is always `false`
* `runtimeResearchArchiveEnforced` is always `false`
* `runtimeResearchTimelineApplied` is always `false`
* `runtimeResearchTimelineEnforced` is always `false`
* `runtimeResearchMapApplied` is always `false`
* `runtimeResearchMapEnforced` is always `false`
* `runtimeResearchIndexApplied` is always `false`
* `runtimeResearchIndexEnforced` is always `false`
* `runtimeResearchApplied` is always `false`
* `runtimeResearchEnforced` is always `false`
* `runtimeFinalReviewApproved` is always `false`
* `runtimeFinalReviewApplied` is always `false`
* `runtimeFinalReviewEnforced` is always `false`
* `runtimeActivationApproved` is always `false`
* `runtimeActivationExecuted` is always `false`
* `runtimeGovernanceEnabled` is always `false`
* `runtimeAutonomyEnabled` is always `false`
* `runtimeAutonomyActionsAllowed` is always `false`
* `runtimePolicyEnforcementEnabled` is always `false`
* `runtimeConfigActivationEnabled` is always `false`
* `runtimeControlPlaneApplied` is always `false`
* `runtimeControlPlaneActivated` is always `false`
* `runtimeKillSwitchActivated` is always `false`
* `runtimeEmergencyStopExecuted` is always `false`
* `runtimeOperatorOverrideApplied` is always `false`
* `runtimeRollbackExecuted` is always `false`
* `runtimeObservabilityApplied` is always `false`
* `runtimeObservabilityEnforced` is always `false`
* `runtimeSafetyApplied` is always `false`
* `runtimeSafetyEnforced` is always `false`
* `runtimeSafetyActivated` is always `false`
* `runtimeSandboxExecutionAllowed` is always `false`
* `runtimeSandboxExecuted` is always `false`
* `runtimeMutationScopeExpanded` is always `false`
* `runtimeExternalExecutionAllowed` is always `false`
* `runtimePluginExecutionAllowed` is always `false`
* `runtimeScriptEvaluationAllowed` is always `false`
* `runtimeLearningEnabled` is always `false`
* `runtimeMlDecisioningEnabled` is always `false`
* `runtimeMultiAgentCoordinationEnabled` is always `false`
* `governanceBypassAllowed` is always `false`
* `applied` is always `false`
* `enforced` is always `false`
* `policyRuntimeMode` is always `preview-only`
* `runtimeBehaviorChanged` is always `false`
* `governanceDecisionsChanged` is always `false`
* `repairOrchestrationChanged` is always `false`
* `safePatchEngineOnly` is always `true`

v9.6 deterministic checks:

* governance-runtime-research-catalog-preview-unit
* governance-runtime-research-catalog-preview-missing
* governance-runtime-research-catalog-preview-not-ready
* governance-runtime-research-catalog-preview-ready
* governance-runtime-research-catalog-preview-blocked
* governance-runtime-research-catalog-preview-score
* governance-runtime-research-catalog-preview-forbidden-capabilities
* governance-runtime-research-catalog-preview-json-output
* governance-runtime-research-catalog-preview-artifact
* governance-runtime-research-catalog-preview-no-catalog-application
* governance-runtime-research-catalog-preview-no-autonomy

## Runtime Governance Research Registry Preview (v9.7)

v9.7 adds a deterministic runtime governance research registry preview command:

```bash
node dist/cli.js governance runtime research-registry-preview
node dist/cli.js governance runtime research-registry-preview --json
```

Artifacts:

```text
.factory/governance/runtime-governance-research-registry-preview.json
.factory/governance/runtime-governance-research-registry-preview.md
```

The registry preview formally registers runtime governance research artifacts into registry groups, registry records, artifact identity records, ownership summaries, preview-only registry summaries, forbidden capability registry records, and future-only registry notes.

Safety guarantees:

* runtime research registry is preview-only
* runtime research registry is not applied
* runtime research registry is not enforced
* runtime governance is NOT enabled
* runtime autonomy is NOT enabled
* runtime activation is NOT approved
* runtime activation is NOT executed
* runtime policies are NOT enforced
* runtime config activation is disabled
* runtime behavior does not change
* governance decisions do not change
* repair orchestration does not change
* Safe Patch Engine remains the only mutation layer

Example human output:

```text
# AI Software Factory - Runtime Governance Research Registry Preview

Preview status:
created

Source runtime research catalog status:
created

Runtime research registry conclusion:
research-registry-ready

Runtime research registry applied:
false

Runtime research registry enforced:
false

Runtime governance enabled:
false

Runtime autonomy enabled:
false

Runtime activation approved:
false

Runtime activation executed:
false

Policy runtime mode:
preview-only

Research registry score:
80

Research registry rating:
research-registry-ready

Recommended next stage:
prepare-runtime-governance-research-manifest-preview
```

Example JSON fields:

```json
{
  "schemaVersion": 1,
  "previewStatus": "created",
  "sourceRuntimeResearchCatalogStatus": "created",
  "runtimeResearchRegistryConclusion": "research-registry-ready",
  "runtimeResearchRegistryApplied": false,
  "runtimeResearchRegistryEnforced": false,
  "runtimeGovernanceEnabled": false,
  "runtimeAutonomyEnabled": false,
  "runtimeActivationApproved": false,
  "runtimeActivationExecuted": false,
  "policyRuntimeMode": "preview-only",
  "runtimeBehaviorChanged": false,
  "repairOrchestrationChanged": false,
  "safePatchEngineOnly": true,
  "researchRegistryScore": {
    "score": 80,
    "rating": "research-registry-ready"
  }
}
```

Example markdown runtime-governance-research-registry-preview shape:

```markdown
# AI Software Factory - Runtime Governance Research Registry Preview

Preview status:
created

Runtime research registry conclusion:
research-registry-ready

Runtime research registry applied:
false

Runtime research registry enforced:
false

## Registry Groups

## Registry Records

## Artifact Identity Records

## Ownership Summaries

## Preview-only Registry Summaries

## Forbidden Capability Registry Records

## Future-only Registry Notes

## Warnings
```

v9.7 hard invariants:

* `runtimeResearchRegistryApplied` is always `false`
* `runtimeResearchRegistryEnforced` is always `false`
* `runtimeResearchCatalogApplied` is always `false`
* `runtimeResearchCatalogEnforced` is always `false`
* `runtimeResearchArchiveApplied` is always `false`
* `runtimeResearchArchiveEnforced` is always `false`
* `runtimeResearchTimelineApplied` is always `false`
* `runtimeResearchTimelineEnforced` is always `false`
* `runtimeResearchMapApplied` is always `false`
* `runtimeResearchMapEnforced` is always `false`
* `runtimeResearchIndexApplied` is always `false`
* `runtimeResearchIndexEnforced` is always `false`
* `runtimeResearchApplied` is always `false`
* `runtimeResearchEnforced` is always `false`
* `runtimeFinalReviewApproved` is always `false`
* `runtimeFinalReviewApplied` is always `false`
* `runtimeFinalReviewEnforced` is always `false`
* `runtimeActivationApproved` is always `false`
* `runtimeActivationExecuted` is always `false`
* `runtimeGovernanceEnabled` is always `false`
* `runtimeAutonomyEnabled` is always `false`
* `runtimeAutonomyActionsAllowed` is always `false`
* `runtimePolicyEnforcementEnabled` is always `false`
* `runtimeConfigActivationEnabled` is always `false`
* `runtimeControlPlaneApplied` is always `false`
* `runtimeControlPlaneActivated` is always `false`
* `runtimeKillSwitchActivated` is always `false`
* `runtimeEmergencyStopExecuted` is always `false`
* `runtimeOperatorOverrideApplied` is always `false`
* `runtimeRollbackExecuted` is always `false`
* `runtimeObservabilityApplied` is always `false`
* `runtimeObservabilityEnforced` is always `false`
* `runtimeSafetyApplied` is always `false`
* `runtimeSafetyEnforced` is always `false`
* `runtimeSafetyActivated` is always `false`
* `runtimeSandboxExecutionAllowed` is always `false`
* `runtimeSandboxExecuted` is always `false`
* `runtimeMutationScopeExpanded` is always `false`
* `runtimeExternalExecutionAllowed` is always `false`
* `runtimePluginExecutionAllowed` is always `false`
* `runtimeScriptEvaluationAllowed` is always `false`
* `runtimeLearningEnabled` is always `false`
* `runtimeMlDecisioningEnabled` is always `false`
* `runtimeMultiAgentCoordinationEnabled` is always `false`
* `governanceBypassAllowed` is always `false`
* `applied` is always `false`
* `enforced` is always `false`
* `policyRuntimeMode` is always `preview-only`
* `runtimeBehaviorChanged` is always `false`
* `governanceDecisionsChanged` is always `false`
* `repairOrchestrationChanged` is always `false`
* `safePatchEngineOnly` is always `true`

v9.7 deterministic checks:

* governance-runtime-research-registry-preview-unit
* governance-runtime-research-registry-preview-missing
* governance-runtime-research-registry-preview-not-ready
* governance-runtime-research-registry-preview-ready
* governance-runtime-research-registry-preview-blocked
* governance-runtime-research-registry-preview-score
* governance-runtime-research-registry-preview-forbidden-capabilities
* governance-runtime-research-registry-preview-json-output
* governance-runtime-research-registry-preview-artifact
* governance-runtime-research-registry-preview-no-registry-application
* governance-runtime-research-registry-preview-no-autonomy

## Runtime Governance Research Manifest Preview (v9.8)

v9.8 adds a deterministic runtime governance research manifest preview command:

```bash
node dist/cli.js governance runtime research-manifest-preview
node dist/cli.js governance runtime research-manifest-preview --json
```

Artifacts:

```text
.factory/governance/runtime-governance-research-manifest-preview.json
.factory/governance/runtime-governance-research-manifest-preview.md
```

The manifest preview consolidates registry state into manifest groups, manifest records, manifest ownership entries, manifest version entries, preview-only manifest summaries, forbidden capability manifest records, and future-only manifest notes.

Safety guarantees:

* runtime research manifest is preview-only
* runtime research manifest is not applied
* runtime research manifest is not enforced
* runtime governance is NOT enabled
* runtime autonomy is NOT enabled
* runtime activation is NOT approved
* runtime activation is NOT executed
* runtime policies are NOT enforced
* runtime config activation is disabled
* runtime behavior does not change
* governance decisions do not change
* repair orchestration does not change
* Safe Patch Engine remains the only mutation layer

Example human output:

```text
# AI Software Factory - Runtime Governance Research Manifest Preview

Preview status:
created

Source runtime research registry status:
created

Runtime research manifest conclusion:
research-manifest-ready

Runtime research manifest applied:
false

Runtime research manifest enforced:
false

Runtime governance enabled:
false

Runtime autonomy enabled:
false

Runtime activation approved:
false

Runtime activation executed:
false

Policy runtime mode:
preview-only

Research manifest score:
80

Research manifest rating:
research-manifest-ready

Recommended next stage:
prepare-runtime-governance-research-attestation-preview
```

Example JSON fields:

```json
{
  "schemaVersion": 1,
  "previewStatus": "created",
  "sourceRuntimeResearchRegistryStatus": "created",
  "runtimeResearchManifestConclusion": "research-manifest-ready",
  "runtimeResearchManifestApplied": false,
  "runtimeResearchManifestEnforced": false,
  "runtimeGovernanceEnabled": false,
  "runtimeAutonomyEnabled": false,
  "runtimeActivationApproved": false,
  "runtimeActivationExecuted": false,
  "policyRuntimeMode": "preview-only",
  "runtimeBehaviorChanged": false,
  "repairOrchestrationChanged": false,
  "safePatchEngineOnly": true,
  "researchManifestScore": {
    "score": 80,
    "rating": "research-manifest-ready"
  }
}
```

Example markdown runtime-governance-research-manifest-preview shape:

```markdown
# AI Software Factory - Runtime Governance Research Manifest Preview

Preview status:
created

Runtime research manifest conclusion:
research-manifest-ready

Runtime research manifest applied:
false

Runtime research manifest enforced:
false

## Manifest Groups

## Manifest Records

## Manifest Ownership Entries

## Manifest Version Entries

## Preview-only Manifest Summaries

## Forbidden Capability Manifest Records

## Future-only Manifest Notes

## Warnings
```

v9.8 hard invariants:

* `runtimeResearchManifestApplied` is always `false`
* `runtimeResearchManifestEnforced` is always `false`
* `runtimeResearchRegistryApplied` is always `false`
* `runtimeResearchRegistryEnforced` is always `false`
* `runtimeGovernanceEnabled` is always `false`
* `runtimeAutonomyEnabled` is always `false`
* `runtimeAutonomyActionsAllowed` is always `false`
* `runtimeActivationApproved` is always `false`
* `runtimeActivationExecuted` is always `false`
* `runtimePolicyEnforcementEnabled` is always `false`
* `runtimeConfigActivationEnabled` is always `false`
* `runtimeLearningEnabled` is always `false`
* `runtimeMlDecisioningEnabled` is always `false`
* `runtimeMultiAgentCoordinationEnabled` is always `false`
* `governanceBypassAllowed` is always `false`
* `applied` is always `false`
* `enforced` is always `false`
* `policyRuntimeMode` is always `preview-only`
* `runtimeBehaviorChanged` is always `false`
* `governanceDecisionsChanged` is always `false`
* `repairOrchestrationChanged` is always `false`
* `safePatchEngineOnly` is always `true`

v9.8 deterministic checks:

* governance-runtime-research-manifest-preview-unit
* governance-runtime-research-manifest-preview-missing
* governance-runtime-research-manifest-preview-not-ready
* governance-runtime-research-manifest-preview-ready
* governance-runtime-research-manifest-preview-blocked
* governance-runtime-research-manifest-preview-score
* governance-runtime-research-manifest-preview-forbidden-capabilities
* governance-runtime-research-manifest-preview-json-output
* governance-runtime-research-manifest-preview-artifact
* governance-runtime-research-manifest-preview-no-manifest-application
* governance-runtime-research-manifest-preview-no-autonomy

## Runtime Governance Research Attestation Preview (v9.9)

v9.9 adds a deterministic runtime governance research attestation preview command:

```bash
node dist/cli.js governance runtime research-attestation-preview
node dist/cli.js governance runtime research-attestation-preview --json
```

Artifacts:

```text
.factory/governance/runtime-governance-research-attestation-preview.json
.factory/governance/runtime-governance-research-attestation-preview.md
```

The attestation preview consolidates the full preview-only runtime governance research chain into attestation groups, attestation records, attestation findings, attestation ownership summaries, preview-only attestation summaries, forbidden capability attestation findings, and future-only attestation notes.

Safety guarantees:

* runtime research attestation is preview-only
* runtime research attestation is not applied
* runtime research attestation is not enforced
* runtime governance is NOT enabled
* runtime autonomy is NOT enabled
* runtime activation is NOT approved
* runtime activation is NOT executed
* runtime policies are NOT enforced
* runtime config activation is disabled
* runtime behavior does not change
* governance decisions do not change
* repair orchestration does not change
* Safe Patch Engine remains the only mutation layer

Example human output:

```text
# AI Software Factory - Runtime Governance Research Attestation Preview

Preview status:
created

Source runtime research manifest status:
created

Runtime research attestation conclusion:
research-attestation-ready

Runtime research attestation applied:
false

Runtime research attestation enforced:
false

Runtime governance enabled:
false

Runtime autonomy enabled:
false

Runtime activation approved:
false

Runtime activation executed:
false

Policy runtime mode:
preview-only

Research attestation score:
80

Research attestation rating:
research-attestation-ready

Recommended next stage:
prepare-runtime-governance-preview-conclusion
```

Example JSON fields:

```json
{
  "schemaVersion": 1,
  "previewStatus": "created",
  "sourceRuntimeResearchManifestStatus": "created",
  "runtimeResearchAttestationConclusion": "research-attestation-ready",
  "runtimeResearchAttestationApplied": false,
  "runtimeResearchAttestationEnforced": false,
  "runtimeGovernanceEnabled": false,
  "runtimeAutonomyEnabled": false,
  "runtimeActivationApproved": false,
  "runtimeActivationExecuted": false,
  "policyRuntimeMode": "preview-only",
  "runtimeBehaviorChanged": false,
  "repairOrchestrationChanged": false,
  "safePatchEngineOnly": true,
  "researchAttestationScore": {
    "score": 80,
    "rating": "research-attestation-ready"
  }
}
```

Example markdown runtime-governance-research-attestation-preview shape:

```markdown
# AI Software Factory - Runtime Governance Research Attestation Preview

Preview status:
created

Runtime research attestation conclusion:
research-attestation-ready

Runtime research attestation applied:
false

Runtime research attestation enforced:
false

## Attestation Groups

## Attestation Records

## Attestation Findings

## Attestation Ownership Summaries

## Preview-only Attestation Summaries

## Forbidden Capability Attestation Findings

## Future-only Attestation Notes

## Warnings
```

v9.9 hard invariants:

* `runtimeResearchAttestationApplied` is always `false`
* `runtimeResearchAttestationEnforced` is always `false`
* `runtimeResearchManifestApplied` is always `false`
* `runtimeResearchManifestEnforced` is always `false`
* `runtimeResearchRegistryApplied` is always `false`
* `runtimeResearchRegistryEnforced` is always `false`
* `runtimeResearchCatalogApplied` is always `false`
* `runtimeResearchCatalogEnforced` is always `false`
* `runtimeResearchArchiveApplied` is always `false`
* `runtimeResearchArchiveEnforced` is always `false`
* `runtimeResearchTimelineApplied` is always `false`
* `runtimeResearchTimelineEnforced` is always `false`
* `runtimeResearchMapApplied` is always `false`
* `runtimeResearchMapEnforced` is always `false`
* `runtimeResearchIndexApplied` is always `false`
* `runtimeResearchIndexEnforced` is always `false`
* `runtimeResearchApplied` is always `false`
* `runtimeResearchEnforced` is always `false`
* `runtimeFinalReviewApproved` is always `false`
* `runtimeFinalReviewApplied` is always `false`
* `runtimeFinalReviewEnforced` is always `false`
* `runtimeActivationApproved` is always `false`
* `runtimeActivationExecuted` is always `false`
* `runtimeGovernanceEnabled` is always `false`
* `runtimeAutonomyEnabled` is always `false`
* `runtimeAutonomyActionsAllowed` is always `false`
* `runtimePolicyEnforcementEnabled` is always `false`
* `runtimeConfigActivationEnabled` is always `false`
* `runtimeLearningEnabled` is always `false`
* `runtimeMlDecisioningEnabled` is always `false`
* `runtimeMultiAgentCoordinationEnabled` is always `false`
* `governanceBypassAllowed` is always `false`
* `applied` is always `false`
* `enforced` is always `false`
* `policyRuntimeMode` is always `preview-only`
* `runtimeBehaviorChanged` is always `false`
* `governanceDecisionsChanged` is always `false`
* `repairOrchestrationChanged` is always `false`
* `safePatchEngineOnly` is always `true`

v9.9 deterministic checks:

* governance-runtime-research-attestation-preview-unit
* governance-runtime-research-attestation-preview-missing
* governance-runtime-research-attestation-preview-not-ready
* governance-runtime-research-attestation-preview-ready
* governance-runtime-research-attestation-preview-blocked
* governance-runtime-research-attestation-preview-score
* governance-runtime-research-attestation-preview-forbidden-capabilities
* governance-runtime-research-attestation-preview-json-output
* governance-runtime-research-attestation-preview-artifact
* governance-runtime-research-attestation-preview-no-attestation-application
* governance-runtime-research-attestation-preview-no-autonomy

## Governance Architecture Consolidation Layer (v10.0)

v10.0 is a governance architecture consolidation release. It centralizes shared preview-only runtime invariants in:

```text
src/governance/governanceInvariants.ts
```

This release does not add a runtime capability, command, policy enforcement path, autonomy path, or mutation path. It reduces duplication by allowing governance preview modules to reference a single invariant source for runtime-disabled, preview-only, and Safe Patch Engine-only posture.

Centralized invariant groups:

* `GOVERNANCE_RUNTIME_DISABLED_FLAGS` keeps runtime governance, runtime autonomy, runtime activation, policy enforcement, runtime learning, ML decisioning, multi-agent coordination, plugin execution, script evaluation, sandbox execution, rollback, and bypass flags disabled.
* `GOVERNANCE_PREVIEW_ONLY_EXECUTION_FLAGS` keeps `applied`, `enforced`, runtime behavior changes, governance decision changes, and repair orchestration changes disabled while preserving `policyRuntimeMode: "preview-only"` and `safePatchEngineOnly: true`.
* `GOVERNANCE_RUNTIME_RESEARCH_CHAIN_PREVIEW_FLAGS` keeps post-v9 research chain preview records unapplied and unenforced.
* `GOVERNANCE_RUNTIME_RESEARCH_BASE_INVARIANTS` composes the shared research-chain, final-review, runtime-disabled, and preview-only invariants for future preview modules.

Safety guarantees:

* Safe Patch Engine remains the only mutation layer
* single-file mutation invariant remains unchanged
* runtime governance remains disabled
* runtime autonomy remains disabled
* runtime activation remains disabled
* policy enforcement remains disabled
* governance remains preview-only
* outputs remain deterministic
* no ML or vector DB behavior is introduced
* no AST parsing is introduced
* no autonomous runtime loops are introduced
* no runtime self-modification is introduced
* no mutation capability expansion is introduced
* no multi-file mutation is introduced
* repair orchestration does not change

v10.0 deterministic checks:

* governance-architecture-consolidation-invariants-unit

## v10.1 - Governance Artifact Schema & Renderer Foundation

v10.1 continues the Governance Consolidation Era by adding shared schema and rendering foundations without adding runtime capability, activation, enforcement, builder agents, planner loops, or mutation expansion.

New foundation files:

```text
src/governance/governanceStatus.ts
src/governance/governanceMetadata.ts
src/governance/governanceArtifact.ts
src/governance/utils/governanceUtils.ts
src/governance/renderers/governanceRenderers.ts
src/cli/render/cliRenderers.ts
```

Governance status normalization:

* `GovernanceStatus` defines stable values such as `preview`, `ready`, `blocked`, `warning`, `manual-review`, `disabled`, and `readonly`.
* `GovernanceSeverity` defines stable severity values.
* `GovernanceReadiness`, `GovernanceRecommendationType`, and `GovernanceArtifactType` provide explicit small unions for future governance artifacts.

Shared governance metadata schema:

* `GovernanceMetadata` supports explicit `version`, `generatedAt`, `source`, `command`, `readonly`, and `previewOnly` fields.
* No timestamps are generated implicitly.
* Deterministic output remains stable unless callers explicitly pass metadata values.

Shared governance artifact schema:

* `GovernanceRecommendation` records recommendation type, message, and optional severity.
* `GovernanceArtifact` records artifact type, status, severity, summary, reason, warnings, recommendations, and metadata.
* Existing governance modules are not forced to migrate fully.

Shared governance renderers:

* `renderSection`
* `renderWarnings`
* `renderRecommendations`
* `renderMetadata`
* `renderStatusBlock`
* `renderInvariantBlock`
* `renderSummary`
* `renderTimestamp`
* `renderDivider`

CLI renderer foundation:

* `renderCliSection`
* `renderCliStatus`
* `renderCliWarnings`
* `renderCliMetadata`
* `renderReadonlyNotice`

Conservative integration:

* `runtimeGovernanceResearchManifestPreview` includes a small shared-rendered governance artifact foundation section.
* JSON artifact meaning remains unchanged.
* Runtime behavior, governance decisions, and repair orchestration remain unchanged.

Safety guarantees:

* Safe Patch Engine remains the only mutation layer
* single-file mutation invariant remains unchanged
* runtime governance remains disabled
* runtime autonomy remains disabled
* runtime activation remains disabled
* policy enforcement remains disabled
* governance remains preview-only
* outputs remain deterministic
* no ML or vector DB behavior is introduced
* no AST parsing is introduced
* no autonomous runtime loops are introduced
* no runtime self-modification is introduced
* no mutation capability expansion is introduced
* no multi-file mutation is introduced
* no project-generation agents are introduced
* no planner-agent runtime loops are introduced
* no governance activation or policy enforcement path is introduced

v10.1 deterministic checks:

* governance-artifact-schema-consistency
* governance-render-consistency
* governance-status-normalization
* cli-render-consistency
* governance-readonly-rendering

## v10.2 - Governance CLI & Scenario Execution Consolidation Layer

v10.2 continues governance consolidation by expanding shared renderer usage and introducing deterministic scenario suite filtering for scalable validation. This is not a capability expansion release.

CLI rendering consolidation:

* `src/cli/render/cliRenderers.ts` now includes reusable status block, summary, divider, warning, metadata, section, and read-only notice helpers.
* Runtime governance research manifest and attestation help paths use shared CLI read-only notices.
* CLI read-only notices explicitly state that governance activation, policy enforcement, runtime autonomy, and mutation behavior are not enabled.

Governance rendering consolidation:

* `src/governance/renderers/governanceRenderers.ts` includes a shared read-only status block helper.
* Runtime governance research attestation preview includes a small shared-rendered governance foundation section.
* Runtime governance research manifest preview keeps its shared-rendered governance artifact foundation section.
* Existing JSON artifact meaning remains unchanged.

Scenario execution segmentation:

```powershell
node scripts\run-scenarios.js --suite governance
node scripts\run-scenarios.js --suite cli
node scripts\run-scenarios.js --suite renderers
```

Default execution remains the full scenario run when no `--suite` flag is provided. Suite filtering is deterministic, local, sequential, and does not introduce concurrency or orchestration changes.

Validation summary rendering:

* `src/cli/render/validationSummaryRenderer.ts` renders deterministic validation summaries with suites executed, suites skipped, total checks, passed checks, failed checks, and duration fields.
* Summary rendering uses shared CLI renderer helpers and preserves read-only preview guarantees.

v10.2 deterministic checks:

* cli-render-normalization
* governance-render-normalization
* scenario-suite-filtering
* scenario-summary-rendering
* readonly-render-consistency

Safety guarantees:

* Safe Patch Engine remains the sole mutation layer
* single-file mutation invariant remains unchanged
* runtime governance remains disabled
* runtime autonomy remains disabled
* runtime activation remains disabled
* policy enforcement remains disabled
* governance remains preview-only
* deterministic outputs are preserved
* no ML or vector DB behavior is introduced
* no AST parsing is introduced
* no planner-agent loops are introduced
* no runtime self-modification is introduced
* no multi-file mutation is introduced
* no mutation capability expansion is introduced
* no builder agents are introduced
* no repair orchestration behavior changes are introduced

## v10.3 - Governance Artifact Migration & Read-Only Contract Layer

v10.3 continues the Governance Consolidation Era by adding deterministic artifact factory helpers, read-only contract data, and a conservative migration bridge for selected governance previews. This is not a capability expansion release.

Governance artifact factory helpers:

* `src/governance/governanceArtifactFactory.ts` adds `createGovernanceMetadata`, `createPreviewGovernanceArtifact`, and `createReadonlyGovernanceArtifact`.
* Factory output is deterministic and does not generate timestamps implicitly.
* Factory helpers do not write files, activate governance, enforce policy, or mutate runtime behavior.

Read-only contract helpers:

* `src/governance/governanceReadonlyContract.ts` adds `createReadonlyContract`, `assertReadonlyContractShape`, and `renderReadonlyContract`.
* The contract represents `runtimeGovernanceEnabled: false`, `runtimeAutonomyEnabled: false`, `runtimeActivationExecuted: false`, `policyEnforcementEnabled: false`, `governancePreviewOnly: true`, and `safePatchEngineOnly: true`.
* The contract is descriptive only and does not enforce runtime behavior.

Selected preview migration:

* `runtimeGovernanceResearchManifestPreview` now includes a `normalizedGovernanceArtifact` object built with the shared read-only artifact factory.
* `runtimeGovernanceResearchAttestationPreview` now includes a `normalizedGovernanceArtifact` object built with the shared read-only artifact factory.
* Existing preview fields, JSON meaning, CLI semantics, runtime invariants, governance decisions, and repair orchestration behavior remain unchanged.

Artifact rendering bridges:

* `renderGovernanceArtifact` renders shared governance artifacts with stable artifact type, status, severity, summary, warnings, recommendations, metadata, and optional read-only contract output.
* `renderCliGovernanceArtifact` renders shared governance artifacts for CLI/help contexts with deterministic formatting and read-only preview notices.
* Runtime governance research manifest help includes the CLI artifact rendering bridge as a conservative proof of integration.

v10.3 deterministic checks:

* governance-artifact-factory-consistency
* governance-readonly-contract-consistency
* governance-artifact-rendering
* cli-artifact-rendering
* governance-preview-artifact-shape

Scenario suite filtering:

```powershell
node scripts\run-scenarios.js --suite artifacts
```

Safety guarantees:

* Safe Patch Engine remains the sole mutation layer
* single-file mutation invariant remains unchanged
* runtime governance remains disabled
* runtime autonomy remains disabled
* runtime activation remains disabled
* policy enforcement remains disabled
* governance remains preview-only
* deterministic outputs are preserved
* no ML or vector DB behavior is introduced
* no AST parsing is introduced
* no planner-agent loops are introduced
* no runtime self-modification is introduced
* no multi-file mutation is introduced
* no mutation capability expansion is introduced
* no builder agents are introduced
* no runtime behavior changes are introduced
* no repair orchestration behavior changes are introduced
* no governance activation or policy enforcement path is introduced

## v10.4 - Governance Artifact Registry Consolidation Layer

v10.4 continues the Governance Consolidation Era by adding a lightweight deterministic registry layer for normalized governance artifacts. The registry is descriptive only and does not activate, enforce, schedule, execute, mutate, or route runtime behavior.

Governance artifact registry model:

* `src/governance/governanceArtifactRegistry.ts` adds `GovernanceArtifactRegistryEntry`, `GovernanceArtifactRegistry`, `createGovernanceArtifactRegistry`, `registerGovernanceArtifact`, `sortGovernanceArtifactRegistry`, and `summarizeGovernanceArtifactRegistry`.
* Registry entries record stable artifact metadata: `artifactType`, `status`, `severity`, `summary`, `source`, `version`, `previewOnly`, and `readonly`.
* Registry helpers return deterministic data, do not write files, do not generate hidden timestamps, and do not introduce runtime activation or policy enforcement.

Registry sorting and summaries:

* Entries sort deterministically by version, artifact type, status, source, and summary.
* Registry summaries include artifact count, artifact types, statuses, all-preview-only state, all-read-only state, and warnings for unexpected preview-only/read-only shape violations.
* Registry warnings are sorted deterministically.

Registry rendering:

* `renderGovernanceArtifactRegistrySummary` renders stable artifact counts, artifact types, statuses, read-only state, preview-only state, and warnings.
* `renderGovernanceArtifactRegistry` renders deterministic registry title, summary, and entries.
* `renderCliGovernanceArtifactRegistry` renders the same registry information with shared CLI renderer helpers and read-only preview notice text.

Selected preview integration:

* `runtimeGovernanceResearchManifestPreview` includes `normalizedGovernanceArtifactRegistry` derived from its normalized read-only governance artifact.
* `runtimeGovernanceResearchAttestationPreview` includes `normalizedGovernanceArtifactRegistry` derived from its normalized read-only governance artifact.
* Existing preview fields, JSON meaning, CLI semantics, governance decisions, runtime behavior, and repair orchestration remain unchanged.

v10.4 deterministic checks:

* governance-artifact-registry-consistency
* governance-artifact-registry-sorting
* governance-artifact-registry-rendering
* cli-artifact-registry-rendering
* governance-preview-registry-summary

Scenario suite filtering:

```powershell
node scripts\run-scenarios.js --suite registry
```

Safety guarantees:

* Safe Patch Engine remains the sole mutation layer
* single-file mutation invariant remains unchanged
* runtime governance remains disabled
* runtime autonomy remains disabled
* runtime activation remains disabled
* policy enforcement remains disabled
* governance remains preview-only
* deterministic outputs are preserved
* no ML or vector DB behavior is introduced
* no AST parsing is introduced
* no planner-agent loops are introduced
* no runtime self-modification is introduced
* no multi-file mutation is introduced
* no mutation capability expansion is introduced
* no builder agents are introduced
* no runtime behavior changes are introduced
* no repair orchestration behavior changes are introduced
* no governance activation or policy enforcement path is introduced

## v10.5 - Governance Artifact Index & Discovery Layer

v10.5 continues the Governance Consolidation Era by adding a deterministic index and discovery layer over governance artifact registry entries. The index is descriptive only and does not activate, enforce, schedule, execute, mutate, route, or change runtime behavior.

Governance artifact index model:

* `src/governance/governanceArtifactIndex.ts` adds `GovernanceArtifactIndex`, `GovernanceArtifactIndexEntry`, `createGovernanceArtifactIndex`, `indexGovernanceArtifactRegistry`, `sortGovernanceArtifactIndex`, and `summarizeGovernanceArtifactIndex`.
* Index entries record stable artifact fields: `artifactType`, `status`, `severity`, `source`, `version`, `previewOnly`, `readonly`, and `summary`.
* Index helpers are pure, deterministic, do not write files, do not generate hidden timestamps, and do not introduce runtime activation, policy enforcement, or runtime routing.

Discovery/filter helpers:

* `findArtifactsByType`
* `findArtifactsByStatus`
* `findArtifactsBySeverity`
* `findReadonlyArtifacts`
* `findPreviewOnlyArtifacts`
* `findArtifactsBySource`

Index sorting and summaries:

* Index entries sort deterministically by version, artifact type, status, severity, source, and summary.
* Index summaries include total entries, grouped artifact types, grouped statuses, read-only entry counts, preview-only entry counts, all-read-only state, and all-preview-only state.
* Empty discovery results render predictably as `none`.

Index rendering:

* `renderGovernanceArtifactIndexSummary` renders stable index totals, grouped artifact types, grouped statuses, read-only state, and preview-only state.
* `renderGovernanceArtifactIndex` renders deterministic index title, summary, and entries.
* `renderGovernanceArtifactDiscoveryResults` renders deterministic discovery query summaries and result entries.
* `renderCliGovernanceArtifactIndex` and `renderCliGovernanceArtifactDiscoveryResults` provide equivalent CLI-safe deterministic output.

Selected preview integration:

* `runtimeGovernanceResearchManifestPreview` includes `normalizedGovernanceArtifactIndex` derived from its normalized governance artifact registry.
* `runtimeGovernanceResearchAttestationPreview` includes `normalizedGovernanceArtifactIndex` derived from its normalized governance artifact registry.
* Existing preview fields, JSON meaning, CLI semantics, governance decisions, runtime behavior, and repair orchestration remain unchanged.

v10.5 deterministic checks:

* governance-artifact-index-consistency
* governance-artifact-index-sorting
* governance-artifact-discovery-filtering
* governance-artifact-index-rendering
* cli-artifact-index-rendering
* governance-preview-index-summary

Scenario suite filtering:

```powershell
node scripts\run-scenarios.js --suite index
```

Safety guarantees:

* Safe Patch Engine remains the sole mutation layer
* single-file mutation invariant remains unchanged
* runtime governance remains disabled
* runtime autonomy remains disabled
* runtime activation remains disabled
* policy enforcement remains disabled
* governance remains preview-only
* deterministic outputs are preserved
* no ML or vector DB behavior is introduced
* no AST parsing is introduced
* no planner-agent loops are introduced
* no runtime self-modification is introduced
* no multi-file mutation is introduced
* no mutation capability expansion is introduced
* no builder agents are introduced
* no runtime routing is introduced
* no runtime behavior changes are introduced
* no repair orchestration behavior changes are introduced
* no governance activation or policy enforcement path is introduced

## v10.6 - Governance Artifact Query & Inspection CLI Layer

v10.6 continues the Governance Consolidation Era by adding deterministic read-only query helpers and a conservative CLI inspection path for normalized governance artifact indexes. The query layer is descriptive only and does not activate, enforce, schedule, execute, mutate, route, or change runtime behavior.

Governance artifact query helpers:

* `src/governance/governanceArtifactQuery.ts` adds `queryGovernanceArtifacts`, `queryGovernanceArtifactsByType`, `queryGovernanceArtifactsByStatus`, `queryGovernanceArtifactsBySeverity`, `queryReadonlyGovernanceArtifacts`, and `queryPreviewOnlyGovernanceArtifacts`.
* Query helpers operate over `GovernanceArtifactIndex` values and return stable sorted entries from the index/discovery layer.
* Query helpers are pure, do not write files, do not generate hidden timestamps, do not enforce policy, and do not route runtime behavior.

Query result model:

* `GovernanceArtifactQuery` records query type and query value.
* `GovernanceArtifactQueryResult` records query type, query value, total matches, entries, read-only state, preview-only state, and summary.
* `GovernanceArtifactQuerySummary` records total matches, read-only state, and preview-only state for dashboard-friendly consumers.

Query rendering:

* `renderGovernanceArtifactQuerySummary` renders deterministic query totals and read-only/preview-only state.
* `renderGovernanceArtifactQueryResult` renders deterministic query type, query value, total matches, and matching artifact entries.
* `renderCliGovernanceArtifactQuerySummary` and `renderCliGovernanceArtifactQueryResult` provide equivalent CLI-safe deterministic output.
* Empty query results render predictably as `none`.

Read-only CLI inspection path:

```powershell
node dist\cli.js governance artifact-index --help
node dist\cli.js governance artifact-index --json
```

The `governance artifact-index` command provides deterministic sample inspection output only. It does not depend on live runtime artifacts, activate governance, enforce policy, route runtime behavior, mutate files, or change repair orchestration.

v10.6 deterministic checks:

* governance-artifact-query-consistency
* governance-artifact-query-empty-results
* governance-artifact-query-rendering
* cli-artifact-query-rendering
* governance-artifact-query-help-output

Scenario suite filtering:

```powershell
node scripts\run-scenarios.js --suite query
```

Safety guarantees:

* Safe Patch Engine remains the sole mutation layer
* single-file mutation invariant remains unchanged
* runtime governance remains disabled
* runtime autonomy remains disabled
* runtime activation remains disabled
* policy enforcement remains disabled
* governance remains preview-only
* deterministic outputs are preserved
* no ML or vector DB behavior is introduced
* no AST parsing is introduced
* no planner-agent loops are introduced
* no runtime self-modification is introduced
* no multi-file mutation is introduced
* no mutation capability expansion is introduced
* no builder agents are introduced
* no runtime routing is introduced
* no runtime behavior changes are introduced
* no repair orchestration behavior changes are introduced
* no governance activation or policy enforcement path is introduced

## v10.7 - Governance Artifact Export Contract Layer

v10.7 continues the Governance Consolidation Era by adding deterministic export contracts for normalized governance artifacts, registries, indexes, and query results. The export layer is descriptive only and does not activate, enforce, schedule, execute, mutate, route, write files by default, or change runtime behavior.

Governance artifact export contract model:

* `src/governance/governanceArtifactExport.ts` adds `GovernanceArtifactExportFormat`, `GovernanceArtifactExportContract`, `GovernanceArtifactExportPayload`, `createGovernanceArtifactExportContract`, and `createGovernanceArtifactExportPayload`.
* Supported export formats are explicit and limited to `json` and `markdown`.
* Export contracts record read-only, preview-only, stdout-only, no-file-write, no-runtime-routing, no-runtime-activation, and no-policy-enforcement guarantees.
* Export helpers require explicit metadata input and do not generate hidden timestamps.

JSON export helpers:

* `exportGovernanceArtifactAsJson`
* `exportGovernanceArtifactRegistryAsJson`
* `exportGovernanceArtifactIndexAsJson`
* `exportGovernanceArtifactQueryResultAsJson`

Markdown export helpers:

* `exportGovernanceArtifactAsMarkdown`
* `exportGovernanceArtifactRegistryAsMarkdown`
* `exportGovernanceArtifactIndexAsMarkdown`
* `exportGovernanceArtifactQueryResultAsMarkdown`

Export rendering:

* `renderGovernanceArtifactExportContract` and `renderGovernanceArtifactExportPayload` render deterministic export contract and payload previews.
* `renderCliGovernanceArtifactExportContract` and `renderCliGovernanceArtifactExportPayload` provide equivalent CLI-safe deterministic output.
* Empty query/index export output remains predictable.

CLI export preview:

```powershell
node dist\cli.js governance artifact-index --export json
node dist\cli.js governance artifact-index --export markdown
```

Export previews print to stdout only. They do not write files, mutate state, activate governance, enforce policy, route runtime behavior, or change repair orchestration. Existing `node dist\cli.js governance artifact-index --json` behavior remains stable.

v10.7 deterministic checks:

* governance-artifact-export-contract-consistency
* governance-artifact-export-json-consistency
* governance-artifact-export-markdown-consistency
* cli-artifact-export-rendering
* governance-artifact-export-help-output

Scenario suite filtering:

```powershell
node scripts\run-scenarios.js --suite export
```

Safety guarantees:

* Safe Patch Engine remains the sole mutation layer
* single-file mutation invariant remains unchanged
* runtime governance remains disabled
* runtime autonomy remains disabled
* runtime activation remains disabled
* policy enforcement remains disabled
* governance remains preview-only
* deterministic outputs are preserved
* no ML or vector DB behavior is introduced
* no AST parsing is introduced
* no planner-agent loops are introduced
* no runtime self-modification is introduced
* no multi-file mutation is introduced
* no mutation capability expansion is introduced
* no builder agents are introduced
* no runtime routing is introduced
* no export file writing is introduced by default
* no runtime behavior changes are introduced
* no repair orchestration behavior changes are introduced
* no governance activation or policy enforcement path is introduced

## v10.8 - Governance Artifact Snapshot Preview Layer

v10.8 continues the Governance Consolidation Era by adding deterministic snapshot preview contracts for normalized governance artifacts, registries, indexes, query results, and export payloads. The snapshot layer is descriptive only and does not activate, enforce, schedule, execute, mutate, route, write files by default, or change runtime behavior.

Governance artifact snapshot model:

* `src/governance/governanceArtifactSnapshot.ts` adds `GovernanceArtifactSnapshot`, `GovernanceArtifactSnapshotSection`, `GovernanceArtifactSnapshotSummary`, `createGovernanceArtifactSnapshot`, and `summarizeGovernanceArtifactSnapshot`.
* Snapshots record explicit read-only, preview-only, stdout-only, no-file-write, no-runtime-routing, no-runtime-activation, and no-policy-enforcement guarantees.
* Snapshot helpers require explicit metadata input and do not generate hidden timestamps.

Snapshot section helpers:

* `createArtifactSnapshotSection`
* `createRegistrySnapshotSection`
* `createIndexSnapshotSection`
* `createQuerySnapshotSection`
* `createExportSnapshotSection`

Each section records section type, title, summary, entry count, read-only state, preview-only state, and warnings. Section ordering is deterministic.

Snapshot rendering:

* `renderGovernanceArtifactSnapshotSummary` renders deterministic snapshot totals and read-only/preview-only state.
* `renderGovernanceArtifactSnapshotSection` renders stable section details.
* `renderGovernanceArtifactSnapshot` renders snapshot title, guarantees, metadata, summary, and section summaries.
* `renderCliGovernanceArtifactSnapshotSummary` and `renderCliGovernanceArtifactSnapshot` provide equivalent CLI-safe deterministic output.

CLI snapshot preview:

```powershell
node dist\cli.js governance artifact-index --snapshot
node dist\cli.js governance artifact-index --snapshot --json
```

Snapshot previews print to stdout only. They do not write files, mutate state, activate governance, enforce policy, route runtime behavior, or change repair orchestration. Existing `--json` and `--export` behavior remains stable.

v10.8 deterministic checks:

* governance-artifact-snapshot-consistency
* governance-artifact-snapshot-section-consistency
* governance-artifact-snapshot-rendering
* cli-artifact-snapshot-rendering
* governance-artifact-snapshot-help-output

Scenario suite filtering:

```powershell
node scripts\run-scenarios.js --suite snapshot
```

Safety guarantees:

* Safe Patch Engine remains the sole mutation layer
* single-file mutation invariant remains unchanged
* runtime governance remains disabled
* runtime autonomy remains disabled
* runtime activation remains disabled
* policy enforcement remains disabled
* governance remains preview-only
* deterministic outputs are preserved
* no ML or vector DB behavior is introduced
* no AST parsing is introduced
* no planner-agent loops are introduced
* no runtime self-modification is introduced
* no multi-file mutation is introduced
* no mutation capability expansion is introduced
* no builder agents are introduced
* no runtime routing is introduced
* no snapshot file writing is introduced by default
* no runtime behavior changes are introduced
* no repair orchestration behavior changes are introduced
* no governance activation or policy enforcement path is introduced

## v10.9 - Governance Artifact Review Pack Preview Layer

v10.9 continues the Governance Consolidation Era by adding deterministic review pack preview contracts for normalized governance artifacts, registries, indexes, query results, export payloads, and snapshots. The review pack layer is descriptive only and does not activate, enforce, schedule, execute, mutate, route, write files by default, or change runtime behavior.

Governance artifact review pack model:

* `src/governance/governanceArtifactReviewPack.ts` adds `GovernanceArtifactReviewPack`, `GovernanceArtifactReviewPackSection`, `GovernanceArtifactReviewPackSummary`, `createGovernanceArtifactReviewPack`, and `summarizeGovernanceArtifactReviewPack`.
* Review packs record explicit read-only, preview-only, stdout-only, no-file-write, no-runtime-routing, no-runtime-activation, and no-policy-enforcement guarantees.
* Review pack helpers require explicit metadata input and do not generate hidden timestamps.

Review pack section helpers:

* `createReviewPackOverviewSection`
* `createReviewPackArtifactSection`
* `createReviewPackRegistrySection`
* `createReviewPackIndexSection`
* `createReviewPackQuerySection`
* `createReviewPackExportSection`
* `createReviewPackSnapshotSection`
* `createReviewPackReadonlyContractSection`

Each section records section type, title, summary, entry count, read-only state, preview-only state, warnings, and recommendations. Section ordering is deterministic.

Review pack rendering:

* `renderGovernanceArtifactReviewPackSummary` renders deterministic section totals, entry totals, read-only/preview-only state, warnings, and recommendations.
* `renderGovernanceArtifactReviewPackSection` renders stable section details.
* `renderGovernanceArtifactReviewPack` renders review pack title, guarantees, metadata, summary, and section summaries.
* `renderCliGovernanceArtifactReviewPackSummary` and `renderCliGovernanceArtifactReviewPack` provide equivalent CLI-safe deterministic output.

CLI review pack preview:

```powershell
node dist\cli.js governance artifact-index --review-pack
node dist\cli.js governance artifact-index --review-pack --json
```

Review pack previews print to stdout only. They do not write files, mutate state, activate governance, enforce policy, route runtime behavior, or change repair orchestration. Existing `--json`, `--export`, and `--snapshot` behavior remains stable.

v10.9 deterministic checks:

* governance-artifact-review-pack-consistency
* governance-artifact-review-pack-section-consistency
* governance-artifact-review-pack-rendering
* cli-artifact-review-pack-rendering
* governance-artifact-review-pack-help-output

Scenario suite filtering:

```powershell
node scripts\run-scenarios.js --suite review-pack
```

Safety guarantees:

* Safe Patch Engine remains the sole mutation layer
* single-file mutation invariant remains unchanged
* runtime governance remains disabled
* runtime autonomy remains disabled
* runtime activation remains disabled
* policy enforcement remains disabled
* governance remains preview-only
* deterministic outputs are preserved
* no ML or vector DB behavior is introduced
* no AST parsing is introduced
* no planner-agent loops are introduced
* no runtime self-modification is introduced
* no multi-file mutation is introduced
* no mutation capability expansion is introduced
* no builder agents are introduced
* no runtime routing is introduced
* no review pack file writing is introduced by default
* no runtime behavior changes are introduced
* no repair orchestration behavior changes are introduced
* no governance activation or policy enforcement path is introduced

## v10.10 - Governance Consolidation Completion Audit Layer

v10.10 completes the Governance Consolidation Era checkpoint by adding a deterministic completion audit over the full v10.x governance artifact chain. The audit layer is descriptive only and does not activate, enforce, schedule, execute, mutate, route, write files by default, or change runtime behavior.

Governance consolidation audit model:

* `src/governance/governanceConsolidationAudit.ts` adds `GovernanceConsolidationAudit`, `GovernanceConsolidationAuditSection`, `GovernanceConsolidationAuditSummary`, `createGovernanceConsolidationAudit`, and `summarizeGovernanceConsolidationAudit`.
* Audit records explicitly preserve read-only, preview-only, stdout-only, no-file-write, no-runtime-routing, no-runtime-activation, and no-policy-enforcement guarantees.
* Audit helpers require explicit metadata input and do not generate hidden timestamps.

Audit section helpers:

* `createAuditInvariantsSection`
* `createAuditSchemaSection`
* `createAuditRendererSection`
* `createAuditCliSection`
* `createAuditArtifactPipelineSection`
* `createAuditValidationSuiteSection`
* `createAuditReadonlyGuaranteeSection`

Each section records section type, title, summary, completion status, entry count, read-only state, preview-only state, warnings, and recommendations. Section ordering is deterministic.

Audit rendering:

* `renderGovernanceConsolidationAuditSummary` renders deterministic section totals, entry totals, completion status, read-only/preview-only state, warnings, and recommendations.
* `renderGovernanceConsolidationAuditSection` renders stable section details.
* `renderGovernanceConsolidationAudit` renders audit title, guarantees, metadata, summary, and section summaries.
* `renderCliGovernanceConsolidationAuditSummary` and `renderCliGovernanceConsolidationAudit` provide equivalent CLI-safe deterministic output.

CLI audit preview:

```powershell
node dist\cli.js governance consolidation-audit
node dist\cli.js governance consolidation-audit --json
```

Audit previews print to stdout only. They do not write files, mutate state, activate governance, enforce policy, route runtime behavior, or change repair orchestration.

v10.x consolidation chain summary:

* v10.0 invariants
* v10.1 schemas/renderers
* v10.2 CLI/suites
* v10.3 artifacts/contracts
* v10.4 registry
* v10.5 index/discovery
* v10.6 query/CLI inspection
* v10.7 export contracts
* v10.8 snapshots
* v10.9 review packs
* v10.10 completion audit

v10.10 deterministic checks:

* governance-consolidation-audit-consistency
* governance-consolidation-audit-section-consistency
* governance-consolidation-audit-rendering
* cli-governance-consolidation-audit-rendering
* governance-consolidation-audit-help-output

Scenario suite filtering:

```powershell
node scripts\run-scenarios.js --suite audit
```

Safety guarantees:

* Safe Patch Engine remains the sole mutation layer
* single-file mutation invariant remains unchanged
* runtime governance remains disabled
* runtime autonomy remains disabled
* runtime activation remains disabled
* policy enforcement remains disabled
* governance remains preview-only
* deterministic outputs are preserved
* no ML or vector DB behavior is introduced
* no AST parsing is introduced
* no planner-agent loops are introduced
* no runtime self-modification is introduced
* no multi-file mutation is introduced
* no mutation capability expansion is introduced
* no builder agents are introduced
* no runtime routing is introduced
* no audit file writing is introduced by default
* no runtime behavior changes are introduced
* no repair orchestration behavior changes are introduced
* no governance activation or policy enforcement path is introduced

## v11.0 - Project Generation Readiness Assessment Layer

v11.0 begins the Project Generation Readiness Era after the v10.x Governance Consolidation Era. This release adds a deterministic, read-only readiness assessment for future controlled project generation systems. It does not implement builder agents, autonomous project generation, scaffolding runtimes, planner loops, runtime routing, policy enforcement, governance activation, file writing, or runtime orchestration.

Readiness assessment model:

* `src/governance/projectGenerationReadiness.ts` adds `ProjectGenerationReadinessAssessment`, `ProjectGenerationReadinessSection`, `ProjectGenerationReadinessSummary`, `ProjectGenerationReadinessScore`, `createProjectGenerationReadinessAssessment`, and `summarizeProjectGenerationReadinessAssessment`.
* Assessment records explicitly preserve read-only, preview-only, assessment-only, stdout-only, no-file-write, no-runtime-routing, no-runtime-activation, no-policy-enforcement, no-project-generation, and no-builder-agent-runtime guarantees.
* Readiness helpers require explicit metadata input and do not generate hidden timestamps.

Readiness sections:

* governance consolidation
* artifact pipeline
* CLI inspection
* validation suites
* read-only contracts
* Safe Patch Engine boundary
* single-file mutation boundary
* runtime activation disabled
* builder-agent readiness, assessment-only
* project scaffolding readiness, assessment-only
* orchestration readiness, assessment-only
* human approval readiness

Advisory scoring:

* `calculateProjectGenerationReadinessScore` deterministically computes a 0-100 advisory score.
* Readiness levels are `blocked`, `partial`, `ready-for-design`, and `ready-for-preview`.
* Scoring is descriptive only and does not activate governance, route runtime behavior, generate projects, or enable builder agents.

Readiness rendering:

* `renderProjectGenerationReadinessSummary` renders deterministic section totals, advisory score, readiness level, blocking risks, warnings, and recommendations.
* `renderProjectGenerationReadinessSection` renders stable section details.
* `renderProjectGenerationReadinessAssessment` renders assessment title, guarantees, metadata, summary, explicit no-runtime-activation notice, and section summaries.
* `renderCliProjectGenerationReadinessSummary` and `renderCliProjectGenerationReadinessAssessment` provide equivalent CLI-safe deterministic output.

CLI readiness preview:

```powershell
node dist\cli.js governance project-generation-readiness
node dist\cli.js governance project-generation-readiness --json
```

Readiness previews print to stdout only. They do not write files, mutate state, generate projects, implement builder agents, activate governance, enforce policy, route runtime behavior, or change repair orchestration.

Project Generation Readiness Era transition:

* v10.x completed the Governance Consolidation Era with stable invariants, schemas, artifact registries, indexes, queries, exports, snapshots, review packs, and completion audit checks.
* v11.0 starts the Project Generation Readiness Era by assessing future controlled generation prerequisites only.
* No project generation runtime exists in v11.0.
* No builder agents exist in v11.0.

v11.0 deterministic checks:

* project-generation-readiness-consistency
* project-generation-readiness-section-consistency
* project-generation-readiness-scoring
* project-generation-readiness-rendering
* project-generation-readiness-cli-output
* project-generation-readiness-help-output

Scenario suite filtering:

```powershell
node scripts\run-scenarios.js --suite project-generation
```

Safety guarantees:

* Safe Patch Engine remains the sole mutation layer
* single-file mutation invariant remains unchanged
* runtime governance remains disabled
* runtime autonomy remains disabled
* runtime activation remains disabled
* policy enforcement remains disabled
* governance remains preview-only
* deterministic outputs are preserved
* no ML or vector DB behavior is introduced
* no AST parsing is introduced
* no planner-agent runtime loops are introduced
* no runtime self-modification is introduced
* no multi-file mutation is introduced
* no mutation capability expansion is introduced
* no autonomous project generation is introduced
* no builder agents are introduced
* no project scaffolding runtime is introduced
* no runtime routing is introduced
* no readiness file writing is introduced by default
* no runtime behavior changes are introduced
* no repair orchestration behavior changes are introduced
* no governance activation or policy enforcement path is introduced

## v11.1 - Project Generation Capability Map Layer

v11.1 continues the Project Generation Readiness Era by adding a deterministic, read-only capability map for future controlled project generation systems. The capability map is descriptive planning data only. It does not implement builder agents, autonomous project generation, project scaffolding runtime, planner loops, runtime routing, policy enforcement, governance activation, file writing, mutation expansion, or runtime orchestration.

Capability map model:

* `src/governance/projectGenerationCapabilityMap.ts` adds `ProjectGenerationCapabilityMap`, `ProjectGenerationCapability`, `ProjectGenerationCapabilityDependency`, `ProjectGenerationCapabilitySummary`, `createProjectGenerationCapabilityMap`, and `summarizeProjectGenerationCapabilityMap`.
* Capability maps explicitly preserve read-only, preview-only, planning-only, stdout-only, no-file-write, no-runtime-routing, no-runtime-activation, no-policy-enforcement, no-project-generation, and no-builder-agent-runtime guarantees.
* Capability map helpers require explicit metadata input and do not generate hidden timestamps.

Capability classification:

* project intent capture
* requirements normalization
* project blueprint planning
* file plan preview
* dependency plan preview
* task graph preview
* Safe Patch integration
* human approval workflow
* validation plan preview
* rollback plan preview
* artifact review pack integration

Each capability records deterministic ID, title, description, status, risk level, readiness, dependencies, blocked-by items, required governance artifacts, warnings, recommendations, read-only state, and preview-only state.

Dependency helpers:

* `sortProjectGenerationCapabilities`
* `findCapabilityById`
* `findCapabilitiesByStatus`
* `findCapabilitiesByRiskLevel`
* `findBlockedCapabilities`
* `summarizeCapabilityDependencies`

Capability map rendering:

* `renderProjectGenerationCapabilitySummary` renders deterministic capability totals, status distribution, risk distribution, blocked capabilities, dependencies, warnings, and recommendations.
* `renderProjectGenerationCapability` renders stable capability details.
* `renderProjectGenerationCapabilityMap` renders map title, guarantees, metadata, summary, capabilities, dependency edges, and an explicit no-runtime-generation notice.
* `renderCliProjectGenerationCapabilitySummary` and `renderCliProjectGenerationCapabilityMap` provide equivalent CLI-safe deterministic output.

CLI capability map preview:

```powershell
node dist\cli.js governance project-generation-capabilities
node dist\cli.js governance project-generation-capabilities --json
```

Capability previews print to stdout only. They do not write files, mutate state, generate projects, implement builder agents, activate governance, enforce policy, route runtime behavior, expand mutation scope, or change repair orchestration.

v11.1 deterministic checks:

* project-generation-capability-map-consistency
* project-generation-capability-map-summary
* project-generation-capability-dependency-sorting
* project-generation-capability-filtering
* project-generation-capability-rendering
* project-generation-capability-cli-output
* project-generation-capability-help-output

Scenario suite filtering:

```powershell
node scripts\run-scenarios.js --suite project-generation
```

Safety guarantees:

* Safe Patch Engine remains the sole mutation layer
* single-file mutation invariant remains unchanged
* runtime governance remains disabled
* runtime autonomy remains disabled
* runtime activation remains disabled
* policy enforcement remains disabled
* governance remains preview-only
* deterministic outputs are preserved
* no ML or vector DB behavior is introduced
* no AST parsing is introduced
* no planner-agent runtime loops are introduced
* no runtime self-modification is introduced
* no multi-file mutation is introduced
* no mutation capability expansion is introduced
* no autonomous project generation is introduced
* no builder agents are introduced
* no project scaffolding runtime is introduced
* no runtime routing is introduced
* no capability file writing is introduced by default
* no runtime behavior changes are introduced
* no repair orchestration behavior changes are introduced
* no governance activation or policy enforcement path is introduced

## v11.2 - Project Generation Blueprint Preview Layer

v11.2 continues the Project Generation Readiness Era by adding a deterministic, read-only blueprint preview model for future controlled project generation systems. The blueprint preview is descriptive planning data only. It does not implement builder agents, autonomous project generation, scaffold generation, file creation, runtime routing, policy enforcement, governance activation, mutation expansion, or runtime orchestration.

Blueprint preview model:

* `src/governance/projectGenerationBlueprintPreview.ts` adds `ProjectGenerationBlueprintPreview`, `ProjectGenerationBlueprintSection`, `ProjectGenerationBlueprintSummary`, `ProjectGenerationBlueprintCompleteness`, `createProjectGenerationBlueprintPreview`, and `summarizeProjectGenerationBlueprintPreview`.
* Blueprint previews explicitly preserve read-only, preview-only, blueprint-preview-only, stdout-only, no-file-write, no-file-creation, no-scaffold-generation, no-runtime-routing, no-runtime-activation, no-policy-enforcement, no-project-generation, and no-builder-agent-runtime guarantees.
* Blueprint helpers require explicit metadata input and do not generate hidden timestamps.

Blueprint sections:

* project intent
* requirements
* architecture
* file plan
* dependency plan
* validation plan
* governance plan
* human approval plan
* risk plan
* rollback plan

Each section records section type, title, status, summary, deterministic items, risks, warnings, recommendations, read-only state, and preview-only state.

Advisory completeness scoring:

* `calculateProjectGenerationBlueprintCompleteness` deterministically computes a 0-100 advisory score.
* Completeness levels are `incomplete`, `partial`, `review-ready`, and `ready-for-design`.
* Scoring is descriptive only and does not activate governance, route runtime behavior, generate projects, scaffold files, create files, or enable builder agents.

Blueprint rendering:

* `renderProjectGenerationBlueprintSummary` renders deterministic section totals, item totals, completeness score, completeness level, risks, warnings, and recommendations.
* `renderProjectGenerationBlueprintSection` renders stable blueprint section details.
* `renderProjectGenerationBlueprintPreview` renders blueprint title, guarantees, metadata, summary, section details, and an explicit no-project-generation notice.
* `renderCliProjectGenerationBlueprintSummary` and `renderCliProjectGenerationBlueprintPreview` provide equivalent CLI-safe deterministic output.

CLI blueprint preview:

```powershell
node dist\cli.js governance project-generation-blueprint
node dist\cli.js governance project-generation-blueprint --json
```

Blueprint previews print to stdout only. They do not write files, create files, scaffold files, mutate state, generate projects, implement builder agents, activate governance, enforce policy, route runtime behavior, expand mutation scope, or change repair orchestration.

v11.2 deterministic checks:

* project-generation-blueprint-consistency
* project-generation-blueprint-section-consistency
* project-generation-blueprint-completeness
* project-generation-blueprint-rendering
* project-generation-blueprint-cli-output
* project-generation-blueprint-help-output

Scenario suite filtering:

```powershell
node scripts\run-scenarios.js --suite project-generation
```

Safety guarantees:

* Safe Patch Engine remains the sole mutation layer
* single-file mutation invariant remains unchanged
* runtime governance remains disabled
* runtime autonomy remains disabled
* runtime activation remains disabled
* policy enforcement remains disabled
* governance remains preview-only
* deterministic outputs are preserved
* no ML or vector DB behavior is introduced
* no AST parsing is introduced
* no planner-agent runtime loops are introduced
* no runtime self-modification is introduced
* no multi-file mutation is introduced
* no mutation capability expansion is introduced
* no autonomous project generation is introduced
* no scaffold generation is introduced
* no file creation is introduced
* no builder agents are introduced
* no runtime routing is introduced
* no blueprint file writing is introduced by default
* no runtime behavior changes are introduced
* no repair orchestration behavior changes are introduced
* no governance activation or policy enforcement path is introduced

## v11.3 - Project Generation File Plan Preview Layer

v11.3 continues the Project Generation Readiness Era by adding a deterministic, read-only file plan preview model for future controlled project generation systems. The file plan preview is descriptive planning data only. It does not create files, scaffold files, write files, implement builder agents, generate projects, route runtime behavior, activate governance, enforce policy, expand mutation scope, or change repair orchestration.

File plan preview model:

* `src/governance/projectGenerationFilePlanPreview.ts` adds `ProjectGenerationFilePlanPreview`, `ProjectGenerationFilePlanEntry`, `ProjectGenerationFilePlanSummary`, `ProjectGenerationFilePlanCompleteness`, `createProjectGenerationFilePlanPreview`, and `summarizeProjectGenerationFilePlanPreview`.
* File plan previews explicitly preserve read-only, preview-only, file-plan-preview-only, stdout-only, no-file-write, no-file-creation, no-scaffold-generation, no-runtime-routing, no-runtime-activation, no-policy-enforcement, no-project-generation, and no-builder-agent-runtime guarantees.
* File plan helpers require explicit metadata input and do not generate hidden timestamps.

File plan entry helpers:

* `createFilePlanEntry`
* `sortFilePlanEntries`
* `findFilePlanEntriesByRole`
* `findFilePlanEntriesByType`
* `findApprovalRequiredFilePlanEntries`
* `findBlockedFilePlanEntries`

Each entry records planned path, file role, file type, generation status, mutation policy, approval requirement, dependencies, risks, warnings, recommendations, read-only state, and preview-only state.

Advisory completeness scoring:

* `calculateProjectGenerationFilePlanCompleteness` deterministically computes a 0-100 advisory score.
* Completeness levels are `incomplete`, `partial`, `review-ready`, and `ready-for-design`.
* Scoring is descriptive only and does not activate governance, route runtime behavior, generate projects, scaffold files, create files, write files, or enable builder agents.

File plan rendering:

* `renderProjectGenerationFilePlanSummary` renders deterministic planned file count, approval-required count, blocked count, mutation-policy counts, completeness score, risks, warnings, and recommendations.
* `renderProjectGenerationFilePlanEntry` renders stable planned file entry details.
* `renderProjectGenerationFilePlanPreview` renders file plan title, guarantees, metadata, summary, entry details, and an explicit no-file-creation notice.
* `renderCliProjectGenerationFilePlanSummary` and `renderCliProjectGenerationFilePlanPreview` provide equivalent CLI-safe deterministic output.

CLI file plan preview:

```powershell
node dist\cli.js governance project-generation-file-plan
node dist\cli.js governance project-generation-file-plan --json
```

File plan previews print to stdout only. They do not write files, create files, scaffold files, mutate state, generate projects, implement builder agents, activate governance, enforce policy, route runtime behavior, expand mutation scope, or change repair orchestration.

v11.3 deterministic checks:

* project-generation-file-plan-consistency
* project-generation-file-plan-entry-sorting
* project-generation-file-plan-filtering
* project-generation-file-plan-completeness
* project-generation-file-plan-rendering
* project-generation-file-plan-cli-output
* project-generation-file-plan-help-output

Scenario suite filtering:

```powershell
node scripts\run-scenarios.js --suite project-generation
```

Safety guarantees:

* Safe Patch Engine remains the sole mutation layer
* single-file mutation invariant remains unchanged
* runtime governance remains disabled
* runtime autonomy remains disabled
* runtime activation remains disabled
* policy enforcement remains disabled
* governance remains preview-only
* deterministic outputs are preserved
* no ML or vector DB behavior is introduced
* no AST parsing is introduced
* no planner-agent runtime loops are introduced
* no runtime self-modification is introduced
* no multi-file mutation is introduced
* no mutation capability expansion is introduced
* no autonomous project generation is introduced
* no scaffold generation is introduced
* no file creation is introduced
* no file writing is introduced by default
* no builder agents are introduced
* no runtime routing is introduced
* no runtime behavior changes are introduced
* no repair orchestration behavior changes are introduced
* no governance activation or policy enforcement path is introduced

## v11.4 - Project Generation Dependency Plan Preview Layer

v11.4 continues the Project Generation Readiness Era by adding a deterministic, read-only dependency plan preview model for future controlled project generation systems. The dependency plan preview is descriptive planning data only. It does not install dependencies, mutate package files, create files, scaffold files, write files, implement builder agents, generate projects, route runtime behavior, activate governance, enforce policy, expand mutation scope, or change repair orchestration.

Dependency plan preview model:

* `src/governance/projectGenerationDependencyPlanPreview.ts` adds `ProjectGenerationDependencyPlanPreview`, `ProjectGenerationDependencyPlanEntry`, `ProjectGenerationDependencyPlanSummary`, `ProjectGenerationDependencyPlanCompleteness`, `createProjectGenerationDependencyPlanPreview`, and `summarizeProjectGenerationDependencyPlanPreview`.
* Dependency plan previews explicitly preserve read-only, preview-only, dependency-plan-preview-only, stdout-only, no-dependency-installation, no-package-mutation, no-file-write, no-file-creation, no-scaffold-generation, no-runtime-routing, no-runtime-activation, no-policy-enforcement, no-project-generation, and no-builder-agent-runtime guarantees.
* Dependency plan helpers require explicit metadata input and do not generate hidden timestamps.

Dependency plan entry helpers:

* `createDependencyPlanEntry`
* `sortDependencyPlanEntries`
* `findDependencyPlanEntriesByType`
* `findDependencyPlanEntriesByRiskLevel`
* `findApprovalRequiredDependencyPlanEntries`
* `findBlockedDependencyPlanEntries`

Each entry records package name, dependency type, purpose, required-by references, installation policy, version policy, risk level, approval requirement, blocked reason, warnings, recommendations, read-only state, and preview-only state.

Advisory completeness scoring:

* `calculateProjectGenerationDependencyPlanCompleteness` deterministically computes a 0-100 advisory score.
* Completeness levels are `incomplete`, `partial`, `review-ready`, and `ready-for-design`.
* Scoring is descriptive only and does not activate governance, route runtime behavior, install dependencies, mutate packages, generate projects, scaffold files, create files, write files, or enable builder agents.

Dependency plan rendering:

* `renderProjectGenerationDependencyPlanSummary` renders deterministic dependency count, approval-required count, blocked count, installation-policy counts, risk distribution, completeness score, warnings, and recommendations.
* `renderProjectGenerationDependencyPlanEntry` renders stable dependency plan entry details.
* `renderProjectGenerationDependencyPlanPreview` renders dependency plan title, guarantees, metadata, summary, entry details, and an explicit no-install/no-package-mutation notice.
* `renderCliProjectGenerationDependencyPlanSummary` and `renderCliProjectGenerationDependencyPlanPreview` provide equivalent CLI-safe deterministic output.

CLI dependency plan preview:

```powershell
node dist\cli.js governance project-generation-dependency-plan
node dist\cli.js governance project-generation-dependency-plan --json
```

Dependency plan previews print to stdout only. They do not write files, create files, scaffold files, mutate packages, install dependencies, mutate state, generate projects, implement builder agents, activate governance, enforce policy, route runtime behavior, expand mutation scope, or change repair orchestration.

v11.4 deterministic checks:

* project-generation-dependency-plan-consistency
* project-generation-dependency-plan-entry-sorting
* project-generation-dependency-plan-filtering
* project-generation-dependency-plan-completeness
* project-generation-dependency-plan-rendering
* project-generation-dependency-plan-cli-output
* project-generation-dependency-plan-help-output

Scenario suite filtering:

```powershell
node scripts\run-scenarios.js --suite project-generation
```

Safety guarantees:

* Safe Patch Engine remains the sole mutation layer
* single-file mutation invariant remains unchanged
* runtime governance remains disabled
* runtime autonomy remains disabled
* runtime activation remains disabled
* policy enforcement remains disabled
* governance remains preview-only
* deterministic outputs are preserved
* no ML or vector DB behavior is introduced
* no AST parsing is introduced
* no planner-agent runtime loops are introduced
* no runtime self-modification is introduced
* no multi-file mutation is introduced
* no mutation capability expansion is introduced
* no autonomous project generation is introduced
* no dependency installation is introduced
* no package mutation is introduced
* no scaffold generation is introduced
* no file creation is introduced
* no file writing is introduced by default
* no builder agents are introduced
* no runtime routing is introduced
* no runtime behavior changes are introduced
* no repair orchestration behavior changes are introduced
* no governance activation or policy enforcement path is introduced

## v11.5 - Project Generation Validation Plan Preview Layer

v11.5 continues the Project Generation Readiness Era by adding a deterministic, read-only validation plan preview model for future controlled project generation systems. The validation plan preview is descriptive planning data only. It does not execute validation commands, run generated-project validation, install dependencies, mutate package files, create files, scaffold files, write files, implement builder agents, generate projects, route runtime behavior, activate governance, enforce policy, expand mutation scope, or change repair orchestration.

Validation plan preview model:

* `src/governance/projectGenerationValidationPlanPreview.ts` adds `ProjectGenerationValidationPlanPreview`, `ProjectGenerationValidationPlanCheck`, `ProjectGenerationValidationPlanSummary`, `ProjectGenerationValidationPlanCompleteness`, `createProjectGenerationValidationPlanPreview`, and `summarizeProjectGenerationValidationPlanPreview`.
* Validation plan previews explicitly preserve read-only, preview-only, validation-plan-preview-only, stdout-only, no-validation-execution, no-generated-project-validation, no-command-execution, no-dependency-installation, no-package-mutation, no-file-write, no-file-creation, no-scaffold-generation, no-runtime-routing, no-runtime-activation, no-policy-enforcement, no-project-generation, and no-builder-agent-runtime guarantees.
* Validation plan helpers require explicit metadata input and do not generate hidden timestamps.

Validation plan check helpers:

* `createValidationPlanCheck`
* `sortValidationPlanChecks`
* `findValidationPlanChecksByType`
* `findValidationPlanChecksByRiskLevel`
* `findApprovalRequiredValidationPlanChecks`
* `findBlockedValidationPlanChecks`

Each check records check ID, check type, command preview, purpose, required-by references, execution policy, risk level, approval requirement, blocked reason, expected signal, warnings, recommendations, read-only state, and preview-only state.

Advisory completeness scoring:

* `calculateProjectGenerationValidationPlanCompleteness` deterministically computes a 0-100 advisory score.
* Completeness levels are `incomplete`, `partial`, `review-ready`, and `ready-for-design`.
* Scoring is descriptive only and does not activate governance, route runtime behavior, execute validation commands, run generated-project validation, install dependencies, mutate packages, generate projects, scaffold files, create files, write files, or enable builder agents.

Validation plan rendering:

* `renderProjectGenerationValidationPlanSummary` renders deterministic check count, approval-required count, blocked count, execution-policy counts, risk distribution, completeness score, warnings, and recommendations.
* `renderProjectGenerationValidationPlanCheck` renders stable validation check details.
* `renderProjectGenerationValidationPlanPreview` renders validation plan title, guarantees, metadata, summary, check details, and an explicit no-execute/no-generated-project-validation notice.
* `renderCliProjectGenerationValidationPlanSummary` and `renderCliProjectGenerationValidationPlanPreview` provide equivalent CLI-safe deterministic output.

CLI validation plan preview:

```powershell
node dist\cli.js governance project-generation-validation-plan
node dist\cli.js governance project-generation-validation-plan --json
```

Validation plan previews print to stdout only. They do not write files, create files, scaffold files, execute validation commands, run generated-project validation, mutate packages, install dependencies, mutate state, generate projects, implement builder agents, activate governance, enforce policy, route runtime behavior, expand mutation scope, or change repair orchestration.

v11.5 deterministic checks:

* project-generation-validation-plan-consistency
* project-generation-validation-plan-check-sorting
* project-generation-validation-plan-filtering
* project-generation-validation-plan-completeness
* project-generation-validation-plan-rendering
* project-generation-validation-plan-cli-output
* project-generation-validation-plan-help-output

Scenario suite filtering:

```powershell
node scripts\run-scenarios.js --suite project-generation
```

Safety guarantees:

* Safe Patch Engine remains the sole mutation layer
* single-file mutation invariant remains unchanged
* runtime governance remains disabled
* runtime autonomy remains disabled
* runtime activation remains disabled
* policy enforcement remains disabled
* governance remains preview-only
* deterministic outputs are preserved
* no ML or vector DB behavior is introduced
* no AST parsing is introduced
* no planner-agent runtime loops are introduced
* no runtime self-modification is introduced
* no multi-file mutation is introduced
* no mutation capability expansion is introduced
* no autonomous project generation is introduced
* no generated-project validation execution is introduced
* no validation command execution is introduced
* no dependency installation is introduced
* no package mutation is introduced
* no scaffold generation is introduced
* no file creation is introduced
* no file writing is introduced by default
* no builder agents are introduced
* no runtime routing is introduced
* no runtime behavior changes are introduced
* no repair orchestration behavior changes are introduced
* no governance activation or policy enforcement path is introduced

## v11.6 - Project Generation Approval Plan Preview Layer

v11.6 continues the Project Generation Readiness Era by adding a deterministic, read-only approval plan preview model for future controlled project generation systems. The approval plan preview is descriptive planning data only. It does not execute approvals, apply approval decisions, approve project generation, execute validation commands, run generated-project validation, install dependencies, mutate package files, create files, scaffold files, write files, implement builder agents, generate projects, route runtime behavior, activate governance, enforce policy, expand mutation scope, or change repair orchestration.

Approval plan preview model:

* `src/governance/projectGenerationApprovalPlanPreview.ts` adds `ProjectGenerationApprovalPlanPreview`, `ProjectGenerationApprovalGate`, `ProjectGenerationApprovalPlanSummary`, `ProjectGenerationApprovalPlanCompleteness`, `createProjectGenerationApprovalPlanPreview`, and `summarizeProjectGenerationApprovalPlanPreview`.
* Approval plan previews explicitly preserve read-only, preview-only, approval-plan-preview-only, stdout-only, no-approval-execution, no-approval-decision-application, no-project-generation-approval, no-validation-execution, no-generated-project-validation, no-command-execution, no-dependency-installation, no-package-mutation, no-file-write, no-file-creation, no-scaffold-generation, no-runtime-routing, no-runtime-activation, no-policy-enforcement, no-project-generation, and no-builder-agent-runtime guarantees.
* Approval plan helpers require explicit metadata input and do not generate hidden timestamps.

Approval gate helpers:

* `createApprovalGate`
* `sortApprovalGates`
* `findApprovalGatesByType`
* `findApprovalGatesByRiskLevel`
* `findHumanRequiredApprovalGates`
* `findBlockedApprovalGates`

Each gate records gate ID, gate type, title, purpose, required-for references, approval policy, decision status, risk level, human approval requirement, blocked reason, warnings, recommendations, read-only state, and preview-only state.

Advisory completeness scoring:

* `calculateProjectGenerationApprovalPlanCompleteness` deterministically computes a 0-100 advisory score.
* Completeness levels are `incomplete`, `partial`, `review-ready`, and `ready-for-design`.
* Scoring is descriptive only and does not approve anything, activate governance, route runtime behavior, execute approvals, execute validation commands, run generated-project validation, install dependencies, mutate packages, generate projects, scaffold files, create files, write files, or enable builder agents.

Approval plan rendering:

* `renderProjectGenerationApprovalPlanSummary` renders deterministic gate count, human-required count, blocked count, approval-policy counts, risk distribution, completeness score, warnings, and recommendations.
* `renderProjectGenerationApprovalGate` renders stable approval gate details.
* `renderProjectGenerationApprovalPlanPreview` renders approval plan title, guarantees, metadata, summary, gate details, and an explicit no-approval-execution notice.
* `renderCliProjectGenerationApprovalPlanSummary` and `renderCliProjectGenerationApprovalPlanPreview` provide equivalent CLI-safe deterministic output.

CLI approval plan preview:

```powershell
node dist\cli.js governance project-generation-approval-plan
node dist\cli.js governance project-generation-approval-plan --json
```

Approval plan previews print to stdout only. They do not write files, create files, scaffold files, execute approvals, apply approval decisions, approve project generation, execute validation commands, run generated-project validation, mutate packages, install dependencies, mutate state, generate projects, implement builder agents, activate governance, enforce policy, route runtime behavior, expand mutation scope, or change repair orchestration.

v11.6 deterministic checks:

* project-generation-approval-plan-consistency
* project-generation-approval-gate-sorting
* project-generation-approval-gate-filtering
* project-generation-approval-plan-completeness
* project-generation-approval-plan-rendering
* project-generation-approval-plan-cli-output
* project-generation-approval-plan-help-output

Scenario suite filtering:

```powershell
node scripts\run-scenarios.js --suite project-generation
```

Safety guarantees:

* Safe Patch Engine remains the sole mutation layer
* single-file mutation invariant remains unchanged
* runtime governance remains disabled
* runtime autonomy remains disabled
* runtime activation remains disabled
* policy enforcement remains disabled
* governance remains preview-only
* deterministic outputs are preserved
* no ML or vector DB behavior is introduced
* no AST parsing is introduced
* no planner-agent runtime loops are introduced
* no runtime self-modification is introduced
* no multi-file mutation is introduced
* no mutation capability expansion is introduced
* no autonomous project generation is introduced
* no approval execution is introduced
* no approval decision application is introduced
* no generated-project validation execution is introduced
* no validation command execution is introduced
* no dependency installation is introduced
* no package mutation is introduced
* no scaffold generation is introduced
* no file creation is introduced
* no file writing is introduced by default
* no builder agents are introduced
* no runtime routing is introduced
* no runtime behavior changes are introduced
* no repair orchestration behavior changes are introduced
* no governance activation or policy enforcement path is introduced

## v11.7 - Project Generation Risk Plan Preview Layer

v11.7 continues the Project Generation Readiness Era by adding a deterministic, read-only risk plan preview model for future controlled project generation systems. The risk plan preview is descriptive planning data only. It does not enforce risks, execute mitigations, execute approvals, apply approval decisions, approve project generation, execute validation commands, run generated-project validation, install dependencies, mutate package files, create files, scaffold files, write files, implement builder agents, generate projects, route runtime behavior, activate governance, enforce policy, expand mutation scope, or change repair orchestration.

Risk plan preview model:

* `src/governance/projectGenerationRiskPlanPreview.ts` adds `ProjectGenerationRiskPlanPreview`, `ProjectGenerationRiskEntry`, `ProjectGenerationRiskPlanSummary`, `ProjectGenerationRiskExposure`, `createProjectGenerationRiskPlanPreview`, and `summarizeProjectGenerationRiskPlanPreview`.
* Risk plan previews explicitly preserve read-only, preview-only, risk-plan-preview-only, stdout-only, no-risk-enforcement, no-mitigation-enforcement, no-approval-execution, no-approval-decision-application, no-project-generation-approval, no-validation-execution, no-generated-project-validation, no-command-execution, no-dependency-installation, no-package-mutation, no-file-write, no-file-creation, no-scaffold-generation, no-runtime-routing, no-runtime-activation, no-policy-enforcement, no-project-generation, and no-builder-agent-runtime guarantees.
* Risk plan helpers require explicit metadata input and do not generate hidden timestamps.

Risk entry helpers:

* `createRiskEntry`
* `sortRiskEntries`
* `findRiskEntriesByType`
* `findRiskEntriesBySeverity`
* `findRiskEntriesByAffectedPlan`
* `findBlockedRiskEntries`
* `findHumanApprovalRequiredRiskEntries`

Each risk records risk ID, risk type, title, description, affected plan, severity, likelihood, risk status, mitigation policy, human approval requirement, blocked reason, warnings, recommendations, read-only state, and preview-only state.

Advisory exposure scoring:

* `calculateProjectGenerationRiskExposure` deterministically computes a 0-100 advisory exposure score.
* Exposure levels are `low`, `medium`, `high`, and `critical`.
* Scoring is descriptive only and does not enforce risks, approve anything, activate governance, route runtime behavior, execute approvals, execute validation commands, run generated-project validation, install dependencies, mutate packages, generate projects, scaffold files, create files, write files, or enable builder agents.

Risk plan rendering:

* `renderProjectGenerationRiskPlanSummary` renders deterministic risk count, blocked count, human-approval-required count, severity distribution, affected plan distribution, exposure score, warnings, and recommendations.
* `renderProjectGenerationRiskEntry` renders stable risk entry details.
* `renderProjectGenerationRiskPlanPreview` renders risk plan title, guarantees, metadata, summary, risk details, and an explicit no-risk-enforcement notice.
* `renderCliProjectGenerationRiskPlanSummary` and `renderCliProjectGenerationRiskPlanPreview` provide equivalent CLI-safe deterministic output.

CLI risk plan preview:

```powershell
node dist\cli.js governance project-generation-risk-plan
node dist\cli.js governance project-generation-risk-plan --json
```

Risk plan previews print to stdout only. They do not write files, create files, scaffold files, enforce risks, execute mitigations, execute approvals, apply approval decisions, approve project generation, execute validation commands, run generated-project validation, mutate packages, install dependencies, mutate state, generate projects, implement builder agents, activate governance, enforce policy, route runtime behavior, expand mutation scope, or change repair orchestration.

v11.7 deterministic checks:

* project-generation-risk-plan-consistency
* project-generation-risk-entry-sorting
* project-generation-risk-entry-filtering
* project-generation-risk-exposure
* project-generation-risk-plan-rendering
* project-generation-risk-plan-cli-output
* project-generation-risk-plan-help-output

Scenario suite filtering:

```powershell
node scripts\run-scenarios.js --suite project-generation
```

Safety guarantees:

* Safe Patch Engine remains the sole mutation layer
* single-file mutation invariant remains unchanged
* runtime governance remains disabled
* runtime autonomy remains disabled
* runtime activation remains disabled
* policy enforcement remains disabled
* governance remains preview-only
* deterministic outputs are preserved
* no ML or vector DB behavior is introduced
* no AST parsing is introduced
* no planner-agent runtime loops are introduced
* no runtime self-modification is introduced
* no multi-file mutation is introduced
* no mutation capability expansion is introduced
* no autonomous project generation is introduced
* no risk enforcement is introduced
* no approval execution is introduced
* no approval decision application is introduced
* no generated-project validation execution is introduced
* no validation command execution is introduced
* no dependency installation is introduced
* no package mutation is introduced
* no scaffold generation is introduced
* no file creation is introduced
* no file writing is introduced by default
* no builder agents are introduced
* no runtime routing is introduced
* no runtime behavior changes are introduced
* no repair orchestration behavior changes are introduced
* no governance activation or policy enforcement path is introduced

## v11.8 - Project Generation Rollback Plan Preview Layer

v11.8 continues the Project Generation Readiness Era by adding a deterministic, read-only rollback plan preview model for future controlled project generation systems. The rollback plan preview is descriptive planning data only. It does not execute rollback, execute recovery, enforce risks, execute mitigations, execute approvals, apply approval decisions, approve project generation, execute validation commands, run generated-project validation, install dependencies, mutate package files, create files, scaffold files, write files, implement builder agents, generate projects, route runtime behavior, activate governance, enforce policy, expand mutation scope, or change repair orchestration.

Rollback plan preview model:

* `src/governance/projectGenerationRollbackPlanPreview.ts` adds `ProjectGenerationRollbackPlanPreview`, `ProjectGenerationRollbackStep`, `ProjectGenerationRollbackPlanSummary`, `ProjectGenerationRollbackReadiness`, `createProjectGenerationRollbackPlanPreview`, and `summarizeProjectGenerationRollbackPlanPreview`.
* Rollback plan previews explicitly preserve read-only, preview-only, rollback-plan-preview-only, stdout-only, no-rollback-execution, no-recovery-execution, no-risk-enforcement, no-mitigation-enforcement, no-approval-execution, no-approval-decision-application, no-project-generation-approval, no-validation-execution, no-generated-project-validation, no-command-execution, no-dependency-installation, no-package-mutation, no-file-write, no-file-creation, no-scaffold-generation, no-runtime-routing, no-runtime-activation, no-policy-enforcement, no-project-generation, and no-builder-agent-runtime guarantees.
* Rollback plan helpers require explicit metadata input and do not generate hidden timestamps.

Rollback step helpers:

* `createRollbackStep`
* `sortRollbackSteps`
* `findRollbackStepsByType`
* `findRollbackStepsByRiskLevel`
* `findRollbackStepsByAppliesTo`
* `findBlockedRollbackSteps`
* `findHumanApprovalRequiredRollbackSteps`

Each rollback step records step ID, step type, title, description, applies-to value, rollback policy, recovery policy, execution status, risk level, human approval requirement, blocked reason, warnings, recommendations, read-only state, and preview-only state.

Advisory rollback readiness scoring:

* `calculateProjectGenerationRollbackReadiness` deterministically computes a 0-100 advisory readiness score.
* Readiness levels are `incomplete`, `partial`, `review-ready`, and `ready-for-design`.
* Scoring is descriptive only and does not execute rollback, execute recovery, enforce risks, approve anything, activate governance, route runtime behavior, execute validation commands, run generated-project validation, install dependencies, mutate packages, generate projects, scaffold files, create files, write files, or enable builder agents.

Rollback plan rendering:

* `renderProjectGenerationRollbackPlanSummary` renders deterministic rollback step count, blocked count, human-approval-required count, risk distribution, applies-to distribution, readiness score, warnings, and recommendations.
* `renderProjectGenerationRollbackStep` renders stable rollback step details.
* `renderProjectGenerationRollbackPlanPreview` renders rollback plan title, guarantees, metadata, summary, rollback step details, and an explicit no-rollback-execution/no-recovery-execution notice.
* `renderCliProjectGenerationRollbackPlanSummary` and `renderCliProjectGenerationRollbackPlanPreview` provide equivalent CLI-safe deterministic output.

CLI rollback plan preview:

```powershell
node dist\cli.js governance project-generation-rollback-plan
node dist\cli.js governance project-generation-rollback-plan --json
```

Rollback plan previews print to stdout only. They do not write files, create files, scaffold files, execute rollback, execute recovery, enforce risks, execute mitigations, execute approvals, apply approval decisions, approve project generation, execute validation commands, run generated-project validation, mutate packages, install dependencies, mutate state, generate projects, implement builder agents, activate governance, enforce policy, route runtime behavior, expand mutation scope, or change repair orchestration.

v11.8 deterministic checks:

* project-generation-rollback-plan-consistency
* project-generation-rollback-step-sorting
* project-generation-rollback-step-filtering
* project-generation-rollback-readiness
* project-generation-rollback-plan-rendering
* project-generation-rollback-plan-cli-output
* project-generation-rollback-plan-help-output

Scenario suite filtering:

```powershell
node scripts\run-scenarios.js --suite project-generation
```

Safety guarantees:

* Safe Patch Engine remains the sole mutation layer
* single-file mutation invariant remains unchanged
* runtime governance remains disabled
* runtime autonomy remains disabled
* runtime activation remains disabled
* policy enforcement remains disabled
* governance remains preview-only
* deterministic outputs are preserved
* no ML or vector DB behavior is introduced
* no AST parsing is introduced
* no planner-agent runtime loops are introduced
* no runtime self-modification is introduced
* no multi-file mutation is introduced
* no mutation capability expansion is introduced
* no autonomous project generation is introduced
* no rollback execution is introduced
* no recovery execution is introduced
* no risk enforcement is introduced
* no approval execution is introduced
* no approval decision application is introduced
* no generated-project validation execution is introduced
* no validation command execution is introduced
* no dependency installation is introduced
* no package mutation is introduced
* no scaffold generation is introduced
* no file creation is introduced
* no file writing is introduced by default
* no builder agents are introduced
* no runtime routing is introduced
* no runtime behavior changes are introduced
* no repair orchestration behavior changes are introduced
* no governance activation or policy enforcement path is introduced

## v11.9 - Project Generation Plan Bundle Preview Layer

v11.9 continues the Project Generation Readiness Era by adding a deterministic, read-only plan bundle preview model for future controlled project generation systems. The plan bundle preview aggregates blueprint, file plan, dependency plan, validation plan, approval plan, risk plan, rollback plan, governance summary, and read-only guarantee previews as descriptive planning data only. It does not execute bundles, execute rollback, execute recovery, enforce risks, execute mitigations, execute approvals, apply approval decisions, approve project generation, execute validation commands, run generated-project validation, install dependencies, mutate package files, create files, scaffold files, write files, implement builder agents, generate projects, route runtime behavior, activate governance, enforce policy, expand mutation scope, or change repair orchestration.

Plan bundle preview model:

* `src/governance/projectGenerationPlanBundlePreview.ts` adds `ProjectGenerationPlanBundlePreview`, `ProjectGenerationPlanBundleSection`, `ProjectGenerationPlanBundleSummary`, `ProjectGenerationPlanBundleReadiness`, `createProjectGenerationPlanBundlePreview`, and `summarizeProjectGenerationPlanBundlePreview`.
* Plan bundle previews explicitly preserve read-only, preview-only, plan-bundle-preview-only, stdout-only, no-bundle-execution, no-bundle-writing, no-rollback-execution, no-recovery-execution, no-risk-enforcement, no-mitigation-enforcement, no-approval-execution, no-approval-decision-application, no-project-generation-approval, no-validation-execution, no-generated-project-validation, no-command-execution, no-dependency-installation, no-package-mutation, no-file-write, no-file-creation, no-scaffold-generation, no-runtime-routing, no-runtime-activation, no-policy-enforcement, no-project-generation, and no-builder-agent-runtime guarantees.
* Plan bundle helpers require explicit metadata input and do not generate hidden timestamps.

Plan bundle section helpers:

* `createPlanBundleBlueprintSection`
* `createPlanBundleFilePlanSection`
* `createPlanBundleDependencyPlanSection`
* `createPlanBundleValidationPlanSection`
* `createPlanBundleApprovalPlanSection`
* `createPlanBundleRiskPlanSection`
* `createPlanBundleRollbackPlanSection`
* `createPlanBundleGovernanceSummarySection`
* `createPlanBundleReadonlyGuaranteesSection`
* `sortPlanBundleSections`

Each plan bundle section records section type, title, summary, status, advisory score, level, entry count, blocked count, approval-required count, warnings, recommendations, read-only state, and preview-only state.

Advisory plan bundle readiness scoring:

* `calculateProjectGenerationPlanBundleReadiness` deterministically computes a 0-100 advisory readiness score from preview section scores.
* Readiness levels are `incomplete`, `partial`, `review-ready`, and `ready-for-design`.
* Scoring is descriptive only and does not execute bundles, execute rollback, execute recovery, enforce risks, approve anything, activate governance, route runtime behavior, execute validation commands, run generated-project validation, install dependencies, mutate packages, generate projects, scaffold files, create files, write files, or enable builder agents.

Plan bundle rendering:

* `renderProjectGenerationPlanBundleSummary` renders deterministic section count, total entries, blocked count, approval-required count, readiness score, warnings, and recommendations.
* `renderProjectGenerationPlanBundleSection` renders stable section details.
* `renderProjectGenerationPlanBundlePreview` renders plan bundle title, guarantees, metadata, summary, section details, and an explicit no-bundle-execution/no-project-generation notice.
* `renderCliProjectGenerationPlanBundleSummary` and `renderCliProjectGenerationPlanBundlePreview` provide equivalent CLI-safe deterministic output.

CLI plan bundle preview:

```powershell
node dist\cli.js governance project-generation-plan-bundle
node dist\cli.js governance project-generation-plan-bundle --json
```

Plan bundle previews print to stdout only. They do not write files, create files, scaffold files, execute bundles, execute rollback, execute recovery, enforce risks, execute mitigations, execute approvals, apply approval decisions, approve project generation, execute validation commands, run generated-project validation, mutate packages, install dependencies, mutate state, generate projects, implement builder agents, activate governance, enforce policy, route runtime behavior, expand mutation scope, or change repair orchestration.

v11.9 deterministic checks:

* project-generation-plan-bundle-consistency
* project-generation-plan-bundle-section-ordering
* project-generation-plan-bundle-readiness
* project-generation-plan-bundle-rendering
* project-generation-plan-bundle-cli-output
* project-generation-plan-bundle-help-output

Scenario suite filtering:

```powershell
node scripts\run-scenarios.js --suite project-generation
```

Safety guarantees:

* Safe Patch Engine remains the sole mutation layer
* single-file mutation invariant remains unchanged
* runtime governance remains disabled
* runtime autonomy remains disabled
* runtime activation remains disabled
* policy enforcement remains disabled
* governance remains preview-only
* deterministic outputs are preserved
* no ML or vector DB behavior is introduced
* no AST parsing is introduced
* no planner-agent runtime loops are introduced
* no runtime self-modification is introduced
* no multi-file mutation is introduced
* no mutation capability expansion is introduced
* no autonomous project generation is introduced
* no bundle execution is introduced
* no rollback execution is introduced
* no recovery execution is introduced
* no risk enforcement is introduced
* no approval execution is introduced
* no approval decision application is introduced
* no generated-project validation execution is introduced
* no validation command execution is introduced
* no dependency installation is introduced
* no package mutation is introduced
* no scaffold generation is introduced
* no file creation is introduced
* no file writing is introduced by default
* no builder agents are introduced
* no runtime routing is introduced
* no runtime behavior changes are introduced
* no repair orchestration behavior changes are introduced
* no governance activation or policy enforcement path is introduced

## v11.10 - Project Generation Readiness Completion Audit Layer

v11.10 completes the Project Generation Readiness Era checkpoint by adding a deterministic, read-only completion audit over the full v11.x project generation planning stack. The audit is descriptive reporting data only. It does not execute bundles, execute rollback, execute recovery, enforce risks, execute mitigations, execute approvals, apply approval decisions, approve project generation, execute validation commands, run generated-project validation, install dependencies, mutate package files, create files, scaffold files, write files, implement builder agents, generate projects, route runtime behavior, activate governance, enforce policy, expand mutation scope, or change repair orchestration.

v11.x chain summary:

* v11.0 readiness assessment
* v11.1 capability map
* v11.2 blueprint preview
* v11.3 file plan preview
* v11.4 dependency plan preview
* v11.5 validation plan preview
* v11.6 approval plan preview
* v11.7 risk plan preview
* v11.8 rollback plan preview
* v11.9 plan bundle preview
* v11.10 readiness completion audit

Readiness completion audit model:

* `src/governance/projectGenerationReadinessCompletionAudit.ts` adds `ProjectGenerationReadinessCompletionAudit`, `ProjectGenerationReadinessCompletionAuditSection`, `ProjectGenerationReadinessCompletionAuditSummary`, `ProjectGenerationReadinessCompletionScore`, `createProjectGenerationReadinessCompletionAudit`, and `summarizeProjectGenerationReadinessCompletionAudit`.
* Audit previews explicitly preserve read-only, preview-only, completion-audit-only, stdout-only, no-bundle-execution, no-rollback-execution, no-recovery-execution, no-risk-enforcement, no-mitigation-enforcement, no-approval-execution, no-approval-decision-application, no-project-generation-approval, no-validation-execution, no-generated-project-validation, no-command-execution, no-dependency-installation, no-package-mutation, no-file-write, no-file-creation, no-scaffold-generation, no-runtime-routing, no-runtime-activation, no-policy-enforcement, no-project-generation, and no-builder-agent-runtime guarantees.
* Audit helpers require explicit metadata input and do not generate hidden timestamps.

Audit section helpers:

* `createReadinessAuditSection`
* `createCapabilityMapAuditSection`
* `createBlueprintAuditSection`
* `createFilePlanAuditSection`
* `createDependencyPlanAuditSection`
* `createValidationPlanAuditSection`
* `createApprovalPlanAuditSection`
* `createRiskPlanAuditSection`
* `createRollbackPlanAuditSection`
* `createPlanBundleAuditSection`
* `createCliPreviewAuditSection`
* `createScenarioCoverageAuditSection`
* `createReadonlyGuaranteeAuditSection`
* `createNoExecutionGuaranteeAuditSection`
* `sortReadinessCompletionAuditSections`

Each audit section records section type, title, summary, status, advisory score, level, entry count, warnings, recommendations, read-only state, preview-only state, and no-execution state.

Advisory completion scoring:

* `calculateProjectGenerationReadinessCompletionScore` deterministically computes a 0-100 advisory completion score.
* Completion levels are `incomplete`, `partial`, `readiness-complete`, and `ready-for-controlled-design`.
* Scoring is descriptive only and does not execute bundles, execute rollback, execute recovery, enforce risks, approve anything, activate governance, route runtime behavior, execute validation commands, run generated-project validation, install dependencies, mutate packages, generate projects, scaffold files, create files, write files, or enable builder agents.

Completion audit rendering:

* `renderProjectGenerationReadinessCompletionAuditSummary` renders deterministic section count, total entries, CLI preview path coverage, scenario coverage, completion score, warnings, and recommendations.
* `renderProjectGenerationReadinessCompletionAuditSection` renders stable section details.
* `renderProjectGenerationReadinessCompletionAudit` renders audit title, guarantees, metadata, summary, section details, and an explicit no-project-generation/no-execution notice.
* `renderCliProjectGenerationReadinessCompletionAuditSummary` and `renderCliProjectGenerationReadinessCompletionAudit` provide equivalent CLI-safe deterministic output.

CLI readiness completion audit:

```powershell
node dist\cli.js governance project-generation-readiness-audit
node dist\cli.js governance project-generation-readiness-audit --json
```

Readiness completion audits print to stdout only. They do not write files, create files, scaffold files, execute bundles, execute rollback, execute recovery, enforce risks, execute mitigations, execute approvals, apply approval decisions, approve project generation, execute validation commands, run generated-project validation, mutate packages, install dependencies, mutate state, generate projects, implement builder agents, activate governance, enforce policy, route runtime behavior, expand mutation scope, or change repair orchestration.

v11.10 deterministic checks:

* project-generation-readiness-audit-consistency
* project-generation-readiness-audit-section-ordering
* project-generation-readiness-audit-completion-score
* project-generation-readiness-audit-rendering
* project-generation-readiness-audit-cli-output
* project-generation-readiness-audit-help-output

Scenario suite filtering:

```powershell
node scripts\run-scenarios.js --suite project-generation
```

Safety guarantees:

* Safe Patch Engine remains the sole mutation layer
* single-file mutation invariant remains unchanged
* runtime governance remains disabled
* runtime autonomy remains disabled
* runtime activation remains disabled
* policy enforcement remains disabled
* governance remains preview-only
* deterministic outputs are preserved
* no ML or vector DB behavior is introduced
* no AST parsing is introduced
* no planner-agent runtime loops are introduced
* no runtime self-modification is introduced
* no multi-file mutation is introduced
* no mutation capability expansion is introduced
* no autonomous project generation is introduced
* no bundle execution is introduced
* no rollback execution is introduced
* no recovery execution is introduced
* no risk enforcement is introduced
* no approval execution is introduced
* no approval decision application is introduced
* no generated-project validation execution is introduced
* no validation command execution is introduced
* no dependency installation is introduced
* no package mutation is introduced
* no scaffold generation is introduced
* no file creation is introduced
* no file writing is introduced by default
* no builder agents are introduced
* no runtime routing is introduced
* no runtime behavior changes are introduced
* no repair orchestration behavior changes are introduced
* no governance activation or policy enforcement path is introduced

## v12.0 - Controlled Project Generation Design Contract Layer

v12.0 begins the Controlled Project Generation Design Era by adding a deterministic, read-only design contract for a future controlled project generation runtime. The contract is descriptive design data only. It does not implement a generation runtime, execute generation, execute bundles, execute rollback, execute recovery, enforce risks, execute mitigations, execute approvals, apply approval decisions, approve project generation, execute validation commands, run generated-project validation, install dependencies, mutate package files, create files, scaffold files, write files, implement builder agents, route runtime behavior, activate governance, enforce policy, expand mutation scope, or change repair orchestration.

Era transition:

* v10.x = Governance Consolidation Era
* v11.x = Project Generation Readiness Era
* v12.x = Controlled Project Generation Design Era

Controlled project generation design contract model:

* `src/governance/controlledProjectGenerationDesignContract.ts` adds `ControlledProjectGenerationDesignContract`, `ControlledProjectGenerationContractSection`, `ControlledProjectGenerationContractSummary`, `ControlledProjectGenerationContractCompleteness`, `createControlledProjectGenerationDesignContract`, and `summarizeControlledProjectGenerationDesignContract`.
* Design contracts explicitly preserve read-only, preview-only, design-contract-only, stdout-only, no-generation-runtime, no-generation-execution, no-bundle-execution, no-rollback-execution, no-recovery-execution, no-risk-enforcement, no-mitigation-enforcement, no-approval-execution, no-approval-decision-application, no-project-generation-approval, no-validation-execution, no-generated-project-validation, no-command-execution, no-dependency-installation, no-package-mutation, no-file-write, no-file-creation, no-scaffold-generation, no-runtime-routing, no-runtime-activation, no-policy-enforcement, no-project-generation, and no-builder-agent-runtime guarantees.
* Contract helpers require explicit metadata input and do not generate hidden timestamps.

Contract section helpers:

* `createContractIntentInputSection`
* `createContractBlueprintInputSection`
* `createContractFilePlanInputSection`
* `createContractDependencyPlanInputSection`
* `createContractValidationPlanInputSection`
* `createContractApprovalPlanInputSection`
* `createContractRiskPlanInputSection`
* `createContractRollbackPlanInputSection`
* `createContractRequiredGovernanceArtifactsSection`
* `createContractAllowedOutputsSection`
* `createContractForbiddenActionsSection`
* `createContractMutationBoundarySection`
* `createContractApprovalBoundarySection`
* `createContractRuntimeBoundarySection`
* `createContractCliPreviewPathsSection`
* `createContractScenarioSuitesSection`
* `sortControlledProjectGenerationContractSections`

Each contract section records section type, title, summary, status, requirements, allowed outputs, forbidden actions, risks, warnings, recommendations, read-only state, preview-only state, no-execution state, and advisory score.

Advisory completeness scoring:

* `calculateControlledProjectGenerationDesignContractCompleteness` deterministically computes a 0-100 advisory completeness score.
* Completeness levels are `incomplete`, `partial`, `contract-defined`, and `ready-for-architecture-preview`.
* Scoring is descriptive only and does not execute generation, execute bundles, execute rollback, execute recovery, enforce risks, approve anything, activate governance, route runtime behavior, execute validation commands, run generated-project validation, install dependencies, mutate packages, generate projects, scaffold files, create files, write files, or enable builder agents.

Design contract rendering:

* `renderControlledProjectGenerationDesignContractSummary` renders deterministic section count, requirement count, allowed output count, forbidden action count, risk count, completeness score, warnings, and recommendations.
* `renderControlledProjectGenerationDesignContractSection` renders stable contract section details.
* `renderControlledProjectGenerationDesignContract` renders contract title, guarantees, metadata, summary, section details, and an explicit no-runtime/no-project-generation notice.
* `renderCliControlledProjectGenerationDesignContractSummary` and `renderCliControlledProjectGenerationDesignContract` provide equivalent CLI-safe deterministic output.

CLI contract preview:

```powershell
node dist\cli.js governance controlled-project-generation-contract
node dist\cli.js governance controlled-project-generation-contract --json
```

Design contracts print to stdout only. They do not write files, create files, scaffold files, execute generation, execute bundles, execute rollback, execute recovery, enforce risks, execute mitigations, execute approvals, apply approval decisions, approve project generation, execute validation commands, run generated-project validation, mutate packages, install dependencies, mutate state, generate projects, implement builder agents, activate governance, enforce policy, route runtime behavior, expand mutation scope, or change repair orchestration.

v12.0 deterministic checks:

* controlled-project-generation-contract-consistency
* controlled-project-generation-contract-section-ordering
* controlled-project-generation-contract-completeness
* controlled-project-generation-contract-rendering
* controlled-project-generation-contract-cli-output
* controlled-project-generation-contract-help-output

Scenario suite filtering:

```powershell
node scripts\run-scenarios.js --suite controlled-generation
```

Safety guarantees:

* Safe Patch Engine remains the sole mutation layer
* single-file mutation invariant remains unchanged
* runtime governance remains disabled
* runtime autonomy remains disabled
* runtime activation remains disabled
* policy enforcement remains disabled
* governance remains preview-only
* deterministic outputs are preserved
* no ML or vector DB behavior is introduced
* no AST parsing is introduced
* no planner-agent runtime loops are introduced
* no runtime self-modification is introduced
* no multi-file mutation is introduced
* no mutation capability expansion is introduced
* no autonomous project generation is introduced
* no project generation runtime is introduced
* no builder agents are introduced
* no bundle execution is introduced
* no rollback execution is introduced
* no recovery execution is introduced
* no risk enforcement is introduced
* no approval execution is introduced
* no approval decision application is introduced
* no generated-project validation execution is introduced
* no validation command execution is introduced
* no dependency installation is introduced
* no package mutation is introduced
* no scaffold generation is introduced
* no file creation is introduced
* no file writing is introduced by default
* no runtime routing is introduced
* no runtime behavior changes are introduced
* no repair orchestration behavior changes are introduced
* no governance activation or policy enforcement path is introduced

## v12.1 - Controlled Project Generation Input Contract Layer

v12.1 continues the Controlled Project Generation Design Era by adding a deterministic, read-only input contract for a future controlled project generation runtime. The input contract is descriptive design data only. It does not execute inputs, validate live runtime inputs, implement a generation runtime, execute generation, execute bundles, execute rollback, execute recovery, enforce risks, execute approvals, execute validation commands, install dependencies, mutate package files, create files, scaffold files, write files, implement builder agents, route runtime behavior, activate governance, enforce policy, expand mutation scope, or change repair orchestration.

Controlled project generation input contract model:

* `src/governance/controlledProjectGenerationInputContract.ts` adds `ControlledProjectGenerationInputContract`, `ControlledProjectGenerationInputField`, `ControlledProjectGenerationInputContractSummary`, `ControlledProjectGenerationInputCompleteness`, `createControlledProjectGenerationInputContract`, and `summarizeControlledProjectGenerationInputContract`.
* Input contracts explicitly preserve read-only, preview-only, input-contract-only, stdout-only, no-live-input-validation, no-input-execution, no-generation-runtime, no-generation-execution, no-bundle-execution, no-rollback-execution, no-recovery-execution, no-risk-enforcement, no-approval-execution, no-validation-execution, no-dependency-installation, no-package-mutation, no-file-write, no-file-creation, no-scaffold-generation, no-runtime-routing, no-runtime-activation, no-policy-enforcement, no-project-generation, and no-builder-agent-runtime guarantees.
* Input contract helpers require explicit metadata input and do not generate hidden timestamps.

Input groups:

* `projectIntent`
* `projectType`
* `targetStack`
* `runtimeEnvironment`
* `filePlanPreferences`
* `dependencyPreferences`
* `validationPreferences`
* `approvalPreferences`
* `riskPreferences`
* `rollbackPreferences`
* `humanInstructions`
* `governanceContext`

Input field helpers:

* `createInputContractField`
* `sortInputContractFields`
* `findInputFieldsByGroup`
* `findInputFieldsByRequirement`
* `findInputFieldsByRiskLevel`
* `findBlockedInputFields`

Each input field records field ID, group, label, description, required state, status, risk level, allowed values, default value, validation policy, blocked reason, warnings, recommendations, read-only state, and preview-only state.

Validation policies:

* `structural-preview-only`
* `manual-review-required`
* `blocked`
* `not-applicable`

Advisory completeness scoring:

* `calculateControlledProjectGenerationInputContractCompleteness` deterministically computes a 0-100 advisory completeness score.
* Completeness levels are `incomplete`, `partial`, `contract-defined`, and `ready-for-design`.
* Scoring is descriptive only and does not validate live runtime inputs, execute inputs, execute generation, execute bundles, execute rollback, enforce risks, approve anything, activate governance, route runtime behavior, execute validation commands, install dependencies, mutate packages, generate projects, scaffold files, create files, write files, or enable builder agents.

Input contract rendering:

* `renderControlledProjectGenerationInputContractSummary` renders deterministic field count, required field count, blocked field count, group distribution, risk distribution, validation policy distribution, completeness score, warnings, and recommendations.
* `renderControlledProjectGenerationInputField` renders stable input field details.
* `renderControlledProjectGenerationInputContract` renders contract title, guarantees, metadata, summary, fields, and an explicit no-input-execution/no-project-generation notice.
* `renderCliControlledProjectGenerationInputContractSummary` and `renderCliControlledProjectGenerationInputContract` provide equivalent CLI-safe deterministic output.

CLI input contract preview:

```powershell
node dist\cli.js governance controlled-project-generation-input-contract
node dist\cli.js governance controlled-project-generation-input-contract --json
```

Input contracts print to stdout only. They do not write files, create files, scaffold files, execute inputs, validate live runtime inputs, execute generation, execute bundles, execute rollback, execute recovery, enforce risks, execute approvals, execute validation commands, mutate packages, install dependencies, mutate state, generate projects, implement builder agents, activate governance, enforce policy, route runtime behavior, expand mutation scope, or change repair orchestration.

v12.1 deterministic checks:

* controlled-project-generation-input-contract-consistency
* controlled-project-generation-input-field-sorting
* controlled-project-generation-input-field-filtering
* controlled-project-generation-input-contract-completeness
* controlled-project-generation-input-contract-rendering
* controlled-project-generation-input-contract-cli-output
* controlled-project-generation-input-contract-help-output

Scenario suite filtering:

```powershell
node scripts\run-scenarios.js --suite controlled-generation
```

Safety guarantees:

* Safe Patch Engine remains the sole mutation layer
* single-file mutation invariant remains unchanged
* runtime governance remains disabled
* runtime autonomy remains disabled
* runtime activation remains disabled
* policy enforcement remains disabled
* governance remains preview-only
* deterministic outputs are preserved
* no ML or vector DB behavior is introduced
* no AST parsing is introduced
* no planner-agent runtime loops are introduced
* no runtime self-modification is introduced
* no multi-file mutation is introduced
* no mutation capability expansion is introduced
* no autonomous project generation is introduced
* no input execution is introduced
* no project generation runtime is introduced
* no builder agents are introduced
* no bundle execution is introduced
* no rollback execution is introduced
* no recovery execution is introduced
* no risk enforcement is introduced
* no approval execution is introduced
* no generated-project validation execution is introduced
* no validation command execution is introduced
* no dependency installation is introduced
* no package mutation is introduced
* no scaffold generation is introduced
* no file creation is introduced
* no file writing is introduced by default
* no runtime routing is introduced
* no runtime behavior changes are introduced
* no repair orchestration behavior changes are introduced
* no governance activation or policy enforcement path is introduced

* trend analysis does not change governance, release, trust, review, insight, CI summary, diff, or repair behavior
* trend analysis does not bypass any safety gate

v4.1 deterministic checks:

* governance-trend-analysis-unit
* governance-trend-analysis-improving-unit
* governance-trend-analysis-worsening-unit
* governance-trend-analysis-stable-unit
* governance-trend-analysis-health-unit
* governance-trend-analysis-volatility-unit
* governance-trend-analysis-json-unit
* governance-trend-analysis-cli-unit
* governance-trend-analysis-missing-index-unit
* governance-trend-analysis-invalid-kind-unit
* governance-trend-analysis-help-unit
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
