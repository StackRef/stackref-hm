# frontend

The StackRef HM web application — the UI used by organizers, judges, and participants.

## Stack

- **React 18** built with **[Vite](https://vitejs.dev/)** (`@vitejs/plugin-react`)
- **MUI 5** (including MUI X Pro date/range pickers) for the component library
- **Redux Toolkit** for state, **React Router 6** for routing
- **Auth0** (`@auth0/auth0-spa-js`) for authentication
- **axios** for REST, a native WebSocket client for realtime
- FullCalendar, Lexical (rich text), FilePond (uploads), ApexCharts, i18next
- **Vitest** for tests

> Originally bootstrapped with Create React App; migrated to Vite to drop the
> unmaintained `react-scripts` toolchain and its vulnerable dependency tree
> (`npm audit` is now clean). See [Dependency security](#dependency-security).

## Local development

```bash
cp .env.example .env.local     # fill in Auth0 + API + WebSocket values
npm install
npm start                      # Vite dev server on http://localhost:9003
```

## Configuration

All configuration is via `REACT_APP_*` environment variables (see
[`.env.example`](.env.example)), loaded by Vite from `.env`, `.env.local`, and
`.env.<mode>` and exposed on `import.meta.env`. These are **public** — they ship in
the browser bundle — so never put true secrets here. (`REACT_APP_VERSION` is injected
automatically from `package.json`.) Key values:

| Variable | Purpose |
|---|---|
| `REACT_APP_AUTH0_DOMAIN`, `REACT_APP_AUTH0_CLIENT_ID` | Auth0 SPA application |
| `REACT_APP_SR_API_URL` | REST API base URL (the `api/` component) |
| `REACT_APP_SR_WS_BASE`, `REACT_APP_SR_WS_ENABLED` | tator WebSocket endpoint |
| `REACT_APP_MUI_PRO_LICENSE_KEY` | MUI X Pro license (required for Pro pickers) |
| `REACT_APP_SENTRY_DSN`, `_ENABLED`, `_DEBUG` | Error reporting (optional) |
| `REACT_APP_STRIPE_PUBLIC_KEY`, `_PRICING_TABLE` | Billing (optional) |
| `REACT_APP_GTM_CONTAINER_ID`, `REACT_APP_GA_MEASUREMENT_ID` | Analytics (optional) |
| `REACT_APP_ZOOM_SDK_KEY`, `_SECRET` | In-app video (optional) |

The original project used per-environment files (`.env.dev`, `.env.beta`, `.env.app`).
Create whichever you need from `.env.example`.

## Build & deploy

```bash
npm run build                  # production build -> build/
npm run build --env=dev        # build with .env.dev (mode "dev"); also beta, app
npm run preview                # serve the production build locally on :9003
```

`vite build --mode <env>` loads the matching `.env.<env>` file. Output goes to
`build/` (kept instead of Vite's default `dist/` so the existing deploy scripts work).

The production deployment served the static `build/` output from **S3 + CloudFront**.
The `package.json` scripts (`clear`, `copy`, `invalidate`, `deploy`) show that pattern
— an `aws s3 sync` to a bucket followed by a CloudFront invalidation. Point them at
your own bucket and distribution ID (the originals were placeholders after
sanitization).

## Project structure

```
index.html         Vite entry HTML (loads /src/index.js)
vite.config.js     Vite + Vitest configuration
src/
├── pages/         route-level screens
├── components/    reusable UI
├── slices/ store/ Redux state
├── stackref/      app-specific API clients & domain logic
├── contexts/ hooks/  React contexts and hooks (incl. Auth0, WebSocket)
├── theme/         MUI theming
└── routes.js      route table
```

JSX lives in `.js` files (a Create React App legacy); `vite.config.js` configures
esbuild to treat `.js` as JSX so the files don't need renaming. Absolute imports like
`import x from 'src/config'` resolve via the `src` alias in `vite.config.js`.

## Dependency security

`npm audit` is **clean** (0 vulnerabilities). Migrating from Create React App to Vite
removed `react-scripts` and its entire unmaintained, vulnerable build/test dependency
tree. Runtime dependencies are kept patched.

After changing dependencies, verify the app still builds and runs:

```bash
npm install
npm run build
npm start
```

## Notes

- A valid **MUI X Pro** license is required for the Pro date/range pickers used in
  scheduling. See <https://mui.com/x/introduction/licensing/>.
- `package-lock.json` is committed for reproducible installs.
