import { setUser, readConfig } from "./config.js";
import { createUser, getUserByName, deleteAllUsers, getUsers } from "./db/queries/users.js";

export type CommandHandler = (cmdName: string, ...args: string[]) => Promise<void>;

export type CommandsRegistry = Record<string, CommandHandler>;

export function registerCommand(
  registry: CommandsRegistry,
  cmdName: string,
  handler: CommandHandler
): void {
  registry[cmdName] = handler;
}

export async function runCommand(
  registry: CommandsRegistry,
  cmdName: string,
  ...args: string[]
): Promise<void> {
  const handler = registry[cmdName];
  if (!handler) {
    throw new Error(`Unknown command: ${cmdName}`);
  }
  await handler(cmdName, ...args);
}

export async function handlerLogin(cmdName: string, ...args: string[]): Promise<void> {
  if (args.length === 0 || !args[0]) {
    throw new Error("a username is required");
  }
  const username = args[0];

  const existingUser = await getUserByName(username);
  if (!existingUser) {
    throw new Error(`User '${username}' does not exist.`);
  }

  setUser(username);
  console.log(`User has been set to: ${username}`);
}

export async function handlerRegister(cmdName: string, ...args: string[]): Promise<void> {
  if (args.length === 0 || !args[0]) {
    throw new Error("a username is required");
  }
  const username = args[0];

  const existingUser = await getUserByName(username);
  if (existingUser) {
    throw new Error(`User '${username}' already exists.`);
  }

  const newUser = await createUser(username);
  setUser(newUser.name);
  console.log(`User created successfully:`, newUser);
}

export async function handlerReset(cmdName: string, ...args: string[]): Promise<void> {
  await deleteAllUsers();
  console.log("Database reset successfully.");
}

export async function handlerUsers(cmdName: string, ...args: string[]): Promise<void> {
  const allUsers = await getUsers();
  const config = readConfig();
  const currentUser = config.user;

  for (const user of allUsers) {
    if (user.name === currentUser) {
      console.log(`* ${user.name} (current)`);
    } else {
      console.log(`* ${user.name}`);
    }
  }
}
