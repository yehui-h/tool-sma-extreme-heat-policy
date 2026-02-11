import { Paper, Stack, Text, Title } from '@mantine/core'
import type { ReactNode } from 'react'

interface SectionCardProps {
  title: string
  subtitle?: string
  children: ReactNode
}

export function SectionCard({ title, subtitle, children }: SectionCardProps) {
  return (
    <Paper shadow="xs" radius="md" p={{ base: 'md', sm: 'lg' }} withBorder>
      <Stack gap="md">
        <Stack gap={4}>
          <Title order={2} fz={{ base: 'h4', sm: 'h3' }}>
            {title}
          </Title>
          {subtitle ? (
            <Text c="dimmed" fz={{ base: 'sm', sm: 'md' }}>
              {subtitle}
            </Text>
          ) : null}
        </Stack>
        {children}
      </Stack>
    </Paper>
  )
}
