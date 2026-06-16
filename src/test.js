const users = 'json-to-csv --input data.json --output data.csv';
const rety = users.slice(1)
// Format each name into a URL string
console.log(rety);
// Output: 
// [
//   'https://api.com',
//   'https://api.com',
//   'https://api.com'
// ]
import { argParser } from './argParser.js';
import pathResolver from './pathResolver.js';

const parsed = argParser(cmd);

const input = parsed.flags.input
  ? pathResolver(parsed.flags.input, context)
  : null;

const output = parsed.flags.output
  ? pathResolver(parsed.flags.output, context)
  : null;