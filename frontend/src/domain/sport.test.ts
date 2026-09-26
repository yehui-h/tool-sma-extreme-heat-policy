import { describe, expect, it } from "vitest";
import {
  isSportType,
  sports,
  SportType,
  SPORT_TYPE_VALUES,
  toSportAssetName,
} from "@/domain/sport";
import enTranslation from "@/i18n/locales/en/translation.json";

describe("sport registry", () => {
  it("registers Croquet for selection, persistence, and API requests", () => {
    expect(SportType.Croquet).toBe("CROQUET");
    expect(SPORT_TYPE_VALUES).toContain("CROQUET");
    expect(isSportType("CROQUET")).toBe(true);
  });

  it("exposes Croquet translation and image metadata", () => {
    expect(enTranslation.sports.croquet).toBe("Croquet");
    expect(toSportAssetName(SportType.Croquet)).toBe("croquet");
    expect(
      sports.find((sport) => sport.type === SportType.Croquet),
    ).toMatchObject({
      type: "CROQUET",
      labelKey: "sports.croquet",
      imagePath: "/sports/croquet.webp",
    });
  });
});
