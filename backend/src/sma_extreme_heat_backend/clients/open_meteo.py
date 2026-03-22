from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Any
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

import httpx

from sma_extreme_heat_backend.core.errors import WeatherProviderError

_HOURLY_FIELDS: tuple[str, ...] = (
    "temperature_2m",
    "relative_humidity_2m",
    "cloud_cover",
    "wind_speed_10m",
    "direct_normal_irradiance",
)

_EXPECTED_HOURLY_UNITS: dict[str, set[str]] = {
    "temperature_2m": {"\N{DEGREE SIGN}C"},
    "relative_humidity_2m": {"%"},
    "cloud_cover": {"%"},
    "wind_speed_10m": {"m/s"},
    "direct_normal_irradiance": {"W/m²", "W/m^2"},
}


@dataclass(frozen=True)
class CurrentWeather:
    tdb: float | None
    rh: float | None
    cloud: float | None
    wind: float | None
    radiation: float | None
    raw: dict[str, Any]


@dataclass(frozen=True)
class HourlyWeatherPoint:
    raw_time: str
    time_utc: datetime
    tdb: float | None
    rh: float | None
    cloud: float | None
    wind: float | None
    radiation: float | None


@dataclass(frozen=True)
class WeatherForecast:
    points: list[HourlyWeatherPoint]
    raw: dict[str, Any]
    provider_timezone: str


def _to_float_or_none(value: Any) -> float | None:
    if value is None:
        return None

    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _resolve_provider_timezone(payload: dict[str, Any]) -> tuple[str, ZoneInfo]:
    raw_timezone = payload.get("timezone")
    if not isinstance(raw_timezone, str) or raw_timezone.strip() == "":
        raise WeatherProviderError("Weather provider response was missing timezone")

    try:
        return raw_timezone, ZoneInfo(raw_timezone)
    except ZoneInfoNotFoundError as exc:
        raise WeatherProviderError(
            f"Weather provider response contained invalid timezone '{raw_timezone}'"
        ) from exc


def _to_utc_timestamp_or_none(
    value: Any,
    *,
    provider_time_zone: ZoneInfo,
) -> datetime | None:
    if not isinstance(value, str):
        return None

    normalized = value.replace("Z", "+00:00")
    try:
        timestamp = datetime.fromisoformat(normalized)
    except ValueError:
        return None

    if timestamp.tzinfo is None:
        return timestamp.replace(tzinfo=provider_time_zone).astimezone(UTC)
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


def _extract_hourly_series(
    payload: dict[str, Any],
) -> tuple[str, list[datetime], dict[str, list[Any]]]:
    timezone_name, provider_time_zone = _resolve_provider_timezone(payload)
    hourly = payload.get("hourly")
    if not isinstance(hourly, dict):
        raise WeatherProviderError("Weather provider response was missing hourly data")

    raw_time = hourly.get("time")
    if not isinstance(raw_time, list):
        raise WeatherProviderError("Weather provider response was missing hourly.time")

    timestamps = [
        _to_utc_timestamp_or_none(item, provider_time_zone=provider_time_zone) for item in raw_time
    ]
    if any(item is None for item in timestamps):
        raise WeatherProviderError(
            "Weather provider response contained invalid hourly.time values"
        )

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

    return timezone_name, timestamps, series_data


def _select_hourly_points(payload: dict[str, Any]) -> tuple[str, list[HourlyWeatherPoint]]:
    timezone_name, timestamps, series_data = _extract_hourly_series(payload)
    threshold = datetime.now(tz=UTC) - timedelta(hours=1)
    forecast_window_end = threshold + timedelta(days=7)
    candidate_rows = [
        (idx, timestamp)
        for idx, timestamp in sorted(enumerate(timestamps), key=lambda item: item[1])
        if threshold <= timestamp < forecast_window_end
    ]
    if not candidate_rows:
        raise WeatherProviderError("No hourly record after now-1h")

    return (
        timezone_name,
        [
            HourlyWeatherPoint(
                raw_time=str(series_data["time"][idx]),
                time_utc=timestamp,
                tdb=_to_float_or_none(series_data["temperature_2m"][idx]),
                rh=_to_float_or_none(series_data["relative_humidity_2m"][idx]),
                cloud=_to_float_or_none(series_data["cloud_cover"][idx]),
                wind=_to_float_or_none(series_data["wind_speed_10m"][idx]),
                radiation=_to_float_or_none(
                    series_data["direct_normal_irradiance"][idx]
                ),
            )
            for idx, timestamp in candidate_rows
        ],
    )


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

    async def fetch_weather_forecast(
        self,
        *,
        latitude: float,
        longitude: float,
    ) -> WeatherForecast:
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
        timezone_name, points = _select_hourly_points(payload)
        return WeatherForecast(
            points=points,
            raw=payload,
            provider_timezone=timezone_name,
        )

    async def fetch_current_weather(
        self,
        *,
        latitude: float,
        longitude: float,
    ) -> CurrentWeather:
        forecast = await self.fetch_weather_forecast(
            latitude=latitude,
            longitude=longitude,
        )
        current = forecast.points[0]
        return CurrentWeather(
            tdb=current.tdb,
            rh=current.rh,
            cloud=current.cloud,
            wind=current.wind,
            radiation=current.radiation,
            raw=forecast.raw,
        )

    async def aclose(self) -> None:
        if self._owns_client:
            await self._client.aclose()
