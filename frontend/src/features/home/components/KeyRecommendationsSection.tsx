import { Image, Paper, SimpleGrid, Stack, Text } from "@mantine/core";
import { keyRecommendationsByRisk } from "@/features/home/content/recommendations";
import type { RiskLevel } from "@/features/home/types";
import { SectionCard } from "@/shared/ui/SectionCard";

interface KeyRecommendationsSectionProps {
  riskLevel: RiskLevel;
}

export function KeyRecommendationsSection({
  riskLevel,
}: KeyRecommendationsSectionProps) {
  const recommendations = keyRecommendationsByRisk[riskLevel];

  return (
    <SectionCard title="Key recommendations:">
      <SimpleGrid
        cols={{ base: 1, xs: 2, sm: recommendations.length > 3 ? 4 : 3 }}
        spacing="sm"
      >
        {recommendations.map((item) => (
          <Paper key={item.label} withBorder radius="md" p="md" bg="gray.0">
            <Stack align="center" gap="xs">
              <Image
                src={item.icon}
                alt={item.label}
                w={52}
                h={52}
                fit="contain"
              />
              <Text fz="md" fw={600} ta="center">
                {item.label}
              </Text>
            </Stack>
          </Paper>
        ))}
      </SimpleGrid>
    </SectionCard>
  );
}
