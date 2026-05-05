export interface PatchApplyResult {
  success: boolean;
  changed: boolean;
  skipped: boolean;
  confidence: "high" | "medium" | "low";
  reason?: string;
  fileBefore: string;
  fileAfter: string;
}
