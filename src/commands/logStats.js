import fs from 'node:fs';
import os from 'node:os';
import { Worker } from 'node:worker_threads';
import path from 'node:path';
import pathResolver from '../utils/pathResolver.js';

function merge(results) {
  const final = {
    total: 0,
    responseTimeSum: 0,
    levels: {},
    status: {},
    paths: {}
  };

  for (const r of results) {
    final.total += r.total;
    final.responseTimeSum += r.responseTimeSum;

    for (const [k, v] of Object.entries(r.levels)) {
      final.levels[k] = (final.levels[k] || 0) + v;
    }

    for (const [k, v] of Object.entries(r.status)) {
      final.status[k] = (final.status[k] || 0) + v;
    }

    for (const [k, v] of Object.entries(r.paths)) {
      final.paths[k] = (final.paths[k] || 0) + v;
    }
  }

  return final;
}

function topPaths(paths, limit = 10) {
  return Object.entries(paths)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([path, count]) => ({ path, count }));
}

export default async function runLogStats(args, context) {
  const input = pathResolver(args.flags.input, context);
  const output = pathResolver(args.flags.output, context);

  if (!fs.existsSync(input)) {
    throw new Error('Operation failed');
  }

  const fileSize = fs.statSync(input).size;
  const numWorkers = os.cpus().length;
  const chunkSize = Math.ceil(fileSize / numWorkers);

  const workers = [];

  for (let i = 0; i < numWorkers; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize - 1, fileSize);

    workers.push(
      new Promise((resolve, reject) => {
        const worker = new Worker(
          path.resolve('./workers/logWorker.js'),
          { workerData: { input, start, end } }
        );

        worker.on('message', resolve);
        worker.on('error', reject);
        worker.on('exit', code => {
          if (code !== 0) reject(new Error(`Worker stopped: ${code}`));
        });
      })
    );
  }

  const results = await Promise.all(workers);
  const merged = merge(results);

  const avg =
    merged.total === 0
      ? 0
      : merged.responseTimeSum / merged.total;

  const outputData = {
    total: merged.total,
    levels: merged.levels,
    status: merged.status,
    topPaths: topPaths(merged.paths),
    avgResponseTimeMs: Number(avg.toFixed(2))
  };

  fs.writeFileSync(output, JSON.stringify(outputData, null, 2));

  return { data: 'Stats computed' };
}