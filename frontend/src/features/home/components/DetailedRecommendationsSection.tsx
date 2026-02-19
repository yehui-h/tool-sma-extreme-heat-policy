import { Accordion, List, Paper, Stack, Text } from "@mantine/core";
import { detailedSuggestionsByRisk } from "@/features/home/content/recommendations";
import type { RiskLevel } from "@/features/home/types";

interface DetailedRecommendationsSectionProps {
  riskLevel: RiskLevel;
}

export function DetailedRecommendationsSection({
  riskLevel,
}: DetailedRecommendationsSectionProps) {
  const details = detailedSuggestionsByRisk[riskLevel];

  return (
    <Paper shadow="xs" radius="md" p={{ base: 4, sm: "md" }} withBorder>
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
            <Text fw={700}>Detailed suggestions</Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Stack gap="xs">
              <Text>{details.description}</Text>
              {/*todo never have text embedded in the component*/}
              <Text>You should:</Text>
              <List spacing="xs" size="md">
                {details.suggestions.map((text) => (
                  <List.Item key={text}>{text}</List.Item>
                ))}
              </List>
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </Paper>
  );
}
