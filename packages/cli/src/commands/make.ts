import chalk from 'chalk';
import { Command } from 'commander';
import path from 'path';
import { templates } from '../templates/index.js';
import { fileExists, resolveAppPath, writeFile } from '../utils/fs.js';
import { stripSuffix, toPascalCase, toSnakeCase } from '../utils/naming.js';

function printCreated(filePath: string): void {
    const rel = path.relative(process.cwd(), filePath);
    console.log(`  ${chalk.green('✔')} Created: ${chalk.cyan(rel)}`);
}

function printSkipped(filePath: string, reason: string): void {
    const rel = path.relative(process.cwd(), filePath);
    console.log(`  ${chalk.yellow('⚠')} Skipped: ${chalk.dim(rel)} ${chalk.yellow(`(${reason})`)}`);
}

function safeWrite(filePath: string, content: string, force = false): void {
    if (fileExists(filePath) && !force) {
        printSkipped(filePath, 'already exists — use --force to overwrite');
        return;
    }
    writeFile(filePath, content);
    printCreated(filePath);
}

// make:controller

export function makeController(program: Command): void {
    program
        .command('make:controller <name>')
        .description('Generate a new controller')
        .option('-r, --resource', 'Generate a resourceful controller with CRUD methods')
        .option('-f, --force', 'Overwrite if file already exists')
        .action((name: string, options: { resource?: boolean; force?: boolean }) => {
            const className = toPascalCase(stripSuffix(name, 'Controller')) + 'Controller';
            const baseName = stripSuffix(toPascalCase(name), 'Controller');
            const filePath = resolveAppPath('src', 'controllers', `${className}.ts`);

            console.log(`\n${chalk.bold('pearl make:controller')} ${chalk.cyan(className)}\n`);
            safeWrite(filePath, templates.controller(baseName, options.resource ?? false), options.force);
            console.log();
        });
}

// make:model

export function makeModel(program: Command): void {
    program
       .command('make:model <name>')
        .description('Generate a new model')
        .option('-m, --migration', 'Also generate a migration for this model')
        .option('-f, --force', 'Overwrite if file already exists')
        .action((name: string, options: { migration?: boolean; force?: boolean }) => {
            const className = toPascalCase(stripSuffix(name, 'Model'));
            const tableName = toSnakeCase(className) + 's';
            const filePath = resolveAppPath('src', 'models', `${className}.ts`);

            console.log(`\n${chalk.bold('pearl make:model')} ${chalk.cyan(className)}\n`);
            safeWrite(filePath, templates.model(className, tableName), options.force);

            if (options.migration) {
                const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 14);
                const migrationName = `Create${className}sTable`;
                const migrationFile = resolveAppPath('src', 'database', 'migrations', `${timestamp}_create_${tableName}_table.ts`);
                safeWrite(migrationFile, templates.migration(migrationName, tableName), options.force);
            }

            console.log();
        });
}

// make:migration

export function makeMigration(program: Command): void {
    program
        .command('make:migration <name>')
        .description('Generate a new database migration')
        .option('--table <table>', 'The table to migrate')
        .option('--create <table>', 'The table to be created')
        .option('-f, --force', 'Overwrite if file already exists')
        .action((name: string, options: { table?: string; create?: string; force?: boolean }) => {
            const className = toPascalCase(name);
            const tableName = options.create ?? options.table ?? toSnakeCase(className);
            const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 14);
            const fileName = `${timestamp}_${toSnakeCase(name)}`;
            const filePath = resolveAppPath('src', 'database', 'migrations', `${fileName}.ts`);

            console.log(`\n${chalk.bold('pearl make:migration')} ${chalk.cyan(className)}\n`);
            safeWrite(filePath, templates.migration(className, tableName), options.force);
            console.log();
        });
}

// make:middleware

export function makeMiddleware(program: Command): void {
    program
        .command('make:middleware <name>')
        .description('Generate a new middleware')
        .option('-f, --force', 'Overwrite if file already exists')
        .action((name: string, options: { force?: boolean }) => {
            const className = toPascalCase(stripSuffix(name, 'Middleware'));
            const filePath = resolveAppPath('src', 'middleware', `${className}Middleware.ts`);

            console.log(`\n${chalk.bold('pearl make:middleware')} ${chalk.cyan(className + 'Middleware')}\n`);
            safeWrite(filePath, templates.middleware(className), options.force);
            console.log();
        });
}

