<div align="center">
  <h1>Pearl.js</h1>
  <p>A modern, TypeScript-first web framework for Node.js — inspired by Laravel, built for the ecosystem.</p>

  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?logo=typescript)](https://www.typescriptlang.org/)
  [![npm](https://img.shields.io/badge/npm-@pearl--framework-red?logo=npm)](https://www.npmjs.com/org/pearl-framework)
  [![pnpm](https://img.shields.io/badge/pnpm-monorepo-orange?logo=pnpm)](https://pnpm.io/)
</div>

---

## What is Pearl?

Pearl is a batteries-included Node.js framework that brings Laravel's developer experience to TypeScript. It gives you a clean IoC container, expressive routing, validation, queues, mail, auth, and more — all fully typed, all working together out of the box.

```ts
import { Application, Router, HttpKernel } from '@pearl-framework/pearl'

const router = new Router()

router.get('/', (ctx) => {
  ctx.response.json({ message: 'Welcome to Pearl 🦪' })
})

const kernel = new HttpKernel()
kernel.useRouter(router)
await kernel.listen(3000)
```

---

## Getting Started

### Requirements

- Node.js 20+

### Create a new app

```bash
npx @pearl-framework/cli new my-app
cd my-app
npm run dev
```

That's it. Pearl auto-detects your package manager (pnpm, yarn, or npm), scaffolds a full project, and starts a running server.

### What gets created

```
my-app/
├── src/
│   ├── server.ts              ← entry point, ready to run
│   ├── app.ts                 ← bootstrap: db, auth, queue, events, routes
│   ├── controllers/
│   ├── models/
│   ├── schema/
│   ├── requests/
│   ├── events/
│   ├── listeners/
│   ├── jobs/
│   ├── mail/
│   ├── middleware/
│   └── providers/
├── database/
│   └── migrations/
├── tests/
│   └── app.test.ts
├── .env
├── .env.example
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

### Manual setup

```bash
npm install @pearl-framework/pearl
```

```ts
import { Application, Router, HttpKernel } from '@pearl-framework/pearl'

const router = new Router()
router.get('/', (ctx) => ctx.response.json({ message: 'Hello!' }))

const kernel = new HttpKernel()
kernel.useRouter(router)
await kernel.listen(3000)
```

---

## Architecture

Pearl is split into focused packages that are published independently but consumed as one:

```
@pearl-framework/pearl        ← meta package — install this
  ├── @pearl-framework/core       foundation: IoC container, Application, ServiceProvider
  ├── @pearl-framework/http       routing, middleware, Request/Response
  ├── @pearl-framework/validate   FormRequest, Zod-powered validation
  ├── @pearl-framework/auth       JWT guards, Hash, Authenticate middleware
  ├── @pearl-framework/events     type-safe event dispatcher
  ├── @pearl-framework/queue      BullMQ jobs and workers
  ├── @pearl-framework/mail       Mailable classes, SMTP/SES/Log transports
  └── @pearl-framework/database   Drizzle ORM, Model helpers
```

---

## Packages

| Package | Description | Version |
|---------|-------------|---------|
| [`@pearl-framework/pearl`](./packages/pearl) | Meta package — includes everything | `0.1.0` |
| [`@pearl-framework/core`](./packages/core) | IoC container, Application lifecycle, ServiceProvider | `0.1.0` |
| [`@pearl-framework/http`](./packages/http) | Router, middleware pipeline, Request/Response | `0.1.0` |
| [`@pearl-framework/validate`](./packages/validate) | FormRequest, ValidationPipe, Zod-powered rules | `0.1.0` |
| [`@pearl-framework/events`](./packages/events) | Type-safe event dispatcher, Listener base class | `0.1.0` |
| [`@pearl-framework/queue`](./packages/queue) | BullMQ-powered jobs, workers, and retry handling | `0.1.0` |
| [`@pearl-framework/mail`](./packages/mail) | Mailable classes, SMTP/SES/Log transports | `0.1.0` |
| [`@pearl-framework/database`](./packages/database) | Drizzle ORM integration, Model helpers | `0.1.0` |
| [`@pearl-framework/auth`](./packages/auth) | JWT & API token guards, Hash, Authenticate middleware | `0.1.0` |
| [`@pearl-framework/testing`](./packages/testing) | HttpTestClient, MailFake, Factory, DatabaseTestHelper | `0.1.0` |
| [`@pearl-framework/cli`](./packages/cli) | `pearl new`, `pearl make:*`, `pearl serve` | `0.1.0` |

---

## Quick Examples

### Routing

```ts
import { Router } from '@pearl-framework/pearl'

const router = new Router()

router.get('/users', async (ctx) => {
  ctx.response.json({ users: [] })
})

router.post('/users', async (ctx) => {
  const body = ctx.request.body<{ name: string }>()
  ctx.response.created({ id: 1, ...body })
})

router.group('/api', (r) => {
  r.get('/health', (ctx) => ctx.response.json({ status: 'ok' }))
})
```

### Validation

```ts
import { FormRequest } from '@pearl-framework/pearl'
import { z } from 'zod'

export class CreateUserRequest extends FormRequest {
  schema = z.object({
    name:  z.string().min(2),
    email: z.string().email(),
  })
  async authorize() { return true }
}

// In your handler
const data = await CreateUserRequest.validate(ctx)
const { name, email } = data
```

### Authentication

```ts
import { JwtGuard, Hash, Authenticate } from '@pearl-framework/pearl'

const guard = new JwtGuard(userProvider, { secret: process.env.JWT_SECRET! })

const token = await guard.attempt(email, password)

router.get('/me', meHandler, [Authenticate(authManager)])
```

### Events

```ts
import { Event, Listener, EventDispatcher } from '@pearl-framework/pearl'

class UserRegistered extends Event {
  constructor(public readonly user: User) { super() }
}

class SendWelcomeEmail extends Listener<UserRegistered> {
  async handle(event: UserRegistered) {
    await mailer.send(new WelcomeEmail(event.user))
  }
}

const dispatcher = new EventDispatcher()
dispatcher.on(UserRegistered, () => new SendWelcomeEmail())
await dispatcher.dispatch(new UserRegistered(user))
```

### Queue

```ts
import { Job, QueueManager } from '@pearl-framework/pearl'

class ProcessPayment extends Job {
  readonly queue = 'payments'
  constructor(public readonly orderId: number) { super() }
  async handle() { /* process payment */ }
}

await queue.dispatch(new ProcessPayment(order.id))
```

### Mail

```ts
import { Mailable } from '@pearl-framework/pearl'

class WelcomeEmail extends Mailable {
  constructor(private readonly recipient: string, private readonly name: string) { super() }

  build() {
    return this
      .to(this.recipient)
      .subject('Welcome!')
      .html(`<h1>Hi ${this.name}!</h1>`)
  }
}

await mailer.send(new WelcomeEmail(user.email, user.name))
```

### Database

```ts
import { pgTable, serial, varchar, Model } from '@pearl-framework/pearl'

export const users = pgTable('users', {
  id:    serial('id').primaryKey(),
  name:  varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
})

export class User extends Model<typeof users> {
  static table = users
}
```

### Testing

```ts
import { HttpTestClient, Factory } from '@pearl-framework/testing'

const client = new HttpTestClient(app.kernel.handler)

it('creates a user', async () => {
  const res = await client.post('/users', { name: 'Sharvari', email: 'hi@pearl.dev' })
  res.assertCreated().assertJson({ name: 'Sharvari' })
})
```

---

## Monorepo Development

> **Note:** Contributing to Pearl requires pnpm. End users can install with npm, pnpm, or yarn.

```bash
# Clone
git clone https://github.com/skd09/pearl.js.git
cd pearl.js
npm install -g pnpm

# Install all dependencies
pnpm install

# Build all packages
pnpm build

# Build a specific package
pnpm --filter @pearl-framework/http build

# Run tests
pnpm test

# Watch mode
pnpm dev
```

---

## Contributing

We welcome contributions! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Branch conventions

| Branch | Purpose |
|--------|---------|
| `main` | Stable releases |
| `dev` | Active development |
| `feat/*` | Feature branches |
| `fix/*` | Bug fixes |

### Commit conventions

Pearl uses [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(http): add response streaming support
fix(validate): correct error message for nested fields
docs(readme): update getting started guide
```

### Pull Request process

1. Fork the repo and create your branch from `dev`
2. Make your changes with tests
3. Ensure `pnpm build` and `pnpm test` pass
4. Open a PR targeting `dev`

---

## License

MIT © [Sharvari](https://github.com/skd09)