import pathResolver from './pathResolver.js'

export const argParser = (cmd, state) => {
  const parts = cmd.trim().split(/\s+/);
  const command = parts[0];
  const args = parts.slice(1);
  
  const flags = {}

  for (let i = 0; i < args.length; i++) {
    const currentArg = args[i];
    if (currentArg.startsWith('-') && !currentArg.startsWith('--')) {
        const flagName = currentArg.replace('-', ''); 
        throw new Error(`--${flagName} flag required`);
      }

    if (args[i].startsWith('--')) {
      const key = args[i].replace('--', '');
      const value = args[i + 1] && !args[i + 1].startsWith('--')
        ? args[i + 1]
        : true;

      flags[key] = value;

      if (value !== true) i++;
    }
  }

  return {
    command,
    flags,
    rawArgs: args.toString()
  };   
}