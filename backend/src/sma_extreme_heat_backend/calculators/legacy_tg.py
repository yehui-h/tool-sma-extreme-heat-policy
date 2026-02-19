from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import pandas as pd
import scipy
from pvlib import location
from pythermalcomfort.models import solar_gain
from pythermalcomfort.utilities import mean_radiant_tmp

MRT_CALCULATION = {
    "wind_coefficient": 0.3,
    "sharp": 0,
    "sol_transmittance": 1,
    "f_svv": 1,
    "f_bes": 1,
    "asw": 0.7,
    "posture": "standing",
    "floor_reflectance": 0.1,
}


@dataclass(frozen=True)
class LegacyTgResult:
    tg: float
    tr: float
    vr_adjusted: float
    delta_mrt: float
    meta: dict[str, Any]


def calculate_tg_tr_legacy(
    *,
    tdb: float,
    wind_speed: float,
    cloud_cover: float,
    latitude: float,
    longitude: float,
    timestamp: pd.Timestamp,
    tz: str,
) -> LegacyTgResult:
    df_for = pd.DataFrame(
        data={
            "tdb": [tdb],
            "wind": [wind_speed],
            "cloud": [cloud_cover],
            "lat": [latitude],
            "lon": [longitude],
            "tz": [tz],
        },
        index=pd.DatetimeIndex([timestamp]),
    )

    site_location = location.Location(latitude, longitude, tz=tz, name=tz)
    solar_position = site_location.get_solarposition(df_for.index)
    cs = site_location.get_clearsky(df_for.index)

    solar_position.loc[solar_position["elevation"] < 0, "elevation"] = 0

    df_for = pd.concat([df_for, solar_position], axis=1)
    df_for = pd.concat([df_for, cs], axis=1)

    df_for["cloud"] /= 10
    df_for["dni"] *= -0.00375838 * df_for["cloud"] ** 2 + -0.06230424 * df_for["cloud"] + 1.02290071

    row = df_for.iloc[0]
    erf_mrt = solar_gain(
        row["elevation"],
        MRT_CALCULATION["sharp"],
        row["dni"],
        MRT_CALCULATION["sol_transmittance"],
        MRT_CALCULATION["f_svv"],
        MRT_CALCULATION["f_bes"],
        MRT_CALCULATION["asw"],
        MRT_CALCULATION["posture"],
        MRT_CALCULATION["floor_reflectance"],
    )

    def calculate_globe_temperature(x: float) -> float:
        return mean_radiant_tmp(
            tg=x + row["tdb"],
            tdb=row["tdb"],
            v=row["wind"],
            standard="iso",
        ) - (row["tdb"] + erf_mrt.delta_mrt)

    try:
        tg = scipy.optimize.brentq(calculate_globe_temperature, 0, 200)
    except ValueError:
        tg = 0

    vr_adjusted = row["wind"] * MRT_CALCULATION["wind_coefficient"]
    tr = row["tdb"] + erf_mrt.delta_mrt

    return LegacyTgResult(
        tg=float(tg),
        tr=float(tr),
        vr_adjusted=float(vr_adjusted),
        delta_mrt=float(erf_mrt.delta_mrt),
        meta={
            "tz": tz,
            "timestamp": timestamp.isoformat(),
            "elevation": float(row["elevation"]),
            "dni": float(row["dni"]),
            "delta_mrt": float(erf_mrt.delta_mrt),
            "vr_raw": float(row["wind"]),
            "vr_adjusted": float(vr_adjusted),
        },
    )
