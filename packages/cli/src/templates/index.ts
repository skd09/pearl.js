export const templates = {

  controller: (name: string, resourceful: boolean) => `import type { HttpContext } from '@pearl/http'

export class ${name}Controller {
  async index(ctx: HttpContext): Promise<void> {
    ctx.response.json({ data: [] })
  }

  async show(ctx: HttpContext): Promise<void> {
    const id = ctx.request.param('id')
    ctx.response.json({ data: { id } })
  }
${resourceful ? `
  async store(ctx: HttpContext): Promise<void> {
    const body = ctx.request.body()
    ctx.response.created({ data: body })
  }

  async update(ctx: HttpContext): Promise<void> {
    const id = ctx.request.param('id')
    const body = ctx.request.body()
    ctx.response.json({ data: { id, ...body } })
  }

  async destroy(ctx: HttpContext): Promise<void> {
    ctx.response.noContent()
  }
` : ''}}
`,

  model: (name: string, tableName: string) => `import { pgTable, serial, varchar, timestamp } from '@pearl/database'
import { Model } from '@pearl/database'

export const ${tableName} = pgTable('${tableName}', {
  id:        serial('id').primaryKey(),
  // TODO: define your columns
  // name:   varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export type ${name}Record = typeof ${tableName}.$inferSelect

export class ${name} extends Model<typeof ${tableName}> {
  static table = ${tableName}

  id: number
  createdAt: Date

  constructor(record: ${name}Record) {
    super()
    this.id        = record.id
    this.createdAt = record.createdAt
  }
}
`,

  migration: (name: string, tableName: string) => `-- Migration: ${name}
-- Created: ${new Date().toISOString()}

CREATE TABLE IF NOT EXISTS ${tableName} (
  id         SERIAL PRIMARY KEY,
  -- TODO: define your columns
  -- name    VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Rollback:
-- DROP TABLE IF EXISTS ${tableName};
`,

  middleware: (name: string) => `import type { HttpContext, NextFn } from '@pearl/http'

export async function ${name}Middleware(ctx: HttpContext, next: NextFn): Promise<void> {
  // TODO: implement middleware logic
  await next()
}
`,

  job: (name: string) => `import { Job } from '@pearl/queue'

export class ${name}Job extends Job {
  readonly queue = 'default'
  get tries() { return 3 }

  constructor(
    // TODO: define job payload
    // public readonly userId: number,
  ) { super() }

  async handle(): Promise<void> {
    // TODO: implement job logic
    console.log('[Job] Handling ${name}Job')
  }

  async failed(error: Error): Promise<void> {
    console.error('[Job] ${name}Job failed:', error.message)
  }
}
`,

  mail: (name: string) => `import { Mailable } from '@pearl/mail'

export class ${name}Mail extends Mailable {
  constructor(
    private readonly to: string,
    // TODO: add more constructor params
  ) { super() }

  build(): this {
    return this
      .to(this.to)
      .subject('${name}')
      .html(\`<p>TODO: write your email content</p>\`)
      .text('TODO: write your email content')
  }
}
`,

  event: (name: string) => `import { Event } from '@pearl/events'

export class ${name}Event extends Event {
  constructor(
    // TODO: define event payload
    // public readonly userId: number,
  ) { super() }
}
`,

  listener: (name: string, eventName: string) => `import { Listener } from '@pearl/events'
import type { ${eventName}Event } from '../events/${eventName}Event.js'

export class ${name}Listener extends Listener<${eventName}Event> {
  async handle(event: ${eventName}Event): Promise<void> {
    // TODO: handle the ${eventName} event
    console.log('Handling ${eventName}:', event)
  }
}
`,

  request: (name: string) => `import { FormRequest } from '@pearl/validate'
import { z } from 'zod'

export class ${name}Request extends FormRequest {
  schema = z.object({
    // TODO: define validation rules
    // name:  z.string().min(1).max(255),
    // email: z.string().email(),
  })

  async authorize(): Promise<boolean> {
    return true // TODO: add authorization logic
  }
}
`,

  resource: (name: string) => `export class ${name}Resource {
  constructor(private readonly data: Record<string, unknown>) {}

  toJSON(): Record<string, unknown> {
    return {
      id:        this.data['id'],
      // TODO: map your resource fields
      // name:   this.data['name'],
      createdAt: this.data['createdAt'],
    }
  }

  static from(data: Record<string, unknown>): ${name}Resource {
    return new ${name}Resource(data)
  }

  static collection(items: Record<string, unknown>[]): ${name}Resource[] {
    return items.map((item) => new ${name}Resource(item))
  }
}
`,

}