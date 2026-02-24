import { Group, Image, Paper, Stack, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";

interface RiskPendingStateProps {
  message: string;
  minHeight?: number;
  showMutedIcons?: boolean;
}

const MUTED_ICON_PATHS = [
  "/actions/hydration.png",
  "/actions/clothing.png",
  "/actions/pause.png",
  "/actions/cooling.png",
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
  const paperStyle = typeof minHeight === "number" ? { minHeight } : undefined;

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
                w={42}
                h={42}
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
