import { Badge, Group, Stack } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { toRiskLevel } from '@/features/home/domain/homeRisk'
import { buildGaugeOption, getRiskColor } from '@/features/home/lib/riskChartOptions'
import { SectionCard } from '@/shared/ui/SectionCard'
import { EChart } from '@/shared/ui/EChart'
import type { CurrentRiskData } from '@/features/home/types'

interface CurrentRiskSectionProps {
  risk: CurrentRiskData
}

export function CurrentRiskSection({ risk }: CurrentRiskSectionProps) {
  const isMobile = useMediaQuery('(max-width: 48em)')
  const riskLevel = toRiskLevel(risk.riskLevelInterpolated)

  return (
    <SectionCard title="Current Sport Heat Score">
      <Stack gap="sm">
        <EChart option={buildGaugeOption(risk.riskLevelInterpolated, isMobile)} height={260} />
        <Group justify="center">
          <Badge color={getRiskColor(riskLevel)} size="lg" variant="filled">
            {riskLevel.toUpperCase()}
          </Badge>
        </Group>
      </Stack>
    </SectionCard>
  )
}
