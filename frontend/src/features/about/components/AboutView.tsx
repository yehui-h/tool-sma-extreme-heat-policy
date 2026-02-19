import { Stack } from '@mantine/core'
import { AboutSectionBlock } from '@/features/about/components/AboutSectionBlock'
import { aboutSections } from '@/features/about/data/aboutContent'

export function AboutView() {
  return (
    <Stack gap="md">
      {aboutSections.map((section) => (
        <AboutSectionBlock key={section.title} section={section} />
      ))}
    </Stack>
  )
}
