import { ServiceProvider } from '@pearl/core'
import { DatabaseManager } from '../DatabaseManager.js'
import { Migrator } from '../migrations/Migrator.js'
import type { DatabaseConfig } from '../config.js'

export interface DatabaseServiceConfig {
  connection: DatabaseConfig
  migrationsFolder?: string
  runMigrationsOnBoot?: boolean
}

/**
 * DatabaseServiceProvider connects to the database and optionally runs migrations on boot.
 *
 * Usage — extend this in your app:
 *
 *   export class AppDatabaseServiceProvider extends DatabaseServiceProvider {
 *     protected config: DatabaseServiceConfig = {
 *       connection: {
 *         driver: 'postgres',
 *         host:     env('DB_HOST'),
 *         port:     env.number('DB_PORT', 5432),
 *         user:     env('DB_USER'),
 *         password: env('DB_PASSWORD'),
 *         database: env('DB_NAME'),
 *       },
 *       migrationsFolder: './database/migrations',
 *       runMigrationsOnBoot: true,
 *     }
 *   }
 */
export class DatabaseServiceProvider extends ServiceProvider {
    protected config!: DatabaseServiceConfig

    register(): void {
        this.container.singleton(
            DatabaseManager,
            () => new DatabaseManager(this.config.connection),
        )
    }

    override async boot(): Promise<void> {
        const manager = this.container.make(DatabaseManager)
        await manager.connect()

        if (this.config.runMigrationsOnBoot && this.config.migrationsFolder) {
            const migrator = new Migrator(
                manager.db,
                this.config.connection,
                { migrationsFolder: this.config.migrationsFolder },
            )
            await migrator.run()
        }
    }

    async shutdown(): Promise<void> {
        const manager = this.container.make(DatabaseManager)
        await manager.disconnect()
    }
}