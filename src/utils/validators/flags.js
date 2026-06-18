import crypto from 'node:crypto'

export const requireInput = (input) => {
    if (!input) throw new Error('--input flag required');
    return input;
}

export const requireOutput = (output) => {
    if (!output) throw new Error('--output flag required');
    return output;
};

export const requireHash = (hash) => {
    if (!hash) throw new Error('--hash flag required');
    return hash;
}

export const validateAlgorithm = (algorithm) => {
    
    algorithm = algorithm ?? 'sha256';
    if (algorithm === true || typeof algorithm !== 'string') {
        throw new Error('algorithm required');
    }
    if (!crypto.getHashes().includes(algorithm)) {
        throw new Error('Invalid algorithm');
    }
    return algorithm
}