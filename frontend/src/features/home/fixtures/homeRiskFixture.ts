import type { HomeRisk } from "@/features/home/domain/homeRisk";

export const homeRiskFixture: HomeRisk = {
  riskLevelInterpolated: 3.1,
  mediumThreshold: 24.9,
  highThreshold: 26.9,
  extremeThreshold: 28.9,
  recommendation: "Consider suspending play",
};
