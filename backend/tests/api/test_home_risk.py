from __future__ import annotations

from fastapi.testclient import TestClient

from sma_extreme_heat_backend.api.routes.home import get_risk_service
from sma_extreme_heat_backend.core.errors import ModelInputUnavailableError, WeatherProviderError
from sma_extreme_heat_backend.main import create_app
from sma_extreme_heat_backend.schemas.home import RiskRequest, RiskResponse


class SuccessfulRiskService:
    async def calculate_home_risk(self, payload: RiskRequest) -> RiskResponse:
        assert payload.sport == "SOCCER"
        assert payload.latitude == -33.847
        assert payload.longitude == 151.067
        return RiskResponse(
            heat_risk={
                "risk_level_interpolated": 1.2,
                "t_medium": 34.5,
                "t_high": 37.1,
                "t_extreme": 39.2,
                "recommendation": "Increase hydration & modify clothing",
            },
            meta_data={
                "source": "test",
                "location": {
                    "latitude": -33.847,
                    "longitude": 151.067,
                    "timezone": "Australia/Sydney",
                },
            },
            forecast=[
                {
                    "time_utc": "2026-03-09T00:00:00Z",
                    "risk_level_interpolated": 1.2,
                },
                {
                    "time_utc": "2026-03-09T01:00:00Z",
                    "risk_level_interpolated": 1.4,
                },
            ],
        )


class FailingRiskService:
    async def calculate_home_risk(self, payload: RiskRequest) -> RiskResponse:
        raise WeatherProviderError()


class MissingInputRiskService:
    async def calculate_home_risk(self, payload: RiskRequest) -> RiskResponse:
        raise ModelInputUnavailableError(
            unknown_inputs=["vr"],
            available_inputs={"tdb": 30.0, "rh": 60.0, "vr": None},
        )


def test_post_home_risk_success_returns_pythermalcomfort_data() -> None:
    app = create_app()
    app.dependency_overrides[get_risk_service] = lambda: SuccessfulRiskService()

    payload = {
        "sport": "SOCCER",
        "latitude": -33.847,
        "longitude": 151.067,
    }

    with TestClient(app) as client:
        response = client.post("/home/risk", json=payload)

    assert response.status_code == 200
    assert response.json()["heat_risk"]["risk_level_interpolated"] == 1.2
    assert "recommendation" in response.json()["heat_risk"]
    assert response.json()["meta_data"]["location"]["timezone"] == "Australia/Sydney"
    assert response.json()["forecast"] == [
        {
            "time_utc": "2026-03-09T00:00:00Z",
            "risk_level_interpolated": 1.2,
        },
        {
            "time_utc": "2026-03-09T01:00:00Z",
            "risk_level_interpolated": 1.4,
        },
    ]


def test_post_home_risk_missing_latitude_returns_422() -> None:
    app = create_app()

    payload = {
        "sport": "SOCCER",
        "longitude": 151.067,
    }

    with TestClient(app) as client:
        response = client.post("/home/risk", json=payload)

    assert response.status_code == 422


def test_post_home_risk_invalid_longitude_returns_422() -> None:
    app = create_app()

    payload = {
        "sport": "SOCCER",
        "latitude": -33.847,
        "longitude": 181.0,
    }

    with TestClient(app) as client:
        response = client.post("/home/risk", json=payload)

    assert response.status_code == 422


def test_post_home_risk_invalid_sport_contract_returns_422() -> None:
    app = create_app()

    payload = {
        "sport": "soccer",
        "latitude": -33.847,
        "longitude": 151.067,
    }

    with TestClient(app) as client:
        response = client.post("/home/risk", json=payload)

    assert response.status_code == 422


def test_post_home_risk_weather_upstream_error_returns_502() -> None:
    app = create_app()
    app.dependency_overrides[get_risk_service] = lambda: FailingRiskService()

    payload = {
        "sport": "SOCCER",
        "latitude": -33.847,
        "longitude": 151.067,
    }

    with TestClient(app) as client:
        response = client.post("/home/risk", json=payload)

    assert response.status_code == 502
    assert response.json() == {"detail": "Weather provider unavailable"}


def test_post_home_risk_missing_vr_returns_422_unknown_inputs() -> None:
    app = create_app()
    app.dependency_overrides[get_risk_service] = lambda: MissingInputRiskService()

    payload = {
        "sport": "SOCCER",
        "latitude": -33.847,
        "longitude": 151.067,
    }

    with TestClient(app) as client:
        response = client.post("/home/risk", json=payload)

    assert response.status_code == 422
    assert response.json()["detail"]["unknown_inputs"] == ["vr"]
