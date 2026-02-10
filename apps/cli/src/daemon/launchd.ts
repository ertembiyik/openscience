import { homedir } from "os";
import { join } from "path";
import { existsSync, mkdirSync, writeFileSync, unlinkSync } from "fs";
import type { DaemonService, DaemonStatus } from "./service";

const LABEL = "ai.openlab.agent";
const PLIST_DIR = join(homedir(), "Library", "LaunchAgents");
const PLIST_PATH = join(PLIST_DIR, `${LABEL}.plist`);
const LOG_DIR = join(homedir(), ".openlab", "logs");

function getUid(): number {
  return process.getuid?.() ?? 501;
}

function domain(): string {
  return `gui/${getUid()}`;
}

function resolveProgram(): string[] {
  // Prefer the compiled standalone binary (shows "openlab" in Login Items, not "Jarred Sumner")
  const compiled = join(import.meta.dir, "..", "..", "dist", "openlab");
  if (existsSync(compiled)) return [compiled, "run"];

  // Fall back to globally installed binary
  const which = Bun.which("openlab");
  if (which) return [which, "run"];

  // Last resort: run via bun (will show Bun's developer name in Login Items)
  const entry = join(import.meta.dir, "..", "index.ts");
  const bunPath = Bun.which("bun") ?? "bun";
  return [bunPath, "run", entry, "run"];
}

function buildPlist(): string {
  const args = resolveProgram();
  mkdirSync(LOG_DIR, { recursive: true });

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${LABEL}</string>
  <key>ProgramArguments</key>
  <array>
${args.map((a) => `    <string>${a}</string>`).join("\n")}
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>${join(LOG_DIR, "agent.log")}</string>
  <key>StandardErrorPath</key>
  <string>${join(LOG_DIR, "agent.err.log")}</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>${process.env.PATH}</string>
  </dict>
</dict>
</plist>`;
}

async function exec(cmd: string[]): Promise<{ ok: boolean; output: string }> {
  const proc = Bun.spawn(cmd, { stdout: "pipe", stderr: "pipe" });
  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  const code = await proc.exited;
  return { ok: code === 0, output: stdout + stderr };
}

export class LaunchdService implements DaemonService {
  async install(): Promise<void> {
    // Clean up any existing service first
    try {
      await this.stop();
    } catch {
      // Ignore — might not be installed
    }

    mkdirSync(PLIST_DIR, { recursive: true });
    writeFileSync(PLIST_PATH, buildPlist());

    // Bootstrap the service
    const result = await exec(["launchctl", "bootstrap", domain(), PLIST_PATH]);
    if (!result.ok && !result.output.includes("already bootstrapped")) {
      throw new Error(`Failed to bootstrap service: ${result.output}`);
    }

    // Kickstart it
    await exec(["launchctl", "kickstart", "-k", `${domain()}/${LABEL}`]);

    console.log(`Daemon installed: ${PLIST_PATH}`);
    console.log(`Logs: ${LOG_DIR}/agent.log`);
  }

  async uninstall(): Promise<void> {
    await exec(["launchctl", "bootout", domain(), PLIST_PATH]);

    if (existsSync(PLIST_PATH)) {
      unlinkSync(PLIST_PATH);
    }

    console.log("Daemon uninstalled.");
  }

  async start(): Promise<void> {
    if (!existsSync(PLIST_PATH)) {
      throw new Error("Daemon not installed. Run `openlab daemon install` first.");
    }
    await exec(["launchctl", "kickstart", "-k", `${domain()}/${LABEL}`]);
    console.log("Daemon started.");
  }

  async stop(): Promise<void> {
    await exec(["launchctl", "kill", "SIGTERM", `${domain()}/${LABEL}`]);
    console.log("Daemon stopped.");
  }

  async status(): Promise<DaemonStatus> {
    const installed = existsSync(PLIST_PATH);
    if (!installed) {
      return { installed: false, running: false };
    }

    const result = await exec(["launchctl", "print", `${domain()}/${LABEL}`]);
    if (!result.ok) {
      return { installed: true, running: false };
    }

    const pidMatch = result.output.match(/pid\s*=\s*(\d+)/);
    const stateMatch = result.output.match(/state\s*=\s*(\w+)/);
    const running = stateMatch?.[1] === "running";
    const pid = pidMatch ? parseInt(pidMatch[1], 10) : undefined;

    return { installed: true, running, pid };
  }
}
