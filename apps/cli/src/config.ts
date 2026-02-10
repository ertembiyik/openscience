import { homedir } from "os";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";

export interface Config {
  provider: string;
  apiKey: string;
  convexUrl: string;
  contributorId?: string;
}

const CONFIG_DIR = join(homedir(), ".openlab");
const AUTH_FILE = join(CONFIG_DIR, "auth.json");

export function ensureDirs() {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

export async function loadConfig(): Promise<Config | null> {
  try {
    const file = Bun.file(AUTH_FILE);
    if (await file.exists()) {
      return (await file.json()) as Config;
    }
    return null;
  } catch {
    return null;
  }
}

export async function saveConfig(config: Config): Promise<void> {
  ensureDirs();
  await Bun.write(AUTH_FILE, JSON.stringify(config, null, 2));
}

export async function getConfig(): Promise<Config> {
  const config = await loadConfig();
  if (!config) {
    console.error("Not authenticated. Run `openlab auth` first.");
    process.exit(1);
  }
  return config;
}
