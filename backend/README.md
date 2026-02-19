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
Copy `backend/.env.example` to `backend/.env` and set:
- `MAPBOX_ACCESS_TOKEN`: backend token for Mapbox retrieve.

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
- `locationMeta.source: "mapbox"`
- `locationMeta.mapboxId: string`
- `locationMeta.sessionToken: string`

Strict flow:
1. Retrieve coordinates from Mapbox using `mapbox_id + session_token`.
2. Fetch Open-Meteo `hourly` weather using legacy-aligned fields:
   - `temperature_2m`, `relative_humidity_2m`, `cloud_cover`, `wind_speed_10m`, `direct_radiation`
   - `timezone=GMT`, `wind_speed_unit=ms`
3. Validate Open-Meteo hourly units at runtime (strict):
   - `temperature_2m: °C`
   - `relative_humidity_2m: %`
   - `wind_speed_10m: m/s`
   - `cloud_cover: %`
   - `direct_radiation: W/m²` (or `W/m2`)
4. Convert hourly series to local timezone and select the first record where `time >= now_local - 1h` (legacy rule).
5. Derive `tg` and `tr` locally with the legacy algorithm from `legacy/my_app/utils.py` (Open-Meteo does not provide `tg/tr`).
6. Validate strict model inputs: `tdb`, `rh`, `vr`, `tg`, `tr`.
7. Call `sports_heat_stress_risk`.

Response body:
- `data: object` (pythermalcomfort output keys and content, no business renaming)
- `meta: object` (model/input/source context)

Validation behavior:
- Missing/uncertain model inputs return `422` with `unknown_inputs`.
