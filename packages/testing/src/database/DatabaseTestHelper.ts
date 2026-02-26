// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDrizzleDb = any

export class DatabaseTestHelper {
    constructor(private readonly db: AnyDrizzleDb) {}

    async begin(): Promise<void> {
        await this.db.execute('BEGIN')
    }

    async rollback(): Promise<void> {
        await this.db.execute('ROLLBACK')
    }

    async commit(): Promise<void> {
        await this.db.execute('COMMIT')
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
        await this.db.execute(`DELETE FROM ${table}`)
        }
    }

    get raw(): AnyDrizzleDb { return this.db }
}