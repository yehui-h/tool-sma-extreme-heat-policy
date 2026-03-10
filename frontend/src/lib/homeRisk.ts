import type {
  ForecastApiPoint,
  HeatRiskApiData,
  HeatRiskApiMeta,
} from "@/api/heatRisk";
import type { ForecastDay, HeatRisk } from "@/domain/risk";
import { toRiskLevel } from "@/domain/risk";
import { toCoordinatesOrNull } from "@/lib/coordinates";

export interface HeatRiskMeta {
  latitude?: number;
  longitude?: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Maps raw heat-risk API data into the frontend domain model.
 */
export function toHeatRisk(api: HeatRiskApiData): HeatRisk {
  return {
    riskLevelInterpolated: api.risk_level_interpolated,
    mediumThreshold: api.t_medium,
    highThreshold: api.t_high,
    extremeThreshold: api.t_extreme,
    recommendation: api.recommendation,
  };
}

/**
 * Extracts optional location coordinates from the API metadata payload.
 */
export function toHeatRiskMeta(meta: HeatRiskApiMeta): HeatRiskMeta {
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

function getBrowserTimeZone(): string | undefined {
  if (typeof Intl === "undefined") {
    return undefined;
  }

  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function formatDateParts(
  date: Date,
  timeZone?: string,
): Record<"year" | "month" | "day" | "hour" | "minute", string> {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  });
  const parts = formatter.formatToParts(date);

  return {
    year: parts.find((part) => part.type === "year")?.value ?? "",
    month: parts.find((part) => part.type === "month")?.value ?? "",
    day: parts.find((part) => part.type === "day")?.value ?? "",
    hour: parts.find((part) => part.type === "hour")?.value ?? "",
    minute: parts.find((part) => part.type === "minute")?.value ?? "",
  };
}

/**
 * Groups UTC forecast points into browser-local daily chart data for the UI.
 */
export function toForecastDays(points: ForecastApiPoint[]): ForecastDay[] {
  if (points.length === 0) {
    return [];
  }

  const timeZone = getBrowserTimeZone();
  const groupedDays = new Map<
    string,
    {
      date: string;
      maxRisk: number;
      points: ForecastDay["points"];
    }
  >();

  for (const point of points) {
    const parsedDate = new Date(point.time_utc);

    if (Number.isNaN(parsedDate.getTime())) {
      continue;
    }

    const dateParts = formatDateParts(parsedDate, timeZone);
    const dateKey = `${dateParts.year}-${dateParts.month}-${dateParts.day}`;
    const timeLabel = `${dateParts.hour}:${dateParts.minute}`;
    const existingDay = groupedDays.get(dateKey);

    if (!existingDay) {
      groupedDays.set(dateKey, {
        date: point.time_utc,
        maxRisk: point.risk_level_interpolated,
        points: [
          {
            time: timeLabel,
            value: point.risk_level_interpolated,
          },
        ],
      });
      continue;
    }

    existingDay.maxRisk = Math.max(
      existingDay.maxRisk,
      point.risk_level_interpolated,
    );
    existingDay.points.push({
      time: timeLabel,
      value: point.risk_level_interpolated,
    });
  }

  return Array.from(groupedDays.values())
    .slice(0, 7)
    .map((day) => ({
      date: day.date,
      risk: toRiskLevel(day.maxRisk),
      points: day.points,
    }));
}
