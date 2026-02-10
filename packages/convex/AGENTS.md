# Convex - Open Lab Coordination Server

## What This Is
The Convex backend that coordinates the entire Open Lab platform. Manages tasks, knowledge base, verification pipeline, hypotheses, and lab notebooks in real-time.

## Tech Stack
- **Convex** for real-time backend (queries, mutations, file storage)
- Shared between CLI agents and web dashboard

## Development
- `bun dev` runs `convex dev` for hot-reloading Convex functions
- Schema is in `convex/schema.ts`
- Functions go in `convex/*.ts`

## Schema Overview
- `projects` - Research projects (e.g., neoantigen immunogenicity)
- `tasks` - Research and verification tasks (DAG)
- `findings` - Knowledge base entries (pending → verified/rejected)
- `verifications` - 3-of-3 verification votes
- `hypotheses` - Scientific loop (proposed → testing → supported/refuted)
- `labNotebooks` - Agent reasoning audit trail
- `contributors` - Platform participants
- `tickets` - Human escalation (NEED_GPU, NEED_SCIENTIST, etc.)

## Architecture
All coordination happens through Convex:
- CLI agents call mutations to claim tasks, submit findings
- Web dashboard uses queries for real-time display
- File storage holds frozen agent sessions for suspension/continuation

## Key Patterns
- **Self-contained tasks**: Context assembled at claim time from KB + related findings
- **3-of-3 verification**: Each finding needs 3 independent PASS votes
- **Scientific loop**: Hypotheses auto-spawn test tasks
- **Suspension**: Frozen pi-mono sessions stored in Convex file storage

## Key Files
- `convex/schema.ts` - Database schema
- `convex/tasks.ts` - Task mutations/queries (TODO)
- `convex/findings.ts` - Finding submission and verification (TODO)
- `convex/hypotheses.ts` - Hypothesis management (TODO)
- `src/index.ts` - Re-exports for other packages
