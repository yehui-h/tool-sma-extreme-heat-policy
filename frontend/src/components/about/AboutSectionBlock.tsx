import { Anchor, Stack, Text } from "@mantine/core";
import { Fragment } from "react";
import type { AboutSection } from "@/domain/about";
import { SectionCard } from "@/components/ui/SectionCard";

interface AboutSectionBlockProps {
  section: AboutSection;
}

/**
 * Renders one About section card from i18n-provided rich paragraph data.
 */
export function AboutSectionBlock({ section }: AboutSectionBlockProps) {
  return (
    <SectionCard title={section.title}>
      <Stack>
        {section.paragraphs.map((paragraph, paragraphIndex) => (
          <Text
            key={`${section.title}-${paragraphIndex}`}
            c="dark.7"
            fs={paragraph.italic ? "italic" : undefined}
          >
            {paragraph.runs.map((run, runIndex) =>
              "href" in run ? (
                <Anchor
                  key={`${section.title}-${paragraphIndex}-${runIndex}`}
                  href={run.href}
                >
                  {run.text}
                </Anchor>
              ) : (
                <Fragment
                  key={`${section.title}-${paragraphIndex}-${runIndex}`}
                >
                  {run.text}
                </Fragment>
              ),
            )}
          </Text>
        ))}
      </Stack>
    </SectionCard>
  );
}
