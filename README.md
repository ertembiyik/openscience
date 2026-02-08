# Cancer Treatment Research

A software engineer and an AI are trying to help cure cancer.

Yes, we know how that sounds. We're delusionally optimistic. We're doing it anyway.

## What This Is

This is an open research project focused on **neoantigen immunogenicity prediction** -- the computational bottleneck in personalized mRNA cancer vaccines.

Right now, Moderna and BioNTech are running Phase III clinical trials for personalized cancer vaccines. The process: sequence a patient's tumor, find mutations, predict which mutations the immune system can attack, manufacture a custom mRNA vaccine. The weakest link is the prediction step. Current algorithms achieve ~70-80% accuracy for binding prediction and significantly worse for immunogenicity (whether a mutation actually triggers a T-cell to kill cancer). Better prediction = more patients respond to treatment.

We think better algorithms can be built. We're building them.

## Who We Are

**Ertem** -- Software engineer. Builds infrastructure, runs code, manages compute, connects with researchers. Beginner at biology, learning as we go.

**Claude** (Opus) -- AI co-researcher. PhD-level biology reasoning, literature review, bioinformatics pipelines, ML model development. Runs autonomously on research tasks 24/7. Never guesses on biology -- flags uncertainty and names who to ask.

We don't have a wet lab. We don't have PhDs. What we have: a software engineer who can build and deploy anything, an AI that can read and reason about biology at scale, access to every public cancer genomics dataset, open-source tools to build on, and the ability to run compute around the clock.

## What We're Doing

**Goal**: Beat state-of-the-art immunogenicity prediction accuracy on the [TESLA benchmark](https://www.nature.com/articles/s41587-019-0302-x). If we do that, researchers worldwide can use it to make better cancer vaccines.

**How**:
1. Synthesize the global research landscape -- who's doing what, where the gaps are
2. Build improved ML models for neoantigen immunogenicity prediction (transformers, protein language models, graph NNs)
3. Train on public data (IEDB, TESLA, TCGA) and benchmark against existing tools (MHCflurry, NetMHCpan, pVACtools)
4. Open-source everything immediately

## The Science in 30 Seconds

Moderna/Merck's melanoma vaccine showed **49% reduction in cancer recurrence** at 5 years. BioNTech's pancreatic cancer trial: **50% of patients responded**. The other 50% didn't -- likely because the wrong neoantigens were selected. The computational problem: given a patient's tumor mutations and immune profile, predict which mutations will actually trigger an immune response. Current tools are mediocre at this. We're trying to make them better.

## Daily Progress

Claude works autonomously and logs progress. Each entry links to a full report.

| Date | Summary | Report |
|------|---------|--------|
| 2026-02-08 | Full sprint: environment + data + baselines (0.212 AUPRC) + literature review (8 papers) + novel features + IEDB transfer. CPU-only ML exhausted; GPU needed for next breakthrough. | [Full report](updates/2026-02-08.md) |

## Research

- [00 - Synthesis & Computational Leverage](research/00-synthesis-and-computational-leverage.md) -- 4 global breakthrough tracks ranked by computational leverage
- [01 - Baseline Results](research/01-baseline-results.md) -- MHCflurry and feature baselines on TESLA (best: 0.759 AUC-ROC, 0.188 AUPRC)
- [02 - Error Analysis & Multi-Feature](research/02-error-analysis-and-multifeature.md) -- Where MHCflurry fails + RF/LR combining all features (best: 0.212 AUPRC)
- [03 - Literature Review](research/03-literature-review.md) -- 8 papers (2022-2026), NeoaPred leads at 0.54 AUPRC with structural approach
- [04 - Novel Features & Transfer Learning](research/04-novel-features-and-transfer-learning.md) -- 27 position-aware features + IEDB transfer (CPU work exhausted)
- [European mRNA Vaccine Trials](research/european-mrna-cancer-vaccine-trials.txt) -- Ongoing Phase II/III trials brief
- [RL Environment Design](docs/rl-environment-design.md) -- Structured exploratory search (Stanford CRFM-inspired)

## Can We Actually Help?

Maybe. The problem is clearly defined and measurable. Public datasets exist. Open-source baselines exist. Multiple clinical trials are running right now that need better prediction algorithms. This can be done purely computationally.

We'd rather try and fail than not try.

## Get Involved

If you're a researcher, oncologist, immunologist, computational biologist, or just someone who wants to help -- open an issue or reach out. We need domain expertise more than anything.

---

*This project contributes to cancer research through computational methods. We are not medical professionals. Any findings or tools must be validated by qualified researchers before clinical application.*
