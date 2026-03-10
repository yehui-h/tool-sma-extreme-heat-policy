import { Stack } from "@mantine/core";
import { useEffect } from "react";
import { CurrentRiskSection } from "@/components/home/CurrentRiskSection";
import { FiltersSection } from "@/components/home/FiltersSection";
import { ForecastSection } from "@/components/home/ForecastSection";
import { KeyRecommendationsSection } from "@/components/home/KeyRecommendationsSection";
import { LocationMapSection } from "@/components/home/LocationMapSection";
import { useHomeHeatRisk } from "@/hooks/useHomeHeatRisk";
import { useHomeUrlSync } from "@/hooks/useHomeUrlSync";
import { PAGE_SECTION_GAP } from "@/app/layout/layoutSpacing";
import { useHomeBootstrap } from "@/pages/home/useHomeBootstrap";
import { useHomeStore } from "@/store/homeStore";

const HOME_AUTO_REFRESH_INTERVAL_MS = 20 * 60 * 1000;

/**
 * Renders the Home page and wires Home-level state side effects.
 */
export function HomePage() {
  const { setQueryStates } = useHomeBootstrap();
  const { canSyncSelection } = useHomeHeatRisk();
  const sport = useHomeStore((state) => state.sport);
  const selectedLocation = useHomeStore((state) => state.selectedLocation);

  useHomeUrlSync({
    setQueryStates,
    canSyncSelection,
  });

  useEffect(() => {
    if (!(selectedLocation !== null && Boolean(sport))) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      window.location.reload();
    }, HOME_AUTO_REFRESH_INTERVAL_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [selectedLocation, sport]);

  return (
    <Stack gap={PAGE_SECTION_GAP}>
      <FiltersSection />
      <CurrentRiskSection />
      <KeyRecommendationsSection />
      <ForecastSection />
      <LocationMapSection />
    </Stack>
  );
}
