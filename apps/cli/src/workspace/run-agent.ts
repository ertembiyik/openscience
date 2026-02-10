import type { AgentRuntime } from "../config";

interface RunResult {
  output: string;
}

const AGENT_PROMPT =
  "Read SOUL.md and TASK.md, then complete the task. " +
  "Follow the identity, values, and methodology in SOUL.md. " +
  "Follow the acceptance criteria in TASK.md.";

/**
 * Run an agent in the workspace using the appropriate SDK.
 *
 * Each SDK piggybacks on the user's installed agent auth —
 * no API keys needed in our config.
 */
export async function runAgent(
  runtime: AgentRuntime,
  workspaceDir: string,
): Promise<RunResult> {
  switch (runtime) {
    case "claude-code":
      return runClaudeCode(workspaceDir);
    case "codex":
      return runCodex(workspaceDir);
    case "pi-mono":
      return runPiMono(workspaceDir);
    default:
      throw new Error(`Unsupported agent runtime: ${runtime}`);
  }
}

/**
 * Claude Code via @anthropic-ai/claude-agent-sdk
 *
 * Uses query() async iterator. Collects the final result message.
 */
async function runClaudeCode(workspaceDir: string): Promise<RunResult> {
  const { query } = await import("@anthropic-ai/claude-agent-sdk");

  let finalResult = "";

  for await (const message of query({
    prompt: AGENT_PROMPT,
    options: {
      cwd: workspaceDir,
      allowedTools: [
        "Read",
        "Write",
        "Edit",
        "Bash",
        "Glob",
        "Grep",
      ],
      permissionMode: "bypassPermissions",
      maxTurns: 50,
    },
  })) {
    if (message.type === "result") {
      if (message.subtype === "success") {
        finalResult = message.result ?? "";
      } else {
        const errors = (message as any).errors ?? [];
        throw new Error(
          `Claude Code failed: ${errors.join(", ") || "unknown error"}`,
        );
      }
    }
  }

  return { output: finalResult };
}

/**
 * Codex via @openai/codex-sdk
 *
 * Uses Codex().startThread({ workingDirectory }).run(prompt).
 */
async function runCodex(workspaceDir: string): Promise<RunResult> {
  const { Codex } = await import("@openai/codex-sdk");

  const codex = new Codex();
  const thread = codex.startThread({
    workingDirectory: workspaceDir,
  });

  const turn = await thread.run(AGENT_PROMPT);
  const output =
    typeof turn.finalResponse === "string"
      ? turn.finalResponse
      : JSON.stringify(turn.finalResponse);

  return { output };
}

/**
 * Pi-mono via @mariozechner/pi-coding-agent
 *
 * Uses createAgentSession({ cwd }).prompt().
 */
async function runPiMono(workspaceDir: string): Promise<RunResult> {
  const {
    AuthStorage,
    createAgentSession,
    ModelRegistry,
    SessionManager,
  } = await import("@mariozechner/pi-coding-agent");
  const { getModel } = await import("@mariozechner/pi-ai");

  const authStorage = new AuthStorage();
  const modelRegistry = new ModelRegistry(authStorage);
  const model = getModel("anthropic", "claude-sonnet-4-5-20250929");

  const { session } = await createAgentSession({
    sessionManager: SessionManager.inMemory(),
    authStorage,
    modelRegistry,
    model,
    thinkingLevel: "medium",
    cwd: workspaceDir,
  });

  try {
    const result = await session.prompt(AGENT_PROMPT);
    return { output: result.text };
  } finally {
    session.dispose();
  }
}
