# @pearl-framework/database

## 1.2.0

### Minor Changes

- Move authentication onto Node's built-in `crypto` and fix several auth/validation correctness issues.

  **auth — now zero third-party crypto dependencies**

  - `Hash` now uses Node's `scrypt` instead of `bcryptjs`. **Breaking:** the stored hash format has changed, so password hashes created by earlier versions will no longer verify — plan to re-hash on next successful login or via a password reset.
  - `JwtGuard` now signs and verifies tokens with `node:crypto` instead of `jsonwebtoken` (HS256/384/512 and RS256/384/512). The configured algorithm is enforced on verification (the token's own `alg` header is never trusted); `none`, tampered, and expired tokens are rejected.
  - `bcryptjs` and `jsonwebtoken` (and their `@types`) are removed from dependencies.

  **Fixes**

  - `SessionGuard` rotation no longer silently logs users out — the rotated session id is surfaced via a new `onRotate(newId, oldId)` hook so your cookie layer can re-issue it.
  - `AuthServiceProvider` now wires the session and API-token guards (and resolves the default guard at boot), not just JWT.
  - `FormRequest` no longer lets the request body override route params (mass-assignment hardening); precedence is now body → query → route params.

  **Removed**

  - The non-functional experimental HTTP route decorators (`Controller`, `Get`/`Post`/`Put`/`Patch`/`Delete`) and the `reflect-metadata` dependency. They never produced routes — use the imperative `Router` API.

### Patch Changes

- Updated dependencies []:
  - @pearl-framework/core@1.2.0

## 1.1.4

### Patch Changes

- Update repository URLs to the pearl-js GitHub organization.

- Updated dependencies []:
  - @pearl-framework/core@1.1.4

## 1.1.3

### Patch Changes

- Align with 1.1.3 release. No source-level changes; bumped so every @pearl-framework/\* package shares the same version line (see .changeset/config.json `fixed` rule).

## 1.1.2

### Patch Changes

- [`8596d0f`](https://github.com/skd09/pearl.js/commit/8596d0f137e89b9a15fb4eececceba22c720fa2e) Thanks [@skd09](https://github.com/skd09)! - fix(security): close four hardening gaps found during audit

  **`@pearl-framework/http`**

  - **Body size limit.** Previously `HttpKernel` accepted request bodies of any size — a single attacker could exhaust server memory with a streamed multi-GB body. The kernel now defaults to a 1 MiB cap and short-circuits with `413 Payload Too Large` both up-front (when `Content-Length` declares a body above the limit) and mid-stream (when chunked transfer overruns the cap). Configurable via `new HttpKernel({ maxBodyBytes })`.
  - **Unhandled-exception messages no longer leak to clients.** `HttpKernel`'s catch-all used to echo `error.message` directly into the 500 response, surfacing framework internals (`TypeError: Cannot read properties of undefined …`) to anyone probing endpoints. Now only errors that set an explicit `statusCode` below 500 forward their message; everything else returns a generic `Internal Server Error`. A new `onUnhandledError` kernel option receives the full error for APM / log shipping.
  - **`RateLimit` IPv6 note.** Documented that the first `X-Forwarded-For` hop is used verbatim when `trustProxy: true` — upstream proxies must normalize IPv4-mapped IPv6 forms (`::ffff:192.0.2.1` vs `192.0.2.1`) or a single client can occupy two buckets.

  **`@pearl-framework/database`**

  - **Bump `typeorm` peer-dep floor to `>=0.3.29`** to close GHSA-9ggv-8w38-r7pm — SQL injection in `UpdateQueryBuilder`/`SoftDeleteQueryBuilder.orderBy()` on MySQL/MariaDB (affects `<=0.3.28`). Pearl's adapter is a thin lifecycle wrapper, so apps can move freely between `0.3.29+` and `1.x`.

  **Docs**

  - `packages/auth/README.md` now flags that `ApiTokenGuard` delegates token lookup to the user-provided `TokenStore`; in-memory stores must use `crypto.timingSafeEqual` rather than a naive `===` to be timing-safe. (Pearl's 320-bit tokens make the practical attack infeasible, but the docs gap is closed.)
