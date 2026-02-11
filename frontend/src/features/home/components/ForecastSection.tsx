import { Accordion, Badge, Group, Stack, Text } from '@mantine/core'
import { EChart } from '@/shared/ui/EChart'
import { SectionCard } from '@/shared/ui/SectionCard'
import { forecastDays } from '@/features/home/data/mockRisk'
import { formatDateLabel } from '@/shared/lib/formatDate'
import { buildForecastOption, getRiskColor } from '@/features/home/lib/riskChartOptions'

export function ForecastSection() {
  const [today, ...nextDays] = forecastDays

  return (
    <SectionCard title="Forecasted risk" subtitle="Hourly trend and next-day outlook (mock 7-day forecast).">
      <Stack gap="md">
        <EChart option={buildForecastOption(today.points, 'Forecasted risk for today')} height={260} />

        <Accordion chevronPosition="right" variant="separated" radius="md">
          {nextDays.map((day) => (
            <Accordion.Item key={day.date} value={day.date}>
              <Accordion.Control>
                <Group justify="space-between" wrap="nowrap">
                  <Stack gap={0}>
                    <Text fw={600}>{day.day}</Text>
                    <Text c="dimmed" fz="xs">
                      {formatDateLabel(day.date)}
                    </Text>
                  </Stack>
                  <Badge color={getRiskColor(day.risk)}>{day.risk.toUpperCase()}</Badge>
                </Group>
              </Accordion.Control>
              <Accordion.Panel>
                <EChart option={buildForecastOption(day.points)} height={180} />
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion>
      </Stack>
    </SectionCard>
  )
}
