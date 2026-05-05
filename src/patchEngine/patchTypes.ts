export interface PatchAnchor {
  text: string;
}

export interface ExactPatchTarget {
  type: "exact";
  match: string;
}

export type PatchOperation =
  | {
      type: "replace";
      target: string;
      content: string;
    }
  | {
      type: "replace";
      target: ExactPatchTarget;
      replacement: string;
    }
  | {
      type: "insertAfter";
      anchor: PatchAnchor;
      content: string;
    }
  | {
      type: "appendSafe";
      content: string;
    };

export interface FileStructure {
  lines: string[];
  importEndLine: number | null;
  requireEndLine: number | null;
  firstExecutableLine: number | null;
  declaredNames: string[];
}

export interface PatchValidationResult {
  safe: boolean;
  confidence: "high" | "medium" | "low";
  reason?: string;
}
