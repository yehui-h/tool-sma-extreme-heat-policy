import type {
  CurrentRiskData,
  ForecastDay,
  RecommendationItem,
  RiskLevel,
} from '@/features/home/types'

export const currentRisk: CurrentRiskData = {
  title: 'Current Sport Heat Score',
  score: 3.1,
  level: 'extreme',
  shortSummary:
    'Active cooling strategies are strongly encouraged during breaks and periods of low activity.',
}

export const keyRecommendationsByRisk: Record<RiskLevel, RecommendationItem[]> = {
  low: [
    { icon: '/actions/hydration.png', label: 'Stay hydrated' },
    { icon: '/actions/clothing.png', label: 'Wear light clothing' },
  ],
  moderate: [
    { icon: '/actions/hydration.png', label: 'Stay hydrated' },
    { icon: '/actions/clothing.png', label: 'Wear light clothing' },
    { icon: '/actions/pause.png', label: 'Schedule rest breaks' },
  ],
  high: [
    { icon: '/actions/hydration.png', label: 'Stay hydrated' },
    { icon: '/actions/clothing.png', label: 'Wear light clothing' },
    { icon: '/actions/pause.png', label: 'Increase rest breaks' },
    { icon: '/actions/cooling.png', label: 'Apply active cooling' },
  ],
  extreme: [{ icon: '/actions/stop.png', label: 'Consider suspending play' }],
}

export const detailedRecommendationsByRisk: Record<RiskLevel, string[]> = {
  low: [
    'Maintain hydration before and during activity.',
    'Select breathable, lightweight clothing where possible.',
    'Monitor how you feel and adjust pace if symptoms appear.',
  ],
  moderate: [
    'Provide at least 15 minutes of rest per 45 minutes of play.',
    'Extend regular breaks and encourage shade use during pauses.',
    'Increase access to cool drinking water throughout activity.',
  ],
  high: [
    'Use active cooling during scheduled and additional breaks.',
    'Consider cold fluids or ice slush before activity starts.',
    'Use water dousing, cool towels, and fan-assisted cooling when feasible.',
    'Adjust session intensity or duration to reduce heat load.',
  ],
  extreme: [
    'Suspend exercise or match play where possible.',
    'Move all participants to shaded or air-conditioned areas.',
    'Initiate active cooling immediately and monitor symptoms closely.',
  ],
}

const daySeries: number[][] = [
  [1.2, 1.4, 1.6, 1.8, 1.9, 1.7, 1.5, 1.3], // moderate (today)
  [0.3, 0.5, 0.7, 0.8, 0.9, 0.8, 0.6, 0.4], // low
  [2.1, 2.3, 2.5, 2.7, 2.8, 2.6, 2.4, 2.2], // high
  [2.4, 2.8, 3.1, 3.3, 3.4, 3.2, 2.9, 2.6], // extreme
  [0.2, 0.4, 0.6, 0.7, 0.8, 0.7, 0.5, 0.3], // low
  [2.0, 2.2, 2.4, 2.6, 2.7, 2.5, 2.3, 2.1], // high
  [1.0, 1.2, 1.4, 1.6, 1.8, 1.7, 1.5, 1.2], // moderate
]

const timeMarks = Array.from({ length: 24 }, (_, hour) => `${String(hour).padStart(2, '0')}:00`)

function roundToOneDecimal(value: number): number {
  return Number(value.toFixed(1))
}

function expandThreeHourlySeriesToHourly(series: number[]): number[] {
  if (series.length !== 8) {
    return series
  }

  // Original anchors are in this order: 06:00, 09:00, 12:00, 15:00, 18:00, 21:00, 00:00, 03:00.
  const anchorByHour: Record<number, number> = {
    0: series[6],
    3: series[7],
    6: series[0],
    9: series[1],
    12: series[2],
    15: series[3],
    18: series[4],
    21: series[5],
  }

  return Array.from({ length: 24 }, (_, hour) => {
    const startHour = Math.floor(hour / 3) * 3
    const endHour = startHour + 3
    const startValue = anchorByHour[startHour]
    const endValue = endHour === 24 ? anchorByHour[0] : anchorByHour[endHour]
    const progress = (hour - startHour) / 3

    return roundToOneDecimal(startValue + (endValue - startValue) * progress)
  })
}

function toRiskLevel(maxScore: number): RiskLevel {
  if (maxScore > 3) {
    return 'extreme'
  }
  if (maxScore >= 2) {
    return 'high'
  }
  if (maxScore >= 1) {
    return 'moderate'
  }
  return 'low'
}

const baseDate = new Date()

export const forecastDays: ForecastDay[] = daySeries.map((series, index) => {
  const dayDate = new Date(baseDate)
  dayDate.setDate(baseDate.getDate() + index)

  const hourlySeries = expandThreeHourlySeriesToHourly(series)

  const points = hourlySeries.map((value, i) => ({
    time: timeMarks[i],
    value,
  }))

  const maxScore = Math.max(...hourlySeries)

  return {
    day: dayDate.toLocaleDateString('en-AU', { weekday: 'long' }),
    date: dayDate.toISOString(),
    risk: toRiskLevel(maxScore),
    points,
  }
})
