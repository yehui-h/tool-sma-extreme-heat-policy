import type { HeatRisk } from "@/domain/risk";
import type { SportType } from "@/domain/sport";
import { heatRiskFixture } from "@/api/heatRisk.fixture";
import { endpoints } from "@/api/endpoints";
import { httpClient } from "@/api/httpClient";
import { toCoordinatesOrNull } from "@/lib/coordinates";

interface UnknownRecord {
  [key: string]: unknown;
}

export interface HeatRiskRequest {
  sport: SportType;
  latitude: number;
  longitude: number;
}

interface HeatRiskApiRequestDto {
  sport: SportType;
  latitude: number;
  longitude: number;
}

export interface HeatRiskApiData {
  risk_level_interpolated: number;
  t_medium: number;
  t_high: number;
  t_extreme: number;
  recommendation: string;
}

interface HeatRiskApiResponseDto {
  heat_risk: HeatRiskApiData;
  meta_data: UnknownRecord;
}

export interface HeatRiskApiResponse {
  heatRisk: HeatRiskApiData;
  metaData: UnknownRecord;
}

export interface HeatRiskMeta {
  latitude?: number;
  longitude?: number;
}

export type HeatRiskErrorReason =
  | "missing_api_base_url"
  | "invalid_response"
  | "network_error";

export type HeatRiskResult =
  | {
      ok: true;
      data: HeatRisk;
      meta: HeatRiskMeta;
    }
  | {
      ok: false;
      reason: HeatRiskErrorReason;
    };

function resolveHeatRiskDataSource(): "api" | "mock" {
  const rawSource = String(import.meta.env.VITE_HOME_DATA_SOURCE ?? "api")
    .trim()
    .toLowerCase();
  return rawSource === "mock" ? "mock" : "api";
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isHeatRiskApiData(value: unknown): value is HeatRiskApiData {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isFiniteNumber(value.risk_level_interpolated) &&
    isFiniteNumber(value.t_medium) &&
    isFiniteNumber(value.t_high) &&
    isFiniteNumber(value.t_extreme) &&
    typeof value.recommendation === "string"
  );
}

/**
 * Validates the backend heat-risk response payload shape at runtime.
 */
export function isHeatRiskApiResponse(
  value: unknown,
): value is HeatRiskApiResponseDto {
  if (!isRecord(value)) {
    return false;
  }

  if (!isHeatRiskApiData(value.heat_risk)) {
    return false;
  }

  return isRecord(value.meta_data);
}

function toHeatRiskRequestDto(payload: HeatRiskRequest): HeatRiskApiRequestDto {
  return {
    sport: payload.sport,
    latitude: payload.latitude,
    longitude: payload.longitude,
  };
}

function toHeatRiskApiResponse(
  dto: HeatRiskApiResponseDto,
): HeatRiskApiResponse {
  return {
    heatRisk: dto.heat_risk,
    metaData: dto.meta_data,
  };
}

function toHeatRisk(api: HeatRiskApiData): HeatRisk {
  return {
    riskLevelInterpolated: api.risk_level_interpolated,
    mediumThreshold: api.t_medium,
    highThreshold: api.t_high,
    extremeThreshold: api.t_extreme,
    recommendation: api.recommendation,
  };
}

function toLocationCoordinates(meta: UnknownRecord): HeatRiskMeta {
  const location = meta.location;
  if (!isRecord(location)) {
    return {};
  }

  const coordinates = toCoordinatesOrNull({
    latitude: location.latitude,
    longitude: location.longitude,
  });

  if (!coordinates) {
    return {};
  }

  return {
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
  };
}

function toHeatRiskMeta(meta: UnknownRecord): HeatRiskMeta {
  return toLocationCoordinates(meta);
}

/**
 * Fetches heat risk results from the backend or returns fixtures in mock mode.
 *
 * Time contract: any future request/response datetime fields must be ISO-8601 UTC.
 * Current payload intentionally contains no datetime field.
 */
export async function fetchHeatRisk(
  payload: HeatRiskRequest,
  options?: { signal?: AbortSignal },
): Promise<HeatRiskResult> {
  if (resolveHeatRiskDataSource() === "mock") {
    return {
      ok: true,
      data: heatRiskFixture,
      meta: {},
    };
  }

  if (!import.meta.env.VITE_API_BASE_URL) {
    return {
      ok: false,
      reason: "missing_api_base_url",
    };
  }

  try {
    const requestDto = toHeatRiskRequestDto(payload);
    const response = await httpClient<unknown>(endpoints.heatRisk, {
      method: "POST",
      body: JSON.stringify(requestDto),
      signal: options?.signal,
    });

    if (!isHeatRiskApiResponse(response)) {
      return {
        ok: false,
        reason: "invalid_response",
      };
    }

    const mappedResponse = toHeatRiskApiResponse(response);

    return {
      ok: true,
      data: toHeatRisk(mappedResponse.heatRisk),
      meta: toHeatRiskMeta(mappedResponse.metaData),
    };
  } catch {
    return {
      ok: false,
      reason: "network_error",
    };
  }
}
