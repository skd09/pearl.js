<div align="center">
  <h1>Pearl.js</h1>
  <p>A modern, TypeScript-first web framework for Node.js — inspired by Laravel, built for the ecosystem.</p>

  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?logo=typescript)](https://www.typescriptlang.org/)
  [![pnpm](https://img.shields.io/badge/pnpm-monorepo-orange?logo=pnpm)](https://pnpm.io/)
</div>

---

## What is Pearl?

Pearl is a batteries-included Node.js framework that brings Laravel's developer experience to TypeScript. It gives you a clean IoC container, expressive routing, validation, queues, mail, auth, and more — all fully typed, all working together out of the box.

```ts
import { Application } from '@pearl/core'
import { HttpKernel } from '@pearl/http'
import { AppServiceProvider } from './providers/AppServiceProvider.js'

const app = new Application()
app.register(AppServiceProvider)

const kernel = app.make(HttpKernel)
await kernel.listen(3000)
console.log('Pearl running on http://localhost:3000')
```

---

## Architecture

Pearl is layered from the ground up:

- **@pearl/core** — foundation. IoC container, Application lifecycle, ServiceProvider base.
- **@pearl/http** — sits on core. Router, middleware pipeline, Request/Response primitives.
- **@pearl/queue** — sits on core. BullMQ job dispatching and worker management.
- **@pearl/validate, @pearl/events, @pearl/mail, @pearl/database, @pearl/auth** — sit on core and http. Each is independently installable.
- **Your App** — registers providers, wires everything together.

---

## Packages

| Package | Description | Version |
|---------|-------------|---------|
| [`@pearl/core`](./packages/core) | IoC container, Application lifecycle, ServiceProvider | `0.1.0` |
| [`@pearl/http`](./packages/http) | Router, middleware pipeline, Request/Response, decorators | `0.1.0` |
| [`@pearl/validate`](./packages/validate) | FormRequest, ValidationPipe, Zod-powered rules | `0.1.0` |
| [`@pearl/events`](./packages/events) | Type-safe event dispatcher, Listener base class | `0.1.0` |
| [`@pearl/queue`](./packages/queue) | BullMQ-powered jobs, workers, and retry handling | `0.1.0` |
| [`@pearl/mail`](./packages/mail) | Mailable classes, SMTP/SES/Log transports | `0.1.0` |
| [`@pearl/database`](./packages/database) | Drizzle ORM integration, Model helpers, Migrator | `0.1.0` |
| [`@pearl/auth`](./packages/auth) | JWT & API token guards, Hash, Authenticate middleware | `0.1.0` |
| [`@pearl/testing`](./packages/testing) | HttpTestClient, MailFake, Factory, DatabaseTestHelper | `0.1.0` |
| [`@pearl/cli`](./packages/cli) | `pearl new`, `pearl make:*`, `pearl serve` | `0.1.0` |

---

## Getting Started

### Requirements

- Node.js 20+

### Create a new app

```bash
npx @pearl/cli new my-app
cd my-app
npm run dev
```

That's it. Pearl auto-detects your package manager (pnpm, yarn, or npm) and scaffolds a full project with all packages, TypeScript config, and a running server.

### What gets created

```
my-app/
├── src/
│   ├── server.ts              ← entry point, ready to run
│   ├── providers/
│   │   └── AppServiceProvider.ts
│   ├── controllers/
│   ├── models/
│   ├── schema/
│   ├── requests/
│   ├── events/
│   ├── listeners/
│   ├── jobs/
│   ├── mail/
│   └── middleware/
├── database/
│   └── migrations/
├── tests/
│   └── example.test.ts
├── .env                       ← copied from .env.example
├── .env.example
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

### Manual setup

```bash
# npm
npm install @pearl/core @pearl/http

# pnpm
pnpm add @pearl/core @pearl/http

# yarn
yarn add @pearl/core @pearl/http
```

```ts
// bootstrap/app.ts
import { Application } from '@pearl/core'
import { HttpKernel } from '@pearl/http'

const app = new Application()
const kernel = new HttpKernel(app)
await kernel.listen(3000)
```

---

## Quick Examples

### Routing

```ts
import { Router } from '@pearl/http'

const router = new Router()

router.get('/users', async (ctx) => {
  ctx.response.json({ users: [] })
})

router.post('/users', async (ctx) => {
  const body = ctx.request.body<{ name: string }>()
  ctx.response.created({ id: 1, ...body })
})
```

### Validation

```ts
import { FormRequest } from '@pearl/validate'
import { z } from 'zod'

export class CreateUserRequest extends FormRequest {
  schema = z.object({
    name:  z.string().min(2),
    email: z.string().email(),
  })

  async authorize() { return true }
}
```

### Authentication

```ts
import { JwtGuard, Hash } from '@pearl/auth'

const guard = new JwtGuard(userProvider, { secret: process.env.JWT_SECRET! })

// Login
const token = await guard.attempt(email, password)

// Protect route
router.get('/me', handler, [Authenticate(authManager)])
```

### Events

```ts
import { Event, Listener, EventDispatcher } from '@pearl/events'

class UserRegistered extends Event {
  constructor(public readonly user: User) { super() }
}

class SendWelcomeEmail extends Listener<UserRegistered> {
  async handle(event: UserRegistered) {
    await mailer.send(new WelcomeEmail(event.user))
  }
}

const dispatcher = new EventDispatcher()
dispatcher.on(UserRegistered, SendWelcomeEmail)
await dispatcher.dispatch(new UserRegistered(user))
```

### Queue

```ts
import { Job } from '@pearl/queue'

class ProcessPayment extends Job {
  readonly queue = 'payments'
  constructor(public readonly orderId: number) { super() }

  async handle() {
    // process payment...
  }
}

await queueManager.dispatch(new ProcessPayment(order.id))
```

### Mail

```ts
import { Mailable } from '@pearl/mail'

class WelcomeEmail extends Mailable {
  constructor(private user: User) { super() }

  build() {
    return this
      .to(this.user.email)
      .subject('Welcome to our app!')
      .html(`<h1>Hi ${this.user.name}!</h1>`)
  }
}

await mailer.send(new WelcomeEmail(user))
```

### Database

```ts
import { pgTable, serial, varchar, Model } from '@pearl/database'

export const users = pgTable('users', {
  id:    serial('id').primaryKey(),
  name:  varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
})

export class User extends Model<typeof users> {
  static table = users
}

const user = await User.find(db, 1)
const all  = await User.all(db)
```

### Testing

```ts
import { HttpTestClient, Factory, MailFake } from '@pearl/testing'

const client = new HttpTestClient(app.handler)

it('creates a user', async () => {
  const res = await client.post('/users', { name: 'Sharvari', email: 'hi@pearl.dev' })
  res.assertCreated().assertJson({ name: 'Sharvari' })
})
```

---

## Monorepo Development

> **Note:** Contributing to Pearl requires pnpm. End users can install published packages with npm, pnpm, or yarn.

```bash
# Install pnpm if you don't have it
npm install -g pnpm

# Install all dependencies
pnpm install

# Build all packages in order
pnpm build

# Build a specific package
pnpm --filter @pearl/http build

# Run tests across all packages
pnpm test

# Watch mode
pnpm dev
```

---

## Contributing

We welcome contributions! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Setup

```bash
git clone https://github.com/skd09/pearl.js.git
cd pearl.js
npm install -g pnpm  # contributors need pnpm for the monorepo
pnpm install
pnpm build
```

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