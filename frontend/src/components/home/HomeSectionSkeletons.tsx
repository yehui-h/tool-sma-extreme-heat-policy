import {
  Box,
  Center,
  Group,
  Loader,
  Paper,
  SimpleGrid,
  Skeleton,
  Stack,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import {
  COMPACT_RECOMMENDATION_LAYOUT_QUERY,
  getActionImageIconSize,
} from "@/config/uiScale";

interface HomeSectionSkeletonProps {
  showLoader?: boolean;
}

const CURRENT_RISK_GAUGE_WIDTH = 400;
const CURRENT_RISK_GAUGE_HEIGHT = 232;
const FORECAST_CHART_HEIGHT = 340;
const MOBILE_FORECAST_CHART_HEIGHT = 280;
const MAP_HEIGHT = 160;
const SKELETON_RECOMMENDATION_COUNT = 4;
const SKELETON_FORECAST_ROW_COUNT = 3;

function SkeletonLoader({ showLoader = false }: HomeSectionSkeletonProps) {
  if (!showLoader) {
    return null;
  }

  return (
    <Center pos="absolute" inset={0} style={{ pointerEvents: "none" }}>
      <Loader size="sm" />
    </Center>
  );
}

/**
 * Renders a chart-shaped skeleton placeholder for current risk loading states.
 */
export function CurrentRiskSkeleton({
  showLoader = false,
}: HomeSectionSkeletonProps) {
  return (
    <Stack gap="sm">
      <Box pos="relative">
        <Center>
          <Skeleton
            h={CURRENT_RISK_GAUGE_HEIGHT}
            w="100%"
            maw={CURRENT_RISK_GAUGE_WIDTH}
            radius="xl"
          />
        </Center>
        <SkeletonLoader showLoader={showLoader} />
      </Box>
      <Group justify="center">
        <Skeleton h={30} w={128} radius="xl" />
      </Group>
    </Stack>
  );
}

/**
 * Renders recommendation-card skeleton tiles while recommendations reload.
 */
export function KeyRecommendationsSkeleton({
  showLoader = false,
}: HomeSectionSkeletonProps) {
  const isCompactRecommendationLayout = useMediaQuery(
    COMPACT_RECOMMENDATION_LAYOUT_QUERY,
  );
  const iconSkeletonSize = getActionImageIconSize(
    isCompactRecommendationLayout,
  );

  return (
    <Box pos="relative">
      <SimpleGrid cols={SKELETON_RECOMMENDATION_COUNT}>
        {Array.from({ length: SKELETON_RECOMMENDATION_COUNT }, (_, index) => (
          <Stack
            key={`recommendation-skeleton-${index}`}
            align="center"
            gap="xs"
            p="md"
          >
            <Skeleton h={iconSkeletonSize} w={iconSkeletonSize} circle />
            <Skeleton h={14} w="70%" maw={120} />
          </Stack>
        ))}
      </SimpleGrid>
      <SkeletonLoader showLoader={showLoader} />
    </Box>
  );
}

/**
 * Renders chart and accordion-row skeletons for forecast loading states.
 */
export function ForecastSkeleton({
  showLoader = false,
}: HomeSectionSkeletonProps) {
  const isMobile = useMediaQuery("(max-width: 48em)");
  const chartHeight = isMobile
    ? MOBILE_FORECAST_CHART_HEIGHT
    : FORECAST_CHART_HEIGHT;

  return (
    <Stack gap="md">
      <Box pos="relative">
        <Skeleton h={chartHeight} radius="md" />
        <SkeletonLoader showLoader={showLoader} />
      </Box>
      <Stack gap="xs">
        {Array.from({ length: SKELETON_FORECAST_ROW_COUNT }, (_, index) => (
          <Skeleton key={`forecast-row-skeleton-${index}`} h={56} radius="md" />
        ))}
      </Stack>
    </Stack>
  );
}

/**
 * Renders a map-card skeleton placeholder while location map data reloads.
 */
export function MapSkeleton({ showLoader = false }: HomeSectionSkeletonProps) {
  return (
    <Paper radius="md">
      <Box pos="relative">
        <Skeleton h={MAP_HEIGHT} radius="md" />
        <SkeletonLoader showLoader={showLoader} />
      </Box>
    </Paper>
  );
}
