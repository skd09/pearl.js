# @pearl-framework/pearl

> Batteries-included meta-package for Pearl.js — install once, get everything.

[![npm](https://img.shields.io/npm/v/@pearl-framework/pearl?color=a855f7&labelColor=111118&style=flat-square)](https://www.npmjs.com/package/@pearl-framework/pearl)

## Installation

```bash
npm install @pearl-framework/pearl drizzle-orm zod dotenv
```

## Usage

Everything Pearl exports is available from a single import:

```typescript
import {
  // Application
  Application,
  ServiceProvider,

  // HTTP
  Router,
  HttpKernel,
  HttpContext,

  // Auth
  AuthManager,
  JwtGuard,
  Hash,
  Authenticate,

  // Validation
  FormRequest,
  ValidationPipe,
  rules,
  z,

  // Database
  DatabaseManager,
  Model,
  pgTable, serial, varchar, timestamp,
  eq, and, or, desc, asc, sql,

  // Events
  Event,
  Listener,
  EventDispatcher,

  // Queues
  Job,
  QueueManager,

  // Mail
  Mailable,
  Mailer,
  LogTransport,
} from '@pearl-framework/pearl'
```

## Minimal example

```typescript
import 'dotenv/config'
import { Application, Router, HttpKernel } from '@pearl-framework/pearl'
import { AppServiceProvider } from './providers/AppServiceProvider.js'

const app = new Application({ root: import.meta.dirname })
app.register(AppServiceProvider)
await app.boot()

const router = new Router()
router.get('/', (ctx) => ctx.response.json({ message: 'Hello from Pearl 🦪' }))

await new HttpKernel().useRouter(router).listen(3000)
```

Or scaffold a full project:

```bash
npx @pearl-framework/cli new my-app
cd my-app
npm run dev
```

## What's included

| Export | Source |
|---|---|
| `Application`, `ServiceProvider`, `Container`, `Config`, `env` | `@pearl-framework/core` |
| `Router`, `HttpKernel`, `HttpContext`, `Request`, `Response`, `Pipeline` | `@pearl-framework/http` |
| `FormRequest`, `ValidationPipe`, `validate`, `validateSync`, `rules`, `z` | `@pearl-framework/validate` |
| `AuthManager`, `JwtGuard`, `ApiTokenGuard`, `Hash`, `Authenticate`, `OptionalAuth` | `@pearl-framework/auth` |
| `Event`, `Listener`, `EventDispatcher` | `@pearl-framework/events` |
| `Job`, `QueueManager`, `QueueWorker` | `@pearl-framework/queue` |
| `Mailable`, `Mailer`, `SmtpTransport`, `SesTransport`, `LogTransport`, `ArrayTransport` | `@pearl-framework/mail` |
| `DatabaseManager`, `Model`, `Migrator`, `pgTable`, `eq`, `and`, `sql`, `desc`, ... | `@pearl-framework/database` |

## Using packages individually

If you only need specific features, install the packages directly:

```bash
npm install @pearl-framework/core @pearl-framework/http
```

See the [Pearl.js monorepo](https://github.com/skd09/pearl.js) for each package's documentation.