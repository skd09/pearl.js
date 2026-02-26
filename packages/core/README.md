# @pearl-framework/core

> IoC container, Application lifecycle, and ServiceProvider base for Pearl.js

## Installation

```bash
pnpm add @pearl-framework/core
```

## Overview

`@pearl-framework/core` is the foundation of every Pearl app. It provides:

- **IoC Container** — type-safe dependency injection with singleton and transient bindings
- **Application** — bootstraps your app, registers providers, manages lifecycle
- **ServiceProvider** — base class for organising registrations and boot logic
- **Config** — typed configuration loader

## Usage

### Application bootstrap

```ts
import { Application } from '@pearl-framework/core'

const app = new Application()

app.register(DatabaseServiceProvider)
app.register(HttpServiceProvider)
app.register(AppServiceProvider)

await app.boot()
```

### IoC Container

```ts
// Bind a singleton
app.container.singleton(Mailer, () => new Mailer(config))

// Bind a transient (new instance every time)
app.container.bind(Logger, () => new Logger())

// Resolve
const mailer = app.container.make(Mailer)
```

### ServiceProvider

```ts
import { ServiceProvider } from '@pearl-framework/core'

export class AppServiceProvider extends ServiceProvider {
  register(): void {
    this.container.singleton(Mailer, () => new Mailer({
      driver: 'smtp',
      host: this.config.get('mail.host'),
    }))
  }

  override async boot(): Promise<void> {
    // runs after all providers are registered
  }
}
```

### Config

```ts
import { Config } from '@pearl-framework/core'

const config = new Config({
  app: { name: 'Pearl', debug: false },
  mail: { driver: 'smtp', host: 'smtp.example.com' },
})

config.get('app.name')       // 'Pearl'
config.get('app.debug')      // false
config.get('missing', 'default') // 'default'
```

## API

### `Container`

| Method | Description |
|--------|-------------|
| `singleton(token, factory)` | Register a shared instance |
| `bind(token, factory)` | Register a new instance each time |
| `instance(token, value)` | Register an existing object |
| `make(token)` | Resolve a binding |
| `has(token)` | Check if a binding exists |

### `Application`

| Method | Description |
|--------|-------------|
| `register(Provider)` | Register a service provider |
| `boot()` | Boot all registered providers |
| `make(token)` | Shorthand for `container.make()` |