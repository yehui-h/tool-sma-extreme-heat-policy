from __future__ import annotations

from fastapi.testclient import TestClient

from sma_extreme_heat_backend.api.routes.home import get_risk_service
from sma_extreme_heat_backend.core.errors import MapboxProviderError, ModelInputUnavailableError
from sma_extreme_heat_backend.main import create_app
from sma_extreme_heat_backend.schemas.home import HomeRiskRequest, HomeRiskResponse


class SuccessfulRiskService:
    async def calculate_home_risk(self, payload: HomeRiskRequest) -> HomeRiskResponse:
        assert payload.sport == "SOCCER"
        assert payload.locationMeta.mapboxId == "mbx.test-id"
        assert payload.locationMeta.sessionToken == "session-123"
        return HomeRiskResponse(
            data={
                "risk_level_interpolated": 1.2,
                "t_medium": 34.5,
                "t_high": 37.1,
                "t_extreme": 39.2,
                "recommendation": "Increase hydration & modify clothing",
            },
            meta={"source": "test"},
        )


class FailingRiskService:
    async def calculate_home_risk(self, payload: HomeRiskRequest) -> HomeRiskResponse:
        raise MapboxProviderError()


class MissingInputRiskService:
    async def calculate_home_risk(self, payload: HomeRiskRequest) -> HomeRiskResponse:
        raise ModelInputUnavailableError(
            unknown_inputs=["tg"],
            available_inputs={"tdb": 30.0, "rh": 60.0, "vr": 1.2, "tg": None},
        )


def test_post_home_risk_success_returns_pythermalcomfort_data() -> None:
    app = create_app()
    app.dependency_overrides[get_risk_service] = lambda: SuccessfulRiskService()

    payload = {
        "sport": "SOCCER",
        "locationMeta": {
            "source": "mapbox",
            "mapboxId": "mbx.test-id",
            "sessionToken": "session-123",
        },
    }

    with TestClient(app) as client:
        response = client.post("/home/risk", json=payload)

    assert response.status_code == 200
    assert response.json()["data"]["risk_level_interpolated"] == 1.2
    assert "recommendation" in response.json()["data"]


def test_post_home_risk_missing_mapbox_id_returns_422() -> None:
    app = create_app()

    payload = {
        "sport": "SOCCER",
        "locationMeta": {
            "source": "mapbox",
            "sessionToken": "session-123",
        },
    }

    with TestClient(app) as client:
        response = client.post("/home/risk", json=payload)

    assert response.status_code == 422


def test_post_home_risk_invalid_sport_contract_returns_422() -> None:
    app = create_app()

    payload = {
        "sport": "soccer",
        "locationMeta": {
            "source": "mapbox",
            "mapboxId": "mbx.test-id",
            "sessionToken": "session-123",
        },
    }

    with TestClient(app) as client:
        response = client.post("/home/risk", json=payload)

    assert response.status_code == 422


def test_post_home_risk_mapbox_upstream_error_returns_502() -> None:
    app = create_app()
    app.dependency_overrides[get_risk_service] = lambda: FailingRiskService()

    payload = {
        "sport": "SOCCER",
        "locationMeta": {
            "source": "mapbox",
            "mapboxId": "mbx.test-id",
            "sessionToken": "session-123",
        },
    }

    with TestClient(app) as client:
        response = client.post("/home/risk", json=payload)

    assert response.status_code == 502
    assert response.json() == {"detail": "Mapbox provider unavailable"}


def test_post_home_risk_missing_tg_returns_422_unknown_inputs() -> None:
    app = create_app()
    app.dependency_overrides[get_risk_service] = lambda: MissingInputRiskService()

    payload = {
        "sport": "SOCCER",
        "locationMeta": {
            "source": "mapbox",
            "mapboxId": "mbx.test-id",
            "sessionToken": "session-123",
        },
    }

    with TestClient(app) as client:
        response = client.post("/home/risk", json=payload)

    assert response.status_code == 422
    assert response.json()["detail"]["unknown_inputs"] == ["tg"]
