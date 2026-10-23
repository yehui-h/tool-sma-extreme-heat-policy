from __future__ import annotations

import pytest

from sma_extreme_heat_backend.calculators.sports_heat_stress import (
    PythermalcomfortSportsHeatStressCalculator,
    SportsHeatStressInput,
)


@pytest.mark.parametrize("sport", ["SOCCER", "CROQUET"])
def test_model_sports_heat_stress_returns_pythermalcomfort_raw_keys(sport: str) -> None:
    calculator = PythermalcomfortSportsHeatStressCalculator()

    result = calculator.model_sports_heat_stress(
        SportsHeatStressInput(
            sport=sport,
            tdb=30.0,
            rh=60.0,
            vr=1.2,
            tr=35.0,
        )
    )

    assert "risk_level_interpolated" in result.data
    assert "t_medium" in result.data
    assert "t_high" in result.data
    assert "t_extreme" in result.data
    assert "recommendation" in result.data
    assert result.meta["model"] == "pythermalcomfort.models.sports_heat_stress_risk"
    assert result.meta["inputs"]["sport"] == sport
