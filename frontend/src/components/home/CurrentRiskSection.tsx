import { Stack } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { useTranslation } from "react-i18next";
import { useHomeHeatRisk } from "@/hooks/useHomeHeatRisk";
import { createRiskLevelLabels } from "@/domain/riskLabels";
import { buildGaugeOption, buildPendingGaugeOption } from "@/lib/riskCharts";
import { SectionCard } from "@/components/ui/SectionCard";
import { EChart } from "@/components/ui/EChart";

/**
 * Renders the current risk gauge for the selected sport/location.
 */
export function CurrentRiskSection() {
  const { t } = useTranslation();
  const isMobile = useMediaQuery("(max-width: 48em)");
  const { risk, hasCalculatedRisk } = useHomeHeatRisk();
  const shortRiskLabels = createRiskLevelLabels((key) => t(key), "short");
  const gaugeLabels = {
    title: t("charts.gauge.seriesName"),
    riskLevelShort: shortRiskLabels,
  };
  const gaugeOption = hasCalculatedRisk
    ? buildGaugeOption(risk.riskLevelInterpolated, gaugeLabels, isMobile)
    : buildPendingGaugeOption(gaugeLabels, isMobile);
  const gaugeModeKey = hasCalculatedRisk ? "gauge-calculated" : "gauge-pending";

  return (
    <SectionCard title={t("home.sections.currentRisk.title")}>
      <Stack>
        {/* Force remount on mode switch to avoid ECharts gauge diff crash. */}
        <EChart key={gaugeModeKey} option={gaugeOption} height={260} />
      </Stack>
    </SectionCard>
  );
}
