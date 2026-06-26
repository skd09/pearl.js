import chalk from 'chalk'
import { Command } from 'commander'
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import ora from 'ora'
import { confirm, select, checkbox } from '@inquirer/prompts'

// ─── Types ────────────────────────────────────────────────────────────────

type Module = 'http' | 'auth' | 'validate' | 'database' | 'events' | 'mail' | 'queue'
type Preset = 'api' | 'worker' | 'all' | 'minimal' | 'custom'
type Orm = 'drizzle' | 'prisma' | 'typeorm' | 'raw'
type Driver = 'postgres' | 'mysql' | 'sqlite'
type SecurityModule = 'rateLimit' | 'cors' | 'securityHeaders' | 'errorHandler'

interface Selection {
  modules: Set<Module>
  security: Set<SecurityModule>
  db?: { orm: Orm; driver: Driver }
}

const ALL_MODULES: Module[] = ['http', 'auth', 'validate', 'database', 'events', 'mail', 'queue']
const ALL_ORMS: Orm[] = ['drizzle', 'prisma', 'typeorm', 'raw']
const ALL_DRIVERS: Driver[] = ['postgres', 'mysql', 'sqlite']
const ALL_SECURITY: SecurityModule[] = ['errorHandler', 'securityHeaders', 'cors', 'rateLimit']

// ─── Presets ──────────────────────────────────────────────────────────────

const PRESETS: Record<Exclude<Preset, 'custom'>, Module[]> = {
  api:     ['http', 'validate', 'auth', 'database'],
  worker:  ['queue', 'events', 'mail'],
  all:     ['http', 'auth', 'validate', 'database', 'events', 'mail', 'queue'],
  minimal: ['http'],
}

const SECURITY_PRESETS: Record<Exclude<Preset, 'custom'>, SecurityModule[]> = {
  // Any HTTP-bearing preset gets the full security middleware stack out of the
  // box — the framework is secure by default. Users can opt out per-middleware
  // (custom preset / --security flag) or disable everything with --security=.
  api:     ['errorHandler', 'securityHeaders', 'cors', 'rateLimit'],
  worker:  [],
  all:     ['errorHandler', 'securityHeaders', 'cors', 'rateLimit'],
  minimal: ['errorHandler', 'securityHeaders', 'cors', 'rateLimit'],
}

// ─── Install matrix ──────────────────────────────────────────────────────

const PEARL_VERSION = '^1.1.0'

const MODULE_DEPS: Record<Module, Record<string, string>> = {
  http:     { '@pearl-framework/http': PEARL_VERSION },
  auth:     { '@pearl-framework/auth': PEARL_VERSION },
  validate: { '@pearl-framework/validate': PEARL_VERSION, zod: '^3.23.0' },
  database: { '@pearl-framework/database': PEARL_VERSION },
  events:   { '@pearl-framework/events': PEARL_VERSION },
  mail:     { '@pearl-framework/mail': PEARL_VERSION, nodemailer: '^9.0.1' },
  queue:    { '@pearl-framework/queue': PEARL_VERSION, bullmq: '^5.0.0', ioredis: '^5.3.0' },
}

const ORM_DEPS: Record<Orm, Record<string, string>> = {
  drizzle: { 'drizzle-orm': '^0.45.0' },
  prisma:  { '@prisma/client': '^5.0.0' },
  typeorm: { typeorm: '^0.3.29' },
  raw:     {},
}

const ORM_DEV_DEPS: Record<Orm, Record<string, string>> = {
  drizzle: { 'drizzle-kit': '^0.20.0' },
  prisma:  { prisma: '^5.0.0' },
  typeorm: {},
  raw:     {},
}

const DRIVER_DEPS: Record<Driver, Record<string, string>> = {
  postgres: { pg: '^8.11.0' },
  mysql:    { mysql2: '^3.9.0' },
  sqlite:   { 'better-sqlite3': '^9.4.0' },
}

const DRIVER_TYPES: Record<Driver, Record<string, string>> = {
  postgres: { '@types/pg': '^8.11.0' },
  mysql:    {},
  sqlite:   { '@types/better-sqlite3': '^7.6.0' },
}

