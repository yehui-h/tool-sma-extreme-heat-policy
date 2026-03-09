from __future__ import annotations

import time
from dataclasses import dataclass
from functools import lru_cache

from pythermalcomfort.models.sports_heat_stress_risk import Sports
from pythermalcomfort.utils.scale_wind_speed_log import scale_wind_speed_log

from sma_extreme_heat_backend.calculators.base import (
    SportsHeatStressCalculator,
    SportsHeatStressInput,
)
from sma_extreme_heat_backend.calculators.sports_heat_stress import (
    PythermalcomfortSportsHeatStressCalculator,
)
from sma_extreme_heat_backend.clients.open_meteo import OpenMeteoClient
from sma_extreme_heat_backend.core.config import get_settings
from sma_extreme_heat_backend.core.errors import ModelInputUnavailableError
from sma_extreme_heat_backend.schemas.home import RiskRequest, RiskResponse


@dataclass
class CacheEntry:
    value: RiskResponse
    expires_at: float


_API_WIND_HEIGHT_METERS = 10.0
_MODEL_WIND_HEIGHT_METERS = 1.1
_DEFAULT_TERRAIN_ROUGHNESS_LENGTH = 0.01
_DEFAULT_ZERO_PLANE_DISPLACEMENT = 0.0


class RiskService:
    def __init__(
        self,
        *,
        weather_client: OpenMeteoClient,
        calculator: SportsHeatStressCalculator,
        ttl_seconds: int,
    ) -> None:
        self.weather_client = weather_client
        self.calculator = calculator
        self.ttl_seconds = ttl_seconds
        self._cache: dict[str, CacheEntry] = {}

    async def calculate_home_risk(self, payload: RiskRequest) -> RiskResponse:
        key = self._cache_key(payload)
        now = time.monotonic()
        cached = self._cache.get(key)

        if cached and cached.expires_at > now:
            return cached.value

        weather = await self.weather_client.fetch_current_weather(
            latitude=payload.latitude,
            longitude=payload.longitude,
        )

        tdb = weather.tdb
        rh = weather.rh
        vr = weather.vr

        unknown_inputs: list[str] = []
        if tdb is None:
            unknown_inputs.append("tdb")
        if rh is None:
            unknown_inputs.append("rh")
        if vr is None:
            unknown_inputs.append("vr")

        if unknown_inputs:
            raise ModelInputUnavailableError(
                unknown_inputs=unknown_inputs,
                available_inputs={"tdb": tdb, "rh": rh, "vr": vr},
            )

        tr = tdb
        vr_effective = self._resolve_model_wind_speed(vr=vr, sport=payload.sport)
        computed = self.calculator.model_sports_heat_stress(
            SportsHeatStressInput(
                sport=payload.sport,
                tdb=tdb,
                rh=rh,
                vr=vr_effective,
                tr=tr,
            )
        )

        response = RiskResponse(
            heat_risk=computed.data,
            meta_data={
                **computed.meta,
                "location": {
                    "latitude": payload.latitude,
                    "longitude": payload.longitude,
                },
                "open_meteo": weather.raw,
            },
        )

        self._cache[key] = CacheEntry(value=response, expires_at=now + self.ttl_seconds)
        return response

    async def aclose(self) -> None:
        await self.weather_client.aclose()

    @staticmethod
    def _cache_key(payload: RiskRequest) -> str:
        return f"{payload.sport}|{payload.latitude:.6f}|{payload.longitude:.6f}"

    @staticmethod
    def _resolve_model_wind_speed(*, vr: float, sport: str) -> float:
        scaled_vr = float(
            scale_wind_speed_log(
                v_z1=vr,
                z2=_MODEL_WIND_HEIGHT_METERS,
                z1=_API_WIND_HEIGHT_METERS,
                z0=_DEFAULT_TERRAIN_ROUGHNESS_LENGTH,
                d=_DEFAULT_ZERO_PLANE_DISPLACEMENT,
                round_output=True,
            ).v_z2
        )
        sport_default_vr = getattr(Sports, sport).vr
        return max(scaled_vr, sport_default_vr)


@lru_cache(maxsize=1)
def _build_risk_service() -> RiskService:
    settings = get_settings()
    return RiskService(
        weather_client=OpenMeteoClient(
            base_url=settings.open_meteo_base_url,
            timeout_seconds=settings.http_timeout_seconds,
        ),
        calculator=PythermalcomfortSportsHeatStressCalculator(),
        ttl_seconds=settings.risk_cache_ttl_seconds,
    )


def get_risk_service() -> RiskService:
    return _build_risk_service()


async def shutdown_risk_service() -> None:
    if _build_risk_service.cache_info().currsize == 0:
        return

    service = _build_risk_service()
    await service.aclose()
    _build_risk_service.cache_clear()
