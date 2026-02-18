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
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { Link, useLocation } from 'react-router-dom'

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/about' },
]

function isRouteActive(currentPath: string, target: string) {
  return target === '/' ? currentPath === '/' : currentPath.startsWith(target)
}

export function SiteHeader() {
  const [opened, { open, close }] = useDisclosure(false)
  const location = useLocation()
  const renderNavButton = (
    item: (typeof navItems)[number],
    options: {
      inactiveVariant: 'subtle' | 'light'
      size?: 'xs' | 'sm' | 'md'
      justify?: 'flex-start'
      onClick?: () => void
    },
  ) => {
    const active = isRouteActive(location.pathname, item.to)

    return (
      <Button
        key={item.to}
        component={Link}
        to={item.to}
        onClick={options.onClick}
        justify={options.justify}
        variant={active ? 'filled' : options.inactiveVariant}
        color={active ? 'brand.6' : 'gray'}
        size={options.size}
      >
        {item.label}
      </Button>
    )
  }

  return (
    <Box bg="#F1F1F1" py="sm">
      <Container size="sm">
        <Group justify="space-between" wrap="nowrap">
          <Group wrap="nowrap" gap="sm">
            <Anchor component={Link} to="/" onClick={close}>
              <Image src="/branding/logo-usyd-black.png" alt="University of Sydney" h={35} w="auto" fit="contain" />
            </Anchor>
            <Text fw={700} fz={{ base: 'md', sm: 'lg' }}>
              Sports Heat Tool
            </Text>
          </Group>

          <Group visibleFrom="sm" gap="xs">
            {navItems.map((item) => renderNavButton(item, { inactiveVariant: 'subtle', size: 'sm' }))}
          </Group>

          <Burger hiddenFrom="sm" opened={opened} onClick={opened ? close : open} aria-label="Toggle navigation" />
        </Group>
      </Container>

      <Drawer opened={opened} onClose={close} title="Navigation" hiddenFrom="sm" padding="md" position="right" size="xs">
        <Stack>
          {navItems.map((item) =>
            renderNavButton(item, {
              inactiveVariant: 'light',
              size: 'md',
              justify: 'flex-start',
              onClick: close,
            }),
          )}
        </Stack>
      </Drawer>
    </Box>
  )
}
