# @pearl-framework/database

> Drizzle ORM integration, Model helpers, and migrations for Pearl.js.

[![npm](https://img.shields.io/npm/v/@pearl-framework/database?color=a855f7&labelColor=111118&style=flat-square)](https://www.npmjs.com/package/@pearl-framework/database)

## Installation

```bash
npm install @pearl-framework/database drizzle-orm
npm install -D drizzle-kit

# Pick your driver
npm install pg            # PostgreSQL
npm install mysql2        # MySQL
npm install better-sqlite3  # SQLite
```

---

## Define a Schema

Table definitions live in your `src/schema/` directory. All column helpers are re-exported from this package — no need to import from `drizzle-orm` directly.

```typescript
// src/schema/users.ts
import { pgTable, serial, varchar, text, boolean, timestamp } from '@pearl-framework/database'

export const users = pgTable('users', {
  id:        serial('id').primaryKey(),
  name:      varchar('name', { length: 255 }).notNull(),
  email:     varchar('email', { length: 255 }).notNull().unique(),
  password:  text('password').notNull(),
  active:    boolean('active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})
```

---

## Define a Model

Wrap a table in a `Model` class to get typed query helpers:

```typescript
// src/models/User.ts
import { Model } from '@pearl-framework/database'
import { users } from '../schema/users.js'

export class User extends Model<typeof users> {
  static table = users
}
```

---

## Querying

### Using Model helpers

```typescript
const db = app.make(DatabaseManager).db

await User.all(db)                                          // all rows
await User.find(db, 1)                                      // by PK or null
await User.findOrFail(db, 1)                                // by PK or throws
await User.create(db, { name: 'Sharvari', email: '...', password: hash })
await User.update(db, 1, { name: 'Updated' })
await User.delete(db, 1)
await User.count(db)
```

### Using Drizzle directly

When you need more control, use the Drizzle `db` instance directly. All common Drizzle query operators are re-exported:

```typescript
import { eq, and, desc, like } from '@pearl-framework/database'

// SELECT with filter + sort + limit
const recent = await db
  .select()
  .from(users)
  .where(and(eq(users.active, true), like(users.email, '%@pearl.dev')))
  .orderBy(desc(users.createdAt))
  .limit(10)

// INSERT and return
const [user] = await db.insert(users).values({ name, email, password }).returning()

// UPDATE
await db.update(users)
  .set({ name: 'Updated' })
  .where(eq(users.id, 1))

// DELETE
await db.delete(users).where(eq(users.id, 1))
```

---

## DatabaseServiceProvider

```typescript
import { DatabaseServiceProvider } from '@pearl-framework/database'

export class AppDatabaseServiceProvider extends DatabaseServiceProvider {
  protected config = {
    connection: {
      driver:   'postgres' as const,
      host:     process.env.DB_HOST!,
      port:     Number(process.env.DB_PORT ?? 5432),
      user:     process.env.DB_USER!,
      password: process.env.DB_PASSWORD!,
      database: process.env.DB_NAME!,
      ssl:      process.env.NODE_ENV === 'production',
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrationsFolder:    './database/migrations',
    runMigrationsOnBoot: true,   // apply pending migrations on app startup
  }
}

app.register(AppDatabaseServiceProvider)
```

### Supported drivers

| Driver | `driver` value | Package |
|---|---|---|
| PostgreSQL | `'postgres'` | `npm install pg` |
| MySQL | `'mysql'` | `npm install mysql2` |
| SQLite | `'sqlite'` | `npm install better-sqlite3` |

---

## Migrations

```bash
# Generate a migration from your schema changes
npx drizzle-kit generate --schema=./src/schema

# Run pending migrations
npx drizzle-kit migrate
# or via pearl CLI:
pearl migrate
```

Migrations also run automatically on `app.boot()` when `runMigrationsOnBoot: true`.

---

## Re-exported Drizzle helpers

All of these are available directly from `@pearl-framework/database`:

```typescript
import {
  // Column types (PostgreSQL)
  pgTable, serial, varchar, text, boolean,
  integer, bigserial, bigint, timestamp,
  date, jsonb, uuid, numeric,

  // Indexes
  index, uniqueIndex,

  // Query operators
  eq, ne, gt, gte, lt, lte,
  and, or, not,
  isNull, isNotNull,
  inArray, notInArray,
  like, ilike,

  // Utilities
  sql, count, asc, desc,
} from '@pearl-framework/database'
```

---

## API Reference

### `DatabaseManager`

| Method | Description |
|---|---|
| `connect()` | Open the connection pool |
| `disconnect()` | Close the pool cleanly — safe for all drivers (pg, mysql2, better-sqlite3) |
| `db` | The Drizzle db instance — throws if `connect()` hasn't been called |

### `Model<T>`

| Static method | Description |
|---|---|
| `all(db)` | Return all rows |
| `find(db, id)` | Find by primary key, returns `null` if not found |
| `findOrFail(db, id)` | Find by primary key, throws if not found |
| `create(db, data)` | Insert a row and return it |
| `update(db, id, data)` | Update by primary key and return the updated row |
| `delete(db, id)` | Delete by primary key |
| `count(db)` | Return the total number of rows |