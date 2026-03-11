export type DatabaseDriver = 'postgres' | 'mysql' | 'sqlite'

export interface PostgresConfig {
  driver: 'postgres'
  host: string
  port?: number
  user: string
  password: string
  database: string
  ssl?: boolean
  pool?: { min?: number; max?: number }
}

export interface MysqlConfig {
  driver: 'mysql'
  host: string
  port?: number
  user: string
  password: string
  database: string
  pool?: { min?: number; max?: number }
}

export interface SqliteConfig {
  driver: 'sqlite'
  filename: string
}

export type DatabaseConfig = PostgresConfig | MysqlConfig | SqliteConfig