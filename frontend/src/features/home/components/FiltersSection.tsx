import {
  Autocomplete,
  Box,
  Button,
  Image,
  Loader,
  Select,
  Stack,
  Text,
} from "@mantine/core";
import { useMemo, useState } from "react";
import { SPORT_IMAGE_BY_TYPE } from "@/features/home/data/sportCatalog";
import { isSportType, type SportType } from "@/features/home/domain/sportType";
import type { SelectOption } from "@/features/home/types";
import { SectionCard } from "@/shared/ui/SectionCard";

interface FiltersSectionProps {
  sport: SportType;
  locationInput: string;
  sportOptions: SelectOption<SportType>[];
  suggestions: string[];
  isSuggestLoading: boolean;
  suggestError: string | null;
  calculateError: string | null;
  isCalculateDisabled: boolean;
  isCalculating: boolean;
  onSportChange: (value: SportType | null) => void;
  onLocationInputChange: (value: string) => void;
  onLocationOptionSubmit: (value: string) => void;
  onCalculateRisk: () => void;
}

export function FiltersSection({
  sport,
  locationInput,
  sportOptions,
  suggestions,
  isSuggestLoading,
  suggestError,
  calculateError,
  isCalculateDisabled,
  isCalculating,
  onSportChange,
  onLocationInputChange,
  onLocationOptionSubmit,
  onCalculateRisk,
}: FiltersSectionProps) {
  const [hasSportImageError, setHasSportImageError] = useState(false);
  const selectedSportLabel = useMemo(
    () =>
      sportOptions.find((option) => option.value === sport)?.label ??
      "Selected sport",
    [sport, sportOptions],
  );
  const sportImageSrc = SPORT_IMAGE_BY_TYPE[sport];

  const handleSportChange = (value: string | null) => {
    setHasSportImageError(false);

    if (value === null) {
      onSportChange(null);
      return;
    }

    if (isSportType(value)) {
      onSportChange(value);
    }
  };

  return (
    <SectionCard title="">
      <Stack gap="md">
        <Select
          label="Sport"
          size="md"
          data={sportOptions}
          value={sport}
          onChange={handleSportChange}
          searchable
          nothingFoundMessage="No sport found"
        />

        <Box w="100%" maw={520} mx="auto">
          {sportImageSrc && !hasSportImageError ? (
            <Image
              src={sportImageSrc}
              alt={`${selectedSportLabel} preview`}
              w="100%"
              h="auto"
              radius="sm"
              fit="contain"
              onError={() => setHasSportImageError(true)}
            />
          ) : (
            <Stack align="center" justify="center" gap={4} h={160}>
              <Text fw={500} fz="sm">
                Sport image unavailable
              </Text>
              <Text c="dimmed" fz="xs" ta="center">
                Add an image for {selectedSportLabel} at{" "}
                {sportImageSrc ?? "/sports/<sport>.webp"}.
              </Text>
            </Stack>
          )}
        </Box>

        <Autocomplete
          label="Location"
          size="md"
          placeholder="Search suburb, address, city, or venue"
          value={locationInput}
          onChange={onLocationInputChange}
          onOptionSubmit={onLocationOptionSubmit}
          data={suggestions}
          filter={({ options }) => options}
          rightSection={isSuggestLoading ? <Loader size={16} /> : null}
          autoComplete="off"
        />

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

          {!suggestError && !calculateError ? (
            <Text c="dimmed" fz="sm">
              Type to search, then select a suggested location to enable
              calculation.
            </Text>
          ) : null}

          <Button
            size="md"
            onClick={onCalculateRisk}
            disabled={isCalculateDisabled}
            loading={isCalculating}
            fullWidth
          >
            Calculate risk
          </Button>
        </Stack>
      </Stack>
    </SectionCard>
  );
}
