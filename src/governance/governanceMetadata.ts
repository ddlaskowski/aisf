export interface GovernanceMetadata {
  version: string;
  generatedAt?: string;
  source?: string;
  command?: string;
  readonly?: boolean;
  previewOnly?: boolean;
}
