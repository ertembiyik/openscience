# Task: Implement Open Science CLI Agent (Phase 1)

You are implementing the CLI that contributors install to run AI research agents. Work ONLY in `apps/cli/`.

## What Exists

- `src/index.ts` -- Commander.js skeleton with 4 commands (all TODOs)
- `package.json` with commander, pi-mono, convex, typebox deps
- `AGENTS.md` with architecture overview

## Source of Truth

Read `docs/open-science-spec.md` FIRST. The "CLI Agent" section (~line 479) defines the runtime architecture, agent loop, sandboxing, and suspend tool. Follow it closely.

## Architecture Overview

The CLI is a stateless generic agent runner. It:
1. Authenticates contributor (API key stored locally)
2. Connects to Convex
3. Claims tasks, runs pi-mono agents, pushes results back
4. The CLI knows NOTHING about cancer research -- all intelligence is in the task context

## Step 1: Project Config & Auth

Create `src/config.ts`:
- Config dir: `~/.open-science/`
- Auth file: `~/.open-science/auth.json` -- stores `{ provider, apiKey, convexUrl }`
- Workspace dir: `~/.open-science/workspace/` -- sandboxed agent workspace
- Sessions dir: `~/.open-science/sessions/` -- pi-mono session storage
- Functions: `loadConfig()`, `saveConfig()`, `ensureDirs()`

Create `src/auth.ts`:
- Interactive auth wizard (the `auth` command): prompt for LLM provider (Anthropic/OpenAI/Google), API key, Convex deployment URL
- Store in auth.json
- `getAuth()` -- load or error with "run `open-science auth` first"

## Step 2: Convex Client

Create `src/convex.ts`:
- Initialize ConvexClient with the URL from config
- Wrap key mutations/queries as typed functions:
  - `claimTask(contributorId)` -> self-contained task
  - `completeTask(taskId, result)`
  - `listTasks(projectId?)` -> available tasks
  - `getStatus()` -> dashboard stats
  - `registerContributor(name, provider)` -> contributorId
- Store contributorId in config after first registration
- Use `convex/browser` client (ConvexHttpClient for mutations, or ConvexClient for subscriptions)

## Step 3: Agent Runner

Create `src/agent.ts` -- the core of the CLI:

```typescript
import {
  createAgentSession,
  SessionManager,
  SettingsManager,
  DefaultResourceLoader,
} from "@mariozechner/pi-coding-agent";
```

Key function: `runTask(task, config)`:
1. Determine system prompt based on `task.type`:
   - RESEARCH: "You are a research agent. Investigate the assigned question. Record findings with confidence levels. Generate hypotheses for future research. Write lab notebook entries."
   - VERIFY: "You are a verification agent. Independently verify the finding below. Check sources, reproduce claims, cross-reference. Provide PASS or FAIL with detailed reasoning. Do NOT look at the original methodology."
2. Create pi-mono session:
   ```typescript
   const resourceLoader = new DefaultResourceLoader({
     extensionFactories: [
       createConvexTools(convexClient, task),
       createLabTools(convexClient, task),
     ],
   });
   await resourceLoader.reload();

   const { session } = await createAgentSession({
     resourceLoader,
     sessionManager: SessionManager.create(workspaceDir, sessionsDir),
     settingsManager: SettingsManager.inMemory({
       compaction: { enabled: true, keepRecentTokens: 40000 },
     }),
   });
   ```
3. Feed task context as the first prompt: `await session.prompt(JSON.stringify(task.context))`
4. Extract result from session output
5. Call `completeTask(task.id, result)`

## Step 4: Custom Pi-mono Extensions

Create `src/extensions/` directory:

### `src/extensions/convex-tools.ts`
A function that returns an extension factory `(pi: ExtensionAPI) => void`:

Tools to register:
- `submit_finding` -- params: { title, confidence (HIGH|MEDIUM|LOW), source, implications }. Calls convex submitFinding mutation. Returns confirmation.
- `record_dead_end` -- params: { what, whyFailed, lesson }. Calls convex recordDeadEnd. Returns confirmation.
- `submit_hypothesis` -- params: { statement, rationale, testPlan }. Calls convex submitHypothesis. Returns validation result.
- `cast_vote` -- params: { verdict (PASS|FAIL), notes }. Only available in VERIFY tasks. Calls convex castVerifyVote. Returns confirmation.
- `update_progress` -- params: { status, message }. Updates task status on server.

Use `@sinclair/typebox` Type.Object for parameter schemas. Use `StringEnum` from `@mariozechner/pi-ai` for enum parameters.

### `src/extensions/lab-tools.ts`
- `lab_notebook` -- params: { type (OBSERVATION|REASONING|HYPOTHESIS|RESULT|DECISION), content }. Calls convex appendLabNotebook. Returns confirmation.

## Step 5: Agent Loop

Create `src/loop.ts` -- the main agent loop (from spec ~line 501):

```
while (running):
  1. Check for resumable tasks (skip for Phase 1 -- just log if any exist)
  2. Claim a task from Convex
  3. If no task, sleep 30s and retry
  4. Run the task (call runTask from agent.ts)
  5. On completion, loop back to claim next task
  6. On error, mark task as FAILED with error message
```

Handle graceful shutdown on SIGINT/SIGTERM -- if an agent is running, let it finish the current iteration before exiting.

## Step 6: Wire Up Commands

Update `src/index.ts`:

- `open-science auth` -- run auth wizard (interactive prompts for provider, key, convex URL)
- `open-science run` -- start the agent loop. Options: `--role RESEARCH|VERIFY` (optional filter), `--once` (run one task then exit), `--project <slug>` (filter by project)
- `open-science tasks list` -- query Convex for available tasks, display as table
- `open-science tasks claim` -- claim one task and print its details (for debugging)
- `open-science status` -- query Convex dashboard, show stats (active tasks, findings count, contributors, etc.)

Use console.log for output. No fancy TUI needed for Phase 1.

## Step 7: System Prompts

Create `src/prompts.ts` with two system prompts:

RESEARCH_SYSTEM_PROMPT: Tell the agent it's a research agent for Open Science. It should:
- Investigate the research question in its context
- Use available tools to submit findings, record dead ends, write lab notebook entries
- Every claim needs confidence level and source
- Check dead-ends in context before starting
- Generate hypotheses when it discovers testable predictions
- Be thorough but concise

VERIFY_SYSTEM_PROMPT: Tell the agent it's a verification agent. It should:
- Independently verify the pending finding in its context
- Check the cited sources
- Cross-reference with other findings in context
- Cast a PASS or FAIL vote with detailed reasoning
- Do NOT replicate the original agent's approach -- verify independently
- When unsure, FAIL with explanation rather than guessing PASS

## Conventions

- Use Bun APIs where available (Bun.file, Bun.write, etc.)
- Use `console.log` / `console.error` for output
- Errors should be user-friendly ("Run `open-science auth` first" not stack traces)
- The agent workspace is sandboxed to ~/.open-science/workspace/
- pi-mono sessions go in ~/.open-science/sessions/{taskId}/

## Do NOT

- Do not touch anything outside `apps/cli/`
- Do not implement suspension/continuation (Phase 2) -- just skip resumable tasks with a log message
- Do not implement a TUI -- console output is fine
- Do not implement the Telegram/Discord bots
- Do not hardcode anything about cancer research -- the CLI is generic
