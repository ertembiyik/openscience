import { OpenLabClient } from "./convex";
import { assembleWorkspace, resolveSeedDir } from "./workspace/assemble";
import { runAgent } from "./workspace/run-agent";
import { collectResults } from "./workspace/collect";
import type { Config } from "./config";
import { saveConfig } from "./config";

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

  let running = true;

  // Register contributor if not already registered
  if (!config.contributorId) {
    console.log("Registering contributor...");
    const id = await client.registerContributor(
      `contributor-${Date.now()}`,
      config.agentRuntime,
    );
    config.contributorId = id;
    await saveConfig(config);
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
        // Resolve the seed directory for this project
        const projectSlug =
          task.context?.projectSlug ??
          "oncology-neoantigen-immunogenicity";
        const seedDir = resolveSeedDir(projectSlug);

        if (!seedDir) {
          throw new Error(
            `Seed directory not found for project: ${projectSlug}`,
          );
        }

        // 1. Assemble workspace
        console.log("  Assembling workspace...");
        const workspaceDir = await assembleWorkspace({
          taskId: task._id,
          taskType: task.type,
          contextMarkdown:
            task.contextMarkdown ?? "# TASK.md\n\nNo context available.",
          seedDir,
          projectSlug,
        });
        console.log(`  Workspace: ${workspaceDir}`);

        // 2. Run agent via SDK
        console.log(`  Running agent (${config.agentRuntime})...`);
        const { output } = await runAgent(config.agentRuntime, workspaceDir);
        console.log("  Agent finished.");

        // 3. Collect results
        console.log("  Collecting results...");
        await collectResults(workspaceDir, task._id, output, client);
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
