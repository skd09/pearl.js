# Pearl.js — Dependency Reduction Plan

Goal: shrink the dependency surface and lean on Node's built-in modules where it
genuinely improves reliability — **without** reinventing battle-tested libraries.

## Guiding principle

Fewer dependencies is not automatically more reliable. The win comes from two
things only:

1. Keeping `core` (and the base framework) dependency-free.
2. Replacing small, security-critical third-party libs with Node's built-in
   `node:crypto` — which is more trustworthy than any npm package and needs no
   native build.

Reimplementing hard, well-tested libraries (SMTP, a Redis queue) would *reduce*
reliability. Those stay.

## Current runtime dependencies

| Package | Runtime deps | Verdict |
|---|---|---|
| `core` | none | ✅ keep zero-dep |
| `http` | `reflect-metadata` | ⚠️ likely unused — verify & drop |
| `auth` | `jsonwebtoken`, `bcryptjs` | 🔁 replace with `node:crypto` |
| `validate` | `zod` | ➗ keep, but make swappable |
| `events` | none | ✅ |
| `queue` | `bullmq`, `ioredis` | 🚫 keep — do not reinvent |
| `mail` | `nodemailer` | 🚫 keep — do not reinvent |
| `database` | none (ORMs are optional peers) | ✅ already swappable |
| `cli` | `chalk`, `commander`, `ora`, `@inquirer/prompts` | 🔁 trim chalk/ora |

---

## Item 1 — Replace `bcryptjs` with Node `crypto.scrypt`

- **Where:** `packages/auth/src/Hash.ts`
- **Why:** removes a dependency; password hashing now uses Node core; no native
  build; `scrypt` is a recommended, memory-hard password hash.
- **Effort:** Low (~1 file, ~40 lines)
- **Risk:** Medium — **hash format changes**, so existing stored hashes won't
  verify. Safe now while Pearl has few/no production users; do it before wider
  adoption, not after.
- **Steps:**
  - [ ] Implement `Hash.make()` using `crypto.scrypt` + a random 16-byte salt;
        store as `scrypt$N$salt$hash` (encode params so you can verify later).
  - [ ] Implement `Hash.verify()` with `crypto.timingSafeEqual`.
  - [ ] Keep the existing `Hash` API identical so nothing else changes.
  - [ ] Update tests in `packages/auth`.
  - [ ] Remove `bcryptjs` + `@types/bcryptjs` from `auth/package.json`.

## Item 2 — Replace `jsonwebtoken` with built-in `crypto`

- **Where:** `packages/auth/src/guards/JwtGuard.ts`
- **Why:** removes a heavy dependency with its own CVE history; you already pin
  the algorithm, so owning the ~100 lines gives full control.
- **Effort:** Medium (~100–150 lines + tests)
- **Risk:** Medium — security-sensitive, but JWT (base64url + HMAC/RSA) is
  well-specified. Mitigate with thorough tests.
- **Steps:**
  - [ ] Implement `sign()` for HS256 (`crypto.createHmac`) and RS256
        (`crypto.createSign`).
  - [ ] Implement `verify()`: split token, recompute signature,
        `timingSafeEqual`, then validate `exp`/`nbf`/`iat`.
  - [ ] **Reject `alg: none`** and reject algorithm mismatch explicitly.
  - [ ] Base64url encode/decode helpers (no padding).
  - [ ] Port tests; add cases for tampered token, expired token, wrong alg.
  - [ ] Remove `jsonwebtoken` + `@types/jsonwebtoken` from `auth/package.json`.
- **Note:** if RS256/JWKS support grows complex later, this is the one item
  where keeping a tiny focused lib could be defensible. HS256-only is trivial.

## Item 3 — Trim CLI dependencies

- **Where:** `packages/cli/src/**` (`chalk`, `ora`)
- **Why:** the CLI is a dev tool (not shipped to end-user runtime), but it's an
  easy, zero-risk trim.
- **Effort:** Low
- **Risk:** Low (cosmetic output only)
- **Steps:**
  - [ ] Add a small `style.ts` with ANSI color helpers; replace `chalk`.
  - [ ] Add a minimal spinner (or just status lines); replace `ora`.
  - [ ] Consider keeping `commander` + `@inquirer/prompts` (real value, hard to
        replace well) — trimming these is not worth it.
  - [ ] Remove `chalk`, `ora` from `cli/package.json`.

## Item 4 — Remove `reflect-metadata` if unused

- **Where:** `packages/http/package.json`
- **Why:** no `reflect-metadata` import was found in source — likely dead weight.
- **Effort:** Trivial
- **Risk:** Low (confirm first)
- **Steps:**
  - [ ] `grep -r "reflect-metadata" packages/http/src` and check for a
        side-effect import (`import 'reflect-metadata'`).
  - [ ] If unused, remove from `http/package.json` and rebuild/test.

## Item 5 — Make validation swappable (Zod as default)

- **Where:** `packages/validate`
- **Why:** mirrors the database layer's adapter pattern; removes the hard
  coupling to Zod and de-risks betting on one validator. Zod stays the default.
- **Effort:** Medium (architectural)
- **Risk:** Medium — touches the public `FormRequest` API; design carefully.
- **Steps:**
  - [ ] Define a tiny `Validator` interface (`parse(input) -> result | errors`).
  - [ ] Ship a `ZodValidator` adapter as the default.
  - [ ] Make `zod` a peer/optional dep instead of a hard dependency.
  - [ ] Keep current Zod usage working out of the box (no breaking change for
        existing users).
  - [ ] Document how to plug in an alternative (e.g. Valibot / Standard Schema).

---

## Do NOT do

- ❌ Reimplement `nodemailer` (SMTP) — keep; it's optional via the `mail` package.
- ❌ Reimplement `bullmq`/`ioredis` (Redis queue) — keep; optional via `queue`.
- ❌ Reimplement `zod`'s validation logic — abstract it (Item 5), don't rebuild it.

## Suggested sequence

1. **Item 4** (quick win, confirm/remove `reflect-metadata`)
2. **Item 1** (bcrypt → scrypt) — highest value, self-contained
3. **Item 2** (jsonwebtoken → crypto)
4. **Item 3** (CLI trim)
5. **Item 5** (swappable validation) — last; biggest design surface

Ship Items 1–2 together as a minor release and lead the changelog with
"auth now runs on Node's built-in crypto — zero third-party crypto dependencies."
That's both a reliability improvement and a marketing line.
