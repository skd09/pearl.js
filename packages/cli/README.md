# @pearl/cli

The official CLI for the [Pearl.js](https://github.com/skd09/pearl.js) TypeScript framework.

## Installation

```bash
npm install -g @pearl/cli
```

Or use directly with npx — no install needed:

```bash
npx @pearl/cli new my-app
```

## Commands

### Application

| Command | Description |
|---------|-------------|
| `pearl new <name>` | Scaffold a new Pearl.js application |
| `pearl serve` | Start the dev server with hot reload |
| `pearl list` | List all available commands |

### Generators

All `make:*` commands support `--force` to overwrite existing files.

| Command | Output |
|---------|--------|
| `pearl make:controller <n>` | `src/controllers/<Name>Controller.ts` |
| `pearl make:model <n>` | `src/models/<Name>.ts` |
| `pearl make:migration <n>` | `database/migrations/<timestamp>_<name>.ts` |
| `pearl make:middleware <n>` | `src/middleware/<Name>Middleware.ts` |
| `pearl make:job <n>` | `src/jobs/<Name>Job.ts` |
| `pearl make:mail <n>` | `src/mail/<Name>Mail.ts` |
| `pearl make:event <n>` | `src/events/<Name>Event.ts` |
| `pearl make:listener <n>` | `src/listeners/<Name>Listener.ts` |
| `pearl make:request <n>` | `src/requests/<Name>Request.ts` |
| `pearl make:resource <n>` | `src/resources/<Name>Resource.ts` |

## Examples

```bash
# Create a new app (auto-detects pnpm/yarn/npm)
pearl new blog-api

# Create with a specific package manager
pearl new blog-api --npm
pearl new blog-api --pnpm
pearl new blog-api --yarn

# Skip dependency install
pearl new blog-api --no-install

# Generate a resourceful controller
pearl make:controller Post --resource

# Generate a model with its migration
pearl make:model Post --migration

# Generate a listener tied to an event
pearl make:listener SendWelcomeEmail --event UserRegistered

# Start dev server on a custom port
pearl serve --port 8080
```

## Project Structure

After running `pearl new my-app`:

```
my-app/
├── src/
│   ├── server.ts              ← entry point, runs immediately
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
├── .env                       ← ready to configure
├── .env.example
├── package.json               ← all @pearl/* packages included
├── tsconfig.json
└── vitest.config.ts
```

## What's included

Every new Pearl app comes pre-configured with:

- All `@pearl/*` packages as dependencies
- TypeScript with ESM + `Bundler` module resolution
- `tsx` for fast dev server with hot reload (`pnpm dev`)
- `vitest` for testing (`pnpm test`)
- `.env` with sensible defaults for Postgres, Redis, JWT, and mail