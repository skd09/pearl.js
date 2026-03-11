# @pearl-framework/validate

> Request validation with Zod — typed, composable, and integrated with the HTTP layer.

[![npm](https://img.shields.io/npm/v/@pearl-framework/validate?color=a855f7&labelColor=111118&style=flat-square)](https://www.npmjs.com/package/@pearl-framework/validate)

## Installation

```bash
npm install @pearl-framework/validate @pearl-framework/http zod
```

---

## FormRequest

`FormRequest` is the recommended way to validate incoming requests. Define a class with a Zod schema, and Pearl handles parsing, type inference, and error responses automatically.

```typescript
import { FormRequest } from '@pearl-framework/validate'
import { z } from 'zod'

export class CreateUserRequest extends FormRequest {
  schema = z.object({
    name:     z.string().min(2).max(100),
    email:    z.string().email(),
    password: z.string().min(8),
    role:     z.enum(['user', 'admin']).default('user'),
  })

  async authorize(): Promise<boolean> {
    return true  // return false to send a 403
  }
}
```

Use it in a route handler:

```typescript
router.post('/users', async (ctx) => {
  const req = await CreateUserRequest.validate(ctx)

  // req.data is fully typed — no casting needed
  const { name, email, password, role } = req.data

  const user = await User.create(db, {
    name,
    email,
    password: await Hash.make(password),
    role,
  })

  ctx.response.created(user)
})
```

---

## ValidationPipe (as middleware)

Use `ValidationPipe` to validate before your handler runs. Good for keeping handlers clean:

```typescript
import { ValidationPipe } from '@pearl-framework/validate'

router.post('/users', createUser, [ValidationPipe(CreateUserRequest)])
```

---

## Validation errors

When validation fails, Pearl automatically returns a `422 Unprocessable Entity` response:

```json
{
  "message": "Validation failed",
  "errors": {
    "email": ["Invalid email address"],
    "password": ["String must contain at least 8 character(s)"]
  }
}
```

You can also catch `ValidationException` manually:

```typescript
import { ValidationException } from '@pearl-framework/validate'

try {
  const req = await CreateUserRequest.validate(ctx)
} catch (e) {
  if (e instanceof ValidationException) {
    console.log(e.errors)  // { email: ['Invalid email address'], ... }
    console.log(e.message) // 'Validation failed'
  }
}
```

---

## Standalone validation

For validating data outside of a request context:

```typescript
import { validate, validateSync } from '@pearl-framework/validate'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  age:   z.number().min(18),
})

// Async — supports schemas with async refinements
const data = await validate(schema, { email: 'hi@pearl.dev', age: 25 })

// Sync — use when you know the schema has no async refinements
const data = validateSync(schema, { email: 'hi@pearl.dev', age: 25 })

// Both throw ValidationException on failure
```

---

## Built-in rules

`rules` provides pre-built Zod schemas for common field types:

```typescript
import { rules } from '@pearl-framework/validate'

const schema = z.object({
  email:    rules.email(),     // z.string().email()
  password: rules.password(),  // min 8 chars, mixed case, at least one number
  slug:     rules.slug(),      // lowercase letters, numbers, hyphens
  uuid:     rules.uuid(),      // UUID v4
  url:      rules.url(),       // http(s) URL
  phone:    rules.phone(),     // E.164 format
})
```

---

## Authorization

Override `authorize()` on a `FormRequest` to enforce access control before validation runs:

```typescript
export class UpdatePostRequest extends FormRequest {
  schema = z.object({
    title:   z.string().min(1),
    content: z.string(),
  })

  async authorize(): Promise<boolean> {
    const user = this.ctx.user()
    const post = await Post.find(db, this.ctx.request.param('id'))
    return post?.authorId === user?.id  // only the author can update
  }
}
```

Returning `false` sends a `403 Forbidden` response before the handler runs.

---

## API Reference

### `FormRequest`

| Method | Description |
|---|---|
| `FormRequest.validate(ctx)` | Parse and validate the request — returns a typed `FormRequest` instance |
| `request.data` | The validated, typed request body |
| `authorize()` | Override to add authorization logic — return `false` to send 403 |
| `schema` | Zod schema used for validation — set as a class property |

### `validate(schema, data)`

Validates `data` against a Zod schema. Returns the parsed, typed data or throws `ValidationException`.

### `validateSync(schema, data)`

Synchronous version. Only use when the schema has no async refinements.