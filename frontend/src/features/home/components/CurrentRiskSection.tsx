import { Badge, Group, Stack } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { EChart } from '@/shared/ui/EChart'
import { SectionCard } from '@/shared/ui/SectionCard'
import { buildGaugeOption, getRiskColor } from '@/features/home/lib/riskChartOptions'
import { get_risk_level_from_risk_level_interpolated } from '@/features/home/domain/riskLevel'
import type { CurrentRiskData } from '@/features/home/types'

interface CurrentRiskSectionProps {
  risk: CurrentRiskData
}

export function CurrentRiskSection({ risk }: CurrentRiskSectionProps) {
  const isMobile = useMediaQuery('(max-width: 48em)')
  const risk_level = get_risk_level_from_risk_level_interpolated(risk.risk_level_interpolated)

  return (
    <SectionCard title="Current Sport Heat Score">
      <Stack gap="sm">
        <EChart option={buildGaugeOption(risk.risk_level_interpolated, isMobile)} height={260} />
        <Group justify="center">
          <Badge color={getRiskColor(risk_level)} size="lg" variant="filled">
            {risk_level.toUpperCase()}
          </Badge>
        </Group>
      </Stack>
    </SectionCard>
  )
}
