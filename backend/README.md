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
   - `temperature_2m`, `relative_humidity_2m`, `wind_speed_10m`
   - `timezone=GMT`, `wind_speed_unit=ms`
2. Validate Open-Meteo hourly units at runtime (strict):
   - `temperature_2m: °C`
   - `relative_humidity_2m: %`
   - `wind_speed_10m: m/s`
3. Select the first record where `time >= now_utc - 1h`.
4. Validate strict model inputs: `tdb`, `rh`, `vr`.
5. Scale raw `wind_speed_10m` to 1.1 m using `pythermalcomfort.utils.scale_wind_speed_log(v_z1=vr, z2=1.1, z1=10.0, z0=0.01, d=0.0, round_output=True)`.
6. Apply the sport default wind-speed floor with `max(scaled_vr, Sports.<sport>.vr)`.
7. Set `tr = tdb` and call `sports_heat_stress_risk` with `tdb`, `tr`, `rh`, effective `vr`, `sport`.

Response body:
- `heat_risk: object` (pythermalcomfort output keys and content, no business renaming)
- `meta_data: object` (debug context such as model/open-meteo/location; no mapbox data)

Contract mode:
- Snake case is the only supported request/response style for `/home/risk`.
- Camel case payload keys (for example `locationMeta`) and legacy response keys (`data`, `meta`) are not part of the default contract.

Validation behavior:
- Missing/uncertain model inputs return `422` with `unknown_inputs`.
