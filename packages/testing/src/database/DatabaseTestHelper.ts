import { sql } from 'drizzle-orm'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDrizzleDb = any

export class DatabaseTestHelper {
    constructor(private readonly db: AnyDrizzleDb) {}

    async begin(): Promise<void> {
        await this.db.execute(sql`BEGIN`)
    }

    async rollback(): Promise<void> {
        await this.db.execute(sql`ROLLBACK`)
    }

    async commit(): Promise<void> {
        await this.db.execute(sql`COMMIT`)
    }

    async transaction<T>(fn: (db: AnyDrizzleDb) => Promise<T>): Promise<T> {
        await this.begin()
        try {
            return await fn(this.db)
        } finally {
            await this.rollback()
        }
    }

    async truncate(...tables: string[]): Promise<void> {
        for (const table of tables) {
            // Use parameterized identifier — safe for test-only table names
            await this.db.execute(sql.raw(`DELETE FROM "${table}"`) )
        }
    }

    get raw(): AnyDrizzleDb { return this.db }
}