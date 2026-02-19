import { Anchor, Stack, Text } from "@mantine/core";
import { Fragment } from "react";
import type { AboutSection } from "@/features/about/types";
import { SectionCard } from "@/shared/ui/SectionCard";

interface AboutSectionBlockProps {
  section: AboutSection;
}

export function AboutSectionBlock({ section }: AboutSectionBlockProps) {
  return (
    <SectionCard title={section.title}>
      <Stack gap="sm">
        {section.paragraphs.map((paragraph, paragraphIndex) => (
          <Text
            key={`${section.title}-${paragraphIndex}`}
            fz={{ base: "md", sm: "md" }}
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
