import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useDebouncedValue } from "@mantine/hooks";
import {
  fetchHeatRisk,
  type HeatRiskErrorReason,
  type HeatRiskMeta,
} from "@/api/heatRisk";
import { heatRiskFixture } from "@/api/heatRisk.fixture";
import type { HomeCalculationErrorReason } from "@/domain/homeErrorMap";
import type { HeatRisk, RiskLevel } from "@/domain/risk";
import { toRiskLevel } from "@/domain/risk";
import { toCoordinatesOrNull } from "@/lib/coordinates";
import { useHomeStore } from "@/store/homeStore";

export type HeatRiskCalculationErrorReason = HomeCalculationErrorReason;

class HeatRiskQueryError extends Error {
  reason: HeatRiskErrorReason;

  constructor(reason: HeatRiskErrorReason) {
    super(reason);
    this.reason = reason;
    this.name = "HeatRiskQueryError";
  }
}

interface UseHomeHeatRiskResult {
  risk: HeatRisk;
  riskLevel: RiskLevel;
  meta: HeatRiskMeta;
  isFetching: boolean;
  errorReason: HeatRiskCalculationErrorReason | null;
  canSyncSelection: boolean;
}

/**
 * Auto-fetches heat risk for the selected Home sport + location.
 *
 * Keeps the last successful risk visible on API errors.
 */
export function useHomeHeatRisk(): UseHomeHeatRiskResult {
  const sport = useHomeStore((state) => state.sport);
  const selectedLocation = useHomeStore((state) => state.selectedLocation);
  const [debouncedSport] = useDebouncedValue(sport, 250);

  const locationCoordinates = toCoordinatesOrNull({
    latitude: selectedLocation?.latitude,
    longitude: selectedLocation?.longitude,
  });

  const riskQuery = useQuery({
    queryKey: [
      "heatRisk",
      debouncedSport,
      locationCoordinates?.latitude.toFixed(6) ?? "",
      locationCoordinates?.longitude.toFixed(6) ?? "",
    ],
    queryFn: async ({ signal }) => {
      const result = await fetchHeatRisk(
        {
          sport: debouncedSport,
          latitude: locationCoordinates!.latitude,
          longitude: locationCoordinates!.longitude,
        },
        { signal },
      );

      if (!result.ok) {
        throw new HeatRiskQueryError(result.reason);
      }

      return result;
    },
    enabled: Boolean(locationCoordinates),
    placeholderData: keepPreviousData,
    retry: false,
  });

  const errorReason: HeatRiskCalculationErrorReason | null =
    selectedLocation && !locationCoordinates
      ? "missing_location_coordinates"
      : riskQuery.error instanceof HeatRiskQueryError
        ? riskQuery.error.reason
        : null;

  const risk = riskQuery.data?.data ?? heatRiskFixture;
  const riskLevel = toRiskLevel(risk.riskLevelInterpolated);
  const meta = riskQuery.data?.meta ?? {};
  const canSyncSelection = Boolean(
    selectedLocation &&
    locationCoordinates &&
    riskQuery.data &&
    !riskQuery.isPlaceholderData &&
    sport === debouncedSport,
  );

  return {
    risk,
    riskLevel,
    meta,
    isFetching: riskQuery.isFetching,
    errorReason,
    canSyncSelection,
  };
}
