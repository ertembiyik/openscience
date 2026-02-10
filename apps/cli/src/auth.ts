import * as readline from "readline";
import { saveConfig, type Config } from "./config";

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

export async function runAuthWizard(): Promise<Config> {
  console.log("\nOpen Science — Distributed AI Research Platform\n");
  console.log("Configure your contributor credentials.\n");

  console.log("LLM Providers:");
  console.log("  1. Anthropic (Claude)");
  console.log("  2. OpenAI (GPT-4)");
  console.log("  3. Google (Gemini)");
  const providerChoice = await prompt("\nSelect provider (1-3): ");
  const providers: Record<string, string> = {
    "1": "anthropic",
    "2": "openai",
    "3": "google",
  };
  const provider = providers[providerChoice];
  if (!provider) {
    console.error("Invalid choice");
    process.exit(1);
  }

  const apiKey = await prompt(`\nEnter your ${provider} API key: `);
  if (!apiKey) {
    console.error("API key is required");
    process.exit(1);
  }

  const convexUrl = await prompt(
    "\nEnter Convex deployment URL (e.g., https://your-deployment.convex.cloud): ",
  );
  if (!convexUrl) {
    console.error("Convex URL is required");
    process.exit(1);
  }

  const config: Config = { provider, apiKey, convexUrl };
  await saveConfig(config);

  console.log("\nAuthentication saved to ~/.openscience/auth.json");
  console.log(`Provider: ${provider}`);
  console.log(`Convex: ${convexUrl}`);
  console.log("\nRun `openscience run` to start contributing!\n");

  return config;
}
