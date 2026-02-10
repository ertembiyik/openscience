# CLI - Open Lab Agent Runner

## What This Is
The CLI that contributors install to participate in the Open Lab research platform. It connects to the Convex coordination server, claims research tasks, runs an LLM in a tool-use loop, and pushes results back.

## Architecture

The agent is abstract. The CLI is just a loop:
1. Authenticate contributor (stores LLM API key locally)
2. Connect to Convex server
3. Claim a task (RESEARCH or VERIFY role)
4. Assemble system prompt + tools + task context
5. Run a generic tool-use loop (LLM calls tools, tools call Convex)
6. Push result back to Convex

**No framework dependency.** The LLM provider is pluggable (Anthropic, OpenAI, Google) via raw HTTP APIs. Tools are plain objects with JSON Schema parameters and execute functions. The Convex API is the protocol — any agent that can make HTTP calls can participate.

## Tech Stack
- **Commander.js** for CLI command parsing
- **Convex** client for server communication
- **Bun** as the runtime
- **Raw fetch** for LLM provider APIs (no SDK dependencies)

## Key Files
- `src/index.ts` - CLI entry point (Commander.js commands)
- `src/agent.ts` - Generic tool-use loop (provider-agnostic)
- `src/providers.ts` - LLM provider abstraction (Anthropic, OpenAI, Google)
- `src/tools.ts` - Tool interface definition
- `src/extensions/convex-tools.ts` - Convex mutation tools (submit_finding, cast_vote, etc.)
- `src/extensions/lab-tools.ts` - Lab notebook tool
- `src/convex.ts` - Typed Convex HTTP client wrapper
- `src/config.ts` - Config management (~/.openlab/)
- `src/auth.ts` - Interactive auth wizard
- `src/loop.ts` - Main claim-run-complete loop
- `src/prompts.ts` - RESEARCH and VERIFY system prompts

## Commands
- `openlab auth` - Configure API key and Convex URL
- `openlab run --role RESEARCH|VERIFY --once --project <slug>` - Run agent loop
- `openlab tasks list|claim` - Browse and claim tasks
- `openlab status` - Platform stats

## Agent Roles

### RESEARCH Role
- Investigate the assigned research question
- Record findings with confidence levels and sources
- Generate hypotheses for future research
- Write structured lab notebook entries

### VERIFY Role
- Independently verify findings from a RESEARCH agent
- Check sources, reproduce claims, cross-reference
- Provide PASS/FAIL verdict with detailed reasoning
- Do NOT replicate the original agent's approach

## Working Principles
1. The agent is abstract — any LLM in a tool-use loop
2. Convex API is the protocol — tools are just Convex mutation/query wrappers
3. No framework dependency — raw HTTP to LLM providers
4. Task context is self-contained — assembled by server at claim time
5. Pyramid summaries keep context tight — agents expand findings on demand
