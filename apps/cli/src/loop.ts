import { OpenLabClient } from "./convex";
import { createProvider } from "./providers";
import { runTask } from "./agent";
import type { Config } from "./config";

interface LoopOptions {
  role?: string;
  once?: boolean;
  project?: string;
}

export async function startAgentLoop(config: Config, options: LoopOptions) {
  if (!config.convexUrl) {
    console.error("No Convex URL configured. Run `openlab onboard` first.");
    process.exit(1);
  }
  if (!config.agentRuntime) {
    console.error("No agent runtime configured. Run `openlab onboard` first.");
    process.exit(1);
  }

  const client = new OpenLabClient(config.convexUrl);

  // Legacy path: if apiKey is present, use built-in provider loop
  // New path: will delegate to agent runtime (codex, claude, etc.)
  const provider = config.apiKey
    ? createProvider(config.provider ?? "anthropic", config.apiKey)
    : null;

  let running = true;

  // Register contributor if not already registered
  if (!config.contributorId) {
    console.log("Registering contributor...");
    const id = await client.registerContributor(
      `contributor-${Date.now()}`,
      config.agentRuntime,
    );
    config.contributorId = id;
    console.log(`Registered as: ${id}`);
  }

  process.on("SIGINT", () => {
    running = false;
    console.log("\nShutting down after current task completes...");
  });
  process.on("SIGTERM", () => {
    running = false;
  });

  console.log(`Agent loop started (${config.agentRuntime}). Waiting for tasks...\n`);

  while (running) {
    try {
      console.log("Checking for tasks...");

      const task = await client.claimTask(config.contributorId!);

      if (!task) {
        console.log("No tasks available. Waiting 30s...");
        await new Promise((r) => setTimeout(r, 30_000));
        if (options.once) break;
        continue;
      }

      const title = task.context?.title ?? task._id;
      console.log(`\nClaimed task: ${title} (${task.type})`);
      console.log(`  ID: ${task._id}`);
      console.log(`  Priority: P${task.priority}`);

      try {
        if (!provider) {
          // TODO: delegate to external agent runtime (codex, claude, pi-mono, openclaw)
          throw new Error(
            `External agent runtime '${config.agentRuntime}' delegation not yet implemented. ` +
            `Provide an API key via legacy config to use the built-in provider loop.`,
          );
        }
        const result = await runTask(task, client, provider);
        await client.completeTask(task._id, result);
        console.log(`Task completed: ${title}\n`);
      } catch (error: any) {
        console.error(`Task failed: ${error.message}`);
        try {
          await client.completeTask(
            task._id,
            JSON.stringify({ error: error.message, status: "FAILED" }),
          );
        } catch {
          console.error("Failed to report task failure to server");
        }
      }

      if (options.once) break;
    } catch (error: any) {
      console.error(`Loop error: ${error.message}`);
      if (options.once) break;
      await new Promise((r) => setTimeout(r, 10_000));
    }
  }

  console.log("Agent loop stopped.");
}
