from __future__ import annotations

import httpx
import pandas as pd

from sma_extreme_heat_backend.calculators.legacy_tg import LegacyTgResult
from sma_extreme_heat_backend.clients.open_meteo import OpenMeteoClient
from sma_extreme_heat_backend.core.errors import WeatherProviderError


def _hourly_time_strings(times: list[pd.Timestamp]) -> list[str]:
    normalized: list[str] = []
    for ts in times:
        if ts.tzinfo is None:
            ts = ts.tz_localize("GMT")
        else:
            ts = ts.tz_convert("GMT")
        normalized.append(ts.strftime("%Y-%m-%dT%H:%M"))
    return normalized


def _hourly_payload(
    *,
    times: list[pd.Timestamp],
    tdb: list[float | None],
    rh: list[float | None],
    cloud: list[float | None],
    wind: list[float | None],
    direct_radiation: list[float | None],
    units_override: dict[str, str] | None = None,
) -> dict:
    units = {
        "temperature_2m": "°C",
        "relative_humidity_2m": "%",
        "cloud_cover": "%",
        "wind_speed_10m": "m/s",
        "direct_radiation": "W/m²",
    }
    if units_override:
        units.update(units_override)

    return {
        "hourly_units": units,
        "hourly": {
            "time": _hourly_time_strings(times),
            "temperature_2m": tdb,
            "relative_humidity_2m": rh,
            "cloud_cover": cloud,
            "wind_speed_10m": wind,
            "direct_radiation": direct_radiation,
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


async def test_fetch_current_weather_derives_legacy_tg_tr(monkeypatch) -> None:
    now = pd.Timestamp.now(tz="GMT").floor("h")
    payload = _hourly_payload(
        times=[now - pd.Timedelta(hours=2), now, now + pd.Timedelta(hours=1)],
        tdb=[19.0, 31.0, 33.0],
        rh=[80.0, 62.0, 61.0],
        cloud=[75.0, 65.0, 40.0],
        wind=[0.9, 1.5, 1.1],
        direct_radiation=[50.0, 120.0, 200.0],
    )

    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.params["hourly"] == (
            "temperature_2m,relative_humidity_2m,cloud_cover,wind_speed_10m,direct_radiation"
        )
        assert request.url.params["wind_speed_unit"] == "ms"
        assert request.url.params["timezone"] == "GMT"
        return httpx.Response(status_code=200, json=payload)

    client, mock_client = _build_client(handler)

    monkeypatch.setattr(
        "sma_extreme_heat_backend.clients.open_meteo._timezone_at",
        lambda latitude, longitude: "Australia/Sydney",
    )
    monkeypatch.setattr(
        "sma_extreme_heat_backend.clients.open_meteo.calculate_tg_tr_legacy",
        lambda **kwargs: LegacyTgResult(
            tg=2.4,
            tr=35.7,
            vr_adjusted=0.45,
            delta_mrt=4.7,
            meta={"source": "legacy"},
        ),
    )

    weather = await client.fetch_current_weather(latitude=-33.847, longitude=151.067)
    await mock_client.aclose()

    assert weather.tdb == 31.0
    assert weather.rh == 62.0
    assert weather.vr == 0.45
    assert weather.tg == 2.4
    assert weather.tr == 35.7
    assert weather.legacy_meta == {"source": "legacy"}


async def test_fetch_current_weather_sets_missing_tg_tr_when_timezone_missing(monkeypatch) -> None:
    now = pd.Timestamp.now(tz="GMT").floor("h")
    payload = _hourly_payload(
        times=[now - pd.Timedelta(hours=2), now],
        tdb=[24.0, 31.0],
        rh=[70.0, 62.0],
        cloud=[40.0, 65.0],
        wind=[1.0, 1.5],
        direct_radiation=[20.0, 100.0],
    )

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(status_code=200, json=payload)

    client, mock_client = _build_client(handler)

    monkeypatch.setattr(
        "sma_extreme_heat_backend.clients.open_meteo._timezone_at",
        lambda latitude, longitude: None,
    )

    weather = await client.fetch_current_weather(latitude=-33.847, longitude=151.067)
    await mock_client.aclose()

    assert weather.tdb == 31.0
    assert weather.rh == 62.0
    assert weather.vr == 1.5
    assert weather.tg is None
    assert weather.tr is None
    assert weather.legacy_meta is None


async def test_fetch_current_weather_sets_missing_tg_tr_when_cloud_cover_missing(
    monkeypatch,
) -> None:
    now = pd.Timestamp.now(tz="GMT").floor("h")
    payload = _hourly_payload(
        times=[now - pd.Timedelta(hours=2), now],
        tdb=[24.0, 31.0],
        rh=[70.0, 62.0],
        cloud=[40.0, None],
        wind=[1.0, 1.5],
        direct_radiation=[20.0, 100.0],
    )

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(status_code=200, json=payload)

    client, mock_client = _build_client(handler)

    monkeypatch.setattr(
        "sma_extreme_heat_backend.clients.open_meteo._timezone_at",
        lambda latitude, longitude: "Australia/Sydney",
    )

    weather = await client.fetch_current_weather(latitude=-33.847, longitude=151.067)
    await mock_client.aclose()

    assert weather.tdb == 31.0
    assert weather.rh == 62.0
    assert weather.vr == 1.5
    assert weather.tg is None
    assert weather.tr is None
    assert weather.legacy_meta is None


async def test_fetch_current_weather_rejects_invalid_temperature_unit() -> None:
    now = pd.Timestamp.now(tz="GMT").floor("h")
    payload = _hourly_payload(
        times=[now],
        tdb=[31.0],
        rh=[62.0],
        cloud=[65.0],
        wind=[1.5],
        direct_radiation=[100.0],
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
    now = pd.Timestamp.now(tz="GMT").floor("h")
    payload = _hourly_payload(
        times=[now],
        tdb=[31.0],
        rh=[62.0],
        cloud=[65.0],
        wind=[1.5],
        direct_radiation=[100.0],
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


async def test_fetch_current_weather_raises_when_no_hourly_record_after_now_minus_1h(
    monkeypatch,
) -> None:
    now = pd.Timestamp.now(tz="GMT").floor("h")
    payload = _hourly_payload(
        times=[now - pd.Timedelta(hours=4), now - pd.Timedelta(hours=3)],
        tdb=[20.0, 21.0],
        rh=[70.0, 69.0],
        cloud=[50.0, 55.0],
        wind=[1.0, 1.2],
        direct_radiation=[40.0, 45.0],
    )

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(status_code=200, json=payload)

    client, mock_client = _build_client(handler)

    monkeypatch.setattr(
        "sma_extreme_heat_backend.clients.open_meteo._timezone_at",
        lambda latitude, longitude: "Australia/Sydney",
    )

    try:
        await client.fetch_current_weather(latitude=-33.847, longitude=151.067)
    except WeatherProviderError as exc:
        assert exc.detail == "No hourly record after now-1h"
    else:
        raise AssertionError(
            "Expected WeatherProviderError when no hourly record matches now-1h rule"
        )
    finally:
        await mock_client.aclose()


async def test_fetch_current_weather_selects_first_hourly_record_after_now_minus_1h(
    monkeypatch,
) -> None:
    now = pd.Timestamp.now(tz="GMT").floor("h")
    payload = _hourly_payload(
        times=[now - pd.Timedelta(hours=2), now, now + pd.Timedelta(hours=1)],
        tdb=[20.0, 25.0, 33.0],
        rh=[70.0, 60.0, 50.0],
        cloud=[40.0, 50.0, 60.0],
        wind=[0.9, 1.2, 1.8],
        direct_radiation=[30.0, 40.0, 50.0],
    )

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(status_code=200, json=payload)

    client, mock_client = _build_client(handler)

    monkeypatch.setattr(
        "sma_extreme_heat_backend.clients.open_meteo._timezone_at",
        lambda latitude, longitude: "Australia/Sydney",
    )

    captured: dict[str, float] = {}

    def fake_calculate_tg_tr_legacy(**kwargs) -> LegacyTgResult:
        captured["tdb"] = kwargs["tdb"]
        captured["wind_speed"] = kwargs["wind_speed"]
        captured["cloud_cover"] = kwargs["cloud_cover"]
        return LegacyTgResult(
            tg=1.0,
            tr=28.0,
            vr_adjusted=0.36,
            delta_mrt=3.0,
            meta={"source": "legacy"},
        )

    monkeypatch.setattr(
        "sma_extreme_heat_backend.clients.open_meteo.calculate_tg_tr_legacy",
        fake_calculate_tg_tr_legacy,
    )

    weather = await client.fetch_current_weather(latitude=-33.847, longitude=151.067)
    await mock_client.aclose()

    assert weather.tdb == 25.0
    assert captured["tdb"] == 25.0
    assert captured["wind_speed"] == 1.2
    assert captured["cloud_cover"] == 50.0
