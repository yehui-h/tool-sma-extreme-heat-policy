import { Anchor, List, Stack, Text } from '@mantine/core'
import type { AboutSection } from '@/features/about/types'
import { SectionCard } from '@/shared/ui/SectionCard'

interface AboutSectionBlockProps {
  section: AboutSection
}

export function AboutSectionBlock({ section }: AboutSectionBlockProps) {
  return (
    <SectionCard title={section.title}>
      <Stack gap="sm">
        {section.paragraphs.map((paragraph) => (
          <Text key={paragraph} fz={{ base: 'sm', sm: 'md' }} c="dark.7">
            {paragraph}
          </Text>
        ))}

        {section.bulletPoints?.length ? (
          <List spacing="xs" size="sm">
            {section.bulletPoints.map((point) => (
              <List.Item key={point}>{point}</List.Item>
            ))}
          </List>
        ) : null}

        {section.links?.length ? (
          <Stack gap={6}>
            {section.links.map((link) => (
              <Anchor key={link.href} href={link.href} target="_blank" rel="noreferrer">
                {link.label}
              </Anchor>
            ))}
          </Stack>
        ) : null}
      </Stack>
    </SectionCard>
  )
}
