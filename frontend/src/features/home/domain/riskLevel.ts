import { toRiskLevel, type RiskLevel } from '@/features/home/domain/homeRisk'

export function get_risk_level_from_risk_level_interpolated(risk_level_interpolated: number): RiskLevel {
  return toRiskLevel(risk_level_interpolated)
}
