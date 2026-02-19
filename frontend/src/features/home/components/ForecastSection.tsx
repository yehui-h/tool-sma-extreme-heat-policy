import { Accordion, Badge, Group, Stack, Text } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { forecastFixture } from "@/features/home/fixtures/forecastFixture";
import {
  buildForecastOption,
  getRiskColor,
} from "@/features/home/lib/riskChartOptions";
import { formatDateLabel } from "@/shared/lib/formatDate";
import { EChart } from "@/shared/ui/EChart";
import { SectionCard } from "@/shared/ui/SectionCard";

const FORECAST_CHART_HEIGHT = 340;

export function ForecastSection() {
  const isMobile = useMediaQuery("(max-width: 48em)");
  const [today, ...nextDays] = forecastFixture;

  return (
    <SectionCard title="Forecasted risk">
      <Stack gap="sm">
        <EChart
          option={buildForecastOption(today.points, undefined, isMobile)}
          height={FORECAST_CHART_HEIGHT}
        />

        <Accordion
          chevronPosition="right"
          variant="separated"
          radius="md"
          styles={{
            control: {
              paddingInline: 12,
              paddingBlock: 10,
            },
            content: {
              paddingInline: 0,
              paddingTop: 0,
              paddingBottom: 8,
            },
          }}
        >
          {nextDays.map((day) => (
            <Accordion.Item key={day.date} value={day.date}>
              <Accordion.Control>
                <Group justify="space-between" wrap="nowrap">
                  <Stack gap={0}>
                    <Text fw={600}>{day.day}</Text>
                    <Text c="dimmed" fz="sm">
                      {formatDateLabel(day.date)}
                    </Text>
                  </Stack>
                  <Badge color={getRiskColor(day.risk)}>
                    {day.risk.toUpperCase()}
                  </Badge>
                </Group>
              </Accordion.Control>
              <Accordion.Panel style={{ paddingTop: 0 }}>
                <EChart
                  option={buildForecastOption(day.points, undefined, isMobile)}
                  height={FORECAST_CHART_HEIGHT}
                />
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion>
      </Stack>
    </SectionCard>
  );
}
