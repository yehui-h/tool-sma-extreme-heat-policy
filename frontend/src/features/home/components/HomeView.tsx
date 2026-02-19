import { Stack } from "@mantine/core";
import { useQueryStates } from "nuqs";
import { useOptimisticSearchParams } from "nuqs/adapters/react-router/v7";
import { useMemo, useState } from "react";
import { CurrentRiskSection } from "@/features/home/components/CurrentRiskSection";
import { DetailedRecommendationsSection } from "@/features/home/components/DetailedRecommendationsSection";
import { FiltersSection } from "@/features/home/components/FiltersSection";
import { ForecastSection } from "@/features/home/components/ForecastSection";
import { KeyRecommendationsSection } from "@/features/home/components/KeyRecommendationsSection";
import { MapPlaceholderSection } from "@/features/home/components/MapPlaceholderSection";
import {
  DEFAULT_SPORT_TYPE,
  SPORT_OPTIONS,
} from "@/features/home/data/sportCatalog";
import { toRiskLevel } from "@/features/home/domain/homeRisk";
import type { SportType } from "@/features/home/domain/sportType";
import { useLocationSuggest } from "@/features/home/hooks/useLocationSuggest";
import { useRiskCalculation } from "@/features/home/hooks/useRiskCalculation";
import { loadPersistedHomeFilters } from "@/features/home/lib/browserState";
import {
  type HomeBootstrapState,
  resolveHomeBootstrapState,
} from "@/features/home/lib/homeBootstrap";
import {
  HOME_QUERY_PARSERS,
  HOME_QUERY_URL_KEYS,
  VALID_SPORT_VALUES,
} from "@/features/home/lib/homeUrlState";

const MAPBOX_METADATA_REQUIRED_NOTICE =
  "Selected location is missing required mapbox metadata. Please select a suggestion again.";

export function HomeView() {
  // todo the sport should be saved in the central zutstand store
  const defaultSport = DEFAULT_SPORT_TYPE;
  const mapboxAccessToken = (
    import.meta.env.VITE_MAPBOX_ACCESS_TOKEN ?? ""
  ).trim();
  const hasMapboxToken = mapboxAccessToken.length > 0;
  const optimisticSearchParams = useOptimisticSearchParams();
  const [{ sport: urlSport, location: urlLocation }, setQueryStates] =
    useQueryStates(HOME_QUERY_PARSERS, {
      urlKeys: HOME_QUERY_URL_KEYS,
    });
  const bootstrapState = useMemo<HomeBootstrapState>(() => {
    const hasUrlState =
      optimisticSearchParams.has("sport") || optimisticSearchParams.has("loc");
    const persistedFilters = hasUrlState
      ? null
      : loadPersistedHomeFilters(VALID_SPORT_VALUES);

    return resolveHomeBootstrapState({
      hasUrlState,
      defaultSport,
      urlSport,
      urlLocation,
      persistedFilters,
    });
  }, [defaultSport, optimisticSearchParams, urlSport, urlLocation]);
  const isSharedChannel = bootstrapState.channel === "shared";
  const [draftSport, setDraftSport] = useState<SportType>(bootstrapState.sport);
  const {
    draftLocationInput,
    draftSelectedLocation,
    suggestionLabels,
    isSuggestLoading,
    suggestError,
    onLocationInputChange,
    onLocationOptionSubmit,
  } = useLocationSuggest({
    initialLocationInput: bootstrapState.locationInput,
    mapboxAccessToken,
    hasMapboxToken,
  });
  const {
    risk,
    appliedLocation,
    retrievePayload,
    isCalculating,
    calculateError,
    handleCalculateRisk,
  } = useRiskCalculation({
    draftSport,
    draftSelectedLocation,
    isSharedChannel,
    setQueryStates,
  });

  const handleSportChange = (value: SportType | null) => {
    if (value) {
      setDraftSport(value);
    }
  };

  const hasSelectedLocationMeta = Boolean(
    draftSelectedLocation?.mapboxId && draftSelectedLocation?.sessionToken,
  );
  const locationMetadataError =
    draftSelectedLocation && !hasSelectedLocationMeta
      ? MAPBOX_METADATA_REQUIRED_NOTICE
      : null;

  const isCalculateDisabled =
    !hasMapboxToken ||
    !draftSelectedLocation ||
    !hasSelectedLocationMeta ||
    isCalculating;
  const appliedLocationLabel = appliedLocation?.label ?? "Select a location";
  const riskLevel = toRiskLevel(risk.riskLevelInterpolated);
  const nextCalculateError = locationMetadataError ?? calculateError;

  return (
    <Stack gap="md">
      <FiltersSection
        sport={draftSport}
        locationInput={draftLocationInput}
        sportOptions={SPORT_OPTIONS}
        suggestions={suggestionLabels}
        isSuggestLoading={isSuggestLoading}
        suggestError={suggestError}
        calculateError={nextCalculateError}
        isCalculateDisabled={isCalculateDisabled}
        isCalculating={isCalculating}
        onSportChange={handleSportChange}
        onLocationInputChange={onLocationInputChange}
        onLocationOptionSubmit={onLocationOptionSubmit}
        onCalculateRisk={() => {
          void handleCalculateRisk();
        }}
      />
      <CurrentRiskSection risk={risk} />
      <KeyRecommendationsSection riskLevel={riskLevel} />
      <DetailedRecommendationsSection riskLevel={riskLevel} />
      <ForecastSection />
      <MapPlaceholderSection
        locationLabel={appliedLocationLabel}
        latitude={appliedLocation?.latitude}
        longitude={appliedLocation?.longitude}
        mapboxId={retrievePayload?.mapboxId}
        sessionToken={retrievePayload?.sessionToken}
      />
    </Stack>
  );
}
