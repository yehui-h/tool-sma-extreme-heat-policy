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
  locationSessionToken: string;
  forecast: ForecastDay[];

  bootstrap: (payload: {
    channel: HomeChannel;
    sport: SportType;
    locationInput: string;
  }) => void;
  setSport: (sport: SportType) => void;
  setLocationInput: (value: string) => void;
  selectLocation: (suggestion: LocationSuggestion) => void;
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
  locationSessionToken: createSessionToken(),
  forecast: [],

  bootstrap: ({ channel, sport, locationInput }) =>
    set({
      channel,
      sport,
      locationInput,
      selectedLocation: null,
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
          locationSessionToken: createSessionToken(),
        };
      }

      return { locationInput: value };
    }),
  selectLocation: (suggestion) =>
    set({
      selectedLocation: suggestion,
      locationInput: suggestion.formattedLocation,
    }),
  setForecast: (forecast) => set({ forecast }),
}));
