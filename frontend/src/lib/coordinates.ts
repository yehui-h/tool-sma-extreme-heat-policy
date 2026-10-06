export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Accepts only finite numbers. Coercible values such as null are rejected
 * so they cannot be read as 0.
 */
export function toFiniteNumberOrUndefined(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

/**
 * Normalizes unknown latitude/longitude values into coordinates.
 * Returns null unless both values are finite numbers.
 */
export function toCoordinatesOrNull(payload: {
  latitude?: unknown;
  longitude?: unknown;
}): Coordinates | null {
  const latitude = toFiniteNumberOrUndefined(payload.latitude);
  const longitude = toFiniteNumberOrUndefined(payload.longitude);

  if (latitude === undefined || longitude === undefined) {
    return null;
  }

  return {
    latitude,
    longitude,
  };
}
