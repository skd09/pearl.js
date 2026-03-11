import type { DatabaseAdapter } from './adapters/DatabaseAdapter.js'

/**
 * DatabaseManager — Pearl's database facade.
 *
 * Registered as a singleton in the IoC container by DatabaseServiceProvider.
 * Delegates all connection work to the configured adapter (Drizzle, Prisma,
 * TypeORM, or None).
 *
 * @example — in a controller
 *   const db  = app.container.make(DatabaseManager)
 *   const orm = db.connection()   // returns the ORM-native client
 *
 * For Drizzle users the adapter also exposes a typed .db getter:
 *   import { DrizzleAdapter } from '@pearl-framework/database'
 *   const adapter = db.adapter as DrizzleAdapter
 *   const result  = await adapter.db.select().from(users)
 */
export class DatabaseManager {
    constructor(public readonly adapter: DatabaseAdapter) {}

    /** Boot the connection. Called automatically by DatabaseServiceProvider. */
    async connect(): Promise<void> {
        await this.adapter.connect()
    }

    /** Tear down the connection. Called automatically on app shutdown. */
    async disconnect(): Promise<void> {
        await this.adapter.disconnect()
    }

    /**
     * Return the raw ORM / driver client.
     *
     * - Drizzle  -> AnyDrizzleDb
     * - Prisma   -> PrismaClient
     * - TypeORM  -> DataSource
     * - None     -> pg.Pool | mysql2.Pool | BetterSqlite3.Database
     */
    connection(): unknown {
        return this.adapter.connection()
    }
}