from __future__ import annotations

import httpx

from sma_extreme_heat_backend.calculators.legacy_tg import LegacyTgResult
from sma_extreme_heat_backend.clients.open_meteo import OpenMeteoClient


async def test_fetch_current_weather_derives_legacy_tg_tr(monkeypatch) -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.params["current"] == (
            "temperature_2m,relative_humidity_2m,wind_speed_10m,cloud_cover"
        )
        assert request.url.params["wind_speed_unit"] == "ms"
        assert request.url.params["timezone"] == "GMT"
        return httpx.Response(
            status_code=200,
            json={
                "current": {
                    "time": "2026-02-18T00:00",
                    "temperature_2m": 31.0,
                    "relative_humidity_2m": 62.0,
                    "wind_speed_10m": 1.5,
                    "cloud_cover": 65.0,
                }
            },
        )

    mock_client = httpx.AsyncClient(
        base_url="https://api.open-meteo.com/v1",
        transport=httpx.MockTransport(handler),
    )
    client = OpenMeteoClient(
        base_url="https://api.open-meteo.com/v1",
        timeout_seconds=10.0,
        client=mock_client,
    )

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
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            status_code=200,
            json={
                "current": {
                    "time": "2026-02-18T00:00",
                    "temperature_2m": 31.0,
                    "relative_humidity_2m": 62.0,
                    "wind_speed_10m": 1.5,
                    "cloud_cover": 65.0,
                }
            },
        )

    mock_client = httpx.AsyncClient(
        base_url="https://api.open-meteo.com/v1",
        transport=httpx.MockTransport(handler),
    )
    client = OpenMeteoClient(
        base_url="https://api.open-meteo.com/v1",
        timeout_seconds=10.0,
        client=mock_client,
    )

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
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            status_code=200,
            json={
                "current": {
                    "time": "2026-02-18T00:00",
                    "temperature_2m": 31.0,
                    "relative_humidity_2m": 62.0,
                    "wind_speed_10m": 1.5,
                }
            },
        )

    mock_client = httpx.AsyncClient(
        base_url="https://api.open-meteo.com/v1",
        transport=httpx.MockTransport(handler),
    )
    client = OpenMeteoClient(
        base_url="https://api.open-meteo.com/v1",
        timeout_seconds=10.0,
        client=mock_client,
    )

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
