import { Accordion, List, Stack, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { RISK_REGISTRY } from "@/domain/riskRegistry";
import { useHomeHeatRisk } from "@/hooks/useHomeHeatRisk";
import { SectionCard } from "@/components/ui/SectionCard";

/**
 * Renders expanded recommendation details for the current risk level.
 */
export function DetailedRecommendationsSection() {
  const { t } = useTranslation();
  const { riskLevel } = useHomeHeatRisk();
  const details = RISK_REGISTRY[riskLevel];
  const description = t(details.detailedDescriptionKey);
  const suggestions = t(details.detailedSuggestionsKey, {
    returnObjects: true,
  }) as string[];

  return (
    <SectionCard>
      <Accordion
        chevronPosition="right"
        radius="md"
        defaultValue={null}
        styles={{
          item: {
            border: 0,
          },
          control: {
            border: 0,
          },
        }}
      >
        <Accordion.Item value="detailed-suggestions">
          <Accordion.Control>
            <Text fw={700}>{t("recommendations.detailed.accordionLabel")}</Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Stack gap="xs">
              <Text>{description}</Text>
              <Text>{t("recommendations.detailed.youShouldLabel")}</Text>
              <List spacing="xs" size="md">
                {suggestions.map((text) => (
                  <List.Item key={text}>{text}</List.Item>
                ))}
              </List>
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </SectionCard>
  );
}
