import { create } from "zustand";
import type { LocationSuggestion } from "@/domain/location";
import { DEFAULT_SPORT_TYPE, type SportType } from "@/domain/sport";

export type HomeChannel = "shared" | "direct";
export type LocationPrefillSource = "url" | "persisted" | "default" | "none";

interface HomeStoreState {
  isBootstrapped: boolean;
  channel: HomeChannel;
  sport: SportType;
  locationInput: string;
  locationPrefillSource: LocationPrefillSource;
  selectedLocation: LocationSuggestion | null;
  shouldAutoResolvePrefilledLocation: boolean;
  hasPrefilledLocationNotMatched: boolean;
  locationSessionToken: string;

  bootstrap: (payload: {
    channel: HomeChannel;
    sport: SportType;
    locationInput: string;
    locationPrefillSource: LocationPrefillSource;
    shouldAutoResolvePrefilledLocation: boolean;
  }) => void;
  setSport: (sport: SportType) => void;
  setLocationInput: (value: string) => void;
  selectLocation: (suggestion: LocationSuggestion) => void;
  consumeAutoResolvePrefilledLocation: () => void;
  setHasPrefilledLocationNotMatched: (value: boolean) => void;
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
  isBootstrapped: false,
  channel: "direct",
  sport: DEFAULT_SPORT_TYPE,
  locationInput: "",
  locationPrefillSource: "none",
  selectedLocation: null,
  shouldAutoResolvePrefilledLocation: false,
  hasPrefilledLocationNotMatched: false,
  locationSessionToken: createSessionToken(),

  bootstrap: ({
    channel,
    sport,
    locationInput,
    locationPrefillSource,
    shouldAutoResolvePrefilledLocation,
  }) =>
    set({
      isBootstrapped: true,
      channel,
      sport,
      locationInput,
      locationPrefillSource,
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
          locationPrefillSource: "none",
          selectedLocation: null,
          shouldAutoResolvePrefilledLocation: false,
          hasPrefilledLocationNotMatched: false,
          locationSessionToken: createSessionToken(),
        };
      }

      return {
        locationInput: value,
        locationPrefillSource: "none",
        shouldAutoResolvePrefilledLocation: false,
        hasPrefilledLocationNotMatched: false,
      };
    }),
  selectLocation: (suggestion) =>
    set({
      selectedLocation: suggestion,
      locationInput: suggestion.formattedLocation,
      locationPrefillSource: "none",
      shouldAutoResolvePrefilledLocation: false,
      hasPrefilledLocationNotMatched: false,
    }),
  consumeAutoResolvePrefilledLocation: () =>
    set({ shouldAutoResolvePrefilledLocation: false }),
  setHasPrefilledLocationNotMatched: (value) =>
    set({ hasPrefilledLocationNotMatched: value }),
}));
