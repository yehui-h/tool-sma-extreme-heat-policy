import { Group, Image, Paper, Stack, Text } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { useTranslation } from "react-i18next";
import {
  COMPACT_RECOMMENDATION_LAYOUT_QUERY,
  getActionImageIconSize,
} from "@/config/uiScale";
import { toPublicAssetUrl } from "@/lib/publicAssetUrl";

interface RiskPendingStateProps {
  message: string;
  minHeight?: number;
  showMutedIcons?: boolean;
}

const MUTED_ICON_PATHS = [
  toPublicAssetUrl("actions/hydration.png"),
  toPublicAssetUrl("actions/clothing.png"),
  toPublicAssetUrl("actions/pause.png"),
  toPublicAssetUrl("actions/cooling.png"),
];

/**
 * Shared pending-state placeholder for Home risk-dependent sections.
 */
export function RiskPendingState({
  message,
  minHeight,
  showMutedIcons = false,
}: RiskPendingStateProps) {
  const { t } = useTranslation();
  const isCompactRecommendationLayout = useMediaQuery(
    COMPACT_RECOMMENDATION_LAYOUT_QUERY,
  );
  const paperStyle = typeof minHeight === "number" ? { minHeight } : undefined;
  const mutedIconSize = getActionImageIconSize(isCompactRecommendationLayout);

  return (
    <Paper withBorder radius="md" p="xl" bg="gray.0" style={paperStyle}>
      <Stack align="center" justify="center" h="100%" gap="xs">
        <Text c="dimmed" fz="sm" ta="center" maw={360}>
          {message}
        </Text>
        <Text c="dimmed" fz="xs" ta="center">
          {t("home.sections.riskPending.setFiltersHint")}
        </Text>
        {showMutedIcons ? (
          <Group gap="md" mt="xs">
            {MUTED_ICON_PATHS.map((iconPath) => (
              <Image
                key={iconPath}
                src={iconPath}
                alt=""
                w={mutedIconSize}
                h={mutedIconSize}
                fit="contain"
                style={{ filter: "grayscale(1)", opacity: 0.45 }}
              />
            ))}
          </Group>
        ) : null}
      </Stack>
    </Paper>
  );
}
