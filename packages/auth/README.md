# @pearl-framework/auth

> JWT, session, and API-token authentication guards with password hashing and route protection for Pearl.js.

[![npm](https://img.shields.io/npm/v/@pearl-framework/auth?color=a855f7&labelColor=111118&style=flat-square)](https://www.npmjs.com/package/@pearl-framework/auth)

Three guard implementations, all behind a common `AuthGuard` contract:

- **`JwtGuard`** — stateless Bearer tokens, algorithm-pinned, `none` algorithm blocked
- **`SessionGuard`** — opaque session ids for cookie-based auth, rotation-on-use, `logoutAll`
- **`ApiTokenGuard`** — long-lived API tokens with optional expiry, auto-revocation

Plus `Authenticate` / `OptionalAuth` middleware, the `Hash` helper (scrypt, via Node's built-in `crypto`), and `AuthServiceProvider` for IoC wiring.

## Installation

```bash
npm install @pearl-framework/auth @pearl-framework/core @pearl-framework/http
```

---

## Setup

Setting up auth takes four steps: implement `AuthUser`, implement `UserProvider`, create a guard, and protect your routes.

### Step 1 — Implement `AuthUser`

Your user model needs to implement two methods:

```typescript
import type { AuthUser } from '@pearl-framework/auth'

export class User implements AuthUser {
  constructor(
    public readonly id: number,
    public readonly email: string,
    public readonly password: string,
  ) {}

  // Used as the JWT `sub` claim
  getAuthIdentifier() { return this.id }

  // The hashed password — used by UserProvider for credential checks
  getAuthPassword()   { return this.password }
}
```

### Step 2 — Implement `UserProvider`

The provider tells Pearl how to look up users:

```typescript
import type { UserProvider } from '@pearl-framework/auth'
import { Hash } from '@pearl-framework/auth'
import { db } from '../providers/AppServiceProvider.js'
import { users } from '../schema/users.js'
import { eq } from 'drizzle-orm'

export class DrizzleUserProvider implements UserProvider<User> {
  async findById(id: number | string): Promise<User | null> {
    const [row] = await db.select().from(users).where(eq(users.id, Number(id)))
    return row ? new User(row.id, row.email, row.password) : null
  }

  async findByCredentials(email: string, password: string): Promise<User | null> {
    const [row] = await db.select().from(users).where(eq(users.email, email))
    if (!row) return null
    return await Hash.check(password, row.password)
      ? new User(row.id, row.email, row.password)
      : null
  }
}
```

### Step 3 — Create the guard

```typescript
import { JwtGuard, AuthManager } from '@pearl-framework/auth'

const guard = new JwtGuard(new DrizzleUserProvider(), {
  secret:    process.env.JWT_SECRET!,   // minimum 32 characters
  expiresIn: '7d',                      // ms-compatible string or seconds as a number
})

const auth = new AuthManager(guard)
```

### Step 4 — Protect routes

```typescript
import { Authenticate, OptionalAuth } from '@pearl-framework/auth'

// Required auth — returns 401 if the token is missing or invalid
router.get('/me', (ctx) => ctx.response.json(ctx.user()), [Authenticate(auth)])

// Optional auth — populates ctx.user() if a valid token is present, but does not reject
router.get('/feed', (ctx) => {
  const user = ctx.user()  // User | null
  ctx.response.json(buildFeed(user))
}, [OptionalAuth(auth)])
```

---

## Auth Routes

```typescript
// POST /auth/register
router.post('/auth/register', async (ctx) => {
  const { name, email, password } = ctx.request.body
  const [user] = await db.insert(users).values({
    name,
    email,
    password: await Hash.make(password),
  }).returning()
  const token = await auth.attempt(email, password)
  ctx.response.created({ user, token })
})

// POST /auth/login
router.post('/auth/login', async (ctx) => {
  const { email, password } = ctx.request.body
  const token = await auth.attempt(email, password)
  if (!token) return ctx.response.unauthorized('Invalid credentials')
  ctx.response.json({ token })
})
```

---

## SessionGuard (cookie auth)

Use `SessionGuard` when you want cookie-backed sessions instead of Bearer tokens. The guard issues an opaque, cryptographically random session id; pair it with your own `Set-Cookie` header to send it back to the client. Supports rotation-on-use and "log out everywhere."

```typescript
import { SessionGuard } from '@pearl-framework/auth'
import type { SessionStore } from '@pearl-framework/auth'

// Bring your own store — Redis, a DB table, etc.
const store: SessionStore = {
  async find(id)        { /* SELECT * FROM sessions WHERE id = ? */ },
  async save(record)    { /* INSERT … ON CONFLICT UPDATE */ },
  async destroy(id)     { /* DELETE FROM sessions WHERE id = ? */ },
  async destroyAll(uid) { /* DELETE FROM sessions WHERE user_id = ? */ },
}

const sessions = new SessionGuard(userProvider, store, {
  lifetimeSeconds: 60 * 60 * 2,   // default 2h
  rotateOnUse:     true,          // issue a fresh id on every successful check
})

// Login
router.post('/login', async (ctx) => {
  const { email, password } = ctx.request.body as { email: string; password: string }
  const id = await sessions.attempt(email, password)
  if (!id) return ctx.response.unauthorized()
  ctx.response.header('set-cookie', `sid=${id}; HttpOnly; Secure; SameSite=Lax`)
  ctx.response.ok({ ok: true })
})

// Logout this session
await sessions.logout(id)

// Log out everywhere for this user
await sessions.logoutAll(user)
```

Security notes:
- IDs are 256 bits of entropy from `randomBytes(32)`.
- The compare against the stored id uses `timingSafeEqual` to remove a side channel from in-process equality.
- Expired sessions are destroyed automatically the first time they're accessed.

## ApiTokenGuard (long-lived tokens)

For programmatic access where Bearer JWTs don't fit. The guard generates 320-bit hex tokens, stores them via a `TokenStore` you provide, and auto-revokes on expiry.

```typescript
import { ApiTokenGuard } from '@pearl-framework/auth'

const apiTokens = new ApiTokenGuard(userProvider, tokenStore)

// Issue a token (optionally with expiry)
const token = await apiTokens.issueToken(user, new Date(Date.now() + 30 * 86400_000))

// Authenticate a request
const user = await apiTokens.user(token)   // User | null

// Revoke
await apiTokens.revoke(token)
await apiTokens.revokeAll(user)
```

## Password Hashing

```typescript
import { Hash } from '@pearl-framework/auth'

// Hash a plain-text password (scrypt — Node's built-in crypto)
const hash = await Hash.make('my-password')

// Verify a password against a stored hash
const valid = await Hash.check('my-password', hash)  // → true
const wrong = await Hash.check('wrong', hash)        // → false
```

---

## AuthServiceProvider

If you use Pearl's service container, register auth through the provider:

```typescript
import { AuthServiceProvider } from '@pearl-framework/auth'

export class AppAuthServiceProvider extends AuthServiceProvider {
  protected config = {
    defaultGuard: 'jwt' as const,
    userProvider: new DrizzleUserProvider(),
    jwt: {
      secret:    process.env.JWT_SECRET!,
      expiresIn: '7d',
    },
  }
}

app.register(AppAuthServiceProvider)
```

---

## Security Notes

- **Algorithm pinning** — verification always enforces the single configured algorithm; the token's own `alg` header is never trusted. This prevents [algorithm confusion attacks](https://auth0.com/blog/critical-vulnerabilities-in-json-web-token-libraries/) where an attacker switches the token's algorithm to bypass verification.
- **`none` algorithm blocked** — passing `algorithm: 'none'` throws at construction time with a clear error message.
- **Secrets** — use a minimum of 32 random characters for `JWT_SECRET`. Use `openssl rand -base64 32` to generate one.
- **API token lookup must be timing-safe.** `ApiTokenGuard` delegates token retrieval to the `TokenStore` you provide. Database-backed stores are typically fine — indexed lookups have negligible timing variance. **In-memory stores must use `crypto.timingSafeEqual`** when matching the supplied token against stored ones; a naive `===` or `Array.find(t => t.token === input)` is theoretically vulnerable to a side-channel attack. Pearl ships 320-bit tokens (`randomBytes(40).toString('hex')`), which makes the practical attack infeasible, but a timing-safe store closes the gap entirely.

---

## API Reference

### `JwtGuard`

| Method | Description |
|---|---|
| `attempt(identifier, password)` | Verify credentials and return a signed JWT, or `null` |
| `issueToken(user)` | Issue a JWT for an already-authenticated user |
| `user(token)` | Verify a token and return the user, or `null` |
| `check(token)` | Alias for `user()` — returns `true`/`false` equivalent via non-null check |
| `refresh(token)` | Issue a new token for the owner of a valid existing token |
| `decode(token)` | Decode a JWT payload without verifying the signature |

### `SessionGuard`

| Method | Description |
|---|---|
| `attempt(identifier, password)` | Verify credentials and issue a session id, or `null` |
| `issueSession(user)` | Issue a session id for an already-authenticated user |
| `user(token)` | Resolve the user behind a session id, `null` if expired/unknown |
| `check(token)` | Alias for `user()` |
| `logout(token)` | Destroy this single session |
| `logoutAll(user)` | Destroy every session for this user |

### `ApiTokenGuard`

| Method | Description |
|---|---|
| `attempt(identifier, password)` | Verify credentials and issue an API token |
| `issueToken(user, expiresAt?)` | Issue a token for an already-authenticated user |
| `user(token)` | Resolve the user behind a token, auto-revokes if expired |
| `check(token)` | Alias for `user()` |
| `revoke(token)` | Revoke a single token |
| `revokeAll(user)` | Revoke every token for this user |

### `Hash`

| Method | Description |
|---|---|
| `Hash.make(password)` | scrypt-hash a plain-text password |
| `Hash.check(password, hash)` | Verify a plain-text password against a scrypt hash |

## Related

- [`@pearl-framework/validate`](https://www.npmjs.com/package/@pearl-framework/validate) — `FormRequest.authorize()` throws `AuthorizationException` when access checks fail, which pairs cleanly with these guards.
- [`@pearl-framework/http`](https://www.npmjs.com/package/@pearl-framework/http) — the middleware pipeline that `Authenticate` plugs into.