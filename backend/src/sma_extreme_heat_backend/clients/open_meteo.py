from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import httpx
import pandas as pd
from timezonefinder import TimezoneFinder

from sma_extreme_heat_backend.calculators.legacy_tg import calculate_tg_tr_legacy
from sma_extreme_heat_backend.core.errors import WeatherProviderError

tf = TimezoneFinder()

_HOURLY_FIELDS: tuple[str, ...] = (
    "temperature_2m",
    "relative_humidity_2m",
    "cloud_cover",
    "wind_speed_10m",
    "direct_radiation",
)

_EXPECTED_HOURLY_UNITS: dict[str, set[str]] = {
    "temperature_2m": {"\N{DEGREE SIGN}C"},
    "relative_humidity_2m": {"%"},
    "wind_speed_10m": {"m/s"},
    "cloud_cover": {"%"},
    "direct_radiation": {"W/m2", "W/m\u00b2"},
}


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
    if pd.isna(value):
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


def _validate_hourly_units(payload: dict[str, Any]) -> None:
    hourly_units = payload.get("hourly_units")
    if not isinstance(hourly_units, dict):
        raise WeatherProviderError("Weather provider response was missing hourly_units")

    for field, expected_units in _EXPECTED_HOURLY_UNITS.items():
        received = hourly_units.get(field)
        if not isinstance(received, str):
            raise WeatherProviderError(f"Weather provider unit was missing for {field}")
        if received not in expected_units:
            expected_text = ", ".join(sorted(expected_units))
            raise WeatherProviderError(
                f"Unexpected unit for {field}: received '{received}', "
                f"expected one of [{expected_text}]"
            )


def _build_hourly_frame(payload: dict[str, Any]) -> pd.DataFrame:
    hourly = payload.get("hourly")
    if not isinstance(hourly, dict):
        raise WeatherProviderError("Weather provider response was missing hourly data")

    raw_time = hourly.get("time")
    if not isinstance(raw_time, list):
        raise WeatherProviderError("Weather provider response was missing hourly.time")

    timestamp = pd.to_datetime(raw_time, errors="coerce")
    index = pd.DatetimeIndex(timestamp)
    if index.isna().any():
        raise WeatherProviderError("Weather provider response contained invalid hourly.time values")
    if index.tz is None:
        index = index.tz_localize("GMT")
    else:
        index = index.tz_convert("GMT")

    series_data: dict[str, list[Any]] = {}
    for field in _HOURLY_FIELDS:
        values = hourly.get(field)
        if not isinstance(values, list):
            raise WeatherProviderError(f"Weather provider response was missing hourly.{field}")
        if len(values) != len(index):
            raise WeatherProviderError(
                f"Weather provider response length mismatch for hourly.{field}"
            )
        series_data[field] = values

    frame = pd.DataFrame(
        data={
            "tdb": series_data["temperature_2m"],
            "rh": series_data["relative_humidity_2m"],
            "cloud": series_data["cloud_cover"],
            "wind": series_data["wind_speed_10m"],
            "direct_radiation": series_data["direct_radiation"],
        },
        index=index,
    )

    return frame.sort_index()


def _select_hourly_row(
    *,
    frame_utc: pd.DataFrame,
    timezone_name: str | None,
) -> tuple[pd.Series, pd.Timestamp]:
    if timezone_name is None:
        threshold = pd.Timestamp.now(tz="GMT") - pd.Timedelta(hours=1)
        filtered = frame_utc[frame_utc.index >= threshold]
    else:
        frame_local = frame_utc.copy()
        frame_local.index = frame_local.index.tz_convert(timezone_name)
        filtered = frame_local[
            frame_local.index >= (pd.Timestamp.now(tz=timezone_name) - pd.Timedelta(hours=1))
        ]

    filtered = filtered.dropna(subset=["tdb"])
    if filtered.empty:
        raise WeatherProviderError("No hourly record after now-1h")

    selected_timestamp = pd.Timestamp(filtered.index[0])
    return filtered.iloc[0], selected_timestamp


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
            "hourly": ",".join(_HOURLY_FIELDS),
            "wind_speed_unit": "ms",
            "timezone": "GMT",
        }

        try:
            response = await self._client.get("/forecast", params=params)
            response.raise_for_status()
            payload = response.json()
        except httpx.HTTPError as exc:
            raise WeatherProviderError() from exc

        _validate_hourly_units(payload)
        hourly_frame_utc = _build_hourly_frame(payload)

        tz = _timezone_at(latitude=latitude, longitude=longitude)
        selected_row, selected_timestamp = _select_hourly_row(
            frame_utc=hourly_frame_utc,
            timezone_name=tz,
        )

        tdb = _to_float_or_none(selected_row.get("tdb"))
        rh = _to_float_or_none(selected_row.get("rh"))
        vr_raw = _to_float_or_none(selected_row.get("wind"))
        cloud_cover = _to_float_or_none(selected_row.get("cloud"))

        tg: float | None = None
        tr: float | None = None
        vr = vr_raw
        legacy_meta: dict[str, Any] | None = None
        if (
            tdb is not None
            and vr_raw is not None
            and cloud_cover is not None
            and tz is not None
        ):
            result = calculate_tg_tr_legacy(
                tdb=tdb,
                wind_speed=vr_raw,
                cloud_cover=cloud_cover,
                latitude=latitude,
                longitude=longitude,
                timestamp=selected_timestamp,
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
