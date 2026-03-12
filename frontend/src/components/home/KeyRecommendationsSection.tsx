import { Box, Image, SimpleGrid, Stack, Text } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { useTranslation } from "react-i18next";
import { RISK_REGISTRY } from "@/domain/riskRegistry";
import { useHomeHeatRisk } from "@/hooks/useHomeHeatRisk";
import { KeyRecommendationsSkeleton } from "@/components/home/HomeSectionSkeletons";
import { SectionCard } from "@/components/ui/SectionCard";

const MOBILE_RECOMMENDATION_GRID_SPACING = "xs";
const DESKTOP_RECOMMENDATION_GRID_SPACING = "sm";
const MOBILE_RECOMMENDATION_CARD_PADDING = "xs";
const DESKTOP_RECOMMENDATION_CARD_PADDING = "md";
const MOBILE_RECOMMENDATION_CARD_GAP = 4;
const DESKTOP_RECOMMENDATION_CARD_GAP = "xs";
const COMPACT_RECOMMENDATION_LAYOUT_QUERY = "(max-width: 36em)";

/**
 * Renders compact recommendation cards for the current risk level.
 */
export function KeyRecommendationsSection() {
  const { t } = useTranslation();
  const isCompactRecommendationLayout = useMediaQuery(
    COMPACT_RECOMMENDATION_LAYOUT_QUERY,
  );
  const heatRisk = useHomeHeatRisk();

  if (!heatRisk.hasCalculatedRisk) {
    return (
      <SectionCard title={t("home.sections.keyRecommendations.title")}>
        <KeyRecommendationsSkeleton showLoader={heatRisk.isFetching} />
      </SectionCard>
    );
  }

  const labels = t(RISK_REGISTRY[heatRisk.riskLevel].keyRecommendationsKey, {
    returnObjects: true,
  }) as string[];
  const icons = RISK_REGISTRY[heatRisk.riskLevel].keyIconPaths;

  const recommendations = icons
    .map((icon, index) => ({ icon, label: labels[index] ?? "" }))
    .filter((item) => item.label);
  const recommendationColumnCount = Math.max(recommendations.length, 1);
  const mobileRecommendationColumnCount = Math.min(
    recommendationColumnCount,
    2,
  );
  const shouldCenterLastRecommendation =
    isCompactRecommendationLayout &&
    mobileRecommendationColumnCount === 2 &&
    recommendations.length > 1 &&
    recommendations.length % 2 === 1;

  return (
    <SectionCard title={t("home.sections.keyRecommendations.title")}>
      <SimpleGrid
        cols={{
          base: mobileRecommendationColumnCount,
          xs: recommendationColumnCount,
        }}
        spacing={
          isCompactRecommendationLayout
            ? MOBILE_RECOMMENDATION_GRID_SPACING
            : DESKTOP_RECOMMENDATION_GRID_SPACING
        }
      >
        {recommendations.map((item, index) => (
          <Box
            key={item.label}
            style={
              shouldCenterLastRecommendation &&
              index === recommendations.length - 1
                ? {
                    gridColumn: "1 / -1",
                    display: "flex",
                    justifyContent: "center",
                  }
                : undefined
            }
          >
            <Stack
              align="center"
              gap={
                isCompactRecommendationLayout
                  ? MOBILE_RECOMMENDATION_CARD_GAP
                  : DESKTOP_RECOMMENDATION_CARD_GAP
              }
              p={
                isCompactRecommendationLayout
                  ? MOBILE_RECOMMENDATION_CARD_PADDING
                  : DESKTOP_RECOMMENDATION_CARD_PADDING
              }
            >
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
          </Box>
        ))}
      </SimpleGrid>
    </SectionCard>
  );
}
