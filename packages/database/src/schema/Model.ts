import { eq, type SQL } from 'drizzle-orm'
import type { AnyDrizzleDb } from '../DatabaseManager.js'
import type { PgTableWithColumns } from 'drizzle-orm/pg-core'
import type { MySqlTableWithColumns } from 'drizzle-orm/mysql-core'
import type { SQLiteTableWithColumns } from 'drizzle-orm/sqlite-core'

export type AnyTable =
  | PgTableWithColumns<any> // eslint-disable-line @typescript-eslint/no-explicit-any
  | MySqlTableWithColumns<any> // eslint-disable-line @typescript-eslint/no-explicit-any
  | SQLiteTableWithColumns<any> // eslint-disable-line @typescript-eslint/no-explicit-any

/**
 * Model is a thin static query helper that wraps a Drizzle table.
 *
 * Usage:
 *   // Define your schema with Drizzle
 *   export const users = pgTable('users', {
 *     id:    serial('id').primaryKey(),
 *     name:  varchar('name', { length: 255 }).notNull(),
 *     email: varchar('email', { length: 255 }).notNull().unique(),
 *   })
 *
 *   // Define your model
 *   export class User extends Model<typeof users> {
 *     static table = users
 *   }
 *
 *   // Use it
 *   const user = await User.find(db, 1)
 *   const all  = await User.all(db)
 */
export class Model<TTable extends AnyTable> {
    // Subclasses set this to their Drizzle table definition
    static table: AnyTable

    // ─── Queries ──────────────────────────────────────────────────────────────

    static async all<T extends typeof Model>(
        this: T,
        db: AnyDrizzleDb,
    ): Promise<unknown[]> {
        return db.select().from(this.table)
    }

    static async find<T extends typeof Model>(
        this: T,
        db: AnyDrizzleDb,
        id: number | string,
    ): Promise<unknown | undefined> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const idCol = (this.table as any).id
        if (!idCol) throw new Error(`Table has no "id" column.`)

        const rows = await db.select().from(this.table).where(eq(idCol, id)).limit(1)
        return rows[0]
    }

    static async findOrFail<T extends typeof Model>(
        this: T,
        db: AnyDrizzleDb,
        id: number | string,
    ): Promise<unknown> {
        const row = await this.find(db, id)
        if (!row) throw new Error(`Record not found with id: ${id}`)
        return row
    }

    static async where<T extends typeof Model>(
        this: T,
        db: AnyDrizzleDb,
        condition: SQL,
    ): Promise<unknown[]> {
        return db.select().from(this.table).where(condition)
    }

    static async create<T extends typeof Model>(
        this: T,
        db: AnyDrizzleDb,
        data: Record<string, unknown>,
    ): Promise<unknown> {
        const rows = await db.insert(this.table).values(data).returning()
        return rows[0]
    }

    static async update<T extends typeof Model>(
        this: T,
        db: AnyDrizzleDb,
        id: number | string,
        data: Record<string, unknown>,
    ): Promise<unknown> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const idCol = (this.table as any).id
        if (!idCol) throw new Error(`Table has no "id" column.`)

        const rows = await db
        .update(this.table)
        .set(data)
        .where(eq(idCol, id))
        .returning()
        return rows[0]
    }

    static async delete<T extends typeof Model>(
        this: T,
        db: AnyDrizzleDb,
        id: number | string,
    ): Promise<void> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const idCol = (this.table as any).id
        if (!idCol) throw new Error(`Table has no "id" column.`)

        await db.delete(this.table).where(eq(idCol, id))
    }

    static async count<T extends typeof Model>(
        this: T,
        db: AnyDrizzleDb,
    ): Promise<number> {
        const { count } = await import('drizzle-orm')
        const result = await db
        .select({ count: count() })
        .from(this.table)
        return Number(result[0]?.count ?? 0)
    }
}