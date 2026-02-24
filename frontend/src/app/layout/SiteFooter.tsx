import {
  Anchor,
  Box,
  Container,
  Grid,
  Group,
  Image,
  Stack,
  Text,
} from "@mantine/core";
import { useTranslation } from "react-i18next";

const APP_VERSION = "1.2.2";
const COPYRIGHT_YEAR = 2025;
const REVIEW_YEAR = 2025;

const footerLinkStyles = {
  root: {
    color: "#000",
    textDecoration: "underline",
    "&:hover": {
      color: "lightgrey",
      textDecoration: "underline",
    },
  },
};

/**
 * Renders the site footer with credits, citation, and contact links.
 */
export function SiteFooter() {
  const { t } = useTranslation();

  return (
    <Box component="footer" bg="#e64626">
      <Container size="sm" py="lg">
        <Grid gutter="md" align="start">
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Stack gap="xs">
              <Text c="#111">{t("footer.developedBy")}</Text>
              <Image
                src="/branding/logo-usyd-black.png"
                alt={t("footer.usydLogoAlt")}
                w={150}
                fit="contain"
              />
              <Text c="#111" mt="xs">
                {t("footer.endorsedBy")}
              </Text>
              <Image
                src="/branding/sma-black.png"
                alt={t("footer.smaLogoAlt")}
                w={140}
                fit="contain"
              />
            </Stack>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 8 }}>
            <Stack gap={6}>
              <Anchor
                styles={footerLinkStyles}
                href="https://sydney.au1.qualtrics.com/jfe/form/SV_3jAqlzAnAoAOU8S"
                target="_blank"
                rel="noreferrer"
              >
                {t("footer.feedbackLink")}
              </Anchor>
              <Text c="#111">{t("footer.citePrompt")}</Text>
              <Anchor
                styles={footerLinkStyles}
                href="https://doi.org/10.1016/j.jsams.2025.03.006"
                target="_blank"
                rel="noreferrer"
              >
                {t("footer.paperTitle")}
              </Anchor>
              <Text c="#111">{t("footer.authors")}</Text>
              <Text c="#111" fs="italic">
                {t("footer.journal")}
              </Text>
              <Text c="#111">
                {t("footer.copyright", { year: COPYRIGHT_YEAR })}
              </Text>
              <Text c="#111">
                {t("footer.reviewedBy", { year: REVIEW_YEAR })}
              </Text>
              <Text c="#111">
                {t("footer.version", { version: APP_VERSION })}
              </Text>
              <Group gap="xs">
                <Anchor
                  styles={footerLinkStyles}
                  href="mailto:federico.tartarini@sydney.edu.au"
                >
                  {t("footer.contactUs")}
                </Anchor>
              </Group>
            </Stack>
          </Grid.Col>
        </Grid>
      </Container>
    </Box>
  );
}
