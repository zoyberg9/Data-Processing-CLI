import { parentPort, workerData } from 'node:worker_threads';
import fs from 'node:fs';

function classifyStatus(code) {
  const c = Math.floor(Number(code) / 100);
  return `${c}xx`;
}

function processChunk({ input, start, end }) {
  const stream = fs.createReadStream(input, { start, end, encoding: 'utf-8' });

  let buffer = '';
  let total = 0;
  let responseTimeSum = 0;

  const levels = {};
  const status = {};
  const paths = {};

  return new Promise((resolve, reject) => {
    stream.on('data', chunk => {
      buffer += chunk;
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          const parts = line.split(' ');
          if (parts.length < 7) continue; // malformed

          const level = parts[1];
          const statusCode = parts[3];
          const responseTime = Number(parts[4]);
          const path = parts.slice(6).join(' ');

          total++;
          responseTimeSum += responseTime;

          levels[level] = (levels[level] || 0) + 1;

          const statusKey = classifyStatus(statusCode);
          status[statusKey] = (status[statusKey] || 0) + 1;

          paths[path] = (paths[path] || 0) + 1;
        } catch {
          // skip bad line
        }
      }
    });

    stream.on('end', () => {
      resolve({ total, responseTimeSum, levels, status, paths });
    });

    stream.on('error', reject);
  });
}

processChunk(workerData)
  .then(result => parentPort.postMessage(result))
  .catch(err => {
    throw err;
  });