import { Badge, Group, Stack } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { useTranslation } from "react-i18next";
import { useHomeHeatRisk } from "@/hooks/useHomeHeatRisk";
import { createRiskLevelLabels } from "@/domain/riskLabels";
import { getRiskColor, RISK_LEVELS } from "@/domain/riskRegistry";
import { buildGaugeOption, buildPendingGaugeOption } from "@/lib/riskCharts";
import { SectionCard } from "@/components/ui/SectionCard";
import { EChart } from "@/components/ui/EChart";

const CURRENT_RISK_CHART_HEIGHT = 228;

/**
 * Renders the current risk gauge for the selected sport/location.
 */
export function CurrentRiskSection() {
  const { t } = useTranslation();
  const isMobile = useMediaQuery("(max-width: 48em)");
  const { risk, riskLevel, hasCalculatedRisk } = useHomeHeatRisk();
  const shortRiskLabels = createRiskLevelLabels((key) => t(key), "short");
  const longRiskLabels = createRiskLevelLabels((key) => t(key), "long");
  const gaugeLabels = {
    title: t("charts.gauge.seriesName"),
    riskLevelShort: shortRiskLabels,
  };
  const gaugeOption = hasCalculatedRisk
    ? buildGaugeOption(risk.riskLevelInterpolated, gaugeLabels, isMobile)
    : buildPendingGaugeOption(gaugeLabels, isMobile);
  const gaugeModeKey = hasCalculatedRisk ? "gauge-calculated" : "gauge-pending";
  const riskBadgeColor = getRiskColor(riskLevel);
  const riskBadgeValue = longRiskLabels[riskLevel].toUpperCase();

  return (
    <SectionCard title={t("home.sections.currentRisk.title")}>
      <Stack gap={0}>
        {/* Force remount on mode switch to avoid ECharts gauge diff crash. */}
        <EChart
          key={gaugeModeKey}
          option={gaugeOption}
          height={CURRENT_RISK_CHART_HEIGHT}
        />
        {hasCalculatedRisk ? (
          <Badge
            color={riskBadgeColor}
            mx="auto"
            mt={isMobile ? -16 : -20}
            size={isMobile ? "lg" : "xl"}
            radius="xl"
            styles={{
              root: {
                paddingInline: isMobile ? 16 : 20,
              },
              label: {
                fontSize: isMobile ? "1rem" : "1.125rem",
                fontWeight: 700,
                letterSpacing: "0.06em",
              },
            }}
          >
            {riskBadgeValue}
          </Badge>
        ) : (
          <Group
            justify="center"
            wrap="nowrap"
            gap={isMobile ? 6 : "xs"}
            mt={isMobile ? -16 : -20}
          >
            {RISK_LEVELS.map((level) => (
              <Badge
                key={level}
                color={getRiskColor(level)}
                radius="xl"
                size={isMobile ? "sm" : "md"}
                styles={{
                  root: {
                    paddingInline: isMobile ? 10 : 12,
                  },
                  label: {
                    fontSize: isMobile ? "0.72rem" : "0.8rem",
                    fontWeight: 700,
                    letterSpacing: "0.03em",
                  },
                }}
              >
                {longRiskLabels[level].toUpperCase()}
              </Badge>
            ))}
          </Group>
        )}
      </Stack>
    </SectionCard>
  );
}
