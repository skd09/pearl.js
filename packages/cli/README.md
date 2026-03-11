# @pearl-framework/cli

> Scaffold and generate Pearl.js projects from the command line.

[![npm](https://img.shields.io/npm/v/@pearl-framework/cli?color=a855f7&labelColor=111118&style=flat-square)](https://www.npmjs.com/package/@pearl-framework/cli)

## Installation

```bash
npm install -g @pearl-framework/cli
```

Or use directly without installing:

```bash
npx @pearl-framework/cli new my-app
```

---

## `pearl new` — Scaffold a Project

Creates a new Pearl.js project with all packages, TypeScript, Vitest, and hot-reload configured:

```bash
pearl new my-app
```

Options:

| Flag | Description |
|---|---|
| `--pnpm` | Use pnpm |
| `--yarn` | Use yarn |
| `--npm` | Use npm |
| `--no-install` | Skip dependency install |

```bash
pearl new my-app --pnpm
pearl new my-app --no-install
```

**What gets created:**

```
my-app/
├── src/
│   ├── server.ts                    ← entry point
│   ├── providers/
│   │   └── AppServiceProvider.ts
│   ├── controllers/
│   ├── schema/                      ← Drizzle table definitions
│   ├── requests/
│   ├── jobs/
│   ├── events/
│   ├── listeners/
│   ├── mail/
│   └── middleware/
├── database/
│   └── migrations/
├── tests/
│   └── example.test.ts
├── .env                             ← pre-filled with sensible defaults
├── .env.example
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

After scaffolding, start the dev server:

```bash
cd my-app
npm run dev
# → Server running on http://localhost:3000
```

---

## `pearl serve` — Dev Server

Start the development server with hot reload powered by `tsx watch`:

```bash
pearl serve
pearl serve --port 8080
pearl serve --host 0.0.0.0
```

The command looks for `src/server.ts` first, then falls back to `src/main.ts`.

---

## Generators

All generators create files in the conventional location. Use `--force` to overwrite an existing file.

### Controllers

```bash
pearl make:controller Post               # src/controllers/PostController.ts
pearl make:controller Post --resource    # with index, show, store, update, destroy methods
```

### Models & Migrations

```bash
pearl make:model Post                    # src/models/Post.ts
pearl make:model Post --migration        # model + database/migrations/<timestamp>_create_posts.ts
pearl make:migration create_posts_table  # migration only
```

### Middleware

```bash
pearl make:middleware RequireAdmin       # src/middleware/RequireAdminMiddleware.ts
```

### Validation

```bash
pearl make:request CreatePostRequest    # src/requests/CreatePostRequest.ts
```

### Jobs

```bash
pearl make:job SendWelcomeEmail         # src/jobs/SendWelcomeEmailJob.ts
```

### Events & Listeners

```bash
pearl make:event UserRegistered                              # src/events/UserRegisteredEvent.ts
pearl make:listener SendWelcomeEmail                        # src/listeners/SendWelcomeEmailListener.ts
pearl make:listener SendWelcomeEmail --event UserRegistered # pre-wired to the event
```

### Mail

```bash
pearl make:mailable WelcomeMail         # src/mail/WelcomeMail.ts
```

### Resources

```bash
pearl make:resource UserResource        # src/resources/UserResource.ts
```

---

## What's included in every project

| Feature | Details |
|---|---|
| **All `@pearl-framework/*` packages** | Pre-installed and ready to use |
| **TypeScript** | ESM + `Bundler` module resolution, `strict: true` |
| **Hot reload** | `tsx watch` via `npm run dev` |
| **Testing** | `vitest` with an example test |
| **Environment** | `.env` pre-filled for Postgres, Redis, JWT, and mail |

---

## Requirements

- Node.js **v20+**
- pnpm, yarn, or npm