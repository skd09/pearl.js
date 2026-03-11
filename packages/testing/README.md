# @pearl-framework/testing

> HTTP test client, mail fakes, data factories, and database helpers for Pearl.js.

[![npm](https://img.shields.io/npm/v/@pearl-framework/testing?color=a855f7&labelColor=111118&style=flat-square)](https://www.npmjs.com/package/@pearl-framework/testing)

## Installation

```bash
npm install -D @pearl-framework/testing vitest
```

---

## HTTP Testing

`HttpTestClient` sends HTTP requests directly to your app handler in-process — no port, no network, no cleanup needed. Tests run fast and work in CI without any external services.

### Setup

```typescript
// tests/setup.ts
import { app } from '../src/server.js'
import { HttpTestClient } from '@pearl-framework/testing'

let client: HttpTestClient

beforeAll(async () => {
  await app.boot()
  client = new HttpTestClient(app.kernel.handler)
})

export { client }
```

### Writing tests

```typescript
import { describe, it } from 'vitest'
import { client } from './setup.js'

describe('POST /users', () => {
  it('creates a user and returns 201', async () => {
    const res = await client.post('/users', {
      name:     'Sharvari',
      email:    'hi@pearl.dev',
      password: 'secret1234',
    })

    res.assertCreated()
       .assertJson({ name: 'Sharvari' })
       .assertJsonPath('email', 'hi@pearl.dev')
  })

  it('rejects invalid input with 422', async () => {
    const res = await client.post('/users', { name: 'x' })
    res.assertStatus(422)
       .assertValidationErrors(['email', 'password'])
  })
})

describe('GET /me', () => {
  it('returns 401 without a token', async () => {
    const res = await client.get('/me')
    res.assertUnauthorized()
  })

  it('returns the authenticated user', async () => {
    // Log in to get a token
    const loginRes = await client.post('/auth/login', {
      email: 'hi@pearl.dev', password: 'secret1234',
    })
    const { token } = await loginRes.json()

    // Use the token on subsequent requests
    const res = await client.withToken(token).get('/me')
    res.assertOk().assertJsonPath('email', 'hi@pearl.dev')
  })
})
```

### `TestResponse` assertions

All assertion methods return `this`, so they can be chained:

```typescript
res.assertCreated()
   .assertJson({ id: 1 })
   .assertJsonPath('user.email', 'hi@pearl.dev')
```

| Method | Description |
|---|---|
| `assertOk()` | Status is 200 |
| `assertCreated()` | Status is 201 |
| `assertNoContent()` | Status is 204 |
| `assertBadRequest()` | Status is 400 |
| `assertUnauthorized()` | Status is 401 |
| `assertForbidden()` | Status is 403 |
| `assertNotFound()` | Status is 404 |
| `assertStatus(code)` | Status equals `code` |
| `assertJson(partial)` | Response body contains all key-value pairs in `partial` |
| `assertJsonPath(path, value)` | Dot-path in the JSON body equals `value` (e.g. `'user.email'`) |
| `assertValidationErrors(fields[])` | Response contains validation error entries for all listed fields |
| `json<T>()` | Parse and return the typed JSON body |

---

## Mail Fake

Swap the real mailer in your container with `MailFake` to capture sent mail in tests:

```typescript
import { describe, it, beforeEach } from 'vitest'
import { MailFake } from '@pearl-framework/testing'

let mailFake: MailFake

beforeEach(() => {
  mailFake = new MailFake()
  app.container.instance(Mailer, mailFake.mailer)
})

it('sends a welcome email after registration', async () => {
  await client.post('/auth/register', {
    name: 'Sharvari', email: 'hi@pearl.dev', password: 'secret1234',
  })

  mailFake.assertSentTo('hi@pearl.dev')
  mailFake.assertSent(WelcomeEmail)
  mailFake.assertCount(1)
})

it('does not send mail on a failed registration', async () => {
  await client.post('/auth/register', {})
  mailFake.assertNothingSent()
})
```

---

## Data Factories

Generate test data with sensible defaults that can be overridden per test:

```typescript
import { Factory } from '@pearl-framework/testing'

const userFactory = new Factory(() => ({
  name:  'Test User',
  email: `user-${Date.now()}@test.com`,
  role:  'user' as const,
}))

const user   = userFactory.make()                         // defaults
const admin  = userFactory.make({ role: 'admin' })        // with overrides
const users  = userFactory.makeMany(5)                    // array of 5

// .state() returns a new factory with pre-applied overrides
const adminFactory = userFactory.state({ role: 'admin' })
const admins = adminFactory.makeMany(3)
```

---

## Database Test Helper

Wrap each test in a database transaction that rolls back automatically. No cleanup code needed, no test data pollution.

```typescript
import { describe, it, beforeEach, afterEach } from 'vitest'
import { DatabaseTestHelper } from '@pearl-framework/testing'
import { db } from '../src/providers/AppServiceProvider.js'

const dbHelper = new DatabaseTestHelper(db)

beforeEach(() => dbHelper.begin())
afterEach(()  => dbHelper.rollback())

it('creates and counts users', async () => {
  await db.insert(users).values([
    { name: 'Alice', email: 'alice@test.com', password: 'x' },
    { name: 'Bob',   email: 'bob@test.com',   password: 'x' },
  ])
  const count = await User.count(db)
  expect(count).toBe(2)
  // automatically rolled back in afterEach
})
```

---

## API Reference

### `HttpTestClient`

| Method | Description |
|---|---|
| `get(url, options?)` | Send a GET request |
| `post(url, body?, options?)` | Send a POST request |
| `put(url, body?, options?)` | Send a PUT request |
| `patch(url, body?, options?)` | Send a PATCH request |
| `delete(url, options?)` | Send a DELETE request |
| `withToken(token)` | Set `Authorization: Bearer <token>` for subsequent requests |
| `withHeaders(headers)` | Merge additional headers for subsequent requests |
| `withoutToken()` | Remove the authorization header |

### `DatabaseTestHelper`

| Method | Description |
|---|---|
| `begin()` | Start a transaction |
| `rollback()` | Roll back the current transaction |
| `commit()` | Commit the current transaction |
| `transaction(fn)` | Run `fn` inside a transaction that auto-rolls back on completion |
| `truncate(...tables)` | Delete all rows from named tables |