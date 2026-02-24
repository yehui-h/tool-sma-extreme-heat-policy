# AI Working Guide for SMA Frontend

## Purpose and scope

- This guide applies only to `frontend/`.
- Primary target is Codex; wording is intentionally reusable for Copilot.
- Goal: reduce inconsistent edits, preserve architecture, and improve delivery quality.

## Non-negotiable Code Generation Rules (Must Follow)

The following rules are mandatory for every generated code change in `frontend/`:

1. README `env.local` contract:
   If environment variables are added or changed, update `frontend/README.md` with:
   - clear `cp .env.example .env.local` creation steps,
   - `.env.local` structure examples with placeholders only (never real keys/tokens), and
   - a clear description of purpose and required/optional status for each variable.
2. Prettier is mandatory:
   - all code changes must be formatted with Prettier,
   - run `pnpm format` before handoff,
   - keep `pnpm format:check` / `pnpm lint:ci` in the validation path.
3. Mantine-first layout:
   - build page layout and standard styling with Mantine documentation patterns (`AppShell`, `Container`, `Grid`, `Stack`, `Flex`, `SimpleGrid`, theme/style props),
   - do not implement page layout in CSS/CSS Modules,
   - CSS is allowed only for small exceptions such as global baseline styles or third-party override hooks.
4. Function documentation:
   - every exported function must include a short TSDoc/JSDoc block (1-2 lines) describing purpose and key input/output behavior,
   - very small internal helper functions may be documented only when the behavior is not obvious.
5. Keep code DRY:
   avoid duplicated business logic; extract repeated logic into reusable functions, hooks, or shared components.
6. Keep functions atomic:
   each function must have one clear responsibility and a precise, intention-revealing name.
7. No embedded user-facing text:
   - never hard-code visible copy in components/hooks/libs,
   - use i18n keys and store translations in `src/i18n/locales/*/translation.json` (keep current `src/i18n` path; do not move translations to `public`).
8. Zustand store-first state:
   - shared business state must live in centralized Zustand stores,
   - components should read shared business state from store selectors,
   - avoid multi-layer prop drilling for shared business state; keep props minimal for presentation-only values and callbacks.
9. Risk registry centralization:
   - keep all risk-level metadata in `src/domain/riskRegistry.ts`,
   - define thresholds, colors, icons, and recommendation i18n keys in the registry,
   - avoid duplicate risk constants or parallel risk definitions in separate files.

## Project snapshot

- Stack: React 19, TypeScript, Vite, Mantine, React Router v7, nuqs, Zustand, TanStack React Query, i18next.
- Alias: `@/* -> src/*`.
- Package manager: `pnpm`.
- Core scripts:
  - `pnpm dev`
  - `pnpm lint`
  - `pnpm build`
  - `pnpm preview`

## Architecture (Layer-first)

Keep the current layer-first structure:

- `src/app` — app shell + site layout
- `src/pages` — route-level pages (`HomePage`, `AboutPage`)
- `src/components` — UI components (page-specific + shared)
- `src/api` — IO layer (backend + Mapbox)
- `src/domain` — pure domain types + rules
- `src/hooks` — reusable hooks (no UI copy)
- `src/lib` — pure helpers (no UI copy)
- `src/config` — app-wide config (Mantine theme)
- `src/i18n` — i18n init + bundled locale JSON
- `src/store` — app-wide stores (Zustand)
- `src/App.tsx` — providers + route definitions

## Import boundary rules (enforced by ESLint)

- `src/api/**`, `src/config/**`, `src/domain/**`, `src/i18n/**`, `src/lib/**` must not import from `src/components/**` or `src/pages/**`.
- `src/components/**` must not import from `src/pages/**`.
- Use `@/` imports consistently for `src` paths.
- Any boundary exception requires explicit user approval before implementation.

## State + data fetching

- Use Zustand as the default source of truth for client/UI business state shared across components.
- Shared business state must be read via store selectors in components; avoid prop drilling for shared business state.
- Keep component props minimal and presentation-focused (display-only values, local callbacks, `children`).
- Use the official `zustand` npm package (installed via `pnpm`).
- Prefer React Query for server state (fetching, caching, cancellation).
- Query fns should accept and forward `AbortSignal` where possible.
- Avoid hard-coded visible UI copy in hooks/stores/libs (use i18n).

## Home contracts (Mapbox + risk flow)

- `VITE_MAPBOX_ACCESS_TOKEN` is required for location `suggest + retrieve`.
- Users must select a suggested location and frontend must resolve coordinates via retrieve before risk can be fetched.
- Risk request payload to backend must be `sport + latitude + longitude` (no Mapbox identifiers).
- Risk is fetched automatically when:
  - a location suggestion is selected and coordinates are resolved, and
  - the sport changes.
- Missing Mapbox token must show a configuration error; no silent fallbacks.
- Suggest API failures must show a retryable error message; no local fallback flow.
- Retrieve API failures must show a retryable error message and must not trigger risk fetch.
- Risk API failures must be shown in UI and must keep the last valid result (no silent fallback to fixtures in `api` mode).
- URL + persistence:
  - After a successful fetch, update query params (`sport`, `loc`) using replace history.
  - Persist to localStorage only for direct visits (not shared links).
- Timezone:
  - UI display always uses browser local timezone.
  - API datetime contract is UTC (ISO-8601 `...Z`) whenever datetime fields are added in the future.

## i18n

- All user-facing text must be defined in translation files under `src/i18n/locales/*/translation.json`.
- Baseline locale file is `src/i18n/locales/en/translation.json`.
- Components/pages/hooks/libs must consume visible copy through translation keys (`useTranslation()` + `t(...)` or equivalent i18next key lookup).
- Do not embed visible copy directly in components/hooks/libs.

## Editing workflow for AI agents

- Read relevant files first; avoid speculative edits.
- Change the minimum necessary surface area.
- Keep each change scoped to the requested task.
- Do not manually edit `dist/` output.
- Do not silently alter env contracts, route shapes, or cross-layer dependencies.

## Validation checklist before handoff

- Run `pnpm format`.
- Run `pnpm format:check` (or `pnpm lint:ci`).
- Run `pnpm lint`.
- Run `pnpm build`.
- Confirm no architectural boundary violations.
- Confirm Home flow behavior contracts still hold.
- Provide a concise summary of changed files and outcomes.

## Out of scope / do not change

- No backend or legacy changes from this guide unless explicitly requested.
- No dependency upgrades unless explicitly requested.
- No large visual redesign unless the task explicitly asks for it.
- No kids/adults segmentation work unless explicitly requested.
- This ruleset update does not require immediate full retrofit of all existing pages; enforce it for all new changes and touched files.
