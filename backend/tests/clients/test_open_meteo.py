from __future__ import annotations

from datetime import UTC, datetime, timedelta

import httpx

from sma_extreme_heat_backend.clients.open_meteo import OpenMeteoClient
from sma_extreme_heat_backend.core.errors import WeatherProviderError


def _hourly_time_strings(times: list[datetime]) -> list[str]:
    normalized: list[str] = []
    for ts in times:
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=UTC)
        else:
            ts = ts.astimezone(UTC)
        normalized.append(ts.strftime("%Y-%m-%dT%H:%M"))
    return normalized


def _hourly_payload(
    *,
    times: list[datetime],
    tdb: list[float | None],
    rh: list[float | None],
    wind: list[float | None],
    units_override: dict[str, str] | None = None,
) -> dict:
    units = {
        "temperature_2m": "°C",
        "relative_humidity_2m": "%",
        "wind_speed_10m": "m/s",
    }
    if units_override:
        units.update(units_override)

    return {
        "hourly_units": units,
        "hourly": {
            "time": _hourly_time_strings(times),
            "temperature_2m": tdb,
            "relative_humidity_2m": rh,
            "wind_speed_10m": wind,
        },
    }


def _build_client(handler) -> tuple[OpenMeteoClient, httpx.AsyncClient]:
    mock_client = httpx.AsyncClient(
        base_url="https://api.open-meteo.com/v1",
        transport=httpx.MockTransport(handler),
    )
    client = OpenMeteoClient(
        base_url="https://api.open-meteo.com/v1",
        timeout_seconds=10.0,
        client=mock_client,
    )
    return client, mock_client


async def test_fetch_current_weather_returns_selected_hourly_values() -> None:
    now = datetime.now(tz=UTC).replace(minute=0, second=0, microsecond=0)
    payload = _hourly_payload(
        times=[now - timedelta(hours=2), now, now + timedelta(hours=1)],
        tdb=[19.0, 31.0, 33.0],
        rh=[80.0, 62.0, 61.0],
        wind=[0.9, 1.5, 1.1],
    )

    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.params["hourly"] == (
            "temperature_2m,relative_humidity_2m,wind_speed_10m"
        )
        assert request.url.params["wind_speed_unit"] == "ms"
        assert request.url.params["timezone"] == "GMT"
        return httpx.Response(status_code=200, json=payload)

    client, mock_client = _build_client(handler)

    weather = await client.fetch_current_weather(latitude=-33.847, longitude=151.067)
    await mock_client.aclose()

    assert weather.tdb == 31.0
    assert weather.rh == 62.0
    assert weather.vr == 1.5


async def test_fetch_weather_forecast_returns_hourly_points_from_now_minus_1h() -> None:
    now = datetime.now(tz=UTC).replace(minute=0, second=0, microsecond=0)
    payload = _hourly_payload(
        times=[
            now - timedelta(hours=2),
            now,
            now + timedelta(hours=1),
            now + timedelta(hours=2),
        ],
        tdb=[19.0, 31.0, 33.0, 34.0],
        rh=[80.0, 62.0, 61.0, 60.0],
        wind=[0.9, 1.5, 1.1, 1.0],
    )

    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.params["hourly"] == (
            "temperature_2m,relative_humidity_2m,wind_speed_10m"
        )
        assert request.url.params["wind_speed_unit"] == "ms"
        assert request.url.params["timezone"] == "GMT"
        return httpx.Response(status_code=200, json=payload)

    client, mock_client = _build_client(handler)

    weather = await client.fetch_weather_forecast(latitude=-33.847, longitude=151.067)
    await mock_client.aclose()

    assert [point.time_utc for point in weather.points] == [
        now,
        now + timedelta(hours=1),
        now + timedelta(hours=2),
    ]
    assert [point.tdb for point in weather.points] == [31.0, 33.0, 34.0]
    assert [point.rh for point in weather.points] == [62.0, 61.0, 60.0]
    assert [point.vr for point in weather.points] == [1.5, 1.1, 1.0]


async def test_fetch_current_weather_rejects_invalid_temperature_unit() -> None:
    now = datetime.now(tz=UTC).replace(minute=0, second=0, microsecond=0)
    payload = _hourly_payload(
        times=[now],
        tdb=[31.0],
        rh=[62.0],
        wind=[1.5],
        units_override={"temperature_2m": "°F"},
    )

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(status_code=200, json=payload)

    client, mock_client = _build_client(handler)

    try:
        await client.fetch_current_weather(latitude=-33.847, longitude=151.067)
    except WeatherProviderError as exc:
        assert "temperature_2m" in str(exc.detail)
    else:
        raise AssertionError("Expected WeatherProviderError for invalid temperature unit")
    finally:
        await mock_client.aclose()


