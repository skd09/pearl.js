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
            const mainFile = path.resolve(process.cwd(), 'src/main.ts');

            if (!fs.existsSync(mainFile)) {
                console.error(`\n${chalk.red('✘')} Could not find ${chalk.cyan('src/main.ts')}. Are you inside a Pearl project?\n`);
                process.exit(1);
            }

            console.log(`\n${chalk.bold.magenta('Pearl.js')} ${chalk.dim('dev server')}`);
            console.log(`${chalk.dim('─────────────────────────────────────')}`);
            console.log(`  ${chalk.dim('Host')}    ${chalk.cyan(`http://${options.host}:${options.port}`)}`);
            console.log(`  ${chalk.dim('Entry')}   ${chalk.cyan('src/main.ts')}`);
            console.log(`${chalk.dim('─────────────────────────────────────')}\n`);

            const env = {
                ...process.env,
                APP_PORT: options.port,
                APP_HOST: options.host,
            };

            const child = spawn(
                'npx',
                ['ts-node-dev', '--respawn', '--transpile-only', 'src/main.ts'],
                { env, stdio: 'inherit', cwd: process.cwd() }
            );

            child.on('error', (err) => {
                console.error(chalk.red(`\n✘ Failed to start server: ${err.message}`));
                console.error(chalk.dim('Make sure ts-node-dev is installed: npm install -D ts-node-dev'));
                process.exit(1);
            });

            child.on('exit', (code) => {
                if (code !== 0) process.exit(code ?? 1);
            });
        });
}