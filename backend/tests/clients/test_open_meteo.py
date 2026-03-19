from __future__ import annotations

from datetime import UTC, datetime, timedelta
from zoneinfo import ZoneInfo

import httpx

from sma_extreme_heat_backend.clients.open_meteo import OpenMeteoClient
from sma_extreme_heat_backend.core.errors import WeatherProviderError


def _hourly_time_strings(times: list[datetime], *, timezone_name: str = "GMT") -> list[str]:
    provider_time_zone = ZoneInfo(timezone_name)
    normalized: list[str] = []
    for ts in times:
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=UTC)
        else:
            ts = ts.astimezone(UTC)
        normalized.append(ts.astimezone(provider_time_zone).strftime("%Y-%m-%dT%H:%M"))
    return normalized


def _hourly_payload(
    *,
    times: list[datetime],
    tdb: list[float | None],
    rh: list[float | None],
    cloud: list[float | None],
    wind: list[float | None],
    radiation: list[float | None],
    timezone_name: str = "GMT",
    units_override: dict[str, str] | None = None,
) -> dict:
    units = {
        "temperature_2m": "°C",
        "relative_humidity_2m": "%",
        "cloud_cover": "%",
        "wind_speed_10m": "m/s",
        "direct_normal_irradiance": "W/m²",
    }
    if units_override:
        units.update(units_override)

    return {
        "timezone": timezone_name,
        "hourly_units": units,
        "hourly": {
            "time": _hourly_time_strings(times, timezone_name=timezone_name),
            "temperature_2m": tdb,
            "relative_humidity_2m": rh,
            "cloud_cover": cloud,
            "wind_speed_10m": wind,
            "direct_normal_irradiance": radiation,
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
        cloud=[40.0, 25.0, 20.0],
        wind=[0.9, 1.5, 1.1],
        radiation=[0.0, 720.0, 760.0],
    )

    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.params["hourly"] == (
            "temperature_2m,relative_humidity_2m,cloud_cover,"
            "wind_speed_10m,direct_normal_irradiance"
        )
        assert request.url.params["wind_speed_unit"] == "ms"
        assert request.url.params["timezone"] == "GMT"
        return httpx.Response(status_code=200, json=payload)

    client, mock_client = _build_client(handler)

    weather = await client.fetch_current_weather(latitude=-33.847, longitude=151.067)
    await mock_client.aclose()

    assert weather.tdb == 31.0
    assert weather.rh == 62.0
    assert weather.cloud == 25.0
    assert weather.wind == 1.5
    assert weather.radiation == 720.0


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
        cloud=[40.0, 25.0, 20.0, 15.0],
        wind=[0.9, 1.5, 1.1, 1.0],
        radiation=[0.0, 720.0, 760.0, 780.0],
    )

    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.params["hourly"] == (
            "temperature_2m,relative_humidity_2m,cloud_cover,"
            "wind_speed_10m,direct_normal_irradiance"
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
    assert [point.raw_time for point in weather.points] == [
        now.strftime("%Y-%m-%dT%H:%M"),
        (now + timedelta(hours=1)).strftime("%Y-%m-%dT%H:%M"),
        (now + timedelta(hours=2)).strftime("%Y-%m-%dT%H:%M"),
    ]
    assert [point.tdb for point in weather.points] == [31.0, 33.0, 34.0]
    assert [point.rh for point in weather.points] == [62.0, 61.0, 60.0]
    assert [point.cloud for point in weather.points] == [25.0, 20.0, 15.0]
    assert [point.wind for point in weather.points] == [1.5, 1.1, 1.0]
    assert [point.radiation for point in weather.points] == [720.0, 760.0, 780.0]
    assert weather.provider_timezone == "GMT"


async def test_fetch_weather_forecast_converts_local_hourly_times_back_to_utc() -> None:
    now = datetime.now(tz=UTC).replace(minute=0, second=0, microsecond=0)
    payload = _hourly_payload(
        times=[now - timedelta(hours=2), now, now + timedelta(hours=1)],
        tdb=[19.0, 31.0, 33.0],
        rh=[80.0, 62.0, 61.0],
        cloud=[40.0, 25.0, 20.0],
        wind=[0.9, 1.5, 1.1],
        radiation=[0.0, 720.0, 760.0],
        timezone_name="Australia/Perth",
    )

    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.params["timezone"] == "GMT"
        return httpx.Response(status_code=200, json=payload)

    client, mock_client = _build_client(handler)

    weather = await client.fetch_weather_forecast(latitude=-31.9523, longitude=115.8613)
    await mock_client.aclose()

    assert [point.time_utc for point in weather.points] == [
        now,
        now + timedelta(hours=1),
    ]
    assert weather.provider_timezone == "Australia/Perth"


async def test_fetch_current_weather_rejects_invalid_temperature_unit() -> None:
    now = datetime.now(tz=UTC).replace(minute=0, second=0, microsecond=0)
    payload = _hourly_payload(
        times=[now],
        tdb=[31.0],
        rh=[62.0],
        cloud=[25.0],
        wind=[1.5],
        radiation=[720.0],
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


async def test_fetch_current_weather_rejects_invalid_cloud_cover_unit() -> None:
    now = datetime.now(tz=UTC).replace(minute=0, second=0, microsecond=0)
    payload = _hourly_payload(
        times=[now],
        tdb=[31.0],
        rh=[62.0],
        cloud=[25.0],
        wind=[1.5],
        radiation=[720.0],
        units_override={"cloud_cover": "fraction"},
    )

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(status_code=200, json=payload)

    client, mock_client = _build_client(handler)

    try:
        await client.fetch_current_weather(latitude=-33.847, longitude=151.067)
    except WeatherProviderError as exc:
        assert "cloud_cover" in str(exc.detail)
    else:
        raise AssertionError("Expected WeatherProviderError for invalid cloud cover unit")
    finally:
        await mock_client.aclose()


async def test_fetch_current_weather_rejects_invalid_direct_normal_irradiance_unit() -> None:
    now = datetime.now(tz=UTC).replace(minute=0, second=0, microsecond=0)
    payload = _hourly_payload(
        times=[now],
        tdb=[31.0],
        rh=[62.0],
        cloud=[25.0],
        wind=[1.5],
        radiation=[720.0],
        units_override={"direct_normal_irradiance": "kW/m²"},
    )

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(status_code=200, json=payload)

    client, mock_client = _build_client(handler)

    try:
        await client.fetch_current_weather(latitude=-33.847, longitude=151.067)
    except WeatherProviderError as exc:
        assert "direct_normal_irradiance" in str(exc.detail)
    else:
        raise AssertionError("Expected WeatherProviderError for invalid radiation unit")
    finally:
        await mock_client.aclose()


async def test_fetch_current_weather_rejects_missing_timezone_metadata() -> None:
    now = datetime.now(tz=UTC).replace(minute=0, second=0, microsecond=0)
    payload = _hourly_payload(
        times=[now],
        tdb=[31.0],
        rh=[62.0],
        cloud=[25.0],
        wind=[1.5],
        radiation=[720.0],
    )
    payload.pop("timezone")

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(status_code=200, json=payload)

    client, mock_client = _build_client(handler)

    try:
        await client.fetch_current_weather(latitude=-33.847, longitude=151.067)
    except WeatherProviderError as exc:
        assert exc.detail == "Weather provider response was missing timezone"
    else:
        raise AssertionError("Expected WeatherProviderError for missing timezone metadata")
    finally:
        await mock_client.aclose()


async def test_fetch_current_weather_rejects_invalid_timezone_metadata() -> None:
    now = datetime.now(tz=UTC).replace(minute=0, second=0, microsecond=0)
    payload = _hourly_payload(
        times=[now],
        tdb=[31.0],
        rh=[62.0],
        cloud=[25.0],
        wind=[1.5],
        radiation=[720.0],
    )
    payload["timezone"] = "Mars/Olympus"

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(status_code=200, json=payload)

    client, mock_client = _build_client(handler)

    try:
        await client.fetch_current_weather(latitude=-33.847, longitude=151.067)
    except WeatherProviderError as exc:
        assert "invalid timezone" in str(exc.detail)
    else:
        raise AssertionError("Expected WeatherProviderError for invalid timezone metadata")
    finally:
        await mock_client.aclose()


async def test_fetch_current_weather_raises_when_no_hourly_record_after_now_minus_1h() -> None:
    now = datetime.now(tz=UTC).replace(minute=0, second=0, microsecond=0)
    payload = _hourly_payload(
        times=[now - timedelta(hours=4), now - timedelta(hours=3)],
        tdb=[20.0, 21.0],
        rh=[70.0, 69.0],
        cloud=[35.0, 30.0],
        wind=[1.0, 1.2],
        radiation=[0.0, 0.0],
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
        cloud=[35.0, 30.0, 25.0],
        wind=[0.9, 1.2, 1.8],
        radiation=[0.0, 640.0, 720.0],
    )

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(status_code=200, json=payload)

    client, mock_client = _build_client(handler)

    weather = await client.fetch_current_weather(latitude=-33.847, longitude=151.067)
    await mock_client.aclose()

    assert weather.tdb == 25.0
    assert weather.rh == 60.0
    assert weather.wind == 1.2
    assert weather.radiation == 640.0


async def test_fetch_current_weather_rejects_invalid_hourly_time_value() -> None:
    payload = {
        "timezone": "GMT",
        "hourly_units": {
            "temperature_2m": "°C",
            "relative_humidity_2m": "%",
            "cloud_cover": "%",
            "wind_speed_10m": "m/s",
            "direct_normal_irradiance": "W/m²",
        },
        "hourly": {
            "time": ["invalid-time"],
            "temperature_2m": [31.0],
            "relative_humidity_2m": [62.0],
            "cloud_cover": [25.0],
            "wind_speed_10m": [1.5],
            "direct_normal_irradiance": [720.0],
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


async def test_fetch_current_weather_rejects_length_mismatch_for_direct_normal_irradiance() -> None:
    now = datetime.now(tz=UTC).replace(minute=0, second=0, microsecond=0)
    payload = _hourly_payload(
        times=[now, now + timedelta(hours=1)],
        tdb=[31.0, 32.0],
        rh=[62.0, 61.0],
        cloud=[25.0, 20.0],
        wind=[1.5, 1.1],
        radiation=[720.0],
    )

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(status_code=200, json=payload)

    client, mock_client = _build_client(handler)

    try:
        await client.fetch_current_weather(latitude=-33.847, longitude=151.067)
    except WeatherProviderError as exc:
        assert exc.detail == (
            "Weather provider response length mismatch for hourly.direct_normal_irradiance"
        )
    else:
        raise AssertionError("Expected WeatherProviderError for radiation length mismatch")
    finally:
        await mock_client.aclose()
