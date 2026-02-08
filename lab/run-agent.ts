#!/usr/bin/env bun
/**
 * Autonomous Research Lab -- Agent Runner
 *
 * Usage: bun run lab/run-agent.ts <agent-type> <agent-id> [iterations]
 * Example: bun run lab/run-agent.ts builder builder-1 20
 *
 * Agent types: orchestrator, researcher, builder, reviewer
 *
 * Each agent gets:
 * - A persistent pi-mono session (survives restarts, auto-compacts)
 * - Custom bioinformatics + lab tools via extensions
 * - Its own system prompt from lab/agents/<type>.prompt.md
 * - Relevant skills injected from lab/skills/
 * - Git sync before/after each iteration
 */

import {
  createAgentSession,
  SessionManager,
  SettingsManager,
} from "@mariozechner/pi-coding-agent";
import { readFileSync, existsSync, mkdirSync, appendFileSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

// --- Parse args ---
const args = process.argv.slice(2);
const agentType = args[0];
const agentId = args[1];
const iterations = parseInt(args[2] || "10", 10);

if (!agentType || !agentId) {
  console.error("Usage: bun run lab/run-agent.ts <agent-type> <agent-id> [iterations]");
  console.error("Types: orchestrator, researcher, builder, reviewer");
  process.exit(1);
}

const VALID_TYPES = ["orchestrator", "researcher", "builder", "reviewer"];
if (!VALID_TYPES.includes(agentType)) {
  console.error(`Invalid agent type: ${agentType}. Must be one of: ${VALID_TYPES.join(", ")}`);
  process.exit(1);
}

// --- Paths ---
const CWD = join(import.meta.dir, "..");
const LAB_DIR = join(CWD, "lab");
const SESSION_DIR = join(CWD, ".sessions", agentId);
const LOG_DIR = join(LAB_DIR, "logs");
const LOG_FILE = join(LOG_DIR, `${agentId}-${new Date().toISOString().slice(0, 10)}.log`);

// Ensure directories exist
mkdirSync(SESSION_DIR, { recursive: true });
mkdirSync(LOG_DIR, { recursive: true });

// --- Helpers ---
function log(msg: string) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${msg}`;
  console.log(line);
  appendFileSync(LOG_FILE, line + "\n");
}

function readFileOrDefault(path: string, fallback: string): string {
  try {
    return readFileSync(path, "utf-8");
  } catch {
    return fallback;
  }
}

function gitSync(phase: "before" | "after", iterNum: number) {
  try {
    if (phase === "before") {
      execSync("git pull origin main --rebase", { cwd: CWD, stdio: "pipe" });
    } else {
      execSync("git add -A", { cwd: CWD, stdio: "pipe" });
      try {
        execSync(
          `git commit -m "${agentId}: iteration ${iterNum}"`,
          { cwd: CWD, stdio: "pipe" }
        );
      } catch {
        // Nothing to commit
        return;
      }
      try {
        execSync("git push origin main", { cwd: CWD, stdio: "pipe" });
      } catch {
        // Rebase and retry once
        execSync("git pull --rebase origin main", { cwd: CWD, stdio: "pipe" });
        execSync("git push origin main", { cwd: CWD, stdio: "pipe" });
      }
    }
  } catch (e: any) {
    log(`Git ${phase} sync warning: ${e.message}`);
  }
}

// --- Load agent system prompt ---
const promptPath = join(LAB_DIR, "agents", `${agentType}.prompt.md`);
if (!existsSync(promptPath)) {
  console.error(`Agent prompt not found: ${promptPath}`);
  process.exit(1);
}
const agentPrompt = readFileSync(promptPath, "utf-8");

// --- Load all skills ---
const skillsDir = join(LAB_DIR, "skills");
let skillsText = "";
if (existsSync(skillsDir)) {
  const skillFiles = Bun.spawnSync(["ls", skillsDir]).stdout.toString().trim().split("\n").filter(f => f.endsWith(".md"));
  for (const file of skillFiles) {
    const content = readFileSync(join(skillsDir, file), "utf-8");
    skillsText += `\n---\n${content}\n`;
  }
}

// --- Build system prompt ---
const systemPrompt = `${agentPrompt}

## Available Skills
${skillsText || "(No skills loaded)"}

## Project Context
You are working in: ${CWD}
Your agent ID is: ${agentId}
You are agent type: ${agentType}

## Lab Tools Available
You have custom tools for interacting with the knowledge base:
- lab_append_finding: Record a validated finding to lab/kb/findings.md
- lab_record_dead_end: Record what didn't work to lab/kb/dead-ends.md
- lab_update_task: Update task status in lab/tasks/active.md
- lab_create_job: Create a job for Ertem in lab/jobs-for-ertem.md

You also have bioinformatics tools:
- iedb_query: Query IEDB for peptide-MHC binding predictions
- paper_search: Search PubMed for papers
`;

// --- Configure pi-mono session ---
log(`Starting ${agentType} agent: ${agentId}`);
log(`Iterations: ${iterations}`);
log(`Session dir: ${SESSION_DIR}`);

const sessionManager = SessionManager.continueRecent(CWD, SESSION_DIR);

const settingsManager = SettingsManager.inMemory({
  defaultProvider: "anthropic",
  defaultModel: "claude-sonnet-4-5-20250929",
  defaultThinkingLevel: "medium",
  compaction: {
    enabled: true,
    keepRecentTokens: 40000,
  },
  retry: {
    enabled: true,
    maxRetries: 3,
  },
});

const { session } = await createAgentSession({
  cwd: CWD,
  sessionManager,
  settingsManager,
  customTools: [], // Extensions loaded separately below
});

// --- Subscribe to events ---
session.subscribe((event) => {
  if (event.type === "message_update" && "assistantMessageEvent" in event) {
    const aEvent = event.assistantMessageEvent as any;
    if (aEvent.type === "text_delta") {
      process.stdout.write(aEvent.delta);
    }
  }
  if (event.type === "auto_compaction_start") {
    log("\n[COMPACTION] Context growing large, compacting...");
  }
  if (event.type === "auto_compaction_end") {
    log("[COMPACTION] Done.");
  }
  if (event.type === "error") {
    log(`[ERROR] ${(event as any).error?.message || "Unknown error"}`);
  }
});

// --- Graceful shutdown ---
let shuttingDown = false;
process.on("SIGINT", () => {
  if (shuttingDown) process.exit(1);
  shuttingDown = true;
  log("Shutting down gracefully (Ctrl+C again to force)...");
  gitSync("after", -1);
  process.exit(0);
});

// --- Main loop ---
log("=".repeat(60));
log(`Agent ${agentId} starting ${iterations} iterations`);
log("=".repeat(60));

for (let i = 1; i <= iterations; i++) {
  if (shuttingDown) break;

  log(`\n--- Iteration ${i}/${iterations} ---`);

  // Sync from main
  gitSync("before", i);

  // Read current state
  const active = readFileOrDefault(join(LAB_DIR, "tasks", "active.md"), "No tasks assigned.");
  const deadEnds = readFileOrDefault(join(LAB_DIR, "kb", "dead-ends.md"), "No dead ends recorded.");

  // Build iteration prompt
  const iterationPrompt = `## Iteration ${i}/${iterations} — Agent: ${agentId}

## Your Task Assignment
${active}

## Dead Ends (DO NOT REPEAT THESE)
${deadEnds}

## Instructions
1. Find YOUR task (assigned to ${agentId}) in the task assignment above
2. Do one unit of focused work on that task
3. Record any findings using the appropriate tools or by editing lab/kb/ files
4. If you complete the task, mark it DONE in lab/tasks/active.md
5. If you get stuck, mark it STUCK and explain why
6. If you need something from Ertem, add a job to lab/jobs-for-ertem.md

Remember: ONE focused unit of work per iteration. Quality over quantity.`;

  try {
    await session.prompt(iterationPrompt);
  } catch (e: any) {
    log(`[ERROR] Iteration ${i} failed: ${e.message}`);
    // Continue to next iteration
  }

  // Push results
  log(`Pushing iteration ${i} results...`);
  gitSync("after", i);

  // Pause between iterations
  if (i < iterations && !shuttingDown) {
    const pauseMs = agentType === "orchestrator" ? 15000 : 30000;
    log(`Pausing ${pauseMs / 1000}s before next iteration...`);
    await new Promise((r) => setTimeout(r, pauseMs));
  }
}

log("=".repeat(60));
log(`Agent ${agentId} completed ${iterations} iterations`);
log("=".repeat(60));
