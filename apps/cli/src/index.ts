#!/usr/bin/env bun
import { Command } from "commander";
import { runAuthWizard } from "./auth";
import { getConfig } from "./config";
import { OpenLabClient } from "./convex";
import { startAgentLoop } from "./loop";

const program = new Command();

program
  .name("openlab")
  .description("Distributed AI research platform CLI")
  .version("0.0.1");

// auth command
program
  .command("auth")
  .description("Configure API key and Convex URL")
  .action(async () => {
    await runAuthWizard();
  });

// run command
program
  .command("run")
  .description("Start the agent loop — claim and execute research tasks")
  .option("--role <role>", "Filter by role (RESEARCH or VERIFY)")
  .option("--once", "Run one task then exit")
  .option("--project <slug>", "Filter by project slug")
  .action(async (opts) => {
    const config = await getConfig();
    await startAgentLoop(config, {
      role: opts.role,
      once: opts.once,
      project: opts.project,
    });
  });

// tasks command
const tasks = program.command("tasks").description("Browse and claim tasks");

tasks
  .command("list")
  .description("List available tasks")
  .option("--project <id>", "Filter by project ID")
  .action(async (opts) => {
    const config = await getConfig();
    const client = new OpenLabClient(config.convexUrl);
    const taskList = await client.listTasks(opts.project);

    if (!taskList || taskList.length === 0) {
      console.log("No available tasks.");
      return;
    }

    console.log(`\nAvailable tasks (${taskList.length}):\n`);
    console.log(
      "ID".padEnd(20) +
        "Type".padEnd(10) +
        "P".padEnd(4) +
        "Title",
    );
    console.log("-".repeat(70));
    for (const t of taskList) {
      console.log(
        String(t._id).padEnd(20) +
          t.type.padEnd(10) +
          `P${t.priority}`.padEnd(4) +
          (t.context?.title ?? "Untitled"),
      );
    }
    console.log();
  });

tasks
  .command("claim")
  .description("Claim a single task and print its details")
  .action(async () => {
    const config = await getConfig();
    const client = new OpenLabClient(config.convexUrl);

    if (!config.contributorId) {
      console.log("Registering contributor...");
      config.contributorId = await client.registerContributor(
        `contributor-${Date.now()}`,
        config.provider,
      );
    }

    const task = await client.claimTask(config.contributorId!);
    if (!task) {
      console.log("No tasks available to claim.");
      return;
    }

    console.log("\nClaimed task:");
    console.log(JSON.stringify(task, null, 2));
  });

// status command
program
  .command("status")
  .description("Show platform dashboard stats")
  .action(async () => {
    const config = await getConfig();
    const client = new OpenLabClient(config.convexUrl);
    const stats = await client.getStatus();

    if (!stats) {
      console.log("Could not fetch platform status.");
      return;
    }

    console.log("\nOpen Lab Platform Status\n");
    console.log(`  Active tasks:       ${stats.activeTasks}`);
    console.log(`  Completed tasks:    ${stats.completedTasks}`);
    console.log(`  Total tasks:        ${stats.totalTasks}`);
    console.log(`  Verified findings:  ${stats.verifiedFindings}`);
    console.log(`  Contributors:       ${stats.contributorCount}`);
    console.log(`  Hypotheses testing: ${stats.hypothesesTesting}`);
    console.log(`  Hypotheses proven:  ${stats.hypothesesSupported}`);
    console.log();
  });

program.parse();
