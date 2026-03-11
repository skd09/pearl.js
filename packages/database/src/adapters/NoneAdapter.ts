import type { DatabaseAdapter } from './DatabaseAdapter.js'
import type { DatabaseConfig } from '../config.js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyRawClient = any

/**
 * NoneAdapter — gives you a raw database client with no ORM layer.
 *
 * Returns:
 *   - postgres  → a `pg.Pool` instance
 *   - mysql     → a `mysql2` Pool instance
 *   - sqlite    → a `better-sqlite3` Database instance
 *
 * Usage:
 *   const client = app.container.make(DatabaseManager).connection()
 *   // then use pg / mysql2 / better-sqlite3 APIs directly
 */
export class NoneAdapter implements DatabaseAdapter {
    private _client?: AnyRawClient

    constructor(private readonly config: DatabaseConfig) {}

    async connect(): Promise<void> {
        if (this._client) return

        switch (this.config.driver) {
            case 'postgres': {
                const { Pool } = await import('pg')
                const cfg = this.config as Extract<DatabaseConfig, { driver: 'postgres' }>
                this._client = new Pool({
                    host:     cfg.host,
                    port:     cfg.port     ?? 5432,
                    user:     cfg.user,
                    password: cfg.password,
                    database: cfg.database,
                    ssl:      cfg.ssl      ?? false,
                    min:      cfg.pool?.min ?? 2,
                    max:      cfg.pool?.max ?? 10,
                })
                break
            }

            case 'mysql': {
                const mysql = await import('mysql2/promise')
                const cfg   = this.config as Extract<DatabaseConfig, { driver: 'mysql' }>
                this._client = mysql.createPool({
                        host:            cfg.host,
                        port:            cfg.port     ?? 3306,
                        user:            cfg.user,
                        password:        cfg.password,
                        database:        cfg.database,
                        connectionLimit: cfg.pool?.max ?? 10,
                    })
                break
            }

            case 'sqlite': {
                const { default: Database } = await import('better-sqlite3')
                const cfg = this.config as Extract<DatabaseConfig, { driver: 'sqlite' }>
                this._client = new Database(cfg.filename)
                break
            }
        }
    }

    async disconnect(): Promise<void> {
        if (!this._client) return

        try {
            if (typeof this._client.end   === 'function') await this._client.end()
            if (typeof this._client.close === 'function') this._client.close()
        } finally {
            this._client = undefined
        }
    }

    connection(): AnyRawClient {
        if (!this._client) {
            throw new Error(
                '[Pearl] NoneAdapter: not connected. ' +
                'Ensure DatabaseServiceProvider has booted before accessing the raw client.',
            )
        }
        return this._client
    }

    /** Typed alias for connection(). */
    get client(): AnyRawClient {
        return this.connection()
    }
}