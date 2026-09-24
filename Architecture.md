# Architecture

## Overview

LeapMentor's frontend is a feature-based React app. Each feature owns its own **model / presenter / view** split.

```
src/
├── app/        # App shell: entry point, router, global store
├── features/   # One folder per domain, each split into model/presenter/view
├── shared/     # Cross-feature API clients, components, hooks, utils
├── assets/     # Static assets
└── test/       # Test setup + suites, mirroring src/
```

## The model / presenter / view pattern

Every folder under `src/features/<name>/` follows the same convention:

| Layer | Contents 
|---|---|---|
| `model/` | API calls, response mappers, types, permissions/business rules
| `presenter/` | Custom hooks that orchestrate model calls, local/derived state, and side effects for a view 
| `view/` | Presentational React components 


**Current features:** `admin`, `auth`, `connects`, `mentee`, `mentor`,
`notifications`, `shared-dashboard`, `uploads`.


## `shared/`

- `shared/api/` — API clients/functions not owned by a single feature
- `shared/components/` — reusable UI
- `shared/hooks/` — cross-feature hooks
- `shared/context/` — app-wide React Context providers 
- `shared/schemas/` — Zod schemas used by more than one feature
- `shared/constants/` — HTTP status codes, images, mentorship preference lists
- `shared/marketing/` — the public landing page (Hero, Navbar, Footer,etc)
- `shared/utils/` — `axiosInstance.ts`, `logger.ts`, error mapping, and other helpers

## `app/`

The composition root:

- `main.tsx` — process entry point. Sets up, in order: `Sentry.init` (only
  `enabled` in `PROD`), `Sentry.ErrorBoundary`, Redux `Provider`,
  `ClerkProvider` (throws at startup if `VITE_CLERK_PUBLISHABLE_KEY` is
  missing), `ToastProvider`, then a lazily-loaded `App` behind `Suspense`.
- `App.tsx` — route table. Every route group is wrapped in a
  `RouteErrorBoundary` with a `zone` prop , so an uncaught error in one
  route zone doesn't take down the rest of the app. A handful of routes are
  additionally wrapped with `withErrorBoundary(Component, name)` at the
  component level (e.g. `LoginMentee`, `MenteeEditProfileShell`,
  `MentorEditProfileShell`) for finer-grained isolation than the zone
  boundary gives.
- `store/` — Redux Toolkit store:
  - `index.ts` — `configureStore`, `devTools: true`, and `injectStore(store)`
    into `axiosInstance` so the Axios layer can read auth state without a
    circular import.
  - `slices/` — one slice per domain:
  - `hooks.ts` / `selectors.ts` — typed `useAppDispatch`/`useAppSelector` and
    shared selectors.

## Authorization

- **Authorization** is a lightweight RBAC layer in
  `features/auth/model/permissions.ts`: a `PERMISSIONS` map, a
  `ROLE_PERMISSIONS` table keyed by role (`mentor`, `mentee`), and
  `hasPermission` / `hasAnyPermission` helpers that resolve a user's granted
  permissions from their roles. This is a frontend-only gate for UI
  visibility  it is not a substitute for backend authorization checks.

## Data layer

- **HTTP:** a single shared `axiosInstance.ts` (`shared/utils/`) .
  It attaches a generated `X-Request-Id` header to every outgoing request and
  threads that id through error logging, so a failed request can be traced
  end-to-end in logs/Sentry.
- **Per-feature API modules** (`features/<name>/model/*.api.ts`) call through
  that shared instance and are paired with mapper files
  (`*Mapper.ts`) that translate raw API responses into UI-shaped models.

## State management

Redux Toolkit is used for state that's genuinely global or shared across
features (auth, onboarding drafts, profile data, connect requests, UI flags).
State that's local to a single screen or hook lives in that feature's
`presenter/` hooks via `useState`/`useReducer`, not in the store.

## Error handling & observability

Three layers, from broadest to narrowest:

1. **`Sentry.ErrorBoundary`** (`main.tsx`) — top-level catch-all, active only
   in `PROD` with a DSN configured.
2. **`RouteErrorBoundary`** (`App.tsx`) — one per route zone, so a crash is
   contained to the zone it happened in rather than blanking the whole app.
3. **`withErrorBoundary`** — applied to a small set of individually
   higher-risk components for boundary isolation finer than the zone level.

Structured logging goes through `shared/utils/logger.ts`, which mirrors to
the console in dev (`import.meta.env.DEV`) and ships to BetterStack when
`VITE_BETTERSTACK_SOURCE_TOKEN` is set, in any environment .

## Testing

Tests live under `src/test/`, mirroring the `src/` tree feature-for-feature.
See [`Testing.md`](./Testing.md) for the stack, conventions, and how to add a
new test.

