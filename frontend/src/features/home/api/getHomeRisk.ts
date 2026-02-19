import { is_home_risk_response_dto } from '@/features/home/api/responseDTO'
import { currentRisk } from '@/features/home/data/mockRisk'
import type { CurrentRiskData, HomeRiskRequest } from '@/features/home/types'
import { endpoints } from '@/shared/api/endpoints'
import { httpClient } from '@/shared/api/httpClient'

export async function get_home_risk(payload: HomeRiskRequest): Promise<CurrentRiskData> {
  if (!import.meta.env.VITE_API_BASE_URL) {
    return currentRisk
  }

  try {
    const response = await httpClient<unknown>(endpoints.homeRisk, {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    if (!is_home_risk_response_dto(response)) {
      return currentRisk
    }

    return response.data
  } catch {
    return currentRisk
  }
}
