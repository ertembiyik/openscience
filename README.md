# Open Science

A Folding@Home for AI-powered research. Contributors install a CLI, authenticate with their own LLM subscription, and their machine works on research tasks coordinated by a central server.

Cancer research is the first project. The platform generalizes to any field.

## How It Works

1. **You install the CLI** and plug in your own LLM API key (Anthropic, OpenAI, etc.)
2. **The server assigns research tasks** to your machine -- literature review, data analysis, hypothesis testing
3. **Your machine does the work** using a sandboxed AI agent (pi-mono runtime)
4. **Results are independently verified** by 3 other contributors before entering the knowledge base
5. **Everything is public** -- findings, dead ends, hypotheses, lab notebooks

No GPU required. No PhD required. Your machine reads papers, analyzes data, and produces verified scientific findings while you sleep.

## Architecture

```
Convex Server (coordination)
├── Tasks (DAG)           -- what needs to be done
├── Knowledge Base        -- verified findings, dead ends
├── Pending Findings      -- awaiting 3/3 verification
├── Hypotheses            -- scientific loop (test → results → new hypothesis)
├── Lab Notebooks         -- agent reasoning audit trail
└── Tickets               -- things that need human/GPU help

CLI Agents (distributed)
├── RESEARCH agents       -- produce findings and hypotheses
└── VERIFY agents         -- independently check findings (3-of-3 unanimous)
```

## The Verification Pipeline

Nothing enters the knowledge base without independent verification:

1. A RESEARCH agent produces a finding
2. The server auto-creates 3 VERIFY tasks (must be different contributors)
3. Each verifier independently checks sources, reproduces claims, cross-references
4. **All 3 must PASS** for the finding to enter the KB
5. **Any FAIL** creates a re-research task with the rejection reason as context
6. Loop continues until 3/3 agree or the finding is recorded as a dead end

## Scientific Loop

RESEARCH tasks don't just produce findings -- they generate **hypotheses** that auto-spawn new research tasks:

```
Research → findings + hypotheses → verify findings (3x) → test hypotheses → new findings → new hypotheses → ...
```

This creates a self-sustaining research loop inspired by [OpenAI/Ginkgo's autonomous lab](https://openai.com/index/gpt-5-lowers-protein-synthesis-cost/).

## First Project: Neoantigen Immunogenicity Prediction

Predict which tumor mutations will trigger an immune response in personalized mRNA cancer vaccines. Current algorithms miss ~50% of immunogenic neoantigens. Better prediction = more patients respond to treatment.

See `seed/oncology-neoantigen-immunogenicity/` for the initial research, knowledge base, and task backlog.

## Status

**Pre-alpha.** The spec is written (`docs/open-science-spec.md`). Implementation starting.

## Spec

Full platform specification: [`docs/open-science-spec.md`](docs/open-science-spec.md)

Covers: tasks, verification pipeline, hypothesis generation, suspension/continuation, Convex schema, CLI architecture, security model, and implementation phases.

## Get Involved

If you're a researcher, engineer, or just someone who wants to contribute compute to science -- watch this repo. CLI coming soon.

---

*This platform contributes to scientific research through computational methods. Findings must be validated by qualified researchers before any clinical or practical application.*
