from __future__ import annotations

import time
from dataclasses import dataclass
from functools import lru_cache

from sma_extreme_heat_backend.calculators.base import (
    SportsHeatStressCalculator,
    SportsHeatStressInput,
)
from sma_extreme_heat_backend.calculators.sports_heat_stress import (
    PythermalcomfortSportsHeatStressCalculator,
)
from sma_extreme_heat_backend.clients.mapbox import MapboxClient
from sma_extreme_heat_backend.clients.open_meteo import OpenMeteoClient
from sma_extreme_heat_backend.core.config import get_settings
from sma_extreme_heat_backend.core.errors import ModelInputUnavailableError
from sma_extreme_heat_backend.schemas.home import HomeRiskRequest, HomeRiskResponse


@dataclass
class CacheEntry:
    value: HomeRiskResponse
    expires_at: float


class RiskService:
    def __init__(
        self,
        *,
        mapbox_client: MapboxClient,
        weather_client: OpenMeteoClient,
        calculator: SportsHeatStressCalculator,
        ttl_seconds: int,
    ) -> None:
        self.mapbox_client = mapbox_client
        self.weather_client = weather_client
        self.calculator = calculator
        self.ttl_seconds = ttl_seconds
        self._cache: dict[str, CacheEntry] = {}

    async def calculate_home_risk(self, payload: HomeRiskRequest) -> HomeRiskResponse:
        key = self._cache_key(payload)
        now = time.monotonic()
        cached = self._cache.get(key)

        if cached and cached.expires_at > now:
            return cached.value

        location = await self.mapbox_client.retrieve_coordinates(
            mapbox_id=payload.locationMeta.mapboxId,
            session_token=payload.locationMeta.sessionToken,
        )

        weather = await self.weather_client.fetch_current_weather(
            latitude=location.latitude,
            longitude=location.longitude,
        )

        model_inputs = {
            "tdb": weather.tdb,
            "rh": weather.rh,
            "vr": weather.vr,
            "tg": weather.tg,
            "tr": weather.tr,
        }
        unknown_inputs = [name for name, value in model_inputs.items() if value is None]
        if unknown_inputs:
            raise ModelInputUnavailableError(
                unknown_inputs=unknown_inputs,
                available_inputs=model_inputs,
            )

        computed = self.calculator.model_sports_heat_stress(
            SportsHeatStressInput(
                sport=payload.sport,
                tdb=weather.tdb,
                rh=weather.rh,
                vr=weather.vr,
                tg=weather.tg,
                tr=weather.tr,
            )
        )

        response = HomeRiskResponse(
            data=computed.data,
            meta={
                **computed.meta,
                "mapbox": location.raw,
                "open_meteo": weather.raw,
                "legacy_meta": weather.legacy_meta,
            },
        )

        self._cache[key] = CacheEntry(value=response, expires_at=now + self.ttl_seconds)
        return response

    async def aclose(self) -> None:
        await self.mapbox_client.aclose()
        await self.weather_client.aclose()

    @staticmethod
    def _cache_key(payload: HomeRiskRequest) -> str:
        return f"{payload.sport}|{payload.locationMeta.mapboxId}"


@lru_cache(maxsize=1)
def _build_risk_service() -> RiskService:
    settings = get_settings()
    return RiskService(
        mapbox_client=MapboxClient(
            base_url=settings.mapbox_base_url,
            access_token=settings.mapbox_access_token,
            timeout_seconds=settings.http_timeout_seconds,
        ),
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
