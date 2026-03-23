import { describe, expect, it } from "vitest";
import { toForecastDays, toHeatRiskMeta } from "@/lib/homeRisk";

describe("toHeatRiskMeta", () => {
  it("extracts location coordinates and timezone from API metadata", () => {
    expect(
      toHeatRiskMeta({
        location: {
          latitude: -31.9523,
          longitude: 115.8613,
          timezone: "Australia/Perth",
        },
      }),
    ).toEqual({
      latitude: -31.9523,
      longitude: 115.8613,
      timeZone: "Australia/Perth",
    });
  });
});

describe("toForecastDays", () => {
  it("groups forecast points using the selected location timezone", () => {
    const forecastDays = toForecastDays(
      [
        {
          time_utc: "2026-03-09T15:00:00Z",
          risk_level_interpolated: 0.8,
        },
        {
          time_utc: "2026-03-09T16:00:00Z",
          risk_level_interpolated: 1.2,
        },
        {
          time_utc: "2026-03-09T17:00:00Z",
          risk_level_interpolated: 1.4,
        },
      ],
      "Australia/Eucla",
    );

    expect(forecastDays).toEqual([
      {
        date: "2026-03-09T15:00:00Z",
        risk: "low",
        points: [{ time: "23:45", value: 0.8 }],
      },
      {
        date: "2026-03-09T16:00:00Z",
        risk: "moderate",
        points: [
          { time: "00:45", value: 1.2 },
          { time: "01:45", value: 1.4 },
        ],
      },
    ]);
  });

  it("falls back to the browser timezone when the location timezone is missing", () => {
    const forecastDays = toForecastDays([
      {
        time_utc: "2026-03-09T00:00:00Z",
        risk_level_interpolated: 0.8,
      },
    ]);

    expect(forecastDays).toHaveLength(1);
    expect(forecastDays[0]?.points[0]?.time).toMatch(/^\d{2}:\d{2}$/);
  });
});
