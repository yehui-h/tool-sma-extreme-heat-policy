import type { RiskLevel } from '@/features/home/types'

export function get_risk_level_from_risk_level_interpolated(risk_level_interpolated: number): RiskLevel {
  if (risk_level_interpolated < 1) {
    return 'low'
  }
  if (risk_level_interpolated < 2) {
    return 'moderate'
  }
  if (risk_level_interpolated < 3) {
    return 'high'
  }
  return 'extreme'
}
