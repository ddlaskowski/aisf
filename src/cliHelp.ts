export function renderMainHelp(): string {
  return [
    "# AI Software Factory CLI",
    "",
    "Usage:",
    "  node dist/cli.js <command> [options]",
    "",
    "Commands:",
    "  run         Execute a repair task",
    "  governance  Show unified governance control plane summary",
    "  runs        Show historical governance run dashboard",
    "  insights    Show governance insights over indexed runs",
    "  ci-summary  Show CI-friendly governance summary",
    "  archive     Show governance archive snapshot history",
    "  trends      Show governance trend analysis over archives",
    "  drift       Show governance drift detection against baselines",
    "  stability   Show governance operational stability score",
    "  escalation  Show governance operator escalation status",
    "  policy      Show governance policy recommendation",
    "  decision-matrix  Explain governance decision reasoning",
    "  evidence-pack    Export governance evidence pack",
    "  evidence-list    Show governance evidence registry",
    "  evidence-diff    Compare governance evidence packs",
    "",
    "Global options:",
    "  --help, -h   Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance",
    "  node dist/cli.js governance config",
    "  node dist/cli.js runs",
    "  node dist/cli.js insights --profile conservative",
    "  node dist/cli.js ci-summary --profile balanced",
    "  node dist/cli.js runs --export all",
    "  node dist/cli.js archive --latest",
    "  node dist/cli.js trends --window 20",
    "  node dist/cli.js drift --json",
    "  node dist/cli.js stability --json",
    "  node dist/cli.js escalation --json",
    "  node dist/cli.js policy --json",
    "  node dist/cli.js decision-matrix --json",
    "  node dist/cli.js evidence-pack --json",
    "  node dist/cli.js evidence-list --latest",
    "  node dist/cli.js evidence-diff <A> <B>",
    "",
    "Governance inspection commands are read-only unless --export, --archive, or evidence-pack is explicitly used.",
    "Governance commands do not modify repair behavior."
  ].join("\n") + "\n";
}

export function renderGovernanceHelp(): string {
  return [
    "# AI Software Factory CLI - governance",
    "",
    "Usage:",
    "  node dist/cli.js governance [options]",
    "",
    "Options:",
    "  --repo <path>                Path to target repository",
    "  --window <n>                 Trend analysis window",
    "  --baseline-window <n>       Drift baseline window",
    "  --comparison-window <n>     Drift comparison window",
    "  --json                      Print JSON output",
    "  --help, -h                  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance",
    "  node dist/cli.js governance --window 20",
    "  node dist/cli.js governance --json",
    "  node dist/cli.js governance config",
    "",
    "Read-only guarantee:",
    "  Governance control plane reads governance data and does not modify repair behavior.",
    "  Governance control plane does not generate evidence packs or archives automatically.",
    "  Governance control plane does not modify .factory/archive-index.json, .factory/evidence-index.json, or .factory/runs-index.json."
  ].join("\n") + "\n";
}

export function renderGovernanceConfigHelp(): string {
  return [
    "# AI Software Factory CLI - governance config",
    "",
    "Usage:",
    "  node dist/cli.js governance config [options]",
    "",
    "Options:",
    "  --json      Print JSON output",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance config",
    "  node dist/cli.js governance config --json",
    "  node dist/cli.js governance config example",
    "  node dist/cli.js governance config validate",
    "",
    "Read-only guarantee:",
    "  Governance config preview does not modify repair behavior or governance indexes.",
    "  Governance config preview does not load, create, or enforce .factory/governance.config.json."
  ].join("\n") + "\n";
}

export function renderGovernanceConfigValidateHelp(): string {
  return [
    "# AI Software Factory CLI - governance config validate",
    "",
    "Usage:",
    "  node dist/cli.js governance config validate [options]",
    "",
    "Options:",
    "  --json      Print JSON output",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance config validate",
    "  node dist/cli.js governance config validate --json",
    "",
    "Validation-only guarantee:",
    "  This command validates .factory/governance.config.json but does not apply it.",
    "  This command does not create, overwrite, load, or enforce runtime governance configuration."
  ].join("\n") + "\n";
}

