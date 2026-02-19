import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { suggestLocations } from '@/features/home/api/suggestLocations'
import type { LocationSuggestion } from '@/features/home/types'

const MIN_LOCATION_QUERY_LENGTH = 2
const SUGGEST_DEBOUNCE_MS = 500
const MAPBOX_TOKEN_REQUIRED_NOTICE =
  'Mapbox access token is required to search locations. Please configure VITE_MAPBOX_ACCESS_TOKEN.'
const MAPBOX_SUGGEST_UNAVAILABLE_NOTICE = 'Location suggestions are temporarily unavailable. Please try again.'
const MAPBOX_NO_LOCATION_FOUND_NOTICE = 'No location found for this query.'

interface UseLocationSuggestParams {
  initialLocationInput: string
  mapboxAccessToken: string
  hasMapboxToken: boolean
}

interface UseLocationSuggestResult {
  draftLocationInput: string
  draftSelectedLocation: LocationSuggestion | null
  suggestionLabels: string[]
  isSuggestLoading: boolean
  suggestError: string | null
  onLocationInputChange: (value: string) => void
  onLocationOptionSubmit: (value: string) => void
}

function createSessionToken(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `session-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

function getLanguagePreference(): string | undefined {
  if (typeof navigator === 'undefined') {
    return undefined
  }

  if (Array.isArray(navigator.languages) && navigator.languages.length > 0) {
    return navigator.languages.join(',')
  }

  return navigator.language || undefined
}

function dedupeSuggestionsByLabel(suggestions: LocationSuggestion[]): LocationSuggestion[] {
  const seen = new Set<string>()

  return suggestions.filter((suggestion) => {
    const value = suggestion.formattedLocation.trim()
    if (!value || seen.has(value)) {
      return false
    }

    seen.add(value)
    return true
  })
}

export function useLocationSuggest({
  initialLocationInput,
  mapboxAccessToken,
  hasMapboxToken,
}: UseLocationSuggestParams): UseLocationSuggestResult {
  const [draftLocationInput, setDraftLocationInput] = useState<string>(initialLocationInput)
  const [draftSelectedLocation, setDraftSelectedLocation] = useState<LocationSuggestion | null>(null)
  const [sessionToken, setSessionToken] = useState<string>(createSessionToken)
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([])
  const [isSuggestLoading, setIsSuggestLoading] = useState(false)
  const [suggestError, setSuggestError] = useState<string | null>(null)
  const requestSequenceRef = useRef(0)
  const activeSuggestAbortRef = useRef<AbortController | null>(null)

  const suggestionLabels = useMemo(
    () => locationSuggestions.map((item) => item.formattedLocation),
    [locationSuggestions],
  )

  const resetSuggestState = useCallback((nextError: string | null) => {
    activeSuggestAbortRef.current?.abort()
    setLocationSuggestions([])
    setIsSuggestLoading(false)
    setSuggestError(nextError)
  }, [])

  useEffect(() => {
    return () => {
      activeSuggestAbortRef.current?.abort()
    }
  }, [])

  useEffect(() => {
    const query = draftLocationInput.trim()
    const selectedLocationValue = draftSelectedLocation?.formattedLocation.trim() ?? ''

    if (!hasMapboxToken) {
      resetSuggestState(MAPBOX_TOKEN_REQUIRED_NOTICE)
      return
    }

    if (selectedLocationValue && query === selectedLocationValue) {
      resetSuggestState(null)
      return
    }

    if (query.length < MIN_LOCATION_QUERY_LENGTH) {
      resetSuggestState(null)
      return
    }

    const debounceId = window.setTimeout(() => {
      void (async () => {
        activeSuggestAbortRef.current?.abort()
        const controller = new AbortController()
        activeSuggestAbortRef.current = controller

        const requestId = requestSequenceRef.current + 1
        requestSequenceRef.current = requestId
        setIsSuggestLoading(true)

        try {
          const nextSuggestions = await suggestLocations({
            query,
            accessToken: mapboxAccessToken,
            sessionToken,
            signal: controller.signal,
            language: getLanguagePreference(),
          })

          if (requestId !== requestSequenceRef.current) {
            return
          }

          const dedupedSuggestions = dedupeSuggestionsByLabel(nextSuggestions)
          setLocationSuggestions(dedupedSuggestions)
          setSuggestError(dedupedSuggestions.length === 0 ? MAPBOX_NO_LOCATION_FOUND_NOTICE : null)
        } catch (error) {
          if (isAbortError(error)) {
            return
          }

          if (requestId !== requestSequenceRef.current) {
            return
          }

          setLocationSuggestions([])
          setSuggestError(MAPBOX_SUGGEST_UNAVAILABLE_NOTICE)
        } finally {
          if (requestId === requestSequenceRef.current) {
            setIsSuggestLoading(false)
          }
        }
      })()
    }, SUGGEST_DEBOUNCE_MS)

    return () => {
      window.clearTimeout(debounceId)
    }
  }, [draftLocationInput, draftSelectedLocation, hasMapboxToken, mapboxAccessToken, sessionToken, resetSuggestState])

  const onLocationInputChange = (value: string) => {
    setDraftLocationInput(value)

    const selectedLocationValue = draftSelectedLocation?.formattedLocation ?? ''
    if (draftSelectedLocation && value !== selectedLocationValue) {
      setDraftSelectedLocation(null)
      setSessionToken(createSessionToken())
    }
  }

  const onLocationOptionSubmit = (value: string) => {
    const selectedSuggestion = locationSuggestions.find((suggestion) => suggestion.formattedLocation === value)

    if (selectedSuggestion) {
      setDraftSelectedLocation(selectedSuggestion)
      setDraftLocationInput(selectedSuggestion.formattedLocation)
    }
  }

  return {
    draftLocationInput,
    draftSelectedLocation,
    suggestionLabels,
    isSuggestLoading,
    suggestError,
    onLocationInputChange,
    onLocationOptionSubmit,
  }
}
