import fs from 'node:fs';
import path from 'node:path'
import { pipeline } from 'stream/promises';
import { Transform } from 'node:stream';

class JsonToCsv extends Transform {
    constructor () {
        super()
        this.buffer = '';
        this.header = null;
    };

    _transform(chunk, _, cb) {
        this.buffer += chunk.toString();
        
        
        if (this.buffer.includes(']')) {
            const objects = JSON.parse(this.buffer);
            for (let i = 0; i < objects.length; i++) {
                const obj = objects[i];

                if (!this.headers) {
                    this.headers = Object.keys(obj).join(', ') + '\n';
                    this.push(this.headers);
                } 

                const isLast = (i === objects.length - 1);
                const values = Object.values(obj).join(', ') + (isLast ? '' : '\n');
                
                this.push(values);
            }
        }
        cb();
            
    }
}

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
            : path.join(import.meta.dirname, outputArg);

        await pipeline(
            fs.createReadStream(input, { highWaterMark: 2 }),
            new JsonToCsv(),
            fs.createWriteStream(output)
        );
        
        return { data: 'Conversion completed' };
        
    } catch (error) {
        console.error('❌ Pipeline failed:', error.message);
    }
}