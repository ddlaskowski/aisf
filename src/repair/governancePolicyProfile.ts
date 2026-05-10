export type GovernancePolicyProfileName = "conservative" | "balanced" | "experimental";

export type GovernancePolicyProfile = {
  name: GovernancePolicyProfileName;
  description: string;
  thresholds: {
    highBlockedRatePercent: number;
    highHumanReviewRatePercent: number;
    lowValidationSuccessRatePercent: number;
    lowAverageTrustScore: number;
    degradingTrustDelta: number;
    healthyReadyRatePercent: number;
    healthyMaxBlockedRatePercent: number;
  };
  labels: {
    operatorMode: string;
    riskTolerance: "low" | "medium" | "high";
  };
};

const GOVERNANCE_POLICY_PROFILES: Record<GovernancePolicyProfileName, GovernancePolicyProfile> = {
  conservative: {
    name: "conservative",
    description: "strict governance, low risk tolerance",
    thresholds: {
      highBlockedRatePercent: 15,
      highHumanReviewRatePercent: 20,
      lowValidationSuccessRatePercent: 90,
      lowAverageTrustScore: 75,
      degradingTrustDelta: 10,
      healthyReadyRatePercent: 90,
      healthyMaxBlockedRatePercent: 5
    },
    labels: {
      operatorMode: "Conservative governance",
      riskTolerance: "low"
    }
  },
  balanced: {
    name: "balanced",
    description: "default governance, medium risk tolerance",
    thresholds: {
      highBlockedRatePercent: 25,
      highHumanReviewRatePercent: 30,
      lowValidationSuccessRatePercent: 80,
      lowAverageTrustScore: 65,
      degradingTrustDelta: 15,
      healthyReadyRatePercent: 80,
      healthyMaxBlockedRatePercent: 10
    },
    labels: {
      operatorMode: "Balanced governance",
      riskTolerance: "medium"
    }
  },
  experimental: {
    name: "experimental",
    description: "relaxed governance, high risk tolerance",
    thresholds: {
      highBlockedRatePercent: 40,
      highHumanReviewRatePercent: 50,
      lowValidationSuccessRatePercent: 65,
      lowAverageTrustScore: 50,
      degradingTrustDelta: 25,
      healthyReadyRatePercent: 60,
      healthyMaxBlockedRatePercent: 20
    },
    labels: {
      operatorMode: "Experimental governance",
      riskTolerance: "high"
    }
  }
};

export function isGovernancePolicyProfileName(value: string): value is GovernancePolicyProfileName {
  return value === "conservative" || value === "balanced" || value === "experimental";
}

export function getGovernancePolicyProfile(name?: string): GovernancePolicyProfile {
  if (name && isGovernancePolicyProfileName(name)) {
    return GOVERNANCE_POLICY_PROFILES[name];
  }
  return GOVERNANCE_POLICY_PROFILES.balanced;
}

export function listGovernancePolicyProfiles(): GovernancePolicyProfile[] {
  return [
    GOVERNANCE_POLICY_PROFILES.conservative,
    GOVERNANCE_POLICY_PROFILES.balanced,
    GOVERNANCE_POLICY_PROFILES.experimental
  ];
}
