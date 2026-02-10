# Open Lab Platform

## What This Is

A distributed research platform where contributors install a CLI, authenticate with their own LLM API key, and their machine works on research tasks coordinated by a Convex server. Like Folding@Home but for AI-powered research.

Cancer research (neoantigen immunogenicity prediction) is the first project. The platform generalizes to any field.

## Repo Structure

Bun monorepo with Turbo Repo orchestration.

```
openlab/
├── package.json                  # Root (workspaces: apps/*, packages/*)
├── turbo.json                    # Turbo task config
├── tsconfig.json                 # Base TypeScript config
├── CLAUDE.md                     # This file
├── README.md                     # Public-facing description
├── docs/
│   └── openlab-spec.md      # Full platform spec (THE KEY FILE)
├── apps/
│   ├── cli/                      # Commander.js + Pi-mono agent runner
│   │   ├── CLAUDE.md             # CLI-specific instructions
│   │   ├── AGENTS.md             # Pi-mono agent instructions
│   │   └── src/index.ts          # CLI entry point
│   └── web/                      # Next.js public dashboard
│       ├── CLAUDE.md             # Web-specific instructions
│       ├── AGENTS.md             # Web dev instructions
│       └── src/app/              # App Router pages
├── packages/
│   └── convex/                   # Convex coordination server
│       ├── CLAUDE.md             # Convex-specific instructions
│       ├── AGENTS.md             # Backend dev instructions
│       ├── convex/schema.ts      # Database schema
│       └── src/index.ts          # Re-exports for other packages
└── seed/                         # First project seed data
    └── oncology-neoantigen-immunogenicity/
        ├── project.md            # Project metadata
        ├── research/             # 11 literature reviews and analyses
        ├── kb/                   # Knowledge base (findings, dead-ends, etc.)
        ├── tasks/backlog.md      # 18 research tasks
        ├── skills/               # 5 research workflow checklists
        ├── tools/                # 7 Python scripts (baselines, evaluation)
        └── docs/                 # Progress reports, design docs
```

## Monorepo

- **Package manager**: Bun (workspaces)
- **Orchestration**: Turbo Repo
- **Scope**: `@openlab/*`
- `bun dev` runs all apps in parallel via turbo
- `bun build` builds all packages in dependency order
- Each app/package has its own `CLAUDE.md` + `AGENTS.md`

## The Spec

**`docs/openlab-spec.md` is the source of truth.** Read it before making any implementation decisions. It covers:

- Architecture (Convex server + CLI agents + engagement bots)
- Self-contained tasks (role + context + saved state)
- 3-of-3 unanimous verification pipeline
- Hypothesis generation and scientific loop
- Lab notebooks (reasoning audit trail)
- Agent suspension/continuation (coroutine-style)
- Convex schema (tables, mutations, queries)
- CLI runtime architecture
- Security model and trust model
- Implementation phases

## Team

**Ertem** -- Software engineer and project lead. Builds infrastructure, manages resources, connects with researchers.

**Claude** -- AI co-developer. Implements the platform, writes the Convex backend, CLI agent, and dashboard.

## Tech Stack

- **Convex** -- Real-time backend (coordination server)
- **Pi-mono** (`@mariozechner/pi-coding-agent`) -- Agent runtime for CLI
- **Bun** -- Runtime for CLI and tooling
- **TypeScript** -- Everything
- **Next.js** -- Public dashboard (App Router + Tailwind)
- **Turbo Repo** -- Monorepo orchestration
- **Commander.js** -- CLI command parsing

## Key Concepts

### Two Agent Roles
- **RESEARCH**: Produces findings and hypotheses
- **VERIFY**: Independently checks findings (3-of-3 unanimous required)

### Self-Contained Tasks
Tasks carry everything: role, context (assembled by server at claim time), and saved state (for suspension/resumption). Any agent can pick up any task.

### Verification Pipeline
Nothing enters the knowledge base without 3 independent verifiers agreeing. Any rejection creates a re-research task with context about what was wrong.

### Scientific Loop
RESEARCH tasks produce hypotheses that auto-spawn test tasks. Results feed back as context for new hypotheses. Self-sustaining research loop.

### Suspension/Continuation
Agents can create tickets (need GPU, need scientist answer, need data) and suspend. Session frozen to Convex file storage. Any contributor can resume later.

## Implementation Phases

1. **Phase 1 (MVP)**: Convex backend, CLI agent, verification pipeline, hypothesis generation, seed cancer project
2. **Phase 2**: Suspension/continuation, session freezing/restoring
3. **Phase 3**: Public dashboard, problem suggestions from scientists
4. **Phase 4**: Scientist network (Telegram/Discord bots)
5. **Phase 5**: GPU contributor network

## Working Principles

1. **The spec is the plan** -- implement what's in the spec, propose changes before deviating
2. **Self-contained tasks** -- every task carries its own context, no external lookups
3. **Trust the verification pipeline** -- the 3-of-3 system catches errors, don't try to prevent all errors upfront
4. **Open by default** -- all data is public, API keys stay local
5. **Build incrementally** -- Phase 1 first, iterate from there

## Seed Data

`seed/oncology-neoantigen-immunogenicity/` contains the first project's initial data, accumulated from a research sprint in Feb 2026. This will be imported into Convex as the first project when Phase 1 is built.
