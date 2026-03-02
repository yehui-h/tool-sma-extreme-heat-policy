import type { SportType } from "@/domain/sport";
import type { PersistedHomeFilters } from "@/pages/home/browserState";
import type { HomeChannel, LocationPrefillSource } from "@/store/homeStore";

export interface HomeBootstrapState {
  channel: HomeChannel;
  sport: SportType;
  locationInput: string;
  locationPrefillSource: LocationPrefillSource;
  shouldAutoResolvePrefilledLocation: boolean;
}

interface ResolveHomeBootstrapStateParams {
  hasUrlState: boolean;
  defaultSport: SportType;
  defaultLocationLabel: string;
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
  defaultLocationLabel,
  urlSport,
  urlLocation,
  persistedFilters,
}: ResolveHomeBootstrapStateParams): HomeBootstrapState {
  const channel: HomeChannel = hasUrlState ? "shared" : "direct";

  let sport = defaultSport;
  let locationInput = "";
  let locationPrefillSource: LocationPrefillSource = "none";

  if (channel === "shared") {
    if (urlSport) {
      sport = urlSport;
    }

    locationInput = resolveInitialLocationLabel(urlLocation);
    if (locationInput.length > 0) {
      locationPrefillSource = "url";
    }
  } else if (persistedFilters) {
    sport = persistedFilters.sport;
    locationInput = resolveInitialLocationLabel(persistedFilters.loc);
    if (locationInput.length > 0) {
      locationPrefillSource = "persisted";
    }
  } else {
    locationInput = resolveInitialLocationLabel(defaultLocationLabel);
    if (locationInput.length > 0) {
      locationPrefillSource = "default";
    }
  }

  const shouldAutoResolvePrefilledLocation = locationInput.length > 0;

  return {
    channel,
    sport,
    locationInput,
    locationPrefillSource,
    shouldAutoResolvePrefilledLocation,
  };
}
