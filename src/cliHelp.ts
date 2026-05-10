export function renderMainHelp(): string {
  return [
    "# AI Software Factory CLI",
    "",
    "Usage:",
    "  node dist/cli.js <command> [options]",
    "",
    "Commands:",
    "  run         Execute a repair task",
    "  runs        Show historical governance run dashboard",
    "  insights    Show governance insights over indexed runs",
    "  ci-summary  Show CI-friendly governance summary",
    "  archive     Show governance archive snapshot history",
    "",
    "Global options:",
    "  --help, -h   Show help",
    "",
    "Examples:",
    "  node dist/cli.js runs",
    "  node dist/cli.js insights --profile conservative",
    "  node dist/cli.js ci-summary --profile balanced",
    "  node dist/cli.js runs --export all",
    "  node dist/cli.js archive --latest",
    "",
    "Governance commands are read-only and do not modify repair behavior."
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
    "Read-only guarantee:",
    "  This command reads .factory/archive-index.json and does not modify repair behavior."
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
