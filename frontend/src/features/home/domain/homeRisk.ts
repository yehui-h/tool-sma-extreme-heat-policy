export type RiskLevel = "low" | "moderate" | "high" | "extreme";

export interface HomeRisk {
  riskLevelInterpolated: number;
  mediumThreshold: number;
  highThreshold: number;
  extremeThreshold: number;
  recommendation: string;
}

interface RiskLevelRule {
  upperExclusive: number;
  level: RiskLevel;
}

export const RISK_LEVEL_RULES: readonly RiskLevelRule[] = [
  { upperExclusive: 1, level: "low" },
  { upperExclusive: 2, level: "moderate" },
  { upperExclusive: 3, level: "high" },
  { upperExclusive: Number.POSITIVE_INFINITY, level: "extreme" },
];

export function toRiskLevel(score: number): RiskLevel {
  const safeScore = Number.isFinite(score) ? score : 0;

  for (const rule of RISK_LEVEL_RULES) {
    if (safeScore < rule.upperExclusive) {
      return rule.level;
    }
  }

  return "extreme";
}
