from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Any

import httpx

from sma_extreme_heat_backend.core.errors import WeatherProviderError

_HOURLY_FIELDS: tuple[str, ...] = (
    "temperature_2m",
    "relative_humidity_2m",
    "wind_speed_10m",
)

_EXPECTED_HOURLY_UNITS: dict[str, set[str]] = {
    "temperature_2m": {"\N{DEGREE SIGN}C"},
    "relative_humidity_2m": {"%"},
    "wind_speed_10m": {"m/s"},
}


@dataclass(frozen=True)
class CurrentWeather:
    tdb: float | None
    rh: float | None
    vr: float | None
    raw: dict[str, Any]


def _to_float_or_none(value: Any) -> float | None:
    if value is None:
        return None

    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _to_utc_timestamp_or_none(value: Any) -> datetime | None:
    if not isinstance(value, str):
        return None

    normalized = value.replace("Z", "+00:00")
    try:
        timestamp = datetime.fromisoformat(normalized)
    except ValueError:
        return None

    if timestamp.tzinfo is None:
        return timestamp.replace(tzinfo=UTC)
    return timestamp.astimezone(UTC)


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


def _select_hourly_row(payload: dict[str, Any]) -> dict[str, Any]:
    hourly = payload.get("hourly")
    if not isinstance(hourly, dict):
        raise WeatherProviderError("Weather provider response was missing hourly data")

    raw_time = hourly.get("time")
    if not isinstance(raw_time, list):
        raise WeatherProviderError("Weather provider response was missing hourly.time")

    timestamps = [_to_utc_timestamp_or_none(item) for item in raw_time]
    if any(item is None for item in timestamps):
        raise WeatherProviderError("Weather provider response contained invalid hourly.time values")

    series_data: dict[str, list[Any]] = {"time": raw_time}
    for field in _HOURLY_FIELDS:
        values = hourly.get(field)
        if not isinstance(values, list):
            raise WeatherProviderError(f"Weather provider response was missing hourly.{field}")
        if len(values) != len(raw_time):
            raise WeatherProviderError(
                f"Weather provider response length mismatch for hourly.{field}"
            )
        series_data[field] = values

    threshold = datetime.now(tz=UTC) - timedelta(hours=1)
    candidate_indexes = [
        idx
        for idx, timestamp in sorted(enumerate(timestamps), key=lambda item: item[1])
        if timestamp >= threshold
    ]
    if not candidate_indexes:
        raise WeatherProviderError("No hourly record after now-1h")

    selected = candidate_indexes[0]
    return {
        "tdb": series_data["temperature_2m"][selected],
        "rh": series_data["relative_humidity_2m"][selected],
        "wind": series_data["wind_speed_10m"][selected],
    }


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
        selected_row = _select_hourly_row(payload)

        return CurrentWeather(
            tdb=_to_float_or_none(selected_row.get("tdb")),
            rh=_to_float_or_none(selected_row.get("rh")),
            vr=_to_float_or_none(selected_row.get("wind")),
            raw=payload,
        )

    async def aclose(self) -> None:
        if self._owns_client:
            await self._client.aclose()
