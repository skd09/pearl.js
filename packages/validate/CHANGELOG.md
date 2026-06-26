# @pearl-framework/validate

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
  - @pearl-framework/http@1.2.0

## 1.1.4

### Patch Changes

- Update repository URLs to the pearl-js GitHub organization.

- Updated dependencies []:
  - @pearl-framework/core@1.1.4
  - @pearl-framework/http@1.1.4

## 1.1.3

### Patch Changes

- Align with 1.1.3 release. No source-level changes; bumped so every @pearl-framework/\* package shares the same version line (see .changeset/config.json `fixed` rule).

## 1.1.2

### Patch Changes

- Updated dependencies [[`8596d0f`](https://github.com/skd09/pearl.js/commit/8596d0f137e89b9a15fb4eececceba22c720fa2e)]:
  - @pearl-framework/http@1.1.2
