# SMA Extreme Heat Backend

FastAPI backend for SMA Extreme Heat Policy (local development).

## Requirements
- Python 3.12
- `uv`

## Setup
```bash
cd backend
UV_CACHE_DIR=/tmp/uv-cache uv sync
```

## Environment
Copy `backend/.env.example` to `backend/.env`.

## Run locally
```bash
cd backend
UV_CACHE_DIR=/tmp/uv-cache uv run uvicorn sma_extreme_heat_backend.main:app --reload --port 8000
```

## Lint and tests
```bash
cd backend
UV_CACHE_DIR=/tmp/uv-cache uv run ruff check .
UV_CACHE_DIR=/tmp/uv-cache uv run pytest
```

## API
### `POST /home/risk`
Request body:
- `sport: string` (must exactly match pythermalcomfort Sports enum name, e.g. `SOCCER`)
- `latitude: number` (range `[-90, 90]`)
- `longitude: number` (range `[-180, 180]`)

Strict flow:
1. Fetch Open-Meteo `hourly` weather with:
   - `temperature_2m`, `relative_humidity_2m`, `cloud_cover`, `wind_speed_10m`, `direct_normal_irradiance`
   - `timezone=GMT`, `wind_speed_unit=ms`
2. Validate Open-Meteo hourly units at runtime (strict):
   - `temperature_2m: °C`
   - `relative_humidity_2m: %`
   - `cloud_cover: %`
   - `wind_speed_10m: m/s`
   - `direct_normal_irradiance: W/m²`
3. Resolve the location IANA timezone from `latitude/longitude`.
4. Keep hourly records where `time >= now_utc - 1h` within a 7-day forecast window.
5. Convert retained records to the resolved local timezone, drop rows missing `tdb`, resample to `30min`, and interpolate numeric weather fields.
6. Build MRT inputs with `pvlib` + `pythermalcomfort`:
   - compute solar elevation for each local timestamp
   - clamp negative elevations to `0`
   - derive `dni = direct_normal_irradiance * 0.75`
   - compute `delta_mrt` with `pythermalcomfort.models.solar_gain`
   - derive `tr = tdb + delta_mrt`
7. For each valid current/forecast row:
   - scale interpolated `wind` to 1.1 m using `pythermalcomfort.utils.scale_wind_speed_log(v_z1=vr, z2=1.1, z1=10.0, z0=0.01, d=0.0, round_output=True)`
   - apply the sport default wind-speed floor with `max(scaled_vr, Sports.<sport>.vr)`
   - call `sports_heat_stress_risk` with `tdb`, `tr`, `rh`, effective `vr`, `sport`
8. Return `heat_risk` from the first valid row and `forecast` as UTC hourly points using `risk_level_interpolated`.

Response body:
- `heat_risk: object` (pythermalcomfort output keys and content, no business renaming)
- `meta_data: object` (debug context such as model/open-meteo/location including the resolved IANA timezone and MRT diagnostics; no mapbox data)
- `forecast: array` (`[{ time_utc, risk_level_interpolated }]`, UTC ISO-8601 timestamps)

Contract mode:
- Snake case is the only supported request/response style for `/home/risk`.
- Camel case payload keys (for example `locationMeta`) and legacy response keys (`data`, `meta`) are not part of the default contract.

Validation behavior:
- Missing/uncertain current MRT/model inputs return `422` with `unknown_inputs`.
- Future forecast rows with missing `tdb`, `rh`, `wind`, `radiation`, or `tr` are skipped instead of failing the entire request.
