<div align="center">

# Pearl.js

**A TypeScript framework for Node.js backends.**

Routing, auth, validation, background jobs, mail, and events — already integrated. One install, one boot, write endpoints.

[![npm](https://img.shields.io/npm/v/@pearl-framework/pearl?color=a855f7&labelColor=111118&style=flat-square)](https://www.npmjs.com/package/@pearl-framework/pearl)
[![CI](https://img.shields.io/github/actions/workflow/status/skd09/pearl.js/ci.yml?branch=main&color=4ade80&labelColor=111118&label=CI&style=flat-square)](https://github.com/skd09/pearl.js/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4+-a855f7?labelColor=111118&style=flat-square)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-4ade80?labelColor=111118&style=flat-square)](https://nodejs.org/)
[![License](https://img.shields.io/npm/l/@pearl-framework/pearl?color=94a3b8&labelColor=111118&style=flat-square)](./LICENSE)

[**Documentation**](https://pearljs.dev/docs/getting-started) · [**npm**](https://www.npmjs.com/package/@pearl-framework/pearl) · [**GitHub**](https://github.com/skd09/pearl.js)

</div>

---

## What you get

Most Node.js APIs ship the same week-one plumbing: pick a router, find a compatible auth library, wire in an ORM, bolt on a queue, add a mail package, write the validation layer, decide where everything goes. Pearl.js gives you all of that — already integrated, fully typed, with a single install. Your first endpoint is minutes away, not a week into picking libraries.

```typescript
// src/server.ts
import { Application, Router, HttpKernel } from '@pearl-framework/pearl'
import { Authenticate, AuthManager } from '@pearl-framework/pearl'
import { AppServiceProvider } from './providers/AppServiceProvider.js'

const app = new Application({ root: import.meta.dirname })
app.register(AppServiceProvider)
await app.boot()                              // loads .env + boots all providers

const auth   = app.container.make(AuthManager)
const router = new Router()

router.get('/health', (ctx) => ctx.response.json({ status: 'ok' }))

router.get('/me',
  (ctx) => ctx.response.json(ctx.get('auth.user')),
  [Authenticate(auth)],                       // auth-protected in one line
)

await new HttpKernel().useRouter(router).listen(3000)
```

---

## Why developers pick Pearl.js

**Ship faster.** `npx pearl new my-api` scaffolds a complete project with auth routes, validation, queue worker, mail transports, and migration setup already wired. First endpoint in minutes — not after picking a router, comparing auth libraries, and gluing them together.

**Typed end-to-end.** Routes, params, query, validated `FormRequest` input, the authenticated user, job payloads, dispatched events — all inferred from your code. Rename a column and the compiler points at every call site.

**Conventions, not decisions.** Controllers, requests, jobs, listeners, mailables, migrations each have a home, and the CLI generates the boilerplate. No bikeshedding over folder structure, no architectural questions before you write the first route.

**Production-ready, not POC.** Rate limiting, retry with backoff, dead-letter handling, structured `422`/`403` errors, algorithm-pinned JWT, prototype-pollution-safe job payloads, bounded-concurrency bulk mail. The stuff you would normally add after the first outage — already in.

---

## What's included

| Capability | What you get |
|---|---|
| **Routing** | Express-inspired router with typed params, route groups, and middleware chains |
| **Authentication** | `JwtGuard`, `SessionGuard`, and `ApiTokenGuard` with pluggable user providers — protect routes in two lines |
| **Rate limiting** | Built-in `RateLimit` middleware with a pluggable store (memory default, swap in Redis for multi-process) |
| **Database** | Drizzle ORM via `DrizzleAdapter` — Postgres, MySQL, and SQLite with auto-migrations |
| **Validation** | Zod-powered `FormRequest` classes that throw typed `ValidationException` / `AuthorizationException` |
| **Mail** | `Mailable` classes with SMTP, SES, log, and array transports — plus bounded-concurrency `sendBulk` |
| **Events** | Typed event dispatcher with an `onError` hook for APM integration |
| **Queues** | BullMQ-backed job queue with delay, retry, and backoff. Standalone `retryWith` + backoff helpers for one-off async ops |
| **IoC Container** | Lightweight service container — bind, singleton, instance, scope. Frozen after boot |
| **Testing** | HTTP test client, mail fakes, data factories, and transaction-wrapped DB helpers |
| **CLI** | Scaffold projects and generate controllers, middleware, jobs, mailables, and more |

---

## Quick start

```bash
npx @pearl-framework/cli new my-app
cd my-app
npm run dev
```

Your server is live at `http://localhost:3000`. The scaffold ships TypeScript, Drizzle, Zod, Vitest, hot-reload via `tsx watch`, and a `.env` pre-filled with sensible defaults.

**Or install into an existing project:**

```bash
npm install @pearl-framework/pearl drizzle-orm zod
```

---

## A full auth flow

```typescript
// src/controllers/AuthController.ts
import type { HttpContext } from '@pearl-framework/pearl'
import { Hash, AuthManager } from '@pearl-framework/pearl'
import { DrizzleAdapter } from '@pearl-framework/database'
import { users } from '../schema/users.js'

export class AuthController {
  constructor(
    private readonly auth: AuthManager,
    private readonly db: DrizzleAdapter,
  ) {}

  async register(ctx: HttpContext) {
    const { name, email, password } = ctx.request.body as {
      name: string; email: string; password: string
    }

    await this.db.connection().insert(users).values({
      name,
      email,
      password: await Hash.make(password),
    })

    const token = await this.auth.attempt(email, password)
    ctx.response.created({ token })
  }

  async login(ctx: HttpContext) {
    const { email, password } = ctx.request.body as {
      email: string; password: string
    }
    const token = await this.auth.attempt(email, password)
    if (!token) return ctx.response.unauthorized('Invalid credentials')
    ctx.response.json({ token })
  }

  async me(ctx: HttpContext) {
    ctx.response.json(ctx.get('auth.user'))
  }
}
```

---

## Packages

Pearl.js is a monorepo. Each package is independently installable, or pull the whole stack via the `@pearl-framework/pearl` meta-package.

| Package | Description |
|---|---|
| [`@pearl-framework/pearl`](./packages/pearl#readme) | Meta-package — re-exports every public API |
| [`@pearl-framework/core`](./packages/core#readme) | Application bootstrap, IoC container, service providers, config, env |
| [`@pearl-framework/http`](./packages/http#readme) | Router, kernel, request/response, middleware pipeline, rate limiting |
| [`@pearl-framework/auth`](./packages/auth#readme) | JWT, session, and API token guards plus `Authenticate` middleware and bcrypt hashing |
| [`@pearl-framework/database`](./packages/database#readme) | ORM-agnostic adapter pattern with Drizzle as the default |
| [`@pearl-framework/validate`](./packages/validate#readme) | `FormRequest`, Zod-backed validation, typed validation/authorization exceptions |
| [`@pearl-framework/events`](./packages/events#readme) | Type-safe event dispatcher and listener system |
| [`@pearl-framework/queue`](./packages/queue#readme) | BullMQ queue, workers, retry/backoff utilities |
| [`@pearl-framework/mail`](./packages/mail#readme) | `Mailable` classes, SMTP / SES / log / array transports, bulk send |
| [`@pearl-framework/cli`](./packages/cli#readme) | `pearl` CLI — scaffold apps, generate files, run migrations |
| [`@pearl-framework/testing`](./packages/testing#readme) | HTTP test client, mail fakes, factories, DB helpers |

---

## CLI reference

```bash
# New project
npx @pearl-framework/cli new my-app

# Dev server (hot reload)
npm run dev

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

## Project structure

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
├── .env                              ← auto-created, auto-loaded by Application.boot()
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

PRs welcome. For larger changes, open an issue first so we can scope the direction. Releases run through Changesets — add a `.changeset/*.md` to your PR describing the user-facing change.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full workflow.

---

## Author

Built by [Sharvari Divekar](https://github.com/skd09) · [sharvari.dev](https://sharvari.dev)

## License

[MIT](./LICENSE)
