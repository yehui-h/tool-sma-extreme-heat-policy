import { Anchor, Container, Divider, Grid, Group, Image, Stack, Text } from '@mantine/core'

export function SiteFooter() {
  return (
    <Container size="sm" py="lg">
      <Stack gap="md">
        <Divider color="gray.4" />
        <Grid gutter="md" align="start">
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Stack gap="xs">
              <Text fw={700} c="dark.8">
                Developed by
              </Text>
              <Image src="/branding/logo-usyd-black.png" alt="University of Sydney logo" w={150} fit="contain" />
              <Text fw={700} c="dark.8" mt="xs">
                Endorsed by
              </Text>
              <Image src="/branding/sma-black.png" alt="Sports Medicine Australia logo" w={140} fit="contain" />
            </Stack>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 8 }}>
            <Stack gap={6}>
              <Anchor href="https://sydney.au1.qualtrics.com/jfe/form/SV_3jAqlzAnAoAOU8S" target="_blank" rel="noreferrer">
                Provide your feedback
              </Anchor>
              <Text fz="sm" c="dark.8">
                If you use this tool, please cite: The Sports Medicine Australia extreme heat risk and response guidelines
                and web tool. J Sci Med Sport. 2025 Sep;28(9):690-699.
              </Text>
              <Text fz="sm" c="dark.8">
                © 2025 - Heat and Health Research Centre, The University of Sydney.
              </Text>
              <Group gap="xs">
                <Anchor href="mailto:federico.tartarini@sydney.edu.au">Contact us</Anchor>
              </Group>
            </Stack>
          </Grid.Col>
        </Grid>
      </Stack>
    </Container>
  )
}
