# @pearl/auth

> JWT and API token authentication guards for Pearl.js

## Installation

```bash
pnpm add @pearl/auth @pearl/http jsonwebtoken bcryptjs
```

## Usage

### Implement AuthUser

```ts
import type { AuthUser } from '@pearl/auth'

export class User implements AuthUser {
  constructor(
    public id: number,
    public email: string,
    public passwordHash: string,
  ) {}

  getAuthIdentifier() { return this.id }
  getAuthPassword()   { return this.passwordHash }
}
```

### Implement UserProvider

```ts
import type { UserProvider } from '@pearl/auth'
import { Hash } from '@pearl/auth'

export class DrizzleUserProvider implements UserProvider<User> {
  async findById(id: number | string) {
    return User.find(db, id) as Promise<User | null>
  }

  async findByCredentials(email: string, password: string) {
    const [row] = await db.select().from(users).where(eq(users.email, email))
    if (!row) return null
    const valid = await Hash.check(password, row.passwordHash)
    return valid ? new User(row.id, row.email, row.passwordHash) : null
  }
}
```

### JWT guard

```ts
const guard = new JwtGuard(new DrizzleUserProvider(), {
  secret: process.env.JWT_SECRET!,
  expiresIn: '7d',
})

// Login
const token = await guard.attempt(email, password)

// Protect routes
router.post('/auth/login', loginHandler)
router.get('/me', meHandler, [Authenticate(authManager)])
```

### Hash passwords

```ts
import { Hash } from '@pearl/auth'

const hash  = await Hash.make(password)
const valid = await Hash.check(password, hash)
```

---