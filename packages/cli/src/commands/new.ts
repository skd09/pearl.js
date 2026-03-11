import chalk from 'chalk'
import { Command } from 'commander'
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import ora from 'ora'
import { confirm, select } from '@inquirer/prompts'

const APP_DIRS = [
  'src/controllers',
  'src/models',
  'src/middleware',
  'src/jobs',
  'src/mail',
  'src/events',
  'src/listeners',
  'src/requests',
  'src/providers',
  'src/schema',
  'config',
  'database/migrations',
  'tests',
]

const packageJson = (name: string) => JSON.stringify({
  name,
  version: '0.1.0',
  private: true,
  type: 'module',
  scripts: {
    dev:   'tsx watch src/server.ts',
    build: 'tsc',
    start: 'node dist/server.js',
    test:  'vitest run',
  },
  dependencies: {
    '@pearl-framework/pearl': '^0.1.2',
    'drizzle-orm': '^0.45.0',
    'zod':         '^3.23.0',
    'dotenv':      '^16.0.0',
  },
  devDependencies: {
    '@pearl-framework/testing': '^0.1.0',
    '@types/node': '^20.0.0',
    'tsx':         '^4.15.0',
    'typescript':  '^5.4.0',
    'vitest':      '^1.6.0',
  },
}, null, 2)

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

const envExample = (name: string) => `APP_NAME=${name}
APP_ENV=local
PORT=3000

# Database (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=${name}

# Redis (for queues)
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=change-this-to-a-long-random-secret-min-32-chars

# Mail
MAIL_DRIVER=log
MAIL_FROM=noreply@example.com
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USER=
MAIL_PASS=
`

const gitignore = `node_modules/
dist/
.env
*.log
.DS_Store
`

const serverTs = `import 'dotenv/config'
import { Application } from '@pearl-framework/pearl'
import { Router, HttpKernel } from '@pearl-framework/pearl'
import { AppServiceProvider } from './providers/AppServiceProvider.js'

const app = new Application({ root: import.meta.dirname })
app.register(AppServiceProvider)
await app.boot()

const router = new Router()

router.get('/', async (ctx) => {
  ctx.response.json({ message: 'Welcome to Pearl.js 🦪' })
})

router.get('/health', async (ctx) => {
  ctx.response.json({ status: 'ok', timestamp: new Date().toISOString() })
})

const kernel = new HttpKernel()
kernel.useRouter(router)

const port = Number(process.env.PORT ?? 3000)
await kernel.listen(port)
console.log(\`\\n🦪 Pearl running → http://localhost:\${port}\\n\`)
`

const appProviderTs = `import { ServiceProvider } from '@pearl-framework/pearl'

export class AppServiceProvider extends ServiceProvider {
  register(): void {
    // Register your app's bindings here
  }

  override async boot(): Promise<void> {
    // Boot logic here
  }
}
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

const exampleTest = `import { describe, it } from 'vitest'

describe('GET /', () => {
  it.todo('returns welcome message')
})
`

export function newApp(program: Command): void {
  program
    .command('new <n>')
    .description('Scaffold a new Pearl.js application')
    .option('--no-install', 'Skip npm install')
    .option('--npm',  'Use npm')
    .option('--yarn', 'Use yarn')
    .option('--pnpm', 'Use pnpm')
    .action(async (name: string, options: { install: boolean; npm?: boolean; yarn?: boolean; pnpm?: boolean }) => {
      const appDir = path.resolve(process.cwd(), name)

      console.log(`\n${chalk.bold.hex('#a855f7')('◆ Pearl.js')} ${chalk.dim('— The TypeScript framework that does it right.')}\n`)

      // ─── Check if dir exists ────────────────────────────────────────────
      if (fs.existsSync(appDir)) {
        const overwrite = await confirm({
          message: `Directory ${chalk.cyan(name)} already exists. Overwrite?`,
          default: false,
        })
        if (!overwrite) {
          console.log(chalk.dim('\nAborted.'))
          process.exit(0)
        }
        fs.rmSync(appDir, { recursive: true })
      }

      // ─── Detect package manager ─────────────────────────────────────────
      let pm = 'npm'
      if (options.pnpm) pm = 'pnpm'
      else if (options.yarn) pm = 'yarn'
      else if (options.npm) pm = 'npm'
      else {
        try { execSync('pnpm --version', { stdio: 'ignore' }); pm = 'pnpm' } catch {}
      }

      // ─── Scaffold ────────────────────────────────────────────────────────
      const spinner = ora(`Scaffolding ${chalk.cyan(name)}`).start()

      for (const dir of APP_DIRS) {
        fs.mkdirSync(path.join(appDir, dir), { recursive: true })
      }

      const envContent = envExample(name)

      const files: [string, string][] = [
        ['package.json',                        packageJson(name)],
        ['tsconfig.json',                       tsconfig],
        ['.env.example',                        envContent],
        ['.gitignore',                          gitignore],
        ['src/server.ts',                       serverTs],
        ['src/providers/AppServiceProvider.ts', appProviderTs],
        ['vitest.config.ts',                    vitestConfig],
        ['tests/example.test.ts',               exampleTest],
      ]

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
      console.log(`\n${chalk.bold.green('✔ Done!')} Your Pearl app is ready.\n`)
      console.log(`${chalk.dim('Next steps:')}\n`)
      console.log(`  ${chalk.cyan(`cd ${name}`)}`)
      if (options.install === false) {
        console.log(`  ${chalk.cyan(`${pm} install`)}`)
      }
      console.log(`  ${chalk.cyan('cp .env.example .env')}   ${chalk.dim('# configure your database + redis')}`)
      console.log(`  ${chalk.cyan(`${pm} run dev`)}           ${chalk.dim('# start the dev server')}\n`)
      console.log(`${chalk.dim('Docs:')} ${chalk.underline('https://pearljs.dev')}\n`)
    })
}