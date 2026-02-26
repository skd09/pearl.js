# @pearl-framework/testing

> HTTP test client, mail fakes, data factories, and test helpers for Pearl.js

## Installation

```bash
pnpm add -D @pearl-framework/testing vitest
```

## Usage

### HTTP testing

```ts
import { HttpTestClient } from '@pearl-framework/testing'

const client = new HttpTestClient(app.handler)

it('creates a user', async () => {
  const res = await client.post('/users', {
    name:  'Sharvari',
    email: 'hi@pearl.dev',
  })

  res.assertCreated()
     .assertJson({ name: 'Sharvari' })
     .assertJsonPath('email', 'hi@pearl.dev')
})

it('requires auth', async () => {
  const res = await client.get('/me')
  res.assertUnauthorized()
})

it('works with token', async () => {
  const res = await client.withToken(token).get('/me')
  res.assertOk()
})
```

### Validation errors

```ts
it('validates required fields', async () => {
  const res = await client.post('/users', {})
  res.assertValidationErrors(['name', 'email'])
})
```

### Mail fake

```ts
import { MailFake } from '@pearl-framework/testing'

const mailFake = new MailFake()
// inject into container...

await registerUser(userData)

mailFake.assertSentTo('hi@pearl.dev')
mailFake.assertCount(1)
mailFake.assertSent('Welcome to Pearl!')
```

### Data factories

```ts
import { Factory } from '@pearl-framework/testing'

const userFactory = new Factory(() => ({
  name:  'Test User',
  email: `user-${Date.now()}@test.com`,
  role:  'user' as const,
}))

const user  = userFactory.make()
const admin = userFactory.make({ role: 'admin' })
const users = userFactory.makeMany(5)
const admins = userFactory.state({ role: 'admin' }).makeMany(3)
```

### Database helper

```ts
import { DatabaseTestHelper } from '@pearl-framework/testing'

const dbHelper = new DatabaseTestHelper(db)

beforeEach(() => dbHelper.begin())
afterEach(() => dbHelper.rollback())
```