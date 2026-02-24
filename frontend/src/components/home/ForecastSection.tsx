import { Accordion, Badge, Group, Stack, Text } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { useTranslation } from "react-i18next";
import { createRiskLevelLabels } from "@/domain/riskLabels";
import { getRiskColor, getRiskLevelI18nKeys } from "@/domain/riskRegistry";
import { buildForecastOption } from "@/lib/riskCharts";
import { formatDateLabel, formatWeekdayLabel } from "@/lib/formatDate";
import { EChart } from "@/components/ui/EChart";
import { SectionCard } from "@/components/ui/SectionCard";
import { useHomeStore } from "@/store/homeStore";

const FORECAST_CHART_HEIGHT = 340;

/**
 * Renders the 24-hour forecast chart and upcoming daily forecast accordions.
 */
export function ForecastSection() {
  const { t } = useTranslation();
  const isMobile = useMediaQuery("(max-width: 48em)");
  const forecast = useHomeStore((state) => state.forecast);

  if (forecast.length === 0) {
    return null;
  }

  const [today, ...nextDays] = forecast;
  const longRiskLabels = createRiskLevelLabels((key) => t(key), "long");

  const forecastLabels = {
    xAxisName: t("charts.forecast.xAxisName"),
    yAxisRiskName: t("charts.forecast.yAxisRiskName"),
    tooltipRiskLabel: t("charts.forecast.tooltipRiskLabel"),
    riskLevelLong: longRiskLabels,
  };

  return (
    <SectionCard title={t("home.sections.forecast.title")}>
      <Stack>
        <EChart
          option={buildForecastOption(
            today.points,
            forecastLabels,
            undefined,
            isMobile,
          )}
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
            panel: {
              paddingTop: 0,
            },
          }}
        >
          {nextDays.map((day) => (
            <Accordion.Item key={day.date} value={day.date}>
              <Accordion.Control>
                <Group justify="space-between" wrap="nowrap">
                  <Stack gap={0}>
                    <Text fw={600}>{formatWeekdayLabel(day.date)}</Text>
                    <Text c="dimmed" fz="sm">
                      {formatDateLabel(day.date)}
                    </Text>
                  </Stack>
                  <Badge color={getRiskColor(day.risk)}>
                    {t(getRiskLevelI18nKeys(day.risk).levelKey).toUpperCase()}
                  </Badge>
                </Group>
              </Accordion.Control>
              <Accordion.Panel>
                <EChart
                  option={buildForecastOption(
                    day.points,
                    forecastLabels,
                    undefined,
                    isMobile,
                  )}
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
