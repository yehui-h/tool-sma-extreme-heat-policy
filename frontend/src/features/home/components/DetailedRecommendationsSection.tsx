import { List, Text } from '@mantine/core'
import { SectionCard } from '@/shared/ui/SectionCard'
import { detailedRecommendationsByRisk } from '@/features/home/data/mockRisk'
import type { RiskLevel } from '@/features/home/types'

interface DetailedRecommendationsSectionProps {
  riskLevel: RiskLevel
}

export function DetailedRecommendationsSection({ riskLevel }: DetailedRecommendationsSectionProps) {
  const details = detailedRecommendationsByRisk[riskLevel]

  return (
    <SectionCard title="Detailed recommendations" subtitle="Guidance adapted from SMA-aligned heat risk response principles.">
      <Text c="dimmed" fz="sm">
        Vigorous exercise places some people at risk of heat illness, especially in hot weather.
      </Text>
      <List spacing="xs" size="sm" center>
        {details.map((text) => (
          <List.Item key={text}>{text}</List.Item>
        ))}
      </List>
    </SectionCard>
  )
}
