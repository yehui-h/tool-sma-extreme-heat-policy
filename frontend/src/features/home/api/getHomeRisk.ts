import { mapHomeRiskDtoToDomain } from '@/features/home/api/mappers'
import { is_home_risk_response_dto } from '@/features/home/api/responseDTO'
import type { HomeRisk } from '@/features/home/domain/homeRisk'
import { homeRiskFixture } from '@/features/home/fixtures/homeRiskFixture'
import type { HomeRiskRequest } from '@/features/home/types'
import { endpoints } from '@/shared/api/endpoints'
import { httpClient } from '@/shared/api/httpClient'

export type HomeRiskErrorReason = 'missing_api_base_url' | 'invalid_response' | 'network_error'

export type HomeRiskResult =
  | {
      ok: true
      data: HomeRisk
    }
  | {
      ok: false
      reason: HomeRiskErrorReason
    }

function resolveHomeDataSource(): 'api' | 'mock' {
  const rawSource = String(import.meta.env.VITE_HOME_DATA_SOURCE ?? 'api').trim().toLowerCase()
  return rawSource === 'mock' ? 'mock' : 'api'
}

export async function getHomeRisk(payload: HomeRiskRequest): Promise<HomeRiskResult> {
  if (resolveHomeDataSource() === 'mock') {
    return {
      ok: true,
      data: homeRiskFixture,
    }
  }

  if (!import.meta.env.VITE_API_BASE_URL) {
    return {
      ok: false,
      reason: 'missing_api_base_url',
    }
  }

  try {
    const response = await httpClient<unknown>(endpoints.homeRisk, {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    if (!is_home_risk_response_dto(response)) {
      return {
        ok: false,
        reason: 'invalid_response',
      }
    }

    return {
      ok: true,
      data: mapHomeRiskDtoToDomain(response.data),
    }
  } catch {
    return {
      ok: false,
      reason: 'network_error',
    }
  }
}
