import path from 'node:path'
import fs from 'fs/promises';

export const up = (_args, context) => {
  const current = context.cwd
  const parent = path.dirname(current)

  context.cwd = parent
  return { data: parent }
}

export const cd = async (args, context) => {
  try {
    const target = args[0]
    if (!target) throw new Error()

    const newPath = path.isAbsolute(target)
      ? target
      : path.join(context.cwd, target)

    const stats = await fs.stat(newPath)
    if (!stats.isDirectory()) throw new Error()

    context.cwd = path.resolve(newPath)
    return { data: context.cwd }

  } catch {
    return { error: 'Operation failed' }
  }
}

export const ls = async (_args, context) => {
  try {
    const entries = await fs.readdir(context.cwd, { withFileTypes: true })

    const folders = []
    const files = []

    for (const entry of entries) {
      if (entry.isDirectory()) folders.push(entry.name)
      else files.push(entry.name)
    }

    folders.sort()
    files.sort()

    console.log(context.cwd)
    return {
      data: [
        ...folders.map(f => `${f}    [folder]`),
        ...files.map(f => `${f}    [file]`)
      ],
      
    }

  } catch {
    return { error: 'Operation failed' }
  }
}
