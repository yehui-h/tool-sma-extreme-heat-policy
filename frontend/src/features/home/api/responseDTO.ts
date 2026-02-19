interface UnknownRecord {
  [key: string]: unknown
}

export interface HomeRiskDataDTO {
  risk_level_interpolated: number
  t_medium: number
  t_high: number
  t_extreme: number
  recommendation: string
}

export interface HomeRiskResponseDTO {
  data: HomeRiskDataDTO
  meta: UnknownRecord
}

function is_record(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null
}

function is_finite_number(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

export function is_home_risk_data_dto(value: unknown): value is HomeRiskDataDTO {
  if (!is_record(value)) {
    return false
  }

  return (
    is_finite_number(value.risk_level_interpolated) &&
    is_finite_number(value.t_medium) &&
    is_finite_number(value.t_high) &&
    is_finite_number(value.t_extreme) &&
    typeof value.recommendation === 'string'
  )
}

export function is_home_risk_response_dto(value: unknown): value is HomeRiskResponseDTO {
  if (!is_record(value)) {
    return false
  }

  if (!is_home_risk_data_dto(value.data)) {
    return false
  }

  return is_record(value.meta)
}
