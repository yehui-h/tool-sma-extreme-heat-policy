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
- Use `pythermalcomfort.utilities.mean_radiant_tmp` for `tr`.
- Do not introduce assumptions before model call:
  - no clamping
  - no interpolation
  - no default fill
  - no business-side input remapping
- If required model inputs are missing/uncertain, return `422` with `unknown_inputs`.
- Return pythermalcomfort output in `response.data` with original field names.

## Architecture and Layer Rules
- `api/routes`: request/response wiring only.
- `schemas`: request/response validation.
- `services`: orchestration, cache, upstream sequencing.
- `clients`: Mapbox/Open-Meteo API calls.
- `calculators`: pythermalcomfort model invocation only.
- `core`: config and error types.

## API Contract Rules
- Preserve route: `POST /home/risk`.
- Request requires `locationMeta.mapboxId` and `locationMeta.sessionToken`.
- `sport` must be official pythermalcomfort `Sports` enum name (e.g. `SOCCER`).
- Response shape:
  - `data` -> raw pythermalcomfort output keys
  - `meta` -> context and source payload references

## Validation Checklist Before Handoff
- `UV_CACHE_DIR=/tmp/uv-cache uv run ruff check .`
- `UV_CACHE_DIR=/tmp/uv-cache uv run pytest`
- Verify `uvicorn` starts locally.

## Out of Scope / Do Not Change
- No frontend changes unless explicitly requested.
- No cloud/deployment changes in this phase.
- No custom risk scoring formula on top of pythermalcomfort output.