const MODULE_PROVIDERS: Record<Module, { provider: string; pkg: string } | null> = {
  http:     { provider: 'HttpServiceProvider',     pkg: '@pearl-framework/http' },
  database: { provider: 'DatabaseServiceProvider', pkg: '@pearl-framework/database' },
  events:   { provider: 'EventServiceProvider',    pkg: '@pearl-framework/events' },
  mail:     { provider: 'MailServiceProvider',     pkg: '@pearl-framework/mail' },
  queue:    { provider: 'QueueServiceProvider',    pkg: '@pearl-framework/queue' },
  auth:     { provider: 'AuthServiceProvider',     pkg: '@pearl-framework/auth' },
  validate: { provider: 'ValidateServiceProvider', pkg: '@pearl-framework/validate' },
}

// ─── Selection builders ──────────────────────────────────────────────────

function presetSelection(preset: Exclude<Preset, 'custom'>): Selection {
  return {
    modules:  new Set(PRESETS[preset]),
    security: new Set(SECURITY_PRESETS[preset]),
  }
}

function normalize(sel: Selection): Selection {
  // auth + validate are wired against the HTTP request lifecycle.
  if ((sel.modules.has('auth') || sel.modules.has('validate')) && !sel.modules.has('http')) {
    sel.modules.add('http')
  }
  if (!sel.modules.has('database')) {
    delete sel.db
  }
  // Security middleware is HTTP-only — drop it for worker apps.
  if (!sel.modules.has('http')) {
    sel.security = new Set()
  }
  return sel
}

// ─── Dependency assembly ─────────────────────────────────────────────────

function buildDeps(sel: Selection): { deps: Record<string, string>; dev: Record<string, string> } {
  const deps: Record<string, string> = {
    '@pearl-framework/core': PEARL_VERSION,
    dotenv: '^16.0.0',
  }
  const dev: Record<string, string> = {
    '@pearl-framework/testing': PEARL_VERSION,
    '@types/node': '^20.0.0',
    tsx: '^4.15.0',
    typescript: '^5.4.0',
    vitest: '^3.0.0',
  }
  for (const mod of sel.modules) Object.assign(deps, MODULE_DEPS[mod])
  if (sel.db) {
    Object.assign(deps, ORM_DEPS[sel.db.orm], DRIVER_DEPS[sel.db.driver])
    Object.assign(dev, ORM_DEV_DEPS[sel.db.orm], DRIVER_TYPES[sel.db.driver])
  }
  return { deps, dev }
}

// ─── File templates ──────────────────────────────────────────────────────

function packageJson(name: string, sel: Selection): string {
  const { deps, dev } = buildDeps(sel)
  const entry = sel.modules.has('http') ? 'src/server.ts' : 'src/worker.ts'
  const outEntry = entry.replace('src/', 'dist/').replace('.ts', '.js')
  return JSON.stringify({
    name,
    version: '0.1.0',
    private: true,
    type: 'module',
    scripts: {
      dev:   `tsx watch ${entry}`,
      build: 'tsc',
      start: `node ${outEntry}`,
      test:  'vitest run',
    },
    dependencies: deps,
    devDependencies: dev,
  }, null, 2)
}

function buildProviderImports(sel: Selection): { imports: string[]; registers: string[] } {
  const imports: string[] = []
  const registers: string[] = []
  for (const mod of ALL_MODULES) {
    if (!sel.modules.has(mod)) continue
    const meta = MODULE_PROVIDERS[mod]
    if (!meta) continue
    imports.push(`import { ${meta.provider} } from '${meta.pkg}'`)
    registers.push(`app.register(${meta.provider})`)
  }
  return { imports, registers }
}

function buildSecurityImports(sel: Selection): { imports: string[]; registers: string[] } {
  // Order is intentional: error handler outermost, then cheap header-setters,
  // then CORS (handles OPTIONS preflight), then rate limit so preflight isn't
  // counted against the limit.
  const order: SecurityModule[] = ['errorHandler', 'securityHeaders', 'cors', 'rateLimit']
  const imports: string[] = []
  const registers: string[] = []
  for (const mw of order) {
    if (!sel.security.has(mw)) continue
    if (mw === 'rateLimit') {
      imports.push(`import { apiRateLimit } from './middleware/RateLimit.js'`)
      registers.push(`router.use(apiRateLimit)`)
    } else {
      const className = mw[0]!.toUpperCase() + mw.slice(1)
      imports.push(`import { ${className} } from './middleware/${className}.js'`)
      registers.push(`router.use(new ${className}())`)
    }
  }
  return { imports, registers }
}

