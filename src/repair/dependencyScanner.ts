import fs from "node:fs";

export interface FileDependencySummary {
  file: string;
  imports: string[];
  exports: string[];
}

function addUnique(items: string[], value: string): void {
  if (!items.includes(value)) {
    items.push(value);
  }
}

function isLocalDependency(value: string): boolean {
  return value.startsWith("./") || value.startsWith("../");
}

function scanImports(content: string): string[] {
  const imports: string[] = [];
  const matches: Array<{ index: number; dependency: string }> = [];
  const patterns = [
    /\brequire\s*\(\s*["']([^"']+)["']\s*\)/g,
    /\bimport\s+(?:[^"']+\s+from\s+)?["']([^"']+)["']/g
  ];

  for (const pattern of patterns) {
    for (const match of content.matchAll(pattern)) {
      const dependency = match[1];
      if (isLocalDependency(dependency)) {
        matches.push({ index: match.index ?? 0, dependency });
      }
    }
  }

  matches.sort((a, b) => a.index - b.index);
  for (const match of matches) {
    addUnique(imports, match.dependency);
  }

  return imports;
}

function scanExports(content: string): string[] {
  const exports: string[] = [];
  const matches: Array<{ index: number; name: string }> = [];
  const patterns: Array<{ pattern: RegExp; getName: (match: RegExpMatchArray) => string }> = [
    {
      pattern: /\bmodule\.exports\s*=/g,
      getName: () => "module.exports"
    },
    {
      pattern: /\bmodule\.exports\.([A-Za-z_$][\w$]*)\s*=/g,
      getName: (match) => match[1]
    },
    {
      pattern: /\bexports\.([A-Za-z_$][\w$]*)\s*=/g,
      getName: (match) => match[1]
    },
    {
      pattern: /\bexport\s+default\b/g,
      getName: () => "default"
    },
    {
      pattern: /\bexport\s+function\s+([A-Za-z_$][\w$]*)\s*\(/g,
      getName: (match) => match[1]
    },
    {
      pattern: /\bexport\s+(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=/g,
      getName: (match) => match[1]
    },
    {
      pattern: /\bexport\s+class\s+([A-Za-z_$][\w$]*)\b/g,
      getName: (match) => match[1]
    }
  ];

  for (const { pattern, getName } of patterns) {
    for (const match of content.matchAll(pattern)) {
      matches.push({ index: match.index ?? 0, name: getName(match) });
    }
  }

  matches.sort((a, b) => a.index - b.index);
  for (const match of matches) {
    addUnique(exports, match.name);
  }

  return exports;
}

export function scanFileDependencies(filePath: string): FileDependencySummary | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const content = fs.readFileSync(filePath, "utf8");
  if (content.length === 0) {
    return null;
  }

  return {
    file: filePath,
    imports: scanImports(content),
    exports: scanExports(content)
  };
}

export function scanDependencyMap(filePaths: string[]): FileDependencySummary[];
export function scanDependencyMap(filePaths: string[]): FileDependencySummary[] {
  return filePaths
    .map((filePath) => scanFileDependencies(filePath))
    .filter((summary): summary is FileDependencySummary => summary !== null);
}
