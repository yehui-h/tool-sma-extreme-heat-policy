import { Badge, Box, Center, Stack } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useHomeHeatRisk } from "@/hooks/useHomeHeatRisk";
import { createRiskLevelLabels } from "@/domain/riskLabels";
import { getRiskColor } from "@/domain/riskRegistry";
import { buildGaugeOption } from "@/lib/riskCharts";
import { CurrentRiskSkeleton } from "@/components/home/HomeSectionSkeletons";
import { SectionCard } from "@/components/ui/SectionCard";
import { EChart } from "@/components/ui/EChart";

const CURRENT_RISK_CHART_HEIGHT = 228;
const BADGE_SLOT_HEIGHT = 44;

/**
 * Renders the current risk gauge for the selected sport/location.
 */
export function CurrentRiskSection() {
  const { t } = useTranslation();
  const isMobile = useMediaQuery("(max-width: 48em)");
  const { risk, riskLevel, hasCalculatedRisk, isFetching } = useHomeHeatRisk();
  const shortRiskLabels = createRiskLevelLabels((key) => t(key), "short");
  const longRiskLabels = createRiskLevelLabels((key) => t(key), "long");

  if (!hasCalculatedRisk) {
    return (
      <SectionCard title={t("home.sections.currentRisk.title")}>
        <CurrentRiskSkeleton showLoader={isFetching} />
      </SectionCard>
    );
  }

  const gaugeLabels = {
    title: t("charts.gauge.seriesName"),
    riskLevelShort: shortRiskLabels,
  };
  const gaugeOption = buildGaugeOption(
    risk.riskLevelInterpolated,
    gaugeLabels,
    isMobile,
  );
  const riskBadgeColor = getRiskColor(riskLevel);
  const riskBadgeValue = longRiskLabels[riskLevel].toUpperCase();

  return (
    <SectionCard title={t("home.sections.currentRisk.title")}>
      <Stack gap={0}>
        <EChart option={gaugeOption} height={CURRENT_RISK_CHART_HEIGHT} />
        <Box h={BADGE_SLOT_HEIGHT} mt={isMobile ? -16 : -20}>
          <Center h="100%">
            <Badge
              component={Link}
              to="/detailed-recommendations"
              color={riskBadgeColor}
              size={isMobile ? "lg" : "xl"}
              radius="xl"
              style={{
                textDecoration: "none",
              }}
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
          </Center>
        </Box>
      </Stack>
    </SectionCard>
  );
}
