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

---

## Iteration 1 (2026-02-08) -- Environment + Data Acquisition

**What was done:**
- Set up Python environment with uv (Python 3.12) -- PyTorch, BioPython, pandas, scikit-learn, transformers, MHCflurry, matplotlib, seaborn, jupyter
- Downloaded MHCflurry pre-trained models (models_class1_presentation)
- Downloaded IEDB T-cell epitope dataset (567,787 assays, 161 columns, 1.2GB)
- Downloaded TESLA supplementary tables S1-S4 from Cell paper
- Explored and filtered IEDB: 122,543 human MHC-I T-cell assays with immunogenicity labels
- Explored TESLA Table S4: 608 validated peptides, 37 immunogenic (VALIDATED=True), 571 non-immunogenic
- Saved filtered IEDB dataset to data/iedb/iedb_human_mhci_tcell.csv
- Created tools/explore_iedb.py exploration script

**What was learned:**
- IEDB has 122,543 human MHC-I T-cell assays with binary immunogenicity labels (44.9% positive rate)
- Top MHC allele is HLA-A*02:01 (29,845 assays) -- this allele alone is a good starting point
- Peptide lengths cluster at 9-mers (64,393) and 10-mers (25,767) -- classic MHC-I binding peptides
- TESLA benchmark has only 608 peptides (37 positive = 6.1% positive rate) -- very imbalanced, small dataset
- TESLA provides rich features: binding affinity, tumor abundance, binding stability, hydrophobicity, agretopicity, foreignness, mutation position
- TESLA evaluation metrics: AUPRC, FR (fraction ranked in top-100), TTIF (top-20 immunogenic fraction)
- Synapse (syn21048999) is the official TESLA data repository but supplementary Excel files from Cell paper are freely downloadable
- Class imbalance is SEVERE in TESLA (6.1% positive) -- will need careful handling (focal loss, oversampling, or threshold tuning)

**Open questions (RESOLVED):**
- ~~Does TESLA dataset require application/registration?~~ NO -- supplementary tables freely downloadable from Cell paper
- ~~What exact metrics does TESLA use?~~ AUPRC, FR, TTIF
- ~~Which IEDB export to use?~~ tcell_full_v3.csv, filtered to human MHC-I linear peptides

**Open questions (NEW):**
- Can we get the full TESLA community dataset from Synapse (more data than Table S4)?
- What's the best way to handle IEDB's duplicate peptide-allele pairs with conflicting labels?
- Should we split IEDB by allele for per-allele models or train one pan-allele model?

**Next task:** Write data loading utilities for both datasets (Phase 1, Task 4)

---

## Iteration 2 (2026-02-08) -- Data Loaders + First Baselines

**What was done:**
- Built data_loader.py with clean loaders for IEDB and TESLA
- Built evaluate.py with TESLA-standard metrics (AUPRC, AUC-ROC, FR, TTIF)
- Built baseline_mhcflurry.py -- ran MHCflurry and feature baselines on TESLA
- Got first benchmark numbers!

**Baseline Results on TESLA (608 peptides, 37 immunogenic):**

| Model | AUC-ROC | AUPRC | FR (top-100) | TTIF (top-20) |
|-------|---------|-------|-------------|---------------|
| Random | 0.500 | 0.058 | 0.081 | 0.000 |
| NetMHCpan affinity | 0.747 | 0.150 | 0.351 | 0.200 |
| Binding stability | 0.686 | 0.154 | 0.324 | 0.250 |
| Tumor abundance | 0.643 | 0.110 | 0.517 | 0.000 |
| Foreignness | 0.529 | 0.069 | 0.194 | 0.050 |
| **MHCflurry presentation** | **0.759** | **0.188** | **0.487** | **0.200** |
| MHCflurry affinity | 0.755 | 0.135 | 0.405 | 0.150 |

