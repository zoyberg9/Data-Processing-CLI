import path from 'node:path'
import os from 'node:os'
import interactive from './repl.js'

const currentWorkingDirectory = path.resolve('')

console.log('Welcome to Data Processing CLI! ');
console.log(`\nYou are currently in ${os.homedir()} `)

interactive()
