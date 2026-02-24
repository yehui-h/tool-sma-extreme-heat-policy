import { Stack } from "@mantine/core";
import { useEffect } from "react";
import { CurrentRiskSection } from "@/components/home/CurrentRiskSection";
import { DetailedRecommendationsSection } from "@/components/home/DetailedRecommendationsSection";
import { FiltersSection } from "@/components/home/FiltersSection";
import { ForecastSection } from "@/components/home/ForecastSection";
import { KeyRecommendationsSection } from "@/components/home/KeyRecommendationsSection";
import { MapPlaceholderSection } from "@/components/home/MapPlaceholderSection";
import { useHomeHeatRisk } from "@/hooks/useHomeHeatRisk";
import { useHomeUrlSync } from "@/hooks/useHomeUrlSync";
import { MOBILE_LAYOUT_SPACING } from "@/app/layout/layoutSpacing";
import { forecastFixture } from "@/pages/home/fixtures/forecastFixture";
import { useHomeBootstrap } from "@/pages/home/useHomeBootstrap";
import { useHomeStore } from "@/store/homeStore";

/**
 * Renders the Home page and wires Home-level state side effects.
 */
export function HomePage() {
  const { setQueryStates } = useHomeBootstrap();
  const { canSyncSelection } = useHomeHeatRisk();
  const setForecast = useHomeStore((state) => state.setForecast);

  useHomeUrlSync({
    setQueryStates,
    canSyncSelection,
  });

  useEffect(() => {
    setForecast(forecastFixture);
  }, [setForecast]);

  return (
    <Stack gap={MOBILE_LAYOUT_SPACING}>
      <FiltersSection />
      <CurrentRiskSection />
      <KeyRecommendationsSection />
      <DetailedRecommendationsSection />
      <ForecastSection />
      <MapPlaceholderSection />
    </Stack>
  );
}
