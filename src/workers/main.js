o// main.js
import { Worker } from 'node:worker_threads';
import os from 'node:os';

const numWorkers = os.cpus().length;
const chunkSize = Math.ceil(lines.length / numWorkers);

const chunks = [];

for (let i = 0; i < numWorkers; i++) {
  const worker = new Worker(new URL('./logWorker.js', import.meta.url), {
    workerData: { chunk }
  });

  worker.on('message', (msg) => {
    console.log('result from worker:', msg);
  });

  worker.on('error', (err) => {
    console.error('worker error:', err);
  });

  worker.on('exit', (code) => {
    if (code !== 0) console.error('worker stopped with code', code);
  });

  worker.postMessage({ task: 'start' });
}