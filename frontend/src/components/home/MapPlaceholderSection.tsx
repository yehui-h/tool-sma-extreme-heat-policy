import { Badge, Box, Center, Group, Paper, Stack, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { useHomeHeatRisk } from "@/hooks/useHomeHeatRisk";
import { MapSkeleton } from "@/components/home/HomeSectionSkeletons";
import { SectionCard } from "@/components/ui/SectionCard";
import { useHomeStore } from "@/store/homeStore";

/**
 * Shows placeholder content for the upcoming location map section.
 */
export function MapPlaceholderSection() {
  const { t } = useTranslation();
  const selectedLocation = useHomeStore((state) => state.selectedLocation);
  const { meta, hasCalculatedRisk, isFetching } = useHomeHeatRisk();

  if (!hasCalculatedRisk) {
    return (
      <SectionCard title={t("home.sections.map.title")}>
        <MapSkeleton showLoader={isFetching} />
      </SectionCard>
    );
  }

  const locationLabel =
    selectedLocation?.formattedLocation ??
    t("home.sections.map.locationFallback");
  const latitude = meta.latitude ?? selectedLocation?.latitude;
  const longitude = meta.longitude ?? selectedLocation?.longitude;
  const hasCoordinates =
    typeof latitude === "number" && typeof longitude === "number";

  return (
    <SectionCard title={t("home.sections.map.title")}>
      <Paper withBorder radius="md" p="xl" bg="gray.0">
        <Center>
          <Stack align="center" gap="xs">
            <Text fw={600}>{t("home.sections.map.placeholderTitle")}</Text>
            <Text c="dimmed" ta="center" maw={360}>
              {t("home.sections.map.placeholderBody", {
                location: locationLabel,
              })}
            </Text>
            <Box mih={56} w="100%">
              <Group gap="xs" justify="center" wrap="wrap">
                <Badge color="blue" variant="light">
                  {t("home.sections.map.badges.source", {
                    source: t("providers.mapbox"),
                  })}
                </Badge>
                {hasCoordinates ? (
                  <Badge color="teal" variant="light">
                    {latitude.toFixed(4)}, {longitude.toFixed(4)}
                  </Badge>
                ) : null}
                {hasCoordinates ? (
                  <Badge color="grape" variant="light">
                    {t("home.sections.map.badges.retrieveReady")}
                  </Badge>
                ) : null}
              </Group>
            </Box>
          </Stack>
        </Center>
      </Paper>
    </SectionCard>
  );
}
