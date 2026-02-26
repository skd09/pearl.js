# @pearl/database

> Drizzle ORM integration, Model helpers, and migrations for Pearl.js

## Installation

```bash
pnpm add @pearl/database drizzle-orm
pnpm add -D drizzle-kit

# Add your driver
pnpm add pg        # PostgreSQL
pnpm add mysql2    # MySQL
pnpm add better-sqlite3  # SQLite
```

## Usage

### Define a schema

```ts
import { pgTable, serial, varchar, timestamp } from '@pearl/database'

export const users = pgTable('users', {
  id:        serial('id').primaryKey(),
  name:      varchar('name', { length: 255 }).notNull(),
  email:     varchar('email', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow(),
})
```

### Define a model

```ts
import { Model } from '@pearl/database'

export class User extends Model<typeof users> {
  static table = users
}
```

### Query

```ts
const db = app.make(DatabaseManager).db

await User.all(db)
await User.find(db, 1)
await User.findOrFail(db, 1)
await User.create(db, { name: 'Sharvari', email: 'hi@pearl.dev' })
await User.update(db, 1, { name: 'Updated' })
await User.delete(db, 1)
await User.count(db)

// Raw Drizzle query
const admins = await db.select().from(users).where(eq(users.role, 'admin'))
```

### DatabaseServiceProvider

```ts
export class AppDatabaseServiceProvider extends DatabaseServiceProvider {
  protected config = {
    connection: {
      driver:   'postgres' as const,
      host:     process.env.DB_HOST!,
      port:     Number(process.env.DB_PORT),
      user:     process.env.DB_USER!,
      password: process.env.DB_PASSWORD!,
      database: process.env.DB_NAME!,
    },
    migrationsFolder: './database/migrations',
    runMigrationsOnBoot: true,
  }
}
```

### Migrations

```bash
# Generate migrations from schema changes
npx drizzle-kit generate:pg --schema=./src/schema

# Apply migrations
pnpm pearl migrate
```

---