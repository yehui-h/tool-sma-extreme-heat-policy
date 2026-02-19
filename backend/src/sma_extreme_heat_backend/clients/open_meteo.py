from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import httpx
import pandas as pd
from timezonefinder import TimezoneFinder

from sma_extreme_heat_backend.calculators.legacy_tg import calculate_tg_tr_legacy
from sma_extreme_heat_backend.core.errors import WeatherProviderError

tf = TimezoneFinder()


@dataclass(frozen=True)
class CurrentWeather:
    tdb: float | None
    rh: float | None
    vr: float | None
    tg: float | None
    tr: float | None
    legacy_meta: dict[str, Any] | None
    raw: dict[str, Any]


def _to_float_or_none(value: Any) -> float | None:
    if value is None:
        return None

    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _to_timestamp_or_none(value: Any) -> pd.Timestamp | None:
    if value is None:
        return None

    timestamp = pd.to_datetime(value, errors="coerce")
    if pd.isna(timestamp):
        return None

    ts = pd.Timestamp(timestamp)
    if ts.tzinfo is None:
        ts = ts.tz_localize("GMT")
    return ts


def _timezone_at(*, latitude: float, longitude: float) -> str | None:
    return tf.timezone_at(lng=longitude, lat=latitude)


class OpenMeteoClient:
    def __init__(
        self,
        *,
        base_url: str,
        timeout_seconds: float,
        client: httpx.AsyncClient | None = None,
    ) -> None:
        self._owns_client = client is None
        self._client = client or httpx.AsyncClient(
            base_url=base_url.rstrip("/"),
            timeout=timeout_seconds,
        )

    async def fetch_current_weather(self, *, latitude: float, longitude: float) -> CurrentWeather:
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "current": "temperature_2m,relative_humidity_2m,wind_speed_10m,cloud_cover",
            "wind_speed_unit": "ms",
            "timezone": "GMT",
        }

        try:
            response = await self._client.get("/forecast", params=params)
            response.raise_for_status()
            payload = response.json()
        except httpx.HTTPError as exc:
            raise WeatherProviderError() from exc

        current = payload.get("current")
        if not isinstance(current, dict):
            raise WeatherProviderError("Weather provider response was missing current data")

        tdb = _to_float_or_none(current.get("temperature_2m"))
        rh = _to_float_or_none(current.get("relative_humidity_2m"))
        vr_raw = _to_float_or_none(current.get("wind_speed_10m"))
        cloud_cover = _to_float_or_none(current.get("cloud_cover"))
        timestamp_utc = _to_timestamp_or_none(current.get("time"))
        tz = _timezone_at(latitude=latitude, longitude=longitude)

        tg: float | None = None
        tr: float | None = None
        vr = vr_raw
        legacy_meta: dict[str, Any] | None = None
        if (
            tdb is not None
            and vr_raw is not None
            and cloud_cover is not None
            and timestamp_utc is not None
            and tz is not None
        ):
            timestamp_local = timestamp_utc.tz_convert(tz)
            result = calculate_tg_tr_legacy(
                tdb=tdb,
                wind_speed=vr_raw,
                cloud_cover=cloud_cover,
                latitude=latitude,
                longitude=longitude,
                timestamp=timestamp_local,
                tz=tz,
            )
            tg = result.tg
            tr = result.tr
            vr = result.vr_adjusted
            legacy_meta = result.meta

        return CurrentWeather(
            tdb=tdb,
            rh=rh,
            vr=vr,
            tg=tg,
            tr=tr,
            legacy_meta=legacy_meta,
            raw=payload,
        )

    async def aclose(self) -> None:
        if self._owns_client:
            await self._client.aclose()