export function renderGovernanceConfigExampleHelp(): string {
  return [
    "# AI Software Factory CLI - governance config example",
    "",
    "Usage:",
    "  node dist/cli.js governance config example [options]",
    "",
    "Options:",
    "  --json      Print JSON output",
    "  --write     Write .factory/governance.config.example.json",
    "  --help, -h  Show help",
    "",
    "Examples:",
    "  node dist/cli.js governance config example",
    "  node dist/cli.js governance config example --json",
    "  node dist/cli.js governance config example --write",
    "",
    "Read-only/runtime guarantee:",
    "  This command does not load or enforce runtime governance configuration.",
    "  This command does not create .factory/governance.config.json.",
    "  The --write option writes only .factory/governance.config.example.json."
  ].join("\n") + "\n";
}

export function renderRunsHelp(): string {
  return [
    "# AI Software Factory CLI - runs",
    "",
    "Usage:",
    "  node dist/cli.js runs [options]",
    "",
    "Options:",
    "  --repo <path>        Path to target repository",
    "  --limit <n>          Show latest n runs",
    "  --status <status>    Filter by governance status",
    "  --blocked            Show only blocked runs",
    "  --human-review       Show only human-review runs",
    "  --latest             Show latest run only",
    "  --json               Print JSON output",
    "  --export [format]    Export dashboard: json, markdown, csv, all",
    "  --archive            Archive generated export files",
    "  --help, -h           Show help",
    "",
    "Statuses:",
    "  ready",
    "  ready-with-caution",
    "  manual-review-required",
    "  blocked",
    "",
    "Examples:",
    "  node dist/cli.js runs --limit 10",
    "  node dist/cli.js runs --status blocked",
    "  node dist/cli.js runs --export all",
    "  node dist/cli.js runs --export all --archive",
    "  node dist/cli.js runs --json",
    "",
    "Read-only guarantee:",
    "  This command reads .factory/runs-index.json and does not modify repair behavior.",
    "  The --archive option only works with --export and writes under .factory/archive."
  ].join("\n") + "\n";
}

export function renderInsightsHelp(): string {
  return [
    "# AI Software Factory CLI - insights",
    "",
    "Usage:",
    "  node dist/cli.js insights [options]",
    "",
    "Options:",
    "  --repo <path>      Path to target repository",
    "  --profile <name>   Use governance policy profile",
    "  --profiles         List available profiles",
    "  --json             Print JSON output",
    "  --export           Export insights JSON/Markdown",
    "  --archive          Archive generated export files",
    "  --help, -h         Show help",
    "",
    "Profiles:",
    "  conservative",
    "  balanced",
    "  experimental",
    "",
    "Examples:",
    "  node dist/cli.js insights",
    "  node dist/cli.js insights --profile conservative",
    "  node dist/cli.js insights --profiles",
    "  node dist/cli.js insights --json --export",
    "  node dist/cli.js insights --export --archive",
    "",
    "Read-only guarantee:",
    "  This command reads .factory/runs-index.json and does not modify repair behavior.",
    "  The --archive option only works with --export and writes under .factory/archive."
  ].join("\n") + "\n";
}

export function renderCiSummaryHelp(): string {
  return [
    "# AI Software Factory CLI - ci-summary",
    "",
    "Usage:",
    "  node dist/cli.js ci-summary [options]",
    "",
    "Options:",
    "  --repo <path>      Path to target repository",
    "  --profile <name>   Use governance policy profile",
    "  --json             Print JSON output",
    "  --export           Export CI summary JSON/Markdown",
    "  --archive          Archive generated export files",
    "  --help, -h         Show help",
    "",
    "Exit codes:",
    "  pass  -> 0",
    "  warn  -> 0",
    "  fail  -> 1",
    "",
    "Examples:",
    "  node dist/cli.js ci-summary",
    "  node dist/cli.js ci-summary --profile conservative",
    "  node dist/cli.js ci-summary --json",
    "  node dist/cli.js ci-summary --export",
    "  node dist/cli.js ci-summary --export --archive",
    "",
    "Read-only guarantee:",
    "  This command reads .factory/runs-index.json and does not modify repair behavior.",
    "  The --archive option only works with --export and writes under .factory/archive."
  ].join("\n") + "\n";
}

