import { up, cd, ls } from './navigation.js';
import run from './commands/csvToJson.js';

const commandRouter = {
    up,
    cd,
    ls,
    'csv-to-json': run
  }

export const dispatchCommand = async (cmd, state) => {
  const parts = cmd.trim().split(/\s+/)
  const cmdName = parts[0]
  const args = parts.slice(1)
  const handler = commandRouter[cmdName]
  
  if (!handler) {
    return { error: 'Invalid input' }
  }

  return await handler(args, state);
};

