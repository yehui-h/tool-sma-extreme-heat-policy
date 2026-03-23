from __future__ import annotations

import time
from dataclasses import dataclass
from datetime import UTC, datetime
from functools import lru_cache

import pandas as pd
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
from sma_extreme_heat_backend.core.errors import (
    ModelInputUnavailableError,
    WeatherProviderError,
)
from sma_extreme_heat_backend.schemas.home import RiskRequest, RiskResponse
from sma_extreme_heat_backend.services.mrt import (
    build_mrt_dataframe,
    resolve_timezone_name,
    select_hourly_forecast_rows,
    to_mrt_meta,
)


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

        weather = await self.weather_client.fetch_weather_forecast(
            latitude=payload.latitude,
            longitude=payload.longitude,
        )

        timezone_name = resolve_timezone_name(
            latitude=payload.latitude,
            longitude=payload.longitude,
        )
        mrt_df = build_mrt_dataframe(
            points=weather.points,
            latitude=payload.latitude,
            longitude=payload.longitude,
            timezone_name=timezone_name,
        )
        hourly_mrt_df = select_hourly_forecast_rows(mrt_df)
        if hourly_mrt_df.empty:
            raise WeatherProviderError("No hourly record after 30-minute resample")

        current_point = hourly_mrt_df.iloc[0]
        unknown_inputs = self._unknown_inputs_for_point(current_point)
        if unknown_inputs:
            raise ModelInputUnavailableError(
                unknown_inputs=unknown_inputs,
                available_inputs={
                    "tdb": _to_optional_float(current_point.tdb),
                    "rh": _to_optional_float(current_point.rh),
                    "wind": _to_optional_float(current_point.wind),
                    "radiation": _to_optional_float(current_point.radiation),
                    "tr": _to_optional_float(current_point.tr),
                },
            )

        computed = self._calculate_point_risk(
            point=current_point,
            sport=payload.sport,
        )
        forecast = [
            self._to_forecast_entry(
                timestamp=hourly_mrt_df.index[0].to_pydatetime(),
                risk_level_interpolated=computed.data["risk_level_interpolated"],
            )
        ]
        for timestamp, point in hourly_mrt_df.iloc[1:].iterrows():
            computed_point = self._calculate_optional_point_risk(
                point=point,
                sport=payload.sport,
            )
            if computed_point is None:
                continue

            forecast.append(
                self._to_forecast_entry(
                    timestamp=timestamp.to_pydatetime(),
                    risk_level_interpolated=computed_point.data["risk_level_interpolated"],
                )
            )

        response = RiskResponse(
            heat_risk=computed.data,
            meta_data={
                **computed.meta,
                "location": {
                    "latitude": payload.latitude,
                    "longitude": payload.longitude,
                    "timezone": timezone_name,
                },
                "mrt": to_mrt_meta(current_point, timezone_name=timezone_name),
                "open_meteo": weather.raw,
            },
            forecast=forecast,
        )

        self._cache[key] = CacheEntry(value=response, expires_at=now + self.ttl_seconds)
        return response

    async def aclose(self) -> None:
        await self.weather_client.aclose()

    @staticmethod
    def _cache_key(payload: RiskRequest) -> str:
        return f"{payload.sport}|{payload.latitude:.6f}|{payload.longitude:.6f}"

    @staticmethod
    def _unknown_inputs_for_point(point: pd.Series) -> list[str]:
        unknown_inputs: list[str] = []
        if pd.isna(point.tdb):
            unknown_inputs.append("tdb")
        if pd.isna(point.rh):
            unknown_inputs.append("rh")
        if pd.isna(point.wind):
            unknown_inputs.append("wind")
        if pd.isna(point.radiation):
            unknown_inputs.append("radiation")
        if pd.isna(point.tr):
            unknown_inputs.append("tr")
        return unknown_inputs

    def _calculate_optional_point_risk(
        self,
        *,
        point: pd.Series,
        sport: str,
    ):
        if self._unknown_inputs_for_point(point):
            return None

        return self._calculate_point_risk(point=point, sport=sport)

    def _calculate_point_risk(
        self,
        *,
        point: pd.Series,
        sport: str,
    ):
        assert not pd.isna(point.tdb)
        assert not pd.isna(point.rh)
        assert not pd.isna(point.wind)
        assert not pd.isna(point.tr)

        vr_effective = self._resolve_model_wind_speed(vr=float(point.wind), sport=sport)
        return self.calculator.model_sports_heat_stress(
            SportsHeatStressInput(
                sport=sport,
                tdb=float(point.tdb),
                rh=float(point.rh),
                vr=vr_effective,
                tr=float(point.tr),
            )
        )

    @staticmethod
    def _to_forecast_entry(
        *,
        timestamp: datetime,
        risk_level_interpolated: float,
    ) -> dict[str, float | str]:
        time_utc = timestamp.astimezone(UTC).isoformat().replace("+00:00", "Z")
        return {
            "time_utc": time_utc,
            "risk_level_interpolated": risk_level_interpolated,
        }

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


def _to_optional_float(value: float | None) -> float | None:
    if value is None or pd.isna(value):
        return None
    return float(value)
