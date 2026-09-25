import fs from "fs";
import os from "os";
import path from "path";

const configPath = path.join(os.homedir(), ".gatorconfig.json");

export interface Config {
  dbUrl: string;
  user?: string;
}

export function readConfig(): Config {
  if (!fs.existsSync(configPath)) {
    throw new Error("Config file does not exist");
  }
  const rawData = fs.readFileSync(configPath, "utf-8");
  const json = JSON.parse(rawData);

  return {
    dbUrl: json.db_url,
    user: json.current_user_name || json.user,
  };
}

export function setUser(username: string): void {
  let json: Record<string, any> = {};
  if (fs.existsSync(configPath)) {
    const rawData = fs.readFileSync(configPath, "utf-8");
    if (rawData.trim()) {
      json = JSON.parse(rawData);
    }
  }

  json.current_user_name = username;
  json.user = username;

  fs.writeFileSync(configPath, JSON.stringify(json, null, 2), "utf-8");
}
