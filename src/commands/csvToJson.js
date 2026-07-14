import { Worker } from 'worker_threads';
import os from 'os';
import { promises as fsp } from 'fs';

import * as C from '../constants.js';
import * as U from '../utils/index.js';
const { TOTAL, LEVELS, STATUS, PATHS, RESPONSE_TIME_SUM } = C.STAT_RESULTS_KEYS;

export async function logStats({ input, output }, getCurrentDir) {
    const check = await U.pathChecker({ input, output, save: true }, getCurrentDir);
    if (!check) return;

    const { inputPath, outputPath } = check;

    let stat;
    try {
        stat = await fsp.stat(inputPath);
    } catch {
        console.log(C.OPERATION_FAILED);
        return;
    }

    const fileSize = stat.size;
    const cores = os.cpus().length;
    const chunkSize = Math.floor(fileSize / cores);

    const workers = [];

    for (let i = 0; i < cores; i++) {
        let start = i * chunkSize;
        let end = (i === cores - 1) ? fileSize - 1 : (start + chunkSize - 1);

        if (start !== 0) {
            const fd = await fsp.open(inputPath, 'r');
            const buf = Buffer.alloc(1);

            while (start < fileSize) {
                await fd.read(buf, 0, 1, start);
                if (buf[0] === 0x0A) { // '\n'
                    start++;
                    break;
                }
                start++;
            }

            await fd.close();
        }

        if (end < fileSize - 1) {
            const fd = await fsp.open(inputPath, 'r');
            const buf = Buffer.alloc(1);

            while (end > start) {
                await fd.read(buf, 0, 1, end);
                if (buf[0] === 0x0A) break;
                end--;
            }

            await fd.close();
        }

        workers.push(
            new Promise(resolve => {
                const worker = new Worker(
                    new URL('../workers/logWorker.js', import.meta.url),
                    { workerData: { inputPath, start, end } }
                );

                worker.on('message', msg => resolve(msg));
                worker.on('error', () => resolve(null));
            })
        );
    }

    const partials = await Promise.all(workers);

    if (partials.includes(null)) {
        console.log(C.OPERATION_FAILED);
        return;
    }

    const final = {
        [TOTAL]: 0,
        [LEVELS]: {},
        [STATUS]: {},
        [PATHS]: {},
        [RESPONSE_TIME_SUM]: 0
    };

    for (const part of partials) {
        final[TOTAL] += part[TOTAL];
        final[RESPONSE_TIME_SUM] += part[RESPONSE_TIME_SUM];

        for (const [k, v] of Object.entries(part[LEVELS])) {
            final[LEVELS][k] = (final[LEVELS][k] || 0) + v;
        }

        for (const [k, v] of Object.entries(part[STATUS])) {
            final[STATUS][k] = (final[STATUS][k] || 0) + v;
        }

        for (const [k, v] of Object.entries(part[PATHS])) {
            final[PATHS][k] = (final[PATHS][k] || 0) + v;
        }
    }

    const topPaths = Object.entries(final[PATHS])
        .map(([path, count]) => ({ path, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

    const avg = final[TOTAL]
        ? final[RESPONSE_TIME_SUM] / final[TOTAL]
        : 0;

    const json = {
        [TOTAL]: final[TOTAL],
        [LEVELS]: final[LEVELS],
        [STATUS]: (final[STATUS]),
        topPaths,
        avgResponseTimeMs: Number(avg.toFixed(2))
    };

    await fsp.writeFile(outputPath, JSON.stringify(json, null, 2));
}