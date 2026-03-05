<div align="center">

<!-- <img src="https://pearljs.dev/logo.svg" width="64" height="64" alt="Pearl.js" /> -->

# Pearl.js

**The TypeScript backend framework that does it right.**

Routing · JWT Auth · Drizzle ORM · Validation · Queues · Events · Mail — all wired together. One install.

[![npm version](https://img.shields.io/npm/v/@pearl-framework/pearl?color=60a5fa&labelColor=111118&style=flat-square)](https://www.npmjs.com/package/@pearl-framework/pearl)
[![license](https://img.shields.io/npm/l/@pearl-framework/pearl?color=4ade80&labelColor=111118&style=flat-square)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4%2B-60a5fa?labelColor=111118&style=flat-square)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-4ade80?labelColor=111118&style=flat-square)](https://nodejs.org/)

[Docs](https://pearljs.dev/docs/getting-started) · [npm](https://www.npmjs.com/package/@pearl-framework/pearl) · [GitHub](https://github.com/skd09/pearl.js)

</div>

---

## What is Pearl?

Pearl is a batteries-included Node.js framework built on TypeScript-first principles. Stop hunting for compatible libraries and wiring them together — Pearl ships everything you need for a production API out of the box.

```typescript
import { Application, HttpKernel, Router } from '@pearl-framework/pearl'
import { AuthManager, Authenticate } from '@pearl-framework/pearl'
import { AppServiceProvider } from './providers/AppServiceProvider.js'

const app = new Application({ root: import.meta.dirname })
app.register(AppServiceProvider)
await app.boot()  // loads .env + boots all providers

const auth   = app.container.make(AuthManager)
const router = new Router()

router.get('/health', ctx => ctx.json({ status: 'ok' }))

router.get('/me', ctx => ctx.json(ctx.user()),
  [Authenticate(auth)]
)

await new HttpKernel().useRouter(router).listen(3000)
```

## Features

| | |
|---|---|
| 🔀 **Routing** | Express-inspired router with typed params, middleware chains, and response helpers |
| 🔐 **Authentication** | JWT guard with pluggable user providers — register, login, protect routes in minutes |
| 🗃️ **Database** | Drizzle ORM wrapped in a `DatabaseManager` — Postgres, MySQL, SQLite |
| ✅ **Validation** | Zod-powered `FormRequest` classes — validate and type your request bodies cleanly |
| 📬 **Mail** | `Mailable` classes with SMTP and log transports |
| 📣 **Events** | Typed, synchronous event dispatcher — decouple your services |
| 🏗️ **Queues** | BullMQ-backed job queue — dispatch background jobs with delay and retry |
| 💉 **IoC Container** | Lightweight service container — bind, singleton, make |
| 🛠️ **CLI** | Scaffold projects and generate controllers, middleware, jobs, and more |

## Quick Start

```bash
npx @pearl-framework/cli new my-app
cd my-app
npm run dev
```

Your server is running at `http://localhost:3000`.

### Manual install

```bash
npm install @pearl-framework/pearl drizzle-orm zod dotenv
```

## Requirements

- **Node.js** v18 or higher
- **TypeScript** v5.4 or higher
- **PostgreSQL**, MySQL, or SQLite *(database features)*
- **Redis** *(queue features)*

## Project Structure

```
my-app/
├── config/
├── database/
│   └── migrations/
├── src/
│   ├── controllers/
│   ├── events/
│   ├── jobs/
│   ├── listeners/
│   ├── mail/
│   ├── middleware/
│   ├── models/
│   ├── providers/
│   │   └── AppServiceProvider.ts
│   ├── requests/
│   └── main.ts          ← entry point
├── .env
└── package.json
```

## Packages

Pearl is published as a monorepo. Each package can be used independently or via the meta-package.

| Package | Description |
|---|---|
| `@pearl-framework/pearl` | Meta-package — installs everything |
| `@pearl-framework/core` | Application, IoC container, service providers |
| `@pearl-framework/http` | Router, HttpKernel, HttpContext |
| `@pearl-framework/auth` | JWT guard, Authenticate middleware, Hash |
| `@pearl-framework/database` | DatabaseManager, Drizzle ORM integration |
| `@pearl-framework/validate` | FormRequest, Zod schema validation |
| `@pearl-framework/events` | EventDispatcher, typed events and listeners |
| `@pearl-framework/queue` | QueueManager, BullMQ job dispatch |
| `@pearl-framework/mail` | Mailer, Mailable, SMTP/Log transports |
| `@pearl-framework/cli` | `pearl` CLI — new, serve, make:* generators |

## CLI

```bash
# Scaffold a new project
npx @pearl-framework/cli new my-app

# Start the dev server
pearl serve

# Generators
pearl make:controller  PostController
pearl make:middleware  RequireAdmin
pearl make:request     CreatePostRequest
pearl make:job         SendWelcomeEmail
pearl make:event       UserRegistered
pearl make:listener    SendWelcomeListener
pearl make:mailable    WelcomeMail
pearl make:migration   create_posts_table
```

## Example — full auth flow

```typescript
// src/controllers/AuthController.ts
import { HttpContext } from '@pearl-framework/pearl'
import { AuthManager } from '@pearl-framework/pearl'
import { Hash } from '@pearl-framework/pearl'
import { db } from '../providers/AppServiceProvider.js'
import { users } from '../models/schema.js'
import { eq } from 'drizzle-orm'

export class AuthController {
  constructor(private auth: AuthManager) {}

  async register(ctx: HttpContext) {
    const { name, email, password } = await ctx.request.json()
    const [user] = await db.insert(users).values({
      name, email, password: await Hash.make(password),
    }).returning()
    const token = await this.auth.attempt(email, password)
    ctx.json({ user, token })
  }

  async login(ctx: HttpContext) {
    const { email, password } = await ctx.request.json()
    const token = await this.auth.attempt(email, password)
    if (!token) return ctx.status(401).json({ message: 'Invalid credentials' })
    ctx.json({ token })
  }

  async me(ctx: HttpContext) {
    ctx.json(ctx.user())
  }
}
```

## Contributing

Pull requests are welcome. For major changes please open an issue first.

```bash
git clone https://github.com/skd09/pearl.js
cd pearl.js
npm install
npm run build
```

## Author

Built by [Sharvari Divekar](https://github.com/skd09) · [sharvari.dev](https://sharvari.dev)

## License

MIT