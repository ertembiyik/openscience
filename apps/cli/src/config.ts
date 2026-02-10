import { homedir } from "os";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";

export type AgentRuntime = "codex" | "claude-code" | "pi-mono" | "openclaw";

export interface Config {
  agentRuntime: AgentRuntime;
  convexUrl: string;
  concurrency: number;
  contributorId?: string;
  // Legacy fields (kept for backward compat, ignored in new flow)
  provider?: string;
  apiKey?: string;
}

const CONFIG_DIR = join(homedir(), ".openlab");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");

export function ensureDirs() {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

export async function loadConfig(): Promise<Config | null> {
  try {
    const file = Bun.file(CONFIG_FILE);
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
  await Bun.write(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export async function getConfig(): Promise<Config> {
  const config = await loadConfig();
  if (!config) {
    console.error("Not configured. Run `openlab onboard` first.");
    process.exit(1);
  }
  return config;
}
