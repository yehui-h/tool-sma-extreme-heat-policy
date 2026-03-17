import { describe, expect, it } from "vitest";
import { buildForecastOption } from "@/lib/riskCharts";

const forecastLabels = {
  xAxisName: "Time",
  yAxisRiskName: "Risk level",
  tooltipRiskLabel: "Risk",
  riskLevelLong: {
    low: "Low",
    moderate: "Moderate",
    high: "High",
    extreme: "Extreme",
  },
};

describe("buildForecastOption", () => {
  it("adds threshold crossing points to the visual forecast series", () => {
    const option = buildForecastOption(
      [
        { time: "08:00", value: 0.5 },
        { time: "09:00", value: 2.5 },
      ],
      forecastLabels,
      "Today",
    );
    const series = Array.isArray(option.series) ? option.series : [];
    const visualSeries = series.find(
      (entry) =>
        typeof entry === "object" &&
        entry !== null &&
        "name" in entry &&
        entry.name === "Risk-visual",
    );
    const tooltipSeries = series.find(
      (entry) =>
        typeof entry === "object" &&
        entry !== null &&
        "name" in entry &&
        entry.name === "Risk",
    );
    const xAxis = Array.isArray(option.xAxis) ? option.xAxis[0] : option.xAxis;

    expect(series).toHaveLength(7);
    expect(option.title).toMatchObject({ text: "Today" });
    expect(xAxis).toMatchObject({ min: 480, max: 540, name: "Time" });
    expect(visualSeries).toMatchObject({
      data: [
        [480, 0.5],
        [495, 1],
        [525, 2],
        [540, 2.5],
      ],
    });
    expect(tooltipSeries).toMatchObject({
      data: [
        [480, 0.5],
        [540, 2.5],
      ],
    });
  });

  it("renders zero-risk forecasts as a muted dotted line", () => {
    const option = buildForecastOption(
      [
        { time: "08:00", value: 0 },
        { time: "09:00", value: 0 },
      ],
      forecastLabels,
    );
    const series = Array.isArray(option.series) ? option.series : [];
    const visualSeries = series.find(
      (entry) =>
        typeof entry === "object" &&
        entry !== null &&
        "name" in entry &&
        entry.name === "Risk-visual",
    );

    expect(visualSeries).toMatchObject({
      showSymbol: true,
      symbolSize: 6,
      lineStyle: { color: "#9ca3af" },
      itemStyle: { color: "#9ca3af" },
    });
  });
});
