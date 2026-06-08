import * as readline from 'node:readline/promises';
import os from 'node:os'
import path from 'node:path'

const currentWorkingDirectory = path.resolve('')
console.log(currentWorkingDirectory)

const interactive = () => {
  const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

rl.setPrompt('Welcome to Data Processing CLI! ');
rl.prompt();
console.log(`\nYou are currently in ${os.homedir()} `)
rl.setPrompt('>');
rl.prompt();

rl.on('line', (input) => {
  const commands = {
    cwd: () => console.log(process.cwd()),
    date: () => console.log(new Date().toDateString()),
    uptime: () => console.log(process.uptime()),
    exit: () => (console.log('Goodbye!'), process.exit())
  };

  if (commands[input]) {
    commands[input]();
  } else {
    console.log(`Unknown command: ${input}`);
  }
  rl.prompt();
});

rl.on('close', () => {
  process.stdout.write('\n'); 
  console.log('Goodbye!');
  process.exit(0);
});
};


interactive();