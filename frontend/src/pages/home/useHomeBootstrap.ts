import { useQueryStates } from "nuqs";
import { useOptimisticSearchParams } from "nuqs/adapters/react-router/v7";
import { useEffect, useMemo, useRef } from "react";
import { DEFAULT_SPORT_TYPE, type SportType } from "@/domain/sport";
import { loadPersistedHomeFilters } from "@/pages/home/browserState";
import {
  resolveHomeBootstrapState,
  type HomeBootstrapState,
} from "@/pages/home/homeBootstrap";
import {
  HOME_QUERY_PARSERS,
  HOME_QUERY_URL_KEYS,
  VALID_SPORT_VALUES,
} from "@/pages/home/homeUrlState";
import { useHomeStore } from "@/store/homeStore";

interface SetQueryStateValues {
  sport: SportType | null;
  location: string | null;
}

export type SetQueryStates = (
  values: SetQueryStateValues,
  options?: { history?: "replace" | "push" },
) => Promise<URLSearchParams>;

interface UseHomeBootstrapResult {
  bootstrapState: HomeBootstrapState;
  setQueryStates: SetQueryStates;
}

/**
 * Boots Home store state from URL/local persistence and exposes query setters.
 */
export function useHomeBootstrap(): UseHomeBootstrapResult {
  const optimisticSearchParams = useOptimisticSearchParams();
  const [{ sport: urlSport, location: urlLocation }, setQueryStates] =
    useQueryStates(HOME_QUERY_PARSERS, {
      urlKeys: HOME_QUERY_URL_KEYS,
    });
  const hasBootstrappedRef = useRef(false);

  const hasUrlState =
    optimisticSearchParams.has("sport") || optimisticSearchParams.has("loc");
  const persistedFilters = useMemo(
    () => (hasUrlState ? null : loadPersistedHomeFilters(VALID_SPORT_VALUES)),
    [hasUrlState],
  );

  const bootstrapState = useMemo<HomeBootstrapState>(
    () =>
      resolveHomeBootstrapState({
        hasUrlState,
        defaultSport: DEFAULT_SPORT_TYPE,
        urlSport,
        urlLocation,
        persistedFilters,
      }),
    [hasUrlState, persistedFilters, urlLocation, urlSport],
  );

  useEffect(() => {
    if (hasBootstrappedRef.current) {
      return;
    }

    useHomeStore.getState().bootstrap({
      channel: bootstrapState.channel,
      sport: bootstrapState.sport,
      locationInput: bootstrapState.locationInput,
    });

    hasBootstrappedRef.current = true;
  }, [
    bootstrapState.channel,
    bootstrapState.locationInput,
    bootstrapState.sport,
  ]);

  return {
    bootstrapState,
    setQueryStates,
  };
}
