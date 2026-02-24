# Sports Medicine Australia Extreme Heat Policy Tool — Frontend

React + TypeScript + Vite frontend for the SMA Extreme Heat Policy tool.

## Overview

This app provides:

- Location-based heat stress risk assessment (via backend `POST /home/risk`)
- Evidence-based recommendations for each risk level
- Sport selection with translated labels and per-sport images
- Forecast risk chart UI (currently backed by fixtures)

Based on:

- SMA Extreme Heat Risk and Response Guidelines: https://sma.org.au/resources/policies-and-guidelines/hot-weather/
- Tartarini, F. et al., 2025. A modified sports medicine Australia extreme heat policy and web tool. _Journal of Science and Medicine in Sport_. https://www.sciencedirect.com/science/article/pii/S1440244025000696

## Setup

1. Install deps: `pnpm install`
2. Create local env file: `cp .env.example .env.local`
3. Run dev server: `pnpm dev`

## Environment (`.env.local`)

Create `frontend/.env.local` by copying `frontend/.env.example`:

```bash
cp .env.example .env.local
```

Then fill in values (do not commit real tokens/keys):

```bash
VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_public_token
VITE_HOME_DATA_SOURCE=api
VITE_API_BASE_URL=http://localhost:8000
```

Notes:

- `VITE_MAPBOX_ACCESS_TOKEN` is required for Home location `suggest + retrieve`.
- `VITE_HOME_DATA_SOURCE` controls risk source mode: `api` (default) or `mock`.
- `VITE_API_BASE_URL` is required when `VITE_HOME_DATA_SOURCE=api`.
- `.env.local` is ignored by git via `*.local`.

## Project structure (Layer-first)

| Path             | Responsibility                              |
| ---------------- | ------------------------------------------- |
| `src/app`        | app shell + site layout                     |
| `src/pages`      | route-level pages (`HomePage`, `AboutPage`) |
| `src/components` | UI components (page-specific + shared)      |
| `src/api`        | IO layer (backend + Mapbox)                 |
| `src/domain`     | pure domain types + rules                   |
| `src/hooks`      | reusable hooks (no UI copy)                 |
| `src/lib`        | pure helpers (no UI copy)                   |
| `src/config`     | app-wide config (Mantine theme)             |
| `src/i18n`       | i18n init + bundled locale JSON             |
| `src/store`      | app-wide stores (Zustand)                   |
| `src/App.tsx`    | providers + routes                          |

Import rules:

- `src/api/**`, `src/config/**`, `src/domain/**`, `src/i18n/**`, `src/lib/**` must not import from `src/components/**` or `src/pages/**`.
- `src/components/**` must not import from `src/pages/**`.
- Pages can import from any layer.

## Home flow (Mapbox + risk)

- Client state lives in `src/store/homeStore.ts` (Zustand).
- Uses the official `zustand` npm package.
- Server state uses React Query (`@tanstack/react-query`).
- Location search uses Mapbox Search Box `suggest`; selecting a suggestion triggers Mapbox `retrieve` in frontend to resolve coordinates.
- Prefilled location labels restored from shared URL (`loc`) or local persistence automatically attempt `suggest + retrieve` once using exact normalized label matching.
- Risk API request sends `sport + latitude + longitude` (no Mapbox identifiers).
- Risk is fetched automatically when:
  - a location suggestion is selected (manual or auto-resolved) and coordinates are resolved, and
  - the sport changes.
- Risk API failures are shown in UI and keep the last valid result (no silent fallback in `api` mode).
- After a successful fetch:
  - URL query params update (`sport`, `loc`) and
  - the last selection is persisted to localStorage only for direct visits (not shared links).
- Dates are formatted in browser local timezone for UI display.
- API time contract: if datetime fields are introduced in request/response payloads, they must use ISO-8601 UTC format (`...Z`).
- No kids/adults segmentation is part of the current frontend scope.

## i18n

- All user-facing text lives in `src/i18n/locales/en/translation.json`.
- Components/pages use `useTranslation()` and `t(...)`.
- Do not embed visible copy directly in components/hooks/libs.

## Formatting

- `pnpm format` (writes)
- `pnpm format:check` (CI-safe)
- `pnpm lint` (ESLint)
- `pnpm lint:ci` (ESLint + Prettier check)
- `pnpm build`

## Frontend Conventions Compliance

- Prettier is mandatory: always run `pnpm format` before handoff and keep
  `pnpm lint:ci` green.
- Exported functions should include short JSDoc as required by
  `frontend/AGENTS.md`.
- Keep layouts Mantine-first (`Stack`, `Grid`, `Flex`, `Container`) and avoid
  page layout in custom CSS.
- Keep user-facing copy in i18n JSON files under `src/i18n/locales/*` and use
  translation keys in components/hooks/libs.
- Shared business state belongs in Zustand stores; avoid prop drilling for
  shared business state.
- Risk metadata is centralized in `src/domain/riskRegistry.ts` (thresholds,
  colors, icon paths, and recommendation i18n keys).
