# @pearljs/validate

> FormRequest, ValidationPipe, and Zod-powered rules for Pearl.js

## Installation

```bash
pnpm add @pearljs/validate @pearljs/http zod
```

## Usage

### FormRequest

```ts
import { FormRequest } from '@pearljs/validate'
import { z } from 'zod'

export class CreateUserRequest extends FormRequest {
  schema = z.object({
    name:     z.string().min(2).max(100),
    email:    z.string().email(),
    password: z.string().min(8),
  })

  async authorize(): Promise<boolean> {
    return true // or check ctx.get('auth.user')
  }
}

// In your route handler
router.post('/users', async (ctx) => {
  const request = await CreateUserRequest.validate(ctx)
  // request.data is fully typed
  const { name, email } = request.data
})
```

### ValidationPipe (middleware)

```ts
import { ValidationPipe } from '@pearljs/validate'

router.post('/users', createUser, [
  ValidationPipe(CreateUserRequest)
])
```

### Standalone validation

```ts
import { validate } from '@pearljs/validate'
import { z } from 'zod'

const schema = z.object({ email: z.string().email() })
const result = await validate(schema, { email: 'bad' })
// throws ValidationException with per-field errors
```

### Built-in rules

```ts
import { rules } from '@pearljs/validate'

z.object({
  email:    rules.email(),
  password: rules.password(),   // min 8, mixed case, number
  slug:     rules.slug(),
  uuid:     rules.uuid(),
  url:      rules.url(),
})
```

---