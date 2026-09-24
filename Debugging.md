# Debugging Process

## Local development

### React DevTools

Install the [React DevTools browser extension](https://react.dev/learn/react-developer-tools)
(Chrome/Firefox).
This is baseline tool for inspecting component trees, props, and re-render behavior,
and should be the first thing installed in a new dev environment.

### Redux DevTools

The store has `devTools: true` explicitly set in `configureStore`
(`src/app/store/index.ts`), so the
[Redux DevTools browser extension](https://github.com/reduxjs/redux-devtools)
works out of the box in dev. Use it to:

- Inspect current state of any slice (`auth`, `mentorProfile`, `menteeProfile`,
  `sharedConnect`, `connectRequests`, etc.)
- Step through dispatched actions in order — useful for chasing race
  conditions in async thunks (`pending`/`fulfilled`/`rejected`)
- Time-travel to a previous state to confirm whether a bug is a state issue or
  a render issue

### Browser DevTools — Network tab

Every request carries a `requestId` (generated in `axiosInstance.ts`) attached
as a header and echoed into log context on failure. When chasing a specific
failed request:

1. Find it in the Network tab, or in a `logger.error`/`logger.warn` line's
   `requestId` field.

### Console output

In dev mode (`import.meta.env.DEV`), every `logger.debug/info/warn/error` call
also mirrors to the browser console with a `[LEVEL] message` prefix — see
`src/shared/utils/logger.ts`. If you're not seeing expected logs locally,
confirm you're calling the shared `logger`, not a raw `console.*` — raw
console calls bypass redaction and don't ship to BetterStack.

## Debugging a failure that only shows up in production

Since Sentry (`Sentry.init` in `src/app/main.tsx`) is only `enabled` when
`import.meta.env.PROD` is true, you cannot reproduce Sentry-side error
grouping/replay locally by default. For a prod-only bug:

1. Check **Sentry** first — it captures unhandled exceptions with stack
   traces, and (in prod only) session replay with `maskAllText`/
   `blockAllMedia` enabled, so you get a redacted visual replay of what the
   user did leading up to the error.
2. Check **BetterStack** for the structured log trail — search by
   `requestId` if you have one from Sentry's breadcrumbs, or by `url.full` /
   `service.environment` (see [`Testing.md`](./Testing.md)'s sibling note on the logger's
   ECS-shaped payload). This gives you the sequence of `debug`/`info`/`warn`/
   `error` events, not just the final exception.
3. Cross-reference: Sentry tells you **what broke and how often**; BetterStack
   tells you **what happened right before it broke**. Neither alone usually
   has the full picture — see the "Sentry vs BetterStack" note the CQF review
   asked for.
4. If you need to reproduce prod-like Sentry behavior locally: temporarily set
   `enabled: true` (or use `import.meta.env.DEV` in a local branch) — **never
   commit this change**, it would send your local noise to the shared Sentry
   project.

## Error boundaries

Route-level boundaries (`RouteErrorBoundary`, wrapping each route zone in
`App.tsx`) and an app-level boundary (`Sentry.ErrorBoundary` in `main.tsx`)
both exist. If a bug manifests as a full-screen fallback instead of a
localized error, that tells you which boundary caught it — check which zone
the failing route belongs to first, rather than assuming it's the top-level
catch-all.