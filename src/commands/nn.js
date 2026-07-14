import fs from 'node:fs';
import crypto from 'node:crypto';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import pathResolver from '../utils/pathResolver.js';
import { requireInput, requireOutput, requirePassword } from '../utils/validators/flags.js';
import { requireExistingFile } from '../utils/validators/file.js';

// Define our clean State Machine states
const STATE = {
    READ_HEADER: 'READ_HEADER',
    STREAM: 'STREAM'
};

class DecryptTransform extends Transform {
    constructor({ password }) {
        super();
        this.password = password;
        this.currentState = STATE.READ_HEADER;

        // FIXED-SIZE BOUNDED BUFFER: Secure against unbounded memory attacks
        this.headerBuffer = Buffer.alloc(28); 
        this.headerBytesRead = 0;

        // SLIDING WINDOW BUFFER: Holds potential auth tags during streaming
        this.trailingBuffer = Buffer.alloc(0);

        this.decipher = null;
    }

    _transform(chunk, _, cb) {
        // STATE 1: READ_HEADER
        if (this.currentState === STATE.READ_HEADER) {
            // Determine how many bytes we still need to fill our 28-byte header block
            const bytesNeeded = 28 - this.headerBytesRead;
            const bytesToCopy = Math.min(chunk.length, bytesNeeded);

            // Copy incoming bytes directly into our pre-allocated, safe memory slot
            chunk.copy(this.headerBuffer, this.headerBytesRead, 0, bytesToCopy);
            this.headerBytesRead += bytesToCopy;

            // If we don't have 28 bytes yet, ask Node.js for the next chunk immediately
            if (this.headerBytesRead < 28) {
                return cb();
            }

            // SUCCESS: We hit exactly 28 bytes. Unpack the components safely!
            const salt = this.headerBuffer.subarray(0, 16);
            const iv = this.headerBuffer.subarray(16, 28);

            try {
                // Boot up the cipher engine inside the state cycle
                const key =  crypto.scryptSync(this.password, salt, 32);
                this.decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
            } catch (err) {
                return cb(err);
            }

            // Shift our internal tracking state to standard streaming mode
            this.currentState = STATE.STREAM;

            // Isolate any extra bytes left over in this first chunk past the header
            if (chunk.length > bytesToCopy) {
                const leftoverBytes = chunk.subarray(bytesToCopy);
                this.trailingBuffer = leftoverBytes;
            }
        } 
        // STATE 2: STREAM
        else {
            // Append incoming stream content into our small trailing window buffer
            this.trailingBuffer = Buffer.concat([this.trailingBuffer, chunk]);
        }

        // THE SLIDING 16-BYTE WINDOW RULE:
        // Always protect and preserve the final 16 bytes inside this.trailingBuffer
        if (this.currentState === STATE.STREAM && this.trailingBuffer.length > 16) {
            const safeBytesToDecrypt = this.trailingBuffer.subarray(0, this.trailingBuffer.length - 16);
            this.trailingBuffer = this.trailingBuffer.subarray(this.trailingBuffer.length - 16);

            const decrypted = this.decipher.update(safeBytesToDecrypt);
            if (decrypted.length) {
                this.push(decrypted);
            }
        }

        cb();
    }

    // STATE 3: FINALIZE
    _flush(cb) {
        // If we ran out of data before even hitting a full header, the file is corrupted
        if (this.currentState !== STATE.STREAM) {
            return cb(new Error('Authentication failed: Missing file header'));
        }

        try {
            // The 16 bytes remaining inside our sliding window IS the auth tag!
            const authTag = this.trailingBuffer;
            this.decipher.setAuthTag(authTag);

            // Close down the decryption loop and execute tag validation checks
            const finalChunk = this.decipher.final();
            if (finalChunk.length) {
                this.push(finalChunk);
            }
            cb();
        } catch (err) {
            // Emits an error down the pipeline if decryption validation checks fail
            cb(err);
        }
    }
}

const executeDecrypt = async ({ inputPath, outputPath, password }) => {
    const decryptStream = new DecryptTransform({ password });

    await pipeline(
        fs.createReadStream(inputPath),
        decryptStream,
        fs.createWriteStream(outputPath)
    );

    return { data: 'Decryption completed' };
};

export const decrypter = async (args, context) => {
    try {
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

        const output = requireOutput(flags.output);
        const outputPath = pathResolver(flags.output, context);

        const password = requirePassword(flags.password);

        return await executeDecrypt({ inputPath, outputPath, password });
    } catch (error) {
        // Your requirement checklist says: "If input file doesn't exist or auth fails, print Operation failed"
        console.error('Operation failed');
        throw error;
    }
};
