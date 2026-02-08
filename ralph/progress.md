# Ralph Loop Progress Log

This file is updated by the autonomous research agent after each iteration.
Read this FIRST to understand what has already been done.

---

## Iteration 0 (2026-02-08) -- Manual Setup

**What was done:**
- Project initialized with CLAUDE.md, research synthesis, European trials brief
- Identified neoantigen immunogenicity prediction as primary computational focus
- Cataloged 9 open-source tools and 5 public datasets
- Created ralph loop infrastructure

**What was learned:**
- The TESLA benchmark is the gold standard for evaluating neoantigen prediction
- IEDB (Immune Epitope Database) has the largest collection of experimentally validated immune epitopes
- Current tools achieve ~70-80% for binding prediction, much worse for immunogenicity
- ESM-2 protein language model embeddings could be a strong feature for immunogenicity prediction

**Open questions:**
- Does TESLA dataset require application/registration or is it publicly downloadable?
- What exact metrics does TESLA use for evaluation? (need to read the paper)
- Which version of IEDB export to use (full vs filtered)?

**Next task:** Set up Python bioinformatics environment (Phase 1, Task 1)
