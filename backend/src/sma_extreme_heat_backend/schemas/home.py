from __future__ import annotations

from typing import Any, ClassVar, Literal

from pydantic import BaseModel, Field, field_validator
from pythermalcomfort.models.sports_heat_stress_risk import Sports

ALLOWED_SPORTS: tuple[str, ...] = tuple(sorted(name for name in dir(Sports) if name.isupper()))


class LocationMeta(BaseModel):
    source: Literal["mapbox"]
    mapboxId: str = Field(min_length=1)
    sessionToken: str = Field(min_length=1)


class HomeRiskRequest(BaseModel):
    sport: str = Field(min_length=1)
    locationMeta: LocationMeta

    _allowed_sports: ClassVar[set[str]] = set(ALLOWED_SPORTS)

    @field_validator("sport")
    @classmethod
    def validate_sport(cls, value: str) -> str:
        if value not in cls._allowed_sports:
            raise ValueError(
                "sport must use official pythermalcomfort Sports enum name"
            )
        return value


class HomeRiskResponse(BaseModel):
    data: dict[str, Any] = Field(default_factory=dict)
    meta: dict[str, Any] = Field(default_factory=dict)
