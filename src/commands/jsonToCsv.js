import fs from 'node:fs';
import path from 'node:path'
import { pipeline } from 'stream/promises';
import { Transform } from 'node:stream';

const esc = v => /[",\n\r]/.test(v) ? `"${String(v).replace(/"/g, '""')}"` : String(v ?? '');

class JsonToCsv extends Transform {
    constructor () {
        super()
        this.buffer = '';
        this.headerKeys = null;
        this.isFirstRow = true; 
    };

    _transform(chunk, _, cb) {
        this.buffer += chunk.toString();
        const lines = this.buffer.split('\n');
        this.buffer = lines.pop();
        

        for (const line of lines) {
            if (!line.trim())
                continue;

            const obj = JSON.parse(line);
            
            if (!this.headerKeys) {
                this.headerKeys = Object.keys(obj);
                this.push(this.headerKeys.join(','));
                this.isFirstRow = false;
            }
            const row = this.headerKeys.map(h => esc(obj[h])).join(',');
            this.push('\n' + row);
        }
        cb();
    }

    _flush(cb) {
        if (this.buffer.trim()) {
            const obj = JSON.parse(this.buffer);
            const row = this.headerKeys.map(h => esc(obj[h])).join(',');
            this.push('\n' + row);
        }
        cb();
    };
};

export default async function runJsonToCsv(args, context) {
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
            : path.join(context.cwd, outputArg);

        await pipeline(
            fs.createReadStream(input),
            new JsonToCsv(),
            fs.createWriteStream(output)
        );
        
        return { data: 'Conversion completed' };
        
    } catch (error) {
        console.error('❌ Pipeline failed:', error.message);
    }
}