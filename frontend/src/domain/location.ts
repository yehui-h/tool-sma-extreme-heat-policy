export interface LocationSuggestion {
  id: string;
  displayLabel: string;
  name: string;
  regionName?: string;
  countryName: string;
  countryCode?: string;
  sessionToken?: string;
  latitude?: number;
  longitude?: number;
}
