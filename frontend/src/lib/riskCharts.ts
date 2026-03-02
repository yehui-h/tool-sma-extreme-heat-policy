import type {
  EChartsOption,
  TooltipComponentFormatterCallbackParams,
} from "echarts";
import { toRiskLevel, type ForecastPoint, type RiskLevel } from "@/domain/risk";
import { getRiskBands, getRiskColor } from "@/domain/riskRegistry";

const FORECAST_LINE_COLOR = "#e64626";
const RISK_BAND_STACK_NAME = "risk-band";
const GAUGE_MAX_SCORE = 4;
const FORECAST_HOUR_MINUTE_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

type ChartTypography = {
  gaugeAxis: number;
  gaugeValue: number;
  gaugeTitle: number;
  forecastTitle: number;
  axis: number;
  riskBandAxis: number;
  xInterval: number;
};

type ForecastLayout = {
  gridLeft: number;
  gridRight: number;
  gridBottom: number;
  xAxisNameGap: number;
  yAxisNameGap: number;
  axisLabelMargin: number;
};

const CHART_TYPOGRAPHY: Record<"mobile" | "desktop", ChartTypography> = {
  mobile: {
    gaugeAxis: 12,
    gaugeValue: 28,
    gaugeTitle: 14,
    forecastTitle: 15,
    axis: 12,
    riskBandAxis: 12,
    xInterval: 1,
  },
  desktop: {
    gaugeAxis: 11,
    gaugeValue: 26,
    gaugeTitle: 13,
    forecastTitle: 14,
    axis: 11,
    riskBandAxis: 11,
    xInterval: 0,
  },
};

const FORECAST_LAYOUT: ForecastLayout = {
  gridLeft: 15,
  gridRight: 10,
  gridBottom: 20,
  xAxisNameGap: 45,
  yAxisNameGap: 20,
  axisLabelMargin: 10,
};

interface GaugeLabels {
  title: string;
  riskLevelShort: Record<RiskLevel, string>;
}

interface GaugeSeriesOptions {
  showPointer?: boolean;
  pointerColor?: string;
  showProgress?: boolean;
  showAxisLabel?: boolean;
  detailFormatter?: string;
  detailValueAnimation?: boolean;
}

interface ForecastLabels {
  xAxisName: string;
  yAxisRiskName: string;
  tooltipRiskLabel: string;
  riskLevelLong: Record<RiskLevel, string>;
}

const GAUGE_LABEL_ORDER: RiskLevel[] = [
  "low",
  "moderate",
  "high",
  "extreme",
  "extreme",
];

function getTypography(isMobile: boolean): ChartTypography {
  return isMobile ? CHART_TYPOGRAPHY.mobile : CHART_TYPOGRAPHY.desktop;
}

function toGaugeColorStops(): [number, string][] {
  return getRiskBands().map((band) => [
    band.upper / GAUGE_MAX_SCORE,
    getRiskColor(band.level),
  ]);
}

function getGaugeRiskLabel(
  value: number,
  labels: GaugeLabels["riskLevelShort"],
): string {
  const roundedValue = Math.round(value);
  const riskLevel = GAUGE_LABEL_ORDER[roundedValue];

  if (!riskLevel) {
    return "";
  }

  return labels[riskLevel];
}

