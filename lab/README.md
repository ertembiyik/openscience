# Research Lab

Autonomous multi-agent research lab for cancer treatment research.

## Quick Start

```bash
# Install dependencies (one time)
cd lab && bun install

# Run an agent
bun run lab/run-agent.ts <agent-type> <agent-id> [iterations]

# Examples
bun run lab/run-agent.ts researcher researcher-1 10
bun run lab/run-agent.ts builder builder-1 20
bun run lab/run-agent.ts orchestrator orchestrator-1 50
bun run lab/run-agent.ts reviewer reviewer-1 5
```

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ ORCHESTRATOR │     │  RESEARCHER  │     │   BUILDER    │
│              │     │              │     │              │
│ assigns tasks│     │ reads papers │     │ writes code  │
│ detects drift│     │ evals tools  │     │ runs exps    │
│ escalates    │     │ writes KB    │     │ records data │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       ▼                    ▼                    ▼
┌────────────────────────────────────────────────────────┐
│              Shared State (git main)                    │
│                                                        │
│  lab/kb/        Knowledge base (append-only)           │
│  lab/tasks/     Task queue (backlog → active → done)   │
│  lab/jobs-for-ertem.md    Human escalation              │
│  research/      Research documents                      │
│  tools/         Code artifacts                          │
└──────────────────────────┬─────────────────────────────┘
                           │
                    ┌──────▼───────┐
                    │   REVIEWER   │
                    │              │
                    │ validates    │
                    │ catches drift│
                    │ reviews code │
                    └──────────────┘
```

## Agent Types

| Agent | Does | Writes To |
|-------|------|-----------|
| **orchestrator** | Assigns tasks, detects drift, escalates | lab/tasks/, lab/jobs-for-ertem.md |
| **researcher** | Reads papers, evaluates tools | research/, lab/kb/ |
| **builder** | Writes code, runs experiments | tools/, data/, lab/kb/ |
| **reviewer** | Validates claims, reviews code | lab/reviews/ |

## Engine: Pi-mono

Uses [@mariozechner/pi-coding-agent](https://github.com/badlogic/pi-mono) as the runtime:
- **Persistent sessions**: Agent remembers everything across iterations
- **Auto-compaction**: When context grows large, older content is summarized
- **Custom tools**: Bioinformatics extensions (IEDB, PubMed search)
- **Resumable**: If process crashes, `SessionManager.continueRecent()` picks up

## Knowledge Base (`lab/kb/`)

| File | Contents |
|------|----------|
| `findings.md` | Validated facts with confidence tags (HIGH/MEDIUM/LOW) |
| `dead-ends.md` | What didn't work and why (prevents repeated mistakes) |
| `open-questions.md` | Questions needing answers |
| `tools-evaluated.md` | Tool evaluations (USE/SKIP/DEFER) |
| `datasets-evaluated.md` | Dataset evaluations |

## Skills (`lab/skills/`)

Step-by-step workflows agents follow for common tasks:
- `literature-review.md` -- How to review a paper
- `tool-evaluation.md` -- How to evaluate a tool
- `reproduce-baseline.md` -- How to reproduce published results
- `run-experiment.md` -- How to run and record an experiment
- `neoantigen-prediction.md` -- Domain reference for Shot 1

## Running Multiple Agents in Parallel

```bash
# Terminal 1
bun run lab/run-agent.ts orchestrator orchestrator-1 50

# Terminal 2
bun run lab/run-agent.ts researcher researcher-1 20

# Terminal 3
bun run lab/run-agent.ts builder builder-1 20

# Terminal 4 (less frequent)
bun run lab/run-agent.ts reviewer reviewer-1 5
```

Agents sync via git (pull before, push after each iteration).

## For Ertem

Check `lab/jobs-for-ertem.md` daily. Agents create jobs there when they need:
- **COMPUTE**: GPU access, cloud setup
- **DATA**: Dataset access, registration
- **EXPERT**: Researcher contact, paper clarification
- **DECISION**: Strategy pivots, priority changes

Process jobs by changing status to IN_PROGRESS → DONE and adding notes.
