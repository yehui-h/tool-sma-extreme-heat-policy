import { toRiskLevel } from '@/features/home/domain/homeRisk'
import type { ForecastDay } from '@/features/home/types'

const daySeries: number[][] = [
  [1.2, 1.4, 1.6, 1.8, 1.9, 1.7, 1.5, 1.3],
  [0.3, 0.5, 0.7, 0.8, 0.9, 0.8, 0.6, 0.4],
  [2.1, 2.3, 2.5, 2.7, 2.8, 2.6, 2.4, 2.2],
  [2.4, 2.8, 3.1, 3.3, 3.4, 3.2, 2.9, 2.6],
  [0.2, 0.4, 0.6, 0.7, 0.8, 0.7, 0.5, 0.3],
  [2.0, 2.2, 2.4, 2.6, 2.7, 2.5, 2.3, 2.1],
  [1.0, 1.2, 1.4, 1.6, 1.8, 1.7, 1.5, 1.2],
]

const timeMarks = Array.from({ length: 24 }, (_, hour) => `${String(hour).padStart(2, '0')}:00`)

function roundToOneDecimal(value: number): number {
  return Number(value.toFixed(1))
}

function expandThreeHourlySeriesToHourly(series: number[]): number[] {
  if (series.length !== 8) {
    return series
  }

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

const baseDate = new Date()

export const forecastFixture: ForecastDay[] = daySeries.map((series, index) => {
  const dayDate = new Date(baseDate)
  dayDate.setDate(baseDate.getDate() + index)

  const hourlySeries = expandThreeHourlySeriesToHourly(series)

  return {
    day: dayDate.toLocaleDateString('en-AU', { weekday: 'long' }),
    date: dayDate.toISOString(),
    risk: toRiskLevel(Math.max(...hourlySeries)),
    points: hourlySeries.map((value, hourIndex) => ({
      time: timeMarks[hourIndex],
      value,
    })),
  }
})
