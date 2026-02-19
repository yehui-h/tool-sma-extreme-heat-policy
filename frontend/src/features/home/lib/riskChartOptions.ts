import type {
  EChartsOption,
  TooltipComponentFormatterCallbackParams,
} from "echarts";
import type { ForecastPoint, RiskLevel } from "@/features/home/types";

const RISK_META: Record<
  RiskLevel,
  { value: number; color: string; shortLabel: string; longLabel: string }
> = {
  low: {
    value: 1,
    color: "#FFE478",
    shortLabel: "Low",
    longLabel: "Low",
  },
  moderate: {
    value: 2,
    color: "#F5810C",
    shortLabel: "Mod",
    longLabel: "Moderate",
  },
  high: {
    value: 3,
    color: "#CF3838",
    shortLabel: "High",
    longLabel: "High",
  },
  extreme: {
    value: 4,
    color: "#8C2439",
    shortLabel: "Ext",
    longLabel: "Extreme",
  },
};

const FORECAST_LINE_COLOR = "#e64626";

type ChartTypography = {
  gaugeAxis: number;
  gaugeValue: number;
  gaugeTitle: number;
  forecastTitle: number;
  axis: number;
  riskBandAxis: number;
  xInterval: number;
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

export const RISK_COLORS: Record<RiskLevel, string> = {
  low: RISK_META.low.color,
  moderate: RISK_META.moderate.color,
  high: RISK_META.high.color,
  extreme: RISK_META.extreme.color,
};

function getRiskLabelByValue(value: number, format: "short" | "long"): string {
  if (value === 0) {
    return format === "short"
      ? RISK_META.low.shortLabel
      : RISK_META.low.longLabel;
  }
  if (value === 1) {
    return format === "short"
      ? RISK_META.moderate.shortLabel
      : RISK_META.moderate.longLabel;
  }
  if (value === 2) {
    return format === "short"
      ? RISK_META.high.shortLabel
      : RISK_META.high.longLabel;
  }
  if (value === 3) {
    return format === "short"
      ? RISK_META.extreme.shortLabel
      : RISK_META.extreme.longLabel;
  }
  if (value === 4) {
    return format === "short"
      ? RISK_META.extreme.shortLabel
      : RISK_META.extreme.longLabel;
  }

  return "";
}

export function getRiskColor(level: RiskLevel) {
  return RISK_COLORS[level];
}

function formatHourLabel(timeLabel: string): string {
  const [hourText] = timeLabel.split(":");
  const hour = Number(hourText);

  if (Number.isNaN(hour)) {
    return timeLabel;
  }

  const period = hour >= 12 ? "PM" : "AM";
  const twelveHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${twelveHour}${period}`;
}

function getBandContribution(
  value: number,
  lower: number,
  upper: number,
): number {
  return Math.max(0, Math.min(value, upper) - lower);
}

function formatForecastTooltip(
  params: TooltipComponentFormatterCallbackParams,
): string {
  const items = Array.isArray(params) ? params : [params];
  const firstItem = items[0];
  if (!firstItem) {
    return "";
  }

  const riskItem =
    items.find((item) => item.seriesName === "Risk") ?? firstItem;
  const formattedTime = formatHourLabel(String(firstItem.name ?? ""));
  const marker = typeof riskItem.marker === "string" ? riskItem.marker : "";
  const rawValue = Array.isArray(riskItem.value)
    ? riskItem.value[1]
    : riskItem.value;
  const numericValue =
    typeof rawValue === "number" ? rawValue : Number(rawValue);
  const valueText = Number.isFinite(numericValue)
    ? numericValue.toFixed(1)
    : String(rawValue ?? "");

  return `${formattedTime}<br/>${marker} Risk&nbsp;&nbsp;${valueText}`;
}

export function buildGaugeOption(
  score: number,
  isMobile = false,
): EChartsOption {
  const typography = isMobile
    ? CHART_TYPOGRAPHY.mobile
    : CHART_TYPOGRAPHY.desktop;
  const safe_score = Number.isFinite(score) ? score : 0;

  return {
    animation: true,
    tooltip: {
      formatter: "{b}: {c}",
    },
    series: [
      {
        type: "gauge",
        min: 0,
        max: 4,
        splitNumber: 4,
        axisLine: {
          lineStyle: {
            width: 18,
            color: [
              [0.25, RISK_META.low.color],
              [0.5, RISK_META.moderate.color],
              [0.75, RISK_META.high.color],
              [1, RISK_META.extreme.color],
            ],
          },
        },
        pointer: {
          length: "58%",
          width: 6,
        },
        progress: {
          show: true,
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
          distance: -42,
          color: "#fff",
          fontSize: typography.gaugeAxis,
          formatter(value: number) {
            return getRiskLabelByValue(value, "short");
          },
        },
        detail: {
          valueAnimation: true,
          formatter: "{value}",
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
        data: [{ value: Number(safe_score.toFixed(1)), name: "Heat Score" }],
      },
    ],
  };
}

export function buildForecastOption(
  points: ForecastPoint[],
  title?: string,
  isMobile = false,
): EChartsOption {
  const typography = isMobile
    ? CHART_TYPOGRAPHY.mobile
    : CHART_TYPOGRAPHY.desktop;
  const layout = isMobile
    ? {
        gridLeft: 15,
        gridRight: 10,
        gridBottom: 20,
        xAxisNameGap: 45,
        yAxisNameGap: 20,
        axisLabelMargin: 10,
      }
    : {
        gridLeft: 15,
        gridRight: 10,
        gridBottom: 20,
        xAxisNameGap: 45,
        yAxisNameGap: 20,
        axisLabelMargin: 10,
      };
  const lineValues = points.map((point) => point.value);
  const lowBandValues = lineValues.map((value) =>
    getBandContribution(value, 0, 1),
  );
  const moderateBandValues = lineValues.map((value) =>
    getBandContribution(value, 1, 2),
  );
  const highBandValues = lineValues.map((value) =>
    getBandContribution(value, 2, 3),
  );
  const extremeBandValues = lineValues.map((value) =>
    getBandContribution(value, 3, 4),
  );

  return {
    title: title
      ? {
          text: title,
          left: "center",
          textStyle: { fontSize: typography.forecastTitle, fontWeight: 600 },
        }
      : undefined,
    grid: {
      left: layout.gridLeft,
      right: layout.gridRight,
      top: title ? 38 : 18,
      bottom: layout.gridBottom,
      containLabel: true,
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      name: "Time",
      nameLocation: "middle",
      nameGap: layout.xAxisNameGap,
      nameTextStyle: {
        color: "#4b5563",
        fontSize: typography.axis,
        fontWeight: 400,
      },
      data: points.map((point) => point.time),
      axisLabel: {
        fontSize: typography.axis,
        interval: typography.xInterval,
        hideOverlap: true,
        rotate: 90,
        formatter(value: string | number) {
          return formatHourLabel(String(value));
        },
      },
    },
    yAxis: [
      {
        type: "value",
        min: 0,
        max: 4,
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
        type: "category",
        position: "left",
        name: "Risk",
        nameLocation: "middle",
        nameGap: layout.yAxisNameGap,
        nameTextStyle: {
          color: "#4b5563",
          fontSize: typography.riskBandAxis,
          fontWeight: 400,
        },
        data: ["Low", "Moderate", "High", "Extreme"],
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
          align: "center",
          verticalAlign: "middle",
          margin: layout.axisLabelMargin,
        },
      },
    ],
    series: [
      {
        name: "Low band",
        type: "line",
        stack: "risk-band",
        yAxisIndex: 0,
        silent: true,
        showSymbol: false,
        lineStyle: { width: 0, opacity: 0 },
        areaStyle: { color: RISK_META.low.color },
        emphasis: { disabled: true },
        tooltip: { show: false },
        data: lowBandValues,
      },
      {
        name: "Moderate band",
        type: "line",
        stack: "risk-band",
        yAxisIndex: 0,
        silent: true,
        showSymbol: false,
        lineStyle: { width: 0, opacity: 0 },
        areaStyle: { color: RISK_META.moderate.color },
        emphasis: { disabled: true },
        tooltip: { show: false },
        data: moderateBandValues,
      },
      {
        name: "High band",
        type: "line",
        stack: "risk-band",
        yAxisIndex: 0,
        silent: true,
        showSymbol: false,
        lineStyle: { width: 0, opacity: 0 },
        areaStyle: { color: RISK_META.high.color },
        emphasis: { disabled: true },
        tooltip: { show: false },
        data: highBandValues,
      },
      {
        name: "Extreme band",
        type: "line",
        stack: "risk-band",
        yAxisIndex: 0,
        silent: true,
        showSymbol: false,
        lineStyle: { width: 0, opacity: 0 },
        areaStyle: { color: RISK_META.extreme.color },
        emphasis: { disabled: true },
        tooltip: { show: false },
        data: extremeBandValues,
      },
      {
        name: "Risk",
        type: "line",
        yAxisIndex: 0,
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 3, color: FORECAST_LINE_COLOR },
        itemStyle: { color: FORECAST_LINE_COLOR },
        data: lineValues,
      },
    ],
    tooltip: {
      trigger: "axis",
      formatter: formatForecastTooltip,
    },
  };
}