function createGaugeSeries(
  score: number,
  labels: GaugeLabels,
  typography: ChartTypography,
  options: GaugeSeriesOptions = {},
) {
  const {
    showPointer = true,
    pointerColor,
    showProgress = true,
    showAxisLabel = true,
    detailFormatter = "{value}",
    detailValueAnimation = true,
  } = options;

  return {
    type: "gauge" as const,
    radius: "88%",
    min: 0,
    max: GAUGE_MAX_SCORE,
    splitNumber: GAUGE_MAX_SCORE,
    axisLine: {
      lineStyle: {
        width: 18,
        color: toGaugeColorStops(),
      },
    },
    pointer: {
      show: showPointer,
      length: "58%",
      width: 6,
      ...(pointerColor ? { itemStyle: { color: pointerColor } } : {}),
    },
    progress: {
      show: showProgress,
      width: 18,
    },
    axisTick: {
      distance: -24,
      splitNumber: 4,
      lineStyle: {
        width: 1,
        color: "#fff",
      },
    },
    splitLine: {
      distance: -26,
      length: 12,
      lineStyle: {
        width: 2,
        color: "#fff",
      },
    },
    axisLabel: {
      show: showAxisLabel,
      distance: -42,
      color: "#fff",
      fontSize: typography.gaugeAxis,
      formatter(value: number) {
        return getGaugeRiskLabel(value, labels.riskLevelShort);
      },
    },
    detail: {
      valueAnimation: detailValueAnimation,
      formatter: detailFormatter,
      offsetCenter: [0, "70%"],
      color: "#1f2937",
      fontSize: typography.gaugeValue,
      fontWeight: 700,
    },
    title: {
      offsetCenter: [0, "40%"],
      color: "#4b5563",
      fontSize: typography.gaugeTitle,
    },
    data: [{ value: Number(score.toFixed(1)), name: labels.title }],
  };
}

function getBandContribution(
  value: number,
  lower: number,
  upper: number,
): number {
  return Math.max(0, Math.min(value, upper) - lower);
}

function toRiskBandValues(
  lineValues: number[],
  lower: number,
  upper: number,
): number[] {
  return lineValues.map((value) => getBandContribution(value, lower, upper));
}

function toRiskBandSeries(lineValues: number[]) {
  return getRiskBands().map((band) => ({
    name: band.level,
    type: "line" as const,
    stack: RISK_BAND_STACK_NAME,
    yAxisIndex: 0,
    silent: true,
    showSymbol: false,
    lineStyle: { width: 0, opacity: 0 },
    areaStyle: { color: band.color },
    emphasis: { disabled: true },
    tooltip: { show: false },
    data: toRiskBandValues(lineValues, band.lower, band.upper),
  }));
}

function formatForecastTimeLabel(rawTime: string): string {
  const match = FORECAST_HOUR_MINUTE_PATTERN.exec(rawTime);
  if (!match) {
    return rawTime;
  }

  const hour24 = Number(match[1]);
  const minute = Number(match[2]);
  const meridiem = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;

  if (minute === 0) {
    return `${hour12} ${meridiem}`;
  }

  return `${hour12}:${String(minute).padStart(2, "0")} ${meridiem}`;
}

function formatForecastTooltip(
  params: TooltipComponentFormatterCallbackParams,
  tooltipRiskLabel: string,
): string {
  const items = Array.isArray(params) ? params : [params];
  const firstItem = items[0];
  if (!firstItem) {
    return "";
  }

  const riskItem =
    items.find((item) => item.seriesName === tooltipRiskLabel) ?? firstItem;
  const formattedTime = formatForecastTimeLabel(String(firstItem.name ?? ""));
  const marker = typeof riskItem.marker === "string" ? riskItem.marker : "";
  const rawValue = Array.isArray(riskItem.value)
    ? riskItem.value[1]
    : riskItem.value;
  const numericValue =
    typeof rawValue === "number" ? rawValue : Number(rawValue);
  const valueText = Number.isFinite(numericValue)
    ? numericValue.toFixed(1)
    : String(rawValue ?? "");

  return `${formattedTime}<br/>${marker} ${tooltipRiskLabel}&nbsp;&nbsp;${valueText}`;
}

function createForecastXAxis(
  points: ForecastPoint[],
  labels: ForecastLabels,
  typography: ChartTypography,
) {
  return {
    type: "category" as const,
    boundaryGap: false,
    name: labels.xAxisName,
    nameLocation: "middle" as const,
    nameGap: FORECAST_LAYOUT.xAxisNameGap,
    nameTextStyle: {
      color: "#4b5563",
      fontSize: typography.axis,
      fontWeight: 400,
    },
    data: points.map((point) => formatForecastTimeLabel(point.time)),
    axisLabel: {
      fontSize: typography.axis,
      interval: typography.xInterval,
      hideOverlap: true,
      rotate: 90,
      formatter(value: string | number) {
        return String(value);
      },
    },
  };
}