function serverTs(sel: Selection): string {
  const { imports: provImports, registers: provRegisters } = buildProviderImports(sel)
  const { imports: secImports, registers: secRegisters } = buildSecurityImports(sel)
  const head = [
    `import 'dotenv/config'`,
    `import { Application } from '@pearl-framework/core'`,
    `import { Router, HttpKernel } from '@pearl-framework/http'`,
    ...provImports,
    ...secImports,
    `import { AppServiceProvider } from './providers/AppServiceProvider.js'`,
  ].join('\n')

  const middlewareBlock = secRegisters.length
    ? `\n${secRegisters.join('\n')}\n`
    : ''

  return `${head}

const app = new Application({ root: import.meta.dirname })
${provRegisters.join('\n')}
app.register(AppServiceProvider)
await app.boot()

const router = new Router()
${middlewareBlock}
router.get('/', async (ctx) => {
  ctx.response.json({ message: 'Welcome to Pearl.js' })
})

router.get('/health', async (ctx) => {
  ctx.response.json({ status: 'ok', timestamp: new Date().toISOString() })
})

const kernel = new HttpKernel({
  onUnhandledError: (err) => console.error('[Pearl] unhandled error:', err),
})
kernel.useRouter(router)

const port = Number(process.env.PORT ?? 3000)
await kernel.listen(port)
console.log(\`\\nPearl.js running on http://localhost:\${port}\\n\`)
`
}

function workerTs(sel: Selection): string {
  const { imports, registers } = buildProviderImports(sel)
  const head = [
    `import 'dotenv/config'`,
    `import { Application } from '@pearl-framework/core'`,
    ...imports,
    `import { AppServiceProvider } from './providers/AppServiceProvider.js'`,
  ].join('\n')

  return `${head}

const app = new Application({ root: import.meta.dirname })
${registers.join('\n')}
app.register(AppServiceProvider)
await app.boot()

console.log('Pearl.js worker running. Press Ctrl+C to stop.')

const shutdown = async (signal: string) => {
  console.log(\`\\nReceived \${signal}, shutting down...\`)
  process.exit(0)
}
process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT',  () => shutdown('SIGINT'))

await new Promise<void>(() => {})
`
}

function entryTs(sel: Selection): string {
  return sel.modules.has('http') ? serverTs(sel) : workerTs(sel)
}

// ─── Security middleware templates ───────────────────────────────────────

const rateLimitMw = `import { RateLimit } from '@pearl-framework/http'

/**
 * Default API rate limit — 100 requests per minute per IP.
 *
 * Tighten for sensitive endpoints by applying a stricter RateLimit at the
 * route level. \`trustProxy\` is OFF by default; turn it on only when this
 * service is behind a controlled proxy that sets X-Forwarded-For.
 */
export const apiRateLimit = new RateLimit({
  windowMs: 60_000,
  max:      100,
})
`

const corsMw = `import type { HttpContext, MiddlewareClass, NextFn } from '@pearl-framework/http'

/**
 * CORS — uses an explicit origin allow-list from CORS_ORIGINS (comma-separated).
 *
 * Reflecting any origin (or returning '*' with credentials) is unsafe; this
 * middleware reflects ONLY the configured origins. Update the env var to add
 * production domains, never set it to '*'.
 */
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

export class Cors implements MiddlewareClass {
  async handle(ctx: HttpContext, next: NextFn): Promise<void> {
    const origin = ctx.request.header('origin')
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
      ctx.response.header('access-control-allow-origin', origin)
      ctx.response.header('access-control-allow-credentials', 'true')
      ctx.response.header('vary', 'Origin')
    }

    if (ctx.request.method === 'OPTIONS') {
      ctx.response.header('access-control-allow-methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
      ctx.response.header('access-control-allow-headers', 'content-type,authorization')
      ctx.response.header('access-control-max-age', '600')
      ctx.response.status(204).send()
      return
    }

    await next()
  }
}
`