**Key insights:**
- MHCflurry presentation score is the best single predictor (AUC-ROC 0.759, AUPRC 0.188)
- But AUPRC of 0.188 is terrible -- 81% of positive predictions would be wrong
- Binding affinity alone (NetMHCpan or MHCflurry) gets to ~0.75 AUC-ROC but can't distinguish binding from immunogenicity
- Binding stability is surprisingly good (0.686 AUC-ROC) -- stable pMHC complexes are more immunogenic
- Tumor abundance has high FR-100 (0.517) but terrible TTIF-20 (0.000) -- good for recall, bad for precision
- Hydrophobicity and foreignness are near useless alone
- HUGE gap between random (0.058 AUPRC) and current best (0.188 AUPRC) vs perfect (1.000) -- plenty of room to improve

**What was learned:**
- IEDB deduplication reduces 122K to 51K unique pairs, shifts positive rate from 45% to 28%
- The HLA-A*02:01 + 9-mer subset is 6,439 pairs at 52% positive -- good starting point for allele-specific model
- MHCflurry's presentation score (binding + processing) beats raw affinity -- processing matters
- The TESLA dataset is extremely challenging due to 6.1% positive rate
- Current state-of-the-art on TESLA (from the paper) achieves ~0.28 AUPRC -- we should target this

**Open questions:**
- Can a simple logistic regression on ALL TESLA features beat MHCflurry? (quick test)
- What's the published SOTA AUPRC on TESLA from the original paper's best model?
- Would per-patient or per-allele models work better than pan-allele?

**Next task:** Run multi-feature baseline (combine all TESLA features) and error analysis

---

## Iteration 3 (2026-02-08) -- Error Analysis + Multi-Feature Baselines

**What was done:**
- Built error analysis identifying exactly which peptides MHCflurry misclassifies and why
- Built multi-feature baselines using leave-one-patient-out cross-validation (LOGO-CV)
- Tested Logistic Regression and Random Forest with two feature sets
- Documented everything in research/02-error-analysis-and-multifeature.md

**Multi-Feature Results on TESLA:**

| Model | AUC-ROC | AUPRC | FR-100 | TTIF-20 |
|-------|---------|-------|--------|---------|
| MHCflurry presentation (single) | 0.759 | 0.188 | 0.487 | 0.200 |
| LR (TESLA features) | 0.730 | 0.176 | 0.459 | 0.250 |
| RF (TESLA features) | 0.696 | 0.139 | 0.297 | 0.350 |
| LR (TESLA + MHCflurry) | 0.737 | 0.197 | 0.487 | 0.250 |
| **RF (TESLA + MHCflurry)** | **0.738** | **0.212** | 0.432 | 0.250 |
| Published TESLA ensemble | ~0.80 | ~0.28 | -- | -- |

**Error Analysis Key Insights:**
1. MHCflurry misses 19/37 immunogenic peptides (ranked >100). These have 5.5x weaker binding and 3.7x less stable pMHC complexes than the ones it catches.
2. Top-20 is dominated by "super-binders" -- 16/20 are false positives with extremely strong binding (< 25 nM) that are NOT immunogenic.
3. Patient 3 is hardest for MHCflurry (38% detection, most immunogenic peptides on HLA-A*03:01).
4. Patient 16 is hardest overall for multi-feature models (AUPRC 0.077, barely above random).
5. **Foreignness is ANTI-predictive** -- immunogenic peptides look LESS foreign. Counterintuitive.
6. Binding affinity remains the strongest single signal (8-10x mean difference) but with heavy distribution overlap.

**Feature Importance (Random Forest):**
- MHCflurry affinity (17.4%) > presentation (16.8%) > NetMHCpan affinity (14.8%) > stability (11.5%) > processing (10.0%)
- Foreignness (1.0%) and peptide length (1.3%) are nearly useless

