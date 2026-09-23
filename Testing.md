# Testing

## Stack

- **Test runner:** Vitest (`vitest.config` lives inside `vite.config.js`, `test` block)
- **Component testing:** React Testing Library (`@testing-library/react`, `@testing-library/jest-dom`)
- **API mocking:** MSW (`msw/node`) — a shared server instance in `src/test/mswServer.js`
- **Environment:** jsdom
- **Coverage provider:** v8, reported as text + html + lcov (feeds SonarQube via `sonar.javascript.lcov.reportPaths`)

There are currently **231 test files** under `src/test/`, organized to mirror
`src/` — `components/`, `hooks/`, `store/`, `api/`, `mappers/`, `schemas/`,
`utils/`, `pages/`, `context/`, `config/`, `constants/`, `ui/`.

## Running tests

```bash
npm run test           # run once, CI mode
npm run test:watch     # watch mode, for local development
npm run test:coverage  # run with v8 coverage, writes to ./coverage
```

Coverage output (`coverage/lcov.info`) is what SonarQube consumes — don't
delete or restructure `coverage/` without checking `sonar-project.properties`.

## Global test setup

`src/test/setup.js` runs before every test file:

- Injects `@testing-library/jest-dom` matchers (`toBeInTheDocument`, etc.)
- Starts the shared MSW server (`onUnhandledRequest: "error"` — **an
  un-mocked request fails the test loudly instead of silently hanging**, so if
  a test fails with an MSW "unhandled request" error, that's the setup working
  as intended, not a bug to silence)
- Pre-injects a no-op Redux store into `axiosInstance` via `injectStore`, so
  components that read auth state don't crash just for existing
- Runs `cleanup()` after every test and resets MSW handlers between tests

## Established patterns (follow these, don't reinvent per file)

- **Module mocks:** use `vi.hoisted()` + `vi.mock()` for anything that needs
  to exist before the module graph loads (Redux slices, API modules).
- **Redux:** `useSelector` is mocked as `(fn) => fn(mockState)` — build a
  `mockState` object shaped like the real store slice you're touching, don't
  mock the whole store.
- **Async hooks:** use `renderHook` wrapped in `act()` for hooks that trigger
  state updates from promises.
- **Fake timers:** scope `vi.useFakeTimers()` to the specific test that needs
  it (slot locks, debounced calls) — global fake timers block promise
  resolution and will cause unrelated `await` calls elsewhere in the same file
  to hang.
- **Child components:** stub minimally — a one-line `<div>stub-name</div>`
  mock is usually enough; don't re-implement child behavior in the mock.

## Adding a new test

1. Mirror the source path under `src/test/` (e.g. a new hook at
   `src/features/mentor/presenter/useFoo.ts` gets its test at
   `src/test/hooks/useFoo.test.ts` or alongside the existing feature's test
   grouping — check how neighboring files in that feature are organized).
2. Reuse the mock patterns above instead of inventing new ones.
3. Run `npm run test:coverage` before opening a PR and check nothing you
   touched dropped in coverage.