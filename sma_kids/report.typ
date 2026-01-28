= SMA kids Report

This report provides an overview of the modified code for the SMA kids project.

== Preface

Since we publised the SMA paper I have slightly modified the code to improve the results and to make it easier to share in pythermalcomfort and with other researchers. The main changes are:
- now we are using the PHS model each time we run the simulations
- I set temperature limits for the risk thresholds.

Results have not changed significantly, but they are slightly different from the published paper.

For exmaple, here are the result for an adult, playing soccer, with a globe temperature 5 °C higher than air temperature, and a wind speed of 1 m/s.

#figure(
  image("figures/soccer_v=1_tg_delta=5_adult.png", width: 100%),
  caption: [A curious figure.],
) <sma-change>

Risk levels go from 0 (low) to 3 (extreme), sorry for using a different color scheme than the published paper, but I think it should be still clear enough.
The resolution is also not that high, but it is enough to see the differences.

@sma-change shows the results for this scenario.
The panel at the top shows the new results, while the panel in the center shows the results from the published paper, finally, the panel at the bottom shows the difference between the two results.
A light color indicates a difference of one risk level, while a dark color indicates a difference of two risk levels.
The difference is calculated by subtracting the new results from the published results.
As you can see the differences are minimal, with most of the area showing no difference at all and now the new model says that the risk is extreme for temperatures above 43 °C, which I think is more reasonable.

== New kids results

Now that you are familiar with this chart type, I am going to present the results for the three age groups you have identified in the Word document you shared with me.

I am no longer showing the published SMA results, but instead I will only compare the kids results with the adult results, calculated with the new model I am using now in pythermalcomfort.

As you can see below the results are not right, the only one that seems to make sense is the oldest group.

#figure(
  image("figures/soccer_v=1_tg_delta=5_less_10y.png", width: 100%),
  caption: [SMA less than 10 years old results compared to adult results.],
) <sma-less-10y>

#figure(
  image("figures/soccer_v=1_tg_delta=5_10_13y.png", width: 100%),
  caption: [SMA 10 to 13 years old results compared to adult results.],
) <sma-10-to-13y>

#figure(
  image("figures/soccer_v=1_tg_delta=5_14_17y.png", width: 100%),
  caption: [SMA 14 to 17 years old results compared to adult results.],
) <sma-14-to-17y>
