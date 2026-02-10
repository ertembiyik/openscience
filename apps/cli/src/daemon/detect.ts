export interface RuntimeInfo {
  name: string;
  binary: string;
  description: string;
  detected: boolean;
}

const RUNTIMES: Omit<RuntimeInfo, "detected">[] = [
  {
    name: "codex",
    binary: "codex",
    description: "OpenAI Codex CLI",
  },
  {
    name: "claude-code",
    binary: "claude",
    description: "Claude Code (Anthropic)",
  },
  {
    name: "pi-mono",
    binary: "pi-mono",
    description: "Pi-mono agent runtime",
  },
  {
    name: "openclaw",
    binary: "openclaw",
    description: "OpenClaw agent",
  },
];

export async function detectRuntimes(): Promise<RuntimeInfo[]> {
  return Promise.all(
    RUNTIMES.map(async (rt) => ({
      ...rt,
      detected: Bun.which(rt.binary) !== null,
    })),
  );
}
