# AI Working Guide for SMA Frontend

## Purpose and Scope

- This guide applies only to `frontend/`.
- Primary target is Codex; wording is intentionally reusable for Copilot.
- Goal: reduce inconsistent edits, preserve architecture, and improve delivery quality.

## Project Snapshot

- Stack: React 19, TypeScript, Vite, Mantine, React Router v7, and nuqs.
- Alias: `@/* -> src/*`.
- Package manager: `pnpm`.
- Core scripts:
  - `pnpm dev`
  - `pnpm lint`
  - `pnpm build`
  - `pnpm preview`

## Architecture and Layer Rules

- Keep the current feature-first structure:
  - `src/app`
  - `src/features/*`
  - `src/shared/*`
  - `src/pages`
  - `src/router`
- Keep page files thin; business/domain logic belongs in feature modules, hooks, or lib files.
- `src/shared/*` is for cross-feature, reusable code only.
- Avoid moving files between layers unless explicitly requested.

## Import Boundary Rules (Enforced by ESLint)

- `src/shared/**` must not import from `src/features/**` or `src/pages/**`.
- Feature modules must not import internals from other features (for example, `home` importing `about` internals).
- Use `@/` imports consistently for `src` paths.
- Any boundary exception requires explicit user approval before implementation.

## Coding Standards

- Use TypeScript strict-first conventions; avoid `any` unless there is a clear justification.
- Prefer small, pure helpers in `src/shared/lib` or `src/features/*/lib`.
- Keep components presentational where possible; move async/state orchestration into hooks.
- Preserve existing naming conventions and file organization patterns.
- Avoid unrelated refactors during task-focused work.

## Feature Contracts (Home / Mapbox / Risk flow)

- Preserve existing Home behavior unless explicitly requested to change:
  - `VITE_MAPBOX_ACCESS_TOKEN` is required for location suggestion.
  - `VITE_HOME_DATA_SOURCE` controls risk source mode (`api` by default, `mock` optional).
  - `VITE_API_BASE_URL` is required when `VITE_HOME_DATA_SOURCE=api`.
  - "Calculate risk" requires a selected location suggestion with `mapbox_id + session_token`.
  - Missing Mapbox token must show a configuration error and disable risk calculation.
  - Suggest API failures must show a retryable error message; no local fallback flow.
  - Risk API failures must be shown in UI and must not silently fallback to fixture data in `api` mode.
  - Keep `mapbox_id + session_token` in frontend flow for later retrieve support.
- Do not silently change these semantics.

## Editing Workflow for AI Agents

- Read relevant files first; avoid speculative edits.
- Change the minimum necessary surface area.
- Keep each change scoped to the requested task.
- Add or adjust tests when behavior changes (when test setup exists).
- Do not manually edit `dist/` output.
- Do not silently alter env contracts, route shapes, or cross-layer dependencies.

## Validation Checklist Before Handoff

- Run `pnpm lint`.
- Run `pnpm build`.
- Confirm no architectural boundary violations.
- Confirm Home flow behavior contracts still hold.
- Provide a concise summary of changed files and outcomes.

## Out of Scope / Do Not Change

- No backend or legacy changes from this guide.
- No dependency upgrades unless explicitly requested.
- No large visual redesign unless the task explicitly asks for it.

## Test Cases and Scenarios (for this guide)

- File existence:
  - `frontend/AGENTS.md` exists and is readable.
- Consistency with current project truth:
  - Rules remain aligned with `frontend/README.md`, `frontend/eslint.config.js`, `frontend/package.json`, and `frontend/tsconfig.app.json`.
- Agent behavior scenarios:
  - A new shared utility is placed in `src/shared/lib` and does not import feature/page modules.
  - Home risk flow changes preserve Mapbox token gating and selected-location requirement.
  - Delivery includes `pnpm lint` and `pnpm build` checks.

## Assumptions and Defaults

- Scope: `frontend` only.
- Language: English.
- Strictness: balanced guardrails.
- Target: Codex-first with Copilot-compatible wording.
- Current architecture and Home behavior are intentional defaults and should be preserved unless explicitly changed.
