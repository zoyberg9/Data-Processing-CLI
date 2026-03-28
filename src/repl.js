import * as readline from 'node:readline/promises';
import os from 'node:os'
import { up } from './navigation.js'

export const interactive = (context) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  rl.setPrompt('>')
  rl.prompt()

  const commandRouter = {
    up,
    cd: () => {},
    ls: () => {}
  }

  rl.on('line', (input) => {
    if (input === '.exit') {
      rl.close();
      return;
    }
    const parts = input.trim().split(' ')
    const commandName = parts[0]
    const args = parts.slice(1)

    const handler = commandRouter[commandName]

    if (handler) {
        handler(args, context)
    } else {
        console.log('Invalid input')
    }

    rl.prompt()
  })

  rl.on("close", () => {
    console.log("\nThank you for using Data Processing CLI!");
    process.exit();
  })
}


