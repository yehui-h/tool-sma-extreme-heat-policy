from __future__ import annotations

from typing import Any, ClassVar

from pydantic import BaseModel, Field, FiniteFloat, field_validator
from pythermalcomfort.models.sports_heat_stress_risk import Sports

ALLOWED_SPORTS: tuple[str, ...] = tuple(sorted(name for name in dir(Sports) if name.isupper()))


class RiskRequest(BaseModel):
    sport: str = Field(min_length=1)
    latitude: FiniteFloat = Field(ge=-90, le=90)
    longitude: FiniteFloat = Field(ge=-180, le=180)

    _allowed_sports: ClassVar[set[str]] = set(ALLOWED_SPORTS)

    @field_validator("sport")
    @classmethod
    def validate_sport(cls, value: str) -> str:
        if value not in cls._allowed_sports:
            raise ValueError("sport must use official pythermalcomfort Sports enum name")
        return value


class ForecastPoint(BaseModel):
    time_utc: str = Field(min_length=1)
    risk_level_interpolated: FiniteFloat


class RiskResponse(BaseModel):
    heat_risk: dict[str, Any] = Field(default_factory=dict)
    meta_data: dict[str, Any] = Field(default_factory=dict)
    forecast: list[ForecastPoint] = Field(default_factory=list)
