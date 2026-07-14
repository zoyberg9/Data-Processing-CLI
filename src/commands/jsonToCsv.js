import fs from 'node:fs';
import { pipeline } from 'stream/promises';
import { Transform } from 'node:stream';
import pathResolver from '../utils/pathResolver.js'

const esc = v => /[",\n\r]/.test(v) ? `"${String(v).replace(/"/g, '""')}"` : String(v ?? '');

class JsonToCsv extends Transform {
    constructor () {
        super()
        this.buffer = '';
        this.headerKeys = null;
    };

    _transform(chunk, _, cb) {
        this.buffer += chunk;
        const lines = this.buffer.split('\n');
        this.buffer = lines.pop();
        

        for (const line of lines) {
            if (!line.trim())
                continue;

            const obj = JSON.parse(line);
            
            if (!this.headerKeys) {
                this.headerKeys = Object.keys(obj);
                this.push(this.headerKeys.join(','));
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
        const input = args.flags.input
        ? pathResolver(args.flags.input, context)
        : null;
        const output = args.flags.output
        ? pathResolver(args.flags.output, context)
        : null;
        
        await pipeline(
            fs.createReadStream(input, { encoding: 'utf-8' }),
            new JsonToCsv(),
            fs.createWriteStream(output)
        );
        
        return { data: 'Conversion completed' };
        
    } catch (error) {
        throw new Error(`Pipeline failed: ${error.message}`);
    }
}