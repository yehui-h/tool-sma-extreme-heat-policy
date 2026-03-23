# SMA Extreme Heat Backend

FastAPI backend for SMA Extreme Heat Policy (local development).

## Architecture at a glance
- `src/sma_extreme_heat_backend/api/routes` - HTTP route wiring only (`/home/risk`, health checks).
- `src/sma_extreme_heat_backend/schemas` - request/response validation contracts.
- `src/sma_extreme_heat_backend/services` - orchestration, cache, forecast shaping, and error paths.
- `src/sma_extreme_heat_backend/clients` - upstream provider IO (Open-Meteo).
- `src/sma_extreme_heat_backend/calculators` - pythermalcomfort model invocation only.
- `src/sma_extreme_heat_backend/core` - shared config and typed application errors.

Where to make changes:
- API shape or validation: `schemas/` and route tests in `tests/api/`.
- Weather provider behavior and parsing: `clients/open_meteo.py` and `tests/clients/`.
- Risk flow behavior/caching: `services/risk_service.py` and `tests/services/`.
- Model integration behavior: `calculators/sports_heat_stress.py` and `tests/calculators/`.

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

Example request:
```json
{
  "sport": "SOCCER",
  "latitude": -33.847,
  "longitude": 151.067
}
```

Strict flow:
1. Fetch Open-Meteo `hourly` weather with:
   - `temperature_2m`, `relative_humidity_2m`, `wind_speed_10m`
   - `timezone=auto`, `wind_speed_unit=ms`
2. Validate Open-Meteo hourly units at runtime (strict):
   - `temperature_2m: °C`
   - `relative_humidity_2m: %`
   - `wind_speed_10m: m/s`
3. Keep hourly records where `time >= now_utc - 1h` within a 7-day forecast window.
4. Use the first retained record as the current-risk input row.
5. Validate strict current-model inputs: `tdb`, `rh`, `vr`.
6. For each valid current/forecast row:
   - scale raw `wind_speed_10m` to 1.1 m using `pythermalcomfort.utils.scale_wind_speed_log(v_z1=vr, z2=1.1, z1=10.0, z0=0.01, d=0.0, round_output=True)`
   - apply the sport default wind-speed floor with `max(scaled_vr, Sports.<sport>.vr)`
   - set `tr = tdb`
   - call `sports_heat_stress_risk` with `tdb`, `tr`, `rh`, effective `vr`, `sport`
7. Return `heat_risk` from the first valid row and `forecast` as UTC hourly points using `risk_level_interpolated`.

Response body:
- `heat_risk: object` (pythermalcomfort output keys and content, no business renaming)
- `meta_data: object` (debug context such as model/open-meteo/location including the resolved IANA timezone; no mapbox data)
- `forecast: array` (`[{ time_utc, risk_level_interpolated }]`, UTC ISO-8601 timestamps)

Example response (shape):
```json
{
  "heat_risk": {
    "risk_level_interpolated": 1.94,
    "t_medium": 34.5,
    "t_high": 37.1,
    "t_extreme": 39.2,
    "recommendation": "Increase hydration & modify clothing"
  },
  "meta_data": {
    "model": "pythermalcomfort.models.sports_heat_stress_risk",
    "inputs": {
      "sport": "SOCCER",
      "tdb": 31.0,
      "rh": 62.0,
      "vr": 1.02,
      "tr": 31.0
    },
    "location": {
      "latitude": -33.847,
      "longitude": 151.067,
      "timezone": "Australia/Sydney"
    },
    "open_meteo": {
      "...": "provider payload"
    }
  },
  "forecast": [
    {
      "time_utc": "2026-03-09T00:00:00Z",
      "risk_level_interpolated": 1.94
    },
    {
      "time_utc": "2026-03-09T01:00:00Z",
      "risk_level_interpolated": 2.04
    }
  ]
}
```

Contract mode:
- Snake case is the only supported request/response style for `/home/risk`.
- Camel case payload keys (for example `locationMeta`) and legacy response keys (`data`, `meta`) are not part of the default contract.

Validation behavior:
- Missing/uncertain current model inputs return `422` with `unknown_inputs`.
- Future forecast rows with missing `tdb`, `rh`, or `vr` are skipped instead of failing the entire request.

## Debugging playbook
- `422` for invalid request body:
  - Check `sport` is uppercase pythermalcomfort enum style (for example `SOCCER`, not `soccer`).
  - Check coordinate ranges: latitude `[-90, 90]`, longitude `[-180, 180]`.
- `422` with `unknown_inputs`:
  - Means required current model inputs (`tdb`, `rh`, `vr`) were missing or uncertain from provider data.
  - Inspect `detail.available_inputs` and `meta_data.open_meteo` in logs/response context.
- `502` weather provider error:
  - Check Open-Meteo availability and response shape/units.
  - Verify unit contracts are unchanged (`°C`, `%`, `m/s`).
  - Confirm timezone metadata is present and valid IANA zone.
- Unexpected forecast gaps:
  - Forecast rows with missing `tdb`, `rh`, or `vr` are intentionally skipped.
  - Confirm upstream hourly arrays have aligned lengths and valid numeric values.
- Local verification commands:
  - `UV_CACHE_DIR=/tmp/uv-cache uv run ruff check .`
  - `UV_CACHE_DIR=/tmp/uv-cache uv run pytest`
  - `UV_CACHE_DIR=/tmp/uv-cache uv run uvicorn sma_extreme_heat_backend.main:app --reload --port 8000`

## Source of truth
- This README summarizes intended behavior and architecture.
- Implementation source of truth is code plus tests in `src/sma_extreme_heat_backend/` and `tests/`.
- If this README and implementation ever diverge, update the README in the same change.
