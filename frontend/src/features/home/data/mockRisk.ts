import type {
  CurrentRiskData,
  ForecastDay,
  RecommendationItem,
  RiskLevel,
  SelectOption,
} from '@/features/home/types'

export const sportOptions: SelectOption[] = [
  { value: 'soccer', label: 'Soccer' },
  { value: 'rugby', label: 'Rugby Union' },
  { value: 'cricket', label: 'Cricket' },
  { value: 'netball', label: 'Netball' },
  { value: 'tennis', label: 'Tennis' },
]

export const currentRisk: CurrentRiskData = {
  title: 'Current Sport Heat Score',
  score: 3.1,
  level: 'high',
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
  [2.2, 2.5, 2.8, 3.1, 3.4, 3.2, 2.9, 2.4],
  [2.0, 2.4, 2.9, 3.0, 3.3, 3.5, 3.1, 2.7],
  [1.8, 2.2, 2.6, 2.9, 3.1, 3.0, 2.5, 2.1],
  [2.1, 2.6, 3.0, 3.2, 3.6, 3.8, 3.3, 2.9],
  [1.9, 2.3, 2.7, 3.0, 3.2, 3.1, 2.6, 2.2],
  [2.3, 2.7, 3.2, 3.5, 3.7, 3.4, 3.0, 2.5],
  [2.0, 2.4, 2.8, 3.1, 3.3, 3.2, 2.7, 2.3],
]

const timeMarks = ['06:00', '09:00', '12:00', '15:00', '18:00', '21:00', '00:00', '03:00']

function toRiskLevel(maxScore: number): RiskLevel {
  if (maxScore >= 3.5) {
    return 'extreme'
  }
  if (maxScore >= 3) {
    return 'high'
  }
  if (maxScore >= 2) {
    return 'moderate'
  }
  return 'low'
}

const baseDate = new Date()

export const forecastDays: ForecastDay[] = daySeries.map((series, index) => {
  const dayDate = new Date(baseDate)
  dayDate.setDate(baseDate.getDate() + index)

  const points = series.map((value, i) => ({
    time: timeMarks[i],
    value,
  }))

  const maxScore = Math.max(...series)

  return {
    day: dayDate.toLocaleDateString('en-AU', { weekday: 'long' }),
    date: dayDate.toISOString(),
    risk: toRiskLevel(maxScore),
    points,
  }
})
