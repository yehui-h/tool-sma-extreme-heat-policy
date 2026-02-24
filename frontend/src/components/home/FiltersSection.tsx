import {
  Autocomplete,
  Box,
  Group,
  Image,
  Loader,
  Select,
  Stack,
  Text,
} from "@mantine/core";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useHomeHeatRisk } from "@/hooks/useHomeHeatRisk";
import { useHomeLocationSuggest } from "@/hooks/useHomeLocationSuggest";
import {
  isSportType,
  sports,
  toSportAssetName,
  type SportType,
} from "@/domain/sport";
import {
  toCalculationErrorI18nKey,
  toSuggestErrorI18nKey,
} from "@/domain/homeErrorMap";
import { SectionCard } from "@/components/ui/SectionCard";
import { useHomeStore } from "@/store/homeStore";

interface SelectOption<T extends string = string> {
  value: T;
  label: string;
}

/**
 * Renders sport and location filters for Home risk calculation.
 */
export function FiltersSection() {
  const { t } = useTranslation();
  const sport = useHomeStore((state) => state.sport);
  const setSport = useHomeStore((state) => state.setSport);
  const [hasSportImageError, setHasSportImageError] = useState(false);
  const fieldLabelMinWidth = 72;

  const sportOptions = useMemo<SelectOption<SportType>[]>(
    () =>
      sports.map((sportMeta) => ({
        value: sportMeta.type,
        label: t(sportMeta.labelKey),
      })),
    [t],
  );

  const selectedSportMeta = useMemo(
    () => sports.find((sportMeta) => sportMeta.type === sport),
    [sport],
  );

  const selectedSportLabel = useMemo(
    () =>
      sportOptions.find((option) => option.value === sport)?.label ??
      t("home.sections.filters.selectedSportFallback"),
    [sport, sportOptions, t],
  );
  const sportImageSrc =
    selectedSportMeta?.imagePath ?? `/sports/${toSportAssetName(sport)}.webp`;

  const {
    locationInput,
    suggestionLabels,
    isSuggestLoading,
    suggestErrorReason,
    onLocationInputChange,
    onLocationOptionSubmit,
  } = useHomeLocationSuggest();
  const { isFetching: isCalculating, errorReason } = useHomeHeatRisk();

  const handleSportChange = (value: string | null) => {
    setHasSportImageError(false);

    if (value === null) {
      return;
    }

    if (isSportType(value)) {
      setSport(value);
    }
  };

  const suggestErrorKey = toSuggestErrorI18nKey(suggestErrorReason);
  const calculateErrorKey = toCalculationErrorI18nKey(errorReason);
  const suggestError = suggestErrorKey ? t(suggestErrorKey) : null;
  const calculateError = calculateErrorKey ? t(calculateErrorKey) : null;
  const shouldShowStatus =
    Boolean(suggestError) ||
    Boolean(calculateError) ||
    (!suggestError && !calculateError && isCalculating);

  return (
    <SectionCard title="">
      <Stack p={{ base: "xs", sm: 0 }}>
        <Group wrap="nowrap" align="center">
          <Text fw={600} miw={fieldLabelMinWidth}>
            {t("home.sections.filters.sportLabel")}:
          </Text>
          <Box flex={1}>
            <Select
              aria-label={t("home.sections.filters.sportLabel")}
              size="md"
              data={sportOptions}
              value={sport}
              onChange={handleSportChange}
              searchable
              nothingFoundMessage={t("home.sections.filters.sportNotFound")}
            />
          </Box>
        </Group>

        <Box w="100%" maw={520} mx="auto">
          {!hasSportImageError ? (
            <Image
              src={sportImageSrc}
              alt={t("home.sections.filters.sportImageAlt", {
                sportLabel: selectedSportLabel,
              })}
              w="100%"
              h="auto"
              radius="sm"
              fit="contain"
              onError={() => setHasSportImageError(true)}
            />
          ) : (
            <Stack align="center" justify="center" gap={4} py="md">
              <Text fw={500} fz="sm">
                {t("home.sections.filters.sportImageUnavailable")}
              </Text>
              <Text c="dimmed" fz="xs" ta="center">
                {t("home.sections.filters.sportImageHelp", {
                  sportLabel: selectedSportLabel,
                  path: sportImageSrc,
                })}
              </Text>
            </Stack>
          )}
        </Box>

        <Group wrap="nowrap" align="center">
          <Text fw={600} miw={fieldLabelMinWidth}>
            {t("home.sections.filters.locationLabel")}:
          </Text>
          <Box flex={1}>
            <Autocomplete
              aria-label={t("home.sections.filters.locationLabel")}
              size="md"
              placeholder={t("home.sections.filters.locationPlaceholder")}
              value={locationInput}
              onChange={onLocationInputChange}
              onOptionSubmit={onLocationOptionSubmit}
              data={suggestionLabels}
              filter={({ options }) => options}
              rightSection={isSuggestLoading ? <Loader size={16} /> : null}
              autoComplete="off"
            />
          </Box>
        </Group>

        {shouldShowStatus ? (
          <Stack gap="xs">
            {suggestError ? (
              <Text c="orange.7" fz="sm">
                {suggestError}
              </Text>
            ) : null}

            {calculateError ? (
              <Text c="red.7" fz="sm">
                {calculateError}
              </Text>
            ) : null}

            {!suggestError && !calculateError && isCalculating ? (
              <Text c="dimmed" fz="sm">
                {t("home.sections.filters.calculatingLabel")}
              </Text>
            ) : null}
          </Stack>
        ) : null}
      </Stack>
    </SectionCard>
  );
}
