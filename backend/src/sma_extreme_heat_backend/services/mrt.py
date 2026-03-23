from __future__ import annotations

import logging
from collections.abc import Mapping
from datetime import UTC
from functools import lru_cache
from typing import Any

import pandas as pd
from pvlib import location
from pythermalcomfort.models import solar_gain
from timezonefinder import TimezoneFinder

from sma_extreme_heat_backend.clients.open_meteo import HourlyWeatherPoint
from sma_extreme_heat_backend.core.errors import (
    RiskCalculationError,
    WeatherProviderError,
)

LOGGER = logging.getLogger(__name__)

CORRECTION_COEFFICIENT_SOL_RADIATION = 0.75
SHARP = 45
SOL_TRANSMITTANCE = 1
F_SVV = 0.8
F_BES = 1
ASW = 0.6
POSTURE = "standing"
FLOOR_REFLECTANCE = 0.25

MRT_CONSTANTS: dict[str, float | str] = {
    "sharp": SHARP,
    "sol_transmittance": SOL_TRANSMITTANCE,
    "f_svv": F_SVV,
    "f_bes": F_BES,
    "asw": ASW,
    "posture": POSTURE,
    "floor_reflectance": FLOOR_REFLECTANCE,
    "solar_radiation_correction_coefficient": (
        CORRECTION_COEFFICIENT_SOL_RADIATION
    ),
}

MRT_COLUMNS: tuple[str, ...] = (
    "tdb",
    "rh",
    "cloud",
    "wind",
    "radiation",
    "elevation",
    "dni",
    "delta_mrt",
    "tr",
)


@lru_cache(maxsize=1)
def _get_timezone_finder() -> TimezoneFinder:
    return TimezoneFinder(in_memory=True)


def resolve_timezone_name(*, latitude: float, longitude: float) -> str:
    timezone_name = _get_timezone_finder().timezone_at(lat=latitude, lng=longitude)
    if not isinstance(timezone_name, str) or timezone_name.strip() == "":
        raise WeatherProviderError("Could not resolve location timezone from coordinates")
    return timezone_name


def _extract_delta_mrt(result: Any) -> float:
    delta_mrt = getattr(result, "delta_mrt", None)
    if delta_mrt is None and isinstance(result, Mapping):
        delta_mrt = result.get("delta_mrt")

    if delta_mrt is None:
        raise RiskCalculationError("Solar gain result did not include delta_mrt")

    return float(delta_mrt)


def _points_to_dataframe(points: list[HourlyWeatherPoint]) -> pd.DataFrame:
    if not points:
        raise WeatherProviderError("Weather provider returned no hourly points")

    df = pd.DataFrame(
        {
            "time": [point.time_utc for point in points],
            "tdb": [point.tdb for point in points],
            "rh": [point.rh for point in points],
            "cloud": [point.cloud for point in points],
            "wind": [point.wind for point in points],
            "radiation": [point.radiation for point in points],
        }
    )
    df["time"] = pd.to_datetime(df["time"], utc=True)
    return df


def build_mrt_dataframe(
    *,
    points: list[HourlyWeatherPoint],
    latitude: float,
    longitude: float,
    timezone_name: str,
) -> pd.DataFrame:
    df_weather = _points_to_dataframe(points)
    df_weather = df_weather.set_index("time").sort_index()
    df_weather = df_weather.copy()
    df_weather.index = df_weather.index.tz_convert(timezone_name)

    now = pd.Timestamp.now(tz=timezone_name) - pd.Timedelta(hours=1)
    df_weather = df_weather[df_weather.index >= now]
    if df_weather.empty:
        raise WeatherProviderError("No hourly record after now-1h")

    df_weather = df_weather.dropna(subset=["tdb"])
    if df_weather.empty:
        raise WeatherProviderError("No hourly record with tdb after now-1h")

    df_weather = df_weather.resample("30min").interpolate()

    site = location.Location(
        latitude,
        longitude,
        tz=timezone_name,
        name=timezone_name,
    )
    solar_position = site.get_solarposition(df_weather.index)
    solar_position = solar_position[["elevation"]].copy()
    solar_position.loc[solar_position["elevation"] < 0, "elevation"] = 0
    clear_sky = site.get_clearsky(df_weather.index)

    df_result = pd.concat([df_weather.copy(), solar_position, clear_sky], axis=1)
    df_result["dni"] = df_result["radiation"] * CORRECTION_COEFFICIENT_SOL_RADIATION

    delta_mrt_values: list[float] = []
    negative_delta_mrt_values: list[float] = []
    for row in df_result.itertuples():
        if pd.isna(row.elevation) or pd.isna(row.dni):
            delta_mrt_values.append(float("nan"))
            continue

        delta_mrt = _extract_delta_mrt(
            solar_gain(
                sol_altitude=float(row.elevation),
                sharp=SHARP,
                sol_radiation_dir=float(row.dni),
                sol_transmittance=SOL_TRANSMITTANCE,
                f_svv=F_SVV,
                f_bes=F_BES,
                asw=ASW,
                posture=POSTURE,
                floor_reflectance=FLOOR_REFLECTANCE,
            )
        )
        if delta_mrt < 0:
            negative_delta_mrt_values.append(delta_mrt)
        delta_mrt_values.append(delta_mrt)

    if negative_delta_mrt_values:
        LOGGER.warning(
            "Calculated negative delta_mrt values during MRT pipeline",
            extra={
                "count": len(negative_delta_mrt_values),
                "min_delta_mrt": min(negative_delta_mrt_values),
                "timezone": timezone_name,
            },
        )

    df_result["delta_mrt"] = delta_mrt_values
    df_result["tr"] = df_result["tdb"] + df_result["delta_mrt"]

    return df_result.loc[:, list(MRT_COLUMNS)].copy()


def select_hourly_forecast_rows(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        return df.copy()

    utc_index = df.index.tz_convert(UTC)
    return df.loc[utc_index.minute == 0].copy()


def to_mrt_meta(point: pd.Series, *, timezone_name: str) -> dict[str, Any]:
    return {
        "timezone": timezone_name,
        "radiation": _to_json_scalar(point.get("radiation")),
        "elevation": _to_json_scalar(point.get("elevation")),
        "dni": _to_json_scalar(point.get("dni")),
        "delta_mrt": _to_json_scalar(point.get("delta_mrt")),
        "tr": _to_json_scalar(point.get("tr")),
        "constants": dict(MRT_CONSTANTS),
    }


def _to_json_scalar(value: Any) -> float | None:
    if value is None or pd.isna(value):
        return None
    return float(value)
