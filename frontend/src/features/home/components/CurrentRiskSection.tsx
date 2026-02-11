import { Badge, Group, Stack, Text } from '@mantine/core'
import { EChart } from '@/shared/ui/EChart'
import { SectionCard } from '@/shared/ui/SectionCard'
import { buildGaugeOption, getRiskColor } from '@/features/home/lib/riskChartOptions'
import type { CurrentRiskData } from '@/features/home/types'

interface CurrentRiskSectionProps {
  risk: CurrentRiskData
}

export function CurrentRiskSection({ risk }: CurrentRiskSectionProps) {
  return (
    <SectionCard title={risk.title} subtitle="Based on the selected sport and location (mock data for this phase).">
      <Stack gap="sm">
        <EChart option={buildGaugeOption(risk.score)} height={260} />
        <Group justify="center">
          <Badge color={getRiskColor(risk.level)} size="lg" variant="filled">
            {risk.level.toUpperCase()}
          </Badge>
        </Group>
        <Text c="dimmed" ta="center">
          {risk.shortSummary}
        </Text>
      </Stack>
    </SectionCard>
  )
}
