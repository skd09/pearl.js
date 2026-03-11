# @pearl-framework/auth

> JWT authentication, password hashing, and route protection for Pearl.js.

[![npm](https://img.shields.io/npm/v/@pearl-framework/auth?color=a855f7&labelColor=111118&style=flat-square)](https://www.npmjs.com/package/@pearl-framework/auth)

## Installation

```bash
npm install @pearl-framework/auth @pearl-framework/core @pearl-framework/http jsonwebtoken bcryptjs
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

## Password Hashing

```typescript
import { Hash } from '@pearl-framework/auth'

// Hash a plain-text password (bcrypt, cost factor 10)
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
    guard:  'jwt',
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

- **Algorithm pinning** — `jwt.verify()` is always called with an explicit `algorithms` allowlist. This prevents [algorithm confusion attacks](https://auth0.com/blog/critical-vulnerabilities-in-json-web-token-libraries/) where an attacker switches the token's algorithm to bypass verification.
- **`none` algorithm blocked** — passing `algorithm: 'none'` throws at construction time with a clear error message.
- **Secrets** — use a minimum of 32 random characters for `JWT_SECRET`. Use `openssl rand -base64 32` to generate one.

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

### `Hash`

| Method | Description |
|---|---|
| `Hash.make(password)` | Bcrypt-hash a plain-text password |
| `Hash.check(password, hash)` | Verify a plain-text password against a bcrypt hash |