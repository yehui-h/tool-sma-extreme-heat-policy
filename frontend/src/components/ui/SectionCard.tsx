import { Paper, Stack, Text, Title } from "@mantine/core";
import type { ReactNode } from "react";

interface SectionCardProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
}

/**
 * Wraps page sections in a consistent card container and heading block.
 */
export function SectionCard({ title, subtitle, children }: SectionCardProps) {
  const hasTitle = Boolean(title?.trim());
  const hasHeading = hasTitle || Boolean(subtitle);

  return (
    <Paper shadow="xs" radius="md" p={{ base: 4, sm: "md" }} withBorder>
      <Stack>
        {hasHeading ? (
          <Stack gap={4}>
            {hasTitle ? (
              <Title order={2} fz={{ base: "h3", sm: "h2" }}>
                {title}
              </Title>
            ) : null}
            {subtitle ? (
              <Text c="dimmed" fz={{ base: "md", sm: "lg" }}>
                {subtitle}
              </Text>
            ) : null}
          </Stack>
        ) : null}
        {children}
      </Stack>
    </Paper>
  );
}
