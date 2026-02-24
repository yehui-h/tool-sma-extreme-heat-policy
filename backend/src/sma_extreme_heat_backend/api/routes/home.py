from typing import Annotated

from fastapi import APIRouter, Depends

from sma_extreme_heat_backend.schemas.home import RiskRequest, RiskResponse
from sma_extreme_heat_backend.services.risk_service import RiskService, get_risk_service

router = APIRouter(prefix="/home", tags=["home"])


@router.post("/risk", response_model=RiskResponse)
async def calculate_home_risk(
    payload: RiskRequest,
    risk_service: Annotated[RiskService, Depends(get_risk_service)],
) -> RiskResponse:
    return await risk_service.calculate_home_risk(payload)