async def test_fetch_current_weather_rejects_invalid_wind_speed_unit() -> None:
    now = datetime.now(tz=UTC).replace(minute=0, second=0, microsecond=0)
    payload = _hourly_payload(
        times=[now],
        tdb=[31.0],
        rh=[62.0],
        wind=[1.5],
        units_override={"wind_speed_10m": "km/h"},
    )

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(status_code=200, json=payload)

    client, mock_client = _build_client(handler)

    try:
        await client.fetch_current_weather(latitude=-33.847, longitude=151.067)
    except WeatherProviderError as exc:
        assert "wind_speed_10m" in str(exc.detail)
    else:
        raise AssertionError("Expected WeatherProviderError for invalid wind speed unit")
    finally:
        await mock_client.aclose()


async def test_fetch_current_weather_rejects_invalid_humidity_unit() -> None:
    now = datetime.now(tz=UTC).replace(minute=0, second=0, microsecond=0)
    payload = _hourly_payload(
        times=[now],
        tdb=[31.0],
        rh=[62.0],
        wind=[1.5],
        units_override={"relative_humidity_2m": "fraction"},
    )

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(status_code=200, json=payload)

    client, mock_client = _build_client(handler)

    try:
        await client.fetch_current_weather(latitude=-33.847, longitude=151.067)
    except WeatherProviderError as exc:
        assert "relative_humidity_2m" in str(exc.detail)
    else:
        raise AssertionError("Expected WeatherProviderError for invalid relative humidity unit")
    finally:
        await mock_client.aclose()


async def test_fetch_current_weather_raises_when_no_hourly_record_after_now_minus_1h() -> None:
    now = datetime.now(tz=UTC).replace(minute=0, second=0, microsecond=0)
    payload = _hourly_payload(
        times=[now - timedelta(hours=4), now - timedelta(hours=3)],
        tdb=[20.0, 21.0],
        rh=[70.0, 69.0],
        wind=[1.0, 1.2],
    )

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(status_code=200, json=payload)

    client, mock_client = _build_client(handler)

    try:
        await client.fetch_weather_forecast(latitude=-33.847, longitude=151.067)
    except WeatherProviderError as exc:
        assert exc.detail == "No hourly record after now-1h"
    else:
        raise AssertionError(
            "Expected WeatherProviderError when no hourly record matches now-1h rule"
        )
    finally:
        await mock_client.aclose()


async def test_fetch_current_weather_selects_first_hourly_record_after_now_minus_1h() -> None:
    now = datetime.now(tz=UTC).replace(minute=0, second=0, microsecond=0)
    payload = _hourly_payload(
        times=[now - timedelta(hours=2), now, now + timedelta(hours=1)],
        tdb=[20.0, 25.0, 33.0],
        rh=[70.0, 60.0, 50.0],
        wind=[0.9, 1.2, 1.8],
    )

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(status_code=200, json=payload)

    client, mock_client = _build_client(handler)

    weather = await client.fetch_weather_forecast(latitude=-33.847, longitude=151.067)
    await mock_client.aclose()

    assert weather.points[0].tdb == 25.0
    assert weather.points[0].rh == 60.0
    assert weather.points[0].vr == 1.2


async def test_fetch_current_weather_rejects_invalid_hourly_time_value() -> None:
    payload = {
        "hourly_units": {
            "temperature_2m": "°C",
            "relative_humidity_2m": "%",
            "wind_speed_10m": "m/s",
        },
        "hourly": {
            "time": ["invalid-time"],
            "temperature_2m": [31.0],
            "relative_humidity_2m": [62.0],
            "wind_speed_10m": [1.5],
        },
    }

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(status_code=200, json=payload)

    client, mock_client = _build_client(handler)

    try:
        await client.fetch_current_weather(latitude=-33.847, longitude=151.067)
    except WeatherProviderError as exc:
        assert exc.detail == "Weather provider response contained invalid hourly.time values"
    else:
        raise AssertionError("Expected WeatherProviderError for invalid hourly.time values")
    finally:
        await mock_client.aclose()
