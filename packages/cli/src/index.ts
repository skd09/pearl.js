#!/usr/bin/env node
import { Command } from 'commander'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import chalk from 'chalk'

import {
  makeController, makeEvent, makeJob, makeListener,
  makeMail, makeMiddleware, makeMigration, makeModel,
  makeRequest, makeResource,
} from './commands/make.js'
import { newApp } from './commands/new.js'
import { serve } from './commands/serve.js'
import { listCommands } from './commands/list.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const require = createRequire(import.meta.url)
const pkg = require(join(__dirname, '../package.json')) as { version: string }

const program = new Command()

program
  .name('pearl')
  .description(chalk.magenta('The TypeScript framework that does it right.'))
  .version(pkg.version, '-v, --version', 'Output the current version')

newApp(program)
serve(program)
listCommands(program)

makeController(program)
makeModel(program)
makeMigration(program)
makeMiddleware(program)
makeJob(program)
makeMail(program)
makeEvent(program)
makeListener(program)
makeRequest(program)
makeResource(program)

if (process.argv.length <= 2) {
  program.help()
}

program.parse(process.argv)