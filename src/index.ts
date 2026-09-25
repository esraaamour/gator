import {
  CommandsRegistry,
  registerCommand,
  runCommand,
  handlerLogin,
  handlerRegister,
  handlerReset,
  handlerUsers,
} from "./commands.js";

async function main() {
  const registry: CommandsRegistry = {};
  registerCommand(registry, "login", handlerLogin);
  registerCommand(registry, "register", handlerRegister);
  registerCommand(registry, "reset", handlerReset);
  registerCommand(registry, "users", handlerUsers);

  const rawArgs = process.argv.slice(2);
  if (rawArgs.length === 0) {
    console.error("Error: not enough arguments provided");
    process.exit(1);
  }

  const cmdName = rawArgs[0];
  const cmdArgs = rawArgs.slice(1);

  try {
    await runCommand(registry, cmdName, ...cmdArgs);
  } catch (err) {
    if (err instanceof Error) {
      console.error(`Error: ${err.message}`);
    } else {
      console.error("An unknown error occurred");
    }
    process.exit(1);
  }

  process.exit(0);
}

main();