export function renderArchiveHelp(): string {
  return [
    "# AI Software Factory CLI - archive",
    "",
    "Usage:",
    "  node dist/cli.js archive [options]",
    "",
    "Options:",
    "  --repo <path>   Path to target repository",
    "  --latest        Show latest archive snapshot only",
    "  --kind <kind>   Filter by archive kind",
    "  --limit <n>     Show latest n archive snapshots",
    "  --json          Print JSON output",
    "  --help, -h      Show help",
    "",
    "Kinds:",
    "  runs-dashboard",
    "  governance-insights",
    "  governance-ci-summary",
    "",
    "Examples:",
    "  node dist/cli.js archive",
    "  node dist/cli.js archive --latest",
    "  node dist/cli.js archive --kind governance-insights",
    "  node dist/cli.js archive --kind governance-ci-summary --limit 5",
    "  node dist/cli.js archive --json",
    "",
    "Diff usage:",
    "  node dist/cli.js archive diff <archiveIdA> <archiveIdB>",
    "",
    "Diff examples:",
    "  node dist/cli.js archive diff <A> <B>",
    "  node dist/cli.js archive diff <A> <B> --json",
    "",
    "Supported diff kinds:",
    "  governance-insights",
    "  governance-ci-summary",
    "",
    "Read-only guarantee:",
    "  This command reads .factory/archive-index.json and does not modify repair behavior.",
    "  Archive diff does not modify repair behavior or archive data."
  ].join("\n") + "\n";
}

export function renderTrendsHelp(): string {
  return [
    "# AI Software Factory CLI - trends",
    "",
    "Usage:",
    "  node dist/cli.js trends [options]",
    "",
    "Options:",
    "  --repo <path>   Path to target repository",
    "  --kind <kind>   Archive kind to analyze",
    "  --window <n>    Snapshot window size",
    "  --json          Print JSON output",
    "  --help, -h      Show help",
    "",
    "Supported kinds:",
    "  governance-insights",
    "",
    "Examples:",
    "  node dist/cli.js trends",
    "  node dist/cli.js trends --window 20",
    "  node dist/cli.js trends --kind governance-insights",
    "  node dist/cli.js trends --json",
    "",
    "Read-only guarantee:",
    "  Trend analysis reads archive history and does not modify repair behavior.",
    "  Trend analysis does not modify .factory/archive-index.json or .factory/runs-index.json."
  ].join("\n") + "\n";
}

export function renderDriftHelp(): string {
  return [
    "# AI Software Factory CLI - drift",
    "",
    "Usage:",
    "  node dist/cli.js drift [options]",
    "",
    "Options:",
    "  --repo <path>                Path to target repository",
    "  --kind <kind>                Archive kind to analyze",
    "  --baseline-window <n>       Historical baseline window",
    "  --comparison-window <n>     Recent comparison window",
    "  --json                      Print JSON output",
    "  --help, -h                  Show help",
    "",
    "Supported kinds:",
    "  governance-insights",
    "",
    "Examples:",
    "  node dist/cli.js drift",
    "  node dist/cli.js drift --baseline-window 30",
    "  node dist/cli.js drift --comparison-window 10",
    "  node dist/cli.js drift --json",
    "",
    "Read-only guarantee:",
    "  Drift detection reads governance history and does not modify repair behavior.",
    "  Drift detection does not modify .factory/archive-index.json or .factory/runs-index.json."
  ].join("\n") + "\n";
}

