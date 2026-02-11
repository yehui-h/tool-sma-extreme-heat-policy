import type { EChartsOption } from 'echarts'
import type { ForecastPoint, RiskLevel } from '@/features/home/types'

const RISK_LEVELS: RiskLevel[] = ['low', 'moderate', 'high', 'extreme']

const RISK_META: Record<RiskLevel, { value: number; color: string; shortLabel: string; longLabel: string }> = {
  low: {
    value: 1,
    color: '#fcd200',
    shortLabel: 'Low',
    longLabel: 'Low',
  },
  moderate: {
    value: 2,
    color: '#fd7f00',
    shortLabel: 'Mod',
    longLabel: 'Moderate',
  },
  high: {
    value: 3,
    color: '#dc0b00',
    shortLabel: 'High',
    longLabel: 'High',
  },
  extreme: {
    value: 4,
    color: '#9c001d',
    shortLabel: 'Ext',
    longLabel: 'Extreme',
  },
}

export const RISK_COLORS: Record<RiskLevel, string> = {
  low: RISK_META.low.color,
  moderate: RISK_META.moderate.color,
  high: RISK_META.high.color,
  extreme: RISK_META.extreme.color,
}

function getRiskLabelByValue(value: number, format: 'short' | 'long'): string {
  const level = RISK_LEVELS.find((riskLevel) => RISK_META[riskLevel].value === value)
  if (!level) {
    return ''
  }

  return format === 'short' ? RISK_META[level].shortLabel : RISK_META[level].longLabel
}

export function getRiskColor(level: RiskLevel) {
  return RISK_COLORS[level]
}

export function buildGaugeOption(score: number): EChartsOption {
  return {
    animation: true,
    tooltip: {
      formatter: '{b}: {c}',
    },
    series: [
      {
        type: 'gauge',
        min: 1,
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
          length: '58%',
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
            color: '#fff',
          },
        },
        splitLine: {
          distance: -26,
          length: 12,
          lineStyle: {
            width: 2,
            color: '#fff',
          },
        },
        axisLabel: {
          distance: -42,
          color: '#fff',
          fontSize: 10,
          formatter(value: number) {
            return getRiskLabelByValue(value, 'short')
          },
        },
        detail: {
          valueAnimation: true,
          formatter: '{value}',
          offsetCenter: [0, '70%'],
          color: '#1f2937',
          fontSize: 24,
          fontWeight: 700,
        },
        title: {
          offsetCenter: [0, '40%'],
          color: '#4b5563',
          fontSize: 12,
        },
        data: [{ value: Number(score.toFixed(1)), name: 'Heat Score' }],
      },
    ],
  }
}

export function buildForecastOption(points: ForecastPoint[], title?: string): EChartsOption {
  return {
    title: title
      ? {
          text: title,
          left: 'center',
          textStyle: { fontSize: 13, fontWeight: 600 },
        }
      : undefined,
    grid: {
      left: 12,
      right: 16,
      top: title ? 38 : 18,
      bottom: 12,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: points.map((point) => point.time),
      axisLabel: {
        fontSize: 10,
      },
    },
    yAxis: {
      type: 'value',
      min: 1,
      max: 4,
      interval: 1,
      axisLabel: {
        formatter(value: number) {
          return getRiskLabelByValue(value, 'long')
        },
        fontSize: 10,
      },
    },
    series: [
      {
        name: 'Risk',
        type: 'line',
        smooth: true,
        showSymbol: false,
        areaStyle: { opacity: 0.12 },
        lineStyle: { width: 3, color: '#e15220' },
        itemStyle: { color: '#e15220' },
        data: points.map((point) => point.value),
      },
    ],
    tooltip: {
      trigger: 'axis',
    },
  }
}
