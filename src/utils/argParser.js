import path from 'node:path'

export const argParser = async (cmd, state) => {
  const parts = cmd.trim().split(/\s+/);
  const cmdName = parts[0];
  const args = parts.slice(1);
  if (args[0] === 'input') {
    const inputPath = path.relative(args[1])
  }
}