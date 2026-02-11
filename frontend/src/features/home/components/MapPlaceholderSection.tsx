import { Badge, Center, Group, Paper, Stack, Text } from '@mantine/core'
import { SectionCard } from '@/shared/ui/SectionCard'

interface MapPlaceholderSectionProps {
  locationLabel: string
  latitude?: number
  longitude?: number
  mapboxId?: string
  sessionToken?: string
}

export function MapPlaceholderSection({
  locationLabel,
  latitude,
  longitude,
  mapboxId,
  sessionToken,
}: MapPlaceholderSectionProps) {
  const hasCoordinates = typeof latitude === 'number' && typeof longitude === 'number'
  const hasRetrievePayload = Boolean(mapboxId && sessionToken)

  return (
    <SectionCard title="Location Map" subtitle="Map rendering is deferred, but location selection state is now applied.">
      <Paper withBorder radius="md" p="xl" bg="gray.0">
        <Center>
          <Stack align="center" gap="xs">
            <Text fw={600}>Map Preview Placeholder</Text>
            <Text c="dimmed" ta="center" maw={360}>
              Nearest weather station and heat-risk map details for {locationLabel} will appear here in the next
              implementation phase.
            </Text>
            <Group gap="xs">
              <Badge color="blue" variant="light">
                Source: mapbox
              </Badge>
              {hasCoordinates ? (
                <Badge color="teal" variant="light">
                  {latitude.toFixed(4)}, {longitude.toFixed(4)}
                </Badge>
              ) : null}
              {hasRetrievePayload ? (
                <Badge color="grape" variant="light">
                  retrieve payload ready
                </Badge>
              ) : null}
            </Group>
          </Stack>
        </Center>
      </Paper>
    </SectionCard>
  )
}
