import * as p from "@clack/prompts";
import { saveConfig, type AgentRuntime, type Config } from "./config";
import { detectRuntimes } from "./daemon/detect";
import { createDaemonService } from "./daemon/service";

const LOGO = `
 ██████╗ ██████╗ ███████╗███╗   ██╗    ██╗      █████╗ ██████╗
██╔═══██╗██╔══██╗██╔════╝████╗  ██║    ██║     ██╔══██╗██╔══██╗
██║   ██║██████╔╝█████╗  ██╔██╗ ██║    ██║     ███████║██████╔╝
██║   ██║██╔═══╝ ██╔══╝  ██║╚██╗██║    ██║     ██╔══██║██╔══██╗
╚██████╔╝██║     ███████╗██║ ╚████║    ███████╗██║  ██║██████╔╝
 ╚═════╝ ╚═╝     ╚══════╝╚═╝  ╚═══╝    ╚══════╝╚═╝  ╚═╝╚═════╝
`;

function guardCancel<T>(value: T | symbol): T {
  if (p.isCancel(value)) {
    p.cancel("Onboarding cancelled.");
    process.exit(0);
  }
  return value;
}

export async function runOnboardWizard(): Promise<Config> {
  console.log(LOGO);

  p.intro("Open Lab onboarding");

  p.note(
    "Your machine contributes compute to open science.\n" +
      "Like Folding@Home, but for AI-powered research.\n\n" +
      "When idle, your computer claims research tasks,\n" +
      "runs them with your AI agent, and pushes results\n" +
      "back to the shared knowledge base.",
    "What is Open Lab?",
  );

  // --- Step 1: Detect and select agent runtime ---
  const runtimes = await detectRuntimes();

  const runtimeChoice = guardCancel(
    await p.select({
      message: "Agent runtime",
      options: runtimes.map((rt) => ({
        value: rt.name,
        label: rt.description,
        hint: rt.detected ? "installed" : "not found in PATH",
      })),
    }),
  );

  const selectedRuntime = runtimes.find((rt) => rt.name === runtimeChoice)!;
  if (!selectedRuntime.detected) {
    p.log.warn(
      `'${selectedRuntime.binary}' was not found in your PATH. Make sure it's installed before running the agent.`,
    );
  }

  // --- Step 2: Convex URL (hardcoded for now) ---
  const convexUrl = "https://openlab.convex.cloud";

  // --- Step 3: Concurrency ---
  const concurrencyStr = guardCancel(
    await p.text({
      message: "Simultaneous agent instances",
      initialValue: "1",
      validate: (v) => {
        const n = parseInt(v, 10);
        if (isNaN(n) || n < 1) return "Must be a number >= 1";
      },
    }),
  );
  const concurrency = parseInt(concurrencyStr, 10);

  // --- Save config ---
  const config: Config = {
    agentRuntime: selectedRuntime.name as AgentRuntime,
    convexUrl,
    concurrency,
  };
  await saveConfig(config);

  p.log.success(
    `Configuration saved to ~/.openlab/config.json\n` +
      `  Runtime:     ${selectedRuntime.description}\n` +
      `  Convex:      ${convexUrl}\n` +
      `  Concurrency: ${concurrency}`,
  );

  // --- Step 4: Daemon install ---
  const installDaemon = guardCancel(
    await p.confirm({
      message: "Install daemon (start on boot)?",
      initialValue: true,
    }),
  );

  if (installDaemon) {
    const s = p.spinner();
    s.start("Installing daemon...");
    try {
      const service = await createDaemonService();
      await service.install();
      s.stop("Daemon installed and running.");
    } catch (err: any) {
      s.stop(`Could not install daemon: ${err.message}`);
      p.log.info("You can run `openlab daemon install` later.");
    }
  }

  // --- Step 5: Health check ---
  const s = p.spinner();
  s.start("Checking Convex connection...");
  try {
    const res = await fetch(convexUrl);
    if (res.ok || res.status === 404) {
      s.stop("Connected to Convex.");
    } else {
      s.stop(`Warning: Convex returned HTTP ${res.status}.`);
    }
  } catch {
    s.stop("Could not reach Convex server. Check the URL.");
  }

  // --- Done ---
  p.note(
    "openlab run            Start the agent loop\n" +
      "openlab daemon status  Check daemon status\n" +
      "openlab tasks list     Browse available tasks\n" +
      "openlab status         Platform stats",
    "Next steps",
  );

  p.outro("Setup complete. Happy researching!");

  return config;
}
