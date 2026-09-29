# Local Setup

## Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0
- Access to a running LeapMentor **backend** instance (this repo is
  frontend-only — it expects an API to talk to; it does not stub or mock a
  backend for local dev, only for tests via MSW)

## Install

```bash
npm install
```

## Environment variables

Copy `.env.example` if one exists, or create `.env` at the project root with
the following keys (all consumed via Vite's `import.meta.env`, so they must be
prefixed `VITE_` to be exposed to the client bundle):

| Variable | Required | Purpose |
|---|---|---|
| `VITE_API_URL` | No (defaults to `http://localhost:5000/api/v1`) | Backend API base URL, read in `axiosInstance.ts` |
| `VITE_SOCKET_URL` | No (defaults to `http://localhost:5000`) | Socket.io server URL, read in `useSocketToast.ts` |
| `VITE_CLERK_PUBLISHABLE_KEY` | **Yes**, the app throws at startup without it | Clerk auth (SSO) publishable key |
| `VITE_GOOGLE_CLIENT_ID` | Yes, for Google sign-in | Google OAuth client ID, read in `useGoogleAuth.ts` |
| `VITE_SENTRY_DSN` | No | Sentry DSN. Sentry is only enabled in production builds |
| `VITE_BETTERSTACK_SOURCE_TOKEN` | No | Enables log shipping to BetterStack in any environment, see [Logging](#logging) |
| `VITE_BETTERSTACK_INGEST_URL` | No (defaults to `https://in.logs.betterstack.com`) | Override for the BetterStack ingest endpoint |
| `VITE_APP_VERSION` | No (defaults to `dev`) | Sent as the `X-Client-Version` header on every API request |

All variables are read through Vite's `import.meta.env`, so they must be prefixed `VITE_` to reach the client bundle.

None of these are committed to git (`.env` is gitignored) — get real values
from whoever manages secrets/Password, not from this doc.

## Running locally

```bash
npm run dev       # Vite dev server with HMR, default port 5173
npm run build     # production build to dist/
npm run preview   # serve the production build locally
```

## Logging

`VITE_BETTERSTACK_SOURCE_TOKEN` controls whether logs ship to BetterStack —
**this happens in any environment where the token is set**, not just
production (see `src/shared/utils/logger.ts`). If you don't want your local
dev logs polluting the shared BetterStack project, leave this unset locally.
Console output in dev mode works regardless of whether the token is set.

## Code quality tooling (optional, for local checks before pushing)

```bash
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit, strict config
```

**SonarQube** — this project has local Docker-based SonarQube integration
(`sonar-project.properties`, two separate projects for frontend/backend). If
you need to run a local scan:

1. Start SonarQube via Docker (check with the team for the compose file/setup
   used previously — it isn't part of this repo).
2. Run `npm run test:coverage` first — Sonar reads `coverage/lcov.info`.
3. Run the SonarScanner CLI pointed at `sonar-project.properties`.

The `sonar.token` value currently committed in `sonar-project.properties`
should be rotated and moved to an environment variable / CI secret rather
than living in the repo — flag this to whoever owns the SonarQube project.

