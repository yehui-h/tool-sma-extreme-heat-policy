# React + TypeScript + Vite

## Project structure (Feature-first, minimal)

| Path                | Responsibility                               |
| ------------------- | -------------------------------------------- |
| `src/app`           | app shell and global providers               |
| `src/features/*`    | business/domain modules (`home`, `about`)    |
| `src/shared/ui`     | cross-feature reusable UI primitives         |
| `src/shared/config` | app-wide config like Mantine theme           |
| `src/shared/lib`    | cross-feature pure helpers                   |
| `src/shared/api`    | API client foundation and endpoint constants |
| `src/pages`         | route-level page composition only            |
| `src/router`        | route definitions                            |

Import rules:

- `shared/**` must not import from `features/**` or `pages/**`.
- Features should not import internals of other features.
- Keep page files thin; put business logic inside feature modules.

## Home location search (Mapbox only)

Environment variables:

- `VITE_MAPBOX_ACCESS_TOKEN`: Required. Home `Location` autocomplete uses Mapbox Search Box `suggest`.
- `VITE_HOME_DATA_SOURCE`: Optional. `api | mock`, defaults to `api`.
- `VITE_API_BASE_URL`: Required when `VITE_HOME_DATA_SOURCE=api`. Home `Calculate risk` submits selected sport/location to backend `POST /home/risk`.

Behavior:

- Home page keeps draft input state separate from applied result state.
- Users must select a suggested location before `Calculate risk` is enabled.
- Users must select a suggestion that includes `mapbox_id + session_token`; otherwise risk calculation remains disabled.
- If Mapbox token is missing, the UI shows a configuration error and disables calculation.
- If Mapbox request fails, the UI shows an error message and asks the user to retry (no local fallback).
- Risk API failures are shown in UI and keep the last valid result; no silent fallback to fixture data in `api` mode.
- The selected location keeps `mapbox_id + session_token` in frontend state to support a later backend `retrieve` step.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs["recommended-typescript"],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```
