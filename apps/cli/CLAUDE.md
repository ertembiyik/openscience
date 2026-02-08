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
