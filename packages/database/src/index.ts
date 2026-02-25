// Core
export { DatabaseManager } from './DatabaseManager.js'
export type { AnyDrizzleDb } from './DatabaseManager.js'

// Config
export type { DatabaseConfig, DatabaseDriver, PostgresConfig, MysqlConfig, SqliteConfig } from './config.js'

// Model
export { Model } from './schema/Model.js'

// Migrations
export { Migrator } from './migrations/Migrator.js'
export type { MigratorOptions } from './migrations/Migrator.js'

// Service Provider
export { DatabaseServiceProvider } from './providers/DatabaseServiceProvider.js'
export type { DatabaseServiceConfig } from './providers/DatabaseServiceProvider.js'

// Schema builders + query operators (Drizzle re-exports)
export * from './query/index.js'