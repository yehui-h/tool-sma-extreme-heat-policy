import {
  RISK_LEVELS,
  RISK_REGISTRY,
  type RiskLevel,
} from "@/domain/riskRegistry";

export type RiskLevelLabels = Record<RiskLevel, string>;

/**
 * Builds translated risk labels from registry i18n keys.
 */
export function createRiskLevelLabels(
  translate: (key: string) => string,
): RiskLevelLabels {
  return RISK_LEVELS.reduce<RiskLevelLabels>((labels, level) => {
    labels[level] = translate(RISK_REGISTRY[level].levelKey);

    return labels;
  }, {} as RiskLevelLabels);
}
