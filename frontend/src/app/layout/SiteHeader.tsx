// Simplify SiteHeader layout: replace deep Grid/Box nesting with a flatter Header/Container/Group structure
import {
  Anchor,
  Button,
  Container,
  Drawer,
  Group,
  // Header removed because Mantine doesn't export Header; use Box instead
  Image,
  Text,
  Burger,
  Stack,
  Box,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useMediaQuery } from "@mantine/hooks";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { MOBILE_LAYOUT_SPACING } from "@/app/layout/layoutSpacing";

function isRouteActive(currentPath: string, target: string): boolean {
  return target === "/" ? currentPath === "/" : currentPath.startsWith(target);
}

/**
 * Renders the top site navigation with a simpler, less-nested layout.
 */
export function SiteHeader() {
  const [opened, { open, close }] = useDisclosure(false);
  const isDesktop = useMediaQuery("(min-width: 769px)");
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
    <Box component="header" style={{ background: "#F1F1F1", height: 60 }}>
      <Container
        size="sm"
        px={{ base: MOBILE_LAYOUT_SPACING, sm: "md" }}
        style={{ height: "100%" }}
      >
        <Group
          justify="space-between"
          align="center"
          wrap="nowrap"
          style={{ height: "100%" }}
        >
          {/* Left: logo */}
          <Anchor
            component={Link}
            to="/"
            onClick={close}
            style={{ display: "flex", alignItems: "center" }}
          >
            <Image
              src="/branding/logo-usyd-black.png"
              alt={t("nav.logoAlt")}
              height={35}
              width="auto"
              fit="contain"
            />
          </Anchor>

          {/* Center: title - flex so it stays centered between left and right items */}
          <Text
            fw={700}
            fz={{ base: "md", sm: "lg" }}
            ta="center"
            lineClamp={1}
            style={{ flex: 1, marginLeft: 12, marginRight: 12 }}
          >
            {t("app.title")}
          </Text>

          {/* Right: nav buttons + burger - render based on viewport */}
          <Group gap="xs" wrap="nowrap">
            {isDesktop ? (
              <Group gap="xs">
                {navItems.map((item) =>
                  renderNavButton(item, {
                    inactiveVariant: "subtle",
                    size: "sm",
                  }),
                )}
              </Group>
            ) : (
              <Burger
                opened={opened}
                onClick={opened ? close : open}
                aria-label={t("nav.toggleAriaLabel")}
                pr={0}
              />
            )}
          </Group>
        </Group>
      </Container>

      <Drawer
        opened={opened}
        onClose={close}
        title={t("nav.drawerTitle")}
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
