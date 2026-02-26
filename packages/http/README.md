# @pearl/http

> Router, middleware pipeline, Request/Response, and decorators for Pearl.js

## Installation

```bash
pnpm add @pearl/http @pearl/core
```

## Usage

### Basic routing

```ts
import { Router, HttpKernel } from '@pearl/http'

const router = new Router()

router.get('/users',     listUsers)
router.post('/users',    createUser)
router.get('/users/:id', getUser)
router.put('/users/:id', updateUser)
router.delete('/users/:id', deleteUser)

const kernel = new HttpKernel({ router })
await kernel.listen(3000)
```

### Request & Response

```ts
router.post('/users', async (ctx) => {
  const body = ctx.request.body<{ name: string; email: string }>()
  const id   = ctx.request.param('id')
  const page = ctx.request.query('page', '1')
  const token = ctx.request.header('authorization')

  ctx.response.json({ id: 1, ...body })
  ctx.response.created({ id: 1 })
  ctx.response.notFound('User not found')
  ctx.response.unauthorized()
  ctx.response.redirect('/login')
})
```

### Middleware

```ts
import type { HttpContext, NextFn } from '@pearl/http'

async function logger(ctx: HttpContext, next: NextFn) {
  console.log(`${ctx.request.method} ${ctx.request.url}`)
  await next()
}

// Global middleware
const kernel = new HttpKernel({ router, middleware: [logger] })

// Route-level middleware
router.get('/admin', adminHandler, [authMiddleware, logger])
```

### Controller decorators

```ts
import { Controller, Get, Post } from '@pearl/http'

@Controller('/users')
export class UserController {
  @Get('/')
  async index(ctx: HttpContext) {
    ctx.response.json({ users: [] })
  }

  @Post('/')
  async store(ctx: HttpContext) {
    ctx.response.created({ id: 1 })
  }

  @Get('/:id')
  async show(ctx: HttpContext) {
    const id = ctx.request.param('id')
    ctx.response.json({ id })
  }
}
```

## API

### `Router`

| Method | Description |
|--------|-------------|
| `get(path, handler, middleware?)` | Register GET route |
| `post(path, handler, middleware?)` | Register POST route |
| `put(path, handler, middleware?)` | Register PUT route |
| `patch(path, handler, middleware?)` | Register PATCH route |
| `delete(path, handler, middleware?)` | Register DELETE route |
| `group(prefix, fn)` | Group routes under a prefix |

### `Request`

| Method | Description |
|--------|-------------|
| `body<T>()` | Parsed request body |
| `param(key)` | Route parameter |
| `query(key, default?)` | Query string value |
| `header(key)` | Request header |
| `ip()` | Client IP address |

### `Response`

| Method | Description |
|--------|-------------|
| `json(data, status?)` | Send JSON response |
| `created(data?)` | 201 Created |
| `noContent()` | 204 No Content |
| `notFound(message?)` | 404 Not Found |
| `unauthorized(message?)` | 401 Unauthorized |
| `forbidden(message?)` | 403 Forbidden |
| `redirect(url, status?)` | Redirect response |