function createForecastYAxis(
  labels: ForecastLabels,
  typography: ChartTypography,
) {
  return [
    {
      type: "value" as const,
      min: 0,
      max: GAUGE_MAX_SCORE,
      interval: 1,
      axisLine: {
        show: true,
        lineStyle: {
          color: "#6b7280",
          width: 1,
        },
      },
      axisTick: {
        show: true,
        length: 4,
        lineStyle: {
          color: "#6b7280",
        },
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: "#d1d5db",
          width: 1,
        },
      },
      axisLabel: {
        show: false,
      },
    },
    {
      type: "category" as const,
      position: "left" as const,
      name: labels.yAxisRiskName,
      nameLocation: "middle" as const,
      nameGap: FORECAST_LAYOUT.yAxisNameGap,
      nameTextStyle: {
        color: "#4b5563",
        fontSize: typography.riskBandAxis,
        fontWeight: 400,
      },
      data: [
        labels.riskLevelLong.low,
        labels.riskLevelLong.moderate,
        labels.riskLevelLong.high,
        labels.riskLevelLong.extreme,
      ],
      boundaryGap: true,
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      splitLine: {
        show: false,
      },
      axisLabel: {
        rotate: 90,
        fontSize: typography.riskBandAxis,
        interval: 0,
        align: "center" as const,
        verticalAlign: "middle" as const,
        margin: FORECAST_LAYOUT.axisLabelMargin,
      },
    },
  ];
}

function createForecastSeries(
  lineValues: number[],
  labels: ForecastLabels,
): EChartsOption["series"] {
  return [
    ...toRiskBandSeries(lineValues),
    {
      name: labels.tooltipRiskLabel,
      type: "line",
      yAxisIndex: 0,
      smooth: true,
      showSymbol: false,
      lineStyle: { width: 3, color: FORECAST_LINE_COLOR },
      itemStyle: { color: FORECAST_LINE_COLOR },
      data: lineValues,
    },
  ];
}

/**
 * Builds ECharts option for the current risk gauge chart.
 */
export function buildGaugeOption(
  score: number,
  labels: GaugeLabels,
  isMobile = false,
): EChartsOption {
  const typography = getTypography(isMobile);
  const safeScore = Number.isFinite(score) ? score : 0;
  const pointerColor = getRiskColor(toRiskLevel(safeScore));

  return {
    animation: true,
    tooltip: {
      formatter: "{b}: {c}",
    },
    series: [
      createGaugeSeries(safeScore, labels, typography, {
        pointerColor,
        showProgress: false,
      }),
    ],
  };
}

/**
 * Builds ECharts option for pending state of current risk gauge chart.
 */
export function buildPendingGaugeOption(
  labels: GaugeLabels,
  isMobile = false,
): EChartsOption {
  const typography = getTypography(isMobile);

  return {
    animation: false,
    tooltip: {
      show: false,
    },
    series: [
      createGaugeSeries(0, labels, typography, {
        showPointer: false,
        showProgress: false,
        showAxisLabel: false,
        detailFormatter: "N/A",
        detailValueAnimation: false,
      }),
    ],
  };
}

/**
 * Builds ECharts option for the 24-hour forecast risk chart.
 */
export function buildForecastOption(
  points: ForecastPoint[],
  labels: ForecastLabels,
  title?: string,
  isMobile = false,
): EChartsOption {
  const typography = getTypography(isMobile);
  const lineValues = points.map((point) => point.value);

  return {
    title: title
      ? {
          text: title,
          left: "center",
          textStyle: { fontSize: typography.forecastTitle, fontWeight: 600 },
        }
      : undefined,
    grid: {
      left: FORECAST_LAYOUT.gridLeft,
      right: FORECAST_LAYOUT.gridRight,
      top: title ? 38 : 18,
      bottom: FORECAST_LAYOUT.gridBottom,
      containLabel: true,
    },
    xAxis: createForecastXAxis(points, labels, typography),
    yAxis: createForecastYAxis(labels, typography),
    series: createForecastSeries(lineValues, labels),
    tooltip: {
      trigger: "axis",
      formatter: (params: TooltipComponentFormatterCallbackParams) =>
        formatForecastTooltip(params, labels.tooltipRiskLabel),
    },
  };
}
