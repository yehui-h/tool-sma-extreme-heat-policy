from typing import Annotated

from fastapi import APIRouter, Depends

from sma_extreme_heat_backend.schemas.home import HomeRiskRequest, HomeRiskResponse
from sma_extreme_heat_backend.services.risk_service import RiskService, get_risk_service

router = APIRouter(prefix="/home", tags=["home"])


@router.post("/risk", response_model=HomeRiskResponse)
async def calculate_home_risk(
    payload: HomeRiskRequest,
    risk_service: Annotated[RiskService, Depends(get_risk_service)],
) -> HomeRiskResponse:
    return await risk_service.calculate_home_risk(payload)
