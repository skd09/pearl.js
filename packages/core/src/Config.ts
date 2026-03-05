import { readFileSync, existsSync, mkdirSync } from 'node:fs'
import { resolve, join } from 'node:path'

type ConfigValue = string | number | boolean | null | ConfigValue[] | { [key: string]: ConfigValue }
type ConfigStore = Record<string, ConfigValue>

/**
 * Reads and caches config files from the app's config/ directory.
 * Config values are accessed via dot notation: config.get('database.connections.default')
 */
export class Config {
  private readonly store: ConfigStore = {}
  private loaded = false

  constructor(private readonly configPath: string) {}

  /**
   * Load all config files from the config directory.
   * Called once during application boot.
   * Creates the config directory if it doesn't exist.
   */
  async load(): Promise<void> {
    if (this.loaded) return

    // Auto-create config directory if missing — no need to manually mkdir
    if (!existsSync(this.configPath)) {
      mkdirSync(this.configPath, { recursive: true })
    }

    const { readdirSync } = await import('node:fs')
    const files = readdirSync(this.configPath).filter((f) => f.endsWith('.js') || f.endsWith('.ts'))

    for (const file of files) {
      const name = file.replace(/\.(js|ts)$/, '')
      const filePath = resolve(join(this.configPath, file))
      const module = await import(filePath) as { default: ConfigStore }
      this.store[name] = module.default
    }

    this.loaded = true
  }

  /**
   * Get a config value using dot notation.
   * @example config.get('database.connections.default') // 'postgres'
   * @example config.get('app.name', 'Pearl App')
   */
  get<T extends ConfigValue>(key: string, fallback?: T): T {
    const parts = key.split('.')
    let current: ConfigValue = this.store

    for (const part of parts) {
      if (current === null || typeof current !== 'object' || Array.isArray(current)) {
        return (fallback as T) ?? (() => { throw new Error(`Config key not found: "${key}"`) })()
      }
      current = (current as Record<string, ConfigValue>)[part] ?? null
    }

    if (current === null && fallback !== undefined) return fallback
    if (current === null) throw new Error(`Config key not found: "${key}"`)

    return current as T
  }

  /**
   * Check if a config key exists.
   */
  has(key: string): boolean {
    try {
      this.get(key)
      return true
    } catch {
      return false
    }
  }
}

// -------------------------------------------------------------------------
// env() helper — typed environment variable access
// -------------------------------------------------------------------------

type EnvOptions<T> = {
  default?: T
  required?: boolean
}

function env(key: string): string
function env(key: string, fallback: string): string
function env<T extends string | number | boolean>(key: string, fallback: T): T
function env(key: string, fallback?: unknown): unknown {
  const value = process.env[key]

  if (value === undefined) {
    if (fallback !== undefined) return fallback
    throw new Error(
      `Environment variable "${key}" is not set. ` +
      `Add it to your .env file or provide a default.`
    )
  }

  return value
}

env.bool = (key: string, fallback?: boolean): boolean => {
  const value = process.env[key]
  if (value === undefined) {
    if (fallback !== undefined) return fallback
    throw new Error(`Environment variable "${key}" is not set.`)
  }
  return value === 'true' || value === '1'
}

env.number = (key: string, fallback?: number): number => {
  const value = process.env[key]
  if (value === undefined) {
    if (fallback !== undefined) return fallback
    throw new Error(`Environment variable "${key}" is not set.`)
  }
  const parsed = Number(value)
  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable "${key}" must be a number, got: "${value}"`)
  }
  return parsed
}

env.optional = (key: string): string | undefined => process.env[key]

export { env }

/**
 * Loads .env file into process.env (Pearl's built-in dotenv).
 * Called at the very start of the boot sequence.
 */
export function loadDotenv(appRoot: string): void {
  const envPath = join(appRoot, '.env')
  if (!existsSync(envPath)) return

  const contents = readFileSync(envPath, 'utf-8')
  for (const line of contents.split('\n')) {
    const trimmed = line.trim()
    if (trimmed === '' || trimmed.startsWith('#')) continue

    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) continue

    const key = trimmed.slice(0, eqIndex).trim()
    const raw = trimmed.slice(eqIndex + 1).trim()
    const value = raw.startsWith('"') && raw.endsWith('"') ? raw.slice(1, -1) : raw

    // Never overwrite existing env vars (allows real env to take precedence)
    process.env[key] ??= value
  }
}