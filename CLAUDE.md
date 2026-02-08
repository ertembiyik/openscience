# Open Science Platform

## What This Is

A distributed research platform where contributors install a CLI, authenticate with their own LLM API key, and their machine works on research tasks coordinated by a Convex server. Like Folding@Home but for AI-powered research.

Cancer research (neoantigen immunogenicity prediction) is the first project. The platform generalizes to any field.

## Repo Structure

```
open-science/
├── CLAUDE.md                     # This file
├── README.md                     # Public-facing description
├── docs/
│   └── open-science-spec.md      # Full platform spec (THE KEY FILE)
├── seed/                         # First project seed data
│   └── oncology-neoantigen-immunogenicity/
│       ├── project.md            # Project metadata
│       ├── research/             # 11 literature reviews and analyses
│       ├── kb/                   # Knowledge base (findings, dead-ends, etc.)
│       ├── tasks/backlog.md      # 18 research tasks
│       ├── skills/               # 5 research workflow checklists
│       ├── tools/                # 7 Python scripts (baselines, evaluation)
│       └── docs/                 # Progress reports, design docs
└── .gitignore
```

## The Spec

**`docs/open-science-spec.md` is the source of truth.** Read it before making any implementation decisions. It covers:

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
- **Next.js** (planned) -- Public dashboard

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
