import fs from 'node:fs';
import { readFile } from 'node:fs/promises';
import crypto from 'node:crypto';
import { pipeline } from 'node:stream/promises';
import pathResolver from '../utils/pathResolver.js';
import { requireInput, requireHash, validateAlgorithm } from '../utils/validators/flags.js'
import { requireExistingFile, requireWritableDir} from '../utils/validators/file.js'

const buildHashInput = (args, context) => {
    const flags = args.flags;
    const allowed = ['input', 'hash', 'algorithm'];
    for (const key of Object.keys(args.flags)) {
        if (!allowed.includes(key)) {
            throw new Error('Invalid flag');
        }
    }
    const input = requireInput(flags.input);
    const inputPath = pathResolver(input, context);
    requireExistingFile(inputPath);

    const hashInput = requireHash(flags.hash);
    const hashPath = pathResolver(hashInput, context);
    requireExistingFile(hashPath);


    const algorithm = validateAlgorithm(flags.algorithm)

    return { inputPath, hashPath, algorithm };
};

const executeCompareHashes = async ({ inputPath, hashPath, algorithm}) => {
        const hash = crypto.createHash(algorithm)

        await pipeline (
            fs.createReadStream(inputPath),
            hash
        )
        const result = hash.digest('hex').toLowerCase();
        const hashFileResult = await readFile(hashPath, 'utf8');
        const cleanHashFileResult = hashFileResult.trim().toLowerCase();

        const buf1 = Buffer.from(result, 'utf8');
        const buf2 = Buffer.from(cleanHashFileResult, 'utf8');

        const isMatch = crypto.timingSafeEqual(buf1, buf2);

        return {
            data: isMatch ? 'OK' : 'MISMATCH'
        }
}

export const hashComparer = async (args, context) => {
  const dto = buildHashInput(args, context);
  return await executeCompareHashes(dto);
};