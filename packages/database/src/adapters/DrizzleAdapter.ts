import type { DatabaseAdapter } from './DatabaseAdapter.js'
import type { DatabaseConfig } from '../config.js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyDrizzleDb = any

/**
 * DrizzleAdapter — connects to Postgres, MySQL, or SQLite using Drizzle ORM.
 *
 * All drivers are loaded dynamically so only the one the user needs is
 * actually required at runtime.
 */
export class DrizzleAdapter implements DatabaseAdapter {
    private _db?: AnyDrizzleDb
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private _client?: any

    constructor(private readonly config: DatabaseConfig) {}

    // ─── DatabaseAdapter ────────────────────────────────────────────────────────

    async connect(): Promise<void> {
        if (this._db) return

        switch (this.config.driver) {
            case 'postgres': this._db = await this._connectPostgres(); break
            case 'mysql':    this._db = await this._connectMysql();    break
            case 'sqlite':   this._db = await this._connectSqlite();   break
        }
    }

    async disconnect(): Promise<void> {
        if (!this._db) return

        try {
            switch (this.config.driver) {
                case 'postgres':
                case 'mysql':
                    if (typeof this._client?.end === 'function') await this._client.end()
                    break
                case 'sqlite':
                    if (typeof this._client?.close === 'function') this._client.close()
                    break
            }
        } finally {
            this._db     = undefined
            this._client = undefined
        }
    }

    connection(): AnyDrizzleDb {
        if (!this._db) {
        throw new Error(
            '[Pearl] DrizzleAdapter: not connected. ' +
            'Ensure DatabaseServiceProvider has booted before accessing .db.',
        )
        }
        return this._db
    }

    // ─── Typed getter ───────────────────────────────────────────────────────────

    /** Typed alias for connection() — preferred for Drizzle users. */
    get db(): AnyDrizzleDb {
        return this.connection()
    }

    // ─── Private driver helpers ─────────────────────────────────────────────────

    private async _connectPostgres(): Promise<AnyDrizzleDb> {
        const config = this.config as Extract<DatabaseConfig, { driver: 'postgres' }>
        const { drizzle } = await import('drizzle-orm/node-postgres')
        const { Pool }    = await import('pg')

        const pool = new Pool({
        host:     config.host,
        port:     config.port     ?? 5432,
        user:     config.user,
        password: config.password,
        database: config.database,
        ssl:      config.ssl      ?? false,
        min:      config.pool?.min ?? 2,
        max:      config.pool?.max ?? 10,
        })

        this._client = pool
        return drizzle(pool)
    }

    private async _connectMysql(): Promise<AnyDrizzleDb> {
        const config = this.config as Extract<DatabaseConfig, { driver: 'mysql' }>
        const { drizzle } = await import('drizzle-orm/mysql2')
        const mysql       = await import('mysql2/promise')

        const pool = mysql.createPool({
            host:             config.host,
            port:             config.port     ?? 3306,
            user:             config.user,
            password:         config.password,
            database:         config.database,
            connectionLimit:  config.pool?.max ?? 10,
        })

        this._client = pool
        return drizzle(pool)
    }

    private async _connectSqlite(): Promise<AnyDrizzleDb> {
        const config = this.config as Extract<DatabaseConfig, { driver: 'sqlite' }>
        const { drizzle }          = await import('drizzle-orm/better-sqlite3')
        const { default: Database } = await import('better-sqlite3')

        const client = new Database(config.filename)
        this._client = client
        return drizzle(client)
    }
}