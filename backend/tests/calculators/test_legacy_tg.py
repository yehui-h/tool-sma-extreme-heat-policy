from __future__ import annotations

import math

import pandas as pd

from sma_extreme_heat_backend.calculators import legacy_tg


class _FakeSolarGain:
    def __init__(self, *, delta_mrt: float) -> None:
        self.delta_mrt = delta_mrt


def test_calculate_tg_tr_legacy_matches_legacy_steps(monkeypatch) -> None:
    captured: dict[str, object] = {}

    class FakeLocation:
        def __init__(self, latitude: float, longitude: float, tz: str, name: str) -> None:
            assert latitude == -33.847
            assert longitude == 151.067
            assert tz == "Australia/Sydney"
            assert name == "Australia/Sydney"

        def get_solarposition(self, index: pd.DatetimeIndex) -> pd.DataFrame:
            captured["solar_index"] = index
            return pd.DataFrame({"elevation": [-5.0]}, index=index)

        def get_clearsky(self, index: pd.DatetimeIndex) -> pd.DataFrame:
            return pd.DataFrame({"dni": [800.0]}, index=index)

    def fake_solar_gain(
        sol_altitude: float,
        sharp: float,
        sol_radiation_dir: float,
        sol_transmittance: float,
        f_svv: float,
        f_bes: float,
        asw: float,
        posture: str,
        floor_reflectance: float,
    ) -> _FakeSolarGain:
        captured["solar_gain_args"] = (
            sol_altitude,
            sharp,
            sol_radiation_dir,
            sol_transmittance,
            f_svv,
            f_bes,
            asw,
            posture,
            floor_reflectance,
        )
        return _FakeSolarGain(delta_mrt=7.0)

    def fake_mean_radiant_tmp(*, tg: float, tdb: float, v: float, standard: str) -> float:
        captured["mean_radiant_tmp_args"] = (tg, tdb, v, standard)
        return tdb + 7.0

    def fake_brentq(function, lower: float, upper: float) -> float:
        captured["brentq_bounds"] = (lower, upper)
        captured["brentq_residual"] = float(function(4.0))
        return 4.0

    monkeypatch.setattr(legacy_tg.location, "Location", FakeLocation)
    monkeypatch.setattr(legacy_tg, "solar_gain", fake_solar_gain)
    monkeypatch.setattr(legacy_tg, "mean_radiant_tmp", fake_mean_radiant_tmp)
    monkeypatch.setattr(legacy_tg.scipy.optimize, "brentq", fake_brentq)

    timestamp = pd.Timestamp("2026-02-18T10:00:00", tz="Australia/Sydney")
    result = legacy_tg.calculate_tg_tr_legacy(
        tdb=30.0,
        wind_speed=2.0,
        cloud_cover=40.0,
        latitude=-33.847,
        longitude=151.067,
        timestamp=timestamp,
        tz="Australia/Sydney",
    )

    expected_cloud = 4.0
    expected_dni = 800.0 * (
        -0.00375838 * expected_cloud**2 + -0.06230424 * expected_cloud + 1.02290071
    )
    solar_gain_args = captured["solar_gain_args"]
    assert isinstance(solar_gain_args, tuple)
    assert solar_gain_args[0] == 0.0
    assert math.isclose(solar_gain_args[2], expected_dni, rel_tol=1e-9)
    assert solar_gain_args[1] == legacy_tg.MRT_CALCULATION["sharp"]
    assert solar_gain_args[3] == legacy_tg.MRT_CALCULATION["sol_transmittance"]
    assert solar_gain_args[4] == legacy_tg.MRT_CALCULATION["f_svv"]
    assert solar_gain_args[5] == legacy_tg.MRT_CALCULATION["f_bes"]
    assert solar_gain_args[6] == legacy_tg.MRT_CALCULATION["asw"]
    assert solar_gain_args[7] == legacy_tg.MRT_CALCULATION["posture"]
    assert solar_gain_args[8] == legacy_tg.MRT_CALCULATION["floor_reflectance"]
    assert captured["brentq_bounds"] == (0, 200)
    assert captured["mean_radiant_tmp_args"] == (34.0, 30.0, 2.0, "iso")
    assert captured["brentq_residual"] == 0.0

    assert result.tg == 4.0
    assert result.tr == 37.0
    assert result.vr_adjusted == 0.6
    assert result.delta_mrt == 7.0


def test_calculate_tg_tr_legacy_brentq_failure_sets_tg_to_zero(monkeypatch) -> None:
    class FakeLocation:
        def __init__(self, latitude: float, longitude: float, tz: str, name: str) -> None:
            assert latitude == 10.0
            assert longitude == 20.0
            assert tz == "Etc/GMT"
            assert name == "Etc/GMT"

        def get_solarposition(self, index: pd.DatetimeIndex) -> pd.DataFrame:
            return pd.DataFrame({"elevation": [10.0]}, index=index)

        def get_clearsky(self, index: pd.DatetimeIndex) -> pd.DataFrame:
            return pd.DataFrame({"dni": [600.0]}, index=index)

    monkeypatch.setattr(legacy_tg.location, "Location", FakeLocation)
    monkeypatch.setattr(
        legacy_tg,
        "solar_gain",
        lambda *args, **kwargs: _FakeSolarGain(delta_mrt=5.0),
    )
    monkeypatch.setattr(
        legacy_tg,
        "mean_radiant_tmp",
        lambda **kwargs: kwargs["tdb"] + 5.0,
    )
    monkeypatch.setattr(
        legacy_tg.scipy.optimize,
        "brentq",
        lambda *args, **kwargs: (_ for _ in ()).throw(ValueError("no root bracketed")),
    )

    timestamp = pd.Timestamp("2026-02-18T00:00:00", tz="Etc/GMT")
    result = legacy_tg.calculate_tg_tr_legacy(
        tdb=28.0,
        wind_speed=1.0,
        cloud_cover=20.0,
        latitude=10.0,
        longitude=20.0,
        timestamp=timestamp,
        tz="Etc/GMT",
    )

    assert result.tg == 0.0
    assert result.tr == 33.0
    assert result.vr_adjusted == 0.3
    assert result.delta_mrt == 5.0
