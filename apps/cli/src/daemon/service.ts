import { platform } from "os";

export interface DaemonStatus {
  installed: boolean;
  running: boolean;
  pid?: number;
}

export interface DaemonService {
  install(): Promise<void>;
  uninstall(): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  status(): Promise<DaemonStatus>;
}

export async function createDaemonService(): Promise<DaemonService> {
  const os = platform();
  if (os === "darwin") {
    const { LaunchdService } = await import("./launchd");
    return new LaunchdService();
  }
  if (os === "linux") {
    const { SystemdService } = await import("./systemd");
    return new SystemdService();
  }
  throw new Error(`Unsupported platform for daemon: ${os}. Run openlab manually instead.`);
}
