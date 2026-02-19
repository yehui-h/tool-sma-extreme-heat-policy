import { Paper, Stack, Text, Title } from '@mantine/core'
import type { ReactNode } from 'react'

interface SectionCardProps {
  title: string
  subtitle?: string
  children: ReactNode
}

export function SectionCard({ title, subtitle, children }: SectionCardProps) {
  return (
    <Paper shadow="xs" radius="md" p={{ base: 4, sm: 'md' }} withBorder>
      <Stack gap="sm">
        <Stack gap={4}>
          <Title order={2} fz={{ base: 'h3', sm: 'h2' }}>
            {title}
          </Title>
          {subtitle ? (
            <Text c="dimmed" fz={{ base: 'md', sm: 'lg' }}>
              {subtitle}
            </Text>
          ) : null}
        </Stack>
        {children}
      </Stack>
    </Paper>
  )
}
