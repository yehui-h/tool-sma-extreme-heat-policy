import type { LocationSuggestion } from '@/features/home/types'

const MAPBOX_SUGGEST_ENDPOINT = 'https://api.mapbox.com/search/searchbox/v1/suggest'
const MAPBOX_TYPES = 'address,street,neighborhood,locality,place,district,region,postcode,country,poi'

interface MapboxSuggestResponse {
  suggestions?: MapboxSuggestItem[]
}

interface MapboxSuggestItem {
  id?: string
  mapbox_id?: string
  full_address?: string
  place_formatted?: string
  name?: string
  name_preferred?: string
  context?: unknown
}

type UnknownRecord = Record<string, unknown>

export interface SuggestLocationsParams {
  query: string
  accessToken: string
  sessionToken: string
  signal?: AbortSignal
  limit?: number
  language?: string
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null
}

function toContextEntry(context: unknown, key: string): UnknownRecord | null {
  if (!isRecord(context)) {
    return null
  }

  const entry = context[key]

  if (Array.isArray(entry)) {
    const firstObjectEntry = entry.find((item) => isRecord(item))
    return firstObjectEntry ?? null
  }

  return isRecord(entry) ? entry : null
}

function toContextName(context: unknown, key: string): string {
  const entry = toContextEntry(context, key)
  if (!entry) {
    return ''
  }

  const rawName = entry.name
  return typeof rawName === 'string' ? rawName.trim() : ''
}

function toCountry(context: unknown): string {
  const countryEntry = toContextEntry(context, 'country')
  if (!countryEntry) {
    return ''
  }

  const rawCountryCode = countryEntry.country_code
  if (typeof rawCountryCode === 'string' && rawCountryCode.trim()) {
    return rawCountryCode.trim().toUpperCase()
  }

  const rawCountryName = countryEntry.name
  return typeof rawCountryName === 'string' ? rawCountryName.trim() : ''
}

function toLabel(suggestion: MapboxSuggestItem): string {
  const primary =
    suggestion.name_preferred ??
    suggestion.name ??
    suggestion.full_address ??
    suggestion.place_formatted ??
    suggestion.mapbox_id ??
    suggestion.id ??
    ''

  const secondary = suggestion.place_formatted ?? suggestion.full_address ?? ''

  if (!primary) {
    return ''
  }

  if (!secondary || secondary === primary) {
    return primary
  }

  return `${primary}, ${secondary}`
}

function toFormattedLocation(suggestion: MapboxSuggestItem, fallbackLabel: string): string {
  const name = (suggestion.name_preferred ?? suggestion.name ?? '').trim()
  const locality = toContextName(suggestion.context, 'locality')
  const place = toContextName(suggestion.context, 'place')
  const postcode = toContextName(suggestion.context, 'postcode')
  const country = toCountry(suggestion.context)

  const parts = [name, locality, place, postcode, country]
  const formattedParts: string[] = []

  for (const part of parts) {
    const normalizedPart = part.trim()

    if (!normalizedPart || formattedParts.includes(normalizedPart)) {
      continue
    }

    formattedParts.push(normalizedPart)
  }

  if (formattedParts.length === 0) {
    return fallbackLabel
  }

  return formattedParts.join(', ')
}

export async function suggestLocations({
  query,
  accessToken,
  sessionToken,
  signal,
  limit = 8,
  language,
}: SuggestLocationsParams): Promise<LocationSuggestion[]> {
  const params = new URLSearchParams({
    q: query,
    access_token: accessToken,
    session_token: sessionToken,
    types: MAPBOX_TYPES,
    limit: String(limit),
  })

  if (language) {
    params.set('language', language)
  }

  const response = await fetch(`${MAPBOX_SUGGEST_ENDPOINT}?${params.toString()}`, {
    signal,
  })

  if (!response.ok) {
    throw new Error(`Mapbox suggest failed with HTTP ${response.status}`)
  }

  const data = (await response.json()) as MapboxSuggestResponse
  const suggestions = data.suggestions ?? []
  const mappedSuggestions: Array<LocationSuggestion | null> = suggestions.map((suggestion, index) => {
    const label = toLabel(suggestion).trim()

    if (!label) {
      return null
    }

    const formattedLocation = toFormattedLocation(suggestion, label)

    const mapboxId = suggestion.mapbox_id ?? suggestion.id
    const id = mapboxId ?? `${label}-${index}`

    return {
      id,
      label,
      formattedLocation,
      source: 'mapbox',
      mapboxId,
      sessionToken,
    }
  })

  return mappedSuggestions.filter((suggestion): suggestion is LocationSuggestion => suggestion !== null)
}
