import { up, cd, ls } from './navigation.js';
import runCsvToJson from './commands/csvToJson.js';
import runJsonToCsv from './commands/jsonToCsv.js';

const commandRouter = {
    up,
    cd,
    ls,
    'csv-to-json': runCsvToJson,
    'json-to-csv': runJsonToCsv
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

