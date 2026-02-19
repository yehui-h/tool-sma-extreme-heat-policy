import { useMemo, useRef, useState } from 'react'
import { get_home_risk } from '@/features/home/api/getHomeRisk'
import { currentRisk } from '@/features/home/data/mockRisk'
import type { SportType } from '@/features/home/domain/sportType'
import { savePersistedHomeFilters } from '@/features/home/lib/browserState'
import type {
  AppliedLocation,
  HomeRiskRequest,
  LocationRetrievePayload,
  LocationSuggestion,
  CurrentRiskData,
} from '@/features/home/types'

interface SetQueryStateValues {
  sport: SportType | null
  location: string | null
}

type SetQueryStates = (values: SetQueryStateValues, options?: { history?: 'replace' | 'push' }) => Promise<URLSearchParams>

interface UseRiskCalculationParams {
  draftSport: SportType
  draftSelectedLocation: LocationSuggestion | null
  isSharedChannel: boolean
  setQueryStates: SetQueryStates
}

interface UseRiskCalculationResult {
  risk: CurrentRiskData
  appliedLocation: AppliedLocation | null
  retrievePayload: LocationRetrievePayload | null
  isCalculating: boolean
  handleCalculateRisk: () => Promise<void>
}

function toAppliedLocation(suggestion: LocationSuggestion): AppliedLocation {
  return {
    id: suggestion.id,
    label: suggestion.formattedLocation,
    source: suggestion.source,
    mapboxId: suggestion.mapboxId,
    latitude: suggestion.latitude,
    longitude: suggestion.longitude,
    sessionToken: suggestion.sessionToken,
  }
}

function toRetrievePayload(location: AppliedLocation): LocationRetrievePayload | null {
  if (!location.mapboxId || !location.sessionToken) {
    return null
  }

  return {
    mapboxId: location.mapboxId,
    sessionToken: location.sessionToken,
  }
}

export function useRiskCalculation({
  draftSport,
  draftSelectedLocation,
  isSharedChannel,
  setQueryStates,
}: UseRiskCalculationParams): UseRiskCalculationResult {
  const [appliedLocation, setAppliedLocation] = useState<AppliedLocation | null>(null)
  const [risk, setRisk] = useState(currentRisk)
  const [isCalculating, setIsCalculating] = useState(false)
  const lastAppliedRef = useRef<{ sport: SportType; loc: string } | null>(null)

  const retrievePayload = useMemo(
    () => (appliedLocation ? toRetrievePayload(appliedLocation) : null),
    [appliedLocation],
  )

  const handleCalculateRisk = async () => {
    if (!draftSelectedLocation) {
      return
    }

    const nextAppliedLocation = toAppliedLocation(draftSelectedLocation)
    setAppliedLocation(nextAppliedLocation)
    setIsCalculating(true)

    const payload: HomeRiskRequest = {
      sport: draftSport,
      locationMeta: {
        source: nextAppliedLocation.source,
        mapboxId: nextAppliedLocation.mapboxId,
        sessionToken: nextAppliedLocation.sessionToken,
      },
    }

    try {
      const nextRisk = await get_home_risk(payload)
      setRisk(nextRisk)

      const nextSelection = {
        sport: draftSport,
        loc: nextAppliedLocation.label,
      }

      const hasSelectionChanged =
        !lastAppliedRef.current ||
        lastAppliedRef.current.sport !== nextSelection.sport ||
        lastAppliedRef.current.loc !== nextSelection.loc

      if (hasSelectionChanged) {
        await setQueryStates(
          {
            sport: nextSelection.sport,
            location: nextSelection.loc,
          },
          { history: 'replace' },
        )

        if (!isSharedChannel) {
          savePersistedHomeFilters(nextSelection)
        }

        lastAppliedRef.current = nextSelection
      }
    } finally {
      setIsCalculating(false)
    }
  }

  return {
    risk,
    appliedLocation,
    retrievePayload,
    isCalculating,
    handleCalculateRisk,
  }
}