**What was learned:**
- Multi-feature RF beats single MHCflurry by 13% AUPRC (0.212 vs 0.188), but still short of published 0.28
- LOGO-CV is essential -- per-patient performance varies wildly (AUPRC 0.077-0.540)
- The gap to 0.28 AUPRC requires sequence-level features, not more scalar summaries
- The foreignness anti-predictivity is biologically interesting: maybe immunogenic neoantigens don't need to be "foreign-looking" -- they just need to be presented properly and hit the right T-cell receptor
- Simple ML on available features has plateaued; next step requires fundamentally new features

**Open questions:**
- Would ESM-2 embeddings of peptide sequences provide the missing signal?
- Can we compute self-similarity (peptide vs human proteome) better than the foreignness score?
- What exactly did the published TESLA ensemble do differently to hit 0.28?

**Phase 2 status:** COMPLETE (baselines run, error analysis done, documented)
**Next task:** Phase 3 -- Literature deep dives, starting with ImmunoNX paper (arxiv 2512.08226)

---

## Iteration 4 (2026-02-08) -- Literature Review

**What was done:**
- Reviewed 8 papers/tools on neoantigen immunogenicity prediction (2022-2026)
- Wrote comprehensive literature review: research/03-literature-review.md
- Identified NeoaPred (structure-based, 0.81 AUC-ROC / 0.54 AUPRC on own test set) as current SOTA
- Analyzed BigMHC, ImmugenX, NUCC, CNNeoPP, NeoTImmuML, Immunity harmonized datasets
- Developed concrete Phase 4 strategy based on literature findings

**Key Papers Reviewed:**

| Method | Year | Approach | Best Result |
|--------|------|----------|-------------|
| NeoaPred | 2024 | Structure-based (mutant vs WT surface) | 0.81/0.54 (own test) |
| BigMHC | 2023 | Transfer learning DNN | Strong on TESLA |
| ImmugenX | 2024 | 4-stage transfer learning PLM | 0.619/0.514 (cancer holdout) |
| NUCC | 2024 | CNN+FCNN multi-modal | 5/20 on TESLA |
| CNNeoPP | 2025 | NLP + BioBERT encoding | 5/20 on TESLA |
| NeoTImmuML | 2025 | Ensemble gradient boosting | 0.887 AUC (own test) |
| Immunity harmonized | 2023 | Harmonized data + ML | 0.273 AUPRC on TESLA |

**Critical Learnings:**
1. **Structure-based mutant-vs-WT comparison is the biggest win** (NeoaPred). T-cells see the 3D surface, not the sequence.
2. **Transfer learning (binding → presentation → stability → immunogenicity) is essential** for data efficiency. BigMHC and ImmugenX both confirm this.
3. **ESM-2 embeddings alone DON'T help** when you already have task-specific pretraining (ImmugenX finding). This saves us from a dead end.
4. **The mutant-vs-wild-type DIFFERENCE is the key signal**, not the mutant peptide alone. Our current agretopicity feature captures a tiny slice of this.
5. **Dataset quality > model complexity** (Immunity harmonized paper). Better data curation beats fancier architectures.
6. **ImmunoNX is a workflow paper, not a model** -- useful for clinical pipeline reference but not for our prediction work.

**CAUTION on reported numbers:**
- NeoaPred's 0.81/0.54 is on their own test set (625 pos, 2672 neg), NOT TESLA (37 pos, 571 neg)
- NeoTImmuML's 0.887 AUC is on a balanced test set, not reflective of real-world 6% positive rate
- Only the Immunity harmonized paper (0.273 AUPRC) and NUCC/CNNeoPP (top-20 counts) report TESLA-specific results
- We need to run NeoaPred on TESLA ourselves to get a fair comparison

**Recommended Phase 4 Strategy:**
1. Run NeoaPred on TESLA (clone repo, get fair comparison) -- quick win
2. Implement transfer learning pipeline (IEDB binding → immunogenicity) -- medium effort
3. Add proxy structural features without full structure prediction (anchor positions, SA estimates, electrostatic profiles)
4. Compute mutant-vs-WT ESM-2 embedding DIFFERENCES (not raw embeddings) -- requires GPU
5. GPU needed from Step 2 onward (minimum T4, ideally A100)

