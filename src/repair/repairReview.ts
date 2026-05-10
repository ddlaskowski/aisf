export type RepairReviewVerdict =
  | "approved"
  | "approved-with-warnings"
  | "needs-human-review"
  | "rejected";

export type RepairReview = {
  verdict: RepairReviewVerdict;
  qualityScore: number;
  safetyScore: number;
  completenessScore: number;
  findings: string[];
  recommendations: string[];
  blockingConcerns: string[];
  warnings: string[];
};

