import path from 'node:path'
import os from 'node:os'
import { interactive } from './repl.js'

const context = { cwd: os.homedir() }

console.log('Welcome to Data Processing CLI! ');
console.log(`\nYou are currently in ${context.cwd} `)

interactive(context)
