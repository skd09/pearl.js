import chalk from 'chalk';
import { Command } from 'commander';

export function listCommands(program: Command): void {
  program
    .command('list')
    .description('List all available Pearl CLI commands')
    .action(() => {
        console.log(`\n${chalk.bold.magenta('Pearl.js CLI')} ${chalk.dim('— Available Commands')}\n`);

        const groups: Record<string, Array<[string, string]>> = {
            'Application': [
            ['pearl new <name>', 'Scaffold a new Pearl.js application'],
            ['pearl serve', 'Start the development server with hot reload'],
            ['pearl list', 'List all available commands'],
            ],
            'Generators': [
            ['pearl make:controller <name>', 'Generate a controller [-r for resourceful]'],
            ['pearl make:model <name>', 'Generate a model [-m to also make migration]'],
            ['pearl make:migration <name>', 'Generate a database migration'],
            ['pearl make:middleware <name>', 'Generate a middleware class'],
            ['pearl make:job <name>', 'Generate a BullMQ queue job'],
            ['pearl make:mail <name>', 'Generate a mailable class'],
            ['pearl make:event <name>', 'Generate an event class'],
            ['pearl make:listener <name>', 'Generate an event listener [--event <EventName>]'],
            ['pearl make:request <name>', 'Generate a FormRequest validation class'],
            ['pearl make:resource <name>', 'Generate an ApiResource transformer'],
            ],
        };

        for (const [group, commands] of Object.entries(groups)) {
            console.log(chalk.bold.yellow(`  ${group}`));
            for (const [cmd, desc] of commands) {
            console.log(`    ${chalk.cyan(cmd.padEnd(42))} ${chalk.dim(desc)}`);
            }
            console.log();
        }

        console.log(chalk.dim('  Use --force on any make:* command to overwrite existing files.\n'));
    });
}