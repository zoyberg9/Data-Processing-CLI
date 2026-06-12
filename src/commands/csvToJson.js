import fs from 'node:fs';
import path from 'node:path'
import { pipeline } from 'stream/promises';
import { Transform } from 'node:stream';

class CsvToJson extends Transform {
    constructor() {
    super({ readableObjectMode: true });
    this.buffer = '';
    this.headers = null;
    };

    _transform(chunk, _, cb) {
        this.buffer += chunk.toString()
        const lines = this.buffer.split('\n')
        this.buffer = lines.pop()

        for (const line of lines) {
            if (!line.trim())
                continue

            if (!this.headers) {
                this.headers = line.split(',')
                continue
            }

            const values = line.split(',')
            const obj = {}

            this.headers.forEach((h, i) => {
            obj[h.trim()] = values[i]?.trim() || ''
            })

            this.push(obj)
        }
        cb();
    }

    _flush(cb) {
        if (this.buffer.trim()) {
            const line = this.buffer.trim()
            const values = line.split(',')
            const obj = {}

            this.headers.forEach((h, i) => {
                obj[h.trim()] = values[i]?.trim() || ''
            })
            this.push(obj)
        }
        cb()
    }
}

class JsonArrayStringify extends Transform {
    constructor() {
    super({ writableObjectMode: true })
    this.first = true
    }

    _transform(obj, _, cb) {
    if (this.first) {
        this.push('[' + JSON.stringify(obj))
        this.first = false
    } else {
        this.push(',' + JSON.stringify(obj))
        
    }

    cb()
    }

    _flush(cb) {
        if (this.first) {
        this.push('[]') // no data case
        } else {
        this.push(']')
        }
        cb()
    }

}

export default async function runCsvToJson (args, context) {
    try {
        const inputIndex = args.indexOf('--input');
        const outputIndex = args.indexOf('--output');

        const inputArg = inputIndex !== -1 ? args[inputIndex + 1] : null;
        const outputArg = outputIndex !== -1 ? args[outputIndex + 1] : null;

        if (!inputArg || !outputArg) {
            return { error: 'Missing path arguments' };
        }

        const input = path.isAbsolute(inputArg)
            ? inputArg
            : path.join(context.cwd, inputArg);

        const output = path.isAbsolute(outputArg)
            ? outputArg
            : path.join(import.meta.dirname, outputArg);

        await pipeline(
            fs.createReadStream(input, { highWaterMark: 10 }),
            new CsvToJson(),
            new JsonArrayStringify(),
            fs.createWriteStream(output)
        );

        return { data: 'Conversion completed'}
        
    } catch (error) {
        console.error('❌ Pipeline failed:', error.message);
    }
}
