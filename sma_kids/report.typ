= SMA kids Report

This report provides an overview of the modified code for the SMA kids project.

== Preface

Since we publised the SMA paper I have slightly modified the code to improve the results and to make it easier to share in pythermalcomfort and with other researchers. The main changes are:
- now we are using the PHS model each time we run the simulations
- I set temperature limits for the risk thresholds.

// Results have not changed significantly, but they are slightly different from the published paper.

For exmaple, here are the result for an adult, playing soccer, with a globe temperature 5 °C higher than air temperature, and a wind speed of 1 m/s.

/*
#figure(
  image("figures/soccer_v=1_tg_delta=5_adult.png", width: 100%),
  caption: [A curious figure.],
) <sma-change>
*/

#figure(
  image("figures/soccer_v=1_tg_delta=5_risk_boundaries_comparison_adult.png", width: 100%),
  caption: [A curious figure.],
) <sma-change>


@sma-change shows the results for this scenario.
As you can see the differences are minimal, but still present.

== New kids results

Now that you are aware of the changes, I am going to present the results for the three age groups you have identified in the Word document you shared with me.

I compare the kids results with the adult results, calculated with the new model I am using now in pythermalcomfort.

Consideting that in principle kids should not present a higher risk than adults, I think these results are a bit far off from ideal, but still we are increasing the safety margin for kids, so it may be acceptable.

The figure title contains the parameters used for the simulations: weight, height, age group, t core threshold for extreme and sweat loss threshold for low risk.

For little kids the extreme risk threshold is similar to the high risk threshold for adults.

If you are happy with these results I can proceed to calculate the number of hours in each category for the different locations.

#figure(
  image("figures/soccer_v=1_tg_delta=5_less_10y_vs_adult_risk_boundaries.png", width: 80%),
  caption: [SMA less than 10 years old results compared to adult results.],
) <sma-less-10y>

#figure(
  image("figures/soccer_v=1_tg_delta=5_10_13y_vs_adult_risk_boundaries.png", width: 80%),
  caption: [SMA 10 to 13 years old results compared to adult results.],
) <sma-10-to-13y>

#figure(
  image("figures/soccer_v=1_tg_delta=5_14_17y_vs_adult_risk_boundaries.png", width: 80%),
  caption: [SMA 14 to 17 years old results compared to adult results.],
) <sma-14-to-17y>

For reference, below is the table with the parameters you provided me for each age group.
As you can see, I had to slightly adjust the values to make sure the PHS results made sense.

#table(
  columns: (auto, auto, auto, auto, auto),
  inset: 8pt,
  align: center + horizon,
  // Only draws the horizontal lines at the top and bottom of the header
  stroke: (x, y) => if y == 0 or y == 3 { (bottom: 1pt + black) },

  // Headers
  [*Age \ group \ (yrs)*],
  [*Combined avg \ height \ (cm)*],
  [*Combined avg \ weight \ (kg)*],
  [*1% body mass \ loss \ (mL·h⁻¹)*],
  [*Reduction of Tcore \ thresholds*],

  // Data Rows
  [7 – \<10], [128.0], [25.2], [252 mL·h⁻¹], [-0.5°C],
  [10 – \<14], [143.3], [40.3], [403 mL·h⁻¹], [-0.5°C],
  [14 – 17], [159.5], [59.9], [599 mL·h⁻¹], [-0.25°C],
)
