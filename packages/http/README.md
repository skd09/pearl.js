# @pearl-framework/http

> Router, middleware pipeline, Request/Response, and HTTP server for Pearl.js.

[![npm](https://img.shields.io/npm/v/@pearl-framework/http?color=a855f7&labelColor=111118&style=flat-square)](https://www.npmjs.com/package/@pearl-framework/http)

## Installation

```bash
npm install @pearl-framework/http @pearl-framework/core
```

---

## Getting Started

```typescript
import { Router, HttpKernel } from '@pearl-framework/http'

const router = new Router()

router.get('/', (ctx) => ctx.response.json({ message: 'Hello' }))

await new HttpKernel().useRouter(router).listen(3000)
// → Listening on http://localhost:3000
```

---

## Routing

### Basic routes

```typescript
router.get('/users',         listUsers)
router.post('/users',        createUser)
router.get('/users/:id',     getUser)
router.put('/users/:id',     updateUser)
router.patch('/users/:id',   patchUser)
router.delete('/users/:id',  deleteUser)
```

### Route groups

Group routes under a common prefix to keep things organised:

```typescript
router.group('/api/v1', (r) => {
  r.group('/users', (r) => {
    r.get('/',    listUsers)
    r.post('/',   createUser)
    r.get('/:id', getUser)
  })

  r.group('/posts', (r) => {
    r.get('/',    listPosts)
    r.post('/',   createPost)
    r.get('/:id', getPost)
  })
})
```

---

## Request

```typescript
router.post('/users', async (ctx) => {
  const body  = ctx.request.body              // parsed JSON — getter, no parentheses
  const id    = ctx.request.param('id')       // /users/:id → '42'
  const page  = ctx.request.query('page', '1') // ?page=2 → '2', default '1'
  const token = ctx.request.header('authorization')
  const ip    = ctx.request.ip()
})
```

---

## Response

```typescript
router.get('/example', async (ctx) => {
  ctx.response.json({ id: 1 })              // 200 JSON
  ctx.response.json({ id: 1 }, 200)         // explicit status
  ctx.response.created({ id: 1 })           // 201
  ctx.response.noContent()                  // 204
  ctx.response.badRequest('Bad input')      // 400
  ctx.response.unauthorized()               // 401
  ctx.response.forbidden()                  // 403
  ctx.response.notFound('Not found')        // 404
  ctx.response.redirect('/login')           // 302
  ctx.response.redirect('/login', 301)      // 301 permanent
  ctx.response.status(418).json({ im: 'a teapot' }) // chainable status
})
```

---

## Middleware

Middleware is any function or class that follows the `(ctx, next) => Promise<void>` shape.

### Function middleware

```typescript
import type { HttpContext, NextFn } from '@pearl-framework/http'

async function logger(ctx: HttpContext, next: NextFn) {
  const start = Date.now()
  await next()
  console.log(`${ctx.request.method} ${ctx.request.url} — ${Date.now() - start}ms`)
}
```

### Class middleware

```typescript
class RateLimiter {
  constructor(private readonly limit: number) {}

  async handle(ctx: HttpContext, next: NextFn) {
    const ok = await checkRateLimit(ctx.request.ip(), this.limit)
    if (!ok) return ctx.response.status(429).json({ message: 'Too many requests' })
    await next()
  }
}
```

### Applying middleware

```typescript
// Global — runs on every request
const kernel = new HttpKernel()
kernel.useMiddleware([logger, new RateLimiter(100)])
kernel.useRouter(router)

// Route-level — runs only for this route
router.get('/admin', adminHandler, [authMiddleware, logger])
router.post('/users', createUser, [ValidationPipe(CreateUserRequest)])
```

---

## Rate limiting

Pearl ships a `RateLimit` middleware out of the box. Fixed-window per-key counter with `X-RateLimit-Limit` / `X-RateLimit-Remaining` / `X-RateLimit-Reset` headers, `Retry-After` on 429 responses, and a pluggable store.

```typescript
import { RateLimit } from '@pearl-framework/http'

// Global — 100 requests per minute per IP
router.use(new RateLimit({ windowMs: 60_000, max: 100 }))

// Tight limit on auth routes
router.post('/auth/login', loginHandler, [
  new RateLimit({
    windowMs: 15 * 60_000,
    max:      5,
    message:  'Too many login attempts. Try again in 15 minutes.',
  }),
])
```

### Custom keys

Default key is the client IP from `socket.remoteAddress`. Override `keyGenerator` to rate-limit per user, per API key, etc.:

```typescript
new RateLimit({
  windowMs: 60_000,
  max:      30,
  keyGenerator: (ctx) => {
    const user = ctx.get<{ id: number }>('auth.user')
    return user ? `u:${user.id}` : `ip:${ctx.request.nodeRequest.socket.remoteAddress}`
  },
})
```

### Behind a reverse proxy

`RateLimit` **ignores `X-Forwarded-For` by default.** If you enable `trustProxy: true` on a server NOT behind a controlled proxy, clients can spoof the header and bypass the limit. Only set it when nginx / Cloudflare / ELB / etc. is overwriting the header on your behalf:

```typescript
new RateLimit({
  windowMs: 60_000,
  max:      100,
  trustProxy: true,        // honors x-forwarded-for, first hop wins
})
```

### Redis store for multi-process deployments

The default `MemoryRateLimitStore` is process-local — fine for a single instance, not for horizontally scaled deployments where two processes should share counters. Implement the `RateLimitStore` contract against Redis (or whatever you're running):

```typescript
import type { RateLimitStore } from '@pearl-framework/http'

const redisStore: RateLimitStore = {
  async hit(key, windowMs) {
    // INCR with TTL on first hit; return { count, resetAt }
  },
  async reset(key) { /* DEL key */ },
}

new RateLimit({ windowMs: 60_000, max: 100, store: redisStore })
```

## Error handling

Throw or return from your handler and Pearl's kernel will catch it:

```typescript
import { HttpException } from '@pearl-framework/http'

router.get('/users/:id', async (ctx) => {
  const user = await User.find(db, ctx.request.param('id'))
  if (!user) throw new HttpException(404, 'User not found')
  ctx.response.json(user)
})
```

`ValidationException` from `@pearl-framework/validate` is also caught automatically and formatted as a `422` response.

---

## API Reference

### `Router`

| Method | Description |
|---|---|
| `get(path, handler, middleware?)` | Register a GET route |
| `post(path, handler, middleware?)` | Register a POST route |
| `put(path, handler, middleware?)` | Register a PUT route |
| `patch(path, handler, middleware?)` | Register a PATCH route |
| `delete(path, handler, middleware?)` | Register a DELETE route |
| `group(prefix, fn)` | Group routes under a prefix — `fn` receives the router |

### `Request`

| Property / Method | Type | Description |
|---|---|---|
| `body` | `unknown` | Parsed JSON request body (getter) |
| `param(key)` | `string` | Route parameter value |
| `query(key, default?)` | `string` | Query string value |
| `header(key)` | `string \| undefined` | Request header |
| `method` | `string` | HTTP method |
| `url` | `string` | Full request URL |
| `ip()` | `string` | Client IP address |

### `Response`

| Method | Status | Description |
|---|---|---|
| `json(data, status?)` | 200 | Send a JSON response |
| `created(data?)` | 201 | Resource created |
| `noContent()` | 204 | Empty response |
| `badRequest(msg?)` | 400 | Bad request |
| `unauthorized(msg?)` | 401 | Authentication required |
| `forbidden(msg?)` | 403 | Access denied |
| `notFound(msg?)` | 404 | Resource not found |
| `redirect(url, status?)` | 302 | Redirect |
| `status(code)` | — | Set status code, returns `this` for chaining |

### `HttpKernel`

| Method | Description |
|---|---|
| `useRouter(router)` | Attach a router |
| `useMiddleware(middleware[])` | Register global middleware |
| `listen(port, host?)` | Start the HTTP server — returns a `Promise<void>` |