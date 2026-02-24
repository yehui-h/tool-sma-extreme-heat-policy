from __future__ import annotations

from typing import Any


class AppError(Exception):
    def __init__(self, status_code: int, detail: Any) -> None:
        super().__init__(str(detail))
        self.status_code = status_code
        self.detail = detail


class UpstreamServiceError(AppError):
    def __init__(self, detail: str) -> None:
        super().__init__(status_code=502, detail=detail)


class WeatherProviderError(UpstreamServiceError):
    def __init__(self, detail: str = "Weather provider unavailable") -> None:
        super().__init__(detail=detail)


class RiskCalculationError(AppError):
    def __init__(self, detail: str = "Risk calculation failed") -> None:
        super().__init__(status_code=500, detail=detail)


class InvalidSportError(AppError):
    def __init__(self, sport: str, allowed_sports: list[str]) -> None:
        super().__init__(
            status_code=422,
            detail={
                "message": "sport must match a pythermalcomfort Sports enum name",
                "sport": sport,
                "allowed_sports": allowed_sports,
            },
        )


class ModelInputUnavailableError(AppError):
    def __init__(self, unknown_inputs: list[str], available_inputs: dict[str, Any]) -> None:
        super().__init__(
            status_code=422,
            detail={
                "message": "Required model inputs are missing or uncertain",
                "unknown_inputs": unknown_inputs,
                "available_inputs": available_inputs,
            },
        )
