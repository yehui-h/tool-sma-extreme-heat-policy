import type { RiskLevel } from "@/features/home/domain/homeRisk";
import type { RecommendationItem } from "@/features/home/types";

export const keyRecommendationsByRisk: Record<RiskLevel, RecommendationItem[]> =
  {
    low: [
      { icon: "/actions/hydration.png", label: "Stay hydrated" },
      { icon: "/actions/clothing.png", label: "Wear light clothing" },
    ],
    moderate: [
      { icon: "/actions/hydration.png", label: "Stay hydrated" },
      { icon: "/actions/clothing.png", label: "Wear light clothing" },
      { icon: "/actions/pause.png", label: "Rest Breaks" },
    ],
    high: [
      { icon: "/actions/hydration.png", label: "Stay hydrated" },
      { icon: "/actions/clothing.png", label: "Wear light clothing" },
      { icon: "/actions/pause.png", label: "Rest Breaks" },
      { icon: "/actions/cooling.png", label: "Active Cooling" },
    ],
    extreme: [{ icon: "/actions/stop.png", label: "Consider Suspending Play" }],
  };

interface LegacyDetailedRecommendationContent {
  description: string;
  suggestion: string;
}

export interface DetailedSuggestionsContent {
  description: string;
  suggestions: string[];
}

function applyLegacyCapitalize(value: string): string {
  if (value.length === 0) {
    return value;
  }

  return value[0].toUpperCase() + value.slice(1).toLowerCase();
}

function parseLegacySuggestionBullets(value: string): string[] {
  return applyLegacyCapitalize(value)
    .split("*")
    .map((item) => item.replace(/\s+/g, " ").trim())
    .filter((item) => item.length > 0);
}

const legacyDetailedRecommendationsByRisk: Record<
  RiskLevel,
  LegacyDetailedRecommendationContent
> = {
  low: {
    description:
      "maintaining hydration through regular fluid consumption and modifying clothing is still a simple, yet effective, way of keeping cool and preserving health and performance during the summer months.",
    suggestion: `
    * Ensure pre-exercise hydration by consuming 6 ml of water per kilogram of body weight
    every 2-3 hours before exercise. For a 70kg individual, this equates to 420ml of fluid
    every 2-3 hours (a standard sports drink bottle contains 500ml).
    * Drink regularly throughout exercise. You should aim to drink enough to offset sweat
    losses, but it is important to avoid over-drinking because this can also have negative
    health effects. To familiarise yourself with how much you typically sweat, become
    accustomed to weighing yourself before and after practice or competition.
    * Where possible, select light-weight and breathable clothing with extra ventilation.
    * Remove unnecessary clothing/equipment and/or excess clothing layers.
    * Reduce the amount of skin that is covered by clothing - this will help increase your
    sweat evaporation, which will help you dissipate heat.
        `,
  },
  moderate: {
    description:
      "increasing the frequency and/or duration of your rest breaks exercise or sporting activities is an effective way of reducing your risk for heat illness even if minimal resources are available.",
    suggestion: `
    * During training sessions, provide a minimum of 15 minutes of rest for every 45 minutes
    of practice.
    * Extend scheduled rest breaks that naturally occur during match-play of a particular
    sport (e.g. half-time) by ~10 minutes. This is effective for sports such as soccer/football and
    rugby and can be implemented across other sports such as field hockey.
    * Implement additional rest breaks that are not normally scheduled to occur. For example,
    3 to 5-min "quarter-time" breaks can be introduced mid-way through each half of a
    football or rugby match, or an extended 10-min drinks break can be introduced every
    hour of a cricket match or after the second set of a tennis match.
    * For sports with continuous play without any scheduled breaks, courses or play duration
    can be shortened
    * During all breaks in play or practice, everyone should seek shade - if natural shade is not
    available, portable sun shelters should be provided, and water freely available
        `,
  },
  high: {
    description:
      "active cooling strategies should be applied during scheduled and additional rest breaks, or before and during activity if play is continuous. Below are strategies that have been shown to effectively reduce body temperature. The suitability and feasibility of each strategy will depend on the type of sport or exercise you are performing. ",
    suggestion: `
        * Drinking cold fluids and/or ice slushies before exercise commences. Note that cold water
        and ice slushy ingestion during exercise is less effective for cooling.
        * Submerging your arms/feet in cold water.
        * Water dousing - wetting your skin with cool water using a sponge or a spray bottle helps
        increase evaporation, which is the most effective cooling mechanism in the heat.
        * Ice packs/towels - placing an ice pack or damp towel filled with crushed ice around your
        neck.
        * Electric (misting) fans - outdoor fans can help keep your body cool, especially when
        combined with a water misting system.
            `,
  },
  extreme: {
    description:
      "exercise/play should be suspended. If play has commenced, then all activities should be stopped as soon as possible.",
    suggestion: `
        * All players should seek shade or cool refuge in an air-conditioned space if available
        * Active cooling strategies should be applied.
            `,
  },
};

export const detailedSuggestionsByRisk: Record<
  RiskLevel,
  DetailedSuggestionsContent
> = {
  low: {
    description: applyLegacyCapitalize(
      legacyDetailedRecommendationsByRisk.low.description,
    ),
    suggestions: parseLegacySuggestionBullets(
      legacyDetailedRecommendationsByRisk.low.suggestion,
    ),
  },
  moderate: {
    description: applyLegacyCapitalize(
      legacyDetailedRecommendationsByRisk.moderate.description,
    ),
    suggestions: parseLegacySuggestionBullets(
      legacyDetailedRecommendationsByRisk.moderate.suggestion,
    ),
  },
  high: {
    description: applyLegacyCapitalize(
      legacyDetailedRecommendationsByRisk.high.description,
    ),
    suggestions: parseLegacySuggestionBullets(
      legacyDetailedRecommendationsByRisk.high.suggestion,
    ),
  },
  extreme: {
    description: applyLegacyCapitalize(
      legacyDetailedRecommendationsByRisk.extreme.description,
    ),
    suggestions: parseLegacySuggestionBullets(
      legacyDetailedRecommendationsByRisk.extreme.suggestion,
    ),
  },
};
