import path from 'node:path'
import fs from 'fs/promises';

export const up = (args, context) => {
  const current = context.cwd
  const parent = path.dirname(current)

  if (current === parent) {
    console.log(current)
    return
  }

  context.cwd = parent
  console.log(context.cwd)
}

export const cd = async (args, context) => {
  try {
    const target = args[0]

    if (!target) {
      throw new Error()
    }

    const newPath = path.isAbsolute(target)
      ? target
      : path.join(context.cwd, target)

    const stats = await fs.stat(newPath)

    if (!stats.isDirectory()) {
      throw new Error()
    }

    context.cwd = path.resolve(newPath)
    console.log(context.cwd)

  } catch {
    console.log('Operation failed')
  }
}

export const ls = async (args, context) => {
  try {
    const entries = await fs.readdir(context.cwd, { withFileTypes: true });

    const folders = [];
    const files = [];

    for (const entry of entries) {
        if (entry.isDirectory()) folders.push(entry.name);
        else files.push(entry.name);
    }

    folders.sort();
    files.sort();

    for (const folder of folders) {
        console.log(`${folder}    [folder]`);
    }
    for (const file of files) {
        console.log(`${file}    [file]`);
    }
  } catch (err) {
      console.log('Operation failed');
  }
}

