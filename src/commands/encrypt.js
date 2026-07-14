import fs from 'node:fs';
import crypto from 'node:crypto';
import { pipeline } from 'node:stream/promises'
import { Transform } from 'node:stream';
import pathResolver from '../utils/pathResolver.js';
import { requireInput, requireOutput, requirePassword } from '../utils/validators/flags.js'
import { requireExistingFile } from '../utils/validators/file.js'

const buildHashInput = (args, context) => {
    const flags = args.flags;
    const allowed = ['input', 'output', 'password'];
    for (const key of Object.keys(args.flags)) {
        if (!allowed.includes(key)) {
            throw new Error('Invalid flag');
        }
    }
    const input = requireInput(flags.input);
    const inputPath = pathResolver(flags.input, context);
    requireExistingFile(inputPath);

    const output = requireOutput(flags.output)
    const outputPath = pathResolver(flags.output, context);

    const password = requirePassword(flags.password)

    return { inputPath, outputPath, password };
};

class encryptTransform extends Transform {
    constructor ({password}) {
        super()

        this.salt = crypto.randomBytes(16);
        this.iv = crypto.randomBytes(12);
        this.key = crypto.scryptSync(password, this.salt, 32);
        this.cipher = crypto.createCipheriv('aes-256-gcm', this.key, this.iv);
        

        this.headerSent = false
        
    }
    _transform(chunk, _, cb) {
        if (!this.headerSent) {
            this.push(this.salt);
            this.push(this.iv);
            this.headerSent = true
        }
        
        const encrypted = this.cipher.update(chunk);
        this.push(encrypted);
        return cb();
    }

    _flush(cb) {
        try {
            const finalChunk = this.cipher.final();
            if (finalChunk.length) {
                this.push(finalChunk);
            }

            const authTag = this.cipher.getAuthTag();
            this.push(authTag);

            cb();
        } catch (err) {
            cb(err);
        }
    }
}

const executeEncrypt = async ({inputPath, outputPath, password}) => {
    const encrypt = new encryptTransform({
        password
    })
    await pipeline (
        fs.createReadStream(inputPath),
        encrypt,
        fs.createWriteStream(outputPath)
    )
    
    return { data: 'Encryption completed' };
}

export const encrypter = async (args, context) => {
    const dto = buildHashInput(args, context);
    return await executeEncrypt(dto);
}