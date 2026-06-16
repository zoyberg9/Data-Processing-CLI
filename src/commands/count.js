import fs from 'node:fs';
import path from 'node:path';

export default async function counter (args, context) {
    let lines = 0;
    let words = 0;
    let chars = 0;
    let inWord = false

    try {
        const readStream = fs.createReadStream(args.input, { encoding: 'utf8' })

        for await (const chunk of readStream) {
            const charsus = chunk.toString()

            for (const char of charsus) {
                
                if (char === '\n'){
                    lines++;
                }

                const isWordChar = /[a-zA-Z0-9]/.test(char)

                if (isWordChar && !inWord) {
                    words++;
                    inWord = true;
                } else if (!isWordChar) {
                    inWord = false;
                }
            }
            chars += charsus.length
        }
        return {
            data: `Lines: ${lines}\nWords: ${words}\nCharacters: ${chars}`
        };
    } catch(error) {
        console.error('❌ Pipeline failed:', error.message);
    };
}