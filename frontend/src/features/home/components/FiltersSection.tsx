import { Autocomplete, Button, Grid, Group, Loader, Select, Stack, Text } from '@mantine/core'
import { SectionCard } from '@/shared/ui/SectionCard'
import type { SelectOption } from '@/features/home/types'

interface FiltersSectionProps {
  sport: string
  locationInput: string
  sportOptions: SelectOption[]
  suggestions: string[]
  isSuggestLoading: boolean
  suggestError: string | null
  isCalculateDisabled: boolean
  isCalculating: boolean
  onSportChange: (value: string | null) => void
  onLocationInputChange: (value: string) => void
  onLocationOptionSubmit: (value: string) => void
  onCalculateRisk: () => void
}

export function FiltersSection({
  sport,
  locationInput,
  sportOptions,
  suggestions,
  isSuggestLoading,
  suggestError,
  isCalculateDisabled,
  isCalculating,
  onSportChange,
  onLocationInputChange,
  onLocationOptionSubmit,
  onCalculateRisk,
}: FiltersSectionProps) {
  return (
    <SectionCard title="">
      <Grid gutter="md">
        <Grid.Col span={{ base: 12, sm: 6 }}>
          <Select
            label="Sport"
            size="md"
            data={sportOptions}
            value={sport}
            onChange={onSportChange}
            searchable
            nothingFoundMessage="No sport found"
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6 }}>
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
        </Grid.Col>
        <Grid.Col span={12}>
          <Stack gap="xs">
            {suggestError ? (
              <Text c="orange.7" fz="sm">
                {suggestError}
              </Text>
            ) : (
              <Text c="dimmed" fz="sm">
                Type to search, then select a suggested location to enable calculation.
              </Text>
            )}
            <Group justify="flex-end">
              <Button
                size="md"
                onClick={onCalculateRisk}
                disabled={isCalculateDisabled}
                loading={isCalculating}
                w={{ base: '100%', sm: 'auto' }}
              >
                Calculate risk
              </Button>
            </Group>
          </Stack>
        </Grid.Col>
      </Grid>
    </SectionCard>
  )
}