// make:job

export function makeJob(program: Command): void {
    program
        .command('make:job <name>')
        .description('Generate a new queue job')
        .option('-f, --force', 'Overwrite if file already exists')
        .action((name: string, options: { force?: boolean }) => {
            const className = toPascalCase(stripSuffix(name, 'Job'));
            const filePath = resolveAppPath('src', 'jobs', `${className}Job.ts`);

            console.log(`\n${chalk.bold('pearl make:job')} ${chalk.cyan(className + 'Job')}\n`);
            safeWrite(filePath, templates.job(className), options.force);
            console.log();
        });
}

// make:mail

export function makeMail(program: Command): void {
    program
        .command('make:mail <name>')
        .description('Generate a new mailable class')
        .option('-f, --force', 'Overwrite if file already exists')
        .action((name: string, options: { force?: boolean }) => {
            const className = toPascalCase(stripSuffix(name, 'Mail'));
            const filePath = resolveAppPath('src', 'mail', `${className}Mail.ts`);

            console.log(`\n${chalk.bold('pearl make:mail')} ${chalk.cyan(className + 'Mail')}\n`);
            safeWrite(filePath, templates.mail(className), options.force);
            console.log();
        });
}

// make:event

export function makeEvent(program: Command): void {
    program
        .command('make:event <name>')
        .description('Generate a new event class')
        .option('-f, --force', 'Overwrite if file already exists')
        .action((name: string, options: { force?: boolean }) => {
            const className = toPascalCase(stripSuffix(name, 'Event'));
            const filePath = resolveAppPath('src', 'events', `${className}Event.ts`);

            console.log(`\n${chalk.bold('pearl make:event')} ${chalk.cyan(className + 'Event')}\n`);
            safeWrite(filePath, templates.event(className), options.force);
            console.log();
        });
}

// make:listener

export function makeListener(program: Command): void {
    program
        .command('make:listener <name>')
        .description('Generate a new event listener')
        .option('--event <event>', 'The event class this listener handles')
        .option('-f, --force', 'Overwrite if file already exists')
        .action((name: string, options: { event?: string; force?: boolean }) => {
            const className = toPascalCase(stripSuffix(name, 'Listener'));
            const eventName = options.event ? toPascalCase(stripSuffix(options.event, 'Event')) : 'SomeEvent';
            const filePath = resolveAppPath('src', 'listeners', `${className}Listener.ts`);

            console.log(`\n${chalk.bold('pearl make:listener')} ${chalk.cyan(className + 'Listener')}\n`);
            safeWrite(filePath, templates.listener(className, eventName), options.force);
            console.log();
        });
}

// make:request

export function makeRequest(program: Command): void {
    program
        .command('make:request <name>')
        .description('Generate a new FormRequest validation class')
        .option('-f, --force', 'Overwrite if file already exists')
        .action((name: string, options: { force?: boolean }) => {
            const className = toPascalCase(stripSuffix(name, 'Request'));
            const filePath = resolveAppPath('src', 'requests', `${className}Request.ts`);

            console.log(`\n${chalk.bold('pearl make:request')} ${chalk.cyan(className + 'Request')}\n`);
            safeWrite(filePath, templates.request(className), options.force);
            console.log();
        });
}

// make:resource

export function makeResource(program: Command): void {
    program
        .command('make:resource <name>')
        .description('Generate a new ApiResource transformer')
        .option('-f, --force', 'Overwrite if file already exists')
        .action((name: string, options: { force?: boolean }) => {
            const className = toPascalCase(stripSuffix(name, 'Resource'));
            const filePath = resolveAppPath('src', 'resources', `${className}Resource.ts`);

            console.log(`\n${chalk.bold('pearl make:resource')} ${chalk.cyan(className + 'Resource')}\n`);
            safeWrite(filePath, templates.resource(className), options.force);
            console.log();
        });
}