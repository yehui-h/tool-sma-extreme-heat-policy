import { Box } from "@mantine/core";
import { useElementSize, useMediaQuery } from "@mantine/hooks";
import type { RiskLevel } from "@/domain/risk";
import {
  buildRiskGaugeOption,
  formatRiskGaugeValue,
  getRiskGaugeValueLayout,
  RISK_GAUGE_HEIGHT_RATIO,
  RISK_GAUGE_MAX_WIDTH,
  RISK_GAUGE_MIN_WIDTH,
} from "@/lib/riskGauge";
import { EChart } from "@/components/ui/EChart";

interface RiskGaugeProps {
  score: number;
  title: string;
  unavailableLabel: string;
  riskLevelLabels: Record<RiskLevel, string>;
}

/**
 * Renders the current-risk gauge using ECharts, tuned to resemble the legacy half-circle design.
 */
export function RiskGauge({
  score,
  title,
  unavailableLabel,
  riskLevelLabels,
}: RiskGaugeProps) {
  const isMobile = useMediaQuery("(max-width: 48em)");
  const { ref, width } = useElementSize();
  const gaugeWidth =
    width > 0
      ? Math.min(Math.max(width, RISK_GAUGE_MIN_WIDTH), RISK_GAUGE_MAX_WIDTH)
      : isMobile
        ? RISK_GAUGE_MIN_WIDTH
        : RISK_GAUGE_MAX_WIDTH;
  const gaugeHeight = Math.round(gaugeWidth * RISK_GAUGE_HEIGHT_RATIO);
  const option = buildRiskGaugeOption(
    score,
    riskLevelLabels,
    title,
    unavailableLabel,
    isMobile,
    gaugeWidth,
    gaugeHeight,
  );
  const displayValue = formatRiskGaugeValue(score, unavailableLabel);
  const valueLayout = getRiskGaugeValueLayout(score, isMobile, gaugeWidth);

  return (
    <Box
      ref={ref}
      role="img"
      aria-label={title}
      style={{
        position: "relative",
        width: "100%",
        minWidth: RISK_GAUGE_MIN_WIDTH,
        maxWidth: RISK_GAUGE_MAX_WIDTH,
        marginInline: "auto",
      }}
    >
      <EChart option={option} height={gaugeHeight} />
      <Box
        aria-hidden={true}
        style={{
          position: "absolute",
          left: "50%",
          bottom: valueLayout.bottomOffset,
          transform: "translateX(-50%)",
          pointerEvents: "none",
          color: "#172033",
          fontFamily: "var(--mantine-font-family)",
          fontSize: valueLayout.fontSize,
          fontWeight: valueLayout.fontWeight,
          lineHeight: valueLayout.lineHeight,
          letterSpacing: "-0.04em",
          whiteSpace: "nowrap",
        }}
      >
        {displayValue}
      </Box>
    </Box>
  );
}
