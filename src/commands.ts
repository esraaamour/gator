import { setUser, readConfig } from "./config.js";
import { createUser, getUserByName, deleteAllUsers, getUsers } from "./db/queries/users.js";
import { createFeed, getFeeds, getFeedByUrl } from "./db/queries/feeds.js";
import { createFeedFollow, getFeedFollowsForUser, deleteFeedFollowByUrl } from "./db/queries/feed_follows.js";
import { fetchFeed } from "./rss.js";
import { User, Feed } from "./db/schema.js";

export type CommandHandler = (cmdName: string, ...args: string[]) => Promise<void>;

export type UserCommandHandler = (
  cmdName: string,
  user: User,
  ...args: string[]
) => Promise<void>;

export type CommandsRegistry = Record<string, CommandHandler>;

export function middlewareLoggedIn(handler: UserCommandHandler): CommandHandler {
  return async (cmdName: string, ...args: string[]): Promise<void> => {
    const config = readConfig();
    if (!config.user) {
      throw new Error("No logged in user found");
    }

    const user = await getUserByName(config.user);
    if (!user) {
      throw new Error(`User '${config.user}' not found`);
    }

    await handler(cmdName, user, ...args);
  };
}

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

export async function handlerAgg(cmdName: string, ...args: string[]): Promise<void> {
  const feed = await fetchFeed("https://www.wagslane.dev/index.xml");
  console.log(JSON.stringify(feed, null, 2));
}

function printFeed(feed: Feed, user: User) {
  console.log(`* ID:            ${feed.id}`);
  console.log(`* Created:       ${feed.createdAt}`);
  console.log(`* Updated:       ${feed.updatedAt}`);
  console.log(`* Name:          ${feed.name}`);
  console.log(`* URL:           ${feed.url}`);
  console.log(`* User:          ${user.name}`);
}

export async function handlerAddFeed(
  cmdName: string,
  user: User,
  ...args: string[]
): Promise<void> {
  if (args.length < 2) {
    throw new Error("name and url are required");
  }

  const name = args[0];
  const url = args[1];

  const feed = await createFeed(name, url, user.id);
  printFeed(feed, user);

  const follow = await createFeedFollow(user.id, feed.id);
  console.log(`* Feed Name:     ${follow.feedName}`);
  console.log(`* User Name:     ${follow.userName}`);
}

export async function handlerFeeds(cmdName: string, ...args: string[]): Promise<void> {
  const allFeeds = await getFeeds();

  for (const feed of allFeeds) {
    console.log(`* Name: ${feed.feedName}`);
    console.log(`* URL: ${feed.feedUrl}`);
    console.log(`* User: ${feed.userName}`);
  }
}

export async function handlerFollow(
  cmdName: string,
  user: User,
  ...args: string[]
): Promise<void> {
  if (args.length === 0 || !args[0]) {
    throw new Error("a feed URL is required");
  }
  const url = args[0];

  const feed = await getFeedByUrl(url);
  if (!feed) {
    throw new Error(`Feed with URL '${url}' not found`);
  }

  const follow = await createFeedFollow(user.id, feed.id);
  console.log(`* Feed Name:     ${follow.feedName}`);
  console.log(`* User Name:     ${follow.userName}`);
}

export async function handlerFollowing(
  cmdName: string,
  user: User,
  ...args: string[]
): Promise<void> {
  const follows = await getFeedFollowsForUser(user.id);
  for (const f of follows) {
    console.log(`* ${f.feedName}`);
  }
}

export async function handlerUnfollow(
  cmdName: string,
  user: User,
  ...args: string[]
): Promise<void> {
  if (args.length === 0 || !args[0]) {
    throw new Error("a feed URL is required");
  }
  const url = args[0];

  await deleteFeedFollowByUrl(user.id, url);
  console.log(`Unfollowed feed with URL: ${url}`);
}
