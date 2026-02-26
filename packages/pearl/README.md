# @pearl-framework/pearl

> The Pearl.js framework — batteries included.

Install one package and get the entire framework.

## Installation

```bash
npm install @pearl-framework/pearl
```

```bash
pnpm add @pearl-framework/pearl
```

## Usage

Everything is available from a single import:

```ts
import {
  Application,
  Router,
  HttpKernel,
  FormRequest,
  AuthManager,
  JwtGuard,
  Hash,
  Authenticate,
  Event,
  Listener,
  EventDispatcher,
  Job,
  QueueManager,
  Mailable,
  Mailer,
  DatabaseManager,
  Model,
  pgTable,
  serial,
  varchar,
  timestamp,
  eq,
} from '@pearl-framework/pearl'
```

## What's included

| Export | From |
|--------|------|
| `Application`, `ServiceProvider`, `Container` | `@pearl-framework/core` |
| `Router`, `HttpKernel`, `HttpContext`, `Request`, `Response` | `@pearl-framework/http` |
| `FormRequest`, `ValidationException` | `@pearl-framework/validate` |
| `AuthManager`, `JwtGuard`, `ApiTokenGuard`, `Hash`, `Authenticate` | `@pearl-framework/auth` |
| `Event`, `Listener`, `EventDispatcher` | `@pearl-framework/events` |
| `Job`, `QueueManager`, `QueueWorker` | `@pearl-framework/queue` |
| `Mailable`, `Mailer` | `@pearl-framework/mail` |
| `DatabaseManager`, `Model`, `pgTable`, `eq`, ... | `@pearl-framework/database` |

## Quick start

```ts
import { Router, HttpKernel } from '@pearl-framework/pearl'

const router = new Router()

router.get('/', (ctx) => {
  ctx.response.json({ message: 'Welcome to Pearl 🦪' })
})

const kernel = new HttpKernel()
kernel.useRouter(router)
await kernel.listen(3000)
```

Or scaffold a full project:

```bash
npx @pearl-framework/cli new my-app
cd my-app
npm run dev
```

## Individual packages

You can also install packages individually if you only need specific features:

```bash
npm install @pearl-framework/core @pearl-framework/http
```

See the [monorepo](https://github.com/skd09/pearl.js) for individual package docs.