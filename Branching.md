# Branching Strategy



## Strategy: Git Flow

We use Git Flow because the project has a clear release cadence (mentor/mentee
platform shipping in batches) and a need to keep `main` always deployable.

### Branches

| Branch | Purpose | Branched from | Merges into |
|---|---|---|---|
| `main` | Always production-deployable. Every commit here is a release. | — | — |
| `develop` | Integration branch for the next release. | `main` | `main` (via release) |
| `feature/<name>` | One feature or fix, scoped to a single reviewable change. | `develop` | `develop` |


### Naming

- `feature/mentor-availability-calendar`
- `feature/rbac-permission-layer`


Use kebab-case

### Rules

1. **No direct commits to `main` or `develop`.** Everything goes through a PR.
2. **A feature branch lives as long as the feature takes, no longer.** Rebase
   onto `develop` regularly to avoid a painful merge at the end.


## Pull Requests

Per the CQF review findings, PRs currently get opened and self-merged with no
review and no comments. Going forward:

1. **Every PR requires at least one approval** before merge (target: two, once
   the team isn't a single contributor).
2. **Reviewers leave comments**, not just an approval click — at minimum,
   confirm what was tested and flag anything that needs follow-up.
3. **The PR description states**: what changed, why, and how it was tested
   (which test files, or manual steps if no automated coverage exists yet).
4. **CI must pass** (lint, typecheck, test) before merge — see
   [`TESTING.md`](./TESTING.md) for what that covers today and what's missing
   (there is currently no CI pipeline defined in this repo — that's a
   prerequisite to enforcing this rule, not something already running).

## Commit messages

The existing log already leans toward Conventional Commits style
(`refactor: TypeScript migration`, `fix: ...`) — keep that going:

```
<type>: <short summary>

[optional body]
```

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`.