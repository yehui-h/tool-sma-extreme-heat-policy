import { Image, SimpleGrid, Stack, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { RISK_REGISTRY } from "@/domain/riskRegistry";
import { useHomeHeatRisk } from "@/hooks/useHomeHeatRisk";
import { KeyRecommendationsSkeleton } from "@/components/home/HomeSectionSkeletons";
import { SectionCard } from "@/components/ui/SectionCard";

/**
 * Renders compact recommendation cards for the current risk level.
 */
export function KeyRecommendationsSection() {
  const { t } = useTranslation();
  const { riskLevel, hasCalculatedRisk, isFetching } = useHomeHeatRisk();

  if (!hasCalculatedRisk) {
    return (
      <SectionCard title={t("home.sections.keyRecommendations.title")}>
        <KeyRecommendationsSkeleton showLoader={isFetching} />
      </SectionCard>
    );
  }

  const labels = t(RISK_REGISTRY[riskLevel].keyRecommendationsKey, {
    returnObjects: true,
  }) as string[];
  const icons = RISK_REGISTRY[riskLevel].keyIconPaths;

  const recommendations = icons
    .map((icon, index) => ({ icon, label: labels[index] ?? "" }))
    .filter((item) => item.label);
  const recommendationColumnCount = Math.max(recommendations.length, 1);
  const mobileRecommendationColumnCount = Math.min(
    recommendationColumnCount,
    2,
  );

  return (
    <SectionCard title={t("home.sections.keyRecommendations.title")}>
      <SimpleGrid
        cols={{
          base: mobileRecommendationColumnCount,
          sm: recommendationColumnCount,
        }}
        spacing="sm"
      >
        {recommendations.map((item) => (
          <Stack key={item.label} align="center" gap="xs" p="md">
            <Image
              src={item.icon}
              alt={item.label}
              w={52}
              h={52}
              fit="contain"
            />
            <Text
              fw={600}
              ta="center"
              title={item.label}
              style={{
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {item.label}
            </Text>
          </Stack>
        ))}
      </SimpleGrid>
    </SectionCard>
  );
}
