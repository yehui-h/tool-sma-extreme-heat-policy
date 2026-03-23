from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Protocol


@dataclass(frozen=True)
class SportsHeatStressInput:
    sport: str
    tdb: float
    rh: float
    vr: float
    tr: float


@dataclass(frozen=True)
class SportsHeatStressOutput:
    data: dict[str, Any]
    meta: dict[str, Any]


class SportsHeatStressCalculator(Protocol):
    def model_sports_heat_stress(
        self, payload: SportsHeatStressInput
    ) -> SportsHeatStressOutput: ...
