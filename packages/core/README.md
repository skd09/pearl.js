# @pearl-framework/core

> Application bootstrap, IoC container, service providers, config, and the typed error hierarchy for Pearl.js.

[![npm](https://img.shields.io/npm/v/@pearl-framework/core?color=a855f7&labelColor=111118&style=flat-square)](https://www.npmjs.com/package/@pearl-framework/core)

The foundation every other Pearl.js package builds on. Provides the `Application` class that boots the whole framework, a Map-backed IoC `Container`, the `ServiceProvider` base class that feature packages extend, config + env helpers, and the typed `PearlError` hierarchy.

## Installation

```bash
npm install @pearl-framework/core
```

Most apps install [`@pearl-framework/pearl`](https://www.npmjs.com/package/@pearl-framework/pearl) instead, which re-exports everything from `core`.

## What's in the box

| Export | Purpose |
|---|---|
| `Application` | Bootstrap: register providers, load config + env, freeze the container |
| `Container` | Map-backed IoC — `bind`, `singleton`, `instance`, `make`, `createScope` |
| `ServiceProvider` | Base class every feature package's `XxxServiceProvider` extends |
| `Config` | Dot-notation access to files in your app's `config/` directory |
| `env` / `env.bool` / `env.number` / `env.optional` | Typed environment variable access |
| `loadDotenv`, `parseDotenv` | Robust `.env` parsing — handles quotes, escapes, multi-line values, `export` prefix |
| `PearlError`, `BindingNotFoundError`, `CircularDependencyError`, `ContainerFrozenError`, `ProviderBootError` | Typed error hierarchy — all framework errors extend `PearlError` |

## Application lifecycle

`Application.boot()` walks every registered `ServiceProvider` twice:

1. **`register()`** — bind tokens into the container. No resolution allowed yet.
2. **`boot()`** — resolve services and start them. Other providers' bindings are available.

After both passes complete, the container is **frozen**. Any further `bind()` / `singleton()` / `instance()` call throws `ContainerFrozenError`. Tests that need late binding call `container.createScope()` for a child container that can still be mutated.

```typescript
import { Application } from '@pearl-framework/core'
import { AppServiceProvider } from './providers/AppServiceProvider.js'

const app = new Application({ root: import.meta.dirname })

app.register(AppServiceProvider)   // can register many — order matters
await app.boot()                    // throws ProviderBootError if any provider fails

// Container is now frozen. Resolve services:
const router = app.container.make(Router)
```

## Writing a service provider

Every feature is wired up via a provider. Bind tokens in `register`, resolve and use them in `boot`.

```typescript
import { ServiceProvider } from '@pearl-framework/core'
import { Router, HttpKernel } from '@pearl-framework/http'

export class AppServiceProvider extends ServiceProvider {
  register(): void {
    // Bind tokens here. Don't resolve other services yet.
    this.container.singleton(Router, () => new Router())
  }

  override async boot(): Promise<void> {
    // Resolve and wire services. Every other provider has already registered.
    const router = this.container.make(Router)
    router.get('/health', (ctx) => ctx.response.ok({ status: 'ok' }))
  }
}
```

## The IoC container

```typescript
const c = app.container

c.bind('logger', () => new Logger())                  // factory called every make()
c.singleton('db',     () => new Database())           // factory called once, result cached
c.instance('config',  appConfig)                       // pre-built instance

const logger = c.make('logger')

// Detects cycles — throws CircularDependencyError with the chain in the message
c.singleton('A', () => c.make('B'))
c.singleton('B', () => c.make('A'))
c.make('A')                  // CircularDependencyError: A → B → A
```

For tests that need to override a binding after the app boots, use a child scope:

```typescript
const scope = app.container.createScope()
scope.instance('mailer', new MailFake())
const sut = scope.make(SignupService)
```

## Config + env

```typescript
import { Config, env } from '@pearl-framework/core'

// Config files in <root>/config/*.{ts,js} are loaded at boot.
// Access via dot notation:
const dbHost  = app.config.get('database.connections.postgres.host')
const appName = app.config.get('app.name', 'Pearl App')   // with default

// Typed env helpers — throw if missing and no default given:
const secret  = env('JWT_SECRET')                  // string, required
const port    = env.number('PORT', 3000)           // number, default 3000
const debug   = env.bool('DEBUG', false)            // boolean
const sentry  = env.optional('SENTRY_DSN')          // string | undefined
```

## .env parsing

`Application.boot()` loads `<root>/.env` automatically via `loadDotenv`. The parser handles real-world cases that simpler dotenv libraries get wrong:

- Double quotes with `\n`, `\r`, `\t`, `\\`, `\"` escapes
- Single quotes treated as literal (no escape processing)
- Multi-line values inside matching quotes
- `export KEY=value` prefix (ignored)
- Equals signs inside values (only the first `=` is the separator)
- Trailing comments on unquoted values
- Real env always takes precedence over `.env` file values

If you need to parse `.env` content yourself without touching `process.env`, use `parseDotenv` directly:

```typescript
import { parseDotenv } from '@pearl-framework/core'
const env = parseDotenv(readFileSync('.env.test', 'utf-8'))
```

## Typed errors

Every framework error extends `PearlError`, which adds a `code` field for branch-on-code error handling:

```typescript
import { PearlError, BindingNotFoundError } from '@pearl-framework/core'

try {
  app.container.make('not-bound')
} catch (err) {
  if (err instanceof BindingNotFoundError) { /* … */ }
  if (err instanceof PearlError && err.code === 'BINDING_NOT_FOUND') { /* … */ }
}
```

| Class | `code` | Thrown when |
|---|---|---|
| `BindingNotFoundError` | `BINDING_NOT_FOUND` | `container.make(token)` for an unregistered token |
| `CircularDependencyError` | `CIRCULAR_DEPENDENCY` | Resolution graph has a cycle |
| `ContainerFrozenError` | `CONTAINER_FROZEN` | `bind`/`singleton`/`instance` called after `boot()` |
| `ProviderBootError` | `PROVIDER_BOOT_ERROR` | Any provider's `register` or `boot` throws |

## Related

- [`@pearl-framework/pearl`](https://www.npmjs.com/package/@pearl-framework/pearl) — meta-package, re-exports everything from `core` and all feature packages.
- [`@pearl-framework/http`](https://www.npmjs.com/package/@pearl-framework/http), [`@pearl-framework/auth`](https://www.npmjs.com/package/@pearl-framework/auth), [`@pearl-framework/database`](https://www.npmjs.com/package/@pearl-framework/database), [`@pearl-framework/queue`](https://www.npmjs.com/package/@pearl-framework/queue), [`@pearl-framework/mail`](https://www.npmjs.com/package/@pearl-framework/mail), [`@pearl-framework/events`](https://www.npmjs.com/package/@pearl-framework/events), [`@pearl-framework/validate`](https://www.npmjs.com/package/@pearl-framework/validate) — feature packages that register against `core`'s container.

## License

MIT
