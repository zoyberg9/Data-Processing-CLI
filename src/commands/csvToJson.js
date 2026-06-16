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
                continue;

            if (!this.headers) {
                this.headers = line.split(',');
                continue;
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

class ToJsonLines extends Transform {
    constructor() {
        super({ writableObjectMode: true }) 
    }

    _transform(obj, _, cb) {
        this.push(JSON.stringify(obj) + '\n')
        cb()
    }

    _flush(cb) {
        cb()
    }
}

export default async function runCsvToJson (args, context) {
    try {

        await pipeline(
            fs.createReadStream(args.input),
            new CsvToJson(),
            new ToJsonLines(),
            fs.createWriteStream(args.output)
        );

        return { data: 'Conversion completed'}
        
    } catch (error) {
        console.error('❌ Pipeline failed:', error.message);
    }
}
