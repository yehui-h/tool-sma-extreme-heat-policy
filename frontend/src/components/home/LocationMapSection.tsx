import { useTranslation } from "react-i18next";
import { useHomeHeatRisk } from "@/hooks/useHomeHeatRisk";
import { MapSkeleton } from "@/components/home/HomeSectionSkeletons";
import { LocationMap } from "@/components/home/LocationMap";
import { SectionCard } from "@/components/ui/SectionCard";
import { toCoordinatesOrNull } from "@/lib/coordinates";
import { useHomeStore } from "@/store/homeStore";

/**
 * Renders the Home page location map once a risk result is available.
 */
export function LocationMapSection() {
  const { t } = useTranslation();
  const selectedLocation = useHomeStore((state) => state.selectedLocation);
  const { hasCalculatedRisk } = useHomeHeatRisk();
  const coordinates = toCoordinatesOrNull({
    latitude: selectedLocation?.latitude,
    longitude: selectedLocation?.longitude,
  });

  if (!hasCalculatedRisk || !coordinates) {
    return (
      <SectionCard title={t("home.sections.map.title")}>
        <MapSkeleton />
      </SectionCard>
    );
  }

  const locationLabel =
    selectedLocation?.displayLabel ?? t("home.sections.map.locationFallback");

  return (
    <SectionCard title={t("home.sections.map.title")}>
      <LocationMap
        latitude={coordinates.latitude}
        longitude={coordinates.longitude}
        label={locationLabel}
      />
    </SectionCard>
  );
}
