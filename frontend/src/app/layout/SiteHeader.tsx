import {
  Anchor,
  Box,
  Burger,
  Button,
  Container,
  Drawer,
  Group,
  Image,
  Stack,
  Text,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Link, useLocation } from "react-router-dom";

const navItems = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
];

function isRouteActive(currentPath: string, target: string) {
  return target === "/" ? currentPath === "/" : currentPath.startsWith(target);
}

export function SiteHeader() {
  const [opened, { open, close }] = useDisclosure(false);
  const location = useLocation();
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
    <Box bg="#F1F1F1" py={0}>
      <Container size="sm">
        <Box
          mih={{ base: 56, sm: 64 }}
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) auto minmax(0, 1fr)",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Box
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              minWidth: 0,
            }}
          >
            <Anchor component={Link} to="/" onClick={close}>
              <Image
                src="/branding/logo-usyd-black.png"
                alt="University of Sydney"
                h={35}
                w="auto"
                fit="contain"
              />
            </Anchor>
          </Box>

          <Text
            fw={700}
            fz={{ base: "md", sm: "lg" }}
            ta="center"
            px="xs"
            style={{
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            Sports Heat Tool
          </Text>

          <Box
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              minWidth: 0,
            }}
          >
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
              aria-label="Toggle navigation"
            />
          </Box>
        </Box>
      </Container>

      <Drawer
        opened={opened}
        onClose={close}
        title="Navigation"
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
