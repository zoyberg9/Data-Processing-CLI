import fs from 'node:fs';
import { Writable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import pathResolver from '../utils/pathResolver.js';

export const counter = async (args, context) => {
    let lines = 0;
    let words = 0;
    let chars = 0;
    let inWord = false;

    try {
        const input = args.flags.input
            ? pathResolver(args.flags.input, context)
            : null;

        const readStream = fs.createReadStream(input, { encoding: 'utf8' });

        const counterStream = new Writable({
            defaultEncoding: 'utf8', 
            decodeStrings: false, 

            write(chunk, encoding, callback) {
                for (const char of chunk) {
                    if (char === '\n') {
                        lines++;
                    }

                    const isWordChar = /[a-zA-Z0-9]/.test(char);

                    if (isWordChar && !inWord) {
                        words++;
                        inWord = true;
                    } else if (!isWordChar) {
                        inWord = false;
                    }
                }
                chars += chunk.length;
                callback();
            }
        });

        await pipeline(readStream, counterStream);

        return {
            data: `Lines: ${lines}\nWords: ${words}\nCharacters: ${chars}`
        };

    } catch (error) {
        throw new Error(`Pipeline failed: ${error.message}`);
    }
};
