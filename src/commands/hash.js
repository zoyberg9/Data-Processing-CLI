import fs from 'node:fs';
import crypto from 'node:crypto';
import { pipeline } from 'node:stream/promises';
import pathResolver from '../utils/pathResolver.js';
import { requireInput, requireOutput, validateAlgorithm } from '../utils/validators/flags.js'
import { requireExistingFile, requireWritableDir} from '../utils/validators/file.js'

const buildHashInput = (args, context) => {
    const flags = args.flags;
    const allowed = ['input', 'algorithm', 'save'];
    for (const key of Object.keys(args.flags)) {
        if (!allowed.includes(key)) {
            throw new Error('Invalid flag');
        }
    }
    const input = requireInput(flags.input);
    const inputPath = pathResolver(flags.input, context);
    requireExistingFile(inputPath);

    const algorithm = validateAlgorithm(flags.algorithm)

    const save = Boolean(flags.save);

    return { inputPath, algorithm, save };
};

const executeHash = async ({ inputPath, algorithm, save }) => {
        const hash = crypto.createHash(algorithm)

        await pipeline (
            fs.createReadStream(inputPath),
            hash
        )
        const result = hash.digest('hex');
        
        if (save) {
            const ext = algorithm
            const path = inputPath + '.' + ext
            await fs.promises.writeFile(path, result, 'utf8') 
            
            return {
                data: 'Hashed file saved'
            }
        } else {
            return {
                data: `${algorithm}: ${result}`
            };
        }
}

export const hasher = async (args, context) => {
  const dto = buildHashInput(args, context);
  return await executeHash(dto);
};