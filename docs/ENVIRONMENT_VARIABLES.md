# Environment Variables

This app is a Create React App admin client. Every variable used by browser code must be prefixed
with `REACT_APP_`, and every such value is bundled into the public JavaScript at build time.

Treat this as an operational dashboard, but remember that browser-exposed values are not true
secrets. In particular, `REACT_APP_HEROKU_TOKEN` and `REACT_APP_COMPANION_STATS_SECRET` are visible
to anyone who can inspect the built app. Prefer moving privileged operations behind a server-side
proxy when possible.

Local values normally live in `.env`, `.env.local`, or deployment provider settings. Those files
are gitignored; keep this document and deployment settings in sync.

## Required

| Variable | Used in | Purpose | Example |
| --- | --- | --- | --- |
| `REACT_APP_IO_SERVER` | `src/index.js`, uploads, operations health checks | ClinicPlus legacy/socket server base URL. Used for Socket.IO, uploads, DB status checks, and most legacy admin CRUD flows. | `https://api.clinicplusbooking.co.za` |

## Required for Admin Companion / analytics features

| Variable | Used in | Purpose | Failure mode |
| --- | --- | --- | --- |
| `REACT_APP_COMPANION_API_URL` | `src/lib/adminApi.js`, dashboard, analytics, invoices, employees, sites, messaging, audit, availability, signals, support tickets, platform controls | `cp-companion` base URL for guarded admin APIs and audit/usage integrations. | New admin analytics/read-model features show configuration errors or fail requests. |
| `REACT_APP_COMPANION_STATS_SECRET` | Same guarded `cp-companion` admin routes | Shared secret sent as `x-admin-stats-secret`. Must match `ADMIN_STATS_SECRET` in `cp-companion`. | Guarded calls return `401 Unauthorized`; some pages render empty/configuration states. |

## Operations-only variables

| Variable | Used in | Purpose | Risk |
| --- | --- | --- | --- |
| `REACT_APP_DYNO_URL` | `src/views/operations/index.js` | Heroku dyno/app endpoint used by the Operations page for dyno actions and status checks. | Should be moved behind a backend proxy if it enables privileged operations. |
| `REACT_APP_HEROKU_TOKEN` | `src/views/operations/index.js` | Bearer token used directly from the browser for Heroku API calls on the Operations page. | High risk: this is public in the built app. Rotate if exposed and replace with a server-side proxy. |

## Framework-provided

| Variable | Source | Purpose |
| --- | --- | --- |
| `NODE_ENV` | Create React App / React Scripts | Build/runtime mode. Not directly used for app configuration today. |

## Cross-app contract

Most `cp-redesign-admin` to `cp-companion` calls are browser-to-service requests, so CORS matters.
`cp-companion` admin routes must:

- respond to `OPTIONS`
- allow `x-admin-stats-secret` and `content-type` headers
- allow `GET`, `POST`, `PATCH`, and `DELETE` where used

The shared secret is only an app-level gate, not user-level auth. Because it is bundled into this
browser app, do not treat it like a private server secret.

## Local development template

```bash
REACT_APP_IO_SERVER=http://localhost:5000
REACT_APP_COMPANION_API_URL=http://localhost:3000
REACT_APP_COMPANION_STATS_SECRET=replace-with-shared-admin-stats-secret
REACT_APP_DYNO_URL=https://api.heroku.com/apps/<app-name>/dynos
REACT_APP_HEROKU_TOKEN=replace-with-temporary-token
```

## Deployment checklist

- Set all `REACT_APP_*` values before running `npm run build`; CRA bakes them into the output.
- Rebuild after changing any value.
- Keep `REACT_APP_COMPANION_STATS_SECRET` aligned with `ADMIN_STATS_SECRET` in `cp-companion`.
- Avoid shipping `REACT_APP_HEROKU_TOKEN`; use a backend proxy for production privileged actions.
- Never add real `.env` values to git.
