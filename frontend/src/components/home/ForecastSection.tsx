// Reduce nesting and improve spacing: use a clearer Stack gap, responsive chart height, and fewer small wrapper components
import { Accordion, Badge, Flex, Group, Stack, Text } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { useTranslation } from "react-i18next";
import { useHomeHeatRisk } from "@/hooks/useHomeHeatRisk";
import { createRiskLevelLabels } from "@/domain/riskLabels";
import { getRiskColor, getRiskLevelI18nKeys } from "@/domain/riskRegistry";
import { buildForecastOption } from "@/lib/riskCharts";
import { formatDateLabel, formatWeekdayLabel } from "@/lib/formatDate";
import { ForecastSkeleton } from "@/components/home/HomeSectionSkeletons";
import { EChart } from "@/components/ui/EChart";
import { SectionCard } from "@/components/ui/SectionCard";

const DEFAULT_FORECAST_CHART_HEIGHT = 340;
const MOBILE_FORECAST_CHART_HEIGHT = 280;

/**
 * Renders the 24-hour forecast chart and upcoming daily forecast accordions.
 */
export function ForecastSection() {
  const { t } = useTranslation();
  const isMobile = useMediaQuery("(max-width: 48em)");
  const { hasCalculatedRisk, isFetching, forecast } = useHomeHeatRisk();

  if (!hasCalculatedRisk) {
    return (
      <SectionCard title={t("home.sections.forecast.title")}>
        <ForecastSkeleton showLoader={isFetching} />
      </SectionCard>
    );
  }

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

  const chartHeight = isMobile
    ? MOBILE_FORECAST_CHART_HEIGHT
    : DEFAULT_FORECAST_CHART_HEIGHT;

  return (
    <SectionCard title={t("home.sections.forecast.title")}>
      {/* Use a single Stack with an explicit gap to control spacing between chart and accordion */}
      <Stack gap="md">
        <EChart
          option={buildForecastOption(
            today.points,
            forecastLabels,
            undefined,
            isMobile,
          )}
          height={chartHeight}
        />

        <Accordion chevronPosition="right" variant="separated" radius="md">
          {nextDays.map((day) => (
            <Accordion.Item key={day.date} value={day.date}>
              <Accordion.Control>
                <Group justify="space-between" wrap="nowrap">
                  {/* Reduced nesting: simple column for weekday + date */}
                  <Flex direction={"column"}>
                    <Text fw={600}>{formatWeekdayLabel(day.date)}</Text>
                    <Text c="dimmed" fz="sm">
                      {formatDateLabel(day.date)}
                    </Text>
                  </Flex>
                  <Badge color={getRiskColor(day.risk)} mr={"sm"}>
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
                  height={chartHeight}
                />
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion>
      </Stack>
    </SectionCard>
  );
}