export function renderStabilityHelp(): string {
  return [
    "# AI Software Factory CLI - stability",
    "",
    "Usage:",
    "  node dist/cli.js stability [options]",
    "",
    "Options:",
    "  --repo <path>                Path to target repository",
    "  --window <n>                 Trend analysis window",
    "  --baseline-window <n>       Drift baseline window",
    "  --comparison-window <n>     Drift comparison window",
    "  --json                      Print JSON output",
    "  --help, -h                  Show help",
    "",
    "Examples:",
    "  node dist/cli.js stability",
    "  node dist/cli.js stability --window 20",
    "  node dist/cli.js stability --baseline-window 30",
    "  node dist/cli.js stability --comparison-window 10",
    "  node dist/cli.js stability --json",
    "",
    "Read-only guarantee:",
    "  Stability scoring reads governance history and does not modify repair behavior.",
    "  Stability scoring does not modify .factory/archive-index.json or .factory/runs-index.json."
  ].join("\n") + "\n";
}

export function renderEscalationHelp(): string {
  return [
    "# AI Software Factory CLI - escalation",
    "",
    "Usage:",
    "  node dist/cli.js escalation [options]",
    "",
    "Options:",
    "  --repo <path>                Path to target repository",
    "  --window <n>                 Trend analysis window",
    "  --baseline-window <n>       Drift baseline window",
    "  --comparison-window <n>     Drift comparison window",
    "  --json                      Print JSON output",
    "  --help, -h                  Show help",
    "",
    "Examples:",
    "  node dist/cli.js escalation",
    "  node dist/cli.js escalation --window 20",
    "  node dist/cli.js escalation --baseline-window 30",
    "  node dist/cli.js escalation --comparison-window 10",
    "  node dist/cli.js escalation --json",
    "",
    "Read-only guarantee:",
    "  Escalation analysis reads governance history and does not modify repair behavior.",
    "  Escalation analysis does not send notifications or call external services.",
    "  Escalation analysis does not modify .factory/archive-index.json or .factory/runs-index.json."
  ].join("\n") + "\n";
}

export function renderPolicyHelp(): string {
  return [
    "# AI Software Factory CLI - policy",
    "",
    "Usage:",
    "  node dist/cli.js policy [options]",
    "",
    "Options:",
    "  --repo <path>                Path to target repository",
    "  --window <n>                 Trend analysis window",
    "  --baseline-window <n>       Drift baseline window",
    "  --comparison-window <n>     Drift comparison window",
    "  --json                      Print JSON output",
    "  --help, -h                  Show help",
    "",
    "Examples:",
    "  node dist/cli.js policy",
    "  node dist/cli.js policy --window 20",
    "  node dist/cli.js policy --baseline-window 30",
    "  node dist/cli.js policy --comparison-window 10",
    "  node dist/cli.js policy --json",
    "",
    "Read-only guarantee:",
    "  Policy recommendation reads governance history and does not modify repair behavior.",
    "  Policy recommendation does not enforce policies automatically.",
    "  Policy recommendation does not modify .factory/archive-index.json or .factory/runs-index.json."
  ].join("\n") + "\n";
}

export function renderDecisionMatrixHelp(): string {
  return [
    "# AI Software Factory CLI - decision-matrix",
    "",
    "Usage:",
    "  node dist/cli.js decision-matrix [options]",
    "",
    "Options:",
    "  --repo <path>                Path to target repository",
    "  --window <n>                 Trend analysis window",
    "  --baseline-window <n>       Drift baseline window",
    "  --comparison-window <n>     Drift comparison window",
    "  --json                      Print JSON output",
    "  --help, -h                  Show help",
    "",
    "Examples:",
    "  node dist/cli.js decision-matrix",
    "  node dist/cli.js decision-matrix --window 20",
    "  node dist/cli.js decision-matrix --json",
    "",
    "Read-only guarantee:",
    "  Decision matrix analysis explains governance decisions and does not modify repair behavior.",
    "  Decision matrix analysis does not change governance decisions or policy recommendations.",
    "  Decision matrix analysis does not modify .factory/archive-index.json or .factory/runs-index.json."
  ].join("\n") + "\n";
}

