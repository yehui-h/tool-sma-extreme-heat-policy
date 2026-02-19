import { useMemo, useRef, useState } from "react";
import {
  getHomeRisk,
  type HomeRiskErrorReason,
} from "@/features/home/api/getHomeRisk";
import { homeRiskFixture } from "@/features/home/fixtures/homeRiskFixture";
import type { SportType } from "@/features/home/domain/sportType";
import { savePersistedHomeFilters } from "@/features/home/lib/browserState";
import type {
  AppliedLocation,
  HomeRiskRequest,
  LocationRetrievePayload,
  LocationSuggestion,
  CurrentRiskData,
} from "@/features/home/types";

interface SetQueryStateValues {
  sport: SportType | null;
  location: string | null;
}

type SetQueryStates = (
  values: SetQueryStateValues,
  options?: { history?: "replace" | "push" },
) => Promise<URLSearchParams>;

interface UseRiskCalculationParams {
  draftSport: SportType;
  draftSelectedLocation: LocationSuggestion | null;
  isSharedChannel: boolean;
  setQueryStates: SetQueryStates;
}

interface UseRiskCalculationResult {
  risk: CurrentRiskData;
  appliedLocation: AppliedLocation | null;
  retrievePayload: LocationRetrievePayload | null;
  isCalculating: boolean;
  calculateError: string | null;
  handleCalculateRisk: () => Promise<void>;
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
  };
}

function toRetrievePayload(
  location: AppliedLocation,
): LocationRetrievePayload | null {
  if (!location.mapboxId || !location.sessionToken) {
    return null;
  }

  return {
    mapboxId: location.mapboxId,
    sessionToken: location.sessionToken,
  };
}

function toRequestLocationMeta(
  location: AppliedLocation,
): HomeRiskRequest["locationMeta"] | null {
  if (!location.mapboxId || !location.sessionToken) {
    return null;
  }

  return {
    source: location.source,
    mapboxId: location.mapboxId,
    sessionToken: location.sessionToken,
  };
}

function toCalculateErrorMessage(reason: HomeRiskErrorReason): string {
  if (reason === "missing_api_base_url") {
    return "Risk API is not configured. Set VITE_API_BASE_URL or use VITE_HOME_DATA_SOURCE=mock.";
  }

  if (reason === "invalid_response") {
    return "Risk API returned an invalid response. Please try again.";
  }

  return "Risk calculation is temporarily unavailable. Please try again.";
}

export function useRiskCalculation({
  draftSport,
  draftSelectedLocation,
  isSharedChannel,
  setQueryStates,
}: UseRiskCalculationParams): UseRiskCalculationResult {
  const [appliedLocation, setAppliedLocation] =
    useState<AppliedLocation | null>(null);
  const [risk, setRisk] = useState(homeRiskFixture);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculateError, setCalculateError] = useState<string | null>(null);
  const lastAppliedRef = useRef<{ sport: SportType; loc: string } | null>(null);

  const retrievePayload = useMemo(
    () => (appliedLocation ? toRetrievePayload(appliedLocation) : null),
    [appliedLocation],
  );

  const handleCalculateRisk = async () => {
    if (!draftSelectedLocation) {
      return;
    }

    const nextAppliedLocation = toAppliedLocation(draftSelectedLocation);
    const locationMeta = toRequestLocationMeta(nextAppliedLocation);

    setAppliedLocation(nextAppliedLocation);

    if (!locationMeta) {
      setCalculateError(
        "Selected location is missing required mapbox metadata. Please select a suggestion again.",
      );
      return;
    }

    setCalculateError(null);
    setIsCalculating(true);

    const payload: HomeRiskRequest = {
      sport: draftSport,
      locationMeta,
    };

    try {
      const nextRiskResult = await getHomeRisk(payload);

      if (!nextRiskResult.ok) {
        setCalculateError(toCalculateErrorMessage(nextRiskResult.reason));
        return;
      }

      setRisk(nextRiskResult.data);

      const nextSelection = {
        sport: draftSport,
        loc: nextAppliedLocation.label,
      };

      const hasSelectionChanged =
        !lastAppliedRef.current ||
        lastAppliedRef.current.sport !== nextSelection.sport ||
        lastAppliedRef.current.loc !== nextSelection.loc;

      if (hasSelectionChanged) {
        await setQueryStates(
          {
            sport: nextSelection.sport,
            location: nextSelection.loc,
          },
          { history: "replace" },
        );

        if (!isSharedChannel) {
          savePersistedHomeFilters(nextSelection);
        }

        lastAppliedRef.current = nextSelection;
      }
    } finally {
      setIsCalculating(false);
    }
  };

  return {
    risk,
    appliedLocation,
    retrievePayload,
    isCalculating,
    calculateError,
    handleCalculateRisk,
  };
}
