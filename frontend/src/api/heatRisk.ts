import type { SportType } from "@/domain/sport";
import { endpoints } from "@/api/endpoints";
import { httpClient } from "@/api/httpClient";

export type HeatRiskApiMeta = Record<string, unknown>;

export interface HeatRiskRequest {
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

export interface ForecastApiPoint {
  time_utc: string;
  risk_level_interpolated: number;
}

export interface HeatRiskApiResponse {
  heat_risk: HeatRiskApiData;
  meta_data: HeatRiskApiMeta;
  forecast: ForecastApiPoint[];
}

export type HeatRiskErrorReason =
  | "missing_api_base_url"
  | "invalid_response"
  | "network_error";

export type HeatRiskApiResult =
  | {
      ok: true;
      data: HeatRiskApiResponse;
    }
  | {
      ok: false;
      reason: HeatRiskErrorReason;
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isValidIsoDateTime(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    !Number.isNaN(Date.parse(value))
  );
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

function isForecastApiPoint(value: unknown): value is ForecastApiPoint {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isValidIsoDateTime(value.time_utc) &&
    isFiniteNumber(value.risk_level_interpolated)
  );
}

/**
 * Validates the backend heat-risk response payload shape at runtime.
 */
export function isHeatRiskApiResponse(
  value: unknown,
): value is HeatRiskApiResponse {
  if (!isRecord(value)) {
    return false;
  }

  if (!isHeatRiskApiData(value.heat_risk)) {
    return false;
  }

  if (!isRecord(value.meta_data)) {
    return false;
  }

  return (
    Array.isArray(value.forecast) && value.forecast.every(isForecastApiPoint)
  );
}

/**
 * Fetches and validates the raw backend heat-risk response payload.
 */
export async function fetchHeatRisk(
  payload: HeatRiskRequest,
  options?: { signal?: AbortSignal },
): Promise<HeatRiskApiResult> {
  if (!import.meta.env.VITE_API_BASE_URL) {
    return {
      ok: false,
      reason: "missing_api_base_url",
    };
  }

  try {
    const response = await httpClient<unknown>(endpoints.heatRisk, {
      method: "POST",
      body: JSON.stringify(payload),
      signal: options?.signal,
    });
    const isValidResponse = isHeatRiskApiResponse(response);

    if (!isValidResponse) {
      return {
        ok: false,
        reason: "invalid_response",
      };
    }

    return {
      ok: true,
      data: response,
    };
  } catch {
    return {
      ok: false,
      reason: "network_error",
    };
  }
}
