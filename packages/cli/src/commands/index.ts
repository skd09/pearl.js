#! /usr/bin/env node

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';

import { makeController } from './make.js';
import { makeEvent } from './make.js';
import { makeJob } from './make.js';
import { makeListener } from './make.js';
import { makeMail } from './make.js';
import { makeMiddleware } from './make.js';
import { makeMigration } from './make.js';
import { makeModel } from './make.js';
import { makeRequest } from './make.js';
import { makeResource } from './make.js';
import { newApp } from './new.js';
import { serve } from './serve.js';
import { listCommands } from './list.js';

const pkg = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf-8'));

const program = new Command();

program
  .name('pearl')
  .description(chalk.magenta('The TypeScript framework that does it right.'))
  .version(pkg.version, '-v, --version', 'Output the current version');

// Register all commands
newApp(program);
serve(program);
listCommands(program);

makeController(program);
makeModel(program);
makeMigration(program);
makeMiddleware(program);
makeJob(program);
makeMail(program);
makeEvent(program);
makeListener(program);
makeRequest(program);
makeResource(program);

// Show help if no command provided
if (process.argv.length <= 2) {
    program.help();
}

program.parse(process.argv);