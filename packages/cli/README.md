# @pearl/cli

The official CLI for the [Pearl.js](https://github.com/skd09/pearl.js) TypeScript framework.

## Installation

```bash
npm install -g @pearl/cli
```

Or use it directly with npx:

```bash
npx pearl new my-app
```

## Commands

### Application

| Command | Description |
|---|---|
| `pearl new <name>` | Scaffold a new Pearl.js application |
| `pearl serve` | Start the dev server with hot reload |
| `pearl list` | List all available commands |

### Generators

All `make:*` commands support `--force` to overwrite existing files.

| Command | Output |
|---|---|
| `pearl make:controller <n>` | `src/controllers/<Name>Controller.ts` |
| `pearl make:model <n>` | `src/models/<Name>.ts` |
| `pearl make:migration <n>` | `src/database/migrations/<timestamp>_<name>.ts` |
| `pearl make:middleware <n>` | `src/middleware/<Name>Middleware.ts` |
| `pearl make:job <n>` | `src/jobs/<Name>Job.ts` |
| `pearl make:mail <n>` | `src/mail/<Name>Mail.ts` |
| `pearl make:event <n>` | `src/events/<Name>Event.ts` |
| `pearl make:listener <n>` | `src/listeners/<Name>Listener.ts` |
| `pearl make:request <n>` | `src/requests/<Name>Request.ts` |
| `pearl make:resource <n>` | `src/resources/<Name>Resource.ts` |

## Examples

```bash
# Create a new app
pearl new blog-api

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

After running `pearl new my-app`, you'll get:

```
my-app/
├── src/
│   ├── controllers/
│   ├── models/
│   ├── middleware/
│   ├── jobs/
│   ├── mail/
│   ├── events/
│   ├── listeners/
│   ├── requests/
│   ├── resources/
│   ├── routes/
│   │   └── api.ts
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/
│   ├── config/
│   └── main.ts
├── tests/
├── .env
├── .env.example
├── package.json
└── tsconfig.json
```