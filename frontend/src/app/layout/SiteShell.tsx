import { Box, Container, Stack } from "@mantine/core";
import { Outlet } from "react-router-dom";
import { SiteFooter } from "@/app/layout/SiteFooter";
import { SiteHeader } from "@/app/layout/SiteHeader";
import { PAGE_CONTAINER_PADDING } from "@/app/layout/layoutSpacing";

/**
 * Provides the shared page shell with header, content container, and footer.
 */
export function SiteShell() {
  return (
    <Stack gap={0} mih="100dvh" bg="gray.1">
      <SiteHeader />
      <Box component="main" flex={1}>
        <Container
          size="sm"
          pt={0}
          pb={PAGE_CONTAINER_PADDING}
          px={PAGE_CONTAINER_PADDING}
        >
          <Outlet />
        </Container>
      </Box>
      <SiteFooter />
    </Stack>
  );
}
