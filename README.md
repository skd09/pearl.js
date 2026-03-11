<div align="center">

# Pearl.js

**The TypeScript backend framework that does it right.**

Routing · JWT Auth · Drizzle ORM · Validation · Queues · Events · Mail — wired together. One install.

[![npm](https://img.shields.io/npm/v/@pearl-framework/pearl?color=a855f7&labelColor=111118&style=flat-square)](https://www.npmjs.com/package/@pearl-framework/pearl)
[![CI](https://img.shields.io/github/actions/workflow/status/skd09/pearl.js/ci.yml?branch=main&color=4ade80&labelColor=111118&label=CI&style=flat-square)](https://github.com/skd09/pearl.js/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4+-a855f7?labelColor=111118&style=flat-square)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-4ade80?labelColor=111118&style=flat-square)](https://nodejs.org/)
[![License](https://img.shields.io/npm/l/@pearl-framework/pearl?color=94a3b8&labelColor=111118&style=flat-square)](./LICENSE)

[**Documentation**](https://pearljs.dev/docs/getting-started) · [**npm**](https://www.npmjs.com/package/@pearl-framework/pearl) · [**GitHub**](https://github.com/skd09/pearl.js)

</div>

---

## Why Pearl?

Most Node.js projects start the same way: pick a router, find a compatible auth library, wire in an ORM, bolt on a queue, add a mail package, hope they all play nice together. Pearl ships all of that — already integrated, already typed — so you can start building on day one.

```typescript
import 'dotenv/config'
import { Application, Router, HttpKernel } from '@pearl-framework/pearl'
import { Authenticate } from '@pearl-framework/pearl'
import { AppServiceProvider } from './providers/AppServiceProvider.js'

const app = new Application({ root: import.meta.dirname })
app.register(AppServiceProvider)
await app.boot()

const router = new Router()

router.get('/health', (ctx) =>
  ctx.response.json({ status: 'ok' })
)

router.get('/me', (ctx) =>
  ctx.response.json(ctx.user()),
  [Authenticate(app.make(AuthManager))]
)

await new HttpKernel().useRouter(router).listen(3000)
// → Server running on http://localhost:3000
```

---

## Features

| | |
|---|---|
| 🔀 **Routing** | Express-inspired router with typed params, route groups, and middleware chains |
| 🔐 **Auth** | JWT guard with pluggable user providers — register, login, and protect routes in minutes |
| 🗃️ **Database** | Drizzle ORM with a `DatabaseManager` — Postgres, MySQL, and SQLite with auto-migrations |
| ✅ **Validation** | Zod-powered `FormRequest` classes — validate and type your request bodies in one step |
| 📬 **Mail** | `Mailable` classes with SMTP, SES, log, and array transports |
| 📣 **Events** | Typed synchronous event dispatcher — decouple your services cleanly |
| 🏗️ **Queues** | BullMQ-backed job queue — dispatch background jobs with delay, retry, and backoff |
| 💉 **IoC Container** | Lightweight service container — bind, singleton, instance, scope |
| 🧪 **Testing** | HTTP test client, mail fakes, data factories, and transaction-wrapped DB helpers |
| 🛠️ **CLI** | Scaffold projects and generate controllers, middleware, jobs, and more |

---

## Quick Start

**Scaffold a new project in one command:**

```bash
npx @pearl-framework/cli new my-app
cd my-app
npm run dev
```

Your server is live at `http://localhost:3000`. The scaffold includes TypeScript, Drizzle, Zod, Vitest, hot-reload via `tsx`, and a `.env` pre-filled with sensible defaults.

**Manual install:**

```bash
npm install @pearl-framework/pearl drizzle-orm zod dotenv
```

---

## Example: Full Auth Flow

```typescript
// src/controllers/AuthController.ts
import { HttpContext } from '@pearl-framework/pearl'
import { Hash, AuthManager } from '@pearl-framework/pearl'
import { db } from '../providers/AppServiceProvider.js'
import { users } from '../schema/users.js'

export class AuthController {
  constructor(private readonly auth: AuthManager) {}

  async register(ctx: HttpContext) {
    const { name, email, password } = ctx.request.body

    const [user] = await db.insert(users).values({
      name,
      email,
      password: await Hash.make(password),
    }).returning()

    const token = await this.auth.attempt(email, password)
    ctx.response.created({ user, token })
  }

  async login(ctx: HttpContext) {
    const { email, password } = ctx.request.body
    const token = await this.auth.attempt(email, password)
    if (!token) return ctx.response.unauthorized('Invalid credentials')
    ctx.response.json({ token })
  }

  async me(ctx: HttpContext) {
    ctx.response.json(ctx.user())
  }
}
```

---

## Packages

Pearl is a monorepo. Each package can be used independently or via the `@pearl-framework/pearl` meta-package.

| Package | Description |
|---|---|
| [`@pearl-framework/pearl`](./packages/pearl#readme) | Meta-package — installs everything |
| [`@pearl-framework/core`](./packages/core#readme) | Application bootstrap, IoC container, service providers |
| [`@pearl-framework/http`](./packages/http#readme) | Router, HttpKernel, Request, Response |
| [`@pearl-framework/auth`](./packages/auth#readme) | JWT guard, `Authenticate` middleware, password hashing |
| [`@pearl-framework/database`](./packages/database#readme) | Drizzle ORM integration, Model helpers, migrations |
| [`@pearl-framework/validate`](./packages/validate#readme) | `FormRequest`, Zod validation, built-in rules |
| [`@pearl-framework/events`](./packages/events#readme) | Type-safe event dispatcher and listener system |
| [`@pearl-framework/queue`](./packages/queue#readme) | BullMQ job queue, workers, retry and backoff |
| [`@pearl-framework/mail`](./packages/mail#readme) | `Mailable` classes, SMTP / SES / log transports |
| [`@pearl-framework/cli`](./packages/cli#readme) | `pearl` CLI — scaffold apps and generate files |
| [`@pearl-framework/testing`](./packages/testing#readme) | HTTP test client, mail fakes, factories, DB helpers |

---

## CLI Reference

```bash
# New project
npx @pearl-framework/cli new my-app

# Dev server (hot reload)
pearl serve
pearl serve --port 8080

# Generators
pearl make:controller  PostController
pearl make:controller  Post --resource     # index, show, store, update, destroy
pearl make:middleware  RequireAdmin
pearl make:request     CreatePostRequest
pearl make:job         SendWelcomeEmail
pearl make:event       UserRegistered
pearl make:listener    SendWelcomeEmail --event UserRegistered
pearl make:mailable    WelcomeMail
pearl make:model       Post --migration
pearl make:migration   create_posts_table
```

---

## Project Structure

```
my-app/
├── src/
│   ├── server.ts                    ← entry point
│   ├── providers/
│   │   └── AppServiceProvider.ts    ← register your bindings here
│   ├── controllers/
│   ├── schema/                      ← Drizzle table definitions
│   ├── requests/                    ← FormRequest validation classes
│   ├── jobs/
│   ├── events/
│   ├── listeners/
│   ├── mail/
│   └── middleware/
├── database/
│   └── migrations/
├── tests/
├── .env
└── package.json
```

---

## Requirements

- Node.js **v20+**
- TypeScript **v5.4+**
- PostgreSQL, MySQL, or SQLite *(for database features)*
- Redis *(for queue features)*

---

## Contributing

```bash
git clone https://github.com/skd09/pearl.js
cd pearl.js
pnpm install
pnpm build
pnpm test
```

PRs are welcome. For major changes, please open an issue first to discuss what you'd like to change.

---

## Author

Built by [Sharvari Divekar](https://github.com/skd09) · [@thecoderbuddy](https://instagram.com/thecoderbuddy)

## License

[MIT](./LICENSE)