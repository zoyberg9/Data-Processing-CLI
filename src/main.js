import * as readline from 'node:readline/promises';
import os from 'node:os'
import path from 'node:path'
import { dispatchCommand } from './repl.js'

const context = { cwd: os.homedir() }

const interactive = () => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  console.log('Welcome to Data Processing CLI!');
  console.log(`You are currently in ${context.cwd} `)
  rl.setPrompt('>');
  rl.prompt();

  rl.on('line', async (input) => {
    if (input.trim() === '.exit') {
      rl.close()
    } else {
      const result = await dispatchCommand(input, context);

      if (result?.error) {
        console.log(result.error)
      } else if (result?.data) {
        if (Array.isArray(result.data)) {
          result.data.forEach(line => console.log(line))
        } else {
          console.log(result.data)
        }
      }
    }
    rl.prompt()
  })

  rl.on('close', () => {
    process.stdout.write('\n'); 
    console.log('Thank you for using Data Processing CLI!');
    process.exit(0);
  });
};

interactive();