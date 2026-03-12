import { Stack } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { AboutSectionBlock } from "@/components/about/AboutSectionBlock";
import { PAGE_SECTION_GAP } from "@/app/layout/layoutSpacing";
import type { AboutSection } from "@/domain/about";

/**
 * Renders the About page sections sourced from i18n content.
 */
export function AboutPage() {
  const { t } = useTranslation();
  const sections = t("about.sections", {
    returnObjects: true,
  }) as AboutSection[];

  return (
    <Stack gap={PAGE_SECTION_GAP}>
      {sections.map((section) => (
        <AboutSectionBlock key={section.title} section={section} />
      ))}
    </Stack>
  );
}
