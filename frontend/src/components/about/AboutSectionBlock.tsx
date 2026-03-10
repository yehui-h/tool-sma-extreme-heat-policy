import {
  IconAlertTriangle,
  IconBan,
  IconFileAlert,
  IconHeartRateMonitor,
  IconInfoCircle,
  IconLayoutGrid,
  IconScale,
  IconShieldLock,
  IconSunHigh,
  IconWorldWww,
} from "@tabler/icons-react";
import { Anchor, Stack, Text, ThemeIcon } from "@mantine/core";
import { Fragment, type ReactNode } from "react";
import { SectionCard } from "@/components/ui/SectionCard";
import type { AboutSection, AboutSectionIconKey } from "@/domain/about";

interface AboutSectionBlockProps {
  section: AboutSection;
}

interface AboutTitleIconConfig {
  color: string;
  icon: ReactNode;
}

const ABOUT_TITLE_ICON_SIZE = 18;
const ABOUT_TITLE_ICON_STROKE = 1.8;
const ABOUT_DEFAULT_TITLE_ICON_CONFIG: AboutTitleIconConfig = {
  color: "teal",
  icon: <IconInfoCircle size={ABOUT_TITLE_ICON_SIZE} stroke={ABOUT_TITLE_ICON_STROKE} />,
};

const ABOUT_TITLE_ICON_CONFIG_BY_KEY: Record<
  AboutSectionIconKey,
  AboutTitleIconConfig
> = {
  overview: {
    color: "teal",
    icon: <IconWorldWww size={ABOUT_TITLE_ICON_SIZE} stroke={ABOUT_TITLE_ICON_STROKE} />,
  },
  functionalities: {
    color: "blue",
    icon: <IconLayoutGrid size={ABOUT_TITLE_ICON_SIZE} stroke={ABOUT_TITLE_ICON_STROKE} />,
  },
  "heat-risk": {
    color: "orange",
    icon: (
      <IconHeartRateMonitor
        size={ABOUT_TITLE_ICON_SIZE}
        stroke={ABOUT_TITLE_ICON_STROKE}
      />
    ),
  },
  "uv-guide": {
    color: "yellow",
    icon: <IconSunHigh size={ABOUT_TITLE_ICON_SIZE} stroke={ABOUT_TITLE_ICON_STROKE} />,
  },
  terms: {
    color: "gray",
    icon: <IconScale size={ABOUT_TITLE_ICON_SIZE} stroke={ABOUT_TITLE_ICON_STROKE} />,
  },
  "medical-disclaimer": {
    color: "orange",
    icon: (
      <IconAlertTriangle
        size={ABOUT_TITLE_ICON_SIZE}
        stroke={ABOUT_TITLE_ICON_STROKE}
      />
    ),
  },
  warranty: {
    color: "gray",
    icon: <IconFileAlert size={ABOUT_TITLE_ICON_SIZE} stroke={ABOUT_TITLE_ICON_STROKE} />,
  },
  privacy: {
    color: "indigo",
    icon: <IconShieldLock size={ABOUT_TITLE_ICON_SIZE} stroke={ABOUT_TITLE_ICON_STROKE} />,
  },
  "unacceptable-activity": {
    color: "red",
    icon: <IconBan size={ABOUT_TITLE_ICON_SIZE} stroke={ABOUT_TITLE_ICON_STROKE} />,
  },
};

function getAboutTitleIconConfig(iconKey: AboutSectionIconKey): AboutTitleIconConfig {
  return ABOUT_TITLE_ICON_CONFIG_BY_KEY[iconKey] ?? ABOUT_DEFAULT_TITLE_ICON_CONFIG;
}

/**
 * Renders one About section card from i18n-provided rich paragraph data.
 */
export function AboutSectionBlock({ section }: AboutSectionBlockProps) {
  const titleIconConfig = getAboutTitleIconConfig(section.iconKey);

  return (
    <SectionCard
      title={section.title}
      titleIcon={
        <ThemeIcon
          color={titleIconConfig.color}
          variant="light"
          size="lg"
          radius="xl"
        >
          {titleIconConfig.icon}
        </ThemeIcon>
      }
    >
      <Stack gap="xs">
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
                <Fragment key={`${section.title}-${paragraphIndex}-${runIndex}`}>
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
