import { Box, Paper, Text, Title } from "@mantine/core";
import type { ReactNode } from "react";

interface SectionCardProps {
  title?: string;
  titleIcon?: ReactNode;
  subtitle?: string;
  children: ReactNode;
}

/**
 * Wraps page sections in a consistent card container and heading block.
 */
export function SectionCard({
  title,
  titleIcon,
  subtitle,
  children,
}: SectionCardProps) {
  const hasTitle = Boolean(title?.trim());
  const hasHeading = hasTitle || Boolean(subtitle);

  return (
    <Paper radius="md" p={{ base: "sm", sm: "md" }}>
      {hasHeading ? (
        <Box mb="sm">
          {hasTitle ? (
            <Title order={2} fz={{ base: "h3", sm: "h2" }}>
              <Box
                component="span"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                {titleIcon ? (
                  <Box
                    component="span"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {titleIcon}
                  </Box>
                ) : null}
                <span>{title}</span>
              </Box>
            </Title>
          ) : null}
          {subtitle ? (
            <Text
              c="dimmed"
              fz={{ base: "md", sm: "lg" }}
              mt={hasTitle ? 4 : 0}
            >
              {subtitle}
            </Text>
          ) : null}
        </Box>
      ) : null}
      {children}
    </Paper>
  );
}
