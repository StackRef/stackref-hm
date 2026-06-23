# frontend

The StackRef HM web application — the UI used by organizers, judges, and participants.

## Stack

- **React 18** bootstrapped with Create React App, customized via
  **`react-app-rewired`** + **CRACO**
- **MUI 5** (including MUI X Pro date/range pickers) for the component library
- **Redux Toolkit** for state, **React Router 6** for routing
- **Auth0** (`@auth0/auth0-spa-js`) for authentication
- **axios** for REST, a native WebSocket client for realtime
- FullCalendar, Lexical (rich text), FilePond (uploads), ApexCharts, i18next

## Local development

```bash
cp .env.example .env.local     # fill in Auth0 + API + WebSocket values
npm install
npm start                      # serves on http://localhost:9003
```

## Configuration

All configuration is via `REACT_APP_*` environment variables loaded at build time
(see [`.env.example`](.env.example)). These are **public** — they ship in the browser
bundle — so never put true secrets here. Key values:

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
npm run build --env=<env>      # reads .env.<env>, outputs to build/
```

The production deployment served the static `build/` output from **S3 + CloudFront**.
The `package.json` scripts (`clear`, `copy`, `invalidate`, `deploy`) show that pattern
— an `aws s3 sync` to a bucket followed by a CloudFront invalidation. Point them at
your own bucket and distribution ID (the originals were placeholders after
sanitization).

## Project structure

```
src/
├── pages/         route-level screens
├── components/    reusable UI
├── slices/ store/ Redux state
├── stackref/      app-specific API clients & domain logic
├── contexts/ hooks/  React contexts and hooks (incl. Auth0, WebSocket)
├── theme/         MUI theming
└── routes.js      route table
```

## Dependency security

The runtime/production dependencies are kept patched, and `package.json` includes an
`overrides` block that force-patches several vulnerable transitive packages
(`nth-check`, `postcss`, `serialize-javascript`) pinned by the toolchain.

Any **remaining** Dependabot/`npm audit` alerts come from **`react-scripts`
(Create React App)**, which is unmaintained and pins old build/test-time
dependencies (`jest`, `svgo`, `webpack-dev-server`, `workbox`, etc.). These run only
during build/test and **are not shipped in the browser bundle**, so they carry no
production-runtime risk. Several have no patched release that is compatible with CRA,
so they cannot be resolved without changing the toolchain.

Two durable options:

1. **Migrate off CRA to [Vite](https://vitejs.dev/).** This removes `react-scripts`
   and its entire vulnerable transitive tree, and is the modern standard. Recommended.
2. **Dismiss the residual alerts** in Dependabot as *"vulnerable code is not actually
   used"* (build-time-only dev dependencies), documenting why.

After changing dependencies, always verify the app still builds and runs:

```bash
npm install
npm run build --env=<env>
npm start
```

> CRA 5 builds best on **Node 18**. Newer Node versions may require workarounds.

## Notes

- A valid **MUI X Pro** license is required for the Pro date/range pickers used in
  scheduling. See <https://mui.com/x/introduction/licensing/>.
- `package-lock.json` is committed for reproducible installs.
