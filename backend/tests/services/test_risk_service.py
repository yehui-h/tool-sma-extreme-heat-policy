from __future__ import annotations

from sma_extreme_heat_backend.calculators.base import SportsHeatStressInput, SportsHeatStressOutput
from sma_extreme_heat_backend.clients.mapbox import RetrievedCoordinates
from sma_extreme_heat_backend.clients.open_meteo import CurrentWeather
from sma_extreme_heat_backend.core.errors import ModelInputUnavailableError
from sma_extreme_heat_backend.schemas.home import HomeRiskRequest
from sma_extreme_heat_backend.services.risk_service import RiskService


class FakeMapboxClient:
    def __init__(self) -> None:
        self.calls = 0

    async def retrieve_coordinates(
        self,
        *,
        mapbox_id: str,
        session_token: str,
    ) -> RetrievedCoordinates:
        self.calls += 1
        assert mapbox_id == "mbx.test-id"
        assert session_token == "session-123"
        return RetrievedCoordinates(
            latitude=-33.847,
            longitude=151.067,
            raw={"provider": "mapbox"},
        )

    async def aclose(self) -> None:
        return None


class FakeWeatherClient:
    def __init__(self, tg: float | None = 32.0, tr: float | None = 36.5) -> None:
        self.calls = 0
        self.tg = tg
        self.tr = tr

    async def fetch_current_weather(self, *, latitude: float, longitude: float) -> CurrentWeather:
        self.calls += 1
        assert latitude == -33.847
        assert longitude == 151.067
        return CurrentWeather(
            tdb=31.0,
            rh=62.0,
            vr=1.5,
            tg=self.tg,
            tr=self.tr,
            legacy_meta={"source": "legacy"},
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
        assert payload.tr == 36.5
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
    mapbox_client = FakeMapboxClient()
    weather_client = FakeWeatherClient(tg=32.0)
    calculator = FakeCalculator()

    service = RiskService(
        mapbox_client=mapbox_client,
        weather_client=weather_client,
        calculator=calculator,
        ttl_seconds=600,
    )

    payload = HomeRiskRequest(
        sport="SOCCER",
        locationMeta={
            "source": "mapbox",
            "mapboxId": "mbx.test-id",
            "sessionToken": "session-123",
        },
    )

    first = await service.calculate_home_risk(payload)
    second = await service.calculate_home_risk(payload)

    assert mapbox_client.calls == 1
    assert weather_client.calls == 1
    assert calculator.calls == 1
    assert first == second
    assert "risk_level_interpolated" in first.data


async def test_risk_service_missing_tg_raises_unknown_inputs() -> None:
    service = RiskService(
        mapbox_client=FakeMapboxClient(),
        weather_client=FakeWeatherClient(tg=None),
        calculator=FakeCalculator(),
        ttl_seconds=600,
    )

    payload = HomeRiskRequest(
        sport="SOCCER",
        locationMeta={
            "source": "mapbox",
            "mapboxId": "mbx.test-id",
            "sessionToken": "session-123",
        },
    )

    try:
        await service.calculate_home_risk(payload)
    except ModelInputUnavailableError as exc:
        assert exc.status_code == 422
        assert exc.detail["unknown_inputs"] == ["tg"]
    else:
        raise AssertionError("Expected ModelInputUnavailableError")


async def test_risk_service_missing_tr_raises_unknown_inputs() -> None:
    service = RiskService(
        mapbox_client=FakeMapboxClient(),
        weather_client=FakeWeatherClient(tg=2.0, tr=None),
        calculator=FakeCalculator(),
        ttl_seconds=600,
    )

    payload = HomeRiskRequest(
        sport="SOCCER",
        locationMeta={
            "source": "mapbox",
            "mapboxId": "mbx.test-id",
            "sessionToken": "session-123",
        },
    )

    try:
        await service.calculate_home_risk(payload)
    except ModelInputUnavailableError as exc:
        assert exc.status_code == 422
        assert exc.detail["unknown_inputs"] == ["tr"]
    else:
        raise AssertionError("Expected ModelInputUnavailableError")
