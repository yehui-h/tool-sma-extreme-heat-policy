import { create } from "zustand";
import type { LocationSuggestion } from "@/domain/location";
import type { ForecastDay } from "@/domain/risk";
import { DEFAULT_SPORT_TYPE, type SportType } from "@/domain/sport";

export type HomeChannel = "shared" | "direct";

interface HomeStoreState {
  channel: HomeChannel;
  sport: SportType;
  locationInput: string;
  selectedLocation: LocationSuggestion | null;
  shouldAutoResolvePrefilledLocation: boolean;
  hasPrefilledLocationNotMatched: boolean;
  locationSessionToken: string;
  forecast: ForecastDay[];

  bootstrap: (payload: {
    channel: HomeChannel;
    sport: SportType;
    locationInput: string;
    shouldAutoResolvePrefilledLocation: boolean;
  }) => void;
  setSport: (sport: SportType) => void;
  setLocationInput: (value: string) => void;
  selectLocation: (suggestion: LocationSuggestion) => void;
  consumeAutoResolvePrefilledLocation: () => void;
  setHasPrefilledLocationNotMatched: (value: boolean) => void;
  setForecast: (forecast: ForecastDay[]) => void;
}

function createSessionToken(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * Central Home store for filters and applied selection.
 */
export const useHomeStore = create<HomeStoreState>((set) => ({
  channel: "direct",
  sport: DEFAULT_SPORT_TYPE,
  locationInput: "",
  selectedLocation: null,
  shouldAutoResolvePrefilledLocation: false,
  hasPrefilledLocationNotMatched: false,
  locationSessionToken: createSessionToken(),
  forecast: [],

  bootstrap: ({
    channel,
    sport,
    locationInput,
    shouldAutoResolvePrefilledLocation,
  }) =>
    set({
      channel,
      sport,
      locationInput,
      selectedLocation: null,
      shouldAutoResolvePrefilledLocation,
      hasPrefilledLocationNotMatched: false,
      locationSessionToken: createSessionToken(),
    }),
  setSport: (sport) => set({ sport }),
  setLocationInput: (value) =>
    set((state) => {
      const selectedLocationValue =
        state.selectedLocation?.formattedLocation ?? "";
      if (state.selectedLocation && value !== selectedLocationValue) {
        return {
          locationInput: value,
          selectedLocation: null,
          shouldAutoResolvePrefilledLocation: false,
          hasPrefilledLocationNotMatched: false,
          locationSessionToken: createSessionToken(),
        };
      }

      return {
        locationInput: value,
        shouldAutoResolvePrefilledLocation: false,
        hasPrefilledLocationNotMatched: false,
      };
    }),
  selectLocation: (suggestion) =>
    set({
      selectedLocation: suggestion,
      locationInput: suggestion.formattedLocation,
      shouldAutoResolvePrefilledLocation: false,
      hasPrefilledLocationNotMatched: false,
    }),
  consumeAutoResolvePrefilledLocation: () =>
    set({ shouldAutoResolvePrefilledLocation: false }),
  setHasPrefilledLocationNotMatched: (value) =>
    set({ hasPrefilledLocationNotMatched: value }),
  setForecast: (forecast) => set({ forecast }),
}));
