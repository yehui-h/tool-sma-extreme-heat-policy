from __future__ import annotations

from datetime import UTC, datetime, timedelta

import pandas as pd
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
    ) -> None:
        self.calls = 0
        self.expected_latitude = expected_latitude
        self.expected_longitude = expected_longitude
        base_time = datetime(2026, 3, 9, 0, 0, tzinfo=UTC)
        self.points = [
            HourlyWeatherPoint(
                raw_time=(base_time + timedelta(hours=offset)).strftime("%Y-%m-%dT%H:%M"),
                time_utc=base_time + timedelta(hours=offset),
                tdb=31.0 + offset,
                rh=62.0 + offset,
                cloud=15.0 + offset,
                wind=1.5 + (offset * 0.1),
                radiation=700.0 + (offset * 50.0),
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
            raw={"provider": "open-meteo", "timezone": "GMT"},
            provider_timezone="GMT",
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


def _build_mrt_dataframe(
    *,
    timezone_name: str = "Australia/Sydney",
    wind_start: float = 1.5,
    tr_offset: float = 6.25,
    current_missing: set[str] | None = None,
    future_missing_by_row: dict[int, set[str]] | None = None,
) -> pd.DataFrame:
    current_missing = current_missing or set()
    future_missing_by_row = future_missing_by_row or {}
    index_utc = pd.date_range(
        start="2026-03-09T00:00:00Z",
        periods=3,
        freq="1h",
    )
    index_local = index_utc.tz_convert(timezone_name)
    rows: list[dict[str, float]] = []

    for offset, _ in enumerate(index_local):
        missing_fields = (
            current_missing if offset == 0 else future_missing_by_row.get(offset, set())
        )
        tdb = 31.0 + offset
        row = {
            "tdb": tdb,
            "rh": 62.0 + offset,
            "cloud": 15.0 + offset,
            "wind": wind_start + (offset * 0.1),
            "radiation": 700.0 + (offset * 50.0),
            "elevation": 50.0 + offset,
            "dni": 525.0 + (offset * 37.5),
            "delta_mrt": tr_offset,
            "tr": tdb + tr_offset,
        }
        for field in missing_fields:
            row[field] = float("nan")
        rows.append(row)

    return pd.DataFrame(rows, index=index_local)


def _install_mrt_pipeline(
    monkeypatch: pytest.MonkeyPatch,
    *,
    df: pd.DataFrame,
    timezone_name: str = "Australia/Sydney",
) -> None:
    monkeypatch.setattr(
        "sma_extreme_heat_backend.services.risk_service.resolve_timezone_name",
        lambda **_: timezone_name,
    )
    monkeypatch.setattr(
        "sma_extreme_heat_backend.services.risk_service.build_mrt_dataframe",
        lambda **_: df.copy(),
    )


async def test_risk_service_uses_ttl_cache_for_same_input(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    weather_client = FakeWeatherClient()
    calculator = FakeCalculator()
    _install_mrt_pipeline(monkeypatch, df=_build_mrt_dataframe())

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
    assert calculator.payloads[0].tr == 37.25
    assert first.heat_risk["risk_level_interpolated"] == 1.94
    assert first.meta_data["location"] == {
        "latitude": -33.847,
        "longitude": 151.067,
        "timezone": "Australia/Sydney",
    }
    assert first.meta_data["inputs"]["vr"] == 1.02
    assert first.meta_data["mrt"] == {
        "timezone": "Australia/Sydney",
        "radiation": 700.0,
        "elevation": 50.0,
        "dni": 525.0,
        "delta_mrt": 6.25,
        "tr": 37.25,
        "constants": {
            "sharp": 45,
            "sol_transmittance": 1,
            "f_svv": 0.8,
            "f_bes": 1,
            "asw": 0.6,
            "posture": "standing",
            "floor_reflectance": 0.25,
            "solar_radiation_correction_coefficient": 0.75,
        },
    }
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


async def test_risk_service_cache_key_changes_with_coordinates(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    weather_client = FakeWeatherClient(expected_latitude=None, expected_longitude=None)
    calculator = FakeCalculator()
    _install_mrt_pipeline(monkeypatch, df=_build_mrt_dataframe())
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


async def test_risk_service_uses_sport_default_when_scaled_wind_is_lower(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    weather_client = FakeWeatherClient()
    calculator = FakeCalculator()
    _install_mrt_pipeline(monkeypatch, df=_build_mrt_dataframe(wind_start=0.9))
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


async def test_risk_service_uses_higher_sport_default_for_running(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    weather_client = FakeWeatherClient()
    calculator = FakeCalculator()
    _install_mrt_pipeline(monkeypatch, df=_build_mrt_dataframe(wind_start=1.5))
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


async def test_risk_service_preserves_scaled_wind_when_above_sport_default(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    weather_client = FakeWeatherClient()
    calculator = FakeCalculator()
    _install_mrt_pipeline(monkeypatch, df=_build_mrt_dataframe(wind_start=4.0))
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


async def test_risk_service_skips_future_points_with_missing_inputs(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    weather_client = FakeWeatherClient()
    calculator = FakeCalculator()
    _install_mrt_pipeline(
        monkeypatch,
        df=_build_mrt_dataframe(future_missing_by_row={1: {"wind"}}),
    )
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


async def test_risk_service_missing_current_wind_raises_unknown_inputs(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _install_mrt_pipeline(monkeypatch, df=_build_mrt_dataframe(current_missing={"wind"}))
    service = RiskService(
        weather_client=FakeWeatherClient(),
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
        assert exc.detail["unknown_inputs"] == ["wind"]
        assert exc.detail["available_inputs"] == {
            "tdb": 31.0,
            "rh": 62.0,
            "wind": None,
            "radiation": 700.0,
            "tr": 37.25,
        }
    else:
        raise AssertionError("Expected ModelInputUnavailableError")


async def test_risk_service_missing_tdb_raises_unknown_inputs(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _install_mrt_pipeline(monkeypatch, df=_build_mrt_dataframe(current_missing={"tdb"}))
    service = RiskService(
        weather_client=FakeWeatherClient(),
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


async def test_risk_service_missing_current_rh_raises_unknown_inputs(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _install_mrt_pipeline(monkeypatch, df=_build_mrt_dataframe(current_missing={"rh"}))
    service = RiskService(
        weather_client=FakeWeatherClient(),
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


async def test_risk_service_missing_current_radiation_raises_unknown_inputs(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _install_mrt_pipeline(
        monkeypatch,
        df=_build_mrt_dataframe(current_missing={"radiation", "tr", "delta_mrt", "dni"}),
    )
    service = RiskService(
        weather_client=FakeWeatherClient(),
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
        assert exc.detail["unknown_inputs"] == ["radiation", "tr"]
    else:
        raise AssertionError("Expected ModelInputUnavailableError")
