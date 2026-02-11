export type RiskLevel = 'low' | 'moderate' | 'high' | 'extreme'

export type LocationSource = 'mapbox'

export interface SelectOption {
  value: string
  label: string
}

export interface LocationSuggestion {
  id: string
  label: string
  formattedLocation: string
  source: LocationSource
  mapboxId?: string
  latitude?: number
  longitude?: number
  countryCode?: string
  region?: string
  sessionToken?: string
}

export interface AppliedLocation {
  id: string
  label: string
  source: LocationSource
  mapboxId?: string
  latitude?: number
  longitude?: number
  sessionToken?: string
}

export interface LocationRetrievePayload {
  mapboxId: string
  sessionToken: string
  label: string
}

export interface CurrentRiskData {
  title: string
  score: number
  level: RiskLevel
  shortSummary: string
}

export interface RecommendationItem {
  icon: string
  label: string
}

export interface ForecastPoint {
  time: string
  value: number
}

export interface ForecastDay {
  day: string
  date: string
  risk: RiskLevel
  points: ForecastPoint[]
}

export interface HomeRiskRequest {
  sport: string
  locationLabel: string
  locationMeta: {
    source: LocationSource
    mapboxId?: string
    latitude?: number
    longitude?: number
    sessionToken?: string
  }
}