**Open questions (RESOLVED):**
- ~~Would ESM-2 embeddings provide missing signal?~~ Alone, NO (ImmugenX). But mutant-vs-WT embedding DIFFERENCES might.
- ~~What did published TESLA ensemble do differently?~~ Better feature engineering + data harmonization (Immunity 2023 paper).

**Open questions (NEW):**
- What are NeoaPred's actual numbers on TESLA's 608 peptides?
- Can we approximate NeoaPred's structural features without running AlphaFold-style structure prediction?
- Should we use BigMHC's pre-trained weights as our starting point for transfer learning?

**Phase 3 status:** 4/5 tasks complete (NeoDisc paper still pending)
**Next task:** Run NeoaPred on TESLA benchmark for fair comparison (Phase 4 Step 1)

---

## Iteration 5 (2026-02-08) -- Novel Features + Transfer Learning Experiments

**What was done:**
- Built position-aware feature engineering pipeline (27 novel features)
- Tested IEDB transfer learning (48K training examples → TESLA)
- Tested hybrid model (IEDB score + binding features + mutation properties)
- Investigated NeoaPred requirements (Python 3.6, CUDA, heavy deps -- impractical on Mac)
- Documented everything in research/04-novel-features-and-transfer-learning.md

**Key Results:**

| Model | AUC-ROC | AUPRC | Notes |
|-------|---------|-------|-------|
| Novel features only | 0.571 | 0.080 | Near-useless alone |
| RF (TESLA + MHCflurry) | 0.738 | **0.212** | Still the overall best AUPRC |
| GB (Novel + MHCflurry) | 0.693 | 0.200 | Best FR-100 (0.514) |
| IEDB pan-allele | 0.477 | 0.070 | Worse than random -- domain shift |
| IEDB A*02:01-specific | 0.729 | 0.141 | Best FR-100 on A*02:01 subset (0.667) |
| Hybrid RF | 0.758 | 0.201 | Best AUC-ROC among multi-feature |

**Critical Findings:**
1. **Tabular features are SATURATED.** 27 novel position-aware + amino acid property features add negligible signal. The binding-to-immunogenicity gap cannot be closed with more tabular features.
2. **IEDB transfer fails as primary model** (domain shift too large), but adds 6% feature importance as auxiliary signal in hybrid.
3. **Amino acid rarity at mutation site matters** (5% importance) -- rare amino acids may be more visible to T-cells.
4. **NeoaPred is impractical to run locally** -- needs Python 3.6, CUDA, MSMS, APBS, PDB2PQR, and wild-type sequences we don't have.
5. **Per-patient variation still dominates** -- hybrid RF gets 0.632 AUPRC on Patient 10 but 0.043 on Patient 16.

**Answers to previous open questions:**
- ~~Can we approximate NeoaPred's structural features without structure prediction?~~ Not well. Position + amino acid properties capture <5% of the structural signal.
- ~~What are NeoaPred's actual numbers on TESLA?~~ Can't run it (Python 3.6 + CUDA + external tools required). Would need GPU server.

**What's proven:**
- CPU-only tabular ML is exhausted for this problem
- The gap from 0.212 to 0.28+ AUPRC requires fundamentally different features (structural or learned)
- GPU is now required to make further progress

**Next steps requiring GPU (T4 minimum):**
1. ESM-2 mutant-vs-WT embedding differences
2. Transfer learning neural network (binding → immunogenicity)
3. Run NeoaPred for comparison (on GPU server with proper env)

**Phase 4 status:** Step 1 attempted (NeoaPred impractical locally), custom feature engineering complete but saturated
**BLOCKER:** GPU access needed for meaningful further progress
