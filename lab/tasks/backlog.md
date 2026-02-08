# Task Backlog

Unassigned tasks. The orchestrator assigns by moving to active.md.

---

## Phase 1: Environment & Data (P0)

### T-001: Set up Python bioinformatics environment
- **Shot**: 1 | **Type**: BUILD | **Priority**: P0
- **Skill**: (none)
- **Details**: Create requirements.txt with PyTorch, BioPython, pandas, scikit-learn, transformers, mhcflurry. Verify install.
- **Depends on**: none
- **Est. iterations**: 1
- **Done when**: `pip install -r requirements.txt` succeeds, all versions documented

### T-002: Download and profile IEDB dataset
- **Shot**: 1 | **Type**: BUILD | **Priority**: P0
- **Skill**: run-experiment
- **Details**: Download IEDB bulk export. Document structure, size, key fields, data quality. Focus on T-cell assays.
- **Depends on**: T-001
- **Est. iterations**: 2
- **Done when**: Data downloaded, EDA complete, class balance documented in kb/datasets-evaluated.md

### T-003: Investigate TESLA benchmark access
- **Shot**: 1 | **Type**: RESEARCH | **Priority**: P0
- **Skill**: literature-review
- **Details**: Find out how to access TESLA benchmark data. Read Wells et al. 2020 supplementary. Check if data is on GEO/SRA.
- **Depends on**: none
- **Est. iterations**: 1
- **Done when**: Access method documented. If registration needed, create JOB for Ertem.

### T-004: Write data loading utilities
- **Shot**: 1 | **Type**: BUILD | **Priority**: P0
- **Skill**: (none)
- **Details**: Python utilities for loading and preprocessing IEDB data. Filtering, normalization, train/test split.
- **Depends on**: T-002
- **Est. iterations**: 2
- **Done when**: tools/data/ has working loader, tested on downloaded data

### T-005: Exploratory data analysis
- **Shot**: 1 | **Type**: BUILD | **Priority**: P0
- **Skill**: run-experiment
- **Details**: EDA on IEDB: peptide length distribution, allele frequency, assay type breakdown, class balance.
- **Depends on**: T-004
- **Est. iterations**: 1
- **Done when**: EDA notebook/script in tools/, findings recorded in kb/findings.md

## Phase 2: Baselines (P0)

### T-006: Install and run MHCflurry baseline
- **Shot**: 1 | **Type**: BUILD | **Priority**: P0
- **Skill**: reproduce-baseline
- **Details**: Install MHCflurry, run on IEDB/TESLA data, record AUC and other metrics.
- **Depends on**: T-004
- **Est. iterations**: 2
- **Done when**: Baseline AUC recorded in kb/findings.md, evaluation script in tools/

### T-007: Install and run NetMHCpan baseline
- **Shot**: 1 | **Type**: BUILD | **Priority**: P0
- **Skill**: reproduce-baseline
- **Details**: Install NetMHCpan (or use web API), run on same data, record metrics.
- **Depends on**: T-004
- **Est. iterations**: 2
- **Done when**: Baseline AUC recorded in kb/findings.md

### T-008: Error analysis of baselines
- **Shot**: 1 | **Type**: RESEARCH | **Priority**: P0
- **Skill**: run-experiment
- **Details**: Analyze where MHCflurry and NetMHCpan fail. What types of peptides/alleles are hardest?
- **Depends on**: T-006, T-007
- **Est. iterations**: 2
- **Done when**: Error analysis document in research/, findings in kb/

### T-009: Write benchmark evaluation script
- **Shot**: 1 | **Type**: BUILD | **Priority**: P0
- **Skill**: (none)
- **Details**: Standardized evaluation: AUC-ROC, AUC-PR, precision, recall, F1. Works for any model.
- **Depends on**: T-006
- **Est. iterations**: 1
- **Done when**: tools/evaluate.py works and produces consistent metrics

## Phase 3: Literature Deep Dives (P1)

### T-010: Summarize NeoTImmuML paper
- **Shot**: 1 | **Type**: RESEARCH | **Priority**: P1
- **Skill**: literature-review
- **Details**: Find and summarize the NeoTImmuML paper. Architecture, features, training data, results, limitations.
- **Depends on**: none
- **Est. iterations**: 1
- **Done when**: Summary in research/, findings in kb/

### T-011: Summarize NeoDisc paper
- **Shot**: 1 | **Type**: RESEARCH | **Priority**: P1
- **Skill**: literature-review
- **Details**: NeoDisc (Nature Biotech 2024). What's new vs prior work? Key innovations.
- **Depends on**: none
- **Est. iterations**: 1
- **Done when**: Summary in research/, findings in kb/

### T-012: Research ESM-2 for feature extraction
- **Shot**: 1 | **Type**: RESEARCH | **Priority**: P1
- **Skill**: tool-evaluation
- **Details**: How do others use ESM-2 embeddings for immunogenicity? Which layer, which pooling?
- **Depends on**: none
- **Est. iterations**: 1
- **Done when**: Summary in research/, tool evaluation in kb/tools-evaluated.md

### T-013: Survey latest immunogenicity prediction (2024-2026)
- **Shot**: 1 | **Type**: RESEARCH | **Priority**: P1
- **Skill**: literature-review
- **Details**: Find and summarize the most recent papers on immunogenicity prediction. What features matter most?
- **Depends on**: none
- **Est. iterations**: 2
- **Done when**: Literature review in research/, comparative analysis

### T-014: Write comparative literature review
- **Shot**: 1 | **Type**: RESEARCH | **Priority**: P1
- **Skill**: literature-review
- **Details**: Synthesize T-010 through T-013 into a comparative analysis document.
- **Depends on**: T-010, T-011, T-012, T-013
- **Est. iterations**: 1
- **Done when**: research/literature-review-immunogenicity.md with comparison table

## Phase 4: Model Development (P1)

### T-015: Design improved immunogenicity predictor
- **Shot**: 1 | **Type**: RESEARCH | **Priority**: P1
- **Skill**: neoantigen-prediction
- **Details**: Based on literature review and error analysis, design architecture that integrates ALL signals.
- **Depends on**: T-008, T-014
- **Est. iterations**: 2
- **Done when**: Architecture design doc in docs/

### T-016: Implement feature extraction pipeline
- **Shot**: 1 | **Type**: BUILD | **Priority**: P1
- **Skill**: (none)
- **Details**: Extract features: sequence encoding, MHC binding scores, ESM-2 embeddings, expression levels.
- **Depends on**: T-015
- **Est. iterations**: 3
- **Done when**: tools/features/ with working extractors, tested on sample data

### T-017: Train baseline model
- **Shot**: 1 | **Type**: BUILD | **Priority**: P1
- **Skill**: run-experiment
- **Details**: Train first model on IEDB data using designed architecture.
- **Depends on**: T-016
- **Est. iterations**: 2
- **Done when**: Trained model, evaluation on test set, results in kb/findings.md

### T-018: Evaluate on TESLA benchmark
- **Shot**: 1 | **Type**: BUILD | **Priority**: P1
- **Skill**: run-experiment
- **Details**: Run our model on TESLA benchmark, compare to MHCflurry, NetMHCpan, NeoTImmuML.
- **Depends on**: T-017, T-003
- **Est. iterations**: 1
- **Done when**: TESLA AUC recorded, comparison table in research/
