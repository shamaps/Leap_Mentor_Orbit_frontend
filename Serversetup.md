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

| Variable | Purpose |
|---|---|
| `VITE_API_URL` / `VITE_API_BASE_URL` | Backend API base URL |
| `VITE_APP_BASE_URL` | This app's own base URL (used for redirect/callback URLs) |
| `VITE_SOCKET_URL` | Socket.io server URL for real-time features |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk auth (SSO) publishable key |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `VITE_VAPID_PUBLIC_KEY` | Web push notification public key |
| `VITE_SENTRY_DSN` | Sentry project DSN for error/trace reporting |
| `VITE_BETTERSTACK_SOURCE_TOKEN` | BetterStack (Logtail) log ingestion token — see [logging notes](#logging) below |
| `VITE_APP_VERSION` | App version string, surfaced wherever the build reports its own version |

**Note on `VITE_API_URL` vs `VITE_API_BASE_URL`:** both exist in the current
`.env` — confirm with whoever owns the Axios setup which one is actually read
before assuming they're interchangeable; don't assume this is intentional
redundancy without checking `axiosInstance.ts`.

None of these are committed to git (`.env` is gitignored) — get real values
from whoever manages secrets/1Password/team vault, not from this doc.

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

