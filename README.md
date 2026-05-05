# 🏭 AI Software Factory

AI-powered local development agent that can:
- generate code
- apply changes safely
- run real validation
- detect runtime errors
- fix bugs automatically
- produce final diff & commit-ready reports

---

## ✨ Current Version

**v1.2 — Self-Healing AI Dev Agent**

---

## 🧠 What It Does

AI Software Factory turns a simple task like:

```bash
npm run dev -- run --repo ../test-repo --task "Fix the bug in index.js"
```

into a full automated pipeline:

```
AI → propose changes → approval → apply → run code → detect errors
→ retry → fix → validate → success
```

---

## ⚙️ Features

### 🧩 AI Code Generation
- Multi-file support
- Structured JSON operations
- Create / Modify / Patch support

### 🔧 Patch System
- insertAfter
- insertBefore
- replace
- fallback-safe patching

### 🧪 Real Validation
Runs:
```bash
node index.js
```

### 🔁 Self-Healing Loop
Automatically retries up to 3 attempts.

### 🧠 Deterministic Fixers
Handles:
- duplicate declarations
- missing variables
- runtime patterns

### 📊 Final Report
Saved to:
```
.factory/runs/<runId>/final-report.md
```

### 🧾 Commit Message Generator
Examples:
```
fix: fix the bug in index.js
feat: add logger utility
```

### 🛡️ Git Safety Mode
Optional:
```bash
--branch
```

---

## 🚀 Usage

```bash
npm run dev -- run --repo ../test-repo --task "Fix the bug in index.js"
```

---

## 📂 Structure

```
src/
  agents/
  ai/
  orchestrator/
  tools/
  schemas/
```

---

## ⚠️ Limitations

- Requires approval
- No dependency install yet
- No test generation yet

---

## 🧭 Roadmap

v1.3:
- Auto-commit
- Dependency install

v1.4:
- Test generation

v2.0:
- Multi-agent system (Planner / Coder / Debugger)
- Parallel tasks
- Project scaffolding

---

## 🧑‍💻 Author

Built by a solo developer exploring AI-driven software engineering.