export function renderEvidencePackHelp(): string {
  return [
    "# AI Software Factory CLI - evidence-pack",
    "",
    "Usage:",
    "  node dist/cli.js evidence-pack [options]",
    "",
    "Options:",
    "  --repo <path>                Path to target repository",
    "  --window <n>                 Trend analysis window",
    "  --baseline-window <n>       Drift baseline window",
    "  --comparison-window <n>     Drift comparison window",
    "  --json                      Print JSON output",
    "  --help, -h                  Show help",
    "",
    "Examples:",
    "  node dist/cli.js evidence-pack",
    "  node dist/cli.js evidence-pack --window 20",
    "  node dist/cli.js evidence-pack --json",
    "",
    "Read-only guarantee:",
    "  Evidence pack export does not modify repair behavior.",
    "  Evidence pack export does not change governance decisions or policy recommendations.",
    "  Evidence pack export does not modify .factory/archive-index.json or .factory/runs-index.json."
  ].join("\n") + "\n";
}

export function renderEvidenceListHelp(): string {
  return [
    "# AI Software Factory CLI - evidence-list",
    "",
    "Usage:",
    "  node dist/cli.js evidence-list [options]",
    "",
    "Options:",
    "  --repo <path>             Path to target repository",
    "  --latest                  Show latest evidence pack only",
    "  --limit <n>               Limit results",
    "  --policy <mode>           Filter by policy mode",
    "  --escalation <level>      Filter by escalation level",
    "  --json                    Print JSON output",
    "  --help, -h                Show help",
    "",
    "Policy modes:",
    "  normal",
    "  conservative",
    "  restricted",
    "  manual-review-only",
    "",
    "Escalation levels:",
    "  none",
    "  info",
    "  warning",
    "  high-risk",
    "  critical",
    "",
    "Examples:",
    "  node dist/cli.js evidence-list",
    "  node dist/cli.js evidence-list --latest",
    "  node dist/cli.js evidence-list --limit 20",
    "  node dist/cli.js evidence-list --policy restricted",
    "  node dist/cli.js evidence-list --escalation critical",
    "  node dist/cli.js evidence-list --json",
    "",
    "Read-only guarantee:",
    "  Evidence registry browsing does not modify repair behavior.",
    "  Evidence registry browsing reads .factory/evidence-index.json.",
    "  Evidence registry browsing does not modify .factory/archive-index.json or .factory/runs-index.json."
  ].join("\n") + "\n";
}

export function renderEvidenceDiffHelp(): string {
  return [
    "# AI Software Factory CLI - evidence-diff",
    "",
    "Usage:",
    "  node dist/cli.js evidence-diff <evidencePackIdA> <evidencePackIdB> [options]",
    "",
    "Options:",
    "  --repo <path>   Path to target repository",
    "  --json          Print JSON output",
    "  --help, -h      Show help",
    "",
    "Examples:",
    "  node dist/cli.js evidence-diff <A> <B>",
    "  node dist/cli.js evidence-diff <A> <B> --json",
    "",
    "Read-only guarantee:",
    "  Evidence diff compares existing evidence packs and does not modify repair behavior.",
    "  Evidence diff does not modify .factory/evidence-index.json.",
    "  Evidence diff does not modify .factory/archive-index.json or .factory/runs-index.json."
  ].join("\n") + "\n";
}

export function renderUnknownCommandError(command: string): string {
  return [
    `Unknown command: ${command}`,
    "",
    "Run:",
    "  node dist/cli.js --help",
    "",
    "for available commands."
  ].join("\n") + "\n";
}

export function renderInvalidFlagError(command: string, flag: string): string {
  return [
    `Invalid option for ${command}: ${flag}`,
    "",
    "Run:",
    `  node dist/cli.js ${command} --help`,
    "",
    "for usage."
  ].join("\n") + "\n";
}

export function renderArchiveRequiresExportError(command: string): string {
  return [
    "Archive option requires --export.",
    "",
    "Run:",
    `  node dist/cli.js ${command} --help`,
    "",
    "for usage."
  ].join("\n") + "\n";
}
