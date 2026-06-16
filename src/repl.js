import { up, cd, ls } from './navigation.js';
import runCsvToJson from './commands/csvToJson.js';
import runJsonToCsv from './commands/jsonToCsv.js';
import counter from './commands/count.js';
import { argParser } from './utils/argParser.js'

const commandRouter = {
    up,
    cd,
    ls,
    'csv-to-json': runCsvToJson,
    'json-to-csv': runJsonToCsv,
    'count': counter
  }

export const dispatchCommand = async (cmd, state) => {
  const parsedArgs = argParser(cmd, state)
  
  const handler = commandRouter[parsedArgs.command]
  
  if (!handler) {
    return { error: 'Invalid input' }
  }

  return await handler(parsedArgs, state);
};

