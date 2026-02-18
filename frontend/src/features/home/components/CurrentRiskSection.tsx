import { Badge, Group, Stack, Text } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { EChart } from '@/shared/ui/EChart'
import { SectionCard } from '@/shared/ui/SectionCard'
import { buildGaugeOption, getRiskColor } from '@/features/home/lib/riskChartOptions'
import type { CurrentRiskData } from '@/features/home/types'

interface CurrentRiskSectionProps {
  risk: CurrentRiskData
}

export function CurrentRiskSection({ risk }: CurrentRiskSectionProps) {
  const isMobile = useMediaQuery('(max-width: 48em)')

  return (
    <SectionCard title={risk.title}>
      <Stack gap="sm">
        <EChart option={buildGaugeOption(risk.score, isMobile)} height={260} />
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