const securityHeadersMw = `import type { HttpContext, MiddlewareClass, NextFn } from '@pearl-framework/http'

/**
 * Baseline security headers. Tighten Content-Security-Policy and Permissions-Policy
 * to match the actual surfaces your app exposes — these defaults are deliberately
 * conservative.
 */
export class SecurityHeaders implements MiddlewareClass {
  async handle(ctx: HttpContext, next: NextFn): Promise<void> {
    ctx.response.header('strict-transport-security', 'max-age=31536000; includeSubDomains')
    ctx.response.header('x-content-type-options',    'nosniff')
    ctx.response.header('x-frame-options',           'DENY')
    ctx.response.header('referrer-policy',           'strict-origin-when-cross-origin')
    ctx.response.header('content-security-policy',   "default-src 'self'; frame-ancestors 'none'")
    ctx.response.header('permissions-policy',        'camera=(), microphone=(), geolocation=()')
    await next()
  }
}
`

function errorHandlerMw(sel: Selection): string {
  const hasValidate = sel.modules.has('validate')
  const imports = hasValidate
    ? `import type { HttpContext, MiddlewareClass, NextFn } from '@pearl-framework/http'
import { ValidationException, AuthorizationException } from '@pearl-framework/validate'`
    : `import type { HttpContext, MiddlewareClass, NextFn } from '@pearl-framework/http'`

  const validateBlock = hasValidate
    ? `      if (err instanceof ValidationException) {
        ctx.response.unprocessable(err.errors)
        return
      }
      if (err instanceof AuthorizationException) {
        ctx.response.forbidden(err.message)
        return
      }
`
    : ''

  return `${imports}

/**
 * App-level error handler. Translates known exception types into structured
 * responses. Unknown errors are rethrown so HttpKernel returns a generic 500
 * (no internal details leak to clients).
 *
 * Add APM / logging here — this is the central choke point for failures.
 */
export class ErrorHandler implements MiddlewareClass {
  async handle(ctx: HttpContext, next: NextFn): Promise<void> {
    try {
      await next()
    } catch (err) {
${validateBlock}      console.error('[ErrorHandler]', err)
      throw err
    }
  }
}
`
}

const appProviderTs = `import { ServiceProvider } from '@pearl-framework/core'

export class AppServiceProvider extends ServiceProvider {
  register(): void {
    // Register your app's bindings here
  }

  override async boot(): Promise<void> {
    // Boot logic here
  }
}
`

const tsconfig = JSON.stringify({
  compilerOptions: {
    target:                 'ES2022',
    module:                 'ESNext',
    moduleResolution:       'Bundler',
    lib:                    ['ES2022'],
    outDir:                 './dist',
    declaration:            true,
    experimentalDecorators: true,
    emitDecoratorMetadata:  true,
    skipLibCheck:           true,
    strict:                 true,
  },
  include: ['src/**/*', 'tests/**/*'],
}, null, 2)

const gitignore = `node_modules/
dist/
.env
*.log
.DS_Store
`

const vitestConfig = `import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    timeout: 30000,
  },
})
`

function exampleTest(sel: Selection): string {
  if (sel.modules.has('http')) {
    return `import { describe, it } from 'vitest'

describe('GET /', () => {
  it.todo('returns welcome message')
})
`
  }
  return `import { describe, it } from 'vitest'

describe('worker', () => {
  it.todo('boots without errors')
})
`
}

function envExample(name: string, sel: Selection): string {
  const lines: string[] = [`APP_NAME=${name}`, `APP_ENV=local`]
  if (sel.modules.has('http')) lines.push('PORT=3000')

  if (sel.db) {
    lines.push('', `# Database (${sel.db.driver}, ${sel.db.orm})`)
    if (sel.db.driver === 'sqlite') {
      lines.push(`DB_FILENAME=./data/${name}.sqlite`)
    } else {
      lines.push(
        `DB_HOST=localhost`,
        `DB_PORT=${sel.db.driver === 'postgres' ? '5432' : '3306'}`,
        `DB_USER=${sel.db.driver === 'postgres' ? 'postgres' : 'root'}`,
        `DB_PASSWORD=`,
        `DB_NAME=${name}`,
      )
    }
  }
  if (sel.modules.has('queue')) {
    lines.push('', '# Redis (for queues)', 'REDIS_HOST=localhost', 'REDIS_PORT=6379')
  }
  if (sel.modules.has('auth')) {
    lines.push('', '# JWT', 'JWT_SECRET=change-this-to-a-long-random-secret-min-32-chars')
  }
  if (sel.modules.has('mail')) {
    lines.push(
      '',
      '# Mail',
      'MAIL_DRIVER=log',
      'MAIL_FROM=noreply@example.com',
      'MAIL_HOST=smtp.example.com',
      'MAIL_PORT=587',
      'MAIL_USER=',
      'MAIL_PASS=',
    )
  }
  if (sel.security.has('cors')) {
    lines.push(
      '',
      '# CORS — comma-separated allow-list. Set to your real frontend origins.',
      '# Leave empty in development to disable cross-origin requests entirely.',
      'CORS_ORIGINS=',
    )
  }
  return lines.join('\n') + '\n'
}

