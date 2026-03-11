// ─── Core ────────────────────────────────────────────────────────────────────
export { DatabaseManager } from './DatabaseManager.js'

// ─── Adapter interface ───────────────────────────────────────────────────────
export type { DatabaseAdapter } from './adapters/DatabaseAdapter.js'

// ─── Adapters ────────────────────────────────────────────────────────────────
export { DrizzleAdapter } from './adapters/DrizzleAdapter.js'
export type { AnyDrizzleDb } from './adapters/DrizzleAdapter.js'

export { PrismaAdapter } from './adapters/PrismaAdapter.js'
export type { AnyPrismaClient, PrismaAdapterOptions } from './adapters/PrismaAdapter.js'

export { TypeORMAdapter } from './adapters/TypeORMAdapter.js'
export type { AnyDataSource, TypeORMAdapterOptions } from './adapters/TypeORMAdapter.js'

export { NoneAdapter } from './adapters/NoneAdapter.js'
export type { AnyRawClient } from './adapters/NoneAdapter.js'

// ─── Config types ────────────────────────────────────────────────────────────
// DatabaseOrm declared here directly — avoids TS re-export issues with 'export type'
export type DatabaseOrm = 'drizzle' | 'prisma' | 'typeorm' | 'none'
export type {
  DatabaseDriver,
  DatabaseConfig,
  PostgresConfig,
  MysqlConfig,
  SqliteConfig,
} from './config.js'

// ─── Migrations ──────────────────────────────────────────────────────────────
export { Migrator } from './migrations/Migrator.js'
export type { MigratorOptions } from './migrations/Migrator.js'

// ─── Service Provider ────────────────────────────────────────────────────────
export { DatabaseServiceProvider } from './providers/DatabaseServiceProvider.js'

// ─── Drizzle helpers (schema builders + query operators) ─────────────────────
export * from './drizzle/drizzle-query.js'

// ─── Drizzle Model helper ────────────────────────────────────────────────────
export { Model } from './drizzle/drizzle-model.js'