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

class decryptTransform extends Transform {
    constructor({password}) {
        super()
        this.password = password
        this.fullBuffer = Buffer.alloc(0);  
        this.headerParsed = false
        this.decipher = null;
    }

    _transform(chunk, _, cb) {
        
        if (!this.headerParsed) {
            this.fullBuffer = Buffer.concat([this.fullBuffer, chunk])
            if (this.fullBuffer.length < 28) {
                return cb();
            }
            const salt = this.fullBuffer.subarray(0, 16)
            const iv = this.fullBuffer.subarray(16, 28)

            const key = crypto.scryptSync(this.password, salt, 32);
            this.decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);

            const remainingData  = this.fullBuffer.subarray(28)
            
            this.fullBuffer = remainingData 
            this.headerParsed = true

            if (this.fullBuffer.length === 0) {
                return cb();
            }
        } else {
            this.fullBuffer = Buffer.concat([this.fullBuffer, chunk]);
        }
            
        if (this.fullBuffer.length > 16) {
            const safeBytesToDecrypt = this.fullBuffer.subarray(0, this.fullBuffer.length - 16);

            this.fullBuffer = this.fullBuffer.subarray(this.fullBuffer.length - 16);

            const decrypted = this.decipher.update(safeBytesToDecrypt);
            this.push(decrypted);
        }
        cb()
    }

    _flush(cb) {
        try {
            const authTag = this.fullBuffer
            this.decipher.setAuthTag(authTag)
            const finalChunk = this.decipher.final();
            if (finalChunk.length) {
                this.push(finalChunk);
            }

            cb();
        } catch (err) {
            cb(err);
        }
    }    
}

const executeDecrypt = async ({inputPath, outputPath, password}) => {
    const decrypt = new decryptTransform({
        password
    })
    await pipeline (
        fs.createReadStream(inputPath),
        decrypt,
        fs.createWriteStream(outputPath)
    )
    
    return { data: 'Decryption completed' };
}

export const decrypter = async (args, context) => {
    const dto = buildHashInput(args, context);
    return await executeDecrypt(dto);
}
