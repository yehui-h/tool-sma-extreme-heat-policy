import { Anchor, Box, Container, Grid, Group, Image, Stack, Text } from '@mantine/core'

const footerLinkStyles = {
  root: {
    color: '#000',
    textDecoration: 'underline',
    '&:hover': {
      color: 'lightgrey',
      textDecoration: 'underline',
    },
  },
}

export function SiteFooter() {
  return (
    <Box component="footer" bg="#e64626">
      <Container size="sm" py="lg">
        <Grid gutter="md" align="start">
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Stack gap="xs">
              <Text c="#111">
                Developed by:
              </Text>
              <Image src="/branding/logo-usyd-black.png" alt="University of Sydney logo" w={150} fit="contain" />
              <Text c="#111" mt="xs">
                Endorsed by:
              </Text>
              <Image src="/branding/sma-black.png" alt="Sports Medicine Australia logo" w={140} fit="contain" />
            </Stack>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 8 }}>
            <Stack gap={6}>
              <Anchor
                fz="md"
                styles={footerLinkStyles}
                href="https://sydney.au1.qualtrics.com/jfe/form/SV_3jAqlzAnAoAOU8S"
                target="_blank"
                rel="noreferrer"
              >
                Provide your feedback
              </Anchor>
              <Text fz="md" c="#111">
                If you use this tool, please cite the following paper:
              </Text>
              <Anchor
                fz="md"
                styles={footerLinkStyles}
                href="https://doi.org/10.1016/j.jsams.2025.03.006"
                target="_blank"
                rel="noreferrer"
              >
                The Sports Medicine Australia extreme heat risk and response guidelines and web tool.
              </Anchor>
              <Text fz="md" c="#111">
                Tartarini F, Smallcombe JW, Lynch GP, Cross TJ, Broderick C, Jay O.
              </Text>
              <Text fz="md" c="#111" fs="italic">
                J Sci Med Sport. 2025 Sep;28(9):690-699.
              </Text>
              <Text fz="md" c="#111">
                © 2025 - Heat and Health Research Centre, The University of Sydney.
              </Text>
              <Text fz="md" c="#111">
                This website was reviewed by the Sports Medicine Australia Scientific Advisory Committee in 2025
              </Text>
              <Text fz="md" c="#111">
                Version: 1.2.2
              </Text>
              <Group gap="xs">
                <Anchor fz="md" styles={footerLinkStyles} href="mailto:federico.tartarini@sydney.edu.au">
                  Contact Us
                </Anchor>
              </Group>
            </Stack>
          </Grid.Col>
        </Grid>
      </Container>
    </Box>
  )
}