function appDirs(sel: Selection): string[] {
  const dirs = ['src/providers', 'config', 'tests']
  if (sel.modules.has('http') || sel.security.size > 0) {
    dirs.push('src/controllers', 'src/middleware')
  }
  if (sel.modules.has('database')) {
    dirs.push('src/models', 'src/schema', 'database/migrations')
  }
  if (sel.modules.has('queue'))    dirs.push('src/jobs')
  if (sel.modules.has('mail'))     dirs.push('src/mail')
  if (sel.modules.has('events'))   dirs.push('src/events', 'src/listeners')
  if (sel.modules.has('validate')) dirs.push('src/requests')
  return dirs
}

// ─── Prompts ──────────────────────────────────────────────────────────────

async function promptSelection(): Promise<Selection> {
  const preset = await select<Preset>({
    message: 'Pick a preset',
    choices: [
      { name: 'api      — http + validate + auth + database', value: 'api' },
      { name: 'worker   — queue + events + mail (no http)',   value: 'worker' },
      { name: 'all      — every Pearl module',                value: 'all' },
      { name: 'minimal  — http only',                          value: 'minimal' },
      { name: 'custom   — pick modules individually',          value: 'custom' },
    ],
    default: 'api',
  })

  let sel: Selection
  if (preset === 'custom') {
    const picked = await checkbox<Module>({
      message: 'Which Pearl modules?',
      choices: [
        { name: 'http      — HTTP server, router, middleware', value: 'http',     checked: true },
        { name: 'auth      — JWT + bcrypt session guards',     value: 'auth' },
        { name: 'validate  — Zod-backed form requests',        value: 'validate' },
        { name: 'database  — ORM-agnostic DB layer',           value: 'database' },
        { name: 'events    — event dispatcher',                value: 'events' },
        { name: 'mail      — nodemailer wrapper',              value: 'mail' },
        { name: 'queue     — BullMQ + Redis',                  value: 'queue' },
      ],
    })
    sel = { modules: new Set(picked), security: new Set() }
  } else {
    sel = presetSelection(preset)
  }

  normalize(sel)

  if (sel.modules.has('http') && preset === 'custom') {
    const picked = await checkbox<SecurityModule>({
      message: 'Which security middleware?',
      choices: [
        { name: 'errorHandler     — translate validation/auth errors to structured responses', value: 'errorHandler',     checked: true },
        { name: 'securityHeaders  — HSTS, CSP, X-Frame-Options, etc.',                          value: 'securityHeaders',  checked: true },
        { name: 'cors             — origin allow-list from CORS_ORIGINS env',                   value: 'cors',             checked: true },
        { name: 'rateLimit        — 100 req/min/IP default, per-route tightening supported',    value: 'rateLimit',        checked: true },
      ],
    })
    sel.security = new Set(picked)
  }

  if (sel.modules.has('database')) {
    const orm = await select<Orm>({
      message: 'Which ORM?',
      choices: [
        { name: 'drizzle — type-safe SQL builder',  value: 'drizzle' },
        { name: 'prisma  — schema-first ORM',       value: 'prisma' },
        { name: 'typeorm — decorator-based ORM',    value: 'typeorm' },
        { name: 'raw     — no ORM, raw driver only', value: 'raw' },
      ],
      default: 'drizzle',
    })
    const driver = await select<Driver>({
      message: 'Which database?',
      choices: [
        { name: 'postgres — production-grade Postgres',  value: 'postgres' },
        { name: 'mysql    — MySQL / MariaDB',            value: 'mysql' },
        { name: 'sqlite   — file-based, zero-config',    value: 'sqlite' },
      ],
      default: 'postgres',
    })
    sel.db = { orm, driver }
  }

  return sel
}

// ─── Flag parsing for non-interactive mode ───────────────────────────────

interface RawFlags {
  preset?: string
  modules?: string
  db?: string
  orm?: string
  security?: string
  yes?: boolean
}

