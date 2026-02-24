import {
  Anchor,
  Box,
  Burger,
  Button,
  Drawer,
  Grid,
  Group,
  Image,
  Stack,
  Text,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { MOBILE_LAYOUT_SPACING } from "@/app/layout/layoutSpacing";

function isRouteActive(currentPath: string, target: string): boolean {
  return target === "/" ? currentPath === "/" : currentPath.startsWith(target);
}

/**
 * Renders the top site navigation with responsive desktop/mobile menus.
 */
export function SiteHeader() {
  const [opened, { open, close }] = useDisclosure(false);
  const location = useLocation();
  const { t } = useTranslation();
  const navItems = [
    { label: t("nav.home"), to: "/" },
    { label: t("nav.about"), to: "/about" },
  ];

  const renderNavButton = (
    item: (typeof navItems)[number],
    options: {
      inactiveVariant: "subtle" | "light";
      size?: "xs" | "sm" | "md";
      justify?: "flex-start";
      onClick?: () => void;
    },
  ) => {
    const active = isRouteActive(location.pathname, item.to);

    return (
      <Button
        key={item.to}
        component={Link}
        to={item.to}
        onClick={options.onClick}
        justify={options.justify}
        variant={active ? "filled" : options.inactiveVariant}
        color={active ? "brand.6" : "gray"}
        size={options.size}
      >
        {item.label}
      </Button>
    );
  };

  return (
    <Box
      bg="#F1F1F1"
      p={0}
      mt={MOBILE_LAYOUT_SPACING}
      mx={MOBILE_LAYOUT_SPACING}
      mb={0}
    >
      <Grid align="center" gutter={0} py={0} m={0}>
        <Grid.Col span={{ base: 2, sm: 4 }}>
          <Anchor component={Link} to="/" onClick={close}>
            <Image
              src="/branding/logo-usyd-black.png"
              alt={t("nav.logoAlt")}
              h={35}
              w="auto"
              fit="contain"
            />
          </Anchor>
        </Grid.Col>

        <Grid.Col span={{ base: 9, sm: 4 }}>
          <Text fw={700} fz={{ base: "md", sm: "lg" }} ta="center" lineClamp={1}>
            {t("app.title")}
          </Text>
        </Grid.Col>

        <Grid.Col span={{ base: 1, sm: 4 }}>
          <Group justify="flex-end" wrap="nowrap">
            <Group visibleFrom="sm" gap="xs">
              {navItems.map((item) =>
                renderNavButton(item, {
                  inactiveVariant: "subtle",
                  size: "sm",
                }),
              )}
            </Group>

            <Burger
              hiddenFrom="sm"
              opened={opened}
              onClick={opened ? close : open}
              aria-label={t("nav.toggleAriaLabel")}
              pr={0}
            />
          </Group>
        </Grid.Col>
      </Grid>

      <Drawer
        opened={opened}
        onClose={close}
        title={t("nav.drawerTitle")}
        hiddenFrom="sm"
        padding="md"
        position="right"
        size="66.67vw"
      >
        <Stack>
          {navItems.map((item) =>
            renderNavButton(item, {
              inactiveVariant: "light",
              size: "md",
              justify: "flex-start",
              onClick: close,
            }),
          )}
        </Stack>
      </Drawer>
    </Box>
  );
}
