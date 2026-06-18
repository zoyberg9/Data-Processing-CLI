import fs from 'node:fs';
import path from 'node:path';

export function requireExistingFile(path) {
    if (!fs.existsSync(path)) {
        throw new Error(`file does not exist: ${path}`);
    }
    return path;
}

export function requireWritableDir(filePath) {
    const dir = path.dirname(filePath);
     if (!fs.existsSync(dir)) {
        throw new Error(`directory does not exist: ${dir}`);
    }
    return filePath;
}

