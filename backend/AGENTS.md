# AI Working Guide for SMA Backend

## Purpose and Scope
- This guide applies only to `backend/`.
- Goal: preserve strict pythermalcomfort integration rules.

## Project Snapshot
- Stack: FastAPI, Pydantic v2, httpx, pythermalcomfort, uvicorn.
- Package/environment tool: `uv`.
- Python version: 3.12.

## Core Rules (Strict Mode)
- Use `pythermalcomfort.models.sports_heat_stress_risk.sports_heat_stress_risk` directly.
- Model inputs are `tdb`, `tr`, `rh`, `vr`, `sport`.
- Set `tr = tdb` in backend service orchestration.
- Globe temperature (`tg`) is out of scope and must not be introduced.
- Do not introduce assumptions before model call:
  - no clamping
  - no interpolation
  - no default fill
  - no business-side input remapping
- If required weather inputs are missing/uncertain (`tdb`, `rh`, `vr`), return `422` with `unknown_inputs`.
- Return pythermalcomfort output in `response.heat_risk` with original field names.

## Architecture and Layer Rules
- `api/routes`: request/response wiring only.
- `schemas`: request/response validation.
- `services`: orchestration, cache, upstream sequencing.
- `clients`: Open-Meteo API calls.
- `calculators`: pythermalcomfort model invocation only.
- `core`: config and error types.

## API Contract Rules
- Preserve route: `POST /home/risk`.
- Request requires `latitude` and `longitude`.
- `sport` must be official pythermalcomfort `Sports` enum name (e.g. `SOCCER`).
- Response shape:
  - `heat_risk` -> raw pythermalcomfort output keys
  - `meta_data` -> context and source payload references (no mapbox payload)
- API contract style is snake_case only; do not default to camelCase request keys or legacy `data/meta` response keys.

## Validation Checklist Before Handoff
- `UV_CACHE_DIR=/tmp/uv-cache uv run ruff check .`
- `UV_CACHE_DIR=/tmp/uv-cache uv run pytest`
- Verify `uvicorn` starts locally.

## Out of Scope / Do Not Change
- No frontend changes unless explicitly requested.
- No cloud/deployment changes in this phase.
- No custom risk scoring formula on top of pythermalcomfort output.
