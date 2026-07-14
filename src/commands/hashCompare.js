import fs from 'node:fs';
import { readFile } from 'node:fs/promises';
import crypto from 'node:crypto';
import { pipeline } from 'node:stream/promises';
import pathResolver from '../utils/pathResolver.js';
import { requireInput, requireHash, validateAlgorithm } from '../utils/validators/flags.js'
import { requireExistingFile} from '../utils/validators/file.js'

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

const computeHash = async (stream, algorithm) => {
    const hash = crypto.createHash(algorithm);
    await pipeline(stream, hash);
    
    const hexString = hash.digest('hex').toLowerCase();
    return Buffer.from(hexString, 'utf8');
};

const readExpectedHash = async (hashPath) => {
    const hashFileResult = await readFile(hashPath, 'utf8');
    const cleanHexString = hashFileResult.trim().toLowerCase();

    return Buffer.from(cleanHexString, 'utf8');
};

const compare = (buf1, buf2) => {
    if (buf1.length !== buf2.length) {
        return false;
    }
    return crypto.timingSafeEqual(buf1, buf2);
};

const executeCompareHashes = async ({ inputPath, hashPath, algorithm }) => {
    const fileStream = fs.createReadStream(inputPath);
    
    const buf1 = await computeHash(fileStream, algorithm);
    const buf2 = await readExpectedHash(hashPath);
    const isMatch = compare(buf1, buf2);

    return {
        data: isMatch ? 'OK' : 'MISMATCH'
    };
};


export const hashComparer = async (args, context) => {
  const dto = buildHashInput(args, context);
  return await executeCompareHashes(dto);
};