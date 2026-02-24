from __future__ import annotations

from sma_extreme_heat_backend.calculators.base import SportsHeatStressInput, SportsHeatStressOutput
from sma_extreme_heat_backend.clients.open_meteo import CurrentWeather
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

    async def fetch_current_weather(self, *, latitude: float, longitude: float) -> CurrentWeather:
        self.calls += 1
        if self.expected_latitude is not None:
            assert latitude == self.expected_latitude
        if self.expected_longitude is not None:
            assert longitude == self.expected_longitude
        return CurrentWeather(
            tdb=self.tdb,
            rh=self.rh,
            vr=self.vr,
            raw={"provider": "open-meteo"},
        )

    async def aclose(self) -> None:
        return None


class FakeCalculator:
    def __init__(self) -> None:
        self.calls = 0

    def model_sports_heat_stress(self, payload: SportsHeatStressInput) -> SportsHeatStressOutput:
        self.calls += 1
        assert payload.sport == "SOCCER"
        assert payload.tdb == 31.0
        assert payload.rh == 62.0
        assert payload.vr == 1.5
        assert payload.tr == 31.0
        return SportsHeatStressOutput(
            data={
                "risk_level_interpolated": 1.94,
                "t_medium": 34.5,
                "t_high": 37.1,
                "t_extreme": 39.2,
                "recommendation": "Increase hydration & modify clothing",
            },
            meta={"model": "pythermalcomfort.models.sports_heat_stress_risk"},
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
    assert calculator.calls == 1
    assert first == second
    assert "risk_level_interpolated" in first.heat_risk
    assert first.meta_data["location"] == {"latitude": -33.847, "longitude": 151.067}
    assert "mapbox" not in first.meta_data


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
    assert calculator.calls == 2


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