function selectionFromFlags(flags: RawFlags): Selection {
  let sel: Selection

  if (flags.modules) {
    const requested = flags.modules.split(',').map((s) => s.trim()).filter(Boolean) as Module[]
    for (const m of requested) {
      if (!ALL_MODULES.includes(m)) throw new Error(`Unknown module: ${m}`)
    }
    // Default security stack on for HTTP-bearing module selections. Caller can
    // override with --security (incl. --security= for none).
    const defaultSecurity: SecurityModule[] = requested.includes('http')
      ? ['errorHandler', 'securityHeaders', 'cors', 'rateLimit']
      : []
    sel = { modules: new Set(requested), security: new Set(defaultSecurity) }
  } else if (flags.preset && flags.preset !== 'custom') {
    if (!(flags.preset in PRESETS)) throw new Error(`Unknown preset: ${flags.preset}`)
    sel = presetSelection(flags.preset as Exclude<Preset, 'custom'>)
  } else {
    sel = presetSelection('minimal')
  }

  if (flags.db || flags.orm) {
    sel.modules.add('database')
    const orm = (flags.orm ?? 'drizzle') as Orm
    const driver = (flags.db ?? 'postgres') as Driver
    if (!ALL_ORMS.includes(orm)) throw new Error(`Unknown ORM: ${orm}`)
    if (!ALL_DRIVERS.includes(driver)) throw new Error(`Unknown driver: ${driver}`)
    sel.db = { orm, driver }
  } else if (sel.modules.has('database')) {
    sel.db = { orm: 'drizzle', driver: 'postgres' }
  }

  if (flags.security !== undefined) {
    const requested = flags.security.split(',').map((s) => s.trim()).filter(Boolean) as SecurityModule[]
    for (const m of requested) {
      if (!ALL_SECURITY.includes(m)) throw new Error(`Unknown security middleware: ${m}`)
    }
    sel.security = new Set(requested)
  }

  return normalize(sel)
}

// ─── Summary ──────────────────────────────────────────────────────────────

function printSummary(name: string, sel: Selection, pm: string): void {
  const mods = ALL_MODULES.filter((m) => sel.modules.has(m)).join(', ') || '(none)'
  const sec  = ALL_SECURITY.filter((s) => sel.security.has(s)).join(', ') || '(none)'
  const dbLine = sel.db ? `${sel.db.orm} on ${sel.db.driver}` : '(none)'
  const { deps, dev } = buildDeps(sel)
  const totals = `${Object.keys(deps).length} runtime + ${Object.keys(dev).length} dev`

  console.log(`\n${chalk.bold('You\'ll get:')}\n`)
  console.log(`  ${chalk.dim('Name      ')} ${chalk.cyan(name)}`)
  console.log(`  ${chalk.dim('Modules   ')} ${mods}`)
  console.log(`  ${chalk.dim('Database  ')} ${dbLine}`)
  console.log(`  ${chalk.dim('Security  ')} ${sec}`)
  console.log(`  ${chalk.dim('Pkg mgr   ')} ${pm}`)
  console.log(`  ${chalk.dim('Deps      ')} ${totals}\n`)
}

// ─── Command ──────────────────────────────────────────────────────────────

