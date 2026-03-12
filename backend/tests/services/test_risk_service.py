from __future__ import annotations

from datetime import UTC, datetime, timedelta

import pytest

from sma_extreme_heat_backend.calculators.base import SportsHeatStressInput, SportsHeatStressOutput
from sma_extreme_heat_backend.clients.open_meteo import HourlyWeatherPoint, WeatherForecast
from sma_extreme_heat_backend.core.errors import ModelInputUnavailableError
from sma_extreme_heat_backend.schemas.home import RiskRequest
from sma_extreme_heat_backend.services.risk_service import RiskService


class FakeWeatherClient:
    def __init__(
        self,
        *,
        expected_latitude: float | None = -33.847,
        expected_longitude: float | None = 151.067,
        tdb: float | None = 31.0,
        rh: float | None = 62.0,
        vr: float | None = 1.5,
    ) -> None:
        self.calls = 0
        self.expected_latitude = expected_latitude
        self.expected_longitude = expected_longitude
        self.tdb = tdb
        self.rh = rh
        self.vr = vr
        base_time = datetime(2026, 3, 9, 0, 0, tzinfo=UTC)
        self.points = [
            HourlyWeatherPoint(
                time_utc=base_time + timedelta(hours=offset),
                tdb=tdb + offset if tdb is not None else None,
                rh=rh + offset if rh is not None else None,
                vr=vr + (offset * 0.1) if vr is not None else None,
            )
            for offset in range(3)
        ]

    async def fetch_weather_forecast(self, *, latitude: float, longitude: float) -> WeatherForecast:
        self.calls += 1
        if self.expected_latitude is not None:
            assert latitude == self.expected_latitude
        if self.expected_longitude is not None:
            assert longitude == self.expected_longitude
        return WeatherForecast(
            points=self.points,
            raw={"provider": "open-meteo"},
        )

    async def aclose(self) -> None:
        return None


class FakeCalculator:
    def __init__(self) -> None:
        self.calls = 0
        self.payloads: list[SportsHeatStressInput] = []

    def model_sports_heat_stress(self, payload: SportsHeatStressInput) -> SportsHeatStressOutput:
        self.calls += 1
        self.payloads.append(payload)
        return SportsHeatStressOutput(
            data={
                "risk_level_interpolated": round(1.84 + (self.calls * 0.1), 2),
                "t_medium": 34.5,
                "t_high": 37.1,
                "t_extreme": 39.2,
                "recommendation": "Increase hydration & modify clothing",
            },
            meta={
                "model": "pythermalcomfort.models.sports_heat_stress_risk",
                "inputs": {
                    "sport": payload.sport,
                    "tdb": payload.tdb,
                    "rh": payload.rh,
                    "vr": payload.vr,
                    "tr": payload.tr,
                },
            },
        )


async def test_risk_service_uses_ttl_cache_for_same_input() -> None:
    weather_client = FakeWeatherClient()
    calculator = FakeCalculator()

    service = RiskService(
        weather_client=weather_client,
        calculator=calculator,
        ttl_seconds=600,
    )

    payload = RiskRequest(
        sport="SOCCER",
        latitude=-33.847,
        longitude=151.067,
    )

    first = await service.calculate_home_risk(payload)
    second = await service.calculate_home_risk(payload)

    assert weather_client.calls == 1
    assert calculator.calls == 3
    assert first == second
    assert calculator.payloads[0].sport == "SOCCER"
    assert calculator.payloads[0].tdb == 31.0
    assert calculator.payloads[0].rh == 62.0
    assert calculator.payloads[0].vr == 1.02
    assert calculator.payloads[0].tr == 31.0
    assert first.heat_risk["risk_level_interpolated"] == 1.94
    assert first.meta_data["location"] == {"latitude": -33.847, "longitude": 151.067}
    assert first.meta_data["inputs"]["vr"] == 1.02
    assert "mapbox" not in first.meta_data
    assert first.model_dump()["forecast"] == [
        {
            "time_utc": "2026-03-09T00:00:00Z",
            "risk_level_interpolated": 1.94,
        },
        {
            "time_utc": "2026-03-09T01:00:00Z",
            "risk_level_interpolated": 2.04,
        },
        {
            "time_utc": "2026-03-09T02:00:00Z",
            "risk_level_interpolated": 2.14,
        },
    ]


async def test_risk_service_cache_key_changes_with_coordinates() -> None:
    weather_client = FakeWeatherClient(expected_latitude=None, expected_longitude=None)
    calculator = FakeCalculator()
    service = RiskService(
        weather_client=weather_client,
        calculator=calculator,
        ttl_seconds=600,
    )

    first_payload = RiskRequest(
        sport="SOCCER",
        latitude=-33.847,
        longitude=151.067,
    )
    second_payload = RiskRequest(
        sport="SOCCER",
        latitude=-33.847001,
        longitude=151.067001,
    )

    await service.calculate_home_risk(first_payload)
    await service.calculate_home_risk(second_payload)

    assert weather_client.calls == 2
    assert calculator.calls == 6


