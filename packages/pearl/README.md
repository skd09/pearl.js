# @pearl-framework/pearl

> The meta-package: install once, get the whole Pearl.js framework.

[![npm](https://img.shields.io/npm/v/@pearl-framework/pearl?color=a855f7&labelColor=111118&style=flat-square)](https://www.npmjs.com/package/@pearl-framework/pearl)

`@pearl-framework/pearl` re-exports every public API from the per-package entry points. One install brings in routing, auth, validation, background jobs, mail, events, rate limiting, an IoC container, and the Drizzle ORM integration — all linked at the same version.

## Installation

```bash
npm install @pearl-framework/pearl drizzle-orm zod
```

`drizzle-orm` and `zod` are peer deps you bring along. `dotenv` is no longer needed — `Application.boot()` calls Pearl's own `loadDotenv` automatically.

## Quick start

Scaffold a project:

```bash
npx @pearl-framework/cli new my-app
cd my-app
npm run dev
```

Or write a minimal server yourself:

```typescript
import {
  Application,
  Router,
  HttpKernel,
  AuthManager,
  Authenticate,
} from '@pearl-framework/pearl'
import { AppServiceProvider } from './providers/AppServiceProvider.js'

const app = new Application({ root: import.meta.dirname })
app.register(AppServiceProvider)
await app.boot()                            // loads .env + boots all providers

const auth   = app.container.make(AuthManager)
const router = new Router()

router.get('/health', (ctx) => ctx.response.ok({ status: 'ok' }))
router.get('/me',     (ctx) => ctx.response.ok(ctx.get('auth.user')),
  [Authenticate(auth)],
)

await new HttpKernel().useRouter(router).listen(3000)
```

## What's re-exported

Everything below is available from a single `import { … } from '@pearl-framework/pearl'`.

| From | Exports |
|---|---|
| **core** | `Application`, `Container`, `ServiceProvider`, `Config`, `env`, `loadDotenv`, `parseDotenv`, `PearlError`, `BindingNotFoundError`, `CircularDependencyError`, `ContainerFrozenError`, `ProviderBootError` |
| **http** | `HttpKernel`, `Router`, `HttpContext`, `Request`, `Response`, `Pipeline`, `RateLimit`, `MemoryRateLimitStore` |
| **auth** | `AuthManager`, `JwtGuard`, `SessionGuard`, `ApiTokenGuard`, `Hash`, `Authenticate`, `OptionalAuth`, `AuthServiceProvider` |
| **validate** | `FormRequest`, `ValidationException`, `AuthorizationException`, `ValidationPipe`, `validate`, `validateSync`, `rules`, `z` |
| **events** | `Event`, `Listener`, `EventDispatcher` (with `onError` hook), `EventServiceProvider` |
| **queue** | `Job`, `QueueManager`, `QueueWorker`, `QueueServiceProvider`, `retryWith`, `fixedBackoff`, `linearBackoff`, `exponentialBackoff` |
| **mail** | `Mailable`, `Mailer` (with bounded-concurrency `sendBulk`), `SmtpTransport`, `SesTransport`, `LogTransport`, `ArrayTransport`, `MailServiceProvider` |
| **database** | `DatabaseManager`, `Model`, `Migrator`, `DatabaseServiceProvider`, Drizzle column helpers (`pgTable`, `serial`, `text`, `integer`, `timestamp`, `jsonb`, `uuid`, `index`, `uniqueIndex`, …), Drizzle operators (`eq`, `ne`, `gt`/`lt`/`gte`/`lte`, `and`, `or`, `not`, `isNull`, `inArray`, `like`, `ilike`, `sql`, `count`, `asc`, `desc`) |

All types (`RateLimitOptions`, `SessionStore`, `RetryOptions`, `BackoffStrategy`, `SendBulkOptions`, `EventErrorHandler`, `UnknownJobHandler`, etc.) are exported alongside the values.

## Installing individual packages

Only need part of the stack? Install just the packages you use — every Pearl.js package is independently installable and stays at the same version line:

```bash
npm install @pearl-framework/core @pearl-framework/http
```

The meta package is just a thin re-export layer; per-package installs are byte-for-byte the same code.

## Related

Per-package READMEs cover each subsystem in detail:

| Package | What it does |
|---|---|
| [`@pearl-framework/core`](https://www.npmjs.com/package/@pearl-framework/core) | Application bootstrap, IoC container, providers, config, env |
| [`@pearl-framework/http`](https://www.npmjs.com/package/@pearl-framework/http) | Router, kernel, request/response, middleware, rate limiting |
| [`@pearl-framework/auth`](https://www.npmjs.com/package/@pearl-framework/auth) | JWT / session / API-token guards, password hashing |
| [`@pearl-framework/validate`](https://www.npmjs.com/package/@pearl-framework/validate) | Zod-backed FormRequest, typed validation/authorization exceptions |
| [`@pearl-framework/events`](https://www.npmjs.com/package/@pearl-framework/events) | Type-safe event dispatcher, listeners, error hook |
| [`@pearl-framework/queue`](https://www.npmjs.com/package/@pearl-framework/queue) | BullMQ queue, workers, retry/backoff utilities |
| [`@pearl-framework/mail`](https://www.npmjs.com/package/@pearl-framework/mail) | Mailable classes, SMTP/SES/Log/Array transports, bulk send |
| [`@pearl-framework/database`](https://www.npmjs.com/package/@pearl-framework/database) | Drizzle-first adapter pattern, migrations, models |
| [`@pearl-framework/cli`](https://www.npmjs.com/package/@pearl-framework/cli) | `pearl new`, `pearl make:*` generators |
| [`@pearl-framework/testing`](https://www.npmjs.com/package/@pearl-framework/testing) | HTTP test client, mail fakes, factories, DB helpers |

## License

MIT
