import { describe, expect, it } from "vitest";
import {
  HEAT_RISK_PROFILE_VALUES,
  getHeatRiskProfileMeta,
  heatRiskProfiles,
} from "@/domain/heatRiskProfile";

describe("heatRiskProfiles", () => {
  it("covers each profile exactly once", () => {
    const profileTypes = heatRiskProfiles.map((profile) => profile.type);

    expect(profileTypes).toEqual(HEAT_RISK_PROFILE_VALUES);
    expect(new Set(profileTypes).size).toBe(heatRiskProfiles.length);
  });

  it("preserves the descending age display order", () => {
    expect(heatRiskProfiles).toEqual([
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
    ]);
  });

  it("returns the profile metadata for a selected age group", () => {
    expect(getHeatRiskProfileMeta("AGE_14_17")).toEqual({
      type: "AGE_14_17",
      labelKey: "home.sections.filters.profileAge14To17",
    });
  });
});
