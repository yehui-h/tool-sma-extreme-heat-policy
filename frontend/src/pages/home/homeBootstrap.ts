import type { SportType } from "@/domain/sport";
import type { PersistedHomeFilters } from "@/pages/home/browserState";
import type { HomeChannel } from "@/store/homeStore";

export interface HomeBootstrapState {
  channel: HomeChannel;
  sport: SportType;
  locationInput: string;
}

interface ResolveHomeBootstrapStateParams {
  hasUrlState: boolean;
  defaultSport: SportType;
  urlSport: SportType | null;
  urlLocation: string | null;
  persistedFilters: PersistedHomeFilters | null;
}

/**
 * Trims and normalizes initial location text from URL/storage.
 */
export function resolveInitialLocationLabel(
  label: string | null | undefined,
): string {
  return label?.trim() ?? "";
}

/**
 * Resolves Home bootstrap source priority between URL state and local storage.
 */
export function resolveHomeBootstrapState({
  hasUrlState,
  defaultSport,
  urlSport,
  urlLocation,
  persistedFilters,
}: ResolveHomeBootstrapStateParams): HomeBootstrapState {
  const channel: HomeChannel = hasUrlState ? "shared" : "direct";

  let sport = defaultSport;
  let locationInput = "";

  if (channel === "shared") {
    if (urlSport) {
      sport = urlSport;
    }

    locationInput = resolveInitialLocationLabel(urlLocation);
  } else if (persistedFilters) {
    sport = persistedFilters.sport;
    locationInput = resolveInitialLocationLabel(persistedFilters.loc);
  }

  return {
    channel,
    sport,
    locationInput,
  };
}
