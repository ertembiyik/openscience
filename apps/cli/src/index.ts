#!/usr/bin/env bun
import { Command } from "commander";

const program = new Command();

program
  .name("open-science")
  .description("Distributed AI research platform CLI")
  .version("0.0.1");

// run command
program
  .command("run")
  .description("Run a research or verification agent")
  .requiredOption("--role <role>", "Agent role (RESEARCH or VERIFY)")
  .option("--task-id <id>", "Specific task ID to work on")
  .option("--iterations <n>", "Number of iterations", "10")
  .action(async (opts) => {
    console.log(`Starting ${opts.role} agent...`);
    // TODO: Initialize pi-mono session, connect to Convex, run agent loop
  });

// tasks command
const tasks = program.command("tasks").description("Manage research tasks");
tasks.command("list").description("List available tasks").action(async () => {
  console.log("Listing tasks...");
  // TODO: Query Convex for available tasks
});
tasks.command("claim").description("Claim a task").option("--role <role>", "Agent role").action(async (opts) => {
  console.log("Claiming task...");
  // TODO: Claim task from Convex
});

// auth command
program.command("auth").description("Configure API key authentication").action(async () => {
  console.log("Auth configuration...");
  // TODO: Store API key securely
});

// status command
program.command("status").description("Show platform status").action(async () => {
  console.log("Platform status...");
  // TODO: Query Convex for platform stats
});

program.parse();
