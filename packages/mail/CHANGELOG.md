# @pearl-framework/mail

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

- [`de92297`](https://github.com/skd09/pearl.js/commit/de92297f5101deefa4511b9f33c55bcedc7a8ad8) Thanks [@skd09](https://github.com/skd09)! - fix(mail): refuse filesystem reads and URL fetches in SMTP attachments

  `SmtpTransport` now constructs nodemailer with `disableFileAccess: true` and
  `disableUrlAccess: true`. Without these flags, nodemailer follows
  `attachment.path` and `attachment.href` to read arbitrary local files or
  fetch remote URLs — a footgun if any part of an attachment is built from
  user input (file read, SSRF against internal services).

  Also bumps the `nodemailer` dependency from `^8.0.5` to `^9.0.1` to silence
  the `npm audit` warning for GHSA-p6gq-j5cr-w38f. The CVE itself was not
  exploitable via Pearl's API (Pearl never forwards the per-message `raw`
  option), but staying on a patched nodemailer line is good hygiene.

  If you genuinely need to send attachments by filesystem path or URL,
  construct your own `nodemailer` transport without these flags and wire it
  through a custom `MailTransport`.
