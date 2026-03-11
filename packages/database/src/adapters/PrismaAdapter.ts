import type { DatabaseAdapter } from './DatabaseAdapter.js'

// PrismaClient is the user's generated client — we type it loosely here
// so @pearl-framework/database doesn't hard-depend on @prisma/client.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyPrismaClient = any

export interface PrismaAdapterOptions {
    /**
     * Pass your generated PrismaClient instance directly.
     *
     * @example
     * import { PrismaClient } from '@prisma/client'
     * const prisma = new PrismaClient()
     *
     * new PrismaAdapter({ client: prisma })
     */
    client: AnyPrismaClient

    /**
     * Log levels to pass to PrismaClient.
     * Defaults to none. Only used when Pearl creates the client itself
     * (i.e. when `client` is not provided — future auto-instantiation path).
     */
    log?: Array<'query' | 'info' | 'warn' | 'error'>
}

/**
 * PrismaAdapter — wraps a PrismaClient instance for use with Pearl's
 * DatabaseManager and DatabaseServiceProvider.
 *
 * Usage in your AppServiceProvider:
 *
 *   import { PrismaClient } from '@prisma/client'
 *   import { PrismaAdapter } from '@pearl-framework/database'
 *
 *   export class AppDatabaseProvider extends DatabaseServiceProvider {
 *     protected adapter = new PrismaAdapter({
 *       client: new PrismaClient(),
 *     })
 *   }
 */
export class PrismaAdapter implements DatabaseAdapter {
    private _client: AnyPrismaClient
    private _connected = false

    constructor(private readonly options: PrismaAdapterOptions) {
        this._client = options.client
    }

    async connect(): Promise<void> {
        if (this._connected) return
        await this._client.$connect()
        this._connected = true
    }

    async disconnect(): Promise<void> {
        if (!this._connected) return
        await this._client.$disconnect()
        this._connected = false
    }

    connection(): AnyPrismaClient {
        if (!this._connected) {
            throw new Error(
                '[Pearl] PrismaAdapter: not connected. ' +
                'Ensure DatabaseServiceProvider has booted before accessing .client.',
            )
        }
        return this._client
    }

    /** Typed alias for connection() — preferred for Prisma users. */
    get client(): AnyPrismaClient {
        return this.connection()
    }
}