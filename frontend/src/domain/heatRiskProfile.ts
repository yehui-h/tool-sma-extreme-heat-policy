const HEAT_RISK_PROFILE_META = [
  {
    type: "ADULT",
    labelKey: "home.sections.filters.profileAdult",
  },
  {
    type: "AGE_14_17",
    labelKey: "home.sections.filters.profileAge14To17",
  },
  {
    type: "AGE_10_13",
    labelKey: "home.sections.filters.profileAge10To13",
  },
  {
    type: "UNDER_10",
    labelKey: "home.sections.filters.profileUnder10",
  },
] as const;

export type HeatRiskProfile = (typeof HEAT_RISK_PROFILE_META)[number]["type"];

export interface HeatRiskProfileMeta {
  type: HeatRiskProfile;
  labelKey: string;
}

export const heatRiskProfiles: readonly HeatRiskProfileMeta[] =
  HEAT_RISK_PROFILE_META;

export const HEAT_RISK_PROFILE_VALUES: HeatRiskProfile[] = heatRiskProfiles.map(
  (profile) => profile.type,
);

export const DEFAULT_HEAT_RISK_PROFILE: HeatRiskProfile = "ADULT";

export function isHeatRiskProfile(value: unknown): value is HeatRiskProfile {
  return (
    typeof value === "string" &&
    HEAT_RISK_PROFILE_VALUES.includes(value as HeatRiskProfile)
  );
}

export function getHeatRiskProfileMeta(
  profile: HeatRiskProfile,
): HeatRiskProfileMeta {
  const profileMeta = heatRiskProfiles.find(
    (profileMeta) => profileMeta.type === profile,
  );

  return profileMeta ?? heatRiskProfiles[0];
}
