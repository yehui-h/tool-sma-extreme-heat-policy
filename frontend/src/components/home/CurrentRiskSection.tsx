import { Badge, Group, Stack } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { useTranslation } from "react-i18next";
import { useHomeHeatRisk } from "@/hooks/useHomeHeatRisk";
import { createRiskLevelLabels } from "@/domain/riskLabels";
import { getRiskColor, getRiskLevelI18nKeys } from "@/domain/riskRegistry";
import { buildGaugeOption } from "@/lib/riskCharts";
import { SectionCard } from "@/components/ui/SectionCard";
import { EChart } from "@/components/ui/EChart";

/**
 * Renders the current risk gauge and badge for the selected sport/location.
 */
export function CurrentRiskSection() {
  const { t } = useTranslation();
  const isMobile = useMediaQuery("(max-width: 48em)");
  const { risk, riskLevel } = useHomeHeatRisk();
  const shortRiskLabels = createRiskLevelLabels((key) => t(key), "short");
  const riskLevelKeys = getRiskLevelI18nKeys(riskLevel);

  const gaugeLabels = {
    title: t("charts.gauge.seriesName"),
    riskLevelShort: shortRiskLabels,
  };

  return (
    <SectionCard title={t("home.sections.currentRisk.title")}>
      <Stack>
        <EChart
          option={buildGaugeOption(
            risk.riskLevelInterpolated,
            gaugeLabels,
            isMobile,
          )}
          height={260}
        />
        <Group justify="center">
          <Badge color={getRiskColor(riskLevel)} size="lg" variant="filled">
            {t(riskLevelKeys.levelKey).toUpperCase()}
          </Badge>
        </Group>
      </Stack>
    </SectionCard>
  );
}
