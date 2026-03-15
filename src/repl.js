import * as readline from 'node:readline/promises';

export const interactive = () => {
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

rl.setPrompt('>')
rl.prompt()

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
}