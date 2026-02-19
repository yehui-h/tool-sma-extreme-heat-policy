import type { HomeRiskDataDTO } from '@/features/home/api/responseDTO'
import type { HomeRisk } from '@/features/home/domain/homeRisk'

export function mapHomeRiskDtoToDomain(dto: HomeRiskDataDTO): HomeRisk {
  return {
    riskLevelInterpolated: dto.risk_level_interpolated,
    mediumThreshold: dto.t_medium,
    highThreshold: dto.t_high,
    extremeThreshold: dto.t_extreme,
    recommendation: dto.recommendation,
  }
}
