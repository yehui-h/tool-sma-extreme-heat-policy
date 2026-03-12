import { IconInfoCircle } from "@tabler/icons-react";
import { Badge, Box, Center, Stack } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useHomeHeatRisk } from "@/hooks/useHomeHeatRisk";
import { createRiskLevelLabels } from "@/domain/riskLabels";
import { getRiskBadgeForegroundColor, getRiskColor } from "@/domain/riskRegistry";
import { buildGaugeOption } from "@/lib/riskCharts";
import { CurrentRiskSkeleton } from "@/components/home/HomeSectionSkeletons";
import { SectionCard } from "@/components/ui/SectionCard";
import { EChart } from "@/components/ui/EChart";

const CURRENT_RISK_CHART_HEIGHT = 228;
const BADGE_SLOT_HEIGHT = 44;
const BADGE_INFO_ICON_SIZE = 14;
const BADGE_INFO_ICON_STROKE = 2;

/**
 * Renders the current risk gauge for the selected sport/location.
 */
export function CurrentRiskSection() {
  const { t } = useTranslation();
  const isMobile = useMediaQuery("(max-width: 48em)");
  const heatRisk = useHomeHeatRisk();
  const shortRiskLabels = createRiskLevelLabels((key) => t(key), "short");
  const longRiskLabels = createRiskLevelLabels((key) => t(key), "long");

  if (!heatRisk.hasCalculatedRisk) {
    return (
      <SectionCard title={t("home.sections.currentRisk.title")}>
        <CurrentRiskSkeleton showLoader={heatRisk.isFetching} />
      </SectionCard>
    );
  }

  const gaugeLabels = {
    title: t("charts.gauge.seriesName"),
    riskLevelShort: shortRiskLabels,
  };
  const gaugeOption = buildGaugeOption(
    heatRisk.risk.riskLevelInterpolated,
    gaugeLabels,
    isMobile,
  );
  const riskBadgeColor = getRiskColor(heatRisk.riskLevel);
  const riskBadgeForegroundColor = getRiskBadgeForegroundColor(
    heatRisk.riskLevel,
  );
  const riskBadgeValue = longRiskLabels[heatRisk.riskLevel].toUpperCase();

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
              rightSection={
                <IconInfoCircle
                  size={BADGE_INFO_ICON_SIZE}
                  stroke={BADGE_INFO_ICON_STROKE}
                  aria-hidden={true}
                />
              }
              style={{
                textDecoration: "none",
              }}
              styles={{
                root: {
                  color: riskBadgeForegroundColor,
                  paddingInlineStart: isMobile ? 16 : 20,
                  paddingInlineEnd: isMobile ? 10 : 14,
                },
                label: {
                  fontSize: isMobile ? "1rem" : "1.125rem",
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  textAlign: "left",
                },
                section: {
                  marginInlineStart: isMobile ? 4 : 6,
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
