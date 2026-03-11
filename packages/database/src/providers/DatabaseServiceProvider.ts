import { ServiceProvider } from '@pearl-framework/core'
import { DatabaseManager } from '../DatabaseManager.js'
import type { DatabaseAdapter } from '../adapters/DatabaseAdapter.js'

/**
 * DatabaseServiceProvider — registers and boots a DatabaseManager
 * with whichever adapter the user has configured.
 *
 * Extend this in your app and set the `adapter` property:
 *
 * ── Drizzle (default) ────────────────────────────────────────────────────────
 *
 *   import { DrizzleAdapter, DatabaseServiceProvider } from '@pearl-framework/database'
 *
 *   export class AppDatabaseProvider extends DatabaseServiceProvider {
 *     protected adapter = new DrizzleAdapter({
 *       driver:   'postgres',
 *       host:     env('DB_HOST'),
 *       user:     env('DB_USER'),
 *       password: env('DB_PASSWORD'),
 *       database: env('DB_NAME'),
 *     })
 *   }
 *
 * ── Prisma ───────────────────────────────────────────────────────────────────
 *
 *   import { PrismaClient } from '@prisma/client'
 *   import { PrismaAdapter, DatabaseServiceProvider } from '@pearl-framework/database'
 *
 *   export class AppDatabaseProvider extends DatabaseServiceProvider {
 *     protected adapter = new PrismaAdapter({ client: new PrismaClient() })
 *   }
 *
 * ── TypeORM ──────────────────────────────────────────────────────────────────
 *
 *   import { DataSource } from 'typeorm'
 *   import { TypeORMAdapter, DatabaseServiceProvider } from '@pearl-framework/database'
 *
 *   export class AppDatabaseProvider extends DatabaseServiceProvider {
 *     protected adapter = new TypeORMAdapter({
 *       dataSource: new DataSource({ type: 'postgres', ... }),
 *     })
 *   }
 *
 * ── No ORM (raw driver) ───────────────────────────────────────────────────────
 *
 *   import { NoneAdapter, DatabaseServiceProvider } from '@pearl-framework/database'
 *
 *   export class AppDatabaseProvider extends DatabaseServiceProvider {
 *     protected adapter = new NoneAdapter({ driver: 'postgres', ... })
 *   }
 */
export abstract class DatabaseServiceProvider extends ServiceProvider {
    /** Set this in your subclass to the adapter of your choice. */
    protected abstract adapter: DatabaseAdapter

    register(): void {
        this.container.singleton(
        DatabaseManager,
        () => new DatabaseManager(this.adapter),
        )
    }

    override async boot(): Promise<void> {
        const manager = this.container.make(DatabaseManager)
        await manager.connect()
    }

    async shutdown(): Promise<void> {
        const manager = this.container.make(DatabaseManager)
        await manager.disconnect()
    }
}