import type { DatabaseConfig } from './config.js'

// Use a union type for the Drizzle db instance since each driver returns different types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyDrizzleDb = any

export class DatabaseManager {
    private _db?: AnyDrizzleDb
    private _config: DatabaseConfig

    constructor(config: DatabaseConfig) {
        this._config = config
    }

    // ─── Connection ───────────────────────────────────────────────────────────

    async connect(): Promise<AnyDrizzleDb> {
        if (this._db) return this._db

        switch (this._config.driver) {
        case 'postgres':
            this._db = await this.connectPostgres(this._config)
            break
        case 'mysql':
            this._db = await this.connectMysql(this._config)
            break
        case 'sqlite':
            this._db = await this.connectSqlite(this._config)
            break
        }

        return this._db
    }

    get db(): AnyDrizzleDb {
        if (!this._db) {
            throw new Error(
                'Database not connected. Call DatabaseManager.connect() first, ' +
                'or ensure DatabaseServiceProvider has booted.'
            )
        }
        return this._db
    }

    async disconnect(): Promise<void> {
        if (!this._db) return

        if (this._config.driver === 'postgres') {
            const { sql } = await import('drizzle-orm')
            await this._db.execute(sql`SELECT 1`) // flush pending queries
        }

        this._db = undefined
    }

    // ─── Driver connections ───────────────────────────────────────────────────

    private async connectPostgres(
        config: Extract<DatabaseConfig, { driver: 'postgres' }>
    ): Promise<AnyDrizzleDb> {
        const { drizzle } = await import('drizzle-orm/node-postgres')
        const { Pool } = await import('pg')

        const pool = new Pool({
            host: config.host,
            port: config.port ?? 5432,
            user: config.user,
            password: config.password,
            database: config.database,
            ssl: config.ssl ?? false,
            min: config.pool?.min ?? 2,
            max: config.pool?.max ?? 10,
        })

        return drizzle(pool)
    }

    private async connectMysql(
        config: Extract<DatabaseConfig, { driver: 'mysql' }>
    ): Promise<AnyDrizzleDb> {
        const { drizzle } = await import('drizzle-orm/mysql2')
        const mysql = await import('mysql2/promise')

        const pool = mysql.createPool({
            host: config.host,
            port: config.port ?? 3306,
            user: config.user,
            password: config.password,
            database: config.database,
            connectionLimit: config.pool?.max ?? 10,
        })

        return drizzle(pool)
    }

    private async connectSqlite(
        config: Extract<DatabaseConfig, { driver: 'sqlite' }>
    ): Promise<AnyDrizzleDb> {
        const { drizzle } = await import('drizzle-orm/better-sqlite3')
        const { default: Database } = await import('better-sqlite3')

        const client = new Database(config.filename)
        return drizzle(client)
    }
}