async def test_risk_service_uses_sport_default_when_scaled_wind_is_lower() -> None:
    weather_client = FakeWeatherClient(vr=0.9)
    calculator = FakeCalculator()
    service = RiskService(
        weather_client=weather_client,
        calculator=calculator,
        ttl_seconds=600,
    )

    payload = RiskRequest(
        sport="SOCCER",
        latitude=-33.847,
        longitude=151.067,
    )

    response = await service.calculate_home_risk(payload)

    assert calculator.calls == 3
    assert calculator.payloads[0].vr == 1.0
    assert response.meta_data["inputs"]["vr"] == 1.0
    assert response.forecast[0].risk_level_interpolated == response.heat_risk[
        "risk_level_interpolated"
    ]


async def test_risk_service_uses_higher_sport_default_for_running() -> None:
    weather_client = FakeWeatherClient(vr=1.5)
    calculator = FakeCalculator()
    service = RiskService(
        weather_client=weather_client,
        calculator=calculator,
        ttl_seconds=600,
    )

    payload = RiskRequest(
        sport="RUNNING",
        latitude=-33.847,
        longitude=151.067,
    )

    response = await service.calculate_home_risk(payload)

    assert calculator.calls == 3
    assert calculator.payloads[0].vr == 2.0
    assert response.meta_data["inputs"]["vr"] == 2.0


async def test_risk_service_preserves_scaled_wind_when_above_sport_default() -> None:
    weather_client = FakeWeatherClient(vr=4.0)
    calculator = FakeCalculator()
    service = RiskService(
        weather_client=weather_client,
        calculator=calculator,
        ttl_seconds=600,
    )

    payload = RiskRequest(
        sport="RUNNING",
        latitude=-33.847,
        longitude=151.067,
    )

    response = await service.calculate_home_risk(payload)

    assert calculator.calls == 3
    assert calculator.payloads[0].vr == pytest.approx(2.72)
    assert response.meta_data["inputs"]["vr"] == pytest.approx(2.72)


async def test_risk_service_skips_future_points_with_missing_inputs() -> None:
    weather_client = FakeWeatherClient()
    weather_client.points = [
        HourlyWeatherPoint(
            time_utc=datetime(2026, 3, 9, 0, 0, tzinfo=UTC),
            tdb=31.0,
            rh=62.0,
            vr=1.5,
        ),
        HourlyWeatherPoint(
            time_utc=datetime(2026, 3, 9, 1, 0, tzinfo=UTC),
            tdb=32.0,
            rh=63.0,
            vr=None,
        ),
        HourlyWeatherPoint(
            time_utc=datetime(2026, 3, 9, 2, 0, tzinfo=UTC),
            tdb=33.0,
            rh=64.0,
            vr=1.7,
        ),
    ]
    calculator = FakeCalculator()
    service = RiskService(
        weather_client=weather_client,
        calculator=calculator,
        ttl_seconds=600,
    )

    payload = RiskRequest(
        sport="SOCCER",
        latitude=-33.847,
        longitude=151.067,
    )

    response = await service.calculate_home_risk(payload)

    assert calculator.calls == 2
    assert response.model_dump()["forecast"] == [
        {
            "time_utc": "2026-03-09T00:00:00Z",
            "risk_level_interpolated": 1.94,
        },
        {
            "time_utc": "2026-03-09T02:00:00Z",
            "risk_level_interpolated": 2.04,
        },
    ]


async def test_risk_service_missing_vr_raises_unknown_inputs() -> None:
    service = RiskService(
        weather_client=FakeWeatherClient(vr=None),
        calculator=FakeCalculator(),
        ttl_seconds=600,
    )

    payload = RiskRequest(
        sport="SOCCER",
        latitude=-33.847,
        longitude=151.067,
    )

    try:
        await service.calculate_home_risk(payload)
    except ModelInputUnavailableError as exc:
        assert exc.status_code == 422
        assert exc.detail["unknown_inputs"] == ["vr"]
    else:
        raise AssertionError("Expected ModelInputUnavailableError")


async def test_risk_service_missing_tdb_raises_unknown_inputs() -> None:
    service = RiskService(
        weather_client=FakeWeatherClient(tdb=None),
        calculator=FakeCalculator(),
        ttl_seconds=600,
    )

    payload = RiskRequest(
        sport="SOCCER",
        latitude=-33.847,
        longitude=151.067,
    )

    try:
        await service.calculate_home_risk(payload)
    except ModelInputUnavailableError as exc:
        assert exc.status_code == 422
        assert exc.detail["unknown_inputs"] == ["tdb"]
    else:
        raise AssertionError("Expected ModelInputUnavailableError")


async def test_risk_service_missing_current_rh_raises_unknown_inputs() -> None:
    service = RiskService(
        weather_client=FakeWeatherClient(rh=None),
        calculator=FakeCalculator(),
        ttl_seconds=600,
    )

    payload = RiskRequest(
        sport="SOCCER",
        latitude=-33.847,
        longitude=151.067,
    )

    try:
        await service.calculate_home_risk(payload)
    except ModelInputUnavailableError as exc:
        assert exc.status_code == 422
        assert exc.detail["unknown_inputs"] == ["rh"]
    else:
        raise AssertionError("Expected ModelInputUnavailableError")
