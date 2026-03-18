import {
  Accordion,
  Badge,
  Box,
  Image,
  List,
  SimpleGrid,
  Stack,
  Text,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { useTranslation } from "react-i18next";
import {
  RISK_LEVELS,
  RISK_REGISTRY,
  getRiskBadgeForegroundColor,
  getRiskColor,
} from "@/domain/riskRegistry";
import { SectionCard } from "@/components/ui/SectionCard";
import {
  COMPACT_RECOMMENDATION_LAYOUT_QUERY,
  getActionImageIconSize,
} from "@/config/uiScale";

const MOBILE_RECOMMENDATION_GRID_SPACING = "xs";
const DESKTOP_RECOMMENDATION_GRID_SPACING = "sm";
const MOBILE_RECOMMENDATION_CARD_PADDING = "xs";
const DESKTOP_RECOMMENDATION_CARD_PADDING = "sm";
const MOBILE_RECOMMENDATION_CARD_GAP = 4;
const DESKTOP_RECOMMENDATION_CARD_GAP = "xs";

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

/**
 * Renders static detailed recommendations for all risk levels.
 */
export function DetailedRecommendationsSection() {
  const { t } = useTranslation();
  const isCompactRecommendationLayout = useMediaQuery(
    COMPACT_RECOMMENDATION_LAYOUT_QUERY,
  );

  return (
    <SectionCard title={t("recommendations.manual.title")}>
      <Accordion
        chevronPosition="right"
        variant="separated"
        radius="md"
        defaultValue="low"
      >
        {RISK_LEVELS.map((level) => {
          const details = RISK_REGISTRY[level];
          const keyLabels = toStringArray(
            t(details.keyRecommendationsKey, {
              returnObjects: true,
            }),
          );
          const keyRecommendations = details.keyIconPaths
            .map((iconPath, index) => ({
              iconPath,
              label: keyLabels[index] ?? "",
            }))
            .filter((item) => item.label);
          const keyRecommendationColumnCount = Math.max(
            keyRecommendations.length,
            1,
          );
          const mobileKeyRecommendationColumnCount = Math.min(
            keyRecommendationColumnCount,
            2,
          );
          const shouldCenterLastRecommendation =
            isCompactRecommendationLayout &&
            mobileKeyRecommendationColumnCount === 2 &&
            keyRecommendations.length > 1 &&
            keyRecommendations.length % 2 === 1;
          const recommendationIconSize = getActionImageIconSize(
            isCompactRecommendationLayout,
          );
          const description = t(details.detailedDescriptionKey);
          const suggestions = toStringArray(
            t(details.detailedSuggestionsKey, {
              returnObjects: true,
            }),
          );

          return (
            <Accordion.Item key={level} value={level}>
              <Accordion.Control>
                <Badge
                  color={getRiskColor(level)}
                  size="lg"
                  styles={{
                    root: {
                      color: getRiskBadgeForegroundColor(level),
                      paddingInline: 16,
                    },
                    label: {
                      fontSize: "var(--mantine-font-size-md)",
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                    },
                  }}
                >
                  {t(details.levelKey).toUpperCase()}
                </Badge>
              </Accordion.Control>
              <Accordion.Panel>
                <Stack gap="xs">
                  <SimpleGrid
                    cols={{
                      base: mobileKeyRecommendationColumnCount,
                      xs: keyRecommendationColumnCount,
                    }}
                    spacing={
                      isCompactRecommendationLayout
                        ? MOBILE_RECOMMENDATION_GRID_SPACING
                        : DESKTOP_RECOMMENDATION_GRID_SPACING
                    }
                  >
                    {keyRecommendations.map((item, index) => (
                      <Box
                        key={item.label}
                        style={
                          shouldCenterLastRecommendation &&
                          index === keyRecommendations.length - 1
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
                            src={item.iconPath}
                            alt={item.label}
                            w={recommendationIconSize}
                            h={recommendationIconSize}
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
                  <Text>{description}</Text>
                  <Text>{t("recommendations.detailed.youShouldLabel")}</Text>
                  <List spacing="xs" size="md">
                    {suggestions.map((text, index) => (
                      <List.Item key={`${level}-suggestion-${index}`}>
                        {text}
                      </List.Item>
                    ))}
                  </List>
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>
          );
        })}
      </Accordion>
    </SectionCard>
  );
}
