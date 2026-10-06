import { describe, expect, it } from "vitest";
import {
  toCoordinatesOrNull,
  toFiniteNumberOrUndefined,
} from "@/lib/coordinates";

describe("toFiniteNumberOrUndefined", () => {
  it("keeps finite numbers, including zero", () => {
    expect(toFiniteNumberOrUndefined(0)).toBe(0);
    expect(toFiniteNumberOrUndefined(-33.8688)).toBe(-33.8688);
  });

  it("rejects null and other values that Number() would coerce", () => {
    expect(toFiniteNumberOrUndefined(null)).toBeUndefined();
    expect(toFiniteNumberOrUndefined(undefined)).toBeUndefined();
    expect(toFiniteNumberOrUndefined("")).toBeUndefined();
    expect(toFiniteNumberOrUndefined("0")).toBeUndefined();
    expect(toFiniteNumberOrUndefined(false)).toBeUndefined();
  });

  it("rejects non-finite numbers", () => {
    expect(toFiniteNumberOrUndefined(Number.NaN)).toBeUndefined();
    expect(toFiniteNumberOrUndefined(Number.POSITIVE_INFINITY)).toBeUndefined();
  });
});

describe("toCoordinatesOrNull", () => {
  it("keeps an explicit 0,0 coordinate pair", () => {
    expect(toCoordinatesOrNull({ latitude: 0, longitude: 0 })).toEqual({
      latitude: 0,
      longitude: 0,
    });
  });

  it("returns null when either coordinate is null", () => {
    expect(toCoordinatesOrNull({ latitude: null, longitude: null })).toBeNull();
    expect(
      toCoordinatesOrNull({ latitude: -33.8688, longitude: null }),
    ).toBeNull();
  });

  it("returns null when either coordinate is missing", () => {
    expect(toCoordinatesOrNull({})).toBeNull();
    expect(toCoordinatesOrNull({ latitude: -33.8688 })).toBeNull();
  });
});
