import { resolve } from 'node:path'
import type { AnyDrizzleDb } from '../DatabaseManager.js'
import type { DatabaseConfig } from '../config.js'

export interface MigratorOptions {
  migrationsFolder: string
}

export class Migrator {
    constructor(
        private readonly db: AnyDrizzleDb,
        private readonly config: DatabaseConfig,
        private readonly options: MigratorOptions,
    ) {}

    async run(): Promise<void> {
        const folder = resolve(this.options.migrationsFolder)

        switch (this.config.driver) {
        case 'postgres': {
            const { migrate } = await import('drizzle-orm/node-postgres/migrator')
            await migrate(this.db, { migrationsFolder: folder })
            break
        }
        case 'mysql': {
            const { migrate } = await import('drizzle-orm/mysql2/migrator')
            await migrate(this.db, { migrationsFolder: folder })
            break
        }
        case 'sqlite': {
            const { migrate } = await import('drizzle-orm/better-sqlite3/migrator')
            await migrate(this.db, { migrationsFolder: folder })
            break
        }
        }
    }
}