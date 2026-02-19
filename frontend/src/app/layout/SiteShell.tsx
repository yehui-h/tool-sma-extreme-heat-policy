import { Box, Container, Stack } from "@mantine/core";
import { Outlet } from "react-router-dom";
import { SiteFooter } from "@/app/layout/SiteFooter";
import { SiteHeader } from "@/app/layout/SiteHeader";

export function SiteShell() {
  return (
    <Stack gap={0} mih="100dvh" bg="gray.1">
      <SiteHeader />
      <Box component="main" style={{ flex: 1 }}>
        <Container size="sm" pt={0} pb="md" px={{ base: 4, sm: "md" }}>
          <Outlet />
        </Container>
      </Box>
      <SiteFooter />
    </Stack>
  );
}
