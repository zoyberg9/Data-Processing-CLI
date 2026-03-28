import path from 'node:path'

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