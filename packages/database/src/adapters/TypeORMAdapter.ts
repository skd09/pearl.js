import type { DatabaseAdapter } from './DatabaseAdapter.js'

// TypeORM's DataSource — typed loosely so @pearl-framework/database
// doesn't hard-depend on typeorm at runtime.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyDataSource = any

export interface TypeORMAdapterOptions {
    /**
     * Pass your configured TypeORM DataSource instance.
     *
     * @example
     * import { DataSource } from 'typeorm'
     *
     * const AppDataSource = new DataSource({
     *   type: 'postgres',
     *   url: process.env.DATABASE_URL,
     *   entities: [User, Post],
     *   synchronize: false,
     * })
     *
     * new TypeORMAdapter({ dataSource: AppDataSource })
     */
    dataSource: AnyDataSource
}

/**
 * TypeORMAdapter — wraps a TypeORM DataSource for use with Pearl's
 * DatabaseManager and DatabaseServiceProvider.
 *
 * Usage in your AppServiceProvider:
 *
 *   import { DataSource } from 'typeorm'
 *   import { TypeORMAdapter } from '@pearl-framework/database'
 *
 *   export class AppDatabaseProvider extends DatabaseServiceProvider {
 *     protected adapter = new TypeORMAdapter({
 *       dataSource: new DataSource({ type: 'postgres', ... }),
 *     })
 *   }
 */
export class TypeORMAdapter implements DatabaseAdapter {
    private _dataSource: AnyDataSource

    constructor(private readonly options: TypeORMAdapterOptions) {
        this._dataSource = options.dataSource
    }

    async connect(): Promise<void> {
        if (this._dataSource.isInitialized) return
        await this._dataSource.initialize()
    }

    async disconnect(): Promise<void> {
        if (!this._dataSource.isInitialized) return
        await this._dataSource.destroy()
    }

    connection(): AnyDataSource {
        if (!this._dataSource.isInitialized) {
            throw new Error(
                '[Pearl] TypeORMAdapter: DataSource not initialized. ' +
                'Ensure DatabaseServiceProvider has booted before accessing .dataSource.',
            )
        }
        return this._dataSource
    }

    /** Typed alias for connection() — preferred for TypeORM users. */
    get dataSource(): AnyDataSource {
        return this.connection()
    }
}