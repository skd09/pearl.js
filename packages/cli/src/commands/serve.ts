import chalk from 'chalk';
import { Command } from 'commander';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

export function serve(program: Command): void {
    program
        .command('serve')
        .description('Start the development server with hot reload')
        .option('-p, --port <port>', 'Port to listen on', '3000')
        .option('--host <host>', 'Host to bind to', 'localhost')
        .action((options: { port: string; host: string }) => {
            // Support both src/server.ts (default scaffold) and src/main.ts
            const candidates = ['src/server.ts', 'src/main.ts']
            const mainFile = candidates
                .map((c) => path.resolve(process.cwd(), c))
                .find((f) => fs.existsSync(f))

            if (!mainFile) {
                console.error(`\n${chalk.red('✘')} Could not find ${chalk.cyan('src/server.ts')} or ${chalk.cyan('src/main.ts')}. Are you inside a Pearl project?\n`);
                process.exit(1);
            }

            const entryRelative = path.relative(process.cwd(), mainFile)

            console.log(`\n${chalk.bold.magenta('Pearl.js')} ${chalk.dim('dev server')}`);
            console.log(`${chalk.dim('─────────────────────────────────────')}`);
            console.log(`  ${chalk.dim('Host')}    ${chalk.cyan(`http://${options.host}:${options.port}`)}`);
            console.log(`  ${chalk.dim('Entry')}   ${chalk.cyan(entryRelative)}`);
            console.log(`${chalk.dim('─────────────────────────────────────')}\n`);

            const env = {
                ...process.env,
                APP_PORT: options.port,
                APP_HOST: options.host,
            };

            const child = spawn(
                'npx',
                ['tsx', 'watch', entryRelative],
                { env, stdio: 'inherit', cwd: process.cwd() }
            );

            child.on('error', (err) => {
                console.error(chalk.red(`\n✘ Failed to start server: ${err.message}`));
                console.error(chalk.dim('Make sure tsx is installed: npm install -D tsx'));
                process.exit(1);
            });

            child.on('exit', (code) => {
                if (code !== 0) process.exit(code ?? 1);
            });
        });
}