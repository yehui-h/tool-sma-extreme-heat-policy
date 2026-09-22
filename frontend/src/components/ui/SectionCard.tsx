import { Paper, Stack, Title } from "@mantine/core";
import type { ReactNode } from "react";
import { CONTENT_GAP, CONTENT_PADDING } from "@/config/uiLayout";

interface SectionCardProps {
  title?: string;
  children: ReactNode;
}

/**
 * Wraps page sections in a consistent card container and heading block.
 */
export function SectionCard({ title, children }: SectionCardProps) {
  const hasTitle = Boolean(title?.trim());

  return (
    <Paper radius="md" p={CONTENT_PADDING}>
      {hasTitle ? (
        <Stack gap={CONTENT_GAP} mb={CONTENT_PADDING}>
          <Title order={2} fz={{ base: "h3", sm: "h2" }}>
            {title}
          </Title>
        </Stack>
      ) : null}
      {children}
    </Paper>
  );
}
