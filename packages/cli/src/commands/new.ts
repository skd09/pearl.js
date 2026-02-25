import chalk from 'chalk';
import { Command } from 'commander';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import prompts from 'prompts'; 

const APP_STRUCTURE = [
    'src/controllers',
    'src/models',
    'src/middleware',
    'src/jobs',
    'src/mail',
    'src/events',
    'src/listeners',
    'src/requests',
    'src/resources',
    'src/routes',
    'src/database/migrations',
    'src/database/seeders',
    'src/config',
    'tests',
];

const PACKAGE_JSON = (name: string) => JSON.stringify({
    name,
    version: "0.1.0",
    private: true,
    scripts: {
        dev: "ts-node-dev --respawn src/main.ts",
        build: "tsc",
        start: "node dist/main.js",
        test: "pearl test"
    },
    dependencies: {
        "@pearl/core": "^0.1.0"
    },
    devDependencies: {
        '@types/node': '^20.0.0',
        'ts-node-dev': '^2.0.0',
        typescript: '^5.4.0',
    }
}, null, 2);

const TSCONFIG = JSON.stringify({
    compilerOptions: {
        target: 'ES2020',
        module: 'commonjs',
        lib: ['ES2020'],
        outDir: './dist',
        rootDir: './src',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
    },
    include: ['src/**/*'],
    exclude: ['node_modules', 'dist'],
}, null, 2);


const ENV_EXAMPLE = `APP_NAME=Pearl
APP_ENV=local
APP_PORT=3000
APP_KEY=

DB_CONNECTION=sqlite
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=pearl
DB_USERNAME=root
DB_PASSWORD=

QUEUE_CONNECTION=redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

MAIL_DRIVER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
`;


const MAIN_TS = `import { Pearl } from '@pearl/core';
import { router } from './routes/api';

const app = new Pearl();

app.useRouter(router);

app.listen(process.env.APP_PORT ?? 3000, () => {
  console.log(\`Pearl running on http://localhost:\${process.env.APP_PORT ?? 3000}\`);
});
`;

const ROUTES_TS = `import { Router } from '@pearl/core';

export const router = new Router();

router.get('/', async (req, res) => {
  res.json({ message: 'Welcome to Pearl.js 🦪' });
});
`;

const GITIGNORE = `node_modules/
dist/
.env
*.log
`;

export function newApp(program: Command): void {
  program
    .command('new <n>')
    .description('Scaffold a new Pearl.js application')
    .option('--no-install', 'Skip npm install')
    .action(async (name: string, options: { install: boolean }) => {
        const appDir = path.resolve(process.cwd(), name);

        console.log(`\n${chalk.bold.magenta('Pearl.js')} ${chalk.dim('— The TypeScript framework that does it right.')}\n`);

        if (fs.existsSync(appDir)) {
            const { overwrite } = await prompts({
                type: 'confirm',
                name: 'overwrite',
                message: `Directory ${chalk.cyan(name)} already exists. Continue?`,
                initial: false,
                });
            if (!overwrite) {
                console.log(chalk.dim('Aborted.'));
                process.exit(0);
            }
        }

        console.log(`${chalk.green('✔')} Scaffolding ${chalk.cyan(name)}...\n`);

        // Create directories
        for (const dir of APP_STRUCTURE) {
            fs.mkdirSync(path.join(appDir, dir), { recursive: true });
        }

        // Write files
        const files: [string, string][] = [
            ['package.json', PACKAGE_JSON(name)],
            ['tsconfig.json', TSCONFIG],
            ['.env.example', ENV_EXAMPLE],
            ['.gitignore', GITIGNORE],
            ['src/main.ts', MAIN_TS],
            ['src/routes/api.ts', ROUTES_TS],
        ];

        for (const [file, content] of files) {
            const filePath = path.join(appDir, file);
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`  ${chalk.green('✔')} ${file}`);
        }

        // Copy .env.example → .env
        fs.copyFileSync(path.join(appDir, '.env.example'), path.join(appDir, '.env'));
        console.log(`  ${chalk.green('✔')} .env`);

        if (options.install) {
            console.log(`\n${chalk.dim('Installing dependencies...')}\n`);
            try {
                execSync('npm install', { cwd: appDir, stdio: 'inherit' });
            } catch {
                console.log(chalk.yellow('\n npm install failed — run it manually inside the project folder.'));
            }
        }

        console.log(`\n${chalk.bold.green('✔ Application created successfully!')}\n`);
        console.log(`${chalk.dim('Next steps:')}`);
        console.log(`${chalk.cyan(`cd ${name}`)}`);
        if (!options.install) console.log(`  ${chalk.cyan('npm install')}`);
        console.log(`${chalk.cyan('pearl serve')}\n`);
    });
}