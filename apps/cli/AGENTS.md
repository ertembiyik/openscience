# CLI - Open Science Agent Runner

## What This Is
The CLI that contributors install to participate in the Open Science research platform. It connects to the Convex coordination server, claims research tasks, and runs AI agents using pi-mono.

## Tech Stack
- **Commander.js** for CLI command parsing
- **Pi-mono** (`@mariozechner/pi-coding-agent`) for AI agent runtime
- **Convex** client for server communication
- **Bun** as the runtime

## Architecture
The CLI:
1. Authenticates contributor (stores LLM API key locally)
2. Connects to Convex server
3. Claims a task (RESEARCH or VERIFY role)
4. Assembles task context (from server)
5. Creates a pi-mono agent session with custom extensions
6. Runs the agent loop (iterations of prompt → work → commit)
7. Submits results back to Convex

## Key Files
- `src/index.ts` - CLI entry point (Commander.js commands)
- `src/agent.ts` - Pi-mono agent session setup (TODO)
- `src/extensions/` - Custom pi-mono tools (TODO)
  - `convex-sync.ts` - Submit findings, update tasks
  - `bioinformatics.ts` - IEDB, PubMed tools

## Pi-mono Integration
Uses the SDK mode of pi-mono:
- `createAgentSession()` with custom extensions
- `SessionManager.continueRecent()` for persistent sessions
- Custom tools registered via `DefaultResourceLoader.extensionFactories`
- Sessions stored as JSONL in `.sessions/`

## Commands
- `open-science run --role RESEARCH|VERIFY` - Run agent
- `open-science tasks list|claim` - Manage tasks
- `open-science auth` - Configure API key
- `open-science status` - Platform stats

## Agent Roles

### RESEARCH Role
- Investigate the assigned research question
- Use available tools (literature search, data analysis, bioinformatics)
- Record findings with confidence levels and sources
- Generate hypotheses for future research
- Write structured lab notebook entries

### VERIFY Role
- Independently verify findings from a RESEARCH agent
- Check sources, reproduce claims, cross-reference with known data
- Provide PASS/FAIL verdict with detailed reasoning
- Do NOT look at the original agent's methodology -- verify independently

## Agent Tools
- Standard file tools (read, write, edit, bash)
- `submit_finding` - Submit verified finding to knowledge base
- `record_dead_end` - Record what didn't work and why
- `update_task` - Update task status and progress
- `create_ticket` - Request human help or GPU access

## Working Principles
1. Every claim needs a confidence level (HIGH/MEDIUM/LOW) and source
2. Check dead-ends before starting -- don't repeat failed approaches
3. Record your reasoning in structured lab notebook format
4. When stuck, create a ticket instead of guessing
