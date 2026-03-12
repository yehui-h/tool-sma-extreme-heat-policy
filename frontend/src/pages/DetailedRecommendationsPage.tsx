import { Stack } from "@mantine/core";
import { DetailedRecommendationsSection } from "@/components/home/DetailedRecommendationsSection";
import { PAGE_SECTION_GAP } from "@/app/layout/layoutSpacing";

/**
 * Renders a static documentation-style page for detailed recommendations.
 */
export function DetailedRecommendationsPage() {
  return (
    <Stack gap={PAGE_SECTION_GAP}>
      <DetailedRecommendationsSection />
    </Stack>
  );
}
