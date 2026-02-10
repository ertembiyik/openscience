import { homedir } from "os";
import { join } from "path";
import { existsSync, mkdirSync, writeFileSync, unlinkSync } from "fs";
import type { DaemonService, DaemonStatus } from "./service";

const SERVICE_NAME = "openlab-agent.service";
const UNIT_DIR = join(homedir(), ".config", "systemd", "user");
const UNIT_PATH = join(UNIT_DIR, SERVICE_NAME);
const LOG_DIR = join(homedir(), ".openlab", "logs");

function resolveExecStart(): string {
  const which = Bun.which("openlab");
  if (which) return `${which} run`;

  const entry = join(import.meta.dir, "..", "index.ts");
  const bunPath = Bun.which("bun") ?? "bun";
  return `${bunPath} run ${entry} run`;
}

function buildUnit(): string {
  mkdirSync(LOG_DIR, { recursive: true });

  return `[Unit]
Description=Open Lab Research Agent
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=${resolveExecStart()}
Restart=always
RestartSec=5
KillMode=process
Environment="PATH=${process.env.PATH}"

[Install]
WantedBy=default.target
`;
}

async function exec(cmd: string[]): Promise<{ ok: boolean; output: string }> {
  const proc = Bun.spawn(cmd, { stdout: "pipe", stderr: "pipe" });
  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  const code = await proc.exited;
  return { ok: code === 0, output: stdout + stderr };
}

async function checkLingering(): Promise<boolean> {
  const user = process.env.USER ?? "unknown";
  const result = await exec(["loginctl", "show-user", user, "--property=Linger"]);
  return result.ok && result.output.includes("Linger=yes");
}

export class SystemdService implements DaemonService {
  async install(): Promise<void> {
    // Check systemd availability
    const systemctl = await exec(["systemctl", "--user", "--version"]);
    if (!systemctl.ok) {
      throw new Error("systemd not available. Run openlab manually instead.");
    }

    // Check lingering
    const hasLinger = await checkLingering();
    if (!hasLinger) {
      console.log("\nSystemd lingering is not enabled for your user.");
      console.log("Without it, the daemon stops when you log out.");
      console.log("Run: loginctl enable-linger");
      console.log("(This may require sudo on some systems.)\n");
    }

    mkdirSync(UNIT_DIR, { recursive: true });
    writeFileSync(UNIT_PATH, buildUnit());

    await exec(["systemctl", "--user", "daemon-reload"]);
    await exec(["systemctl", "--user", "enable", SERVICE_NAME]);
    await exec(["systemctl", "--user", "restart", SERVICE_NAME]);

    console.log(`Daemon installed: ${UNIT_PATH}`);
    console.log(`Logs: journalctl --user -u ${SERVICE_NAME}`);
  }

  async uninstall(): Promise<void> {
    await exec(["systemctl", "--user", "stop", SERVICE_NAME]);
    await exec(["systemctl", "--user", "disable", SERVICE_NAME]);

    if (existsSync(UNIT_PATH)) {
      unlinkSync(UNIT_PATH);
    }

    await exec(["systemctl", "--user", "daemon-reload"]);
    console.log("Daemon uninstalled.");
  }

  async start(): Promise<void> {
    if (!existsSync(UNIT_PATH)) {
      throw new Error("Daemon not installed. Run `openlab daemon install` first.");
    }
    await exec(["systemctl", "--user", "start", SERVICE_NAME]);
    console.log("Daemon started.");
  }

  async stop(): Promise<void> {
    await exec(["systemctl", "--user", "stop", SERVICE_NAME]);
    console.log("Daemon stopped.");
  }

  async status(): Promise<DaemonStatus> {
    const installed = existsSync(UNIT_PATH);
    if (!installed) {
      return { installed: false, running: false };
    }

    const result = await exec([
      "systemctl", "--user", "show", SERVICE_NAME,
      "--property=ActiveState,MainPID",
    ]);
    if (!result.ok) {
      return { installed: true, running: false };
    }

    const activeMatch = result.output.match(/ActiveState=(\w+)/);
    const pidMatch = result.output.match(/MainPID=(\d+)/);
    const running = activeMatch?.[1] === "active";
    const pid = pidMatch ? parseInt(pidMatch[1], 10) : undefined;

    return { installed: true, running, pid: pid && pid > 0 ? pid : undefined };
  }
}
