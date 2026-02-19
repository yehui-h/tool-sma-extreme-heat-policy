import type { HomeRisk, RiskLevel } from "@/features/home/domain/homeRisk";
import type { SportType } from "@/features/home/domain/sportType";

export type { RiskLevel } from "@/features/home/domain/homeRisk";

export type LocationSource = "mapbox";

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
}

export interface LocationSuggestion {
  id: string;
  label: string;
  formattedLocation: string;
  source: LocationSource;
  mapboxId?: string;
  latitude?: number;
  longitude?: number;
  countryCode?: string;
  region?: string;
  sessionToken?: string;
}

export interface AppliedLocation {
  id: string;
  label: string;
  source: LocationSource;
  mapboxId?: string;
  latitude?: number;
  longitude?: number;
  sessionToken?: string;
}

export interface LocationRetrievePayload {
  mapboxId: string;
  sessionToken: string;
}

export type CurrentRiskData = HomeRisk;

export interface RecommendationItem {
  icon: string;
  label: string;
}

export interface ForecastPoint {
  time: string;
  value: number;
}

export interface ForecastDay {
  day: string;
  date: string;
  risk: RiskLevel;
  points: ForecastPoint[];
}

export interface HomeRiskRequest {
  sport: SportType;
  locationMeta: {
    source: LocationSource;
    mapboxId: string;
    sessionToken: string;
  };
}
