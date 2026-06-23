# @pearl-framework/http

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
