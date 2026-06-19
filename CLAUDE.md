# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# One-time
pnpm install                         # also runs `prepare` scripts (per-package tsc)

# Daily loop
pnpm dev                             # watch all packages (tsc --watch, parallel)
pnpm typecheck                       # turbo run typecheck — fan-out across packages
pnpm test                            # turbo run test — implies ^build first
pnpm build                           # turbo run build — implies ^build first
pnpm clean                           # rm -rf dist per package; doesn't clear .turbo

# Per-package scope (much faster iteration)
cd packages/<pkg> && npx tsc --noEmit
cd packages/<pkg> && npx vitest run
cd packages/<pkg> && npx vitest run src/guards/SessionGuard.test.ts   # single file
cd packages/<pkg> && npx vitest run -t "rotates session id"            # single test by name
cd packages/<pkg> && npx vitest                                        # watch mode

# Release flow (Changesets)
pnpm changeset                       # interactive: add a per-PR change description
pnpm changeset status                # show what will get bumped
pnpm version-packages                # consume .changeset/*.md, bump versions, regen CHANGELOG
                                     #   (the release.yml workflow runs this for you)

# Cache reset when Turbo / pnpm gets weird
rm -rf .turbo node_modules/.cache && pnpm install --frozen-lockfile
```

## Architecture

### The container is the spine

`Application.boot()` (`packages/core/src/Application.ts`) drives everything:

1. Constructs a `Container` (Map-backed IoC) and a `Config` loader.
2. Walks the registered `ServiceProvider`s twice — first `register()` (bind tokens), then `boot()` (resolve and start). Failure in either phase throws `ProviderBootError` with the provider name.
3. Calls `container.freeze()` — **any binding after this point throws `ContainerFrozenError`**. Tests that need late binding must call `container.createScope()`.

Every feature package exposes one `XxxServiceProvider` (e.g. `HttpServiceProvider`, `AuthServiceProvider`, `QueueServiceProvider`). Wiring an app means registering providers, never directly `new`-ing primitives. The meta package `@pearl-framework/pearl` re-exports every provider plus the public primitives — keep `packages/pearl/src/index.ts` in sync when adding a new export to any per-package `src/index.ts`. The CI publish flow depends on this.

### Workspace + build graph

- pnpm workspace, `linked` versioning under Changesets — all `@pearl-framework/*` packages release at one version.
- Inter-package deps use `workspace:*` (resolved to the published version at publish time).
- Turbo's `build`/`test`/`typecheck` tasks all declare `dependsOn: ["^build"]`, so changing a downstream package automatically rebuilds upstream packages. Don't reach across packages with relative imports — go through the package's `dist` via its name.
- `tsconfig.base.json` enables **all the strict modes that matter**: `exactOptionalPropertyTypes` (so `field?: T` does NOT include `undefined` — assigning `undefined` is a type error), `noUncheckedIndexedAccess` (`arr[i]` is `T | undefined`), `noPropertyAccessFromIndexSignature` (use bracket notation for index sigs). Most "why is this failing" TS errors trace back to one of these three.

### Conventions that are easy to break

- **Jobs are reconstructed via `Object.assign`, not constructor args.** `Job` subclasses (`packages/queue/src/jobs/Job.ts`) must put payload on public properties (`userId!: number`) and never accept constructor arguments — the worker does `safeMerge(new JobClass(), data)`. `__proto__`, `constructor`, and `prototype` are blocked during merge to prevent prototype pollution.
- **Router escape syntax**: `:name` is a parameter; `*` is a wildcard; `\:` is a literal colon. The compiler uses internal sentinels (`\x00COLON\x00`, `\x00PARAM\x00`) — don't paste literal NUL bytes into a route.
- **JWT guard refuses the `none` algorithm** at construction time. Don't try to relax it for tests; use a real secret.
- **FormRequest** throws two distinct typed errors: `ValidationException` (422 path) for Zod failures, `AuthorizationException` (403 path) when `authorize()` returns false. Middleware error handlers should match both.
- **`RateLimit` middleware ignores `X-Forwarded-For` by default.** Pass `trustProxy: true` ONLY when behind a reverse proxy you control — otherwise clients can spoof their own IP and bypass the limit.

### Tests

Vitest, one config per package. Two packages (`database`, `testing`) currently have no test files and use `vitest run --passWithNoTests` so the workspace task stays green. If you add the first test to either, drop the flag — the safety net masks future "all tests deleted" failures.

Test files live next to source (`Foo.ts` + `Foo.test.ts`). The base tsconfig excludes `**/*.test.ts` so they never end up in `dist/`. The package.json `files` field is `["dist", "README.md"]` — tests can't leak into the published tarball.

### Release flow

Two paths exist, will narrow to one:

- **Canonical (going forward): Changesets.** Add `.changeset/*.md` to each PR via `pnpm changeset`. On merge to `main`, `.github/workflows/release.yml` opens a "Version Packages" PR. Merging that PR runs `changeset publish`, which builds + `npm publish`es every bumped package with provenance attestations (SLSA-3), then creates a GitHub Release per package.
- **Legacy escape hatch: `.github/workflows/publish.yml`** publishes on `v*` tag push. Will be removed once the Changesets flow has shipped at least one release.

Both rely on the `NPM_TOKEN` repo secret (granular token scoped to `@pearl-framework/*`).

### Branch convention

`main` = released, `dev` = active. PRs target `dev`. CI runs on both. Release workflow only fires on `main`.

## Style notes

- Conventional Commits (`feat:`, `fix:`, `chore:`, `ci:`, `docs:`).
- No `any` in public types.
- Don't add boilerplate / defensive code for cases that can't happen.
- SOLID is invoked in CONTRIBUTING — meaningful here is "providers register, primitives don't reach out."

## Documentation lives in two places — keep them in sync

When framework code changes, the change has to show up in **both** the framework's `README.md` AND the website repo. The website is a separate codebase that ships independently and can't auto-discover what changed here.

Sibling repo path: `../pearljs-website/`

**Trigger → update checklist**

| You did this in `pearl.js` | Also update |
|---|---|
| Added a new public API (class, function, type export) | (1) `packages/<pkg>/src/index.ts` re-export, (2) `packages/pearl/src/index.ts` meta re-export, (3) the relevant page under `../pearljs-website/src/app/docs/<feature>/page.tsx` with a usage example |
| Added a new feature category (rate limit, session guard, etc.) | (1) Root `README.md` features table, (2) `../pearljs-website/src/app/page.tsx` — the "What you'll ship" + "Already solved" lists, (3) `../pearljs-website/src/lib/config.ts` `docsNav` if the feature warrants its own doc page |
| Changed a default that callers depend on (e.g. `trustProxy: false`) | Both the docs page covering the API and the README if it's a security-relevant default |
| Added a new package | Root `README.md` packages table + `../pearljs-website/src/app/page.tsx` packages grid |
| Changed CLI commands or scaffolded structure | Root `README.md` CLI reference section + `../pearljs-website/src/app/docs/cli/page.tsx` |

**One PR, both repos.** If the framework change is shipping to npm, the docs must land in the same release cycle. Treat website-side updates as part of the framework PR, not a follow-up — every release where docs lag becomes a support burden.

**Quick sanity checks before opening the PR**
- `grep -ri "<new API name>" ../pearljs-website/src` — at least the doc page and ideally an example should mention it.
- `pnpm changeset` description names the user-facing change in plain language — the same wording works for the docs page intro.
- Build the website locally (`cd ../pearljs-website && npx next build`) so a missing doc-page import doesn't break the deploy.
