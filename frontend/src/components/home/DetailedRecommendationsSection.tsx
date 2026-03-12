import { Accordion, Image, List, SimpleGrid, Stack, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import {
  RISK_LEVELS,
  RISK_REGISTRY,
  getRiskColor,
} from "@/domain/riskRegistry";
import { SectionCard } from "@/components/ui/SectionCard";

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
          const description = t(details.detailedDescriptionKey);
          const suggestions = toStringArray(
            t(details.detailedSuggestionsKey, {
              returnObjects: true,
            }),
          );

          return (
            <Accordion.Item key={level} value={level}>
              <Accordion.Control>
                <Text fw={700} tt="uppercase" c={getRiskColor(level)}>
                  {t(details.levelKey).toUpperCase()}
                </Text>
              </Accordion.Control>
              <Accordion.Panel>
                <Stack gap="xs">
                  <SimpleGrid
                    cols={{
                      base: mobileKeyRecommendationColumnCount,
                      sm: keyRecommendationColumnCount,
                    }}
                    spacing="sm"
                  >
                    {keyRecommendations.map((item) => (
                      <Stack key={item.label} align="center" gap="xs" p="sm">
                        <Image
                          src={item.iconPath}
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