export function newApp(program: Command): void {
  program
    .command('new <n>')
    .description('Scaffold a new Pearl.js application')
    .option('--preset <preset>',   'api | worker | all | minimal | custom')
    .option('--modules <list>',    'Comma-separated module list (e.g. http,queue,mail)')
    .option('--db <driver>',       'postgres | mysql | sqlite')
    .option('--orm <orm>',         'drizzle | prisma | typeorm | raw')
    .option('--security <list>',   'Comma-separated: errorHandler,securityHeaders,cors,rateLimit (empty = none)')
    .option('-y, --yes',           'Skip prompts, accept defaults')
    .option('--no-install',        'Skip dependency install')
    .option('--npm',  'Use npm')
    .option('--yarn', 'Use yarn')
    .option('--pnpm', 'Use pnpm')
    .action(async (
      name: string,
      options: RawFlags & { install: boolean; npm?: boolean; yarn?: boolean; pnpm?: boolean },
    ) => {
      const appDir = path.resolve(process.cwd(), name)

      console.log(`\n${chalk.bold.hex('#a855f7')('Pearl.js')} ${chalk.dim('— The TypeScript framework that does it right.')}\n`)

      if (fs.existsSync(appDir)) {
        const overwrite = options.yes
          ? false
          : await confirm({
              message: `Directory ${chalk.cyan(name)} already exists. Overwrite?`,
              default: false,
            })
        if (!overwrite) {
          console.log(chalk.dim('\nAborted.'))
          process.exit(0)
        }
        fs.rmSync(appDir, { recursive: true })
      }

      let pm = 'npm'
      if (options.pnpm) pm = 'pnpm'
      else if (options.yarn) pm = 'yarn'
      else if (options.npm) pm = 'npm'
      else {
        try { execSync('pnpm --version', { stdio: 'ignore' }); pm = 'pnpm' } catch { /* keep npm */ }
      }

      // ─── Resolve selection ─────────────────────────────────────────────
      const useFlags = options.yes || options.preset || options.modules || options.db || options.orm || options.security !== undefined
      let sel: Selection
      try {
        sel = useFlags ? selectionFromFlags(options) : await promptSelection()
      } catch (err) {
        console.error(chalk.red(`\n${(err as Error).message}\n`))
        process.exit(1)
      }

      printSummary(name, sel, pm)

      if (!options.yes) {
        const proceed = await confirm({ message: 'Proceed?', default: true })
        if (!proceed) {
          console.log(chalk.dim('\nAborted.'))
          process.exit(0)
        }
      }

      // ─── Scaffold ────────────────────────────────────────────────────────
      const spinner = ora(`Scaffolding ${chalk.cyan(name)}`).start()

      for (const dir of appDirs(sel)) {
        fs.mkdirSync(path.join(appDir, dir), { recursive: true })
      }

      const entryFile = sel.modules.has('http') ? 'src/server.ts' : 'src/worker.ts'
      const files: [string, string][] = [
        ['package.json',                        packageJson(name, sel)],
        ['tsconfig.json',                       tsconfig],
        ['.env.example',                        envExample(name, sel)],
        ['.gitignore',                          gitignore],
        [entryFile,                             entryTs(sel)],
        ['src/providers/AppServiceProvider.ts', appProviderTs],
        ['vitest.config.ts',                    vitestConfig],
        ['tests/example.test.ts',               exampleTest(sel)],
      ]

      if (sel.security.has('rateLimit'))       files.push(['src/middleware/RateLimit.ts',       rateLimitMw])
      if (sel.security.has('cors'))            files.push(['src/middleware/Cors.ts',            corsMw])
      if (sel.security.has('securityHeaders')) files.push(['src/middleware/SecurityHeaders.ts', securityHeadersMw])
      if (sel.security.has('errorHandler'))    files.push(['src/middleware/ErrorHandler.ts',    errorHandlerMw(sel)])

      for (const [file, content] of files) {
        fs.writeFileSync(path.join(appDir, file), content, 'utf8')
      }

      fs.copyFileSync(path.join(appDir, '.env.example'), path.join(appDir, '.env'))

      spinner.succeed(`Scaffolded ${chalk.cyan(name)}`)

      // ─── Install ─────────────────────────────────────────────────────────
      if (options.install !== false) {
        const installSpinner = ora(`Installing dependencies with ${chalk.cyan(pm)}...`).start()
        try {
          execSync(`${pm} install`, { cwd: appDir, stdio: 'pipe' })
          installSpinner.succeed('Dependencies installed')
        } catch {
          installSpinner.warn(`${pm} install failed — run it manually.`)
        }
      }

      // ─── Done ─────────────────────────────────────────────────────────────
      console.log(`\n${chalk.bold.green('Done!')} Your Pearl app is ready.\n`)
      console.log(`${chalk.dim('Next steps:')}\n`)
      console.log(`  ${chalk.cyan(`cd ${name}`)}`)
      if (options.install === false) {
        console.log(`  ${chalk.cyan(`${pm} install`)}`)
      }
      console.log(`  ${chalk.cyan('cp .env.example .env')}   ${chalk.dim('# configure environment')}`)
      const devHint = sel.modules.has('http') ? '# start the dev server' : '# start the worker'
      console.log(`  ${chalk.cyan(`${pm} run dev`)}           ${chalk.dim(devHint)}\n`)
      console.log(`${chalk.dim('Docs:')} ${chalk.underline('https://pearljs.dev')}\n`)
    })
}
