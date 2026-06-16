// pathResolver.js

import path from 'node:path';

export default function pathResolver(p, context) {
    if (!p || typeof p !== 'string') return '';

    return path.isAbsolute(p)
        ? p
        : path.join(context.cwd, p);
}