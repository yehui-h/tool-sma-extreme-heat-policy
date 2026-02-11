import { currentRisk } from '@/features/home/data/mockRisk'
import type { CurrentRiskData, HomeRiskRequest } from '@/features/home/types'
import { endpoints } from '@/shared/api/endpoints'
import { httpClient } from '@/shared/api/httpClient'

export async function getHomeRisk(payload?: HomeRiskRequest): Promise<CurrentRiskData> {
  if (!import.meta.env.VITE_API_BASE_URL) {
    return currentRisk
  }

  try {
    if (payload) {
      return await httpClient<CurrentRiskData>(endpoints.homeRisk, {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    }

    return await httpClient<CurrentRiskData>(endpoints.homeRisk)
  } catch {
    return currentRisk
  }
}
